import {LOTUS_KEY,lotusManeuvers,lotusChoices,aptitudeItems} from './aptitudes.mjs';
import {aptitudeReference,aptitudeRuleDetails} from './aptitude-reference.mjs';
import {RESTRICTED_APTITUDES} from './restricted-aptitude-data.mjs';
import {restrictedEligibility,characterOrigins} from './restricted-aptitudes.mjs';
import {HYPNOSIS_OPTIONS,sharinganCopies} from './sharingan-techniques.mjs';
import {MANGEKYOU_PAIRS} from './clan-capabilities.mjs';
import {capabilityStatus,originChoices} from './capability-actions.mjs';
import {escapeHTML as esc} from './core/action-controls.mjs';
import {SOURCES,ID} from './config.mjs';
import {SIZES} from './physical-rules.mjs';
import {companionDied,companionTraining} from './inuzuka.mjs';
const kinds={cla:'Clã',hijutsu:'Hijutsu',especial:'Especial'};
function companionTrainingControls(env,item,animal,slot){
 if(!companionDied(animal))return '';
 const training=companionTraining(env.actor,slot),attrs=`data-id="${esc(item.id)}" data-slot="${slot}" data-uuid="${esc(animal.uuid)}"`;
 const button=(op,label,extra='')=>env.isGM?`<button type="button" class="sns-btn" data-sns="capability-companion-training-${op}" ${attrs} ${extra}>${label}</button>`:'';
 if(!training||training.deceasedUuid!==animal.uuid||training.status!=='training')return `<p>Companheiro morto. ${button('start','Iniciar treinamento de reposição')}</p>`;
 return `<p>Treinamento de reposição: ${training.days} dias (6 × Lidar ${training.lidar}, registrado no início). Restam ${Math.ceil(training.remainingDays)} dias pelo relógio do mundo. O mestre confirma a dedicação integral e ininterrupta.</p>
  ${button('finish','Confirmar treinamento e criar substituto',`data-training="${esc(training.id)}" ${training.remainingDays>0?'disabled':''}`)}
  ${button('restart','Interromper e recomeçar treinamento')}`;
}
export function originEditor(env){
 const actor=env.actor;if(!actor)return '';
 const origins=characterOrigins(actor.system),editable=env.isGM||actor.system.campaign?.draft;
 return `<details${env.editOrigins?' open':''}><summary>Origens e opções de acesso</summary><p>Escolher origem permite avaliar compras; não concede aptidões, poderes ou recursos. O texto antigo de Clã / Hijutsu é preservado.</p><fieldset class="sns-origin-fields"${editable?'':' disabled'}><legend>Origens deste personagem</legend><div class="sns-origin-options">${Object.entries(originChoices()).map(([key,name])=>`<label><input type="checkbox" name="origin.${esc(key)}" ${origins.keys.includes(key)?'checked':''}> ${esc(name)}</label>`).join('')}</div><label class="sns-uzumaki-option">Opção Uzumaki<select name="originOption.uzumaki"><option value="">Conferir / não definida</option><option value="option1" ${actor.system.capabilityData?.originVariants?.uzumaki==='option1'?'selected':''}>Opção 1</option><option value="option2" ${actor.system.capabilityData?.originVariants?.uzumaki==='option2'?'selected':''}>Opção 2</option></select></label><button type="button" class="sns-btn" data-sns="capability-save-origins">Salvar origens sem conceder capacidades</button></fieldset>${origins.unsupported?'<p role="alert">Versão de origens não suportada; edição bloqueada.</p>':''}${!editable?'<p>Após a criação, o mestre altera as origens.</p>':''}<small>Para Hatake, Sarutobi, Fuuma ou Yotsuki com opção Tensai, selecione ambas as origens. Outras combinações seguem as regras da mesa e as exceções conferidas.</small></details>`;
}
export function restrictedCatalogView(env){
 const actor=env.actor;if(!actor)return '<p>Abra o catálogo pela ficha do personagem.</p>';
 const items=actor.items??[],books=env.profile?.books??[],rules={...env.houseRules,senjutsu:env.profile?.senjutsu};
 const origins=characterOrigins(actor.system),originNames=originChoices();
 const rows=RESTRICTED_APTITUDES.filter(entry=>entry.accessOrigins.some(key=>origins.keys.includes(key))).map(entry=>({entry,status:restrictedEligibility(entry,actor.system,items,{rules,books})})).sort((a,b)=>Number(b.status.allowed===true)-Number(a.status.allowed===true)||a.entry.name.localeCompare(b.entry.name,'pt-BR'));
 const context=origins.unsupported?'Versão das origens não suportada; confira os dados com o mestre.':origins.keys.length?`Exibindo aptidões das origens: ${origins.keys.map(key=>esc(originNames[key]??key)).join(', ')}. Requisitos pendentes continuam indicados em cada aptidão.`:'Nenhuma origem definida. Selecione o clã ou hijutsu em Origens e opções de acesso.';
 if(!rows.length)return `<section class="sns-catalog-empty"><h3>${origins.keys.length?'Sem aptidões para esta origem':'Defina a origem do personagem'}</h3><p role="status">${context}</p></section>${originEditor(env)}`;
 return `<div class="sns-catalog-context"><p role="status">${context}</p>${originEditor(env)}</div><div class="sns-filters"><label class="sns-field"><span>Buscar aptidão restrita</span><input type="search" data-sns-search placeholder="Nome, origem ou requisito"></label><label class="sns-field"><span>Categoria</span><select data-filter="kind"><option value="">Todas</option>${Object.entries(kinds).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><span data-filter-count role="status"></span></div><div class="sns-catalog sns-catalog-ledger">${rows.map(({entry:e,status:s})=>{
  const prefix=`catalog.${e.book}.${e.key}.`,owned=items.some(i=>i.system?.catalogKey===e.key),blocked=s.allowed===false||owned&&!e.repeatable,review=s.review.length>0;
  const choose=e.accessOrigins.filter(k=>characterOrigins(actor.system).keys.includes(k));
  return `<article class="sns-block" data-kind="${e.kind}" data-search="${esc((e.name+' '+e.origin+' '+e.requirements).toLocaleLowerCase('pt-BR'))}"><header><h3>${esc(e.name)}</h3><span>${kinds[e.kind]} · ${esc(e.origin)}</span></header><small>${esc(SOURCES[e.book])} · ${esc(e.edition)} · p. ${e.page}</small><p class="sns-aptitude-brief">${esc(aptitudeReference(e.key,e.book).brief)}</p>${aptitudeRuleDetails(e.key,e.book,esc)}<p>Pré-requisitos: ${esc(e.requirements)}</p><p>Níveis: 1–${e.maxLevel} · Aquisição: ${e.acquisitionCost} pontos de poder por nível comprado.</p><p role="status">${owned&&!e.repeatable?'Já adquirida; evolua pela ficha.':blocked?s.missing.map(esc).join(' '):review?'Conferência do mestre necessária: '+s.review.map(esc).join(' '):'Disponível para aquisição.'}</p><details class="sns-acquire-options"><summary>Opções de aquisição</summary>${choose.length>1?`<label>Origem desta aquisição<select name="${prefix}accessOrigin">${choose.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('')}</select></label>`:''}<label>Aquisição<select name="${prefix}acquisition"><option value="Comprada">Comprar — 2 pontos por nível</option>${e.free?'<option value="Gratuita">Escolha inicial gratuita elegível</option>':''}${env.isGM?'<option value="Concedida">Conceder pelo mestre</option>':''}</select></label>${e.key===LOTUS_KEY?[1,2].map(n=>`<label>Manobra ${n}<select name="${prefix}lotus${n}"><option value="">Escolha a manobra</option>${lotusManeuvers().filter(m=>!items.some(i=>i.system?.catalogKey===LOTUS_KEY&&lotusChoices(i.system.selection).includes(m.key))).map(m=>`<option value="${esc(m.key)}">${esc(m.name)}</option>`).join('')}</select></label>`).join(''):e.repeatable?`<label>Identifique esta escolha<input name="${prefix}selection" maxlength="200"></label>`:''}${env.isGM?`<label>Conferência / motivo da concessão<input name="${prefix}reviewReason" maxlength="2000" placeholder="Necessário para requisitos manuais e concessões"></label>`:''}<button type="button" class="sns-btn primary" data-sns="catalog-add" data-catalog="restricted" data-key="${e.key}" data-book="${e.book}" ${blocked||owned&&!e.repeatable||review&&!env.isGM?'disabled':''}>${review?'Conferir e adquirir':'Adquirir'} ${esc(e.name)}</button></details><details><summary>Progressão, vínculos e cobertura</summary><ul>${e.levels.map(l=>`<li>Nível ${l.level}: ${esc(l.requirements)}${l.review?' · conferência do mestre':''}</li>`).join('')}</ul><p>${e.restrictions.map(esc).join(' ')}</p><p>${e.resources.length?'Reservas previstas: '+e.resources.map(r=>esc(r.label)).join(', '):'Sem reserva específica vinculada nesta definição.'}</p><p>Cobertura individual: consulte a aptidão. O piloto RES-002 distingue ativação explícita, benefícios derivados e resolução manual; comprar uma origem não concede todo o catálogo.</p></details></article>`;
 }).join('')||'<p>Nenhuma aptidão restrita catalogada para as origens atuais. Confira as origens deste personagem acima.</p>'}</div>`;
}
function clanTechniqueControls(env,status,item){
 const clan=status.clan;
 if(clan.corpulenciaId===item.id)return calorieControls(env.actor,{books:env.profile?.books,rules:env.houseRules,isGM:env.isGM});
 const button=(op,label)=>`<button type="button" class="sns-btn" data-sns="capability-${op}" data-id="${esc(item.id)}">${label}</button>`;
 if(status.definition.key==='res-basico-companheiro-animal'&&!status.suspended&&clan.companion){
  const animals=(globalThis.game?.actors?.contents??[]).filter(a=>a.getFlag?.(ID,'companion')?.origin===env.actor.uuid&&!a.getFlag(ID,'companion').retired);
  const primary=animals.find(a=>a.getFlag(ID,'companion').slot===0),vacancies=(env.actor.getFlag?.(ID,'aptitudes')??env.actor.flags?.[ID]?.aptitudes)?.companionVacancies??{};
  return `<section class="sns-block"><h4>Companheiro e matilha</h4><p>Básico pp. 163–166, 269. Precisões −2, mínimo zero; perícias e aptidões da lista permitida. Agem no turno do Inuzuka, sem iniciativa própria.</p>
   <p>Tamanho ${esc(SIZES[clan.companion.size]?.name??clan.companion.size)}${clan.companion.speaks?' · fala a língua humana':''}.</p>
   <label>Nome do novo companheiro <input name="capability.companion.name" maxlength="100"></label>
   ${Array.from({length:clan.companion.maximum},(_,slot)=>{
    const animal=animals.find(a=>a.getFlag(ID,'companion').slot===slot),vacancy=vacancies[slot];
    const promote=(uuid,label)=>env.isGM?`<button type="button" class="sns-btn" data-sns="capability-companion-promote" data-id="${esc(item.id)}" data-uuid="${esc(uuid)}">${label}</button>`:'';
    if(vacancy?.status==='promoting')return `<p>Escolha do novo principal em andamento. ${promote(vacancy.promotedUuid,'Concluir escolha do principal')}</p>`;
    if(animal)return `<p>${esc(animal.name)}${slot?' · capanga':''} <button type="button" class="sns-btn" data-sns="companion-sheet" data-uuid="${esc(animal.uuid)}">Abrir ficha</button>
     ${slot&&primary&&companionDied(primary)&&!companionDied(animal)&&!animal.getFlag(ID,'companion').transformation?promote(animal.uuid,'Escolher como novo principal'):''}</p>${companionTrainingControls(env,item,animal,slot)}`;
    if(vacancy?.status==='vacant'){
     const deceased=(globalThis.game?.actors?.contents??[]).find(a=>a.uuid===vacancy.deceasedUuid);
     return `<p>Vaga ${slot} da matilha: reposição após promoção do principal.</p>${deceased?companionTrainingControls(env,item,deceased,slot):'<p>Preserve a ficha anterior para conferir a reposição.</p>'}`;
    }
    return `<button type="button" class="sns-btn" data-sns="capability-companion-create" data-id="${esc(item.id)}" data-slot="${slot}">${slot?'Criar integrante da matilha '+slot:'Criar companheiro principal'}</button>`;
   }).join('')}
   <p>Antes de agir, declare quantos integrantes usarão ação padrão na rodada: esse total divide o dano do grupo. Não há contagem automática de ações. Substituir um animal morto exige o treinamento de 6 × Lidar com Animais dias; a ficha existente é preservada.</p></section>`;
 }
 if(status.definition.key==='res-basico-hakken-no-jutsu'&&!status.suspended){
  const sense=clan.hakken;
  return `<section class="sns-block"><h4>Hakken · olfato apurado</h4><p>${sense?.active?'Ativo':'Inativo'} · alcance ${sense?.range??'—'} m · Básico pp. 164–165.</p>${button(sense?.active?'deactivate':'activate',sense?.active?'Desativar · livre':'Ativar · 2 chakra · livre')}<p>Odores no alcance são detectados sem teste. Vento, chuva e odores fortes exigem Percepção contra dificuldade definida pelo mestre. Prontidão, Procurar e Rastrear por olfato: dificuldade −1. Contra surpresa, cabe um teste adicional de Rastrear. A mesa informa o que foi percebido.</p><p>Duração contínua: termina com a cena ou inconsciência; desativar não repete o custo inicial.</p></section>`;
 }
 if(['res-basico-kagura-shingan','res-basico-ryoushitsu-kagura-shingan'].includes(status.definition.key)&&clan.kagura&&!status.suspended){
  const k=clan.kagura;
  return `<section class="sns-block"><h4>Sentir chakra</h4>
   <p>Passivo ${k.passive} m · busca ${k.standard} m · alcance atual <strong>${k.range} m</strong>. Protege contra surpresa.</p>
   ${k.mode&&!k.ready?'<p>Concentração em preparação.</p>':''}
   ${k.suppressionDC!=null?`<p>Supressão ativa · Rastrear ${k.suppressionDC} para detectar o chakra. Olfato e visão funcionam normalmente.</p>`:''}
   <div class="sns-toolbar">${button('kagura-active','Busca ativa')}${k.track>=4?button('kagura-extended','Iniciar alcance estendido'):''}
    ${k.advancedId?button('kagura-progressive','Preparar alcance progressivo · 2 min')+button('kagura-suppress','Suprimir chakra'):''}
    ${k.mode?button('kagura-end','Encerrar modo'):''}</div>
   <details><summary>Identificar Genjutsu em si</summary>
    <label>Dificuldade original <input name="capability.kagura.difficulty" type="number" min="3" step="1"></label>
    ${button('kagura-genjutsu','Testar Percepção · Dif −2')}</details>
   <p>A mesa informa assinaturas, emoções, força aproximada, sensores ativos e ilusões nas outras criaturas.</p></section>`;
 }
 if(status.definition.key==='res-basico-byakugan'&&clan.byakugan){
  const focus=clan.byakuganFocus;
  const track=Math.max(0,(clan.byakuganBaseRange-10)/2);
  return `<details><summary>Alcance do Byakugan</summary><p>Confira a concentração e a imobilidade com a mesa. Encerre o alcance especial quando perder a concentração.</p>${track>=5?button('focus-extended','Iniciar alcance estendido'):''}${clan.tenketsu&&track>=9?button('focus-progressive','Preparar alcance progressivo'):''}${focus?.mode==='progressive'&&!focus.ready?button('focus-confirm','Confirmar 2 minutos de concentração e gastar chakra'):''}${focus?button('focus-end','Encerrar alcance especial'):''}</details>`;
 }
 if(status.definition.key==='res-basico-elemento-natural-katon'&&clan.naturalKatonId===item.id){
  return `<p>Sopro Destrutivo 4 é concedido pela aptidão. Ao adquirir Katon, o efeito fica disponível no poder nos níveis 4, 7 e 10.</p><button type="button" class="sns-btn" data-sns="power-use" data-id="${esc(item.id)}">Abrir Sopro Destrutivo de Elemento Natural</button>`;
 }
 if(status.definition.key==='res-basico-kidaichuu'){
  const colony=clan.insects.find(i=>i.itemId===item.id);
  return (colony?.partners??[]).map(r=>`<details><summary>${r.amount} Kidaichuu em ${esc(r.targetName)}</summary><p>Por parceiro: Vitalidade ${r.vitality}, Chakra inicial ${r.chakra}, Força e Agilidade ${r.forceAgility}, demais atributos ${r.otherAttributes}. Mordida usa CC ${r.attack} e dano de arma 0. Esquiva usa LM ${r.dodgeBase}. Deslocamento 15 m.</p><p>Ao fim do turno, confira o crescimento e a primeira mordida sem nova drenagem. As seguintes drenam 2 chakra por inseto. As mordidas e o posicionamento dos parceiros são resolvidos pela mesa.</p><button type="button" class="sns-btn" data-sns="capability-kida-loss" data-id="${esc(item.id)}" data-partner="${esc(r.id)}">Registrar perda dos parceiros deste contato</button></details>`).join('');
 }
 if(status.definition.key==='res-basico-rinkaichuu'&&clan.insects.some(i=>i.itemId===item.id&&i.available&&i.deployed>0)){
  const targets=(game.actors?.contents??[]).filter(a=>a.visible&&a.uuid!==env.actor.uuid);
  return `<details><summary>Transferência de Rinkaichuu</summary><p>Confirme contato direto com a pele e use a quantidade de grupos acima.</p><label>Alvo<select name="capability.rinka.target"><option value="">Escolha o alvo</option>${targets.map(a=>`<option value="${esc(a.uuid)}">${esc(a.name)}</option>`).join('')}</select></label><label>Contato<select name="capability.rinka.contact"><option value="touch">Toque rápido · um grupo</option><option value="maintained">Contato mantido · grupos confirmados</option></select></label>${button('rinka-transfer','Registrar transferência')}</details>`;
 }
 if(status.definition.key==='res-basico-shokaichuu'){
  const search=clan.shokaSearch;
  const colony=clan.insects.find(i=>i.itemId===item.id);
  if(!colony?.bindingValid)return '';
  if(search?.itemId===item.id){
   return `<p>Busca · raio ${search.radius} m · ${search.remaining?search.remaining+' início(s) de turno até o retorno':'concluída. O mestre informa as assinaturas encontradas.'}</p>${search.remaining?button('shoka-cancel','Cancelar busca'):button('shoka-collect','Recolher grupos da busca')}`;
  }
  return colony.available&&colony.deployed>0?button('shoka-start','Iniciar busca com a quantidade acima · ação padrão'):'';
 }
 return '';
}

