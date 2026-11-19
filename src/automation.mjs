import {clanCapabilities,DOUJUTSU_KEYS,HAKKEN_KEY} from './clan-capabilities.mjs';
import {hachimonProfile,hachimonSuppressesCondition} from './hachimon-rules.mjs';
import {joinedBody} from './body-state.mjs';
import {recordKey,readKeyedRecord} from './core/record-key.mjs';
import {recordMindDamage,settleMindDamage} from './yamanaka-damage.mjs';
import {mindBinding,controlledBodies} from './yamanaka-state.mjs';
import {mindTestOrigin} from './yamanaka.mjs';
import {accelerationProfile} from './acceleration.mjs';
import {worldRules,worldProfile} from './world-settings.mjs';
import {sizeProfile,effectiveAttributes} from './physical-rules.mjs';
import {validateOriginChange} from './restricted-aptitudes.mjs';
import {inventoryBonuses,inventoryConditions,matchesInventoryScope} from './inventory-rules.mjs';
import {advanceAptitudePhase,runtimeBonuses,activeAptitudes,runtimeState,periodKey,mutateRuntime} from './aptitude-runtime.mjs';
import {cloneTestEffect} from './clone-rules.mjs';
import {skillBase,pointBudgets,validateBuildChange,RESTRICTED_SKILLS} from './build-rules.mjs';
import {aptitudeBonuses,aptitudeOwned,aptitudeItems,evolutionStatus,LOTUS_KEY} from './aptitudes.mjs';
import {ID,ATTRIBUTES,COMBAT,SKILLS} from './config.mjs';
import {progression,basicSummary,validateAllocation,levelGrant,creationSystem,spentAttributes,baseMovement,combatTotals} from './progression.mjs';
import {CONDITIONS,conditionKey,conditionHistory,resolveConditions,conditionContext,conditionTurn,lethalDamage} from './conditions.mjs';
const clone=value=>foundry.utils.deepClone(value);
const own=actor=>{if(!actor?.isOwner)throw Error('Você não possui permissão para alterar este personagem.');};
const gm=()=>{if(!game.user.isGM)throw Error('Somente o mestre concede NC e EXP.');};
export function houseRules(){return {advancement:'level',powerRate:2,...worldRules()};}
function corpulenciaVitality(clan,system) {
  return clan.corpulenciaId?3*Number(system.attributes?.vig??0):0;
}
export function clampResourceChanges(actor,change={}) {
  const s=actor.toObject().system,candidate={...s,campaign:{...s.campaign,...change.campaign},attributes:{...s.attributes,...change.attributes},automation:{...s.automation,...change.automation},physical:{...s.physical,...change.physical}};
  const base=actor.type==='character'&&candidate.automation?.enabled?basicSummary(candidate):null,result=[];
  const clan=base?clanCapabilities(actor,{books:worldProfile()?.books,rules:houseRules()}):{};
  for(const [key,label]of [['vitality','Vitalidade'],['chakra','Chakra']]) {
    const value=change.resources?.[key]?.value,originalMax=(key==='vitality'&&base?base.vitality+corpulenciaVitality(clan,candidate)+3*(sizeProfile(candidate).temporary?0:sizeProfile(candidate).attribute):base?.[key])??change.resources?.[key]?.max??s.resources?.[key]?.max,
     loss=key==='vitality'?Math.max(0,Number(runtimeState(actor).hachimon?.permanentLoss??0)):0,max=originalMax==null?originalMax:Math.max(0,Number(originalMax)-loss);
    if(value!==null&&value!==undefined&&Number.isFinite(Number(value))&&max!==null&&max!==undefined&&Number.isFinite(Number(max))&&Number(value)>Number(max))result.push({key,value:Number(max),max:Number(max),label});
  }
  const currentVitality=s.resources?.vitality?.value;
  const proposedVitality=change.resources?.vitality?.value;
  if(currentVitality===0&&Number(proposedVitality)>0&&(runtimeState(actor).rinkaInfections??[]).some(record=>!record.treated)){
    return [...result.filter(cap=>cap.key!=='vitality'),{key:'vitality',value:0,max:0,label:'Vitalidade'}];
  }
  return result;
}
export function restRecovery(actor) {
  const d=derivedSummary(actor),s=actor.system,vit=s.resources.vitality.value,chakra=s.resources.chakra.value;
  if(d.state.keys.includes('morto'))throw Error('Recuperação comum não ressuscita.');
  if([vit,chakra,d.vitality,d.chakra,s.attributes.vig,s.attributes.esp].some(n=>n===null||n===undefined||!Number.isFinite(Number(n))))throw Error('Preencha vida, chakra, máximos, Vigor e Espírito antes de descansar.');
  const multiplier=aptitudeBonuses(s,[...(actor.items??[])],houseRules()).restMultiplier;
  const vr=(10+2*effectiveAttributes(s,{permanentOnly:true}).vig)*multiplier,cr=(5+2*s.attributes.esp)*multiplier;
  const kageActive=(game.actors?.contents??[]).some(c=>{const m=c.getFlag?.(ID,'clone');return m?.origin===actor.uuid&&m.type==='kage-bunshin'&&!m.dismissed;});
  const sealedChakra=runtimeState(actor).sealedChakra??0;
  const vitality=vit===0&&(runtimeState(actor).rinkaInfections??[]).some(r=>!r.treated)?0:Math.min(Math.max(0,d.vitality-Number(runtimeState(actor).hachimon?.permanentLoss??0)),vit+vr);
  const energy=Math.min(d.chakra,chakra+(kageActive?0:cr)+sealedChakra);
  return {vitality,chakra:energy,vitalityGain:Math.max(0,vitality-vit),chakraGain:Math.max(0,energy-chakra),vitalityRecovery:vr,chakraRecovery:cr,chakraBlocked:kageActive,sealedChakra};
}
export async function toggleCondition(actor,key,id) {
  own(actor);const records=conditionRecords(actor,{includeInactive:true}),matches=records.filter(r=>key?r.key===key:r.id===id),active=matches.some(r=>!r.disabled);
  if(!matches.length){if(derivedSummary(actor).state.keys.includes(key))throw Error('Esta condição é automática. Altere a causa para desativá-la.');await saveCondition(actor,{key,name:CONDITIONS[key]?.name});return;}
  for(const r of matches){if(r.effect)await actor.effects.get(r.id).update({disabled:active});else await actor.update({'system.conditions':actor.system.conditions.map(c=>c.id===r.id?{...c,disabled:active}:c)});}
}
export function conditionRecords(actor,{includeAutomatic=false,includeInactive=false,skipMindReflection=false,forMindReflection=false}={}) {
  const records=(actor.system?.conditions??[]).map(r=>({...r,key:conditionKey(r),legacy:true}));
  const scene=periodKey(actor,'scene');
  for(const c of inventoryConditions(actor,{now:Number(game.time?.worldTime??0),scene}).filter(c=>!c.reflectionOnly||forMindReflection))records.push({...c,name:CONDITIONS[c.key]?.name??c.name,automatic:true});
  for(const effect of actor.effects??[]) {
    if(!includeInactive&&(effect.disabled||effect.isSuppressed))continue;
    if(effect.flags?.[ID]?.automaticStatus)continue;
    const saved=effect.flags?.[ID]?.condition;
    const expired=saved?.expiresScene!=null&&saved.expiresScene!==scene||saved?.expiresAt!=null&&saved.expiresAt<=Number(game.time?.worldTime??0);
    if(expired&&!includeInactive)continue;
    const key=saved?.key??[...(effect.statuses??[])].find(s=>s.startsWith('sns-'))?.slice(4);
    if(key&&CONDITIONS[key])records.push({key,level:1,timing:'Início do turno',...saved,id:effect.id,name:CONDITIONS[key].name,source:saved?.source||CONDITIONS[key].source,effect:true,disabled:expired||effect.disabled||effect.isSuppressed});
  }
  const runtime=runtimeState(actor);
  if(activeAptitudes(actor).shunjutsu&&Number(aptitudeOwned([...(actor.items??[])],'shunjutsu','',houseRules())?.system.level)>=3&&
    runtime.lastMovement?.turn===periodKey(actor,'turn'))records.push({id:'shunjutsu-acceleration',key:'acelerado',name:'Acelerado',source:'Shunjutsu',automatic:true});
  const infections=(runtime.rinkaInfections??[]).filter(record=>!record.treated);
  const fatigueSources=new Set();
  for(const record of infections){
    const source='Rinkaichuu · Livro Básico p. 147';
    if(record.shock>0)records.push({id:'rinka-shock-'+record.id,key:'atordoado',name:'Atordoado',source,automatic:true});
    if(record.failed&&!fatigueSources.has(record.sourceUuid)){
      fatigueSources.add(record.sourceUuid);
      records.push({id:'rinka-fatigue-'+record.id,key:'fatigado',name:'Fatigado',level:1,source,automatic:true});
    }
  }
  if(infections.length&&actor.system.resources?.vitality?.value===0)records.push({id:'rinka-paralysis',key:'paralisado',name:'Paralisado',source:'Destruição celular · Rinkaichuu',automatic:true});
  const vision=runtime.mangekyouVision;
  if(vision?.exhaustions>=2)records.push({id:'mangekyou-blindness',key:'cego',name:'Cego',source:'Mangekyou Sharingan · Básico p. 184',automatic:true});
  if(vision?.shockTurn&&vision.shockTurn===periodKey(actor,'turn')){
    for(const key of ['atordoado','desprevenido'])records.push({id:'mangekyou-'+key,key,name:CONDITIONS[key].name,source:'Exaustão da visão · Básico p. 184',automatic:true});
  }
  for(const p of actor.system?.powerState?.active??[])if(p.mentalStun&&p.active!==false)records.push({id:'mental-stun-'+p.id,key:'atordoado',name:'Atordoado',source:'Resistência à natureza · Yamanaka · até o fim do próximo turno',automatic:true});
  for(const p of actor.system?.powerState?.active??[])if(p.active!==false&&!p.ending){
    if(p.mentalControl?.mode!=='disorder'&&p.mentalControl?.assumed)records.push({id:'mental-body-'+p.id,key:'indefeso',name:'Indefeso',source:'Corpo original · Troca de Mente',automatic:true,mentalBody:true});
    if(p.mindSendFailure)records.push({id:'mind-send-'+p.id,key:'inconsciente',name:'Inconsciente',source:'Envio da mente evitado · até o próximo turno',automatic:true});
  }
  if(!skipMindReflection)for(const root of actor.system?.powerState?.active??[])if(root.active!==false&&!root.ending&&root.plan?.mindControl?.reflectedDamage&&root.mentalControl?.assumed){
    for(const body of controlledBodies(actor,root.id))for(const condition of conditionRecords(body,{includeAutomatic:true,skipMindReflection:true,forMindReflection:true}))
      if(condition.mindInternal===true&&!['agarrado','estavel'].includes(condition.key))records.push({...condition,
        id:'mind-reflected-'+body.id+'-'+condition.id,source:'Troca de Mente · '+body.name,automatic:true,mindReflected:true,mentalBody:false});
  }
  for(const p of actor.system?.powerState?.active??[])if(p.alado)records.push({id:'flight-'+p.id,key:'alado',name:'Alado',source:p.name,automatic:true});
  if(includeAutomatic)records.push(...derivedSummary(actor,records).state.automatic);
  for(const record of records)if(hachimonSuppressesCondition(actor.system,record.key))record.disabled=true;
  return includeInactive?records:records.filter(r=>!r.disabled);
}
export async function expireSceneConditions(actor){
 const scene=periodKey(actor,'scene');
 const ids=[...(actor.effects??[])].filter(effect=>{
  const expiresScene=effect.flags?.[ID]?.condition?.expiresScene;
  return expiresScene!=null&&expiresScene!==scene;
 }).map(effect=>effect.id);
 if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);
}

