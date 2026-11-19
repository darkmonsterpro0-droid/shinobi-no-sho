# Hachimon Tonkou — desenvolvimento local 0.9.3

Fonte: Livro Básico 4.1.b, pp. 202–207; Ataque Progressivo, p. 69. Estado de 19/11/2026: implementação em andamento, sem publicação. Testes automáticos e instalação não equivalem à validação em mundo.

## Implementado e coberto por testes automáticos

- Compra exige Vigor 6, limite de NC e livro habilitado. Outro clã/hijutsu limita a compra ao primeiro nível, salvo regra da mesa que amplia a combinação. Escolher origem não concede o poder.
- Oito portões, nível comprado até 10. Bônus substituem os anteriores; Força dobrada apenas na parcela de dano, Agilidade para seus testes e deslocamento, sem aumentar Esquiva. Bônus de tamanho e da arma continuam; bônus de dano incompatíveis são suspensos.
- Abertura gradual não renova duração: 2 turnos no nível comprado 1; 5 nos demais. Nesta implementação, a ação depende da quantidade de portões recém-abertos: até metade dos possíveis, arredondada para cima, parcial; acima disso, movimento. Ações não são contabilizadas.
- Custo de chakra zero. Desgaste imediato e no começo dos turnos seguintes, encerrando automaticamente em Vitalidade zero. Recibos impedem gasto duplicado; relógio fora de combate usa períodos de seis segundos. O desgaste não liberta de Fascinar. A dificuldade das resistências a Genjutsu acompanha o portão atual sem alterar a dificuldade original da ilusão.
- Acelerado/Super Acelerado pelo fluxo compartilhado. Segundo portão e superiores suprimem fadiga/exaustão reversivelmente, inclusive a exaustão por chakra zero. Condições anteriores retornam ao fechar.
- Cansaço proporcional ao maior portão aberto, espera de um turno completo para reabrir, terceiro uso na cena deixa exausto por um dia. Insistência causa inconsciência após fechar e perda permanente de Vitalidade, recuperável com Iryou de nível equivalente ao portão. O livro não define duração da inconsciência: não se inventou prazo automático.
- Portão da Morte: ao fechar, exausto e paralisado por três turnos; então morto. Não há botão de encerramento antecipado dessa contagem.
- Estilo da Lótus: duas manobras do Básico escolhidas por compra, pré-requisitos originais verificados na aquisição, até três compras, escolhas diferentes. Concessões derivadas com identificação da compra de origem, disponíveis somente com portões abertos e origem/livro não suspensos. Compras próprias de manobras são preservadas. Ataque Progressivo só acumula com os portões quando existe concessão da Lótus disponível. Não se criam cópias permanentes das manobras concedidas.

## Ainda pendente

Revisão dos exemplos de Taijutsu e validações nativas ainda não descritas abaixo: mudança de livros, repetição excessiva, cura, relógio e exceções adicionais de combate. Ataque Pesado já implementado e exercitado como jogador; oitavo Portão conferido pelo mestre em ficha isolada.

Fixture de personagem de teste e evidências ficam fora do pacote distribuído. Não se alteram personagens de campanha para preparar os testes.

## Validação nativa parcial — 19/11/2026, rodadas 28–29

Mundo teste-no-sho, Foundry 14.370, versão local 0.9.3. Nova ficha isolada TESTE HUD — Hachimon NC20 (Actor y4biHOYO6PYB7xPm), token vinculado y0ah2MU0K6oTelvI. Conta Player2 mestre. Controle por Player4 da nova ficha aguarda resposta específica após bloqueio da revisão automática; não foi concedido por outro método.

Kaimon: V170→167, C58 constante, deslocamento18→26m, iniciativa39→41. Duas compras da Lótus cobraram2pontos por par (investidos12→14→16): Múltiplo/Poderoso e Progressivo/Giratório. O segundo par reconheceu o pré-requisito do primeiro; escolhas anteriores saíram dos seletores. O teste encontrou perda de concessões na serialização da ficha para o HUD: corrigida, coberta por teste de interface e instalada com novo backup. Recarregar preservou as compras e o Portão aberto.

Ataque Poderoso concedido pela Lótus: alvo Defensor marcado a1m, Antecipar declarado antes dos dados; precisão14, natural11, total25 contra18, base7/grau2, dano14. A ficha do Defensor passou de95 a81 de Vitalidade. Teste como mestre, sem alegar experiência de jogador nesse fluxo.

