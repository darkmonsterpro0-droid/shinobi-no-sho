import {SUMMARY_ACTIONS,automationAction,refreshBudget} from './summary-actions.mjs';
import {allocationProposal,houseRules,getActorView,conditionRecords,saveCondition,creationSystem,statPrecision,restRecovery} from './automation.mjs';
import {CONDITIONS} from './conditions.mjs';
import {progression,validateAllocation} from './progression.mjs';
import {ID,ICONS,ITEM_TYPES,defaultProfile} from "./config.mjs";
import {actorView,itemView,panelView,esc,set} from "./ui.mjs";
import {bindSurface,readFields} from "./interactions.mjs";

const deepCopy=value=>foundry.utils.deepClone(value);
const profile=()=>deepCopy(game.settings.get(ID,"profile"));
const own=doc=>!!doc?.isOwner;
const permittedActors=()=>game.actors.filter(a=>a.visible).map(a=>({uuid:a.uuid,name:a.name}));
const asActor=doc=>(doc?.constructor?.documentName==="Actor"||doc?.documentName==="Actor")?doc:doc?.actor??((doc?.parent?.constructor?.documentName==="Actor"||doc?.parent?.documentName==="Actor")?doc.parent:null);
const titles={library:"Biblioteca",settings:"Regras da mesa",sources:"Fontes e decisões",resources:"Recursos e vínculos",conditions:"Condições",condition:"Condição",special:"Recurso específico",bond:"Vínculo específico",test:"Registrar teste",declare:"Declarar técnica",defense:"Escolher defesa",result:"Conferir resultado",create:"Criar personagem",impact:"Revisar perfil",allocation:"Atributos e evolução",house:"Regras da casa",xp:"Conceder EXP",roll:"Teste do resumo",recovery:"Recuperação e chakra",appearance:"Aparência e acessibilidade",decision:"Decisão da mesa"};
const mutating=new Set(["new-item","remove-item","favorite-item","condition","special","bond","save-entry","delete-entry","portrait"]);
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
      if(this.document&&!own(this.document)) {
        for(const el of root.querySelectorAll('[name]'))el.disabled=true;
        for(const b of root.querySelectorAll('[data-sns]'))if(mutating.has(b.dataset.sns))b.disabled=true;
      }
      if(this.kind==='settings'&&!game.user.isGM){for(const el of root.querySelectorAll('[name], [data-sns="review-profile"]'))el.disabled=true;}
      if(this.kind==='house'&&!game.user.isGM)for(const el of root.querySelectorAll('[name]'))el.disabled=true;
      if(this.kind==='allocation'&&!game.user.isGM&&!this.values.initial)root.querySelector('[name="allocation.nc"]')?.setAttribute('disabled','');
      if(this._focusField){const field=root.querySelector(`[name="${this._focusField}"]`);field?.focus();this._focusField=null;}
      if(this._focusTab){root.querySelector(`[data-tab="${this._focusTab}"]`)?.focus();this._focusTab=null;}
    }
    async _preClose(options) {this._unbindSNS?.();return super._preClose(options);}
    async _snsChange(key,value,el) {
      if(!this.document)return;
      if(!(key==='name'||key.startsWith('system.')))return;
      assertOwner(this.document);
      const status=this.element.querySelector('[data-save-status]');if(status)status.textContent="Salvando…";
      await this.document.update({[key]:value});
      if(key.startsWith("system.resources.")&&key.endsWith(".value")){const input=el?.querySelector(`[name="${key}"]`);if(input)input.value=this.document.system.resources[key.split(".")[2]].value??"";}
      if(status?.isConnected)status.textContent="Salvo";
    }
    async _snsAction(op,data,root,button) {return dispatch(this,op,data,root,button);}
  };
  class ShinobiActorSheet extends mixin(ActorSheetV2) {
    _snsTab="summary";
    async _prepareContext(options) {const base=await super._prepareContext(options);return {...base,theme:game.settings.get(ID,"theme"),body:actorView(sourceData(this.document),this._snsTab,{profile:profile(),actors:permittedActors(),isGM:game.user.isGM,houseRules:houseRules()})};}
  }
  class ShinobiItemSheet extends mixin(ItemSheetV2) {
    static DEFAULT_OPTIONS={position:{width:760,height:780}};
    async _prepareContext(options) {const base=await super._prepareContext(options);return {...base,theme:game.settings.get(ID,"theme"),body:itemView(sourceData(this.document))};}
  }
  class ShinobiPanel extends mixin(ApplicationV2) {
    static DEFAULT_OPTIONS={position:{width:780,height:730}};
    constructor(kind,config={}){if(kind==='settings'&&!game.user.isGM)throw Error('Somente o mestre pode abrir as configurações da mesa.');super({window:{title:titles[kind]??kind},...(kind==='create'?{position:{width:730,height:650}}:{})});this.kind=kind;this._actor=config.actor??null;this.panelConfig=config;this.values=config.values??{};this.step=0;this.draft=config.draft??{name:"Novo personagem",system:{}};}
    async _prepareContext(options) {
      const base=await super._prepareContext(options);
      const p=profile();const env={...this.panelConfig,values:this.kind==='create'?this.draft:this.values,step:this.step,actor:this._actor?sourceData(this._actor):null,profile:p,houseRules:houseRules(),performers:game.actors.filter(a=>a.isOwner).map(a=>({uuid:a.uuid,name:a.name})),items:(this._actor?this._actor.items.contents:game.items.filter(i=>i.visible)).map(sourceData),selectedId:this.selectedId,isGM:game.user.isGM,theme:game.settings.get(ID,"theme"),reduceMotion:game.settings.get(ID,"reduceMotion")};
      if(this.kind==='recovery'&&this._actor){try{env.restPlan=restRecovery(this._actor);}catch(error){env.restError=error.message;}}
      if(this.kind==='allocation'&&this._actor){const p=allocationProposal(this._actor,this.values);this.values={...p,nc:p.nc};env.values=this.values;env.granted=p.granted;env.initial=p.initial;}
      return {...base,theme:env.theme,body:panelView(this.kind,env)};
    }
    async _snsChange(key,value,root) {
      if(key.startsWith('draft.')){set(this.draft,key.slice(6),value);if(key==='draft.system.campaign.level'){await this.render({force:true});return;}refreshBudget(root);}
      if(key.startsWith('allocation.')){set(this.values,key.slice(11),value);if(key==='allocation.nc'){this._focusField=key;await this.render({force:true});return;}refreshBudget(root);}
      if(this.kind==='condition'&&key==='entry.key'){for(const [k,v]of Object.entries(readFields(root,'entry.')))set(this.values,k.slice(6),v);this.values.name=CONDITIONS[value]?.name??this.values.name;this.values.source=CONDITIONS[value]?.source??this.values.source;await this.render({force:true});}
      if(this.kind==='recovery'){for(const[k,v]of Object.entries(readFields(root,'resource.')))set(this.values,k.slice(9),v);if(key==='resource.operation')await this.render({force:true});}
      if(this.kind==='roll'){for(const[k,v]of Object.entries(readFields(root,'roll.')))set(this.values,k.slice(5),v);if(key==='roll.stat'&&this.values.conditionId){this.values.difficulty=value==='medicina'?16:18;this.values.reaction=value==='vig';await this.render({force:true});}}
    }
  }
  function show(kind,config={}) {return new ShinobiPanel(kind,config).render({force:true});}
  async function dispatch(app,op,data,root,button) {
    const doc=app.document;const actor=app._actor??asActor(doc);
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
    if(op==="edit-item") {const item=actor?.items.get(data.id)??game.items.get(data.id);if(item?.visible)return item.sheet.render({force:true});return;}
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
    if(op==="portrait") {
      assertOwner(doc);
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
      const key={condition:"conditions",special:"special",bond:"bonds"}[op];const values=(op==='condition'?conditionRecords(actor):actor.system[key]).find(v=>v.id===data.id);
      return show(op,{actor,values:values?deepCopy(values):data.key?{key:data.key,name:CONDITIONS[data.key]?.name,source:CONDITIONS[data.key]?.source}:{}});
    }
    if(op==="save-entry"||op==="delete-entry") {
      const values={...app.values,...Object.fromEntries(Object.entries(readFields(root,"entry.")).map(([key,value])=>[key.slice(6),value]))};
      if(app.kind==='condition') {if(!actor)throw Error('Ficha não encontrada.');await saveCondition(actor,values,{remove:op==='delete-entry'});await app.close();for(const open of ApplicationV2.instances?.()??[])if(open!==app&&open.rendered&&open.classList?.contains('sns-app'))await open.render({force:true});return;}
      if(op==="save-entry"&&!values.name?.trim())throw Error("Informe um nome para o registro.");
      if(app.kind==='decision') {assertGM();const p=profile();p.decisions.push({id:foundry.utils.randomID(),...values});await game.settings.set(ID,"profile",p);}
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
    if(op==="apply-profile") {assertGM();await game.settings.set(ID,"profile",app.panelConfig.proposed);ui.notifications.info("Perfil documental salvo. Fichas preservadas.");await app.close();return;}
    if(op==="save-preferences") {const fields=readFields(root,"preference.");await game.settings.set(ID,"theme",fields['preference.theme']);await game.settings.set(ID,"reduceMotion",fields['preference.reduceMotion']);await app.render({force:true});return;}
    if(op==="wizard-step") {for(const [key,value] of Object.entries(readFields(root,"draft.")))set(app.draft,key.slice(6),value);app.step=Number(data.step);return app.render({force:true});}
    if(op==="finish-wizard") {
      for(const [key,value] of Object.entries(readFields(root,"draft.")))set(app.draft,key.slice(6),value);
      if(!app.draft.name?.trim())throw Error("Informe o nome do personagem.");
      const source=data.draft==='true'?{...app.draft,system:{...app.draft.system,campaign:{...app.draft.system?.campaign,draft:true},automation:{...app.draft.system?.automation,enabled:false}}}:{...app.draft,system:creationSystem(app.draft.system)};
      const actor=await CONFIG.Actor.documentClass.create({...source,type:"character",img:ICONS.character},{snsSkipAllocation:true});if(actor)actor.sheet.render({force:true});await app.close();return;
    }
  }
  return {ShinobiActorSheet,ShinobiItemSheet,ShinobiPanel,show};
}
