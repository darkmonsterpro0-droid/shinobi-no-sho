import {worldRules} from './world-settings.mjs';
import {sizeProfile} from './physical-rules.mjs';
import {ID} from './config.mjs';
import {damageDegree} from './weapons.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function postAttackRoll(actor,attack,{name,weapon,remaining=[],conditional=false,index=1,coating=null,roll:preparedRoll=null,workflow=null}={}){
 const roll=preparedRoll??await new foundry.dice.Roll(`2d8 + (${attack.precision})`).evaluate(),natural=roll.total-attack.precision;
 const noCritical=!!actor.getFlag?.(ID,'clone')&&!attack.targetCapanga,critical=noCritical||attack.automaticHit?Infinity:attack.critical;
 const degree=attack.mercy||attack.automaticCritical?4:natural<=3&&!attack.automaticHit&&!attack.hachimonHeavy?0:Math.max(1,Number(attack.minimumDegree??0),damageDegree(natural,critical)-Number(attack.degreePenalty??0));
 const pending=remaining.length?{actorUuid:actor.uuid,name,weapon,remaining,index:index+1,conditional,coating}:null;
 const controls=workflow?'':pending?conditional?'<p>Confirme a defesa do primeiro golpe:</p><button type="button" data-sns-next-attack="hit">Primeiro golpe acertou — rolar segundo</button><button type="button" data-sns-next-attack="miss">Primeiro golpe errou — rolar segundo</button>':'<button type="button" data-sns-next-attack="next">Rolar próximo ataque</button>':'';
 const notes=(attack.notes??[]).map(n=>`<li>${esc(n)}</li>`).join(''),resist=attack.resist?`<p>Se acertar: ${esc(attack.resist.stat.toUpperCase())} ${attack.resist.difficulty} para evitar ${esc(attack.condition??'o efeito')}.</p>`:'';
 const message=await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>${esc(name)}${pending||index>1?' · golpe '+index:''}</strong><p>Precisão ${attack.precision} · dano base ${attack.base} · grau ${degree} · dano ${Math.ceil(attack.base*degree)} antes de redução, se acertar.</p><small>${attack.mercy||attack.automaticCritical?'Crítico automático.':attack.automaticHit?'Sucesso automático. Dados usados para o grau de dano.':natural<=3?attack.hachimonHeavy?'Fracasso automático, salvo contra Bloqueio comum.':'Fracasso automático.':natural>=critical?worldRules().criticalSkipsDefense===false?'Acerto crítico; a defesa declarada continua válida.':'Acerto crítico: sem teste de defesa.':workflow?'':'Compare o acerto com a defesa.'}</small>${noCritical?'<p>Clone capanga: sem acerto crítico contra não-capanga.</p>':''}${resist}${notes?'<ul>'+notes+'</ul>':''}${controls}${!workflow&&natural>3?'<button type="button" data-sns-weapon-resolve>Conferir defesa e aplicar no alvo</button>':''}`,flags:{[ID]:{kind:'weapon-attack',actorUuid:actor.uuid,weapon,precision:attack.precision,base:attack.base,natural,degree,pendingAttack:pending,weaponAttack:{...(workflow??{}),actorUuid:actor.uuid,name,weapon,plan:attack,natural,total:roll.total,degree,critical:!!attack.mercy||!!attack.automaticCritical||natural>=critical,size:sizeProfile(actor.system).key,coating}}}});
 return {roll,natural,degree,message};
}
export async function nextAttack(message,outcome){
 if(!message.isOwner)throw Error('Somente o autor da rolagem ou o mestre pode continuar.');
 const saved=message.getFlag(ID,'pendingAttack');if(!saved||message.getFlag(ID,'attackContinued'))throw Error('Esta sequência já foi continuada.');
 const actor=await fromUuid(saved.actorUuid);if(!actor?.isOwner)throw Error('Você não pode usar esse personagem.');
 if(saved.conditional&&!['hit','miss'].includes(outcome))throw Error('Confirme o acerto do primeiro golpe.');
 const [next,...remaining]=saved.remaining,attack={...next};if(saved.conditional&&outcome==='hit')attack.precision+=1;
 await message.setFlag(ID,'attackContinued',true);
 return postAttackRoll(actor,attack,{...saved,remaining,conditional:false});
}
