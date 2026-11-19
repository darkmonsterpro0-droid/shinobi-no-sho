// Model the object expansion, recursive merge and deletion used by Foundry
// Document.update. Arrays replace; omitted object properties survive.
const plain=v=>v!=null&&typeof v==='object'&&!Array.isArray(v);
const safe=key=>!['__proto__','prototype','constructor'].includes(key);
function assign(target,path,value){
 const parts=path.split('.');if(!parts.every(safe))throw Error('Unsafe test path');
 let cursor=target;
 for(const key of parts.slice(0,-1))cursor=cursor[key]??={};
 cursor[parts.at(-1)]=value;
}
function expand(value){
 if(Array.isArray(value))return value.map(expand);
 if(!plain(value))return value;
 const result={};for(const [key,v]of Object.entries(value))assign(result,key,expand(v));return result;
}
function merge(target,patch){
 for(const [key,value]of Object.entries(patch)){
  if(key.startsWith('-=')){delete target[key.slice(2)];continue;}
  if(!safe(key))throw Error('Unsafe test key');
  if(plain(value)){
   if(!plain(target[key]))target[key]={};
   merge(target[key],value);
  }else target[key]=structuredClone(value);
 }
}
export function updateDocument(target,patch){merge(target,expand(patch));}
