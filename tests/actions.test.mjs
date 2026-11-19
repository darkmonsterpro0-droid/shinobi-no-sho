import {updateDocument} from './helpers/document-update.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ID,defaultProfile} from '../src/config.mjs';
import {prepareWeaponAction,weaponCosts,commitWeaponCosts,weaponFingerprint} from '../src/weapon-actions.mjs';
import {saveAction,savedActions,savedDefaults,savedActionsView,savedActionEvent,targetFields} from '../src/saved-actions.mjs';
import {enqueueActionRequest,requestAction,executionCard,registerActionExecutions,bindActionExecution} from '../src/action-executions.mjs';
import {set} from '../src/ui.mjs';

let serial=0,rolls=[],actors,gm,player,defender,stranger;
test('partner damage declaration is shared, authorized and frozen before weapon defense',async()=>{
 setup();const a=actor(player),animal=actor(player),target=actor(defender),w=weapon(a);
 animal.flags[ID]={companion:{schemaVersion:1,origin:a.uuid,slot:0}};
 await assert.rejects(command(stranger,{op:'partner-plan',actorUuid:a.uuid,divisor:2}),/controla/);
 await assert.rejects(declare(a,w,{},[[target.uuid]]),/divisor/);
 await command(player,{op:'partner-plan',actorUuid:animal.uuid,divisor:2});
 const m=await declare(a,w,{},[[target.uuid]]);assert.equal(e(m).attacks[0].partnerDivisor,2);
 await defense(m,target);rolls=[10];await attack(m);await defend(m,target);await apply(m,target);
 assert.equal(e(m).state,'complete');assert.equal(e(m).slots[0].applied.damage,6);
});
test('table can allow declared defenses against a critical without changing critical damage degree',async()=>{
 setup();
 game.settings.get=(_ns,key)=>key==='profile'?defaultProfile():key==='houseRules'?{criticalSkipsDefense:false}:0;
 const a=actor(player),t=actor(defender),w=weapon(a);
 t.system.attributes.agi=40;
 const m=await declare(a,w,{},[[t.uuid]]);await defense(m,t);
 rolls=[15];await attack(m);await defend(m,t);
 assert.equal(e(m).rolls[0].critical,true);
 assert.equal(e(m).rolls[0].degree,4);
 assert.equal(e(m).slots[0].result.hit,false);
});
test('Nikudan shared execution waits for defense, deals corporal damage and rolls target Vigor once',async()=>{
 setup();
 const {powerPlan}=await import('../src/power-rules.mjs');
 const a=actor(player),t=actor(defender);
 a.system.identity={clan:'Akimichi'};
 for(const suffix of ['corpulencia','resiliencia']){
  const key='res-basico-'+suffix;
  a.items.push({id:String(++serial),type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,
   capabilityData:{schemaVersion:1,definitionId:key,accessOrigin:'akimichi'}}});
 }
 a.items.push({id:String(++serial),type:'aptitude',system:{catalogKey:'lutador',catalogBook:'basico',level:1}});
 const item={id:String(++serial),name:'Baika Ninpou',type:'power',system:{level:2,powerData:{family:'baika-ninpou'}}};a.items.push(item);
 const plan=powerPlan(item,a.system,a.items,{effect:'nikudan'},{actor:a,books:['basico']});
 a.system.powerState.executions={nikudan:{plan,options:{id:item.id,targetUuid:t.uuid,distance:1}}};
 const start=game.messages.length;
 await command(player,{op:'declare-power',actorUuid:a.uuid,itemId:item.id,powerExecutionId:'nikudan',quickResolution:true});
 const m=game.messages.slice(start).find(m=>m.getFlag(ID,'actionExecution'));
 assert.ok(m);assert.equal(e(m).started,false);
 assert.equal(game.messages.slice(start).some(m=>m.getFlag(ID,'powerAttack')),false);
 rolls=[12,4];await defense(m,t);
 assert.equal(e(m).state,'complete');
 assert.ok(t.system.resources.vitality.value<80);
 assert.ok(t.effects.some(effect=>effect.flags[ID].condition.key==='caido'));
 assert.deepEqual(rolls,[]);
 const vitality=t.system.resources.vitality.value;
 await command(player,{op:'declare-power',actorUuid:a.uuid,itemId:item.id,powerExecutionId:'nikudan',quickResolution:true});
 assert.equal(t.system.resources.vitality.value,vitality);
});
function collection(values=[]){values.contents=values;values.get=id=>values.find(x=>x.id===id);return values;}
const patch=updateDocument;
function setup(){
 serial=0;rolls=[];actors=collection();gm={id:'gm',name:'Mestre',isGM:true,active:true};player={id:'p',name:'Jogador',isGM:false,active:true};defender={id:'d',name:'Defensor',isGM:false,active:true};stranger={id:'x',name:'Outro',isGM:false,active:true};
 globalThis.game={user:gm,users:collection([gm,player,defender,stranger]),messages:collection(),actors,settings:{get:(_id,k)=>k==='profile'?defaultProfile():k==='houseRules'?{}:0},time:{worldTime:0}};
 globalThis.foundry={utils:{randomID:()=>String(++serial)},dice:{Roll:class{
  constructor(formula){this.formula=formula;}async evaluate(){const precision=Number(/\+ \((-?[\d.]+)\)/.exec(this.formula)?.[1]??0);this.total=(rolls.shift()??10)+precision;return this;}
  toJSON(){return {formula:this.formula,total:this.total};}static fromJSON(json){assert.equal(typeof json,'string');const d=JSON.parse(json),r=new this(d.formula);r.total=d.total;return r;}
  async toMessage(data,{messageMode='public'}={}){
   // Foundry 14 Roll.toMessage applies the mode after merging message data:
   // the public mode clears an explicit whisper unless gm/blind is requested.
   const next=structuredClone(data);if(messageMode==='public')next.whisper=[];
   return ChatMessage.create({...next,rolls:[this.toJSON()]});
  }
 }}};
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor?.id}),create:async data=>{const m={...structuredClone(data),id:String(++serial),author:game.user,isOwner:true,getFlag(ns,k){return this.flags?.[ns]?.[k];},async update(p){patch(this,p);return this;}};game.messages.push(m);return m;}};
 globalThis.fromUuid=async uuid=>actors.find(a=>a.uuid===uuid);
 globalThis.canvas=undefined;
}
function actor(owner,name='Shinobi'){
 const a={id:String(++serial),name,type:'character',isOwner:true,visible:true,effects:collection(),flags:{},items:collection(),system:{campaign:{level:12},identity:{},attributes:{for:8,des:8,agi:6,per:5,int:5,vig:6,esp:6},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},physical:{size:'medium'},resources:{vitality:{value:80,max:88},chakra:{value:28,max:28}},conditions:[],skills:{},movement:{distance:13},inventoryState:{},powerState:{},actions:{standard:true,movement:false,partial:true},advancement:{}},testUserPermission(u,level){return u.isGM||level==='OBSERVER'||u.id===owner.id;},getFlag(ns,k){return this.flags[ns]?.[k];},async update(p){patch(this,p);},toObject(){return {id:this.id,name:this.name,type:this.type,system:structuredClone(this.system),flags:structuredClone(this.flags)};}};
 a.createEmbeddedDocuments=async(type,entries)=>{
  assert.equal(type,'ActiveEffect');
  const effects=entries.map(data=>({...structuredClone(data),id:String(++serial),
   async update(p){patch(this,p);},async delete(){await a.deleteEmbeddedDocuments('ActiveEffect',[this.id]);}}));
  a.effects.push(...effects);
  return effects;
 };
 a.deleteEmbeddedDocuments=async(type,ids)=>{
  assert.equal(type,'ActiveEffect');
  for(const id of ids){const index=a.effects.findIndex(e=>e.id===id);if(index!==-1)a.effects.splice(index,1);}
 };
 a.uuid='Actor.'+a.id;actors.push(a);return a;
}
function weapon(a,key='kunai',quantity=10){const i={id:String(++serial),name:key,type:'equipment',flags:{},system:{catalogKey:key,catalogBook:'basico',quantity,loaded:true},getFlag(ns,k){return this.flags[ns]?.[k];},async update(p){patch(this,p);}};a.items.push(i);return i;}
function apt(a,key){a.items.push({id:String(++serial),name:key,type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,acquisition:'Concedida'}});}
function mentalNetworkSetup(){
 setup();const source=actor(player,'Yamanaka'),targets=[actor(defender,'Aliado'),actor(defender,'Capanga'),actor(defender,'Resiste'),actor(defender,'Conecta')];
 source.system.identity.clan='Yamanaka';source.system.campaign.level=20;source.system.attributes.int=8;
 const item={id:'mind',type:'power',name:'Shindenshin',system:{level:8,powerData:{family:'shindenshin'}}};source.items.push(item);
 const tokens=collection([source,...targets].map((actor,i)=>({id:'mind'+i,actor,x:i,y:0,elevation:0,width:1,height:1})));
 const grid={isSquare:true,size:1,getOffsetRange:b=>[0,b.x,1,b.x+b.width],getCenterPoint:({i,j})=>({x:j+.5,y:i+.5}),measurePath:([a,b])=>({distance:Math.abs(a.x-b.x)})};
 game.scenes=collection([{id:'mind-map',tokens,grid}]);player.viewedScene='mind-map';
 const data={op:'mental-network',actorUuid:source.uuid,itemId:item.id,sceneId:'mind-map',sourceTokenId:'mind0',
  executionId:'network',options:{level:8,knownOrVisible:true},targets:tokens.slice(1).map((t,i)=>({tokenId:t.id,voluntary:i===0,capanga:i===1}))};
 return {source,targets,item,data,tokens};
}

test('Yamanaka network shares cost, resolves individual resistance and preserves access through resumable cleanup',async()=>{
 const {source,targets,data}=mentalNetworkSetup();rolls=[15,4,7];
 await command(player,data);assert.equal(source.system.resources.chakra.value,20);
 assert.equal(source.system.powerState.active[0].duration,'concentration');
 assert.deepEqual(targets.map(a=>a.system.powerState.active.some(p=>p.mentalNetworkLink)),[true,true,false,true]);
 assert.deepEqual(rolls,[7]);assert.ok(targets.every(a=>a.system.resources.vitality.value===80));
 assert.ok(targets.every(a=>!a.testUserPermission(player,'OWNER')));
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'kind')==='power-resistance').length,2);
 await command(player,data);assert.equal(source.system.resources.chakra.value,20);assert.deepEqual(rolls,[7]);
 const {maintainPower,endPower}=await import('../src/power-actions.mjs');await maintainPower(source,'network');
 assert.equal(source.system.resources.chakra.value,20);
 const nativeUpdate=targets[0].update;let fail=true;targets[0].update=async p=>{if(fail&&p['system.powerState']){fail=false;throw Error('cleanup interrompida');}return nativeUpdate.call(targets[0],p);};
 await assert.rejects(()=>endPower(source,'network'),/interrompida/);
 assert.equal(source.system.powerState.active[0].ending,true);
 await endPower(source,'network');assert.equal(source.system.powerState.active.length,0);
 assert.ok(targets.every(a=>a.system.powerState.active.length===0));
});

test('Yamanaka network rejects invalid declarations before spending and resumes persisted resistance dice',async()=>{
 const {source,targets,data,tokens}=mentalNetworkSetup();
 await assert.rejects(()=>command(stranger,data),/controla/);
 await assert.rejects(()=>command(player,{...data,options:{level:8}}),/Confirme/);
 tokens[1].x=99;await assert.rejects(()=>command(player,data),/alcance/);tokens[1].x=1;
 tokens[1].hidden=true;await assert.rejects(()=>command(player,data),/visível/);tokens[1].hidden=false;
 await assert.rejects(()=>command(player,{...data,targets:[data.targets[0],data.targets[0]]}),/distintos/);
 await assert.rejects(()=>command(player,{...data,options:{...data.options,amplifier:true}}),/Shindenshin 10/);
 assert.equal(source.system.resources.chakra.value,28);
 const post=ChatMessage.create;let fail=true;ChatMessage.create=async p=>{if(fail&&p.flags?.[ID]?.kind==='power-resistance'){fail=false;throw Error('resistência sem publicação');}return post(p);};
 rolls=[15,4,7];await assert.rejects(()=>command(player,data),/sem publicação/);
 assert.equal(source.system.resources.chakra.value,20);assert.deepEqual(rolls,[4,7]);
 await command(player,data);assert.deepEqual(rolls,[7]);assert.equal(source.system.resources.chakra.value,20);
 assert.equal(targets[2].system.powerState.active.length,0);assert.equal(targets[3].system.powerState.active.length,1);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'kind')==='power-resistance').length,2);
 const {advancePowerPhase}=await import('../src/power-actions.mjs');
 await advancePowerPhase(source,'mind-first-end','end');assert.equal(source.system.powerState.active.length,1);
 source.flags[ID].currentTurnKey='mind-next-turn';
 await advancePowerPhase(source,'mind-next-end','end');assert.equal(source.system.powerState.active.length,0);
 assert.ok(targets.every(a=>!(a.system.powerState.active??[]).length));
});

test('a fully blocked mental network leaves the paid cost but no active link; disabled book cleans a connected network',async()=>{
 const {source,targets,data}=mentalNetworkSetup();rolls=[15];
 await command(player,{...data,targets:[data.targets[2]]});
 assert.equal(source.system.resources.chakra.value,20);assert.equal(source.system.powerState.active.length,0);
 assert.ok(targets.every(a=>!(a.system.powerState.active??[]).length));
 await command(player,{...data,executionId:'second-network',targets:[data.targets[0]]});
 assert.equal(source.system.resources.chakra.value,12);assert.equal(targets[0].system.powerState.active.length,1);
 game.settings.get=(_ns,k)=>k==='profile'?{...defaultProfile(),books:[]}:{};
 const {reconcileActivePowers}=await import('../src/power-actions.mjs');await reconcileActivePowers(source);
 assert.equal(source.system.powerState.active.length,0);assert.ok(targets.every(a=>!(a.system.powerState.active??[]).length));
 assert.equal(source.items.length,1);
});
async function command(user,data){game.user=user;const request=await ChatMessage.create({whisper:[...new Set([gm.id,user.id])],flags:{[ID]:{actionRequest:data}}});game.user=gm;await enqueueActionRequest(request);return request;}
async function declare(a,w,options={},targets){await command(player,{op:'declare',actorUuid:a.uuid,itemId:w.id,options:{mode:'melee',maneuver:'golpear',distance:1,...options},targets});return game.messages.find(m=>m.getFlag(ID,'actionExecution'));}
const e=m=>m.getFlag(ID,'actionExecution');
async function defense(m,t,strike=0,kind='esquiva',extra={}){return command(defender,{op:'defense',executionId:m.id,targetUuid:t.uuid,strike,kind,...extra});}
async function attack(m){return command(player,{op:'attack',executionId:m.id});}
async function defend(m,t,strike=0,extra={}){return command(defender,{op:'defend',executionId:m.id,targetUuid:t.uuid,strike,...extra});}
async function apply(m,t,strike=0){return command(defender,{op:'apply',executionId:m.id,targetUuid:t.uuid,strike,context:{located:'yes',distance:1,areaFraction:0}});}

test('fusion Golpear uses the marked target for both independent strikes and waits for both defenses before revealing any attack',async()=>{
 setup();const source=actor(player),target=actor(defender);
 source.system.powerState.active=[{id:'fusion',bodyFusion:true,fusionReady:true,extraBasicAttack:true,fusionSize:'huge',active:true}];
 target.system.physical.bodyHardness=2;
 const {declareWeaponFromForm}=await import('../src/saved-actions.mjs');
 await declareWeaponFromForm(source,'unarmed',{target1:target.uuid,maneuver:'golpear'});
 const card=game.messages.find(m=>m.getFlag(ID,'actionExecution'));
 assert.equal(e(card).attacks.length,2);assert.equal(e(card).slots.length,2);
 assert.ok(e(card).slots.every(s=>s.targetUuid===target.uuid));
 rolls=[8,8,4];await defense(card,target,0,'esquiva');
 assert.deepEqual(e(card).rolls,{});assert.deepEqual(rolls,[8,8,4]);
 await defense(card,target,1,'antecipar');
 assert.equal(e(card).state,'complete');assert.equal(e(card).slots[0].applied.damage,4);
 assert.equal(e(card).slots[1].applied.damage,2);assert.equal(target.system.resources.vitality.value,74);
 assert.deepEqual(rolls,[]);
 const vitality=target.system.resources.vitality.value;await command(player,{op:'refresh',executionId:card.id});
 assert.equal(target.system.resources.vitality.value,vitality);
 const other=actor(defender);
 await assert.rejects(command(player,{op:'declare',actorUuid:source.uuid,itemId:'unarmed',options:{maneuver:'golpear'},targets:[[target.uuid],[other.uuid]]}),/mesmo alvo/);
});

test('a second fusion strike allows its own timely Barreira and divides excess damage only after barrier and body hardness',async()=>{
 setup();const source=actor(player),target=actor(defender);source.system.attributes.for=20;
 source.system.powerState.active=[{id:'fusion',bodyFusion:true,fusionReady:true,extraBasicAttack:true,fusionSize:'huge',active:true}];
 target.system.physical.bodyHardness=2;
 target.items.push({id:'doton',name:'Doton',type:'power',system:{level:3,powerData:{family:'doton',choices:[{effect:'barreira',tier:3}]}}});
 const {declareWeaponFromForm}=await import('../src/saved-actions.mjs');
 await declareWeaponFromForm(source,'unarmed',{target1:target.uuid,maneuver:'golpear',distance:2});
 const card=game.messages.find(m=>m.getFlag(ID,'actionExecution'));
 await defense(card,target,0,'esquiva');
 await defense(card,target,1,'technique',{barrier:true,techniqueId:'doton'});
 assert.deepEqual(e(card).rolls,{});assert.equal(target.system.resources.chakra.value,28);
 rolls=[8,9,16];await command(defender,{op:'technique-started',executionId:card.id,targetUuid:target.uuid,strike:1});
 assert.equal(e(card).state,'complete');assert.equal(e(card).slots[1].result.barrier.hardness,8);
 assert.equal(e(card).slots[1].result.barrier.excess,4);
 assert.equal(e(card).slots[1].applied.damage,2);assert.equal(target.system.resources.vitality.value,68);
 assert.equal(target.system.resources.chakra.value,25);assert.deepEqual(rolls,[]);
});

test('quick Garouga resolves both failed and timely defensive barriers without extra resolve/apply clicks',async()=>{
 for(const [defenseNatural,expected]of [[10,22],[14,9]]){
  setup();const source=actor(player),target=actor(defender);source.system.attributes.for=20;target.system.attributes.per=12;target.system.attributes.esp=16;
  const power={id:'shikakyu',type:'power',system:{level:8,powerData:{family:'shikakyu'}}};source.items.push(power);
  const plan={family:'shikakyu',effect:'garouga',name:'Garouga',level:8,cost:2,action:'full',duration:'instant',stat:'cc',damage:22,
   damageType:'Letal',critical:15,range:3,targets:1,physicalAttack:true,precisionBonus:1,resistances:[],notes:[]};
  source.system.powerState.executions={garouga:{plan,options:{id:power.id,targetUuid:target.uuid,distance:3}}};
  target.items.push({id:'doton',name:'Doton',type:'power',system:{level:3,powerData:{family:'doton',choices:[{effect:'barreira',tier:3}]}}});
  await command(player,{op:'declare-power',actorUuid:source.uuid,itemId:power.id,powerExecutionId:'garouga',quickResolution:true});
  const card=game.messages.find(m=>m.getFlag(ID,'actionExecution'));
  await defense(card,target,0,'technique',{barrier:true,techniqueId:'doton'});
  assert.deepEqual(e(card).rolls,{});rolls=[6,defenseNatural];
  await command(defender,{op:'technique-started',executionId:card.id,targetUuid:target.uuid,strike:0});
  assert.equal(e(card).state,'complete');assert.equal(e(card).slots[0].applied.damage,expected);
  assert.equal(target.system.resources.vitality.value,80-expected);assert.equal(target.system.resources.chakra.value,25);
  assert.equal(!!e(card).slots[0].result.barrier,defenseNatural===14);
 }
});

test('maintaining a hold in a fusion declares only its half-base extra against the held opponent and waits for a defense',async()=>{
 setup();const source=actor(player),target=actor(defender);source.system.attributes.for=20;
 source.system.powerState.active=[{id:'fusion',bodyFusion:true,fusionReady:true,extraBasicAttack:true,fusionSize:'huge',active:true}];
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',options:{mode:'melee',maneuver:'agarrar',distance:1},targets:[[target.uuid]]});
 const hold=game.messages.find(m=>m.getFlag(ID,'actionExecution'));rolls=[8];await defense(hold,target);
 assert.equal(e(hold).state,'complete');assert.ok(e(hold).slots[0].applied.conditionApplied);
 await command(player,{op:'grapple-maintain',executionId:hold.id,targetUuid:target.uuid,strike:0});
 const extra=game.messages.find(m=>m.getFlag(ID,'actionExecution')?.fusionGrappleKey);
 assert.ok(extra);assert.equal(e(extra).attacks.length,1);assert.equal(e(extra).attacks[0].base,6);
 assert.equal(e(extra).slots[0].targetUuid,target.uuid);assert.deepEqual(e(extra).rolls,{});
 assert.equal(e(extra).action,'Incluído em Manter agarramento');
 rolls=[9];await defense(extra,target);
 assert.equal(e(extra).state,'complete');assert.equal(e(extra).slots[0].applied.damage,12);
 assert.equal(target.system.resources.vitality.value,68);
});

test('sacar e guardar respeitam Saque Rápido e não consomem armas',async()=>{
 setup();
 const {setWeaponReady,weaponHandlingAction}=await import('../src/weapon-actions.mjs');
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 const a=actor(player),w=weapon(a);
 const view=(group,category='weapon-use')=>combatHUDView(a,[a],{items:a.items,actorView:a,category,actionGroup:group});
 assert.equal(weaponHandlingAction(a.items),'Parcial');
 assert.match(view('partial'),/Sacar kunai/);
 await setWeaponReady(a,w.id,true);
 await setWeaponReady(a,w.id,true);
 assert.equal(w.system.quantity,10);
 assert.match(view('partial'),/Guardar kunai/);
 apt(a,'saque-rapido');
 assert.equal(weaponHandlingAction(a.items),'Livre');
 assert.match(view('free'),/Guardar kunai/);
 assert.doesNotMatch(view('partial'),/Guardar kunai/);
 await setWeaponReady(a,w.id,false);
 assert.equal(w.system.equipped,false);
 a.items.push({id:'pill',type:'equipment',name:'Pílulas do soldado',system:{catalogKey:'soldier-pill',catalogBook:'basico',quantity:2}});
 a.items.push({id:'tag',type:'equipment',name:'Tarja explosiva',system:{catalogKey:'explosive-tag',catalogBook:'basico',quantity:1}});
 assert.match(view('partial','inventory-use'),/Pílulas do soldado/);
 assert.match(view('standard','inventory-use'),/Preparar tarja explosiva/);
 assert.doesNotMatch(view('free','inventory-use'),/Detonar tarjas preparadas/);
 a.system.inventoryState.explosives=[{id:'prepared'}];
 assert.match(view('free','inventory-use'),/Detonar tarjas preparadas/);
});

test('Réplica Enganadora pauses qualifying hits and spends chakra only when chosen',async()=>{
 for(const takeHit of [false,true]){
  setup();
  const source=actor(player),target=actor(defender);
  apt(target,'replica-enganadora');
  target.items[0].system.level=2;
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  rolls=[8];
  await defense(card,target);
  const slot=e(card).slots[0];
  assert.equal(slot.replicaOffer.margin,1);
  assert.equal(slot.applied,undefined);
  assert.equal(target.system.resources.vitality.value,80);
  assert.equal(target.system.resources.chakra.value,28);
  if(takeHit){
   await apply(card,target);
   assert.ok(target.system.resources.vitality.value<80);
   assert.equal(target.system.resources.chakra.value,28);
  }else{
   const action={op:'replica-use',executionId:card.id,strike:0,targetUuid:target.uuid,stealth:true};
   await assert.rejects(command(stranger,action),/controlador/);
   rolls=[12];
   await command(defender,action);
   assert.equal(e(card).state,'complete');
   assert.equal(e(card).slots[0].result.redirectedToReplica,true);
   assert.ok(Number.isFinite(e(card).slots[0].replicaUsed.stealth));
   assert.equal(target.system.resources.vitality.value,80);
   assert.equal(target.system.resources.chakra.value,24);
   await assert.rejects(command(defender,action),/indisponível/);
  }
 }
});

test('Golpe de Misericórdia validates the target and resolves the critical, Vigor and outcome',async()=>{
 for(const [targetKind,mercyOutcome] of [['normal','knockout'],['capanga','kill']]){
  setup();
  const source=actor(player),target=actor(defender);
  const action={op:'declare',actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver:'golpear',distance:1,mercy:true,mercyOutcome,targetKind},targets:[[target.uuid]]};
  await assert.rejects(command(player,action),/indefeso ou paralisado/);
  const [paralysis]=await target.createEmbeddedDocuments('ActiveEffect',[{flags:{[ID]:{condition:{key:'paralisado'}}}}]);
  paralysis.delete=()=>target.deleteEmbeddedDocuments('ActiveEffect',[paralysis.id]);
  rolls=[10,3];
  await command(player,action);
  const card=game.messages.find(message=>e(message));
  assert.equal(e(card).action,'Completa');
  assert.equal(e(card).rolls[0].critical,true);
  assert.equal(e(card).rolls[0].degree,4);
  assert.equal(e(card).state,'complete');
  const result=e(card).slots[0].applied.mercy;
  assert.equal(result.outcome,mercyOutcome);
  assert.equal(result.resistance===null,targetKind==='capanga');
  assert.deepEqual(target.effects.map(effect=>effect.flags[ID].condition.key),[mercyOutcome==='kill'?'morto':'inconsciente']);
  assert.ok(!game.messages.some(message=>message.getFlag(ID,'defenseInvitation')));
 }
});

test('Fintar lowers the next matching defense only, and Lutar na Defensiva starts with the attack',async()=>{
 setup();
 const {derivedSummary}=await import('../src/automation.mjs');
 const source=actor(player),target=actor(defender),flags={};
 game.combat={id:'combat',started:true,round:1,turn:0,getFlag:(ns,key)=>flags[key],async setFlag(ns,key,value){flags[key]=value;}};
 rolls=[15,6];
 await command(player,{op:'feint',actorUuid:source.uuid,targetUuid:target.uuid});
 await assert.rejects(command(player,{op:'feint',actorUuid:source.uuid,targetUuid:target.uuid}),/nesta rodada/);
 const declaration={op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'golpear',distance:1,fightDefensively:true},targets:[[target.uuid]]};
 const before=derivedSummary(source).combat.esq;
 for(const first of [true,false]){
  await command(player,declaration);
  const card=game.messages.filter(message=>e(message)).at(-1);
  assert.equal(e(card).attacks[0].precision,8);
  if(first)assert.equal(derivedSummary(source).combat.esq,before);
  rolls=[8];
  await defense(card,target);
  assert.equal(Boolean(e(card).slots[0].feint),first);
  assert.equal(e(card).slots[0].result.hit,first);
  assert.equal(derivedSummary(source).combat.esq,before+2);
 }
});

test('Evadir resolves using Ler Movimento and reports a successful escape',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[target.uuid]]});
 const card=game.messages.find(message=>e(message));
 rolls=[6,14];
 await defense(card,target,0,'antecipar',{evade:true});
 assert.equal(e(card).slots[0].result.hit,false);
 assert.match(card.content,/Evadir funcionou/);
 assert.equal(target.system.resources.vitality.value,80);
});

test('olfactory Sensor spends chakra on a failed check without granting detection',async()=>{
 setup();
 const {aptitudeUseAction}=await import('../src/aptitude-use.mjs');
 const source=actor(player);apt(source,'sensor');
 const item=source.items[0];item.system.selection='olfato';
 const app={values:{},render:async()=>{}};
 const fields={querySelectorAll:()=>[{name:'aptitude.environment',value:'normal',type:'select-one'}]};
 rolls=[3];
 await aptitudeUseAction(app,'execute-aptitude',{id:item.id},fields,{actor:source});
 assert.equal(source.system.resources.chakra.value,25);
 assert.equal(source.getFlag(ID,'aptitudes').active.sensor,undefined);
 rolls=[15];
 await aptitudeUseAction(app,'execute-aptitude',{id:item.id},fields,{actor:source});
 assert.equal(source.system.resources.chakra.value,22);
 assert.equal(source.getFlag(ID,'aptitudes').active.sensor.sense,'olfato');
});

test('Olhar Hipnótico validates eye contact and protects a freed target until its next turn',async()=>{
 setup();
 const {damageActor,conditionRecords}=await import('../src/automation.mjs');
 const source=actor(player),target=actor(defender);
 giveActiveEye(source,'Uchiha','res-basico-sharingan');
 source.system.attributes.per=16;
 apt(source,'res-basico-nidan-sharingan');
 source.items.at(-1).system.capabilityData={schemaVersion:1,definitionId:'res-basico-nidan-sharingan',accessOrigin:'uchiha'};
 apt(source,'fascinar');
 const action={op:'shinobi-fascinar',actorUuid:source.uuid,targetUuid:target.uuid,itemId:source.items.at(-1).id,hypnotic:true,distance:9};
 await assert.rejects(command(player,action),/contato visual/);
 rolls=[4];
 await command(player,{...action,eyeContact:true});
 const condition=conditionRecords(target).find(effect=>effect.hypnotic);
 assert.equal(condition.difficulty,12);
 for(const effect of target.effects)effect.delete=()=>target.deleteEmbeddedDocuments('ActiveEffect',[effect.id]);
 await damageActor(target,1);
 await assert.rejects(command(player,{...action,eyeContact:true}),/imune/);
 target.flags[ID].currentTurnKey='next-turn';
 rolls=[4];
 await command(player,{...action,eyeContact:true});
 assert.ok(conditionRecords(target).some(effect=>effect.hypnotic));
});

test('Miragem registers a fixed illusion, spends chakra and permits free cancellation',async()=>{
 setup();
 const {aptitudeUseAction}=await import('../src/aptitude-use.mjs');
 const source=actor(player);apt(source,'miragem');
 const item=source.items[0],app={values:{},render:async()=>{}};
 const fields={querySelectorAll:()=>[
  {name:'aptitude.point',value:'Portal',type:'text'},
  {name:'aptitude.image',value:'Corvo',type:'text'},
  {name:'aptitude.mode',value:'mobile',type:'select-one'},
 ]};
 await aptitudeUseAction(app,'execute-aptitude',{id:item.id},fields,{actor:source});
 const [[id,mirage]]=Object.entries(source.getFlag(ID,'aptitudes').mirages);
 assert.equal(mirage.point,'Portal');
 assert.equal(mirage.mobile,true);
 assert.equal(source.system.resources.chakra.value,27);
 assert.deepEqual(game.messages.at(-1).whisper,[gm.id]);
 await aptitudeUseAction(app,'end-mirage',{id:item.id,mirage:id},fields,{actor:source});
 assert.deepEqual(source.getFlag(ID,'aptitudes').mirages,{});
});

