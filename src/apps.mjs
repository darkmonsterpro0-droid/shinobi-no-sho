import {saveWorldProfile,worldProfile} from './world-settings.mjs';
import {SAVED_ACTIONS,savedActionEvent,savedActions,attackTargets,selectedTargets,selectedDistance} from './saved-actions.mjs';
import {CAPABILITY_ACTIONS} from './capability-actions.mjs';
import {extraResources,resourceEditorData,changeExtraResource} from './extra-resources.mjs';
import {requestAction} from './action-executions.mjs';
import {activeAptitudes} from './aptitude-runtime.mjs';
import {canDirectMind,mindCommonItems} from './yamanaka-state.mjs';
import {setWeaponReady} from './weapon-actions.mjs';
import {delayBounds,waitingCombatant} from './combat-initiative.mjs';
import {combatHUDView,hudActors,selectedHUDActor} from './combat-hud.mjs';
import {bindSavedActionDrag} from './action-shortcuts.mjs';
import {WEAPON_RESOLUTION_ACTIONS,weaponResolutionAction} from './weapon-resolution.mjs';
import {TECHNIQUE_ACTIONS,techniqueAction} from './technique-actions.mjs';
import {POWER_ACTIONS,powerAction} from './power-actions.mjs';
import {INVENTORY_ACTIONS,inventoryAction} from './inventory-actions.mjs';
import {PHYSICAL_ACTIONS,physicalAction} from './physical-actions.mjs';
import {CLONE_ACTIONS,cloneAction} from './clone-actions.mjs';
import {APTITUDE_USE_ACTIONS,aptitudeUseAction} from './aptitude-use.mjs';
import {CATALOG_ACTIONS,catalogAction} from './catalog.mjs';
import {BUILD_ACTIONS,buildAction} from './build-actions.mjs';
import {SUMMARY_ACTIONS,automationAction,refreshBudget} from './summary-actions.mjs';
import {allocationProposal,houseRules,getActorView,conditionRecords,saveCondition,statPrecision,restRecovery,derivedSummary} from './automation.mjs';
import {CONDITIONS} from './conditions.mjs';
import {progression,validateAllocation} from './progression.mjs';
import {ID,ICONS,ITEM_TYPES,defaultProfile} from "./config.mjs";
import {actorView,itemView,panelView,esc,set,isAutomatedAptitude,safeImage} from "./ui.mjs";
import {bindSurface,readFields} from "./interactions.mjs";

const deepCopy=value=>foundry.utils.deepClone(value);
const profile=()=>deepCopy(worldProfile());
const own=doc=>!!doc?.isOwner;
const permittedActors=()=>game.actors.filter(a=>a.visible).map(a=>({uuid:a.uuid,name:a.name}));
const asActor=doc=>(doc?.constructor?.documentName==="Actor"||doc?.documentName==="Actor")?doc:doc?.actor??((doc?.parent?.constructor?.documentName==="Actor"||doc?.parent?.documentName==="Actor")?doc.parent:null);
const titles={"combat-hud":"HUD de combate","saved-actions":"Ações salvas","action-targets":"Alvos da ação","technique-modifiers":"Aptidões da técnica","power-catalog":"Catálogo de poderes","power-editor":"Adquirir / evoluir poder","power-use":"Usar poder","inventory-catalog":"Catálogo de suprimentos","inventory-use":"Usar equipamento",physical:"Tamanho e proteção","physical-impact":"Dano recebido","physical-object":"Objetos e barreiras","aptitude-use":"Usar aptidão",gear:"Adicionar equipamento",learn:"Adicionar aptidão",catalog:"Catálogo do livro","weapon-use":"Usar arma",library:"Biblioteca",settings:"Regras da mesa",sources:"Fontes",resources:"Recursos e vínculos",conditions:"Condições",condition:"Condição",special:"Recurso específico",bond:"Vínculo específico",test:"Registrar teste",declare:"Declarar técnica",defense:"Escolher defesa",result:"Conferir resultado",impact:"Revisar perfil",allocation:"Atributos e evolução",house:"Regras da casa",xp:"Conceder EXP",roll:"Teste do resumo",recovery:"Recuperação e chakra",appearance:"Aparência e acessibilidade",decision:"Decisão da mesa"};
const mutating=new Set([...SAVED_ACTIONS,"new-item","remove-item","favorite-item","condition","special","bond","save-entry","delete-entry","portrait","save-sheet-allocation"]);
const gmOnly=new Set(["review-profile","apply-profile","decision"]);
function assertOwner(doc) {if(!own(doc))throw Error("Você não possui permissão para editar esta ficha.");}
function assertGM() {if(!game.user.isGM)throw Error("Somente o mestre pode alterar as regras da mesa.");}
function sourceData(item) {if(item.constructor?.documentName==='Actor'||item.documentName==='Actor')return getActorView(item);const d=item.toObject();return {...d,id:item.id,items:item.items?.map(i=>({...i.toObject(),id:i.id}))??[]};}
const surfaceOptions={classes:["sns-app"],tag:"form",position:{width:940,height:820},window:{resizable:true},form:{handler:async()=>{},submitOnChange:false,closeOnSubmit:false}};

