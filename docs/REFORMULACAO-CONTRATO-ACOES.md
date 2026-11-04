# Reformulação — etapa 3: contrato proposto das ações

Registro histórico do planejamento. A implementação posterior do piloto de armas/manobras nas etapas 4–6 está descrita em [DESENVOLVIMENTO-0.5.md](DESENVOLVIMENTO-0.5.md); os itens abaixo não constituem declaração de cobertura integral.

Estado: contrato preliminar com decisões D01–D03 confirmadas pelo usuário, sem implementação. Base: 0.4.0, commit `4fd97a37ba2049c00bd5b5f30d2e13a61b66f539`.

## Objetivo

Ficha, HUD, chat e hotbar devem chamar o mesmo serviço. Uma configuração salva elimina a repetição de escolhas estáveis; cada uso cria uma execução independente. Regras específicas de Shinobi permanecem no adaptador. A configuração de campanha define livros, variantes, permissões e nível de aplicação permitido.

## Quatro objetos separados

| Objeto | Conteúdo | Persistência proposta |
|---|---|---|
| Definição | Tipo da ação, parâmetros aceitos e resolvedor do adaptador | Catálogo/código do sistema |
| Configuração salva | ID, nome, ícone, referências de origem e opções padrão | Local exato ainda depende da decisão D01 |
| Plano preparado | Valores calculados, requisitos, alternativas, custos e justificativas | Transitório; recalculado quando os dados mudam |
| Execução | ID único, participantes, declarações, versão do contexto, dados rolados, gastos e recibos | Persistente e recuperável; mecanismo técnico a validar no Foundry |

Favorito é uma preferência de acesso. Não é uma cópia dos valores mecânicos nem uma execução. Configuração não contém alvos correntes, resultados de dados, vida, chakra ou dano congelados. Salvar não cria aptidão/arma nova nem consome pontos.

## Forma indicativa, não schema publicado

```json
{
  "schemaVersion": 1,
  "id": "acao-estavel",
  "name": "Kunai — Ataque Poderoso",
  "definition": "shinobi.weaponAttack",
  "source": {"actorUuid": "Actor.exemplo", "itemId": "arma-exemplo"},
  "defaults": {
    "mode": "melee",
    "maneuvers": [{"key": "ataque-poderoso", "scope": "action"}]
  },
  "askOnUse": [],
  "favorite": true
}
```

Lista de modificadores permite representar exceções e escopo por golpe; não autoriza combinações livremente. O adaptador valida cada uma. Ataques desarmados usam uma origem especial explícita, não um Item fictício persistido. Nomes são rótulos; IDs e versão/origem de regra identificam comportamento.

## Operações do serviço

| Operação proposta | Responsabilidade | Pode alterar ficha? |
|---|---|---|
| listAvailable | Listar ações e motivos de indisponibilidade, sem revelar dados privados | Não |
| prepare | Resolver referências e calcular opções/valores do estado atual | Não |
| validate | Conferir propriedade, recursos, requisitos e contexto | Não |
| declare | Registrar intenção e opções assumidas; reunir declarações necessárias | Somente registro da execução |
| initiate | Efetivar o início conforme o adaptador; consumir exatamente os custos devidos nessa fase | Sim, com recibo |
| resolve | Realizar testes nos pontos e na ordem definidos pelo adaptador | Dados e registros |
| proposeConsequences | Calcular dano/efeitos e listar escolhas ainda necessárias | Não altera o alvo |
| apply | Efetivar consequências autorizadas, uma vez por consequência/alvo/golpe | Sim |
| resume | Recuperar execução incompleta e continuar do último recibo válido | Apenas o que ainda falta |
| cancel / correct | Cancelar o que ainda não começou ou corrigir uma operação específica | Conforme recibos e dependências |

`initiate` não tem uma posição universal imposta antes/depois de toda defesa. Cada ação declara seus pontos de custo; a implementação deve respeitar o texto e as decisões da mesa. Na técnica cujo chakra é pago ao iniciar, falha/interrupção posterior não concede reembolso automático. Preparar/editar/fechar antes do início não cobra nada. Uma cobrança distinta de manutenção permanece distinta.

