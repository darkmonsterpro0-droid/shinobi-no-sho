// Reuse the actual body's ordinary action services with a temporary read view.
// Purchases, document ownership and stored statistics are never replaced.
import {ID,ATTRIBUTES,COMBAT,SKILLS} from './config.mjs';
import {canControl} from './core/execution.mjs';
import {worldActorDocuments} from './core/world-actors.mjs';
import {measureTokenDistance} from './core/token-distance.mjs';
import {mindBinding,mindCommonItems} from './yamanaka-state.mjs';
import {mentalControllerSummary,statPrecision} from './automation.mjs';
import {updatePower,assertAction,maintainPower,endPower,postPowerCard} from './power-actions.mjs';
import {powerPlan} from './power-rules.mjs';
import {yamanakaPlan} from './yamanaka.mjs';
import {worldProfile,worldRules} from './world-settings.mjs';
import {corpulenciaPayment} from './clan-capabilities.mjs';
import {periodKey,mutateRuntime,runtimeState} from './aptitude-runtime.mjs';
import {recordKey,readKeyedRecord} from './core/record-key.mjs';
import {USE_FIELDS} from './aptitude-forms.mjs';

export function controlledAbilityContext(source,id,bodyUuid,user=game.user){
 const body=worldActorDocuments().find(a=>a.uuid===bodyUuid),binding=mindBinding(body);
 if(!canControl(source,user)||!binding||binding.source.uuid!==source.uuid||binding.root.id!==id||binding.root.mentalControl.mode==='disorder')
  throw Error('Esta ação exige uma Troca de Mente ativa sob seu controle.');
 if(mentalControllerSummary(source).state.noActions)throw Error('A condição atual do Yamanaka impede esta ação.');
 if(binding.root.mentalControl.pending)throw Error('Aguarde as reações iniciais das vítimas.');
 return {body,binding,items:mindCommonItems(body)};
}

export function mindActorView(body,items=mindCommonItems(body)){
 const collection=[...items];collection.get=id=>collection.find(i=>i.id===id);collection.contents=collection;
 // Foundry defines its embedded collections as non-configurable properties.
 return new Proxy({},{get(_target,key){
  if(key==='items')return collection;
  const value=Reflect.get(body,key,body);return typeof value==='function'?value.bind(body):value;
 }});
}
async function controlledAbilityRoll(body,id,suffix,formula){
 const key=id+':'+suffix,previous=readKeyedRecord(runtimeState(body).controlledAbilityRolls,key);
 if(previous)return foundry.dice.Roll.fromJSON(previous);
 const roll=await new foundry.dice.Roll(formula).evaluate();
 await mutateRuntime(body,state=>{state.controlledAbilityRolls??={};state.controlledAbilityRolls[recordKey(key)]=JSON.stringify(roll.toJSON());});
 return roll;
}

export async function chooseControlledAbility(source,id,bodyUuid){
 const {body,items}=controlledAbilityContext(source,id,bodyUuid),available=items.filter(i=>i.type==='power'||i.type==='aptitude'&&Object.hasOwn(USE_FIELDS,i.system.catalogKey));
 if(!available.length)throw Error('Não há poderes ou aptidões comuns presentes nas duas fichas.');
 const esc=v=>foundry.utils.escapeHTML(String(v));
 const selected=await foundry.applications.api.DialogV2.prompt({window:{title:'Técnicas de '+body.name},
  content:'<p>Somente capacidades comuns às duas fichas, no menor nível. Cadáveres e corpos inanimados não usam técnicas da ficha anterior.</p><label>Capacidade <select name="item">'+
   available.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+' · nível '+Number(i.system.level??1)+'</option>').join('')+'</select></label>',
  ok:{label:'Preparar',callback:(_event,button)=>button.form.elements.namedItem('item').value}});
 const item=available.find(i=>i.id===selected);if(!item)return;
 return game.shinobi.open(item.type==='power'?'power-use':'aptitude-use',{actor:body,itemId:item.id,mindControl:{sourceUuid:source.uuid,rootId:id}});
}

