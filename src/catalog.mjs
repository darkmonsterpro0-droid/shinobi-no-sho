import {hachimonProfile} from './hachimon-rules.mjs';
import {clanCapabilities} from './clan-capabilities.mjs';
import {equipmentArt} from './equipment-art.mjs';
import {aptitudeReference,aptitudeRuleDetails} from './aptitude-reference.mjs';
import {OCTOGRAMS} from './weapon-actions.mjs';
import {worldProfile} from './world-settings.mjs';
import {targetFields} from './saved-actions.mjs';
import {sizeProfile} from './physical-rules.mjs';
import {availableManeuvers,throwingAptitude} from './maneuvers.mjs';
import {ID,ICONS,SOURCES} from './config.mjs';
import {WEAPONS,WEAPON_CATEGORIES} from './weapons.mjs';
import {aptitudeCatalog,aptitudeChoices,prerequisiteStatus,aptitudeOwned,evolutionStatus} from './aptitudes.mjs';
import {pointBudgets} from './build-rules.mjs';
import {houseRules} from './automation.mjs';
import {readFields} from './interactions.mjs';
import {restrictedDefinition} from './restricted-aptitudes.mjs';
import {restrictedCatalogView} from './restricted-ui.mjs';
export const CATALOG_ACTIONS=new Set(['catalog','catalog-add','weapon-use','weapon-roll','weapon-reload','aptitude-evolve']);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(object,selected)=>Object.entries(object).map(([key,name])=>`<option value="${escape(key)}"${key===selected?' selected':''}>${escape(name)}</option>`).join('');
export {weaponDocument} from './weapon-actions.mjs';
import {weaponDocument,needsReload} from './weapon-actions.mjs';
export function catalogView(env={}){
 if(env.catalog==='restricted')return restrictedCatalogView(env);
 const kind=env.catalog??'weapons',actor=env.actor,system=actor?.system??{},items=actor?.items??[],books=env.profile?.books??['basico','avancado'],rules=env.houseRules??{};
 if(kind==='weapons')return `<label class="sns-field"><span>Buscar arma</span><input type="search" data-sns-search placeholder="Digite parte do nome"></label><small data-filter-count role="status"></small><div class="sns-gear-ledger">${WEAPONS.filter(w=>books.includes(w.book)).map(e=>`<article class="sns-gear-record sns-weapon-record" data-search="${escape(e.name.toLocaleLowerCase('pt-BR'))}"><img src="${equipmentArt(e.key)}" alt="" loading="lazy"><header><h3>${escape(e.name)}</h3><small>${escape(WEAPON_CATEGORIES[e.category])} · ${e.simple?'Simples':'Marcial'}</small><small>${escape(SOURCES[e.book])} · p. ${e.page}</small></header><div class="sns-gear-metric">${e.category==='ammo'?'Munição':`<strong>${e.damage>=0?'+':''}${e.damage}</strong><small>${escape(e.damageType)}</small>`}</div><button type="button" class="sns-btn primary small" data-sns="catalog-add" data-catalog="weapons" data-key="${escape(e.key)}" data-book="${e.book}" aria-label="Adicionar ${escape(e.name)}">Adicionar</button></article>`).join('')}</div>`;
 const entries=aptitudeCatalog(books,rules);
 return `<p>Escolha uma aptidão comum. O registro será guardado nesta ficha.</p><label class="sns-field"><span>Buscar no catálogo</span><input type="search" data-sns-search placeholder="Digite parte do nome"></label><small data-filter-count></small><div class="sns-catalog sns-catalog-ledger">${entries.map(e=>{
  const status=prerequisiteStatus(e,system,items,rules),choices=aptitudeChoices(e.key,e.book,WEAPONS,items);
  return `<article class="sns-block" data-search="${escape(e.name.toLocaleLowerCase('pt-BR'))}"><header><h3>${escape(e.name)}</h3><small>${escape(SOURCES[e.book])} p. ${e.page}</small></header><p class="sns-aptitude-brief">${escape(aptitudeReference(e.key,e.book).brief)}</p>${aptitudeRuleDetails(e.key,e.book,escape)}<details class="sns-acquire-options"><summary>Opções de aquisição</summary><p>Pré-requisitos: ${escape(e.requirements||'Nenhum')}${status?.review?' · Conferência do mestre necessária.':''}</p>${choices?`<label class="sns-field"><span>Escolha de ${escape(e.name)}</span><select name="catalog.${e.book}.${e.key}.selection">${options(choices)}</select></label>`:''}<label class="sns-field"><span>Aquisição de ${escape(e.name)}</span><select name="catalog.${e.book}.${e.key}.acquisition">${options({'Comprada':'Comprar por 2 pontos',...(e.free?{'Gratuita':'Aptidão inicial gratuita'}:{}),...(env.isGM?{'Concedida':'Concedida pelo mestre'}:{})})}</select></label><button type="button" class="sns-btn primary" data-sns="catalog-add" data-catalog="${kind}" data-key="${escape(e.key)}" data-book="${e.book}">Adicionar ${escape(e.name)}</button></details></article>`;
 }).join('')}</div>`;
}
export function weaponUseView(env={}){
 const v={...env.options,...Object.fromEntries(Object.entries(env.values??{}).map(([k,v])=>[k.startsWith('weapon.')?k.slice(7):k,v]))};
 const item=weaponDocument(env.actor,env.itemId),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);
 const origin=env.itemId==='unarmed'&&!(env.actor?.items??[]).some(i=>i.type==='equipment'&&i.system.catalogKey!=='unarmed'&&WEAPONS.some(w=>w.key===i.system.catalogKey&&w.book===i.system.catalogBook))?'<input type="hidden" name="weapon.itemId" value="unarmed">':`<label class="sns-field"><span>Arma desta ação</span><select name="weapon.itemId">${options({'unarmed':'Ataque desarmado',...Object.fromEntries((env.actor?.items??[]).filter(i=>i.type==='equipment'&&WEAPONS.some(w=>w.key===i.system.catalogKey&&w.book===i.system.catalogBook)).map(i=>[i.id,i.name]))},env.itemId)}</select></label>`;
 if(!w)return `${origin}<p>A origem não está disponível. Escolha uma arma explicitamente; a ação salva será preservada.</p>`;
 const select=(label,key,choices,initial,selected=v[key]??initial)=>`<label class="sns-field"><span>${label}</span><select name="weapon.${key}">${options(choices,String(selected??''))}</select></label>`;
 const check=(label,key)=>`<label class="sns-check"><input type="checkbox" name="weapon.${key}" ${v[key]?'checked':''}>${label}</label>`;
 const mode=w.melee&&w.range?(v.mode??'melee'):(w.melee?'melee':'ranged');
 const maneuvers=availableManeuvers(env.actor?.items??[],env.houseRules??{},w,mode);
 const requested=v.maneuver??env.maneuver??'golpear';
 const maneuver=Object.hasOwn(maneuvers,requested)?requested:'golpear';
 const multiple=!v.octogram&&(v.twinLions||['ataque-multiplo','ataque-progressivo','soco-em-gancho'].includes(maneuver));
 const juuken=w.key==='unarmed'?(env.actor?.items??[]).find(i=>i.type==='power'&&i.system.powerData?.family==='juuken'):null;
 const octograms=Object.entries(OCTOGRAMS).filter(([,entry])=>entry.level<=Number(juuken?.system.level));
 return `<div class="sns-attack-order"><h3>${escape(w.name)}</h3><div class="sns-form-grid">
 ${octograms.length?select('Sequência do Octograma','octogram',{'':'Nenhuma',...Object.fromEntries(octograms.map(([key])=>[key,key+' Pontos do Octograma']))},''):''}
 ${maneuver==='golpear'?check('Golpe de Misericórdia (Completa)','mercy'):''}
 ${v.mercy&&maneuver==='golpear'?select('Se o alvo falhar em Vigor','mercyOutcome',{knockout:'Nocautear',kill:'Matar'},'knockout'):''}
 ${mode==='melee'?check('Lutar na defensiva','fightDefensively'):''}
 ${hachimonProfile(env.actor?.system)?.gate>=2?check('Ataque Pesado · fecha os Portões','hachimonHeavy'):''}
 ${w.key==='unarmed'&&maneuver==='golpear'&&env.activeAptitudes?.['kyoudo-kyouka']?check('Liberar Kyoudo Kyouka','kyoudo'):''}
 ${Number(juuken?.system.level)>=7?check('Usar Punho dos Leões Gêmeos','twinLions'):''}
 ${v.twinLions?'<p>Dois golpes usam ação padrão. Três golpes usam ação completa.</p>':v.octogram?'<p>Três golpes no mesmo alvo com Ataque Múltiplo.</p>':select('Manobra','maneuver',maneuvers,maneuver,maneuver)}
 ${multiple?select('Quantidade de golpes','count',{2:'Dois',3:'Três'},2):''}
 ${w.melee&&w.range?select('Modo','mode',{melee:'Corpo a corpo',ranged:'À distância'},mode):`<input type="hidden" name="weapon.mode" value="${w.melee?'melee':'ranged'}">`}

 ${mode==='ranged'&&['kunai','shuriken','senbon'].includes(w.key)?select('Projéteis','units',{...aptitudeOwned(env.actor?.items??[],'arremessador-eficiente')?{1:'1 projétil — 1 mão',2:'2 projéteis — 2 mãos'}:{},3:'3 projéteis — 1 mão',6:'6 projéteis — 2 mãos'},3):''}
 ${(env.actor?.system.powerState?.active??[]).some(a=>a.electricMode==='blade'&&a.weaponId===item.id)?select('Estender lâmina elétrica até 5 m','electricStat',{'':'Ataque normal',cc:'Estender: CC',cd:'Estender: CD'},''):''}
 ${w.double?check('Usar ambas as extremidades / par','dual'):''}
 ${sizeProfile(env.actor?.system??{}).index>=7?check('Golpear alvos menores à frente','sizeSweep'):''}
 ${w.key==='unarmed'&&(env.actor?.items??[]).some(i=>i.type==='power'&&i.system.powerData?.family==='juuken')?check('Usar Juuken (exige Byakugan ativo)','juuken'):''}
 ${w.key==='unarmed'&&(env.actor?.system.powerState?.active??[]).some(a=>a.effect==='shikakyu'&&a.active!==false)?check('Usar garras e mordida de Shikakyu','shikakyu'):''}
 ${w.key==='unarmed'&&(env.actor?.items??[]).some(i=>i.type==='aptitude'&&i.system.catalogKey==='res-basico-kidaichuu')?select('Espécie do ataque de insetos','insectSpecies',{kikaichuu:'Kikaichuu · grupos',kidaichuu:'Kidaichuu · insetos individuais'},'kikaichuu'):''}
 ${w.key==='unarmed'&&(env.actor?.items??[]).some(i=>i.type==='aptitude'&&i.system.catalogKey==='res-basico-kikaichuu')?`<label class="sns-field"><span>Insetos liberados para atacar (0 usa o ataque comum)</span><input type="number" name="weapon.insectGroups" min="0" step="1" value="${escape(v.insectGroups??0)}"></label>`:''}
 ${['derrubar','derrubar-agressivo','rasteira'].includes(maneuver)&&throwingAptitude(env.actor?.items??[],w,env.houseRules)?check('Arremessar ao derrubar','throwTarget'):''}
 ${maneuver==='rasteira'&&Object.hasOwn(maneuvers,'derrubar-agressivo')?check('Usar com Derrubar Agressivo','aggressive'):''}
 ${v.maneuver==='golpe-carate'?check('Contra objeto (conferência manual)','object'):''}
 ${env.actor?.clone||v.mercy?select('Tipo de alvo','targetKind',{normal:'Não-capanga',capanga:'Capanga'},'normal'):''}
 </div>${v.octogram&&clanCapabilities(env.actor,{books:env.profile?.books,rules:env.houseRules}).corpulenciaId?`<details><summary>Corpulência · pagar com Vitalidade</summary><label>Chakra substituído por 2 Vitalidade<input name="weapon.convertedChakra" type="number" min="0" max="10" step="1" value="${escape(v.convertedChakra??0)}"></label></details>`:''}${['agarrar','agarrar-agressivo'].includes(maneuver)&&w.key==='unarmed'?'<p class="sns-hint">Confirme que as duas mãos estão livres antes de declarar.</p>':''}<div class="sns-attack-targets">${targetFields({...env,values:{...env.values,'weapon.maneuver':maneuver},options:v,maneuver})}</div>
 ${env.hudInline?'':'<p class="sns-hint">O alvo escolhe a defesa antes da rolagem.</p>'}
 ${needsReload(w)?`<p>${item.system.loaded?'Carregada':'Descarregada'}${item.system.damaged?' · Danificada (−1 CD)':''}</p><button type="button" class="sns-btn" data-sns="weapon-reload" data-id="${escape(item.id)}">Recarregar</button>`:''}
 <div class="sns-attack-submit"><button type="button" class="sns-btn primary" data-sns="weapon-roll" data-id="${escape(item.id)}">Declarar ataque</button></div>
 ${env.hudInline?'':`<details class="sns-attack-options"${env.presetId?' open':''}><summary>${env.presetId?'Editar ação salva':'Outras opções'}</summary>${origin}${check('Mão inábil','offhand')}<label class="sns-field"><span>Nome da ação</span><input name="action.name" maxlength="100" value="${escape(v['action.name']??env.presetName??w.name)}"></label><button type="button" class="sns-btn" data-sns="action-save">${env.presetId?'Salvar alterações':'Salvar como ação'}</button></details>`}</div>`;
}

