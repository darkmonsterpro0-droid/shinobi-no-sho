import test from 'node:test';import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {actorView,itemView,panelView,esc,set,safeImage} from '../src/ui.mjs';
import {VERSION,ATTRIBUTES,COMBAT,SKILLS,ITEM_TYPES,TABS,defaultProfile} from '../src/config.mjs';
import {releaseMetadata,zipBuffer,crc32} from '../scripts/release.mjs';
import {createModels} from '../src/models.mjs';
import {createApplications} from '../src/apps.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const actor={id:'example',name:'<img src=x onerror=alert(1)>',type:'character',img:'javascript:alert(1)',system:{attributes:{},combat:{},resources:{},skills:{},campaign:{},identity:{},conditions:[],special:[],bonds:[]},items:[]};
test('manifest, package and code share version and immutable download URL',async()=>{
  const f=JSON.parse(await readFile(path.join(root,'system.json'),'utf8')),p=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  assert.equal(f.version,VERSION);assert.equal(p.version,VERSION);assert.equal(f.id,'shinobi-no-sho');assert.equal(f.compatibility.minimum,'14');assert.equal(f.compatibility.maximum,'14');assert.equal(f.compatibility.verified,'14.367');
  assert.deepEqual(f.documentTypes.Actor,{character:{},creature:{},puppet:{}});assert.deepEqual(Object.keys(f.documentTypes.Item).sort(),Object.keys(ITEM_TYPES).sort());
  assert.equal(f.download,releaseMetadata(VERSION,'darkmonsterpro0-droid/shinobi-no-sho').download);assert.equal(f.manifest,releaseMetadata(VERSION,'darkmonsterpro0-droid/shinobi-no-sho').manifest);
  for(const file of [...f.esmodules,...f.styles,...f.languages.map(l=>l.path)])assert.ok((await readFile(path.join(root,file))).length);
});
test('all sheet areas render and escape stored content',()=>{
  for(const tab of Object.keys(TABS)){const html=actorView(actor,tab);assert.ok(html.includes('role="tabpanel"'));assert.ok(!html.includes('<img src=x onerror=alert(1)>'));assert.ok(!html.includes('src="javascript:'));}
  for(const type of Object.keys(ITEM_TYPES)){const html=itemView({name:actor.name,type,img:actor.img,system:{description:'<script>alert(1)</script>',source:{book:'mesa'},properties:'<img onerror=1>'}});assert.ok(!html.includes('<script>'));assert.ok(!html.includes('src="javascript:'));assert.ok(html.includes('&lt;'))}
});
test('all panel workflows render without requiring rule calculations',()=>{
  for(const kind of ['library','settings','sources','resources','conditions','condition','special','bond','test','declare','defense','result','create','impact','appearance','decision']){
    const html=panelView(kind,{actor,profile:defaultProfile(),isGM:true,values:{},proposed:defaultProfile()});assert.ok(html.length>100,kind);assert.ok(!html.includes('undefined'),kind);
  }
  const result=panelView('result',{actor});assert.ok(result.includes('Não aplica dano'));assert.ok(!result.includes('data-sns="apply-damage"'));
});
test('only declared game attributes and combat values are present; concentration uses Intelligence',()=>{
  assert.equal(Object.keys(ATTRIBUTES).length,7);assert.deepEqual(Object.keys(COMBAT),['cc','cd','esq','lm']);assert.equal(SKILLS.concentracao[1],'int');
  const s=defaultProfile();assert.ok(s.decisions.find(d=>d.id==='amaterasu').description.includes('9 m'));assert.ok(s.decisions.find(d=>d.id==='rede').description.includes('16'));assert.equal(s.decisions.find(d=>d.id==='fracassos').status,'Pendente');
});
test('unsafe images and object mutation paths are rejected',()=>{
  assert.equal(safeImage('javascript:alert(1)','fallback'),'fallback');assert.equal(safeImage('data:image/svg+xml,<svg onload=alert(1)>','fallback'),'fallback');assert.equal(safeImage('https://example.com/a.png'),'https://example.com/a.png');
  assert.throws(()=>set({},'__proto__.polluted',true));assert.throws(()=>set({},'system.constructor.value',true));assert.equal({}.polluted,undefined);assert.equal(esc('"<&'), '&quot;&lt;&amp;');
});
test('release metadata preserves stable manifest and pins each version download',()=>{
  const a=releaseMetadata('0.1.0','user/repo'),b=releaseMetadata('0.1.1','user/repo');assert.equal(a.manifest,b.manifest);assert.notEqual(a.download,b.download);assert.ok(b.download.includes('/v0.1.1/'));assert.throws(()=>releaseMetadata('latest','user/repo'));assert.throws(()=>releaseMetadata('0.1.1','../repo/unsafe'));
});
test('ZIP has a root manifest and standard CRC32',()=>{
  assert.equal(crc32(Buffer.from('123456789')),0xcbf43926);const b=zipBuffer([{name:'system.json',data:Buffer.from('{"id":"shinobi-no-sho"}')}]);assert.equal(b.readUInt32LE(0),0x04034b50);assert.equal(b.readUInt32LE(b.length-22),0x06054b50);assert.ok(b.includes(Buffer.from('system.json')));
});

