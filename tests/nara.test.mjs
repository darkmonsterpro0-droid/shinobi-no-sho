import test from 'node:test';
import assert from 'node:assert/strict';
import {ID} from '../src/config.mjs';
import {shadowTurns,shadowDefense} from '../src/nara.mjs';
import {powerPlan,validatePowerPurchase} from '../src/power-rules.mjs';
function fixture(){
 globalThis.game={settings:{get:()=>0},time:{worldTime:0}};
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:10,powerData:{family:'kagejutsu'}}};
 const actor={uuid:'Actor.nara',flags:{},items:[item],system:{identity:{clan:'Nara'},campaign:{level:20},attributes:{int:11},powerState:{}},getFlag(ns,key){return this.flags[ns]?.[key];}};
 const plan=options=>powerPlan(item,actor.system,actor.items,{effect:'kage-shibari',...options},{actor,books:['basico']});
 return {actor,item,plan};
}
test('Kage Nui inherits shadow reach and stealth without slow precision, while stitching uses a full action',()=>{
 const {plan}=fixture();
 const pierce=plan({effect:'kage-nui',level:6,targets:2,shadowLight:'long',objectShadows:2});
 assert.equal(pierce.projectiles,12);assert.equal(pierce.damage,12);assert.equal(pierce.cost,6);
 assert.equal(pierce.range,25);assert.equal(pierce.action,'standard');assert.equal(pierce.duration,'instant');
 assert.equal(pierce.precisionBonus,0);assert.equal(pierce.active,null);assert.equal(pierce.shadow.binding,false);
 assert.throws(()=>plan({effect:'kage-nui',level:6,shadowLight:'dark'}),/escuridão/);
 assert.throws(()=>plan({effect:'kage-nui',level:5}),/nível|Nível/);
 const stitch=plan({effect:'kage-nui',level:6,mode:'stitch',shadowConcealed:true});
 assert.equal(stitch.action,'full');assert.equal(stitch.duration,'sustained');assert.equal(stitch.hardness,12);
 assert.equal(shadowDefense(stitch,{},{kind:'antecipar'}).penalty,-3);
 assert.equal(shadowDefense(stitch,{},{kind:'bloqueio'}).allowed,false);
});

test('Nara requires an explicit power purchase and preserves the origin, book and NC checks',()=>{
 const {actor,item,plan}=fixture();assert.deepEqual(validatePowerPurchase(actor,item,{books:['basico']}),[]);
 actor.system.identity.clan='Inuzuka';assert.throws(()=>plan({}),/Origem/);
 actor.system.identity.clan='Nara';assert.throws(()=>powerPlan(item,actor.system,actor.items,{effect:'kage-shibari'},{actor,books:[]}),/Livro/);
 actor.system.campaign.level=4;assert.throws(()=>plan({level:3}),/limite/);
});

