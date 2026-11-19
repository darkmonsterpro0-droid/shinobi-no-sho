import {clanCapabilities} from './clan-capabilities.mjs';
import {bodySource} from './body-state.mjs';
import {recordMindDamage,settleMindDamage} from './yamanaka-damage.mjs';
import {recordKey,readKeyedRecord} from './core/record-key.mjs';
import {worldProfile} from './world-settings.mjs';
import {breakFascinarOnDamage} from './automation.mjs';
import {ID} from './config.mjs';
import {lethalDamage} from './conditions.mjs';
import {elementalConfrontation} from './power-rules.mjs';
import {SIZES,sizeProfile,strongestHardness,resolveHardness,camouflagePlan} from './physical-rules.mjs';
import {armorSummary,consumeAbsorption} from './inventory-rules.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {houseRules,conditionRecords,saveCondition} from './automation.mjs';
import {mutateRuntime,activeAptitudes} from './aptitude-runtime.mjs';
import {readFields} from './interactions.mjs';
const queues=new Map();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const PHYSICAL_ACTIONS=new Set(['physical','save-physical','physical-impact','apply-physical-impact','physical-object','save-physical-object','damage-physical-object']);
export function bodyHardness(actor,{element,conditionalHardness,juuken=false}={}){
 const s=actor.system??actor,passive=strongestHardness([s.physical?.bodyHardness??0,
  actor.system?clanCapabilities(actor,{books:worldProfile()?.books,rules:houseRules()}).resiliencia?.hardness??0:0]),manual=strongestHardness([passive-(juuken?Math.min(2,Math.ceil(passive/2)):0),s.structure?.hardness??0]),powers=(s.powerState?.active??[]).filter(e=>e.active!==false).map(e=>{let value=Math.max(e.bodyHardness??0,e.burstBodyHardness??0)*elementalConfrontation(element,e.family).defense;if(conditionalHardness==='fuuton-normal-raiton-half')value*=e.family==='fuuton'?1:e.family==='raiton'?.5:0;return Math.ceil(value);});
 return strongestHardness([conditionalHardness?0:manual,...powers]);
}
export function camouflageSources(actor,{personal=false,distance=null}={}){
 const s=actor?.system??actor??{},sources=[...(s.physical?.camouflage??[])].filter(c=>personal?c.group==='personal':c.group!=='personal');
 for(const e of s.powerState?.active??[]){
  if(e.active===false||!e.camouflage)continue;
  const c=typeof e.camouflage==='string'?{level:e.camouflage,group:'environment'}:{...e.camouflage};
  if(personal?c.group!=='personal':c.group==='personal')continue;
  if(c.near!==undefined){if(e.effect==='nevoa'&&!e.areaMembership)continue;const chance=distance==null?Math.max(c.near,c.far):Number(distance)<=Number(c.nearDistance??1)?c.near:c.far;if(!chance)continue;c.level=chance>=50?'total':'partial';}
  sources.push({id:e.id,...c});
 }
 if(personal&&actor?.system&&conditionRecords(actor).some(c=>c.key==='cego'))sources.push({id:'blindness',level:'total',group:'personal',visualImpairment:true});
 return sources;
}
async function resolveConcealment(actor,{critical=false,attackerUuid,camouflageContext={}}={}){
 // Guia Avançado do Shinobi, 10 anos, pp. 32–33. Independente de camuflagem e sensores.
 const zui=camouflageContext.directAttack&&attackerUuid&&attackerUuid!==actor.uuid&&activeAptitudes(actor)['estilo-zui-quan'];
 const checks=[];
 if(zui){
  const roll=await new foundry.dice.Roll('1d8').evaluate(),passed=roll.total>2;
  checks.push({source:'estilo-zui-quan',first:roll.total,threshold:2,passed});
  if(!passed)return {passed:false,checks,reason:'Zui Quan'};
 }
 const attacker=attackerUuid?await fromUuid(attackerUuid):null,items=[...(attacker?.items??[])],active=attacker?activeAptitudes(attacker):{},precise=aptitudeOwned(items,'tiro-preciso','',houseRules());
 const sense=active.sensor,context={books:worldProfile()?.books,rules:houseRules()};
 const kagura=attacker&&clanCapabilities(attacker,context).kagura;
 const range=Math.max(sense?.sense==='chakra'?Number(sense.range):0,kagura?.range??0);
 const chakraDetected=range>0&&Number.isFinite(camouflageContext.distance)&&camouflageContext.distance<=range&&
  Number(actor.system.resources?.chakra?.max)>0&&clanCapabilities(actor,context).kagura?.suppressionDC==null;
 const plan=camouflagePlan([...camouflageSources(actor,{distance:camouflageContext.distance}),...camouflageSources(attacker,{personal:true})],{...camouflageContext,critical,sensor:chakraDetected||camouflageContext.sensor,blindFight:!!aptitudeOwned(items,'lutar-as-cegas','',houseRules()),preciseShotLevel:Number(precise?.system.level??0)});
 if(!plan.allowed)return {passed:false,checks,blocked:true,notes:plan.notes};
 const results=checks;for(const c of plan.checks){let roll=await new foundry.dice.Roll('1d8').evaluate(),first=roll.total,second=null,passed=first>c.threshold;
  await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:attacker??actor}),flavor:`Camuflagem ${c.level==='total'?'total':'parcial'}: ${passed?'ultrapassada':'falha'} (1d8; falha até ${c.threshold}).`});
  if(!passed&&c.reroll){roll=await new foundry.dice.Roll('1d8').evaluate();second=roll.total;passed=second>c.threshold;await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:attacker??actor}),flavor:`Lutar às Cegas: ${passed?'camuflagem ultrapassada':'falha mantida'}.`});}
  results.push({...c,first,second,passed});
 }
 return {passed:results.every(r=>r.passed),checks:results};
}
export async function applyPhysicalDamage(actor,input={}){
 const original=actor;
 actor=bodySource(actor);
 // A retry after separation still belongs to the body that received the hit.
 // Store the original participant on the payer's atomic damage receipt.
 if(original&&actor===original&&input.sourceId!=null){
  const originUuid=original.getFlag?.(ID,'companion')?.origin??original.getFlag?.(ID,'clone')?.origin;
  const source=(game.actors?.contents??[]).find(a=>a.uuid===originUuid),receipt=source&&readKeyedRecord(source.getFlag?.(ID,'aptitudes')?.damageReceipts,String(input.sourceId));
  if(receipt?.bodyTargetUuid===original.uuid)actor=source;
 }
 if(!actor?.isOwner)throw Error('Somente o dono da ficha ou o mestre pode aplicar este resultado.');
 const key=actor.uuid??actor.id,previous=queues.get(key)??Promise.resolve(),job=previous.catch(()=>{}).then(async()=>{
  if(input.postDivisionBonus!=null&&(!Number.isFinite(Number(input.postDivisionBonus))||Number(input.postDivisionBonus)<0))throw Error('Bônus de dano inválido.');
  const multiplier=Number(input.damageMultiplier??1);
  if(!Number.isFinite(multiplier)||multiplier<=0)throw Error('Multiplicador de dano inválido.');
  const sourceId=String(input.sourceId??foundry.utils.randomID()),keyedId=recordKey(sourceId),prior=readKeyedRecord(actor.getFlag(ID,'aptitudes')?.damageReceipts,sourceId);
  if(prior?.complete)return {...prior.result,duplicate:true};
  let receipt=prior;
  if(!receipt){
   const camouflage=await resolveConcealment(actor,input),elementalFactor=Math.min(1,...(actor.system.powerState?.active??[]).filter(e=>e.bodyHardness||e.burstBodyHardness).map(e=>elementalConfrontation(input.attackerElement,e.family).attack)),hardness=bodyHardness(actor,{element:input.attackerElement,conditionalHardness:input.conditionalHardness,juuken:input.juuken}),resolved=resolveHardness({kind:'body',hardness,base:Math.ceil(Number(input.base??0)*elementalFactor),fixed:Math.ceil(Number(input.fixed??0)*elementalFactor),degree:input.degree??1,ignore:input.ignoreBodyHardness??[],divisions:input.divisionCount??1,partnerDivisor:input.partnerDivisor??1});
   const index=Number(input.divisionIndex??0);if(!Number.isInteger(index)||index<0||index>=resolved.divided.length)throw Error('Parcela de ataque inválida.');
   const damage=camouflage.passed?Math.ceil((Math.ceil((resolved.divided[index]+Math.max(0,Number(input.postDivisionBonus??0)))*Number(input.degree??1))+resolved.fixed)*multiplier):0;
   const armor=armorSummary(actor,undefined,houseRules()),absorbed=consumeAbsorption(armor,damage,{ignoreAbsorption:!!input.ignoreAbsorption}),path=actor.type==='puppet'?'structure.absorption.value':'resources.vitality.value',current=actor.type==='puppet'?actor.system.structure?.absorption?.value:actor.system.resources?.vitality?.value;
   if(current===null||current===undefined||!Number.isFinite(Number(current)))throw Error('Preencha a vitalidade ou absorção atual do alvo.');
   receipt={complete:false,...(original!==actor?{bodyTargetUuid:original.uuid}:{}),armorId:absorbed.armorId,armorChanges:absorbed.changes,result:{sourceId,hit:camouflage.passed,camouflage,bodyHardness:hardness,baseAfterHardness:resolved.divided[index],absorbed:absorbed.absorbed,damage:absorbed.damage,before:Number(current),after:lethalDamage(Number(current),absorbed.damage),reason:input.reason??'Ataque'}};
   if(actor.type==='puppet')receipt.result.after=Math.max(0,Number(current)-absorbed.damage);
   await mutateRuntime(actor,state=>{state.damageReceipts??={};state.damageReceipts[keyedId]=receipt;recordMindDamage(state,actor,sourceId,receipt.result.damage,{after:receipt.result.after});return {changes:{['system.'+path]:receipt.result.after}};});
  }
  if(receipt.armorId&&Object.keys(receipt.armorChanges).length){const armor=actor.items.get(receipt.armorId);if(!armor)throw Error('A armadura mudou durante a resolução. Restaure-a antes de concluir o recibo de dano.');await armor.update(receipt.armorChanges);}
  if(input.area&&receipt.result.hit){
   const broken=await mutateRuntime(actor,state=>{
    const damageReceipt=state.damageReceipts[keyedId];
    if(damageReceipt.restraintImpacts)return {broken:damageReceipt.restraintImpacts.broken};
    const objects=structuredClone(actor.system.physical?.objects??[]),broken=[];
    for(const object of objects.filter(o=>o.restraint&&!o.broken)){
     const elemental=elementalConfrontation(input.attackerElement,object.element),impact=resolveHardness({kind:'object',hardness:Math.ceil(object.hardness*elemental.defense),base:Math.ceil(Number(input.base??0)*elemental.attack),fixed:Math.ceil(Number(input.fixed??0)*elemental.attack),degree:input.degree??1,area:true});
     object.hardness=impact.broken?0:Math.max(0,object.hardness-((Number(input.base??0)>0||Number(input.fixed??0)>0)?2:0));
     object.broken=impact.broken||object.hardness===0;
     if(object.broken&&object.powerExecution)broken.push(object.powerExecution);
    }
    damageReceipt.restraintImpacts={broken};return {broken,changes:{'system.physical.objects':objects}};
   });
   for(const id of broken.broken??[]){const {endPower}=await import('./power-actions.mjs');await endPower(actor,id);}
  }
  await settleMindDamage(actor,sourceId);
  if(receipt.result.damage>0)await breakFascinarOnDamage(actor);
  if(receipt.result.damage>0){const {resolvePowerConcentration}=await import('./power-actions.mjs');await resolvePowerConcentration(actor,{sourceId,damage:receipt.result.damage,privateRecipients:input.privateRecipients});}
  if(receipt.result.damage>0)for(const c of conditionRecords(actor).filter(c=>c.key==='estavel'&&!c.automatic))await saveCondition(actor,c,{remove:true});
  await mutateRuntime(actor,state=>{state.damageReceipts??={};state.damageReceipts[keyedId]={...receipt,complete:true};});
  return receipt.result;
 });queues.set(key,job);try{return await job;}finally{if(queues.get(key)===job)queues.delete(key);}
}
export async function physicalAction(app,op,data,root,{actor,show}){
 if(!actor?.isOwner)throw Error('Você não pode alterar esta ficha.');
 if(op==='physical')return show('physical',{actor});
 if(op==='physical-impact')return show('physical-impact',{actor,values:{base:0,degree:1,fixed:0}});
 if(op==='save-physical'){
  const v=Object.fromEntries(Object.entries(readFields(root,'physical.')).map(([k,v])=>[k.slice(9),v]));if(!SIZES[v.size])throw Error('Tamanho inválido.');
  const hardness=Number(v.bodyHardness??0);if(!Number.isFinite(hardness)||hardness<0)throw Error('Dureza inválida.');
  const camouflage=[];for(const group of ['environment','darkness','personal']){const level=v[group];if(level!=='none'&&!['partial','total'].includes(level))throw Error('Camuflagem inválida.');if(level!=='none')camouflage.push({id:'manual-'+group,group,level,visualImpairment:group==='personal'});}
  await actor.update({'system.physical':{...actor.system.physical,size:v.size,temporary:v.temporary==='yes',bodyHardness:hardness,camouflage}});return app.render({force:true});
 }
 if(op==='apply-physical-impact'){
  const v=Object.fromEntries(Object.entries(readFields(root,'impact.')).map(([k,v])=>[k.slice(7),v])),result=await applyPhysicalDamage(actor,{base:v.base,fixed:v.fixed,degree:v.degree,ignoreBodyHardness:[v.ignore??0],ignoreAbsorption:v.ignoreAbsorption==='yes',camouflageContext:{located:v.location!=='unknown',sensor:v.location==='sensor',areaFraction:Number(v.areaFraction??0)},sourceId:app.panelConfig.receiptId??=foundry.utils.randomID(),reason:'Dano confirmado pela mesa'});
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>${esc(actor.name)}: ${result.hit?`dureza ${result.bodyHardness}; absorção ${result.absorbed}; dano ${result.damage}; recurso ${result.before} → ${result.after}`:'ataque impedido pela camuflagem/localização'}.</p>`,flags:{[ID]:{kind:'damage-result',result}}});return app.close();
 }
 if(op==='physical-object')return show('physical-object',{actor,values:(actor.system.physical?.objects??[]).find(o=>o.id===data.id)??{}});
 if(op==='save-physical-object'){
  const v=Object.fromEntries(Object.entries(readFields(root,'object.')).map(([k,v])=>[k.slice(7),v])),list=structuredClone(actor.system.physical?.objects??[]);if(!v.name?.trim())throw Error('Informe o nome do objeto.');
  for(const key of ['hardness','absorption'])if(v[key]!=null&&(!Number.isFinite(v[key])||v[key]<0))throw Error('Dureza e absorção devem ser não negativas.');
  const record={...app.values,...v,id:app.values.id??foundry.utils.randomID()},index=list.findIndex(o=>o.id===record.id);if(index<0)list.push(record);else list[index]=record;await actor.update({'system.physical.objects':list});return app.close();
 }
 if(op==='damage-physical-object'){
  const list=structuredClone(actor.system.physical?.objects??[]),object=list.find(o=>o.id===app.values.id);if(!object)throw Error('Objeto não encontrado.');
  const v=Object.fromEntries(Object.entries(readFields(root,'objectImpact.')).map(([k,v])=>[k.slice(13),v])),elemental=elementalConfrontation(v.element,object.element,{mist:!!object.mist}),r=resolveHardness({kind:object.kind,hardness:Math.ceil(object.hardness*elemental.defense),base:Math.ceil(Number(v.base??0)*elemental.attack),fixed:Math.ceil(Number(v.fixed??0)*elemental.attack),degree:v.degree,ignore:[v.ignore??0],area:v.area==='yes',explosionOrWind:v.dispels==='yes'});
  const eligible=object.kind!=='imaginary'||v.area==='yes'&&v.dispels==='yes';object.hardness=r.broken?0:Math.max(0,object.hardness-(eligible&&(Number(v.base??0)>0||Number(v.fixed??0)>0)?2:0));object.broken=r.broken;if(object.absorption!=null){object.absorption=Math.max(0,object.absorption-r.damage);object.broken=r.broken||object.absorption===0;}
  await actor.update({'system.physical.objects':list});if(object.broken&&object.powerExecution){const {endPower}=await import('./power-actions.mjs');await endPower(actor,object.powerExecution);}
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>${esc(object.name)}: dureza ${r.effective} → ${r.hardness}; ${object.broken?'quebrado/dissipado':'resiste'}${object.absorption!=null?`; absorção restante ${object.absorption}`:''}. ${object.kind==='barrier'?`Dano que atravessa a proteção: ${r.damage}.`:''}</p>`});return app.close();
 }
}
