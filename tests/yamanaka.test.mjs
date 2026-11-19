import test from 'node:test';
import assert from 'node:assert/strict';
import {mindTestOrigin,mentalControlParameters,mindTargetPolicy,controlNatureResult} from '../src/yamanaka.mjs';
import {SKILLS} from '../src/config.mjs';

test('possession borrows mental and physical precisions according to the published list',()=>{
 for(const stat of ['cc','cd','esq','lm','for','des','vig','esp','agi','per','procurar','prontidao','rastrear'])
  assert.equal(mindTestOrigin(stat),'body',stat);
 for(const stat of ['int','lidar','disfarce'])assert.equal(mindTestOrigin(stat),'mind',stat);
 for(const [stat,[,attribute]]of Object.entries(SKILLS))
  assert.equal(mindTestOrigin(stat),attribute==='int'||['lidar','disfarce'].includes(stat)?'mind':'body',stat);
 for(const stat of ['int','esp','per'])assert.equal(mindTestOrigin(stat,{social:true}),'mind');
 assert.equal(mindTestOrigin('int',{mode:'disorder'}),'body');
 assert.equal(mindTestOrigin('lidar',{mode:'multiple'}),'mind');
 assert.throws(()=>mindTestOrigin('int',{mode:'unknown'}),/inválido/);
});

test('control modes preserve distinct costs, targets, durations and reflection rules',()=>{
 const first=mentalControlParameters('troca-mente',1,9);
 assert.equal(first.difficulty,15);assert.equal(first.evasionDifficulty,12);assert.equal(first.range,14);
 assert.equal(first.cost,1);assert.equal(first.targets,1);assert.equal(first.durationSeconds,86400);assert.equal(first.maximumDistance,1400);
 assert.equal(first.sourceHelpless,true);assert.equal(first.reflectedDamage,true);
 const multiple=mentalControlParameters('multipla-troca',8,9);
 assert.equal(multiple.cost,4);assert.equal(multiple.targets,2);assert.equal(multiple.range,10);
 assert.equal(multiple.durationSeconds,4800);assert.equal(multiple.maximumDistance,1000);
 assert.throws(()=>mentalControlParameters('multipla-troca',4,9),/não disponível/);
 for(const level of [6,7,8,10]){
  const disorder=mentalControlParameters('desordem-mental',level,9);
  assert.equal(disorder.targets,level<8?1:3);assert.equal(disorder.range,28);
  assert.equal(disorder.duration,'concentration');assert.equal(disorder.cost,level);
  assert.equal(disorder.reflectedDamage,false);assert.equal(disorder.sourceHelpless,false);
 }
 assert.throws(()=>mentalControlParameters('desordem-mental',5,9),/não disponível/);
});

test('a fascinated or merely flat-footed target still evades transfer; surprise must be explicit',()=>{
 assert.equal(mindTargetPolicy('transfer',{conditions:['fascinado']}).evasion,true);
 assert.equal(mindTargetPolicy('transfer',{conditions:['desprevenido']}).evasion,true);
 assert.equal(mindTargetPolicy('transfer',{conditions:['desprevenido'],surpriseAttack:true}).evasion,false);
 for(const key of ['impedido','agarrado','atordoado','indefeso'])assert.equal(mindTargetPolicy('transfer',{conditions:[key]}).evasion,false);
 assert.throws(()=>mindTargetPolicy('transfer',{clone:true}),/clones/);
 assert.throws(()=>mindTargetPolicy('transfer',{living:false,bodyKind:'corpse'}),/viva/);
 assert.equal(mindTargetPolicy('transfer',{bodyKind:'animal',irrational:true}).intelligenceResistance,false);
 assert.equal(mindTargetPolicy('transfer',{bodyKind:'animal'}).intelligenceResistance,true);
 assert.equal(mindTargetPolicy('transfer',{capanga:true}).intelligenceResistance,false);
 for(const bodyKind of ['corpse','inanimate'])assert.equal(mindTargetPolicy('multiple',{bodyKind}).evasion,false);
 assert.equal(mindTargetPolicy('multiple',{bodyKind:'animal',irrational:true}).evasion,true);
 assert.equal(mindTargetPolicy('multiple',{bodyKind:'animal',irrational:true}).intelligenceResistance,false);
 assert.equal(mindTargetPolicy('multiple',{bodyKind:'animal'}).intelligenceResistance,true);
 assert.equal(mindTargetPolicy('multiple',{bodyKind:'animal',sizeIndex:4}).evasion,true);
 assert.throws(()=>mindTargetPolicy('multiple',{bodyKind:'human'}),/Múltipla/);
 assert.throws(()=>mindTargetPolicy('multiple',{bodyKind:'animal',sizeIndex:5}),/Médio/);
});

test('nature resistance successes accumulate without requiring consecutive wins and suicide cancels before acting',()=>{
 let count=0;
 for(const resisted of [true,false,true,false,true])count=controlNatureResult(count,{resisted}).successes;
 assert.equal(count,3);assert.equal(controlNatureResult(2,{resisted:true}).cancel,true);
 assert.deepEqual(controlNatureResult(0,{suicidal:true}),{successes:0,cancel:true,beforeAction:true,stun:false});
 assert.equal(controlNatureResult(0,{resisted:true}).stun,true);
});

test('table decisions end reflected internal conditions with the link and disorder on its first nature stun',()=>{
 assert.equal(mentalControlParameters('troca-mente',8,12).reflectedConditionsEndWithConnection,true);
 assert.equal(mentalControlParameters('multipla-troca',8,12).reflectedConditionsEndWithConnection,true);
 assert.equal(controlNatureResult(0,{mode:'disorder',resisted:true}).cancel,true);
 assert.equal(controlNatureResult(0,{mode:'transfer',resisted:true}).cancel,false);
 assert.equal(controlNatureResult(0,{mode:'multiple',resisted:true}).cancel,false);
 assert.equal(controlNatureResult(1,{mode:'disorder',resisted:false}).cancel,false);
});
