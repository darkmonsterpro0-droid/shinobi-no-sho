// Shinobi adapter: Livro Básico 4.1.b, pp. 142–147, 157–159, 181–184.
import {ID} from './config.mjs';
import {capabilityLedger,capabilityId} from './core/capabilities.mjs';
import {restrictedDefinition,restrictedEligibility,restrictedFacts} from './restricted-aptitudes.mjs';
import {mutateRuntime,periodKey} from './aptitude-runtime.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
export const juukenWeaponDamage=level=>Math.min(4,Math.max(1,Number(level)-2));
export const MANGEKYOU_PAIRS={
 'tsukuyomi-amaterasu':['Tsukuyomi','Amaterasu'],
 'kagutsuchi-amaterasu':['Kagutsuchi','Amaterasu'],
 'kamui':['Kamui curto','Kamui longo']
};
// Livro Básico 4.1.b, p. 151. Payment replaces part of a technique's cost.
export function corpulenciaPayment(actor,cost,converted=0,context={}){
 if(!Number.isFinite(cost)||cost<0)throw Error('Custo de chakra inválido.');
 if(!Number.isSafeInteger(converted)||converted<0||converted>cost)
  throw Error('Informe quantos pontos inteiros do custo em chakra serão pagos com Vitalidade.');
 if(cost===0)return {};
 const {chakra,vitality}=actor.system.resources??{};
 const chakraCost=cost-converted,vitalityCost=2*converted;
 if(converted&&!clanCapabilities(actor,context).corpulenciaId)throw Error('Converter Vitalidade exige Corpulência disponível.');
 if(!Number.isFinite(chakra?.value)||chakra.value<chakraCost)throw Error('Chakra insuficiente.');
 if(vitalityCost&&(!Number.isFinite(vitality?.value)||vitality.value<vitalityCost))throw Error('Vitalidade insuficiente para Corpulência.');
 return {'system.resources.chakra.value':chakra.value-chakraCost,
  ...(vitalityCost?{'system.resources.vitality.value':vitality.value-vitalityCost}:{})};
}
// Discovery only: spending still requires an explicit conversion chosen by the owner.
export function canPayChakraCost(actor,cost,context={},converted=null){
 if(converted==null){
  converted=clanCapabilities(actor,context).corpulenciaId?Math.max(0,cost-Math.max(0,Number(actor.system.resources?.chakra?.value??0))):0;
 }
 try{corpulenciaPayment(actor,cost,converted,context);return true;}catch{return false;}
}
export const DOUJUTSU_KEYS=['res-basico-byakugan','res-basico-sharingan'];
export const HAKKEN_KEY='res-basico-hakken-no-jutsu';
const flag=(actor,key)=>actor.getFlag?.(ID,key)??actor.flags?.[ID]?.[key];
const itemId=item=>item.id??item._id;
export function clanCapabilities(actor,{books,rules={},scene=periodKey(actor,'scene')}={}) {
 const items=[...(actor.items??[])],raw=flag(actor,'capabilities');
 let ledger;try{ledger=capabilityLedger(raw);}catch{return {eyes:[],intuition:0,insects:[],invalid:true};}
 const usable=item=>{
  const definition=restrictedDefinition(item.system?.catalogKey,item.system?.catalogBook),data=item.system?.capabilityData;
  if(!definition||ledger.schemaVersion!==1||data?.schemaVersion!==1||data.definitionId!==definition.id||ledger.suspensions?.[itemId(item)])return false;
  const access=restrictedEligibility(definition,actor.system,items.filter(i=>i!==item),{books,rules,level:Number(item.system.level),accessOrigin:data.accessOrigin});
  return access.allowed===true||access.allowed===null&&!!data.reviewReason?.trim();
 };
 // Básico 4.1.b, pp. 150–151: Corpulência, uma aptidão passiva do clã Akimichi.
 const corpulencia=items.find(i=>i.system?.catalogKey==='res-basico-corpulencia'&&usable(i));
 const resilience=items.find(i=>i.system?.catalogKey==='res-basico-resiliencia'&&usable(i));
 const resiliencia=resilience?{itemId:itemId(resilience),hardness:Math.floor(Math.max(0,Number(actor.system.attributes?.vig??0))/4),penalties:true}:null;
 const runtime=flag(actor,'aptitudes')??{};
 const calories=runtime.akimichi??{};
 const calorieRecord=calories.active;
 const calorie=corpulencia&&resilience&&calorieRecord?.scene===scene&&calorieRecord.corpulenciaId===itemId(corpulencia)&&
  calorieRecord.resilienciaId===itemId(resilience)&&(calorieRecord.pill?calorieRecord.remaining>0:Number(actor.system.attributes?.vig)>=14)?calorieRecord:null;
 const chou=calorie?.level===3;
 if(resiliencia){
  if(calories.recovering)resiliencia.hardness=0;
  if(chou)resiliencia.penalties=false;
 }
 const baika=items.find(i=>i.type==='power'&&i.system?.powerData?.family==='baika-ninpou'&&Number(i.system.level)>=1);
 const bunbunRecord=runtime.bunbun;
 const bunbun=corpulencia&&baika&&Number(baika.system.level)>=3&&Number(actor.system.campaign?.level??4)>=6&&bunbunRecord?.scene===scene&&bunbunRecord.itemId===itemId(baika)&&
  Number(actor.system.attributes?.vig??0)>=6&&aptitudeOwned(items,'lutador','',rules)&&usablePowerSource(baika,ledger)?bunbunRecord:null;
 const vision=runtime.mangekyouVision??{remaining:10,wear:0,exhaustions:0};
 const active=runtime.active??{};
 const eyes=DOUJUTSU_KEYS.map(key=>{
  const record=active[key],item=items.find(i=>itemId(i)===record?.sourceItemId&&i.system?.catalogKey===key);
  const effective=!!item&&record.scene===scene&&usable(item)&&!(key==='res-basico-sharingan'&&vision.remaining===0);
  return {key,itemId:record?.sourceItemId,active:effective};
 });
 const sharingan=eyes.find(e=>e.key==='res-basico-sharingan').active;
 const nidanSource=sharingan?items.find(i=>i.system?.catalogKey==='res-basico-nidan-sharingan'&&usable(i)):null;
 const nidan=!!nidanSource;
 const sandan=nidan&&items.some(i=>i.system?.catalogKey==='res-basico-sandan-sharingan'&&usable(i));
 const naturalKaton=items.find(i=>i.system?.catalogKey==='res-basico-elemento-natural-katon'&&usable(i));
 const mangekyou=sandan&&items.some(i=>i.system?.catalogKey==='res-basico-mangekyou-sharingan'&&usable(i));
 const byakugan=eyes.find(e=>e.key==='res-basico-byakugan').active;
 const tenketsu=byakugan&&items.some(i=>i.system?.catalogKey==='res-basico-tenketsu-byakugan'&&usable(i));
 const facts=restrictedFacts(actor.system,items),track=facts['skill.rastrear']??0;
 const hakkenSource=items.find(i=>i.system?.catalogKey===HAKKEN_KEY&&usable(i));
 const hakkenRecord=active[HAKKEN_KEY];
 const hakken=hakkenSource?{itemId:itemId(hakkenSource),active:hakkenRecord?.sourceItemId===itemId(hakkenSource)&&hakkenRecord.scene===scene,
  range:10+2*track,olfactoryDifficultyReduction:1}:null;
 const companionSource=items.find(i=>i.system?.catalogKey==='res-basico-companheiro-animal'&&usable(i));
 const companion=companionSource?{itemId:itemId(companionSource),maximum:1+(facts['skill.lidar']>=16?1:0)+(facts['skill.lidar']>=18?1:0),
  size:facts['skill.lidar']>=14?'large':facts['skill.lidar']>=10?'medium':'small',speaks:facts['skill.lidar']>=14}:null;
 const kikaAvailable=items.some(i=>i.system?.catalogKey==='res-basico-kikaichuu'&&usable(i));
 const focus=runtime.byakuganFocus;
 const focused=focus?.scene===scene&&focus.sourceItemId===eyes[0].itemId;
 const currentTurn=flag(actor,'currentTurnKey')??'outside';
 // Livro Básico 4.1.b, pp. 222–223.
 const kaguraSource=items.find(i=>i.system?.catalogKey==='res-basico-kagura-shingan'&&usable(i));
 const kaguraAdvanced=kaguraSource&&items.find(i=>i.system?.catalogKey==='res-basico-ryoushitsu-kagura-shingan'&&usable(i));
 const kagura=kaguraSource?kaguraState(runtime.kaguraFocus,{track,scene,currentTurn,
  sourceId:itemId(kaguraSource),advancedId:kaguraAdvanced?itemId(kaguraAdvanced):null}):null;
 const standardRange=10+2*track;
 let byakuganRange=standardRange;
 if(focused&&focus.mode==='extended'&&track>=5&&focus.turn!==currentTurn)byakuganRange*=2;
 if(focused&&focus.mode==='progressive'&&focus.ready&&tenketsu&&track>=9)byakuganRange=50*track;
 const insects=items.filter(i=>restrictedDefinition(i.system?.catalogKey)?.origin==='aburame').map(item=>{
  const key=item.system.catalogKey,links=ledger.bindings?.[itemId(item)]??item.system.capabilityData?.resourceLinks??[];
  const link=links.find(l=>l.key==='aburame.reserve'),reserve=(actor.system.special??[]).find(r=>r.id===link?.resourceId);
  const shared=!!link&&items.some(i=>i!==item&&restrictedDefinition(i.system?.catalogKey)?.origin==='aburame'&&(ledger.bindings?.[itemId(i)]??i.system.capabilityData?.resourceLinks??[]).some(l=>l.key==='aburame.reserve'&&l.resourceId===link.resourceId));
  const incompatible=items.some(i=>i!==item&&['res-basico-kidaichuu','res-basico-rinkaichuu'].includes(i.system?.catalogKey))&&['res-basico-kidaichuu','res-basico-rinkaichuu'].includes(key);
  const maximum=key==='res-basico-kidaichuu'?Math.floor((facts['skill.lidar']??0)/3):facts['skill.lidar']??0;
  const deployed=flag(actor,'aptitudes')?.insectDeployments?.[itemId(item)]?.[reserve?.id]??0;
  const losses=flag(actor,'aptitudes')?.insectLosses?.[itemId(item)]?.[reserve?.id]??[];
  const now=Number(game.time?.worldTime??0);
  const isRinka=key==='res-basico-rinkaichuu';
  const ready=losses.filter(loss=>loss.turns===0||loss.due<=now).reduce((sum,loss)=>sum+loss.amount,0);
  const recoverable=isRinka?Math.min(ready,Math.floor(maximum/2)):ready;
  const partners=(runtime.kidaichuuPartners??[]).filter(r=>r.itemId===itemId(item)&&r.resourceId===reserve?.id&&!r.ended);
  const occupied=(actor.system.powerState?.active??[]).filter(p=>p.active!==false&&p.sourceUuid===actor.uuid&&p.insectResourceId===reserve?.id).reduce((sum,p)=>sum+p.insectGroups,0);
  return {itemId:itemId(item),key,maximum,deployed,occupied,partners,recoverable,pendingLosses:losses.reduce((sum,loss)=>sum+loss.amount,0),unit:key==='res-basico-kidaichuu'?'insetos':'grupos',resourceId:link?.resourceId,value:reserve?.value,available:usable(item)&&(key==='res-basico-kikaichuu'||kikaAvailable)&&!shared&&!incompatible,bindingValid:!!reserve&&!shared,shared,incompatible};
 });
 return {eyes,hakken,companion,kagura,resiliencia,calorie,chou,bunbun,corpulenciaId:corpulencia?itemId(corpulencia):null,byakugan,sharingan,nidan,sandan,mangekyou,vision,naturalKatonId:naturalKaton?itemId(naturalKaton):null,tenketsu,granted:nidanSource?[{benefitKey:'intuicao',sourceItemId:nidanSource?itemId(nidanSource):null,level:1}]:[],intuition:nidan&&!rules.banCombatAptitudes?1:0,byakuganBaseRange:standardRange,byakuganRange:byakugan?byakuganRange:null,byakuganFocus:byakugan&&focused?focus:null,shokaSearch:runtime.shokaSearch,insects,invalid:ledger.schemaVersion!==1};
}
const usablePowerSource=(item,ledger)=>!ledger.suspensions?.[itemId(item)];
export function kaguraState(record,{track,scene,currentTurn,sourceId,advancedId,
 combat=globalThis.game?.combat,now=Number(globalThis.game?.time?.worldTime??0)}){
 const standard=(20+4*track)*(advancedId?2:1),passive=standard/2;
 const mode=record&&record.scene===scene&&record.sourceId===sourceId&&
  (!['progressive','suppress'].includes(record.mode)||!!advancedId&&track>=6)&&
  (record.mode!=='extended'||track>=4)&&
  (record.mode!=='active'||!record.combatId||record.combatId===combat?.id&&record.turn===currentTurn)?record.mode:null;
 const elapsed=mode?Math.max(0,now-record.startedAt):0;
 const rounds=mode&&record.combatId&&record.combatId===combat?.id?Math.max(0,combat.round-record.round):0;
 const ready=mode==='extended'?(record.combatId?record.combatId===combat?.id&&record.turn!==currentTurn:elapsed>=6):
  mode==='progressive'?elapsed>=120||rounds>=20:true;
 const range=mode==='active'?standard:mode==='extended'?standard*(ready?2:1):
  mode==='progressive'?ready?100*track:standard:passive;
 return {sourceId,advancedId,track,standard,passive,range,mode,ready,
  suppressionDC:mode==='suppress'?9+track:null,concentrating:!!mode&&mode!=='active'};
}

