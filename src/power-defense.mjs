import {ID} from './config.mjs';
import {WEAPONS} from './weapons.mjs';

// Only ordinary catalog weapons are destroyed here. Special/hijutsu weapons
// retain their own rules and are intentionally not inferred from a name.
export async function breakCommonBlockingWeapon(target,kind,weaponId){
 if(!kind)return false;
 if(!weaponId)throw Error('Escolha a arma usada no Bloqueio.');
 const weapon=target.items.get?.(weaponId)??[...target.items].find(i=>i.id===weaponId);
 if(!weapon||!WEAPONS.some(w=>w.key===weapon.system.catalogKey)||weapon.getFlag?.(ID,'createdPower'))return false;
 const energy=(target.system.powerState?.active??[]).filter(a=>a.weaponId===weapon.id&&a.damageAttribute==='esp').map(a=>a.element??a.family);
 const protectedWeapon=kind==='rasengan'?false:kind==='afiar'?energy.some(e=>e!=='raiton'):kind==='electric'?energy.some(e=>e!=='doton'):kind==='lightning'?energy.some(e=>['fuuton','raiton'].includes(e)):true;
 if(protectedWeapon)return false;
 await weapon.update({'system.destroyed':true,'system.equipped':false});return true;
}
