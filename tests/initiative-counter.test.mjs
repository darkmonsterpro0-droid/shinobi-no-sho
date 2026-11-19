import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCombatClass,delayBounds,delayInitiative,initiativeOrder,resumeInitiative,waitingCombatant} from '../src/combat-initiative.mjs';
import {canCoordinateNinpou,isDamagingNinpou,techniqueCounterOutcome} from '../src/power-rules.mjs';
import {ID} from '../src/config.mjs';

const combatant=(id,initiative,agi=3)=>({id,initiative,actor:{uuid:id,system:{attributes:{agi}},getRollData:()=>({sns:{initiative:agi}})}});
const native=(a,b)=>b.initiative-a.initiative||a.id.localeCompare(b.id);

function encounter(){
 class Base{
  round=1;turn=0;started=true;settings={skipDefeated:false};flags={};
  combatants=[combatant('A',18),combatant('B',14),combatant('C',9)];
  constructor(){for(const c of this.combatants)c.parent=this;this.turns=[...this.combatants];}
  get combatant(){return this.turns[this.turn];}
  getFlag(_id,key){return this.flags[key];}
  _sortCombatants(a,b){return native(a,b);}
  getTimeDelta(){return 0;}
  async _preUpdate(){}
  _onUpdate(){}
  async setFlag(id,key,value){await this.update({['flags.'+id+'.'+key]:value},{});}
  async update(changed,options){
   await this._preUpdate(changed,options);
   const entries=changed['flags.'+ID+'.initiativeDelay'];
   if(entries){this.flags.initiativeDelay=entries;changed.flags={[ID]:{initiativeDelay:entries}};}
   this.round=changed.round??this.round;this.turn=changed.turn??this.turn;
   this._onUpdate(changed,options);
  }
 }
 const Combat=createCombatClass(Base);
 return new Combat();
}

test('Atrasar only changes the current round, respecting the lower bound',async()=>{
 const combat=encounter(),[a,b,c]=combat.combatants;
 assert.deepEqual(delayBounds(combat,a),{min:-13,max:17});
 await assert.rejects(delayInitiative(combat,a,-14),/limite/);
 await delayInitiative(combat,a,10);
 assert.deepEqual(combat.turns,[b,a,c]);
 assert.equal(combat.combatant,b);
 assert.equal(a.initiative,18);
 await combat.update({round:2,turn:0},{direction:1});
 assert.deepEqual(combat.turns,[a,b,c]);
 assert.equal(combat.combatant,a);
});

test('a waiting combatant can schedule a turn after the current initiative',async()=>{
 const combat=encounter(),[a,b,c]=combat.combatants;
 await delayInitiative(combat,a,-13,{waiting:true});
 assert.deepEqual(combat.turns,[b,c,a]);
 assert.equal(waitingCombatant(combat,a.actor),a);
 await resumeInitiative(combat,a);
 assert.deepEqual(combat.turns,[b,a,c]);
 assert.equal(combat.combatant,b);
 assert.equal(waitingCombatant(combat,a.actor),null);
});

test('delayed ties put higher original initiative, then higher Agility, later',()=>{
 const a=combatant('A',18),b=combatant('B',14),c=combatant('C',14,6);
 const delays={A:{value:8},B:{value:8},C:{value:8}};
 assert.deepEqual([a,c,b].sort((x,y)=>initiativeOrder(x,y,delays,native)),[b,c,a]);
});

test('Superar uses adjusted base damage and requires matching reach types',()=>{
 const attack={family:'katon',stat:'cd',damage:8,targets:1};
 const counter={family:'suiton',stat:'cd',damage:7};
 assert.deepEqual(techniqueCounterOutcome(attack,counter),{hit:false,cancelledTechnique:true,counterExcess:3});
 assert.equal(techniqueCounterOutcome(attack,{...counter,stat:'cc'}).counterExcess,0);
 assert.equal(techniqueCounterOutcome({...attack,family:'doton'},counter).counterExcess,0);
 assert.equal(isDamagingNinpou({...attack,area:'cone'}),true);
 assert.equal(canCoordinateNinpou(attack),true);
 assert.equal(canCoordinateNinpou({...attack,area:'cone'}),false);
 assert.equal(canCoordinateNinpou({...attack,resistances:[{appliesEvenMiss:true}]}),false);
});
