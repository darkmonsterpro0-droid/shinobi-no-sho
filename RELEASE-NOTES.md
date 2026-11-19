# Shinobi no Sho 0.9.4 — automações de clãs e combate

Atualização de 19/11/2026. Reúne o desenvolvimento preservado desde a última release pública 0.4.0, incluindo ficha, configurações nativas, HUD e os lotes de automação descritos abaixo. A publicação foi autorizada pelo usuário ao pedir o encerramento desta atualização após Yamanaka.

## Implementado

- HUD por ações Padrão, Movimento, Parcial, Livre e Outras, sem contabilizar ações restantes. Usa alvos marcados; o defensor declara antes de ver os dados. A opção de crítico dispensar defesa pertence às configurações da mesa.
- Áreas usam as células efetivamente atingidas, com cobertura mínima de metade da célula; cada ocupante resolve sua defesa. Tratamento privado dos ocupantes ocultos.
- Akimichi: Corpulência no pagamento compartilhado, Baika, Bunbun, Nikudan/Hari, Choudan, Controle de Caloria e pílulas com estoque e consequências.
- Inuzuka: Hakken, Shikakyu, companheiros, Juujin, Tsuuga/Gatsuga, Sotorou/Garouga, Santorou/Ooiga, treinamento e promoção, com as partes assistidas registradas na documentação da família.
- Nara: Shibari/Mane, Kubishibari, sombras preparada/guiada, Shuriken de Sombra, Kageyose, Kage Nui e Kagezukami; custos, defesas, fuga, manutenção, movimento e término no fluxo comum.
- Hachimon: oito Portões, Lótus, Ataque Pesado, excesso de uso, contagem do Portão da Morte e tratamento da perda permanente.
- Yamanaka: Sensor de Mentes, Transmissão Mental, Troca de Mente, Múltipla Troca e Desordem Mental. Controle temporário sem mudar propriedade; precisões físicas do corpo e mentais do Yamanaka; capacidades comuns no menor nível; Chakra do corpo para suas técnicas; reflexo de dano/condições, resistências e término.
- Correções de integração nativa: restauração do tamanho do HUD, campos vazios dos modelos, seleção do formulário e coleções de itens protegidas do Foundry. Pedidos interrompidos podem ser retomados com os custos e dados preservados.

## Validação

515 testes automáticos aprovados, zero falhas. Executados combates simulados em mundo real Foundry 14.370 com contas de mestre e jogador. Os documentos por família registram os cenários e recursos observados; aprovação automática e instalação conferida não certificam todos os fluxos de um mundo.

Em Yamanaka, Player4 realizou Troca e Múltipla, ataque pelo corpo, reação defensiva do controlador, Sensor emprestado e Doton comum de nível 3. Confirmados recuperação da falha inicial, persistência ao reconectar, reflexo de 20 de dano, reação que libera apenas um corpo e dano dividido apenas no corpo escolhido. Sensor/rede e Desordem também tiveram cenários anteriores de várias rodadas como mestre.

Conferência final em0.9.4: o estado fatal preparado manualmente no corpo de teste matou também o Yamanaka de risco e encerrou a ligação. O ataque fatal completo continua distinguido desse ensaio de reconciliação.

## Limites e trabalho posterior

A automação integral dos livros permanece aberta. Outras famílias/hijutsus, ampliações dos pilotos Hyuuga/Uchiha/Aburame e casos nativos restantes estão em docs/FILA-AUTOMACOES.md e nos documentos por família. A variante opcional de troca humana completa, julgamentos de natureza/suicídio, detecção narrativa de mentes e geometrias sem dados suficientes continuam assistidos. Não são inventadas regras para essas decisões.

Nenhum livro, extração privada, credencial, mundo, ficha de teste ou backup acompanha o pacote. Compras e registros existentes são preservados; escolher uma origem não concede automaticamente todas as capacidades. Compatibilidade declarada mantida em Foundry 14.367; as provas deste ciclo são de 14.370.

Manifesto de instalação: https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases/latest/download/system.json

Após atualizar, recarregue todos os clientes do mundo para que mestres e jogadores usem o mesmo código.