## Estados e participantes

Vocabulário mínimo proposto: rascunho, preparado, declarado, aguardando decisões, iniciado, em resolução, aguardando aplicação, concluído, cancelado e interrompido com recuperação pendente. Estes estados não substituem a sequência de eventos específica da ação. Passos podem existir por alvo e por golpe.

Para um ataque comum do Shinobi: anunciar ataque e opções → registrar as declarações defensivas necessárias → testes na ordem do livro (atacante primeiro, defensores depois quando houver teste) → avaliar → aplicar conforme a configuração. A janela de início/cobrança segue sua regra. Esquiva impõe dificuldade; não cria rolagem defensiva fictícia. Críticos, fracassos, empates e exceções passam pelos resolvedores do adaptador.

Para Giratório: uma execução e um teste de ataque, conjunto de alvos confirmado e declarações defensivas antes dos dados; resultado e aplicação por alvo. Considerar todos os elegíveis, inclusive aliados, quando a regra exigir. Geometria ainda não automatizada precisa de confirmação, sem fingir leitura do mapa.

Para Múltiplo: uma execução com golpes identificados; divisão e ajustes na ordem específica; defesa e consequências de cada golpe, sem cobrar novamente o custo compartilhado. Chute Duplo preserva a decisão da mesa e seu bônus condicional. Não decidir agora uma nova ordem de declaração para exceções que ainda precisem de consulta.

## Invariantes

1. Abrir preparo, salvar configuração e visualizar cálculo não rolam dados nem gastam recursos.
2. Valores atuais são usados no preparo; antes de iniciar/aplicar, mudanças relevantes são verificadas. Alteração invalida a prévia e solicita revisão quando necessária.
3. Após o início, fatos consumados ficam registrados; não reescrever retroativamente dados rolados ou gastos em silêncio. Escolhas futuras seguem o estado e a regra cabíveis.
4. Remoção da arma/aptidão ou mudança de livro torna a configuração revisável. Nunca apagar o atalho ou substituir a origem silenciosamente.
5. Cada gasto e consequência possui chave de execução; cada golpe/alvo possui identidade própria. Repetir pedido retoma o resultado, sem cobrar ou aplicar duas vezes.
6. Contagem de projéteis/alvos é orçamento da execução, não orçamento independente em cada ficha.
7. Filas em memória são auxílio local; não garantem exclusão entre clientes. Autoridade única e revalidação persistida são requisitos a demonstrar na integração real.
8. Permissões conferidas no serviço, não apenas no botão. Jogador não altera ficha alheia; a intenção é encaminhada ao executor autorizado. Informação secreta não deve aparecer em mensagens públicas.
9. Falha entre cobrança, criação de mensagem e aplicação deixa uma execução recuperável; não instruir a mesa a repetir tudo sem verificar recibos.
10. Correção trata alterações específicas e dependências posteriores; não restaura uma ficha inteira por cima de cura/efeitos posteriores.
11. Nenhum novo schema ou migração é aplicado nesta etapa. Propor migração aditiva e reversível quando possível, com prévia de impacto para mudanças destrutivas.
12. Ações salvas não contornam livros habilitados, propriedade, pré-requisitos ou decisões da mesa.

## Responsabilidades Core e adaptador

| Core candidato | Adaptador Shinobi |
|---|---|
| IDs, configurações, parâmetros, referências e apresentação comum | Quais ações, campos e opções existem |
| Estados, participantes, registro e recuperação de execução | Sequência de ataque/defesa, custos e testes |
| Pontos de decisão, permissões e políticas de aplicação | CC/CD/ESQ/LM, 2d8, grau, críticos e exceções |
| Encaminhamento aos resolvedores e controles de revisão | Compatibilidade de aptidões e efeitos dos livros |
| Preferências de acesso e interfaces adaptáveis | Nomes, ícones e tema Shinobi |

São fronteiras propostas: extrair somente após o piloto demonstrar reutilização. Não renomear o ID do sistema nem mover todos os arquivos nesta etapa.

## Reutilização no piloto

