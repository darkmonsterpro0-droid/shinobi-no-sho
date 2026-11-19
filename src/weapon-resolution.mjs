import {tokenDistance} from './saved-actions.mjs';
import {breakCommonBlockingWeapon} from './power-defense.mjs';
import {resolveOpposed,skillBase} from './build-rules.mjs';
import {mutateRuntime,runtimeState,periodKey} from './aptitude-runtime.mjs';
import {ID,SKILLS} from './config.mjs';
import {CONDITIONS} from './conditions.mjs';
import {sizeProfile,sizeAttackModifier,canBlockSize,sizeSweepAllowed} from './physical-rules.mjs';
import {applyPhysicalDamage} from './physical-actions.mjs';
import {statPrecision,saveCondition,conditionRecords} from './automation.mjs';
import {readFields} from './interactions.mjs';

export const WEAPON_RESOLUTION_ACTIONS=new Set(['weapon-resolve','weapon-confirm-hit','weapon-prepare-defense']);
const queues=new Map();
export function weaponResolutionView(env,h){
 const {field,select,button,esc}=h,a=env.weaponAttack,v=env.values??{},targets=env.targets??[],target=targets.find(t=>t.uuid===(v['resolve.targetUuid']??targets[0]?.uuid)),defense=v['resolve.defense']??'esquiva';
 if(!a)return '<p>Ataque não encontrado.</p>';
 const modifier=target?sizeAttackModifier(a.size??'medium',target.size??'medium',{defense}):0;
 return `<h3>${esc(a.name)}</h3><p>Resultado ${a.total}${modifier?` + ${modifier} por tamanho = ${a.total+modifier}`:''} · grau ${a.degree}${a.critical?' · crítico':''}.</p><input type="hidden" name="resolve.message" value="${esc(env.resolveMessage)}"><div class="sns-form-grid">${select('Alvo','resolve.targetUuid',v['resolve.targetUuid']??targets[0]?.uuid??'',Object.fromEntries(targets.map(t=>[t.uuid,t.name])))}${select('Defesa usada','resolve.defense',defense,{esquiva:'Esquiva',bloqueio:'Bloqueio',antecipar:'Antecipar',other:'Outra defesa'})}${a.plan.breakBlock?select('Arma usada no Bloqueio','resolve.blockingWeapon','',{'':'Escolha se houve Bloqueio',...Object.fromEntries((target?.weapons??[]).map(w=>[w.id,w.name]))}):''}</div><p>Confirme a defesa com o resultado acima. Dureza, camuflagem e absorção serão calculadas antes de alterar a vitalidade.</p>${a.plan.extendedBlade?button('Afiar: Espírito contra Prontidão','weapon-prepare-defense'):''}${button('Alvo defendeu','weapon-confirm-hit','data-hit="no"')}${button('Aplicar acerto','weapon-confirm-hit','data-hit="yes"','primary')}`;
}
export async function resolveWeaponAttack(message,targetUuid,options={}){
 const key=message.id+':'+targetUuid,previous=queues.get(key)??Promise.resolve();
 const job=previous.catch(()=>{}).then(async()=>{
  const a=message.getFlag(ID,'weaponAttack');if(!a)throw Error('Ataque não encontrado.');
  let tenketsuOnly=false,execution,barrier,declaredDistance;
  if(a.executionMessageId){
   if(!game.user.isGM)throw Error('Esta execução é aplicada pelo mestre coordenador.');
   execution=game.messages.get(a.executionMessageId)?.getFlag(ID,'actionExecution');
   const slot=execution?.slots?.find(s=>s.strike===a.strikeIndex&&s.targetUuid===targetUuid);
   if((!slot?.result?.hit&&!slot?.result?.tenketsuOnly)||execution.rolls?.[a.strikeIndex]?.messageId!==message.id)throw Error('Consequência não confirmada nesta execução.');
   tenketsuOnly=slot.result.tenketsuOnly===true;
   barrier=slot.result.barrier??slot.result.kaiten;
   declaredDistance=slot.distance;
   options={...options,hit:slot.result.hit,defense:slot.defense.kind==='technique'?'other':slot.defense.kind,blockingWeapon:slot.defense.weaponId};
  }
  const target=await fromUuid(targetUuid);if(!target?.isOwner)throw Error('Somente o dono do alvo ou o mestre pode aplicar o resultado.');
  if((target.system.powerState?.active??[]).some(a=>a.submerged))throw Error('O alvo está submerso em Colisão de Ondas e não pode receber ataques físicos.');
  const heavyBlock=options.defense==='bloqueio'&&a.plan.hachimonHeavy&&!barrier;
  if(a.natural<=3&&!a.plan.automaticHit&&!heavyBlock)throw Error('Fracasso automático não pode aplicar dano.');
  const receiptKey='weapon:'+message.id,settled=runtimeState(target).weaponResolutions?.[receiptKey];if(settled?.complete)return {...settled.result,duplicate:true};
  if(options.defense==='bloqueio'&&(a.plan.cannotBlock||!canBlockSize(a.size??'medium',sizeProfile(target.system))))throw Error('Este ataque não pode ser bloqueado. Confira outra defesa permitida.');
  let hit=options.hit;if(options.defense==='bloqueio'&&a.plan.breakBlock)hit=await breakCommonBlockingWeapon(target,a.plan.breakBlock,options.blockingWeapon)||hit;if(a.plan.extendedBlade&&!runtimeState(target).weaponResolutions?.['before:'+message.id])throw Error('Resolva primeiro Espírito contra Prontidão.');
  if(tenketsuOnly){
   const sourceId='weapon:'+message.id+':'+target.id;
   const tenketsu=await rollTenketsuResistance(target,receiptKey,sourceId,a.plan.tenketsuDifficulty);
   const result={hit:false,damage:0,tenketsu};
   await mutateRuntime(target,state=>{
    Object.assign(state.weaponResolutions[receiptKey],{complete:true,result});
   });
   return result;
  }
  if(!hit)return {hit:false,damage:0};
  if(a.plan.sizeSweep&&!sizeSweepAllowed(a.size,[target.system]))throw Error('Este alvo não é pequeno o suficiente para o ataque amplo por tamanho.');
  const plan=a.plan,sourceId='weapon:'+message.id+':'+target.id;
  const degree=heavyBlock?Math.max(1,a.degree,Number(plan.minimumDegree??0)):a.degree;
  const result=await applyPhysicalDamage(target,{base:barrier?.excess??plan.damagePool??plan.base,partnerDivisor:plan.partnerDivisor??1,degree,divisionCount:plan.divisionCount??1,divisionIndex:plan.divisionIndex??0,postDivisionBonus:plan.postDivisionBonus??0,ignoreBodyHardness:[plan.ignoreHardness??0],juuken:plan.juuken===true,critical:a.critical,attackerUuid:a.actorUuid,attackerElement:plan.element,sourceId,reason:a.name,camouflageContext:{directAttack:true,located:options.located!=='no',distance:declaredDistance??options.distance??a.distance,areaFraction:Number(options.areaFraction??0),weaponShot:!!plan.ranged}});
  if(result.hit&&plan.hachimonHeavy){const {settleHachimonHeavyFall}=await import('./power-actions.mjs');result.heavyFall=await settleHachimonHeavyFall(target,plan.hachimonHeavy,sourceId);if(!result.heavyFall.success)result.conditionApplied='Caído';}
  if(result.hit&&plan.juuken&&Number.isInteger(plan.tenketsuDifficulty)){
   const tenketsu=await rollTenketsuResistance(target,receiptKey,sourceId,plan.tenketsuDifficulty);
   Object.assign(result,{tenketsu});
  }
  if(result.hit&&plan.octogram&&execution){
   result.sealedChakra=await sealOctogramHit(target,receiptKey,plan.octogram.seal);
   const previousSeals=execution.slots.filter(s=>s.strike<a.strikeIndex&&s.targetUuid===targetUuid&&s.applied?.sealedChakra>0);
   if(a.strikeIndex===2&&result.sealedChakra>0&&previousSeals.length===2){
    result.octogramResistance=await rollTenketsuResistance(target,receiptKey,sourceId,plan.octogram.difficulty,plan.octogram);
   }
  }
  if(result.hit&&plan.insectDrain){
   if(plan.kidaichuu){
    if(!Number.isFinite(target.system.resources?.chakra?.value))throw Error('Preencha o chakra atual do alvo.');
    const attacker=await fromUuid(a.actorUuid);
    if(!attacker?.isOwner)throw Error('A origem dos Kidaichuu está indisponível.');
    await assignKidaichuu(attacker,target,sourceId,plan.kidaichuu);
   }
   const drain=await mutateRuntime(target,state=>{
    state.weaponResolutions??={};
    const receipt=state.weaponResolutions[receiptKey]??={};
    if(receipt.insectDrain!=null)return {amount:receipt.insectDrain};
    const chakra=target.system.resources?.chakra?.value;
    if(!Number.isFinite(chakra))throw Error('Preencha o chakra atual do alvo.');
    receipt.insectDrain=plan.insectDrain;
    return {amount:plan.insectDrain,changes:{
     'system.resources.chakra.value':chakra-plan.insectDrain,
     'system.automation.forcedDrain':true
    }};
   });
   result.drainedChakra=drain.amount;
   if(plan.kidaichuu)result.kidaichuuPartners=plan.kidaichuu.amount;
  }
  if(result.hit&&plan.condition){
   const existing=conditionRecords(target).find(c=>c.weaponReceipt===sourceId);
   if(existing)result.conditionApplied=existing.name??CONDITIONS[plan.condition]?.name;
   else{
   let apply=true;
   if(plan.resist&&!settled?.resistance){const check=statPrecision(target,plan.resist.stat,{kind:plan.resist.stat in SKILLS?'skill':'resistance',bodyResistance:true});if(!check.allowed)throw Error(check.reasons.join(' '));const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision;apply=natural<=3||natural<15&&roll.total<plan.resist.difficulty;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:`Resistência ${plan.resist.stat.toUpperCase()} ${plan.resist.difficulty}: ${apply?'falha':'sucesso'}.`});await mutateRuntime(target,state=>{state.weaponResolutions??={};state.weaponResolutions[receiptKey]={...state.weaponResolutions[receiptKey],resistance:{apply}};});}else if(settled?.resistance)apply=settled.resistance.apply;
   if(apply){
    await saveCondition(target,{key:plan.condition,source:a.name,weaponReceipt:sourceId,...(plan.condition==='agarrado'?{sourceActorUuid:a.actorUuid,notes:'Use os testes de libertação do Básico, p. 268, e encerre a condição ao soltar.'}:{}),...(plan.condition==='atordoado'?{remaining:1,timing:'Fim do turno'}:{})});
    result.conditionApplied=CONDITIONS[plan.condition]?.name;
   }
   }
  }
  if(result.hit&&a.critical&&plan.criticalSlow){
   const weaponReceipt=sourceId+':lento';
   if(!conditionRecords(target).some(condition=>condition.weaponReceipt===weaponReceipt))
    await saveCondition(target,{key:'lento',source:a.name,weaponReceipt,remaining:1,timing:'Fim do turno'});
   result.conditionApplied=[result.conditionApplied,'Lento'].filter(Boolean).join(' e ');
  }
  if(result.hit&&a.coating){const {exposePoisonFromWeapon}=await import('./inventory-actions.mjs');await exposePoisonFromWeapon(target,a.coating,{sourceId,attackerUuid:a.actorUuid,damageGrade:a.degree,damage:result.damage,hit:true});}
  for(const c of conditionRecords(target).filter(c=>c.weaponReceipt==='before:'+message.id))await saveCondition(target,c,{remove:true});
  await mutateRuntime(target,state=>{state.weaponResolutions??={};state.weaponResolutions[receiptKey]={...state.weaponResolutions[receiptKey],complete:true,result};});
  return result;
 });queues.set(key,job);try{return await job;}finally{if(queues.get(key)===job)queues.delete(key);}
}
// Livro Básico 4.1.b, pp. 158–159. Each strike has its own resolution receipt.
async function assignKidaichuu(actor,target,receiptId,{amount,itemId,resourceId}){
 return mutateRuntime(actor,state=>{
  state.kidaichuuPartners??=[];
  if(state.kidaichuuPartners.some(record=>record.id===receiptId))return;
  const deployments=state.insectDeployments?.[itemId];
  if((deployments?.[resourceId]??0)<amount)throw Error('Os Kidaichuu liberados mudaram. Confira a reserva antes de aplicar.');
  deployments[resourceId]-=amount;
  const skill=skillBase(actor.system,'lidar');
  state.kidaichuuPartners.push({
   id:receiptId,itemId,resourceId,amount,targetUuid:target.uuid,targetName:target.name,
   vitality:2*skill,chakra:2,forceAgility:skill-2,
   otherAttributes:Math.ceil((skill-2)/2),
   attack:statPrecision(actor,'cd',{kind:'attack',manualContext:true}).base,
   dodgeBase:statPrecision(actor,'lm',{kind:'defense',manualContext:true}).base
  });
 });
}

