import test from 'node:test';
import assert from 'node:assert/strict';
import {gateBenefits,gateOpening,hachimonProfile,createHachimonEffectClass,heavyAttackPlan} from '../src/hachimon-rules.mjs';
import {ID} from '../src/config.mjs';
import {WEAPONS,weaponAttack} from '../src/weapons.mjs';
import {maneuverPlan} from '../src/maneuvers.mjs';
import {validatePowerPurchase,powerPlan} from '../src/power-rules.mjs';
import {LOTUS_KEY,lotusPurchaseErrors,aptitudeOwned,aptitudeItems} from '../src/aptitudes.mjs';
import {availableManeuvers} from '../src/maneuvers.mjs';
import {defaultProfile} from '../src/config.mjs';

test('Lotus purchases validate two distinct Basic maneuvers, original prerequisites and the three-purchase limit',()=>{
 globalThis.game={settings:{get:(_ns,key)=>key==='profile'?defaultProfile():undefined}};
 const system={identity:{clan:'Hachimon Tonkou'},attributes:{for:12,agi:8},automation:{bases:{cc:3}}};
 const item=(selection,id='lotus')=>({id,type:'aptitude',system:{catalogKey:LOTUS_KEY,selection}});
 assert.deepEqual(lotusPurchaseErrors(system,[],'ataque-multiplo|ataque-poderoso'),[]);
 assert.match(lotusPurchaseErrors(system,[],'ataque-multiplo|ataque-multiplo').join(' '),/diferentes/);
 assert.match(lotusPurchaseErrors(system,[],'fascinar|ataque-poderoso').join(' '),/inválida/);
 assert.match(lotusPurchaseErrors(system,[],'ataque-progressivo|ataque-poderoso').join(' '),/Pré-requisitos/);
 assert.match(lotusPurchaseErrors(system,[item('ataque-multiplo|ataque-poderoso')],'ataque-multiplo|soco-agarrado').join(' '),/outra compra/);
 assert.match(lotusPurchaseErrors(system,[item('a|b','1'),item('c|d','2'),item('e|f','3')],'ataque-multiplo|ataque-poderoso').join(' '),/três compras/);
 system.attributes.for=3;assert.match(lotusPurchaseErrors(system,[],'ataque-multiplo|ataque-poderoso').join(' '),/Pré-requisitos/);
});

test('Lotus grants are reversible derived choices with provenance and never replace a separately owned maneuver',()=>{
 let books=['basico'];globalThis.game={settings:{get:(_ns,key)=>key==='profile'?{...defaultProfile(),books}:undefined}};
 const actor={system:{identity:{clan:'Hachimon Tonkou'},powerState:{active:[]}},flags:{},getFlag(ns,key){return this.flags[ns]?.[key];}},
  power={id:'gates',type:'power',system:{level:8,powerData:{family:'hachimon'}}},
  source={id:'lotus',type:'aptitude',parent:actor,system:{catalogKey:LOTUS_KEY,catalogBook:'basico',selection:'ataque-multiplo|ataque-progressivo',capabilityData:{accessOrigin:'hachimon-tonkou'}}},
  own={id:'own',type:'aptitude',system:{catalogKey:'ataque-multiplo',catalogBook:'basico'}};
 const items=[power,source,own];
 assert.equal(aptitudeOwned(items,'ataque-progressivo'),undefined);
 actor.system.powerState.active=[{id:'open',hachimon:{known:8,gate:1}}];
 assert.equal(aptitudeOwned(items,'ataque-progressivo').lotusSource,'lotus');
 assert.equal(aptitudeOwned(items,'ataque-multiplo').id,'own');
 assert.ok(availableManeuvers(items)['ataque-progressivo']);
 const serialized=items.map(i=>({id:i.id,type:i.type,system:structuredClone(i.system)}));
 serialized.find(i=>i.id==='lotus').lotusGrants=aptitudeItems(items).filter(i=>i.lotusSource).map(({parent,...grant})=>grant);
 assert.equal(aptitudeOwned(serialized,'ataque-progressivo').lotusSource,'lotus');
 assert.ok(availableManeuvers(serialized)['ataque-progressivo']);
 assert.equal(items.length,3);assert.equal(actor.flags[ID],undefined);
 actor.flags[ID]={capabilities:{schemaVersion:1,suspensions:{lotus:{reason:'teste'}}}};
 assert.equal(aptitudeOwned(items,'ataque-progressivo'),undefined);assert.equal(aptitudeOwned(items,'ataque-multiplo').id,'own');
 actor.flags[ID].capabilities.suspensions={};books=[];
 assert.equal(aptitudeOwned(items,'ataque-progressivo'),undefined);
 books=['basico'];actor.system.powerState.active=[];
 assert.equal(aptitudeItems(items).filter(i=>i.lotusSource).length,0);
 assert.equal(aptitudeItems(items,{lotusAcquisition:true}).filter(i=>i.lotusSource).length,2);
 assert.equal(aptitudeOwned(items.filter(i=>i!==source),'ataque-progressivo'),undefined);
});

