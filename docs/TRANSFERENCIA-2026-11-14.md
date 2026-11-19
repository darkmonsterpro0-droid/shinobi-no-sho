# Transferência para este computador

- ZIP original: `E:\No-Sho-Desenvolvimento-Completo-2026-11-14.zip`; cópia extraída preservada na pasta irmã `pacote-transferencia-2026-11-14`.
- Manifesto SHA-256: 951 arquivos conferidos, sem divergências.
- Repositório independente: pasta `desenvolvimento` deste workspace. Branch `validacao/res-001-20261104-223503`, HEAD `cf760a216e61dc2985a752ffa0634a0a01b5f941`. `git fsck --full` sem erros.
- O Python do PATH era um atalho não executável. Foi reproduzido o procedimento do restaurador: clone sem checkout do bundle, restauração do índice ao HEAD e cópia integral do snapshot. Patch de índice vazio; patches de trabalho não reaplicados. Mais tarde foi localizado Python no runtime do Codex para inspeção de PDFs e conferências.
- Nenhum commit, reset destrutivo de trabalho existente, tag ou publicação. A restauração ocorreu em destino novo; as alterações anteriores e os arquivos não rastreados foram preservados.
- Versões conferidas: `system.json`, `package.json`, `src/config.mjs` em 0.9.3. Node 26.13.1; requisito >=22 atendido.
- Baseline recebido: 337 testes aprovados. Continuação: 348 aprovados.
- Caminho real de dados: `D:\Mesa\FoundryVTT`, confirmado por `Config/options.json`. Sistema em `Data/systems/shinobi-no-sho`. Instalação anterior deste computador: 0.4.0. Aplicativo: `D:\FoundryVTT\Foundry Virtual Tabletop`, build 14.370.
- Atualização local: script `instalar-local.ps1` no workspace; gera backup completo anterior, preserva arquivos extras e confere SHA-256 dos arquivos copiados. Relatório `instalacao-akimichi.json` no workspace contém caminho do backup e contagens efetivas.
- O manifesto conserva `verified: 14.367`: encontrar a build 14.370 e instalar arquivos não comprova validação dentro de mundo nessa build.

Continuação mecânica e limites em [AKIMICHI-0.9.3.md](AKIMICHI-0.9.3.md). Livros, ZIP de transferência e backups privados ficam fora da distribuição.
