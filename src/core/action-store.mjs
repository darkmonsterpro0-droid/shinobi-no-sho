// Storage is injected: no system IDs, rule catalogues or resource formulas here.
export const validActionId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id)&&!['__proto__','prototype','constructor'].includes(id);
export function createActionStore(namespace,{flag='savedActions',version=1}={}){
 const list=actor=>Object.values(actor?.flags?.[namespace]?.[flag]??actor?.getFlag?.(namespace,flag)??{}).filter(x=>x&&validActionId(x.id)&&x.schemaVersion===version);
 const check=actor=>{if(!actor?.isOwner)throw Error('Você não pode configurar este personagem.');};
 return {
  list,
  get(actor,id){if(!validActionId(id))throw Error('Identificador inválido.');const record=list(actor).find(x=>x.id===id);if(!record)throw Error('Ação salva não encontrada.');return structuredClone(record);},
  async put(actor,record){check(actor);if(!validActionId(record.id)||record.schemaVersion!==version)throw Error('Configuração de ação inválida.');await actor.update({[`flags.${namespace}.${flag}.${record.id}`]:structuredClone(record)});return record;},
  async remove(actor,id){check(actor);this.get(actor,id);await actor.update({[`flags.${namespace}.${flag}.-=${id}`]:null});},
  async favorite(actor,id){check(actor);const record=this.get(actor,id);await actor.update({[`flags.${namespace}.${flag}.${id}.favorite`]:!record.favorite});},
  async duplicate(actor,id,newId){check(actor);const record=this.get(actor,id);return this.put(actor,{...record,id:newId,name:(record.name+' — cópia').slice(0,100)});}
 };
}
