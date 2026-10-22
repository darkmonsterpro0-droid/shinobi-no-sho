import {aptitudeOwned} from './aptitudes.mjs';
export const MANEUVERS={golpear:'Golpear',agarrar:'Agarrar',atropelar:'Atropelar',derrubar:'Derrubar',desarmar:'Desarmar',empurrar:'Empurrar','ataque-atordoante':'Ataque Atordoante','ataque-giratorio':'Ataque Giratório','ataque-multiplo':'Ataque Múltiplo','ataque-poderoso':'Ataque Poderoso','chute-duplo':'Chute Duplo','chute-giratorio':'Chute Giratório','chute-inverso':'Chute Inverso','derrubar-agressivo':'Derrubar Agressivo','desarme-agressivo':'Desarme Agressivo','golpe-atemi':'Golpe Atemi','golpe-carate':'Golpe Caratê',rasteira:'Rasteira','soco-agarrado':'Soco Agarrado','soco-em-gancho':'Soco em Gancho',voadora:'Voadora','agarrar-agressivo':'Agarrar Agressivo','desarme-a-distancia':'Desarme à Distância','flechada-no-joelho':'Flechada no Joelho'};
const basics=['golpear','agarrar','atropelar','derrubar','desarmar','empurrar'];
export function availableManeuvers(items,rules={}){return Object.fromEntries(Object.entries(MANEUVERS).filter(([k])=>basics.includes(k)||aptitudeOwned(items,k,'',rules)));}
export function splitDamage(base,count){if(!Number.isInteger(count)||count<2||count>3)throw Error('Ataque Múltiplo exige dois ou três ataques.');if(!Number.isInteger(base)||base<0)throw Error('Dano base inválido.');return Array.from({length:count},(_,i)=>Math.floor(base/count)+(i<base%count?1:0));}
const nativeMoves=w=>['whip','spiked-chain','kusarigama','shuang-gou'].includes(w.key)?['agarrar','derrubar','desarmar']:w.key==='nunchaku'?['agarrar','desarmar']:w.key==='monk-spade'?['derrubar','desarmar']:[];
export function maneuverPlan(key,attack,w,system,items=[],rules={},options={}){
 if(!Object.hasOwn(availableManeuvers(items,rules),key))throw Error('Manobra não disponível nesta ficha.');
 const has=k=>!!aptitudeOwned(items,k,'',rules),owned=k=>aptitudeOwned(items,k,'',rules),a=system.attributes??{},unarmed=w.key==='unarmed'||w.key==='nunchaku'&&w.book==='avancado';
 const p={...attack,notes:[],resist:null,condition:null,ignoreHardness:0,action:'Padrão'},cc=Number(a.for??0)+Number(system.automation?.bases?.cc??3);
 const needsUnarmed=['chute-duplo','chute-giratorio','chute-inverso','golpe-atemi','golpe-carate','soco-agarrado','soco-em-gancho','voadora'];
 if(needsUnarmed.includes(key)&&(!unarmed||p.ranged))throw Error('Esta aptidão exige ataque desarmado.');
 if(w.category==='heavy'&&!basics.includes(key)&&key!=='ataque-giratorio')throw Error('Armas pesadas não aceitam esta aptidão de manobra.');
 if(p.ranged&&!['golpear','ataque-multiplo','desarme-a-distancia','flechada-no-joelho'].includes(key))throw Error('Esta manobra exige ataque corpo a corpo.');
 const special=basics.includes(key)&&key!=='golpear';
 if(special){
  const warrior=aptitudeOwned(items,'guerreiro',w.category,rules),native=nativeMoves(w).includes(key),allowed=unarmed||native||warrior&&key!=='agarrar';
  if(!allowed)throw Error('Esta arma não permite essa manobra; use ataque desarmado ou uma arma/aptidão apropriada.');
  if(warrior?.system.catalogBook==='avancado'&&w.category==='light'&&key!=='desarmar')throw Error('Guerreiro com armas leves permite somente Desarmar.');
  if(!(unarmed&&has('lutador')||warrior||native))p.penalty-=2;
  if(native&&warrior?.system.catalogBook==='avancado')p.bonus+=1;
  p.base=0;p.condition=key==='derrubar'||key==='atropelar'?'caido':key==='agarrar'?'impedido':null;
  if(key==='atropelar'){p.action='Completa';p.notes.push('Usa Investida; requer avanço em linha reta. A defesa determina se o avanço é detido.');}
  if(key==='agarrar')p.notes.push('Exige mãos livres ou arma que agarre. Manter custa ação padrão; ambos ficam impedidos e o atacante fica lento.');
 }
 if(key==='ataque-atordoante'){p.base=0;p.resist={stat:'vig',difficulty:7+Number(a.for??0)};p.condition='atordoado';p.notes.push('Se acertar, falha em Vigor deixa Atordoado até o fim do próximo turno do alvo.');}
 if(['ataque-giratorio','chute-giratorio'].includes(key))p.notes.push('Um teste de acerto para todos no alcance corporal; cada alvo se defende.');
 if(key==='ataque-poderoso'){p.penalty-=1;p.base+=1;}
 if(key==='chute-giratorio')p.base+=2;
 if(key==='chute-inverso')p.notes.push('Finta e ataque na mesma ação padrão. O alvo não pode usar Bloqueio.');
 if(['derrubar-agressivo','rasteira','agarrar-agressivo','voadora'].includes(key)){
  p.resist={stat:'vig',difficulty:2+cc};p.condition=key==='agarrar-agressivo'?'impedido':'caido';
  if(key==='rasteira'){p.bonus+=1;if(!options.aggressive)p.base=0;else if(!has('derrubar-agressivo'))throw Error('Combinar Rasteira com dano exige Derrubar Agressivo.');}
  if(key==='voadora'){p.penalty-=1;p.base+=2;p.resist.difficulty+=3;p.action='Completa';p.notes.push('Investida sem seu bônus de acerto. Sofre −1 na defesa até o início do próximo turno.');}
  p.notes.push('O dano é causado ao acertar; o teste de Vigor evita a condição.');
  if(key==='agarrar-agressivo')p.notes.push('Não permite ataques adicionais na mesma rodada.');
 }
 if(key==='desarme-agressivo')p.notes.push('Ao acertar, causa dano e desarma.');
 if(key==='golpe-atemi'){p.penalty-=1;p.base+=2;p.notes.push('Exige pontos vitais desprotegidos. O bônus também se aplica a crítico de ataque sem aptidão de manobra.');}
 if(key==='golpe-carate'){p.ignoreHardness=options.object?10:2;}
 if(key==='soco-agarrado')p.notes.push('Bloqueio não permitido; alvo deve estar desarmado ou usando arma leve.');
 if(['desarme-a-distancia','flechada-no-joelho'].includes(key)){
  if(!p.ranged)throw Error('Esta aptidão exige arremesso ou disparo.');const level=Number(owned(key).system.level??1);
  if(level===1)p.base=0;else p.degreePenalty=1;
  p.notes.push(key==='desarme-a-distancia'?'Acerto desarma. No nível 2, crítico arremessa a arma a ½ DES metros.':'Acerto derruba. No nível 2, crítico também deixa Lento até o fim do próximo turno do alvo.');
  p.condition=key==='flechada-no-joelho'?'caido':null;
 }
 const multi=['ataque-multiplo','chute-duplo','soco-em-gancho'].includes(key);
 if(multi){const count=key==='chute-duplo'?2:Number(options.count??2),reduction=Number(options.hardness??0);if(!Number.isFinite(reduction)||reduction<0)throw Error('Redução de dano inválida.');
  p.attacks=splitDamage(Math.max(0,p.base-reduction),count).map((base,i)=>({base,bonus:p.bonus,penalty:p.penalty,notes:[]}));
  if(key==='chute-duplo'){p.attacks[0].base+=2;p.attacks[0].notes.push('Chute Giratório: +2 somente na parcela do primeiro golpe (decisão da mesa).');p.notes.push('Segundo ataque recebe +1 de acerto somente se o primeiro acertar.');}
  if(key==='soco-em-gancho'){p.attacks.at(-1).base+=1;p.attacks.at(-1).bonus+=1;}
  p.notes.push('Somente o primeiro ataque permite defesas que não sejam reações ou aptidões/técnicas defensivas; grau é individual.');
 }
 p.precision=p.purchased+p.bonus+Math.max(-3,p.penalty);return p;
}
