import test from 'node:test';
import assert from 'node:assert/strict';
import {clonePlan,cloneTestEffect,kageReturn} from '../src/clone-rules.mjs';
import {cloneView} from '../src/clone-actions.mjs';
import {modifyTechnique,riskyHealing,efficientDegree} from '../src/technique-aptitudes.mjs';
import {aptitudeUsePlan,aptitudeUseAction} from '../src/aptitude-use.mjs';
import {maneuverPlan,splitDamage} from '../src/maneuvers.mjs';
import {weaponDocument,weaponUseView} from '../src/catalog.mjs';
import {WEAPONS,weaponAttack} from '../src/weapons.mjs';
import {evolutionStatus} from '../src/aptitudes.mjs';
import {validatePurchase} from '../src/item-validation.mjs';
import {mutateRuntime,claimUsage,activeAptitudes} from '../src/aptitude-runtime.mjs';
import {statPrecision,derivedSummary,restRecovery} from '../src/automation.mjs';
import {ID} from '../src/config.mjs';
import {esc,field,select,button,set} from '../src/ui.mjs';
const apt=(key,selection='',book='basico',level=1)=>({id:key+selection,type:'aptitude',system:{catalogKey:key,catalogBook:book,selection,level,acquisition:'Concedida',source:{page:'1'}}});
const s={campaign:{level:20,draft:false},attributes:{for:12,des:16,agi:8,per:8,int:12,vig:8,esp:12},automation:{enabled:true,attributeGranted:108,bases:{cc:3,cd:3,esq:3,lm:3}},skills:{arte:{points:8},mecanismos:{points:8}},combat:{cc:15,cd:19,esq:11,lm:11},movement:{distance:14},conditions:[],resources:{vitality:{value:80,max:134},chakra:{value:31,max:46}}};
const cloneArgs={knownLevel:2,version:1,count:2,type:'generic-resistente',vitality:80,maximumVitality:134,chakra:31,spirit:12};
const frame={power:'suiton',level:4,cost:4,damage:5,hardness:6,difficulty:18,range:20,width:4,length:8,height:3,area:true,action:'standard',duration:'instant',resistKind:'skill'};
test('Clone 2 changes every clone to automatic combat failure only above two active copies',()=>{
 const low=clonePlan(cloneArgs),high=clonePlan({...cloneArgs,version:2,count:6});assert.equal(low.automaticCombatFailure,false);assert.equal(low.limit,6);assert.equal(low.sourceChakra,29);assert.equal(high.automaticCombatFailure,true);assert.equal(high.limit,6);assert.equal(high.sourceChakra,25);
 assert.throws(()=>clonePlan({...cloneArgs,knownLevel:1,count:3}),/máximo 2/);assert.throws(()=>clonePlan({...cloneArgs,knownLevel:0}));assert.throws(()=>clonePlan({...cloneArgs,version:2,count:7}));
 assert.match(cloneView({clones:[]},apt('clone','generic-resistente','basico',2),{esc,field,select,button}),/Até 2 clones ativos: −3/);
});
test('clone limits include other materials and creation cannot follow dismissal in the same turn',()=>{
 assert.throws(()=>clonePlan({...cloneArgs,knownLevel:1,existing:[{type:'mizu-bunshin',version:1}]}),/máximo 2/);
 assert.throws(()=>clonePlan({...cloneArgs,version:2,count:1,existing:[{trueClone:true}]}),/verdadeiro/);
 assert.throws(()=>clonePlan({...cloneArgs,turn:'c1:2',dismissedTurn:'c1:2'}),/mesmo|turno/);
 assert.doesNotThrow(()=>clonePlan({...cloneArgs,turn:'c1:3',dismissedTurn:'c1:2'}));
});
test('Kage division conserves chakra including the remainder, and charges three vitality per clone',()=>{
 for(let chakra=0;chakra<=46;chakra++)for(let count=1;count<=6;count++){
  const p=clonePlan({...cloneArgs,type:'kage-bunshin',version:2,count,chakra});assert.equal(p.sourceChakra+p.cloneChakra*count,chakra);assert.ok(p.sourceChakra>=p.cloneChakra);assert.equal(p.sourceVitality,80-3*count);assert.equal(p.chakraCost,0);
 }
 assert.throws(()=>clonePlan({...cloneArgs,type:'kage-bunshin',count:1,existing:[{type:'mizu-bunshin'}]}),/Desfaça/);
 assert.throws(()=>clonePlan({...cloneArgs,type:'mizu-bunshin',count:1,existing:[{type:'kage-bunshin'}]}),/Desfaça/);
 assert.throws(()=>clonePlan({...cloneArgs,type:'kage-bunshin',vitality:2}),/Vitalidade insuficiente/);
 assert.equal(clonePlan({...cloneArgs,type:'iwa-bunshin'}).cloneVitality,27);
});
test('single-clone precision exceptions stop when more copies exist; level 2 combat failure overrides exceptions',()=>{
 const shooter={type:'generic-atirador',precisionPenalty:-3};assert.equal(cloneTestEffect(shooter,'cd').penalty,0);assert.equal(cloneTestEffect(shooter,'cc').penalty,-3);assert.equal(cloneTestEffect(shooter,'cd',{activeCount:2}).penalty,-3);
 assert.equal(cloneTestEffect({type:'mizu-bunshin'},'cc').penalty,0);assert.equal(cloneTestEffect({type:'mizu-bunshin'},'lm').penalty,-3);
 assert.equal(cloneTestEffect({...shooter,automaticCombatFailure:false},'cd',{activeCount:3}).automaticFailure,true);assert.equal(cloneTestEffect({...shooter,automaticCombatFailure:true},'prontidao').automaticFailure,false);
 assert.equal(cloneTestEffect({...shooter,dismissed:true},'cd').allowed,false);
 assert.deepEqual(kageReturn({type:'mizu-bunshin'},{chakra:10}),{chakra:0,fatigue:[]});assert.equal(kageReturn({type:'kage-bunshin'},{chakra:7,fatigue:[{key:'fatigado'},{key:'caido'}]}).fatigue.length,1);
});
test('Chute Duplo divides first and adds two damage only to the first hit',()=>{
 const w=WEAPONS.find(w=>w.key==='unarmed'),items=[apt('chute-duplo'),apt('chute-giratorio'),apt('ataque-multiplo')],attack={purchased:15,bonus:1,penalty:0,base:7,precision:16};
 const plan=maneuverPlan('chute-duplo',attack,w,s,items);assert.deepEqual(plan.attacks.map(a=>a.base),[6,3]);assert.deepEqual(plan.attacks.map(a=>a.bonus),[1,1]);assert.match(plan.notes.join(' '),/somente se o primeiro acertar/);
 assert.deepEqual(splitDamage(8,3),[3,3,2]);assert.throws(()=>splitDamage(8,4));
});
test('unarmed maneuvers open a working weapon panel and keep the chosen maneuver selected',()=>{
 const actor={system:s,items:[apt('chute-duplo')]};assert.equal(weaponDocument(actor,'unarmed').system.catalogKey,'unarmed');const html=weaponUseView({actor,itemId:'unarmed',maneuver:'chute-duplo'});assert.match(html,/value="chute-duplo" selected/);assert.match(html,/data-id="unarmed"/);
 assert.doesNotThrow(()=>weaponAttack(WEAPONS.find(w=>w.key==='unarmed'),s,[]));
});
test('Meta aptitudes charge movements separately and do not double area height',()=>{
 const items=[apt('potencializar'),apt('tecnica-poderosa'),apt('tecnica-elevada')];const area=modifyTechnique(frame,['potencializar'],s,items,{potencializar:'area'});assert.deepEqual([area.width,area.length,area.height],[8,16,3]);assert.equal(area.extraMovement,1);
 const both=modifyTechnique(frame,['potencializar','tecnica-poderosa'],s,items);assert.equal(both.extraMovement,2);assert.equal(both.damage,6);assert.equal(both.degreeBonus,.5);
 assert.throws(()=>modifyTechnique({...frame,cost:0},['potencializar'],s,items),/pelo menos 1/);assert.throws(()=>modifyTechnique({...frame,resistKind:'attribute'},['tecnica-elevada'],s,items),/perícia/);
});
test('chakra control keeps a minimum cost and water generation and spending are mutually exclusive',()=>{
 const items=[apt('tecnica-de-controle-de-chakra'),apt('dominio-da-agua')];const result=modifyTechnique({...frame,cost:2},['tecnica-de-controle-de-chakra'],s,items);assert.equal(result.cost,1);assert.equal(result.damage,4);assert.equal(result.difficulty,17);
 const generated=modifyTechnique(frame,['dominio-da-agua'],s,items);assert.equal(generated.waterCreated,4);assert.equal(generated.waterSpent,0);
 const spent=modifyTechnique(frame,['dominio-da-agua'],s,items,{waterBoost:true,waterPoints:6});assert.equal(spent.waterSpent,4);assert.equal(spent.waterCreated,0);assert.equal(spent.damage,6);
 const natural=modifyTechnique(frame,['dominio-da-agua'],s,items,{waterBoost:true,naturalWater:true});assert.equal(natural.waterSpent,0);assert.equal(natural.damage,6);
 assert.throws(()=>modifyTechnique(frame,['dominio-da-agua'],s,items,{waterBoost:true,waterPoints:3}),/insuficientes/);
});
test('accelerated techniques reject damage, defensive use, complete actions and musical illusions',()=>{
 const items=[apt('tecnica-acelerada'),apt('ilusao-musical')];for(const patch of [{damage:1},{damage:0,defensive:true},{damage:0,action:'full'},{damage:0,touchAttack:true}])assert.throws(()=>modifyTechnique({...frame,...patch},['tecnica-acelerada'],s,items));
 assert.equal(modifyTechnique({...frame,damage:0},['tecnica-acelerada'],s,items).action,'movement');assert.throws(()=>modifyTechnique({...frame,damage:0,illusion:true},['tecnica-acelerada','ilusao-musical'],s,items));
});
test('creation mastery restores exact published parameters instead of doubling an already rounded half',()=>{
 const result=modifyTechnique({...frame,damage:3,freeCreation:true,common:{damage:5,width:7}},['mestre-da-criacao'],s,[apt('mestre-da-criacao')]);assert.equal(result.damage,5);assert.equal(result.width,7);assert.throws(()=>modifyTechnique({...frame,freeCreation:true},['mestre-da-criacao'],s,[apt('mestre-da-criacao')]),/parâmetros comuns/);
 assert.equal(riskyHealing(5,2),-5);assert.equal(riskyHealing(5,8),3);assert.equal(riskyHealing(5,11),10);assert.equal(riskyHealing(5,14),15);assert.equal(riskyHealing(5,16),20);assert.equal(efficientDegree(14,2),3);
});
test('evolution cannot skip its requirements through initial item creation or direct level edits',()=>{
 const low={...s,attributes:{...s.attributes,esp:6}},item={...apt('clone','generic-resistente'),system:{...apt('clone','generic-resistente').system,level:2,acquisition:'Comprada'}};
 assert.equal(evolutionStatus({...item,system:{...item.system,level:1}},low).allowed,false);
 assert.match(validatePurchase({system:low,items:[]},item,{isGM:true}).join(' '),/evolução/);
 assert.doesNotMatch(validatePurchase({system:s,items:[]},item,{isGM:true}).join(' '),/evolução/);
});
test('active aptitude plans validate actual choices before charging resources',()=>{
 assert.equal(aptitudeUsePlan(apt('sensor','chakra'),s).cost,5);assert.equal(aptitudeUsePlan(apt('sensor','solo'),s).cost,3);
 assert.throws(()=>aptitudeUsePlan(apt('trabalho-duro'),s,[],{choice:'anything'}));assert.throws(()=>aptitudeUsePlan(apt('replica-enganadora'),s,[],{margin:3}));assert.throws(()=>aptitudeUsePlan(apt('kyoudo-kyouka'),s,[],{mode:'movement'}));
 const up=aptitudeUsePlan(apt('kyoudo-kyouka','','basico',2),s,[],{mode:'movement'});assert.equal(up.cost,6);assert.equal(up.active.base,12);
});
function actor({clone=null,conditions=[]}={}){
 const a={uuid:'Actor.'+Math.random(),type:clone?'creature':'character',isOwner:true,flags:{[ID]:{...(clone?{clone}:{})}},items:[],effects:[],system:structuredClone(s),getFlag(ns,k){return this.flags[ns]?.[k];},toObject(){return {system:structuredClone(this.system)};},async update(p){for(const[k,v]of Object.entries(p))set(this,k,structuredClone(v));return this;}};a.system.conditions=conditions;return a;
}
globalThis.game={user:{isGM:true},settings:{get:(_ns,k)=>k==='houseRules'?{}:0},time:{worldTime:0},actors:{contents:[]}};
globalThis.foundry={utils:{deepClone:structuredClone}};
test('clone penalty remains outside the normal cap and zero-reserve clones are not automatically exhausted',()=>{
 const a=actor({clone:{type:'iwa-bunshin',precisionPenalty:-3},conditions:[{id:'f',key:'exausto',level:1}]});a.system.resources.chakra={value:0,max:0};const check=statPrecision(a,'cc',{kind:'attack',manualContext:true});assert.equal(check.penalty,-6);assert.equal(check.uncappedPenalty,-3);assert.equal(check.precision,9);
 a.system.conditions=[];assert.ok(!derivedSummary(a).state.keys.includes('exausto'));a.system.resources.vitality.value=0;assert.ok(derivedSummary(a).state.keys.includes('fora-combate'));a.system.resources.vitality.value=80;
 a.flags[ID].clone.origin='Actor.origin';game.actors.contents=[a,actor({clone:{type:'mizu-bunshin',origin:'Actor.origin'}}),actor({clone:{type:'generic-atirador',origin:'Actor.origin'}})];assert.equal(statPrecision(a,'cc',{kind:'attack'}).allowed,false);game.actors.contents.pop();assert.equal(statPrecision(a,'cc',{kind:'attack'}).allowed,true);game.actors.contents=[];
});
test('natural chakra recovery remains blocked while the source maintains Kage Bunshins',()=>{
 const a=actor(),copy=actor({clone:{type:'kage-bunshin',origin:a.uuid}});game.actors.contents=[a,copy];const rest=restRecovery(a);assert.equal(rest.chakraGain,0);assert.ok(rest.vitalityGain>0);game.actors.contents=[];assert.ok(restRecovery(a).chakraGain>0);
});
test('actor-scoped usage counters serialize competing requests without sharing water reserves',async()=>{
 const a=actor(),b=actor();const ops=await Promise.allSettled([mutateRuntime(a,state=>{claimUsage(state,a,'dominio-simples','scene',1);state.water={value:4};}),mutateRuntime(a,state=>claimUsage(state,a,'dominio-simples','scene',1))]);assert.deepEqual(ops.map(r=>r.status),['fulfilled','rejected']);assert.equal(a.getFlag(ID,'aptitudes').water.value,4);assert.equal(b.getFlag(ID,'aptitudes'),undefined);
 await mutateRuntime(b,state=>{claimUsage(state,b,'dominio-simples','scene',1);});assert.equal(b.getFlag(ID,'aptitudes').uses['dominio-simples'].count,1);
});

test('adding the third clone affects earlier copies across materials; returning to two restores their tests',()=>{
 const earlier={type:'generic-resistente',version:1,automaticCombatFailure:false,precisionPenalty:-3};
 assert.equal(clonePlan({...cloneArgs,count:1,existing:[earlier,{type:'mizu-bunshin',version:1}]}).automaticCombatFailure,true);
 for(let n=1;n<=6;n++)for(const stat of ['cc','cd','esq','lm'])assert.equal(cloneTestEffect(earlier,stat,{activeCount:n}).automaticFailure,n>2);
 assert.equal(cloneTestEffect(earlier,'prontidao',{activeCount:6}).automaticFailure,false);
 assert.equal(cloneTestEffect({...earlier,automaticCombatFailure:true},'cc',{activeCount:2}).automaticFailure,false);
});
