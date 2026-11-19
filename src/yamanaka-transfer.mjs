// Livro Básico 4.1.b pp. 196–200. Initial reactions are declared before
// rolling; the existing resistance service persists the chosen die result.
import {ID} from './config.mjs';
import {canControl,nativeAuthor} from './core/execution.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';
import {measureTokenDistance} from './core/token-distance.mjs';
import {tokenPosition} from './core/token-movement.mjs';
import {mindBinding,controlledBodies} from './yamanaka-state.mjs';
import {conditionRecords} from './automation.mjs';
import {periodKey} from './aptitude-runtime.mjs';
import {updatePower,rollPowerResistance,endPower} from './power-actions.mjs';
const messages=()=>game.messages.contents??[...game.messages];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roots=actor=>(actor?.system.powerState?.active??[]).filter(p=>p.active!==false&&!p.ending&&p.mentalControl);

export async function inviteMindEvasion(source,body,id){
 if(messages().some(m=>{const f=m.getFlag(ID,'mindEvasion');return f?.sourceUuid===source.uuid&&f.rootId===id&&f.bodyUuid===body.uuid;}))return;
 const root=roots(source).find(p=>p.id===id);if(!root)return;
 const users=game.users.contents??[...game.users];
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:body}),whisper:users.filter(u=>canControl(body,u)).map(u=>u.id),
  content:`<div class="sns-app"><h3>Reação à Troca de Mente</h3><p>${esc(body.name)} · dificuldade ${root.plan.difficulty-3}. Escolha antes de rolar.</p>`+
   [['agi','Agilidade'],['prontidao','Prontidão'],['none','Não reagir']].map(([stat,label])=>`<button type="button" class="sns-btn" data-sns-mind-evasion="${stat}">${label}</button>`).join('')+'</div>',
  flags:{[ID]:{mindEvasion:{sourceUuid:source.uuid,rootId:id,bodyUuid:body.uuid}}}});
}

export async function chooseMindEvasion(source,command,{user,requestId}){
 if(!game.user.isGM)throw Error('O mestre coordena a reação à Troca de Mente.');
 const record=source?.system.powerState?.executions?.[command.id],entry=record?.participants?.find(p=>p.bodyUuid===command.bodyUuid),
  body=worldActorDocuments().find(a=>a.uuid===command.bodyUuid);
 if(!entry||!entry.policy.evasion||!canControl(body,user))throw Error('Somente quem controla esta vítima pode escolher sua reação.');
 if(!['agi','prontidao','none'].includes(command.stat))throw Error('Escolha Agilidade ou Prontidão para reagir.');
 if(record.posted)return;
 if(!roots(source).some(p=>p.id===command.id))throw Error('Esta Troca de Mente já terminou.');
 if(entry.evasionStat&&entry.evasionStat!==command.stat)throw Error('A reação já foi declarada; retome a escolha original.');
 await updatePower(source,state=>{const participant=state.executions[command.id].participants.find(p=>p.bodyUuid===body.uuid);participant.evasionStat??=command.stat;});
 const {activateMentalControl}=await import('./yamanaka-control.mjs');
 await activateMentalControl(source,source.items.get(roots(source).find(p=>p.id===command.id).itemId),
  {executionId:command.id,options:{effect:record.plan.effect}},{user:game.user,requestId});
 for(const message of messages()){
  const flag=message.getFlag(ID,'mindEvasion');
  if(flag?.sourceUuid!==source.uuid||flag.rootId!==command.id||flag.bodyUuid!==body.uuid)continue;
  const result=source.system.powerState.executions[command.id].evasions?.[body.id];
  if(result)await message.update({content:`<p>${esc(body.name)} · reação ${esc({agi:'Agilidade',prontidao:'Prontidão',none:'dispensada'}[command.stat])}: ${result.success?'evitou a transferência':'transferência recebida'}.</p>`,[`flags.${ID}.mindEvasion.done`]:true});
 }
}

export async function bindMindEvasion(message,root,report){
 const flag=message.getFlag(ID,'mindEvasion');if(!flag)return;
 const body=worldActorDocuments().find(a=>a.uuid===flag.bodyUuid);
 const allowed=!flag.done&&nativeAuthor(message,game.users)?.isGM&&canControl(body,game.user);
 for(const button of root.querySelectorAll('[data-sns-mind-evasion]')){
  if(!allowed){button.hidden=true;continue;}
  button.addEventListener('click',async()=>{
   button.disabled=true;try{const {requestAction}=await import('./action-executions.mjs');
    await requestAction({op:'mind-evasion',actorUuid:flag.sourceUuid,id:flag.rootId,bodyUuid:flag.bodyUuid,stat:button.dataset.snsMindEvasion});
   }catch(error){report(error);}finally{button.disabled=false;}
  });
 }
}

