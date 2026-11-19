import test from 'node:test';
import assert from 'node:assert/strict';
import {POWER_FAMILIES} from '../src/power-data.mjs';
import {availablePowerEffects,affinityStatus,validatePowerPurchase,powerPurchaseCost,powerParameters,powerPlan,elementalConfrontation} from '../src/power-rules.mjs';
import {powerAction,resolvePowerAttack,advancePowerPhase,endPower,reconcileActivePowers} from '../src/power-actions.mjs';
import {bodyHardness} from '../src/physical-actions.mjs';
import {derivedSummary,statPrecision} from '../src/automation.mjs';
import {ID} from '../src/config.mjs';
import {set} from '../src/ui.mjs';
import {updateDocument} from './helpers/document-update.mjs';
import {useCalories,advanceCalories,registerColoredPills} from '../src/akimichi.mjs';
import {clanCapabilities} from '../src/clan-capabilities.mjs';
import {prepareWeaponAction,commitWeaponCosts} from '../src/weapon-actions.mjs';
import {soldierPillPlan} from '../src/inventory-rules.mjs';
import {panelView} from '../src/ui.mjs';
import {maintainPower,releaseStoredSeal} from '../src/power-actions.mjs';
import {aptitudeUseAction} from '../src/aptitude-use.mjs';
import {cloneAction} from '../src/clone-actions.mjs';
import {techniqueAction} from '../src/technique-actions.mjs';
let serial=0,dice=[],messages=[];
const actors=[];actors.contents=actors;
globalThis.game={user:{id:'gm',isGM:true},actors,time:{worldTime:0},settings:{get:(_id,key)=>key==='profile'?{books:['basico','avancado']}:{}},messages:new Map()};
function message(data){const m={...data,id:String(++serial),getFlag(ns,key){return this.flags?.[ns]?.[key];}};m.uuid='ChatMessage.'+m.id;messages.push(m);game.messages.set(m.id,m);return m;}
globalThis.ChatMessage={getSpeaker:()=>({}),create:async data=>message(data)};
globalThis.foundry={utils:{randomID:()=>String(++serial),deepClone:structuredClone},dice:{Roll:class{constructor(formula){this.formula=formula;}async evaluate(){this.total=(dice.shift()??10)+Number(this.formula.match(/\+ \((-?[\d.]+)\)/)?.[1]??0);return this;}async toMessage(data){return message({...data,total:this.total});}}}};
globalThis.fromUuid=async id=>actors.find(a=>a.uuid===id)||messages.find(m=>m.uuid===id);
const power=(family,level,choices=[],track=1)=>({id:String(++serial),name:POWER_FAMILIES[family].name,type:'power',system:{level,catalogKey:family,catalogBook:'basico',powerData:{family,track,choices:choices.map(([effect,tier])=>({effect,tier}))}}});
const aptitude=key=>({id:String(++serial),type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,acquisition:'Concedida'}});
function actor(){
 const a={id:String(++serial),type:'character',isOwner:true,visible:true,name:'Teste',flags:{},items:[],effects:[],system:{campaign:{level:20},attributes:{for:12,des:12,agi:12,per:12,int:20,vig:20,esp:20},skills:{mecanismos:{points:5},medicina:{points:5},ocultismo:{points:10}},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},resources:{vitality:{value:100,max:100},chakra:{value:70,max:70}},inventoryState:{},powerState:{},conditions:[],physical:{size:'medium'},movement:{distance:15}}};
 a.uuid='Actor.'+a.id;a.getFlag=(ns,k)=>a.flags[ns]?.[k];a.toObject=()=>({system:structuredClone(a.system)});a.update=async patch=>updateDocument(a,patch);
 a.items.get=id=>a.items.find(i=>i.id===id);a.effects.get=id=>a.effects.find(i=>i.id===id);
 a.createEmbeddedDocuments=async(type,records)=>records.map(r=>{const list=type==='Item'?a.items:a.effects;const d={...structuredClone(r),id:String(++serial),getFlag(ns,k){return this.flags?.[ns]?.[k];},async update(patch){for(const[k,v]of Object.entries(patch))set(this,k,structuredClone(v));},async delete(){list.splice(list.indexOf(this),1);}};list.push(d);return d;});
 actors.push(a);return a;
}
const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value,type:typeof value==='number'?'number':'text'}))});
const app=()=>({values:{},panelConfig:{},render:async()=>{},close:async()=>{}});
const attackMessage=(source,plan,natural=12)=>message({flags:{[ID]:{powerAttack:{actorUuid:source.uuid,itemId:'test',plan,precision:15,total:natural+15,natural,degree:3,critical:false,failed:false}}}});
function akimichi(level=8){
 const a=actor();a.system.identity={clan:'Akimichi'};
 for(const suffix of ['corpulencia','resiliencia']){
  const key='res-basico-'+suffix,i=aptitude(key);
  i.system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'akimichi'};a.items.push(i);
 }
 const item=power('baika-ninpou',level);a.items.push(item,aptitude('lutador'));
 return {a,item,context:{actor:a,books:['basico'],rules:{}}};
}
const calorie=async(a,level,id='calorie',extra={})=>{
 if(extra.pillAvailable)await registerColoredPills(a,{books:['basico'],rules:{},requestId:id+':kit'});
 return useCalories(a,{operation:'calorie-use',level,...extra},{books:['basico'],rules:{},requestId:id,user:{isGM:true}});
};

