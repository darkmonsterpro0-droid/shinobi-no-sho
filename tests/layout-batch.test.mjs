import test from 'node:test';
import assert from 'node:assert/strict';
import {actorView,itemView,panelView,isAutomatedAptitude} from '../src/ui.mjs';

const actor=()=>({id:'layout',name:'Shinobi',type:'character',system:{campaign:{level:6},automation:{enabled:true},attributes:{},combat:{},identity:{},resources:{},skills:{acrobacia:{points:1,notes:'Anotação anterior preservada'}},conditions:[],special:[]},items:[]});
const aptitude=(id,catalogKey)=>({id,name:id,type:'aptitude',system:{catalogKey,level:1,source:{book:'basico',page:'65'},description:'Texto <seguro>'}});

test('catalogue aptitudes are consulted without an editing action, while manual entries remain editable',()=>{
  const a=actor();a.items=[aptitude('automated','oportunista'),aptitude('manual','')];
  a.items[0].evolution={supported:true,level:1,max:2,allowed:true};
  const html=actorView(a,'aptitudes');
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
    assert.ok(html.includes('data-sns="rest"'));assert.ok(!html.slice(html.lastIndexOf('<footer')).includes('data-sns="rest"'));
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
  assert.ok(html.includes('½ atributo · Acalmar'));
  assert.ok(html.includes('<option value="esp" selected>Espírito</option>'));
  assert.ok(html.includes('Aspecto de Enganar'));
  assert.ok(html.includes('<option value="yang" selected>Yang</option>'));
  assert.ok(html.includes('data-sns="roll-social" data-stat="empatia"'));
  assert.deepEqual([...html.matchAll(/data-aspect="([^"]+)"/g)].map(m=>m[1]),['yin','yang','either']);
  assert.equal((html.match(/data-sns="roll-social"/g)??[]).length,11);
  assert.doesNotMatch(html,/ui\.social\.empatia\.attribute|ui\.social\.boatos\.attribute/);
  assert.match(html,/Yin · Ouvir/);
  assert.match(html,/Yang · Espalhar/);
});

test('criação exibe distribuição e saldo de atributos dentro da ficha',()=>{
 const a=actor();
 a.system.campaign={level:4,draft:true};
 const allocation={nc:4,granted:12,attributes:{for:2,des:1,agi:3,per:4},bases:{cc:4,cd:2,esq:3,lm:3}};
 const html=actorView(a,'summary',{allocation});
 assert.match(html,/name="allocation\.attributes\.for"/);
 assert.match(html,/data-allocation-remaining>2/);
 assert.match(html,/data-combat-total="cc"[^>]*>6<\/output>/);
 assert.match(html,/data-combat-total="cd"[^>]*>3<\/output>/);
 assert.match(html,/data-combat-total="esq"[^>]*>6<\/output>/);
 assert.match(html,/data-combat-total="lm"[^>]*>7<\/output>/);
 assert.match(html,/name="allocation\.bases\.cc"/);
 assert.doesNotMatch(html,/name="system\.combat\./);
 assert.match(html,/Concluir distribuição/);
 assert.doesNotMatch(html,/wizard-step/);
});

test('book aptitude summaries are available in owned rows and the acquisition catalog',async()=>{
 const {aptitudeReference}=await import('../src/aptitude-reference.mjs');
 const {APTITUDES}=await import('../src/aptitude-data.mjs');
 for(const entry of APTITUDES)assert.notEqual(aptitudeReference(entry.key,entry.book).brief,'Consulte o efeito na fonte indicada.',entry.key);
 const a=actor();
 a.items=[{id:'acu',type:'aptitude',name:'Acuidade',system:{catalogKey:'acuidade',catalogBook:'basico',level:1}}];
 const sheet=actorView(a,'aptitudes');
 assert.match(sheet,/data-tooltip-text="Permite Destreza/);
 assert.doesNotMatch(sheet,/data-sns="edit-item"[^>]*data-id="acu"/);
 const catalog=panelView('catalog',{actor:a,catalog:'aptitudes'});
 assert.match(catalog,/class="sns-aptitude-brief">Permite Destreza/);
 assert.match(catalog,/<summary>Detalhes da regra<\/summary>/);
 assert.match(catalog,/Livro Básico 4.1b · p. 61/);
});

test('power choices hide earlier learning picks and keep purchased effects immutable',()=>{
 const a=actor();
 const draft=panelView('power-editor',{actor:a,family:'ninpou',values:{'power.level':2,'power.choice.0':'canhao:1','power.choice.1':'canhao:1'}});
 const second=draft.match(/name="power\.choice\.1">([\s\S]*?)<\/select>/)[1];
 assert.doesNotMatch(second,/canhao:1/);
 assert.match(second,/orbe:2/);
 assert.match(second,/value="" selected/);
 a.items=[{id:'nin',name:'Ninpou',type:'power',system:{level:1,powerData:{family:'ninpou',choices:[{effect:'canhao',tier:1}]}}}];
 const evolution=panelView('power-editor',{actor:a,itemId:'nin',values:{'power.level':3,'power.choice.0':'orbe:2'}});
 assert.match(evolution,/type="hidden" name="power\.choice\.0" value="canhao:1"/);
 assert.doesNotMatch(evolution,/<select name="power\.choice\.0"/);
});

test('inventory presents equipped gear and stored supplies separately and keeps the basic attack singular',()=>{
 const a=actor();
 const gear=(id,name,key,equipped,quantity)=>({id,name,type:'equipment',system:{catalogKey:key,catalogBook:'basico',equipped,quantity}});
 a.items=[gear('old','Ataque Desarmado','unarmed',true,1),gear('knife','Kunai','kunai',true,3),gear('tag','Tarja explosiva','explosive-tag',false,2)];
 const html=actorView(a,'equipment');
 assert.match(html,/<h3>À mão<\/h3>[\s\S]*Kunai[\s\S]*<h3>Sem recipiente<\/h3>[\s\S]*Tarja explosiva/);
 assert.equal((html.match(/Ataque desarmado/g)??[]).length,1);
 assert.match(html,/data-sns="weapon-use" data-id="unarmed"/);
 assert.doesNotMatch(html,/Contagem de pílulas · mestre/);
 assert.match(actorView(a,'equipment',{isGM:true}),/Contagem de pílulas · mestre/);
});

test('power families list learned effects and open the matching use configuration',()=>{
 const a=actor();
 a.items=[{id:'doton',type:'power',name:'Doton',system:{level:3,powerData:{family:'doton',choices:[{effect:'barreira',tier:3}]}}}];
 const html=actorView(a,'techniques');
 assert.match(html,/<details class="sns-power-effects">/);
 assert.match(html,/data-id="doton" data-effect="barreira" data-tier="3"/);
 assert.doesNotMatch(html,/data-effect="canhao"/);
 const skills=actorView(a,'skills');
 assert.match(skills,/<output class="sns-skill-precision"/);
 assert.doesNotMatch(skills,/name="system\.skills\.acrobacia\.value"/);
});

test('ordinary weapon declarations omit multiple attack settings until the maneuver is selected',()=>{
 const a=actor();
 a.items=[aptitude('multiple','ataque-multiplo')];
 const plain=panelView('weapon-use',{actor:a,itemId:'unarmed'});
 assert.doesNotMatch(plain,/name="weapon\.(?:count|distance)"/);
 assert.doesNotMatch(plain,/<select name="weapon\.mode"/);
 const multi=panelView('weapon-use',{actor:a,itemId:'unarmed',values:{'weapon.maneuver':'ataque-multiplo','weapon.count':3}});
 assert.match(multi,/name="weapon\.count"/);
 assert.match(multi,/name="weapon\.target3"/);
});

test('power resolution omits manual spatial fields and offers explicit outcomes',()=>{
 const a=actor();
 const powerAttack={plan:{name:'Teste',effect:'canhao',family:'ninpou',resistances:[]}};
 const html=panelView('power-use',{actor:a,powerAttack,targets:[]});
 assert.doesNotMatch(html,/name="resolve\.(?:distance|located|areaFraction|hit)"/);
 assert.match(html,/data-sns="power-confirm-hit" data-hit="yes"/);
 assert.match(html,/data-sns="power-confirm-hit" data-hit="no"/);
});

test('opening a learned technique hides fixed choices and preselects one marked target',()=>{
 const a=actor();
 a.items=[{id:'suiton',name:'Suiton',type:'power',system:{level:1,powerData:{family:'suiton',choices:[{effect:'canhao',tier:1}]}}}];
 const env={actor:a,itemId:'suiton',openedEffect:'canhao',selectedTargets:['Actor.target'],targets:[{uuid:'Actor.target',name:'Alvo'}]};
 const html=panelView('power-use',env);
 assert.doesNotMatch(html,/<select name="power\.(?:effect|tier)"/);
 assert.match(html,/type="hidden" name="power.level" value="1"/);
 assert.match(html,/<select name="power.mode"/);
 assert.match(html,/<option value="Actor.target" selected>/);
 assert.doesNotMatch(panelView('power-use',{...env,targets:[]}),/name="power.targetUuid"/);
 assert.match(panelView('power-use',{...env,openedEffect:undefined}),/<select name="power.effect"/);
 assert.doesNotMatch(panelView('weapon-use',{actor:a,itemId:'unarmed'}),/<select name="weapon.itemId"/);
});

test('inventory groups only owned containers and shows orphaned items without a container',()=>{
 const a=actor();
 const gear=(id,name,key,data={})=>({id,name,type:'equipment',system:{catalogKey:key,catalogBook:'basico',quantity:1,inventoryData:data}});
 const backpack=gear('pack','Mochila de viagem','backpack');
 const pouch=gear('pouch','Bolsa de ferramentas','belt-pouch');
 const tag=gear('tag','Tarja explosiva','explosive-tag',{containerId:'pouch'});
 const rope=gear('rope','Corda','rope',{containerId:'deleted'});
 a.items=[backpack,pouch,tag,rope];
 const html=actorView(a,'equipment');
 assert.match(html,/<h3>Mochila de viagem<\/h3>[\s\S]*<h3>Bolsa de ferramentas<\/h3>[\s\S]*Tarja explosiva[\s\S]*<h3>Sem recipiente<\/h3>[\s\S]*Corda/);
 assert.match(itemView(tag,a.items),/name="system.inventoryData.containerId"[\s\S]*value="pouch" selected/);
 a.items=[tag,rope];
 assert.doesNotMatch(actorView(a,'equipment'),/<h3>Mochila|<h3>Bolsa/);
 assert.doesNotMatch(itemView(tag,a.items),/name="system.inventoryData.containerId"/);
 assert.match(panelView('catalog',{actor:a,catalog:'weapons'}),/assets\/equipment\/short-sword.webp/);
 assert.match(panelView('inventory-catalog',{actor:a}),/assets\/equipment\/backpack.webp/);
});

test('sheet exposes token editing, a wrapping compartment field and themed condition controls',()=>{
 const a=actor();
 assert.match(actorView(a,'summary'),/data-sns="edit-token-art"/);
 const pack={id:'pack',name:'Mochila',type:'equipment',system:{catalogKey:'backpack',catalogBook:'basico',quantity:1,compartments:'1 item(ns) / 1 compartimento(s)'}};
 const tag={id:'tag',name:'Tarja explosiva',type:'equipment',system:{quantity:2,inventoryData:{containerId:'pack'}}};
 a.items=[pack,tag];
 assert.match(itemView(pack),/<textarea name="system.compartments"[^>]*>1 item\(ns\) \/ 1 compartimento\(s\)/);
 const use=panelView('inventory-use',{actor:a,itemId:'pack'});
 assert.match(use,/backpack\.webp[\s\S]*Capacidade por unidade[\s\S]*Tarja explosiva · × 2/);
 assert.doesNotMatch(use,/data-sns="inventory-execute"/);
 const condition=panelView('conditions',{actor:a});
 assert.match(condition,/data-sns-search[\s\S]*data-search="debilitado"[\s\S]*data-sns="toggle-condition"/);
});
