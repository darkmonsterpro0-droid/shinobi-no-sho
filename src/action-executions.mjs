import {recordKey,readKeyedRecord} from './core/record-key.mjs';
import {mindBinding,canDirectMind,basicMindDefense,validMindExecution,mindCommonItems} from './yamanaka-state.mjs';
import {shadowDefense,shadowAttackBonus} from './nara.mjs';
export const actionErrorMessage=error=>error instanceof TypeError||error instanceof ReferenceError||error instanceof SyntaxError?
 'Não foi possível concluir a ação. O resultado já aplicado foi preservado; retome a execução após a correção.':String(error?.message??'Não foi possível concluir a ação.');
import {activeCoordinator,canControl,nativeAuthor,createRequestQueue,createExecutionStore,terminalExecution,decisionsComplete} from './core/execution.mjs';
// Native ChatMessage requests carry their authenticated author. Only the elected GM
// changes an execution; clients never send executable code or calculated outcomes.
import {delayBounds,delayInitiative,resumeInitiative} from './combat-initiative.mjs';
import {acceleratedOpportunityAllowed} from './acceleration.mjs';
import {eligibleEfficientTechnique,hasNinpouDomain} from './technique-aptitudes.mjs';
import {ID} from './config.mjs';
import {clanCapabilities,clearKaguraProgressive,corpulenciaPayment,canPayChakraCost} from './clan-capabilities.mjs';
import {worldProfile,worldRules} from './world-settings.mjs';
import {validatePowerPurchase,powerPlan,powerAttackResult,knownPowerEffects,elementalConfrontation,isDamagingNinpou,canCoordinateArea,canCoordinateSinglePower,techniqueCounterOutcome} from './power-rules.mjs';
import {mutateRuntime,periodKey,activeAptitudes,runtimeState,claimUsage} from './aptitude-runtime.mjs';
import {prepareWeaponAction,weaponCosts,commitWeaponCosts,weaponFingerprint,weaponDocument} from './weapon-actions.mjs';
import {declarePartnerDivisor,partnerOrigin,partnerDamageDivisor} from './partners.mjs';
import {statPrecision,derivedSummary,mentalControllerSummary,conditionRecords,saveCondition} from './automation.mjs';
import {canBlockSize,sizeProfile,sizeAttackModifier,resolveHardness} from './physical-rules.mjs';
import {inventoryEntry} from './inventory-data.mjs';
import {canGroupPower,validatePowerGroup} from './power-targets.mjs';
import {sceneAreaTargets} from './scene-area.mjs';
import {tokenDistance} from './saved-actions.mjs';
import {joinedBody,bodySource} from './body-state.mjs';
import {WEAPONS,rangePenalty} from './weapons.mjs';
import {POWER_FAMILIES,POWER_ACTION_NAMES} from './power-data.mjs';
import {resolveOpposed} from './build-rules.mjs';
import {postAttackRoll} from './combat-chat.mjs';
import {heavyBlock} from './hachimon-rules.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {availableManeuvers} from './maneuvers.mjs';
import {applyPhysicalDamage} from './physical-actions.mjs';
import {resolveWeaponAttack,prepareExtendedBlade} from './weapon-resolution.mjs';

