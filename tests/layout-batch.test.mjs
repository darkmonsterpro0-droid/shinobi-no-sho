import test from 'node:test';
import assert from 'node:assert/strict';
import {actorView,itemView,panelView,isAutomatedAptitude} from '../src/ui.mjs';

const actor=()=>({id:'layout',name:'Shinobi',type:'character',system:{campaign:{level:6},automation:{enabled:true},attributes:{},combat:{},identity:{},resources:{},skills:{acrobacia:{points:1,notes:'Anotação anterior preservada'}},conditions:[],special:[]},items:[]});
const aptitude=(id,catalogKey)=>({id,name:id,type:'aptitude',system:{catalogKey,level:1,source:{book:'basico',page:'65'},description:'Texto <seguro>'}});

test('catalogue aptitudes are consulted without an editing action, while manual entries remain editable',()=>{
  const a=actor();a.items=[aptitude('automated','oportunista'),aptitude('manual','')];
  a.items[0].evolution={supported:true,level:1,max:2,allowed:true};
  const html=actorView(a,'techniques');
  const automated=html.match(/<article[^>]*>.*?data-id="automated".*?<\/article>/s)[0];
  assert.ok(automated.includes('data-sns="aptitude-use" data-id="automated"'));
  assert.ok(!automated.includes('data-sns="edit-item"'));
  assert.ok(automated.includes('data-sns="aptitude-evolve"'));
  assert.ok(automated.includes('data-sns="remove-item"'));
  assert.ok(html.includes('data-sns="edit-item" data-id="manual"'));
  assert.ok(isAutomatedAptitude(a.items[0]));
  assert.ok(!isAutomatedAptitude({...a.items[0],type:'equipment'}));
});

test('opening a catalogue aptitude sheet exposes read-only information and no editable fields',()=>{
  const entry=aptitude('automated','oportunista');
  const html=itemView(entry);
  assert.ok(!/<(?:input|textarea|select)\b/.test(html));
  assert.ok(html.includes('Texto &lt;seguro&gt;'));
  assert.ok(html.includes('data-sns="aptitude-use"'));
  assert.ok(itemView(aptitude('manual','')).includes('name="name"'));
  const library=panelView('library',{actor:actor(),items:[entry]});
  assert.ok(!library.includes('data-sns="edit-item" data-id="automated"'));
});

test('skill notes are removed from the table without mutating saved notes',()=>{
  const a=actor(),before=structuredClone(a);
  const html=actorView(a,'skills');
  assert.ok(!html.includes('<th>Notas</th>'));
  assert.ok(!html.includes('name="system.skills.acrobacia.notes"'));
  assert.ok(html.includes('name="system.skills.acrobacia.points"'));
  assert.ok(html.includes('data-sns="roll-skill"'));
  assert.deepEqual(a,before);
});

test('summary removes the evolution block and sources card but keeps rest accessible to players',()=>{
  const a=actor();
  for(const isGM of [false,true]){
    const html=actorView(a,'summary',{isGM});
    assert.ok(!html.includes('Criação e evolução'));
    assert.ok(!html.includes('Distribuir / subir NC'));
    assert.ok(!html.includes('Conceder EXP'));
    assert.ok(!html.includes('sns-profile-card'));
    assert.ok(html.slice(html.indexOf('<footer')).includes('data-sns="rest"'));
  }
});

test('explicit summary conditions have a direct toggle and automatic consequences do not',()=>{
  const a=actor();a.system.conditions=[{id:'grapple',key:'agarrado',name:'Agarrado'},{key:'impedido',name:'Impedido',automatic:true}];
  const html=actorView(a,'summary');
  assert.ok(html.includes('data-sns="toggle-condition" data-key="agarrado" data-id="grapple" aria-label="Desativar Agarrado"'));
  assert.ok(!html.includes('aria-label="Desativar Impedido"'));
  assert.ok(html.includes('Automática'));
});

test('social choices keep individual accessible labels and selected values with direct roll controls',()=>{
  const html=actorView(actor(),'social',{testChoices:{'ui.social.acalmar.attribute':'esp','ui.social.enganar.aspect':'yang'}});
  assert.ok(html.includes('aria-label="Atributo de Acalmar"'));
  assert.ok(html.includes('<option value="esp" selected>Espírito</option>'));
  assert.ok(html.includes('aria-label="Aspecto de Enganar"'));
  assert.ok(html.includes('<option value="yang" selected>Yang</option>'));
  assert.ok(html.includes('data-sns="roll-social" data-stat="empatia"'));
  assert.ok(!html.includes('Atributo · Acalmar'));
});