test('Fascinar validates reach, records resistance and ends on damage without refreshing its scene limit',async()=>{
 setup();
 const {damageActor,conditionRecords}=await import('../src/automation.mjs');
 const {retryFascinar}=await import('../src/aptitude-use.mjs');
 const source=actor(player),target=actor(defender);
 apt(source,'fascinar');
 const action={op:'shinobi-fascinar',actorUuid:source.uuid,targetUuid:target.uuid,itemId:source.items[0].id};
 await assert.rejects(command(player,{...action,distance:6}),/5 m/);
 assert.equal(source.system.resources.chakra.value,28);
 rolls=[4];
 await command(player,{...action,distance:5});
 assert.equal(source.system.resources.chakra.value,25);
 const record=conditionRecords(target).find(effect=>effect.key==='fascinado');
 assert.equal(record.difficulty,11);
 await assert.rejects(retryFascinar(target,record),/segundo turno/);
 for(const effect of target.effects)effect.delete=()=>target.deleteEmbeddedDocuments('ActiveEffect',[effect.id]);
 await damageActor(target,1);
 assert.ok(!conditionRecords(target).some(effect=>effect.key==='fascinado'));
 await assert.rejects(command(player,{...action,distance:5}),/já foi fascinado/);
 assert.equal(source.system.resources.chakra.value,25);
});

test('Hachimon wear preserves Fascinar and its current gate reduction never changes the original difficulty',async()=>{
 setup();
 const {conditionRecords}=await import('../src/automation.mjs');
 const {resolveFascinar,retryFascinar}=await import('../src/aptitude-use.mjs');
 const {activateHachimon,endPower,advancePowerPhase}=await import('../src/power-actions.mjs');
 const source=actor(player),target=actor(defender);
 apt(source,'fascinar');source.system.attributes.int=20;target.system.campaign.level=20;
 const gates={id:'gates',type:'power',name:'Hachimon',system:{level:8,powerData:{family:'hachimon'}}};target.items.push(gates);
 await activateHachimon(target,gates,{level:5,executionId:'gate5'},{user:defender,requestId:'gate5'});
 rolls=[4];await resolveFascinar(source,target,source.items[0],'illusion',1);
 let record=conditionRecords(target).find(c=>c.key==='fascinado');
 assert.equal(record.difficulty,26);
 const initial=game.messages.find(m=>m.flavor?.includes('Fascinar'));
 assert.ok(initial.flavor.includes('24'));
 const before=target.system.resources.vitality.value;
 target.flags[ID].currentTurnKey='illusion-turn';
 await advancePowerPhase(target,'illusion-turn-start','start');
 assert.equal(target.system.resources.vitality.value,before-5);
 record=conditionRecords(target).find(c=>c.key==='fascinado');assert.ok(record);
 rolls=[4];await retryFascinar(target,{...record,elapsed:2});
 assert.ok(game.messages.at(-1).flavor.includes('Inteligência 23'));
 await endPower(target,'gate5');
 target.flags[ID].currentTurnKey='after-close';
 record=conditionRecords(target).find(c=>c.key==='fascinado');
 rolls=[4];await retryFascinar(target,{...record,elapsed:3});
 assert.ok(game.messages.at(-1).flavor.includes('Inteligência 24'));
});

test('Kyoudo Kyouka consumes the preparation when the chosen strike starts, hit or miss',async()=>{
 for(const natural of [14,3]){
  setup();
  const source=actor(player),target=actor(defender);
  apt(source,'kyoudo-kyouka');apt(source,'punho-de-ferro');
  source.flags[ID]??={};source.flags[ID].aptitudes={active:{'kyoudo-kyouka':{id:'ready',base:5,difficulty:15}},uses:{},cooldowns:{}};
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver:'golpear',distance:1,kyoudo:true},targets:[[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  assert.equal(e(card).attacks[0].base,5);
  assert.equal(e(card).attacks[0].cannotBlock,true);
  assert.ok(source.flags[ID].aptitudes.active['kyoudo-kyouka']);
  rolls=[natural,3];
  await defense(card,target);
  assert.equal(source.flags[ID].aptitudes.active['kyoudo-kyouka'],undefined);
  assert.equal(target.effects.some(effect=>effect.flags[ID].condition.key==='caido'),natural===14);
  assert.equal(target.system.resources.vitality.value<80,natural===14);
 }
});

test('active Shunjutsu substitutes Spirit for movement and expires with its turn',async()=>{
 setup();
 const {derivedSummary}=await import('../src/automation.mjs');
 const source=actor(player);
 source.system.attributes.esp=12;apt(source,'velocista');
 source.flags[ID]??={};source.flags[ID].currentTurnKey='first';
 source.flags[ID].aptitudes={active:{shunjutsu:{turn:'first'}},uses:{},cooldowns:{}};
 assert.equal(derivedSummary(source).movement,22);
 source.flags[ID].currentTurnKey='next';
 assert.equal(derivedSummary(source).movement,16);
 assert.equal(source.system.attributes.agi,6);
});

test('the world setting controls Ataque Progressivo when a critical skips the last defense',async()=>{
 for(const choice of ['automatic','roll']){
  setup();
  const get=game.settings.get;
  game.settings.get=(ns,key)=>key==='houseRules'?{progressiveCriticalDefense:choice}:get(ns,key);
  const source=actor(player),target=actor(defender);
  source.system.attributes.agi=14;
  apt(source,'ataque-multiplo');apt(source,'ataque-progressivo');
  await command(player,{op:'declare',actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver:'ataque-progressivo',count:2,distance:1},targets:[[target.uuid],[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  await defense(card,target,0,'esquiva');
  await defense(card,target,1,'esquiva');
  rolls=[12];
  await attack(card);await defend(card,target);await apply(card,target);
  rolls=[15,13,14,3,8];
  await attack(card);await apply(card,target,1);
  const last=e(card).slots[1];
  assert.equal(last.defenseRoll,undefined);
  if(choice==='automatic'){
   assert.equal(last.progressive.bonus,2);
   assert.equal(last.progressive.automatic,true);
   assert.deepEqual(rolls,[13,14,3,8]);
  }else{
   assert.equal(last.progressive.extraDefenseTotal,22);
   assert.equal(last.progressive.bonus,1);
   assert.deepEqual(rolls,[8]);
  }
 }
});

test('Ataque Progressivo adds damage only to a successful final strike without rerolling its defense',async()=>{
 for(const finalHit of [true,false]){
  setup();
  const source=actor(player),target=actor(defender);
  source.system.attributes.agi=16;
  apt(source,'ataque-multiplo');apt(source,'ataque-progressivo');
  const options={mode:'melee',maneuver:'ataque-progressivo',count:2,distance:1};
  await command(player,{op:'declare',actorUuid:source.uuid,itemId:'unarmed',
   options,targets:[[target.uuid],[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  await defense(card,target,0,'esquiva');
  await defense(card,target,1,'antecipar');
  rolls=[12];
  await attack(card);await defend(card,target);await apply(card,target);
  assert.equal(e(card).slots[0].progressive,undefined);
  rolls=finalHit?[12,4,13,3,14]:[4,12,13,3,14];
  await attack(card);await defend(card,target,1);
  if(finalHit){
   const before=target.system.resources.vitality.value;
   await apply(card,target,1);
   const last=e(card).slots[1];
   assert.deepEqual(last.progressive.rolls.map(roll=>roll.hit),[true,false,true]);
   assert.equal(last.progressive.bonus,2);
   assert.equal(target.system.resources.vitality.value,before-(e(card).attacks[1].base+2)*e(card).rolls[1].degree);
   assert.deepEqual(rolls,[]);
  }else{
   assert.equal(e(card).slots[1].progressive,undefined);
   assert.deepEqual(rolls,[13,3,14]);
  }
 }
});

test('Seguir Sombra resolves aerial defense and landing against the original target',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 for(const key of ['lutador','arremessar','seguir-sombra'])apt(source,key);
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'derrubar',distance:1,throwTarget:true},targets:[[target.uuid]]});
 const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
 rolls=[14];
 await defense(card,target);
 for(const effect of target.effects)effect.delete=()=>target.deleteEmbeddedDocuments('ActiveEffect',[effect.id]);
 const action={executionId:card.id,strike:0,targetUuid:target.uuid};
 await command(player,{...action,op:'throw-target',direction:'up',distance:6});
 assert.equal(target.effects.length,0);
 await assert.rejects(command(player,{...action,op:'follow-shadow',height:6}),/acelerado/);
 source.system.conditions.push({id:'speed',key:'acelerado',name:'Acelerado'});
 await command(player,{...action,op:'follow-shadow',height:6});
 const follow=game.messages.find(message=>e(message)?.shadowOrigin);
 assert.equal(e(follow).slots[0].targetUuid,target.uuid);
 rolls=[6];
 await defense(follow,target,0,'esquiva');
 assert.equal(e(follow).slots[0].result.hit,true);
 assert.equal(e(follow).slots[0].applied.shadowFallDamage,6);
 assert.equal(e(card).slots[0].thrown.landed.damage,6);
 assert.ok(target.effects.some(effect=>effect.flags[ID].condition.key==='caido'));
 await assert.rejects(command(player,{...action,op:'follow-shadow',height:6}),/elegível/);
});

test('Arremessar validates the chosen distance and applies confirmed obstacle damage once',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 apt(source,'lutador');apt(source,'arremessar');
 source.items.at(-1).system.catalogBook='avancado';
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'derrubar',distance:1,throwTarget:true},targets:[[target.uuid]]});
 const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
 rolls=[14];
 await defense(card,target);
 const action={op:'throw-target',executionId:card.id,strike:0,targetUuid:target.uuid,direction:'back',obstacle:true};
 await assert.rejects(command(player,{...action,distance:9}),/até 8 m/);
 await command(player,{...action,distance:6});
 assert.equal(e(card).slots[0].thrown.damage,8);
 assert.equal(target.system.resources.vitality.value,72);
 await assert.rejects(command(player,{...action,distance:6}),/indisponível/);
 assert.equal(target.system.resources.vitality.value,72);
});

test('Imobilização waits a round and escalates the Vigor penalty without repeating damage in the same round',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 source.system.attributes.for=13;apt(source,'imobilizacao');
 game.combat={id:'fight',started:true,round:1};
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'agarrar',distance:1},targets:[[target.uuid]]});
 const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
 rolls=[14];
 await defense(card,target);
 const action={executionId:card.id,strike:0,targetUuid:target.uuid};
 await assert.rejects(command(player,{...action,op:'grapple-immobilize'}),/rodada completa/);
 game.combat.round=2;rolls=[4];
 await command(player,{...action,op:'grapple-immobilize'});
 const first=e(card).slots[0].immobilization;
 assert.equal(first.difficulty,20);
 assert.equal(target.system.resources.vitality.value,67);
 await assert.rejects(command(player,{...action,op:'grapple-maintain'}),/já foi resolvida/);
 game.combat.round=3;rolls=[4];
 await command(player,{...action,op:'grapple-maintain'});
 assert.equal(e(card).slots[0].immobilization.total,first.total-1);
 assert.equal(target.system.resources.vitality.value,54);
});

test('grapple controls maintain the hold and remove only its conditions on escape',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'agarrar',distance:1},targets:[[target.uuid]]});
 const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
 rolls=[14];
 await defense(card,target);
 const action={executionId:card.id,strike:0,targetUuid:target.uuid};
 await assert.rejects(command(defender,{...action,op:'grapple-maintain'}),/controla/);
 await command(player,{...action,op:'grapple-maintain'});
 assert.deepEqual(source.effects.map(effect=>effect.flags[ID].condition.key),['lento']);
 for(const actor of [source,target])for(const effect of actor.effects)
  effect.delete=()=>actor.deleteEmbeddedDocuments('ActiveEffect',[effect.id]);
 await command(player,{...action,op:'grapple-difficulty',stat:'for'});
 rolls=[15];
 await command(defender,{...action,op:'grapple-escape',stat:'escapar'});
 assert.equal(e(card).slots[0].grappleEnded,'alvo se libertou');
 assert.equal(source.effects.length,0);
 assert.equal(target.effects.length,0);
});

test('qualified blocks expose optional counters and disarm automatically on a critical',async()=>{
 for(const [attackDie,defenseDie] of [[7,13],[7,15],[3,null]]){
  setup();
  const source=actor(player),target=actor(defender),attacking=weapon(source),blocking=weapon(target);
  attacking.system.equipped=blocking.system.equipped=true;
  apt(target,'contragolpe');apt(target,'bloquear-arma');
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:attacking.id,
   options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  rolls=defenseDie==null?[attackDie]:[attackDie,defenseDie];
  await defense(card,target,0,'bloqueio',{weaponId:blocking.id});
  const response=e(card).slots[0].blockResponse;
  assert.equal(response.counter,true);
  assert.equal(response.automatic,defenseDie!==13);
  assert.equal(response.disarm,defenseDie===13);
  assert.equal(attacking.system.equipped,defenseDie!==15);
  const op={op:'block-counter',executionId:card.id,strike:0,targetUuid:target.uuid};
  await assert.rejects(command(stranger,op),/controlador/);
  rolls=[3];
  await command(defender,op);
  const counter=game.messages.find(message=>e(message)?.blockResponseKind==='counter');
  assert.equal(e(counter).slots[0].targetUuid,source.uuid);
  if(response.automatic){
   assert.equal(e(counter).state,'complete');
   assert.ok(source.system.resources.vitality.value<80);
  }else{
   assert.equal(e(counter).state,'declared');
   const disarm={...op,op:'block-disarm'};
   await command(defender,disarm);
   const disarmCard=game.messages.find(message=>e(message)?.blockResponseKind==='disarm');
   rolls=[15];
   await command(player,{op:'defense',executionId:disarmCard.id,strike:0,targetUuid:source.uuid,kind:'esquiva'});
   assert.equal(attacking.system.equipped,false);
  }
  await assert.rejects(command(defender,op),/não está disponível/);
 }
});

test('combat aptitudes reuse the attack card and apply their specific consequences',async()=>{
 for(const [maneuver,mode] of [['rasteira','melee'],['agarrar-agressivo','melee'],['desarme-agressivo','melee'],['desarme-a-distancia','ranged'],['flechada-no-joelho','ranged']]){
  setup();
  const source=actor(player),target=actor(defender);
  apt(source,maneuver);
  if(mode==='ranged')source.items.at(-1).system.level=2;
  const itemId=mode==='ranged'?weapon(source).id:'unarmed';
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId,
   options:{mode,maneuver,distance:1},targets:[[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  rolls=[15,3];
  await defense(card,target);
  assert.equal(e(card).state,'complete');
  if(maneuver==='rasteira'){
   assert.deepEqual(rolls,[3]);
   assert.equal(target.system.resources.vitality.value,80);
  }else assert.ok(target.system.resources.vitality.value<80);
  const conditions=target.effects.map(effect=>effect.flags[ID].condition.key);
  if(maneuver==='rasteira')assert.deepEqual(conditions,['caido']);
  if(maneuver==='agarrar-agressivo')assert.deepEqual(conditions,['agarrado']);
  if(maneuver==='flechada-no-joelho')assert.deepEqual(conditions,['caido','lento']);
  if(maneuver.startsWith('desarme-'))assert.ok(e(card).slots[0].applied.disarmedMetres>=3);
 }
});

test('Esquiva de Risco is an opposed reaction restricted to owners of the aptitude',async()=>{
 setup();
 const source=actor(player),target=actor(defender),w=weapon(source);
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:w.id,
  options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[target.uuid]]});
 const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
 rolls=[7,14];
 await assert.rejects(defense(card,target,0,'esquiva',{risk:true}),/exige a aptidão/);
 assert.deepEqual(rolls,[7,14]);
 apt(target,'reflexos');apt(target,'esquiva-de-risco');
 await defense(card,target,0,'esquiva',{risk:true});
 const slot=e(card).slots[0];
 assert.equal(slot.defenseRoll.precision,10);
 assert.equal(slot.result.hit,false);
 assert.match(card.content,/Esquiva de Risco/);
});

test('basic maneuvers report movement and register disarm without damage',async()=>{
 for(const maneuver of ['empurrar','desarmar','atropelar']){
  setup();
  const source=actor(player),target=actor(defender),held=weapon(target);
  held.system.equipped=true;
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver,distance:1},targets:[[target.uuid]]});
  const card=game.messages.find(message=>message.getFlag(ID,'actionExecution'));
  rolls=[14,6];
  await defense(card,target,0,'antecipar');
  const slot=e(card).slots[0];
  assert.equal(e(card).state,'complete');
  assert.equal(target.system.resources.vitality.value,80);
  if(maneuver==='empurrar')assert.equal(slot.applied.pushedMetres,3);
  if(maneuver==='atropelar'){
   assert.equal(e(card).action,'Completa');
   assert.match(card.content,/Avance em linha reta/);
   assert.deepEqual(target.effects.map(effect=>effect.flags[ID].condition.key),['caido']);
  }
  if(maneuver==='desarmar'){
   assert.equal(slot.applied.disarmedMetres,5);
   assert.equal(held.system.equipped,true);
   const register={op:'disarm-item',executionId:card.id,strike:0,targetUuid:target.uuid,itemId:held.id};
   await assert.rejects(command(stranger,register),/controlador/);
   await command(defender,register);
   assert.equal(held.system.equipped,false);
   assert.equal(e(card).slots[0].disarmedItem.id,held.id);
   await assert.rejects(command(defender,register),/Não há/);
  }
 }
});

test('Derrubar e Agarrar aplicam a condição sem dano no fluxo rápido',async()=>{
 for(const [maneuver,key] of [['derrubar','caido'],['agarrar','agarrado']]){
  setup();
  const source=actor(player),target=actor(defender);
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver,distance:1},targets:[[target.uuid]]});
  const card=game.messages.find(m=>m.getFlag(ID,'actionExecution'));
  rolls=[14];
  await defense(card,target);
  assert.equal(e(card).state,'complete');
  assert.equal(target.system.resources.vitality.value,80);
  assert.deepEqual(target.effects.map(effect=>effect.flags[ID].condition.key),[key]);
  assert.match(card.content,key==='caido'?/Caído/:/Agarrado/);
  if(key==='caido')await assert.rejects(command(player,{op:'declare',actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver,distance:1},targets:[[target.uuid]]}),/alvo de pé/);
 }
});

test('o menu de manobras respeita o modo de ataque e a arma',async()=>{
 const {availableManeuvers}=await import('../src/maneuvers.mjs');
 const {WEAPONS}=await import('../src/weapons.mjs');
 const moves=(key,mode)=>availableManeuvers([],{},WEAPONS.find(weapon=>weapon.key===key),mode);
 assert.ok(moves('unarmed','melee').agarrar&&moves('unarmed','melee').derrubar);
 assert.ok(moves('whip','melee').agarrar&&moves('whip','melee').derrubar);
 assert.ok(moves('nunchaku','melee').agarrar);
 assert.ok(!moves('nunchaku','melee').derrubar);
 assert.ok(!moves('kunai','ranged').derrubar);
});

test('a single-target weapon attack rolls and settles when the defender chooses a reaction',async()=>{
 for(const [dice,hit] of [[[14,5],true],[[7,13],false]]){
  setup();
  const source=actor(player),target=actor(defender),w=weapon(source);
  rolls=[...dice];
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:w.id,
   options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[target.uuid]]});
  const card=game.messages.find(m=>m.getFlag(ID,'actionExecution'));
  assert.deepEqual(rolls,dice);
  const request=await defense(card,target,0,'antecipar');
  assert.deepEqual(rolls,[]);
  assert.equal(e(card).state,'complete');
  assert.equal(e(card).slots[0].result.hit,hit);
  assert.equal(target.system.resources.vitality.value<80,hit);
  assert.match(card.content,/Defesa rolada:/);
  assert.ok(!game.messages.some(m=>m.getFlag(ID,'defenseExecutionKey')));
  assert.equal(request.getFlag(ID,'actionRequestDone'),true);
  assert.equal(request.content,'');
 }
});

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
 setup();const a=actor(player),t=actor(defender),w=weapon(a);t.items.push({id:'jutsu',name:'Defesa da ficha',type:'technique',system:{}});const m=await declare(a,w,{},[[t.uuid]]);await command(gm,{op:'defense',executionId:m.id,targetUuid:t.uuid,strike:0,kind:'technique',techniqueId:'jutsu'});await assert.rejects(()=>attack(m),/declarações/);await command(defender,{op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid});rolls=[10,14];await attack(m);await assert.rejects(()=>defend(m,t),/executada a tempo/);assert.equal(e(m).slots[0].defenseRoll.natural,14);await defend(m,t,0,{techniqueStopped:true});assert.equal(e(m).state,'complete');assert.equal(t.system.resources.chakra.value,28);
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

test('HUD multiple strikes reuse the sole marked target while distinct marks retain distribution',()=>{
 setup();const targets=[{uuid:'Actor.a',name:'Alvo A'},{uuid:'Actor.b',name:'Alvo B'}];
 for(const [maneuver,count] of [['ataque-multiplo',3],['ataque-progressivo',2],['chute-duplo',2]]){
  const html=targetFields({hudInline:true,options:{maneuver,count},attackTargets:targets,selectedTargets:['Actor.b']});
  assert.ok(!html.includes('<select'));
  const slots=[...html.matchAll(/name="weapon.target(\d+)" value="([^"]+)"/g)];
  assert.equal(slots.length,count);assert.deepEqual(slots.map(m=>m[2]),Array(count).fill('Actor.b'));
 }
 const split=targetFields({hudInline:true,options:{maneuver:'ataque-multiplo',count:2},attackTargets:targets,selectedTargets:targets.map(t=>t.uuid)});
 assert.match(split,/<select name="weapon.target1"/);assert.match(split,/<select name="weapon.target2"/);
 const empty=targetFields({hudInline:true,attackTargets:targets,selectedTargets:[]});
 assert.match(empty,/Marque um único alvo/);assert.ok(!empty.includes('type="hidden"'));
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


test('Tenketsu rolls once per confirmed Juuken hit and resumes after failure to post the roll',async()=>{
 setup();
 const {resolveWeaponAttack}=await import('../src/weapon-resolution.mjs');
 const target=actor(defender);
 const strike=()=>ChatMessage.create({flags:{[ID]:{weaponAttack:{
  name:'Juuken',natural:10,degree:1,plan:{base:1,juuken:true,tenketsuDifficulty:17}
 }}}});
 const first=await strike(),second=await strike();
 assert.deepEqual(await resolveWeaponAttack(first,target.uuid,{hit:false}),{hit:false,damage:0});
 rolls.push(3,15);
 const create=ChatMessage.create;
 ChatMessage.create=async data=>{
  if(data.flags?.[ID]?.tenketsuReceipt)throw Error('Falha ao publicar');
  return create(data);
 };
 await assert.rejects(resolveWeaponAttack(first,target.uuid,{hit:true}),/Falha ao publicar/);
 ChatMessage.create=create;
 const failure=await resolveWeaponAttack(first,target.uuid,{hit:true});
 assert.deepEqual(failure.tenketsu,{difficulty:17,failed:true,sealedChakra:2});
 assert.equal((await resolveWeaponAttack(first,target.uuid,{hit:true})).duplicate,true);
 const success=await resolveWeaponAttack(second,target.uuid,{hit:true});
 assert.deepEqual(success.tenketsu,{difficulty:17,failed:false,sealedChakra:0});
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'tenketsuReceipt')).length,2);
 assert.equal(target.system.resources.chakra.value,26);
 assert.equal(target.getFlag(ID,'aptitudes').sealedChakra,2);

 target.system.resources.chakra.value=1;
 const third=await strike();
 rolls.push(3);
 const capped=await resolveWeaponAttack(third,target.uuid,{hit:true});
 assert.equal(capped.tenketsu.sealedChakra,1);
 assert.equal(target.system.resources.chakra.value,0);
 assert.equal(target.getFlag(ID,'aptitudes').sealedChakra,3);

 const {automationAction}=await import('../src/summary-actions.mjs');
 const {restRecovery}=await import('../src/automation.mjs');
 const fullRest=confirmed=>({querySelectorAll:()=>[
  {name:'resource.operation',value:'rest'},
  {name:'resource.fullRest',type:'checkbox',checked:confirmed}
 ]});
 const rest=confirmed=>automationAction({close:async()=>{}},'apply-resource',{},fullRest(confirmed),{actor:target});
 await assert.rejects(rest(false),/oito horas/);
 assert.equal(target.getFlag(ID,'aptitudes').sealedChakra,3);
 assert.equal(restRecovery(target).chakra,20);
 await rest(true);
 assert.equal(target.system.resources.chakra.value,20);
 assert.equal(target.getFlag(ID,'aptitudes').sealedChakra,0);
 assert.equal(restRecovery(target).sealedChakra,0);
});


test('successful unarmed Juuken block still applies Tenketsu once, unless the defender owns it',async()=>{
 for(const ownsTenketsu of [false,true]){
  setup();
  const a=actor(player),t=actor(defender);
  a.system.identity.clan='Hyuuga';
  a.system.skills={procurar:{points:4},prontidao:{points:4},rastrear:{points:4}};
  apt(a,'acuidade');apt(a,'res-basico-byakugan');apt(a,'res-basico-tenketsu-byakugan');
  const eye=a.items.find(i=>i.system.catalogKey==='res-basico-byakugan');
  for(const item of a.items.filter(i=>i.system.catalogKey.startsWith('res-basico-'))){
   item.system.capabilityData={schemaVersion:1,definitionId:item.system.catalogKey,accessOrigin:'hyuuga'};
  }
  a.flags[ID]={aptitudes:{active:{'res-basico-byakugan':{sourceItemId:eye.id,scene:'scene:0'}}}};
  a.items.push({id:'juuken',name:'Juuken',type:'power',system:{level:5,powerData:{family:'juuken',track:1}}});
  if(ownsTenketsu)apt(t,'res-basico-tenketsu-byakugan');
  const m=await declare(a,{id:'unarmed'},{juuken:true},[[t.uuid]]);
  assert.equal(e(m).attacks[0].tenketsuDifficulty,17);
  await defense(m,t,0,'bloqueio',{weaponId:'unarmed'});
  rolls.push(6,13,3);
  await attack(m);await defend(m,t);
  assert.equal(e(m).slots[0].result.hit,false);
  if(ownsTenketsu){
   assert.equal(e(m).state,'complete');
   assert.equal(t.system.resources.chakra.value,28);
   continue;
  }
  assert.equal(e(m).slots[0].result.tenketsuOnly,true);
  assert.match(executionCard(e(m)),/Aplicar teste de Vigor do Tenketsu/);
  await apply(m,t);
  assert.equal(e(m).state,'complete');
  assert.equal(e(m).slots[0].applied.tenketsu.sealedChakra,2);
  assert.equal(t.system.resources.chakra.value,26);
  assert.equal(t.system.resources.vitality.value,80);
 }
});


test('Octogram variants use one target, one cost and independent seals, with automatic hits after a critical',async()=>{
 for(const [variant,level,cost,bonus,seal] of [['32',4,4,3,3],['64',6,6,4,4],['128',8,8,8,5]]){
  setup();
  const a=actor(player),t=actor(defender),other=actor(defender);
  a.system.campaign.level=20;
  a.system.identity.clan='Hyuuga';
  a.system.skills={procurar:{points:4},prontidao:{points:4},rastrear:{points:4}};
  apt(a,'acuidade');apt(a,'ataque-multiplo');apt(a,'res-basico-byakugan');apt(a,'res-basico-tenketsu-byakugan');
  const eye=a.items.find(i=>i.system.catalogKey==='res-basico-byakugan');
  for(const item of a.items.filter(i=>i.system.catalogKey.startsWith('res-basico-'))){
   item.system.capabilityData={schemaVersion:1,definitionId:item.system.catalogKey,accessOrigin:'hyuuga'};
  }
  a.flags[ID]={aptitudes:{active:{'res-basico-byakugan':{sourceItemId:eye.id,scene:'scene:0'}}}};
  a.items.push({id:'juuken',name:'Juuken',type:'power',system:{level,powerData:{family:'juuken',track:1}}});
  const opts={octogram:variant};
  await assert.rejects(declare(a,{id:'unarmed'},opts,[[t.uuid],[other.uuid],[t.uuid]]),/mesmo alvo/);
  const m=await declare(a,{id:'unarmed'},opts,[[t.uuid],[t.uuid],[t.uuid]]);
  const base=prepareWeaponAction(a,'unarmed',{juuken:true}).plan.base;
  assert.equal(e(m).attacks[0].damagePool,base+bonus);
  for(let i=0;i<3;i++)await defense(m,t,i);
  if(variant==='64')game.combat={started:true,combatant:{actor:t}};
  rolls.push(15,3,3,3);
  for(let i=0;i<3;i++){
   await attack(m);
   assert.equal(e(m).slots[i].result.hit,true);
   assert.equal(a.system.resources.chakra.value,28-cost);
   await apply(m,t,i);
   assert.equal(e(m).slots[i].applied.sealedChakra,seal);
  }
  assert.equal(e(m).rolls[1].degree,1);
  assert.equal(e(m).slots[2].applied.octogramResistance.failed,true);
  assert.equal(t.system.resources.chakra.value,28-3*seal);
  const {conditionRecords,expireSceneConditions}=await import('../src/automation.mjs');
  const {conditionTurn}=await import('../src/conditions.mjs');
  const active=conditionRecords(t);
  const stunned=active.find(c=>c.key==='atordoado');
  assert.equal(stunned.remaining,variant==='64'?2:1);
  assert.equal(active.some(c=>c.key==='fatigado'),variant!=='32');
  const end=conditionTurn(active,'end');
  if(variant==='64')assert.equal(end.updates.find(c=>c.id===stunned.id).remaining,1);
  else assert.ok(end.expired.includes(stunned.id));
  const start=conditionTurn(active,'start',4,'manual:1');
  const manualStart=start.updates.find(c=>c.id===stunned.id);
  assert.ok(conditionTurn([{...stunned,...manualStart}],'start',4,'manual:2').expired.includes(stunned.id));
  const get=game.settings.get;
  game.settings.get=(id,key)=>key==='sceneEpoch'?1:get(id,key);
  assert.equal(conditionRecords(t).some(c=>c.key==='fatigado'),false);
  await expireSceneConditions(t);
  assert.equal(t.effects.some(c=>c.flags[ID].condition.key==='fatigado'),false);
  assert.equal(e(m).state,'complete');
 }
});