export async function advanceMindVictim(body,key,phase){
 const binding=mindBinding(body);if(!binding||binding.root.mentalControl.pending||binding.root.mentalControl.mode==='disorder'||phase!=='start')return;
 const linkId=binding.link.id;
 await updatePower(body,state=>{
  const link=state.active.find(p=>p.id===linkId);if(!link)return;
  const control=link.mentalControlLink;control.processedStarts??=[];
  if(!control.processedStarts.includes(key)){control.controlledStarts++;control.processedStarts.push(key);control.processedStarts=control.processedStarts.slice(-10);}
 });
 await resolveInitialMindResistance(body,linkId);
}
async function resolveInitialMindResistance(body,linkId){
 const live=mindBinding(body);if(!live||live.link.id!==linkId)return;
 const state=live.link.mentalControlLink;
 if(state.initialResistanceResolved||state.controlledStarts<2||conditionRecords(body,{includeAutomatic:true}).some(c=>['inconsciente','morto'].includes(c.key)))return;
 const result=await rollPowerResistance(body,'int',live.root.plan.difficulty,live.root.plan,linkId+':initial-resistance');
 if(result.success){
  await endPower(body,linkId);
  if(!controlledBodies(live.source,live.root.id).length)await endPower(live.source,live.root.id);
 }else await updatePower(body,s=>{const link=s.active.find(p=>p.id===linkId);if(link)link.mentalControlLink.initialResistanceResolved=true;});
}

export async function advanceMindClock(body){
 const binding=mindBinding(body);if(!binding||binding.root.mentalControl.pending||binding.root.mentalControl.mode==='disorder')return;
 const combats=game.combats?.contents??(game.combat?[game.combat]:[]);
 if(combats.some(c=>c.started&&(c.combatants?.contents??c.turns??[]).some(t=>t.actor?.uuid===body.uuid)))return;
 if(Number(game.time?.worldTime??0)-Number(binding.link.mentalControlLink.clockAt??0)<6)return;
 await updatePower(body,state=>{const link=state.active.find(p=>p.id===binding.link.id);if(link)link.mentalControlLink.controlledStarts=Math.max(2,link.mentalControlLink.controlledStarts);});
 await resolveInitialMindResistance(body,binding.link.id);
}

export async function reconcileMindTransfer(actor,visited=new Set()){
 if(!game.user.isGM)return;
 if(visited.has(actor.uuid))return;visited.add(actor.uuid);
 const binding=mindBinding(actor);
 if(binding){await reconcileMindTransfer(binding.source,visited);await resolveInitialMindResistance(actor,binding.link.id);}
 const now=Number(game.time?.worldTime??0);
 for(const root of roots(actor).filter(p=>p.mentalControl.mode!=='disorder')){
  if(root.expiresAt!=null&&now>=root.expiresAt||root.mentalControl.assumed&&Number(actor.system.resources?.vitality?.value)<=0){await endPower(actor,root.id);continue;}
  const sourceToken=game.scenes?.contents?.flatMap(s=>[...s.tokens]).find(t=>t.uuid===root.sourceTokenUuid);
  for(const body of controlledBodies(actor,root.id)){
   const binding=mindBinding(body);if(!binding)continue;
   if(Number(body.system.resources?.vitality?.value)<=-21||conditionRecords(body,{includeAutomatic:true}).some(c=>c.key==='morto')){
    await actor.update({'system.resources.vitality.value':Math.min(-21,Number(actor.system.resources.vitality.value))});
    await endPower(actor,root.id);break;
   }
   const bodyToken=sourceToken?.parent?.tokens?.find(t=>t.uuid===binding.link.tokenUuid);
   if(sourceToken&&bodyToken){const position=t=>({...tokenPosition(t),width:t.width,height:t.height}),gap=measureTokenDistance(position(sourceToken),position(bodyToken),sourceToken.parent.grid);
    if(Number.isFinite(gap)&&gap>root.plan.mindControl.maximumDistance){await endPower(body,binding.link.id);
     if(!controlledBodies(actor,root.id).length)await endPower(actor,root.id);
    }
   }
  }
 }
 for(const effect of actor.system.powerState?.active??[])if(effect.mindSendFailure&&now>=effect.expiresAt)await endPower(actor,effect.id);
}
