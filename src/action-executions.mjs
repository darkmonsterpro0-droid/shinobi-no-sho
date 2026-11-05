import {activeCoordinator,canControl,nativeAuthor,createRequestQueue,createExecutionStore,terminalExecution,decisionsComplete} from './core/execution.mjs';
// Native ChatMessage requests carry their authenticated author. Only the elected GM
// changes an execution; clients never send executable code or calculated outcomes.
import {ID} from './config.mjs';
import {prepareWeaponAction,weaponCosts,commitWeaponCosts,weaponFingerprint} from './weapon-actions.mjs';
import {statPrecision,derivedSummary} from './automation.mjs';
import {canBlockSize,sizeProfile,sizeAttackModifier} from './physical-rules.mjs';
import {WEAPONS} from './weapons.mjs';
import {resolveOpposed} from './build-rules.mjs';
import {postAttackRoll} from './combat-chat.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {resolveWeaponAttack,prepareExtendedBlade} from './weapon-resolution.mjs';

const copy=v=>structuredClone(v),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const messages=()=>game.messages.contents??[...game.messages];
const users=()=>game.users.contents??[...game.users];
export const actionAuthority=()=>activeCoordinator(users());
const canUse=canControl;
const author=message=>nativeAuthor(message,game.users);
const executionStore=createExecutionStore({namespace:ID,render:executionCard});
const execution=executionStore.read;
export const enqueueActionRequest=createRequestQueue(request=>processActionRequest(request));
export async function requestAction(command){
 const gm=actionAuthority();if(!gm)throw Error('Um mestre precisa estar conectado para coordenar esta ação. Nenhum recurso foi gasto.');
 const message=await ChatMessage.create({content:'<p>Pedido de ação enviado ao mestre.</p>',whisper:[...new Set([...users().filter(u=>u.isGM).map(u=>u.id),game.user.id])],flags:{[ID]:{actionRequest:copy(command)}}});
 // The GM's own requests need not wait for the create hook to complete.
 if(gm.id===game.user.id)await enqueueActionRequest(message);
 return message;
}
const persist=executionStore.write;
const slotKey=(strike,uuid)=>strike+':'+uuid;
function slot(e,strike,uuid){const s=e.slots.find(s=>s.key===slotKey(strike,uuid));if(!s)throw Error('Alvo ou golpe não pertence a esta execução.');return s;}
async function participant(e,user){const actor=await fromUuid(e.actorUuid);if(!canUse(actor,user))throw Error('Você não controla o atacante.');return actor;}
async function defending(s,user){const target=await fromUuid(s.targetUuid);if(!canUse(target,user))throw Error('Somente o controlador do defensor ou o mestre pode responder.');return target;}
function allDeclared(e){return decisionsComplete(e.slots,s=>s.defense&&(s.defense.kind!=='technique'||s.defense.initiated));}
const control=(label,op,extra='')=>`<button type="button" class="sns-btn" data-sns-action-command="${op}" ${extra}>${label}</button>`;
export function executionCard(e){
 const done=terminalExecution(e.state);
 return `<div class="sns-app sns-execution"><h3>${esc(e.name)}</h3><p>${esc(e.actorName)} · ${esc(e.maneuverName??'Ataque')} · ${esc(e.action??'Padrão')}</p><p role="status">${esc({declared:'Aguardando declarações de defesa',ready:'Defesas declaradas — pronto para rolar',initiating:'Início pendente — retome para conferir os recibos',active:'Em resolução',complete:'Concluído',cancelled:'Preparação cancelada; custos defensivos já efetivados são preservados',interrupted:'Encerrado pelo mestre; custos e efeitos já aplicados preservados'}[e.state]??e.state)}</p>${e.error?`<p>${esc(e.error)}</p>`:''}<p>Ataque e defesa são declarados antes dos dados. Ações padrão, movimento e parcial continuam com marcação manual.</p>${e.notes?.length?`<details><summary>Regras desta ação</summary><ul>${e.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></details>`:''}${e.slots.map(s=>{
 const result=s.result,roll=e.rolls?.[s.strike],attrs=`data-strike="${s.strike}" data-target="${esc(s.targetUuid)}"`,pending=!done&&!e.started&&e.state!=='initiating';
 return `<section class="sns-block"><h4>${esc(s.name)}${e.attacks.length>1?' · golpe '+(s.strike+1):''}</h4><p>${s.defense?'Defesa: '+esc({esquiva:'Esquiva',bloqueio:'Bloqueio',antecipar:'Antecipar',technique:'Defender com técnica',manual:'Conferência do mestre'}[s.defense.kind])+` · declarada por ${esc(s.defense.byName)}`:'Defesa ainda não declarada.'}</p>${pending?`<div class="sns-toolbar">${['esquiva','bloqueio','antecipar','technique'].map(k=>control({esquiva:'Esquiva',bloqueio:'Bloqueio',antecipar:'Antecipar',technique:'Defender com técnica'}[k],'defense',attrs+` data-defense="${k}"`)).join('')}${control('Registrar exceção (mestre)','defense',attrs+' data-defense="manual" data-gm-only="true"')}</div>`:''}${s.defense?.kind==='technique'&&!done?`<p>Técnica: ${esc(s.defense.techniqueName)}. Execute seus custos e efeitos pelos controles existentes; a confirmação abaixo não os executa novamente. Os custos de início são devidos mesmo se a execução falhar.</p>${!e.started&&!s.defense.initiated?control('Confirmar início e custos da técnica','technique-started',attrs):''}<button type="button" class="sns-btn" data-sns-open-defense-technique="${esc(s.key)}">Abrir técnica defensiva</button>`:''}${roll?`<p>Ataque: ${roll.total}${s.defenseRoll?' · Defesa rolada: '+s.defenseRoll.total:''}</p>`:''}${!done&&roll&&!result?(s.tiePending?control('Repetir confronto empatado','repeat',attrs):control('Resolver defesa','defend',attrs)):''}${result?`<p>${result.hit?'Acerto confirmado':'Ataque defendido ou fracassado'}${s.applied?' · resultado aplicado':''}</p>`:''}${result?.hit&&!s.applied&&!done?control('Conferir e aplicar consequência','apply',attrs):''}${result&&!result.hit?'':s.applied?`<p>Dano aplicado: ${s.applied.damage??0}</p>`:''}</section>`;
 }).join('')}<div class="sns-toolbar">${!done&&allDeclared(e)&&e.attacks.some((_,i)=>!e.rolls[i])?control(e.state==='initiating'?'Retomar início':'Rolar próximo ataque','attack'):''}${!done&&!e.started&&e.state!=='initiating'?control('Cancelar preparação','cancel'):''}${!done?control('Atualizar / retomar','refresh')+control('Encerrar execução (mestre)','interrupt','data-gm-only="true"'):''}</div><small>Cada aplicação é confirmada. Fechar a ficha não apaga a execução.</small></div>`;
}
export async function processActionRequest(request){
 if(actionAuthority()?.id!==game.user.id)return;
 const command=request.getFlag(ID,'actionRequest');if(!command||request.getFlag(ID,'actionRequestDone'))return;
 const user=author(request);if(!user)throw Error('Autor do pedido não encontrado.');
 try{
  if(command.op==='capability'){
   const actor=await fromUuid(command.actorUuid);if(!canUse(actor,user))throw Error('Você não controla este personagem.');
   const {processCapabilityCommand}=await import('./capability-actions.mjs');
   await processCapabilityCommand(actor,command,{user,requestId:request.id});
  }else if(command.op==='declare'){
   const existing=messages().find(m=>m.getFlag(ID,'actionExecution')?.requestId===request.id);
   if(!existing){
    const actor=await fromUuid(command.actorUuid);if(!canUse(actor,user))throw Error('Você não controla este personagem.');
    const p=prepareWeaponAction(actor,command.itemId,command.options),groups=command.targets;
    if(!Array.isArray(groups)||groups.length!==p.attacks.length||groups.some(g=>!Array.isArray(g)||!g.length||g.length>100))throw Error('Informe os alvos de cada golpe.');
    const wide=['ataque-giratorio','chute-giratorio'].includes(command.options.maneuver)||p.plan.sizeSweep;
    if(!wide&&groups.some(g=>g.length!==1))throw Error('Este golpe exige um alvo.');
    const slots=[];for(let i=0;i<groups.length;i++)for(const uuid of new Set(groups[i])){
     const target=await fromUuid(uuid);const scene=game.scenes?.get?.(user.viewedScene);const visibleToken=scene?.tokens?.some(t=>!t.hidden&&t.actor?.uuid===uuid);if(!target||(!user.isGM&&!visibleToken&&!target.testUserPermission?.(user,'OBSERVER')))throw Error('Alvo não encontrado ou sem visibilidade.');
     slots.push({key:slotKey(i,uuid),strike:i,targetUuid:uuid,name:target.name});
    }
    const {MANEUVERS}=await import('./maneuvers.mjs');
    const e={schemaVersion:1,requestId:request.id,actorUuid:actor.uuid,actorName:actor.name,itemId:command.itemId,options:copy(command.options),name:p.item.name,maneuverName:MANEUVERS[command.options.maneuver??'golpear'],state:'declared',started:false,slots,attacks:copy(p.attacks),rolls:{},notes:p.plan.notes,action:p.plan.action,fingerprint:weaponFingerprint(actor,command.itemId,command.options)};
    // A declaration is public by explicit use; no private defender statistics are stored here.
    await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:executionCard(e),flags:{[ID]:{actionExecution:e}}});
   }
  }else{
   const message=game.messages.get(command.executionId),e=message&&execution(message);if(!e||!message.author?.isGM&&!author(message)?.isGM)throw Error('Execução não encontrada ou sem autoridade do mestre.');
   if(terminalExecution(e.state)){if(command.op!=='refresh')throw Error('Esta execução já foi encerrada.');}
   else if(command.op==='cancel'){
    await participant(e,user);if(e.started||e.state==='initiating')throw Error('A ação já iniciou; os custos não podem ser cancelados automaticamente.');e.state='cancelled';await persist(message,e);
   }else if(command.op==='interrupt'){
    if(!user.isGM)throw Error('Somente o mestre pode encerrar uma execução iniciada.');e.state='interrupted';e.interruptedBy=user.id;await persist(message,e);
   }else if(command.op==='technique-started'){
    const s=slot(e,command.strike,command.targetUuid);await defending(s,user);if(e.started||s.defense?.kind!=='technique')throw Error('Não há início defensivo pendente.');s.defense.initiated=true;s.defense.initiatedBy=user.id;e.state=allDeclared(e)?'ready':'declared';await persist(message,e);
   }else if(command.op==='defense'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user);if(s.defense?.initiated&&!user.isGM)throw Error('A técnica já iniciou. O mestre precisa conferir uma troca de defesa, sem reembolso automático.');if(e.started||e.rolls[s.strike])throw Error('As defesas já estão fechadas para esta execução.');
    if(!['esquiva','bloqueio','antecipar','technique','manual'].includes(command.kind))throw Error('Defesa inválida.');
    if(command.kind==='manual'&&!user.isGM)throw Error('Somente o mestre registra uma exceção manual.');
    if(command.kind!=='manual'&&derivedSummary(target).state.noReactions)throw Error('A condição atual impede esta defesa.');
    const plan=e.attacks[s.strike];if(command.kind==='bloqueio'){
     if(plan.cannotBlock||['chute-inverso','soco-agarrado'].includes(e.options.maneuver)||!canBlockSize(sizeProfile((await fromUuid(e.actorUuid)).system).key,sizeProfile(target.system)))throw Error('Bloqueio não permitido neste ataque.');
     const weapon=target.items.get(command.weaponId);if(!weapon||weapon.type!=='equipment'||weapon.system.destroyed||!WEAPONS.some(w=>w.key===weapon.system.catalogKey&&w.book===weapon.system.catalogBook))throw Error('Escolha a arma usada no bloqueio e confira sua capacidade de bloquear.');
    }
    if(command.kind==='technique'&&s.strike>0)throw Error('Ataque Múltiplo permite técnica defensiva somente no primeiro golpe.');
    const technique=command.kind==='technique'?target.items.get(command.techniqueId):null;
    if(command.kind==='technique'&&(!technique||!['power','technique','aptitude'].includes(technique.type)))throw Error('Escolha a técnica defensiva da ficha.');
    s.defense={kind:command.kind,weaponId:command.weaponId??null,techniqueId:technique?.id??null,initiated:false,techniqueName:technique?.name??null,by:user.id,byName:user.name};e.state=allDeclared(e)?'ready':'declared';await persist(message,e);
   }else if(command.op==='attack'){
    const actor=await participant(e,user);if(!allDeclared(e))throw Error('Aguarde todas as declarações de defesa.');
    const i=e.attacks.findIndex((_,n)=>!e.rolls[n]);if(i<0)throw Error('Todos os ataques já foram rolados.');
    if(i>0&&e.slots.some(s=>s.strike===i-1&&(!s.result||s.result.hit&&!s.applied)))throw Error('Conclua as defesas e aplicações do golpe anterior antes de continuar.');
    if(!e.started){
     if(e.state!=='initiating'){
      if(weaponFingerprint(actor,e.itemId,e.options)!==e.fingerprint)throw Error('A ficha ou as regras mudaram. Cancele a preparação e declare novamente; nada foi gasto.');
      const prepared=prepareWeaponAction(actor,e.itemId,e.options);e.costs=weaponCosts(prepared,actor);e.coating=prepared.coating;e.state='initiating';await persist(message,e);
     }
     await commitWeaponCosts(actor,e.costs,message.id);e.started=true;e.state='active';await persist(message,e);
    }
    const plan=copy(e.attacks[i]);
    if(e.options.maneuver==='chute-duplo'&&i===1&&e.slots.some(s=>s.strike===0&&s.result?.hit))plan.precision+=1;
    // Persist evaluated dice before posting them; retries reuse the same dice.
    if(!e.attackDice)e.attackDice={};
    if(!e.attackDice[i]){
     if(!e.poisonCheck&&plan.attackFailure){const r=await new foundry.dice.Roll('1d8').evaluate();e.poisonCheck={total:r.total,success:r.total>Math.round(plan.attackFailure/100*8)};await persist(message,e);}
     if(e.poisonCheck?.success===false){e.state='complete';e.error='O ataque falhou pelo efeito do veneno; materiais já utilizados permanecem gastos.';await persist(message,e);}
     else{const roll=await new foundry.dice.Roll(`2d8 + (${plan.precision})`).evaluate();e.attackDice[i]=JSON.stringify(roll.toJSON());await persist(message,e);}
    }
    if(e.attackDice[i]){
     const prior=messages().find(m=>m.getFlag(ID,'weaponAttack')?.executionMessageId===message.id&&m.getFlag(ID,'weaponAttack')?.strikeIndex===i&&m.getFlag(ID,'weaponAttack')?.attempt===(e.retry??0));
     const roll=foundry.dice.Roll.fromJSON(e.attackDice[i]);
     const outcome=prior?{message:prior,...prior.getFlag(ID,'weaponAttack')}:await postAttackRoll(actor,plan,{name:e.name,weapon:prepareWeaponName(actor,e),index:i+1,coating:e.coating,roll,workflow:{executionMessageId:message.id,strikeIndex:i,attempt:e.retry??0}});
     const attack=outcome.message.getFlag(ID,'weaponAttack');e.rolls[i]={messageId:outcome.message.id,total:attack.total,natural:attack.natural,critical:attack.critical,degree:attack.degree,precision:plan.precision};
     for(const s of e.slots.filter(s=>s.strike===i))if(attack.natural<=3||attack.critical)s.result={hit:attack.critical};
     await damageFirearm(actor,e,i,attack.natural);
     await persist(message,e);await finish(message,e);
    }
   }else if(command.op==='defend'){
    const s=slot(e,command.strike,command.targetUuid),target=await defending(s,user),a=e.rolls[s.strike];if(!a)throw Error('O atacante precisa rolar primeiro.');if(s.result)throw Error('Defesa já resolvida.');
    if(e.attacks[s.strike].extendedBlade)await prepareExtendedBlade(game.messages.get(a.messageId),s.targetUuid);
    const source=await fromUuid(e.actorUuid),attack={...a,precision:a.precision,total:a.total+sizeAttackModifier(sizeProfile(source.system).key,sizeProfile(target.system),{defense:s.defense.kind})};
    if(s.defense.kind==='manual'){
     if(!user.isGM||typeof command.manualHit!=='boolean')throw Error('O mestre precisa conferir o resultado desta exceção.');s.result={hit:command.manualHit,manual:true,by:user.id};
    }else if(s.defense.kind==='esquiva'){
     const p=statPrecision(target,'esq',{kind:'defense',reaction:true,manualContext:true});if(!p.allowed)throw Error(p.reasons.join(' '));s.result={hit:attack.total>=9+p.precision};
    }else{
     if(s.techniqueReady){if(typeof command.techniqueStopped!=='boolean')throw Error('Confirme o resultado da técnica defensiva.');s.result={hit:!command.techniqueStopped,manualTechnique:true};await persist(message,e);await finish(message,e);await request.update({[`flags.${ID}.actionRequestDone`]:true});return;}
     if(!s.defenseRoll){const stat=s.defense.kind==='bloqueio'?'cc':'lm',p=statPrecision(target,stat,{kind:'defense',reaction:true,manualContext:true});if(!p.allowed)throw Error(p.reasons.join(' '));const blockBonus=s.strike===0&&s.defense.kind==='bloqueio'&&!e.attacks[s.strike].ranged&&aptitudeOwned([...target.items],'bloquear-arma')&&e.itemId!=='unarmed'?1:0;const precision=p.precision+blockBonus;const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();s.defenseRoll={json:JSON.stringify(roll.toJSON()),total:roll.total,natural:roll.total-precision,precision};await persist(message,e);}
     if(!s.defenseRoll.posted){
      const key=message.id+':'+s.key+':'+(e.retry??0);if(!messages().some(m=>m.getFlag(ID,'defenseExecutionKey')===key))await foundry.dice.Roll.fromJSON(s.defenseRoll.json).toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:'Defesa: '+esc(s.defense.kind),flags:{[ID]:{defenseExecutionKey:key}}});
      s.defenseRoll.posted=true;await persist(message,e);
     }
     const d=s.defenseRoll,result=resolveOpposed({...attack,natural:sourceClone(source)&&!e.attacks[s.strike].targetCapanga?Math.min(14,attack.natural):attack.natural},d);if(result==='repeat'){
      s.tiePending=true;await persist(message,e);throw Error('Empate: os testes deste alvo precisam ser repetidos. Use Repetir confronto; demais alvos são preservados.');
     }
     if(s.defense.kind==='technique'&&result==='second'){
      if(typeof command.techniqueStopped!=='boolean')throw Error('Técnica executada a tempo. Use seus controles para custos/efeitos e confirme se impediu o dano.');
      s.result={hit:!command.techniqueStopped,manualTechnique:true};
     }else s.result={hit:result==='first'};
    }
    await persist(message,e);await finish(message,e);
   }else if(command.op==='repeat'){
    const s=slot(e,command.strike,command.targetUuid);await defending(s,user);if(!s.tiePending)throw Error('Não há empate pendente.');
    const actor=await fromUuid(e.actorUuid),target=await fromUuid(s.targetUuid),a=e.rolls[s.strike],d=s.defenseRoll;
    const threshold=sourceClone(actor)&&!e.attacks[s.strike].targetCapanga?Infinity:e.attacks[s.strike].critical;
    if(!s.tieDice){
     const ar=await new foundry.dice.Roll(`2d8 + (${a.precision})`).evaluate(),natural=ar.total-a.precision;
     const dr=natural<=3||natural>=threshold?null:await new foundry.dice.Roll(`2d8 + (${d.precision})`).evaluate();
     s.tieDice={attack:{total:ar.total,natural,precision:a.precision,json:JSON.stringify(ar.toJSON())},defense:dr?{total:dr.total,natural:dr.total-d.precision,precision:d.precision,json:JSON.stringify(dr.toJSON())}:null};await persist(message,e);
    }
    const t=s.tieDice,result=t.attack.natural<=3?'second':t.attack.natural>=threshold?'first':resolveOpposed({...t.attack,natural:sourceClone(actor)&&!e.attacks[s.strike].targetCapanga?Math.min(14,t.attack.natural):t.attack.natural,total:t.attack.total+sizeAttackModifier(sizeProfile(actor.system).key,sizeProfile(target.system),{defense:s.defense.kind})},t.defense);
    for(const [kind,performer]of [['attack',actor],['defense',target]]){if(!t[kind])continue;const key=message.id+':'+s.key+':tie:'+(s.tieCount??0)+':'+kind;if(!messages().some(m=>m.getFlag(ID,'defenseExecutionKey')===key))await foundry.dice.Roll.fromJSON(t[kind].json).toMessage({speaker:ChatMessage.getSpeaker({actor:performer}),flavor:'Repetição de confronto empatado',flags:{[ID]:{defenseExecutionKey:key}}});}
    if(result==='repeat'){delete s.tieDice;s.tieCount=(s.tieCount??0)+1;await persist(message,e);throw Error('O empate persistiu; repita o confronto novamente.');}
    s.tiePending=false;s.repeatedAttack=t.attack;s.defenseRoll=t.defense?{...t.defense,posted:true}:s.defenseRoll;
    if(s.defense.kind==='technique'&&t.attack.natural>3&&result==='second'){s.techniqueReady=true;}else s.result={hit:result==='first'};
    await persist(message,e);await finish(message,e);
   }else if(command.op==='apply'){
    const s=slot(e,command.strike,command.targetUuid);await defending(s,user);if(!s.result?.hit)throw Error('Não há acerto confirmado para aplicar.');
    if(command.context&&(!Number.isFinite(command.context.distance)||command.context.distance<0||!Number.isFinite(command.context.areaFraction)||command.context.areaFraction<0||command.context.areaFraction>1))throw Error('Contexto de aplicação inválido.');
    if(!s.applied){
     if(e.slots.some(x=>x.strike===s.strike&&!x.result))throw Error('Resolva todas as defesas deste golpe antes de aplicar consequências.');
     let attack=game.messages.get(e.rolls[s.strike].messageId);
     if(s.repeatedAttack){const original=attack,actor=await fromUuid(e.actorUuid),flag=copy(original.getFlag(ID,'weaponAttack'));const {damageDegree}=await import('./weapons.mjs');flag.total=s.repeatedAttack.total;flag.natural=s.repeatedAttack.natural;flag.critical=flag.natural>=flag.plan.critical&&(!sourceClone(actor)||flag.plan.targetCapanga);flag.degree=flag.natural<=3?0:Math.max(1,damageDegree(flag.natural,sourceClone(actor)&&!flag.plan.targetCapanga?Infinity:flag.plan.critical)-Number(flag.plan.degreePenalty??0));attack={id:original.id,getFlag:(_ns,key)=>key==='weaponAttack'?flag:original.getFlag(_ns,key)};}
     s.applied=await resolveWeaponAttack(attack,s.targetUuid,{...command.context,defense:s.defense.kind==='technique'?'other':s.defense.kind,blockingWeapon:s.defense.weaponId,hit:true});await persist(message,e);await finish(message,e);}
   }else if(command.op==='refresh'){await participant(e,user);await finish(message,e);await persist(message,e);}
   else throw Error('Operação de ação desconhecida.');
  }
  await request.update({[`flags.${ID}.actionRequestDone`]:true,content:'<p>Pedido de ação processado.</p>'});
 }catch(error){
  await request.update({[`flags.${ID}.actionRequestDone`]:true,content:`<p>${esc(error.message)}</p>`});throw error;
 }
}
const sourceClone=actor=>!!actor.getFlag?.(ID,'clone');
function prepareWeaponName(actor,e){return e.itemId==='unarmed'?'unarmed':actor.items.get(e.itemId)?.system.catalogKey;}
async function damageFirearm(actor,e,i,natural){
 if(i!==0||natural>3)return;const item=actor.items.get(e.itemId);if(!item)return;
 const {WEAPONS}=await import('./weapons.mjs');if(WEAPONS.find(w=>w.key===item.system.catalogKey)?.category!=='firearm'||item.getFlag?.(ID,'actionMisfire')?.[e.requestId])return;
 await item.update({'system.damaged':true,'system.destroyed':!!item.system.damaged,[`flags.${ID}.actionMisfire.${e.requestId}`]:true});
}
async function finish(message,e){if(Object.keys(e.rolls).length===e.attacks.length&&e.slots.every(s=>s.result&&(!s.result.hit||s.applied))){e.state='complete';await persist(message,e);}}
export async function bindActionExecution(message,root,report){
 const e=message.getFlag(ID,'actionExecution');if(!e)return;
 for(const b of root.querySelectorAll('[data-sns-open-defense-technique]')){
  const s=e.slots.find(s=>s.key===b.dataset.snsOpenDefenseTechnique),target=s&&await fromUuid(s.targetUuid);if(!canUse(target,game.user)){b.hidden=true;continue;}
  b.addEventListener('click',()=>{const item=target.items.get(s.defense.techniqueId);if(!item)return report(Error('Técnica não encontrada.'));if(item.type==='power'&&item.system.powerData?.family)game.shinobi.open('power-use',{actor:target,itemId:item.id});else if(item.type==='aptitude')game.shinobi.open('aptitude-use',{actor:target,itemId:item.id});else item.sheet.render({force:true});});
 }

 for(const b of root.querySelectorAll('[data-sns-action-command]')){
  const s=b.dataset.target?e.slots.find(s=>s.key===slotKey(Number(b.dataset.strike),b.dataset.target)):null;
  const target=s?await fromUuid(s.targetUuid):await fromUuid(e.actorUuid);
  if(b.dataset.gmOnly==='true'&&!game.user.isGM||!canUse(target,game.user)){b.disabled=true;b.hidden=true;continue;}
  b.addEventListener('click',async()=>{if(b.disabled)return;b.disabled=true;try{
   const cmd={op:b.dataset.snsActionCommand,executionId:message.id,...(s?{strike:s.strike,targetUuid:s.targetUuid}:{})};
   if(cmd.op==='technique-started'&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Início da técnica defensiva'},content:'<p>Você já iniciou a técnica pelos seus controles e pagou os custos aplicáveis? A confirmação não cobra novamente. Falhar ou cancelar depois não devolve automaticamente os custos.</p>'}))return;
   if(cmd.op==='cancel'&&e.slots.some(s=>s.defense?.initiated)&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Cancelar preparação'},content:'<p>Uma técnica defensiva já foi iniciada. Cancelar esta preparação preserva seus custos. Continuar?</p>'}))return;
   if(cmd.op==='defense'){
    cmd.kind=b.dataset.defense;
    if(cmd.kind==='bloqueio'||cmd.kind==='technique'){
     const items=[...target.items].filter(i=>cmd.kind==='bloqueio'?i.type==='equipment'&&!i.system.destroyed&&WEAPONS.some(w=>w.key===i.system.catalogKey&&w.book===i.system.catalogBook):['power','technique','aptitude'].includes(i.type));if(!items.length)throw Error('Nenhuma origem disponível nesta ficha.');
     const value=await foundry.applications.api.DialogV2.prompt({window:{title:cmd.kind==='bloqueio'?'Arma para bloquear':'Técnica defensiva'},content:`<label>Escolha<select name="origin">${items.map(i=>`<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('')}</select></label>`,ok:{label:'Declarar',callback:(_event,button)=>button.form.elements.origin.value}});
     if(!value)return;cmd[cmd.kind==='bloqueio'?'weaponId':'techniqueId']=value;
    }
   }
   if(cmd.op==='defend'&&s.defense.kind==='manual'){const hit=await foundry.applications.api.DialogV2.confirm({window:{title:'Resultado conferido pelo mestre'},content:'<p>O ataque acertou segundo a regra aplicável? Sim = acertou; Não = defendeu. Fechar mantém pendente.</p>',rejectClose:true});cmd.manualHit=hit;}
   if(cmd.op==='interrupt'&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Encerrar execução'},content:'<p>Encerrar sem novas consequências? Gastos e efeitos já efetivados serão preservados.</p>'}))return;
   if(cmd.op==='defend'&&s.defense.kind==='technique'&&s.defenseRoll)cmd.techniqueStopped=await foundry.applications.api.DialogV2.confirm({window:{title:'Conferir técnica defensiva'},content:'<p>Após executar a técnica com seus próprios custos e efeitos, ela impediu o dano? Confirmar = sim; Não = não. Fechar a janela mantém a execução pendente.</p>',rejectClose:true});
   if(cmd.op==='apply'){
    const answer=await foundry.applications.api.DialogV2.prompt({window:{title:'Conferir consequência'},content:'<p>Confirme localização e distância. Dureza, camuflagem e absorção serão calculadas.</p><label>Posição conhecida <input name="located" type="checkbox" checked></label><label>Distância (m)<input name="distance" type="number" min="0" value="1"></label><label>Fração encoberta atingida (0–1)<input name="fraction" type="number" min="0" max="1" step="0.05" value="0"></label>',ok:{label:'Aplicar',callback:(_event,button)=>({located:button.form.elements.located.checked?'yes':'no',distance:Number(button.form.elements.distance.value),areaFraction:Number(button.form.elements.fraction.value)})}});
    if(!answer)return;cmd.context=answer;
   }
   await requestAction(cmd);
  }catch(error){report(error);}finally{b.disabled=false;}});
 }
}
export function registerActionExecutions(){
 Hooks.on('createChatMessage',message=>{if(message.getFlag(ID,'actionRequest'))enqueueActionRequest(message).catch(e=>ui.notifications.error(e.message));});
 const resume=()=>{if(actionAuthority()?.id===game.user.id)for(const message of messages())if(message.getFlag(ID,'actionRequest')&&!message.getFlag(ID,'actionRequestDone'))enqueueActionRequest(message).catch(e=>ui.notifications.error(e.message));};
 Hooks.once('ready',resume);Hooks.on('userConnected',resume);
}
