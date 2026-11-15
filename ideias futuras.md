# Ideias futuras — evolução da cópia do Trilha Info

Propostas para avaliar depois do percurso de Web. A [próxima ordem](proxima%20ordem.md) tem apenas a tarefa atual. Os links e o histórico da primeira entrega estão no [percurso de Web](docs/PERCURSO_WEB.md).

## Organização do trabalho

Manter uma tarefa principal por vez em `proxima ordem.md`. Pequenos ajustes independentes podem acontecer junto dela, sem transformar esse arquivo em uma lista de várias frentes. Esta regra permite agrupar melhorias simples; não autoriza implementar todas as ideias abaixo.

- Exemplos pequenos: aplicar um nome já escolhido aos textos da interface, corrigir rótulos ou ajustar uma cor usando a estrutura de temas existente. Preservar créditos, licença e progresso.
- Um tema pode ser pequeno quando muda apenas uma paleta existente. Conferir contraste, foco e legibilidade nas telas afetadas. Criar um seletor persistente, reorganizar páginas ou alterar a estrutura visual exige uma tarefa própria se envolver trabalho maior.
- Antes de trabalhar simultaneamente com outro agente, delimitar os arquivos de cada um. Se houver arquivos compartilhados, dependência da tarefa principal ou necessidade de uma decisão do usuário, fazer o ajuste em sequência ou deixá-lo pendente.
- Registrar ajustes concluídos e verificações no relatório da rodada. As ideias ainda não escolhidas permanecem aqui.

## Estudo por objetivo e personalização

- **O que preciso estudar?** *(MVP Web entregue em `/aulas/o-que-estudar`; ver [relatório](docs/RELATORIO_RECOMENDADOR.md))* — Já aceita enunciados em texto corrido ou lista, associa trechos às aulas e seções do catálogo por IDs, títulos, resumos, objetivos e sinônimos em português (sem IA e sem chave), diferencia pedido no enunciado de sugestão de apoio, aponta correspondência fraca e sinaliza trechos sem cobertura. **Próximos passos:** aproveitar a prévia do planejador, deixar o aluno escolher o que incluir e avaliar uma IA opcional no futuro para interpretar textos mais variados usando apenas o catálogo disponível.
- **Aulas.** Aprofundar a aula de Tailwind mantendo as seções, exemplos anotados, exercício com feedback, cartões e missão do Trilha. Usar o que o aluno encontrar ao fazer o percurso. Um candidato é diagnosticar uma grade que ficou espremida, corrigir os breakpoints e verificar a tela estreita e o foco do teclado. Distinguir a simulação em CSS da prática real com Tailwind no Vite.
- **Identidade e Configurações.** Propostas de nome: Ponto de Prática, Caderno Dev e Oficina de Código. Quando o nome for escolhido, aplicar à interface, título e metadados com os créditos e a licença da origem preservados. Manter rotas e chaves de armazenamento para conservar o progresso. Começar com tema do sistema, claro e escuro, tamanho de texto e movimento reduzido. Avaliar uma paleta de leitura com o mesmo trecho de aula em cada tema.
- **Ruby e Rails.** Explorar como projeto de aprendizado separado. Avaliar migração de progresso quando houver uma decisão sobre a base definitiva.

## Projetos, desafios e freelancer

- **Projetos** são propostas com objetivo, pré-requisitos, entregáveis e critérios de aceite. Cada projeto pode oferecer uma stack guiada e admitir outras que atendam aos mesmos critérios.
- **Desafios** são tarefas menores, como reproduzir e corrigir uma falha, acrescentar um teste ou explicar uma decisão sobre código existente.
- **Simulação de freelancer** usa os mesmos critérios de projetos. Acrescenta um cliente que responde a dúvidas e depois muda um requisito. Começar com um caso de reservas em que o cliente pede para “evitar conflitos de horário” e o aluno descobre quais conflitos precisam ser bloqueados. Usar respostas e mudanças definidas no cenário para conseguir praticar sem IA.
- **Trabalhos reais** começam por transformar o enunciado em critérios revisáveis. Perguntar ou sinalizar quando faltar uma regra. A pessoa escolhe o que é permitido compartilhar e fornece apenas artefatos permitidos para a revisão.

## Avaliar a entrega

1. Definir critérios observáveis antes de começar. Um cadastro pode exigir campos obrigatórios, confirmação de sucesso e permanência do registro após recarregar. Exigir React, Tailwind ou uma linguagem quando a atividade exigir.
2. Conferir o comportamento de fora. Uma aplicação pode ser avaliada pelo navegador. Uma API pode ser avaliada por requisições HTTP sobre o contrato combinado. A linguagem muda o modo de rodar o projeto, enquanto o resultado esperado continua o mesmo. Quando o contrato também mudar, ajustar o teste com uma regra explícita.
3. Usar rubricas para decisões abertas. Pedir evidências e justificativas para legibilidade, acessibilidade, testes, limites e escolhas técnicas. Aceitar soluções diferentes pelos critérios. Sinalizar a origem de cada resultado: verificado por teste, autoavaliado, revisado por alguém ou pendente. IA pode sugerir perguntas e feedback. A revisão da IA não equivale a um teste executado.
4. No primeiro piloto, deixar o aluno rodar os testes no próprio projeto e registrar os resultados ou anexar evidências. Evitar um executor que clone e rode repositórios arbitrários. Se a execução automática remota entrar no futuro, projetar isolamento, limites e controle de rede antes.

## Progressão inspirada em RPG

Separar conclusão de aula, prática com ajuda, prática sem ajuda e aplicação em projeto. Desbloquear níveis por evidências definidas, evitando contar a repetição do mesmo exercício como prova nova. Começar com poucas habilidades e usar o primeiro projeto para calibrar os critérios. Exemplo de mensagem: **React · Nível 2** → “Nesta atividade, você buscou dados de uma API, tratou erro e atualizou a lista após cadastrar”. Quando o aluno demonstrar integração de frontend, API e dados, liberar uma conquista como **Primeiro projeto fullstack**. Papéis profissionais podem aparecer como cenários com responsabilidades distintas. Os níveis são internos da plataforma.
