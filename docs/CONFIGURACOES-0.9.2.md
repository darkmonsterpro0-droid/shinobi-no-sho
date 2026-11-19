# 0.9.2 — Configurações de Jogo nativas

Correção solicitada após a captura da 0.9.1: a intenção é apresentar campos na tela padrão do Foundry, não um botão que abre outra aplicação.

## Comportamento

Em Configurações de Jogo → Configurar configurações → Shinobi no Sho, o mestre encontra caixas de seleção para os livros, listas de variantes, progressão e equipamentos, regras opcionais, nome e anotações da mesa. O botão Configurar livros e regras não é registrado. Não se altera o formulário nativo nem se acrescentam abas ou wrappers visuais.

Os campos de mundo seguem as permissões e o botão Salvar alterações do Foundry. Tema e redução de movimento continuam com escopo de cliente. Atalhos antigos `game.shinobi.open('settings')`/`house` usam a instância nativa `game.settings.sheet`, sem construir outro painel Shinobi.

Contadores de cena/dia existentes aparecem como campos numéricos. Aumentá-los inicia outro período de uso limitado; não renova reservas ou marcações manuais de ações. EXP por conquistas só é aplicável ao avanço por nível inteiro; a opção permanece armazenada se a mesa escolher EXP de atributos, mas sua concessão não aparece nesse modo.

## Persistência e compatibilidade

`world-settings.mjs` define campos escalares estáveis com `scope: 'world'` e `config: true`. Não há onChange que grave cópias de objetos inteiros; cada mudança usa a persistência nativa independente do campo. O callback atualiza as aplicações do sistema.

Os objetos antigos `profile` e `houseRules` são preservados. Sem valor individual salvo, a consulta usa a escolha anterior. O padrão de cada campo no formulário é inicializado a partir desses objetos. Campos salvos individualmente têm precedência. Leituras `worldProfile()` e `worldRules()` são utilizadas pelos serviços do sistema e não alteram Actor/Item.

Campos desconhecidos, decisões estruturadas e referências a livros futuros são mantidos. Escritores de compatibilidade atualizam os campos nativos correspondentes e conservam os objetos antigos; são restritos ao mestre. Integrações externas devem usar esses escritores/leitores, pois ler somente `game.settings.get(ID, 'profile')` não inclui escolhas nativas posteriores. Não se promete sincronização automática para integrações que escrevam diretamente nos objetos legados.

A troca de livros altera disponibilidades nos serviços já compatíveis sem remover compras. Não acrescenta efeitos de livros ou automações ainda ausentes. O rollback para 0.9.1 preservaria dados, mas ignoraria escolhas novas salvas apenas nos campos nativos; não é uma migração bidirecional.

## Verificação

227 testes de código executados, todos aprovados: os 218 existentes e nove cenários adicionais. Cobertura: registro de campos nativos, valores iniciais, zero gravações na leitura/registro, conservação de dados legados/desconhecidos, mudanças independentes, reconexão simulada, jogador/mestre, compatibilidade, orçamento e livros consultados por aquisições e encaminhamento para a instância nativa.

Testes usam substitutos de settings/documentos; não certificam a tela real ou a persistência do servidor Foundry. A atualização ainda precisa ser instalada e observada na build 14.367. A documentação pública consultada é da linha v14 e não aumenta a compatibilidade verificada declarada.

Referências oficiais: https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html e https://foundryvtt.com/api/v14/interfaces/foundry.types.SettingConfig.html . Registro usa tipos nativos e `config`, não `registerMenu`.

## Arquivos

- Novo: `src/world-settings.mjs`, `tests/world-settings.test.mjs` e este relatório.
- Integração: `src/main.mjs`, `src/apps.mjs`, `src/ui.mjs`, `src/character-ui.mjs`.
- Leituras/escritas comuns: `automation.mjs`, `build-actions.mjs`, `capability-actions.mjs`, `catalog.mjs`, `inventory-actions.mjs`, `item-validation.mjs`, `power-actions.mjs`, `summary-actions.mjs`, `weapon-actions.mjs`.
- Prévia e regressão: `scripts/build-sheet-preview.mjs`, `preview/ficha-visual.html`, `tests/system.test.mjs`.
- Versões e documentação: `system.json`, `package.json`, `src/config.mjs`, AGENTS, README, CHANGELOG e RELEASE-NOTES.

Sem publicação, alteração de mundos ou início de RES-002. A correção deve ser aplicada sobre a 0.9.1, preservando o histórico Git local.
