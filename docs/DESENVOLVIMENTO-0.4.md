# Desenvolvimento 0.4.0 — 22/10/2026

## Entregue neste lote

- Interface: botões Usar com espaço adequado; cartões sociais compactos; notas das perícias retiradas sem apagar os dados; aptidões automatizadas sem edição livre; condições explícitas desativáveis no resumo. Bloco Criação e evolução e cartão Regras da mesa retirados. Descansar permanece disponível no rodapé.
- Poderes comuns: catálogo das nove famílias, compra e evolução com orçamento, sequências de efeitos, afinidade elemental, parâmetros, custos e validação de escolhas. Uso gera rolagem e resolução por alvo com confirmação de defesa, dureza, absorção e vitalidade.
- Efeitos ativos: manutenção explícita, encerramento, condições vinculadas, tentativas de escapar, camuflagem, movimento, cura por turno, dano contínuo, sufocamento, armas criadas e Energizar. Áreas usam inclusão explícita dos alvos pela mesa; não há leitura automática da geometria do mapa.
- Selos: custo próprio por efeito. Misshi cobra 3 uma única vez. Wana cobra 4 mais a técnica real, armazena o teste da criação e reutiliza-o. Souin considera chakra dividido com Kage Bunshins.
- Inventário: seis armaduras, 29 utilitários/consumíveis e 39 registros de venenos entre as edições. Equipar valida requisitos, absorção recebe dano e se esgota; carga e penalidades são calculadas.
- Químico e venenos: requisitos, fabricação, doses, aplicação, latência, testes de resistência, reexposição, tratamento e antídotos. Preço, tempo, acesso a materiais e contato efetivo precisam ser confirmados pela mesa.
- Pílulas: consumo, recuperação limitada ao máximo e efeitos colaterais. Descansar não zera doses; só o mestre pode zerar o contador.
- Tamanho: dez categorias, modificadores de atributos efetivos, alcance e movimento; tamanho temporário não altera valores permanentes comprados.
- Dureza e camuflagem: resolução física compartilhada entre armas e poderes, relações elementais, camuflagens separadas por origem e proteção contra repetição da mesma aplicação no mesmo alvo.

## Cobertura que ainda não é integral

Estes pontos permanecem trabalho de implementação, não regras que foram deliberadamente delegadas ao mestre:

- Tarja colada: sequência automática Prestidigitação contra Prontidão, toque, armazenamento no corpo e detonação posterior. O controle atual descreve a sequência, mas sua rolagem de toque ainda não encadeia todas essas etapas.
- Kunai com tarja: estoque de kunais previamente preparadas, consumo integrado do projétil e ocupação específica. Tarjas e dano da explosão já são calculados.
- Makibishi: entrada na área, metros atravessados e dano por metro. A área e sua regra são informadas; não há região automatizada.
- Inflamável contínuo: gatilho posterior de ignição. Purificar: além dos efeitos de área registrados, falta o fluxo para venenos ambientais avulsos.
- Lâmina de Raios: benefício de Investida/surpresa e manutenção após abater capanga. Pele de Pedra: execução conjunta gratuita com Energizar. Deslocamento no Vácuo: aplicação da evolução em vários alvos.
- Orçamento compartilhado de projéteis/alvos de uma única execução entre fichas diferentes. Cada confirmação valida o valor individual; a mesa ainda deve conferir o total distribuído.
- Repelir como proteção encadeada ao ataque recebido; geometria das barreiras e paredes de Kekkai; etapas e cronômetros longos dos rituais Shiki/Shishou.
- Integrações de aptidões ainda pendentes da versão 0.3, incluindo Clone Verdadeiro/Perfeito e Rashoumon. Catálogo não equivale a automação integral.

Fora do lote por pedido do usuário: armas especiais, aptidões de hijutsu, HUDs completos e dano de queda. Dureza, camuflagem e tamanho fazem parte deste lote.

## Limites de execução

As operações respeitam propriedade da ficha. A mesa confirma defesa, alvos, contato, distância e circunstâncias que não têm integração com o mapa. Registros evitam duplicação no mesmo alvo; concorrência de dois clientes reais, reconexão e persistência no Foundry ainda precisam ser verificadas. Os testes locais não demonstram essas propriedades em uma sessão nativa.
