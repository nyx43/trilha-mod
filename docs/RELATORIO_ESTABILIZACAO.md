# Estabilização do estudo com terminal e narração

## Ponto de partida — 17/11/2026

- O trabalho partiu da branch `feat/percurso-api-tailwind`, com alterações e áudios de sessões anteriores.
- O bloqueio de geração estava disponível. O lote anterior registrava quatro falhas, incluindo `onde-o-dado-mora`. O log individual dessa aula tinha zero bytes.
- Preservei os logs, o PID anterior e a auditoria em `.cache/narration/estabilizacao/anterior.6fWNmu/`. A recuperação rodou com uma aula e um processo. O código de saída está em `.cache/narration/estabilizacao/recuperacao.log`.
- Das 78 aulas, 65 estavam no catálogo com Santa e Dora, somando 2.960 MP3 por voz. Incluindo aulas parciais, havia 3.030 MP3 de Santa e 3.028 de Dora.
- As 13 pendentes eram `arrays-mapas-e-complexidade`, `codigo-depuracao-e-revisao`, `curriculo-vaga-e-apresentacao`, `desafio-tecnico-e-conversa`, `estrategia-de-cobertura-e-ci`, `exploratorio-e-relato-de-bugs`, `http-dados-e-seguranca-na-entrevista`, `onde-o-dado-mora`, `playwright-para-web`, `raciocinio-e-comunicacao`, `revise-a-carreira-escolhida`, `tecnicas-e-riscos` e `testes-de-api`.

## Terminal guiado

- Reproduzi a falha em “Passeio por um servidor”, na rota `/aula/linux-e-terminal`. Em Chromium a 360 px, Enter com o cursor no meio de `pwd` enviava o comando, apagava o campo e avançava de 0 para 1.
- O editor agora aceita várias linhas. Enter insere uma quebra no cursor. Ctrl+Enter, Cmd+Enter e o botão “Executar” enviam um lote. Os comandos rodam de cima para baixo. O simulador ignora linhas vazias, indica a primeira linha incorreta e conserva a linha e as seguintes para edição. As linhas que sobram após o último passo continuam disponíveis para copiar.
- No perfil temporário do Chromium a 360 px, conferi a quebra no cursor, colagem real por Ctrl+V, erro na segunda linha, preservação das pendentes, Ctrl+Enter, Cmd+Enter e clique no alvo de 44 px. A edição deixou o progresso e o armazenamento local intactos.
- Os cinco testes de `npm run test:run -- src/components/Lesson/runners.test.tsx` passaram.

## Auditoria inicial da narração

- Rodei `verify_narration.py` para as 65 aulas catalogadas antes das mudanças. Santa e Dora passaram em todas, com 2.960 trechos por voz, zero erros e zero alertas. Os JSON e logs estão em `.cache/narration/estabilizacao/verificacao-inicial/`.
- Em “Onde cada tarefa acontece?” (`/aula/integracao-front-e-api`), o áudio existente trazia a pergunta, as duas opções e os seis itens visíveis. O feedback aparecia sem botão e a fila terminava sem indicar a pausa quando a atividade era o último trecho das seções abertas.
- Em Chromium, ao iniciar o áudio do fechamento e desmarcar “Mostrar a aula inteira”, o trecho continuava tocando com o fechamento removido.
- A auditoria inicial listou 92 blocos sem clipe em 48 aulas, incluindo 25 do tipo `trace`, 23 `steps`, 23 `cards`, 4 `screenReader`, 3 `code`, 3 `pyramid`, 2 `domTree`, 2 `layoutLab`, 2 `joins` e um de cada tipo `specificity`, `boxModel`, `contrast`, `sequence` e `complexity`.

## Recuperação e ampliação da narração

