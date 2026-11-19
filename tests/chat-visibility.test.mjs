import test from 'node:test';
import assert from 'node:assert/strict';
import {createChatMessageClass} from '../src/core/chat-visibility.mjs';
test('concealed rolls have no placeholder for non-recipients and GM views use the complete ledger',()=>{
 class NativeMessage{
  constructor(flags={},whisper=[],roll=true){this.flags=flags;this.whisper=whisper;this.isRoll=roll;}
  getFlag(_namespace,key){return this.flags[key];}
  get isAuthor(){return game.user.id==='author';}
  get visible(){return !this.whisper.length||this.isRoll||this.isAuthor||this.whisper.includes(game.user.id);}
 }
 const Message=createChatMessageClass(NativeMessage,'adapter');
 globalThis.game={user:{id:'other',isGM:false}};
 assert.equal(new Message({},['gm']).visible,true);
 assert.equal(new Message({concealedRoll:true},['gm']).visible,false);
 game.user={id:'gm',isGM:true};assert.equal(new Message({concealedRoll:true},['gm']).visible,true);
 assert.equal(new Message({executionRoot:'ledger'}).visible,false);
 assert.equal(new Message({}).visible,true);
 game.user={id:'owner',isGM:false};assert.equal(new Message({concealedRoll:true},['owner','gm']).visible,true);
 assert.equal(new Message({executionRoot:'ledger'}).visible,true);
 game.user={id:'author',isGM:true};assert.equal(new Message({concealedRoll:true},['gm']).visible,true);
});
