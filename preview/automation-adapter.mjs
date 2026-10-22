import {CLONE_ACTIONS,cloneAction} from '../src/clone-actions.mjs';
import {TECHNIQUE_ACTIONS,techniqueAction} from '../src/technique-actions.mjs';
import {APTITUDE_USE_ACTIONS,aptitudeUseAction} from '../src/aptitude-use.mjs';
import {validatePurchase} from '../src/item-validation.mjs';
import {CATALOG_ACTIONS,catalogAction} from '../src/catalog.mjs';
// Development-only bridge. It exercises the runtime actions against local data;
// it is not a Foundry world and is excluded from the installable package.
import {ID} from '../src/config.mjs';
import {BUILD_ACTIONS,buildAction} from '../src/build-actions.mjs';
import {validateBuildChange} from '../src/build-rules.mjs';
import {SUMMARY_ACTIONS,automationAction,refreshBudget} from '../src/summary-actions.mjs';
import {allocationProposal,conditionRecords,getActorView,houseRules,saveCondition,clampResourceChanges,restRecovery} from '../src/automation.mjs';
import {CONDITIONS} from '../src/conditions.mjs';
import {readFields} from '../src/interactions.mjs';
import {set} from '../src/ui.mjs';
export function previewAutomation({state,persist,navigate,render,surface}) {
  let values={},panelConfig={};const raw=()=>state().actor;
  const text=html=>{const template=document.createElement('template');template.innerHTML=html;return template.content.textContent;};
  const collection=(entries,wrap)=>({contents:entries.map(wrap),get:id=>entries.some(e=>e.id===id)?wrap(entries.find(e=>e.id===id)):null,map:fn=>entries.map(e=>fn(wrap(e))),filter:fn=>entries.map(wrap).filter(fn),[Symbol.iterator]:function*(){yield* entries.map(wrap);}});
  class Item {constructor(data){this.data=data;this.id=data.id;this.name=data.name;this.type=data.type;this.img=data.img;this.system=data.system;this.isOwner=true;this.visible=true;}async update(patch){const next=structuredClone(this.data);for(const[k,v]of Object.entries(patch))set(next,k,v);const errors=validatePurchase(actor,next,{previous:this.data,rules:houseRules(),isGM:game.user.isGM});if(errors.length)throw Error(errors.join(" "));Object.assign(this.data,next);this.system=this.data.system;persist();}toObject(){return structuredClone(this.data);}get sheet(){return {render:()=>navigate(this.type==='equipment'||this.type==='device'?'item':this.type)};}}
  class Effect {getFlag(ns,key){return this.flags?.[ns]?.[key];}constructor(data){Object.assign(this,data);this.statuses=new Set(data.statuses??[]);this.disabled=!!data.disabled;}async update(update){Object.assign(raw().effects.find(e=>e.id===this.id),structuredClone(update));persist();}async delete(){raw().effects=(raw().effects??[]).filter(e=>e.id!==this.id);persist();}}
  class Actor {
    static documentName='Actor';constructor(read=raw){this.read=read;}
    async delete(){state().clones=(state().clones??[]).filter(c=>c.id!==this.id);persist();}
get system(){return this.read().system;}get id(){return this.read().id;}get uuid(){return this.read().uuid;}get name(){return this.read().name;}get type(){return this.read().type;}get img(){return this.read().img;}get isOwner(){return true;}get inCombat(){return false;}get _source(){return this.read();}
    get items(){return collection(this.read().items,i=>new Item(i));}get effects(){return collection(this.read().effects??[],e=>new Effect(e));}
    toObject(){return structuredClone(this.read());}getFlag(ns,key){return this.read().flags?.[ns]?.[key];}
    async update(patch,options={}){const changes={};for(const[k,v]of Object.entries(patch))set(changes,k,v);const errors=validateBuildChange(this.system,changes.system??{},this.items.contents,houseRules());if(errors.length)throw Error(errors.join(" "));for(const cap of clampResourceChanges(this,changes.system??{}))patch[`system.resources.${cap.key}.value`]=cap.value;for(const [key,value]of Object.entries(patch))set(this.read(),key,structuredClone(value));persist();if(options.snsOpenAllocation){values=allocationProposal(this,{});navigate("allocation");}return this;}
    async createEmbeddedDocuments(type,entries){const key=type==='ActiveEffect'?'effects':'items';this.read()[key]??=[];const added=entries.map(e=>({...structuredClone(e),id:crypto.randomUUID()}));this.read()[key].push(...added);persist();return added.map(e=>type==='ActiveEffect'?new Effect(e):new Item(e));}
    async deleteEmbeddedDocuments(type,ids){const key=type==='ActiveEffect'?'effects':'items';this.read()[key]=(this.read()[key]??[]).filter(e=>!ids.includes(e.id));persist();}
  }
  const actor=new Actor();
  class PreviewRoll {
    constructor(formula){this.formula=formula;}
    async evaluate(){const match=/^(1|2)d8(?: \+ \((-?\d+)\))?$/.exec(this.formula);if(!match)throw Error('Fórmula inesperada na prévia.');this.results=Array.from({length:Number(match[1])},()=>{if(window.__previewDice?.length)return window.__previewDice.shift();return crypto.getRandomValues(new Uint8Array(1))[0]%8+1;});this.total=this.results.reduce((a,b)=>a+b,0)+Number(match[2]??0);return this;}
    async toMessage(message){state().records.push({title:text(message.flavor??'Teste'),notes:`Prévia demonstrativa: ${this.formula}; dados ${this.results.join(', ')}; total ${this.total}.`,automated:true});persist();}
  }
  globalThis.foundry={utils:{deepClone:value=>structuredClone(value),randomID:()=>crypto.randomUUID()},dice:{Roll:PreviewRoll}};
  globalThis.game={user:{id:'preview-gm',isGM:true,can:()=>true},settings:{get:(_id,key)=>key==='houseRules'?(state().houseRules??{advancement:'level'}):key==='profile'?state().profile:key==='theme'?state().theme:key==='sceneEpoch'||key==='dayEpoch'?state()[key]??0:state().reduceMotion,set:async(_id,key,value)=>{if(key==='houseRules')state().houseRules=value;else state()[key]=value;persist();}},actors:{get contents(){return [actor,...(state().clones??[]).map(d=>new Actor(()=>d))];},get(id){return this.contents.find(a=>a.id===id);},filter(fn){return this.contents.filter(fn);}}};
  globalThis.fromUuid=async uuid=>game.actors.contents.find(a=>a.uuid===uuid);
  globalThis.CONFIG={Actor:{documentClass:{createDocuments:async entries=>{state().clones??=[];const added=entries.map(e=>{const id=crypto.randomUUID();return {...structuredClone(e),id,uuid:'Actor.'+id};});state().clones.push(...added);persist();return added.map(d=>new Actor(()=>d));}}}};
  globalThis.ui={notifications:{info:message=>document.querySelector('#preview-state').textContent=message,error:message=>document.querySelector('#preview-state').textContent=message}};
  globalThis.ChatMessage={getSpeaker:()=>({actor:actor.id}),create:async message=>{state().records.push({title:text(message.content),notes:'Prévia local de um registro calculado; nenhum mundo real foi alterado.',automated:true});persist();}};
  const show=(kind,config={})=>{values=config.values??{};panelConfig=config;navigate(kind);};
  return {
    actor,
    env(kind){if(kind==='allocation')values=allocationProposal(actor,values);let restPlan,restError;if(kind==='recovery')try{restPlan=restRecovery(actor);}catch(e){restError=e.message;}return {...panelConfig,restPlan,restError,actor:getActorView(actor),values,houseRules:houseRules(),granted:values.granted,initial:values.initial,isGM:game.user.isGM};},
    async change(key,value){const kind=location.hash.slice(1);if(kind==='aptitude-use'&&key.startsWith('clone.')){Object.assign(values,readFields(surface,'clone.'));if(key==='clone.version')render();return true;}if(key.startsWith('allocation.')){set(values,key.slice(11),value);if(key==='allocation.nc')render();else refreshBudget(surface);return true;}if(kind==='condition'&&key==='entry.key'){for(const[k,v]of Object.entries(readFields(surface,'entry.')))set(values,k.slice(6),v);values.key=value;values.name=CONDITIONS[value]?.name??values.name;values.source=CONDITIONS[value]?.source??values.source;render();return true;}if(kind==='recovery'){for(const[k,v]of Object.entries(readFields(surface,'resource.')))set(values,k.slice(9),v);if(key==='resource.operation')render();return true;}if(kind==='roll'){for(const[k,v]of Object.entries(readFields(surface,'roll.')))set(values,k.slice(5),v);if(key==='roll.stat'&&values.conditionId){values.difficulty=value==='medicina'?16:18;values.reaction=value==='vig';render();}return true;}return false;},
    async action(op,data,root){
      const kind=location.hash.slice(1)||'summary';
      if(op==='condition'){values=conditionRecords(actor).find(r=>r.id===data.id)??{key:data.key,name:CONDITIONS[data.key]?.name,source:CONDITIONS[data.key]?.source};navigate('condition');return true;}
      if(['save-entry','delete-entry'].includes(op)&&kind==='condition'){const v={...values,...Object.fromEntries(Object.entries(readFields(root,'entry.')).map(([key,value])=>[key.slice(6),value]))};await saveCondition(actor,v,{remove:op==='delete-entry'});navigate('conditions');return true;}
      if(!CLONE_ACTIONS.has(op)&&!SUMMARY_ACTIONS.has(op)&&!BUILD_ACTIONS.has(op)&&!CATALOG_ACTIONS.has(op)&&!APTITUDE_USE_ACTIONS.has(op)&&!TECHNIQUE_ACTIONS.has(op))return false;
      const app={kind,values,panelConfig,_actor:actor,render:()=>render(),close:async()=>navigate('summary')};
      await (CLONE_ACTIONS.has(op)?cloneAction:TECHNIQUE_ACTIONS.has(op)?techniqueAction:APTITUDE_USE_ACTIONS.has(op)?aptitudeUseAction:CATALOG_ACTIONS.has(op)?catalogAction:BUILD_ACTIONS.has(op)?buildAction:automationAction)(app,op,data,root,{actor,show});if(location.hash.slice(1)===kind)render();return true;
    }
  };
}