function runtime(){
  class Field {constructor(options={}){this.options=options;}}
  class SchemaField {constructor(fields={},options={}){this.fields=fields;this.options=options;}}
  class ArrayField {constructor(element,options={}){this.element=element;this.options=options;}}
  class Base {constructor(options={}){this.options=options;this.document=options.document;this.element=null;}async _prepareContext(){return {};}render(){return this;}async close(){this.closed=true;}async _preClose(){}async _onRender(){}}
  globalThis.foundry={data:{fields:{NumberField:Field,StringField:Field,BooleanField:Field,SchemaField,ArrayField}},abstract:{TypeDataModel:class{}},utils:{deepClone:structuredClone,randomID:()=>Math.random().toString(36).slice(2)},applications:{api:{ApplicationV2:Base,HandlebarsApplicationMixin:b=>b,DialogV2:{confirm:async()=>true}},sheets:{ActorSheetV2:Base,ItemSheetV2:Base}}};
  let p=defaultProfile();const messages=[],writes=[];const worldItems=[];
  globalThis.game={user:{id:'player1',isGM:false},settings:{get:(id,key)=>key==='profile'?p:key==='theme'?'light':false,set:async(id,key,value)=>{writes.push({key,value});if(key==='profile')p=value;}},items:{filter:()=>worldItems,contents:worldItems,get:()=>null},actors:{filter:()=>[],contents:[],size:0}};
  globalThis.ui={notifications:{info:()=>{},error:()=>{}}};
  globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor?.id}),getWhisperRecipients:()=>[{id:'gm1'}],create:async m=>{messages.push(m);}};
  return {messages,writes,apps:createApplications()};
}
const fields=obj=>({querySelectorAll:()=>Object.entries(obj).map(([name,value])=>({name,value,type:typeof value==='number'?'number':'text',disabled:false})),querySelector:()=>null});
test('models hold manual resources and use no derived data preparation',()=>{
  runtime();const {ShinobiActorModel,ShinobiItemModel}=createModels();const a=ShinobiActorModel.defineSchema(),i=ShinobiItemModel.defineSchema();assert.equal(a.attributes.fields.for.options.initial,null);assert.equal(a.resources.fields.vitality.fields.value.options.initial,null);assert.equal(ShinobiActorModel.prototype.prepareDerivedData,undefined);assert.ok(a.bonds&&a.special&&a.conditions);assert.ok(i.source&&i.effects&&i.slot);
});
test('document editing refuses non-owners and preserves manual negative values',async()=>{
  const {apps}=runtime();const updates=[];const doc={isOwner:false,update:async p=>updates.push(p)};const sheet=new apps.ShinobiActorSheet({document:doc});sheet.element={querySelector:()=>null};
  await assert.rejects(()=>sheet._snsChange('system.resources.chakra.value',-5),/permissão/);assert.equal(updates.length,0);doc.isOwner=true;await sheet._snsChange('system.resources.chakra.value',-5);assert.deepEqual(updates,[{'system.resources.chakra.value':-5}]);
});
test('players cannot save world profiles, including bypassing the visible button',async()=>{
  const {apps,writes}=runtime();const panel=new apps.ShinobiPanel('impact',{proposed:defaultProfile()});await assert.rejects(()=>panel._snsAction('apply-profile',{},fields({})),/Somente o mestre/);assert.equal(writes.length,0);
});
test('manual chat records escape text, respect whisper and do not mutate actor resources',async()=>{
  const {apps,messages}=runtime();const doc={id:'a',name:'Ninja',documentName:'Actor',system:{resources:{vitality:{value:10}}},update:()=>{throw Error('Must not mutate actor');}};
  const panel=new apps.ShinobiPanel('result',{actor:doc});await panel._snsAction('post-record',{},fields({'record.title':'<script>evil()</script>','record.notes':'<img src=x onerror=1>','record.visibility':'gm','record.vitality':'-10'}));
  assert.equal(messages.length,1);assert.deepEqual(messages[0].whisper,['gm1']);assert.ok(!messages[0].content.includes('<script>'));assert.ok(messages[0].content.includes('&lt;script&gt;'));assert.equal(doc.system.resources.vitality.value,10);assert.equal(messages[0].flags['shinobi-no-sho'].manual,true);
});
test('release source contains no automatic dice execution or target damage application',async()=>{
  const files=await readdir(path.join(root,'src'));const source=(await Promise.all(files.filter(f=>f.endsWith('.mjs')).map(f=>readFile(path.join(root,'src',f),'utf8')))).join('\n');assert.ok(!/new\s+Roll\s*\(/.test(source));assert.ok(!/\.applyDamage\s*\(/.test(source));assert.ok(!/\b(eval|Function)\s*\(/.test(source));
});

test('sheet creations are embedded in the actor using the v14 static documentName',async()=>{
  const {apps}=runtime();const embedded=[],world=[];
  globalThis.Item={create:async data=>{world.push(data);return {sheet:{render(){}}};}};
  class ActorDocument {static documentName='Actor';isOwner=true;async createEmbeddedDocuments(type,entries){embedded.push(...entries);return entries.map(()=>({sheet:{render(){}}}));}}
  const doc=new ActorDocument(),sheet=new apps.ShinobiActorSheet({document:doc});
  for(const kind of Object.keys(ITEM_TYPES))await sheet._snsAction('new-item',{kind},fields({}));
  assert.equal(embedded.length,5);assert.equal(world.length,0);
  const embeddedItem=new apps.ShinobiItemSheet({document:{isOwner:true,parent:doc}});await embeddedItem._snsAction('new-item',{kind:'technique'},fields({}));assert.equal(embedded.length,6);assert.equal(world.length,0);
  const globalPanel=new apps.ShinobiPanel('library');await assert.rejects(()=>globalPanel._snsAction('new-item',{kind:'power'},fields({})),/partir de uma ficha/);assert.equal(world.length,0);
  await globalPanel._snsAction('new-world-item',{kind:'power'},fields({}));assert.equal(world.length,1);
  const personalPanel=new apps.ShinobiPanel('library',{actor:doc});await assert.rejects(()=>personalPanel._snsAction('new-world-item',{kind:'power'},fields({})),/modelos compartilhados/);
});

test('personal libraries create actor entries; shared libraries explicitly create world templates',()=>{
  const personal=panelView('library',{actor,items:[]}),shared=panelView('library',{items:[]});
  assert.ok(!personal.includes('data-sns="new-world-item"'));assert.ok(personal.includes('Acervo pessoal'));
  assert.ok(shared.includes('data-sns="new-world-item"'));assert.ok(!shared.includes('data-sns="new-item"'));
  const skills=actorView(actor,'skills');assert.ok(!skills.includes('.trained'));assert.ok(skills.includes('system.skills.mecanismos.points'));
});
