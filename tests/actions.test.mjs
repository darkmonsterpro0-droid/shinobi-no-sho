import test from 'node:test';
import assert from 'node:assert/strict';
import {ID,defaultProfile} from '../src/config.mjs';
import {prepareWeaponAction,weaponCosts,commitWeaponCosts,weaponFingerprint} from '../src/weapon-actions.mjs';
import {saveAction,savedActions,savedDefaults,savedActionsView,savedActionEvent,targetFields} from '../src/saved-actions.mjs';
import {enqueueActionRequest,requestAction,executionCard,registerActionExecutions} from '../src/action-executions.mjs';
import {set} from '../src/ui.mjs';

let serial=0,rolls=[],actors,gm,player,defender,stranger;
function collection(values=[]){values.contents=values;values.get=id=>values.find(x=>x.id===id);return values;}
function patch(doc,data){for(const[k,v]of Object.entries(data)){if(k.includes('.-=')){const parts=k.split('.'),key=parts.pop().slice(2);delete parts.reduce((o,k)=>o[k],doc)[key];}else set(doc,k,structuredClone(v));}}
function setup(){
 serial=0;rolls=[];actors=collection();gm={id:'gm',name:'Mestre',isGM:true,active:true};player={id:'p',name:'Jogador',isGM:false,active:true};defender={id:'d',name:'Defensor',isGM:false,active:true};stranger={id:'x',name:'Outro',isGM:false,active:true};
 globalThis.game={user:gm,users:collection([gm,player,defender,stranger]),messages:collection(),actors,settings:{get:(_id,k)=>k==='profile'?defaultProfile():k==='houseRules'?{}:0},time:{worldTime:0}};
 globalThis.foundry={utils:{randomID:()=>String(++serial)},dice:{Roll:class{
  constructor(formula){this.formula=formula;}async evaluate(){const precision=Number(/\+ \((-?[\d.]+)\)/.exec(this.formula)?.[1]??0);this.total=(rolls.shift()??10)+precision;return this;}
  toJSON(){return {formula:this.formula,total:this.total};}static fromJSON(json){assert.equal(typeof json,'string');const d=JSON.parse(json),r=new this(d.formula);r.total=d.total;return r;}
  async toMessage(data){return ChatMessage.create({...data,rolls:[this.toJSON()]});}
 }}};
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor?.id}),create:async data=>{const m={...structuredClone(data),id:String(++serial),author:game.user,isOwner:true,getFlag(ns,k){return this.flags?.[ns]?.[k];},async update(p){patch(this,p);return this;}};game.messages.push(m);return m;}};
 globalThis.fromUuid=async uuid=>actors.find(a=>a.uuid===uuid);
 globalThis.canvas=undefined;
}
function actor(owner,name='Shinobi'){
 const a={id:String(++serial),name,type:'character',isOwner:true,visible:true,effects:[],flags:{},items:collection(),system:{campaign:{level:12},identity:{},attributes:{for:8,des:8,agi:6,per:5,int:5,vig:6,esp:6},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},physical:{size:'medium'},resources:{vitality:{value:80,max:88},chakra:{value:28,max:28}},conditions:[],skills:{},movement:{distance:13},inventoryState:{},powerState:{},actions:{standard:true,movement:false,partial:true},advancement:{}},testUserPermission(u,level){return u.isGM||level==='OBSERVER'||u.id===owner.id;},getFlag(ns,k){return this.flags[ns]?.[k];},async update(p){patch(this,p);},toObject(){return {id:this.id,name:this.name,type:this.type,system:structuredClone(this.system),flags:structuredClone(this.flags)};}};
 a.uuid='Actor.'+a.id;actors.push(a);return a;
}
function weapon(a,key='kunai',quantity=10){const i={id:String(++serial),name:key,type:'equipment',flags:{},system:{catalogKey:key,catalogBook:'basico',quantity,loaded:true},getFlag(ns,k){return this.flags[ns]?.[k];},async update(p){patch(this,p);}};a.items.push(i);return i;}
function apt(a,key){a.items.push({id:String(++serial),name:key,type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,acquisition:'Concedida'}});}
async function command(user,data){game.user=user;const request=await ChatMessage.create({flags:{[ID]:{actionRequest:data}}});game.user=gm;await enqueueActionRequest(request);return request;}
async function declare(a,w,options={},targets){await command(player,{op:'declare',actorUuid:a.uuid,itemId:w.id,options:{mode:'melee',maneuver:'golpear',distance:1,...options},targets});return game.messages.find(m=>m.getFlag(ID,'actionExecution'));}
const e=m=>m.getFlag(ID,'actionExecution');
async function defense(m,t,strike=0,kind='esquiva',extra={}){return command(defender,{op:'defense',executionId:m.id,targetUuid:t.uuid,strike,kind,...extra});}
async function attack(m){return command(player,{op:'attack',executionId:m.id});}
async function defend(m,t,strike=0,extra={}){return command(defender,{op:'defend',executionId:m.id,targetUuid:t.uuid,strike,...extra});}
async function apply(m,t,strike=0){return command(defender,{op:'apply',executionId:m.id,targetUuid:t.uuid,strike,context:{located:'yes',distance:1,areaFraction:0}});}

