// Livro Básico 4.1.b pp. 168–170. Shadow adjudications are explicit inputs;
// do not infer lighting, a living creature or minion status from its portrait.
import {periodKey,runtimeState} from './aptitude-runtime.mjs';
import {WEAPONS,weaponAttack} from './weapons.mjs';
export function shadowTurns(level,previousUses=0,targetCount=1,{capanga=false}={}){
 if(!Number.isInteger(level)||level<1||!Number.isInteger(previousUses)||previousUses<0||
  !Number.isInteger(targetCount)||targetCount<1)throw Error('Parâmetros inválidos da duração das sombras.');
 const base=targetCount>1?2:Math.max(2,Math.min(6,1+level)-previousUses);
 return base*(capanga?2:1);
}
export function shadowUseCount(actor){
 const record=runtimeState(actor).shadowUses;
 return record?.scene===periodKey(actor,'scene')?Number(record.count??0):0;
}
export const shadowAttackBonus=(plan,targetUuid)=>plan?.shadow?.preparedFrom&&!plan.shadow.silent&&plan.shadow.closeTargets?.includes(targetUuid)?3:0;
export function shadowDefense(plan,state,defense={},targetUuid){
 if(!plan?.shadow)return {allowed:true,penalty:0,fixedDodge:null};
 if(plan.shadow.projectile)return {allowed:!state.immobile||['esquiva','none','manual'].includes(defense.kind)||!defense.kind,
  penalty:plan.shadow.intentionUnknown&&['esquiva','antecipar'].includes(defense.kind)?-2:0,
  fixedDodge:state.immobile&&!state.noReactions?9:null};
 const close=plan.shadow.preparedFrom&&(plan.shadow.closeTargets??[]).includes(targetUuid),silent=plan.shadow.silent||close;
 const fixedDodge=state.immobile&&!state.noReactions?9:null;
 const allowed=['manual','none'].includes(defense.kind)||!defense.kind||
  (fixedDodge!=null?defense.kind==='esquiva'&&!defense.risk:
   close?defense.kind==='esquiva':!silent||['esquiva','antecipar'].includes(defense.kind));
 return {allowed,penalty:silent?-3:0,fixedDodge};
}
export function commitShadowUse(actor,plan,runtime){
 if(plan.shadow?.projectile)return;
 if(!plan.shadow?.binding&&!plan.shadow?.countUsage)return;
 const scene=periodKey(actor,'scene'),previous=runtime.shadowUses?.scene===scene?Number(runtime.shadowUses.count??0):0;
 const turns=shadowTurns(plan.level,previous,plan.targets);
 runtime.shadowUses={scene,count:previous+1};
 plan.shadow.previousUses=previous;plan.shadow.turns=turns;
 if(!plan.shadow.guided)plan.active.remaining=turns*(plan.shadow.capangaPresent?2:1);
 plan.active.shadowClockAt=Number(game.time?.worldTime??0);
 plan.notes=plan.notes.map(note=>note.startsWith('Prisão:')?`Prisão: ${turns} turno(s) do usuário; capangas dobram sua própria duração. Nova tentativa na cena reduz a duração compartilhada, inclusive quando falhar.`:note);
}
export function naraBindingPlan(base,actor,options,attributes,itemId,rules={},books=['basico']){
 if(base.effect==='kage-nui'){
  const stitch=options.mode==='stitch',mane=naraBindingPlan({...base,effect:'kage-mane'},actor,{...options,mode:'normal'},attributes,itemId,rules,books);
  return {...mane,effect:base.effect,name:base.name,action:stitch?'full':'standard',duration:stitch?'sustained':'instant',
   precisionBonus:0,damage:2*base.level,projectiles:2*base.level,nui:{stitch},conditions:[],resistances:[],
   shadow:{...mane.shadow,binding:false,mane:false},
   active:stitch?{family:'kagejutsu',effect:base.effect,nuiSource:true,physicalRestraint:true}:null,
   hardness:base.level+Math.ceil(Number(attributes.int??0)/2),
   notes:[`${2*base.level} agulhas disponíveis; distribua entre os alvos marcados. Cada agulha acrescenta 1 ao dano base do alvo.`,
    'Decisão da mesa de 19/11/2026: somar as agulhas por alvo e aplicar dureza e absorção uma vez por alvo.',
    'Segue alcance e condições de uso de Kage Mane, sem a penalidade de técnica lenta.',
    stitch?'Costurar: ação completa; grau 3 ou maior prende por duração sustentada. Repetir contra a própria vítima ainda costurada permite Paralisado com qualquer grau e exige concentração.':'Perfuração: ação padrão, duração instantânea.',
    ...(stitch?['Use ao menos dois filamentos por vítima, pelas regras de Algema de Sombra. Força permite escapar em ação padrão; Escapar não é permitido.']:[])]};
 }
 if(base.effect==='kageyose'){
  const bind=options.mode==='bind',count=Number(options.targets??1),maximum=base.level,
   difficulty=9+base.level+Math.ceil(Number(attributes.int??0)/2),hardness=base.level+Math.ceil(Number(attributes.int??0)/2);
  if(bind&&(!Number.isInteger(count)||count<1||count>maximum))throw Error(`Use dois filamentos por alvo, até ${maximum} criaturas.`);
  return {...base,action:bind?'standard':'movement',stat:bind?'cd':null,seals:true,range:5+2*base.level,
   duration:bind?'concentration':'sustained',targets:bind?count:0,hardness,
   ...(bind?{filamentBinding:true,difficulty,conditions:['impedido'],resistances:[{stat:['for','escapar'],difficulty,onFail:[],escape:true,action:'standard'}]}:{}),
   active:{family:'kagejutsu',effect:base.effect,filaments:2*base.level,...(bind?{conditions:['impedido'],hardness,physicalRestraint:true}:{shadowObjects:true})},
   notes:[`${2*base.level} filamentos; dois por criatura algemada. Cada filamento pode segurar ou apanhar objetos pequenos.`,
    bind?'Algema de Sombra segue Algemar 6: ação padrão, Concentração, sem dano; Força ou Escapar em ação padrão para sair (Básico pp. 102, 172).':'Reunir os filamentos em um ponto usa ação padrão; a mesa define os objetos pequenos e o ponto de chegada (Básico p. 171).',
    `Filamentos têm dureza ${hardness}. Algemas atingidas por uma área também sofrem o ataque.`,
    'Arremessar um projétil apanhado usa CD normalmente; não concede treinamento ou propriedades de arma.']};
 }
 if(base.effect==='kage-shuriken'){
  const prepared=options.mode==='projectile'?(actor.system.powerState?.active??[]).find(a=>
   a.id===options.shadowPreparedId&&a.shadowProjectilePrepared&&a.itemId===itemId&&a.sourceUuid===actor.uuid&&a.active!==false):null;
  if(options.mode==='projectile'&&!prepared)throw Error('Escolha uma arma preparada com a sombra.');
  const weaponId=prepared?.weaponId??options.weaponId,weapon=[...actor.items].find(i=>i.id===weaponId),
   definition=WEAPONS.find(w=>w.key===weapon?.system.catalogKey&&w.book===weapon?.system.catalogBook);
  if(!definition||!books.includes(definition.book)||!definition.range||!weapon.system.equipped||weapon.system.destroyed||weapon.system.inventoryData?.storedElsewhere||Number(weapon.system.quantity??0)<1)
   throw Error('Saque uma arma que possa ser arremessada antes de preparar a sombra.');
  if(definition.key!=='aian'&&options.shadowConductor!==true&&options.shadowConductor!=='on'&&!prepared?.conductorConfirmed)
   throw Error('Confirme com a mesa que esta arma possui material condutor de chakra.');
  const attack=weaponAttack(definition,actor.system,[...actor.items],rules,{mode:'ranged',itemId:weapon.id,attributes});
  if(!prepared&&(actor.system.powerState?.active??[]).some(a=>a.shadowProjectilePrepared&&a.weaponId===weapon.id&&a.active!==false))
   throw Error('Esta arma já possui uma sombra preparada.');
  if(!prepared)return {...base,stat:null,action:'partial',seals:true,targets:0,duration:'prepared',range:null,
   active:{family:'kagejutsu',effect:base.effect,shadowProjectilePrepared:true,weaponId:weapon.id,conductorConfirmed:true},
   notes:['Preparação parcial adicional ao saque da arma; o chakra é pago nesta preparação.',
    'O texto não define quanto tempo a arma pode aguardar antes do arremesso. Confira com a mesa e encerre manualmente se necessário.',
    'O arremesso padrão mira o solo na sombra, sem causar dano à criatura. A concentração e o limite de dois turnos começam na captura.']};
  if(base.level!==prepared.plan.level)throw Error('Use o nível registrado na preparação desta arma.');
  const difficulty=9+base.level+Math.ceil(Number(attributes.int??0)/2),unknown=options.shadowIntentionUnknown===true||options.shadowIntentionUnknown==='on';
  return {...base,stat:'cd',action:'standard',seals:false,cost:0,targets:1,duration:'concentration',range:5+2*base.level,
   consume:{id:weapon.id,key:definition.key,quantity:1},
   precisionBonus:attack.bonus+Math.max(-3,attack.penalty),damage:null,difficulty,
   conditions:['paralisado'],resistances:[{stat:'for',difficulty,onFail:[],escape:true,action:'standard'}],
   shadow:{binding:true,projectile:true,mane:false,silent:false,maximum:1,turns:2,intentionUnknown:unknown,projectileFrom:prepared.id},
   active:{family:'kagejutsu',effect:base.effect,shadowSource:true,requiresImmobile:true,remaining:2},
   notes:['Arremesso padrão contra a sombra no solo; custo já pago na preparação. Sem dano à criatura.',
    unknown?'Intenção desconhecida: −2 na Esquiva e em Antecipar.':'Intenção conhecida: sem a penalidade de −2 nas defesas.',
    'Efeitos de Shibari: usuário imóvel e concentrado, máximo de dois turnos, fuga por Força em ação padrão.',
    'A arma permanece no solo; recupere-a na cena antes de voltar a usá-la.']};
 }
 if(base.effect==='kage-guided'){
  if(Number(options.targets??1)!==1)throw Error('Marque um aliado para conduzir a sombra.');
  const plan=naraBindingPlan({...base,effect:'kage-mane'},actor,{...options,mode:'normal',targets:1},attributes,itemId,rules,books);
  return {...plan,effect:base.effect,name:base.name,stat:null,seals:true,conditions:[],resistances:[],
   duration:'concentration',shadow:{...plan.shadow,binding:false,countUsage:true,guided:true,silent:false},
   active:{family:'kagejutsu',effect:base.effect,shadowSource:true,shadowGuided:true,requiresImmobile:false},
   notes:['O aliado voluntário mantém liberdade de movimentos; a conexão fraca exige concentração (Básico pp. 89, 170).',
    'Quando aliado e inimigo estiverem a até 1 m, pode liberar a sombra com novo custo e técnica silenciosa. A contagem de duração começa ao tentar capturar o inimigo.',
    'O texto não especifica a ação da liberação; o controle fica em Outras para conferência da mesa.']};
 }
 if(base.effect==='kage-kubishibari'){
  const maximum=Math.floor(Number(attributes.esp??0)/6),count=Number(options.targets??1),difficulty=9+base.level+Math.ceil(Number(attributes.int??0)/2);
  if(!Number.isInteger(count)||count<1||count>maximum)throw Error(`Estrangulamento permite até ${maximum} alvo(s) já capturado(s).`);
  return {...base,action:'movement',seals:true,maintenance:true,cost:base.level,duration:'linked',range:null,targets:count,
   shadowStrangle:{damage:base.level+Math.ceil(Number(attributes.int??0)/2),difficulty,maximum},
   notes:['Exige vítimas presas pelo seu Shibari ou Mane. Preserva a duração e a manutenção do vínculo original.',
    `No fim de cada turno seu causa ${base.level+Math.ceil(Number(attributes.int??0)/2)} de dano fixo de sufocamento, mesmo se a vítima prender a respiração.`,
    'A vítima usa Força em ação padrão para retirar o estrangulamento; ainda precisa escapar da prisão original. Após ficar totalmente livre, fica fatigada até o fim do próximo turno.']};
 }
 const {level,effect}=base,light=options.shadowLight??'normal',extra=Number(options.objectShadows??0);
 if(!['normal','long','noon','dark'].includes(light))throw Error('Escolha a iluminação das sombras.');
 if(light==='dark')throw Error('Kagejutsu não funciona em escuridão total.');
 if(!Number.isInteger(extra)||extra<0)throw Error('Informe uma quantidade inteira de sombras de objetos, a partir de zero.');
 const count=Number(options.targets??1),maximum=Math.max(1,Math.floor(level/2));
 if(!Number.isInteger(count)||count<1||count>maximum)throw Error(`Este nível permite até ${maximum} alvo(s) das sombras.`);
 const prepared=options.mode==='prepared'?(actor.system.powerState?.active??[]).find(a=>a.id===options.shadowPreparedId&&a.shadowPrepared&&a.itemId===itemId&&a.sourceUuid===actor.uuid&&a.effect==='kage-mane'&&!a.linkedTo&&a.active!==false&&a.scene===periodKey(actor,'scene')):null;
 if(options.mode==='prepared'&&(!prepared||base.effect!=='kage-mane'||level<7))throw Error('Escolha uma sombra de Mane preparada após uma falha.');
 const guided=options.mode==='guided'?(actor.system.powerState?.active??[]).find(a=>a.id===options.shadowGuidedId&&a.shadowGuided&&a.itemId===itemId&&a.sourceUuid===actor.uuid&&a.active!==false&&a.scene===periodKey(actor,'scene')):null;
 if(options.mode==='guided'&&(!guided||base.effect!=='kage-mane'||level<8))throw Error('Escolha uma conexão de sombra guiada ativa.');
 const projectileConversion=options.mode==='projectile-mane'?(actor.system.powerState?.active??[]).find(a=>a.id===options.shadowPreparedId&&a.effect==='kage-shuriken'&&a.shadowSource&&a.active!==false&&a.itemId===itemId&&a.sourceUuid===actor.uuid):null;
 if(options.mode==='projectile-mane'&&(!projectileConversion||base.effect!=='kage-mane'||count!==1))throw Error('Escolha uma captura ativa de Shuriken para usar Mane livre.');
 const silent=!!guided||options.shadowConcealed===true||options.shadowConcealed==='on';
 const mane=effect==='kage-mane',pull=effect==='kagezukami',duration=mane&&level>=9?'sustained':'concentration';
 const turns=shadowTurns(level,shadowUseCount(actor),count),difficulty=9+level+Math.ceil(Number(attributes.int??0)/2);
 return {...base,stat:'cd',seals:!prepared,cost:level,range:5+2*level+(light==='long'?level:light==='noon'?-level:0)+extra,
  ...(guided?{action:'other',maintenance:true}:{}),
  ...(projectileConversion?{action:'free',maintenance:true}:{}),
  targets:count,duration,precisionBonus:silent?0:-3,conditions:pull?[]:['paralisado'],
  difficulty,resistances:[{stat:'for',difficulty,onFail:[],escape:true,action:'standard'}],
  shadow:{binding:true,mane,pull,silent,turns,maximum,previousUses:shadowUseCount(actor),light,objectShadows:extra,...(prepared?{preparedFrom:prepared.id,closeTargets:[]}:{} ),...(guided?{guidedFrom:guided.id,allyUuid:guided.shadowGuided.allyUuid,allyTokenUuid:guided.shadowGuided.allyTokenUuid}:{}),...(projectileConversion?{projectileConversionFrom:projectileConversion.id}:{})},
  active:{family:'kagejutsu',effect,shadowSource:true,requiresImmobile:!mane,remaining:turns},
  notes:[silent?'Técnica silenciosa: somente Esquiva ou Antecipar, com −3 na defesa.':'Técnica lenta às vistas do alvo: −3 no CD do usuário.',
   'Caído e Alado não ajustam a precisão/alcance deste ataque. Alvo impedido não pode Antecipar e usa Esquiva fixa 9.',
   `Prisão: ${turns} turno(s) do usuário; capangas dobram sua própria duração. Nova tentativa de Shibari ou Mane na cena reduz a duração compartilhada, inclusive quando falhar.`,
   'A vítima tenta Força com ação padrão para sair. Somente a condição deste vínculo é ignorada nessa tentativa.',
   pull?'A vítima age livremente, mas não se desloca. O Nara permanece imóvel e concentrado e pode puxá-la para um ponto dentro do alcance (Básico p. 173).':mane?'O alvo imita deslocamento sem gastar ações; gestos exigem corpo humanoide. Obstáculos e queda de voadores exigem conferência da mesa.':'O usuário deve permanecer imóvel e concentrado; mover-se encerra a técnica.',
   ...(guided?['Liberação da sombra guiada: o texto não define a ação; confira com a mesa. Aliado e inimigo devem estar a até 1 m.']:[])]};
}
