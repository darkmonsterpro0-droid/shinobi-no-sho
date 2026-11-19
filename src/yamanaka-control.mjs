// Livro Básico 4.1.b pp. 196–200. Body control is an expiring link,
// never a permanent ownership or character-statistics change.
import {ID} from './config.mjs';
import {canControl} from './core/execution.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';
import {measureTokenDistance} from './core/token-distance.mjs';
import {periodKey} from './aptitude-runtime.mjs';
import {mutateRuntime,runtimeState} from './aptitude-runtime.mjs';
import {recordKey} from './core/record-key.mjs';
import {tokenPosition,validateTokenDestination} from './core/token-movement.mjs';
import {powerPlan,powerFamily} from './power-rules.mjs';
import {worldProfile,worldRules} from './world-settings.mjs';
import {derivedSummary,conditionRecords,mentalControllerSummary} from './automation.mjs';
import {sizeProfile} from './physical-rules.mjs';
import {assertAction,updatePower,endPower,postPowerCard,rollPowerResistance} from './power-actions.mjs';
import {mindBinding,controlledBodies,mindCommonItems} from './yamanaka-state.mjs';
import {availableManeuvers} from './maneuvers.mjs';
export {mindBinding,controlledBodies,canDirectMind,basicMindDefense} from './yamanaka-state.mjs';
import {mindTargetPolicy,controlNatureResult} from './yamanaka.mjs';

