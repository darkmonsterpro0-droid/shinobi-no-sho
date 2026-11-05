import test from 'node:test';
import assert from 'node:assert/strict';
import {SIZES,effectiveAttributes,sizeAttackModifier,canBlockSize,intimidateSizeModifier,sizeSweepAllowed,resolveHardness,camouflagePlan,camouflageResult} from '../src/physical-rules.mjs';
import {applyPhysicalDamage,camouflageSources,physicalAction} from '../src/physical-actions.mjs';
import {derivedSummary,statPrecision,restRecovery} from '../src/automation.mjs';
import {WEAPONS,weaponAttack,weaponRequirements} from '../src/weapons.mjs';
import {maneuverPlan} from '../src/maneuvers.mjs';
import {resolveWeaponAttack} from '../src/weapon-resolution.mjs';
import {ID} from '../src/config.mjs';
import {set} from '../src/ui.mjs';

let serial=0,rolls=[],dice=[];
const actors=[];
globalThis.game={user:{id:'gm',isGM:true},time:{worldTime:0},settings:{get:(_id,key)=>key==='houseRules'?{}:key==='profile'?{books:['basico','avancado']}:0},actors:{contents:actors}};
globalThis.foundry={utils:{deepClone:structuredClone,randomID:()=>String(++serial)},dice:{Roll:class {constructor(formula){this.formula=formula;}async evaluate(){this.total=dice.shift()??8;return this;}async toMessage(){rolls.push(this.total);}}}};
globalThis.ChatMessage={getSpeaker:()=>({}),create:async()=>({})};
globalThis.fromUuid=async uuid=>actors.find(a=>a.uuid===uuid);
function actor(size='medium',temporary=false){
 const a={id:String(++serial),isOwner:true,type:'character',effects:[],items:[],flags:{},system:{campaign:{level:12},attributes:{for:10,des:10,agi:6,per:5,int:5,vig:8,esp:14},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},physical:{size,temporary},resources:{vitality:{value:100,max:100},chakra:{value:20,max:20}},conditions:[],skills:{furtividade:{points:2},atletismo:{points:2}},movement:{distance:15},inventoryState:{},powerState:{},advancement:{}}};
 a.uuid='Actor.'+a.id;a.items.get=id=>a.items.find(i=>i.id===id);a.getFlag=(ns,k)=>a.flags[ns]?.[k];a.toObject=()=>({id:a.id,type:a.type,system:structuredClone(a.system)});a.update=async patch=>{for(const[k,v]of Object.entries(patch))set(a,k,structuredClone(v));};a._source={system:structuredClone(a.system)};actors.push(a);return a;
}
const aptitude=(key,selection='')=>({type:'aptitude',system:{catalogKey:key,catalogBook:'basico',selection,level:1,acquisition:'Concedida'}});

