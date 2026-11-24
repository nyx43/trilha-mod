# Ordem de trabalho para o agente — correção do Trilha Mod

Implemente e valide os 21 itens abaixo no repositório do Trilha Mod. Os números correspondem aos do relatório de 23/11/2026. Entregue as alterações locais com os resultados por item. Publicação, configuração de contas externas e envio de contribuições reais ficam para uma decisão do responsável pelo projeto. [Relatório com evidências e arquivos](./revisao-site-2026-11-23.md)

## Antes da primeira alteração

1. Entre no checkout `trilhainfo` e confira `git status --short --branch`, `git rev-parse --short HEAD` e o diff dos arquivos que for editar. A revisão encontrou trabalho local sobre `399316b`, na branch `feat/percurso-api-tailwind`. Preserve esse trabalho, inclusive arquivos novos. Se alguém já corrigiu um item, valide a correção existente.
2. Use as versões de Node e do gerenciador previstas no projeto. Execute `npm run test:run` e `npm run lint` para registrar o ponto de partida. Na revisão, passaram 343 testes em 35 arquivos e o lint retornou três avisos. Use esses números como referência histórica.
3. Para os itens 14 e 15, guarde desde já as medições de um build de produção. No mesmo navegador, com cache vazio e perfil de rede definido, abra a home e a aula “Onde o dado mora”. Anote o JavaScript transferido, o tamanho do manifesto de áudio, o tempo até o primeiro controle responder e o tempo até começar a primeira reprodução. Repita nas mesmas condições ao final.

## Etapa 1 — prioridade alta

| Item | Implementação | Como demonstrar a correção |
| --- | --- | --- |
| **1. Privacidade das métricas** | Em `RouteTracker`, derive o evento de uma rota conhecida. Exclua o retorno de autenticação antes de iniciar a coleta nessa página. Revise os campos de endereço e referência, inclusive os que a biblioteca preenche automaticamente. Preserve a busca por guias e a leitura dos links antigos do recomendador. | Com Analytics simulado e texto sintético, busque um guia letra por letra, abra um link legado com `q` e simule o retorno do login. Inspecione os eventos completos. Nenhum contém os textos ou parâmetros de autenticação. Digitar na mesma página não multiplica visualizações e uma navegação normal continua registrando uma visita. |
| **2. Encerramento de sessão** | Localize todos os leitores e escritores de `api_token`. Use o SDK para obter a credencial durante uma sessão válida e remova o cookie legado com o escopo em que foi criado. Cubra as saídas pelo cabeçalho e pelo menu móvel, o perfil e a edição de trilhas. | Com SDK e API simulados, entre, use uma ação autenticada, saia e reabra a tela protegida. Verifique o cookie e as requisições posteriores. Ao entrar com uma segunda conta, a API recebe exclusivamente a identidade da nova sessão. |
| **3. Registro da primeira tentativa** | Registre a primeira execução avaliada do aluno, incluindo falha. Diferencie tentativa, demonstração da solução e conclusão posterior. Aplique a regra aos componentes que compartilham a pontuação. Preserve o histórico já gravado quando for impossível reconstruir a tentativa original. | Em “Sua primeira consulta”, compare acerto direto, erro seguido de acerto, solução revelada antes de responder e erro seguido de revelação. Só o acerto direto conta como acerto de primeira. Recarregue a aula e confira o mesmo resultado. Exercite o caminho compartilhado em Python ou no playground. |
| **4. Modo Curso no celular** | Em `CoursePage`, adapte a coluna do índice e as margens da barra de ações ao espaço disponível. Mantenha a ordem de leitura e o acesso ao índice. | Em `/course/frontend`, a 360 px, abra um tópico, conclua e avance sem rolagem horizontal da página. Registre a largura do documento e a posição dos botões. A referência anterior era de 742 px de conteúdo. Repita a navegação a 1.280 px. |
| **5. Domínio público do fork** | Centralize a origem pública usada no build e nos metadados da navegação React. Aplique a canonical, Open Graph, imagem social, dados estruturados, sitemap e robots. Use a origem verificada do fork como referência, atualmente `https://trilha-mod.vercel.app`, respeitando uma configuração explícita do projeto. | Inspecione o HTML estático de `/aulas` e de uma página exclusiva do fork, depois navegue entre elas. Confira a origem dos metadados antes e depois da navegação, a existência da imagem local, os destinos do sitemap e a referência em robots. Os créditos e links intencionais ao projeto original continuam válidos. |

