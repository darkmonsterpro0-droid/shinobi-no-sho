import {ID,SKILLS,ATTRIBUTES} from './config.mjs';
import {skillBase,SOCIAL_TESTS,simulatedTest} from './build-rules.mjs';
import {houseRules,statPrecision} from './automation.mjs';
import {readFields} from './interactions.mjs';
import {levelGrant} from './progression.mjs';
import {esc} from './ui.mjs';
export const BUILD_ACTIONS=new Set(['roll-skill','roll-social','save-world-rules','grant-earned-xp']);
export async function buildAction(app,op,data,root,{actor}){
 if(op==='grant-earned-xp'){
  if(!game.user.isGM||!actor?.isOwner)throw Error('Somente o mestre concede EXP.');
  const rules=houseRules();if(!rules.optionalXP||rules.advancement!=='level')throw Error('Ative a experiência por conquistas com avanço por nível inteiro.');
  if(!actor.system.automation?.enabled||actor.system.campaign.draft)throw Error('Conclua a criação do personagem antes de conceder EXP.');
  const gain=readFields(root,'ui.')['ui.earnedXP'],current=Number(actor.system.campaign.experience??0);
  if(!Number.isInteger(gain)||gain<1||current+gain>100)throw Error(`Conceda de 1 a ${100-current} EXP para atingir o próximo nível.`);
  const completed=current+gain===100,nc=Number(actor.system.campaign.level);
  if(completed&&nc>=20)throw Error('Esta versão limita a evolução ao NC 20.');
  await actor.update({'system.campaign.experience':completed?0:current+gain,...(completed?{'system.campaign.level':nc+1,'system.automation.attributeGranted':levelGrant(actor.system,nc+1,'level')}:{})},{snsAllocation:true,snsOpenAllocation:completed});
  await app.render({force:true});return;
 }
 if(op==='save-world-rules'){if(!game.user.isGM)throw Error('Somente o mestre altera regras.');const values=readFields(root,'world.'),patch=Object.fromEntries(Object.entries(values).map(([k,v])=>[k.slice(6),v]));patch.powerRate=Number(patch.powerRate);if(![2,3,4].includes(patch.powerRate))throw Error('Progressão de poderes inválida.');if(patch.optionalXP&&patch.advancement==='xp')throw Error('A EXP por conquistas usa nível inteiro; escolha esse modo de avanço.');await game.settings.set(ID,'houseRules',{...houseRules(),...patch});await app.render({force:true});ui.notifications.info('Regras da mesa salvas.');return;}
 if(!actor?.isOwner)throw Error('Você não pode rolar por este personagem.');
 const fields=readFields(root,'ui.');let precision,label;
 if(op==='roll-social'){const entry=SOCIAL_TESTS[data.stat];if(!entry)throw Error('Ação social inválida.');const [name,aspects,attrs]=entry,aspect=fields[`ui.social.${data.stat}.aspect`]??aspects[0],attribute=fields[`ui.social.${data.stat}.attribute`]??attrs[0];if(!aspects.includes(aspect)||!attrs.includes(attribute))throw Error('Combinação social não permitida.');precision=Number(actor.system.social[aspect]??0)+Math.ceil(Number(actor.system.attributes[attribute]??0)/2);label=`${name} · ${aspect==='yin'?'Yin':'Yang'} + ½ ${ATTRIBUTES[attribute]}`;}
 else {const check=statPrecision(actor,data.stat,{kind:'skill',vision:false,manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));precision=check.precision;label=SKILLS[data.stat][0];}
 if(op==='roll-skill'){
  const mode=fields['ui.skillMode']??'roll',p=simulatedTest(mode,precision,{difficulty:fields['ui.skillDifficulty']??null,inCombat:!!actor.inCombat,noPressure:mode==='one',noRisk:mode==='two',unlimitedTime:mode==='two'});
  if(!p.formula){await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<article class="sns-record"><strong>${esc(label)}: ${p.total}</strong><p>${esc(p.label)} + precisão ${precision}. Não é um crítico natural.</p><small>Básico pp.250–251. Condições de simulação declaradas pela mesa.</small></article>`,flags:{[ID]:{kind:'simulated-test',mode,precision,total:p.total}}});return;}
 }
 const roll=await new foundry.dice.Roll(`2d8 + (${precision})`).evaluate();await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`<strong>${esc(label)}</strong><p>Precisão ${precision}. Consequências resolvidas pela mesa.</p>`,flags:{[ID]:{kind:op==='roll-social'?'social-test':'skill-test',actorUuid:actor.uuid,stat:data.stat,precision,natural:roll.total-precision}}});
}
