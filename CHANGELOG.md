# 0.9.4 — 2026-11-19 — automações e combate

- Consolida os desenvolvimentos locais de ficha, configurações nativas, aquisição restrita, HUD, áreas e defesa declarada antes dos dados.
- Integra os lotes Akimichi, Inuzuka, Nara, Hachimon e Yamanaka aos serviços compartilhados; escopo e assistência documentados por família.
- Troca/Múltipla: reação inicial antes dos dados, controle temporário sem propriedade, precisões separadas, técnicas comuns no menor nível e recursos do corpo, reflexo de dano/condições, resistência posterior, duração e limpeza.
- Decisões da mesa: reação na Múltipla libera somente aquele corpo; morte do corpo possuído mata o Yamanaka; condições internas refletidas terminam com a ligação; Atordoado até fim do próximo turno próprio e encerra Desordem; divisão do dano base como Parceiros; Kage Nui soma agulhas por alvo antes das proteções.
- Corrige restauração do HUD, filtros sobre campos vazios, formulário de capacidade comum e leitura das coleções nativas protegidas. Poderes ofensivos dos corpos também respeitam o divisor escolhido.
- 515 testes automáticos aprovados; combates nativos Foundry 14.370 com mestre/jogador registrados em docs/VALIDACAO.md e documentos por família. Limites nativos e demais automações permanecem explícitos.

Os registros abaixo descrevem entregas locais históricas; suas antigas restrições de escopo/publicação foram ampliadas pelos pedidos posteriores do usuário.

# 0.9.2 — configurações na própria tela nativa, candidato local

## 0.9.3 — Piloto RES-002 local, sem publicação

- Byakugan e Sharingan: ativação explícita, 1 chakra, duração por cena, encerramento e pedidos repetidos sem novo gasto enquanto ativos.
- Nidan: Intuição derivada enquanto Sharingan estiver ativo, sem duplicar compra própria e com suspensão por origem/livro/requisito.
- Aburame: capacidade publicada por espécie, vínculo por ID e recusa de reserva compartilhada entre espécies; sem gasto/recuperação automáticos.
- Validação nativa e Cartographer adiados pelo usuário; técnicas e efeitos contextuais seguem assistidos.


- Remove o submenu Regras do mundo e registra livros/variantes/regras com `config: true`, escopo de mundo e tipos nativos.
- Preserva profile/houseRules antigos como fallback; campos individuais passam a orientar consultas, orçamento e validação sem copiar regras para personagens.
- Leituras compartilhadas e escritores de compatibilidade mantêm dados desconhecidos, decisões e fontes futuras. Nenhuma migração de Actor/Item.
- Atalhos antigos de configuração encaminham para o formulário nativo; aparência permanece individual.
- Contadores de cena/dia permanecem disponíveis como campos nativos; não renovam ações nem reservas.
- Ver docs/CONFIGURACOES-0.9.2.md. Sem publicação ou automações RES-002.

# 0.9.1 — organização da ficha e aquisição de Bakuton, candidato local

- Retira a aba Mestre e o atalho global da ficha. Configurações de Jogo concentram livros, variantes, regras opcionais, decisões e renovação de períodos.
- Conserva retrato lateral, sete atributos, Vitalidade/Chakra, seis abas e temas da referência aprovada. Edição da identidade, manutenção de itens, opções de testes e ações salvas passam a aparecer sob demanda.
- Entrada única para aquisição de poderes/aptidões/técnicas e equipamentos; técnicas manuais existentes passam a ter lista própria.
- Bakuton aparece para sua origem e livro; compra/evolução validam Espírito 3, NC, orçamento, duplicidade e restrição de elementos. Técnicas e concessões permanecem manuais (Hijutsus II pp. 18–19).
- Sem migração ou automações individuais de clãs. Ver docs/FICHA-0.9.1.md para evidências e limitações.

# 0.9.0 — RES-001, desenvolvimento local não publicado

