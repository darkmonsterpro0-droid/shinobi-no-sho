# Validação nativa parcial do HUD — 14/11/2026

Ooiga posterior: fluxo em linha de 5 m validado com alvo visível e oculto, uma rolagem e defesas anteriores. O teste revelou diferença real do Roll.toMessage v14 que anulava whisper sob modo public. Corrigidos modo explícito, placeholder de rolagens ocultas, projeções duplicadas do mestre e atualização de convites entre clientes. Revalidado na rodada 14 com ambos os clientes atualizados: ataque 33/grau 2, 50 dano e Vigor 27 ao defensor oculto; Player4 não recebeu identidade, resistência ou aviso genérico de dados. Capturas `evidencias-akimichi/ooiga-oculto-sem-aviso-player4-foundry.png` e `ooiga-oculto-resistencia-gm-foundry.png`. Linha e interrupções continuam assistidas por lacuna do texto. Suíte geral mais recente 411 aprovados, sem falhas; não equivale à conclusão dos demais clãs nem a todos os cenários pendentes.

Atualização de fusões: Sotorou teve dois golpes de 16 dano, com ambas as defesas antes dos dados. Garouga teve corrida, custo e 22 dano após Barreira cuja iniciativa defensiva falhou (27 contra ataque 30), comportamento correto pelo Básico p. 256. Recarregar e separar preservou recursos e restaurou o cão na posição atual do corpo. Santorou uniu dois cães marcados, preservou Vitalidade máxima 170, cobrou chakra 52 → 48 e moveu o perfil derivado para 27 m. Rodadas 10/11 cobraram manutenção 48 → 44 → 40 somente no início do Inuzuka; nenhum cão entrou na iniciativa. Capturas no workspace: `sotorou-dois-golpes-foundry.png`, `garouga-barreira-primeiro-foundry.png`, `santorou-manutencao-foundry.png`, em `evidencias-akimichi`. HUD atualizado manteve borda inferior 792 px ao expandir/recolher. Esses cenários não validam Ooiga, todos os casos de Barreira, evolução e áreas ocultas. Detalhes/pendências atuais em INUZUKA-0.9.3.md; contadores antigos abaixo são históricos.

## Continuação Inuzuka

Registro detalhado em INUZUKA-0.9.3.md: Player4 comum ativou Hakken/Shikakyu, executou Tsuuga/garras e respondeu ao contra-ataque. O trajeto inicialmente permitiu chegada ocupada e foi corrigido; a geometria não deve ser declarada integralmente validada. Na dupla nova de Gatsuga, aproximações por direções diferentes chegaram a células livres a 1 m do alvo, com duas defesas individuais, custos próprios e 14 + 14 de dano. Defensor sintético reposto antes do cenário: 170 → 142 Vitalidade. Captura no workspace: evidencias-akimichi/gatsuga-dupla-foundry.png.

Companheiro criado nativamente com Vitalidade 164/Chakra 52 frente a 170/58 da origem. Juujin cobrou 2 chakra do dono, preservou recursos do animal e copiou atributos/equipamentos permitidos. Em 82/164 Vitalidade permaneceu ativo; em 81 encerrou, removeu réplicas e impediu repetição na cena. Divisor 2 também foi conferido com três kunais: base 7, grau 3, dano 12; estoque 6 → 3. Capturas: companheiro-criado-foundry.png, juujin-transformado-foundry.png, juujin-encerrado-foundry.png e divisor-parceiros-foundry.png.

Avanço até a rodada 9: os avisos antigos da pílula vermelha foram preservados; após a correção da exclusão nativa das flags não surgiram repetições. A última suíte geral tem 391 testes aprovados. Controles de treinamento/promoção e categoria Padrão para ações completas foram acrescentados depois da instalação do combate Gatsuga e aguardam conferência nativa. Fusões, outras famílias e os demais cenários continuam em andamento.

Foundry 14.370, mundo `Teste no sho`, sistema local 0.9.3. Acesso pelo túnel fornecido pelo usuário. Conta Player2 com permissão de mestre, conforme autorizado. Nenhuma publicação, alteração de credenciais ou de propriedade.

