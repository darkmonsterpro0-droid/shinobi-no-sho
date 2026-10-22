import test from 'node:test';
import assert from 'node:assert/strict';
import {POWER_FAMILIES} from '../src/power-data.mjs';
import {affinityStatus,validatePowerPurchase,powerPurchaseCost,powerParameters,powerPlan,elementalConfrontation} from '../src/power-rules.mjs';
import {powerAction,resolvePowerAttack,advancePowerPhase,endPower} from '../src/power-actions.mjs';
import {bodyHardness} from '../src/physical-actions.mjs';
import {derivedSummary,statPrecision} from '../src/automation.mjs';
import {ID} from '../src/config.mjs';
import {set} from '../src/ui.mjs';
let serial=0,dice=[],messages=[];
const actors=[];actors.contents=actors;
globalThis.game={user:{id:'gm',isGM:true},actors,time:{worldTime:0},settings:{get:(_id,key)=>key==='profile'?{books:['basico','avancado']}:{}},messages:new Map()};
function message(data){const m={...data,id:String(++serial),getFlag(ns,key){return this.flags?.[ns]?.[key];}};m.uuid='ChatMessage.'+m.id;messages.push(m);game.messages.set(m.id,m);return m;}
globalThis.ChatMessage={getSpeaker:()=>({}),create:async data=>message(data)};
globalThis.foundry={utils:{randomID:()=>String(++serial),deepClone:structuredClone},dice:{Roll:class{constructor(formula){this.formula=formula;}async evaluate(){this.total=(dice.shift()??10)+Number(this.formula.match(/\+ \((-?[\d.]+)\)/)?.[1]??0);return this;}async toMessage(data){return message({...data,total:this.total});}}}};
globalThis.fromUuid=async id=>actors.find(a=>a.uuid===id)||messages.find(m=>m.uuid===id);
const power=(family,level,choices=[],track=1)=>({id:String(++serial),name:POWER_FAMILIES[family].name,type:'power',system:{level,catalogKey:family,catalogBook:'basico',powerData:{family,track,choices:choices.map(([effect,tier])=>({effect,tier}))}}});
const aptitude=key=>({id:String(++serial),type:'aptitude',system:{catalogKey:key,catalogBook:'basico',level:1,acquisition:'Concedida'}});
function actor(){
 const a={id:String(++serial),type:'character',isOwner:true,visible:true,name:'Teste',flags:{},items:[],effects:[],system:{campaign:{level:20},attributes:{for:12,des:12,agi:12,per:12,int:20,vig:20,esp:20},skills:{mecanismos:{points:5},medicina:{points:5},ocultismo:{points:10}},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},resources:{vitality:{value:100,max:100},chakra:{value:70,max:70}},inventoryState:{},powerState:{},conditions:[],physical:{size:'medium'},movement:{distance:15}}};
 a.uuid='Actor.'+a.id;a.getFlag=(ns,k)=>a.flags[ns]?.[k];a.toObject=()=>({system:structuredClone(a.system)});a.update=async patch=>{for(const[k,v]of Object.entries(patch))set(a,k,structuredClone(v));};
 a.items.get=id=>a.items.find(i=>i.id===id);a.effects.get=id=>a.effects.find(i=>i.id===id);
 a.createEmbeddedDocuments=async(type,records)=>records.map(r=>{const list=type==='Item'?a.items:a.effects;const d={...structuredClone(r),id:String(++serial),getFlag(ns,k){return this.flags?.[ns]?.[k];},async update(patch){for(const[k,v]of Object.entries(patch))set(this,k,structuredClone(v));},async delete(){list.splice(list.indexOf(this),1);}};list.push(d);return d;});
 actors.push(a);return a;
}
const fields=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value,type:typeof value==='number'?'number':'text'}))});
const app=()=>({values:{},panelConfig:{},render:async()=>{},close:async()=>{}});
const attackMessage=(source,plan,natural=12)=>message({flags:{[ID]:{powerAttack:{actorUuid:source.uuid,itemId:'test',plan,precision:15,total:natural+15,natural,degree:3,critical:false,failed:false}}}});

