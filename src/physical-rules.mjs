// Livro Básico pp. 251, 271–275. Purchased attributes are never overwritten.
export const SIZES=Object.fromEntries([
 ['minuscule','Minúsculo',-7,1,5,-2,-12],['diminutive','Diminuto',-5,1,3,-2,-9],['tiny','Miúdo',-3,1,2,-1,-6],['small','Pequeno',-1,1,1,-1,-3],['medium','Médio',0,1,0,0,0],['large','Grande',1,2,-1,1,3],['huge','Enorme',3,3,-2,1,6],['gargantuan','Imenso',5,4,-3,2,9],['colossal','Colossal',7,5,-5,2,12],['incredible','Incrível',9,6,-7,3,15]
].map(([key,name,attribute,reach,stealth,intimidate,movement],index)=>[key,{key,name,index,attribute,reach,stealth,intimidate,movement}]));
export function sizeProfile(system={}){const saved=system.physical??{},key=saved.size??'medium';if(!SIZES[key])throw Error('Categoria de tamanho desconhecida.');return {...SIZES[key],temporary:!!saved.temporary};}
export function effectiveAttributes(system,{permanentOnly=false}={}){const a={...system.attributes},size=sizeProfile(system),bonus=permanentOnly&&size.temporary?0:size.attribute;for(const k of ['for','vig'])a[k]=Number(a[k]??0)+bonus;return a;}
const sizeOf=value=>typeof value==='string'?SIZES[value]:value?.key?value:sizeProfile(value?.system??value);
export function sizeAttackModifier(attacker,target,{defense='esquiva'}={}){const a=sizeOf(attacker),b=sizeOf(target);if(!a||!b)throw Error('Tamanho desconhecido.');return ['esquiva','bloqueio','antecipar','object'].includes(defense)?Math.max(0,Math.floor((b.index-a.index)/2)):0;}
export function canBlockSize(attacker,target){return sizeOf(attacker).index-sizeOf(target).index<2;}
export function intimidateSizeModifier(attacker,target){return sizeOf(attacker).index===sizeOf(target).index?0:sizeOf(attacker).intimidate;}
export function sizeSweepAllowed(attacker,targets,{maneuver='golpear'}={}){const a=sizeOf(attacker);return a.index>=7&&maneuver==='golpear'&&targets.length>0&&targets.every(t=>a.index-sizeOf(t).index>=3);}
const nonnegative=(value,label)=>{const n=Number(value??0);if(!Number.isFinite(n)||n<0)throw Error(`${label} deve ser um número não negativo.`);return n;};
export function strongestHardness(sources=[]){return Math.max(0,...sources.map(s=>nonnegative(typeof s==='number'?s:s?.value,'Dureza')));}
export function resolveHardness({kind='body',hardness=null,base=0,fixed=0,degree=1,ignore=[],divisions=1,explosionOrWind=false,area=false}={}){
 if(!['body','barrier','object','imaginary','none'].includes(kind))throw Error('Tipo de dureza inválido.');
 hardness=nonnegative(hardness??(kind==='imaginary'?1:0),'Dureza');base=nonnegative(base,'Dano base');fixed=nonnegative(fixed,'Dano fixo');degree=nonnegative(degree,'Grau');
 if(!Number.isInteger(divisions)||divisions<1)throw Error('Quantidade de parcelas inválida.');
 const ignored=ignore.some(v=>v===Infinity||v==='all')?hardness:strongestHardness(ignore),effective=Math.max(0,hardness-ignored),hasDamage=base>0||fixed>0;
 if(kind==='imaginary'&&(!area||!explosionOrWind))return {kind,effective,hardness,broken:false,base,fixed,damage:Math.ceil(base*degree)+fixed,divided:divide(base,divisions)};
 const thresholdBase=base>=effective&&base>0,thresholdFixed=fixed>=2*effective&&fixed>0,broken=kind!=='body'&&kind!=='none'&&hasDamage&&(thresholdBase||thresholdFixed);
 const remainingHardness=kind==='body'||kind==='none'?hardness:broken?0:hasDamage?Math.max(0,hardness-2):hardness;
 const reduces=['body','barrier'].includes(kind),remainingBase=reduces?Math.max(0,base-effective):base,remainingFixed=reduces?Math.max(0,fixed-2*effective):fixed;
 return {kind,effective,ignored,hardness:remainingHardness,broken,base:remainingBase,fixed:remainingFixed,damage:Math.ceil(remainingBase*degree)+remainingFixed,divided:divide(remainingBase,divisions)};
}
function divide(n,count){if(count===1)return[n];if(!Number.isInteger(n))throw Error('Dano base deve ser inteiro antes de dividir.');return Array.from({length:count},(_,i)=>Math.floor(n/count)+(i<n%count?1:0));}
export function objectDefense({moving=false,carried=false}={}){if(carried)return {maneuver:'desarmar',difficulty:null};return {maneuver:null,difficulty:moving?9:5};}
// Same-environment concealments use the strongest one. Darkness and personal
// causes each retain their own check (p.273); they never become a summed chance.
export function camouflagePlan(sources=[],{critical=false,sensor=false,located=false,knownPresence=false,vagueLocation=false,areaFraction=0,weaponShot=false,preciseShotLevel=0,blindFight=false}={}){
 const groups=new Map();for(const source of sources.filter(s=>s.active!==false)){
  if(!['partial','total'].includes(source.level))throw Error('Camuflagem deve ser parcial ou total.');
  const group=source.group==='darkness'?'darkness':source.group==='personal'?'personal:'+(source.id??'vision'):'environment',threshold=source.level==='total'?4:2;
  const existing=groups.get(group);if(!existing||existing.threshold<threshold)groups.set(group,{...source,group,threshold});
 }
 const checks=[];let blocked=false;const notes=[];
 for(const source of groups.values()){
  const shotIgnores=weaponShot&&(preciseShotLevel>=2||preciseShotLevel>=1&&source.level==='partial');
  const locatedByShot=weaponShot&&preciseShotLevel>=2&&knownPresence&&vagueLocation;
  if(source.level==='total'&&!located&&!sensor&&!locatedByShot)blocked=true;
  const areaBypasses=source.group==='environment'&&areaFraction>=source.threshold/8;
  if(critical||sensor||shotIgnores||areaBypasses)continue;
  checks.push({...source,reroll:!!blindFight&&(!source.group.startsWith('personal:')||source.visualImpairment===true)});
 }
 if(blocked)notes.push('Localize o alvo antes de atacar. Sem localização, a tentativa falha automaticamente.');
 return {allowed:!blocked,checks,notes,desprevenido:[...groups.values()].some(s=>s.level==='total')&&!sensor&&!blindFight,source:'Livro Básico p. 273'};
}
export function camouflageResult(plan,rolls=[]){let i=0;const checks=plan.checks.map(c=>{const first=Number(rolls[i++]);if(!Number.isInteger(first)||first<1||first>8)throw Error('Informe resultado de 1d8 por camuflagem.');let second=null,passed=first>c.threshold;if(!passed&&c.reroll){second=Number(rolls[i++]);if(!Number.isInteger(second)||second<1||second>8)throw Error('Falta a repetição de Lutar às Cegas.');passed=second>c.threshold;}return {...c,first,second,passed};});return {passed:plan.allowed&&checks.every(c=>c.passed),checks};}