## Execução real observada

1. Criação pela interface de `TESTE HUD — Atacante`, NC 4: Força 4, Agilidade 4, Vigor 4, demais atributos 0. Distribuição concluída em 12 pontos; Vitalidade 42, Chakra 10, CC 7, deslocamento 12 m.
2. Duplicação da ficha de teste e colocação de dois tokens adjacentes na cena existente. O token duplicado conservou o nome de seu protótipo; nenhum personagem preexistente foi usado nos ataques. Cena foi despausada para simulação.
3. Primeiro confronto: seleção do atacante, marcação do defensor a 1 m, Ataque desarmado → Declarar ataque pelo HUD. Cartão inicialmente aguardou defesa sem revelar dados. Esquiva declarada por Player2; ataque natural 9, total 16, dano base 2, grau 2. Cartão concluído com 4 de dano aplicado.
4. Segundo confronto: nova declaração pelo HUD, Antecipar escolhido antes dos dados. Ataque natural 7, total 14, defesa rolada 10; grau 1, dano 2 aplicado. Cartão concluído automaticamente.
5. Seleção do token defensor no HUD confirmou Vitalidade 36/42. A ficha original do diretório conservou 42/42, pois os tokens são desvinculados: isso não foi tratado como erro.
6. Recarga do cliente preservou cartões concluídos e Vitalidade 36/42 do token defensor.

## Problema corrigido

Os valores de recursos do HUD herdavam a cor clara das listas de definição do Foundry, quase invisível no pergaminho. Cor computada antes: `rgb(239,230,216)`; após correção: `rgb(40,31,25)`. A regra em `styles/shinobi-manga.css` aplica a tinta do tema a `dt`/`dd` dos recursos e remove sombra herdada. Mantém o tema configurável.

CSS anterior preservado em `evidencias-akimichi/shinobi-manga-antes-teste-hud.css`, fora da distribuição. CSS atualizado instalado e conferido por SHA-256. Captura final em `evidencias-akimichi/hud-foundry-corrigido.png`, no workspace.

## Testes e limites

`node --test tests/*.test.mjs`: 348 aprovados, zero falhas antes da alteração exclusivamente de cor. Não foi criado teste textual que apenas repetisse o CSS; a correção foi verificada no navegador real após recarga.

Esta evidência cobre dois confrontos básicos reais pelo HUD, criação, defesa fixa, defesa rolada, dano e persistência. Não é uma batalha completa com iniciativa e rodadas. Permanecem pendentes: combate por vários turnos, Player4–6 como jogadores comuns, múltiplos clientes controlados, Bloqueio, armas, áreas, manutenção e técnicas Akimichi em mundo. Os dois atores e tokens de teste, cartões e estado despausado da cena foram conservados para reprodução; nenhum dado preexistente foi apagado.

Não se altera `compatibility.verified` apenas por essa amostra.

## Continuação nativa — Akimichi NC20 e área

Contas e mundo reais: Player2 GM, mesmo túnel fornecido pelo usuário. Fichas sintéticas importadas: `TESTE HUD — Akimichi NC20` e `TESTE HUD — Defensor NC20`. A primeira começou com Vitalidade 230/230 e chakra 58/58; a segunda, 170/170 e 58/58. Tokens vinculados. Os dois testes NC4 anteriores permaneceram na cena. Nenhum personagem anterior do usuário foi alterado.

