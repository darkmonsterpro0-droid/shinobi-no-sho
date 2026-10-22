import {ATTRIBUTES,COMBAT} from './config.mjs';
export const ATTRIBUTE_KEYS=Object.keys(ATTRIBUTES);
const minimums=[0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8];
const numeric=n=>Number.isFinite(Number(n))?Number(n):0;
export function progression(nc) {
  nc=Number(nc);if(!Number.isInteger(nc)||nc<4||nc>20)throw Error('O NC de personagem deve ser um inteiro de 4 a 20 (Básico p. 31).');
  return {nc,attributes:6*nc-12,skills:4*nc-8,powers:nc===20?40:2*nc-4,min:minimums[nc-4],max:nc};
}
export function spentAttributes(attributes={}) {return ATTRIBUTE_KEYS.reduce((sum,key)=>sum+numeric(attributes[key]),0);}
export function combatBaseStatus(bases={}) {
  const values=Object.keys(COMBAT).map(key=>Number(bases[key])),total=values.reduce((a,b)=>a+b,0),moved=values.reduce((a,b)=>a+Math.max(0,b-3),0);
  if(values.some(n=>!Number.isInteger(n)||n<1||n>5))return {valid:false,message:'Bases de combate: cada valor deve ser um inteiro entre 1 e 5.'};
  if(total!==12)return {valid:false,message:`Bases de combate: ${total} / 12 pontos. ${total<12?`Faltam ${12-total} ponto(s) para distribuir.`:`Há ${total-12} ponto(s) excedente(s); retire essa quantidade.`}`};
  if(moved>2)return {valid:false,message:`Bases de combate: 12 / 12 pontos, mas foram transferidos ${moved}. Transfira no máximo 2 pontos.`};
  return {valid:true,message:`Bases de combate: 12 / 12 pontos. Distribuição completa; ${moved} de 2 pontos transferidos.`};
}
export function validateAllocation({nc,attributes={},granted,previous=null,creation=false,bases={cc:3,cd:3,esq:3,lm:3}}) {
  const p=progression(nc),errors=[];granted=Number(granted??p.attributes);
  if(!Number.isFinite(granted)||granted<0)errors.push('Informe um total válido de pontos concedidos.');
  for(const key of ATTRIBUTE_KEYS) {
    const n=attributes[key];
    if(!Number.isInteger(n)||n<0||n>p.max)errors.push(`${ATTRIBUTES[key]}: inteiro entre 0 e ${p.max}.`);
    if(creation&&numeric(n)<p.min)errors.push(`${ATTRIBUTES[key]}: mínimo ${p.min} neste NC.`);
    if(previous&&numeric(n)<numeric(previous[key]))errors.push(`${ATTRIBUTES[key]} não pode diminuir durante a evolução.`);
  }
  const spent=spentAttributes(attributes),remaining=Math.round((granted-spent)*1000)/1000;
  if(remaining<0)errors.push(`Atributos: ${Math.abs(remaining)} ponto(s) acima do total concedido.`);
  if(creation&&remaining>0)errors.push(`Na criação, faltam distribuir ${remaining} ponto(s) de atributos.`);
  if(previous&&ATTRIBUTE_KEYS.some(k=>numeric(attributes[k])<p.min)&&ATTRIBUTE_KEYS.some(k=>numeric(attributes[k])>Math.max(numeric(previous[k]),p.min)))errors.push('Eleve primeiro os atributos abaixo do mínimo do NC antes de investir acima dele (Básico p. 33).');
  const baseStatus=combatBaseStatus(bases);if(!baseStatus.valid)errors.push(baseStatus.message);
  return {...p,granted,spent,remaining,errors,valid:!errors.length};
}
export function levelGrant(system,target,mode='level') {
  const p=progression(target),old=progression(system.campaign.level),granted=numeric(system.automation?.attributeGranted??old.attributes);
  if(target<old.nc)throw Error('A evolução não reduz o NC.');
  return mode==='xp'?granted:granted+6*(p.nc-old.nc);
}
export function basicSummary(system) {
  const p=progression(system.campaign.level),a=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,numeric(system.attributes?.[k])]));
  const b=system.automation?.bases??{cc:3,cd:3,esq:3,lm:3};
  return {combat:{cc:a.for+numeric(b.cc),cd:a.des+numeric(b.cd),esq:a.agi+numeric(b.esq),lm:a.per+numeric(b.lm)},vitality:10+3*a.vig+5*p.nc,chakra:10+3*a.esp,movement:10+Math.ceil(a.agi/2),attributeGranted:numeric(system.automation?.attributeGranted??p.attributes),attributeSpent:spentAttributes(a),minimum:p.min,maximum:p.max};
}
export function creationSystem(system={}) {
  const copy=structuredClone(system);copy.campaign={...copy.campaign,level:Number(copy.campaign?.level??4),draft:false};
  const p=progression(copy.campaign.level);copy.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,Number(copy.attributes?.[k]??p.min)]));
  copy.automation={...copy.automation,enabled:true,attributeGranted:p.attributes,bases:{cc:3,cd:3,esq:3,lm:3,...copy.automation?.bases},history:[]};
  const check=validateAllocation({nc:p.nc,attributes:copy.attributes,creation:true,bases:copy.automation.bases});if(!check.valid)throw Error(check.errors.join(' '));
  const derived=basicSummary(copy);copy.resources={...copy.resources,vitality:{value:derived.vitality,max:derived.vitality},chakra:{value:derived.chakra,max:derived.chakra}};
  return copy;
}
