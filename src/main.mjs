import {registerNativeWorldSettings} from './world-settings.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';
import {createHachimonEffectClass} from './hachimon-rules.mjs';
import {createChatMessageClass} from './core/chat-visibility.mjs';
import {syncAccelerationInitiative} from './acceleration.mjs';
import {inuzukaCompanions,syncInuzukaCompanions} from './inuzuka.mjs';
import {saveWorldProfile,worldProfile,worldRules} from './world-settings.mjs';
import {prepareWeaponAction} from './weapon-actions.mjs';
import {capabilityStatus} from './capability-actions.mjs';
import {extraResources} from './extra-resources.mjs';
import {savedActions,saveAction,useSavedAction} from './saved-actions.mjs';
import {createActionAccess} from './core/action-access.mjs';
import {registerCombatHUD} from './combat-hud.mjs';
import {reconcileBodyLinks} from './inuzuka-fusion.mjs';
import {registerActionShortcuts,createActionShortcut} from './action-shortcuts.mjs';
import {registerActionExecutions,bindActionExecution,requestAction} from './action-executions.mjs';
import {bindRerolls} from './chat-rerolls.mjs';
import {nextAttack} from './combat-chat.mjs';
import {dismissClone} from './clone-actions.mjs';
import {createItemClass} from './item-validation.mjs';
import {createActorClass,syncAutomaticStatuses,processConditionPhase,conditionRecords,saveCondition,expireSceneConditions} from './automation.mjs';
import {announceTurn,checkCamouflage} from './summary-actions.mjs';
import {CONDITIONS} from './conditions.mjs';
import {progression} from './progression.mjs';
import {ID,VERSION,ACTOR_TYPES,ITEM_TYPES,ICONS,defaultProfile} from "./config.mjs";
import {createModels} from "./models.mjs";
import {createApplications} from "./apps.mjs";

