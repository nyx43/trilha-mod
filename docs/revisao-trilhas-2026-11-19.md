# Revisão das alterações do Neon nas trilhas

Em 19 de novembro de 2026, a revisão da branch `feat/percurso-api-tailwind` confirmou as quatro correções solicitadas na rodada anterior. Também identificou três falhas reproduzíveis no Chromium. A de maior impacto permite perder um rascunho ao percorrer o histórico do navegador.

## Resultado após as correções

As três falhas identificadas na revisão foram corrigidas.

- **Histórico do editor.** O roteador e o editor passaram a usar a mesma instância de histórico. No Chromium, recusar **Voltar** e **Avançar** manteve o endereço do editor e o título digitado. Confirmar a saída levou ao destino solicitado.
- **Conclusão no curso.** O botão de conclusão usa o recurso exibido. Expandir **Controle de Versão** permitiu desmarcar e marcar novamente o artigo da MDN, e a marcação persistiu após recarregar.
- **Tópicos homônimos.** O link usa o ID do tópico quando ele é único. Quando título e ID não distinguem os tópicos, usa a posição na trilha. Nesse último caso, o link depende da ordem do conteúdo. Links antigos por título continuam abrindo a primeira ocorrência.

Os quatro novos testes de regressão falharam antes das correções e passaram depois. Na cópia isolada que serviu de base para o commit, passaram os 336 testes do projeto, 23 testes independentes de revisões anteriores, o build e as verificações TypeScript. O ESLint passou nos arquivos de código alterados. Na árvore de trabalho com as demais alterações locais, passaram 340 testes. A verificação no Chromium usou o build da cópia isolada e respostas simuladas da API de trilhas.

## Falhas reproduzidas na revisão inicial

| Prioridade | Como reproduzir | Resultado observado | Correção sugerida |
| --- | --- | --- | --- |
| Alta | No editor, salve uma trilha para ir ao início. Use **Voltar** para reabrir o editor, digite um título, use **Avançar** e volte ao editor. | O navegador saiu sem pedir confirmação. Ao voltar, o campo de título estava vazio. | Cobrir as transições pelo histórico nativo e preservar o rascunho quando a saída for recusada. Veja [navigation.ts](../src/support/navigation.ts#L64). |
| Média | Em `/course/frontend`, conclua **MDN: como a web funciona (português)** e expanda **Controle de Versão** na lateral. | O mesmo artigo ficou visível, mas o botão passou a oferecer **concluir conteúdo**. Clicar nele não atualizou o progresso do artigo. | Calcular o estado de conclusão a partir do recurso exibido e do contexto em que ele foi selecionado. Veja [CoursePage.tsx](../src/pages/CoursePage.tsx#L152). |
| Média | Abra uma trilha pública com dois níveis que tenham tópicos chamados **Introdução**, com IDs e descrições diferentes. Clique no tópico do segundo nível. | O painel exibiu a descrição do primeiro tópico. Os dois geraram o mesmo fragmento de URL. | Usar um identificador que distinga os tópicos e preservar a leitura de links antigos por título. Veja [Roadmap/index.tsx](../src/components/Roadmap/index.tsx#L109). |

## Correções confirmadas

- **Rota pública.** Abrir e fechar o painel preservou o caminho e a query. Os testes cobriram a reabertura da trilha após recarregar tanto em `/roadmap/v/:slug` quanto em `/roadmap/view/:id`.
- **Slug original.** Ao editar uma trilha existente, foi possível experimentar outro endereço, restaurar o original e salvar.
- **Espaços no slug.** Ao colar `  meu-curso  `, tanto a consulta de disponibilidade quanto o POST usaram `meu-curso`.
- **Prévia do editor.** Foi possível marcar e desmarcar o checkbox de um item novo. O endereço do editor e o progresso salvo do curso `frontend` foram preservados.

## Verificações

| Escopo | Resultado |
| --- | --- |
| Cópia isolada dos 19 arquivos preparados, sobre a base da branch | 332 testes do projeto passaram em 34 arquivos. |
| Testes independentes recuperados das rodadas anteriores | 23 testes passaram. |
| Build, TypeScript da aplicação e da API | Passaram na cópia isolada. |
| Catálogo de narração | A verificação passou para as 78 aulas, com as vozes Santa e Dora. |
| ESLint | Os 19 arquivos preparados passaram. A execução no projeto completo da cópia isolada apontou 5 erros e 21 avisos em outros arquivos. |
| Árvore de trabalho, incluindo as demais alterações locais | 336 testes passaram. |

A verificação no Chromium usou o build local. As respostas da API de trilhas foram simuladas, inclusive nas consultas de slug e no salvamento.
