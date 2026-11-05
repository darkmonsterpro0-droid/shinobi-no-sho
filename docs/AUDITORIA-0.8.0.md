# Auditoria arquitetural — Shinobi no Sho 0.8.0

Data: 4 de novembro de 2026, horário de Brasília. Escopo: inspeção estática, sem implementação, migração ou execução da suíte de testes.

## Parecer

A versão enviada tem uma base funcional significativa para aptidões comuns, cálculos, armas, condições, poderes comuns, ações salvas e reservas. O caminho recomendado é consolidar essa base. Não há justificativa para reescrever a ficha ou os motores de cálculo.

As maiores lacunas para ampliar a automação são: persistência e autoridade ainda diferentes entre fluxos; ausência de proveniência estruturada para concessões; políticas de disponibilidade por livro aplicadas de forma desigual; identidade espacial dos alvos baseada principalmente no Actor; e ausência dos testes e ferramentas de desenvolvimento nesta cópia.

O Core existe como extração inicial dentro do sistema Shinobi. Ainda não é um produto genérico independente ou um adaptador universal validado. O motor de clãs/hijutsus/especiais não está implementado: há cadastro textual e algumas exceções pontuais.

## 1. Base examinada e qualidade da evidência

- Entrada: `shinobi-no-sho-dev.zip`, fornecido pelo usuário.
- SHA-256 do ZIP: `912e8a49503a7520beb8057d6b11c7a6c9b9c1191c7785d6f353e5028003dc77`.
- `system.json` e `src/config.mjs` declaram `0.8.0`.
- HEAD incluído: `7893146e6c0270c8d195ee9dc4c4d3704a554fb5`, mensagem `chore: preservar base local 0.8.0`.
- O caminho Windows registrado pelo Cartographer coincide com o indicado pelo usuário. A leitura ocorreu em uma extração isolada do ZIP; não houve acesso ao disco C:.
- O Git aponta somente alteração de terminações de linha em `.gitignore` em relação ao HEAD: LF para CRLF. Esse estado já está representado no conteúdo enviado; não houve alteração realizada pela auditoria.
- Não foram usados como base os modificadores não commitados da outra cópia deste chat. Eles não estão nesta versão enviada.

### Cartographer

O manifesto registra geração em `2026-11-04T22:47:44.109Z`, ou 19h47 de Brasília, com o mesmo commit acima.

| Verificação de leitura realizada agora | Resultado |
|---|---|
| `PRAGMA integrity_check`, SQLite aberto em modo somente leitura | `ok` |
| `PRAGMA foreign_key_check` | Sem violações |
| Hashes SHA-256 dos arquivos indexados | 142 de 142 coincidem |
| Nós / relações | 153 / 444 |
| Relações de importação | 252 |
| Símbolos / vínculos com testes | 0 / 0 |

Os 152 registros de caminhos incluem 10 diretórios e 142 arquivos. Os nós são 123 `File`, 19 `Doc`, 10 `Directory` e um `RepoSnapshot`. As relações são 152 `CONTAINS`, 40 `DOCUMENTS` e 252 `IMPORTS`.

Portanto, o grafo é íntegro e corresponde aos arquivos indexados, mas não oferece auditoria semântica de funções, regras ou testes. “0 findings” do indexador não significa ausência de problemas arquiteturais. Não foi executado o comando `cartographer verify` nem uma nova indexação.

### Skill e referências

Foi lido o pacote `no-sho-developer-v0.1.zip`, incluindo `SKILL.md` e todas as referências: princípios, regras, automação, Foundry, Cartographer e intuitividade. O pacote da skill foi localizado separadamente; não está dentro do ZIP do projeto.

### O que não foi validado

- Nenhuma suíte de testes foi executada nesta auditoria. Os **176 testes** de `docs/VALIDACAO.md` e `docs/RECURSOS-EXTRAS.md` são registros históricos.
- O ZIP não contém `tests/`, `scripts/`, `package.json` ou a prévia HTML referenciada no README. O Git incluído também não os lista como arquivos rastreados. Isso não comprova que estejam ausentes de todas as outras cópias do projeto.
- Não há instalação executável do Foundry nem mundo disponibilizado para esta análise. Não houve teste de interface, jogador, reconexão ou concorrência real.
- Não foram fornecidos livros dentro deste ZIP. As páginas e nomes de fontes registrados no código foram examinados como metadados; a fidelidade de cada fórmula ao texto publicado não foi certificada.

Classificação usada: **implementado** significa caminho de código presente; **parcial** significa cobertura limitada ou responsabilidades incompletas; **ausente** significa não encontrado no escopo enviado. Nenhuma dessas classificações, isoladamente, certifica funcionamento em jogo.

