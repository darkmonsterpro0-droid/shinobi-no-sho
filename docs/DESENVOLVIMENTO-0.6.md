# Etapas 7, 8 e 9 — candidato local 0.6.0

Atualizado em 01/11/2026. Etapas 7 e 8 implementadas no escopo do piloto de armas/manobras. Etapa 9 parcialmente executada: verificações de código e pacote; validação nativa, visual e publicação pendentes.

## Etapa 7 — ficha, HUD e atalhos

O HUD abre pelo botão no resumo da ficha ou pela ferramenta No Sho nos controles de tokens. É uma aplicação redimensionável. Segue um único token controlado, respeita a propriedade e oferece seletor explícito de personagem. Com vários tokens controlados, exige uma escolha. Sem token controlado, pode usar o personagem atribuído ao usuário.

Exibe Vitalidade, Chakra, marcações manuais, ações favoritas e acesso à ficha, configuração de ataque, condições e recuperação. As demais ações salvas ficam em Gerenciar. A marcação de padrão, movimento e parcial só muda por interação explícita do usuário.

Ficha e HUD chamam a mesma entrada de uso. Alvo e distância são obtidos no momento do uso, ou solicitados quando não há contexto confiável. Giratório sempre exige confirmação do conjunto completo de afetados, inclusive aliados, mesmo que um token esteja selecionado como alvo.

Cada ação pode ser arrastada para a hotbar. O botão Atalho permite escolher posição de 1 a 50 pelo teclado e pede confirmação antes de substituir uma posição ocupada. Cada usuário organiza a própria barra; a configuração mecânica continua compartilhada no personagem.

A macro guarda apenas UUID do personagem e ID da ação. Editar a configuração altera usos futuros do atalho; precisão/dano não são copiados. A macro permanece vinculada ao personagem original, inclusive quando outro token é selecionado. Registros removidos ou permissões revogadas impedem o uso. Macros criadas/editadas pelo usuário não são reescritas silenciosamente.

Permissões nativas de criação e script são verificadas. Sem elas, ficha e HUD continuam disponíveis. Não há macro de mestre executando automaticamente em nome do jogador.

## Etapa 8 — componentes comuns

Armazenamento das configurações, acesso compartilhado, fila/autoridade/persistência das execuções e controles visuais foram extraídos para `src/core/`. Os caminhos antigos passam por esses componentes, sem copiar os dados ou trocar sua estrutura. Regras Shinobi ficam nos serviços específicos.

Detalhes e API em [NO-SHO-CORE.md](NO-SHO-CORE.md). Este é um Core inicial embutido no sistema; outros adaptadores e um pacote independente continuam como trabalho futuro.

## Etapa 9 — evidências e bloqueios

- 164 testes de código passaram, com 17 novos cenários em relação à 0.5.0.
- Cobertura nova: uso comum por referência, configuração atual da macro, coalescência de cliques, permissões, posições da barra, cancelamento da substituição, macro editada, escape, escolha do token, campos manuais e preservação de dados antigos/versões desconhecidas.
- A fila foi verificada após erro, e um segundo mestre simulado recuperou pedidos pendentes sem criar uma segunda execução para o mesmo pedido.
- Os testes de documento, aplicação e hooks usam substitutos da API. Não são testes do Foundry real.
- A instalação do Chromium falhou com download inválido/truncado. A nova interface não passou por inspeção visual ou teste de navegador.
- Não há um mundo Foundry acessível neste ambiente. Arrastar real, múltiplos clientes, reconexão, troca de coordenador durante gravação e comportamento em janela estreita permanecem pendentes.
- A nova tentativa de criar branch no GitHub retornou HTTP 403, `Resource not accessible by integration`. Não há branch remota com esta implementação, tag, PR ou release publicada.

As versões locais de package.json, system.json e src/config.mjs são 0.6.0. O ZIP é um candidato para testes. A URL da tag v0.6.0 só funcionará após publicação; não usar o manifesto futuro como se já estivesse disponível.

## Conferência nativa antes de publicar

Usar cópia de um mundo no Foundry 14.367, primeiro sem módulos, preservando a instalação/mundo anteriores.

1. Abrir fichas antigas e conferir recursos, itens, configurações e cartões anteriores. Criar ação salva; fechar, reabrir e reconectar.
2. Abrir HUD pela ficha e pelos controles da cena. Alternar entre token único, múltiplos, sintético, personagem atribuído e usuário sem propriedade.
3. Marcar padrão/movimento/parcial. Usar ataque e avançar turno: as marcações devem permanecer como o usuário deixou.
4. Testar a mesma ação na ficha, no HUD, por arraste e pelo botão Atalho. Conferir mesma declaração, custos e regras.
5. Editar ação; usar macro antiga e conferir novos valores. Remover origem, excluir configuração e revogar propriedade: uso deve explicar a indisponibilidade sem substituir nada.
6. Testar jogador sem criação de macros, posição ocupada, cancelar, teclado, temas, zoom e janelas de 320/420 px. Conferir rótulos e foco.
7. Com mestre e dois jogadores, percorrer defesa, crítico/fracasso, Giratório, Múltiplo e Chute Duplo. Conferir uma cobrança e consequência por alvo/golpe.
8. Clicar simultaneamente, desconectar e trocar o coordenador durante cada fase. Conferir recibos e dados persistidos; registrar qualquer duplicação.
9. Registrar build, clientes e resultados em VALIDACAO.md. Só depois preparar tag/release, conferir permissão da integração, publicar ZIP/manifesto e verificar instalação pelo endereço publicado.

## Pacote local e recuperação do código

O ZIP contém os arquivos do sistema, com system.json na raiz. Para teste manual, extraí-lo na pasta `Data/systems/shinobi-no-sho` de uma instalação de teste com o servidor encerrado. Reiniciar e conferir a versão. Não descompactar por cima de um servidor em execução.

O arquivo `.bundle` entregue separadamente contém o histórico Git completo e o commit da implementação. Para recuperar em outro PC:

```sh
git clone -b reformulacao/acoes-core-hud shinobi-no-sho-etapas-7-9.bundle shinobi-no-sho
```

Não houve alteração de mundos, publicação remota ou migração destrutiva. Poderes ofensivos, consumíveis, clones e outras mecânicas mantêm os caminhos anteriores; este lote não declara automação integral dos livros nem HUD universal pronto para qualquer sistema.