| Rodada | Ação e defesa declarada antes do ataque | Resultado observado |
|---|---|---|
| 1 | Defensor arremessa três kunais; Akimichi declara Barreira Doton e conversão de 2 chakra | Ataque 26, defesa 28, sem dano. Pagamento: 1 chakra e 4 Vitalidade, 227→223 e 58→57. |
| 1 | Akimichi usa Nikudan; defensor declara Bloqueio com Bastão | Movimento nativo de 5 m de distância até 1 m; custo 2 chakra. Ataque 35, defesa 29; 22 de dano, Vitalidade 170→148. Vigor 29 contra dificuldade 25 evita queda. |
| 2 | Defensor golpeia com Bastão; Akimichi declara Esquiva | Ataque 31; dano base 12, grau 1. Resiliência reduz 5: dano 7, Vitalidade 223→216. |
| 2 | Akimichi usa pílula amarela, Baika Grande e Bunbun antes do golpe; defensor declara Antecipar | Pílula: Vitalidade 216→211, chakra 55→58, Força +4. Baika custa 3 chakra. Golpe com precisão 23, base 13, grau 2; ataque 32, defesa 22; dano 26, defensor 148→122. |
| 3 | Defensor usa Sopro Destrutivo em cone; três ocupantes declaram Esquiva, Antecipar e Bloqueio | Um único ataque 28, base 12, grau 3. Primeiro teste NC4 recebe 36 de dano; segundo teste NC4 e Akimichi defendem individualmente. Custo 4 chakra, 58→54. Conjurador não incluído na prévia. |
| 3 | Akimichi usa pílula vermelha e Choudan Nv 8 com Baika Grande; defensor declara Esquiva | Pílula: Vitalidade 211→204, chakra 55→58, Modo Chou, deslocamento 21 m. Choudan custa 3 chakra; precisão 23, base 18, grau 1, ataque 29; dano 18, defensor 122→104. |

Pílulas: kit registrado pela ficha; verde usada antes do encontro (230→227 de Vitalidade, Força +2). Exportação nativa confirmou verde 0, amarela 1, vermelha 1 e recibo. Amarela e vermelha foram usadas pelo HUD em sequência crescente nas rodadas 2 e 3. As durações exibiram 3→2→1→inativo. Depois de três fins de turno da vermelha (início da rodada 6), a ficha mostrou Exausto e Lento automático, movimento 8 m com Baika ainda ativo. Força comprada 20 e CC 23 permaneceram na ficha. Vigor 20 dispensou o teste para se manter consciente; não se testou ainda o prazo de 24 h nem tratamento/dieta no mundo.

Área: região sintética `TESTE HUD — Sopro cônico`, raio 10 m, ângulo 90°, orientação 180°, contorno único e visível. Dimensões dentro do máximo de 16 m da ficha (Básico pp. 94, 101); a região foi desenhada pelo GM para a simulação. A prévia por células incluiu somente os três tokens de teste atingidos. A definição automática do molde e a dimensão visual do token expandido ainda precisam de revisão; esta amostra não comprova todas as geometrias ou configurações de grade.

Falhas descobertas e corrigidas durante o combate:

- Abrir armas equipadas no HUD consultava `system.level` de um valor booleano ao procurar Juuken. Corrigido e acrescentada regressão para kunai, bastão e arco.
- Foundry expande pontos em chaves de objetos, inclusive recibos aninhados. Nikudan descontou os 22 de dano e parou ao concluir o recibo. O identificador passa a ser escapado; leitura compatível recupera recibos antigos expandidos. Após instalar e recarregar, o mesmo cartão concluiu, rolou a resistência pendente e manteve a Vitalidade 148, sem repetir dano, corrida ou custo. Regra reproduzida em teste com expansão recursiva.

Também verificado: Investida com avanço insuficiente recusada antes do custo (porém a corrida foi rolada cedo demais; melhorar a ordem dessa validação). O ataque válido retomou a corrida já preparada.

Capturas no workspace, fora da distribuição: `evidencias-akimichi/pilula-verde-foundry.png`, `barreira-corpulencia-foundry.png`, `nikudan-retomado-foundry.png`, `area-tres-defesas-foundry.png`.

Última suíte: `npm test`, **367 aprovados**, zero falhas. Instalação de 0.9.3 mantida; 297 arquivos conferidos, backup `backups-locais/shinobi-no-sho-antes-akimichi-20261114-221307.zip`. Sem alteração de `verified`, commits ou publicação.

Pendências da autorização completa: contas de jogadores comuns; colisões/diagonais e dimensões do token expandido; controles de manutenção e recuperação no mundo; demais clãs/hijutsus e testes respectivos. O combate sintético foi preservado na rodada 6, sem encerramento ou exclusão.