test('preparing and saving never spend, roll or change manual action markers; presets recalculate live values',async()=>{
 setup();const a=actor(player),w=weapon(a);apt(a,'ataque-poderoso');const before=structuredClone(a.system.actions),plain=prepareWeaponAction(a,w.id,{mode:'melee',maneuver:'golpear'});
 const saved=await saveAction(a,{name:'Kunai forte',itemId:w.id,options:{mode:'melee',maneuver:'ataque-poderoso',target1:'secret',precision:999,distance:99}});
 assert.equal(savedActions(a).length,1);assert.equal(saved.defaults.precision,undefined);assert.equal(saved.defaults.target1,undefined);assert.equal(saved.defaults.distance,undefined);
 assert.equal(w.system.quantity,10);assert.equal(game.messages.length,0);assert.deepEqual(a.system.actions,before);
 const strong=prepareWeaponAction(a,w.id,saved.defaults);assert.equal(strong.plan.precision,plain.plan.precision-1);assert.equal(strong.plan.base,plain.plan.base+1);
 a.system.attributes.for+=2;assert.equal(prepareWeaponAction(a,w.id,saved.defaults).plan.precision,strong.plan.precision+2);
 const otherController={id:'p2',isGM:false};a.testUserPermission=u=>[player.id,otherController.id].includes(u.id)||u.isGM;assert.equal(savedActions(a)[0].id,saved.id);
});
test('saved actions reject invalid identifiers and remain when a source disappears; editing can choose a replacement explicitly',async()=>{
 setup();const a=actor(player),w=weapon(a);const p=await saveAction(a,{name:'Minha ação',itemId:w.id,options:{mode:'melee'}});
 await assert.rejects(()=>saveAction(a,{id:'__proto__.bad',name:'x',itemId:w.id,options:{}}),/Identificador/);
 a.items.splice(0,1);await assert.rejects(()=>savedActionEvent({},'action-use',{id:p.id},null,{actor:a,show(){}}),/Arma/);assert.equal(savedActions(a).length,1);
 let view;await savedActionEvent({},'action-edit',{id:p.id},null,{actor:a,show:(kind,config)=>{view={kind,config};}});assert.equal(view.config.itemId,w.id);
 assert.match(savedActionsView(a,{all:true}),/Minha ação/);assert.throws(()=>savedDefaults({count:Infinity}));
});
test('editing once does not mutate the stored action; duplicate and favorite operate on the shared record',async()=>{
 setup();const a=actor(player),w=weapon(a),p=await saveAction(a,{name:'Teste',itemId:w.id,options:{mode:'melee'}}),app={render(){}};let config;
 await savedActionEvent(app,'action-once',{id:p.id},null,{actor:a,show:(_kind,c)=>{config=c;}});assert.equal(config.presetId,undefined);
 await savedActionEvent(app,'action-duplicate',{id:p.id},null,{actor:a});assert.equal(savedActions(a).length,2);
 await savedActionEvent(app,'action-favorite',{id:p.id},null,{actor:a});assert.equal(savedActions(a).find(x=>x.id===p.id).favorite,false);
});
test('cost receipts resume a partially initiated action without another projectile charge',async()=>{
 setup();const a=actor(player),w=weapon(a),p=prepareWeaponAction(a,w.id,{mode:'ranged',units:3,distance:5});const costs=weaponCosts(p,a);
 assert.equal(w.system.quantity,10);await commitWeaponCosts(a,costs,'exec');assert.equal(w.system.quantity,7);await commitWeaponCosts(a,costs,'exec');assert.equal(w.system.quantity,7);
 w.system.quantity=6;await assert.rejects(()=>commitWeaponCosts(a,costs,'other'),/material mudou/);
});
test('attacks require every defense before dice; cancellation is free; stale preparation is rejected',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a);let m=await declare(a,w,{},[[t.uuid]]);
 await assert.rejects(()=>attack(m),/declarações/);assert.equal(e(m).rolls[0],undefined);assert.equal(w.system.quantity,10);
 await defense(m,t);a.system.attributes.for++;await assert.rejects(()=>attack(m),/mudaram/);assert.equal(e(m).started,false);
 await command(player,{op:'cancel',executionId:m.id});assert.equal(e(m).state,'cancelled');assert.equal(w.system.quantity,10);
});
test('defender and GM can declare; an attacker or stranger cannot choose for another character',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),m=await declare(a,w,{},[[t.uuid]]);
 await assert.rejects(()=>command(player,{op:'defense',executionId:m.id,strike:0,targetUuid:t.uuid,kind:'esquiva'}),/controlador/);
 await assert.rejects(()=>command(stranger,{op:'attack',executionId:m.id}),/controla/);
 await command(gm,{op:'defense',executionId:m.id,strike:0,targetUuid:t.uuid,kind:'esquiva'});assert.equal(e(m).slots[0].defense.by,'gm');
});
test('dodge uses a fixed difficulty and applying is explicit, idempotent and leaves action markers alone',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),before=structuredClone(a.system.actions),m=await declare(a,w,{},[[t.uuid]]);
 await defense(m,t);rolls=[10];await attack(m);assert.equal(e(m).rolls[0].total,21);assert.equal(t.system.resources.vitality.value,80);
 await defend(m,t);assert.equal(e(m).slots[0].result.hit,true);assert.equal(e(m).slots[0].defenseRoll,undefined);
 await apply(m,t);assert.equal(t.system.resources.vitality.value,70);assert.equal(e(m).state,'complete');assert.deepEqual(a.system.actions,before);
 await assert.rejects(()=>apply(m,t),/encerrada/);assert.equal(t.system.resources.vitality.value,70);
});
test('one giratorio roll waits for all targets and never applies before all defenses resolve',async()=>{
 setup();const a=actor(player),t=actor(defender),u=actor(defender),w=weapon(a);apt(a,'ataque-giratorio');const m=await declare(a,w,{maneuver:'ataque-giratorio'},[[t.uuid,u.uuid]]);
 await defense(m,t);await assert.rejects(()=>attack(m),/declarações/);await defense(m,u);rolls=[10];await attack(m);assert.equal(Object.keys(e(m).rolls).length,1);
 await defend(m,t);await assert.rejects(()=>apply(m,t),/todas as defesas/);await defend(m,u);await apply(m,t);await apply(m,u);assert.equal(t.system.resources.vitality.value,70);assert.equal(u.system.resources.vitality.value,70);
});
test('multiple attacks have individual declared targets and defenses and preserve total divided damage',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a);apt(a,'ataque-multiplo');const m=await declare(a,w,{maneuver:'ataque-multiplo',count:2},[[t.uuid],[t.uuid]]);
 await defense(m,t,0);await defense(m,t,1);rolls=[10,10];await attack(m);await assert.rejects(()=>attack(m),/golpe anterior/);await defend(m,t,0);await apply(m,t,0);await attack(m);await defend(m,t,1);await apply(m,t,1);assert.equal(t.system.resources.vitality.value,70);assert.equal(e(m).state,'complete');
});
test('declaring a ranged sequence consumes ammunition once only when initiated',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a);apt(a,'ataque-multiplo');const m=await declare(a,w,{mode:'ranged',units:3,maneuver:'ataque-multiplo',count:2,distance:5},[[t.uuid],[t.uuid]]);
 assert.equal(w.system.quantity,10);await defense(m,t,0);await defense(m,t,1);rolls=[10,10];await attack(m);assert.equal(w.system.quantity,7);await defend(m,t,0);await apply(m,t,0);await attack(m);assert.equal(w.system.quantity,7);
});
test('opposed defense is rolled after attacker and uses the existing opposed resolver',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),shield=weapon(t),m=await declare(a,w,{},[[t.uuid]]);await defense(m,t,0,'bloqueio',{weaponId:shield.id});rolls=[10,11];await attack(m);await defend(m,t);assert.equal(e(m).slots[0].result.hit,false);assert.equal(e(m).slots[0].defenseRoll.natural,11);assert.equal(e(m).state,'complete');
});
test('a technique is declared before dice and its effect is confirmed without charging a second cost',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a);t.items.push({id:'jutsu',name:'Defesa da ficha',type:'technique',system:{}});const m=await declare(a,w,{},[[t.uuid]]);await defense(m,t,0,'technique',{techniqueId:'jutsu'});await assert.rejects(()=>attack(m),/declarações/);await command(defender,{op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid});rolls=[10,14];await attack(m);await assert.rejects(()=>defend(m,t),/executada a tempo/);assert.equal(e(m).slots[0].defenseRoll.natural,14);await defend(m,t,0,{techniqueStopped:true});assert.equal(e(m).state,'complete');assert.equal(t.system.resources.chakra.value,28);
});
test('a failed chat post after persisted attack dice can resume without rerolling or paying again',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),m=await declare(a,w,{mode:'ranged',units:3,distance:5},[[t.uuid]]);await defense(m,t);rolls=[10,3];
 const create=ChatMessage.create;ChatMessage.create=async data=>{if(data.flags?.[ID]?.weaponAttack)throw Error('Falha de rede simulada');return create(data);};await assert.rejects(()=>attack(m),/rede/);assert.equal(w.system.quantity,7);assert.ok(e(m).attackDice[0]);
 ChatMessage.create=create;await attack(m);assert.equal(e(m).rolls[0].natural,10);assert.equal(w.system.quantity,7);assert.deepEqual(rolls,[3]);
});
test('two queued attack requests cannot roll the same strike twice',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),m=await declare(a,w,{},[[t.uuid]]);await defense(m,t);rolls=[10,3];
 const r1=await ChatMessage.create({flags:{[ID]:{actionRequest:{op:'attack',executionId:m.id}}}}),r2=await ChatMessage.create({flags:{[ID]:{actionRequest:{op:'attack',executionId:m.id}}}});
 const results=await Promise.allSettled([enqueueActionRequest(r1),enqueueActionRequest(r2)]);assert.deepEqual(results.map(r=>r.status),['fulfilled','rejected']);assert.deepEqual(rolls,[3]);
});
test('replaying a native declaration request does not create another execution',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a);const request=await command(player,{op:'declare',actorUuid:a.uuid,itemId:w.id,options:{mode:'melee'},targets:[[t.uuid]]});await enqueueActionRequest(request);assert.equal(game.messages.filter(m=>m.getFlag(ID,'actionExecution')).length,1);
});
test('target selectors preserve choices and escape names; no GM means no request or spend',async()=>{
 setup();const html=targetFields({options:{maneuver:'ataque-multiplo',count:2},values:{'weapon.target1':'Actor.1'},attackTargets:[{uuid:'Actor.1',name:'<script>'}]});assert.match(html,/name="weapon.target2"/);assert.match(html,/selected/);assert.ok(!html.includes('<script>'));
 game.users.splice(0,1);await assert.rejects(()=>requestAction({op:'declare'}),/mestre/);assert.equal(game.messages.length,0);
});

