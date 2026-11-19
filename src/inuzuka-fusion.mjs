// Livro Básico 4.1.b pp. 166–167. Snapshots preserve visibility and Actor
// identity; no height-to-grid-footprint conversion is specified by the book.
import {ID} from './config.mjs';
import {bodyLink} from './body-state.mjs';
import {measureTokenDistance} from './core/token-distance.mjs';
const actors=()=>globalThis.game?.actors?.contents??[];
const flag=(actor,key)=>actor?.getFlag?.(ID,key)??actor?.flags?.[ID]?.[key];
export function fusionParticipants(source,effect,uuids=[]){
 const count=effect==='santorou'?2:1;
 if(!Array.isArray(uuids)||uuids.length!==count||new Set(uuids).size!==count)throw Error(`Marque ${count===1?'um companheiro':'um companheiro e outro companheiro ou Kage Bunshin'} para a união.`);
 const entries=uuids.map(uuid=>actors().find(a=>a.uuid===uuid));
 const companion=actor=>{const c=flag(actor,'companion');return c?.origin===source.uuid&&!c.retired&&!c.suspended;};
 const clone=actor=>{const c=flag(actor,'clone');return c?.origin===source.uuid&&c.type==='kage-bunshin'&&!c.dismissed&&Number(actor.system.resources?.vitality?.value??0)>0;};
 if(!entries.every(a=>a?.isOwner&&a.uuid!==source.uuid&&!bodyLink(a)&&(companion(a)||clone(a)))||!entries.some(companion))
  throw Error('A união exige participantes disponíveis vinculados ao Inuzuka e pelo menos um companheiro animal.');
 return entries;
}
export function prepareFusionScene(source,participants,{sceneId=globalThis.canvas?.scene?.id,sourceTokenId}={}){
 const scene=globalThis.game?.scenes?.get(sceneId);
 if(!scene?.grid?.isSquare)throw Error('A união automática precisa dos participantes na mesma cena com grade quadrada.');
 const tokens=[...scene.tokens],sources=tokens.filter(t=>t.actor?.uuid===source.uuid);
 const origin=sourceTokenId?sources.find(t=>t.id===sourceTokenId):sources.length===1?sources[0]:null;
 if(!origin?.isOwner)throw Error('Controle um único token do Inuzuka para representar o corpo unido.');
 return participants.map(actor=>{
  const placed=tokens.filter(t=>t.actor?.uuid===actor.uuid);
  if(placed.length!==1||!placed[0].isOwner)throw Error('Cada participante precisa ter um único token acessível nesta cena.');
  const token=placed[0],distance=measureTokenDistance(origin,token,scene.grid);
  if(token.elevation!==origin.elevation||distance==null||distance>1)throw Error('A união exige toque nos participantes, na mesma elevação.');
  return {sceneId:scene.id,sourceTokenId:origin.id,tokenId:token.id,actorUuid:actor.uuid,
   hidden:!!token.hidden,sourcePosition:{x:origin.x,y:origin.y}};
 });
}
export async function applyBodyFusion(source,active){
 if(!game.user.isGM)throw Error('Um mestre coordena a união dos tokens.');
 if(!source.isOwner||!active?.bodyFusion||!source.system.powerState?.active?.some(p=>p.id===active.id&&p.bodyFusion&&p.active!==false))throw Error('União não encontrada na ficha de origem.');
 for(const snapshot of active.plan?.fusionTokens??[]){
  const actor=actors().find(a=>a.uuid===snapshot.actorUuid),token=game.scenes.get(snapshot.sceneId)?.tokens.get(snapshot.tokenId);
  if(!actor?.isOwner||!token?.isOwner||token.actor?.uuid!==actor.uuid)throw Error('Preserve os participantes e tokens para concluir a união.');
  const current=bodyLink(actor);
  if(current&&current.executionId!==active.id)throw Error('Este participante já pertence a outra união.');
  if(!current)await actor.update({[`flags.${ID}.mergedBody`]:{sourceUuid:source.uuid,executionId:active.id,tokens:[snapshot]}});
  if(!token.hidden)await token.update({hidden:true});
 }
}
const restoring=new Map();
export async function restoreBodyParticipant(actor){
 if(!game.user.isGM||!actor.isOwner)return;
 const previous=restoring.get(actor.uuid)??Promise.resolve();
 const job=previous.catch(()=>{}).then(async()=>{
  const record=bodyLink(actor);if(!record)return;
  for(const snapshot of record.tokens??[]){
   const scene=game.scenes.get(snapshot.sceneId),token=scene?.tokens.get(snapshot.tokenId),source=scene?.tokens.get(snapshot.sourceTokenId);
   if(!token||token.actor?.uuid!==actor.uuid)continue;
   const point=source?.getCenterPoint?.();
   const position=point?{x:point.x-Number(token.width)*scene.grid.size/2,y:point.y-Number(token.height)*scene.grid.size/2}:{};
   await token.update({...position,hidden:snapshot.hidden});
  }
  await actor.update({[`flags.${ID}.mergedBody`]:null});
 });
 restoring.set(actor.uuid,job);try{return await job;}finally{if(restoring.get(actor.uuid)===job)restoring.delete(actor.uuid);}
}
export async function finishBodyFusion(source,active){
 if(!game.user.isGM)throw Error('Um mestre coordena a separação dos participantes.');
 for(const actor of actors().filter(a=>bodyLink(a)?.sourceUuid===source.uuid&&bodyLink(a).executionId===active.id))await restoreBodyParticipant(actor);
}
export async function reconcileBodyLinks(){
 if(!game.user.isGM)return;
 for(const actor of actors()){
  const link=bodyLink(actor);if(!link)continue;
  const source=actors().find(a=>a.uuid===link.sourceUuid);
  if(!source?.system.powerState?.active?.some(p=>p.id===link.executionId&&p.bodyFusion&&p.active!==false))await restoreBodyParticipant(actor);
 }
}