const copy=v=>structuredClone(v),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const messages=()=>game.messages.contents??[...game.messages];
const users=()=>game.users.contents??[...game.users];
export const actionAuthority=()=>activeCoordinator(users());
const canUse=(actor,user)=>canControl(actor,user)&&!joinedBody(actor);
const canRespondDefense=(actor,user)=>mindBinding(actor)?!!user&&(user.isGM||canDirectMind(actor,user)):canUse(actor,user);
const author=message=>nativeAuthor(message,game.users);
const executionStore=createExecutionStore({namespace:ID,render:executionCard});
const execution=executionStore.read;
export const enqueueActionRequest=createRequestQueue(request=>processActionRequest(request));
export async function requestAction(command){
 const gm=actionAuthority();if(!gm)throw Error('Um mestre precisa estar conectado para coordenar esta ação. Nenhum recurso foi gasto.');
 const message=await ChatMessage.create({content:'',whisper:[...new Set([...users().filter(u=>u.isGM).map(u=>u.id),game.user.id])],flags:{[ID]:{actionRequest:copy(command),internalActionRequest:true}}});
 // The GM's own requests need not wait for the create hook to complete.
 if(gm.id===game.user.id)await enqueueActionRequest(message);
 return message;
}
// Concealed occupants are affected normally; their identities and results stay
// in the GM ledger and their controllers' own views, including message flags.
function executionView(e,include){
 const view=copy(e);view.slots=view.slots.filter(include);
 view.privatePending=!allDeclared(e);
 delete view.hasPrivateTargets;
 if(view.error)view.error='A execução precisa de conferência do mestre.';
 return view;
}
async function syncExecutionViews(message,e){
 if(!e.hasPrivateTargets)return;
 const groups=[{key:'public',include:s=>!s.hidden}];
 for(const s of e.slots.filter(s=>s.hidden))groups.push({key:s.key,include:entry=>entry.key===s.key,target:s.targetUuid});
 for(const group of groups){
  const view=executionView(e,group.include);
  const mirror=messages().find(m=>m.getFlag(ID,'executionRoot')===message.id&&m.getFlag(ID,'executionView')===group.key);
  const data={content:executionCard(view),flags:{[ID]:{actionExecution:view,executionRoot:message.id,executionView:group.key}}};
  if(mirror)await mirror.update(data);
  else{
   if(group.target){const target=await fromUuid(group.target);data.whisper=users().filter(u=>canUse(target,u)).map(u=>u.id);}
   await ChatMessage.create({...data,speaker:ChatMessage.getSpeaker({actor:await fromUuid(e.actorUuid)})});
  }
 }
}
async function persist(message,e){await executionStore.write(message,e);await syncExecutionViews(message,e);}
const slotKey=(strike,uuid)=>strike+':'+uuid;
function slot(e,strike,uuid){const s=e.slots.find(s=>s.key===slotKey(strike,uuid));if(!s)throw Error('Alvo ou golpe não pertence a esta execução.');return s;}
async function participant(e,user){const actor=await fromUuid(e.actorUuid);if(e.control&&!validMindExecution(actor,e.control))throw Error('O controle mental desta ação já terminou.');if(!canUse(actor,user)&&!(e.control&&canDirectMind(actor,user)))throw Error('Você não controla o atacante.');return actor;}
async function defending(s,user){const target=await fromUuid(s.targetUuid);if(!canRespondDefense(target,user))throw Error('Somente o controlador do defensor ou o mestre pode responder.');return target;}
function heldWeapons(target){
 return mindCommonItems(target).filter(item=>item.type==='equipment'&&item.system.equipped&&!item.system.destroyed&&
  WEAPONS.some(weapon=>weapon.key!=='unarmed'&&weapon.category!=='ammo'&&weapon.key===item.system.catalogKey&&weapon.book===item.system.catalogBook));
}
function maneuverOutcome(plan,s,attrs){
 const applied=s.applied;
 if(plan.specialManeuver==='atropelar'&&s.result){
  if(applied?.hit)return '<p>Avance em linha reta e confira o caminho no mapa.</p>';
  if(!s.result.hit&&s.defense.kind==='bloqueio'&&s.defenseRoll&&s.result.blockedAdvance)return '<p>O Bloqueio deteve o avanço. O alvo continua de pé.</p>';
 }
 if(plan.throwTarget&&applied?.conditionApplied==='Caído'){
  const thrown=s.thrown;
  if(thrown){
   const attacker=attrs+' data-attacker-control="true"';
   const follow=plan.throwTarget.followShadow&&!thrown.followed&&!thrown.landed;
   return `<p>Arremesso: ${thrown.distance} m ${thrown.direction==='up'?'para cima, com queda no fim do turno':'para trás'}.${thrown.damage!=null?' Dano de colisão: '+thrown.damage+'.':''} Posicione o alvo no mapa.</p>
    ${follow?control('Seguir Sombra','follow-shadow',attacker):''}
    ${thrown.direction==='up'&&!thrown.landed?control('Registrar queda','land-throw',attacker):''}
    ${thrown.landed?`<p>Queda registrada · dano ${thrown.landed.damage}.</p>`:''}`;
  }
  return `<p>Arremesso disponível até ${plan.throwTarget.metres} m.</p>${control('Registrar arremesso','throw-target',attrs+' data-attacker-control="true"')}`;
 }
 if(applied?.pushedMetres!=null)return `<p>Empurre até ${applied.pushedMetres} m. O atacante acompanha o alvo, respeitando o caminho e o deslocamento restante.</p>`;
 if(applied?.disarmedMetres!=null){
  const item=s.disarmedItem;
  return `<p>${item?esc(item.name)+' caiu':'O objeto escolhido cai'} a ${applied.disarmedMetres} m${applied.disarmedAway?', na direção oposta à do ataque':''}. Apanhar o objeto custa ação parcial.</p>${item?'':control('Registrar arma derrubada','disarm-item',attrs)}`;
 }
 return '';
}
function blockResponseControls(slot,attrs){
 const response=slot.blockResponse;
 if(!response)return '';
 return [
  response.disarmed?`<p>Bloquear Arma · ${esc(response.disarmed)} foi derrubada pelo bloqueio crítico.</p>`:'',
  response.projectile&&!response.caught?control('Apanhar Objeto','catch-projectile',attrs):'',
  response.caught&&!response.caught.returned?'<p>Projétil apanhado.</p>':'',
  response.caught?.returned?'<p>Projétil devolvido.</p>':'',
  response.caught?.canReturn&&!response.caught.returned?control('Devolver projétil · Livre','return-projectile',attrs):'',
  response.stealId&&!response.stolen?control('Roubar arma','steal-disarmed',attrs):'',
  response.disarm&&!response.disarmUsed?control('Bloquear Arma · tentar desarmar','block-disarm',attrs):'',
  response.counter&&!response.counterUsed?control(response.automatic?'Contragolpe · acerto automático':'Contragolpe','block-counter',attrs):'',
 ].join('');
}
function grappleControls(plan,slot,attrs){
 if(plan.condition!=='agarrado'||!slot.applied?.conditionApplied)return '';
 if(slot.grappleEnded)return `<p>Agarramento encerrado · ${esc(slot.grappleEnded)}.</p>`;
 const attacker=attrs+' data-attacker-control="true"';
 return `<p>${slot.grappleMaintained?'Agarramento mantido · o atacante arrasta o alvo ao se mover.':'Agarramento ativo.'}</p>
  ${slot.grappleEscape?`<p>Fuga ${slot.grappleEscape.escape} × ${slot.grappleEscape.hold} · ${slot.grappleEscape.result==='repeat'?'empate, repita o teste':'o alvo continua agarrado'}.</p>`:''}
  ${control('Manter (Padrão)','grapple-maintain',attacker)}
  ${plan.canImmobilize?control('Imobilizar (Padrão + Movimento)','grapple-immobilize',attacker):''}
  ${slot.immobilization?`<p>Imobilização · Vigor ${slot.immobilization.total} contra ${slot.immobilization.difficulty} · dano ${slot.immobilization.damage??0}.</p>`:''}
  ${control('Soltar (Livre)','grapple-release',attacker)}
  ${control('Definir dificuldade de Escapar','grapple-difficulty',attacker)}
  ${slot.grappleDifficultyStat?control('Usar perícia Escapar','grapple-escape',attrs+' data-stat="escapar"'):''}
  ${control('Escapar com CC','grapple-escape',attrs+' data-stat="cc"')}
  ${control('Escapar com Força','grapple-escape',attrs+' data-stat="for"')}`;
}
function replicaControls(s,attrs){
 if(s.replicaUsed){
  const {distance,stealth}=s.replicaUsed;
  return `<p>Réplica Enganadora · o clone recebeu o golpe. Afaste o defensor até ${distance} m sem provocar ataque oportuno.${stealth!=null?' Furtividade '+stealth+'.':''}</p>`;
 }
 if(!s.replicaOffer||s.applied)return '';
 return `<p>Defesa falhou por ${s.replicaOffer.margin}. Réplica Enganadora custa 4 chakra e uma ação de movimento.</p>
  ${control('Usar Réplica','replica-use',attrs)}
  ${s.replicaOffer.level>=2?control('Usar Réplica e se esconder','replica-use',attrs+' data-stealth="true"'):''}`;
}
function allDeclared(e){return decisionsComplete(e.slots,s=>s.defense&&(s.defense.kind!=='technique'||s.defense.initiated));}
const control=(label,op,extra='')=>`<button type="button" class="sns-btn" data-sns-action-command="${op}" ${extra}>${label}</button>`;
const actionTitle=e=>e.name+(e.attacks?.some(a=>a.hachimonHeavy)?' · Ataque Pesado':'');
export function executionCard(e){
 const done=terminalExecution(e.state);
 return `<div class="sns-app sns-execution"><h3>${esc(actionTitle(e))}</h3><p>${esc(e.actorName)} · ${esc(e.maneuverName??'Ataque')} · ${esc(POWER_ACTION_NAMES[e.action]??e.action??'Padrão')}</p><p role="status">${esc({declared:'Aguardando declarações de defesa',ready:'Defesas declaradas',initiating:'Ação iniciada — retomar',active:'Em resolução',complete:'Concluído',cancelled:'Preparação cancelada; custos defensivos já efetivados são preservados',interrupted:'Encerrado pelo mestre; custos e efeitos já aplicados preservados'}[e.state]??e.state)}</p>${e.error?`<p>${esc(e.error)}</p>`:''}
 ${e.ricochet?`<p>Ricochete · alvo ${e.ricochet.index+1} de ${e.ricochet.slots.length}.${e.ricochetStopped?' A sequência terminou neste alvo.':''}</p>`:''}
 <p>O ataque é revelado após a escolha da defesa.</p>${e.notes?.length?`<details><summary>Regras desta ação</summary><ul>${e.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></details>`:''}${e.slots.map(s=>{
 const result=s.result,roll=e.rolls?.[s.strike],attrs=`data-strike="${s.strike}" data-target="${esc(s.targetUuid)}"`,pending=!e.privateDefenses&&!done&&!e.started&&e.state!=='initiating';
 return `<section class="sns-block"><h4>${esc(s.name)}${e.attacks.length>1?' · golpe '+(s.strike+1):''}</h4>${e.attacks[s.strike].nui?`<p>Agulhas: ${s.projectiles} · dano base ${s.powerBase}</p>`:''}<p>${s.defense?'Defesa: '+esc({esquiva:s.defense.risk?'Esquiva de Risco':s.defense.perceptive?'Esquiva Perceptiva':'Esquiva',bloqueio:s.defense.weaponId==='unarmed'?'Bloqueio desarmado':'Bloqueio',antecipar:s.defense.evade?'Evadir':'Antecipar',technique:s.defense.kaiten?'Kaiten defensivo':'Defender com técnica',rebater:'Rebater Projétil','cancel-technique':'Anular Técnica',manual:'Conferência do mestre',none:e.attacks[s.strike].hachimonHeavy?.fatal?'Ataque indefensável':'Sem reação disponível'}[s.defense.kind])+` · declarada por ${esc(s.defense.byName)}`:'Defesa ainda não declarada.'}</p>${pending?`<div class="sns-toolbar">${['esquiva','bloqueio','antecipar','technique'].map(k=>control({esquiva:'Esquiva',bloqueio:'Bloqueio',antecipar:'Antecipar',technique:'Defender com técnica'}[k],'defense',attrs+` data-defense="${k}"`)).join('')}${control('Esquiva Perceptiva','defense',attrs+' data-defense="esquiva" data-perceptive="true"')}${control('Registrar exceção (mestre)','defense',attrs+' data-defense="manual" data-gm-only="true"')}</div>`:''}${s.defense?.kaiten&&!done?`<p>Kaiten defensivo · ${s.defense.kaitenLevel} chakra · ação ${s.defense.kaitenArea?'padrão':'parcial'}.</p>${!e.started&&!s.defense.initiated?control('Iniciar Kaiten','technique-started',attrs):''}`:s.defense?.barrier&&!done?`<p>Barreira · ${s.defense.barrierCost??3} chakra · dureza ${s.defense.barrierHardness}.</p>${!e.started&&!s.defense.initiated?control('Erguer Barreira','technique-started',attrs):''}`:s.defense?.kind==='technique'&&!done?`<p>Técnica: ${esc(s.defense.techniqueName)}. Execute seus custos e efeitos pelos controles existentes; a confirmação abaixo não os executa novamente. Os custos de início são devidos mesmo se a execução falhar.</p>${!e.started&&!s.defense.initiated?control('Confirmar início e custos da técnica','technique-started',attrs):''}<button type="button" class="sns-btn" data-sns-open-defense-technique="${esc(s.key)}">Abrir técnica defensiva</button>`:''}${roll?`<p>Ataque: ${(s.repeatedAttack?.total??roll.total)+shadowAttackBonus(e.attacks[s.strike],s.targetUuid)}${s.defenseRoll?' · Defesa rolada: '+s.defenseRoll.total:''}</p>`:''}${!done&&roll&&!result?(s.tiePending?control('Repetir confronto empatado','repeat',attrs):control('Resolver defesa','defend',attrs)):''}${result?`<p>${result.redirectedToReplica?'Golpe desviado para a réplica':result.hit?'Acerto confirmado':'Ataque defendido ou fracassado'}${s.applied?(s.applied.camouflage?.passed===false?(s.applied.camouflage.reason==='Zui Quan'?' · falhou contra Zui Quan':' · impedido pela camuflagem'):' · resultado aplicado'):''}</p>`:''}${result?.kaiten?`<p>Barreira do Kaiten: dureza ${result.kaiten.hardness} · dano base excedente ${result.kaiten.excess}.${result.kaiten.area?' Use o cartão do giro de resposta para conferir criaturas próximas.':''}</p>`:''}${result?.barrier?`<p>Barreira: dureza ${result.barrier.hardness} · dano base excedente ${result.barrier.excess}.</p>`:''}${s.efficientOffer&&!s.replicaOffer&&!s.efficientDecision&&!s.applied&&!done?
 control('Técnica Eficiente · Movimento','efficient-damage',attrs+' data-attacker-control="true" data-efficient="true"')+
 control('Aplicar grau original','efficient-damage',attrs+' data-attacker-control="true"'):''}
 ${s.efficientDecision?.natural!=null?`<p>Técnica Eficiente · 2d8: ${s.efficientDecision.natural}. Maior grau mantido.</p>`:''}
 ${needsApplication(result)&&!s.applied&&!done&&(!s.efficientOffer||s.efficientDecision||s.replicaOffer)?control(s.replicaOffer?'Receber o ataque':result.tenketsuOnly?'Aplicar teste de Vigor do Tenketsu':'Conferir e aplicar consequência','apply',attrs):''}${result?.tenketsuOnly?`<p>Bloqueio bem-sucedido. ${s.applied?'Teste de Vigor aplicado.':'Teste de Vigor pendente pelo contato das mãos.'}</p>`:result&&!result.hit&&!s.applied?.hit||s.applied?.camouflage?.passed===false?'':s.applied?`<p>Dano aplicado: ${s.applied.damage??0}${s.applied.mercy?` · ${s.applied.mercy.resistance!=null?'Vigor '+s.applied.mercy.resistance+' contra 10 · ':''}${{resistiu:'resistiu',kill:'morto',knockout:'nocauteado'}[s.applied.mercy.outcome]}${s.applied.mercyReview?' · mestre: encerre o efeito que deixou o alvo indefeso':''}`:''}${s.progressive?' · Progressivo: +'+s.progressive.bonus+' de dano base'+(s.progressive.automatic?' (automático)':s.progressive.extraDefenseTotal!=null?' (defesa dos extras '+s.progressive.extraDefenseTotal+')':''):''}${s.applied.shadowFallDamage!=null?' · Queda: '+s.applied.shadowFallDamage:''}${s.applied.conditionApplied?' · '+esc(s.applied.conditionApplied):''}${s.applied.sealedChakra?` · Chakra selado: ${s.applied.sealedChakra}`:''}${s.applied.drainedChakra?` · Chakra drenado: ${s.applied.drainedChakra}`:''}</p>`:''}${maneuverOutcome(e.attacks[s.strike],s,attrs)}${blockResponseControls(s,attrs)}${s.applied?.disarmedMetres!=null&&!s.stolen&&s.canSteal?control('Roubar','steal-after-disarm',attrs+' data-attacker-control="true"'):''}${s.stolen?'<p>Item tomado: '+esc(s.stolen)+'.</p>':''}${grappleControls(e.attacks[s.strike],s,attrs)}${replicaControls(s,attrs)}${result?.cancelledTechnique?'<p>Técnica anulada.</p>':''}${result?.counterExcess>0&&!s.counterExecution?control('Superar Técnica · Movimento','overcome-technique',attrs):''}${s.inlineFeint?`<p>${esc(s.inlineFeint.name)} · ${s.inlineFeint.used?'Finta já usada na rodada.':`Agilidade ${s.inlineFeint.attack} × Prontidão ${s.inlineFeint.defense}.${s.inlineFeint.success?' −2 na defesa.':' Finta falhou.'}`}</p>`:s.feint?'<p>Finta · −2 na defesa deste golpe.</p>':''}${s.defense?.evade&&s.result?`<p>${s.result.hit?'Evadir falhou. Deslocamento interrompido.':'Evadir funcionou. Mova o defensor no mapa e confira cobertura e outros adversários no caminho.'}</p>`:''}</section>`;
 }).join('')}<div class="sns-toolbar">${!done&&!e.privatePending&&allDeclared(e)&&e.attacks.some((_,i)=>!e.rolls[i])?control(e.state==='initiating'?'Retomar início':'Rolar próximo ataque','attack'):''}${!done&&!e.started&&e.state!=='initiating'?control('Cancelar preparação','cancel'):''}${!done?control('Atualizar / retomar','refresh')+control('Encerrar execução (mestre)','interrupt','data-gm-only="true"'):
 e.state==='complete'&&e.ricochet&&e.ricochet.index+1<e.ricochet.slots.length&&!e.ricochetStopped&&!e.ricochetNext?
  control('Retomar Ricochete','refresh'):''}</div></div>`;
}
export async function processActionRequest(request){
 if(actionAuthority()?.id!==game.user.id)return;
 let command=request.getFlag(ID,'actionRequest');if(!command||request.getFlag(ID,'actionRequestDone'))return;
 const user=author(request);if(!user)throw Error('Autor do pedido não encontrado.');
 try{
  let mindDeclaration,mindOperation;
  if(command.op==='mind-ability'){
   const source=await fromUuid(command.actorUuid),{executeControlledAbility}=await import('./yamanaka-actions.mjs');
   const result=await executeControlledAbility(source,command,{user,requestId:request.id});
   mindOperation=result?.control;command=result?.declaration??{op:'mind-cancelled'};
  }
  if(command.op==='mind-declare'){
   const source=await fromUuid(command.actorUuid),{controlledWeaponCommand}=await import('./yamanaka-control.mjs');
   mindDeclaration=await controlledWeaponCommand(source,command,{user,requestId:request.id});
   command=mindDeclaration??{op:'mind-cancelled'};
  }
  if(command.op==='mind-cancelled'){
   // The book cancels before a suicidal action; there is no attack to declare.
  }else if(command.op==='retry-request'){
   const previous=game.messages.get(command.requestId),previousAuthor=previous&&author(previous);
   if(!previous?.getFlag(ID,'actionRequestFailed')||!previousAuthor||!user.isGM&&previousAuthor.id!==user.id||previous.getFlag(ID,'actionRequest')?.op==='retry-request')
    throw Error('Somente o solicitante ou o mestre pode retomar esta ação.');
   await previous.update({[`flags.${ID}.actionRequestDone`]:false,[`flags.${ID}.actionRequestFailed`]:false});
   await processActionRequest(previous);
  }else if(command.op==='mind-effect'){
   const source=await fromUuid(command.actorUuid),{controlledEffect}=await import('./yamanaka-actions.mjs');await controlledEffect(source,command,{user,requestId:request.id});
  }else if(command.op==='mind-sensor'){
   const source=await fromUuid(command.actorUuid),{controlledMindSensor}=await import('./yamanaka-actions.mjs');await controlledMindSensor(source,command,{user,requestId:request.id});
  }else if(command.op==='mind-test'){
   const source=await fromUuid(command.actorUuid),{rollControlledTest}=await import('./yamanaka-actions.mjs');await rollControlledTest(source,command,{user,requestId:request.id});
  }else if(command.op==='mind-reflection'){
   const body=await fromUuid(command.actorUuid);
   if(!canControl(body,user))throw Error('Você não controla o corpo que recebeu este dano.');
   const {settleMindDamage}=await import('./yamanaka-damage.mjs');await settleMindDamage(body,String(command.sourceId));
  }else if(command.op==='mind-evasion'){
   const actor=await fromUuid(command.actorUuid),{chooseMindEvasion}=await import('./yamanaka-transfer.mjs');
   await chooseMindEvasion(actor,command,{user,requestId:request.id});
  }else if(command.op==='mental-control'){
   const actor=await fromUuid(command.actorUuid),{activateMentalControl}=await import('./yamanaka-control.mjs');
   await activateMentalControl(actor,actor?.items.get(command.itemId),command,{user,requestId:request.id});
  }else if(command.op==='mind-move'||command.op==='mind-ready'){
   const source=await fromUuid(command.actorUuid),controls=await import('./yamanaka-control.mjs');
   await controls[command.op==='mind-move'?'moveControlledBody':'readyControlledWeapon'](source,command,{user,requestId:request.id});
  }else if(command.op==='mind-nature'){
   const source=await fromUuid(command.actorUuid),{resolveMindNature}=await import('./yamanaka-control.mjs');
   await resolveMindNature(source,command,{user,requestId:request.id});
  }else if(command.op==='capability'){
   const actor=await fromUuid(command.actorUuid);if(!canUse(actor,user))throw Error('Você não controla este personagem.');
   const {processCapabilityCommand}=await import('./capability-actions.mjs');
   await processCapabilityCommand(actor,command,{user,requestId:request.id});
  }else if(['delay-initiative','resume-initiative'].includes(command.op)){
   const combat=game.combats.get(command.combatId),combatant=combat?.combatants.get(command.combatantId);
   if(combat?.round!==command.round||!canUse(combatant?.actor,user))throw Error('Turno indisponível.');
   if(command.op==='resume-initiative')await resumeInitiative(combat,combatant);
   else{
    const waiting=command.waiting===true,value=waiting?delayBounds(combat,combatant)?.min:command.value;
    await delayInitiative(combat,combatant,value,{waiting});
   }
  }else if(command.op==='feint'||command.op==='flechas-feint'){
   const actor=await fromUuid(command.actorUuid),target=bodySource(await fromUuid(command.targetUuid));
   if(!canUse(actor,user)&&mindOperation?.bodyUuid!==actor?.uuid)throw Error('Você não controla este personagem.');
   const scene=game.scenes?.get?.(user.viewedScene);
   const visible=scene?.tokens?.some(token=>!token.hidden&&token.actor?.uuid===target?.uuid);
   if(!target||target.uuid===actor.uuid||!user.isGM&&!visible&&!target.testUserPermission?.(user,'OBSERVER'))
    throw Error('Alvo da Finta indisponível.');
   if(command.op==='flechas-feint'){
    const item=actor.items.get(command.itemId),context={actor,...clanContext()};
    if(item?.type!=='power')throw Error('Poder Flechas indisponível.');
    const plan=powerPlan(item,actor.system,[...actor.items],{effect:'flechas',mode:'feint',level:command.level,tier:command.tier},context);
    if(!plan.feint||activeAptitudes(actor)['estilo-zui-quan']||command.domain===true&&!hasNinpouDomain([...actor.items],plan.family,context.rules))
     throw Error('Domínio Ninpou indisponível para esta Finta.');
    if(command.distance!=null&&(!Number.isFinite(command.distance)||command.distance<0||command.distance>plan.range))
     throw Error('O alvo está fora do alcance da Finta de Flechas.');
    await executeFeint(actor,target,user,request.id,{flechas:plan,domain:command.domain===true,convertedChakra:command.convertedChakra});
   }else await executeFeint(actor,target,user,request.id,{accelerated:command.accelerated===true});
  }else if(command.op==='shinobi-fascinar'){
   let actor=await fromUuid(command.actorUuid);const target=bodySource(await fromUuid(command.targetUuid));
   if(!canUse(actor,user)&&mindOperation?.bodyUuid!==actor?.uuid)throw Error('Você não controla este personagem.');
   if(mindOperation){const {mindActorView}=await import('./yamanaka-actions.mjs');actor=mindActorView(actor);}
   const scene=game.scenes?.get?.(user.viewedScene);
   const visible=scene?.tokens?.some(token=>!token.hidden&&token.actor?.uuid===target?.uuid);
   if(!target||!user.isGM&&!visible&&!target.testUserPermission?.(user,'OBSERVER'))throw Error('Alvo não encontrado ou sem visibilidade.');
   const {resolveFascinar}=await import('./aptitude-use.mjs');
   await resolveFascinar(actor,target,actor.items.get(command.itemId),request.id,command.distance,{hypnotic:command.hypnotic===true,eyeContact:command.eyeContact===true,convertedChakra:Number(command.convertedChakra??0)});
   if(mindOperation?.againstNature){const binding=mindBinding(actor),{resolveMindNature}=await import('./yamanaka-control.mjs');if(binding)await resolveMindNature(binding.source,{id:binding.root.id,bodyUuid:actor.uuid,againstNature:true},{user,requestId:'ability:'+request.id});}
  }else if(command.op==='falange'){
   await resolveFalange(command,user);
  }else if(command.op==='assisted-technique-counter'){
   await resolveAssistedTechniqueCounter(command,user);
  }else if(command.op==='hachimon-open'){
   const actor=await fromUuid(command.actorUuid),{activateHachimon}=await import('./power-actions.mjs');
   await activateHachimon(actor,actor?.items.get(command.itemId),command,{user,requestId:request.id});
  }else if(command.op==='mental-network'){
   const actor=await fromUuid(command.actorUuid);
   const {activateMentalNetwork}=await import('./power-actions.mjs');
   await activateMentalNetwork(actor,actor?.items.get(command.itemId),command,{user,requestId:request.id});
  }else if(command.op==='nara-guide'||command.op==='nara-guide-release'){
   const actor=await fromUuid(command.actorUuid);
   const {activateGuidedShadow,releaseGuidedLink}=await import('./power-actions.mjs');
   if(command.op==='nara-guide')await activateGuidedShadow(actor,actor?.items.get(command.itemId),command,{user,requestId:request.id});
   else await releaseGuidedLink(actor,command.executionId,{user});
   }else if(command.op==='nara-pull'){
   const actor=await fromUuid(command.actorUuid),{pullShadowVictim}=await import('./nara-movement.mjs');
   await pullShadowVictim(actor,command,{user,requestId:request.id});
  }else if(command.op==='nara-strangle'){

   const actor=await fromUuid(command.actorUuid);
   const {activateShadowStrangle}=await import('./power-actions.mjs');
   await activateShadowStrangle(actor,actor?.items.get(command.itemId),command,{user,requestId:request.id});
  }else if(['inuzuka-fusion','inuzuka-fusion-end','inuzuka-fusion-resume'].includes(command.op)){
   const actor=await fromUuid(command.actorUuid);
   if(!canUse(actor,user))throw Error('Você não controla o Inuzuka.');
   const {activateInuzukaFusion,endPower,resumeInuzukaFusion}=await import('./power-actions.mjs');
   if(command.op==='inuzuka-fusion')await activateInuzukaFusion(actor,actor.items.get(command.itemId),command,{user,requestId:request.id});
   else if(command.op==='inuzuka-fusion-end')await endPower(actor,command.id);
   else await resumeInuzukaFusion(actor,command.id,{user});
  }else if(command.op==='partner-plan'){
   const actor=await fromUuid(command.actorUuid),origin=actor&&partnerOrigin(actor);
   if(!canUse(actor,user)||!canUse(origin,user))throw Error('Você não controla o grupo de parceiros.');
   await declarePartnerDivisor(actor,Number(command.divisor));
  }else if(command.op==='end-power'){
   const actor=await fromUuid(command.actorUuid),active=actor?.system.powerState?.active?.find(a=>a.id===command.id);
   if(!canUse(actor,user)||active?.linkedTo&&active.sourceUuid!==actor.uuid&&!user.isGM)
    throw Error('Somente o conjurador ou o mestre pode encerrar este efeito sem tentativa de saída.');
   if(active?.mentalStun&&!user.isGM)throw Error('Este Atordoado dura até o fim do próximo turno do Yamanaka.');
   if(active?.hachimonRecovery&&!user.isGM)throw Error('O cansaço dos Portões termina pela duração ou por conferência do mestre.');
   const {endPower}=await import('./power-actions.mjs');await endPower(actor,command.id);
  }else if(command.op==='declare-power'){
   const actor=await fromUuid(command.actorUuid);
   if(!canUse(actor,user)&&mindOperation?.bodyUuid!==actor?.uuid)throw Error('Você não controla este personagem.');
   const pending=actor.system.powerState?.executions?.[command.powerExecutionId];
   const item=actor.items.get(command.itemId),plan=pending?.plan;
   const area=canCoordinateArea(plan)&&!!pending.options?.areaRegion;
   const group=canGroupPower(plan)&&!!pending.options?.powerGroup;
   if(item?.type!=='power'||!area&&!group&&!canCoordinateSinglePower(plan)||pending.options?.id!==item.id)
    throw Error('Declaração de poder indisponível.');
   let declared=messages().find(m=>{const e=execution(m);return e?.actorUuid===actor.uuid&&e.powerExecutionId===command.powerExecutionId;});
   if(!declared){
    const scene=game.scenes?.get?.(user.viewedScene);
    let slots;
    if(area){
     if(scene?.id!==pending.options.areaScene||!scene.tokens.some(token=>token.actor?.uuid===actor.uuid))
      throw Error('A área e o atacante precisam estar na cena atual.');
     const snapshot=sceneAreaTargets(scene,pending.options.areaRegion);
     const targets=[...new Map((snapshot??[]).filter(t=>t.actorUuid!==actor.uuid).map(t=>[t.actorUuid,t])).values()];
     const origins=[...scene.tokens].filter(token=>token.actor?.uuid===actor.uuid);
     const tokens=new Map([...scene.tokens].map(token=>[token.uuid,token]));
     slots=targets.map(t=>{
      const token=tokens.get(t.tokenUuid);
      const distance=origins.length===1&&token?.getCenterPoint&&origins[0].getCenterPoint?
       scene.grid.measurePath([origins[0].getCenterPoint(),token.getCenterPoint()]).distance:null;
      return {key:slotKey(0,t.actorUuid),strike:0,targetUuid:t.actorUuid,tokenUuid:t.tokenUuid,name:t.name,
       distance:Number.isFinite(distance)?distance:null,areaFraction:t.areaFraction,hidden:t.hidden};
     });
    }else if(group){
     if(scene?.id!==pending.options.groupScene)throw Error('Os alvos precisam estar na cena atual.');
     slots=validatePowerGroup(scene,actor,plan,pending.options.powerGroup,pending.options.groupOrigin)
      .map(t=>({...t,key:slotKey(0,t.targetUuid),strike:0}));
    }else{
     const uuid=pending.options.targetUuid,target=uuid&&await fromUuid(uuid);
     const visible=scene?.tokens?.some(t=>!t.hidden&&t.actor?.uuid===uuid);
     if(!target||target.uuid===actor.uuid||!user.isGM&&!visible&&!target.testUserPermission?.(user,'OBSERVER'))
      throw Error('Alvo não encontrado ou sem visibilidade.');
     const distance=pending.options.distance??null;
     if(distance!==null&&(!Number.isFinite(distance)||distance<0||distance>plan.range))throw Error('O alvo está fora do alcance da técnica.');
     slots=[{key:slotKey(0,uuid),strike:0,targetUuid:uuid,name:target.name,distance}];
    }
    const ricochet=group&&plan.effect==='ricochete'?{rootId:command.powerExecutionId,index:0,slots}:null;
    if(ricochet)slots=slots.slice(0,1);
    const attack={...copy(plan),base:plan.damage,element:plan.element??plan.family,ranged:plan.stat==='cd',critical:plan.critical??15,cannotBlock:plan.noBlock};
    const e={schemaVersion:1,...(pending.control?{control:copy(pending.control)}:{}),requestId:request.id,actorUuid:actor.uuid,actorName:actor.name,itemId:item.id,powerExecutionId:command.powerExecutionId,options:{},name:plan.name,state:'declared',started:false,privateDefenses:true,quickResolution:command.quickResolution===true,slots,powerArea:area,powerGroup:group,...(ricochet?{ricochet}:{}),attacks:[attack],rolls:{},notes:plan.notes,action:plan.action};
    e.hasPrivateTargets=e.slots.some(s=>s.hidden);
    declared=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),...(e.hasPrivateTargets?{whisper:users().filter(u=>u.isGM).map(u=>u.id)}:{}),content:executionCard(e),flags:{[ID]:{actionExecution:e}}});
   }
   await syncExecutionViews(declared,execution(declared));
   await publishDefenseInvitations(declared);
  }else if(command.op==='declare'){
   const existing=messages().find(m=>m.getFlag(ID,'actionExecution')?.requestId===request.id);
   let declared=existing;
   if(!declared){
    const actor=await fromUuid(command.actorUuid);if(!canUse(actor,user)&&!mindDeclaration)throw Error('Você não controla este personagem.');
    if(mindBinding(actor)&&!mindDeclaration)throw Error('Execute a ação pelo controle do Yamanaka.');
    if(!mindDeclaration)partnerDamageDivisor(actor);
    const p=prepareWeaponAction(actor,command.itemId,command.options),groups=command.targets;
    if(!Array.isArray(groups)||groups.length!==p.attacks.length||groups.some(g=>!Array.isArray(g)||!g.length||g.length>100))throw Error('Informe os alvos de cada golpe.');
    const wide=['ataque-giratorio','chute-giratorio'].includes(command.options.maneuver)||p.plan.sizeSweep;
    if(!wide&&groups.some(g=>g.length!==1))throw Error('Este golpe exige um alvo.');
    if(p.plan.octogram&&groups.some(g=>g.length!==1||g[0]!==groups[0][0]))throw Error('Os três golpes do Octograma exigem o mesmo alvo.');
    if(p.plan.fusionTwoHeads&&groups.some(g=>g.length!==1||g[0]!==groups[0][0]))throw Error('O ataque extra da união exige o mesmo alvo do Golpear básico.');
    const distances=command.distances;
    if(distances!==undefined&&(!Array.isArray(distances)||distances.length!==groups.length||distances.some((group,i)=>!Array.isArray(group)||group.length!==groups[i].length||group.some(d=>d!==null&&(!Number.isFinite(d)||d<0)))))throw Error('Medidas de alcance inválidas.');
    const attacks=p.attacks.map((attack,i)=>{
     const measured=distances?.[i].filter(d=>d!==null)??[];
     if(!measured.length)return attack;
     return prepareWeaponAction(actor,command.itemId,{...command.options,distance:Math.max(...measured)}).attacks[i];
    });
    const slots=[];for(let i=0;i<groups.length;i++)for(const uuid of new Set(groups[i])){
     const target=await fromUuid(uuid);const scene=game.scenes?.get?.(user.viewedScene);const visibleToken=scene?.tokens?.some(t=>!t.hidden&&t.actor?.uuid===uuid);if(!target||(!user.isGM&&!visibleToken&&!target.testUserPermission?.(user,'OBSERVER')))throw Error('Alvo não encontrado ou sem visibilidade.');
     if(p.plan.specialManeuver==='derrubar'&&derivedSummary(target).state.keys.includes('caido'))throw Error('Derrubar exige um alvo de pé.');
     if(command.options.maneuver==='ataque-oportuno'&&!acceleratedOpportunityAllowed(derivedSummary(actor).acceleration.rank,derivedSummary(target).acceleration.rank))
      throw Error('O alvo acelerado só permite ataque oportuno de um adversário com aceleração igual ou superior.');
     const slot={key:slotKey(i,uuid),strike:i,targetUuid:uuid,name:target.name,distance:distances?.[i][groups[i].indexOf(uuid)]??command.options.distance??null};
     if(p.plan.mercy){
      validateMercyTarget(target);
      slot.defense={kind:'none',byName:'Golpe de Misericórdia'};
      slot.mercyCauses=conditionRecords(target).filter(record=>!record.automatic&&['indefeso','paralisado','inconsciente','fora-combate'].includes(record.key)).map(record=>record.id);
     }
     slots.push(slot);
    }
    const {MANEUVERS}=await import('./maneuvers.mjs');
    const e={schemaVersion:1,...(mindDeclaration?{control:copy(mindDeclaration.control)}:{}),requestId:request.id,actorUuid:actor.uuid,actorName:actor.name,itemId:command.itemId,options:copy(command.options),name:p.plan.mercy?'Golpe de Misericórdia':p.plan.kyoudoPreparation?'Kyoudo Kyouka':p.plan.naturalWeapon?'Garras e mordida':p.plan.kidaichuu?'Kidaichuu':p.plan.insectDrain?'Kikaichuu':p.plan.octogram?.name??(p.plan.twinLionsId?'Punho dos Leões Gêmeos':p.plan.juuken?'Juuken':p.item.name),maneuverName:MANEUVERS[p.opts.maneuver??'golpear'],state:p.plan.mercy?'ready':'declared',started:false,privateDefenses:true,quickResolution:!!p.plan.mercy||command.quickResolution===true,slots,attacks:copy(attacks),rolls:{},notes:p.plan.notes,action:p.plan.action,fingerprint:weaponFingerprint(actor,command.itemId,command.options)};
    // A declaration is public by explicit use; no private defender statistics are stored here.
    declared=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(e),flags:{[ID]:{actionExecution:e}}});
   }
   const executionData=execution(declared);
   if(executionData.attacks[0]?.mercy){
    const actor=await fromUuid(executionData.actorUuid);
    if(!executionData.rolls[0]&&!terminalExecution(executionData.state))await rollAndResolveAttack(declared,executionData,actor);
    else if(executionData.rolls[0]&&!executionData.slots[0].applied)await applyQuickResult(declared,executionData,executionData.slots[0]);
   }else if(executionData.privateDefenses)await publishDefenseInvitations(declared);
  }else{
   const requested=game.messages.get(command.executionId),rootId=requested?.getFlag(ID,'executionRoot');
   const message=rootId&&author(requested)?.isGM?game.messages.get(rootId):requested,e=message&&execution(message);if(!e||!message.author?.isGM&&!author(message)?.isGM)throw Error('Execução não encontrada ou sem autoridade do mestre.');
   const controlledTarget=command.targetUuid?await fromUuid(command.targetUuid):null;
   if((e.control?.mode==='disorder'||mindBinding(controlledTarget)?.root.mentalControl.mode==='disorder')&&
    !['attack','defense','defend','apply','refresh','repeat','cancel','interrupt'].includes(command.op))
    throw Error('Desordem Mental permite somente ataques comuns e reações básicas.');
   if(command.op==='catch-projectile'||command.op==='return-projectile'){
    const s=slot(e,command.strike,command.targetUuid),actor=await defending(s,user);
    await handleCaughtProjectile(message,e,s,actor,command);
   }else if(command.op==='steal-disarmed'||command.op==='steal-after-disarm'){
    const s=slot(e,command.strike,command.targetUuid),fromBlock=command.op==='steal-disarmed';
    const actor=fromBlock?await defending(s,user):await participant(e,user);
    await stealDisarmed(message,e,s,actor,command,fromBlock);
   }else if(command.op==='block-counter'||command.op==='block-disarm'){
    const s=slot(e,command.strike,command.targetUuid),actor=await defending(s,user);
    await launchBlockResponse(message,e,s,actor,command.op==='block-counter'?'counter':'disarm');
   }else if(command.op==='follow-shadow'||command.op==='land-throw'){
    const s=slot(e,command.strike,command.targetUuid),actor=await participant(e,user);
    if(command.op==='follow-shadow')await followShadow(message,e,s,actor,command);
    else await landThrow(message,e,s,command.height);
   }else if(command.op==='throw-target'){
    const s=slot(e,command.strike,command.targetUuid);
    await participant(e,user);
    await recordThrow(message,e,s,command);
   }else if(['grapple-maintain','grapple-release','grapple-escape','grapple-difficulty','grapple-immobilize'].includes(command.op)){
    const s=slot(e,command.strike,command.targetUuid);
    if(command.op==='grapple-escape')await defending(s,user);
    else await participant(e,user);
    await resolveGrapple(message,e,s,{...command,requestId:request.id});
   }else if(command.op==='replica-use'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);
    await useReplica(message,e,s,target,command.stealth===true,Number(command.convertedChakra??0));
   }else if(command.op==='disarm-item'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);
    if(s.applied?.disarmedMetres==null||s.disarmedItem)throw Error('Não há uma arma derrubada para registrar.');
    const item=heldWeapons(target).find(item=>item.id===command.itemId);
    if(!item)throw Error('A arma escolhida já não está equipada.');
    await item.update({'system.equipped':false});
    s.disarmedItem={id:item.id,name:item.name};
    await persist(message,e);
   }else if(command.op==='overcome-technique'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);
    await launchTechniqueCounter(message,e,s,target);
   }else if(terminalExecution(e.state)){
    if(command.op!=='refresh')throw Error('Esta execução já foi encerrada.');
    await participant(e,user);
    if(e.state==='complete'&&e.ricochet)await advanceRicochet(message,e);
   }
   else if(command.op==='cancel'){
    await participant(e,user);if(e.started||e.state==='initiating')throw Error('A ação já iniciou; os custos não podem ser cancelados automaticamente.');e.state='cancelled';await persist(message,e);
   }else if(command.op==='interrupt'){
    if(!user.isGM)throw Error('Somente o mestre pode encerrar uma execução iniciada.');e.state='interrupted';e.interruptedBy=user.id;await persist(message,e);
   }else if(command.op==='technique-started'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);
    if(e.started||s.defense?.kind!=='technique')throw Error('Não há início defensivo pendente.');
    if(s.defense.barrier)await beginBarrier(target,e,s,message.id+':'+s.key);
    if(s.defense.kaiten){
     if(s.defense.kaitenArea&&!s.defense.kaitenCounter){
      const item=target.items.get(s.defense.techniqueId);
      const plan=powerPlan(item,target.system,mindCommonItems(target),{effect:'kaiten-offense',level:s.defense.kaitenLevel},{actor:target,...clanContext()});
      s.defense.kaitenCounter={
       ...plan,effect:'kaiten-counter',name:'Kaiten defensivo · Giro de resposta',cost:0,resistances:[]
      };
     }
     await beginKaiten(target,s.defense,message.id+':'+s.key);
    }
    s.defense.initiated=true;s.defense.initiatedBy=user.id;await closeDefenseDeclaration(message,e);
   }else if(command.op==='defense'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);if((s.defense?.initiated||e.privateDefenses&&s.defense)&&!user.isGM)throw Error('A defesa já foi declarada. O mestre pode conferir uma troca antes dos dados, preservando os custos já pagos.');if(e.started||e.rolls[s.strike])throw Error('As defesas já estão fechadas para esta execução.');
    if(!['esquiva','bloqueio','antecipar','rebater','technique','cancel-technique','manual','none'].includes(command.kind))throw Error('Defesa inválida.');
    if(!basicMindDefense(target,command))throw Error('Desordem Mental permite somente reações básicas.');
    if(command.kind==='manual'&&!user.isGM)throw Error('Somente o mestre registra uma exceção manual.');
    const noReactions=derivedSummary(target).state.noReactions;
    const heavyFatal=!!e.attacks[s.strike].hachimonHeavy?.fatal;
    if(heavyFatal&&!['none','manual'].includes(command.kind))throw Error('O Ataque Pesado do oitavo Portão não permite defesa, inclusive com técnicas.');
    if(!shadowDefense(e.attacks[s.strike],derivedSummary(target).state,command,target.uuid).allowed)
     throw Error('Esta defesa não é permitida contra a técnica das sombras nesta situação.');
    if(command.kind==='esquiva'&&e.attacks[s.strike].noDodge)throw Error('Este efeito não permite Esquiva.');
    if(command.kind==='none'&&!noReactions&&!heavyFatal)throw Error('O alvo ainda pode reagir.');
    if(!['manual','none'].includes(command.kind)&&noReactions)throw Error('A condição atual impede esta defesa.');
    if(command.kind==='bloqueio'){
     const source=await fromUuid(e.actorUuid);
     if(!blockingOptions(target,source,e,s).some(option=>option.id===command.weaponId))throw Error('Bloqueio não permitido com essa arma neste ataque.');
    }
    if(command.kind==='technique'&&s.strike>0&&!fusionExecution(e))throw Error('Ataque Múltiplo permite técnica defensiva somente no primeiro golpe.');
    const technique=command.kind==='technique'?mindCommonItems(target).find(i=>i.id===command.techniqueId):null;
    if(command.kind==='technique'&&(!technique||!['power','technique','aptitude'].includes(technique.type)))throw Error('Escolha a técnica defensiva da ficha.');
    const barrier=command.barrier===true;
    const barrierPlan=barrier&&command.kind==='technique'?barrierOption(target,technique,e,s,{
     level:command.barrierLevel??3,extra:command.barrierExtra??0,converted:Number(command.convertedChakra??0)
    }):null;
    if(barrier&&!barrierPlan)throw Error('Esta Barreira não está disponível para o ataque.');
    const kaiten=command.kaiten===true;
    if(barrier&&kaiten)throw Error('Escolha uma única técnica defensiva.');
    if(e.privateDefenses&&command.kind==='technique'&&!barrier&&!kaiten&&!user.isGM)throw Error('O mestre precisa conferir técnicas defensivas fora das opções da ficha.');
    const evade=command.evade===true;
    if(evade&&(command.kind!=='antecipar'||!canEvade(e,s,target)))throw Error('Evadir exige que o defensor possa se deslocar com uma ação de movimento.');
    const perceptive=command.perceptive===true,risk=command.risk===true;
    if(risk&&(command.kind!=='esquiva'||perceptive||!aptitudeOwned(mindCommonItems(target),'esquiva-de-risco','',worldRules())))
     throw Error('Esquiva de Risco exige a aptidão e é uma reação separada.');
    if(kaiten){
     if(command.kind!=='technique')throw Error('Kaiten exige Defender com Técnica.');
     kaitenDefense(target,technique,command.kaitenLevel);
    }
    if(perceptive&&(command.kind!=='esquiva'||!clanCapabilities(target,clanContext()).sharingan))throw Error('Esquiva Perceptiva exige Sharingan ativo.');
    if(command.kind==='rebater'){
     const source=await fromUuid(e.actorUuid),option=projectileParries(target,source,e,s).find(o=>o.id===command.projectileId);
     if(s.defense||!option)throw Error('Rebater Projétil indisponível.');
     await spendParry(target,option,message.id+':'+s.key);
    }
    const counter=command.kind==='cancel-technique'?counterOptions(target,slotPowerPlan(e.attacks[s.strike],s),s.distance).find(o=>o.key===command.counterKey):null;
    if(command.kind==='cancel-technique'){
     if(!counter||counter.confirm&&!command.compatible||s.defense)throw Error('A técnica escolhida não pode anular este ataque.');
     await payTechniqueCounter(target,counter,message.id+':'+s.key,Number(command.convertedChakra??0));
    }
    s.defense={kind:command.kind,convertedChakra:Number(command.convertedChakra??0),...(counter?{counter}:{}),...(barrierPlan?{barrier:true,barrierHardness:barrierPlan.hardness,barrierElement:barrierPlan.family,barrierLevel:barrierPlan.level,barrierExtra:barrierPlan.extra,barrierCost:barrierPlan.cost}:{}),...(kaiten?{kaiten:true,kaitenLevel:Number(command.kaitenLevel),kaitenArea:command.kaitenArea===true}:{}),...(perceptive?{perceptive:true}:{}),...(risk?{risk:true}:{}),...(evade?{evade:true}:{}),weaponId:command.weaponId??null,techniqueId:technique?.id??null,initiated:false,techniqueName:technique?.name??null,by:user.id,byName:user.name};await closeDefenseDeclaration(message,e);
   }else if(command.op==='attack'){
    const actor=await participant(e,user);if(!allDeclared(e))throw Error('Aguarde todas as declarações de defesa.');
    await rollAndResolveAttack(message,e,actor);
   }else if(command.op==='defend'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);
    await resolveExecutionDefense(message,e,s,target,user,command);
    await applyQuickResult(message,e,s);
   }else if(command.op==='repeat'){
    const s=slot(e,command.strike,command.targetUuid);await defending(s,user);if(!s.tiePending)throw Error('Não há empate pendente.');
    const actor=await fromUuid(e.actorUuid),target=await fromUuid(s.targetUuid),a=e.rolls[s.strike],d=s.defenseRoll;
    const threshold=worldRules().criticalSkipsDefense===false||sourceClone(actor)&&!e.attacks[s.strike].targetCapanga?Infinity:e.attacks[s.strike].critical;
    if(!s.tieDice){
     const ar=await new foundry.dice.Roll(`2d8 + (${a.precision})`).evaluate(),natural=ar.total-a.precision;
     const dr=natural<=3||natural>=threshold?null:await new foundry.dice.Roll(`2d8 + (${d.precision})`).evaluate();
     s.tieDice={attack:{total:ar.total,natural,precision:a.precision,json:JSON.stringify(ar.toJSON())},defense:dr?{total:dr.total,natural:dr.total-d.precision,precision:d.precision,json:JSON.stringify(dr.toJSON())}:null};await persist(message,e);
    }
    const t=s.tieDice,adjusted=attackAgainstTarget(e.attacks[s.strike],t.attack,actor,target,s.defense),result=t.attack.natural<=3?'second':t.attack.natural>=threshold?'first':resolveOpposed({...adjusted,natural:worldRules().criticalSkipsDefense===false||sourceClone(actor)&&!e.attacks[s.strike].targetCapanga?Math.min(14,t.attack.natural):t.attack.natural},t.defense);
    if(!usesQuickResolution(e,s))for(const [kind,performer]of [['attack',actor],['defense',target]]){if(!t[kind])continue;const key=message.id+':'+s.key+':tie:'+(s.tieCount??0)+':'+kind;if(!messages().some(m=>m.getFlag(ID,'defenseExecutionKey')===key))await foundry.dice.Roll.fromJSON(t[kind].json).toMessage({...(s.hidden?{whisper:users().filter(u=>u.isGM).map(u=>u.id)}:{}),speaker:ChatMessage.getSpeaker({actor:performer}),flavor:'Repetição de confronto empatado',flags:{[ID]:{defenseExecutionKey:key,concealedRoll:!!s.hidden}}},s.hidden?{messageMode:'gm'}:{});}
    if(result==='repeat'){delete s.tieDice;s.tieCount=(s.tieCount??0)+1;await persist(message,e);throw Error('O empate persistiu; repita o confronto novamente.');}
    s.tiePending=false;s.repeatedAttack=t.attack;s.defenseRoll=t.defense?{...t.defense,posted:true}:s.defenseRoll;
    if(s.defense.kaiten&&t.attack.natural>3&&result==='second')s.result=kaitenResult(s.defense,slotPowerPlan(e.attacks[s.strike],s));
    else if(s.defense.barrier&&t.attack.natural>3&&result==='second')s.result=barrierResult(target,e,s);
    else if(s.defense.counter&&t.attack.natural>3&&result==='second')s.result=techniqueCounterOutcome(slotPowerPlan(e.attacks[s.strike],s),s.defense.counter.plan);
    else if(s.defense.kind==='technique'&&t.attack.natural>3&&result==='second'){s.techniqueReady=true;}else s.result={hit:result==='first'};
    recordManeuverMargin(s,e.attacks[s.strike],adjusted,t.defense);
    if(s.result?.counterExcess>0&&game.combat?.started){
     e.combatId=game.combat.id;e.counterRound=game.combat.round;e.counterTurn=game.combat.combatant?.id;
    }
    markTenketsuContact(s,e.attacks[s.strike],t.attack.natural,target);
    await persist(message,e);await finish(message,e);
    await applyQuickResult(message,e,s);
   }else if(command.op==='efficient-damage'){
    const actor=await participant(e,user),s=slot(e,command.strike,command.targetUuid);
    if(!s.efficientOffer||s.replicaOffer||s.applied)throw Error('Técnica Eficiente indisponível para este acerto.');
    if(!s.efficientDecision){
     if(command.use===true){
      const state=derivedSummary(actor).state;
      if(state.noActions||state.noMovementAction||!aptitudeOwned([...actor.items],'tecnica-eficiente','',worldRules()))
       throw Error('Técnica Eficiente exige uma ação de movimento disponível.');
      const roll=await new foundry.dice.Roll('2d8').evaluate();
      s.efficientDecision={natural:roll.total};
     }else s.efficientDecision={skip:true};
     await persist(message,e);
    }
    await applyExecutionResult(message,e,s);
   }else if(command.op==='apply'){
    const s=slot(e,command.strike,command.targetUuid);await defending(s,user);if(!needsApplication(s.result))throw Error('Não há consequência confirmada para aplicar.');
    if(command.context&&(!Number.isFinite(command.context.distance)||command.context.distance<0||!Number.isFinite(command.context.areaFraction)||command.context.areaFraction<0||command.context.areaFraction>1))throw Error('Contexto de aplicação inválido.');
    if(s.efficientOffer&&!s.efficientDecision){
     if(!s.replicaOffer)throw Error('Aguarde o atacante escolher o grau de dano.');
     delete s.replicaOffer;s.replicaDeclined=true;
      await persist(message,e);
    }else await applyExecutionResult(message,e,s,command.context);
   }else if(command.op==='refresh'){
    const actor=await participant(e,user);
    if(e.privateDefenses&&!e.started)await publishDefenseInvitations(message);
    if((groupedPowerExecution(e)||fusionExecution(e))&&allDeclared(e)&&!terminalExecution(e.state))await rollAndResolveAttack(message,e,actor);
    else await finish(message,e);
   }
   else throw Error('Operação de ação desconhecida.');
   await settleControlledNature(message,e);
  }
  await request.update({[`flags.${ID}.actionRequestDone`]:true,[`flags.${ID}.actionRequestFailed`]:false,content:''});
 }catch(error){
  await request.update({[`flags.${ID}.actionRequestDone`]:true,[`flags.${ID}.actionRequestFailed`]:true,content:`<p>${esc(actionErrorMessage(error))}</p><button type="button" class="sns-btn" data-sns-retry-request>Retomar ação</button>`});throw error;
 }
}
async function settleControlledNature(message,e){
 if(e.state!=='complete'||!e.control?.againstNature||e.control.natureResolved)return;
 const body=await fromUuid(e.actorUuid),binding=mindBinding(body);
 if(binding&&validMindExecution(body,e.control)){
  const {resolveMindNature}=await import('./yamanaka-control.mjs');
  await resolveMindNature(binding.source,{id:e.control.rootId,bodyUuid:body.uuid,againstNature:true},
   {user:game.user,requestId:'mind-action:'+message.id});
 }
 e.control.natureResolved=true;await persist(message,e);
}
async function closeDefenseDeclaration(message,e){
 e.state=allDeclared(e)?'ready':'declared';
 await persist(message,e);
 if(e.state!=='ready')return;
 const s=e.slots[0],quick=usesQuickResolution(e,s);
 if(!quick&&!e.powerExecutionId)return;
 await rollAndResolveAttack(message,e,await fromUuid(e.actorUuid));
}

