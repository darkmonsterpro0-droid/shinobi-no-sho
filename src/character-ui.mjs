import {ACTOR_TYPES,ATTRIBUTES,COMBAT,ICONS} from './config.mjs';
import {extraResourceCards} from './extra-resource-ui.mjs';

// Presentation only. Fields and action names are the existing sheet contract.
export function sheetSidebar(actor,env,k){
 const {esc,field,button,rankField,lineageField,conditions,safeImage}=k,s=actor.system??{};
 const nc=actor.type==='character'?(env.isGM?button('NC '+esc(s.campaign?.level??'—'),'allocation','aria-label="Abrir evolução e distribuição de atributos"'):`<strong>NC ${esc(s.campaign?.level??'—')}</strong>`):field('Nível de Campanha','system.campaign.level',s.campaign?.level,'number');
 return `<aside class="sns-dossier" aria-label="Identidade e condições"><button type="button" class="sns-portrait" data-sns="portrait" aria-label="Alterar retrato de ${esc(actor.name)}"><img src="${esc(safeImage(actor.img,ICONS[actor.type]))}" alt="Retrato de ${esc(actor.name)}"><span>Alterar retrato</span></button><div class="sns-dossier-name">${field('Personagem','name',actor.name)}<span class="sns-kicker">${esc(ACTOR_TYPES[actor.type]??'Ficha')}</span></div><div class="sns-dossier-level">${nc}${s.campaign?.draft?'<span class="sns-badge">Rascunho</span>':''}</div><div class="sns-dossier-fields">${rankField('system.identity.rank',s.identity?.rank)}${lineageField('system.identity.clan',s.identity?.clan)}${field('Vila','system.identity.village',s.identity?.village)}</div><section class="sns-dossier-conditions"><header><h3>Condições</h3>${button('Gerenciar','conditions','','small')}</header>${conditions(s)}</section><div class="sns-dossier-tools">${button('Abrir HUD de combate','panel','data-panel="combat-hud"','primary')}${button('Fontes da mesa','sources','','small')}</div></aside>`;
}

export function sheetResourceHeader(actor,k){
 const {resource,field}=k,s=actor.system??{};
 const extras=extraResourceCards(actor,{header:true,editable:true});
 if(actor.type==='puppet')return `<section class="sns-sheet-resources sns-structure-header" aria-label="Estrutura da marionete">${field('Dureza','system.structure.hardness',s.structure?.hardness,'number')}${field('Absorção atual','system.structure.absorption.value',s.structure?.absorption?.value,'number')}${field('Absorção máxima','system.structure.absorption.max',s.structure?.absorption?.max,'number')}${field('Espaços de dispositivos','system.structure.slots',s.structure?.slots)}</section>${extras}`;
 return `<div class="sns-sheet-resources" aria-label="Recursos do personagem">${resource('Vitalidade','vitality',s.resources?.vitality,'vitality',s.automation?.enabled)}${resource('Chakra','chakra',s.resources?.chakra,'chakra',s.automation?.enabled)}</div>${extras}`;
}

export function attributeCards(s,{button,esc}){
 const icons={for:'hand-fist',des:'crosshairs',agi:'person-running',per:'eye',int:'book-open',vig:'heart',esp:'circle-notch'};
 return `<div class="sns-attribute-cards">${Object.entries(ATTRIBUTES).map(([key,label])=>`<div class="sns-attribute-card"><span>${esc(label)}</span><i class="fa-solid fa-${icons[key]}" aria-hidden="true"></i><input type="number" step="any" name="system.attributes.${key}" ${s.automation?.enabled?'readonly':''} value="${esc(s.attributes?.[key])}" aria-label="${esc(label)}"><small>${key.toUpperCase()}</small>${s.automation?.enabled?button('Testar','roll-stat',`data-stat="${key}"`,'small'):''}</div>`).join('')}</div>`;
}

