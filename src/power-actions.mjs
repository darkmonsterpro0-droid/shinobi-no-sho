import {mindBinding,canDirectMind,mindDamageDivisor} from './yamanaka-state.mjs';
import {recordKey,readKeyedRecord} from './core/record-key.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';
import {measureTokenDistance} from './core/token-distance.mjs';
import {commitShadowUse} from './nara.mjs';
import {partnerDamageDivisor} from './partners.mjs';
import {replacementPatch} from './core/document-patch.mjs';
import {canCoordinateArea,canCoordinateSinglePower} from './power-rules.mjs';
import {moveCharge,prepareLineCharge} from './charge-movement.mjs';
import {immuneToSound} from './sound-effects.mjs';
import {canGroupPower,groupedPowerEffects,validatePowerGroup} from './power-targets.mjs';
import {previewSceneArea} from './scene-area.mjs';
import {attackTargets,tokenDistance} from './saved-actions.mjs';
import {clanCapabilities,corpulenciaPayment,spendMangekyouVision} from './clan-capabilities.mjs';
import {worldProfile,worldRules} from './world-settings.mjs';
import {breakCommonBlockingWeapon} from './power-defense.mjs';
import {ID,ICONS,ATTRIBUTES,COMBAT,SKILLS} from './config.mjs';
import {POWER_FAMILIES,POWER_TECHNIQUES,ELEMENTS,POWER_ACTION_NAMES,POWER_DURATION_NAMES} from './power-data.mjs';
import {powerFamily,powerUseItem,powerPlan,powerAttackResult,validatePowerPurchase,affinityStatus,requiresPowerMaintenance} from './power-rules.mjs';
import {pointBudgets} from './build-rules.mjs';
import {META_APTITUDES,modifyTechnique,riskyHealing,skillResistanceDifficulty,hasNinpouDomain} from './technique-aptitudes.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {mutateRuntime,claimUsage,periodKey,runtimeBonuses,activeAptitudes} from './aptitude-runtime.mjs';
import {effectiveAttributes,sizeProfile,SIZES} from './physical-rules.mjs';
import {applyPhysicalDamage,bodyHardness} from './physical-actions.mjs';
import {houseRules,derivedSummary,mentalControllerSummary,statPrecision,saveCondition,conditionRecords} from './automation.mjs';
import {readFields} from './interactions.mjs';
import {poisonTraining} from './inventory-rules.mjs';
import {POISONS} from './inventory-data.mjs';
import {WEAPONS} from './weapons.mjs';
import {canControl,terminalExecution} from './core/execution.mjs';
import {joinedBody,bodySource} from './body-state.mjs';
import {gateBenefits,hachimonProfile} from './hachimon-rules.mjs';
import {fusionParticipants,prepareFusionScene,applyBodyFusion,finishBodyFusion} from './inuzuka-fusion.mjs';
import {exposePoisonFromPower,checkInventoryAttack} from './inventory-actions.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number(v??0),uuid=()=>foundry.utils.randomID(),copy=v=>structuredClone(v);
const receiptBelongsTo=(receipt,id)=>typeof receipt==='string'&&(receipt===id||receipt.startsWith(id+':'));
const read=(root,prefix)=>Object.fromEntries(Object.entries(readFields(root,prefix)).map(([k,v])=>[k.slice(prefix.length),v]));
const itemsOf=actor=>[...(actor?.items??[])],findItem=(actor,id)=>actor?.items?.get?.(id)??itemsOf(actor).find(i=>i.id===id),profile=()=>worldProfile()??{books:['basico','avancado']};
const context=actor=>({actor,rules:houseRules(),books:profile().books,attributes:effectiveAttributes(actor.system)});
const targets=()=>game.actors.filter(a=>a.visible).map(a=>({uuid:a.uuid,name:a.name,weapons:itemsOf(a).filter(i=>i.type==='equipment').map(i=>({id:i.id,name:i.name}))}));
const owner=actor=>{if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode executar esta ação.');};
export const POWER_ACTIONS=new Set(['power-collateral','power-continue','power-catalog','power-new','power-edit','power-save','power-preview-editor','power-use','power-preview-use','power-execute','power-end','power-maintain','power-touch-attack','power-release-seal','power-affinity','power-resolve','power-counter-technique','power-confirm-hit','power-prepare-defense','power-area','power-area-add','power-area-remove','power-escape']);
const getState=actor=>({active:[],executions:{},receipts:{},...copy(actor.system.powerState??{})});
POWER_ACTIONS.add('power-fusion-resume');
POWER_ACTIONS.add('power-shadow-prepare');
POWER_ACTIONS.add('power-shadow-pull');
POWER_ACTIONS.add('power-mind-attack');
POWER_ACTIONS.add('power-mind-move');POWER_ACTIONS.add('power-mind-ready');
POWER_ACTIONS.add('power-mind-ability');POWER_ACTIONS.add('power-mind-test');
POWER_ACTIONS.add('power-mind-sensor');
export async function updatePower(actor,fn){return mutateRuntime(actor,async runtime=>{const previous=getState(actor),state=copy(previous),r=await fn(state,runtime)??{};return {...r,changes:{'system.powerState':replacementPatch(previous,state),...r.changes}};});}
export function assertAction(actor,plan){
 if(joinedBody(actor))throw Error('Este participante integra o corpo unido. Execute a ação pela ficha do Inuzuka.');
 const transfer=getState(actor).active.find(p=>p.mentalControl?.mode!=='disorder'&&p.mentalControl?.assumed&&p.active!==false);
 if(transfer&&plan.family==='shindenshin'&&!plan.maintenance)throw Error(plan.effect==='sensor-mentes'?'Ative o Sensor de Mentes pelos controles do corpo possuído.':'Durante a Troca de Mente, Shindenshin permite apenas Sensor de Mentes.');
 const state=(transfer&&plan.family==='shindenshin'&&plan.effect==='sensor-mentes'?mentalControllerSummary(actor):derivedSummary(actor)).state,reaction=plan.defensive||plan.action==='reaction';
 if(reaction?state.noReactions:state.noActions)throw Error('A condição atual impede executar este poder.');
 if(plan.requiresFreeMovement&&state.immobile)throw Error('Kaiten exige movimentos livres.');
 if(plan.action==='movement'&&state.noMovementAction)throw Error('A condição atual impede usar ação de movimento.');
 if(plan.seals&&state.keys.includes('amputado')&&!(aptitudeOwned(itemsOf(actor),'mestre-dos-selos')&&Number(actor.system.skills?.prestidigitacao?.value??0)>=14))throw Error('Selos de mão exigem as duas mãos, salvo a exceção de Mestre dos Selos e Prestidigitação 14.');
 const concentration=getState(actor).active.some(a=>a.duration==='concentration'&&a.active!==false)||
  clanCapabilities(actor,context(actor)).kagura?.concentrating;if(concentration&&!plan.maintenance)throw Error('Encerre a concentração atual antes de executar outro poder.');
}
// Livro Básico 4.1.b, pp. 201–202. A dose is captured at declaration and spent once.
function configureDokujutsu(actor,plan,options,inventory,poison){
 const energize=plan.effect==='energizar';
 if(energize){
  const weapon=findItem(actor,options.weaponId);
  if(weapon?.type!=='equipment'||weapon.system.destroyed||!WEAPONS.some(w=>w.key===weapon.system.catalogKey&&
     w.book===weapon.system.catalogBook&&!['unarmed','ammo'].includes(w.category)))throw Error('Energizar Venenoso exige uma arma da ficha.');
  if(!poison)throw Error('Escolha uma dose para Energizar Venenoso.');
 }
 if(!poison)return;
 if(inventory.type!=='equipment'||inventory.system.inventoryData?.kind==='antidote'||
    !profile().books.includes(poison.book))throw Error('Escolha uma dose de veneno disponível nos livros habilitados.');
 const route=options.poisonRoute||(plan.effect==='nuvem'?'inhalation':'blood');
 if(!['blood','touch','inhalation','ingestion'].includes(route)||energize&&!['blood','touch'].includes(route))
  throw Error('Escolha uma via de exposição compatível com a técnica.');
 const veneficio=poisonTraining(actor.system,itemsOf(actor),houseRules()).veneficio;
 const data={kind:'poison',key:poison.key,book:poison.book,route,veneficio,dokujutsu:true,dc:8+veneficio};
 plan.consume={id:inventory.id,quantity:1};
 if(energize)plan.active.poisonCoating={...data,powerBound:true};
 else plan.poisonSnapshot={type:'equipment',name:inventory.name,system:{
  catalogKey:poison.key,catalogBook:poison.book,inventoryData:data
 }};
}

async function applyDokujutsuPoison(target,plan,{sourceId,attackerUuid,damage,degree}){
 const snapshot=plan.poisonSnapshot;
 if(!snapshot)return;
 const route=snapshot.system.inventoryData.route;
 if(damage<=0&&!['inhalation','ingestion'].includes(route))return;
 return exposePoisonFromPower(target,snapshot,{sourceId,attackerUuid,route,damage,damageGrade:degree,
  hit:true,usingPower:true,guaranteedInjection:true});
}

function executionPlan(actor,item,options,root){
 const inventory=options.poisonId?findItem(actor,options.poisonId):null,poison=inventory?POISONS.find(p=>p.key===inventory.system.catalogKey&&p.book===inventory.system.catalogBook):null;
 if(options.poisonId){if(!poison)throw Error('Veneno de catálogo não encontrado.');options.poisonLevel=poison.category;}
 if((options.effect==='inflamavel'&&options.mode!=='continuous')||(options.effect==='armazenar'&&options.mode==='jutsu')||options.effect==='wana'){
  const source=findItem(actor,options.storedPowerId);if(!source||!POWER_FAMILIES[powerFamily(source)]?.effects)throw Error('Escolha um poder comum conhecido para selar.');
  const stored=powerPlan(source,actor.system,itemsOf(actor),{effect:options.storedEffect??'canhao',level:Number(options.jutsuLevel??source.system.level),tier:Number(options.storedTier??1)},context(actor));
  options.jutsuCost=stored.cost;options.jutsuReach=stored.stat==='cd'?'ranged':'personal';options.jutsuDuration=stored.duration;options.jutsuAction=stored.action;options.jutsuLevel=stored.level;options.storedFrame=stored;
 }
 if(POWER_FAMILIES[powerFamily(item)]?.manual)throw Error('Este poder possui execução manual; suas técnicas não estão automatizadas.');
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


 if(poison&&plan.effect==='venenoso')plan.poisonSnapshot={name:inventory.name,type:'equipment',system:copy(inventory.system)};
 if(plan.family==='dokujutsu')configureDokujutsu(actor,plan,options,inventory,poison);
 if(plan.effect==='criar-arma'){
  const [weaponBook,weaponKey]=String(options.weaponId??'').split(':');if(weaponKey){options.weaponId=weaponKey;options.weaponBook=weaponBook;}
  const weapon=WEAPONS.find(w=>w.key===options.weaponId&&(options.weaponBook?w.book===options.weaponBook:true));
  if(!weapon||!profile().books.includes(weapon.book)||['fuuma-shadow','fuuma-straight','fan','unarmed'].includes(weapon.key)||!['light','medium','long','throw',...(plan.tier>=6?['heavy']:[])].includes(weapon.category))throw Error('Escolha uma arma permitida por Criar Arma e pela evolução aprendida.');
  plan.createdWeapon={key:weapon.key,book:weapon.book};
 }
 if(plan.feint&&plan.effect==='flechas'){
  if(options.mode==='domain-feint'&&!hasNinpouDomain(itemsOf(actor),plan.family,houseRules()))
   throw Error('Domínio Ninpou exige Flechas de Ninpou ou Hibon Ninpou.');
  plan.action=options.mode==='domain-feint'?'partial':aptitudeOwned(itemsOf(actor),'ponto-cego','',houseRules())?'movement':'standard';
 }
 const keys=Object.entries(read(root,'modifier.')).filter(([,v])=>v).map(([k])=>k),choices=read(root,'choice.');
 if(keys.includes('tecnica-eficiente'))throw Error('Técnica Eficiente é escolhida no cartão de um acerto confirmado.');
 if(keys.includes('tecnica-de-cura-arriscada')){if(plan.effect!=='shousen'||options.mode==='offense')throw Error('Cura Arriscada só modifica o tratamento Shousen.');if(keys.includes('tecnica-acelerada'))throw Error('Cura Arriscada não combina com Técnica Acelerada.');plan.riskyHealing=true;}
 const mods=keys.filter(k=>!['tecnica-de-cura-arriscada','dominio-do-fogo','dominio-do-raio','dominio-da-agua'].includes(k));
 if(plan.family==='katon'&&plan.area&&aptitudeOwned(itemsOf(actor),'dominio-do-fogo','',houseRules()))mods.push('dominio-do-fogo');
 const lightning=plan.family==='raiton'&&aptitudeOwned(itemsOf(actor),'dominio-do-raio','',houseRules());
 if(lightning){
  plan.critical=Math.min(plan.critical??15,14);
  if(plan.active&&plan.effect==='energizar')plan.active.criticalExpansion=1;
  if(plan.active?.touchDamage)plan.active.critical=Math.min(plan.active.critical??15,14);
 }
 if(plan.family==='suiton'&&['cc','cd'].includes(plan.stat)&&
    (plan.area||['spend','natural'].includes(choices.waterMode))&&
    aptitudeOwned(itemsOf(actor),'dominio-da-agua','',houseRules()))mods.push('dominio-da-agua');
 if(mods.length){
  if(mods.some(key=>key!=='dominio-do-fogo')&&(plan.noOtherBenefits||plan.noOtherDamageBonuses))throw Error('Este modo não recebe benefícios de aptidões.');
  if(plan.noPotentialize&&mods.includes('potencializar'))throw Error('Onda Explosiva não permite Potencializar.');
  choices.waterPoints=actor.getFlag(ID,'aptitudes')?.water?.stamp===periodKey(actor,'scene')?number(actor.getFlag(ID,'aptitudes').water.value):0;choices.waterBoost=['spend','natural'].includes(choices.waterMode);choices.naturalWater=choices.waterMode==='natural';
  const frame={...plan,id:item.id,powerId:item.id,power:plan.family,effect:plan.effect,ranged:plan.stat==='cd',touchAttack:plan.stat==='cc',noMeta:!plan.metaAllowed,barrier:plan.effect==='barreira',freeCreation:plan.effect==='criacao-livre',commonDifficulty:plan.common?.difficulty??plan.difficulty,resistKind:plan.resistances.some(r=>(Array.isArray(r.stat)?r.stat:[r.stat]).some(s=>Object.hasOwn(SKILLS,s)))?'skill':'attribute',width:plan.area?plan.size:null,length:plan.area?plan.size:null,common:plan.common?{...plan.common,width:plan.common.size,length:plan.common.size}:null};
  const modified=modifyTechnique(frame,mods,actor.system,itemsOf(actor),choices,houseRules());
  plan.usedMetaAptitudes=mods.some(key=>META_APTITUDES.includes(key));
  for(const key of ['damage','hardness','cost','range','action','degreeBonus','precisionBonus','critical','waterCreated','waterSpent','extraMovement','impactDifficulty','fireDifficulty'])if(modified[key]!=null)plan[key]=modified[key];
  if(modified.width>0)plan.size=modified.width;plan.notes.push(...modified.notes);
  if(modified.partialAction){
   assertAction(actor,{action:'partial',seals:false});
   plan.windSustained=true;
  }
  if(mods.includes('tecnica-elevada'))plan.skillResistanceBonus=2;
  const diffChange=number(modified.difficulty)-number(frame.difficulty)-number(plan.skillResistanceBonus);
  if(diffChange){
   plan.difficulty=number(frame.difficulty)+diffChange;
   plan.resistances=plan.resistances.map(r=>({...r,difficulty:r.difficulty+diffChange,
    ...(r.alternateDifficulty!=null?{alternateDifficulty:r.alternateDifficulty+diffChange}:{})}));
  }
  if(plan.active){if(plan.active.bodyHardness!=null&&plan.effect!=='pele-pedra')plan.active.bodyHardness=plan.hardness;else if(plan.hardness!=null)plan.active.hardness=plan.hardness;}
 }
 if(plan.impactDifficulty!=null)plan.resistances.push({stat:'vig',difficulty:plan.impactDifficulty,onFail:['caido'],requiresHit:true});

 const bonus=runtimeBonuses(actor);if(plan.damage!=null&&!plan.noOtherDamageBonuses&&!plan.noOtherBenefits)plan.damage+=bonus.damage;
 if(bonus.difficulty&&!plan.noOtherBenefits){
  if(Number.isFinite(plan.difficulty))plan.difficulty+=bonus.difficulty;
  plan.resistances=plan.resistances.map(resistance=>{
   const adjusted={...resistance};
   for(const key of ['difficulty','alternateDifficulty'])if(Number.isFinite(adjusted[key]))adjusted[key]+=bonus.difficulty;
   return adjusted;
  });
 }
 return plan;
}
export async function powerAction(app,op,data,root,{actor,show}){
 const controlled=mindBinding(actor);
 if(controlled&&controlled.root.mentalControl.mode!=='disorder'&&['power-maintain','power-end'].includes(op)&&!app._mindCoordinated){
  const {requestControlledEffect}=await import('./yamanaka-actions.mjs');return requestControlledEffect(actor,app,op,data,root);
 }
 if(controlled&&controlled.root.mentalControl.mode!=='disorder'&&op==='power-execute'&&!app._mindCoordinated){
  const {requestControlledAbility}=await import('./yamanaka-actions.mjs');return requestControlledAbility(actor,app,'power',root);
 }
 if(!['power-resolve','power-confirm-hit','power-prepare-defense'].includes(op)&&!(op==='power-preview-use'&&canDirectMind(actor,game.user)))owner(actor);const all=itemsOf(actor),books=profile().books,rules=houseRules();
 if(op==='power-mind-ability'||op==='power-mind-test'){
  const controls=await import('./yamanaka-actions.mjs');await controls[op==='power-mind-test'?'chooseControlledTest':'chooseControlledAbility'](actor,data.id,data.body);return app.render({force:true});
 }
 if(op==='power-mind-sensor'){
  const {requestAction}=await import('./action-executions.mjs');await requestAction({op:'mind-sensor',actorUuid:actor.uuid,id:data.id,bodyUuid:data.body,operation:data.operation});return app.render({force:true});
 }
 if(op==='power-fusion-resume'){
  const {requestAction}=await import('./action-executions.mjs');
  await requestAction({op:'inuzuka-fusion-resume',actorUuid:actor.uuid,id:data.id});return app.render({force:true});
 }
 if(op==='power-mind-move'||op==='power-mind-ready'){
  const controls=await import('./yamanaka-control.mjs');
  await controls[op==='power-mind-move'?'chooseControlledMovement':'chooseControlledEquipment'](actor,data.id,data.body);return app.render({force:true});
 }
 if(op==='power-mind-attack'){
  const {chooseControlledWeapon}=await import('./yamanaka-control.mjs');
  await chooseControlledWeapon(actor,data.id,data.body);return app.render({force:true});
 }
 if(op==='power-shadow-pull'){

  const {shadowPullTargets}=await import('./nara-movement.mjs');
  const victim=globalThis.canvas?.scene?.tokens?.find(t=>t.uuid===data.token);
  if(!victim||!shadowPullTargets(actor,data.id).some(t=>t.tokenUuid===victim.uuid))throw Error('Captura não encontrada nesta cena.');
  const start={x:victim.x,y:victim.y,elevation:victim.elevation};
  const {selectMapPoint}=await import('./core/map-point.mjs');
  const point=await selectMapPoint('Escolha o destino de '+victim.name+' no mapa. Esc cancela.');
  if(!point)return;
  const size=victim.getSize(),destination=victim.getSnappedPosition({x:point.x-size.width/2,y:point.y-size.height/2,elevation:victim.elevation});
  const {requestAction}=await import('./action-executions.mjs');
  await requestAction({op:'nara-pull',actorUuid:actor.uuid,id:data.id,tokenUuid:victim.uuid,sceneId:canvas.scene.id,
   start,destination:{x:destination.x,y:destination.y,elevation:destination.elevation??victim.elevation}});
  return app.render({force:true});
 }
 if(op==='power-shadow-prepare'){

  await prepareShadowReuse(actor,data.id);return app.render({force:true});
 }
 if(op==='power-collateral'){const m=game.messages.get(data.message),c=m?.getFlag(ID,'powerCollateral');if(!c||c.actorUuid!==actor.uuid)throw Error('Dano colateral não encontrado.');await applyPhysicalDamage(actor,{base:c.damage,degree:1,sourceId:c.receiptId,reason:'Rasengan Elemental: dano colateral',camouflageContext:{located:true},critical:true});return app.render({force:true});}
 if(op==='power-continue'){const m=game.messages.get(data.message),a=m?.getFlag(ID,'powerContinuation');if(!a||a.actorUuid!==actor.uuid)throw Error('Continuação não encontrada.');const id='continue:'+m.id;if(readKeyedRecord(getState(actor).receipts,id))throw Error('Esta continuação já foi rolada.');const plan=copy(a.plan);if(plan.damagePerPreviousHit)plan.damage+=a.sequenceIndex<=plan.damagePerPreviousHit.max?plan.damagePerPreviousHit.step:0;await postPowerRoll(actor,findItem(actor,a.itemId),{...plan,cost:0},{executionId:a.executionId,sequenceIndex:a.sequenceIndex,previousTargets:a.previousTargets});await updatePower(actor,s=>{s.receipts[recordKey(id)]={complete:true};});return app.close();}
 if(op==='power-catalog')return show('power-catalog',{actor});
 if(op==='power-new'){if(!POWER_FAMILIES[data.family])throw Error('Poder desconhecido.');return show('power-editor',{actor,family:data.family});}
 if(op==='power-edit'){const item=findItem(actor,data.id);if(!item||!powerFamily(item))throw Error('Poder de catálogo não encontrado.');return show('power-editor',{actor,itemId:item.id,family:powerFamily(item)});}
 if(op==='power-use'){const item=powerUseItem(findItem(actor,data.id));if(!item||!powerFamily(item))throw Error('Poder comum não encontrado.');const values=data.effect?{'power.effect':data.effect,...(data.tier?{'power.tier':Number(data.tier)}:{})}:{};
  if(data.mode)values['power.mode']=data.mode;
  if(data.level)values['power.level']=Number(data.level);
  if(data.mode==='prepared')Object.assign(values,{'power.mode':'prepared','power.shadowPreparedId':data.prepared,'power.level':Number(data.level)});
  if(data.mode==='guided')Object.assign(values,{'power.mode':'guided','power.shadowGuidedId':data.guided,'power.level':Number(data.level)});
  if(data.mode==='projectile')Object.assign(values,{'power.mode':'projectile','power.shadowPreparedId':data.prepared,'power.level':Number(data.level)});
  if(data.mode==='projectile-mane')Object.assign(values,{'power.mode':'projectile-mane','power.shadowPreparedId':data.prepared,'power.level':Number(data.level)});
  return show('power-use',{actor,itemId:item.id,targets:targets(),openedEffect:data.effect,values});}
 if(op==='power-preview-use'||op==='power-preview-editor'){Object.assign(app.values,readFields(root));return app.render({force:true});}
 if(op==='power-affinity'){
  if(!game.user.isGM)throw Error('Somente o mestre registra exceções de afinidade.');const v=read(root,'affinity.'),reason=String(v.reason??'').trim(),excluded=ELEMENTS.filter(k=>v['excluded.'+k]),blocked=ELEMENTS.filter(k=>v['blocked.'+k]),limit=v.limit==null?null:Number(v.limit);
  if(!reason)throw Error('Informe a fonte da exceção.');if([...excluded,...blocked].some(k=>!ELEMENTS.includes(k)))throw Error('Elemento inválido.');if(limit!=null&&(!Number.isInteger(limit)||limit<1||limit>5))throw Error('Limite de afinidade inválido.');
  await actor.update({'system.powerState.affinity':{approved:true,reason,excluded,blocked,limit}});return app.render({force:true});
 }
 if(op==='power-save'){
  const v=read(root,'power.'),previous=v.id?findItem(actor,v.id):null,family=v.family??previous?.system.powerData?.family,entry=POWER_FAMILIES[family];if(!entry)throw Error('Poder inválido.');
  const level=Number(v.level),track=previous?.system.powerData?.track??1+Math.max(0,...all.filter(i=>i.type==='power'&&powerFamily(i)===family).map(i=>number(i.system.powerData?.track??1))),choices=entry.effects?Array.from({length:level},(_,i)=>{const [effect,tier]=String(v['choice.'+i]??'').split(':');return {effect,tier:Number(tier)};}):[];
  const item={_id:previous?.id,id:previous?.id,name:String(v.name??entry.name).trim()||entry.name,type:'power',img:ICONS.power,system:{...(previous?.system??{}),level,usedLevel:level,catalogKey:family,catalogBook:entry.book??'basico',source:{book:entry.book??'basico',page:String(entry.page)},powerData:{family,track,choices,solid:v.solid==='yes',
   ...(family==='hibon-ninpou'?{hibonStyle:{element:v.hibonElement,bonuses:[v.hibonFirst,v.hibonSecond],
    manifestation:String(v.hibonManifestation??'').trim()}}:{})}}};
  const errors=validatePowerPurchase(actor,item,{previous:previous?.toObject?.()??previous,rules,books,isGM:game.user.isGM}),next=all.filter(i=>i.id!==previous?.id).concat(item),budget=pointBudgets(actor.system,next,rules);if(budget.powers.remaining<0)errors.push(`Faltam ${-budget.powers.remaining} pontos de poder.`);if(errors.length)throw Error(errors.join(' '));
  if(previous)await previous.update({name:item.name,'system.level':level,'system.usedLevel':level,'system.powerData':item.system.powerData});else{delete item.id;delete item._id;await actor.createEmbeddedDocuments('Item',[item]);}
  return app.close();
 }
 if(op==='power-area'){const active=getState(actor).active.find(a=>a.id===data.id);if(!active)throw Error('Efeito não encontrado.');return show('power-use',{actor,areaPower:active,targets:active.effect==='dominio-do-vento'?attackTargets():targets()});}
 if(op==='power-area-add'||op==='power-area-remove'){const active=getState(actor).active.find(a=>a.id===(data.id??app.panelConfig.areaPower?.id)),v=read(root,'area.'),target=await fromUuid(v.targetUuid);owner(target);if(!active)throw Error('Efeito não encontrado.');const id=`area:${active.id}:${target.id}`;if(op==='power-area-remove'){await endPower(target,id);return app.render({force:true});}await updatePower(target,state=>{if(!state.active.some(a=>a.id===id))state.active.push({...copy(active),id,linkedTo:active.id,sourceUuid:actor.uuid,areaMembership:true,...(active.effect==='dominio-do-vento'?{movementMultiplier:.5}:{}),targetUuid:target.uuid,stored:null,sameSignature:v.sameSignature==='yes',protectAlly:v.protectAlly==='yes',createdTurn:periodKey(target,'turn')});});return app.render({force:true});}
 if(op==='power-escape'){await escapePower(actor,data.id,{...read(root,`escape.${data.id}.`),...(data.stat?{stat:data.stat}:{})});return app.render({force:true});}
 if(op==='power-end'){const active=getState(actor).active.find(a=>a.id===data.id);if(active?.linkedTo&&active.sourceUuid!==actor.uuid&&!game.user.isGM)throw Error('Use a tentativa de saída da técnica; somente o conjurador ou o mestre pode encerrá-la livremente.');if(!game.user.isGM){const {requestAction}=await import('./action-executions.mjs');await requestAction({op:'end-power',actorUuid:actor.uuid,id:data.id});return app.render({force:true});}if(active?.blackFlames&&!game.user.isGM)throw Error('O mestre confirma o selamento ou o fim das chamas negras.');if(active?.effect==='desastre'&&!active.lingering){await updatePower(actor,s=>{const a=s.active.find(a=>a.id===data.id);a.lingering=true;a.duration='continuous';a.remaining=2;});for(const target of game.actors.filter(a=>a.isOwner))await updatePower(target,s=>{for(const a of s.active.filter(a=>a.linkedTo===data.id)){a.lingering=true;a.protectAlly=false;}});return app.render({force:true});}await endPower(actor,data.id);return app.render({force:true});}
 if(activeAptitudes(actor)['estilo-zui-quan']&&
    (['power-execute','power-touch-attack','power-release-seal'].includes(op)||
     op==='power-maintain'&&getState(actor).active.find(a=>a.id===data.id)?.effect!=='energizar'))
  throw Error('Zui Quan impede usar técnicas. Só Energizar pode ser sustentado.');
 if(op==='power-maintain'){await maintainPower(actor,data.id,Number(read(root,`payment.${data.id}.`).convertedChakra??0));return app.render({force:true});}
 if(op==='power-release-seal'){await releaseStoredSeal(actor,data.id,Number(read(root,`payment.${data.id}.`).convertedChakra??0));return app.render({force:true});}
 if(op==='power-touch-attack'){await touchPowerAttack(actor,data.id);return app.render({force:true});}
 if(op==='power-resolve'){const message=game.messages.get(data.message);const attack=message?.getFlag(ID,'powerAttack');if(!attack||attack.coordinated)throw Error('Use o cartão de execução para resolver este ataque.');return show('power-use',{actor,resolveMessage:message.id,powerAttack:message.getFlag(ID,'powerAttack'),targets:targets()});}
 if(op==='power-counter-technique'){
  const v=read(root,'resolve.'),message=game.messages.get(v.message??app.panelConfig?.resolveMessage),target=await fromUuid(v.targetUuid);
  owner(target);
  const {chooseAssistedTechniqueCounter}=await import('./action-executions.mjs');
  await chooseAssistedTechniqueCounter(message,target);
  return;
 }
 if(op==='power-prepare-defense'){const v=read(root,'resolve.'),message=game.messages.get(v.message??app.panelConfig?.resolveMessage);await preparePowerDefense(message,v.targetUuid,v);Object.assign(app.values,readFields(root));return app.render({force:true});}
 if(op==='power-confirm-hit'){const v=read(root,'resolve.'),message=game.messages.get(v.message??app.panelConfig?.resolveMessage);if(!message)throw Error('Mensagem de ataque não encontrada.');const attack=message.getFlag(ID,'powerAttack'),source=attack?.actorUuid?await fromUuid(attack.actorUuid):null;
  if(attack?.coordinated)throw Error('Use o cartão de execução para resolver este ataque.');
  const measured=source?tokenDistance(source,v.targetUuid):null;
  const distance=measured??(attack?.targetUuid===v.targetUuid?attack.distance:null)??v.distance;
  await resolvePowerAttack(message,v.targetUuid,{...v,distance,rangeConfirmed:distance==null,hit:(data.hit??v.hit)==='yes'});return app.close();}
 if(op!=='power-execute')throw Error('Ação de poder desconhecida.');
 if(mindBinding(actor)?.root.mentalControl.mode==='disorder')throw Error('Desordem Mental permite somente ataques comuns e reações básicas pelo controlador.');
 Object.assign(app.values,readFields(root));const options=read(root,'power.'),item=powerUseItem(findItem(actor,options.id));if(!item||!powerFamily(item))throw Error('Poder não encontrado.');
 const priorExecution=app._powerExecutionId?getState(actor).executions[app._powerExecutionId]:null;
 if(priorExecution?.posted){await app.close();return;}
 if(priorExecution)Object.assign(options,copy(priorExecution.options));
 const marked=app._mindTargets??[...(game.user.targets??[])].filter(token=>token.actor);
 if(powerFamily(item)==='shindenshin'&&['desordem-mental','troca-mente','multipla-troca'].includes(options.effect)){
  if(!marked.length)throw Error('Marque as vítimas do controle mental no mapa.');
  const {requestAction}=await import('./action-executions.mjs');
  const origins=(globalThis.canvas?.tokens?.placeables??[]).filter(t=>t.actor?.uuid===actor.uuid),controlled=origins.filter(t=>t.controlled);
  const origin=controlled.length===1?controlled[0]:origins.length===1?origins[0]:null;
  await requestAction({op:'mental-control',actorUuid:actor.uuid,itemId:item.id,sceneId:globalThis.canvas?.scene?.id,sourceTokenId:origin?.document.id,
   targets:marked.map(t=>({tokenId:t.document.id,capanga:options['capanga.'+t.actor.uuid]===true,
    animal:options['animal.'+t.actor.uuid]===true,irrational:options['irrational.'+t.actor.uuid]===true,
    bodyKind:options['bodyKind.'+t.actor.uuid],surpriseAttack:options['surprise.'+t.actor.uuid]===true,
    halfDamage:options['halfDamage.'+t.actor.uuid]===true})),options,executionId:app._powerExecutionId??=uuid()});return app.close();
 }
 if(powerFamily(item)==='shindenshin'&&options.effect==='transmissao-mental'){

  if(!marked.length)throw Error('Marque os participantes da comunicação mental.');
  const {requestAction}=await import('./action-executions.mjs');
  const origins=(globalThis.canvas?.tokens?.placeables??[]).filter(t=>t.actor?.uuid===actor.uuid),controlled=origins.filter(t=>t.controlled);
  const origin=controlled.length===1?controlled[0]:origins.length===1?origins[0]:null;
  await requestAction({op:'mental-network',actorUuid:actor.uuid,itemId:item.id,sceneId:globalThis.canvas?.scene?.id,
   sourceTokenId:origin?.document.id,targets:marked.map(t=>({tokenId:t.document.id,
    voluntary:options['voluntary.'+t.actor.uuid]===true,capanga:options['capanga.'+t.actor.uuid]===true})),
   options,executionId:app._powerExecutionId??=uuid()});return app.close();
 }
 if(powerFamily(item)==='hachimon'){
  const {requestAction}=await import('./action-executions.mjs');
  await requestAction({op:'hachimon-open',actorUuid:actor.uuid,itemId:item.id,level:Number(options.level??item.system.level),
   executionId:app._powerExecutionId??=uuid()});return app.close();
 }
 if(!priorExecution&&powerFamily(item)==='kagejutsu'&&!(options.effect==='kage-shuriken'&&options.mode!=='projectile')&&!(options.effect==='kageyose'&&options.mode!=='bind')){
  if(!marked.length)throw Error('Marque as criaturas vivas que serão alvos das sombras.');
  options.targets=marked.length;
 }
 if(options.effect==='kage-kubishibari'){
  const {requestAction}=await import('./action-executions.mjs');
  await requestAction({op:'nara-strangle',actorUuid:actor.uuid,itemId:item.id,
   targets:marked.map(t=>t.actor.uuid),level:Number(options.level??item.system.level),convertedChakra:Number(options.convertedChakra??0),
   executionId:app._powerExecutionId??=uuid()});
  return app.close();
 }
 if(options.effect==='kage-guided'){
  if(marked.length!==1)throw Error('Marque um aliado para conduzir a sombra.');
  const {requestAction}=await import('./action-executions.mjs');
  const origins=(globalThis.canvas?.tokens?.controlled??[]).filter(t=>t.actor?.uuid===actor.uuid);
  await requestAction({op:'nara-guide',actorUuid:actor.uuid,itemId:item.id,sceneId:globalThis.canvas?.scene?.id,
   sourceTokenId:origins.length===1?origins[0].document.id:null,targetTokenId:marked[0].document.id,options,
   executionId:app._powerExecutionId??=uuid()});
  return app.close();
 }
 if(['sotorou','santorou'].includes(options.effect)){
  const {requestAction}=await import('./action-executions.mjs');
  const sourceTokens=(globalThis.canvas?.tokens?.controlled??[]).filter(t=>t.actor?.uuid===actor.uuid);
  await requestAction({op:'inuzuka-fusion',actorUuid:actor.uuid,itemId:item.id,sceneId:globalThis.canvas?.scene?.id,
   sourceTokenId:sourceTokens.length===1?sourceTokens[0].document.id:null,
   participants:marked.map(t=>t.actor.uuid),options:{effect:options.effect,level:Number(options.level??item.system.level),convertedChakra:Number(options.convertedChakra??0)}});
  return app.close();
 }
 if(!priorExecution&&['nikudan','choudan','tsuuga','gatsuga','garouga','juujin'].includes(options.effect)){
  if(marked.length!==1)throw Error('Marque um único alvo para esta técnica.');
  options.targetUuid=marked[0].actor.uuid;
 }
 const grouping=groupedPowerEffects.has(options.effect)&&powerFamily(item)!=='kikai-ninpou'&&
  !['feint','domain-feint'].includes(options.mode)&&marked.length>0&&globalThis.canvas?.ready;
 if(grouping){
  options.targetUuid=marked.length===1?marked[0].actor.uuid:'';
  if(options.effect==='lanca')options.targets=marked.length;
 }
 if(!grouping&&app.panelConfig?.hudInline&&root.querySelector('input[type="hidden"][name="power.targetUuid"]')){
  const {selectedTargets}=await import('./saved-actions.mjs');
  const marked=selectedTargets();
  if(marked.length>1)throw Error('Marque um único alvo para este uso ou confirme o alvo no HUD.');
  options.targetUuid=marked[0]??'';
 }
 if(options.targetUuid){
  const selected=await fromUuid(options.targetUuid);if(selected)options.targetUuid=bodySource(selected).uuid;
  const measured=tokenDistance(actor,options.targetUuid);
  if(measured!=null)options.distance=measured;
 }
 if(data.visibleTarget==='true')options.visibleTarget=true;
 let plan=priorExecution?copy(priorExecution.plan):executionPlan(actor,item,options,root);if(!priorExecution)assertAction(actor,plan);
 if(!priorExecution&&(plan.damage>0||plan.fixedDamage>0))plan.partnerDivisor=mindBinding(actor)?mindDamageDivisor(actor):partnerDamageDivisor(actor);
 if(plan.charge&&!priorExecution){
  const check=statPrecision(actor,'atletismo',{kind:'skill',manualContext:true,run:true});
  if(!check.allowed)throw Error(check.reasons.join(' '));
  if(plan.chargeLine){
   if(options.lineAdjudicated!==true&&options.lineAdjudicated!=='on')throw Error('Confira com a mesa a trajetória, os alvos a pelo menos 3 m e as interrupções da Investida.');
   prepareLineCharge(actor,read(root,'area.').previewRegion,{maximum:Number.MAX_SAFE_INTEGER});
  }
  else if(globalThis.canvas?.ready)await moveCharge(actor,options.targetUuid,{reach:plan.range,maximum:Number.MAX_SAFE_INTEGER,preview:true});
  else if(options.distance!=null&&options.distance-plan.range<3)throw Error('Investida exige pelo menos 3 m de avanço em linha reta.');
  if(!app._nikudanRun){
   const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate();
   app._nikudanRun=Math.max(0,roll.total);
   await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:plan.name+' · corrida da Investida.'});
  }
  plan.chargeReach=plan.range;plan.chargeMaximum=derivedSummary(actor).movement+app._nikudanRun;
  plan.range=plan.chargeMaximum+plan.chargeReach;
  if(plan.chargeLine)plan.chargeLinePath=prepareLineCharge(actor,read(root,'area.').previewRegion,{maximum:plan.chargeMaximum});
  else if(globalThis.canvas?.ready)plan.chargePath=await moveCharge(actor,options.targetUuid,{reach:plan.chargeReach,maximum:plan.chargeMaximum,preview:true});
 }
 if(plan.feint&&plan.effect==='flechas'){
  if(!options.targetUuid)throw Error('Marque um alvo para a Finta de Flechas.');
  const {requestAction}=await import('./action-executions.mjs');
  await requestAction({op:'flechas-feint',actorUuid:actor.uuid,itemId:item.id,targetUuid:options.targetUuid,
   level:plan.level,tier:plan.tier,distance:options.distance??null,domain:options.mode==='domain-feint',convertedChakra:Number(options.convertedChakra??0)});
  return app.close();
 }
 if(plan.stat){const check=statPrecision(actor,plan.stat,{kind:plan.defensive?'defense':plan.stat in COMBAT?'attack':plan.stat in SKILLS?'skill':'attribute',reaction:!!plan.defensive,manualContext:true,requiresSeals:plan.seals,powerExecutionId:plan.shadow?.guidedFrom??plan.shadow?.projectileConversionFrom});if(!check.allowed)throw Error(check.reasons.join(' '));}
 if(plan.effect==='bakudan'&&options.mode!=='craft'){
  const prepared=getState(actor).active.find(a=>a.itemId===item.id&&a.stored?.kind==='advanced'&&a.stored.plan.effect==='bakudan');if(!prepared)throw Error('Prepare uma tarja Bakudan antes de ativar.');await releaseStoredSeal(actor,prepared.id);return app.close();
 }
 if(plan.advancedSeal&&(plan.effect!=='bakudan'||options.mode==='craft')){
  plan.consume={key:'special-tag',quantity:1};
  const activation=plan.effect==='wana'?{...copy(plan.trapFrame),trap:true,trapDefensePenalty:-1,name:plan.name+' · '+plan.trapFrame.name,area:plan.trapFrame.area?'cone':null}:copy(plan);activation.cost=plan.effect==='bakudan'?Math.ceil(plan.level/2):0;activation.action=plan.effect==='souin'||plan.effect==='kekkai'?'full':'standard';delete activation.consume;delete activation.stored;
  plan.stored={kind:'advanced',cost:activation.cost,action:activation.action,plan:activation};plan.stat=null;plan.active=null;plan.action='full';plan.duration='permanent';
 }
 if(['kaiten-offense','ichigekishin'].includes(plan.effect))delete options.targetUuid;
 const target=options.targetUuid?await fromUuid(options.targetUuid):null;
 if(plan.effect==='flechas'&&target&&Number(options.targets??1)===1&&!plan.rerollAfterDefense)plan.targets=1;
 const areaRegion=read(root,'area.').previewRegion;
 const mapScene=globalThis.canvas?.scene;
 if(canCoordinateArea(plan)&&globalThis.canvas?.ready&&globalThis.canvas.grid?.isSquare&&!areaRegion)
  throw Error('Selecione a região do ataque no mapa antes de executar.');
 if(canCoordinateArea(plan)&&areaRegion){
  const snapshot=previewSceneArea(areaRegion);
  if(!snapshot)throw Error('A região do ataque não está disponível.');
  options.areaRegion=areaRegion;options.areaScene=mapScene.id;
 }
 const area=canCoordinateArea(plan)&&!!options.areaRegion;
 if(grouping&&canGroupPower(plan)){
  const tokens=(globalThis.canvas.tokens?.placeables??[]).filter(t=>t.actor?.uuid===actor.uuid);
  const controlled=tokens.filter(t=>t.controlled);
  const origin=controlled.length===1?controlled[0]:tokens.length===1?tokens[0]:null;
  let entries=marked.map(t=>({tokenId:t.document.id,...(plan.shadow?{capanga:options['capanga.'+t.actor.uuid]===true}:{} )}));
  if(plan.effect==='ricochete'&&entries.length>1){
   if(entries.length>plan.targets)throw Error('O nível usado não permite tantos alvos de Ricochete.');
   const order=await foundry.applications.api.DialogV2.prompt({
    window:{title:'Ordem do Ricochete'},
    content:`<p>O primeiro alvo deve estar ao alcance. Os demais devem ficar a até 10 m dele.</p>
     ${marked.map((_,index)=>`<label>${index+1}º alvo <select name="target${index}">
      ${marked.map((token,i)=>`<option value="${esc(token.document.id)}"${i===index?' selected':''}>${esc(token.name??token.actor.name)}</option>`).join('')}
     </select></label>`).join('')}`,
    ok:{label:'Declarar Ricochete',callback:(_event,button)=>entries.map((_,i)=>button.form.elements['target'+i].value)}
   });
   if(!order)return;
   entries=order.map(tokenId=>({tokenId}));
  }
  if(plan.effect==='flechas'||plan.nui){
   if(entries.length>plan.projectiles)throw Error('Há mais alvos marcados do que projéteis disponíveis.');
   if(entries.length===1)entries[0].projectiles=plan.projectiles;
   else{
    const distribution=await foundry.applications.api.DialogV2.prompt({
     window:{title:plan.nui?'Distribuir agulhas de sombra':'Distribuir Flechas'},
     content:`<p>${plan.projectiles} ${plan.nui?'agulhas':'projéteis'} disponíveis.</p>${marked.map((token,i)=>
      `<label>${esc(token.name??token.actor.name)} <input type="number" name="projectiles${i}" min="${plan.nui?.stitch?2:1}" max="${plan.projectiles}" step="1" required value="${Math.floor(plan.projectiles/entries.length)+(i<plan.projectiles%entries.length?1:0)}"></label>`).join('')}`,
     ok:{label:'Declarar ataque',callback:(_event,button)=>entries.map((_,i)=>button.form.elements['projectiles'+i].valueAsNumber)}
    });
    if(!distribution)return;
    entries.forEach((entry,index)=>{entry.projectiles=distribution[index];});
   }
  }
  const validatedGroup=validatePowerGroup(mapScene,actor,plan,entries,origin?.document.id);
  if(plan.shadow?.projectileConversionFrom&&marked.some(t=>!getState(t.actor).active.some(a=>a.shadowBinding&&a.sourceUuid===actor.uuid&&a.linkedTo===plan.shadow.projectileConversionFrom)))
   throw Error('Mane livre exige a própria vítima ainda paralisada pela Shuriken das Sombras.');
  if(plan.shadow?.guidedFrom){
   const ally=mapScene.tokens.find(t=>t.uuid===plan.shadow.allyTokenUuid&&t.actor?.uuid===plan.shadow.allyUuid);
   if(!ally||marked.some(t=>t.actor.uuid===ally.actor.uuid||!Number.isFinite(measureTokenDistance(ally,t.document,mapScene.grid))||measureTokenDistance(ally,t.document,mapScene.grid)>1))
    throw Error('Os inimigos marcados precisam estar a até 1 m do aliado que conduz a sombra.');
  }
  if(plan.shadow?.preparedFrom){
   plan.shadow.closeTargets=validatedGroup.filter(s=>s.distance<=1).map(s=>s.targetUuid);
   if(plan.shadow.closeTargets.length===validatedGroup.length){plan.shadow.silent=true;plan.precisionBonus=0;plan.notes[0]='Sombra preparada a 1 m: somente Esquiva, com −3 na defesa.';}
   else plan.notes.push('Reutilização da sombra preparada: a até 1 m, somente Esquiva com −3 e sem a penalidade de técnica lenta; demais alvos seguem as condições declaradas.');
  }
  if(plan.stat==='cd'&&validatedGroup.some(s=>Number.isFinite(s.distance)&&s.distance<=1)){
   plan.rangedMelee=true;plan.precisionBonus-=3;
   plan.notes.push('Combate próximo: −3 no CD por haver um alvo inimigo a até 1 m (Livro Básico p. 87).');
  }
  if(plan.shadow)plan.shadow.capangaPresent=validatedGroup.some(s=>s.shadowCapanga);
  options.powerGroup=entries;options.groupScene=mapScene.id;options.groupOrigin=origin.document.id;
 }
 const group=canGroupPower(plan)&&!!options.powerGroup;
 if(!group&&!priorExecution&&plan.stat==='cd'&&target&&Number.isFinite(options.distance)&&options.distance<=1){
  plan.rangedMelee=true;plan.precisionBonus-=3;
  plan.notes.push('Combate próximo: −3 no CD por haver um alvo inimigo a até 1 m (Livro Básico p. 87).');
 }
 const coordinated=area||group||canCoordinateSinglePower(plan)&&(!!target||plan.effect==='canhao');
 if(coordinated){
  if(!area&&!group&&(!target||target.uuid===actor.uuid))throw Error('Marque o alvo antes de declarar o ataque.');
  if(!area&&!group&&options.distance!=null&&options.distance>plan.range)throw Error('O alvo está fora do alcance da técnica.');
  const {actionAuthority}=await import('./action-executions.mjs');
  if(!actionAuthority())throw Error('Um mestre precisa estar conectado para coordenar a defesa.');
 }
 if(plan.effect==='amaterasu'&&(!target||target.uuid===actor.uuid||options.visibleTarget!==true))throw Error('Confirme um alvo no campo de visão para Amaterasu.');
 if(plan.family==='kikai-ninpou'&&plan.stat&&plan.targets===1&&!plan.area&&!target)throw Error('Escolha o alvo único de Kikai Ninpou.');
 if(plan.family==='juuken'&&plan.effect==='kuushou'&&!target)throw Error('Escolha o alvo do Hakke Kuushou.');
 if(plan.healing!=null&&!target&&!plan.self)throw Error('Escolha o paciente.');if(plan.self||options.self)options.targetUuid=actor.uuid;if(plan.healing!=null){const patient=plan.self||options.self?actor:target;owner(patient);if(derivedSummary(patient).state.keys.includes('morto'))throw Error('Este tratamento não ressuscita.');}
 if(plan.consume&&!plan.consume.id){const supply=all.find(i=>i.type==='equipment'&&i.system.catalogKey===plan.consume.key&&number(i.system.quantity)>=plan.consume.quantity);if(!supply)throw Error('É necessário '+(plan.consume.key==='jutsu-scroll'?'um pergaminho de jutsus':'o material indicado')+' disponível.');plan.consume.id=supply.id;}
 if(plan.consume&&number(findItem(actor,plan.consume.id)?.system.quantity)<plan.consume.quantity)throw Error('Quantidade insuficiente do consumível.');
 const executionId=app._powerExecutionId??=uuid();let duplicate=false;
 await updatePower(actor,(state,runtime)=>{
  const prior=state.executions[executionId];if(prior){duplicate=true;plan=copy(prior.plan);for(const key of Object.keys(options))delete options[key];Object.assign(options,copy(prior.options));return;}
  if(plan.active?.mindSensor&&state.active.some(a=>a.mindSensor&&a.active!==false))throw Error('Sensor de Mentes já está ativo. Use Manter ou Encerrar.');
  commitShadowUse(actor,plan,runtime);
  if(plan.family==='dokujutsu'&&plan.effect==='energizar'&&state.active.some(a=>a.active!==false&&a.poisonCoating&&a.weaponId===plan.active.weaponId))
   throw Error('Esta arma já está sob Energizar Venenoso. Encerre o efeito antes de aplicar outra dose.');
  if(plan.effect==='twin-lions'&&state.active.some(a=>a.effect==='twin-lions'&&a.active!==false))throw Error('Punho dos Leões Gêmeos já está ativo. Use Manter ou Encerrar.');
  if(plan.insectGroups){
   const colony=clanCapabilities(actor,context(actor)).insects.find(r=>r.key==='res-basico-kikaichuu');
   if(!colony?.available||!colony.bindingValid||!Number.isInteger(colony.value)||colony.value-colony.occupied<plan.insectGroups)throw Error('Kikaichuu disponíveis insuficientes para a técnica.');
   if(plan.active)Object.assign(plan.active,{insectGroups:plan.insectGroups,insectResourceId:colony.resourceId});
  }
  if(plan.limit)claimUsage(runtime,actor,`${item.id}:${plan.effect}`,plan.limit.period,plan.limit.count);
  if(plan.active?.onceScene)claimUsage(runtime,actor,`${item.id}:${plan.effect}`,'scene',1);
  if(plan.waterCreated||plan.waterSpent){const stamp=periodKey(actor,'scene'),current=runtime.water?.stamp===stamp?number(runtime.water.value):0;if(current<number(plan.waterSpent))throw Error('Pontos de água insuficientes.');runtime.water={stamp,value:current+number(plan.waterCreated)-number(plan.waterSpent)};}
  const converted=Number(options.convertedChakra??0);
  if(plan.prepareBunbun)runtime.bunbun={id:executionId,itemId:item.id,scene:periodKey(actor,'scene')};
  if(plan.bunbunId){
   if(runtime.bunbun?.id!==plan.bunbunId)throw Error('A preparação de Bunbun mudou. Prepare novamente.');
   delete runtime.bunbun;
  }
  const payment=corpulenciaPayment(actor,Math.ceil(plan.cost),converted,context(actor));
  if(plan.shadow?.preparedFrom){
   if(!state.active.some(a=>a.id===plan.shadow.preparedFrom&&a.shadowPrepared))throw Error('Esta sombra preparada já foi usada ou encerrada.');
   state.active=state.active.filter(a=>a.id!==plan.shadow.preparedFrom);
  }
  if(plan.shadow?.guidedFrom){
   if(!state.active.some(a=>a.id===plan.shadow.guidedFrom&&a.shadowGuided))throw Error('Esta conexão guiada já foi usada ou encerrada.');
   state.active=state.active.filter(a=>a.id!==plan.shadow.guidedFrom);
  }
  if(plan.shadow?.projectileFrom){
   if(!state.active.some(a=>a.id===plan.shadow.projectileFrom&&a.shadowProjectilePrepared))throw Error('Esta arma preparada já foi arremessada.');
   state.active=state.active.filter(a=>a.id!==plan.shadow.projectileFrom);
  }
  if(plan.chargeDefensePenalty)runtime.active['penalidade-investida']={penalty:plan.chargeDefensePenalty,turn:periodKey(actor,'turn')};
  if(converted)plan.notes.push('Corpulência: '+2*converted+' Vitalidade substituíram '+converted+' chakra do custo.');
  if(plan.visionCost){
   if(!clanCapabilities(actor,context(actor)).mangekyou)throw Error('Mangekyou deixou de estar disponível.');
   spendMangekyouVision(actor,runtime,plan.visionCost);
  }
  if(plan.senjutsuCost){const special=actor.system.special?.find(r=>/senjutsu/i.test(r.name));if(!special||number(special.value)<plan.senjutsuCost)throw Error('Registre e preencha a reserva de Chakra Senjutsu antes de usar Senpou Rasengan.');}
  if(plan.effect==='baika')state.active=state.active.filter(a=>a.effect!=='baika');
  if(plan.active||plan.stored){const active={...copy(plan.active??{}),id:executionId,remaining:plan.effect==='desastre'?plan.periodic.total:plan.active?.remaining,name:plan.name,itemId:item.id,sourceUuid:actor.uuid,targetUuid:options.targetUuid||null,...(plan.shadow?{sourceTokenUuid:mapScene?.tokens.get(options.groupOrigin)?.uuid??null}:{}),createdTurn:periodKey(actor,'turn'),scene:periodKey(actor,'scene'),duration:plan.duration,stored:plan.stored??null,plan:copy(plan),lastProcessed:{}};state.active.push(active);}
  if(plan.windSustained){
   const {area,size,range,source}=plan;
   state.active.push({id:executionId+':vento',itemId:item.id,name:'Domínio do Vento · '+plan.name,
    family:'fuuton',effect:'dominio-do-vento',duration:'sustained',sourceUuid:actor.uuid,
    createdTurn:periodKey(actor,'turn'),scene:periodKey(actor,'scene'),
    plan:{area,size,range,source,duration:'sustained',resistances:[]}});
  }
  state.executions[executionId]={plan:copy(plan),options:copy(options),posted:false,consumed:false,
   ...(app._mindControl?{control:copy(app._mindControl),coordinated}:{} )};
  return {changes:{...payment,...(plan.senjutsuCost?{'system.special':actor.system.special.map(s=>/senjutsu/i.test(s.name)?{...s,value:number(s.value)-plan.senjutsuCost}:s)}:{})}};
 });
 const execution=getState(actor).executions[executionId];if(execution.posted){await app.close();return;}
 if(plan.shadow?.guidedFrom){
  const ally=worldActorDocuments().find(a=>a.uuid===plan.shadow.allyUuid);
  if(ally?.isOwner)await updatePower(ally,state=>{state.active=state.active.filter(a=>a.linkedTo!==plan.shadow.guidedFrom);});
  else{const {requestAction}=await import('./action-executions.mjs');await requestAction({op:'nara-guide-release',actorUuid:actor.uuid,executionId});}
 }
 if(plan.chargePath&&!execution.chargeMoved){
  await moveCharge(actor,options.targetUuid,{reach:plan.chargeReach,maximum:plan.chargeMaximum,snapshot:plan.chargePath});
  options.distance=plan.chargeReach;
  await updatePower(actor,s=>{s.executions[executionId].chargeMoved=true;s.executions[executionId].options.distance=plan.chargeReach;});
 }
 if(plan.consume&&!execution.consumed){const supply=findItem(actor,plan.consume.id),receipt=supply.getFlag?.(ID,'powerConsumption')?.[executionId];if(!receipt){if(number(supply.system.quantity)<plan.consume.quantity)throw Error('O consumo ficou pendente: restaure o material e execute novamente para concluir sem cobrar chakra adicional.');await supply.update({'system.quantity':number(supply.system.quantity)-plan.consume.quantity,[`flags.${ID}.powerConsumption.${executionId}`]:true});}await updatePower(actor,s=>{s.executions[executionId].consumed=true;});}
 if(plan.hardness!=null&&(plan.active?.barrier||plan.active?.imaginaryHardness||plan.active?.freeCreation)){const objects=copy(actor.system.physical?.objects??[]);if(!objects.some(o=>o.powerExecution===executionId)){objects.push({id:uuid(),name:plan.name,kind:plan.active?.imaginaryHardness?'imaginary':'barrier',hardness:plan.hardness,powerExecution:executionId,element:plan.family,mist:!!plan.active?.mist,size:'medium'});await actor.update({'system.physical.objects':objects});}}
 if(plan.effect==='criar-arma'||plan.createdWeapon)await createPowerWeapon(actor,item,plan,options,executionId);
 if(plan.companionTransform){const {applyJuujinTransformation}=await import('./inuzuka.mjs');await applyJuujinTransformation(actor,await fromUuid(options.targetUuid),executionId);}
 if(plan.purifyTarget){const source=await fromUuid(plan.purifyTarget.sourceUuid);let success=plan.level>plan.purifyTarget.level;if(!success){const r=await rollPowerResistance(actor,'esp',plan.purifyTarget.difficulty,plan,executionId+':purify');success=r.success;}if(success)await endPower(source,plan.purifyTarget.id);}
 if(plan.healing!=null&&plan.duration!=='concentration')await healPowerTarget(actor,plan,options.targetUuid??actor.uuid,executionId);
 if(plan.riskyHealing){const roll=await new foundry.dice.Roll('2d8').evaluate();plan.healing=riskyHealing(plan.healing,roll.total);await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Shousen · Cura Arriscada: ${plan.healing<0?'dano':'cura'} ${Math.abs(plan.healing)} por turno.`,flags:{[ID]:{kind:'power-risky-healing',actorUuid:actor.uuid,executionId}}});await updatePower(actor,s=>{const a=s.active.find(a=>a.id===executionId);if(a){a.healing=plan.healing;a.plan.healing=plan.healing;}});}
 if(['energizar','afiar','arma-eletrica'].includes(plan.effect)){const weapon=findItem(actor,options.weaponId);if(weapon?.system.inventoryData?.coating&&!weapon.system.inventoryData.coating.dokujutsu)await weapon.update({'system.inventoryData.coating':null});}
 if(plan.trap&&plan.stored){const active=getState(actor).active.find(a=>a.id===executionId);if(!active.stored.attack){const message=await postPowerRoll(actor,item,{...plan.stored.plan,cost:plan.cost},{executionId,trapCreation:true});await updatePower(actor,s=>{s.active.find(a=>a.id===executionId).stored.attack=message.getFlag(ID,'powerAttack');});}}
 else if(coordinated){
  const {requestAction}=await import('./action-executions.mjs');
  const declaration={op:'declare-power',quickResolution:true,actorUuid:actor.uuid,itemId:item.id,powerExecutionId:executionId};
  if(app._deferDeclaration)await app._deferDeclaration(declaration);else await requestAction(declaration);
 }
 else if(plan.stat)await postPowerRoll(actor,item,plan,{executionId,targetUuid:options.targetUuid,distance:options.distance});else await postPowerCard(actor,plan,{executionId,itemId:item.id});
 await updatePower(actor,s=>{s.executions[executionId].posted=true;});await app.close();
}
export async function postPowerCard(actor,plan,extra={}){return ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:planHtml(plan),flags:{[ID]:{kind:'power-use',actorUuid:actor.uuid,plan,...extra}}});}
export async function activateMentalNetwork(actor,item,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user))throw Error('Você não controla o Yamanaka.');
 if(powerFamily(item)!=='shindenshin')throw Error('Shindenshin não encontrado.');
 const id=command.executionId??requestId,prior=getState(actor).executions[id];
 if(prior&&prior.plan?.effect!=='transmissao-mental')throw Error('Este registro pertence a outra técnica.');
 if(prior?.posted)return;
 if(!prior){
  if(command.options?.knownOrVisible!==true)throw Error('Confirme que os participantes são conhecidos ou estão no campo de visão.');
  const plan=powerPlan(item,actor.system,itemsOf(actor),{...command.options,effect:'transmissao-mental'},context(actor));
  const scene=game.scenes?.get(command.sceneId),origin=scene?.tokens.get(command.sourceTokenId),entries=command.targets;
  if(!scene||!user.isGM&&scene.id!==user.viewedScene||origin?.actor?.uuid!==actor.uuid)
   throw Error('Escolha um único token de origem nesta cena.');
  if(!Array.isArray(entries)||!entries.length||entries.length>plan.targets||new Set(entries.map(e=>e.tokenId)).size!==entries.length)
   throw Error(`Marque de 1 a ${plan.targets} participantes distintos.`);
  const participants=entries.map(entry=>{
   const token=scene.tokens.get(entry.tokenId),target=token?.actor,distance=token&&measureTokenDistance(origin,token,scene.grid);
   if(!target||target.uuid===actor.uuid||!user.isGM&&token.hidden||!Number.isFinite(distance)||distance>plan.range)
    throw Error('Cada participante precisa estar visível para o jogador e dentro do alcance mensurável.');
   return {targetUuid:target.uuid,voluntary:entry.voluntary===true,capanga:entry.capanga===true};
  });
  if(new Set(participants.map(p=>p.targetUuid)).size!==participants.length)throw Error('Marque somente um token por participante.');
  assertAction(actor,plan);
  await updatePower(actor,state=>{
   if(state.executions[id])return;
   const payment=corpulenciaPayment(actor,plan.cost,Number(command.options?.convertedChakra??0),context(actor));
   state.executions[id]={plan:copy(plan),participants,posted:false};
   state.active.push({...copy(plan.active),id,name:plan.name,itemId:item.id,sourceUuid:actor.uuid,sourceTokenUuid:origin.uuid,
    scene:periodKey(actor,'scene'),createdTurn:periodKey(actor,'turn'),duration:plan.duration,plan:copy(plan),lastProcessed:{}});
   return {changes:payment};
  });
 }
 const pending=getState(actor).executions[id],plan=pending.plan;
 const root=getState(actor).active.find(a=>a.id===id&&!a.ending&&a.active!==false);
 if(!root)return;
 for(const entry of pending.participants){
  const target=worldActorDocuments().find(a=>a.uuid===entry.targetUuid);if(!target)continue;
  const receipt=id+':mind:'+target.id;
  const result=entry.voluntary?{success:false,voluntary:true}:entry.capanga?{success:false,automaticFailure:true}:
   await rollPowerResistance(target,'int',plan.difficulty,plan,receipt);
  await updatePower(actor,state=>{state.executions[id].results??={};state.executions[id].results[target.id]=copy(result);});
  if(result.success)continue;
  await updatePower(target,state=>{if(!state.active.some(a=>a.id===receipt))state.active.push({id:receipt,name:plan.name,
   sourceUuid:actor.uuid,linkedTo:id,duration:'linked',mentalNetworkLink:true,plan:{family:'shindenshin',effect:plan.effect}});});
 }
 if(!worldActorDocuments().some(target=>getState(target).active.some(a=>a.linkedTo===id&&a.mentalNetworkLink)))await endPower(actor,id);
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag?.(ID,'executionId')===id&&m.getFlag?.(ID,'kind')==='power-use'))
  await postPowerCard(actor,plan,{executionId:id,itemId:item.id});
 await updatePower(actor,state=>{state.executions[id].posted=true;});
}
export async function activateHachimon(actor,item,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user)||powerFamily(item)!=='hachimon')throw Error('Você não controla o usuário dos portões.');
 const id=command.executionId??requestId,prior=getState(actor).executions[id];if(prior?.posted)return;
 const plan=prior?.plan??powerPlan(item,actor.system,itemsOf(actor),{effect:'hachimon',level:command.level},context(actor));
 if(prior&&prior.plan?.family!=='hachimon')throw Error('O registro pertence a outro poder.');
 if(!prior){
  assertAction(actor,plan);
  if(Number(actor.system.resources.vitality.value)<=0)throw Error('É necessário estar consciente e com Vitalidade positiva para abrir os portões.');
  await updatePower(actor,(state,runtime)=>{
   if(state.executions[id])return;
   const current=state.active.find(a=>a.hachimon&&a.active!==false&&!a.ending),scene=periodKey(actor,'scene'),turn=periodKey(actor,'turn'),now=Number(game.time?.worldTime??0);
   runtime.hachimon??={};const history=runtime.hachimon;
   if(!current&&history.cooldown&&(game.combat?.started?history.cooldown.remaining>0:now<history.cooldown.until))
    throw Error('Espere um turno completo depois de fechar os portões antes de abri-los novamente.');
   if(current&&current.itemId!==item.id)throw Error('Evolua os portões da mesma compra ativa.');
   if(!current){
    history.uses=history.scene===scene?Number(history.uses??0)+1:1;history.scene=scene;
    state.active.push({...copy(plan.active),id,name:plan.name,itemId:item.id,sourceUuid:actor.uuid,scene,
     duration:'continuous',createdTurn:turn,clockAt:now,plan:copy(plan),lastProcessed:{},
     hachimon:{...plan.active.hachimon,damageSuffered:0,reckless:Number(history.exhaustedUntil??0)>now}});
   }
   const active=current??state.active.find(a=>a.id===id),remaining=active.remaining;
   active.hachimon={...active.hachimon,gate:plan.hachimon.gate,known:plan.hachimon.known};
   active.name=plan.name;active.plan=copy(plan);active.remaining=remaining;
   const damage=plan.hachimon.damagePerTurn;active.hachimon.damageSuffered+=damage;
   if(active.hachimon.reckless){history.permanentLoss=Number(history.permanentLoss??0)+damage;history.treatmentLevel=Math.max(Number(history.treatmentLevel??0),plan.hachimon.gate);}
   state.executions[id]={plan:copy(plan),rootId:active.id,posted:false};
   return {changes:{'system.resources.vitality.value':Number(actor.system.resources.vitality.value)-damage}};
  });
 }
 const execution=getState(actor).executions[id],active=getState(actor).active.find(a=>a.id===execution.rootId);
 if(active&&Number(actor.system.resources.vitality.value)<=0)await endPower(actor,active.id);
 else if(active){
  const key=plan.hachimon.acceleration===2?'superacelerado':'acelerado';
  for(const old of conditionRecords(actor).filter(c=>c.powerReceipt===active.id&&c.key!==key))await saveCondition(actor,old,{remove:true});
  await applyPowerCondition(actor,key,plan,active.id,{powerSourceExecution:active.id});
 }
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag?.(ID,'executionId')===id&&m.getFlag?.(ID,'kind')==='power-use'))
  await postPowerCard(actor,plan,{executionId:id,itemId:item.id});
 await updatePower(actor,state=>{state.executions[id].posted=true;});
}
export async function commitHachimonHeavy(actor,plan,executionId){
 const heavy=plan.hachimonHeavy;if(!heavy?.pending)return;
 if(!game.user.isGM||!actor?.isOwner||typeof executionId!=='string'||!executionId)throw Error('O mestre coordenador confirma o Ataque Pesado.');
 await updatePower(actor,(state,runtime)=>{
  runtime.hachimon??={};const history=runtime.hachimon;
  if(history.heavy?.executionId===executionId)return;
  const root=state.active.find(a=>a.id===heavy.rootId&&a.hachimon&&!a.ending&&a.active!==false);
  if(!root||root.hachimon.gate!==heavy.gate||root.hachimon.known!==heavy.known||root.remaining-1!==heavy.minimumDegree||
     periodKey(actor,'turn')!==heavy.turn||periodKey(actor,'scene')!==heavy.scene)
   throw Error('Os Portões ou sua duração mudaram; confira a declaração do Ataque Pesado.');
  root.hachimon.heavy=true;root.hachimon.damageSuffered+=heavy.wear;
  if(root.hachimon.reckless){history.permanentLoss=Number(history.permanentLoss??0)+heavy.wear;history.treatmentLevel=Math.max(Number(history.treatmentLevel??0),heavy.gate);}
  history.heavy={...copy(heavy),pending:false,executionId};
  return {changes:{'system.resources.vitality.value':Number(actor.system.resources.vitality.value)-heavy.wear}};
 });
 await endPower(actor,heavy.rootId);
}
export async function settleHachimonHeavyFall(target,heavy,sourceId){
 if(!heavy)return null;
 const plan={family:'hachimon',effect:'heavy',level:heavy.gate,name:'Ataque Pesado',source:'Livro Básico p. 205',resistances:[]};
 const result=await rollPowerResistance(target,'acrobacia',heavy.difficulty,plan,sourceId+':heavy-fall');
 if(!result.success)await applyPowerCondition(target,'caido',plan,sourceId+':heavy-fall');
 return result;
}
async function closeHachimon(actor,record){
 const result=await updatePower(actor,(state,runtime)=>{
  const root=state.active.find(a=>a.id===record.id);if(!root)return {};
  runtime.hachimon??={};const history=runtime.hachimon;
  if(!root.hachimon.closure){
   const benefits=gateBenefits(root.hachimon.known,root.hachimon.gate),now=Number(root.hachimon.closingAt??game.time?.worldTime??0),
    previous=state.active.filter(a=>a.hachimonRecovery&&!a.hachimonFatal).map(a=>a.id),id=uuid();
   if(Number(history.uses)>=3&&!root.hachimon.reckless)history.exhaustedUntil=now+86400;
   const daily=Number(history.exhaustedUntil??0)>now;
   root.hachimon.closure={id,previous,keys:benefits.fatal?['exausto','paralisado']:root.hachimon.reckless?['inconsciente','exausto']:daily||root.hachimon.heavy?['exausto']:['fatigado'],
    remaining:benefits.fatal?3:daily||root.hachimon.reckless?null:benefits.fatigueTurns,expiresAt:!benefits.fatal&&daily&&!root.hachimon.reckless?history.exhaustedUntil:null,
    exhaustedUntil:daily?history.exhaustedUntil:null,fatal:benefits.fatal};
   history.cooldown={remaining:1,closedTurn:periodKey(actor,'turn'),until:now+6};
  }
  const closure=root.hachimon.closure;
  if(!state.active.some(a=>a.id===closure.id))state.active.push({id:closure.id,name:closure.fatal?'Consequência do Portão da Morte':'Cansaço dos Portões',
   sourceUuid:actor.uuid,duration:'recovery',remaining:closure.remaining,expiresAt:closure.expiresAt,clockAt:Number(root.hachimon.closingAt??game.time?.worldTime??0),
   hachimonRecovery:true,hachimonFatal:closure.fatal,createdTurn:periodKey(actor,'turn'),lastProcessed:{},plan:{family:'hachimon',resistances:[]}});
  return {closure:copy(closure)};
 });
 if(!result.closure)return;
 const closure=result.closure;
 for(const old of closure.previous)await endPower(actor,old);
 for(const key of closure.keys)await applyPowerCondition(actor,key,{name:record.name,source:'Livro Básico pp. 203–207'},closure.id,
  {powerSourceExecution:closure.id,...(closure.exhaustedUntil&&key==='exausto'&&!closure.fatal?{expiresAt:closure.exhaustedUntil}:{})});
}
export async function activateGuidedShadow(actor,item,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user)||powerFamily(item)!=='kagejutsu')throw Error('Você não controla o conjurador das sombras.');
 const id=command.executionId??requestId,prior=getState(actor).executions[id];if(prior?.posted)return;
 if(prior&&prior.plan?.effect!=='kage-guided')throw Error('Este registro pertence a outra técnica.');
 const scene=game.scenes?.get(command.sceneId),origin=scene?.tokens.get(command.sourceTokenId),ally=scene?.tokens.get(command.targetTokenId);
 if(!scene||!user.isGM&&scene.id!==user.viewedScene||origin?.actor?.uuid!==actor.uuid||!ally?.actor||ally.actor.uuid===actor.uuid||!user.isGM&&ally.hidden)
  throw Error('Selecione seu token e marque um aliado visível nesta cena.');
 if(command.options?.allyConsent!==true)throw Error('Confirme que o aliado aceita conduzir a sombra.');
 if(ally.actor.type==='puppet'||Number(ally.actor.system.resources?.vitality?.value)<=-21)throw Error('A sombra guiada exige um aliado vivo.');
 const plan=prior?.plan??powerPlan(item,actor.system,itemsOf(actor),{...command.options,effect:'kage-guided',targets:1},context(actor));
 const distance=measureTokenDistance(origin,ally,scene.grid);
 if(!Number.isFinite(distance)||distance>plan.range)throw Error('O aliado precisa estar ao alcance mensurável das sombras.');
 if(!prior){
  assertAction(actor,plan);
  await updatePower(actor,(state,runtime)=>{
   if(state.executions[id])return;
   commitShadowUse(actor,plan,runtime);
   const payment=corpulenciaPayment(actor,plan.cost,Number(command.options?.convertedChakra??0),context(actor));
   state.active.push({...copy(plan.active),id,name:plan.name,itemId:item.id,sourceUuid:actor.uuid,sourceTokenUuid:origin.uuid,
    scene:periodKey(actor,'scene'),createdTurn:periodKey(actor,'turn'),duration:'concentration',plan:copy(plan),lastProcessed:{},
    shadowGuided:{allyUuid:ally.actor.uuid,allyTokenUuid:ally.uuid}});
   state.executions[id]={plan:copy(plan),posted:false};return {changes:payment};
  });
 }
 if(!getState(actor).active.some(a=>a.id===id))return;
 await updatePower(ally.actor,state=>{if(!state.active.some(a=>a.id===id+':guide'))state.active.push({id:id+':guide',name:plan.name,
  sourceUuid:actor.uuid,linkedTo:id,duration:'linked',tokenUuid:ally.uuid,shadowGuidedLink:true});});
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag?.(ID,'executionId')===id&&m.getFlag?.(ID,'kind')==='power-use'))
  await postPowerCard(actor,plan,{executionId:id,itemId:item.id});
 await updatePower(actor,state=>{state.executions[id].posted=true;});
}
export async function releaseGuidedLink(actor,executionId,{user}){
 if(!game.user.isGM||!canControl(actor,user))throw Error('Você não controla o conjurador.');
 const plan=getState(actor).executions[executionId]?.plan;
 if(!plan?.shadow?.guidedFrom||!getState(actor).active.some(a=>a.id===executionId))throw Error('Liberação de sombra guiada não encontrada.');
 const ally=worldActorDocuments().find(a=>a.uuid===plan.shadow.allyUuid);
 if(ally)await updatePower(ally,state=>{state.active=state.active.filter(a=>a.linkedTo!==plan.shadow.guidedFrom);});
}
// Básico 4.1.b p. 171: a movement action upgrades an existing capture;
// it neither attacks again nor restarts its duration.
export async function activateShadowStrangle(actor,item,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user))throw Error('Você não controla o conjurador das sombras.');
 if(powerFamily(item)!=='kagejutsu')throw Error('Kagejutsu não encontrado.');
 const ids=command.targets,id=command.executionId??requestId;
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Marque as vítimas já capturadas.');
 const prior=getState(actor).executions[id];
 if(prior&&prior.plan?.effect!=='kage-kubishibari')throw Error('Este registro pertence a outra técnica.');
 const plan=prior?.plan??powerPlan(item,actor.system,itemsOf(actor),{effect:'kage-kubishibari',level:command.level,targets:ids.length},context(actor));
 if(prior?.posted)return;
 const bindings=prior?.bindings??ids.map(targetUuid=>{
  const target=worldActorDocuments().find(a=>a.uuid===targetUuid);
  if(!target)throw Error('Vítima não encontrada.');
  const binding=getState(target).active.find(a=>a.shadowBinding&&a.sourceUuid===actor.uuid&&
   getState(actor).active.some(root=>root.id===a.linkedTo&&root.shadowSource&&['kage-shibari','kage-mane'].includes(root.effect)));
  if(!target||!binding)throw Error('Cada vítima precisa estar presa pelo seu Shibari ou Mane.');
  if(getState(target).active.some(a=>a.shadowStrangle?.bindingId===binding.id))throw Error('Esta vítima já está sendo estrangulada.');
  return {targetUuid,bindingId:binding.id,rootId:binding.linkedTo};
 });
 if(!prior){
  assertAction(actor,plan);
  await updatePower(actor,state=>{
   if(state.executions[id])return;
   const payment=corpulenciaPayment(actor,plan.cost,Number(command.convertedChakra??0),context(actor));
   state.executions[id]={plan:copy(plan),bindings:copy(bindings),posted:false};return {changes:payment};
  });
 }
 for(const entry of bindings){
  const target=worldActorDocuments().find(a=>a.uuid===entry.targetUuid);
  if(!target||!getState(target).active.some(a=>a.id===entry.bindingId)||!getState(actor).active.some(a=>a.id===entry.rootId))continue;
  const strangleId=id+':'+target.id;
  await updatePower(target,state=>{
   if(!state.active.some(a=>a.id===strangleId))state.active.push({id:strangleId,name:plan.name,sourceUuid:actor.uuid,
    linkedTo:entry.rootId,duration:'linked',effect:plan.effect,shadowStrangle:{...plan.shadowStrangle,bindingId:entry.bindingId},
    plan:{...copy(plan),resistances:[{stat:'for',difficulty:plan.shadowStrangle.difficulty,onFail:[],escape:true,action:'standard'}]},lastProcessed:{}});
   if(!state.active.some(a=>a.id===strangleId+':recovery'))state.active.push({id:strangleId+':recovery',name:'Recuperar o fôlego',
    sourceUuid:target.uuid,duration:'linked',shadowRecovery:{bindingId:entry.bindingId,strangleId,pending:true}});
  });
 }
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag?.(ID,'executionId')===id&&m.getFlag?.(ID,'kind')==='power-use'))
  await postPowerCard(actor,plan,{executionId:id,itemId:item.id});
 await updatePower(actor,state=>{state.executions[id].posted=true;});
}
async function settleShadowRecovery(target){
 for(const record of getState(target).active.filter(a=>a.shadowRecovery?.pending)){
  if(getState(target).active.some(a=>!a.ending&&[record.shadowRecovery.bindingId,record.shadowRecovery.strangleId].includes(a.id)))continue;
  await applyPowerCondition(target,'fatigado',{name:'Recuperar o fôlego',source:'Livro Básico p. 171'},record.id);
  await updatePower(target,state=>{const a=state.active.find(a=>a.id===record.id);if(a)a.shadowRecovery={...a.shadowRecovery,pending:false,awaitNextStart:true};});
 }
}
export async function activateInuzukaFusion(actor,item,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user))throw Error('Um mestre coordena a união para o controlador do Inuzuka.');
 if(item?.type!=='power'||powerFamily(item)!=='shikakyu')throw Error('Shikakyu de origem não encontrado.');
 if(command.sceneId!==user.viewedScene&&!user.isGM)throw Error('Os participantes precisam estar na cena vista pelo jogador.');
 const existing=getState(actor).active.find(a=>a.id===requestId&&a.bodyFusion);
 if(!existing){
  const options={...command.options,participants:command.participants},plan=powerPlan(item,actor.system,itemsOf(actor),options,context(actor));
  if(!plan.bodyFusion)throw Error('Esta técnica não é uma união Inuzuka.');
  const participants=fusionParticipants(actor,plan.effect,plan.participants);
  if(participants.some(a=>derivedSummary(a).state.keys.includes('morto')))throw Error('Um participante morto não pode integrar esta união.');
  if(!participants.every(a=>canControl(a,user)))throw Error('Você precisa controlar todos os participantes da união.');
  const joining=new Set([actor.uuid,...plan.participants]);
  if((game.messages?.contents??[]).some(m=>{
   const execution=m.getFlag?.(ID,'actionExecution');
   return execution&&!terminalExecution(execution.state)&&(joining.has(execution.actorUuid)||execution.slots?.some(s=>joining.has(s.targetUuid)));
  }))throw Error('Conclua ou cancele os ataques pendentes dos participantes antes de unir seus corpos.');
  plan.fusionTokens=prepareFusionScene(actor,participants,command);
  assertAction(actor,plan);
  await updatePower(actor,state=>{
   if(state.executions[requestId])return;
   const payment=corpulenciaPayment(actor,plan.cost,Number(options.convertedChakra??0),context(actor));
   const active={...copy(plan.active),id:requestId,name:plan.name,itemId:item.id,sourceUuid:actor.uuid,
    scene:periodKey(actor,'scene'),createdTurn:periodKey(actor,'turn'),maintenanceAt:Number(game.time?.worldTime??0),
    duration:plan.duration,plan:copy(plan),fusionReady:false,lastProcessed:{}};
   state.active.push(active);state.executions[requestId]={plan:copy(plan),options:{...copy(options),id:item.id},posted:false};
   return {changes:payment};
  });
 }
 const active=getState(actor).active.find(a=>a.id===requestId&&a.bodyFusion);
 if(!active)throw Error('A união já foi encerrada; prepare uma nova ativação.');
 if(!active.plan.participants.every(uuid=>canControl((game.actors?.contents??[]).find(a=>a.uuid===uuid),user)))throw Error('Os participantes da união precisam continuar sob seu controle.');
 // A Juujin copy is a participant, never another independently acting creature.
 for(const transformed of getState(actor).active.filter(a=>a.companionTransform&&active.plan.participants.includes(a.targetUuid)))await endPower(actor,transformed.id);
 await applyBodyFusion(actor,active);
 await updatePower(actor,state=>{const entry=state.active.find(a=>a.id===requestId);if(entry)entry.fusionReady=true;});
 const messages=game.messages?.contents??[];
 if(!messages.some(m=>m.getFlag?.(ID,'kind')==='power-use'&&m.getFlag(ID,'executionId')===requestId))
  await postPowerCard(actor,active.plan,{executionId:requestId,itemId:item.id});
 await updatePower(actor,state=>{if(state.executions[requestId])state.executions[requestId].posted=true;});
 return active;
}
export async function resumeInuzukaFusion(actor,id,{user=game.user}={}){
 const active=getState(actor).active.find(a=>a.id===id&&a.bodyFusion&&a.active!==false);
 if(!active)throw Error('União ativa não encontrada.');
 const item=findItem(actor,active.itemId);
 if(!canControl(actor,user)||!item||validatePowerPurchase(actor,item,context(actor)).length||
  !active.plan.participants.every(uuid=>canControl((game.actors?.contents??[]).find(a=>a.uuid===uuid),user)))throw Error('Confira a origem e o controle de todos os participantes para concluir a união.');
 await applyBodyFusion(actor,active);
 await updatePower(actor,state=>{const record=state.active.find(a=>a.id===id);if(record)record.fusionReady=true;});
}
function planHtml(plan){return `<div class="sns-app"><article class="sns-record"><header><strong>${esc(plan.name)}</strong></header><p>Nível ${plan.level} · chakra ${plan.cost} · ${esc(POWER_ACTION_NAMES[plan.action]??plan.action)} · ${esc(POWER_DURATION_NAMES[plan.duration]??plan.duration)}.</p>${plan.damage!=null?`<p>Dano base ${plan.damage}.</p>`:''}${plan.healing!=null?`<p>Cura ${plan.healing} ao fim do turno do paciente.</p>`:''}${plan.message?`<p>${esc(plan.message)}</p>`:''}<ul>${(plan.notes??[]).filter(Boolean).map(n=>'<li>'+esc(n)+'</li>').join('')}</ul><small>${esc(plan.source)}</small></article></div>`;}
function powerRollCheck(actor,plan,powerExecutionId){
 const kind=plan.defensive?'defense':plan.kind??(plan.stat in COMBAT?'attack':plan.stat in SKILLS?'skill':'attribute'),check=statPrecision(actor,plan.stat,{kind,reaction:!!plan.defensive,manualContext:true,requiresSeals:plan.seals,powerExecutionId});if(!check.allowed)throw Error(check.reasons.join(' '));
 const uncapped=number(check.uncappedPenalty);
 const precision=check.base+Math.max(-3,check.penalty-uncapped+number(plan.penalty))+uncapped+check.bonus+number(plan.precisionBonus)+number(plan.counterPenalty);
 return {kind,precision};
}
export async function prepareCoordinatedPowerRoll(actor,plan,{executionId}={}){
 const {precision}=powerRollCheck(actor,plan,executionId);
 if(!await checkInventoryAttack(actor))return null;
 await commitHachimonHeavy(actor,plan,executionId);
 return {precision,roll:await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate()};
}
export async function postPowerRoll(actor,item,plan,extra={}){
 const {kind,precision}=extra.roll?{kind:'attack',precision:extra.precision}:powerRollCheck(actor,plan,extra.executionId);
 if(kind==='attack'&&!extra.trapCreation&&!extra.roll&&!await checkInventoryAttack(actor))return null;
 const roll=extra.roll??await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate(),natural=roll.total-precision,result=powerAttackResult(plan,natural),attack={actorUuid:actor.uuid,itemId:item.id,executionId:extra.executionId,plan:copy(plan),precision,total:roll.total,...result,coordinated:!!extra.roll,targetUuid:extra.targetUuid,distance:extra.distance??null,sequenceIndex:extra.sequenceIndex??0,previousTargets:extra.previousTargets??[]};
 return roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:planHtml(plan)+`<p>${esc(ATTRIBUTES[plan.stat]??COMBAT[plan.stat]??SKILLS[plan.stat]?.[0]??plan.stat)}: precisão ${precision} · grau ${result.degree}${result.damage!=null?' · dano '+result.damage+' antes das proteções':''}.</p>${plan.hachimonHeavy&&result.failed?'<p>Fracasso automático, salvo contra Bloqueio comum. O grau mínimo só causa dano se acertar.</p>':''}${kind==='attack'&&(!result.failed||['ichigekishin','amaterasu'].includes(plan.effect))&&!extra.trapCreation&&!extra.roll?`<button type="button" data-sns-power-resolve>Conferir defesa e aplicar no alvo</button>`:''}`,flags:{[ID]:{kind:'power-attack',actorUuid:actor.uuid,powerAttack:attack}}});
}
async function healPowerTarget(actor,plan,targetUuid,sourceId){
 const target=await fromUuid(targetUuid);owner(target);if(number(plan.healing)<0)return applyPhysicalDamage(target,{fixed:-plan.healing,sourceId,reason:plan.name,attackerUuid:actor.uuid,camouflageContext:{located:true},ignoreAbsorption:true,ignoreBodyHardness:[bodyHardness(target)]});
 if(derivedSummary(target).state.keys.includes('morto'))throw Error('Este tratamento não ressuscita.');
 const current=target.system.resources?.vitality?.value,max=derivedSummary(target).vitality;if(current==null||!Number.isFinite(max))throw Error('Preencha os recursos do paciente.');
 if(plan.family==='iryou-ninjutsu')await updatePower(target,(state,runtime)=>{
  if(readKeyedRecord(state.receipts,sourceId)||!runtime.hachimon?.permanentLoss||plan.level<runtime.hachimon.treatmentLevel)return;
  const healed=Math.min(Number(runtime.hachimon.permanentLoss),Math.max(0,number(plan.healing)));
  runtime.hachimon.permanentLoss-=healed;
  state.receipts[recordKey(sourceId)]={healing:plan.healing,hachimonTreatment:healed,pendingHealing:true};
 });
 await updatePower(target,(state,runtime)=>{
  const prior=readKeyedRecord(state.receipts,sourceId);if(prior&&!prior.pendingHealing)return;
  state.receipts[recordKey(sourceId)]={...prior,healing:plan.healing,pendingHealing:false};
  const ceiling=Math.max(0,max-Number(runtime.hachimon?.permanentLoss??0));
  return {changes:{'system.resources.vitality.value':Math.min(ceiling,Number(target.system.resources.vitality.value)+number(plan.healing))}};
 });
 await updatePower(target,s=>{s.bisturiHits={};});
 if(target.system.resources.vitality.value>=-20&&target.system.resources.vitality.value<=-11&&!conditionRecords(target).some(c=>c.key==='estavel'))await saveCondition(target,{key:'estavel',source:plan.name});
 for(const c of conditionRecords(target).filter(c=>!c.automatic&&(c.key==='sangrando'||String(c.source??'').includes('Bisturi de Chakra'))))await saveCondition(target,c,{remove:true});
}
const resolutionQueues=new Map();
function withinResolvedRange(options,range){
 if(options.distance==null)return options.rangeConfirmed===true;
 const distance=Number(options.distance);
 return Number.isFinite(distance)&&distance>=0&&distance<=range;
}
export async function resolvePowerAttack(message,targetUuid,options={}){
 const key=message.id+':'+targetUuid,previous=resolutionQueues.get(key)??Promise.resolve(),job=previous.catch(()=>{}).then(()=>resolvePowerAttackNow(message,targetUuid,options));resolutionQueues.set(key,job);try{return await job;}finally{if(resolutionQueues.get(key)===job)resolutionQueues.delete(key);}
}
async function resolvePowerAttackNow(message,targetUuid,options={}){
 let attack=message.getFlag(ID,'powerAttack');if(!attack)throw Error('Ataque não encontrado.');const actor=await fromUuid(attack.actorUuid),target=await fromUuid(targetUuid);owner(target);
 const counters=message.getFlag(ID,'assistedTechniqueCounters');
 const counter=Array.isArray(counters)?counters.find(entry=>entry.targetUuid===target.uuid):null;
 if(counter?.hit===null)throw Error('Conclua Anular Técnica antes de aplicar este ataque.');
 if(counter?.hit===false){
  if(attack.plan.fireDifficulty!=null){
   if(counter.counterElement!=='suiton')await applyFireHeat(target,attack.plan,(message.uuid??message.id)+':'+target.uuid);
   return {hit:false};
  }
  throw Error('Este alvo anulou a técnica ou o ataque falhou no confronto.');
 }
 if(counter?.repeatedAttack)attack={...attack,...powerAttackResult(attack.plan,counter.repeatedAttack.natural),total:counter.repeatedAttack.total};
 if(counter?.hit)options={...options,hit:true,defense:'other',defenseTotal:counter.defenseTotal??options.defenseTotal};
 const receiptId=`${message.uuid??message.id}:${target.uuid}`,prior=readKeyedRecord(getState(target).receipts,receiptId);if(prior?.complete)return {...prior,duplicate:true};
 if(attack.plan.shadow?.binding&&!getState(actor).active.some(a=>a.id===attack.executionId&&a.active!==false))
  throw Error('A técnica das sombras foi encerrada; a ligação não pode mais ser aplicada.');
 if(attack.plan.sonic&&immuneToSound(target)){
  const outcome={complete:true,hit:false,damage:0,immune:'sound'};
  await updatePower(target,s=>{s.receipts[recordKey(receiptId)]=outcome;});
  return outcome;
 }
 const plan=copy(attack.plan);if((attack.previousTargets??[]).includes(target.uuid))throw Error('Ricochete deve seguir para outro alvo.');if(getState(target).active.some(a=>a.submerged))throw Error('O alvo submerso em Colisão de Ondas não pode receber outros ataques físicos.');if(attack.failed&&!(plan.hachimonHeavy&&options.defense==='bloqueio'&&!options.blocked)&&!(attack.coordinated&&plan.fireDifficulty!=null)&&!(plan.effect==='ichigekishin'&&options.heldGrapple==='yes')&&!(plan.effect==='amaterasu'&&options.amaterasuDefense==='none'))throw Error('Falha automática não atinge o alvo.');
 if(options.defense==='bloqueio'&&plan.noBlock&&!(attack.coordinated&&plan.effect==='raio'&&options.specialBlock)||options.defense==='esquiva'&&plan.noDodge)throw Error('Este efeito não permite a defesa escolhida.');
 if(plan.active?.bisturi&&options.defense==='bloqueio'&&options.unarmedBlock==='yes')throw Error('Bisturi de Chakra não permite Bloqueio desarmado.');
 const before=plan.resistances.filter(r=>r.beforeDefense);if(before.length&&!readKeyedRecord(getState(target).receipts,`${options.preparedAreaId??message.id}:before`))throw Error('Resolva primeiro os testes anteriores à defesa.');
 if(plan.family==='kikai-ninpou'&&plan.stat&&plan.targets===1&&!plan.area&&attack.targetUuid!==target.uuid)throw Error('Escolha o mesmo alvo declarado para Kikai Ninpou.');
 let hit=options.hit||plan.automaticHit||plan.hachimonHeavy&&options.defense==='bloqueio'&&!options.blocked||attack.critical&&worldRules().criticalSkipsDefense!==false,degree=plan.hachimonHeavy&&options.defense==='bloqueio'&&!options.blocked?Math.max(1,attack.degree,Number(plan.minimumDegree??0)):attack.degree;
 if(plan.effect==='amaterasu'){
  if(attack.targetUuid!==target.uuid||!withinResolvedRange(options,9))throw Error('Confirme o alvo declarado dentro de 9 m.');
  if(!['none','allowed'].includes(options.amaterasuDefense))throw Error('Confira se o alvo tem uma defesa permitida contra Amaterasu.');
  if(options.amaterasuDefense==='none')hit=true;
 }
 if(plan.effect==='ichigekishin'){
  if(target.uuid===attack.actorUuid||sizeProfile(target.system).index>=SIZES.huge.index)throw Error('Este alvo não é afetado pelo Ichigekishin.');
  if(!withinResolvedRange(options,3))throw Error('Informe distância de até 3 m.');
  if(options.heldGrapple==='yes')hit=true;
 }
 if(options.defense==='bloqueio'&&(plan.family==='rasengan'||plan.effect==='lamina-raios'))hit=await breakCommonBlockingWeapon(target,plan.family==='rasengan'?'rasengan':'lightning',options.blockingWeapon)||hit;
 let suppliedDefense=options.defenseTotal;
 if(!attack.coordinated&&plan.stat==='cd'&&!attack.failed){
  const {claimFeintAgainst}=await import('./action-executions.mjs');
  if(await claimFeintAgainst(target,actor,receiptId,{ranged:true,plan})){
   const dodge=options.defense==='esquiva'?statPrecision(target,'esq',{kind:'defense',reaction:true,manualContext:true}).precision+9:null;
   const baseline=options.defense==='esquiva'?dodge:(suppliedDefense!==undefined&&suppliedDefense!==''?Number(suppliedDefense):null);
   if(baseline!=null&&Number.isFinite(baseline)){
    suppliedDefense=baseline-2;
    if(!attack.critical&&options.defense==='esquiva')hit=attack.total>=suppliedDefense;
   }
  }
 }
 const undefended=attack.coordinated&&plan.followupRolls&&suppliedDefense==null&&(attack.critical||options.defense==='none');
 const defenseTotal=Number(suppliedDefense);if(!undefended&&((hit&&plan.followupRolls||!hit&&!options.skipResidual&&plan.rerollAfterDefense&&['esquiva','antecipar'].includes(options.defense)&&Number(options.targets??1)===1)&&(!Number.isFinite(defenseTotal)||suppliedDefense==null)))throw Error('Informe o resultado já rolado da defesa para os ataques adicionais.');
 if(!hit&&!options.skipResidual&&plan.rerollAfterDefense&&['esquiva','antecipar'].includes(options.defense)&&Number(options.targets??1)===1){const retry=await rollFollowup(actor,attack,target,`${message.id}:retry`,defenseTotal);hit=retry.hit;if(hit){plan.damage=Math.ceil(plan.damage*plan.rerollAfterDefense.multiplier);degree=retry.degree;}}
 if(plan.family==='juuken'&&['kaiten-offense','kaiten-counter'].includes(plan.effect)){
  if(target.uuid===attack.actorUuid)throw Error('O usuário não é alvo do próprio Kaiten.');
  if(plan.effect==='kaiten-counter'&&target.uuid===attack.counterAttackerUuid)hit=true;
  if(!withinResolvedRange(options,plan.range))throw Error(`Informe uma distância dentro do raio de ${plan.range} m do Kaiten.`);
 }
 if(plan.family==='juuken'&&plan.effect==='kuushou'){
  if(attack.targetUuid!==target.uuid)throw Error('O alvo deve ser o mesmo escolhido ao executar Hakke Kuushou.');
  if(!withinResolvedRange(options,plan.range))throw Error('Hakke Kuushou exige distância de até 20 m.');
 }
 if(plan.fireDifficulty!=null&&options.defense!=='suiton'&&!options.blocked&&(hit||options.defense!=='bloqueio')){
  await applyFireHeat(target,plan,receiptId);
 }
 if(!hit&&(attack.failed||options.skipResidual))return {hit:false};
 if(!hit){for(let i=0;i<plan.resistances.length;i++){const r=plan.resistances[i];if(r.afterSuccessfulDefense){const result=await rollPowerResistance(target,r.stat,r.difficulty,plan,`${message.id}:residual:${i}`);if(!result.success){hit=true;degree=r.residualDegree;}}}if(!hit)return {hit:false};}
 if(plan.explosionResistance&&options.attached!=='yes'&&!derivedSummary(target).state.immobile){const r=plan.explosionResistance,result=await rollPowerResistance(target,options.explosionStat==='prontidao'?'prontidao':'agi',r.difficulty,plan,`${message.id}:explosion`);if(result.success)return {hit:false,damage:0};}
 if(plan.followupRolls)for(let i=0;i<plan.followupRolls;i++){const result=await rollFollowup(actor,attack,target,`${message.id}:followup:${i}`,undefended?null:defenseTotal);if(result.hit)plan.damage++;}
 if(plan.effect==='flechas'){const count=Number(options.projectiles??plan.projectiles);if(!Number.isInteger(count)||count<1||count>plan.projectiles)throw Error('Quantidade de projéteis por alvo inválida.');plan.damage-=2*(plan.projectiles-count);}
 if(plan.effect==='meteoros'&&(!Number.isInteger(Number(options.meteors??1))||Number(options.meteors??1)<1||Number(options.meteors??1)>6))throw Error('Use de 1 a 6 meteoros por alvo.');
 if(options.secondary==='yes'&&plan.secondaryRadius){degree=powerAttackResult({...plan,minimumDegree:0},attack.natural).degree;plan.collateralDamage=0;}


 const multiplier=plan.splitDamage?Math.max(1,number(options.targets??plan.targets)):1;
 let outcome={hit:true,damage:0};
 if(plan.effect!=='ichigekishin'){const ignore=plan.ignoreAllBodyHardness?bodyHardness(target):number(plan.ignoreBodyHardness);outcome=await applyPhysicalDamage(target,{base:plan.damage??0,area:!!plan.area,partnerDivisor:plan.partnerDivisor??1,damageMultiplier:plan.damageMultiplier??1,juuken:plan.family==='juuken'&&['kuushou','kaiten-offense','kaiten-counter'].includes(plan.effect),fixed:plan.fixedDamage!=null?number(plan.fixedDamage)*(plan.effect==='meteoros'?Math.max(1,number(options.meteors??1)):1):0,degree,divisionCount:multiplier,divisionIndex:number(options.divisionIndex),ignoreBodyHardness:[plan.active?.conditionalHardness?0:ignore],conditionalHardness:plan.active?.conditionalHardness,sourceId:receiptId,reason:plan.name,critical:attack.critical,privateRecipients:plan.privateRecipients,attackerUuid:actor.uuid,attackerElement:plan.element??plan.family,camouflageContext:{directAttack:true,located:options.located!=='no',sensor:options.sensor==='yes',areaFraction:number(options.areaFraction),distance:options.distance}});}
 if(outcome.hit===false)return outcome;
 if(plan.hachimonHeavy)outcome.heavyFall=await settleHachimonHeavyFall(target,plan.hachimonHeavy,receiptId);
 if(plan.nui?.stitch){
  const stitching=await updatePower(target,state=>{
   const receipt=state.receipts[recordKey(receiptId)]??={};
   if(!receipt.nui){
    const previous=state.active.find(a=>a.effect==='kage-nui'&&a.sourceUuid===actor.uuid&&a.plan?.conditions?.includes('impedido')&&a.active!==false&&!a.ending);
    receipt.nui={key:previous?'paralisado':degree>=3?'impedido':null,previousId:previous?.id,previousRoot:previous?.linkedTo};
   }
   return {stitching:copy(receipt.nui)};
  });
  plan.conditions=stitching.stitching.key?[stitching.stitching.key]:[];
  plan.resistances=plan.conditions.length?[{stat:'for',difficulty:plan.difficulty,onFail:[],escape:true,action:'standard'}]:[];
  plan.active={...plan.active,physicalRestraint:!!plan.conditions.length,...(plan.conditions.length?{conditions:plan.conditions}:{})};
  plan.nui.replaced=stitching.stitching;
  if(stitching.stitching.key==='paralisado')await updatePower(actor,state=>{
   const root=state.active.find(a=>a.id===attack.executionId);if(root){root.duration='concentration';root.plan.duration='concentration';}
  });
 }
 if(plan.kikaiDrain&&plan.cost>0){
  const groups=plan.effect==='flechas'?Number(options.projectiles??plan.projectiles):plan.kikaiDrain;
  outcome.chakraDrained=await drainKikaiChakra(target,receiptId+':kikai',groups);
 }
 if(plan.family==='dokujutsu')await applyDokujutsuPoison(target,plan,{sourceId:receiptId+':poison',
  attackerUuid:actor.uuid,damage:outcome.damage,degree});
 else if(plan.poisonSnapshot)await exposePoisonFromPower(target,plan.poisonSnapshot,{sourceId:receiptId+':poison',attackerUuid:actor.uuid,hit:true,usingPower:true,guaranteedInjection:true,damage:0,damageGrade:attack.degree});
 const resistances=[];for(let index=0;index<plan.resistances.length;index++){
  const r=plan.resistances[index];if(r.beforeDefense||r.eachStart||r.escape||r.endsUntil||r.allowsAttackFromInside||r.surface||r.holdBreath||r.sourceProtectsAlly||r.afterSuccessfulDefense)continue;if(r.requiresDamage&&!outcome.damage)continue;
  const stat=Array.isArray(r.stat)?options['resistStat.'+index]??r.stat[0]:r.stat;if(Array.isArray(r.stat)&&!r.stat.includes(stat))throw Error('Resistência inválida.');
  const difficulty=Array.isArray(r.stat)&&stat===r.stat[1]&&r.alternateDifficulty!=null?r.alternateDifficulty:r.difficulty,result=await rollPowerResistance(target,stat,difficulty,plan,receiptId+':'+index);
  resistances.push({...r,...result});if(!result.success)for(const key of r.onFail??[])await applyPowerCondition(target,key,plan,receiptId,{remaining:r.remaining,timing:r.timing,level:r.level,scope:r.scope,difficulty:result.difficulty});
  if(r.criticalFailureRepeatUnconscious&&result.natural<=3){const second=await rollPowerResistance(target,stat,difficulty,plan,receiptId+':'+index+':critical');if(!second.success)await applyPowerCondition(target,'inconsciente',plan,receiptId);}
 }
 for(const key of (resistances.some(r=>r.avoidsCondition&&r.success)?[]:plan.conditions??[]))await applyPowerCondition(target,key,plan,receiptId,{...(plan.conditionTurns?{remaining:plan.conditionTurns,timing:'Fim do turno'}:{}),...(plan.active?.conditions||plan.shadow?.binding?{powerSourceExecution:attack.executionId}:{})});
 if(plan.blackFlames)await updatePower(target,state=>{
  if(!state.active.some(a=>a.id===receiptId))state.active.push({
   id:receiptId,name:plan.name,family:plan.family,effect:plan.effect,
   sourceUuid:actor.uuid,duration:'permanent',blackFlames:plan.blackFlames,plan:copy(plan)
  });
 });
 if(plan.periodic?.immediate){await updatePower(target,state=>{if(!state.active.some(a=>a.id===receiptId))state.active.push({id:receiptId,name:plan.name,family:plan.family,effect:plan.effect,sourceUuid:actor.uuid,itemId:attack.itemId,duration:'continuous',level:plan.level,plan:copy(plan),periodic:copy(plan.periodic),linkedTo:attack.executionId??message.id,remainingDamage:plan.periodic.total-1,starts:0,createdTurn:periodKey(target,'turn'),lastProcessed:{}});});}
 if(plan.active?.suffocation||plan.effect==='colisao-ondas')await applyPowerCondition(target,'sufocamento',plan,receiptId,{difficulty:plan.common.difficulty-2,damage:plan.effect==='colisao-ondas'?plan.damage:undefined,powerSourceExecution:attack.executionId});
 if(plan.inventoryMark)await target.update({'system.inventoryState.marked':{source:actor.uuid,at:Number(game.time?.worldTime??0)}});
 if(plan.active?.bisturi){let count;await updatePower(target,s=>{s.bisturiHits??={};const key=actor.uuid;const ledger=s.bisturiHits[key]??={messages:[]};if(!ledger.messages.includes(message.id))ledger.messages.push(message.id);count=ledger.messages.length;});if(count===3){const r=await rollPowerResistance(target,'vig',plan.active.difficulty,plan,receiptId+':bisturi');if(!r.success)for(const key of ['lento','debilitado'])await applyPowerCondition(target,key,{...plan,name:'Bisturi de Chakra'},receiptId,{durationText:'2 meses; remove após Iryou Ninjutsu ou 1 mês de repouso'});}}
 if(plan.inventorySmoke)await updatePower(target,s=>{if(!s.active.some(a=>a.id===receiptId))s.active.push({id:receiptId,name:plan.name,sourceUuid:actor.uuid,duration:'continuous',remaining:3,camouflage:{level:'partial',group:'environment'}});});
 if(plan.camouflagePenalty)await updatePower(target,state=>{if(!state.active.some(a=>a.id===receiptId))state.active.push({id:receiptId,name:plan.name,effect:plan.effect,sourceUuid:actor.uuid,duration:'continuous',remaining:plan.conditionTurns,plan:copy(plan),linkedTo:attack.executionId??message.id,camouflage:{level:plan.camouflagePenalty===50?'total':'partial',group:'personal',visualImpairment:true},lastProcessed:{}});});
 if(plan.active?.conditions||plan.active?.suffocation||plan.resistances.some(r=>r.escape||r.endsUntil||r.surface))await updatePower(target,state=>{if(!state.active.some(a=>a.id===receiptId))state.active.push({id:receiptId,name:plan.name,effect:plan.effect,sourceUuid:actor.uuid,duration:'linked',linkedTo:attack.executionId,submerged:plan.effect==='colisao-ondas',...(plan.shadow?.binding?{tokenUuid:options.targetTokenUuid??null,shadowPullVictim:!!plan.shadow.pull,shadowBinding:{turns:plan.shadow.turns*(plan.shadow.capanga?2:1)}}:{}),plan:copy(plan),lastProcessed:{}});});
 if(plan.active?.physicalRestraint){
  const objects=copy(target.system.physical?.objects??[]);
  if(!objects.some(o=>o.powerExecution===receiptId)){
   objects.push({id:receiptId,name:plan.name,kind:'object',hardness:plan.hardness,restraint:true,powerExecution:receiptId,element:plan.family});
   await target.update({'system.physical.objects':objects});
  }
 }
 if(plan.nui?.replaced?.previousId&&plan.conditions.length){
  await endPower(target,plan.nui.replaced.previousId);
  await settleNuiSource(actor,plan.nui.replaced.previousRoot);
 }
 if(plan.collateralDamage){const collateralId=`${message.uuid??message.id}:collateral`;if(actor.isOwner)await applyPhysicalDamage(actor,{base:plan.collateralDamage,degree:1,sourceId:collateralId,reason:'Dano colateral de Rasengan Elemental',attackerUuid:actor.uuid,critical:true,camouflageContext:{located:true}});else if(!prior?.collateralPosted){await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:'<p>Rasengan Elemental: o usuário deve resolver seu dano colateral.</p><button type="button" data-sns-power-collateral>Aplicar dano colateral</button>',flags:{[ID]:{powerCollateral:{actorUuid:actor.uuid,damage:plan.collateralDamage,receiptId:collateralId}}}});await updatePower(target,s=>{s.receipts[recordKey(receiptId)]={...readKeyedRecord(s.receipts,receiptId),collateralPosted:true};});}}
 for(const c of conditionRecords(target).filter(c=>c.powerReceipt===`${message.id}:before`))await saveCondition(target,c,{remove:true});
 await updatePower(target,state=>{state.receipts[recordKey(receiptId)]={complete:true,hit:true,damage:outcome.damage,resistances,...(outcome.chakraDrained?{chakraDrained:outcome.chakraDrained}:{})};});
 const continuation=!attack.coordinated&&plan.sequence&&(attack.sequenceIndex??0)+1<plan.targets?{...attack,sequenceIndex:(attack.sequenceIndex??0)+1,previousTargets:[...(attack.previousTargets??[]),target.uuid]}:null;
 if(!attack.coordinated)await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:target}),content:`<p>${esc(plan.name)} em ${esc(target.name)}: ${outcome.damage?outcome.damage+' de dano aplicado.':'Efeitos resolvidos.'}${outcome.chakraDrained?' Chakra drenado: '+outcome.chakraDrained+'.':''}</p>${plan.effect==='kuushou'&&resistances.some(r=>!r.success)?'<p>O alvo caiu. Mova o token 3 m para trás conforme a posição no mapa.</p>':''}${continuation?'<button type="button" data-sns-power-continue>Ricochetear para outro alvo</button>':''}`,flags:{[ID]:{kind:'power-result',sourceMessage:message.uuid,targetUuid:target.uuid,outcome,resistances,powerContinuation:continuation}}});return outcome;
}
export async function settleNuiSource(actor,id){
 if(!id)return;
 const source=getState(actor).active.find(a=>a.id===id&&a.nuiSource);if(!source)return;
 if(!worldActorDocuments().some(target=>getState(target).active.some(a=>a.linkedTo===id&&a.effect==='kage-nui'&&a.active!==false&&!a.ending)))
  await endPower(actor,id);
}
async function drainKikaiChakra(target,receiptId,amount){
 const result=await updatePower(target,state=>{
  if(readKeyedRecord(state.receipts,receiptId))return {amount:readKeyedRecord(state.receipts,receiptId).amount};
  const chakra=target.system.resources?.chakra?.value;
  if(!Number.isFinite(chakra))throw Error('Preencha o chakra atual do alvo.');
  state.receipts[recordKey(receiptId)]={amount};
  return {amount,changes:{'system.resources.chakra.value':chakra-amount,'system.automation.forcedDrain':true}};
 });
 return result.amount;
}
async function applyFireHeat(target,plan,receiptId){
 const key=receiptId+':dominio-do-fogo';
 const heat=await rollPowerResistance(target,'vig',plan.fireDifficulty,plan,key);
 if(!heat.success)await applyPowerCondition(target,'debilitado',plan,key,{remaining:1,timing:'Fim do turno'});
}
const resistanceWork=new Map();
export async function rollPowerResistance(target,stat,difficulty,plan,key){
 const identity=target.uuid+':'+key;
 if(resistanceWork.has(identity))return resistanceWork.get(identity);
 const job=rollPowerResistanceOnce(target,stat,difficulty,plan,key);resistanceWork.set(identity,job);
 try{return await job;}finally{if(resistanceWork.get(identity)===job)resistanceWork.delete(identity);}
}
async function rollPowerResistanceOnce(target,stat,difficulty,plan,key){
 let result=readKeyedRecord(getState(target).receipts,key),roll;
 if(result&&result.posted!==false)return result;
 if(!result){
  difficulty=skillResistanceDifficulty(plan,stat,difficulty);
  if(plan.illusion)difficulty=Math.max(0,difficulty-Number(hachimonProfile(target.system)?.genjutsuReduction??0));
  const check=statPrecision(target,stat,{kind:plan.testKind??(stat in SKILLS?'skill':'resistance'),reaction:!plan.testOnly,bodyResistance:stat==='vig',manualContext:true,originalMind:plan.family==='shindenshin',social:plan.testSocial===true});
  if(!check.allowed){result={stat,difficulty,natural:0,total:0,success:false,automaticFailure:true};}
  else{
   const precision=check.precision+Number(plan.testBonus??0);
   roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();
   const natural=roll.total-precision;
   result={stat,difficulty,natural,total:roll.total,precision,success:plan.testOnly?null:natural>=15||natural>3&&roll.total>=difficulty,
    posted:false,...(roll.toJSON?{rollJSON:JSON.stringify(roll.toJSON())}:{})};
  }
  await updatePower(target,s=>{s.receipts[recordKey(key)]=copy(result);});
 }
 if(result.posted===false){
  const messages=game.messages?.contents??[...(game.messages?.values?.()??[])];
  if(!messages.some(m=>m.getFlag?.(ID,'powerResistanceReceipt')===key)){
   const data={...(plan.privateRecipients?{whisper:plan.privateRecipients}:{}),speaker:ChatMessage.getSpeaker({actor:target}),
    flavor:plan.testOnly?`${esc(plan.name)} · ${esc(ATTRIBUTES[stat]??COMBAT[stat]??SKILLS[stat]?.[0]??stat)} · precisão ${result.precision}.`:`${esc(plan.name)} · resistência ${esc(stat)} ${result.difficulty}: ${result.success?'sucesso':'falha'}.`,
    flags:{[ID]:{powerResistanceReceipt:key,concealedRoll:!!plan.privateRecipients,kind:'power-resistance',testKind:stat in SKILLS?'skill':'resistance',actorUuid:target.uuid,
     stat,natural:result.natural,precision:result.precision,difficulty:result.difficulty,success:result.success}}};
   roll??=result.rollJSON?foundry.dice.Roll.fromJSON(result.rollJSON):null;
   if(roll)await roll.toMessage(data,plan.privateRecipients?{messageMode:'gm'}:{});
   else await ChatMessage.create({...data,content:`<p>${data.flavor} Total: ${result.total}.</p>`});
  }
  await updatePower(target,s=>{const receipt=readKeyedRecord(s.receipts,key);if(receipt)receipt.posted=true;});
  result.posted=true;
 }
 return result;
}
async function applyPowerCondition(target,key,plan,receiptId,extra={}){const existing=conditionRecords(target,{includeInactive:true}).find(c=>c.key===key&&c.powerReceipt===receiptId);if(existing)return;await saveCondition(target,{key,source:`${plan.name} · ${plan.source}`,powerReceipt:receiptId,...extra});}
const endingPowers=new Map();
export async function endPower(actor,id){
 const key=actor.uuid+':'+id;
 if(endingPowers.has(key))return endingPowers.get(key);
 const job=finishEndPower(actor,id);endingPowers.set(key,job);
 try{return await job;}finally{if(endingPowers.get(key)===job)endingPowers.delete(key);}
}
async function finishEndPower(actor,id){
 owner(actor);const record=getState(actor).active.find(a=>a.id===id);if(!record)return;
 if(record.mentalStun&&!game.user.isGM)throw Error('Este Atordoado dura até o fim do próximo turno do Yamanaka.');
 if(record.mindSendFailure&&!game.user.isGM)throw Error('A inconsciência do envio termina no próximo turno do Yamanaka.');
 if(record.hachimonRecovery&&!game.user.isGM)throw Error('O cansaço dos Portões termina pela duração ou por conferência do mestre.');
 if(record.hachimonFatal&&record.remaining>0)throw Error('A consequência do Portão da Morte ainda está em curso.');
 if(!game.user.isGM&&record.sourceUuid===actor.uuid&&!record.linkedTo){
  const {requestAction}=await import('./action-executions.mjs');return requestAction({op:'end-power',actorUuid:actor.uuid,id});
 }
 if(record.bodyFusion){
  if(!game.user.isGM){const {requestAction}=await import('./action-executions.mjs');return requestAction({op:'inuzuka-fusion-end',actorUuid:actor.uuid,id});}
  await finishBodyFusion(actor,record);
 }
 if(record.companionTransform){const {finishJuujinTransformation}=await import('./inuzuka.mjs');await finishJuujinTransformation(actor,record);}
 if(record.hachimon)await closeHachimon(actor,record);
 if(record.hachimonFatal)await actor.update({'system.resources.vitality.value':Math.min(-21,Number(actor.system.resources.vitality.value))});
 if(record.mentalControlLink)for(const sensor of getState(actor).active.filter(p=>p.borrowedMindSensor?.sourceUuid===record.sourceUuid&&p.borrowedMindSensor.rootId===record.linkedTo))await endPower(actor,sensor.id);
 const resumable=record.shadowSource||record.shadowBinding||record.shadowStrangle||record.shadowGuidedLink||record.plan?.active?.physicalRestraint||record.hachimon||record.hachimonRecovery||record.mentalNetwork||record.mentalNetworkLink||record.mentalControl||record.mentalControlLink;
 // Keep an ending receipt until every linked victim is clean. A reload must
 // not leave the caster's already-deleted root with no way to resume cleanup.
 await updatePower(actor,state=>{if(resumable){const active=state.active.find(a=>a.id===id);if(active){active.ending=true;active.active=false;}}else state.active=state.active.filter(a=>a.id!==id);});
 for(const item of itemsOf(actor).filter(i=>i.getFlag?.(ID,'createdPower')?.executionId===id))await item.delete();
 if((actor.system.physical?.objects??[]).some(o=>o.powerExecution===id))await actor.update({'system.physical.objects':actor.system.physical.objects.filter(o=>o.powerExecution!==id)});
 for(const target of worldActorDocuments().filter(a=>a.isOwner)){
  for(const condition of conditionRecords(target,{includeInactive:true}).filter(c=>c.powerSourceExecution===id||receiptBelongsTo(c.powerReceipt,id)))await saveCondition(target,condition,{remove:true});
  const linked=getState(target).active.filter(a=>a.linkedTo===id||a.shadowStrangle?.bindingId===id||a.borrowedMindSensor?.sourceUuid===actor.uuid&&a.borrowedMindSensor.rootId===id);
  for(const c of conditionRecords(target,{includeInactive:true}).filter(c=>linked.some(a=>a.id===c.powerReceipt)))await saveCondition(target,c,{remove:true});
  if(linked.length)await updatePower(target,state=>{
   state.active=state.active.filter(a=>!linked.some(child=>child.id===a.id));
   const objects=target.system.physical?.objects??[];
   if(objects.some(o=>linked.some(child=>child.id===o.powerExecution)))
    return {changes:{'system.physical.objects':objects.filter(o=>!linked.some(child=>child.id===o.powerExecution))}};
  });
  await settleShadowRecovery(target);
 }
 if(record.mentalControl){const {finishMindExecutions}=await import('./action-executions.mjs');
  await finishMindExecutions(actor.uuid,id,record.mentalControl.participants);
 }
 if(resumable)await updatePower(actor,state=>{state.active=state.active.filter(a=>a.id!==id);});
}
export async function settleShadowBinding(actor,id){
 const root=getState(actor).active.find(a=>a.id===id);if(!root?.shadowSource)return;
 const held=worldActorDocuments().flatMap(target=>getState(target).active.filter(a=>a.linkedTo===id&&a.shadowBinding));
 if(held.length&&root.plan?.shadow?.projectileConversionFrom)await endPower(actor,root.plan.shadow.projectileConversionFrom);
 if(!held.length){
  if(root.effect==='kage-mane'&&root.plan.level>=7&&!root.plan.shadow?.preparedFrom){
   await updatePower(actor,state=>{const active=state.active.find(a=>a.id===id);if(active)active.shadowPreparedOffer=true;});
  }else await endPower(actor,id);
 }else await updatePower(actor,state=>{const active=state.active.find(a=>a.id===id);if(active)active.remaining=Math.min(active.remaining,Math.max(...held.map(a=>a.shadowBinding.turns)));});
}
export async function prepareShadowReuse(actor,id){
 owner(actor);const root=getState(actor).active.find(a=>a.id===id);
 if(root?.shadowPrepared)return;
 if(!root?.shadowPreparedOffer||root.effect!=='kage-mane'||root.plan?.level<7||root.plan?.shadow?.preparedFrom)
  throw Error('Somente Mane de nível 7 ou maior que errou permite preparar uma reutilização.');
 if(worldActorDocuments().some(target=>getState(target).active.some(a=>a.linkedTo===id&&a.shadowBinding)))
  throw Error('Esta sombra ainda mantém uma vítima.');
 await updatePower(actor,state=>{const a=state.active.find(a=>a.id===id);if(!a?.shadowPreparedOffer)throw Error('Oferta de sombra preparada indisponível.');
  a.shadowPrepared=true;delete a.shadowPreparedOffer;delete a.remaining;delete a.shadowClockPending;
  a.duration='sustained';a.plan.duration='sustained';delete a.plan.active.remaining;
 });
}
// Básico 4.1.b, pp. 88–89. Stored seals, lasting injuries and permanent
// creations are separate from techniques which the caster keeps active.
export async function reconcileActivePowers(actor,{scene=periodKey(actor,'scene')}={}){
 owner(actor);
 if(game.user.isGM){const {settlePendingMindDamage}=await import('./yamanaka-damage.mjs');await settlePendingMindDamage(actor);}
 if(game.user.isGM){const {reconcileMindTransfer}=await import('./yamanaka-transfer.mjs');await reconcileMindTransfer(actor);}
 for(const linked of getState(actor).active.filter(a=>a.shadowBinding||a.shadowStrangle||a.shadowGuidedLink||a.mentalNetworkLink||a.mentalControlLink||a.linkedTo&&a.plan?.active?.physicalRestraint)){
  const source=worldActorDocuments().find(a=>a.uuid===linked.sourceUuid);
  if(source&&!getState(source).active.some(a=>a.id===linked.linkedTo))await endPower(actor,linked.id);
 }
 const candidates=getState(actor).active.filter(a=>a.sourceUuid===actor.uuid&&!a.linkedTo&&!a.hachimonRecovery&&['shikakyu','baika-ninpou','kagejutsu','hachimon','shindenshin'].includes(a.family??a.plan?.family));
 for(const active of candidates){
  if(active.borrowedMindSensor){
   const binding=mindBinding(actor),source=binding?.source,item=source?.items.get(active.borrowedMindSensor.itemId);
   if(!binding||binding.root.id!==active.borrowedMindSensor.rootId||source.uuid!==active.borrowedMindSensor.sourceUuid||!item||validatePowerPurchase(source,item,context(source)).length||source.getFlag?.(ID,'capabilities')?.suspensions?.[item.id])await endPower(actor,active.id);
   continue;
  }
  const item=findItem(actor,active.itemId),ctx=context(actor);
  const available=!!item&&!validatePowerPurchase(actor,item,ctx).length&&
   !actor.getFlag?.(ID,'capabilities')?.suspensions?.[item.id]&&
   (!active.companionTransform||!!clanCapabilities(actor,ctx).companion);
  if((active.bodyFusion||active.shadowSource||active.plan?.active?.physicalRestraint||active.hachimon||active.mindSensor||active.mentalNetwork||active.mentalControl)&&!available){await endPower(actor,active.id);continue;}
  if(available&&active.sourceSuspended||!available&&!active.sourceSuspended)
   await updatePower(actor,s=>{const record=s.active.find(a=>a.id===active.id);if(!record)return;
    if(available){record.active=true;delete record.sourceSuspended;}
    else{record.active=false;record.sourceSuspended=true;}
   });
 }
 const state=derivedSummary(actor).state;
 const unconscious=state.keys.some(key=>['inconsciente','morto'].includes(key));
 const ended=getState(actor).active.filter(active=>{
  if(active.ending)return true;
  if(active.hachimon)return Number(actor.system.resources.vitality.value)<=0||state.noActions||active.scene!==scene;
  if(active.hachimonRecovery)return active.expiresAt!=null&&active.expiresAt<=Number(game.time?.worldTime??0);
  if(active.shadowSource)return active.scene!==scene||state.noActions;
  if(active.mentalControl&&active.mentalControl.mode!=='disorder')return unconscious;
  if(active.active===false&&!active.sourceSuspended||active.sourceUuid!==actor.uuid||active.linkedTo||active.stored||
    active.periodic?.immediate||active.remaining!=null||active.blackFlames||active.lingering)return false;
  if(!['continuous','sustained','concentration'].includes(active.duration))return false;
  return active.scene!=null&&active.scene!==scene||
   (active.duration==='continuous'?unconscious:state.noActions);
 }).map(active=>active.id);
 for(const id of ended)await endPower(actor,id);
 return ended;
}
export async function maintainPower(actor,id,convertedChakra=0){
 owner(actor);const active=getState(actor).active.find(a=>a.id===id);if(!active)throw Error('Poder em manutenção não encontrado.');const plan=active.plan??{},turn=periodKey(actor,'turn');
 if(!requiresPowerMaintenance(active))throw Error('Esta técnica permanece ativa sem ação de manutenção.');
 if(active.effect==='twin-lions'){
  if(active.createdTurn===turn)throw Error('O chakra da ativação já cobre este turno.');
  if(!findItem(actor,active.itemId)||!clanCapabilities(actor,context(actor)).byakugan)throw Error('A técnica exige a origem e o Byakugan ativos.');
 }
 const action=active.duration==='concentration'?'standard':active.duration==='sustained'?'partial':'free';assertAction(actor,{action,seals:false,maintenance:true});
 await updatePower(actor,state=>{const record=state.active.find(a=>a.id===id);if(!record)throw Error('Poder em manutenção não encontrado.');if(record.lastProcessed?.maintenance===turn)throw Error('A manutenção já foi processada neste turno.');const cost=number(plan.maintenanceCost),payment=corpulenciaPayment(actor,cost,convertedChakra,context(actor));record.lastProcessed??={};record.lastProcessed.maintenance=turn;return {changes:cost?payment:{}};});
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>${esc(active.name)} mantido: ação ${action==='standard'?'padrão':action==='partial'?'parcial':'livre'}${plan.maintenanceCost?' · '+plan.maintenanceCost+' chakra':''}. ${plan.healing!=null?'Cura será processada no fim do turno do paciente.':''}</p>`});
}
async function touchPowerAttack(actor,id){
 const active=getState(actor).active.find(a=>a.id===id);if(!active?.touchDamage)throw Error('Técnica de toque preparada não encontrada.');const item=findItem(actor,active.itemId);if(!item)throw Error('Poder de origem não encontrado.');const plan={...active.plan,damage:active.touchDamage,action:'standard',stat:'cc',cost:0,duration:'instant',seals:false,critical:Math.min(active.critical??15,
  active.plan.family==='raiton'&&aptitudeOwned(itemsOf(actor),'dominio-do-raio','',houseRules())?14:15),ignoreAllBodyHardness:active.ignoreAllBodyHardness??false,ignoreBodyHardness:active.ignoreHardness??0};assertAction(actor,plan);await postPowerRoll(actor,item,plan,{executionId:id});if(active.oneAttack)await endPower(actor,id);
}
export async function releaseStoredSeal(actor,id,convertedChakra=0){
 const active=getState(actor).active.find(a=>a.id===id);if(!active?.stored)throw Error('Conteúdo selado não encontrado.');const stored=active.stored,plan=stored.kind==='advanced'?stored.plan:stored.frame;let cost=stored.kind==='objects'?1:number(stored.cost);const clones=plan?.chargeOnActivation?game.actors.filter(a=>a.getFlag?.(ID,'clone')?.origin===actor.uuid&&a.getFlag(ID,'clone').type==='kage-bunshin'&&!a.getFlag(ID,'clone').dismissed):[];if(plan?.chargeOnActivation){if(number(actor.system.resources.chakra.value)+clones.reduce((s,c)=>s+number(c.system.resources.chakra.value),0)<15)throw Error('Contenção exige 15 chakra, incluindo Kage Bunshins.');for(const clone of clones)owner(clone);cost=Math.max(0,number(actor.system.resources.chakra.value)-1);}
 if(plan?.chargeOnActivation&&convertedChakra)throw Error('Contenção reúne as reservas de chakra dos participantes; não substitui essa reserva por Vitalidade.');
 if(plan)assertAction(actor,{...plan,cost,maintenance:true});
 await updatePower(actor,state=>{const record=state.active.find(a=>a.id===id),payment=corpulenciaPayment(actor,cost,convertedChakra,context(actor));if(record.stored.kind==='objects'&&--record.stored.remaining>0){}else state.active=state.active.filter(a=>a.id!==id);if(plan?.active)state.active.push({...copy(plan.active),id:uuid(),name:plan.name,itemId:active.itemId,sourceUuid:actor.uuid,duration:plan.duration,plan:copy(plan),createdTurn:periodKey(actor,'turn'),lastProcessed:{}});return {changes:plan?.chargeOnActivation?{'system.resources.chakra.value':1}:payment};});
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
 const binding=mindBinding(actor);
 if(binding&&binding.root.mentalControl.mode!=='disorder'&&!key.startsWith('mind-body:'+binding.root.id+':'))return {controlled:true};
 owner(actor);const state=getState(actor);if(state.phases?.includes(key))return {duplicate:true};let ended=[],periodic=[];if(state.phaseWork?.[key])({ended,periodic}=state.phaseWork[key]);
 if(!state.phaseWork?.[key])await updatePower(actor,(s,runtime)=>{
  if(s.phases?.includes(key))return;
  if(s.phaseWork?.[key]){({ended,periodic}=s.phaseWork[key]);return;}
  let cost=0,available=Number(actor.system.resources.chakra.value),vitality=Number(actor.system.resources.vitality.value);
  const turn=periodKey(actor,'turn'),cooldown=runtime.hachimon?.cooldown;
  if(phase==='end'&&cooldown?.remaining>0&&cooldown.closedTurn!==turn)cooldown.remaining--;
  for(const a of s.active){
   if(a.ending){ended.push(a.id);continue;}
   a.lastProcessed??={};
   if(a.hachimon){
    a.clockAt=Number(game.time?.worldTime??0);
    if(phase==='start'&&a.createdTurn!==turn&&a.lastProcessed.hachimonDamageTurn!==turn){
     const damage=gateBenefits(a.hachimon.known,a.hachimon.gate).damagePerTurn;
     vitality-=damage;a.hachimon.damageSuffered+=damage;a.lastProcessed.hachimonDamageTurn=turn;
     if(a.hachimon.reckless){runtime.hachimon.permanentLoss=Number(runtime.hachimon.permanentLoss??0)+damage;runtime.hachimon.treatmentLevel=Math.max(Number(runtime.hachimon.treatmentLevel??0),a.hachimon.gate);}
    }
    if(vitality<=0)ended.push(a.id);
   }
   if(a.shadowRecovery&&!a.shadowRecovery.pending){
    if(phase==='start')a.shadowRecovery.awaitNextStart=false;
    if(phase==='end'&&!a.shadowRecovery.awaitNextStart)ended.push(a.id);
   }
   if(a.mentalStun){a.clockAt=Number(game.time?.worldTime??0);a.clockTurns=1;if(phase==='start')a.awaitNextStart=false;if(phase==='end'&&!a.awaitNextStart)ended.push(a.id);}
   if(a.mindSendFailure&&phase==='start'&&a.createdTurn!==turn)ended.push(a.id);
   if((a.mindSensor||a.mentalNetwork||a.mentalControl?.mode==='disorder')&&phase==='end'&&a.createdTurn!==turn&&a.lastProcessed.maintenance!==turn)ended.push(a.id);
   if(a.shadowSource&&phase==='end'){
    a.shadowClockAt=Math.max(Number(a.shadowClockAt??0),Number(game.time?.worldTime??0));
    const turn=periodKey(actor,'turn');
    if(a.createdTurn!==turn&&a.lastProcessed.maintenance!==turn)ended.push(a.id);
    else for(const target of worldActorDocuments())for(const strangle of getState(target).active.filter(p=>p.linkedTo===a.id&&p.shadowStrangle)){
     if(getState(target).active.some(p=>p.id===strangle.shadowStrangle.bindingId))periodic.push({id:strangle.id,targetUuid:target.uuid,
      damage:strangle.shadowStrangle.damage,name:strangle.name,sourceUuid:actor.uuid});
    }
   }
   if(a.automaticMaintenance&&a.active!==false&&phase==='start'){
    const turn=periodKey(actor,'turn'),charge=Number(a.plan?.maintenanceCost??0);
    if(a.maintenanceFailed)ended.push(a.id);
    else if(a.createdTurn!==turn&&a.lastProcessed.maintenance!==turn){
     if(available<charge||derivedSummary(actor).state.keys.some(k=>['morto','inconsciente'].includes(k))){a.maintenanceFailed=true;ended.push(a.id);}
     else{available-=charge;cost+=charge;a.lastProcessed.maintenance=turn;a.maintenanceAt=Number(game.time?.worldTime??0);}
    }
   }
   if(a.effect==='twin-lions'){
  const turn=periodKey(actor,'turn');
  const missedMaintenance=phase==='end'&&a.createdTurn!==turn&&a.lastProcessed.maintenance!==turn;
  if(missedMaintenance||derivedSummary(actor).state.noActions)ended.push(a.id);
 }if(phase==='end'&&a.burstBodyHardness!=null){a.bodyHardness=a.sustainedBodyHardness??0;delete a.burstBodyHardness;}if(phase==='start'&&a.untilSourceNextStart&&a.createdTurn!==periodKey(actor,'turn'))ended.push(a.id);if(phase==='end'&&a.remaining!=null&&--a.remaining<=0)ended.push(a.id);if(phase==='start'&&a.periodic?.immediate&&a.createdTurn!==periodKey(actor,'turn')){a.starts++;if(a.starts>=2&&a.remainingDamage>0){periodic.push({id:a.id,damage:a.periodic.damage,partnerDivisor:a.plan?.partnerDivisor??1,name:a.name,sourceUuid:a.sourceUuid});if(--a.remainingDamage<=0)ended.push(a.id);}}}s.phaseWork??={};s.phaseWork[key]={ended,periodic};return {changes:{...(cost?corpulenciaPayment(actor,cost,0,context(actor)):{}),...(vitality!==Number(actor.system.resources.vitality.value)?{'system.resources.vitality.value':vitality}:{})}};});
 {const {advanceMindVictim}=await import('./yamanaka-transfer.mjs');await advanceMindVictim(actor,key,phase);}
 for(const p of periodic){
  const target=p.targetUuid?worldActorDocuments().find(a=>a.uuid===p.targetUuid):actor;
  if(target)await applyPhysicalDamage(target,{fixed:p.damage,partnerDivisor:p.partnerDivisor??1,sourceId:`${p.id}:${key}`,reason:p.name,attackerUuid:p.sourceUuid,camouflageContext:{located:true},critical:true,
   ...(p.targetUuid?{ignoreBodyHardness:['all'],ignoreAbsorption:true}:{})});
 }
 if(phase==='end')await advanceShadowVictims(actor,state.active.filter(a=>a.shadowSource).map(a=>a.id),key);
 for(const id of ended)await endPower(actor,id);
 if(phase==='start')for(const flames of getState(actor).active.filter(a=>a.blackFlames&&a.active!==false)){
  await applyPhysicalDamage(actor,{
   fixed:flames.blackFlames,sourceId:flames.id+':'+key,reason:flames.name,
   ignoreBodyHardness:['all'],ignoreAbsorption:true,critical:true,camouflageContext:{located:true}
  });
 }
 if(phase==='end')for(const active of getState(actor).active.filter(a=>a.freedUntilEnd)){for(const c of active.plan.conditions??[])await applyPowerCondition(actor,c,active.plan,active.id,{powerSourceExecution:active.linkedTo});await updatePower(actor,s=>{const a=s.active.find(a=>a.id===active.id);if(a)delete a.freedUntilEnd;});}
 if(phase==='start')for(const active of getState(actor).active.filter(a=>a.areaMembership)){const source=await fromUuid(active.sourceUuid);if(!source)continue;const plan=active.plan;if(active.chakraDrain&&!active.sameSignature&&source.uuid!==actor.uuid){await updatePower(actor,s=>{const receipt=`${active.id}:${key}:drain`;if(!readKeyedRecord(s.receipts,receipt)){s.receipts[recordKey(receipt)]={drained:true};return {changes:{'system.resources.chakra.value':Math.max(1,number(actor.system.resources.chakra.value)-active.chakraDrain)}};}});}if(active.effect==='nuvem'&&source.uuid!==actor.uuid){const r=plan.resistances.find(r=>r.eachStart),result=await rollPowerResistance(actor,'vig',r.difficulty,plan,`${active.id}:${key}`);if(plan.family==='dokujutsu'&&result.success)
  await applyDokujutsuPoison(actor,plan,{sourceId:active.id+':poison',attackerUuid:source.uuid,damage:0,degree:0});
 if(!result.success){if(plan.kikaiDrain)await drainKikaiChakra(actor,active.id+':'+key+':kikai',Math.ceil(plan.kikaiDrain/2));const damage=await applyPhysicalDamage(actor,{fixed:r.damage,sourceId:`${active.id}:${key}:damage`,reason:plan.name,attackerUuid:source.uuid,critical:true,camouflageContext:{located:true}});if(plan.family==='dokujutsu')
  await applyDokujutsuPoison(actor,plan,{sourceId:active.id+':poison',attackerUuid:source.uuid,damage:damage.damage,degree:0});
 await applyPowerCondition(actor,'lento',plan,active.id,{remaining:1,timing:'Início do turno',powerSourceExecution:active.linkedTo});}}if(active.effect==='desastre'&&source.uuid!==actor.uuid){if(active.protectAlly&&source.isOwner&&!active.lingering){const r=await rollPowerResistance(source,'concentracao',9+2*plan.level,plan,`${active.id}:${key}:protect`);if(r.success)continue;}await applyPowerCondition(actor,'lento',plan,active.id,{powerSourceExecution:active.linkedTo});await postPowerRoll(source,findItem(source,active.itemId),{...plan,cost:0},{executionId:active.id,targetUuid:actor.uuid});}}
 if(phase==='end')for(const source of game.actors){for(const a of source.system.powerState?.active??[]){if(a.plan?.healing==null||(a.targetUuid??source.uuid)!==actor.uuid)continue;if(derivedSummary(source).state.noActions)continue;await healPowerTarget(source,a.plan,actor.uuid,`${a.id}:heal:${key}`);}}
 await updatePower(actor,s=>{s.phases=[...(s.phases??[]),key].slice(-100);delete s.phaseWork?.[key];});
 return {ended,periodic};
}
async function advanceShadowVictims(source,roots,key,turns=1){
 for(const target of worldActorDocuments())for(const active of getState(target).active.filter(a=>a.shadowBinding&&a.sourceUuid===source.uuid&&roots.includes(a.linkedTo))){
  const result=await updatePower(target,state=>{
   const record=state.active.find(a=>a.id===active.id);if(!record)return {};
   record.lastProcessed??={};
   record.shadowBinding.processed??=[record.lastProcessed.shadowExpiration].filter(Boolean);
   if(!record.shadowBinding.processed.includes(key)){
    record.shadowBinding.turns-=turns;record.shadowBinding.processed.push(key);record.lastProcessed.shadowExpiration=key;
   }
   return {expired:record.shadowBinding.turns<=0};
  });
  if(result.expired)await endPower(target,active.id);
 }
}
async function applyShadowStrangleClock(actor,rootId,key,turns){
 for(const target of worldActorDocuments())for(const strangle of getState(target).active.filter(a=>a.linkedTo===rootId&&a.shadowStrangle)){
  const binding=getState(target).active.find(a=>a.id===strangle.shadowStrangle.bindingId);if(!binding)continue;
  for(let index=0;index<Math.min(turns,binding.shadowBinding.turns);index++)await applyPhysicalDamage(target,{fixed:strangle.shadowStrangle.damage,
   sourceId:strangle.id+':'+key+':'+index,reason:strangle.name,attackerUuid:actor.uuid,ignoreBodyHardness:['all'],ignoreAbsorption:true,
   camouflageContext:{located:true},critical:true});
 }
}
async function advanceShadowClock(actor){
 const now=Number(game.time?.worldTime??0),ended=[];
 for(const entry of getState(actor).active.filter(a=>a.shadowSource&&!a.shadowPrepared&&!a.shadowGuided&&a.active!==false)){
  while(getState(actor).active.some(a=>a.id===entry.id)){
  const result=await updatePower(actor,state=>{
   const root=state.active.find(a=>a.id===entry.id);if(!root)return {};
   if(root.shadowClockPending)return {pending:root.shadowClockPending,expired:root.remaining<=0};
   const at=Number(root.shadowClockAt??now),elapsed=Math.max(0,Math.floor((now-at)/6));
   if(!elapsed)return {};
   const turns=Math.min(elapsed,Number(root.remaining));
   root.remaining-=turns;root.shadowClockAt=at+turns*6;
   root.shadowClockPending={key:root.id+':clock:'+root.shadowClockAt,turns};
   return {pending:root.shadowClockPending,expired:root.remaining<=0};
  });
  // A failed victim write is retried from the root's persisted operation.
  const pending=result.pending;
  if(!pending)break;
  if(pending){
   await applyShadowStrangleClock(actor,entry.id,pending.key,pending.turns);
   await advanceShadowVictims(actor,[entry.id],pending.key,pending.turns);
   await updatePower(actor,state=>{const root=state.active.find(a=>a.id===entry.id);if(root?.shadowClockPending?.key===pending.key)delete root.shadowClockPending;});
  }
  if(result.expired||getState(actor).active.find(a=>a.id===entry.id)?.remaining<=0){await endPower(actor,entry.id);ended.push(entry.id);break;}
  }
 }
 return ended;
}
export async function advanceAutomaticPowerTime(actor){
 if(game.user.isGM){const {reconcileMindTransfer,advanceMindClock}=await import('./yamanaka-transfer.mjs');await reconcileMindTransfer(actor);await advanceMindClock(actor);}
 const combats=game.combats?.contents??(game.combat?[game.combat]:[]);
 if(combats.some(c=>c.started&&(c.combatants?.contents??c.turns??[]).some(t=>t.actor?.uuid===actor.uuid)))return {combat:true};
 if(actor.getFlag?.(ID,'aptitudes')?.hachimon?.cooldown?.remaining>0)await updatePower(actor,(_state,runtime)=>{
  if(Number(game.time?.worldTime??0)>=runtime.hachimon.cooldown.until)runtime.hachimon.cooldown.remaining=0;
 });
 for(const entry of getState(actor).active.filter(a=>a.ending||a.mentalStun&&Number(game.time?.worldTime??0)-Number(a.clockAt??0)>=6*Number(a.clockTurns??2)||a.hachimonRecovery&&a.expiresAt!=null&&a.expiresAt<=Number(game.time?.worldTime??0)))await endPower(actor,entry.id);
 const shadowEnded=[...await advanceShadowClock(actor),...await advanceHachimonClock(actor)];
 if(!getState(actor).active.some(a=>a.automaticMaintenance&&a.active!==false))return {cost:0,ended:shadowEnded};
 const result=await updatePower(actor,state=>{
  const now=Number(game.time?.worldTime??0),ended=[];let cost=0,available=Number(actor.system.resources.chakra.value);
  if(!Number.isFinite(now))throw Error('Não foi possível conferir o relógio de manutenção.');
  for(const active of state.active.filter(a=>a.automaticMaintenance&&a.active!==false)){
   if(active.maintenanceFailed){ended.push(active.id);continue;}
   if(derivedSummary(actor).state.keys.some(k=>['morto','inconsciente'].includes(k))){active.maintenanceFailed=true;ended.push(active.id);continue;}
   const elapsed=Math.max(0,Math.floor((now-Number(active.maintenanceAt??now))/6)),charge=Number(active.plan?.maintenanceCost??0);
   if(!elapsed||charge<=0)continue;
   const paid=Math.min(elapsed,Math.floor(Math.max(0,available)/charge));cost+=paid*charge;available-=paid*charge;
   active.maintenanceAt+=paid*6;
   if(paid<elapsed){active.maintenanceFailed=true;ended.push(active.id);}
  }
  return {cost,ended,changes:cost?corpulenciaPayment(actor,cost,0,context(actor)):{}};
 });
 for(const id of result.ended)await endPower(actor,id);
 return {...result,ended:[...shadowEnded,...result.ended]};
}
async function advanceHachimonClock(actor){
 const now=Number(game.time?.worldTime??0),ended=[];
 while(true){
  const entry=getState(actor).active.filter(a=>(a.hachimon||a.hachimonRecovery)&&!a.ending&&a.active!==false&&a.remaining>0&&now-Number(a.clockAt??now)>=6)
   .sort((a,b)=>Number(a.clockAt)-Number(b.clockAt))[0];
  if(!entry)break;
  const result=await updatePower(actor,(state,runtime)=>{
   const root=state.active.find(a=>a.id===entry.id);if(!root)return {};
   root.clockAt=Number(root.clockAt??now)+6;root.remaining--;
   let vitality=Number(actor.system.resources.vitality.value);
   if(root.hachimon&&root.remaining>0){
    const damage=gateBenefits(root.hachimon.known,root.hachimon.gate).damagePerTurn;
    vitality-=damage;root.hachimon.damageSuffered+=damage;
    if(root.hachimon.reckless){runtime.hachimon.permanentLoss=Number(runtime.hachimon.permanentLoss??0)+damage;runtime.hachimon.treatmentLevel=Math.max(Number(runtime.hachimon.treatmentLevel??0),root.hachimon.gate);}
   }
   const expired=root.remaining<=0||root.hachimon&&vitality<=0;
   if(expired&&root.hachimon)root.hachimon.closingAt=root.clockAt;
   return {expired,changes:vitality!==Number(actor.system.resources.vitality.value)?{'system.resources.vitality.value':vitality}:{}};
  });
  if(result.expired){await endPower(actor,entry.id);ended.push(entry.id);}
 }
 return ended;
}
// Básico 4.1.b p. 88: damage is a distraction, tested once for each maintained
// concentration. Persist dice before posting so a resumed damage receipt cannot
// heal, charge, reroll or test the same distraction twice.
export async function resolvePowerConcentration(actor,{sourceId,damage,privateRecipients}={}){
 if(!(Number(damage)>0))return [];
 const results=[];
 for(const active of getState(actor).active.filter(a=>a.active!==false&&a.sourceUuid===actor.uuid&&!a.linkedTo&&a.duration==='concentration')){
  if(derivedSummary(actor).state.noActions){await endPower(actor,active.id);results.push({id:active.id,incapacitated:true});continue;}
  const key=String(sourceId)+':concentration:'+active.id;
  let result=readKeyedRecord(getState(actor).receipts,key);
  if(!result){
   const check=statPrecision(actor,'concentracao',{kind:'skill',manualContext:true});
   if(!check.allowed)throw Error(check.reasons.join(' '));
   const level=Number(active.plan?.level??active.level),difficulty=level>0?9+2*level:9+Number(actor.system.campaign.level);
   const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision;
   result={json:JSON.stringify(roll.toJSON()),difficulty,precision:check.precision,natural,success:natural>=15||natural>3&&roll.total>=difficulty};
   await updatePower(actor,state=>{state.receipts[recordKey(key)]=result;});
  }
  const posted=(game.messages.contents??[...game.messages]).some(m=>m.getFlag(ID,'powerConcentrationKey')===key);
  if(!posted)await foundry.dice.Roll.fromJSON(result.json).toMessage({speaker:ChatMessage.getSpeaker({actor}),
   ...(privateRecipients?{whisper:privateRecipients}:{}),flavor:`${esc(active.name)} · Concentração ${result.difficulty}: ${result.success?'mantida':'interrompida'}.`,
   flags:{[ID]:{kind:'power-concentration',powerConcentrationKey:key,actorUuid:actor.uuid,stat:'concentracao',precision:result.precision,natural:result.natural,difficulty:result.difficulty,success:result.success,concealedRoll:!!privateRecipients}}},privateRecipients?{messageMode:'gm'}:{});
  if(!result.success)await endPower(actor,active.id);
  results.push({id:active.id,...result});
 }
 return results;
}
export function powerBonuses(actor){const active=(actor.system?.powerState?.active??[]).filter(a=>a.active!==false),skills={};for(const a of active){for(const[k,v]of Object.entries(a.skillBonus??{}))skills[k]=Math.max(skills[k]??0,number(v));if(a.flightSkill!=null)skills.voo=Math.max(skills.voo??0,number(a.flightSkill));}return {skills,movement:Math.max(0,...active.map(a=>number(a.movementBonus))),bodyHardness:Math.max(0,...active.map(a=>Math.max(number(a.bodyHardness),number(a.burstBodyHardness)))),weapons:active.filter(a=>a.damageAttribute||a.electricMode||a.stoneFist)};}