const ammunition=w=>w.category==='firearm'?'bullets':w.key==='hidden-shooter'?'senbon':w.key.includes('crossbow')?'bolts':'arrows';
export async function catalogAction(app,op,data,root,{actor,show}){
 if(!actor?.isOwner)throw Error('Abra o catálogo a partir de uma ficha que você possa editar.');
 if(op==='catalog')return show('catalog',{actor,catalog:data.catalog});
 if(op==='weapon-use')return show('weapon-use',{actor,itemId:data.id,maneuver:data.maneuver});
 const items=[...actor.items],rules=houseRules(),profile=worldProfile();
 if(op==='aptitude-evolve'&&restrictedDefinition(actor.items.get(data.id)?.system.catalogKey)){
  const {requestAction}=await import('./action-executions.mjs');await requestAction({op:'capability',operation:'evolve',actorUuid:actor.uuid,itemId:data.id});return app.render({force:true});
 }
 if(op==='catalog-add'&&data.catalog==='restricted'){
  const prefix=`catalog.${data.book}.${data.key}.`,values=readFields(root,prefix),get=k=>values[prefix+k];
  const {requestAction}=await import('./action-executions.mjs');await requestAction({op:'capability',operation:'acquire',actorUuid:actor.uuid,key:data.key,book:data.book,acquisition:get('acquisition'),selection:data.key==='res-basico-estilo-da-lotus'?[get('lotus1'),get('lotus2')].join('|'):get('selection'),accessOrigin:get('accessOrigin'),reviewReason:get('reviewReason')});return app.render({force:true});
 }
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
  await actor.createEmbeddedDocuments('Item',[{name:entry.name,type:weapon?'equipment':'aptitude',img:weapon?equipmentArt(entry.key):ICONS.aptitude,system:{catalogKey:entry.key,catalogBook:entry.book,source:{book:entry.book,page:String(entry.page)},selection,acquisition,level:1,quantity:1,active:true,prerequisites:entry.requirements??'',...(weapon?{damage:String(entry.damage),damageType:entry.damageType,critical:String(entry.critical),range:String(entry.range),compartments:`${entry.capacity} item(ns) / ${entry.slots} compartimento(s)`}:{})}}]);
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
  if(options.offhand===undefined&&app.panelConfig?.options?.offhand===true)options.offhand=true;
  if(app.panelConfig?.hudInline&&root.querySelector('input[type="hidden"][name="weapon.target1"]')){
   const {selectedTargets}=await import('./saved-actions.mjs');
   const marked=selectedTargets();
   options.target1=marked.length===1?marked[0]:null;
  }
  const {declareWeaponFromForm}=await import('./saved-actions.mjs');
  await declareWeaponFromForm(actor,data.id,options,app);return;
 }
}
