import test from 'node:test';
import assert from 'node:assert/strict';
import {clanCapabilities,changeDoujutsu} from '../src/clan-capabilities.mjs';
import {RESTRICTED_APTITUDES} from '../src/restricted-aptitude-data.mjs';
import {ID} from '../src/config.mjs';
function setup(origin='hyuuga'){
 globalThis.game={settings:{get:()=>0}};
 const actor={id:'clan',uuid:'Actor.clan',isOwner:true,flags:{},items:[],system:{identity:{clan:origin},attributes:{per:12,esp:6},skills:{rastrear:{points:4},procurar:{points:4},prontidao:{points:4},lidar:{points:10}},resources:{chakra:{value:10}},special:[]},getFlag(ns,key){return this.flags[ns]?.[key];},async update(patch){for(const [path,value]of Object.entries(patch)){const parts=path.split('.');let obj=this;for(const p of parts.slice(0,-1))obj=obj[p]??={};obj[parts.at(-1)]=structuredClone(value);}}};
 const add=suffix=>{const d=RESTRICTED_APTITUDES.find(d=>d.key==='res-basico-'+suffix);const i={id:'i'+actor.items.length,type:'aptitude',system:{catalogKey:d.key,catalogBook:d.book,level:1,capabilityData:{schemaVersion:1,definitionId:d.id,accessOrigin:origin,reviewReason:''}}};actor.items.push(i);return i;};
 const command=(item,operation='activate',requestId='r1')=>changeDoujutsu(actor,item,{operation,requestId,books:['basico']});
 return {actor,add,command};
}
test('Byakugan activation is explicit, scene-scoped and repeated requests do not charge again',async()=>{
 const {actor,add,command}=setup(),item=add('byakugan');assert.equal(clanCapabilities(actor).byakugan,false);
 await command(item);assert.equal(actor.system.resources.chakra.value,9);assert.equal(clanCapabilities(actor).byakugan,true);assert.equal(clanCapabilities(actor).byakuganRange,30);
 await Promise.all([command(item),command(item,'activate','r2')]);assert.equal(actor.system.resources.chakra.value,9);
 await command(item,'deactivate','r3');assert.equal(clanCapabilities(actor).byakugan,false);await command(item,'activate','r1');assert.equal(clanCapabilities(actor).byakugan,false);
 await command(item,'activate','r4');assert.equal(actor.system.resources.chakra.value,8);assert.equal(clanCapabilities(actor,{scene:'scene:1'}).byakugan,false);
});

