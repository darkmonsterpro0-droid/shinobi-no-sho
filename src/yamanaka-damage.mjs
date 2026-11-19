// Básico 4.1.b pp. 198–199. Capture the link with the damage write:
// ending the possession or retrying a later chat write cannot lose its debt.
import {ID} from './config.mjs';
import {mindBinding} from './yamanaka-state.mjs';
import {mutateRuntime,runtimeState} from './aptitude-runtime.mjs';
import {recordKey,readKeyedRecord} from './core/record-key.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';

export function recordMindDamage(state,body,sourceId,amount,{after}={}){
 const binding=mindBinding(body);
 if(!binding?.root.plan?.mindControl?.reflectedDamage||!(amount>0))return;
 state.mindDamageEvents??={};
 const key=recordKey(String(sourceId));
 state.mindDamageEvents[key]??={sourceId:String(sourceId),sourceUuid:binding.source.uuid,rootId:binding.root.id,damage:amount,fatal:after<=-21,complete:false};
}

export async function settleMindDamage(body,sourceId){
 const event=readKeyedRecord(runtimeState(body).mindDamageEvents,String(sourceId));
 if(!event||event.complete)return;
 if(!game.user.isGM){
  const {requestAction}=await import('./action-executions.mjs');
  await requestAction({op:'mind-reflection',actorUuid:body.uuid,sourceId:String(sourceId)});return;
 }
 const source=worldActorDocuments().find(a=>a.uuid===event.sourceUuid);
 if(!source)throw Error('O corpo original do Yamanaka não foi encontrado. O dano refletido continua pendente.');
 const {damageActor}=await import('./automation.mjs');
 await damageActor(source,event.damage,{sourceId:'mind:'+body.uuid+':'+sourceId,
  reason:'Dano mental refletido · '+body.name,reflection:true,fatal:event.fatal});
 if(Number(source.system.resources.vitality.value)<=0){const {endPower}=await import('./power-actions.mjs');
  for(const root of source.system.powerState?.active??[])if(root.mentalControl&&root.mentalControl.mode!=='disorder')await endPower(source,root.id);
 }
 await mutateRuntime(body,state=>{const saved=readKeyedRecord(state.mindDamageEvents,String(sourceId));if(saved)saved.complete=true;});
}

export async function settlePendingMindDamage(body){
 for(const event of Object.values(runtimeState(body).mindDamageEvents??{}))if(!event.complete){
  if(event.sourceId)await settleMindDamage(body,event.sourceId);
 }
}
