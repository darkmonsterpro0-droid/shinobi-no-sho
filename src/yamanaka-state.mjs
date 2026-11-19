import {worldActorDocuments} from './core/world-actors.mjs';
import {canControl} from './core/execution.mjs';
import {POWER_FAMILIES} from './power-data.mjs';
const powers=actor=>(actor?.system?.powerState?.active??[]).filter(p=>p.active!==false&&!p.ending);
export function mindBinding(body){
 for(const link of powers(body).filter(p=>p.mentalControlLink)){
  const source=worldActorDocuments().find(a=>a.uuid===link.sourceUuid),root=powers(source).find(p=>p.id===link.linkedTo&&p.mentalControl);
  if(root)return {source,root,link};
 }
 return null;
}
export function canDirectMind(body,user){const binding=mindBinding(body);return !!binding&&canControl(binding.source,user);}
export function controlledBodies(source,rootId){
 return worldActorDocuments().filter(body=>powers(body).some(p=>p.mentalControlLink&&p.sourceUuid===source.uuid&&p.linkedTo===rootId));
}
export function basicMindDefense(body,choice){
 const binding=mindBinding(body);if(binding?.root.mentalControl.mode!=='disorder')return true;
 return ['esquiva','antecipar','bloqueio','none','manual'].includes(choice.kind)&&!choice.evade&&!choice.risk&&!choice.perceptive;
}
export function mindDamageDivisor(body){
 const binding=mindBinding(body);
 if(binding?.root.mentalControl.mode==='multiple')return binding.link.mentalControlLink.halfDamage?2:1;
 return binding?.root.mentalControl.mode==='disorder'&&controlledBodies(binding.source,binding.root.id).length>=2?2:1;
}
export function mindCommonItems(body){
 const binding=mindBinding(body),items=[...(body?.items??[])];if(!binding||binding.root.mentalControl.mode==='disorder')return items;
 return items.flatMap(item=>{
  if(!['aptitude','power'].includes(item.type))return [item];
  if(['corpse','inanimate'].includes(binding.link.mentalControlLink.bodyKind))return [];
  const s=item.system;
  if(s.capabilityData?.definitionId||s.catalogKey?.startsWith('res-')||item.type==='power'&&POWER_FAMILIES[s.powerData?.family]?.origins)return [];
  const matches=[...binding.source.items].filter(other=>other.type===item.type&&(item.type==='power'?
   other.system.powerData?.family===s.powerData?.family:other.system.catalogKey===s.catalogKey&&other.system.catalogBook===s.catalogBook&&other.system.selection===s.selection));
  if(!matches.length)return [];
  const level=Math.min(Number(s.level??1),Math.max(...matches.map(i=>Number(i.system.level??1))));
  const choices=item.type==='power'?(s.powerData?.choices??[]).flatMap(choice=>{
   const shared=matches.flatMap(i=>i.system.powerData?.choices??[]).filter(c=>c.effect===choice.effect);
   if(!shared.length)return [];
   return [{...choice,tier:Math.min(Number(choice.tier),Math.max(...shared.map(c=>Number(c.tier))))}];
  }):null;
  return [{...(item.toObject?.()??item),id:item.id,name:item.name,type:item.type,system:{...s,level,...(choices?{powerData:{...s.powerData,choices}}:{})}}];
 });
}
export function validMindExecution(body,control){
 const binding=mindBinding(body);
 return !!binding&&control?.bodyUuid===body.uuid&&control.sourceUuid===binding.source.uuid&&control.rootId===binding.root.id;
}
export function mindControlButtons(actor,root,button,escape,kind='attack',include=()=>true){
 if(!root.mentalControl||root.sourceUuid!==actor.uuid)return '';
 if(root.mentalControl.pending)return '';
 if(['ability','test','sensor','sensorEnd'].includes(kind)&&root.mentalControl.mode==='disorder')return '';
 const label={attack:'Atacar com ',move:'Mover ',ready:'Armas de ',ability:'Técnicas de ',test:'Teste de '},op={attack:'power-mind-attack',move:'power-mind-move',ready:'power-mind-ready',ability:'power-mind-ability',test:'power-mind-test'};
 return controlledBodies(actor,root.id).filter(include).map(body=>{
  const attrs=`data-id="${escape(root.id)}" data-body="${escape(body.uuid)}"`;
  if(['sensor','sensorEnd'].includes(kind)){
   if(![...actor.items].some(i=>i.type==='power'&&i.system.powerData?.family==='shindenshin'&&Number(i.system.level)>=3))return '';
   const active=(body.system.powerState?.active??[]).some(p=>p.active!==false&&p.borrowedMindSensor?.sourceUuid===actor.uuid&&p.borrowedMindSensor.rootId===root.id);
   if(kind==='sensorEnd'&&!active)return '';
   const operation=kind==='sensorEnd'?'end':active?'maintain':'activate';
   return button(({end:'Encerrar',maintain:'Manter',activate:'Ativar'})[operation]+' Sensor de Mentes · '+body.name,'power-mind-sensor',attrs+` data-operation="${operation}"`);
  }
  return button(label[kind]+body.name+(root.mentalControl.mode==='disorder'?' · fim do turno':''),op[kind],attrs);
 }).join('');
}