export function combatRows(s,{button,esc}){
 const icons={cc:'hand-fist',cd:'crosshairs',esq:'person-running',lm:'eye'};
 return `<div class="sns-combat-rows">${Object.entries(COMBAT).map(([key,label])=>`<div class="sns-combat-row"><i class="fa-solid fa-${icons[key]}" aria-hidden="true"></i><label><span>${esc(label)}</span><small>${key.toUpperCase()}</small><input type="number" step="any" name="system.combat.${key}" ${s.automation?.enabled?'readonly':''} value="${esc(s.combat?.[key])}" aria-label="${esc(label)}"></label>${s.automation?.enabled?button(key==='esq'?'Defesa':'Testar','roll-stat',`data-stat="${key}"`,'small'):''}</div>`).join('')}</div><p class="sns-hint sns-combat-reference">Ataques: 2d8 + precisão. Esquiva: dificuldade fixa 9 + ESQ.</p>`;
}

function quickReferences(items,{button,esc},empty){
 if(!items.length)return `<p class="sns-quiet">${empty}</p>`;
 return `<ul class="sns-quick-references">${items.slice(0,5).map(i=>{
  const action=i.type==='aptitude'&&i.system?.catalogKey?'aptitude-use':i.type==='power'&&i.system?.powerData?.family?'power-use':i.type==='equipment'&&i.system?.inventoryData?.kind?'inventory-use':i.type==='equipment'&&i.system?.catalogKey&&!['arrows','bolts','bullets'].includes(i.system.catalogKey)?'weapon-use':'edit-item';
  return `<li>${button(esc(i.name),action,`data-id="${esc(i.id)}"`,'small')}${i.type==='equipment'?`<span>× ${esc(i.system?.quantity??'—')}</span>`:''}</li>`;
 }).join('')}</ul>`;
}

export function sheetSummary(actor,env,k){
 const {block,button,field,area,esc,actions,links,savedActionsView}=k,s=actor.system??{},items=actor.items??[],budgets=env.budgets;
 const familiar=items.filter(i=>['power','aptitude','technique'].includes(i.type)),equipment=items.filter(i=>['equipment','device'].includes(i.type));
 const counters=[['Atributos',s.advancement?.attributesAvailable,'disponíveis'],['Perícias',budgets.skills.remaining,'disponíveis'],['Poderes',budgets.powers.remaining,'disponíveis']];
 return `${actor.clone?`<aside class="sns-block sns-clone-notice"><strong>Clone</strong><p>${actor.clone.automaticCombatFailure?'Falha automática em testes de combate.':'−3 nos testes, fora do limite comum de penalidades.'}</p>${button('Desfazer clone','dismiss-clone')}</aside>`:''}<div class="sns-summary-grid"><div class="sns-summary-main">${actor.type!=='puppet'?block('Atributos',attributeCards(s,k),'cubes'):''}<div class="sns-summary-combat">${block('Habilidades de combate',combatRows(s,k),'khanda')}${block('Movimento',`${field('Deslocamento (m)','system.movement.distance',s.movement?.distance,'number',s.automation?.enabled?'readonly':'')}${field('Voo (m, conforme a fonte)','system.movement.flight',s.movement?.flight,'number','min="0"')}`,'person-walking')}</div>${block('Ações da rodada',actions(s),'hand')}${actor.type!=='character'?block('Vínculos',links(s,env.actors),'link'):''}${actor.type==='character'?`<section class="sns-block sns-point-overview" aria-label="Pontos disponíveis">${counters.map(([label,value,hint])=>`<div><span>${label}</span><strong>${esc(value??'—')}</strong><small>${hint}</small></div>`).join('')}</section>`:''}${block('Notas do personagem',area('Anotações','system.notes',s.notes,3),'note-sticky')}</div><aside class="sns-summary-rail" aria-label="Acesso rápido">${savedActionsView(actor)}${block('Poderes e aptidões',quickReferences(familiar,k,'Nenhum poder ou aptidão cadastrado.'),'award',button('Ver todos','tab','data-tab="techniques"','small'))}${block('Equipamento',quickReferences(equipment,k,'Nenhum equipamento cadastrado.'),'suitcase',button('Ver todos','tab','data-tab="equipment"','small'))}<section class="sns-block sns-sheet-shortcuts"><header><h3>Consultar ficha</h3></header>${button('Perícias','tab','data-tab="skills"')}${button('Ações sociais','tab','data-tab="social"')}${button('História','tab','data-tab="history"')}</section></aside></div>`;
}