## 2. Aptidões comuns: catálogo, aquisição, evolução e efeitos

**Situação: implementado em parte substancial, com motor especializado e cobertura desigual.**

| Responsabilidade | Evidência de código | Avaliação |
|---|---|---|
| Catálogo | `src/aptitude-data.mjs`, `APTITUDES` | 132 entradas, 119 chaves distintas, 82 entradas do Básico e 50 do Avançado. Não são 132 aptidões completamente automatizadas: há versões e entradas de evolução. |
| Seleção de edição e identificação | `src/aptitudes.mjs:7–15`, `canonical`, `aptitudeCatalog` | Aliases e combinação por chave existem. A revisão avançada substitui entradas de mesma chave na construção do catálogo. |
| Escolhas e requisitos | `aptitudeChoices`, `prerequisiteStatus`, no mesmo arquivo | Requisitos numéricos e algumas dependências são avaliados; requisitos desconhecidos retornam revisão do mestre. |
| Compra e orçamento | `src/catalog.mjs:51`, `catalogAction`; `src/build-rules.mjs`, `pointBudgets`; `src/item-validation.mjs:30`, `validatePurchase` | Compra, três escolhas iniciais gratuitas elegíveis, concessão do mestre, duplicidade por escolha e limites têm validações. |
| Evolução | `src/aptitudes.mjs:35`, `evolutionStatus`; `catalogAction`; `createItemClass` | Evolução especializada por chave, conferência de requisitos, custo e incremento de um nível. Não é uma tabela genérica de progressão de qualquer capacidade. |
| Proteção do Item | `src/item-validation.mjs:16`, `validateAutomatedAptitudeEdit` | Protege aptidões catalogadas contra edição direta dos dados mecânicos e separa uso de evolução. |
| Benefícios passivos | `aptitudeBonuses`; `src/automation.mjs`, `derivedSummary` e `statPrecision`; `src/weapons.mjs`, `weaponAttack` | Cálculos existentes são reutilizáveis. As regras estão distribuídas por consumidor. |
| Ativação e duração | `src/aptitude-use.mjs`, `aptitudeUsePlan`, `aptitudeUseAction`; `src/aptitude-runtime.mjs`, `claimUsage`, `activeAptitudes`, `advanceAptitudePhase` | Estados, custos, contadores e encerramento estão presentes para um conjunto específico. Outros benefícios são assistidos ou informativos. |
| Modificação de técnicas | `src/technique-aptitudes.mjs`, `modifyTechnique`; `src/technique-actions.mjs`, `techniqueAction` | Reutilização viável; ainda há um caminho independente de execução. |

**Riscos e lacunas:**

1. **Catálogo não é contrato de automação.** O registro não declara sistematicamente se um benefício é derivado, contextual, ativável, assistido ou manual. `aptitudeUseView` pode apresentar somente uma explicação para parte das capacidades. A UI deve mostrar essa cobertura de forma explícita.
2. **Mesma regra em vários lugares.** Requisitos aparecem em `prerequisiteStatus`, evolução em `evolutionStatus`, disponibilidade em `catalogAction` e `validatePurchase`, e efeitos em consumidores distintos. Separar definição e avaliação reduziria divergências sem descartar os validadores existentes.
3. **Remover origem não encerra necessariamente seu estado.** `activeAptitudes` filtra por período, sem exigir que o Item de origem continue presente. `runtimeBonuses` consome esses estados; a remoção em `apps.mjs/dispatch`, operação `remove-item`, apenas exclui o Item. Por inspeção, há possibilidade de benefício ativo continuar até expirar ou ser limpo, mesmo após a remoção. O comportamento precisa de política e regressão específica; não foi reproduzido no Foundry.
4. **Gravações em etapas.** Em `aptitudeUseAction`, a alteração do runtime/Chakra e o consumo do material são atualizações separadas; a mensagem e eventual rolagem vêm depois. Uma falha entre essas etapas pode deixar custo ou estado efetivado sem conclusão visível. A desativação do botão protege uma instância da UI, mas não é recibo persistente de execução.
5. `acquisition` distingue Comprada/Gratuita/Concedida, mas não identifica estruturadamente quem concedeu, qual instância gerou a concessão ou como retirar só esse benefício.

**Reutilizar:** catálogo, chaves canônicas, orçamento, validadores, planejadores e cálculos. Acrescentar contratos em volta deles, em vez de converter toda regra para um motor novo de uma vez.

## 3. Aptidões restritas, clãs, hijutsus e especiais

**Situação: cadastro e exceções pontuais implementados; motor geral ausente.**

