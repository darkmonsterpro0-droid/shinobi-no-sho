import test from 'node:test';
import assert from 'node:assert/strict';
import {ARMORS,POISONS,UTILITIES,inventoryCatalog,inventoryEntry} from '../src/inventory-data.mjs';
import {armorSummary,consumeAbsorption,canEquipArmor,inventorySummary,poisonTraining,poisonCraftPlan,poisonResistanceDC,poisonLatency,createPoisonExposure,applyPoisonExposure,poisonResistance,poisonPhase,inventoryConditions,inventoryBonuses,soldierPillPlan,clearInventoryRestEffects,resetPillCounter,utilityPlan} from '../src/inventory-rules.mjs';
import {inventoryCatalogView,inventoryUseView} from '../src/inventory-ui.mjs';
import {inventoryAction,advanceInventoryPhase} from '../src/inventory-actions.mjs';
const base=()=>({campaign:{level:16},identity:{rank:'Chuunin'},attributes:{for:12,des:10,agi:6,per:6,int:12,vig:8,esp:7},skills:{veneficio:{points:8},medicina:{points:8}},resources:{vitality:{value:90,max:100},chakra:{value:0,max:31}},inventoryState:{}});
const apt=(key,selection='')=>({id:key,type:'aptitude',system:{catalogKey:key,selection,catalogBook:'basico',level:1}});
const equipment=(key,book='basico',extra={})=>{const entry=[...ARMORS,...UTILITIES,...POISONS].find(e=>e.key===key&&e.book===book);return {id:key+'-'+book,type:'equipment',name:entry.name,system:{catalogKey:key,catalogBook:book,quantity:1,equipped:true,inventoryData:{kind:entry.kind,key,book},...extra}};};
const poison=(key,book='avancado')=>POISONS.find(p=>p.key===key&&p.book===book);
test('armor requirements, unique body armor and trained/untrained values match the armor table',()=>{
 const armor=equipment('reinforced-battle-armor'),s=base();assert.equal(armorSummary(s,[armor]).penalty,-4);assert.equal(armorSummary(s,[armor,apt('usar-armaduras-pesadas')]).penalty,-2);
 assert.equal(armorSummary(s,[armor]).absorption,20);assert.equal(canEquipArmor(armor,{...s,attributes:{for:9,vig:14}},[]).allowed,false);
 assert.equal(canEquipArmor(equipment('battle-armor'),s,[armor]).allowed,false);assert.equal(canEquipArmor(equipment('gauntlet'),s,[armor]).allowed,true);
 assert.equal(canEquipArmor(equipment('ninja-vest'),{...s,identity:{rank:'Genin'}},[]).allowed,false);
});
test('absorption receives damage first, breaks at zero and exposes a document delta without mutating source',()=>{
 const armor=equipment('reinforced-vest','basico',{absorption:{value:4,max:10}}),summary=armorSummary(base(),[armor]),result=consumeAbsorption(summary,7);
 assert.equal(result.absorbed,4);assert.equal(result.damage,3);assert.equal(result.remaining,0);assert.deepEqual(result.changes,{'system.absorption.value':0,'system.destroyed':true});assert.equal(armor.system.absorption.value,4);
 assert.equal(consumeAbsorption(summary,7,{ignoreAbsorption:true}).damage,7);assert.throws(()=>consumeAbsorption(summary,-1));
});
test('false clone equipment grants neither absorption nor original utility behavior',()=>{
 const fake=equipment('battle-armor');fake.flags={'shinobi-no-sho':{replicaOf:'Actor.source.Item.armor'}};assert.equal(inventoryEntry(fake),null);assert.equal(armorSummary(base(),[fake]).absorption,0);
});
test('load combines permitted half compartments while containers do not erase physical load',()=>{
 const kunai={id:'kunai',type:'equipment',system:{catalogKey:'kunai',quantity:5,compartments:'10 item(ns) / 1 compartimento(s)'}},shuriken={id:'shuriken',type:'equipment',system:{catalogKey:'shuriken',quantity:9,compartments:'18 item(ns) / 1 compartimento(s)'}};
 const result=inventorySummary(base(),[kunai,shuriken,equipment('sleeping-bag'),equipment('rope'),equipment('backpack')]);assert.equal(result.used,4);assert.equal(result.storage,4);assert.equal(result.excess,1);assert.equal(result.movementPenalty,3);
 assert.equal(inventorySummary(base(),[equipment('ninja-vest'),apt('burro-de-carga')]).capacity,7);
});
test('poison editions remain separate and Guia catalogue does not silently rewrite Basic items',()=>{
 assert.equal(inventoryCatalog('poison',{inventoryRevision:'basico'}).every(e=>e.book==='basico'),true);assert.equal(inventoryCatalog('poison').every(e=>e.book==='avancado'),true);
 assert.equal(poisonResistanceDC(poison('minor-sleep','basico'),11),18);assert.equal(poisonResistanceDC(poison('minor-sleep'),11),16);assert.equal(poisonResistanceDC(poison('minor-sleep'),11,{dokujutsu:true}),19);
 assert.equal(inventoryEntry(equipment('minor-sleep','basico')).book,'basico');
});
test('chemical crafting checks trained skill, purchased prerequisites, route, batch limit and genuine kit resources',()=>{
 const s=base(),items=[apt('quimico'),equipment('laboratory-kit','basico',{uses:{value:5,max:5}})],e=poison('minor-debilitating');
 const plan=poisonCraftPlan(e,s,items,{doses:15,route:'touch'});assert.equal(plan.difficulty,16);assert.equal(plan.cost,150);assert.equal(plan.minutes,10);assert.equal(plan.veneficio,14);
 assert.throws(()=>poisonCraftPlan(e,s,items,{doses:16}));assert.throws(()=>poisonCraftPlan(e,s,[],{ideal:true}));assert.throws(()=>poisonCraftPlan(e,s,items,{route:'unknown'}));
 assert.equal(poisonCraftPlan(e,s,[apt('quimico')],{doses:1}).difficulty,20);assert.throws(()=>poisonCraftPlan(poison('artificial','basico'),s,[apt('quimico')],{doses:1}),/kit/);
 const dok={type:'power',name:'Dokujutsu',system:{level:3}};assert.equal(poisonTraining(s,[...items,dok]).veneficio,16);
});
test('Ninja Médico can fabricate ordinary antidotes using Medicina without Químico',()=>{
 const plan=poisonCraftPlan(poison('minor-debilitating'),base(),[apt('ninja-medico')],{antidote:true,ideal:true});assert.equal(plan.kind,'antidote');assert.equal(plan.skill,'medicina');assert.equal(plan.veneficio,14);
 assert.throws(()=>poisonCraftPlan(poison('minor-debilitating'),base(),[apt('ninja-medico')],{antidote:false,ideal:true}));
});
test('latency respects edition, contagion method and the improved Dokujutsu routes',()=>{
 assert.deepEqual(poisonLatency(poison('artificial','basico'),'blood'),{turns:3,seconds:0});assert.equal(poisonLatency(poison('artificial','basico'),'blood',{dokujutsu:true}).turns,2);
 assert.equal(poisonLatency(poison('minor-debilitating'),'inhalation').turns,4);assert.equal(poisonLatency(poison('minor-debilitating'),'touch',{dokujutsu:true}).turns,1);
 assert.equal(poisonLatency(poison('minor-debilitating'),'ingestion').seconds,600);assert.equal(poisonLatency(poison('minor-debilitating'),'ingestion',{dokujutsu:true,ingestionMinutes:1440}).seconds,86400);
 assert.throws(()=>poisonLatency(poison('minor-debilitating'),'ingestion',{dokujutsu:true,ingestionMinutes:1441}));
});
test('blood requires enough damage degree and touch attacks require real damage unless an applicable Dokujutsu technique',()=>{
 const item=equipment('minor-debilitating','avancado',{inventoryData:{kind:'poison',route:'blood',veneficio:12,dc:17}});
 assert.throws(()=>createPoisonExposure(item,{route:'blood',damageGrade:2}));assert.equal(createPoisonExposure(item,{route:'blood',damageGrade:3}).delay,0);
 assert.throws(()=>createPoisonExposure(item,{route:'touch',damage:0}));assert.equal(createPoisonExposure(item,{route:'touch',damage:0,usingPower:true}).route,'touch');
});
test('three non-consecutive poison successes suspend ordinary effects, and re-exposure can remove one success',()=>{
 let p={id:'p',key:'minor-debilitating',book:'avancado',category:2,dc:16,elapsed:4,successes:0,failures:0,active:false};
 for(const [natural,total]of [[8,18],[4,13],[10,20],[5,10],[9,19]])p=poisonResistance(p,{natural,total,scene:'scene1'}).record;
 assert.equal(p.successes,3);assert.equal(p.failures,2);assert.equal(p.suppressedScene,'scene1');assert.equal(p.active,false);
 p=poisonResistance(p,{natural:2,total:99,reExposure:true}).record;assert.equal(p.successes,2);
 const before=p.successes;p=poisonResistance(p,{natural:15,total:15,reExposure:true}).record;assert.equal(p.successes,before);
 assert.equal(poisonPhase({poisons:[p]},{scene:'scene2'}).state.poisons[0].active,true);
});
test('Guia permits one active poison by category, Basic keeps distinct exposures independent',()=>{
 const old={id:'old',key:'minor-debilitating',book:'avancado',category:2},weak={id:'new',key:'minor-sleep',book:'avancado',category:1};assert.equal(applyPoisonExposure({poisons:[old]},weak).ignored,true);
 const tie={id:'tie',key:'sleep',book:'avancado',category:2};assert.equal(applyPoisonExposure({poisons:[old]},tie,{tieRoll:4}).ignored,true);assert.equal(applyPoisonExposure({poisons:[old]},tie,{tieRoll:5}).state.poisons[0].id,'tie');
 assert.equal(applyPoisonExposure({poisons:[old]},{...old,id:'same'}).reExposure,'old');
 assert.equal(applyPoisonExposure({poisons:[{...old,key:'artificial',book:'basico'}]},{...old,key:'artificial',book:'basico',id:'second'}).state.poisons.length,2);
});
test('poison condition penalties exclude resistance tests and do not overwrite purchased attributes',()=>{
 const s=base();s.inventoryState.poisons=[{id:'p',key:'superior-weakening',book:'avancado',active:true,suppressedScene:null,dc:22}];
 assert.equal(inventoryBonuses(s,{stat:'for',kind:'attribute'}).conditionPenalty,-3);assert.equal(inventoryBonuses(s,{stat:'vig',kind:'resistance'}).conditionPenalty,0);assert.equal(inventoryBonuses(s,{stat:'for'}).strengthDamageModifier,-6);assert.equal(s.attributes.for,12);
});
test('soldier pills cap recovery at three doses, apply only the highest delayed side effect, and require manual GM counter reset',()=>{
 const s=base();let p=soldierPillPlan(s,{},1,{now:0});assert.equal(p.gain,4);p=soldierPillPlan(s,p.state,1,{now:10});assert.equal(p.count,2);assert.deepEqual(inventoryConditions(p.state,{now:3611}).map(c=>c.key),['exausto']);
 const rested=clearInventoryRestEffects(p.state);assert.equal(rested.pills.count,2);assert.equal(rested.conditions.length,0);
 const overdose=soldierPillPlan(s,p.state,2,{now:20});assert.equal(overdose.granted,1);assert.equal(overdose.overdose,true);assert.deepEqual(inventoryConditions(overdose.state,{now:21}).map(c=>c.key),['inconsciente']);assert.deepEqual(inventoryConditions(overdose.state,{now:3621}).map(c=>c.key),['exausto']);
 assert.equal(resetPillCounter(overdose.state).pills.count,0);assert.equal(resetPillCounter(overdose.state).conditions.length,2);assert.throws(()=>soldierPillPlan(s,{},1,{clone:true}));
});
test('utility parameters honor throwing, quick use, target restrictions and explosive tag scaling',()=>{
 const s=base(),items=[apt('arremessador-de-utilitarios'),apt('utilitarista-rapido')],flash=UTILITIES.find(e=>e.key==='flash-bomb'&&e.book==='avancado'),plan=utilityPlan(flash,s,items,{quantity:2});assert.equal(plan.range,15);assert.equal(plan.action,'Movimento');assert.equal(plan.dc,21);assert.equal(plan.turns,3);
 assert.throws(()=>utilityPlan(flash,s,items,{quantity:3}));assert.throws(()=>utilityPlan(UTILITIES.find(e=>e.key==='net'),s,items,{}));
 const tag=utilityPlan(UTILITIES.find(e=>e.key==='explosive-tag'),s,[],{quantity:6,mode:'kunai'});assert.equal(tag.base,6);assert.equal(tag.area.diameter,10);assert.equal(tag.dc,24);
});
test('all inventory views render without oversized specialized widgets or exposing player counter reset',()=>{
 const s=base(),items=[equipment('net','avancado'),equipment('bolas','avancado'),equipment('minor-sleep','avancado')],actor={id:'a',uuid:'Actor.a',name:'A',system:s,items,isOwner:true};
 for(const item of items)assert.match(inventoryUseView({actor,itemId:item.id,isGM:false}),/<h3>/);
 assert.doesNotMatch(inventoryUseView({actor,isGM:false}),/data-sns="reset-pill-count"/);assert.match(inventoryUseView({actor,isGM:true}),/reset-pill-count/);assert.match(inventoryCatalogView({actor,inventoryKind:'poison',isGM:false}),/Preparar fabricação/);
});
test('GM-only pill counter reset checks runtime permission and preserves overdose conditions',async()=>{
 const saved=globalThis.game;let updated=false;try{globalThis.game={user:{isGM:false},settings:{get:()=>({})}};const actor={isOwner:true,system:base()};await assert.rejects(()=>inventoryAction({},'reset-pill-count',{},null,{actor}),/mestre/);assert.equal(updated,false);}finally{globalThis.game=saved;}
});
