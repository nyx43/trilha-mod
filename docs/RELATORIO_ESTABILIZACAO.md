# Estabilização do estudo com terminal e narração

## Ponto de partida — 17/11/2026

- Trabalho local na branch `feat/percurso-api-tailwind`, com alterações e áudios de sessões anteriores. Nenhuma alteração enviada ao GitHub.
- O bloqueio de geração estava disponível. O lote anterior registrava quatro falhas, incluindo `onde-o-dado-mora`. O log individual dessa aula tinha zero bytes.
- Preservei os logs, o PID anterior e a auditoria em `.cache/narration/estabilizacao/anterior.6fWNmu/`. A tentativa de recuperação roda com uma aula e um processo e registra o status em `.cache/narration/estabilizacao/recuperacao.log`.
- Base inicial: 78 aulas, 65 catalogadas, 65 manifestos com Santa e Dora e 2.960 MP3 de cada voz nessas 65 aulas. Incluindo aulas parciais, havia 3.030 MP3 de Santa e 3.028 de Dora.
- As 13 pendentes no início eram `arrays-mapas-e-complexidade`, `codigo-depuracao-e-revisao`, `curriculo-vaga-e-apresentacao`, `desafio-tecnico-e-conversa`, `estrategia-de-cobertura-e-ci`, `http-dados-e-seguranca-na-entrevista`, `onde-o-dado-mora`, `playwright-para-web`, `raciocinio-e-comunicacao`, `revise-a-carreira-escolhida`, `tecnicas-e-riscos` e `testes-de-api`.

## Retomada da geração

```bash
cd '/home/joaovt/Área de trabalho/site estudo/trilhainfo' &&
  flock -n .cache/narration/geracao.lock npm run narration:batch -- --remaining --jobs 1
```

## Terminal guiado

- Rota de reprodução: `/aula/linux-e-terminal`, atividade “Passeio por um servidor”. Em Chromium a 360 px, Enter com o cursor no meio de `pwd` enviava o comando, apagava o campo e avançava de 0 para 1.
- O editor agora aceita várias linhas. Enter insere uma quebra no cursor. Ctrl+Enter, Cmd+Enter e o botão “Executar” enviam um lote. Os comandos rodam de cima para baixo. O simulador ignora linhas vazias, indica a primeira linha incorreta e conserva a linha e as seguintes para edição. As linhas que sobram após o último passo continuam disponíveis para copiar.
- Chromium, 360 px, perfil temporário: conferi a quebra no cursor, inserção de várias linhas, erro na segunda linha, preservação das pendentes, Ctrl+Enter, Cmd+Enter e o clique no alvo de 44 px. A edição deixou o progresso e o armazenamento local intactos.
- `npm run test:run -- src/components/Lesson/runners.test.tsx`: 5 testes passaram.

## Auditoria inicial da narração

- Rodei `verify_narration.py` para as 65 aulas catalogadas antes das mudanças. Santa e Dora passaram em todas, com 2.960 trechos por voz, zero erros e zero alertas. Os JSON e logs estão em `.cache/narration/estabilizacao/verificacao-inicial/`.
- Cruzamento em “Onde cada tarefa acontece?” (`/aula/integracao-front-e-api`): o áudio existente traz a pergunta, as duas opções e os seis itens que aparecem na tela. O feedback aparecia sem botão e a fila terminava sem indicar a pausa quando a atividade era o último trecho das seções abertas.
- Em Chromium, ao iniciar o áudio do fechamento e desmarcar “Mostrar a aula inteira”, o trecho continuava tocando com o fechamento removido.
- A auditoria inicial listou 92 blocos sem clipe em 48 aulas. Totais por tipo: `trace` 25, `steps` 23, `cards` 23, `screenReader` 4, `code` 3, `pyramid` 3, `domTree` 2, `layoutLab` 2, `joins` 2, `specificity` 1, `boxModel` 1, `contrast` 1, `sequence` 1 e `complexity` 1.

## Recuperação e ampliação da narração