Fadiga manual anterior: deslocamento26→13. Kyūmon gradual: V167→165, C58 constante, imunidade retomou26m, duração ainda5. Próximo turno R29: desgaste único de2, V163, duração4. Shōmon: V163→159, deslocamento27m, sem renovar duração. Encerrar pelo HUD Livre restaurou a fadiga anterior, acrescentou fadiga própria e derivou Exausto/Lento, deslocamento9m, iniciativa39. As quatro manobras concedidas desapareceram do seletor sem apagar as duas compras.

Evidências externas ao pacote: hachimon-lotus-manobras-hud.jpg, hachimon-lotus-ataque-poderoso.jpg e hachimon-fadiga-retornada-encerramento.jpg. Suíte atual:451 testes passaram. Instalação mais recente: backup20261119-050459,311arquivos conferidos,4atualizados. Ainda não valida todo o Hachimon: Ataque Pesado, Portão8, repetição excessiva/cura e múltiplas sessões continuam pendentes em mundo.

Permissão resolvida: o usuário confirmou expressamente Owner para Player4 na ficha isolada de Hachimon. Concessão aplicada pela interface; entrada Hachimon NC20 apareceu no grupo Owner e no HUD de Player4. Outros acessos não foram alterados.

## Ataque Pesado — implementação

Fonte: Básico4.1.b pp.204–205,207. Modificador no ataque da arma/desarmado e em poderes ofensivos que usam CC/CD. Só inicia a partir do segundo Portão e com alvos/área no fluxo compartilhado. O defensor declara antes dos dados. O início do ataque fecha os Portões, cobra de uma vez o desgaste dos turnos futuros e cria Exausto pelo prazo próprio de cansaço; consequências do oitavo Portão e uso excessivo continuam prioritárias.

Grau mínimo = duração restante menos o turno atual; não converte falha de ataque em acerto. Grau4garantido não se torna crítico nos portões2–7. A regra acompanha os demais ataques declarados no mesmo turno, sem renovar Portões nem repetir custo; fora de combate expira em seis segundos. Os bônus de Força do primeiro ataque já declarado ficam congelados em seu plano; depois do fechamento, novos ataques usam os atributos sem Portões e a condição atual, conservando apenas a regra de grau mínimo daquele turno. Não se alteram ataques já resolvidos antes de optar pelo Ataque Pesado.

Bloqueio comum concede sucesso automático ao atacante, inclusive se os dados normalmente seriam fracasso. Outras técnicas defensivas seguem o fluxo usual nos portões2–7. No oitavo, o convite permite registrar o ataque indefensável antes dos dados, sem cobrar uma técnica defensiva impossível. Grau4garantido no oitavo também é crítico automático; a exceção independe da configuração geral de defender críticos. Com menos turnos restantes há sucesso automático, sem inventar crítico garantido. Acerto exige Acrobacia9+2×portão usado para evitar Caído, com recibo por alvo/golpe.

Testes automáticos: custo antes/após declaração, acerto versus erro, Bloqueio com natural2, grau4sem crítico, retomada após interrupção ao publicar dados sem cobrar novamente, grau mínimo em ambos os golpes de Múltiplo, poderes no mesmo turno sem novo desgaste e exceções do oitavo Portão. Suíte458passou antes de dois pequenos ajustes de apresentação de Kage Nui; executar suíte final antes de instalar. Ainda não validado no Foundry.

## Ataque Pesado nativo — Player4, rodada33,19/11/2026

Preparação de posição feita pelo mestre somente nos tokens de teste. Adversário confirmado pela interface como TESTE HUD — Atacante (V42/C10), incluído no encontro com iniciativa10. Hachimon permaneceu na ficha y4biHOYO6PYB7xPm/token y0ah2MU0K6oTelvI, posicionado em2500/2000; Atacante a1m, posição2500/1900. Os cães não foram atacados nem incluídos por engano no combate.

Player4 abriu Kyūmon via Parcial: V159→157,C58,deslocamento26m após suspensão da fadiga anterior. Marcou Atacante e selecionou Ataque Pesado na ação desarmada. A declaração preservou V157 e Portões até a defesa; parâmetros conferidos antes dos dados: grau mínimo4,8de desgaste futuro,Acrobacia13.

Player2 declarou Antecipar. Natural7,precisão15,total22 contra17; grau4sem crítico automático. Base8,32de dano: Atacante42→10. Acrobacia8 contra13 falhou e aplicou Caído. O ataque concluiu apesar das consequências do fechamento no próprio usuário. HachimonV157→149,C58,Portões encerrados,deslocamento0m pelo retorno do cansaço combinado. Nenhum erro novo no console. Conferência posterior da ficha confirmou Fatigado manual, Exausto do Ataque Pesado e Inconsciente derivado da combinação; evidência hachimon-pesado-retorno-fadiga-inconsciente.jpg.

