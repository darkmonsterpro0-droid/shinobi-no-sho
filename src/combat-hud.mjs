import {aptitudeOwned} from './aptitudes.mjs';
import {mindBinding,mindControlButtons} from './yamanaka-state.mjs';
import {shadowPullControls} from './nara-movement.mjs';
import {partnerControls} from './partners.mjs';
import {joinedBody} from './body-state.mjs';
import {savedActions} from './saved-actions.mjs';
import {ICONS,ATTRIBUTES,SKILLS} from './config.mjs';
import {WEAPONS} from './weapons.mjs';
import {prepareWeaponAction,canHandleWeapon,weaponHandlingAction} from './weapon-actions.mjs';
import {inventoryEntry} from './inventory-data.mjs';
import {utilityPlan,utilityCombatModes} from './inventory-rules.mjs';
import {powerSheetEffects,hudPowerAction} from './power-ui.mjs';
import {requiresPowerMaintenance} from './power-rules.mjs';
import {gateOpening,hachimonProfile,HACHIMON_GATES} from './hachimon-rules.mjs';
import {escapeHTML as esc,resourceReadouts} from './core/action-controls.mjs';

export function hudActors(){
 return (globalThis.game?.actors?.contents??[]).filter(actor=>actor.isOwner&&!joinedBody(actor)&&!actor.getFlag?.('shinobi-no-sho','companion')?.retired&&
  (actor.type==='character'||actor.type==='creature'&&(actor.getFlag?.('shinobi-no-sho','companion')||actor.getFlag?.('shinobi-no-sho','clone'))));
}
export function selectedHUDActor(){
 const controlled=globalThis.canvas?.tokens?.controlled??[];
 if(controlled.length)return controlled.length===1&&controlled[0].actor?.isOwner?controlled[0].actor:null;
 return game.user.character?.isOwner?game.user.character:null;
}
const hudButton=(label,action,attrs='')=>`<button type="button" class="sns-btn" data-sns="${action}" ${attrs}>${esc(label)}</button>`;

const groups={standard:'Padrão',movement:'Movimento',partial:'Parcial',free:'Livre',other:'Outras'};
function actionGroup(action){
 // A complete action includes the standard action. Keep its attacks with the
 // other attacks, while the execution still displays its full published cost.
 return ({Padrão:'standard',Completa:'standard',full:'standard',Movimento:'movement',Parcial:'partial',Livre:'free'})[action]??(Object.hasOwn(groups,action)?action:'other');
}
function inventoryChoices(item,actor,env,group){
 const entry=inventoryEntry(item);
 if(!entry||entry.storage||item.system.inventoryData?.storedElsewhere)return [];
 const available=Number(item.system.quantity??1)>0;
 const attrs=`data-kind="inventory-use" data-id="${esc(item.id)}"`;
 const modes=utilityCombatModes(entry,{prepared:!!actor.system.inventoryState?.explosives?.length});
 if(!modes.length)return group==='other'&&(available||entry.kind==='armor')?[hudButton(item.name,'hud-select',attrs)]:[];
 return modes.flatMap(({mode,label})=>{
  if(!available&&mode!=='detonate')return [];
  let action;
  try{action=utilityPlan(entry,actor.system,actor.items,{vulnerable:true,mode},env.houseRules).action;}
  catch{return [];}
  if(actionGroup(action)!==group)return [];
  return [hudButton(label??item.name,'hud-select',mode?attrs+` data-mode="${esc(mode)}"`:attrs)];
 });
}
function favoriteGroup(actor,entry){
 try{return actionGroup(prepareWeaponAction(actor,entry.source.itemId,entry.defaults).plan.action);}
 catch{return 'other';}
}