const groupedPowerExecution=e=>e.powerArea||e.powerGroup;
const fusionExecution=e=>e.attacks?.length===2&&e.attacks[0].fusionTwoHeads&&e.attacks[1].fusionExtra;
const powerAttackType=(e,plan)=>!e.powerExecutionId||plan.shadow||plan.effect==='lanca'&&plan.tier>=6?undefined:
 plan.area?'area':plan.ranged?'ranged':'melee';
const slotPowerPlan=(plan,s)=>s.powerBase==null?plan:{...plan,base:s.powerBase,damage:s.powerBase,
 splitDamage:false,...(s.projectiles!=null?{projectiles:s.projectiles}:{})};

async function rollAndResolveAttack(message,e,actor){
 if(fusionExecution(e)){
  for(let i=0;i<e.attacks.length;i++){
   if(i&&e.slots.some(s=>s.strike===i-1&&(!s.result||needsApplication(s.result)&&!s.applied)))return;
   if(!e.rolls[i])await rollExecutionAttack(message,e,actor);
   for(const s of e.slots.filter(s=>s.strike===i)){
    if(s.tiePending)return;
    if(!s.result){if(!usesQuickResolution(e,s))return;await resolveExecutionDefense(message,e,s,await fromUuid(s.targetUuid),game.user,{});}
    if(needsApplication(s.result)&&!s.applied){await applyQuickResult(message,e,s);if(!s.applied)return;}
   }
  }
  return;
 }
 if(!groupedPowerExecution(e)||!e.rolls[0])await rollExecutionAttack(message,e,actor);
 for(const s of groupedPowerExecution(e)?e.slots:[e.slots[0]]){
  if(!usesQuickResolution(e,s)||!e.rolls[s.strike]||s.tiePending)continue;
  if(!s.result)await resolveExecutionDefense(message,e,s,await fromUuid(s.targetUuid),game.user,{});
  await applyQuickResult(message,e,s);
 }
}

function usesQuickResolution(e,s){
 return e.quickResolution&&(e.attacks.length===1&&(groupedPowerExecution(e)||e.slots.length===1)||fusionExecution(e))&&!e.attacks[s?.strike??0].extendedBlade&&
  (['esquiva','bloqueio','antecipar','rebater','cancel-technique','none'].includes(s?.defense?.kind)||
   s?.defense?.barrier||s?.defense?.kaiten);
}

async function applyQuickResult(message,e,s){
 if(!e.assistedPowerId&&usesQuickResolution(e,s)&&needsApplication(s.result)&&!s.replicaOffer&&(!s.efficientOffer||s.efficientDecision))await applyExecutionResult(message,e,s);
}

function validateMercyTarget(target){
 const keys=derivedSummary(target).state.keys;
 if(keys.includes('morto')||!keys.includes('indefeso'))throw Error('Golpe de Misericórdia exige um alvo vivo, indefeso ou paralisado.');
}

async function rollExecutionAttack(message,e,actor){
 if(e.control){
  if(!validMindExecution(actor,e.control))throw Error('O controle mental desta ação já terminou.');
  const controller=await fromUuid(e.control.sourceUuid);
  if(mentalControllerSummary(controller).state.noActions)throw Error('O Yamanaka não pode continuar esta ação.');
 }
 const i=e.attacks.findIndex((_,n)=>!e.rolls[n]);if(i<0)throw Error('Todos os ataques já foram rolados.');
 if(e.powerExecutionId)return rollCoordinatedPower(message,e,actor);
 if(i>0&&e.slots.some(s=>s.strike===i-1&&(!s.result||needsApplication(s.result)&&!s.applied)))throw Error('Conclua as defesas e aplicações do golpe anterior antes de continuar.');
 if(!e.started){
  if(e.attacks[i].mercy)validateMercyTarget(await fromUuid(e.slots[0].targetUuid));
  if(e.state!=='initiating'){
   if(weaponFingerprint(actor,e.itemId,e.options)!==e.fingerprint)throw Error('A ficha ou as regras mudaram. Cancele a preparação e declare novamente; nada foi gasto.');
   const prepared=prepareWeaponAction(actor,e.itemId,e.options);
   const chakraCost=prepared.plan.octogram?.cost;
   if(chakraCost&&!canPayChakraCost(actor,chakraCost,clanContext(),Number(e.options.convertedChakra??0)))throw Error('Chakra insuficiente para a sequência do Octograma.');
   e.costs=weaponCosts(prepared,actor);e.coating=prepared.coating;e.state='initiating';await persist(message,e);
  }
  await commitWeaponCosts(actor,e.costs,message.id,e.attacks[0].octogram?.cost,e.attacks[0].kyoudoPreparation,e.attacks[0].defensiveStance,e.attacks[0].chargeDefensePenalty,e.attacks[0].bunbunId,Number(e.options.convertedChakra??0));
  const {commitHachimonHeavy}=await import('./power-actions.mjs');await commitHachimonHeavy(actor,e.attacks[0],message.id);
  e.started=true;e.state='active';await persist(message,e);
 }
 if(i>0&&e.attacks[i].twinLionsId&&weaponFingerprint(actor,e.itemId,e.options)!==e.fingerprint){
  throw Error('Punho dos Leões Gêmeos mudou desde a declaração. O mestre pode encerrar a sequência.');
 }
 const plan=copy(e.attacks[i]);
 await claimFeints(message,e,actor,i,plan);
 if(!plan.ranged){
  const zui=e.itemId==='unarmed'&&!plan.juuken&&(!e.options.maneuver||e.options.maneuver==='golpear')&&
   !!activeAptitudes(actor)['estilo-zui-quan'];
  const name=plan.inlineFeint||(zui?'Zui Quan':null);
  if(name)for(const s of e.slots.filter(s=>s.strike===i&&!s.feint&&!s.inlineFeint)){
   const target=await fromUuid(s.targetUuid),request=game.messages.get(e.requestId),user=(request&&author(request))??game.user;
   const record=await executeFeint(actor,target,user,message.id+':'+s.key,{inline:true});
   s.inlineFeint={name,...record};s.feint=record.success===true;
   await persist(message,e);
  }
 }
 if(e.blockResponseAutomatic)plan.automaticHit=true;
 if(plan.octogram&&e.slots.some(s=>s.strike<i&&s.applied?.hit&&(s.repeatedAttack?s.repeatedAttack.natural>=e.attacks[s.strike].critical:e.rolls[s.strike]?.critical)))plan.automaticHit=true;
 if(e.options.maneuver==='chute-duplo'&&i===1&&e.slots.some(s=>s.strike===0&&s.result?.hit))plan.precision+=1;
 // Persist evaluated dice before posting them; retries reuse the same dice.
 if(!e.attackDice)e.attackDice={};
 if(!e.attackDice[i]){
  if(!e.poisonCheck&&plan.attackFailure){const r=await new foundry.dice.Roll('1d8').evaluate();e.poisonCheck={total:r.total,success:r.total>Math.round(plan.attackFailure/100*8)};await persist(message,e);}
  if(e.poisonCheck?.success===false){e.state='complete';e.error='O ataque falhou pelo efeito do veneno; materiais já utilizados permanecem gastos.';await persist(message,e);}
  else{const roll=await new foundry.dice.Roll(`${plan.mercy?'16':'2d8'} + (${plan.precision})`).evaluate();e.attackDice[i]=JSON.stringify(roll.toJSON());await persist(message,e);}
 }
 if(e.attackDice[i]){
  const prior=messages().find(m=>m.getFlag(ID,'weaponAttack')?.executionMessageId===message.id&&m.getFlag(ID,'weaponAttack')?.strikeIndex===i&&m.getFlag(ID,'weaponAttack')?.attempt===(e.retry??0));
  const roll=foundry.dice.Roll.fromJSON(e.attackDice[i]);
  const outcome=prior?{message:prior,...prior.getFlag(ID,'weaponAttack')}:await postAttackRoll(actor,plan,{name:actionTitle(e),weapon:prepareWeaponName(actor,e),index:i+1,coating:e.coating,roll,workflow:{executionMessageId:message.id,strikeIndex:i,attempt:e.retry??0}});
  const attack=outcome.message.getFlag(ID,'weaponAttack');e.rolls[i]={messageId:outcome.message.id,total:attack.total,natural:attack.natural,critical:attack.critical,degree:attack.degree,precision:plan.precision};
  for(const s of e.slots.filter(s=>s.strike===i))if(plan.automaticHit||heavyBlock(plan,s.defense)||attack.natural<=3||attack.critical&&worldRules().criticalSkipsDefense!==false)s.result={hit:!!(plan.automaticHit||heavyBlock(plan,s.defense)||attack.critical)};
  await damageFirearm(actor,e,i,attack.natural);
  await persist(message,e);await finish(message,e);
 }
}

