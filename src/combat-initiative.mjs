import {ID} from './config.mjs';

export const minimumDelayedInitiative=level=>-10-level;
const delaysFor=combat=>Object.fromEntries(Object.entries(combat.getFlag(ID,'initiativeDelay')??{})
 .filter(([,entry])=>entry.round===combat.round));

export function renderDelayedInitiative(tracker,root){
 const combat=tracker.viewed;
 if(!combat||!root?.querySelectorAll)return;
 const delays=delaysFor(combat);
 for(const row of root.querySelectorAll('[data-combatant-id]')){
  const entry=delays[row.dataset.combatantId],label=row.querySelector('.token-initiative span');
  if(!entry||!label)continue;
  const original=combat.combatants.get(row.dataset.combatantId)?.initiative;
  label.textContent=String(entry.value);
  label.title=entry.waiting?'Aguardando · iniciativa original '+original:'Iniciativa original '+original;
 }
}

export function initiativeOrder(a,b,delays,nativeOrder){
 const left=delays[a.id],right=delays[b.id];
 if(!left&&!right)return nativeOrder(a,b);
 const value=(entry,combatant)=>entry?.value??combatant.initiative??-Infinity;
 const difference=value(right,b)-value(left,a);
 if(difference)return difference;
 if(!!left!==!!right)return left?1:-1;
 // In a tie between delays, the higher original initiative/Agility acts later.
 return a.initiative-b.initiative||
  (Number(a.actor?.system.attributes?.agi??0)-Number(b.actor?.system.attributes?.agi??0))||nativeOrder(a,b);
}

export function createCombatClass(Base){
 const nativeOrder=Base.prototype._sortCombatants;
 return class ShinobiCombat extends Base{
  async rollInitiative(ids,options={}){
   const result=await super.rollInitiative(ids,options);
   const updates=(Array.isArray(ids)?ids:[ids]).flatMap(id=>{
    const entry=this.combatants.get(id);
    return entry&&Number.isFinite(entry.initiative)?[{_id:id,'flags.shinobi-no-sho.accelerationBonus':Number(entry.actor?.getRollData().sns?.accelerationBonus??0)}]:[];
   });
   if(updates.length)await this.updateEmbeddedDocuments('Combatant',updates);
   return result;
  }
  _sortCombatants(a,b){
   return initiativeOrder(a,b,delaysFor(a.parent),nativeOrder);
  }
  async _preUpdate(changed,options,userId){
   if(changed.round>this.round&&Object.keys(delaysFor(this)).length&&changed.turn!=null){
    const order=[...this.combatants].sort(nativeOrder);
    if(options.direction===1){
     changed.turn=this.settings.skipDefeated?Math.max(0,order.findIndex(c=>!c.isDefeated)):0;
     if(options.worldTime)options.worldTime.delta=this.getTimeDelta(this.round,this.turn,changed.round,changed.turn);
    }
   }
   return super._preUpdate(changed,options,userId);
  }
  _onUpdate(changed,options,userId){
   if(changed.round!=null||changed.flags?.[ID]?.initiativeDelay||options.snsDelay){
    // Keep the old current state intact so Foundry can report the actual prior combatant.
    this.turns=[...this.combatants].sort(this._sortCombatants);
    this.turns.forEach((c,i)=>c.turnNumber=i);
   }
   return super._onUpdate(changed,options,userId);
  }
 };
}

export function delayBounds(combat,combatant){
 if(!combat?.started||!combatant||combat.combatant?.id!==combatant.id)return null;
 const initiative=combatant.initiative,level=combatant.actor?.getRollData().sns?.initiative;
 if(!Number.isInteger(initiative)||!Number.isInteger(level)||
    delaysFor(combat)[combatant.id])return null;
 const min=minimumDelayedInitiative(level),max=initiative-1;
 return min<=max?{min,max}:null;
}

export function waitingCombatant(combat,actor){
 if(!combat?.started||!actor)return null;
 const delays=delaysFor(combat);
 return combat.turns.find((entry,index)=>index>combat.turn&&entry.actor?.uuid===actor.uuid&&delays[entry.id]?.waiting)??null;
}

export async function resumeInitiative(combat,combatant){
 if(waitingCombatant(combat,combatant?.actor)?.id!==combatant?.id||!combatant)throw Error('O personagem não está aguardando.');
 const delays=delaysFor(combat),current=combat.combatant;
 const previous=delays[combatant.id];
 const value=Math.min(delays[current.id]?.value??current.initiative,combatant.initiative-1);
 if(value<previous.value)throw Error('O limite de atraso já foi alcançado.');
 const entries={...delays,[combatant.id]:{...previous,value,waiting:false}};
 const order=[...combat.combatants].sort((a,b)=>initiativeOrder(a,b,entries,combat._sortCombatants));
 if(order[combat.turn]?.id!==current.id||order.findIndex(c=>c.id===combatant.id)<=combat.turn)
  throw Error('A ordem das iniciativas empatadas impede retomar neste ponto.');
 await combat.setFlag(ID,'initiativeDelay',entries);
}

export async function delayInitiative(combat,combatant,value,{waiting=false}={}){
 const bounds=delayBounds(combat,combatant);
 if(!bounds||!Number.isInteger(value)||value<bounds.min||value>bounds.max)
  throw Error('Atrasar exige o turno atual e uma iniciativa menor dentro do limite da ficha.');
 const entries={...delaysFor(combat),[combatant.id]:{value,round:combat.round,waiting}};
 const order=[...combat.combatants].sort((a,b)=>initiativeOrder(a,b,entries,combat._sortCombatants));
 let turn=combat.turn;
 if(combat.settings.skipDefeated)while(turn<order.length-1&&order[turn]?.isDefeated)turn++;
 await combat.update({turn,[`flags.${ID}.initiativeDelay`]:entries},
  {snsDelay:combatant.id,direction:1});
}