test('Twin Lions activates and renews once per turn, and each strike uses the activated level',async()=>{
 setup();
 const {powerAction,maintainPower,advancePowerPhase}=await import('../src/power-actions.mjs');
 const a=actor(player);
 a.system.campaign.level=16;
 a.system.identity.clan='Hyuuga';
 a.system.skills={procurar:{points:4},prontidao:{points:4},rastrear:{points:4}};
 apt(a,'acuidade');apt(a,'ataque-multiplo');apt(a,'res-basico-byakugan');apt(a,'res-basico-tenketsu-byakugan');
 const eye=a.items.find(i=>i.system.catalogKey==='res-basico-byakugan');
 for(const item of a.items.filter(i=>i.system.catalogKey.startsWith('res-basico-'))){
  item.system.capabilityData={schemaVersion:1,definitionId:item.system.catalogKey,accessOrigin:'hyuuga'};
 }
 a.flags[ID]={currentTurnKey:'first',aptitudes:{active:{'res-basico-byakugan':{sourceItemId:eye.id,scene:'scene:0'}}}};
 a.items.push({id:'juuken',name:'Juuken',type:'power',system:{level:8,powerData:{family:'juuken',track:1}}});
 const run=()=>powerAction({values:{},close:async()=>{}},'power-execute',{},{
  querySelectorAll:()=>[
   {name:'power.id',value:'juuken'},
   {name:'power.effect',value:'twin-lions'},
   {name:'power.level',value:'7'}
  ]
 },{actor:a});
 const prepare=count=>prepareWeaponAction(a,'unarmed',{twinLions:true,count});
 assert.throws(()=>prepare(2),/Ative Punho/);
 await run();
 assert.equal(a.system.resources.chakra.value,24);
 const active=a.system.powerState.active[0];
 await assert.rejects(run(),/já está ativo/);
 await assert.rejects(maintainPower(a,active.id),/já cobre/);
 const p=prepare(3);
 assert.equal(p.plan.action,'Completa');
 assert.deepEqual(p.attacks.map(a=>a.base),[7,7,7]);
 assert.ok(p.attacks.every(a=>a.damagePool===undefined&&a.tenketsuDifficulty===undefined));
 a.flags[ID].currentTurnKey='second';
 assert.throws(()=>prepare(2),/Mantenha Punho/);
 await maintainPower(a,active.id);
 assert.equal(a.system.resources.chakra.value,20);
 await assert.rejects(maintainPower(a,active.id),/já foi processada/);
 assert.equal(prepare(2).plan.action,'Padrão');
 a.flags[ID].currentTurnKey='third';
 await advancePowerPhase(a,'third:end','end');
 assert.equal(a.system.powerState.active.length,0);
});


test('Offensive Kaiten charges once and resolves the same roll against allies and enemies in range',async()=>{
 setup();
 const {powerAction,resolvePowerAttack}=await import('../src/power-actions.mjs');
 const {powerPlan}=await import('../src/power-rules.mjs');
 const {conditionRecords}=await import('../src/automation.mjs');
 const a=actor(player),t=actor(defender),ally=actor(player);
 a.system.identity.clan='Hyuuga';
 apt(a,'acuidade');apt(a,'res-basico-byakugan');
 const eye=a.items.find(i=>i.system.catalogKey==='res-basico-byakugan');
 eye.system.capabilityData={schemaVersion:1,definitionId:eye.system.catalogKey,accessOrigin:'hyuuga'};
 a.flags[ID]={aptitudes:{active:{'res-basico-byakugan':{sourceItemId:eye.id,scene:'scene:0'}}}};
 const power={id:'juuken',name:'Juuken',type:'power',system:{level:6,powerData:{family:'juuken',track:1}}};
 a.items.push(power);
 const plan=level=>powerPlan(power,a.system,a.items,{effect:'kaiten-offense',level},{actor:a});
 assert.equal(plan(5).range,2);
 assert.equal(plan(6).range,5);
 assert.equal(plan(6).damage,8);
 const app={values:{},close:async()=>{}};
 const form={querySelectorAll:()=>[
  {name:'power.id',value:'juuken'},
  {name:'power.effect',value:'kaiten-offense'},
  {name:'power.level',value:'6'}
 ]};
 const execute=()=>powerAction(app,'power-execute',{},form,{actor:a});
 a.system.conditions=[{id:'bound',key:'impedido'}];
 await assert.rejects(execute(),/movimentos livres/);
 assert.equal(a.system.resources.chakra.value,28);
 a.system.conditions=[];
 rolls.push(10,3,15);
 await execute();
 await execute();
 assert.equal(a.system.resources.chakra.value,26);
 const attack=game.messages.find(m=>m.getFlag(ID,'powerAttack'));
 const resolve=(target,distance)=>resolvePowerAttack(attack,target.uuid,{hit:true,distance,'resistStat.0':'vig'});
 await assert.rejects(resolve(a,0),/próprio Kaiten/);
 await assert.rejects(resolve(t,6),/raio de 5 m/);
 await resolve(t,2);
 await resolve(ally,5);
 assert.equal(conditionRecords(t).some(c=>c.key==='caido'),true);
 assert.equal(conditionRecords(ally).some(c=>c.key==='caido'),false);
 assert.ok(t.system.resources.vitality.value<80&&ally.system.resources.vitality.value<80);
 assert.equal((await resolve(t,2)).duplicate,true);
});


function giveActiveEye(a,clan,key){
 a.system.identity.clan=clan;
 apt(a,key);
 const eye=a.items.at(-1);
 eye.system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:clan.toLowerCase()};
 a.flags[ID]={aptitudes:{active:{[key]:{sourceItemId:eye.id,scene:'scene:0'}}}};
}

test('Kaiten charges once and leaves only the damage exceeding its barrier',async()=>{
 setup();
 const a=actor(player),t=actor(defender);
 giveActiveEye(t,'Hyuuga','res-basico-byakugan');
 apt(t,'acuidade');
 t.system.attributes.des=12;
 t.items.push({id:'juuken',name:'Juuken',type:'power',system:{level:5,powerData:{family:'juuken',track:1}}});
 a.system.attributes.for=20;
 const m=await declare(a,weapon(a),{},[[t.uuid]]);
 await defense(m,t,0,'technique',{techniqueId:'juuken',kaiten:true,kaitenLevel:3,kaitenArea:false});
 const start=()=>command(defender,{op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid});
 await start();await start();
 assert.equal(t.system.resources.chakra.value,25);
 rolls.push(4,14);
 await attack(m);await defend(m,t);
 const slot=e(m).slots[0];
 assert.equal(slot.defenseRoll.precision,15);
 assert.deepEqual(slot.result.kaiten,{hardness:9,excess:2,area:false});
 await apply(m,t);
 assert.equal(e(m).slots[0].applied.damage,2);
});

test('Perceptive Dodge uses base LM with Reflexos and without the Intuition bonus',async()=>{
 setup();
 const a=actor(player),t=actor(defender);
 giveActiveEye(t,'Uchiha','res-basico-sharingan');
 t.system.attributes.per=10;t.system.attributes.agi=4;
 apt(t,'reflexos');apt(t,'intuicao');
 a.system.attributes.for=12;
 const m=await declare(a,weapon(a),{},[[t.uuid]]);
 await defense(m,t,0,'esquiva',{perceptive:true});
 rolls.push(8);
 await attack(m);await defend(m,t);
 assert.equal(e(m).rolls[0].total,23);
 assert.equal(e(m).slots[0].result.hit,true);
});


test('Byakugan visual simulation uses 16 and spends its once-per-scene use only on a valid test',async()=>{
 setup();
 const {automationAction}=await import('../src/summary-actions.mjs');
 const a=actor(player);
 giveActiveEye(a,'Hyuuga','res-basico-byakugan');
 const run=stat=>automationAction({values:{stat,kind:'attribute',difficulty:20,byakuganSimulation:true},close:async()=>{}},
  'execute-summary-roll',{}, {querySelectorAll:()=>[]},{actor:a});
 await assert.rejects(run('vig'),/teste visual/);
 await run('per');
 assert.match(game.messages.at(-1).content,/<strong>21<\/strong>/);
 await assert.rejects(run('per'),/Limite de uso/);
});

test('Ichigekishin resolves the held-grapple exception without dealing vitality damage',async()=>{
 setup();
 const {powerAction,resolvePowerAttack}=await import('../src/power-actions.mjs');
 const {conditionRecords}=await import('../src/automation.mjs');
 const a=actor(player),t=actor(defender),huge=actor(defender);
 giveActiveEye(a,'Hyuuga','res-basico-byakugan');apt(a,'acuidade');
 a.items.push({id:'juuken',name:'Juuken',type:'power',system:{level:2,powerData:{family:'juuken',track:1}}});
 huge.system.physical.size='huge';
 rolls.push(3,3);
 await powerAction({values:{},close:async()=>{}},'power-execute',{},{
  querySelectorAll:()=>[{name:'power.id',value:'juuken'},{name:'power.effect',value:'ichigekishin'},{name:'power.level',value:'2'}]
 },{actor:a});
 const message=game.messages.find(m=>m.getFlag(ID,'powerAttack'));
 assert.equal(a.system.resources.chakra.value,26);
 await assert.rejects(resolvePowerAttack(message,t.uuid,{distance:1,hit:true}),/Falha automática/);
 await assert.rejects(resolvePowerAttack(message,huge.uuid,{distance:1,heldGrapple:'yes'}),/não é afetado/);
 await resolvePowerAttack(message,t.uuid,{distance:1,heldGrapple:'yes'});
 assert.equal(t.system.resources.vitality.value,80);
 assert.ok(conditionRecords(t).some(c=>c.key==='caido'));
});


test('Kikaichuu attacks use deployed groups, cannot be blocked and drain chakra without damage',async()=>{
 setup();
 const a=actor(player),t=actor(defender);
 a.system.identity.clan='Aburame';a.system.skills={lidar:{points:4}};
 apt(a,'res-basico-kikaichuu');
 const item=a.items.at(-1);
 item.system.capabilityData={schemaVersion:1,definitionId:item.system.catalogKey,accessOrigin:'aburame'};
 a.system.special=[{id:'reserveA',name:'Kikaichuu',value:2,max:4}];
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{},bindings:{
  [item.id]:[{key:'aburame.reserve',resourceId:'reserveA'}]
 }},aptitudes:{insectDeployments:{[item.id]:{reserveA:2}}}};
 const m=await declare(a,{id:'unarmed'},{insectGroups:2},[[t.uuid]]);
 await assert.rejects(defense(m,t,0,'bloqueio',{weaponId:'unarmed'}),/Bloqueio não permitido/);
 await defense(m,t);
 rolls.push(15);
 await attack(m);await apply(m,t);
 assert.equal(e(m).slots[0].applied.drainedChakra,2);
 assert.equal(a.system.resources.chakra.value,28);
 assert.equal(t.system.resources.chakra.value,26);
 assert.equal(t.system.resources.vitality.value,80);
});


test('Kikai Ninpou uses animal handling and available linked insects, and paid attacks drain once',async()=>{
 setup();
 const {powerAction,resolvePowerAttack}=await import('../src/power-actions.mjs');
 const {powerPlan,availablePowerEffects}=await import('../src/power-rules.mjs');
 const a=actor(player),t=actor(defender);
 a.system.identity.clan='Aburame';a.system.skills={lidar:{points:4}};
 apt(a,'res-basico-kikaichuu');
 const item=a.items.at(-1);
 item.system.capabilityData={schemaVersion:1,definitionId:item.system.catalogKey,accessOrigin:'aburame'};
 a.system.special=[{id:'reserveA',name:'Kikaichuu',value:4,max:4}];
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{},bindings:{
  [item.id]:[{key:'aburame.reserve',resourceId:'reserveA'}]
 }}};
 const power={id:'kikai',name:'Kikai Ninpou',type:'power',system:{level:2,powerData:{family:'kikai-ninpou',track:1,choices:[{effect:'canhao',tier:1},{effect:'orbe',tier:2}]}}};
 a.items.push(power);
 const plan=powerPlan(power,a.system,a.items,{effect:'orbe',level:2},{actor:a});
 assert.equal(plan.range,24);
 assert.equal(plan.damage,6);
 assert.equal(plan.noBlock,true);
 assert.equal(plan.insectGroups,2);
 assert.equal(availablePowerEffects('kikai-ninpou').some(e=>e.key==='energizar'),false);
 const form={querySelectorAll:()=>[
  {name:'power.id',value:'kikai'},{name:'power.effect',value:'orbe'},
  {name:'power.level',value:'2'},{name:'power.targetUuid',value:t.uuid}
 ]};
 const app={values:{},close:async()=>{}};
 a.system.special[0].value=1;
 await assert.rejects(powerAction(app,'power-execute',{},form,{actor:a}),/insuficientes/);
 assert.equal(a.system.resources.chakra.value,28);
 a.system.special[0].value=4;rolls.push(10);
 await powerAction(app,'power-execute',{},form,{actor:a});
 const message=game.messages.find(m=>m.getFlag(ID,'powerAttack'));
 await assert.rejects(resolvePowerAttack(message,t.uuid,{hit:true,defense:'bloqueio'}),/não permite/);
 const first=await resolvePowerAttack(message,t.uuid,{hit:true,defense:'esquiva'});
 assert.equal(first.chakraDrained,2);
 assert.equal(t.system.resources.chakra.value,26);
 assert.equal((await resolvePowerAttack(message,t.uuid,{hit:true})).duplicate,true);
 assert.equal(a.system.special[0].value,4);
});


test('Mangekyou vision cannot be reset by a new activation and only recovers after the first exhaustion',async()=>{
 setup();
 const {changeMangekyouVision,clanCapabilities,changeDoujutsu}=await import('../src/clan-capabilities.mjs');
 const a=actor(player);
 giveActiveEye(a,'Uchiha','res-basico-sharingan');
 const eye=a.items.at(-1);
 a.system.attributes.per=16;
 for(const name of ['nidan-sharingan','sandan-sharingan','mangekyou-sharingan']){
  const key='res-basico-'+name;
  apt(a,key);
  a.items.at(-1).system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'uchiha',reviewReason:'Despertar conferido'};
 }
 const mangekyou=a.items.at(-1);
 let id=0;
 const use=(operation,extra={})=>changeMangekyouVision(a,mangekyou,{operation,requestId:'vision-'+(++id),...extra});
 await use('vision-pair',{pair:'kamui'});
 await assert.rejects(use('vision-spend',{technique:'Amaterasu',amount:2}),/par escolhido/);
 for(let i=0;i<5;i++)await use('vision-spend',{technique:'Kamui curto',amount:2});
 assert.equal(clanCapabilities(a).vision.remaining,0);
 assert.equal(clanCapabilities(a).sharingan,false);
 await assert.rejects(changeDoujutsu(a,eye,{operation:'activate',requestId:'wake-too-soon'}),/impedem/);
 await assert.rejects(use('vision-rest'),/24 horas/);
 game.time.worldTime=86400;
 await use('vision-rest');
 assert.equal(clanCapabilities(a).vision.remaining,5);
 assert.equal(clanCapabilities(a).vision.wear,3);
 await changeDoujutsu(a,eye,{operation:'activate',requestId:'wake-after-rest'});
 for(let i=0;i<5;i++)await use('vision-spend',{technique:'Kamui curto',amount:1});
 assert.equal(clanCapabilities(a).vision.exhaustions,2);
 assert.equal(clanCapabilities(a).sharingan,false);
 game.time.worldTime+=86400;
 await assert.rejects(use('vision-rest'),/primeira exaustão/);
});


test('Sharingan copies expire separately from the memorized technique and hypnosis does not charge retries',async()=>{
 setup();
 const {changeSharinganCopy,declareHypnosis,sharinganCopies}=await import('../src/sharingan-techniques.mjs');
 const a=actor(player);
 giveActiveEye(a,'Uchiha','res-basico-sharingan');
 a.system.attributes.per=10;
 a.system.attributes.int=8;
 for(const key of ['res-basico-nidan-sharingan','res-basico-sandan-sharingan']){
  apt(a,key);
  a.items.at(-1).system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'uchiha'};
 }
 const nidan=a.items.at(-2),sandan=a.items.at(-1);
 apt(a,'fascinar');apt(a,'ilusao-profunda');
 const copy=(id,operation='mimic-copy',extra={})=>changeSharinganCopy(a,nidan,{
  requestId:id,operation,name:'Canhão',reference:'Livro Básico p. 95, versão observada',user:gm,...extra
 });
 await copy('copy1');await copy('copy2');
 await assert.rejects(copy('copy3'),/Limite/);
 await copy('memorize1','mimic-memorize',{copyId:'copy1'});
 game.time.worldTime=7*86400;
 assert.deepEqual(sharinganCopies(a).map(copy=>copy.id),['copy1']);
 const feign=requestId=>declareHypnosis(a,sandan,{requestId,mode:'feign',target:'Atacante',user:player});
 await feign('feign1');await feign('feign1');
 await assert.rejects(feign('feign2'),/Limite/);
 assert.equal(a.system.resources.chakra.value,23);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'hypnosisReceipt')).length,1);
});


test('Byakugan extended and progressive ranges honor turns, elapsed time and chakra',async()=>{
 setup();
 const {clanCapabilities,changeByakuganFocus}=await import('../src/clan-capabilities.mjs');
 const a=actor(player);
 giveActiveEye(a,'Hyuuga','res-basico-byakugan');
 const eye=a.items.at(-1);
 a.system.skills={rastrear:{points:6},procurar:{points:4},prontidao:{points:4}};
 apt(a,'res-basico-tenketsu-byakugan');
 a.items.at(-1).system.capabilityData={schemaVersion:1,definitionId:'res-basico-tenketsu-byakugan',accessOrigin:'hyuuga'};
 const focus=(operation,requestId)=>changeByakuganFocus(a,eye,{operation,requestId});
 assert.equal(clanCapabilities(a).byakuganRange,28);
 await focus('focus-extended','extended');
 assert.equal(clanCapabilities(a).byakuganRange,28);
 a.flags[ID].currentTurnKey='next';
 assert.equal(clanCapabilities(a).byakuganRange,56);
 await focus('focus-progressive','progressive');
 await assert.rejects(focus('focus-confirm','early'),/2 minutos/);
 game.time.worldTime=120;
 await focus('focus-confirm','confirmed');
 assert.equal(clanCapabilities(a).byakuganRange,450);
 assert.equal(a.system.resources.chakra.value,23);
 await focus('focus-end','end-focus');
 assert.equal(clanCapabilities(a).byakuganRange,28);
});

test('Shokaichuu locks the searching groups until the start of the fifth turn',async()=>{
 setup();
 const {changeInsectDeployment,changeShokaSearch}=await import('../src/clan-capabilities.mjs');
 const {advanceAptitudePhase}=await import('../src/aptitude-runtime.mjs');
 const a=actor(player);
 a.system.identity.clan='Aburame';a.system.skills={lidar:{points:4}};
 apt(a,'res-basico-kikaichuu');apt(a,'res-basico-shokaichuu');
 for(const i of a.items)i.system.capabilityData={schemaVersion:1,definitionId:i.system.catalogKey,accessOrigin:'aburame'};
 const item=a.items.at(-1);
 a.system.special=[{id:'reserveA',name:'Shokaichuu',value:4,max:4}];
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{},bindings:{
  [item.id]:[{key:'aburame.reserve',resourceId:'reserveA'}]
 }}};
 await changeInsectDeployment(a,item,{operation:'insects-deploy',amount:2,requestId:'deploy'});
 await changeShokaSearch(a,item,{operation:'shoka-start',amount:2,requestId:'search'});
 assert.equal(a.getFlag(ID,'aptitudes').shokaSearch.radius,40);
 await assert.rejects(changeInsectDeployment(a,item,{operation:'insects-return',amount:1,requestId:'too-soon'}),/fora da busca/);
 for(let i=2;i<=5;i++)await advanceAptitudePhase(a,'turn-'+i,'start');
 assert.equal(a.getFlag(ID,'aptitudes').shokaSearch.remaining,0);
 await changeShokaSearch(a,item,{operation:'shoka-collect',requestId:'collect'});
 assert.equal(a.system.special[0].value,4);
});


test('Kaiten counter uses the defensive roll, allows no new defense for the original attacker and preserves the cost',async()=>{
 setup();
 const {resolvePowerAttack}=await import('../src/power-actions.mjs');
 const a=actor(player),t=actor(defender),other=actor(player);
 giveActiveEye(t,'Hyuuga','res-basico-byakugan');apt(t,'acuidade');
 t.system.attributes.des=12;
 t.items.push({id:'juuken',name:'Juuken',type:'power',system:{level:5,powerData:{family:'juuken',track:1}}});
 const m=await declare(a,weapon(a),{},[[t.uuid]]);
 await defense(m,t,0,'technique',{techniqueId:'juuken',kaiten:true,kaitenLevel:3,kaitenArea:true});
 await command(defender,{op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid});
 rolls.push(4,14);
 await attack(m);await defend(m,t);
 const counter=game.messages.find(message=>message.getFlag(ID,'kaitenCounterKey'));
 assert.equal(counter.getFlag(ID,'powerAttack').degree,3);
 assert.deepEqual(await resolvePowerAttack(counter,other.uuid,{distance:1,hit:false}),{hit:false});
 await assert.rejects(resolvePowerAttack(counter,a.uuid,{distance:3,hit:false}),/raio de 2 m/);
 await resolvePowerAttack(counter,a.uuid,{distance:1,hit:false});
 assert.equal(a.system.resources.vitality.value,59);
 assert.equal(other.system.resources.vitality.value,80);
 assert.equal(t.system.resources.chakra.value,25);
});


test('Rinkaichuu transfer uses distinct reserves and applies cell damage once per turn until treatment',async()=>{
 setup();
 const {transferRinkaichuu}=await import('../src/rinkaichuu.mjs');
 const {processCapabilityCommand}=await import('../src/capability-actions.mjs');
 const {conditionRecords,processConditionPhase,clampResourceChanges}=await import('../src/automation.mjs');
 const a=actor(player),t=actor(defender);
 a.system.identity.clan='Aburame';a.system.skills={lidar:{points:10}};
 apt(a,'res-basico-kikaichuu');apt(a,'res-basico-rinkaichuu');
 for(const i of a.items)i.system.capabilityData={schemaVersion:1,definitionId:i.system.catalogKey,accessOrigin:'aburame'};
 const item=a.items.at(-1);
 a.system.special=[{id:'reserveR',name:'Rinkaichuu',value:6,max:13}];
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{},bindings:{
  [item.id]:[{key:'aburame.reserve',resourceId:'reserveR'}]
 }},aptitudes:{insectDeployments:{[item.id]:{reserveR:2}}}};
 rolls.push(3);
 const command={amount:2,contact:'maintained',targetUuid:t.uuid,requestId:'contact',user:gm};
 await assert.rejects(transferRinkaichuu(a,item,{...command,contact:'touch'}),/um grupo/);
 await transferRinkaichuu(a,item,command);
 await transferRinkaichuu(a,item,command);
 assert.equal(a.getFlag(ID,'aptitudes').insectDeployments[item.id].reserveR,0);
 assert.ok(conditionRecords(t).some(c=>c.key==='fatigado'));
 t.system.resources.vitality.value=1;
 await processConditionPhase(t,'first:start','start');
 await processConditionPhase(t,'first:start','start');
 assert.equal(t.system.resources.vitality.value,0);
 assert.ok(conditionRecords(t).some(c=>c.key==='paralisado'));
 assert.equal(clampResourceChanges(t,{resources:{vitality:{value:5}}})[0].value,0);
 const treatment={operation:'rinka-treat',sourceUuid:a.uuid};
 await assert.rejects(processCapabilityCommand(t,treatment,{user:defender,requestId:'treat-owner'}),/O mestre confirma/);
 await processCapabilityCommand(t,treatment,{user:gm,requestId:'treat-gm'});
 assert.equal(conditionRecords(t).some(c=>c.key==='paralisado'),false);
 assert.equal(clampResourceChanges(t,{resources:{vitality:{value:5}}}).length,0);
});


test('Kidaichuu contact drains two per insect and assigns distinct partners only once',async()=>{
 setup();
 const {clanCapabilities,recordKidaichuuPartnerLoss}=await import('../src/clan-capabilities.mjs');
 const a=actor(player),t=actor(defender);
 a.system.identity.clan='Aburame';a.system.skills={lidar:{points:10}};
 apt(a,'res-basico-kikaichuu');apt(a,'res-basico-kidaichuu');
 for(const i of a.items)i.system.capabilityData={schemaVersion:1,definitionId:i.system.catalogKey,accessOrigin:'aburame'};
 const item=a.items.at(-1);
 a.system.special=[{id:'reserveK',name:'Kidaichuu',value:2,max:4}];
 a.flags[ID]={capabilities:{schemaVersion:1,grants:[],suspensions:{},bindings:{
  [item.id]:[{key:'aburame.reserve',resourceId:'reserveK'}]
 }},aptitudes:{insectDeployments:{[item.id]:{reserveK:2}}}};
 const m=await declare(a,{id:'unarmed'},{insectGroups:2,insectSpecies:'kidaichuu'},[[t.uuid]]);
 await defense(m,t);
 rolls.push(15);
 await attack(m);await apply(m,t);
 assert.equal(t.system.resources.chakra.value,24);
 assert.equal(t.system.resources.vitality.value,80);
 const colony=()=>clanCapabilities(a).insects.find(i=>i.itemId===item.id);
 assert.equal(colony().deployed,0);
 const partner=colony().partners[0];
 assert.equal(partner.amount,2);
 assert.equal(partner.vitality,26);
 await recordKidaichuuPartnerLoss(a,item,{partnerId:partner.id,requestId:'partner-loss'});
 assert.equal(colony().partners.length,0);
 assert.equal(colony().pendingLosses,2);
});


test('Amaterasu uses the agreed nine-metre limit, charges vision and chakra once, and burns once per turn',async()=>{
 setup();
 const {powerAction,resolvePowerAttack,advancePowerPhase}=await import('../src/power-actions.mjs');
 const a=actor(player),t=actor(defender);
 giveActiveEye(a,'Uchiha','res-basico-sharingan');
 a.system.attributes.per=16;
 for(const name of ['nidan-sharingan','sandan-sharingan','mangekyou-sharingan']){
  const key='res-basico-'+name;
  apt(a,key);
  a.items.at(-1).system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'uchiha',reviewReason:'Despertar conferido'};
 }
 const mangekyou=a.items.at(-1);
 a.items.push({id:'katon',name:'Katon',type:'power',system:{level:8,powerData:{family:'katon'}}});
 a.flags[ID].aptitudes.mangekyouVision={remaining:10,wear:0,exhaustions:0,pair:'kagutsuchi-amaterasu'};
 const app={values:{},close:async()=>{}};
 const execute=distance=>powerAction(app,'power-execute',{},{
  querySelectorAll:()=>[
   {name:'power.id',value:mangekyou.id},{name:'power.effect',value:'amaterasu'},
   {name:'power.level',value:'10'},{name:'power.targetUuid',value:t.uuid},
   {name:'power.distance',type:'number',value:distance},{name:'power.visibleTarget',type:'checkbox',checked:true}
  ]
 },{actor:a});
 await assert.rejects(execute(10),/9 m/);
 assert.equal(a.system.resources.chakra.value,28);
 rolls.push(10);
 await execute(9);await execute(9);
 assert.equal(a.system.resources.chakra.value,18);
 assert.equal(a.getFlag(ID,'aptitudes').mangekyouVision.remaining,8);
 const msg=game.messages.find(m=>m.getFlag(ID,'powerAttack'));
 await resolvePowerAttack(msg,t.uuid,{distance:9,amaterasuDefense:'none',hit:false});
 assert.equal(t.system.resources.vitality.value,64);
 t.system.physical.bodyHardness=20;
 await advancePowerPhase(t,'burn:start','start');
 await advancePowerPhase(t,'burn:start','start');
 assert.equal(t.system.resources.vitality.value,60);
});

test('each defender receives a private invitation and sees only applicable weapon or barrier choices',async()=>{
 setup();
 const a=actor(player),t=actor(defender,'Defensor'),u=actor(stranger,'Outro alvo'),w=weapon(a,'staff');
 a.system.attributes.for=12;
 apt(a,'ataque-giratorio');
 const arrow=weapon(t,'arrows'),sheathed=weapon(t);
 sheathed.system.equipped=false;
 for(const family of ['doton','suiton'])t.items.push({id:family,name:'Poder renomeado',type:'power',system:{level:3,powerData:{family,choices:[{effect:'barreira',tier:3}]}}});
 const m=await declare(a,w,{maneuver:'ataque-giratorio',distance:2},[[t.uuid,u.uuid]]);
 const invitations=game.messages.filter(m=>m.getFlag(ID,'defenseInvitation'));
 assert.deepEqual(invitations.map(m=>m.whisper),[[gm.id,defender.id],[gm.id,stranger.id]]);
 assert.doesNotMatch(m.content,/data-defense=/);
 const prevDocument=globalThis.document;
 globalThis.document={createElement:()=>({addEventListener(){}})};
 const labels=async (invite,user)=>{
  game.user=user;
  const list={children:[],replaceChildren(){this.children=[];},append(b){this.children.push(b);}};
  await bindActionExecution(invite,{querySelector:()=>list},()=>{});
  return list.children.map(b=>b.textContent);
 };
 try{
  const own=await labels(invitations[0],defender);
  assert.ok(own.some(l=>/Barreira.*Doton/i.test(l)));
  assert.ok(own.some(l=>/Barreira.*Suiton/i.test(l)));
  assert.ok(!own.some(l=>l.includes('Bloqueio')));
  assert.deepEqual(await labels(invitations[1],stranger),['Esquiva','Antecipar','Evadir · Movimento']);
  assert.deepEqual(await labels(invitations[0],stranger),[]);
 }finally{globalThis.document=prevDocument;game.user=gm;}
 await assert.rejects(defense(m,t,0,'bloqueio',{weaponId:arrow.id}),/Bloqueio não permitido/);
 await assert.rejects(defense(m,t,0,'technique',{barrier:true,techniqueId:sheathed.id}),/técnica defensiva|Barreira/);
 await defense(m,t,0,'technique',{barrier:true,techniqueId:'suiton'});
 assert.equal(e(m).slots[0].defense.techniqueId,'suiton');
 await assert.rejects(defense(m,t),/já foi declarada/);
});

test('a successful elemental barrier forwards only excess base damage at the attack grade',async()=>{
 for(const spirit of [2,20]){
  setup();
  const a=actor(player),t=actor(defender),w=weapon(a,'staff');
  a.system.attributes.for=12;
  t.system.attributes.esp=spirit;
  t.items.push({id:'doton',name:'Doton',type:'power',system:{level:3,powerData:{family:'doton',choices:[{effect:'barreira',tier:3}]}}});
  const m=await declare(a,w,{distance:2},[[t.uuid]]);
  await defense(m,t,0,'technique',{barrier:true,techniqueId:'doton'});
  await command(defender,{op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid});
  rolls=[9,16];
  await attack(m);
  await defend(m,t);
  const result=e(m).slots[0].result,base=e(m).attacks[0].base,degree=e(m).rolls[0].degree;
  assert.equal(result.barrier.excess,Math.max(0,base-result.barrier.hardness));
  if(spirit===2){
   assert.ok(result.barrier.excess>0);
   await apply(m,t);
   assert.equal(t.system.resources.vitality.value,80-result.barrier.excess*degree);
  }else{
   assert.equal(result.hit,false);
   assert.equal(t.system.resources.vitality.value,80);
  }
  assert.equal(e(m).state,'complete');
 }
});

