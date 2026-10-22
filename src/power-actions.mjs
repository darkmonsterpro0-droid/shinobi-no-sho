import {breakCommonBlockingWeapon} from './power-defense.mjs';
import {ID,ICONS,ATTRIBUTES,COMBAT,SKILLS} from './config.mjs';
import {POWER_FAMILIES,POWER_TECHNIQUES,ELEMENTS,POWER_ACTION_NAMES,POWER_DURATION_NAMES} from './power-data.mjs';
import {powerFamily,powerPlan,powerAttackResult,validatePowerPurchase,affinityStatus} from './power-rules.mjs';
import {pointBudgets} from './build-rules.mjs';
import {modifyTechnique,riskyHealing} from './technique-aptitudes.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {mutateRuntime,claimUsage,periodKey,runtimeBonuses} from './aptitude-runtime.mjs';
import {effectiveAttributes} from './physical-rules.mjs';
import {applyPhysicalDamage,bodyHardness} from './physical-actions.mjs';
import {houseRules,derivedSummary,statPrecision,saveCondition,conditionRecords} from './automation.mjs';
import {readFields} from './interactions.mjs';
import {POISONS} from './inventory-data.mjs';
import {WEAPONS} from './weapons.mjs';
import {exposePoisonFromPower,checkInventoryAttack} from './inventory-actions.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number(v??0),uuid=()=>foundry.utils.randomID(),copy=v=>structuredClone(v);
const read=(root,prefix)=>Object.fromEntries(Object.entries(readFields(root,prefix)).map(([k,v])=>[k.slice(prefix.length),v]));
const itemsOf=actor=>[...(actor?.items??[])],findItem=(actor,id)=>actor?.items?.get?.(id)??itemsOf(actor).find(i=>i.id===id),profile=()=>game.settings.get(ID,'profile')??{books:['basico','avancado']};
const context=actor=>({rules:houseRules(),books:profile().books,attributes:effectiveAttributes(actor.system)});
const targets=()=>game.actors.filter(a=>a.visible).map(a=>({uuid:a.uuid,name:a.name,weapons:itemsOf(a).filter(i=>i.type==='equipment').map(i=>({id:i.id,name:i.name}))}));
const owner=actor=>{if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode executar esta ação.');};
export const POWER_ACTIONS=new Set(['power-collateral','power-continue','power-catalog','power-new','power-edit','power-save','power-preview-editor','power-use','power-preview-use','power-execute','power-end','power-maintain','power-touch-attack','power-release-seal','power-affinity','power-resolve','power-confirm-hit','power-prepare-defense','power-area','power-area-add','power-area-remove','power-escape']);
const getState=actor=>({active:[],executions:{},receipts:{},...copy(actor.system.powerState??{})});
async function updatePower(actor,fn){return mutateRuntime(actor,async runtime=>{const state=getState(actor),r=await fn(state,runtime)??{};return {...r,changes:{'system.powerState':state,...r.changes}};});}
function assertAction(actor,plan){
 const state=derivedSummary(actor).state,reaction=plan.defensive||plan.action==='reaction';
 if(reaction?state.noReactions:state.noActions)throw Error('A condição atual impede executar este poder.');
 if(plan.action==='movement'&&state.noMovementAction)throw Error('A condição atual impede usar ação de movimento.');
 if(plan.seals&&state.keys.includes('amputado')&&!(aptitudeOwned(itemsOf(actor),'mestre-dos-selos')&&Number(actor.system.skills?.prestidigitacao?.value??0)>=14))throw Error('Selos de mão exigem as duas mãos, salvo a exceção de Mestre dos Selos e Prestidigitação 14.');
 const concentration=getState(actor).active.find(a=>a.duration==='concentration'&&a.active!==false);if(concentration&&!plan.maintenance)throw Error('Encerre a concentração atual antes de executar outro poder.');
}
function executionPlan(actor,item,options,root){
 const inventory=options.poisonId?findItem(actor,options.poisonId):null,poison=inventory?POISONS.find(p=>p.key===inventory.system.catalogKey&&p.book===inventory.system.catalogBook):null;
 if(options.poisonId){if(!poison)throw Error('Veneno de catálogo não encontrado.');options.poisonLevel=poison.category;}
 if((options.effect==='inflamavel'&&options.mode!=='continuous')||(options.effect==='armazenar'&&options.mode==='jutsu')||options.effect==='wana'){
  const source=findItem(actor,options.storedPowerId);if(!source||!POWER_FAMILIES[powerFamily(source)]?.effects)throw Error('Escolha um poder comum conhecido para selar.');
  const stored=powerPlan(source,actor.system,itemsOf(actor),{effect:options.storedEffect??'canhao',level:Number(options.jutsuLevel??source.system.level),tier:Number(options.storedTier??1)},context(actor));
  options.jutsuCost=stored.cost;options.jutsuReach=stored.stat==='cd'?'ranged':'personal';options.jutsuDuration=stored.duration;options.jutsuAction=stored.action;options.jutsuLevel=stored.level;options.storedFrame=stored;
 }
 let plan=powerPlan(item,actor.system,itemsOf(actor),options,context(actor));
 if(['afiar','arma-eletrica','flutuar'].includes(plan.effect)&&(plan.effect!=='arma-eletrica'||(options.mode??'energize')==='energize')){
  const weapon=findItem(actor,options.weaponId),entry=WEAPONS.find(w=>w.key===weapon?.system.catalogKey&&w.book===weapon?.system.catalogBook);
  if(!weapon||weapon.system.destroyed||!entry)throw Error('Escolha uma arma utilizável na ficha.');
  if(plan.effect==='flutuar'&&entry.key!=='fan')throw Error('Flutuar exige Leque Gigante.');
  if(plan.effect!=='flutuar'&&(!/Corte|Perfuração/i.test(entry.damageType)||plan.effect==='afiar'&&weapon.getFlag?.(ID,'createdPower')))throw Error('Esta técnica exige arma real cortante ou perfurante.');
 }
 if(plan.effect==='descarga'&&options.mode==='energized'&&!getState(actor).active.some(a=>a.family==='raiton'&&['energizar','arma-eletrica'].includes(a.effect)))throw Error('Prepare Energizar Raiton ou Arma Elétrica antes da Descarga.');
 if(plan.effect==='wana')plan.trapFrame=copy(options.storedFrame);
 if(plan.effect==='inflamavel'&&options.mode!=='continuous'){const spark=options.storedFrame;if(!spark||!['katon','raiton'].includes(spark.family)||spark.duration!=='instant'||spark.stat!=='cd'||plan.tier<8&&spark.effect!=='canhao'||spark.range!==spark.common.range)throw Error('Escolha um efeito de combustão permitido de Katon/Raiton.');const cost=plan.cost+spark.cost,name=plan.name;plan={...spark,cost,name:name+' · '+spark.name,damage:spark.damage+2,element:'katon',area:plan.area,size:plan.size,notes:[...plan.notes,...spark.notes],metaAllowed:false,noOtherBenefits:true};}
 if(plan.effect==='purificar'){const [sourceUuid,id]=String(options.environmentEffect??'').split('|'),source=game.actors.find(a=>a.uuid===sourceUuid),effect=source?.system.powerState?.active?.find(a=>a.id===id);if(!effect||!effect.plan?.area)throw Error('Escolha um efeito de área registrado. Purificar não remove veneno de dentro do corpo.');owner(source);if(plan.level<effect.plan.level)throw Error('O nível de Purificar não alcança o efeito no ambiente.');plan.purifyTarget={sourceUuid,id,difficulty:effect.plan.difficulty,level:effect.plan.level};}
 if(plan.effect==='arma-eletrica'&&['blade','projectiles'].includes(options.mode)){const key=options.mode==='blade'?'short-sword':options.electricProjectile??'kunai';if(!['short-sword','kunai','shuriken','senbon'].includes(key))throw Error('Projétil elétrico inválido.');plan.createdWeapon={key,book:'basico'};}


 if(poison)plan.poisonSnapshot={name:inventory.name,type:'equipment',system:copy(inventory.system)};
 if(plan.effect==='criar-arma'){
  const [weaponBook,weaponKey]=String(options.weaponId??'').split(':');if(weaponKey){options.weaponId=weaponKey;options.weaponBook=weaponBook;}
  const weapon=WEAPONS.find(w=>w.key===options.weaponId&&(options.weaponBook?w.book===options.weaponBook:true));
  if(!weapon||!profile().books.includes(weapon.book)||['fuuma-shadow','fuuma-straight','fan','unarmed'].includes(weapon.key)||!['light','medium','long','throw',...(plan.tier>=6?['heavy']:[])].includes(weapon.category))throw Error('Escolha uma arma permitida por Criar Arma e pela evolução aprendida.');
  plan.createdWeapon={key:weapon.key,book:weapon.book};
 }
 const keys=Object.entries(read(root,'modifier.')).filter(([,v])=>v).map(([k])=>k),choices=read(root,'choice.');
 if(keys.includes('tecnica-eficiente'))throw Error('Técnica Eficiente é usada após confirmar um acerto, no painel da aptidão.');
 if(keys.includes('tecnica-de-cura-arriscada')){if(plan.effect!=='shousen'||options.mode==='offense')throw Error('Cura Arriscada só modifica o tratamento Shousen.');if(keys.includes('tecnica-acelerada'))throw Error('Cura Arriscada não combina com Técnica Acelerada.');plan.riskyHealing=true;}
 const mods=keys.filter(k=>k!=='tecnica-de-cura-arriscada');
 if(mods.length){
  if(plan.noOtherBenefits||plan.noOtherDamageBonuses)throw Error('Este modo não recebe benefícios de aptidões.');
  if(plan.noPotentialize&&mods.includes('potencializar'))throw Error('Onda Explosiva não permite Potencializar.');
  choices.waterPoints=actor.getFlag(ID,'aptitudes')?.water?.stamp===periodKey(actor,'scene')?number(actor.getFlag(ID,'aptitudes').water.value):0;choices.waterBoost=['spend','natural'].includes(choices.waterMode);choices.naturalWater=choices.waterMode==='natural';
  const frame={...plan,id:item.id,powerId:item.id,power:plan.family,effect:plan.effect,ranged:plan.stat==='cd',touchAttack:plan.stat==='cc',noMeta:!plan.metaAllowed,barrier:plan.effect==='barreira',freeCreation:plan.effect==='criacao-livre',commonDifficulty:plan.common?.difficulty??plan.difficulty,resistKind:plan.resistances.every(r=>(Array.isArray(r.stat)?r.stat:[r.stat]).every(s=>s in SKILLS))?'skill':'attribute',width:plan.area?plan.size:null,length:plan.area?plan.size:null,common:plan.common?{...plan.common,width:plan.common.size,length:plan.common.size}:null};
  const modified=modifyTechnique(frame,mods,actor.system,itemsOf(actor),choices,houseRules());
  for(const key of ['damage','hardness','cost','range','action','degreeBonus','precisionBonus','critical','waterCreated','waterSpent','extraMovement','impactDifficulty','fireDifficulty'])if(modified[key]!=null)plan[key]=modified[key];
  if(modified.width>0)plan.size=modified.width;plan.notes.push(...modified.notes);
  const diffChange=number(modified.difficulty)-number(frame.difficulty);if(diffChange){plan.difficulty=modified.difficulty;plan.resistances=plan.resistances.map(r=>({...r,difficulty:r.difficulty+diffChange}));}
  if(plan.active){if(plan.active.bodyHardness!=null&&plan.effect!=='pele-pedra')plan.active.bodyHardness=plan.hardness;else if(plan.hardness!=null)plan.active.hardness=plan.hardness;}
 }
 if(plan.impactDifficulty!=null)plan.resistances.push({stat:'vig',difficulty:plan.impactDifficulty,onFail:['caido'],requiresHit:true});
 if(plan.fireDifficulty!=null)plan.resistances.push({stat:'vig',difficulty:plan.fireDifficulty,onFail:['debilitado'],remaining:1,timing:'Fim do turno',appliesEvenMiss:true});
 const bonus=runtimeBonuses(actor);if(plan.damage!=null&&!plan.noOtherDamageBonuses&&!plan.noOtherBenefits)plan.damage+=bonus.damage;
 return plan;
}
export async function powerAction(app,op,data,root,{actor,show}){
 if(!['power-resolve','power-confirm-hit','power-prepare-defense'].includes(op))owner(actor);const all=itemsOf(actor),books=profile().books,rules=houseRules();
 if(op==='power-collateral'){const m=game.messages.get(data.message),c=m?.getFlag(ID,'powerCollateral');if(!c||c.actorUuid!==actor.uuid)throw Error('Dano colateral não encontrado.');await applyPhysicalDamage(actor,{base:c.damage,degree:1,sourceId:c.receiptId,reason:'Rasengan Elemental: dano colateral',camouflageContext:{located:true},critical:true});return app.render({force:true});}
 if(op==='power-continue'){const m=game.messages.get(data.message),a=m?.getFlag(ID,'powerContinuation');if(!a||a.actorUuid!==actor.uuid)throw Error('Continuação não encontrada.');const id='continue:'+m.id;if(getState(actor).receipts[id])throw Error('Esta continuação já foi rolada.');const plan=copy(a.plan);if(plan.damagePerPreviousHit)plan.damage+=a.sequenceIndex<=plan.damagePerPreviousHit.max?plan.damagePerPreviousHit.step:0;await postPowerRoll(actor,findItem(actor,a.itemId),{...plan,cost:0},{executionId:a.executionId,sequenceIndex:a.sequenceIndex,previousTargets:a.previousTargets});await updatePower(actor,s=>{s.receipts[id]={complete:true};});return app.close();}
 if(op==='power-catalog')return show('power-catalog',{actor});
 if(op==='power-new'){if(!POWER_FAMILIES[data.family])throw Error('Poder desconhecido.');return show('power-editor',{actor,family:data.family});}
 if(op==='power-edit'){const item=findItem(actor,data.id);if(!item||!powerFamily(item))throw Error('Poder de catálogo não encontrado.');return show('power-editor',{actor,itemId:item.id,family:powerFamily(item)});}
 if(op==='power-use'){const item=findItem(actor,data.id);if(!item||!powerFamily(item))throw Error('Poder comum não encontrado.');return show('power-use',{actor,itemId:item.id,targets:targets()});}
 if(op==='power-preview-use'||op==='power-preview-editor'){Object.assign(app.values,readFields(root));return app.render({force:true});}
 if(op==='power-affinity'){
  if(!game.user.isGM)throw Error('Somente o mestre registra exceções de afinidade.');const v=read(root,'affinity.'),reason=String(v.reason??'').trim(),excluded=ELEMENTS.filter(k=>v['excluded.'+k]),blocked=ELEMENTS.filter(k=>v['blocked.'+k]),limit=v.limit==null?null:Number(v.limit);
  if(!reason)throw Error('Informe a fonte da exceção.');if([...excluded,...blocked].some(k=>!ELEMENTS.includes(k)))throw Error('Elemento inválido.');if(limit!=null&&(!Number.isInteger(limit)||limit<1||limit>5))throw Error('Limite de afinidade inválido.');
  await actor.update({'system.powerState.affinity':{approved:true,reason,excluded,blocked,limit}});return app.render({force:true});
 }
 if(op==='power-save'){
  const v=read(root,'power.'),previous=v.id?findItem(actor,v.id):null,family=v.family??previous?.system.powerData?.family,entry=POWER_FAMILIES[family];if(!entry)throw Error('Poder inválido.');
  const level=Number(v.level),track=previous?.system.powerData?.track??1+Math.max(0,...all.filter(i=>i.type==='power'&&powerFamily(i)===family).map(i=>number(i.system.powerData?.track??1))),choices=entry.effects?Array.from({length:level},(_,i)=>{const [effect,tier]=String(v['choice.'+i]??'').split(':');return {effect,tier:Number(tier)};}):[];
  const item={_id:previous?.id,id:previous?.id,name:String(v.name??entry.name).trim()||entry.name,type:'power',img:ICONS.power,system:{...(previous?.system??{}),level,usedLevel:level,catalogKey:family,catalogBook:'basico',source:{book:'basico',page:String(entry.page)},powerData:{family,track,choices,solid:v.solid==='yes'}}};
  const errors=validatePowerPurchase(actor,item,{previous:previous?.toObject?.()??previous,rules,books,isGM:game.user.isGM}),next=all.filter(i=>i.id!==previous?.id).concat(item),budget=pointBudgets(actor.system,next,rules);if(budget.powers.remaining<0)errors.push(`Faltam ${-budget.powers.remaining} pontos de poder.`);if(errors.length)throw Error(errors.join(' '));
  if(previous)await previous.update({name:item.name,'system.level':level,'system.usedLevel':level,'system.powerData':item.system.powerData});else{delete item.id;delete item._id;await actor.createEmbeddedDocuments('Item',[item]);}
  return app.close();
 }
 if(op==='power-area'){const active=getState(actor).active.find(a=>a.id===data.id);if(!active)throw Error('Efeito não encontrado.');return show('power-use',{actor,areaPower:active,targets:targets()});}
 if(op==='power-area-add'||op==='power-area-remove'){const active=getState(actor).active.find(a=>a.id===(data.id??app.panelConfig.areaPower?.id)),v=read(root,'area.'),target=await fromUuid(v.targetUuid);owner(target);if(!active)throw Error('Efeito não encontrado.');const id=`area:${active.id}:${target.id}`;if(op==='power-area-remove'){await endPower(target,id);return app.render({force:true});}await updatePower(target,state=>{if(!state.active.some(a=>a.id===id))state.active.push({...copy(active),id,linkedTo:active.id,sourceUuid:actor.uuid,areaMembership:true,targetUuid:target.uuid,stored:null,sameSignature:v.sameSignature==='yes',protectAlly:v.protectAlly==='yes',createdTurn:periodKey(target,'turn')});});return app.render({force:true});}
 if(op==='power-escape'){await escapePower(actor,data.id,read(root,`escape.${data.id}.`));return app.render({force:true});}
 if(op==='power-end'){const active=getState(actor).active.find(a=>a.id===data.id);if(active?.effect==='desastre'&&!active.lingering){await updatePower(actor,s=>{const a=s.active.find(a=>a.id===data.id);a.lingering=true;a.duration='continuous';a.remaining=2;});for(const target of game.actors.filter(a=>a.isOwner))await updatePower(target,s=>{for(const a of s.active.filter(a=>a.linkedTo===data.id)){a.lingering=true;a.protectAlly=false;}});return app.render({force:true});}await endPower(actor,data.id);return app.render({force:true});}
 if(op==='power-maintain'){await maintainPower(actor,data.id);return app.render({force:true});}
 if(op==='power-release-seal'){await releaseStoredSeal(actor,data.id);return app.render({force:true});}
 if(op==='power-touch-attack'){await touchPowerAttack(actor,data.id);return app.render({force:true});}
 if(op==='power-resolve'){const message=game.messages.get(data.message);if(!message?.getFlag(ID,'powerAttack'))throw Error('Ataque não encontrado.');return show('power-use',{actor,resolveMessage:message.id,powerAttack:message.getFlag(ID,'powerAttack'),targets:targets()});}
 if(op==='power-prepare-defense'){const v=read(root,'resolve.'),message=game.messages.get(v.message??app.panelConfig?.resolveMessage);await preparePowerDefense(message,v.targetUuid,v);Object.assign(app.values,readFields(root));return app.render({force:true});}
 if(op==='power-confirm-hit'){const v=read(root,'resolve.'),message=game.messages.get(v.message??app.panelConfig?.resolveMessage);if(!message)throw Error('Mensagem de ataque não encontrada.');await resolvePowerAttack(message,v.targetUuid,{...v,hit:v.hit==='yes'});return app.close();}
 if(op!=='power-execute')throw Error('Ação de poder desconhecida.');
 Object.assign(app.values,readFields(root));const options=read(root,'power.'),item=findItem(actor,options.id);if(!item||!powerFamily(item))throw Error('Poder não encontrado.');
 let plan=executionPlan(actor,item,options,root);assertAction(actor,plan);
 if(plan.stat){const check=statPrecision(actor,plan.stat,{kind:plan.defensive?'defense':plan.stat in COMBAT?'attack':plan.stat in SKILLS?'skill':'attribute',reaction:!!plan.defensive,manualContext:true,requiresSeals:plan.seals});if(!check.allowed)throw Error(check.reasons.join(' '));}
 if(plan.effect==='bakudan'&&options.mode!=='craft'){
  const prepared=getState(actor).active.find(a=>a.itemId===item.id&&a.stored?.kind==='advanced'&&a.stored.plan.effect==='bakudan');if(!prepared)throw Error('Prepare uma tarja Bakudan antes de ativar.');await releaseStoredSeal(actor,prepared.id);return app.close();
 }
 if(plan.advancedSeal&&(plan.effect!=='bakudan'||options.mode==='craft')){
  plan.consume={key:'special-tag',quantity:1};
  const activation=plan.effect==='wana'?{...copy(plan.trapFrame),trap:true,trapDefensePenalty:-1,name:plan.name+' · '+plan.trapFrame.name,area:plan.trapFrame.area?'cone':null}:copy(plan);activation.cost=plan.effect==='bakudan'?Math.ceil(plan.level/2):0;activation.action=plan.effect==='souin'||plan.effect==='kekkai'?'full':'standard';delete activation.consume;delete activation.stored;
  plan.stored={kind:'advanced',cost:activation.cost,action:activation.action,plan:activation};plan.stat=null;plan.active=null;plan.action='full';plan.duration='permanent';
 }
 const target=options.targetUuid?await fromUuid(options.targetUuid):null;if(plan.healing!=null&&!target&&!plan.self)throw Error('Escolha o paciente.');if(plan.self||options.self)options.targetUuid=actor.uuid;if(plan.healing!=null){const patient=plan.self||options.self?actor:target;owner(patient);if(derivedSummary(patient).state.keys.includes('morto'))throw Error('Este tratamento não ressuscita.');}
 if(plan.consume&&!plan.consume.id){const supply=all.find(i=>i.type==='equipment'&&i.system.catalogKey===plan.consume.key&&number(i.system.quantity)>=plan.consume.quantity);if(!supply)throw Error('É necessário '+(plan.consume.key==='jutsu-scroll'?'um pergaminho de jutsus':'o material indicado')+' disponível.');plan.consume.id=supply.id;}
 if(plan.consume&&number(findItem(actor,plan.consume.id)?.system.quantity)<plan.consume.quantity)throw Error('Quantidade insuficiente do consumível.');
 const executionId=app._powerExecutionId??=uuid();let duplicate=false;
 await updatePower(actor,(state,runtime)=>{
  const prior=state.executions[executionId];if(prior){duplicate=true;plan=copy(prior.plan);for(const key of Object.keys(options))delete options[key];Object.assign(options,copy(prior.options));return;}
  if(plan.limit)claimUsage(runtime,actor,`${item.id}:${plan.effect}`,plan.limit.period,plan.limit.count);
  if(plan.active?.onceScene)claimUsage(runtime,actor,`${item.id}:${plan.effect}`,'scene',1);
  if(plan.waterCreated||plan.waterSpent){const stamp=periodKey(actor,'scene'),current=runtime.water?.stamp===stamp?number(runtime.water.value):0;if(current<number(plan.waterSpent))throw Error('Pontos de água insuficientes.');runtime.water={stamp,value:current+number(plan.waterCreated)-number(plan.waterSpent)};}
  const chakra=actor.system.resources?.chakra?.value,cost=Math.ceil(plan.cost);if(chakra==null||chakra<cost)throw Error('Chakra insuficiente.');
  if(plan.senjutsuCost){const special=actor.system.special?.find(r=>/senjutsu/i.test(r.name));if(!special||number(special.value)<plan.senjutsuCost)throw Error('Registre e preencha a reserva de Chakra Senjutsu antes de usar Senpou Rasengan.');}
  if(plan.active||plan.stored){const active={...copy(plan.active??{}),id:executionId,remaining:plan.effect==='desastre'?plan.periodic.total:undefined,name:plan.name,itemId:item.id,sourceUuid:actor.uuid,targetUuid:options.targetUuid||null,createdTurn:periodKey(actor,'turn'),scene:periodKey(actor,'scene'),duration:plan.duration,stored:plan.stored??null,plan:copy(plan),lastProcessed:{}};state.active.push(active);}
  state.executions[executionId]={plan:copy(plan),options:copy(options),posted:false,consumed:false};
  return {changes:{'system.resources.chakra.value':chakra-cost,...(plan.senjutsuCost?{'system.special':actor.system.special.map(s=>/senjutsu/i.test(s.name)?{...s,value:number(s.value)-plan.senjutsuCost}:s)}:{})}};
 });
 const execution=getState(actor).executions[executionId];if(execution.posted){await app.close();return;}
 if(plan.consume&&!execution.consumed){const supply=findItem(actor,plan.consume.id),receipt=supply.getFlag?.(ID,'powerConsumption')?.[executionId];if(!receipt){if(number(supply.system.quantity)<plan.consume.quantity)throw Error('O consumo ficou pendente: restaure o material e execute novamente para concluir sem cobrar chakra adicional.');await supply.update({'system.quantity':number(supply.system.quantity)-plan.consume.quantity,[`flags.${ID}.powerConsumption.${executionId}`]:true});}await updatePower(actor,s=>{s.executions[executionId].consumed=true;});}
 if(plan.hardness!=null&&(plan.active?.barrier||plan.active?.imaginaryHardness||plan.active?.freeCreation)){const objects=copy(actor.system.physical?.objects??[]);if(!objects.some(o=>o.powerExecution===executionId)){objects.push({id:uuid(),name:plan.name,kind:plan.active?.imaginaryHardness?'imaginary':'barrier',hardness:plan.hardness,powerExecution:executionId,element:plan.family,mist:!!plan.active?.mist,size:'medium'});await actor.update({'system.physical.objects':objects});}}
 if(plan.effect==='criar-arma'||plan.createdWeapon)await createPowerWeapon(actor,item,plan,options,executionId);
 if(plan.purifyTarget){const source=await fromUuid(plan.purifyTarget.sourceUuid);let success=plan.level>plan.purifyTarget.level;if(!success){const r=await rollPowerResistance(actor,'esp',plan.purifyTarget.difficulty,plan,executionId+':purify');success=r.success;}if(success)await endPower(source,plan.purifyTarget.id);}
 if(plan.healing!=null&&plan.duration!=='concentration')await healPowerTarget(actor,plan,options.targetUuid??actor.uuid,executionId);
 if(plan.riskyHealing){const roll=await new foundry.dice.Roll('2d8').evaluate();plan.healing=riskyHealing(plan.healing,roll.total);await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Shousen · Cura Arriscada: ${plan.healing<0?'dano':'cura'} ${Math.abs(plan.healing)} por turno.`,flags:{[ID]:{kind:'power-risky-healing',actorUuid:actor.uuid,executionId}}});await updatePower(actor,s=>{const a=s.active.find(a=>a.id===executionId);if(a){a.healing=plan.healing;a.plan.healing=plan.healing;}});}
 if(['energizar','afiar','arma-eletrica'].includes(plan.effect)){const weapon=findItem(actor,options.weaponId);if(weapon?.system.inventoryData?.coating&&!weapon.system.inventoryData.coating.dokujutsu)await weapon.update({'system.inventoryData.coating':null});}
 if(plan.trap&&plan.stored){const active=getState(actor).active.find(a=>a.id===executionId);if(!active.stored.attack){const message=await postPowerRoll(actor,item,{...plan.stored.plan,cost:plan.cost},{executionId,trapCreation:true});await updatePower(actor,s=>{s.active.find(a=>a.id===executionId).stored.attack=message.getFlag(ID,'powerAttack');});}}
 else if(plan.stat)await postPowerRoll(actor,item,plan,{executionId,targetUuid:options.targetUuid});else await postPowerCard(actor,plan,{executionId,itemId:item.id});
 await updatePower(actor,s=>{s.executions[executionId].posted=true;});await app.close();
}
export async function postPowerCard(actor,plan,extra={}){return ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:planHtml(plan),flags:{[ID]:{kind:'power-use',actorUuid:actor.uuid,plan,...extra}}});}
function planHtml(plan){return `<div class="sns-app"><article class="sns-record"><header><strong>${esc(plan.name)}</strong></header><p>Nível ${plan.level} · chakra ${plan.cost} · ${esc(POWER_ACTION_NAMES[plan.action]??plan.action)} · ${esc(POWER_DURATION_NAMES[plan.duration]??plan.duration)}.</p>${plan.damage!=null?`<p>Dano base ${plan.damage}.</p>`:''}${plan.healing!=null?`<p>Cura ${plan.healing} ao fim do turno do paciente.</p>`:''}${plan.message?`<p>${esc(plan.message)}</p>`:''}<ul>${(plan.notes??[]).filter(Boolean).map(n=>'<li>'+esc(n)+'</li>').join('')}</ul><small>${esc(plan.source)}</small></article></div>`;}
export async function postPowerRoll(actor,item,plan,extra={}){
 const kind=plan.defensive?'defense':plan.kind??(plan.stat in COMBAT?'attack':plan.stat in SKILLS?'skill':'attribute'),check=statPrecision(actor,plan.stat,{kind,reaction:!!plan.defensive,manualContext:true,requiresSeals:plan.seals});if(!check.allowed)throw Error(check.reasons.join(' '));
 if(kind==='attack'&&!extra.trapCreation&&!await checkInventoryAttack(actor))return null;
 const uncapped=number(check.uncappedPenalty),precision=check.base+Math.max(-3,check.penalty-uncapped+number(plan.penalty))+uncapped+check.bonus+number(plan.precisionBonus),roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision,result=powerAttackResult(plan,natural),attack={actorUuid:actor.uuid,itemId:item.id,executionId:extra.executionId,plan:copy(plan),precision,total:roll.total,...result,targetUuid:extra.targetUuid,sequenceIndex:extra.sequenceIndex??0,previousTargets:extra.previousTargets??[]};
 return roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:planHtml(plan)+`<p>${esc(ATTRIBUTES[plan.stat]??COMBAT[plan.stat]??SKILLS[plan.stat]?.[0]??plan.stat)}: precisão ${precision} · grau ${result.degree}${result.damage!=null?' · dano '+result.damage+' antes das proteções':''}.</p>${kind==='attack'&&!result.failed&&!extra.trapCreation?`<button type="button" data-sns-power-resolve>Conferir defesa e aplicar no alvo</button>`:''}`,flags:{[ID]:{kind:'power-attack',actorUuid:actor.uuid,powerAttack:attack}}});
}
async function healPowerTarget(actor,plan,targetUuid,sourceId){
 const target=await fromUuid(targetUuid);owner(target);if(number(plan.healing)<0)return applyPhysicalDamage(target,{fixed:-plan.healing,sourceId,reason:plan.name,attackerUuid:actor.uuid,camouflageContext:{located:true},ignoreAbsorption:true,ignoreBodyHardness:[bodyHardness(target)]});
 if(derivedSummary(target).state.keys.includes('morto'))throw Error('Este tratamento não ressuscita.');
 const current=target.system.resources?.vitality?.value,max=derivedSummary(target).vitality;if(current==null||!Number.isFinite(max))throw Error('Preencha os recursos do paciente.');
 await updatePower(target,state=>{if(state.receipts[sourceId])return;state.receipts[sourceId]={healing:plan.healing};return {changes:{'system.resources.vitality.value':Math.min(max,current+number(plan.healing))}};});
 await updatePower(target,s=>{s.bisturiHits={};});
 if(target.system.resources.vitality.value>=-20&&target.system.resources.vitality.value<=-11&&!conditionRecords(target).some(c=>c.key==='estavel'))await saveCondition(target,{key:'estavel',source:plan.name});
 for(const c of conditionRecords(target).filter(c=>!c.automatic&&(c.key==='sangrando'||String(c.source??'').includes('Bisturi de Chakra'))))await saveCondition(target,c,{remove:true});
}
const resolutionQueues=new Map();
export async function resolvePowerAttack(message,targetUuid,options={}){
 const key=message.id+':'+targetUuid,previous=resolutionQueues.get(key)??Promise.resolve(),job=previous.catch(()=>{}).then(()=>resolvePowerAttackNow(message,targetUuid,options));resolutionQueues.set(key,job);try{return await job;}finally{if(resolutionQueues.get(key)===job)resolutionQueues.delete(key);}
}
async function resolvePowerAttackNow(message,targetUuid,options={}){
 const attack=message.getFlag(ID,'powerAttack');if(!attack)throw Error('Ataque não encontrado.');const actor=await fromUuid(attack.actorUuid),target=await fromUuid(targetUuid);owner(target);
 const receiptId=`${message.uuid??message.id}:${target.uuid}`,prior=getState(target).receipts[receiptId];if(prior?.complete)return {...prior,duplicate:true};
 const plan=copy(attack.plan);if((attack.previousTargets??[]).includes(target.uuid))throw Error('Ricochete deve seguir para outro alvo.');if(getState(target).active.some(a=>a.submerged))throw Error('O alvo submerso em Colisão de Ondas não pode receber outros ataques físicos.');if(attack.failed)throw Error('Falha automática não atinge o alvo.');
 if(options.defense==='bloqueio'&&plan.noBlock||options.defense==='esquiva'&&plan.noDodge)throw Error('Este efeito não permite a defesa escolhida.');
 if(plan.active?.bisturi&&options.defense==='bloqueio'&&options.unarmedBlock==='yes')throw Error('Bisturi de Chakra não permite Bloqueio desarmado.');
 const before=plan.resistances.filter(r=>r.beforeDefense);if(before.length&&!getState(target).receipts[`${message.id}:before`])throw Error('Resolva primeiro os testes anteriores à defesa.');
 let hit=options.hit||attack.critical,degree=attack.degree;
 if(options.defense==='bloqueio'&&(plan.family==='rasengan'||plan.effect==='lamina-raios'))hit=await breakCommonBlockingWeapon(target,plan.family==='rasengan'?'rasengan':'lightning',options.blockingWeapon)||hit;
 const defenseTotal=Number(options.defenseTotal);if((hit&&plan.followupRolls||!hit&&plan.rerollAfterDefense)&&(!Number.isFinite(defenseTotal)||options.defenseTotal==null))throw Error('Informe o resultado já rolado da defesa para os ataques adicionais.');
 if(!hit&&plan.rerollAfterDefense&&['esquiva','antecipar'].includes(options.defense)&&Number(options.targets??1)===1){const retry=await rollFollowup(actor,attack,target,`${message.id}:retry`,defenseTotal);hit=retry.hit;if(hit){plan.damage=Math.ceil(plan.damage*plan.rerollAfterDefense.multiplier);degree=retry.degree;}}
 if(!hit){for(let i=0;i<plan.resistances.length;i++){const r=plan.resistances[i];if(r.afterSuccessfulDefense){const result=await rollPowerResistance(target,r.stat,r.difficulty,plan,`${message.id}:residual:${i}`);if(!result.success){hit=true;degree=r.residualDegree;}}}if(!hit)return {hit:false};}
 if(plan.explosionResistance&&options.attached!=='yes'&&!derivedSummary(target).state.immobile){const r=plan.explosionResistance,result=await rollPowerResistance(target,options.explosionStat==='prontidao'?'prontidao':'agi',r.difficulty,plan,`${message.id}:explosion`);if(result.success)return {hit:false,damage:0};}
 if(plan.followupRolls)for(let i=0;i<plan.followupRolls;i++){const result=await rollFollowup(actor,attack,target,`${message.id}:followup:${i}`,defenseTotal);if(result.hit)plan.damage++;}
 if(plan.effect==='flechas'){const count=Number(options.projectiles??plan.projectiles);if(!Number.isInteger(count)||count<1||count>plan.projectiles)throw Error('Quantidade de projéteis por alvo inválida.');plan.damage-=2*(plan.projectiles-count);}
 if(plan.effect==='meteoros'&&(!Number.isInteger(Number(options.meteors??1))||Number(options.meteors??1)<1||Number(options.meteors??1)>6))throw Error('Use de 1 a 6 meteoros por alvo.');
 if(options.secondary==='yes'&&plan.secondaryRadius){degree=powerAttackResult({...plan,minimumDegree:0},attack.natural).degree;plan.collateralDamage=0;}


 const multiplier=plan.splitDamage?Math.max(1,number(options.targets??plan.targets)):1;
 let outcome={hit:true,damage:0};
 {const ignore=plan.ignoreAllBodyHardness?bodyHardness(target):number(plan.ignoreBodyHardness);outcome=await applyPhysicalDamage(target,{base:plan.damage??0,fixed:plan.fixedDamage!=null?number(plan.fixedDamage)*(plan.effect==='meteoros'?Math.max(1,number(options.meteors??1)):1):0,degree,divisionCount:multiplier,divisionIndex:number(options.divisionIndex),ignoreBodyHardness:[plan.active?.conditionalHardness?0:ignore],conditionalHardness:plan.active?.conditionalHardness,sourceId:receiptId,reason:plan.name,critical:attack.critical,attackerUuid:actor.uuid,attackerElement:plan.element??plan.family,camouflageContext:{located:options.located!=='no',sensor:options.sensor==='yes',areaFraction:number(options.areaFraction),distance:number(options.distance??2)}});}
 if(outcome.hit===false)return outcome;
 if(plan.poisonSnapshot)await exposePoisonFromPower(target,plan.poisonSnapshot,{sourceId:receiptId+':poison',attackerUuid:actor.uuid,hit:true,usingPower:true,guaranteedInjection:true,damage:0,damageGrade:attack.degree});
 const resistances=[];for(let index=0;index<plan.resistances.length;index++){
  const r=plan.resistances[index];if(r.beforeDefense||r.eachStart||r.escape||r.endsUntil||r.allowsAttackFromInside||r.surface||r.holdBreath||r.sourceProtectsAlly||r.afterSuccessfulDefense)continue;if(r.requiresDamage&&!outcome.damage)continue;
  const stat=Array.isArray(r.stat)?options['resistStat.'+index]??r.stat[0]:r.stat;if(Array.isArray(r.stat)&&!r.stat.includes(stat))throw Error('Resistência inválida.');
  const difficulty=Array.isArray(r.stat)&&stat===r.stat[1]&&r.alternateDifficulty!=null?r.alternateDifficulty:r.difficulty,result=await rollPowerResistance(target,stat,difficulty,plan,receiptId+':'+index);
  resistances.push({...r,...result});if(!result.success)for(const key of r.onFail??[])await applyPowerCondition(target,key,plan,receiptId,{remaining:r.remaining,timing:r.timing,level:r.level,scope:r.scope,difficulty:r.difficulty});
  if(r.criticalFailureRepeatUnconscious&&result.natural<=3){const second=await rollPowerResistance(target,stat,difficulty,plan,receiptId+':'+index+':critical');if(!second.success)await applyPowerCondition(target,'inconsciente',plan,receiptId);}
 }
 for(const key of (resistances.some(r=>r.avoidsCondition&&r.success)?[]:plan.conditions??[]))await applyPowerCondition(target,key,plan,receiptId,{...(plan.conditionTurns?{remaining:plan.conditionTurns,timing:'Fim do turno'}:{}),...(plan.active?.conditions?{powerSourceExecution:attack.executionId}:{})});
 if(plan.periodic?.immediate){await updatePower(target,state=>{if(!state.active.some(a=>a.id===receiptId))state.active.push({id:receiptId,name:plan.name,family:plan.family,effect:plan.effect,sourceUuid:actor.uuid,itemId:attack.itemId,duration:'continuous',level:plan.level,plan:copy(plan),periodic:copy(plan.periodic),linkedTo:attack.executionId??message.id,remainingDamage:plan.periodic.total-1,starts:0,createdTurn:periodKey(target,'turn'),lastProcessed:{}});});}
 if(plan.active?.suffocation||plan.effect==='colisao-ondas')await applyPowerCondition(target,'sufocamento',plan,receiptId,{difficulty:plan.common.difficulty-2,damage:plan.effect==='colisao-ondas'?plan.damage:undefined,powerSourceExecution:attack.executionId});
 if(plan.inventoryMark)await target.update({'system.inventoryState.marked':{source:actor.uuid,at:Number(game.time?.worldTime??0)}});
 if(plan.active?.bisturi){let count;await updatePower(target,s=>{s.bisturiHits??={};const key=actor.uuid;const ledger=s.bisturiHits[key]??={messages:[]};if(!ledger.messages.includes(message.id))ledger.messages.push(message.id);count=ledger.messages.length;});if(count===3){const r=await rollPowerResistance(target,'vig',plan.active.difficulty,plan,receiptId+':bisturi');if(!r.success)for(const key of ['lento','debilitado'])await applyPowerCondition(target,key,{...plan,name:'Bisturi de Chakra'},receiptId,{durationText:'2 meses; remove após Iryou Ninjutsu ou 1 mês de repouso'});}}
 if(plan.inventorySmoke)await updatePower(target,s=>{if(!s.active.some(a=>a.id===receiptId))s.active.push({id:receiptId,name:plan.name,sourceUuid:actor.uuid,duration:'continuous',remaining:3,camouflage:{level:'partial',group:'environment'}});});
 if(plan.camouflagePenalty)await updatePower(target,state=>{if(!state.active.some(a=>a.id===receiptId))state.active.push({id:receiptId,name:plan.name,effect:plan.effect,sourceUuid:actor.uuid,duration:'continuous',remaining:plan.conditionTurns,plan:copy(plan),linkedTo:attack.executionId??message.id,camouflage:{level:plan.camouflagePenalty===50?'total':'partial',group:'personal',visualImpairment:true},lastProcessed:{}});});
 if(plan.active?.conditions||plan.active?.suffocation||plan.resistances.some(r=>r.escape||r.endsUntil||r.surface))await updatePower(target,state=>{if(!state.active.some(a=>a.id===receiptId))state.active.push({id:receiptId,name:plan.name,effect:plan.effect,sourceUuid:actor.uuid,duration:'linked',linkedTo:attack.executionId,submerged:plan.effect==='colisao-ondas',plan:copy(plan),lastProcessed:{}});});
 if(plan.collateralDamage){const collateralId=`${message.uuid??message.id}:collateral`;if(actor.isOwner)await applyPhysicalDamage(actor,{base:plan.collateralDamage,degree:1,sourceId:collateralId,reason:'Dano colateral de Rasengan Elemental',attackerUuid:actor.uuid,critical:true,camouflageContext:{located:true}});else if(!prior?.collateralPosted){await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:'<p>Rasengan Elemental: o usuário deve resolver seu dano colateral.</p><button type="button" data-sns-power-collateral>Aplicar dano colateral</button>',flags:{[ID]:{powerCollateral:{actorUuid:actor.uuid,damage:plan.collateralDamage,receiptId:collateralId}}}});await updatePower(target,s=>{s.receipts[receiptId]={...s.receipts[receiptId],collateralPosted:true};});}}
 for(const c of conditionRecords(target).filter(c=>c.powerReceipt===`${message.id}:before`))await saveCondition(target,c,{remove:true});
 await updatePower(target,state=>{state.receipts[receiptId]={complete:true,hit:true,damage:outcome.damage,resistances};});
 const continuation=plan.sequence&&(attack.sequenceIndex??0)+1<plan.targets?{...attack,sequenceIndex:(attack.sequenceIndex??0)+1,previousTargets:[...(attack.previousTargets??[]),target.uuid]}:null;
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:target}),content:`<p>${esc(plan.name)} em ${esc(target.name)}: ${outcome.damage?outcome.damage+' de dano aplicado.':'Efeitos resolvidos.'}</p>${continuation?'<button type="button" data-sns-power-continue>Ricochetear para outro alvo</button>':''}`,flags:{[ID]:{kind:'power-result',sourceMessage:message.uuid,targetUuid:target.uuid,outcome,resistances,powerContinuation:continuation}}});return outcome;
}
async function rollPowerResistance(target,stat,difficulty,plan,key){
 const prior=getState(target).receipts[key];if(prior)return prior;
 const check=statPrecision(target,stat,{kind:stat in SKILLS?'skill':'resistance',reaction:true,bodyResistance:stat==='vig',manualContext:true});if(!check.allowed){const result={stat,difficulty,natural:0,total:0,success:false,automaticFailure:true};await updatePower(target,s=>{s.receipts[key]=result;});return result;}const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision,success=natural>=15||natural>3&&roll.total>=difficulty,result={stat,difficulty,natural,total:roll.total,success};
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:target}),flavor:`${esc(plan.name)} · resistência ${esc(stat)} ${difficulty}: ${success?'sucesso':'falha'}.`,flags:{[ID]:{kind:'power-resistance',testKind:stat in SKILLS?'skill':'resistance',actorUuid:target.uuid,stat,natural,precision:check.precision,difficulty,success}}});await updatePower(target,s=>{s.receipts[key]=result;});return result;
}
async function applyPowerCondition(target,key,plan,receiptId,extra={}){const existing=conditionRecords(target).find(c=>c.key===key&&c.powerReceipt===receiptId);if(existing)return;await saveCondition(target,{key,source:`${plan.name} · ${plan.source}`,powerReceipt:receiptId,...extra});}
export async function endPower(actor,id){
 owner(actor);const record=getState(actor).active.find(a=>a.id===id);if(!record)return;
 await updatePower(actor,state=>{state.active=state.active.filter(a=>a.id!==id);});
 for(const item of itemsOf(actor).filter(i=>i.getFlag?.(ID,'createdPower')?.executionId===id))await item.delete();
 if((actor.system.physical?.objects??[]).some(o=>o.powerExecution===id))await actor.update({'system.physical.objects':actor.system.physical.objects.filter(o=>o.powerExecution!==id)});
 for(const target of game.actors.filter(a=>a.isOwner)){for(const condition of conditionRecords(target).filter(c=>c.powerSourceExecution===id||String(c.powerReceipt??'').includes(id)))await saveCondition(target,condition,{remove:true});const linked=getState(target).active.filter(a=>a.linkedTo===id);for(const c of conditionRecords(target).filter(c=>linked.some(a=>a.id===c.powerReceipt)))await saveCondition(target,c,{remove:true});if(linked.length)await updatePower(target,state=>{state.active=state.active.filter(a=>a.linkedTo!==id);});}
}
export async function maintainPower(actor,id){
 owner(actor);const active=getState(actor).active.find(a=>a.id===id);if(!active)throw Error('Poder em manutenção não encontrado.');const plan=active.plan??{},turn=periodKey(actor,'turn');
 const action=active.duration==='concentration'?'standard':active.duration==='sustained'?'partial':'free';assertAction(actor,{action,seals:false,maintenance:true});
 await updatePower(actor,state=>{const record=state.active.find(a=>a.id===id);if(record.lastProcessed?.maintenance===turn)throw Error('A manutenção já foi processada neste turno.');const cost=number(plan.maintenanceCost),chakra=actor.system.resources.chakra.value;if(chakra<cost)throw Error('Chakra insuficiente para manter o poder.');record.lastProcessed??={};record.lastProcessed.maintenance=turn;return {changes:cost?{'system.resources.chakra.value':chakra-cost}:{}};});
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>${esc(active.name)} mantido: ação ${action==='standard'?'padrão':action==='partial'?'parcial':'livre'}${plan.maintenanceCost?' · '+plan.maintenanceCost+' chakra':''}. ${plan.healing!=null?'Cura será processada no fim do turno do paciente.':''}</p>`});
}
async function touchPowerAttack(actor,id){
 const active=getState(actor).active.find(a=>a.id===id);if(!active?.touchDamage)throw Error('Técnica de toque preparada não encontrada.');const item=findItem(actor,active.itemId);if(!item)throw Error('Poder de origem não encontrado.');const plan={...active.plan,damage:active.touchDamage,action:'standard',stat:'cc',cost:0,duration:'instant',seals:false,critical:active.critical??15,ignoreAllBodyHardness:active.ignoreAllBodyHardness??false,ignoreBodyHardness:active.ignoreHardness??0};assertAction(actor,plan);await postPowerRoll(actor,item,plan,{executionId:id});if(active.oneAttack)await endPower(actor,id);
}
async function releaseStoredSeal(actor,id){
 const active=getState(actor).active.find(a=>a.id===id);if(!active?.stored)throw Error('Conteúdo selado não encontrado.');const stored=active.stored,plan=stored.kind==='advanced'?stored.plan:stored.frame;let cost=stored.kind==='objects'?1:number(stored.cost);const clones=plan?.chargeOnActivation?game.actors.filter(a=>a.getFlag?.(ID,'clone')?.origin===actor.uuid&&a.getFlag(ID,'clone').type==='kage-bunshin'&&!a.getFlag(ID,'clone').dismissed):[];if(plan?.chargeOnActivation){if(number(actor.system.resources.chakra.value)+clones.reduce((s,c)=>s+number(c.system.resources.chakra.value),0)<15)throw Error('Contenção exige 15 chakra, incluindo Kage Bunshins.');for(const clone of clones)owner(clone);cost=Math.max(0,number(actor.system.resources.chakra.value)-1);}
 if(plan)assertAction(actor,{...plan,cost,maintenance:true});
 await updatePower(actor,state=>{const record=state.active.find(a=>a.id===id),chakra=actor.system.resources.chakra.value;if(chakra<cost)throw Error('Chakra insuficiente.');if(record.stored.kind==='objects'&&--record.stored.remaining>0){}else state.active=state.active.filter(a=>a.id!==id);if(plan?.active)state.active.push({...copy(plan.active),id:uuid(),name:plan.name,itemId:active.itemId,sourceUuid:actor.uuid,duration:plan.duration,plan:copy(plan),createdTurn:periodKey(actor,'turn'),lastProcessed:{}});return {changes:{'system.resources.chakra.value':plan?.chargeOnActivation?1:chakra-cost}};});
 for(const clone of clones)await clone.update({'system.resources.chakra.value':0});
 if(stored.attack){const attack={...copy(stored.attack),plan:{...stored.plan,cost},executionId:id};await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:planHtml(attack.plan)+`<p>Teste registrado na criação: ${attack.total}. Defesa da vítima: −1.</p><button type="button" data-sns-power-resolve>Conferir defesa e aplicar no alvo</button>`,flags:{[ID]:{kind:'power-attack',actorUuid:actor.uuid,powerAttack:attack}}});}
 else if(plan?.stat)await postPowerRoll(actor,findItem(actor,active.itemId),{...plan,cost},{executionId:id});else await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:plan?planHtml({...plan,cost}):`<p>Selo liberado: um compartimento; use a ação normal para sacar/usar o conteúdo. Custo ${cost} chakra.</p>`});
}
async function createPowerWeapon(actor,item,plan,options,executionId){
 if(itemsOf(actor).some(i=>i.getFlag?.(ID,'createdPower')?.executionId===executionId))return;
 const weapon=WEAPONS.find(w=>w.key===plan.createdWeapon.key&&w.book===plan.createdWeapon.book);if(!weapon)throw Error('Arma de origem não encontrada.');
 const created=await actor.createEmbeddedDocuments('Item',[{name:`${weapon.name} · ${POWER_FAMILIES[plan.family].name}`,type:'equipment',img:ICONS.equipment,flags:{[ID]:{createdPower:{executionId,family:plan.family,sourceItem:item.id,duration:plan.duration,projectileBlock:true,hardness:plan.common.hardness}}},system:{catalogKey:weapon.key,catalogBook:weapon.book,source:{book:'basico',page:'96'},quantity:Number(weapon.capacity??1),active:true,equipped:true,damage:String(weapon.damage),damageType:weapon.damageType,critical:String(weapon.critical),range:String(weapon.range??0),hardness:plan.common.hardness}}]);
 if(plan.effect==='arma-eletrica')await updatePower(actor,s=>{const active=s.active.find(a=>a.id===executionId);if(active){active.weaponId=created[0].id;if(options.mode==='projectiles')delete active.damageAttribute;}});
}
export async function advancePowerPhase(actor,key,phase){
 owner(actor);const state=getState(actor);if(state.phases?.includes(key))return {duplicate:true};let ended=[],periodic=[];if(state.phaseWork?.[key])({ended,periodic}=state.phaseWork[key]);
 if(!state.phaseWork?.[key])await updatePower(actor,s=>{for(const a of s.active){a.lastProcessed??={};if(phase==='end'&&a.burstBodyHardness!=null){a.bodyHardness=a.sustainedBodyHardness??0;delete a.burstBodyHardness;}if(phase==='start'&&a.untilSourceNextStart&&a.createdTurn!==periodKey(actor,'turn'))ended.push(a.id);if(phase==='end'&&a.remaining!=null&&--a.remaining<=0)ended.push(a.id);if(phase==='start'&&a.periodic?.immediate&&a.createdTurn!==periodKey(actor,'turn')){a.starts++;if(a.starts>=2&&a.remainingDamage>0){periodic.push({id:a.id,damage:a.periodic.damage,name:a.name,sourceUuid:a.sourceUuid});if(--a.remainingDamage<=0)ended.push(a.id);}}}s.phaseWork??={};s.phaseWork[key]={ended,periodic};});
 for(const p of periodic)await applyPhysicalDamage(actor,{fixed:p.damage,sourceId:`${p.id}:${key}`,reason:p.name,attackerUuid:p.sourceUuid,camouflageContext:{located:true},critical:true});
 for(const id of ended)await endPower(actor,id);
 if(phase==='end')for(const active of getState(actor).active.filter(a=>a.freedUntilEnd)){for(const c of active.plan.conditions??[])await applyPowerCondition(actor,c,active.plan,active.id,{powerSourceExecution:active.linkedTo});await updatePower(actor,s=>{const a=s.active.find(a=>a.id===active.id);if(a)delete a.freedUntilEnd;});}
 if(phase==='start')for(const active of getState(actor).active.filter(a=>a.areaMembership)){const source=await fromUuid(active.sourceUuid);if(!source)continue;const plan=active.plan;if(active.chakraDrain&&!active.sameSignature&&source.uuid!==actor.uuid){await updatePower(actor,s=>{const receipt=`${active.id}:${key}:drain`;if(!s.receipts[receipt]){s.receipts[receipt]={drained:true};return {changes:{'system.resources.chakra.value':Math.max(1,number(actor.system.resources.chakra.value)-active.chakraDrain)}};}});}if(active.effect==='nuvem'&&source.uuid!==actor.uuid){const r=plan.resistances.find(r=>r.eachStart),result=await rollPowerResistance(actor,'vig',r.difficulty,plan,`${active.id}:${key}`);if(!result.success){await applyPhysicalDamage(actor,{fixed:r.damage,sourceId:`${active.id}:${key}:damage`,reason:plan.name,attackerUuid:source.uuid,critical:true,camouflageContext:{located:true}});await applyPowerCondition(actor,'lento',plan,active.id,{remaining:1,timing:'Início do turno',powerSourceExecution:active.linkedTo});}}if(active.effect==='desastre'&&source.uuid!==actor.uuid){if(active.protectAlly&&source.isOwner&&!active.lingering){const r=await rollPowerResistance(source,'concentracao',9+2*plan.level,plan,`${active.id}:${key}:protect`);if(r.success)continue;}await applyPowerCondition(actor,'lento',plan,active.id,{powerSourceExecution:active.linkedTo});await postPowerRoll(source,findItem(source,active.itemId),{...plan,cost:0},{executionId:active.id,targetUuid:actor.uuid});}}
 if(phase==='end')for(const source of game.actors){for(const a of source.system.powerState?.active??[]){if(a.plan?.healing==null||(a.targetUuid??source.uuid)!==actor.uuid)continue;if(derivedSummary(source).state.noActions)continue;await healPowerTarget(source,a.plan,actor.uuid,`${a.id}:heal:${key}`);}}
 await updatePower(actor,s=>{s.phases=[...(s.phases??[]),key].slice(-100);delete s.phaseWork?.[key];});
 return {ended,periodic};
}
export function powerBonuses(actor){const active=(actor.system?.powerState?.active??[]).filter(a=>a.active!==false),skills={};for(const a of active){for(const[k,v]of Object.entries(a.skillBonus??{}))skills[k]=Math.max(skills[k]??0,number(v));if(a.flightSkill!=null)skills.voo=Math.max(skills.voo??0,number(a.flightSkill));}return {skills,movement:Math.max(0,...active.map(a=>number(a.movementBonus))),bodyHardness:Math.max(0,...active.map(a=>Math.max(number(a.bodyHardness),number(a.burstBodyHardness)))),weapons:active.filter(a=>a.damageAttribute||a.electricMode||a.stoneFist)};}