test('Shikakyu requires an available Hakken and shares natural attacks without changing purchased attributes',async()=>{
 const a=actor(),item=power('shikakyu',6);a.system.identity={clan:'Inuzuka'};a.items.push(item);
 assert.match(validatePowerPurchase(a,item,{books:['basico']}).join(),/Hakken/);
 const hakken=aptitude('res-basico-hakken-no-jutsu');
 hakken.system.capabilityData={schemaVersion:1,definitionId:'res-basico-hakken-no-jutsu',accessOrigin:'inuzuka'};
 a.system.skills.rastrear={points:1};a.items.push(hakken,aptitude('punho-de-ferro'));
 assert.deepEqual(validatePowerPurchase(a,item,{books:['basico']}),[]);
 const before=structuredClone(a.system.attributes);
 const plan=powerPlan(item,a.system,a.items,{effect:'shikakyu',level:6},{actor:a,books:['basico']});
 assert.equal(plan.cost,1);assert.equal(plan.action,'partial');assert.equal(plan.duration,'continuous');
 assert.equal(plan.active.naturalWeaponDamage,4);assert.equal(plan.active.initiativeBonus,2);assert.equal(plan.active.socialBonus.intimidar,1);
 a.system.powerState.active=[{...plan.active,id:'quadrupede',itemId:item.id,sourceUuid:a.uuid,duration:plan.duration}];
 const natural=prepareWeaponAction(a,'unarmed',{shikakyu:true});
 assert.equal(natural.plan.base,10);assert.equal(natural.w.damageType,'Letal');assert.equal(natural.plan.naturalWeapon,true);
 assert.throws(()=>prepareWeaponAction(a,'unarmed',{shikakyu:true,juuken:true}),/suporte/);
 assert.deepEqual(a.system.attributes,before);
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'tsuuga',level:6},{actor:a,books:['basico']}),/Lutador/);
 a.items.push(aptitude('lutador'));
 const tsuuga=powerPlan(item,a.system,a.items,{effect:'tsuuga',level:6},{actor:a,books:['basico']});
 assert.equal(tsuuga.damage,natural.plan.base);assert.equal(tsuuga.charge,true);assert.equal(tsuuga.cost,1);
 assert.equal(tsuuga.resistances[0].difficulty,17);
 await endPower(a,'quadrupede');assert.throws(()=>prepareWeaponAction(a,'unarmed',{shikakyu:true}),/Ative/);
});

test('continuous caster techniques end on unconsciousness and scene change while lasting consequences are preserved',async()=>{
 const a=actor();a.system.resources.vitality.value=-1;
 a.system.powerState.active=[
  {id:'support',sourceUuid:a.uuid,duration:'continuous',scene:'scene:0'},
  {id:'stored',sourceUuid:a.uuid,duration:'continuous',stored:{kind:'objects'}},
  {id:'injury',sourceUuid:a.uuid,duration:'continuous',periodic:{immediate:true}},
  {id:'fixed',sourceUuid:a.uuid,duration:'continuous',remaining:3},
  {id:'permanent',sourceUuid:a.uuid,duration:'permanent'},
  {id:'foreign',sourceUuid:'Actor.other',duration:'continuous'}
 ];
 assert.deepEqual(await reconcileActivePowers(a),['support']);
 a.system.resources.vitality.value=10;
 a.system.powerState.active.push({id:'scene',sourceUuid:a.uuid,duration:'sustained',scene:'old'});
 assert.deepEqual(await reconcileActivePowers(a,{scene:'new'}),['scene']);
 assert.equal(a.system.powerState.active.length,5);
 assert.deepEqual(await reconcileActivePowers(a,{scene:'new'}),[]);
});

test('Corpulência pays common clone cost before creating actors and preserves the Kage split',async()=>{
 const {a}=akimichi(),item=aptitude('clone');item.system.selection='generic-atirador';a.items.push(item);
 a.system.structure={};a.system.resources.chakra.value=0;
 for(const entry of a.items)entry.toObject=()=>({id:entry.id,name:entry.name,type:entry.type,system:structuredClone(entry.system)});
 let created=[];const previous=globalThis.CONFIG;
 globalThis.CONFIG={Actor:{documentClass:{createDocuments:async batch=>{created=batch;return batch;}}}};
 try{
  await cloneAction(app(),'create-clones',{id:item.id},fields({'clone.count':1,'clone.convertedChakra':1}),{actor:a});
  assert.equal(created.length,1);assert.equal(a.system.resources.vitality.value,98);assert.equal(a.system.resources.chakra.value,0);
  created=[];item.system.selection='kage-bunshin';
  await assert.rejects(cloneAction(app(),'create-clones',{id:item.id},fields({'clone.count':1,'clone.convertedChakra':1}),{actor:a}),/divisão/);
  assert.equal(created.length,0);
 }finally{globalThis.CONFIG=previous;}
});

test('Corpulência pays maintenance with a partial conversion and never repeats the same turn payment',async()=>{
 const {a}=akimichi();a.system.resources.chakra.value=1;
 a.system.powerState.active=[{id:'maintain',name:'Efeito',effect:'energizar',duration:'sustained',plan:{maintenanceCost:3}}];
 await maintainPower(a,'maintain',2);
 assert.equal(a.system.resources.chakra.value,0);assert.equal(a.system.resources.vitality.value,96);
 await assert.rejects(maintainPower(a,'maintain',2),/já foi processada/);
 assert.equal(a.system.resources.vitality.value,96);
});
test('Corpulência pays a chakra-costing aptitude without changing its purchased attributes',async()=>{
 const {a}=akimichi(),item=aptitude('shunjutsu');a.items.push(item);
 const before=structuredClone(a.system.attributes);a.system.resources.chakra.value=0;
 await aptitudeUseAction(app(),'execute-aptitude',{id:item.id},fields({'aptitude.convertedChakra':1}),{actor:a});
 assert.equal(a.system.resources.vitality.value,98);assert.equal(a.system.resources.chakra.value,0);
 assert.deepEqual(a.system.attributes,before);
});

test('Corpulência pays the final cost of a technique after meta-aptitudes are applied',async()=>{
 const {a}=akimichi(),item=power('ninpou',1);a.items.push(item,aptitude('potencializar'));
 a.system.resources.chakra.value=0;
 await techniqueAction(app(),'execute-technique-modifiers',{},fields({'frame.id':item.id,'frame.level':1,'frame.power':'ninpou','frame.cost':1,'frame.damage':6,'frame.action':'standard','frame.duration':'instant','frame.convertedChakra':1,'modifier.potencializar':true}),{actor:a});
 assert.equal(a.system.resources.chakra.value,0);assert.equal(a.system.resources.vitality.value,98);
});

