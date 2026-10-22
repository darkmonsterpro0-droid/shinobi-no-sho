import {breakCommonBlockingWeapon} from './power-defense.mjs';
import {resolveOpposed} from './build-rules.mjs';
import {mutateRuntime,runtimeState} from './aptitude-runtime.mjs';
import {ID} from './config.mjs';
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
 return `<h3>${esc(a.name)}</h3><p>Resultado ${a.total}${modifier?` + ${modifier} por tamanho = ${a.total+modifier}`:''} · grau ${a.degree}${a.critical?' · crítico':''}.</p><input type="hidden" name="resolve.message" value="${esc(env.resolveMessage)}"><div class="sns-form-grid">${select('Alvo','resolve.targetUuid',v['resolve.targetUuid']??targets[0]?.uuid??'',Object.fromEntries(targets.map(t=>[t.uuid,t.name])))}${select('Defesa usada','resolve.defense',defense,{esquiva:'Esquiva',bloqueio:'Bloqueio',antecipar:'Antecipar',other:'Outra defesa'})}${a.plan.breakBlock?select('Arma usada no Bloqueio','resolve.blockingWeapon','',{'':'Escolha se houve Bloqueio',...Object.fromEntries((target?.weapons??[]).map(w=>[w.id,w.name]))}):''}${select('Resultado após conferir a defesa','resolve.hit','yes',{yes:'Acertou',no:'Defendeu'})}${select('Localização do alvo','resolve.located','yes',{yes:'Localizado',no:'Posição desconhecida'})}${field('Distância até o alvo (m)','resolve.distance',v['resolve.distance']??a.distance??1,'number','min="0"')}${field('Área encoberta atingida (0 a 1)','resolve.areaFraction',0,'number','min="0" max="1" step="0.05"')}</div><p>Confirme a defesa com o resultado acima. Dureza, camuflagem e absorção serão calculadas antes de alterar a vitalidade.</p>${a.plan.extendedBlade?button('Afiar: Espírito contra Prontidão','weapon-prepare-defense'):''}${button('Resolver no alvo','weapon-confirm-hit','','primary')}`;
}
export async function resolveWeaponAttack(message,targetUuid,options={}){
 const key=message.id+':'+targetUuid,previous=queues.get(key)??Promise.resolve();
 const job=previous.catch(()=>{}).then(async()=>{
  const a=message.getFlag(ID,'weaponAttack');if(!a)throw Error('Ataque não encontrado.');
  const target=await fromUuid(targetUuid);if(!target?.isOwner)throw Error('Somente o dono do alvo ou o mestre pode aplicar o resultado.');
  if((target.system.powerState?.active??[]).some(a=>a.submerged))throw Error('O alvo está submerso em Colisão de Ondas e não pode receber ataques físicos.');
  if(a.natural<=3)throw Error('Fracasso automático não pode aplicar dano.');
  const receiptKey='weapon:'+message.id,settled=runtimeState(target).weaponResolutions?.[receiptKey];if(settled?.complete)return {...settled.result,duplicate:true};
  if(options.defense==='bloqueio'&&(a.plan.cannotBlock||!canBlockSize(a.size??'medium',sizeProfile(target.system))))throw Error('Este ataque não pode ser bloqueado. Confira outra defesa permitida.');
  let hit=options.hit;if(options.defense==='bloqueio'&&a.plan.breakBlock)hit=await breakCommonBlockingWeapon(target,a.plan.breakBlock,options.blockingWeapon)||hit;if(a.plan.extendedBlade&&!runtimeState(target).weaponResolutions?.['before:'+message.id])throw Error('Resolva primeiro Espírito contra Prontidão.');
  if(!hit)return {hit:false,damage:0};
  if(a.plan.sizeSweep&&!sizeSweepAllowed(a.size,[target.system]))throw Error('Este alvo não é pequeno o suficiente para o ataque amplo por tamanho.');
  const plan=a.plan,sourceId='weapon:'+message.id+':'+target.id;
  const result=await applyPhysicalDamage(target,{base:plan.damagePool??plan.base,degree:a.degree,divisionCount:plan.divisionCount??1,divisionIndex:plan.divisionIndex??0,postDivisionBonus:plan.postDivisionBonus??0,ignoreBodyHardness:[plan.ignoreHardness??0],critical:a.critical,attackerUuid:a.actorUuid,attackerElement:plan.element,sourceId,reason:a.name,camouflageContext:{located:options.located!=='no',distance:Number(options.distance??a.distance??1),areaFraction:Number(options.areaFraction??0),weaponShot:!!plan.ranged}});
  if(result.hit&&plan.condition&&!conditionRecords(target).some(c=>c.weaponReceipt===sourceId)){
   let apply=true;
   if(plan.resist&&!settled?.resistance){const check=statPrecision(target,plan.resist.stat,{kind:'resistance',bodyResistance:true});if(!check.allowed)throw Error(check.reasons.join(' '));const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision;apply=natural<=3||natural<15&&roll.total<plan.resist.difficulty;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:`Resistência ${plan.resist.stat.toUpperCase()} ${plan.resist.difficulty}: ${apply?'falha':'sucesso'}.`});await mutateRuntime(target,state=>{state.weaponResolutions??={};state.weaponResolutions[receiptKey]={resistance:{apply}};});}else if(settled?.resistance)apply=settled.resistance.apply;
   if(apply)await saveCondition(target,{key:plan.condition,source:a.name,weaponReceipt:sourceId,...(plan.condition==='atordoado'?{remaining:1,timing:'Fim do turno'}:{})});
  }
  if(result.hit&&a.coating){const {exposePoisonFromWeapon}=await import('./inventory-actions.mjs');await exposePoisonFromWeapon(target,a.coating,{sourceId,attackerUuid:a.actorUuid,damageGrade:a.degree,damage:result.damage,hit:true});}
  for(const c of conditionRecords(target).filter(c=>c.weaponReceipt==='before:'+message.id))await saveCondition(target,c,{remove:true});
  await mutateRuntime(target,state=>{state.weaponResolutions??={};state.weaponResolutions[receiptKey]={...state.weaponResolutions[receiptKey],complete:true,result};});
  return result;
 });queues.set(key,job);try{return await job;}finally{if(queues.get(key)===job)queues.delete(key);}
}
export async function weaponResolutionAction(app,op,data,root,{actor,show}){
 if(op==='weapon-resolve'){
  const message=game.messages.get(data.message),attack=message?.getFlag(ID,'weaponAttack');if(!attack)throw Error('Ataque não encontrado.');
  return show('weapon-resolution',{actor,resolveMessage:message.id,weaponAttack:attack,targets:game.actors.filter(a=>a.isOwner).map(a=>({uuid:a.uuid,name:a.name,size:sizeProfile(a.system).key,weapons:[...a.items].filter(i=>i.type==='equipment').map(i=>({id:i.id,name:i.name}))}))});
 }
 const values=Object.fromEntries(Object.entries(readFields(root,'resolve.')).map(([k,v])=>[k.slice(8),v])),message=game.messages.get(values.message??app.panelConfig.resolveMessage);
 if(op==='weapon-prepare-defense'){await prepareExtendedBlade(message,values.targetUuid);return app.render({force:true});}
 const result=await resolveWeaponAttack(message,values.targetUuid,{...values,hit:values.hit==='yes'}),target=await fromUuid(values.targetUuid);
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:target}),content:`<p>${result.duplicate?'Resultado já aplicado.':result.hit?`Dano ${result.damage}; absorção ${result.absorbed}; vitalidade ${result.before} → ${result.after}.`:'O ataque não atingiu o alvo.'}</p>`});return app.close();
}