async function escapePower(actor,id,options={}){
 const active=getState(actor).active.find(a=>a.id===id);if(!active)throw Error('Efeito não encontrado.');const plan=active.plan,r=plan?.resistances?.find(r=>r.escape||r.endsUntil||r.allowsAttackFromInside||r.surface);
 if(active.shadowBinding&&getState(actor).active.some(a=>a.shadowStrangle?.bindingId===id))throw Error('Livre-se primeiro do estrangulamento; depois tente sair da prisão das sombras.');
 if(!r)throw Error('Este efeito não possui uma tentativa de saída nesta ficha.');
 let success=options.withoutTest==='yes'&&r.standardNoTest;
 if(success&&r.cuttingWeaponRequired&&!itemsOf(actor).some(i=>i.type==='equipment'&&!i.system.destroyed&&/Corte/i.test(i.system.damageType??WEAPONS.find(w=>w.key===i.system.catalogKey)?.damageType??'')))throw Error('É necessária uma arma de corte para sair sem teste.');
 const available=Array.isArray(r.stat)?r.stat:[r.stat],stat=available.includes(options.stat)?options.stat:available[0];
 if(!success){const resistingReceipt=active.shadowStrangle?.bindingId??active.id,check=statPrecision(actor,stat,{kind:stat in SKILLS?'skill':'resistance',resistingId:conditionRecords(actor).find(c=>c.powerReceipt===resistingReceipt)?.id??resistingReceipt,manualContext:true,bodyResistance:stat==='vig'});if(!check.allowed)throw Error(check.reasons.join(' '));const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision,difficulty=skillResistanceDifficulty(plan,stat,stat===available[1]&&r.alternateDifficulty!=null?r.alternateDifficulty:r.difficulty);success=natural>=15||natural>3&&roll.total>=difficulty;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`${esc(plan.name)}: tentativa ${success?'bem-sucedida':'falhou'} · dificuldade ${difficulty}.`});}
 if(!success)return;
 if(r.allowsAttackFromInside||r.endsUntil){for(const c of conditionRecords(actor).filter(c=>c.powerReceipt===active.id))await saveCondition(actor,c,{remove:true});await updatePower(actor,s=>{const a=s.active.find(a=>a.id===id);if(r.endsUntil)a.freedUntilEnd=true;else a.freedForScene=true;});}
 else await endPower(actor,id);
}