const powers=actor=>(actor?.system?.powerState?.active??[]).filter(p=>p.active!==false&&!p.ending);
const actors=()=>worldActorDocuments();
async function cancelTemporaryPowers(actor,except){
 for(const active of powers(actor))if(active.id!==except&&(!active.sourceUuid||active.sourceUuid===actor.uuid)&&!active.linkedTo&&!active.stored&&!['permanent','consequence'].includes(active.duration)&&!active.hachimonRecovery)
  await endPower(actor,active.id);
 await mutateRuntime(actor,state=>{
  for(const key of Object.keys(state.active??{})){
   if(key==='penalidade-investida')continue;
   if(key==='estilo-zui-quan')state.cooldowns[key]=2;
   delete state.active[key];
  }
  state.mirages={};state.kaguraFocus=null;
 });
 const {dismissClone}=await import('./clone-actions.mjs');
 for(const clone of actors()){
  const meta=clone.getFlag?.(ID,'clone');
  if(meta?.origin===actor.uuid&&!meta.dismissed&&meta.duration!=='permanent'&&meta.permanent!==true)await dismissClone(clone);
 }
}
export async function activateMentalControl(actor,item,command,{user,requestId}){
 if(!game.user.isGM||!canControl(actor,user)||powerFamily(item)!=='shindenshin')throw Error('Você não controla o Yamanaka.');
 const id=command.executionId??requestId,prior=actor.system.powerState?.executions?.[id];
 const effect=command.options?.effect??'desordem-mental';
 if(!['troca-mente','multipla-troca','desordem-mental'].includes(effect)||prior&&prior.plan?.effect!==effect)throw Error('Este registro pertence a outra técnica.');
 if(prior?.posted)return;
 if(!prior){
  const plan=powerPlan(item,actor.system,[...actor.items],{...command.options,effect},
   {actor,books:worldProfile().books,rules:worldRules()});
  assertAction(actor,plan);
  if(powers(actor).some(p=>p.mentalControl)||mindBinding(actor))throw Error('Encerre o controle mental atual antes de iniciar outro.');
  if(plan.mindControl.mode!=='disorder'&&actors().some(a=>{const c=a.getFlag?.(ID,'clone');return c?.origin===actor.uuid&&!c.dismissed&&c.trueClone;}))
   throw Error('Encerre o Clone Verdadeiro antes de transferir sua mente.');
  const scene=game.scenes.get(command.sceneId),origin=scene?.tokens.get(command.sourceTokenId),entries=command.targets;
  if(!scene||!user.isGM&&user.viewedScene!==scene.id||origin?.actor?.uuid!==actor.uuid)throw Error('Escolha o token do Yamanaka nesta cena.');
  if(!Array.isArray(entries)||!entries.length||entries.length>plan.targets||new Set(entries.map(e=>e.tokenId)).size!==entries.length)
   throw Error(`Marque de 1 a ${plan.targets} vítimas distintas.`);
  if(plan.mindControl.mode==='multiple'&&entries.length!==2)throw Error('Múltipla Troca exige exatamente dois corpos.');
  const participants=entries.map(entry=>{
   const token=scene.tokens.get(entry.tokenId),body=token?.actor,gap=token&&measureTokenDistance(origin,token,scene.grid);
   if(!body||body.uuid===actor.uuid||!user.isGM&&token.hidden||!Number.isFinite(gap)||gap>plan.range||mindBinding(body))
    throw Error('As vítimas precisam estar visíveis, ao alcance e sem outro controle mental.');
   const bodyKind=entry.bodyKind??(entry.animal?'animal':'human'),policy=mindTargetPolicy(plan.mindControl.mode,
    {clone:!!body.getFlag?.(ID,'clone'),living:!['corpse','inanimate'].includes(bodyKind)&&body.type!=='puppet'&&Number(body.system.resources?.vitality?.value)>-21,
     bodyKind,sizeIndex:sizeProfile(body.system).index,conditions:derivedSummary(body).state.keys,
     surpriseAttack:entry.surpriseAttack===true,irrational:entry.irrational===true,capanga:entry.capanga===true});
   if(entry.irrational&&bodyKind!=='animal')throw Error('Confirme um animal irracional antes de dispensar sua resistência.');
   if(plan.mindControl.mode==='multiple'&&['corpse','inanimate'].includes(bodyKind)&&Number(body.system.resources?.vitality?.value)<=0)
    throw Error('Prepare uma ficha própria para a integridade do cadáver ou corpo inanimado antes da transferência. A técnica não recupera sua Vitalidade.');
   return {bodyUuid:body.uuid,tokenUuid:token.uuid,bodyKind,policy,halfDamage:entry.halfDamage===true};
  });
  if(new Set(participants.map(p=>p.bodyUuid)).size!==participants.length)throw Error('Marque somente um token por corpo.');
  if(plan.mindControl.mode==='multiple'&&participants.filter(p=>p.halfDamage).length!==1)throw Error('Escolha um dos dois corpos para a redução de dano de Parceiros.');
  const {corpulenciaPayment}=await import('./clan-capabilities.mjs');
  await updatePower(actor,state=>{
   if(state.executions[id])return;
   const payment=corpulenciaPayment(actor,plan.cost,Number(command.options?.convertedChakra??0),{books:worldProfile().books,rules:worldRules()});
   state.executions[id]={plan:structuredClone(plan),participants,posted:false};
   state.active.push({...plan.active,id,itemId:item.id,name:plan.name,sourceUuid:actor.uuid,sourceTokenUuid:origin.uuid,
    scene:periodKey(actor,'scene'),createdTurn:periodKey(actor,'turn'),duration:plan.duration,plan:structuredClone(plan),lastProcessed:{},
    expiresAt:plan.mindControl.durationSeconds==null?null:Number(game.time?.worldTime??0)+plan.mindControl.durationSeconds,
    mentalControl:{mode:plan.mindControl.mode,participants:participants.map(p=>p.bodyUuid),pending:true,assumed:false}});
   return {changes:payment};
  });
 }
 const pending=actor.system.powerState.executions[id],root=powers(actor).find(p=>p.id===id);
 if(!root)return;
 let waiting=false;
 for(const entry of pending.participants){
  const body=actors().find(a=>a.uuid===entry.bodyUuid);if(!body)continue;
  const receipt=id+':control:'+body.id;
  if(powers(body).some(p=>p.id===receipt&&p.linkedTo===id))continue;
  if(entry.policy.evasion){
   const {inviteMindEvasion}=await import('./yamanaka-transfer.mjs');
   if(!entry.evasionStat){await inviteMindEvasion(actor,body,id);waiting=true;continue;}
   const evasion=entry.evasionStat==='none'?{success:false,declined:true}:
    await rollPowerResistance(body,entry.evasionStat,pending.plan.difficulty-3,pending.plan,receipt+':evasion');
   await updatePower(actor,state=>{state.executions[id].evasions??={};state.executions[id].evasions[body.id]=structuredClone(evasion);});
   if(evasion.success){
    if(pending.plan.mindControl.mode==='transfer')await updatePower(actor,state=>{
     const recovery=id+':failed-send';if(!state.active.some(p=>p.id===recovery))state.active.push({id:recovery,name:'Mente perdida no envio',sourceUuid:actor.uuid,
      duration:'consequence',mindSendFailure:true,createdTurn:periodKey(actor,'turn'),expiresAt:Number(game.time?.worldTime??0)+6});
    });
    continue;
   }
  }
  const result=pending.plan.mindControl.mode==='disorder'&&entry.policy.intelligenceResistance?
   await rollPowerResistance(body,'int',pending.plan.difficulty,pending.plan,receipt):{success:false,automaticFailure:!entry.policy.intelligenceResistance};
  await updatePower(actor,state=>{state.executions[id].results??={};state.executions[id].results[body.id]=structuredClone(result);});
  if(result.success)continue;
  if(!powers(actor).find(p=>p.id===id)?.mentalControl.assumed)await cancelTemporaryPowers(actor,id);
  await cancelTemporaryPowers(body);
  await updatePower(body,state=>{
   if(!state.active.some(p=>p.id===receipt))state.active.push({id:receipt,name:pending.plan.name,sourceUuid:actor.uuid,linkedTo:id,
    duration:'linked',tokenUuid:entry.tokenUuid,plan:{family:'shindenshin',effect:pending.plan.effect},
    mentalControlLink:{mode:pending.plan.mindControl.mode,intelligenceResistance:entry.policy.intelligenceResistance,natureSuccesses:0,
     bodyKind:entry.bodyKind,halfDamage:entry.halfDamage,controlledStarts:1,initialResistanceResolved:pending.plan.mindControl.mode==='disorder'||!entry.policy.intelligenceResistance,
     clockAt:Number(game.time?.worldTime??0)}});
  });
  await updatePower(actor,state=>{const active=state.active.find(p=>p.id===id);if(active)active.mentalControl.assumed=true;});
 }
 if(waiting)return;
 await updatePower(actor,state=>{const active=state.active.find(p=>p.id===id);if(active)active.mentalControl.pending=false;});
 if(!controlledBodies(actor,id).length)await endPower(actor,id);
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag(ID,'executionId')===id&&m.getFlag(ID,'kind')==='power-use'))
  await postPowerCard(actor,pending.plan,{executionId:id,itemId:item.id});
 await updatePower(actor,state=>{state.executions[id].posted=true;});
}

