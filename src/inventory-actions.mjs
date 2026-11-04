import {ID,ICONS,SOURCES} from './config.mjs';
import {inventoryCatalog,inventoryEntry,POISONS} from './inventory-data.mjs';
import {armorSummary,inventoryBonuses,canEquipArmor,poisonTraining,poisonCraftPlan,createPoisonExposure,applyPoisonExposure,poisonResistance,poisonPhase,soldierPillPlan,resetPillCounter,utilityPlan} from './inventory-rules.mjs';
import {houseRules,statPrecision} from './automation.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {readFields} from './interactions.mjs';
import {periodKey} from './aptitude-runtime.mjs';
import {damageDegree,WEAPONS,weaponAttack} from './weapons.mjs';
import {lethalDamage} from './conditions.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=value=>structuredClone(value??{}),now=()=>Number(game.time?.worldTime??0),scene=actor=>periodKey(actor,'scene');
const fields=(root,prefix='inventory.')=>Object.fromEntries(Object.entries(readFields(root,prefix)).map(([key,value])=>[key.slice(prefix.length),value]));
const owner=actor=>{if(!actor?.isOwner)throw Error('Você não tem permissão para alterar esta ficha.');};
const itemOf=(actor,id)=>actor.items.get?.(id)??[...actor.items].find(i=>i.id===id);
const queues=new Map();
async function updateState(actor,fn){const key=actor.uuid??actor.id,prior=queues.get(key)??Promise.resolve(),job=prior.catch(()=>{}).then(async()=>{owner(actor);const state=copy(actor.system.inventoryState),result=await fn(state)??{};await actor.update({'system.inventoryState':result.state??state,...result.changes});return result;});queues.set(key,job);try{return await job;}finally{if(queues.get(key)===job)queues.delete(key);}}
async function targetActor(actor,value){if(!value||value===actor.uuid||value===actor.id)return actor;const target=(game.actors?.contents??[]).find(a=>a.uuid===value||a.id===value)??await fromUuid(value);owner(target);return target;}
async function note(actor,title,text,flags={}){return ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<div class="sns-app"><article class="sns-record"><header><strong>${escape(title)}</strong></header><p>${escape(text)}</p></article></div>`,flags:{[ID]:flags}});}
function entryData(entry,extra={}){return {name:entry.name,type:'equipment',img:ICONS.equipment,system:{catalogKey:entry.key,catalogBook:entry.book,source:{book:entry.book,page:String(entry.page)},active:true,quantity:1,compartments:entry.slots?`${entry.capacity} item(ns) / ${entry.slots} compartimento(s)`:'',inventoryData:{key:entry.key,book:entry.book,kind:entry.kind,...extra},selection:entry.weight==='heavy'?'heavy-armor':'',...(entry.kind==='armor'?{hardness:null,absorption:{value:entry.absorption,max:entry.absorption}}:{}),...(entry.uses?{uses:{value:entry.uses,max:entry.uses}}:{})}};}
export const INVENTORY_ACTIONS=new Set(['inventory-catalog','inventory-add','inventory-use','inventory-execute','inventory-equip','inventory-craft','inventory-expose','inventory-antidote','inventory-coat','inventory-uncoat','inventory-poison-roll','inventory-poison-accept','inventory-poison-repeat','inventory-treat','inventory-unmark','reset-pill-count']);
export async function exposePoisonFromPower(target,itemSnapshot,{sourceId,attackerUuid,route,damageGrade,damage=1,hit=true,guaranteedInjection=false,ingestionMinutes=1,usingPower=false}={}){
 owner(target);if(!sourceId)throw Error('A aplicação por poder precisa identificar a execução para evitar duplicação.');const receipt=`power:${attackerUuid??''}:${sourceId}`;
 if((target.system.inventoryState?.exposureReceipts??[]).includes(receipt))return {duplicate:true};
 const record=createPoisonExposure(itemSnapshot,{id:foundry.utils.randomID(),now:now(),scene:scene(target),route,damageGrade,damage,hit,usingPower,guaranteedInjection,ingestionMinutes});let result;
 await updateState(target,async state=>{if((state.exposureReceipts??[]).includes(receipt))return {state,duplicate:true};let tieRoll=null;if((state.poisons??[]).some(p=>p.book==='avancado'&&!p.treated&&p.key!==record.key&&p.category===record.category)){const roll=await new foundry.dice.Roll('1d8').evaluate();tieRoll=roll.total;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:'Venenos de mesma categoria: 1–4 mantém anterior; 5–8 mantém novo.'});}result=applyPoisonExposure(state,record,{tieRoll});result.state.exposureReceipts=[...(state.exposureReceipts??[]),receipt].slice(-100);return result;});
 if(!result)return {duplicate:true};if(result.reExposure)await rollPoisonResistance(target,result.reExposure,{reExposure:true});else if(!result.ignored&&record.delay===0&&record.startAt<=now())await rollPoisonResistance(target,record.id);return result;
}
export async function inventoryAction(app,op,data,root,{actor,show}){
 owner(actor);const rules=houseRules(),profile=game.settings.get(ID,'profile')??{},books=profile.books??['basico','avancado'];
 if(op==='inventory-catalog')return show('inventory-catalog',{actor,inventoryKind:data.kind??'utility'});
 if(op==='inventory-use')return show('inventory-use',{actor,itemId:data.id,inventoryKey:data.key,inventoryBook:data.book,inventoryKind:data.kind});
 if(op==='reset-pill-count'){if(!game.user.isGM)throw Error('Somente o mestre pode zerar a contagem das pílulas.');await updateState(actor,state=>({state:resetPillCounter(state)}));await note(actor,'Contagem de pílulas zerada','Os efeitos já aplicados preservam sua duração.');return app.render({force:true});}
 if(op==='inventory-unmark'){await updateState(actor,state=>{delete state.marked;return {state};});return app.render({force:true});}
 if(op==='inventory-add'){
  const e=inventoryCatalog(data.kind,rules,books).find(e=>e.key===data.key&&e.book===data.book);if(!e)throw Error('Item indisponível nos livros/revisão da mesa.');
  const v=fields(root,`inventory.catalog.${e.book}.${e.key}.`),quantity=Number(v.quantity??1);if(!Number.isInteger(quantity)||quantity<1)throw Error('Quantidade deve ser inteira e positiva.');
  if(e.kind==='poison'||e.kind==='antidote'){
   if(!game.user.isGM)throw Error('Use Fabricar para produzir doses; o mestre pode conceder doses prontas pelo catálogo.');
   const veneficio=Number(v.veneficio??4),dokujutsu=!!v.dokujutsu;if(!Number.isInteger(veneficio)||veneficio<0)throw Error('Venefício do fabricante inválido.');
   const route=v.route??e.routes[0];if(!e.routes.includes(route))throw Error('Método de contágio inválido.');
   const {poisonResistanceDC}=await import('./inventory-rules.mjs');const payload=entryData(e,{route,veneficio,dokujutsu,dc:poisonResistanceDC(e,veneficio,{dokujutsu})});payload.system.quantity=quantity;await actor.createEmbeddedDocuments('Item',[payload]);
  }else {const payload=entryData(e);payload.system.quantity=quantity;await actor.createEmbeddedDocuments('Item',[payload]);}
  return app.render({force:true});
 }
 if(op==='inventory-poison-roll'){await rollPoisonResistance(actor,data.poison);return app.render({force:true});}
 if(op==='inventory-poison-accept'||op==='inventory-poison-repeat'){await resolvePendingPoison(actor,data.poison,{repeat:op==='inventory-poison-repeat'});return app.render({force:true});}
 const item=itemOf(actor,data.id),entry=inventoryEntry(item);if(!['inventory-craft','inventory-treat'].includes(op)&&(!item||!entry))throw Error('Item de inventário não encontrado ou réplica sem propriedades originais.');
 const values=fields(root);app.values??={};Object.assign(app.values,readFields(root,'inventory.'));
 if(op==='inventory-equip'){
  if(entry.kind==='armor'&&!item.system.equipped){const check=canEquipArmor(item,actor.system,[...actor.items],rules);if(!check.allowed)throw Error(check.errors.join(' '));}
  const equipped=!item.system.equipped;await item.update({'system.equipped':equipped});
  const action=entry.kind==='armor'?(entry.weight==='heavy'?'5 minutos':'ação completa'):'conforme a utilização do item';await note(actor,`${equipped?'Equipar':'Retirar'} ${entry.name}`,action);return app.render({force:true});
 }
 if(op==='inventory-craft'){
  const e=POISONS.find(e=>e.key===data.key&&e.book===data.book)??entry;if(!e)throw Error('Receita não encontrada.');if(!books.includes(e.book))throw Error('Livro não habilitado.');
  const plan=poisonCraftPlan(e,actor.system,[...actor.items],{...values,antidote:values.antidote||data.kind==='antidote'},rules);
  let success=true;if(!plan.ideal){const check=statPrecision(actor,plan.skill,{kind:'skill',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));const precision=check.precision+(plan.skill==='veneficio'&&plan.dokujutsu?2:0),roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision;success=natural>=15||natural>3&&roll.total>=plan.difficulty;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>Fabricar ${escape(e.name)}</strong><p>Dificuldade ${plan.difficulty}: ${success?'sucesso':'falha'}. Custo dos materiais: ${plan.cost} Ryo.${plan.minutes?' Tempo: '+plan.minutes+' minutos.':''}</p>`,flags:{[ID]:{kind:'inventory-craft',actorUuid:actor.uuid,precision,natural,success}}});if(plan.kitId){const kit=itemOf(actor,plan.kitId);await kit.update({'system.uses.value':Number(kit.system.uses.value)-1});}}
  if(success){const payload=entryData({...e,kind:plan.kind,name:plan.kind==='antidote'?`Antídoto: ${e.name}`:e.name},{route:plan.route,veneficio:plan.veneficio,dokujutsu:!!plan.dokujutsu,dc:plan.dc});payload.system.quantity=plan.doses;await actor.createEmbeddedDocuments('Item',[payload]);if(plan.ideal)await note(actor,'Fabricação em condições ideais',`${plan.doses} dose(s) de ${payload.name}. Materiais: ${plan.cost} Ryo. Laboratório e tempo disponíveis, sem teste.`);}
  return app.render({force:true});
 }
 if(op==='inventory-uncoat'){await item.update({'system.inventoryData.coating':null});return app.render({force:true});}
 if(op==='inventory-coat'){
  if(entry.kind!=='poison'||item.system.inventoryData?.kind==='antidote')throw Error('Escolha um veneno.');const training=poisonTraining(actor.system,[...actor.items],rules);if(!training.trained||!training.chemical)throw Error('Manusear venenos exige Químico e Venefício treinado.');
  const weapon=itemOf(actor,values.weapon),route=item.system.inventoryData.route;if(!weapon)throw Error('Escolha a arma/projétil.');
  const type=String(weapon.system.damageType??'');if(!['blood','touch'].includes(route)||route==='blood'&&!/Corte|Perfuração/i.test(type))throw Error('O veneno ou o tipo da arma não permite esta aplicação.');
  if(weapon.system.inventoryData?.coating&&weapon.system.inventoryData.coating.key!==entry.key)throw Error('Misturar venenos destrói sua eficácia; remova a aplicação anterior.');
  const count=Number(values.coatQuantity??1),improved=!!aptitudeOwned([...actor.items],'envenenar-arma'),max=improved?3:1;if(!Number.isInteger(count)||count<1||count>max)throw Error(`Escolha de 1 a ${max} arma(s) idênticas deste registro.`);if(Number(item.system.quantity??0)<1)throw Error('Sem dose disponível.');
  await weapon.update({'system.inventoryData.coating':{key:entry.key,book:entry.book,route,dc:item.system.inventoryData.dc,veneficio:item.system.inventoryData.veneficio,dokujutsu:item.system.inventoryData.dokujutsu,appliedAt:now(),weapons:count,projectiles:improved?30:entry.book==='basico'?10:null}});await item.update({'system.quantity':Number(item.system.quantity)-1});
  await note(actor,'Arma envenenada',`${weapon.name}: 1 dose. ${improved?'Ação padrão. Até 3 armas ou 30 projéteis.':'1 minuto de concentração. '+(entry.book==='basico'?'10 projéteis por dose.':'1 compartimento de projéteis por dose.')} A aplicação dura um mês; Energizar comum remove o veneno.`);return app.render({force:true});
 }
 if(op==='inventory-expose'){
  if(Number(item.system.quantity??0)<1)throw Error('Sem dose disponível.');const target=await targetActor(actor,values.target),record=createPoisonExposure(item,{id:foundry.utils.randomID(),now:now(),scene:scene(target),route:values.route??item.system.inventoryData.route,damageGrade:Number(values.damageGrade??0),hit:values.hit!==false,damage:Number(values.damage??0),usingPower:!!values.usingPower,ingestionMinutes:Number(values.ingestionMinutes??1)});
  let result;await updateState(target,async state=>{const old=(state.poisons??[]).find(p=>p.book==='avancado'&&!p.treated&&p.key!==record.key&&p.category===record.category);let tieRoll=null;if(old){const roll=await new foundry.dice.Roll('1d8').evaluate();tieRoll=roll.total;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:'Venenos da mesma categoria: 1–4 mantém o anterior; 5–8 mantém o novo.'});}result=applyPoisonExposure(state,record,{tieRoll});return result;});
  await item.update({'system.quantity':Number(item.system.quantity)-1});if(result.reExposure)await rollPoisonResistance(target,result.reExposure,{reExposure:true});else if(!result.ignored&&record.delay===0&&record.startAt<=now())await rollPoisonResistance(target,record.id);
  await note(actor,`${entry.name}: exposição`,`${target.name}. ${result.ignored?'O veneno ativo de categoria maior/igual prevaleceu.':'Latência e resistência serão processadas no início dos turnos.'}`);return app.render({force:true});
 }
 if(op==='inventory-antidote'){
  if(item.system.inventoryData?.kind!=='antidote')throw Error('Escolha um antídoto específico.');if(Number(item.system.quantity??0)<1)throw Error('Sem antídoto disponível.');const target=await targetActor(actor,values.target);if(!(target.system.inventoryState?.poisons??[]).some(p=>p.key===entry.key&&p.book===entry.book&&!p.treated))throw Error('Este antídoto não corresponde a um veneno ativo no alvo.');
  const delay=entry.book==='avancado'?1:item.system.inventoryData?.dokujutsu?2:3;
  await updateState(actor,state=>{state.antidotes??=[];state.antidotes.push({id:foundry.utils.randomID(),target:target.uuid,key:entry.key,book:entry.book,remaining:delay,scene:scene(target)});return {state};});await item.update({'system.quantity':Number(item.system.quantity)-1});await note(actor,'Antídoto administrado',`${target.name}. Ação parcial. ${entry.book==='avancado'?'Efeito no início do próximo turno de quem administrou; fadiga a partir da próxima cena.':'Efeito após a latência do antídoto; fadiga até dormir.'}`);return app.render({force:true});
 }
 if(op==='inventory-treat'){
  const target=await targetActor(actor,data.target??values.target),p=(target.system.inventoryState?.poisons??[]).find(p=>p.id===(data.poison??values.poison));if(!p)throw Error('Escolha um veneno presente no alvo.');if(!aptitudeOwned([...actor.items],'ninja-medico'))throw Error('Tratar venenos com Medicina exige Ninja Médico.');const check=statPrecision(actor,'medicina',{kind:'skill',manualContext:true,kitRequired:'medicine-kit'});if(!check.allowed)throw Error(check.reasons.join(' '));const precision=check.precision-(target.uuid===actor.uuid?4:0),roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision,success=natural>=15||natural>3&&roll.total>=p.dc;
  if(success)await updateState(target,state=>{const record=state.poisons.find(v=>v.id===p.id);record.medicalBonus=4;return {state};});await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Tratar veneno: ${success?'sucesso; +4 no próximo teste de Vigor do paciente':'falha'}. Ação padrão.`,flags:{[ID]:{kind:'inventory-treatment',natural,precision}}});return app.render({force:true});
 }
 if(op==='inventory-execute'){
  if(entry.kind==='armor')throw Error('Use Equipar / Retirar para armaduras.');if(entry.kind==='poison')throw Error('Escolha fabricar, aplicar ou administrar no painel do veneno.');
  const plan=utilityPlan(entry,actor.system,[...actor.items],values,rules),quantity=Number(item.system.quantity??0);if(plan.mode!=='detonate'&&quantity<plan.quantity)throw Error('Quantidade insuficiente.');const check=statPrecision(actor,plan.attack??'des',{kind:plan.attack?'attack':'skill',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));
  if(entry.key==='soldier-pill'){
   const result=await updateState(actor,state=>{const p=soldierPillPlan(actor.system,state,plan.quantity,{now:now(),nonhuman:actor.type!=='character',clone:!!actor.getFlag?.(ID,'clone')});return {state:p.state,changes:{'system.resources.chakra.value':p.chakra},pill:p};});await item.update({'system.quantity':quantity-plan.quantity});await note(actor,'Pílulas do soldado',`Ação parcial. Chakra recuperado: ${result.pill.gain}. Contagem: ${result.pill.count}. ${result.pill.overdose?'Intoxicação imediata: inconsciência por 1 hora; depois exaustão por 20 dias.':'Efeito colateral após 1 hora.'}`);return app.render({force:true});
  }
  if(entry.key==='earplugs'){await updateState(actor,state=>{state.earplugs=!state.earplugs;return {state};});await note(actor,'Tampões de ouvido',`${plan.action}: ${actor.system.inventoryState.earplugs?'colocados; Surdo enquanto usados':'retirados'}.`);return app.render({force:true});}
  if(entry.uses){const uses=Number(item.system.uses?.value??0);if(uses<1)throw Error('Kit sem usos.');await item.update({'system.uses.value':uses-1});await note(actor,entry.name,'Um uso consumido. Faça o teste correspondente à tarefa.');return app.render({force:true});}
  if(entry.key==='explosive-tag'&&plan.mode==='remote')await updateState(actor,state=>{state.explosives??=[];state.explosives.push({id:foundry.utils.randomID(),quantity:plan.quantity,remaining:3,base:plan.base,dc:plan.dc,diameter:plan.area.diameter});return {state};});
  if(entry.key==='explosive-tag'&&plan.mode==='detonate'){
   const chosen=String(values.prepared??''),prepared=(actor.system.inventoryState.explosives??[]).find(e=>e.id===chosen);if(!prepared)throw Error('Escolha um conjunto de tarjas preparado.');if(Number(values.distance??0)>15)throw Error('Ativação remota limitada a 15 m.');await explodeTags(actor,prepared);await updateState(actor,state=>{state.explosives=state.explosives.filter(e=>e.id!==chosen);return {state};});return app.render({force:true});
  }
  if(entry.key==='kousen'){
   const projectile=itemOf(actor,values.weapon),allowed=['kunai','shuriken',...(plan.projectiles===1?['fuuma-giant','fuuma-straight','fuuma-shadow']:[])];if(!projectile||!allowed.includes(projectile.system.catalogKey))throw Error('Escolha um projétil compatível com Kousen.');
   if(!values.prepared&&!projectile.system.inventoryData?.kousenPrepared)throw Error('Os projéteis precisam estar preparados com Kousen.');
   if(plan.mode==='pull'){if(!values.previousMiss)throw Error('Puxar exige que o primeiro ataque com este projétil tenha errado.');const weapon=WEAPONS.find(w=>w.key===projectile.system.catalogKey&&w.book===projectile.system.catalogBook)??WEAPONS.find(w=>w.key===projectile.system.catalogKey);const attack=weaponAttack(weapon,actor.system,[...actor.items],rules,{mode:'ranged',itemId:projectile.id});plan.base=attack.base;plan.critical=attack.critical;plan.penalty=(plan.penalty??0)+attack.penalty;plan.bonus=attack.bonus;}await projectile.update({'system.inventoryData.kousenPrepared':true});if(plan.mode==='bind'){const q=Number(projectile.system.quantity??0);if(q<plan.projectiles)throw Error('Quantidade de projéteis insuficiente para amarrar.');await projectile.update({'system.quantity':q-plan.projectiles});}
  }
  if(plan.consume||entry.utility&&entry.key!=='kousen')await item.update({'system.quantity':quantity-plan.quantity});
  let natural=null,total=null,precision=null;if(plan.attack){precision=check.precision+(plan.penalty??0)+(plan.bonus??0);const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();natural=roll.total-precision;total=roll.total;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>${escape(entry.name)}</strong><p>${plan.action}. ${plan.base?'Dano base '+plan.base+'; grau '+damageDegree(natural)+'.':''} ${escape(plan.notes.join(' '))}</p><button type="button" data-sns-power-resolve>Conferir defesa e aplicar no alvo</button>`,flags:{[ID]:{kind:'inventory-attack',actorUuid:actor.uuid,stat:plan.attack,precision,natural,total,base:plan.base,conditions:plan.conditions,powerAttack:inventoryAttack(actor,entry,plan,{natural,total,precision,itemId:item.id})}}});}
  else await note(actor,entry.name,`${plan.action}. ${plan.range?'Alcance '+plan.range+' m. ':''}${plan.dc?'Resistência '+(plan.resist??[]).join(' / ').toUpperCase()+' dificuldade '+plan.dc+'. ':''}${plan.area?'Área '+plan.area.diameter+' m de diâmetro. ':''}${plan.notes.join(' ')}`);
  if(values.target&&!plan.attack&&entry.key!=='explosive-tag')await applyUtilityTarget(actor,await targetActor(actor,values.target),entry,plan,{natural,total,hit:!!values.confirmHit,resistStat:values.resistStat});
  return app.render({force:true});
 }
 throw Error('Ação de inventário desconhecida.');
}
async function applyUtilityTarget(source,target,entry,plan,{natural,total,hit,resistStat}={}){
 if(entry.key==='thunder-bomb'&&target.system.inventoryState?.earplugs)return;
 if(plan.attack&&!hit)return;
 let success=false;if(plan.dc){const stat=plan.resist.includes(resistStat)?resistStat:plan.resist[0],check=statPrecision(target,stat,{kind:'resistance',bodyResistance:stat==='vig',reaction:true,manualContext:true}),roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),value=roll.total-check.precision;success=value>=15||value>3&&roll.total>=plan.dc;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:`${escape(entry.name)}: resistência ${success?'bem-sucedida':'falhou'} (dif ${plan.dc}).`});}
 if(success)return;
 await updateState(target,state=>{state.conditions??=[];for(const key of plan.conditions)state.conditions.push({id:foundry.utils.randomID(),key,name:key,remaining:plan.turns??null,source:entry.name});if(entry.key==='marking-bomb')state.marked={source:source.uuid,at:now()};return {state};});
}
async function explodeTags(actor,entry){const roll=await new foundry.dice.Roll('2d8').evaluate(),degree=damageDegree(roll.total),plan={base:entry.base,dc:entry.dc,resist:['agi','prontidao'],conditions:[],notes:[],area:{diameter:entry.diameter},mode:'remote'};await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Tarjas explosivas (${entry.quantity}): base ${entry.base} × grau ${degree} = ${entry.base*degree}. Esfera ${entry.diameter} m; Agilidade/Prontidão ${entry.dc}.<button type="button" data-sns-power-resolve>Resolver explosão no alvo</button>`,flags:{[ID]:{kind:'inventory-explosion',base:entry.base,natural:roll.total,degree,powerAttack:inventoryAttack(actor,{key:'explosive-tag',name:'Tarjas explosivas',book:'basico',page:134},plan,{natural:roll.total,total:roll.total,precision:0})}}});}
export function inventoryAttack(actor,entry,plan,{natural,total,precision,itemId}={}){
 const attack={actorUuid:actor.uuid,itemId,precision,total,natural,degree:damageDegree(natural,plan.critical??15),critical:natural>=(plan.critical??15),failed:natural<=3,plan:{family:'inventory',effect:entry.key,name:entry.name,source:`${SOURCES[entry.book]} p. ${entry.page}`,level:0,cost:0,seals:false,damage:plan.base??0,action:'standard',duration:'instant',resistances:[],conditions:plan.conditions??[],notes:plan.notes??[],conditionTurns:plan.turns}};
 if(entry.key==='explosive-tag'&&plan.mode==='remote'){attack.plan.explosionResistance={difficulty:plan.dc};attack.failed=false;attack.degree=natural<=3?1:attack.degree;attack.critical=false;}
 if(entry.key==='net')attack.plan.resistances.push({stat:['for','escapar'],difficulty:16,onFail:[],escape:true,action:'standard',standardNoTest:true,cuttingWeaponRequired:true});
 if(entry.key==='kousen'&&plan.mode==='bind')attack.plan.resistances.push({stat:['for','escapar'],difficulty:17,onFail:[],escape:true,action:'movement',standardNoTest:true});
 if(entry.key==='smoke-bomb')attack.plan.inventorySmoke=true;
 return attack;
}
async function commitPoisonResistance(actor,id,result){return updateState(actor,state=>{const index=(state.poisons??[]).findIndex(p=>p.id===id);if(index<0)throw Error('Veneno já encerrado.');const p=state.poisons[index],outcome=poisonResistance(p,result);delete outcome.record.pending;delete outcome.record.medicalBonus;state.poisons[index]=outcome.record;const vit=Number(actor.system.resources.vitality.value??0),changes=outcome.damage?{'system.resources.vitality.value':lethalDamage(vit,outcome.damage)}:{};return {state,changes,outcome};});}
export async function rollPoisonResistance(actor,id,{reExposure=false}={}){
 owner(actor);const record=(actor.system.inventoryState?.poisons??[]).find(p=>p.id===id);if(!record||record.treated)throw Error('Veneno não encontrado.');if(record.pending)throw Error('Aceite ou repita a resistência anterior primeiro.');
 const check=statPrecision(actor,'vig',{kind:'resistance',bodyResistance:true,poisonResistance:true,reaction:true,manualContext:true}),precision=check.precision+Number(record.medicalBonus??0),roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision,result={natural,total:roll.total,precision,now:now(),scene:scene(actor),reExposure};
 const canRepeat=natural>3&&!!aptitudeOwned([...actor.items],'resistencia-maior','vig',houseRules());
 if(canRepeat)await updateState(actor,state=>{state.poisons.find(p=>p.id===id).pending=result;return {state};});else await commitPoisonResistance(actor,id,result);
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>Resistir a veneno</strong><p>Vigor dif ${record.dc}. ${natural>=15||natural>3&&roll.total>=record.dc?'Sucesso':'Falha'}.${canRepeat?' Resistência Maior: aceite ou repita este teste no painel de inventário; a segunda rolagem será obrigatória.':''}</p>`,flags:{[ID]:{kind:'inventory-resistance',actorUuid:actor.uuid,poison:id,precision,natural,pending:canRepeat}}});
 return result;
}
export async function resolvePendingPoison(actor,id,{repeat=false}={}){
 const record=(actor.system.inventoryState?.poisons??[]).find(p=>p.id===id),pending=record?.pending;if(!pending)throw Error('Não há resistência pendente.');let result=pending;
 if(repeat){if(!aptitudeOwned([...actor.items],'resistencia-maior','vig',houseRules())||pending.natural<=3)throw Error('Esta resistência não pode ser repetida.');const roll=await new foundry.dice.Roll(`2d8 + (${pending.precision})`).evaluate();result={...pending,natural:roll.total-pending.precision,total:roll.total};await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:'Resistência Maior: segunda rolagem obrigatória contra o veneno.',flags:{[ID]:{kind:'inventory-resistance-reroll',poison:id,actorUuid:actor.uuid}}});}
 return commitPoisonResistance(actor,id,result);
}
export async function advanceInventoryPhase(actor,key,phase='start'){
 owner(actor);if((actor.system.inventoryState?.processedPhases??[]).includes(key))return null;
 if(phase==='start')for(const p of actor.system.inventoryState?.poisons??[])if(p.pending)await resolvePendingPoison(actor,p.id);
 const result=await updateState(actor,state=>{
  state.processedPhases??=[];if(state.processedPhases.includes(key))return {state,duplicate:true};
  const r=poisonPhase(state,{phase,now:now(),scene:scene(actor)}),s=r.state;s.processedPhases=[...state.processedPhases,key].slice(-100);
  if(phase==='start')for(const antidote of s.antidotes??[])antidote.remaining-=1;
  if(phase==='end'){s.conditions=(s.conditions??[]).flatMap(c=>c.remaining===null||c.remaining===undefined?[c]:c.remaining<=1?[]:[{...c,remaining:c.remaining-1}]);for(const e of s.explosives??[])e.remaining-=1;}
  const vit=Number(actor.system.resources.vitality.value??0),changes=r.zeroVitality?{'system.resources.vitality.value':0}:r.damage?{'system.resources.vitality.value':lethalDamage(vit,r.damage)}:{};
  return {state:s,changes,...r,state:s};
 });
 if(result.duplicate)return null;
 for(const a of actor.system.inventoryState?.antidotes??[])if(a.remaining<=0){const target=await targetActor(actor,a.target);await updateState(target,state=>{state.poisons=(state.poisons??[]).filter(p=>!(p.key===a.key&&p.book===a.book));state.conditions??=[];state.conditions.push({id:`antidote-${a.id}`,key:'fatigado',name:'Fatigado',source:'Efeito colateral do antídoto',untilRest:true,...(a.book==='avancado'?{sceneAfter:a.scene}:{})});return {state};});await updateState(actor,state=>{state.antidotes=state.antidotes.filter(v=>v.id!==a.id);return {state};});}
 for(const explosive of actor.system.inventoryState?.explosives??[])if(explosive.remaining<=0){await explodeTags(actor,explosive);await updateState(actor,state=>{state.explosives=state.explosives.filter(e=>e.id!==explosive.id);return {state};});}
 for(const prompt of result.prompts??[])await rollPoisonResistance(actor,prompt.id);
 return result;
}

export async function checkInventoryAttack(actor){
 const chance=inventoryBonuses(actor,{kind:'attack',now:now(),scene:scene(actor)},houseRules()).attackFailure;
 if(!chance)return true;
 const roll=await new foundry.dice.Roll('1d8').evaluate(),success=roll.total>Math.round(chance/100*8);
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Veneno: chance de falha ${chance}%. ${success?'Pode concluir o ataque.':'O ataque falhou pelo efeito do veneno.'}`});return success;
}
export async function exposePoisonFromWeapon(target,coating,{sourceId,attackerUuid,damageGrade,damage,hit}={}){
 if(!hit||damage<=0)return {ignored:true};
 const entry=POISONS.find(e=>e.key===coating.key&&e.book===coating.book);if(!entry)throw Error('Aplicação venenosa desconhecida.');
 if(coating.route==='blood'&&damageGrade<(entry.book==='avancado'&&coating.dokujutsu?2:3))return {ignored:true};
 return exposePoisonFromPower(target,{type:'equipment',system:{catalogKey:coating.key,catalogBook:coating.book,inventoryData:{...coating,kind:'poison'}}},{sourceId,attackerUuid,route:coating.route,damageGrade,damage,hit,usingPower:false});
}