registerActionExecutions();
registerCombatHUD();registerActionShortcuts();
import {createCombatClass,renderDelayedInitiative} from './combat-initiative.mjs';
Hooks.once("init",()=>{
  CONFIG.ActiveEffect.documentClass=createHachimonEffectClass(CONFIG.ActiveEffect.documentClass);
  CONFIG.ChatMessage.documentClass=createChatMessageClass(CONFIG.ChatMessage.documentClass,ID);
  CONFIG.Combat.documentClass=createCombatClass(CONFIG.Combat.documentClass);
  CONFIG.Actor.defaultType="character";
  CONFIG.Actor.documentClass=createActorClass(CONFIG.Actor.documentClass);
  CONFIG.Item.documentClass=createItemClass(CONFIG.Item.documentClass);
  CONFIG.statusEffects=Object.values(CONDITIONS).map(c=>({id:'sns-'+c.key,name:c.name,img:c.icon}));
  CONFIG.specialStatusEffects.DEFEATED='sns-morto';CONFIG.specialStatusEffects.BLIND='sns-cego';
  CONFIG.Combat.initiative={formula:'1d8 + @sns.initiative',decimals:0};
  const {ShinobiActorModel,ShinobiItemModel}=createModels();
  for(const type of Object.keys(ACTOR_TYPES))CONFIG.Actor.dataModels[type]=ShinobiActorModel;
  for(const type of Object.keys(ITEM_TYPES))CONFIG.Item.dataModels[type]=ShinobiItemModel;
  game.settings.register(ID,"houseRules",{scope:"world",config:false,type:Object,default:{advancement:"level"},onChange:refreshRuleState});
  game.settings.register(ID,"profile",{scope:"world",config:false,type:Object,default:defaultProfile(),onChange:refreshRuleState});
  registerNativeWorldSettings(refreshRuleState);
  for(const [key,name] of [["sceneEpoch","Período — Número da cena"],["dayEpoch","Período — Número do dia"]])game.settings.register(ID,key,{name,hint:"Aumente em 1 somente ao iniciar uma nova cena/dia para renovar os usos limitados correspondentes. Não renova reservas ou ações.",scope:"world",config:true,type:new foundry.data.fields.NumberField({min:0,integer:true,nullable:false}),default:0,onChange:key==='sceneEpoch'?refreshSceneConditions:refreshSheets});
  game.settings.register(ID,"theme",{name:"Tema das fichas Shinobi",hint:"Preferência pessoal de aparência.",scope:"client",config:true,type:String,choices:{light:"Marfim",dark:"Grafite"},default:"light",onChange:refreshSheets});
  game.settings.register(ID,"reduceMotion",{name:"Reduzir movimento na interface Shinobi",scope:"client",config:true,type:Boolean,default:false,onChange:refreshSheets});
  const apps=createApplications();
  const sheets=foundry.applications.apps.DocumentSheetConfig;
  sheets.registerSheet(CONFIG.Actor.documentClass,ID,apps.ShinobiActorSheet,{types:Object.keys(ACTOR_TYPES),makeDefault:true,label:"Shinobi no Sho"});
  sheets.registerSheet(CONFIG.Item.documentClass,ID,apps.ShinobiItemSheet,{types:Object.keys(ITEM_TYPES),makeDefault:true,label:"Shinobi no Sho"});
  const access=createActionAccess({resolveActor:uuid=>fromUuid(uuid),list:savedActions,use:useSavedAction});
  game.noSho={apiVersion:1,adapter:ID,actions:access,hud:apps.hud};
  game.noSho.capabilities={
    async status(actorUuid,itemId){const actor=await fromUuid(actorUuid);if(!actor?.isOwner)throw Error('Você não controla este personagem.');const item=actor.items.get(itemId);if(!item)throw Error('Capacidade não encontrada.');return capabilityStatus(actor,item,{books:worldProfile()?.books,rules:{...worldRules(),senjutsu:worldProfile()?.senjutsu}});},
    request:(actorUuid,command)=>requestAction({...command,op:'capability',actorUuid})
  };
  game.shinobi={extraResources,actions:{request:requestAction,prepare:prepareWeaponAction,list:savedActions,save:saveAction,use:access.use,shortcut:createActionShortcut},version:VERSION,applications:apps,open:(kind,config)=>apps.show(kind,config),createCharacter:()=>CONFIG.Actor.documentClass.createDialog({type:"character"},{},{types:["character"]})};
});
function refreshSceneConditions(){
  refreshSheets();
  if(!isAuthority())return;
  const actors=new Set(game.actors);
  for(const scene of game.scenes??[])for(const token of scene.tokens??[])if(!token.actorLink&&token.actor)actors.add(token.actor);
  for(const actor of actors)expireSceneConditions(actor).then(()=>syncAutomaticStatuses(actor)).catch(report);
}
function refreshSheets(){for(const app of foundry.applications.api.ApplicationV2.instances())if(app.classList?.contains("sns-app")&&app.rendered)app.render({force:true});}
function refreshRuleState(){
 refreshSheets();if(!isAuthority())return;
 (async()=>{const {reconcileActivePowers}=await import('./power-actions.mjs');
  for(const actor of worldActorDocuments()){await reconcileActivePowers(actor);await syncInuzukaCompanions(actor);}
  refreshSheets();
 })().catch(report);
}
function directoryButton(html,kind,label,icon) {
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector(`[data-sns-directory="${kind}"]`))return;
  const header=root.querySelector('.directory-header')??root;
  const button=document.createElement('button');button.type="button";button.dataset.snsDirectory=kind;button.innerHTML=`<i class="fas fa-${icon}" aria-hidden="true"></i> ${label}`;
  button.addEventListener('click',()=>game.shinobi.open(kind));header.append(button);
}
Hooks.on("renderItemDirectory",(app,html)=>directoryButton(html,"library","Biblioteca Shinobi","book-open"));
Hooks.once("ready",()=>{console.info(`${ID} | ${VERSION} | Resumo, progressão, condições, catálogos e serviços de aptidões carregados.`);});
Hooks.on('preCreateActor',(document,data)=>{if(data.type==='character'&&!data.system?.campaign?.level)document.updateSource({'system.campaign.level':4});if(game.system.id===ID&&ICONS[data.type]&&(!data.img||data.img==='icons/svg/mystery-man.svg'))document.updateSource({img:ICONS[data.type]});});
Hooks.on("preCreateItem",(document,data)=>{if(game.system.id===ID&&ICONS[data.type]&&(!data.img||data.img==='icons/svg/item-bag.svg'))document.updateSource({img:ICONS[data.type]});});