test('Corpulência pays an Octogram sequence cost through the shared weapon receipt once',async()=>{
 const {a}=akimichi();a.system.resources.chakra.value=1;
 await commitWeaponCosts(a,[],'octogram-cost',4,null,null,0,null,3);
 await commitWeaponCosts(a,[],'octogram-cost',4,null,null,0,null,3);
 assert.equal(a.system.resources.vitality.value,94);assert.equal(a.system.resources.chakra.value,0);
});

test('a continuous Baika stays active without a maintenance action or repeated payment',async()=>{
 const {a}=akimichi();a.system.powerState.active=[{id:'baika-active',effect:'baika',duration:'continuous',plan:{cost:3}}];
 await assert.rejects(maintainPower(a,'baika-active'),/sem ação de manutenção/);
 assert.equal(a.system.resources.chakra.value,70);
});
test('Corpulência validates sealed-content payment before consuming the compartment',async()=>{
 const {a}=akimichi();a.system.resources.chakra.value=0;
 a.system.powerState.active=[{id:'seal',name:'Armazenamento',stored:{kind:'objects',remaining:2},plan:{}}];
 await assert.rejects(releaseStoredSeal(a,'seal',2),/pontos inteiros/);
 assert.equal(a.system.powerState.active[0].stored.remaining,2);
 await releaseStoredSeal(a,'seal',1);
 assert.equal(a.system.resources.chakra.value,0);assert.equal(a.system.resources.vitality.value,98);
 assert.equal(a.system.powerState.active[0].stored.remaining,1);
});
test('colored pill kit is registered once, consumes one color once and expires outside combat',async()=>{
 const {a}=akimichi();
 const command={books:['basico'],rules:{},requestId:'kit-stock'};
 const kit=await registerColoredPills(a,command);await registerColoredPills(a,command);
 assert.equal(a.items.filter(i=>i.system.catalogKey==='akimichi-pills').length,1);
 const use={operation:'calorie-use',level:1,pill:true},options={books:['basico'],rules:{},requestId:'use-stock',user:{isGM:true}};
 await useCalories(a,use,options);await useCalories(a,use,options);
 assert.deepEqual(kit.system.inventoryData.coloredPills,{1:0,2:1,3:1});
 assert.equal(a.system.resources.vitality.value,97);
 const old=game.time.worldTime;
 try{
  game.time.worldTime=17;await advanceCalories(a,'clock:17','time',{});assert.ok(clanCapabilities(a).calorie);
  game.time.worldTime=18;await advanceCalories(a,'clock:18','time',{});assert.equal(clanCapabilities(a).calorie,null);
  assert.ok(a.effects.some(e=>e.flags[ID].condition.akimichiPill));
 }finally{game.time.worldTime=old;}
});

test('concurrent increasing pill doses preserve both stock decrements',async()=>{
 const {a}=akimichi();
 const kit=await registerColoredPills(a,{books:['basico'],requestId:'concurrent-kit'});
 await Promise.all([calorie(a,1,'concurrent-green',{pill:true}),calorie(a,2,'concurrent-yellow',{pill:true})]);
 assert.deepEqual(kit.system.inventoryData.coloredPills,{1:0,2:0,3:1});
 assert.equal(a.system.resources.vitality.value,92);
 assert.equal(clanCapabilities(a).calorie.level,2);
});