// The coordinator builds a narrow declaration; the client supplies neither
// calculated precision nor damage, and never receives an ownership grant.
export async function controlledWeaponCommand(source,command,{user,requestId}){
 if(!canControl(source,user))throw Error('Você não controla o Yamanaka.');
 const body=actors().find(a=>a.uuid===command.bodyUuid),binding=mindBinding(body);
 if(!binding||binding.source.uuid!==source.uuid||binding.root.id!==command.id)throw Error('Este corpo não está mais sob seu controle.');
 if(binding.root.mentalControl.pending)throw Error('Aguarde as reações iniciais das vítimas.');
 if(mentalControllerSummary(source).state.noActions)throw Error('A condição atual interrompe o controle.');
 if(command.suicidal===true){
  const result=await resolveMindNature(source,command,{user,requestId});
  if(result.cancel||result.stun)return null;
 }
 if(!['melee','ranged'].includes(command.mode))throw Error('Escolha um ataque comum.');
 const scene=game.scenes.get(command.sceneId),token=binding.link.tokenUuid&&scene?.tokens.find(t=>t.uuid===binding.link.tokenUuid&&t.actor?.uuid===body.uuid),target=scene?.tokens.get(command.targetTokenId);
 if(!scene||!user.isGM&&scene.id!==user.viewedScene||!token||!target?.actor||target.actor.uuid===body.uuid||!user.isGM&&target.hidden)
  throw Error('Marque um alvo visível para o corpo controlado.');
 const gap=measureTokenDistance(token,target,scene.grid);
 if(!Number.isFinite(gap))throw Error('Não foi possível medir o alcance deste ataque.');
 const maneuver=binding.root.mentalControl.mode==='disorder'?'golpear':command.maneuver??'golpear';
 if(!Object.hasOwn(availableManeuvers(mindCommonItems(body),worldRules()),maneuver))throw Error('Esta manobra exige a aptidão comum nas duas fichas.');
 const options={mode:command.mode,maneuver,distance:gap,count:Number(command.count??2)};
 const {prepareWeaponAction}=await import('./weapon-actions.mjs'),prepared=prepareWeaponAction(body,command.itemId??'unarmed',options);
 return {op:'declare',actorUuid:body.uuid,itemId:command.itemId??'unarmed',quickResolution:true,
  options,targets:prepared.attacks.map(()=>[target.actor.uuid]),distances:prepared.attacks.map(()=>[gap]),
  control:{sourceUuid:source.uuid,rootId:binding.root.id,bodyUuid:body.uuid,mode:binding.root.mentalControl.mode,againstNature:command.againstNature===true}};
}