async function rollExecutionDefense(e,s,target){
 const stat=s.defense.kind==='rebater'?'cd':s.defense.kind==='esquiva'?'esq':s.defense.kind==='bloqueio'||s.defense.kaiten?'cc':'lm',p=statPrecision(target,stat,{kind:'defense',reaction:true,manualContext:true,attackType:powerAttackType(e,e.attacks[s.strike]),feintAttacker:!!s.feint,riskDodge:s.defense.risk,offGuard:e.shadowAirborne&&['esquiva','antecipar'].includes(s.defense.kind)});if(!p.allowed)throw Error(p.reasons.join(' '));
 const blockBonus=s.strike===0&&s.defense.kind==='bloqueio'&&!e.attacks[s.strike].ranged&&aptitudeOwned(mindCommonItems(target),'bloquear-arma')&&e.itemId!=='unarmed'?1:0;
 const precision=p.precision+shadowDefense(e.attacks[s.strike],derivedSummary(target).state,s.defense,target.uuid).penalty+blockBonus+(s.defense.barrier?2:0)+(s.defense.kaiten?Number(target.system.attributes.des)-Number(target.system.attributes.for):0);
 const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();
 return {json:JSON.stringify(roll.toJSON()),total:roll.total,natural:roll.total-precision,precision};
}

async function resolveExecutionDefense(message,e,s,target,user,command){
 const a=e.rolls[s.strike];if(!a)throw Error('O atacante precisa rolar primeiro.');if(s.result)throw Error('Defesa já resolvida.');
 if(e.attacks[s.strike].extendedBlade)await prepareExtendedBlade(game.messages.get(a.messageId),s.targetUuid);
 const source=await fromUuid(e.actorUuid);
 const attack=attackAgainstTarget(e.attacks[s.strike],a,source,target,s.defense);
 if(s.defense.kind==='manual'){
  if(!user.isGM||typeof command.manualHit!=='boolean')throw Error('O mestre precisa conferir o resultado desta exceção.');s.result={hit:command.manualHit,manual:true,by:user.id};
 }else if(s.defense.kind==='none'){
  s.result={hit:true};
 }else if(s.defense.kind==='esquiva'&&!s.defense.risk){
  const difficulty=dodgeDifficulty(target,s.defense,e.shadowAirborne,!!s.feint,powerAttackType(e,e.attacks[s.strike]),e.attacks[s.strike]);
  s.result={hit:attack.total>=difficulty};
  s.defenseDifficulty=difficulty;
  recordManeuverMargin(s,e.attacks[s.strike],attack,{total:difficulty});
 }else{
  if(s.techniqueReady){if(typeof command.techniqueStopped!=='boolean')throw Error('Confirme o resultado da técnica defensiva.');s.result={hit:!command.techniqueStopped,manualTechnique:true};await persist(message,e);await finish(message,e);return;}
  if(!s.defenseRoll){s.defenseRoll=await rollExecutionDefense(e,s,target);await persist(message,e);}
  if(!usesQuickResolution(e,s)&&!s.defenseRoll.posted){
   const key=message.id+':'+s.key+':'+(e.retry??0);if(!messages().some(m=>m.getFlag(ID,'defenseExecutionKey')===key))await foundry.dice.Roll.fromJSON(s.defenseRoll.json).toMessage({...(s.hidden?{whisper:users().filter(u=>u.isGM).map(u=>u.id)}:{}),speaker:ChatMessage.getSpeaker({actor:target}),flavor:'Defesa: '+esc(({technique:'Defender com técnica',esquiva:'Esquiva',bloqueio:'Bloqueio',antecipar:'Antecipar'})[s.defense.kind]??'Reação'),flags:{[ID]:{defenseExecutionKey:key,concealedRoll:!!s.hidden}}},s.hidden?{messageMode:'gm'}:{});
   s.defenseRoll.posted=true;await persist(message,e);
  }
  const d=s.defenseRoll,result=resolveOpposed({...attack,natural:worldRules().criticalSkipsDefense===false||sourceClone(source)&&!e.attacks[s.strike].targetCapanga?Math.min(14,attack.natural):attack.natural},d);if(result==='repeat'){
   s.tiePending=true;await persist(message,e);if(usesQuickResolution(e,s))return;throw Error('Empate: os testes deste alvo precisam ser repetidos. Use Repetir confronto; demais alvos são preservados.');
  }
  if(s.defense.kaiten&&result==='second')s.result=kaitenResult(s.defense,slotPowerPlan(e.attacks[s.strike],s));
  else if(s.defense.barrier&&result==='second')s.result=barrierResult(target,e,s);
  else if(s.defense.counter&&result==='second')s.result=techniqueCounterOutcome(slotPowerPlan(e.attacks[s.strike],s),s.defense.counter.plan);
  else if(s.defense.kind==='technique'&&result==='second'){
   if(typeof command.techniqueStopped!=='boolean')throw Error('Técnica executada a tempo. Use seus controles para custos/efeitos e confirme se impediu o dano.');
   s.result={hit:!command.techniqueStopped,manualTechnique:true};
  }else s.result={hit:result==='first'};
  recordManeuverMargin(s,e.attacks[s.strike],attack,d);
 }
 if(s.result?.counterExcess>0&&game.combat?.started){
  e.combatId=game.combat.id;e.counterRound=game.combat.round;e.counterTurn=game.combat.combatant?.id;
 }
 markTenketsuContact(s,e.attacks[s.strike],attack.natural,target);
 await persist(message,e);await finish(message,e);
}

async function applyExecutionResult(message,e,s,context){
 if(!s.applied){
  if(!groupedPowerExecution(e)&&e.slots.some(x=>x.strike===s.strike&&!x.result))throw Error('Resolva todas as defesas deste golpe antes de aplicar consequências.');
  let attack=game.messages.get(e.rolls[s.strike].messageId);
  if(!e.powerExecutionId&&s.repeatedAttack){const original=attack,actor=await fromUuid(e.actorUuid),flag=copy(original.getFlag(ID,'weaponAttack'));const {damageDegree}=await import('./weapons.mjs');flag.total=s.repeatedAttack.total;flag.natural=s.repeatedAttack.natural;flag.critical=flag.natural>=flag.plan.critical&&(!sourceClone(actor)||flag.plan.targetCapanga);flag.degree=flag.natural<=3?0:Math.max(1,damageDegree(flag.natural,sourceClone(actor)&&!flag.plan.targetCapanga?Infinity:flag.plan.critical)-Number(flag.plan.degreePenalty??0));attack={id:original.id,getFlag:(_ns,key)=>key==='weaponAttack'?flag:original.getFlag(_ns,key)};}
  if(e.powerExecutionId)s.applied=await applyCoordinatedPower(attack,s,groupedPowerExecution(e)?message.id:null,e.slots.length);
  else{
   const progressive=await progressiveBonus(message,e,s);
   if(progressive){
    const original=attack,flag=copy(original.getFlag(ID,'weaponAttack'));
    flag.plan.postDivisionBonus=Number(flag.plan.postDivisionBonus??0)+progressive;
    attack={id:original.id,getFlag:(ns,key)=>key==='weaponAttack'?flag:original.getFlag(ns,key)};
   }
   s.applied=await resolveWeaponAttack(attack,s.targetUuid,{...context,defense:s.defense.kind==='technique'?'other':s.defense.kind,blockingWeapon:s.defense.weaponId,hit:true});
   if(s.applied.hit){
    const extra=Math.floor(Math.max(0,s.result.maneuverMargin??0)/4);
    const maneuver=e.attacks[s.strike].specialManeuver;
    if(maneuver==='desarmar'){
     const roll=s.repeatedAttack??e.rolls[s.strike];
     const plan=e.attacks[s.strike];
     const critical=s.repeatedAttack?roll.natural>=plan.critical&&(!sourceClone(await fromUuid(e.actorUuid))||plan.targetCapanga):roll.critical;
     s.applied.disarmedMetres=critical&&plan.criticalDisarmMetres!=null?plan.criticalDisarmMetres:3+extra;
     const performer=await fromUuid(e.actorUuid);
     s.canSteal=!!aptitudeOwned([...performer.items],'roubar','',worldRules())&&!['desarme-a-distancia'].includes(e.options.maneuver);
     s.applied.disarmedAway=critical&&plan.criticalDisarmMetres!=null;
     if(e.disarmItemId){
      const target=await fromUuid(s.targetUuid),weapon=weaponDocument(target,e.disarmItemId);
      if(weapon){
       if(weapon.system.equipped)await weapon.update({'system.equipped':false});
       s.disarmedItem={id:weapon.id,name:weapon.name};
      }
     }
    }
    if(maneuver==='empurrar'){
     const attacker=await fromUuid(e.actorUuid);
     s.applied.pushedMetres=Math.min(1+extra,derivedSummary(attacker).movement);
    }
   }
  }
  if(s.applied.hit&&e.attacks[s.strike].mercy)await settleMercy(message,e,s);
  if(s.applied.hit&&e.shadowAirborne)await landShadowHit(e,s);
  if(s.applied.conditionApplied==='Agarrado'&&game.combat?.started)
   s.grappleStart={combatId:game.combat.id,round:game.combat.round};
  await persist(message,e);await finish(message,e);
 }
}