test('measured weapon targets outside reach are refused before the declaration spends resources',async()=>{
 setup();
 const a=actor(player),t=actor(defender),w=weapon(a);
 const request={op:'declare',actorUuid:a.uuid,itemId:w.id,options:{mode:'melee',maneuver:'golpear'},targets:[[t.uuid]]};
 await assert.rejects(command(player,{...request,distances:[[8]]}),/fora do alcance/);
 assert.equal(game.messages.some(m=>m.getFlag(ID,'actionExecution')),false);
 assert.equal(w.system.quantity,10);
 await command(player,{...request,distances:[[null]]});
 const record=e(game.messages.find(m=>m.getFlag(ID,'actionExecution')));
 assert.equal(record.slots[0].distance,null);
});

test('Chute Inverso resolves Finta in the attack and shares the round limit',async()=>{
 setup();
 const source=actor(player),target=actor(defender),flags={};
 game.combat={id:'combat',started:true,round:1,turn:0,getFlag:(_ns,key)=>flags[key],async setFlag(_ns,key,value){flags[key]=value;}};
 source.items.push({id:'chute',name:'Chute Inverso',type:'aptitude',system:{catalogKey:'chute-inverso',catalogBook:'basico',level:1}});
 const declaration={op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'chute-inverso',distance:1},targets:[[target.uuid]]};
 await command(player,declaration);
 const first=game.messages.filter(message=>e(message)).at(-1);
 assert.equal(e(first).attacks[0].cannotBlock,true);
 rolls=[14,6,9];
 await defense(first,target);
 assert.equal(e(first).slots[0].inlineFeint.success,true);
 assert.equal(e(first).slots[0].feint,true);
 await command(player,declaration);
 const second=game.messages.filter(message=>e(message)).at(-1);
 rolls=[9];
 await defense(second,target);
 assert.equal(e(second).slots[0].inlineFeint.used,true);
 assert.equal(e(second).slots[0].feint,false);
 assert.equal(game.messages.some(message=>message.getFlag(ID,'feintRequest')),false);
});

test('Zui Quan failure is independent of sensors and is not rerolled on retry',async()=>{
 setup();
 const {applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 const source=actor(player),target=actor(defender);
 target.flags[ID]={aptitudes:{active:{'estilo-zui-quan':{}}}};
 const attack={attackerUuid:source.uuid,base:5,critical:true,camouflageContext:{directAttack:true,located:true,sensor:true}};
 rolls=[2,3];
 const missed=await applyPhysicalDamage(target,{...attack,sourceId:'first'});
 assert.equal(missed.hit,false);
 assert.equal(missed.camouflage.reason,'Zui Quan');
 assert.equal(target.system.resources.vitality.value,80);
 assert.equal((await applyPhysicalDamage(target,{...attack,sourceId:'first'})).duplicate,true);
 assert.equal((await applyPhysicalDamage(target,{...attack,sourceId:'second'})).hit,true);
 assert.equal(target.system.resources.vitality.value,75);
});

test('Voadora applies the charge defense penalty only through the current turn',async()=>{
 setup();
 const {statPrecision}=await import('../src/automation.mjs');
 const source=actor(player),target=actor(defender);
 game.combat={started:true};
 source.flags[ID]={currentTurnKey:'turn-one'};
 source.items.push({id:'voadora',name:'Voadora',type:'aptitude',system:{catalogKey:'voadora',catalogBook:'basico',level:1}});
 const defenseBefore=statPrecision(source,'esq',{kind:'defense',reaction:true}).precision;
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'voadora',distance:1},targets:[[target.uuid]]});
 const card=game.messages.filter(message=>e(message)).at(-1);
 assert.equal(statPrecision(source,'esq',{kind:'defense',reaction:true}).precision,defenseBefore);
 rolls=[5];
 await defense(card,target);
 assert.equal(statPrecision(source,'esq',{kind:'defense',reaction:true}).precision,defenseBefore-1);
 source.flags[ID].currentTurnKey='turn-two';
 assert.equal(statPrecision(source,'esq',{kind:'defense',reaction:true}).precision,defenseBefore);
});

test('Rebater Projétil spends a matching volley and resolves with CD',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 const projectile=(id,name,quantity)=>({id,name,type:'equipment',system:{catalogKey:'kunai',catalogBook:'basico',quantity,equipped:true},async update(data){patch(this,data);},getFlag(ns,key){return this.flags?.[ns]?.[key];}});
 const thrown=projectile('throw','Kunai atacante',9),parry=projectile('parry','Kunai defensor',6);
 source.items.push(thrown);
 target.items.push(parry,...['apanhar-objetos','saque-rapido'].map(key=>({id:key,name:key,type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1}})));
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:thrown.id,
  options:{mode:'ranged',maneuver:'golpear',distance:5},targets:[[target.uuid]]});
 const card=game.messages.filter(message=>e(message)).at(-1);
 rolls=[7,12];
 await defense(card,target,0,'rebater',{projectileId:parry.id});
 assert.equal(e(card).slots[0].result.hit,false);
 assert.equal(parry.system.quantity,3);
 assert.equal(thrown.system.quantity,6);
 assert.equal(target.system.resources.vitality.value,80);
});

test('Falange detects entry, including a path that leaves the area again',async()=>{
 const {enteredFalange}=await import('../src/action-executions.mjs');
 assert.equal(enteredFalange([3,1,3]),true);
 assert.equal(enteredFalange([1,0,1]),false);
 assert.equal(enteredFalange([3,2,3]),false);
});

function embeddedEquipment(a){
 a.createEmbeddedDocuments=async(type,entries)=>{
  assert.equal(type,'Item');
  return entries.map(entry=>{
   const item={...structuredClone(entry),id:String(++serial),getFlag(ns,key){return this.flags?.[ns]?.[key];},
    async update(data){patch(this,data);},async delete(){a.items.splice(a.items.indexOf(this),1);}};
   a.items.push(item);return item;
  });
 };
}

test('Apanhar Objeto transfers physical ammunition and throws it back only once',async()=>{
 setup();
 const source=actor(player),target=actor(defender),thrown=weapon(source,'kunai',9),blocking=weapon(target,'short-sword');
 blocking.system.equipped=true;apt(target,'apanhar-objetos');embeddedEquipment(target);
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:thrown.id,
  options:{mode:'ranged',maneuver:'golpear',distance:4},targets:[[target.uuid]]});
 const card=game.messages.filter(message=>e(message)).at(-1);
 rolls=[7,12];
 await defense(card,target,0,'bloqueio',{weaponId:blocking.id});
 assert.equal(e(card).slots[0].result.hit,false);
 const action={executionId:card.id,strike:0,targetUuid:target.uuid};
 await command(defender,{...action,op:'catch-projectile'});
 const captured=target.items.find(item=>item.getFlag?.(ID,'caughtProjectile'));
 assert.equal(captured.system.quantity,3);
 assert.equal(thrown.system.quantity,6);
 await command(defender,{...action,op:'return-projectile'});
 const reply=game.messages.filter(message=>e(message)).at(-1);
 assert.equal(e(reply).attacks[0].returnedProjectile,true);
 assert.equal(e(reply).slots[0].targetUuid,source.uuid);
 assert.equal(target.items.includes(captured),false);
 await assert.rejects(command(defender,{...action,op:'return-projectile'}),/indisponível/);
});

test('Roubar transfers at most one compartment after a successful Desarmar',async()=>{
 setup();
 const source=actor(player),target=actor(defender),item=weapon(target,'kunai',12);
 apt(source,'roubar');embeddedEquipment(source);
 item.toObject=()=>({name:item.name,type:item.type,system:structuredClone(item.system)});
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
  options:{mode:'melee',maneuver:'desarmar',distance:1},targets:[[target.uuid]]});
 const card=game.messages.filter(message=>e(message)).at(-1);
 rolls=[15];await defense(card,target);
 assert.equal(e(card).slots[0].canSteal,true);
 const action={op:'steal-after-disarm',executionId:card.id,strike:0,targetUuid:target.uuid,itemId:item.id,hands:true};
 await assert.rejects(command(player,{...action,quantity:11}),/compartimento/);
 await command(player,{...action,quantity:10});
 assert.equal(item.system.quantity,2);
 assert.equal(source.items.find(i=>i.type==='equipment').system.quantity,10);
 await assert.rejects(command(player,{...action,quantity:1}),/mãos livres/);
});

test('Falange offers the entry reaction, resolves a safe step and ends on movement',async()=>{
 setup();
 const source=actor(player),target=actor(defender),staff=weapon(source,'staff');
 staff.system.equipped=true;
 source.flags[ID]={aptitudes:{active:{'instancia-de-falange':{weaponId:staff.id}}}};
 const scene={id:'s',grid:{measurePath:([a,b])=>({distance:Math.abs(a.x-b.x)})},tokens:[]};
 const token=(id,actor,x,disposition)=>({id,actor,disposition,elevation:0,parent:scene,getCenterPoint:(p={x,elevation:0})=>p});
 const guard=token('guard',source,0,1),intruder=token('intruder',target,1,-1);
 scene.tokens=[guard,intruder];
 game.combat={id:'fight',round:1,started:true,scene};
 const hooks=new Map();globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn),once:(name,fn)=>hooks.set(name,fn)};
 globalThis.ui={notifications:{error:error=>assert.fail(error)}};
 registerActionExecutions();
 const move={id:'move',subpathId:'p',origin:{x:2,y:0,elevation:0},destination:{x:1,y:0,elevation:0}};
 await hooks.get('moveToken')(intruder,move);
 const card=game.messages.find(message=>message.getFlag(ID,'falange'));
 assert.ok(card);
 await command(defender,{op:'falange',action:'falange-safe',messageId:card.id});
 assert.match(card.content,/sem ataque oportuno/);
 await hooks.get('moveToken')(guard,move);
 assert.equal(source.flags[ID].aptitudes.active['instancia-de-falange'],undefined);
});

test('Técnica Eficiente upgrades a coordinated hit once without charging chakra',async()=>{
 setup();
 const source=actor(player),target=actor(defender);
 apt(source,'tecnica-eficiente');
 const item={id:'pwr',name:'Ninpou',type:'power',system:{level:2,powerData:{family:'ninpou'}}};
 source.items.push(item);
 const plan={name:'Canhão',effect:'canhao',family:'ninpou',stat:'cd',targets:1,area:null,level:2,damage:4,cost:2,
  range:10,action:'standard',duration:'instant',critical:15,resistances:[],conditions:[],notes:[]};
 source.system.powerState.executions={exec:{plan,options:{id:item.id,targetUuid:target.uuid,distance:3}}};
 await command(player,{op:'declare-power',actorUuid:source.uuid,itemId:item.id,powerExecutionId:'exec',quickResolution:true});
 const card=game.messages.find(message=>e(message));
 rolls=[8];await defense(card,target);
 assert.equal(e(card).slots[0].efficientOffer,true);
 assert.equal(target.system.resources.vitality.value,80);
 rolls=[13];
 const choice={op:'efficient-damage',executionId:card.id,strike:0,targetUuid:target.uuid,use:true};
 await command(player,choice);
 assert.equal(e(card).slots[0].applied.damage,12);
 assert.equal(target.system.resources.vitality.value,68);
 assert.equal(source.system.resources.chakra.value,28);
 await assert.rejects(command(player,choice),/encerrada|indisponível/);
});

test('Domínio do Fogo tests Vigor even when Esquiva succeeds, except against Bloqueio and Suiton',async()=>{
 setup();
 const {resolvePowerAttack}=await import('../src/power-actions.mjs');
 const source=actor(player),target=actor(defender),blocked=actor(defender),suiton=actor(defender);
 const plan={name:'Katon',family:'katon',fireDifficulty:17,damage:5,resistances:[],conditions:[]};
 const card=await ChatMessage.create({flags:{[ID]:{powerAttack:{plan,actorUuid:source.uuid,degree:1,natural:8}}}});
 rolls=[2];
 await resolvePowerAttack(card,target.uuid,{hit:false,defense:'esquiva'});
 assert.ok(target.effects.some(effect=>effect.flags[ID].condition.key==='debilitado'));
 assert.equal(target.system.resources.vitality.value,80);
 await resolvePowerAttack(card,blocked.uuid,{hit:false,defense:'bloqueio'});
 await resolvePowerAttack(card,suiton.uuid,{hit:false,defense:'suiton'});
 assert.equal(blocked.effects.length,0);
 assert.equal(suiton.effects.length,0);
});

test('Técnica Elevada increases skill resistance only in a mixed power',async()=>{
 setup();
 const {resolvePowerAttack}=await import('../src/power-actions.mjs');
 const source=actor(player),first=actor(defender),second=actor(defender);
 const plan={name:'Técnica',family:'ninpou',damage:3,conditions:[],skillResistanceBonus:2,
  resistances:[{stat:['for','escapar'],difficulty:12,alternateDifficulty:13,onFail:[]}]};
 const card=await ChatMessage.create({flags:{[ID]:{powerAttack:{plan,actorUuid:source.uuid,degree:1,natural:8}}}});
 rolls=[9,9];
 await resolvePowerAttack(card,first.uuid,{hit:true,'resistStat.0':'for'});
 await resolvePowerAttack(card,second.uuid,{hit:true,'resistStat.0':'escapar'});
 const checks=game.messages.map(m=>m.getFlag(ID,'difficulty')).filter(n=>n!=null);
 assert.deepEqual(checks,[12,15]);
});

test('Domínio da Terra adds hardness and pays the selected barrier cost only once',async()=>{
 setup();
 const a=actor(player),t=actor(defender),w=weapon(a,'staff');
 a.system.attributes.for=12;apt(t,'dominio-da-terra');
 t.items.push({id:'doton',name:'Doton',type:'power',system:{level:5,powerData:{family:'doton',choices:[{effect:'barreira',tier:3}]}}});
 const m=await declare(a,w,{distance:2},[[t.uuid]]);
 await assert.rejects(defense(m,t,0,'technique',{barrier:true,techniqueId:'doton',barrierLevel:4,barrierExtra:5}),/Barreira/);
 await defense(m,t,0,'technique',{barrier:true,techniqueId:'doton',barrierLevel:4,barrierExtra:3});
 const start={op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid};
 await command(defender,start);
 assert.equal(t.system.resources.chakra.value,21);
 await command(defender,start);
 assert.equal(t.system.resources.chakra.value,21);
 assert.equal(e(m).slots[0].defense.barrierCost,7);
 assert.equal(e(m).slots[0].defense.barrierHardness,12);
});

test('Corpulência pays a declared defensive barrier once without spending before attack revelation',async()=>{
 setup();
 const a=actor(player),t=actor(defender),w=weapon(a,'staff');
 a.system.attributes.for=12;
 t.system.identity.clan='Akimichi';
 t.items.push({id:'corp',type:'aptitude',system:{catalogKey:'res-basico-corpulencia',catalogBook:'basico',level:1,capabilityData:{schemaVersion:1,definitionId:'res-basico-corpulencia',accessOrigin:'akimichi'}}});
 t.items.push({id:'doton',name:'Doton',type:'power',system:{level:3,powerData:{family:'doton',choices:[{effect:'barreira',tier:3}]}}});
 t.system.resources.chakra.value=1;
 const m=await declare(a,w,{distance:2},[[t.uuid]]);
 await assert.rejects(defense(m,t,0,'technique',{barrier:true,techniqueId:'doton'}),/Barreira/);
 await defense(m,t,0,'technique',{barrier:true,techniqueId:'doton',convertedChakra:2});
 assert.equal(e(m).started,false);assert.equal(t.system.resources.vitality.value,80);
 const start={op:'technique-started',executionId:m.id,strike:0,targetUuid:t.uuid};
 await command(defender,start);await command(defender,start);
 assert.equal(t.system.resources.chakra.value,0);assert.equal(t.system.resources.vitality.value,76);
});

test('Domínios do Raio, da Água e do Vento reach the real power execution',async()=>{
 setup();
 const {powerAction,endPower}=await import('../src/power-actions.mjs');
 const {derivedSummary}=await import('../src/automation.mjs');
 const a=actor(player),t=actor(defender);
 for(const key of ['dominio-do-raio','dominio-da-agua','dominio-do-vento'])apt(a,key);
 const power=(family,effect,tier)=>({id:family,name:family,type:'power',system:{level:5,powerData:{family,choices:[{effect,tier}]}}});
 a.items.push(power('raiton','energizar',4),power('suiton','sopro',4),power('fuuton','onda-explosiva',5));
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value}))});
 const cast=(family,effect,extra={})=>powerAction({values:{},close:async()=>{}},'power-execute',{},fields({
  'power.id':family,'power.effect':effect,'power.level':'5',...extra}),{actor:a});
 await cast('raiton','energizar');
 assert.equal(a.system.powerState.active.find(p=>p.effect==='energizar').criticalExpansion,1);
 await cast('suiton','sopro');
 assert.equal(a.getFlag(ID,'aptitudes').water.value,5);
 await cast('suiton','sopro',{'choice.waterMode':'spend'});
 assert.equal(a.getFlag(ID,'aptitudes').water.value,0);
 await cast('fuuton','onda-explosiva',{'modifier.dominio-do-vento':'yes'});
 const wind=a.system.powerState.active.find(p=>p.effect==='dominio-do-vento');
 assert.equal(wind.duration,'sustained');
 const original=derivedSummary(t).movement;
 await powerAction({values:{},render:async()=>{}},'power-area-add',{id:wind.id},fields({'area.targetUuid':t.uuid}),{actor:a});
 assert.equal(derivedSummary(t).movement,Math.ceil(original/2));
 assert.equal(derivedSummary(a).movement>derivedSummary(t).movement,true);
 await endPower(a,wind.id);
 assert.equal(derivedSummary(t).movement,original);
});

test('Domínio Ninpou charges two chakra and links the partial Finta to Flechas only',async()=>{
 setup();
 const a=actor(player),t=actor(defender),flags={};
 game.combat={id:'combat',started:true,round:1,turn:0,getFlag:(_ns,key)=>flags[key],async setFlag(_ns,key,value){flags[key]=value;}};
 const item={id:'arrows',name:'Ninpou',type:'power',system:{level:5,powerData:{family:'ninpou',choices:[{effect:'flechas',tier:3}]}}};
 a.items.push(item);apt(a,'ponto-cego');apt(a,'dominio-ninpou');
 const {powerAction}=await import('../src/power-actions.mjs');
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value}))});
 const cast=(mode)=>powerAction({values:{},close:async()=>{}},'power-execute',{},fields({
  'power.id':item.id,'power.effect':'flechas','power.level':'5','power.tier':'3','power.mode':mode,'power.targetUuid':t.uuid}),{actor:a});
 rolls=[15,7];await cast('domain-feint');
 assert.equal(a.system.resources.chakra.value,26);
 assert.match(game.messages.find(m=>m.getFlag(ID,'feintRequest')).content,/Parcial/);
 await assert.rejects(command(gm,{op:'feint',actorUuid:a.uuid,targetUuid:t.uuid}),/nesta rodada/);
 const {claimFeintAgainst}=await import('../src/action-executions.mjs');
 assert.equal(await claimFeintAgainst(t,a,'wrong',{ranged:true,plan:{family:'ninpou',effect:'canhao'}}),false);
 await cast('normal');
 const card=game.messages.find(m=>e(m));
 assert.ok(card);
 rolls=[5];await defense(card,t);
 assert.equal(e(card).slots[0].feint,true);
 assert.equal(e(card).slots[0].result.hit,true);
 assert.equal(a.system.resources.chakra.value,21);
 assert.equal(await claimFeintAgainst(t,a,'another',{ranged:true,plan:{family:'ninpou',effect:'flechas'}}),false);
});

test('a mapped area shares one attack roll and independently resolves affected defenders',async()=>{
 setup();
 const a=actor(player),first=actor(defender,'Aliado'),second=actor(stranger,'Inimigo'),outside=actor(defender,'Fora');
 const makeToken=(actor,x)=>({uuid:'Scene.map.Token.'+actor.id,actor,name:actor.name,x,y:0,elevation:0,getSize:()=>({width:100,height:100})});
 const tokens=[makeToken(a,-100),makeToken(first,0),makeToken(second,100),makeToken(outside,200)];
 const grid={isSquare:true,size:100,getOffsetRange:({x})=>[0,x/100,1,x/100+1],getTopLeftPoint:({j})=>({x:j*100,y:0})};
 const region={id:'area',isSingleShape:true,polygons:[{points:[0,0,150,0,150,100,0,100]}],elevation:{bottom:0,top:0}};
 const scene={id:'map',grid,tokens,regions:collection([region])};
 game.scenes=collection([scene]);gm.viewedScene=scene.id;
 globalThis.canvas={ready:true,scene,grid,regions:{placeables:[{document:region,isVisible:true}]},
  tokens:{placeables:tokens.map(document=>({document,actor:document.actor,name:document.name,isVisible:true,
   bounds:{x:document.x,y:document.y,width:100,height:100}}))}};
 const item={id:'katon',name:'Katon',type:'power',system:{level:4,powerData:{family:'katon',choices:[{effect:'sopro',tier:4}]}}};
 a.items.push(item);
 const {powerAction}=await import('../src/power-actions.mjs');
 const form=regionId=>({querySelectorAll:()=>Object.entries({'power.id':item.id,'power.effect':'sopro',
  'power.level':'4','area.previewRegion':regionId}).map(([name,value])=>({name,value}))});
 const app={values:{},close:async()=>{}};
 await assert.rejects(powerAction(app,'power-execute',{},form(''),{actor:a}),/Selecione a região/);
 assert.equal(a.system.resources.chakra.value,28);
 await powerAction(app,'power-execute',{},form(region.id),{actor:a});
 assert.equal(a.system.resources.chakra.value,24);
 const card=game.messages.find(message=>e(message));
 assert.deepEqual(e(card).slots.map(s=>s.targetUuid),[first.uuid,second.uuid]);
 const invitations=game.messages.filter(m=>m.getFlag(ID,'defenseInvitation'));
 assert.equal(invitations.length,2);
 assert.ok(invitations[0].whisper.includes(defender.id)&&!invitations[0].whisper.includes(stranger.id));
 assert.ok(invitations[1].whisper.includes(stranger.id)&&!invitations[1].whisper.includes(defender.id));
 tokens[1].x=500;
 rolls=[9,14];
 await defense(card,first);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,0);
 await command(stranger,{op:'defense',executionId:card.id,targetUuid:second.uuid,strike:0,kind:'antecipar'});
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,1);
 assert.equal(e(card).slots[0].result.hit,true);
 assert.equal(e(card).slots[1].result.hit,false);
 assert.equal(first.system.resources.vitality.value,80-e(card).attacks[0].damage*e(card).rolls[0].degree);
 assert.equal(second.system.resources.vitality.value,80);
 assert.equal(outside.system.resources.vitality.value,80);
 assert.equal(e(card).state,'complete');
});

test('an area affects hidden occupants with one shared roll without exposing them in public cards, flags or resistance rolls',async()=>{
 for(const onlyHidden of [false,true]){
  setup();const source=actor(player),visible=actor(defender,'Defensor visível'),hidden=actor(stranger,'SEGREDO');
  const token=(a,x,concealed=false)=>({uuid:'Token.'+a.id,actor:a,name:a.name,hidden:concealed,x,y:0,elevation:0,getSize:()=>({width:100,height:100})});
  const tokens=[token(source,-100),...(!onlyHidden?[token(visible,0)]:[]),token(hidden,100,true)];
  const grid={isSquare:true,size:100,getOffsetRange:({x})=>[0,x/100,1,x/100+1],getTopLeftPoint:({j})=>({x:j*100,y:0})};
  const region={id:'area',isSingleShape:true,polygons:[{points:[0,0,200,0,200,100,0,100]}]};
  const scene={id:'map',grid,tokens,regions:collection([region])};game.scenes=collection([scene]);player.viewedScene=scene.id;
  const item={id:'power',name:'Ninpou',type:'power',system:{level:4,powerData:{family:'ninpou'}}};source.items.push(item);
  const plan={name:'Sopro',effect:'sopro',family:'ninpou',area:'cone',stat:'cd',targets:1,level:4,damage:8,cost:4,range:20,action:'standard',duration:'instant',critical:15,resistances:[{stat:'vig',difficulty:25,onFail:['caido']}],conditions:[],notes:[]};
  source.system.powerState.executions={area:{plan,options:{id:item.id,areaRegion:'area',areaScene:'map'}}};
  await command(player,{op:'declare-power',actorUuid:source.uuid,itemId:item.id,powerExecutionId:'area',quickResolution:true});
  const ledger=game.messages.find(m=>e(m)),mirror=game.messages.find(m=>m.getFlag(ID,'executionView')==='public');
  assert.deepEqual(ledger.whisper,[gm.id]);assert.ok(e(ledger).slots.some(s=>s.targetUuid===hidden.uuid));
  assert.equal(e(mirror).slots.length,onlyHidden?0:1);
  const publicSafe=()=>{for(const m of game.messages.filter(m=>!m.whisper?.length)){assert.ok(!JSON.stringify(m).includes('SEGREDO'));assert.ok(!JSON.stringify(m).includes(hidden.uuid),JSON.stringify(m));}};
  publicSafe();rolls=[9,10,10];
  if(!onlyHidden){await defense(mirror,visible);assert.deepEqual(e(ledger).rolls,{});}
  const invitation=game.messages.find(m=>m.getFlag(ID,'defenseInvitation')?.slotKey==='0:'+hidden.uuid);
  assert.ok(invitation.whisper.includes(stranger.id));assert.ok(!invitation.whisper.includes(player.id));
  const hiddenView=game.messages.get(invitation.getFlag(ID,'defenseInvitation').executionId);
  assert.equal(e(hiddenView).slots.length,1);
  await command(stranger,{op:'defense',executionId:hiddenView.id,targetUuid:hidden.uuid,strike:0,kind:'esquiva'});
  assert.equal(e(ledger).state,'complete');assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,1);
  assert.ok(hidden.system.resources.vitality.value<80);publicSafe();
  const privateResistance=game.messages.find(m=>m.getFlag(ID,'kind')==='power-resistance'&&m.getFlag(ID,'actorUuid')===hidden.uuid);
  assert.deepEqual(privateResistance.whisper,[gm.id]);
  const before=hidden.system.resources.vitality.value,count=game.messages.filter(m=>m.getFlag(ID,'executionRoot')).length;
  await command(player,{op:'refresh',executionId:mirror.id});assert.equal(hidden.system.resources.vitality.value,before);
  assert.equal(game.messages.filter(m=>m.getFlag(ID,'executionRoot')).length,count);publicSafe();
 }
});

test('shadow Shuriken separates drawing, paid preparation and a single projectile, then permits paid free Mane only on its captive',async()=>{
 setup();const source=actor(player,'Nara'),victim=actor(defender),other=actor(stranger);
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.des=20;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:4,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const projectile=weapon(source,'aian',2);
 const {powerAction,endPower,advancePowerPhase,maintainPower}=await import('../src/power-actions.mjs');
 const {conditionRecords,derivedSummary}=await import('../src/automation.mjs');
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value:String(value),...(typeof value==='boolean'?{type:'checkbox',checked:value}:typeof value==='number'?{type:'number'}:{})}))});
 const app=()=>({values:{},close:async()=>{},render:()=>{}}),prepare=app();
 const initial={'power.id':item.id,'power.effect':'kage-shuriken','power.level':4,'power.weaponId':projectile.id};
 await assert.rejects(powerAction(prepare,'power-execute',{},fields(initial),{actor:source}),/Saque/);
 assert.equal(source.system.resources.chakra.value,28);projectile.system.equipped=true;
 await powerAction(prepare,'power-execute',{},fields(initial),{actor:source});
 const prepared=source.system.powerState.active[0];assert.equal(prepared.shadowProjectilePrepared,true);
 assert.equal(source.system.resources.chakra.value,24);assert.equal(projectile.system.quantity,2);
 assert.equal(game.messages.some(m=>e(m)),false);assert.equal(derivedSummary(source).movement,13);
 await powerAction(prepare,'power-execute',{},fields(initial),{actor:source});assert.equal(source.system.resources.chakra.value,24);
 const tokens=collection([source,victim,other].map((a,i)=>({id:'t'+i,uuid:'Token.'+i,actor:a,name:a.name,x:i*3,y:0,elevation:0,width:1,height:1,getCenterPoint:()=>({x:i*3,y:0})})));
 const grid={isSquare:true,size:1,distance:1,measurePath:([a,b])=>({distance:Math.abs(b.x-a.x)})};
 const scene={id:'map',tokens,grid};game.scenes=collection([scene]);gm.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables}};game.user.targets=new Set([placeables[1]]);
 const shot=app(),throwFields={...initial,'power.mode':'projectile','power.shadowPreparedId':prepared.id,'power.shadowIntentionUnknown':true};
 await powerAction(shot,'power-execute',{},fields(throwFields),{actor:source});
 const card=game.messages.find(m=>e(m));assert.equal(e(card).started,false);assert.equal(e(card).attacks[0].cost,0);
 assert.equal(projectile.system.quantity,1);assert.equal(source.system.resources.chakra.value,24);
 rolls=[12,5];await defense(card,victim,0,'antecipar');assert.equal(e(card).state,'complete');
 assert.equal(e(card).slots[0].result.hit,true);assert.equal(victim.system.resources.vitality.value,80);
 assert.equal(conditionRecords(victim).some(c=>c.key==='paralisado'),true);
 const captured=source.system.powerState.active.find(a=>a.shadowSource);assert.equal(captured.remaining,2);
 assert.equal(source.getFlag(ID,'aptitudes').shadowUses,undefined);
 await powerAction(shot,'power-execute',{},fields(throwFields),{actor:source});assert.equal(projectile.system.quantity,1);
 game.user.targets=new Set([placeables[2]]);
 const convert={...initial,'power.effect':'kage-mane','power.mode':'projectile-mane','power.shadowPreparedId':captured.id};
 await assert.rejects(powerAction(app(),'power-execute',{},fields(convert),{actor:source}),/própria vítima/);
 assert.equal(source.system.resources.chakra.value,24);
 game.user.targets=new Set([placeables[1]]);const conversion=app();
 await powerAction(conversion,'power-execute',{},fields(convert),{actor:source});
 const maneCard=game.messages.filter(m=>e(m)).at(-1);assert.equal(e(maneCard).action,'free');
 assert.equal(source.system.resources.chakra.value,20);rolls=[12];await defense(maneCard,victim,0,'none');
 assert.equal(e(maneCard).slots[0].result.hit,true);assert.equal(source.system.powerState.active.length,1);
 assert.equal(source.system.powerState.active[0].effect,'kage-mane');
 assert.equal(victim.system.powerState.active.length,1);assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,1);
 await endPower(source,source.system.powerState.active[0].id);assert.equal(conditionRecords(victim).some(c=>c.key==='paralisado'),false);
 // A second projectile expires after its own two caster turns, without a new charge at launch.
 game.user.targets=new Set();const again=app();await powerAction(again,'power-execute',{},fields(initial),{actor:source});
 const ready=source.system.powerState.active[0];game.user.targets=new Set([placeables[1]]);
 await powerAction(app(),'power-execute',{},fields({...throwFields,'power.shadowPreparedId':ready.id}),{actor:source});
 const last=game.messages.filter(m=>e(m)).at(-1);rolls=[12];await defense(last,victim);
 const root=source.system.powerState.active[0];await advancePowerPhase(source,'projectile-end1','end');assert.equal(source.system.powerState.active[0].remaining,1);
 source.flags[ID].currentTurnKey='next-projectile-turn';await maintainPower(source,root.id);
 await advancePowerPhase(source,'projectile-end2','end');assert.equal(source.system.powerState.active.length,0);
 assert.equal(conditionRecords(victim).some(c=>c.key==='paralisado'),false);assert.equal(projectile.system.quantity,0);
});

