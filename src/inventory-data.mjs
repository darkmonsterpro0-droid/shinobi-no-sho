// Mechanical catalogue, not a reproduction of the books' descriptive prose.
// Printed pages: Básico 46–52, 127, 130–140, 260; Guia 59–85.
export const ARMORS=[
 ['common-clothes','Roupa comum','light',10,0,0,0,0],
 ['gauntlet','Manopla','accessory',5,0,0,0,0],
 ['ninja-vest','Colete ninja','light',100,0,0,0,1],
 ['reinforced-vest','Colete ninja resistente','light',150,10,0,0,-1],
 ['battle-armor','Armadura de batalha','heavy',250,15,0,-2,-1],
 ['reinforced-battle-armor','Armadura de batalha reforçada','heavy',600,20,-2,-4,-2]
].map(([key,name,weight,price,absorption,trainedPenalty,untrainedPenalty,compartments])=>({key,name,kind:'armor',weight,price,absorption,trainedPenalty,untrainedPenalty,compartments,capacity:1,slots:0,book:'basico',page:139}));
export const UTILITIES=[
 ['smoke-bomb','Bomba de fumaça',10,6,1,130,{consumable:true,utility:true,range:6}],
 ['flash-bomb','Bomba luminosa',10,6,1,131,{consumable:true,utility:true,range:6}],
 ['explosive-tag','Tarja explosiva',10,6,1,134,{consumable:true,utility:true,range:15}],
 ['kousen','Kousen (15 m)',2,1,1,132,{utility:true,range:15}],
 ['handcuffs','Algemas',15,1,1,140,{}],['belt-pouch','Coldre / bolsa com cinto',1,1,0,140,{storage:1}],
 ['rope','Corda (15 m)',1,1,1,140,{}],
 ['artisan-kit','Kit de artesão',30,1,1,140,{uses:5}],['tool-kit','Kit de ferramentas',30,1,1,140,{uses:5}],
 ['medicine-kit','Kit de medicamentos',50,1,1,140,{uses:5}],['laboratory-kit','Kit de laboratório',50,1,1,140,{uses:5}],
 ['instrument','Instrumento musical',50,1,1,140,{}],['lantern','Lanterna',7,1,1,140,{}],
 ['backpack','Mochila',2,1,0,140,{storage:4}],['pen','Caneta',1,1,0,140,{}],
 ['jutsu-scroll','Pergaminho de jutsus',10,1,1,140,{}],['writing-scroll','Pergaminho de escrita',1,6,1,140,{consumable:true}],
 ['special-tag','Tarja especial (selos)',10,6,1,140,{consumable:true}],['sleeping-bag','Saco de dormir',1,1,2,140,{}],
 ['travel-ration','Ração de viagem',1,6,1,140,{consumable:true}],
 ['soldier-pill','Pílulas do soldado',5,10,1,260,{consumable:true}],
 ['strong-drink','Bebida forte',1,1,0,140,{consumable:true}]
].map(([key,name,price,capacity,slots,page,extra])=>({key,name,kind:'utility',price,capacity,slots,book:'basico',page,...extra}));
for(const[key,name,price,capacity,page,extra]of [
 ['bolas','Boleadeira',10,6,60,{range:6}],['marking-bomb','Bomba de marcação',10,6,60,{range:6,consumable:true}],
 ['flash-bomb','Bomba luminosa',10,6,60,{range:6,consumable:true}],['thunder-bomb','Bomba som de trovão',10,6,61,{range:6,consumable:true}],
 ['caltrops','Estrepes',10,2,63,{range:6}],['net','Rede',10,2,67,{range:6}],
 ['earplugs','Tampões de ouvido',1,1,68,{equippable:true,slots:0}]
])UTILITIES.push({key,name,price,capacity,slots:1,kind:'utility',utility:key!=='earplugs',book:'avancado',page,...extra});
export const ROUTES={ingestion:'Ingestão',inhalation:'Inalação',touch:'Toque',blood:'Corrente sanguínea'};
// Effect descriptors are interpreted by inventory-rules. Duration is in seconds.
const poison=(key,name,book,category,routes,page,effects,extra={})=>({key,name,kind:'poison',book,category,routes,page,effects,capacity:15,slots:1,...extra});
const deb=(level,scope)=>({condition:'debilitado',level,scope});
export const POISONS=[
 poison('laxative','Veneno debilitante (laxante)','basico',0,['ingestion'],48,[deb(1,'social')],{seconds:172800}),
 poison('irritant','Veneno urticante','basico',0,['touch'],49,[deb(1,'social')],{seconds:18000}),
 poison('artificial','Veneno artificial','basico',0,['blood'],49,[deb(1,'all')],{seconds:14400}),
 poison('minor-sleep','Sonífero menor','basico',1,['ingestion'],49,[],{sleepTurn:6,sleepSeconds:7200,wakeAction:'Movimento'}),
 poison('minor-paralysis','Veneno paralisante menor','basico',1,['blood'],50,[{condition:'fatigado'}],{seconds:14400,rare:'Dose natural de escorpião laranja ou similar'}),
 poison('sleep','Sonífero efetivo','basico',2,['ingestion'],50,[deb(1,'perception')],{sleepTurn:6,sleepSeconds:7200,wakeAction:'Padrão'}),
 poison('paralysis','Veneno paralisante efetivo','basico',2,['blood'],50,[{condition:'tonto'}],{seconds:14400}),
 poison('potent-artificial','Veneno artificial potente','basico',3,['blood'],50,[deb(2,'all')],{seconds:14400}),
 poison('superior-sleep','Sonífero potente','basico',4,['inhalation'],51,[deb(2,'perception')],{sleepTurn:4,sleepSeconds:7200,wakeAction:'Completa'}),
 poison('potent-paralysis','Veneno paralisante potente','basico',4,['blood'],51,[{condition:'tonto'}],{seconds:14400,stunMargin:4,rare:'Dose natural de cobra Mamba Negra'}),
 poison('red-death','Morte rubra','basico',5,['blood'],51,[deb(3,'all')],{seconds:3600,dokujutsu:8,redDeath:true}),
 poison('red-scorpion','Veneno do escorpião vermelho','basico',5,['blood'],52,[deb(3,'all')],{seconds:86400,dokujutsu:8,damagePerTurn:10,deadly:true,rare:'Escorpião vermelho vivo'}),
 poison('black-salamander','Veneno da salamandra negra','basico',5,['blood','inhalation'],52,[deb(3,'all')],{seconds:86400,dokujutsu:8,damagePerTurn:10,deadly:true}),
 poison('itch','Veneno de coceira','avancado',0,['touch'],77,[deb(1,'agility')],{seconds:3600}),
 poison('laxative','Veneno laxante','avancado',0,['ingestion'],77,[deb(1,'social')],{seconds:172800}),
 poison('irritant','Veneno urticante','avancado',0,['touch'],78,[deb(1,'social')],{seconds:28800}),
 poison('nasal-inflammation','Veneno de inflamação nasal','avancado',0,['inhalation'],78,[deb(1,'suffocation')],{seconds:3600,dokujutsu:1}),
 poison('minor-sleep','Sonífero menor','avancado',1,['ingestion'],78,[],{sleepFailures:6,sleepSeconds:7200,wakeAction:'Movimento'}),
 poison('minor-weakening','Veneno enfraquecedor menor','avancado',1,['ingestion','blood'],79,[deb(1,'strength')],{seconds:7200,strengthDamage:-2}),
 poison('sleep','Sonífero','avancado',2,['ingestion','blood'],79,[deb(1,'perception')],{sleepFailures:5,sleepSeconds:7200,wakeAction:'Padrão',lateSleep:3600}),
 poison('minor-debilitating','Veneno debilitante menor','avancado',2,['ingestion','inhalation','touch','blood'],79,[deb(1,'all')],{seconds:14400}),
 poison('drunkenness','Veneno de embriaguês','avancado',2,['ingestion','inhalation'],80,[deb(2,'social-resistance')]),
 poison('minor-ocular','Veneno ocular menor','avancado',2,['touch'],80,[{condition:'ofuscado'},deb(2,'visual-perception')],{seconds:7200}),
 poison('dizziness','Veneno de tontura','avancado',2,['blood'],80,[deb(1,'intelligence')],{seconds:14400,dokujutsu:3}),
 poison('minor-hallucinogenic','Veneno alucinógeno menor','avancado',3,['ingestion','inhalation','blood'],80,[{condition:'confuso',untilThree:true}]),
 poison('weakening','Veneno enfraquecedor','avancado',3,['ingestion','blood'],81,[deb(2,'strength')],{seconds:14400,strengthDamage:-4}),
 poison('lethargic','Veneno letárgico','avancado',3,['touch','blood'],81,[{condition:'fatigado'}],{seconds:14400}),
 poison('interrogation','Veneno de interrogatório','avancado',4,['ingestion','inhalation'],81,[deb(3,'social-resistance')],{trivialAutoFail:true}),
 poison('paralysis','Veneno paralisante','avancado',4,['blood'],82,[{condition:'tonto'}],{seconds:14400}),
 poison('superior-sleep','Sonífero superior','avancado',5,['ingestion','inhalation','blood'],82,[deb(2,'perception')],{sleepFailures:4,sleepSeconds:7200,wakeAction:'Completa',lateSleep:0}),
 poison('hallucinogenic','Veneno alucinógeno','avancado',5,['ingestion','inhalation','blood'],82,[deb(2,'mental-perception'),{condition:'confuso',untilThree:true}],{seconds:28800}),
 poison('debilitating','Veneno debilitante','avancado',5,['ingestion','inhalation','touch','blood'],83,[deb(2,'all')],{seconds:28800}),
 poison('ocular','Veneno ocular','avancado',5,['touch'],83,[deb(4,'visual-perception')],{seconds:14400,dokujutsu:6,attackFailure:50}),
 poison('superior-debilitating','Veneno debilitante superior','avancado',6,['ingestion','inhalation','touch','blood'],83,[{condition:'exausto'}]),
 poison('superior-weakening','Veneno enfraquecedor superior','avancado',6,['ingestion','blood'],83,[deb(3,'strength'),deb(2,'vigor')],{strengthDamage:-6}),
 poison('superior-ocular','Veneno ocular superior','avancado',6,['touch'],84,[{condition:'cego'}]),
 poison('red-death','Morte rubra','avancado',7,['blood'],84,[deb(3,'all')],{seconds:3600,dokujutsu:10,redDeath:true}),
 poison('red-scorpion','Veneno do escorpião vermelho','avancado',7,['touch','blood'],85,[deb(3,'all')],{seconds:86400,dokujutsu:10,damagePerTurn:10,deadly:true}),
 poison('black-salamander','Veneno da salamandra negra','avancado',7,['inhalation','touch','blood'],85,[deb(3,'all')],{seconds:86400,dokujutsu:10,damagePerTurn:5,deadly:true})
];
export const INVENTORY_CATEGORIES={armor:'Armaduras',utility:'Consumíveis e utilitários',poison:'Venenos',antidote:'Antídotos'};
export function inventoryRevision(rules={},books=['basico','avancado']){return rules.inventoryRevision==='basico'?'basico':books.includes('avancado')?'avancado':'basico';}
export function inventoryCatalog(kind='utility',rules={},books=['basico','avancado']){
 const revision=inventoryRevision(rules,books);
 if(kind==='armor')return ARMORS.filter(e=>books.includes(e.book));
 if(kind==='poison'||kind==='antidote')return POISONS.filter(e=>e.book===revision&&books.includes(e.book)).map(e=>kind==='antidote'?{...e,kind:'antidote',name:`Antídoto: ${e.name}`}:{...e});
 const found=new Map();for(const e of UTILITIES.filter(e=>books.includes(e.book)&&(e.book!=='avancado'||revision==='avancado')))found.set(e.key,e);return [...found.values()];
}
export function inventoryEntry(item){if(item?.flags?.['shinobi-no-sho']?.replicaOf)return null;const s=item?.system??item??{},d=s.inventoryData??{};const key=d.key??s.catalogKey,book=d.book??s.catalogBook,kind=d.kind;return [...ARMORS,...UTILITIES,...POISONS].find(e=>e.key===key&&e.book===book&&(!kind||(kind==='antidote'?e.kind==='poison':e.kind===kind)))??null;}