test('Nikudan includes instant abdominal preparation, Hari costs, prerequisites and individual knockdown resistance',()=>{
 const {a,item,context}=akimichi();
 const plan=powerPlan(item,a.system,a.items,{effect:'nikudan'},context);
 assert.equal(plan.cost,2);assert.equal(plan.action,'full');assert.equal(plan.stat,'cc');assert.equal(plan.damage,6);
 assert.deepEqual(plan.resistances,[{stat:'vig',difficulty:17,onFail:['caido']}]);
 assert.equal(powerPlan(item,a.system,a.items,{effect:'nikudan',mode:'hair'},context).cost,3);
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'nikudan',mode:'kunai'},context),/Prepare/);
 assert.match(powerPlan(item,a.system,a.items,{effect:'nikudan',mode:'kunai',kunaiPrepared:true},context).damageType,/Corte/);
 a.system.powerState.active=[{effect:'baika',baikaSize:'large'}];
 assert.equal(powerPlan(item,a.system,a.items,{effect:'nikudan'},context).cost,1);
 a.items=a.items.filter(i=>i.system.catalogKey!=='lutador');
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'nikudan'},context),/Lutador/);
});
test('Bunbun prepares for the next corporal attack, consumes once and preserves purchased attributes and size',async()=>{
 const {a,item}=akimichi();const before=structuredClone(a.system.attributes);
 await powerAction(app(),'power-execute',{},fields({'power.id':item.id,'power.effect':'bunbun'}),{actor:a});
 const p=prepareWeaponAction(a,'unarmed');
 assert.equal(p.plan.base,7);assert.equal(p.plan.range,2);assert.ok(p.plan.bunbunId);
 await commitWeaponCosts(a,[],'bunbun-strike',0,null,null,0,p.plan.bunbunId);
 await commitWeaponCosts(a,[],'bunbun-strike',0,null,null,0,p.plan.bunbunId);
 assert.equal(clanCapabilities(a).bunbun,null);assert.equal(prepareWeaponAction(a,'unarmed').plan.range,1);
 assert.deepEqual(a.system.attributes,before);assert.equal(a.system.physical.size,'medium');
});
test('Calorie payment is atomic, capped, ordered and idempotent; Chou suppresses only Resilience penalties',async()=>{
 const {a}=akimichi();a.system.resources.chakra.value=derivedSummary(a).chakra-2;
 const original=structuredClone(a.system.attributes),before=a.system.resources.vitality.value;
 await calorie(a,1,'green');await calorie(a,1,'green');
 assert.equal(a.system.resources.vitality.value,before-3);assert.equal(a.system.resources.chakra.value,derivedSummary(a).chakra);
 assert.equal(statPrecision(a,'for',{kind:'attribute'}).precision,14);
 assert.equal(statPrecision(a,'cc',{kind:'attack'}).precision,15);
 await assert.rejects(calorie(a,1,'again'),/ordem crescente/);
 await calorie(a,3,'red');assert.equal(clanCapabilities(a).chou,true);
 assert.equal(clanCapabilities(a).resiliencia.penalties,false);assert.equal(clanCapabilities(a).resiliencia.hardness,0);
 assert.equal(statPrecision(a,'agi',{kind:'attribute',feint:true}).precision,16);
 await assert.rejects(calorie(a,2,'yellow'),/ordem crescente/);
 assert.deepEqual(a.system.attributes,original);
 const source=a.items.find(i=>i.system.catalogKey==='res-basico-corpulencia');
 a.flags[ID].capabilities={schemaVersion:1,suspensions:{[source.id]:{reason:'teste'}}};
 assert.equal(clanCapabilities(a).calorie,null);assert.equal(derivedSummary(a).effective.for,12);
});
test('Choudan requires Chou and respects size restrictions and level 7/8/9 damage progression',async()=>{
 const {a,item,context}=akimichi(9);
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'choudan'},context),/Modo Chou/);
 await calorie(a,3);
 const base=powerPlan(item,a.system,a.items,{effect:'choudan',level:4},context);
 assert.equal(base.cost,3);assert.equal(base.damage,12);
 a.system.powerState.active=[{effect:'baika',baikaSize:'large'}];
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'choudan',level:6},context),/nível 7/);
 const at=level=>powerPlan(item,a.system,a.items,{effect:'choudan',level},context).damage;
 assert.equal(at(8),at(7)+1);assert.equal(at(9),at(7)+2);
});
test('colored pills expire once after three ends, apply fatigue and require explicit stock declaration',async()=>{
 const {a}=akimichi();a.system.attributes.vig=6;
 await assert.rejects(calorie(a,1,'no-vigor'),/Vigor 14/);
 await assert.rejects(calorie(a,1,'no-pill',{pill:true}),/Registre/);
 await calorie(a,1,'pill',{pill:true,pillAvailable:true});
 for(let i=0;i<3;i++)await advanceCalories(a,'pill-end:'+i,'end',{});
 assert.equal(clanCapabilities(a).calorie,null);
 assert.equal(a.effects.filter(e=>e.flags[ID].condition.akimichiPill).length,1);
 await advanceCalories(a,'pill-end:2','end',{});
 assert.equal(a.effects.filter(e=>e.flags[ID].condition.akimichiPill).length,1);
});
test('natural calories require maintenance after the activation turn and a full week of declared diet to restore Resilience',async()=>{
 const {a}=akimichi();
 await calorie(a,3,'red-natural');
 a.flags[ID].currentTurnKey='next';
 await useCalories(a,{operation:'calorie-maintain'},{requestId:'maintain',user:{isGM:true}});
 await advanceCalories(a,'next:end','end',{});assert.equal(clanCapabilities(a).chou,true);
 a.flags[ID].currentTurnKey='following';
 await advanceCalories(a,'following:end','end',{});assert.equal(clanCapabilities(a).chou,false);
 assert.equal(clanCapabilities(a).resiliencia.penalties,true);
 await assert.rejects(useCalories(a,{operation:'calorie-recover',diet:true},{requestId:'early',user:{isGM:true}}),/semana/);
 const old=game.time.worldTime;game.time.worldTime=7*86400;
 try{
  await assert.rejects(useCalories(a,{operation:'calorie-recover',diet:true},{requestId:'player',user:{isGM:false}}),/mestre/);
  await useCalories(a,{operation:'calorie-recover',diet:true},{requestId:'recovered',user:{isGM:true}});
  assert.equal(clanCapabilities(a).resiliencia.hardness,5);
 }finally{game.time.worldTime=old;}
});
test('red pill with Vigor 16 avoids a consciousness roll and its exhaustion expires after 24 hours',async()=>{
 const {a}=akimichi();a.system.attributes.vig=16;
 await calorie(a,3,'red-pill',{pill:true,pillAvailable:true});
 for(let i=0;i<3;i++)await advanceCalories(a,'red-end:'+i,'end',{});
 const record=a.effects.find(e=>e.flags[ID].condition.akimichiPill)?.flags[ID].condition;
 assert.equal(record.key,'exausto');assert.equal(record.remaining,null);assert.equal(record.expiresAt,86400);
 const notices=messages.filter(m=>m.getFlag(ID,'akimichiPenalty')?.startsWith(a.uuid+':')).length;
 const conditions=a.effects.length;
 await Promise.all([advanceCalories(a,'later-start','start',{}),advanceCalories(a,'later-end','end',{}),advanceCalories(a,'later-clock','time',{})]);
 assert.equal(a.effects.length,conditions);
 assert.equal(a.flags[ID].aptitudes.akimichi.pendingPenalty,undefined);
 assert.equal(messages.filter(m=>m.getFlag(ID,'akimichiPenalty')?.startsWith(a.uuid+':')).length,notices);
 const old=game.time.worldTime;game.time.worldTime=86400;
 try{assert.equal(derivedSummary(a).state.keys.includes('exausto'),false);}finally{game.time.worldTime=old;}
});

