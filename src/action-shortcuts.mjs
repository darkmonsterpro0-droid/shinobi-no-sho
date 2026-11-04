import {ID} from './config.mjs';
import {actionStore} from './saved-actions.mjs';

export const ACTION_DROP='NoShoSavedAction';
export const actionDragData=(actor,id)=>({type:ACTION_DROP,systemId:ID,actorUuid:actor.uuid,actionId:id});
export function actionMacroCommand(actorUuid,id){
 // Only references enter the script. Labels, formulas and user code never do.
 return `try { await game.noSho.actions.use(${JSON.stringify(actorUuid)}, ${JSON.stringify(id)}); } catch (error) { ui.notifications.error(error.message); }`;
}
const pending=new Map();
export async function createActionShortcut(actor,id,slot){
 if(!actor?.isOwner)throw Error('Você não controla este personagem.');
 if(!Number.isInteger(slot)||slot<1||slot>50)throw Error('Escolha uma posição de 1 a 50.');
 const MacroClass=foundry.documents?.Macro??globalThis.Macro;
 if(!MacroClass.canUserCreate(game.user)||!game.user.can('MACRO_SCRIPT'))throw Error('As permissões de macros do Foundry não permitem criar este atalho. Use a ficha ou o HUD.');
 const preset=actionStore.get(actor,id),key=JSON.stringify([game.user.id,actor.uuid,id]);
 let task=pending.get(key);
 if(!task){
  task=(async()=>{
   const command=actionMacroCommand(actor.uuid,id);
   const macros=game.macros.contents??[...game.macros];
   const existing=macros.find(m=>m.isOwner&&(m.author?.id??m.author)===game.user.id&&m.type==='script'&&m.command===command&&m.getFlag(ID,'savedAction')?.actorUuid===actor.uuid&&m.getFlag(ID,'savedAction')?.actionId===id);
   if(existing)return existing;
   return MacroClass.create({name:preset.name,type:'script',img:'icons/svg/sword.svg',command,ownership:{default:0,[game.user.id]:3},flags:{[ID]:{savedAction:actionDragData(actor,id)}}});
  })();pending.set(key,task);
 }
 let macro;try{macro=await task;}finally{if(pending.get(key)===task)pending.delete(key);}
 if(!macro)throw Error('O Foundry não criou a macro.');
 await game.user.assignHotbarMacro(macro,slot);return macro;
}
export async function promptActionShortcut(actor,id){
 const slot=await foundry.applications.api.DialogV2.prompt({window:{title:'Atalho da ação salva'},content:'<p>Escolha uma posição na sua barra de atalhos (1–50). O atalho usa a configuração atual do personagem.</p><label>Posição<input name="slot" type="number" min="1" max="50" value="1" required></label>',ok:{label:'Criar atalho',callback:(_event,button)=>Number(button.form.elements.slot.value)}});
 if(slot===null||slot===undefined)return;
 if(!Number.isInteger(slot)||slot<1||slot>50)throw Error('Escolha uma posição de 1 a 50.');
 const occupied=game.user.hotbar?.[slot];
 if(occupied&&!await foundry.applications.api.DialogV2.confirm({window:{title:'Substituir posição'},content:`<p>A posição ${slot} já tem uma macro. Substituir o atalho dessa posição? A macro anterior continua no diretório.</p>`}))return;
 return createActionShortcut(actor,id,slot);
}
export function bindSavedActionDrag(root,actor){
 const abort=new AbortController();
 root.addEventListener('dragstart',event=>{
  const button=event.target.closest('[data-sns-saved-drag]');if(!button||!root.contains(button))return;
  if(!actor?.isOwner||!event.dataTransfer){event.preventDefault();return;}
  try{actionStore.get(actor,button.dataset.snsSavedDrag);event.dataTransfer.setData('text/plain',JSON.stringify(actionDragData(actor,button.dataset.snsSavedDrag)));event.dataTransfer.effectAllowed='copy';}catch{event.preventDefault();}
 },{signal:abort.signal});return ()=>abort.abort();
}
export function registerActionShortcuts(){
 Hooks.on('hotbarDrop',(_bar,data,slot)=>{
  if(data.type!==ACTION_DROP)return;
  // Return false synchronously: the Foundry hook does not await handlers.
  (async()=>{if(data.systemId!==ID||typeof data.actorUuid!=='string')throw Error('Atalho de outro sistema ou referência inválida.');const actor=await fromUuid(data.actorUuid);await createActionShortcut(actor,data.actionId,slot);})().catch(error=>ui.notifications.error(error.message));
  return false;
 });
}
