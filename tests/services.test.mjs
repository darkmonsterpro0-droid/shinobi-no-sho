import test from 'node:test';import assert from 'node:assert/strict';
import {ID} from '../src/config.mjs';import {set} from '../src/ui.mjs';
import {clanCapabilities,changeDoujutsu,HAKKEN_KEY} from '../src/clan-capabilities.mjs';
import {saveAllocation,grantAttributeXP,saveCondition,conditionRecords,derivedSummary,applyDerived,processConditionPhase,syncAutomaticStatuses,createActorClass,clampResourceChanges,toggleCondition} from '../src/automation.mjs';
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

test('acceleration doubles only movement Agility and preserves purchased attributes and combat precision',async()=>{
 const a=actor(),before=structuredClone(a.system.attributes),baseline=derivedSummary(a);
 await saveCondition(a,{key:'acelerado'});
 const fast=derivedSummary(a);
 assert.equal(fast.acceleration.initiative,2);
 assert.ok(fast.movement>baseline.movement);
 assert.equal(fast.combat.esq,baseline.combat.esq);
 assert.deepEqual(a.system.attributes,before);
 await saveCondition(a,{key:'superacelerado'});
 assert.equal(derivedSummary(a).acceleration.initiative,4);
 assert.equal(derivedSummary(a).movement,fast.movement);
});

test('continuous clan senses end on unconsciousness and recovery does not reactivate them',async()=>{
 const a=actor();a.system.identity={clan:'Inuzuka'};a.system.skills.rastrear={points:1};
 const item={id:'hakken',type:'aptitude',system:{catalogKey:HAKKEN_KEY,catalogBook:'basico',level:1,capabilityData:{schemaVersion:1,definitionId:HAKKEN_KEY,accessOrigin:'inuzuka'}}};a.items.push(item);
 await changeDoujutsu(a,item,{operation:'activate',requestId:'hakken-start',books:['basico']});
 assert.equal(clanCapabilities(a).hakken.active,true);
 await a.update({'system.resources.vitality.value':-1});await syncAutomaticStatuses(a);
 assert.equal(clanCapabilities(a).hakken.active,false);
 await a.update({'system.resources.vitality.value':1});await syncAutomaticStatuses(a);
 assert.equal(clanCapabilities(a).hakken.active,false);
});
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

test('native full import validates incoming NC and rejects invalid allocation or player replacement',async()=>{
 class Base extends Actor {async _preUpdate(){}}
 const S=createActorClass(Base),a=new S();
 const incoming=structuredClone(a.system);
 incoming.campaign.level=5;incoming.attributes.for=5;incoming.attributes.int=4;incoming.automation.attributeGranted=18;
 incoming.skills={atletismo:{points:2}};
 const patch={type:'character',system:incoming,items:[]},options={diff:false,recursive:false};
 await assert.doesNotReject(()=>a._preUpdate(patch,options,'gm'));
 incoming.skills.atletismo.points=3;
 await assert.rejects(()=>a._preUpdate(patch,options,'gm'),/invista de 0 a 2/);
 incoming.skills.atletismo.points=2;incoming.attributes.for=99;
 await assert.rejects(()=>a._preUpdate(patch,options,'gm'));
 game.user.isGM=false;
 await assert.rejects(()=>a._preUpdate(patch,options,'gm'),/Somente o mestre/);
 game.user.isGM=true;
});
test('ordinary resource recovery uses caps, clears fatigue, and refuses resurrection',async()=>{
 const a=actor();await saveCondition(a,{key:'fatigado'});const app={close:async()=>{}};const fields={operation:'rest',amount:0,fullRest:true};const root={querySelectorAll:()=>Object.entries(fields).map(([k,v])=>({name:'resource.'+k,type:typeof v==='boolean'?'checkbox':typeof v==='number'?'number':'text',value:String(v),checked:v}))};
 a.system.special=[{id:'manual-reserve',name:'Reserva manual',value:1,max:9,resourceData:{uses:'Sem recuperação automática'}}];const manualReserve=structuredClone(a.system.special);
 await automationAction(app,'apply-resource',{},root,{actor:a});assert.equal(a.system.resources.vitality.value,34);assert.equal(a.system.resources.chakra.value,12);assert.ok(!conditionRecords(a).length);
 assert.deepEqual(a.system.special,manualReserve);
 await saveCondition(a,{key:'fatigado',duration:'2 dias'});fields.fullRest=false;await assert.rejects(()=>automationAction(app,'apply-resource',{},root,{actor:a}),/oito horas/);fields.fullRest=true;await automationAction(app,'apply-resource',{},root,{actor:a});assert.ok(conditionRecords(a).some(r=>r.key==='fatigado'&&r.duration==='2 dias'));
 await a.update({'system.resources.vitality.value':-21});await assert.rejects(()=>automationAction(app,'apply-resource',{},root,{actor:a}),/ressuscita/);
});