export async function requestControlledAbility(actor,app,kind,root){
 const binding=mindBinding(actor);if(!binding)throw Error('A Troca de Mente terminou.');
 controlledAbilityContext(binding.source,binding.root.id,actor.uuid);
 const {readFields}=await import('./interactions.mjs'),values=readFields(root);
 const {requestAction}=await import('./action-executions.mjs');
 await requestAction({op:'mind-ability',actorUuid:binding.source.uuid,id:binding.root.id,bodyUuid:actor.uuid,kind,
  itemId:kind==='power'?values['power.id']:app.panelConfig.itemId,values,
  sceneId:canvas.scene?.id,targetTokenIds:[...(game.user.targets??[])].filter(t=>t.actor).map(t=>t.document.id),
  executionId:app._powerExecutionId??=foundry.utils.randomID()});
 return app.close();
}

export async function executeControlledAbility(source,command,{user,requestId}){
 const {body,binding,items}=controlledAbilityContext(source,command.id,command.bodyUuid,user),item=items.find(i=>i.id===command.itemId);
 if(!game.user.isGM||!item||!['power','aptitude'].includes(item.type)||command.kind!==(item.type==='power'?'power':'aptitude'))
  throw Error('A capacidade deve existir nas duas fichas, no menor nível.');
 const scene=game.scenes.get(command.sceneId),origin=scene?.tokens.find(t=>t.uuid===binding.link.tokenUuid&&t.actor?.uuid===body.uuid);
 if(!scene||!origin||!user.isGM&&user.viewedScene!==scene.id||globalThis.canvas?.scene?.id!==scene.id)
  throw Error('O mestre coordenador precisa estar na cena do corpo para executar esta técnica.');
 if(!Array.isArray(command.targetTokenIds)||command.targetTokenIds.length>100||new Set(command.targetTokenIds).size!==command.targetTokenIds.length)
  throw Error('Alvos da técnica inválidos.');
 const marked=command.targetTokenIds.map(id=>{
  const token=scene.tokens.get(id);if(!token?.actor||!user.isGM&&token.hidden)throw Error('Alvo fora da cena ou sem visibilidade.');
  return {actor:token.actor,document:token,controlled:false};
 });
 const values={};
 for(const [key,value]of Object.entries(command.values??{})){
  if(!key.startsWith(command.kind==='power'?'power.':'aptitude.')&&key!=='area.previewRegion')continue;
  if(value!==null&&!['string','number','boolean'].includes(typeof value)||typeof value==='string'&&value.length>2000||typeof value==='number'&&!Number.isFinite(value))
   throw Error('Parâmetros da técnica inválidos.');
  values[key]=value;
 }
 values['power.id']=item.id;
 if(item.type==='power'){
  const level=Number(values['power.level']??item.system.level);
  if(!Number.isInteger(level)||level<1||level>Number(item.system.level))throw Error('Use o menor nível conhecido nas duas fichas.');
  values['power.level']=level;
  values['power.targetUuid']=marked.length===1?marked[0].actor.uuid:'';
  if(marked.length===1){const gap=measureTokenDistance(origin,marked[0].document,scene.grid);if(!Number.isFinite(gap))throw Error('Não foi possível medir o alcance.');values['power.distance']=gap;}
 }
 const suicidal=values['power.mindSuicidal']===true||values['aptitude.mindSuicidal']===true;
 const againstNature=values['power.mindNature']===true||values['aptitude.mindNature']===true;
 if(suicidal){const {resolveMindNature}=await import('./yamanaka-control.mjs');await resolveMindNature(source,{id:command.id,bodyUuid:body.uuid,suicidal:true},{user,requestId});return null;}
 const control={sourceUuid:source.uuid,rootId:binding.root.id,bodyUuid:body.uuid,mode:binding.root.mentalControl.mode,againstNature};
 const elements=Object.entries(values).map(([name,value])=>({name,value:String(value??''),type:typeof value==='boolean'?'checkbox':typeof value==='number'?'number':'text',checked:value===true}));
 const form={querySelectorAll:()=>elements,querySelector:()=>null};
 let declaration=null;
 const app={values:{},panelConfig:{itemId:item.id,mindControl:control},_powerExecutionId:'mind-ability:'+requestId,
  _mindCoordinated:true,_mindTargets:marked,_mindControl:control,
  _mindRequestId:requestId,_rollOnce:(formula,suffix)=>controlledAbilityRoll(body,requestId,suffix,formula),
  _deferDeclaration:async command=>{declaration=command;},close:async()=>{},render:()=>{}};
 if(item.type==='power'){
  const {powerAction}=await import('./power-actions.mjs');
  await powerAction(app,'power-execute',{},form,{actor:mindActorView(body,items)});
  const pending=body.system.powerState?.executions?.[app._powerExecutionId];
  if(pending?.coordinated)declaration??={op:'declare-power',quickResolution:true,actorUuid:body.uuid,itemId:item.id,powerExecutionId:app._powerExecutionId};
 }else{
  const {aptitudeUseAction}=await import('./aptitude-use.mjs');
  await aptitudeUseAction(app,'execute-aptitude',{id:item.id},form,{actor:mindActorView(body,items)});
 }
 if(!declaration&&againstNature&&mindBinding(body)){
  const {resolveMindNature}=await import('./yamanaka-control.mjs');await resolveMindNature(source,{id:command.id,bodyUuid:body.uuid,againstNature:true},{user,requestId:'ability:'+requestId});
 }
 return {declaration,control};
}

