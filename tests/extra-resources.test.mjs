import test from 'node:test';
import assert from 'node:assert/strict';
import {createExtraResources} from '../src/core/extra-resources.mjs';
import {extraResources,resourceEditorData,changeExtraResource} from '../src/extra-resources.mjs';
import {extraResourceCards} from '../src/extra-resource-ui.mjs';
import {actorView,panelView} from '../src/ui.mjs';
import {createApplications} from '../src/apps.mjs';
import {createModels} from '../src/models.mjs';
import {TABS} from '../src/config.mjs';

function actor(rows=[]){return {documentName:'Actor',id:'a',name:'Exemplo',type:'character',isOwner:true,items:[],effects:[],flags:{preserve:{x:1}},system:{special:structuredClone(rows),resources:{vitality:{value:20,max:30},chakra:{value:8,max:10}},actions:{standard:true},campaign:{level:4},attributes:{},combat:{},skills:{},advancement:{},identity:{},conditions:[],bonds:[]},writes:[],async update(p){this.writes.push(structuredClone(p));for(const [key,value]of Object.entries(p)){assert.equal(key,'system.special');this.system.special=structuredClone(value);}}};}
const legacy={id:'old',name:'Reserva antiga',value:2,max:6,source:'Fonte anterior',notes:'Não apagar'};
function service(options={}){let id=0;return createExtraResources({read:a=>a.system.special,write:(a,rows)=>a.update({'system.special':rows}),canEdit:a=>!!a?.isOwner,randomId:()=>`r${++id}`,...options});}
function runtime(){
 let serial=0;class Base{constructor(options={}){this.document=options.document;}static instances(){return [];}async close(){this.closed=true;}async render(){return this;}}
 globalThis.game={user:{isGM:true},settings:{get:()=>false}};
 globalThis.foundry={utils:{randomID:()=>`native${++serial}`},applications:{api:{ApplicationV2:Base,HandlebarsApplicationMixin:B=>B,DialogV2:{confirm:async()=>true}},sheets:{ActorSheetV2:Base,ItemSheetV2:Base}}};
 return createApplications();
}
function fields(values){return {querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name:'entry.'+name,type:typeof value==='boolean'?'checkbox':typeof value==='number'?'number':'text',value:String(value??''),checked:value===true}))};}

