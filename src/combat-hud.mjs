import {savedActionsView} from './saved-actions.mjs';
import {escapeHTML as esc,resourceReadouts,manualMarkers} from './core/action-controls.mjs';

export function hudActors(){
 const all=[...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(globalThis.game?.actors?.contents??[])].filter(a=>a?.isOwner);
 return [...new Map(all.map(a=>[a.uuid,a])).values()];
}
export function selectedHUDActor(){
 const controlled=globalThis.canvas?.tokens?.controlled??[];
 if(controlled.length)return controlled.length===1&&controlled[0].actor?.isOwner?controlled[0].actor:null;
 return game.user.character?.isOwner?game.user.character:null;
}
export function combatHUDView(actor,actors=hudActors()){
 const selector=`<label class="sns-field"><span>Personagem do HUD</span><select name="hud.actor"><option value="">Selecione um personagem</option>${actors.map(a=>`<option value="${esc(a.uuid)}" ${actor?.uuid===a.uuid?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>`;
 if(!actor?.isOwner)return `<div class="sns-combat-hud">${selector}<p>Controle um único token ou escolha um personagem que você controla.</p></div>`;
 const s=actor.system,resources=s.resources??{},markers=[['standard','Padrão'],['movement','Movimento'],['partial','Parcial']].map(([key,label])=>({label,path:'system.actions.'+key,checked:!!s.actions?.[key]}));
 return `<div class="sns-combat-hud">${selector}<h3>${esc(actor.name)}</h3>${resourceReadouts([{label:'Vitalidade',value:resources.vitality?.value,max:resources.vitality?.max},{label:'Chakra',value:resources.chakra?.value,max:resources.chakra?.max}])}<section class="sns-block"><h4>Ações da rodada</h4>${manualMarkers(markers)}</section><div class="sns-toolbar"><button type="button" class="sns-btn" data-sns="hud-sheet">Abrir ficha</button><button type="button" class="sns-btn" data-sns="panel" data-panel="weapon-use">Configurar ataque</button><button type="button" class="sns-btn" data-sns="conditions">Condições</button><button type="button" class="sns-btn" data-sns="panel" data-panel="recovery">Recuperação</button></div>${savedActionsView(actor)}<p class="sns-hint">Selecione o alvo no mapa e use a ação salva. A defesa será declarada no cartão do chat. Arraste uma ação para sua barra ou use Atalho.</p></div>`;
}
export function registerCombatHUD(){
 Hooks.on('getSceneControlButtons',controls=>{
  if(!controls.tokens?.tools)return;
  controls.tokens.tools.noShoCombat={name:'noShoCombat',title:'No Sho — HUD de combate',icon:'fa-solid fa-crosshairs',order:Object.keys(controls.tokens.tools).length,button:true,onChange:()=>game.noSho.hud.toggle()};
 });
 const refresh=()=>game.noSho?.hud?.refresh();
 Hooks.on('controlToken',()=>game.noSho?.hud?.follow());
 for(const hook of ['updateActor','deleteActor','createItem','updateItem','deleteItem','updateToken','deleteToken','canvasReady'])Hooks.on(hook,refresh);
 Hooks.on('updateUser',refresh);
}