test('resource updates cap both resources for automated and manual actors, preserving negative values',async()=>{
 const a=actor(),caps=clampResourceChanges(a,{resources:{vitality:{value:59},chakra:{value:20}}});assert.deepEqual(caps.map(c=>c.value),[36,13]);assert.deepEqual(clampResourceChanges(a,{resources:{vitality:{value:-15},chakra:{value:-2}}}),[]);
 class Base extends Actor {async _preUpdate(){}}
 const S=createActorClass(Base),b=new S(),flat={'system.resources.vitality.value':59},nested={system:{resources:{chakra:{value:20}}}};await b._preUpdate(flat,{},'gm');await b._preUpdate(nested,{},'gm');assert.equal(flat['system.resources.vitality.value'],36);assert.equal(nested.system.resources.chakra.value,13);
 b.system.automation.enabled=false;b._source.system.automation.enabled=false;const manual={'system.resources.vitality.value':60};await b._preUpdate(manual,{},'gm');assert.equal(manual['system.resources.vitality.value'],36);
 await a.update({'system.resources.vitality.value':59,'system.resources.chakra.value':20});await syncAutomaticStatuses(a);assert.equal(a.system.resources.vitality.value,36);assert.equal(a.system.resources.chakra.value,13);
});
test('condition toggles preserve source levels and use disabled effects instead of deleting',async()=>{
 const a=actor();await saveCondition(a,{key:'sangrando',level:3,source:'Fonte original'});await toggleCondition(a,'sangrando');assert.equal(conditionRecords(a).length,0);assert.equal(a.effects.size,1);await toggleCondition(a,'sangrando');assert.equal(conditionRecords(a)[0].level,3);assert.equal(conditionRecords(a)[0].source,'Fonte original');
 await toggleCondition(a,'debilitado');assert.ok(conditionRecords(a).some(r=>r.key==='debilitado'));await toggleCondition(a,'debilitado');assert.ok(!conditionRecords(a).some(r=>r.key==='debilitado'));
});

test('a ficha salva a distribuição em etapas e só inicializa recursos ao concluir',async()=>{
 const a=actor();
 await a.update({'system.campaign.draft':true,'system.automation.enabled':false,'system.resources.vitality.value':null,'system.resources.chakra.value':null});
 const values={nc:4,attributes:{...attrs,for:1},bases:a.system.automation.bases};
 await saveAllocation(a,values,{keepDraft:true});
 assert.equal(a.toObject().system.attributes.for,1);
 assert.equal(a.system.campaign.draft,true);
 assert.equal(a.system.resources.vitality.value,null);
 await assert.rejects(saveAllocation(a,values,{initializeResources:true}),/faltam distribuir/);
 await saveAllocation(a,{...values,attributes:attrs},{initializeResources:true});
 assert.equal(a.system.campaign.draft,false);
 assert.equal(a.system.resources.vitality.value,36);
 assert.equal(a.system.resources.chakra.value,13);
});

test('Corpulência deriva Vitalidade e precisão de Vigor de uma origem válida e reversível',async()=>{
 const {statPrecision}=await import('../src/automation.mjs');
 const a=actor();
 await a.update({'system.identity.clan':'Akimichi'});
 const key='res-basico-corpulencia',id='corp';
 a.items=[{id,type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,capabilityData:{schemaVersion:1,definitionId:key,accessOrigin:'akimichi'}}}];
 assert.equal(derivedSummary(a).vitality,42);
 assert.equal(statPrecision(a,'vig',{kind:'resistance'}).precision,4);
 assert.equal(clampResourceChanges(a,{resources:{vitality:{value:42}}}).length,0);
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{corp:{reason:'teste'}},bindings:{}}};
 assert.equal(derivedSummary(a).vitality,36);
 assert.equal(statPrecision(a,'vig',{kind:'resistance'}).precision,2);
 assert.equal(a.system.resources.vitality.value,20);
});

