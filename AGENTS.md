# Regras permanentes deste projeto

- Revisão 0.9.1 autorizada pelo usuário: reorganizar a ficha conforme referências aprovadas, retirar a aba Mestre e centralizar opções globais nas Configurações de Jogo. A ficha de cada jogador segue os settings de mundo existentes. Adquirir/evoluir Bakuton com fonte e requisitos é permitido; execução, técnicas e concessões continuam manuais. Preservar dados e não publicar release. Ver docs/FICHA-0.9.1.md.

- RES-001 autorizada em 05/11/2026: fundação genérica, catálogo e aquisição/evolução de aptidões restritas/especiais sobre a base 0.8.0, sem segundo motor. Esta autorização amplia o escopo antigo de arquitetura apenas manual. Concessões são registros sem aplicação; não automatizar efeitos individuais, gasto/recuperação de reservas, bônus à Vitalidade/Chakra, conversão de itens antigos ou mudanças em mundos. Publicação permanece não autorizada. Ver docs/RES-001.md.

- Base de recursos extras autorizada: somente arquitetura e controle manual. Manter system.special e os registros antigos; benefícios são anotações separadas da reserva. Não automatizar aptidões, criar reservas por aquisição, aplicar bônus à Vitalidade/Chakra, gastar ou recuperar reservas automaticamente nesta etapa. Ver docs/RECURSOS-EXTRAS.md.

- O usuário autorizou reformular a ficha antes de ampliar automações, seguindo as referências visuais corrigidas. Preservar dados, serviços, permissões e marcações manuais. A entrega 0.7.0 é visual e local; ver docs/FICHA-0.7.md. O usuário optou por continuar o desenvolvimento sem validação nativa por enquanto; isso não equivale a teste nativo aprovado.

- Etapas 7–9 autorizadas: integrar HUD/hotbar ao mesmo uso das ações salvas e extrair componentes comuns para src/core sem mover regras Shinobi para o núcleo. Etapa 9 requer separar evidência simulada de teste nativo; publicação permanece bloqueada enquanto faltarem validação no Foundry e permissão da integração. Ver docs/DESENVOLVIMENTO-0.6.md.

- Reformulação autorizada: etapas 4–6 com piloto de armas/manobras. Configurações salvas pertencem ao personagem e são compartilhadas entre seus controladores; defensor escolhe no cartão e mestre pode responder. Marcação de ações padrão/movimento/parcial é totalmente manual, sem renovação nem bloqueio automático. Preservar dados e serviços existentes. Ver docs/DESENVOLVIMENTO-0.5.md para escopo e validação pendente.

- O usuário definiu Foundry 14. Autorizou em 21/10/2026 automatizar o resumo, progressão de atributos/NC, combate derivado, deslocamento, vitalidade, chakra e condições do Básico. Outras compras e resolução de técnicas permanecem manuais até novo pedido.
- Regras da casa devem permitir avanço por nível inteiro ou EXP concedida separadamente pelo mestre. Não classificar essa escolha como regra opcional publicada.
- Seguir os cinco livros fornecidos e as decisões explícitas da mesa. Não criar regras para preencher lacunas.
- Toda release deve aumentar a versão semântica de `system.json`, `package.json` e `src/config.mjs` em conjunto. Nunca substituir o ZIP de uma versão já publicada.
- Usar `node scripts/release.mjs --version NOVA_VERSAO --repo darkmonsterpro0-droid/shinobi-no-sho` para sincronizar a versão e o download com a nova tag.
- O URL estável de instalação é `https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases/latest/download/system.json`. O `download` deve apontar ao ZIP da tag exata.
- Antes de publicar: atualizar CHANGELOG e RELEASE-NOTES, executar testes, executar `node scripts/release.mjs --check --repo darkmonsterpro0-droid/shinobi-no-sho`, conferir pacote e fluxos alterados. Só então commitar, criar tag `vNOVA_VERSAO` e publicar release.
- Manter a compatibilidade declarada para Foundry 14.367. A instalação nessa versão foi confirmada por registros reais; os fluxos dentro do mundo ainda precisam de teste. Registrar evidência e escopo em docs/VALIDACAO.md ao alterar `verified`. Não apresentar uma prévia ou mocks como execução real no Foundry.
- Não incluir PDFs, extrações, credenciais, configurações locais de autenticação ou mundos de usuários no repositório ou pacote.
- A identidade visual aprovada é marfim/grafite/vermelho, bordas discretas de pergaminho, tipografia legível e estrutura das quatro pranchas de conceito. Manter teclado, foco visível e janela estreita.

- Sangrando: uma tentativa de Vigor 18 por turno, independentemente dos níveis; Medicina 16 usa uma ação padrão por tentativa. Confuso 5–6 mantém reações defensivas. Decisões expressas do usuário.

- Decisão de 22/10/2026: bases de combate editáveis somente na criação, inclusive para o mestre. Na evolução, consultar sem redistribuir.

- Decisões de 22/10/2026: painel de condições com um botão Ativar/Desativar por condição; retirar checklist de contexto dos testes, deixando circunstâncias para a mesa e modificador manual. Aba Mestre deve ficar oculta para jogadores. Recursos atuais não podem exceder os máximos.

- Decisões confirmadas em 22/10/2026: variante da mesa de 4 pontos de poder proporcional à tabela publicada: 8 no NC 4 e 80 no NC 20, inclusive o salto final excepcional. Ações sociais com mais de um atributo usam escolha visível junto ao botão e rolam diretamente, sem janela intermediária.
- O usuário autorizou publicar a implementação atual como 0.3.0 em 22/10/2026. Consultar docs/DESENVOLVIMENTO-0.3.md; catálogo não equivale a automação integral de aptidões. Preservar as limitações nas notas; não declarar o pedido original inteiro concluído.

- Decisões de 22/10/2026: Chute Duplo recebe +2 apenas na parcela do primeiro golpe, depois da divisão. Domínio da Água usa reserva individual de cada personagem. Clone 2 segue a quantidade total ativa: até dois clones usam −3 nos testes; ao criar o terceiro, todos passam a falhar automaticamente em combate, até seis. Não há versões distintas misturadas: a população controla o efeito em todas as cópias. Decisão esclarecida pelo usuário.

- Lote seguinte autorizado: ajustes visuais; bloqueio da edição de aptidões automatizadas; poderes comuns e afinidade elemental; armaduras, consumíveis, utilitários, Químico e venenos; tamanho, dureza e camuflagem. Somente dano de queda fica para o HUD do mestre. Armas especiais e hijutsus permanecem fora do lote.
- Pílulas do soldado: o mestre zera a contagem manualmente. Descanso não zera doses nem encerra a intoxicação de duração própria.
- Equipamentos: suas penalidades ficam fora do limite de −3 das condições, inclusive armadura sem treinamento e falta de kit.
- Selos: cada efeito tem seu próprio custo. Misshi custa 3 chakra no total; não cobrar 3 ao preparar e mais 3 ao ativar. Preservar custos explicitamente separados, como Bakudan e armazenamento de jutsu.