Evidência pré-defesa: hachimon-pesado-defesa-pendente.jpg. O teste expôs um ajuste de apresentação: Ataque Pesado estava apenas nos detalhes da regra. O título da declaração/convite/rolagem agora identifica Ataque Pesado diretamente; suíte458passou, ajuste instalado com backup20261119-055500,311arquivos conferidos,2atualizados. O cenário do oitavo Portão foi conferido posteriormente, abaixo.


## Portão da Morte nativo — mestre, rodadas34–37,19/11/2026

Nova ficha TESTE HUD — Portão da Morte, Actor vxAuhQL72Pj8gH5Q, importada limpa pela interface, sem conceder acesso ao Player4. Token colocado a1m do Akimichi de teste. Iniciativa rolada37 e ajustada pelo mestre para45 para ordenar o cenário; ao abrir Shimon passou a49. V170/C58 preservados, deslocamento18→32m.

Ataque Pesado declarado pelo HUD contra o alvo marcado, título e convite identificaram o modificador. Nenhum dado visível antes da resposta. Convite só ofereceu registrar o ataque indefensável ou exceção do mestre. Depois da resposta: precisão15,natural16,total31,base22,grau4,crítico automático,88dano aplicado. O natural deste cenário também foi crítico; a garantia mesmo com natural2 é evidência automática, não deste combate. Akimichi passou de204a116; Acrobacia26 contra25 evitou Caído.

Portões encerrados uma vez, V170/C58 intactos, Exausto e Paralisado, movimento0. Poderes ativos mostrou3turnos; avanços nativos de rodada34→35→36 mostraram2e1, mantendoV170. Na rodada37 a consequência terminou, V−21 e Morto automático; sem poder ativo residual. Os avanços de rodada serviram para testar o relógio, sem simular ações dos outros combatentes. Console sem erros.

Evidências externas ao pacote: hachimon-portao-morte-golpe.jpg e hachimon-portao-morte-tres-turnos.jpg. Ainda pendem Portão8 com menos duração restante, bloqueios especiais e demais cenários da fila.


## Uso excessivo e tratamento nativos — mestre, rodadas41–46

A fadiga manual do teste anterior foi desativada pela interface somente na ficha de teste, para isolar a nova consequência. Reabertura na rodada41 foi recusada sem custo: avanços de rodada anteriores tinham omitido os turnos próprios do Hachimon. Ao completar o turno41 e chegar ao próprio turno42, Kyumon abriu normalmente: V149→147,C58 constante. Encerramento do terceiro uso na cena criou Exausto por um dia, registrado na ficha; não aplicou Inconsciente nesse cenário isolado.

Durante a terceira abertura, preparação de Ataque Múltiplo com três golpes e um único token marcado conferida nativamente: três destinos internos para o mesmo alvo e nenhum seletor redundante. Não foi declarado nem resolvido esse ataque; dano de três golpes não foi validado nesse passo. Evidência hachimon-multiplo-alvo-marcado.jpg.

Depois de completar a espera no turno43, quarta abertura no44: V147→145,C58,exaurimento anterior suprimido e movimento26m. Fechar causou Inconsciente e Exausto, movimento0, ferimento permanente2 e limite de recuperação168, exigindo Iryou2. Nenhum prazo de despertar inventado. Evidências hachimon-terceiro-uso-exaustao.jpg e hachimon-quarto-uso-perda-permanente.jpg.

Para testar o teto de recuperação, o mestre tentou editar a Vitalidade atual de145para170: o sistema limitou para168, preservando o ferimento e as condições. Isso foi preparação e teste de edição, não cura obtida em combate.

Nova ficha isolada TESTE HUD — Médico Iryou, Medicina16,Ninja Médico,Iryou8, sem conceder acesso ao Player4. Token colocado a1m do paciente. Iniciativa rolada37 e ajustada para55. Na45, tratamento com nível usado1: custo1(C58→57),cura9 por turno. Ao fim do turno próprio do paciente, continuouV168 e ferimento permanente2, com aviso de requisitoIryou2. Tratamento1 encerrado. Na46, tratamento usado2: custo2(C57→55),cura10 por turno. Ao fim do turno do paciente, V168→170 e aviso do ferimento removido. Inconsciente/Exausto preservados, pois tratar o ferimento não define despertar nem remove cansaço de duração própria. Tratamento2 encerrado após a conferência.

Evidências hachimon-iryou-nivel1-limite.jpg e hachimon-iryou-nivel2-ferimento-tratado.jpg. Console contém somente as duas mensagens esperadas da tentativa recusada de reabertura na41; não classificá-las como erro inesperado. Suíte465 aprovada antes deste teste; nenhum código alterado por esse cenário.
