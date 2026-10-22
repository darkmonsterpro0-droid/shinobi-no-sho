import {ID} from './config.mjs';
import {rerollOption} from './reroll-options.mjs';
import {houseRules,conditionRecords} from './automation.mjs';
import {settleResistance} from './summary-actions.mjs';
import {claimUsage,mutateRuntime} from './aptitude-runtime.mjs';
const locks=new Set();
export function rollRecord(message){const f=message.getFlag(ID,'roll')??message.getFlag(ID,'record');return f??message.flags?.[ID];}
function normalized(message){const f=rollRecord(message)??{};return {...f,kind:message.getFlag('core','initiativeRoll')?'initiative':f.testKind??(f.kind==='skill-test'?'skill':f.kind)};}
async function settlePending(pending,success){
 const actor=await fromUuid(pending.actorUuid);if(!actor?.isOwner)throw Error('Você não pode resolver a resistência deste alvo.');
 const record=conditionRecords(actor,{includeAutomatic:true}).find(c=>c.id===pending.conditionId);if(!record)throw Error('A condição já foi encerrada.');
 await settleResistance(actor,record,success);
}
export async function rerollMessage(message,{accept=false}={}){
 if(!message.isOwner)throw Error('Somente o autor da rolagem ou o mestre pode resolver este teste.');
 const key=message.uuid??message.id;if(locks.has(key))throw Error('Este teste já está sendo resolvido.');locks.add(key);
 try{
  if(message.getFlag(ID,'rerollResolved'))throw Error('Esta rolagem já foi aceita ou repetida.');
  const f=normalized(message),actor=f.actorUuid?await fromUuid(f.actorUuid):game.actors.get(message.speaker.actor);if(!actor?.isOwner)throw Error('Você não pode usar este personagem.');
  if(accept){if(!f.pendingResistance)throw Error('Não há resistência pendente.');await settlePending(f.pendingResistance,f.success);await message.setFlag(ID,'rerollResolved',true);return;}
  const option=rerollOption([...actor.items],f,houseRules());if(!option)throw Error('Esta rolagem não permite repetição.');
  const combat=f.kind==='initiative'?game.combat:null,combatant=combat?.combatants?.find(c=>c.actor?.uuid===actor.uuid);
  if(f.kind==='initiative'&&!combatant)throw Error('Personagem não encontrado no combate ativo.');
  if(option.period)await mutateRuntime(actor,state=>claimUsage(state,actor,option.key,option.period,option.limit));
  if(f.kind==='initiative'){
   await combat.rollInitiative([combatant.id],{updateTurn:false,messageOptions:{flags:{[ID]:{rerollOf:message.uuid}}}});
  }else{
   const precision=Number(f.precision);if(!Number.isFinite(precision))throw Error('A precisão original não está disponível.');
   const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision,difficulty=f.difficulty,success=natural>=15||natural>3&&(difficulty==null||roll.total>=Number(difficulty));
   await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),whisper:message.whisper,blind:message.blind,flavor:`<strong>${option.label}</strong><p>A segunda rolagem é obrigatória, mesmo se pior.${difficulty!=null?' Dificuldade '+difficulty+': '+(success?'sucesso.':'falha.'):''}</p>`,flags:{[ID]:{...f,kind:'aptitude-reroll',testKind:f.kind,natural,success,rerollOf:message.uuid,pendingResistance:null}}});
   if(f.pendingResistance)await settlePending(f.pendingResistance,success);
  }
  await message.setFlag(ID,'rerollResolved',true);
 }finally{locks.delete(key);}
}
export async function bindRerolls(message,root,report){
 const f=normalized(message);if(message.getFlag(ID,'rerollResolved')||f.rerollOf||!message.isOwner)return;
 const actor=f.actorUuid?await fromUuid(f.actorUuid):game.actors.get(message.speaker.actor);if(!actor?.isOwner)return;
 const option=rerollOption([...actor.items],f,houseRules());if(!option&&!f.pendingResistance)return;
 if(root.querySelector('[data-sns-reroll]'))return;
 const wrap=document.createElement('div');wrap.className='sns-toolbar';
 const add=(label,accept)=>{const button=document.createElement('button');button.type='button';button.dataset.snsReroll='';button.textContent=label;button.addEventListener('click',async()=>{for(const b of wrap.querySelectorAll('button'))b.disabled=true;try{await rerollMessage(message,{accept});wrap.remove();}catch(e){report(e);for(const b of wrap.querySelectorAll('button'))b.disabled=false;}});wrap.append(button);};
 if(f.pendingResistance)add('Aceitar esta resistência',true);if(option)add(option.label,false);(root.querySelector('.message-content')??root).append(wrap);
}
