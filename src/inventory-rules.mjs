import {effectiveAttributes} from './physical-rules.mjs';
import {ARMORS,POISONS,inventoryEntry,inventoryRevision} from './inventory-data.mjs';
import {aptitudeOwned,aptitudeBonuses,normalize} from './aptitudes.mjs';
import {skillBase} from './build-rules.mjs';
import {SKILLS} from './config.mjs';
import {CONDITIONS} from './conditions.mjs';
const list=value=>Array.from(value??[]);
const numeric=(n,fallback=0)=>n===null||n===undefined||n===''?fallback:Number(n);
const copy=value=>structuredClone(value??{});
export const ARMOR_STATS=['esq','agi','acrobacia','atletismo','escapar','furtividade'];
export function armorSummary(subject,items,rules={}){
 const system=subject?.system??subject??{};items=list(items??subject?.items);
 const equipped=items.filter(i=>i.system?.equipped&&inventoryEntry(i)?.kind==='armor');
 const armor=equipped.find(i=>inventoryEntry(i).weight!=='accessory')??null,manopla=equipped.find(i=>inventoryEntry(i).key==='gauntlet')??null,entry=armor&&inventoryEntry(armor);
 const trained=!!aptitudeOwned(items,'usar-armaduras-pesadas','',rules),a=system.attributes??{};
 const heavy=entry?.weight==='heavy',max=entry?.absorption??0,absorption=armor&&!armor.system.destroyed?Math.max(0,Math.min(max,numeric(armor.system.absorption?.value,max))):0;
 const errors=[];if(equipped.filter(i=>inventoryEntry(i).weight!=='accessory').length>1)errors.push('Não é permitido vestir uma armadura sobre outra.');
 if(heavy&&numeric(a.for)<10&&numeric(a.vig)<15)errors.push('Armadura pesada exige Força 10 ou Vigor 15.');
 return {armor,manopla,heavy,penalty:entry?(trained?entry.trainedPenalty:entry.untrainedPenalty):0,affectedStats:ARMOR_STATS,absorption,absorptionMax:max,compartments:entry?.compartments??0,errors};
}
export function consumeAbsorption(summary,damage,{ignoreAbsorption=false}={}){
 damage=Number(damage);if(!Number.isFinite(damage)||damage<0)throw Error('Dano deve ser um número não negativo.');
 const absorbed=ignoreAbsorption?0:Math.min(damage,summary.absorption??0),remaining=(summary.absorption??0)-absorbed;
 return {damage:damage-absorbed,absorbed,remaining,armorId:summary.armor?.id??summary.armor?._id??null,changes:absorbed?{'system.absorption.value':remaining,...(remaining===0?{'system.destroyed':true}:{})}:{}};
}
export function canEquipArmor(item,system,items=[],rules={}){
 const entry=inventoryEntry(item);if(entry?.kind!=='armor')return {allowed:true,errors:[]};const errors=[];
 if(item.system.destroyed)errors.push('Esta armadura está inutilizada.');
 if(entry.weight==='heavy'&&numeric(effectiveAttributes(system,{permanentOnly:true}).for)<10&&numeric(effectiveAttributes(system,{permanentOnly:true}).vig)<15)errors.push('Armadura pesada exige Força 10 ou Vigor 15.');
 if(entry.key.includes('vest')&&['','genin'].includes(normalize(system.identity?.rank)))errors.push('Coletes ninja exigem patente Chuunin ou superior.');
 if(entry.weight!=='accessory'&&items.some(i=>(i.id??i._id)!==(item.id??item._id)&&i.system?.equipped&&inventoryEntry(i)?.kind==='armor'&&inventoryEntry(i).weight!=='accessory'))errors.push('Retire a armadura atual antes de vestir outra.');
 if(entry.weight==='accessory'&&items.some(i=>(i.id??i._id)!==(item.id??item._id)&&i.system?.equipped&&inventoryEntry(i)?.key==='gauntlet'))errors.push('Já existe uma manopla equipada.');
 return {allowed:!errors.length,errors,action:entry.weight==='heavy'?'5 minutos':'Completa'};
}
export function inventorySummary(subject,items,rules={}){
 const system=subject?.system??subject??{};items=list(items??subject?.items);const armor=armorSummary(system,items,rules),capacity=Math.max(0,aptitudeBonuses(system,items,rules).capacity+armor.compartments);
 let used=0,mixedHalves=0,storage=0;const unknown=[];
 for(const i of items.filter(i=>['equipment','device'].includes(i.type)&&!i.system?.inventoryData?.storedElsewhere)){
  const e=inventoryEntry(i),d=i.system?.inventoryData??{},q=Math.max(0,numeric(i.system?.quantity,1));
  if(!q)continue;if(e?.kind==='armor')continue;
  if(e?.storage){storage+=e.storage*q;continue;}
  let slots=e?.slots,cap=e?.capacity;
  if(slots===undefined){const parts=String(i.system?.compartments??'').match(/(\d+)\s*(?:item[^/]*)?\/\s*(\d+)/i);if(parts){cap=Number(parts[1]);slots=Number(parts[2]);}else if(!i.system?.compartments){unknown.push(i.id??i._id??i.name);continue;}}
  if(!slots)continue;cap=Math.max(1,cap??1);if(d.kousenPrepared)cap=Math.max(1,Math.floor(cap/2));
  const mixable=e?.utility&&['smoke-bomb','flash-bomb','explosive-tag','marking-bomb','thunder-bomb'].includes(e.key)||['kunai','senbon','shuriken'].includes(i.system?.catalogKey);
  if(mixable&&slots===1)mixedHalves+=Math.ceil(q/(cap/2));else used+=Math.ceil(q/cap)*slots;
 }
 used+=Math.ceil(mixedHalves/2);const excess=Math.max(0,used-capacity);
 return {used,capacity,excess,storage,unknown,armor,movementPenalty:excess*3,penalty:-excess};
}
export function poisonTraining(system,items=[],rules={}){
 const doc=items.find(i=>i.type==='power'&&(i.system?.catalogKey==='dokujutsu'||normalize(i.name).startsWith('dokujutsu'))),dokujutsu=Math.max(0,numeric(doc?.system?.level));
 const trained=numeric(system.skills?.veneficio?.points)>0,chemical=!!aptitudeOwned(items,'quimico','',rules),base=skillBase(system,'veneficio');
 return {trained,chemical,base,veneficio:base+(dokujutsu?2:0),dokujutsu};
}
export function poisonCategory(entry){
 const c=entry.category,revised=entry.book==='avancado';
 return {required:revised?c===7?20:4+2*c:c===0?4:8+2*c,cost:revised?[0,3,10,15,25,40,50,100][c]:[10,25,50,75,100,200][c],difficulty:revised?c===7?30:12+2*c:null};
}
export function poisonResistanceDC(entry,veneficio,{dokujutsu=false,usingPower=false}={}){
 if(entry.book==='avancado'&&dokujutsu||usingPower)return 8+veneficio;
 return (entry.book==='avancado'?9:11)+entry.category+Math.ceil(veneficio/2)+(dokujutsu?1:0);
}
export function poisonCraftPlan(entry,system,items=[],values={},rules={}){
 const medical=!!values.antidote&&!!aptitudeOwned(items,'ninja-medico','',rules),training=poisonTraining(system,items,rules),c=poisonCategory(entry),doses=numeric(values.doses,1),ideal=!!values.ideal;
 if(medical){training.base=skillBase(system,'medicina');training.veneficio=training.base;training.chemical=true;training.trained=numeric(system.skills?.medicina?.points)>0;}
 if(!training.chemical||!training.trained)throw Error('Fabricar exige Químico e ao menos 1 ponto investido em Venefício.');
 if(training.veneficio<c.required||training.dokujutsu<numeric(entry.dokujutsu))throw Error('Pré-requisitos de fabricação não atendidos.');
 if(!Number.isInteger(doses)||doses<1||(!ideal&&entry.book==='avancado'&&doses>15))throw Error(ideal?'Escolha uma quantidade inteira positiva.':'Fabricação improvisada do Guia permite até 15 doses por tentativa.');
 if(entry.rare&&!values.rare)throw Error(`Confirme o ingrediente: ${entry.rare}.`);
 const route=values.route??entry.routes[0];if(!entry.routes.includes(route))throw Error('Método de contágio inválido para este veneno.');
 const kit=items.find(i=>i.system?.catalogKey==='laboratory-kit'&&numeric(i.system?.uses?.value,5)>0);
 if(!ideal&&entry.book==='basico'&&!kit)throw Error('Fora do laboratório equipado, a fabricação do Básico exige um kit de laboratório portátil.');
 const adverse=!!values.adverse||!kit&&!ideal,dc=poisonResistanceDC(entry,training.veneficio,{dokujutsu:!!training.dokujutsu}),difficulty=(c.difficulty??dc)+(entry.book==='avancado'&&adverse?4:0);
 if(ideal&&16+training.veneficio<difficulty)throw Error('Mesmo simulando dois dados, a precisão não alcança a dificuldade de fabricação.');
 return {...training,doses,route,ideal,difficulty,dc,cost:c.cost*doses,kitId:!ideal?(kit?.id??kit?._id):null,skill:medical?'medicina':'veneficio',adverse,minutes:!ideal&&entry.book==='avancado'?10:null,kind:values.antidote?'antidote':'poison'};
}
export function poisonLatency(entry,route,{dokujutsu=false,ingestionMinutes=1}={}){
 if(!entry.routes.includes(route))throw Error('Método de contágio incompatível.');
 if(entry.book==='basico')return {turns:dokujutsu?2:3,seconds:0};
 if(route==='ingestion'){const minutes=dokujutsu?Number(ingestionMinutes):10;if(!Number.isFinite(minutes)||minutes<1||minutes>1440)throw Error('Dokujutsu: escolha de 1 minuto a 24 horas.');return {turns:0,seconds:minutes*60};}
 return {turns:route==='blood'?0:route==='touch'?(dokujutsu?1:3):(dokujutsu?2:4),seconds:0};
}
export function createPoisonExposure(item,{id,now=0,scene='',route,damageGrade=0,hit=true,damage=0,usingPower=false,guaranteedInjection=false,ingestionMinutes=1}={}){
 const e=inventoryEntry(item),d=item.system.inventoryData??{};if(e?.kind!=='poison'||d.kind==='antidote')throw Error('Escolha uma dose de veneno.');
 route=route??d.route??e.routes[0];const dok=!!d.dokujutsu;
 if(route==='blood'&&(!hit||!guaranteedInjection&&damageGrade<(e.book==='avancado'&&dok?2:3)))throw Error('A injeção sanguínea exige golpe de grau suficiente.');
 if(route==='touch'&&(!hit||(!usingPower&&damage<=0)))throw Error('O contato por ataque exige acertar e causar dano.');
 const latency=poisonLatency(e,route,{dokujutsu:dok,ingestionMinutes});
 return {id:id??`${e.book}-${e.key}-${now}`,key:e.key,book:e.book,category:e.category,route,dc:numeric(d.dc,poisonResistanceDC(e,numeric(d.veneficio),{dokujutsu:dok,usingPower})),veneficio:numeric(d.veneficio),dokujutsu:dok,createdAt:now,startAt:now+latency.seconds,delay:latency.turns,elapsed:0,successes:0,failures:0,active:false,scene,suppressedScene:null,treated:false};
}
export function applyPoisonExposure(state,record,{tieRoll=null}={}){
 state=copy(state);state.poisons??=[];const e=POISONS.find(e=>e.key===record.key&&e.book===record.book);
 if(!e)throw Error('Veneno desconhecido.');
 if(e.book==='basico'){state.poisons.push(record);return {state,record};}
 const existing=state.poisons.find(p=>!p.treated&&p.book==='avancado');
 if(!existing){state.poisons.push(record);return {state,record};}
 if(existing.key===record.key)return {state,reExposure:existing.id,record};
 if(existing.category>record.category)return {state,ignored:true,record};
 if(existing.category===record.category){if(!Number.isInteger(tieRoll)||tieRoll<1||tieRoll>8)throw Error('Venenos de mesma categoria exigem 1d8 para desempatar.');if(tieRoll<=4)return {state,ignored:true,record};}
 state.poisons=state.poisons.filter(p=>p.id!==existing.id);state.poisons.push(record);return {state,replaced:existing.id,record};
}
export function poisonResistance(record,{natural,total,now=0,scene='',reExposure=false}={}){
 const e=POISONS.find(e=>e.key===record.key&&e.book===record.book);if(!e)throw Error('Veneno desconhecido.');
 const next=copy(record),success=natural>=15||natural>3&&total>=next.dc;let damage=0,zeroVitality=false;
 if(reExposure){if(!success)next.successes=Math.max(0,numeric(next.successes)-1);return {record:next,success,damage,zeroVitality};}
 if(success)next.successes=numeric(next.successes)+1;else{
  next.failures=numeric(next.failures)+1;if(!next.active){next.active=true;next.firstFailureAt=now;next.firstFailureElapsed=next.elapsed;if(e.seconds)next.expiresAt=now+e.seconds;}
  if(e.redDeath&&next.failures>1)damage=15;
  if(e.deadly&&next.failures===1)next.initialParalysis=true;
  if((e.redDeath||e.deadly)&&next.failures>=3){next.collapseAt=next.elapsed+1;next.deathAt??=now+259200;}
  if(e.stunMargin&&next.dc-total>=e.stunMargin)next.stunnedUntil=next.elapsed+1;
 }
 if(e.sleepFailures&&next.failures>=e.sleepFailures&&!next.sleepAt){next.sleepAt=now;next.sleepUntil=now+e.sleepSeconds;}
 const terminal=e.book==='avancado'?e.category===7:e.category===5;
 if(!terminal&&next.successes>=3){next.suppressedScene=scene;next.active=false;next.initialParalysis=false;if(e.lateSleep!==undefined&&!next.sleepAt)next.lateSleep=e.lateSleep;delete next.sleepAt;delete next.sleepUntil;}
 return {record:next,success,damage,zeroVitality};
}
export function poisonPhase(state,{phase='start',now=0,scene=''}={}){
 const next=copy(state);next.poisons??=[];const prompts=[];let damage=0,zeroVitality=false,dead=false;
 if(phase!=='start')return {state:next,prompts,damage,zeroVitality,dead};
 next.poisons=next.poisons.filter(p=>!p.treated&&(!p.expiresAt||p.expiresAt>now||p.sleepUntil>now||p.deathAt));
 for(const p of next.poisons){
  const e=POISONS.find(e=>e.key===p.key&&e.book===p.book);if(!e)continue;p.elapsed=numeric(p.elapsed)+1;
  if(p.suppressedScene&&p.suppressedScene!==scene){p.suppressedScene=null;p.active=true;p.successes=0;if(p.lateSleep!==undefined){p.sleepAt=now+p.lateSleep;p.sleepUntil=p.sleepAt+e.sleepSeconds;delete p.lateSleep;}}
  if(p.deathAt&&now>=p.deathAt)dead=true;
  if(p.collapseAt&&p.elapsed>=p.collapseAt&&!p.collapsed){zeroVitality=true;p.collapsed=true;}
  if(p.active&&p.initialParalysis&&p.elapsed>p.firstFailureElapsed+1)p.initialParalysis=false;
  if(p.active&&e.damagePerTurn)damage+=e.damagePerTurn;
  if(p.active&&e.sleepTurn&&p.elapsed>=e.sleepTurn&&!p.sleepAt){p.sleepAt=now;p.sleepUntil=now+e.sleepSeconds;}
  if(!p.suppressedScene&&now>=p.startAt&&p.elapsed>=p.delay)prompts.push({id:p.id,stat:'vig',difficulty:p.dc,name:e.name});
 }
 return {state:next,prompts,damage,zeroVitality,dead};
}
export function poisonIsActive(record,{now=0,scene=''}={}){return !record.treated&&record.active&&record.suppressedScene!==scene&&(!record.expiresAt||record.expiresAt>now);}
export function inventoryConditions(subject,{now=0,scene=''}={}){
 const state=subject?.system?.inventoryState??subject?.inventoryState??subject??{},conditions=[];
 for(const p of state.poisons??[]){const e=POISONS.find(e=>e.key===p.key&&e.book===p.book);if(!e||p.treated)continue;
  if(poisonIsActive(p,{now,scene}))for(const effect of e.effects.filter(e=>e.condition!=='debilitado'))conditions.push({id:`inventory-${p.id}-${effect.condition}`,key:effect.condition,name:effect.condition,source:`${e.name} · ${e.book==='avancado'?'Guia':'Básico'} p. ${e.page}`,inventory:true,level:1});
  const add=key=>conditions.push({id:`inventory-${p.id}-${key}`,key,name:key,source:e.name,inventory:true,level:1});
  if(p.sleepAt!==undefined&&p.sleepAt<=now&&p.sleepUntil>now)add('inconsciente');
  if(p.initialParalysis||p.collapseAt&&p.elapsed>=p.collapseAt-1)add('paralisado');
  if(p.collapsed)add('inconsciente');if(p.stunnedUntil&&p.elapsed<=p.stunnedUntil)add('atordoado');
  if(p.deathAt&&now>=p.deathAt)add('morto');
 }
 const ready=(state.conditions??[]).filter(c=>!c.disabled&&(!c.startsAt||now>=c.startsAt)&&(!c.expiresAt||now<c.expiresAt)&&(!c.sceneAfter||scene!==c.sceneAfter)),pillRank={fatigado:1,exausto:2,inconsciente:3},highestPill=Math.max(0,...ready.filter(c=>c.pillSideEffect).map(c=>pillRank[c.key]??0));
 for(const c of ready)if(!c.pillSideEffect||(pillRank[c.key]??0)===highestPill)conditions.push({...c,id:`inventory-${c.id}`,inventory:true});
 if(state.earplugs)conditions.push({id:'inventory-earplugs',key:'surdo',name:'Surdo',source:'Tampões de ouvido · Guia p. 68',inventory:true,level:1});
 return conditions.map(c=>({...c,name:CONDITIONS[c.key]?.name??c.name}));
}
function matchesScope(scope,context){const stat=context.stat,attr=SKILLS[stat]?.[1]??stat;
 switch(scope){case'all':return true;case'social':return context.kind==='social';case'social-resistance':return context.kind==='social-resistance';case'suffocation':return context.suffocation===true;
  case'agility':return attr==='agi'||stat==='escapar';case'strength':return attr==='for';case'vigor':return stat==='vig';case'intelligence':return attr==='int';case'perception':return attr==='per'||stat==='lm';case'mental-perception':return ['int','per'].includes(attr)||stat==='lm';case'visual-perception':return context.vision!==false&&(attr==='per'||stat==='lm');default:return scope===stat;}
}
export function inventoryBonuses(subject,context={},rules={}){
 const system=subject?.system??subject??{},items=list(subject?.items??context.items),state=system.inventoryState??{},now=context.now??0,scene=context.scene??'';
 const summary=inventorySummary(system,items,rules),penalties=[],conditionPenalties=[];let strengthDamageModifier=0,attackFailure=0;
 if(ARMOR_STATS.includes(context.stat)&&summary.armor.penalty)penalties.push({key:'armor',value:summary.armor.penalty});
 if((context.mobility||['for','agi','acrobacia','atletismo','escapar','furtividade','voo'].includes(context.stat))&&summary.penalty)penalties.push({key:'load',value:summary.penalty});
 // Kit absence is only checked in an explicit kit action, never inferred for every roll.
 if(context.kitRequired&&!items.some(i=>i.system?.catalogKey===context.kitRequired&&numeric(i.system.uses?.value,5)>0))penalties.push({key:'missing-kit',value:context.kitRequired==='artisan-kit'?-5:-4});
 for(const p of state.poisons??[]){if(!poisonIsActive(p,{now,scene}))continue;const e=POISONS.find(e=>e.key===p.key&&e.book===p.book);if(!e)continue;
  if(context.kind!=='resistance'&&!context.bodyResistance&&!context.resistingId&&!context.poisonResistance)for(const effect of e.effects.filter(e=>e.condition==='debilitado'&&matchesScope(e.scope,context)))conditionPenalties.push({key:p.id,value:-effect.level});
  if(e.strengthDamage)strengthDamageModifier+=e.strengthDamage;if(context.kind==='attack')attackFailure=Math.max(attackFailure,e.attackFailure??0);
 }
 const marked=state.marked;if(marked&&['prontidao','procurar','rastrear'].includes(context.stat)&&context.locatingMarked)penalties.push({key:'marked',value:3});
 return {penalty:penalties.reduce((s,p)=>s+p.value,0),penalties,conditionPenalty:Math.max(-3,conditionPenalties.reduce((s,p)=>s+p.value,0)),conditionPenalties,movementPenalty:summary.movementPenalty,strengthDamageModifier,attackFailure,armor:summary.armor,capacity:summary.capacity,used:summary.used,excess:summary.excess};
}
export function soldierPillPlan(system,state,doses,{now=0,nonhuman=false,clone=false}={}){
 doses=Number(doses);if(!Number.isInteger(doses)||doses<1)throw Error('Escolha uma quantidade inteira positiva.');if(nonhuman||clone)throw Error('Pílulas do soldado não têm efeito em clones ou criaturas não humanas.');
 state=copy(state);state.pills??={count:0};const previous=numeric(state.pills.count),count=previous+doses,granted=Math.max(0,Math.min(3,count)-Math.min(3,previous));
 state.pills.count=count;state.conditions??=[];
 if(count>3){state.conditions=state.conditions.filter(c=>!c.pillSideEffect&&!String(c.id).startsWith('pill-overdose'));state.conditions.push({id:'pill-overdose-unconscious',key:'inconsciente',name:'Inconsciente',startsAt:now,expiresAt:now+3600,source:'Intoxicação por pílulas · Básico p. 260'},{id:'pill-overdose-exhaustion',key:'exausto',name:'Exausto',startsAt:now+3600,expiresAt:now+3600+20*86400,source:'Intoxicação por pílulas · Básico p. 260'});}
 else {const key=count===1?'fatigado':count===2?'exausto':'inconsciente';state.conditions.push({id:`pill-${count}-${now}`,key,name:key,startsAt:now+3600,untilRest:true,pillSideEffect:true,source:'Pílulas do soldado · Básico p. 260'});}
 const current=numeric(system.resources?.chakra?.value),max=numeric(system.resources?.chakra?.max),gain=granted*Math.ceil(numeric(system.attributes?.esp)/2);
 return {state,count,granted,gain:Math.max(0,Math.min(max,current+gain)-current),chakra:Math.min(max,current+gain),overdose:count>3};
}
export function clearInventoryRestEffects(state){state=copy(state);state.conditions=(state.conditions??[]).filter(c=>!c.untilRest);return state;}
export function resetPillCounter(state){state=copy(state);state.pills={...(state.pills??{}),count:0};return state;}
export function weaponPoisonCoating(item,{now=0,energized=false,dokujutsu=false}={}){const c=item?.system?.inventoryData?.coating;if(!c||energized&&!dokujutsu||now-Number(c.appliedAt??0)>=30*86400)return null;return {...c};}
export function utilityPlan(entry,system,items=[],values={},rules={}){
 const has=key=>!!aptitudeOwned(items,key,'',rules),a=system.attributes??{},n=numeric(values.quantity,1),revised=entry.book==='avancado'||inventoryRevision(rules)==='avancado';
 if(!Number.isInteger(n)||n<1)throw Error('Quantidade inválida.');const maximum=['flash-bomb','marking-bomb','caltrops'].includes(entry.key)&&revised?2:entry.key==='bolas'||entry.key==='net'?1:Infinity;
 if(n>maximum)throw Error(`Use no máximo ${maximum} nesta ação.`);
 let action='Padrão',range=entry.range??0;if(entry.utility&&range>1&&has('arremessador-de-utilitarios'))range=5+numeric(a.des);if(entry.utility&&has('utilitarista-rapido'))action='Movimento';
 const plan={quantity:n,action,range,consume:!!entry.consumable,attack:null,dc:null,notes:[],conditions:[],area:null};
 if(['smoke-bomb','flash-bomb'].includes(entry.key)){plan.area={shape:'hemisphere',diameter:10,count:n};plan.turns=3;if(entry.key==='smoke-bomb'){plan.camouflage=25;plan.notes.push('Camuflagem parcial; Evadir ou sair da área contra o CD do usuário.');plan.attack='cd';}else {plan.conditions.push('ofuscado');if(revised){plan.dc=9+numeric(a.int);plan.resist=['agi','prontidao'];}else {plan.attack='cd';plan.notes.push('A condição depende de permanecer na área; Evadir ou sair da área contra o CD do usuário.');}}}
 if(entry.key==='marking-bomb'){plan.area={shape:'sphere',diameter:10,count:n};plan.dc=9+numeric(a.int);plan.resist=['agi','prontidao'];plan.notes.push('Marcação: +3 em localizar por Prontidão, Procurar e Rastrear; Sensor por olfato tem sucesso automático. Lavar/remover cheiro em 15–30 minutos.');}
 if(entry.key==='thunder-bomb'){plan.area={shape:'sphere',diameter:100};plan.dc=18;plan.resist=['vig'];plan.conditions=['surdo'];plan.turns=10;plan.notes.push('Tampões de ouvido ou cobertura espessa protegem; som audível a até 1 km. Não permite falhar intencionalmente.');}
 if(entry.key==='caltrops'){plan.area={shape:'circle',diameter:5,count:n};plan.notes.push('Lento ao pisar; 1 dano por metro atravessado a pé. Saltar preserva deslocamento. Sobreposição não acumula.');}
 if(entry.key==='bolas'){if(numeric(a.des)<10)throw Error('Boleadeira exige Destreza 10.');plan.attack='cd';plan.conditions=['caido'];plan.notes.push('Sem dano; levantar não exige teste.');}
 if(entry.key==='net'){if(!values.vulnerable)throw Error('Rede exige alvo desprevenido ou indefeso.');plan.attack='cd';plan.penalty=-2;plan.conditions=['impedido'];plan.notes.push('Só arma de corte permite bloquear. Escapar: padrão + Força/Escapar 16; com arma de corte, padrão sem teste.');}
 if(entry.key==='kousen'){
  const mode=values.mode??'pull';plan.mode=mode;plan.attack='cd';plan.consume=false;plan.range=15;
  if(mode==='pull'){plan.penalty=-2;plan.notes.push('Após errar, puxe o mesmo projétil para atacar de novo na mesma ação com −2, ou recupere-o. Não combina com Ataque Múltiplo.');}
  else if(mode==='bind'){
   if(!['desprevenido','indefeso','fintado'].includes(values.vulnerable)||values.vulnerable==='fintado'&&numeric(a.des)<12)throw Error('Amarrar exige alvo desprevenido/indefeso, ou fintado com Destreza 12.');
   plan.conditions=['impedido'];plan.projectiles=has('fuuma-shuriken-kousen')&&values.fuuma?1:6;plan.notes.push('Mantém a condição anterior. Concentração; apenas um alvo. Sair: padrão sem teste ou movimento com Força/Escapar 17. Não combina com Ataque Múltiplo.');
  }else throw Error('Manobra de Kousen inválida.');
  if(!aptitudeOwned(items,'usar-arma','kousen',rules))plan.penalty=(plan.penalty??0)-3;
 }
 if(entry.key==='explosive-tag'){const mode=values.mode??'remote';if(!['remote','kunai','stick','detonate'].includes(mode))throw Error('Uso de tarja inválido.');plan.mode=mode;plan.area={shape:'sphere',diameter:5+n-1};plan.base=n>=5?n:4;plan.dc=7+numeric(a.int)+n-1;plan.resist=['agi','prontidao'];plan.action=mode==='detonate'?'Livre':mode==='kunai'?'Movimento':'Padrão';plan.consume=mode!=='detonate';if(mode==='remote'&&n>2)throw Error('Prepare até 2 tarjas por ação padrão.');if(mode==='kunai')plan.attack='cd';if(mode==='stick'){plan.attack='cc';plan.notes.push('Antes de tocar: Prestidigitação resistida por Prontidão. Depois: CC contra defesa. Colada no alvo, não há resistência à explosão.');}if(mode==='remote')plan.notes.push('Explodem em 3 turnos do usuário; detonação remota antecipada livre até 15 m.');}
 if(entry.key==='earplugs'){plan.action=has('saque-rapido')?'Livre':'Movimento';plan.notes.push('Surdo enquanto usados; proteção contra efeitos sonoros que aceitem tampões.');}
 if(entry.key==='soldier-pill')plan.action='Parcial';
 if(entry.uses)plan.notes.push('Consome um uso do kit. O teste e sua finalidade são escolhidos separadamente.');
 return plan;
}