test('an opposed tie repeats only that confrontation, retaining the shared attack and other target results',async()=>{
 setup();const a=actor(player),t=actor(defender),u=actor(defender),w=weapon(a),shield=weapon(t);apt(a,'ataque-giratorio');const m=await declare(a,w,{maneuver:'ataque-giratorio'},[[t.uuid,u.uuid]]);
 await defense(m,t,0,'bloqueio',{weaponId:shield.id});await defense(m,u);rolls=[10,10];await attack(m);await defend(m,u);await assert.rejects(()=>defend(m,t),/Empate/);assert.equal(e(m).slots[0].tiePending,true);const original=e(m).rolls[0].total;
 rolls=[11,9];await command(defender,{op:'repeat',executionId:m.id,strike:0,targetUuid:t.uuid});assert.equal(e(m).rolls[0].total,original);assert.equal(e(m).slots[1].result.hit,true);assert.equal(e(m).slots[0].result.hit,true);await apply(m,t);await apply(m,u);assert.equal(e(m).state,'complete');
});
test('Chute Duplo preserves the table bonus after division and earns second-hit accuracy only after a hit',async()=>{
 setup();const a=actor(player),t=actor(defender);apt(a,'chute-duplo');const m=await declare(a,{id:'unarmed'},{maneuver:'chute-duplo',mode:'melee'},[[t.uuid],[t.uuid]]);
 const first=e(m).attacks[0];assert.equal(first.postDivisionBonus,2);assert.equal(e(m).attacks[1].postDivisionBonus,0);
 await defense(m,t,0);await defense(m,t,1);rolls=[10,10];await attack(m);await defend(m,t,0);await apply(m,t,0);const initial=e(m).attacks[1].precision;await attack(m);assert.equal(e(m).rolls[1].precision,initial+1);
});
test('a critical and a natural failure respect declared defenses without inventing defender rolls',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),m=await declare(a,w,{},[[t.uuid]]);await defense(m,t);rolls=[15];await attack(m);assert.equal(e(m).slots[0].result.hit,true);assert.equal(e(m).slots[0].defenseRoll,undefined);await apply(m,t);
 const m2Before=game.messages.length;await command(player,{op:'declare',actorUuid:a.uuid,itemId:w.id,options:{mode:'melee'},targets:[[t.uuid]]});const m2=game.messages.slice(m2Before).find(m=>m.getFlag(ID,'actionExecution'));await defense(m2,t);rolls=[3];await attack(m2);assert.equal(e(m2).state,'complete');assert.equal(e(m2).slots[0].result.hit,false);
});
test('disabled source books and unauthorized preset writes are rejected without deleting old data',async()=>{
 setup();const a=actor(player),w=weapon(a),p=await saveAction(a,{name:'Preservar',itemId:w.id,options:{mode:'melee'}});game.settings.get=(_ns,k)=>k==='profile'?{books:[]}:{};
 assert.throws(()=>prepareWeaponAction(a,w.id,{}),/livro/);assert.equal(savedActions(a)[0].id,p.id);a.isOwner=false;await assert.rejects(()=>saveAction(a,{name:'x',itemId:w.id}),/configurar/);
});

