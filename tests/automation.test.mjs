import test from 'node:test';import assert from 'node:assert/strict';
import {progression,validateAllocation,levelGrant,basicSummary,creationSystem} from '../src/progression.mjs';
import {CONDITIONS,resolveConditions,conditionContext,conditionTurn,lethalDamage} from '../src/conditions.mjs';
const attrs={for:3,des:2,agi:3,per:1,int:0,vig:2,esp:1};
const sys={campaign:{level:4},attributes:attrs,automation:{enabled:true,attributeGranted:12,bases:{cc:3,cd:3,esq:3,lm:3}}};
test('BAS 31: all NC budgets and minimums, including NC20 power exception',()=>{
  const mins=[0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8];
  for(let nc=4;nc<=20;nc++){const p=progression(nc);assert.equal(p.attributes,[12,18,24,30,36,42,48,54,60,66,72,78,84,90,96,102,108][nc-4]);assert.equal(p.min,mins[nc-4]);assert.equal(p.skills,4*nc-8);assert.equal(p.powers,nc===20?40:2*nc-4);}
  assert.throws(()=>progression(3));assert.throws(()=>progression(21));assert.throws(()=>progression(4.5));
});
test('creation spends all points with bounds; leveling preserves choices and prioritizes minimums',()=>{
  assert.ok(validateAllocation({nc:4,attributes:attrs,creation:true}).valid);
  assert.ok(!validateAllocation({nc:4,attributes:{...attrs,for:4},creation:true}).valid);
  assert.ok(!validateAllocation({nc:4,attributes:{...attrs,for:2},creation:true}).valid);
  assert.ok(!validateAllocation({nc:4,attributes:{...attrs,int:-1,for:4},creation:true}).valid);
  assert.ok(!validateAllocation({nc:4,attributes:{...attrs,int:.5,esp:.5},creation:true}).valid);
  assert.ok(!validateAllocation({nc:5,attributes:{...attrs,for:4},previous:attrs,granted:18}).valid);
  assert.ok(validateAllocation({nc:5,attributes:{...attrs,int:1,for:4},previous:attrs,granted:18}).valid);
  assert.ok(!validateAllocation({nc:5,attributes:{...attrs,for:2,int:1},previous:attrs,granted:18}).valid);
});
test('combat bases transfer at most two points rather than merely summing twelve',()=>{
  assert.ok(validateAllocation({nc:4,attributes:attrs,bases:{cc:5,cd:3,esq:2,lm:2}}).valid);
  assert.ok(!validateAllocation({nc:4,attributes:attrs,bases:{cc:5,cd:5,esq:1,lm:1}}).valid);
});
test('house rules separate full level grants from fractional XP and NC limits',()=>{
  assert.equal(levelGrant(sys,5,'level'),18);assert.equal(levelGrant(sys,7,'level'),30);assert.equal(levelGrant(sys,5,'xp'),12);
  assert.equal(levelGrant({...sys,automation:{...sys.automation,attributeGranted:12.4}},5,'xp'),12.4);
  assert.throws(()=>levelGrant({...sys,campaign:{level:6}},5,'level'));
});
test('common summary uses actual full attributes and rounds movement upward',()=>{
  const s=basicSummary(sys);assert.deepEqual(s.combat,{cc:6,cd:5,esq:6,lm:4});assert.equal(s.vitality,36);assert.equal(s.chakra,13);assert.equal(s.movement,12);assert.equal(s.attributeSpent,12);
  const created=creationSystem(sys);assert.equal(created.resources.vitality.value,36);assert.equal(created.resources.chakra.value,13);assert.equal(created.automation.enabled,true);
});
test('every listed condition and resource state has explicit source and identifier',()=>{
  assert.equal(Object.keys(CONDITIONS).length,30);for(const c of Object.values(CONDITIONS)){assert.ok(c.name&&c.description&&c.source&&c.icon);}
});
test('fatigue escalates without deleting source records or stacking inherited penalties',()=>{
  const f=[{id:'a',key:'fatigado'},{id:'b',key:'fatigado'}];assert.ok(resolveConditions(f).keys.includes('exausto'));assert.ok(!resolveConditions(f).keys.includes('inconsciente'));
  assert.ok(resolveConditions([...f,{id:'c',key:'fatigado'}]).keys.includes('inconsciente'));
  assert.ok(resolveConditions([{key:'exausto'},{key:'fatigado'}]).keys.includes('inconsciente'));
  assert.equal(conditionContext(f,{kind:'attack'}).penalty,-3);assert.equal(f.length,2);
});
test('resource thresholds, stable state, chakra exhaustion and forced draining remain distinct',()=>{
  for(const [v,key]of [[0,'fora-combate'],[-1,'inconsciente'],[-10,'inconsciente'],[-11,'morrendo'],[-20,'morrendo'],[-21,'morto']])assert.ok(resolveConditions([],{vitality:v}).keys.includes(key));
  assert.ok(!resolveConditions([{key:'estavel'}],{vitality:-15}).keys.includes('morrendo'));
  assert.ok(resolveConditions([],{chakra:0,chakraMax:40}).keys.includes('exausto'));
  assert.ok(!resolveConditions([],{chakra:-20,chakraMax:40}).keys.includes('morto'));
  assert.ok(resolveConditions([],{chakra:-20,chakraMax:40,forcedDrain:true}).keys.includes('morto'));
  assert.ok(!resolveConditions([],{chakra:-19,chakraMax:40,forcedDrain:true}).keys.includes('morto'));
  assert.ok(resolveConditions([{key:'sufocamento'}],{vitality:0}).keys.includes('inconsciente'));
});
test('penalty cap, resisting own source and scoped penalties do not change purchased stats',()=>{
  const records=[{id:'a',key:'debilitado',scope:'for',level:2},{id:'b',key:'fatigado'},{id:'c',key:'fintado'}];
  assert.equal(conditionContext(records,{kind:'attribute',stat:'for'}).penalty,-2);
  assert.equal(conditionContext(records,{kind:'attribute',stat:'des'}).penalty,0);
  assert.equal(conditionContext(records,{kind:'attribute',stat:'for',resistingId:'a'}).penalty,0);
  assert.equal(conditionContext(records,{kind:'defense',stat:'lm'}).penalty,-3);assert.equal(attrs.for,3);
});
test('prone, flanked, visual and auditory effects require the corresponding context',()=>{
  assert.equal(conditionContext([{key:'caido'}],{kind:'defense',stat:'lm',attackType:'ranged'}).bonus,3);
  assert.equal(conditionContext([{key:'caido'}],{kind:'defense',stat:'lm',attackType:'area'}).penalty,-3);
  assert.equal(conditionContext([{key:'flanqueado'}],{kind:'defense',stat:'lm'}).penalty,0);
  assert.equal(conditionContext([{key:'flanqueado'}],{kind:'defense',stat:'lm',flankingAttacker:true}).penalty,-1);
  assert.equal(conditionContext([{key:'ofuscado'}],{kind:'skill',stat:'medicina',vision:false}).penalty,0);
  assert.equal(conditionContext([{key:'cego'}],{kind:'skill',stat:'procurar'}).allowed,false);
  assert.equal(conditionContext([{key:'surdo'}],{kind:'skill',stat:'prontidao',auditoryOnly:true}).allowed,false);
});
test('stunned permits reactions; unconscious does not; impeded area defense is fixed nine',()=>{
  assert.equal(conditionContext([{key:'atordoado'}],{kind:'defense',stat:'esq',reaction:true}).allowed,true);
  assert.equal(conditionContext([{key:'atordoado'}],{kind:'attack'}).allowed,false);
  assert.equal(conditionContext([{key:'inconsciente'}],{kind:'defense',stat:'esq',reaction:true}).allowed,false);
  assert.equal(conditionContext([{key:'impedido'}],{kind:'defense',stat:'esq',attackType:'area',reaction:true}).allowed,false);
  assert.equal(conditionContext([{key:'indefeso',id:'a'}],{kind:'attribute',stat:'vig',resistingId:'a'}).allowed,true);
});
test('bleeding ticks per stack, suffocation ramps, and durations count target phases',()=>{
  const r=conditionTurn([{id:'a',key:'sangrando',level:3,remaining:2,timing:'Início do turno'},{id:'b',key:'sufocamento',difficulty:12,elapsed:2}], 'start',7);
  assert.equal(r.damage,6);assert.equal(r.prompts[0].difficulty,14);assert.equal(r.prompts[0].damage,7);assert.ok(r.updates.some(u=>u.id==='a'&&u.remaining===1));
  assert.deepEqual(conditionTurn([{id:'x',key:'lento',remaining:1,timing:'Fim do turno'}],'start').expired,[]);
  assert.deepEqual(conditionTurn([{id:'x',key:'lento',remaining:1,timing:'Fim do turno'}],'end').expired,['x']);
  assert.equal(lethalDamage(3,10),0);assert.equal(lethalDamage(0,2),-2);assert.equal(lethalDamage(-19,2),-21);
});