function actionChoices(items,category,actor,env,group) {
 if(category==='weapon-use'&&group==='standard')return items.filter(i=>i.type==='equipment'&&WEAPONS.some(w=>w.category!=='ammo'&&w.key!=='unarmed'&&w.key===i.system.catalogKey&&w.book===i.system.catalogBook)).map(i=>hudButton(i.name,'hud-select',`data-kind="weapon-use" data-id="${esc(i.id)}"`));
 if(category==='power-use'){
  const active=(actor?.system?.powerState?.active??[]).filter(a=>a.active!==false),controls=[];
  for(const item of items.filter(i=>i.type==='power'&&i.system.powerData?.family==='hachimon'))
   for(let gate=(hachimonProfile(actor.system)?.gate??0)+1;gate<=Math.min(8,Number(item.system.level));gate++)
    if(gateOpening(Number(item.system.level),gate,hachimonProfile(actor.system)?.gate??0).action===group)
     controls.push(hudButton('Abrir '+HACHIMON_GATES[gate-1],'hud-select',`data-kind="power-use" data-id="${esc(item.id)}" data-effect="hachimon" data-level="${gate}"`));
  if(group==='standard')for(const item of items.filter(i=>i.type==='power'&&i.system.powerData?.family==='kagejutsu'&&Number(i.system.level)>=6))
   controls.push(hudButton('Kageyose · Algema de Sombra','hud-select',`data-kind="power-use" data-id="${esc(item.id)}" data-effect="kageyose" data-mode="bind"`),
    hudButton('Kage Nui · Costurar (Completa)','hud-select',`data-kind="power-use" data-id="${esc(item.id)}" data-effect="kage-nui" data-mode="stitch"`));
  for(const a of active){
   if(a.shadowRecovery?.pending)continue;
   const attrs=`data-id="${esc(a.id)}"`,own=!a.sourceUuid||a.sourceUuid===actor.uuid;
   if(own&&a.shadowPreparedOffer&&group==='free')controls.push(hudButton('Preparar sombra para reutilização','power-shadow-prepare',attrs));
   if(own&&a.shadowProjectilePrepared&&group==='standard')controls.push(hudButton('Arremessar arma com sombra','hud-select',`data-kind="power-use" data-id="${esc(a.itemId)}" data-effect="kage-shuriken" data-mode="projectile" data-prepared="${esc(a.id)}" data-level="${esc(a.plan.level)}"`));
   if(own&&a.shadowSource&&a.effect==='kage-shuriken'&&group==='free')controls.push(hudButton('Usar Mane livre na vítima','hud-select',`data-kind="power-use" data-id="${esc(a.itemId)}" data-effect="kage-mane" data-mode="projectile-mane" data-prepared="${esc(a.id)}" data-level="${esc(a.plan.level)}"`));
   if(own&&a.shadowPrepared&&group==='standard')controls.push(hudButton('Reutilizar sombra preparada','hud-select',`data-kind="power-use" data-id="${esc(a.itemId)}" data-effect="kage-mane" data-mode="prepared" data-prepared="${esc(a.id)}" data-level="${esc(a.plan.level)}"`));
   if(own&&a.shadowGuided&&group==='other')controls.push(hudButton('Libertar sombra guiada','hud-select',`data-kind="power-use" data-id="${esc(a.itemId)}" data-effect="kage-mane" data-mode="guided" data-guided="${esc(a.id)}" data-level="${esc(a.plan.level)}"`));
   if(own&&group==='standard')controls.push(mindControlButtons(actor,a,hudButton,esc));
   if(own&&group==='movement')controls.push(mindControlButtons(actor,a,hudButton,esc,'move'));
   if(own&&['partial','free'].includes(group))controls.push(mindControlButtons(actor,a,hudButton,esc,'ready',body=>actionGroup(weaponHandlingAction([...body.items],env.houseRules))===group));
   if(own&&group==='other')controls.push(shadowPullControls(actor,a,hudButton,esc));
   if(own&&group==='other')controls.push(mindControlButtons(actor,a,hudButton,esc,'ability'),mindControlButtons(actor,a,hudButton,esc,'test'));
   if(own&&group==='partial')controls.push(mindControlButtons(actor,a,hudButton,esc,'sensor'));
   if(own&&group==='free')controls.push(mindControlButtons(actor,a,hudButton,esc,'sensorEnd'));
   if(own&&!a.linkedTo&&requiresPowerMaintenance(a)&&group===(a.duration==='concentration'?'standard':'partial'))controls.push(hudButton('Manter '+a.name,'power-maintain',attrs));
   const escape=a.linkedTo&&a.plan?.resistances?.find(r=>r.escape&&(typeof r.stat==='string'||Array.isArray(r.stat))&&!r.standardNoTest&&!r.cuttingWeaponRequired);
   if(escape&&!(a.shadowBinding&&active.some(other=>other.shadowStrangle?.bindingId===a.id))&&actionGroup(escape.action??'standard')===group){
    const stats=Array.isArray(escape.stat)?escape.stat:[escape.stat];
    for(const stat of stats)controls.push(hudButton('Livrar-se de '+a.name+(stats.length>1?' · '+(ATTRIBUTES[stat]??SKILLS[stat]?.[0]??stat):''),'power-escape',attrs+` data-stat="${esc(stat)}"`));
   }
   if(group==='free'&&!a.hachimonFatal&&(!a.hachimonRecovery&&!a.mentalStun&&!a.mindSendFailure||globalThis.game?.user?.isGM)&&(own||globalThis.game?.user?.isGM)&&(!a.blackFlames||globalThis.game?.user?.isGM))controls.push(hudButton('Encerrar '+a.name,'power-end',attrs));
  }
  return [...controls,...items.filter(i=>i.type==='power'&&i.system.powerData?.family!=='hachimon').flatMap(i=>powerSheetEffects(i,actor,env).filter(effect=>actionGroup(hudPowerAction(i,actor,effect,env))===group).map(effect=>hudButton(`${i.name} · ${effect.name}`,'hud-select',`data-kind="power-use" data-id="${esc(i.id)}" data-effect="${esc(effect.key)}" data-tier="${esc(effect.tier??'')}"`)))];
 }
 if(category==='weapon-use'&&group===actionGroup(weaponHandlingAction(items,env.houseRules))){
  return items.filter(canHandleWeapon).map(item=>hudButton(
   `${item.system.equipped?'Guardar':'Sacar'} ${item.name}`,'hud-weapon-ready',
   `data-id="${esc(item.id)}" data-equipped="${!item.system.equipped}"`
  ));
 }
 if(category==='inventory-use')return items.flatMap(item=>inventoryChoices(item,actor,env,group));
 return [];
}