test('affinities count distinct basic elements, require ESP 10 for the second and only accept documented exceptions',()=>{
 const a=actor();a.system.attributes.esp=9;const doton=power('doton',1),fuuton=power('fuuton',1);assert.equal(affinityStatus(a.system,[doton,fuuton]).allowed,false);
 a.system.attributes.esp=10;assert.equal(affinityStatus(a.system,[doton,fuuton,power('doton',2)]).allowed,true);
 assert.equal(affinityStatus(a.system,[doton,fuuton,power('katon',1)]).allowed,false);
 a.system.powerState.affinity={approved:true,reason:'Exceção do clã',excluded:['katon']};assert.equal(affinityStatus(a.system,[doton,fuuton,power('katon',1)]).allowed,true);
 a.system.powerState.affinity.reason='';assert.equal(affinityStatus(a.system,[doton,fuuton,power('katon',1)]).allowed,false);
});
test('additional elemental tracks grant just one free level and deleting the original still leaves one fully paid track',()=>{
 for(const family of ['ninpou','doton','fuuton','katon','raiton','suiton']){const first=power(family,4,[],1),second=power(family,3,[],2);assert.equal(powerPurchaseCost(first,[first,second]),4);assert.equal(powerPurchaseCost(second,[first,second]),2);assert.equal(powerPurchaseCost(second,[second]),3);}
});
test('power purchases cannot skip evolutions, rewrite learned choices, lower levels or duplicate tracks',()=>{
 const a=actor(),p=power('ninpou',3,[['canhao',1],['orbe',2],['flechas',3]]);assert.deepEqual(validatePowerPurchase(a,p),[]);
 const changed=structuredClone(p);changed.system.powerData.choices[2]={effect:'flechas',tier:6};assert.ok(validatePowerPurchase(a,changed).length);
 changed.system.powerData.choices[2]={effect:'raio',tier:2};assert.match(validatePowerPurchase(a,changed,{previous:p}).join(' '),/trocados/);
 a.items.push(p);const repeated=power('ninpou',1,[['canhao',1]]);assert.match(validatePowerPurchase(a,repeated).join(' '),/sequência/);
});
test('family parameters, free cannon and elemental weaknesses preserve published rounding and exceptions',()=>{
 assert.deepEqual(powerParameters('doton',3,9),{damage:8,difficulty:17,hardness:10,range:14,size:9,solid:true});
 assert.equal(powerParameters('raiton',3,9).size,5);
 assert.deepEqual(elementalConfrontation('raiton','doton'),{attack:1,defense:.5});assert.deepEqual(elementalConfrontation('doton','suiton',{mist:true}),{attack:1,defense:1});
 const a=actor(),p=power('katon',2,[['canhao',1],['orbe',2]]),plan=powerPlan(p,a.system,[p],{effect:'canhao',mode:'free'});assert.equal(plan.cost,0);assert.equal(plan.damage,3);assert.equal(plan.noOtherBenefits,true);
});
test('Misshi costs exactly three chakra and a single special tag; release does not charge it again',async()=>{
 const a=actor(),p=power('fuuinjutsu',3);a.items.push(p);await a.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:2}}]);
 await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'misshi','power.level':3,'power.message':'Mensagem'}),{actor:a});
 assert.equal(a.system.resources.chakra.value,67);assert.equal(a.items[1].system.quantity,1);const seal=a.system.powerState.active[0];
 await powerAction(app(),'power-release-seal',{id:seal.id},fields({}),{actor:a});assert.equal(a.system.resources.chakra.value,67);assert.equal(a.system.powerState.active.length,0);
});
test('Wana charges 4 plus the actual stored jutsu and reuses its creation roll when triggered',async()=>{
 const a=actor(),p=power('fuuinjutsu',6),nin=power('ninpou',2,[['canhao',1],['orbe',2]]);a.items.push(p,nin);await a.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:2}}]);dice=[12];
 await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'wana','power.level':6,'power.storedPowerId':nin.id,'power.storedEffect':'canhao','power.storedTier':1,'power.jutsuLevel':2,'power.jutsuCost':999}),{actor:a});
 assert.equal(a.system.resources.chakra.value,64);const seal=a.system.powerState.active[0];assert.equal(seal.stored.attack.natural,12);assert.equal(seal.stored.plan.damage,4);
 dice=[2];await powerAction(app(),'power-release-seal',{id:seal.id},fields({}),{actor:a});assert.equal(messages.at(-1).getFlag(ID,'powerAttack').natural,12);assert.equal(a.system.resources.chakra.value,64);assert.deepEqual(dice,[2]);dice=[];
});
test('power execution retry keeps chakra and consumables charged once',async()=>{
 const a=actor(),p=power('fuuinjutsu',3);a.items.push(p);await a.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:2}}]);const panel=app(),root=fields({'power.id':p.id,'power.effect':'misshi','power.level':3});
 await powerAction(panel,'power-execute',{},root,{actor:a});await powerAction(panel,'power-execute',{},root,{actor:a});assert.equal(a.system.resources.chakra.value,67);assert.equal(a.items[1].system.quantity,1);
});
test('missile follow-ups compare the existing defense and do not repeat damage or dice on a second confirmation',async()=>{
 const a=actor(),target=actor(),p=power('ninpou',5,[['missil',5]]),plan=powerPlan(p,a.system,[p],{effect:'missil'}),m=attackMessage(a,plan);dice=[12];
 const result=await resolvePowerAttack(m,target.uuid,{hit:true,defenseTotal:20});assert.equal(result.damage,(plan.damage+1)*3);const life=target.system.resources.vitality.value;dice=[2];
 assert.equal((await resolvePowerAttack(m,target.uuid,{hit:true,defenseTotal:20})).duplicate,true);assert.equal(target.system.resources.vitality.value,life);assert.deepEqual(dice,[2]);dice=[];
});
test('Flechas assigns two damage per allocated projectile and adds the elemental bonus once per target',async()=>{
 const a=actor(),t=actor(),p=power('fuuton',3,[['flechas',3]]),plan=powerPlan(p,a.system,[p],{effect:'flechas'});const r=await resolvePowerAttack(attackMessage(a,plan),t.uuid,{hit:true,projectiles:1});assert.equal(r.damage,12);
 await assert.rejects(()=>resolvePowerAttack(attackMessage(a,plan),t.uuid,{hit:true,projectiles:4}),/projéteis/);
});
test('target owner can resolve an attack made by another player; no caster ownership is required',async()=>{
 const a=actor(),t=actor();a.isOwner=false;const plan=powerPlan(power('ninpou',1,[['canhao',1]]),t.system,[],{effect:'canhao'}),m=attackMessage(a,plan);let shown;
 await powerAction(app(),'power-resolve',{message:m.id},fields({}),{actor:a,show:async(k,c)=>{shown=c;}});assert.equal(shown.resolveMessage,m.id);
 await powerAction(app(),'power-confirm-hit',{},fields({'resolve.message':m.id,'resolve.targetUuid':t.uuid,'resolve.hit':'yes'}),{actor:a});assert.equal(t.system.resources.vitality.value,94);
});
test('temporary flight and immersion derive movement and flight precision without rewriting invested attributes',()=>{
 const a=actor(),normal=derivedSummary(a).movement;a.system.powerState.active=[{flightSkill:20,movementMultiplier:.5}];assert.equal(statPrecision(a,'voo',{kind:'skill'}).precision,20);assert.equal(derivedSummary(a).movement,Math.ceil(normal/2));assert.equal(a.system.attributes.esp,20);
 a.system.powerState.active[0].movementMultiplier=0;assert.equal(derivedSummary(a).movement,0);
});
test('body hardness respects the elemental cycle and the distinct lightning blade protections',()=>{
 const a=actor();a.system.powerState.active=[{family:'doton',bodyHardness:7},{family:'raiton',bodyHardness:6}];assert.equal(bodyHardness(a,{element:'raiton'}),6);assert.equal(bodyHardness(a,{conditionalHardness:'fuuton-normal-raiton-half'}),3);
 a.system.powerState.active.push({family:'fuuton',bodyHardness:5});assert.equal(bodyHardness(a,{conditionalHardness:'fuuton-normal-raiton-half'}),5);
});
test('ending a power clears linked conditions on the target and periodic damage never repeats a phase',async()=>{
 const a=actor(),t=actor();a.system.powerState.active=[{id:'root',name:'Algemar'}];t.system.powerState.active=[{id:'receipt',linkedTo:'root'}];await t.createEmbeddedDocuments('ActiveEffect',[{flags:{[ID]:{condition:{key:'impedido',powerReceipt:'receipt'}}},statuses:['sns-impedido']}]);await endPower(a,'root');assert.equal(t.effects.length,0);assert.equal(t.system.powerState.active.length,0);
 t.system.powerState.active=[{id:'dot',name:'Dano',createdTurn:'old',periodic:{immediate:true,damage:2},remainingDamage:2,starts:1,sourceUuid:a.uuid}];await advancePowerPhase(t,'turn1','start');const hp=t.system.resources.vitality.value;await advancePowerPhase(t,'turn1','start');assert.equal(t.system.resources.vitality.value,hp);assert.equal(hp,98);
});


