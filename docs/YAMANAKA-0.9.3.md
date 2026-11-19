# Yamanaka — entrega 0.9.4, 19/11/2026

Livro Básico4.1.b pp.196–200. Implementadas as cinco técnicas principais de Shindenshin: Sensor de Mentes, Transmissão Mental, Troca de Mente, Múltipla Troca e Desordem Mental. Origem e compra continuam obrigatórias. A variante opcional de troca humana completa permanece assistida; não é apresentada como automatizada.

## Decisões vigentes da mesa

- Múltipla Troca: reação inicial bem-sucedida libera somente aquele corpo, sem inconsciência do Yamanaka nem liberação do outro.
- Morte de corpo possuído: Yamanaka também morre, encerrando os vínculos.
- Condições prejudiciais internas refletidas acabam com a conexão.
- Atordoado por resistência à natureza termina no fim do próximo turno próprio do Yamanaka. Em Desordem, Atordoado encerra concentração; em Troca a contagem de três sucessos é preservada.
- Desordem com vários corpos divide o dano base como Parceiros, antes do grau, conservando a ordem compartilhada de dureza e absorção.

## Implementação final

A consciência usa as precisões mentais do Yamanaka e as físicas do corpo. Capacidades comuns exigem aquisição em ambas as fichas, usando o menor nível e versões de efeitos comuns; técnicas de clã exclusivas e capacidades do corpo anterior de cadáveres/inanimados ficam indisponíveis. Custos das técnicas corporais saem do corpo. Sensor pode ser emprestado, pagando2Chakra do corpo e usando seu Rastrear. Nenhum atributo, compra ou propriedade é substituído permanentemente.

A reação inicial é declarada antes dos dados por Agilidade/Prontidão. Corpos efetivamente impedidos de reagir seguem sua condição; surpresa é confirmação explícita. Troca tem uma vítima viva e falha de envio até o próximo início próprio. Múltipla exige exatamente dois animais/cadáveres/corpos inanimados até Médio, integridade preparada pela mesa e escolha de um corpo para dano de Parceiro. Não ressuscita nem repõe recursos. O corpo original fica Indefeso. Os corpos seguem a iniciativa do Yamanaka; Inteligência posterior usa a vítima original, a partir do segundo turno sob controle ou após despertar. Fora de combate, relógio de6s.

Ataques, defesas, movimento, saque, poderes e aptidões comuns passam pelos serviços existentes. Declaração de defesa precede dados. Dano efetivo após as proteções do corpo é refletido uma vez na origem como dano mental sem proteção. Condições internas refletem enquanto a ligação existir; seus pulsos não são duplicados. Morte, distância máxima, duração, suicídio declarado, resistências, cena e incapacidades encerram conforme o modo. Recibos e pedidos interrompidos são retomáveis; uma ação suicida cancela antes da tentativa, e uma contrária à natureza permite resistência depois.

## Teste nativo final — Player4 e Player2, R52–53

Player4 recebeu propriedade apenas da ficha TESTE HUD — Yamanaka NC20, conforme autorização. Corpos A/B e Yamanaka de risco são fichas sintéticas novas, sem acesso permanente do jogador. A teve Força18/Int14 e Doton5; a origem tinha Doton3. Os recursos e características foram preparados como fixtures de teste, não como benefício de técnica.

R52: Troca8 contra A móvel; convite privado de Agilidade/Prontidão ao mestre antes de qualquer dado. Agilidade16+natural8=24 contra20, sucesso. OrigemC40→32, Inconsciente/deslocamento0. Avanço para R53 e início próprio removeu a condição sem edição manual; ficha conferida sem condição e deslocamento18.

R53: nova Troca8, origemC32→24. Mestre escolheu Não reagir; HUD ofereceu ataque do corpo A, sem incluir A no seletor de personagens próprios do jogador. Ataque desarmado de A contra B marcado: precisão21/base9, Esquiva declarada pelo mestre antes do natural5, total26 defendido. Sensor emprestado: origemC24 preservado, corpoC58→56, alcance22m. Reconexão preservou ligação e Sensor.