- `onde-o-dado-mora` passou com um processo. O lote retornou `batch_exit=0`, com 38 clipes por voz, zero erros e zero alertas contra o roteiro anterior. A aula voltou ao catálogo. A revisão dos clipes novos dessa aula entra na atualização das catalogadas.
- `integracao-front-e-api` passou com 63 clipes por voz e zero erros e alertas. Foram gerados 13 novos clipes em cada voz e reaproveitados os 50 existentes. O feedback correto lê a explicação. No incorreto, o botão lê a orientação de revisão e o total de acertos aparece no status da atividade.
- A fila pausa em “Onde cada tarefa acontece?”, inclusive quando é o último trecho aberto. Ler o feedback preserva o ponto de pausa da fila. O botão de resposta em reflexão e no verso de cartão aparece após a revelação, e a narração contínua pula esses clipes.
- O fluxo de geração agora registra o retorno do subprocesso e escreve o log sem buffer. O verificador exige as duas vozes e compara o tamanho de cada MP3 com o manifesto. A opção `--stale` seleciona aulas catalogadas que precisam de clipes novos ou reparo.
- O extrator e a interface passaram a cobrir cartões de conteúdo, passos, traçados de execução, legendas de árvore DOM e do leitor de tela, pirâmides, sequências, junções, complexidade e três exemplos de código sem legenda. A auditoria do roteiro atual aponta cinco laboratórios sem clipe dedicado: os dois de layout em `css-flexbox-e-grid`, especificidade em `css-seletores-e-cascata`, modelo de caixa em `css-tudo-e-caixa` e contraste em `acessibilidade-para-todos`. As instruções próximas explicam quais controles usar e o que observar. As demonstrações de leitor de tela têm legenda narrável e reprodução separada pela voz do navegador, quando disponível.
- Kokoro retorna a duração em quadros para cada fonema. O gerador acumula esses quadros, os deslocamentos de cada frase e as pausas até obter os tempos associados a cada palavra. Para os MP3 novos da aula de Integração, a checagem de correlação do início do PCM decodificado registrou 0,00 ms de desvio. Esse número mede a codificação. A pronúncia dos termos ainda depende de escuta humana.
- A geração mantém o bloqueio `geracao.lock`. Depois da recuperação e de Integração, o lote usa um processo com três threads internas do Kokoro. Os logs de trabalho são `.cache/narration/estabilizacao/restantes.log` e `.cache/narration/estabilizacao/atualizacao.log`.

## Jornada testada no Chromium

- Perfil temporário, 360 px. Abri `/aulas`, depois `/aulas/fullstack` e `/aula/integracao-front-e-api?trilha=fullstack`. Resolvi a classificação, avancei para “Enviar dados com fetch”, recarreguei e usei “Retomar posição”. O trecho retomou a partir de 2,2 s e o progresso da resposta e da seção persistiu.
- Em `/percurso/api-react-tailwind/integracao-front-api`, conferi que o mesmo MP3 toca e que a leitura sozinha não grava respostas nem avanço. O áudio parou na navegação de volta ao Percurso. Na aula avulsa, parou ao recolher o fechamento.
- Santa e Dora, em 1× e 1,35×: o Chromium reproduziu o MP3 correspondente e usou o tempo da mídia para destacar palavras no início, meio e última frase da apresentação. Os destaques conferidos incluíram “Integração”, “fetch”, “JSON” e “otimista”. A amostragem valida reprodução e destaque perante o relógio da mídia. Falta uma escuta humana para validar a correspondência auditiva e a pronúncia.
- A execução inicial da suíte revelou duas falhas: a asserção “Próxima aula” ainda apontava para a ordem anterior a “Onde o dado mora” e o teste local de Python ficava esperando o encerramento da entrada padrão no sandbox. Atualizei a asserção e passei o JSON pela linha de comando do processo de teste, com diagnóstico por exercício.

