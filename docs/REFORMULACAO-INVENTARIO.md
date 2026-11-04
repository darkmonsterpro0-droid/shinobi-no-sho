# Reformulação — etapa 2: inventário técnico da 0.4.0

Base e limites de validação: [REFORMULACAO-BASE.md](REFORMULACAO-BASE.md).

## Como interpretar o inventário

“Implementado” significa código localizado e inspecionado. “Teste passou” significa aprovação da suíte atual no ambiente local; não comprova fidelidade integral aos livros nem funcionamento multiplayer. Conteúdo cadastrado, regras descritas e comportamento automatizado são estados diferentes. Esta análise mapeia responsabilidades e riscos; não é auditoria linha a linha de todas as regras dos livros.

## Mapa de reaproveitamento

| Área | Evidência principal em src/ | Estado e limite | Tratamento recomendado |
|---|---|---|---|
| Modelos e persistência | models.mjs; automation.mjs; item-validation.mjs | Valores comprados, recursos e estados separados; migrações futuras precisam preservar os campos | Manter schema; acrescentar dados somente quando a implementação exigir |
| Criação, NC e EXP | progression.mjs; build-rules.mjs; build-actions.mjs; summary-actions.mjs | Orçamentos, limites e regras da mesa; bases bloqueadas após criação | Preservar; fora da primeira migração de ações |
| Perícias e social | build-rules.mjs; summary-actions.mjs; ui.mjs | Testes e escolhas de atributos; contexto manual autorizado | Reutilizar serviço; manter acesso direto sem janelas repetidas |
| Catálogo e compra de aptidões | aptitude-data.mjs; aptitudes.mjs; item-validation.mjs; catalog.mjs | Requisitos, escolhas, aquisição e evolução; catálogo não representa cobertura integral | Preservar catálogo e validadores; mapear suporte por aptidão |
| Armas e manobras | weapons.mjs; maneuvers.mjs; catalog.mjs | Preparo e execução misturados no handler; algumas consequências são notas | Encapsular fórmulas; separar preparar, iniciar, rolar e aplicar |
| Ataques em sequência | maneuvers.mjs; combat-chat.mjs | Divisão em 2/3 golpes e continuação por cartão; Chute Duplo tem decisão da mesa | Reutilizar planos; vincular cada golpe à execução e defesa |
| Aptidões ativas | aptitude-use.mjs; aptitude-forms.mjs; aptitude-runtime.mjs | Escolhas, custos, limites e efeitos; parte apenas orienta a mesa | Reutilizar planejadores; não converter toda aptidão em um ataque |
| Modificadores de técnicas | technique-aptitudes.mjs; technique-actions.mjs; technique-ui.mjs | Exceções e custos específicos | Manter regras no adaptador; integrar posteriormente |
| Poderes comuns | power-data.mjs; power-rules.mjs; power-actions.mjs; power-defense.mjs | Catálogo, plano, execução, efeitos e confirmações; lacunas documentadas | Usar como referência de recibos; evitar novo motor paralelo |
| Resolução de dano | weapon-resolution.mjs; physical-rules.mjs; physical-actions.mjs | Dureza, absorção, camuflagem e recibos por origem/alvo | Preservar cálculos; organizar autoridade e recuperação de operações |
| Inventário e venenos | inventory-data.mjs; inventory-rules.mjs; inventory-actions.mjs | Quantidades, recarga, doses, absorção e resistências | Manter; vincular consumo à execução comum |
| Condições e turnos | conditions.mjs; automation.mjs; main.mjs | Fontes, duração e processamento; mestre eleito conduz certos hooks | Preservar; testar avanço, retorno e reconexão no Foundry |
| Clones | clone-rules.mjs; clone-actions.mjs | População, custos e devolução conforme decisões da mesa | Não migrar no primeiro piloto; preservar referências e recibos |
| Ficha e painéis | ui.mjs; apps.mjs; *-ui.mjs; styles/ | Renderização e despacho de eventos conectam vários domínios | Acrescentar acesso às ações sem trocar toda a ficha |
| Favoritos e ações salvas | models.mjs; apps.mjs; ui.mjs | Existe boolean favorite e handler; controles de favoritos foram retirados da ficha na 0.3. Não há configuração persistente completa de arma+manobra | Não confundir favorito com ação salva; especificar entidade própria |
| HUD e hotbar | main.mjs; docs/DESENVOLVIMENTO-0.4.md | HUDs completos fora do lote; sem hook hotbarDrop localizado em src | Implementação futura usa o mesmo serviço da ficha |
| Economia de ações | models.mjs; ui.mjs | Campos padrão/movimento/parcial com marcação manual; sem consumo/renovação automático demonstrado | Manual confirmado pelo usuário em D03; preservar na implementação |

## Fluxos atuais relevantes

