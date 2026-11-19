import {powerAction} from '../src/power-actions.mjs';
import {validatePowerPurchase} from '../src/power-rules.mjs';
import {panelView} from '../src/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {RESTRICTED_APTITUDES as entries} from '../src/restricted-aptitude-data.mjs';
import {restrictedDefinition,restrictedEligibility,characterOrigins,originCompatibility,restrictedFacts} from '../src/restricted-aptitudes.mjs';
import {evaluateRequirement,createCapabilityLedger} from '../src/core/capabilities.mjs';
import {processCapabilityCommand,capabilityStatus,capabilityRecords} from '../src/capability-actions.mjs';
import {validatePurchase,createItemClass,validateAutomatedAptitudeEdit} from '../src/item-validation.mjs';
import {pointBudgets} from '../src/build-rules.mjs';
import {aptitudeEntry,prerequisiteStatus,evolutionStatus} from '../src/aptitudes.mjs';
import {restrictedCatalogView,restrictedUseView} from '../src/restricted-ui.mjs';
import {actorView} from '../src/ui.mjs';
import {enqueueActionRequest} from '../src/action-executions.mjs';
import {ID,defaultProfile} from '../src/config.mjs';
const definition=(suffix,book)=>entries.find(e=>e.key.endsWith('-'+suffix)&&(!book||e.book===book));
const clone=structuredClone;
function set(object,path,value){const keys=path.split('.');let current=object;for(const k of keys.slice(0,-1))current=current[k]??={};current[keys.at(-1)]=clone(value);}
function expand(patch){const result={};for(const[k,v]of Object.entries(patch))set(result,k,v);return result;}
function merge(base,patch){const next=clone(base);for(const[k,v]of Object.entries(patch))next[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(next[k]??{},v):v;return next;}
function system(origin='Hyuuga') {return {identity:{clan:origin},campaign:{level:20,draft:true},automation:{bases:{cc:3,cd:3,esq:3,lm:3}},attributes:{for:16,des:16,agi:16,per:16,int:16,vig:16,esp:16},skills:{lidar:{points:8},ocultismo:{points:8},mecanismos:{points:8},medicina:{points:8},prestidigitacao:{points:8},rastrear:{points:8},procurar:{points:8},prontidao:{points:8}},resources:{vitality:{value:20,max:90},chakra:{value:17,max:80}},special:[{id:'reserveA',name:'Mesmo nome',value:4,max:8,resourceData:{schemaVersion:1}},{id:'reserveB',name:'Mesmo nome',value:5,max:9,resourceData:{schemaVersion:99,custom:true}}],actions:{standard:true,movement:false,partial:true},conditions:[],bonds:[],combat:{},advancement:{},social:{}};}
function itemData(entry,options={}){return {name:entry.name,type:'aptitude',system:{level:1,catalogKey:entry.key,catalogBook:entry.book,acquisition:'Comprada',selection:'',capabilityData:{schemaVersion:1,definitionId:entry.id,accessOrigin:entry.accessOrigins[0],reviewReason:'Fonte conferida pelo mestre',resourceLinks:[]},...options}};}
function world(origin='Hyuuga') {
 let serial=0;
 const gm={id:'gm',isGM:true,active:true,name:'Mestre'},player={id:'player',isGM:false,active:true,name:'Jogador'},stranger={id:'stranger',isGM:false};
 const books=defaultProfile(),rules={};const actors=[];
 class BaseItem {
  constructor(data,parent){Object.assign(this,clone(data));this.id??=`i${++serial}`;this.parent=parent;this.isOwner=true;this.flags??={};}
  toObject(){return clone({id:this.id,_id:this.id,name:this.name,type:this.type,system:this.system,flags:this.flags});}
  getFlag(ns,key){return this.flags?.[ns]?.[key];}
  async _preCreate(){}async _preUpdate(){}
  async update(patch){await this._preUpdate(patch,{},gm.id);for(const[k,v]of Object.entries(patch))set(this,k,v);return this;}
 }
 const Item=createItemClass(BaseItem);
 class Actor {
  static documentName='Actor';
  constructor(){this.id='a';this.uuid='Actor.a';this.name='Exemplo';this.type='character';this.isOwner=true;this.system=system(origin);this.flags={other:{keep:true}};this.items=[];this.items.get=id=>this.items.find(i=>i.id===id);Object.defineProperty(this.items,'contents',{get:()=>this.items});this.effects=[];this.writes=[];}
  getFlag(ns,key){return this.flags?.[ns]?.[key];}
  testUserPermission(u){return !!u&&(u.isGM||u.id==='player');}
  toObject(){return {system:clone(this.system),flags:clone(this.flags)};}
  async update(patch){this.writes.push(clone(patch));for(const[k,v]of Object.entries(patch))set(this,k,v);return this;}
  async createEmbeddedDocuments(type,data){assert.equal(type,'Item');const created=[];for(const row of data){const item=new Item(row,this);await item._preCreate(row,{},gm.id);this.items.push(item);created.push(item);}return created;}
 }
 const actor=new Actor();actors.push(actor);
 globalThis.game={user:gm,users:{contents:[gm,player],get:id=>[gm,player,stranger].find(u=>u.id===id)},settings:{get:(_ns,key)=>key==='profile'?books:key==='houseRules'?rules:0},messages:{contents:[],get(id){return this.contents.find(m=>m.id===id);}},actors:{contents:actors}};
 globalThis.foundry={utils:{randomID:()=>`r${++serial}`,expandObject:expand,mergeObject:merge,deepClone:clone}};
 globalThis.fromUuid=async uuid=>actors.find(a=>a.uuid===uuid);
 return {actor,gm,player,stranger,books,rules,Item};
}
const acquire=(w,key,extra={},id='request-1')=>processCapabilityCommand(w.actor,{operation:'acquire',key:definition(key).key,book:definition(key).book,...extra},{user:w.player,requestId:id});

test('RES catalogue has unique source-scoped definitions from all four books, with manual benefits and sources',()=>{
 assert.equal(entries.length,139);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
 assert.deepEqual([...new Set(entries.map(e=>e.book))].sort(),['avancado','basico','hijutsus1','hijutsus2']);
 for(const e of entries){assert.ok(e.page>0&&e.pdfPage>=e.page);assert.ok(e.benefits&&e.requirements);assert.equal(e.automation,e.key==='res-basico-estilo-da-lotus'?'contextual':'manual');assert.equal(e.costSource.page,56);assert.equal(e.levels.length,e.maxLevel);for(const s of e.levels){assert.equal(s.cost,2);assert.ok(s.checks||s.review);}}
 assert.equal(definition('hitokugutsu').maxLevel,1,'free Complete stage must not become a paid second level');
 assert.equal(definition('senjutsu').book,'avancado');
});
test('Lotus acquisition uses the shared coordinator, costs two points per pair and preserves chosen provenance on retries',async()=>{
 const w=world('Hachimon Tonkou');
 w.actor.items.push({id:'gates',name:'Hachimon',type:'power',system:{level:8,powerData:{family:'hachimon'}}});
 w.actor.items.push({id:'fighter',type:'aptitude',system:{catalogKey:'lutador',catalogBook:'basico',acquisition:'Comprada'}});
 const before=pointBudgets(w.actor.system,w.actor.items,w.rules).powers.spent;
 const selection='ataque-multiplo|ataque-poderoso';
 const source=await acquire(w,'estilo-da-lotus',{selection},'lotus-1');
 assert.equal(source.system.selection,selection);assert.equal(source.parent,w.actor);
 assert.equal(pointBudgets(w.actor.system,w.actor.items,w.rules).powers.spent,before+2);
 assert.equal(await acquire(w,'estilo-da-lotus',{selection},'lotus-1'),source);
 await assert.rejects(acquire(w,'estilo-da-lotus',{selection:'ataque-multiplo|soco-agarrado'},'lotus-2'),/outra compra/);
 await acquire(w,'estilo-da-lotus',{selection:'ataque-giratorio|derrubar-agressivo'},'lotus-2');
 await acquire(w,'estilo-da-lotus',{selection:'soco-em-gancho|ataque-atordoante'},'lotus-3');
 await assert.rejects(acquire(w,'estilo-da-lotus',{selection:'desarme-agressivo|soco-agarrado'},'lotus-4'),/três compras/);
});

test('existing aptitudeEntry and prerequisiteStatus support the catalogue while common validation remains intact',()=>{
 const common=aptitudeEntry('acuidade','basico');assert.equal(prerequisiteStatus(common,{attributes:{des:2}}).allowed,false);assert.equal(prerequisiteStatus(common,{attributes:{des:3}}).allowed,true);
 assert.equal(aptitudeEntry(definition('byakugan').key,'basico').id,definition('byakugan').id);
});
test('legacy origin reads never migrate identity or create items, resources, states or grants',()=>{
 const w=world(),before=clone(w.actor.toObject());assert.deepEqual(characterOrigins(w.actor.system).keys,['hyuuga']);
 assert.equal(restrictedEligibility(definition('byakugan'),w.actor.system,[]).allowed,true);assert.deepEqual(w.actor.toObject(),before);assert.equal(w.actor.items.length,0);assert.equal(w.actor.writes.length,0);
});
test('eligibility explains wrong origin, disabled books and purchased thresholds without accepting precision bonuses',()=>{
 const s=system('Uchiha');s.attributes.per=2;s.combat.cc=999;
 let r=restrictedEligibility(definition('byakugan'),s,[],{books:[]});assert.equal(r.allowed,false);assert.match(r.missing.join(' '),/Origem|Livro/);
 r=restrictedEligibility(definition('sharingan'),s,[]);assert.equal(r.allowed,false);assert.match(r.missing.join(' '),/exige 3/);
});
test('trained prerequisites require invested points for restricted skill uses',()=>{
 const s=system('Aburame');s.skills.lidar.points=0;const r=restrictedEligibility(definition('kikaichuu'),s,[]);assert.equal(r.allowed,false);assert.match(r.missing.join(' '),/Ponto investido/);
});
test('OR requirements preserve valid alternatives and unknown clauses remain review, never code execution',()=>{
 assert.equal(evaluateRequirement({any:[{fact:'x',min:4},{fact:'y',min:4}]},{x:1,y:4}).allowed,true);
 assert.equal(evaluateRequirement({review:'Conferir evento narrativo'},{x:99}).allowed,null);
 assert.equal(evaluateRequirement({script:'throw Error()'},{}).allowed,null);
});
test('multiple origins respect the optional rule and the explicitly printed Tensai clan routes',()=>{
 assert.equal(originCompatibility(['hyuuga','uchiha']).allowed,null);assert.equal(originCompatibility(['hyuuga','uchiha'],{twoHijutsus:true}).allowed,true);
 assert.equal(originCompatibility(['hatake','tensai']).allowed,true);assert.equal(originCompatibility(['aburame','senjutsu']).allowed,null);
});
test('mutually exclusive Aburame insects block acquisition in either direction',()=>{
 const s=system('Aburame'),kika=itemData(definition('kikaichuu')),rinka=itemData(definition('rinkaichuu'));
 assert.equal(restrictedEligibility(definition('kidaichuu'),s,[kika,rinka]).allowed,false);
 assert.match(restrictedEligibility(definition('rinkaichuu'),s,[kika,itemData(definition('kidaichuu'))]).missing.join(' '),/Incompatível/);
});
test('Tensai special limit counts distinct choices, not acquired levels, and Buki access is separate',()=>{
 const s=system('Tensai'),one=itemData(definition('capacidade'),{level:2}),two=itemData(definition('controle-perfeito'),{level:2});
 assert.match(restrictedEligibility(definition('deus-do-trovao'),s,[one,two]).missing.join(' '),/Limite de 2/);
 const buki=itemData(definition('instinto-de-batalha'));buki.system.capabilityData.accessOrigin='buki-senmon';
 assert.ok(!restrictedEligibility(definition('capacidade'),s,[buki,two]).missing.some(s=>/Limite/.test(s)));
});
test('Nan no Kaizou requires Tensai without clan and keeps the two alternatives incompatible',()=>{
 const s=system();s.capabilityData={schemaVersion:1,origins:['tensai','hyuuga']};
 assert.match(restrictedEligibility(definition('extracao-energetica'),s,[],{rules:{twoHijutsus:true}}).missing.join(' '),/sem clã/);
});
test('acquisition uses existing budget and Item validators without applying an individual benefit',async()=>{
 const w=world(),before=clone(w.actor.system),budget=pointBudgets(w.actor.system,[]).powers.remaining;
 const item=await acquire(w,'byakugan');assert.equal(item.system.level,1);assert.equal(pointBudgets(w.actor.system,w.actor.items).powers.remaining,budget-2);
 assert.deepEqual(w.actor.system,before);assert.equal(w.actor.effects.length,0);assert.equal(capabilityStatus(w.actor,item).activation.available,true);assert.equal(capabilityStatus(w.actor,item).activation.active,false);
});
test('replayed purchase requests return the same Item; a fresh request cannot duplicate a non-repeatable purchase',async()=>{
 const w=world();const first=await acquire(w,'byakugan');assert.equal((await acquire(w,'byakugan')).id,first.id);assert.equal(w.actor.items.length,1);
 await assert.rejects(acquire(w,'byakugan',{},'request-2'),/já adquirida/);
});
test('native validation refuses wrong origin, forged definition, future metadata and skipped levels',()=>{
 const w=world(),entry=definition('byakugan'),item=itemData(entry);assert.deepEqual(validatePurchase(w.actor,item,{books:['basico']}),[]);
 for(const patch of [{level:2},{capabilityData:{...item.system.capabilityData,schemaVersion:99}},{capabilityData:{...item.system.capabilityData,definitionId:'wrong'}}])assert.ok(validatePurchase(w.actor,{...item,system:{...item.system,...patch}},{books:['basico']}).length);
 w.actor.system.identity.clan='Uchiha';assert.match(validatePurchase(w.actor,item,{books:['basico'],isGM:true}).join(' '),/Origem/);
});
test('GM review cannot be forged by a player and granted acquisitions still require explicit permission',async()=>{
 const w=world('Uchiha');await assert.rejects(acquire(w,'byakugan',{acquisition:'Concedida',reviewReason:'sou GM'}),/Origem|mestre/);
 const entry=definition('mangekyou-sharingan'),s=system('Uchiha');const candidate=itemData(entry);const errors=validatePurchase({system:s,items:[]},candidate,{books:['basico'],isGM:false});assert.match(errors.join(' '),/Conferência|exige/);
});
test('three initial free choices remain a shared limit across common and restricted aptitudes',async()=>{
 const w=world();w.actor.items.push(...['a','b','c'].map(id=>({id,type:'aptitude',system:{acquisition:'Gratuita'}})));
 await assert.rejects(acquire(w,'byakugan',{acquisition:'Gratuita'}),/três/);
});
test('progression requires each level and reevaluates thresholds using existing evolution and purchase services',async()=>{
 const w=world('Aburame');const item=await acquire(w,'kikaichuu');assert.equal(evolutionStatus(item,w.actor.system,w.actor.items,{}).max,2);
 w.actor.system.skills.lidar.points=0;await assert.rejects(processCapabilityCommand(w.actor,{operation:'evolve',itemId:item.id},{user:w.player,requestId:'evolve-1'}),/exige|investido/);
 w.actor.system.skills.lidar.points=8;await processCapabilityCommand(w.actor,{operation:'evolve',itemId:item.id},{user:w.player,requestId:'evolve-2'});assert.equal(item.system.level,2);
 await processCapabilityCommand(w.actor,{operation:'evolve',itemId:item.id},{user:w.player,requestId:'evolve-2'});assert.equal(item.system.level,2);
 await assert.rejects(processCapabilityCommand(w.actor,{operation:'evolve',itemId:item.id},{user:w.player,requestId:'evolve-3'}),/Nível/);
});
test('unknown origin schema is preserved and manual Senjutsu is not silently converted from Power to Aptitude',async()=>{
 const w=world('Senjutsu');w.actor.system.capabilityData={schemaVersion:99,custom:{keep:true}};const before=clone(w.actor.system);
 await assert.rejects(processCapabilityCommand(w.actor,{operation:'origins',origins:['hyuuga']},{user:w.gm,requestId:'o1'}),/Versão/);assert.deepEqual(w.actor.system,before);
 assert.equal(restrictedEligibility(definition('senjutsu'),system('Senjutsu'),[],{rules:{}}).allowed,false);
});
test('Souma initial purchase is creation-only while an acquired aptitude may evolve after creation',()=>{
 const w=world('Souma no Jutsu'),entry=definition('souma-no-kou'),item=itemData(entry);item.id='souma';
 w.actor.system.campaign.draft=false;assert.match(validatePurchase(w.actor,item,{books:['hijutsus2']}).join(' '),/criação/);
 assert.ok(!validatePurchase(w.actor,{...item,system:{...item.system,level:2}},{previous:item,books:['hijutsus2']}).some(e=>e.includes('criação')));
});
test('grant ledger is idempotent, preserves independent purchases and isolates two sources of the same benefit',async()=>{
 const w=world('Uchiha');const source={id:'source',type:'aptitude',system:{catalogKey:definition('nidan-sharingan').key}},other={id:'other',type:'aptitude',system:{catalogKey:definition('nidan-sharingan').key}},purchased={id:'paid',type:'aptitude',system:{catalogKey:'intuicao',acquisition:'Comprada'}};w.actor.items.push(source,other,purchased);const before=clone(w.actor.system);
 const one=await capabilityRecords.grant(w.actor,{sourceItemId:'source',benefitKey:'intuicao',reason:'Básico p.182'});assert.equal((await capabilityRecords.grant(w.actor,{sourceItemId:'source',benefitKey:'intuicao',reason:'retry'})).id,one.id);
 await capabilityRecords.grant(w.actor,{sourceItemId:'other',benefitKey:'intuicao',reason:'Outra origem'});assert.equal(capabilityRecords.grants(w.actor).length,2);
 w.actor.items.splice(w.actor.items.indexOf(source),1);const grants=capabilityRecords.grants(w.actor);assert.equal(grants.filter(g=>g.available).length,1);assert.ok(w.actor.items.includes(purchased));assert.deepEqual(w.actor.system,before);
});
test('suspension is reversible and removes no acquisition, reserve, purchased benefit or action marker',async()=>{
 const w=world(),item=await acquire(w,'byakugan'),before=clone(w.actor.system);
 await processCapabilityCommand(w.actor,{operation:'suspend',itemId:item.id,reason:'Efeito temporário'},{user:w.gm,requestId:'s1'});assert.equal(capabilityStatus(w.actor,item).suspended,true);
 await processCapabilityCommand(w.actor,{operation:'resume',itemId:item.id},{user:w.gm,requestId:'s2'});assert.equal(capabilityStatus(w.actor,item).suspended,false);assert.equal(w.actor.items.length,1);assert.deepEqual(w.actor.system,before);
});
test('resource contracts link one stable ID without writing either homonymous reserve, even with future metadata',async()=>{
 const w=world('Aburame'),item=await acquire(w,'kikaichuu'),reserves=clone(w.actor.system.special),resources=clone(w.actor.system.resources);
 const resourceKey=definition('kikaichuu').resources[0].key;
 await processCapabilityCommand(w.actor,{operation:'link',itemId:item.id,resourceKey,resourceId:'reserveA'},{user:w.player,requestId:'link1'});
 assert.deepEqual(w.actor.system.special,reserves);assert.deepEqual(w.actor.system.resources,resources);assert.equal(capabilityStatus(w.actor,item).resourceLinks[0].resourceId,'reserveA');
 w.actor.system.special=w.actor.system.special.filter(r=>r.id!=='reserveA');assert.equal(capabilityStatus(w.actor,item).resourceLinks[0].exists,false);
});
test('permission checks survive direct API calls and future ledgers are never rewritten',async()=>{
 const w=world(),item=await acquire(w,'byakugan');await assert.rejects(processCapabilityCommand(w.actor,{operation:'suspend',itemId:item.id,reason:'x'},{user:w.player,requestId:'p1'}),/mestre/);
 await assert.rejects(processCapabilityCommand(w.actor,{operation:'origins',origins:['uchiha']},{user:w.stranger,requestId:'p2'}),/controla/);
 w.actor.flags[ID]={capabilities:{schemaVersion:99,keep:true}};const flags=clone(w.actor.flags);await assert.rejects(capabilityRecords.suspend(w.actor,item.id,'x'),/Versão/);assert.deepEqual(w.actor.flags,flags);
});
test('origins save changes only the explicit origin contract and never rewrites legacy identity or resources',async()=>{
 const w=world(),before=clone(w.actor.system);await processCapabilityCommand(w.actor,{operation:'origins',origins:['hyuuga','uchiha']},{user:w.gm,requestId:'o1'});
 assert.deepEqual(w.actor.system.identity,before.identity);assert.deepEqual(w.actor.system.special,before.special);assert.deepEqual(w.actor.system.resources,before.resources);assert.deepEqual(characterOrigins(w.actor.system).keys,['hyuuga','uchiha']);assert.equal(w.actor.items.length,0);
});
test('capability grant adapter rejects arbitrary benefits not described by the source',async()=>{
 const w=world();const item=await acquire(w,'byakugan');await assert.rejects(processCapabilityCommand(w.actor,{operation:'grant',itemId:item.id,benefitKey:'reflexos',reason:'x'},{user:w.gm,requestId:'g1'}),/não descrito/);
});
test('restricted catalogue and existing sheet expose categories, reasons, source pages, levels and manual coverage with escaped data',async()=>{
 const w=world();let html=restrictedCatalogView({actor:w.actor,isGM:false,profile:w.books,houseRules:{}});assert.match(html,/Categoria/);assert.match(html,/Exibindo aptidões das origens/);assert.match(html,/Níveis:/);assert.match(html,/efeitos/);
 html=actorView(w.actor,'aptitudes',{isGM:true,profile:w.books});assert.match(html,/data-panel="learn"/);
 const item=await acquire(w,'byakugan');item.name='<script>x</script>';html=restrictedUseView({actor:w.actor,isGM:true,profile:w.books},item);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.match(html,/Suspensão/);assert.match(html,/Ativação/);
});
test('shared coordinator authenticates the original requester, serializes duplicate purchases and marks requests completed',async()=>{
 const w=world();const requests=[];
 for(const id of ['one','two']){const req={id,author:w.player,flags:{[ID]:{actionRequest:{op:'capability',actorUuid:w.actor.uuid,operation:'acquire',key:definition('byakugan').key,book:'basico'}}},getFlag(ns,key){return this.flags?.[ns]?.[key];},async update(patch){for(const[k,v]of Object.entries(patch))set(this,k,v);}};requests.push(req);}
 const result=await Promise.allSettled(requests.map(enqueueActionRequest));assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(w.actor.items.length,1);assert.ok(requests.every(r=>r.flags[ID].actionRequestDone));
});
test('a player request executed by the GM coordinator does not acquire GM-only grant authority',async()=>{
 const w=world();const req={id:'untrusted',author:w.player,flags:{[ID]:{actionRequest:{op:'capability',actorUuid:w.actor.uuid,operation:'acquire',key:definition('byakugan').key,book:'basico',acquisition:'Concedida',reviewReason:'forged'}}},getFlag(ns,key){return this.flags?.[ns]?.[key];},async update(patch){for(const[k,v]of Object.entries(patch))set(this,k,v);}};
 await assert.rejects(enqueueActionRequest(req),/mestre/);assert.equal(w.actor.items.length,0);
});

test('native origin guard prevents changing a legacy or structured origin after restricted purchases',async()=>{
 const {validateOriginChange}=await import('../src/restricted-aptitudes.mjs');
 const w=world(),item=await acquire(w,'byakugan');
 assert.ok(validateOriginChange(w.actor.system,{identity:{clan:'Uchiha'}},[item]).length);
 assert.ok(validateOriginChange(w.actor.system,{capabilityData:{schemaVersion:1,origins:['uchiha']}},[item]).length);
 assert.deepEqual(validateOriginChange(w.actor.system,{identity:{clan:'Uchiha'}},[item],{isGM:true}),[]);
 assert.deepEqual(validateOriginChange(w.actor.system,{identity:{clan:'Uchiha'}},[],{}),[]);
});
test('Uzumaki options remain distinct and require an explicit option rather than granting both branches',()=>{
 const s=system('Uzumaki'),entry=definition('chakra-expandido');assert.ok(restrictedEligibility(entry,s,[]).review.length);
 s.capabilityData={schemaVersion:1,origins:['uzumaki'],originVariants:{uzumaki:'option2'}};assert.equal(restrictedEligibility(entry,s,[]).allowed,false);
 s.capabilityData.originVariants.uzumaki='option1';assert.equal(restrictedEligibility(entry,s,[]).allowed,true);
});
test('purchase and evolution refuse a missing request identifier before touching data',async()=>{
 const w=world('Hyuuga'),before=clone(w.actor.system);
 await assert.rejects(processCapabilityCommand(w.actor,{operation:'acquire',key:definition('byakugan').key},{user:w.player}),/solicitação/);
 assert.deepEqual(w.actor.system,before);assert.equal(w.actor.items.length,0);
});
test('saving a complete sheet with unchanged origin remains permitted after character creation',async()=>{
 const {validateOriginChange}=await import('../src/restricted-aptitudes.mjs');
 const s=system('Hyuuga');s.campaign.draft=false;s.capabilityData={schemaVersion:1,origins:['hyuuga'],originVariants:{}};
 const items=[itemData(definition('byakugan'))];
 assert.deepEqual(validateOriginChange(s,{identity:{...s.identity},capabilityData:clone(s.capabilityData)},items,{isGM:false}),[]);
 assert.deepEqual(validateOriginChange(s,{capabilityData:{schemaVersion:1}},items,{isGM:false}),[]);
 assert.match(validateOriginChange(s,{identity:{clan:'Uchiha'}},items,{isGM:false}).join(' '),/mestre/);
});

function catalogKeys(html) {return [...html.matchAll(/data-catalog="restricted" data-key="([^"]+)"/g)].map(match=>match[1]).sort();}
test('restricted catalogue renders only the current legacy origin, for GM and player',()=>{
 for(const origin of ['Hyuuga','Uchiha','Kugutsu no Jutsu'])for(const isGM of [false,true]){
  const w=world(origin),before=clone(w.actor.system),keys=characterOrigins(w.actor.system).keys;
  const expected=entries.filter(e=>e.accessOrigins.some(key=>keys.includes(key))).map(e=>e.key).sort();assert.ok(expected.length);
  const html=restrictedCatalogView({actor:w.actor,isGM,profile:w.books});assert.deepEqual(catalogKeys(html),expected);assert.deepEqual(w.actor.system,before);
 }
});
test('origin catalogue keeps unmet prerequisites visible and acquisition disabled',()=>{
 const w=world('Aburame');w.actor.system.skills.lidar.points=0;
 const html=restrictedCatalogView({actor:w.actor,isGM:false,profile:w.books});
 assert.ok(catalogKeys(html).includes(definition('kikaichuu').key));assert.match(html,/Ponto investido/);
 const button=html.match(new RegExp('<button[^>]+data-key="'+definition('kikaichuu').key+'"[^>]*>'))[0];assert.match(button,/disabled/);
});
test('structured origins override legacy identity and include all explicitly selected access routes',()=>{
 const w=world('Hyuuga');w.actor.system.capabilityData={schemaVersion:1,origins:['uchiha','buki-senmon']};
 const expected=entries.filter(e=>e.accessOrigins.some(key=>['uchiha','buki-senmon'].includes(key))).map(e=>e.key).sort();
 const html=restrictedCatalogView({actor:w.actor,isGM:true,profile:w.books});assert.deepEqual(catalogKeys(html),expected);
 assert.ok(!catalogKeys(html).includes(definition('byakugan').key));
 const shared=entries.find(e=>e.accessOrigins.includes('buki-senmon')&&e.accessOrigins.includes('tensai'));assert.ok(shared);assert.ok(catalogKeys(html).includes(shared.key));
});
test('missing, unknown and future origins show an empty catalogue without falling back to all entries',()=>{
 for(const data of [undefined,{schemaVersion:1,origins:[]},{schemaVersion:1,origins:['nao-catalogada']},{schemaVersion:99,origins:['hyuuga']}]){
  const w=world('');w.actor.system.capabilityData=data;const before=clone(w.actor.system);
  const html=restrictedCatalogView({actor:w.actor,isGM:true,profile:w.books});assert.deepEqual(catalogKeys(html),[]);assert.match(html,/class="sns-catalog-empty"/);assert.doesNotMatch(html,/data-sns-search/);assert.deepEqual(w.actor.system,before);
 }
});

const form=values=>({querySelectorAll:()=>Object.entries(values).map(([name,value])=>({name,value,type:typeof value==='number'?'number':'text'}))});
test('Bakuton acquisition and Demolition share budget and native validators without granting powers or changing reserves',async()=>{
 const w=world('Bakuton'),before=clone(w.actor.system),budget=pointBudgets(w.actor.system,w.actor.items).powers.remaining;
 await powerAction({close:async()=>{}},'power-save',{},form({'power.family':'bakuton','power.level':5}),{actor:w.actor});
 const power=w.actor.items[0];assert.equal(power.system.powerData.family,'bakuton');assert.equal(power.system.source.book,'hijutsus2');assert.equal(power.system.source.page,'19');
 assert.equal(pointBudgets(w.actor.system,w.actor.items).powers.remaining,budget-5);
 assert.equal(restrictedEligibility(definition('demolicao'),w.actor.system,w.actor.items,{books:w.books.books}).allowed,true);
 await acquire(w,'demolicao');assert.equal(w.actor.items.length,2);assert.equal(pointBudgets(w.actor.system,w.actor.items).powers.remaining,budget-7);assert.deepEqual(w.actor.system,before);assert.equal(w.actor.effects.length,0);
 await assert.rejects(powerAction({close:async()=>{}},'power-save',{},form({'power.family':'bakuton','power.level':5}),{actor:w.actor}),/já foi adquirido/);
});
test('Bakuton validates origin, Spirit, enabled source and NC even for the GM',()=>{
 const w=world('Bakuton'),power={name:'Bakuton',type:'power',system:{level:5,powerData:{family:'bakuton',track:1,choices:[]}}};
 assert.deepEqual(validatePowerPurchase(w.actor,power,{books:w.books.books}),[]);
 w.actor.system.identity.clan='Hyuuga';assert.match(validatePowerPurchase(w.actor,power,{books:w.books.books,isGM:true}).join(' '),/Origem/);
 w.actor.system.identity.clan='Bakuton';w.actor.system.attributes.esp=2;assert.match(validatePowerPurchase(w.actor,power,{books:w.books.books}).join(' '),/Espírito 3/);
 assert.match(validatePowerPurchase(w.actor,power,{books:['basico']}).join(' '),/Livro/);
 w.actor.system.campaign.level=4;assert.match(validatePowerPurchase(w.actor,power,{books:w.books.books}).join(' '),/NC/);
});
test('Bakuton and incompatible elemental purchases are blocked in both directions without writes',()=>{
 const w=world('Bakuton'),power={id:'bakuton',name:'Bakuton',type:'power',system:{level:1,powerData:{family:'bakuton',track:1,choices:[]}}},katon={id:'katon',name:'Katon',type:'power',system:{level:1,powerData:{family:'katon',track:1,choices:[{effect:'canhao',tier:1}]}}};
 w.actor.items.push(katon);assert.match(validatePowerPurchase(w.actor,power,{books:w.books.books}).join(' '),/somente Doton e Raiton/);
 w.actor.items.splice(0);w.actor.items.push(power);assert.match(validatePowerPurchase(w.actor,katon,{books:w.books.books}).join(' '),/somente Doton e Raiton/);assert.equal(w.actor.writes.length,0);
});
test('power catalogue follows source and explicit origin, while manual Bakuton has no execute control',()=>{
 const w=world('Bakuton');let html=panelView('power-catalog',{actor:w.actor,profile:w.books});assert.match(html,/data-family="bakuton"/);
 w.actor.system.capabilityData={schemaVersion:1,origins:['hyuuga']};html=panelView('power-catalog',{actor:w.actor,profile:w.books});assert.doesNotMatch(html,/data-family="bakuton"/);
 w.actor.system.capabilityData.origins=['bakuton'];html=panelView('power-catalog',{actor:w.actor,profile:{...w.books,books:['basico']}});assert.doesNotMatch(html,/data-family="bakuton"/);
 w.actor.items.push({id:'b',name:'Bakuton',type:'power',system:{level:5,powerData:{family:'bakuton'}}});html=panelView('power-use',{actor:w.actor,itemId:'b'});assert.match(html,/Execução manual/);assert.doesNotMatch(html,/data-sns="power-execute"/);
});
test('one acquisition entry replaces repeated buttons and sheet rendering preserves all character data',()=>{
 const w=world(),before=clone(w.actor.system);
 const powers=actorView(w.actor,'techniques',{isGM:true,profile:w.books});
 assert.match(powers,/data-sns="power-catalog"/);
 assert.doesNotMatch(powers,/data-panel="learn"/);
 const aptitudes=actorView(w.actor,'aptitudes',{isGM:true,profile:w.books});
 assert.match(aptitudes,/data-panel="learn"/);
 assert.doesNotMatch(aptitudes,/data-sns="power-catalog"/);
 const menu=panelView('learn',{actor:w.actor});
 assert.match(menu,/data-catalog="aptitudes"/);
 assert.match(menu,/data-catalog="restricted"/);
 assert.doesNotMatch(menu,/data-sns="power-catalog"|data-kind="technique"/);
 assert.deepEqual(w.actor.system,before);
});
test('all sheets follow the same world power budget while retaining their own state',()=>{
 const w=world(),before=clone(w.actor.system);
 for(const rate of [2,3,4])for(const a of [w.actor,{...w.actor,id:'second'}]){
  const html=actorView(a,'techniques',{houseRules:{powerRate:rate},profile:w.books});assert.ok(html.includes(pointBudgets(a.system,a.items,{powerRate:rate}).powers.remaining+' pontos disponíveis'));
 }
 assert.deepEqual(w.actor.system,before);
});

 test('RES-002 authority validates controller and activation preserves manual action marks',async()=>{
  const w=world(),item=await acquire(w,'byakugan'),actions=clone(w.actor.system.actions);
  await assert.rejects(processCapabilityCommand(w.actor,{operation:'activate',itemId:item.id},{user:w.stranger,requestId:'a1'}),/controla/);
  await processCapabilityCommand(w.actor,{operation:'activate',itemId:item.id},{user:w.player,requestId:'a2'});
  assert.equal(w.actor.system.resources.chakra.value,16);assert.equal(capabilityStatus(w.actor,item).activation.active,true);assert.deepEqual(w.actor.system.actions,actions);
  const html=restrictedUseView({actor:w.actor,isGM:false,profile:w.books},item);assert.match(html,/Desativar doujutsu/);assert.match(html,/capability-deactivate/);
  await processCapabilityCommand(w.actor,{operation:'deactivate',itemId:item.id},{user:w.player,requestId:'a3'});assert.equal(capabilityStatus(w.actor,item).activation.active,false);assert.equal(w.actor.system.resources.chakra.value,16);
 });
 test('RES-002 Aburame linking rejects sharing a reserve between species and keeps existing data',async()=>{
  const w=world('Aburame'),kika=await acquire(w,'kikaichuu',{},'ka'),shoka=await acquire(w,'shokaichuu',{},'sh');
  await processCapabilityCommand(w.actor,{operation:'link',itemId:kika.id,resourceKey:'aburame.reserve',resourceId:'reserveA'},{user:w.player,requestId:'l1'});
  const before=clone(w.actor.flags);
  await assert.rejects(processCapabilityCommand(w.actor,{operation:'link',itemId:shoka.id,resourceKey:'aburame.reserve',resourceId:'reserveA'},{user:w.player,requestId:'l2'}),/independente/);assert.deepEqual(w.actor.flags,before);
 });

 test('RES-002 derived Intuition never stacks with own purchase, which survives deactivation',async()=>{
  const {derivedSummary}=await import('../src/automation.mjs');
  const w=world('Uchiha'),base=await acquire(w,'sharingan',{},'base'),nidan=await acquire(w,'nidan-sharingan',{},'nidan');w.actor.system.combat={cc:19,cd:19,esq:19,lm:19};
  const command=(operation,id)=>processCapabilityCommand(w.actor,{operation,itemId:base.id},{user:w.player,requestId:id});
  assert.equal(derivedSummary(w.actor).combat.lm,19);await command('activate','ac1');assert.equal(derivedSummary(w.actor).combat.lm,20);
  const own=new w.Item({id:'own-intuition',name:'Intuição',type:'aptitude',system:{catalogKey:'intuicao',level:1}},w.actor);w.actor.items.push(own);assert.equal(derivedSummary(w.actor).combat.lm,20);
  await command('deactivate','ac2');assert.equal(derivedSummary(w.actor).combat.lm,20);assert.ok(w.actor.items.includes(own));assert.ok(w.actor.items.includes(nidan));
  w.actor.items.splice(w.actor.items.indexOf(own),1);assert.equal(derivedSummary(w.actor).combat.lm,19);
 });

test('Juuken uses the existing catalogue and purchase route with the published prerequisites',async()=>{
 const w=world('Hyuuga');
 const fields=form({'power.family':'juuken','power.level':1});
 const buy=()=>powerAction({close:async()=>{}},'power-save',{},fields,{actor:w.actor});
 assert.match(panelView('power-catalog',{actor:w.actor,profile:w.books}),/data-family="juuken"/);
 await assert.rejects(buy(),/Byakugan/);
 await acquire(w,'byakugan');
 await assert.rejects(buy(),/Acuidade/);
 w.actor.items.push(new w.Item({id:'acu',name:'Acuidade',type:'aptitude',system:{catalogKey:'acuidade',level:1}},w.actor));
 w.actor.system.attributes.esp=0;
 await assert.rejects(buy(),/Espírito 1/);
 w.actor.system.attributes.esp=1;
 await buy();
 const power=w.actor.items.find(i=>i.type==='power');
 assert.equal(power.system.powerData.family,'juuken');
 assert.equal(power.system.source.page,'159');
 await assert.rejects(buy(),/já foi adquirido/);
 w.actor.system.identity.clan='Uchiha';
 assert.doesNotMatch(panelView('power-catalog',{actor:w.actor,profile:w.books}),/data-family="juuken"/);
 assert.match(validatePowerPurchase(w.actor,power).join(' '),/Origem necessária: hyuuga/);
});


test('Juuken in the normal attack flow requires active Byakugan and uses Dexterity and its own weapon damage',async()=>{
 const {prepareWeaponAction}=await import('../src/weapon-actions.mjs');
 const {savedDefaults}=await import('../src/saved-actions.mjs');
 const {bodyHardness}=await import('../src/physical-actions.mjs');
 const w=world('Hyuuga'),eye=await acquire(w,'byakugan');
 w.actor.items.push(new w.Item({id:'acu',name:'Acuidade',type:'aptitude',system:{catalogKey:'acuidade',level:1}},w.actor));
 w.actor.items.push(new w.Item({id:'iron',name:'Punho de Ferro',type:'aptitude',system:{catalogKey:'punho-de-ferro',level:1}},w.actor));
 await powerAction({close:async()=>{}},'power-save',{},form({'power.family':'juuken','power.level':5}),{actor:w.actor});
 w.actor.system.attributes.for=8;
 w.actor.system.attributes.des=14;
 const opts=savedDefaults({juuken:true,maneuver:'golpear'});
 const prepare=()=>prepareWeaponAction(w.actor,'unarmed',opts);
 assert.throws(prepare,/Byakugan ativo/);
 await processCapabilityCommand(w.actor,{operation:'activate',itemId:eye.id},{user:w.player,requestId:'juuken-activate'});
 assert.equal(prepare().plan.base,10);
 assert.equal(prepare().attacks[0].juuken,true);
 assert.equal(prepareWeaponAction(w.actor,'unarmed').plan.base,6);
 assert.throws(()=>prepareWeaponAction(w.actor,'unarmed',{...opts,maneuver:'chute-duplo'}),/chutes/);
 assert.equal(bodyHardness({system:{physical:{bodyHardness:5}}},{juuken:true}),3);
 assert.equal(bodyHardness({system:{physical:{bodyHardness:5},powerState:{active:[{bodyHardness:4}]}}},{juuken:true}),4);
 await processCapabilityCommand(w.actor,{operation:'deactivate',itemId:eye.id},{user:w.player,requestId:'juuken-deactivate'});
 assert.throws(prepare,/Byakugan ativo/);
});


test('Hakke Kuushou uses the power panel, fixed chakra cost and selectable resistance',async()=>{
 const {powerPlan}=await import('../src/power-rules.mjs');
 const w=world('Hyuuga'),eye=await acquire(w,'byakugan');
 w.actor.items.push(new w.Item({id:'acu',name:'Acuidade',type:'aptitude',system:{catalogKey:'acuidade',level:1}},w.actor));
 await powerAction({close:async()=>{}},'power-save',{},form({'power.family':'juuken','power.level':6}),{actor:w.actor});
 const item=w.actor.items.find(i=>i.type==='power');
 const plan=(options={})=>powerPlan(item,w.actor.system,w.actor.items,{effect:'kuushou',level:5,distance:20,...options},{actor:w.actor,books:w.books.books});
 assert.throws(plan,/Byakugan ativo/);
 await processCapabilityCommand(w.actor,{operation:'activate',itemId:eye.id},{user:w.player,requestId:'kuushou-active'});
 w.actor.system.attributes.des=14;
 const result=plan();
 assert.equal(result.cost,5);
 assert.equal(result.stat,'cc');
 assert.equal(result.damage,10);
 assert.equal(result.range,20);
 assert.deepEqual(result.resistances[0],{stat:['acrobacia','for'],difficulty:19,onFail:['caido'],push:3});
 assert.throws(()=>plan({distance:21}),/20 m/);
 assert.throws(()=>plan({level:4}),/não disponível neste nível/);
 assert.match(panelView('power-use',{actor:w.actor,itemId:item.id,profile:w.books}),/Hakke Kuushou/);
 const chakra=w.actor.system.resources.chakra.value;
 const execute=distance=>powerAction({values:{},close:async()=>{}},'power-execute',{},form({
  'power.id':item.id,'power.effect':'kuushou','power.level':5,'power.distance':distance
 }),{actor:w.actor});
 await assert.rejects(execute(21),/20 m/);
 await assert.rejects(execute(20),/Escolha o alvo/);
 assert.equal(w.actor.system.resources.chakra.value,chakra);
});


test('Aburame deployment and losses preserve independent species reserves and are retry safe',async()=>{
 const w=world('Aburame');
 const kika=await acquire(w,'kikaichuu',{},'kika');
 const shoka=await acquire(w,'shokaichuu',{},'shoka');
 await processCapabilityCommand(w.actor,{operation:'link',itemId:kika.id,resourceKey:'aburame.reserve',resourceId:'reserveA'},{user:w.player,requestId:'link-kika'});
 const execute=(operation,amount,requestId)=>processCapabilityCommand(w.actor,{operation,itemId:kika.id,amount},{user:w.player,requestId});
 await execute('insects-deploy',2,'deploy-two');
 await execute('insects-deploy',2,'deploy-two');
 assert.equal(w.actor.system.special.find(r=>r.id==='reserveA').value,2);
 assert.equal(capabilityStatus(w.actor,kika).clan.insects.find(r=>r.itemId===kika.id).deployed,2);
 await assert.rejects(execute('insects-return',3,'over-return'),/excede/);
 await execute('insects-loss',1,'loss');
 await execute('insects-return',1,'return');
 assert.equal(w.actor.system.special.find(r=>r.id==='reserveA').value,3);
 await assert.rejects(execute('insects-recover',1,'too-early'),/dois dias/);
 game.time={worldTime:172800};
 await execute('insects-recover',1,'recover-one');
 assert.equal(w.actor.system.special.find(r=>r.id==='reserveA').value,4);
 assert.equal(w.actor.system.special.find(r=>r.id==='reserveB').value,5);
 assert.equal(capabilityStatus(w.actor,shoka).clan.insects.find(r=>r.itemId===shoka.id).deployed,0);
 await powerAction({close:async()=>{}},'power-save',{},form({'power.family':'kikai-ninpou','power.level':1,'power.choice.0':'canhao:1'}),{actor:w.actor});
 assert.equal(w.actor.items.find(i=>i.type==='power').system.powerData.family,'kikai-ninpou');
});


test('Natural Katon grants Sopro 4 at NC 4 and derives tiers without replacing purchased choices',async()=>{
 const {powerPlan,powerUseItem,knownPowerEffects}=await import('../src/power-rules.mjs');
 const w=world('Uchiha');
 const apt=await acquire(w,'elemento-natural-katon');
 const virtual=powerUseItem(apt);
 w.actor.system.campaign.level=4;
 w.actor.system.attributes.esp=5;
 const plan=powerPlan(virtual,w.actor.system,w.actor.items,{effect:'sopro',level:4},{actor:w.actor,books:w.books.books});
 assert.equal(plan.cost,3);
 assert.equal(plan.damage,7);
 assert.equal(plan.tier,4);
 w.actor.system.campaign.level=20;
 const katon={type:'power',id:'katon7',name:'Katon',system:{level:7,powerData:{family:'katon',choices:[{effect:'canhao',tier:1}]}}};
 w.actor.items.push(katon);
 assert.equal(knownPowerEffects(katon,{actor:w.actor}).get('sopro'),7);
 assert.equal(katon.system.powerData.choices.length,1);
 assert.throws(()=>powerPlan(virtual,w.actor.system,w.actor.items,{effect:'sopro',level:4},{actor:w.actor}),/poder Katon/);
 w.actor.items.splice(w.actor.items.indexOf(apt),1);
 assert.equal(knownPowerEffects(katon,{actor:w.actor}).has('sopro'),false);
 assert.equal(knownPowerEffects(katon,{actor:w.actor}).get('canhao'),1);
});