test('opened gates replace earlier benefits while gates seven and eight use the purchased power level',()=>{
 assert.deepEqual(gateBenefits(1,1),{known:1,gate:1,strength:1,damageStrength:2,agility:0,acceleration:1,genjutsuReduction:0,damagePerTurn:3,duration:2,immuneFatigue:false,fatigueTurns:4,fatal:false});
 assert.equal(gateBenefits(8,1).duration,5);assert.equal(gateBenefits(8,2).damagePerTurn,2);
 assert.equal(gateBenefits(8,2).immuneFatigue,true);assert.equal(gateBenefits(8,2).fatigueTurns,1);
 assert.equal(gateBenefits(10,7).strength,10);assert.equal(gateBenefits(10,7).damagePerTurn,10);
 assert.equal(gateBenefits(10,8).strength,20);assert.equal(gateBenefits(10,8).damageStrength,40);
 assert.equal(gateBenefits(10,8).agility,6);assert.equal(gateBenefits(10,8).genjutsuReduction,8);
 assert.equal(gateBenefits(10,8).damagePerTurn,0);assert.equal(gateBenefits(10,8).fatal,true);
 assert.throws(()=>gateBenefits(6,7),/acima/);assert.throws(()=>gateBenefits(10,9),/acima/);
});
test('heavy attacks trade only future turns, preserve natural critical rules and expire after their declared turn',()=>{
 const actor={system:{powerState:{active:[{id:'open',hachimon:{known:8,gate:2},remaining:5}]}},flags:{}},
  attack={stat:'cc',base:6,notes:[]},context={requested:true,turn:'t1',scene:'scene',inCombat:true,now:10};
 let plan=heavyAttackPlan(attack,actor,context);
 assert.equal(plan.minimumDegree,4);assert.equal(plan.hachimonHeavy.wear,8);assert.equal(plan.hachimonHeavy.difficulty,13);
 assert.equal(plan.automaticHit,undefined);assert.equal(plan.automaticCritical,undefined);
 actor.system.powerState.active[0].remaining=3;plan=heavyAttackPlan(attack,actor,context);
 assert.equal(plan.minimumDegree,2);assert.equal(plan.hachimonHeavy.wear,4);
 actor.flags[ID]={aptitudes:{hachimon:{heavy:{...plan.hachimonHeavy,pending:false,executionId:'one'}}}};
 actor.system.powerState.active=[];
 assert.equal(heavyAttackPlan(attack,actor,{...context,requested:false}).minimumDegree,2);
 assert.equal(heavyAttackPlan(attack,actor,{...context,requested:false,turn:'t2'}).minimumDegree,undefined);
 assert.equal(heavyAttackPlan(attack,actor,{...context,requested:false,inCombat:false,now:16}).minimumDegree,undefined);
 assert.throws(()=>heavyAttackPlan(attack,actor,{...context,turn:'t2'}),/segundo Portão/);
 actor.flags={};actor.system.powerState.active=[{id:'death',hachimon:{known:10,gate:8},remaining:5}];
 plan=heavyAttackPlan(attack,actor,context);assert.equal(plan.automaticHit,true);assert.equal(plan.automaticCritical,true);assert.equal(plan.hachimonHeavy.wear,0);
 actor.system.powerState.active[0].remaining=2;
 plan=heavyAttackPlan(attack,actor,context);assert.equal(plan.minimumDegree,1);assert.equal(plan.automaticHit,true);assert.equal(plan.automaticCritical,undefined);
});

test('opening action follows the number of gates newly released and an active record preserves its remaining duration',()=>{
 assert.equal(gateOpening(8,4).action,'partial');assert.equal(gateOpening(8,8).action,'movement');
 assert.equal(gateOpening(8,5,4).action,'partial');assert.throws(()=>gateOpening(8,3,4),/aumentar/);
 const system={powerState:{active:[{id:'old',hachimon:{known:8,gate:1},active:false},
  {id:'current',hachimon:{known:8,gate:5},remaining:2}]}};
 const profile=hachimonProfile(system);assert.equal(profile.gate,5);assert.equal(profile.strength,5);assert.equal(profile.remaining,2);
 system.powerState.active[1].ending=true;assert.equal(hachimonProfile(system),null);
});