export async function resolveMindNature(source,command,{user,requestId}){
 if(!game.user.isGM)throw Error('O mestre coordena a resistência ao controle.');
 const body=actors().find(a=>a.uuid===command.bodyUuid),binding=mindBinding(body);
 if(!canControl(source,user)&&!canControl(body,user))throw Error('Somente os participantes podem pedir esta resistência.');
 const id=requestId+':nature',record=source?.system.powerState?.executions?.[command.id];
 if(!binding&&record?.natureResults?.[id]&&record.participants?.some(p=>p.bodyUuid===command.bodyUuid))return record.natureResults[id];
 if(!binding||binding.source.uuid!==source.uuid||binding.root.id!==command.id||!record)throw Error('Controle mental não encontrado.');
 let outcome=record.natureResults?.[id];
 if(!outcome){
  if(command.suicidal!==true&&command.againstNature!==true)throw Error('Confirme a ação contrária à natureza ou suicida com a mesa.');
  const resistance=command.suicidal===true?null:binding.link.mentalControlLink.intelligenceResistance?
   await rollPowerResistance(body,'int',binding.root.plan.difficulty-2,binding.root.plan,id):{success:false,automaticFailure:true};
  outcome=controlNatureResult(Number(binding.link.mentalControlLink.natureSuccesses??0),
   {mode:binding.root.mentalControl.mode,suicidal:command.suicidal===true,resisted:!!resistance?.success});
  await updatePower(source,state=>{state.executions[binding.root.id].natureResults??={};state.executions[binding.root.id].natureResults[id]=structuredClone(outcome);});
 }
 if(outcome.stun)await updatePower(source,state=>{
  if(!state.active.some(p=>p.id===id+':stun'))state.active.push({id:id+':stun',name:'Atordoado · resistência ao controle',
   sourceUuid:source.uuid,duration:'consequence',mentalStun:true,awaitNextStart:true,clockAt:Number(game.time?.worldTime??0),clockTurns:2,lastProcessed:{}});
 });
 if(outcome.cancel)await endPower(source,binding.root.id);
 else await updatePower(body,state=>{const link=state.active.find(p=>p.id===binding.link.id);if(link)link.mentalControlLink.natureSuccesses=outcome.successes;});
 return outcome;
}

