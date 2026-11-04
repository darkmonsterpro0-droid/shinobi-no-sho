# No Sho Core — extração inicial da etapa 8

Na 0.8.0 local, `src/core/extra-resources.mjs` acrescenta operações de reservas manuais com persistência/permissões injetadas. O adaptador conserva `system.special`; benefícios e usos são texto, sem execução de aptidões. Contrato e limites em [RECURSOS-EXTRAS.md](RECURSOS-EXTRAS.md).

O Core está em `src/core/`, distribuído dentro do sistema atual. Não é ainda um módulo independente nem uma certificação de compatibilidade com outros sistemas. A extração conserva o ID `shinobi-no-sho` e o armazenamento existente.

| Componente comum | Responsabilidade | O que recebe do adaptador |
|---|---|---|
| `action-store.mjs` | Listar, obter, guardar, duplicar, favoritar e excluir configurações com permissão | Namespace, versão e registro já validado mecanicamente |
| `execution.mjs` | Fila serial, eleição de coordenador, autoria, propriedade, persistência do cartão, estados terminais e decisões pendentes | Participantes, critérios de decisão, renderizador e transições específicas |
| `action-access.mjs` | Entrada comum por referência, leitura atual e coalescência de usos simultâneos no cliente | Resolvedor do personagem, listagem e função de uso |
| `action-controls.mjs` | Linhas de ações, recursos e marcações manuais com escape de conteúdo | Nomes, valores, campos, tema/prefixo |

O Core não importa os catálogos Shinobi, não conhece chakra, 2d8, manobras ou fórmulas de dano. A dependência segue do adaptador para o Core.

O adaptador mantém `savedDefaults`, `prepareWeaponAction`, `maneuverPlan`, `weaponAttack`, declaração defensiva, sequência dos golpes, gastos e recibos, cálculo de consequências e integração com os resolvedores existentes. `combat-hud.mjs` monta o modelo visual Shinobi; `action-shortcuts.mjs` conecta referências à hotbar do Foundry.

## API de acesso

Após a inicialização:

```js
// Listagem assíncrona: retorna uma cópia, apenas para controlador autorizado.
await game.noSho.actions.list(actorUuid);

// Mesmo caminho usado pela ficha, pelo HUD e pelas macros.
await game.noSho.actions.use(actorUuid, actionId);

game.noSho.hud.open();
game.noSho.hud.toggle();
```

`game.noSho.apiVersion` é 1; `game.noSho.adapter` identifica o adaptador ativo. A API anterior `game.shinobi.actions.list(actor)` continua síncrona para preservar os consumidores existentes; `game.shinobi.actions.use(actorUuid, actionId)` encaminha ao serviço comum.

A referência identifica um personagem específico. Selecionar outro token não muda o dono de uma macro existente. Uma origem removida ou permissão revogada é recusada no uso, sem procurar uma arma com nome parecido.

Para um adaptador novo, instanciar `createActionStore` com seu namespace e `createActionAccess` com seus serviços. A suíte exercita um segundo namespace sem importar regras Shinobi; isso verifica a separação de código, não uma integração completa com outro sistema instalado.

## Dados e autoridade

Configurações continuam em `flags.shinobi-no-sho.savedActions`, schema 1. Execuções continuam em `flags.shinobi-no-sho.actionExecution` de ChatMessages. Não há migração ou renomeação automática. Versões desconhecidas são preservadas, mesmo quando não podem ser utilizadas pela implementação atual.

Pedidos privados incluem todos os mestres e o solicitante para permitir recuperação pelo coordenador seguinte. Somente o mestre eleito processa; a fila local mantém ordem e continua após erros. Reconexão tenta recuperar pedidos ainda pendentes.

A fila não é um bloqueio distribuído. Mudança de coordenador no meio de uma gravação precisa de validação com clientes reais. Recibos e dados persistidos reduzem repetição, mas testes simulados não provam transações distribuídas.

## Referências de integração

- [Controles de cena v14](https://foundryvtt.com/api/v14/functions/hookEvents.getSceneControlButtons.html): formato com ferramentas indexadas e botão para abrir aplicação.
- [Hotbar drop v14](https://foundryvtt.com/api/v14/functions/hookEvents.hotbarDrop.html): retorno síncrono `false` impede o tratamento padrão do drop da ação.
- [User v14](https://foundryvtt.com/api/v14/classes/foundry.documents.User.html): atribuição da macro à barra pessoal.
- [Macro v14](https://foundryvtt.com/api/v14/classes/foundry.documents.Macro.html): criação e permissões nativas.

As referências consultadas descrevem a API pública v14 disponível; não substituem a execução na build alvo 14.367.
