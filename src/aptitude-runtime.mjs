import {ID} from './config.mjs';
import {aptitudeOwned} from './aptitudes.mjs';
const locks=new Map();
const number=n=>Number.isFinite(Number(n))?Number(n):0;
const setting=k=>number(game.settings.get(ID,k));
export function periodKey(actor,period){
 if(period==='scene')return 'scene:'+setting('sceneEpoch');
 if(period==='day')return 'day:'+Math.floor(number(game.time?.worldTime)/86400)+':'+setting('dayEpoch');
 if(period==='round')return game.combat?.started?`${game.combat.id}:${game.combat.round}`:actor.getFlag(ID,'currentTurnKey')??'outside';
 return actor.getFlag(ID,'currentTurnKey')??'outside';
}
export function runtimeState(actor){return structuredClone(actor.getFlag(ID,'aptitudes')??{uses:{},active:{},cooldowns:{}});}
export function activeAptitudes(actor){const s=runtimeState(actor),turn=periodKey(actor,'turn'),scene=periodKey(actor,'scene'),round=periodKey(actor,'round');return Object.fromEntries(Object.entries(s.active??{}).filter(([,v])=>(!v.scene||v.scene===scene)&&(!v.turn||v.turn===turn)&&(!v.round||v.round===round)));}
export function claimUsage(state,actor,key,period,limit){state.uses??={};const stamp=periodKey(actor,period),old=state.uses[key],count=old?.stamp===stamp?old.count:0;if(count>=limit)throw Error(`Limite de uso atingido (${limit} por ${period==='scene'?'cena':period==='day'?'dia':period==='round'?'rodada':'turno'}).`);state.uses[key]={stamp,count:count+1};}
export async function mutateRuntime(actor,fn){
 if(!actor?.isOwner)throw Error('Você não pode alterar este personagem.');const key=actor.uuid??actor.id,prior=locks.get(key)??Promise.resolve();
 const job=prior.catch(()=>{}).then(async()=>{const state=runtimeState(actor);state.active??={};state.uses??={};state.cooldowns??={};const result=await fn(state)??{};await actor.update({[`flags.${ID}.aptitudes`]:state,...result.changes});return result;});
 locks.set(key,job);try{return await job;}finally{if(locks.get(key)===job)locks.delete(key);}
}
export function runtimeBonuses(actor,context={}){
 const active=activeAptitudes(actor),hard=active['trabalho-duro']?.choice,defensive=active['combate-defensivo'];
 return {attack:(hard==='attack'?1:0),defense:(hard==='defense'?1:0),dodge:defensive?3:0,attackPenalty:defensive&&context.stat==='cc'?-2:0,movement:hard==='movement'?5:0,damage:hard==='damage'?1:0,difficulty:hard==='difficulty'?1:0};
}
export async function advanceAptitudePhase(actor,key,phase){
 const result=await mutateRuntime(actor,state=>{
  state.phases??=[];if(state.phases.includes(key))return {duplicate:true};state.phases=[...state.phases,key].slice(-80);
  const messages=[];
  if(phase==='start')for(const[k,v]of Object.entries(state.active))if(v.turn&&v.turn!==periodKey(actor,'turn'))delete state.active[k];
  if(phase==='end'){
   for(const[k,n]of Object.entries(state.cooldowns))if(n<=1)delete state.cooldowns[k];else state.cooldowns[k]=n-1;
   for(const[k,v]of Object.entries(state.active))if(v.remaining&&--v.remaining<=0){delete state.active[k];if(k==='estilo-zui-quan')state.cooldowns[k]=2;messages.push(`${k}: duração encerrada.`);}
  }
  return {messages,zui:phase==='start'&&state.active['estilo-zui-quan']&&Number(aptitudeOwned([...(actor.items??[])],'estilo-zui-quan')?.system.level??1)===1};
 });
 if(result.zui){const roll=await new foundry.dice.Roll('1d8').evaluate();await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Zui Quan: ${roll.total<=2?'Não faz nada neste turno.':roll.total<=4?'Ataca o alvo mais próximo.':'Age normalmente.'} Não pode usar técnicas; pode sustentar Energizar.`});}
 return result;
}
