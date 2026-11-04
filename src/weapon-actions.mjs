import {sizeProfile} from './physical-rules.mjs';
import {weaponPoisonCoating} from './inventory-rules.mjs';
import {maneuverPlan} from './maneuvers.mjs';
import {runtimeBonuses,periodKey} from './aptitude-runtime.mjs';
import {WEAPONS,weaponAttack} from './weapons.mjs';
import {houseRules,statPrecision} from './automation.mjs';
import {ID} from './config.mjs';
export const needsReload=w=>w.category==='firearm'||['light-crossbow','heavy-crossbow','hidden-shooter'].includes(w.key);
export const weaponDocument=(actor,id)=>id==='unarmed'?{id:'unarmed',name:'Ataque desarmado',system:{catalogKey:'unarmed',catalogBook:'basico'},update:async()=>{}}:actor?.items?.get?.(id)??[...(actor?.items??[])].find(i=>i.id===id);
export function prepareWeaponAction(actor,itemId,options={}){
 if(!actor?.isOwner)throw Error('Você não pode usar esta ficha.');
  const item=weaponDocument(actor,itemId),w=WEAPONS.find(w=>w.key===item?.system.catalogKey&&w.book===item?.system.catalogBook);if(!w)throw Error('Arma não encontrada.');
  const opts={...options};
  const items=[...actor.items],rules=houseRules();
  opts.itemId=item.id;opts.now=Number(game.time?.worldTime??0);opts.scene=periodKey(actor,'scene');
  const clone=actor.getFlag?.(ID,'clone'),attackItems=clone?.sourceItems??items;const runtime=runtimeBonuses(actor);let plan=weaponAttack(w,actor.system,attackItems,rules,opts);plan.base+=runtime.damage;plan.bonus+=runtime.attack;plan=maneuverPlan(opts.maneuver??"golpear",plan,w,actor.system,items,rules,opts);const check=statPrecision(actor,plan.stat,{kind:'attack',manualContext:true});if(!check.allowed)throw Error(check.reasons.join(' '));
  if(opts.sizeSweep){if(sizeProfile(actor.system).index<7||opts.maneuver!=='golpear'||plan.ranged)throw Error('O ataque amplo por tamanho exige Imenso ou maior, Golpear e alcance corporal.');plan.sizeSweep=true;}
  plan.targetCapanga=opts.targetKind==='capanga';plan.penalty+=check.penalty-(check.uncappedPenalty??0);plan.bonus+=check.bonus;
  if(item.system.destroyed)throw Error('Esta arma foi destruída.');
  if(plan.ranged&&needsReload(w)&&!item.system.loaded)throw Error('Recarregue antes de disparar.');
  if(plan.ranged&&item.system.damaged)plan.penalty-=1;
  plan.precision=plan.purchased+plan.bonus+Math.max(-3,plan.penalty)+(check.uncappedPenalty??0);
  const coating=weaponPoisonCoating(item,{now:opts.now});
  if(coating&&plan.ranged&&(coating.projectiles??w.capacity??1)<plan.units)throw Error('Aplicação venenosa insuficiente para todos os projéteis; prepare outro lote ou remova a aplicação.');

  if(plan.ranged&&['short-bow','long-bow'].includes(w.key)&&!items.some(i=>i.system.catalogKey==='arrows'&&Number(i.system.quantity??0)>0))throw Error('Sem flechas.');
  if(plan.ranged&&!['shot','firearm','ammo'].includes(w.category)&&Number(item.system.quantity??0)<plan.units)throw Error('Quantidade de projéteis insuficiente.');
  const attacks=plan.attacks?.map(part=>({...plan,...part,notes:[...plan.notes,...(part.notes??[])],precision:plan.purchased+part.bonus+check.bonus+Math.max(-3,part.penalty+check.penalty-(check.uncappedPenalty??0)+(item.system.damaged?-1:0))+(check.uncappedPenalty??0),attacks:undefined}))??[plan];

 const books=game.settings.get(ID,'profile')?.books??['basico','avancado'];
 if(!books.includes(w.book))throw Error('O livro desta arma não está habilitado.');
 const chosen=items.find(i=>i.type==='aptitude'&&i.system.catalogKey===opts.maneuver);
 if(chosen&&!books.includes(chosen.system.catalogBook))throw Error('O livro desta aptidão não está habilitado.');
 return {item,w,opts,plan,attacks,coating};
}
// Persist the cost plan before applying it; receipts share each Item update.
export function weaponCosts({item,w,plan,coating},actor){
 const costs=new Map();
 const add=(doc,path,value)=>{const c=costs.get(doc.id)??{itemId:doc.id,before:{},patch:{}};c.before[path]=path.split('.').reduce((o,k)=>o?.[k],doc)??null;c.patch[path]=value;costs.set(doc.id,c);};
 if(plan.ranged&&['short-bow','long-bow'].includes(w.key)){const ammo=[...actor.items].find(i=>i.system.catalogKey==='arrows'&&Number(i.system.quantity??0)>0);if(!ammo)throw Error('Sem flechas.');add(ammo,'system.quantity',Number(ammo.system.quantity)-1);}
 if(plan.ranged&&!['shot','firearm','ammo'].includes(w.category))add(item,'system.quantity',Number(item.system.quantity)-plan.units);
 if(coating&&plan.ranged){const n=coating.projectiles??w.capacity??1;add(item,'system.inventoryData.coating',n===plan.units?null:{...coating,projectiles:n-plan.units});}
 if(plan.ranged&&needsReload(w))add(item,'system.loaded',false);
 return [...costs.values()];
}
export async function commitWeaponCosts(actor,costs,executionId){
 if(!actor?.isOwner)throw Error('Você não pode usar esta ficha.');
 for(const c of costs){const item=actor.items.get(c.itemId);if(!item)throw Error('Material removido durante o início. Restaure o item para retomar.');
  if(item.getFlag?.(ID,'actionCosts')?.[executionId])continue;
  for(const [path,expected]of Object.entries(c.before)){const current=path.split('.').reduce((o,k)=>o?.[k],item)??null;if(JSON.stringify(current)!==JSON.stringify(expected))throw Error('O material mudou durante o início. Confira a execução antes de retomar.');}
  await item.update({...c.patch,[`flags.${ID}.actionCosts.${executionId}`]:true});
 }
}
export function weaponFingerprint(actor,itemId,options){
 const {item,w,opts,plan,attacks,coating}=prepareWeaponAction(actor,itemId,options);
 // No private character snapshot is published. Exact inputs remain on the actor.
 const {now,...stableOptions}=opts;const text=JSON.stringify({itemId,w:w.key,options:stableOptions,plan,attacks,coating});let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16);
}
