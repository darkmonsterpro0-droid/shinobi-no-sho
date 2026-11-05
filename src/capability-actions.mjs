import {ID,ICONS} from './config.mjs';
import {LINEAGES} from './build-rules.mjs';
import {restrictedDefinition,restrictedEligibility,characterOrigins} from './restricted-aptitudes.mjs';
import {createCapabilityLedger,capabilityLedger,capabilityId} from './core/capabilities.mjs';
export const CAPABILITY_ACTIONS=new Set(['capability-origins','capability-save-origins','capability-grant','capability-suspend','capability-resume','capability-link']);
const normalize=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const contents=actor=>[...(actor.items??[])];
export const originChoices=()=>Object.fromEntries([...new Map([...LINEAGES,'Tessenjutsu'].map(n=>[normalize(n),n])).entries()]);
export const capabilityRecords=createCapabilityLedger({read:a=>a.getFlag?.(ID,'capabilities')??a.flags?.[ID]?.capabilities,write:(a,s)=>a.update({[`flags.${ID}.capabilities`]:s}),canEdit:a=>!!a?.isOwner,isGM:()=>!!game.user.isGM,items:contents,randomId:()=>foundry.utils.randomID()});
export function capabilityStatus(actor,item,{books,rules={}}={}){
 const definition=restrictedDefinition(item.system?.catalogKey,item.system?.catalogBook);if(!definition)return null;
 const ledger=capabilityLedger(actor.getFlag?.(ID,'capabilities')??actor.flags?.[ID]?.capabilities),ownId=item.id??item._id;
 const access=restrictedEligibility(definition,actor.system,contents(actor).filter(i=>(i.id??i._id)!==ownId),{books,rules,level:Number(item.system.level),accessOrigin:item.system.capabilityData?.accessOrigin});
 const suspension=ledger.suspensions?.[ownId];
 const links=(ledger.bindings?.[ownId]??item.system.capabilityData?.resourceLinks??[]).map(l=>({...structuredClone(l),exists:(actor.system.special??[]).some(r=>r.id===l.resourceId),manual:true}));
 return {definition,access,acquired:true,acquisition:item.system.acquisition,level:Number(item.system.level),suspended:!!suspension||ledger.schemaVersion!==1||access.allowed===false,suspensionReason:suspension?.reason??(ledger.schemaVersion!==1?'Versão de registro não suportada.':access.missing.join(' ')),activation:{available:false,mode:'manual',reason:'RES-001 registra aquisição; efeitos individuais ficam para RES-002.'},grants:ledger.schemaVersion===1?capabilityRecords.grants(actor).filter(g=>g.record.sourceItemId===ownId):[],resourceLinks:links};
}
export async function processCapabilityCommand(actor,command,{user,requestId}){
 if(!actor?.isOwner||!user||(user.isGM!==true&&!actor.testUserPermission?.(user,'OWNER')))throw Error('Você não controla este personagem.');
 const profile=game.settings.get(ID,'profile')??{},rules={...game.settings.get(ID,'houseRules'),senjutsu:profile.senjutsu},books=profile.books??[];
 const op=command.operation;
 if(['acquire','evolve'].includes(op)&&!capabilityId(requestId))throw Error('Identificador da solicitação inválido.');
 if(op==='acquire'){
  const entry=restrictedDefinition(command.key,command.book);if(!entry)throw Error('Aptidão restrita desconhecida.');
  const existing=contents(actor).find(i=>i.getFlag?.(ID,'capabilityPurchase')===requestId||i.flags?.[ID]?.capabilityPurchase===requestId);if(existing)return existing;
  const item={name:entry.name,type:'aptitude',img:ICONS.aptitude,flags:{[ID]:{capabilityPurchase:requestId}},system:{catalogKey:entry.key,catalogBook:entry.book,level:1,source:{book:entry.book,page:String(entry.page),version:entry.edition},acquisition:command.acquisition??'Comprada',selection:String(command.selection??'').slice(0,200),prerequisites:entry.requirements,availability:'Aquisição catalogada · efeitos manuais',capabilityData:{schemaVersion:1,definitionId:entry.id,accessOrigin:command.accessOrigin??restrictedEligibility(entry,actor.system,contents(actor),{rules,books}).accessOrigin,reviewReason:String(command.reviewReason??'').trim().slice(0,2000),resourceLinks:[]}}};
  const {validatePurchase}=await import('./item-validation.mjs');const errors=validatePurchase(actor,item,{rules,books,isGM:!!user.isGM});if(errors.length)throw Error(errors.join(' '));
  const [created]=await actor.createEmbeddedDocuments('Item',[item]);return created;
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
  const variants={};for(const [key,value]of Object.entries(command.variants??{}))if(key==='uzumaki'&&['option1','option2'].includes(value))variants[key]=value;
  await actor.update({'system.capabilityData':{...structuredClone(old),schemaVersion:1,origins,originVariants:{...old.originVariants,...variants}}});return {origins,previous:current};
 }
 const item=actor.items.get(command.itemId);if(!item)throw Error('Origem da capacidade não encontrada.');
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
  const ledger=capabilityLedger(actor.getFlag(ID,'capabilities'));if(ledger.schemaVersion!==1)throw Error('Versão de capacidades não suportada.');
  ledger.bindings??={};const links=ledger.bindings[item.id]??[];ledger.bindings[item.id]=[...links.filter(l=>l.key!==command.resourceKey),{key:command.resourceKey,resourceId:reserve.id}];
  await actor.update({[`flags.${ID}.capabilities`]:ledger});return {manual:true};
 }
 throw Error('Operação de capacidade desconhecida.');
}