Doton comum: somente nível3 e efeitos comuns Canhão/Orbe/Barreira disponíveis; Ninpou exclusivo do corpo e efeitos Doton4/5 não oferecidos. Canhão3 usou alvo B marcado, defesas antes dos dados e corpoC56→53, origemC24. Natural7+CD12=19 defendido. O pedido foi retomado após corrigir incompatibilidade real da coleção de itens nativa, sem nova cobrança. Corrigidos também campo capabilityData vazio, colisão do nome item com HTMLFormControlsCollection.item e bloqueio indevido dos campos de uso do controlador. Os testes passaram a simular essas características reais.

Contra-ataque de B em A: Player4 recebeu o convite privado e declarou Esquiva; só depois foram revelados natural9+CC23=32/grau2. Dano20 aplicado em A e refletido na origem, ambasV170→150. OrigemC24 preservado. Encerramento livre removeu ligação/Sensor e restaurou deslocamento18.

Múltipla4: A explicitamente animal e corpo escolhido para Parceiros, B explicitamente corpo inanimado com ficha própria. Agilidade de A16+natural7=23 contra20 liberou só A; B permaneceu com botão de ataque. OrigemC24→20 e sem inconsciência de falha de envio. Encerrada, nova Múltipla4 com Não reagir em A controlou ambos; origemC20→16. Contra o Yamanaka de risco marcado, A teve base9/grau2 e aplicou10 após dividir a base; B teve base10/grau1 e aplicou10 integral. Reações individuais antes dos dados. Encerramento livre retirou os controles. OrigemV150/C16; A V150/C53; B V170/C58; riscoV150/C58.

O HUD foi minimizado, alvo marcado e restaurado várias vezes, com largura900 preservada. Capturas externas: yamanaka-hud-restaurado.jpg, yamanaka-reflexo-player4.jpg, yamanaka-multipla-reacao-parcial.jpg, yamanaka-multipla-dois-corpos.jpg.

## Conferência final de morte conjunta — versão0.9.4

O novo túnel permitiu retomar o cenário após a interrupção. Cliente0.9.4 confirmado pelo registro de inicialização. Ao reabrir A, sua Vitalidade ainda era150: a edição do ensaio anterior não havia sido persistida. Pela entrada normal de teclado e saída do campo, a Vitalidade de A foi então gravada em−21; a ficha e o HUD confirmaram Morto automático. A origem Yamanaka de risco passou automaticamente deV150 para−21, preservandoC50. Sua ficha confirmou Morto e a consulta Shindenshin não mostrou controle ativo residual. Não foi alterada a ficha principal do Player4.

Este cenário testa a reconciliação nativa após um estado fatal preparado manualmente; não é apresentado como morte causada por um ataque de combate. O fluxo de dano fatal/reflexo possui teste automático separado. Prova externa: yamanaka-morte-conjunta-094.jpg. Estado final: corpoA−21/C53; risco−21/C50; fonteprincipalV150/C16 e corpoB170/C58.

## Evidência e limites

515 testes automáticos aprovados, zero falhas. Cobrem também morte conjunta, venenos/reflexos, três sucessos não consecutivos, expiração, limites de distância, dano dividido em poderes comuns, custos repetidos e retomada. A confirmação de morte conjunta por ataque, venenos refletidos, todos os casos de proteções, amplificador10, transição entre cenas/elevações e falhas concorrentes distribuídas não foi integralmente repetida no mundo. Não alegar aprovação nativa desses casos com base nos mocks. Sensor/rede R38–41 e Desordem R48–51 têm registros abaixo.

## Histórico do desenvolvimento local 0.9.3

Os blocos seguintes são registros intermediários preservados. Suas antigas listas de pendências, totais de testes e indicações de não instalação são superadas pelo estado final acima.

# Yamanaka — desenvolvimento local 0.9.3

Fonte: Livro Básico 4.1.b, pp. 196–200; regras gerais pp. 86–89. Origem não concede compra automaticamente. Estado de 19/11/2026: implementação parcial; Troca de Mente, Múltipla Troca e Desordem Mental continuam pendentes.

## Sensor de Mentes

Shindenshin adquirido, nível usado mínimo 3; custo fixo 2 chakra, ação parcial, sustentado. Alcance 10m + 2m por nível de Rastrear. Usa regra geral de selos/gestos da p.86, sem exceção expressa no texto do sensor. Manutenção parcial não inventa custo por turno. Encerramento livre, incapacidade de agir, mudança de cena e indisponibilidade da origem encerram o efeito pelo serviço compartilhado.