test('Kyumon suppresses fatigue through the native effect getter and closing restores the untouched original effect',()=>{
 class NativeEffect{get isSuppressed(){return this.expired??false;}}
 const Effect=createHachimonEffectClass(NativeEffect),effect=new Effect();
 effect.actor={system:{powerState:{active:[]}}};effect.disabled=false;
 effect.flags={[ID]:{condition:{key:'exausto',source:'Condição anterior'}}};
 assert.equal(effect.isSuppressed,false);
 effect.actor.system.powerState.active=[{id:'gates',hachimon:{known:8,gate:2}}];
 assert.equal(effect.isSuppressed,true);assert.equal(effect.disabled,false);
 effect.actor.system.powerState.active[0].ending=true;assert.equal(effect.isSuppressed,false);
 assert.equal(effect.flags[ID].condition.source,'Condição anterior');
 effect.expired=true;assert.equal(effect.isSuppressed,true);
 effect.actor.system.powerState.active=[{hachimon:{known:1,gate:8}}];assert.equal(hachimonProfile(effect.actor.system),null);
});

test('Hachimon keeps NC, Vigor and another-origin purchase limits and never grants the power from an origin alone',()=>{
 globalThis.game={settings:{get:()=>0},time:{worldTime:0}};
 const item={id:'gates',name:'Hachimon',type:'power',system:{level:2,powerData:{family:'hachimon'}}},
  actor={uuid:'Actor.gates',system:{identity:{clan:'Nara'},campaign:{level:20},attributes:{vig:6},powerState:{}},items:[item]};
 assert.match(validatePowerPurchase(actor,item,{books:['basico']}).join(' '),/somente nível 1/);
 assert.deepEqual(validatePowerPurchase(actor,item,{books:['basico'],rules:{twoHijutsus:true}}),[]);
 item.system.level=1;assert.deepEqual(validatePowerPurchase(actor,item,{books:['basico']}),[]);
 actor.system.attributes.vig=5;assert.match(validatePowerPurchase(actor,item,{books:['basico']}).join(' '),/Vigor 6/);
 actor.system.attributes.vig=6;assert.match(validatePowerPurchase(actor,item,{books:[]}).join(' '),/Livro/);
 actor.system.identity.clan='Hachimon Tonkou';item.system.level=8;
 const plan=powerPlan(item,actor.system,actor.items,{effect:'hachimon',level:8},{actor,books:['basico']});
 assert.equal(plan.cost,0);assert.equal(plan.seals,false);assert.equal(plan.action,'movement');assert.equal(plan.targets,0);
 assert.equal(actor.system.powerState.active,undefined);
});

test('only gate Strength is doubled in damage, weapon damage survives, and ordinary maneuver bonuses are suppressed',()=>{
 globalThis.game={settings:{get:()=>0},time:{worldTime:0}};
 const system={attributes:{for:20,des:8,agi:8},automation:{bases:{cc:3,cd:3}},physical:{size:'medium'},
  powerState:{active:[{id:'gates',hachimon:{known:8,gate:4}}]}},weapon=WEAPONS.find(w=>w.key==='unarmed'),
  items=['ataque-poderoso','ataque-multiplo','ataque-progressivo'].map(key=>({type:'aptitude',system:{catalogKey:key,catalogBook:'basico'}}));
 items.push({type:'power',name:'Hachimon Tonkou',system:{level:8,powerData:{family:'hachimon'}}});
 const attack=weaponAttack(weapon,system,items,{automaticExtraDamage:true},{mode:'melee'});
 assert.equal(attack.base,14);assert.equal(attack.precision,23);
 assert.equal(weaponAttack(WEAPONS.find(w=>w.key==='staff'),system,items,{},{}).base,16);
 assert.equal(maneuverPlan('ataque-poderoso',attack,weapon,system,items).base,14);
 system.powerState.active[0].hachimon.gate=7;
 assert.equal(maneuverPlan('ataque-progressivo',attack,weapon,system,items,{},{}).attacks.at(-1).progressiveRolls,0);
 assert.equal(maneuverPlan('ataque-progressivo',attack,weapon,system,items,{}, {hachimonLotusProgressive:true}).attacks.at(-1).progressiveRolls,3);
});
