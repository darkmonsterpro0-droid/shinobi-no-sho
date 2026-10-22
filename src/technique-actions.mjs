import {ID} from './config.mjs';
import {normalize,aptitudeOwned} from './aptitudes.mjs';
import {modifyTechnique,riskyHealing,efficientDegree} from './technique-aptitudes.mjs';
import {mutateRuntime,periodKey,claimUsage,runtimeBonuses} from './aptitude-runtime.mjs';
import {houseRules,statPrecision,derivedSummary} from './automation.mjs';
import {damageDegree} from './weapons.mjs';
import {readFields} from './interactions.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TECHNIQUE_ACTIONS=new Set(['prepare-technique','execute-technique-modifiers','clear-water']);
export async function techniqueAction(app,op,data,root,{actor,show}){
 if(!actor?.isOwner)throw Error('Você não pode usar esta ficha.');
 if(op==='clear-water'){if(!aptitudeOwned([...actor.items],'dominio-da-agua'))throw Error('Domínio da Água não encontrado.');await mutateRuntime(actor,s=>{s.water={stamp:periodKey(actor,'scene'),value:0};});return app.render({force:true});}
 if(op==='prepare-technique'){const item=actor.items.get(data.id),apt=actor.items.get(data.aptitude);if(!item||!['power','technique'].includes(item.type)||!apt||apt.type!=='aptitude')throw Error('Seleção inválida.');return show('technique-modifiers',{actor,techniqueId:item.id,aptitudeId:apt.id});}
 Object.assign(app.values,readFields(root));
 const input=readFields(root,'frame.'),frame=Object.fromEntries(Object.entries(input).map(([k,v])=>[k.slice(6),v])),item=actor.items.get(frame.id);if(!item||!['power','technique'].includes(item.type))throw Error('Técnica ou poder não encontrado.');
 if(derivedSummary(actor).state.noActions)throw Error('A condição atual impede executar técnicas.');
 const actionCheck=statPrecision(actor,'esp',{kind:'attribute',manualContext:true});if(!actionCheck.allowed)throw Error(actionCheck.reasons.join(' '));
 frame.level=Number(frame.level);if(!Number.isInteger(frame.level)||frame.level<1||frame.level>Math.min(10,Math.floor(Number(actor.system.campaign.level??20)/2),Number(item.system.level??10)))throw Error('Nível usado acima do conhecido ou do limite de NC.');
 frame.cost=Number(frame.cost??0);frame.ranged=frame.reach==='ranged';frame.touchAttack=frame.reach==='touch';frame.area=Number(frame.width??0)>0||Number(frame.length??0)>0||Number(frame.height??0)>0;
 for(const key of ['mechanical','illusion','barrier','freeCreation'])frame[key]=frame[key]==='yes';
 frame.illusion||=frame.power==='magen';for(const key of ['touchDamage','noMeta','defensive','doujutsu'])frame[key]=frame.restriction===key;
 frame.common=Object.fromEntries(Object.entries(readFields(root,'common.')).filter(([,v])=>v!=null).map(([k,v])=>[k.slice(7),v]));
 if(!Object.keys(frame.common).length)frame.common=null;
 const keys=Object.entries(readFields(root,'modifier.')).filter(([,v])=>v).map(([k])=>k.slice(9));if(!keys.length)throw Error('Escolha uma aptidão para aplicar.');
 const choices=Object.fromEntries(Object.entries(readFields(root,'choice.')).map(([k,v])=>[k.slice(7),v]));choices.enclosed=choices.enclosed==='yes';choices.waterBoost=choices.waterMode==='spend'||choices.waterMode==='natural';choices.naturalWater=choices.waterMode==='natural';
 const items=[...actor.items],rules=houseRules(),efficient=keys.includes('tecnica-eficiente'),risky=keys.includes('tecnica-de-cura-arriscada');
 if(efficient&&(keys.length!==1||!Number.isInteger(frame.firstNatural)||frame.firstNatural<2||frame.firstNatural>16))throw Error('Use Técnica Eficiente sozinha, após confirmar o acerto, informando o resultado 2d8 original.');
 if(risky&&(!Number.isFinite(Number(frame.healingRate))||frame.healingRate===null||Number(frame.healingRate)<0))throw Error('Informe a taxa de cura original.');
 if(risky&&(!['shousen','shousen-no-jutsu'].includes(normalize(frame.effect))||keys.includes('tecnica-acelerada')))throw Error('Cura Arriscada só pode modificar Shousen no Jutsu e não combina com Técnica Acelerada.');
 let result;
 await mutateRuntime(actor,state=>{
  const stamp=periodKey(actor,'scene');choices.waterPoints=state.water?.stamp===stamp?Number(state.water.value??0):0;
  const simple=state.active['dominio-simples'];if(simple?.scene===stamp&&normalize(frame.power)==='ninpou'&&!frame.mechanical){if(!keys.includes('dominio-simples'))keys.push('dominio-simples');choices.domain=simple.choice;}
  if(keys.includes('dominio-simples')&&simple?.scene!==stamp){claimUsage(state,actor,'dominio-simples','scene',1);state.active['dominio-simples']={scene:stamp,choice:choices.domain??'damage'};}
  result=modifyTechnique(frame,keys.filter(k=>k!=='tecnica-de-cura-arriscada'),actor.system,items,choices,rules);
  const bonus=runtimeBonuses(actor);if(result.damage!=null)result.damage+=bonus.damage;if(result.difficulty!=null)result.difficulty+=bonus.difficulty;
  if(result.waterCreated||result.waterSpent)state.water={stamp,value:choices.waterPoints+result.waterCreated-result.waterSpent};
  if(!risky&&!efficient&&result.damage>0){const check=statPrecision(actor,frame.ranged?'cd':'cc',{kind:'attack',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));}
  const cost=efficient?0:Math.ceil(result.cost),chakra=actor.system.resources.chakra.value;if(chakra==null||chakra<cost)throw Error('Chakra insuficiente.');
  return {changes:{'system.resources.chakra.value':chakra-cost}};
 });
 let roll,extra='',kind='technique-modifiers';
 if(risky){const rate=Number(frame.healingRate);if(!Number.isFinite(rate)||rate<0)throw Error('Informe a taxa de cura original.');roll=await new foundry.dice.Roll('2d8').evaluate();const healing=riskyHealing(rate,roll.total);extra=`<p>${healing<0?'Dano':'Cura'}: ${Math.abs(healing)} (taxa original ${rate}).</p>`;}
 else if(efficient){roll=await new foundry.dice.Roll('2d8').evaluate();const degree=efficientDegree(frame.firstNatural,roll.total);extra=`<p>Maior grau mantido: ${degree}${frame.damage!=null?' · Dano '+Math.ceil(frame.damage*degree):''}. Ação de movimento; o chakra da técnica não é cobrado novamente.</p>`;}
 else if(result.damage>0){const stat=frame.ranged?'cd':'cc',check=statPrecision(actor,stat,{kind:'attack',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));const specialist=frame.touchAttack&&aptitudeOwned(items,'especialista','unarmed',rules)?1:0,precision=check.precision+Math.max(specialist,result.precisionBonus);roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();const natural=roll.total-precision,degree=natural<=3?0:damageDegree(natural,result.critical??15)+result.degreeBonus;extra=`<p>Precisão ${precision} · Grau ${degree} · Dano ${Math.ceil(result.damage*degree)} antes das reduções, se acertar.</p>`;kind='technique-attack';}
 const params=[['damage','Dano base'],['hardness','Dureza'],['difficulty','Dificuldade'],['range','Alcance (m)'],['impactDifficulty','Vigor contra Impacto'],['fireDifficulty','Vigor contra calor']].filter(([k])=>result[k]!=null).map(([k,label])=>`<dt>${label}</dt><dd>${esc(result[k])}</dd>`).join('');
 const flavor=`<strong>${esc(item.name)} · aptidões aplicadas</strong><p>Chakra: ${efficient?0:Math.ceil(result.cost)} · movimentos adicionais: ${result.extraMovement}.</p><dl>${params}</dl>${extra}<ul>${result.notes.map(n=>'<li>'+esc(n)+'</li>').join('')}</ul>${result.waterCreated||result.waterSpent?`<p>Água: +${result.waterCreated} gerada / ${result.waterSpent} gasta, na reserva do personagem.</p>`:''}`;
 const message={speaker:ChatMessage.getSpeaker({actor}),flags:{[ID]:{kind,actorUuid:actor.uuid,sourceId:item.id,frame,result,modifiers:keys}}};
 if(roll)await roll.toMessage({...message,flavor});else await ChatMessage.create({...message,content:flavor});return app.render({force:true});
}