Use as suítes de rotas, execução de exercícios e geração de HTML como ponto de partida. [Rotas e métricas](../src/App.tsx) · [Testes dos exercícios](../src/components/Lesson/runners.test.tsx) · [Testes do Modo Curso](../src/pages/CoursePage.test.tsx) · [Testes do HTML de busca](../scripts/searchArtifacts.test.ts)

## Etapa 2 — prioridade média

| Item | Implementação | Como demonstrar a correção |
| --- | --- | --- |
| **6. Progresso de trilhas personalizadas** | Resolva a trilha solicitada antes de escolher a chave de progresso. Para um identificador personalizado válido, use seu conteúdo e armazenamento. Se ele não puder ser carregado, mostre um estado de indisponibilidade com retorno à trilha. | Prepare progresso conhecido em Frontend. Abra uma trilha personalizada, marque um item, recarregue e confira os dois históricos. Repita com identificador inexistente e confirme que os dados de Frontend foram preservados. |
| **7. Revisão espaçada** | Use a primeira avaliação do cartão para definir o agendamento do dia. Permita repetir até lembrar durante a sessão. Preserve a leitura dos registros antigos do baralho. | Com relógio controlado, marque “Ainda não lembrei” e depois “Lembrei”. O cartão deve vencer amanhã. Use “Revisar de novo” e recarregue no mesmo dia. O vencimento deve continuar igual. Avance o relógio e confira a lista de revisão. |
| **8. Acessibilidade do índice** | Associe cada caixa de progresso ao título do conteúdo em todos os níveis de `CourseAccordion`. Use identificadores únicos onde houver associação por ID. Aproveite o layout corrigido no item 4. | Navegue com Tab e Espaço. Confira na árvore de acessibilidade o nome do conteúdo e o estado marcado ou desmarcado antes e depois de cada ação. |
| **9. Entrada e perfil** | Aproveite o tratamento de sessão do item 2. Diferencie carregamento, visitante, falha do provedor e sessão válida. Ofereça uma entrada utilizável para o visitante e uma saída recuperável para falhas. | Abra `/login` e `/profile` como visitante e como usuário autenticado, com o provedor simulado. Valide também uma falha e o retorno bem-sucedido do login. Cada estado termina em conteúdo útil ou em uma ação visível. |
| **10. Reenvio de contribuição** | Renove o desafio Turnstile depois de cada envio que possa consumir o token. Preserve os campos e leve o foco ao erro corrigível. Consulte o fluxo de renovação já usado no tutor. | Simule uma sugestão duplicada, devolva 422, corrija o material e reenvie. O segundo envio usa um token novo e chega à confirmação. Verifique também a recuperação após falha de rede. |
| **11. Destino das contribuições** | Reaproveite a origem do item 5. Defina o comportamento de `SITE_URL`, `CONTRIBUTIONS_REPOSITORY` e `CONTRIBUTIONS_BASE_BRANCH` para o fork. Com configuração incompleta, preserve o modo de simulação local e apresente erro claro se o envio real não tiver destino confiável. | Com catálogo e GitHub simulados, envie uma sugestão de tópico exclusivo do fork e confira origem, repositório e branch usados. Repita sem a configuração necessária e verifique que nenhuma escrita chega ao projeto original. |
| **12. Lacunas de narração** | Acrescente regras para os dois blocos de Flexbox/Grid e os blocos de especificidade, modelo de caixa e contraste. Cada fala deve explicar a tarefa e pausar no ponto de interação. Regenere os trechos afetados com Santa e Dora pelo fluxo existente. | Rode a auditoria e confira explicitamente que os cinco blocos saíram da lista de descobertos. O comando já podia passar com essas lacunas. Ouça os cinco trechos nas duas vozes, verificando instrução, pausa e retomada. |

Reaproveite as suítes de contribuição, narração e trilhas personalizadas. [Formulário](../src/components/Contribute/ContributeDialog.test.tsx) · [Narração](../src/narration/narration.test.tsx) · [Trilha personalizada](../src/pages/CustomRoadmapPage.test.tsx)