A mesa informa as consciências detectadas; nenhuma leitura automática de nomes, fichas ou tokens ocultos é feita. Não inventa um teste de detecção nem resistência para o sensor. Nenhuma mensagem ou memória do jogador é transmitida automaticamente.

Validação nativa, mestre Player2: ficha nova TESTE HUD — Yamanaka NC20, Actor76TevemY7R1hlsnU, nível8, Rastrear16. HUD Parcial exibiu alcance42m; V170/C58→56 na ativação, manutenção preservouC56. Ficha registrou um único efeito sustentado com alcance42m. Encerramento preservouC56, sem condições ou poder ativo residual. Compra nível8 e orçamento12/40 preservados. Teste fora do combate, sem token e sem conceder propriedade ao Player4; não é combate Yamanaka concluído. Evidência externa: yamanaka-sensor-ativo.jpg.

## Transmissão Mental

Nível mínimo3, custo igual ao nível usado, padrão, concentração, alcance10+2×Int e capacidade igual ao nível. Fonte e participantes usam os tokens marcados na mesma cena, distância pelas células ocupadas; sem escolha redundante de alvo. A mesa confirma pessoas conhecidas ou no campo de visão. Recepção voluntária não exige teste; quem recusa testa Int contra9+nível+metadeInt arredondada para cima; capanga falha automaticamente. Resistências são individuais, sem ataque CC/CD inventado.

Vínculos de comunicação não concedem propriedade ou controle das fichas. Rede termina na mudança de cena, incapacidade, falha de concentração, falta de manutenção ou encerramento livre. Limpeza conserva registro de encerramento até concluir todos os participantes, para retomar após falha. Se todos bloquearem, o custo permanece e a rede não fica ativa. Mecanismo amplificador pode ser confirmado no nível10 para multiplicar alcance e capacidade por100; consequências do excesso não são quantificadas pelo texto e ficam para a mesa.

Testes automáticos: origem/livro/suspensão, nível/custo/alcance do sensor, manutenção, repetição sem custo duplicado, encerramento; participantes distintos/visíveis/no alcance, recepção voluntária, capanga, sucesso/falha de resistência, tentativa alheia, gasto único, retomada após falha na publicação da resistência, limpeza interrompida e mudança de cena. Suíte465 passou. Instalação mais recente deste lote: backup20261119-062740,312arquivos conferidos,1atualizado após o lote inicial062421. Validação nativa da rede descrita abaixo.

## Correções compartilhadas do lote

- Ataques múltiplos no HUD usam diretamente o único alvo marcado; distribuição por golpe permanece quando há vários marcados.
- Corrigida referência de apresentação do Ataque Pesado que estava no editor do mestre: agora a opção está no uso de poderes ofensivos CC/CD com Portões2+. Editor do mestre abriu nativamente sem alterar a compra.
- Resistências de poderes guardam os dados antes da publicação e retomam sem nova rolagem ou custo se a publicação falhar. Resultados antigos continuam legíveis.

## Pendente

Controle de corpos: precisões mentais/físicas, interseção das capacidades, cancelamento de técnicas, corpo indefeso, reflexo de dano/condições, iniciativa, resistência no segundo turno/despertar, cancelamentos por natureza/suicídio e três sucessos, múltiplos corpos/parceiros e Desordem Mental. Não confundir compra Shindenshin ou os dois modos acima com implementação integral do poder.


## Transmissão Mental nativa — mestre, rodadas38–41

Token da ficha de Yamanaka colocado em3100/2100, iniciativa rolada33 e ajustada pelo mestre para50 para ordenar o cenário. Na rodada38, Defensor e Inuzuka marcados; ambos conhecidos/no campo de visão, Defensor voluntário e Inuzuka recusando. HUD mostrou custo8 e alcance34m. Int do Inuzuka: natural5+12=17 contra23, falha; não houve teste do aliado voluntário. V170/C56→48, sem dano a ninguém.