export async function clearKaguraProgressive(actor){
 if(flag(actor,'aptitudes')?.kaguraFocus?.mode!=='progressive')return;
 await mutateRuntime(actor,state=>{if(state.kaguraFocus?.mode==='progressive')state.kaguraFocus=null;});
}

// Livro Básico 4.1.b, pp. 143–147. The table declares which groups leave or return.
export async function changeInsectDeployment(actor,item,{operation,amount,requestId,books,rules}){
 const itemKey=itemId(item);
 if(!capabilityId(itemKey)||!capabilityId(requestId)||!Number.isInteger(amount)||amount<1)throw Error('Informe uma quantidade inteira positiva de insetos.');
 return mutateRuntime(actor,state=>{
  state.insectReceipts??={};
  if(state.insectReceipts[requestId])return {duplicate:true};
  const colony=clanCapabilities(actor,{books,rules}).insects.find(r=>r.itemId===itemKey);
  if(!colony?.bindingValid||!capabilityId(colony.resourceId))throw Error('Vincule uma reserva independente para esta espécie.');
  const reserve=actor.system.special.find(r=>r.id===colony.resourceId);
  if(reserve.resourceData?.schemaVersion!=null&&reserve.resourceData.schemaVersion!==1)throw Error('Versão da reserva não suportada.');
  const count=reserve.value;
  if(!Number.isInteger(count)||count<0)throw Error('Preencha o saldo da reserva com um inteiro não negativo.');
  state.insectDeployments??={};
  const deployments=state.insectDeployments[itemKey]??={};
  const deployed=deployments[reserve.id]??0;
  const search=state.shokaSearch;
  const searching=search?.itemId===itemKey&&search.resourceId===reserve.id?search.groups:0;
  if(['insects-return','insects-loss'].includes(operation)&&amount>deployed-searching)throw Error('A quantidade excede os insetos liberados fora da busca. Cancele a busca para liberar seus grupos.');
  let next=count;
  if(operation==='insects-deploy'){
   if(!colony.available)throw Error('A espécie está indisponível.');
   if(amount>count-colony.occupied||count+deployed+colony.partners.reduce((sum,r)=>sum+r.amount,0)>colony.maximum)throw Error('A quantidade excede a reserva ou a capacidade da espécie.');
   next-=amount;
   deployments[reserve.id]=deployed+amount;
  }else if(operation==='insects-return'){
   if(amount>deployed)throw Error('A quantidade excede os insetos liberados.');
   const maximum=Math.min(colony.maximum,reserve.max??colony.maximum);
   if(count+amount>maximum)throw Error('O recolhimento excederia a capacidade da reserva.');
   next+=amount;
   deployments[reserve.id]=deployed-amount;
  }else if(operation==='insects-loss'){
   if(amount>deployed)throw Error('A quantidade excede os insetos liberados.');
   deployments[reserve.id]=deployed-amount;
   if(['res-basico-kikaichuu','res-basico-shokaichuu','res-basico-rinkaichuu','res-basico-kidaichuu'].includes(colony.key)){
    state.insectLosses??={};
    const species=state.insectLosses[itemKey]??={};
    const losses=species[reserve.id]??=[];
    losses.push(colony.key==='res-basico-rinkaichuu'?{amount,turns:1}:{amount,due:Number(game.time?.worldTime??0)+2*86400});
   }
  }else if(operation==='insects-recover'){
   if(!colony.available)throw Error('A espécie está indisponível.');
   if(amount>colony.recoverable)throw Error('A reposição ainda não cumpriu o prazo da espécie: um turno para Rinkaichuu ou dois dias completos para Kikaichuu e Shōkaichuu.');
   const max=Math.min(colony.maximum,reserve.max??colony.maximum);
   if(count+deployed+amount+colony.partners.reduce((sum,r)=>sum+r.amount,0)>max)throw Error('A reposição excederia a capacidade da espécie.');
   let remaining=amount;
   const now=Number(game.time?.worldTime??0),species=state.insectLosses[itemKey];
   species[reserve.id]=species[reserve.id].map(loss=>{
    if((loss.turns!==0&&!(loss.due<=now))||!remaining)return loss;
    const restored=Math.min(remaining,loss.amount);
    remaining-=restored;
    return {...loss,amount:loss.amount-restored};
   }).filter(loss=>loss.amount>0);
   if(colony.key==='res-basico-rinkaichuu'){
    state.rinkaRecovery??={};
    const key=periodKey(actor,'turn'),prior=state.rinkaRecovery[reserve.id];
    const recovered=prior?.turn===key?prior.amount:0;
    if(recovered+amount>Math.floor(colony.maximum/2))throw Error('Rinkaichuu repõe até metade da capacidade por turno.');
    state.rinkaRecovery[reserve.id]={turn:key,amount:recovered+amount};
   }
   next+=amount;
  }else throw Error('Operação de insetos inválida.');
  state.insectReceipts[requestId]=true;
  return {changes:{'system.special':actor.system.special.map(r=>r.id===reserve.id?{...r,value:next}:r)}};
 });
}

