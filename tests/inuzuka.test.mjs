import test from 'node:test';
import assert from 'node:assert/strict';
import {ID} from '../src/config.mjs';
import {companionProjection,createInuzukaCompanion,syncInuzukaCompanions,applyJuujinTransformation,startCompanionTraining,companionTraining,promoteInuzukaCompanion} from '../src/inuzuka.mjs';
import {partnerDamageDivisor,declarePartnerDivisor,partnerOrigin} from '../src/partners.mjs';
import {statPrecision,syncAutomaticStatuses,createActorClass} from '../src/automation.mjs';
import {prepareWeaponAction} from '../src/weapon-actions.mjs';
import {hudActors,combatHUDView} from '../src/combat-hud.mjs';
import {applyPhysicalDamage} from '../src/physical-actions.mjs';
import {powerPlan} from '../src/power-rules.mjs';
import {powerAction,reconcileActivePowers,endPower,activateInuzukaFusion,advancePowerPhase,advanceAutomaticPowerTime} from '../src/power-actions.mjs';
import {bodySource,joinedBody} from '../src/body-state.mjs';
import {fusionParticipants,prepareFusionScene,reconcileBodyLinks} from '../src/inuzuka-fusion.mjs';
import {sizeProfile,effectiveAttributes} from '../src/physical-rules.mjs';
import {derivedSummary} from '../src/automation.mjs';
import {resolveHardness} from '../src/physical-rules.mjs';
import {restrictedUseView} from '../src/restricted-ui.mjs';
import {updateDocument} from './helpers/document-update.mjs';
let serial=0;
function document(data){
 const actor={...structuredClone(data),id:String(++serial),uuid:'Actor.'+serial,isOwner:true};
 actor.flags??={};actor.items??=[];actor.effects=[];
 actor.getFlag=(ns,key)=>actor.flags[ns]?.[key];
 actor.update=async patch=>updateDocument(actor,patch);
 actor.toObject=()=>({name:actor.name,system:structuredClone(actor.system),ownership:actor.ownership,prototypeToken:actor.prototypeToken});
 actor.items=actor.items.map(data=>itemDocument(actor,data));
 actor.createEmbeddedDocuments=async(type,batch)=>{assert.equal(type,'Item');const items=batch.map(data=>itemDocument(actor,data));actor.items.push(...items);return items;};
 return actor;
}
function itemDocument(actor,data){
 const item={...structuredClone(data),id:data.id??String(++serial)};
 item.getFlag=(ns,key)=>item.flags?.[ns]?.[key];item.toObject=()=>({name:item.name,type:item.type,system:structuredClone(item.system)});
 item.update=async patch=>updateDocument(item,patch);item.delete=async()=>actor.items.splice(actor.items.indexOf(item),1);
 return item;
}
function setup(){
 delete globalThis.canvas;
 const source=document({name:'Inuzuka',type:'character',ownership:{player:3},prototypeToken:{},
  system:{identity:{clan:'Inuzuka'},campaign:{level:12},attributes:{for:10,des:10,agi:10,per:10,int:10,vig:10,esp:10},
   automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},skills:{lidar:{points:9},rastrear:{points:2},atletismo:{points:3},medicina:{points:5}},
   resources:{vitality:{value:100,max:100},chakra:{value:40,max:40}},physical:{size:'medium'},movement:{distance:15}},
  items:[...['companheiro-animal','hakken-no-jutsu'].map(key=>({name:key,type:'aptitude',system:{catalogKey:'res-basico-'+key,catalogBook:'basico',level:1,
   capabilityData:{schemaVersion:1,definitionId:'res-basico-'+key,accessOrigin:'inuzuka'}}})),
   {name:'Lutador',type:'aptitude',system:{catalogKey:'lutador',catalogBook:'basico',level:1}},
   {name:'Não permitido',type:'aptitude',system:{catalogKey:'punho-de-ferro',catalogBook:'basico',level:1}}]});
 const actors=[source];actors.contents=actors;
 globalThis.game={actors,user:{isGM:true},time:{worldTime:0},settings:{get:(_id,key)=>key==='profile'?{books:['basico']}:0}};
 globalThis.CONFIG={Actor:{documentClass:{createDocuments:async batch=>batch.map(data=>{const a=document(data);actors.push(a);return a;})}}};
 globalThis.foundry={utils:{deepClone:structuredClone}};
 return {source,item:source.items[0],actors};
}
async function fusionSetup(){
 const env=setup(),{source,item}=env;
 source.system.campaign.level=20;source.system.skills.disfarce={points:7};source.system.skills.lidar.points=11;
 const power=itemDocument(source,{name:'Shikakyu',type:'power',system:{level:8,catalogBook:'basico',powerData:{family:'shikakyu',choices:[]}}});source.items.push(power);
 const {companion}=await createInuzukaCompanion(source,item,{requestId:'animal'});
 source.system.powerState={active:[{...powerPlan(power,source.system,source.items,{effect:'shikakyu',level:8},{actor:source,books:['basico']}).active,id:'posture',itemId:power.id,active:true}]};
 const grid={isSquare:true,size:100,getOffsetRange:({x,y,width,height})=>[Math.floor(y/100),Math.floor(x/100),Math.ceil((y+height)/100),Math.ceil((x+width)/100)],
  getCenterPoint:({i,j})=>({x:j*100+50,y:i*100+50}),measurePath:([a,b])=>({distance:Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))/100})};
 const tokens=[];tokens.get=id=>tokens.find(t=>t.id===id);
 const addToken=(actor,x,y,hidden=false)=>{
  const token={id:'token'+actor.id,actor,x,y,width:1,height:1,elevation:0,hidden,isOwner:true,
   getCenterPoint(){return {x:this.x+this.width*50,y:this.y+this.height*50};},async update(patch){updateDocument(this,patch);return this;}};
  tokens.push(token);return token;
 };
 const scene={id:'test-scene',grid,tokens},origin=addToken(source,0,0),animalToken=addToken(companion,100,0);
 game.scenes=new Map([[scene.id,scene]]);game.user={isGM:true,id:'gm',viewedScene:scene.id};
 globalThis.canvas={ready:true,scene,grid,tokens:{placeables:tokens.map(t=>({actor:t.actor,document:t,center:t.getCenterPoint()})),controlled:[]}};
 globalThis.fromUuid=async uuid=>env.actors.find(a=>a.uuid===uuid);
 game.messages=[];game.messages.contents=game.messages;
 globalThis.ChatMessage={getSpeaker:()=>({}),create:async data=>{const message={...data,id:'msg'+serial++,getFlag:(ns,key)=>data.flags?.[ns]?.[key]};game.messages.push(message);return message;}};
 const command={sceneId:scene.id,sourceTokenId:origin.id,participants:[companion.uuid],options:{effect:'sotorou',level:8}};
 return {...env,power,companion,scene,origin,animalToken,addToken,command};
}
test('Inuzuka companion uses published precision and skill limits, independent resources and explicit creation',async()=>{
 const {source,item,actors}=setup(),projection=companionProjection(source);
 assert.equal(projection.attributes.for,8);assert.equal(projection.combat.cc,11);
 assert.equal(projection.skills.atletismo.value,6);assert.equal(projection.skills.medicina.value,0);
 assert.equal(projection.vitality,94);assert.equal(projection.chakra,34);assert.equal(projection.size,'large');
 const before=structuredClone(source.system);
 const [first,second]=await Promise.all([createInuzukaCompanion(source,item,{requestId:'create'}),createInuzukaCompanion(source,item,{requestId:'retry'})]);
 assert.equal(actors.length,2);assert.equal(first.companion,second.companion);assert.equal(second.duplicate,true);
 const animal=first.companion;
 assert.equal(animal.type,'creature');assert.deepEqual(animal.ownership,{player:3});
 assert.ok(!animal.items.some(i=>i.system.catalogKey==='punho-de-ferro'));
 assert.deepEqual(source.system,before);
 animal.system.resources.vitality.value=30;source.system.attributes.vig=12;
 await syncInuzukaCompanions(source);
 assert.equal(animal.system.resources.vitality.max,100);assert.equal(animal.system.resources.vitality.value,30);
 source.items.splice(source.items.indexOf(item),1);await syncInuzukaCompanions(source);
 assert.equal(animal.getFlag(ID,'companion').suspended,true);
 assert.equal(statPrecision(animal,'cc',{kind:'attack'}).allowed,false);
 source.items.push(item);await syncInuzukaCompanions(source);
 assert.equal(animal.getFlag(ID,'companion').suspended,false);
 assert.equal(animal.system.resources.vitality.value,30);
});
test('pack thresholds create only the chosen extra animals and combat failure stays outside precision penalties',async()=>{
 const {source,item}=setup();
 await assert.rejects(createInuzukaCompanion(source,item,{slot:1,requestId:'extra'}),/disponível/);
 source.system.skills.lidar.points=11;
 const {companion:extra}=await createInuzukaCompanion(source,item,{slot:1,requestId:'extra'});
 const check=statPrecision(extra,'cc',{kind:'attack'});
 assert.equal(check.allowed,false);assert.match(check.reasons.join(),/automaticamente/);
 assert.equal(extra.system.attributes.for,8);
});
test('partner divisor is a shared round declaration and affects base/fixed damage after hardness',async()=>{
 const {source,item}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'create'});
 game.combat={id:'combat',started:true,round:1};
 assert.equal(partnerOrigin(companion),source);
 assert.throws(()=>partnerDamageDivisor(companion),/Declare/);
 await declarePartnerDivisor(source,2);
 assert.equal(partnerDamageDivisor(companion),2);assert.equal(partnerDamageDivisor(source),2);
 const hit=resolveHardness({base:11,fixed:9,hardness:3,degree:2,partnerDivisor:2});
 assert.equal(hit.base,4);assert.equal(hit.fixed,2);assert.equal(hit.damage,10);
 const multiple=resolveHardness({base:6,hardness:2,partnerDivisor:2,divisions:3});
 assert.deepEqual(multiple.divided,[1,1,0]);
 game.combat.round=2;assert.throws(()=>partnerDamageDivisor(source),/Declare/);
 await assert.rejects(declarePartnerDivisor(companion,3),/divisor/);
});
test('Juujin validates touch and companion, preserves its resources, copies gear once and ends below half vitality',async()=>{
 const {source,item}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'create'});
 const power=itemDocument(source,{name:'Shikakyu',type:'power',system:{level:6,catalogBook:'basico',powerData:{family:'shikakyu',choices:[]}}});source.items.push(power);
 for(const key of ['staff','explosive-tag'])source.items.push(itemDocument(source,{name:key,type:'equipment',system:{catalogKey:key,catalogBook:'basico',quantity:1}}));
 const context={actor:source,books:['basico']},options={effect:'juujin',level:6,targetUuid:companion.uuid,distance:1};
 assert.throws(()=>powerPlan(power,source.system,source.items,{...options,distance:2},context),/toque/);
 const plan=powerPlan(power,source.system,source.items,options,context);
 assert.equal(plan.cost,2);assert.equal(plan.action,'movement');assert.equal(plan.companionTransform,true);
 const before=structuredClone(companion.system.resources);
 source.system.powerState={active:[{...plan.active,id:'juujin',targetUuid:companion.uuid,sourceUuid:source.uuid,duration:'continuous',plan}]};
 await applyJuujinTransformation(source,companion,'juujin');await applyJuujinTransformation(source,companion,'juujin');
 assert.equal(companion.system.attributes.for,10);assert.equal(companion.system.physical.size,'medium');
 assert.deepEqual(companion.system.resources,before);
 const copies=companion.items.filter(i=>i.getFlag(ID,'juujinReplica'));
 assert.equal(copies.length,2);assert.equal(copies.find(i=>i.system.catalogKey==='explosive-tag').getFlag(ID,'juujinReplica').blocked,true);
 companion.system.resources.vitality.value=47;await syncAutomaticStatuses(companion);
 assert.ok(companion.getFlag(ID,'companion').transformation);
 companion.system.resources.vitality.value=46;await syncAutomaticStatuses(companion);
 assert.equal(companion.getFlag(ID,'companion').transformation,null);
 assert.equal(companion.system.resources.vitality.value,46);assert.equal(companion.system.resources.vitality.max,94);
 assert.equal(companion.system.attributes.for,8);assert.equal(companion.system.physical.size,'large');
 assert.equal(companion.items.some(i=>i.getFlag(ID,'juujinReplica')),false);
 assert.throws(()=>powerPlan(power,source.system,source.items,options,context),/nesta cena/);
});
test('projected companion statistics are protected while current resources remain editable and the HUD lists its owner',async()=>{
 const {source,item}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'create'});
 foundry.utils.expandObject=patch=>{const result={};updateDocument(result,patch);return result;};
 const Class=createActorClass(class{async _preUpdate(){}}),generated=Object.assign(new Class(),companion);
 await assert.rejects(generated._preUpdate({'system.attributes.for':99},{},'gm'),/ficha de origem/);
 await generated._preUpdate({'system.resources.vitality.value':20},{},'gm');
 await generated._preUpdate({'system.attributes.for':10},{snsCompanionSync:true},'gm');
 assert.ok(hudActors().includes(companion));assert.ok(hudActors().includes(source));
});
test('transformed companion corporal damage uses the original owner bonuses without granting unlisted aptitudes',async()=>{
 const {source,item}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'create'});
 source.system.attributes.for=18;
 source.items.push(itemDocument(source,{name:'Dano Extra',type:'aptitude',system:{catalogKey:'dano-extra',catalogBook:'basico',selection:'long',level:1}}));
 source.items.push(itemDocument(source,{name:'Bastão',type:'equipment',system:{catalogKey:'staff',catalogBook:'basico',quantity:1}}));
 await applyJuujinTransformation(source,companion,'copy');
 const weapon=companion.items.find(i=>i.system.catalogKey==='staff');
 assert.ok(!companion.items.some(i=>i.system.catalogKey==='dano-extra'));
 assert.equal(prepareWeaponAction(companion,weapon.id).plan.base,prepareWeaponAction(source,source.items.at(-1).id).plan.base);
});
test('Juujin executes the shared payment once and suspending a book preserves acquisitions and current resources',async()=>{
 const {source,item,actors}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'create'});
 const power=itemDocument(source,{name:'Shikakyu',type:'power',system:{level:6,catalogBook:'basico',powerData:{family:'shikakyu',choices:[]}}});source.items.push(power);
 globalThis.fromUuid=async uuid=>actors.find(a=>a.uuid===uuid);
 game.user.targets=new Set([{actor:companion}]);game.messages=[];game.messages.contents=game.messages;
 globalThis.ChatMessage={getSpeaker:()=>({}),create:async data=>{game.messages.push(data);return data;}};
 foundry.utils.randomID=()=>String(++serial);
 const app={values:{},panelConfig:{},close:async()=>{},render:async()=>{}};
 const values={'power.id':power.id,'power.effect':'juujin','power.level':6,'power.distance':1};
 const root={querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value,type:typeof value==='number'?'number':'text'}))};
 await powerAction(app,'power-execute',{},root,{actor:source});
 await powerAction(app,'power-execute',{},root,{actor:source});
 assert.equal(source.system.resources.chakra.value,38);
 assert.equal(companion.system.attributes.for,10);
 const resources=structuredClone(source.system.resources),stock=source.items.length,old=game.settings.get;
 game.settings.get=(_id,key)=>key==='profile'?{books:[]}:0;
 await reconcileActivePowers(source);
 assert.equal(source.system.powerState.active[0].active,false);
 assert.deepEqual(source.system.resources,resources);assert.equal(source.items.length,stock);
 game.settings.get=old;await reconcileActivePowers(source);
 assert.equal(source.system.powerState.active[0].active,true);
 assert.equal(source.system.powerState.active[0].sourceSuspended,undefined);
 await endPower(source,source.system.powerState.active[0].id);
 assert.equal(companion.system.attributes.for,8);assert.equal(source.system.resources.chakra.value,38);
});
test('Gatsuga uses two individual attack plans and doubles only the Inuzuka damage after hardness and partner division',async()=>{
 const {source,item,actors}=setup();
 const power=itemDocument(source,{name:'Shikakyu',type:'power',system:{level:6,catalogBook:'basico',powerData:{family:'shikakyu',choices:[]}}});source.items.push(power);
 const {companion}=await createInuzukaCompanion(source,item,{requestId:'create'}),animalPower=companion.items.find(i=>i.type==='power');
 const active=powerPlan(power,source.system,source.items,{effect:'shikakyu',level:6},{actor:source,books:['basico']});
 source.system.powerState={active:[{...active.active,id:'posture',itemId:power.id,active:true},
  {id:'juujin',companionTransform:true,targetUuid:companion.uuid,active:true}]};
 assert.throws(()=>powerPlan(animalPower,companion.system,companion.items,{effect:'tsuuga',level:6},{actor:companion,books:['basico']}),/Juujin/);
 await applyJuujinTransformation(source,companion,'juujin');
 const options={effect:'gatsuga',level:6};
 assert.throws(()=>powerPlan(power,source.system,source.items,options,{actor:source,books:['basico']}),/declaração/);
 await declarePartnerDivisor(source,2);
 const ownerPlan=powerPlan(power,source.system,source.items,options,{actor:source,books:['basico']});
 const animalPlan=powerPlan(animalPower,companion.system,companion.items,options,{actor:companion,books:['basico']});
 assert.equal(ownerPlan.cost,1);assert.equal(animalPlan.cost,1);assert.equal(ownerPlan.damage,animalPlan.damage);
 assert.equal(ownerPlan.damageMultiplier,2);assert.equal(animalPlan.damageMultiplier,1);
 const view=group=>combatHUDView(source,[source,companion],{actorView:source,items:source.items,
  actionGroup:group,category:'power-use',profile:{books:['basico']}});
 assert.match(view('standard'),/Shikakyu · Gatsuga/);
 assert.match(view('standard'),/Shikakyu · Tsuuga/);
 assert.doesNotMatch(view('movement'),/Shikakyu · Gatsuga/);
 assert.match(view('movement'),/Shikakyu · Juujin Bunshin/);
 const target=document({name:'Alvo',type:'creature',system:{attributes:{},resources:{vitality:{value:100,max:100},chakra:{value:40,max:40}},physical:{size:'medium',bodyHardness:2},conditions:[]}});actors.push(target);
 const input={base:ownerPlan.damage,degree:2,partnerDivisor:2,damageMultiplier:2,sourceId:'gatsuga:owner',critical:true,camouflageContext:{located:true}};
 const ownerHit=await applyPhysicalDamage(target,input);assert.equal(ownerHit.damage,16);
 const animalHit=await applyPhysicalDamage(target,{...input,damageMultiplier:1,sourceId:'gatsuga:animal'});assert.equal(animalHit.damage,8);
 await applyPhysicalDamage(target,input);assert.equal(target.system.resources.vitality.value,76);
});

