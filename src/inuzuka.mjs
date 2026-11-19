// Livro Básico 4.1.b, pp. 163–166, 269. Generated companions are separate Actors;
// projection updates only their sourced statistics, never a pre-existing animal.
import {ID,SKILLS,ICONS} from './config.mjs';
import {clanCapabilities} from './clan-capabilities.mjs';
import {skillBase} from './build-rules.mjs';
import {combatTotals} from './progression.mjs';
import {worldProfile,worldRules} from './world-settings.mjs';
import {mutateRuntime,periodKey} from './aptitude-runtime.mjs';
import {WEAPONS} from './weapons.mjs';
import {inventoryEntry} from './inventory-data.mjs';
import {derivedSummary} from './automation.mjs';
export const COMPANION_SKILLS=['acrobacia','atletismo','escapar','furtividade','procurar','prontidao','rastrear'];
export const COMPANION_APTITUDES=['acuidade','ataque-em-movimento','especialista','intuicao','reflexos','velocista','perito','pericia-inata','lutador','ponto-cego','ataque-atordoante','ataque-poderoso','derrubar-agressivo','de-pe','desarme-agressivo','rasteira','res-basico-hakken-no-jutsu'];
const meta=actor=>actor?.getFlag?.(ID,'companion');
const context=()=>({books:worldProfile()?.books??['basico'],rules:worldRules()});
export const companionDied=animal=>derivedSummary(animal).state.keys.includes('morto');
const worldTime=()=>Number(globalThis.game?.time?.worldTime??0);
export function companionTraining(source,slot){
 const record=(source.getFlag?.(ID,'aptitudes')??source.flags?.[ID]?.aptitudes)?.companionTraining?.[slot];
 if(!record)return null;
 return {...record,remainingDays:Math.max(0,(record.readyAt-worldTime())/86400)};
}
// Básico p. 164. Elapsed world time cannot prove uninterrupted dedication;
// completion also requires the GM's explicit confirmation of that fact.
export async function startCompanionTraining(source,item,{animalUuid,slot:chosenSlot,requestId,restart=false,user,books,rules}={}){
 if(!user?.isGM||!source.isOwner)throw Error('O mestre registra o treinamento integral do novo companheiro.');
 if(!requestId||clanCapabilities(source,{books,rules}).companion?.itemId!==item.id)throw Error('Companheiro Animal precisa estar disponível.');
 return mutateRuntime(source,state=>{
  const animal=(globalThis.game?.actors?.contents??[]).find(a=>a.uuid===animalUuid&&meta(a)?.origin===source.uuid);
  const slot=chosenSlot==null?meta(animal)?.slot:Number(chosenSlot),vacancy=state.companionVacancies?.[slot];
  if(!animal?.isOwner||!companionDied(animal)||meta(animal).retired&&vacancy?.deceasedUuid!==animal.uuid||
   slot!==meta(animal).slot&&vacancy?.deceasedUuid!==animal.uuid||vacancy?.status==='promoting')
   throw Error('A reposição exige um companheiro vinculado que tenha morrido.');
  const old=state.companionTraining?.[slot];
  if(old?.id===requestId||old?.status==='training'&&!restart)return {training:old,duplicate:true};
  const lidar=skillBase(source.system,'lidar'),startedAt=worldTime();
  if(!Number.isFinite(lidar)||lidar<1||!Number.isFinite(startedAt))throw Error('Confira Lidar com Animais e o relógio do mundo.');
  if(old){state.companionTrainingHistory??=[];state.companionTrainingHistory.push({...old,status:old.status==='training'?'interrupted':old.status});}
  const training={id:requestId,sourceItemId:item.id,deceasedUuid:animal.uuid,slot,lidar,
   days:6*lidar,startedAt,readyAt:startedAt+6*lidar*86400,status:'training'};
  state.companionTraining??={};state.companionTraining[slot]=training;
  return {training};
 });
}
export async function promoteInuzukaCompanion(source,item,{animalUuid,requestId,user,books,rules}={}){
 if(!source.isOwner||!user?.isGM)throw Error('O mestre confirma a escolha do novo companheiro principal.');
 if(!requestId||clanCapabilities(source,{books,rules}).companion?.itemId!==item.id)throw Error('Companheiro Animal precisa estar disponível.');
 // Persist the vacancy before changing either Actor. An interrupted second step
 // resumes this same choice, rather than awarding a second primary companion.
 const claim=await mutateRuntime(source,state=>{
  const resumed=Object.values(state.companionVacancies??{}).find(v=>v.requestId===requestId||v.promotedUuid===animalUuid&&v.status==='promoting');
  if(resumed)return {slot:resumed.slot};
  if(Object.values(state.companionVacancies??{}).some(v=>v.status==='promoting'))throw Error('Conclua a promoção pendente antes de escolher outro animal.');
  const animals=inuzukaCompanions(source),animal=animals.find(a=>a.uuid===animalUuid),primary=animals.find(a=>meta(a).slot===0);
  if(!animal?.isOwner||meta(animal).slot<1||companionDied(animal)||meta(animal).transformation||!primary?.isOwner||!companionDied(primary))
   throw Error('Escolha um integrante vivo da matilha após a morte do companheiro principal, fora de Juujin.');
  const slot=meta(animal).slot;
  state.companionVacancies??={};state.companionVacancies[slot]={slot,requestId,promotedUuid:animal.uuid,deceasedUuid:primary.uuid,status:'promoting'};
  const training=state.companionTraining?.[0];
  if(training?.deceasedUuid===primary.uuid&&training.status==='training'){
   if(state.companionTraining[slot]){state.companionTrainingHistory??=[];state.companionTrainingHistory.push(state.companionTraining[slot]);}
   state.companionTraining[slot]={...training,slot};delete state.companionTraining[0];
  }
  return {slot};
 });
 return mutateRuntime(source,async state=>{
  const vacancy=state.companionVacancies?.[claim.slot],all=globalThis.game?.actors?.contents??[];
  const animal=all.find(a=>a.uuid===vacancy?.promotedUuid),primary=all.find(a=>a.uuid===vacancy?.deceasedUuid);
  if(!animal?.isOwner||!primary?.isOwner)throw Error('Preserve as fichas envolvidas para concluir a promoção.');
  if(vacancy.status!=='promoting')return {companion:animal,duplicate:true};
  if(!companionDied(primary)||companionDied(animal))throw Error('A situação dos animais mudou; confira a promoção com o mestre.');
  if(!meta(primary).retired)await primary.update({[`flags.${ID}.companion.retired`]:true},{snsCompanionSync:true});
  await animal.update({[`flags.${ID}.companion.slot`]:0,[`flags.${ID}.companion.capanga`]:false},{snsCompanionSync:true});
  vacancy.status='vacant';vacancy.promotedAt=worldTime();
  return {companion:animal};
 });
}
export const inuzukaCompanions=actor=>(globalThis.game?.actors?.contents??[]).filter(a=>meta(a)?.schemaVersion===1&&meta(a).origin===actor.uuid&&!meta(a).retired);
export function companionProjection(source,{transformed=false}={}){
 const s=source.system,penalty=transformed?0:2;
 const attributes=Object.fromEntries(Object.entries(s.attributes??{}).map(([key,value])=>[key,Math.max(0,Number(value??0)-penalty)]));
 const combat=Object.fromEntries(Object.entries(combatTotals(s.attributes,s.automation?.bases)).map(([key,value])=>[key,Math.max(0,value-penalty)]));
 const skills=Object.fromEntries(Object.keys(SKILLS).map(key=>[key,{points:COMPANION_SKILLS.includes(key)?Number(s.skills?.[key]?.points??0):0,
  value:COMPANION_SKILLS.includes(key)?Math.max(0,skillBase(s,key)-penalty):0}]));
 const lidar=skillBase(s,'lidar'),size=transformed?s.physical?.size??'medium':lidar>=14?'large':lidar>=10?'medium':'small';
 const vitality=10+3*Math.max(0,Number(s.attributes?.vig??0)-2)+5*Number(s.campaign?.level??4);
 const chakra=10+3*Math.max(0,Number(s.attributes?.esp??0)-2);
 return {attributes,combat,skills,size,speaks:lidar>=14,vitality,chakra};
}
function sourcedItems(source){return [...source.items].filter(i=>i.type==='aptitude'&&COMPANION_APTITUDES.includes(i.system.catalogKey)&&
 (!['perito','pericia-inata'].includes(i.system.catalogKey)||COMPANION_SKILLS.includes(i.system.selection))||
 i.type==='power'&&i.system.powerData?.family==='shikakyu').map(item=>{
  const data=item.toObject();delete data._id;delete data.id;data.effects=[];
  data.flags={[ID]:{companionGrant:{sourceItemId:item.id}}};
  data.system.acquisition='Concedida';return data;
 });}
