// Shared entry point for sheets, HUDs and macros. An adapter supplies rules/use.
export function createActionAccess({resolveActor,list,use}){
 const pending=new Map();
 return {
  async list(actorUuid){const actor=await resolveActor(actorUuid);if(!actor?.isOwner)throw Error('Você não controla este personagem.');return structuredClone(list(actor));},
  async use(actorUuid,id,options={}){
   const key=JSON.stringify([actorUuid,id]);if(pending.has(key))return pending.get(key);
   const task=(async()=>{const actor=await resolveActor(actorUuid);if(!actor?.isOwner)throw Error('Você não controla este personagem.');if(!list(actor).some(x=>x.id===id))throw Error('Ação salva não encontrada.');return use(actor,id,options);})();
   pending.set(key,task);try{return await task;}finally{pending.delete(key);}
  }
 };
}