export async function recordKidaichuuPartnerLoss(actor,item,{partnerId,requestId}){
 if(item.system?.catalogKey!=='res-basico-kidaichuu'||!capabilityId(requestId))throw Error('Origem de Kidaichuu inválida.');
 return mutateRuntime(actor,state=>{
  const record=(state.kidaichuuPartners??[]).find(r=>r.itemId===item.id&&r.id===partnerId);
  if(!record)throw Error('Parceiros de Kidaichuu não encontrados.');
  if(record.ended)return;
  state.insectLosses??={};
  const species=state.insectLosses[item.id]??={};
  (species[record.resourceId]??=[]).push({amount:record.amount,due:Number(game.time?.worldTime??0)+2*86400});
  record.ended=true;
 });
}

// Livro Básico 4.1.b, pp. 158–159. The table confirms uninterrupted concentration and immobility.
export async function changeByakuganFocus(actor,item,{operation,requestId,books,rules}){
 if(item.system?.catalogKey!=='res-basico-byakugan'||!capabilityId(requestId))throw Error('Origem de Byakugan inválida.');
 return mutateRuntime(actor,state=>{
  state.byakuganFocusReceipts??={};
  if(state.byakuganFocusReceipts[requestId])return {duplicate:true};
  const clan=clanCapabilities(actor,{books,rules});
  const sourceItemId=itemId(item),scene=periodKey(actor,'scene');
  const track=restrictedFacts(actor.system)['skill.rastrear']??0;
  const now=Number(game.time?.worldTime??0),combat=game.combat;
  const turn=periodKey(actor,'turn');
  const focus=state.byakuganFocus;
  let changes;
  if(operation==='focus-end')state.byakuganFocus=null;
  else{
   if(!clan.byakugan||clan.eyes[0].itemId!==sourceItemId)throw Error('Ative o Byakugan desta origem.');
   if(operation==='focus-extended'||operation==='focus-progressive'){
    const progressive=operation==='focus-progressive';
    if(track<(progressive?9:5)||progressive&&!clan.tenketsu)throw Error(progressive?'Alcance progressivo exige Tenketsu Byakugan e Rastrear 9.':'Alcance estendido exige Rastrear 5.');
    state.byakuganFocus={sourceItemId,scene,turn,mode:progressive?'progressive':'extended',startedAt:now,combatId:combat?.started?combat.id:null,round:combat?.started?combat.round:null,ready:false};
   }else if(operation==='focus-confirm'){
    if(!clan.tenketsu||track<9||focus?.mode!=='progressive'||focus.scene!==scene||focus.sourceItemId!==sourceItemId||focus.ready)throw Error('Prepare o alcance progressivo antes de confirmar.');
    const elapsedRounds=focus.combatId&&focus.combatId===combat?.id&&combat.round-focus.round>=20;
    if(now-focus.startedAt<120&&!elapsedRounds)throw Error('O alcance progressivo exige 2 minutos ou 20 rodadas de concentração.');
    const cost=Math.ceil(track/2),chakra=actor.system.resources.chakra.value;
    if(!Number.isFinite(chakra)||chakra<cost)throw Error('Chakra insuficiente para o alcance progressivo.');
    changes={'system.resources.chakra.value':chakra-cost};
    focus.ready=true;
   }else throw Error('Operação de alcance inválida.');
  }
  state.byakuganFocusReceipts[requestId]=true;
  return {changes};
 });
}