export function createApplications() {
  const {HandlebarsApplicationMixin,ApplicationV2}=foundry.applications.api;
  const {ActorSheetV2,ItemSheetV2}=foundry.applications.sheets;
  const mixin=Base=>class extends HandlebarsApplicationMixin(Base) {
    static DEFAULT_OPTIONS=surfaceOptions;
    static PARTS={surface:{template:`systems/${ID}/templates/surface.hbs`}};
    async _onRender(context,options) {
      await super._onRender(context,options);
      this._unbindSNS?.();const root=this.element.querySelector('.sns-surface');if(!root)return;
      root.dataset.reduceMotion=String(game.settings.get(ID,"reduceMotion"));
      this._unbindSNS=bindSurface(root,{
        action:(op,data,el,button)=>this._snsAction(op,data,el,button),
        change:(key,value,el)=>this._snsChange(key,value,root),
        error:error=>{console.error(`${ID} |`,error);ui.notifications.error(error.message??String(error));const status=root.querySelector('[data-save-status]');if(status)status.textContent="Não foi possível salvar. Seu valor não foi descartado; tente novamente.";}
      });
      this._unbindActionDrag?.();this._unbindActionDrag=bindSavedActionDrag(root,this._actor??asActor(this.document));
      const controlledPanel=['power-use','aptitude-use'].includes(this.kind)&&this.panelConfig?.mindControl&&canDirectMind(this._actor,game.user);
      if((this.document??this._actor)&&!own(this.document??this._actor)&&!controlledPanel) {
        for(const el of root.querySelectorAll('[name]'))el.disabled=true;
        for(const b of root.querySelectorAll('[data-sns]'))if(mutating.has(b.dataset.sns))b.disabled=true;
      }
      if(this.kind==='settings'&&!game.user.isGM){for(const el of root.querySelectorAll('[name], [data-sns="review-profile"]'))el.disabled=true;}
      if(this.kind==='house'&&!game.user.isGM)for(const el of root.querySelectorAll('[name]'))el.disabled=true;
      if(this.kind==='allocation'&&!game.user.isGM&&!this.values.initial)root.querySelector('[name="allocation.nc"]')?.setAttribute('disabled','');
      if(this._focusField){const field=root.querySelector(`[name="${this._focusField}"]`);field?.focus();this._focusField=null;}
      if(this._focusTab){root.querySelector(`[data-tab="${this._focusTab}"]`)?.focus();this._focusTab=null;}
    }
    async _preClose(options) {this._unbindSNS?.();this._unbindActionDrag?.();return super._preClose(options);}
    async _snsChange(key,value,el) {
      if(key.startsWith('extraResource.')){const actor=this._actor??asActor(this.document);await changeExtraResource(actor,key,value);const status=this.element?.querySelector('[data-save-status]');if(status)status.textContent='Recurso salvo';return;}
      if(key.startsWith("ui.")){this._snsChoices??={};this._snsChoices[key]=value;return;}
      if(!this.document)return;
      if(!(key==='name'||key.startsWith('system.')))return;
      assertOwner(this.document);
      if(isAutomatedAptitude(this.document))throw Error('Aptidões automatizadas não podem ser editadas. Use os controles de uso ou evolução da ficha.');
      const status=this.element.querySelector('[data-save-status]');if(status)status.textContent="Salvando…";
      await this.document.update({[key]:value});
      if(key.startsWith("system.resources.")&&key.endsWith(".value")){const input=el?.querySelector(`[name="${key}"]`);if(input)input.value=this.document.system.resources[key.split(".")[2]].value??"";}
      if(status?.isConnected)status.textContent="Salvo";
    }
    async _snsAction(op,data,root,button) {return dispatch(this,op,data,root,button);}
  };
  class ShinobiActorSheet extends mixin(ActorSheetV2) {
    static DEFAULT_OPTIONS={position:{width:1160,height:850}};
    _snsTab="summary";
    _snsAllocation={};
    async _snsChange(key,value,root) {
      if(!key.startsWith('allocation.'))return super._snsChange(key,value,root);
      assertOwner(this.document);
      set(this._snsAllocation,key.slice(11),value);
      if(key==='allocation.nc'){
        this._focusField=key;
        return this.render({force:true});
      }
      refreshBudget(root);
    }
    async _prepareContext(options) {const base=await super._prepareContext(options);return {...base,theme:game.settings.get(ID,"theme"),body:actorView(sourceData(this.document),this._snsTab,{profile:profile(),actors:permittedActors(),isGM:game.user.isGM,houseRules:houseRules(),allocation:this.document.type==='character'&&this.document.system.campaign.draft?allocationProposal(this.document,this._snsAllocation):null,testChoices:this._snsChoices??{}})};}
  }
  class ShinobiItemSheet extends mixin(ItemSheetV2) {
    static DEFAULT_OPTIONS={position:{width:760,height:780}};
    async _prepareContext(options) {const base=await super._prepareContext(options);return {...base,theme:game.settings.get(ID,"theme"),body:itemView(sourceData(this.document),this.document.parent?.items?.map(sourceData)??[])};}
  }
  class ShinobiPanel extends mixin(ApplicationV2) {
    static DEFAULT_OPTIONS={position:{width:780,height:730}};
    constructor(kind,config={}){if(kind==='settings'&&!game.user.isGM)throw Error('Somente o mestre pode abrir as configurações da mesa.');super({window:{title:kind==='catalog'&&(config.catalog??'weapons')==='weapons'?'Catálogo de armas':titles[kind]??kind},...(kind==='combat-hud'?{id:'sns-combat-hud',position:{width:900,height:'auto'},window:{title:titles[kind],resizable:false}}:kind==='learn'?{position:{width:530,height:340}}:kind==='weapon-use'?{position:{width:630,height:570}}:kind==='gear'||kind==='appearance'?{position:{width:570,height:450}}:{})});this.kind=kind;this._actor=config.actor??null;this.panelConfig=config;this.values=config.values??{};}
    async _prepareContext(options) {
      const base=await super._prepareContext(options);
      if(this.kind==='combat-hud'){
        const actors=hudActors();
        if(this._actor&&(!this._actor.isOwner||!actors.some(a=>a.uuid===this._actor.uuid)&&selectedHUDActor()?.uuid!==this._actor.uuid)){
          this._actor=null;
          this.clearHUDAction();
        }
        const actor=this._actor,choice=this.hudChoice;
        const targetNames=[...(game.user.targets??[])].filter(t=>t.actor).map(t=>t.name??t.actor.name);
        const current=game.combat?.combatant;
        const env={category:this.hudCategory,actionGroup:this.hudActionGroup,targetNames,
          canDelay:actor?.uuid===current?.actor?.uuid&&!!delayBounds(game.combat,current),canResume:!!waitingCombatant(game.combat,actor)};
        if(actor){
          const view=sourceData(actor);
          Object.assign(env,{items:view.items,actorView:view,portrait:safeImage(actor.img,ICONS[actor.type]),movement:derivedSummary(actor).movement,distance:selectedDistance(actor),profile:profile(),houseRules:houseRules()});
          if(choice){
            const targets=attackTargets(),marked=selectedTargets();
            const details={...choice,actor:view,attackTargets:targets,targets,selectedTargets:marked,distance:env.distance,profile:env.profile,houseRules:env.houseRules,values:this.values,hudInline:true,activeAptitudes:activeAptitudes(actor)};
            env.detail=panelView(choice.kind,details);
          }
        }
        return {...base,theme:game.settings.get(ID,'theme'),body:`<main class="sns-panel">${combatHUDView(actor,actors,env)}</main>`};
      }
      const p=profile();const env={...this.panelConfig,attackTargets:attackTargets(),selectedTargets:selectedTargets(),values:this.values,actor:this._actor?sourceData(this._actor):null,profile:p,houseRules:houseRules(),performers:game.actors.filter(a=>a.isOwner).map(a=>({uuid:a.uuid,name:a.name})),items:(this._actor?this._actor.items.contents:game.items.filter(i=>i.visible)).map(sourceData),selectedId:this.selectedId,isGM:game.user.isGM,theme:game.settings.get(ID,"theme"),reduceMotion:game.settings.get(ID,"reduceMotion")};
      if(this.panelConfig.mindControl){
        if(!canDirectMind(this._actor,game.user))throw Error('Este controle mental já terminou.');
        env.actor.items=mindCommonItems(this._actor).map(i=>({...structuredClone(i.toObject?.()??i),id:i.id}));env.items=env.actor.items;
      }
      if(this.kind==='recovery'&&this._actor){try{env.restPlan=restRecovery(this._actor);}catch(error){env.restError=error.message;}}
      if(this.kind==='allocation'&&this._actor){const p=allocationProposal(this._actor,this.values);this.values={...p,nc:p.nc};env.values=this.values;env.granted=p.granted;env.initial=p.initial;}
      if(this.kind==='weapon-use'&&this._actor)env.activeAptitudes=activeAptitudes(this._actor);
      const body=panelView(this.kind,env);
      const styled=['catalog','learn','power-catalog','power-editor','power-use','weapon-use','inventory-catalog','inventory-use','aptitude-use','condition','conditions','gear','appearance'].includes(this.kind);
      return {...base,theme:env.theme,body:styled?`<main class="sns-panel sns-scroll-window sns-window-${this.kind}">${body}</main>`:body};
    }
    async _preRender(context,options){
      if(this.kind==='combat-hud'){this._hudRendering=true;this._hudBottomGap??=70;}
      await super._preRender(context,options);
    }
    async _onRender(context,options){
      await super._onRender(context,options);
      if(this.kind==='combat-hud'&&this.element){
        try{this._anchorHUD();}
        finally{this._hudRendering=false;}
      }
    }
    _hudSizingPaused(){return this._hudRestoring||this.minimized||this.element?.classList?.contains('minimizing')||this.element?.classList?.contains('maximizing');}
    async maximize(){
      const restoreHUD=this.kind==='combat-hud'&&this.minimized;
      if(restoreHUD)this._hudRestoring=true;
      try{await super.maximize();}finally{if(restoreHUD)this._hudRestoring=false;}
      if(restoreHUD&&this.element)this._refit({width:900,height:'auto'});
    }
    _anchorHUD(){
      if(this._hudSizingPaused())return;
      const viewport=this.element.ownerDocument.documentElement;
      const height=(this.element.offsetHeight??this.element.getBoundingClientRect().height)*Number(this.position?.scale??1);
      this._hudAnchoring=true;
      try{this.setPosition({top:Math.max(0,viewport.clientHeight-height-(this._hudBottomGap??70))});}
      finally{this._hudAnchoring=false;}
    }
    _refit(positionUpdate={}){
      if(this.kind!=='combat-hud')return super._refit(positionUpdate);
      if(this._hudSizingPaused())return;
      this._hudRefitting=true;
      try{super._refit(positionUpdate);if(this.element)this._anchorHUD();}
      finally{this._hudRefitting=false;}
    }
    _onPosition(position){
      super._onPosition(position);
      // Capture a user's repositioning, never a render's temporary viewport
      // clamp. A tall detail panel must not move the collapsed strip forever.
      if(this.kind==='combat-hud'&&!this._hudRendering&&!this._hudRefitting&&!this._hudAnchoring&&!this._hudSizingPaused()&&this.element){
        const viewport=this.element.ownerDocument.documentElement;
        const height=(this.element.offsetHeight??this.element.getBoundingClientRect().height)*Number(position.scale??1);
        this._hudBottomGap=Math.max(0,viewport.clientHeight-Number(position.top)-height);
      }
    }
    _onClose(options){
      if(this.kind==='combat-hud')hudHidden=true;
      super._onClose(options);
    }
    clearHUDAction(){this.hudChoice=null;this.hudActionApp=null;this.values={};}
    async _snsChange(key,value,root) {
      if(key.startsWith('extraResource.'))return super._snsChange(key,value,root);
      if(this.kind==='combat-hud'){
        if(key==='hud.actor'){this._actor=hudActors().find(a=>a.uuid===value)??null;this.clearHUDAction();this._focusField=key;return this.render({force:true});}
        if(this.hudChoice&&/^(weapon|power|inventory|area)\./.test(key)){
          Object.assign(this.values,readFields(root));
          if(key==='weapon.itemId')this.hudChoice.itemId=value;
          if(key==='power.effect')for(const option of ['tier','mode','weaponId'])delete this.values['power.'+option];
          if(key==='power.storedPowerId')for(const option of ['Effect','Tier'])delete this.values['power.stored'+option];
          this._focusField=key;return this.render({force:true});
        }
      }
      if(this.kind==='weapon-use'){Object.assign(this.values,readFields(root));if(key==='weapon.itemId')this.panelConfig.itemId=value;if(['weapon.itemId','weapon.maneuver','weapon.mode','weapon.count','weapon.sizeSweep','weapon.octogram','weapon.twinLions','weapon.mercy'].includes(key)){this._focusField=key;await this.render({force:true});}return;}
      if(this.kind==='aptitude-use'&&key.startsWith('clone.')){Object.assign(this.values,readFields(root,'clone.'));if(key==='clone.version'){this._focusField=key;await this.render({force:true});}return;}
      if(key.startsWith('allocation.')){set(this.values,key.slice(11),value);if(key==='allocation.nc'){this._focusField=key;await this.render({force:true});return;}refreshBudget(root);}
      if(this.kind==='condition'&&key==='entry.key'){for(const [k,v]of Object.entries(readFields(root,'entry.')))set(this.values,k.slice(6),v);this.values.name=CONDITIONS[value]?.name??this.values.name;this.values.source=CONDITIONS[value]?.source??this.values.source;await this.render({force:true});}
      if(this.kind==='recovery'){for(const[k,v]of Object.entries(readFields(root,'resource.')))set(this.values,k.slice(9),v);if(key==='resource.operation')await this.render({force:true});}
      if(this.kind==='roll'){for(const[k,v]of Object.entries(readFields(root,'roll.')))set(this.values,k.slice(5),v);if(key==='roll.stat'&&this.values.conditionId){this.values.difficulty=value==='medicina'?16:18;this.values.reaction=value==='vig';await this.render({force:true});}}
      if(['power-editor','power-use','inventory-use','inventory-catalog','weapon-resolution'].includes(this.kind)){
        Object.assign(this.values,readFields(root));
        if(key==='power.effect'){delete this.values['power.tier'];delete this.values['power.mode'];delete this.values['power.weaponId'];}
        if(key==='power.storedPowerId'){delete this.values['power.storedEffect'];delete this.values['power.storedTier'];}
        if(key.startsWith('power.choice.')||['power.level','power.effect','power.tier','power.mode','power.storedPowerId','area.previewRegion','inventory.mode','resolve.targetUuid','resolve.defense'].includes(key)){this._focusField=key;await this.render({force:true});}
      }
    }
  }
  let combatHUD,hudHidden=false;
  const hud={
    open(config={}){
      hudHidden=false;
      if(!combatHUD)combatHUD=new ShinobiPanel('combat-hud',{actor:config.actor??selectedHUDActor()});
      else if(config.actor||!combatHUD.rendered){
        const actor=config.actor??selectedHUDActor();
        if(actor?.uuid!==combatHUD._actor?.uuid)combatHUD.clearHUDAction();
        combatHUD._actor=actor;
      }
      return combatHUD.render({force:true});
    },
    activate(){
      if(hudHidden)return;
      return combatHUD?.rendered?this.follow():this.open();
    },
    toggle(){return combatHUD?.rendered?combatHUD.close():this.open();},
    refresh(){if(combatHUD?.rendered)return combatHUD.render({force:false});},
    refreshTargets(){if(combatHUD?.rendered){
      for(const key of Object.keys(combatHUD.values))if(/^weapon\.target|^power\.targetUuid$/.test(key))delete combatHUD.values[key];
      return this.refresh();
    }},
    follow(){if(combatHUD?.rendered){
      const actor=selectedHUDActor();
      if(actor?.uuid!==combatHUD._actor?.uuid)combatHUD.clearHUDAction();
      combatHUD._actor=actor;return this.refresh();
    }}
  };
  function show(kind,config={}) {if(['settings','house'].includes(kind)){assertGM();return game.settings.sheet.render({force:true});}return kind==='combat-hud'?hud.open(config):new ShinobiPanel(kind,config).render({force:true});}
  async function dispatch(app,op,data,root,button) {
    const doc=app.document;const actor=app._actor??asActor(doc);
    if(op==='hud-sheet'){assertOwner(actor);return actor.sheet.render({force:true});}
    if(app.kind==='combat-hud'){
      assertOwner(actor);
      if(op==='hud-resume-initiative'){
        const combat=game.combat,current=waitingCombatant(combat,actor);
        if(!current)throw Error('O personagem não está aguardando.');
        await requestAction({op:'resume-initiative',combatId:combat.id,combatantId:current.id,round:combat.round});
        return app.render({force:true});
      }
      if(op==='hud-delay'){
        const combat=game.combat,current=combat?.combatant,bounds=delayBounds(combat,current);
        if(current?.actor?.uuid!==actor.uuid||!bounds)throw Error('Atrasar só está disponível no seu turno.');
        const value=await foundry.applications.api.DialogV2.prompt({
          window:{title:'Atrasar iniciativa'},
          content:`<label>Iniciativa nesta rodada <input name="initiative" type="number" required step="1" min="${bounds.min}" max="${bounds.max}" value="${bounds.max}"></label><label><input name="waiting" type="checkbox"> Esperar e escolher quando retomar</label>`,
          ok:{label:'Atrasar',callback:(_event,button)=>({waiting:button.form.elements.waiting.checked,value:button.form.elements.initiative.valueAsNumber})}
        });
        if(value!=null)await requestAction({op:'delay-initiative',combatId:combat.id,combatantId:current.id,round:combat.round,...value});
        return app.render({force:true});
      }
      if(op==='hud-feint'){
        const targets=selectedTargets();
        if(targets.length!==1||targets[0]===actor.uuid)throw Error('Marque um único inimigo no mapa para fintar.');
        await requestAction({op:'feint',actorUuid:actor.uuid,targetUuid:targets[0],accelerated:data.accelerated==='true'});
        return app.render({force:true});
      }
      if(op==='hud-weapon-ready'){
        await setWeaponReady(actor,data.id,data.equipped==='true');
        return app.render({force:true});
      }
      if(op==='hud-group'){
        app.hudActionGroup=data.group;
        app.clearHUDAction();
        return app.render({force:true});
      }
      if(op==='hud-category'){
        app.hudCategory=app.hudCategory===data.kind?null:data.kind;
        return app.render({force:true});
      }
      if(op==='hud-collapse'){app.clearHUDAction();return app.render({force:true});}
      if(op==='hud-select'||op==='action-use'){
        const preset=op==='action-use'?savedActions(actor).find(entry=>entry.id===data.id):null;
        if(op==='action-use'&&!preset)throw Error('Ação salva não encontrada.');
        const kind=preset?'weapon-use':data.kind,itemId=preset?.source.itemId??data.id;
        if(!['weapon-use','power-use','inventory-use'].includes(kind))throw Error('Ação indisponível.');
        app.clearHUDAction();
        app.hudChoice={kind,itemId,openedEffect:data.effect,options:preset?.defaults,hudInline:true};
        app.values=data.effect?{'power.effect':data.effect,...(data.tier?{'power.tier':Number(data.tier)}:{})}:{};
        if(kind==='inventory-use'&&data.mode)app.values['inventory.mode']=data.mode;
        if(kind==='power-use'&&data.mode)app.values['power.mode']=data.mode;
        if(kind==='power-use'&&data.level)app.values['power.level']=Number(data.level);
        if(kind==='power-use'&&data.prepared){app.values['power.shadowPreparedId']=data.prepared;app.values['power.level']=Number(data.level);}
        if(kind==='power-use'&&data.guided){app.values['power.shadowGuidedId']=data.guided;app.values['power.level']=Number(data.level);}
        return app.render({force:true});
      }
      if(app.hudChoice){
        const inline=app.hudActionApp??={panelConfig:app.hudChoice,values:app.values,render:options=>app.render(options),close:()=>{app.clearHUDAction();return app.render({force:true});}};
        if(op==='weapon-roll')return catalogAction(inline,op,data,root,{actor,show});
        if(POWER_ACTIONS.has(op)&&!['power-edit','power-catalog','power-use','power-area','power-resolve'].includes(op))return powerAction(inline,op,data,root,{actor,show});
        if(INVENTORY_ACTIONS.has(op)&&!['inventory-use','inventory-catalog'].includes(op))return inventoryAction(inline,op,data,root,{actor,show});
      }
    }
    if(op==='partner-plan')return requestAction({op:'partner-plan',actorUuid:actor.uuid,divisor:Number(readFields(root,'partner.')['partner.divisor'])});
    if(op==='companion-sheet'){
      const animal=await fromUuid(data.uuid);
      if(!animal?.isOwner||animal.getFlag(ID,'companion')?.origin!==actor.uuid)throw Error('Companheiro não disponível para este personagem.');
      return animal.sheet.render({force:true});
    }
    if(CAPABILITY_ACTIONS.has(op)){
      assertOwner(actor);
      if(op==='capability-origins')return show('catalog',{actor,catalog:'restricted',editOrigins:true});
      const values=readFields(root),command={op:'capability',actorUuid:actor.uuid};
      if(op==='capability-save-origins'){
        if(!actor.system.campaign?.draft&&!game.user.isGM)throw Error('Somente o mestre altera origens após a criação.');
        command.operation='origins';command.origins=Object.entries(values).filter(([k,v])=>k.startsWith('origin.')&&v).map(([k])=>k.slice(7));command.variants={uzumaki:values['originOption.uzumaki']};
        if([...actor.items].some(i=>i.type==='aptitude'&&i.system.capabilityData?.definitionId)&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Conferir mudança de origens'},content:'<p>A alteração pode tornar aptidões adquiridas indisponíveis. Compras, concessões, reservas e dados serão preservados. Confirme a mudança após conferir as novas origens.</p>'}))return;
      }else{
        command.itemId=data.id;command.operation=op.slice(11);command.reason=values['capability.reason'];
        if(command.operation==='companion-create'){command.slot=data.slot;command.name=values['capability.companion.name'];}
        if(command.operation==='companion-promote')command.animalUuid=data.uuid;
        if(command.operation.startsWith('companion-training-')){
          if(!game.user.isGM)throw Error('O mestre registra o treinamento do companheiro.');
          command.slot=data.slot;command.animalUuid=data.uuid;command.trainingId=data.training;
          command.name=values['capability.companion.name'];
          if(command.operation==='companion-training-finish'){
            command.uninterrupted=await foundry.applications.api.DialogV2.confirm({window:{title:'Concluir treinamento do companheiro'},
              content:'<p>Confirme que o personagem dedicou-se integralmente ao treinamento, sem interrupção, durante todo o prazo registrado. O relógio sozinho não comprova essa dedicação. A ficha do animal anterior será preservada no histórico.</p>'});
            if(!command.uninterrupted)return;
          }
        }
        if(command.operation.startsWith('calorie-')){
          command.level=Number(values['capability.calorie.level']);
          command.pill=values['capability.calorie.pill']==='yes';
          command.diet=values['capability.calorie.diet']===true;
          command.outcome=values['capability.calorie.outcome'];
        }
        if(op==='capability-grant'){command.benefitKey=data.benefit;command.selection=data.selection??'';}
        if(command.operation==='kagura-genjutsu')command.difficulty=values['capability.kagura.difficulty'];
        if(command.operation==='kida-loss')command.partnerId=data.partner;
        if(command.operation==='rinka-transfer'){
          command.amount=values['capability.insects.amount'];
          command.targetUuid=values['capability.rinka.target'];
          command.contact=values['capability.rinka.contact'];
        }
        if(command.operation==='rinka-treat')command.sourceUuid=data.source;
        if(command.operation.startsWith('mimic-')){
          command.name=values['capability.mimic.name'];
          command.reference=values['capability.mimic.reference'];
          command.copyId=data.copy;
        }
        if(command.operation==='hypnosis'){
          command.mode=values['capability.hypnosis.mode'];
          command.target=values['capability.hypnosis.target'];
        }
        if(command.operation.startsWith('vision-')){
          command.pair=values['capability.vision.pair'];
          command.amount=values['capability.vision.amount'];
          command.technique=values['capability.vision.technique'];
        }
        if(command.operation.startsWith('insects-')||command.operation.startsWith('shoka-'))command.amount=values['capability.insects.amount'];
        if(op==='capability-link'){command.resourceKey=data.resourceKey;command.resourceId=values['capability.resource.'+data.resourceKey];}
      }
      const {requestAction}=await import('./action-executions.mjs');await requestAction(command);return app.render({force:true});
    }
    if(['settings','house','native-settings'].includes(op)){assertGM();return game.settings.sheet.render({force:true});}
    if(SAVED_ACTIONS.has(op))return savedActionEvent(app,op,data,root,{actor,show});
    if(WEAPON_RESOLUTION_ACTIONS.has(op))return weaponResolutionAction(app,op,data,root,{actor,show});
    if(POWER_ACTIONS.has(op))return powerAction(app,op,data,root,{actor,show});
    if(INVENTORY_ACTIONS.has(op))return inventoryAction(app,op,data,root,{actor,show});
    if(PHYSICAL_ACTIONS.has(op))return physicalAction(app,op,data,root,{actor,show});
    if(CLONE_ACTIONS.has(op))return cloneAction(app,op,data,root,{actor,show});
    if(TECHNIQUE_ACTIONS.has(op))return techniqueAction(app,op,data,root,{actor,show});
    if(APTITUDE_USE_ACTIONS.has(op))return aptitudeUseAction(app,op,data,root,{actor,show});
    if(CATALOG_ACTIONS.has(op))return catalogAction(app,op,data,root,{actor,show});
    if(BUILD_ACTIONS.has(op))return buildAction(app,op,data,root,{actor});
    if(SUMMARY_ACTIONS.has(op))return automationAction(app,op,data,root,{actor,show});
    if(doc&&mutating.has(op))assertOwner(doc);
    if(actor&&mutating.has(op))assertOwner(actor);
    if(gmOnly.has(op))assertGM();
    if(op==="tab") {if(data.tab==='gm')assertGM();app._snsTab=data.tab;app._focusTab=data.tab;await app.render({force:true});return;}
    if(op==="close")return app.close();
    if(op==="theme") {await game.settings.set(ID,"theme",game.settings.get(ID,"theme")==="dark"?"light":"dark");return app.render({force:true});}
    if(op==="settings"||op==="sources"||op==="library"||op==="resources"||op==="conditions")return show(op,{actor});
    if(op==="panel")return show(data.panel,{actor});
    if(op==="preview-item"){app.selectedId=data.id;return app.render({force:true});}
    if(op==="edit-item") {const item=actor?.items.get(data.id)??game.items.get(data.id);if(item?.visible){if(isAutomatedAptitude(item)&&actor)return show('aptitude-use',{actor,itemId:item.id});return item.sheet.render({force:true});}return;}
    if(op==="favorite-item") {const item=actor?.items.get(data.id)??game.items.get(data.id);if(!item)return;assertOwner(item);await item.update({'system.favorite':!item.system.favorite});return app.render({force:true});}
    if(op==="remove-item") {
      const item=actor?.items.get(data.id)??game.items.get(data.id);if(!item)return;assertOwner(item);
      if(await foundry.applications.api.DialogV2.confirm({window:{title:"Remover item"},content:`<p>Remover ${esc(item.name)}? Esta ação remove o registro desta lista.</p>`})) {await item.delete();await app.render({force:true});}return;
    }
    if(op==="new-item"||op==="new-world-item") {
      const type=ITEM_TYPES[data.kind]?data.kind:'technique';const itemData={name:`Novo ${ITEM_TYPES[type].toLocaleLowerCase('pt-BR')}`,type,img:ICONS[type]};
      let item;
      if(op==="new-item") {if(!actor)throw Error("Abra o cadastro a partir de uma ficha para salvar o registro nela.");assertOwner(actor);[item]=await actor.createEmbeddedDocuments("Item",[itemData]);}
      else {if(actor)throw Error("Use a biblioteca do diretório de Itens para criar modelos compartilhados.");item=await Item.create(itemData);}
      if(item)item.sheet.render({force:true});await app.render({force:true});return;
    }
    if(op==='edit-token-art') {
      assertOwner(actor);
      const tokenizer2=game.modules.get('tokenizer-2');
      const tokenizer=game.modules.get('vtta-tokenizer');
      if(tokenizer2?.active&&typeof tokenizer2.api?.openEditor==='function')return tokenizer2.api.openEditor(actor);
      if(tokenizer?.active&&typeof tokenizer.api?.tokenizeActor==='function')return tokenizer.api.tokenizeActor(actor);
      const target=actor.isToken?actor.token:actor;
      const key=actor.isToken?'texture.src':'prototypeToken.texture.src';
      const current=actor.isToken?target?.texture?.src:actor.prototypeToken?.texture?.src;
      if(!target)throw Error('Token indisponível.');
      const picker=new foundry.applications.apps.FilePicker.implementation({type:'image',current,callback:async path=>{
        try{assertOwner(target);await target.update({[key]:path});}
        catch(error){ui.notifications.error(error.message);}
      }});
      return picker.render({force:true});
    }
    if(op==="portrait") {
      assertOwner(doc);
      if(isAutomatedAptitude(doc))throw Error('O ícone de uma aptidão automatizada faz parte do registro do livro.');
      const picker=new foundry.applications.apps.FilePicker.implementation({type:"image",current:doc.img,callback:async path=>{try {assertOwner(doc);await doc.update({img:path});}catch(e){ui.notifications.error(e.message);}}});
      return picker.render({force:true});
    }
    if(["test","declare","defense","result"].includes(op)) {
      const values={};if(doc?.type==="technique"&&op==="declare")Object.assign(values,{title:doc.name,level:doc.system.usedLevel,action:doc.system.action,cost:doc.system.cost,notes:`${doc.system.source.book} ${doc.system.source.page}`});
      return show(op,{actor,label:data.label,values});
    }
    if(op==="post-record") {
      const fields=readFields(root,"record.");const record=Object.fromEntries(Object.entries(fields).map(([key,value])=>[key.slice(7),value]));
      if(!record.title?.trim())throw Error("Informe o título do registro.");
      const labels={dice:"Dados informados",precision:"Precisão informada",total:"Total informado",difficulty:"Dificuldade",level:"Nível usado",targets:"Alvos",action:"Ação",cost:"Custo anotado",defense:"Defesa",base:"Dano base",hardness:"Dureza",degree:"Grau",absorption:"Absorção",vitality:"Alteração anotada de vitalidade",effects:"Outros efeitos"};
      const rows=Object.entries(record).filter(([key,value])=>labels[key]&&String(value??"").trim()).map(([key,value])=>`<dt>${esc(labels[key])}</dt><dd>${esc(value)}</dd>`).join('');
      const tag={test:"Teste anotado",declare:"Declarado",defense:"Defesa anotada",result:"Resultado anotado"}[app.kind];
      const content=`<div class="sns-app"><article class="sns-record"><header><strong>${esc(record.title)}</strong><span class="sns-badge">${tag}</span></header>${actor?`<small>${esc(actor.name)}</small>`:''}<dl>${rows}</dl><p>${esc(record.notes)}</p><footer>Registro manual · nenhum dado rolado, recurso gasto ou dano aplicado pelo sistema.</footer></article></div>`;
      const whisper=record.visibility==='self'?[game.user.id]:record.visibility==='gm'?ChatMessage.getWhisperRecipients("GM").map(u=>u.id):[];
      if(record.visibility==='gm'&&!whisper.length)throw Error("Nenhum mestre disponível para receber o registro privado.");
      await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content,whisper,flags:{[ID]:{kind:app.kind,manual:true,record}}});
      await app.close();return;
    }
    if(["condition","special","bond"].includes(op)) {
      if(!actor)throw Error("Abra esta janela a partir de uma ficha.");assertOwner(actor);
      if(op==='special')return show('special',{actor,values:data.id?extraResources.get(actor,data.id):{}});
      const key={condition:"conditions",special:"special",bond:"bonds"}[op];const values=(op==='condition'?conditionRecords(actor):actor.system[key]).find(v=>v.id===data.id);
      return show(op,{actor,values:values?deepCopy(values):data.key?{key:data.key,name:CONDITIONS[data.key]?.name,source:CONDITIONS[data.key]?.source}:{}});
    }
    if(op==="save-entry"||op==="delete-entry") {
      const values={...app.values,...Object.fromEntries(Object.entries(readFields(root,"entry.")).map(([key,value])=>[key.slice(6),value]))};
      if(app.kind==='special'){
        if(op==='delete-entry'){if(!await foundry.applications.api.DialogV2.confirm({window:{title:'Remover recurso'},content:'<p>Remover apenas esta reserva manual? A origem e as anotações de outros recursos serão preservadas.</p>'}))return;await extraResources.remove(actor,values.id);}
        else await extraResources.save(actor,resourceEditorData(values));
        await app.close();for(const open of ApplicationV2.instances?.()??[])if(open!==app&&open.rendered&&open.classList?.contains('sns-app'))await open.render({force:true});return;
      }
      if(app.kind==='condition') {if(!actor)throw Error('Ficha não encontrada.');await saveCondition(actor,values,{remove:op==='delete-entry'});await app.close();for(const open of ApplicationV2.instances?.()??[])if(open!==app&&open.rendered&&open.classList?.contains('sns-app'))await open.render({force:true});return;}
      if(op==="save-entry"&&!values.name?.trim())throw Error("Informe um nome para o registro.");
      if(app.kind==='decision') {assertGM();const p=profile();p.decisions.push({id:foundry.utils.randomID(),...values});await saveWorldProfile(p);}
      else {
        if(!actor)throw Error("Ficha não encontrada.");assertOwner(actor);
        const key={condition:"conditions",special:"special",bond:"bonds"}[app.kind];if(!key)throw Error("Tipo de registro desconhecido.");
        const list=deepCopy(actor.system[key]);const index=list.findIndex(v=>v.id===values.id);
        if(op==="delete-entry") {if(index>=0)list.splice(index,1);}else if(index>=0)list[index]=values;else list.push({...values,id:foundry.utils.randomID()});
        await actor.update({[`system.${key}`]:list});
      }
      await app.close();
      for(const open of ApplicationV2.instances?.()??[])if(open!==app&&open.rendered&&open.classList?.contains('sns-app'))await open.render({force:true});
      return;
    }
    if(op==="decision")return show('decision');
    if(op==="review-profile") {
      assertGM();const proposed=profile();const fields=readFields(root,"profile.");
      for(const [key,value] of Object.entries(fields))if(!key.startsWith('profile.books.'))set(proposed,key.slice(8),value);
      proposed.books=Object.entries(fields).filter(([key,value])=>key.startsWith('profile.books.')&&value).map(([key])=>key.slice(14));
      const items=[...game.items.contents,...game.actors.contents.flatMap(a=>a.items.contents)];const issues=items.filter(i=>i.system.source?.book!=='mesa'&&!proposed.books.includes(i.system.source?.book)).map(i=>`${i.parent?.name?i.parent.name+' · ':''}${i.name}: fonte desabilitada no novo perfil.`);
      return show('impact',{proposed,issues,actorCount:game.actors.size});
    }
    if(op==="apply-profile") {assertGM();await saveWorldProfile(app.panelConfig.proposed);ui.notifications.info("Regras do mundo salvas. As fichas seguem o novo perfil; compras preservadas.");await app.close();return;}
    if(op==="save-preferences") {const fields=readFields(root,"preference.");await game.settings.set(ID,"theme",fields['preference.theme']);await game.settings.set(ID,"reduceMotion",fields['preference.reduceMotion']);await app.render({force:true});return;}
  }
  return {ShinobiActorSheet,ShinobiItemSheet,ShinobiPanel,show,hud};
}
