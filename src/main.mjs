import {ID,VERSION,ACTOR_TYPES,ITEM_TYPES,ICONS,defaultProfile} from "./config.mjs";
import {createModels} from "./models.mjs";
import {createApplications} from "./apps.mjs";

Hooks.once("init",()=>{
  const {ShinobiActorModel,ShinobiItemModel}=createModels();
  for(const type of Object.keys(ACTOR_TYPES))CONFIG.Actor.dataModels[type]=ShinobiActorModel;
  for(const type of Object.keys(ITEM_TYPES))CONFIG.Item.dataModels[type]=ShinobiItemModel;
  game.settings.register(ID,"profile",{scope:"world",config:false,type:Object,default:defaultProfile(),onChange:refreshSheets});
  game.settings.register(ID,"theme",{name:"Tema das fichas Shinobi",hint:"Preferência pessoal de aparência.",scope:"client",config:true,type:String,choices:{light:"Marfim",dark:"Grafite"},default:"light",onChange:refreshSheets});
  game.settings.register(ID,"reduceMotion",{name:"Reduzir movimento na interface Shinobi",scope:"client",config:true,type:Boolean,default:false,onChange:refreshSheets});
  const apps=createApplications();
  const sheets=foundry.applications.apps.DocumentSheetConfig;
  sheets.registerSheet(Actor,ID,apps.ShinobiActorSheet,{types:Object.keys(ACTOR_TYPES),makeDefault:true,label:"Shinobi no Sho"});
  sheets.registerSheet(Item,ID,apps.ShinobiItemSheet,{types:Object.keys(ITEM_TYPES),makeDefault:true,label:"Shinobi no Sho"});
  game.settings.registerMenu(ID,"rulesMenu",{name:"Regras da mesa",label:"Abrir regras da mesa",hint:"Livros, variantes e decisões. Sem automação de regras.",icon:"fas fa-scroll",type:class extends apps.ShinobiPanel{constructor(options){super("settings",options);}},restricted:true});
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
Hooks.once("ready",()=>{console.info(`${ID} | ${VERSION} | Fichas manuais prontas. Nenhuma automação de regras ativa.`);});
Hooks.on("preCreateActor",(document,data)=>{if(game.system.id===ID&&ICONS[data.type]&&(!data.img||data.img==='icons/svg/mystery-man.svg'))document.updateSource({img:ICONS[data.type]});});
Hooks.on("preCreateItem",(document,data)=>{if(game.system.id===ID&&ICONS[data.type]&&(!data.img||data.img==='icons/svg/item-bag.svg'))document.updateSource({img:ICONS[data.type]});});
