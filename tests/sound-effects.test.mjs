import test from 'node:test';
import assert from 'node:assert/strict';
import {immuneToSound} from '../src/sound-effects.mjs';
test('Nikudan sonic immunity belongs to its attacker and ends with its execution',()=>{
 const actor={uuid:'Actor.akimichi',system:{}},execution={actorUuid:actor.uuid,state:'declared',attacks:[{immuneSound:true}]};
 const message={getFlag:()=>execution};
 assert.equal(immuneToSound(actor,[message]),true);
 assert.equal(immuneToSound({uuid:'Actor.other',system:{}},[message]),false);
 execution.state='complete';assert.equal(immuneToSound(actor,[message]),false);
 execution.state='cancelled';assert.equal(immuneToSound(actor,[message]),false);
});
