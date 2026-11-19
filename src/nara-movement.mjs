import {tokenPosition as positionOf,validateTokenDestination} from './core/token-movement.mjs';
import {ID} from './config.mjs';
import {recordKey} from './core/record-key.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';
import {measureTokenDistance} from './core/token-distance.mjs';
import {mutateRuntime,runtimeState} from './aptitude-runtime.mjs';
import {canControl} from './core/execution.mjs';

// Foundry animates prepared x/y after the database move has completed.
// Compare persisted document data, never the still-animating presentation.
const queues=new Map(),powers=actor=>(actor?.system?.powerState?.active??[]).filter(p=>p.active!==false);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const documents=scene=>[...(scene?.tokens?.contents??scene?.tokens??[])];
const sourceToken=(scene,actor,root)=>{
 const tokens=documents(scene).filter(t=>t.actor?.uuid===actor.uuid);
 return root.sourceTokenUuid?tokens.find(t=>t.uuid===root.sourceTokenUuid):tokens.length===1?tokens[0]:null;
};
export function shadowPullTargets(actor,rootId){
 return worldActorDocuments().flatMap(target=>powers(target).filter(p=>p.shadowPullVictim&&p.sourceUuid===actor.uuid&&p.linkedTo===rootId)
  .map(binding=>({name:target.name,tokenUuid:binding.tokenUuid})));
}
export function shadowPullControls(actor,root,button,escape){
 if(!root.shadowSource||!root.plan?.shadow?.pull||root.sourceUuid!==actor.uuid)return '';
 return shadowPullTargets(actor,root.id).map(target=>button('Mover '+target.name,'power-shadow-pull',
  `data-id="${escape(root.id)}" data-token="${escape(target.tokenUuid)}"`)).join('');
}
export function validateShadowPull(scene,origin,victim,destination,range){
 return validateTokenDestination(scene,origin,victim,destination,range);
}
// Básico 4.1.b p. 173. Movement is coordinated by the GM, without granting
// ownership of the captured actor or spending an unpublished action/cost.
export async function pullShadowVictim(actor,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user))throw Error('Você não controla o conjurador das sombras.');
 const scene=game.scenes.get(command.sceneId);
 if(!scene||!user.isGM&&user.viewedScene!==scene.id)throw Error('Abra a cena desta captura.');
 const key=recordKey(requestId),prior=runtimeState(actor).shadowPulls?.[key];
 if(prior?.done)return;
 const root=powers(actor).find(p=>p.id===command.id&&p.shadowSource&&p.plan?.shadow?.pull&&p.sourceUuid===actor.uuid);
 const victim=documents(scene).find(t=>t.uuid===command.tokenUuid),origin=sourceToken(scene,actor,root??{});
 const binding=powers(victim?.actor).find(p=>p.shadowPullVictim&&p.sourceUuid===actor.uuid&&p.linkedTo===root?.id&&p.tokenUuid===victim.uuid);
 if(!root||!origin||!binding)throw Error('Esta vítima não está mais capturada por Kagezukami.');
 const {validatePowerPurchase}=await import('./power-rules.mjs'),{worldProfile,worldRules}=await import('./world-settings.mjs');
 const item=actor.items.get(root.itemId);
 if(!item||validatePowerPurchase(actor,item,{books:worldProfile().books,rules:worldRules()}).length||actor.getFlag?.(ID,'capabilities')?.suspensions?.[item.id])
  throw Error('A origem desta captura não está disponível.');
 const {derivedSummary}=await import('./automation.mjs');
 if(derivedSummary(actor).state.noActions)throw Error('A condição atual interrompe a concentração.');
 const current=positionOf(victim);
 const destination=prior?.destination??command.destination;
 const arrived=prior&&['x','y','elevation'].every(k=>current[k]===destination[k]);
 if(!arrived){
  if(prior&&['x','y','elevation'].some(k=>current[k]!==prior.start[k]))throw Error('A vítima mudou de posição. Escolha novamente o destino.');
  if(!prior&&['x','y','elevation'].some(k=>current[k]!==command.start?.[k]))throw Error('A vítima mudou de posição. Escolha novamente o destino.');
  validateShadowPull(scene,origin,victim,destination,root.plan.range);
  if(!prior)await mutateRuntime(actor,state=>{
   state.shadowPulls??={};state.shadowPulls[key]={start:current,destination:structuredClone(destination),tokenUuid:victim.uuid};
   for(const old of Object.keys(state.shadowPulls).slice(0,-80))delete state.shadowPulls[old];
  });
  await victim.move([structuredClone(destination)],{pan:false,showRuler:false});
 }
 const actual=documents(game.scenes.get(scene.id)).find(t=>t.uuid===victim.uuid);
 if(!actual||['x','y','elevation'].some(k=>positionOf(actual)[k]!==destination[k]))throw Error('O deslocamento foi interrompido. Confira a chegada da vítima.');
 await mutateRuntime(actor,state=>{state.shadowPulls[key].done=true;});
}
function distance(a,b,grid){
 if(!a||!b||a.elevation!==b.elevation)return null;
 const nearest=measureTokenDistance(a,b,grid);if(nearest!=null)return nearest;
 const value=grid?.measurePath?.([a.getCenterPoint(),b.getCenterPoint()])?.distance;
 return Number.isFinite(value)?value:null;
}
async function checkBindingRange(token,{endPower}){
 for(const binding of powers(token.actor).filter(p=>p.shadowBinding||p.shadowGuidedLink)){
  if(binding.tokenUuid&&binding.tokenUuid!==token.uuid)continue;
  const source=worldActorDocuments().find(a=>a.uuid===binding.sourceUuid),root=powers(source).find(p=>p.id===binding.linkedTo);
  if(!root){await endPower(token.actor,binding.id);continue;}
  const origin=sourceToken(token.parent,source,root),range=distance(origin,token,token.parent.grid);
  if(range!=null&&range>root.plan.range)await endPower(binding.shadowGuidedLink?source:token.actor,binding.shadowGuidedLink?root.id:binding.id);
 }
}
async function updateTask(actor,key,uuid,changes){
 await mutateRuntime(actor,state=>{const task=state.shadowMovements?.[key]?.tasks.find(t=>t.tokenUuid===uuid);if(task)Object.assign(task,changes);});
}
async function review(actor,key,task,reason){
 const id=actor.uuid+':'+key+':'+task.tokenUuid;
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag(ID,'shadowMovementReview')===id))
  await ChatMessage.create({whisper:(game.users.contents??[...game.users]).filter(u=>u.isGM).map(u=>u.id),
   content:'<p>Kage Mane · '+esc(task.name)+': ajuste a imitação de deslocamento no mapa. '+reason+'</p>',flags:{[ID]:{shadowMovementReview:id}}});
 await updateTask(actor,key,task.tokenUuid,{status:'review'});
}
async function moveShadows(token,movement,{endPower}){
 const {origin,destination}=movement;if(!origin||!destination||!token.actor)return;
 if(['x','y','elevation'].every(k=>origin[k]===destination[k]))return;
 const actor=token.actor,scene=token.parent;
 for(const root of powers(actor).filter(p=>p.shadowSource&&p.requiresImmobile))
  if(!root.sourceTokenUuid||root.sourceTokenUuid===token.uuid)await endPower(actor,root.id);
 await checkBindingRange(token,{endPower});
 for(const root of powers(actor).filter(p=>p.shadowGuided)){
  const ally=documents(scene).find(t=>t.uuid===root.shadowGuided.allyTokenUuid);
  const range=distance(token,ally,scene.grid);
  if(range!=null&&range>root.plan.range)await endPower(actor,root.id);
 }
 const roots=powers(actor).filter(p=>p.shadowSource&&p.plan?.shadow?.mane&&(!p.sourceTokenUuid||p.sourceTokenUuid===token.uuid));
 if(!roots.length)return;
 const key=recordKey(String(movement.id??[scene.id,token.id,origin.x,origin.y,destination.x,destination.y].join(':'))+':'+(movement.subpathId??''));
 const result=await mutateRuntime(actor,state=>{
  state.shadowMovements??={};if(state.shadowMovements[key])return {record:state.shadowMovements[key]};
  const tasks=[],seen=new Set(),path=[...(movement.passed?.waypoints??[]),destination].filter((point,index,points)=>{
   const previous=index?points[index-1]:origin;
   return ['x','y','elevation'].some(k=>(point[k]??origin[k])!==(previous[k]??origin[k]));
  });
  for(const target of worldActorDocuments())for(const binding of powers(target).filter(p=>p.shadowBinding&&roots.some(r=>r.id===p.linkedTo))){
   const tokens=documents(scene).filter(t=>t.actor?.uuid===target.uuid),victim=binding.tokenUuid?tokens.find(t=>t.uuid===binding.tokenUuid):tokens.length===1?tokens[0]:null;
   if(!victim){tasks.push({tokenUuid:binding.tokenUuid??target.uuid,name:target.name,status:'pending',missing:true,path:[]});continue;}
   if(seen.has(victim.uuid))continue;seen.add(victim.uuid);
   const start=positionOf(victim);
   tasks.push({tokenUuid:victim.uuid,name:victim.name,start,status:'pending',path:path.map(p=>({x:start.x+p.x-origin.x,y:start.y+p.y-origin.y,elevation:start.elevation})),
    needsReview:path.some(p=>p.teleport||p.action==='teleport'||p.elevation!=null&&p.elevation!==origin.elevation)||start.elevation!==origin.elevation||
     powers(target).some(p=>p.shadowBinding&&p.sourceUuid!==actor.uuid)});
  }
  const record={tasks,duration:Number.isFinite(movement.animation?.duration)?movement.animation.duration:null};state.shadowMovements[key]=record;
  for(const old of Object.keys(state.shadowMovements).slice(0,-80))delete state.shadowMovements[old];
  return {record};
 });
 // Move the leading victims first, then inspect actual occupied cells again.
 // A victim stopped by a wall must not be treated as having vacated its cell.
 const delta={x:destination.x-origin.x,y:destination.y-origin.y};
 const tasks=[...result.record.tasks].sort((a,b)=>a.missing||b.missing?0:(b.start.x-a.start.x)*delta.x+(b.start.y-a.start.y)*delta.y);
 for(const task of tasks){
  const status=runtimeState(actor).shadowMovements[key]?.tasks.find(t=>t.tokenUuid===task.tokenUuid)?.status;
  if(['done','review'].includes(status))continue;
  if(task.missing){await review(actor,key,task,'A vítima precisa de um token inequívoco na cena.');continue;}
  const victim=documents(scene).find(t=>t.uuid===task.tokenUuid),end=task.path.at(-1);
  if(!victim||!powers(victim.actor).some(p=>p.shadowBinding&&roots.some(r=>r.id===p.linkedTo))){await updateTask(actor,key,task.tokenUuid,{status:'done'});continue;}
  if(['x','y','elevation'].every(k=>positionOf(victim)[k]===end[k])){await updateTask(actor,key,task.tokenUuid,{status:'done'});await checkBindingRange(victim,{endPower});continue;}
  if(task.needsReview||positionOf(victim).x!==task.start.x||positionOf(victim).y!==task.start.y||!victim.object?.checkCollision){await review(actor,key,task,'Confira elevação, outros vínculos ou a posição da vítima.');continue;}
  const points=[task.start,...task.path];
  const wall=points.slice(1).some((p,i)=>victim.object.checkCollision(victim.getCenterPoint(p),{origin:victim.getCenterPoint(points[i]),type:'move',mode:'any'}));
  const bounds={x:end.x,y:end.y,...victim.getSize()};
  const occupied=documents(scene).some(t=>t.uuid!==token.uuid&&t.uuid!==victim.uuid&&t.actor&&t.elevation===victim.elevation&&
   t.x<bounds.x+bounds.width-1e-6&&t.x+t.getSize().width>bounds.x+1e-6&&t.y<bounds.y+bounds.height-1e-6&&t.y+t.getSize().height>bounds.y+1e-6);
  if(wall||occupied){await review(actor,key,task,'Uma parede ou uma célula ocupada impede a chegada.');await checkBindingRange(victim,{endPower});continue;}
  const completed=await victim.move(structuredClone(task.path),{pan:false,showRuler:false,...(result.record.duration!=null?{animation:{duration:result.record.duration}}:{})});
  const arrived=documents(game.scenes?.get?.(scene.id)??scene).find(t=>t.uuid===task.tokenUuid);
  await updateTask(actor,key,task.tokenUuid,{arrival:arrived?positionOf(arrived):null,completed});
  // The actual arrival is authoritative, including a native move reported as
  // interrupted after it has already reached the intended cell.
  if(!arrived||['x','y','elevation'].some(k=>positionOf(arrived)[k]!==end[k]))await review(actor,key,task,'O deslocamento foi interrompido; confira a chegada.');
  else await updateTask(actor,key,task.tokenUuid,{status:'done'});
  if(arrived)await checkBindingRange(arrived,{endPower});
 }
}
export function onShadowMovement(token,movement,services){
 if(!token.actor)return Promise.resolve();
 const key=token.actor.uuid,previous=queues.get(key)??Promise.resolve(),job=previous.catch(()=>{}).then(()=>moveShadows(token,movement,services));
 queues.set(key,job);return job.finally(()=>{if(queues.get(key)===job)queues.delete(key);});
}