Recarregar preservou a rede e o custo; a ficha do Defensor mostrou o vínculo de comunicação. Rodada39: manutenção padrão, C48 preservado. Avanço para40 conservou a rede; manutenção omitida na40, avanço para41 removeu o controle Manter do HUD. As fichas de ambos os participantes foram conferidas: sem vínculo residual. Shikakyu do Inuzuka permaneceu ativo, DefensorV31/C51 e YamanakaV170/C48 preservados. Avanços de rodada testaram manutenção, sem executar ações dos demais combatentes. Nenhum erro no console.

Evidências externas: yamanaka-rede-resistencia.jpg, yamanaka-rede-vinculo-defensor.jpg e yamanaka-rede-fim-sem-manutencao.jpg. Ainda sem teste de rede como jogador, amplificador em mundo ou vítima que bloqueia com sucesso no teste nativo (esse sucesso está coberto automaticamente).


## Decisões da mesa — 19/11/2026

As condições prejudiciais internas refletidas pela Troca de Mente acabam com a conexão. Em Desordem Mental, o primeiro Atordoado por resistir a uma ação contrária à natureza encerra a concentração e a técnica. A contagem de três sucessos continua pertinente à Troca de Mente; não mantém Desordem após quebrar a concentração. Decisões confirmadas pelo usuário, ainda em implementação.


Decisão adicional da mesa: Atordoado por resistência à natureza dura até o fim do próximo turno do Yamanaka. A duração própria sobrevive ao cancelamento da Desordem.


## Desordem Mental — implementação em validação

Básico 4.1.b p. 200: nível mínimo 6, ação padrão, custo igual ao nível, concentração, alcance 10 + 2 × Inteligência, uma vítima até nível 7 e até três a partir de 8. Sem ataque CC/CD: cada vítima testa Inteligência imediatamente; capangas e animais explicitamente declarados irracionais não resistem. A origem e a compra continuam necessárias.

A ligação temporária permite ao controlador declarar Golpear/Disparar/Lançar Projétil pelo motor comum, usando o alvo marcado, as precisões do corpo e a defesa antes dos dados. Controlar dois ou mais corpos divide o dano por dois no ponto compartilhado de dureza e absorção. Os convites de defesa dos corpos passam ao Yamanaka, limitados às reações básicas. A propriedade das fichas permanece intacta. O antigo dono não declara ações corporais pelo fluxo durante o controle. A execução no fim do turno é apresentada nos controles; a mesa conduz a ordem dos turnos, sem contador nem bloqueio de ações restantes.

HUD Padrão: ataques por corpo; Movimento: destino por clique; Parcial/Livre: sacar ou guardar conforme a regra de saque do corpo. Movimento verifica cena, permissão, posição salva, distância, paredes e chegada ocupada, sem selecionar novamente a vítima. Apanhar objetos do cenário continua assistido: não são criados itens ou estoques sem uma origem registrada no Foundry.

Ao assumir o corpo, encerra técnicas próprias temporárias do usuário e da vítima, preservando técnicas permanentes, selos guardados, consequências de duração própria e efeitos hostis de terceiros. Desordem não deixa o Yamanaka indefeso nem reflete dano. Perda de concentração, incapacidade, livro/origem indisponível, fim da cena e falta de manutenção encerram todos os vínculos de forma retomável. Ataques pendentes dos corpos são interrompidos; convites defensivos pendentes retornam aos donos originais.

Ações suicidas declaradas cancelam antes de criar o ataque. Ações contrárias à natureza permitem a resistência após a tentativa; somente suicídio tem cancelamento anterior expresso no livro. A resistência usa a dificuldade original menos dois, sem acumular reduções. Primeiro sucesso em Desordem causa Atordoado e encerra a concentração, conforme decisão da mesa. Atordoado persiste até o fim do próximo turno próprio, inclusive após o fim do controle; fora de combate segue turnos de seis segundos.

Suíte geral: 484 testes aprovados, zero falhas. Inclui resistências individuais, custo único, suspensão, alcance, clones, ações do controlador, bloqueio do dono original, dano dividido, ausência de reflexo, manutenção, suicídio, resistência à natureza após dano, duração do Atordoado, saque, movimento, interrupções e retomada da limpeza. Esta etapa ainda não foi instalada nem validada nativamente. Troca de Mente e Múltipla Troca continuam pendentes; seus parâmetros preparatórios não são técnicas disponíveis.