export function combatHUDView(actor,actors=hudActors(),env={}){
 const selector=`<label class="sns-field"><span>Personagem</span><select name="hud.actor"><option value="">${actor?.isOwner&&!actors.some(a=>a.uuid===actor.uuid)?esc(actor.name):'Selecione um personagem'}</option>${actors.filter(a=>a.isOwner).map(a=>`<option value="${esc(a.uuid)}" ${actor?.uuid===a.uuid?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>`;
 if(!actor?.isOwner)return `<div class="sns-combat-hud">${selector}<p>Controle um único token ou escolha um personagem que você controla.</p></div>`;
 const binding=mindBinding(actor),resources=actor.system.resources??{};
 const group=env.actionGroup??'standard';
 const favorites=(binding?[]:savedActions(actor)).filter(x=>x.favorite&&(!env.actorView?group==='standard':favoriteGroup(actor,x)===group));
 const tabs=`<nav class="sns-hud-groups" aria-label="Tipos de ação">${Object.entries(groups).map(([key,label])=>hudButton(label,'hud-group',`data-group="${key}" aria-pressed="${group===key}"`)).join('')}</nav>`;
 const shortcuts=(binding?'':partnerControls(actor,esc))+favorites.map(x=>hudButton(x.name,'action-use',`data-id="${esc(x.id)}" data-sns-saved-drag="${esc(x.id)}" draggable="true"`)).join('')+
  (!binding&&group==='partial'?calorieControls(env.actorView??actor,{books:env.profile?.books,rules:env.houseRules,isGM:game.user.isGM}):'')+
  (!binding&&group==='free'&&env.actorView?.summary?.clan?.hakken?hudButton(
   env.actorView.summary.clan.hakken.active?'Desativar Hakken':'Ativar Hakken · 2 chakra',
   env.actorView.summary.clan.hakken.active?'capability-deactivate':'capability-activate',
   `data-id="${esc(env.actorView.summary.clan.hakken.itemId)}"`):'');
 const items=env.items??[];
 const weaponTab=!binding&&(group==='standard'||group===actionGroup(weaponHandlingAction(items,env.houseRules))&&items.some(canHandleWeapon));
 const choices=binding?[]:actionChoices(items,env.category,env.actorView??actor,env,group);
 const acceleratedFeint=!binding&&group==='free'&&env.actorView?.summary?.acceleration?.rank?hudButton('Finta acelerada','hud-feint','data-accelerated="true"'):'';
 const feint=!binding&&group===(aptitudeOwned(items,'ponto-cego','',env.houseRules)?'movement':'standard')?hudButton('Fintar','hud-feint'):'';
 const targetNames=env.targetNames??[];
 const picture=env.portrait??ICONS[actor.type]??ICONS.character;
 return `<div class="sns-combat-hud">${env.detail?`<section class="sns-hud-detail" aria-label="Preparar ação"><header>${hudButton('Recolher','hud-collapse')}</header>${env.detail}</section>`:''}<div class="sns-hud-strip"><section class="sns-hud-character"><button class="sns-hud-portrait" type="button" data-sns="hud-sheet" aria-label="Abrir ficha de ${esc(actor.name)}"><img src="${esc(picture)}" alt=""></button><div>${selector}${resourceReadouts([{label:'Vitalidade',value:resources.vitality?.value,max:resources.vitality?.max},{label:'Chakra',value:resources.chakra?.value,max:resources.chakra?.max}])}${env.movement==null?'':`<small>Deslocamento ${esc(env.movement)} m</small>`}</div></section><section class="sns-hud-actions">${tabs}<div class="sns-hud-favorites">${shortcuts}${feint}${acceleratedFeint}${group==='free'&&env.canResume?hudButton('Retomar iniciativa','hud-resume-initiative'):''}${group==='free'&&env.canDelay?hudButton('Atrasar iniciativa','hud-delay'):''}${!binding&&group==='standard'?hudButton('Ataque desarmado','hud-select','data-kind="weapon-use" data-id="unarmed"'):''}</div><nav aria-label="Ações de combate">${[['weapon-use','Armas'],['power-use','Poderes'],['inventory-use','Itens']].filter(([kind])=>!binding&&(kind!=='weapon-use'||weaponTab)).map(([kind,label])=>hudButton(label,'hud-category',`data-kind="${kind}" aria-pressed="${env.category===kind}"`)).join('')}</nav>${binding?'<p role="status">Corpo controlado por '+esc(binding.source.name)+'. Os ataques, movimentos e reações físicas são declarados pelo controlador.</p>':''}${!binding&&env.category&&(env.category!=='weapon-use'||weaponTab)?`<div class="sns-hud-choices">${choices.join('')||'<small>Nenhuma opção disponível nesta categoria.</small>'}</div>`:''}</section><section class="sns-hud-target"><div role="status"><small>Alvo marcado</small><strong>${targetNames.length?targetNames.map(esc).join(', '):'Marque um token no mapa'}</strong>${env.distance==null?'':`<small>${esc(env.distance)} m</small>`}</div></section></div></div>`;
}

export function registerCombatHUD(){
 Hooks.on('getSceneControlButtons',controls=>{
  if(!controls.tokens?.tools)return;
  controls.tokens.tools.noShoCombat={name:'noShoCombat',title:'No Sho — HUD de combate',icon:'fa-solid fa-crosshairs',order:Object.keys(controls.tokens.tools).length,button:true,onChange:()=>game.noSho.hud.toggle()};
 });
 const refresh=()=>game.noSho?.hud?.refresh();
 Hooks.on('controlToken',()=>game.noSho?.hud?.follow());
 for(const hook of ['createActor','updateActor','deleteActor','createItem','updateItem','deleteItem','updateToken','deleteToken'])Hooks.on(hook,refresh);
 Hooks.on('canvasReady',()=>game.noSho?.hud?.activate());
 Hooks.on('updateUser',refresh);
 Hooks.on('targetToken',user=>{if(user.id===game.user.id)game.noSho?.hud?.refreshTargets?.();});
}
import {calorieControls} from './akimichi-ui.mjs';