test('the skill table can show current draft precision without allowing untrained restricted uses',async()=>{
 const {getActorView,statPrecision}=await import('../src/automation.mjs');
 const a=actor();
 await a.update({'system.campaign.draft':true,'system.automation.enabled':false,'system.skills.acrobacia.points':2,'system.skills.acrobacia.value':99});
 const skills=getActorView(a).system.skills;
 assert.equal(skills.acrobacia.value,4);
 assert.equal(skills.veneficio.value,0);
 assert.throws(()=>statPrecision(a,'veneficio',{kind:'skill'}),/ao menos 1 ponto/);
 assert.equal(a.toObject().system.skills.acrobacia.value,99);
});

test('the serialized actor view keeps Lotus maneuvers in the HUD and removes them when the gates close',async()=>{
 const {getActorView}=await import('../src/automation.mjs');
 const {weaponUseView}=await import('../src/catalog.mjs');
 const a=actor();
 await a.update({'system.identity':{clan:'Hachimon Tonkou'},'system.powerState':{active:[{id:'open',hachimon:{known:8,gate:1}}]}});
 a.items=[{id:'power',type:'power',system:{level:8,powerData:{family:'hachimon'}}},
  {id:'lotus',type:'aptitude',system:{catalogKey:'res-basico-estilo-da-lotus',catalogBook:'basico',level:1,
   selection:'ataque-multiplo|ataque-poderoso',capabilityData:{accessOrigin:'hachimon-tonkou'}}}];
 for(const i of a.items){i.parent=a;i.toObject=()=>({id:i.id,type:i.type,system:structuredClone(i.system)});}
 const render=()=>weaponUseView({actor:getActorView(a),itemId:'unarmed'});
 assert.match(render(),/>Ataque Múltiplo</);assert.match(render(),/>Ataque Poderoso</);
 assert.equal(a.items.length,2);assert.equal(a.items[1].lotusGrants,undefined);
 await a.update({'system.powerState.active':[]});
 assert.doesNotMatch(render(),/>Ataque Múltiplo</);assert.doesNotMatch(render(),/>Ataque Poderoso</);
});

test('draft movement follows Agility, Velocista and movement conditions without storing a derived value',async()=>{
 const a=actor();
 await a.update({'system.campaign.draft':true,'system.automation.enabled':false,'system.attributes.agi':6});
 assert.equal(derivedSummary(a).movement,13);
 a.items.push({type:'aptitude',system:{catalogKey:'velocista',level:1}});
 assert.equal(derivedSummary(a).movement,16);
 await saveCondition(a,{key:'lento'});
 assert.equal(derivedSummary(a).movement,8);
 await saveCondition(a,{key:'impedido'});
 assert.equal(derivedSummary(a).movement,0);
 assert.equal(a.toObject().system.movement.distance,12);
});

test('Resiliência aplica dureza sem Vigor de tamanho e penalidades reversíveis',async()=>{
 const {statPrecision}=await import('../src/automation.mjs');
 const {bodyHardness}=await import('../src/physical-actions.mjs');
 const a=actor();
 const key='res-basico-resiliencia',id='resi';
 await a.update({'system.identity.clan':'Akimichi','system.attributes.vig':7,'system.physical.size':'huge','system.physical.temporary':true});
 const before=derivedSummary(a);
 const stats=['agi','acrobacia','furtividade','esq'];
 const precision=stats.map(stat=>statPrecision(a,stat,{preview:true}).precision);
 a.items=[{id,type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,capabilityData:{schemaVersion:1,definitionId:key,accessOrigin:'akimichi'}}}];
 assert.equal(bodyHardness(a),1);
 assert.equal(derivedSummary(a).movement,before.movement-5);
 assert.deepEqual(stats.map(stat=>statPrecision(a,stat,{preview:true}).precision),precision.map(value=>value-3));
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{[id]:{reason:'teste'}},bindings:{}}};
 assert.equal(bodyHardness(a),0);
 assert.equal(derivedSummary(a).movement,before.movement);
 assert.deepEqual(stats.map(stat=>statPrecision(a,stat,{preview:true}).precision),precision);
});
