import {aptitudeOwned} from './aptitudes.mjs';
export const WEAPON_CATEGORIES={unarmed:'Desarmado',light:'Leve',medium:'Mediana',long:'Longa',heavy:'Pesada',throw:'Arremesso',shot:'Disparo',firearm:'Arma de fogo',ammo:'Munição'};
const rows=[
 ['unarmed','Ataque Desarmado','unarmed',0,0,15,0,0,'Esmagamento',true],
 ['short-sword','Espada Curta','light',2,0,15,1,1,'Corte',true],['tanto','Tantō','light',2,0,15,1,1,'Corte',true],['tonfa','Tonfa (par)','light',1,0,15,1,1,'Esmagamento',true,1],
 ['club','Clava','medium',3,0,15,1,1,'Esmagamento',true],['spear','Lança','medium',3,10,15,1,1,'Perfuração',true],['mace','Maça','medium',3,0,15,1,1,'Esmagamento',true],['ninja-to','Ninja-tō','medium',3,0,15,1,1,'Corte',true],
 ['staff','Bastão','long',2,0,15,1,1,'Esmagamento',true,2],['pike','Pique','long',3,0,15,1,1,'Perfuração',true],['great-club','Tacape','heavy',4,0,15,1,1,'Esmagamento',true],
 ['senbon','Senbon','throw',1,20,15,15,1,'Perfuração',true],['shuriken','Shuriken','throw',1,20,15,18,1,'Perfuração',true],['kunai','Kunai','throw',1,15,15,10,1,'Perfuração',true],
 ['short-bow','Arco Curto','shot',1,25,15,1,1,'Perfuração',true],['light-crossbow','Besta Leve','shot',2,25,15,1,1,'Perfuração',true],
 ['aian','Aian Nakkuru (par)','light',1,15,15,1,1,'Corte',false,1],['nunchaku','Nunchaku','light',2,0,15,1,1,'Esmagamento',false],['sai','Sai (par)','light',1,20,15,1,1,'Perfuração',false,1],['wakizashi','Wakizashi','light',2,0,15,1,1,'Corte',false],
 ['whip','Chicote','medium',0,0,15,1,1,'Corte',false],['chokuto','Chokutō','medium',4,0,15,1,1,'Corte',false],['scimitar','Cimitarra','medium',2,0,14,1,1,'Corte',false],['spiked-chain','Corrente com Cravos','medium',1,0,15,1,1,'Perfuração',false],['long-sword','Espada Longa','medium',4,0,15,1,1,'Corte',false],['rapier','Florete','medium',2,0,14,1,1,'Perfuração',false],['katana','Katana','medium',3,0,15,1,1,'Corte',false],['axe','Machado','medium',3,0,15,1,1,'Corte',false],['war-hammer','Martelo de Guerra','medium',3,0,15,1,1,'Esmagamento',false],
 ['scythe','Foice','long',4,0,15,1,2,'Corte',false],['fan','Leque Gigante','long',2,0,15,1,2,'Esmagamento',false],['double-sword','Espada de Duas Lâminas','heavy',2,0,15,1,2,'Corte',false,2],['great-sword','Espada Grande','heavy',5,0,15,1,2,'Corte',false],['great-axe','Machado Grande','heavy',5,0,15,1,2,'Corte',false],
 ['fuuma-giant','Fuuma Shuriken: Gigante','throw',5,20,15,1,1,'Perfuração',false],['fuuma-straight','Fuuma Shuriken: Lâmina Reta','throw',3,20,15,2,1,'Perfuração',false],['fuuma-shadow','Fuuma Shuriken: Kage Fushä','throw',2,20,14,2,1,'Perfuração',false],
 ['long-bow','Arco Composto/Longo','shot',3,'10+2des',15,1,1,'Perfuração',false],['heavy-crossbow','Besta Pesada','shot',4,35,15,1,1,'Perfuração',false],['arrows','Flechas','ammo',0,0,0,20,1,'',true],['bolts','Virotes','ammo',0,0,0,20,1,'',true]
];
export const WEAPONS=rows.map(([key,name,category,damage,range,critical,capacity,slots,damageType,simple,double=0])=>({key,name,category,damage,range,critical,capacity,slots,damageType,simple,double,book:'basico',page:['unarmed','light','medium','long','heavy','throw'].includes(category)&&simple?137:category==='shot'&&simple||['light','medium'].includes(category)?138:139,melee:['unarmed','light','medium','long','heavy'].includes(category)||['kunai','senbon'].includes(key),acuidade:['light'].includes(category)||['unarmed','staff','whip','chokuto','rapier','katana','kunai','senbon','aian'].includes(key)}));
const revised={
 'long-bow':{damage:2,range:'15+3des',page:59},'heavy-crossbow':{damage:5,page:60},
 whip:{damage:1,reach:6,page:61},'spiked-chain':{damage:2,reach:6,page:62},club:{category:'light',damage:2,page:62},
 'double-sword':{dualDamage:5,page:62},'long-sword':{damageType:'Corte/Perfuração',page:63},
 fan:{acuidade:true,requiredAttribute:'des',requiredMinimum:8,page:65},axe:{damage:4,page:65},
 'ninja-to':{category:'light',damage:1,critical:14,simple:false,acuidade:true,page:65},nunchaku:{page:65},shuriken:{capacity:30,page:67}
};
for(const[key,patch]of Object.entries(revised))WEAPONS.push({...WEAPONS.find(w=>w.key===key),...patch,book:'avancado'});
for(const[key,name,category,damage,range,capacity,slots,type,page,extra]of [
 ['chakram','Chakram','medium',3,20,2,1,'Corte',61,{double:1,thrownDamage:5,acuidade:true}],
 ['hidden-shooter','Disparador Oculto','shot',4,15,2,1,'Perfuração',62,{}],
 ['gladius','Gládio','light',2,0,1,1,'Perfuração',63,{}],
 ['kusarigama','Kusarigama','medium',1,0,1,1,'Corte/Esmagamento',64,{double:1,dualDamage:3,reach:6,acuidade:true}],
 ['hidden-blade','Lâmina Oculta','medium',3,0,2,1,'Perfuração',64,{double:1,acuidade:true}],
 ['otsuchi','Ōtsuchi','long',4,0,1,2,'Esmagamento',66,{}],
 ['monk-spade','Pá de Monge','medium',2,0,1,1,'Esmagamento/Corte/Perfuração',66,{double:2,acuidade:true}],
 ['tachi','Tachi','light',2,0,1,2,'Corte',67,{requiredAttribute:'for',requiredMinimum:6}],
 ['shuang-gou','Shuang Gou','medium',1,0,2,1,'Corte/Perfuração',67,{double:1,dualDamage:3,acuidade:true}],
 ['tekko','Tekko','medium',3,0,2,1,'Esmagamento',68,{double:1}],
 ['yari','Yari','long',4,0,1,2,'Perfuração',68,{}],
 ['flint-small','Pistola de Pederneira Pequena','firearm',1,20,2,1,'Perfuração',57,{requiredAttribute:'des',requiredMinimum:0,handling:10}],
 ['flint','Pistola de Pederneira','firearm',2,25,2,1,'Perfuração',58,{requiredAttribute:'des',requiredMinimum:8,handling:14}],
 ['blunderbuss','Bacamarte','firearm',4,20,1,1,'Perfuração',58,{requiredAttribute:'des',requiredMinimum:10,handling:18}],
 ['arquebus','Arcabuz','firearm',4,'10+2des',1,1,'Perfuração',58,{requiredAttribute:'des',requiredMinimum:10,handling:16}],
 ['musket','Mosquete','firearm',5,'15+3des',1,1,'Perfuração',58,{requiredAttribute:'des',requiredMinimum:12,handling:22}],
 ['bullets','Munição para armas de fogo','ammo',0,0,20,1,'',58,{}]
])WEAPONS.push({key,name,category,damage,range,capacity,slots,damageType:type,page,critical:15,simple:false,book:'avancado',melee:!['firearm','shot','ammo'].includes(category),acuidade:category==='light',...extra});
export function weaponRequirements(w,s,has=()=>false){const a=s.attributes??{},max=Math.max(a.for??0,a.des??0),errors=[];
 if(w.requiredAttribute){if(Number(a[w.requiredAttribute]??0)<w.requiredMinimum)errors.push(`${w.requiredAttribute.toUpperCase()} ${w.requiredMinimum}.`);return errors;}
 if(w.category==='light'&&max<(w.key==='aian'?10:8))errors.push(`Força ou Destreza ${w.key==='aian'?10:8}.`);
 if(['medium','long'].includes(w.category)&&max<10)errors.push('Força ou Destreza 10.');
 if(w.category==='heavy'&&Number(a.for??0)<12)errors.push('Força 12.');
 if(w.category==='shot'&&Number(a.des??0)<(w.simple?8:10))errors.push(`Destreza ${w.simple?8:10}.`);
 if(w.key.startsWith('fuuma-')){const min=w.key==='fuuma-giant'?12:w.key==='fuuma-straight'?10:8;if(max<min)errors.push(`Força ou Destreza ${min}.`);if(w.key!=='fuuma-giant'&&!has('ponto-cego'))errors.push('Ponto Cego.');}
 return errors;
}
export function weaponRange(w,s,has=()=>false){let range=typeof w.range==='number'?w.range:(w.range==='15+3des'?15+3*Number(s.attributes.des??0):10+2*Number(s.attributes.des??0));if(has('tiro-longo')&&['shot','firearm'].includes(w.category))range*=2;return range;}
export function rangePenalty(distance,range,extended=false){if(!Number.isFinite(distance)||distance<0)throw Error('Distância inválida.');if(distance<=range)return 0;if(!range)throw Error('Esta arma não tem alcance à distância.');if(extended)return -2*Math.ceil((distance-range)/(range*.5));if(distance>range*4)throw Error('Alvo fora do alcance máximo de quatro incrementos.');return distance<=range*2?-1:-3;}
export function damageDegree(natural,critical=15){return natural<=3?0:natural>=critical?4:natural<=8?1:natural<=11?2:3;}
export function weaponAttack(w,s,items=[],rules={},options={}){
 const has=(key,selection='')=>!!aptitudeOwned(items,key,selection,rules),ranged=options.mode==='ranged'||!w.melee;
 const errors=weaponRequirements(w,s,has);if(errors.length)throw Error(errors.join(' '));
 if(ranged&&!w.range)throw Error('Esta arma não permite ataques à distância.');
 const a=s.attributes??{},stat=ranged?'cd':'cc',attribute=ranged?'des':w.acuidade&&has('acuidade')?'des':'for';
 const purchased=Number(a[attribute]??0)+Number(s.automation?.bases?.[stat]??3);
 let bonus=0,penalty=0,damage=w.damage,units=1;
 const proficiency=w.simple||has('usar-arma',w.key)||(w.key==='wakizashi'&&has('usar-arma','katana'))||(w.category==='firearm'&&has('usar-polvora'));
 if(!proficiency)penalty-=3;
 if(has('especialista',w.category))bonus+=1;
 if(options.offhand&&!has('ambidestria'))penalty-=3;
 let range=ranged?weaponRange(w,s,has):w.reach??(['whip','spiked-chain'].includes(w.key)?4:['long'].includes(w.category)?2:1);
 const longShot=aptitudeOwned(items,'tiro-longo','',rules);if(ranged&&w.category==='throw'&&longShot?.system.catalogBook==='avancado')range*=2;
 if(ranged)penalty+=rangePenalty(Number(options.distance??0),range,rules.extendedRange&&['shot','firearm'].includes(w.category));
 else if(Number(options.distance??0)>range)throw Error('Alvo fora do alcance corpo a corpo.');
 if(['kunai','shuriken','senbon'].includes(w.key)&&ranged){const efficient=has('arremessador-eficiente');units=Number(options.units??(efficient?1:3));if(!(efficient?[1,2,3,6]:[3,6]).includes(units))throw Error(efficient?'Escolha 1, 2, 3 ou 6 projéteis.':'Para causar dano, lance 3 ou 6 projéteis.');damage=units===2||units===6?2:1;}
 if(!ranged&&options.dual){if(!has('ambidestria')||!w.double)throw Error('Esta combinação exige Ambidestria e arma dupla/em par.');damage=w.dualDamage??damage+w.double;}
 if(ranged&&w.thrownDamage)damage=w.thrownDamage;
 if(w.key==='blunderbuss'&&Number(options.distance??0)<=10)damage+=Number(a.des??0)>=12?2:1;
 if(w.key==='unarmed'&&has('punho-de-ferro'))damage=Math.min(4,Number(a.for??0)>=12?4:Number(a.for??0)>=10?3:Number(a.for??0)>=8?2:1);
 if(w.key==='rapier'&&!has('acuidade'))damage-=1;
 const improved=aptitudeOwned(items,'critico-aprimorado','',rules),improves=improved&&(improved.system.catalogBook==='avancado'?(rules.banCombatAptitudes||has('especialista',w.category)):improved.system.selection===w.key);
 const critical=w.key==='fuuma-shadow'?14:w.critical-(improves?1:0);
 let base=Math.ceil(Number(a[ranged?'des':'for']??0)/2)+damage;
 const marksman=aptitudeOwned(items,'atirador',w.category==='throw'&&w.simple?'throw':['short-bow','long-bow'].includes(w.key)?'bows':'!',rules);
 if(ranged&&marksman)base+=w.category==='throw'?3:marksman.system.catalogBook==='avancado'?2:1;
 if((rules.automaticExtraDamage||has('dano-extra',w.category))&&purchased>=18)base+=1+Math.floor((purchased-18)/2);
 return {precision:purchased+bonus+Math.max(-3,penalty),bonus,penalty,purchased,base,critical,range,units,ranged,stat,proficiency};
}