- `weaponAttack` e `maneuverPlan`: cálculo e plano, precedidos de validação do estado atual.
- `aptitudeOwned` e validadores de compra/uso: disponibilidade e referências existentes.
- `postAttackRoll`: adaptar postagem para consumir uma execução; não manter execução paralela no HUD.
- `resolveWeaponAttack` e `applyPhysicalDamage`: conservar fórmulas; vincular recibos e autoridade ao contrato.
- `weaponUseView` e acesso pela aptidão: manter como configuração ocasional; acrescentar criação/edição de configuração salva.
- Estados de poderes, inventário, clones e condições continuam em seus formatos até uma migração específica ser necessária.

## Decisões já estabelecidas nesta conversa

- Salvar combinações frequentes para evitar repetir janelas.
- Permitir iniciar pelo ataque ou pela aptidão.
- Recalcular valores com a ficha atual.
- Ficha, HUD e hotbar convergem ao mesmo serviço.
- Preservar decisões dos jogadores/mestre, intervenção manual e dados existentes.

## Decisões de produto confirmadas pelo usuário

| ID | Decisão | Consequência para o contrato |
|---|---|---|
| D01 | Todos que controlam o personagem têm acesso às ações salvas | Configuração pertence ao personagem; acesso respeita as permissões nativas. Não criar cópias mecânicas independentes para cada controlador |
| D02 | Defensor escolhe no cartão; mestre pode responder por ele | Cartão oferece escolhas ao controlador autorizado do alvo e permite resposta do mestre. Não exigir que o defensor esteja online quando o mestre responder |
| D03 | Marcação de padrão, movimento e parcial totalmente manual | Usar ações não marca, consome, renova ou desmarca esses controles automaticamente. A marcação manual não bloqueia a execução. Custos de chakra, munição e outros recursos mantêm regras próprias |

Confirmação explícita recebida nesta conversa em 31/10/2026, horário de Brasília. Estas decisões substituem as alternativas e recomendações anteriores. Novas dúvidas mecânicas ou alternativas relevantes devem ser consultadas com o usuário. O mecanismo técnico de persistência/autoridade será detalhado na implementação, respeitando estas escolhas e a API da versão adotada.

## Critérios de aceitação futuros

| Cenário | Resultado exigido |
|---|---|
| Salvar Kunai + Ataque Poderoso | Sem gasto; novo uso aplica −1 precisão e +1 bônus de dano usando valores atuais |
| Editar uma vez | Não altera a configuração salva sem pedido explícito |
| Arma removida ou requisito perdido | Explica indisponibilidade; não troca arma nem apaga configuração |
| Cancelar preparação | Nenhum gasto ou efeito |
| Interromper após início de técnica | Custo segue regra; sem reembolso automático indevido |
| Defesa ainda não declarada | Não rolar ataque pelo caminho assistido até o defensor autorizado ou o mestre registrar a defesa no cartão |
| Ataque Giratório | Um teste; alvos, defesas e recibos individuais |
| Ataque Múltiplo / Chute Duplo | Parcelas, bônus, sequência e exceções preservados |
| Duplo clique, reconexão, dois clientes | Uma cobrança/aplicação; retomada do ponto persistido |
| Falha depois de gastar | Execução indica o que foi feito e o que falta; repetição não duplica |
| Personagem antigo | Continua funcionando; novas configurações não exigem recalcular tudo |
| Jogador sem propriedade do alvo | Encaminhamento autorizado; sem alteração direta ou vazamento |
| Uso em ficha/HUD/hotbar | Mesmo plano e resolvedor |
| Dois controladores do personagem | Acessam a mesma configuração salva, respeitando permissões |
| Mestre responde pelo defensor | Declaração registrada no cartão com autoria do mestre |
| Marcação manual das ações | Usar ação ou avançar rodada não altera as marcações; controles não bloqueiam o uso |

## Estado da etapa 3

Contrato documentado; D01–D03 confirmadas. A especificação técnica continua revisável e dúvidas futuras devem ser consultadas. Não existe serviço novo implementado; as garantias acima são requisitos de aceitação, não afirmações sobre o código 0.4.0.
