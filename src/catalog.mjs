import {targetFields} from './saved-actions.mjs';
import {sizeProfile} from './physical-rules.mjs';
import {availableManeuvers} from './maneuvers.mjs';
import {ID,ICONS,SOURCES} from './config.mjs';
import {WEAPONS,WEAPON_CATEGORIES} from './weapons.mjs';
import {aptitudeCatalog,aptitudeChoices,prerequisiteStatus,aptitudeOwned,evolutionStatus} from './aptitudes.mjs';
import {pointBudgets} from './build-rules.mjs';
import {houseRules} from './automation.mjs';
import {readFields} from './interactions.mjs';
export const CATALOG_ACTIONS=new Set(['catalog','catalog-add','weapon-use','weapon-roll','weapon-reload','aptitude-evolve']);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(object,selected)=>Object.entries(object).map(([key,name])=>`<option value="${escape(key)}"${key===selected?' selected':''}>${escape(name)}</option>`).join('');
export {weaponDocument} from './weapon-actions.mjs';
import {weaponDocument,needsReload} from './weapon-actions.mjs';
export function catalogView(env={}){
 const kind=env.catalog??'weapons',actor=env.actor,system=actor?.system??{},items=actor?.items??[],books=env.profile?.books??['basico','avancado'],rules=env.houseRules??{};
 const entries=kind==='weapons'?WEAPONS.filter(w=>books.includes(w.book)):aptitudeCatalog(books,rules);
 return `<p>Escolha ${kind==='weapons'?'uma arma comum':'uma aptidão comum'}. O registro será guardado nesta ficha.</p><label class="sns-field"><span>Buscar no catálogo</span><input type="search" data-sns-search placeholder="Digite parte do nome"></label><small data-filter-count></small><div class="sns-catalog">${entries.map(e=>{
  const status=kind==='aptitudes'?prerequisiteStatus(e,system,items,rules):null,choices=kind==='aptitudes'?aptitudeChoices(e.key,e.book,WEAPONS,items):null;
  return `<article class="sns-block" data-search="${escape(e.name.toLocaleLowerCase('pt-BR'))}"><header><h3>${escape(e.name)}</h3><small>${escape(SOURCES[e.book])} p. ${e.page}</small></header>${kind==='weapons'?`<p>${escape(WEAPON_CATEGORIES[e.category])} · ${e.simple?'Simples':'Marcial'} · Dano de arma +${e.damage} · ${escape(e.damageType)}</p>`:`<p>Pré-requisitos: ${escape(e.requirements||'Nenhum')}${status?.review?' · Conferência do mestre necessária.':''}</p>${choices?`<label class="sns-field"><span>Escolha de ${escape(e.name)}</span><select name="catalog.${e.book}.${e.key}.selection">${options(choices)}</select></label>`:''}<label class="sns-field"><span>Aquisição de ${escape(e.name)}</span><select name="catalog.${e.book}.${e.key}.acquisition">${options({'Comprada':'Comprar por 2 pontos',...(e.free?{'Gratuita':'Aptidão inicial gratuita'}:{}),...(env.isGM?{'Concedida':'Concedida pelo mestre'}:{})})}</select></label>`}<button type="button" class="sns-btn primary" data-sns="catalog-add" data-catalog="${kind}" data-key="${escape(e.key)}" data-book="${e.book}">Adicionar ${escape(e.name)}</button></article>`;
 }).join('')}</div>`;
}
export function weaponUseView(env={}){
 const v={...env.options,...Object.fromEntries(Object.entries(env.values??{}).map(([k,v])=>[k.startsWith('weapon.')?k.slice(7):k,v]))};
 const item=weaponDocument(env.actor,env.itemId),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);
 const origin=`<label class="sns-field"><span>Arma desta ação</span><select name="weapon.itemId">${options({'unarmed':'Ataque desarmado',...Object.fromEntries((env.actor?.items??[]).filter(i=>i.type==='equipment'&&WEAPONS.some(w=>w.key===i.system.catalogKey&&w.book===i.system.catalogBook)).map(i=>[i.id,i.name]))},env.itemId)}</select></label>`;
 if(!w)return `${origin}<p>A origem não está disponível. Escolha uma arma explicitamente; a ação salva será preservada.</p>`;
 const select=(label,key,choices,initial)=>`<label class="sns-field"><span>${label}</span><select name="weapon.${key}">${options(choices,String(v[key]??initial??''))}</select></label>`;
 const check=(label,key)=>`<label class="sns-check"><input type="checkbox" name="weapon.${key}" ${v[key]?'checked':''}>${label}</label>`;
 return `${origin}<h3>${escape(w.name)}</h3><div class="sns-form-grid">
 ${select('Manobra','maneuver',availableManeuvers(env.actor?.items??[],env.houseRules??{}),env.maneuver??'golpear')}
 ${select('Ataques (Múltiplo)','count',{2:'Dois',3:'Três'},2)}
 ${select('Modo','mode',{...w.melee?{melee:'Corpo a corpo'}:{},...w.range?{ranged:'À distância'}:{}},w.melee?'melee':'ranged')}
 <label class="sns-field"><span>Distância até o alvo (m)</span><input type="number" min="0" value="${escape(v.distance??1)}" name="weapon.distance"></label>
 ${['kunai','shuriken','senbon'].includes(w.key)?select('Projéteis','units',{...aptitudeOwned(env.actor?.items??[],'arremessador-eficiente')?{1:'1 projétil — 1 mão',2:'2 projéteis — 2 mãos'}:{},3:'3 projéteis — 1 mão',6:'6 projéteis — 2 mãos'},3):''}
 ${(env.actor?.system.powerState?.active??[]).some(a=>a.electricMode==='blade'&&a.weaponId===item.id)?select('Estender lâmina elétrica até 5 m','electricStat',{'':'Ataque normal',cc:'Estender: CC',cd:'Estender: CD'},''):''}
 ${w.double?check('Usar ambas as extremidades / par','dual'):''}
 ${sizeProfile(env.actor?.system??{}).index>=7?check('Golpear alvos menores à frente','sizeSweep'):''}
 ${check('Mão inábil','offhand')}
 ${v.maneuver==='rasteira'?check('Usar com Derrubar Agressivo','aggressive'):''}
 ${v.maneuver==='golpe-carate'?check('Contra objeto (conferência manual)','object'):''}
 ${env.actor?.clone?select('Alvo do clone','targetKind',{normal:'Não-capanga',capanga:'Capanga'},'normal'):''}
 </div>${targetFields({...env,options:v,maneuver:v.maneuver??env.maneuver})}
 <p>Declare o ataque; o defensor ou o mestre escolhe a defesa no cartão antes dos dados. A marcação das ações continua manual.</p>
 ${needsReload(w)?`<p>${item.system.loaded?'Carregada':'Descarregada'}${item.system.damaged?' · Danificada (−1 CD)':''}</p><button type="button" class="sns-btn" data-sns="weapon-reload" data-id="${escape(item.id)}">Recarregar</button>`:''}
 <button type="button" class="sns-btn primary" data-sns="weapon-roll" data-id="${escape(item.id)}">Declarar ataque</button>
 <details><summary>${env.presetId?'Editar ação salva':'Salvar esta configuração'}</summary><label class="sns-field"><span>Nome da ação</span><input name="action.name" maxlength="100" value="${escape(v['action.name']??env.presetName??w.name)}"></label><button type="button" class="sns-btn" data-sns="action-save">${env.presetId?'Salvar alterações':'Salvar como ação'}</button></details>`;
}

