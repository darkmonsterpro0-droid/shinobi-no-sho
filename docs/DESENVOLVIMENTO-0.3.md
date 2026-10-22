# Desenvolvimento local — lote 0.3

Registro da implementação publicada como 0.3.0 por autorização expressa do usuário em 22/10/2026. A publicação disponibiliza o estado atual e não conclui o pedido de automação integral. As pendências abaixo continuam abertas.

## Decisões confirmadas

- 3 pontos de poder: NC 4 = 6, NC 20 = 60 (Guia pp. 88–89).
- 4 pontos de poder: NC 4 = 8, NC 20 = 80 (decisão da mesa). Aplica a proporção à tabela inteira, incluindo o salto de NC 19 para 20.
- Escolhas de atributo/aspecto das ações sociais aparecem na própria ficha. O botão rola diretamente. A escolha é preservada durante a sessão da ficha.
- Transplante Senninka é exceção ao limite diário: Modo Eremita passivo e permanente.
- Dois fracassos automáticos simultâneos em teste resistido repetem ambos os testes. No ataque contra defesa continua valendo a resolução especial do primeiro teste.

## Já integrado localmente

- Navegação sem Combate e Evolução; Poderes e Aptidões em duas áreas.
- Retirada de favoritos e do botão Recuperação e chakra; Descansar continua disponível. Distribuição após criação e concessão de NC/EXP ficam com o mestre.
- Patentes em seleção, com Nukenin; busca nativa de clãs/hijutsus; movimento padrão e voo.
- Fontes contém apenas livros. As decisões antigas pendentes são atualizadas pelo mestre ao abrir o mundo.
- Contadores de perícias, Yin/Yang, poderes e escolhas gratuitas. Limites de pontos por perícia não são confundidos com precisão. Permite corrigir gradualmente fichas antigas excedentes.
- Perícias rolam 2d8 ou usam resultados simulados 4/8/16 nas condições publicadas; simulação comum bloqueada em combate.
- Progressão de poderes 2/3/4 configurável pelo mestre e testada em todos os NC 4–20.
- Experiência opcional por conquistas, de 0 a 100, separada da EXP parcial de atributos. Ao completar 100, zera e abre distribuição do novo NC.
- Catálogo inicial de armas comuns do Básico e revisões/adições do Guia. Registros são Items embutidos no Actor, sem poluir o diretório de Itens.
- Ataque de arma calcula atributo, proficiência individual, alcance, grau/dano, Acuidade, Especialista, Dano Extra, Crítico Aprimorado, Punho de Ferro, Atirador e algumas combinações com Ambidestria. Arremessos simples exigem três ou seis unidades para dano; consumo de projéteis, munição e recarga implementados. Falha de pólvora por erro crítico danifica/destrói a arma conforme seu estado anterior.
- Catálogo de 132 registros de aptidões do Básico/Guia com fontes e requisitos; compra por pontos, três escolhas iniciais elegíveis, aquisição concedida só pelo mestre. Requisitos numéricos comuns conferidos na compra.
- Bônus persistentes derivados de Reflexos, Intuição, Perito, Diligente, Velocista, Metabolismo Rápido e Burro de Carga; outros bônus de armas aplicados no ataque. As quatro aptidões banidas não geram bônus nem despesas quando a variante está ativa.

## Trabalho restante após a publicação da implementação atual

