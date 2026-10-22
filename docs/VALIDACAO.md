# Validação até a versão 0.2.1

Atualizado em 22/10/2026. Alvo: Foundry VTT 14. Interface em português brasileiro, resumo calculado e condições.

## Evidência executada

- 38 testes de código aprovados com Node.js 24: manifesto e versões, campos manuais, renderização das fichas e painéis, decisões da mesa, escape de conteúdo, caminhos de gravação, permissões e privacidade dos registros no chat.
- Os testes da integração com documentos e chat usam substitutos de classes do Foundry. Eles verificam o código do adaptador, sem executar o programa Foundry.
- Prévia executada em Chromium com os mesmos componentes, estilos e eventos de formulário das fichas: 23 áreas abertas sem erros de JavaScript e com controles nomeados.
- Valores editados persistem após recarregar a prévia; busca ignora acentos; navegação por setas mantém foco; condições e reservas específicas são cadastradas e aparecem nas listas.
- Declarar custo de chakra não consome o recurso. O assistente de cinco etapas preserva as entradas e valida atributos e inicia vida/chakra nos máximos da criação.
- Perfil documental salvo após revisão de impacto. Temas claro e escuro e fichas de personagem, criatura e marionete renderizados.
- Resumo, perícias, técnica, configurações e assistente verificados em telas de 320 e 420 pixels de largura. Abas e tabela de perícias têm rolagem própria; o restante se reorganiza em colunas menores.
- ZIP conferido com leitor independente: integridade CRC, manifesto na raiz, caminhos de arquivos e ausência de PDFs, credenciais, mundos e arquivos locais de desenvolvimento.

## Correções verificadas na 0.1.2

- Cadastro dos cinco tipos de item a partir de uma ficha chama apenas a criação de documentos incorporados ao Actor; o diretório global não é alterado. O teste reproduz `Actor.documentName` estático da API v14.
- Sem contexto de personagem, um cadastro pessoal é recusado, em vez de criar silenciosamente no mundo. Criação global exige a ação explícita da biblioteca compartilhada.
- Teste no navegador confere que uma fonte de ícones definida no cabeçalho externo à ficha não é substituída, que títulos internos usam Arial mesmo sob um estilo genérico serifado e que as etapas do assistente mantêm círculos. Esse teste usa uma estrutura de cabeçalho simulada, sem afirmar execução do Foundry.
- Pontos de perícia persistem após recarregar; não existe mais caixa de treinamento na ficha. Precisão manual é preservada. Na 0.2.0, os novos testes conferem as perícias de uso restrito.

## Verificações da 0.2.0

- Testes puros conferem NC 4–20, tabela de mínimos, orçamento, limites, bases, avanço por EXP/nível, fórmulas e efeitos contextuais do catálogo.
- Serviços com documentos simulados conferem distribuição persistente, preservação de vida atual, EXP fracionária, permissões, efeitos incorporados, deslocamento sem acumulação, repetição/recuperação de fases, estabilização, cura, descanso e bloqueio de ressurreição comum.
- Sangrando é testado com múltiplos níveis e uma tentativa de Vigor por turno. Há testes para estabilização apesar da inconsciência de Morrendo, recuperação de Estável, sufocamento inconsciente, camuflagem e sentidos.
- 15 verificações de fluxos da prévia aprovadas: incluem evolução para NC5 sem cura, concessão de EXP fracionária, sangramento por turno, resistência e recusa da segunda tentativa no mesmo turno. A recusa é um erro esperado e conferido; nenhum erro de JavaScript não tratado foi registrado.
- Nove telas densas conferidas em 320 e 420 pixels, incluindo distribuição, condições, regras da casa e testes. Capturas inspecionadas visualmente. Não houve teste nativo dentro do Foundry nesta etapa.

## Correções da 0.2.1

- Na evolução de NC4 para NC5, o navegador confere o aviso de Inteligência 0 → 1 e sua resolução ao investir o ponto necessário.
- Na criação, alterar as bases produz mensagens próprias de excesso, falta e distribuição completa durante a edição. Na evolução, os campos são somente para leitura.
- Os serviços rejeitam alteração das bases após a criação, inclusive com usuário mestre e chamadas diretas de atualização.

## Limite atual

Na 0.1.0, `compatibility.verified` estava ausente e o Foundry mostrava compatibilidade desconhecida. Na 0.1.1, foi declarada a build `14.367`, correspondente à instalação do usuário. Os registros reais do servidor confirmam Foundry 14 build 367 e instalação do sistema concluída; a captura do usuário confirma o cartão do sistema instalado.

Essa evidência cobre reconhecimento e instalação do pacote. **A criação do mundo com a correção e os fluxos das fichas dentro dele ainda aguardam confirmação.** A declaração no manifesto não representa teste integral de todos os recursos. A prévia não substitui esse teste.

O adaptador segue as APIs documentadas de [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html), [ActorSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActorSheetV2.html), [DocumentSheetConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.apps.DocumentSheetConfig.html) e [FilePicker](https://foundryvtt.com/api/v14/classes/foundry.applications.apps.FilePicker.html). Arrastar itens, seletor de arquivos, criação persistente de documentos, barras de token e permissões em múltiplos clientes precisam da verificação nativa.

Não houve auditoria completa com leitor de tela nem certificação de conformidade WCAG. Há rótulos, foco visível, status de salvamento e preferência de movimento reduzido; a integração desses recursos também deve ser conferida no Foundry.

## Reproduzir

```sh
node --test tests/*.test.mjs
node scripts/release.mjs --check --repo darkmonsterpro0-droid/shinobi-no-sho
```

A verificação visual opcional requer Playwright e Chromium disponíveis no ambiente de desenvolvimento:

```sh
node scripts/check-preview.mjs
```

`PLAYWRIGHT_MODULE` pode apontar ao módulo Playwright instalado e `BROWSER_EXECUTABLE` a um Chromium existente. Capturas e resultado são escritos em `test-results/`, ignorado pelo Git. Nenhum navegador de uso pessoal ou mundo é alterado.

## Conferência dentro do Foundry

1. Instalar pelo manifesto e criar um mundo de teste no Foundry 14, sem módulos.
2. Criar os três tipos de atores e os cinco tipos de itens; editar, fechar, reabrir e reconectar para conferir a persistência.
3. Percorrer as oito abas e o assistente; arrastar itens do diretório para a ficha e usar o seletor de imagem.
4. Registrar condições, reservas e vínculos; verificar atualização das janelas abertas.
5. Abrir uma sessão de jogador: conferir propriedade, leitura de fichas, perfil restrito ao mestre e destinatários das mensagens privadas.
6. Criar NC4 e NC maior, distribuir atributos, subir NC e conferir a janela e preservação de recursos. Alternar EXP/nível; conferir os mesmos fluxos como jogador.
7. Aplicar Sangrando, Sufocamento, Confuso, fadiga e durações. Avançar/retroceder turnos, reconectar e usar dois mestres para verificar autoridade e prevenção de repetição. Testar Medicina de outro ator e os botões de chat/camuflagem.
8. Publicar os quatro registros manuais e conferir que continuam como anotações.
9. Redimensionar as janelas, trocar tema, navegar pelo teclado e verificar barras de token.
10. Registrar a versão exata e os fluxos efetivamente testados ao atualizar a declaração `verified`.
