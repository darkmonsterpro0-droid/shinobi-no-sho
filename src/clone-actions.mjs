import {ID,SKILLS} from './config.mjs';
import {clonePlan,CLONE_PASSIVES,CLONE_TYPES,kageReturn} from './clone-rules.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {skillBase} from './build-rules.mjs';
import {derivedSummary,houseRules,conditionRecords,saveCondition,statPrecision} from './automation.mjs';
import {mutateRuntime,periodKey} from './aptitude-runtime.mjs';
import {readFields} from './interactions.mjs';
export const CLONE_ACTIONS=new Set(['create-clones','dismiss-clone']);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const linkedClones=actor=>(game.actors?.contents??[]).filter(c=>c.getFlag(ID,'clone')?.origin===actor.uuid&&!c.getFlag(ID,'clone')?.dismissed);
export function cloneView(actor,item,{esc,field,select,button},values={}){
 const level=Number(item.system.level??1),list=actor.clones??[],count=Number(values['clone.count']??1),limit=level>=2?6:2;
 return `<p>Cria réplicas vinculadas à ficha. Ação padrão · duração contínua. Limite conjunto entre todos os tipos; recriação bloqueada no turno em que uma cópia foi desfeita.</p><p>Até 2 clones ativos: −3 nos testes. Com 3 a 6 clones ativos: todos falham automaticamente nos testes de combate. Clone nível 1 permite no máximo 2 cópias.</p><div class="sns-form-grid">${field('Quantidade a criar','clone.count',count,'number',`min="1" max="${Math.max(0,limit-list.length)}" step="1"`)}</div>${button('Criar clones','create-clones',`data-id="${esc(item.id)}" ${list.length>=limit?'disabled':''}`,'primary')}<h4>Clones ativos (${list.length} / ${limit})</h4><p role="status">${list.length>2?'Todos os clones falham automaticamente nos testes de combate.':'Até duas cópias: −3 nos testes, com as exceções próprias de cada tipo.'}</p>${list.length?list.map(c=>`<p>${esc(c.name)} ${button('Desfazer','dismiss-clone',`data-uuid="${esc(c.uuid)}"`)}</p>`).join(''):'<p>Nenhum clone ativo.</p>'}`;
}
export async function cloneAction(app,op,data,root,{actor}){
 if(!actor?.isOwner)throw Error('Você não pode usar esta ficha.');
 if(op==='dismiss-clone'){
  const clone=data.uuid?await fromUuid(data.uuid):actor,meta=clone?.getFlag(ID,'clone');
  if(!meta||meta.origin!==actor.uuid&&clone.uuid!==actor.uuid)throw Error('Clone não vinculado a esta ficha.');
  if(!clone.isOwner)throw Error('Você não pode desfazer este clone.');
  await dismissClone(clone);return app.render({force:true});
 }
 if(actor.getFlag(ID,'clone'))throw Error('Um clone comum não pode criar clones.');
 if(!game.user.isGM&&!game.user.can?.('ACTOR_CREATE'))throw Error('O mestre precisa permitir criar Atores para gerar as fichas dos clones.');
 const item=actor.items.get(data.id);if(!item||!aptitudeOwned([...actor.items],'clone',item.system.selection,houseRules()))throw Error('Aptidão Clone não encontrada.');
 const fields=readFields(root,'clone.'),count=Number(fields['clone.count']??1);
 const summary=derivedSummary(actor),check=statPrecision(actor,'esp',{kind:'attribute',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));
 let created=[];
 await mutateRuntime(actor,async state=>{
  const existing=linkedClones(actor),plan=clonePlan({knownLevel:Number(item.system.level??1),count,type:item.system.selection,existing:existing.map(c=>c.getFlag(ID,'clone')),vitality:actor.system.resources.vitality.value,maximumVitality:summary.vitality,chakra:actor.system.resources.chakra.value,spirit:actor.system.attributes.esp,turn:periodKey(actor,'turn'),dismissedTurn:state.cloneDismissedTurn});
  const raw=actor.toObject(),system=structuredClone(raw.system);
  system.automation.enabled=false;system.campaign.draft=false;system.conditions=[];system.links={origin:actor.uuid,controller:actor.uuid,payer:actor.uuid,kind:'Clone'};
  system.resources={vitality:{value:plan.cloneVitality,max:plan.cloneVitality},chakra:{value:plan.cloneChakra,max:plan.cloneChakra}};
  system.combat={...summary.base?.combat??raw.system.combat};system.movement.distance=summary.normalMovement;
  for(const key of Object.keys(SKILLS))system.skills[key]={...system.skills[key],value:skillBase(actor.system,key)};
  system.structure.hardness=plan.hardness;
  const items=[...actor.items].filter(i=>i.type==='equipment'||i.type==='aptitude'&&CLONE_PASSIVES.includes(i.system.catalogKey)).map(i=>{const d=i.toObject();delete d._id;d.effects=[];d.flags={[ID]:{replicaOf:i.id}};if(i.type==='equipment'){d.system.hardness=0;d.system.absorption={value:plan.cloneVitality,max:plan.cloneVitality};d.system.notes='Réplica falsa: sem benefícios especiais, explosivos ou ativação de chakra.';}return d;});
  const batch=Array.from({length:count},(_,n)=>({name:`${actor.name} · ${CLONE_TYPES[plan.type]} ${existing.length+n+1}`,type:'creature',img:actor.img,ownership:raw.ownership,prototypeToken:{...raw.prototypeToken,actorLink:true},system:structuredClone(system),items:structuredClone(items),effects:[],flags:{[ID]:{clone:{...plan,origin:actor.uuid,sourceItems:[...actor.items].map(i=>i.toObject()),createdAt:game.time?.worldTime??0,dismissed:false}}}}));
  created=await CONFIG.Actor.documentClass.createDocuments(batch,{snsSkipAllocation:true});
  if(created.length!==count){for(const c of created)await c.delete({snsCloneRollback:true});throw Error('Não foi possível criar todas as cópias; nenhum custo foi cobrado.');}
  return {changes:{'system.resources.chakra.value':plan.sourceChakra,'system.resources.vitality.value':plan.sourceVitality}};
 }).catch(async error=>{for(const c of created)if(game.actors.get(c.id))await c.delete({snsCloneRollback:true});throw error;});
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>${esc(actor.name)} criou ${count} clone(s). ${linkedClones(actor).length<=2?'Até duas cópias ativas: −3 nos testes, além do limite comum de penalidades.':'Há mais de duas cópias ativas: todos os clones falham automaticamente nos testes de combate.'} Básico pp. 76–80.</p>`});
 return app.render({force:true});
}
// Receipt on the source prevents returning chakra twice after a retry/reconnect.
export async function dismissClone(clone,{deleted=false}={}){
 const meta=clone.getFlag(ID,'clone');if(!meta||meta.dismissed)return;
 const source=await fromUuid(meta.origin);if(!source?.isOwner)throw Error('A ficha de origem deve estar disponível e sob seu controle para desfazer o clone.');
 const fatigue=conditionRecords(clone,{includeAutomatic:true}),back=kageReturn(meta,{chakra:clone.system.resources.chakra.value,fatigue}),receipt=clone.uuid;
 await mutateRuntime(source,state=>{
  state.cloneReturns??={};if(state.cloneReturns[receipt])return;
  state.cloneReturns[receipt]={fatigue:back.fatigue};state.cloneDismissedTurn=periodKey(source,'turn');
  return {changes:back.chakra?{'system.resources.chakra.value':Math.min(derivedSummary(source).chakra,Number(source.system.resources.chakra.value)+back.chakra)}:{}};
 });
 const saved=source.getFlag(ID,'aptitudes')?.cloneReturns?.[receipt];
 for(const[index,c]of (saved?.fatigue??[]).entries()){
  const key=receipt+':'+index;if([...source.effects].some(e=>e.getFlag(ID,'condition')?.cloneReturn===key))continue;
  await saveCondition(source,{...c,id:undefined,cloneReturn:key});
 }
 if(!deleted){await clone.update({[`flags.${ID}.clone.dismissed`]:true});await clone.delete({snsCloneDismissed:true});}
}
