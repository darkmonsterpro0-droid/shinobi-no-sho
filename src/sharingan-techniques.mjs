import {ID,ICONS} from './config.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
import {clanCapabilities} from './clan-capabilities.mjs';
import {capabilityId} from './core/capabilities.mjs';
import {claimUsage,mutateRuntime,runtimeState} from './aptitude-runtime.mjs';
import {derivedSummary} from './automation.mjs';
import {escapeHTML} from './core/action-controls.mjs';

// Livro Básico 4.1.b, pp. 185–187. Narrative decisions are made at the table.
const WEEK=7*86400;
const worldTime=()=>Number(game.time?.worldTime??0);

export function sharinganCopies(actor){
 return (runtimeState(actor).sharinganCopies??[]).filter(copy=>!copy.forgotten&&(copy.memorized||copy.expiresAt>worldTime()));
}

export const HYPNOSIS_OPTIONS={
 information:{name:'Conseguir Informação',action:'1 rodada',note:'O alvo responde ao que sabe enquanto o transe durar.'},
 attitude:{name:'Alterar Atitude',action:'1 rodada',note:'Somente capanga. Confira a atitude escolhida e a duração contínua.'},
 knockout:{name:'Nocautear',action:'padrão',note:'Somente capanga. Em falha, fica Inconsciente.'},
 paralysis:{name:'Paralisar',action:'padrão',note:'Inteligência 10. Aplique a versão de Paralisar do Magen correspondente ao limite da campanha.'},
 control:{name:'Controlar Mente',action:'padrão',note:'Somente capanga. O controle dura enquanto a ilusão continuar.'},
 bijuu:{name:'Controlar Bijuu',action:'padrão',note:'Somente PdM com Mangekyou e autorização do mestre. Confira o vínculo com a única Bijuu.'},
 steal:{name:'Roubar Técnica',action:'completa',note:'Confira se a técnica mais poderosa do alvo é copiável. Pague também o custo do jutsu roubado.'},
 feign:{name:'Falsa Morte',action:'movimento',note:'Interrompe temporariamente o ataque para permitir a fuga pelo deslocamento normal. Uma vez por cena.'},
 overwrite:{name:'Sobrepor Genjutsu',action:'padrão',note:'Teste Inteligência e use as regras de Kai à distância com contato visual.'}
};

export async function changeSharinganCopy(actor,item,{operation,requestId,books,rules,name,reference,copyId,user}){
 if(item.system?.catalogKey!=='res-basico-nidan-sharingan'||!capabilityId(requestId))throw Error('Origem de Mímica Sharingan inválida.');
 return mutateRuntime(actor,async state=>{
  state.sharinganCopyReceipts??={};
  if(state.sharinganCopyReceipts[requestId])return {duplicate:true};
  if(!clanCapabilities(actor,{books,rules}).nidan)throw Error('Mímica exige Nidan com Sharingan ativo.');
  const active=sharinganCopies(actor);
  state.sharinganCopies??=[];
  if(operation==='mimic-copy'){
   if(!user.isGM)throw Error('O mestre confirma a técnica observada e seus requisitos de cópia.');
   if(typeof name!=='string'||!name.trim()||name.length>120||typeof reference!=='string'||!reference.trim()||reference.length>1000)throw Error('Informe a técnica e os parâmetros conferidos.');
   const limit=Math.min(5,Math.floor(Number(actor.system.attributes.int??0)/4));
   if(active.filter(copy=>!copy.memorized).length>=limit)throw Error('Limite de cópias temporárias atingido. Esqueça uma cópia antes de registrar outra.');
   state.sharinganCopies.push({id:requestId,name:name.trim(),reference:reference.trim(),expiresAt:worldTime()+WEEK});
  }else{
   if(!capabilityId(copyId)||!active.some(copy=>copy.id===copyId))throw Error('Cópia não disponível.');
   const selected=state.sharinganCopies.find(copy=>copy.id===copyId);
   if(operation==='mimic-purchase'){
    const items=[...(actor.items??[])];
    if(!items.some(i=>i.getFlag?.(ID,'sharinganCopyId')===copyId||i.flags?.[ID]?.sharinganCopyId===copyId)){
     const data={
      type:'aptitude',name:selected.name,img:ICONS.aptitude,flags:{[ID]:{sharinganCopyId:copyId,mimicSourceItemId:item.id}},
      system:{level:1,acquisition:'Comprada',description:selected.reference,source:{book:'basico',page:'185'}}
     };
     const {validatePurchase}=await import('./item-validation.mjs');
     const errors=validatePurchase(actor,data,{books,rules,isGM:user.isGM});
     if(errors.length)throw Error(errors.join(' '));
     await actor.createEmbeddedDocuments('Item',[data]);
    }
    selected.forgotten=true;
   }else if(operation==='mimic-memorize'){
    for(const copy of state.sharinganCopies)if(copy.memorized&&copy.id!==copyId)copy.forgotten=true;
    selected.memorized=true;
   }else if(operation==='mimic-forget')selected.forgotten=true;
   else throw Error('Operação de Mímica inválida.');
  }
  state.sharinganCopyReceipts[requestId]=true;
  return {};
 });
}

