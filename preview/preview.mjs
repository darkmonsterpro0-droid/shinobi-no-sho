import {previewAutomation} from './automation-adapter.mjs';
import {creationSystem} from '../src/progression.mjs';
import {refreshBudget} from '../src/summary-actions.mjs';
import {actorView,itemView,panelView,filterSurface,esc,set} from '../src/ui.mjs';
import {bindSurface,readFields} from '../src/interactions.mjs';
import {TABS,ICONS,ID,VERSION,ITEM_TYPES,SKILLS,defaultProfile} from '../src/config.mjs';
document.querySelector("#preview-version").textContent=`PRÉVIA DA VERSÃO ${VERSION}`;
const storageKey='shinobi-no-sho.preview.v1';
const fresh=()=>({theme:'light',reduceMotion:false,profile:defaultProfile(),actor:{id:'preview',uuid:'Actor.preview',type:'character',name:'Aoi · exemplo editável',img:ICONS.character,items:[],system:{identity:{village:'',rank:'',clan:'',concept:''},campaign:{level:null,draft:true},attributes:{},combat:{},skills:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{value:null,trained:false,notes:''}])),resources:{vitality:{value:null,max:null},chakra:{value:null,max:null}},movement:{distance:null,type:''},actions:{},social:{},advancement:{},links:{kind:'Invocação'},structure:{absorption:{}},conditions:[],special:[],bonds:[],history:'',notes:''}},items:[],records:[]});
let data;try{data=JSON.parse(localStorage.getItem(storageKey))??fresh();}catch{data=fresh();}
let itemId=null,entryId=null,step=0,draft={name:'Novo personagem',system:{}},proposed=null,unbind,focusTab=null,selectedLibraryId=null;
const surface=document.querySelector('#surface');
const labels={...TABS,create:'Criar personagem',library:'Biblioteca',power:'Editor de poder',aptitude:'Editor de aptidão',technique:'Editor de técnica',item:'Arma e equipamento',test:'Registrar teste',declare:'Declarar técnica',defense:'Escolher defesa',result:'Conferir resultado',conditions:'Condições e duração',settings:'Regras da mesa',sources:'Fontes e decisões',resources:'Recursos e vínculos',appearance:'Aparência e acesso',house:'Regras da casa',allocation:'Atributos e evolução',xp:'Conceder EXP',roll:'Teste do resumo',recovery:'Recuperação e chakra'};
document.querySelector('#preview-navigation').innerHTML=Object.entries(labels).map(([k,label])=>`<a href="#${k}">${label}</a>`).join('');
const persist=()=>{localStorage.setItem(storageKey,JSON.stringify(data));document.querySelector('#preview-state').textContent='Salvo neste navegador · prévia local';};
function itemForView(kind){const type=kind==='item'?'equipment':kind;let item=data.actor.items.find(i=>i.id===itemId);if(!item||(kind==='item'?!['equipment','device'].includes(item.type):item.type!==type)){item=data.actor.items.find(i=>i.type===type);if(!item){item={id:crypto.randomUUID(),type,name:`Novo ${ITEM_TYPES[type].toLowerCase()}`,img:ICONS[type],system:{source:{book:'mesa'},uses:{},absorption:{}}};data.actor.items.push(item);}}itemId=item.id;return item;}
const view=()=>location.hash.slice(1)||'summary';
const navigate=kind=>{if(view()===kind)render();else location.hash=kind;};
function render(){
  const kind=view();let body;
  if(kind in TABS)body=actorView(automatic.env(kind).actor,kind,{isGM:game.user.isGM,houseRules:data.houseRules,profile:data.profile,actors:[{uuid:data.actor.uuid,name:data.actor.name}]});
  else if(['power','aptitude','technique','item'].includes(kind))body=itemView(itemForView(kind));
  else {const collection={condition:'conditions',special:'special',bond:'bonds'}[kind];const entry=collection?data.actor.system[collection].find(e=>e.id===entryId)??{}:{};const bridge=automatic.env(kind);body=panelView(kind,{houseRules:bridge.houseRules,granted:bridge.granted,initial:bridge.initial,actor:bridge.actor,profile:data.profile,items:data.actor.items,selectedId:selectedLibraryId,isGM:true,theme:data.theme,reduceMotion:data.reduceMotion,values:['allocation','house','xp','condition','conditions','roll','recovery'].includes(kind)?bridge.values:kind==='create'?draft:entry,step,proposed,actorCount:1,issues:[]});}
  surface.innerHTML=body;surface.dataset.view=kind;surface.dataset.theme=data.theme;surface.dataset.reduceMotion=data.reduceMotion;document.querySelector('#preview-title').textContent=labels[kind]??kind;
  document.querySelectorAll('#preview-navigation a').forEach(a=>a.classList.toggle('active',a.hash===location.hash||(!location.hash&&a.hash==='#summary')));
  document.querySelector('#actor-type').value=data.actor.type;
  unbind?.();unbind=bindSurface(surface,{action,change,error:e=>{document.querySelector('#preview-state').textContent=e.message;console.error(e);}});
  if(focusTab){surface.querySelector(`[data-tab="${focusTab}"]`)?.focus();focusTab=null;}
  document.querySelector('#preview-chat').innerHTML=data.records.map(r=>`<article class="sns-record"><header><strong>${esc(r.title)}</strong><span class="sns-badge">${r.automated?'Calculado na prévia':'Anotado manualmente'}</span></header><p>${esc(r.notes)}</p><dl>${Object.entries(r).filter(([k])=>!['title','notes','visibility','automated'].includes(k)).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><footer>Prévia local de desenvolvimento · nenhum mundo real é alterado</footer></article>`).join('');
}
async function change(key,value){if(await automatic.change(key,value))return;const kind=view();if(key.startsWith('draft.')){set(draft,key.slice(6),value);if(key==='draft.system.campaign.level')render();else refreshBudget(surface);}else if(key==='name'||key.startsWith('system.')){const doc=['power','aptitude','technique','item'].includes(kind)?data.actor.items.find(i=>i.id===itemId):data.actor;set(doc,key,value);persist();const status=surface.querySelector('[data-save-status]');if(status)status.textContent='Salvo neste navegador';}}
async function action(op,d,root){
  if(await automatic.action(op,d,root))return;
  if(op==='tab'){focusTab=d.tab;navigate(d.tab);return;}
  if(op==='theme'){data.theme=data.theme==='light'?'dark':'light';persist();render();return;}
  if(['library','settings','sources','resources','conditions','test','declare','defense','result'].includes(op)){navigate(op);return;}
  if(op==='panel'){navigate(d.panel);return;}
  if(op==='close'){navigate('summary');return;}
  if(op==='new-item'||op==='new-world-item'){const i={id:crypto.randomUUID(),type:d.kind,name:`Novo ${ITEM_TYPES[d.kind].toLowerCase()}`,img:ICONS[d.kind],system:{source:{book:'mesa'},uses:{},absorption:{}}};(op==='new-world-item'?data.items:data.actor.items).push(i);itemId=i.id;persist();navigate(d.kind==='equipment'||d.kind==='device'?'item':d.kind);return;}
  if(op==='preview-item'){selectedLibraryId=d.id;render();return;}
  if(op==='edit-item'){const i=[...data.actor.items,...data.items].find(x=>x.id===d.id);if(!i)return;if(!data.actor.items.includes(i))data.actor.items.push(i);itemId=i.id;navigate(['equipment','device'].includes(i.type)?'item':i.type);return;}
  if(op==='remove-item'){if(!confirm('Remover este registro da prévia?'))return;data.actor.items=data.actor.items.filter(i=>i.id!==d.id);data.items=data.items.filter(i=>i.id!==d.id);persist();render();return;}
  if(op==='favorite-item'){const i=[...data.actor.items,...data.items].find(x=>x.id===d.id);if(i)i.system.favorite=!i.system.favorite;persist();render();return;}
  if(['condition','special','bond'].includes(op)){entryId=d.id??null;navigate(op);return;}
  if(op==='save-entry'||op==='delete-entry'){
    const kind=view(),values=Object.fromEntries(Object.entries(readFields(root,'entry.')).map(([k,v])=>[k.slice(6),v]));
    if(op==='save-entry'&&!values.name?.trim())throw Error('Informe um nome para o registro.');
    if(kind==='decision'){data.profile.decisions.push({id:crypto.randomUUID(),...values});persist();navigate('sources');return;}
    const key={condition:'conditions',special:'special',bond:'bonds'}[kind],list=data.actor.system[key];const index=list.findIndex(x=>x.id===entryId);
    if(op==='delete-entry'){if(index>=0)list.splice(index,1);}else if(index>=0)list[index]={...list[index],...values};else list.push({id:crypto.randomUUID(),...values});
    persist();navigate(kind==='condition'?'conditions':'resources');return;
  }
  if(op==='post-record'){const values=Object.fromEntries(Object.entries(readFields(root,'record.')).map(([k,v])=>[k.slice(7),v]));if(!values.title.trim())throw Error('Informe o título.');data.records.push(values);persist();navigate('combat');return;}
  if(op==='decision'){navigate('decision');return;}
  if(op==='review-profile'){proposed=structuredClone(data.profile);const fields=readFields(root,'profile.');for(const[k,v]of Object.entries(fields))if(!k.startsWith('profile.books.'))set(proposed,k.slice(8),v);proposed.books=Object.entries(fields).filter(([k,v])=>k.startsWith('profile.books.')&&v).map(([k])=>k.slice(14));navigate('impact');return;}
  if(op==='apply-profile'){data.profile=proposed;persist();navigate('settings');return;}
  if(op==='save-preferences'){const f=readFields(root,'preference.');data.theme=f['preference.theme'];data.reduceMotion=f['preference.reduceMotion'];persist();render();return;}
  if(op==='wizard-step'){for(const[k,v]of Object.entries(readFields(root,'draft.')))set(draft,k.slice(6),v);step=Number(d.step);render();return;}
  if(op==='finish-wizard'){for(const[k,v]of Object.entries(readFields(root,'draft.')))set(draft,k.slice(6),v);if(!draft.name?.trim())throw Error('Informe o nome.');const base=fresh().actor;data.actor={...base,name:draft.name,system:{...base.system,...draft.system,identity:{...base.system.identity,...draft.system.identity},skills:{...base.system.skills,...draft.system.skills}}};if(d.draft!=='true')data.actor.system=creationSystem(data.actor.system);else{data.actor.system.automation={...data.actor.system.automation,enabled:false};data.actor.system.campaign.draft=true;}persist();navigate('summary');return;}
  if(op==='portrait')document.querySelector('#preview-state').textContent='No Foundry, abre o seletor nativo de imagens. Esta prévia mantém o retrato ilustrativo.';
}
const automatic=previewAutomation({state:()=>data,persist,navigate,render,surface});
window.addEventListener('hashchange',render);
document.querySelector('#actor-type').addEventListener('change',e=>{data.actor.type=e.target.value;data.actor.img=ICONS[e.target.value];persist();navigate('summary');});
document.querySelector('#reset-preview').addEventListener('click',()=>{if(confirm('Restaurar somente os dados desta prévia?')){data=fresh();persist();navigate('summary');}});
render();
