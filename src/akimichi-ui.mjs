import {clanCapabilities} from './clan-capabilities.mjs';
import {runtimeState} from './aptitude-runtime.mjs';
export function calorieControls(actor,{books,rules,isGM=false}={}){
 const clan=clanCapabilities(actor,{books,rules});
 if(!clan.corpulenciaId||!clan.resiliencia)return '';
 const data=runtimeState(actor).akimichi??{},active=clan.calorie;
 const button=(op,label)=>`<button type="button" class="sns-btn" data-sns="capability-calorie-${op}" data-id="${clan.corpulenciaId}">${label}</button>`;
 return `<section class="sns-block"><h4>Controle de Caloria</h4>
  <p>${active?`Força +${2*active.level}${clan.chou?' · Modo Chou':''}${active.pill?` · ${active.remaining} turno(s)`:' · sustentado'}`:'Inativo'} · Livro Básico pp. 153–155.</p>
  <div class="sns-form-grid"><label>Nível<select name="capability.calorie.level"><option value="1">Verde · 3 Vitalidade, +6 chakra, Força +2</option><option value="2">Amarelo · 5 Vitalidade, +10 chakra, Força +4</option><option value="3">Vermelho · 7 Vitalidade, +14 chakra, Força +6</option></select></label>
  <label>Forma de uso<select name="capability.calorie.pill"><option value="no">Natural · exige Vigor 14</option><option value="yes">Pílula colorida · três turnos</option></select></label></div>
  <details><summary>Pílulas e recuperação</summary>${button('pills','Registrar kit de três pílulas disponível')}
  <p>Acesso gratuito · cada kit ocupa 1 compartimento. A pílula escolhida é consumida do inventário. Registre somente os kits que o personagem tem à disposição.</p>
  <p>Uma vez por nível por cena, em ordem crescente. Misturar com Pílulas do Soldado causa intoxicação.</p>
  ${data.risk&&!data.risk.resolved?`<p role="status">Pílula Vermelha: risco de morte ${Number(globalThis.game?.time?.worldTime??0)>=data.risk.due?'pendente após 24 horas':'em 24 horas desde o uso'}. O livro não informa a dificuldade do segundo teste de Vigor; o mestre confirma o resultado.</p>${isGM?`<label>Resolução do risco<select name="capability.calorie.outcome"><option value="treated">Recebeu tratamento</option><option value="passed">Segundo teste de Vigor: passou</option><option value="failed">Segundo teste de Vigor: falhou</option></select></label>${button('risk','Registrar resolução do risco')}`:''}`:''}
  ${data.recovering?`<p>Recuperação de calorias pendente: Resiliência sem dureza até completar uma semana de dieta.</p>${isGM?`<label><input type="checkbox" name="capability.calorie.diet"> Confirmo uma semana inteira de dieta hipercalórica</label>${button('recover','Concluir recuperação')}`:''}`:''}</details>
  <div class="sns-toolbar">${button('use','Queimar calorias · parcial')}${active&&!active.pill?button('maintain','Sustentar · parcial')+button('end','Encerrar'):''}</div></section>`;
}
