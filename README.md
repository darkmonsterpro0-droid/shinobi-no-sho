# Shinobi no Sho — Foundry VTT 14

**Versão 0.4.0 · ficha, rolagens e automações em desenvolvimento · português brasileiro**

Fichas em marfim e grafite, com resumo calculado, distribuição de atributos por NC e condições do Livro Básico. A aba Mestre reúne livros, versões de regras, anotações e acesso ao avanço por EXP ou nível inteiro. Ela aparece somente para o mestre.

Veja as [telas implementadas](docs/INTERFACE.md). Esta é uma versão inicial: código e prévia foram testados; execução dentro de um mundo real do Foundry 14 ainda não foi verificada. Detalhes em [Validação](docs/VALIDACAO.md).

![Ficha de personagem](docs/images/automated-summary.png)

## Instalar pelo Foundry

1. No Foundry 14, abra **Sistemas de Jogo → Instalar Sistema**.
2. Cole este endereço no campo de manifesto:

```text
https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases/latest/download/system.json
```

3. Instale e crie um mundo escolhendo **Shinobi no Sho**.
4. Crie um personagem pelo diretório de Atores ou pelo assistente **Criar personagem Shinobi**.

O endereço permanece igual nas próximas versões. O manifesto aponta para o ZIP da versão publicada, e **Verificar atualizações** do Foundry poderá encontrar versões novas. Instalação por manifesto não exige cadastro do sistema no catálogo oficial do Foundry.

Também é possível baixar o ZIP em [Releases](https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases) e extrair seu conteúdo na pasta `Data/systems/shinobi-no-sho` da instalação.

## O que esta versão faz

- Edita e salva fichas de personagem, criatura vinculada e marionete.
- Organiza Resumo, Poderes e Aptidões, Perícias, Social, Equipamento e História. Combate e Evolução foram retiradas para os HUDs futuros.
- Permite criar poderes, aptidões, técnicas, equipamentos e dispositivos, com fonte e notas.
- Oferece busca e biblioteca pessoal na ficha. Poderes, aptidões, técnicas, equipamentos e dispositivos criados ali ficam no personagem e não no diretório de Itens.
- A Biblioteca Shinobi do diretório de Itens é compartilhada e cria modelos do mundo explicitamente. Itens antigos do mundo são preservados; podem ser arrastados para a ficha pelo recurso nativo do Foundry.
- Calcula CC, CD, Esquiva, Ler Movimento, deslocamento, vitalidade e chakra máximos a partir de atributos e NC.
- Distribui atributos na criação e evolução, valida mínimos, máximos, orçamento e transferência das bases de combate.
- Controla condições com efeitos incorporados à ficha, penalidades contextuais, duração por turno, sangramento, sufocamento e confusão.
- Limita vida e chakra atuais aos máximos e oferece botão Descansar com prévia da recuperação.
- Ativa e desativa condições por um único botão, preservando suas fontes e níveis.
- Oferece recuperação, gasto e drenagem de chakra com operações explícitas.
- Mantém recursos especiais e vínculos como registros manuais.
- Publica anotações de testes, declarações, defesas e resultados no chat, com visibilidade pública, privada ao mestre ou pessoal.
- Guarda livros, variantes e decisões no perfil do mestre; permite revisar o impacto documental antes de salvar.
- Possui temas marfim e grafite e fichas que se reorganizam em janelas estreitas.

Os campos editáveis salvam ao sair deles. Em personagens com cálculos ativos, os valores derivados ficam somente para leitura. Personagens com cálculos ativos derivam as precisões de perícia do atributo e dos pontos investidos; fichas manuais preservam seus valores. Os usos restritos de Lidar com Animais, Mecanismos, Medicina, Ocultismo e Venefício exigem ao menos um ponto.

## Criar e evoluir

Escolha NC 4–20 no assistente ou na janela de distribuição aberta ao criar um personagem. Distribua todos os pontos da criação. Para evoluir, clique no NC ou em **Distribuir / subir NC**. O mestre pode elevar o NC; o jogador distribui o saldo respeitando os limites.

Na aba **Mestre → Regras da casa**, o mestre escolhe nível inteiro (+6 pontos de atributos por NC) ou EXP concedida separadamente, inclusive fracionária. A alteração não concede pontos retroativamente. Subir de nível aumenta máximos sem curar ou restaurar chakra.