Evidências existentes:

- `src/models.mjs:15`: `identity.clan` é uma string.
- `src/build-rules.mjs`, `LINEAGES`: lista de nomes para sugestão.
- `src/ui.mjs:53`, `lineageField`: campo textual com `datalist`; não é seleção de entidades mecânicas com múltiplas origens.
- `src/power-rules.mjs`, `affinityStatus`, e `src/power-actions.mjs`, operação `power-affinity`: exceções de afinidade aprovadas pelo mestre, com justificativa.
- `src/aptitudes.mjs`, requisito de Trabalho Duro, e `aptitudeUsePlan`: exceções que consultam clã/nome.
- `src/config.mjs`, `SOURCES/defaultProfile`: livros de Hijutsus constam nas opções documentais.
- `src/power-data.mjs`, `POWER_FAMILIES`: famílias de poderes comuns. A presença de nomes de clãs nas sugestões não equivale a seus motores implementados.

**Não foi encontrado:** registro geral de capacidades restritas; avaliação estruturada de acesso por origem; concessões com proveniência; suspensão e reativação de benefícios por origem; resolução geral de versões conflitantes; múltiplos clãs/hijutsus tipados; limites específicos de cada origem; concessões temporárias ou níveis concedidos separados dos comprados.

Não se deve transformar automaticamente a escolha de clã em aquisição de capacidades. O futuro contrato precisa distinguir **acesso, aquisição, concessão, ativação, suspensão e efeito**, como exige a skill. A opção documental `twoHijutsus` não implementa esse modelo.

**Desenho proposto, ainda não implementado:** definições no adaptador com ID, categoria, edição, requisitos e avaliadores; instâncias adquiridas em Items; origens/concessões com referências estáveis e proveniência; estados transitórios separados. Reusar o mesmo orçamento e serviço de execução. No Core ficam armazenamento, referências, permissões, execução e apresentação genérica; regras e concessões específicas permanecem no adaptador.

Não definir fórmulas de Resiliência, concessões de clã ou precedência entre livros sem consultar as fontes e as decisões do usuário.

## 4. Ações, execução, defesa e ações salvas

**Situação: piloto de armas/manobras implementado; unificação de todos os tipos de ação parcial.**

| Camada | Arquivos e funções | Presente |
|---|---|---|
| Preparação sem gasto | `src/weapon-actions.mjs:10`, `prepareWeaponAction` | Calcula e valida o ataque antes de iniciar. |
| Custos e recibos | `weaponCosts`, `commitWeaponCosts` | Plano com valores anteriores e recibo no mesmo update do Item consumido. Pode retomar materiais parcialmente processados. |
| Configuração salva | `src/saved-actions.mjs`, `savedDefaults`, `saveAction`, `useSavedAction` | Guarda referências e escolhas, recalculando no uso. Compartilhamento por Actor; edição, duplicação, favoritos e uso único. |
| Acesso comum | `src/core/action-access.mjs`, `createActionAccess` | Ficha/HUD/macro convergem; coalescência de chamadas simultâneas no cliente. |
| Autoridade e persistência | `src/core/execution.mjs`, `activeCoordinator`, `createRequestQueue`, `createExecutionStore`; `src/action-executions.mjs`, `requestAction`, `processActionRequest` | Pedidos por ChatMessage, autor nativo, mestre eleito e execução persistente no cartão. |
| Defesa antecipada | `action-executions.mjs:35`, `allDeclared`; `processActionRequest` | Espera declarações; defensor ou mestre responde; bloqueio, antecipação, Esquiva, técnica e exceção do mestre. |
| Resultado e dano | `src/weapon-resolution.mjs`, `resolveWeaponAttack`; `src/physical-actions.mjs:40`, `applyPhysicalDamage` | Confirmação, cálculos compartilhados e recibos no alvo. |
| Atalhos | `src/action-shortcuts.mjs`, `createActionShortcut`, `actionMacroCommand` | Macro referencia Actor/ação; não congela a fórmula e verifica propriedade no uso. |

**Limitações importantes:**

