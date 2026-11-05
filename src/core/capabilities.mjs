// Generic eligibility and provenance. No game formulas, resource spending or effects.
export const capabilityId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value) && !['__proto__','prototype','constructor'].includes(value);
export function evaluateRequirement(rule, facts = {}) {
  if (!rule) return {allowed:null, missing:[], review:['Requisito ainda precisa de conferência.']};
  if (rule.all || rule.any) {
    const results=(rule.all??rule.any).map(r=>evaluateRequirement(r,facts));
    if(rule.any&&results.some(r=>r.allowed===true))return {allowed:true,missing:[],review:[]};
    const missing=results.flatMap(r=>r.missing),review=results.flatMap(r=>r.review);
    const allowed=rule.all?(results.some(r=>r.allowed===false)?false:review.length?null:true):(review.length?null:false);
    return {allowed,missing,review};
  }
  if(rule.review)return {allowed:null,missing:[],review:[rule.review]};
  if(typeof rule.fact!=='string')return {allowed:null,missing:[],review:['Tipo de requisito não suportado.']};
  const value=facts[rule.fact],label=rule.label??rule.fact;
  const allowed=rule.min!==undefined?Number.isFinite(value)&&value>=rule.min:rule.absent?value===false:value===true;
  return {allowed,missing:allowed?[]:[rule.min!==undefined?`${label}: exige ${rule.min}; atual ${value??'não informado'}.`:label],review:[]};
}
export function capabilityLedger(raw) {
  if(raw!=null&&(typeof raw!=='object'||Array.isArray(raw)))throw Error('Registro de capacidades inválido; dados preservados.');
  const ledger={schemaVersion:1,grants:[],suspensions:{},...structuredClone(raw??{})};
  if(ledger.schemaVersion===1&&(!Array.isArray(ledger.grants)||!ledger.suspensions||typeof ledger.suspensions!=='object'||Array.isArray(ledger.suspensions)))throw Error('Estrutura de capacidades inválida; dados preservados.');
  return ledger;
}
export function grantAvailability(record, items, ledger) {
  const source=items.find(i=>(i.id??i._id)===record.sourceItemId);
  return {record:structuredClone(record),available:!!source&&!ledger.suspensions?.[record.sourceItemId]&&!record.suspended,reason:!source?'Origem removida.':ledger.suspensions?.[record.sourceItemId]?.reason??(record.suspended?'Concessão suspensa.':'')};
}
export function createCapabilityLedger({read,write,canEdit,isGM,items,randomId}) {
  const pending=new WeakMap();
  const get=actor=>capabilityLedger(read(actor));
  const mutate=(actor,fn)=>{
    if(!canEdit(actor)||!isGM())return Promise.reject(Error('Somente o mestre controlador altera concessões ou suspensões.'));
    const task=(pending.get(actor)??Promise.resolve()).catch(()=>{}).then(async()=>{
      if(!canEdit(actor)||!isGM())throw Error('Permissão revogada.');
      const ledger=get(actor);if(ledger.schemaVersion!==1)throw Error('Versão de capacidades não suportada; dados preservados.');
      const result=fn(ledger);await write(actor,ledger);return structuredClone(result);
    });pending.set(actor,task);return task.finally(()=>{if(pending.get(actor)===task)pending.delete(actor);});
  };
  return {
    read:get,
    grants(actor){const ledger=get(actor);if(ledger.schemaVersion!==1)return [];return ledger.grants.map(r=>grantAvailability(r,items(actor),ledger));},
    grant(actor,{sourceItemId,benefitKey,selection='',level=1,reason}){return mutate(actor,ledger=>{
      if(!capabilityId(sourceItemId)||!capabilityId(benefitKey)||typeof selection!=='string'||selection.length>200||!Number.isInteger(level)||level<1||level>20||typeof reason!=='string'||!reason.trim()||reason.length>2000)throw Error('Concessão inválida; informe origem, benefício, nível e justificativa.');
      if(!items(actor).some(i=>(i.id??i._id)===sourceItemId))throw Error('Item de origem não encontrado.');
      const existing=ledger.grants.find(r=>r.sourceItemId===sourceItemId&&r.benefitKey===benefitKey&&r.selection===selection);
      if(existing){if(existing.level!==level)throw Error('A concessão já existe em outro nível; confira sua origem.');return existing;}
      const record={id:randomId(),sourceItemId,benefitKey,selection,level,reason:reason.trim(),suspended:false};
      if(!capabilityId(record.id))throw Error('Identificador de concessão inválido.');ledger.grants.push(record);return record;
    });},
    suspend(actor,itemId,reason){return mutate(actor,ledger=>{
      if(!capabilityId(itemId)||!items(actor).some(i=>(i.id??i._id)===itemId)||typeof reason!=='string'||!reason.trim()||reason.length>2000)throw Error('Informe uma origem existente e o motivo da suspensão.');
      ledger.suspensions[itemId]={reason:reason.trim()};return ledger.suspensions[itemId];
    });},
    resume(actor,itemId){return mutate(actor,ledger=>{if(!capabilityId(itemId))throw Error('Origem inválida.');delete ledger.suspensions[itemId];return {itemId};});}
  };
}