async function prepareExtendedBlade(message,targetUuid){
 const attack=message?.getFlag(ID,'weaponAttack'),target=await fromUuid(targetUuid),source=await fromUuid(attack?.actorUuid);if(!target?.isOwner||!attack?.plan.extendedBlade)throw Error('Afiar: alvo ou ataque inválido.');
 const key='before:'+message.id;if(runtimeState(target).weaponResolutions?.[key])return;
 let result='repeat';for(let attempt=0;result==='repeat'&&attempt<20;attempt++){
  const values=[];for(const [actor,stat]of [[source,'esp'],[target,'prontidao']]){const p=statPrecision(actor,stat,{kind:stat==='esp'?'resistance':'skill',reaction:true}),roll=await new foundry.dice.Roll(`2d8 + (${p.precision})`).evaluate();values.push({natural:roll.total-p.precision,total:roll.total,precision:p.precision});await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:'Afiar: Espírito contra Prontidão antes da defesa.'});}result=resolveOpposed(...values);
 }
 if(result==='repeat')throw Error('O empate persistiu; clique novamente para repetir os testes.');
 if(result==='first')await saveCondition(target,{key:'debilitado',level:1,scope:'defense',remaining:1,timing:'Fim do turno',source:'Afiar: lâmina estendida',weaponReceipt:key});
 await mutateRuntime(target,s=>{s.weaponResolutions??={};s.weaponResolutions[key]={result};});
}
