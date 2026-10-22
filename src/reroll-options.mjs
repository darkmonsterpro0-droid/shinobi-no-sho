import {aptitudeOwned} from './aptitudes.mjs';
export function rerollOption(items,roll,rules={}){
 if(roll.rerollOf||roll.simulated||roll.used)return null;
 if(roll.kind==='initiative'&&aptitudeOwned(items,'diligente','',rules))return {key:'diligente',label:'Diligente: repetir Iniciativa',period:'scene',limit:1};
 if(!Number.isFinite(roll.natural)||roll.natural<=3)return null;
 if(roll.kind==='skill'&&aptitudeOwned(items,'pericia-inata',roll.stat,rules))return {key:'pericia-inata',label:'Perícia Inata: repetir teste'};
 if(roll.kind==='resistance'&&aptitudeOwned(items,'resistencia-maior',roll.stat,rules))return {key:'resistencia-maior',label:'Resistência Maior: repetir teste'};
 return null;
}
