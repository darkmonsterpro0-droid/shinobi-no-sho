import {APTITUDES} from './aptitude-data.mjs';
import {SKILLS} from './config.mjs';
import {skillBase} from './build-rules.mjs';
export const normalize=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const aliases={'apanhar-objeto':'apanhar-objetos','kai-pefeito':'kai-perfeito'};
export const canonical=key=>aliases[key]??key;
const banned=['especialista','maestria','reflexos','intuicao'];
export function aptitudeItems(items=[],rules={}){return items.filter(i=>i.type==='aptitude'&&i.system?.catalogKey&&!(rules.banCombatAptitudes&&banned.includes(i.system.catalogKey)));}
export function aptitudeOwned(items,key,selection='',rules={}){return aptitudeItems(items,rules).find(i=>canonical(i.system.catalogKey)===canonical(key)&&(!selection||normalize(i.system.selection)===normalize(selection)));}
export function aptitudeCatalog(books=['basico','avancado'],rules={}){
 const rows=APTITUDES.filter(a=>books.includes(a.book)&&!a.key.endsWith('-nivel-2')&&!(rules.banCombatAptitudes&&banned.includes(a.key))&&(rules.aptitudeRevision!=='basico'||a.book!=='avancado'));
 const merged=new Map();for(const a of rows)merged.set(canonical(a.key),{...a,key:canonical(a.key)});
 return [...merged.values()];
}
export function aptitudeBonuses(system,items=[],rules={}){
 const list=aptitudeItems(items,rules),has=key=>list.some(i=>canonical(i.system.catalogKey)===key),a=system.attributes??{};
 const skills={};for(const i of list.filter(i=>i.system.catalogKey==='perito')){const key=Object.keys(SKILLS).find(k=>normalize(k)===normalize(i.system.selection)||normalize(SKILLS[k][0])===normalize(i.system.selection));if(key)skills[key]=2;}
 return {esq:has('reflexos')?1:0,lm:has('intuicao')?1:0,initiative:has('diligente')?3:0,skills,restMultiplier:has('metabolismo-rapido')?2:1,movement:has('velocista')&&!items.some(i=>i.system?.equipped&&i.system?.selection==='heavy-armor')?10+Number(a.agi??0):null,capacity:has('burro-de-carga')?(a.for>=12?6:a.for>=8?5:4):3};
}
export function aptitudeChoices(key,book='basico',weapons=[],items=[]){
 if(key==='ambidestria'&&book==='avancado')return {melee:'Combate corporal',firearm:'Somente armas de fogo (requisito CD)'};
 if(key==='maestria')return Object.fromEntries(items.filter(i=>['power','technique'].includes(i.type)).map(i=>[i.id??i._id,i.name]));
 if(key==='clone')return {'generic-atirador':'Genérico: atirador','generic-resistente':'Genérico: resistente','generic-enganador':'Genérico: enganador','iwa-bunshin':'Iwa Bunshin','kage-bunshin':'Kage Bunshin','mizu-bunshin':'Mizu Bunshin'};
 if(key==='sensor')return {chakra:'Chakra',solo:'Detecção pelo solo',olfato:'Olfato'};
 if(key==='usar-arma'||key==='critico-aprimorado'&&book==='basico')return Object.fromEntries(weapons.filter(w=>key==='usar-arma'?!w.simple&&w.category!=='ammo'&&w.category!=='firearm':w.category!=='ammo').map(w=>[w.key,w.name]));
 if(key==='guerreiro')return book==='basico'?{long:'Armas longas',heavy:'Armas pesadas'}:{light:'Armas leves',medium:'Armas medianas',long:'Armas longas',heavy:'Armas pesadas'};
 if(['especialista','dano-extra'].includes(key))return {unarmed:'Ataque desarmado',light:'Armas leves',medium:'Armas medianas',long:'Armas longas',heavy:'Armas pesadas',throw:'Armas de arremesso',shot:'Armas de disparo',firearm:'Armas de fogo'};
 if(['perito','pericia-inata'].includes(key))return Object.fromEntries(Object.entries(SKILLS).filter(([k])=>k!=='voo').map(([k,[name]])=>[k,name]));
 if(key==='resistencia-maior')return {for:'Força',des:'Destreza',agi:'Agilidade',per:'Percepção',int:'Inteligência',vig:'Vigor',esp:'Espírito'};
 if(key==='atirador')return {bows:'Arcos',throw:'Armas simples de arremesso'};
 return null;
}
export function aptitudeEntry(key,book){return APTITUDES.find(a=>canonical(a.key)===canonical(key)&&a.book===book);}
export function evolutionStatus(item,system,items=[],rules={}){
 const key=canonical(item.system.catalogKey),level=Number(item.system.level??1),advanced=rules.aptitudeRevision!=='basico',a=system.attributes??{},sk=k=>skillBase(system,k);
 const cc=Number(a.for??0)+Number(system.automation?.bases?.cc??3),cd=Number(a.des??0)+Number(system.automation?.bases?.cd??3);
 const tests={
  'lutar-as-cegas':level===1&&sk('prontidao')>=(advanced?11:12),trespassar:level===1&&cc>=9,
  clone:level===1&&a.esp>=8,'kyoudo-kyouka':level===1&&a.esp>=10,'replica-enganadora':level===1&&sk('prestidigitacao')>=12,
  shunjutsu:level<3&&Math.max(a.des??0,a.int??0)>=(level===1?12:16),
  diligente:advanced&&level===1&&Number(a.agi??0)+sk('prontidao')>=21,
  oportunista:advanced&&level===1&&a.des>=13&&(rules.banCombatAptitudes||!!aptitudeOwned(items,'especialista','shot',rules)||!!aptitudeOwned(items,'especialista','throw',rules)),
  'tiro-preciso':advanced&&level===1&&a.des>=13,
  'estilo-zui-quan':advanced&&level===1&&a.for>=15&&a.vig>=12&&!!aptitudeOwned(items,'resistencia-maior','vig',rules),
  'desarme-a-distancia':advanced&&level===1&&cd>=17&&a.int>=7,'flechada-no-joelho':advanced&&level===1&&cd>=17&&a.int>=7,
  'kuchiyose-rashoumon':level<3&&Math.max(a.int??0,a.esp??0)>=(level===1?12:18)
 };
 const max={shunjutsu:3,'kuchiyose-rashoumon':3};
 const supported=Object.hasOwn(tests,key)&&(!['diligente','oportunista','tiro-preciso','estilo-zui-quan','desarme-a-distancia','flechada-no-joelho'].includes(key)||advanced);
 return {supported,max:supported?(max[key]??2):1,allowed:!!tests[key],level,next:level+1};
}
// Complex choices retain their printed prerequisite in the catalog; this helper
// evaluates numerical and aptitude requirements, never narrative eligibility.
export function prerequisiteStatus(entry,system,items=[],rules={},selection=''){
 const text=entry.requirements??'',a=system.attributes??{},cc=Number(a.for??0)+Number(system.automation?.bases?.cc??3),cd=Number(a.des??0)+Number(system.automation?.bases?.cd??3);
 const stat=(key,n)=>Number(a[key]??0)>=n;
 const has=key=>!!aptitudeOwned(items,key,'',rules)||(rules.banCombatAptitudes&&banned.includes(key));
 const skill=(key,n)=>skillBase(system,key)>=n&&(!['medicina','veneficio','mecanismos','ocultismo','lidar'].includes(key)||Number(system.skills?.[key]?.points??0)>0);
 const power=(name,n)=>items.some(i=>i.type==='power'&&normalize(i.name)===normalize(name)&&Number(i.system.level??0)>=n);
 const known={acuidade:stat('des',3),ambidestria:cc>=12||(entry.book==='avancado'&&selection==='firearm'&&cd>=12),'ataque-em-movimento':stat('agi',4),atirador:stat('des',12),'bloqueio-ambidestro':has('ambidestria'),'combate-defensivo':cc>=9,'critico-aprimorado':has('especialista')&&Math.max(cc,cd)>=13,'dano-extra':Math.max(cc,cd)>=18,guerreiro:Math.max(a.for??0,a.des??0)>=(entry.book==='avancado'&&selection==='light'?8:10),'mira-apurada':stat('des',12)&&has('tiro-longo'),mobilidade:stat('agi',3)&&has('reflexos'),'ponto-cego':stat('agi',6)||skill('prestidigitacao',6),'punho-de-ferro':stat('for',2),'retirada-rapida':stat('agi',entry.book==='avancado'?9:10),rolamento:skill('acrobacia',2)&&has('de-pe'),'tiro-longo':stat('des',entry.book==='avancado'?11:12),'tiro-preciso':stat('des',9),trespassar:cc>=7,'usar-armaduras-pesadas':stat('for',10)||stat('vig',15),'ninja-medico':skill('medicina',7),quimico:stat('int',entry.book==='avancado'?6:8),sensor:skill('rastrear',10),shunjutsu:Math.max(a.des??0,a.int??0)>=10&&has('diligente')&&has('velocista'),'burro-de-carga':stat('for',4),'metabolismo-rapido':stat('vig',1)&&stat('esp',1),'furtividade-agil':skill('furtividade',9),'usar-polvora':skill('mecanismos',2)&&stat('des',2)};
 Object.assign(known,{
 'diligente-nivel-2':has('diligente')&&Number(a.agi??0)+skillBase(system,'prontidao')>=21,
 'mestre-dos-selos':skill('prestidigitacao',12)&&has('ponto-cego'),
 arremessar:stat('for',entry.book==='avancado'?5:6)&&(has('lutador')||has('guerreiro')),
 'ataque-atordoante':stat('for',12),'ataque-giratorio':cc>=8,'ataque-multiplo':Math.max(cc,cd)>=11,
 'ataque-poderoso':cc>=7,'ataque-progressivo':(stat('agi',14)||power('Hachimon Tonkou',6))&&has('ataque-multiplo'),
 'chute-duplo':has('chute-giratorio')&&has('ataque-multiplo'),'chute-giratorio':cc>=10&&has('ataque-giratorio'),
 'chute-inverso':cc>=14&&has('ponto-cego'),contragolpe:cc>=12,
 'derrubar-agressivo':has('lutador')||has('guerreiro'),'desarme-agressivo':has('lutador')||has('guerreiro'),
 'golpe-atemi':has('ataque-poderoso')&&has('critico-aprimorado'),'golpe-carate':cc>=15&&(rules.banCombatAptitudes||!!aptitudeOwned(items,'especialista','unarmed',rules)),
 rasteira:has('lutador')||!!aptitudeOwned(items,'guerreiro','long',rules),
 'seguir-sombra':has('arremessar')&&has('ataque-em-movimento'),'soco-agarrado':has('lutador'),'soco-em-gancho':cc>=11&&has('ataque-multiplo'),voadora:has('derrubar-agressivo')&&has('ataque-poderoso'),
 'dominio-da-agua':power('Suiton',5),'dominio-do-fogo':power('Katon',5),'dominio-do-raio':power('Raiton',5),'dominio-da-terra':power('Doton',5),'dominio-do-vento':power('Fuuton',5),
 'dominio-ninpou':(power('Ninpou',5)||power('Hibon Ninpou',5))&&has('ponto-cego'),
 'ilusao-profunda':stat('int',5),potencializar:Math.max(a.esp??0,a.int??0)>=8,
 'tecnica-acelerada':Math.max(a.esp??0,a.int??0)>=(entry.book==='avancado'?11:12),
 'tecnica-eficiente':Math.max(a.esp??0,a.int??0)>=10,'tecnica-elevada':stat('int',6),'tecnica-poderosa':Math.max(a.esp??0,a.int??0)>=12,
 clone:stat('esp',6),'clone-verdadeiro':stat('esp',10)&&items.some(i=>i.system.catalogKey==='clone'&&['kage-bunshin','moku-bunshin'].includes(normalize(i.system.selection))),
 'clone-perfeito':false,fascinar:stat('int',4),'kyoudo-kyouka':stat('esp',6)&&power('Iryou Ninjutsu',2),miragem:stat('int',2),
 'replica-enganadora':(power('Suiton',4)||power('Doton',4)||has('clone'))&&skill('prestidigitacao',10),
 'trabalho-duro':!system.identity?.clan||normalize(system.identity.clan)==='hachimon-tonkou',
 'arremessador-de-utilitarios':stat('des',7)&&stat('int',4),'arremessador-eficiente':cd>=8,
 'avaliador-do-perigo':Math.max(a.int??0,a.per??0)>=4,'esquiva-de-risco':has('reflexos')&&Number(a.agi??0)+Number(system.automation?.bases?.esq??3)>=11,
 'fuuma-shuriken-kousen':!!aptitudeOwned(items,'usar-arma','kousen',rules)&&items.some(i=>i.system.catalogKey==='usar-arma'&&i.system.selection?.startsWith('fuuma-')),
 'oportunista-nivel-2':has('oportunista')&&stat('des',13)&&(rules.banCombatAptitudes||!!aptitudeOwned(items,'especialista','shot',rules)||!!aptitudeOwned(items,'especialista','throw',rules)),
 'tiro-preciso-nivel-2':has('tiro-preciso')&&stat('des',13),'utilitarista-rapido':stat('des',11)&&stat('int',6)&&has('saque-rapido'),
 'agarrar-agressivo':has('lutador')||has('guerreiro'),'desarme-a-distancia':cd>=11&&stat('int',3),'estilo-zui-quan':has('ponto-cego')&&has('punho-de-ferro')&&stat('vig',8),
 'flechada-no-joelho':cd>=11&&stat('int',3),imobilizacao:has('agarrar-agressivo')&&stat('for',13),
 'instancia-de-falange':cc>=14&&(rules.banCombatAptitudes||!!aptitudeOwned(items,'especialista','long',rules))&&!!aptitudeOwned(items,'guerreiro','long',rules),
 roubar:cc>=11&&skill('prestidigitacao',5),'dominio-simples':power('Ninpou',5)&&!has('dominio-mecanico'),
 'dominio-mecanico':skill('mecanismos',10)&&has('engenheiro')&&!has('dominio-simples'),
 'henge-perfeito':skill('disfarce',4),'ilusao-musical':has('ilusao-profunda')&&skill('arte',11),'kai-perfeito':stat('esp',4),
 'kawarimi-explosivo':has('replica-enganadora'),'kawarimi-perfeito':stat('agi',11)||skill('prestidigitacao',11),
 'mestre-da-criacao':Math.max(a.int??0,a.esp??0)>=7,'tecnica-de-controle-de-chakra':stat('int',5)&&stat('esp',5),
 'tecnica-de-cura-arriscada':power('Iryou Ninjutsu',7),'tecnica-de-impacto':stat('esp',5),
 'envenenar-arma':skill('veneficio',9)&&has('saque-rapido'),encantar:stat('int',5)
 });
 if(Object.hasOwn(known,entry.key))return {allowed:known[entry.key],review:false};
 if(!text.trim())return {allowed:true,review:false};
 if(Object.hasOwn(known,entry.key))return {allowed:known[entry.key],review:false};
 return {allowed:null,review:true};
}