test('dying permits its explicit Vigor stabilization reaction, while unrelated unconscious tests stay blocked',()=>{
 assert.equal(conditionContext([],{kind:'attribute',stat:'vig',reaction:true,stabilizing:true,resistingId:'auto-sangrando'},{vitality:-15}).allowed,true);
 assert.equal(conditionContext([],{kind:'attribute',stat:'vig',reaction:true,resistingId:'unrelated'},{vitality:-15}).allowed,false);
 assert.ok(!resolveConditions([{key:'estavel'}],{vitality:1}).keys.includes('inconsciente'));
});
test('unseen targets must be located; Sensor and a sufficient area bypass camouflage only',()=>{
 const c=[{key:'cego'}];assert.equal(conditionContext(c,{kind:'attack'}).allowed,false);
 assert.equal(conditionContext(c,{kind:'attack',targetLocated:true}).camouflage,50);
 assert.equal(conditionContext(c,{kind:'attack',sensor:true}).camouflage,0);
 assert.equal(conditionContext(c,{kind:'attack',areaCoversCamouflage:true}).allowed,false);
 assert.equal(conditionContext(c,{kind:'attack',targetLocated:true,areaCoversCamouflage:true}).camouflage,0);
});

test('unconscious suffocation continues dealing source damage without an impossible Vigor roll',()=>{
 const r=conditionTurn([{key:'sufocamento',id:'s',damage:5,difficulty:16},{key:'inconsciente',automatic:true}],'start',4);assert.equal(r.damage,5);assert.equal(r.prompts.length,0);
 const scene=conditionTurn([{key:'lento',id:'c',remaining:1,timing:'Cena'}]);assert.deepEqual(scene.expired,[]);
 assert.ok(resolveConditions([{key:'exausto'}],{chakra:0}).keys.includes('inconsciente'));
});
