import test from 'node:test';
import assert from 'node:assert/strict';
import {pointBudgets,validateBuildChange,simulatedTest,resolveOpposed,SOCIAL_TESTS} from '../src/build-rules.mjs';
import {weaponAttack,WEAPONS,damageDegree,rangePenalty} from '../src/weapons.mjs';
import {aptitudeBonuses,prerequisiteStatus} from '../src/aptitudes.mjs';
import {buildAction} from '../src/build-actions.mjs';
import {actorView} from '../src/ui.mjs';
import {defaultProfile} from '../src/config.mjs';
const s={campaign:{level:4},attributes:{for:4,des:3,agi:1,per:1,int:2,vig:1,esp:0},automation:{enabled:true,bases:{cc:3,cd:3,esq:3,lm:3}},skills:{},social:{yin:1,yang:1}};
const apt=(key,selection='',book='basico',acquisition='Comprada',level=1)=>({type:'aptitude',system:{catalogKey:key,catalogBook:book,selection,acquisition,level}});
test('power variants follow the complete NC table including its last exceptional award',()=>{
 for(let nc=4;nc<=20;nc++)for(const rate of [2,3,4]){const b=pointBudgets({...s,campaign:{level:nc}},[],{powerRate:rate});assert.equal(b.powers.total,(nc===20?20:nc-2)*rate);}
 assert.equal(pointBudgets(s,[],{powerRate:4}).powers.total,8);
 assert.equal(pointBudgets({...s,campaign:{level:20}},[],{powerRate:4}).powers.total,80);
});
test('skill and social counters validate invested points and report overspending without spending Voo points',()=>{
 assert.equal(pointBudgets(s).skills.total,8);assert.equal(pointBudgets(s).skills.limit,2);
 assert.deepEqual(validateBuildChange(s,{skills:{acrobacia:{points:2}}}),[]);
 assert.match(validateBuildChange(s,{skills:{acrobacia:{points:3}}}).join(' '),/0 a 2/);
 assert.match(validateBuildChange(s,{skills:{voo:{points:1}}}).join(' '),/Voo/);
 assert.deepEqual(validateBuildChange(s,{skills:{acrobacia:{points:null}}}),[]);
 assert.match(validateBuildChange(s,{social:{yin:2,yang:2}}).join(' '),/excedente/);
 const legacy={...s,skills:Object.fromEntries(['acrobacia','arte','atletismo','ciencia','cultura','disfarce'].map(k=>[k,{points:2}]))};
 assert.deepEqual(validateBuildChange(legacy,{skills:{acrobacia:{points:1}}}),[]);
});
test('a free first aptitude level does not grant free evolution and banned aptitudes refund actual expenditure',()=>{
 assert.equal(pointBudgets(s,[apt('reflexos','','basico','Gratuita',2)]).powers.spent,2);
 assert.equal(pointBudgets(s,[apt('reflexos')],{banCombatAptitudes:true}).powers.spent,0);
});
test('simulated dice are fixed totals and enforce their separate eligibility rules',()=>{
 assert.equal(simulatedTest('half',6,{difficulty:10}).total,10);
 assert.throws(()=>simulatedTest('half',5,{difficulty:10}));
 assert.equal(simulatedTest('one',6,{noPressure:true}).total,14);
 assert.equal(simulatedTest('two',6,{noRisk:true,unlimitedTime:true}).total,22);
 assert.throws(()=>simulatedTest('one',6,{inCombat:true,noPressure:true}));
 assert.throws(()=>simulatedTest('two',6,{noRisk:true}));
});
test('two automatic failures and two natural critical successes reroll both opposed tests',()=>{
 assert.equal(resolveOpposed({natural:2,total:10},{natural:3,total:80}),'repeat');
 assert.equal(resolveOpposed({natural:15,total:50},{natural:16,total:20}),'repeat');
 assert.equal(resolveOpposed({natural:14,total:50},{natural:15,total:20}),'second');
});
test('optional conquest XP reaches 100 once, resets and grants the full next attribute budget',async()=>{
 const previous=globalThis.game;let update,options;
 try{globalThis.game={user:{isGM:true},settings:{get:()=>({advancement:'level',optionalXP:true})}};
 const actor={isOwner:true,system:{...s,campaign:{level:4,draft:false,experience:96},automation:{...s.automation,attributeGranted:12}},update:async(p,o)=>{update=p;options=o;}};
 await buildAction({render:async()=>{}},'grant-earned-xp',{}, {querySelectorAll:()=>[{name:'ui.earnedXP',type:'number',value:'4'}]}, {actor});
 assert.equal(update['system.campaign.level'],5);assert.equal(update['system.campaign.experience'],0);assert.equal(update['system.automation.attributeGranted'],18);assert.equal(options.snsOpenAllocation,true);
 globalThis.game.user.isGM=false;await assert.rejects(()=>buildAction({},'grant-earned-xp',{},null,{actor}),/mestre/);
 }finally{globalThis.game=previous;}
});
test('social action uses the visible attribute choice and rolls exactly once without a registration window',async()=>{
 const previous={game:globalThis.game,foundry:globalThis.foundry,ChatMessage:globalThis.ChatMessage};
 let formula,count=0,result;
 try{
 globalThis.game={user:{isGM:false}};globalThis.ChatMessage={getSpeaker:()=>({})};
 globalThis.foundry={dice:{Roll:class{constructor(f){formula=f;}async evaluate(){count++;this.total=15;return this;}async toMessage(m){result=m;}}}};
 const root={querySelectorAll:()=>[{name:'ui.social.acalmar.attribute',value:'esp'},{name:'ui.social.acalmar.aspect',value:'yin'}]};
 await buildAction({},'roll-social',{stat:'acalmar'},root,{actor:{isOwner:true,system:{...s,attributes:{...s.attributes,int:2,esp:7}}}});
 assert.equal(count,1);assert.equal(formula,'2d8 + (5)');assert.match(result.flavor,/Espírito/);
 }finally{Object.assign(globalThis,previous);}
 assert.deepEqual(SOCIAL_TESTS.boatos[2],['per']);
});
test('sheet omits removed tabs, shows budgets and puts social choices beside direct roll buttons',()=>{
 const a={type:'character',system:s,items:[]},p=defaultProfile();
 const html=actorView(a,'social',{isGM:false,profile:p});assert.match(html,/ui.social.acalmar.attribute/);assert.match(html,/data-sns="roll-social"/);assert.doesNotMatch(html,/data-tab="combat"|data-tab="advancement"|system.social.notes/);
 assert.match(actorView(a,'techniques',{profile:p}),/Poderes e Aptidões/);
 assert.doesNotMatch(actorView(a,'summary',{profile:p,isGM:false}),/data-sns="allocation"|data-sns="xp"|Favoritos rápidos|Recuperação e chakra/);
});
test('aptitude passive bonuses remain derived, with Perito never stacking for the same skill',()=>{
 const b=aptitudeBonuses(s,[apt('perito','acrobacia'),apt('perito','acrobacia'),apt('reflexos'),apt('metabolismo-rapido')]);assert.equal(b.skills.acrobacia,2);assert.equal(b.esq,1);assert.equal(b.restMultiplier,2);
 assert.equal(aptitudeBonuses(s,[apt('reflexos')],{banCombatAptitudes:true}).esq,0);
 assert.equal(prerequisiteStatus({key:'acuidade',requirements:'Destreza 3.'},s).allowed,true);
});
test('simple thrown volleys consume 3 or 6 and add only the published weapon bonus',()=>{
 const w=WEAPONS.find(w=>w.key==='kunai'&&w.book==='basico');
 assert.equal(weaponAttack(w,s,[],{},{mode:'ranged',units:3}).base,3);
 assert.equal(weaponAttack(w,s,[],{},{mode:'ranged',units:6}).base,4);
 assert.equal(weaponAttack(w,s,[],{},{mode:'melee'}).base,3);
 assert.throws(()=>weaponAttack(w,s,[],{},{mode:'ranged',units:4}));
 assert.equal(damageDegree(3),0);assert.equal(damageDegree(14,14),4);assert.equal(rangePenalty(45,15),-3);assert.throws(()=>rangePenalty(61,15));
});