test('Kageyose shackles share one attack and individual defenses, with linked hardness and independent escape or area destruction',async()=>{
 setup();const source=actor(player,'Nara'),first=actor(defender),second=actor(stranger);
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.des=20;source.system.attributes.int=11;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:6,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const tokens=collection([source,first,second].map((a,i)=>({id:'t'+i,uuid:'Token.'+i,actor:a,name:a.name,x:i*3,y:0,elevation:0,width:1,height:1,getCenterPoint:()=>({x:i*3,y:0})})));
 const grid={isSquare:true,size:1,distance:1,measurePath:([a,b])=>({distance:Math.abs(b.x-a.x)})};
 const scene={id:'map',tokens,grid};game.scenes=collection([scene]);gm.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables}};game.user.targets=new Set(placeables.slice(1));
 const {powerAction,endPower}=await import('../src/power-actions.mjs');
 const {conditionRecords,saveCondition}=await import('../src/automation.mjs');
 const {applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value:String(value),...(typeof value==='number'?{type:'number'}:{})}))});
 const cast={values:{},close:async()=>{}};
 await powerAction(cast,'power-execute',{},fields({'power.id':item.id,'power.effect':'kageyose','power.mode':'bind','power.level':6}),{actor:source});
 const card=game.messages.find(m=>e(m));assert.equal(e(card).slots.length,2);assert.equal(e(card).action,'standard');
 assert.equal(source.system.resources.chakra.value,22);rolls=[12];await defense(card,first);
 assert.equal(e(card).started,false);assert.deepEqual(rolls,[12]);await command(stranger,{op:'defense',executionId:card.id,targetUuid:second.uuid,strike:0,kind:'esquiva'});
 assert.equal(e(card).state,'complete');assert.equal(first.system.resources.vitality.value,80);
 assert.equal(first.system.physical.objects[0].hardness,12);assert.equal(second.system.physical.objects[0].hardness,12);
 const held=first.system.powerState.active[0].id;rolls=[15];game.user=defender;
 const {combatHUDView}=await import('../src/combat-hud.mjs'),{statPrecision}=await import('../src/automation.mjs');
 const hud=combatHUDView(first,[first],{actorView:first,items:first.items,category:'power-use',actionGroup:'standard'});
 assert.match(hud,/data-stat="for"/);assert.match(hud,/data-stat="escapar"/);
 const escaping=statPrecision(first,'escapar',{kind:'skill',resistingId:conditionRecords(first).find(c=>c.powerReceipt===held).id,manualContext:true}).precision;
 const beforeEscape=game.messages.length;
 await powerAction({values:{},render:()=>{}},'power-escape',{id:held,stat:'escapar'},fields({}),{actor:first});
 assert.equal(game.messages.slice(beforeEscape).find(m=>m.rolls)?.rolls[0].formula,`2d8 + (${escaping})`);
 assert.equal(first.system.physical.objects.length,0);assert.equal(conditionRecords(first).some(c=>c.key==='impedido'),false);
 assert.equal(conditionRecords(second).some(c=>c.key==='impedido'),true);
 game.user=gm;await saveCondition(second,{key:'debilitado',source:'Outra origem'});
 const area={base:3,degree:1,area:true,sourceId:'area-1',reason:'Área',critical:true,camouflageContext:{located:true,areaFraction:1}};
 await applyPhysicalDamage(second,area);assert.equal(second.system.physical.objects[0].hardness,10);
 await applyPhysicalDamage(second,area);assert.equal(second.system.physical.objects[0].hardness,10);
 const remove=second.deleteEmbeddedDocuments.bind(second);let interrupted=true;
 second.deleteEmbeddedDocuments=async(...args)=>{if(interrupted){interrupted=false;throw Error('limpeza interrompida');}return remove(...args);};
 await assert.rejects(applyPhysicalDamage(second,{...area,base:10,sourceId:'area-2'}),/interrompida/);
 const wounded=second.system.resources.vitality.value;
 await applyPhysicalDamage(second,{...area,base:10,sourceId:'area-2'});assert.equal(second.system.resources.vitality.value,wounded);
 assert.equal(second.system.physical.objects.length,0);assert.equal(conditionRecords(second).some(c=>c.key==='impedido'),false);
 assert.equal(conditionRecords(second).some(c=>c.key==='debilitado'),true);
 await endPower(source,source.system.powerState.active[0].id);
 game.user.targets=new Set();await powerAction({values:{},close:async()=>{}},'power-execute',{},fields({'power.id':item.id,'power.effect':'kageyose','power.level':6}),{actor:source});
 assert.equal(source.system.powerState.active[0].shadowObjects,true);assert.equal(source.system.powerState.active[0].filaments,12);
 assert.equal(source.system.powerState.active[0].duration,'sustained');assert.equal(source.system.resources.chakra.value,16);
 await endPower(source,source.system.powerState.active[0].id);game.user.targets=new Set(placeables.slice(1));
 await powerAction({values:{},close:async()=>{}},'power-execute',{},fields({'power.id':item.id,'power.effect':'kageyose','power.mode':'bind','power.level':6}),{actor:source});
 const final=game.messages.filter(m=>e(m)).at(-1);rolls=[12];await defense(final,first);
 await command(stranger,{op:'defense',executionId:final.id,targetUuid:second.uuid,strike:0,kind:'esquiva'});
 assert.equal(second.system.physical.objects.length,1);await endPower(source,source.system.powerState.active[0].id);
 for(const target of [first,second]){assert.equal(target.system.physical.objects.length,0);assert.equal(conditionRecords(target).some(c=>c.key==='impedido'),false);}
 assert.equal(conditionRecords(second).some(c=>c.key==='debilitado'),true);
});

test('Kage Nui aggregates needles per target, waits for individual defenses and upgrades a stitched victim without Escapar',async()=>{
 setup();const source=actor(player,'Nara'),first=actor(defender),second=actor(stranger);
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.des=20;source.system.attributes.int=11;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:6,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const tokens=collection([source,first,second].map((a,i)=>({id:'t'+i,uuid:'Token.'+i,actor:a,name:a.name,x:i*3,y:0,elevation:0,width:1,height:1,getCenterPoint:()=>({x:i*3,y:0})})));
 const grid={isSquare:true,size:1,distance:1,measurePath:([a,b])=>({distance:Math.abs(b.x-a.x)})},scene={id:'map',tokens,grid};
 game.scenes=collection([scene]);gm.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables}};game.user.targets=new Set(placeables.slice(1));
 foundry.applications={api:{DialogV2:{prompt:async()=>[4,8]}}};
 const {powerAction,endPower}=await import('../src/power-actions.mjs'),{conditionRecords}=await import('../src/automation.mjs');
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value:String(value),...(typeof value==='number'?{type:'number'}:{})}))});
 const cast=async(mode='pierce')=>{game.user=gm;await powerAction({values:{},close:async()=>{}},'power-execute',{},fields({'power.id':item.id,'power.effect':'kage-nui','power.mode':mode,'power.level':6}),{actor:source});return game.messages.filter(m=>e(m)).at(-1);};
 first.system.physical.bodyHardness=3;second.system.physical.bodyHardness=3;
 foundry.applications.api.DialogV2.prompt=async()=>[4,9];
 await assert.rejects(cast(),/Distribua/);assert.equal(source.system.resources.chakra.value,28);
 assert.equal(game.messages.some(m=>e(m)),false);
 foundry.applications.api.DialogV2.prompt=async()=>[4,8];
 const card=await cast();assert.equal(e(card).slots.length,2);assert.equal(e(card).attacks[0].precisionBonus,0);
 assert.deepEqual(e(card).slots.map(s=>s.powerBase),[4,8]);assert.equal(source.system.resources.chakra.value,22);
 assert.match(executionCard(e(card)),/Agulhas: 4 · dano base 4/);assert.match(executionCard(e(card)),/Agulhas: 8 · dano base 8/);
 rolls=[12];await defense(card,first);assert.equal(e(card).started,false);assert.deepEqual(rolls,[12]);
 await command(stranger,{op:'defense',executionId:card.id,targetUuid:second.uuid,strike:0,kind:'esquiva'});
 assert.equal(e(card).state,'complete');assert.equal(first.system.resources.vitality.value,77);assert.equal(second.system.resources.vitality.value,65);
 assert.equal(source.system.powerState.active.length,0);assert.equal(first.effects.length,0);
 first.system.physical.bodyHardness=0;game.user.targets=new Set([placeables[1]]);
 const low=await cast('stitch');rolls=[8];await defense(low,first);
 assert.equal(source.system.powerState.active.length,0);assert.equal(conditionRecords(first).some(c=>c.key==='impedido'),false);
 source.system.resources.chakra.value=28;first.system.resources.vitality.value=80;
 const sewn=await cast('stitch');assert.equal(e(sewn).action,'full');rolls=[12];await defense(sewn,first);
 assert.ok(conditionRecords(first).some(c=>c.key==='impedido'));
 const oldRoot=source.system.powerState.active[0].id;assert.equal(source.system.powerState.active[0].duration,'sustained');
 assert.equal(first.system.physical.objects[0].hardness,12);
 const bound=first.system.powerState.active[0];assert.equal(bound.plan.resistances[0].stat,'for');
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 const hud=combatHUDView(first,[first],{actorView:first,items:first.items,category:'power-use',actionGroup:'standard'});
 assert.match(hud,/data-stat="for"/);assert.doesNotMatch(hud,/data-stat="escapar"/);
 first.system.resources.vitality.value=80;
 const repeated=await cast('stitch');rolls=[4];await defense(repeated,first);
 assert.equal(e(repeated).state,'complete');assert.ok(conditionRecords(first).some(c=>c.key==='paralisado'));
 assert.equal(conditionRecords(first).some(c=>c.key==='impedido'),false);
 assert.equal(first.system.physical.objects.length,1);assert.equal(first.system.powerState.active.length,1);
 assert.equal(source.system.powerState.active.some(a=>a.id===oldRoot),false);
 const current=source.system.powerState.active[0];assert.equal(current.duration,'concentration');
 await endPower(source,current.id);assert.equal(first.system.physical.objects.length,0);assert.equal(first.system.powerState.active.length,0);
 assert.equal(conditionRecords(first).some(c=>c.key==='paralisado'),false);
});

test('Hachimon opens and raises without renewing duration, doubles only its damage Strength and restores independent fatigue on closing',async()=>{
 setup();const source=actor(player,'Portões');source.system.identity.clan='Hachimon Tonkou';source.system.campaign.level=20;
 game.combat={id:'fight',started:true,round:1};
 const item={id:'gates',type:'power',name:'Hachimon Tonkou',system:{level:8,powerData:{family:'hachimon'}}};source.items.push(item);
 const {activateHachimon,advancePowerPhase,endPower}=await import('../src/power-actions.mjs');
 const {saveCondition,conditionRecords,derivedSummary,statPrecision}=await import('../src/automation.mjs');
 const {hachimonProfile}=await import('../src/hachimon-rules.mjs');
 const open=(gate,id)=>activateHachimon(source,item,{level:gate,executionId:id},{user:player,requestId:id});
 await assert.rejects(activateHachimon(source,item,{level:1,executionId:'bad'},{user:stranger,requestId:'bad'}),/controla/);
 const initial=derivedSummary(source);await open(1,'one');await open(1,'one');
 assert.equal(source.system.resources.vitality.value,77);assert.equal(source.system.resources.chakra.value,28);
 const root=source.system.powerState.active[0].id;
 assert.equal(hachimonProfile(source.system).remaining,5);assert.equal(statPrecision(source,'for',{kind:'attribute'}).precision,9);
 assert.equal(prepareWeaponAction(source,'unarmed',{maneuver:'golpear'}).plan.base,5);
 assert.equal(derivedSummary(source).combat.cc,initial.combat.cc);assert.equal(derivedSummary(source).combat.esq,initial.combat.esq);
 assert.equal(derivedSummary(source).movement,16);
 await saveCondition(source,{key:'fatigado',source:'Outra origem'});
 assert.equal(derivedSummary(source).movement,8);await open(2,'two');
 assert.equal(source.system.resources.vitality.value,75);assert.equal(derivedSummary(source).movement,16);
 assert.equal(conditionRecords(source).some(c=>c.key==='fatigado'),false);
 assert.equal(conditionRecords(source,{includeInactive:true}).some(c=>c.key==='fatigado'&&c.disabled),true);
 await advancePowerPhase(source,'gates-end1','end');assert.equal(hachimonProfile(source.system).remaining,4);
 source.flags[ID].currentTurnKey='gates-turn2';await advancePowerPhase(source,'gates-start2','start');await advancePowerPhase(source,'gates-start2','start');
 assert.equal(source.system.resources.vitality.value,73);
 await open(4,'four');assert.equal(source.system.resources.vitality.value,69);assert.equal(hachimonProfile(source.system).remaining,4);
 assert.equal(statPrecision(source,'agi',{kind:'attribute'}).precision,7);assert.equal(derivedSummary(source).combat.esq,initial.combat.esq);
 assert.equal(derivedSummary(source).movement,17);assert.equal(prepareWeaponAction(source,'unarmed',{maneuver:'golpear'}).plan.base,8);
 await endPower(source,root);assert.equal(hachimonProfile(source.system),null);
 assert.equal(conditionRecords(source).filter(c=>c.key==='fatigado').length,2);assert.ok(derivedSummary(source).state.keys.includes('exausto'));
 await assert.rejects(open(1,'cooldown'),/turno completo/);
 await advancePowerPhase(source,'closed-end2','end');await assert.rejects(open(1,'still-cooldown'),/turno completo/);
 source.flags[ID].currentTurnKey='gates-turn3';await advancePowerPhase(source,'closed-start3','start');await advancePowerPhase(source,'closed-end3','end');
 await open(1,'reopened');assert.equal(source.getFlag(ID,'aptitudes').hachimon.uses,2);
 assert.equal(source.system.attributes.for,8);assert.equal(source.system.attributes.agi,6);
});

test('heavy weapon attacks wait for declared defense, spend future wear once and keep a minimum degree only on a hit',async()=>{
 for(const kind of ['antecipar','esquiva','bloqueio']){
  setup();game.combat={id:'fight',started:true,round:1};
  const source=actor(player),target=actor(defender),block=weapon(target,'staff');
  source.system.identity.clan='Hachimon Tonkou';source.system.campaign.level=20;
  const gates={id:'gates',type:'power',name:'Hachimon',system:{level:8,powerData:{family:'hachimon'}}};source.items.push(gates);
  const {activateHachimon,commitHachimonHeavy}=await import('../src/power-actions.mjs');
  const {conditionRecords}=await import('../src/automation.mjs');
  await activateHachimon(source,gates,{level:2,executionId:'open'},{user:player,requestId:'open'});
  await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',
   options:{mode:'melee',maneuver:'golpear',distance:1,hachimonHeavy:true},targets:[[target.uuid]]});
  const card=game.messages.find(m=>e(m));assert.equal(e(card).started,false);assert.equal(source.system.resources.vitality.value,78);
  assert.match(executionCard(e(card)),/<h3>Ataque desarmado · Ataque Pesado<\/h3>/);
  assert.equal(source.system.powerState.active.some(a=>a.hachimon),true);
  rolls=kind==='bloqueio'?[2,3]:[4,4,3];
  if(kind==='antecipar'){
   const create=ChatMessage.create;ChatMessage.create=async data=>{if(data.flags?.[ID]?.weaponAttack)throw Error('postagem interrompida');return create(data);};
   await assert.rejects(defense(card,target,0,kind),/postagem interrompida/);
   assert.equal(source.system.resources.vitality.value,70);assert.ok(e(card).attackDice[0]);
   ChatMessage.create=create;await attack(card);
  }else await defense(card,target,0,kind,kind==='bloqueio'?{weaponId:block.id}:{});
  assert.equal(e(card).state,'complete');assert.equal(source.system.resources.vitality.value,70);assert.equal(source.system.resources.chakra.value,28);
  assert.equal(source.system.powerState.active.some(a=>a.hachimon),false);assert.ok(conditionRecords(source).some(c=>c.key==='exausto'));
  assert.equal(target.system.resources.vitality.value,kind==='esquiva'?80:56);
  assert.equal(conditionRecords(target).some(c=>c.key==='caido'),kind!=='esquiva');
  if(kind==='antecipar')assert.equal(e(card).rolls[0].critical,false,'guaranteed degree four is not a critical');
  await commitHachimonHeavy(source,e(card).attacks[0],card.id);assert.equal(source.system.resources.vitality.value,70);
  const later=prepareWeaponAction(source,'unarmed',{}).plan;assert.equal(later.minimumDegree,4);assert.equal(later.base,4);
  source.flags[ID].currentTurnKey='next';assert.equal(prepareWeaponAction(source,'unarmed',{}).plan.minimumDegree,undefined);
 }
});

test('heavy minimum degree applies to each strike of a declared Multiple Attack without charging future wear twice',async()=>{
 setup();game.combat={id:'fight',started:true,round:1};
 const source=actor(player),target=actor(defender);source.system.identity.clan='Hachimon Tonkou';source.system.campaign.level=20;
 const gates={id:'gates',type:'power',name:'Hachimon',system:{level:8,powerData:{family:'hachimon'}}};source.items.push(gates);apt(source,'ataque-multiplo');
 const {activateHachimon}=await import('../src/power-actions.mjs');
 await activateHachimon(source,gates,{level:2,executionId:'open'},{user:player,requestId:'open'});
 const card=await declare(source,{id:'unarmed'},{maneuver:'ataque-multiplo',count:2,hachimonHeavy:true},[[target.uuid],[target.uuid]]);
 await defense(card,target,0);await defense(card,target,1);rolls=[10,3,10,15];
 await attack(card);await defend(card,target,0);await apply(card,target,0);
 assert.equal(source.system.resources.vitality.value,70);
 await attack(card);await defend(card,target,1);await apply(card,target,1);
 assert.equal(e(card).state,'complete');assert.equal(target.system.resources.vitality.value,56);
 assert.deepEqual(Object.values(e(card).rolls).map(r=>r.degree),[4,4]);assert.equal(source.system.resources.vitality.value,70);
});

test('eighth-gate heavy attack bypasses declared defenses even when the table normally defends criticals',async()=>{
 setup();game.combat={id:'fight',started:true,round:1};
 const get=game.settings.get;game.settings.get=(ns,key)=>key==='houseRules'?{criticalSkipsDefense:false}:get(ns,key);
 const source=actor(player),target=actor(defender);target.system.resources.vitality={value:200,max:200};
 source.system.identity.clan='Hachimon Tonkou';source.system.campaign.level=20;
 const gates={id:'gates',type:'power',name:'Hachimon',system:{level:8,powerData:{family:'hachimon'}}};source.items.push(gates);
 const {activateHachimon}=await import('../src/power-actions.mjs');
 await activateHachimon(source,gates,{level:8,executionId:'open'},{user:player,requestId:'open'});
 await command(player,{op:'declare',quickResolution:true,actorUuid:source.uuid,itemId:'unarmed',options:{mode:'melee',maneuver:'golpear',distance:1,hachimonHeavy:true},targets:[[target.uuid]]});
 const card=game.messages.find(m=>e(m));
 await assert.rejects(defense(card,target,0,'antecipar'),/não permite defesa/);
 assert.equal(source.system.powerState.active.some(a=>a.hachimon),true);
 rolls=[2,3];await defense(card,target,0,'none');
 assert.equal(e(card).state,'complete');assert.equal(e(card).rolls[0].critical,true);assert.equal(e(card).rolls[0].degree,4);
 assert.equal(e(card).slots[0].defenseRoll,undefined);assert.equal(target.system.resources.vitality.value,120);
 assert.equal(source.system.resources.vitality.value,80);assert.equal(source.system.powerState.active.find(a=>a.hachimonFatal).remaining,3);
});

test('heavy degree reaches shared power attacks and ordinary Blocking cannot stop it, including a natural failure',async()=>{
 for(const gate of [2,8]){
  setup();game.combat={id:'fight',started:true,round:1};
  const source=actor(player),target=actor(defender),blocking=weapon(target,'staff');
  source.system.identity.clan='Hachimon Tonkou';source.system.campaign.level=20;target.system.resources.vitality={value:200,max:200};
  const gates={id:'gates',type:'power',name:'Hachimon',system:{level:8,powerData:{family:'hachimon'}}},
   item={id:'power',type:'power',name:'Ninpou',system:{level:1,powerData:{family:'ninpou',choices:[{effect:'canhao',tier:1}]}}};source.items.push(gates,item);
  const {activateHachimon,powerAction}=await import('../src/power-actions.mjs');
  await activateHachimon(source,gates,{level:gate,executionId:'open'},{user:player,requestId:'open'});
  const form=heavy=>({querySelectorAll:()=>Object.entries({'power.id':item.id,'power.effect':'canhao','power.level':1,
   'power.targetUuid':target.uuid,'power.distance':3,'power.hachimonHeavy':heavy}).map(([name,value])=>({name,value:String(value),
    ...(typeof value==='boolean'?{type:'checkbox',checked:value}:typeof value==='number'?{type:'number'}:{})}))});
  const cast=async heavy=>{game.user=gm;await powerAction({values:{},close:async()=>{}},'power-execute',{},form(heavy),{actor:source});return game.messages.filter(m=>e(m)).at(-1);};
  const card=await cast(true);assert.equal(source.system.resources.chakra.value,27);assert.equal(source.system.resources.vitality.value,gate===2?78:80);
  assert.equal(e(card).attacks[0].minimumDegree,4);
  rolls=[2,3];await defense(card,target,0,gate===8?'none':'bloqueio',gate===8?{}:{weaponId:blocking.id});
  assert.equal(e(card).state,'complete');assert.equal(e(card).slots[0].result.hit,true);
  assert.equal(e(card).slots[0].defenseRoll,undefined);assert.equal(e(card).slots[0].applied.damage,8);
  assert.equal(source.system.resources.vitality.value,gate===2?70:80);
  assert.equal(e(card).rolls[0].critical,gate===8);
  if(gate===2){
   const next=await cast(false);assert.equal(e(next).attacks[0].minimumDegree,4);
   rolls=[14,3];await defense(next,target);assert.equal(e(next).state,'complete');
   assert.equal(source.system.resources.vitality.value,70);assert.equal(source.system.resources.chakra.value,26);
   assert.equal(e(next).slots[0].applied.damage,8);
  }
 }
});

test('Hachimon repeated use exhausts for a day, reckless damage requires equivalent Iryou, and the eighth gate kills after three closed turns',async()=>{
 setup();game.combat={id:'fight',started:true,round:1};
 const source=actor(player,'Portões');source.system.identity.clan='Hachimon Tonkou';source.system.campaign.level=20;
 const item={id:'gates',type:'power',name:'Hachimon Tonkou',system:{level:8,powerData:{family:'hachimon'}}};source.items.push(item);
 const {activateHachimon,advancePowerPhase,endPower,powerAction}=await import('../src/power-actions.mjs');
 const {conditionRecords,clampResourceChanges,derivedSummary}=await import('../src/automation.mjs');
 const open=(gate,id)=>activateHachimon(source,item,{level:gate,executionId:id},{user:player,requestId:id});
 for(let use=1;use<=4;use++){
  source.flags[ID]??={};source.flags[ID].currentTurnKey='use'+use;
  await open(2,'opening'+use);const root=source.system.powerState.active.find(a=>a.hachimon);
  assert.equal(conditionRecords(source).some(c=>c.key==='exausto'),false);
  await endPower(source,root.id);
  if(use===3)assert.ok(conditionRecords(source).some(c=>c.key==='exausto'&&c.expiresAt===86400));
  if(use<4){source.flags[ID].currentTurnKey='cooldown'+use;await advancePowerPhase(source,'cooldown-end'+use,'end');}
 }
 assert.equal(source.system.resources.vitality.value,72);assert.equal(source.getFlag(ID,'aptitudes').hachimon.permanentLoss,2);
 assert.ok(conditionRecords(source).some(c=>c.key==='inconsciente'));
 assert.equal(clampResourceChanges(source,{resources:{vitality:{value:999}}})[0].value,derivedSummary(source).vitality-2);
 const healer=actor(gm,'Médico');apt(healer,'ninja-medico');
 const healing={id:'medical',type:'power',name:'Iryou Ninjutsu',system:{level:2,powerData:{family:'iryou-ninjutsu'}}};healer.items.push(healing);
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value:String(value),...(typeof value==='number'?{type:'number'}:{})}))});
 await powerAction({values:{},close:async()=>{}},'power-execute',{},fields({'power.id':healing.id,'power.effect':'cura','power.level':1,'power.targetUuid':source.uuid,'power.distance':1}),{actor:healer});
 await advancePowerPhase(source,'lesser-healing-end','end');assert.equal(source.getFlag(ID,'aptitudes').hachimon.permanentLoss,2);
 await endPower(healer,healer.system.powerState.active[0].id);
 await powerAction({values:{},close:async()=>{}},'power-execute',{},fields({'power.id':healing.id,'power.effect':'cura','power.level':2,'power.targetUuid':source.uuid,'power.distance':1}),{actor:healer});
 await advancePowerPhase(source,'equivalent-healing-end','end');assert.equal(source.getFlag(ID,'aptitudes').hachimon.permanentLoss,0);
 const healed=source.system.resources.vitality.value;await advancePowerPhase(source,'equivalent-healing-end','end');assert.equal(source.system.resources.vitality.value,healed);
 const fatal=actor(player,'Oitavo');fatal.system.identity.clan='Hachimon Tonkou';fatal.system.campaign.level=20;fatal.items.push({...item,id:'fatal-gates'});
 await activateHachimon(fatal,fatal.items[0],{level:8,executionId:'eight'},{user:player,requestId:'eight'});
 assert.equal(fatal.system.resources.vitality.value,80);await endPower(fatal,fatal.system.powerState.active[0].id);
 const consequence=fatal.system.powerState.active.find(a=>a.hachimonFatal);assert.equal(consequence.remaining,3);
 assert.ok(conditionRecords(fatal).some(c=>c.key==='paralisado'));await assert.rejects(endPower(fatal,consequence.id),/em curso/);
 await advancePowerPhase(fatal,'fatal-end1','end');await advancePowerPhase(fatal,'fatal-end2','end');assert.equal(fatal.system.resources.vitality.value,80);
 await advancePowerPhase(fatal,'fatal-end3','end');assert.equal(fatal.system.resources.vitality.value,-21);
});

test('Hachimon six-second clock does not repeat initial wear, handles a jump through closure and recovery, and never renews on rewind',async()=>{
 setup();const source=actor(player,'Portões'),item={id:'gates',type:'power',name:'Hachimon',system:{level:1,powerData:{family:'hachimon'}}};source.items.push(item);
 const {activateHachimon,advanceAutomaticPowerTime}=await import('../src/power-actions.mjs');
 const {conditionRecords}=await import('../src/automation.mjs');
 await activateHachimon(source,item,{level:1,executionId:'one'},{user:player,requestId:'one'});assert.equal(source.system.resources.vitality.value,77);
 game.time.worldTime=6;await advanceAutomaticPowerTime(source);await advanceAutomaticPowerTime(source);
 assert.equal(source.system.resources.vitality.value,74);assert.equal(source.system.powerState.active[0].remaining,1);
 game.time.worldTime=0;await advanceAutomaticPowerTime(source);assert.equal(source.system.powerState.active[0].remaining,1);
 game.time.worldTime=36;await advanceAutomaticPowerTime(source);
 assert.equal(source.system.powerState.active.length,0);assert.equal(source.system.resources.vitality.value,74);
 assert.equal(conditionRecords(source).some(c=>c.key==='fatigado'),false);
});