export async function chooseControlledWeapon(source,id,bodyUuid){
 const body=actors().find(a=>a.uuid===bodyUuid),binding=mindBinding(body);
 if(!binding||binding.source.uuid!==source.uuid||binding.root.id!==id)throw Error('Este controle mental já terminou.');
 const marked=[...(game.user.targets??[])].filter(t=>t.actor);
 if(marked.length!==1)throw Error('Marque um alvo para o ataque do corpo controlado.');
 const {WEAPONS}=await import('./weapons.mjs'),choices=[{id:'unarmed',mode:'melee',name:'Golpear · desarmado'}];
 for(const item of body.items){
  const weapon=WEAPONS.find(w=>w.key===item.system.catalogKey&&w.book===item.system.catalogBook);
  if(!weapon||!item.system.equipped||item.system.destroyed||Number(item.system.quantity??1)<1||item.system.inventoryData?.storedElsewhere)continue;
  if(weapon.melee)choices.push({id:item.id,mode:'melee',name:'Golpear · '+item.name});
  if(weapon.range)choices.push({id:item.id,mode:'ranged',name:(weapon.category==='throw'?'Lançar · ':'Disparar · ')+item.name});
 }
 const esc=value=>foundry.utils.escapeHTML(String(value));
 const disorder=binding.root.mentalControl.mode==='disorder',maneuvers=availableManeuvers(mindCommonItems(body),worldRules());
 const values=await foundry.applications.api.DialogV2.prompt({window:{title:'Ataque de '+body.name},
  content:(disorder?'<p>Ações da vítima no fim do turno do Yamanaka.</p>':'<p>Ações do corpo possuído; iniciativa do Yamanaka.</p>')+'<label>Ataque <select name="attack">'+choices.map((c,i)=>'<option value="'+i+'">'+esc(c.name)+'</option>').join('')+'</select></label>'+
   (disorder?'':'<label>Manobra <select name="maneuver">'+Object.entries(maneuvers).map(([key,label])=>'<option value="'+esc(key)+'">'+esc(label)+'</option>').join('')+'</select></label><label>Golpes, se a manobra permitir <select name="count"><option>2</option><option>3</option></select></label>')+
   '<label><input type="checkbox" name="againstNature"> Ação contrária à natureza · permite resistência</label>'+
   '<label><input type="checkbox" name="suicidal"> Ação suicida · cancelar o controle antes de agir</label>',
  ok:{label:'Declarar ataque',callback:(_event,button)=>({index:Number(button.form.elements.attack.value),
   maneuver:button.form.elements.maneuver?.value??'golpear',count:Number(button.form.elements.count?.value??2),
   againstNature:button.form.elements.againstNature.checked,suicidal:button.form.elements.suicidal.checked})}});
 if(!values)return;
 const choice=choices[values.index];if(!choice)throw Error('Ataque comum não encontrado.');
 const {requestAction}=await import('./action-executions.mjs');
 await requestAction({op:'mind-declare',actorUuid:source.uuid,id,bodyUuid,itemId:choice.id,mode:choice.mode,
  sceneId:canvas.scene.id,targetTokenId:marked[0].document.id,maneuver:values.maneuver,count:values.count,againstNature:values.againstNature,suicidal:values.suicidal});
}

