import {escapeHTML as esc} from './core/action-controls.mjs';
import {editableResource} from './core/extra-resources.mjs';
import {extraResources} from './extra-resources.mjs';

export function extraResourceCards(actor,{header=false,editable=false}={}){
 const resources=extraResources.list(actor).filter(r=>!header||r.resourceData.showOnSheet);
 if(!resources.length)return '';
 return `<section class="sns-extra-resources" aria-label="Recursos específicos">${header?'<header><h3>Recursos específicos</h3><button type="button" class="sns-btn small" data-sns="resources">Gerenciar</button></header>':''}<div class="sns-extra-resource-grid">${resources.map(r=>{
  const data=r.resourceData,canEdit=editable&&editableResource(r),value=r.value??'—',max=r.max??'—';
  return `<article class="sns-extra-resource"><header><div><h4>${esc(r.name)}</h4>${r.source?`<small>${esc(r.source)}</small>`:''}${!data.showOnSheet?'<small>Oculto na ficha</small>':''}</div>${editableResource(r)?`<button type="button" class="sns-btn small" data-sns="special" data-id="${esc(r.id)}">Editar</button>`:'<small>Versão não suportada</small>'}</header><div class="sns-extra-resource-amount">${canEdit?`<label class="sns-field"><span>Atual · ${esc(r.name)}</span><input type="number" step="any" name="extraResource.${esc(r.id)}.value" value="${esc(r.value??'')}" ${r.max===null||r.max===undefined?'':`max="${esc(r.max)}"`} aria-label="Valor atual de ${esc(r.name)}"></label>`:`<strong>${esc(value)}</strong>`}<span> / ${esc(max)} ${esc(data.unit)}</span></div><details><summary>Ver usos e efeitos</summary><dl><dt>Usos anotados</dt><dd>${esc(data.uses||'Nenhum uso anotado.')}</dd><dt>Benefícios anotados</dt><dd>${esc(data.benefits||'Nenhum benefício anotado.')}</dd>${r.notes?`<dt>Observações</dt><dd>${esc(r.notes)}</dd>`:''}</dl><p>Controle manual. As anotações não aplicam efeitos.</p></details></article>`;
 }).join('')}</div></section>`;
}
export function extraResourceEditor(v,k){
 const {field,area,check}=k,data=v.resourceData??{};
 return `${field('Nome do recurso','entry.name',v.name)}<div class="sns-form-grid">${field('Atual','entry.value',v.value,'number')}${field('Máximo (opcional)','entry.max',v.max,'number','min="0"')}</div>${field('Unidade (pontos, cargas…)','entry.resourceData.unit',data.unit)}${field('Origem / referência','entry.source',v.source)}${check('Mostrar na faixa de recursos da ficha','entry.resourceData.showOnSheet',data.showOnSheet??true)}${area('Usos anotados','entry.resourceData.uses',data.uses,3)}${area('Benefícios anotados (não são aplicados)','entry.resourceData.benefits',data.benefits,3)}${area('Observações','entry.notes',v.notes,3)}<p class="sns-manual">Cadastro manual. Nenhuma aptidão é ativada e nenhum valor é aplicado à Vitalidade ou ao Chakra.</p>`;
}
