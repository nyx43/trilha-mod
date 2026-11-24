# Plano para criar e revisar aulas no Trilha

**Objetivo.** Tornar rotineiro criar uma aula, conferir como ela aparece na trilha, publicar e revisar o conteúdo preservando o histórico de quem já estudou. A prova final será fazer esse ciclo com uma aula real usando os componentes existentes.

## 1. Observar uma dificuldade real

O primeiro passo já está previsto no projeto. Convidar um iniciante a fazer a missão final do Percurso Web, desde abrir o primeiro arquivo até cadastrar um item e conferir o que acontece ao recarregar a página. Registrar o passo, o que a pessoa esperava, o que tentou e qual ajuda precisou. A avaliação de evidências da própria missão já ajuda nesse registro.

**Entrega.** Uma dificuldade descrita em termos observáveis e uma hipótese de melhoria. Se a pessoa travar ao verificar a persistência, por exemplo, experimentar um exercício em que ela prevê o resultado da recarga antes de testá-lo. A observação pode acontecer enquanto começa a etapa técnica seguinte.

## 2. Tornar seguro editar uma aula já estudada

- Antes de reorganizar o conteúdo, registrar a correspondência entre cada chave de resposta da versão publicada e seu exercício. Hoje a chave combina seção e posição do bloco. Usar um identificador permanente por exercício em toda atividade que grava resultado, inclusive terminal e práticas de código. Conservar o identificador ao esclarecer o enunciado e criar outro quando o exercício passar a avaliar uma habilidade diferente.
- Aproveitar os identificadores de seção existentes para salvar o ponto de retomada da aula e de cada etapa do percurso. Converter as posições antigas pela ordem que estava publicada, considerando que uma etapa pode mostrar só parte da aula. Para uma seção retirada, retomar na seção anterior que ainda existe, ou no início se for a primeira.
- Aplicar a conversão aos registros locais de forma que repeti-la conserve o resultado. Preservar a primeira tentativa, inclusive quando incorreta, a conclusão e os cartões agendados. Para chaves antigas de origem incerta, conservar o registro e impedir que ele dê crédito a outro exercício. Conferir também a ligação entre os blocos e seus clipes de áudio.

Guardar uma cópia da estrutura publicada e dos registros antigos durante a validação. Se duas versões anteriores usaram a mesma chave para perguntas diferentes e o registro do aluno não identifica a versão, marcar a resposta como histórico de origem incerta. Uma cópia da publicação atual só resolve os casos em que a correspondência é conhecida.

Para as próximas publicações, atribuir uma revisão à aula e registrá-la quando o aluno responder ou concluir. Manter independentes a identidade do exercício, a revisão da aula e a versão do formato de armazenamento. Uma correção de redação conserva o ID. Ao corrigir um gabarito, conferir se é possível recalcular a resposta. Hoje o histórico guarda apenas se a primeira tentativa estava certa. Quando isso impedir uma correção confiável, registrar a tentativa anterior no histórico e oferecer uma nova tentativa com outro ID. Para a narração, reaproveitar a identificação de mudanças no texto que o projeto já usa.

**Aceite.** Testar a conversão com respostas certas, erradas e ausentes, exercício movido ou removido, registro ambíguo e aula concluída. Preparar um navegador com progresso da versão anterior. Inserir um exemplo antes de uma questão e mudar a ordem das seções. Após duas recargas, conferir a resposta original, a seção retomada, a pontuação, a conclusão e a revisão dos cartões. Repetir pela aula avulsa e pelo Percurso Web antes de publicar conteúdo reorganizado.

### Implementação e ensaio