// Livro Básico 4.1.b, pp. 144–145. Chakra signatures are described by the GM.
export async function changeShokaSearch(actor,item,{operation,amount,requestId,books,rules}){
 if(item.system?.catalogKey!=='res-basico-shokaichuu'||!capabilityId(requestId))throw Error('Origem de Shōkaichuu inválida.');
 return mutateRuntime(actor,state=>{
  state.shokaReceipts??={};
  if(state.shokaReceipts[requestId])return {duplicate:true};
  const colony=clanCapabilities(actor,{books,rules}).insects.find(i=>i.itemId===itemId(item));
  if(!colony?.bindingValid)throw Error('Vincule uma reserva independente para os Shōkaichuu.');
  const search=state.shokaSearch;
  let changes;
  if(operation==='shoka-start'){
   if(!colony.available||!Number.isInteger(amount)||amount<1||amount>colony.deployed)throw Error('Escolha grupos de Shōkaichuu já liberados.');
   if(search)throw Error('Conclua ou cancele a busca atual antes de começar outra.');
   state.shokaSearch={itemId:colony.itemId,resourceId:colony.resourceId,groups:amount,remaining:4,radius:20*amount};
  }else if(operation==='shoka-cancel'){
   if(search?.itemId!==colony.itemId||search.resourceId!==colony.resourceId)throw Error('Busca não encontrada nesta reserva.');
   state.shokaSearch=null;
  }else if(operation==='shoka-collect'){
   if(search?.itemId!==colony.itemId||search.resourceId!==colony.resourceId||search.remaining!==0)throw Error('A busca só termina no início do quinto turno.');
   const reserve=actor.system.special.find(r=>r.id===search.resourceId);
   const max=Math.min(colony.maximum,reserve.max??colony.maximum);
   if(!Number.isInteger(reserve.value)||reserve.value+search.groups>max||colony.deployed<search.groups)throw Error('Confira a capacidade e os grupos liberados antes de recolher.');
   state.insectDeployments[colony.itemId][reserve.id]-=search.groups;
   changes={'system.special':actor.system.special.map(r=>r.id===reserve.id?{...r,value:r.value+search.groups}:r)};
   state.shokaSearch=null;
  }else throw Error('Operação de busca inválida.');
  state.shokaReceipts[requestId]=true;
  return {changes};
 });
}

