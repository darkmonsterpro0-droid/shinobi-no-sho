import {ID,BOOKS,defaultProfile} from './config.mjs';
import {OPTIONAL_RULES} from './build-rules.mjs';

// Native scalar settings are the editable fields. Legacy objects remain intact
// as fallback and retain decisions, unknown keys and future book references.
export function nativeSettingDefinitions(){
 return [
  {key:'profile_name',group:'profile',path:'name',name:'Mesa — Nome do perfil',hint:'Nome usado nas consultas às regras da mesa.',type:String},
  ...BOOKS.map(([book,label])=>({key:'book_'+book,group:'book',path:book,name:'Livro — '+label,hint:'Disponibiliza o conteúdo nas compras e consultas compatíveis. Desabilitar não apaga itens adquiridos.',type:Boolean})),
  {key:'profile_social',group:'profile',path:'social',name:'Variante — Regras sociais',type:String,choices:{basico:'Livro Básico',revisado:'Regras Sociais Revisadas'}},
  {key:'profile_senjutsu',group:'profile',path:'senjutsu',name:'Variante — Senjutsu',hint:'Seleciona a variante; não concede capacidades nem automatiza reservas.',type:String,choices:{'a definir':'A definir',basico:'Básico',revisado:'Guia Avançado'}},
  {key:'profile_jiton',group:'profile',path:'jiton',name:'Variante — Jiton',type:String,choices:{'a definir':'A definir',original:'Original',revisado:'Jiton II'}},
  {key:'rule_powerRate',group:'rules',path:'powerRate',name:'Progressão — Pontos de poder',type:String,choices:{2:'Padrão: NC 4 = 4 / NC 20 = 40',3:'Guia: NC 4 = 6 / NC 20 = 60',4:'Mesa: NC 4 = 8 / NC 20 = 80'},fallback:2},
  {key:'rule_advancement',group:'rules',path:'advancement',name:'Progressão — Avanço de atributos',hint:'Regra da casa. A troca de modo não distribui nem remove pontos retroativamente.',type:String,choices:{level:'Nível inteiro',xp:'EXP de atributos concedida pelo mestre'},fallback:'level'},
  {key:'rule_inventoryRevision',group:'rules',path:'inventoryRevision',name:'Variante — Equipamentos e venenos',type:String,choices:{auto:'Conforme os livros habilitados',basico:'Livro Básico',avancado:'Guia Avançado'},fallback:'auto'},
  {key:'rule_criticalSkipsDefense',group:'rules',path:'criticalSkipsDefense',name:'Combate — Crítico dispensa defesa',
   hint:'Desative para permitir a defesa declarada mesmo contra um ataque crítico. O grau de dano crítico é preservado.',type:Boolean,fallback:true},
  {key:'rule_progressiveCriticalDefense',group:'rules',path:'progressiveCriticalDefense',name:'Combate — Ataque Progressivo no crítico',
   hint:'Quando o último golpe crítico dispensa a defesa, determine como calcular o bônus das rolagens extras.',
   type:String,choices:{automatic:'Somar todos os bônus automaticamente',roll:'Rolar uma defesa só para os ataques extras'},fallback:'roll'},
  ...OPTIONAL_RULES.map(([path,label,source,description])=>({key:'rule_'+path,group:'rules',path,name:'Regra opcional — '+label,hint:source+' · '+description+(path==='optionalXP'?' Aplicável somente ao avanço por nível inteiro.':''),type:Boolean,fallback:false})),
  {key:'profile_notes',group:'profile',path:'notes',name:'Mesa — Anotações de regras e decisões',hint:'Texto da mesa. Decisões estruturadas já existentes são preservadas; este campo não executa regras.',type:String}
 ];
}
function legacy(key,fallback){const value=globalThis.game?.settings?.get(ID,key);return structuredClone(value&&typeof value==='object'?value:fallback);}
function nativeValue(def,fallback){
 const settings=globalThis.game?.settings;
 if(!settings?.settings?.has(ID+'.'+def.key))return fallback;
 // With no explicit value, use the current legacy object, including changes made
 // by compatibility APIs after init. The native form defaults are refreshed below.
 const storage=settings.storage?.get('world');
 if(storage&&storage.getItem(ID+'.'+def.key)==null)return fallback;
 return settings.get(ID,def.key);
}
export function worldProfile(){
 const value={...defaultProfile(),...legacy('profile',{})},books=new Set(value.books??[]);
 for(const def of nativeSettingDefinitions()){
  if(def.group==='profile')value[def.path]=nativeValue(def,value[def.path]??'');
  if(def.group==='book'){if(nativeValue(def,books.has(def.path)))books.add(def.path);else books.delete(def.path);}
 }
 value.books=[...books];return value;
}
export function worldRules(){
 const value={advancement:'level',powerRate:2,...legacy('houseRules',{})};
 for(const def of nativeSettingDefinitions().filter(d=>d.group==='rules'))value[def.path]=nativeValue(def,value[def.path]??def.fallback);
 value.powerRate=Number(value.powerRate);return value;
}
export function registerNativeWorldSettings(refresh){
 const profile=worldProfile(),rules=worldRules();
 for(const def of nativeSettingDefinitions()){
  let initial=def.group==='book'?profile.books.includes(def.path):def.group==='profile'?profile[def.path]:rules[def.path];
  initial??=def.fallback??'';
  if(def.type===String)initial=String(initial);
  game.settings.register(ID,def.key,{name:def.name,hint:def.hint??'Escolha aplicada a todos os personagens deste mundo.',scope:'world',config:true,type:def.type,choices:def.choices,default:initial,onChange:refresh});
 }
}
// Compatibility writers target the same native fields. No actor is rewritten.
async function saveGroup(group,value){
 if(!game.user.isGM)throw Error('Somente o mestre altera as regras do mundo.');
 for(const def of nativeSettingDefinitions()){
  const included=group==='profile'?def.group==='profile'&&Object.hasOwn(value,def.path)||def.group==='book'&&Object.hasOwn(value,'books'):def.group==='rules'&&Object.hasOwn(value,def.path);
  if(!included||!game.settings.settings?.has(ID+'.'+def.key))continue;
  let next=def.group==='book'?value.books.includes(def.path):value[def.path];if(def.type===String)next=String(next);
  if(game.settings.get(ID,def.key)!==next)await game.settings.set(ID,def.key,next);
 }
 return game.settings.set(ID,group==='profile'?'profile':'houseRules',value);
}
export const saveWorldProfile=value=>saveGroup('profile',value);
export const saveWorldRules=value=>saveGroup('rules',value);