function recordSealedChakra(target,state,limit){
 const chakra=target.system.resources?.chakra?.value;
 const amount=Number.isFinite(chakra)?Math.min(limit,Math.max(0,chakra)):0;
 if(!amount)return {amount};
 state.sealedChakra=(state.sealedChakra??0)+amount;
 return {amount,changes:{'system.resources.chakra.value':chakra-amount}};
}

async function sealOctogramHit(target,receiptKey,limit){
 const result=await mutateRuntime(target,state=>{
  state.weaponResolutions??={};
  const receipt=state.weaponResolutions[receiptKey]??={};
  if(receipt.octogramSeal!=null)return {amount:receipt.octogramSeal};
  const seal=recordSealedChakra(target,state,limit);
  receipt.octogramSeal=seal.amount;
  return seal;
 });
 return result.amount;
}

async function rollTenketsuResistance(target,receiptKey,sourceId,difficulty,octogram){
 let record=runtimeState(target).weaponResolutions?.[receiptKey]?.tenketsu;
 if(!record){
  const check=statPrecision(target,'vig',{kind:'resistance',bodyResistance:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate();
  const natural=roll.total-check.precision;
  const failed=natural<=3||natural<15&&roll.total<difficulty;
  record={difficulty,failed,json:JSON.stringify(roll.toJSON())};
  if(octogram&&failed){
   const combat=game.combat;
   const targetTurn=combat?.started&&combat.combatant?.actor?.uuid===target.uuid;
   record.stunTurns=targetTurn?2:1;
   record.scene=periodKey(target,'scene');
  }
  await mutateRuntime(target,state=>{
   state.weaponResolutions??={};
   const receipt=state.weaponResolutions[receiptKey]??={};
   const seal=recordSealedChakra(target,state,failed&&!octogram?2:0);
   record.sealedChakra=seal.amount;
   receipt.tenketsu=record;
   return {changes:seal.changes};
  });
 }
 if(octogram&&record.failed&&!record.conditionsApplied){
  await applyOctogramConditions(target,sourceId,octogram,record);
  await mutateRuntime(target,state=>{
   state.weaponResolutions[receiptKey].tenketsu.conditionsApplied=true;
  });
 }
 if(!(game.messages.contents??[]).some(m=>m.getFlag(ID,'tenketsuReceipt')===sourceId)){
  let outcome='Sucesso. Nenhum ponto de chakra selado.';
  if(record.failed){
   outcome=record.sealedChakra==null
    ?'Falha. Confira manualmente o selamento registrado na versão anterior.'
    :`Falha. Chakra selado até uma noite de descanso: ${record.sealedChakra}.`;
  }
  if(octogram){
   outcome=record.failed
    ?'Falha. Atordoado até o fim do próximo turno do alvo.'+(octogram.fatigue?' Fatigado até o fim da cena.':'')
    :'Sucesso. O alvo evita as condições da sequência.';
  }
  await foundry.dice.Roll.fromJSON(record.json).toMessage({
   speaker:ChatMessage.getSpeaker({actor:target}),
   flavor:`${octogram?.name??'Tenketsu Byakugan'} · Vigor Dif ${difficulty}. ${outcome}`,
   flags:{[ID]:{tenketsuReceipt:sourceId}}
  });
 }
 return {difficulty,failed:record.failed,sealedChakra:record.sealedChakra??0};
}

async function applyOctogramConditions(target,sourceId,octogram,record){
 const existing=conditionRecords(target,{includeInactive:true});
 const alreadyApplied=key=>existing.some(c=>c.key===key&&c.weaponReceipt===sourceId);
 const source={source:octogram.name,weaponReceipt:sourceId};
 if(!alreadyApplied('atordoado')){
  await saveCondition(target,{...source,key:'atordoado',timing:'Fim do turno',remaining:record.stunTurns??1,manualStartsRemaining:2});
 }
 if(octogram.fatigue&&!alreadyApplied('fatigado')&&record.scene===periodKey(target,'scene')){
  await saveCondition(target,{...source,key:'fatigado',duration:'Até o fim da cena',expiresScene:record.scene});
 }
}

export async function weaponResolutionAction(app,op,data,root,{actor,show}){
 if(op==='weapon-resolve'){
  const message=game.messages.get(data.message),attack=message?.getFlag(ID,'weaponAttack');if(!attack)throw Error('Ataque não encontrado.');
  return show('weapon-resolution',{actor,resolveMessage:message.id,weaponAttack:attack,targets:game.actors.filter(a=>a.isOwner).map(a=>({uuid:a.uuid,name:a.name,size:sizeProfile(a.system).key,weapons:[...a.items].filter(i=>i.type==='equipment').map(i=>({id:i.id,name:i.name}))}))});
 }
 const values=Object.fromEntries(Object.entries(readFields(root,'resolve.')).map(([k,v])=>[k.slice(8),v])),message=game.messages.get(values.message??app.panelConfig.resolveMessage);
 if(op==='weapon-prepare-defense'){await prepareExtendedBlade(message,values.targetUuid);return app.render({force:true});}
 const attack=message?.getFlag(ID,'weaponAttack'),source=attack?.actorUuid?await fromUuid(attack.actorUuid):null;
 const distance=source?tokenDistance(source,values.targetUuid):null;
 const result=await resolveWeaponAttack(message,values.targetUuid,{...values,distance:distance??values.distance,hit:(data.hit??values.hit)==='yes'}),target=await fromUuid(values.targetUuid);
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:target}),content:`<p>${result.duplicate?'Resultado já aplicado.':result.hit?`Dano ${result.damage}; absorção ${result.absorbed}; vitalidade ${result.before} → ${result.after}.`:'O ataque não atingiu o alvo.'}</p>`});return app.close();
}

