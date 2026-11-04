# Etapas 4, 5 e 6 — piloto 0.5.0

Implementação local em 01/11/2026, baseada na 0.4.0. Não publicada no GitHub. As decisões D01–D03 do contrato foram preservadas.

## Etapa 4: preparar e executar

`src/weapon-actions.mjs` reutiliza os cálculos de armas, manobras, condições e bônus existentes. Preparar não rola dados nem altera recursos. Na execução, os valores são conferidos novamente; mudança relevante na ficha exige nova declaração antes de gastar. Custos de munição, recarga e veneno têm recibos no Item para permitir retomada sem cobrança repetida.

`src/action-executions.mjs` registra pedidos e execuções em ChatMessages nativas. O mestre ativo eleito coordena as alterações. Pedidos usam a autoria do documento e verificam propriedade dos participantes. Sem mestre conectado, o uso assistido é recusado antes de gastar. Não há socket próprio nem dependência de módulo externo.

## Etapa 5: ações salvas

O resumo da ficha oferece ações salvas, favoritos e acesso à configuração. É possível salvar arma/manobra, editar, duplicar, excluir e alterar apenas para o uso atual. Todos os controladores acessam a mesma configuração, armazenada em flags do personagem.

São salvas opções estáveis, como arma, manobra e quantidade de golpes; alvos, distância corrente, resultados, precisão e dano não são congelados. Origem removida deixa a configuração indisponível, sem apagá-la. A edição permite escolher outra origem explicitamente.

Para um único alvo com tokens simples e distância confiável, o uso direto dispensa a janela de configuração. Outros casos pedem alvos/distância. Giratório exige confirmar todos os alvos elegíveis, inclusive aliados; a seleção não identifica automaticamente quem deveria estar na área.

## Etapa 6: declaração defensiva

O cartão recebe Esquiva, Bloqueio, Antecipar, técnica ou exceção registrada pelo mestre. O defensor e o mestre podem responder; o atacante não decide pelo defensor sem permissão. Todas as declarações necessárias precedem os dados. Esquiva é fixa; as defesas com teste rolam depois do atacante quando necessário. Críticos e fracassos dispensam testes defensivos indevidos.

Giratório compartilha a rolagem de ataque e mantém resultados/aplicações por alvo. Múltiplo conserva a divisão e a sequência por golpe. Chute Duplo mantém a decisão da mesa sobre o bônus de dano da primeira parcela e o bônus condicional do segundo ataque. Empate repete o confronto do alvo afetado.

Técnicas defensivas abrem seus controles existentes. O controlador precisa iniciar a técnica e confirmar os custos no cartão antes dos dados do atacante. Essa confirmação não cobra novamente nem automatiza efeitos ainda manuais. A integração automática desses custos ao cartão permanece uma alternativa pendente de definição; o piloto preserva o fluxo existente.

Consequências exigem confirmação. Cancelar antes do início não gasta recursos do atacante; custos de técnicas defensivas já iniciadas são preservados. Após o início, o mestre pode encerrar, sem reembolso ou desfazimento automático de efeitos aplicados. Fechar a ficha não apaga o cartão.

## Preservação e limites

Não há migração destrutiva, troca do ID do sistema ou recriação de fichas/itens. As configurações são aditivas. Cartões antigos continuam com seu caminho de resolução. Poderes ofensivos, consumíveis, clones e condições conservam os serviços anteriores; não foram todos migrados ao contrato novo. HUD e hotbar compartilhando esse fluxo pertencem a etapas posteriores.

Ações padrão, movimento e parcial têm marcação inteiramente manual. Não são marcadas, renovadas nem usadas para bloquear ataques automaticamente. Custos materiais continuam separados desses controles.

## Validação e entrega

147 testes de código aprovados, incluindo 23 novos cenários de preparação sem gastos, configurações compartilhadas, permissões, declaração antes dos dados, múltiplos alvos, custos repetidos, retomada após falha de postagem, empate e regras de Chute Duplo. Esses testes usam documentos simulados.

Não houve teste em um mundo real do Foundry nem inspeção visual da interface nova no navegador. A instalação do Chromium falhou neste ambiente. Compatibilidade declarada permanece 14.367 com a evidência anterior. Concorrência entre clientes reais, troca do mestre coordenador, reconexão e callbacks nativos precisam de teste antes da publicação.

A integração GitHub recusou escrita com HTTP 403. Esta entrega é local; nenhuma tag, release ou alteração remota foi publicada.

## Roteiro nativo pendente

1. Em mundo de teste 14.367, abrir fichas antigas e conferir recursos, itens e condições preservados.
2. Com mestre e dois jogadores, salvar “Kunai — Ataque Poderoso”; conferir acesso dos dois controladores e recusa de um terceiro sem propriedade.
3. Declarar ataque; conferir bloqueio dos dados até a defesa e resposta do mestre pelo defensor ausente.
4. Usar Giratório, Múltiplo e Chute Duplo; conferir alvos, ordem, parcelas e aplicações individuais.
5. Reconectar e repetir cliques durante cobrança/aplicação; conferir recibos e ausência de duplicação.
6. Iniciar técnica defensiva pelos controles existentes, confirmar custos, testar fracasso/interrupção e conferir ausência de reembolso automático.
7. Testar teclado, janela estreita, dois mestres e saída do coordenador. Registrar resultados em VALIDACAO.md antes de publicar.
