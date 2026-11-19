// Shinobi adapter, Livro Básico 4.1.b pp. 196–200.
import {SKILLS} from './config.mjs';
import {skillBase} from './build-rules.mjs';
import {SIZES} from './physical-rules.mjs';

export function yamanakaPlan(base,system,options={},attributes=system.attributes??{}){
 const level=base.level,intel=Number(attributes.int??0);
 if(base.effect==='sensor-mentes')return {...base,cost:2,seals:true,action:'partial',duration:'sustained',targets:0,
  range:10+2*skillBase(system,'rastrear'),active:{family:'shindenshin',effect:base.effect,mindSensor:true},
  notes:['Detecta e diferencia as mentes dentro do alcance. A mesa informa as consciências percebidas; não revela automaticamente fichas ou tokens ocultos.']};
 if(base.effect==='transmissao-mental'){
  const amplified=options.amplifier===true||options.amplifier==='on';
  if(amplified&&level<10)throw Error('Amplificar a rede exige Shindenshin 10 e um mecanismo apropriado.');
  const scale=amplified?100:1;
  return {...base,seals:true,duration:'concentration',range:(10+2*intel)*scale,targets:level*scale,
   difficulty:9+level+Math.ceil(intel/2),mentalNetwork:true,active:{family:'shindenshin',effect:base.effect,mentalNetwork:true},
   notes:['Conecta pessoas conhecidas ou no campo de visão, dentro do alcance; os participantes podem conversar e trocar memórias através do usuário.',
    'Quem recusa a comunicação testa Inteligência para bloqueá-la. Capangas falham nessa resistência.',
    'Manutenção padrão por concentração; termina ao fim da cena.',
    ...(amplified?['Mecanismo amplificador confirmado: alcance e capacidade multiplicados por 100. O livro não quantifica o risco mental do uso além dos limites; a mesa confere suas consequências.']:[])]};
 }
 if(['troca-mente','multipla-troca','desordem-mental'].includes(base.effect)){
  const control=mentalControlParameters(base.effect,level,intel);
  return {...base,cost:control.cost,range:control.range,targets:control.targets,stat:null,seals:true,action:'standard',
   duration:control.duration??'continuous',difficulty:control.difficulty,mindControl:control,
   active:{family:'shindenshin',effect:base.effect,mentalControl:true},
   notes:[control.mode==='disorder'?'Controle sem transferência da mente: não deixa o usuário indefeso e não reflete dano.':'O corpo original fica indefeso; dano efetivo do corpo controlado é refletido como dano mental sem proteção.',
    control.mode==='disorder'?'Somente Golpear, Disparar, Lançar Projétil e reações básicas; ações no fim do turno do Yamanaka.':'Usa as precisões físicas do corpo e as precisões mentais do Yamanaka. Capacidades comuns exigem presença nas duas fichas, no menor nível.',
    'Ações contrárias à natureza permitem nova resistência com dificuldade −2, sem acumular essa redução. Suicídio cancela antes da ação.',
    control.mode==='disorder'?'Decisão da mesa: Atordoado interrompe a concentração e encerra Desordem Mental.':'Três sucessos de resistência à natureza, consecutivos ou não, encerram a troca; condições internas refletidas acabam com a conexão.']};
 }
 throw Error('Técnica Yamanaka indisponível.');
}

// A possession borrows complete test precisions, not just an attribute bonus.
// This policy does not copy or overwrite either Actor's purchased statistics.
export function mindTestOrigin(stat,{social=false,mode='transfer'}={}){
 if(mode==='disorder')return 'body';
 if(!['transfer','multiple'].includes(mode))throw Error('Modo de controle mental inválido.');
 if(social||stat==='int'||['lidar','disfarce'].includes(stat)||SKILLS[stat]?.[1]==='int')return 'mind';
 return 'body';
}

export function mentalControlParameters(effect,level,intelligence){
 if(!Number.isInteger(level)||level<1||level>10||!Number.isFinite(intelligence)||intelligence<0)
  throw Error('Parâmetros inválidos do controle mental.');
 const difficulty=9+level+Math.ceil(intelligence/2);
 if(effect==='troca-mente')return {mode:'transfer',minimum:1,cost:level,range:5+intelligence,
  durationSeconds:86400*level,maximumDistance:100*(5+intelligence),targets:1,difficulty,reflectedConditionsEndWithConnection:true,
  evasionDifficulty:difficulty-3,reflectedDamage:true,sourceHelpless:true};
 if(effect==='multipla-troca'&&level>=5)return {mode:'multiple',minimum:5,cost:4,range:10,
  durationSeconds:600*level,maximumDistance:1000,targets:2,difficulty,reflectedConditionsEndWithConnection:true,reflectedDamage:true,sourceHelpless:true};
 if(effect==='desordem-mental'&&level>=6)return {mode:'disorder',minimum:6,cost:level,range:10+2*intelligence,
  duration:'concentration',targets:level>=8?3:1,difficulty,reflectedDamage:false,sourceHelpless:false};
 throw Error('Controle mental não disponível neste nível.');
}

export function mindTargetPolicy(mode,{clone=false,living=true,bodyKind='human',irrational=false,capanga=false,sizeIndex=SIZES.medium.index,conditions=[],surpriseAttack=false}={}){
 if(clone)throw Error('Troca de mente não pode ser usada em clones.');
 const immobile=conditions.some(key=>['impedido','agarrado','atordoado','indefeso'].includes(key))||surpriseAttack;
 if(mode==='multiple'){
  if(!['animal','corpse','inanimate'].includes(bodyKind)||!Number.isInteger(sizeIndex)||sizeIndex<0||sizeIndex>SIZES.medium.index)
   throw Error('Múltipla Troca exige dois corpos inanimados, cadáveres ou animais, de tamanho Médio ou menor.');
  return {evasion:living&&bodyKind==='animal'&&!immobile,intelligenceResistance:living&&bodyKind==='animal'&&!irrational&&!capanga};
 }
 if(!['transfer','disorder'].includes(mode))throw Error('Modo de controle mental inválido.');
 if(!living||['corpse','inanimate'].includes(bodyKind))throw Error('Esta técnica exige uma criatura viva.');
 const evasion=mode==='transfer'&&!immobile;
 return {evasion,intelligenceResistance:!(bodyKind==='animal'&&irrational)&&!capanga};
}

export function controlNatureResult(successes,{suicidal=false,resisted=false,mode='transfer'}={}){
 if(!['transfer','multiple','disorder'].includes(mode))throw Error('Modo de controle mental inválido.');
 if(!Number.isInteger(successes)||successes<0||successes>3)throw Error('Contagem de resistências inválida.');
 if(suicidal)return {successes,cancel:true,beforeAction:true,stun:false};
 const total=Math.min(3,successes+(resisted?1:0));
 return {successes:total,cancel:total>=3||mode==='disorder'&&resisted,beforeAction:false,stun:resisted};
}
