import {clanCapabilities,changeDoujutsu,changeInsectDeployment,changeMangekyouVision,changeByakuganFocus,changeShokaSearch,recordKidaichuuPartnerLoss} from './clan-capabilities.mjs';
import {worldProfile,worldRules} from './world-settings.mjs';
import {mutateRuntime,periodKey} from './aptitude-runtime.mjs';
import {ID,ICONS} from './config.mjs';
import {joinedBody} from './body-state.mjs';
import {LINEAGES} from './build-rules.mjs';
import {restrictedDefinition,restrictedEligibility,characterOrigins} from './restricted-aptitudes.mjs';
import {createCapabilityLedger,capabilityLedger,capabilityId} from './core/capabilities.mjs';
export const CAPABILITY_ACTIONS=new Set(['capability-origins','capability-save-origins','capability-grant','capability-suspend','capability-resume','capability-link','capability-activate','capability-deactivate','capability-insects-deploy','capability-insects-return','capability-insects-loss','capability-insects-recover','capability-vision-pair','capability-vision-spend','capability-vision-rest','capability-mimic-copy','capability-mimic-memorize','capability-mimic-forget','capability-mimic-purchase','capability-hypnosis','capability-focus-extended','capability-focus-progressive','capability-focus-confirm','capability-focus-end','capability-shoka-start','capability-shoka-cancel','capability-shoka-collect','capability-rinka-transfer','capability-rinka-treat','capability-kida-loss','capability-kagura-active','capability-kagura-extended','capability-kagura-progressive',
 'capability-kagura-suppress','capability-kagura-end','capability-kagura-genjutsu','capability-companion-create']);
