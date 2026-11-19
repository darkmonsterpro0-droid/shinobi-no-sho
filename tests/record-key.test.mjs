import test from 'node:test';
import assert from 'node:assert/strict';
import {recordKey,readKeyedRecord} from '../src/core/record-key.mjs';
test('opaque receipt keys survive dot expansion, retain percent distinctions and read legacy paths',()=>{
 const id='ChatMessage.attack:Actor.target',result={complete:true};
 assert.ok(!recordKey(id).includes('.'));
 assert.notEqual(recordKey('Actor.x'),recordKey('Actor%2Ex'));
 assert.equal(readKeyedRecord({[recordKey(id)]:result},id),result);
 assert.equal(readKeyedRecord({ChatMessage:{'attack:Actor':{target:result}}},id),result);
 assert.equal(readKeyedRecord({},'constructor.prototype'),undefined);
});
