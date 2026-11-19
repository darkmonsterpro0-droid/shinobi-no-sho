// Básico 4.1.b, pp. 96, 98–99.
export const groupedPowerEffects=new Set(['raio','flechas','lanca','ricochete','kage-shibari','kage-mane','kagezukami','kage-shuriken','kageyose','kage-nui']);
export function canGroupPower(plan){
 return !!plan&&plan.stat==='cd'&&!plan.area&&plan.family!=='kikai-ninpou'&&groupedPowerEffects.has(plan.effect);
}
const distance=(grid,a,b)=>{
 const measured=grid?.measurePath?.([a.getCenterPoint?.(),b.getCenterPoint?.()])?.distance;
 return Number.isFinite(measured)&&measured>=0?measured:null;
};
export function validatePowerGroup(scene,actor,plan,entries,originId){
 if(!canGroupPower(plan)||!Array.isArray(entries)||!entries.length||entries.length>100)
  throw Error('Marque os alvos deste ataque no mapa.');
 const origin=scene?.tokens.get(originId);
 if(origin?.actor?.uuid!==actor.uuid)throw Error('Selecione o token do atacante nesta cena.');
 const tokens=entries.map(entry=>scene.tokens.get(entry.tokenId));
 if(tokens.some(token=>!token?.actor||token.hidden||token.actor.uuid===actor.uuid)||
    new Set(tokens.map(token=>token.actor.uuid)).size!==entries.length)throw Error('A seleção tem alvos inválidos ou fichas repetidas.');
 if(plan.shadow&&tokens.length>plan.shadow.maximum)throw Error('O nível usado não permite tantos alvos das sombras.');
 if(plan.filamentBinding&&tokens.length>plan.targets)throw Error('Não há dois filamentos disponíveis por alvo marcado.');
 if((plan.shadow||plan.filamentBinding)&&tokens.some(t=>t.actor.type==='puppet'||Number(t.actor.system?.resources?.vitality?.value)<=-21))
  throw Error('A prisão das sombras exige criaturas vivas; marionetes ou mortos não são alvos válidos.');
 if(plan.effect==='ricochete'){
  if(entries.length>plan.targets)throw Error('O nível usado não permite tantos alvos de Ricochete.');
  for(const token of tokens.slice(1)){
   const gap=distance(scene.grid,tokens[0],token);
   if(gap==null||gap>10)throw Error('Cada salto deve ficar a até 10 m do primeiro alvo de Ricochete.');
  }
 }
 if(plan.effect==='raio'){
  if(entries.length>plan.targets)throw Error('O nível usado não permite tantos alvos de Raio.');
  for(let i=0;i<tokens.length;i++)for(let j=i+1;j<tokens.length;j++){
   const gap=distance(scene.grid,tokens[i],tokens[j]);
   if(gap==null||gap>4)throw Error('Todos os alvos de Raio devem estar a até 4 m entre si.');
  }
 }
 if(plan.effect==='flechas'||plan.nui){
  if(entries.some(entry=>!Number.isInteger(entry.projectiles)||entry.projectiles<(plan.nui?.stitch?2:1))||
    entries.reduce((sum,entry)=>sum+entry.projectiles,0)>plan.projectiles)
   throw Error('Distribua de 1 até o limite de projéteis do efeito entre os alvos marcados.');
 }
 return tokens.map((token,index)=>{
  const range=distance(scene.grid,origin,token);
  if(range==null||range>plan.range&&!(plan.effect==='ricochete'&&index>0))throw Error('Um alvo está fora do alcance ou a distância não pôde ser medida.');
  const projectiles=entries[index].projectiles;
  const powerBase=plan.effect==='lanca'?
   Math.floor(plan.damage/tokens.length)+(index<plan.damage%tokens.length?1:0):
   plan.nui?projectiles:plan.effect==='flechas'?plan.damage-2*(plan.projectiles-projectiles):
   plan.effect==='ricochete'&&plan.damagePerPreviousHit?
    plan.damage+Math.min(index,plan.damagePerPreviousHit.max)*plan.damagePerPreviousHit.step:plan.damage;
  return {targetUuid:token.actor.uuid,tokenUuid:token.uuid,name:token.name,distance:range,powerBase,
   ...(plan.shadow?{shadowCapanga:!plan.shadow.projectile&&(entries[index].capanga===true||!!token.actor.getFlag?.('shinobi-no-sho','clone')?.capanga||!!token.actor.getFlag?.('shinobi-no-sho','companion')?.capanga)}:{}),
   ...(plan.effect==='flechas'||plan.nui?{projectiles}:{})};
 });
}
