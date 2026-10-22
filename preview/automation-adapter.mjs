// Development-only bridge. It exercises the runtime actions against local data;
// it is not a Foundry world and is excluded from the installable package.
import {ID} from '../src/config.mjs';
import {SUMMARY_ACTIONS,automationAction,refreshBudget} from '../src/summary-actions.mjs';
import {allocationProposal,conditionRecords,getActorView,houseRules,saveCondition,clampResourceChanges,restRecovery} from '../src/automation.mjs';
import {CONDITIONS} from '../src/conditions.mjs';
import {readFields} from '../src/interactions.mjs';
import {set} from '../src/ui.mjs';
export function previewAutomation({state,persist,navigate,render,surface}) {
  let values={};const raw=()=>state().actor;
  const text=html=>{const template=document.createElement('template');template.innerHTML=html;return template.content.textContent;};
  const collection=(entries,wrap)=>({contents:entries.map(wrap),get:id=>entries.some(e=>e.id===id)?wrap(entries.find(e=>e.id===id)):null,map:fn=>entries.map(e=>fn(wrap(e))),filter:fn=>entries.map(wrap).filter(fn),[Symbol.iterator]:function*(){yield* entries.map(wrap);}});
  class Item {constructor(data){this.data=data;this.id=data.id;this.name=data.name;this.type=data.type;this.img=data.img;this.system=data.system;this.isOwner=true;this.visible=true;}toObject(){return structuredClone(this.data);}get sheet(){return {render:()=>navigate(this.type==='equipment'||this.type==='device'?'item':this.type)};}}
  class Effect {constructor(data){Object.assign(this,data);this.statuses=new Set(data.statuses??[]);this.disabled=!!data.disabled;}async update(update){Object.assign(raw().effects.find(e=>e.id===this.id),structuredClone(update));persist();}async delete(){raw().effects=(raw().effects??[]).filter(e=>e.id!==this.id);persist();}}
  class Actor {
    static documentName='Actor';get system(){return raw().system;}get id(){return raw().id;}get uuid(){return raw().uuid;}get name(){return raw().name;}get type(){return raw().type;}get img(){return raw().img;}get isOwner(){return true;}get inCombat(){return false;}get _source(){return raw();}
    get items(){return collection(raw().items,i=>new Item(i));}get effects(){return collection(raw().effects??[],e=>new Effect(e));}
    toObject(){return structuredClone(raw());}getFlag(ns,key){return raw().flags?.[ns]?.[key];}
    async update(patch){const changes={};for(const[k,v]of Object.entries(patch))set(changes,k,v);for(const cap of clampResourceChanges(this,changes.system??{}))patch[`system.resources.${cap.key}.value`]=cap.value;for(const [key,value]of Object.entries(patch))set(raw(),key,structuredClone(value));persist();return this;}
    async createEmbeddedDocuments(type,entries){const key=type==='ActiveEffect'?'effects':'items';raw()[key]??=[];const added=entries.map(e=>({...structuredClone(e),id:crypto.randomUUID()}));raw()[key].push(...added);persist();return added.map(e=>type==='ActiveEffect'?new Effect(e):new Item(e));}
    async deleteEmbeddedDocuments(type,ids){const key=type==='ActiveEffect'?'effects':'items';raw()[key]=(raw()[key]??[]).filter(e=>!ids.includes(e.id));persist();}
  }
  const actor=new Actor();
  class PreviewRoll {
    constructor(formula){this.formula=formula;}
    async evaluate(){const match=/^(1|2)d8(?: \+ \((-?\d+)\))?$/.exec(this.formula);if(!match)throw Error('Fórmula inesperada na prévia.');this.results=Array.from({length:Number(match[1])},()=>{if(window.__previewDice?.length)return window.__previewDice.shift();return crypto.getRandomValues(new Uint8Array(1))[0]%8+1;});this.total=this.results.reduce((a,b)=>a+b,0)+Number(match[2]??0);return this;}
    async toMessage(message){state().records.push({title:text(message.flavor??'Teste'),notes:`Prévia demonstrativa: ${this.formula}; dados ${this.results.join(', ')}; total ${this.total}.`,automated:true});persist();}
  }
  globalThis.foundry={utils:{deepClone:value=>structuredClone(value),randomID:()=>crypto.randomUUID()},dice:{Roll:PreviewRoll}};
  globalThis.game={user:{id:'preview-gm',isGM:true},settings:{get:(_id,key)=>key==='houseRules'?(state().houseRules??{advancement:'level'}):key==='profile'?state().profile:key==='theme'?state().theme:state().reduceMotion,set:async(_id,key,value)=>{if(key==='houseRules')state().houseRules=value;else state()[key]=value;persist();}},actors:{contents:[actor],filter:fn=>[actor].filter(fn)}};
  globalThis.ui={notifications:{info:message=>document.querySelector('#preview-state').textContent=message,error:message=>document.querySelector('#preview-state').textContent=message}};
  globalThis.ChatMessage={getSpeaker:()=>({actor:actor.id}),create:async message=>{state().records.push({title:text(message.content),notes:'Prévia local de um registro calculado; nenhum mundo real foi alterado.',automated:true});persist();}};
  const show=(kind,config={})=>{values=config.values??{};navigate(kind);};
  return {
    actor,
    env(kind){if(kind==='allocation')values=allocationProposal(actor,values);let restPlan,restError;if(kind==='recovery')try{restPlan=restRecovery(actor);}catch(e){restError=e.message;}return {restPlan,restError,actor:getActorView(actor),values,houseRules:houseRules(),granted:values.granted,initial:values.initial,isGM:game.user.isGM};},
    async change(key,value){const kind=location.hash.slice(1);if(key.startsWith('allocation.')){set(values,key.slice(11),value);if(key==='allocation.nc')render();else refreshBudget(surface);return true;}if(kind==='condition'&&key==='entry.key'){for(const[k,v]of Object.entries(readFields(surface,'entry.')))set(values,k.slice(6),v);values.key=value;values.name=CONDITIONS[value]?.name??values.name;values.source=CONDITIONS[value]?.source??values.source;render();return true;}if(kind==='recovery'){for(const[k,v]of Object.entries(readFields(surface,'resource.')))set(values,k.slice(9),v);if(key==='resource.operation')render();return true;}if(kind==='roll'){for(const[k,v]of Object.entries(readFields(surface,'roll.')))set(values,k.slice(5),v);if(key==='roll.stat'&&values.conditionId){values.difficulty=value==='medicina'?16:18;values.reaction=value==='vig';render();}return true;}return false;},
    async action(op,data,root){
      const kind=location.hash.slice(1)||'summary';
      if(op==='condition'){values=conditionRecords(actor).find(r=>r.id===data.id)??{key:data.key,name:CONDITIONS[data.key]?.name,source:CONDITIONS[data.key]?.source};navigate('condition');return true;}
      if(['save-entry','delete-entry'].includes(op)&&kind==='condition'){const v={...values,...Object.fromEntries(Object.entries(readFields(root,'entry.')).map(([key,value])=>[key.slice(6),value]))};await saveCondition(actor,v,{remove:op==='delete-entry'});navigate('conditions');return true;}
      if(!SUMMARY_ACTIONS.has(op))return false;
      const app={kind,values,_actor:actor,render:()=>render(),close:async()=>navigate('summary')};
      await automationAction(app,op,data,root,{actor,show});render();return true;
    }
  };
}
