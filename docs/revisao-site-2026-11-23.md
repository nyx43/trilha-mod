# Trilha Mod — achados por ordem de prioridade

**Revisão de 22 e 23 de novembro de 2026.** O relatório cobre a versão publicada e a cópia local da branch `feat/percurso-api-tailwind`, no commit de base `399316b` com as alterações de trabalho presentes na revisão. O catálogo publicado apresentava 78 aulas, oito cursos e 34 guias. [Site publicado](https://trilha-mod.vercel.app/)

A numeração indica a ordem sugerida de correção. Os primeiros itens tratam de exposição de dados, confiabilidade da avaliação, acesso aos controles principais e descoberta do site. Dentro de cada faixa, pesam o impacto para o estudante, o alcance e a frequência esperada. Cada achado informa como foi identificado e como conferir a correção.

| Ordem | Prioridade | Achados |
| --- | --- | --- |
| 1 a 5 | Alta | Privacidade, sessão, pontuação, navegação móvel e indexação |
| 6 a 12 | Média | Progresso, acessibilidade, conta, contribuições e cobertura de áudio |
| 13 a 18 | Baixa | Links de entrada, desempenho e destinos públicos do fork |
| 19 a 21 | Menor | Documentação e três avisos de manutenção do código |

## Prioridade alta

### 1. Texto de busca no Google Analytics

O rastreador monta o evento de visualização com o caminho e todos os parâmetros. A busca de guias atualiza a URL conforme se digita. Links antigos do recomendador também podem carregar o enunciado em `q` antes de a página limpar a URL. O código do rastreador também abrange a rota de retorno do login. A análise identifica os dados entregues à biblioteca, sem acesso aos registros do Analytics. [Rastreador](../src/App.tsx) · [Busca](../src/pages/GuidesPage.tsx) · [Recomendador](../src/pages/StudyRecommenderPage.tsx)

**Correção e verificação.** Excluir a rota de retorno de autenticação e registrar apenas caminhos e parâmetros explicitamente permitidos. Com um coletor simulado, verificar que digitar, colar e abrir um link antigo preservam o texto fora de todos os campos de URL do evento.

### 2. O logout deixa uma credencial da API no navegador

Login e perfil gravam uma cópia do token em cookie próprio. Os botões de saída encerram a sessão do SDK e preservam essa cópia. A tela de edição ainda pode usá-la em uma requisição. O risco afeta especialmente computadores compartilhados. A aceitação do token pelo serviço após a saída depende do backend. [Login](../src/pages/LoginPage.tsx) · [Cabeçalho](../src/components/Header/index.tsx) · [Editor](../src/pages/NewRoadmap.tsx)

**Correção e verificação.** Remover o cookie legado ao sair e obter a credencial pelo SDK somente durante uma sessão válida. Com uma API simulada, verificar que nenhuma requisição posterior carrega a credencial anterior.

### 3. Revelar a solução conta como acerto de primeira

No exercício SQL “Sua primeira consulta”, uma tentativa incompleta seguida de “Ver uma solução” gravou um acerto de primeira. A resposta exibida pelo site é executada pelo mesmo caminho que atribui crédito ao aluno. Reproduzido localmente com o componente React e SQLite. [Execução e pontuação](../src/components/Lesson/runners.tsx) · [Exercício](../src/lessons/content/sqlConsultas.ts)

**Correção e verificação.** Registrar a primeira tentativa avaliada e distinguir execução do exemplo. Testar acerto direto, erro seguido de acerto e solução revelada antes de responder. Apenas o primeiro caso deve elevar a contagem de acertos de primeira. Conferir também os laboratórios de Python e os demais exercícios que compartilham o registro de acerto.

### 4. Concluir e avançar exigem rolagem horizontal

Em produção, a 360 px, a página do Modo Curso de Frontend ocupou 742 px. A borda esquerda de “concluir conteúdo” ficou em 419 px e a de “próximo” em 660 px. A tela combina coluna lateral e margens horizontais de 16 rem. O catálogo e a primeira aula couberam na mesma largura. [Modo Curso publicado](https://trilha-mod.vercel.app/course/frontend) · [Layout do curso](../src/pages/CoursePage.tsx)

**Correção e verificação.** Reorganizar o índice e os controles em telas estreitas. Conferir que ambos os botões ficam dentro de 360 px e permitem concluir um item e avançar sem arrastar lateralmente.

### 5. O catálogo publicado identifica outro domínio como original

O HTML recebido de `trilha-mod.vercel.app/aulas` declara `https://trilha.info/aulas` como endereço canônico e de compartilhamento. A imagem social também aponta ao outro domínio. No build local, todos os 144 endereços do sitemap usam `trilha.info`. Isso encaminha os sinais de indexação e as prévias ao projeto de origem, inclusive quando o conteúdo do fork diverge. [Catálogo publicado](https://trilha-mod.vercel.app/aulas) · [Configuração de SEO](../src/seo/pages.ts) · [Sitemap](../scripts/searchArtifacts.ts)

**Correção e verificação.** Definir o domínio pretendido para o fork e usá-lo na geração do HTML, imagens sociais, robots e sitemap. Verificar o HTML servido antes de executar JavaScript em uma página exclusiva da modificação.

## Prioridade média

### 6. O Modo Curso pode misturar duas trilhas

Uma trilha personalizada passa seu identificador ao Modo Curso. Se esse identificador faltar no catálogo fixo, a tela carrega Frontend e usa a chave de progresso de Frontend, ainda que o cabeçalho exiba o nome solicitado. Identificado no código. [Trilha personalizada](../src/pages/CustomRoadmapPage.tsx) · [Seleção do curso e do progresso](../src/pages/CoursePage.tsx)

**Correção e verificação.** Resolver o identificador da trilha antes de ler ou gravar progresso. Para uma trilha indisponível, mostrar um estado explícito. Verificar que abrir uma trilha personalizada preserva o histórico de Frontend.

### 7. O cartão esquecido volta depois da data prometida

Ao selecionar “Ainda não lembrei” e depois “Lembrei” para encerrar a mesma revisão, o resumo prometeu o cartão para amanhã. O agendamento local marcou três dias. O estudante que regressa no dia indicado perde a revisão prevista. O botão “Revisar de novo” também permite promover o mesmo cartão outra vez no mesmo dia. [Sessão de cartões](../src/components/Lesson/Flashcards.tsx) · [Agendamento](../src/lessons/progress.ts)

**Correção e verificação.** Calcular o próximo vencimento a partir do primeiro resultado da sessão. Confirmar, com relógio controlado, que errar e depois acertar marca o dia seguinte e que repetir a sessão no mesmo dia preserva o vencimento.

### 8. As caixas de progresso não identificam o conteúdo ao leitor de tela

Na árvore de acessibilidade do Modo Curso publicado, as caixas apareceram apenas como “checkbox”. O componente aceita rótulo, mas seus usos no índice omitem o nome do item. [Caixa de seleção](../src/components/CourseCheckbox/index.tsx) · [Índice do curso](../src/components/CourseAccordion)

**Correção e verificação.** Associar cada caixa ao título correspondente. Verificar na árvore de acessibilidade e pelo teclado que cada controle informa o nome do conteúdo e seu estado.

### 9. O visitante pode ficar preso na entrada da conta

Em `/login`, o efeito só continua quando já existe autenticação e a tela exibe um indicador de carregamento permanente para o visitante. Em `/profile`, o mesmo visitante recebe um painel com campos vazios. [Login](../src/pages/LoginPage.tsx) · [Perfil](../src/pages/UserPage.tsx)

**Correção e verificação.** Distinguir verificação em andamento, visitante, sessão válida e falha. Oferecer uma ação de entrada ou retorno quando a verificação terminar.

### 10. Uma sugestão corrigida pode continuar sendo recusada

Com Turnstile ativo, o servidor consome a verificação antes de checar conflitos como material duplicado. Depois de um erro de validação, o formulário mantém o token já utilizado para a segunda tentativa. Confirmado pelo fluxo do código. [Formulário](../src/components/Contribute/ContributeDialog.tsx) · [Validação](../server/contributions.ts)

**Correção e verificação.** Renovar o desafio após cada envio que o consome e manter os campos preenchidos. Simular uma duplicata, corrigir o material e verificar que a segunda tentativa usa um token novo.

### 11. Contribuições podem usar o catálogo e o repositório do projeto original

Revisão de código. Em produção, se `SITE_URL` estiver ausente, o servidor consulta o catálogo de `trilha.info`. Sem `CONTRIBUTIONS_REPOSITORY`, o GitHub App usa `flaviojmendes/trilhainfo`. A sugestão de um tópico exclusivo do Trilha Mod pode ser recusada ou encaminhada ao projeto errado. O destino efetivo depende da configuração e das permissões da instalação. [Origem do catálogo](../server/contributions.ts) · [Destino do pull request](../server/github.ts)

**Correção e verificação.** Configurar explicitamente a origem, o repositório e a branch do Trilha Mod. Testar com um catálogo exclusivo do fork e um destino GitHub simulado, incluindo o caso de configuração incompleta.

### 12. Cinco blocos interativos ficam sem narração

A auditoria de 78 aulas marcou cinco blocos sem regra de narração. São os dois laboratórios de Flexbox e Grid, a prática de especificidade da cascata, o modelo de caixa e o exercício de contraste e cor. Quem acompanha a aula por áudio perde a orientação nesses pontos. [Extração dos trechos](../src/narration/extractor.ts) · [Auditoria das aulas](../scripts/narration/export-lessons.mjs)

**Correção e verificação.** Definir uma fala que apresente a tarefa e indique quando interagir. Rodar a auditoria e ouvir esses cinco trechos nas duas vozes, conferindo a pausa antes da interação.

## Prioridade baixa

### 13. Um fragmento malformado pode derrubar um guia inteiro

Na abertura de um guia, o componente chama diretamente `decodeURIComponent` no fragmento. Um sinal de porcentagem isolado pode interromper a renderização após carregar o texto. Identificado no código. [Guia](../src/components/Guide/GuideView.tsx) · [Decodificação já disponível](../src/support/hash.ts)

**Correção e verificação.** Usar a decodificação tolerante do projeto. Um fragmento inválido deve abrir o guia pelo início.

### 14. Abrir uma aula já baixa o índice detalhado das duas vozes

O leitor que entra para estudar em silêncio também solicita o manifesto da narração. Nos 78 arquivos locais, a mediana foi de cerca de 727 kB de JSON sem compressão. O maior, da aula “Onde o dado mora”, tinha 1,21 MB. O tempo de espera em redes móveis ainda precisa ser medido. [Controlador de narração](../src/narration/controller.tsx)

**Correção e verificação.** Medir o carregamento com cache vazio, comparando leitura silenciosa e reprodução. Se o custo for relevante, adiar os detalhes até o primeiro uso e confirmar que o botão Ouvir continua iniciando o trecho correto.

### 15. O JavaScript inicial ultrapassa o limite de aviso do build

O Vite informou cerca de 565 KiB para o arquivo JavaScript principal minificado, ou 179 KiB em gzip. É um custo inicial também nas páginas simples. A medição do build, sozinha, não determina quanto tempo um aluno espera. [Entrada da aplicação](../src/main.tsx) · [Rotas](../src/App.tsx)

**Correção e verificação.** Medir o carregamento inicial da home e de uma aula em um perfil móvel. Identificar as dependências de maior peso e comparar tamanho transferido e tempo até a página responder antes e depois de adiar as que só servem a rotas específicas.

### 16. O atalho de Frontend em produção abre o catálogo geral

Ao clicar em “Aulas de Frontend do zero” na home, apareceu a escolha entre oito cursos. A cópia local já chama esse mesmo destino de “Explorar as aulas”. [Página inicial publicada](https://trilha-mod.vercel.app/) · [Texto local](../src/components/Hero/index.tsx)

**Correção e verificação.** Preservar o texto corrigido na próxima publicação ou apontar o atalho específico para o curso de Frontend.

### 17. “Relate um problema” leva ao projeto original

Na página inicial publicada, o link para abrir uma issue aponta para `flaviojmendes/trilhainfo`. Quando o relato trata de uma modificação exclusiva do fork, o aluno pode entregá-lo a uma equipe que não mantém aquela versão. [Links da comunidade](../src/components/ProjectInfo/index.tsx)

**Correção e verificação.** Definir quem recebe os relatos do Trilha Mod. Se o suporte for do fork, corrigir esse link e conferir a organização e o repositório de destino sem enviar uma issue. Preservar os créditos ao projeto original.

### 18. O índice para assistentes aponta ao catálogo de outro domínio

O gerador de `llms.txt` escreve endereços absolutos em `trilha.info` para as trilhas em Markdown, os esquemas, as aulas e o sitemap. Um assistente que consulte o arquivo do fork recebe referências ao catálogo original. [Geração do índice](../scripts/catalogPlugin.ts)

**Correção e verificação.** Usar a mesma origem configurada para o SEO no gerador de `llms.txt`. Verificar no build que o índice e os documentos apontados pertencem ao domínio escolhido para o Trilha Mod.

## Prioridade menor

### 19. O README subestima o catálogo em duas aulas

O parágrafo inicial informa 76 aulas. O catálogo publicado exibiu 78 e a auditoria de narração local conferiu as mesmas 78. A divergência aparece logo na apresentação do projeto. [README](../README.md) · [Catálogo publicado](https://trilha-mod.vercel.app/aulas)

**Correção e verificação.** Atualizar a contagem ou obtê-la da mesma fonte que alimenta o catálogo. Comparar README, página de aulas e auditoria na próxima alteração editorial.

### 20. O registro de conclusão do terminal omite a revisão da aula nas dependências

O ESLint sinalizou que o efeito usa `revision` ao registrar a resposta, mas a lista de dependências não a inclui. Se a revisão mudar enquanto o mesmo componente continuar montado, essa alteração isolada não dispara o efeito. A revisão identificou o aviso, sem reproduzir perda de progresso. [Terminal da aula](../src/components/Lesson/runners.tsx)

**Correção e verificação.** Incluir a revisão entre as dependências e testar a troca de versão com o terminal já concluído. Confirmar que a tentativa permanece associada à versão adequada e que o aviso desaparece.

### 21. Dois avisos de lint dificultam diagnosticar falhas no teste editorial

Nas linhas 29 e 30 de `editorialProgress.test.tsx`, o teste presume com `!` que existem a aula e sua posição na trilha. Se os dados de teste mudarem, a falha pode surgir depois, longe da busca que retornou um valor ausente. Os dois avisos pertencem ao teste. [Teste de progresso editorial](../src/lessons/editorialProgress.test.tsx)

**Correção e verificação.** Verificar explicitamente que a aula e a posição existem, com mensagem que identifique o dado ausente. Rodar o teste editorial e o lint para confirmar que as duas ocorrências foram resolvidas.

## Cobertura da revisão

- **Fluxos públicos.** A navegação passou da home ao catálogo, ao curso de Frontend e à primeira aula. O menu móvel também levou da aula aos guias. Os testes no navegador usaram larguras de 1.280 e 360 px. Havia diferenças entre o site publicado e a cópia local, inclusive no menu e no atalho da home descrito no item 16.
- **Verificações de código.** Passaram as duas checagens TypeScript, o build de produção e os 343 testes de 35 arquivos. O lint terminou com zero erros e os três avisos detalhados nos itens 20 e 21.
- **Arquivos gerados.** Os 176 caminhos distintos de páginas e recursos internos extraídos de 162 arquivos HTML tinham destino no build. A verificação examinou a presença dos destinos locais.
- **Narração.** A auditoria conferiu os ativos das vozes Santa e Dora nas 78 aulas e identificou as lacunas do item 12. Pronúncia e sincronização requerem avaliação auditiva.
- **Limites da evidência.** Os fluxos autenticados e do Turnstile foram analisados pelo código. A revisão não usou contas reais nem enviou contribuições. O recebimento de eventos pelo Analytics, as configurações privadas da hospedagem, a latência em dispositivos físicos e o conteúdo pedagógico individual de cada aula ficaram fora da verificação.