const normalize=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(const op of ['use','maintain','end','recover','pills','risk'])CAPABILITY_ACTIONS.add('capability-calorie-'+op);
for(const op of ['start','restart','finish'])CAPABILITY_ACTIONS.add('capability-companion-training-'+op);
CAPABILITY_ACTIONS.add('capability-companion-promote');
const contents=actor=>[...(actor.items??[])];
export const originChoices=()=>Object.fromEntries([...new Map([...LINEAGES,'Tessenjutsu'].map(n=>[normalize(n),n])).entries()]);
export const capabilityRecords=createCapabilityLedger({read:a=>a.getFlag?.(ID,'capabilities')??a.flags?.[ID]?.capabilities,write:(a,s)=>a.update({[`flags.${ID}.capabilities`]:s}),canEdit:a=>!!a?.isOwner,isGM:()=>!!game.user.isGM,items:contents,randomId:()=>foundry.utils.randomID()});
export function capabilityStatus(actor,item,{books,rules={}}={}){
 const definition=restrictedDefinition(item.system?.catalogKey,item.system?.catalogBook);if(!definition)return null;
 const ledger=capabilityLedger(actor.getFlag?.(ID,'capabilities')??actor.flags?.[ID]?.capabilities),ownId=item.id??item._id;
 const access=restrictedEligibility(definition,actor.system,contents(actor).filter(i=>(i.id??i._id)!==ownId),{books,rules,level:Number(item.system.level),accessOrigin:item.system.capabilityData?.accessOrigin});
 const suspension=ledger.suspensions?.[ownId];
 const clan=clanCapabilities(actor,{books,rules}),eye=clan.eyes.find(e=>e.key===definition.key);
 const activation=definition.key==='res-basico-hakken-no-jutsu'?{available:!!clan.hakken&&!suspension&&access.allowed!==false,active:!!clan.hakken?.active,mode:'continuous',cost:2,action:'Livre',reason:'Básico pp. 164–165; custo na ativação, duração contínua conforme pp. 86, 88–89.'}:eye?{available:!clan.invalid&&!suspension&&access.allowed!==false,active:eye.active,mode:'scene',cost:1,action:'Parcial; pode ser ativado durante a defesa',reason:'Livro Básico 4.1.b, pp. 157–158 / 181–182. Ações permanecem manuais.'}:{available:false,mode:'manual',reason:'Efeito contextual ou ainda manual.'};
 const links=(ledger.bindings?.[ownId]??item.system.capabilityData?.resourceLinks??[]).map(l=>({...structuredClone(l),exists:(actor.system.special??[]).some(r=>r.id===l.resourceId),manual:true}));
 return {definition,access,acquired:true,acquisition:item.system.acquisition,level:Number(item.system.level),suspended:!!suspension||ledger.schemaVersion!==1||access.allowed===false,suspensionReason:suspension?.reason??(ledger.schemaVersion!==1?'Versão de registro não suportada.':access.missing.join(' ')),activation,clan,grants:ledger.schemaVersion===1?capabilityRecords.grants(actor).filter(g=>g.record.sourceItemId===ownId):[],resourceLinks:links};
}
export async function processCapabilityCommand(actor,command,{user,requestId}){
 if(!actor?.isOwner||!user||(user.isGM!==true&&!actor.testUserPermission?.(user,'OWNER')))throw Error('Você não controla este personagem.');
 if(joinedBody(actor))throw Error('Este participante integra o corpo unido. Use a ficha do Inuzuka.');
 const profile=worldProfile()??{},rules={...worldRules(),senjutsu:profile.senjutsu},books=profile.books??[];
 const op=command.operation;
 if(['acquire','evolve'].includes(op)&&!capabilityId(requestId))throw Error('Identificador da solicitação inválido.');
 if(op==='acquire'){
  const entry=restrictedDefinition(command.key,command.book);if(!entry)throw Error('Aptidão restrita desconhecida.');
  const existing=contents(actor).find(i=>i.getFlag?.(ID,'capabilityPurchase')===requestId||i.flags?.[ID]?.capabilityPurchase===requestId);if(existing)return existing;
  const item={name:entry.name,type:'aptitude',img:ICONS.aptitude,flags:{[ID]:{capabilityPurchase:requestId}},system:{catalogKey:entry.key,catalogBook:entry.book,level:1,source:{book:entry.book,page:String(entry.page),version:entry.edition},acquisition:command.acquisition??'Comprada',selection:String(command.selection??'').slice(0,200),prerequisites:entry.requirements,availability:'Aquisição catalogada · efeitos manuais',capabilityData:{schemaVersion:1,definitionId:entry.id,accessOrigin:command.accessOrigin??restrictedEligibility(entry,actor.system,contents(actor),{rules,books}).accessOrigin,reviewReason:String(command.reviewReason??'').trim().slice(0,2000),resourceLinks:[]}}};
  const {validatePurchase}=await import('./item-validation.mjs');const errors=validatePurchase(actor,item,{rules,books,isGM:!!user.isGM});if(errors.length)throw Error(errors.join(' '));
  const [created]=await actor.createEmbeddedDocuments('Item',[item]);return created;
 }
 if(op==='rinka-treat'){
  if(!user.isGM)throw Error('O mestre confirma o tratamento da infecção.');
  const {treatRinkaichuu}=await import('./rinkaichuu.mjs');
  return treatRinkaichuu(actor,command.sourceUuid);
 }
 if(op==='evolve'){
  const item=actor.items.get(command.itemId);if(!item||!restrictedDefinition(item.system.catalogKey,item.system.catalogBook))throw Error('Aptidão restrita não encontrada.');
  const receipt=item.getFlag?.(ID,'restrictedEvolution')??item.flags?.[ID]?.restrictedEvolution;if(receipt?.requestId===requestId)return item;
  const next=Number(item.system.level)+1,entry=restrictedDefinition(item.system.catalogKey,item.system.catalogBook),s={...item.system,level:next};
  // Evolution requiring a new manual review must be performed by the GM. The item stays immutable.
  const status=restrictedEligibility(entry,actor.system,contents(actor).filter(i=>i.id!==item.id),{rules,books,level:next,accessOrigin:s.capabilityData?.accessOrigin});
  if(status.missing.length)throw Error(status.missing.join(' '));if(status.review.length&&!user.isGM)throw Error('A evolução exige conferência do mestre.');
  const {validatePurchase}=await import('./item-validation.mjs');const previous=item.toObject?.()??item,errors=validatePurchase(actor,{...previous,system:s},{previous,rules,books,isGM:!!user.isGM});if(errors.length)throw Error(errors.join(' '));
  await item.update({'system.level':next,[`flags.${ID}.restrictedEvolution`]:{requestId,level:next}});return item;
 }
 if(op==='origins'){
  if(!actor.system.campaign?.draft&&!user.isGM)throw Error('Após a criação, somente o mestre altera origens.');
  const old=actor.system.capabilityData??{};if(old.schemaVersion!=null&&old.schemaVersion!==1)throw Error('Versão das origens não suportada; dados preservados.');
  if(!Array.isArray(command.origins)||command.origins.length>12||command.origins.some(k=>!Object.hasOwn(originChoices(),k)))throw Error('Origem não reconhecida.');
  const origins=[...new Set(command.origins)],current=characterOrigins(actor.system).keys;
  // Changing the source of an acquired aptitude is consequential: show impact first in the UI, GM commits explicitly.
  if(!user.isGM&&contents(actor).some(i=>restrictedDefinition(i.system?.catalogKey)))throw Error('Há aptidões restritas adquiridas; o mestre precisa conferir o impacto da alteração.');
  const variants={};for(const [key,value]of Object.entries(command.variants??{}))if(key==='uzumaki'&&origins.includes('uzumaki')&&['option1','option2'].includes(value))variants[key]=value;
  await actor.update({'system.capabilityData':{...structuredClone(old),schemaVersion:1,origins,originVariants:{...old.originVariants,...variants}}});return {origins,previous:current};
 }
 const item=actor.items.get(command.itemId);if(!item)throw Error('Origem da capacidade não encontrada.');
 if(op==='companion-create'){
  const {createInuzukaCompanion}=await import('./inuzuka.mjs');
  return createInuzukaCompanion(actor,item,{slot:Number(command.slot??0),name:command.name,requestId,books,rules});
 }
 if(op==='companion-promote'){
  const {promoteInuzukaCompanion}=await import('./inuzuka.mjs');
  return promoteInuzukaCompanion(actor,item,{animalUuid:command.animalUuid,user,requestId,books,rules});
 }
 if(op.startsWith('companion-training-')){
  if(!user.isGM)throw Error('Somente o mestre registra e confirma o treinamento do companheiro.');
  const {startCompanionTraining,createInuzukaCompanion}=await import('./inuzuka.mjs');
  if(op==='companion-training-finish'){
   if(!command.trainingId)throw Error('Treinamento de reposição não encontrado.');
   return createInuzukaCompanion(actor,item,{slot:Number(command.slot),
   trainingId:command.trainingId,uninterrupted:command.uninterrupted===true,name:command.name,user,requestId,books,rules});
  }
  return startCompanionTraining(actor,item,{animalUuid:command.animalUuid,slot:command.slot,restart:op==='companion-training-restart',user,requestId,books,rules});
 }
 if(op.startsWith('calorie-')){
  const {useCalories,registerColoredPills}=await import('./akimichi.mjs');
  if(op==='calorie-pills')return registerColoredPills(actor,{books,rules,requestId});
  return useCalories(actor,command,{books,rules,requestId,user});
 }
 if(['insects-deploy','insects-return','insects-loss','insects-recover'].includes(op))return changeInsectDeployment(actor,item,{operation:op,amount:command.amount,requestId,books,rules});
 if(op==='kida-loss')return recordKidaichuuPartnerLoss(actor,item,{requestId,partnerId:command.partnerId});
 if(op==='rinka-transfer'){
  const {transferRinkaichuu}=await import('./rinkaichuu.mjs');
  return transferRinkaichuu(actor,item,{...command,requestId,books,rules,user});
 }
 if(op.startsWith('kagura-'))return useKagura(actor,item,command,{books,rules,user,requestId});
 if(op.startsWith('focus-'))return changeByakuganFocus(actor,item,{operation:op,requestId,books,rules});
 if(op.startsWith('shoka-'))return changeShokaSearch(actor,item,{operation:op,amount:command.amount,requestId,books,rules});
 if(op.startsWith('mimic-')||op==='hypnosis'){
  const {changeSharinganCopy,declareHypnosis}=await import('./sharingan-techniques.mjs');
  const context={...command,operation:op,requestId,books,rules,user};
  return op==='hypnosis'?declareHypnosis(actor,item,context):changeSharinganCopy(actor,item,context);
 }
 if(['vision-pair','vision-spend','vision-rest'].includes(op))return changeMangekyouVision(actor,item,{operation:op,pair:command.pair,amount:command.amount,technique:command.technique,requestId,books,rules});
 if(['activate','deactivate'].includes(op)){
  const {derivedSummary}=await import('./automation.mjs');
  return changeDoujutsu(actor,item,{operation:op,requestId,books,rules,convertedChakra:Number(command.convertedChakra??0),canUse:()=>actor.isOwner&&(user.isGM||actor.testUserPermission?.(user,'OWNER')),canActivate:()=>{const s=derivedSummary(actor).state;return !s.noActions||!s.noReactions;}});
 }
 if(['grant','suspend','resume'].includes(op)&&!user.isGM)throw Error('Somente o mestre registra concessões e suspensões.');
 if(op==='suspend')return capabilityRecords.suspend(actor,item.id,command.reason);
 if(op==='resume')return capabilityRecords.resume(actor,item.id);
 if(op==='grant'){
  const entry=restrictedDefinition(item.system.catalogKey,item.system.catalogBook),plan=entry?.grantPlans.find(p=>p.benefitKey===command.benefitKey&&p.selection===(command.selection??''));
  if(!plan)throw Error('Benefício não descrito no contrato de concessões desta origem.');
  return capabilityRecords.grant(actor,{sourceItemId:item.id,benefitKey:plan.benefitKey,selection:plan.selection,level:plan.level,reason:command.reason});
 }
 if(op==='link'){
  const entry=restrictedDefinition(item.system.catalogKey,item.system.catalogBook),reserve=(actor.system.special??[]).find(r=>r.id===command.resourceId);
  if(!entry?.resources.some(r=>r.key===command.resourceKey)||!reserve||!capabilityId(reserve.id))throw Error('Recurso ou contrato de vínculo inválido.');
  const ledger=capabilityLedger(actor.getFlag(ID,'capabilities'));
  if(entry.origin==='aburame'&&contents(actor).some(i=>i.id!==item.id&&restrictedDefinition(i.system?.catalogKey)?.origin==='aburame'&&(ledger.bindings?.[i.id]??i.system.capabilityData?.resourceLinks??[]).some(l=>l.key===command.resourceKey&&l.resourceId===reserve.id)))throw Error('Cada espécie Aburame precisa de uma reserva independente.');
  if(ledger.schemaVersion!==1)throw Error('Versão de capacidades não suportada.');
  if(entry.origin==='aburame'){
   const current=clanCapabilities(actor,{books,rules}).insects.find(r=>r.itemId===item.id);
   if((current?.deployed>0||current?.pendingLosses>0||current?.occupied>0||current?.partners.length)&&current.resourceId!==reserve.id)throw Error('Conclua as liberações ou reposições pendentes antes de trocar a reserva.');
  }
  ledger.bindings??={};const links=ledger.bindings[item.id]??[];ledger.bindings[item.id]=[...links.filter(l=>l.key!==command.resourceKey),{key:command.resourceKey,resourceId:reserve.id}];
  await actor.update({[`flags.${ID}.capabilities`]:ledger});return {manual:true};
 }
 throw Error('Operação de capacidade desconhecida.');
}

