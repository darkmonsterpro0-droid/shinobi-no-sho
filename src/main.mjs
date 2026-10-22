import {createActorClass,syncAutomaticStatuses,processConditionPhase,conditionRecords,saveCondition} from './automation.mjs';
import {announceTurn,checkCamouflage} from './summary-actions.mjs';
import {CONDITIONS} from './conditions.mjs';
import {progression} from './progression.mjs';
import {ID,VERSION,ACTOR_TYPES,ITEM_TYPES,ICONS,defaultProfile} from "./config.mjs";
import {createModels} from "./models.mjs";
import {createApplications} from "./apps.mjs";

Hooks.once("init",()=>{
  CONFIG.Actor.documentClass=createActorClass(CONFIG.Actor.documentClass);
  CONFIG.statusEffects=Object.values(CONDITIONS).map(c=>({id:'sns-'+c.key,name:c.name,img:c.icon}));
  CONFIG.specialStatusEffects.DEFEATED='sns-morto';CONFIG.specialStatusEffects.BLIND='sns-cego';
  CONFIG.Combat.initiative={formula:'1d8 + @sns.initiative',decimals:0};
  const {ShinobiActorModel,ShinobiItemModel}=createModels();
  for(const type of Object.keys(ACTOR_TYPES))CONFIG.Actor.dataModels[type]=ShinobiActorModel;
  for(const type of Object.keys(ITEM_TYPES))CONFIG.Item.dataModels[type]=ShinobiItemModel;
  game.settings.register(ID,"houseRules",{scope:"world",config:false,type:Object,default:{advancement:"level"},onChange:refreshSheets});
  game.settings.register(ID,"profile",{scope:"world",config:false,type:Object,default:defaultProfile(),onChange:refreshSheets});
  game.settings.register(ID,"theme",{name:"Tema das fichas Shinobi",hint:"Preferência pessoal de aparência.",scope:"client",config:true,type:String,choices:{light:"Marfim",dark:"Grafite"},default:"light",onChange:refreshSheets});
  game.settings.register(ID,"reduceMotion",{name:"Reduzir movimento na interface Shinobi",scope:"client",config:true,type:Boolean,default:false,onChange:refreshSheets});
  const apps=createApplications();
  const sheets=foundry.applications.apps.DocumentSheetConfig;
  sheets.registerSheet(CONFIG.Actor.documentClass,ID,apps.ShinobiActorSheet,{types:Object.keys(ACTOR_TYPES),makeDefault:true,label:"Shinobi no Sho"});
  sheets.registerSheet(Item,ID,apps.ShinobiItemSheet,{types:Object.keys(ITEM_TYPES),makeDefault:true,label:"Shinobi no Sho"});
  game.settings.registerMenu(ID,"rulesMenu",{name:"Regras da mesa",label:"Abrir regras da mesa",hint:"Livros, variantes, decisões e regras da casa.",icon:"fas fa-scroll",type:class extends apps.ShinobiPanel{constructor(options){super("settings",options);}},restricted:true});
  game.shinobi={version:VERSION,applications:apps,open:(kind,config)=>apps.show(kind,config),createCharacter:()=>apps.show("create")};
});
function refreshSheets(){for(const app of foundry.applications.api.ApplicationV2.instances())if(app.classList?.contains("sns-app")&&app.rendered)app.render({force:true});}
function directoryButton(html,kind,label,icon) {
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector(`[data-sns-directory="${kind}"]`))return;
  const header=root.querySelector('.directory-header')??root;
  const button=document.createElement('button');button.type="button";button.dataset.snsDirectory=kind;button.innerHTML=`<i class="fas fa-${icon}" aria-hidden="true"></i> ${label}`;
  button.addEventListener('click',()=>game.shinobi.open(kind));header.append(button);
}
Hooks.on("renderActorDirectory",(app,html)=>{if(game.user.can("ACTOR_CREATE"))directoryButton(html,"create","Criar personagem Shinobi","feather-pointed");});
Hooks.on("renderItemDirectory",(app,html)=>directoryButton(html,"library","Biblioteca Shinobi","book-open"));
Hooks.once("ready",()=>{console.info(`${ID} | ${VERSION} | Resumo, progressão e condições do Básico ativos. Técnicas e compras permanecem manuais.`);});
Hooks.on('preCreateActor',(document,data)=>{if(data.type==='character'&&!data.system?.campaign?.level)document.updateSource({'system.campaign.level':4});if(game.system.id===ID&&ICONS[data.type]&&(!data.img||data.img==='icons/svg/mystery-man.svg'))document.updateSource({img:ICONS[data.type]});});
Hooks.on('createActor',(actor,options,userId)=>{if(game.user.id===userId&&actor.type==='character'&&actor.system.campaign.draft&&!options.snsSkipAllocation)game.shinobi.open('allocation',{actor,newActor:true});});
Hooks.on("preCreateItem",(document,data)=>{if(game.system.id===ID&&ICONS[data.type]&&(!data.img||data.img==='icons/svg/item-bag.svg'))document.updateSource({img:ICONS[data.type]});});