## Desordem Mental nativa — Player2 mestre, rodadas 48–51

Instalação local 0.9.3 com backup 20261119-074342: 317 arquivos conferidos, 16 atualizados. O marcador geral nativeWorldValidated permanece falso; esta evidência cobre apenas o cenário descrito.

R48, turno do Yamanaka: três vítimas marcadas, nenhuma declarada capanga ou animal. Nível 8, alcance 34 m, dificuldade 23, V170/C48→40. Defensor: natural 5 + Int12 = 17, falha. Inuzuka: natural12 + Int12 =24, sucesso e permanece livre. Nara: natural9 + Int12 =21, falha. HUD ofereceu somente Defensor e Nara como corpos controlados. Não houve ataque CC/CD nessa ativação.

Depois do fim do turno do Yamanaka, Defensor atacou o Inuzuka pelo botão do controlador. Defesa Esquiva antes dos dados; natural5 + CC23=28, defendido. Nara foi movido pelo controle Movimento de3500/2300 para3500/2400, sem nova seleção da vítima. Seu ataque desarmado teve natural3 + CC15=18, fracasso automático. Precisões diferentes dos corpos preservadas. Pela ação Parcial do controlador, Kunai do Nara foi sacada; o diálogo passou a oferecê-la nos ataques. Propriedade de nenhuma ficha foi alterada.

R49: manutenção padrão preservou C40. Após encerrar o turno do Yamanaka, Defensor atacou: Antecipar declarado antes dos dados, natural11 + CC23=34 contra24; dano base10, grau2,20 antes da redução,10 aplicados ao Inuzuka (V38→28). Nara lançou3Kunai: natural4 + CD23=27 contra Antecipar25; base11,grau1,6aplicados (V28→22). Foi declarada ação contrária à natureza: somente após o ataque, Nara testou Int contra21, natural6+12=18, falha. Controle continuou. Quantidade inicial6; conferência nativa posterior na ficha do Nara mostrou3Kunai restantes.

No turno próprio do Inuzuka na R49, atacou o Defensor. O convite para o corpo controlado ofereceu Esquiva, Antecipar e Bloqueio; não ofereceu Evadir, Barreira ou técnicas defensivas. Esquiva escolhida; natural7+CC23=30,grau1,10aplicados (DefensorV31→21). Yamanaka foi conferido no HUD: V170/C40, controle dos dois corpos mantido, sem reflexo do dano.

R50: manutenção preservou C40. Defensor tentou nova ação contrária à natureza depois do turno do Yamanaka; natural2+CC23=25, fracasso automático. Resistência posterior de Int21: natural12+12=24, sucesso. Primeiro sucesso encerrou Desordem e removeu os dois controles do HUD. Ficha do Yamanaka mostrou Atordoado automático, V170/C40. R51: condição ainda presente no início do turno próprio; ao finalizar esse turno, desapareceu. Sem condição residual e sem novo erro de console. Erros históricos de07:10(viewport) e07:14(Kagezukami antes da correção) foram preservados; não são falhas deste cenário.

Estado ao fim: R51, Portão da Morte é o marcador ativo; Yamanaka V170/C40 sem controle ou Atordoado; Defensor V21/C51 em3400/2300; Nara V170/C50 em3500/2400, Kunai sacada; Inuzuka V22/C54 com Shikakyu preservado. Avanços Next Round omitiram ações dos combatentes não usados no cenário; não declarar que eles executaram turnos completos.

Evidências externas: yamanaka-desordem-tres-resistencias.jpg, yamanaka-desordem-ataque-antes-defesa.jpg, yamanaka-desordem-dano-metade.jpg, yamanaka-desordem-natureza-resistencia-falha.jpg, yamanaka-desordem-defesa-basica-corpo.jpg, yamanaka-desordem-sem-reflexo-dano.jpg, yamanaka-desordem-atordoado-encerra.jpg e yamanaka-desordem-atordoado-fim-proximo-turno.jpg. Ainda faltam repetição como jogador, recarregamento durante o controle, sucesso nativo de suicídio/cancelamento anterior, falta de manutenção nativa e as duas Trocas de Mente.