test('replacement needs a deceased companion, the full training period and a GM attestation; it preserves the old sheet and source resources',async()=>{
 const {source,item,actors}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'first'});
 const user={id:'test-gm',isGM:true},start={animalUuid:companion.uuid,requestId:'training',user};
 await assert.rejects(startCompanionTraining(source,item,{...start,user:{isGM:false}}),/mestre/);
 await assert.rejects(startCompanionTraining(source,item,start),/morrido/);
 companion.system.resources.vitality.value=-21;
 const old=structuredClone(companion.system),resources=structuredClone(source.system.resources);
 await startCompanionTraining(source,item,start);
 const training=companionTraining(source,0);assert.equal(training.days,84);assert.equal(training.remainingDays,84);
 const finish={slot:0,trainingId:'training',requestId:'finish',name:'Novo cão',user,uninterrupted:true};
 await assert.rejects(createInuzukaCompanion(source,item,finish),/prazo/);
 game.time.worldTime=training.readyAt;
 await assert.rejects(createInuzukaCompanion(source,item,{...finish,uninterrupted:false}),/ininterrupto/);
 companion.system.resources.vitality.value=10;
 await assert.rejects(createInuzukaCompanion(source,item,finish),/não está morto/);
 companion.system.resources.vitality.value=-21;
 const results=await Promise.all([createInuzukaCompanion(source,item,finish),createInuzukaCompanion(source,item,finish)]);
 assert.equal(actors.length,3);assert.equal(results[0].companion,results[1].companion);assert.equal(results[1].duplicate,true);
 assert.equal(companion.getFlag(ID,'companion').retired,true);assert.deepEqual(companion.system,old);
 assert.equal(results[0].companion.name,'Novo cão');assert.equal(results[0].companion.system.resources.vitality.value,94);
 assert.deepEqual(source.system.resources,resources);assert.equal(partnerOrigin(results[0].companion),source);
 assert.equal(companionTraining(source,0).status,'completed');
 const completedAt=companionTraining(source,0).completedAt;game.time.worldTime+=1;
 await createInuzukaCompanion(source,item,finish);assert.equal(companionTraining(source,0).completedAt,completedAt);
});

