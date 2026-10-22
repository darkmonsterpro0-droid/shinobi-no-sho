# Automações da versão 0.2.2

## Resumo e progressão

As fórmulas comuns aplicam-se a personagens com cálculos ativos. Criaturas e marionetes mantêm seus valores específicos manuais; bônus e substituições de clãs, poderes e técnicas ainda precisam de implementação própria.

| Valor | Cálculo / fonte |
| --- | --- |
| Pontos iniciais de atributos | 6 × NC − 12, NC 4–20; Básico p.31 |
| Mínimos e máximos | Tabela por NC; máximo comprado igual ao NC; Básico pp.31, 33 |
| CC / CD / ESQ / LM | FOR / DES / AGI / PER + respectiva base; Básico p.35 |
| Bases | Começam em 3; transferir até 2 pontos, conservando a soma 12; Básico p.35 |
| Vitalidade máxima | 10 + 3 × VIG + 5 × NC; Básico p.21 |
| Chakra máximo | 10 + 3 × ESP; Básico p.21 |
| Deslocamento | 10 + metade de AGI, arredondada para cima; ficha p.24 |
| Iniciativa | 1d8 + AGI + precisão de Prontidão; modificadores de condição aplicáveis |
| Esquiva normal | Defesa fixa 9 + precisão; Básico p.256 |

Na criação, todos os pontos de atributos devem ser distribuídos. A janela destaca atributos abaixo do mínimo e informa os pontos necessários, atualizando durante a edição. Bases de combate têm aviso próprio de pontos faltantes/excedentes em relação à soma 12, além do limite de 2 pontos transferidos. Na evolução, o saldo pode ser guardado; investimentos novos priorizam atributos abaixo do mínimo. A evolução não diminui atributos já comprados. Nesta mesa, as bases só podem ser distribuídas durante a criação. Depois ficam somente para consulta, inclusive para o mestre, conforme decisão do usuário em 22/10/2026. A janela abre ao criar uma ficha nativa e ao elevar o NC; também pode ser aberta pelo botão do NC ou **Distribuir / subir NC**.

A escolha entre avanço por nível inteiro e EXP pertence às **Regras da casa**. No primeiro modo, subir cada NC concede 6 pontos de atributos. No segundo, subir o NC muda os limites e o mestre concede EXP separadamente, inclusive frações. Trocar o modo não corrige pontos anteriores retroativamente. Há histórico de concessões e distribuições na ficha.

Fichas antigas exigem revisão e ativação explícita. A ativação preserva recursos atuais, respeitando os máximos. Fichas novas completas começam com vida/chakra cheios; aumentar os máximos na evolução não restaura valores atuais. Perícias conservam precisões manuais existentes; resistências sem precisão informada usam metade do atributo arredondada para cima mais pontos investidos. A restrição de um ponto mínimo é conferida nos usos das cinco perícias restritas. Requisitos adicionais de aptidões continuam sob responsabilidade da mesa.

## Recursos

**Descansar** abre diretamente a prévia da recuperação completa. **Recuperação e chakra** oferece dano letal, cura, recuperação de chakra, gasto, drenagem forçada e descanso completo. As operações registram a alteração no chat. Edições diretas e atualizações dos documentos limitam os recursos atuais aos máximos, preservando valores negativos. O mestre também ajusta excessos antigos na sincronização inicial. Dano recebido com vida positiva para em zero; dano posterior pode torná-la negativa. Vida zero, inconsciência, morrendo, estabilidade, exaustão por chakra e morte são derivados dos limiares do Básico pp.259–260. Drenagem forçada é distinta de gasto comum, que não permite saldo negativo. Cura comum e descanso não ressuscitam.

A recuperação prevista é exibida antes de aplicar. Descanso completo exige confirmação de oito horas sem interrupção significativa: recupera 10 + 2 × VIG de vida e 5 + 2 × ESP de chakra, até os máximos, e remove fadiga/exaustão sem duração própria. Duração específica da fonte é preservada. Frações opcionais de descanso e exceções de hijutsus não são aplicadas automaticamente nesta versão.

## Condições

O catálogo cobre os nomes do Básico pp.276–278, incluindo Paralisado como apresentação de Indefeso, mais os estados de recurso Fora de combate e Morto. Condições cadastradas ficam em Active Effects incorporados ao Actor, sem documentos no diretório de Itens. Consequências automáticas são identificadas como tais e desaparecem quando a causa acaba.