- Finalizar a auditoria das aptidões ativas e interações de manobras. Existem serviços de uso/evolução, frequências, repetição de testes e modificadores de técnicas; o catálogo de 132 entradas ainda não equivale a 132 efeitos totalmente automatizados. Algumas aptidões apenas orientam a resolução narrativa. Clone Verdadeiro e Perfeito ainda precisam do gerador, das restrições de técnicas e dos usos compartilhados. Réplica/enganador, transferência de suportes Doton e origem de Suiton por Mizu ainda precisam de fluxos próprios. A quantidade total ativa controla o efeito de Clone em todas as cópias, conforme esclarecimento do usuário.
- Conferir aptidões comuns fora dessas seções, como Kuchiyose: Rashoumon, sem importar aptidões restritas de hijutsu.
- Completar ferramentas/armas comuns ainda ausentes, como Kousen e explosivos; auditar todas as descrições e manobras específicas, empunhadura e combinações de armas diferentes. Completar reparo e recarga rápida de pólvora. Conferir requisitos alternativos e exceções de todas as armas.
- Terminar ligação dos opcionais aos fluxos pertinentes. Há opções que apenas registram autorização do mestre enquanto seus fluxos/técnicas ainda não existem. Não apresentar esses controles como resolução automática de toda a regra.
- Conferir a versão social do Básico versus revisada; as fórmulas atuais de rolagem direta são as revisadas. Completar seleção de origem/versão de aptidões e os conflitos entre revisões.
- Validar alterações no Foundry 14 real. Testes de serviço e navegador não constituem execução nativa do Foundry.
- Futuras correções devem aumentar a versão, sincronizar manifesto/ZIP e preservar todas as releases anteriores.

## Evidências locais

- Testes em `tests/build.test.mjs` cobrem a tabela de poderes completa, contadores, simulações, fracassos simultâneos, atributo social escolhido, bônus e arremessos.
- `scripts/check-preview.mjs` também verifica persistência da opção de quatro pontos, escolha social preservada após rolagem e catálogo/ataque de arma, além dos fluxos anteriores e tamanhos de janela estreitos.
- As extrações integrais dos livros e os dados de autenticação permanecem fora do repositório.

## Implementação de 22/10/2026

- Decisão aplicada: Chute Duplo divide o dano base e acrescenta +2 somente à parcela do primeiro ataque. Domínio da Água armazena água por Actor; usar a reserva não cria novos pontos.
- Clone 2 não exige seletor de versão. Até duas cópias ativas usam −3 nos testes; ao criar a terceira, todas passam a falhar automaticamente em combate, até o máximo de seis. A verificação usa a quantidade ativa, incluindo cópias de outros tipos e cópias criadas anteriormente. O gerador cria Actors vinculados com itens embutidos que representam cópias falsas.
- Penalidade de clone fora do limite comum de −3. As exceções de clone atirador/Mizu dependem de haver uma única cópia. Acima de duas cópias ativas, todas falham em testes de combate. Sem críticos de capanga contra não-capangas.
- Kage divide chakra com o restante para a origem, cobra 3 de vitalidade por cópia e bloqueia regeneração natural de chakra enquanto há cópias ativas. Desfazer devolve o chakra restante; recibos na origem evitam devolução repetida. Condições herdadas não são devolvidas novamente junto com as causas de fadiga. Fluxos com falha de conexão e dois clientes ainda precisam da validação nativa.
- Perícia Inata, Resistência Maior e Diligente têm serviços de repetição. A segunda rolagem é obrigatória. Resistência Maior adia a resolução da condição até aceitar ou repetir; um primeiro sucesso pode ser perdido por uma segunda falha. Diligente usa a atualização nativa da iniciativa e possui limite por cena.
- Corrigidas a abertura de manobras desarmadas, a seleção inicial da manobra, a validação de evoluções criadas diretamente e a conferência de impedimentos antes de gastar recursos de aptidões.
- 72 testes automatizados passaram. Playwright passou 24 verificações locais, incluindo criação/desfazimento de Clone e a transição de duas para três cópias, custos/divisão/devolução de Kage e controles em 320/420 px. Não são testes dentro do Foundry.
- Controle nativo indisponível nesta continuação: a ferramenta retornou `failed to write kernel assets ... os error 3`; a inspeção de navegador não encontrou sessão do Foundry. Não houve alteração em mundo do usuário nem instalação local da versão em desenvolvimento.
- Publicação 0.3.0 autorizada pelo usuário em 22/10/2026, com as limitações descritas na release. A validação nativa e o restante da automação continuam pendentes.
