import {RESTRICTED_APTITUDES} from './restricted-aptitude-data.mjs';
import {evaluateRequirement,capabilityLedger} from './core/capabilities.mjs';
import {effectiveAttributes} from './physical-rules.mjs';
import {SKILLS} from './config.mjs';
const normalize=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const restrictedDefinition=(key,book)=>RESTRICTED_APTITUDES.find(e=>e.key===key&&(!book||e.book===book));
export const isRestricted=item=>!!restrictedDefinition(item?.system?.catalogKey,item?.system?.catalogBook);
export function characterOrigins(system) {
  const data=system.capabilityData;
  if(data?.schemaVersion!=null&&data.schemaVersion!==1)return {keys:[],unsupported:true};
  const values=Array.isArray(data?.origins)?data.origins:[system.identity?.clan].filter(Boolean);
  return {keys:[...new Set(values.map(normalize))],unsupported:false};
}
export function originCompatibility(keys,rules={}) {
  if(keys.length<=1||rules.twoHijutsus)return {allowed:true,missing:[],review:[]};
  const routes=['hatake','sarutobi','fuuma','yotsuki'];
  if(keys.length===2&&keys.includes('tensai')&&keys.some(k=>routes.includes(k)||k==='hibon-ninpou'))return {allowed:true,missing:[],review:[]};
  // Complementary Hachimon/Senjutsu and graft exceptions have their own limits.
  // An explicit table review is safer than inferring that every combination works.
  return {allowed:null,missing:[],review:['Combinação de origens: habilite a regra de dois ou mais hijutsus ou peça conferência da exceção publicada ao mestre.']};
}
export function restrictedFacts(system,items=[]) {
  const facts={},attrs=effectiveAttributes(system,{permanentOnly:true});
  for(const [key,value]of Object.entries(attrs))facts['attribute.'+key]=Number(value??0);
  for(const [key,[,attribute]]of Object.entries(SKILLS)){const manual=system.automation?.enabled===false&&!system.campaign?.draft&&system.skills?.[key]?.value!=null;
    facts['skill.'+key]=manual?Number(system.skills[key].value):Math.ceil(Number(attrs[attribute]??0)/2)+Number(system.skills?.[key]?.points??0);facts['training.'+key]=Number(system.skills?.[key]?.points??0);}
  for(const [key,attribute]of Object.entries({cc:'for',cd:'des',esq:'agi',lm:'per'}))facts['combat.'+key]=Number(attrs[attribute]??0)+Number(system.automation?.bases?.[key]??3);
  for(const i of items){const s=i.system??{},key=s.catalogKey??'',name=normalize(i.name),n=Number(s.level??1);
    if(i.type==='aptitude'){facts['aptitude.'+key]=true;facts['aptitudeLevel.'+key]=Math.max(facts['aptitudeLevel.'+key]??0,n);facts['aptitude.'+key+'.'+normalize(s.selection)]=true;}
    if(i.type==='power')for(const label of [name,normalize(key),normalize(s.powerData?.family),...(name==='hachimon-tonkou'?['hachimon']:[])])if(label)facts['power.'+label]=Math.max(facts['power.'+label]??0,n);
  }
  return facts;
}
export function restrictedEligibility(entry,system,items=[],{rules={},books,level=1,accessOrigin,ledger}={}) {
  const missing=[],review=[],origins=characterOrigins(system),selected=accessOrigin??entry.accessOrigins.find(k=>origins.keys.includes(k)),stage=entry.levels.find(s=>s.level===level);
  if(origins.unsupported)missing.push('Versão das origens não suportada; dados preservados.');
  if(!selected||!origins.keys.includes(selected)||!entry.accessOrigins.includes(selected))missing.push('Origem necessária: '+entry.accessOrigins.join(' ou ')+'.');
  if(books&&!books.includes(entry.book))missing.push('Livro desta aptidão desabilitado.');
  if(!stage)missing.push('Nível não catalogado.');
  for(const step of entry.levels.filter(s=>s.level<=level)){
    const check=evaluateRequirement(step.checks,restrictedFacts(system,items));missing.push(...check.missing);review.push(...check.review);
    if(step.review)review.push(step.reviewReason||'Conferir escolhas e condições da fonte antes da compra.');
  }
  review.push(...originCompatibility(origins.keys,rules).review);
  for(const other of entry.incompatibleKeys??[])if(items.some(i=>i.system?.catalogKey===other))missing.push('Incompatível com '+(restrictedDefinition(other)?.name??other)+'.');
  if(entry.noClan&&origins.keys.some(k=>CLAN_ORIGINS.includes(k)))missing.push('Esta opção exige Tensai sem clã.');
  if(entry.creationOnly&&!system.campaign?.draft&&level===1)missing.push('Aquisição permitida somente na criação.');
  if(entry.originVariants?.[selected]){const variant=system.capabilityData?.originVariants?.[selected];if(!variant)review.push('Escolha/conferência da opção de origem necessária.');else if(!entry.originVariants[selected].includes(variant))missing.push('A opção de origem selecionada não permite esta aptidão.');}
  if(entry.variant&&rules[entry.variant.setting]!==entry.variant.value)missing.push('Escolha explicitamente a variante '+entry.variant.label+'.');
  if(selected==='tensai'&&entry.slotGroup){const occupied=new Set(items.filter(i=>{const d=restrictedDefinition(i.system?.catalogKey);return d?.slotGroup===entry.slotGroup&&(i.system.capabilityData?.accessOrigin??'tensai')==='tensai';}).map(i=>i.system.catalogKey));if(!occupied.has(entry.key)&&occupied.size>=entry.slotLimit)missing.push(`Limite de ${entry.slotLimit} aptidões especiais Tensai diferentes atingido; evoluções não ocupam nova escolha.`);}
  const state=ledger?capabilityLedger(ledger):null;
  return {allowed:missing.length?false:review.length?null:true,missing:[...new Set(missing)],review:[...new Set(review)],accessOrigin:selected??null,level,acquisitionCost:stage?.cost??null,activation:'manual',suspended:state?.schemaVersion!==undefined&&state.schemaVersion!==1};
}
export const CLAN_ORIGINS=['aburame','akimichi','hatake','hyuuga','inuzuka','nara','sarutobi','senju','uchiha','uzumaki','yamanaka','fuuma','hoshigaki','hozuki','kaguya','yotsuki','yuki','shimura','hoshigakure'];
export function validateOriginChange(system,change,items,{isGM=false}={}){
  const errors=[],changesData=change.capabilityData!==undefined&&Object.entries(change.capabilityData??{}).some(([key,value])=>JSON.stringify(value)!==JSON.stringify(system.capabilityData?.[key])),changesLegacy=change.identity&&Object.hasOwn(change.identity,'clan')&&change.identity.clan!==system.identity?.clan;
  if(!changesData&&!changesLegacy)return errors;
  if(changesData&&system.capabilityData?.schemaVersion!=null&&system.capabilityData.schemaVersion!==1)errors.push('Versão das origens não suportada; dados preservados.');
  if(!isGM&&(!system.campaign?.draft||items.some(isRestricted)))errors.push('O mestre precisa conferir a alteração de origens após a criação ou aquisição de aptidões restritas.');
  const data=change.capabilityData;
  if(data?.origins!==undefined&&(!Array.isArray(data.origins)||data.origins.length>12||data.origins.some(k=>typeof k!=='string'||!k||k.length>120)))errors.push('Lista de origens inválida.');
  if(data?.schemaVersion!==undefined&&data.schemaVersion!==1)errors.push('Versão de origens não suportada.');
  return errors;
}
export function restrictedResourceLinks(actor,item) {
  return (item.system?.capabilityData?.resourceLinks??[]).map(link=>({ ...structuredClone(link),exists:(actor.system?.special??[]).some(r=>r.id===link.resourceId),manual:true }));
}
export function restrictedPurchaseErrors(actor,item,{previous,rules={},books,isGM=false}={}) {
  const entry=restrictedDefinition(item.system.catalogKey,item.system.catalogBook),s=item.system,old=previous?.system,items=[...(actor.items??[])].filter(i=>(i.id??i._id)!==(item.id??item._id));
  if(!entry)return ['Aptidão restrita não reconhecida.'];
  const metadata=s.capabilityData??{};
  const status=restrictedEligibility(entry,actor.system,items,{rules,books,level:Number(s.level??1),accessOrigin:metadata.accessOrigin});
  const errors=[...status.missing];
  if(metadata.schemaVersion!==1)errors.push('Metadados da aptidão restrita inválidos ou de versão futura.');
  if(metadata.definitionId!==entry.id)errors.push('Referência da definição não corresponde à aptidão.');
  if(!Number.isInteger(s.level)||s.level<1||s.level>entry.maxLevel)errors.push('Nível de aptidão inválido.');
  if(!previous&&s.level!==1||previous&&s.level!==Number(old.level)+1&&s.level!==old.level)errors.push('Adquira o nível inicial e evolua um nível por vez.');
  if(!['Comprada','Gratuita','Concedida'].includes(s.acquisition))errors.push('Aquisição inválida.');
  if(s.acquisition==='Gratuita'&&!entry.free)errors.push('Elegibilidade da escolha inicial gratuita precisa de conferência; não está liberada para esta entrada.');
  if(s.acquisition==='Gratuita'&&items.filter(i=>i.type==='aptitude'&&i.system?.acquisition==='Gratuita').length>=3)errors.push('Limite de três aptidões iniciais gratuitas atingido.');
  if(s.acquisition==='Concedida'&&!isGM)errors.push('Somente o mestre concede aptidões.');
  if((status.review.length||s.acquisition==='Concedida')&&(!isGM||typeof metadata.reviewReason!=='string'||!metadata.reviewReason.trim()))errors.push('Conferência do mestre necessária: '+status.review.join(' ')+' Registre a justificativa.');
  if(entry.repeatable&&!String(s.selection??'').trim())errors.push('Identifique a escolha desta compra repetível.');
  if(items.some(i=>i.type==='aptitude'&&i.system?.catalogKey===s.catalogKey&&(!entry.repeatable||(i.system.selection??'')===(s.selection??''))))errors.push('Aptidão já adquirida; use a evolução ou outra escolha expressamente permitida.');
  if(metadata.resourceLinks&&!Array.isArray(metadata.resourceLinks))errors.push('Vínculos de recurso inválidos.');
  return [...new Set(errors)];
}