test('interrupted companion training restarts its clock explicitly and a partially completed replacement resumes without another animal',async()=>{
 const {source,item,actors}=setup(),{companion}=await createInuzukaCompanion(source,item,{requestId:'first'});
 companion.system.resources.vitality.value=-21;
 const user={id:'test-gm',isGM:true},start={animalUuid:companion.uuid,requestId:'old-training',user};
 await startCompanionTraining(source,item,start);game.time.worldTime=86400;
 await startCompanionTraining(source,item,{...start,requestId:'retry'});assert.equal(companionTraining(source,0).startedAt,0);
 await startCompanionTraining(source,item,{...start,requestId:'new-training',restart:true});
 const training=companionTraining(source,0);assert.equal(training.startedAt,86400);assert.equal(training.remainingDays,84);
 assert.equal(source.getFlag(ID,'aptitudes').companionTrainingHistory[0].status,'interrupted');
 game.time.worldTime=training.readyAt;
 const finish={slot:0,trainingId:training.id,requestId:'finish',user,uninterrupted:true};
 const update=companion.update;let fail=true;
 companion.update=async patch=>{if(fail){fail=false;throw Error('escrita interrompida');}return update(patch);};
 await assert.rejects(createInuzukaCompanion(source,item,finish),/interrompida/);assert.equal(actors.length,3);
 const resumed=await createInuzukaCompanion(source,item,finish);
 assert.equal(resumed.duplicate,true);assert.equal(actors.length,3);assert.equal(companion.getFlag(ID,'companion').retired,true);
 assert.equal(companionTraining(source,0).replacementUuid,resumed.companion.uuid);
});