Decisão posterior confirmada: dividir o dano base como Parceiros, antes do grau. O teste automático com base5/grau2/divisor2 aplica6, distinguindo essa interpretação da divisão posterior.

## Troca e Múltipla Troca — código concluído em validação nativa

Básico 4.1.b pp.196–200. Troca: padrão, custo igual ao nível, alcance5+Int, duração de1dia/nível, distância máxima100vezes o alcance. Múltipla: mínimo5, custo4, exatamente2corpos Médios ou menores (animal, cadáver ou inanimado),10m,10min/nível, distância máxima1000m. Cada corpo da Múltipla tem suas ações; um deles, escolhido antes de usar, divide seu dano como Parceiro.

Reação inicial declarada pela vítima ou mestre: Agilidade/Prontidão contra dificuldade padrão−3; não existe ataque CC/CD de envio. Impedido, Agarrado, Atordoado, Indefeso ou ataque surpresa explicitamente confirmado dispensam essa reação. Fascinado e simples Desprevenido não dispensam. Falha de envio único deixa o Yamanaka Inconsciente até o início do próximo turno. Na Múltipla, decisão da mesa: libera apenas o corpo que reagiu com sucesso, sem inconsciência ou perda dos outros.

Os corpos seguem a iniciativa do Yamanaka. O turno próprio antigo da vítima não repete condições, dano ou manutenções. Depois de uma rodada completa, no próximo início do Yamanaka, a vítima testa sua própria Inteligência; inconscientes aguardam despertar. Capangas e animais explicitamente irracionais não resistem. Três sucessos de resistência à natureza, consecutivos ou não, encerram a troca; cada sucesso aplica o Atordoado de duração decidida pela mesa. Suicídio cancela antes da ação.

O corpo original fica Indefeso enquanto a consciência atua nos corpos. Precisões físicas vêm do corpo e mentais/sociais do Yamanaka; não há cópia de compras ou concessão de propriedade. Poderes, versões de efeitos e aptidões comuns são limitados à interseção das duas fichas e ao menor nível. Cadáveres/inanimados não aproveitam técnicas da ficha antiga. Corpos desse tipo exigem ficha de integridade preparada pela mesa, sem cura ou criação automática de valores.

Ataques, defesas, custos, dano, movimentos e saque usam serviços compartilhados. Poderes/aptidões comuns usam uma visão temporária dos itens; as fichas compradas permanecem intactas. O Sensor de Mentes é a exceção de Shindenshin disponível durante a transferência:2chakra do corpo, Rastrear do corpo para o alcance, manutenção parcial e encerramento pelo controlador. Outros usos de Shindenshin são recusados enquanto há transferência; Clone Verdadeiro ativo também impede sua entrada.

Dano efetivo após proteções da vítima gera uma dívida de reflexo junto ao mesmo registro de dano. O corpo original recebe dano mental sem dureza, absorção ou Duro de Matar. Inclui ataques, dano confirmado, sangramento e venenos; simples edição de recurso não é tratada como novo dano. A dívida pode ser retomada mesmo após encerrar o vínculo, sem repetir o dano da vítima. Decisão da mesa: morte de qualquer corpo possuído mata o Yamanaka. Vitalidade original a zero encerra a técnica.

Condições manuais têm identificação de causa interna; causas externas não são presumidas internas pelo nome (por exemplo, cegueira por venda). Venenos e efeitos colaterais conhecidos de pílulas são internos. Condições refletidas acabam com a conexão; seu dano periódico vem apenas do corpo, evitando dois pulsos. Encerramento preserva as condições reais da vítima.

Pedidos interrompidos têm Retomar ação, restrito ao solicitante ou mestre. A repetição conserva alvo, custo, dados e identidade de preparações. Sem mensagens de processamento ou contagem de ações. Suíte:511aprovados,0falhas em testes-yamanaka-fechamento.log. Código ainda não instalado nem validado nativamente nesta seção; o registro de rodadas48–51 acima se refere à versão anterior de Desordem.

A troca humana completa opcional de consciências permanece assistida; a automação disponível é a transferência principal descrita nas técnicas. Capacidades comuns que já são assistidas no sistema conservam essa classificação. Diferenças de elevação ou cenas sem medida compartilhada exigem conferência da mesa; não são convertidas em distância inventada.