async function escapePower(actor,id,options={}){
 const active=getState(actor).active.find(a=>a.id===id);if(!active)throw Error('Efeito não encontrado.');const plan=active.plan,r=plan?.resistances?.find(r=>r.escape||r.endsUntil||r.allowsAttackFromInside||r.surface);
 if(!r)throw Error('Este efeito não possui uma tentativa de saída nesta ficha.');
 let success=options.withoutTest==='yes'&&r.standardNoTest;
 if(success&&r.cuttingWeaponRequired&&!itemsOf(actor).some(i=>i.type==='equipment'&&!i.system.destroyed&&/Corte/i.test(i.system.damageType??WEAPONS.find(w=>w.key===i.system.catalogKey)?.damageType??'')))throw Error('É necessária uma arma de corte para sair sem teste.');
 const available=Array.isArray(r.stat)?r.stat:[r.stat],stat=available.includes(options.stat)?options.stat:available[0];
 if(!success){const check=statPrecision(actor,stat,{kind:stat in SKILLS?'skill':'resistance',resistingId:conditionRecords(actor).find(c=>c.powerReceipt===active.id)?.id??active.id,manualContext:true,bodyResistance:stat==='vig'});if(!check.allowed)throw Error(check.reasons.join(' '));const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision,difficulty=stat===available[1]&&r.alternateDifficulty!=null?r.alternateDifficulty:r.difficulty;success=natural>=15||natural>3&&roll.total>=difficulty;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`${esc(plan.name)}: tentativa ${success?'bem-sucedida':'falhou'} · dificuldade ${difficulty}.`});}
 if(!success)return;
 if(r.allowsAttackFromInside||r.endsUntil){for(const c of conditionRecords(actor).filter(c=>c.powerReceipt===active.id))await saveCondition(actor,c,{remove:true});await updatePower(actor,s=>{const a=s.active.find(a=>a.id===id);if(r.endsUntil)a.freedUntilEnd=true;else a.freedForScene=true;});}
 else await endPower(actor,id);
}