test('Nara binds marked living targets with one roll, keeps individual minion durations and permits only an earned escape',async()=>{
 setup();const source=actor(player,'Nara'),first=actor(defender),second=actor(stranger);
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.int=11;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:4,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const tokens=collection([source,first,second].map((a,i)=>({id:'token'+i,uuid:'Token.'+i,actor:a,name:a.name,x:i*3,y:0,elevation:0,width:1,height:1,getCenterPoint:()=>({x:i*3,y:0})})));
 const grid={isSquare:true,size:1,distance:1,measurePath:([a,b])=>({distance:Math.abs(b.x-a.x)})};
 const scene={id:'map',tokens,grid};game.scenes=collection([scene]);gm.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables}};game.user.targets=new Set(placeables.slice(1));
 const {powerAction,advancePowerPhase,endPower,maintainPower}=await import('../src/power-actions.mjs');
 const {derivedSummary,conditionRecords,saveCondition}=await import('../src/automation.mjs');
 await saveCondition(first,{key:'caido',source:'Preparação do cenário'});await saveCondition(second,{key:'impedido',source:'Outro efeito'});
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value:String(value),...(typeof value==='boolean'?{type:'checkbox',checked:value}:typeof value==='number'?{type:'number'}:{})}))});
 const app={values:{},close:async()=>{},render:()=>{}};
 await powerAction(app,'power-execute',{},fields({'power.id':'kage','power.effect':'kage-shibari','power.level':4,['power.capanga.'+second.uuid]:true}),{actor:source});
 const card=game.messages.find(m=>e(m)),root=source.system.powerState.active[0].id;
 assert.equal(source.system.resources.chakra.value,24);assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,1);
 assert.equal(source.system.powerState.active[0].remaining,4);assert.equal(derivedSummary(source).movement,0);
 assert.throws(()=>prepareWeaponAction(source,'unarmed',{maneuver:'golpear'}),/Concentração/);
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 assert.match(combatHUDView(source,[source],{actorView:source,items:source.items,category:'power-use',actionGroup:'standard'}),/Manter Kage Shibari/);
 rolls=[12];await defense(card,first);assert.deepEqual(e(card).rolls,{});
 await assert.rejects(command(stranger,{op:'defense',executionId:card.id,targetUuid:second.uuid,strike:0,kind:'antecipar'}),/não é permitida/);
 await command(stranger,{op:'defense',executionId:card.id,targetUuid:second.uuid,strike:0,kind:'esquiva'});
 assert.equal(e(card).state,'complete');assert.equal(e(card).rolls[0].precision,8);assert.deepEqual(rolls,[]);
 assert.equal(e(card).slots[0].defenseDifficulty,18);assert.equal(e(card).slots[1].defenseDifficulty,9);
 assert.ok(conditionRecords(first).some(c=>c.key==='paralisado'));assert.ok(conditionRecords(second).some(c=>c.key==='paralisado'));
 assert.equal(first.system.resources.vitality.value,80);assert.equal(second.system.resources.vitality.value,80);
 assert.equal(first.system.powerState.active[0].shadowBinding.turns,2);assert.equal(second.system.powerState.active[0].shadowBinding.turns,4);
 await advancePowerPhase(source,'first-end','end');await advancePowerPhase(source,'first-end','end');
 assert.equal(first.system.powerState.active[0].shadowBinding.turns,1);assert.equal(second.system.powerState.active[0].shadowBinding.turns,3);
 const affected=first.system.powerState.active[0].id;
 game.user=defender;
 assert.match(combatHUDView(first,[first],{actorView:first,items:first.items,category:'power-use',actionGroup:'standard'}),/Livrar-se de Kage Shibari/);
 assert.doesNotMatch(combatHUDView(first,[first],{actorView:first,items:first.items,category:'power-use',actionGroup:'free'}),/data-sns="power-end"/);
 await assert.rejects(powerAction({values:{}},'power-end',{id:affected},fields({}),{actor:first}),/tentativa de saída/);
 rolls=[12];await powerAction({values:{},render:()=>{}},'power-escape',{id:affected},fields({['escape.'+affected+'.stat']:'for'}),{actor:first});
 assert.equal(conditionRecords(first).some(c=>c.key==='paralisado'),false);assert.equal(first.system.powerState.active.length,0);
 assert.equal(second.system.powerState.active.length,1);assert.equal(source.system.powerState.active.length,1);game.user=gm;
 for(let turn=2;turn<=4;turn++){source.flags[ID].currentTurnKey='turn-'+turn;await maintainPower(source,root);await advancePowerPhase(source,'end-'+turn,'end');}
 assert.equal(source.system.powerState.active.length,0);assert.equal(second.system.powerState.active.length,0);
 assert.equal(conditionRecords(second).some(c=>c.key==='paralisado'),false);assert.equal(source.system.resources.chakra.value,24);
 assert.equal(derivedSummary(source).movement,13);
 await endPower(source,root);assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,1);
 game.user.targets=new Set([placeables[1]]);
 const next={values:{},close:async()=>{},render:()=>{}};
 await powerAction(next,'power-execute',{},fields({'power.id':'kage','power.effect':'kage-mane','power.level':4}),{actor:source});
 const failed=game.messages.filter(m=>e(m)).at(-1);assert.equal(e(failed).attacks[0].shadow.turns,4);
 rolls=[2];await defense(failed,first);
 assert.equal(e(failed).state,'complete');assert.equal(e(failed).slots[0].result.hit,false);
 assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,2);assert.equal(source.system.resources.chakra.value,20);
 assert.equal(source.system.powerState.active.length,0);assert.equal(first.system.powerState.active.length,0);
 await powerAction(next,'power-execute',{},fields({'power.id':'kage'}),{actor:source});
 assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,2);assert.equal(source.system.resources.chakra.value,20);
});

test('Kubishibari preserves its capture, pays once, suffocates at caster end and requires two distinct escapes before recovery',async()=>{
 setup();const source=actor(player,'Nara'),victim=actor(defender),outsider=actor(stranger);
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.int=11;source.system.attributes.esp=12;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:8,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const {powerPlan}=await import('../src/power-rules.mjs'),{saveCondition,conditionRecords}=await import('../src/automation.mjs');
 const {activateShadowStrangle,advancePowerPhase,powerAction}=await import('../src/power-actions.mjs');
 const original=powerPlan(item,source.system,source.items,{effect:'kage-shibari',level:4},{actor:source,books:['basico']});
 source.system.powerState.active=[{id:'hold',name:original.name,shadowSource:true,sourceUuid:source.uuid,effect:'kage-shibari',remaining:5,
  duration:'concentration',createdTurn:'outside',plan:original}];
 victim.system.powerState.active=[{id:'bound',name:original.name,shadowBinding:{turns:5},sourceUuid:source.uuid,linkedTo:'hold',duration:'linked',plan:original}];
 await saveCondition(victim,{key:'paralisado',powerReceipt:'bound',powerSourceExecution:'hold'});
 const cmd={targets:[victim.uuid],level:5,executionId:'strangle'};
 await assert.rejects(activateShadowStrangle(source,item,cmd,{user:stranger,requestId:'bad'}),/controla/);
 await assert.rejects(activateShadowStrangle(source,item,{...cmd,targets:[outsider.uuid]},{user:player,requestId:'bad'}),/presa/);
 await activateShadowStrangle(source,item,cmd,{user:player,requestId:'one'});
 await activateShadowStrangle(source,item,cmd,{user:player,requestId:'two'});
 assert.equal(source.system.resources.chakra.value,23);assert.equal(source.system.powerState.active[0].remaining,5);
 assert.equal(source.getFlag(ID,'aptitudes').shadowUses,undefined);
 const strangle=victim.system.powerState.active.find(a=>a.shadowStrangle);
 assert.equal(strangle.shadowStrangle.damage,11);assert.equal(strangle.plan.resistances[0].difficulty,20);
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 const hud=combatHUDView(victim,[victim],{actorView:victim,items:victim.items,category:'power-use',actionGroup:'standard'});
 assert.match(hud,/Livrar-se de Kage Kubishibari/);assert.doesNotMatch(hud,/Livrar-se de Kage Shibari/);
 await advancePowerPhase(source,'source-end','end');await advancePowerPhase(source,'source-end','end');
 assert.equal(victim.system.resources.vitality.value,69);assert.equal(source.system.powerState.active[0].remaining,4);
 assert.equal(victim.system.powerState.active.find(a=>a.shadowBinding).shadowBinding.turns,4);
 const app={values:{},render:()=>{}},form={querySelectorAll:()=>[]};
 await assert.rejects(powerAction(app,'power-escape',{id:'bound'},form,{actor:victim}),/primeiro/);
 rolls=[12];await powerAction(app,'power-escape',{id:strangle.id},form,{actor:victim});
 assert.ok(conditionRecords(victim).some(c=>c.key==='paralisado'));assert.ok(!conditionRecords(victim).some(c=>c.key==='fatigado'));
 rolls=[12];await powerAction(app,'power-escape',{id:'bound'},form,{actor:victim});
 assert.ok(!conditionRecords(victim).some(c=>c.key==='paralisado'));assert.ok(conditionRecords(victim).some(c=>c.key==='fatigado'));
 await advancePowerPhase(victim,'same-turn-end','end');assert.ok(conditionRecords(victim).some(c=>c.key==='fatigado'));
 await advancePowerPhase(victim,'next-turn-start','start');await advancePowerPhase(victim,'next-turn-end','end');
 assert.ok(!conditionRecords(victim).some(c=>c.key==='fatigado'));assert.equal(victim.system.powerState.active.length,0);
});

test('Kubishibari deals its last suffocation tick before capture expiry, including the six-second clock, without repeating damage',async()=>{
 for(const clock of [false,true]){
  setup();const source=actor(player),victim=actor(defender);
  source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.int=11;
  const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:8,powerData:{family:'kagejutsu'}}};source.items.push(item);
  const {powerPlan}=await import('../src/power-rules.mjs'),{saveCondition,conditionRecords}=await import('../src/automation.mjs');
  const {activateShadowStrangle,advancePowerPhase,advanceAutomaticPowerTime}=await import('../src/power-actions.mjs');
  const plan=powerPlan(item,source.system,source.items,{effect:'kage-mane',level:4},{actor:source,books:['basico']});
  source.system.powerState.active=[{id:'hold',name:plan.name,shadowSource:true,sourceUuid:source.uuid,effect:'kage-mane',remaining:1,
   shadowClockAt:0,duration:'concentration',createdTurn:'outside',plan}];
  victim.system.powerState.active=[{id:'bound',name:plan.name,shadowBinding:{turns:1},sourceUuid:source.uuid,linkedTo:'hold',duration:'linked',plan}];
  await saveCondition(victim,{key:'paralisado',powerReceipt:'bound',powerSourceExecution:'hold'});
  await activateShadowStrangle(source,item,{targets:[victim.uuid],level:5,executionId:'strangle'},{user:player,requestId:'one'});
  victim.system.physical.bodyHardness=100;
  if(clock){game.time.worldTime=30;await advanceAutomaticPowerTime(source);await advanceAutomaticPowerTime(source);}
  else{await advancePowerPhase(source,'last-end','end');await advancePowerPhase(source,'last-end','end');}
  assert.equal(victim.system.resources.vitality.value,69);
  assert.equal(source.system.powerState.active.length,0);
  assert.ok(!victim.system.powerState.active.some(a=>a.shadowStrangle||a.shadowBinding));
  assert.ok(conditionRecords(victim).some(c=>c.key==='fatigado'));
  assert.ok(!conditionRecords(victim).some(c=>c.key==='paralisado'));
 }
});

test('Mane seven prepares a missed shadow, sustains it without expiring, then reuses it once with individual close-target defenses',async()=>{
 setup();const source=actor(player,'Nara'),near=actor(defender),far=actor(stranger);
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.int=11;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:8,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const tokens=collection([source,near,far].map((a,i)=>({id:'token'+i,uuid:'Token.'+i,actor:a,name:a.name,
  getCenterPoint:()=>({x:[0,1,3][i],y:0})})));
 const grid={isSquare:true,size:1,distance:1,measurePath:([a,b])=>({distance:Math.abs(b.x-a.x)})};
 const scene={id:'map',tokens,grid};game.scenes=collection([scene]);gm.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables}};game.user.targets=new Set([placeables[1]]);
 const {powerAction,prepareShadowReuse,maintainPower,advancePowerPhase,advanceAutomaticPowerTime,endPower}=await import('../src/power-actions.mjs');
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value:String(value)}))});
 const app=()=>({values:{},close:async()=>{},render:()=>{}});
 await powerAction(app(),'power-execute',{},fields({'power.id':'kage','power.effect':'kage-mane','power.level':7}),{actor:source});
 const missed=game.messages.find(m=>e(m));rolls=[2];await defense(missed,near);
 const root=source.system.powerState.active[0];assert.equal(root.shadowPreparedOffer,true);
 await prepareShadowReuse(source,root.id);await prepareShadowReuse(source,root.id);
 assert.equal(source.system.powerState.active[0].duration,'sustained');assert.equal(source.system.powerState.active[0].remaining,undefined);
 assert.match(combatHUDView(source,[source],{actorView:source,items:source.items,category:'power-use',actionGroup:'partial'}),/Manter Kage Mane/);
 game.time.worldTime=600;await advanceAutomaticPowerTime(source);assert.equal(source.system.powerState.active.length,1);
 source.flags[ID].currentTurnKey='prepared-turn';await maintainPower(source,root.id);await advancePowerPhase(source,'prepared-end','end');
 game.user.targets=new Set([placeables[1],placeables[2]]);
 const reuse=app(),data={'power.id':'kage','power.effect':'kage-mane','power.level':7,'power.mode':'prepared','power.shadowPreparedId':root.id};
 await powerAction(reuse,'power-execute',{},fields(data),{actor:source});
 const card=game.messages.filter(m=>e(m)).at(-1),plan=e(card).attacks[0];
 assert.equal(plan.seals,false);assert.deepEqual(plan.shadow.closeTargets,[near.uuid]);
 assert.equal(source.system.resources.chakra.value,14);assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,2);
 assert.ok(!source.system.powerState.active.some(a=>a.id===root.id));
 await assert.rejects(defense(card,near,0,'antecipar'),/não é permitida/);
 rolls=[8,10];await defense(card,near);
 await command(stranger,{op:'defense',executionId:card.id,targetUuid:far.uuid,strike:0,kind:'antecipar'});
 assert.equal(e(card).state,'complete');assert.equal(e(card).slots[0].result.hit,true);assert.equal(e(card).slots[1].result.hit,false);
 assert.equal(plan.rangedMelee,true);assert.equal(e(card).rolls[0].precision,5);
 assert.equal(e(card).slots[0].defenseDifficulty,15);assert.match(executionCard(e(card)),/Ataque: 16/);
 const reusedRoot=source.system.powerState.active.find(a=>a.shadowSource);
 await endPower(source,reusedRoot.id);
 await assert.rejects(prepareShadowReuse(source,reusedRoot.id),/Somente Mane/);
 await powerAction(reuse,'power-execute',{},fields(data),{actor:source});assert.equal(source.system.resources.chakra.value,14);
});

test('a declared close enemy imposes the general ranged power penalty once and distant shots preserve precision',async()=>{
 for(const distance of [1,3]){
  setup();const source=actor(player),target=actor(defender);
  const item={id:'power',type:'power',name:'Ninpou',system:{level:1,powerData:{family:'ninpou',choices:[{effect:'canhao',tier:1}]}}};source.items.push(item);
  const {powerAction}=await import('../src/power-actions.mjs');
  const form={querySelectorAll:()=>Object.entries({'power.id':'power','power.effect':'canhao','power.level':1,
   'power.targetUuid':target.uuid,'power.distance':distance}).map(([name,value])=>({name,value:String(value),...(typeof value==='number'?{type:'number'}:{})}))};
  const app={values:{},close:async()=>{}};
  await powerAction(app,'power-execute',{},form,{actor:source});
  const card=game.messages.find(m=>e(m));rolls=[10];await defense(card,target);
  assert.equal(e(card).rolls[0].precision,distance===1?8:11);
  assert.equal(source.system.resources.chakra.value,27);
  await powerAction(app,'power-execute',{},form,{actor:source});assert.equal(source.system.resources.chakra.value,27);
 }
});

test('guided Mane requires a willing ally, leaves it free, and consumes the weak connection only when enemies touch its shadow',async()=>{
 setup();const source=actor(player,'Nara'),ally=actor(defender,'Aliado'),enemy=actor(stranger,'Inimigo');
 source.system.identity.clan='Nara';source.system.campaign.level=20;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:8,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const tokens=collection([source,ally,enemy].map((actor,i)=>({id:'token'+i,uuid:'Token.'+i,actor,name:actor.name,x:[0,3,4][i],y:0,elevation:0,width:1,height:1,
  getCenterPoint(){return {x:this.x+.5,y:.5};}})));
 const grid={isSquare:true,size:1,distance:1,getOffsetRange:r=>[Math.floor(r.y),Math.floor(r.x),Math.ceil(r.y+r.height),Math.ceil(r.x+r.width)],
  getCenterPoint:({i,j})=>({x:j+.5,y:i+.5}),measurePath:([a,b])=>({distance:Math.abs(b.x-a.x)})};
 const scene={id:'map',tokens,grid};game.scenes=collection([scene]);gm.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables,controlled:[placeables[0]]}};
 const {activateGuidedShadow,powerAction,advanceAutomaticPowerTime}=await import('../src/power-actions.mjs');
 const {conditionRecords,derivedSummary}=await import('../src/automation.mjs');
 player.viewedScene='map';
 const commandData={sceneId:'map',sourceTokenId:'token0',targetTokenId:'token1',executionId:'guide',options:{level:8,allyConsent:true}};
 await assert.rejects(activateGuidedShadow(source,item,commandData,{user:stranger,requestId:'bad'}),/controla/);
 await assert.rejects(activateGuidedShadow(source,item,{...commandData,options:{level:8}},{user:player,requestId:'bad'}),/aceita/);
 await activateGuidedShadow(source,item,commandData,{user:player,requestId:'one'});
 await activateGuidedShadow(source,item,commandData,{user:player,requestId:'two'});
 assert.equal(source.system.resources.chakra.value,20);assert.equal(derivedSummary(ally).movement,13);assert.equal(conditionRecords(ally).length,0);
 assert.equal(source.system.powerState.active[0].remaining,undefined);assert.equal(game.messages.some(m=>m.getFlag(ID,'powerAttack')),false);
 game.time.worldTime=600;await advanceAutomaticPowerTime(source);assert.equal(source.system.powerState.active.length,1);
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 assert.match(combatHUDView(source,[source],{actorView:source,items:source.items,category:'power-use',actionGroup:'other'}),/Libertar sombra guiada/);
 game.user.targets=new Set([placeables[2]]);
 const data={'power.id':'kage','power.effect':'kage-mane','power.level':8,'power.mode':'guided','power.shadowGuidedId':'guide'};
 const form={querySelectorAll:()=>Object.entries(data).map(([name,value])=>({name,value:String(value)}))};
 const app={values:{},close:async()=>{},render:()=>{}};
 tokens[1].x=8;
 await assert.rejects(powerAction(app,'power-execute',{},form,{actor:source}),/até 1 m/);
 assert.equal(source.system.resources.chakra.value,20);assert.ok(ally.system.powerState.active.some(a=>a.shadowGuidedLink));
 tokens[1].x=3;
 await powerAction(app,'power-execute',{},form,{actor:source});
 const card=game.messages.find(m=>e(m));assert.equal(e(card).attacks[0].action,'other');assert.equal(e(card).attacks[0].shadow.silent,true);
 assert.equal(source.system.resources.chakra.value,12);assert.equal(ally.system.powerState.active.length,0);
 assert.equal(source.getFlag(ID,'aptitudes').shadowUses.count,2);
 assert.equal(source.system.powerState.active.find(a=>a.shadowSource).remaining,5);
 await assert.rejects(command(stranger,{op:'defense',executionId:card.id,targetUuid:enemy.uuid,strike:0,kind:'bloqueio'}),/não é permitida/);
 rolls=[10];await command(stranger,{op:'defense',executionId:card.id,targetUuid:enemy.uuid,strike:0,kind:'esquiva'});
 assert.equal(e(card).state,'complete');assert.ok(conditionRecords(enemy).some(c=>c.key==='paralisado'));assert.equal(derivedSummary(ally).movement,13);
 await powerAction(app,'power-execute',{},form,{actor:source});assert.equal(source.system.resources.chakra.value,12);
});

test('ending a shadow survives interrupted victim cleanup and orphan reconciliation preserves a newer guided connection',async()=>{
 setup();const source=actor(player,'Nara'),victim=actor(defender);
 source.system.identity.clan='Nara';source.system.campaign.level=20;
 const item={id:'kage',type:'power',name:'Kagejutsu',system:{level:4,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const {saveCondition,conditionRecords}=await import('../src/automation.mjs');
 const {endPower,reconcileActivePowers}=await import('../src/power-actions.mjs');
 source.system.powerState.active=[{id:'old',name:'Mane',family:'kagejutsu',itemId:item.id,sourceUuid:source.uuid,shadowSource:true,
  scene:'scene:0',duration:'concentration',plan:{family:'kagejutsu',level:4}}];
 victim.system.powerState.active=[{id:'bound',shadowBinding:{turns:2},sourceUuid:source.uuid,linkedTo:'old'}];
 await saveCondition(victim,{key:'paralisado',powerReceipt:'bound',powerSourceExecution:'old'});
 await saveCondition(victim,{key:'debilitado',powerReceipt:'unrelated',source:'Outro efeito'});
 const remove=victim.deleteEmbeddedDocuments.bind(victim);let fail=true;
 victim.deleteEmbeddedDocuments=async(...args)=>{if(fail){fail=false;throw Error('gravação interrompida');}return remove(...args);};
 await assert.rejects(endPower(source,'old'),/interrompida/);
 assert.equal(source.system.powerState.active[0].ending,true);assert.equal(source.system.powerState.active[0].active,false);
 assert.ok(conditionRecords(victim).some(c=>c.key==='paralisado'));
 await reconcileActivePowers(source);assert.equal(source.system.powerState.active.length,0);
 assert.ok(!conditionRecords(victim).some(c=>c.key==='paralisado'));assert.ok(conditionRecords(victim).some(c=>c.powerReceipt==='unrelated'));
 source.system.powerState.active=[{id:'new',shadowSource:true,shadowGuided:{allyUuid:victim.uuid},sourceUuid:source.uuid}];
 victim.system.powerState.active=[{id:'orphan',shadowBinding:{turns:2},sourceUuid:source.uuid,linkedTo:'missing'},
  {id:'live-guide',shadowGuidedLink:true,sourceUuid:source.uuid,linkedTo:'new'}];
 await saveCondition(victim,{key:'paralisado',powerReceipt:'orphan',powerSourceExecution:'missing'});
 await reconcileActivePowers(victim);await reconcileActivePowers(victim);
 assert.deepEqual(victim.system.powerState.active.map(a=>a.id),['live-guide']);
 assert.ok(!conditionRecords(victim).some(c=>c.key==='paralisado'));assert.ok(conditionRecords(victim).some(c=>c.powerReceipt==='unrelated'));
 assert.equal(source.system.resources.chakra.value,28);assert.equal(source.system.powerState.active[0].id,'new');
 await saveCondition(victim,{key:'paralisado',powerReceipt:'live-guide',powerSourceExecution:'new'});
 let deletions=0;
 victim.deleteEmbeddedDocuments=async(type,ids)=>{
  for(const id of ids)assert.ok(victim.effects.get(id),'a condição deve existir antes da única remoção');
  deletions++;await Promise.resolve();return remove(type,ids);
 };
 await Promise.all([endPower(source,'new'),endPower(source,'new'),reconcileActivePowers(source)]);
 assert.equal(deletions,1);assert.equal(source.system.powerState.active.length,0);
 assert.equal(victim.system.powerState.active.length,0);
});

test('an empty region remains a legal declared area and rolls once without revealing whether concealed creatures exist',async()=>{
 setup();const source=actor(player),item={id:'power',type:'power',system:{powerData:{family:'ninpou'},level:4}};source.items.push(item);
 const region={id:'area',isSingleShape:true,polygons:[{points:[0,0,100,0,100,100,0,100]}]};
 const scene={id:'map',grid:{isSquare:true,size:100},regions:collection([region]),tokens:[{actor:source,x:-100,y:0,getSize:()=>({width:100,height:100}),uuid:'Token.source'}]};
 scene.grid.getOffsetRange=()=>[0,-1,1,0];scene.grid.getTopLeftPoint=()=>({x:-100,y:0});
 game.scenes=collection([scene]);player.viewedScene='map';
 const plan={name:'Sopro',effect:'sopro',family:'ninpou',area:'cone',stat:'cd',targets:1,level:4,damage:8,cost:4,range:20,action:'standard',duration:'instant',critical:15,resistances:[],conditions:[],notes:[]};
 source.system.powerState.executions={empty:{plan,options:{id:item.id,areaRegion:'area',areaScene:'map'}}};
 await command(player,{op:'declare-power',actorUuid:source.uuid,itemId:item.id,powerExecutionId:'empty',quickResolution:true});
 const card=game.messages.find(m=>e(m));assert.deepEqual(e(card).slots,[]);rolls=[9];await attack(card);
 assert.equal(e(card).state,'complete');assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,1);
});

test('damage tests concentration once, keeps private dice private and releases an unlinked token without deleting unrelated conditions',async()=>{
 setup();const source=actor(player),worldActor=actor(defender),target=actor(defender);
 actors.splice(actors.indexOf(target),1);target.id=worldActor.id;target.uuid='Scene.map.Token.test.Actor.'+worldActor.id;
 game.scenes=collection([{id:'map',tokens:[{actor:target,actorLink:false}]}]);
 source.system.skills.concentracao={points:10};
 source.system.powerState.active=[{id:'hold',name:'Kage Shibari',duration:'concentration',sourceUuid:source.uuid,shadowSource:true,requiresImmobile:true,remaining:5,plan:{level:4}}];
 target.system.powerState.active=[{id:'hold:target',sourceUuid:source.uuid,linkedTo:'hold',duration:'linked',plan:{}}];
 const {saveCondition,conditionRecords}=await import('../src/automation.mjs');
 await saveCondition(target,{key:'paralisado',powerReceipt:'hold:target',powerSourceExecution:'hold'});
 await saveCondition(target,{key:'debilitado',powerReceipt:'unrelated-hold-text',source:'Outro efeito'});
 const {applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 const first={fixed:1,sourceId:'hit-one',critical:true,privateRecipients:[gm.id],camouflageContext:{located:true}};
 rolls=[10];await applyPhysicalDamage(source,first);await applyPhysicalDamage(source,first);
 assert.equal(source.system.resources.vitality.value,79);assert.equal(source.system.powerState.active.length,1);
 const checks=game.messages.filter(m=>m.getFlag(ID,'kind')==='power-concentration');assert.equal(checks.length,1);
 assert.deepEqual(checks[0].whisper,[gm.id]);assert.equal(checks[0].getFlag(ID,'concealedRoll'),true);
 assert.equal(checks[0].getFlag(ID,'difficulty'),17);
 rolls=[2];await applyPhysicalDamage(source,{...first,sourceId:'hit-two'});
 assert.equal(source.system.resources.vitality.value,78);assert.equal(source.system.powerState.active.length,0);
 assert.equal(target.system.powerState.active.length,0);assert.equal(conditionRecords(target).some(c=>c.key==='paralisado'),false);
 assert.ok(conditionRecords(target).some(c=>c.key==='debilitado'));assert.deepEqual(rolls,[]);
});

test('the coordinator accepts a free ending from the caster and rejects a victim bypassing its escape test',async()=>{
 setup();const source=actor(player),target=actor(defender);
 source.system.powerState.active=[{id:'root',sourceUuid:source.uuid,duration:'concentration'}];
 target.system.powerState.active=[{id:'victim',sourceUuid:source.uuid,linkedTo:'root',duration:'linked'}];
 await assert.rejects(command(defender,{op:'end-power',actorUuid:target.uuid,id:'victim'}),/conjurador/);
 await assert.rejects(command(stranger,{op:'end-power',actorUuid:source.uuid,id:'root'}),/conjurador/);
 await command(player,{op:'end-power',actorUuid:source.uuid,id:'root'});
 assert.equal(source.system.powerState.active.length,0);assert.equal(target.system.powerState.active.length,0);
 assert.equal(source.system.resources.chakra.value,28);
});

test('a shadow source ends at its unmaintained later turn without counting or rewriting manual action markers',async()=>{
 setup();const source=actor(player),target=actor(defender);source.flags[ID]={currentTurnKey:'second'};
 const markers=structuredClone(source.system.actions);
 source.system.powerState.active=[{id:'root',sourceUuid:source.uuid,shadowSource:true,remaining:4,createdTurn:'first',duration:'concentration',plan:{level:4}}];
 target.system.powerState.active=[{id:'victim',sourceUuid:source.uuid,linkedTo:'root',duration:'linked',shadowBinding:{turns:4},plan:{}}];
 const {advancePowerPhase}=await import('../src/power-actions.mjs');await advancePowerPhase(source,'second-end','end');
 assert.equal(source.system.powerState.active.length,0);assert.equal(target.system.powerState.active.length,0);
 assert.deepEqual(source.system.actions,markers);
});

test('shadow limits use six-second turns outside combat and recover a partially applied clock update without extending victims',async()=>{
 setup();const source=actor(player),first=actor(defender),second=actor(stranger);
 source.system.powerState.active=[{id:'root',sourceUuid:source.uuid,shadowSource:true,shadowClockAt:0,remaining:6,createdTurn:'outside',duration:'concentration',plan:{level:4}}];
 first.system.powerState.active=[{id:'one',sourceUuid:source.uuid,linkedTo:'root',shadowBinding:{turns:3},duration:'linked',plan:{}}];
 second.system.powerState.active=[{id:'two',sourceUuid:source.uuid,linkedTo:'root',shadowBinding:{turns:6},duration:'linked',plan:{}}];
 const {advanceAutomaticPowerTime}=await import('../src/power-actions.mjs');
 const update=second.update.bind(second);let fail=true;second.update=async data=>{if(fail){fail=false;throw Error('interrupção');}return update(data);};
 game.time.worldTime=6;await assert.rejects(advanceAutomaticPowerTime(source),/interrupção/);
 assert.equal(first.system.powerState.active[0].shadowBinding.turns,2);
 game.time.worldTime=18;await Promise.all([advanceAutomaticPowerTime(source),advanceAutomaticPowerTime(source)]);
 assert.equal(first.system.powerState.active.length,0);assert.equal(second.system.powerState.active[0].shadowBinding.turns,3);
 assert.equal(source.system.powerState.active[0].remaining,3);
 game.time.worldTime=0;await advanceAutomaticPowerTime(source);assert.equal(source.system.powerState.active[0].remaining,3);
 game.time.worldTime=36;await advanceAutomaticPowerTime(source);
 assert.equal(source.system.powerState.active.length,0);assert.equal(second.system.powerState.active.length,0);
 assert.equal(source.system.resources.chakra.value,28);
});

test('marked targets use individual projectile allocations on one attack roll',async()=>{
 setup();
 const a=actor(player),first=actor(defender),second=actor(stranger);
 const tokens=collection([a,first,second].map((actor,i)=>({id:String(i),uuid:'Token.'+i,actor,
  name:actor.name,getCenterPoint:()=>({x:i*3})})));
 const scene={id:'map',tokens,grid:{measurePath:([a,b])=>({distance:Math.abs(a.x-b.x)})}};
 game.scenes=collection([scene]);player.viewedScene=scene.id;
 const {validatePowerGroup}=await import('../src/power-targets.mjs');
 const item={id:'power',type:'power',name:'Ninpou',system:{level:5,powerData:{family:'ninpou'}}};
 const plan={name:'Flechas',effect:'flechas',family:'ninpou',stat:'cd',targets:5,projectiles:5,level:5,damage:10,cost:5,
  range:20,duration:'instant',action:'standard',critical:15,resistances:[],conditions:[],notes:[]};
 a.items.push(item);
 const entries=[{tokenId:'1',projectiles:4},{tokenId:'2',projectiles:1}];
 assert.throws(()=>validatePowerGroup(scene,a,plan,[{tokenId:'1',projectiles:5},entries[1]],'0'),/limite de projéteis/);
 assert.throws(()=>validatePowerGroup(scene,a,{...plan,effect:'raio',targets:1},entries,'0'),/tantos alvos/);
 tokens[2].getCenterPoint=()=>({x:8});
 assert.throws(()=>validatePowerGroup(scene,a,{...plan,effect:'raio',targets:2},entries,'0'),/até 4 m/);
 tokens[2].getCenterPoint=()=>({x:6});
 assert.deepEqual(validatePowerGroup(scene,a,{...plan,effect:'lanca',damage:9},entries,'0').map(s=>s.powerBase),[5,4]);
 a.system.powerState.executions={group:{plan,options:{id:item.id,powerGroup:entries,groupScene:scene.id,groupOrigin:'0'}}};
 await command(player,{op:'declare-power',actorUuid:a.uuid,itemId:item.id,powerExecutionId:'group',quickResolution:true});
 const card=game.messages.find(m=>e(m));
 rolls=[9];await defense(card,first);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,0);
 await command(stranger,{op:'defense',executionId:card.id,targetUuid:second.uuid,strike:0,kind:'esquiva'});
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,1);
 assert.deepEqual(e(card).slots.map(s=>s.applied.damage),[16,4]);
});

