import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAutomatedAptitudeEdit,validatePurchase,createItemClass} from '../src/item-validation.mjs';
import {createApplications} from '../src/apps.mjs';
import {ID,defaultProfile} from '../src/config.mjs';
import {set} from '../src/ui.mjs';

const aptitude=()=>({_id:'clone',type:'aptitude',name:'Clone',img:'icons/svg/mystery-man.svg',system:{catalogKey:'clone',catalogBook:'basico',selection:'generic-resistente',acquisition:'Comprada',level:1,source:{book:'basico',page:'76'},description:'Registro publicado'},flags:{[ID]:{replicaOf:'original'}},effects:[]});
const system=()=>({campaign:{level:12},attributes:{for:4,des:4,agi:4,per:4,int:4,vig:4,esp:8},skills:{},automation:{bases:{cc:3,cd:3,esq:3,lm:3}}});

test('an automated aptitude cannot change its rule data through nested, dotted or deletion updates',()=>{
 const previous=aptitude(),before=structuredClone(previous);
 for(const patch of [{name:'Outro'},{img:'icons/svg/sword.svg'},{type:'power'},{'system.catalogKey':''},{'system.catalogBook':'avancado'},{system:{selection:'kage-bunshin'}},{'system.acquisition':'Concedida'},{'system.source.page':'99'},{'system.description':'Regra diferente'},{'system.notes':'Edição'},{'system.-=catalogKey':null},{system:null},{effects:[{name:'Bônus'}]},{[`flags.${ID}.replicaOf`]:'troca'},{flags:null}])assert.ok(validateAutomatedAptitudeEdit(previous,patch).length,JSON.stringify(patch));
 assert.deepEqual(previous,before);
 assert.deepEqual(validateAutomatedAptitudeEdit(previous,{name:previous.name,system:{selection:previous.system.selection}}),[]);
 assert.deepEqual(validateAutomatedAptitudeEdit(previous,{folder:'nova-pasta',sort:20,ownership:{player:3},'flags.third-party.example':true}),[]);
 assert.deepEqual(validateAutomatedAptitudeEdit({...previous,system:{...previous.system,catalogKey:''}},{name:'Aptidão manual'}),[]);
});

test('the only rule-data edit is a single level evolution and prerequisites and points remain mandatory',()=>{
 const previous=aptitude(),next={...previous,system:{...previous.system,level:2}},actor={system:system(),items:[previous]};
 assert.deepEqual(validateAutomatedAptitudeEdit(previous,{'system.level':2}),[]);
 for(const level of [0,1.5,3,'2'])assert.ok(validateAutomatedAptitudeEdit(previous,{'system.level':level}).length);
 assert.ok(validateAutomatedAptitudeEdit(previous,{'system.level':2},{allowEvolution:false}).length);
 assert.deepEqual(validatePurchase(actor,next,{previous,isGM:true}),[]);
 actor.system.attributes.esp=7;assert.match(validatePurchase(actor,next,{previous,isGM:true}).join(' '),/evolução/);
 actor.system=system();actor.system.campaign.level=4;actor.items.push({_id:'spent',type:'power',system:{level:2}});assert.match(validatePurchase(actor,next,{previous,isGM:true}).join(' '),/excedente/);
});

function runtime(){
 const expanded=patch=>{const result={};for(const[k,v]of Object.entries(patch))set(result,k,structuredClone(v));return result;};
 const merge=(base,patch)=>{const result=structuredClone(base);for(const[k,v]of Object.entries(patch)){if(v&&typeof v==='object'&&!Array.isArray(v))result[k]=merge(result[k]??{},v);else result[k]=v;}return result;};
 class Actor {static documentName='Actor';constructor(){this.system=system();this.items=[];}getFlag(){return this.clone;}}
 class BaseItem {constructor(data,parent){this.data=data;this.parent=parent;}toObject(){return structuredClone(this.data);}async _preUpdate(){}async _preCreate(){}}
 const rendered=[];
 class AppBase {constructor(options={}){this.options=options;this.document=options.document;}render(){rendered.push(this);return this;}async close(){}async _prepareContext(){return {};}}
 globalThis.foundry={utils:{deepClone:structuredClone,expandObject:expanded,mergeObject:merge},applications:{api:{HandlebarsApplicationMixin:b=>b,ApplicationV2:AppBase},sheets:{ActorSheetV2:AppBase,ItemSheetV2:AppBase}}};
 globalThis.game={user:{id:'gm',isGM:true},settings:{get:(_id,key)=>key==='profile'?defaultProfile():{}},items:{get:()=>null},actors:{filter:()=>[]}};
 return {Actor,BaseItem,rendered,apps:createApplications()};
}

test('native item pre-update blocks direct API edits for actor-owned and world aptitudes',async()=>{
 const {Actor,BaseItem}=runtime(),Item=createItemClass(BaseItem),actor=new Actor(),data=aptitude();actor.items=[data];
 const embedded=new Item(data,actor),world=new Item(data,null);
 await assert.rejects(()=>embedded._preUpdate({'system.selection':'kage-bunshin'},{},'gm'),/não podem ser editadas/);
 await assert.rejects(()=>world._preUpdate({name:'Renomeada'},{},'gm'),/não podem ser editadas/);
 await assert.rejects(()=>world._preUpdate({'system.level':2},{},'gm'),/partir da ficha/);
 await assert.doesNotReject(()=>embedded._preUpdate({'system.level':2},{},'gm'));
 actor.system.attributes.esp=7;await assert.rejects(()=>embedded._preUpdate({'system.level':2},{},'gm'),/evolução/);
});

test('clone replica creation remains permitted and the edit lock does not replace purchase validation',async()=>{
 const {Actor,BaseItem}=runtime(),Item=createItemClass(BaseItem),actor=new Actor(),data=aptitude();actor.clone={origin:'Actor.original'};
 await assert.doesNotReject(()=>new Item(data,actor)._preCreate(data,{},'gm'));
 delete data.flags;await assert.rejects(()=>new Item(data,actor)._preCreate(data,{},'gm'),/Clones comuns não adquirem/);
});

test('item-sheet shortcuts cannot edit an automated aptitude and edit-item opens its use panel',async()=>{
 const {Actor,apps,rendered}=runtime(),actor=new Actor();actor.isOwner=true;let writes=0,editors=0;
 const item={...aptitude(),id:'clone',parent:actor,isOwner:true,visible:true,update:async()=>{writes++;},sheet:{render(){editors++;}}};
 actor.items={get:id=>id==='clone'?item:null};
 const sheet=new apps.ShinobiItemSheet({document:item});
 await assert.rejects(()=>sheet._snsChange('name','Alteração'),/não podem ser editadas/);
 await assert.rejects(()=>sheet._snsChange('system.selection','kage-bunshin'),/não podem ser editadas/);
 await assert.rejects(()=>sheet._snsAction('portrait',{},null),/ícone/);
 assert.equal(writes,0);
 const actorSheet=new apps.ShinobiActorSheet({document:actor});await actorSheet._snsAction('edit-item',{id:'clone'},null);
 assert.equal(editors,0);assert.equal(rendered.at(-1).kind,'aptitude-use');assert.equal(rendered.at(-1).panelConfig.itemId,'clone');
});