- A definição salva aceita atualmente `shinobi.weaponAttack`; não há ações salvas equivalentes para qualquer poder ou aptidão.
- Técnicas defensivas são um fluxo assistido: abrir os controles existentes, executar custos/efeitos e confirmar no cartão. O cartão não verifica sozinho o pagamento da técnica.
- Poderes ainda podem usar `powerAction → postPowerRoll → resolvePowerAttack`, com conferência da defesa depois da rolagem. `techniqueAction` também mantém execução própria. A declaração antecipada não está unificada para todo o combate.
- A fila é local ao coordenador. Uma troca de mestre no meio de uma gravação não possui consenso ou transação distribuída comprovada. Há recibos que reduzem repetição, mas não eliminam todos os intervalos entre gravações.
- O runtime de poderes possui IDs e recibos próprios; isso é melhor que ausência de controle, mas sua cobertura não equivale à do fluxo de armas. Por exemplo, `postPowerRoll` gera dados antes de `executions[executionId].posted` ser atualizado; uma interrupção pode deixar uma postagem a repetir. A ocorrência em jogo permanece hipótese de falha, não resultado de teste.
- `saved-actions.mjs`, `attackTargets/selectedTargets`, e o cartão usam UUID de Actor como alvo. `processActionRequest` deduplica por esse UUID. Dois tokens vinculados ao mesmo Actor perdem identidade espacial individual no contrato. Isso exige preservar Token/Scene e definir separadamente quando o dano se aplica uma vez à ficha compartilhada.
- A seleção atual usa targets existentes ou uma janela de seleção. Não foi encontrado o serviço completo “ação → clique direto no token” nem cálculo de células afetadas por áreas. Os alvos de área continuam informados pela mesa; não assumir implementação do No Sho Target.

**Preservar:** ações padrão/movimento/parcial permanecem manuais. `manualMarkers` e os handlers atuais não devem ser convertidos em bloqueadores de uso como parte dessa consolidação.

## 5. Recursos extras e persistência

**Situação: base genérica manual implementada; há uma exceção antiga que contorna essa base.**

- `src/core/extra-resources.mjs`, `createExtraResources`: leitura em cópia, identificação estável, validação numérica/textual, edição, remoção, permissão injetada e fila por Actor no cliente.
- `resourceRecord/editableResource`: normalização aditiva na leitura e proteção de versões não suportadas.
- `src/extra-resources.mjs`: persiste em `system.special`, conservando o caminho antigo.
- `src/models.mjs`: mantém campos antigos e acrescenta `resourceData` extensível.
- `src/extra-resource-ui.mjs`, `extraResourceCards/extraResourceEditor`: reserva separada de Vitalidade/Chakra; usos e benefícios são texto; opção de ocultar sem excluir.

O contrato aceita máximo opcional, números finitos, frações e atual negativo; isso é uma escolha da base genérica documentada, não um erro de regra demonstrado. Aptidões futuras devem impor seus limites em seus próprios adaptadores. Cadastro, leitura e descanso comum não criam benefícios de aptidões por essa base.

### Achado concreto: identificação por nome em Senjutsu — prioridade alta

Em `src/power-actions.mjs:136–139`, `powerAction` faz:

1. `find(r => /senjutsu/i.test(r.name))` para conferir saldo da primeira reserva correspondente;
2. `map(...)` com a mesma expressão para descontar de **todas** as reservas correspondentes;
3. grava diretamente `system.special`, sem passar por `extraResources`.

Com duas reservas cujos nomes contêm Senjutsu, o ramo escrito valida uma e altera ambas. A consequência decorre diretamente do código; não foi executada como teste. Ele também não verifica a versão de `resourceData` antes da alteração. Portanto, a descrição “recursos extras inteiramente manuais” é correta para o serviço novo, mas não para todos os caminhos do sistema.

**Correção proposta:** vincular a execução a um único ID de reserva, com escolha explícita quando houver ambiguidade; validar versão, saldo e permissão; aplicar recibo no mesmo comando de custo. Manter nomes como apresentação. Não criar nova automação de Senjutsu, Akimichi ou Resiliência.

**Outro risco:** a fila de reservas é diferente da fila de `mutateRuntime`; ambas podem escrever o array `system.special`. Mesmo no cliente há caminhos sem uma coordenação única. Entre clientes, uma edição pode sobrescrever outra porque o array inteiro é regravado. Não houve comprovação de perda em jogo, mas o desenho permite a disputa.

## 6. HUD, fichas, interfaces e intuitividade

**Situação: ficha reformulada e HUD inicial implementados; avaliação visual e humana pendentes.**

Evidências:

- `src/character-ui.mjs`: `sheetSidebar`, `sheetResourceHeader`, `sheetSummary`, `attributeCards`, `combatRows`.
- `src/combat-hud.mjs`: `hudActors`, `selectedHUDActor`, `combatHUDView`, `registerCombatHUD`.
- `src/ui.mjs`: `actorView`, `filterSurface`, `lineageField` e painéis.
- `src/interactions.mjs`: `bindSurface`, leitura de campos, busca, mudança de abas pelo teclado e desabilitação do botão durante a operação.
- `src/apps.mjs`: `createApplications`, `ShinobiActorSheet`, `ShinobiPanel`, contexto, despacho e feedback de salvamento.
- CSS de temas, foco visível e container queries em `styles/shinobi.css`, `character-sheet.css` e `extra-resources.css`.