async function useKagura(actor,item,command,{books,rules,user,requestId}){
 const sensor=clanCapabilities(actor,{books,rules}).kagura;
 if(!sensor||![sensor.sourceId,sensor.advancedId].includes(item.id))throw Error('Kagura Shingan indisponível nesta ficha.');
 const mode=command.operation.slice(7),{statPrecision,derivedSummary}=await import('./automation.mjs');
 if(mode==='genjutsu'){
  const original=Number(command.difficulty),difficulty=original-2;
  if(command.difficulty==null||!Number.isInteger(original)||original<3)throw Error('Informe a dificuldade de resistência do Genjutsu.');
  const check=statPrecision(actor,'per',{kind:'attribute',reaction:true,manualContext:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  const prior=(game.messages.contents??[...game.messages]).find(m=>m.getFlag(ID,'kaguraGenjutsuRequest')===requestId);
  if(prior)return prior;
  const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision;
  return roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),whisper:[...new Set([user.id,...game.users.filter(u=>u.isGM).map(u=>u.id)])],
   flavor:`Kagura Shingan · Percepção contra ${difficulty}. ${natural>=15||natural>3&&roll.total>=difficulty?'Genjutsu identificado. Pode tentar Kai.':'Genjutsu não identificado.'}`,
   flags:{[ID]:{kaguraGenjutsuRequest:requestId,concealedRoll:true}}},{messageMode:'gm'});
 }
 if(!['active','extended','progressive','suppress','end'].includes(mode))throw Error('Modo de Kagura inválido.');
 if(mode==='extended'&&sensor.track<4)throw Error('Alcance estendido exige Rastrear 4.');
 if(['progressive','suppress'].includes(mode)&&!sensor.advancedId)throw Error('Esta opção exige Ryoushitsu Kagura Shingan.');
 if(mode!=='end'){
  const state=derivedSummary(actor).state;
  if(state.noActions||mode==='extended'&&state.keys.includes('amputado')&&
     !statPrecision(actor,'rastrear',{kind:'skill',manualContext:true,requiresSeals:true}).allowed)
   throw Error('A condição atual impede iniciar este modo.');
  if(mode!=='active'&&(actor.system.powerState?.active??[]).some(p=>p.active!==false&&p.duration==='concentration'))
   throw Error('Encerre a concentração atual antes de iniciar Kagura Shingan.');
 }
 const combat=game.combat,now=Number(game.time?.worldTime??0);
 return mutateRuntime(actor,state=>{
  if(state.kaguraRequest===requestId)return {duplicate:true};
  if(mode!=='end'&&sensor.mode===mode)throw Error('Este modo já está em andamento.');
  state.kaguraFocus=mode==='end'?null:{mode,sourceId:sensor.sourceId,scene:periodKey(actor,'scene'),
   turn:periodKey(actor,'turn'),startedAt:now,combatId:combat?.started?combat.id:null,round:combat?.round??0};
  state.kaguraRequest=requestId;
 });
}