- Penalidades de condições são contextuais e limitadas a −3 por teste. Não diminuem permanentemente os atributos comprados. Fontes repetidas são preservadas; aplica-se a maior gravidade pertinente.
- Fadiga repetida evolui para exaustão/inconsciência. Lento reduz o deslocamento; Impedido e Indefeso o zeram.
- O checklist de contexto foi retirado por decisão da mesa. Fintado e Desprevenido mantêm seus efeitos diretos; circunstâncias como sentidos usados, flanqueamento, tipo de ataque recebido, cobertura e localização do alvo ficam com os participantes. Informe o ajuste no campo Modificador da mesa. Caído mantém a penalidade direta de CC; as defesas circunstanciais são ajustadas manualmente.
- Atordoado conserva reações. Indefeso bloqueia ações e defesas, com a exceção do teste para remover a própria causa. Inconsciência bloqueia testes comuns; a estabilização de Morrendo usa sua exceção expressa.
- Amputado apresenta sua regra para consulta; armas de duas mãos, selos e a exceção de Mestre dos Selos/Prestidigitação 14 são conferidos pela mesa.
- O painel usa um botão Ativar/Desativar por condição; a mesa encerra medo/fascínio quando a fonte ou ameaça determinar. A defesa como reação também encerra Fascinado. A mesa determina retirada, fuga, presença de aliados e ameaças; o sistema não move tokens.
- Confuso rola 1d8 por turno e guarda o comportamento. Em 5–6 mantém reações de defesa, conforme decisão expressa do usuário. Fuga e escolha do alvo mais próximo são conduzidas pela mesa.
- Sangrando causa 2 de vida por nível no início do turno. **Vigor 18: uma tentativa por turno, como reação**, independentemente dos níveis, conforme decisão do usuário. **Medicina 16: ação padrão por tentativa**, com seleção do personagem que realiza o teste. Cada sucesso remove um nível. Remover todo o sangramento de Morrendo produz Estável, sem curar.
- Sufocamento pede Vigor como ação livre a cada turno, com dificuldade da fonte/mestre, aumentando em 1 por turno. Falha aplica o dano fixo informado ou o NC. Depois da inconsciência, o dano continua automaticamente enquanto o sufocamento persistir.
- Resistência à própria fonte ignora suas penalidades, preservando as de outras fontes. A dificuldade e o teste devem vir da técnica ou do mestre. Se houve agravamento, informe a condição inicial para que sucessos voltem pelos estágios publicados antes da remoção.

O mestre ativo processa início/fim de turno no rastreador. Uma marca persistente por fase evita repetir dano ao receber o mesmo evento; pendências são recuperáveis sem aplicar dano novamente. Retroceder o rastreador não desfaz eventos; ao avançar novamente pela mesma fase ela não é reaplicada. O controle de turno fora de combate fica com a mesa. Para durações de cena ou dependentes da fonte, a remoção é explícita.

Camuflagem, localização por sentidos, Sensor, áreas e outras circunstâncias continuam descritos no catálogo para consulta, mas o formulário de testes não coleta mais essas escolhas. A resolução fica com a mesa, conforme pedido do usuário. O serviço anterior de camuflagem permanece para mensagens antigas, sem ser disparado pelos novos testes.

## Aba Mestre

Somente mestres veem a aba e podem abrir as configurações. Ela reúne livros utilizados, versões Social/Senjutsu/Jiton, anotações de regras opcionais e acesso às Regras da casa. O perfil é compartilhado pelo mundo inteiro; editar um personagem não cria um perfil diferente. A seleção de livros e versões é documental, enquanto o avanço por EXP/nível tem efeito mecânico. Anotações de opcionais não criam automações adicionais.

## Limites de resolução

Os novos testes do resumo usam 2d8 e os resultados naturais comuns de sucesso/fracasso automáticos. Testes resistidos, exceções de técnicas e aplicação do dano de ataque não foram automatizados. Os quatro painéis antigos de anotações continuam sem efeitos mecânicos. O controle visual de ações não consome nem repõe ações automaticamente; restrições de condição são verificadas nos novos testes e exibidas na descrição. Não se mede flanqueamento, área, linha de visão ou distância no mapa.

Condições sem fonte definida não recebem uma dificuldade inventada. Perfil documental de livros não substitui fórmulas por versões alternativas. Integração de turnos, efeitos, jogadores simultâneos e módulos precisa de validação dentro do Foundry real; veja [Validação](VALIDACAO.md).
