import {mindBinding,mindDamageDivisor,mindCommonItems} from './yamanaka-state.mjs';
import {aptitudeOwned,aptitudeItems} from './aptitudes.mjs';
import {hachimonProfile,heavyAttackPlan} from './hachimon-rules.mjs';
import {clanCapabilities,juukenWeaponDamage,corpulenciaPayment} from './clan-capabilities.mjs';
import {partnerDamageDivisor} from './partners.mjs';
import {validatePowerPurchase} from './power-rules.mjs';
import {worldProfile} from './world-settings.mjs';
import {sizeProfile} from './physical-rules.mjs';
import {weaponPoisonCoating} from './inventory-rules.mjs';
import {maneuverPlan} from './maneuvers.mjs';
import {runtimeBonuses,periodKey,mutateRuntime,activeAptitudes} from './aptitude-runtime.mjs';
import {WEAPONS,weaponAttack} from './weapons.mjs';
import {houseRules,statPrecision,derivedSummary} from './automation.mjs';
import {ID} from './config.mjs';
export const OCTOGRAMS={
 '32':{level:4,cost:4,damage:3,seal:3},
 '64':{level:6,cost:6,damage:4,seal:4},
 '128':{level:8}
};
export const needsReload=w=>w.category==='firearm'||['light-crossbow','heavy-crossbow','hidden-shooter'].includes(w.key);
export const weaponDocument=(actor,id)=>id==='unarmed'?{id:'unarmed',name:'Ataque desarmado',system:{catalogKey:'unarmed',catalogBook:'basico'},update:async()=>{}}:actor?.items?.get?.(id)??[...(actor?.items??[])].find(i=>i.id===id);
// Livro Básico 4.1.b, pp. 66 e 266; Guia Avançado, p. 30.
export function weaponHandlingAction(items,rules={}){
 return aptitudeOwned(items,'saque-rapido','',rules)?'Livre':'Parcial';
}
export function canHandleWeapon(item){
 const system=item?.system;
 return item?.type==='equipment'&&!system.destroyed&&!system.inventoryData?.storedElsewhere&&
  Number(system.quantity??1)>0&&WEAPONS.some(weapon=>weapon.key!=='unarmed'&&weapon.key===system.catalogKey&&weapon.book===system.catalogBook);
}
export async function setWeaponReady(actor,itemId,equipped){
 if(!actor?.isOwner)throw Error('Você não controla esta ficha.');
 const item=weaponDocument(actor,itemId);
 if(!canHandleWeapon(item))throw Error('Escolha uma arma ou munição disponível na ficha.');
 if(Boolean(item.system.equipped)===equipped)return;
 const check=statPrecision(actor,'des',{kind:'skill',manualContext:true});
 if(!check.allowed)throw Error(check.reasons.join(' '));
 await item.update({'system.equipped':equipped});
}
export function prepareWeaponAction(actor,itemId,options={}){
 if(!actor?.isOwner)throw Error('Você não pode usar esta ficha.');
  const item=weaponDocument(actor,itemId),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);if(!w)throw Error('Arma não encontrada.');
  if(item.getFlag?.(ID,'juujinReplica')?.blocked)throw Error('Esta réplica de Juujin não pode usar suas propriedades especiais.');
  const opts={...options};
  const octogram=opts.octogram&&Object.hasOwn(OCTOGRAMS,opts.octogram)?OCTOGRAMS[opts.octogram]:null;
  if(opts.octogram&&!octogram)throw Error('Sequência do Octograma inválida.');
  if(opts.twinLions&&opts.twinLions!==true)throw Error('Opção de Leões Gêmeos inválida.');
  if(octogram&&opts.twinLions)throw Error('Escolha Octograma ou Leões Gêmeos.');
  if(octogram)Object.assign(opts,{juuken:true,maneuver:'ataque-multiplo',count:3});
  if(opts.twinLions){
   opts.count=Number(opts.count??2);
   if(![2,3].includes(opts.count))throw Error('Leões Gêmeos exige dois ou três golpes.');
   Object.assign(opts,{juuken:true,maneuver:'ataque-multiplo'});
  }
  const items=mindCommonItems(actor),rules=houseRules();
  const books=worldProfile()?.books??['basico','avancado'];
  let insectPlan;
  if(opts.insectGroups){
   if(w.key!=='unarmed'||opts.juuken||opts.sizeSweep||opts.electricStat||opts.maneuver&&opts.maneuver!=='golpear')throw Error('O ataque básico de Kikaichuu usa Golpear e sua própria forma de ataque.');
   const groups=Number(opts.insectGroups);
   const species=opts.insectSpecies??'kikaichuu';
   if(!['kikaichuu','kidaichuu'].includes(species))throw Error('Espécie de ataque inválida.');
   const giant=species==='kidaichuu';
   const colony=clanCapabilities(actor,{books,rules}).insects.find(i=>i.key==='res-basico-'+species);
   if(!colony?.available||!colony.bindingValid||!Number.isInteger(colony.value)||colony.value<0)throw Error('O ataque exige uma reserva válida da espécie.');
   const total=Math.min(colony.maximum,colony.value+colony.deployed);
   const maximum=giant?total:Math.floor(total/2);
   if(!Number.isInteger(groups)||groups<1||groups>colony.deployed||groups>maximum)throw Error(giant?'Escolha Kidaichuu liberados.':'Escolha insetos liberados, até metade do total da espécie.');
   if(giant){
    const distance=Number(opts.distance??1);
    if(!Number.isFinite(distance)||distance<0||distance>sizeProfile(actor.system).reach)throw Error('Kidaichuu exige contato dentro do alcance corporal.');
   }
   const stat=giant?'cc':'cd';
   const check=statPrecision(actor,stat,{kind:'attack',manualContext:true});
   if(!check.allowed)throw Error(check.reasons.join(' '));
   insectPlan={
    insectDrain:giant?2*groups:groups,weaponId:item.id,stat,precision:check.precision,base:0,critical:15,
    cannotBlock:true,ranged:!giant,action:'Padrão',targetCapanga:opts.targetKind==='capanga',
    ...(giant?{kidaichuu:{amount:groups,itemId:colony.itemId,resourceId:colony.resourceId}}:{}),
    notes:giant?['Kidaichuu · Livro Básico pp. 145–146. O toque drena 2 chakra por inseto. Ao fim do turno, os insetos crescem e dão a primeira mordida sem drenar novamente.']:
      ['Kikaichuu · Livro Básico pp. 143–144. Confirme que os insetos liberados conseguem alcançar o alvo. Acerto drena chakra sem dano à vitalidade.']
   };
  }
  if(insectPlan){
   if(opts.mercy)throw Error('Golpe de Misericórdia exige um ataque de arma ou desarmado.');
   return {item,w,opts,plan:insectPlan,attacks:[insectPlan],coating:null};
  }
  let attackWeapon=w;
  if(opts.shikakyu){
   if(opts.shikakyu!==true||w.key!=='unarmed'||opts.mode==='ranged'||opts.juuken||opts.electricStat||opts.kyoudo||opts.insectGroups)
    throw Error('Shikakyu exige as armas naturais e não combina com outro suporte de ataque corporal.');
   if(['chute-duplo','chute-giratorio','chute-inverso','voadora','rasteira'].includes(opts.maneuver))throw Error('Garras e mordida não são usadas com chutes.');
   const active=(actor.system.powerState?.active??[]).find(p=>p.effect==='shikakyu'&&p.active!==false);
   const source=items.find(i=>i.id===active?.itemId&&i.system.powerData?.family==='shikakyu');
   if(!source||validatePowerPurchase(actor,source,{books,rules}).length||actor.getFlag?.(ID,'capabilities')?.suspensions?.[source.id])
    throw Error('Ative Shikakyu disponível antes de usar garras e mordida.');
   attackWeapon={...w,name:'Garras e mordida',damage:Number(active.naturalWeaponDamage),damageType:'Letal'};
  }
  let tenketsuDifficulty,octogramPlan,twinLions;
  if(opts.juuken){
   if(opts.juuken!==true||w.key!=='unarmed'||opts.mode==='ranged'||opts.electricStat||opts.sizeSweep)throw Error('Juuken exige um golpe corporal com as mãos.');
   if(['chute-duplo','chute-giratorio','chute-inverso','voadora','rasteira'].includes(opts.maneuver))throw Error('Juuken não pode ser usado com chutes.');
   const power=items.find(i=>i.type==='power'&&i.system.powerData?.family==='juuken');
   if(!power)throw Error('Adquira Juuken antes de usar a postura.');
   const errors=validatePowerPurchase(actor,power,{books,rules});
   if(errors.length)throw Error(errors.join(' '));
   const clan=clanCapabilities(actor,{books,rules});
   if(!clan.byakugan)throw Error('Juuken exige Byakugan ativo.');
   const level=Number(power.system.level);
   if(opts.twinLions){
    const turn=periodKey(actor,'turn');
    twinLions=(actor.system.powerState?.active??[]).find(p=>p.effect==='twin-lions'&&p.itemId===power.id&&p.active!==false);
    if(!twinLions||level<7||twinLions.level<7||twinLions.level>level)throw Error('Ative Punho dos Leões Gêmeos no painel de poderes.');
    if(twinLions.createdTurn!==turn&&twinLions.lastProcessed?.maintenance!==turn)throw Error('Mantenha Punho dos Leões Gêmeos neste turno antes de atacar.');
   }else if(octogram){
    if(level<octogram.level)throw Error(`Esta técnica exige Juuken ${octogram.level}.`);
    if(!clan.tenketsu)throw Error('Esta técnica exige Tenketsu Byakugan disponível.');
    octogramPlan={
     name:`${opts.octogram} Pontos do Octograma`,
     cost:octogram.cost??level,
     bonus:octogram.damage??level,
     seal:octogram.seal??(5+Math.floor((level-8)/3)),
     difficulty:7+2*level,
     fatigue:opts.octogram!=='32'
    };
   }else if(clan.tenketsu)tenketsuDifficulty=7+2*level;
   attackWeapon={...w,damage:juukenWeaponDamage(power.system.level)};
  }
  if(twinLions)opts.twinLionsTurn=periodKey(actor,'turn');
  opts.itemId=item.id;opts.now=Number(game.time?.worldTime??0);opts.scene=periodKey(actor,'scene');
  const clan=clanCapabilities(actor,{books,rules});
  const gates=hachimonProfile(actor.system);
  opts.attributes={...derivedSummary(actor).effective};
  const bunbun=clan.bunbun&&opts.mode!=='ranged'&&!opts.juuken?clan.bunbun:null;
  if(bunbun)opts.attributes.for=Math.max(Number(opts.attributes.for),Number(actor.system.attributes.for)+1+(gates?gates.strength:2*Number(clan.calorie?.level??0)));
  if(gates){
   opts.hachimonLotusProgressive=aptitudeItems(items,rules).some(i=>i.lotusSource&&i.system.catalogKey==='ataque-progressivo');
  }
  if(opts.convertedChakra!=null)corpulenciaPayment(actor,octogramPlan?.cost??0,Number(opts.convertedChakra),{books,rules});
  const clone=actor.getFlag?.(ID,'clone'),attackItems=clone?.sourceItems??items;const runtime=runtimeBonuses(actor);let plan=weaponAttack(attackWeapon,actor.system,attackItems,rules,opts);
  const transformed=actor.getFlag?.(ID,'companion')?.transformation;
  if(transformed){
   const source=(game.actors?.contents??[]).find(a=>a.uuid===transformed.sourceUuid);
   if(!source)throw Error('A origem do Juujin Bunshin está indisponível.');
   const sourceAttack=weaponAttack(attackWeapon,source.system,[...source.items],rules,
    {...opts,itemId:item.getFlag?.(ID,'juujinReplica')?.sourceItemId??'unarmed',attributes:derivedSummary(source).effective});
   plan.base=sourceAttack.base+runtimeBonuses(source).damage;
  }
  plan.base+=gates?0:runtime.damage+(octogramPlan?.bonus??0);plan.bonus+=runtime.attack;const beforeManeuverBonus=plan.bonus;plan=maneuverPlan(opts.maneuver??"golpear",plan,w,actor.system,items,rules,opts);const check=statPrecision(actor,plan.stat,{kind:'attack',manualContext:true,run:plan.specialManeuver==='atropelar'});if(!check.allowed)throw Error(check.reasons.join(' '));
  if(opts.shikakyu){plan.damageType='Letal';plan.naturalWeapon=true;plan.notes.push('Shikakyu · garras e mordida letais.');}
  plan.partnerDivisor=mindBinding(actor)?mindDamageDivisor(actor):partnerDamageDivisor(actor,{required:false})??1;
  if(bunbun){
   plan.bunbunId=bunbun.id;
   plan.range=Math.max(plan.range,2);
   if(['atropelar','empurrar','agarrar','derrubar'].includes(plan.specialManeuver))plan.bonus+=Math.max(0,1-Math.max(0,plan.bonus-beforeManeuverBonus));
   plan.notes.push('Bunbun Baika: alcance mínimo 2 m, Força de tamanho Grande; bônus de manobra sem acumular.');
  }
  if(opts.fightDefensively){
   // Básico p. 265. A postura começa ao executar o ataque, antes dos dados.
   if(plan.ranged)throw Error('Lutar na Defensiva exige ataque corporal.');
   const improved=!!aptitudeOwned(items,'combate-defensivo','',rules);
   if(improved&&['rasteira','soco-em-gancho'].includes(opts.maneuver))throw Error('Combate Defensivo não combina com manobra que concede precisão.');
   plan.defensiveStance={dodge:improved?3:2};
   plan.penalty-=improved?2:3;
   for(const strike of plan.attacks??[])strike.penalty-=improved?2:3;
  }
  if(opts.kyoudo){
   // Básico pp. 80–81. Liberação voluntária, sem bônus de dano ou aptidão de manobra.
   const prepared=activeAptitudes(actor)['kyoudo-kyouka'];
   if(!prepared||!aptitudeOwned(items,'kyoudo-kyouka','',rules)||w.key!=='unarmed'||plan.ranged||
    ![undefined,'golpear'].includes(opts.maneuver)||opts.juuken||opts.sizeSweep||opts.insectGroups)
    throw Error('Kyoudo Kyouka exige preparação e um Golpear desarmado compatível.');
   Object.assign(plan,{base:prepared.base,critical:w.critical,cannotBlock:true,kyoudoPreparation:prepared,
    condition:'caido',resist:{stat:'acrobacia',difficulty:prepared.difficulty+runtime.difficulty}});
   plan.notes.push('Kyoudo Kyouka · a preparação é consumida mesmo se errar; Acrobacia evita Caído.');
  }
  if(opts.juuken){
   plan.juuken=true;
   if(twinLions){
    plan.twinLionsId=twinLions.id;
    plan.base=twinLions.level;
    plan.attacks=plan.attacks.map(({damagePool,divisionCount,divisionIndex,...part})=>({...part,base:twinLions.level}));
    plan.action=opts.count===3?'Completa':'Padrão';
    plan.notes.push('Punho dos Leões Gêmeos: cada golpe usa o nível da técnica como dano base.');
   }
   if(octogramPlan){
    plan.octogram=octogramPlan;
    plan.notes.push(`Ação padrão. Custo da sequência: ${octogramPlan.cost} chakra. Cada acerto sela até ${octogramPlan.seal} pontos.`);
   }
   if(tenketsuDifficulty&&plan.base>0){
    plan.tenketsuDifficulty=tenketsuDifficulty;
    plan.notes.push(`Tenketsu Byakugan: Vigor Dif ${tenketsuDifficulty} por golpe que acertar.`);
   }
   if(!twinLions)plan.notes.push('Juuken: golpe desarmado letal com as mãos. Postura livre, sem custo de chakra.');
  }
  if(opts.sizeSweep){if(sizeProfile(actor.system).index<7||opts.maneuver!=='golpear'||plan.ranged)throw Error('O ataque amplo por tamanho exige Imenso ou maior, Golpear e alcance corporal.');plan.sizeSweep=true;}
  plan.targetCapanga=opts.targetKind==='capanga';plan.penalty+=check.penalty-(check.uncappedPenalty??0);plan.bonus+=check.bonus;
  if(item.system.destroyed)throw Error('Esta arma foi destruída.');
  if(plan.ranged&&needsReload(w)&&!item.system.loaded)throw Error('Recarregue antes de disparar.');
  if(plan.ranged&&item.system.damaged)plan.penalty-=1;
  plan.precision=plan.purchased+plan.bonus+Math.max(-3,plan.penalty)+(check.uncappedPenalty??0);
  // Básico p. 263. O golpe usa uma única arma e resolve o crítico sem defesa.
  if(opts.mercy){
   if(![undefined,'golpear'].includes(opts.maneuver)||plan.attacks||plan.sizeSweep||plan.extendedBlade||plan.action==='Completa'||
    !['knockout','kill'].includes(opts.mercyOutcome??'knockout'))
    throw Error('Golpe de Misericórdia exige um único ataque compatível.');
   if(clone&&opts.targetKind!=='capanga')throw Error('O clone não pode obter crítico contra um alvo não capanga.');
   plan.mercy={outcome:opts.mercyOutcome??'knockout',capanga:opts.targetKind==='capanga'};
   plan.automaticHit=true;
   plan.action='Completa';
  }
  const poisonPower=(actor.system.powerState?.active??[]).find(effect=>effect.active!==false&&effect.weaponId===item.id&&effect.poisonCoating);
  const coating=poisonPower?.poisonCoating??weaponPoisonCoating(item,{now:opts.now});
  if(coating&&!coating.powerBound&&plan.ranged&&(coating.projectiles??w.capacity??1)<plan.units)throw Error('Aplicação venenosa insuficiente para todos os projéteis; prepare outro lote ou remova a aplicação.');

  if(plan.ranged&&['short-bow','long-bow'].includes(w.key)&&!items.some(i=>i.system.catalogKey==='arrows'&&Number(i.system.quantity??0)>0))throw Error('Sem flechas.');
  if(plan.ranged&&!['shot','firearm','ammo'].includes(w.category)&&Number(item.system.quantity??0)<plan.units)throw Error('Quantidade de projéteis insuficiente.');
  const fusion=(actor.system.powerState?.active??[]).find(p=>p.extraBasicAttack&&p.active!==false&&p.fusionReady);
  if(fusion&&!plan.ranged&&(opts.maneuver??'golpear')==='golpear'&&!plan.attacks&&!opts.mercy){
   if(opts.juuken||opts.kyoudo||opts.electricStat||opts.sizeSweep||plan.extendedBlade)
    plan.notes.push('União: a combinação do ataque extra com este suporte precisa ser conferida pela mesa. O ataque extra não pode executar manobras ou aptidões.');
   else{
    plan.fusionTwoHeads=true;
    plan.attacks=[{base:plan.base,bonus:plan.bonus-check.bonus,penalty:plan.penalty-check.penalty+(check.uncappedPenalty??0)},
     {base:Math.ceil(plan.base/2),damagePool:plan.base,divisionCount:2,divisionIndex:0,postDivisionBonus:0,
      bonus:plan.bonus-check.bonus,penalty:plan.penalty-check.penalty+(check.uncappedPenalty??0),fusionExtra:true,
      notes:['Ataque extra da união: metade do dano base normal após dureza; mesmo alvo, sem manobras ou aptidões.']}];
   }
  }
  plan=heavyAttackPlan(plan,actor,{requested:opts.hachimonHeavy,turn:periodKey(actor,'turn'),scene:periodKey(actor,'scene')});
  const attacks=plan.attacks?.map(part=>({...plan,...part,notes:[...plan.notes,...(part.notes??[])],precision:plan.purchased+part.bonus+check.bonus+Math.max(-3,part.penalty+check.penalty-(check.uncappedPenalty??0)+(item.system.damaged?-1:0))+(check.uncappedPenalty??0),attacks:undefined}))??[plan];

 if(!books.includes(w.book))throw Error('O livro desta arma não está habilitado.');
 const chosen=items.find(i=>i.type==='aptitude'&&i.system.catalogKey===opts.maneuver);
 if(chosen&&!books.includes(chosen.system.catalogBook))throw Error('O livro desta aptidão não está habilitado.');
 return {item,w:attackWeapon,opts,plan,attacks,coating};
}
// Persist the cost plan before applying it; receipts share each Item update.
export function weaponCosts({item,w,plan,coating},actor){
 if(plan.insectDrain)return [];
 const costs=new Map();
 const add=(doc,path,value)=>{const c=costs.get(doc.id)??{itemId:doc.id,before:{},patch:{}};c.before[path]=path.split('.').reduce((o,k)=>o?.[k],doc)??null;c.patch[path]=value;costs.set(doc.id,c);};
 if(plan.ranged&&['short-bow','long-bow'].includes(w.key)){const ammo=[...actor.items].find(i=>i.system.catalogKey==='arrows'&&Number(i.system.quantity??0)>0);if(!ammo)throw Error('Sem flechas.');add(ammo,'system.quantity',Number(ammo.system.quantity)-1);}
 if(plan.ranged&&!['shot','firearm','ammo'].includes(w.category))add(item,'system.quantity',Number(item.system.quantity)-plan.units);
 if(coating&&!coating.powerBound&&plan.ranged){const n=coating.projectiles??w.capacity??1;add(item,'system.inventoryData.coating',n===plan.units?null:{...coating,projectiles:n-plan.units});}
 if(plan.ranged&&needsReload(w))add(item,'system.loaded',false);
 return [...costs.values()];
}
export async function commitWeaponCosts(actor,costs,executionId,chakraCost=0,kyoudoPreparation=null,defensiveStance=null,chargeDefensePenalty=0,bunbunId=null,convertedChakra=0){
 if(!actor?.isOwner)throw Error('Você não pode usar esta ficha.');
 if(bunbunId)await mutateRuntime(actor,state=>{
  state.bunbunSpent??={};
  if(state.bunbunSpent[executionId])return;
  if(state.bunbun?.id!==bunbunId)throw Error('A preparação de Bunbun mudou. Prepare novamente.');
  delete state.bunbun;state.bunbunSpent[executionId]=true;
 });
 if(defensiveStance)await mutateRuntime(actor,state=>{
  state.defensiveStances??={};
  if(state.defensiveStances[executionId])return;
  state.active['lutar-na-defensiva']={...defensiveStance,turn:periodKey(actor,'turn')};
  state.defensiveStances[executionId]=true;
 });
 if(chargeDefensePenalty&&game.combat?.started)await mutateRuntime(actor,state=>{
  state.chargeDefenses??={};
  if(state.chargeDefenses[executionId])return;
  state.active['penalidade-investida']={penalty:chargeDefensePenalty,turn:periodKey(actor,'turn')};
  state.chargeDefenses[executionId]=true;
 });
 if(kyoudoPreparation)await mutateRuntime(actor,state=>{
  state.kyoudoSpent??={};
  if(state.kyoudoSpent[executionId])return;
  const current=state.active['kyoudo-kyouka'];
  if(!current||JSON.stringify(current)!==JSON.stringify(kyoudoPreparation))throw Error('A preparação de Kyoudo Kyouka mudou.');
  delete state.active['kyoudo-kyouka'];
  state.kyoudoSpent[executionId]=true;
 });
 if(chakraCost)await mutateRuntime(actor,state=>{
  state.weaponChakraCosts??={};
  if(state.weaponChakraCosts[executionId])return;
  const payment=corpulenciaPayment(actor,chakraCost,Number(convertedChakra),{books:worldProfile()?.books,rules:houseRules()});
  state.weaponChakraCosts[executionId]=true;
  return {changes:payment};
 });
 for(const c of costs){const item=actor.items.get(c.itemId);if(!item)throw Error('Material removido durante o início. Restaure o item para retomar.');
  if(item.getFlag?.(ID,'actionCosts')?.[executionId])continue;
  for(const [path,expected]of Object.entries(c.before)){const current=path.split('.').reduce((o,k)=>o?.[k],item)??null;if(JSON.stringify(current)!==JSON.stringify(expected))throw Error('O material mudou durante o início. Confira a execução antes de retomar.');}
  await item.update({...c.patch,[`flags.${ID}.actionCosts.${executionId}`]:true});
 }
}
export function weaponFingerprint(actor,itemId,options){
 const {item,w,opts,plan,attacks,coating}=prepareWeaponAction(actor,itemId,options);
 // No private character snapshot is published. Exact inputs remain on the actor.
 const {now,...stableOptions}=opts;const text=JSON.stringify({itemId,w:w.key,options:stableOptions,plan,attacks,coating});let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16);
}