test('manual exceptions and interruption are explicit GM operations and never restore spent projectiles',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),m=await declare(a,w,{mode:'ranged',distance:5,units:3},[[t.uuid]]);
 await assert.rejects(()=>defense(m,t,0,'manual'),/mestre/);
 await command(gm,{op:'defense',executionId:m.id,strike:0,targetUuid:t.uuid,kind:'manual'});rolls=[10];await attack(m);await command(gm,{op:'defend',executionId:m.id,strike:0,targetUuid:t.uuid,manualHit:true});
 await assert.rejects(()=>command(player,{op:'interrupt',executionId:m.id}),/mestre/);await command(gm,{op:'interrupt',executionId:m.id});assert.equal(e(m).state,'interrupted');assert.equal(w.system.quantity,7);assert.equal(t.system.resources.vitality.value,80);
});
test('a critical on a repeated confrontation never rolls the defender again',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),shield=weapon(t),m=await declare(a,w,{},[[t.uuid]]);await defense(m,t,0,'bloqueio',{weaponId:shield.id});rolls=[10,10];await attack(m);await assert.rejects(()=>defend(m,t),/Empate/);rolls=[15,7];await command(defender,{op:'repeat',executionId:m.id,strike:0,targetUuid:t.uuid});assert.equal(e(m).slots[0].result.hit,true);assert.deepEqual(rolls,[7]);
});
test('saved direct use measures a selected simple token rather than assuming one metre',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a),p=await saveAction(a,{name:'Arremesso',itemId:w.id,options:{mode:'ranged',units:3}});
 const token={actor:a,center:{x:0,y:0},document:{width:1,height:1,elevation:0}},target={actor:t,center:{x:300,y:0},document:{width:1,height:1,elevation:0}};
 game.user=player;game.user.targets=new Set([target]);globalThis.canvas={tokens:{placeables:[token,target],controlled:[token]},grid:{measurePath:()=>({distance:3})}};
 await savedActionEvent({},'action-use',{id:p.id},null,{actor:a,show(){throw Error('Uma configuração repetida foi aberta');}});
 const request=game.messages.find(m=>m.getFlag(ID,'actionRequest'));assert.equal(request.getFlag(ID,'actionRequest').options.distance,3);assert.equal(w.system.quantity,10);
});
test('a saved sweep asks for the complete affected set even with one selected target',async()=>{
 setup();const a=actor(player),t=actor(defender),w=weapon(a);apt(a,'ataque-giratorio');const p=await saveAction(a,{name:'Giratório',itemId:w.id,options:{maneuver:'ataque-giratorio',mode:'melee'}});
 const token={actor:a,center:{x:0,y:0},document:{width:1,height:1,elevation:0}},target={actor:t,center:{x:1,y:0},document:{width:1,height:1,elevation:0}};game.user=player;game.user.targets=new Set([target]);globalThis.canvas={tokens:{controlled:[token],placeables:[token,target]},grid:{measurePath:()=>({distance:1})}};
 const shown=[];await savedActionEvent({},'action-use',{id:p.id},null,{actor:a,show:(kind,config)=>shown.push({kind,config})});assert.equal(shown[0].kind,'action-targets');assert.equal(game.messages.length,0);assert.equal(w.system.quantity,10);
});
test('a newly elected GM can recover pending native requests visible to all GMs',async()=>{
 setup();const gm2={id:'gm2',name:'Outro mestre',isGM:true,active:false};game.users.push(gm2);const a=actor(player),t=actor(defender),w=weapon(a);game.user=player;
 const request=await requestAction({op:'declare',actorUuid:a.uuid,itemId:w.id,options:{mode:'melee',distance:1},targets:[[t.uuid]]});assert.ok(request.whisper.includes(gm.id));assert.ok(request.whisper.includes(gm2.id));
 gm.active=false;gm2.active=true;game.user=gm2;const hooks=new Map();globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn),once:(name,fn)=>hooks.set(name,fn)};globalThis.ui={notifications:{error:err=>assert.fail(err)}};registerActionExecutions();hooks.get('userConnected')();await new Promise(r=>setImmediate(r));
 assert.equal(request.getFlag(ID,'actionRequestDone'),true);assert.equal(game.messages.filter(m=>m.getFlag(ID,'actionExecution')).length,1);hooks.get('userConnected')();await new Promise(r=>setImmediate(r));assert.equal(game.messages.filter(m=>m.getFlag(ID,'actionExecution')).length,1);
});
