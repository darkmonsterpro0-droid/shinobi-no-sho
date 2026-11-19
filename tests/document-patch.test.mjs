import test from 'node:test';
import assert from 'node:assert/strict';
import {replacementPatch} from '../src/core/document-patch.mjs';
import {updateDocument} from './helpers/document-update.mjs';
test('removing runtime entries survives recursive document merging without clearing sibling flags',()=>{
 const actor={flags:{other:{keep:1},system:{runtime:{active:{old:{turn:'t'}},pending:{id:'pill'},history:['kept']},purchases:{keep:true}}}};
 const next={active:{},history:['kept']};
 const patch=replacementPatch(actor.flags.system.runtime,next);
 updateDocument(actor,{'flags.system.runtime':patch});
 assert.deepEqual(actor.flags.system.runtime,next);
 assert.deepEqual(actor.flags.other,{keep:1});assert.deepEqual(actor.flags.system.purchases,{keep:true});
 assert.deepEqual(next,{active:{},history:['kept']});
});
test('v14 runtime patches use native deletion operators when available',()=>{
 const old=globalThis.foundry;
 class ForcedDeletion{}
 globalThis.foundry={data:{operators:{ForcedDeletion}}};
 try{
  const patch=replacementPatch({active:{old:1},pending:{id:'pill'}},{active:{}});
  assert.ok(patch.active.old instanceof ForcedDeletion);
  assert.ok(patch.pending instanceof ForcedDeletion);
  assert.equal(Object.hasOwn(patch,'-=pending'),false);
 }finally{globalThis.foundry=old;}
});
