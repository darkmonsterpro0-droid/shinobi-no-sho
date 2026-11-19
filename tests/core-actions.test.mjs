import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {ID} from '../src/config.mjs';
import {createActionStore} from '../src/core/action-store.mjs';
import {createActionAccess} from '../src/core/action-access.mjs';
import {createRequestQueue,activeCoordinator,canControl,createExecutionStore} from '../src/core/execution.mjs';
import {actionRows,resourceReadouts,manualMarkers} from '../src/core/action-controls.mjs';
import {combatHUDView,hudActors,selectedHUDActor,registerCombatHUD} from '../src/combat-hud.mjs';
import {actionMacroCommand,createActionShortcut,registerActionShortcuts,actionDragData,promptActionShortcut} from '../src/action-shortcuts.mjs';
import {savedActionEvent} from '../src/saved-actions.mjs';
import {createApplications} from '../src/apps.mjs';

const record={schemaVersion:1,id:'poderoso',name:'Kunai — Poderoso',definition:'shinobi.weaponAttack',source:{itemId:'kunai'},defaults:{maneuver:'ataque-poderoso'},favorite:true};
function patch(doc,changes){for(const[path,value]of Object.entries(changes)){const parts=path.split('.'),last=parts.pop();let target=doc;for(const k of parts)target=target[k]??={};if(last.startsWith('-='))delete target[last.slice(2)];else target[last]=structuredClone(value);}}
function actor(uuid='Actor.a'){
 return {uuid,id:uuid,name:'Shinobi',type:'character',isOwner:true,flags:{[ID]:{savedActions:{poderoso:structuredClone(record)}}},system:{resources:{vitality:{value:20,max:30},chakra:{value:8,max:10}},actions:{standard:true,movement:false,partial:true}},async update(p){patch(this,p);},getFlag(ns,k){return this.flags[ns]?.[k];}};
}
function setup(){
 const a=actor(),b=actor('Actor.b');b.isOwner=false;let count=0;
 const macros=[];macros.contents=macros;
 globalThis.game={user:{id:'u',character:a,hotbar:{},targets:new Set(),can:()=>true,async assignHotbarMacro(m,slot){this.hotbar[slot]=m.id;}},actors:{contents:[a,b]},macros,settings:{get:()=>false}};
 globalThis.canvas={tokens:{controlled:[],placeables:[]}};
 globalThis.foundry={documents:{Macro:{canUserCreate:()=>true,async create(data){const m={...data,id:'m'+(++count),author:game.user,isOwner:true,getFlag(ns,k){return this.flags[ns]?.[k];}};macros.push(m);return m;}}},utils:{randomID:()=>String(++count)}};
 const hooks=new Map();globalThis.Hooks={on:(name,fn)=>hooks.set(name,fn)};
 globalThis.fromUuid=async uuid=>[a,b].find(x=>x.uuid===uuid);
 globalThis.ui={notifications:{error:()=>{}}};
 return {a,b,hooks,macros};
}