// Básico p. 263. Uma Finta por jogador/rodada; o efeito vale para o próximo ataque corporal daquele personagem.
async function executeFeint(actor,target,user,requestId,{inline=false,flechas=null,domain=false,convertedChakra=0,accelerated=false}={}){
 const combat=game.combat;
 if(!inline&&!combat?.started)throw Error('Inicie um combate para acompanhar a rodada e a duração da Finta.');
 if(accelerated){
  const source=derivedSummary(actor).acceleration.rank,opponent=derivedSummary(target).acceleration.rank;
  const moved=runtimeState(actor).lastMovement;
  if(!source||opponent>=source||moved?.turn!==periodKey(actor,'turn')||moved?.combatId!==combat?.id)throw Error('Finta acelerada exige movimento neste turno e alvo mais lento.');
 }
 const type=accelerated?'Livre':domain?'Parcial':aptitudeOwned([...actor.items],'ponto-cego','',worldRules())?'Movimento':'Padrão';
 const state=derivedSummary(actor).state;
 if(flechas&&(state.noActions||state.noAttack||type==='Movimento'&&state.noMovementAction))
  throw Error('A condição atual impede a Finta de Flechas.');
 const attack=statPrecision(actor,flechas?'prestidigitacao':'agi',{
  kind:flechas?'skill':'attribute',requiresSeals:flechas?.seals,manualContext:true,feint:!flechas
 });
 const defense=statPrecision(target,'prontidao',{kind:'skill',reaction:true,resistingFeint:true,manualContext:true});
 if(!attack.allowed)throw Error(attack.reasons.join(' '));
 const tracked=combat?.started===true;
 const stamp=String(combat?.round??0),ledger=tracked?combat.getFlag(ID,'feints')??{}:{},id=user.isGM?actor.uuid:user.id;
 let record=readKeyedRecord(ledger,id);
 if(record?.requestId!==requestId){
  if(record?.stamp===stamp){
   if(inline)return {used:true};
   throw Error('Você já usou Fintar nesta rodada.');
  }
  if(flechas)await mutateRuntime(actor,state=>{
   state.arrowFeintCosts??={};
   if(readKeyedRecord(state.arrowFeintCosts,requestId))return;
   const changes=corpulenciaPayment(actor,2,convertedChakra,clanContext());
   state.arrowFeintCosts[recordKey(requestId)]=true;
   return {changes};
  });
  let a,b,result;
  do{
   a=await grappleRoll(attack.precision);b=await grappleRoll(defense.precision);
   result=resolveOpposed(a,b);
  }while(result==='repeat');
  record={requestId,stamp,round:combat?.round??0,turn:combat?.turn??0,actorUuid:actor.uuid,targetUuid:target.uuid,
   success:result==='first',attack:a.total,defense:b.total,
   ...(flechas?{ranged:true,...(domain?{requiredEffect:'flechas',family:flechas.family}:{})}:{})};
  if(tracked)await combat.setFlag(ID,'feints',{...ledger,[recordKey(id)]:record});
 }
 if(inline)return record;
 if(record.success)await mutateRuntime(target,state=>{
  state.feints??={};
  if(readKeyedRecord(state.feints,record.actorUuid)?.requestId!==requestId)state.feints[recordKey(record.actorUuid)]={...record,combatId:combat.id};
 });
 if(!messages().some(message=>message.getFlag(ID,'feintRequest')===requestId)){

  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p><strong>${flechas?'Finta de Flechas':'Fintar'} · ${esc(target.name)}</strong> · ${type}</p>
   <p>${flechas?'Prestidigitação':'Agilidade'} ${record.attack} × Prontidão ${record.defense}. ${record.success?
    'A próxima defesa contra '+(domain?'o mesmo efeito Flechas':flechas?'seu ataque à distância':'seu ataque corporal')+' sofre −2.':'O alvo não caiu na finta.'}</p>`,
   flags:{[ID]:{feintRequest:requestId}}});
 }
}

export async function claimFeintAgainst(target,actor,receipt,{ranged=false,plan}={}){
 const combat=game.combat;
 if(!combat?.started||!target)return false;
 const held=readKeyedRecord(runtimeState(target).feints,actor.uuid);
 if(!held||held.combatId!==combat.id||!!held.ranged!==!!ranged||
    held.requiredEffect&&(held.requiredEffect!==plan?.effect||held.family!==plan.family)||
    held.consumedBy&&held.consumedBy!==receipt||combat.round>held.round+1||
    combat.round===held.round+1&&combat.turn>held.turn)return false;
 const result=await mutateRuntime(target,state=>{
  const current=readKeyedRecord(state.feints,actor.uuid);
  if(current?.requestId!==held.requestId||current.consumedBy&&current.consumedBy!==receipt)return {claimed:false};
  current.consumedBy=receipt;
  return {claimed:true};
 });
 return result.claimed;
}

async function claimFeints(message,e,actor,strike,plan){
 const combat=game.combat;
 if(!combat?.started)return;
 for(const slot of e.slots.filter(slot=>slot.strike===strike&&!slot.feint)){
  const target=await fromUuid(slot.targetUuid);
  if(!target)continue;
  const receipt=message.id+':'+slot.key;
  slot.feint=derivedSummary(actor).acceleration.rank===2&&derivedSummary(target).acceleration.rank<2||await claimFeintAgainst(target,actor,receipt,{ranged:plan.ranged,plan});
  if(slot.feint)await persist(message,e);
 }
}

async function settleMercy(message,e,slot){
 const target=await fromUuid(slot.targetUuid),plan=e.attacks[slot.strike].mercy;
 const key=message.id+':'+slot.key;
 const receipt=await mutateRuntime(target,async state=>{
  state.mercyReceipts??={};
  if(readKeyedRecord(state.mercyReceipts,key))return readKeyedRecord(state.mercyReceipts,key);
  let resistance=null;
  if(!plan.capanga){
   const check=statPrecision(target,'vig',{kind:'resistance',bodyResistance:true,manualContext:true});
   resistance=await grappleRoll(check.precision);
  }
  const survived=resistance!=null&&(resistance.natural>=15||resistance.natural>3&&resistance.total>=10);
  const record={resistance:resistance?.total??null,outcome:survived?'resistiu':plan.outcome};
  state.mercyReceipts[recordKey(key)]=record;
  return record;
 });
 const conditions=conditionRecords(target);
 const causes=conditions.filter(record=>slot.mercyCauses?.includes(record.id));
 if(causes.length===1)await saveCondition(target,causes[0],{remove:true});
 else if(causes.length>1)slot.applied.mercyReview=true;
 if(receipt.outcome!=='resistiu'&&!conditionRecords(target).some(record=>record.mercyKey===key))
  await saveCondition(target,{key:receipt.outcome==='kill'?'morto':'inconsciente',source:'Golpe de Misericórdia',mercyKey:key});
 slot.applied.mercy=receipt;
}

async function progressiveBonus(message,e,s){
 const plan=e.attacks[s.strike];
 if(!plan.progressiveRolls||!s.result.hit||s.result.barrier||s.result.kaiten)return 0;
 if(s.progressive)return s.progressive.bonus;
 const source=await fromUuid(e.actorUuid),target=await fromUuid(s.targetUuid);
 const attackRoll=s.repeatedAttack??e.rolls[s.strike];
 const critical=sourceClone(source)&&!plan.targetCapanga?Infinity:plan.critical;
 const criticalSkippedDefense=attackRoll.natural>=critical&&(s.repeatedAttack||!s.defenseRoll&&s.defenseDifficulty==null);
 if(criticalSkippedDefense&&worldRules().progressiveCriticalDefense==='automatic'){
  s.progressive={rolls:[],bonus:plan.progressiveRolls,automatic:true};
  await persist(message,e);
  return s.progressive.bonus;
 }
 const reference=criticalSkippedDefense?null:e.slots.slice().reverse().find(slot=>slot.targetUuid===s.targetUuid&&slot.strike<=s.strike&&
  (slot.defenseDifficulty!=null||slot.defenseRoll));
 const difficulty=reference?.defenseDifficulty;
 const canRollDefense=['bloqueio','antecipar','esquiva','technique'].includes(s.defense.kind);
 const defense=criticalSkippedDefense&&canRollDefense?await rollExecutionDefense(e,s,target):reference?.defenseRoll;

 const options=reference?.defense??s.defense;
 const rolls=[];
 for(let i=0;i<plan.progressiveRolls;i++){
  const roll=await grappleRoll(attackRoll.precision);
  const adjusted=attackAgainstTarget(plan,roll,source,target,options);
  const hit=roll.natural<=3?false:roll.natural>=critical&&worldRules().criticalSkipsDefense!==false?true:defense?
   resolveOpposed({...adjusted,natural:Math.min(14,roll.natural)},defense)==='first':
   difficulty!=null?adjusted.total>=difficulty:s.defense.kind==='none';
  rolls.push({total:roll.total,hit});
 }
 s.progressive={rolls,bonus:rolls.filter(roll=>roll.hit).length,...(criticalSkippedDefense&&defense?{extraDefenseTotal:defense.total}:{})};
 await persist(message,e);
 return s.progressive.bonus;
}

function attackAgainstTarget(plan,roll,source,target,defense){
 const sourceSize=sizeProfile(source.system),targetSize=sizeProfile(target.system);
 if(plan.specialManeuver){
  const difference=targetSize.index-sourceSize.index;
  // Apply the larger target's defense bonus to both the margin and precision tie break.
  const bonus=difference>0&&defense.kind!=='none'?1+difference:0;
  return {...roll,total:roll.total-bonus,precision:roll.precision-bonus};
 }
 const shadow=shadowAttackBonus(plan,target.uuid);
 return {...roll,total:roll.total+sizeAttackModifier(sourceSize.key,targetSize,{defense:defense.kind})+shadow,precision:roll.precision+shadow};
}

// Básico 4.1.b, p. 268. Só há diferença mensurável quando a defesa tem resultado.
function recordManeuverMargin(slot,plan,attack,defense){
 if(!slot.result||!defense)return;
 slot.result.defenseMargin=attack.total-defense.total;
 if(['desarmar','empurrar'].includes(plan.specialManeuver))slot.result.maneuverMargin=attack.total-defense.total;
 if(plan.specialManeuver==='atropelar'&&!slot.result.hit&&slot.defense.kind==='bloqueio'&&attack.natural>3)slot.result.blockedAdvance=true;
}

function dodgeDifficulty(target,defense,offGuard=false,feintAttacker=false,attackType,plan){
 const shadow=shadowDefense(plan,derivedSummary(target).state,defense,target.uuid);
 if(shadow.fixedDodge!=null)return shadow.fixedDodge;
 const p=statPrecision(target,'esq',{kind:'defense',reaction:true,manualContext:true,offGuard,feintAttacker,attackType});
 if(!p.allowed)throw Error(p.reasons.join(' '));
 return 9+p.precision+(defense.perceptive?perceptiveDodgeDelta(target):0)+shadow.penalty;
}

async function rollCoordinatedPower(message,e,actor){
 const {prepareCoordinatedPowerRoll,postPowerRoll}=await import('./power-actions.mjs');
 const s=e.slots[0],plan=e.ricochet?slotPowerPlan(e.attacks[0],s):e.attacks[0],item=actor.items.get(e.itemId);
 if(plan.shadow?.binding&&!actor.system.powerState?.active?.some(a=>a.id===e.powerExecutionId&&a.active!==false)){
  e.state='interrupted';e.error='A técnica das sombras foi encerrada antes do ataque.';await persist(message,e);return;
 }
 await claimFeints(message,e,actor,0,plan);
 if(!item)throw Error('Poder não encontrado na ficha.');
 if(!e.powerDice){
  const evaluated=await prepareCoordinatedPowerRoll(actor,plan,{executionId:e.powerExecutionId});
  if(!evaluated){e.started=true;e.state='complete';e.error='O ataque falhou pelo efeito do veneno.';await persist(message,e);return;}
  e.powerDice={json:JSON.stringify(evaluated.roll.toJSON()),precision:evaluated.precision};
  e.started=true;e.state='active';await persist(message,e);
 }
 const roll=foundry.dice.Roll.fromJSON(e.powerDice.json);
 const prior=messages().find(m=>{const a=m.getFlag(ID,'powerAttack');return a?.coordinated&&a.actorUuid===actor.uuid&&a.executionId===e.powerExecutionId;});
 const posted=prior??await postPowerRoll(actor,item,plan,{roll,precision:e.powerDice.precision,executionId:e.powerExecutionId,targetUuid:e.powerArea?undefined:s.targetUuid,distance:e.powerArea?null:s.distance});
 const attack=posted.getFlag(ID,'powerAttack');
 e.rolls[0]={messageId:posted.id,total:attack.total,natural:attack.natural,critical:attack.critical,degree:attack.degree,precision:attack.precision};
 for(const s of e.slots){
 if(s.result)continue;
 if(plan.automaticHit||heavyBlock(plan,s.defense))s.result={hit:true};
 else if(attack.failed||attack.critical&&worldRules().criticalSkipsDefense!==false||s.defense.kind==='none')s.result={hit:!attack.failed};
 else if(s.defense.kind==='esquiva'&&!s.defense.risk){
  const target=await fromUuid(s.targetUuid);
  const total=attack.total+sizeAttackModifier(sizeProfile(actor.system).key,sizeProfile(target.system),{defense:'esquiva'})+shadowAttackBonus(plan,target.uuid);
  const difficulty=dodgeDifficulty(target,s.defense,false,!!s.feint,powerAttackType(e,plan),plan);
  s.result={hit:total>=difficulty};
  s.defenseDifficulty=difficulty;
  recordManeuverMargin(s,plan,{total},{total:difficulty});
 }
 }
 await persist(message,e);await finish(message,e);
}

async function applyCoordinatedPower(message,s,preparedAreaId,targetCount){
 const {resolvePowerAttack}=await import('./power-actions.mjs');
 const attack=copy(message.getFlag(ID,'powerAttack'));
 if(s.hidden)attack.plan.privateRecipients=users().filter(u=>u.isGM).map(u=>u.id);
 attack.plan=slotPowerPlan(attack.plan,s);
 if(attack.plan.shadow)attack.plan.shadow={...attack.plan.shadow,capanga:!!s.shadowCapanga};
 if(s.repeatedAttack)Object.assign(attack,powerAttackResult(attack.plan,s.repeatedAttack.natural),{total:s.repeatedAttack.total});
 if(s.efficientDecision?.natural!=null)
  attack.degree=Math.max(attack.degree,powerAttackResult(attack.plan,s.efficientDecision.natural).degree);
 const barrier=s.result.barrier??s.result.kaiten;
 if(barrier)attack.plan.damage=barrier.excess;
 return resolvePowerAttack({id:message.id,uuid:message.uuid,getFlag:()=>attack},s.targetUuid,{
  hit:s.result.hit,defense:attack.failed&&!heavyBlock(attack.plan,s.defense)?'other':s.defense.counter?.plan.family==='suiton'&&s.result.cancelledTechnique?'suiton':
   s.defense.kind==='technique'?'other':s.defense.kind,distance:s.distance,preparedAreaId,
  targetTokenUuid:s.tokenUuid,blocked:!!barrier,specialBlock:s.defense.kind==='bloqueio'&&attack.plan.effect==='raio',skipResidual:!!barrier||!!s.result.cancelledTechnique,areaFraction:s.areaFraction,
  defenseTotal:s.defenseDifficulty??s.defenseRoll?.total,targets:targetCount,
 });
}

const sourceClone=actor=>!!actor.getFlag?.(ID,'clone');
function prepareWeaponName(actor,e){return e.itemId==='unarmed'?'unarmed':actor.items.get(e.itemId)?.system.catalogKey;}
async function damageFirearm(actor,e,i,natural){
 if(i!==0||natural>3)return;const item=actor.items.get(e.itemId);if(!item)return;
 const {WEAPONS}=await import('./weapons.mjs');if(WEAPONS.find(w=>w.key===item.system.catalogKey)?.category!=='firearm'||item.getFlag?.(ID,'actionMisfire')?.[e.requestId])return;
 await item.update({'system.damaged':true,'system.destroyed':!!item.system.damaged,[`flags.${ID}.actionMisfire.${e.requestId}`]:true});
}
const clanContext=()=>({books:worldProfile()?.books??['basico','avancado'],rules:worldRules()});

function perceptiveDodgeDelta(target){
 if(!clanCapabilities(target,clanContext()).sharingan)throw Error('Esquiva Perceptiva exige Sharingan ativo. O mestre pode conferir a defesa.');
 const combat=derivedSummary(target).base?.combat??target.system.combat;
 return Number(combat?.lm??0)-Number(combat?.esq??0);
}

function kaitenDefense(target,item,level){
 const context=clanContext();
 level=Number(level);
 if(item?.type!=='power'||item.system.powerData?.family!=='juuken'||!Number.isInteger(level)||level<3||level>Number(item.system.level))throw Error('Kaiten exige nível usado entre 3 e o Juuken adquirido.');
 const errors=validatePowerPurchase(target,item,context);
 if(errors.length)throw Error(errors.join(' '));
 const state=derivedSummary(target).state;
 if(state.immobile||state.noReactions)throw Error('Kaiten exige movimentos livres e uma reação disponível.');
 if(!clanCapabilities(target,context).byakugan)throw Error('Kaiten exige Byakugan ativo.');
 return level;
}

async function beginBarrier(target,e,s,key){
 await mutateRuntime(target,state=>{
  state.barrierCosts??={};
  if(readKeyedRecord(state.barrierCosts,key))return;
  const defense=s.defense,item=mindCommonItems(target).find(i=>i.id===defense.techniqueId);
  const plan=barrierOption(target,item,e,s,{level:defense.barrierLevel??3,extra:defense.barrierExtra??0,converted:defense.convertedChakra??0});
  if(!plan)throw Error('Barreira indisponível ou chakra insuficiente.');
  defense.barrierHardness=plan.hardness;defense.barrierCost=plan.cost;
  state.barrierCosts[recordKey(key)]={hardness:plan.hardness,cost:plan.cost};
  return {changes:corpulenciaPayment(target,plan.cost,defense.convertedChakra??0,clanContext())};
 });
 const paid=readKeyedRecord(runtimeState(target).barrierCosts,key);
 if(paid){s.defense.barrierHardness=paid.hardness;s.defense.barrierCost=paid.cost;}
}

async function beginKaiten(target,defense,receiptId){
 if(defense.initiated)return;
 await mutateRuntime(target,state=>{
  state.kaitenCosts??={};
  if(readKeyedRecord(state.kaitenCosts,receiptId))return;
  const cost=kaitenDefense(target,mindCommonItems(target).find(i=>i.id===defense.techniqueId),defense.kaitenLevel);
  const payment=corpulenciaPayment(target,cost,defense.convertedChakra??0,clanContext());
  state.kaitenCosts[recordKey(receiptId)]=true;
  return {changes:payment};
 });
}

function kaitenResult(defense,plan){
 const hardness=3+2*defense.kaitenLevel;
 const excess=Math.max(0,Number(plan.damagePool??plan.base)-hardness);
 return {hit:excess>0,kaiten:{hardness,excess,area:defense.kaitenArea}};
}

function barrierResult(target,e,s){
 const {defense}=s,attack=slotPowerPlan(e.attacks[s.strike],s);
 const saved=defense.barrierHardness==null?barrierOption(target,mindCommonItems(target).find(i=>i.id===defense.techniqueId),e,s,{checkChakra:false}):null;
 const baseHardness=defense.barrierHardness??saved?.hardness;
 if(baseHardness==null)throw Error('A Barreira declarada precisa ser conferida pelo mestre.');
 const element=defense.barrierElement??saved?.family;
 const factors=elementalConfrontation(attack.element,element);
 const hardness=Math.max(0,Math.ceil(baseHardness*factors.defense)-
  (attack.effect==='lanca'?(attack.ignoreAllHardness?baseHardness:Number(attack.ignoreHardness??0)):0));
 const base=Math.ceil(Number(attack.damagePool??attack.base)*factors.attack);
 const impact=resolveHardness({kind:'barrier',hardness,base});
 return {hit:impact.base>0,barrier:{hardness,excess:impact.base}};
}

const needsApplication=result=>result?.hit||result?.tenketsuOnly||result?.areaResidual;

// Livro Básico 4.1.b, p. 159: possuir Tenketsu basta para a exceção defensiva.
function markTenketsuContact(slot,plan,natural,target){
 if(slot.result?.hit!==false||slot.defense.kind!=='bloqueio'||slot.defense.weaponId!=='unarmed'||natural<=3)return;
 if(!plan.juuken||!Number.isInteger(plan.tenketsuDifficulty))return;
 if(aptitudeOwned(mindCommonItems(target),'res-basico-tenketsu-byakugan'))return;
 slot.result.tenketsuOnly=true;
}

async function publishKaitenCounters(message,e){
 for(const slot of e.slots){
  const plan=slot.defense?.kaitenCounter;
  if(!plan||!slot.result?.kaiten||slot.result.hit||!slot.defenseRoll)continue;
  const key=message.id+':'+slot.key;
  if(messages().some(m=>m.getFlag(ID,'kaitenCounterKey')===key))continue;
  const defender=await fromUuid(slot.targetUuid);
  if(!defender)continue;
  const roll=slot.defenseRoll;
  const result=powerAttackResult(plan,roll.natural);
  const attack={
   ...result,critical:false,actorUuid:slot.targetUuid,itemId:slot.defense.techniqueId,
   total:roll.total,precision:roll.precision,plan,counterAttackerUuid:e.actorUuid
  };
  await ChatMessage.create({
   speaker:ChatMessage.getSpeaker({actor:defender}),
   content:`<p><strong>Kaiten defensivo · Giro de resposta</strong></p><p>Raio de ${plan.range} m · resultado ${roll.total} · dano base ${plan.damage} · grau ${result.degree}. O atacante original é atingido sem nova defesa se estiver no raio. Confira separadamente as demais criaturas.</p><button type="button" data-sns-power-resolve>Aplicar giro de resposta</button>`,
   flags:{[ID]:{kind:'power-attack',actorUuid:slot.targetUuid,powerAttack:attack,kaitenCounterKey:key}}
  });
 }
}

async function recordThrow(message,e,slot,command){
 const plan=e.attacks[slot.strike].throwTarget;
 if(!plan||slot.applied?.conditionApplied!=='Caído'||slot.thrown)throw Error('Arremesso indisponível.');
 const {direction,distance,obstacle}=command;
 if(!['back','up'].includes(direction)||!Number.isFinite(distance)||distance<=0||distance>plan.metres)
  throw Error(`Escolha uma distância maior que 0 e de até ${plan.metres} m.`);
 const source=await fromUuid(e.actorUuid);
 const thrown={direction,distance,turn:shadowTurn(source)};
 if(direction==='up'){
  const target=await fromUuid(slot.targetUuid);
  const receipt='weapon:'+e.rolls[slot.strike].messageId+':'+target.id;
  const prone=conditionRecords(target).find(c=>c.key==='caido'&&c.weaponReceipt===receipt);
  if(prone)await saveCondition(target,prone,{remove:true});
 }
 if(obstacle===true&&direction==='back'&&plan.collision){
  const target=await fromUuid(slot.targetUuid);
  const outcome=await applyPhysicalDamage(target,{fixed:plan.collision,sourceId:message.id+':'+slot.key+':throw',
   reason:'Colisão de Arremessar',camouflageContext:{located:true},critical:true});
  thrown.damage=outcome.damage;
 }
 slot.thrown=thrown;
 await persist(message,e);
}

// Básico pp. 71 e 275. A altura é registrada pela mesa; nenhum token é movido aqui.
async function landThrow(message,e,s,height,{shadow=false}={}){
 if(s.thrown?.direction!=='up')throw Error('O arremesso não foi para cima.');
 if(s.thrown.landed)return s.thrown.landed;
 if(!Number.isFinite(height)||height<0)throw Error('Informe uma altura de queda válida.');
 const target=await fromUuid(s.targetUuid);
 const key=message.id+':'+s.key+':landing';
 const fixed=Math.min(Math.floor(height),2*Math.max(0,derivedSummary(target).effective.vig));
 const outcome=await applyPhysicalDamage(target,{fixed,sourceId:key,reason:shadow?'Queda de Seguir Sombra':'Queda de Arremessar',
  camouflageContext:{located:true},critical:true});
 if(!conditionRecords(target).some(c=>c.weaponReceipt===key))
  await saveCondition(target,{key:'caido',source:'Queda do arremesso',weaponReceipt:key});
 s.thrown.landed={damage:outcome.damage,height};
 await persist(message,e);
 return s.thrown.landed;
}

async function landShadowHit(e,s){
 const parent=game.messages.get(e.shadowOrigin.messageId),original=parent&&execution(parent);
 const thrownSlot=original?.slots.find(slot=>slot.key===e.shadowOrigin.slotKey);
 if(!thrownSlot)throw Error('Arremesso original indisponível.');
 const result=await landThrow(parent,original,thrownSlot,e.shadowOrigin.height,{shadow:true});
 s.applied.shadowFallDamage=result.damage;
}

function shadowTurn(actor){
 const combat=game.combat;
 return combat?.started?`${combat.id}:${combat.round}:${combat.turn}`:periodKey(actor,'turn');
}

function hasShadowAcceleration(actor){
 if(derivedSummary(actor).acceleration.rank)return true;
 const shunjutsu=aptitudeOwned([...actor.items],'shunjutsu','',worldRules());
 return !clanCapabilities(actor,clanContext()).corpulenciaId&&Number(shunjutsu?.system.level??0)>=3&&!!activeAptitudes(actor).shunjutsu;
}

async function followShadow(message,e,s,actor,command){
 if(!s.thrown||s.thrown.landed||s.thrown.followed||!e.attacks[s.strike].throwTarget?.followShadow||
  !aptitudeOwned([...actor.items],'seguir-sombra','',worldRules())||
  (!hasShadowAcceleration(actor)&&(command.accelerated!==true||!!clanCapabilities(actor,clanContext()).corpulenciaId)))
  throw Error('Seguir Sombra exige um arremesso elegível e o atacante acelerado.');
 if(s.thrown.turn!==shadowTurn(actor))throw Error('Seguir Sombra deve acontecer no turno do arremesso.');
 const maneuver=command.maneuver??'golpear';
 if(!['golpear','ataque-multiplo','ataque-progressivo'].includes(maneuver))throw Error('Escolha Golpear, Ataque Múltiplo ou Ataque Progressivo.');
 const air=s.thrown.direction==='up',height=air?command.height:0;
 if(!Number.isFinite(height)||height<0)throw Error('Informe uma altura de queda válida.');
 const key=message.id+':'+s.key;
 let card=messages().find(entry=>execution(entry)?.shadowOrigin?.key===key);
 if(!card){
  const item=weaponDocument(actor,e.itemId);
  const itemId=item&&(e.itemId==='unarmed'||item.system.equipped)?e.itemId:'unarmed';
  const options={mode:'melee',maneuver,count:2};
  const prepared=prepareWeaponAction(actor,itemId,options);
  const slots=prepared.attacks.map((_,strike)=>({key:slotKey(strike,s.targetUuid),strike,targetUuid:s.targetUuid,name:s.name}));
  const next={schemaVersion:1,shadowOrigin:{key,messageId:message.id,slotKey:s.key,height},shadowAirborne:air,
   actorUuid:actor.uuid,actorName:actor.name,itemId,options,name:'Seguir Sombra',maneuverName:{golpear:'Golpear','ataque-multiplo':'Ataque Múltiplo','ataque-progressivo':'Ataque Progressivo'}[maneuver],
   state:'declared',started:false,privateDefenses:true,quickResolution:true,slots,attacks:copy(prepared.attacks),rolls:{},
   notes:['A perseguição não conta no limite de deslocamento. Posicione o atacante no mapa.'],action:'Parcial + ataque da aptidão',
   fingerprint:weaponFingerprint(actor,itemId,options)};
  card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(next),flags:{[ID]:{actionExecution:next}}});
 }
 await publishDefenseInvitations(card);
 s.thrown.followed=card.id;
 await persist(message,e);
}

// Básico 4.1.b, p. 268. Os efeitos vinculados usam o recibo do golpe.
async function resolveGrapple(message,e,slot,command){
 if(slot.grappleEnded||e.attacks[slot.strike].condition!=='agarrado'||!slot.applied?.conditionApplied)
  throw Error('Não há agarramento ativo neste golpe.');
 const source=await fromUuid(e.actorUuid),target=await fromUuid(slot.targetUuid);
 if(!source||!target)throw Error('Participante do agarramento indisponível.');
 const receipt='weapon:'+e.rolls[slot.strike].messageId+':'+target.id;
 const held=conditionRecords(target).find(record=>record.key==='agarrado'&&record.weaponReceipt===receipt);
 const maintenance=conditionRecords(source).find(record=>record.weaponReceipt===receipt+':manter');
 if(command.op==='grapple-difficulty'){
  if(!held||!['cc','for'].includes(command.stat))throw Error('Escolha uma base válida para o agarramento ativo.');
  slot.grappleDifficultyStat=command.stat;
  await persist(message,e);
  return;
 }
 if(command.op==='grapple-maintain'||command.op==='grapple-immobilize'){
  if(!held)throw Error('O alvo já se libertou.');
  const check=statPrecision(source,'for',{kind:'attribute',manualContext:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  const immobile=command.op==='grapple-immobilize'||!!slot.immobilization;
  if(immobile)await resolveImmobilization(message,e,slot,source,target);
  if(!maintenance)await saveCondition(source,{key:'lento',weaponReceipt:receipt+':manter',source:'Manter agarramento',
   notes:'Mover-se arrasta o alvo. Confira no mapa. Encerre usando Soltar no cartão.'});
  slot.grappleMaintained=true;
  await persist(message,e);
  if(command.op==='grapple-maintain')await declareFusionGrappleExtra(message,e,slot,source,target,command.requestId);
  return;
 }
 if(command.op==='grapple-escape'&&held){
  const stat=command.stat;
  if(!['cc','for','escapar'].includes(stat))throw Error('Escolha uma forma válida de escapar.');
  if(stat==='escapar'&&!slot.grappleDifficultyStat)throw Error('O atacante deve definir a dificuldade de Escapar.');
  const check=statPrecision(target,stat,{kind:'resistance',bodyResistance:true,manualContext:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  const oppositionStat=stat==='escapar'?slot.grappleDifficultyStat:stat;
  const opposition=statPrecision(source,oppositionStat,{kind:'resistance',bodyResistance:true,manualContext:true});
  const esguio=!!aptitudeOwned(mindCommonItems(target),'corpo-esguio','',worldRules());
  const escape=await grappleRoll(check.precision+(esguio?2:0));
  let hold,result;
  if(stat==='escapar'){
   hold=(oppositionStat==='cc'?4:7)+opposition.precision;
   result=escape.natural>=15||escape.natural>3&&escape.total>=hold?'first':'second';
  }else{
   const opposed=await grappleRoll(opposition.precision);
   hold=opposed.total;
   result=resolveOpposed(escape,opposed);
  }
  slot.grappleEscape={escape:escape.total,hold,result};
  if(result!=='first'){
   await persist(message,e);
   return;
  }
 }
 if(held)await saveCondition(target,held,{remove:true});
 if(maintenance)await saveCondition(source,maintenance,{remove:true});
 slot.grappleEnded=command.op==='grapple-escape'?'alvo se libertou':'alvo solto';
 await persist(message,e);
}
async function declareFusionGrappleExtra(parent,e,held,source,target,requestId){
 if(!source.system.powerState?.active?.some(p=>p.extraBasicAttack&&p.active!==false&&p.fusionReady))return;
 const key=parent.id+':'+held.key+':'+requestId;
 let card=messages().find(m=>execution(m)?.fusionGrappleKey===key);
 if(!card){
  const distance=tokenDistance(source,target.uuid)??held.distance??1;
  const itemId=e.itemId??'unarmed',options={mode:'melee',maneuver:'golpear',distance,
   ...(itemId==='unarmed'&&source.system.powerState.active.some(p=>p.effect==='shikakyu'&&p.active!==false)?{shikakyu:true}:{})};
  const prepared=prepareWeaponAction(source,itemId,options),extra=prepared.attacks.find(p=>p.fusionExtra);
  if(!extra)throw Error('Confira o ataque corporal extra da união com a mesa.');
  const slot={key:slotKey(0,target.uuid),strike:0,targetUuid:target.uuid,name:target.name,distance};
  const next={schemaVersion:1,fusionGrappleKey:key,actorUuid:source.uuid,actorName:source.name,itemId,options,
   name:'Ataque extra da união',maneuverName:'Golpear',action:'Incluído em Manter agarramento',state:'declared',started:false,
   privateDefenses:true,quickResolution:true,slots:[slot],attacks:[copy(extra)],rolls:{},notes:extra.notes,
   fingerprint:weaponFingerprint(source,itemId,options)};
  card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:source}),content:executionCard(next),flags:{[ID]:{actionExecution:next}}});
 }
 await publishDefenseInvitations(card);
 held.fusionGrappleExtra=card.id;await persist(parent,e);
}

// Guia p. 35. Repete o teste a cada manutenção, com −1 cumulativo no Vigor.
async function resolveImmobilization(message,e,slot,source,target){
 const plan=e.attacks[slot.strike],combat=game.combat,start=slot.grappleStart;
 if(!plan.canImmobilize||!aptitudeOwned([...source.items],'imobilizacao','',worldRules()))
  throw Error('Imobilização exige a aptidão e um agarramento desarmado.');
 if(!combat?.started||start?.combatId!==combat.id||combat.round<=start.round)
  throw Error('Imobilização exige uma rodada completa de agarramento no controle de combate.');
 const previous=slot.immobilization;
 if(previous?.round===combat.round&&previous.damage!=null)throw Error('A manutenção da imobilização já foi resolvida nesta rodada.');
 let pending=previous?.round===combat.round?previous:null;
 if(!pending){
  const count=(previous?.count??0)+1;
  const force=Number(source.system.attributes?.for??0);
  const vigor=statPrecision(target,'vig',{kind:'resistance',bodyResistance:true,manualContext:true});
  if(!vigor.allowed)throw Error(vigor.reasons.join(' '));
  const roll=await grappleRoll(vigor.precision-(count-1)),difficulty=7+force;
  const failed=roll.natural<=3||roll.natural<15&&roll.total<difficulty;
  pending={count,round:combat.round,total:roll.total,difficulty,fixed:failed?force:0};
  slot.immobilization=pending;
  await persist(message,e);
 }
 if(pending.fixed){
  const result=await applyPhysicalDamage(target,{fixed:pending.fixed,sourceId:message.id+':'+slot.key+':immobilize:'+pending.count,
   reason:'Imobilização',camouflageContext:{located:true},critical:true});
  pending.damage=result.damage;
 }else pending.damage=0;
 await persist(message,e);
}

async function grappleRoll(precision){
 const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();
 return {precision,total:roll.total,natural:roll.total-precision};
}

// Básico 4.1.b, pp. 69–70. O bloqueio libera uma resposta contra o atacante original.
async function collectBlockResponses(e){
 if(e.blockResponseKind&&e.blockResponseKind!=='falange')return;
 for(const s of e.slots){
  const plan=e.attacks[s.strike],roll=s.repeatedAttack??e.rolls[s.strike];
  if(s.blockResponse||s.defense?.kind!=='bloqueio'||s.result?.hit!==false||!roll)continue;
  const target=await fromUuid(s.targetUuid),source=await fromUuid(e.actorUuid);
  if(!target||!source)continue;
  const defense=roll.natural<=3?null:s.defenseRoll;
  const critical=defense?.natural>=15,attackFailed=roll.natural<=3;
  const margin=defense?defense.total-attackAgainstTarget(plan,roll,source,target,s.defense).total:0;
  const items=mindCommonItems(target),rules=worldRules();
  if(plan.ranged){
   const projectile=projectileFor(e,s,source);
   if(defense&&projectile&&aptitudeOwned(items,'apanhar-objetos','',rules))s.blockResponse={projectile};
   continue;
  }
  const counter=(e.options.maneuver??'golpear')==='golpear'&&!!aptitudeOwned(items,'contragolpe','',rules)&&(critical||attackFailed||margin>=4);
  const weapon=e.itemId!=='unarmed'&&weaponDocument(source,e.itemId);
  const blockingArmed=weapon&&s.strike===0&&!!aptitudeOwned(items,'bloquear-arma','',rules);
  let disarmed;
  if(blockingArmed&&critical){
   if(weapon.system.equipped)await weapon.update({'system.equipped':false});
   disarmed=weapon.name;
  }
  const disarm=!!(blockingArmed&&!critical&&margin>=4);
  if(counter||disarm||disarmed)s.blockResponse={counter,automatic:!!(critical||attackFailed),disarm,disarmed,
   stealId:disarmed&&aptitudeOwned(items,'roubar','',rules)?weapon.id:null};
 }
}

function projectileFor(e,s,source){
 const plan=e.attacks[s.strike];
 if(!plan.ranged||plan.returnedProjectile)return null;
 if(e.powerExecutionId){
  if(!['orbe','flechas','lanca'].includes(plan.effect)||plan.area)return null;
  return {kind:'power',units:plan.projectiles??1,base:plan.damage,range:plan.range};
 }
 const item=weaponDocument(source,e.itemId);
 const weapon=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item.system.catalogBook);
 if(!weapon||weapon.category==='firearm'||e.attacks.length>1)return null;
 return {kind:weapon.category==='shot'?'ammo':'throw',units:Math.max(1,plan.units??1),base:plan.base,range:plan.range,
  key:weapon.category==='shot'?(weapon.key.includes('crossbow')?'bolts':'arrows'):weapon.key,book:weapon.category==='shot'?'basico':weapon.book};
}

function projectileParries(actor,source,e,s){
 const projectile=source&&projectileFor(e,s,source),items=[...actor.items],rules=worldRules();
 const aptitude=aptitudeOwned(items,'apanhar-objetos','',rules),state=derivedSummary(actor).state;
 if(!projectile||!aptitude||!aptitudeOwned(items,'saque-rapido','',rules)||state.noActions||state.noAttack)return [];
 const stronger=Number(source.system.attributes.des)>Number(actor.system.attributes.des);
 if(stronger&&(aptitude.system.catalogBook!=='avancado'||state.noMovementAction))return [];
 if(!statPrecision(actor,'cd',{kind:'defense',reaction:true,manualContext:true}).allowed)return [];
 return items.filter(i=>i.type==='equipment'&&!i.system.destroyed&&Number(i.system.quantity)>=projectile.units&&
  WEAPONS.some(w=>w.key===i.system.catalogKey&&w.book===i.system.catalogBook&&w.category==='throw'))
  .map(i=>({id:i.id,name:i.name,units:projectile.units,action:stronger?'Movimento':'Parcial'}));
}

async function spendParry(actor,option,key){
 const item=actor.items.get(option.id);
 if(item.getFlag?.(ID,'projectileParry')?.[key])return;
 await item.update({'system.quantity':Number(item.system.quantity)-option.units,[`flags.${ID}.projectileParry.${key}`]:true});
}

async function handleCaughtProjectile(message,e,s,actor,command){
 const response=s.blockResponse,projectile=response?.projectile;
 const aptitude=aptitudeOwned([...actor.items],'apanhar-objetos','',worldRules());
 if(!projectile||!aptitude)throw Error('Nenhum projétil bloqueado está disponível.');
 if(command.op==='catch-projectile'){
  if(response.caught)throw Error('Projétil já apanhado.');
  const key=message.id+':'+s.key+':captured';
  let item=[...actor.items].find(i=>i.getFlag?.(ID,'caughtProjectile')===key);
  if(projectile.key&&!item){
   const w=WEAPONS.find(w=>w.key===projectile.key&&w.book===projectile.book);
   if(w){
    [item]=await actor.createEmbeddedDocuments('Item',[{type:'equipment',name:w.name,system:{
     catalogKey:w.key,catalogBook:w.book,quantity:projectile.units,equipped:false,source:{book:w.book,page:String(w.page)},
     compartments:w.slots?w.capacity+' item(ns) / '+w.slots+' compartimento(s)':''
    },flags:{[ID]:{caughtProjectile:key}}}]);
   }
  }
  response.caught={itemId:item?.id,canReturn:projectile.kind==='throw'||aptitude.system.catalogBook==='avancado'};
  await persist(message,e);
  return;
 }
 const caught=response.caught,state=derivedSummary(actor).state;
 if(!caught?.canReturn||caught.returned||state.noAttack||state.noActions)throw Error('Devolução indisponível.');
 const source=await fromUuid(e.actorUuid),distance=tokenDistance(actor,source?.uuid)??s.distance;
 if(!source)throw Error('O atacante original não está disponível.');
 const penalty=distance==null?0:rangePenalty(distance,projectile.range);
 const captured=caught.itemId&&actor.items.get(caught.itemId);
 const key=message.id+':'+s.key+':return';
 let card=messages().find(entry=>execution(entry)?.blockResponseKey===key);
 if(!card){
  const advanced=aptitude.system.catalogBook==='avancado';
  const check=statPrecision(actor,advanced?'cc':'cd',{kind:advanced?'defense':'attack',reaction:advanced,manualContext:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  if(caught.itemId&&(!captured||Number(captured.system.quantity)<projectile.units))
   throw Error('Os projéteis apanhados já não estão disponíveis.');
  const original=e.attacks[s.strike],weapon=WEAPONS.find(w=>w.key===projectile.key&&w.book===projectile.book);
  const base=advanced?projectile.base:Math.ceil(Number(actor.system.attributes.des??0)/2)+(['kunai','senbon','shuriken'].includes(projectile.key)&&[2,6].includes(projectile.units)?2:weapon?.thrownDamage??weapon?.damage??0);
  const plan={base,precision:(advanced?s.defenseRoll.precision:check.precision)+penalty,ranged:true,critical:15,returnedProjectile:true,
   range:projectile.range,element:original.element,damageType:original.damageType,notes:[]};
  const uuid=source.uuid,next={schemaVersion:1,blockResponseKey:key,blockResponseKind:'projectile',
   actorUuid:actor.uuid,actorName:actor.name,itemId:'unarmed',options:{mode:'ranged'},name:'Apanhar Objeto · Devolver projétil',
   maneuverName:'Lançar Projétil',state:'declared',started:true,privateDefenses:true,quickResolution:true,
   slots:[{key:slotKey(0,uuid),strike:0,targetUuid:uuid,name:source.name,distance}],attacks:[plan],rolls:{},notes:[],action:'Livre'};
  card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(next),flags:{[ID]:{actionExecution:next}}});
 }
 if(captured&&!captured.getFlag(ID,'returnedProjectile')){
  const remaining=Number(captured.system.quantity)-projectile.units;
  if(remaining<0)throw Error('Os projéteis apanhados já não estão disponíveis.');
  if(!remaining)await captured.delete();
  else await captured.update({'system.quantity':remaining,[`flags.${ID}.returnedProjectile`]:true});
 }
 await publishDefenseInvitations(card);
 caught.returned=true;await persist(message,e);
}

function theftOptions(victim,s,fromBlock){
 if(!victim)return [];
 const dropped=fromBlock?s.blockResponse?.stealId:s.disarmedItem?.id;
 if(fromBlock&&!dropped)return [];
 return [...victim.items].flatMap(item=>{
  if(!['equipment','device'].includes(item.type)||item.system.destroyed||Number(item.system.quantity??1)<=0)return [];
  if(dropped&&item.id===dropped)return [{id:item.id,name:item.name,max:1}];
  if(fromBlock||item.system.inventoryData?.storedElsewhere||inventoryEntry(item)?.kind==='armor'&&item.system.equipped)return [];
  const entry=inventoryEntry(item)??WEAPONS.find(w=>w.key===item.system.catalogKey&&w.book===item.system.catalogBook);
  const custom=String(item.system.compartments??'').match(/(\d+)\s*(?:item[^/]*)?\/\s*(\d+)/i);
  const slots=entry?.slots??(custom?Number(custom[2]):null);
  if(slots!==1)return [];
  const capacity=entry?.capacity??(custom?Number(custom[1]):1);
  const max=Math.min(Number(item.system.quantity??1),item.system.inventoryData?.kousenPrepared?Math.max(1,Math.floor(capacity/2)):capacity);
  return [{id:item.id,name:item.name,max}];
 });
}

async function stealDisarmed(message,e,s,actor,command,fromBlock){
 const state=derivedSummary(actor).state;
 if(!command.hands||state.noActions||!aptitudeOwned([...actor.items],'roubar','',worldRules())||s.stolen||
    (fromBlock?!s.blockResponse?.stealId:s.applied?.disarmedMetres==null||!s.canSteal))
  throw Error('Roubar exige um Desarmar bem-sucedido e mãos livres.');
 const victim=await fromUuid(fromBlock?e.actorUuid:s.targetUuid),key=message.id+':'+s.key+':roubar';
 if(!victim||victim.uuid===actor.uuid)throw Error('Alvo inválido.');
 let received=[...actor.items].find(i=>i.getFlag?.(ID,'theft')?.key===key);
 if(!received){
  const option=theftOptions(victim,s,fromBlock).find(o=>o.id===command.itemId),quantity=command.quantity;
  if(!option||!Number.isInteger(quantity)||quantity<1||quantity>option.max)throw Error('Escolha um item e quantidade de até um compartimento.');
  const item=victim.items.get(option.id),data=item.toObject();
  if(item.system.inventoryData?.storedElsewhere)throw Error('O item está armazenado fora da ficha.');
  if(data.flags?.[ID])for(const key of ['caughtProjectile','returnedProjectile','projectileParry','theft'])delete data.flags[ID][key];
  delete data._id;delete data.id;
  data.system.quantity=quantity;data.system.equipped=false;
  if(data.system.inventoryData){delete data.system.inventoryData.storedElsewhere;delete data.system.inventoryData.containerId;}
  data.flags={...data.flags,[ID]:{...data.flags?.[ID],theft:{key,itemId:item.id,quantity,before:Number(item.system.quantity??1)}}};
  [received]=await actor.createEmbeddedDocuments('Item',[data]);
 }
 const receipt=received.getFlag(ID,'theft'),item=victim.items.get(receipt.itemId);
 if(item){
  const left=receipt.before-receipt.quantity,current=Number(item.system.quantity??1);
  if(current===receipt.before){
   if(left===0)await item.delete();
   else await item.update({'system.quantity':left});
  }else if(current!==left){
   await received.delete();
   throw Error('O estoque do alvo mudou durante a transferência.');
  }
 }
 s.stolen=received.name;
 if(fromBlock)s.blockResponse.stolen=true;
 await persist(message,e);
}

async function launchBlockResponse(message,e,s,actor,kind){
 const response=s.blockResponse;
 if(!response?.[kind]||response[kind+'Used'])throw Error('A resposta não está disponível.');
 const key=message.id+':'+s.key+':'+kind;
 let card=messages().find(entry=>execution(entry)?.blockResponseKey===key);
 if(!card){
  const source=await fromUuid(e.actorUuid);
  if(!source)throw Error('Atacante original indisponível.');
  if(kind==='counter'&&derivedSummary(actor).state.keys.includes('caido'))throw Error('Caído impede um ataque oportuno.');
  const maneuver=kind==='counter'?'golpear':'desarmar';
  let itemId=s.defense.weaponId??'unarmed';
  const item=weaponDocument(actor,itemId);
  const weapon=WEAPONS.find(w=>w.melee&&w.key===item?.system.catalogKey&&w.book===item.system.catalogBook);
  if(!weapon||itemId!=='unarmed'&&!item.system.equipped||
   !Object.hasOwn(availableManeuvers([...actor.items],worldRules(),weapon,'melee'),maneuver))itemId='unarmed';
  const distance=s.distance??e.options.distance??null;
  const options={mode:'melee',maneuver,...(distance==null?{}:{distance})};
  const prepared=prepareWeaponAction(actor,itemId,options);
  if(kind==='counter')await claimOpportunity(actor,source,key);
  const automatic=kind==='counter'&&response.automatic;
  const target={key:slotKey(0,source.uuid),strike:0,targetUuid:source.uuid,name:source.name,distance};
  if(automatic)target.defense={kind:'none',byName:'Acerto automático'};
  const next={schemaVersion:1,blockResponseKey:key,blockResponseKind:kind,blockResponseAutomatic:automatic,
   actorUuid:actor.uuid,actorName:actor.name,itemId,options,disarmItemId:kind==='disarm'?e.itemId:null,name:kind==='counter'?'Contragolpe':'Bloquear Arma · Desarmar',
   maneuverName:kind==='counter'?'Ataque oportuno':'Desarmar',state:automatic?'ready':'declared',started:false,
   privateDefenses:true,quickResolution:true,slots:[target],attacks:copy(prepared.attacks),rolls:{},
   notes:prepared.plan.notes,action:'Livre',fingerprint:weaponFingerprint(actor,itemId,options)};
  card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(next),flags:{[ID]:{actionExecution:next}}});
 }
 const next=execution(card);
 if(next.blockResponseAutomatic){
  if(!next.rolls[0]&&!terminalExecution(next.state))await rollAndResolveAttack(card,next,actor);
  else if(next.rolls[0]&&!next.slots[0].applied)await applyQuickResult(card,next,next.slots[0]);
 }else await publishDefenseInvitations(card);
 response[kind+'Used']=true;
 await persist(message,e);
}

// Básico p. 82. Só se oferece a troca após falhar por até dois em uma reação.
function replicaEligibility(e,s,target){
 const plan=e.attacks[s.strike],margin=s.result?.defenseMargin;
 if(plan.hachimonHeavy?.fatal)return null;
 if(!s.result?.hit||s.applied||s.replicaUsed||![1,2].includes(margin)||
  !['esquiva','bloqueio','antecipar'].includes(s.defense?.kind)||e.shadowAirborne||
  plan.area||plan.sizeSweep||['ataque-giratorio','chute-giratorio'].includes(e.options.maneuver)||
  e.powerExecutionId&&plan.effect!=='canhao')return null;
 const item=aptitudeOwned(mindCommonItems(target),'replica-enganadora','',worldRules());
 if(!item||!(worldProfile()?.books??[]).includes(item.system.catalogBook))return null;
 const level=Number(item.system.level??1),limit=level>=2?2:1;
 const usage=runtimeState(target).uses?.['replica-enganadora'];
 const state=derivedSummary(target).state;
 if(state.noActions||state.noMovementAction||state.immobile||!canPayChakraCost(target,4,clanContext())||
  usage?.stamp===periodKey(target,'scene')&&usage.count>=limit)return null;
 return {level,limit,margin};
}

async function useReplica(message,e,s,target,stealth,converted=0){
 const receiptId=message.id+':'+s.key;
 const existing=readKeyedRecord(runtimeState(target).replicaReceipts,receiptId);
 const offer=s.replicaOffer&&!s.applied&&!s.replicaUsed&&replicaEligibility(e,s,target);
 if(!s.replicaOffer||s.applied||s.replicaUsed||!offer&&!existing)throw Error('Réplica Enganadora indisponível para este golpe.');
 if(stealth&&!existing&&offer.level<2)throw Error('Furtividade nesta fuga exige Réplica Enganadora 2.');
 const result=await mutateRuntime(target,async state=>{
  state.replicaReceipts??={};
  if(readKeyedRecord(state.replicaReceipts,receiptId))return readKeyedRecord(state.replicaReceipts,receiptId);
  const payment=corpulenciaPayment(target,4,converted,clanContext());
  claimUsage(state,target,'replica-enganadora','scene',offer.limit);
  const movement=derivedSummary(target).movement;
  const saved={distance:stealth?Math.ceil(movement/2):movement};
  if(stealth){
   const check=statPrecision(target,'furtividade',{kind:'skill',manualContext:true});
   if(!check.allowed)throw Error(check.reasons.join(' '));
   saved.stealth=(await grappleRoll(check.precision)).total;
  }
  state.replicaReceipts[recordKey(receiptId)]=saved;
  return {...saved,changes:payment};
 });
 const {distance,stealth:total}=result;
 s.replicaUsed={distance,stealth:total??null};
 delete s.replicaOffer;
 s.result={hit:false,redirectedToReplica:true};
 await finish(message,e);
}

async function finish(message,e){
 if(e.assistedPowerId){
  const s=e.slots[0],origin=game.messages.get(e.assistedPowerId);
  if(s.result&&origin){
   const entries=origin.getFlag(ID,'assistedTechniqueCounters')??[];
   await origin.setFlag(ID,'assistedTechniqueCounters',entries.map(entry=>entry.targetUuid===s.targetUuid?
    {...entry,hit:s.result.hit,counterElement:s.result.cancelledTechnique?s.defense.counter.plan.element??s.defense.counter.plan.family:null,repeatedAttack:s.repeatedAttack??null,defenseTotal:s.defenseRoll?.total??null}:entry));
   e.state='complete';
  }
  await persist(message,e);
  return;
 }
 if(groupedPowerExecution(e))for(const s of e.slots){
  if(!s.result||s.result.hit)continue;
  const plan=e.attacks[s.strike],roll=s.repeatedAttack??e.rolls[s.strike];
  const heat=plan.fireDifficulty!=null&&!(s.result.cancelledTechnique&&s.defense.counter?.plan.family==='suiton');
  const residual=roll?.natural>3&&!s.result.cancelledTechnique&&!s.result.barrier&&!s.result.kaiten&&
   plan.resistances.some(r=>r.afterSuccessfulDefense);
  const retry=roll?.natural>3&&e.powerGroup&&e.slots.length===1&&plan.rerollAfterDefense&&
   ['esquiva','antecipar'].includes(s.defense.kind);
  if(heat||residual||retry)s.result.areaResidual=true;
 }
 const source=e.powerExecutionId&&!e.ricochet&&!e.powerArea&&e.slots.length===1&&eligibleEfficientTechnique(e.attacks[0])?await fromUuid(e.actorUuid):null;
 const canImprove=source&&aptitudeOwned([...source.items],'tecnica-eficiente','',worldRules());
 const sourceState=canImprove&&derivedSummary(source).state;
 for(const s of e.slots){
  if(!s.result?.hit||s.applied)continue;
  if(canImprove&&!sourceState.noActions&&!sourceState.noMovementAction&&!s.result.barrier&&!s.result.kaiten&&
     !(s.repeatedAttack?s.repeatedAttack.natural>=(e.attacks[s.strike].critical??15):e.rolls[s.strike]?.critical))s.efficientOffer=true;
  if(s.replicaOffer||s.replicaDeclined)continue;
  const target=await fromUuid(s.targetUuid);
  if(target){
   const offer=replicaEligibility(e,s,target);
   if(offer)s.replicaOffer=offer;
  }
 }
 await collectBlockResponses(e);
 await publishKaitenCounters(message,e);
 if(Object.keys(e.rolls).length===e.attacks.length&&e.slots.every(s=>s.result&&(!needsApplication(s.result)||s.applied)))e.state='complete';
 if(e.state==='complete'&&e.attacks[0]?.shadow?.binding){
  const {settleShadowBinding}=await import('./power-actions.mjs');await settleShadowBinding(await fromUuid(e.actorUuid),e.powerExecutionId);
 }
 if(e.state==='complete'&&e.attacks[0]?.nui?.stitch){
  const {settleNuiSource}=await import('./power-actions.mjs');await settleNuiSource(await fromUuid(e.actorUuid),e.powerExecutionId);
 }
 await persist(message,e);
 if(e.state==='complete'&&e.ricochet)await advanceRicochet(message,e);
}

// Básico 4.1.b, p. 99. Each jump is a separate execution with its own defense
// and damage receipt; future targets have no invitation until this one resolves.
async function advanceRicochet(message,e){
 const sequence=e.ricochet,index=sequence.index+1,current=e.slots[0],s=sequence.slots[index];
 if(!s||e.ricochetStopped||e.ricochetNext)return;
 if(!current.result?.hit||current.result.barrier||current.result.kaiten||current.applied?.hit===false){
  e.ricochetStopped=true;
  await persist(message,e);
  return;
 }
 if(!current.applied)return;
 const powerExecutionId=sequence.rootId+':salto:'+index;
 let next=messages().find(m=>{const data=execution(m);return data?.actorUuid===e.actorUuid&&data.powerExecutionId===powerExecutionId;});
 if(!next){
  const actor=await fromUuid(e.actorUuid),target=await fromUuid(s.targetUuid);
  if(!actor?.items.get(e.itemId)||!target){
   e.ricochetStopped=true;e.error='O próximo alvo ou a técnica deixou de estar disponível.';
   await persist(message,e);
   return;
  }
  const data={schemaVersion:1,actorUuid:e.actorUuid,actorName:e.actorName,itemId:e.itemId,
   powerExecutionId,powerGroup:true,options:{},name:e.name,state:'declared',started:false,
   privateDefenses:true,quickResolution:e.quickResolution,slots:[copy(s)],attacks:copy(e.attacks),rolls:{},
   ricochet:{...sequence,index},notes:e.notes,action:'Continuação'};
  next=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(data),flags:{[ID]:{actionExecution:data}}});
 }
 await publishDefenseInvitations(next);
 e.ricochetNext=next.id;
 await persist(message,e);
}

function counterOptions(target,incoming,distance){
 if(!isDamagingNinpou(incoming)||incoming.usedMetaAptitudes)return [];
 const state=derivedSummary(target).state;
 if(state.noActions||state.noReactions||activeAptitudes(target)['estilo-zui-quan']||!statPrecision(target,'lm',{kind:'defense',reaction:true,manualContext:true}).allowed)return [];
 const context={actor:target,...clanContext()},items=mindCommonItems(target),options=[];
 for(const active of target.system.powerState?.active??[]){
  if(active.effect!=='lamina-raios'||!target.items.get(active.itemId)||active.plan?.usedMetaAptitudes||
     Math.abs(active.level-incoming.level)>1||!Number.isFinite(active.touchDamage)||active.touchDamage<=0)continue;
  const plan={...active.plan,level:active.level,stat:'cc',damage:active.touchDamage,cost:0,area:null};
  options.push({key:'active:'+active.id,itemId:active.itemId,activeId:active.id,plan,
   confirm:plan.effect!==incoming.effect||plan.family!==incoming.family,label:'Lâmina de Raios preparada · Nv '+active.level});
 }
 for(const item of items.filter(i=>i.type==='power'&&POWER_FAMILIES[i.system.powerData?.family]?.effects&&i.system.powerData.family!=='kikai-ninpou')){
  const learned=knownPowerEffects(item,context);
  const max=Math.max(Number(item.system.level),...items.filter(i=>i.type==='power'&&i.system.powerData?.family===item.system.powerData.family).map(i=>Number(i.system.level)));
  for(const [effect,tier] of learned){
   for(let level=Math.max(1,incoming.level-1);level<=Math.min(max,incoming.level+1);level++){
    try{
     const plan=powerPlan(item,target.system,items,{effect,level,tier},context);
     if(!isDamagingNinpou(plan)||plan.action!=='standard'||plan.consume||plan.active||plan.limit||
        !statPrecision(target,'lm',{kind:'defense',reaction:true,manualContext:true,requiresSeals:plan.seals}).allowed||
        incoming.area&&plan.stat!=='cc'&&plan.area!==incoming.area||
        distance!=null&&plan.stat==='cd'&&distance>plan.range||
        !canPayChakraCost(target,plan.cost,clanContext()))continue;
     const confirm=plan.family!==incoming.family||plan.effect!==incoming.effect||
      plan.stat!==incoming.stat||plan.area!==incoming.area;
     options.push({key:[item.id,effect,level].join(':'),itemId:item.id,plan,confirm,label:item.name+' · '+plan.name+' Nv '+level+' · '+plan.cost+' chakra'});
    }catch{/* The chosen level cannot execute this learned effect. */}
   }
  }
 }
 return options;
}

async function chooseTechniqueCounter(options){
 if(!options.length)throw Error('Nenhuma técnica da ficha pode anular este ataque.');
 const selected=await foundry.applications.api.DialogV2.prompt({
  window:{title:'Anular Técnica'},
  content:`<label>Técnica de resposta <select name="counter">${options.map(o=>`<option value="${esc(o.key)}">${esc(o.label)}</option>`).join('')}</select></label>`,
  ok:{label:'Escolher técnica',callback:(_event,button)=>button.form.elements.counter.value}
 });
 if(!selected)return null;
 const option=options.find(o=>o.key===selected);
 if(option.confirm&&!await foundry.applications.api.DialogV2.confirm({
  window:{title:'Equivalência da técnica'},content:'<p>Confirme com a mesa que a técnica escolhida pode anular o efeito declarado.</p>'
 }))return null;
 return {counterKey:selected,compatible:true};
}

async function payTechniqueCounter(target,counter,key,converted=0){
 await mutateRuntime(target,state=>{
  state.techniqueCounters??={};
  if(readKeyedRecord(state.techniqueCounters,key))return;
  const payment=corpulenciaPayment(target,counter.plan.cost,converted,clanContext());
  state.techniqueCounters[recordKey(key)]=true;
  const active=target.system.powerState?.active??[];
  if(counter.activeId&&!active.some(record=>record.id===counter.activeId))throw Error('Lâmina de Raios deixou de estar preparada.');
  return {changes:{...payment,
   ...(counter.activeId?{'system.powerState.active':active.filter(record=>record.id!==counter.activeId)}:{})}};
 });
}

export async function chooseAssistedTechniqueCounter(message,target){
 const attack=message?.getFlag(ID,'powerAttack');
 if(!attack||attack.coordinated||attack.critical||attack.failed)throw Error('Este ataque não admite Anular Técnica por aqui.');
 const selected=await chooseTechniqueCounter(counterOptions(target,attack.plan,attack.targetUuid===target.uuid?attack.distance:null));
 if(selected){
  const cost=counterOptions(target,attack.plan,attack.targetUuid===target.uuid?attack.distance:null).find(o=>o.key===selected.counterKey)?.plan.cost;
  const converted=await chooseCorpulenciaPayment(target,cost);
  if(converted==null)return;
  await requestAction({op:'assisted-technique-counter',messageId:message.id,targetUuid:target.uuid,...selected,convertedChakra:converted});
 }
}

async function chooseCorpulenciaPayment(target,cost){
 if(!clanCapabilities(target,clanContext()).corpulenciaId)return 0;
 return foundry.applications.api.DialogV2.prompt({window:{title:'Corpulência · pagamento'},
  content:`<p>Custo: ${cost} chakra. Cada ponto substituído custa 2 Vitalidade.</p><label>Chakra substituído <input name="converted" type="number" min="0" max="${cost}" step="1" value="0" required></label>`,
  ok:{label:'Pagar e usar',callback:(_event,button)=>button.form.elements.converted.valueAsNumber}});
}

async function resolveAssistedTechniqueCounter(command,user){
 const message=game.messages.get(command.messageId),target=await fromUuid(command.targetUuid),attack=message?.getFlag(ID,'powerAttack');
 if(!canUse(target,user)||!attack||attack.actorUuid===target.uuid||attack.coordinated||attack.critical||attack.failed||
    attack.targetUuid&&attack.targetUuid!==target.uuid&&!attack.plan.area&&attack.plan.targets<=1)
  throw Error('Não é possível anular esta técnica para esse alvo.');
 const receiptId=(message.uuid??message.id)+':'+target.uuid;
 if(readKeyedRecord(target.system.powerState?.receipts,receiptId))throw Error('O ataque já foi resolvido para este alvo.');
 const source=await fromUuid(attack.actorUuid),creator=author(message);
 if(!creator||!canUse(source,creator))throw Error('Origem da técnica sem autorização.');
 const entries=message.getFlag(ID,'assistedTechniqueCounters')??[];
 if(entries.some(entry=>entry.targetUuid===target.uuid))throw Error('Anular Técnica já foi resolvida para este alvo.');
 const distance=attack.targetUuid===target.uuid?attack.distance:null;
 const counter=counterOptions(target,attack.plan,distance).find(o=>o.key===command.counterKey);
 if(!counter||counter.confirm&&!command.compatible)throw Error('A técnica escolhida não pode anular este ataque.');
 await payTechniqueCounter(target,counter,receiptId,Number(command.convertedChakra??0));
 const s={key:slotKey(0,target.uuid),strike:0,targetUuid:target.uuid,name:target.name,distance,
  defense:{kind:'cancel-technique',counter,by:user.id,byName:user.name}};
 const e={schemaVersion:1,actorUuid:attack.actorUuid,actorName:source?.name,itemId:attack.itemId,options:{},
  name:'Anular Técnica · '+attack.plan.name,state:'active',started:true,privateDefenses:true,quickResolution:true,
  assistedPowerId:message.id,attacks:[{...attack.plan,critical:attack.plan.critical??15}],
  slots:[s],rolls:{0:{...attack,messageId:message.id}},action:'standard'};
 const card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:target}),content:executionCard(e),flags:{[ID]:{actionExecution:e}}});
 await message.setFlag(ID,'assistedTechniqueCounters',[...entries,{targetUuid:target.uuid,hit:null}]);
 await resolveExecutionDefense(card,e,s,target,user,{});
}

async function launchTechniqueCounter(message,e,s,actor){
 const state=derivedSummary(actor).state,counter=s.defense?.counter,excess=s.result?.counterExcess;
 if(!counter||!excess||state.noActions||state.noMovementAction||s.counterExecution||e.combatId&&
    (game.combats.get(e.combatId)?.round!==e.counterRound||game.combats.get(e.combatId)?.combatant?.id!==e.counterTurn))throw Error('Superar Técnica indisponível.');
 const source=await fromUuid(e.actorUuid);
 if(!source||!actor.items.get(counter.itemId))throw Error('Personagem ou técnica indisponível.');
 const powerExecutionId=message.id+':superar:'+s.key,original=counter.plan;
 const plan={name:'Superar Técnica · '+original.name,family:original.family,element:original.element??original.family,
  effect:'superar-tecnica',level:original.level,tier:original.tier,stat:original.stat,range:original.range,
  ranged:original.stat==='cd',duration:'instant',source:original.source,action:'movement',cost:0,damage:excess,base:excess,
  targets:1,counterPenalty:-3,critical:15,minimumDegree:0,area:null,resistances:[],conditions:[],notes:[]};
 let followup=messages().find(m=>execution(m)?.powerExecutionId===powerExecutionId);
 if(!followup){
  const uuid=source.uuid,reply={schemaVersion:1,actorUuid:actor.uuid,actorName:actor.name,itemId:counter.itemId,powerExecutionId,
   options:{},name:plan.name,state:'declared',started:false,privateDefenses:true,quickResolution:true,
   slots:[{key:slotKey(0,uuid),strike:0,targetUuid:uuid,name:source.name,distance:s.distance}],
   attacks:[plan],rolls:{},notes:[],action:plan.action};
  followup=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(reply),flags:{[ID]:{actionExecution:reply}}});
 }
 await publishDefenseInvitations(followup);
 s.counterExecution=followup.id;
 await persist(message,e);
}

function canEvade(e,s,target){
 const state=derivedSummary(target).state;
 return !e.shadowAirborne&&!state.noActions&&!state.noMovementAction&&!state.noReactions&&!state.immobile;
}
function blockingOptions(target,source,e,s){
 const plan=e.attacks[s.strike];
 if(!source||plan.cannotBlock&&plan.effect!=='raio'||['chute-inverso','soco-agarrado'].includes(e.options.maneuver)||!canBlockSize(sizeProfile(source.system).key,sizeProfile(target.system)))return [];
 const options=mindCommonItems(target).filter(item=>item.type==='equipment'&&!item.system.destroyed&&item.system.equipped!==false&&WEAPONS.some(w=>w.key===item.system.catalogKey&&w.book===item.system.catalogBook&&w.melee));
 if(plan.effect==='raio'&&plan.cannotBlock){
  const active=target.system.powerState?.active??[];
  return options.filter(item=>item.getFlag?.(ID,'createdPower')?.projectileBlock||
   active.some(effect=>effect.active!==false&&effect.weaponId===item.id&&effect.projectileBlock));
 }
 if(plan.juuken)options.unshift({id:'unarmed',name:'Bloqueio desarmado'});
 return options;
}
function barrierOption(target,item,e,s,{checkChakra=true,level=3,extra=0,converted=null}={}){
 if(item?.type!=='power'||s.strike>0&&!fusionExecution(e)||['counter','falange'].includes(e.blockResponseKind)||e.options.maneuver==='ataque-oportuno'||(s.distance??e.options.distance??Infinity)<=1)return null;
 const context={actor:target,...clanContext()};
 try{
  const owned=knownPowerEffects(item,context).get('barreira');
  if(!owned||!Number.isInteger(level)||level<3||!Number.isInteger(extra)||extra<0||extra>level)return null;
  const items=mindCommonItems(target),tier=[3,6,9].findLast(t=>t<=level&&t<=owned);
  const plan=powerPlan(item,target.system,items,{effect:'barreira',tier,level},context);
  const earth=plan.family==='doton'&&!!aptitudeOwned(items,'dominio-da-terra','',context.rules);
  if(extra&&!earth)return null;
  plan.extra=extra;plan.cost+=extra;plan.hardness+=extra;
  plan.earth=earth;
  if(!plan.defensive||checkChakra&&(
   !canPayChakraCost(target,plan.cost,context,converted)||activeAptitudes(target)['estilo-zui-quan']||
   !statPrecision(target,'lm',{kind:'defense',reaction:true,manualContext:true,requiresSeals:plan.seals}).allowed
  ))return null;
  return plan;
 }catch{return null;}
}
async function publishDefenseInvitations(message){
 const e=execution(message);
 for(const s of e.slots){
  if(messages().some(m=>{const invite=m.getFlag(ID,'defenseInvitation');return (invite?.rootExecutionId??invite?.executionId)===message.id&&invite.slotKey===s.key;}))continue;
  const target=await fromUuid(s.targetUuid);
  if(!target)continue;
  if(groupedPowerExecution(e)&&e.attacks[s.strike].resistances.some(r=>r.beforeDefense)){
   const {preparePowerResistance}=await import('./power-actions.mjs');
   await preparePowerResistance({...e.attacks[s.strike],...(s.hidden?{privateRecipients:users().filter(u=>u.isGM).map(u=>u.id)}:{})},target,message.id);
  }
  await ChatMessage.create({
   whisper:users().filter(user=>canRespondDefense(target,user)).map(user=>user.id),
   content:`<section class="sns-app sns-execution sns-defense-slip"><h3>Defesa de ${esc(s.name)}</h3><p>${esc(e.actorName)} declarou ${esc(actionTitle(e))} · golpe ${s.strike+1}.</p><div data-sns-defense-choices>Abra o cartão para conferir as defesas.</div></section>`,
   flags:{[ID]:{defenseInvitation:{executionId:e.hasPrivateTargets?messages().find(m=>m.getFlag(ID,'executionRoot')===message.id&&m.getFlag(ID,'executionView')===(s.hidden?s.key:'public')).id:message.id,rootExecutionId:message.id,slotKey:s.key}}}
  });
 }
}
export async function finishMindExecutions(sourceUuid,rootId,bodyUuids=[]){
 for(const message of messages()){
  const e=execution(message);if(!e||terminalExecution(e.state))continue;
  if(e.control?.sourceUuid===sourceUuid&&e.control.rootId===rootId){
   e.state='interrupted';e.interruptedBy=game.user.id;await persist(message,e);continue;
  }
  if(e.started)continue;
  let changed=false;
  for(const slot of e.slots.filter(s=>bodyUuids.includes(s.targetUuid)&&!e.rolls[s.strike])){
   if(slot.defense&&!slot.defense.initiated){delete slot.defense;changed=true;}
   const body=await fromUuid(slot.targetUuid);
   for(const invitation of messages().filter(m=>{
    const flag=m.getFlag(ID,'defenseInvitation');return flag?.rootExecutionId===message.id&&flag.slotKey===slot.key;
   }))await invitation.update({whisper:users().filter(user=>canRespondDefense(body,user)).map(user=>user.id)});
  }
  if(changed){e.state='declared';await persist(message,e);}
 }
}
async function bindDefenseInvitation(invite,root,report){
 const list=root.querySelector('[data-sns-defense-choices]');
 if(!list)return;
 const message=game.messages.get(invite.executionId),e=message?.getFlag(ID,'actionExecution');
 const s=e?.slots.find(slot=>slot.key===invite.slotKey);
 const target=s&&await fromUuid(s.targetUuid);
 if(!canRespondDefense(target,game.user)){list.textContent='Defesa indisponível.';return;}
 if(s.defense||e.started||terminalExecution(e.state)){list.textContent='A escolha de defesa já foi encerrada.';return;}
 const source=await fromUuid(e.actorUuid),state=derivedSummary(target).state,choices=[];
 const add=(label,command)=>choices.push({label,command});
 if(e.attacks[s.strike].hachimonHeavy?.fatal)add('Registrar ataque indefensável · oitavo Portão',{kind:'none'});
 else if(state.noReactions)add('Registrar sem reação disponível',{kind:'none'});
 else{
  if(!e.attacks[s.strike].noDodge)add('Esquiva',{kind:'esquiva'});
  if(!e.attacks[s.strike].noDodge&&aptitudeOwned(mindCommonItems(target),'esquiva-de-risco','',worldRules()))add('Esquiva de Risco',{kind:'esquiva',risk:true});
  add('Antecipar',{kind:'antecipar'});
  const counters=counterOptions(target,slotPowerPlan(e.attacks[s.strike],s),s.distance);
  if(counters.length)add('Anular Técnica · Padrão',{kind:'cancel-technique',counters});
  if(canEvade(e,s,target))add('Evadir · Movimento',{kind:'antecipar',evade:true});
  if(!e.attacks[s.strike].noDodge&&clanCapabilities(target,clanContext()).sharingan)add('Esquiva Perceptiva',{kind:'esquiva',perceptive:true});
  for(const item of blockingOptions(target,source,e,s))add(item.id==='unarmed'?item.name:'Bloqueio · '+item.name,{kind:'bloqueio',weaponId:item.id});
  for(const parry of projectileParries(target,source,e,s))
   add(`Rebater · ${parry.name} × ${parry.units} · ${parry.action}`,{kind:'rebater',projectileId:parry.id});
  for(const item of mindCommonItems(target)){
   const barrier=barrierOption(target,item,e,s);
   if(barrier)add(`Barreira · ${POWER_FAMILIES[barrier.family].name} · ${barrier.cost} chakra no nível 3`,
    {kind:'technique',techniqueId:item.id,barrier:true,...(barrier.earth?{earth:true}:{})});
   if((s.strike===0||fusionExecution(e))&&e.options.maneuver!=='ataque-oportuno'&&item.type==='power'&&item.system.powerData?.family==='juuken'){
    try{
     kaitenDefense(target,item,3);
     if(canPayChakraCost(target,3,clanContext()))add('Kaiten defensivo',{kind:'technique',techniqueId:item.id,kaiten:true,kaitenLevel:3});
    }catch{/* The sheet cannot execute Kaiten in its current state. */}
   }
  }
 }
 if(game.user.isGM)add('Registrar exceção',{kind:'manual'});
 list.replaceChildren();
 if(clanCapabilities(target,clanContext()).corpulenciaId&&choices.some(c=>['technique','cancel-technique'].includes(c.command.kind))){
  const conversion=document.createElement('label');conversion.textContent='Corpulência · chakra pago com 2 Vitalidade por ponto';
  const input=document.createElement('input');input.name='convertedChakra';input.type='number';input.min='0';input.step='1';input.value='0';conversion.append(input);list.append(conversion);
 }
 for(const {label,command} of choices.filter(c=>basicMindDefense(target,c.command)).filter(c=>shadowDefense(e.attacks[s.strike],state,c.command,target.uuid).allowed)){
  const button=document.createElement('button');button.type='button';button.className='sns-btn';button.textContent=label;list.append(button);
  button.addEventListener('click',async()=>{
   for(const child of list.children)child.disabled=true;
   try{
    command.convertedChakra=Number(list.querySelector('[name="convertedChakra"]')?.value??0);
    if(command.evade&&!await foundry.applications.api.DialogV2.confirm({
     window:{title:'Evadir'},content:'<p>Confirme que tem uma ação de movimento disponível e ainda não se deslocou nesta rodada.</p>'
    }))return;
    if(command.kind==='rebater'&&!await foundry.applications.api.DialogV2.confirm({
     window:{title:'Rebater Projétil'},content:`<p>Confirme Saque Rápido em mãos e ação disponível. Serão gastos os projéteis indicados em ${esc(label)}.</p>`
    }))return;
    if(command.counters){
     const {counters,...defense}=command;
     const selected=await chooseTechniqueCounter(counters);
     if(!selected)return;
     await requestAction({op:'defense',executionId:message.id,targetUuid:s.targetUuid,strike:s.strike,...defense,...selected});
     list.textContent='Defesa enviada.';
     return;
    }
    if(command.earth){
     const chakra=target.system.resources.chakra.value,item=target.items.get(command.techniqueId);
     const max=Math.min(chakra+command.convertedChakra,Math.max(Number(item.system.level),...mindCommonItems(target)
      .filter(i=>i.type==='power'&&i.system.powerData?.family==='doton').map(i=>Number(i.system.level))));
     const values=await foundry.applications.api.DialogV2.prompt({
      window:{title:'Barreira · Domínio da Terra'},
      content:`<label>Nível usado <input name="level" type="number" min="3" max="${max}" value="3" required></label><label>Chakra extra para dureza <input name="extra" type="number" min="0" max="${Math.min(max,chakra+command.convertedChakra-3)}" value="0" required></label>`,
      ok:{label:'Declarar Barreira',callback:(_event,button)=>({barrierLevel:button.form.elements.level.valueAsNumber,barrierExtra:button.form.elements.extra.valueAsNumber})}
     });
     if(!values)return;
     Object.assign(command,values);
    }
    if(command.kaiten){
     const item=target.items.get(command.techniqueId);
     const max=Math.min(Number(item.system.level),target.system.resources.chakra.value+command.convertedChakra);
     const selected=await foundry.applications.api.DialogV2.prompt({
      window:{title:'Kaiten defensivo'},
      content:`<label>Nível usado <input name="level" type="number" min="3" max="${max}" value="3"></label><label>Há criaturas atingidas pelo giro <input name="area" type="checkbox"></label>`,
      ok:{label:'Declarar Kaiten',callback:(_event,button)=>({kaitenLevel:Number(button.form.elements.level.value),kaitenArea:button.form.elements.area.checked})}
     });
     if(!selected)return;
     Object.assign(command,selected);
    }
    const request=await requestAction({op:'defense',executionId:message.id,targetUuid:s.targetUuid,strike:s.strike,...command});
    if(request)list.textContent='Defesa enviada.';
   }catch(error){report(error);}finally{for(const child of list.children)child.disabled=false;}
  });
 }
}

export async function bindActionExecution(message,root,report){
 if(message.getFlag(ID,'actionRequestFailed')){
  for(const button of root.querySelectorAll('[data-sns-retry-request]')){
   if(!game.user.isGM&&author(message)?.id!==game.user.id){button.hidden=true;continue;}
   button.addEventListener('click',async()=>{button.disabled=true;try{await requestAction({op:'retry-request',requestId:message.id});}catch(error){report(error);}finally{button.disabled=false;}});
  }
  return;
 }
 if(message.getFlag(ID,'mindEvasion')){const {bindMindEvasion}=await import('./yamanaka-transfer.mjs');return bindMindEvasion(message,root,report);}
 const falange=message.getFlag(ID,'falange');
 if(falange)return bindFalange(message,root,report,falange);
 const invite=message.getFlag(ID,'defenseInvitation');
 if(invite)return bindDefenseInvitation(invite,root,report);
 const e=message.getFlag(ID,'actionExecution');if(!e)return;
 for(const b of root.querySelectorAll('[data-sns-open-defense-technique]')){
  const s=e.slots.find(s=>s.key===b.dataset.snsOpenDefenseTechnique),target=s&&await fromUuid(s.targetUuid);if(!canUse(target,game.user)){b.hidden=true;continue;}
  b.addEventListener('click',()=>{const item=target.items.get(s.defense.techniqueId);if(!item)return report(Error('Técnica não encontrada.'));if(item.type==='power'&&item.system.powerData?.family)game.shinobi.open('power-use',{actor:target,itemId:item.id,...(s.defense.barrier?{values:{'power.effect':'barreira','power.level':3,'power.tier':3}}:{})});else if(item.type==='aptitude')game.shinobi.open('aptitude-use',{actor:target,itemId:item.id});else item.sheet.render({force:true});});
 }

 for(const b of root.querySelectorAll('[data-sns-action-command]')){
  const s=b.dataset.target?e.slots.find(s=>s.key===slotKey(Number(b.dataset.strike),b.dataset.target)):null;
  const target=s&&b.dataset.attackerControl!=='true'?await fromUuid(s.targetUuid):await fromUuid(e.actorUuid);
  if(b.dataset.gmOnly==='true'&&!game.user.isGM||!(s&&b.dataset.attackerControl!=='true'?canRespondDefense(target,game.user):canUse(target,game.user)||e.control&&validMindExecution(target,e.control)&&canDirectMind(target,game.user))){b.disabled=true;b.hidden=true;continue;}
  if(b.dataset.perceptive==='true'&&!clanCapabilities(target,clanContext()).sharingan){b.hidden=true;continue;}
  b.addEventListener('click',async()=>{if(b.disabled)return;b.disabled=true;try{
   const cmd={op:b.dataset.snsActionCommand,executionId:message.id,...(s?{strike:s.strike,targetUuid:s.targetUuid}:{})};
   if(cmd.op==='efficient-damage')cmd.use=b.dataset.efficient==='true';
   if(cmd.op==='overcome-technique'&&!await foundry.applications.api.DialogV2.confirm({
    window:{title:'Superar Técnica'},content:'<p>Use uma ação de movimento para contra-atacar com −3 na precisão e o dano base excedente?</p>'
   }))return;
   if(cmd.op==='technique-started'&&!s.defense?.kaiten&&!s.defense?.barrier&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Início da técnica defensiva'},content:'<p>Você já iniciou a técnica pelos seus controles e pagou os custos aplicáveis? A confirmação não cobra novamente. Falhar ou cancelar depois não devolve automaticamente os custos.</p>'}))return;
   if(cmd.op==='cancel'&&(e.powerExecutionId||e.slots.some(s=>s.defense?.initiated))&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Cancelar preparação'},content:'<p>Os custos já pagos serão preservados. Cancelar a preparação?</p>'}))return;
   if(cmd.op==='follow-shadow'||cmd.op==='land-throw'){
    const multi=cmd.op==='follow-shadow'&&!!aptitudeOwned(mindCommonItems(target),'ataque-multiplo','',worldRules());
    const progressive=multi&&!!aptitudeOwned(mindCommonItems(target),'ataque-progressivo','',worldRules());
    const height=s.thrown.direction==='up';
    const confirmAcceleration=cmd.op==='follow-shadow'&&!hasShadowAcceleration(target);
    if(multi||height||confirmAcceleration){
     const values=await foundry.applications.api.DialogV2.prompt({
      window:{title:cmd.op==='follow-shadow'?'Seguir Sombra':'Registrar queda'},
      content:`${multi?'<label>Ataque <select name="maneuver"><option value="golpear">Golpear</option><option value="ataque-multiplo">Ataque Múltiplo · dois golpes</option>'+(progressive?'<option value="ataque-progressivo">Ataque Progressivo · dois golpes</option>':'')+'</select></label>':''}
       ${height?`<label>${cmd.op==='land-throw'?'Altura efetiva após Acrobacia (m)':'Altura da queda (m)'} <input name="height" type="number" min="0" value="${s.thrown.distance}"></label>`:''}
       ${confirmAcceleration?'<label><input name="accelerated" type="checkbox"> O atacante está Acelerado ou Superacelerado</label>':''}`,
      ok:{label:'Confirmar',callback:(_event,button)=>({
       maneuver:button.form.elements.maneuver?.value??'golpear',height:Number(button.form.elements.height?.value??0),
       accelerated:!!button.form.elements.accelerated?.checked
      })}
     });
     if(!values)return;
     Object.assign(cmd,values);
    }
   }
   if(cmd.op==='throw-target'){
    const plan=e.attacks[s.strike].throwTarget;
    const values=await foundry.applications.api.DialogV2.prompt({
     window:{title:'Registrar arremesso'},
     content:`<label>Direção <select name="direction"><option value="back">Para trás</option><option value="up">Para cima</option></select></label><label>Distância (m) <input name="distance" type="number" min="0.1" max="${plan.metres}" value="${plan.metres}"></label>${plan.collision?'<label><input type="checkbox" name="obstacle"> Colidiu com um obstáculo</label>':''}`,
     ok:{label:'Registrar',callback:(_event,button)=>{
      const fields=button.form.elements;
      return {direction:fields.direction.value,distance:Number(fields.distance.value),obstacle:!!fields.obstacle?.checked};
     }}
    });
    if(!values)return;
    Object.assign(cmd,values);
   }
   if(cmd.op==='replica-use'){
    cmd.stealth=b.dataset.stealth==='true';
    const target=await fromUuid(s.targetUuid),converted=await chooseCorpulenciaPayment(target,4);
    if(converted==null)return;
    cmd.convertedChakra=converted;
   }
   if(cmd.op==='grapple-escape')cmd.stat=b.dataset.stat;
   if(cmd.op==='grapple-difficulty'){
    cmd.stat=await foundry.applications.api.DialogV2.prompt({
     window:{title:'Dificuldade de Escapar'},
     content:'<label>Base <select name="stat"><option value="cc">4 + Combate Corporal</option><option value="for">7 + Força</option></select></label>',
     ok:{label:'Definir',callback:(_event,button)=>button.form.elements.stat.value}
    });
    if(!cmd.stat)return;
   }
   if(cmd.op==='catch-projectile'||cmd.op==='return-projectile'){
    const verb=cmd.op==='catch-projectile'?'Apanhar':'Devolver';
    if(!await foundry.applications.api.DialogV2.confirm({window:{title:verb+' projétil'},content:'<p>Confirme com a mesa que há mão livre e que o projétil pode ser manipulado.</p>'}))return;
   }
   if(cmd.op==='steal-disarmed'||cmd.op==='steal-after-disarm'){
    const fromBlock=cmd.op==='steal-disarmed',victim=await fromUuid(fromBlock?e.actorUuid:s.targetUuid);
    const choices=theftOptions(victim,s,fromBlock);
    if(!choices.length)throw Error('Nenhum item elegível para Roubar.');
    const choice=await foundry.applications.api.DialogV2.prompt({
     window:{title:'Roubar'},content:`<label>Item <select name="item">${choices.map(o=>`<option value="${esc(o.id)}">${esc(o.name)} · até ${o.max}</option>`).join('')}</select></label><label>Quantidade <input name="quantity" type="number" min="1" value="1" required></label><label><input type="checkbox" name="hands" required> Confirme mãos livres e acesso ao item</label>`,
     ok:{label:'Tomar item',callback:(_event,button)=>({itemId:button.form.elements.item.value,quantity:button.form.elements.quantity.valueAsNumber,hands:button.form.elements.hands.checked})}
    });
    if(!choice)return;
    Object.assign(cmd,choice);
   }
   if(cmd.op==='disarm-item'){
    const items=heldWeapons(target);
    if(!items.length)throw Error('Nenhuma arma equipada. Registre a queda do objeto no mapa.');
    cmd.itemId=items.length===1?items[0].id:await foundry.applications.api.DialogV2.prompt({
     window:{title:'Arma derrubada'},
     content:`<label>Arma <select name="weapon">${items.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select></label>`,
     ok:{label:'Registrar queda',callback:(_event,button)=>button.form.elements.weapon.value}
    });
    if(!cmd.itemId)return;
   }
   if(cmd.op==='defense'){
    cmd.kind=b.dataset.defense;
    if(b.dataset.perceptive==='true')cmd.perceptive=true;
    if(cmd.kind==='bloqueio'||cmd.kind==='technique'){
     const items=mindCommonItems(target).filter(i=>cmd.kind==='bloqueio'?i.type==='equipment'&&!i.system.destroyed&&WEAPONS.some(w=>w.key===i.system.catalogKey&&w.book===i.system.catalogBook):['power','technique','aptitude'].includes(i.type));
     if(cmd.kind==='bloqueio'&&e.attacks[s.strike].juuken)items.unshift({id:'unarmed',name:'Bloqueio desarmado'});
     if(!items.length)throw Error('Nenhuma origem disponível nesta ficha.');
     const value=await foundry.applications.api.DialogV2.prompt({window:{title:cmd.kind==='bloqueio'?'Como bloquear':'Técnica defensiva'},content:`<label>Escolha<select name="origin">${items.map(i=>`<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('')}</select></label>`,ok:{label:'Declarar',callback:(_event,button)=>button.form.elements.origin.value}});
     if(!value)return;cmd[cmd.kind==='bloqueio'?'weaponId':'techniqueId']=value;
     if(cmd.kind==='technique'&&target.items.get(value)?.system.powerData?.family==='juuken'){
      const max=Number(target.items.get(value).system.level);
      const options=await foundry.applications.api.DialogV2.prompt({
       window:{title:'Kaiten defensivo'},
       content:`<label>Nível usado <input name="level" type="number" min="3" max="${max}" value="3"></label><label>Há criaturas atingidas pelo giro <input name="area" type="checkbox"></label>`,
       ok:{label:'Declarar Kaiten',callback:(_event,button)=>({kaiten:true,kaitenLevel:Number(button.form.elements.level.value),kaitenArea:button.form.elements.area.checked})}
      });
      if(!options)return;
      Object.assign(cmd,options);
     }
    }
   }
   if(cmd.op==='defend'&&s.defense.kind==='manual'){const hit=await foundry.applications.api.DialogV2.confirm({window:{title:'Resultado conferido pelo mestre'},content:'<p>O ataque acertou segundo a regra aplicável? Sim = acertou; Não = defendeu. Fechar mantém pendente.</p>',rejectClose:true});cmd.manualHit=hit;}
   if(cmd.op==='interrupt'&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Encerrar execução'},content:'<p>Encerrar sem novas consequências? Gastos e efeitos já efetivados serão preservados.</p>'}))return;
   if(cmd.op==='defend'&&s.defense.kind==='technique'&&!s.defense.kaiten&&!s.defense.barrier&&s.defenseRoll)cmd.techniqueStopped=await foundry.applications.api.DialogV2.confirm({window:{title:'Conferir técnica defensiva'},content:'<p>Após executar a técnica com seus próprios custos e efeitos, ela impediu o dano? Confirmar = sim; Não = não. Fechar a janela mantém a execução pendente.</p>',rejectClose:true});
   await requestAction(cmd);
  }catch(error){report(error);}finally{b.disabled=false;}});
 }
}
// Guia Avançado, pp. 35–36. A aproximação abre a escolha sem interromper o deslocamento.
function falangeWeapon(actor){
 const stance=activeAptitudes(actor)['instancia-de-falange'],state=derivedSummary(actor).state;
 if(!stance||state.noActions||state.noAttack||state.noReactions||state.keys.includes('caido'))return null;
 const weapons=heldWeapons(actor).filter(i=>WEAPONS.some(w=>w.category==='long'&&w.key===i.system.catalogKey&&w.book===i.system.catalogBook));
 return (stance.weaponId?weapons.find(i=>i.id===stance.weaponId):weapons[0])??null;
}