export async function createInuzukaCompanion(source,item,{slot=0,name,requestId,books,rules,trainingId,uninterrupted=false,user}={}){
 const available=clanCapabilities(source,{books,rules}).companion;
 if(!source.isOwner||available?.itemId!==item.id)throw Error('Companheiro Animal precisa estar disponível na ficha de origem.');
 if(!Number.isInteger(slot)||slot<0||slot>=available.maximum)throw Error('Este integrante da matilha ainda não está disponível.');
 if(!requestId)throw Error('Solicitação de companheiro sem identificador.');
 return mutateRuntime(source,async state=>{
  let training,deceased;
  const complete=async companion=>{
   if(!meta(deceased).retired)await deceased.update({[`flags.${ID}.companion.retired`]:true},{snsCompanionSync:true});
   if(training.status!=='completed')Object.assign(training,{status:'completed',replacementUuid:companion.uuid,completedAt:worldTime(),confirmedBy:user.id});
   const vacancy=state.companionVacancies?.[slot];if(vacancy?.deceasedUuid===deceased.uuid)vacancy.status='filled';
   return {companion};
  };
  if(Object.values(state.companionVacancies??{}).some(v=>v.status==='promoting'))throw Error('Conclua a promoção pendente do companheiro antes de criar outro animal.');
  if(!trainingId&&state.companionVacancies?.[slot]?.status==='vacant')throw Error('Esta vaga da matilha exige concluir o treinamento de reposição.');
  if(trainingId){
   if(!user?.isGM||!uninterrupted)throw Error('O mestre precisa confirmar que o treinamento foi integral e ininterrupto.');
   training=state.companionTraining?.[slot];
   if(training?.id!==trainingId||training.sourceItemId!==item.id)throw Error('Treinamento de reposição não encontrado.');
   deceased=(globalThis.game?.actors?.contents??[]).find(a=>a.uuid===training.deceasedUuid);
   if(!deceased?.isOwner)throw Error('A ficha do companheiro anterior precisa ser preservada e estar acessível.');
   const created=inuzukaCompanions(source).find(a=>meta(a).replacementTraining===trainingId);
   if(created)return {...await complete(created),duplicate:true};
   if(training.status!=='training'||!Number.isFinite(worldTime())||worldTime()<training.readyAt)throw Error('O prazo de treinamento do novo companheiro ainda não terminou.');
   if(!companionDied(deceased))throw Error('O companheiro anterior não está morto; confira o treinamento antes de substituí-lo.');
  }
  const existing=inuzukaCompanions(source).find(a=>meta(a).slot===slot);
  if(existing&&existing.uuid!==deceased?.uuid){
   if(training)throw Error('Outro companheiro já ocupa essa posição; confira a reposição com o mestre.');
   return {companion:existing,duplicate:true};
  }
  const projection=companionProjection(source),raw=source.toObject(),system=structuredClone(raw.system);
  system.automation={...system.automation,enabled:false};system.campaign={...system.campaign,draft:false};
  system.attributes=projection.attributes;system.combat=projection.combat;system.skills=projection.skills;
  system.physical={...system.physical,size:projection.size,temporary:false};system.powerState={};system.inventoryState={};system.conditions=[];system.special=[];
  system.links={origin:source.uuid,controller:source.uuid,payer:source.uuid,kind:'Companheiro'};
  system.resources={vitality:{value:projection.vitality,max:projection.vitality},chakra:{value:projection.chakra,max:projection.chakra}};
  system.movement={...system.movement,distance:10+Math.ceil(projection.attributes.agi/2)};
  const companionName=String(name??'').trim().slice(0,100)||`${source.name} · ${slot?'Matilha '+slot:'Companheiro'}`;
  const [companion]=await CONFIG.Actor.documentClass.createDocuments([{name:companionName,
   type:'creature',img:ICONS.creature??ICONS.character,ownership:raw.ownership,
   prototypeToken:{...raw.prototypeToken,name:companionName,texture:{src:ICONS.creature??ICONS.character},actorLink:true,depth:1},system,items:sourcedItems(source),effects:[],
   flags:{[ID]:{companion:{schemaVersion:1,origin:source.uuid,sourceItemId:item.id,slot,requestId,capanga:slot>0,suspended:false,speaks:projection.speaks,
    ...(trainingId?{replacementTraining:trainingId,replaces:deceased.uuid}:{})}}}}],{snsSkipAllocation:true});
  if(!companion)throw Error('Não foi possível criar o companheiro.');
  return training?complete(companion):{companion};
 });
}
const queues=new Map();
export async function syncInuzukaCompanions(source){
 if(meta(source)||!source.isOwner)return;
 const previous=queues.get(source.uuid)??Promise.resolve();
 const work=previous.catch(()=>{}).then(async()=>{
  const available=clanCapabilities(source,context()).companion;
  for(const animal of inuzukaCompanions(source)){
   if(!animal.isOwner)continue;
   const record=meta(animal),s=animal.system,suspended=!available||available.itemId!==record.sourceItemId||record.slot>=available.maximum;
   const patch={};
   if(record.suspended!==suspended)patch[`flags.${ID}.companion.suspended`]=suspended;
   if(!suspended){
    const projection=companionProjection(source,{transformed:!!record.transformation}),values={
     'system.campaign.level':Number(source.system.campaign?.level??4),
     'system.automation.bases':source.system.automation?.bases??{cc:3,cd:3,esq:3,lm:3},
     'system.attributes':projection.attributes,'system.combat':projection.combat,'system.skills':projection.skills,
     'system.movement.distance':10+Math.ceil(projection.attributes.agi/2),
     'system.physical.size':projection.size,'system.resources.vitality.max':projection.vitality,
     'system.resources.chakra.max':projection.chakra,[`flags.${ID}.companion.speaks`]:projection.speaks
    };
    for(const [path,value]of Object.entries(values)){
     const old=path.split('.').reduce((obj,key)=>obj?.[key],animal._source??animal);
     if(JSON.stringify(old)!==JSON.stringify(value))patch[path]=value;
    }
    for(const key of ['vitality','chakra'])if(s.resources[key].value>projection[key])patch[`system.resources.${key}.value`]=projection[key];
    if(Object.keys(patch).length){await animal.update(patch,{snsCompanionSync:true});for(const key of Object.keys(patch))delete patch[key];}
    const expected=sourcedItems(source),existing=[...animal.items].filter(i=>i.getFlag?.(ID,'companionGrant'));
    for(const item of existing){
     const updated=expected.find(i=>i.flags[ID].companionGrant.sourceItemId===item.getFlag(ID,'companionGrant').sourceItemId);
     if(!updated)await item.delete({snsCompanionSync:true});
     else if(JSON.stringify(item.system)!==JSON.stringify(updated.system))await item.update({name:updated.name,system:updated.system},{snsCompanionSync:true});
    }
    const missing=expected.filter(i=>!existing.some(e=>e.getFlag(ID,'companionGrant').sourceItemId===i.flags[ID].companionGrant.sourceItemId));
    if(missing.length)await animal.createEmbeddedDocuments('Item',missing,{snsCompanionSync:true});
   }
   if(Object.keys(patch).length)await animal.update(patch,{snsCompanionSync:true});
  }
 });
 queues.set(source.uuid,work);
 try{return await work;}finally{if(queues.get(source.uuid)===work)queues.delete(source.uuid);}
}
export async function applyJuujinTransformation(source,animal,executionId){
 const record=meta(animal);
 if(!source.isOwner||!animal?.isOwner||record?.origin!==source.uuid)throw Error('Companheiro não disponível para Juujin Bunshin.');
 if(record.transformation&&record.transformation.executionId!==executionId)throw Error('O companheiro já possui outra transformação.');
 if(!record.transformation)await animal.update({[`flags.${ID}.companion.transformation`]:{executionId,scene:periodKey(source,'scene'),sourceUuid:source.uuid}},{snsCompanionSync:true});
 const replicas=[...source.items].filter(i=>i.type==='equipment').map(item=>{
  const data=item.toObject();delete data._id;delete data.id;data.effects=[];
  const weapon=WEAPONS.some(w=>w.key===item.system.catalogKey&&w.book===item.system.catalogBook),entry=inventoryEntry(item);
  const blocked=!weapon&&(!entry||/bomb|explosive|special-tag|jutsu-scroll/.test(entry.key));
  data.flags={[ID]:{juujinReplica:{executionId,sourceItemId:item.id,blocked}}};
  if(blocked)data.system.notes='Réplica de Juujin: não usa explosivos ou ativações dependentes de chakra.';
  return data;
 });
 const existing=[...animal.items].map(i=>i.getFlag?.(ID,'juujinReplica')).filter(Boolean);
 const missing=replicas.filter(i=>!existing.some(r=>r.executionId===executionId&&r.sourceItemId===i.flags[ID].juujinReplica.sourceItemId));
 if(missing.length)await animal.createEmbeddedDocuments('Item',missing,{snsCompanionSync:true});
 await syncInuzukaCompanions(source);
}
export async function finishJuujinTransformation(source,active){
 const animal=inuzukaCompanions(source).find(a=>a.uuid===active.targetUuid);
 if(!animal)return;
 if(meta(animal).transformation?.executionId===active.id)
  await animal.update({[`flags.${ID}.companion.transformation`]:null},{snsCompanionSync:true});
 for(const item of [...animal.items].filter(i=>i.getFlag?.(ID,'juujinReplica')?.executionId===active.id))await item.delete({snsCompanionSync:true});
 await syncInuzukaCompanions(source);
}