test('Core storage preserves old records, unknown versions and unrelated character data',async()=>{
 const {a}=setup(),store=createActionStore(ID);a.flags[ID].savedActions.future={schemaVersion:99,id:'future',value:'preserve'};a.flags.legacy={x:7};
 const system=structuredClone(a.system);await store.duplicate(a,'poderoso','copy');await store.favorite(a,'poderoso');await store.remove(a,'copy');
 assert.equal(store.list(a).length,1);assert.equal(store.list(a)[0].favorite,false);assert.equal(a.flags[ID].savedActions.future.value,'preserve');assert.deepEqual(a.flags.legacy,{x:7});assert.deepEqual(a.system,system);
 a.isOwner=false;await assert.rejects(store.remove(a,'poderoso'),/não pode/);
 a.isOwner=true;await assert.rejects(store.put(a,{...record,id:'__proto__'}),/inválida/);
});
test('Core storage supports a second adapter without importing Shinobi or changing its flags',async()=>{
 const {a}=setup(),before=structuredClone(a.flags[ID]),store=createActionStore('other-system');
 await store.put(a,{...record,id:'generic',definition:'other.action'});assert.equal(store.get(a,'generic').definition,'other.action');assert.deepEqual(a.flags[ID],before);
 for(const name of await readdir(new URL('../src/core/',import.meta.url))){const source=await readFile(new URL('../src/core/'+name,import.meta.url),'utf8');assert.doesNotMatch(source,/from ['"]\.\.\//);assert.doesNotMatch(source,/shinobi\.weaponAttack|weaponAttack\(|maneuverPlan\(/);}
});
test('Shared access uses current saved configuration and coalesces simultaneous use',async()=>{
 const {a,b}=setup(),store=createActionStore(ID),calls=[];let release;const wait=new Promise(r=>release=r);
 const access=createActionAccess({resolveActor:fromUuid,list:store.list,use:async(actor,id)=>{calls.push(store.get(actor,id).defaults.maneuver);await wait;}});
 const first=access.use(a.uuid,record.id),second=access.use(a.uuid,record.id);await new Promise(r=>setImmediate(r));assert.equal(calls.length,1);release();await Promise.all([first,second]);
 a.flags[ID].savedActions.poderoso.defaults.maneuver='golpear';await access.use(a.uuid,record.id);assert.deepEqual(calls,['ataque-poderoso','golpear']);
 const result=await access.list(a.uuid);result[0].name='external';assert.notEqual(store.get(a,'poderoso').name,'external');
 await assert.rejects(access.use(b.uuid,record.id),/não controla/);await assert.rejects(access.use(a.uuid,'deleted'),/não encontrada/);
});
test('Sheet action-use calls the shared service instead of a separate execution',async()=>{
 const {a}=setup(),calls=[];game.shinobi={actions:{use:async(...args)=>calls.push(args)}};
 await savedActionEvent({},'action-use',{id:record.id},null,{actor:a,show:()=>assert.fail('separate panel')});assert.deepEqual(calls,[[a.uuid,record.id]]);
});
test('Core request queue recovers after failure and keeps request order',async()=>{
 const events=[],run=createRequestQueue(async value=>{events.push(value);if(value==='bad')throw Error('failed');});
 await Promise.all([assert.rejects(run('bad'),/failed/),run('next')]);assert.deepEqual(events,['bad','next']);
 assert.equal(activeCoordinator([{id:'z',isGM:true,active:true},{id:'a',isGM:true,active:false},{id:'b',isGM:true,active:true}]).id,'b');
 assert.equal(canControl(null,{isGM:true}),false);
});
test('Generic execution storage keeps state and rendered card in one document update',async()=>{
 const calls=[],message={getFlag:()=>({state:'declared'}),update:async p=>calls.push(p)},store=createExecutionStore({namespace:'another',render:e=>e.state});
 const snapshot=store.read(message);snapshot.state='active';await store.write(message,snapshot);assert.deepEqual(calls,[{'flags.another.actionExecution':{state:'active'},content:'active'}]);
});
test('HUD follows a single controlled owned token and never guesses among several',()=>{
 const {a,b}=setup();assert.equal(selectedHUDActor(),a);canvas.tokens.controlled=[{actor:b}];assert.equal(selectedHUDActor(),null);canvas.tokens.controlled=[{actor:a},{actor:b}];assert.equal(selectedHUDActor(),null);
 const synthetic=actor('Scene.s.Token.t.Actor.a');canvas.tokens.controlled=[{actor:synthetic}];canvas.tokens.placeables=canvas.tokens.controlled;assert.equal(selectedHUDActor(),synthetic);game.actors.contents.push({...actor('Actor.creature'),type:'creature'});assert.deepEqual(hudActors().map(a=>a.uuid),[a.uuid]);
});
test('HUD and generic controls escape content and expose only authorized resources',()=>{
 const {a,b}=setup();a.name='<script>name</script>';a.flags[ID].savedActions.poderoso.name='<img onerror=x>';
 const before=structuredClone(a.system),html=combatHUDView(a);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/20 \/ 30/);assert.match(html,/data-sns="action-use"/);assert.doesNotMatch(html,/system[.]actions|Marcação manual/);assert.deepEqual(a.system,before);
 b.name='SECRET';assert.doesNotMatch(combatHUDView(b),/SECRET|20 \/ 30/);
 assert.match(actionRows([{id:'x',name:'A&B'}],{prefix:'other'}),/data-other="action-use"/);assert.match(resourceReadouts([{label:'<hp>',value:1,max:2}]),/&lt;hp&gt;/);assert.match(manualMarkers([{label:'<A>',path:'x',checked:false}]),/&lt;A&gt;/);
});
test('Macro stores only references, reuses unmodified own macro and resolves latest action on execution',async()=>{
 const {a,macros}=setup(),m=await createActionShortcut(a,record.id,4);assert.equal(game.user.hotbar[4],m.id);assert.deepEqual(m.ownership,{default:0,u:3});assert.doesNotMatch(m.command,/ataque-poderoso|Kunai|precision|damage/);
 await createActionShortcut(a,record.id,5);assert.equal(macros.length,1);
 const calls=[];game.noSho={actions:{use:async(...args)=>calls.push(args)}};a.flags[ID].savedActions.poderoso.defaults.maneuver='golpear';
 await new Function('return (async()=>{'+m.command+'})()')();assert.deepEqual(calls,[[a.uuid,record.id]]);
 m.command+=' // edited';await createActionShortcut(a,record.id,6);assert.equal(macros.length,2);assert.match(m.command,/edited/);
});
test('Shortcut creation respects permissions, source ownership, slot range and concurrent creation',async()=>{
 const {a,b,macros}=setup();await assert.rejects(createActionShortcut(b,record.id,1),/não controla/);await assert.rejects(createActionShortcut(a,record.id,51),/1 a 50/);
 foundry.documents.Macro.canUserCreate=()=>false;await assert.rejects(createActionShortcut(a,record.id,1),/permissões/);assert.equal(macros.length,0);foundry.documents.Macro.canUserCreate=()=>true;
 game.user.can=()=>false;await assert.rejects(createActionShortcut(a,record.id,1),/permissões/);game.user.can=()=>true;
 await Promise.all([createActionShortcut(a,record.id,1),createActionShortcut(a,record.id,2)]);assert.equal(macros.length,1);
 a.flags[ID].savedActions={};await assert.rejects(createActionShortcut(a,record.id,3),/não encontrada/);
});
test('Macro references cannot inject executable text',async()=>{
 setup();globalThis.injected=false;const uuid='Actor."; globalThis.injected=true; //',id='x';const calls=[];game.noSho={actions:{use:async(...args)=>calls.push(args)}};
 await new Function('return (async()=>{'+actionMacroCommand(uuid,id)+'})()')();assert.equal(globalThis.injected,false);assert.deepEqual(calls,[[uuid,id]]);
});
test('Keyboard shortcut picker preserves occupied slot when replacement is declined',async()=>{
 const {a,macros}=setup();game.user.hotbar[1]='existing';foundry.applications={api:{DialogV2:{prompt:async()=>1,confirm:async()=>false}}};
 await promptActionShortcut(a,record.id);assert.equal(game.user.hotbar[1],'existing');assert.equal(macros.length,0);
});
test('Native hotbar hook blocks default handling synchronously only for No Sho action drops',async()=>{
 const {a,hooks}=setup();registerActionShortcuts();const drop=hooks.get('hotbarDrop');assert.equal(drop({}, {type:'Item'},1),undefined);assert.equal(drop({},actionDragData(a,record.id),7),false);await new Promise(r=>setImmediate(r));assert.ok(game.user.hotbar[7]);
 const errors=[];ui.notifications.error=e=>errors.push(e);assert.equal(drop({},{...actionDragData(a,record.id),systemId:'wrong'},8),false);await new Promise(r=>setImmediate(r));assert.match(errors[0],/outro sistema/);assert.equal(game.user.hotbar[8],undefined);
});
test('Native scene control uses v14 keyed controls without replacing other tools',()=>{
 const {hooks}=setup(),calls=[];game.noSho={hud:{toggle:()=>calls.push('toggle'),follow:()=>calls.push('follow'),activate:()=>calls.push('activate'),refresh:()=>calls.push('refresh')}};registerCombatHUD();const controls={tokens:{tools:{target:{name:'target'}}}};
 hooks.get('getSceneControlButtons')(controls);assert.equal(controls.tokens.tools.target.name,'target');assert.equal(controls.tokens.tools.noShoCombat.button,true);controls.tokens.tools.noShoCombat.onChange();hooks.get('controlToken')();hooks.get('updateActor')();hooks.get('canvasReady')();assert.deepEqual(calls,['toggle','follow','refresh','activate']);
});
test('HUD hides resources when ownership is revoked',async()=>{
 const {a}=setup();class Base{constructor(options){this.options=options;this.rendered=false;}async render(){this.rendered=true;return this;}async close(){this.rendered=false;}async _prepareContext(){return {};}}
 foundry.applications={api:{ApplicationV2:Base,HandlebarsApplicationMixin:B=>B},sheets:{ActorSheetV2:Base,ItemSheetV2:Base}};
 const apps=createApplications(),hud=new apps.ShinobiPanel('combat-hud',{actor:a});
 a.isOwner=false;const view=await hud._prepareContext({});assert.doesNotMatch(view.body,/20 \/ 30/);
});

test('HUD retains its intended bottom gap across render clamps and respects a deliberate manual move',async()=>{
 setup();let height=300,top=500;
 class Base{
  constructor(options){this.options=options;}
  async _preRender(){}async _onRender(){} _onPosition(){}
  setPosition(p){top=Math.max(0,p.top);this.position={...p,top};this._onPosition(this.position);}
  _refit(){this.setPosition({top:0});}
 }
 foundry.applications={api:{ApplicationV2:Base,HandlebarsApplicationMixin:B=>B},sheets:{ActorSheetV2:Base,ItemSheetV2:Base}};
 const {ShinobiPanel}=createApplications(),hud=new ShinobiPanel('combat-hud');
 hud.element={ownerDocument:{documentElement:{clientHeight:900}},querySelector:()=>null,
  getBoundingClientRect:()=>({top,height,bottom:top+height})};
 await hud._preRender({},{});await hud._onRender({},{});assert.equal(top,530);
 await hud._preRender({},{});height=850;hud.setPosition({top:0});await hud._onRender({},{});
 assert.equal(hud._hudBottomGap,70);
 await hud._preRender({},{});height=300;await hud._onRender({},{});assert.equal(top,530);
 hud.setPosition({top:200});assert.equal(hud._hudBottomGap,400);
 await hud._preRender({},{});height=700;hud.setPosition({top:0});await hud._onRender({},{});
 await hud._preRender({},{});height=300;await hud._onRender({},{});assert.equal(top,200);
 // Foundry's ResizeObserver refits after rendering; that automatic move must
 // not be mistaken for a user drag, including during the opening transform.
 hud.element.getBoundingClientRect=()=>({top,height:height*0.95,bottom:top+height*0.95});
 Object.defineProperty(hud.element,'offsetHeight',{get:()=>height});
 height=850;hud._refit();assert.equal(hud._hudBottomGap,400);
 height=300;hud._refit();assert.equal(top,200);assert.equal(hud._hudBottomGap,400);
});

test('HUD does not fit against minimized bounds and restores its usable width and natural height',async()=>{
 setup();let refits=0;
 class Base{
  constructor(options){this.options=options;this.position={width:900,height:'auto',top:530};this.minimized=true;}
  _onPosition(){}
  setPosition(p){Object.assign(this.position,p);this._onPosition(this.position);}
  _refit(p){refits++;this.setPosition(p);}
  async maximize(){this.minimized=false;this.setPosition({width:200,height:52});}
 }
 foundry.applications={api:{ApplicationV2:Base,HandlebarsApplicationMixin:B=>B},sheets:{ActorSheetV2:Base,ItemSheetV2:Base}};
 const {ShinobiPanel}=createApplications(),hud=new ShinobiPanel('combat-hud');hud._hudBottomGap=70;
 hud.element={ownerDocument:{documentElement:{clientHeight:900}},classList:{contains:()=>false},get offsetHeight(){return hud.position.width===900?300:52;}};
 hud._anchorHUD();hud._refit();assert.equal(refits,0);assert.equal(hud.position.width,900);assert.equal(hud._hudBottomGap,70);
 await hud.maximize();assert.equal(hud.position.width,900);assert.equal(hud.position.height,'auto');assert.equal(hud.position.top,530);assert.equal(hud._hudBottomGap,70);
});

test('controlled technique forms accept choices only while the user controls the linked mind, without enabling the body sheet',async()=>{
 const {a,b}=setup();a.testUserPermission=user=>user.id==='u';a.system.powerState={active:[{id:'mind-root',mentalControl:{mode:'transfer'}}]};
 b.system.powerState={active:[{linkedTo:'mind-root',sourceUuid:a.uuid,mentalControlLink:{mode:'transfer'}}]};
 class Base{constructor(options){this.options=options;}async _onRender(){}}
 foundry.applications={api:{ApplicationV2:Base,HandlebarsApplicationMixin:B=>B},sheets:{ActorSheetV2:Base,ItemSheetV2:Base}};
 const {ShinobiPanel}=createApplications(),panel=new ShinobiPanel('power-use',{actor:b,mindControl:{sourceUuid:a.uuid,rootId:'mind-root'}}),field={disabled:false};
 const root={dataset:{},addEventListener(){},querySelector:()=>null,querySelectorAll:selector=>selector==='[name]'?[field]:[]};
 panel.element={querySelector:()=>root};await panel._onRender({},{});assert.equal(field.disabled,false);assert.equal(b.isOwner,false);
 panel.kind='power-editor';await panel._onRender({},{});assert.equal(field.disabled,true);
 panel.kind='power-use';field.disabled=false;a.system.powerState.active=[];await panel._onRender({},{});assert.equal(field.disabled,true);
});
