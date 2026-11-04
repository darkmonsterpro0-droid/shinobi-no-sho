# Base geral de recursos extras — 0.8.0 local

Escopo autorizado: arquitetura e controle manual de reservas independentes. Nenhuma aptidão foi automatizada neste lote. Não há geração automática de recursos, cálculo de máximos por aptidão, gasto por ação, recuperação ao descansar, absorção de dano ou alteração da Vitalidade/Chakra.

## Apresentação

Personagens com reservas cadastradas e visíveis têm uma faixa de Recursos específicos abaixo de Vitalidade/Chakra, em todas as abas da ficha. Marionetes usam a mesma faixa abaixo de sua estrutura. Fichas sem reservas não recebem cartões vazios.

Cada cartão mostra nome, origem, atual/máximo e unidade. O atual é editável manualmente. Ver usos e efeitos expande anotações separadas sobre usos, benefícios e observações. Essas anotações são somente texto.

O cadastro fica em Recursos e vínculos → + Recurso, ou Gerenciar na faixa de reservas. É possível editar o recurso, ocultá-lo da faixa sem excluí-lo e removê-lo após confirmação. Ocultos continuam no gerenciamento. A remoção não apaga aptidões, poderes, itens ou outras reservas.

Não existe cadastro automático de Resiliência, reserva Akimichi ou outra regra específica. A prévia HTML inclui somente uma Reserva de exemplo, fictícia e manual; novos Actors continuam com a lista vazia.

## Separação arquitetural

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Core | src/core/extra-resources.mjs | Registros, leitura em cópia, validação de dados, operações manuais, permissão e fila de gravação no cliente |
| Adaptador de persistência | src/extra-resources.mjs | Leitura/escrita no Actor e conversão dos campos do editor |
| Apresentação | src/extra-resource-ui.mjs | Cartões e editor sem execução de regras |
| Integração de ficha | src/character-ui.mjs e src/apps.mjs | Posição na ficha e encaminhamento aos serviços |

O Core recebe funções de leitura, gravação, propriedade e geração de ID, operando somente registros genéricos. Um adaptador futuro pode aproveitar a reserva e criar seu serviço específico de uso; nenhuma escolha de regra foi antecipada aqui.

## Persistência compatível

Foi mantido `system.special`, incluindo os campos existentes `id`, `name`, `value`, `max`, `source` e `notes`. O modelo acrescenta somente um objeto extensível `resourceData`, cujo padrão é vazio. A versão 1 e as opções padrão são normalizadas durante a leitura, sem uma rotina de migração que reescreva fichas.

```json
{
  "id": "id-estavel",
  "name": "Reserva manual",
  "value": 3,
  "max": 5,
  "source": "Origem anotada pela mesa",
  "notes": "Observações",
  "resourceData": {
    "schemaVersion": 1,
    "definitionKey": "",
    "originUuid": "",
    "unit": "pontos",
    "uses": "Usos anotados",
    "benefits": "Benefícios anotados",
    "showOnSheet": true
  }
}
```

`definitionKey` e `originUuid` são referências opcionais reservadas à integração futura. Não ativam regras, não procuram aptidões pelo nome e não executam documentos. O editor atual pede uma origem textual; não exige conhecer UUIDs.

Identificadores distinguem reservas, inclusive quando seus nomes são iguais. Versões desconhecidas são preservadas e ficam sem edição por esta implementação. Campos desconhecidos existentes em resourceData são conservados ao editar outros campos; código e efeitos fornecidos por parâmetros não são instalados como automações.

Atual e máximo aceitam número finito ou vazio. Máximo vazio significa não informado; zero continua sendo zero. Um máximo informado não pode ser negativo, e o atual não pode excedê-lo. Entradas inválidas são recusadas, sem limitar ou corrigir valores silenciosamente. Frações e atuais negativos permanecem possíveis no serviço genérico, sem impor antecipadamente a regra de uma aptidão futura.

## Uso pelo código

```js
const service = game.shinobi.extraResources;
const reserve = await service.save(actor, {
  name: "Reserva manual",
  value: 3,
  max: 5,
  source: "Origem anotada",
  resourceData: {unit: "pontos", uses: "", benefits: ""}
});
await service.setValue(actor, reserve.id, 2); // alteração manual explícita
const copy = service.get(actor, reserve.id);
```

As gravações exigem propriedade do personagem. Alterar uma cópia retornada não grava nada. Edições de um mesmo Actor são enfileiradas no cliente para não perder duas operações locais simultâneas. Isso não representa trava distribuída entre jogadores; concorrência entre clientes reais continua na validação nativa pendente.

## Evidência

176 testes de código passaram, incluindo 12 novos cenários para preservação de registros antigos, independência da Vitalidade/Chakra, referências, nomes repetidos, entradas inválidas, permissões, versões futuras, gravações locais concorrentes, editor, edição direta e remoção. O teste de descanso existente foi ampliado para conferir que reservas manuais permanecem iguais.

Os testes de integração usam documentos simulados. Não houve execução em mundo real, inspeção visual concluída ou publicação remota. As limitações registradas em FICHA-0.7.md e DESENVOLVIMENTO-0.6.md continuam válidas. O pacote é local e mantém a compatibilidade declarada 14.367 sem ampliar a evidência de teste nativo.
