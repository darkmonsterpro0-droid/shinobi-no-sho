// Rule metadata and original interface summaries; full book text is not distributed.
export const ELEMENTS=['doton','fuuton','katon','raiton','suiton'];
export const POWER_FAMILIES={
 ninpou:{name:'Ninpou',page:91,effects:true,range:[10,2],size:1,damage:0,hardness:0},
 doton:{name:'Doton',page:103,effects:true,range:[5,1],size:1,damage:0,hardness:2,solid:true},
 fuuton:{name:'Fuuton',page:105,effects:true,range:[10,2],size:1,damage:2,hardness:0},
 katon:{name:'Katon',page:107,effects:true,range:[10,2],size:2,damage:2,hardness:0},
 raiton:{name:'Raiton',page:109,effects:true,range:[15,3],size:.5,damage:1,hardness:0},
 suiton:{name:'Suiton',page:111,effects:true,range:[10,2],size:1,damage:0,hardness:0},
 fuuinjutsu:{name:'Fuuinjutsu',page:114,requirement:'Inteligência 6'},
 'iryou-ninjutsu':{name:'Iryou Ninjutsu',page:120,requirement:'Ninja Médico; Espírito 6'},
 rasengan:{name:'Rasengan',page:121,requirement:'Espírito 8'}
};
const all=['ninpou',...ELEMENTS],solid=['ninpou','doton','suiton'],fluid=['ninpou','doton','fuuton','suiton'];
const effect=(key,name,tiers,families,page,extra={})=>({key,name,tiers,families,page,book:'basico',...extra});
export const POWER_EFFECTS=[
 effect('canhao','Canhão',[1],all,95),
 effect('criar-arma','Criar Arma',[2,6],solid,95,{action:'partial',duration:'sustained',seals:false}),
 effect('orbe','Orbe',[2,7],all,96),effect('raio','Raio',[2,5,8],all,96),
 effect('restringente','Restringente',[2,6],solid,97,{duration:'continuous',area:'circle'}),
 effect('barreira','Barreira',[3,6,9],fluid,97,{action:'movement',duration:'sustained'}),
 effect('flechas','Flechas',[3,6,9],all,98),effect('lanca','Lança',[3,6,9],solid,99),
 effect('ricochete','Ricochete',[3,9],all,99),effect('coluna','Coluna',[4,7,10],all,99,{area:'cylinder'}),
 effect('energizar','Energizar',[4],all,100,{action:'partial',duration:'sustained',seals:false}),
 effect('nuvem','Nuvem',[4,7,10],fluid,100,{duration:'concentration',area:'circle'}),
 effect('sopro','Sopro Destrutivo',[4,7,10],all,101,{area:'cone'}),
 effect('correnteza','Correnteza',[5,8],fluid,101,{area:'wave'}),
 effect('missil','Míssil',[5,8,10],all,101,{area:'line'}),
 effect('onda-explosiva','Onda Explosiva',[5,8],all,102,{area:'sphere'}),
 effect('algemar','Algemar',[6,8,10],solid,102,{duration:'concentration'}),
 effect('imergir','Imergir',[2,4],['doton','suiton'],103,{action:'full',duration:'continuous'}),
 effect('tremor','Tremor',[2,4],['doton'],104,{area:'circle'}),
 effect('pele-pedra','Pele de Pedra',[6,9],['doton'],104,{action:'movement',duration:'sustained',seals:false}),
 effect('venenoso','Venenoso',[5],['fuuton','suiton'],106,{area:'cone'}),
 effect('afiar','Afiar',[6],['fuuton'],106,{action:'partial',duration:'sustained',seals:false,requires:'energizar'}),
 effect('lamina-vento','Lâmina de Vento',[7,10],['fuuton'],106,{action:'full',seals:false,requires:'energizar'}),
 effect('inflamavel','Inflamável',[5,8],['fuuton','katon','suiton'],108,{action:'movement',area:'circle'}),
 effect('meteoros','Meteoros',[9],['katon','raiton'],108,{action:'full',area:'spheres'}),
 effect('lamina-raios','Lâmina de Raios',[2,5,7,9],['raiton'],109,{action:'movement',duration:'sustained',requirement:'Espírito 8'}),
 effect('arma-eletrica','Arma Elétrica',[4,8],['raiton'],110,{action:'partial',duration:'sustained',seals:false,requires:'lamina-raios'}),
 effect('descarga','Descarga',[6],['raiton'],111,{area:'sphere'}),
 effect('nevoa','Névoa',[2,5],['suiton'],112,{duration:'sustained',area:'circle',requirement:'Lutar às Cegas ou sensor'}),
 effect('prisao-agua','Prisão de Água',[3,9],['suiton'],112,{duration:'concentration'}),
 effect('colisao-ondas','Colisão de Ondas',[6,8,10],['suiton'],113,{duration:'concentration',area:'wave'}),
 effect('dano-continuo','Dano Contínuo',[2,7],['katon','raiton'],48,{book:'avancado'}),
 effect('deslocamento-vacuo','Deslocamento de Vácuo',[2,7],['doton','fuuton','suiton'],49,{book:'avancado',action:'partial',duration:'round'}),
 effect('projetar','Projetar',[2,7],fluid,49,{book:'avancado'}),
 effect('purificar','Purificar',[2],['fuuton','suiton'],50,{book:'avancado',area:'circle'}),
 effect('repelir','Repelir',[2,7],fluid,50,{book:'avancado',action:'movement'}),
 effect('cegante','Cegante',[5,8],fluid,52,{book:'avancado'}),
 effect('flutuar','Flutuar',[5],['fuuton'],54,{book:'avancado',action:'movement',duration:'sustained',requirement:'Maestria: Fuuton; Usar Arma: Leque Gigante'}),
 effect('desastre','Desastre',[9],['ninpou','doton','fuuton','raiton','suiton'],55,{book:'avancado',duration:'concentration',area:'circle'})
];
export const POWER_TECHNIQUES={
 fuuinjutsu:[
  {key:'armazenar',name:'Selo de Armazenamento',level:1,page:114},
  {key:'misshi',name:'Misshi · Mensageiro',level:3,page:115},
  {key:'bakudan',name:'Bakudan · Bomba',level:4,page:116},
  {key:'gensou',name:'Gensou no In · Selo de Ilusão',level:5,page:116},
  {key:'wana',name:'Ninjutsu no Wana · Armadilha de Ninjutsu',level:6,page:116},
  {key:'souin',name:'Chakra no Souin · Contenção de Chakra',level:7,page:117},
  {key:'kekkai',name:'Kekkai no In · Barreira de Selo',level:8,page:117},
  {key:'shishou',name:'Shishou Fuuin · Quatro Símbolos',level:8,page:118},
  {key:'keiyaku',name:'Keiyaku Fuuin · Anticontrato',level:9,page:118},
  {key:'shiki',name:'Shiki Fuujin · Demônio da Morte',level:10,page:118}
 ],
 'iryou-ninjutsu':[
  {key:'cura',name:'Tratamento médico',level:1,page:120},
  {key:'bisturi',name:'Chakra no Mesu · Bisturi de Chakra',level:6,page:120},
  {key:'inyu',name:'In’yu Shōmetsu · Recuperação Secreta',level:6,page:121},
  {key:'shousen',name:'Shousen no Jutsu · Mão Mística',level:7,page:121}
 ],
 rasengan:[
  {key:'basico',name:'Rasengan Básico',level:1,page:121},
  {key:'completo',name:'Rasengan Completo',level:6,page:122},
  {key:'oodama',name:'Oodama Rasengan',level:7,page:122},
  {key:'elemental',name:'Rasengan Elemental',level:9,page:123}
 ]
};
export const POWER_ACTION_NAMES={standard:'Padrão',movement:'Movimento',partial:'Parcial',full:'Completa',round:'1 rodada',free:'Livre',reaction:'Reação',ritual:'3 dias'};
export const POWER_DURATION_NAMES={instant:'Instantânea',continuous:'Contínua',sustained:'Sustentada',concentration:'Concentração',permanent:'Permanente',round:'Até o próximo turno'};
export function powerSource(entry){return `${entry.book==='avancado'?'Guia Avançado':'Livro Básico'} p. ${entry.page}`;}