export async function rollControlledTest(source,command,{user,requestId}){
 const {body}=controlledAbilityContext(source,command.id,command.bodyUuid,user),stat=command.stat,bonus=Number(command.bonus??0);
 if(!Object.hasOwn({...ATTRIBUTES,...COMBAT,...SKILLS},stat)||!Number.isInteger(bonus)||Math.abs(bonus)>1000)throw Error('Escolha uma característica e modificador válidos.');
 const kind=stat in SKILLS?'skill':stat in COMBAT?'defense':'attribute',check=statPrecision(body,stat,{kind,manualContext:true,social:command.social===true});
 if(!check.allowed)throw Error(check.reasons.join(' '));
 const key='mind-test:'+requestId,prior=source.system.powerState?.executions?.[key];
 if(prior?.posted)return;
 const {rollPowerResistance}=await import('./power-actions.mjs');
 await rollPowerResistance(body,stat,null,{name:'Teste · '+body.name,testOnly:true,testKind:kind,testBonus:bonus,
  testSocial:command.social===true,privateRecipients:(game.users.contents??[...game.users]).filter(u=>canControl(source,u)).map(u=>u.id)},key);
 await updatePower(source,state=>{state.executions[key]={posted:true};});
}

export async function chooseControlledTest(source,id,bodyUuid){
 const {body}=controlledAbilityContext(source,id,bodyUuid),esc=v=>foundry.utils.escapeHTML(String(v));
 const values=await foundry.applications.api.DialogV2.prompt({window:{title:'Teste de '+body.name},content:
  '<label>Característica <select name="stat">'+Object.entries({...ATTRIBUTES,...COMBAT,...Object.fromEntries(Object.entries(SKILLS).map(([key,v])=>[key,v[0]]))}).map(([key,label])=>'<option value="'+key+'">'+esc(label)+'</option>').join('')+'</select></label>'+
  '<label>Modificador da mesa <input type="number" name="bonus" value="0" step="1"></label><label><input type="checkbox" name="social"> Teste social · precisão do Yamanaka</label>',
  ok:{label:'Rolar',callback:(_event,button)=>({stat:button.form.elements.stat.value,bonus:Number(button.form.elements.bonus.value),social:button.form.elements.social.checked})}});
 if(!values)return;const {requestAction}=await import('./action-executions.mjs');
 await requestAction({op:'mind-test',actorUuid:source.uuid,id,bodyUuid,...values});
}