export function derivedSummary(actor,records=conditionRecords(actor)) {
  const s=actor.system,automatic=actor.type==='character'&&s.automation?.enabled;
  const draftCharacter=actor.type==='character'&&s.campaign?.draft;
  const automaticMovement=automatic||draftCharacter;
  let base=null,error='';try{if(automatic)base=basicSummary(s);}catch(e){error=e.message;}
  const bonus=aptitudeBonuses(s,[...(actor.items??[])],houseRules()),runtime=runtimeBonuses(actor);
  const combat={...(base?.combat??(draftCharacter?combatTotals(s.attributes,s.automation?.bases):null)??Object.fromEntries(Object.keys(COMBAT).map(k=>[k,s.combat?.[k]??0])))};
  const clan=clanCapabilities(actor,{books:worldProfile()?.books,rules:houseRules()});
  const acceleration=accelerationProfile(records,{corpulencia:!!clan.corpulenciaId});
  combat.esq+=bonus.esq+runtime.dodge-(clan.resiliencia?.penalties?3:0);combat.lm+=Math.max(bonus.lm,clan.intuition);
  const size=sizeProfile(s),effective=effectiveAttributes(s),vitality=base?base.vitality+corpulenciaVitality(clan,s)+3*(size.temporary?0:size.attribute):s.resources?.vitality?.max,chakra=base?.chakra??s.resources?.chakra?.max;
  const cloneMeta=actor.getFlag?.(ID,'clone');
  const gates=hachimonProfile(s),calorieStrength=gates?0:2*Number(clan.calorie?.level??0);
  effective.for=Number(effective.for??0)+calorieStrength;
  const resources={vitality:s.resources?.vitality?.value??null,chakra:s.resources?.chakra?.value??null,chakraMax:chakra??0,forcedDrain:s.automation?.forcedDrain,puppet:actor.type==='puppet',hasChakraReserve:!(cloneMeta&&chakra===0),fatigueImmune:!!gates?.immuneFatigue};
  const shunjutsu=activeAptitudes(actor).shunjutsu;
  const chouLevel=Math.max(0,...[...(actor.items??[])].filter(i=>i.type==='power'&&i.system?.powerData?.family==='baika-ninpou').map(i=>Number(i.system.level)));
  const chouMovement=clan.chou&&!(s.powerState?.active??[]).some(a=>a.effect==='baika'&&a.active!==false)?2*chouLevel:0;
  const movementAttribute=Math.max(shunjutsu?Number(s.attributes?.esp??0):0,(Number(s.attributes?.agi??0)+Number(gates?.agility??0))*acceleration.movementMultiplier,chouMovement);
  const state=resolveConditions(records,resources),inventory=inventoryBonuses(actor,{now:Number(game.time?.worldTime??0),scene:periodKey(actor,'scene')},houseRules()),powerMove=Math.max(0,...(s.powerState?.active??[]).filter(e=>e.active!==false).map(e=>Number(e.movementBonus??0))),unloadedMovement=((inventory.armor.heavy||bonus.movement==null?null:shunjutsu||chouMovement||acceleration.rank?10+movementAttribute:bonus.movement)??(automaticMovement||shunjutsu?baseMovement(movementAttribute):null)??actor._source?.system?.movement?.distance??s.movement?.distance??0)+runtime.movement+powerMove,loadedMovement=inventory.movementPenalty?Math.min(unloadedMovement,Math.max(10,unloadedMovement-inventory.movementPenalty)):unloadedMovement,powerMultiplier=Math.min(1,...(s.powerState?.active??[]).filter(e=>e.active!==false&&e.movementMultiplier!=null&&
    (e.effect!=='dominio-do-vento'||!e.linkedTo||typeof globalThis.fromUuidSync!=='function'||
     globalThis.fromUuidSync(e.sourceUuid)?.system.powerState?.active?.some(source=>source.id===e.linkedTo&&source.active!==false))).map(e=>Number(e.movementMultiplier))),normalMovement=Math.ceil(Math.max(1,loadedMovement+size.movement-(clan.resiliencia?.penalties?5:0))*powerMultiplier);
  if((s.powerState?.active??[]).some(p=>p.active!==false&&(p.shadowSource&&p.requiresImmobile||p.shadowPullVictim))){
    state.immobile=true;state.noRun=true;state.stationaryPower=true;
  }
  const dodgeBonus=state.immobile||state.keys.includes('desprevenido')?0:bonus.esq+runtime.dodge;combat.esq+=dodgeBonus-bonus.esq-runtime.dodge;
  return {automatic,automaticMovement,base,combat,dodgeBonus,clan,acceleration,vitality,healingCeiling:Math.max(0,Number(vitality??0)-Number(runtimeState(actor).hachimon?.permanentLoss??0)),chakra,resources,state,size,effective,inventory,normalMovement,movement:state.immobile?0:state.slow?Math.ceil(normalMovement/2):normalMovement,error};
}
export function mentalControllerSummary(actor){return derivedSummary(actor,conditionRecords(actor).filter(c=>!c.mentalBody));}
export function applyDerived(actor) {
  const d=derivedSummary(actor);if(d.automaticMovement)Object.assign(actor.system.combat,d.combat);if(d.base){actor.system.resources.vitality.max=d.vitality;actor.system.resources.chakra.max=d.chakra;actor.system.advancement.attributesSpent=d.base.attributeSpent;actor.system.advancement.attributesAvailable=d.base.attributeGranted-d.base.attributeSpent;}
  if(d.automaticMovement||d.state.slow||d.state.immobile)actor.system.movement.distance=d.movement;
  actor._snsSummary=d;
}
export function getActorView(actor) {
  const d=actor.toObject();d.id=actor.id;d.uuid=actor.uuid;d.items=actor.items?.map(i=>({...i.toObject(),id:i.id}))??[];
  const lotus=aptitudeItems([...(actor.items??[])],houseRules()).filter(i=>i.lotusSource);
  for(const source of d.items.filter(i=>i.system?.catalogKey===LOTUS_KEY))
   source.lotusGrants=lotus.filter(i=>i.lotusSource===source.id).map(({parent,...grant})=>grant);
  for(const i of d.items)if(i.type==='aptitude'&&i.system.catalogKey)i.evolution=evolutionStatus(i,d.system,d.items,houseRules());
  const derived=derivedSummary(actor);d.companion=actor.getFlag?.(ID,'companion');d.system.conditions=conditionRecords(actor,{includeAutomatic:true});
  d.system.combat=derived.combat;d.clone=actor.getFlag?.(ID,'clone');if(d.clone){d.clone={...d.clone};const active=(game.actors?.contents??[]).filter(c=>c.getFlag?.(ID,'clone')?.origin===d.clone.origin&&!c.getFlag(ID,'clone').dismissed).length||1;d.clone.automaticCombatFailure=cloneTestEffect(d.clone,'cc',{activeCount:active}).automaticFailure;d.clone.version=active>2?2:1;}d.clones=(game.actors?.contents??[]).filter(c=>c.getFlag?.(ID,'clone')?.origin===actor.uuid&&!c.getFlag(ID,'clone').dismissed).map(c=>({uuid:c.uuid,name:c.name,version:c.getFlag(ID,'clone').version}));
  if(derived.base){d.system.combat=derived.combat;d.system.resources.vitality.max=derived.vitality;d.system.resources.chakra.max=derived.chakra;d.system.advancement.attributesSpent=derived.base.attributeSpent;d.system.advancement.attributesAvailable=derived.base.attributeGranted-derived.base.attributeSpent;}
  d.system.skills??={};
  for(const key of Object.keys(SKILLS)){
    const {precision:value}=statPrecision(actor,key,{kind:'skill',manualContext:true,preview:true});
    d.system.skills[key]={...d.system.skills[key],value};
  }
  d.system.movement.distance=derived.movement;d.summary=derived;d.aptitudeStates=activeAptitudes(actor);d.mirages=Object.entries(runtimeState(actor).mirages??{}).filter(([,entry])=>entry.scene===periodKey(actor,'scene'));const water=runtimeState(actor).water;d.aptitudeWater=water?.stamp===periodKey(actor,'scene')?Number(water.value??0):0;d.conditionControls=conditionRecords(actor,{includeInactive:true});d.rinkaSources=[...new Set((runtimeState(actor).rinkaInfections??[]).filter(r=>!r.treated).map(r=>r.sourceUuid))];return d;
}
export function allocationProposal(actor,values={}) {
  const source=actor.toObject().system,current=Number(source.campaign?.level??4),nc=Number(values.nc??current),p=progression(nc),initial=!source.automation?.enabled||source.campaign?.draft;
  const granted=initial?p.attributes:levelGrant(source,nc,houseRules().advancement);
  return {source,nc,current,initial,granted,attributes:values.attributes??Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,source.attributes?.[k]??p.min])),bases:values.bases??source.automation?.bases??{cc:3,cd:3,esq:3,lm:3}};
}
export async function saveAllocation(actor,values,{initializeResources=false,keepDraft=false}={}) {
  own(actor);const proposal=allocationProposal(actor,values),{nc,current,initial,source,granted,attributes,bases}=proposal;
  if(!initial)gm();
  if(!initial&&Object.keys(COMBAT).some(k=>Number(bases[k])!==Number(source.automation.bases[k])))throw Error('As bases de combate só podem ser distribuídas na criação da ficha.');
  const check=validateAllocation({nc,attributes,granted,previous:initial?null:source.attributes,creation:initial&&!keepDraft,bases});if(!check.valid)throw Error(check.errors.join(' '));
  if(initial&&nc!==current){
    const rules=houseRules(),items=[...(actor.items??[])];
    const next={...source,campaign:{...source.campaign,level:nc}};
    const budgets=pointBudgets(next,items,rules);
    const errors=validateBuildChange(next,{skills:source.skills,social:source.social},items,rules);
    if(budgets.powers.remaining<0)errors.push('Os poderes e aptidões excedem os pontos disponíveis nesse NC.');
    if(errors.length)throw Error(errors.join(' '));
  }
  if(keepDraft){
    if(!source.campaign?.draft)throw Error('Somente uma ficha em criação pode salvar distribuição parcial.');
    await actor.update({'system.campaign.level':nc,'system.attributes':attributes,'system.automation.bases':bases},{snsAllocation:true});
    return;
  }
  const history=[...(source.automation?.history??[]),{at:new Date().toISOString(),user:game.user.id,from:current,to:nc,granted,spent:spentAttributes(attributes),attributes:clone(attributes),mode:houseRules().advancement}];
  const update={'system.campaign.level':nc,'system.campaign.draft':false,'system.attributes':attributes,'system.automation.enabled':true,'system.automation.attributeGranted':granted,'system.automation.bases':bases,'system.automation.history':history};
  if(initializeResources){const d=basicSummary({...source,campaign:{...source.campaign,level:nc},attributes,automation:{...source.automation,bases}});if(source.resources.vitality.value===null)update['system.resources.vitality.value']=d.vitality+corpulenciaVitality(clanCapabilities(actor,{books:worldProfile()?.books,rules:houseRules()}),{attributes});if(source.resources.chakra.value===null)update['system.resources.chakra.value']=d.chakra;}
  await actor.update(update,{snsAllocation:true});
}
export async function grantAttributeXP(actor,value) {
  gm();own(actor);if(houseRules().advancement!=='xp')throw Error('Ative o modo EXP nas regras da casa.');
  value=Number(value);if(!Number.isFinite(value)||value<=0)throw Error('A EXP deve ser um número positivo; valores decimais são permitidos.');
  const source=actor.toObject().system,granted=Number(source.automation.attributeGranted)+value;
  const history=[...(source.automation.history??[]),{at:new Date().toISOString(),user:game.user.id,xp:value,mode:'xp'}];
  await actor.update({'system.automation.attributeGranted':granted,'system.automation.history':history},{snsAllocation:true});
}
export async function saveCondition(actor,values,{remove=false}={}) {
  own(actor);const key=conditionKey(values),legacy=(actor.system.conditions??[]).find(r=>r.id===values.id),effect=actor.effects?.get(values.id);
  if(values.automatic)throw Error('Esta condição é consequência de outro estado. Altere a causa para removê-la.');
  if(remove){
    const hypnotic=effect?.flags?.[ID]?.condition;
    if(hypnotic?.hypnotic&&hypnotic.expiresScene===periodKey(actor,'scene'))
      await mutateRuntime(actor,state=>{state.hypnoticImmunity={scene:periodKey(actor,'scene'),turn:periodKey(actor,'turn')};});
    if(effect)await effect.delete();else if(legacy)await actor.update({'system.conditions':actor.system.conditions.filter(r=>r.id!==values.id)});return;}
  if(key==='desprevenido'&&values.cause==='surprise'&&derivedSummary(actor).clan.kagura)
   throw Error('Kagura Shingan protege este personagem contra surpresa.');
  if(!key){const list=clone(actor.system.conditions??[]),index=list.findIndex(r=>r.id===values.id),record={...values,id:values.id||foundry.utils.randomID()};if(index<0)list.push(record);else list[index]=record;return actor.update({'system.conditions':list});}
  const record={...values,key,name:CONDITIONS[key].name,level:Math.max(1,Math.trunc(Number(values.level)||1)),remaining:values.remaining===''||values.remaining===undefined?null:values.remaining,difficulty:values.difficulty===''||values.difficulty===undefined?null:values.difficulty,damage:values.damage===''||values.damage===undefined?null:values.damage};
  if(record.remaining!==null&&(!Number.isInteger(record.remaining)||record.remaining<1))throw Error('A contagem de duração deve ser um inteiro positivo.');
  if(record.evolvedFrom!==undefined)record.previousStages=conditionHistory(record.evolvedFrom,key);
  delete record.id;delete record.effect;delete record.legacy;
  const data={name:CONDITIONS[key].name,img:CONDITIONS[key].icon,disabled:false,statuses:[`sns-${key}`],flags:{[ID]:{condition:record}}};
  if(effect)await effect.update(data);else await actor.createEmbeddedDocuments('ActiveEffect',[data]);
  if(legacy)await actor.update({'system.conditions':actor.system.conditions.filter(r=>r.id!==values.id)});
}
export function statPrecision(actor,stat,context={}) {
  const binding=!context.originalMind&&mindBinding(actor);
  if(binding&&mindTestOrigin(stat,{mode:binding.root.mentalControl.mode,social:context.social===true})==='mind')
    return {...statPrecision(binding.source,stat,{...context,originalMind:true,mentalController:true}),mindSource:binding.source.uuid};
  const summary=context.mentalController?mentalControllerSummary(actor):derivedSummary(actor),s=actor.system;let precision=0;
  if(stat in ATTRIBUTES)precision=Number(summary.effective[stat]??0);
  else if(stat in COMBAT)precision=summary.combat[stat];
  else if(stat in SKILLS){const skill=s.skills[stat]??{},points=Number(skill.points??0);precision=s.automation?.enabled||actor.type==='character'&&s.campaign?.draft?skillBase(s,stat):Number(skill.value??skillBase(s,stat));if(['lidar','mecanismos','medicina','ocultismo','veneficio'].includes(stat)&&points<1&&!context.preview)throw Error(`${SKILLS[stat][0]} exige ao menos 1 ponto investido para este uso (Básico p. 36).`);}
  else throw Error('Característica desconhecida.');
  if(stat==='agi'&&context.feint&&summary.clan.chou&&!(s.powerState?.active??[]).some(a=>a.effect==='baika'&&a.active!==false))precision=Math.max(precision,2*Math.max(0,...[...(actor.items??[])].filter(i=>i.type==='power'&&i.system?.powerData?.family==='baika-ninpou').map(i=>Number(i.system.level))));
  if(stat==='vig'&&summary.clan.corpulenciaId)precision+=2;
  if(summary.clan.resiliencia?.penalties&&['agi','acrobacia','furtividade'].includes(stat))precision-=3;
  if(stat==='voo')precision=Math.max(precision,...(s.powerState?.active??[]).filter(e=>e.active!==false).map(e=>Number(e.flightSkill??0)));
  if(stat in SKILLS){if(SKILLS[stat][1]==='for'||SKILLS[stat][1]==='vig')precision+=Math.ceil(Number(effectiveAttributes(s)[SKILLS[stat][1]]??0)/2)-Math.ceil(Number(s.attributes[SKILLS[stat][1]]??0)/2);if(stat==='furtividade')precision+=sizeProfile(s).stealth;precision+=Math.max(0,...(s.powerState?.active??[]).filter(e=>e.active!==false).map(e=>Number(e.skillBonus?.[stat]??0)));precision+=aptitudeBonuses(s,[...(actor.items??[])],houseRules()).skills[stat]??0;if(stat==="veneficio"&&!context.preview&&!aptitudeOwned([...(actor.items??[])],"quimico"))throw Error("Venefício exige a aptidão Químico.");}
  const clan=context.flankingAttacker||context.resistingFeint||context.ocularGenjutsu
    ?clanCapabilities(actor,{books:worldProfile()?.books,rules:houseRules()}):null;
  const flankingAttacker=context.flankingAttacker&&!clan?.byakugan&&!clan?.nidan;
  if(clan?.nidan&&stat==='prontidao'&&context.resistingFeint)precision+=2;
  if(clan?.nidan&&context.kind==='resistance'&&context.ocularGenjutsu)precision+=2;
  const effect=conditionContext(conditionRecords(actor).filter(c=>(!context.mentalController||!c.mentalBody)&&(!c.mindReflected||!c.inventoryScope||!['resistance','social-resistance'].includes(context.kind)&&!context.bodyResistance&&!context.poisonResistance&&matchesInventoryScope(c.inventoryScope,{...context,stat}))),{...context,flankingAttacker,stat},summary.resources);
  const runtime=runtimeBonuses(actor,{...context,stat});if(context.kind==='attack')precision+=runtime.attack;else if(context.kind==='defense'&&!context.riskDodge&&!(stat==='esq'&&effect.loseDodgeBonus))precision+=runtime.defense;effect.penalty=Math.max(-3,effect.penalty+(context.kind==='attack'?runtime.attackPenalty:0));
  const inv=inventoryBonuses(actor,{...context,stat,now:Number(game.time?.worldTime??0),scene:periodKey(actor,'scene')},houseRules());effect.penalty=Math.max(-3,effect.penalty+inv.conditionPenalty);const visualWear=context.kind==='attack'||context.vision!==false&&['attribute','skill'].includes(context.kind)?runtimeState(actor).mangekyouVision?.wear??0:0;
  effect.uncappedPenalty=inv.penalty-visualWear-(context.kind==='defense'?runtime.defensePenalty:0);
  effect.penalty+=effect.uncappedPenalty;
  effect.inventory=inv;
  if(stat==='esq'&&effect.loseDodgeBonus)precision-=summary.dodgeBonus;
  else if(stat==='esq'&&context.riskDodge){
    // Guia Avançado p. 26. Dos bônus de Esquiva, mantém apenas Reflexos.
    const reflex=aptitudeOwned([...(actor.items??[])],'reflexos','',houseRules())?1:0;
    precision+=reflex-summary.dodgeBonus;
    effect.bonus=0;
  }
  const meta=actor.getFlag?.(ID,'clone');if(meta){const count=(game.actors?.contents??[]).filter(c=>c.getFlag?.(ID,'clone')?.origin===meta.origin&&!c.getFlag(ID,'clone').dismissed).length||1,ce=cloneTestEffect(meta,stat,{activeCount:count,kind:context.kind});effect.uncappedPenalty=(effect.uncappedPenalty??0)+ce.penalty;effect.penalty+=ce.penalty;if(ce.automaticFailure||!ce.allowed){effect.allowed=false;effect.reasons.push(ce.automaticFailure?'Há mais de dois clones ativos: todos falham automaticamente em testes de combate.':'Este clone foi desfeito.');}}
  const companion=actor.getFlag?.(ID,'companion');
  if(context.run&&summary.state.stationaryPower){effect.allowed=false;effect.reasons.push('Encerre a prisão das sombras antes de correr.');}
  const continuation=(s.powerState?.active??[]).find(p=>p.id===context.powerExecutionId)?.plan?.shadow?.projectileConversionFrom;
  if(context.kind==='attack'&&(s.powerState?.active??[]).some(p=>p.active!==false&&p.duration==='concentration'&&p.id!==context.powerExecutionId&&!(p.id===continuation&&p.shadowSource&&p.effect==='kage-shuriken'))){
    effect.allowed=false;effect.reasons.push('Concentração impede atacar enquanto o poder for mantido.');
  }
  if(actor.system.powerState?.active?.some(p=>p.bodyFusion&&p.active!==false&&!p.fusionReady)){effect.allowed=false;effect.reasons.push('Conclua ou encerre a união em andamento antes de agir.');}
  if(joinedBody(actor)){effect.allowed=false;effect.reasons.push('Este participante integra o corpo unido. Use a ficha do Inuzuka.');}
  if(companion?.suspended||companion?.retired||companion?.capanga&&stat in COMBAT){effect.allowed=false;effect.reasons.push(companion?.suspended||companion?.retired?'O vínculo do companheiro está indisponível.':'Integrantes extras da matilha falham automaticamente em testes de combate.');}
  return {base:precision,precision:precision+effect.penalty+effect.bonus,...effect};
}
export async function breakFascinarOnDamage(actor){
 for(const record of conditionRecords(actor).filter(record=>record.fascinarRequest))
  await saveCondition(actor,record,{remove:true});
}
export async function damageActor(actor,amount,{reason='Dano',sourceId=foundry.utils.randomID(),reflection=false,fatal=false}={}) {
  own(actor);amount=Number(amount);sourceId=String(sourceId);
  if(!Number.isFinite(amount)||amount<0)throw Error('Dano deve ser um número não negativo.');
  if((reflection||fatal)&&!game.user.isGM)throw Error('O mestre coordena o dano mental refletido.');
  const result=await mutateRuntime(actor,state=>{
    state.directDamageReceipts??={};const key=recordKey(sourceId),prior=readKeyedRecord(state.directDamageReceipts,sourceId);
    if(prior)return prior;
    const value=fatal?Math.min(-21,Number(actor.system.resources.vitality.value)):lethalDamage(actor.system.resources.vitality.value,amount);
    if(value===null)throw Error('Preencha a vitalidade atual antes de processar dano.');
    const receipt={value,reason,amount,complete:false};state.directDamageReceipts[key]=receipt;
    if(!reflection)recordMindDamage(state,actor,sourceId,amount,{after:value});
    return {...receipt,changes:{'system.resources.vitality.value':value}};
  });
  if(result.complete)return {value:result.value,reason:result.reason,amount:result.amount};
  if(!reflection)await settleMindDamage(actor,sourceId);
  if(amount>0)await breakFascinarOnDamage(actor);
  const stable=conditionRecords(actor).filter(r=>r.key==='estavel'&&!r.automatic);for(const r of stable)await saveCondition(actor,r,{remove:true});
  await mutateRuntime(actor,state=>{readKeyedRecord(state.directDamageReceipts,sourceId).complete=true;});
  return {value:result.value,reason:result.reason,amount:result.amount};
}
const processing=new Map();
async function completePendingPhase(actor,pending) {
  const records=conditionRecords(actor,{includeAutomatic:true}),result=pending.result;
  await settleMindDamage(actor,'condition-phase:'+pending.key);
  if(result.damage)for(const r of records.filter(r=>r.key==='estavel'&&!r.automatic))await saveCondition(actor,r,{remove:true});
  for(const u of result.updates){const r=records.find(r=>r.id===u.id);if(r&&!r.automatic&&!result.expired.includes(r.id))await saveCondition(actor,{...r,...u});}
  for(const id of result.expired){const r=records.find(r=>r.id===id);if(r&&!r.automatic)await saveCondition(actor,r,{remove:true});}
  if(result.damage||result.prompts.some(prompt=>prompt.key==='rinka-damage'))await breakFascinarOnDamage(actor);
  const phase=pending.phase??(pending.key.endsWith(':end')?'end':'start');
  await advanceAptitudePhase(actor,pending.key,phase);
  if(runtimeState(actor).akimichi){const {advanceCalories}=await import('./akimichi.mjs');await advanceCalories(actor,pending.key,phase,{books:worldProfile()?.books,rules:houseRules()});}
  if(Object.keys(actor.system.inventoryState??{}).length){const {advanceInventoryPhase}=await import('./inventory-actions.mjs');await advanceInventoryPhase(actor,pending.key,phase);}
  if((actor.system.powerState?.active??[]).length||runtimeState(actor).hachimon?.cooldown?.remaining>0||(game.actors?.contents??[]).some(a=>(a.system.powerState?.active??[]).some(p=>p.targetUuid===actor.uuid))){const {advancePowerPhase}=await import('./power-actions.mjs');await advancePowerPhase(actor,pending.key,phase);}
  for(const root of actor.system.powerState?.active??[])if(root.active!==false&&!root.ending&&root.mentalControl?.assumed&&root.mentalControl.mode!=='disorder')
    for(const body of controlledBodies(actor,root.id))if(mindBinding(body)?.root.id===root.id)
      await processConditionPhase(body,'mind-body:'+root.id+':'+pending.key,phase);
  const ledger=actor.getFlag(ID,'processedPhases')??[];
  await actor.update({[`flags.${ID}.processedPhases`]:ledger.includes(pending.key)?ledger:[...ledger,pending.key],[`flags.${ID}.pendingPhase`]:null});
}
export async function processConditionPhase(actor,key,phase='start') {
  const binding=mindBinding(actor);
  if(binding&&binding.root.mentalControl.mode!=='disorder'&&!key.startsWith('mind-body:'+binding.root.id+':'))return null;
  const previous=processing.get(actor.uuid)??Promise.resolve();
  const job=previous.catch(()=>{}).then(async()=>{
    own(actor);const pending=actor.getFlag(ID,'pendingPhase');if(pending){await completePendingPhase(actor,pending);if(pending.key===key)return pending.result;}
    const ledger=actor.getFlag(ID,'processedPhases')??[];if(ledger.includes(key))return null;
    const records=conditionRecords(actor,{includeAutomatic:true}),result=conditionTurn(records,phase,Number(actor.system.campaign.level)||4,key);
    const update={[`flags.${ID}.pendingPhase`]:{key,result,phase}};
    const infections=(runtimeState(actor).rinkaInfections??[]).filter(record=>!record.treated);
    const rinkaDamage=phase==='start'?infections.reduce((sum,record)=>sum+record.amount,0):0;
    if(rinkaDamage)result.prompts.push({key:'rinka-damage',amount:rinkaDamage});
    const vitality=actor.system.resources.vitality.value;
    if((result.damage||rinkaDamage)&&vitality!==null){
      const afterOtherDamage=lethalDamage(vitality,result.damage);
      update['system.resources.vitality.value']=Math.min(afterOtherDamage,Math.max(0,afterOtherDamage-rinkaDamage));
    }
    await mutateRuntime(actor,state=>{
      const after=update['system.resources.vitality.value'];
      if(after!==undefined)recordMindDamage(state,actor,'condition-phase:'+key,result.damage+Math.max(0,lethalDamage(vitality,result.damage)-after),{after});
      return {changes:update};
    });
    await completePendingPhase(actor,{key,result});
    return result;
  });processing.set(actor.uuid,job);try{return await job;}finally{if(processing.get(actor.uuid)===job)processing.delete(actor.uuid);}
}
export function createActorClass(Base) {
  return class ShinobiActor extends Base {
    prepareDerivedData(){super.prepareDerivedData();applyDerived(this);}
    getRollData(){const data=super.getRollData();const agi=Number(this.system.attributes.agi??0),prontidao=statPrecision(this,'prontidao',{kind:'initiative',reaction:true});return {...data,sns:{...data.sns,accelerationBonus:derivedSummary(this).acceleration.initiative+Math.max(0,...(this.system.powerState?.active??[]).filter(a=>a.active!==false).map(a=>Number(a.initiativeBonus??0))),initiative:agi+prontidao.precision+derivedSummary(this).acceleration.initiative+Math.max(0,...(this.system.powerState?.active??[]).filter(a=>a.active!==false).map(a=>Number(a.initiativeBonus??0)))+aptitudeBonuses(this.system,[...(this.items??[])],houseRules()).initiative}};}
    async _preUpdate(data,options,user) {
      const result=await super._preUpdate(data,options,user);if(result===false)return false;
      const expanded=foundry.utils.expandObject(data),change=expanded.system??{};
      if(this.getFlag(ID,'companion')?.schemaVersion===1){
        if(options.snsCompanionSync&&game.user.isGM)return result;
        if(change.attributes||change.combat||change.skills||change.automation||change.campaign?.level!==undefined||
          change.physical?.size!==undefined||change.movement?.distance!==undefined||change.resources?.vitality?.max!==undefined||change.resources?.chakra?.max!==undefined)
          throw Error('As estatísticas do companheiro seguem o Inuzuka. Altere a ficha de origem; Vitalidade e Chakra atuais continuam próprios.');
      }
      // Native JSON import replaces the entire document. Validate the incoming
      // build, rather than comparing it with the destination's old NC/items.
      if(options.diff===false&&options.recursive===false&&expanded.type&&change.campaign&&change.attributes&&change.automation&&Array.isArray(expanded.items)){
        own(this);gm();
        if(expanded.type==='character'){
          const check=validateAllocation({nc:change.campaign.level,attributes:change.attributes,granted:change.automation.attributeGranted,creation:!change.campaign.draft,bases:change.automation.bases});
          const errors=[...check.errors,...validateBuildChange(change,{skills:change.skills,social:change.social},expanded.items,houseRules())];
          if(errors.length)throw Error(errors.join(' '));
        }
        return result;
      }
      const originErrors=validateOriginChange(this.system,change,[...(this.items??[])],{isGM:game.user.isGM});if(originErrors.length)throw Error(originErrors.join(' '));
      if(change.powerState?.affinity&&!game.user.isGM)throw Error('Somente o mestre registra exceções de afinidade.');
      if(change.skills||change.social){const errors=validateBuildChange(this.system,change,[...(this.items??[])],houseRules());if(errors.length)throw Error(errors.join(' '));}
      for(const cap of clampResourceChanges(this,change)){const path=`system.resources.${cap.key}.value`;if(Object.hasOwn(data,path))data[path]=cap.value;else {data.system??={};data.system.resources??={};data.system.resources[cap.key]??={};data.system.resources[cap.key].value=cap.value;}globalThis.ui?.notifications?.info?.(`${cap.label} limitada ao máximo de ${cap.max}.`);}
      if(!this.system.automation?.enabled||this.type!=='character')return;
      if(!this.system.campaign.draft&&change.automation?.bases&&Object.keys(COMBAT).some(k=>change.automation.bases[k]!==undefined&&Number(change.automation.bases[k])!==Number(this.system.automation.bases[k])))throw Error('As bases de combate só podem ser distribuídas na criação da ficha.');
      if(!options.snsAllocation&&(change.attributes||change.automation?.attributeGranted!==undefined))throw Error('Use a janela de distribuição/evolução para alterar atributos ou EXP.');
      if(!options.snsAllocation&&change.campaign?.level!==undefined){if(!game.user.isGM)throw Error('Somente o mestre altera o NC após a criação.');const nc=Number(change.campaign.level);progression(nc);data['system.automation.attributeGranted']=levelGrant(this.toObject().system,nc,houseRules().advancement);options.snsOpenAllocation=true;}
      if(change.resources?.vitality?.max!==undefined||change.resources?.chakra?.max!==undefined||change.combat||change.movement?.distance!==undefined)throw Error('Este valor é calculado a partir dos atributos e do NC.');
    }
  };
}
const syncing=new Set();
export async function syncAutomaticStatuses(actor) {
  if(syncing.has(actor.uuid))return;syncing.add(actor.uuid);
  try {
    const resources=actor.system.resources,caps=clampResourceChanges(actor,{resources:{vitality:{value:resources?.vitality?.value},chakra:{value:resources?.chakra?.value}}});
    if(caps.length)await actor.update(Object.fromEntries(caps.map(c=>[`system.resources.${c.key}.value`,c.value])));
    const companion=actor.getFlag?.(ID,'companion');
    if(companion?.transformation&&(Number(actor.system.resources?.vitality?.value)<Number(actor.system.resources?.vitality?.max)/2||
      derivedSummary(actor).state.keys.some(key=>['inconsciente','morto'].includes(key)))){
      const source=(game.actors?.contents??[]).find(a=>a.uuid===companion.origin);
      if(source?.isOwner){
        await actor.update({[`flags.${ID}.companion.juujinBlockedScene`]:periodKey(actor,'scene')},{snsCompanionSync:true});
        const {endPower}=await import('./power-actions.mjs');await endPower(source,companion.transformation.executionId);
      }
    }
    if((actor.system.powerState?.active??[]).length){
      const {reconcileActivePowers}=await import('./power-actions.mjs');
      await reconcileActivePowers(actor);
    }
    if(derivedSummary(actor).state.keys.some(key=>['inconsciente','morto'].includes(key))&&
      [...DOUJUTSU_KEYS,HAKKEN_KEY].some(key=>runtimeState(actor).active?.[key]?.sourceItemId)){
      await mutateRuntime(actor,state=>{
        for(const key of [...DOUJUTSU_KEYS,HAKKEN_KEY])if(state.active[key]?.sourceItemId)state.active[key]={scene:'encerrado',endedBy:'inconsciencia'};
        state.byakuganFocus=null;
      });
    }
    const vitality=actor.system.resources?.vitality?.value;
    if(vitality!==null&&vitality!==undefined&&(vitality> -11||vitality< -20))for(const r of conditionRecords(actor).filter(r=>r.key==='estavel'))await saveCondition(actor,r,{remove:true});
    const desired=derivedSummary(actor).state.automatic.filter(r=>CONDITIONS[r.key]);
    const existing=[...(actor.effects??[])].filter(e=>e.flags?.[ID]?.automaticStatus);
    const expired=existing.filter(e=>!desired.some(r=>r.key===e.flags[ID].automaticStatus)).map(e=>e.id);
    if(expired.length)await actor.deleteEmbeddedDocuments('ActiveEffect',expired);
    const fresh=desired.filter(r=>!existing.some(e=>e.flags[ID].automaticStatus===r.key));
    if(fresh.length)await actor.createEmbeddedDocuments('ActiveEffect',fresh.map(r=>({name:CONDITIONS[r.key].name,img:CONDITIONS[r.key].icon,statuses:[`sns-${r.key}`],flags:{[ID]:{automaticStatus:r.key}}})));
  }finally{syncing.delete(actor.uuid);}
}
export {creationSystem};