test('red pill survival remains a GM-confirmed result without inventing difficulty or automatic death',async()=>{
 const {a}=akimichi();await calorie(a,3,'red-risk',{pill:true,pillAvailable:true});
 const command={operation:'calorie-risk',outcome:'failed'},options={requestId:'risk-resolution',user:{isGM:true}};
 await assert.rejects(useCalories(a,command,options),/24 horas/);
 const old=game.time.worldTime;
 try{
  game.time.worldTime=86400;
  assert.ok(!derivedSummary(a).state.keys.includes('morto'));
  await assert.rejects(useCalories(a,command,{...options,user:{isGM:false}}),/mestre/);
  await useCalories(a,command,options);await useCalories(a,command,options);
  assert.equal(a.effects.filter(e=>e.flags[ID].condition.akimichiDeath).length,1);
  assert.ok(derivedSummary(a).state.keys.includes('morto'));
 }finally{game.time.worldTime=old;}
 const treated=akimichi().a;await calorie(treated,3,'treated-red',{pill:true,pillAvailable:true});
 await useCalories(treated,{operation:'calorie-risk',outcome:'treated'},{requestId:'treatment',user:{isGM:true}});
 assert.equal(treated.flags[ID].aptitudes.akimichi.risk.resolved,'treated');
});
test('colored and soldier pills use the shared intoxication rules in either order',async()=>{
 const first=akimichi().a;
 first.system.inventoryState=soldierPillPlan(first.system,{},1).state;
 await calorie(first,1,'mixed1',{pill:true,pillAvailable:true});
 assert.ok(first.system.inventoryState.conditions.some(c=>c.id==='pill-overdose-unconscious'));
 const second=akimichi().a;
 await calorie(second,1,'mixed2',{pill:true,pillAvailable:true});
 const result=soldierPillPlan(second.system,second.system.inventoryState,1);
 assert.equal(result.overdose,true);
 assert.ok(result.state.conditions.some(c=>c.id==='pill-overdose-exhaustion'));
});
test('Akimichi HUD exposes marked-target attacks without a redundant target selector',()=>{
 const {a,item}=akimichi();
 const html=panelView('power-use',{actor:a,itemId:item.id,openedEffect:'nikudan',values:{'power.effect':'nikudan'},
  profile:{books:['basico']},houseRules:{},hudInline:true,selectedTargets:[],targets:[{uuid:'Actor.target',name:'Alvo'}]});
 assert.doesNotMatch(html,/name="power.targetUuid"/);
 assert.match(html,/Marque um único alvo/);assert.match(html,/corrida \+ corporal/);
});

test('GM power editor opens independently of the heavy-attack control in the use panel',()=>{
 const a=actor(),item=power('ninpou',1,[['canhao',1]]);a.items.push(item);
 const env={actor:a,itemId:item.id,profile:{books:['basico']},houseRules:{},isGM:true};
 const editor=panelView('power-editor',env);
 assert.match(editor,/Exceções de afinidade/);assert.doesNotMatch(editor,/power.hachimonHeavy/);
 const use=()=>panelView('power-use',{...env,values:{'power.effect':'canhao'},hudInline:true});
 assert.doesNotMatch(use(),/name="power.hachimonHeavy"/);
 a.system.powerState.active=[{id:'gates',hachimon:{known:8,gate:2},remaining:5}];
 assert.match(use(),/name="power.hachimonHeavy"/);
 a.system.powerState.active[0].hachimon.gate=1;
 assert.doesNotMatch(use(),/name="power.hachimonHeavy"/);
});

test('Yamanaka sensor uses Rastrear, pays once, maintains without invented upkeep and ends safely',async()=>{
 const a=actor(),item=power('shindenshin',6);a.items.push(item);a.system.identity={clan:'Yamanaka'};
 a.system.skills.rastrear={points:4};
 const ctx={actor:a,books:['basico'],rules:{}};
 assert.deepEqual(validatePowerPurchase(a,item,ctx),[]);
 const plan=powerPlan(item,a.system,a.items,{effect:'sensor-mentes'},ctx);
 assert.equal(plan.range,30);assert.equal(plan.cost,2);assert.equal(plan.action,'partial');
 assert.equal(plan.stat,null);assert.equal(plan.targets,0);assert.equal(plan.duration,'sustained');
 assert.equal(plan.metaAllowed,false);assert.equal(plan.seals,true);assert.deepEqual(plan.resistances,[]);
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'sensor-mentes',level:2},ctx),/não disponível/);
 const html=panelView('power-use',{actor:a,itemId:item.id,openedEffect:'sensor-mentes',values:{'power.effect':'sensor-mentes'},profile:{books:['basico']},houseRules:{},hudInline:true,selectedTargets:[],targets:[{uuid:'Actor.other',name:'Outra ficha'}]});
 assert.doesNotMatch(html,/name="power.targetUuid"/);
 const panel=app(),root=fields({'power.id':item.id,'power.effect':'sensor-mentes'});
 await powerAction(panel,'power-execute',{},root,{actor:a});
 await powerAction(panel,'power-execute',{},root,{actor:a});
 assert.equal(a.system.resources.chakra.value,68);assert.equal(a.system.resources.vitality.value,100);
 assert.equal(a.system.powerState.active.length,1);const active=a.system.powerState.active[0];
 assert.equal(active.mindSensor,true);
 await assert.rejects(()=>powerAction(app(),'power-execute',{},root,{actor:a}),/já está ativo/);
 await maintainPower(a,active.id);assert.equal(a.system.resources.chakra.value,68);
 await advancePowerPhase(a,'sensor-next','end');
 assert.equal(a.system.powerState.active.length,1);
 await reconcileActivePowers(a,{scene:'new-scene'});assert.equal(a.system.powerState.active.length,0);
 await powerAction(app(),'power-execute',{},root,{actor:a});
 a.flags[ID]??={};a.flags[ID].capabilities={suspensions:{[item.id]:true}};
 assert.throws(()=>powerPlan(item,a.system,a.items,{effect:'sensor-mentes'},ctx),/suspenso/);
 await reconcileActivePowers(a);assert.equal(a.system.powerState.active.length,0);
 a.system.identity.clan='Nara';assert.match(validatePowerPurchase(a,item,ctx).join(),/Origem/);
 assert.match(validatePowerPurchase(a,item,{...ctx,books:[]}).join(),/desabilitado/);
});

test('mental amplification changes reach and capacity only at level ten without inventing risk damage',()=>{
 const a=actor(),item=power('shindenshin',10);a.items.push(item);a.system.identity={clan:'Yamanaka'};
 const ctx={actor:a,books:['basico'],rules:{}};
 const ordinary=powerPlan(item,a.system,a.items,{effect:'transmissao-mental'},ctx);
 const amplified=powerPlan(item,a.system,a.items,{effect:'transmissao-mental',amplifier:true},ctx);
 assert.equal(ordinary.range,50);assert.equal(ordinary.targets,10);assert.equal(ordinary.difficulty,29);
 assert.equal(amplified.range,5000);assert.equal(amplified.targets,1000);
 assert.equal(amplified.cost,ordinary.cost);assert.equal(amplified.damage,null);
 assert.equal(amplified.duration,'concentration');assert.ok(amplified.notes.some(n=>n.includes('não quantifica')));
 const html=panelView('power-use',{actor:a,itemId:item.id,openedEffect:'transmissao-mental',values:{'power.effect':'transmissao-mental'},hudInline:true,
  profile:{books:['basico']},houseRules:{},selectedTargets:['Actor.alvo'],targets:[{uuid:'Actor.alvo',name:'Alvo'}]});
 assert.match(html,/name="power.voluntary.Actor.alvo"/);assert.match(html,/name="power.amplifier"/);
 assert.doesNotMatch(html,/name="power.targetUuid"/);
});