test('a chosen pack member becomes the primary without healing and its vacant pack slot still requires training',async()=>{
 const {source,item,actors}=setup(),user={id:'test-gm',isGM:true};source.system.skills.lidar.points=11;
 const {companion:old}=await createInuzukaCompanion(source,item,{requestId:'primary'});
 const {companion:pack}=await createInuzukaCompanion(source,item,{slot:1,requestId:'pack'});
 pack.system.resources.vitality.value=20;pack.system.resources.chakra.value=8;
 const promotion={animalUuid:pack.uuid,requestId:'promote',user};
 await assert.rejects(promoteInuzukaCompanion(source,item,promotion),/morte/);
 old.system.resources.vitality.value=-21;
 await startCompanionTraining(source,item,{animalUuid:old.uuid,requestId:'training',user});
 game.time.worldTime=86400;
 await promoteInuzukaCompanion(source,item,promotion);
 assert.equal(old.getFlag(ID,'companion').retired,true);assert.equal(pack.getFlag(ID,'companion').slot,0);
 assert.equal(pack.getFlag(ID,'companion').capanga,false);assert.equal(pack.system.resources.vitality.value,20);
 assert.equal(pack.system.resources.chakra.value,8);assert.equal(statPrecision(pack,'cc',{kind:'attack'}).allowed,true);
 assert.equal(companionTraining(source,1).startedAt,0);assert.equal(companionTraining(source,0),null);
 await assert.rejects(createInuzukaCompanion(source,item,{slot:1,requestId:'bypass'}),/treinamento/);
 await promoteInuzukaCompanion(source,item,promotion);assert.equal(actors.length,3);
 await startCompanionTraining(source,item,{animalUuid:old.uuid,slot:1,restart:true,requestId:'restart',user});
 const training=companionTraining(source,1);assert.equal(training.startedAt,86400);
 const view=restrictedUseView({actor:{...source,getFlag:undefined},profile:{books:['basico']},isGM:true},item);
 assert.match(view,/Vaga 1 da matilha/);assert.match(view,/6 × Lidar 16/);
 assert.match(view,/data-training="restart" disabled/);
 assert.doesNotMatch(view,/data-sns="capability-companion-create"[^>]*data-slot="1"/);
 game.time.worldTime=training.readyAt;
 const {companion:replacement}=await createInuzukaCompanion(source,item,{slot:1,trainingId:training.id,user,uninterrupted:true,requestId:'finish'});
 assert.equal(replacement.getFlag(ID,'companion').capanga,true);assert.equal(replacement.getFlag(ID,'companion').slot,1);
 assert.equal(source.getFlag(ID,'aptitudes').companionVacancies[1].status,'filled');
 assert.equal(actors.length,4);
});

