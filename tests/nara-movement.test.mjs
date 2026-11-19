import test from 'node:test';
import assert from 'node:assert/strict';
import {ID} from '../src/config.mjs';
import {onShadowMovement} from '../src/nara-movement.mjs';
import {updateDocument} from './helpers/document-update.mjs';
function fixture(){
 const actor=id=>({id,uuid:'Actor.'+id,name:id,isOwner:true,flags:{},system:{actions:{standard:false,movement:true},powerState:{active:[]}},
  getFlag(ns,key){return this.flags[ns]?.[key];},async update(data){updateDocument(this,data);}});
 const source=actor('source'),victim=actor('victim'),actors=[source,victim],messages=[];
 const scene={id:'scene',grid:{isSquare:true,size:100,measurePath:([a,b])=>({distance:Math.hypot(b.x-a.x,b.y-a.y)/100})},tokens:[]};
 const token=(id,actor,x,y=0)=>({id,uuid:'Scene.scene.Token.'+id,name:actor.name,actor,parent:scene,x,y,elevation:0,width:1,height:1,moves:[],
  object:{checkCollision:()=>false},getCenterPoint(p=this){return {x:p.x+50,y:p.y+50};},getSize:()=>({width:100,height:100}),
  async move(path,options){this.moves.push({path,options});Object.assign(this,path.at(-1));return true;}});
 const origin=token('source',source,100),target=token('victim',victim,300);scene.tokens=[origin,target];
 source.system.powerState.active=[{id:'root',sourceUuid:source.uuid,sourceTokenUuid:origin.uuid,shadowSource:true,plan:{range:20,shadow:{mane:true}}}];
 victim.system.powerState.active=[{id:'bound',sourceUuid:source.uuid,linkedTo:'root',tokenUuid:target.uuid,shadowBinding:{turns:5},plan:{shadow:{mane:true}}}];
 globalThis.game={user:{id:'gm',isGM:true},actors,scenes:[scene],messages,users:[{id:'gm',isGM:true}]};
 globalThis.ChatMessage={create:async data=>{const m={...data,getFlag:(ns,key)=>data.flags?.[ns]?.[key]};messages.push(m);return m;}};
 const ended=[],services={endPower:async(a,id)=>{ended.push([a.uuid,id]);a.system.powerState.active=a.system.powerState.active.filter(p=>p.id!==id);for(const other of actors)other.system.powerState.active=other.system.powerState.active.filter(p=>p.linkedTo!==id);}};
 const movement={id:'move',subpathId:'one',origin:{x:0,y:0,elevation:0},destination:{x:100,y:0,elevation:0},animation:{duration:120}};
 return {source,victim,scene,origin,target,services,ended,movement,actor,token,messages};
}
test('Mane translates the actual path once, preserves selection/action markers and reuses the native animation duration',async()=>{
 const f=fixture(),markers=structuredClone(f.victim.system.actions);f.origin.y=50;
 f.movement.passed={waypoints:[{x:50,y:0,elevation:0},{x:50,y:50,elevation:0}]};f.movement.destination.y=50;
 await Promise.all([onShadowMovement(f.origin,f.movement,f.services),onShadowMovement(f.origin,f.movement,f.services)]);
 assert.equal(f.target.x,400);assert.equal(f.target.y,50);assert.equal(f.target.moves.length,1);
 assert.deepEqual(f.target.moves[0].path.map(p=>[p.x,p.y]),[[350,0],[350,50],[400,50]]);
 assert.equal(f.target.moves[0].options.animation.duration,120);assert.equal(f.target.moves[0].options.pan,false);
 assert.deepEqual(f.victim.system.actions,markers);assert.equal(f.messages.length,0);
});
test('Shibari ends on caster movement and a separately moved Mane victim is released beyond reach',async()=>{
 let f=fixture();f.source.system.powerState.active[0].requiresImmobile=true;f.source.system.powerState.active[0].plan.shadow.mane=false;
 await onShadowMovement(f.origin,f.movement,f.services);assert.equal(f.source.system.powerState.active.length,0);assert.equal(f.target.moves.length,0);
 f=fixture();f.target.x=3000;
 await onShadowMovement(f.target,{id:'forced',origin:{x:300,y:0,elevation:0},destination:{x:3000,y:0,elevation:0}},f.services);
 assert.equal(f.victim.system.powerState.active.length,0);assert.equal(f.source.system.powerState.active.length,1);
});
test('native passed waypoints do not repeat the destination and an arrived victim needs no interruption warning',async()=>{
 const f=fixture();
 f.movement.passed={waypoints:[{x:0,y:0,elevation:0},{x:100,y:0,elevation:0}]};
 const move=f.target.move.bind(f.target);f.target.move=async(...args)=>{await move(...args);return false;};
 await onShadowMovement(f.origin,f.movement,f.services);
 assert.deepEqual(f.target.moves[0].path,[{x:400,y:0,elevation:0}]);
 assert.equal(f.target.x,400);assert.equal(f.messages.length,0);
 await onShadowMovement(f.origin,f.movement,f.services);assert.equal(f.target.moves.length,1);
});
test('a native move that fails to arrive is still referred to the GM once',async()=>{
 const f=fixture();f.target.move=async()=>false;
 await onShadowMovement(f.origin,f.movement,f.services);await onShadowMovement(f.origin,f.movement,f.services);
 assert.equal(f.target.x,300);assert.equal(f.messages.length,1);assert.deepEqual(f.messages[0].whisper,['gm']);
});
test('arrival uses the current scene document when Foundry replaces the moved token instance',async()=>{
 const f=fixture(),stale=f.target;
 stale.move=async path=>{f.scene.tokens=f.scene.tokens.map(t=>t===stale?{...t,...path.at(-1)}:t);return true;};
 await onShadowMovement(f.origin,f.movement,f.services);
 assert.equal(stale.x,300);assert.equal(f.scene.tokens[1].x,400);assert.equal(f.messages.length,0);
});
test('a wall, occupied arrival or elevation change asks only the GM to adjust the imitation without phasing the victim',async()=>{
 for(const kind of ['wall','occupied','elevation']){
  const f=fixture();if(kind==='wall')f.target.object.checkCollision=()=>true;
  if(kind==='occupied')f.scene.tokens.push(f.token('obstacle',f.actor('obstacle'),400));
  if(kind==='elevation')f.movement.destination.elevation=5;
  await onShadowMovement(f.origin,f.movement,f.services);await onShadowMovement(f.origin,f.movement,f.services);
  assert.equal(f.target.x,300);assert.equal(f.target.moves.length,0);assert.equal(f.messages.length,1);assert.deepEqual(f.messages[0].whisper,['gm']);
 }
});
test('resuming after a completed native move whose receipt write failed does not translate the victim a second time',async()=>{
 const f=fixture(),move=f.target.move.bind(f.target);let fail=true;
 f.target.move=async(...args)=>{await move(...args);if(fail){fail=false;throw Error('interrompido');}return true;};
 await assert.rejects(onShadowMovement(f.origin,f.movement,f.services),/interrompido/);
 assert.equal(f.target.x,400);await onShadowMovement(f.origin,f.movement,f.services);
 assert.equal(f.target.moves.length,1);assert.equal(f.target.x,400);
});
test('several victims vacate cells in movement order and a blocked leader does not permit another victim to overlap it',async()=>{
 for(const blocked of [false,true]){
  const f=fixture(),other=f.actor('other'),front=f.token('front',other,400);game.actors.push(other);f.scene.tokens.push(front);
  other.system.powerState.active=[{id:'front-bound',sourceUuid:f.source.uuid,linkedTo:'root',tokenUuid:front.uuid,shadowBinding:{turns:5},plan:{shadow:{mane:true}}}];
  front.object.checkCollision=()=>blocked;
  await onShadowMovement(f.origin,f.movement,f.services);
  assert.equal(front.x,blocked?400:500);assert.equal(f.target.x,blocked?300:400);
  assert.equal(front.moves.length,blocked?0:1);assert.equal(f.target.moves.length,blocked?0:1);
 }
});
test('the guided ally moves freely, and leaving the shadow range from either end releases the weak link',async()=>{
 for(const movingSource of [false,true]){
  const f=fixture(),root=f.source.system.powerState.active[0];
  root.shadowGuided={allyUuid:f.victim.uuid,allyTokenUuid:f.target.uuid};
  f.victim.system.powerState.active=[{id:'guide',sourceUuid:f.source.uuid,linkedTo:root.id,tokenUuid:f.target.uuid,shadowGuidedLink:true}];
  await onShadowMovement(f.origin,f.movement,f.services);
  assert.equal(f.target.moves.length,0);assert.equal(f.messages.length,0);
  const mover=movingSource?f.origin:f.target;mover.x=4000;
  await onShadowMovement(mover,{id:'out-of-range',origin:{x:300,y:0,elevation:0},destination:{x:4000,y:0,elevation:0}},f.services);
  assert.equal(f.source.system.powerState.active.length,0);assert.equal(f.victim.system.powerState.active.length,0);
 }
});

test('Foundry animated prepared coordinates do not misreport a completed persisted arrival',async()=>{
 const f=fixture();let saved={x:f.target.x,y:f.target.y,elevation:0};
 f.target.toObject=()=>({...saved});f.target.move=async path=>{f.target.moves.push(path);saved={...path.at(-1)};return true;};
 await onShadowMovement(f.origin,f.movement,f.services);assert.equal(f.target.x,300);assert.equal(saved.x,400);
 assert.equal(f.messages.length,0);await onShadowMovement(f.origin,f.movement,f.services);assert.equal(f.target.moves.length,1);
});
