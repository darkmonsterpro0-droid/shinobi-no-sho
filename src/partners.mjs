// Livro Básico 4.1.b p. 269: declare the round's divisor before acting.
// This is a declaration, never a counter or restriction on remaining actions.
import {ID} from './config.mjs';
import {mutateRuntime,periodKey,runtimeState} from './aptitude-runtime.mjs';
import {joinedBody} from './body-state.mjs';
const actors=()=>globalThis.game?.actors?.contents??[];
const flag=(actor,key)=>actor.getFlag?.(ID,key)??actor.flags?.[ID]?.[key];
export function partnerOrigin(actor){
 const uuid=flag(actor,'companion')?.origin??flag(actor,'clone')?.origin;
 return uuid?actors().find(a=>a.uuid===uuid)??null:actor;
}
export function partnerGroup(actor){
 const origin=partnerOrigin(actor);if(!origin)return [];
 return [origin,...actors().filter(a=>a.uuid!==origin.uuid&&!joinedBody(a)&&
  (flag(a,'companion')?.origin===origin.uuid&&!flag(a,'companion').retired||
   flag(a,'clone')?.origin===origin.uuid&&!flag(a,'clone').dismissed))];
}
export function partnerDamageDivisor(actor,{required=true}={}){
 const group=partnerGroup(actor);if(group.length<2)return 1;
 const origin=group[0],plan=runtimeState(origin).partnerPlan;
 if(plan?.round!==periodKey(origin,'round')||!Number.isInteger(plan.divisor)||plan.divisor<1||plan.divisor>group.length){
  if(!required)return null;
  throw Error('Declare o divisor de dano dos parceiros para esta rodada antes de atacar.');
 }
 return plan.divisor;
}
export async function declarePartnerDivisor(actor,divisor){
 const origin=partnerOrigin(actor),group=partnerGroup(actor);
 if(!actor.isOwner||!origin?.isOwner)throw Error('Você precisa controlar o personagem e seus parceiros.');
 if(!Number.isInteger(divisor)||divisor<1||divisor>group.length)throw Error('Informe um divisor entre 1 e o total de integrantes do grupo.');
 await mutateRuntime(origin,state=>{state.partnerPlan={round:periodKey(origin,'round'),divisor};});
 return {divisor};
}
export function partnerControls(actor,esc){
 const group=partnerGroup(actor);if(group.length<2)return '';
 let divisor;try{divisor=partnerDamageDivisor(actor);}catch{}
 return `<details class="sns-partner-plan"><summary>Parceiros · divisor de dano${divisor?' '+divisor:' a declarar'}</summary>
  <p>Antes de agir, declare quantos integrantes usarão ação padrão nesta rodada, mesmo sem atacar. O dano de cada um será dividido por esse total; drenagem de chakra não muda. Básico p. 269.</p>
  <label>Divisor de dano <input type="number" name="partner.divisor" min="1" max="${group.length}" step="1" value="${divisor??group.length}"></label>
  <button type="button" class="sns-btn" data-sns="partner-plan">Declarar divisor</button>
  <small>${group.map(a=>esc(a.name)).join(', ')}. Esta escolha não contabiliza ações.</small></details>`;
}
