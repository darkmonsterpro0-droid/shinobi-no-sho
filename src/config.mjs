export const ID = "shinobi-no-sho";
export const VERSION = "0.4.0";
export const ATTRIBUTES = {for:"Força",des:"Destreza",agi:"Agilidade",per:"Percepção",int:"Inteligência",vig:"Vigor",esp:"Espírito"};
export const COMBAT = {cc:"Combate Corporal",cd:"Combate à Distância",esq:"Esquiva",lm:"Ler Movimento"};
export const SKILLS = {
  acrobacia:["Acrobacia","agi"],arte:["Arte","int"],atletismo:["Atletismo","for"],ciencia:["Ciências Naturais","int"],concentracao:["Concentração","int"],cultura:["Cultura","int"],disfarce:["Disfarce","per"],escapar:["Escapar","des"],furtividade:["Furtividade","agi"],lidar:["Lidar com Animais","per"],mecanismos:["Mecanismos","int"],medicina:["Medicina","int"],ocultismo:["Ocultismo","int"],prestidigitacao:["Prestidigitação","des"],procurar:["Procurar","per"],prontidao:["Prontidão","per"],rastrear:["Rastrear","per"],veneficio:["Venefício","int"],voo:["Voo","agi"]
};
export const ACTOR_TYPES = {character:"Personagem",creature:"Criatura vinculada",puppet:"Marionete"};
export const ITEM_TYPES = {power:"Poder",aptitude:"Aptidão",technique:"Técnica",equipment:"Equipamento",device:"Dispositivo"};
export const TABS = {summary:"Resumo",techniques:"Poderes e Aptidões",skills:"Perícias",social:"Social",equipment:"Equipamento",history:"História",gm:"Mestre"};
export const SOURCES = {basico:"Livro Básico 4.1b",avancado:"Guia Avançado — 10 anos",hijutsus1:"Hijutsus I 4.1b",hijutsus2:"Hijutsus II revisado",sociais:"Regras Sociais Revisadas",mesa:"Registro da mesa"};
export const BOOKS = Object.entries(SOURCES).filter(([id])=>id!=="mesa");
export const SOCIAL = ["Acalmar","Compostura","Convencer","Empatia","Encorajar","Enganar","Etiqueta","Intimidar","Ouvir e espalhar boatos","Presença","Provocar"];
export function defaultProfile() {
  return {name:"Regras da mesa",books:["basico","avancado","hijutsus1","hijutsus2","sociais"],social:"revisado",senjutsu:"a definir",jiton:"a definir",notes:"",decisions:[
    {id:"soldier-pill-reset",name:"Pílulas do soldado",description:"A contagem de doses só é zerada manualmente pelo mestre; descanso e reinício da contagem preservam intoxicação com duração própria.",source:"Decisão do usuário · 22/10/2026",status:"Definido"},
    {id:"equipment-penalty",name:"Penalidades de equipamento",description:"Penalidades de armadura e falta de kit ficam separadas do limite de −3 das condições.",source:"Decisão do usuário · 22/10/2026",status:"Definido"},
    {id:"seal-cost",name:"Custo próprio de selos",description:"Selos são efeitos distintos, com seus próprios custos. Misshi custa 3 chakra no total; não cobra novamente os mesmos 3 na ativação. Custos explicitamente separados de outros selos permanecem.",source:"Decisão do usuário · 22/10/2026",status:"Definido"},
    {id:"clone-versao-anterior",name:"Clone: quantidade ativa",description:"Com Clone 2, até duas cópias ativas usam −3 nos testes. Ao criar a terceira, todos os clones passam a falhar automaticamente em testes de combate; máximo de seis.",source:"Decisão do usuário em 22/10/2026",status:"Definido"},
    {id:"dominio-agua-reserva",name:"Domínio da Água: reserva individual",description:"Cada usuário controla e gasta os pontos de água que ele próprio gerou no ambiente.",source:"Decisão do usuário em 22/10/2026",status:"Definido"},
    {id:"chute-duplo",name:"Chute Duplo: bônus do primeiro golpe",description:"Dividir o dano base e depois aplicar +2 somente à parcela do primeiro golpe.",source:"Decisão do usuário em 22/10/2026",status:"Definido"},
    {id:"oportunista",name:"Oportunista",description:"1 ataque oportuno normal + extras iguais à metade da Agilidade, arredondada para cima. AGI 5: 4 no total.",source:"Básico p.65 · decisão do usuário",status:"Definido"},
    {id:"amaterasu",name:"Amaterasu",description:"Alcance de 9 m.",source:"Básico p.187 · decisão do usuário",status:"Definido"},
    {id:"rede",name:"Rede",description:"Gastar ação padrão para rolar Força ou Escapar contra dificuldade 16. Preservar a exceção publicada para arma de corte.",source:"Guia p.67 · decisão do usuário",status:"Definido"},
    {id:"confuso-reacoes",name:"Confuso: resultado 5–6",description:"Não realiza ações, mas mantém as reações de defesa.",source:"Básico p.277 · decisão do usuário",status:"Definido"},
    {id:"sangrando-vigor-turno",name:"Sangrando: tentativa de Vigor",description:"Uma tentativa de Vigor 18 por turno, como reação. Medicina 16 exige ação padrão por tentativa.",source:"Básico p.278 · decisão do usuário",status:"Definido"},
    {id:"senjutsu",name:"Senjutsu por transplante",description:"Transplante Senninka é exceção ao limite diário de 10 minutos: Modo Eremita passivo e permanente.",source:"Guia pp.17–18 · decisão do usuário",status:"Definido"},
    {id:"fracassos",name:"Fracassos simultâneos",description:"Dois fracassos automáticos em teste resistido: ambos repetem os testes.",source:"Básico p.250 · decisão do usuário",status:"Definido"}
  ]};
}
export const ICONS = Object.fromEntries(['character','creature','puppet','power','aptitude','technique','equipment','device'].map(type=>[type,`systems/${ID}/assets/${type==='character'?'shinobi-portrait.png':type+'.svg'}`]));
