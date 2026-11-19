// Livro Básico 4.1.b, pp. 202–207. Purchased level and opened gate are
// distinct: raising a gate never renews the original duration.
import {ID} from './config.mjs';
export const HACHIMON_GATES=['Kaimon · Abertura','Kyūmon · Cura','Seimon · Vida','Shōmon · Dor','Tomon · Limite','Keimon · Visão','Kyōmon · Milagre','Shimon · Morte'];
export function gateBenefits(known,gate){
 if(!Number.isInteger(known)||known<1||known>10||!Number.isInteger(gate)||gate<1||gate>Math.min(known,8))
  throw Error('Portão acima do nível adquirido ou parâmetros inválidos.');
 const strength=gate===8?2*known:gate===7?known:gate;
 return {known,gate,strength,damageStrength:2*strength,agility:gate===8?6:gate>=6?3:gate===5?2:gate===4?1:0,
  acceleration:gate>=7?2:1,genjutsuReduction:gate===8?8:gate===7?3:gate>=5?2:gate>=3?1:0,
  damagePerTurn:gate===8?0:gate===7?known:gate===1?3:gate,
  duration:known===1?2:5,immuneFatigue:gate>=2,fatigueTurns:Math.max(1,4-(known-gate)),fatal:gate===8};
}
export function hachimonProfile(system){
 const record=system?.powerState?.active?.find(a=>a.hachimon&&a.active!==false&&!a.ending);
 if(!record)return null;
 try{return {...gateBenefits(record.hachimon.known,record.hachimon.gate),id:record.id,remaining:record.remaining};}catch{return null;}
}
export const hachimonSuppressesCondition=(system,key)=>['fatigado','exausto'].includes(key)&&!!hachimonProfile(system)?.immuneFatigue;
export const heavyBlock=(plan,defense)=>!!plan?.hachimonHeavy&&defense?.kind==='bloqueio'&&!defense.kaiten;
export function createHachimonEffectClass(Base){return class extends Base{
 get isSuppressed(){
  const key=this.flags?.[ID]?.condition?.key??this.flags?.[ID]?.automaticStatus;
  return super.isSuppressed||hachimonSuppressesCondition(this.actor?.system,key);
 }
};}
export function gateOpening(known,gate,current=0){
 const benefits=gateBenefits(known,gate);
 if(!Number.isInteger(current)||current<0||current>=gate)throw Error('Os portões só podem aumentar; fechar encerra todos de uma vez.');
 return {...benefits,action:gate-current<=Math.ceil(Math.min(known,8)/2)?'partial':'movement'};
}
export function heavyAttackPlan(plan,actor,{requested=false,turn,scene,inCombat=!!globalThis.game?.combat?.started,now=Number(globalThis.game?.time?.worldTime??0)}={}){
 if(![false,true,'on',undefined,null].includes(requested))throw Error('Escolha de Ataque Pesado inválida.');
 const history=actor?.getFlag?.(ID,'aptitudes')??actor?.flags?.[ID]?.aptitudes,
  prior=history?.hachimon?.heavy,active=prior?.turn===turn&&prior?.scene===scene&&(inCombat||now<prior.until)?prior:null;
 if(!requested&&!active)return plan;
 if(!['cc','cd'].includes(plan.stat)||Number(plan.base??plan.damage??0)<=0){
  if(requested)throw Error('Ataque Pesado exige um ataque com dano.');return plan;
 }
 let heavy=active;
 if(!heavy){
  const gates=hachimonProfile(actor?.system);
  if(!gates||gates.gate<2)throw Error('Ataque Pesado exige ao menos o segundo Portão aberto.');
  if(!Number.isInteger(gates.remaining)||gates.remaining<1||gates.remaining>5)throw Error('Confira a duração restante dos Portões.');
  const future=gates.remaining-1;
  heavy={rootId:gates.id,known:gates.known,gate:gates.gate,minimumDegree:future,wear:future*gates.damagePerTurn,
   difficulty:9+2*gates.gate,fatal:gates.fatal,turn,scene,until:now+6,pending:true};
 }
 return {...plan,hachimonHeavy:{...heavy},minimumDegree:Math.max(Number(plan.minimumDegree??0),heavy.minimumDegree),
  ...(heavy.fatal?{automaticHit:true,...(heavy.minimumDegree===4?{automaticCritical:true}:{})}:{}),
  notes:[...(plan.notes??[]),`Ataque Pesado: grau mínimo ${heavy.minimumDegree} se acertar; Acrobacia ${heavy.difficulty} evita Caído. Bloqueio comum concede sucesso automático ao atacante.`,
   ...(heavy.pending?[`Fecha os Portões e cobra ${heavy.wear} de desgaste futuro; cansaço aumenta para Exausto.`]:[])]};
}