O HUD acompanha personagem controlado ou personagem do usuário, permite seleção explícita e reutiliza ações salvas. Mostra Vitalidade/Chakra, marcadores manuais e acessos básicos. Não é um HUD universal completo: não possui painel geral de capacidades defensivas/contextuais ou apresentação das reservas extras, que está na ficha.

### Rubrica da skill — avaliação heurística do código

Escala: 0 = problema grave; 1 = parcialmente atendido; 2 = atendido. A nota mede a evidência estática disponível, não satisfação de jogadores. Critérios visuais e de desempenho recebem 1 por haver suporte no código sem validação de uso.

| Critério | Nota | Evidência e melhoria concreta |
|---|---:|---|
| Descobribilidade | 1/2 | HUD, abas, busca e Gerenciar são visíveis; salvar combinação fica em um detalhe de Usar arma. Acrescentar “Criar ação salva” no próprio gerenciador, reaproveitando o editor. |
| Economia de interação | 1/2 | Ação salva com alvo único pode declarar diretamente. Defesa com técnica exige alternar cartões/janelas e confirmar etapas. Manter a decisão e eliminar apenas confirmações redundantes após unificação da execução. |
| Terminologia e hierarquia | 2/2 | Recursos principais no topo, identidade lateral, abas e condições agrupadas, reservas separadas. Conservar essa organização; distinguir claramente capacidade manual/assistida/automatizada. |
| Estado e feedback | 1/2 | Há status de salvamento, custos e estados no cartão; o bloqueio global pode depender de outro alvo/golpe. Mostrar próximo responsável e motivo exato da espera. |
| Prevenção/recuperação | 1/2 | Há cancelamento antes do início, confirmação e recibos. Exclusão de aptidão não analisa estados/dependências; reservas por nome e gravações em etapas fragilizam recuperação. |
| Acessibilidade | 1/2 | Labels, `aria-live`, tabs e foco visível existem. Há controles de 9–10 px e alturas de 25–28 px no CSS. Inspecionar legibilidade e teclado em execução antes de aprovar. |
| Responsividade/desempenho | 1/2 | Container queries e reorganização estão escritas. HUD reage a vários hooks; `updateWorldTime` chama refresh geral. Medir redimensionamento, zoom, foco e custo de renderização. |
| Papéis e contexto | 2/2 | Aba Mestre protegida na renderização e no handler; defensor/GM autorizados no serviço; macro verifica propriedade. Manter esses controles e validar com documentos reais. |
| **Total heurístico** | **10/16** | Não representa teste humano ou certificação de interface. |

### Ensaios por tarefa — caminhos inspecionados, sem contagem inventada de cliques

| Tarefa e estado inicial | Caminho atual e principal atrito | Alteração mínima / risco / verificação pendente |
|---|---|---|
| Jogador com arma e ação salva usa o HUD | `useSavedAction` reutiliza alvo único quando consegue medir distância; caso contrário abre seleção; cartão aguarda as defesas. | Explicitar qual seleção falta e o próximo responsável. Evoluir depois para clique direto no token. Preservar contexto espacial e token controlado. Teste nativo pendente. |
| Defensor usa técnica já cadastrada | Seleciona a técnica no cartão, abre o controle existente, executa e confirma início/custos; mais tarde confirma resultado. | Exibir progresso por etapa e referência da execução defensiva. Cobrança integrada exige decisão de produto já deixada pendente; não assumir autorização. |
| Jogador procura aptidão restrita indisponível | Campo de clã sugere nomes, mas catálogo é de aptidões comuns; não existe diagnóstico geral da restrita. | Antes do catálogo restrito, criar avaliação de acesso com lista de requisitos faltantes. Não conceder capacidades ao preencher identidade. |
| Mestre desabilita livro com itens adquiridos | `review-profile` lista itens de fonte desabilitada e `apply-profile` salva sem excluir fichas. A repercussão nos benefícios não é uniforme. | Mostrar impacto em ações/efeitos e política explícita de disponibilidade. Não apagar nem reescrever compras. Confirmar se conteúdo antigo é suspenso ou mantém direitos. |
| Controlador altera uma reserva e outro edita a mesma ficha | Interface salva o atual pelo serviço, com mensagens de status; a fila é local e o array inteiro é regravado. | Detectar conflito ou coordenar gravação por ID. Preservar valor digitado no erro. Verificar dois clientes e reservas homônimas. |
| Jogador remove uma aptidão com efeito ativo | Confirmação genérica e exclusão do Item; runtime separado pode permanecer. | Apresentar dependências e encerrar/suspender somente a instância correspondente conforme política aprovada. Nunca remover aquisições independentes. |