- `onde-o-dado-mora` passou com um processo. O lote retornou `batch_exit=0`, com 38 clipes por voz, zero erros e zero alertas contra o roteiro anterior. A aula voltou ao catálogo. A atualização final de “Onde o dado mora” passou com 53 clipes por voz.
- `integracao-front-e-api` passou com 63 clipes por voz e zero erros e alertas. Foram gerados 13 novos clipes em cada voz e reaproveitados os 50 existentes. O feedback correto lê a explicação. No incorreto, o botão lê a orientação de revisão e o total de acertos aparece no status da atividade.
- A fila pausa em “Onde cada tarefa acontece?”, inclusive quando é o último trecho aberto. Ler o feedback preserva o ponto de pausa da fila. O botão de resposta em reflexão e no verso de cartão aparece após a revelação, e a narração contínua pula esses clipes.
- O fluxo de geração agora registra o retorno do subprocesso e escreve o log sem buffer. O verificador exige as duas vozes e compara o tamanho de cada MP3 com o manifesto. A opção `--stale` seleciona aulas catalogadas que precisam de clipes novos ou reparo.
- O extrator e a interface passaram a cobrir cartões de conteúdo, passos, traçados de execução, legendas de árvore DOM e do leitor de tela, pirâmides, sequências, junções, complexidade e três exemplos de código sem legenda. A auditoria aponta cinco laboratórios sem clipe dedicado, os dois de layout em `css-flexbox-e-grid`, especificidade em `css-seletores-e-cascata`, modelo de caixa em `css-tudo-e-caixa` e contraste em `acessibilidade-para-todos`. As instruções próximas explicam quais controles usar e o que observar. As demonstrações de leitor de tela têm legenda narrável e reprodução pela voz do navegador, quando disponível.
- Kokoro retorna a duração em quadros para cada fonema. O gerador acumula esses quadros, os deslocamentos de cada frase e as pausas até obter os tempos associados a cada palavra. Para os MP3 novos da aula de Integração, a checagem de correlação do início do PCM decodificado registrou 0,00 ms de desvio. Esse número mede a codificação. A pronúncia dos termos ainda depende de escuta humana.
- A geração mantém o bloqueio `geracao.lock`. Depois da recuperação e de Integração, o lote usa um processo com três threads internas do Kokoro. Os logs de trabalho são `.cache/narration/estabilizacao/restantes.log` e `.cache/narration/estabilizacao/atualizacao.log`.

## Jornada testada no Chromium

- Perfil temporário, 360 px. Abri `/aulas`, depois `/aulas/fullstack` e `/aula/integracao-front-e-api?trilha=fullstack`. Resolvi a classificação, avancei para “Enviar dados com fetch”, recarreguei e usei “Retomar posição”. O trecho retomou a partir de 2,2 s e o progresso da resposta e da seção persistiu.
- Em `/percurso/api-react-tailwind/integracao-front-api`, conferi que o mesmo MP3 toca e que a leitura sozinha não grava respostas nem avanço. O áudio parou na navegação de volta ao Percurso. Na aula avulsa, parou ao recolher o fechamento.
- O Chromium reproduziu Santa e Dora em 1× e 1,35× e usou o tempo da mídia para destacar palavras no início, no meio e na última frase da apresentação. Os destaques conferidos incluíram “Integração”, “fetch”, “JSON” e “otimista”. A amostragem valida reprodução e destaque perante o relógio da mídia. Falta escuta humana para validar a correspondência auditiva e a pronúncia.
- A asserção “Próxima aula” ainda apontava para a ordem anterior a “Onde o dado mora”. O teste local de Python ficava esperando o fim da entrada padrão no sandbox. Atualizei a asserção e passei o JSON pela linha de comando do processo de teste, com diagnóstico por exercício.
- Em Integração, conferi clipes reais de erro e acerto, retorno ao ponto de pausa, início na seção seguinte e interrupção do áudio ao ocultar uma resposta ou avançar para o cartão seguinte.
- Comparei o roteiro com 8.845 campos visíveis das 78 aulas, incluindo as atividades montadas e as legendas. A comparação inicial encontrou crases literais no texto visível que deslocavam os índices das palavras. Ajustei a renderização de código dentro de negrito, títulos de observações e cabeçalhos e legendas de tabelas. A comparação final encontrou zero divergências nos campos comparados. Diagramas com estado comparam o campo montado e cartões comparam a frente atual.
- `npm run check`, `npm run test:run` (281 testes em 29 arquivos) e `npm run build` passaram. O build emitiu o aviso de dependência de navegadores desatualizada e de um pacote JavaScript acima de 500 KiB. Repeti os três comandos em uma cópia dos arquivos do commit, sem as edições locais de outras etapas, e passaram com 276 testes.

