import test from 'node:test';
import assert from 'node:assert/strict';
import {ID,defaultProfile} from '../src/config.mjs';
import {nativeSettingDefinitions,registerNativeWorldSettings,worldProfile,worldRules,saveWorldProfile,saveWorldRules} from '../src/world-settings.mjs';
import {pointBudgets} from '../src/build-rules.mjs';
import {validatePowerPurchase} from '../src/power-rules.mjs';
import {restrictedEligibility} from '../src/restricted-aptitudes.mjs';
import {RESTRICTED_APTITUDES} from '../src/restricted-aptitude-data.mjs';
function runtime({isGM=true}={}){
 const profile={...defaultProfile(),name:'Mesa preservada',books:['basico','hijutsus2','livro-futuro'],notes:'Anotações antigas',future:{keep:true}},rules={powerRate:4,advancement:'level',twoHijutsus:true,customRule:{keep:true}};
 const values=new Map([['profile',profile],['houseRules',rules]]),configs=new Map(),writes=[];let renders=0;
 const storage={getItem:key=>values.has(key.slice(ID.length+1))?'saved':null};
 const settings={settings:configs,storage:new Map([['world',storage]]),register(ns,key,config){assert.equal(ns,ID);configs.set(ns+'.'+key,config);},get(ns,key){if(values.has(key))return structuredClone(values.get(key));return structuredClone(configs.get(ns+'.'+key)?.default);},async set(ns,key,value){if(!game.user.isGM)throw Error('Sem permissão');values.set(key,structuredClone(value));writes.push({key,value:structuredClone(value)});await configs.get(ns+'.'+key)?.onChange?.(value);return value;}};
 globalThis.game={user:{isGM},settings};registerNativeWorldSettings(()=>{renders++;});
 return {values,configs,writes,profile,rules,get renders(){return renders;}};
}
test('native fields register as world settings with native types, choices and old values, without writes',()=>{
 const r=runtime();assert.ok(r.configs.size>20);assert.equal(r.writes.length,0);
 for(const config of r.configs.values()){assert.equal(config.scope,'world');assert.equal(config.config,true);assert.ok([String,Boolean].includes(config.type));}
 assert.equal(r.configs.get(ID+'.book_basico').default,true);assert.equal(r.configs.get(ID+'.book_avancado').default,false);assert.equal(r.configs.get(ID+'.rule_powerRate').default,'4');assert.equal(r.configs.get(ID+'.profile_name').default,'Mesa preservada');
});
test('reading native settings preserves legacy objects, unknown books, decisions and custom rules',()=>{
 const r=runtime(),before=structuredClone([...r.values]);assert.deepEqual(worldProfile(),r.profile);
 assert.equal(worldRules().powerRate,4);assert.deepEqual(worldRules().customRule,{keep:true});assert.deepEqual([...r.values],before);assert.equal(r.writes.length,0);
});
test('saving several native fields preserves independent changes and refreshes without rewriting aggregate objects',async()=>{
 const r=runtime();await Promise.all([game.settings.set(ID,'book_hijutsus2',false),game.settings.set(ID,'profile_senjutsu','revisado'),game.settings.set(ID,'rule_powerRate','3')]);
 assert.equal(worldProfile().books.includes('hijutsus2'),false);assert.equal(worldProfile().senjutsu,'revisado');assert.equal(worldRules().powerRate,3);assert.equal(r.renders,3);
 assert.deepEqual(r.values.get('profile'),r.profile);assert.deepEqual(r.values.get('houseRules'),r.rules);assert.equal(r.writes.length,3);
});
test('world values persist through registration on reconnect and are read identically by players',async()=>{
 const r=runtime();await game.settings.set(ID,'book_basico',false);await game.settings.set(ID,'rule_twoHijutsus',false);
 r.configs.clear();registerNativeWorldSettings(()=>{});game.user.isGM=false;assert.ok(!worldProfile().books.includes('basico'));assert.equal(worldRules().twoHijutsus,false);
 await assert.rejects(saveWorldProfile(worldProfile()),/Somente o mestre/);await assert.rejects(saveWorldRules(worldRules()),/Somente o mestre/);
});
test('compatibility writers update native fields and retain unknown legacy data and decisions',async()=>{
 const r=runtime();await saveWorldProfile({...worldProfile(),books:['basico','avancado','livro-futuro'],name:'Nova mesa'});await saveWorldRules({...worldRules(),powerRate:2,extendedRange:true});
 assert.equal(worldProfile().name,'Nova mesa');assert.equal(game.settings.get(ID,'book_avancado'),true);assert.equal(worldRules().powerRate,2);assert.equal(worldRules().extendedRange,true);
 assert.deepEqual(r.values.get('profile').future,{keep:true});assert.deepEqual(r.values.get('profile').decisions,r.profile.decisions);assert.deepEqual(r.values.get('houseRules').customRule,{keep:true});
});
test('disabling a native book blocks new Bakuton and Demolition acquisitions while leaving existing actor data unchanged',async()=>{
 runtime();const actor={system:{identity:{clan:'Bakuton'},campaign:{level:10},attributes:{esp:3},special:[{id:'r',value:7,max:9}]},items:[]};
 const power={name:'Bakuton',type:'power',system:{level:5,powerData:{family:'bakuton',choices:[]}}};actor.items.push({...power,id:'owned'});const before=structuredClone(actor);
 await game.settings.set(ID,'book_hijutsus2',false);const books=worldProfile().books;
 assert.match(validatePowerPurchase({...actor,items:[]},power,{books}).join(' '),/Livro/);
 const entry=RESTRICTED_APTITUDES.find(e=>e.key==='res-hijutsus2-demolicao');assert.match(restrictedEligibility(entry,actor.system,actor.items,{books}).missing.join(' '),/Livro/);assert.deepEqual(actor,before);
});
test('native power rate is applied to different actors using the existing budget',async()=>{
 runtime();const actors=[{campaign:{level:10},skills:{}},{campaign:{level:20},skills:{}}];
 for(const rate of [2,3,4]){await game.settings.set(ID,'rule_powerRate',String(rate));for(const actor of actors)assert.deepEqual(pointBudgets(actor,[],worldRules()).powers,pointBudgets(actor,[],{powerRate:rate} ).powers);}
});
test('native definition keys are stable and unique, with explicit scope and no executable rules',()=>{
 const defs=nativeSettingDefinitions();assert.equal(new Set(defs.map(d=>d.key)).size,defs.length);assert.ok(defs.every(d=>/^[a-zA-Z0-9_]+$/.test(d.key)));assert.ok(defs.find(d=>d.key==='rule_optionalXP').hint.includes('nível inteiro'));
});
