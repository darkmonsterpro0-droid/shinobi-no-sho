import {createExtraResources} from './core/extra-resources.mjs';

// Keep the existing path. Old records need no migration and are normalized on read.
export const extraResources=createExtraResources({
 read:actor=>actor?.system?.special??[],
 write:(actor,records)=>actor.update({'system.special':records}),
 canEdit:actor=>!!actor?.isOwner,
 randomId:()=>foundry.utils.randomID()
});
export function resourceEditorData(values){
 const result={...values,resourceData:{...(values.resourceData??{})}};
 for(const [key,value]of Object.entries(values))if(key.startsWith('resourceData.')){const field=key.slice(13);if(['unit','uses','benefits','showOnSheet'].includes(field))result.resourceData[field]=value;delete result[key];}
 return result;
}
export async function changeExtraResource(actor,key,value){
 const match=/^extraResource\.([a-zA-Z0-9_-]{1,100})\.value$/.exec(key);
 if(!match)throw Error('Campo de recurso inválido.');return extraResources.setValue(actor,match[1],value);
}