function isAuthority(){return game.user.isGM&&game.users.filter(u=>u.isGM&&u.active).sort((a,b)=>a.id.localeCompare(b.id))[0]?.id===game.user.id;}
function report(error){console.error(ID,error);ui.notifications.error(error.message??String(error));}
Hooks.on('updateActor',(actor,data,options,userId)=>{
  if(isAuthority())syncAutomaticStatuses(actor).catch(report);
  if(options.snsOpenAllocation&&game.user.id===userId&&actor.isOwner)game.shinobi.open('allocation',{actor});
});
for(const hook of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(hook,effect=>{const actor=effect.actor??effect.parent;if(isAuthority()&&actor?.constructor.documentName==='Actor')syncAutomaticStatuses(actor).catch(report);});
Hooks.once('ready',()=>{
  if(!isAuthority())return;
  for(const actor of game.actors)syncAutomaticStatuses(actor).catch(report);
  const p=game.settings.get(ID,'profile'),decisions=[...p.decisions];
  for(const d of [{id:'confuso-reacoes',name:'Confuso: resultado 5–6',description:'Não realiza ações, mas mantém as reações de defesa.'},{id:'sangrando-vigor-turno',name:'Sangrando: tentativa de Vigor',description:'Uma tentativa de Vigor 18 por turno, como reação. Medicina 16 exige ação padrão por tentativa.'}])if(!decisions.some(r=>r.id===d.id))decisions.push({...d,source:'Decisão do usuário em 21/10/2026',status:'Definido'});
  if(decisions.length!==p.decisions.length)game.settings.set(ID,'profile',{...p,decisions}).catch(report);
});
Hooks.on('updateCombat',(combat,changed)=>{
  if(!isAuthority()||!combat.started||(!Object.hasOwn(changed,'turn')&&!Object.hasOwn(changed,'round')))return;
  const previous=combat.previous,current=combat.current;
  if(previous&&(current.round<previous.round||current.round===previous.round&&current.turn<=previous.turn))return;
  (async()=>{
    if(previous?.round>0&&previous.turn!==null){const before=combat.turns.find(c=>c.tokenId===previous.tokenId)??combat.turns[previous.turn];if(before?.actor)await announceTurn(before.actor,await processConditionPhase(before.actor,combat.id+':'+previous.round+':'+previous.turn+':end','end'));}
    const actor=combat.combatant?.actor;if(!actor)return;const key=combat.id+':'+combat.round+':'+combat.turn+':start';
    await actor.update({['flags.'+ID+'.currentTurnKey']:key});await announceTurn(actor,await processConditionPhase(actor,key,'start'));
  })().catch(report);
});
Hooks.on('renderChatMessageHTML',(message,html)=>{
  const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
  for(const button of root.querySelectorAll('[data-sns-camouflage]'))button.addEventListener('click',async()=>{button.disabled=true;try{if(message.getFlag(ID,'camouflageResolved'))throw Error('Camuflagem já resolvida.');const actor=await fromUuid(button.dataset.actorUuid);if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode resolver.');await message.setFlag(ID,'camouflageResolved',true);await checkCamouflage(actor);}catch(error){report(error);}finally{button.disabled=false;}});
  for(const button of root.querySelectorAll('[data-sns-resist]'))button.addEventListener('click',async()=>{button.disabled=true;try{const actor=await fromUuid(button.dataset.actorUuid);if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode resolver esta resistência.');const app=new game.shinobi.applications.ShinobiPanel('conditions',{actor});await app._snsAction('resist-condition',{id:button.dataset.snsResist},root);}catch(error){report(error);}finally{button.disabled=false;}});
});
