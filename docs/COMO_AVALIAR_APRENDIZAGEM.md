# Como ensinar e verificar aprendizagem no Trilha

## O que a pesquisa sustenta

| Achado | Aplicação proposta |
| --- | --- |
| O National Research Council propõe ligar três decisões ao desenhar uma avaliação. Qual competência queremos observar, que tarefa pode revelá-la e como interpretaremos o desempenho? [Knowing What Students Know, cap. 2](https://www.nationalacademies.org/read/10019/chapter/4) | Escrever o objetivo como ação observável. Para “investigar persistência”, pedir ao aluno que escolha um teste, preveja o resultado e mostre a evidência. |
| Em turmas universitárias de introdução à programação, exemplos resolvidos que nomeavam a finalidade de cada etapa favoreceram os quizzes da primeira semana. As médias nas provas posteriores foram semelhantes entre os grupos. [Margulieux, Morrison e Decker, 2020](https://link.springer.com/article/10.1186/s40594-020-00222-7) | Explicar para que serve cada passo de um exemplo. Em seguida, retirar parte do roteiro e observar quais decisões o aluno consegue tomar sozinho. |
| Em experimentos com textos, reler favoreceu a recordação após cinco minutos. Tentar recuperar o conteúdo de memória favoreceu a recordação após dois dias ou uma semana. [Roediger e Karpicke, 2006](https://doi.org/10.1111/j.1467-9280.2006.01693.x) | Nos cartões, pedir uma resposta antes de revelar o verso. Em outro dia, voltar à habilidade com um problema curto. A autoavaliação do cartão orienta a revisão. |
| Em dois experimentos com textos, explicar o motivo da resposta e mostrar o gabarito tiveram resultados parecidos nas questões repetidas. Dois dias depois, quem recebeu explicação teve desempenho superior em perguntas novas que exigiam inferência. [Butler, Godbole e Marsh, 2013](https://doi.org/10.1037/a0031026) | Depois da tentativa, explicar por que a evidência sustenta ou contradiz a hipótese. Convidar o aluno a testar uma consequência em outro caso. |

O estudo de programação oferece evidência direta sobre ensino de iniciantes nessa área. Os experimentos de memória e feedback mediram respostas a textos. Usá-los para desenhar práticas de programação é uma hipótese de aplicação que o piloto abaixo permite investigar.

## Piloto com a aula *Onde o dado mora*

**Habilidade alvo.** Diante de um registro que aparece ou desaparece, o aluno escolhe um teste que distingue memória da API de armazenamento persistente e justifica a conclusão com o que observou.

| Momento | Tarefa para o aluno | O que registrar |
| --- | --- | --- |
| Antes da aula | “Cadastrei um livro, atualizei a página e ele continuou lá. O que isso permite concluir? Como você investigaria onde foi guardado?” | Hipótese inicial e teste proposto, antes das dicas. Se já sabia, marcar o conhecimento prévio. |
| Exemplo guiado | Usar a prática de recarga e reinício da aula. Nomear as etapas “identificar o registro”, “mudar uma condição” e “consultar o mesmo registro”. Pedir a previsão antes de executar cada passo. | O primeiro passo em que precisou de ajuda e qual explicação permitiu avançar. |
| Fim da aula | Entregar uma API de prática que guarda a lista em memória. “Escolha como testar se este cadastro vai sobreviver ao reinício. Preveja o resultado, execute e explique.” Deixar o roteiro recolhido e as dicas disponíveis. | Previsão, ação, consulta antes/depois e conclusão. Registrar ajuda recebida separadamente da correção. |
| Cerca de uma semana depois | Apresentar uma segunda API de reservas, preparada para usar SQLite em arquivo. “O cliente precisa recuperar a reserva depois de fechar e reabrir o serviço. Como você verificaria a entrega?” O aluno escolhe o procedimento antes de abrir a aula ou chamar o tutor. | Se identifica a mesma reserva, distingue reiniciar o serviço de atualizar a tela, testa e interpreta o resultado no novo contexto. Anotar se revisou o tema no intervalo. |

Usar os materiais de memória e SQLite da própria aula para preparar as duas variantes. Antes da sessão, conferir o comportamento esperado com um registro novo, o mesmo arquivo de banco e sem processo que recrie ou repovoe os dados. O aluno pode consultar a sintaxe dos comandos. A decisão avaliada é escolher e interpretar o teste. Uma semana é uma escolha prática para o piloto. O intervalo mais favorável depende de quanto tempo se deseja reter o conhecimento. [Cepeda e colaboradores, 2008](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf)

### Como interpretar uma tentativa

| Critério | Evidência suficiente nesta tarefa |
| --- | --- |
| Escolheu um teste que diferencia as hipóteses | Explica por que atualizar a página deixaria as duas hipóteses em aberto e propõe reiniciar a API. |
| Produziu evidência verificável | Identifica um registro novo, consulta a API antes e depois do reinício e compara os resultados. |
| Interpretou o resultado | Explica o que o teste demonstrou sobre esse registro e até onde a conclusão vale. Sobreviver ao reinício, por si só, não identifica qual tecnologia foi usada. |

Em cada critério, anotar **demonstrou**, **demonstrou parcialmente** ou **ainda não demonstrou**, com uma frase de evidência. Registrar à parte se trabalhou de forma independente, consultou sintaxe, recebeu uma dica de estratégia ou seguiu a solução. Marcar **pendente** quando faltou a oportunidade de observar, inclusive se a pessoa não retornou na semana seguinte. São critérios propostos para este piloto.

**Exemplo de feedback.** Se o aluno concluir que o status 201 comprova gravação em disco, responder depois da tentativa: “A API confirmou a criação. Um servidor que guarda tudo em memória também pode responder 201. O que você poderia reiniciar para distinguir os dois casos?” Dar oportunidade de executar o novo teste e explicar o resultado.

### Como usar os registros para melhorar a aula

- Se a pessoa já resolve o diagnóstico inicial, usar uma variante mais exigente para descobrir o que a aula acrescenta.
- Se segue o roteiro, mas no caso novo usa apenas F5, revisar o trecho sobre a diferença entre recarregar a página e reiniciar o processo. Experimentar dois casos em que F5 produz o mesmo resultado e o reinício produz resultados diferentes.
- Se escolhe o teste correto, mas trava para iniciar a API, acrescentar ajuda ao comando de inicialização. Registrar separadamente a dificuldade de ambiente e o raciocínio sobre persistência.
- Se conclui com autonomia uma semana depois, registrar a habilidade, o caso e a data. O resultado permite propor um desafio mais amplo. Um piloto pequeno serve para localizar dificuldades e orientar a próxima revisão. Atribuir o resultado ao método exigiria uma comparação com condições equivalentes.

## Como encaixar isso no projeto

**Agora.** Conduzir o piloto com a aula, o laboratório local e o campo de evidência da missão Web. Um observador pode anotar os critérios acima. Os cartões existentes já permitem recuperar o conteúdo em outros dias. O código de progresso guarda o acerto da primeira tentativa, e os cartões registram a lembrança declarada pelo estudante. A escolha do teste, a ajuda recebida e a justificativa exigem observação adicional. [Aula](../src/lessons/content/ondeODadoMora.ts) · [Progresso e cartões](../src/lessons/progress.ts) · [Avaliação da missão](../src/percurso/MissionReview.tsx)

**Na autoria das próximas aulas.** Ao definir uma habilidade importante, escrever junto uma pergunta inicial, um exemplo resolvido com a finalidade de cada passo e um caso novo com critérios observáveis. Para um exercício de depuração, formular a dica a partir de um erro provável. A prática de diagnóstico já traz sintomas, dicas e evidências esperadas que podem servir de modelo. [Prática de diagnóstico](../src/pages/DiagnosticoPratica.tsx)

**Quando ampliar para o laboratório e o freelancer.** Reutilizar o critério em um pedido de cliente. O aluno escolhe como demonstrar que a reserva sobreviveu ao reinício e apresenta a evidência. Um teste pode conferir o comportamento da entrega. O aluno pode explicar a escolha do teste a um professor ou receber perguntas de uma IA. Registrar o comportamento observado, a justificativa e a ajuda usada permite decidir a próxima prática.
