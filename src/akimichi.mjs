// Livro Básico 4.1.b, pp. 153–155. Diet and treatment remain table declarations.
import {clanCapabilities} from './clan-capabilities.mjs';
import {ID} from './config.mjs';
import {mutateRuntime,periodKey,runtimeState} from './aptitude-runtime.mjs';
import {derivedSummary,saveCondition,conditionRecords,statPrecision} from './automation.mjs';
import {applyPillIntoxication} from './inventory-rules.mjs';
const now=()=>Number(globalThis.game?.time?.worldTime??0);
export async function registerColoredPills(actor,{books,rules,requestId}){
 if(!actor.isOwner||!requestId||!clanCapabilities(actor,{books,rules}).corpulenciaId)throw Error('Registre as pílulas pela ficha de um Akimichi disponível.');
 const result=await mutateRuntime(actor,async()=>{
 const old=[...actor.items].find(i=>i.getFlag?.('shinobi-no-sho','coloredPillRegistration')===requestId);
 if(old)return {itemId:old.id};
 const items=await actor.createEmbeddedDocuments('Item',[{name:'Sanshoku no Gan’yaku · três pílulas coloridas',type:'equipment',
  flags:{'shinobi-no-sho':{coloredPillRegistration:requestId}},system:{catalogKey:'akimichi-pills',catalogBook:'basico',quantity:1,
   source:{book:'basico',page:'155'},inventoryData:{kind:'utility',coloredPills:{1:1,2:1,3:1}}}}]);
 return {itemId:items[0].id};
 });
 return [...actor.items].find(item=>item.id===result.itemId);
}
async function consumeColoredPill(actor,id){
 const pending=runtimeState(actor).akimichi?.consumptions?.[id];if(!pending||pending.settled)return;
 const item=[...actor.items].find(i=>i.id===pending.itemId);
 if(!item)throw Error('O kit da pílula foi removido. Restaure-o para concluir o consumo sem nova cobrança.');
 if(item.getFlag?.('shinobi-no-sho','coloredPillConsumption')?.[id])return;
 const doses=structuredClone(item.system.inventoryData?.coloredPills??{});
 if(!(doses[pending.level]>=1))throw Error('A pílula ficou pendente: restaure o estoque para concluir sem nova cobrança.');
 doses[pending.level]--;
 await item.update({'system.inventoryData.coloredPills':doses,
  'system.quantity':Object.values(doses).some(n=>n>0)?1:0,
  [`flags.shinobi-no-sho.coloredPillConsumption.${id}`]:true});
}
export async function useCalories(actor,command,{books,rules,requestId,user}){
 if(!requestId)throw Error('Solicitação sem identificador.');
 const operation=command.operation;
 const result=await mutateRuntime(actor,async state=>{
  const calories=state.akimichi??={receipts:{}};
  // Reconcile paid stock before accepting a subsequent dose. The same actor
  // queue protects the Item read/update when requests arrive together.
  for(const [id,consumption] of Object.entries(calories.consumptions??{})){
   await consumeColoredPill(actor,id);consumption.settled=true;
  }
  calories.receipts??={};
  if(calories.receipts[requestId])return {duplicate:true};
  if(operation==='calorie-risk'){
   if(!user?.isGM)throw Error('O mestre confirma o tratamento ou o resultado do teste de sobrevivência.');
   const risk=calories.risk;
   if(!risk||risk.resolved)throw Error('Não há risco de morte pendente.');
   if(!['treated','passed','failed'].includes(command.outcome))throw Error('Informe tratamento ou resultado do segundo teste de Vigor.');
   if(command.outcome!=='treated'&&now()<risk.due)throw Error('O segundo teste resolve o risco após 24 horas.');
   risk.resolved=command.outcome;risk.resolvedAt=now();
   if(command.outcome==='failed')calories.pendingDeath=risk.id;
  }else if(operation==='calorie-recover'){
   if(!user?.isGM||command.diet!==true)throw Error('O mestre precisa confirmar uma semana inteira de dieta hipercalórica.');
   if(!calories.recovering||now()<calories.recoveryStarted+7*86400)throw Error('A semana de recuperação ainda não terminou no relógio do mundo.');
   calories.recovering=false;
  }else if(operation==='calorie-end'){
   if(calories.active?.pill)throw Error('A duração da pílula é de três turnos.');
   calories.active=null;
  }else if(operation==='calorie-maintain'){
   if(!calories.active||calories.active.pill)throw Error('Não há Controle de Caloria sustentado.');
   if(derivedSummary(actor).state.noActions)throw Error('A condição atual impede sustentar a técnica.');
   calories.active.maintainedTurn=periodKey(actor,'turn');
  }else if(operation==='calorie-use'){
   const clan=clanCapabilities(actor,{books,rules}),level=Number(command.level),pill=command.pill===true;
   if(!clan.corpulenciaId||!clan.resiliencia)throw Error('Controle de Caloria exige Corpulência e Resiliência disponíveis.');
   if(derivedSummary(actor).state.noActions)throw Error('A condição atual impede usar Controle de Caloria.');
   if(![1,2,3].includes(level))throw Error('Escolha Verde, Amarelo ou Vermelho.');
   if(!pill&&!(Number(actor.system.attributes?.vig)>=14))throw Error('Sem pílula, Controle de Caloria exige Vigor 14.');
   const kit=pill?[...actor.items].find(i=>i.type==='equipment'&&i.system.catalogKey==='akimichi-pills'&&
    Number(i.system.quantity)>0&&Number(i.system.inventoryData?.coloredPills?.[level])>=1):null;
   if(pill&&!kit)throw Error('Registre um kit no inventário com a pílula da cor escolhida disponível.');
   const scene=periodKey(actor,'scene');
   if(calories.scene===scene&&level<=calories.highest)throw Error('Cada nível só pode ser usado uma vez por cena, em ordem crescente.');
   const cost=1+2*level,vitality=Number(actor.system.resources?.vitality?.value),chakra=Number(actor.system.resources?.chakra?.value);
   if(!Number.isFinite(vitality)||vitality<cost)throw Error('Vitalidade insuficiente para Controle de Caloria.');
   const maximum=derivedSummary(actor).chakra;
   if(!Number.isFinite(chakra)||!Number.isFinite(maximum))throw Error('Confira os recursos máximos da ficha.');
   calories.scene=scene;calories.highest=level;
   calories.active={id:requestId,scene,level,pill,remaining:pill?3:null,expiresAt:pill?now()+18:null,createdTurn:periodKey(actor,'turn'),
    corpulenciaId:clan.corpulenciaId,resilienciaId:clan.resiliencia.itemId};
   if(level===3){calories.recovering=true;calories.recoveryStarted=now();}
   calories.receipts[requestId]=true;
   if(kit){calories.consumptions??={};calories.consumptions[requestId]={itemId:kit.id,level};}
   if(pill&&level===3)calories.risk={id:requestId,due:now()+86400,resolved:null};
   const inventory=structuredClone(actor.system.inventoryState??{});
   if(pill){inventory.pills??={count:0};inventory.pills.colored=true;
    if(inventory.pills.count>0)applyPillIntoxication(inventory,now());}
   return {level,pill,changes:{'system.resources.vitality.value':vitality-cost,
    'system.resources.chakra.value':Math.min(maximum,chakra+2*cost),...(pill?{'system.inventoryState':inventory}:{})}};
  }else throw Error('Operação de Controle de Caloria desconhecida.');
  calories.receipts[requestId]=true;
  return {};
 });
 await mutateRuntime(actor,async state=>{
  await consumeColoredPill(actor,requestId);
  const consumption=state.akimichi?.consumptions?.[requestId];if(consumption)consumption.settled=true;
  return {};
 });
 const death=runtimeState(actor).akimichi?.pendingDeath;
 if(death){
  if(!conditionRecords(actor).some(c=>c.akimichiDeath===death))await saveCondition(actor,{key:'morto',akimichiDeath:death,source:'Pílula Vermelha · risco após 24 horas · Básico p. 155'});
  await mutateRuntime(actor,s=>{if(s.akimichi.pendingDeath===death)delete s.akimichi.pendingDeath;});
 }
 if(result.level){
  // A later pill temporarily negates only the fatigue caused by an earlier colored pill.
  if(result.pill)for(const condition of conditionRecords(actor).filter(c=>c.akimichiPill&&['fatigado','exausto'].includes(c.key)))
   await saveCondition(actor,condition,{remove:true});
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content:`<p>Controle de Caloria · ${['','Verde','Amarelo','Vermelho'][result.level]}: Força +${2*result.level}${result.level===3?' · Modo Chou':''}. ${result.pill?'Pílula: três turnos; confira o estoque e eventual intoxicação com Pílulas do Soldado.':'Sustentar com ação parcial.'}</p>`});
 }
 return result;
}
const phaseQueues=new Map();
export async function advanceCalories(actor,key,phase,context={}){
 const previous=phaseQueues.get(actor.uuid)??Promise.resolve();
 const work=previous.catch(()=>{}).then(()=>processCaloriePhase(actor,key,phase,context));
 phaseQueues.set(actor.uuid,work);
 try{return await work;}finally{if(phaseQueues.get(actor.uuid)===work)phaseQueues.delete(actor.uuid);}
}
async function processCaloriePhase(actor,key,phase,{books,rules}){
 const result=await mutateRuntime(actor,state=>{
  const calories=state.akimichi;
  if(!calories)return {};
  calories.phases??=[];
  if(calories.phases.includes(key))return {};
  calories.phases=[...calories.phases,key].slice(-80);
  const active=calories.active;
  if(!active)return {};
  const turn=periodKey(actor,'turn');
  if(active.pill&&(phase==='end'&&--active.remaining<=0||phase==='time'&&active.expiresAt!=null&&now()>=active.expiresAt)){
   calories.pendingPenalty={...active};calories.active=null;
  }else if(!active.pill&&phase==='end'&&
    (derivedSummary(actor).state.noActions||active.createdTurn!==turn&&active.maintainedTurn!==turn))calories.active=null;
  return {};
 });
 const penalty=runtimeState(actor).akimichi?.pendingPenalty;
 if(!penalty)return result;
 const receipt='akimichi-pill:'+penalty.id;
 let condition=penalty.level===1?'fatigado':penalty.level===2?'exausto':null;
 let remaining=penalty.level===1?1:2;
 if(penalty.level===3){
  // The second survival check has no printed difficulty: never invent an automatic death rule.
  const prior=runtimeState(actor).akimichi.penaltyRolls?.[receipt];
  let conscious=Number(actor.system.attributes?.vig)>=16;
  if(!conscious){
   if(prior)conscious=prior.success;
   else{
    const check=statPrecision(actor,'vig',{kind:'resistance',bodyResistance:true,manualContext:true});
    const roll=await new foundry.dice.Roll(`2d8 + (${check.precision})`).evaluate(),natural=roll.total-check.precision;
    conscious=natural>=15||natural>3&&roll.total>=23;
    await mutateRuntime(actor,s=>{s.akimichi.penaltyRolls??={};s.akimichi.penaltyRolls[receipt]={success:conscious};});
    await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:'Pílula Vermelha · Vigor, dificuldade 23.'});
   }
  }
  condition=conscious?'exausto':'inconsciente';remaining=null;
 }
 if(!conditionRecords(actor).some(c=>c.akimichiReceipt===receipt))await saveCondition(actor,{key:condition,
  akimichiPill:true,akimichiReceipt:receipt,remaining,timing:'Fim do turno',
  expiresAt:now()+(penalty.level===3?86400:remaining*6),source:'Controle de Caloria · pílula colorida'});
 if(penalty.level===3&&![...(game.messages?.contents??game.messages?.values?.()??[])].some(m=>m.getFlag?.(ID,'akimichiPenalty')===actor.uuid+':'+receipt))
  await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),flags:{[ID]:{akimichiPenalty:actor.uuid+':'+receipt}},content:'<p>Pílula Vermelha: penalidade por 24 horas. Risco de morte após 24 horas: a mesa deve acompanhar tratamento ou o segundo teste de Vigor; o livro não informa a dificuldade desse segundo teste.</p>'});
 await mutateRuntime(actor,s=>{if(s.akimichi.pendingPenalty?.id===penalty.id)delete s.akimichi.pendingPenalty;});
}
