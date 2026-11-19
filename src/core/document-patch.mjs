// Foundry merges object updates recursively. Omitting an old property does not
// remove it: use the v14 deletion operator (legacy marker for non-Foundry hosts).
const plain=value=>value!=null&&typeof value==='object'&&!Array.isArray(value);
export function replacementPatch(previous,next){
 if(!plain(previous)||!plain(next))return structuredClone(next);
 const patch=structuredClone(next);
 for(const key of Object.keys(previous)){
  if(!Object.hasOwn(next,key)){
   const Deletion=globalThis.foundry?.data?.operators?.ForcedDeletion;
   if(Deletion)patch[key]=new Deletion();else patch['-='+key]=null;
  }
  else if(plain(previous[key])&&plain(next[key]))patch[key]=replacementPatch(previous[key],next[key]);
 }
 return patch;
}