- As 78 aulas trazem um `activityId` explícito nos blocos que registram tentativas. Os IDs iniciais são as chaves que já estavam gravadas. O histórico Git disponível confirmou a correspondência das questões e a ordem das seções nas versões encontradas. Uma chave antiga sem exercício correspondente fica no histórico e fica fora da pontuação exibida na aula.
- A aula e o percurso retomam pela identidade da seção. Para registros antigos, a posição numérica é lida com a ordem anterior, arquivada separadamente para as aulas e para as etapas. Se a seção saiu, a retomada procura a última seção anterior que ainda existe. A partir do próximo avanço, fica salvo o ID da seção e a sequência de predecessoras. A leitura da versão antiga conserva os dados originais.
- Use um novo ID como `atividade-prova-de-persistencia` ao criar um exercício ou trocar o que ele avalia. Preserve o ID ao mover ou esclarecer a questão. Incremente `revision` ao publicar uma revisão. Novas primeiras tentativas e conclusões registram a revisão da aula. Os registros antigos conservam a origem sem revisão conhecida. A narração usa as chaves e os hashes existentes e a revisão do conteúdo deve conferir os clipes afetados.
- No Chromium, uma cópia de “Integração entre front e API” com CORS movida e um exemplo inserido antes da questão retomou na seção certa em duas recargas na aula avulsa e na etapa Web. O ensaio também preservou a primeira resposta errada e os cartões. Um teste de integração cobre a conclusão, a nova tentativa com revisão registrada, uma resposta antiga sem correspondência e a posição persistida após avançar. A checagem de tipos, os 343 testes, a conferência da narração das 78 aulas e o build de produção passaram.

## 3. Simplificar a criação, a prévia e a publicação

- Usar *Onde o dado mora* como referência para um modelo curto de autoria. O autor define em que ponto da trilha a aula entra, o que o aluno já precisa saber, o que deverá conseguir fazer, um exemplo resolvido, uma prática com feedback e como conferir o resultado. Reaproveitar os blocos de aula, a missão e os cartões já disponíveis.
- Criar um comando que prepare os arquivos e registros necessários a partir do título e do lugar escolhido na trilha, atribua identificadores e informe o endereço da prévia local. O autor deve conseguir editar o conteúdo e conferir no navegador o que o aluno verá. Manter a ordem pedagógica explícita, inclusive quando várias aulas pertencem ao mesmo grupo.
- Criar uma preparação de publicação que reutilize a derivação de cursos e os testes existentes. Ela deve apontar referências inválidas, atualizar o catálogo e indicar os áudios novos ou desatualizados. Acionar a geração seletiva de narração já disponível, conferir as duas vozes e executar as verificações do projeto antes da publicação. Registrar o fluxo em um guia curto para o próximo autor.

Durante a autoria, manter o rascunho fora do catálogo público. Na prévia, oferecer a experiência completa de estudo e um resumo das diferenças desde a última publicação, incluindo exercícios adicionados ou retirados, referências inválidas e clipes que precisam de atualização. Conferir que a versão publicada continua acessível enquanto a revisão está em prévia.

**Revisão pedagógica antes de publicar**

Para a primeira rodada com iniciantes, usar o [roteiro de pesquisa e avaliação da aprendizagem](COMO_AVALIAR_APRENDIZAGEM.md). Ele traz as fontes, duas tarefas de persistência, os critérios para interpretar a resposta e exemplos de revisões a partir do que o aluno fizer.

- O aluno sabe o que precisa conhecer antes e o que conseguirá demonstrar ao terminar?
- O exemplo resolvido explica o raciocínio e permite conferir o resultado?
- A prática cobra algo que a aula ensinou? O aluno consegue tentar antes de ver a solução?
- O feedback explica um erro provável e indica uma ação para investigar?
- Existe uma tarefa com um detalhe diferente que permita ao aluno aplicar o conceito por conta própria?
- Quem revisou executou o exemplo e o exercício e conferiu se a narração do trecho alterado corresponde ao que aparece na tela?

**Aceite.** Criar uma aula piloto, conferir a posição entre a anterior e a seguinte, resolver um exercício e ouvir a narração. O autor deve completar o fluxo seguindo o guia, sem editar componentes React nem corrigir listas geradas à mão.

## 4. Transformar “Travei aqui” em revisão