test('legacy resources are readable without migration or mutation and keep original identifiers',async()=>{
 const a=actor([legacy]),s=service(),before=structuredClone(a.system.special);const view=s.list(a);assert.equal(view[0].resourceData.schemaVersion,1);assert.equal(view[0].resourceData.showOnSheet,true);assert.deepEqual(a.system.special,before);assert.equal(a.writes.length,0);
 view[0].name='local';assert.equal(s.get(a,'old').name,legacy.name);await s.setValue(a,'old',3);assert.equal(a.system.special[0].id,'old');assert.equal(a.system.special[0].source,legacy.source);assert.equal(a.system.special[0].notes,legacy.notes);
});
test('manual reserve, origin and benefit notes do not change vitality, chakra, items or effects',async()=>{
 const a=actor(),s=service(),before=structuredClone({resources:a.system.resources,items:a.items,effects:a.effects,flags:a.flags,actions:a.system.actions});
 const r=await s.save(a,{name:'Reserva independente',value:4,max:8,source:'Anotação manual',resourceData:{unit:'pontos',uses:'Uso indicado pela mesa',benefits:'Aumenta vida segundo uma regra futura',definitionKey:'future.reserve',originUuid:'Actor.a.Item.origin'},notes:'Sem efeito executado'});
 await s.setValue(a,r.id,1);assert.deepEqual({resources:a.system.resources,items:a.items,effects:a.effects,flags:a.flags,actions:a.system.actions},before);assert.equal(s.get(a,r.id).resourceData.benefits,'Aumenta vida segundo uma regra futura');assert.ok(a.writes.every(p=>Object.keys(p).join()==='system.special'));
});
test('same-name reserves stay independent and explicit removal preserves other records and metadata',async()=>{
 const a=actor(),s=service(),one=await s.save(a,{name:'Reserva',value:2,max:4,resourceData:{originUuid:'Item.one'}}),two=await s.save(a,{name:'Reserva',value:3,max:5,resourceData:{originUuid:'Item.two'}});
 assert.notEqual(one.id,two.id);await s.setValue(a,one.id,0);assert.equal(s.get(a,two.id).value,3);assert.equal(s.get(a,one.id).resourceData.originUuid,'Item.one');await s.remove(a,one.id);assert.equal(s.get(a,two.id).resourceData.originUuid,'Item.two');assert.equal(s.list(a).length,1);
});
test('invalid numbers, excessive current values and identity collisions fail without changing data',async()=>{
 const a=actor([legacy]),s=service(),before=structuredClone(a.system.special);
 for(const input of [{id:'old',value:Infinity},{id:'old',value:true},{id:'old',max:-1},{id:'old',value:7},{id:'old',max:1},{id:'old',name:''},{id:'missing',value:1},{id:'__proto__',value:1},{id:'old',resourceData:'invalid'}])await assert.rejects(s.save(a,input));
 const collision=service({randomId:()=>legacy.id});await assert.rejects(collision.save(a,{name:'New'}),/identificador novo/);assert.deepEqual(a.system.special,before);assert.equal(a.writes.length,0);
});
test('optional maxima and fractional values are manual data and visibility never deletes a reserve',async()=>{
 const a=actor(),s=service(),r=await s.save(a,{name:'Reserva',value:2.5,max:null});assert.equal(r.max,null);await s.save(a,{id:r.id,resourceData:{showOnSheet:false}});assert.equal(s.get(a,r.id).value,2.5);assert.equal(s.get(a,r.id).resourceData.showOnSheet,false);assert.equal(s.list(a).length,1);
});
test('permission revocation and unsupported versions preserve records rather than upgrading silently',async()=>{
 const future={...legacy,id:'future',resourceData:{schemaVersion:99,custom:{x:1}}},a=actor([legacy,future]),s=service();a.isOwner=false;
 for(const operation of [()=>s.save(a,{name:'x'}),()=>s.setValue(a,'old',0),()=>s.remove(a,'old')])await assert.rejects(operation,/não pode/);
 a.isOwner=true;await assert.rejects(s.setValue(a,'future',0),/versão/);await assert.rejects(s.remove(a,'future'),/versão/);await s.setValue(a,'old',1);assert.deepEqual(a.system.special[1],future);
});
test('concurrent writes in one client preserve both new reserves and the queue recovers after error',async()=>{
 const a=actor(),s=service();await Promise.all([s.save(a,{name:'One'}),s.save(a,{name:'Two'})]);assert.equal(s.list(a).length,2);
 await Promise.all([assert.rejects(s.save(a,{name:'Invalid',max:-1})),s.save(a,{name:'Three'})]);assert.deepEqual(s.list(a).map(r=>r.name),['One','Two','Three']);
});
test('future storage fields survive edits while executable-looking input is never installed',async()=>{
 const previous={...legacy,resourceData:{schemaVersion:1,future:{x:1},originUuid:'Item.original'}},a=actor([previous]),s=service();
 await s.save(a,{id:'old',resourceData:{unit:'cargas',script:'damage()',effects:[{changes:[]}],schemaVersion:99}});const r=s.get(a,'old');assert.deepEqual(r.resourceData.future,{x:1});assert.equal(r.resourceData.originUuid,'Item.original');assert.equal(r.resourceData.schemaVersion,1);assert.equal(r.resourceData.script,undefined);assert.equal(r.resourceData.effects,undefined);
 const input=resourceEditorData({'resourceData.unit':'pontos','resourceData.__proto__':'bad'});assert.equal(input.resourceData.unit,'pontos');assert.equal(Object.getPrototypeOf(input.resourceData),Object.prototype);
});
test('visible cards appear below primary resources once per tab and hidden reserves remain manageable',()=>{
 const a=actor([legacy,{...legacy,id:'hidden',name:'Hidden reserve',resourceData:{showOnSheet:false}}]);
 for(const tab of Object.keys(TABS)){const html=actorView(a,tab,{isGM:true});assert.ok(html.indexOf('aria-label="Recursos do personagem"')<html.indexOf('aria-label="Recursos específicos"'));assert.equal((html.match(/name="extraResource.old.value"/g)??[]).length,1);assert.ok(!html.includes('Hidden reserve'));}
 const management=panelView('resources',{actor:a});assert.ok(management.includes('Hidden reserve'));assert.equal(extraResourceCards(actor()),'');
 a.system.special[0].name='<img onerror=x>';a.system.special[0].resourceData={uses:'<script>use()</script>',benefits:'<script>benefit()</script>'};const html=extraResourceCards(a,{editable:true});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));
});
test('native editor and inline manual value updates use the same service and require ownership',async()=>{
 const apps=runtime(),a=actor([legacy]),panel=new apps.ShinobiPanel('special',{actor:a,values:{...legacy}});
 await panel._snsAction('save-entry',{},fields({name:'Updated',value:4,max:6,'resourceData.unit':'pontos','resourceData.uses':'Manual','resourceData.benefits':'Somente nota','resourceData.showOnSheet':true}));assert.equal(extraResources.get(a,'old').value,4);assert.equal(extraResources.get(a,'old').resourceData.uses,'Manual');
 const sheet=new apps.ShinobiActorSheet({document:a});await sheet._snsChange('extraResource.old.value',2);assert.equal(extraResources.get(a,'old').value,2);
 a.isOwner=false;await assert.rejects(sheet._snsChange('extraResource.old.value',1),/não pode/);assert.equal(extraResources.get(a,'old').value,2);await assert.rejects(changeExtraResource(a,'extraResource.old.max',1),/inválido/);
});
test('native deletion can be cancelled and never removes source items',async()=>{
 const apps=runtime(),a=actor([legacy]);a.items=[{id:'origin'}];const panel=new apps.ShinobiPanel('special',{actor:a,values:legacy});foundry.applications.api.DialogV2.confirm=async()=>false;
 await panel._snsAction('delete-entry',{},fields({}));assert.equal(a.system.special.length,1);foundry.applications.api.DialogV2.confirm=async()=>true;await panel._snsAction('delete-entry',{},fields({}));assert.equal(a.system.special.length,0);assert.deepEqual(a.items,[{id:'origin'}]);
});
test('Foundry schema is additive and keeps resource metadata extensible without aptitude defaults',()=>{
 class Field{constructor(options){this.options=options;}}class Schema{constructor(fields){this.fields=fields;}}class ArrayField{constructor(element,options){this.element=element;this.options=options;}}
 globalThis.foundry={data:{fields:{NumberField:Field,StringField:Field,BooleanField:Field,ObjectField:Field,SchemaField:Schema,ArrayField}},abstract:{TypeDataModel:class{}}};
 const schema=createModels().ShinobiActorModel.defineSchema();assert.deepEqual(schema.special.options.initial,[]);assert.deepEqual(schema.special.element.fields.resourceData.options.initial,{});for(const key of ['id','name','value','max','source','notes'])assert.ok(schema.special.element.fields[key]);
});
