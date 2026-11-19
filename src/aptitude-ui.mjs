import {clanCapabilities} from './clan-capabilities.mjs';
import {aptitudeRuleDetails} from './aptitude-reference.mjs';
import {USE_FIELDS} from './aptitude-forms.mjs';
import {cloneView} from './clone-actions.mjs';
import {aptitudeUsePlan} from './aptitude-use.mjs';
import {MANEUVERS} from './maneuvers.mjs';
import {SOURCES} from './config.mjs';
import {restrictedDefinition} from './restricted-aptitudes.mjs';
import {restrictedUseView} from './restricted-ui.mjs';
export const TECHNIQUE_APTITUDES=['dominio-da-agua','dominio-do-fogo','dominio-do-raio','dominio-da-terra','dominio-do-vento','dominio-ninpou','ilusao-profunda','potencializar','tecnica-acelerada','tecnica-eficiente','tecnica-elevada','tecnica-poderosa','dominio-simples','dominio-mecanico','ilusao-musical','mestre-da-criacao','tecnica-de-controle-de-chakra','tecnica-de-cura-arriscada','tecnica-de-impacto','maestria'];
export function aptitudeUseView(env,helpers){
 const {esc,field,select,button}=helpers,item=env.actor?.items?.find(i=>i.id===env.itemId);if(!item)return '<p>Aptidão não encontrada.</p>';
 if(restrictedDefinition(item.system.catalogKey,item.system.catalogBook))return restrictedUseView(env,item);
 const key=item.system.catalogKey,active=env.actor?.aptitudeStates?.[key],definitions=USE_FIELDS[key],values=env.values??{};
 let content=(env.mindControl?'<label><input type="checkbox" name="aptitude.mindNature"> Ação contrária à natureza</label><label><input type="checkbox" name="aptitude.mindSuicidal"> Ação suicida · cancelar antes de agir</label>':'')+`<h3>${esc(item.name)} · nível ${item.system.level??1}</h3><p class="sns-source">${esc(SOURCES[item.system.catalogBook])} · p. ${esc(item.system.source?.page)}</p>`;
 content+=aptitudeRuleDetails(key,item.system.catalogBook,esc,item.system.description);
 if(key==='fascinar')content+='<p class="sns-hint">Marque um alvo no mapa. Fascinar comum alcança 5 m. Olhar Hipnótico alcança 9 m e exige contato visual.</p>';
 if(key==='miragem'){
  const entries=(env.actor.mirages??[]).filter(([,entry])=>entry.itemId===item.id);
  if(entries.length)content+='<h4>Miragens na cena</h4>'+entries.map(([id,entry])=>
   `<p><strong>${esc(entry.image)}</strong> · ${esc(entry.point)} · ${entry.mobile?'Sustentada':'Contínua'} ${button('Cancelar (Livre)','end-mirage',`data-id="${esc(item.id)}" data-mirage="${esc(id)}"`)}</p>`).join('');
 }
 if(key==='clone')return content+cloneView(env.actor,item,helpers,values);
 if(active)content+=`<p role="status">Ativa${active.choice?': '+esc(active.choice):''}.</p>${button('Encerrar efeito','end-aptitude',`data-id="${esc(item.id)}"`)}`;
 if(definitions){content+=`<div class="sns-form-grid">${definitions.map(([name,label,type])=>typeof type==='object'?select(label,'aptitude.'+name,values[name]??Object.keys(type)[0],type):field(label,'aptitude.'+name,values[name]??(type==='number'?1:''),type,type==='number'?'min="0"':'')).join('')}</div>`;
  try{const defaults=Object.fromEntries(definitions.map(([k,,t])=>[k,values[k]??(typeof t==='object'?Object.keys(t)[0]:t==='number'?1:'')])),plan=aptitudeUsePlan(item,env.actor.system,env.actor.items,defaults,env.houseRules);content+=`<p>Ação: ${esc(plan.action)}${plan.cost?' · Chakra: '+plan.cost:''}</p><ul>${plan.notes.map(n=>'<li>'+esc(n)+'</li>').join('')}</ul>`;}catch(error){content+=`<p class="sns-hint">${esc(error.message)}</p>`;}
  if(clanCapabilities(env.actor,{books:env.profile?.books,rules:env.houseRules}).corpulenciaId)content+=`<details><summary>Corpulência · pagar com Vitalidade</summary>${field('Chakra substituído por 2 Vitalidade','aptitude.convertedChakra',values.convertedChakra??0,'number','min="0" step="1"')}</details>`;
  content+=button('Usar aptidão','execute-aptitude',`data-id="${esc(item.id)}"`,'primary');return content;
 }
 if(key==='dominio-da-agua')content+=`<p>Pontos de água próprios nesta cena: <strong>${env.actor.aptitudeWater??0}</strong></p>${button('Descartar pontos de água','clear-water')}`;
 if(TECHNIQUE_APTITUDES.includes(key)){content+='<p>Escolha a técnica ou poder cujos parâmetros serão usados nesta execução.</p>';content+=env.actor.items.filter(i=>['power','technique'].includes(i.type)).map(i=>button(esc(i.name),'prepare-technique',`data-id="${esc(i.id)}" data-aptitude="${esc(item.id)}"`)).join('');return content;}
 if(MANEUVERS[key]){content+='<p>Escolha a arma para preparar esta manobra.</p>'+button('Ataque desarmado','weapon-use',`data-id="unarmed" data-maneuver="${key}"`);content+=env.actor.items.filter(i=>i.type==='equipment'&&i.system.catalogKey).map(i=>button(esc(i.name),'weapon-use',`data-id="${esc(i.id)}" data-maneuver="${key}"`)).join('');}
 return content;
}