Pontuação por tarefa, usando os mesmos oito critérios na ordem da rubrica. **D** = descobribilidade; **E** = economia; **T** = terminologia; **F** = feedback; **P** = prevenção; **A** = acessibilidade; **R** = responsividade; **C** = papéis/contexto. As notas continuam heurísticas, baseadas nos caminhos e limitações descritos acima.

| Tarefa | D | E | T | F | P | A | R | C | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Ataque salvo no HUD | 2 | 1 | 2 | 2 | 1 | 1 | 1 | 2 | 12/16 |
| Técnica defensiva assistida | 1 | 0 | 2 | 1 | 1 | 1 | 1 | 2 | 9/16 |
| Descobrir requisitos de aptidão restrita | 0 | 0 | 1 | 0 | 0 | N/A | N/A | 1 | 2/12 |
| Desabilitar livro com conteúdo adquirido | 2 | 1 | 2 | 1 | 1 | 1 | 1 | 2 | 11/16 |
| Editar reserva com outro controlador | 2 | 2 | 2 | 1 | 0 | 1 | 1 | 2 | 11/16 |
| Remover aptidão com efeito ativo | 2 | 2 | 2 | 1 | 0 | 1 | 1 | 2 | 11/16 |

Na tarefa de restritas não existe a tela específica de diagnóstico; por isso acessibilidade e responsividade desse diagnóstico são N/A. Totais com denominadores diferentes não devem ser comparados diretamente. A nota de interação baixa da técnica defensiva expressa alternância entre serviços/janelas, sem medir cliques ou desconsiderar decisões necessárias.

## 7. Integração com Foundry VTT 14

**Situação: integração moderna presente; validação na build alvo pendente.**

`system.json` declara mínimo 14, máximo 14 e `verified: 14.367`; isso é uma declaração do pacote. A versão efetivamente instalada no computador não foi observada nesta auditoria.

`src/main.mjs` registra classes de Actor/Item, TypeDataModels, sheets, configurações, status, iniciativa, APIs `game.noSho/game.shinobi`, chat e fases de combate. `models.mjs` usa campos Foundry; `apps.mjs` usa `ApplicationV2`, `ActorSheetV2`, `ItemSheetV2` e mixin Handlebars; rolagens usam `foundry.dice.Roll`. Há reutilização de Actors, Items, ActiveEffects e macros nativas.

As classes ApplicationV2 e ActorSheetV2 e os métodos públicos relevantes estão documentados na API oficial v14. Essa compatibilidade de desenho não demonstra que todos os callbacks, permissões e ciclos de renderização funcionem na build 14.367.

**Ausências/limitações:**

- Não há integração geral com Regions, Walls ou serviço de células afetadas. Não declarar que áreas já seguem o grid automaticamente.
- `packs: []`: não há compêndios empacotados no manifesto. Catálogo JavaScript e biblioteca de Items não são compêndios nativos.
- `socket: false` é coerente com pedidos via ChatMessage; não é por si só um defeito.
- Os modelos possuem `schemaVersion`, mas não foi encontrado um pipeline geral de migração de versões. A base de reservas faz normalização aditiva em leitura. Antes de alterar estrutura, definir migração e reversão explícitas.
- `main.mjs` contém compatibilizações específicas do perfil em `ready`; não equivalem a um migrador versionado geral.
- `getRollData`, `prepareDerivedData`, atualização de status e refresh percorrem serviços interligados. Medir custo real antes de criar caches ou otimizações adicionais.

Fontes oficiais consultadas:

- https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html
- https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActorSheetV2.html
- https://foundryvtt.com/api/v14/classes/foundry.documents.BaseItem.html

## 8. Segurança dos dados, permissões e duplicações

**Situação: várias proteções implementadas; garantia uniforme ainda parcial.**

Pontos favoráveis: `isOwner` nos serviços mutantes; controle específico de GM; `canControl/nativeAuthor` no coordenador; validação de IDs; escape de conteúdo nas interfaces examinadas; script de macro contendo referências serializadas; confirmação de remoção; dados de execução e recibos persistidos; proteção de versões futuras nas reservas; preservação de configurações quando origem desaparece.

Esses mecanismos são evidências de defesa no código, não resultado de teste de invasão. Classes e hooks do cliente também não devem ser tratados como uma fronteira de segurança de servidor para todas as regras da mesa.

### Achados priorizados