test('all ten size categories preserve purchased attributes and temporary size does not raise vitality or permanent requirements',()=>{
 assert.equal(Object.keys(SIZES).length,10);
 const a=actor('huge'),b=actor('huge',true),medium=actor();
 assert.equal(effectiveAttributes(a.system).for,13);assert.equal(effectiveAttributes(b.system,{permanentOnly:true}).for,10);
 assert.equal(derivedSummary(a).vitality,derivedSummary(medium).vitality+9);assert.equal(derivedSummary(b).vitality,derivedSummary(medium).vitality);
 assert.equal(statPrecision(a,'cc').precision,statPrecision(medium,'cc').precision);
 assert.equal(statPrecision(a,'for').precision,13);assert.equal(statPrecision(a,'furtividade',{kind:'skill'}).precision,3);
 assert.equal(restRecovery(b).vitalityRecovery,restRecovery(medium).vitalityRecovery);
 const heavy=WEAPONS.find(w=>w.key==='great-club');assert.equal(weaponRequirements(heavy,a.system).length,0);assert.ok(weaponRequirements(heavy,b.system).length);
 assert.equal(a.system.attributes.for,10);
});
test('size changes only the specified defense matchup, blocking, intimidation and large sweeping attack',()=>{
 assert.equal(sizeAttackModifier('small','gargantuan'),2);assert.equal(sizeAttackModifier('small','gargantuan',{defense:'other'}),0);
 assert.equal(sizeAttackModifier('colossal','small'),0);assert.equal(canBlockSize('huge','medium'),false);assert.equal(canBlockSize('large','medium'),true);
 assert.equal(intimidateSizeModifier('large','large'),0);assert.equal(intimidateSizeModifier('large','medium'),1);
 assert.equal(sizeSweepAllowed('gargantuan',['medium','small']),true);assert.equal(sizeSweepAllowed('huge',['small']),false);
});
test('body hardness uses strongest bypass, is applied before grade and division, and fixed damage meets twice hardness',()=>{
 const body=resolveHardness({hardness:5,base:12,degree:3,ignore:[1,2],divisions:2});
 assert.equal(body.effective,3);assert.deepEqual(body.divided,[5,4]);assert.equal(body.damage,27);assert.equal(body.hardness,5);
 assert.equal(resolveHardness({hardness:5,fixed:13}).damage,3);
 assert.equal(resolveHardness({hardness:5,base:12,ignore:['all']}).damage,12);
 assert.equal(resolveHardness({kind:'barrier',hardness:5,base:5,degree:3}).broken,true);
 assert.equal(resolveHardness({kind:'object',hardness:5,base:4}).hardness,3);
 assert.equal(resolveHardness({kind:'object',hardness:5,fixed:9}).broken,false);
 assert.equal(resolveHardness({kind:'object',hardness:5,fixed:10}).broken,true);
});
test('imaginary hardness only dissipates under wind/explosion area attacks and never reduces damage',()=>{
 const gas={kind:'imaginary',hardness:5,base:8,degree:2};
 assert.equal(resolveHardness(gas).broken,false);assert.equal(resolveHardness({...gas,area:true,explosionOrWind:true}).broken,true);
 assert.equal(resolveHardness({...gas,area:true,explosionOrWind:true}).damage,16);
});
test('camouflage does not stack environments, preserves separate darkness, and requires location even for a critical',()=>{
 const sources=[{id:'a',group:'environment',level:'partial'},{id:'b',group:'environment',level:'total'},{id:'dark',group:'darkness',level:'partial'}];
 const plan=camouflagePlan(sources,{located:true});assert.equal(plan.checks.length,2);assert.equal(camouflageResult(plan,[5,3]).passed,true);assert.equal(camouflageResult(plan,[4,8]).passed,false);
 assert.equal(camouflagePlan(sources,{critical:true}).allowed,false);assert.equal(camouflagePlan(sources,{critical:true,located:true}).checks.length,0);
 assert.equal(camouflagePlan(sources,{sensor:true}).allowed,true);assert.equal(camouflagePlan(sources,{sensor:true}).checks.length,0);
 assert.equal(camouflagePlan(sources,{located:true,areaFraction:.5}).checks.length,1);
 const personal=[{id:'blind',group:'personal',level:'total',visualImpairment:true}];assert.equal(camouflageResult(camouflagePlan(personal,{located:true,blindFight:true}),[1,7]).passed,true);
 assert.equal(camouflagePlan([{id:'other',group:'personal',level:'partial'}],{blindFight:true,located:true}).checks[0].reroll,false);
});
test('personal visual impairment is read from the attacker and mist requires confirmed area membership',()=>{
 const a=actor();a.system.powerState.active=[{id:'mist',effect:'nevoa',camouflage:{near:25,far:50,nearDistance:1}},{id:'blind',camouflage:{level:'total',group:'personal',visualImpairment:true}}];
 assert.equal(camouflageSources(a).length,0);assert.equal(camouflageSources(a,{personal:true}).length,1);
 a.system.powerState.active[0].areaMembership=true;assert.equal(camouflageSources(a,{distance:1})[0].level,'partial');assert.equal(camouflageSources(a,{distance:3})[0].level,'total');
});
test('weapon size damage, reach and energy support use effective damage attributes while CC is preserved',()=>{
 const a=actor('huge'),w=WEAPONS.find(w=>w.key==='unarmed'),base=weaponAttack(w,a.system,[],{},{});
 assert.equal(base.purchased,13);assert.equal(base.base,7);assert.equal(base.range,3);
 a.system.powerState.active=[{id:'energy',weaponId:'unarmed',damageAttribute:'esp'},{id:'stone',stoneFist:9}];
 const supported=weaponAttack(w,a.system,[],{},{});assert.equal(supported.base,11);assert.equal(supported.cannotBlock,true);assert.equal(supported.purchased,13);
 const multi=maneuverPlan('chute-duplo',supported,w,a.system,[aptitude('chute-duplo')],{},{});
 assert.equal(multi.attacks[0].damagePool,11);assert.equal(multi.attacks[0].postDivisionBonus,2);assert.equal(multi.attacks[1].postDivisionBonus,0);
});
test('physical damage applies body hardness, grade, armor then HP and repeated clicks cannot apply damage twice',async()=>{
 const a=actor();a.system.physical.bodyHardness=2;
 const armor={id:'armor',type:'equipment',system:{equipped:true,inventoryData:{kind:'armor',key:'leather',book:'basico'},catalogKey:'leather',catalogBook:'basico',absorption:{value:5,max:5}},async update(patch){for(const[k,v]of Object.entries(patch))set(this,k,v);}};
 // Use an actual armor entry so this exercises the catalog lookup, not a stubbed reducer.
 const {ARMORS}=await import('../src/inventory-data.mjs'),entry=ARMORS.find(e=>e.absorption>0);armor.system.inventoryData.key=entry.key;armor.system.inventoryData.book=entry.book;armor.system.catalogKey=entry.key;armor.system.catalogBook=entry.book;a.items.push(armor);
 const [first,again]=await Promise.all([applyPhysicalDamage(a,{sourceId:'hit',base:6,degree:2,camouflageContext:{located:true}}),applyPhysicalDamage(a,{sourceId:'hit',base:6,degree:2,camouflageContext:{located:true}})]);
 assert.equal(first.absorbed,5);assert.equal(first.damage,3);assert.equal(a.system.resources.vitality.value,97);assert.equal(armor.system.absorption.value,0);assert.equal(again.duplicate,true);
});
test('weapon result is stored on the owned target without needing permission to change another player chat message',async()=>{
 const a=actor(),message={id:'other-player',getFlag:(_id,key)=>key==='weaponAttack'?{actorUuid:a.uuid,name:'Golpe',natural:10,degree:2,size:'medium',plan:{base:7}}:undefined,setFlag:async()=>{throw Error('Chat message is not owned');}};
 const result=await resolveWeaponAttack(message,a.uuid,{hit:true});assert.equal(result.damage,14);assert.equal((await resolveWeaponAttack(message,a.uuid,{hit:true})).duplicate,true);assert.equal(a.system.resources.vitality.value,86);
});


test('an ordinary hit does not wear down imaginary hardness; a wind area does',async()=>{
 const a=actor();a.system.physical.objects=[{id:'mist',name:'Névoa',kind:'imaginary',hardness:10}];
 const root=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name:'objectImpact.'+name,value,type:'text'}))});
 const panel={values:{id:'mist'},panelConfig:{},close:async()=>{}};
 await physicalAction(panel,'damage-physical-object',{id:'mist'},root({base:'2',degree:'1',area:'no',dispels:'no'}),{actor:a});
 assert.equal(a.system.physical.objects[0].hardness,10);
 await physicalAction(panel,'damage-physical-object',{id:'mist'},root({base:'2',degree:'1',area:'yes',dispels:'yes'}),{actor:a});
 assert.equal(a.system.physical.objects[0].hardness,8);
});