Adicionar o botão por seção, na aula avulsa e no percurso. O relato leva os IDs da aula e da seção, seus títulos e a revisão da aula. Oferecer motivo opcional (explicação, exercício, mensagem de erro, possível problema no conteúdo ou outro) e comentário livre. Para o piloto pessoal ou com amigos, começar com um registro local que permita copiar um relato ou exportar o conjunto para compartilhar com o autor. Mostrar com clareza quando foi salvo no dispositivo e quando foi copiado. O formulário de contribuição existente abre um pull request público e tem outra finalidade.

Quem revisa reúne os relatos por seção, escolhe uma dificuldade e registra a mudança que pretende testar. Depois da revisão, pedir a outro iniciante que tente a mesma tarefa e observar em que passo consegue avançar sozinho.

**Aceite.** Sair de um relato real para uma alteração identificável na aula e uma nova tentativa observada. O aluno pode registrar a dificuldade e continuar de onde parou. Se compartilhar os relatos manualmente virar um problema no piloto, avaliar um canal direto de recebimento.

## Quando considerar a base pronta

Fazer um ensaio completo com a aula piloto. Publicá-la em uma prévia, começar a estudar, responder a uma atividade e registrar uma dificuldade. Revisar a explicação, acrescentar um exemplo antes da atividade e publicar a revisão na mesma prévia. Voltar com o mesmo navegador e conferir catálogo, próxima aula, resposta salva, ponto de retomada e áudio do trecho alterado. Se o ciclo exigir trabalho em uma tela do site, registrar e resolver esse ponto antes de ampliar a produção de aulas.

### Comandos de autoria e prévia

Execute os comandos a partir da raiz do Trilha.

```bash
npm run aula -- nova verificando-previsoes \
  --titulo "Verificando previsões" \
  --trilha frontend --grupo curriculum.internet-e-http

# Ou comece uma revisão de uma aula existente
npm run aula -- revisar como-a-web-funciona --trilha frontend

npm run aula -- verificar verificando-previsoes
npm run aula -- previa verificando-previsoes
```

Edite o arquivo TypeScript indicado em `.cache/editorial/drafts/`. Na revisão, o comando copia o conteúdo e conserva os IDs já publicados. O relatório aponta a posição na trilha, a aula anterior e a próxima, exercícios e seções adicionados ou retirados e os clipes novos, desatualizados ou removidos. A prévia usa o mesmo leitor em uma cópia temporária na porta 5188, com dados de estudo próprios dessa origem. Encerre e reabra após editar. Use `--porta` para abrir outra prévia simultaneamente.

Para preparar uma publicação, revise o relatório, transfira o conteúdo e os metadados aprovados para o catálogo e regenere a ordem dos cursos pelo teste correspondente. Rode `npm run check`, `npm run test:run` e `npm run build`. Se houver mudanças na narração, rode `npm run narration:batch -- --lesson <id>` e confirme com `npm run narration:check`. A alteração do texto em um clipe reaproveitado pede uma nova gravação quando o hash divergir.

**Ensaio local.** O rascunho `exemplo-autoria` apareceu em quarto lugar no curso Frontend, entre “Seu kit de trabalho” e “Git do zero”, com 10 clipes novos no relatório. No Chromium a 360 px, o exercício deu feedback, a aula concluiu e o progresso sobreviveu à recarga. Também foi testada uma revisão de “Integração entre front e API” com a abertura alterada. A revisão identificou um clipe desatualizado e 62 reaproveitáveis. No navegador, o clipe alterado ficou indisponível e a narração válida tocou com destaque. O rascunho foi bloqueado pelo servidor de desenvolvimento normal e a aula existente abriu pela rota normal. A checagem de tipos e os 343 testes passaram.

## Depois da base editorial

