# Estabilização do estudo com terminal e narração

## Ponto de partida — 17/11/2026

- Trabalho local na branch `feat/percurso-api-tailwind`, com alterações e áudios de sessões anteriores. Nenhuma alteração enviada ao GitHub.
- O bloqueio de geração estava disponível. O lote anterior registrava quatro falhas, incluindo `onde-o-dado-mora`. O log individual dessa aula tinha zero bytes.
- Preservei os logs, o PID anterior e a auditoria em `.cache/narration/estabilizacao/anterior.6fWNmu/`. A tentativa de recuperação roda com uma aula e um processo e registra o status em `.cache/narration/estabilizacao/recuperacao.log`.
- Base inicial: 78 aulas, 65 catalogadas, 65 manifestos com Santa e Dora e 2.960 MP3 de cada voz nessas 65 aulas. Incluindo aulas parciais, havia 3.030 MP3 de Santa e 3.028 de Dora.
- As 13 pendentes no início eram `arrays-mapas-e-complexidade`, `codigo-depuracao-e-revisao`, `curriculo-vaga-e-apresentacao`, `desafio-tecnico-e-conversa`, `estrategia-de-cobertura-e-ci`, `exploratorio-e-relato-de-bugs`, `http-dados-e-seguranca-na-entrevista`, `onde-o-dado-mora`, `playwright-para-web`, `raciocinio-e-comunicacao`, `revise-a-carreira-escolhida`, `tecnicas-e-riscos` e `testes-de-api`.

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