test('a promotion interrupted between Actor writes keeps the same vacancy and resumes without duplicating or curing animals',async()=>{
 const {source,item,actors}=setup(),user={id:'test-gm',isGM:true};source.system.skills.lidar.points=11;
 const {companion:old}=await createInuzukaCompanion(source,item,{requestId:'primary'}),
  {companion:pack}=await createInuzukaCompanion(source,item,{slot:1,requestId:'pack'});
 old.system.resources.vitality.value=-21;pack.system.resources.vitality.value=10;
 const update=pack.update;let fail=true;
 pack.update=async patch=>{if(fail){fail=false;throw Error('escrita interrompida');}return update(patch);};
 const options={animalUuid:pack.uuid,requestId:'promote',user};
 await assert.rejects(promoteInuzukaCompanion(source,item,{...options,user:{isGM:false}}),/mestre/);
 await assert.rejects(promoteInuzukaCompanion(source,item,options),/interrompida/);
 assert.equal(source.getFlag(ID,'aptitudes').companionVacancies[1].status,'promoting');
 await assert.rejects(createInuzukaCompanion(source,item,{requestId:'bypass'}),/promoção pendente/);
 await promoteInuzukaCompanion(source,item,{...options,requestId:'retry'});
 assert.equal(actors.length,3);assert.equal(pack.system.resources.vitality.value,10);
 assert.equal(pack.getFlag(ID,'companion').capanga,false);assert.equal(source.getFlag(ID,'aptitudes').companionVacancies[1].status,'vacant');
 const view=restrictedUseView({actor:{...source,getFlag:undefined},profile:{books:['basico']},isGM:false},item);
 assert.doesNotMatch(view,/data-sns="capability-companion-training-start"/);
 assert.doesNotMatch(view,/data-sns="capability-companion-promote"/);
});