export function spendMangekyouVision(actor,state,amount){
 const vision=state.mangekyouVision;
 if(!vision||![1,2].includes(amount)||amount>vision.remaining)throw Error('Custo de visão inválido ou saldo insuficiente.');
 vision.remaining-=amount;
 vision.wear=Math.max(vision.wear,Math.min(3,Math.floor((10-vision.remaining)/3)));
 if(vision.remaining===0){
  vision.exhaustions++;
  vision.exhaustedAt=Number(game.time?.worldTime??0);
  state.active['res-basico-sharingan']={scene:'encerrado'};
  if(vision.exhaustions===1)vision.shockTurn=periodKey(actor,'turn');
 }
}

// Livro Básico 4.1.b, pp. 183–184. Record the vision cost of a technique the table resolved.
export async function changeMangekyouVision(actor,item,{operation,pair,amount,technique,requestId,books,rules}){
 if(item.system?.catalogKey!=='res-basico-mangekyou-sharingan'||!capabilityId(requestId))throw Error('Origem de Mangekyou inválida.');
 return mutateRuntime(actor,state=>{
  state.visionReceipts??={};
  if(state.visionReceipts[requestId])return {duplicate:true};
  const vision=state.mangekyouVision??={remaining:10,wear:0,exhaustions:0};
  const now=Number(game.time?.worldTime??0);
  if(operation==='vision-rest'){
   if(vision.exhaustions!==1||vision.remaining!==0||now-vision.exhaustedAt<86400)throw Error('O descanso exige a primeira exaustão e 24 horas sem Sharingan.');
   vision.remaining=5;
  }else{
   if(!clanCapabilities(actor,{books,rules}).mangekyou)throw Error('Mangekyou exige a cadeia do Sharingan ativa e válida.');
   if(operation==='vision-pair'){
    if(!Object.hasOwn(MANGEKYOU_PAIRS,pair))throw Error('Escolha um par de técnicas publicado.');
    if(vision.pair&&vision.pair!==pair)throw Error('O par de Mangekyou já foi escolhido.');
    vision.pair=pair;
   }else if(operation==='vision-spend'){
    if(!vision.pair||![...MANGEKYOU_PAIRS[vision.pair],'Susanoo'].includes(technique))throw Error('Registre apenas técnicas do par escolhido ou Susanoo dominado.');
    spendMangekyouVision(actor,state,amount);
   }else throw Error('Operação de visão inválida.');
  }
  state.visionReceipts[requestId]=true;
  return {vision:structuredClone(vision)};
 });
}

