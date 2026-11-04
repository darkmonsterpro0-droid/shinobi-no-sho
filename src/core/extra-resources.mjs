// Rule-independent manual reserves. All storage and permissions are injected.
// Uses and benefits are text: this module never executes costs or effects.
const clone=value=>structuredClone(value);
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&!['__proto__','prototype','constructor'].includes(id);
const defaults={schemaVersion:1,definitionKey:'',originUuid:'',unit:'',uses:'',benefits:'',showOnSheet:true};
export function resourceRecord(raw){return {...clone(raw),resourceData:{...defaults,...clone(raw.resourceData??{})}};}
export function editableResource(record){return record.resourceData?.schemaVersion===1;}
function number(value,label){
 if(value===null||value===undefined||typeof value==='string'&&!value.trim())return null;
 if(!['number','string'].includes(typeof value))throw Error(`${label}: informe um número válido.`);
 const n=Number(value);if(!Number.isFinite(n))throw Error(`${label}: informe um número válido.`);return n;
}
function text(value,label,limit){if(typeof value!=='string'||value.length>limit)throw Error(`${label}: texto inválido ou muito longo.`);return value.trim();}
export function createExtraResources({read,write,canEdit,randomId}){
 const pending=new WeakMap();
 const records=actor=>{const rows=read(actor)??[];if(!Array.isArray(rows))throw Error('Cadastro de recursos inválido. Os dados foram preservados.');return clone(rows);};
 const list=actor=>records(actor).filter(r=>r&&typeof r==='object').map(resourceRecord);
 const get=(actor,id)=>{if(!validId(id))throw Error('Identificador de recurso inválido.');const record=list(actor).find(r=>r.id===id);if(!record)throw Error('Recurso não encontrado.');return record;};
 const assertEditable=(actor,record)=>{if(!canEdit(actor))throw Error('Você não pode editar os recursos deste personagem.');if(record&&!editableResource(record))throw Error('Esta versão do recurso não pode ser editada por este sistema. O registro foi preservado.');};
 const mutate=async(actor,operation)=>{
  assertEditable(actor);
  const task=(pending.get(actor)??Promise.resolve()).catch(()=>{}).then(async()=>{assertEditable(actor);return operation();});
  pending.set(actor,task);return task.finally(()=>{if(pending.get(actor)===task)pending.delete(actor);});
 };
 return {
  list,get,
  save(actor,input){return mutate(actor,async()=>{
   if(Object.hasOwn(input,'resourceData')&&(!input.resourceData||typeof input.resourceData!=='object'||Array.isArray(input.resourceData)))throw Error('Metadados do recurso inválidos.');
   const rows=records(actor),id=input.id??randomId();if(!validId(id))throw Error('Identificador de recurso inválido.');
   const index=rows.findIndex(r=>r?.id===id);if(input.id&&index<0)throw Error('Recurso não encontrado. Reabra o cadastro antes de salvar.');
   if(!input.id&&index>=0)throw Error('Não foi possível gerar um identificador novo. Tente novamente.');
   const previous=index<0?{id,name:'',value:null,max:null,source:'',notes:'',resourceData:{}}:rows[index];assertEditable(actor,resourceRecord(previous));
   const next={...previous,id};
   for(const [key,label,limit]of [['name','Nome',100],['source','Origem',500],['notes','Observações',10000]])if(Object.hasOwn(input,key))next[key]=text(input[key],label,limit);
   if(!next.name?.trim())throw Error('Informe o nome do recurso.');
   for(const [key,label]of [['value','Valor atual'],['max','Máximo']])next[key]=number(Object.hasOwn(input,key)?input[key]:next[key],label);
   if(next.max!==null&&next.max<0)throw Error('O máximo não pode ser negativo.');
   if(next.max!==null&&next.value!==null&&next.value>next.max)throw Error('O valor atual não pode exceder o máximo. Ajuste os valores antes de salvar.');
   next.resourceData={...defaults,...previous.resourceData};
   for(const [key,label,limit]of [['definitionKey','Identificador da definição',200],['originUuid','Referência de origem',500],['unit','Unidade',50],['uses','Usos',10000],['benefits','Benefícios',10000]])if(Object.hasOwn(input.resourceData??{},key))next.resourceData[key]=text(input.resourceData[key],label,limit);
   if(Object.hasOwn(input.resourceData??{},'showOnSheet')){if(typeof input.resourceData.showOnSheet!=='boolean')throw Error('Visibilidade inválida.');next.resourceData.showOnSheet=input.resourceData.showOnSheet;}
   if(index<0)rows.push(next);else rows[index]=next;
   await write(actor,rows);return resourceRecord(next);
  });},
  setValue(actor,id,value){return this.save(actor,{id,value});},
  remove(actor,id){return mutate(actor,async()=>{
   const record=get(actor,id);assertEditable(actor,record);await write(actor,records(actor).filter(r=>r?.id!==id));
  });}
 };
}
