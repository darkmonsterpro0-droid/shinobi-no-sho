// Catalog and context-sensitive rules: Livro Básico, printed pp. 276–278.
// No condition writes to purchased attributes or permanently reduces precision.
export const CONDITIONS=Object.fromEntries([
 ['debilitado','Debilitado',276,'Precisão reduzida no contexto indicado; máximo conjunto de −3.'],
 ['agarrado','Agarrado',276,'Aplica os efeitos de Impedido enquanto o agarramento persistir.'],
 ['amedrontado','Amedrontado',276,'Debilitado; não ataca. Fuga depende da presença de aliados e da fonte.'],
 ['amputado','Amputado',276,'Impede armas de duas mãos e selos, salvo a exceção de Mestre dos Selos e Prestidigitação 14.'],
 ['assustado','Assustado',276,'Deve se afastar da fonte; debilitado se não conseguir.'],
 ['aterrorizado','Aterrorizado',277,'Atordoado; reação de fuga depende dos aliados e da fonte.'],
 ['atordoado','Atordoado',277,'Não realiza ações, inclusive livres; ainda pode reagir.'],
 ['caido','Caído',277,'CC −3 e defesa −3 contra corpo a corpo/área; cobertura parcial +3 contra demais ataques distantes.'],
 ['cego','Cego',277,'Sem visão: camuflagem total, restrições visuais e desprevenido contra o inimigo não visto.'],
 ['confuso','Confuso',277,'1d8 a cada turno: 1–2 foge; 3–4 ataca o mais próximo; 5–6 não age; 7–8 age normalmente.'],
 ['desprevenido','Desprevenido',277,'Defesa −3 e perda dos bônus de Esquiva.'],
 ['estavel','Estável',277,'Inconsciente entre −11 e −20; o sangramento que causava a morte foi estabilizado.'],
 ['exausto','Exausto',277,'Lento e ataque/defesa −3. Nova exaustão ou fadiga causa inconsciência.'],
 ['fascinado','Fascinado',277,'Atenção presa ao efeito. Ameaça potencial permite resistência; ameaça óbvia encerra o fascínio.'],
 ['fatigado','Fatigado',277,'Lento e ataque/defesa −1; nova fadiga causa exaustão.'],
 ['fintado','Fintado',277,'Defesa −2.'],
 ['flanqueado','Flanqueado',277,'Defesa −1 apenas contra os dois atacantes envolvidos.'],
 ['impedido','Impedido',278,'Sem deslocamento, ataque/defesa −1; contra área não esquiva/antecipa e a defesa fixa é 9.'],
 ['inconsciente','Inconsciente',278,'Indefeso; não realiza nem ações mentais.'],
 ['indefeso','Indefeso',278,'Sem ação/defesa, exceto os testes e ações para remover o efeito causador.'],
 ['paralisado','Paralisado',278,'Usa a mesma regra de Indefeso.'],
 ['lento','Lento',278,'Metade do deslocamento; sem corrida ou Investida.'],
 ['morrendo','Morrendo',278,'Inconsciente entre −11 e −20; estabilizar o sangramento o torna estável.'],
 ['ofuscado','Ofuscado',278,'Ataques −1; atributos/perícias −1 quando a tarefa usa visão.'],
 ['sangrando','Sangrando',278,'Perde 2 de vitalidade por nível no início do turno. Vigor 18: uma tentativa por turno como reação. Medicina 16: ação padrão por tentativa. Cada sucesso remove um nível.'],
 ['sufocamento','Sufocamento',278,'Teste de Vigor por turno; dificuldade cresce em 1 a cada turno. Falha causa dano fixo do efeito ou NC.'],
 ['surdo','Surdo',278,'Iniciativa −3; impede Procurar/Prontidão auditivos.'],
 ['tonto','Tonto',278,'Perde a ação de movimento; pode converter uma ação maior.'],
 ['fora-combate','Fora de combate',259,'Vitalidade zero: consciente, sem condições de continuar o combate.'],
 ['morto','Morto',259,'Vitalidade −21 ou menor, ou drenagem forçada que alcance o limite natural de chakra.']
].map(([key,name,page,description])=>[key,{key,name,page,description,source:`Livro Básico p. ${page}`,icon:`systems/shinobi-no-sho/assets/conditions/${key}.svg`} ]));
export function conditionKey(record) {return record.key||Object.keys(CONDITIONS).find(k=>CONDITIONS[k].name.toLocaleLowerCase('pt-BR')===String(record.name).toLocaleLowerCase('pt-BR'))||'';}
const num=n=>Number.isFinite(Number(n))?Number(n):0;
export function resolveConditions(records=[],{vitality=null,chakra=null,chakraMax=0,forcedDrain=false,puppet=false,hasChakraReserve=true}={}) {
  const active=records.filter(r=>!r.disabled&&!(conditionKey(r)==='estavel'&&vitality!==null&&(vitality> -11||vitality< -20))).map(r=>({...r,key:conditionKey(r),level:Math.max(1,num(r.level)||1)}));
  const keys=new Set(active.map(r=>r.key));const auto=[];
  const add=(key,why)=>{if(!keys.has(key)){keys.add(key);auto.push({id:`auto-${key}`,key,name:CONDITIONS[key]?.name??key,source:why,automatic:true,level:1});}};
  if(!puppet&&hasChakraReserve&&chakra!==null&&chakra<=0)add('exausto','Chakra esgotado · Básico p. 260');
  if(!puppet&&hasChakraReserve&&forcedDrain&&chakra!==null&&chakra<=-Math.ceil(chakraMax/2)&&chakraMax>0)add('morto','Drenagem forçada de chakra · Básico p. 260');
  const fatigue=active.filter(r=>r.key==='fatigado').reduce((s,r)=>s+r.level,0),exhaust=active.filter(r=>r.key==='exausto').reduce((s,r)=>s+r.level,0)+(!puppet&&hasChakraReserve&&chakra!==null&&chakra<=0?1:0);
  if(fatigue>=2)add('exausto','Acúmulo de fadiga · Básico p. 277');
  if(fatigue>=3||exhaust>=2||(exhaust>=1&&fatigue>=1))add('inconsciente','Acúmulo de fadiga/exaustão · Básico p. 277');
  if(!puppet&&vitality!==null) {
    if(vitality<=-21||(hasChakraReserve&&forcedDrain&&chakra<=-Math.ceil(chakraMax/2)&&chakraMax>0))add('morto','Vitalidade / drenagem forçada · Básico pp. 259–260');
    else if(vitality<=-11){if(!keys.has('estavel'))add('morrendo','Vitalidade entre −11 e −20 · Básico p. 259');}
    else if(vitality<0)add('inconsciente','Vitalidade entre −1 e −10 · Básico p. 259');
    else if(vitality===0)add('fora-combate','Vitalidade zero: consciente, fora de combate · Básico p. 259');
    if(vitality===0&&keys.has('sufocamento'))add('inconsciente','Sufocamento com vitalidade zero · Básico p. 278');
  }
  if(keys.has('aterrorizado')){keys.delete('amedrontado');keys.delete('assustado');}else if(keys.has('amedrontado'))keys.delete('assustado');
  for(const [from,to] of [['agarrado','impedido'],['aterrorizado','atordoado'],['exausto','lento'],['fatigado','lento'],['estavel','inconsciente'],['morrendo','inconsciente'],['inconsciente','indefeso'],['paralisado','indefeso'],['fora-combate','indefeso']])if(keys.has(from))add(to,`Consequência de ${CONDITIONS[from]?.name}`);
  if(keys.has('morrendo'))add('sangrando','Consequência de Morrendo · Básico p. 278');
  const slow=keys.has('lento'),immobile=keys.has('impedido')||keys.has('indefeso')||keys.has('morto');
  return {keys:[...keys],automatic:auto,records:active,slow,immobile,noActions:keys.has('atordoado')||keys.has('indefeso')||keys.has('morto')||keys.has('fora-combate'),noReactions:keys.has('indefeso')||keys.has('morto')||keys.has('fora-combate'),noMovementAction:keys.has('tonto'),noAttack:keys.has('amedrontado'),noRun:slow||immobile,bleeding:active.filter(r=>r.key==='sangrando').reduce((s,r)=>s+r.level,0)};
}
export function conditionContext(records,context={},resources={}) {
  const filtered=records.filter(r=>!context.resistingId||r.id!==context.resistingId),state=resolveConditions(filtered,resources),keys=new Set(state.keys),penalties=[],bonuses=[],reasons=[];
  const penalize=(key,value)=>penalties.push({key,value});const attack=context.kind==='attack',defense=context.kind==='defense',vision=context.vision!==false;
  const debilitations=filtered.filter(r=>conditionKey(r)==='debilitado'&&(!r.scope||r.scope==='all'||r.scope===context.kind||r.scope===context.stat));
  if(debilitations.length)penalize('debilitado',-Math.min(3,Math.max(...debilitations.map(r=>Math.max(1,num(r.level)||1)))));
  if(keys.has('exausto')&&(attack||defense))penalize('exausto',-3);else if(keys.has('fatigado')&&(attack||defense))penalize('fatigado',-1);
  if(keys.has('impedido')&&(attack||defense))penalize('impedido',-1);
  if(keys.has('amedrontado'))penalize('amedrontado',-1);
  if(keys.has('assustado')&&context.cannotRetreat)penalize('assustado',-1);
  if(keys.has('ofuscado')&&(attack||((context.kind==='attribute'||context.kind==='skill')&&vision)))penalize('ofuscado',-1);
  const unseen=!!context.unseenOpponent||(keys.has('cego')&&context.unseenOpponent!==false);
  if(attack&&unseen&&!context.targetLocated&&!context.sensor)reasons.push('Localize o alvo por outro sentido ou informação de um aliado antes de atacar (Básico p. 273).');
  if(defense&&(keys.has('desprevenido')||unseen))penalize('desprevenido',-3);
  if(defense&&keys.has('fintado'))penalize('fintado',-2);
  if(defense&&keys.has('flanqueado')&&context.flankingAttacker)penalize('flanqueado',-1);
  if(keys.has('caido')){if(context.stat==='cc')penalize('caido-cc',-3);if(defense&&['melee','area'].includes(context.attackType))penalize('caido-defesa',-3);if(defense&&context.attackType==='ranged')bonuses.push({key:'cobertura-parcial',value:3});}
  if(keys.has('surdo')&&context.kind==='initiative')penalize('surdo',-3);
  if(keys.has('cego')&&vision&&(context.visualOnly||['procurar','prontidao'].includes(context.stat)))reasons.push('A tarefa exige visão e o personagem está cego.');
  if(keys.has('surdo')&&context.auditoryOnly&&['procurar','prontidao'].includes(context.stat))reasons.push('O personagem não pode realizar a tarefa auditiva enquanto surdo.');
  const resisting=!!context.resistingId;
  if((state.noActions&&!context.reaction||state.noReactions&&context.reaction)&&!context.stabilizing)reasons.push('A condição atual impede esta ação.');
  if(resisting&&(keys.has('inconsciente')||keys.has('morto'))&&!context.stabilizing)reasons.push('Inconsciência ou morte impede esta ação.');
  if(attack&&state.noAttack)reasons.push('Amedrontado impede ataques.');
  if(context.requiresSeals&&keys.has('amputado')&&!context.oneHandSealsException)reasons.push('Amputação impede selos sem a exceção expressa.');
  if(context.twoHanded&&keys.has('amputado'))reasons.push('Amputação impede usar uma arma de duas mãos.');
  if(keys.has('fascinado')&&!context.reaction&&!resisting)reasons.push('Fascinado permite apenas prestar atenção ao efeito; uma ameaça pode permitir resistência ou encerrar o fascínio.');
  if(context.run&&state.noRun)reasons.push('Lento ou imobilizado impede corrida e Investida.');
  const confusion=filtered.find(r=>conditionKey(r)==='confuso'&&r.turnResult)?.turnResult;
  if([5,6].includes(confusion)&&!context.reaction)reasons.push('Confuso: neste turno não realiza ações; mantém as reações de defesa por decisão da mesa.');
  if(!context.manualContext&&[1,2].includes(confusion)&&!context.reaction&&!context.fleeing)reasons.push('Confuso: neste turno deve fugir.');
  if(!context.manualContext&&[3,4].includes(confusion)&&attack&&!context.nearestTarget)reasons.push('Confuso: o ataque deve ter como alvo a criatura mais próxima.');
  if(context.attackType==='area'&&keys.has('impedido')&&defense&&['esq','lm'].includes(context.stat))reasons.push('Contra área, Impedido não permite Esquiva/Antecipar: defesa fixa 9.');
  return {state,penalties,bonuses,penalty:Math.max(-3,penalties.reduce((s,p)=>s+p.value,0)),bonus:bonuses.reduce((s,p)=>s+p.value,0),loseDodgeBonus:keys.has('desprevenido')||unseen||state.immobile,reasons,allowed:!reasons.length,camouflage:unseen&&attack&&!context.sensor&&!context.areaCoversCamouflage?50:0};
}
export function conditionHistory(from,to) {
  if(!from||from===to)return [];
  const paths=[['lento','fatigado','exausto','inconsciente'],['tonto','atordoado','indefeso'],['assustado','amedrontado','aterrorizado','paralisado'],['impedido','indefeso']];
  const path=paths.find(p=>p.includes(from)&&p.indexOf(to)>p.indexOf(from));
  if(!path)throw Error('A condição anterior não pertence a uma progressão publicada para esta condição.');
  return path.slice(path.indexOf(from),path.indexOf(to));
}
export function lethalDamage(current,damage) {if(current===null)return null;damage=Math.max(0,num(damage));return current>0?Math.max(0,current-damage):current-damage;}
export function conditionTurn(records,phase='start',nc=4) {
  const bleeding=records.filter(r=>!r.disabled&&conditionKey(r)==='sangrando').reduce((s,r)=>s+Math.max(1,num(r.level)||1),0);
  const expired=[],updates=[],prompts=[];let suffocationDamage=0;const unconscious=records.some(r=>!r.disabled&&['inconsciente','morto'].includes(conditionKey(r)));
  for(const r of records.filter(r=>!r.disabled)) {
    const key=conditionKey(r);
    if(phase==='start'&&key==='sufocamento'&&unconscious)suffocationDamage+=r.damage===null||r.damage===undefined?nc:num(r.damage);
    if(phase==='start'&&key==='sufocamento'&&!unconscious)prompts.push({id:r.id,key,stat:'vig',difficulty:r.difficulty===null||r.difficulty===undefined?null:num(r.difficulty)+num(r.elapsed),damage:r.damage===null||r.damage===undefined?nc:num(r.damage)});
    if(phase==='start'&&key==='confuso'&&!prompts.some(p=>p.key==='confuso'))prompts.push({id:r.id,key});
    const timing=r.timing==='Fim do turno'?'end':!r.timing||r.timing==='Início do turno'?'start':null;
    if(r.remaining!==null&&r.remaining!==undefined&&timing===phase){if(num(r.remaining)<=1)expired.push(r.id);else updates.push({id:r.id,remaining:num(r.remaining)-1});}
    if(phase==='start'&&key==='sufocamento')updates.push({id:r.id,elapsed:num(r.elapsed)+1});
  }
  const merged=new Map();for(const update of updates)merged.set(update.id,{...merged.get(update.id),...update});
  return {damage:phase==='start'?bleeding*2+suffocationDamage:0,bleedingDamage:phase==='start'?bleeding*2:0,suffocationDamage,expired,updates:[...merged.values()],prompts};
}