async function endFalange(actor){
 await mutateRuntime(actor,state=>{delete state.active['instancia-de-falange'];});
}

async function claimOpportunity(actor,target,key){
 if(!game.combat?.started)return;
 const stamp=periodKey(actor,'round');
 await mutateRuntime(partnerOrigin(actor)??actor,state=>{
  const usage=state.opportunities?.stamp===stamp?state.opportunities:{stamp,targets:{}};
  if(Object.values(usage.targets).includes(key))return;
  const opportunist=aptitudeOwned([...actor.items],'oportunista','',worldRules());
  const limit=1+(opportunist?Math.ceil(Number(actor.system.attributes.agi??0)/2):0);
  if(Object.keys(usage.targets).length>=limit||usage.targets[target.id])
   throw Error('Limite de ataques oportunos da rodada atingido para este alvo ou personagem.');
  usage.targets[target.id]=key;state.opportunities=usage;
 });
}

export function enteredFalange(distances){
 return distances.some((distance,index)=>index>0&&distance!=null&&distance<=1&&distances[index-1]>1);
}

async function onFalangeMovement(token,movement){
 if(actionAuthority()?.id!==game.user.id||!token.actor)return;
 const moving=token.actor,origin=movement.origin,destination=movement.destination;
 if(!origin||!destination||['x','y','elevation'].every(key=>origin[key]===destination[key]))return;
 if(activeAptitudes(moving)['instancia-de-falange'])await endFalange(moving);
 if(!game.combat?.started||game.combat.scene?.id&&game.combat.scene.id!==token.parent?.id)return;
 const scene=token.parent,grid=scene?.grid?.measurePath?scene.grid:scene&&globalThis.canvas?.scene?.id===scene.id?globalThis.canvas.grid:null;
 if(!grid?.measurePath||token.hidden||!token.disposition)return;
 const path=[origin,...(movement.passed?.waypoints??[]),destination];
 for(const other of scene.tokens){
  if(!other.actor||other.id===token.id||other.hidden||!other.disposition||Math.sign(other.disposition)===Math.sign(token.disposition))continue;
  const defender=other.actor;
  if(!activeAptitudes(defender)['instancia-de-falange'])continue;
  const weapon=falangeWeapon(defender);
  if(!weapon){await endFalange(defender);continue;}
  const center=other.getCenterPoint();
  const distance=point=>point.elevation===other.elevation?grid.measurePath([center,point]).distance:Infinity;
  const position=point=>token.getCenterPoint({...point,width:token.width,height:token.height,shape:token.shape});
  const distances=[distance(position(path[0]))];
  for(let i=1;i<path.length;i++){
   const from=position(path[i-1]),to=position(path[i]);
   if(path[i].teleport||path[i].action==='teleport'){
    distances.push(null,distance(to));continue;
   }
   if(from.elevation===to.elevation&&grid.getDirectPath&&grid.getCenterPoint){
    for(const cell of grid.getDirectPath([from,to]))distances.push(distance({...grid.getCenterPoint(cell),elevation:to.elevation}));
   }
   distances.push(distance(to));
  }
  if(!enteredFalange(distances))continue;
  const key=[movement.id,movement.subpathId,other.id,token.id].join(':');
  if(messages().some(m=>m.getFlag(ID,'falange')?.key===key))continue;
  const flag={key,actorUuid:defender.uuid,targetUuid:moving.uuid,weaponId:weapon.id,round:game.combat.round,combatId:game.combat.id};
  const whisper=users().filter(user=>canUse(defender,user)||canUse(moving,user)).map(user=>user.id);
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:defender}),whisper,
   content:falangeCard(defender,moving),flags:{[ID]:{falange:flag}}});
 }
}