test('affinities count distinct basic elements, require ESP 10 for the second and only accept documented exceptions',()=>{
 const a=actor();a.system.attributes.esp=9;const doton=power('doton',1),fuuton=power('fuuton',1);assert.equal(affinityStatus(a.system,[doton,fuuton]).allowed,false);
 a.system.attributes.esp=10;assert.equal(affinityStatus(a.system,[doton,fuuton,power('doton',2)]).allowed,true);
 assert.equal(affinityStatus(a.system,[doton,fuuton,power('katon',1)]).allowed,false);
 a.system.powerState.affinity={approved:true,reason:'Exceção do clã',excluded:['katon']};assert.equal(affinityStatus(a.system,[doton,fuuton,power('katon',1)]).allowed,true);
 a.system.powerState.affinity.reason='';assert.equal(affinityStatus(a.system,[doton,fuuton,power('katon',1)]).allowed,false);
});
test('additional elemental tracks grant just one free level and deleting the original still leaves one fully paid track',()=>{
 for(const family of ['ninpou','doton','fuuton','katon','raiton','suiton']){const first=power(family,4,[],1),second=power(family,3,[],2);assert.equal(powerPurchaseCost(first,[first,second]),4);assert.equal(powerPurchaseCost(second,[first,second]),2);assert.equal(powerPurchaseCost(second,[second]),3);}
});
test('power purchases cannot skip evolutions, rewrite learned choices, lower levels or duplicate tracks',()=>{
 const a=actor(),p=power('ninpou',3,[['canhao',1],['orbe',2],['flechas',3]]);assert.deepEqual(validatePowerPurchase(a,p),[]);
 const changed=structuredClone(p);changed.system.powerData.choices[2]={effect:'flechas',tier:6};assert.ok(validatePowerPurchase(a,changed).length);
 changed.system.powerData.choices[2]={effect:'raio',tier:2};assert.match(validatePowerPurchase(a,changed,{previous:p}).join(' '),/trocados/);
 a.items.push(p);const repeated=power('ninpou',1,[['canhao',1]]);assert.match(validatePowerPurchase(a,repeated).join(' '),/sequência/);
});
test('family parameters, free cannon and elemental weaknesses preserve published rounding and exceptions',()=>{
 assert.deepEqual(powerParameters('doton',3,9),{damage:8,difficulty:17,hardness:10,range:14,size:9,solid:true});
 assert.equal(powerParameters('raiton',3,9).size,5);
 assert.deepEqual(elementalConfrontation('raiton','doton'),{attack:1,defense:.5});assert.deepEqual(elementalConfrontation('doton','suiton',{mist:true}),{attack:1,defense:1});
 const a=actor(),p=power('katon',2,[['canhao',1],['orbe',2]]),plan=powerPlan(p,a.system,[p],{effect:'canhao',mode:'free'});assert.equal(plan.cost,0);assert.equal(plan.damage,3);assert.equal(plan.noOtherBenefits,true);
});
test('Misshi costs exactly three chakra and a single special tag; release does not charge it again',async()=>{
 const a=actor(),p=power('fuuinjutsu',3);a.items.push(p);await a.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:2}}]);
 await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'misshi','power.level':3,'power.message':'Mensagem'}),{actor:a});
 assert.equal(a.system.resources.chakra.value,67);assert.equal(a.items[1].system.quantity,1);const seal=a.system.powerState.active[0];
 await powerAction(app(),'power-release-seal',{id:seal.id},fields({}),{actor:a});assert.equal(a.system.resources.chakra.value,67);assert.equal(a.system.powerState.active.length,0);
});
test('Wana charges 4 plus the actual stored jutsu and reuses its creation roll when triggered',async()=>{
 const a=actor(),p=power('fuuinjutsu',6),nin=power('ninpou',2,[['canhao',1],['orbe',2]]);a.items.push(p,nin);await a.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:2}}]);dice=[12];
 await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'wana','power.level':6,'power.storedPowerId':nin.id,'power.storedEffect':'canhao','power.storedTier':1,'power.jutsuLevel':2,'power.jutsuCost':999}),{actor:a});
 assert.equal(a.system.resources.chakra.value,64);const seal=a.system.powerState.active[0];assert.equal(seal.stored.attack.natural,12);assert.equal(seal.stored.plan.damage,4);
 dice=[2];await powerAction(app(),'power-release-seal',{id:seal.id},fields({}),{actor:a});assert.equal(messages.at(-1).getFlag(ID,'powerAttack').natural,12);assert.equal(a.system.resources.chakra.value,64);assert.deepEqual(dice,[2]);dice=[];
});
test('power execution retry keeps chakra and consumables charged once',async()=>{
 const a=actor(),p=power('fuuinjutsu',3);a.items.push(p);await a.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:2}}]);const panel=app(),root=fields({'power.id':p.id,'power.effect':'misshi','power.level':3});
 await powerAction(panel,'power-execute',{},root,{actor:a});await powerAction(panel,'power-execute',{},root,{actor:a});assert.equal(a.system.resources.chakra.value,67);assert.equal(a.items[1].system.quantity,1);
});
test('missile follow-ups compare the existing defense and do not repeat damage or dice on a second confirmation',async()=>{
 const a=actor(),target=actor(),p=power('ninpou',5,[['missil',5]]),plan=powerPlan(p,a.system,[p],{effect:'missil'}),m=attackMessage(a,plan);dice=[12];
 const result=await resolvePowerAttack(m,target.uuid,{hit:true,defenseTotal:20});assert.equal(result.damage,(plan.damage+1)*3);const life=target.system.resources.vitality.value;dice=[2];
 assert.equal((await resolvePowerAttack(m,target.uuid,{hit:true,defenseTotal:20})).duplicate,true);assert.equal(target.system.resources.vitality.value,life);assert.deepEqual(dice,[2]);dice=[];
});
test('Flechas assigns two damage per allocated projectile and adds the elemental bonus once per target',async()=>{
 const a=actor(),t=actor(),p=power('fuuton',3,[['flechas',3]]),plan=powerPlan(p,a.system,[p],{effect:'flechas'});const r=await resolvePowerAttack(attackMessage(a,plan),t.uuid,{hit:true,projectiles:1});assert.equal(r.damage,12);
 await assert.rejects(()=>resolvePowerAttack(attackMessage(a,plan),t.uuid,{hit:true,projectiles:4}),/projéteis/);
});
test('target owner can resolve an attack made by another player; no caster ownership is required',async()=>{
 const a=actor(),t=actor();a.isOwner=false;const plan=powerPlan(power('ninpou',1,[['canhao',1]]),t.system,[],{effect:'canhao'}),m=attackMessage(a,plan);let shown;
 await powerAction(app(),'power-resolve',{message:m.id},fields({}),{actor:a,show:async(k,c)=>{shown=c;}});assert.equal(shown.resolveMessage,m.id);
 await powerAction(app(),'power-confirm-hit',{},fields({'resolve.message':m.id,'resolve.targetUuid':t.uuid,'resolve.hit':'yes'}),{actor:a});assert.equal(t.system.resources.vitality.value,94);
});
test('temporary flight and immersion derive movement and flight precision without rewriting invested attributes',()=>{
 const a=actor(),normal=derivedSummary(a).movement;a.system.powerState.active=[{flightSkill:20,movementMultiplier:.5}];assert.equal(statPrecision(a,'voo',{kind:'skill'}).precision,20);assert.equal(derivedSummary(a).movement,Math.ceil(normal/2));assert.equal(a.system.attributes.esp,20);
 a.system.powerState.active[0].movementMultiplier=0;assert.equal(derivedSummary(a).movement,0);
});
test('body hardness respects the elemental cycle and the distinct lightning blade protections',()=>{
 const a=actor();a.system.powerState.active=[{family:'doton',bodyHardness:7},{family:'raiton',bodyHardness:6}];assert.equal(bodyHardness(a,{element:'raiton'}),6);assert.equal(bodyHardness(a,{conditionalHardness:'fuuton-normal-raiton-half'}),3);
 a.system.powerState.active.push({family:'fuuton',bodyHardness:5});assert.equal(bodyHardness(a,{conditionalHardness:'fuuton-normal-raiton-half'}),5);
});
test('ending a power clears linked conditions on the target and periodic damage never repeats a phase',async()=>{
 const a=actor(),t=actor();a.system.powerState.active=[{id:'root',name:'Algemar'}];t.system.powerState.active=[{id:'receipt',linkedTo:'root'}];await t.createEmbeddedDocuments('ActiveEffect',[{flags:{[ID]:{condition:{key:'impedido',powerReceipt:'receipt'}}},statuses:['sns-impedido']}]);await endPower(a,'root');assert.equal(t.effects.length,0);assert.equal(t.system.powerState.active.length,0);
 t.system.powerState.active=[{id:'dot',name:'Dano',createdTurn:'old',periodic:{immediate:true,damage:2},remainingDamage:2,starts:1,sourceUuid:a.uuid}];await advancePowerPhase(t,'turn1','start');const hp=t.system.resources.vitality.value;await advancePowerPhase(t,'turn1','start');assert.equal(t.system.resources.vitality.value,hp);assert.equal(hp,98);
});


