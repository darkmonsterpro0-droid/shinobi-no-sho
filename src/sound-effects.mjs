// Básico 4.1.b p. 152: Nikudan is immune to sonic effects only during execution.
export function immuneToSound(actor,messages=globalThis.game?.messages?.contents??[]){
 if((actor.system?.powerState?.active??[]).some(effect=>effect.active!==false&&effect.immuneSound))return true;
 return [...messages].some(message=>{
  const execution=message.getFlag?.('shinobi-no-sho','actionExecution');
  return execution?.actorUuid===actor.uuid&&['declared','ready','initiating','active'].includes(execution.state)&&
   execution.attacks?.some(attack=>attack.immuneSound===true);
 });
}