| ID / prioridade | Achado e evidência | Consequência e ação recomendada |
|---|---|---|
| A01 — alta | Reserva Senjutsu validada com `find`, descontada com `map` por nome; `powerAction:136–139`. | Pode alterar múltiplas reservas e contornar versão/validação do serviço. Vincular um ID e um recibo explícitos. |
| A02 — alta | Autoridade/fila por cliente em `mutateRuntime`, `createExtraResources` e coordenador; gravações integrais de objetos/arrays. | Possíveis sobrescritas concorrentes. Coordenar comandos por Actor/recurso e detectar conflito; testar dois clientes. Não prometer “exactly once” distribuído. |
| A03 — alta | `validatePurchase` recebe `books`, mas a validação da aptidão não confere seu livro; `aptitudeItems/aptitudeBonuses` não filtram livros. Catálogo e `prepareWeaponAction` aplicam outros bloqueios. | Disponibilidade varia entre compra pela UI, documentos e efeitos passivos. Centralizar política sem apagar conteúdo e sem inventar retroatividade. |
| A04 — alta | `activeAptitudes/runtimeBonuses` independentes da existência do Item; `remove-item` apenas exclui. | Estado pode sobreviver à origem. Acrescentar proveniência, análise de impacto e encerramento/suspensão seletivos. |
| A05 — alta | Testes, package e scripts ausentes da cópia e de seus arquivos rastreados; notas citam execução anterior. | Esta cópia não reproduz a validação nem o processo de release documentado. Recuperar a suíte correta e vinculá-la a este snapshot antes de publicar. |
| A06 — média/alta | `aptitudeUseAction` altera runtime e depois material/rolagens; `postPowerRoll` precede recibo final de postagem. | Interrupção pode deixar execução parcial ou repetição. Estender padrão de fases e recibos de armas aos caminhos existentes. |
| A07 — média | Targets guardam UUID de Actor; deduplicação em `processActionRequest`. | Identidade espacial de tokens vinculados se perde. Adicionar referência de Token/Scene e definir agregação separada de dano por Actor. |
| A08 — média | `power-rules.mjs/availablePowerEffects` mantém efeitos do Básico mesmo sem o livro em `books`; compras comuns e benefícios seguem políticas diferentes. | O significado do perfil pode surpreender o mestre. Explicar dependências obrigatórias ou aplicar política uniforme definida pelo usuário. |
| A09 — média | Ciclos no grafo de importações e responsabilidades concentradas em `automation.mjs`/`apps.mjs`. | Ampliação de capacidades aumenta risco de regressões e inicialização frágil. Extrair avaliadores puros e portas de persistência gradualmente. |
| A10 — média | Histórico/recibos persistentes sem política geral de retenção; `runtimeState`, `powerState.executions`, recibos de dano e custos. | Crescimento de documentos é risco de longo prazo, não lentidão medida. Definir arquivamento que não apague recibos de execuções retomáveis. |

### Acoplamento comprovado pelo grafo

Importações recebidas: `config.mjs` 32; `aptitudes.mjs` 19; `automation.mjs` 15; `physical-rules.mjs` e `build-rules.mjs` 14 cada.

Há um ciclo entre `aptitudes → build-rules → power-rules → aptitudes`. Há ainda um componente de 17 arquivos interligados envolvendo UI, interações, automação, poderes, catálogo e execução. O grafo inclui importações dinâmicas: o segundo componente **não prova** que todas sejam dependências estáticas de inicialização, nem que exista falha atual de carregamento. É evidência de acoplamento a ser reduzido, não um erro de runtime reproduzido.

O Core atual não importa catálogos Shinobi. Contudo, partes usam diretamente o contrato de Actor/flags do Foundry e mensagens em português; independência de regras não significa independência completa da plataforma ou de localização. Manter essa distinção no planejamento.

## 9. Ordem de desenvolvimento recomendada