function bodyForOperation(source,command,user){
 if(!game.user.isGM||!canControl(source,user))throw Error('Você não controla o Yamanaka.');
 const body=actors().find(a=>a.uuid===command.bodyUuid),binding=mindBinding(body);
 if(!binding||binding.source.uuid!==source.uuid||binding.root.id!==command.id)throw Error('Este controle mental já terminou.');
 if(binding.root.mentalControl.pending)throw Error('Aguarde as reações iniciais das vítimas.');
 if(mentalControllerSummary(source).state.noActions||derivedSummary(body).state.noActions)throw Error('A condição atual impede esta ação.');
 return {body,binding};
}
export async function moveControlledBody(source,command,{user,requestId}){
 const {body,binding}=bodyForOperation(source,command,user),scene=game.scenes.get(command.sceneId);
 const token=binding.link.tokenUuid&&scene?.tokens.find(t=>t.uuid===binding.link.tokenUuid&&t.actor?.uuid===body.uuid);
 if(!scene||!user.isGM&&user.viewedScene!==scene.id||!token)throw Error('Abra a cena do corpo controlado.');
 const key=recordKey(requestId),prior=runtimeState(source).mindMovements?.[key];if(prior?.done)return;
 const destination=prior?.destination??command.destination,current=tokenPosition(token);
 if(!prior||['x','y','elevation'].some(k=>current[k]!==destination[k])){
  if(['x','y','elevation'].some(k=>current[k]!==(prior?.start??command.start)?.[k]))throw Error('O corpo mudou de posição. Escolha novamente o destino.');
  validateTokenDestination(scene,token,token,destination,derivedSummary(body).movement);
  if(!prior)await mutateRuntime(source,state=>{
   state.mindMovements??={};state.mindMovements[key]={start:current,destination:structuredClone(destination)};
   for(const old of Object.keys(state.mindMovements).slice(0,-80))delete state.mindMovements[old];
  });
  await token.move([structuredClone(destination)],{pan:false,showRuler:false});
 }
 const actual=game.scenes.get(scene.id).tokens.find(t=>t.uuid===token.uuid);
 if(!actual||['x','y','elevation'].some(k=>tokenPosition(actual)[k]!==destination[k]))throw Error('O movimento foi interrompido. Confira a chegada.');
 await mutateRuntime(source,state=>{state.mindMovements[key].done=true;});
}
export async function readyControlledWeapon(source,command,{user}){
 const {body}=bodyForOperation(source,command,user),{setWeaponReady}=await import('./weapon-actions.mjs');
 if(typeof command.equipped!=='boolean')throw Error('Escolha sacar ou guardar a arma.');
 await setWeaponReady(body,command.itemId,command.equipped);
}
export async function chooseControlledMovement(source,id,bodyUuid){
 const body=actors().find(a=>a.uuid===bodyUuid),binding=mindBinding(body);
 if(!binding||binding.source.uuid!==source.uuid||binding.root.id!==id)throw Error('Este controle mental já terminou.');
 const token=canvas.scene.tokens.find(t=>t.uuid===binding.link.tokenUuid&&t.actor?.uuid===bodyUuid);
 if(!token)throw Error('Abra a cena do corpo controlado.');
 const start=tokenPosition(token),{selectMapPoint}=await import('./core/map-point.mjs');
 const point=await selectMapPoint('Escolha o destino de '+body.name+'. Esc cancela.');if(!point)return;
 const size=token.getSize(),end=token.getSnappedPosition({x:point.x-size.width/2,y:point.y-size.height/2,elevation:token.elevation});
 const {requestAction}=await import('./action-executions.mjs');
 await requestAction({op:'mind-move',actorUuid:source.uuid,id,bodyUuid,sceneId:canvas.scene.id,start,
  destination:{x:end.x,y:end.y,elevation:end.elevation??token.elevation}});
}
export async function chooseControlledEquipment(source,id,bodyUuid){
 const body=actors().find(a=>a.uuid===bodyUuid),binding=mindBinding(body);
 if(!binding||binding.source.uuid!==source.uuid||binding.root.id!==id)throw Error('Este controle mental já terminou.');
 const {canHandleWeapon,weaponHandlingAction}=await import('./weapon-actions.mjs'),weapons=[...body.items].filter(canHandleWeapon);
 if(!weapons.length)throw Error('Este corpo não tem armas disponíveis na ficha.');
 const esc=value=>foundry.utils.escapeHTML(String(value));
 const chosen=await foundry.applications.api.DialogV2.prompt({window:{title:'Armas de '+body.name},
  content:'<p>Sacar/guardar · '+esc(weaponHandlingAction([...body.items],worldRules()))+'. Apanhar objetos do cenário exige conferência da mesa.</p><label>Arma <select name="weapon">'+
   weapons.map((w,i)=>'<option value="'+i+'">'+esc((w.system.equipped?'Guardar · ':'Sacar · ')+w.name)+'</option>').join('')+'</select></label>',
  ok:{label:'Confirmar',callback:(_event,button)=>Number(button.form.elements.weapon.value)}});
 if(chosen===null||chosen===undefined)return;
 const weapon=weapons[chosen];if(!weapon)throw Error('Arma indisponível.');
 const {requestAction}=await import('./action-executions.mjs');
 await requestAction({op:'mind-ready',actorUuid:source.uuid,id,bodyUuid,itemId:weapon.id,equipped:!weapon.system.equipped});
}