test('advanced Flechas rerolls one missed target without asking for another defense',async()=>{
 setup();
 const a=actor(player),t=actor(defender);
 const tokens=collection([a,t].map((actor,i)=>({id:String(i),uuid:'Token.'+i,actor,
  name:actor.name,getCenterPoint:()=>({x:i*3})})));
 const scene={id:'map',tokens,grid:{measurePath:([a,b])=>({distance:Math.abs(a.x-b.x)})}};
 game.scenes=collection([scene]);player.viewedScene=scene.id;
 const item={id:'power',type:'power',name:'Ninpou',system:{level:6,powerData:{family:'ninpou'}}};
 const plan={name:'Flechas',effect:'flechas',family:'ninpou',stat:'cd',targets:6,projectiles:6,level:6,damage:12,cost:6,
  range:20,duration:'instant',action:'standard',critical:15,resistances:[],conditions:[],notes:[],rerollAfterDefense:{multiplier:.5}};
 a.items.push(item);
 a.system.powerState.executions={group:{plan,options:{id:item.id,powerGroup:[{tokenId:'1',projectiles:6}],groupScene:scene.id,groupOrigin:'0'}}};
 await command(player,{op:'declare-power',actorUuid:a.uuid,itemId:item.id,powerExecutionId:'group',quickResolution:true});
 const card=game.messages.find(m=>e(m));
 rolls=[5,9];await defense(card,t);
 assert.equal(e(card).slots[0].result.hit,false);
 assert.equal(e(card).slots[0].applied.damage,12);
 assert.equal(e(card).state,'complete');
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'defenseInvitation')).length,1);
});

test('power execution uses the map selection for Raio before spending chakra',async()=>{
 setup();
 const a=actor(player),b=actor(defender),c=actor(stranger);
 const tokens=collection([a,b,c].map((actor,i)=>({id:String(i),uuid:'Token.'+i,actor,
  name:actor.name,getCenterPoint:()=>({x:[0,4,7][i]})})));
 const scene={id:'map',tokens,grid:{measurePath:([a,b])=>({distance:Math.abs(a.x-b.x)})}};
 const placeables=tokens.map(document=>({document,actor:document.actor,name:document.name}));
 game.scenes=collection([scene]);gm.viewedScene=scene.id;
 game.user.targets=new Set(placeables.slice(1));
 globalThis.canvas={ready:true,scene,tokens:{placeables}};
 const item={id:'power',type:'power',name:'Raiton',system:{level:6,powerData:{family:'raiton',choices:[{effect:'raio',tier:5}]}}};
 a.items.push(item);
 const {powerAction}=await import('../src/power-actions.mjs');
 const form={querySelectorAll:()=>Object.entries({'power.id':item.id,'power.effect':'raio','power.level':'6','power.tier':'5'})
  .map(([name,value])=>({name,value}))};
 await powerAction({values:{},close:async()=>{}},'power-execute',{},form,{actor:a});
 const card=game.messages.find(m=>e(m));
 assert.deepEqual(e(card).slots.map(s=>s.targetUuid),[b.uuid,c.uuid]);
 assert.equal(a.system.resources.chakra.value,22);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,0);
});

test('Ricochete follows the declared order and stops after the first successful defense',async()=>{
 setup();
 const a=actor(player),first=actor(defender,'Primeiro'),second=actor(stranger,'Segundo'),third=actor(defender,'Terceiro');
 a.system.campaign.level=20;
 const tokens=collection([a,first,second,third].map((actor,i)=>({id:String(i),uuid:'Token.'+i,actor,name:actor.name,
  getCenterPoint:()=>({x:[0,4,10,13][i]})})));
 const scene={id:'map',tokens,grid:{measurePath:([a,b])=>({distance:Math.abs(a.x-b.x)})}};
 game.scenes=collection([scene]);gm.viewedScene=scene.id;
 const placeables=tokens.map(document=>({document,actor:document.actor,name:document.name}));
 globalThis.canvas={ready:true,scene,tokens:{placeables}};
 game.user.targets=new Set([placeables[2],placeables[1],placeables[3]]);
 const item={id:'power',type:'power',name:'Ninpou',system:{level:9,powerData:{family:'ninpou',choices:[{effect:'ricochete',tier:9}]}}};
 a.items.push(item);
 foundry.applications={api:{DialogV2:{prompt:async()=>['1','2','3']}}};
 const {powerAction}=await import('../src/power-actions.mjs');
 const {validatePowerGroup}=await import('../src/power-targets.mjs');
 const form={querySelectorAll:()=>Object.entries({'power.id':item.id,'power.effect':'ricochete','power.level':'9','power.tier':'9'})
  .map(([name,value])=>({name,value}))};
 await powerAction({values:{},close:async()=>{}},'power-execute',{},form,{actor:a});
 const firstCard=game.messages.find(m=>e(m));
 const plan=e(firstCard).attacks[0];
 assert.throws(()=>validatePowerGroup(scene,a,plan,[{tokenId:'1'},{tokenId:'1'}],'0'),/repetidas/);
 tokens[3].getCenterPoint=()=>({x:15});
 assert.throws(()=>validatePowerGroup(scene,a,plan,[{tokenId:'1'},{tokenId:'3'}],'0'),/10 m do primeiro/);
 assert.equal(e(firstCard).slots[0].targetUuid,first.uuid);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'defenseInvitation')).length,1);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,0);
 rolls=[9];await defense(firstCard,first);
 const secondCard=game.messages.get(e(firstCard).ricochetNext);
 assert.equal(e(secondCard).slots[0].targetUuid,second.uuid);
 assert.equal(e(secondCard).slots[0].powerBase,e(firstCard).slots[0].powerBase+1);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerAttack')).length,1);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'defenseInvitation')).length,2);
 rolls=[6,13];
 await command(stranger,{op:'defense',executionId:secondCard.id,targetUuid:second.uuid,strike:0,kind:'antecipar'});
 assert.equal(e(secondCard).ricochetStopped,true);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'defenseInvitation')).length,2);
 assert.equal(a.system.resources.chakra.value,19);
 assert.equal(first.system.resources.vitality.value,80-plan.damage*2);
 assert.equal(second.system.resources.vitality.value,80);
 assert.equal(third.system.resources.vitality.value,80);
 await command(player,{op:'refresh',executionId:firstCard.id});
 assert.equal(game.messages.filter(m=>e(m)).length,2);
});

test('Dokujutsu spends one dose and uses Intelligence and the power poison difficulty',async()=>{
 setup();
 const a=actor(player),t=actor(defender);
 a.system.identity.clan='Dokujutsu';a.system.attributes.int=10;a.system.skills.veneficio={points:2};
 apt(a,'quimico');
 const item={id:'dok',name:'Dokujutsu',type:'power',system:{level:4,powerData:{family:'dokujutsu',choices:[{effect:'canhao',tier:1},{effect:'energizar',tier:4}]}}};
 a.items.push(item);
 const dose=weapon(a,'minor-sleep',2);dose.system.inventoryData={kind:'poison',route:'ingestion',dc:99};
 const {powerPlan,availablePowerEffects}=await import('../src/power-rules.mjs');
 const {powerAction,endPower}=await import('../src/power-actions.mjs');
 assert.equal(powerPlan(item,a.system,a.items,{effect:'canhao',level:1},{actor:a}).range,30);
 assert.equal(availablePowerEffects('dokujutsu').some(effect=>effect.key==='barreira'),false);
 const w=weapon(a,'staff');w.system.equipped=true;
 const form=(effect,extra={})=>({querySelectorAll:()=>Object.entries({'power.id':item.id,'power.effect':effect,
  'power.level':'4','power.poisonId':dose.id,...extra}).map(([name,value])=>({name,value}))});
 const app=()=>({values:{},close:async()=>{}});
 await powerAction(app(),'power-execute',{},form('canhao',{'power.targetUuid':t.uuid,'power.poisonRoute':'blood'}),{actor:a});
 const card=game.messages.find(m=>e(m));
 rolls=[9];await defense(card,t);
 const exposure=t.system.inventoryState.poisons[0];
 assert.equal(exposure.route,'blood');
 assert.equal(exposure.dc,17);
 assert.equal(exposure.delay,2);
 assert.equal(dose.system.quantity,1);
 assert.equal(a.system.resources.chakra.value,24);
 await powerAction(app(),'power-execute',{},form('energizar',{'power.weaponId':w.id}),{actor:a});
 const active=a.system.powerState.active.find(p=>p.poisonCoating);
 assert.equal(dose.system.quantity,0);
 assert.equal(a.system.resources.chakra.value,21);
 a.system.attributes.for=12;
 const shot=prepareWeaponAction(a,w.id,{mode:'melee',maneuver:'golpear',distance:1});
 assert.equal(shot.coating.dc,17);
 const {exposePoisonFromWeapon}=await import('../src/inventory-actions.mjs');
 const other=actor(defender);
 await exposePoisonFromWeapon(other,shot.coating,{sourceId:'wound',attackerUuid:a.uuid,damageGrade:1,damage:1,hit:true});
 assert.equal(other.system.inventoryState.poisons[0].dc,17);
 await endPower(a,active.id);
 assert.equal(prepareWeaponAction(a,w.id,{mode:'melee',maneuver:'golpear',distance:1}).coating,null);
});

test('Kagura Shingan tracks its modes and protects only against surprise',async()=>{
 setup();
 const a=actor(player);
 a.system.identity.clan='Kagura Shingan';
 a.system.skills.rastrear={points:4};
 for(const key of ['res-basico-kagura-shingan','res-basico-ryoushitsu-kagura-shingan']){
  apt(a,key);
  a.items.at(-1).system.capabilityData={schemaVersion:1,definitionId:key,accessOrigin:'kagura-shingan'};
 }
 const {clanCapabilities}=await import('../src/clan-capabilities.mjs');
 const {saveCondition,conditionRecords}=await import('../src/automation.mjs');
 const view=()=>clanCapabilities(a).kagura;
 const mode=operation=>command(player,{op:'capability',actorUuid:a.uuid,itemId:a.items[0].id,operation:'kagura-'+operation});
 const standard=(20+4*7)*2;
 assert.equal(view().passive,standard/2);
 await assert.rejects(saveCondition(a,{key:'desprevenido',cause:'surprise'}),/protege.*surpresa/);
 await saveCondition(a,{key:'desprevenido',source:'Outra técnica'});
 assert.equal(conditionRecords(a).some(r=>r.key==='desprevenido'),true);
 game.combat={id:'fight',started:true,round:1,turn:0};
 a.flags[ID]={currentTurnKey:'turn-one'};
 await mode('extended');
 assert.equal(view().range,standard);
 a.flags[ID].currentTurnKey='turn-two';
 assert.equal(view().range,standard*2);
 await mode('progressive');
 game.combat.round=20;assert.equal(view().ready,false);
 game.combat.round=21;assert.equal(view().range,700);
 const hooks=new Map();
 globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn),once:(name,fn)=>hooks.set(name,fn)};
 globalThis.ui={notifications:{error:error=>assert.fail(error)}};
 registerActionExecutions();
 await hooks.get('moveToken')({actor:a},{origin:{x:0},destination:{x:1}});
 assert.equal(view().range,standard/2);
 await mode('suppress');
 assert.equal(view().suppressionDC,16);
 await mode('end');
 assert.equal(view().suppressionDC,null);
 rolls=[12];
 await command(player,{op:'capability',actorUuid:a.uuid,itemId:a.items[0].id,operation:'kagura-genjutsu',difficulty:18});
 const result=game.messages.find(m=>m.getFlag(ID,'kaguraGenjutsuRequest'));
 assert.match(result.flavor,/contra 16.*identificado/);
 assert.deepEqual(result.whisper,[player.id,gm.id]);
});

test('Kagezukami uses declared defense, movement-only capture and authorized resumable map pulls without ownership changes',async()=>{
 setup();const source=actor(player,'Nara'),victim=actor(defender,'Vítima');
 source.system.identity.clan='Nara';source.system.campaign.level=20;source.system.attributes.int=11;
 const item={id:'kage',name:'Kagejutsu',type:'power',system:{level:8,powerData:{family:'kagejutsu'}}};source.items.push(item);
 const tokens=collection([source,victim].map((actor,i)=>({id:'token'+i,uuid:'Token.'+i,actor,name:actor.name,x:i*3,y:0,elevation:0,width:1,height:1,
  getSize:()=>({width:1,height:1}),getCenterPoint(p=this){return {x:p.x+.5,y:p.y+.5};},object:{checkCollision:()=>false},
  moves:0,async move(path){this.moves++;Object.assign(this,path.at(-1));return true;}})));
 const grid={isSquare:true,size:1,distance:1,getOffsetRange:r=>[Math.floor(r.y),Math.floor(r.x),Math.ceil(r.y+r.height),Math.ceil(r.x+r.width)],
  getCenterPoint:({i,j})=>({x:j+.5,y:i+.5}),measurePath:([a,b])=>({distance:Math.hypot(b.x-a.x,b.y-a.y)})};
 const scene={id:'map',tokens,grid};tokens.forEach(t=>t.parent=scene);game.scenes=collection([scene]);gm.viewedScene=player.viewedScene='map';
 const placeables=tokens.map(document=>({actor:document.actor,document,center:document.getCenterPoint(),controlled:document.actor===source}));
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables,controlled:[placeables[0]]}};game.user.targets=new Set([placeables[1]]);
 const {powerAction,endPower}=await import('../src/power-actions.mjs'),{derivedSummary,conditionRecords}=await import('../src/automation.mjs');
 const {pullShadowVictim,validateShadowPull}=await import('../src/nara-movement.mjs'),{combatHUDView}=await import('../src/combat-hud.mjs');
 const original=prepareWeaponAction(victim,'unarmed',{}).plan.precision;
 const fields={'power.id':'kage','power.effect':'kagezukami','power.level':8};
 await powerAction({values:{},close:async()=>{},render:()=>{}},'power-execute',{},
  {querySelectorAll:()=>Object.entries(fields).map(([name,value])=>({name,value:String(value)}))},{actor:source});
 const card=game.messages.find(m=>e(m)),root=source.system.powerState.active[0];
 assert.deepEqual(e(card).rolls,{});rolls=[12];await defense(card,victim);assert.equal(e(card).state,'complete');
 assert.equal(e(card).slots[0].result.hit,true);assert.equal(source.system.resources.chakra.value,20);
 assert.equal(derivedSummary(source).movement,0);assert.equal(derivedSummary(victim).movement,0);
 assert.equal(derivedSummary(victim).state.noActions,false);assert.equal(derivedSummary(victim).state.noReactions,false);
 assert.equal(conditionRecords(victim).length,0);assert.equal(prepareWeaponAction(victim,'unarmed',{}).plan.precision,original);
 assert.match(combatHUDView(source,[source],{actorView:source,items:source.items,category:'power-use',actionGroup:'other'}),/Mover Vítima/);
 const move={sceneId:'map',id:root.id,tokenUuid:tokens[1].uuid,start:{x:3,y:0,elevation:0},destination:{x:5,y:2,elevation:0}};
 await assert.rejects(pullShadowVictim(source,move,{user:stranger,requestId:'bad'}),/controla/);
 assert.throws(()=>validateShadowPull(scene,tokens[0],tokens[1],{x:30,y:0,elevation:0},21),/alcance/);
 tokens[1].object.checkCollision=()=>true;assert.throws(()=>validateShadowPull(scene,tokens[0],tokens[1],move.destination,21),/parede/);
 tokens[1].object.checkCollision=()=>false;assert.throws(()=>validateShadowPull(scene,tokens[0],tokens[1],{x:0,y:0,elevation:0},21),/outra criatura/);
 let persisted={x:3,y:0,elevation:0};tokens[1].toObject=()=>({...persisted});
 let fail=true;tokens[1].move=async path=>{tokens[1].moves++;persisted={...path.at(-1)};if(fail){fail=false;throw Error('conexão');}return true;};
 await assert.rejects(pullShadowVictim(source,move,{user:player,requestId:'pull'}),/conexão/);
 await pullShadowVictim(source,move,{user:player,requestId:'pull'});await pullShadowVictim(source,move,{user:player,requestId:'pull'});
 assert.equal(tokens[1].moves,1);assert.equal(persisted.x,5);assert.equal(persisted.y,2);assert.equal(tokens[1].x,3);assert.equal(source.system.resources.chakra.value,20);
 assert.equal(victim.testUserPermission(player,'OWNER'),false);assert.equal(canvas.tokens.controlled[0],placeables[0]);assert.ok(game.user.targets.has(placeables[1]));
 await endPower(source,root.id);assert.ok(derivedSummary(victim).movement>0);assert.equal(victim.system.powerState.active.length,0);
});

function mentalControlSetup(){
 const f=mentalNetworkSetup();f.tokens.forEach(t=>{
  t.uuid='Scene.mind-map.Token.'+t.id;t.getSize=()=>({width:1,height:1});t.getCenterPoint=function(p=this){return {x:p.x+.5,y:p.y+.5};};
  t.object={checkCollision:()=>false};t.moves=0;t.move=async path=>{t.moves++;Object.assign(t,path.at(-1));return true;};
 });f.data.op='mental-control';f.data.executionId='disorder';
 f.data.targets=f.data.targets.slice(0,3);return f;
}
test('Disorder uses individual immediate Intelligence without attack dice and cancels only temporary active powers on success',async()=>{
 const f=mentalControlSetup();f.targets[1].system.powerState.active=[{id:'temporary',duration:'sustained',sourceUuid:f.targets[1].uuid},{id:'permanent',duration:'permanent',sourceUuid:f.targets[1].uuid}];
 rolls=[16,2];await command(player,f.data);
 const {mindBinding,controlledBodies}=await import('../src/yamanaka-state.mjs');
 assert.equal(mindBinding(f.targets[0]),null);assert.equal(controlledBodies(f.source,'disorder').length,2);
 assert.ok(mindBinding(f.targets[1]));assert.ok(mindBinding(f.targets[2]));
 assert.equal(f.targets[1].system.powerState.active.some(p=>p.id==='temporary'),false);
 assert.equal(f.targets[1].system.powerState.active.some(p=>p.id==='permanent'),true);
 assert.equal(f.source.system.resources.chakra.value,20);assert.equal(f.source.system.resources.vitality.value,80);
 assert.equal(game.messages.filter(m=>e(m)).length,0);assert.deepEqual(rolls,[]);
 assert.equal(f.source.system.powerState.executions.disorder.results[f.targets[1].id].automaticFailure,true);
 assert.equal(f.targets[1].testUserPermission(player,'OWNER'),false);
 await command(player,f.data);assert.equal(f.source.system.resources.chakra.value,20);
 const {applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 await applyPhysicalDamage(f.targets[1],{fixed:5,sourceId:'unreflected'});assert.equal(f.source.system.resources.vitality.value,80);
});

test('Disorder rejects foreign owners, clones, invalid range, too many bodies and purchase suspension before charging',async()=>{
 for(const problem of ['permission','clone','range','count','suspended']){
  const f=mentalControlSetup();
  if(problem==='clone')f.targets[0].flags[ID]={clone:{origin:f.source.uuid}};
  if(problem==='range')f.tokens[1].x=100;
  if(problem==='count')f.data.targets=Array.from({length:4},(_,i)=>({tokenId:f.tokens[i+1].id}));
  if(problem==='suspended')f.source.flags[ID]={capabilities:{suspensions:{mind:true}}};
  await assert.rejects(command(problem==='permission'?stranger:player,f.data));
  assert.equal(f.source.system.resources.chakra.value,28);assert.equal(f.source.system.powerState.active?.length??0,0);
 }
});

test('controlled common attack keeps the shared declaration, halved partner damage and source-only body control',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);
 const body=f.targets[1],target=f.targets[3],control={op:'mind-declare',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,
  itemId:'unarmed',mode:'melee',sceneId:'mind-map',targetTokenId:f.tokens[4].id};
 // Keep the bodies adjacent for the shared melee reach check.
 f.tokens[2].x=3;
 await assert.rejects(command(stranger,control),/controla/);
 await assert.rejects(command(defender,{op:'declare',actorUuid:body.uuid,itemId:'unarmed',options:{mode:'melee',maneuver:'golpear'},targets:[[target.uuid]]}),/pelo controle/);
 await command(player,control);const card=game.messages.find(m=>e(m));assert.ok(card);assert.deepEqual(e(card).rolls,{});
 assert.equal(e(card).attacks[0].partnerDivisor,2);assert.equal(e(card).control.sourceUuid,f.source.uuid);
 rolls=[10];await defense(card,target);assert.equal(e(card).state,'complete');assert.equal(e(card).attacks[0].base,4);assert.equal(e(card).slots[0].applied.damage,4);
 assert.equal(target.system.resources.vitality.value,76);assert.equal(f.source.system.resources.chakra.value,20);
 assert.equal(body.testUserPermission(player,'OWNER'),false);
});

test('controlled defenders invite the Yamanaka, reject their former owner and allow only basic reactions',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[1],attacker=actor(player,'Atacante');
 const request=await command(player,{op:'declare',actorUuid:attacker.uuid,itemId:'unarmed',options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[body.uuid]]});
 const card=game.messages.find(m=>e(m)?.requestId===request.id),invite=game.messages.find(m=>m.getFlag(ID,'defenseInvitation')?.rootExecutionId===card.id);
 assert.ok(invite.whisper.includes(player.id));assert.ok(!invite.whisper.includes(defender.id));
 await assert.rejects(defense(card,body),/controlador/);
 await assert.rejects(command(player,{op:'defense',executionId:card.id,targetUuid:body.uuid,strike:0,kind:'technique'}),/reações básicas/);
 await assert.rejects(command(player,{op:'defense',executionId:card.id,targetUuid:body.uuid,strike:0,kind:'antecipar',evade:true}),/reações básicas/);
 await command(player,{op:'defense',executionId:card.id,targetUuid:body.uuid,strike:0,kind:'esquiva'});
 assert.equal(e(card).slots[0].defense.kind,'esquiva');
});

test('Disorder nature resistance ends concentration on the first success and stun lasts through the next own turn',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[2];
 const {resolveMindNature}=await import('../src/yamanaka-control.mjs'),{advancePowerPhase}=await import('../src/power-actions.mjs'),{conditionRecords}=await import('../src/automation.mjs');
 f.source.flags[ID]??={};f.source.flags[ID].currentTurnKey='current';
 const data={id:'disorder',bodyUuid:body.uuid,againstNature:true};rolls=[16];
 const result=await resolveMindNature(f.source,data,{user:defender,requestId:'nature-one'});
 assert.equal(result.cancel,true);assert.equal(result.stun,true);
 assert.equal(f.source.system.powerState.active.some(p=>p.mentalControl),false);
 assert.ok(f.targets.every(t=>!t.system.powerState.active?.some(p=>p.mentalControlLink)));
 assert.ok(conditionRecords(f.source).some(c=>c.key==='atordoado'));
 await resolveMindNature(f.source,data,{user:defender,requestId:'nature-one'});assert.equal(f.source.system.powerState.active.filter(p=>p.mentalStun).length,1);
 await advancePowerPhase(f.source,'current-end','end');assert.ok(conditionRecords(f.source).some(c=>c.key==='atordoado'));
 f.source.flags[ID].currentTurnKey='next';await advancePowerPhase(f.source,'next-start','start');assert.ok(conditionRecords(f.source).some(c=>c.key==='atordoado'));
 await advancePowerPhase(f.source,'next-end','end');assert.equal(conditionRecords(f.source).some(c=>c.key==='atordoado'),false);
});

test('suicide cancels before a controlled attack and missing maintenance releases all bodies without refund',async()=>{
 let f=mentalControlSetup();rolls=[16,2];await command(player,f.data);
 await command(player,{op:'mind-declare',actorUuid:f.source.uuid,id:'disorder',bodyUuid:f.targets[1].uuid,itemId:'unarmed',mode:'melee',
  sceneId:'mind-map',targetTokenId:f.tokens[4].id,suicidal:true});
 assert.equal(game.messages.filter(m=>e(m)).length,0);assert.equal(f.source.system.resources.chakra.value,20);
 assert.ok(f.targets.every(t=>!t.system.powerState.active?.some(p=>p.mentalControlLink)));
 f=mentalControlSetup();rolls=[16,2];await command(player,f.data);
 const {advancePowerPhase}=await import('../src/power-actions.mjs');f.source.flags[ID]??={};f.source.flags[ID].currentTurnKey='later';
 await advancePowerPhase(f.source,'unmaintained','end');
 assert.equal(f.source.system.powerState.active.length,0);assert.ok(f.targets.every(t=>!t.system.powerState.active?.some(p=>p.mentalControlLink)));
});

test('controlled movement and drawing use existing body resources, collision rules and source permissions',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[1],token=f.tokens[2];
 const data={op:'mind-move',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,sceneId:'mind-map',
  start:{x:2,y:0,elevation:0},destination:{x:5,y:0,elevation:0}};
 await assert.rejects(command(defender,data),/controla/);assert.equal(token.moves,0);
 token.object.checkCollision=()=>true;await assert.rejects(command(player,data),/parede/);assert.equal(token.moves,0);
 token.object.checkCollision=()=>false;await assert.rejects(command(player,{...data,destination:{x:30,y:0,elevation:0}}),/alcance/);
 const request=await command(player,data);await enqueueActionRequest(request);assert.equal(token.moves,1);assert.equal(token.x,5);
 assert.equal(f.source.system.resources.chakra.value,20);assert.equal(body.system.resources.chakra.value,28);
 const item=weapon(body);await command(player,{op:'mind-ready',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,itemId:item.id,equipped:true});
 assert.equal(item.system.equipped,true);await command(player,{op:'mind-ready',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,itemId:item.id,equipped:false});assert.equal(item.system.equipped,false);
 assert.equal(body.testUserPermission(player,'OWNER'),false);
});

test('ending control interrupts a pending body attack and returns defense invitations to the original body owner',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[1];f.tokens[2].x=3;
 const pending=await command(player,{op:'mind-declare',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,itemId:'unarmed',mode:'melee',sceneId:'mind-map',targetTokenId:f.tokens[4].id});
 const controlled=game.messages.find(m=>e(m)?.requestId===pending.id),attacker=actor(player);
 const incoming=await command(player,{op:'declare',actorUuid:attacker.uuid,itemId:'unarmed',options:{mode:'melee',maneuver:'golpear',distance:1},targets:[[body.uuid]]});
 const attack=game.messages.find(m=>e(m)?.requestId===incoming.id),invite=game.messages.find(m=>m.getFlag(ID,'defenseInvitation')?.rootExecutionId===attack.id);
 assert.ok(invite.whisper.includes(player.id));assert.ok(!invite.whisper.includes(defender.id));
 const {endPower}=await import('../src/power-actions.mjs');await endPower(f.source,'disorder');
 assert.equal(e(controlled).state,'interrupted');assert.ok(invite.whisper.includes(defender.id));assert.ok(!invite.whisper.includes(player.id));
 await defense(attack,body);assert.equal(e(attack).slots[0].defense.kind,'esquiva');
 assert.equal(body.testUserPermission(player,'OWNER'),false);
});

test('non-suicidal nature resistance follows the attempted shared attack rather than cancelling it before damage',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[2],target=f.targets[3];
 await command(player,{op:'mind-declare',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,itemId:'unarmed',mode:'melee',sceneId:'mind-map',targetTokenId:f.tokens[4].id,againstNature:true});
 const card=game.messages.find(m=>e(m));assert.ok(card);assert.equal(f.source.system.powerState.active.some(p=>p.mentalStun),false);
 rolls=[10,16];await defense(card,target);assert.equal(e(card).state,'complete');assert.equal(e(card).slots[0].applied.damage,4);
 assert.equal(target.system.resources.vitality.value,76);assert.equal(f.source.system.powerState.active.some(p=>p.mentalControl),false);
 assert.equal(f.source.system.powerState.active.some(p=>p.mentalStun),true);assert.equal(e(card).control.natureResolved,true);assert.deepEqual(rolls,[]);
});

test('control cleanup resumes after an interrupted linked-body write and does not remove hostile or permanent effects',async()=>{
 const f=mentalControlSetup();f.targets[1].system.powerState.active=[{id:'hostile',sourceUuid:f.targets[0].uuid,duration:'continuous'},{id:'permanent',sourceUuid:f.targets[1].uuid,duration:'permanent'}];
 rolls=[16,2];await command(player,f.data);assert.ok(f.targets[1].system.powerState.active.some(p=>p.id==='hostile'));
 const {endPower}=await import('../src/power-actions.mjs'),update=f.targets[2].update.bind(f.targets[2]);let fail=true;
 f.targets[2].update=async data=>{if(fail&&data['system.powerState']){fail=false;throw Error('rede interrompida');}return update(data);};
 await assert.rejects(endPower(f.source,'disorder'),/rede/);assert.ok(f.source.system.powerState.active.some(p=>p.ending));
 await endPower(f.source,'disorder');assert.equal(f.source.system.powerState.active.length,0);
 assert.ok(f.targets[1].system.powerState.active.some(p=>p.id==='hostile'));assert.ok(f.targets[1].system.powerState.active.some(p=>p.id==='permanent'));
 assert.ok(f.targets.every(t=>!t.system.powerState.active?.some(p=>p.mentalControlLink)));
});

test('mind stun uses six-second turns outside combat without shortening its next-turn duration or renewing on rewind',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);
 const {resolveMindNature}=await import('../src/yamanaka-control.mjs'),{advanceAutomaticPowerTime}=await import('../src/power-actions.mjs'),{conditionRecords}=await import('../src/automation.mjs');
 rolls=[16];await resolveMindNature(f.source,{id:'disorder',bodyUuid:f.targets[2].uuid,againstNature:true},{user:defender,requestId:'stun-clock'});
 game.time.worldTime=6;await advanceAutomaticPowerTime(f.source);assert.ok(conditionRecords(f.source).some(c=>c.key==='atordoado'));
 game.time.worldTime=0;await advanceAutomaticPowerTime(f.source);assert.ok(conditionRecords(f.source).some(c=>c.key==='atordoado'));
 game.time.worldTime=12;await advanceAutomaticPowerTime(f.source);assert.equal(conditionRecords(f.source).some(c=>c.key==='atordoado'),false);
});

test('a controlled body HUD preserves resources while hiding attacks that belong to its temporary controller',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[1];
 const {combatHUDView}=await import('../src/combat-hud.mjs');
 const html=combatHUDView(body,[body],{actorView:body,items:body.items,category:'power-use',actionGroup:'standard'});
 assert.match(html,/Corpo controlado por Yamanaka/);assert.ok(html.includes('80 / 88'));
 assert.ok(!html.includes('>Ataque desarmado</button>'));assert.ok(!html.includes('data-kind="power-use"'));
 const source=combatHUDView(f.source,[f.source],{actorView:f.source,items:f.source.items,category:'power-use',actionGroup:'standard'});
 assert.match(source,/Atacar com/);assert.match(source,/Manter Shinranshin/);
});

