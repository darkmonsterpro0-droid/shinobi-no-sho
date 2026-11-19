// Livro Básico 4.1.b p. 205. The two conditions replace one another; they never add.
export function accelerationProfile(records=[],{corpulencia=false}={}){
 const active=records.filter(record=>!record.disabled);
 const rank=active.some(record=>record.key==='superacelerado')?2:
  !corpulencia&&active.some(record=>record.key==='acelerado')?1:0;
 return {rank,initiative:rank*2,movementMultiplier:rank?2:1};
}
export const acceleratedOpportunityAllowed=(attackerRank,targetRank)=>targetRank<1||attackerRank>=targetRank;
const initiativeQueues=new Map();
export async function syncAccelerationInitiative(actor){
 const previous=initiativeQueues.get(actor.uuid)??Promise.resolve();
 const work=previous.catch(()=>{}).then(async()=>{
  const bonus=Number(actor.getRollData?.().sns?.accelerationBonus??0);
  for(const combat of globalThis.game?.combats??[]){
   const updates=[...combat.combatants].filter(entry=>entry.actor?.uuid===actor.uuid&&Number.isFinite(entry.initiative))
    .flatMap(entry=>{
     const old=Number(entry.getFlag('shinobi-no-sho','accelerationBonus')??0);
     return old===bonus?[]:[{_id:entry.id,initiative:entry.initiative+bonus-old,'flags.shinobi-no-sho.accelerationBonus':bonus}];
    });
   if(!updates.length)continue;
   const current=combat.combatant?.id;
   await combat.updateEmbeddedDocuments('Combatant',updates);
   const index=combat.turns.findIndex(entry=>entry.id===current);
   if(index>=0&&index!==combat.turn)await combat.update({turn:index},{snsAcceleration:true});
  }
 });
 initiativeQueues.set(actor.uuid,work);
 try{await work;}finally{if(initiativeQueues.get(actor.uuid)===work)initiativeQueues.delete(actor.uuid);}
}
