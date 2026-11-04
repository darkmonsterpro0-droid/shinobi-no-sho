# Reformulação visual da ficha — 0.7.0 local

A composição foi refeita antes de ampliar as automações, conforme solicitado. A referência principal é a prancha corrigida da ficha, com identidade lateral, Vitalidade/Chakra no topo e os sete atributos do Shinobi. As imagens de referência não foram incluídas no pacote como interface ou conteúdo de regras.

## Organização

| Área | Apresentação |
|---|---|
| Cabeçalho | Faixa grafite, identificação do sistema e acento vermelho |
| Lateral | Retrato, nome, patente, NC, clã/hijutsu, vila, condições e acesso ao HUD |
| Recursos | Vitalidade e Chakra visíveis em todas as abas; marionetes mostram sua estrutura |
| Resumo | Sete atributos, habilidades de combate, movimento, marcações manuais, pontos disponíveis e notas |
| Acesso rápido | Ações salvas, primeiras entradas de poderes/aptidões/técnicas e equipamento; listas completas nas abas |
| Abas | Resumo, Poderes e Aptidões, Perícias, Social, Equipamento e História; Mestre somente para mestre |

As condições mantêm os controles existentes. As ações salvas continuam compartilhadas entre controladores. A marcação de ações padrão, movimento e parcial permanece inteiramente manual. Retratos pessoais continuam substituíveis pelo seletor nativo.

Não foi criado recurso de Vigor, defesa de outro sistema ou fórmula diferente. Campos, nomes de ações, permissões e serviços de regras são os anteriores. A nova apresentação não migra, substitui ou limpa dados das fichas.

## Janelas e temas

A ficha abre inicialmente com 1160 × 850 pixels e pode ser redimensionada. A grade reduz colunas conforme a largura. Em janela pequena, a identidade passa para cima e o conteúdo usa rolagem vertical; a barra de abas tem rolagem horizontal própria. Há estilos para os temas marfim e grafite, foco de teclado e nomes completos dos atributos.

Essas adaptações estão implementadas em CSS; ainda não passaram por inspeção visual neste ambiente. Não são uma certificação de responsividade ou acessibilidade.

## Arquivos

- `src/character-ui.mjs`: composição da identidade, recursos e resumo, sem novas regras de resolução.
- `src/ui.mjs`: integra a nova composição às abas existentes.
- `styles/character-sheet.css`: estilos limitados à nova ficha, preservando os painéis e o HUD existentes.
- `scripts/build-sheet-preview.mjs`: gera uma prévia visual independente com os mesmos componentes.
- `preview/ficha-visual.html`: prévia em arquivo único, com dados fictícios, navegação e alternância de tema. Não executa ações nem salva personagens. Campos são somente para visualização; os ícones da prévia são substitutos dos ícones nativos do Foundry.

Para regenerar a prévia:

```sh
node scripts/build-sheet-preview.mjs
```

## Evidência e limites

Os 164 testes existentes passaram após a reformulação. Uma conferência adicional percorreu as sete abas e verificou ausência de campos duplicados, presença da identidade e dos recursos e ausência de mutação dos dados durante a renderização.

Não houve teste em um mundo real do Foundry. Foi possível obter um navegador local, mas sua inicialização falhou com SIGSEGV; a suíte visual não chegou a executar. A prévia é uma forma de revisar a apresentação e não evidência de inspeção visual concluída.

O candidato 0.7.0 permanece local, sem tag/release publicada. A compatibilidade declarada continua 14.367, sem ampliação da evidência nativa. O código de automações e as pendências da etapa 9 descritas em DESENVOLVIMENTO-0.6.md permanecem válidos.
