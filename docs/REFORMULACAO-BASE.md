# Reformulação — etapa 1: referência preservada

Data de referência: 31/10/2026 (America/Sao_Paulo).

## Escopo autorizado

Executar as etapas 1, 2 e 3: preservar a base, inventariar/verificar a implementação e especificar o contrato das ações. Não implementar a reformulação, alterar regras, migrar personagens ou publicar uma release. Consultar o usuário diante de dúvidas mecânicas ou alternativas relevantes de interação.

## Referência

- Repositório: https://github.com/darkmonsterpro0-droid/shinobi-no-sho
- Commit: `4fd97a37ba2049c00bd5b5f30d2e13a61b66f539`.
- Commit de 22/10/2026, 14:52:35, UTC−03:00.
- Versão: 0.4.0, tag `v0.4.0`, Foundry 14.367 declarado.
- Release preservada: https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases/tag/v0.4.0
- Histórico clonado: 9 commits e 9 tags. Árvore inicial limpa, 141 arquivos rastreados.
- Branch local criada: `planejamento/reformulacao-acoes-etapas-1-3`.
- Bundle local da referência criado e verificado, com histórico completo: `../shinobi-no-sho-base-0.4.0.bundle`.

A tentativa de criar a branch no GitHub retornou HTTP 403, “Resource not accessible by integration”. A branch existe apenas localmente. Não foram alteradas a main remota, suas permissões ou as releases. O bundle local não inclui mundos do usuário nem mudanças que nunca foram enviadas ao GitHub. Sua existência local não equivale a backup remoto adicional.

## Verificações reproduzidas nesta etapa

| Verificação | Resultado | Limite |
|---|---|---|
| `node --test tests/*.test.mjs` | 124 passaram; 0 falhas, cancelados, ignorados ou pendentes | Node 24.22.1; testes puros e substitutos da API |
| `node scripts/release.mjs --check --repo darkmonsterpro0-droid/shinobi-no-sho` | Versão sincronizada e pacote local gerado | Sem envio, instalação ou publicação |
| `git bundle verify` | Histórico completo e bundle válido | Arquivo local; precisa ser preservado fora do ambiente para independência adicional |
| Prévia em navegador | Não executada nesta etapa | Playwright disponível no runtime; executável Chromium não instalado |
| Mundo real Foundry / dois clientes / reconexão | Não executado | Sem sessão/instalação de teste disponibilizada |

O script de conferência escreve em `dist/`, já ignorado pelo Git. Não houve alteração dos manifestos ou do código de execução. Relatos históricos de testes de navegador em `docs/VALIDACAO.md` são evidência anterior, não uma execução nova.

## Recuperação

O commit e a release acima são os pontos remotos de recuperação. Para recuperar a cópia do bundle em outro ambiente: `git clone shinobi-no-sho-base-0.4.0.bundle shinobi-no-sho`. O bundle contém a referência original; a documentação desta análise é entregue separadamente e será incluída em um checkpoint local posterior.

## Conclusão da etapa 1

Referência identificada, clonada e verificável; branch local e bundle criados. Sincronização da branch remota pendente por permissão da integração. Não apresentar esta etapa como branch remota publicada.