## Etapa 3 — prioridade baixa

| Item | Implementação | Como demonstrar a correção |
| --- | --- | --- |
| **13. Fragmentos de guias** | Use o decodificador tolerante de `src/support/hash.ts` em `GuideView`. | Abra um guia com âncora válida, vazia e malformada, como `#100%`. A válida deve levar à seção. Nas outras duas, o texto deve continuar disponível desde o início. |
| **14. Custo da narração** | Use as medições iniciais para decidir se vale adiar o manifesto completo até o pedido de reprodução ou separar os dados por voz. Preserve a descoberta dos controles, a troca de voz e o primeiro trecho. | Com cache vazio, compare bytes baixados na leitura silenciosa, tempo até o áudio começar e comportamento ao trocar de voz. Informe o ganho e qualquer custo. Se a mudança não compensar, entregue as medições e a decisão justificada. |
| **15. JavaScript inicial** | Identifique quais dependências de rotas secundárias entram na home. Adie as de maior impacto se a medição confirmar benefício. Use o mesmo build e perfil móvel de referência. | Informe KiB minificados, KiB transferidos e tempo até a interação antes e depois. Abra também a rota cujo código foi adiado. Elevar o limite de aviso do Vite por si só não reduz a transferência. |
| **16. Chamada da home** | Confira primeiro o texto presente na cópia atual. A revisão já encontrou “Explorar as aulas” apontando para o catálogo geral. Preserve esse par ou direcione uma chamada específica de Frontend ao curso correspondente. | Clique no atalho no build local e registre texto e destino. Se a correção já estiver presente apenas localmente, informe que falta publicá-la. |
| **17. Destino dos relatos** | Confira qual repositório mantém o fork, usando a configuração validada no item 11. Ajuste “Relate um problema” ao responsável pelo suporte e preserve os créditos aos autores originais. | Inspecione o `href` gerado na home. Ele deve abrir o formulário de issue do repositório escolhido. |
| **18. Catálogo em llms.txt** | Use a origem pública do item 5 no gerador de `llms.txt`. Confira os links para trilhas em Markdown, catálogo, esquemas e sitemap. | Leia o arquivo do build e verifique a origem e a existência local de cada recurso anunciado como próprio do fork. |

## Etapa 4 — documentação e manutenção

| Item | Implementação | Como demonstrar a correção |
| --- | --- | --- |
| **19. Contagem no README** | Atualize a apresentação conforme o catálogo vigente. Na revisão, o README informava 76 aulas e o catálogo tinha 78. | Compare a contagem com a página de aulas e a auditoria do catálogo no mesmo checkout. |
| **20. Revisão da aula no terminal** | Corrija a dependência de `revision` no efeito que registra a conclusão em `runners.tsx`. Confira a interação com a regra de primeira tentativa do item 3. | Troque a revisão mantendo o terminal montado e concluído. Confira a associação da tentativa à revisão e execute o lint do componente. |
| **21. Diagnóstico do teste editorial** | Substitua as duas asserções `!` de `editorialProgress.test.tsx` por verificações que identifiquem qual aula ou posição está ausente. | Rode o teste editorial e o lint. As duas ocorrências devem desaparecer e a mensagem de falha deve identificar o dado ausente. |

## Verificação e entrega

Na raiz de `trilhainfo`, execute os comandos abaixo. Se o ponto de partida já tiver uma falha, registre o resultado original e o final.

```sh
npm run check
npm run lint
npm run test:run
npm run narration:check
npm run build
```

Sirva o build com `npm run preview` para a verificação das páginas estáticas e no navegador. Para endpoints de desenvolvimento, use `npm run dev` com integrações simuladas. Confira o diff final para distinguir o trabalho desta ordem das alterações que já existiam no checkout.

Na resposta ao responsável, liste cada número de 1 a 21, seu estado, a evidência de aceite e o arquivo principal. Para uma correção já existente, cite o teste que a confirmou. Para uma otimização, informe as condições e os valores antes e depois. Para algo que dependa de publicação, credencial ou decisão sobre o domínio, diga exatamente o que foi verificado localmente e qual ação externa resta.
