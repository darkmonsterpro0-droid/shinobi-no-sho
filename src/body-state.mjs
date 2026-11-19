// Shinobi, Básico 4.1.b p. 167. A fusion is one creature, including against
// mental attacks. The separate Actor sheets remain historical resources.
import {ID} from './config.mjs';
export const bodyLink=actor=>actor?.getFlag?.(ID,'mergedBody')??actor?.flags?.[ID]?.mergedBody;
export function bodySource(actor){
 const link=bodyLink(actor);if(!link)return actor;
 const source=(globalThis.game?.actors?.contents??[]).find(a=>a.uuid===link.sourceUuid);
 return source?.system.powerState?.active?.some(p=>p.id===link.executionId&&p.bodyFusion&&p.active!==false)?source:actor;
}
export const joinedBody=actor=>bodySource(actor)!==actor;