test('Hakken uses the existing activation receipt, costs two only once, and ends with the scene',async()=>{
 const {actor,add,command}=setup('inuzuka'),item=add('hakken-no-jutsu');
 assert.equal(clanCapabilities(actor).hakken.active,false);
 await command(item);await command(item);await command(item,'activate','again');
 assert.equal(actor.system.resources.chakra.value,8);
 assert.equal(clanCapabilities(actor).hakken.active,true);
 assert.equal(clanCapabilities(actor).hakken.range,30);
 assert.equal(clanCapabilities(actor,{scene:'scene:1'}).hakken.active,false);
 assert.equal(clanCapabilities(actor,{books:[]}).hakken,null);
 await command(item,'deactivate','end');assert.equal(actor.system.resources.chakra.value,8);
 assert.equal(clanCapabilities(actor).hakken.active,false);
});
test('suspension, missing source, disabled book, changed origin and future schemas suppress benefits without deleting data',async()=>{
 const {actor,add,command}=setup(),item=add('byakugan');await command(item);const before=structuredClone(actor.system);
 actor.flags[ID].capabilities={schemaVersion:1,grants:[],suspensions:{[item.id]:{reason:'teste'}}};assert.equal(clanCapabilities(actor).byakugan,false);
 delete actor.flags[ID].capabilities.suspensions[item.id];assert.equal(clanCapabilities(actor,{books:[]}).byakugan,false);
 actor.system.identity.clan='uchiha';assert.equal(clanCapabilities(actor).byakugan,false);actor.system.identity.clan='hyuuga';
 actor.flags[ID].capabilities.schemaVersion=2;assert.equal(clanCapabilities(actor).byakugan,false);actor.flags[ID].capabilities.schemaVersion=1;
 actor.items=[];assert.equal(clanCapabilities(actor).byakugan,false);assert.deepEqual(actor.system,before);
});
test('insufficient chakra and revoked permissions leave runtime and resources untouched',async()=>{
 const {actor,add,command}=setup(),item=add('byakugan');actor.system.resources.chakra.value=0;await assert.rejects(command(item),/Chakra/);assert.deepEqual(actor.flags,{});
 actor.system.resources.chakra.value=3;await assert.rejects(changeDoujutsu(actor,item,{operation:'activate',requestId:'r1',canUse:()=>false}),/Permissão/);assert.deepEqual(actor.flags,{});
 await assert.rejects(changeDoujutsu(actor,item,{operation:'activate',requestId:'r1',canActivate:()=>false}),/condição/);assert.deepEqual(actor.flags,{});
});
test('Nidan benefits require active Sharingan and retain source and dependency gating',async()=>{
 const {actor,add,command}=setup('uchiha'),base=add('sharingan'),nidan=add('nidan-sharingan');add('sandan-sharingan');
 assert.equal(clanCapabilities(actor).intuition,0);await command(base);assert.equal(clanCapabilities(actor).intuition,1);assert.equal(clanCapabilities(actor).sandan,true);
 assert.equal(clanCapabilities(actor,{rules:{banCombatAptitudes:true}}).intuition,0);
 actor.flags[ID].capabilities={schemaVersion:1,grants:[],suspensions:{[nidan.id]:{reason:'teste'}}};assert.equal(clanCapabilities(actor).intuition,0);assert.equal(clanCapabilities(actor).sandan,false);
 assert.ok(actor.items.includes(nidan));await command(base,'deactivate','r2');assert.ok(actor.items.includes(nidan));
});
test('Aburame quantities use species units and stable independent reserve IDs, with no writes',()=>{
 const {actor,add}=setup('aburame');const kika=add('kikaichuu'),kida=add('kidaichuu');actor.system.special=[{id:'a',name:'Insetos',value:3},{id:'b',name:'Insetos',value:2}];
 actor.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{},bindings:{[kika.id]:[{key:'aburame.reserve',resourceId:'a'}],[kida.id]:[{key:'aburame.reserve',resourceId:'b'}]}}};
 const before=structuredClone(actor.system),view=clanCapabilities(actor);assert.equal(view.insects[0].value,3);assert.equal(view.insects[1].value,2);assert.equal(view.insects[1].maximum,5);assert.equal(view.insects[1].unit,'insetos');assert.deepEqual(actor.system,before);
 actor.flags[ID].capabilities.suspensions[kika.id]={reason:'teste'};assert.ok(clanCapabilities(actor).insects.every(x=>!x.available));delete actor.flags[ID].capabilities.suspensions[kika.id];
 actor.flags[ID].capabilities.bindings[kida.id][0].resourceId='a';assert.ok(clanCapabilities(actor).insects.every(x=>x.shared&&!x.bindingValid&&!x.available));
 add('rinkaichuu');assert.ok(clanCapabilities(actor).insects.filter(x=>x.key!=='res-basico-kikaichuu').every(x=>x.incompatible&&!x.available));
});
test('invalid activation and mismatched metadata are rejected without mutations',async()=>{
 const {actor,add,command}=setup(),item=add('byakugan');item.system.capabilityData.definitionId='wrong';await assert.rejects(command(item),/Origem/);assert.deepEqual(actor.flags,{});
 item.system.capabilityData.definitionId=item.system.catalogKey;await assert.rejects(command(item,'activate',''),/inválida/);assert.deepEqual(actor.flags,{});
});
