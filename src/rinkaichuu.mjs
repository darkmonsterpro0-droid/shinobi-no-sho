import {ID} from './config.mjs';
import {skillBase} from './build-rules.mjs';
import {capabilityId} from './core/capabilities.mjs';
import {clanCapabilities} from './clan-capabilities.mjs';
import {mutateRuntime} from './aptitude-runtime.mjs';
import {statPrecision} from './automation.mjs';

// Livro Básico 4.1.b, pp. 146–147. The table confirms contact and treatment.
export async function transferRinkaichuu(actor,item,{amount,contact,targetUuid,requestId,books,rules,user}){
 if(item.system?.catalogKey!=='res-basico-rinkaichuu'||!capabilityId(requestId))throw Error('Origem de Rinkaichuu inválida.');
 if(!['touch','maintained'].includes(contact)||!Number.isInteger(amount)||amount<1||contact==='touch'&&amount!==1)throw Error('Um toque rápido transfere um grupo. Mais grupos exigem contato mantido.');
 const target=await fromUuid(targetUuid);
 const visible=game.scenes?.get?.(user.viewedScene)?.tokens?.some(t=>!t.hidden&&t.actor?.uuid===targetUuid);
 if(!target?.isOwner||target.uuid===actor.uuid||!user.isGM&&!visible&&!target.testUserPermission?.(user,'OBSERVER'))throw Error('Alvo indisponível.');
 if(target.type==='puppet'||!Number.isFinite(target.system.resources?.vitality?.value))throw Error('Escolha uma criatura com Vitalidade preenchida.');
 const resistance=statPrecision(target,'vig',{kind:'resistance',bodyResistance:true});
 if(!resistance.allowed)throw Error(resistance.reasons.join(' '));
 const existing=actor.getFlag(ID,'aptitudes')?.rinkaTransfers?.[requestId];
 if(existing&&(existing.targetUuid!==target.uuid||existing.amount!==amount))throw Error('O pedido já está vinculado a outro contato.');
 const transfer=await mutateRuntime(actor,state=>{
  state.rinkaTransfers??={};
  if(state.rinkaTransfers[requestId])return state.rinkaTransfers[requestId];
  const colony=clanCapabilities(actor,{books,rules}).insects.find(r=>r.itemId===item.id);
  if(!colony?.available||!colony.bindingValid||amount>colony.deployed)throw Error('Libere grupos suficientes de Rinkaichuu antes do contato.');
  state.insectDeployments[item.id][colony.resourceId]-=amount;
  state.insectLosses??={};
  const species=state.insectLosses[item.id]??={};
  (species[colony.resourceId]??=[]).push({amount,turns:1});
  const record={targetUuid:target.uuid,amount,difficulty:7+skillBase(actor.system,'lidar')};
  state.rinkaTransfers[requestId]=record;
  return record;
 });
 const result=await mutateRuntime(target,async state=>{
  state.rinkaInfections??=[];
  const previous=state.rinkaInfections.find(record=>record.id===requestId);
  if(previous)return previous;
  const check=statPrecision(target,'vig',{kind:'resistance',bodyResistance:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate();
  const natural=roll.total-check.precision;
  const failed=natural<=3||natural<15&&roll.total<transfer.difficulty;
  const record={
   id:requestId,sourceUuid:actor.uuid,amount:transfer.amount,
   failed,shock:failed?1:0,json:JSON.stringify(roll.toJSON())
  };
  state.rinkaInfections.push(record);
  return record;
 });
 if(!(game.messages.contents??[]).some(message=>message.getFlag(ID,'rinkaReceipt')===requestId)){
  await foundry.dice.Roll.fromJSON(result.json).toMessage({
   speaker:ChatMessage.getSpeaker({actor:target}),
   flavor:`Rinkaichuu · Vigor Dif ${transfer.difficulty}. ${result.failed?'Falha: Atordoado por um turno e Fatigado até tratamento.':'Sucesso na resistência às condições.'} Insetos transferidos: ${result.amount}.`,
   flags:{[ID]:{rinkaReceipt:requestId}}
  });
 }
 return result;
}

export async function treatRinkaichuu(actor,sourceUuid){
 return mutateRuntime(actor,state=>{
  const infections=state.rinkaInfections??[];
  if(!infections.some(record=>record.sourceUuid===sourceUuid&&!record.treated))throw Error('Nenhuma infecção ativa desta origem.');
  for(const record of infections)if(record.sourceUuid===sourceUuid)record.treated=true;
 });
}