test('Sotorou uses one body, temporary size, independent preserved sheets and source damage; ending restores at the current position',async()=>{
 const {source,power,companion,origin,animalToken,command}=await fusionSetup(),user=game.user;
 const sourceVitality=derivedSummary(source).vitality,animalResources=structuredClone(companion.system.resources);
 await activateInuzukaFusion(source,power,command,{user,requestId:'fusion'});
 await activateInuzukaFusion(source,power,command,{user,requestId:'fusion'});
 assert.equal(source.system.resources.chakra.value,37);assert.equal(sizeProfile(source.system).key,'huge');
 assert.equal(effectiveAttributes(source.system).for,13);assert.equal(source.system.attributes.for,10);
 assert.equal(derivedSummary(source).vitality,sourceVitality);assert.equal(derivedSummary(source).movement,21);
 assert.equal(animalToken.hidden,true);assert.equal(bodySource(companion),source);assert.equal(joinedBody(companion),true);
 assert.equal(partnerDamageDivisor(source),1);assert.equal(hudActors().includes(companion),false);
 assert.equal(statPrecision(companion,'cc',{kind:'attack'}).allowed,false);
 assert.deepEqual(companion.system.resources,animalResources);assert.equal(game.messages.length,1);
 const hit={base:5,sourceId:'body-hit',critical:true,camouflageContext:{located:true}};
 await applyPhysicalDamage(companion,hit);await applyPhysicalDamage(source,hit);
 assert.equal(source.system.resources.vitality.value,95);assert.deepEqual(companion.system.resources,animalResources);
 await origin.update({x:500,y:400});await endPower(source,'fusion');
 assert.equal(sizeProfile(source.system).key,'medium');assert.equal(source.system.resources.vitality.value,95);
 assert.equal(animalToken.hidden,false);assert.equal(animalToken.x,500);assert.equal(animalToken.y,400);
 assert.equal(joinedBody(companion),false);assert.deepEqual(companion.system.resources,animalResources);
 await applyPhysicalDamage(companion,hit);assert.equal(source.system.resources.vitality.value,95);
 assert.deepEqual(companion.system.resources,animalResources);
});

