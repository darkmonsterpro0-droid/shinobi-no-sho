# Shinobi no Sho 0.3.0

Ficha reorganizada, contadores de pontos, rolagens diretas de perícias e ações sociais, catálogos pessoais de armas/aptidões e novos fluxos de uso, evolução e repetição de testes.

**Clone 2:** até dois clones ativos usam −3 nos testes. Ao criar o terceiro, todos passam a falhar automaticamente em testes de combate, até seis. A quantidade ativa determina o comportamento de todas as cópias, inclusive as anteriores. Kage Bunshin divide e devolve chakra e bloqueia sua recuperação natural enquanto mantido.

A aba Mestre reúne configurações, variantes de 2/3/4 pontos de poder e renovação de usos por cena/dia. Os livros ficam na janela Fontes; Combate e Evolução foram retiradas para os HUDs futuros.

## Atualizar

Em **Configuração → Sistemas de Jogo**, use **Verificar atualizações** em Shinobi no Sho. Depois reabra o mundo. Faça uma cópia de segurança do mundo antes de atualizar.

Manifesto estável: https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases/latest/download/system.json

## Escopo e limitações

Esta é a publicação da implementação atual, autorizada pelo usuário. Não representa a conclusão de todas as automações solicitadas. O catálogo não significa que cada efeito está automatizado.

- Clone Verdadeiro/Perfeito, Kuchiyose: Rashoumon, algumas interações de clones, Kousen, explosivos e partes das aptidões/manobras ainda precisam de implementação ou revisão.
- Modificadores de técnicas usam parâmetros originais informados pela mesa. Dano calculado não é aplicado automaticamente ao alvo; ações, alvos e circunstâncias narrativas continuam sob controle da mesa.
- Há opções do mestre que registram autorização enquanto o fluxo correspondente ainda não existe. As ações sociais diretas usam as Regras Sociais Revisadas; a alternativa do Básico ainda não tem fórmulas próprias.
- Armas especiais e aptidões restritas de hijutsu continuam fora deste lote. Alguns detalhes de empunhadura, recarga e sequências de ataques ainda precisam de revisão.
- 72 testes de código e 24 verificações da prévia aprovados. As novas funções ainda não foram executadas em um mundo real do Foundry 14; a compatibilidade declarada permanece 14.367.

Veja docs/DESENVOLVIMENTO-0.3.md para o registro detalhado das pendências.