test('Cegante and continuous damage retain their escape rules on the affected actor',async()=>{
 for(const [effect,tier] of [['cegante',5],['dano-continuo',2]]){
  const source=actor(),target=actor(),p=power(effect==='cegante'?'suiton':'katon',tier,[[effect,tier]]),plan=powerPlan(p,source.system,[p],{effect,tier});
  const m=attackMessage(source,plan);await resolvePowerAttack(m,target.uuid,{hit:true});
  const active=target.system.powerState.active[0];assert.ok(active.linkedTo);assert.ok(active.plan.resistances.some(r=>r.escape));
  dice=[16];await powerAction(app(),'power-escape',{id:active.id},fields({[`escape.${active.id}.stat`]:effect==='cegante'?'for':'vig'}),{actor:target});
  assert.equal(target.system.powerState.active.length,0);dice=[];
 }
});

test('Souin pools clone chakra and leaves the origin at one even if its own reserve was empty',async()=>{
 const source=actor(),clone=actor(),p=power('fuuinjutsu',10);source.items.push(p);source.system.resources.chakra.value=0;clone.system.resources.chakra.value=15;
 clone.flags[ID]={clone:{origin:source.uuid,type:'kage-bunshin'}};
 await source.createEmbeddedDocuments('Item',[{type:'equipment',system:{catalogKey:'special-tag',quantity:1}}]);
 await powerAction(app(),'power-execute',{},fields({'power.id':p.id,'power.effect':'souin','power.level':10}),{actor:source});
 await powerAction(app(),'power-release-seal',{id:source.system.powerState.active[0].id},fields({}),{actor:source});
 assert.equal(source.system.resources.chakra.value,1);assert.equal(clone.system.resources.chakra.value,0);
});