function sharinganTechniqueControls(env,status,item){
 const key=status.definition.key;
 const button=(action,label,copyId='')=>`<button type="button" class="sns-btn" data-sns="capability-${action}" data-id="${esc(item.id)}" data-copy="${esc(copyId)}">${label}</button>`;
 if(key==='res-basico-nidan-sharingan'){
  const copies=sharinganCopies(env.actor);
  return `<details><summary>Mímica Sharingan</summary><p>Cópias temporárias duram uma semana. A memória comporta uma técnica. O registro preserva a referência e os parâmetros conferidos.</p>${copies.map(copy=>`<p><strong>${esc(copy.name)}</strong> · ${copy.memorized?'memorizada':'temporária'}<br>${esc(copy.reference)}</p>${status.clan.nidan?(copy.memorized?'':button('mimic-memorize','Memorizar no lugar da atual',copy.id))+button('mimic-purchase','Aprender permanentemente · 2 pontos',copy.id)+button('mimic-forget','Esquecer',copy.id):''}`).join('')}${env.isGM&&status.clan.nidan?`<label>Técnica observada<input name="capability.mimic.name" maxlength="120"></label><label>Fonte e parâmetros conferidos<textarea name="capability.mimic.reference" maxlength="1000"></textarea></label>${button('mimic-copy','Registrar cópia temporária')}`:''}</details>`;
 }
 if(key==='res-basico-sandan-sharingan'&&status.clan.sandan){
  const choices=Object.entries(HYPNOSIS_OPTIONS).filter(([id])=>id!=='bijuu'||env.isGM&&status.clan.mangekyou);
  return `<details><summary>Hipnose Sharingan</summary><p>Confirme alvo, contato visual, custo e condições da técnica na mesa. A declaração cobra chakra e publica as consequências para resolução.</p><label>Efeito<select name="capability.hypnosis.mode">${choices.map(([id,opt])=>`<option value="${id}">${esc(opt.name)}</option>`).join('')}</select></label><label>Alvo confirmado<input name="capability.hypnosis.target" maxlength="120"></label>${button('hypnosis','Declarar e gastar chakra')}</details>`;
 }
 return '';
}

