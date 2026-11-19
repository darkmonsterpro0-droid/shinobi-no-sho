import test from 'node:test';
import assert from 'node:assert/strict';
import {accelerationProfile,acceleratedOpportunityAllowed,syncAccelerationInitiative} from '../src/acceleration.mjs';
test('acceleration replaces lower ranks and Corpulência suppresses Acelerado without inventing a Super Acelerado prohibition',()=>{
 assert.deepEqual(accelerationProfile([{key:'acelerado'},{key:'acelerado'}]),{rank:1,initiative:2,movementMultiplier:2});
 assert.equal(accelerationProfile([{key:'acelerado'}],{corpulencia:true}).rank,0);
 assert.deepEqual(accelerationProfile([{key:'acelerado'},{key:'superacelerado'}],{corpulencia:true}),{rank:2,initiative:4,movementMultiplier:2});
 assert.equal(accelerationProfile([{key:'superacelerado',disabled:true}]).rank,0);
});
test('opportunity attacks against accelerated movers require the same or a higher acceleration',()=>{
 assert.equal(acceleratedOpportunityAllowed(0,0),true);
 assert.equal(acceleratedOpportunityAllowed(0,1),false);
 assert.equal(acceleratedOpportunityAllowed(1,2),false);
 assert.equal(acceleratedOpportunityAllowed(2,1),true);
});
test('changing acceleration adjusts initiative once without rerolling or changing the acting combatant',async()=>{
 let bonus=2;
 const actor={uuid:'Actor.fast',getRollData:()=>({sns:{accelerationBonus:bonus}})};
 const entry={id:'fast',actor,initiative:10,bonus:0,getFlag(){return this.bonus;}};
 const other={id:'other',actor:{uuid:'Actor.other'},initiative:11};
 const combat={combatants:[entry,other],turns:[other,entry],turn:0,
  get combatant(){return this.turns[this.turn];},
  async updateEmbeddedDocuments(_type,updates){for(const update of updates){entry.initiative=update.initiative;entry.bonus=update['flags.shinobi-no-sho.accelerationBonus'];}this.turns=[entry,other].sort((a,b)=>b.initiative-a.initiative);},
  async update(update,options){assert.equal(options.snsAcceleration,true);this.turn=update.turn;}};
 globalThis.game={combats:[combat]};
 await Promise.all([syncAccelerationInitiative(actor),syncAccelerationInitiative(actor)]);
 assert.equal(entry.initiative,12);assert.equal(combat.combatant.id,'other');
 bonus=4;await syncAccelerationInitiative(actor);assert.equal(entry.initiative,14);
 bonus=0;await syncAccelerationInitiative(actor);assert.equal(entry.initiative,10);assert.equal(combat.combatant.id,'other');
 delete globalThis.game;
});