function falangeCard(actor,target){
 return `<p><strong>Instância de Falange</strong> · ${esc(target.name)} entrou no alcance de ${esc(actor.name)}.</p>
  ${control('Passo Seguro','falange-safe')}${control('Cambalhota','falange-tumble')}${control('Ataque oportuno','falange-attack')}`;
}

async function bindFalange(message,root,report,flag){
 const actor=await fromUuid(flag.actorUuid),target=await fromUuid(flag.targetUuid);
 for(const button of root.querySelectorAll('[data-sns-action-command]')){
  const action=button.dataset.snsActionCommand;
  if(flag.done||flag.tumbled&&action!=='falange-attack'||!canUse(action==='falange-attack'?actor:target,game.user)){button.hidden=true;continue;}
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    if(action==='falange-attack'&&!await foundry.applications.api.DialogV2.confirm({
     window:{title:'Instância de Falange'},content:'<p>O alvo concluiu a aproximação sem Passo Seguro ou Cambalhota bem-sucedida?</p>'
    }))return;
    await requestAction({op:'falange',action,messageId:message.id});
   }catch(error){report(error);}finally{button.disabled=false;}
  });
 }
}

async function resolveFalange(command,user){
 const message=game.messages.get(command.messageId),flag=copy(message?.getFlag(ID,'falange')),combat=game.combat;
 if(!flag||!author(message)?.isGM||flag.done||combat?.id!==flag.combatId||combat.round!==flag.round)throw Error('Oportunidade encerrada.');
 const actor=await fromUuid(flag.actorUuid),target=await fromUuid(flag.targetUuid),weapon=actor&&falangeWeapon(actor);
 if(!weapon||weapon.id!==flag.weaponId||!target)throw Error('A Instância de Falange foi encerrada.');
 if(command.action==='falange-attack'){
  if(!canUse(actor,user))throw Error('Somente quem controla a Falange pode atacar.');
  const options={mode:'melee',maneuver:'golpear',distance:1},prepared=prepareWeaponAction(actor,weapon.id,options);
  await claimOpportunity(actor,target,flag.key);
  let card=messages().find(m=>execution(m)?.blockResponseKey===flag.key);
  if(!card){
   const uuid=target.uuid,next={schemaVersion:1,blockResponseKey:flag.key,blockResponseKind:'falange',
    actorUuid:actor.uuid,actorName:actor.name,itemId:weapon.id,options,name:'Instância de Falange',maneuverName:'Ataque oportuno',
    state:'declared',started:false,privateDefenses:true,quickResolution:true,
    slots:[{key:slotKey(0,uuid),strike:0,targetUuid:uuid,name:target.name,distance:1}],attacks:copy(prepared.attacks),rolls:{},
    notes:prepared.plan.notes,action:'Livre',fingerprint:weaponFingerprint(actor,weapon.id,options)};
   card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(next),flags:{[ID]:{actionExecution:next}}});
  }
  await publishDefenseInvitations(card);
  flag.done='Ataque oportuno declarado. O movimento foi preservado.';
 }else{
  if(!canUse(target,user))throw Error('Somente quem controla o alvo pode registrar a aproximação.');
  if(command.action==='falange-safe'){
   if(flag.tumbled)throw Error('A Cambalhota já foi escolhida para esta aproximação.');
   flag.done='Passo Seguro · sem ataque oportuno.';
  }else if(command.action==='falange-tumble'&&!flag.tumbled){
   const check=statPrecision(target,'acrobacia',{kind:'skill',manualContext:true});
   if(!check.allowed)throw Error(check.reasons.join(' '));
   const roll=await grappleRoll(check.precision),difficulty=2+derivedSummary(actor).combat.cc;
   flag.tumbled=`Cambalhota ${roll.total} contra ${difficulty}.`;
   if(roll.natural>=15||roll.natural>3&&roll.total>=difficulty)flag.done=flag.tumbled+' Ataque oportuno evitado.';
  }else throw Error('Resposta inválida ou já registrada.');
 }
 const content=flag.done?`<p>${esc(flag.done)}</p>`:falangeCard(actor,target)+`<p>${esc(flag.tumbled)} Ataque oportuno disponível.</p>`;
 await message.update({content,[`flags.${ID}.falange`]:flag});
}