async function rollFollowup(source,attack,target,key,defenseTotal){
 const prior=getState(target).receipts[key];if(prior)return prior;
 const roll=await new foundry.dice.Roll(`2d8 + (${attack.precision})`).evaluate(),natural=roll.total-attack.precision,result={...powerAttackResult(attack.plan,natural),total:roll.total,hit:natural>=Number(attack.plan.critical??15)||natural>3&&roll.total>=defenseTotal};
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:source}),flavor:`${esc(attack.plan.name)} · ataque adicional contra defesa ${defenseTotal}: ${result.hit?'acerto':'falha'}.`});await updatePower(target,s=>{s.receipts[key]=result;});return result;
}
export async function preparePowerDefense(message,targetUuid,options={}){
 const attack=message?.getFlag(ID,'powerAttack');if(!attack)throw Error('Ataque não encontrado.');const target=await fromUuid(targetUuid);owner(target);const key=`${message.id}:before`,prior=getState(target).receipts[key];if(prior)return prior;
 const outcomes=[];for(let i=0;i<attack.plan.resistances.length;i++){const r=attack.plan.resistances[i];if(!r.beforeDefense)continue;const result=await rollPowerResistance(target,r.stat,r.difficulty,attack.plan,`${key}:${i}`);if(!result.success)for(const c of r.onFail)await applyPowerCondition(target,c,attack.plan,key,{level:r.level,scope:r.scope,remaining:1,timing:'Fim do turno'});outcomes.push(result);}
 await updatePower(target,s=>{s.receipts[key]=outcomes;});return outcomes;
}