function isAuthority(){return game.user.isGM&&game.users.filter(u=>u.isGM&&u.active).sort((a,b)=>a.id.localeCompare(b.id))[0]?.id===game.user.id;}
function report(error){console.error(ID,error);ui.notifications.error(error.message??String(error));}
Hooks.on('deleteActor',()=>{if(isAuthority())reconcileBodyLinks().catch(report);});
Hooks.on('createActor',actor=>{if(actor.getFlag(ID,'clone'))refreshSheets();});
const mindChecks=new Set();
function checkMindPowers(actor){
 if(!isAuthority()||!actor?.system||mindChecks.has(actor.uuid))return;
 mindChecks.add(actor.uuid);
 import('./power-actions.mjs').then(({reconcileActivePowers})=>reconcileActivePowers(actor)).catch(report).finally(()=>mindChecks.delete(actor.uuid));
}
Hooks.on('deleteActor',(actor,options)=>{if(actor.getFlag(ID,'clone'))refreshSheets();if(isAuthority()&&!options.snsCloneRollback&&!options.snsCloneDismissed&&actor.getFlag(ID,'clone'))dismissClone(actor,{deleted:true}).catch(report);});
Hooks.on('updateActor',(actor,data,options,userId)=>{
  checkMindPowers(actor);
  if(isAuthority()&&(actor.system.powerState?.active?.some(p=>p.bodyFusion)||data.system?.powerState||Object.hasOwn(data,'system.powerState')))reconcileBodyLinks().catch(report);
  if(isAuthority()){syncAutomaticStatuses(actor).then(()=>syncAccelerationInitiative(actor)).catch(report);if(actor.getFlag(ID,'clone')&&!actor.getFlag(ID,'clone').dismissed&&actor.system.resources.vitality.value<=0)dismissClone(actor).catch(report);}
  if(isAuthority()&&!options.snsCompanionSync)syncInuzukaCompanions(actor).catch(report);
  if(options.snsOpenAllocation&&game.user.id===userId&&actor.isOwner)game.shinobi.open('allocation',{actor});
});
for(const hook of ['createItem','updateItem','deleteItem'])Hooks.on(hook,item=>{if(isAuthority()&&item.parent?.constructor.documentName==='Actor')syncInuzukaCompanions(item.parent).catch(report);});
Hooks.on('preCreateCombatant',combatant=>{
 if(combatant.actor?.getFlag(ID,'companion')?.schemaVersion===1){ui.notifications.info('O companheiro age no turno do Inuzuka, sem iniciativa própria. Use sua ficha ou o HUD nesse turno.');return false;}
});
for(const hook of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(hook,effect=>{const actor=effect.actor??effect.parent;if(isAuthority()&&actor?.constructor.documentName==='Actor'){checkMindPowers(actor);syncAutomaticStatuses(actor).then(()=>syncAccelerationInitiative(actor)).catch(report);}});
Hooks.once('ready',()=>{
  if(!isAuthority())return;
  reconcileBodyLinks().catch(report);
  (async()=>{
   const {reconcileActivePowers}=await import('./power-actions.mjs');
   for(const actor of worldActorDocuments()){
    await reconcileActivePowers(actor);
    await syncAutomaticStatuses(actor);await syncAccelerationInitiative(actor);await syncInuzukaCompanions(actor);
   }
  })().catch(report);
  const p=worldProfile(),decisions=[...p.decisions];
  for(const d of [{id:'confuso-reacoes',name:'Confuso: resultado 5–6',description:'Não realiza ações, mas mantém as reações de defesa.'},{id:'sangrando-vigor-turno',name:'Sangrando: tentativa de Vigor',description:'Uma tentativa de Vigor 18 por turno, como reação. Medicina 16 exige ação padrão por tentativa.'}])if(!decisions.some(r=>r.id===d.id))decisions.push({...d,source:'Decisão do usuário em 21/10/2026',status:'Definido'});
  for(const id of ['senjutsu','fracassos','chute-duplo','dominio-agua-reserva','clone-versao-anterior','soldier-pill-reset','equipment-penalty','seal-cost','nara-agulhas-protecao','yamanaka-condicoes','yamanaka-atordoado','yamanaka-dano-desordem','yamanaka-multipla-reacao','yamanaka-morte']){const resolved=defaultProfile().decisions.find(d=>d.id===id),index=decisions.findIndex(d=>d.id===id);if(index<0)decisions.push(resolved);else decisions[index]=resolved;}
  if(JSON.stringify(decisions)!==JSON.stringify(p.decisions))saveWorldProfile({...p,decisions}).catch(report);
});
Hooks.on('renderCombatTracker',renderDelayedInitiative);
Hooks.on('updateCombat',(combat,changed,options)=>{
  game.shinobi?.applications?.hud?.refresh();
  if(options.snsAcceleration)return;
  if(!isAuthority()||!combat.started||(!options.snsDelay&&!Object.hasOwn(changed,'turn')&&!Object.hasOwn(changed,'round')))return;
  const previous=combat.previous,current=combat.current;
  if(previous&&(current.round<previous.round||current.round===previous.round&&current.turn<=previous.turn&&!options.snsDelay))return;
  (async()=>{
    if(!options.snsDelay&&previous?.round>0&&previous.turn!==null){const before=combat.turns.find(c=>c.tokenId===previous.tokenId)??combat.turns[previous.turn];if(before?.actor)for(const member of [before.actor,...inuzukaCompanions(before.actor)])await announceTurn(member,await processConditionPhase(member,combat.id+':'+previous.round+':'+(before.id??previous.turn)+':end','end'));}
    const actor=combat.combatant?.actor;if(!actor)return;const key=combat.id+':'+combat.round+':'+combat.combatant.id+':start';
    for(const member of [actor,...inuzukaCompanions(actor)]){await member.update({['flags.'+ID+'.currentTurnKey']:key});await announceTurn(member,await processConditionPhase(member,key,'start'));}
  })().catch(report);
});
Hooks.on('renderChatMessageHTML',(message,html)=>{
  const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
  const flags=message.flags?.[ID];
  if(flags?.actionRequest&&!flags.actionRequestFailed&&(flags.internalActionRequest||message.content==='<p>Pedido de ação processado.</p>')){
    root.style.setProperty('display','none','important');
    return;
  }
  bindRerolls(message,root,report).catch(report);
  bindActionExecution(message,root,report).catch(report);
  for(const button of root.querySelectorAll('[data-sns-weapon-resolve]'))button.addEventListener('click',async()=>{button.disabled=true;try{const actor=await fromUuid(message.getFlag(ID,'weaponAttack')?.actorUuid);const app=new game.shinobi.applications.ShinobiPanel('weapon-resolution',{actor});await app._snsAction('weapon-resolve',{message:message.id},root);}catch(error){report(error);}finally{button.disabled=false;}});
  for(const [attribute,op,flag]of [['data-sns-power-collateral','power-collateral','powerCollateral'],['data-sns-power-continue','power-continue','powerContinuation']])for(const button of root.querySelectorAll('['+attribute+']'))button.addEventListener('click',async()=>{button.disabled=true;try{const actor=await fromUuid(message.getFlag(ID,flag)?.actorUuid);const app=new game.shinobi.applications.ShinobiPanel('power-use',{actor});await app._snsAction(op,{message:message.id},root);}catch(error){report(error);}finally{button.disabled=false;}});
  for(const button of root.querySelectorAll('[data-sns-power-resolve]'))button.addEventListener('click',async()=>{button.disabled=true;try{const actor=await fromUuid(message.getFlag(ID,'powerAttack')?.actorUuid);const app=new game.shinobi.applications.ShinobiPanel('power-use',{actor});await app._snsAction('power-resolve',{message:message.id},root);}catch(error){report(error);}finally{button.disabled=false;}});
  for(const button of root.querySelectorAll('[data-sns-next-attack]'))button.addEventListener('click',async()=>{button.disabled=true;try{await nextAttack(message,button.dataset.snsNextAttack);}catch(error){report(error);}finally{button.disabled=false;}});
  for(const button of root.querySelectorAll('[data-sns-camouflage]'))button.addEventListener('click',async()=>{button.disabled=true;try{if(message.getFlag(ID,'camouflageResolved'))throw Error('Camuflagem já resolvida.');const actor=await fromUuid(button.dataset.actorUuid);if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode resolver.');await message.setFlag(ID,'camouflageResolved',true);await checkCamouflage(actor);}catch(error){report(error);}finally{button.disabled=false;}});
  for(const button of root.querySelectorAll('[data-sns-resist]'))button.addEventListener('click',async()=>{button.disabled=true;try{const actor=await fromUuid(button.dataset.actorUuid);if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode resolver esta resistência.');const app=new game.shinobi.applications.ShinobiPanel('conditions',{actor});await app._snsAction('resist-condition',{id:button.dataset.snsResist},root);}catch(error){report(error);}finally{button.disabled=false;}});
});
// Defense slips refer to a live execution. Refresh them when another client
// declares a defense so stale buttons cannot keep offering a settled choice.
Hooks.on('updateChatMessage',message=>{
 if(!message.getFlag(ID,'actionExecution'))return;
 for(const invite of game.messages)if(invite.visible&&invite.getFlag(ID,'defenseInvitation')?.executionId===message.id)
  ui.chat?.updateMessage(invite,{notify:false}).catch(report);
});

Hooks.on('updateWorldTime',async()=>{
 if(isAuthority()){
  const actors=new Map([...game.actors,...game.scenes.flatMap(scene=>[...scene.tokens].map(token=>token.actor).filter(Boolean))].map(actor=>[actor.uuid,actor]));
  for(const actor of actors.values()){
   if(actor.getFlag(ID,'aptitudes')?.hachimon?.cooldown?.remaining>0||actor.system.powerState?.active?.some(p=>(p.automaticMaintenance||p.shadowSource||p.hachimon||p.hachimonRecovery||p.mentalControl||p.mentalControlLink||p.mentalStun||p.mindSendFailure)&&p.active!==false)){
    const {advanceAutomaticPowerTime}=await import('./power-actions.mjs');
    await advanceAutomaticPowerTime(actor).catch(report);
   }
   if(!game.combat?.started&&actor.getFlag(ID,'aptitudes')?.akimichi?.active?.pill){
    const {advanceCalories}=await import('./akimichi.mjs');
    await advanceCalories(actor,'clock:'+game.time.worldTime,'time',{books:worldProfile().books,rules:worldRules()}).catch(report);
   }
   if(Object.keys(actor.system.inventoryState??{}).length)await syncAutomaticStatuses(actor).then(()=>syncAccelerationInitiative(actor)).catch(report);
  }
 }
 refreshSheets();
});
