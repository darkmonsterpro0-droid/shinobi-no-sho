export function activeCoordinator(users){return [...users].filter(u=>u.isGM&&u.active).sort((a,b)=>a.id.localeCompare(b.id))[0];}
export function canControl(actor,user){return !!user&&!!actor&&(user.isGM||!!actor.testUserPermission?.(user,'OWNER'));}
export function nativeAuthor(message,users){return users.get(message.author?.id??message.user?.id??message.user);}
export const terminalExecution=state=>['complete','cancelled','interrupted'].includes(state);
export const decisionsComplete=(participants,isDecided)=>participants.every(isDecided);
export function createExecutionStore({namespace,flag='actionExecution',render}){
 return {
  read:message=>structuredClone(message.getFlag(namespace,flag)),
  async write(message,execution){await message.update({[`flags.${namespace}.${flag}`]:execution,content:render(execution)});}
 };
}
// Each coordinator serializes its document requests. Receipts remain the adapter's
// responsibility; this queue does not claim a distributed transaction guarantee.
export function createRequestQueue(process){let tail=Promise.resolve();return request=>{const run=tail.catch(()=>{}).then(()=>process(request));tail=run;return run;};}
