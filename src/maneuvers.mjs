import {aptitudeOwned,normalize} from './aptitudes.mjs';
import {hachimonProfile} from './hachimon-rules.mjs';
export const MANEUVERS={golpear:'Golpear',agarrar:'Agarrar',atropelar:'Atropelar',derrubar:'Derrubar',desarmar:'Desarmar',empurrar:'Empurrar','ataque-atordoante':'Ataque Atordoante','ataque-giratorio':'Ataque Giratório','ataque-multiplo':'Ataque Múltiplo','ataque-progressivo':'Ataque Progressivo','ataque-poderoso':'Ataque Poderoso','chute-duplo':'Chute Duplo','chute-giratorio':'Chute Giratório','chute-inverso':'Chute Inverso','derrubar-agressivo':'Derrubar Agressivo','desarme-agressivo':'Desarme Agressivo','golpe-atemi':'Golpe Atemi','golpe-carate':'Golpe Caratê',rasteira:'Rasteira','soco-agarrado':'Soco Agarrado','soco-em-gancho':'Soco em Gancho',voadora:'Voadora','agarrar-agressivo':'Agarrar Agressivo','desarme-a-distancia':'Desarme à Distância','flechada-no-joelho':'Flechada no Joelho'};
const basics=['golpear','agarrar','atropelar','derrubar','desarmar','empurrar'];
export function availableManeuvers(items,rules={},weapon,mode){
 return Object.fromEntries(Object.entries(MANEUVERS).filter(([key])=>
  (basics.includes(key)||aptitudeOwned(items,key,'',rules))&&
  (!weapon||!maneuverRestriction(key,weapon,mode==='ranged',items,rules))));
}
export function splitDamage(base,count){if(!Number.isInteger(count)||count<2||count>3)throw Error('Ataque Múltiplo exige dois ou três ataques.');if(!Number.isInteger(base)||base<0)throw Error('Dano base inválido.');return Array.from({length:count},(_,i)=>Math.floor(base/count)+(i<base%count?1:0));}
const nativeMoves=w=>['whip','spiked-chain','kusarigama','shuang-gou'].includes(w.key)?['agarrar','derrubar','desarmar']:['nunchaku','tekko'].includes(w.key)?['agarrar','desarmar']:w.key==='monk-spade'?['derrubar','desarmar']:[];
const needsUnarmed=['chute-duplo','chute-giratorio','chute-inverso','golpe-atemi','golpe-carate','soco-agarrado','soco-em-gancho','voadora'];
const rangedMoves=['golpear','ataque-multiplo','ataque-progressivo','desarme-a-distancia','flechada-no-joelho'];
const rangedOnly=['desarme-a-distancia','flechada-no-joelho'];
const isSpecial=key=>basics.includes(key)&&key!=='golpear';
const baseManeuver={
 'derrubar-agressivo':'derrubar',rasteira:'derrubar','agarrar-agressivo':'agarrar','desarme-agressivo':'desarmar',
 'desarme-a-distancia':'desarmar','flechada-no-joelho':'derrubar',
};
function specialAccess(key,weapon,items,rules){
 const native=nativeMoves(weapon).includes(key);
 const warrior=aptitudeOwned(items,'guerreiro',weapon.category,rules);
 const warriorAllows=warrior&&key!=='agarrar'&&
  !(warrior.system.catalogBook==='avancado'&&weapon.category==='light'&&key!=='desarmar');
 return {native,warrior,warriorAllows};
}
function maneuverRestriction(key,weapon,ranged,items,rules){
 const unarmed=weapon.key==='unarmed'||weapon.key==='nunchaku'&&weapon.book==='avancado';
 if(key==='ataque-progressivo'&&!aptitudeOwned(items,'ataque-multiplo','',rules))return 'Ataque Progressivo exige Ataque Múltiplo.';
 if(needsUnarmed.includes(key)&&(!unarmed||ranged))return 'Esta aptidão exige ataque desarmado.';
 if(weapon.category==='heavy'&&!basics.includes(key)&&key!=='ataque-giratorio')return 'Armas pesadas não aceitam esta aptidão de manobra.';
 if(ranged&&!rangedMoves.includes(key))return 'Esta manobra exige ataque corpo a corpo.';
 if(!ranged&&rangedOnly.includes(key))return 'Esta aptidão exige arremesso ou disparo.';
 if(rangedOnly.includes(key)&&!['throw','shot'].includes(weapon.category))return 'Esta aptidão exige arma de arremesso ou disparo.';
 const special=baseManeuver[key]??key;
 if(isSpecial(special)&&!rangedOnly.includes(key)&&weapon.key!=='unarmed'){
  const {native,warriorAllows}=specialAccess(special,weapon,items,rules);
  if(!native&&!warriorAllows)return 'Esta arma não permite essa manobra; use ataque desarmado ou uma arma/aptidão apropriada.';
 }
 return null;
}
// Básico p. 68 e Guia Avançado p. 33. A versão do Guia aceita Guerreiro da categoria.
export function throwingAptitude(items,weapon,rules={}){
 const aptitude=aptitudeOwned(items,'arremessar','',rules);
 if(!aptitude)return null;
 const allowed=weapon.key==='unarmed'?aptitudeOwned(items,'lutador','',rules):
  (aptitude.system.catalogBook==='avancado'||weapon.category==='heavy')&&aptitudeOwned(items,'guerreiro',weapon.category,rules);
 return allowed?aptitude:null;
}
export function maneuverPlan(key,attack,w,system,items=[],rules={},options={}){
 if(!Object.hasOwn(availableManeuvers(items,rules),key))throw Error('Manobra não disponível nesta ficha.');
 const restriction=maneuverRestriction(key,w,attack.ranged,items,rules);
 if(restriction)throw Error(restriction);
 const has=k=>!!aptitudeOwned(items,k,'',rules),owned=k=>aptitudeOwned(items,k,'',rules),a=system.attributes??{},gates=hachimonProfile(system);
 const p={...attack,notes:[],resist:null,condition:null,ignoreHardness:attack.ignoreHardness??0,action:'Padrão'},cc=Number(a.for??0)+Number(system.automation?.bases?.cc??3);
 const special=baseManeuver[key]??key;
 if(isSpecial(special)&&!rangedOnly.includes(key)){
  // Básico 4.1.b, pp. 267–268. A lista de armas usa o Guia Avançado, pp. 62–69.
  const {native,warrior,warriorAllows}=specialAccess(special,w,items,rules);
  if(!(w.key==='unarmed'&&has('lutador')||warriorAllows||native))p.penalty-=2;
  p.specialManeuver=special;
  if(native&&warrior?.system.catalogBook==='avancado')p.bonus+=1;
  if(basics.includes(key))p.base=0;
  p.condition=special==='derrubar'||special==='atropelar'?'caido':special==='agarrar'?'agarrado':null;
  if(key==='atropelar'){p.action='Completa';p.notes.push('Usa Investida; requer avanço em linha reta. A defesa determina se o avanço é detido.');}
  if(key==='agarrar')p.notes.push('Exige mãos livres ou arma que agarre. Manter custa ação padrão; ambos ficam impedidos e o atacante fica lento.');
 }
 if(key==='ataque-atordoante'){p.base=0;p.resist={stat:'vig',difficulty:7+Number(a.for??0)};p.condition='atordoado';p.notes.push('Se acertar, falha em Vigor deixa Atordoado até o fim do próximo turno do alvo.');}
 if(['ataque-giratorio','chute-giratorio'].includes(key))p.notes.push('Um teste de acerto para todos no alcance corporal; cada alvo se defende.');
 if(key==='ataque-poderoso'){p.penalty-=1;if(!gates)p.base+=1;}
 if(key==='chute-giratorio'&&!gates)p.base+=2;
 // Básico 4.1.b, p. 70.
 if(key==='chute-inverso'){
  p.inlineFeint='Chute Inverso';p.cannotBlock=true;
  p.notes.push('Finta e ataque na mesma ação padrão. O alvo não pode usar Bloqueio.');
 }
 if(['derrubar-agressivo','rasteira','agarrar-agressivo','voadora'].includes(key)){
  // Básico pp. 70–71; Guia p. 32. Rasteira comum é Derrubar sem teste adicional.
  if(key!=='rasteira'||options.aggressive)p.resist={stat:'vig',difficulty:2+cc};
  p.condition=key==='agarrar-agressivo'?'agarrado':'caido';
  if(key==='rasteira'){p.bonus+=1;if(!options.aggressive)p.base=0;else if(!has('derrubar-agressivo'))throw Error('Combinar Rasteira com dano exige Derrubar Agressivo.');}
  if(key==='voadora'){p.penalty-=1;if(!gates)p.base+=2;p.resist.difficulty+=3;p.action='Completa';p.chargeDefensePenalty=1;p.notes.push('Investida sem seu bônus de acerto. Sofre −1 na defesa até o início do próximo turno.');}
  if(p.resist)p.notes.push('O dano é causado ao acertar; o teste de Vigor evita a condição.');
  if(key==='agarrar-agressivo')p.notes.push('Não permite ataques adicionais na mesma rodada.');
 }
 if(key==='desarme-agressivo')p.notes.push('Ao acertar, causa dano e desarma.');
 if(key==='golpe-atemi'){p.penalty-=1;if(!gates)p.base+=2;p.notes.push('Exige pontos vitais desprotegidos. O bônus também se aplica a crítico de ataque sem aptidão de manobra.');}
 if(key==='golpe-carate'){p.ignoreHardness=Math.max(p.ignoreHardness,options.object?10:2);}
 if(key==='soco-agarrado')p.notes.push('Bloqueio não permitido; alvo deve estar desarmado ou usando arma leve.');
 if(['desarme-a-distancia','flechada-no-joelho'].includes(key)){
  const level=Number(owned(key).system.level??1);
  // Guia pp. 33–34. Mantém o efeito da manobra e acrescenta a evolução do crítico.
  p.specialManeuver=baseManeuver[key];
  if(level===1)p.base=0;
  else{
   p.degreePenalty=1;
   if(key==='desarme-a-distancia')p.criticalDisarmMetres=Math.ceil(Number(a.des??0)/2);
   else p.criticalSlow=true;
  }
  p.notes.push(key==='desarme-a-distancia'?'Acerto desarma. No nível 2, crítico arremessa a arma a ½ DES metros.':'Acerto derruba. No nível 2, crítico também deixa Lento até o fim do próximo turno do alvo.');
  p.condition=key==='flechada-no-joelho'?'caido':null;
 }
 const multi=['ataque-multiplo','ataque-progressivo','chute-duplo','soco-em-gancho'].includes(key);
 if(multi){const count=key==='chute-duplo'?2:Number(options.count??2),reduction=Number(options.hardness??0);if(!Number.isFinite(reduction)||reduction<0)throw Error('Redução de dano inválida.');
  p.attacks=splitDamage(Math.max(0,p.base-reduction),count).map((base,i)=>({base,damagePool:p.base,divisionCount:count,divisionIndex:i,postDivisionBonus:0,bonus:p.bonus,penalty:p.penalty,notes:[]}));
  if(key==='ataque-progressivo'){
   // Básico p. 69. Só o último golpe recebe o bônus das rolagens adicionais.
   const hachimon=Math.max(0,...items.filter(item=>item.type==='power'&&
    [item.name,item.system?.powerData?.family].some(value=>['hachimon','hachimon-tonkou'].includes(normalize(value))))
    .map(item=>Number(item.system.level)||0));
   p.attacks.at(-1).progressiveRolls=Number(a.agi??0)>=16||hachimon>=7?3:2;
   if(gates&&!options.hachimonLotusProgressive){p.attacks.at(-1).progressiveRolls=0;p.notes.push('O bônus de Ataque Progressivo só acumula com os portões quando adquirido pelo Estilo da Lótus (Básico p. 69).');}
   p.notes.push('Se o último golpe acertar, role novamente contra a última defesa. Cada acerto soma +1 ao dano base desse golpe.');
  }
  if(key==='chute-duplo'){if(!gates){p.attacks[0].base+=2;p.attacks[0].postDivisionBonus=2;p.attacks[0].notes.push('Chute Giratório: +2 somente na parcela do primeiro golpe (decisão da mesa).');}p.notes.push('Segundo ataque recebe +1 de acerto somente se o primeiro acertar.');}
  if(key==='soco-em-gancho'){if(!gates){p.attacks.at(-1).base+=1;p.attacks.at(-1).postDivisionBonus=1;}p.attacks.at(-1).bonus+=1;}
  p.notes.push('Somente o primeiro ataque permite defesas que não sejam reações ou aptidões/técnicas defensivas; grau é individual.');
 }
 if(options.throwTarget){
  const aptitude=throwingAptitude(items,w,rules);
  if(!aptitude||p.ranged||!['derrubar','derrubar-agressivo','rasteira'].includes(key))
   throw Error('Arremessar exige Derrubar e uma arma compatível com a aptidão.');
  const metres=Math.min(10,Math.max(0,Number(a.for??0)));
  p.throwTarget={metres,collision:aptitude.system.catalogBook==='avancado'?metres:0,
   followShadow:has('seguir-sombra')&&key!=='derrubar-agressivo'&&!(key==='rasteira'&&options.aggressive)};
 }
 if(p.condition==='agarrado'&&w.key==='unarmed'&&has('imobilizacao'))p.canImmobilize=true;
 p.precision=p.purchased+p.bonus+Math.max(-3,p.penalty);return p;
}