test('Disorder divides an odd damage base before the damage degree, according to the table decision',async()=>{
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);const body=f.targets[1],target=f.targets[3];
 body.system.attributes.for=10;f.tokens[2].x=3;
 await command(player,{op:'mind-declare',actorUuid:f.source.uuid,id:'disorder',bodyUuid:body.uuid,itemId:'unarmed',mode:'melee',sceneId:'mind-map',targetTokenId:f.tokens[4].id});
 const card=game.messages.find(m=>e(m));rolls=[10];await defense(card,target);
 assert.equal(e(card).attacks[0].base,5);assert.equal(e(card).rolls[0].degree,2);
 assert.equal(e(card).slots[0].applied.damage,6);assert.equal(target.system.resources.vitality.value,74);
});

async function reflectedMindSetup(){
 const f=mentalControlSetup();rolls=[16,2];await command(player,f.data);
 // Exercise the shared damage contract independently of the unfinished transfer activation.
 const root=f.source.system.powerState.active.find(p=>p.mentalControl);
 root.mentalControl.mode='transfer';root.plan.mindControl.reflectedDamage=true;
 f.body=f.targets[1];return f;
}

test('possession reflects damage after victim hardness and armor, bypassing every protection on the original body',async()=>{
 const f=await reflectedMindSetup(),{applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 f.body.system.physical.bodyHardness=3;f.source.system.physical.bodyHardness=100;
 const armor=(owner,id,value)=>{const item={id,type:'equipment',system:{catalogKey:'reinforced-vest',catalogBook:'basico',equipped:true,absorption:{value,max:10}},async update(data){patch(this,data);}};owner.items.push(item);return item;};
 const victimArmor=armor(f.body,'victim-armor',4),originalArmor=armor(f.source,'original-armor',10);
 apt(f.source,'duro-de-matar');
 const result=await applyPhysicalDamage(f.body,{base:10,degree:2,sourceId:'possession.armored.hit',critical:true});
 assert.equal(result.damage,10);assert.equal(f.body.system.resources.vitality.value,70);assert.equal(f.source.system.resources.vitality.value,70);
 assert.equal(victimArmor.system.absorption.value,0);assert.equal(originalArmor.system.absorption.value,10);
 await applyPhysicalDamage(f.body,{base:10,degree:2,sourceId:'possession.armored.hit',critical:true});
 assert.equal(f.source.system.resources.vitality.value,70);assert.equal(f.body.system.resources.vitality.value,70);
});

test('reflected damage resumes after the connection ends and a failed original-body write without charging the victim twice',async()=>{
 const f=await reflectedMindSetup(),{applyPhysicalDamage}=await import('../src/physical-actions.mjs'),{endPower,reconcileActivePowers}=await import('../src/power-actions.mjs');
 const update=f.source.update.bind(f.source);let fail=true;
 f.source.update=async data=>{if(fail&&data['system.resources.vitality.value']!==undefined){fail=false;throw Error('corpo original desconectou');}return update(data);};
 await assert.rejects(applyPhysicalDamage(f.body,{fixed:7,sourceId:'possession.retry',critical:true}),/desconectou/);
 assert.equal(f.body.system.resources.vitality.value,73);assert.equal(f.source.system.resources.vitality.value,80);
 await endPower(f.source,'disorder');assert.equal(f.body.system.powerState.active.length,0);
 await reconcileActivePowers(f.body);assert.equal(f.source.system.resources.vitality.value,73);
 await applyPhysicalDamage(f.body,{fixed:7,sourceId:'possession.retry',critical:true});
 assert.equal(f.body.system.resources.vitality.value,73);assert.equal(f.source.system.resources.vitality.value,73);
});

test('direct and bleeding damage reflect once, while a manual resource edit is not treated as a new hit',async()=>{
 const f=await reflectedMindSetup(),{damageActor,saveCondition,processConditionPhase}=await import('../src/automation.mjs');
 await damageActor(f.body,5,{sourceId:'manual.confirmed.damage'});await damageActor(f.body,5,{sourceId:'manual.confirmed.damage'});
 assert.equal(f.source.system.resources.vitality.value,75);assert.equal(f.body.system.resources.vitality.value,75);
 await f.body.update({'system.resources.vitality.value':65});assert.equal(f.source.system.resources.vitality.value,75);
 await saveCondition(f.body,{key:'sangrando',level:2});
 await processConditionPhase(f.body,'mind-body:disorder:controlled-bleeding:start','start');await processConditionPhase(f.body,'mind-body:disorder:controlled-bleeding:start','start');
 assert.equal(f.body.system.resources.vitality.value,61);assert.equal(f.source.system.resources.vitality.value,71);
 await assert.rejects(damageActor(f.body,-1),/não negativo/);assert.equal(f.body.system.resources.vitality.value,61);
});

test('players request reflection from the recorded victim damage and cannot charge another victim or send an invented amount',async()=>{
 const f=await reflectedMindSetup(),{applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 game.user=defender;await applyPhysicalDamage(f.body,{fixed:3,sourceId:'player.hit',critical:true});
 assert.equal(f.body.system.resources.vitality.value,77);assert.equal(f.source.system.resources.vitality.value,80);
 const request=game.messages.find(m=>m.getFlag(ID,'actionRequest')?.op==='mind-reflection');assert.ok(request);
 game.user=gm;await enqueueActionRequest(request);await enqueueActionRequest(request);
 assert.equal(f.source.system.resources.vitality.value,77);
 await assert.rejects(command(stranger,{op:'mind-reflection',actorUuid:f.body.uuid,sourceId:'player.hit'}),/não controla/);
 await command(defender,{op:'mind-reflection',actorUuid:f.body.uuid,sourceId:'inventado',damage:999});
 assert.equal(f.source.system.resources.vitality.value,77);
});

function mindTransferSetup(effect='troca-mente'){
 const f=mentalControlSetup();f.data.executionId='transfer';f.data.options.effect=effect;
 f.data.targets=f.data.targets.slice(0,effect==='multipla-troca'?2:1).map((p,i)=>({...p,capanga:false,animal:effect==='multipla-troca',bodyKind:effect==='multipla-troca'?'animal':'human',halfDamage:effect==='multipla-troca'&&i===0}));
 return f;
}

test('transfer freezes the victim evasion choice before RNG, charges once and has no attack roll',async()=>{
 const f=mindTransferSetup();rolls=[4];await command(player,f.data);
 assert.deepEqual(rolls,[4]);assert.equal(f.source.system.resources.chakra.value,20);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'mindEvasion')).length,1);assert.equal(game.messages.filter(m=>e(m)).length,0);
 const invite=game.messages.find(m=>m.getFlag(ID,'mindEvasion'));assert.ok(invite.whisper.includes(defender.id));assert.ok(!invite.whisper.includes(player.id));
 await assert.rejects(command(player,{op:'mind-evasion',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.targets[0].uuid,stat:'agi'}),/Somente/);
 await command(defender,{op:'mind-evasion',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.targets[0].uuid,stat:'prontidao'});
 const {mindBinding}=await import('../src/yamanaka-state.mjs'),{derivedSummary,mentalControllerSummary,statPrecision}=await import('../src/automation.mjs');
 assert.ok(mindBinding(f.targets[0]));assert.equal(derivedSummary(f.source).state.noActions,true);assert.equal(mentalControllerSummary(f.source).state.noActions,false);
 assert.equal(statPrecision(f.targets[0],'int',{kind:'attribute'}).base,8);assert.equal(statPrecision(f.targets[0],'for',{kind:'attribute'}).base,8);
 assert.equal(f.source.system.resources.chakra.value,20);assert.deepEqual(rolls,[]);
 await command(player,f.data);assert.equal(f.source.system.resources.chakra.value,20);
});

test('successful single transfer evasion leaves the caster unconscious only until the next own start',async()=>{
 const f=mindTransferSetup();f.source.flags[ID]={currentTurnKey:'sending'};await command(player,f.data);rolls=[16];
 await command(defender,{op:'mind-evasion',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.targets[0].uuid,stat:'agi'});
 const {conditionRecords}=await import('../src/automation.mjs'),{advancePowerPhase}=await import('../src/power-actions.mjs');
 assert.ok(conditionRecords(f.source).some(c=>c.key==='inconsciente'));assert.equal(f.targets[0].system.powerState.active?.length??0,0);
 await advancePowerPhase(f.source,'same-end','end');assert.ok(conditionRecords(f.source).some(c=>c.key==='inconsciente'));
 f.source.flags[ID].currentTurnKey='next';await advancePowerPhase(f.source,'next-start','start');assert.equal(conditionRecords(f.source).some(c=>c.key==='inconsciente'),false);
 assert.equal(f.source.system.resources.chakra.value,20);
});

test('immobile transfer tests the original victim Intelligence on the next Yamanaka start after a full controlled round',async()=>{
 const f=mindTransferSetup();f.targets[0].system.conditions=[{id:'trapped',key:'impedido'}];rolls=[16];await command(player,f.data);assert.deepEqual(rolls,[16]);
 const {processConditionPhase}=await import('../src/automation.mjs'),{mindBinding}=await import('../src/yamanaka-state.mjs');
 await processConditionPhase(f.targets[0],'victim-initiative','start');assert.ok(mindBinding(f.targets[0]));assert.deepEqual(rolls,[16]);
 await processConditionPhase(f.source,'next-source-start','start');assert.equal(mindBinding(f.targets[0]),null);assert.equal(f.source.system.powerState.active.length,0);
 const result=game.messages.find(m=>m.getFlag(ID,'stat')==='int');assert.equal(result.getFlag(ID,'precision'),5);
 assert.deepEqual(rolls,[]);
});

test('unconscious victims wait to awaken, and failed later Intelligence is not rerolled',async()=>{
 const f=mindTransferSetup();f.targets[0].system.conditions=[{id:'sleep',key:'inconsciente'}];await command(player,f.data);
 const {advancePowerPhase,reconcileActivePowers}=await import('../src/power-actions.mjs'),{mindBinding}=await import('../src/yamanaka-state.mjs');
 rolls=[4];await advancePowerPhase(f.targets[0],'mind-body:transfer:first','start');assert.deepEqual(rolls,[4]);
 f.targets[0].system.conditions=[];await reconcileActivePowers(f.targets[0]);assert.ok(mindBinding(f.targets[0]));assert.deepEqual(rolls,[]);
 rolls=[16];await advancePowerPhase(f.targets[0],'third','start');assert.deepEqual(rolls,[16]);assert.ok(mindBinding(f.targets[0]));
});

test('Multiple transfer costs four, rejects humans and large bodies, and a successful evasion releases only that animal',async()=>{
 let f=mindTransferSetup('multipla-troca');f.data.targets[0].bodyKind='human';await assert.rejects(command(player,f.data),/Múltipla Troca/);assert.equal(f.source.system.resources.chakra.value,28);
 f=mindTransferSetup('multipla-troca');f.targets[0].system.physical.size='large';await assert.rejects(command(player,f.data),/Múltipla Troca/);assert.equal(f.source.system.resources.chakra.value,28);
 f=mindTransferSetup('multipla-troca');await command(player,f.data);assert.equal(f.source.system.resources.chakra.value,24);rolls=[16,4];
 const response=i=>command(defender,{op:'mind-evasion',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.targets[i].uuid,stat:'agi'});
 await response(0);await response(1);
 const {mindBinding,mindDamageDivisor}=await import('../src/yamanaka-state.mjs'),{conditionRecords}=await import('../src/automation.mjs');
 assert.equal(mindBinding(f.targets[0]),null);assert.ok(mindBinding(f.targets[1]));assert.equal(mindDamageDivisor(f.targets[1]),1);
 assert.equal(conditionRecords(f.source).some(c=>c.key==='inconsciente'),false);assert.equal(f.source.system.resources.chakra.value,24);
});

test('transfer cancels on zero original vitality, lasts beyond a scene and expires by its published clock',async()=>{
 const {reconcileActivePowers}=await import('../src/power-actions.mjs'),{mindBinding}=await import('../src/yamanaka-state.mjs');
 let f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);
 await reconcileActivePowers(f.source,{scene:'another-scene'});assert.ok(mindBinding(f.targets[0]));
 f.source.system.resources.vitality.value=0;await reconcileActivePowers(f.source);assert.equal(mindBinding(f.targets[0]),null);
 f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);game.time.worldTime=8*86400;
 await reconcileActivePowers(f.source);assert.equal(mindBinding(f.targets[0]),null);assert.equal(f.source.system.resources.chakra.value,20);
});

test('the table decision kills the original Yamanaka when a possessed body dies even if reflected damage alone would leave him alive',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);const {applyPhysicalDamage}=await import('../src/physical-actions.mjs');
 f.targets[0].system.resources.vitality.value=-20;
 await applyPhysicalDamage(f.targets[0],{fixed:1,sourceId:'fatal.possession',critical:true});
 assert.equal(f.targets[0].system.resources.vitality.value,-21);assert.equal(f.source.system.resources.vitality.value,-21);
 assert.equal(f.source.system.powerState.active.length,0);assert.equal(f.targets[0].system.powerState.active.length,0);
 await applyPhysicalDamage(f.targets[0],{fixed:1,sourceId:'fatal.possession',critical:true});assert.equal(f.source.system.resources.vitality.value,-21);
});

test('internal conditions reflect only with their cause marked and stop with the connection without duplicating periodic damage',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);
 const {conditionRecords,saveCondition,processConditionPhase}=await import('../src/automation.mjs'),{endPower}=await import('../src/power-actions.mjs');
 await saveCondition(f.targets[0],{key:'sangrando',level:1,mindInternal:true});await saveCondition(f.targets[0],{key:'agarrado',mindInternal:true});
 await saveCondition(f.targets[0],{key:'cego',source:'Venda externa',mindInternal:false});
 assert.equal(conditionRecords(f.source).filter(c=>c.mindReflected).length,1);
 await processConditionPhase(f.source,'source-bleed','start');assert.equal(f.source.system.resources.vitality.value,78);
 await processConditionPhase(f.targets[0],'victim-bleed','start');assert.equal(f.source.system.resources.vitality.value,78);
 await endPower(f.source,'transfer');assert.equal(conditionRecords(f.source).some(c=>c.key==='sangrando'),false);
 assert.equal(conditionRecords(f.targets[0]).some(c=>c.key==='sangrando'),true);
});

async function sharedMindPowerSetup(mode='troca-mente'){
 const f=mindTransferSetup(mode);f.data.targets.forEach(t=>t.surpriseAttack=true);await command(player,f.data);f.body=f.targets[0];
 const add=(actor,id,level,family='doton')=>{const item={id,name:family,type:'power',system:{level,capabilityData:{},powerData:{family,choices:[{effect:'canhao',tier:1}]}}};actor.items.push(item);return item;};
 add(f.source,'source-earth',3);add(f.body,'body-earth',5);add(f.body,'body-wind',4,'fuuton');
 const scene=game.scenes.get('mind-map');
 globalThis.canvas={ready:true,scene,grid:scene.grid,tokens:{placeables:f.tokens.map(document=>({actor:document.actor,document,controlled:false})),controlled:[]}};
 f.command={op:'mind-ability',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.body.uuid,kind:'power',itemId:'body-earth',sceneId:scene.id,targetTokenIds:[f.tokens[4].id],
  values:{'power.id':'body-earth','power.effect':'canhao','power.level':3,'power.tier':1}};
 return f;
}

test('possessed bodies use only common items and effect versions at the lower level without copying or deleting purchases',async()=>{
 const f=await sharedMindPowerSetup(),{mindCommonItems}=await import('../src/yamanaka-state.mjs');
 const list=mindCommonItems(f.body);assert.equal(list.find(i=>i.id==='body-earth').system.level,3);assert.equal(list.some(i=>i.id==='body-wind'),false);
 f.body.items.find(i=>i.id==='body-earth').system.powerData.choices=[{effect:'canhao',tier:4},{effect:'muralha',tier:3}];
 assert.deepEqual(mindCommonItems(f.body).find(i=>i.id==='body-earth').system.powerData.choices,[{effect:'canhao',tier:1}]);
 await assert.rejects(command(player,{...f.command,values:{...f.command.values,'power.level':5}}),/menor nível/);
 await assert.rejects(command(player,{...f.command,itemId:'body-wind'}),/duas fichas/);
 assert.equal(f.body.system.resources.chakra.value,28);assert.equal(f.body.items.find(i=>i.id==='body-earth').system.level,5);
 assert.equal(f.body.items.some(i=>i.id==='body-wind'),true);
});

test('the common ability picker resolves an item-named form control without colliding with HTMLFormControlsCollection.item',async()=>{
 const f=await sharedMindPowerSetup(),opened=[];
 game.user=player;game.shinobi={open:(...args)=>opened.push(args)};
 foundry.utils.escapeHTML=value=>String(value);
 foundry.applications={api:{DialogV2:{prompt:async options=>options.ok.callback(null,{form:{elements:{item:()=>{},namedItem:name=>name==='item'?{value:'body-earth'}:null}}})}}};
 const {chooseControlledAbility}=await import('../src/yamanaka-actions.mjs');await chooseControlledAbility(f.source,'transfer',f.body.uuid);
 assert.equal(opened.length,1);assert.equal(opened[0][0],'power-use');assert.equal(opened[0][1].actor,f.body);assert.equal(opened[0][1].itemId,'body-earth');
 assert.equal(opened[0][1].mindControl.rootId,'transfer');assert.equal(f.body.testUserPermission(player,'OWNER'),false);
});

test('controlled common powers share declared defenses and body chakra while the caster remains physically helpless',async()=>{
 const f=await sharedMindPowerSetup();Object.defineProperty(f.body,'items',{value:f.body.items,writable:false,configurable:false});await command(player,f.command);
 const card=game.messages.find(m=>e(m));assert.ok(card);assert.deepEqual(e(card).rolls,{});
 assert.equal(e(card).control.sourceUuid,f.source.uuid);assert.equal(e(card).attacks[0].level,3);
 assert.equal(f.body.system.resources.chakra.value,25);assert.equal(f.source.system.resources.chakra.value,20);
 rolls=[10];await defense(card,f.targets[3]);assert.equal(e(card).state,'complete');assert.ok(e(card).slots[0].applied.damage>0);
 assert.deepEqual(rolls,[]);assert.equal(f.body.testUserPermission(player,'OWNER'),false);
});

test('a common power cast through the selected Multiple body retains its partner divisor through damage application',async()=>{
 const f=await sharedMindPowerSetup('multipla-troca');await command(player,f.command);
 const card=game.messages.find(m=>e(m));assert.equal(e(card).attacks[0].partnerDivisor,2);
 rolls=[10];await defense(card,f.targets[3]);assert.equal(e(card).slots[0].applied.damage,6);
 assert.equal(f.body.system.resources.chakra.value,25);assert.equal(f.source.system.resources.chakra.value,24);
});

test('controlled tests borrow full mental precision, preserve physical precision and keep die results through posting retries',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);const body=f.targets[0];
 const data={op:'mind-test',actorUuid:f.source.uuid,id:'transfer',bodyUuid:body.uuid,stat:'int',bonus:2};
 rolls=[9];const request=await command(player,data);await enqueueActionRequest(request);
 const result=game.messages.find(m=>m.getFlag(ID,'powerResistanceReceipt')?.startsWith('mind-test:'));
 assert.equal(result.getFlag(ID,'precision'),10);assert.equal(result.getFlag(ID,'natural'),9);assert.equal(result.getFlag(ID,'success'),null);
 assert.ok(!result.flavor.includes('falha'));assert.ok(result.whisper.includes(player.id));assert.ok(!result.whisper.includes(defender.id));
 assert.deepEqual(rolls,[]);assert.equal(f.source.system.resources.chakra.value,20);assert.equal(body.system.resources.chakra.value,28);
 await assert.rejects(command(defender,data),/sob seu controle/);
});

test('concurrent requests for one resistance share the same persisted roll and one chat result',async()=>{
 setup();const body=actor(defender),{rollPowerResistance}=await import('../src/power-actions.mjs');rolls=[9,16];
 const results=await Promise.all([rollPowerResistance(body,'int',20,{name:'Resistência concorrente'},'same.roll'),rollPowerResistance(body,'int',20,{name:'Resistência concorrente'},'same.roll')]);
 assert.equal(results[0].natural,9);assert.equal(results[1].natural,9);assert.deepEqual(rolls,[16]);
 assert.equal(game.messages.filter(m=>m.getFlag(ID,'powerResistanceReceipt')==='same.roll').length,1);
});

test('Sensor during transfer uses body tracking and chakra, follows the Yamanaka turn and ends with its connection',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;f.data.targets[0].capanga=true;await command(player,f.data);const body=f.targets[0];
 f.source.system.skills.rastrear={points:9};body.system.skills.rastrear={points:3};
 const data={op:'mind-sensor',actorUuid:f.source.uuid,id:'transfer',bodyUuid:body.uuid,operation:'activate'};
 const request=await command(player,data);await enqueueActionRequest(request);await command(player,data);
 const sensor=body.system.powerState.active.find(p=>p.borrowedMindSensor),{skillBase}=await import('../src/build-rules.mjs');
 assert.ok(sensor);assert.equal(sensor.plan.range,10+2*skillBase(body.system,'rastrear'));assert.equal(body.system.resources.chakra.value,26);assert.equal(f.source.system.resources.chakra.value,20);
 const {reconcileActivePowers,endPower}=await import('../src/power-actions.mjs'),{processConditionPhase}=await import('../src/automation.mjs');
 await reconcileActivePowers(body);assert.ok(body.system.powerState.active.some(p=>p.borrowedMindSensor));
 f.source.flags[ID]??={};f.source.flags[ID].currentTurnKey='next-source';
 await command(player,{...data,operation:'maintain'});await processConditionPhase(f.source,'next-source:end','end');
 assert.ok(body.system.powerState.active.some(p=>p.borrowedMindSensor));assert.equal(body.system.resources.chakra.value,26);
 await endPower(f.source,'transfer');assert.equal(body.system.powerState.active.length,0);assert.equal(body.system.resources.chakra.value,26);
});

test('an interrupted transferred sensor card resumes without a second chakra charge',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;f.data.targets[0].capanga=true;await command(player,f.data);const body=f.targets[0],create=ChatMessage.create;let fail=true;
 ChatMessage.create=async data=>{if(fail&&data.flags?.[ID]?.executionId?.startsWith('mind-sensor:')){fail=false;throw Error('publicação do sensor interrompida');}return create(data);};
 const data={op:'mind-sensor',actorUuid:f.source.uuid,id:'transfer',bodyUuid:body.uuid,operation:'activate'};
 await assert.rejects(command(player,data),/sensor interrompida/);assert.equal(body.system.resources.chakra.value,26);
 await command(player,{...data,operation:'maintain'});
 assert.equal(body.system.resources.chakra.value,26);assert.equal(game.messages.filter(m=>m.getFlag(ID,'executionId')?.startsWith('mind-sensor:')).length,1);
});

test('retrying an interrupted controlled aptitude preserves its paid body chakra and preparation identity',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);const body=f.targets[0];
 apt(f.source,'kyoudo-kyouka');apt(body,'kyoudo-kyouka');const item=body.items.find(i=>i.system.catalogKey==='kyoudo-kyouka');
 const scene=game.scenes.get('mind-map');globalThis.canvas={ready:true,scene,grid:scene.grid,tokens:{placeables:f.tokens.map(document=>({actor:document.actor,document,controlled:false})),controlled:[]}};
 const create=ChatMessage.create;let fail=true;ChatMessage.create=async data=>{if(fail&&data.flags?.[ID]?.controlledAbilityId){fail=false;throw Error('cartão de preparação interrompido');}return create(data);};
 const data={op:'mind-ability',actorUuid:f.source.uuid,id:'transfer',bodyUuid:body.uuid,kind:'aptitude',itemId:item.id,sceneId:scene.id,targetTokenIds:[],values:{'aptitude.mode':'partial'}};
 await assert.rejects(command(player,data),/preparação interrompido/);
 const failed=game.messages.find(m=>m.getFlag(ID,'actionRequest')?.op==='mind-ability'),id=body.getFlag(ID,'aptitudes').active['kyoudo-kyouka'].id;
 assert.equal(body.system.resources.chakra.value,25);
 await assert.rejects(command(stranger,{op:'retry-request',requestId:failed.id}),/solicitante/);
 await command(player,{op:'retry-request',requestId:failed.id});
 assert.equal(body.system.resources.chakra.value,25);assert.equal(body.getFlag(ID,'aptitudes').active['kyoudo-kyouka'].id,id);
 assert.equal(f.source.system.resources.chakra.value,20);assert.equal(failed.getFlag(ID,'actionRequestFailed'),false);
});

test('retrying a controlled power declaration after a chat failure keeps one body cost and the same frozen targets',async()=>{
 const f=await sharedMindPowerSetup(),create=ChatMessage.create;let fail=true;
 ChatMessage.create=async data=>{if(fail&&data.flags?.[ID]?.actionExecution?.powerExecutionId){fail=false;throw Error('declaração interrompida');}return create(data);};
 await assert.rejects(command(player,f.command),/declaração interrompida/);assert.equal(f.body.system.resources.chakra.value,25);
 const failed=game.messages.find(m=>m.getFlag(ID,'actionRequest')?.op==='mind-ability');
 game.user.targets=new Set();await command(player,{op:'retry-request',requestId:failed.id});
 assert.equal(f.body.system.resources.chakra.value,25);const card=game.messages.find(m=>e(m));assert.equal(e(card).slots[0].targetUuid,f.targets[3].uuid);assert.deepEqual(e(card).rolls,{});
});

test('Multiple bodies keep independent attacks and only the selected body halves an odd base',async()=>{
 const f=mindTransferSetup('multipla-troca');f.data.targets.forEach(t=>{t.surpriseAttack=true;t.capanga=true;});await command(player,f.data);
 f.tokens[1].x=3;f.tokens[2].x=5;f.targets[0].system.attributes.for=f.targets[1].system.attributes.for=10;
 for(let i=0;i<2;i++){
  await command(player,{op:'mind-declare',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.targets[i].uuid,itemId:'unarmed',mode:'melee',sceneId:'mind-map',targetTokenId:f.tokens[4].id});
  const card=game.messages.filter(m=>e(m)).at(-1);rolls=[10];await defense(card,f.targets[3]);
  assert.equal(e(card).attacks[0].partnerDivisor,i===0?2:1);assert.equal(e(card).slots[0].applied.damage,i===0?6:10);
 }
 assert.equal(f.targets[3].system.resources.vitality.value,64);assert.equal(f.source.system.resources.chakra.value,24);
});

test('three non-consecutive nature successes end transfer while their independent stun outlasts the connection',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);
 const {resolveMindNature}=await import('../src/yamanaka-control.mjs'),{advancePowerPhase}=await import('../src/power-actions.mjs'),{conditionRecords}=await import('../src/automation.mjs');
 for(const [i,natural]of [16,4,16,16].entries()){
  rolls=[natural];const result=await resolveMindNature(f.source,{id:'transfer',bodyUuid:f.targets[0].uuid,againstNature:true},{user:defender,requestId:'nature-transfer-'+i});
  if(i<3){assert.equal(result.cancel,false);if(result.stun){f.source.flags[ID]??={};f.source.flags[ID].currentTurnKey='source-after-'+i;await advancePowerPhase(f.source,'source-after-'+i+':start','start');await advancePowerPhase(f.source,'source-after-'+i+':end','end');}}
  else{assert.equal(result.successes,3);assert.equal(result.cancel,true);}
 }
 assert.equal(f.source.system.powerState.active.some(p=>p.mentalControl),false);assert.equal(f.targets[0].system.powerState.active.length,0);
 assert.equal(conditionRecords(f.source).some(c=>c.key==='atordoado'),true);assert.equal(f.source.system.resources.chakra.value,20);
});

test('poison pulses and internal debilitation reflect once without doubling the body penalty or using original-body protection',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;f.data.targets[0].capanga=true;await command(player,f.data);const body=f.targets[0];
 body.system.inventoryState.poisons=[{id:'poison',key:'red-scorpion',book:'basico',active:true,dc:25,elapsed:4,delay:3,startAt:0,failures:1,successes:0,firstFailureAt:0,firstFailureElapsed:3,expiresAt:1000}];
 const {statPrecision,conditionRecords}=await import('../src/automation.mjs'),{advanceInventoryPhase}=await import('../src/inventory-actions.mjs'),{endPower}=await import('../src/power-actions.mjs');
 assert.equal(statPrecision(body,'int',{kind:'attribute'}).precision,5);assert.equal(statPrecision(body,'for',{kind:'attribute'}).precision,5);
 assert.equal(statPrecision(body,'vig',{kind:'resistance',bodyResistance:true}).precision,6);
 f.source.system.physical.bodyHardness=100;body.system.physical.bodyHardness=100;rolls=[16];
 await advanceInventoryPhase(body,'mind-body:transfer:poison','start');await advanceInventoryPhase(body,'mind-body:transfer:poison','start');
 assert.equal(body.system.resources.vitality.value,70);assert.equal(f.source.system.resources.vitality.value,70);assert.deepEqual(rolls,[]);
 assert.ok(conditionRecords(f.source).some(c=>c.mindReflected));await endPower(f.source,'transfer');assert.ok(!conditionRecords(f.source).some(c=>c.mindReflected));
});

test('the controller can end its own common preparations but cannot remove hostile effects or the control link through that shortcut',async()=>{
 const f=await sharedMindPowerSetup();apt(f.source,'kyoudo-kyouka');apt(f.body,'kyoudo-kyouka');const item=f.body.items.find(i=>i.system.catalogKey==='kyoudo-kyouka');
 await command(player,{...f.command,kind:'aptitude',itemId:item.id,targetTokenIds:[],values:{'aptitude.mode':'partial'}});
 const data={op:'mind-effect',actorUuid:f.source.uuid,id:'transfer',bodyUuid:f.body.uuid,operation:'end-aptitude',itemId:item.id};
 await assert.rejects(command(defender,data),/sob seu controle/);await command(player,data);assert.equal(f.body.getFlag(ID,'aptitudes').active['kyoudo-kyouka'],undefined);
 const link=f.body.system.powerState.active.find(p=>p.mentalControlLink);await assert.rejects(command(player,{...data,operation:'power-end',effectId:link.id}),/Somente efeitos próprios/);
 assert.ok(f.body.system.powerState.active.some(p=>p.mentalControlLink));
});

test('maximum transfer distance uses persisted token positions and releases the body without changing resources',async()=>{
 const f=mindTransferSetup();f.data.targets[0].surpriseAttack=true;await command(player,f.data);const scene=game.scenes.get('mind-map');f.tokens.forEach(t=>t.parent=scene);
 const token=f.tokens[1];token.toObject=()=>({x:1301,y:0,elevation:0});
 const {reconcileMindTransfer}=await import('../src/yamanaka-transfer.mjs'),{mindBinding}=await import('../src/yamanaka-state.mjs');
 await reconcileMindTransfer(f.targets[0]);assert.equal(mindBinding(f.targets[0]),null);assert.equal(f.source.system.powerState.active.length,0);
 assert.equal(token.x,1);assert.equal(f.source.system.resources.chakra.value,20);
});