async function rollFollowup(source,attack,target,key,defenseTotal){
 const prior=readKeyedRecord(getState(target).receipts,key);if(prior)return prior;
 const roll=await new foundry.dice.Roll(`2d8 + (${attack.precision})`).evaluate(),natural=roll.total-attack.precision,result={...powerAttackResult(attack.plan,natural),total:roll.total,hit:natural>=Number(attack.plan.critical??15)||natural>3&&(defenseTotal==null||roll.total>=defenseTotal)};
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:source}),flavor:`${esc(attack.plan.name)} · ataque adicional${defenseTotal==null?' sem defesa rolada':' contra defesa '+defenseTotal}: ${result.hit?'acerto':'falha'}.`});await updatePower(target,s=>{s.receipts[recordKey(key)]=result;});return result;
}
export async function preparePowerDefense(message,targetUuid,options={}){
 const attack=message?.getFlag(ID,'powerAttack');if(!attack)throw Error('Ataque não encontrado.');const target=await fromUuid(targetUuid);owner(target);return preparePowerResistance(attack.plan,target,message.id);
}
export async function preparePowerResistance(plan,target,executionId){
 owner(target);
 const key=`${executionId}:before`,prior=readKeyedRecord(getState(target).receipts,key);if(prior)return prior;
 const outcomes=[];for(let i=0;i<plan.resistances.length;i++){const r=plan.resistances[i];if(!r.beforeDefense)continue;const result=await rollPowerResistance(target,r.stat,r.difficulty,plan,`${key}:${i}`);if(!result.success)for(const c of r.onFail)await applyPowerCondition(target,c,plan,key,{level:r.level,scope:r.scope,remaining:1,timing:'Fim do turno'});outcomes.push(result);}
 await updatePower(target,s=>{s.receipts[recordKey(key)]=outcomes;});return outcomes;
}