const ammunition=w=>w.category==='firearm'?'bullets':w.key==='hidden-shooter'?'senbon':w.key.includes('crossbow')?'bolts':'arrows';
export async function catalogAction(app,op,data,root,{actor,show}){
 if(!actor?.isOwner)throw Error('Abra o catálogo a partir de uma ficha que você possa editar.');
 if(op==='catalog')return show('catalog',{actor,catalog:data.catalog});
 if(op==='weapon-use')return show('weapon-use',{actor,itemId:data.id,maneuver:data.maneuver});
 const items=[...actor.items],rules=houseRules(),profile=game.settings.get(ID,'profile');
 if(op==='aptitude-evolve'){const item=actor.items.get(data.id);if(!item||item.type!=='aptitude')throw Error('Aptidão não encontrada.');const e=evolutionStatus(item,actor.system,items,rules);if(!e.allowed)throw Error('Requisitos de evolução não atendidos.');if(pointBudgets(actor.system,items,rules).powers.remaining<2)throw Error('A evolução custa 2 pontos de poder.');await item.update({'system.level':e.next});ui.notifications.info(`${item.name}: nível ${e.next}.`);return app.render({force:true});}
 if(op==='catalog-add'){
  const weapon=data.catalog==='weapons';const entry=weapon?WEAPONS.find(w=>w.key===data.key&&w.book===data.book):aptitudeCatalog(profile.books,rules).find(a=>a.key===data.key&&a.book===data.book);
  if(!entry||!profile.books.includes(entry.book))throw Error('Esta opção não está habilitada nos livros da mesa.');
  const fields=readFields(root,`catalog.${data.book}.${data.key}.`),prefix=`catalog.${data.book}.${data.key}.`,selection=fields[prefix+'selection']??'',acquisition=fields[prefix+'acquisition']??'Comprada';
  if(!weapon){
   if(!['Comprada','Gratuita','Concedida'].includes(acquisition))throw Error('Aquisição inválida.');
   if(acquisition==='Concedida'&&!game.user.isGM)throw Error('Somente o mestre concede aptidões.');
   if(aptitudeOwned(items,entry.key,selection,rules))throw Error('Esta aptidão já está na ficha com a mesma escolha.');
   const choices=aptitudeChoices(entry.key,entry.book,WEAPONS,items);if(choices&&!Object.hasOwn(choices,selection))throw Error('Escolha inválida.');
   const status=prerequisiteStatus(entry,actor.system,items,rules,selection);
   if(acquisition!=='Concedida'&&status.allowed===false)throw Error('Pré-requisitos não atendidos: '+entry.requirements);
   if(acquisition!=='Concedida'&&status.review&&!game.user.isGM)throw Error('O mestre precisa conferir os pré-requisitos desta aptidão.');
   const budget=pointBudgets(actor.system,items,rules);
   if(acquisition==='Gratuita'&&(!entry.free||budget.free.spent>=3))throw Error('Não há escolha inicial gratuita disponível para esta aptidão.');
   if(acquisition==='Comprada'&&budget.powers.remaining<2)throw Error('Faltam pontos de poder: esta compra custa 2.');
  }
  await actor.createEmbeddedDocuments('Item',[{name:entry.name,type:weapon?'equipment':'aptitude',img:ICONS[weapon?'equipment':'aptitude'],system:{catalogKey:entry.key,catalogBook:entry.book,source:{book:entry.book,page:String(entry.page)},selection,acquisition,level:1,quantity:1,active:true,prerequisites:entry.requirements??'',...(weapon?{damage:String(entry.damage),damageType:entry.damageType,critical:String(entry.critical),range:String(entry.range),compartments:`${entry.capacity} item(ns) / ${entry.slots} compartimento(s)`}:{})}}]);
  ui.notifications.info(`${entry.name} adicionado à ficha.`);return app.render({force:true});
 }
 if(op==='weapon-reload'){
  const item=actor.items.get(data.id),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);if(!w||!needsReload(w))throw Error('Esta arma não usa recarga.');
  if(item.system.destroyed)throw Error('Arma destruída.');if(item.system.loaded)throw Error('A arma já está carregada.');
  const cost=w.key==='hidden-shooter'?3:1,ammo=items.find(i=>i.system.catalogKey===ammunition(w)&&Number(i.system.quantity??0)>=cost);if(!ammo)throw Error('Munição insuficiente.');
  await ammo.update({'system.quantity':Number(ammo.system.quantity)-cost});await item.update({'system.loaded':true});
  const quick=!!aptitudeOwned(items,'saque-rapido'),action=w.category==='firearm'?'Movimento':w.key==='heavy-crossbow'?(quick?'Movimento':'Padrão'):w.key==='hidden-shooter'?(quick?'Livre':'Parcial'):(quick?'Parcial':'Movimento');
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>${escape(w.name)} recarregada: ação ${action.toLowerCase()}. Munição consumida: ${cost}.</p>`});return app.render({force:true});
 }
 if(op==='weapon-roll'){
  const fields=readFields(root,'weapon.'),options=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k.slice(7),v]));
  const {declareWeaponFromForm}=await import('./saved-actions.mjs');
  await declareWeaponFromForm(actor,data.id,options,app);return;
 }
}
