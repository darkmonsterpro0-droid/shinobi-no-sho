# Evidência Windows — RES-002 / 0.9.3

Data: 05/11/2026. Cópia: shinobi-no-sho-dev-validacao-res001-20261104-223503, branch local existente, histórico anterior preservado.

Node 22 do Unity: suíte completa executada com `node --test --test-reporter=tap` e lista explícita de todos os arquivos `tests/*.test.mjs`.

Resultado: 236 testes aprovados, zero falhas. 227 testes anteriores preservados (uma expectativa de ativação de Byakugan atualizada) e nove cenários novos para runtime, idempotência, origem, permissões, reversão, integração LM, reservas independentes e apresentação do controle.

`git diff --check` executado sem erros. Versões sincronizadas pelo script local de preparação; compatibilidade permanece 14.367. Pacote é local; nenhuma tag, push ou release pública.

Os testes usam substitutos de Actor/Item/settings. Não comprovam persistência de servidor, sincronização de dois clientes, teclado/zoom/visão real. Validação Foundry e índice Cartographer adiados expressamente pelo usuário. Nenhum mundo foi aberto ou alterado.

Escopo e fontes em RES-002.md. O piloto não equivale à automação integral dos três clãs.