test('Cegante and continuous damage retain their escape rules on the affected actor',async()=>{
 for(const [effect,tier] of [['cegante',5],['dano-continuo',2]]){
  const source=actor(),target=actor(),p=power(effect==='cegante'?'suiton':'katon',tier,[[effect,tier]]),plan=powerPlan(p,source.system,[p],{effect,tier});
  const m=attackMessage(source,plan);await resolvePowerAttack(m,target.uuid,{hit:true});
  const active=target.system.powerState.active[0];assert.ok(active.linkedTo);assert.ok(active.plan.resistances.some(r=>r.escape));
  dice=[16];await powerAction(app(),'power-escape',{id:active.id},fields({[`escape.${active.id}.stat`]:effect==='cegante'?'for':'vig'}),{actor:target});
  assert.equal(target.system.powerState.active.length,0);dice=[];
 }
});

test('Souin pools clone chakra and leaves the origin at one even if its own reserve was empty',async()=>{
 const source=actor(),clone=actor(),p=power('fuuinjutsu',10);source.items.push(p);source.system.resources.chakra.value=0;clone.system.resources.chakra.value=15;
 clone.flags[ID]={clone:{origin:source.uuid,type:'kage-bunshin'}};
 await source.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:1}}]);
 await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'souin','power.level':10}),{actor:source});
 await powerAction(app(),'power-release-seal',{id:source.system.powerState.active[0].id},fields({}),{actor:source});
 assert.equal(source.system.resources.chakra.value,1);assert.equal(clone.system.resources.chakra.value,0);
});

