# Ficha 0.9.1 — candidato local

Pedido: simplificar a ficha, seguir a composição aprovada e concentrar as regras gerais nas Configurações de Jogo; corrigir a ausência de Bakuton na aquisição. A base é a RES-001 (1387f4e), com a correção do filtro por origens (eb305cd). Sem publicação.

## Organização

| Conteúdo | Local |
|---|---|
| Livros, variantes, regras opcionais e da casa, decisões, renovação de cena/dia | Configurações de Jogo → Configurar configurações → Shinobi no Sho — Regras do mundo → Configurar livros e regras (somente mestre) |
| Retrato, nome, patente, NC, origem, vila e condições | Lateral da ficha; campos de identidade sob Editar identidade |
| Vitalidade, Chakra e reservas marcadas para exibição | Cabeçalho persistente; controle de reservas continua manual |
| Atributos, combate, movimento e pontos | Resumo; valores testáveis como controles com rótulos, sem um botão Testar adicional em cada cartão |
| Descanso | Resumo, junto ao movimento |
| Aquisição de poderes, aptidões e técnicas | Poderes e Aptidões → Adicionar |
| Aquisição de equipamentos | Equipamento → Adicionar |
| Exclusão e edição de itens | Mais opções de cada registro; exclusão mantém confirmação existente |
| Ações salvas | Acesso rápido no resumo; manutenção sob Opções da ação ou Gerenciar |
| Simulação de dados/perícias | Perícias → Opções de teste e simulação |
| Biblioteca pessoal, recursos/vínculos, tamanho/proteção, origens, aparência | Opções da ficha, no rodapé |
| Concessão de EXP específica de um personagem | Resumo → Progressão deste personagem (somente mestre, conforme regra ativa) |

Seis abas: Resumo, Poderes e Aptidões, Perícias, Social, Equipamento e História. A aba Mestre foi retirada inclusive para o mestre. O acesso às regras globais ocorre pelo menu nativo do Foundry; não há cópia de regras em cada personagem.

Os settings de mundo `profile`, `houseRules`, `sceneEpoch` e `dayEpoch` existentes são preservados. Seus callbacks de atualização renderizam as aplicações do sistema; catálogos, requisitos, orçamentos e demais cálculos que já consultam esses settings usam os novos valores. Isso não transforma regras ou efeitos ainda não implementados em automação. Preferências de aparência continuam individuais.

## Bakuton

Fonte: Hijutsus II revisado, pp. 18–19. É um Poder, não uma Aptidão nem um poder Ninpou. Aparece no catálogo para origem Bakuton e livro habilitado. Requer Espírito 3; aquisição/evolução usam o validador e orçamento existentes, limite de poder por NC e um único registro. A restrição a outros elementos permite Doton/Raiton e bloqueia outros elementos básicos nos dois sentidos da compra.

O registro custa pontos de poder conforme seu nível, sem escolhas de efeitos Ninpou. Bakuton 5 passa a satisfazer a parcela correspondente do requisito de Demolição. O personagem ainda precisa de NC e orçamento suficientes para comprar esse nível e a aptidão.

Não executa Jiraiken ou outras técnicas, não cria Doton/Raiton, não concede Canhão nem aplica benefícios gratuitamente. Essas concessões publicadas estão sinalizadas para acompanhamento manual. Não se afirma fidelidade automatizada integral ao hijutsu. Outros poderes restritos permanecem fora deste acréscimo específico.

## Evidências

- 218 testes de código executados e aprovados, zero falhas, zero ignorados. A suíte anterior possuía 211 testes; sete cenários foram acrescentados e expectativas antigas de navegação foram ajustadas ao novo pedido.
- Cobertura nova: compra nativa simulada de Bakuton 5 seguida de Demolição, custo conjunto, duplicidade, NC, Espírito, origem, livro, incompatibilidade elemental, controles manuais, aquisição centralizada, orçamento de mundo para múltiplas fichas, permissões e preservação de recursos.
- A prévia `preview/ficha-visual.html` é gerada dos mesmos renderizadores e estilos. Permite percorrer abas, menu de aquisição, equipamento, configurações e tema; dados ilustrativos, sem salvar nem executar regras.
- O Chromium local encerrou com SIGSEGV na inicialização. A inspeção visual automatizada não foi executada; não há certificação de geometria, contraste ou responsividade nesta entrega.
- Foundry 14.367: validação nativa desta revisão, persistência, atualização entre clientes, teclado, zoom, permissões e simultaneidade continuam pendentes. Os testes simulados não os substituem.

## Revisão heurística de intuitividade

O rodapé deixou de agrupar ações de jogo, configuração mundial e manutenção. O nome de um item abre seu uso/consulta; manutenção aparece sob demanda. As origens exibidas na lateral correspondem ao contrato usado pelo catálogo. O menu de aquisição nomeia as quatro categorias e as técnicas manuais existentes agora têm lista na ficha. Esses são resultados de inspeção do código; não se atribui nota visual ou teste com jogadores.

Possíveis atritos a validar: descoberta de valores clicáveis, menus recolhidos em janelas estreitas, altura das reservas extras e clareza entre execução manual e compra validada. A tela não foi reconstruída com fórmulas ilustrativas das pranchas: preserva os sete atributos reais, Yin/Yang, os testes e recursos do sistema.

## Arquivos e limites

- Composição: `src/ui.mjs`, `src/character-ui.mjs`, `styles/character-sheet.css`.
- Aquisições e controles: `src/power-data.mjs`, `src/power-rules.mjs`, `src/power-actions.mjs`, `src/power-ui.mjs`, `src/inventory-ui.mjs`, `src/extra-resource-ui.mjs`, `src/saved-actions.mjs`, `src/core/action-controls.mjs`.
- Aplicações/configuração: `src/apps.mjs`, `src/main.mjs`, `src/config.mjs`; manifestos sincronizados para 0.9.1.
- Prévia: `scripts/build-sheet-preview.mjs`, `preview/ficha-visual.html`.
- Testes: `tests/build.test.mjs`, `tests/layout-batch.test.mjs`, `tests/restricted.test.mjs`, `tests/system.test.mjs`.
- Documentação: este relatório, README, AGENTS, CHANGELOG e RELEASE-NOTES.

Nenhum modelo foi substituído; não há migração, mudança de IDs ou apagamento de aquisições, ações, recursos ou escolhas. Arquivos locais do Windows não foram acessados. A suíte e o pacote são deste candidato isolado; aplicação no Windows exige executar as instruções fornecidas. Automação dos pilotos Hyuuga, Uchiha e Aburame e revisão das 39 definições seguem pendentes, antes de declarar a RES-002 concluída.