export async function controlledMindSensor(source,command,{user,requestId}){
 const {body,binding}=controlledAbilityContext(source,command.id,command.bodyUuid,user);
 if(!game.user.isGM)throw Error('O mestre coordena o Sensor de Mentes.');
 const active=(body.system.powerState?.active??[]).find(p=>p.active!==false&&p.borrowedMindSensor?.sourceUuid===source.uuid&&p.borrowedMindSensor.rootId===binding.root.id);
 if(active&&command.operation!=='end'&&!body.system.powerState.executions?.[active.id]?.posted){
  if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag(ID,'executionId')===active.id))await postPowerCard(body,active.plan,{executionId:active.id});
  await updatePower(body,state=>{state.executions[active.id].posted=true;});
 }
 if(command.operation==='end'){if(active)await endPower(body,active.id);return;}
 if(command.operation==='maintain'){
  if(!active)throw Error('Sensor de Mentes não está ativo neste corpo.');
  if(active.lastProcessed?.maintenance!==periodKey(body,'turn'))await maintainPower(body,active.id);return;
 }
 if(command.operation!=='activate')throw Error('Operação do Sensor de Mentes inválida.');
 if(active)return;
 const item=[...source.items].filter(i=>i.type==='power'&&i.system.powerData?.family==='shindenshin'&&Number(i.system.level)>=3).sort((a,b)=>b.system.level-a.system.level)[0];
 if(!item)throw Error('Sensor de Mentes exige Shindenshin 3.');
 const context={actor:source,books:worldProfile().books,rules:worldRules()},base=powerPlan(item,source.system,[...source.items],{effect:'sensor-mentes',level:Number(item.system.level)},context),plan=yamanakaPlan(base,body.system);
 assertAction(body,plan);
 const id='mind-sensor:'+requestId;
 await updatePower(body,state=>{
  if(state.executions[id])return;
  const payment=corpulenciaPayment(body,2,0,{books:context.books,rules:context.rules});
  state.executions[id]={plan:structuredClone(plan),posted:false};
  state.active.push({...plan.active,id,itemId:item.id,name:plan.name,sourceUuid:body.uuid,
   sourceTokenUuid:binding.link.tokenUuid,createdTurn:periodKey(body,'turn'),duration:'sustained',plan:structuredClone(plan),lastProcessed:{},
   borrowedMindSensor:{sourceUuid:source.uuid,rootId:binding.root.id,itemId:item.id}});
  return {changes:payment};
 });
 if(!(game.messages.contents??[...game.messages]).some(m=>m.getFlag(ID,'executionId')===id))await postPowerCard(body,plan,{executionId:id});
 await updatePower(body,state=>{state.executions[id].posted=true;});
}

export async function requestControlledEffect(body,app,operation,data,root){
 const binding=mindBinding(body);if(!binding)throw Error('A Troca de Mente terminou.');
 controlledAbilityContext(binding.source,binding.root.id,body.uuid);
 const {requestAction}=await import('./action-executions.mjs'),{readFields}=await import('./interactions.mjs');
 const values=readFields(root);
 await requestAction({op:'mind-effect',actorUuid:binding.source.uuid,id:binding.root.id,bodyUuid:body.uuid,operation,
  effectId:data.id,itemId:data.id??app.panelConfig.itemId,mirageId:data.mirage,convertedChakra:Number(values['payment.'+data.id+'.convertedChakra']??0)});
 return app.render({force:true});
}

export async function controlledEffect(source,command,{user}){
 const {body,binding,items}=controlledAbilityContext(source,command.id,command.bodyUuid,user);
 const belongs=control=>control?.sourceUuid===source.uuid&&control.rootId===binding.root.id&&control.bodyUuid===body.uuid;
 if(command.operation==='power-end'||command.operation==='power-maintain'){
  const active=(body.system.powerState?.active??[]).find(p=>p.id===command.effectId&&p.active!==false),record=body.system.powerState?.executions?.[command.effectId];
  if(!active||active.sourceUuid!==body.uuid||active.linkedTo||!belongs(record?.control))throw Error('Somente efeitos próprios produzidos durante esta transferência podem ser alterados pelo controlador.');
  if(command.operation==='power-end')return endPower(body,active.id);
  const item=items.find(i=>i.id===active.itemId);if(!item||Number(item.system.level)<Number(active.plan.level))throw Error('A capacidade comum deixou de estar disponível no nível usado.');
  return maintainPower(body,active.id,Number(command.convertedChakra??0));
 }
 if(command.operation==='end-aptitude'){
  const item=body.items.get(command.itemId),key=item?.system.catalogKey,active=runtimeState(body).active?.[key];
  if(!key||!belongs(active?.mindControl))throw Error('Esta aptidão não foi ativada por este controle mental.');
  const {endAptitudeRuntime}=await import('./aptitude-use.mjs');return endAptitudeRuntime(body,key);
 }
 if(command.operation==='end-mirage'){
  const active=runtimeState(body).mirages?.[command.mirageId];if(!belongs(active?.mindControl))throw Error('Esta miragem não foi criada por este controle mental.');
  return mutateRuntime(body,state=>{delete state.mirages[command.mirageId];});
 }
 throw Error('Operação de efeito indisponível.');
}
