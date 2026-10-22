import {advanceAptitudePhase,runtimeBonuses,activeAptitudes,runtimeState,periodKey} from './aptitude-runtime.mjs';
import {cloneTestEffect} from './clone-rules.mjs';
import {skillBase,pointBudgets,validateBuildChange,RESTRICTED_SKILLS} from './build-rules.mjs';
import {aptitudeBonuses,aptitudeOwned,evolutionStatus} from './aptitudes.mjs';
import {ID,ATTRIBUTES,COMBAT,SKILLS} from './config.mjs';
import {progression,basicSummary,validateAllocation,levelGrant,creationSystem,spentAttributes} from './progression.mjs';
import {CONDITIONS,conditionKey,conditionHistory,resolveConditions,conditionContext,conditionTurn,lethalDamage} from './conditions.mjs';
const clone=value=>foundry.utils.deepClone(value);
const own=actor=>{if(!actor?.isOwner)throw Error('Você não possui permissão para alterar este personagem.');};
const gm=()=>{if(!game.user.isGM)throw Error('Somente o mestre concede NC e EXP.');};
export function houseRules(){return {advancement:'level',powerRate:2,...game.settings.get(ID,'houseRules')};}
export function clampResourceChanges(actor,change={}) {
  const s=actor.toObject().system,candidate={...s,campaign:{...s.campaign,...change.campaign},attributes:{...s.attributes,...change.attributes},automation:{...s.automation,...change.automation}};
  const base=actor.type==='character'&&candidate.automation?.enabled?basicSummary(candidate):null,result=[];
  for(const [key,label]of [['vitality','Vitalidade'],['chakra','Chakra']]) {
    const value=change.resources?.[key]?.value,max=base?.[key]??change.resources?.[key]?.max??s.resources?.[key]?.max;
    if(value!==null&&value!==undefined&&Number.isFinite(Number(value))&&max!==null&&max!==undefined&&Number.isFinite(Number(max))&&Number(value)>Number(max))result.push({key,value:Number(max),max:Number(max),label});
  }
  return result;
}
export function restRecovery(actor) {
  const d=derivedSummary(actor),s=actor.system,vit=s.resources.vitality.value,chakra=s.resources.chakra.value;
  if(d.state.keys.includes('morto'))throw Error('Recuperação comum não ressuscita.');
  if([vit,chakra,d.vitality,d.chakra,s.attributes.vig,s.attributes.esp].some(n=>n===null||n===undefined||!Number.isFinite(Number(n))))throw Error('Preencha vida, chakra, máximos, Vigor e Espírito antes de descansar.');
  const multiplier=aptitudeBonuses(s,[...(actor.items??[])],houseRules()).restMultiplier;
  const vr=(10+2*s.attributes.vig)*multiplier,cr=(5+2*s.attributes.esp)*multiplier;
  const kageActive=(game.actors?.contents??[]).some(c=>{const m=c.getFlag?.(ID,'clone');return m?.origin===actor.uuid&&m.type==='kage-bunshin'&&!m.dismissed;});
  const vitality=Math.min(d.vitality,vit+vr),energy=kageActive?chakra:Math.min(d.chakra,chakra+cr);
  return {vitality,chakra:energy,vitalityGain:Math.max(0,vitality-vit),chakraGain:Math.max(0,energy-chakra),vitalityRecovery:vr,chakraRecovery:cr,chakraBlocked:kageActive};
}
export async function toggleCondition(actor,key,id) {
  own(actor);const records=conditionRecords(actor,{includeInactive:true}),matches=records.filter(r=>key?r.key===key:r.id===id),active=matches.some(r=>!r.disabled);
  if(!matches.length){if(derivedSummary(actor).state.keys.includes(key))throw Error('Esta condição é automática. Altere a causa para desativá-la.');await saveCondition(actor,{key,name:CONDITIONS[key]?.name});return;}
  for(const r of matches){if(r.effect)await actor.effects.get(r.id).update({disabled:active});else await actor.update({'system.conditions':actor.system.conditions.map(c=>c.id===r.id?{...c,disabled:active}:c)});}
}
export function conditionRecords(actor,{includeAutomatic=false,includeInactive=false}={}) {
  const records=(actor.system?.conditions??[]).map(r=>({...r,key:conditionKey(r),legacy:true}));
  for(const effect of actor.effects??[]) {
    if(!includeInactive&&(effect.disabled||effect.isSuppressed))continue;
    if(effect.flags?.[ID]?.automaticStatus)continue;
    const saved=effect.flags?.[ID]?.condition;
    const key=saved?.key??[...(effect.statuses??[])].find(s=>s.startsWith('sns-'))?.slice(4);
    if(key&&CONDITIONS[key])records.push({key,level:1,timing:'Início do turno',...saved,id:effect.id,name:CONDITIONS[key].name,source:saved?.source||CONDITIONS[key].source,effect:true,disabled:effect.disabled||effect.isSuppressed});
  }
  if(includeAutomatic)records.push(...derivedSummary(actor,records).state.automatic);
  return includeInactive?records:records.filter(r=>!r.disabled);
}
export function derivedSummary(actor,records=conditionRecords(actor)) {
  const s=actor.system,automatic=actor.type==='character'&&s.automation?.enabled;
  let base=null,error='';try{if(automatic)base=basicSummary(s);}catch(e){error=e.message;}
  const bonus=aptitudeBonuses(s,[...(actor.items??[])],houseRules()),runtime=runtimeBonuses(actor);
  const combat={...(base?.combat??Object.fromEntries(Object.keys(COMBAT).map(k=>[k,s.combat?.[k]??0])))};
  combat.esq+=bonus.esq+runtime.dodge;combat.lm+=bonus.lm;
  const vitality=base?.vitality??s.resources?.vitality?.max,chakra=base?.chakra??s.resources?.chakra?.max;
  const cloneMeta=actor.getFlag?.(ID,'clone');
  const resources={vitality:s.resources?.vitality?.value??null,chakra:s.resources?.chakra?.value??null,chakraMax:chakra??0,forcedDrain:s.automation?.forcedDrain,puppet:actor.type==='puppet',hasChakraReserve:!(cloneMeta&&chakra===0)};
  const state=resolveConditions(records,resources),normalMovement=(bonus.movement??base?.movement??actor._source?.system?.movement?.distance??s.movement?.distance??0)+runtime.movement;
  const dodgeBonus=state.immobile||state.keys.includes('desprevenido')?0:bonus.esq+runtime.dodge;combat.esq+=dodgeBonus-bonus.esq-runtime.dodge;
  return {automatic,base,combat,dodgeBonus,vitality,chakra,resources,state,normalMovement,movement:state.immobile?0:state.slow?Math.ceil(normalMovement/2):normalMovement,error};
}
export function applyDerived(actor) {
  const d=derivedSummary(actor);if(d.base){Object.assign(actor.system.combat,d.combat);actor.system.resources.vitality.max=d.vitality;actor.system.resources.chakra.max=d.chakra;actor.system.advancement.attributesSpent=d.base.attributeSpent;actor.system.advancement.attributesAvailable=d.base.attributeGranted-d.base.attributeSpent;}
  if(d.automatic||d.state.slow||d.state.immobile)actor.system.movement.distance=d.movement;
  actor._snsSummary=d;
}
export function getActorView(actor) {
  const d=actor.toObject();d.id=actor.id;d.items=actor.items?.map(i=>({...i.toObject(),id:i.id}))??[];
  for(const i of d.items)if(i.type==='aptitude'&&i.system.catalogKey)i.evolution=evolutionStatus(i,d.system,d.items,houseRules());
  const derived=derivedSummary(actor);d.system.conditions=conditionRecords(actor,{includeAutomatic:true});
  d.system.combat=derived.combat;d.clone=actor.getFlag?.(ID,'clone');if(d.clone){d.clone={...d.clone};const active=(game.actors?.contents??[]).filter(c=>c.getFlag?.(ID,'clone')?.origin===d.clone.origin&&!c.getFlag(ID,'clone').dismissed).length||1;d.clone.automaticCombatFailure=cloneTestEffect(d.clone,'cc',{activeCount:active}).automaticFailure;d.clone.version=active>2?2:1;}d.clones=(game.actors?.contents??[]).filter(c=>c.getFlag?.(ID,'clone')?.origin===actor.uuid&&!c.getFlag(ID,'clone').dismissed).map(c=>({uuid:c.uuid,name:c.name,version:c.getFlag(ID,'clone').version}));
  if(derived.base){d.system.combat=derived.combat;d.system.resources.vitality.max=derived.vitality;d.system.resources.chakra.max=derived.chakra;d.system.advancement.attributesSpent=derived.base.attributeSpent;d.system.advancement.attributesAvailable=derived.base.attributeGranted-derived.base.attributeSpent;}
  if(d.system.automation?.enabled)for(const key of Object.keys(SKILLS))d.system.skills[key]={...d.system.skills[key],value:RESTRICTED_SKILLS.includes(key)&&Number(d.system.skills[key]?.points??0)<1?0:skillBase(d.system,key)+(aptitudeBonuses(d.system,d.items,houseRules()).skills[key]??0)};
  d.system.movement.distance=derived.movement;d.summary=derived;d.aptitudeStates=activeAptitudes(actor);const water=runtimeState(actor).water;d.aptitudeWater=water?.stamp===periodKey(actor,'scene')?Number(water.value??0):0;d.conditionControls=conditionRecords(actor,{includeInactive:true});return d;
}
export function allocationProposal(actor,values={}) {
  const source=actor.toObject().system,current=Number(source.campaign?.level??4),nc=Number(values.nc??current),p=progression(nc),initial=!source.automation?.enabled||source.campaign?.draft;
  const granted=initial?p.attributes:levelGrant(source,nc,houseRules().advancement);
  return {source,nc,current,initial,granted,attributes:values.attributes??Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,source.attributes?.[k]??p.min])),bases:values.bases??source.automation?.bases??{cc:3,cd:3,esq:3,lm:3}};
}
export async function saveAllocation(actor,values,{initializeResources=false}={}) {
  own(actor);const proposal=allocationProposal(actor,values),{nc,current,initial,source,granted,attributes,bases}=proposal;
  if(!initial)gm();
  if(!initial&&Object.keys(COMBAT).some(k=>Number(bases[k])!==Number(source.automation.bases[k])))throw Error('As bases de combate só podem ser distribuídas na criação da ficha.');
  const check=validateAllocation({nc,attributes,granted,previous:initial?null:source.attributes,creation:initial,bases});if(!check.valid)throw Error(check.errors.join(' '));
  const history=[...(source.automation?.history??[]),{at:new Date().toISOString(),user:game.user.id,from:current,to:nc,granted,spent:spentAttributes(attributes),attributes:clone(attributes),mode:houseRules().advancement}];
  const update={'system.campaign.level':nc,'system.campaign.draft':false,'system.attributes':attributes,'system.automation.enabled':true,'system.automation.attributeGranted':granted,'system.automation.bases':bases,'system.automation.history':history};
  if(initializeResources){const d=basicSummary({...source,campaign:{...source.campaign,level:nc},attributes,automation:{...source.automation,bases}});if(source.resources.vitality.value===null)update['system.resources.vitality.value']=d.vitality;if(source.resources.chakra.value===null)update['system.resources.chakra.value']=d.chakra;}
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
  if(remove){if(effect)await effect.delete();else if(legacy)await actor.update({'system.conditions':actor.system.conditions.filter(r=>r.id!==values.id)});return;}
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
  const summary=derivedSummary(actor),s=actor.system;let precision=0;
  if(stat in ATTRIBUTES)precision=Number(s.attributes[stat]??0);
  else if(stat in COMBAT)precision=summary.combat[stat];
  else if(stat in SKILLS){const skill=s.skills[stat]??{},points=Number(skill.points??0);precision=s.automation?.enabled?skillBase(s,stat):Number(skill.value??skillBase(s,stat));if(['lidar','mecanismos','medicina','ocultismo','veneficio'].includes(stat)&&points<1)throw Error(`${SKILLS[stat][0]} exige ao menos 1 ponto investido para este uso (Básico p. 36).`);}
  else throw Error('Característica desconhecida.');
  if(stat in SKILLS){precision+=aptitudeBonuses(s,[...(actor.items??[])],houseRules()).skills[stat]??0;if(stat==="veneficio"&&!aptitudeOwned([...(actor.items??[])],"quimico"))throw Error("Venefício exige a aptidão Químico.");}
  const effect=conditionContext(conditionRecords(actor),{...context,stat},summary.resources);
  const runtime=runtimeBonuses(actor,{...context,stat});if(context.kind==='attack')precision+=runtime.attack;else if(context.kind==='defense'&&!(stat==='esq'&&effect.loseDodgeBonus))precision+=runtime.defense;effect.penalty=Math.max(-3,effect.penalty+(context.kind==='attack'?runtime.attackPenalty:0));
  if(stat==='esq'&&effect.loseDodgeBonus)precision-=summary.dodgeBonus;
  const meta=actor.getFlag?.(ID,'clone');if(meta){const count=(game.actors?.contents??[]).filter(c=>c.getFlag?.(ID,'clone')?.origin===meta.origin&&!c.getFlag(ID,'clone').dismissed).length||1,ce=cloneTestEffect(meta,stat,{activeCount:count,kind:context.kind});effect.uncappedPenalty=ce.penalty;effect.penalty+=ce.penalty;if(ce.automaticFailure||!ce.allowed){effect.allowed=false;effect.reasons.push(ce.automaticFailure?'Há mais de dois clones ativos: todos falham automaticamente em testes de combate.':'Este clone foi desfeito.');}}
  return {base:precision,precision:precision+effect.penalty+effect.bonus,...effect};
}
export async function damageActor(actor,amount,{reason='Dano'}={}) {
  own(actor);const value=lethalDamage(actor.system.resources.vitality.value,amount);if(value===null)throw Error('Preencha a vitalidade atual antes de processar dano.');
  await actor.update({'system.resources.vitality.value':value});
  const stable=conditionRecords(actor).filter(r=>r.key==='estavel');for(const r of stable)await saveCondition(actor,r,{remove:true});
  return {value,reason,amount};
}
const processing=new Map();
async function completePendingPhase(actor,pending) {
  const records=conditionRecords(actor,{includeAutomatic:true}),result=pending.result;
  if(result.damage)for(const r of records.filter(r=>r.key==='estavel'&&!r.automatic))await saveCondition(actor,r,{remove:true});
  for(const u of result.updates){const r=records.find(r=>r.id===u.id);if(r&&!r.automatic&&!result.expired.includes(r.id))await saveCondition(actor,{...r,...u});}
  for(const id of result.expired){const r=records.find(r=>r.id===id);if(r&&!r.automatic)await saveCondition(actor,r,{remove:true});}
  await advanceAptitudePhase(actor,pending.key,pending.phase??(pending.key.endsWith(':end')?'end':'start'));
  const ledger=actor.getFlag(ID,'processedPhases')??[];
  await actor.update({[`flags.${ID}.processedPhases`]:ledger.includes(pending.key)?ledger:[...ledger,pending.key],[`flags.${ID}.pendingPhase`]:null});
}
export async function processConditionPhase(actor,key,phase='start') {
  const previous=processing.get(actor.uuid)??Promise.resolve();
  const job=previous.catch(()=>{}).then(async()=>{
    own(actor);const pending=actor.getFlag(ID,'pendingPhase');if(pending){await completePendingPhase(actor,pending);if(pending.key===key)return pending.result;}
    const ledger=actor.getFlag(ID,'processedPhases')??[];if(ledger.includes(key))return null;
    const records=conditionRecords(actor,{includeAutomatic:true}),result=conditionTurn(records,phase,Number(actor.system.campaign.level)||4);
    const update={[`flags.${ID}.pendingPhase`]:{key,result,phase}};
    if(result.damage&&actor.system.resources.vitality.value!==null)update['system.resources.vitality.value']=lethalDamage(actor.system.resources.vitality.value,result.damage);
    await actor.update(update);
    await completePendingPhase(actor,{key,result});
    return result;
  });processing.set(actor.uuid,job);try{return await job;}finally{if(processing.get(actor.uuid)===job)processing.delete(actor.uuid);}
}
export function createActorClass(Base) {
  return class ShinobiActor extends Base {
    prepareDerivedData(){super.prepareDerivedData();applyDerived(this);}
    getRollData(){const data=super.getRollData();const agi=Number(this.system.attributes.agi??0),prontidao=statPrecision(this,'prontidao',{kind:'initiative',reaction:true});return {...data,sns:{...data.sns,initiative:agi+prontidao.precision+aptitudeBonuses(this.system,[...(this.items??[])],houseRules()).initiative}};}
    async _preUpdate(data,options,user) {
      const result=await super._preUpdate(data,options,user);if(result===false)return false;
      const expanded=foundry.utils.expandObject(data),change=expanded.system??{};
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
