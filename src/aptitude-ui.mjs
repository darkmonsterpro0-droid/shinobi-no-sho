import {USE_FIELDS} from './aptitude-forms.mjs';
import {cloneView} from './clone-actions.mjs';
import {aptitudeUsePlan} from './aptitude-use.mjs';
import {MANEUVERS} from './maneuvers.mjs';
import {SOURCES} from './config.mjs';
export const TECHNIQUE_APTITUDES=['dominio-da-agua','dominio-do-fogo','dominio-do-raio','dominio-da-terra','dominio-do-vento','dominio-ninpou','ilusao-profunda','potencializar','tecnica-acelerada','tecnica-eficiente','tecnica-elevada','tecnica-poderosa','dominio-simples','dominio-mecanico','ilusao-musical','mestre-da-criacao','tecnica-de-controle-de-chakra','tecnica-de-cura-arriscada','tecnica-de-impacto','maestria'];
const NOTES={
 acuidade:'Permite Destreza no CC de ataques desarmados, de toque e com armas compatíveis. O dano continua usando Força.',
 ambidestria:'Soma o dano de armas duplas/em par ou duas armas permitidas. Armas distintas exigem a mesma precisão, atributo de dano e margem de crítico. Anula a penalidade de mão inábil.',
 'ataque-em-movimento':'Divide o deslocamento antes/depois do ataque, até dois movimentos. Não combina com Investida.',
 atirador:'Bônus de dano aplicado à opção escolhida no ataque de arma.',
 'bloqueio-ambidestro':'+1 no Bloqueio com duas armas/arma dupla.',
 'combate-defensivo':'Declare no ataque corporal: −2 no acerto e +3 ESQ até o próximo turno. Não combina com manobras que concedem precisão.',
 'critico-aprimorado':'Aumenta em 1 a margem de crítico da arma elegível; não acumula ampliações iguais.',
 'dano-extra':'+1 de dano base na categoria escolhida em CC/CD 18 e +1 a cada dois níveis comprados acima de 18.',
 diligente:'+3 Iniciativa. Uma repetição de iniciativa por cena; a segunda rolagem é obrigatória mesmo se pior.',
 especialista:'+1 em CC/CD da categoria escolhida; não acumula com Maestria.',
 guerreiro:'Permite as manobras da categoria escolhida com a arma. Consulte a revisão da fonte; armas pesadas conservam restrições próprias.',
 intuicao:'+1 Ler Movimento.',lutador:'Remove −2 nas manobras especiais desarmadas ou com armas naturais.',
 'lutar-as-cegas':'Evita Desprevenido pela ausência de visão em camuflagem ambiental e permite repetir a chance de falha. Evolução depende da versão do livro.',
 mobilidade:'+3 ESQ contra oportunidades provocadas por movimento. No Guia: Cambalhota recebe Perito e conserva deslocamento.',
 oportunista:'1 oportunidade normal + metade da AGI arredondada para cima; sempre alvos diferentes. No nível 2 do Guia permite oportunidades à distância a até 10 m, com suas restrições.',
 'ponto-cego':'Fintar usa movimento, inclusive fintas especiais compatíveis.',
 'punho-de-ferro':'Dano de arma desarmado: +1; +2 em FOR 8; +3 em FOR 10; +4 em FOR 12. Não soma outros danos de arma desarmados.',
 reflexos:'+1 ESQ; perdido quando Desprevenido ou sem poder se mover.',
 'saque-rapido':'Sacar/guardar é livre. Recarregar besta leve é parcial; pesada é movimento. Permite sacar durante Bloqueio e selos com arma em uma mão.',
 'tiro-longo':'Dobra alcance das armas permitidas pela versão da aptidão.',
 'tiro-preciso':'Disparos ignoram cobertura/camuflagem parcial. Evolução do Guia ignora camuflagem total, mas exige noção da presença e posição do alvo.',
 trespassar:'Depois de abater em seu turno, um ataque corporal extra por rodada; no nível 2 não há esse limite.',
 'usar-arma':'Proficiência com a arma escolhida. Exigências físicas da arma continuam válidas.',
 'usar-armaduras-pesadas':'Evita a penalidade adicional de armadura pesada sem treinamento.',
 velocista:'Sem armadura pesada, dobra AGI para calcular deslocamento. Se acelerado/superacelerado, recebe +10 m em vez disso.',
 'apanhar-objetos':'Pode apanhar projétil bloqueado e devolvê-lo como ação livre. No Guia, mantém dano original e precisão do Bloqueio; não responde a outro Apanhar Objeto.',
 'bloquear-arma':'+1 no Bloqueio contra arma corporal; superar por 4 permite Desarmar livre, crítico desarma automaticamente.',
 contragolpe:'Bloqueio que supera por 4 um Golpear corporal permite oportunidade. Crítico na defesa ou erro crítico inimigo torna o contra-ataque automático.',
 engenheiro:'Permite construir dispositivos/armadilhas. Mecanismos pode substituir Espírito nos parâmetros de Ninpou mecânico.',
 'ninja-medico':'Permite cirurgias, remédios, antídotos e cura; Medicina substitui Venefício para antídotos. Não fica Desprevenido por curar aliado.',
 'pericia-inata':'Permite repetir o teste recém-realizado da perícia escolhida, exceto após falha crítica. A segunda rolagem deve ser aceita.',
 perito:'+2 na perícia escolhida; não altera requisitos ou parâmetros calculados a partir do nível comprado.',
 quimico:'Autoriza comprar Venefício.',
 'resistencia-maior':'Permite repetir resistência do atributo escolhido, exceto após falha crítica. A segunda rolagem deve ser aceita.',
 'arremessador-de-utilitarios':'Pode usar alcance 5 m + DES para ferramenta utilitária com alcance original maior que 1 m.',
 'arremessador-eficiente':'Permite causar dano de arremesso com um projétil por mão; continua limitado ao dobro do dano de arma com duas mãos.',
 'esquiva-de-risco':'Reação 2d8 + ESQ em teste resistido; não recebe bônus de precisão além de Reflexos. Continua sendo Esquiva.',
 'fuuma-shuriken-criadas':'Criar Arma 2 pode gerar Fuuma Shurikens; preparar Kousen custa +1 chakra quando possui as aptidões necessárias.',
 'fuuma-shuriken-kousen':'Permite as manobras de Kousen com uma única Fuuma Shuriken, sem compartimentos extras.',
 'kawarimi-perfeito':'Permite Kawarimi contra técnicas em área.',
 'burro-de-carga':'Limite sem penalidade: 4 compartimentos; 5 em FOR 8; 6 em FOR 12.',
 'furtividade-agil':'Sem penalidade por deslocamento normal; corrida/investida tem apenas −1 de Furtividade.',
 'metabolismo-rapido':'Dobra a recuperação de vitalidade e chakra de um descanso completo.',
 clone:'Gera clones ligados à origem, com limites, custos e penalidades da versão usada.',
 'clone-verdadeiro':'Um único Kage/Moku Bunshin com poderes e aptidões comuns; mantém as demais restrições e penalidades de Clone.',
 'clone-perfeito':'Apenas PdM: até seis clones, sem as restrições anteriores.'
};
export function aptitudeUseView(env,helpers){
 const {esc,field,select,button}=helpers,item=env.actor?.items?.find(i=>i.id===env.itemId);if(!item)return '<p>Aptidão não encontrada.</p>';
 const key=item.system.catalogKey,active=env.actor?.aptitudeStates?.[key],definitions=USE_FIELDS[key],values=env.values??{};
 let content=`<h3>${esc(item.name)} · nível ${item.system.level??1}</h3><p class="sns-source">${esc(SOURCES[item.system.catalogBook])} · p. ${esc(item.system.source?.page)}</p>`;
 if(key==='clone')return content+cloneView(env.actor,item,helpers,values);
 if(active)content+=`<p role="status">Ativa${active.choice?': '+esc(active.choice):''}.</p>${button('Encerrar efeito','end-aptitude',`data-id="${esc(item.id)}"`)}`;
 if(definitions){content+=`<div class="sns-form-grid">${definitions.map(([name,label,type])=>typeof type==='object'?select(label,'aptitude.'+name,values[name]??Object.keys(type)[0],type):field(label,'aptitude.'+name,values[name]??(type==='number'?1:''),type,type==='number'?'min="0"':'')).join('')}</div>`;
  try{const defaults=Object.fromEntries(definitions.map(([k,,t])=>[k,values[k]??(typeof t==='object'?Object.keys(t)[0]:t==='number'?1:'')])),plan=aptitudeUsePlan(item,env.actor.system,env.actor.items,defaults,env.houseRules);content+=`<p>Ação: ${esc(plan.action)}${plan.cost?' · Chakra: '+plan.cost:''}</p><ul>${plan.notes.map(n=>'<li>'+esc(n)+'</li>').join('')}</ul>`;}catch(error){content+=`<p class="sns-hint">${esc(error.message)}</p>`;}
  content+=button('Usar aptidão','execute-aptitude',`data-id="${esc(item.id)}"`,'primary');return content;
 }
 if(key==='dominio-da-agua')content+=`<p>Pontos de água próprios nesta cena: <strong>${env.actor.aptitudeWater??0}</strong></p>${button('Descartar pontos de água','clear-water')}`;
 if(TECHNIQUE_APTITUDES.includes(key)){content+='<p>Escolha a técnica ou poder cujos parâmetros serão usados nesta execução.</p>';content+=env.actor.items.filter(i=>['power','technique'].includes(i.type)).map(i=>button(esc(i.name),'prepare-technique',`data-id="${esc(i.id)}" data-aptitude="${esc(item.id)}"`)).join('');return content;}
 if(MANEUVERS[key]){content+='<p>Escolha a arma para preparar esta manobra.</p>'+button('Ataque desarmado','weapon-use',`data-id="unarmed" data-maneuver="${key}"`);content+=env.actor.items.filter(i=>i.type==='equipment'&&i.system.catalogKey).map(i=>button(esc(i.name),'weapon-use',`data-id="${esc(i.id)}" data-maneuver="${key}"`)).join('');}
 content+=`<p>${esc(NOTES[key]??'Consulte o efeito na fonte indicada. As restrições narrativas continuam sob decisão da mesa.')}</p>`;
 return content;
}
