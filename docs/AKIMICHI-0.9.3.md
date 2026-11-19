# Akimichi — continuação local de 14/11/2026

Fonte: Livro Básico 4.1.b, páginas impressas 150–155; regras comuns pp. 38, 251, 264 e 271–272. Código conferido sobre o snapshot da transferência; notas antigas não são prova de implementação.

## Implementado nesta etapa

| Capacidade | Requisitos, custo e duração | Execução |
|---|---|---|
| Nikudan Sensha | Baika Ninpou 2, Lutador; completa; 1 chakra, mais 1 de Baika abdominal se não houver expansão ativa | Corrida de Atletismo, mínimo 3 m e trajeto retilíneo conferido pela mesa; +1 de Investida e −1 defensivo até o próximo turno. Alvo marcado declara defesa antes dos dados de CC; dano corporal comum e Vigor contra 2 + CC para evitar Caído. |
| Nikudan Hari Sensha | Regras de Nikudan; corrente de kunais preparada com parcial, ou cabelo com livre e +1 chakra | Acrescenta Corte, sem inventar dano adicional. Preparação material é declaração da mesa. |
| Bunbun Baika | Baika Ninpou 3, Lutador; livre; instantânea, sem custo publicado | Prepara o próximo ataque corporal: alcance mínimo 2 m e Força de Grande para dano. +1 nas quatro manobras publicadas, sem acumular bônus de outras manobras. Preparação consumida uma única vez na execução; não muda o tamanho do corpo nem os atributos comprados. |
| Choudan Bakugeki | Baika Ninpou 4, Corpulência, Resiliência, Modo Chou; padrão, 3 chakra | Dano corporal +3. Baika ativo somente a partir do nível 7; se expandido, +4 no nível 8, +5 no 9 etc. Defesa e dano usam os mesmos cartões compartilhados. |
| Controle de Caloria | Corpulência, Resiliência, Vigor 14 sem pílula; parcial | Verde: −3 Vitalidade, +6 chakra, Força +2; Amarelo: −5/+10/+4; Vermelho: −7/+14/+6. Recuperação limitada ao máximo. Cada nível uma vez por cena e ordem crescente. Sustentar com parcial; encerra sem manutenção a partir do turno seguinte. |
| Modo Chou | Controle de Caloria Vermelho disponível | Retira as penalidades de Resiliência. Sem Baika ativo, usa o maior valor entre Agilidade e 2 × Baika para deslocamento e Finta. Não modifica Agilidade comprada. |
| Pílulas coloridas | Declaração de posse/consumo da cor escolhida; dispensam somente Vigor 14 | Três fins de turno, com recibos; Verde causa Fatigado 1 turno, Amarelo Exausto 2, Vermelho testa Vigor 23 para Exausto em vez de Inconsciente por 24h. Vigor original 16 dispensa esse teste. Mistura com Pílulas do Soldado reutiliza intoxicação compartilhada, em qualquer ordem. |

Força temporária serve para dano e testes de Força; não aumenta CC nem pré-requisitos (p. 251). A dureza manual permanece independente. Suspender a origem, remover requisitos ou desabilitar o livro suprime os benefícios de Caloria/Bunbun sem apagar compras. Após usar Vermelho, a dureza de Resiliência fica indisponível até o mestre confirmar uma semana de dieta, com prazo mínimo no relógio do mundo. As penalidades continuam, exceto durante Modo Chou.

Ficha: Controle de Caloria na consulta de Corpulência; técnicas em Poderes. HUD: Caloria em Parcial e técnicas agrupadas pelo tipo de ação, reutilizando os controles existentes. Nikudan e Choudan usam exclusivamente o alvo marcado; sem seletor redundante. Sem contagem de ações.

Configuração nativa de mundo: **Combate — Crítico dispensa defesa**. Padrão conserva o comportamento anterior; desativada, permite a defesa declarada e conserva o grau crítico. A escolha específica do Ataque Progressivo continua separada.

## Assistido, ambiguidades e pendências

- Corrida: o sistema calcula o alcance disponível; a mesa confere trajeto em linha reta, obstáculos e movimenta o token. Imunidade sonora de Nikudan é informada; não existe um classificador geral de efeitos sonoros no motor atual.
- Corrente de kunais, aquisição gratuita das três pílulas, estoque e compartimento conjunto continuam no inventário manual. Nenhum item é concedido ou removido silenciosamente.
- O segundo teste de Vigor para sobreviver à pílula vermelha (p. 155) não informa dificuldade. Tratamento, esse teste e risco de morte após 24h são assistidos; não há morte automática inventada.
- O livro não detalha como certificar uma semana de dieta nem o instante de início da recuperação. O registro usa o momento do Vermelho como limite mínimo; o mestre confirma a dieta efetivamente cumprida. Pode aguardar mais tempo.
- A restrição de Corpulência impede também a confirmação manual de Acelerado em Seguir Sombra. Super Acelerado é uma condição distinta (p. 205); não generalizamos a proibição sem texto explícito. Não há motor completo de aceleração no código atual.
- Corpulência ainda requer auditoria dos pagamentos diretos, liberação de selos e manutenção de outras técnicas. Não se declara concluída integralmente.
- Três turnos das pílulas são acompanhados pelas fases de combate; passagem equivalente fora de combate permanece assistida.

## Evidência

348 testes automáticos aprovados: 337 recebidos + 11 novos. Incluem defesa antes dos dados, Vigor após acerto, consumo único, ordenação, teto de chakra, suspensão, progressão, sustentação, recuperação, duração, intoxicação e crítico configurável. Prévia isolada inspecionada em 420 e 900 px; não equivale a uma ficha ou HUD rodando no Foundry. Nenhuma validação de mundo foi realizada nesta etapa.

Heurística: ações nomeadas, custos visíveis e ajustes recolhidos; alvo marcado reaproveitado; compras e atributos preservados. Permissões testadas por simulação. Validação com jogadores, posicionamento real do HUD, múltiplos clientes e combate no Foundry 14.370 seguem pendentes.