export async function changeDoujutsu(actor,item,{operation,requestId,books,rules={},canUse=()=>actor.isOwner,canActivate=()=>true,convertedChakra=0}={}) {
 const key=item.system?.catalogKey,id=itemId(item);
 if(![...DOUJUTSU_KEYS,HAKKEN_KEY].includes(key)||!capabilityId(requestId)||!['activate','deactivate'].includes(operation))throw Error('Operação de capacidade sensorial inválida.');
 return mutateRuntime(actor,state=>{
  if(!canUse())throw Error('Permissão revogada.');
  if(state.clanReceipts?.includes(requestId))return {duplicate:true};
  if(![...(actor.items??[])].some(i=>itemId(i)===id&&i.system?.catalogKey===key))throw Error('Origem removida.');
  const current=state.active[key];
  if(operation==='deactivate'){
   if(current?.sourceItemId===id){
    state.active[key]={scene:'encerrado'};
    if(key==='res-basico-byakugan')state.byakuganFocus=null;
   }
  }else{
   if(!canActivate())throw Error('A condição atual impede ativar a capacidade sensorial.');
   const view=clanCapabilities(actor,{books,rules});
   if(view.invalid)throw Error('Registro de capacidades inválido ou futuro; dados preservados.');
   // Revalidate with the same source and scene without writing a provisional activation.
   const probe={system:actor.system,items:actor.items,flags:{[ID]:{capabilities:flag(actor,'capabilities'),aptitudes:{mangekyouVision:state.mangekyouVision,active:{[key]:{sourceItemId:id,scene:periodKey(actor,'scene')}}}}}};
   const isActive=clan=>key===HAKKEN_KEY?clan.hakken?.active:clan.eyes.find(e=>e.key===key)?.active;
   if(!isActive(clanCapabilities(probe,{books,rules})))throw Error('Origem, livro, suspensão ou requisitos impedem esta ativação.');
   if(!isActive(view)){
    const payment=corpulenciaPayment(actor,key===HAKKEN_KEY?2:1,convertedChakra,{books,rules});
    state.active[key]={sourceItemId:id,scene:periodKey(actor,'scene')};
    state.clanReceipts=[...(state.clanReceipts??[]),requestId].slice(-80);
    return {changes:payment};
   }
  }
  state.clanReceipts=[...(state.clanReceipts??[]),requestId].slice(-80);return {};
 });
}
