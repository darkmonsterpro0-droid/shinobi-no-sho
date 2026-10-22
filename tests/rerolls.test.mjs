import test from 'node:test';
import assert from 'node:assert/strict';
import {ID} from '../src/config.mjs';
import {rerollOption} from '../src/reroll-options.mjs';
import {rerollMessage} from '../src/chat-rerolls.mjs';
import {automationAction} from '../src/summary-actions.mjs';
import {set} from '../src/ui.mjs';
const aptitude=(key,selection)=>({type:'aptitude',system:{catalogKey:key,selection,level:1}});
test('reroll aptitudes match their chosen stat and reject initial automatic failure and a second repeat',()=>{
 const items=[aptitude('pericia-inata','prontidao'),aptitude('resistencia-maior','vig'),aptitude('diligente')];
 assert.equal(rerollOption(items,{kind:'skill',stat:'prontidao',natural:4}).key,'pericia-inata');assert.equal(rerollOption(items,{kind:'skill',stat:'prontidao',natural:3}),null);assert.equal(rerollOption(items,{kind:'skill',stat:'rastrear',natural:8}),null);
 assert.equal(rerollOption(items,{kind:'attribute',stat:'vig',natural:8}),null);assert.equal(rerollOption(items,{kind:'resistance',stat:'vig',natural:8}).key,'resistencia-maior');assert.equal(rerollOption(items,{kind:'resistance',stat:'vig',natural:8,rerollOf:'original'}),null);
 assert.equal(rerollOption(items,{kind:'initiative',natural:1}).limit,1);assert.equal(rerollOption(items,{kind:'skill',stat:'prontidao',natural:16,simulated:true}),null);
});
let serial=0,naturals=[],messages=[],actors=[];
globalThis.game={user:{id:'gm',isGM:true},settings:{get:(_id,key)=>key==='houseRules'?{}:0},actors:{get:id=>actors.find(a=>a.id===id)},combat:null};
globalThis.fromUuid=async uuid=>actors.find(a=>a.uuid===uuid);
globalThis.foundry={utils:{deepClone:structuredClone},dice:{Roll:class{constructor(formula){this.formula=formula;}async evaluate(){const precision=Number(/\((-?\d+)\)/.exec(this.formula)?.[1]??0);this.total=precision+naturals.shift();return this;}async toMessage(data){const m=message(data.flags?.[ID],data);messages.push(m);return m;}}}};
globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id}),create:async()=>{}};
function actor(items=[]){const a={id:String(++serial),uuid:'Actor.'+serial,isOwner:true,type:'character',items,effects:[],flags:{},system:{campaign:{level:8},attributes:{for:4,des:4,agi:4,per:4,int:4,vig:8,esp:4},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},skills:{},movement:{distance:12},combat:{},conditions:[{id:'condition',key:'tonto',name:'Tonto',difficulty:18}],resources:{vitality:{value:70,max:74},chakra:{value:22,max:22}}},getFlag(ns,k){return this.flags[ns]?.[k];},toObject(){return {system:structuredClone(this.system)};},async update(p){for(const[k,v]of Object.entries(p))set(this,k,structuredClone(v));}};a.effects.get=id=>a.effects.find(e=>e.id===id);actors.push(a);return a;}
function message(flags,data={}){return {id:String(++serial),uuid:'ChatMessage.'+serial,isOwner:true,flags:{[ID]:flags??{},...data.flags},speaker:data.speaker,whisper:data.whisper??[],blind:data.blind??false,flavor:data.flavor,getFlag(ns,k){return this.flags[ns]?.[k];},async setFlag(ns,k,v){this.flags[ns]??={};this.flags[ns][k]=v;}};}
const root=values=>({querySelectorAll:()=>Object.entries(values).map(([k,v])=>({name:'roll.'+k,type:typeof v==='number'?'number':'text',value:String(v)}))});
test('a successful resistance with an available repeat is deferred and a worse second roll is binding',async()=>{
 const a=actor([aptitude('resistencia-maior','vig')]);naturals=[10,2];messages=[];
 await automationAction({values:{conditionId:'condition'},close:async()=>{}},'execute-summary-roll',{},root({stat:'vig',kind:'resistance',difficulty:18,bonus:0}),{actor:a});
 assert.equal(a.system.conditions.length,1);assert.equal(messages.length,1);assert.equal(messages[0].getFlag(ID,'success'),true);assert.equal(messages[0].getFlag(ID,'pendingResistance').conditionId,'condition');
 await rerollMessage(messages[0]);assert.equal(a.system.conditions.length,1);assert.equal(messages[1].getFlag(ID,'success'),false);assert.ok(messages[1].getFlag(ID,'rerollOf'));await assert.rejects(()=>rerollMessage(messages[0]),/já foi/);await assert.rejects(()=>rerollMessage(messages[1]),/não permite/);
});
test('accepting a deferred successful resistance removes its condition exactly once without another die roll',async()=>{
 const a=actor([aptitude('resistencia-maior','vig')]);naturals=[10];messages=[];
 await automationAction({values:{conditionId:'condition'},close:async()=>{}},'execute-summary-roll',{},root({stat:'vig',kind:'resistance',difficulty:18,bonus:0}),{actor:a});
 await rerollMessage(messages[0],{accept:true});assert.equal(a.system.conditions.length,0);assert.equal(messages.length,1);assert.equal(naturals.length,0);await assert.rejects(()=>rerollMessage(messages[0],{accept:true}),/já foi/);
});
test('initial critical failure settles immediately and cannot be rerolled',async()=>{
 const a=actor([aptitude('resistencia-maior','vig')]);naturals=[2];messages=[];
 await automationAction({values:{conditionId:'condition'},close:async()=>{}},'execute-summary-roll',{},root({stat:'vig',kind:'resistance',difficulty:18,bonus:0}),{actor:a});assert.equal(messages[0].getFlag(ID,'pendingResistance'),null);await assert.rejects(()=>rerollMessage(messages[0]),/não permite/);
});
test('Diligente repeats native initiative once per scene and updates the combat tracker through Foundry',async()=>{
 const a=actor([aptitude('diligente')]);let calls=0,params;
 game.combat={combatants:[{id:'combatant',actor:a}],async rollInitiative(ids,options){calls++;params={ids,options};}};
 const first=message({},{speaker:{actor:a.id},flags:{core:{initiativeRoll:true}}});await rerollMessage(first);assert.equal(calls,1);assert.deepEqual(params.ids,['combatant']);assert.equal(params.options.updateTurn,false);assert.equal(params.options.messageOptions.flags[ID].rerollOf,first.uuid);
 const second=message({},{speaker:{actor:a.id},flags:{core:{initiativeRoll:true}}});await assert.rejects(()=>rerollMessage(second),/Limite/);assert.equal(calls,1);game.combat=null;
});