function mangekyouControls(status,item){
 const vision=status.clan.vision;
 if(!vision)return '';
 const control=(key,label)=>`<button type="button" class="sns-btn" data-sns="capability-vision-${key}" data-id="${esc(item.id)}">${label}</button>`;
 const options=values=>values.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('');
 const selected=MANGEKYOU_PAIRS[vision.pair];
 let content=`<p>Visão restante: ${vision.remaining} · penalidade permanente: ${-vision.wear}.</p>`;
 if(vision.remaining===0&&vision.exhaustions===1)return content+'<p>O Sharingan só volta após 24 horas sem uso no relógio do mundo.</p>'+control('rest','Registrar descanso de 24 horas');
 if(vision.exhaustions>=2)return content+'<p>Cegueira após a segunda exaustão da visão.</p>';
 if(!status.clan.mangekyou)return content+'<p>Ative o Sharingan com a cadeia Nidan, Sandan e Mangekyou disponível.</p>';
 if(!selected)return content+`<label>Par de técnicas<select name="capability.vision.pair">${options(Object.entries(MANGEKYOU_PAIRS).map(([id,names])=>[id,names.join(' + ')]))}</select></label>${control('pair','Fixar escolha do par')}`;
 return content+`${selected.includes('Amaterasu')?`<button type="button" class="sns-btn" data-sns="power-use" data-id="${esc(item.id)}">Abrir Amaterasu imediato</button>`:''}<p>Par: ${esc(selected.join(' + '))}. Confira pré-requisitos, custo de chakra e efeitos com o mestre.</p><label>Técnica resolvida<select name="capability.vision.technique">${options([...selected,'Susanoo'].map(name=>[name,name]))}</select></label><label>Custo de visão confirmado<input type="number" name="capability.vision.amount" value="1" min="1" max="2" step="1"></label>${control('spend','Registrar perda de visão')}`;
}