- Catálogo por fonte de 139 definições restritas/especiais dos quatro livros; 39 com revisão manual de aquisição.
- Origens explícitas, elegibilidade, aquisição e evolução no motor comum, com incompatibilidades, quota gratuita e revisão do mestre.
- Contrato genérico de proveniência e suspensão reversível; vínculos por ID às reservas existentes. Sem aplicar benefícios ou consumir/recuperar recursos.
- Catálogo e consulta na aba atual de aptidões; sem reconstruir ficha/HUD.
- 207 testes de código executados e aprovados (176 regressões recuperadas, 31 novos). Foundry 14.367 nativo e testes visuais/humanos pendentes.
- Ver docs/RES-001.md e docs/RES-001-INVENTARIO.md para escopo e limites.

# 0.8.0 — base de recursos extras, local e não publicada

- Base genérica no Core para reservas manuais, com adaptador que preserva system.special e os cadastros antigos.
- Cartões abaixo dos recursos principais, com atual editável, máximo opcional, unidade e origem; usos/benefícios em anotações separadas.
- Cadastro, edição, visibilidade e remoção confirmada; sem automação de aptidões ou alteração automática da Vitalidade/Chakra.
- 176 testes de código aprovados. A recuperação comum não renova as reservas manuais. Validação nativa e visual pendentes.

# 0.7.0 — reformulação visual local, não publicada

- Reorganiza a ficha com identidade e condições na lateral e recursos visíveis em todas as abas.
- Novo Resumo com atributos, combate, movimento, ações manuais e acesso rápido às configurações salvas e aos registros existentes.
- Temas marfim/grafite e estilos adaptativos; prévia visual independente em HTML com o mesmo renderizador.
- Preserva campos, permissões, regras e dados; não amplia as automações.
- 164 testes de código aprovados; conferência das abas sem duplicação de campos. Inspeção visual e validação nativa pendentes, conforme docs/FICHA-0.7.md.

# 0.6.0 — 2026-11-01 — candidato local, não publicado

- HUD com seleção do personagem, recursos, ações favoritas e marcações manuais.
- Ficha, HUD e macros chamam o mesmo uso; atalhos por arraste ou escolha de posição na barra pessoal.
- Extração inicial de armazenamento, acesso, fluxo e controles comuns para src/core, preservando namespace e registros antigos.
- Pedidos visíveis aos mestres permitem retomada pelo coordenador seguinte; Giratório exige confirmação do conjunto de alvos.
- 164 testes de código aprovados. Validação nativa/visual e publicação pendentes; etapa 9 parcial, conforme docs/DESENVOLVIMENTO-0.6.md.

# 0.5.0 — 2026-11-01 — implementação local, não publicada

- Separa preparação e execução dos ataques com armas/manobras, reutilizando os cálculos existentes.
- Ações salvas compartilhadas no personagem, com favoritos, edição, duplicação e uso sem repetir a configuração estável.
- Cartão com defesa declarada pelo defensor ou mestre antes dos dados; resultados por alvo/golpe e aplicação confirmada.
- Recibos de custos, dados persistidos e retomada; marcação de ações totalmente manual.
- 147 testes de código aprovados. Validação nativa e visual da interface nova pendentes; escopo em docs/DESENVOLVIMENTO-0.5.md.

# 0.4.0 — 2026-10-22

- Poderes comuns e afinidade elemental: aquisição, parâmetros, custos, efeitos ativos e resolução confirmada por alvo.
- Armaduras, consumíveis, Químico e venenos; tamanho, dureza e camuflagem.
- Interface compacta, proteção de aptidões automatizadas e desativação de condições no resumo.
- Misshi com cobrança única; pílulas com contador manual do mestre; penalidades de equipamento fora do limite das condições.
- Cobertura parcial e pendências documentadas em docs/DESENVOLVIMENTO-0.4.md; testes locais não substituem validação em mundo Foundry.

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