**Laboratório de prática.** Começar pelo Percurso Web e reaproveitar a prática de diagnóstico existente. Para a habilidade de conferir persistência, oferecer uma sequência curta em que o aluno prevê o resultado, diagnostica por que um cadastro sumiu e verifica a correção. Cada exercício indica a habilidade, a aula de apoio e o resultado esperado. Reutilizar os IDs e registrar a origem da tentativa e as dicas usadas. O primeiro piloto está pronto quando um aluno consegue escolher um exercício fora da aula, resolver, consultar o feedback e retomar depois. Usar as dificuldades observadas para escolher os próximos exercícios.

**Simulação de freelancer.** Adaptar por curadoria manual uma demanda real autorizada para uso ou criar um enunciado inspirado em um problema recorrente. Usar cliente fictício. O caso de reservas já sugerido no projeto serve como primeiro candidato. O cliente pede para evitar conflitos de horário. O aluno pergunta quais reservas entram em conflito, combina critérios de aceite, recebe uma alteração de requisito e entrega uma solução com evidências. O diálogo inicial pode usar respostas preparadas. Aproveitar a avaliação por critérios da missão Web e registrar cada entrega, seu feedback e a reentrega. Identificar quais critérios foram conferidos por testes e quais receberam avaliação da IA ou de uma pessoa. O piloto está pronto quando o aluno consegue corrigir um problema apontado na primeira entrega e demonstrar a correção na segunda.

**Participação de professores.** Hoje a autoria se concentra em João e nas IAs. Se um professor demonstrar interesse, convidá-lo primeiro a revisar uma entrega pela mesma rubrica. A experiência permitirá decidir se ele precisa de acesso às entregas, de ferramentas de correção ou também de autoria e publicação.

## Ordem de execução sem depender de João

A observação de um iniciante na missão final do [Percurso Web](https://trilha-mod.vercel.app/percurso/api-react-tailwind/missao-final) continua planejada na etapa 1. As tarefas técnicas abaixo podem avançar com dados de teste enquanto essa observação aguarda uma pessoa. O terminal multilinha, a auditoria das 78 aulas, o plano do recomendador e a avaliação da missão final já têm entregas registradas no [relatório de estabilização](RELATORIO_ESTABILIZACAO.md).

| Ordem | Trabalho | Entrega verificável |
| --- | --- | --- |
| 1 | Executar o [piloto Opus](../ideias%20futuras.md#piloto-de-narração-mais-leve-com-opus) em “Integração entre front e API”, com arquivos em uma pasta temporária e prévia local. | Comparar o tamanho por voz, verificar que todos os clipes tocam até o fim e testar o destaque, a pausa, a retomada e o carregamento sob demanda. Registrar o que foi possível ouvir e medir. A decisão sobre converter o catálogo vem após a revisão do piloto. |
| 2 | Tornar seguro mover exercícios e seções de uma aula já estudada. Começar pela etapa 2 deste plano e por um caso que use a aula avulsa e o percurso. | Demonstrar com registros da versão anterior que a primeira tentativa, a conclusão, os cartões e a retomada sobrevivem a duas recargas após inserir um bloco ou reordenar seções. |
| 3 | Preparar o fluxo local de autoria com o piloto e as verificações da etapa 3. | Criar uma aula de exemplo, abrir o rascunho numa prévia, verificar a posição na trilha e emitir a lista dos clipes afetados pela revisão. |
| 4 | Fazer backup e restauração dos dados locais de estudo em uma rodada própria. | Exportar um arquivo versionado e restaurá-lo em outro perfil de teste. Conferir progresso, cartões e plano salvo. Validar o arquivo antes de gravar e preservar os dados atuais diante de arquivo inválido. Exportar apenas os dados de estudo e as preferências previstas para o backup. |

Antes de cada etapa, confira o Git e reaproveite alterações equivalentes que já existam. Como há edições locais em andamento, faça o piloto em cópia isolada quando houver sobreposição. Registre os comandos, resultados e pendências junto da entrega. Rode as verificações pertinentes e deixe as alterações prontas para revisão local. Em cada rodada, mantenha uma única tarefa ativa na próxima ordem.
