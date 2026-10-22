# Regras permanentes deste projeto

- O usuário definiu Foundry 14. A versão 0.1.0 é manual: não adicionar automações de regras sem novo pedido.
- Seguir os cinco livros fornecidos e as decisões explícitas da mesa. Não criar regras para preencher lacunas.
- Toda release deve aumentar a versão semântica de `system.json`, `package.json` e `src/config.mjs` em conjunto. Nunca substituir o ZIP de uma versão já publicada.
- Usar `node scripts/release.mjs --version NOVA_VERSAO --repo darkmonsterpro0-droid/shinobi-no-sho` para sincronizar a versão e o download com a nova tag.
- O URL estável de instalação é `https://github.com/darkmonsterpro0-droid/shinobi-no-sho/releases/latest/download/system.json`. O `download` deve apontar ao ZIP da tag exata.
- Antes de publicar: atualizar CHANGELOG e RELEASE-NOTES, executar testes, executar `node scripts/release.mjs --check --repo darkmonsterpro0-droid/shinobi-no-sho`, conferir pacote e fluxos alterados. Só então commitar, criar tag `vNOVA_VERSAO` e publicar release.
- Manter a compatibilidade declarada para Foundry 14.367. A instalação nessa versão foi confirmada por registros reais; os fluxos dentro do mundo ainda precisam de teste. Registrar evidência e escopo em docs/VALIDACAO.md ao alterar `verified`. Não apresentar uma prévia ou mocks como execução real no Foundry.
- Não incluir PDFs, extrações, credenciais, configurações locais de autenticação ou mundos de usuários no repositório ou pacote.
- A identidade visual aprovada é marfim/grafite/vermelho, bordas discretas de pergaminho, tipografia legível e estrutura das quatro pranchas de conceito. Manter teclado, foco visível e janela estreita.