Fichas antigas continuam com seus valores manuais até usar **Conferir e ativar cálculos**. Revise os atributos comprados e bases; os recursos atuais são preservados. Criaturas e marionetes não recebem automaticamente a fórmula de criação humana.

Veja [Automações e fontes](docs/AUTOMACOES.md) para condições, testes, exceções e funcionamento dos turnos.

## O que fica manual

A versão automatiza partes das compras, armas e aptidões, incluindo contadores, validações, ataques, repetição de testes e clones comuns. As perícias e ações sociais têm rolagens diretas. As ações sociais usam as fórmulas revisadas. O mestre pode escolher progressão de 2, 3 ou 4 pontos de poder.

A versão inclui poderes comuns, afinidades, armaduras, consumíveis, Químico, venenos, tamanho, dureza e camuflagem. Há aplicação confirmada de dano e efeitos por alvo, com consumo de recursos e processamento de turnos. Áreas e defesas são confirmadas pela mesa.

A automação ainda não é integral. Consulte a [cobertura e as pendências da 0.4](docs/DESENVOLVIMENTO-0.4.md), especialmente tarjas coladas, estoque de kunais preparadas, Makibishi, gatilhos de Inflamável contínuo, rituais e distribuição global de projéteis. Armas especiais, hijutsus, HUDs completos e dano de queda estão fora deste lote.

**Clone 2:** até duas cópias ativas usam −3 nos testes; com três a seis, todas falham automaticamente em combate. O gerador vincula as cópias à origem e controla os custos de criação e divisão/devolução de chakra de Kage Bunshin.

Veja [notas da versão](RELEASE-NOTES.md) e [pendências detalhadas](docs/DESENVOLVIMENTO-0.4.md). Não há transcrição integral dos livros. Alterar o perfil não converte fichas automaticamente. Módulos externos não são exigidos e ainda não possuem adaptadores próprios.

## Acesso e atalhos

As permissões nativas do Foundry controlam as fichas. Só o mestre salva o perfil e decisões do mundo. Cada jogador escolhe seu tema em **Configurações → Configurar definições → Shinobi no Sho**. A mesma seção oferece o menu de regras ao mestre.

Atalhos opcionais:

```js
game.shinobi.createCharacter();
game.shinobi.open("library");
game.shinobi.open("settings");
game.shinobi.open("resources", {actor: canvas.tokens.controlled[0]?.actor});
```

## Desenvolvimento e versões futuras

Não há instalação de dependências para testar ou empacotar. Requer Node.js 22 ou superior.

```sh
node --test tests/*.test.mjs
node scripts/preview-server.mjs
```

A prévia abre em `http://127.0.0.1:4173` e usa os mesmos componentes de layout. Seus dados são locais ao navegador; não é um mundo do Foundry.

Para preparar uma atualização, sempre use **um número maior e ainda não publicado**:

```sh
node scripts/release.mjs --version 0.4.1 --repo darkmonsterpro0-droid/shinobi-no-sho
node --test tests/*.test.mjs
node scripts/release.mjs --check --repo darkmonsterpro0-droid/shinobi-no-sho
```

Atualize `CHANGELOG.md` e `RELEASE-NOTES.md`, revise o pacote, faça commit e envie o código para o GitHub. Com a ferramenta oficial `gh` autenticada e o Git configurado, publique:

```sh
node scripts/publish.mjs
```

O publicador exige uma árvore de trabalho limpa, confere que o commit está no GitHub, executa os testes, confere as versões, cria a tag correspondente e publica `system.json` e ZIP. Recusa sobrescrever versões existentes. Cada download é fixado à sua tag; o manifesto estável acompanha a última release. Não é necessário configurar GitHub Actions.

Veja [AGENTS.md](AGENTS.md) para as instruções permanentes e [docs/VALIDACAO.md](docs/VALIDACAO.md) para a evidência e limites dos testes. A compatibilidade declarada é Foundry 14.367, com limites na geração 14. Instalação confirmada no servidor do usuário; fluxos dentro de um mundo ainda aguardam confirmação.

## Créditos

Projeto comunitário independente. Código e SVGs originais sob MIT; direitos dos livros, Naruto e Foundry permanecem com seus titulares. Veja [CREDITS.md](CREDITS.md). Não são distribuídos PDFs, ilustrações dos livros, credenciais ou mundos particulares.
