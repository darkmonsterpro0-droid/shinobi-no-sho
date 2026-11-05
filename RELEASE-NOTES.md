# Shinobi no Sho 0.9.0 — candidato local RES-001

Fundação para adquirir e evoluir aptidões restritas/especiais na mesma aba e usando o orçamento existente. Catálogo com 139 definições dos quatro livros, fontes e requisitos; 39 entradas exigem revisão do mestre. Escolher uma origem não concede todas as aptidões.

Concessões e suspensões possuem registro de proveniência; recursos já cadastrados podem ser vinculados por ID. Nenhum efeito individual, bônus de Vitalidade/Chakra, consumo, recuperação ou reserva nova é aplicado nesta etapa. Itens textuais e cadastros antigos não são migrados.

207 testes executados, todos aprovados; 31 cenários novos. As 176 regressões foram recuperadas de uma base limpa 0.8.0 e realmente executadas. Validação nativa no Foundry 14.367, inspeção visual e teste com pessoas pendentes. Sem publicação/tag, sem mudanças em mundos ou na instalação original. Consulte docs/RES-001.md para entrega, riscos, inventário e RES-002.

## Histórico 0.8.0

# Shinobi no Sho 0.8.0 — base manual de recursos extras

Reservas específicas podem ser cadastradas separadamente na ficha e aparecem abaixo de Vitalidade e Chakra. Cada uma tem nome, atual, máximo opcional, unidade, origem e anotações separadas de usos e benefícios. O valor atual é editável manualmente; a reserva pode ser ocultada sem ser excluída.

Somente arquitetura e controle manual: nenhuma aptidão foi automatizada, nenhum benefício é aplicado à Vitalidade/Chakra e não há consumo ou recuperação automática dessas reservas. O cadastro anterior system.special é preservado, com metadados extensíveis em resourceData. Novos personagens não recebem reservas predefinidas.

176 testes de código aprovados, incluindo 12 cenários novos. O teste de descanso confere que as reservas manuais não são renovadas. Os testes de integração usam documentos simulados; não houve validação nativa ou inspeção visual concluída. Ver docs/RECURSOS-EXTRAS.md.

A prévia independente preview/ficha-visual.html apresenta uma reserva fictícia para mostrar sua posição. Esta versão permanece local, sem tag/release publicada. A compatibilidade declarada continua 14.367 com o escopo de evidência anterior.