test('two-headed basic strikes share the same target but have independent ordinary and half-base damage; Garouga uses the existing charge plan',async()=>{
 const {source,power,actors,command}=await fusionSetup();
 await activateInuzukaFusion(source,power,command,{user:game.user,requestId:'fusion'});
 const prepared=prepareWeaponAction(source,'unarmed',{shikakyu:true,maneuver:'golpear'});
 assert.equal(prepared.attacks.length,2);assert.equal(prepared.plan.fusionTwoHeads,true);
 const [normal,extra]=prepared.attacks;
 assert.equal(normal.base,11);assert.equal(extra.base,6);assert.equal(extra.damagePool,11);
 assert.equal(extra.precision,normal.precision);assert.equal(normal.precision,prepared.plan.precision);
 assert.equal(extra.divisionCount,2);assert.equal(extra.divisionIndex,0);
 assert.equal(prepareWeaponAction(source,'unarmed',{shikakyu:true,maneuver:'derrubar'}).attacks.length,1);
 const target=document({name:'Alvo',type:'creature',system:{attributes:{},resources:{vitality:{value:100,max:100},chakra:{value:20,max:20}},physical:{size:'medium',bodyHardness:2},conditions:[]}});actors.push(target);
 const hit=await applyPhysicalDamage(target,{base:extra.damagePool,degree:1,divisionCount:extra.divisionCount,divisionIndex:0,sourceId:'extra',critical:true,camouflageContext:{located:true}});
 assert.equal(hit.damage,5); // ceil((11 - 2) / 2), hardness before division.
 const garouga=powerPlan(power,source.system,source.items,{effect:'garouga',level:8},{actor:source,books:['basico'],attributes:effectiveAttributes(source.system)});
 assert.equal(garouga.cost,2);assert.equal(garouga.damage,17);assert.equal(garouga.range,3);assert.equal(garouga.charge,true);
 await endPower(source,'fusion');
 assert.throws(()=>powerPlan(power,source.system,source.items,{effect:'garouga',level:8},{actor:source,books:['basico']}),/Sotorou/);
});

test('fusion upkeep is paid once per new turn, skips the activation turn and separates participants when chakra runs out',async()=>{
 const {source,power,companion,animalToken,command}=await fusionSetup();
 await activateInuzukaFusion(source,power,command,{user:game.user,requestId:'fusion'});
 await advancePowerPhase(source,'initial','start');assert.equal(source.system.resources.chakra.value,37);
 await source.update({[`flags.${ID}.currentTurnKey`]:'second'});
 await Promise.all([advancePowerPhase(source,'second','start'),advancePowerPhase(source,'second','start')]);
 assert.equal(source.system.resources.chakra.value,34);
 await advancePowerPhase(source,'second-end','end');assert.equal(source.system.resources.chakra.value,34);
 game.combat={started:true,turns:[{actor:source}]};game.time.worldTime=120;
 assert.equal((await advanceAutomaticPowerTime(source)).combat,true);assert.equal(source.system.resources.chakra.value,34);
 source.system.resources.chakra.value=2;await source.update({[`flags.${ID}.currentTurnKey`]:'third'});
 await advancePowerPhase(source,'third','start');assert.equal(source.system.resources.chakra.value,2);
 assert.equal(joinedBody(companion),false);assert.equal(animalToken.hidden,false);assert.equal(sizeProfile(source.system).key,'medium');
});