test('shadow projectile requires drawn conducting material, respects weapon training and keeps its own two-turn limit',()=>{
 const {actor,plan}=fixture();actor.system.attributes={...actor.system.attributes,des:12,for:10};
 const weapon={id:'projectile',type:'equipment',system:{catalogKey:'kunai',catalogBook:'basico',equipped:true,quantity:2}};actor.items.push(weapon);
 const options={effect:'kage-shuriken',level:4,weaponId:weapon.id};
 assert.throws(()=>plan(options),/condutor/);
 const preparation=plan({...options,shadowConductor:true});assert.equal(preparation.action,'partial');assert.equal(preparation.cost,4);
 actor.system.powerState.active=[{...preparation.active,id:'prepared',sourceUuid:actor.uuid,itemId:'kage',plan:preparation}];
 assert.throws(()=>plan({...options,shadowConductor:true}),/já possui/);
 const shot=plan({...options,mode:'projectile',shadowPreparedId:'prepared',shadowIntentionUnknown:true});
 assert.equal(shot.action,'standard');assert.equal(shot.cost,0);assert.equal(shot.seals,false);assert.equal(shot.range,13);
 assert.equal(shot.shadow.turns,2);assert.equal(shot.active.remaining,2);assert.equal(shot.precisionBonus,0);
 assert.equal(shadowDefense(shot,{immobile:false},{kind:'esquiva'}).penalty,-2);
 assert.equal(shadowDefense(shot,{immobile:false},{kind:'bloqueio'}).penalty,0);
 assert.equal(shadowDefense(shot,{immobile:false},{kind:'bloqueio'}).allowed,true);
 assert.throws(()=>plan({...options,level:5,mode:'projectile',shadowPreparedId:'prepared'}),/nível registrado/);
 weapon.system.equipped=false;assert.throws(()=>plan({...options,mode:'projectile',shadowPreparedId:'prepared'}),/Saque/);
});
test('Shibari and Mane share reduced scene duration, including failures, while only a declared minion doubles its own time',()=>{
 const {actor,plan}=fixture();
 assert.equal(shadowTurns(1),2);assert.equal(shadowTurns(10),6);assert.equal(shadowTurns(10,1),5);
 assert.equal(shadowTurns(10,20),2);assert.equal(shadowTurns(10,0,2),2);assert.equal(shadowTurns(10,0,2,{capanga:true}),4);
 actor.flags[ID]={aptitudes:{shadowUses:{scene:'scene:0',count:2}}};
 assert.equal(plan({level:8}).shadow.turns,4);assert.equal(plan({effect:'kage-mane',level:8}).shadow.turns,4);
 actor.flags[ID].aptitudes.shadowUses.scene='scene:old';assert.equal(plan({level:8}).shadow.turns,6);
 assert.throws(()=>plan({level:3,targets:2}),/até 1/);
 assert.equal(plan({level:4,targets:2}).shadow.turns,2);
});
test('lighting, object shadows, silence, escape difficulty and Mane nine follow the published parameters',()=>{
 const {plan}=fixture();const ordinary=plan({level:4});
 assert.equal(ordinary.cost,4);assert.equal(ordinary.range,13);assert.equal(ordinary.precisionBonus,-3);
 assert.equal(ordinary.difficulty,19);assert.equal(ordinary.resistances[0].stat,'for');assert.equal(ordinary.resistances[0].action,'standard');
 assert.equal(ordinary.active.requiresImmobile,true);assert.deepEqual(ordinary.conditions,['paralisado']);
 assert.equal(plan({level:4,shadowLight:'long',objectShadows:3}).range,20);
 assert.equal(plan({level:4,shadowLight:'noon'}).range,9);assert.throws(()=>plan({shadowLight:'dark'}),/escuridão/);
 assert.throws(()=>plan({objectShadows:-1}),/inteira/);
 const silent=plan({level:4,shadowConcealed:true});assert.equal(silent.shadow.silent,true);assert.equal(silent.precisionBonus,0);
 const mane=plan({effect:'kage-mane',level:9});assert.equal(mane.duration,'sustained');assert.equal(mane.active.requiresImmobile,false);
});
test('silent shadows restrict defensive reactions while immobilized victims use fixed nine without an opposed dodge',()=>{
 const plan={shadow:{silent:true}},state={immobile:false,noReactions:false};
 assert.equal(shadowDefense(plan,state,{kind:'bloqueio'}).allowed,false);
 assert.equal(shadowDefense(plan,state,{kind:'technique'}).allowed,false);
 assert.equal(shadowDefense(plan,state,{kind:'antecipar'}).penalty,-3);
 assert.equal(shadowDefense(plan,{...state,immobile:true},{kind:'antecipar'}).allowed,false);
 assert.equal(shadowDefense(plan,{...state,immobile:true},{kind:'esquiva'}).fixedDodge,9);
 assert.equal(shadowDefense(plan,{...state,immobile:true},{kind:'esquiva',risk:true}).allowed,false);
 assert.equal(shadowDefense(plan,{immobile:true,noReactions:true},{kind:'none'}).allowed,true);
});

test('Kagezukami keeps Mane range and escape while preserving victim actions and concentration at level nine',()=>{
 const {plan}=fixture();assert.throws(()=>plan({effect:'kagezukami',level:7}),/nível|Nível/);
 const capture=plan({effect:'kagezukami',level:9,targets:2,shadowLight:'long',objectShadows:2});
 assert.equal(capture.cost,9);assert.equal(capture.range,34);assert.equal(capture.action,'standard');
 assert.equal(capture.duration,'concentration');assert.equal(capture.active.requiresImmobile,true);
 assert.equal(capture.shadow.mane,false);assert.equal(capture.shadow.pull,true);assert.equal(capture.shadow.binding,true);
 assert.deepEqual(capture.conditions,[]);assert.equal(capture.resistances[0].stat,'for');assert.equal(capture.shadow.turns,2);
});
