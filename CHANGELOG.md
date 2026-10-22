# Histórico de versões

## 0.3.0 — 2026-10-22

- Reorganiza a ficha: remove Combate e Evolução; separa Poderes e Aptidões na mesma aba. Retira favoritos e controles adiados para os futuros HUDs. Fontes mostra somente os livros.
- Adiciona seleção de patente, incluindo Nukenin, e busca de clãs/hijutsus por parte do nome. Exibe deslocamento padrão e voo.
- Contabiliza pontos de perícias, Yin/Yang, poderes e aptidões; valida limites e compras. O mestre configura progressão de 2, 3 ou 4 pontos de poder e regras opcionais.
- Perícias rolam 2d8 ou simulam 4/8/16 conforme os requisitos publicados; ações sociais rolam diretamente com escolha de atributo junto ao botão.
- Adiciona catálogos de armas comuns e aptidões do Básico/Guia, armazenados no personagem. Implementa ataques, consumo de munição, recarga, manobras, evolução de aptidões, usos por cena/dia e modificadores de técnicas em fluxos específicos.
- Adiciona repetição de testes para Perícia Inata, Resistência Maior e Diligente; a segunda rolagem é obrigatória. Resistências pendentes aguardam aceitar ou repetir antes de resolver a condição.
- Clone 2 usa a quantidade total ativa: até duas cópias com −3 nos testes; da terceira à sexta, todas falham automaticamente em combate. Gerador de clones comuns e divisão/devolução de chakra de Kage Bunshin.
- Chute Duplo recebe +2 somente na parcela do primeiro golpe; Domínio da Água usa uma reserva individual, conforme decisões da mesa.
- 72 testes de código e 24 verificações locais de navegador aprovados. O escopo nativo do Foundry continua pendente. Automação de aptidões/armas não é integral; limitações descritas nas notas e no registro de desenvolvimento.

## 0.2.3 — 2026-10-22

- Remove o botão de editar ao lado de cada condição no resumo. O botão Gerenciar continua abrindo o painel de ativação/desativação.

## 0.2.2 — 2026-10-22

- Limita vida e chakra atuais aos máximos ao salvar, inclusive em atualizações de documentos; corrige excessos existentes na sincronização conduzida pelo mestre. Preserva valores negativos válidos.
- Adiciona botão Descansar, prévia das recuperações e confirmação de 8 horas sem interrupção. Aplica as fórmulas do Básico e remove fadiga/exaustão sem duração própria.
- Simplifica o painel de condições para um botão Ativar/Desativar por condição, preservando os efeitos e suas informações ao desativar.
- Retira o checklist contextual dos testes; circunstâncias ficam com a mesa e podem ser refletidas no modificador manual.
- Adiciona aba Mestre exclusiva para livros, versões, regras opcionais, anotações e acesso às regras da casa. Configurações não podem ser abertas por jogadores.
- Amplia a verificação para 41 testes de código e 18 fluxos da prévia.

## 0.2.1 — 2026-10-22

- Destaca atributos abaixo do mínimo ao elevar o NC, com valores atuais, mínimo exigido e pontos necessários. O aviso acompanha a edição dos campos.
- Informa separadamente pontos de atributos restantes/excedentes e o saldo das bases de combate em relação à soma 12, incluindo transferência excessiva.
- Bases de combate só podem ser distribuídas na criação, inclusive para o mestre, conforme decisão da mesa. Na evolução, ficam somente para consulta; a gravação também rejeita redistribuições.
- Verifica avisos de mínimo/saldo e bloqueio das bases na prévia e nos serviços.

## 0.2.0 — 2026-10-21

- Adiciona resumo calculado, bases de combate, deslocamento, vida e chakra máximos, iniciativa e testes com condições.
- Criação com NC 4–20 e orçamento de atributos; evolução com validação e janela de distribuição. Subir de nível não recupera recursos atuais.
- Regras da casa permitem avanço por nível inteiro ou EXP fracionária concedida pelo mestre.
- Adiciona catálogo das condições do Básico, efeitos no Actor, estados derivados, ícones, resistência, agravamento, duração e processamento de turnos com proteção contra repetição.
- Sangrando permite uma tentativa de Vigor por turno; Medicina exige ação padrão por tentativa. Confuso 5–6 preserva reações defensivas, conforme decisões da mesa.
- Acrescenta recuperação, descanso, drenagem forçada e camuflagem total após confirmação de acerto não crítico.
- Preserva fichas antigas para ativação revisada e mantém técnicas/compras manuais. Atualiza testes e documentação dos limites.

## 0.1.2 — 2026-10-21

- Reorganiza ficha, assistente e editores conforme a composição das artes: cabeçalhos compactos, colunas, fontes sem serifa e retrato em tinta sobre papel.
- Biblioteca com lista e prévia lateral; perfil e referências com visual mais discreto.
- Corrige a identificação do Actor pela propriedade estática documentada no Foundry 14. Cadastros pela ficha agora são incorporados ao personagem. Sem criação global como alternativa silenciosa.
- Biblioteca pessoal e modelos compartilhados são contextos diferentes; registros existentes não são apagados ou movidos automaticamente.
- Retira a coluna Treinamento e acrescenta pontos investidos, mantendo precisão manual. Valores antigos de precisão são preservados.
- Restringe os estilos de fonte dos botões ao conteúdo das fichas, preservando a fonte dos controles nativos da janela.
- Adiciona testes para propriedade dos cadastros, biblioteca pessoal/compartilhada, isolamento das fontes e persistência dos pontos de perícia.


## 0.1.1 — 2026-10-21

- Declara Foundry 14.367 no campo `compatibility.verified`, que estava ausente e produzia compatibilidade desconhecida.
- Preserva os limites de instalação na geração 14 e aponta o download para o ZIP da nova versão.
- Acrescenta conferência da declaração de compatibilidade ao teste do manifesto.
- A prévia passa a mostrar a versão diretamente da configuração do sistema.

Reconhecimento e instalação confirmados nos registros do servidor do usuário. Seleção na criação do mundo e funcionamento das fichas ainda aguardam confirmação após a atualização.

## 0.1.0 — 2026-10-21

Primeira versão do sistema, com foco em layout e edição manual.

- Fichas de personagem, criatura vinculada e marionete.
- Abas de resumo, combate, técnicas, perícias, social, equipamento, evolução e história.
- Editores de poder, aptidão, técnica, equipamento e dispositivo.
- Criação guiada de rascunhos, biblioteca do mundo, favoritos e filtros.
- Registros manuais de teste, declaração, defesa e resultado no chat.
- Condições, reservas especiais e vínculos preenchidos manualmente.
- Perfil documental de regras, decisões do mestre e prévia de impacto.
- Tema marfim/grafite, adaptação a janela estreita, rótulos e navegação por teclado.
- Pacote ZIP e manifesto estável para instalar e receber atualizações pelo Foundry.

Não inclui automações de regras, rolagens automáticas, consumo de recursos, cálculo de dano, compêndios transcritos ou integração com módulos externos.