## Roteiro de cinco minutos

1. Abra `/aula/linux-e-terminal` em uma janela de 360 px. Em “Passeio por um servidor”, escreva `pwd`, mova o cursor para antes do `w` e pressione Enter. Confira a quebra no cursor e o contador em zero. Cole `pwd`, `cd /tmp` e `ls` em três linhas. Use Ctrl+Enter ou Cmd+Enter e confira o erro na linha 2. Troque `cd /tmp` por `cd /var/log` e acione “Executar”.
2. Abra `/aula/integracao-front-e-api`. Em “Onde cada tarefa acontece?”, use “Ouvir atividade”, responda os seis itens e confirme que “Ouvir feedback” aparece após “Verificar”. Experimente Santa em 1× e Dora em 1,35×. Compare “fetch”, “JSON”, “CORS” e a última frase do trecho com o destaque.
3. Em Integração, abra a aula inteira, comece a ouvir o fechamento e recolha as demais seções. Confirme que o áudio para. Abra `/percurso/api-react-tailwind/integracao-front-api` e confira a leitura da mesma atividade. Ao sair da etapa, confirme que o áudio para.

## Resultado do lote — 18/11/2026 às 02h10

| Voz | Aulas verificadas | MP3 verificados | Duração total |
| --- | ---: | ---: | ---: |
| Santa | 78 | 4.487 | 18h25min13s |
| Dora | 78 | 4.487 | 17h52min51s |

- As 12 aulas restantes entraram no catálogo com `batch_exit=0`. A regeneração de 65 aulas já catalogadas terminou com `refresh_exit=0`. Nenhuma aula ficou pendente e a auditoria final do roteiro, dos manifestos, dos MP3 e dos offsets retornou zero erros e zero alertas.
- Os resultados por aula estão em `.cache/narration/estabilizacao/verificacao-final/`. O resumo está em `.cache/narration/estabilizacao/resumo-final.json`. Os logs do lote estão em `restantes.log` e `atualizacao.log` no mesmo diretório.
- Repeti os fluxos de terminal em 360 px, feedback, respostas reveladas, retomada após recarga e pausa ao sair também na prévia do build final. A conferência de pronúncia e sincronia auditiva fica no roteiro de cinco minutos.

Para gerar futuramente após editar uma aula, use `--remaining` para acrescentar as que ainda estiverem fora do catálogo e `--stale` para atualizar as já catalogadas. Preserve o log individual de qualquer falha antes de tentar novamente.

```bash
cd '/home/joaovt/Área de trabalho/site estudo/trilhainfo'
KOKORO_THREADS=3 flock -n .cache/narration/geracao.lock npm run narration:batch -- --remaining --jobs 1
KOKORO_THREADS=3 flock -n .cache/narration/geracao.lock npm run narration:batch -- --stale --jobs 1
```

O push para `nyx43/trilha-mod`, branch `feat/percurso-api-tailwind`, foi bloqueado pela revisão automática, que solicitou autorização explícita do conteúdo e destino. A branch local contém o código, os testes, os relatórios e os áudios verificados. A configuração local espera `yarn` no hook, que estava indisponível. Rodei ESLint diretamente nos arquivos de comportamento alterados, além da suíte e do build.

## Prévia, CI, diagnóstico e plano de aulas — 18/11/2026

