export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// View models contain labels and values supplied by the active rules adapter.
export function actionRows(entries,{all=false,prefix='sns'}={}){
 const e=escapeHTML,b=(label,op,id,extra='')=>`<button type="button" class="${prefix}-btn" data-${prefix}="${op}" data-id="${e(id)}" ${extra}>${label}</button>`;
 return entries.map(x=>`<article class="${prefix}-saved-row"><button type="button" class="${prefix}-btn primary" data-${prefix}="action-use" data-id="${e(x.id)}" data-${prefix}-saved-drag="${e(x.id)}" draggable="true" title="Usar ação; arraste para a barra de atalhos">${e(x.name)}</button><div class="${prefix}-toolbar">${b('Alterar só desta vez','action-once',x.id)}${b('Editar','action-edit',x.id)}${b('Atalho','action-shortcut',x.id)}${all?b(x.favorite?'Retirar dos favoritos':'Favoritar','action-favorite',x.id,`aria-pressed="${!!x.favorite}"`)+b('Duplicar','action-duplicate',x.id)+b('Excluir','action-delete',x.id):''}</div></article>`).join('');
}
export function resourceReadouts(resources,{prefix='sns'}={}){
 const e=escapeHTML;return `<dl class="${prefix}-hud-resources">${resources.map(r=>`<div><dt>${e(r.label)}</dt><dd>${e(r.value)} / ${e(r.max)}</dd></div>`).join('')}</dl>`;
}
export function manualMarkers(markers,{prefix='sns'}={}){
 const e=escapeHTML;return `<div class="${prefix}-actions">${markers.map(m=>`<label><input type="checkbox" name="${e(m.path)}" ${m.checked?'checked':''}> ${e(m.label)}</label>`).join('')}</div><small>Marcação manual · não consome ou renova ações.</small>`;
}
