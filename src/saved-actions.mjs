import {createActionStore,validActionId} from './core/action-store.mjs';
import {actionRows} from './core/action-controls.mjs';
import {ID} from './config.mjs';
import {MANEUVERS} from './maneuvers.mjs';
import {prepareWeaponAction} from './weapon-actions.mjs';
import {readFields} from './interactions.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keyOk=validActionId;
export const actionStore=createActionStore(ID);
const storedKeys=['maneuver','count','mode','units','offhand','dual','electricStat','sizeSweep','aggressive','object'];
export const SAVED_ACTIONS=new Set(['action-save','action-edit','action-use','action-once','action-duplicate','action-delete','action-favorite','action-declare','action-shortcut']);
export const savedActions=actionStore.list;
export function savedDefaults(options={}){
 const result={};for(const k of storedKeys)if(Object.hasOwn(options,k))result[k]=options[k];
 for(const k of ['count','units'])if(result[k]!==undefined){result[k]=Number(result[k]);if(!Number.isInteger(result[k])||result[k]<1||result[k]>6)throw Error('Quantidade inválida na ação salva.');}
 for(const k of ['offhand','dual','sizeSweep','aggressive','object'])if(result[k]!==undefined&&typeof result[k]!=='boolean')throw Error('Opção inválida.');
 if(result.maneuver&&!Object.hasOwn(MANEUVERS,result.maneuver))throw Error('Manobra desconhecida.');
 return result;
}
export async function saveAction(actor,{id,name,itemId,options,favorite=true}){
 if(!actor?.isOwner)throw Error('Você não pode configurar este personagem.');
 name=String(name??'').trim();if(!name||name.length>100)throw Error('Informe um nome de até 100 caracteres.');
 id??=foundry.utils.randomID();if(!keyOk(id))throw Error('Identificador inválido.');
 const defaults=savedDefaults(options);prepareWeaponAction(actor,itemId,{...defaults,distance:0});
 const old=savedActions(actor).find(x=>x.id===id);
 const record={schemaVersion:1,id,name,definition:'shinobi.weaponAttack',source:{itemId},defaults,favorite:old?.favorite??!!favorite};
 return actionStore.put(actor,record);
}
export function savedActionsView(actor,{all=false}={}){
 const entries=savedActions(actor).filter(x=>all||x.favorite);
 return `<section class="sns-block sns-saved-actions"><header><h3>Ações salvas</h3><button type="button" class="sns-btn" data-sns="panel" data-panel="saved-actions">Gerenciar</button></header><p class="sns-hint">Compartilhadas com os controladores deste personagem. Salve uma combinação em Usar arma.</p>${actionRows(entries,{all})||'<p>Nenhuma ação salva nesta lista.</p>'}</section>`;
}
export function attackTargets(){
 const tokens=globalThis.canvas?.tokens?.placeables;
 if(tokens?.length)return tokens.filter(t=>t.visible!==false&&t.actor).map(t=>({uuid:t.actor.uuid,name:t.name??t.actor.name}));
 return (globalThis.game?.actors?.contents??[]).filter(a=>a.visible!==false).map(a=>({uuid:a.uuid,name:a.name}));
}
export function selectedTargets(){return [...(globalThis.game?.user?.targets??[])].filter(t=>t.actor).map(t=>t.actor.uuid);}
export function selectedDistance(actor){
 const tokens=globalThis.canvas?.tokens?.placeables??[],selected=[...(globalThis.game?.user?.targets??[])];
 const source=(globalThis.canvas?.tokens?.controlled??[]).find(t=>t.actor?.uuid===actor.uuid)??tokens.find(t=>t.actor?.uuid===actor.uuid);
 if(!source||selected.length!==1||!globalThis.canvas?.grid?.measurePath)return null;
 const target=selected[0];
 // Complex footprints/elevations remain an explicit distance choice for the table.
 if([source,target].some(t=>t.document?.width!==1||t.document?.height!==1)||source.document.elevation!==target.document.elevation)return null;
 const measured=canvas.grid.measurePath([source.center,target.center]).distance;
 return Number.isFinite(measured)&&measured>=0?measured:null;
}
export function targetFields(env){
 const values=Object.fromEntries(Object.entries(env.values??{}).map(([k,v])=>[k.startsWith('weapon.')?k.slice(7):k,v]));
 const options={...env.options,...values},targets=env.attackTargets??[],chosen=env.selectedTargets??[],maneuver=options.maneuver??env.maneuver??'golpear';
 if(['ataque-giratorio','chute-giratorio'].includes(maneuver)||options.sizeSweep)return `<fieldset><legend>Alvos no alcance — confirme todos os afetados, inclusive aliados</legend>${targets.map(t=>`<label class="sns-check"><input type="checkbox" name="weapon.target.${esc(t.uuid)}" ${options['target.'+t.uuid]??chosen.includes(t.uuid)?'checked':''}>${esc(t.name)}</label>`).join('')}</fieldset>`;
 const count=['ataque-multiplo','chute-duplo','soco-em-gancho'].includes(maneuver)?maneuver==='chute-duplo'?2:Number(options.count??2):1;
 return Array.from({length:count},(_,i)=>`<label class="sns-field"><span>Alvo${count>1?' do golpe '+(i+1):''}</span><select name="weapon.target${i+1}"><option value="">Escolha um alvo</option>${targets.map(t=>`<option value="${esc(t.uuid)}" ${t.uuid===(options['target'+(i+1)]??chosen[i]??chosen[0])?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>`).join('');
}
export async function declareWeaponFromForm(actor,itemId,options,app){
 const {attacks}=prepareWeaponAction(actor,itemId,options),wide=['ataque-giratorio','chute-giratorio'].includes(options.maneuver)||options.sizeSweep;
 const groups=wide?[Object.entries(options).filter(([k,v])=>k.startsWith('target.')&&v===true).map(([k])=>k.slice(7))]:attacks.map((_,i)=>[options['target'+(i+1)]]);
 if(groups.some(g=>!g.length||g.some(v=>!v)))throw Error('Escolha os alvos antes de declarar.');
 const {requestAction}=await import('./action-executions.mjs');
 await requestAction({op:'declare',actorUuid:actor.uuid,itemId,options:{...savedDefaults(options),distance:Number(options.distance??1),targetKind:options.targetKind??'normal'},targets:groups});
 await app?.close?.();
}
export async function savedActionEvent(app,op,data,root,{actor,show}){
 if(!actor?.isOwner)throw Error('Você não pode configurar este personagem.');
 const config=app.panelConfig??{};
 if(op==='action-save'){
  const fields=readFields(root),opts=Object.fromEntries(Object.entries(fields).filter(([k])=>k.startsWith('weapon.')).map(([k,v])=>[k.slice(7),v]));
  await saveAction(actor,{id:config.presetId,name:fields['action.name'],itemId:opts.itemId??config.itemId,options:opts});return app.close();
 }
 if(op==='action-declare'){
  const opts={...config.options,...Object.fromEntries(Object.entries(readFields(root,'weapon.')).map(([k,v])=>[k.slice(7),v]))};
  return declareWeaponFromForm(actor,config.itemId,opts,app);
 }
 const preset=savedActions(actor).find(x=>x.id===data.id);if(!preset)throw Error('Ação salva não encontrada.');
 if(op==='action-delete'){
  if(await foundry.applications.api.DialogV2.confirm({window:{title:'Excluir ação salva'},content:`<p>Excluir ${esc(preset.name)}? A arma e a aptidão serão preservadas.</p>`}))await actionStore.remove(actor,preset.id);
  return app.render({force:true});
 }
 if(op==='action-favorite'){await actionStore.favorite(actor,preset.id);return app.render({force:true});}
 if(op==='action-duplicate'){
  await actionStore.duplicate(actor,preset.id,foundry.utils.randomID());return app.render({force:true});
 }
 if(op==='action-shortcut'){const {promptActionShortcut}=await import('./action-shortcuts.mjs');return promptActionShortcut(actor,preset.id);}
 if(op==='action-use')return game.shinobi?.actions?.use?game.shinobi.actions.use(actor.uuid,preset.id):useSavedAction(actor,preset.id,{show});
 // Editing a missing source remains possible; replacement is always explicit.
 const panel={actor,itemId:preset.source.itemId,options:preset.defaults,values:{...preset.defaults},presetName:preset.name,...(op==='action-edit'?{presetId:preset.id}:{})};
 return show('weapon-use',panel);
}
export async function useSavedAction(actor,id,{show=(kind,config)=>game.shinobi.open(kind,config)}={}){
 if(!actor?.isOwner)throw Error('Você não pode usar este personagem.');
 const preset=actionStore.get(actor,id);
 if(preset.definition!=='shinobi.weaponAttack')throw Error('Tipo de ação sem adaptador disponível.');
 prepareWeaponAction(actor,preset.source.itemId,{...preset.defaults,distance:0});
 const panel={actor,itemId:preset.source.itemId,options:preset.defaults,values:{...preset.defaults},presetName:preset.name};
 const chosen=selectedTargets(),distance=selectedDistance(actor),wide=['ataque-giratorio','chute-giratorio'].includes(preset.defaults.maneuver)||preset.defaults.sizeSweep;
 const plan=prepareWeaponAction(actor,preset.source.itemId,{...preset.defaults,distance:1});
 if(!wide&&chosen.length===1&&distance!==null){
  const opts={...preset.defaults,distance};for(let i=0;i<plan.attacks.length;i++)opts['target'+(i+1)]=chosen[0];
  return declareWeaponFromForm(actor,preset.source.itemId,opts);
 }
 return show('action-targets',panel);
}