export async function prepareExtendedBlade(message,targetUuid){
 const attack=message?.getFlag(ID,'weaponAttack'),target=await fromUuid(targetUuid),source=await fromUuid(attack?.actorUuid);if(!target?.isOwner||!attack?.plan.extendedBlade)throw Error('Afiar: alvo ou ataque inválido.');
 const key='before:'+message.id;if(runtimeState(target).weaponResolutions?.[key])return;
 let result='repeat';for(let attempt=0;result==='repeat'&&attempt<20;attempt++){
  const values=[];for(const [actor,stat]of [[source,'esp'],[target,'prontidao']]){const p=statPrecision(actor,stat,{kind:stat==='esp'?'resistance':'skill',reaction:true}),roll=await new foundry.dice.Roll(`2d8 + (${p.precision})`).evaluate();values.push({natural:roll.total-p.precision,total:roll.total,precision:p.precision});await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:'Afiar: Espírito contra Prontidão antes da defesa.'});}result=resolveOpposed(...values);
 }
 if(result==='repeat')throw Error('O empate persistiu; clique novamente para repetir os testes.');
 if(result==='first')await saveCondition(target,{key:'debilitado',level:1,scope:'defense',remaining:1,timing:'Fim do turno',source:'Afiar: lâmina estendida',weaponReceipt:key});
 await mutateRuntime(target,s=>{s.weaponResolutions??={};s.weaponResolutions[key]={result};});
}