| Ordem | Entrega | Reutilização e limite |
|---|---|---|
| 1 | Recuperar base de desenvolvimento reproduzível | Reunir testes e scripts correspondentes à 0.8.0; manter hash/commit e distinguir o repositório de desenvolvimento do pacote de instalação. Não regenerar indexação como substituto de testes. |
| 2 | Corrigir custo de reserva por identidade | Usar `createExtraResources` e o padrão de recibos existente. Nenhuma aptidão nova. |
| 3 | Uniformizar segurança de gravação e retomada | Adaptar fluxos de aptidão/poder ao contrato de execução, por piloto pequeno. Reusar `createRequestQueue`, plano de custos e recibos; preservar `mutateRuntime` como adaptação temporária. |
| 4 | Definir política de disponibilidade e dependências | Reusar catálogo, `prerequisiteStatus`, `evolutionStatus`, perfil e revisão de impacto. Não ligar livros a exclusão automática. |
| 5 | Introduzir proveniência de capacidades e efeitos | Acrescentar referências às instâncias adquiridas/concedidas, sem transformar concessões em compras nem fundir origens homônimas. Compatibilidade com Items atuais. |
| 6 | Preparar acesso a clãs/hijutsus/especiais | Modelar acesso e concessão separadamente, com fontes verificadas e explicação dos requisitos; começar sem automação mecânica ampla. |
| 7 | Ampliar ações/HUD e seleção espacial | Adicionar tipos de ação ao acesso comum e manter Token/Scene. No Sho Target e células de área devem ser uma entrega própria com validação geométrica. |
| 8 | Validar e publicar | Regressões, permissões e recuperação; depois inspeção no Foundry. A ausência de teste nativo deve continuar declarada enquanto persistir. |

A separação de módulos puros pode acompanhar as etapas 3–5; não fazer uma reorganização total de diretórios antes de corrigir os riscos concretos.

## 10. Proposta de próxima atualização

**0.8.1 — Integridade de reservas e retomada das execuções existentes.** Proposta; nada foi implementado por esta auditoria.

Escopo sugerido:

1. Recuperar e executar a suíte correspondente ao snapshot; acrescentar regressões dos riscos confirmados.
2. Remover o débito de reserva por correspondência de nome: uma execução seleciona um recurso por ID e grava um recibo de custo.
3. Concentrar todas as escritas de `system.special` em um caminho com validação e preservação de versões não suportadas.
4. Cobrir um piloto de aptidão com material/custo pelo padrão de execução em fases já usado nas armas, sem alterar fórmulas ou economia manual de ações.
5. Tornar a execução pendente identificável e retomável após falha de postagem; conservar custos já efetivados e nunca cobrar novamente por simples retomada.
6. Ajustar mensagens de UI para distinguir “manual”, “assistida” e “automatizada”, particularmente reservas e técnicas defensivas.

Critérios propostos de aceitação:

- Duas reservas com nomes que contenham Senjutsu: somente o ID escolhido muda.
- Repetir o mesmo comando não desconta novamente.
- Reserva de versão futura não é alterada por um caminho paralelo.
- Falhar após efetivar custo permite retomar a mesma execução sem nova cobrança ou novos dados quando os dados já foram persistidos.
- Alteração concorrente é serializada com autoridade adequada ou produz conflito explicado; não há sobrescrita silenciosa no cenário coberto.
- Marcação de ações continua inteiramente manual.
- Dados antigos continuam legíveis; nenhuma migração silenciosa ou nova automação de clã.

Esses são testes futuros, não resultados obtidos nesta auditoria. O pacote 0.8.1 não deve ser apresentado como certificado para jogo sem a validação correspondente.

Depois dessa estabilização, a **0.9.0** pode introduzir o registro de capacidades/origens e o diagnóstico de acesso a restritas, reaproveitando os motores comuns. Não começar automatizando clãs inteiros.

### Decisões a consultar antes de implementar

| Decisão | Alternativas que mudam a experiência |
|---|---|
| Várias reservas elegíveis | Jogador escolhe no uso, ou ação salva guarda um ID configurável. Em ambos os casos, nenhuma escolha automática por nome. |
| Desabilitar livro com conteúdo comprado | Suspender usos/efeitos preservando dados, ou conservar direitos de aquisições anteriores com sinalização. O código atual não resolve isso uniformemente. |
| Origem removida com efeito/concessão existente | Definir encerramento/suspensão por tipo de efeito e destino de concessões; preservar sempre aquisições independentes. |
| Técnica defensiva integrada | Continuar execução assistida, ou integrar sua execução/custos ao cartão. A auditoria não decidiu essa questão pelo usuário. |
| Tokens vinculados ao mesmo Actor | Manter contexto individual de Token e definir quando consequências devem ser agregadas na ficha compartilhada. |

## 11. Registro de execução desta auditoria

Foram realizadas leituras de arquivos, inspeção do ZIP, consultas SQLite somente leitura, comparação de hashes, leitura do Git sem atualização intencional do índice e inspeção da documentação oficial v14. O grafo foi usado para localizar dependências e corroborado com código.

Não foram executados `npm test`, scripts de release, scripts de migração, aplicação Foundry, comandos de indexação ou funcionalidades do sistema. Não houve commit, push, edição do ZIP, modificação de regras, dados ou fontes do projeto. Este relatório foi criado fora da pasta examinada.

O resultado é uma auditoria arquitetural estática com hipóteses de falha identificadas como tal, não uma homologação funcional.
