import {rerollOption} from './reroll-options.mjs';
import {ID,ATTRIBUTES,COMBAT,SKILLS} from './config.mjs';
import {esc,set} from './ui.mjs';
import {readFields} from './interactions.mjs';
import {combatBaseStatus} from './progression.mjs';
import {CONDITIONS} from './conditions.mjs';
import {houseRules,allocationProposal,saveAllocation,grantAttributeXP,conditionRecords,saveCondition,derivedSummary,statPrecision,damageActor,processConditionPhase,restRecovery,toggleCondition} from './automation.mjs';
const fields=(root,prefix)=>Object.fromEntries(Object.entries(readFields(root,prefix)).map(([k,v])=>[k.slice(prefix.length),v]));
const owner=actor=>{if(!actor?.isOwner)throw Error('Você não tem permissão para alterar este personagem.');};
const gm=()=>{if(!game.user.isGM)throw Error('Somente o mestre pode alterar esta configuração.');};
export const SUMMARY_ACTIONS=new Set(['rest','toggle-condition','allocation','save-allocation','xp','grant-xp','house','save-house','roll-stat','execute-summary-roll','resist-condition','resolve-confusion','remove-condition','condition-event','manual-turn','recovery','apply-resource']);
function allocationValues(root,prior={}){const v=structuredClone(prior);for(const[k,value]of Object.entries(fields(root,'allocation.')))set(v,k,value);return v;}
export function refreshBudget(root) {
  const budget=root?.querySelector('.sns-allocation');if(!budget)return;
  const granted=Number(budget.dataset.budgetGranted),spent=[...budget.querySelectorAll('[data-attribute-point]')].reduce((s,i)=>s+Number(i.value||0),0),remaining=Math.round((granted-spent)*1000)/1000;
  budget.querySelector('[data-allocation-spent]').textContent=String(spent);budget.querySelector('[data-allocation-remaining]').textContent=String(remaining);
  const minimum=Number(budget.dataset.allocationMinimum),nc=Number(budget.dataset.allocationNc),pending=[];
  for(const input of budget.querySelectorAll('[data-attribute-point]')) {
    const key=input.dataset.attributePoint,value=Number(input.value||0),missing=Math.max(0,minimum-value),hint=budget.querySelector(`[data-attribute-minimum="${key}"]`);
    input.closest('.sns-allocation-entry').dataset.minimumPending=String(missing>0);
    hint.textContent=missing?`Mínimo ${minimum} · faltam ${missing} ponto(s)`:`Mínimo ${minimum} · atingido`;
    if(missing)pending.push({key,value,missing});
  }
  const notice=budget.querySelector('[data-minimum-notice]'),needed=pending.reduce((sum,p)=>sum+p.missing,0);
  notice.dataset.pending=String(needed>0);
  notice.textContent=needed?`Mínimo pendente no NC ${nc}: ${pending.map(p=>`${ATTRIBUTES[p.key]} ${p.value} → ${minimum}`).join('; ')}. Faltam ${needed} ponto(s) para atingir os mínimos. Priorize esses atributos antes de investir acima do mínimo.`:'Todos os atributos atingem o mínimo deste NC.';
  const bases=Object.fromEntries([...budget.querySelectorAll('[data-combat-base]')].map(input=>[input.dataset.combatBase,input.value])),baseStatus=combatBaseStatus(bases),baseNotice=budget.querySelector('[data-combat-base-status]');
  baseNotice.textContent=baseStatus.message;baseNotice.dataset.pending=String(!baseStatus.valid);
  const status=budget.querySelector('[data-allocation-status]');status.textContent=remaining<0?`Atributos: ${Math.abs(remaining)} ponto(s) acima do total concedido.`:remaining===0?'Todos os pontos de atributos foram distribuídos.':`Restam ${remaining} ponto(s) de atributos para distribuir. Confira também os mínimos e máximos antes de salvar.`;
}
async function emit(actor,title,body,flags={}) {return ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<div class="sns-app"><article class="sns-record"><header><strong>${esc(title)}</strong></header>${body}</article></div>`,flags:{[ID]:flags}});}
export function currentTurnKey(actor){return actor.getFlag(ID,'currentTurnKey')??'fora-de-combate';}
const bleedingAttempts=new Set();
export async function claimBleedingAttempt(actor) {
  const turn=currentTurnKey(actor),key=`${actor.uuid}:${turn}`;
  if(bleedingAttempts.has(key)||actor.getFlag(ID,'bleedingVigorTurn')===turn)throw Error('Já houve uma tentativa de Vigor contra Sangrando neste turno. Medicina exige uma ação padrão por tentativa.');
  bleedingAttempts.add(key);
  try{await actor.update({[`flags.${ID}.bleedingVigorTurn`]:turn});}finally{bleedingAttempts.delete(key);}
}
export async function resolveConfusion(actor,record) {
  owner(actor);const turn=currentTurnKey(actor);
  if(record.resolvedFor===turn){ui.notifications.info('A confusão já foi resolvida neste turno.');return;}
  const roll=await new foundry.dice.Roll('1d8').evaluate();const value=roll.total;
  const behavior=value<=2?'Foge':value<=4?'Ataca a criatura mais próxima':value<=6?'Não realiza ações; mantém as reações de defesa':'Age normalmente';
  for(const r of conditionRecords(actor).filter(r=>r.key==='confuso'))await saveCondition(actor,{...r,turnResult:value,resolvedFor:turn});
  await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>Confuso: ${esc(behavior)}</strong><p>Básico p. 277. Reações de defesa em 5–6 preservadas por decisão da mesa.</p>`,flags:{[ID]:{kind:'confusion',turn,condition:record.id}}});
}
export async function checkCamouflage(actor) {
  owner(actor);const roll=await new foundry.dice.Roll('1d8').evaluate();
  await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>Camuflagem total: ${roll.total<=4?'ataque falha':'ataque ultrapassa a camuflagem'}</strong><p>Básico p. 273: 1d8, falha em 1–4. Aplicar após confirmar acerto não crítico.</p>`});
  return roll.total>4;
}
export async function settleResistance(actor,record,success) {
  if(record.key==='sufocamento') {
    const turn=currentTurnKey(actor);if(record.resolvedFor===turn)throw Error('O sufocamento já foi resolvido neste turno.');
    await saveCondition(actor,{...record,resolvedFor:turn});
    if(!success)await damageActor(actor,record.damage??Number(actor.system.campaign.level),{reason:'Sufocamento'});
    return;
  }
  if(!success)return;
  if(record.key==='sangrando') {
    if(!record.automatic){if((record.level??1)>1)await saveCondition(actor,{...record,level:record.level-1});else await saveCondition(actor,record,{remove:true});}
    const remaining=conditionRecords(actor).filter(r=>r.key==='sangrando');
    const vit=actor.system.resources.vitality.value;
    if(!remaining.length&&vit>=-20&&vit<=-11)await saveCondition(actor,{key:'estavel',name:'Estável',source:'Sangramento estabilizado · Básico pp. 259, 278'});
    return;
  }
  if((record.level??1)>1)await saveCondition(actor,{...record,level:record.level-1});
  else if(record.previousStages?.length){const stages=[...record.previousStages],key=stages.pop();await saveCondition(actor,{...record,key,name:CONDITIONS[key].name,previousStages:stages});}
  else await saveCondition(actor,record,{remove:true});
}
export async function automationAction(app,op,data,root,{actor,show}) {
  if(op==='house'){gm();return show('house',{actor});}
  if(op==='save-house'){gm();const rule=fields(root,'house.');if(!['level','xp'].includes(rule.advancement))throw Error('Regra de avanço inválida.');await game.settings.set(ID,'houseRules',{...houseRules(),...rule});await app.close();return;}
  if(op==='allocation'){owner(actor);if(actor.system.automation?.enabled&&!actor.system.campaign.draft)gm();return show('allocation',{actor,values:allocationProposal(actor)});}
  if(op==='save-allocation'){owner(actor);await saveAllocation(actor,allocationValues(root,app.values),{initializeResources:app.panelConfig?.newActor});await app.close();return;}
  if(op==='xp'){gm();owner(actor);if(houseRules().advancement!=='xp')throw Error('Escolha EXP em Regras da casa para conceder pontos separadamente.');return show('xp',{actor});}
  if(op==='grant-xp'){gm();owner(actor);const v=fields(root,'xp.');await grantAttributeXP(actor,v.amount);await app.close();return show('allocation',{actor,values:allocationProposal(actor)});}
  if(op==='toggle-condition'){owner(actor);await toggleCondition(actor,data.key,data.id);await app.render({force:true});return;}
  if(op==='rest'){owner(actor);return show('recovery',{actor,values:{operation:'rest'}});}
  if(op==='recovery'){owner(actor);return show('recovery',{actor});}
  if(op==='apply-resource') {
    owner(actor);const v=fields(root,'resource.'),d=derivedSummary(actor),s=actor.system,n=Number(v.amount),vit=s.resources.vitality.value,chakra=s.resources.chakra.value,update={};
    if(v.operation!=='rest'&&(!Number.isFinite(n)||n<0))throw Error('Informe uma quantidade não negativa.');
    if(d.state.keys.includes('morto')&&['heal','chakra','rest'].includes(v.operation))throw Error('Recuperação comum não ressuscita. Aplique a técnica ou decisão específica de ressurreição.');
    if(v.operation==='damage')await damageActor(actor,n);
    else if(v.operation==='rest') {
      if(!v.fullRest)throw Error('Confirme as oito horas de descanso completo sem interrupção significativa.');
      const rest=restRecovery(actor);update['system.resources.vitality.value']=rest.vitality;update['system.resources.chakra.value']=rest.chakra;
    }else if(v.operation==='heal'){if(vit===null)throw Error('Preencha a vitalidade atual.');update['system.resources.vitality.value']=Math.min(d.vitality,vit+n);}
    else if(v.operation==='chakra'){if(chakra===null)throw Error('Preencha o chakra atual.');update['system.resources.chakra.value']=Math.min(d.chakra,chakra+n);}
    else if(v.operation==='spend'){if(chakra===null||chakra<n)throw Error('Chakra insuficiente: gasto normal não pode extrair chakra abaixo de zero.');update['system.resources.chakra.value']=chakra-n;}
    else if(v.operation==='drain'){if(chakra===null)throw Error('Preencha o chakra atual.');update['system.resources.chakra.value']=chakra-n;update['system.automation.forcedDrain']=true;}
    else if(v.operation!=='damage')throw Error('Operação desconhecida.');
    if(Object.keys(update).length)await actor.update(update);
    if(v.operation==='rest')for(const r of conditionRecords(actor).filter(r=>['fatigado','exausto'].includes(r.key)&&!r.remaining&&!r.duration))await saveCondition(actor,r,{remove:true});
    await emit(actor,'Recursos atualizados',`<p>${esc({heal:'Vitalidade recuperada',damage:'Dano letal',chakra:'Chakra recuperado',spend:'Gasto de chakra',drain:'Drenagem forçada',rest:'Descanso completo'}[v.operation])}: ${v.operation==='rest'?`8 horas sem interrupção significativa. Vitalidade ${vit} → ${update['system.resources.vitality.value']}; chakra ${chakra} → ${update['system.resources.chakra.value']}. Básico pp. 259–260`:n}.</p>`);await app.close();return;
  }
  if(op==='roll-stat'){owner(actor);const stat=data.stat;return show('roll',{actor,values:{stat,kind:stat in ATTRIBUTES?'attribute':stat==='esq'||stat==='lm'?'defense':'attack'}});}
  if(op==='resist-condition') {
    owner(actor);const r=conditionRecords(actor,{includeAutomatic:true}).find(r=>r.id===data.id);if(!r)throw Error('Condição não encontrada.');
    let difficulty=r.key==='sangrando'?18:r.key==='sufocamento'?(r.difficulty==null?null:Number(r.difficulty)+Math.max(0,Number(r.elapsed??0)-1)):r.difficulty;
    return show('roll',{actor,values:{stat:r.key==='sangrando'||r.key==='sufocamento'?'vig':r.resistStat||'vig',kind:'attribute',conditionId:r.id,difficulty,reaction:r.key==='sangrando',vision:false}});
  }
  if(op==='execute-summary-roll') {
    owner(actor);const v={...app.values,...fields(root,'roll.')},record=v.conditionId?conditionRecords(actor,{includeAutomatic:true}).find(r=>r.id===v.conditionId):null;
    if(v.conditionId&&!record)throw Error('A condição já foi encerrada.');
    const bonus=Number(v.bonus??0);if(!Number.isInteger(bonus))throw Error('O bônus de precisão deve ser um inteiro.');
    if(v.kind==='defense'&&v.reaction)for(const r of conditionRecords(actor).filter(r=>r.key==='fascinado'))await saveCondition(actor,r,{remove:true});
    const performer=v.performer?await fromUuid(v.performer):actor;owner(performer);
    if(record?.key==='sangrando') {
      if(!['vig','medicina'].includes(v.stat))throw Error('Sangrando permite Vigor 18 ou Medicina 16.');
      if(v.stat==='vig'&&performer.uuid!==actor.uuid)throw Error('O teste de Vigor deve ser feito pelo personagem que está sangrando.');
      v.kind=v.stat==='medicina'?'skill':'attribute';v.reaction=v.stat==='vig';
    }else if(record?.key==='sufocamento'){v.stat='vig';v.kind='attribute';v.reaction=false;}
    const context={...v,manualContext:true,vision:false,unseenOpponent:false,reaction:record?v.reaction:v.kind==='defense',resistingId:performer.uuid===actor.uuid?record?.id:undefined,stabilizing:record?.key==='sangrando'&&v.stat==='vig'&&derivedSummary(actor).state.keys.includes('morrendo')},check=statPrecision(performer,v.stat,context);
    if(!check.allowed)throw Error(check.reasons.join(' '));
    let extraBonus=bonus;if(v.stat==='esq'&&check.loseDodgeBonus&&extraBonus>0)extraBonus=0;
    const precision=check.precision+extraBonus,label=ATTRIBUTES[v.stat]??COMBAT[v.stat]??SKILLS[v.stat]?.[0];
    const explanation=`Base ${check.base}; condições ${check.penalty}; cobertura ${check.bonus}; bônus contextual ${extraBonus}.`;
    if(v.stat==='esq') {await emit(actor,'Esquiva — defesa fixa',`<p><strong>${9+precision}</strong> = 9 + precisão ${precision}.</p><p>${esc(explanation)}</p><small>Básico p. 256. Sem rolagem.</small>`,{kind:'fixed-defense'});await app.close();return;}
    if(!Number.isFinite(precision))throw Error('Precisão inválida.');
    if(record&&record.difficulty==null&&!['sangrando'].includes(record.key)&&v.difficulty==null)throw Error('A fonte ou o mestre deve informar a dificuldade de resistência.');
    if(record?.key==='sufocamento'&&record.resolvedFor===currentTurnKey(actor))throw Error('Sufocamento já resolvido neste turno.');
    const difficulty=record?.key==='sangrando'?(v.stat==='medicina'?16:18):v.difficulty;
    if(record?.key==='sangrando'&&v.stat==='vig')await claimBleedingAttempt(actor);
    const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision,success=natural>=15||natural>3&&(difficulty==null||roll.total>=Number(difficulty));
    const testKind=record&&v.stat!=='medicina'?'resistance':v.kind,repeat=rerollOption([...performer.items??[]],{kind:testKind,stat:v.stat,natural},houseRules()),pendingResistance=record&&repeat?{actorUuid:actor.uuid,conditionId:record.id}:null;
    await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:performer}),flavor:`<strong>${esc(label)}${record?' · '+esc(record.name):''}</strong><p>${esc(explanation)}</p>${difficulty!==null&&difficulty!==undefined?`<p>Dificuldade ${esc(difficulty)}: ${success?'sucesso':'falha'}.</p>`:''}${check.camouflage?'<p>Camuflagem total: verificar 1d8 após confirmar o acerto; crítico dispensa o teste (Básico p. 273).</p>':''}`,flags:{[ID]:{kind:'summary-test',testKind,actorUuid:performer.uuid,stat:v.stat,natural,precision,difficulty,condition:record?.id,success,pendingResistance}}});
    if(check.camouflage&&v.kind==='attack'&&natural<15&&natural>3){if(difficulty!==null&&difficulty!==undefined){if(success)await checkCamouflage(performer);}else await emit(performer,'Camuflagem total pendente',`<p>Após confirmar o acerto não crítico contra a defesa do alvo:</p><button type="button" data-sns-camouflage data-actor-uuid="${esc(performer.uuid)}">Confirmar acerto e verificar camuflagem</button>`,{kind:'pending-camouflage'});}
    if(record&&!pendingResistance)await settleResistance(actor,record,success);await app.close();return;
  }
  if(op==='resolve-confusion'){owner(actor);const record=conditionRecords(actor).find(r=>r.id===data.id);if(!record)throw Error('Condição não encontrada.');return resolveConfusion(actor,record);}
  if(op==='remove-condition'){owner(actor);const record=conditionRecords(actor).find(r=>r.id===data.id);if(record)await saveCondition(actor,record,{remove:true});await app.render({force:true});return;}
  if(op==='condition-event'){owner(actor);const record=conditionRecords(actor).find(r=>r.id===data.id);if(!record)return;if(data.event==='fear-ended'&&['assustado','amedrontado','aterrorizado'].includes(record.key)||data.event==='obvious-threat'&&record.key==='fascinado')await saveCondition(actor,record,{remove:true});await app.render({force:true});return;}
  if(op==='manual-turn') {
    owner(actor);if(actor.inCombat)throw Error('Em combate, o processamento ocorre pela passagem de turno do rastreador.');
    const key=`manual:${foundry.utils.randomID()}`;await actor.update({[`flags.${ID}.currentTurnKey`]:key});const result=await processConditionPhase(actor,key,'start');await announceTurn(actor,result);await app.render({force:true});return;
  }
}
export async function announceTurn(actor,result) {
  if(!result)return;
  const prompts=[];
  for(const p of result.prompts) {
    const record=conditionRecords(actor).find(r=>r.id===p.id);if(!record)continue;
    if(p.key==='confuso')await resolveConfusion(actor,record);
    else prompts.push(`<p>${esc(CONDITIONS[p.key].name)}: teste de Vigor ${p.difficulty===null?'com dificuldade a definir pelo mestre':'contra '+p.difficulty}. <button type="button" data-sns-resist="${esc(p.id)}" data-actor-uuid="${esc(actor.uuid)}">Resolver resistência</button></p>`);
  }
  if(result.damage||prompts.length||result.expired.length)await emit(actor,'Início/fim do turno',`${result.damage?`<p>Perda contínua: ${result.damage} de vitalidade (sangramento/sufocamento).</p>`:''}${prompts.join('')}${result.expired.length?`<p>${result.expired.length} condição(ões) com duração encerrada.</p>`:''}`,{kind:'condition-phase'});
}