test('fusion upkeep follows six-second turns outside combat, without refunds or double payments on concurrent clock updates',async()=>{
 const {source,power,command}=await fusionSetup();
 await activateInuzukaFusion(source,power,command,{user:game.user,requestId:'fusion'});
 game.time.worldTime=5.9;await advanceAutomaticPowerTime(source);assert.equal(source.system.resources.chakra.value,37);
 game.time.worldTime=6;await advanceAutomaticPowerTime(source);assert.equal(source.system.resources.chakra.value,34);
 game.time.worldTime=12;await Promise.all([advanceAutomaticPowerTime(source),advanceAutomaticPowerTime(source)]);
 assert.equal(source.system.resources.chakra.value,31);
 game.time.worldTime=0;await advanceAutomaticPowerTime(source);assert.equal(source.system.resources.chakra.value,31);
 game.time.worldTime=100;await advanceAutomaticPowerTime(source);assert.equal(source.system.resources.chakra.value,1);
 assert.equal(sizeProfile(source.system).key,'medium');
});

test('Santorou requires two linked participants including an animal, preserves hidden states and unwinds orphaned links',async()=>{
 const {source,power,actors,companion,scene,addToken,command}=await fusionSetup();
 const clone=document({name:'Kage',type:'creature',system:structuredClone(companion.system),flags:{[ID]:{clone:{origin:source.uuid,type:'kage-bunshin'}}}});actors.push(clone);
 const token=addToken(clone,0,100,true);
 assert.throws(()=>fusionParticipants(source,'santorou',[clone.uuid]),/Marque/);
 command.options.effect='santorou';command.participants.push(clone.uuid);
 await activateInuzukaFusion(source,power,command,{user:game.user,requestId:'fusion'});
 assert.equal(sizeProfile(source.system).key,'gargantuan');assert.equal(derivedSummary(source).movement,24);
 assert.equal(source.system.resources.chakra.value,36);assert.equal(partnerDamageDivisor(source),1);
 const {canCoordinateArea}=await import('../src/power-rules.mjs');
 const ooiga=powerPlan(power,source.system,source.items,{effect:'ooiga-gatenga',level:8},{actor:source,books:['basico'],attributes:effectiveAttributes(source.system)});
 assert.equal(ooiga.cost,3);assert.equal(ooiga.action,'full');assert.equal(ooiga.area,'line');assert.equal(ooiga.size,5);
 assert.equal(ooiga.damage,20);assert.equal(ooiga.chargeLine,true);assert.equal(canCoordinateArea(ooiga),true);
 assert.equal(ooiga.resistances[0].difficulty,15);
 source.system.powerState.active=source.system.powerState.active.filter(p=>p.id!=='fusion');
 assert.throws(()=>powerPlan(power,source.system,source.items,{effect:'ooiga-gatenga',level:8},{actor:source,books:['basico']}),/Santorou/);
 await reconcileBodyLinks();assert.equal(joinedBody(companion),false);assert.equal(token.hidden,true);
 assert.ok(scene.tokens.includes(token));assert.equal(actors.length,3);
});

test('fusion validates touch and participant permissions before paying, then resumes a partially hidden body without another payment',async()=>{
 const {source,power,companion,animalToken,command}=await fusionSetup();
 const user={id:'player',isGM:false,viewedScene:'test-scene'};
 source.testUserPermission=()=>true;companion.testUserPermission=()=>false;
 await assert.rejects(activateInuzukaFusion(source,power,command,{user,requestId:'fusion'}),/controlar todos/);
 assert.equal(source.system.resources.chakra.value,40);
 companion.testUserPermission=()=>true;animalToken.x=300;
 assert.throws(()=>prepareFusionScene(source,[companion],command),/toque/);
 await assert.rejects(activateInuzukaFusion(source,power,command,{user,requestId:'fusion'}),/toque/);
 assert.equal(source.system.resources.chakra.value,40);animalToken.x=100;
 const update=animalToken.update.bind(animalToken);let fail=true;
 animalToken.update=async patch=>{if(fail){fail=false;throw Error('ocultação interrompida');}return update(patch);};
 await assert.rejects(activateInuzukaFusion(source,power,command,{user,requestId:'fusion'}),/interrompida/);
 assert.equal(source.system.resources.chakra.value,37);assert.equal(statPrecision(source,'cc',{kind:'attack'}).allowed,false);
 await activateInuzukaFusion(source,power,command,{user,requestId:'fusion'});
 assert.equal(source.system.resources.chakra.value,37);assert.equal(animalToken.hidden,true);
 assert.equal(source.system.powerState.active.find(p=>p.id==='fusion').fusionReady,true);
});