export function restrictedUseView(env,item){
 const actor=env.actor,status=capabilityStatus(actor,item,{books:env.profile?.books,rules:{...env.houseRules,senjutsu:env.profile?.senjutsu}}),entry=status.definition;
 if(entry.key===LOTUS_KEY){
  const available=aptitudeItems([...actor.items],env.houseRules).filter(i=>i.lotusSource===item.id);
  return `<h3>${esc(item.name)}</h3><p>Livro Básico 4.1.b · p. 207. Duas manobras por compra; até três compras com escolhas diferentes.</p><ul>${lotusChoices(item.system.selection).map(key=>`<li>${esc(lotusManeuvers().find(e=>e.key===key)?.name??key)}</li>`).join('')}</ul><p role="status">${available.length===2?'Disponíveis no seletor de manobras enquanto os Portões estiverem abertos.':status.suspended?esc(status.suspensionReason):'Abra os Portões para usar estas manobras.'}</p>${env.isGM?`<label>Motivo da suspensão<input name="capability.reason" maxlength="2000"></label><button type="button" class="sns-btn" data-sns="${status.suspended?'capability-resume':'capability-suspend'}" data-id="${esc(item.id)}">${status.suspended?'Retirar suspensão':'Suspender benefício'}</button>`:''}`;
 }
 return `<h3>${esc(item.name)} · nível ${status.level}</h3><p>${esc(SOURCES[entry.book])} · p. ${entry.page} · ${kinds[entry.kind]}</p><p>${esc(entry.benefits)}</p><dl class="sns-power-facts"><div><dt>Acesso</dt><dd>${status.access.missing.map(esc).join(' ')||'Origem e requisitos numéricos disponíveis.'}</dd></div><div><dt>Aquisição</dt><dd>${esc(status.acquisition)} · nível ${status.level}</dd></div><div><dt>Ativação</dt><dd>${status.activation.mode==='continuous'?(status.activation.active?'Ativo':'Inativo')+' · 2 chakra na ativação · ação livre':status.activation.mode==='scene'?(status.activation.active?'Ativo nesta cena':'Inativo')+' · 1 chakra · ação parcial; pode ativar na defesa':'Manual; consulte a fonte.'}</dd></div><div><dt>Suspensão</dt><dd>${status.suspended?esc(status.suspensionReason):'Sem suspensão registrada.'}</dd></div></dl>${status.activation.mode==='scene'?`<button type="button" class="sns-btn primary" data-sns="${status.activation.active?'capability-deactivate':'capability-activate'}" data-id="${esc(item.id)}" ${!status.activation.active&&!status.activation.available?'disabled':''}>${status.activation.active?'Desativar doujutsu':'Ativar · 1 chakra'}</button><p>A duração termina ao avançar a cena. A marcação de ações é manual.</p><p>${status.definition.key==='res-basico-byakugan'?'Visão especial e interpretação de camuflagens são assistidas; técnicas podem ter exceções próprias. Alcance ativo: '+(status.clan.byakuganRange??'—')+' m.':'Nidan concede Intuição enquanto ativo, sem acumular com compra própria. Esquiva Perceptiva está disponível no cartão de defesa com Sharingan ativo. Genjutsu e benefícios contextuais exigem conferência da mesa.'}</p>`:''}${status.definition.key==='res-basico-nidan-sharingan'?`<p role="status">Intuição derivada desta origem: ${status.clan.granted?.some(g=>g.sourceItemId===item.id)?'disponível com Sharingan ativo; não acumula com compra própria':'inativa; exige Sharingan ativo, origem e requisitos válidos'}.</p>`:''}${status.clan.corpulenciaId===item.id?'<p>Corpulência ativa · +3 × Vigor na Vitalidade calculada e +2 nos testes de Vigor. Ao executar um poder pela ficha ou HUD, você pode substituir cada ponto de chakra do custo por 2 de Vitalidade. Corpulência impede os benefícios de Acelerado concedidos por aptidões ou poderes.</p>':''}${status.clan.resiliencia?.itemId===item.id?`<p>Resiliência ativa · dureza corporal ${status.clan.resiliencia.hardness}. ${status.clan.resiliencia.penalties?'−5 m de deslocamento e −3 em Esquiva, Agilidade, Acrobacia e Furtividade.':'Modo Chou: penalidades de Resiliência suspensas.'}</p>`:''}${sharinganTechniqueControls(env,status,item)}${status.definition.key==='res-basico-mangekyou-sharingan'?mangekyouControls(status,item):''}${status.clan.insects.filter(x=>x.itemId===item.id).map(x=>`<p>Capacidade publicada: ${x.maximum} ${esc(x.unit)}. Reserva: ${x.resourceId?esc(x.resourceId):'não vinculada'} · ${x.bindingValid?'vínculo válido':'vínculo ausente, removido ou compartilhado'}. Saldo disponível: ${esc(x.value??'—')} · liberados: ${x.deployed} · ocupados em técnicas: ${x.occupied}.</p>${x.bindingValid?`<label>Quantidade de insetos ou grupos<input name="capability.insects.amount" type="number" min="1" step="1" value="1"></label>${(x.available?['deploy','return','loss',...(x.recoverable?['recover']:[])]:['return','loss']).map(operation=>`<button type="button" class="sns-btn" data-sns="capability-insects-${operation}" data-id="${esc(item.id)}">${{deploy:'Liberar (ação livre)',return:'Recolher (ação livre)',loss:'Registrar perda',recover:x.key==='res-basico-rinkaichuu'?'Repor após um turno':'Repor após dois dias'}[operation]}</button>`).join('')}<p>${['res-basico-kikaichuu','res-basico-shokaichuu','res-basico-rinkaichuu','res-basico-kidaichuu'].includes(x.key)?`Perdas registradas: ${x.pendingLosses} · reposição disponível: ${x.recoverable}. Prazo: ${x.key==='res-basico-rinkaichuu'?'um turno, até metade da capacidade':'dois dias no relógio do mundo'}.`:'Registre a reposição pelo editor da reserva conforme a regra da espécie.'}</p>`:''}`).join('')}${clanTechniqueControls(env,status,item)}${status.access.review.length?`<p>Conferências: ${status.access.review.map(esc).join(' ')}</p>`:''}<h4>Concessões registradas</h4>${status.grants.length?`<ul>${status.grants.map(g=>`<li>${esc(g.record.benefitKey)}${g.record.selection?' · '+esc(g.record.selection):''} · ${g.available?'origem disponível':'indisponível: '+esc(g.reason)} · sem aplicação automática</li>`).join('')}</ul>`:'<p>Nenhuma concessão registrada. Adquirir a origem não cria benefícios automaticamente.</p>'}${env.isGM?`<details><summary>Registrar concessões e suspensão</summary><label>Motivo / referência<input name="capability.reason" maxlength="2000"></label>${entry.grantPlans.map(p=>`<button type="button" class="sns-btn" data-sns="capability-grant" data-id="${esc(item.id)}" data-benefit="${esc(p.benefitKey)}" data-selection="${esc(p.selection)}">Registrar ${esc(p.benefitKey)} ${esc(p.selection)}</button>`).join('')}<button type="button" class="sns-btn" data-sns="${status.suspended?'capability-resume':'capability-suspend'}" data-id="${esc(item.id)}">${status.suspended?'Retirar suspensão explícita':'Suspender benefício sem apagar compra'}</button><p>Esses registros não criam outro Item nem aplicam bônus. A indisponibilidade por requisito/livro é avaliada separadamente.</p></details>`:''}<h4>Vínculos com reservas</h4>${status.resourceLinks.map(l=>`<p>${esc(l.key)}: ${esc(l.resourceId)} · ${l.exists?'reserva encontrada':'reserva não encontrada; vínculo preservado'}</p>`).join('')}${entry.resources.map(r=>`<label>${esc(r.label)}<select name="capability.resource.${esc(r.key)}"><option value="">Escolha reserva existente</option>${(actor.system.special??[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)} · ${esc(x.id)}</option>`).join('')}</select></label><button type="button" class="sns-btn" data-sns="capability-link" data-id="${esc(item.id)}" data-resource-key="${esc(r.key)}">Vincular sem alterar a reserva</button>`).join('')}<p>Recuperações e efeitos de técnicas dependem da regra de cada origem.</p>`;
}
import {calorieControls} from './akimichi-ui.mjs';
