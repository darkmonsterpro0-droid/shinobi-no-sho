// Livro Básico pp. 76–80. Values here describe a casting, never a purchase.
export const CLONE_PASSIVES=['punho-de-ferro','especialista','maestria','intuicao','reflexos','acuidade'];
export const CLONE_TYPES={'generic-atirador':'Clone genérico: atirador','generic-resistente':'Clone genérico: resistente','generic-enganador':'Clone genérico: enganador','iwa-bunshin':'Iwa Bunshin','kage-bunshin':'Kage Bunshin','mizu-bunshin':'Mizu Bunshin'};
export function clonePlan({knownLevel=1,count=1,type,existing=[],vitality,maximumVitality,chakra,spirit=0,turn='',dismissedTurn=null}){
 if(!Object.hasOwn(CLONE_TYPES,type))throw Error('Tipo de clone comum inválido.');
 if(![1,2].includes(knownLevel))throw Error('Nível de Clone não conhecido.');
 if(!Number.isInteger(count)||count<1)throw Error('Informe uma quantidade inteira de clones.');
 if(turn&&dismissedTurn===turn)throw Error('Não pode recriar clones no turno em que um clone foi desfeito.');
 // Mesa: the third active copy changes every common clone's combat tests.
 const limit=knownLevel===1?2:6,total=existing.length+count,version=total>2?2:1;
 if(existing.some(c=>c.trueClone||c.perfect))throw Error('Desfaça o clone verdadeiro/perfeito antes de criar outros clones.');
 if(total>limit)throw Error(`Esta combinação permite manter no máximo ${limit} clones.`);
 if(existing.some(c=>c.type==='kage-bunshin')||type==='kage-bunshin'&&existing.length)throw Error('Desfaça os clones existentes antes de criar Kage Bunshins.');
 for(const[label,value]of [['Vitalidade atual',vitality],['Vitalidade máxima',maximumVitality],['Chakra atual',chakra],['Espírito',spirit]])if(value==null||!Number.isFinite(value)||value<0)throw Error(`${label} deve estar preenchido e não negativo.`);
 const kage=type==='kage-bunshin',cost=kage?0:count,lifeCost=kage?count*3:0;
 if(chakra<cost)throw Error('Chakra insuficiente.');
 if(lifeCost>vitality)throw Error('Vitalidade insuficiente para criar os Kage Bunshins.');
 const cloneChakra=kage?Math.floor(chakra/(count+1)):0,cloneVitality=type==='iwa-bunshin'?Math.ceil(maximumVitality/5):1;
 return {version,count,type,limit,chakraCost:cost,vitalityCost:lifeCost,sourceVitality:vitality-lifeCost,sourceChakra:kage?chakra-count*cloneChakra:chakra-cost,cloneChakra,cloneVitality,hardness:type==='generic-resistente'?Math.max(0,spirit-3):0,automaticCombatFailure:version===2,precisionPenalty:-3};
}
export function cloneTestEffect(clone,stat,{activeCount=1,kind=''}={}){
 if(!clone||clone.dismissed)return {penalty:0,automaticFailure:false,allowed:!clone?.dismissed};
 if(clone.perfect)return {penalty:0,automaticFailure:false,allowed:true};
 const combat=['cc','cd','esq','lm'].includes(stat);
 const except=activeCount===1&&(clone.type==='generic-atirador'&&['cd','esq'].includes(stat)||clone.type==='mizu-bunshin'&&['cc','esq'].includes(stat));
 return {penalty:except?0:clone.precisionPenalty??-3,automaticFailure:combat&&activeCount>2,allowed:true};
}
export function kageReturn(clone,{vitality,chakra,fatigue=[]}={}){
 if(clone.type!=='kage-bunshin'||clone.dismissed)return {chakra:0,fatigue:[]};
 return {chakra:Math.max(0,Number(chakra)||0),fatigue:fatigue.filter(c=>['fatigado','exausto'].includes(c.key)&&(!c.automatic||c.source?.startsWith('Chakra esgotado'))).map(c=>({...c,id:undefined,effect:undefined,legacy:undefined,automatic:undefined}))};
}