- Em Chromium, colagem real por Ctrl+V no terminal confirmou a edição de cinco linhas antes de executar. Na integração, conferi clipes reais de erro e acerto, retorno ao ponto de pausa, início na seção seguinte e saída do áudio ao ocultar uma resposta ou virar a página do cartão.
- Comparei o roteiro com 7.557 campos visíveis de 67 aulas, incluindo as atividades montadas e as legendas. A primeira comparação encontrou crases literais no texto visível que deslocavam os índices das palavras. Ajustei a renderização de código dentro de negrito, títulos de observações e cabeçalhos e legendas de tabelas. A repetição encontrou zero divergências nos campos comparados. Diagramas com estado comparam o campo montado e cartões comparam a frente atual.
- `npm run check`, `npm run test:run` (281 testes em 29 arquivos) e `npm run build` passaram. O build emitiu o aviso de dependência de navegadores desatualizada e de um pacote JavaScript acima de 500 KiB. Repeti os três comandos em uma cópia dos arquivos do commit, sem as edições locais de outras etapas, e passaram com 276 testes.

## Roteiro de cinco minutos

1. Abra `/aula/linux-e-terminal` em uma janela de 360 px. Em “Passeio por um servidor”, escreva `pwd`, mova o cursor para antes do `w` e pressione Enter. Confira a quebra no cursor e o contador em zero. Cole `pwd`, `cd /tmp` e `ls` em três linhas. Use Ctrl+Enter ou Cmd+Enter e confira o erro na linha 2. Troque `cd /tmp` por `cd /var/log` e acione “Executar”.
2. Abra `/aula/integracao-front-e-api`. Em “Onde cada tarefa acontece?”, use “Ouvir atividade”, responda os seis itens e confirme que “Ouvir feedback” aparece após “Verificar”. Experimente Santa em 1× e Dora em 1,35×. Compare “fetch”, “JSON”, “CORS” e a última frase do trecho com o destaque.
3. Em Integração, abra a aula inteira, comece a ouvir o fechamento e recolha as demais seções. Confirme que o áudio para. Abra `/percurso/api-react-tailwind/integracao-front-api` e confira a leitura da mesma atividade. Ao sair da etapa, confirme que o áudio para.

## Estado e retomada do lote

As contagens abaixo são o ponto de controle às 23h52 de 17/11. O catálogo e os logs continuam sendo atualizados pelo lote.

- 68 de 78 aulas catalogadas, com 3.121 MP3 em cada voz. O último sucesso foi `exploratorio-e-relato-de-bugs`, após a recuperação de `tecnicas-e-riscos`. O último erro comprovável do lote anterior foi a falha de `onde-o-dado-mora` com log individual vazio, preservado em `.cache/narration/estabilizacao/anterior.6fWNmu/`. A recuperação registrada retornou 0.
- Aulas que ainda não constavam do catálogo nesse ponto: `arrays-mapas-e-complexidade`, `codigo-depuracao-e-revisao`, `curriculo-vaga-e-apresentacao`, `desafio-tecnico-e-conversa`, `estrategia-de-cobertura-e-ci`, `http-dados-e-seguranca-na-entrevista`, `playwright-para-web`, `raciocinio-e-comunicacao`, `revise-a-carreira-escolhida` e `testes-de-api`.
- Um processo executa `--remaining` e outro aguarda o bloqueio para `--stale`. Confira `.cache/narration/estabilizacao/restantes.log` e `atualizacao.log`. Os logs individuais continuam em `.cache/narration/batch/`. A auditoria final também aguarda o bloqueio e salvará os totais em `.cache/narration/estabilizacao/resumo-final.json` e os detalhes em `verificacao-final/`.
- Se o lote parar, preserve o log individual antes de retomar. Em ordem, rode:

```bash
cd '/home/joaovt/Área de trabalho/site estudo/trilhainfo'
KOKORO_THREADS=3 flock -n .cache/narration/geracao.lock npm run narration:batch -- --remaining --jobs 1
KOKORO_THREADS=3 flock -n .cache/narration/geracao.lock npm run narration:batch -- --stale --jobs 1
```

O push para `nyx43/trilha-mod`, branch `feat/percurso-api-tailwind`, foi bloqueado pela revisão automática, que solicitou autorização explícita do conteúdo e destino. Os commits locais podem ser revisados enquanto o lote continua. A configuração local espera `yarn` no hook, que estava indisponível. Rodei ESLint diretamente nos arquivos de comportamento alterados, além da suíte e do build.