export async function declareHypnosis(actor,item,{requestId,books,rules,mode,target,user}){
 if(item.system?.catalogKey!=='res-basico-sandan-sharingan'||!capabilityId(requestId)||!Object.hasOwn(HYPNOSIS_OPTIONS,mode))throw Error('Hipnose Sharingan inválida.');
 if(typeof target!=='string'||!target.trim()||target.length>120)throw Error('Informe o alvo conferido pela mesa.');
 const option=HYPNOSIS_OPTIONS[mode];
 const result=await mutateRuntime(actor,state=>{
  state.hypnosisReceipts??={};
  const previous=state.hypnosisReceipts[requestId];
  if(previous)return previous;
  const clan=clanCapabilities(actor,{books,rules});
  const items=[...(actor.items??[])];
  if(!clan.sandan||!aptitudeOwned(items,'fascinar')||!aptitudeOwned(items,'ilusao-profunda'))throw Error('Hipnose exige Sandan ativo, Fascinar e Ilusão Profunda.');
  if(mode==='bijuu'&&(!user.isGM||!clan.mangekyou))throw Error('Controlar Bijuu exige Mangekyou ativo e conferência do mestre para um PdM.');
  const conditions=derivedSummary(actor).state;
  if(conditions.noActions||mode==='feign'&&conditions.noMovementAction)throw Error('A condição atual impede essa ação.');
  const intelligence=Number(actor.system.attributes.int??0);
  if(mode==='paralysis'&&intelligence<10)throw Error('Paralisar exige Inteligência 10.');
  const cost=mode==='paralysis'?Math.floor(Number(actor.system.campaign?.level??4)/2):5;
  const chakra=actor.system.resources.chakra.value;
  if(!Number.isFinite(chakra)||chakra<cost)throw Error('Chakra insuficiente.');
  if(mode==='feign')claimUsage(state,actor,'sharingan-feign-death','scene',1);
  const record={name:option.name,action:option.action,target:target.trim(),cost,difficulty:8+intelligence,note:option.note,mode};
  state.hypnosisReceipts[requestId]=record;
  return {...record,changes:{'system.resources.chakra.value':chakra-cost}};
 });
 if(!(game.messages.contents??[]).some(message=>message.getFlag(ID,'hypnosisReceipt')===requestId)){
  const resistance=['feign','overwrite'].includes(result.mode)?'':`<p>Inteligência Dif ${result.difficulty}. Confirme o contato visual e a resistência.</p>`;
  await ChatMessage.create({
   speaker:ChatMessage.getSpeaker({actor}),
   content:`<p><strong>Hipnose Sharingan · ${escapeHTML(result.name)}</strong> em ${escapeHTML(result.target)}.</p><p>Ação ${result.action} · ${result.cost} chakra · até 9 m.</p>${resistance}<p>${escapeHTML(result.note)}</p>`,
   flags:{[ID]:{hypnosisReceipt:requestId}}
  });
 }
 return result;
}
