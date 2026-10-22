import {powerPurchaseCost} from './power-rules.mjs';
import {ATTRIBUTES,SKILLS} from './config.mjs';
import {progression} from './progression.mjs';
export const RANKS=['Genin','Chuunin','Jounin Especial','Jounin','Jounin Elite','Sannin/Kage','Nukenin'];
export const LINEAGES=['Aburame','Akimichi','Hatake','Hyuuga','Inuzuka','Nara','Sarutobi','Senju','Uchiha','Uzumaki','Yamanaka','Fuuma','Hoshigaki','Hozuki','Kaguya','Yotsuki','Yuki','Shimura','Hoshigakure','Dokujutsu','Hachimon Tonkou','Hibon Ninpou','Jinchuuriki','Kagura Shingan','Kuchiyose','Magen','Senjutsu','Tensai','Jiton','Juuinka','Kamijutsu','Nintaijutsu','Rinnegan','Samurai','Senninka','Bakuton','Buki Senmon','Chouju-Giga','Daikiga','Gorudogumo','Hebinomichi','Jashin Juusha','Jingokuon','Jiongu','Jiton II','Kakuran Tensai','Jinton','Kibaku Nendo','Kuchiyose: Doninha','Kuchiyose: Marisco','Kuchiyose: Salamandra','Kuchiyose: Tartaruga','Kuchiyose: Rashoumon','Kugutsu no Jutsu','Kuroi Kaminari','Mateki','Mei Kekkei Genkai','Nan no Kaizou','Ranton','Rinbo: Hengoku','Shakuton','Shouton','Souma no Jutsu','Zetsu Seitai','Kuchiyose: Macaco','Saika Ikki','Aoi Katon','Sanbi Suiton','Yonbi Youton','Gobi Futton','Rokubi Suiton'].sort((a,b)=>a.localeCompare(b,'pt-BR'));
export const RESTRICTED_SKILLS=['lidar','mecanismos','medicina','ocultismo','veneficio'];
export const SOCIAL_TESTS={acalmar:['Acalmar',['yin'],['int','esp']],compostura:['Compostura',['yin'],['int','esp']],convencer:['Convencer',['yang'],['int','esp']],empatia:['Empatia',['yin'],['per']],encorajar:['Encorajar',['yang'],['esp']],enganar:['Enganar',['yin','yang'],['per','int']],etiqueta:['Etiqueta',['yin'],['per','int']],intimidar:['Intimidar',['yang'],['int','esp']],boatos:['Ouvir e espalhar boatos',['yin','yang'],['per']],presenca:['Presença',['yang'],['int','esp']],provocar:['Provocar',['yang'],['int','esp']]};
export const OPTIONAL_RULES=[
 ['ninpouMist','Névoa para Ninpou','Básico p. 112','Autoriza a compra de Névoa para Ninpou, sem suas evoluções.'],
 ['twoHijutsus','Dois ou mais hijutsus','Básico p. 29','Autoriza combinações; requisitos específicos continuam obrigatórios.'],
 ['optionalXP','Experiência por conquistas','Básico p. 32','Acumula de 0 a 100 EXP por conquistas; ao completar 100, sobe um NC e reinicia a contagem.'],
 ['banCombatAptitudes','Banir Especialista, Maestria, Reflexos e Intuição','Guia p. 89','Retira estas opções de compra e ignora suas exigências em outros requisitos.'],
 ['automaticExtraDamage','Dano Extra automático','Guia pp. 89–90','Benefício gratuito ao atingir CC/CD 18, conforme a arma usada.'],
 ['criticalSpecialization','Especialização de crítico','Guia pp. 96–97','Corte, esmagamento e perfuração aplicam consequências diferentes.'],
 ['groupStealth','Furtividade em grupo','Guia pp. 97–98','Sucesso quando a soma das diferenças contra a dificuldade é não negativa.'],
 ['acceleratedRecovery','Recuperação acelerada entre cenas','Guia p. 98','Mestre escolhe uma das três recuperações publicadas para a cena.'],
 ['gridPlay','Jogo com tabuleiro','Guia pp. 98–99','Permite declarar unidade de 1 ou 2 m e diagonais alternadas.'],
 ['bijuuWithoutJinchuuriki','Poderes das bijuus sem Jinchuuriki','Guia pp. 99–107','Registra a autorização; não concede automaticamente hijutsu ou aptidão.'],
 ['fractionalRest','Frações de descanso para vitalidade','Básico p. 259','Recuperação de vida por hora igual a 1/8 da noite. Chakra exige noite completa.'],
 ['opposedNarrativeTie','Desempatar teste resistido por critérios da cena','Básico p. 249','Por padrão vence a maior precisão. Esta opção reserva o desempate comum à decisão do mestre.'],
 ['extendedRange','Incrementos de alcance de disparo','Guia p. 86','−2 de precisão a cada incremento de 50% além do alcance normal.'],
 ['evadeWithDodge','Evadir usando Esquiva','Guia p. 87','Usa 2d8 + ESQ no lugar de LM; não é a defesa fixa.']
];
export function skillBase(system,key){if(key==='voo')return Number(system.attributes?.agi??0);return Math.ceil(Number(system.attributes?.[SKILLS[key][1]]??0)/2)+Number(system.skills?.[key]?.points??0);}
export function pointBudgets(system,items=[],rules={}){
 const nc=Number(system.campaign?.level??4),p=progression(nc),skills=Object.entries(system.skills??{}).filter(([key])=>key!=='voo').reduce((n,[,v])=>n+Number(v.points??0),0);
 const rate=Number(rules.powerRate??2),powers=p.powers*rate/2;
 const banned=new Set(rules.banCombatAptitudes?['especialista','maestria','reflexos','intuicao']:[]);
 const paid=items.filter(i=>i.type==='power').reduce((n,i)=>n+powerPurchaseCost(i,items),0)+items.filter(i=>i.type==='aptitude'&&!banned.has(i.system.catalogKey)&&!(rules.automaticExtraDamage&&i.system.catalogKey==='dano-extra')&&i.system.acquisition!=='Concedida').reduce((n,i)=>n+2*Math.max(0,Number(i.system.level??1)-(i.system.acquisition==='Gratuita'?1:0)),0);
 const social=Math.max(2,2*p.min),socialSpent=Number(system.social?.yin??0)+Number(system.social?.yang??0);
 return {skills:{total:p.skills,spent:skills,remaining:p.skills-skills,limit:Math.floor(nc/2)},powers:{total:powers,spent:paid,remaining:powers-paid,limit:Math.floor(nc/2)},social:{total:social,spent:socialSpent,remaining:social-socialSpent,limit:Math.floor(nc/2)},free:{total:3,spent:items.filter(i=>i.type==='aptitude'&&i.system.acquisition==='Gratuita'&&!banned.has(i.system.catalogKey)).length}};
}
export function validateBuildChange(system,change,items=[],rules={}){
 const next={...system,skills:{...system.skills},social:{...system.social,...change.social}};
 for(const[k,v]of Object.entries(change.skills??{}))next.skills[k]={...system.skills?.[k],...v,points:v.points===null?0:v.points??system.skills?.[k]?.points??0};
 const b=pointBudgets(next,items,rules),before=pointBudgets(system,items,rules),errors=[];
 for(const[k,v]of Object.entries(change.skills??{}))if(v.points!==undefined){const n=v.points??0;if(!Number.isInteger(n)||n<0||n>b.skills.limit)errors.push(`${SKILLS[k]?.[0]??k}: invista de 0 a ${b.skills.limit} pontos.`);if(k==='veneficio'&&n>Number(system.skills?.veneficio?.points??0)&&!items.some(i=>i.type==='aptitude'&&i.system.catalogKey==='quimico'))errors.push('Venefício exige Químico para ser comprada.');if(k==='voo'&&n)errors.push('Voo segue a fonte que concede voo; não recebe pontos comuns.');}
 if(change.skills&&b.skills.remaining<0&&b.skills.spent>=before.skills.spent)errors.push(`Perícias: ${-b.skills.remaining} ponto(s) excedente(s).`);
 for(const[k,v]of Object.entries(change.social??{}))if(['yin','yang'].includes(k)&&v!==null&&(!Number.isInteger(v)||v<0||v>b.social.limit))errors.push(`${k}: valor de 0 a ${b.social.limit}.`);
 if(change.social&&b.social.remaining<0&&b.social.spent>=before.social.spent)errors.push(`Atributos sociais: ${-b.social.remaining} ponto(s) excedente(s).`);
 return errors;
}
export function simulatedTest(mode,precision,{difficulty=null,inCombat=false,noPressure=false,noRisk=false,unlimitedTime=false}={}){
 if(mode==='roll')return {formula:`2d8 + (${precision})`};
 if(inCombat)throw Error('Não é possível simular dados de perícia em combate.');
 if(mode==='half'){if(difficulty===null||precision<Number(difficulty)-4)throw Error('Simular meio-dado exige precisão ≥ dificuldade −4.');return {total:4+precision,dice:4,label:'Meio-dado simulado'};}

 if(mode==='one'){if(!noPressure)throw Error('Simular 1 dado exige ausência de pressão, a critério do mestre.');return {total:8+precision,dice:8,label:'1 dado simulado'};}
 if(mode==='two'){if(!noRisk||!unlimitedTime)throw Error('Simular 2 dados exige tempo livre e nenhuma consequência de falha.');return {total:16+precision,dice:16,label:'2 dados simulados; tempo ×16'};}
 throw Error('Modo de teste inválido.');
}

export function resolveOpposed(a,b,{tiePrecision=true}={}){const fail=r=>r.natural<=3,crit=r=>r.natural>=15;if(fail(a)&&fail(b)||crit(a)&&crit(b))return 'repeat';if(crit(a)||fail(b))return 'first';if(crit(b)||fail(a))return 'second';if(a.total!==b.total)return a.total>b.total?'first':'second';if(tiePrecision&&a.precision!==b.precision)return a.precision>b.precision?'first':'second';return 'repeat';}