export function registerActionExecutions(){
 const reportFalange=error=>ui.notifications.error(error.message);
 Hooks.on('preMoveToken',token=>{
  if(!game.user.isGM&&token.actor?.system.powerState?.active?.some(p=>p.active!==false&&!p.ending&&p.mentalControl?.assumed&&p.mentalControl.mode!=='disorder')){
   ui.notifications.warn('O corpo original permanece imóvel durante a Troca de Mente.');return false;
  }
  if(!game.user.isGM&&mindBinding(token.actor)){ui.notifications.warn('Este corpo se move pelos controles do Yamanaka.');return false;}
  if(!game.user.isGM&&token.actor?.system.powerState?.active?.some(p=>p.active!==false&&p.shadowPullVictim)){
   ui.notifications.warn('Kagezukami impede o deslocamento próprio. Tente livrar-se da captura.');return false;
  }
 });
 Hooks.on('moveToken',async(token,movement)=>{
  const {origin,destination}=movement;
  try{
   if(actionAuthority()?.id===game.user.id&&token.actor&&origin&&destination&&
      (['x','y','elevation'].some(key=>origin[key]!==destination[key])||movement.passed?.distance>0))
    {await clearKaguraProgressive(token.actor);await mutateRuntime(token.actor,state=>{state.lastMovement={turn:periodKey(token.actor,'turn'),combatId:game.combat?.id??null};});}
   if(actionAuthority()?.id===game.user.id&&token.actor?.system.powerState?.active?.some(p=>p.shadowSource||p.shadowBinding||p.shadowGuidedLink)){
    const {onShadowMovement}=await import('./nara-movement.mjs'),{endPower}=await import('./power-actions.mjs');
    await onShadowMovement(token,movement,{endPower});
   }
   await onFalangeMovement(token,movement);
   if(actionAuthority()?.id===game.user.id&&token.actor){const {reconcileMindTransfer}=await import('./yamanaka-transfer.mjs');await reconcileMindTransfer(token.actor);}
  }catch(error){reportFalange(error);}
 });
 const checkStance=actor=>{
  if(actor?.items&&actionAuthority()?.id===game.user.id&&activeAptitudes(actor)['instancia-de-falange']&&!falangeWeapon(actor))
   return endFalange(actor).catch(reportFalange);
 };
 Hooks.on('updateActor',checkStance);
 for(const event of ['updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect'])
  Hooks.on(event,document=>checkStance(document.parent));

 Hooks.on('createChatMessage',message=>{if(message.getFlag(ID,'actionRequest'))enqueueActionRequest(message).catch(e=>{console.error(ID,e);ui.notifications.error(actionErrorMessage(e));});});
 const resume=()=>{if(actionAuthority()?.id===game.user.id)for(const message of messages())if(message.getFlag(ID,'actionRequest')&&!message.getFlag(ID,'actionRequestDone'))enqueueActionRequest(message).catch(e=>{console.error(ID,e);ui.notifications.error(actionErrorMessage(e));});};
 Hooks.once('ready',resume);Hooks.on('userConnected',resume);
}
