// Foundry expands dots in object keys recursively, including nested flags.
// Escape opaque identifiers without changing their value inside the record.
export const recordKey=value=>String(value).replaceAll('%','%25').replaceAll('.','%2E');
export function readKeyedRecord(records,value){
 if(!records)return undefined;
 const raw=String(value),encoded=recordKey(raw);
 if(Object.hasOwn(records,encoded))return records[encoded];
 if(Object.hasOwn(records,raw))return records[raw];
 // Recover records already expanded by a previous Foundry update.
 return raw.split('.').reduce((entry,key)=>entry&&Object.hasOwn(entry,key)?entry[key]:undefined,records);
}
