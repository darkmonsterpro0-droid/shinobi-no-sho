import test from 'node:test';import assert from 'node:assert/strict';
import {ID} from '../src/config.mjs';import {set} from '../src/ui.mjs';
import {saveAllocation,grantAttributeXP,saveCondition,conditionRecords,derivedSummary,applyDerived,processConditionPhase,syncAutomaticStatuses,createActorClass} from '../src/automation.mjs';
import {claimBleedingAttempt,settleResistance,automationAction} from '../src/summary-actions.mjs';
let rule='level',serial=0;const messages=[];
globalThis.game={user:{id:'gm',isGM:true},settings:{get:()=>({advancement:rule})}};
globalThis.foundry={utils:{deepClone:v=>structuredClone(v),randomID:()=>String(++serial),expandObject:obj=>{const o={};for(const[k,v]of Object.entries(obj))set(o,k,v);return o;}}};
globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id}),create:async m=>messages.push(m)};
const attrs={for:3,des:2,agi:3,per:1,int:0,vig:2,esp:1};
class Actor {
 static documentName='Actor';constructor(){this.id=String(++serial);this.uuid='Actor.'+this.id;this.isOwner=true;this.type='character';this.effects=new Map();this.flags={};this.items=[];this.system={campaign:{level:4,draft:false},attributes:{...attrs},automation:{enabled:true,attributeGranted:12,bases:{cc:3,cd:3,esq:3,lm:3},history:[]},conditions:[],combat:{},skills:{},advancement:{},resources:{vitality:{value:20,max:36},chakra:{value:5,max:13}},movement:{distance:12}};this._source={system:structuredClone(this.system)};}
 toObject(){return {system:structuredClone(this._source.system)};}getFlag(ns,k){return this.flags[ns]?.[k];}
 async update(patch,options={}){this.lastOptions=options;for(const[k,v]of Object.entries(patch)){set(this,k,structuredClone(v));if(k.startsWith('system.'))set(this._source,k,structuredClone(v));}return this;}
 async createEmbeddedDocuments(type,entries){assert.equal(type,'ActiveEffect');return entries.map(data=>{const e={...structuredClone(data),id:String(++serial),statuses:new Set(data.statuses),async update(p){Object.assign(this,structuredClone(p));this.statuses=new Set(p.statuses??this.statuses);},delete:async()=>{this.effects.delete(e.id);}};this.effects.set(e.id,e);return e;});}
 async deleteEmbeddedDocuments(type,ids){assert.equal(type,'ActiveEffect');for(const id of ids)this.effects.delete(id);}
}
// Foundry collections iterate documents rather than Map key/value tuples.
function actor(){const a=new Actor();a.effects[Symbol.iterator]=function*(){yield* this.values();};return a;}
test('allocation persists once, preserves damaged resources, and rejects overspend and player level grants',async()=>{
 const a=actor();await saveAllocation(a,{nc:5,attributes:{...attrs,int:1,for:4},bases:a.system.automation.bases});assert.equal(a.system.automation.attributeGranted,18);assert.equal(a.system.resources.vitality.value,20);assert.equal(derivedSummary(a).vitality,41);
 await assert.rejects(()=>saveAllocation(a,{nc:5,attributes:a.system.attributes,bases:{cc:5,cd:1,esq:3,lm:3}}),/somente|criação/);
 await saveAllocation(a,{nc:5,attributes:{...a.system.attributes,des:3},bases:a.system.automation.bases});assert.equal(a.system.automation.attributeGranted,18);
 await assert.rejects(()=>saveAllocation(a,{nc:5,attributes:{for:5,des:5,agi:5,per:5,int:5,vig:5,esp:5},bases:a.system.automation.bases}));
 game.user.isGM=false;await assert.rejects(()=>saveAllocation(a,{nc:6,attributes:a.system.attributes,bases:a.system.automation.bases}));game.user.isGM=true;
});
test('XP grants are fractional and never turn an NC increase into an extra grant',async()=>{
 rule='xp';const a=actor();await grantAttributeXP(a,.4);assert.equal(a.system.automation.attributeGranted,12.4);await saveAllocation(a,{nc:5,attributes:attrs,bases:a.system.automation.bases});assert.equal(a.system.automation.attributeGranted,12.4);rule='level';
});
test('effect-backed conditions do not create world Items, and source values do not accumulate derived movement',async()=>{
 const a=actor();await saveCondition(a,{key:'lento',source:'técnica'});assert.equal(a.effects.size,1);assert.equal(conditionRecords(a)[0].key,'lento');applyDerived(a);assert.equal(a.system.movement.distance,6);applyDerived(a);assert.equal(a.system.movement.distance,6);assert.deepEqual(a.system.attributes,attrs);
 await syncAutomaticStatuses(a);const r=conditionRecords(a)[0];await saveCondition(a,r,{remove:true});applyDerived(a);assert.equal(a.system.movement.distance,12);
});
test('turn phase handles duplicate events and recovers an interrupted pending phase without double damage',async()=>{
 const a=actor();await saveCondition(a,{key:'sangrando',level:2});const [first,duplicate]=await Promise.all([processConditionPhase(a,'r1:start'),processConditionPhase(a,'r1:start')]);assert.equal(first.damage,4);assert.equal(duplicate,null);assert.equal(a.system.resources.vitality.value,16);
 a.flags[ID].pendingPhase={key:'r2:start',result:{damage:4,updates:[],expired:[],prompts:[]}};a.system.resources.vitality.value=12;await processConditionPhase(a,'r2:start');assert.equal(a.system.resources.vitality.value,12);assert.equal(a.flags[ID].pendingPhase,null);
});
test('bleeding Vigor is one attempt per actor turn, including failures and multiple sources',async()=>{
 const a=actor();await claimBleedingAttempt(a);await assert.rejects(()=>claimBleedingAttempt(a),/tentativa de Vigor/);await a.update({[`flags.${ID}.currentTurnKey`]:'next'});await claimBleedingAttempt(a);await assert.rejects(()=>claimBleedingAttempt(a));
});
test('stabilization removes one level and ends dying only after all bleeding is removed',async()=>{
 const a=actor();await a.update({'system.resources.vitality.value':-15});await saveCondition(a,{key:'sangrando',level:2});let r=conditionRecords(a)[0];await settleResistance(a,r,true);assert.equal(conditionRecords(a).find(r=>r.key==='sangrando').level,1);assert.ok(derivedSummary(a).state.keys.includes('morrendo'));
 r=conditionRecords(a).find(r=>r.key==='sangrando');await settleResistance(a,r,true);assert.ok(derivedSummary(a).state.keys.includes('estavel'));assert.ok(!derivedSummary(a).state.keys.includes('morrendo'));
 await a.update({'system.resources.vitality.value':1});assert.ok(!derivedSummary(a).state.keys.includes('inconsciente'));await syncAutomaticStatuses(a);assert.ok(!conditionRecords(a).some(r=>r.key==='estavel'));
});
test('automatic dying bleed can be stabilized and derived icons never feed themselves back',async()=>{
 const a=actor();await a.update({'system.resources.vitality.value':-11});await syncAutomaticStatuses(a);await syncAutomaticStatuses(a);assert.equal(conditionRecords(a).length,0);const r=conditionRecords(a,{includeAutomatic:true}).find(r=>r.key==='sangrando');assert.ok(r);await settleResistance(a,r,true);assert.ok(derivedSummary(a).state.keys.includes('estavel'));await syncAutomaticStatuses(a);assert.ok(!derivedSummary(a).state.keys.includes('morrendo'));
});
test('native update guards reject changing derived fields and opening evolution does not cure',async()=>{
 class Base extends Actor {async _preUpdate(){}prepareDerivedData(){}getRollData(){return {};}}
 const S=createActorClass(Base),a=new S();await assert.rejects(()=>a._preUpdate({'system.resources.chakra.max':99},{},'gm'));await assert.rejects(()=>a._preUpdate({'system.attributes.for':9},{},'gm'));
 await assert.rejects(()=>a._preUpdate({'system.automation.bases.cc':4},{snsAllocation:true},'gm'),/criação/);
 const patch={'system.campaign.level':5},options={};await a._preUpdate(patch,options,'gm');assert.equal(patch['system.automation.attributeGranted'],18);assert.equal(options.snsOpenAllocation,true);assert.equal(a.system.resources.vitality.value,20);
});
test('ordinary resource recovery uses caps, clears fatigue, and refuses resurrection',async()=>{
 const a=actor();await saveCondition(a,{key:'fatigado'});const app={close:async()=>{}};const fields={operation:'rest',amount:0,fullRest:true};const root={querySelectorAll:()=>Object.entries(fields).map(([k,v])=>({name:'resource.'+k,type:typeof v==='boolean'?'checkbox':typeof v==='number'?'number':'text',value:String(v),checked:v}))};
 await automationAction(app,'apply-resource',{},root,{actor:a});assert.equal(a.system.resources.vitality.value,34);assert.equal(a.system.resources.chakra.value,12);assert.ok(!conditionRecords(a).length);
 await a.update({'system.resources.vitality.value':-21});await assert.rejects(()=>automationAction(app,'apply-resource',{},root,{actor:a}),/ressuscita/);
});