- O build gera HTML próprio para o recomendador, a página do Percurso, as cinco etapas e a prática de diagnóstico. Conferi oito acessos diretos a partir do build no Chromium, com HTTP 404 para uma etapa inexistente. Também conferi o download do ZIP e a reprodução da narração com HTTP 206 para um trecho do MP3.
- O GitHub Actions executa a instalação pelo lockfile, a checagem de tipos, a suíte, a auditoria dos áudios e o build. O lockfile passou a incluir as variantes opcionais de esbuild que o npm exige em uma instalação limpa. `npm run narration:check` conferiu as 78 aulas com Santa e Dora.
- A prática de diagnóstico oferece um ZIP portátil. Na cópia extraída, passaram 22 testes e 16 verificações de fumaça, incluindo as respostas 404 e 400. O Percurso salva a seção alcançada após o aluno avançar.
- O tutor tem uma rota da Vercel com ativação explícita. Testei a rota e a interface com respostas simuladas, incluindo validação do Turnstile por pergunta e recusa de origem ou ação incorreta. O README registra as variáveis necessárias para ativar o provedor no ambiente hospedado.
- O recomendador permite selecionar sugestões, salvar as práticas com critérios e retomar na seção indicada. No caso de API Node e frontend com Tailwind, React começa como opção e o plano inclui o checklist dos dois repositórios. Validei a retomada após recarga no Chromium a 360 px. O texto do enunciado fica fora da URL e do plano salvo.
- `npm ci`, `npm run check`, `npm run test:run` (287 testes), `npm run narration:check` e `npm run build` passaram localmente. A prévia remota depende de vincular o repositório a um projeto da Vercel. Não havia integração de deploy registrada no GitHub nem uma sessão Vercel disponível.

## Primeiro registro de evidências no Percurso Web — 18/11/2026

- A Vercel confirmou a criação de `trilha-mod` a partir de `nyx43/trilha-mod`. Na primeira consulta, a tela de importação ainda aguardava o deploy e mostrava `main` como origem.
- A missão final ganhou cinco critérios com resultado e evidência. O aluno pode indicar observação própria, teste executado ou revisão de outra pessoa. A avaliação é salva no navegador e tem armazenamento independente do checklist e da conclusão do percurso.
- A prática passou a cobrir as cinco falhas do laboratório. Os três cenários acrescentados são API inacessível, CORS na resposta do cadastro e lista desatualizada. Cada um tem roteiro, dicas, evidência esperada e solução recolhida. O ZIP existente já contém os cinco cenários.
- No navegador, abri a avaliação pelo teclado, confirmei a exigência de evidência, salvei o resultado e recarreguei a página. Também segui o link da missão para o laboratório, naveguei até o cenário de CORS e abri sua solução pelo teclado. A checagem de tipos, 288 testes, a auditoria das 78 aulas nas duas vozes e o build passaram.
- O próximo teste pedagógico é observar um iniciante executando a missão do início ao cadastro, usando a avaliação para registrar onde precisou de ajuda.

## Deploy validado na Vercel — 18/11/2026

- O push de `5d5129d` na branch `feat/percurso-api-tailwind` acionou o deploy automaticamente. A Vercel registrou a branch e o commit como origem, o ambiente como Produção e o status como Ready. O domínio saiu em [trilha-mod.vercel.app](https://trilha-mod.vercel.app). [Detalhes do deploy](https://vercel.com/joaovitorgamer776-4898/trilha-mod/3GvDh4WTMQfWoKepbAgWkyqLeS8c).
- Por acesso direto no domínio publicado, abriram o recomendador, o índice do Percurso Web, as cinco etapas e o diagnóstico. A etapa inexistente devolveu HTTP 404. A missão mostrou a avaliação e o diagnóstico mostrou os cinco cenários.
- O ZIP devolveu HTTP 200 e a cópia extraída passou em 22 testes e 16 verificações de fumaça. Os pedidos parciais de MP3 de Santa e Dora devolveram HTTP 206 com `audio/mpeg`. No navegador, o player apresentou avanço do trecho de abertura. A revisão auditiva de pronúncia e sincronia segue no roteiro de cinco minutos.
- O GitHub Actions concluiu a instalação pelo lockfile, a checagem de tipos, os 288 testes, a auditoria da narração e o build. [Execução no GitHub](https://github.com/nyx43/trilha-mod/actions/runs/44278758341).