test('Canhão does not roll before a private defense choice and resolves Esquiva without a manual hit',async()=>{
 const {requestAction}=await import('../src/action-executions.mjs');
 const {user}=game,Roll=foundry.dice.Roll,create=ChatMessage.create;
 game.users=new Map([[user.id,{...user,active:true}]]);
 game.users.contents=[...game.users.values()];
 game.messages.contents=messages;
 foundry.dice.Roll=class extends Roll{
  toJSON(){return {formula:this.formula,total:this.total};}
  static fromJSON(json){const data=JSON.parse(json);return Object.assign(new this(data.formula),data);}
 };
 ChatMessage.create=async data=>{
  const m=await create(data);
  m.author=game.user;
  m.update=async patch=>{for(const [key,value] of Object.entries(patch))set(m,key,structuredClone(value));};
  return m;
 };
 try{
  for(const [natural,hit] of [[12,true],[4,false]]){
   const source=actor(),target=actor(),p=power('ninpou',1,[['canhao',1]]);
   source.items.push(p);dice=[natural];
   const start=messages.length;
   await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'canhao','power.targetUuid':target.uuid}),{actor:source});
   const created=messages.slice(start),card=created.find(m=>m.getFlag(ID,'actionExecution'));
   assert.ok(card);
   assert.equal(source.system.resources.chakra.value,69);
   assert.deepEqual(dice,[natural]);
   assert.ok(created.some(m=>m.getFlag(ID,'defenseInvitation')&&m.whisper.includes(user.id)));
   await assert.rejects(requestAction({op:'attack',executionId:card.id}),/Aguarde/);
   const defense={op:'defense',executionId:card.id,strike:0,targetUuid:target.uuid,kind:'esquiva'};
   await requestAction(defense);
   assert.equal(card.getFlag(ID,'actionExecution').slots[0].result.hit,hit);
   const attack=messages.slice(start).find(m=>m.getFlag(ID,'powerAttack')?.coordinated);
   assert.ok(attack);
   assert.doesNotMatch(attack.flavor,/data-sns-power-resolve/);
   assert.equal(card.getFlag(ID,'actionExecution').state,'complete');
   if(hit)assert.ok(target.system.resources.vitality.value<100);
   else assert.equal(target.system.resources.vitality.value,100);
  }
 }finally{
  delete game.users;delete game.messages.contents;
  ChatMessage.create=create;foundry.dice.Roll=Roll;
 }
});

test('Hibon Ninpou usa efeitos de Ninpou e do elemento escolhido com afinidade própria',()=>{
 const a=actor();
 a.system.identity={clan:'Hibon Ninpou'};
 a.system.attributes.esp=6;
 const item=power('hibon-ninpou',3,[['canhao',1],['orbe',2],['barreira',3]]);
 item.name='Vidro lunar';
 item.system.powerData.hibonStyle={element:'raiton',bonuses:['damage','damage'],manifestation:'Vidro lunar'};
 const effects=availablePowerEffects('hibon-ninpou',{hibonElement:'raiton'}).map(e=>e.key);
 assert.ok(effects.includes('descarga'));
 assert.ok(effects.includes('canhao'));
 assert.ok(!effects.includes('prisao-agua'));
 assert.deepEqual(validatePowerPurchase(a,item),[]);
 const attack=powerPlan(item,a.system,[item],{effect:'canhao'});
 assert.equal(attack.damage,8);
 assert.equal(attack.range,22);
 assert.deepEqual(affinityStatus(a.system,[item]).families,[]);
 assert.deepEqual(elementalConfrontation(attack.family,'doton'),{attack:1,defense:1});
 const variation=structuredClone(item);
 variation.system.powerData.hibonStyle.bonuses=['hardness','hardness'];
 assert.match(validatePowerPurchase(a,variation).join(' '),/Só Dano/);
 variation.system.powerData.hibonStyle.bonuses=['hardness','difficulty'];
 assert.match(validatePowerPurchase(a,variation,{previous:item}).join(' '),/preservam/);
 const barrier=powerPlan(variation,a.system,[variation],{effect:'barreira'});
 assert.equal(barrier.hardness,8);
 assert.equal(barrier.active.hardness,8);
 assert.equal(barrier.difficulty,16);
});

test('Baika no Jutsu charges by expansion and restores size when ended',async()=>{
 const a=actor();
 a.system.identity={clan:'Akimichi'};
 const key='res-basico-corpulencia';
 const source=aptitude(key);
 source.system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'akimichi'};
 const item=power('baika-ninpou',6);
 a.items.push(item,source);
 assert.deepEqual(validatePowerPurchase(a,item),[]);
 assert.throws(()=>powerPlan(item,a.system,a.items,{level:4,mode:'huge'},{actor:a}),/nível usado/);
 const run=mode=>powerAction(app(),'power-execute',{id:item.id},fields({'power.id':item.id,'power.effect':'baika','power.level':6,'power.mode':mode}),{actor:a});
 await run('large');
 assert.equal(a.system.resources.chakra.value,67);
 assert.equal(derivedSummary(a).size.key,'large');
 await run('gargantuan');
 assert.equal(a.system.resources.chakra.value,62);
 assert.equal(derivedSummary(a).size.key,'gargantuan');
 assert.equal(a.system.physical.size,'medium');
 assert.equal(a.system.powerState.active.length,1);
 await endPower(a,a.system.powerState.active[0].id);
 assert.equal(derivedSummary(a).size.key,'medium');
});

test('Corpulência substitui chakra por Vitalidade na mesma execução e cobra uma única vez',async()=>{
 const a=actor();
 a.system.identity={clan:'Akimichi'};
 a.system.resources.chakra.value=1;
 const key='res-basico-corpulencia',source=aptitude(key),item=power('baika-ninpou',6);
 source.system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'akimichi'};
 a.items.push(item,source);
 const root=amount=>fields({'power.id':item.id,'power.effect':'baika','power.level':6,'power.mode':'large','power.convertedChakra':amount});
 await assert.rejects(powerAction(app(),'power-execute',{},root(4),{actor:a}),/pontos inteiros/);
 await assert.rejects(powerAction(app(),'power-execute',{},root(1),{actor:a}),/Chakra insuficiente/);
 assert.equal(a.system.resources.vitality.value,100);
 const panel=app(),payment=root(2);
 await powerAction(panel,'power-execute',{},payment,{actor:a});
 await powerAction(panel,'power-execute',{},payment,{actor:a});
 assert.equal(a.system.resources.chakra.value,0);
 assert.equal(a.system.resources.vitality.value,96);
 assert.equal(a.system.powerState.active.length,1);
 a.flags[ID].capabilities={schemaVersion:1,grants:[],suspensions:{[source.id]:{reason:'teste'}},bindings:{}};
 const ninpou=power('ninpou',1,[['canhao',1]]);
 a.items.push(ninpou);
 const shot=fields({'power.id':ninpou.id,'power.effect':'criacao-livre','power.convertedChakra':1});
 await assert.rejects(powerAction(app(),'power-execute',{},shot,{actor:a}),/Corpulência disponível/);
 assert.equal(a.system.resources.vitality.value,96);
});
