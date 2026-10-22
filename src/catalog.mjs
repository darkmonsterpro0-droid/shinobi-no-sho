import {checkInventoryAttack} from './inventory-actions.mjs';
import {sizeProfile} from './physical-rules.mjs';
import {weaponPoisonCoating} from './inventory-rules.mjs';
import {postAttackRoll} from './combat-chat.mjs';
import {maneuverPlan,availableManeuvers} from './maneuvers.mjs';
import {runtimeBonuses,mutateRuntime,periodKey} from './aptitude-runtime.mjs';
import {ID,ICONS,SOURCES} from './config.mjs';
import {WEAPONS,WEAPON_CATEGORIES,weaponAttack,damageDegree} from './weapons.mjs';
import {aptitudeCatalog,aptitudeChoices,prerequisiteStatus,aptitudeOwned,evolutionStatus} from './aptitudes.mjs';
import {pointBudgets} from './build-rules.mjs';
import {houseRules,statPrecision} from './automation.mjs';
import {readFields} from './interactions.mjs';
export const CATALOG_ACTIONS=new Set(['catalog','catalog-add','weapon-use','weapon-roll','weapon-reload','aptitude-evolve']);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(object,selected)=>Object.entries(object).map(([key,name])=>`<option value="${escape(key)}"${key===selected?' selected':''}>${escape(name)}</option>`).join('');
export function weaponDocument(actor,id){return id==='unarmed'?{id:'unarmed',name:'Ataque desarmado',system:{catalogKey:'unarmed',catalogBook:'basico'},update:async()=>{}}:actor?.items?.get?.(id)??actor?.items?.find?.(i=>i.id===id);}
export function catalogView(env={}){
 const kind=env.catalog??'weapons',actor=env.actor,system=actor?.system??{},items=actor?.items??[],books=env.profile?.books??['basico','avancado'],rules=env.houseRules??{};
 const entries=kind==='weapons'?WEAPONS.filter(w=>books.includes(w.book)):aptitudeCatalog(books,rules);
 return `<p>Escolha ${kind==='weapons'?'uma arma comum':'uma aptidão comum'}. O registro será guardado nesta ficha.</p><label class="sns-field"><span>Buscar no catálogo</span><input type="search" data-sns-search placeholder="Digite parte do nome"></label><small data-filter-count></small><div class="sns-catalog">${entries.map(e=>{
  const status=kind==='aptitudes'?prerequisiteStatus(e,system,items,rules):null,choices=kind==='aptitudes'?aptitudeChoices(e.key,e.book,WEAPONS,items):null;
  return `<article class="sns-block" data-search="${escape(e.name.toLocaleLowerCase('pt-BR'))}"><header><h3>${escape(e.name)}</h3><small>${escape(SOURCES[e.book])} p. ${e.page}</small></header>${kind==='weapons'?`<p>${escape(WEAPON_CATEGORIES[e.category])} · ${e.simple?'Simples':'Marcial'} · Dano de arma +${e.damage} · ${escape(e.damageType)}</p>`:`<p>Pré-requisitos: ${escape(e.requirements||'Nenhum')}${status?.review?' · Conferência do mestre necessária.':''}</p>${choices?`<label class="sns-field"><span>Escolha de ${escape(e.name)}</span><select name="catalog.${e.book}.${e.key}.selection">${options(choices)}</select></label>`:''}<label class="sns-field"><span>Aquisição de ${escape(e.name)}</span><select name="catalog.${e.book}.${e.key}.acquisition">${options({'Comprada':'Comprar por 2 pontos',...(e.free?{'Gratuita':'Aptidão inicial gratuita'}:{}),...(env.isGM?{'Concedida':'Concedida pelo mestre'}:{})})}</select></label>`}<button type="button" class="sns-btn primary" data-sns="catalog-add" data-catalog="${kind}" data-key="${escape(e.key)}" data-book="${e.book}">Adicionar ${escape(e.name)}</button></article>`;
 }).join('')}</div>`;
}
export function weaponUseView(env={}){
 const item=weaponDocument(env.actor,env.itemId),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);
 if(!w)return '<p>Arma de catálogo não encontrada.</p>';
 return `<h3>${escape(w.name)}</h3><div class="sns-form-grid"><label class="sns-field"><span>Manobra</span><select name="weapon.maneuver">${options(availableManeuvers(env.actor?.items??[],env.houseRules??{}),env.maneuver)}</select></label><label class="sns-field"><span>Ataques (Múltiplo)</span><select name="weapon.count">${options({2:"Dois",3:"Três"})}</select></label><label class="sns-field"><span>Modo</span><select name="weapon.mode">${options({...w.melee?{melee:'Corpo a corpo'}:{},...w.range?{ranged:'À distância'}:{}})}</select></label><label class="sns-field"><span>Distância até o alvo (m)</span><input type="number" min="0" value="1" name="weapon.distance"></label>${['kunai','shuriken','senbon'].includes(w.key)?`<label class="sns-field"><span>Projéteis</span><select name="weapon.units">${options({...aptitudeOwned(env.actor?.items??[],'arremessador-eficiente')?{1:'1 projétil — 1 mão',2:'2 projéteis — 2 mãos'}:{},3:'3 projéteis — 1 mão',6:'6 projéteis — 2 mãos'})}</select></label>`:''}${(env.actor?.system.powerState?.active??[]).some(a=>a.electricMode==='blade'&&a.weaponId===item.id)?'<label class="sns-field"><span>Estender lâmina elétrica até 5 m</span><select name="weapon.electricStat"><option value="">Ataque normal</option value="cc">Estender: CC</option value="cd">Estender: CD</option></select></label>':''}${w.double?'<label class="sns-check"><input type="checkbox" name="weapon.dual">Usar ambas as extremidades / par</label>':''}${sizeProfile(env.actor?.system??{}).index>=7?'<label class="sns-check"><input type="checkbox" name="weapon.sizeSweep">Golpear os alvos menores à frente (3 categorias ou mais)</label>':''}<label class="sns-check"><input type="checkbox" name="weapon.offhand">Mão inábil</label>${env.actor?.clone?'<label class="sns-field"><span>Alvo do clone</span><select name="weapon.targetKind"><option value="normal">Não-capanga</option><option value="capanga">Capanga</option></select></label>':''}</div><p>O teste determina o grau de dano. Compare com a defesa do alvo antes de aplicar o resultado.</p>${needsReload(w)?`<p>${item.system.loaded?'Carregada':'Descarregada'}${item.system.damaged?' · Danificada (−1 CD)':''}</p><button type="button" class="sns-btn" data-sns="weapon-reload" data-id="${escape(item.id)}">Recarregar</button>`:''}<button type="button" class="sns-btn primary" data-sns="weapon-roll" data-id="${escape(item.id)}">Rolar ataque</button>`;
}
const needsReload=w=>w.category==='firearm'||['light-crossbow','heavy-crossbow','hidden-shooter'].includes(w.key);
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
  const item=weaponDocument(actor,data.id),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);if(!w)throw Error('Arma não encontrada.');
  const fields=readFields(root,'weapon.'),opts=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k.slice(7),v]));
  opts.itemId=item.id;opts.now=Number(game.time?.worldTime??0);opts.scene=periodKey(actor,'scene');
  const clone=actor.getFlag?.(ID,'clone'),attackItems=clone?.sourceItems??items;const runtime=runtimeBonuses(actor);let plan=weaponAttack(w,actor.system,attackItems,rules,opts);plan.base+=runtime.damage;plan.bonus+=runtime.attack;plan=maneuverPlan(opts.maneuver??"golpear",plan,w,actor.system,items,rules,opts);const check=statPrecision(actor,plan.stat,{kind:'attack',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));
  if(opts.sizeSweep){if(sizeProfile(actor.system).index<7||opts.maneuver!=='golpear'||plan.ranged)throw Error('O ataque amplo por tamanho exige Imenso ou maior, Golpear e alcance corporal.');plan.sizeSweep=true;}
  plan.targetCapanga=opts.targetKind==='capanga';plan.penalty+=check.penalty-(check.uncappedPenalty??0);plan.bonus+=check.bonus;
  if(item.system.destroyed)throw Error('Esta arma foi destruída.');
  if(plan.ranged&&needsReload(w)&&!item.system.loaded)throw Error('Recarregue antes de disparar.');
  if(plan.ranged&&item.system.damaged)plan.penalty-=1;
  plan.precision=plan.purchased+plan.bonus+Math.max(-3,plan.penalty)+(check.uncappedPenalty??0);
  const coating=weaponPoisonCoating(item,{now:opts.now});
  if(coating&&plan.ranged&&(coating.projectiles??w.capacity??1)<plan.units)throw Error('Aplicação venenosa insuficiente para todos os projéteis; prepare outro lote ou remova a aplicação.');
  if(plan.ranged&&['short-bow','long-bow'].includes(w.key)){const ammo=items.find(i=>i.system.catalogKey==='arrows'&&Number(i.system.quantity??0)>0);if(!ammo)throw Error('Sem flechas.');await ammo.update({'system.quantity':Number(ammo.system.quantity)-1});}
  if(plan.ranged&&!['shot','firearm','ammo'].includes(w.category)){const quantity=Number(item.system.quantity??0);if(quantity<plan.units)throw Error('Quantidade de projéteis insuficiente.');await item.update({'system.quantity':quantity-plan.units});}
  const attacks=plan.attacks?.map(part=>({...plan,...part,notes:[...plan.notes,...(part.notes??[])],precision:plan.purchased+part.bonus+check.bonus+Math.max(-3,part.penalty+check.penalty-(check.uncappedPenalty??0)+(item.system.damaged?-1:0))+(check.uncappedPenalty??0),attacks:undefined}))??[plan];
  if(coating&&plan.ranged){const available=coating.projectiles??w.capacity??1;if(available<plan.units)throw Error('Aplicação venenosa insuficiente para todos os projéteis; prepare outro lote ou remova a aplicação.');await item.update({'system.inventoryData.coating':available===plan.units?null:{...coating,projectiles:available-plan.units}});}
  if(!await checkInventoryAttack(actor)){if(plan.ranged&&needsReload(w))await item.update({'system.loaded':false});return app.close();}
  const [first,...remaining]=attacks,result=await postAttackRoll(actor,first,{name:w.name,weapon:w.key,remaining,conditional:opts.maneuver==='chute-duplo',coating});
  if(plan.ranged&&needsReload(w))await item.update({'system.loaded':false,...(w.category==='firearm'&&result.natural<=3?{'system.damaged':true,'system.destroyed':!!item.system.damaged}:{})});
 }
}