1. Arma: `catalogAction(weapon-use)` → `weaponUseView` → `catalogAction(weapon-roll)` → `weaponAttack` + `maneuverPlan` → consumo conforme arma → `postAttackRoll` → confirmação de defesa e alvo → `resolveWeaponAttack` → `applyPhysicalDamage`.
2. Aptidão de manobra: `aptitudeUseView` apresenta armas e ataque desarmado com `data-maneuver`; abre o mesmo painel com a manobra pré-selecionada. É um caminho existente para o futuro atalho.
3. Poder: plano específico → validações → execução com identificador e consumo → cartão/rolagem → resolução por alvo e recibos. A separação é mais avançada que em armas, mas não representa transação global atômica.
4. Ficha e painéis encaminham operações por conjuntos de ações em `apps.mjs`; `game.shinobi` expõe abertura de painéis e criação, não um contrato universal de execução.

## Dependências observadas

44 módulos em src e 11 arquivos de testes. `config.mjs` é importado por 27 módulos; `aptitudes.mjs`, por 18; `build-rules.mjs` e `automation.mjs`, por 13 cada. Esses módulos são pontos sensíveis: mover ou renomear suas APIs exige preservar os chamadores. Estas contagens consideram imports relativos estáticos com a forma atualmente encontrada; não são prova de ausência de outras dependências.

## Achados que orientam o contrato

| ID | Evidência | Implicação e prioridade |
|---|---|---|
| A01 | catalog.mjs: weaponUseView/weapon-roll; weapon-resolution.mjs: weaponResolutionView | O caminho examinado não exige declaração de defesa persistida antes da rolagem. Alta: introduzir checkpoint antes dos dados, conforme a ordem do livro já consultada |
| A02 | catalog.mjs: weapon-roll reúne validação, consumo e postagem; technique-actions.mjs e aptitude-use.mjs têm gravações antes de etapas posteriores | Separar prévia sem efeitos de início efetivo; preservar custos legitimamente pagos mesmo com falha. Alta |
| A03 | Map locais em aptitude-runtime, physical-actions, inventory-actions e weapon-resolution; recibos persistidos em flags/estados | Filas locais não comprovam exclusão entre clientes. Alta: autoridade única, versões e retomada precisam de desenho e testes nativos |
| A04 | system.json: socket false; main.mjs: isAuthority e hooks de turnos | Há eleição de mestre para hooks, mas isso não é um coordenador universal de todas as ações. Alta |
| A05 | maneuvers.mjs e combat-chat.mjs | Plano de múltiplos golpes existe; combinações e exceções não podem ser resumidas a um único campo de manobra. Média/alta |
| A06 | models.mjs: favorite; apps.mjs: favorite-item; histórico 0.3 | Reaproveitar referências de Items, sem interpretar favorito como execução configurada. Média |
| A07 | docs/DESENVOLVIMENTO-0.4.md | Total de projéteis entre alvos ainda não é orçamento global; confirmação por alvo isolado não basta. Alta para ações multialvo |
| A08 | ui.mjs: actions | Economia de ações atual é manual. Usuário confirmou preservar marcação totalmente manual em D03 |
| A09 | AGENTS.md e docs/DESENVOLVIMENTO-0.3.md | Decisões específicas precisam permanecer identificadas; não substituir pela regra genérica do livro durante a reorganização |

Não foi criado teste novo para uma implementação que ainda não existe; a suíte atual foi executada sem alteração e passou em 124 casos. Isso não elimina os riscos identificados por inspeção.

## Decisões existentes a preservar

- Sangrando: uma tentativa de Vigor 18 por turno; Medicina 16 exige padrão por tentativa. Confuso 5–6 mantém reações defensivas.
- Bases de combate só podem ser distribuídas na criação, inclusive para o mestre.
- Progressão configurável e variante da mesa de 4 pontos com salto final proporcional; evolução não cura/restaura atuais.
- Circunstâncias por avaliação da mesa e modificador manual; sem reinstalar checklist contextual obrigatório.
- Aba Mestre oculta a jogadores; condições com um controle Ativar/Desativar.
- Chute Duplo: +2 somente na primeira parcela após dividir; Domínio da Água individual.
- Clone 2 pela população total; preservar custos e divisão/devolução de Kage.
- Pílulas: contador zerado pelo mestre; descanso não encerra intoxicação própria.
- Penalidades de equipamento fora do limite comum de condições; custos próprios de selos, Misshi sem cobrança dupla.

Fonte autoritativa das decisões: AGENTS.md. Este resumo não a substitui.

## Limites e plano de migração futuro

Sem mudar regras ou schema nesta etapa. Primeiro piloto: ação corporal com arma e Ataque Poderoso; depois Giratório e Múltiplo. Testar cancelamento antes/depois do início, dois cliques, reabertura, munição, alvo sem propriedade, armadura, condições e regras da mesa. Não misturar a extração arquitetural do Core com a reimplementação integral dos poderes.

Lacunas já documentadas: tarjas coladas, estoque de kunais preparadas, Makibishi/regiões, ignição posterior, interações de Lâmina de Raios/Pele de Pedra, orçamento global de projéteis, Repelir/barreiras/rituais e certas aptidões/clones. Não são funcionalidades novas entregues por esta auditoria.
