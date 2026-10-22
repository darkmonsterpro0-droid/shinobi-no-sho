export const ID = "shinobi-no-sho";
export const VERSION = "0.1.1";
export const ATTRIBUTES = {for:"Força",des:"Destreza",agi:"Agilidade",per:"Percepção",int:"Inteligência",vig:"Vigor",esp:"Espírito"};
export const COMBAT = {cc:"Combate Corporal",cd:"Combate à Distância",esq:"Esquiva",lm:"Ler Movimento"};
export const SKILLS = {
  acrobacia:["Acrobacia","agi"],arte:["Arte","int"],atletismo:["Atletismo","for"],ciencia:["Ciências Naturais","int"],concentracao:["Concentração","int"],cultura:["Cultura","int"],disfarce:["Disfarce","per"],escapar:["Escapar","des"],furtividade:["Furtividade","agi"],lidar:["Lidar com Animais","per"],mecanismos:["Mecanismos","int"],medicina:["Medicina","int"],ocultismo:["Ocultismo","int"],prestidigitacao:["Prestidigitação","des"],procurar:["Procurar","per"],prontidao:["Prontidão","per"],rastrear:["Rastrear","per"],veneficio:["Venefício","int"],voo:["Voo","agi"]
};
export const ACTOR_TYPES = {character:"Personagem",creature:"Criatura vinculada",puppet:"Marionete"};
export const ITEM_TYPES = {power:"Poder",aptitude:"Aptidão",technique:"Técnica",equipment:"Equipamento",device:"Dispositivo"};
export const TABS = {summary:"Resumo",combat:"Combate",techniques:"Técnicas",skills:"Perícias",social:"Social",equipment:"Equipamento",advancement:"Evolução",history:"História"};
export const SOURCES = {basico:"Livro Básico 4.1b",avancado:"Guia Avançado — 10 anos",hijutsus1:"Hijutsus I 4.1b",hijutsus2:"Hijutsus II revisado",sociais:"Regras Sociais Revisadas",mesa:"Registro da mesa"};
export const BOOKS = Object.entries(SOURCES).filter(([id])=>id!=="mesa");
export const SOCIAL = ["Acalmar","Compostura","Convencer","Empatia","Encorajar","Enganar","Etiqueta","Intimidar","Ouvir e espalhar boatos","Presença","Provocar"];
export function defaultProfile() {
  return {name:"Regras da mesa",books:["basico","avancado","hijutsus1","hijutsus2","sociais"],social:"revisado",senjutsu:"a definir",jiton:"a definir",notes:"",decisions:[
    {id:"oportunista",name:"Oportunista",description:"1 ataque oportuno normal + extras iguais à metade da Agilidade, arredondada para cima. AGI 5: 4 no total.",source:"Básico p.65 · decisão do usuário",status:"Definido"},
    {id:"amaterasu",name:"Amaterasu",description:"Alcance de 9 m.",source:"Básico p.187 · decisão do usuário",status:"Definido"},
    {id:"rede",name:"Rede",description:"Gastar ação padrão para rolar Força ou Escapar contra dificuldade 16. Preservar a exceção publicada para arma de corte.",source:"Guia p.67 · decisão do usuário",status:"Definido"},
    {id:"senjutsu",name:"Senjutsu por transplante",description:"Permanência passiva versus limite diário: aguardando decisão.",source:"Guia pp.17–18",status:"Pendente"},
    {id:"fracassos",name:"Fracassos simultâneos",description:"Dois fracassos automáticos em teste resistido: aguardando decisão.",source:"Básico p.250",status:"Pendente"}
  ]};
}
export const ICONS = Object.fromEntries(['character','creature','puppet','power','aptitude','technique','equipment','device'].map(type=>[type,`systems/${ID}/assets/${type==='character'?'portrait':type}.svg`]));
