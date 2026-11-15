# Relatório do piloto de narração sincronizada

A revisão posterior disponibilizou **Santa (masculina)** e **Dora (feminina)** no piloto e acrescentou os seis itens da primeira atividade de classificação à narração. As medições abaixo registram a primeira entrega. A expansão usa `npm run narration:batch -- --jobs 4`, verifica cada aula e registra as aprovadas em `src/narration/catalog.json`. A auditoria atual inclui tabelas, glossários e enunciados de laboratórios de Python e SQL.

Nesta máquina, o ambiente e os pesos do Kokoro ficam em `.cache/narration/kokoro`. Em outra instalação, aponte `KOKORO_PYTHON` para o Python de um ambiente com `kokoro-onnx`, `numpy` e `soundfile`, e `KOKORO_MODEL_DIR` para a pasta com `kokoro-v1.0.onnx` e `voices-v1.0.bin`. A geração também usa `ffmpeg` e `ffprobe`.

Piloto entregue para a aula **Integração entre front e API** (`integracao-front-e-api`) tanto na rota avulsa (`/aula/integracao-front-e-api`) quanto na etapa correspondente do Percurso Web (`/percurso/api-react-tailwind/integracao-front-api`). Nenhuma outra aula do catálogo teve MP3s gerados nesta etapa.

## O que foi entregue no piloto

- **Extrator e manifest estático**: [src/narration/extractor.ts](../src/narration/extractor.ts), [scripts/narration/export-lessons.mjs](../scripts/narration/export-lessons.mjs) e [public/narration/integracao-front-e-api/manifest.json](../public/narration/integracao-front-e-api/manifest.json).
- **Pipeline offline (Kokoro ONNX + FFmpeg 64 kbps mono 24 kHz + verificador)**: [scripts/narration/generate_narration.py](../scripts/narration/generate_narration.py), [scripts/narration/lexicon.json](../scripts/narration/lexicon.json) (`version: 1.0.0`) e [scripts/narration/verify_narration.py](../scripts/narration/verify_narration.py).
- **Player compartilhado e realce por palavra**: [src/narration/controller.tsx](../src/narration/controller.tsx), [src/narration/highlights.ts](../src/narration/highlights.ts), [src/narration/preferences.ts](../src/narration/preferences.ts), [src/narration/NarrationPlayer.tsx](../src/narration/NarrationPlayer.tsx), [src/narration/narration.css](../src/narration/narration.css) e [src/narration/registry.ts](../src/narration/registry.ts).
- **Integração nas aulas e no percurso**: [src/components/Lesson/LessonView.tsx](../src/components/Lesson/LessonView.tsx), [src/components/Lesson/LessonBlock.tsx](../src/components/Lesson/LessonBlock.tsx), [src/components/Lesson/visuals.tsx](../src/components/Lesson/visuals.tsx), [src/components/Lesson/activities.tsx](../src/components/Lesson/activities.tsx), [src/components/Lesson/Flashcards.tsx](../src/components/Lesson/Flashcards.tsx), [src/components/Lesson/Playground.tsx](../src/components/Lesson/Playground.tsx), [src/components/Lesson/runners.tsx](../src/components/Lesson/runners.tsx) e [src/pages/PercursoPage.tsx](../src/pages/PercursoPage.tsx).

## Métricas medidas e projeção do catálogo

| Escopo | Clipes | Palavras | Duração (`dora`) | Tamanho (`64 kbps`) |
| --- | ---: | ---: | ---: | ---: |
| Piloto `integracao-front-e-api` (gerado) | 50 | 1.908 | 818.855 ms (~13,65 min) | 6.586.072 B (~6,28 MB) |
| Auditoria atual do catálogo (77 aulas, apenas blocos já mapeados) | 3.293 | 107.262 | — (a medir após Web) | — (a medir após Web) |

- **Voz disponível no piloto**: `Dora (pf_dora)` pronta para ouvir; `Alex (pm_alex)` e `Santa (pm_santa)` aparecem no seletor como `em breve` até serem sintetizados com `--voices dora,alex,santa` para comparação direta antes dos próximos lotes.
- **Deriva de MP3 (`maxMp3DriftMs`)**: `0,0 ms` nos 50 clipes verificados por `verify_narration.py`.
- **Projeção inicial**: mantendo a proporção do piloto apenas sobre os 3.293 clipes já extraídos, 107.262 palavras corresponderiam a ~12,8 h / ~353 MB por voz (acima da estimativa inicial do plano por incluir títulos, diagramas e enunciados de atividades). O volume final deve ser medido ao fim do lote de Web, já incluindo as regras para blocos de tabela, termos e laboratórios hoje sem cobertura.

## Verificação realizada

### Suíte automatizada

- `npm run narration:verify -- --lesson integracao-front-e-api` (`status: PASS`, `50/50` clipes, `0` erros, `0` avisos).
- `npm run check`, `eslint` nos arquivos de narração/componentes integrados, `npm run test:run` (27 arquivos, 260 testes incluindo [src/narration/narration.test.tsx](../src/narration/narration.test.tsx)) e `npm run build`.

### Navegador real (Chrome DevTools sobre `vite preview`)

1. **`/aula/integracao-front-e-api` (desktop `1280×800`)**:
   - Realce palavra a palavra com `CSS.highlights` (`narr-current`, `narr-trail-new`, `narr-trail-mid`, `narr-trail-old`) inclusive sobre `<code>` (`http://localhost:5173`, `http://localhost:3000`) e `<strong>`.
   - Amostras de temporização confirmadas no manifesto: `fetch` (`4895–5145 ms`), `JSON` (`5345–5820 ms`), `CORS` (`5920–6270 ms`), `201` com marcação única (`27200–28000 ms`) e `JSON.stringify` (`40000–41500 ms`).
   - Reprodução medida nas velocidades `0,75×` (+580 ms), `1,35×` (+1029 ms) e `2,00×` (+1507 ms) em janelas de ~750 ms; preferências persistidas em `trilha-narration-prefs:v1` após recarregar a página.
   - Botão **Ouvir parágrafo** interrompido exatamente ao final do trecho sem avançar para o diagrama seguinte.
   - Com **Mostrar a aula inteira** marcado, a fila **Ouvir aula inteira** pausou após a atividade `Onde cada tarefa acontece?` exibindo **Retomar leitura** e avançou para a seção seguinte ao retomar.
   - Nos cartões de memorização, o botão **Ouvir frente** ficou disponível apenas na frente e sumiu ao virar para o verso.
   - Barra de progresso da aula (`0% da aula`) e `trilha-lessons:v1` permaneceram inalterados durante toda a reprodução.
2. **`/aula/integracao-front-e-api#cors` (viewport móvel `360×800`)**:
   - Abertura direta da seção `#cors`, gatilhos renderizados nos 7 blocos narráveis da seção e zero estouro horizontal (`scrollWidth === clientWidth === 360`).
3. **`/percurso/api-react-tailwind/integracao-front-api`**:
   - Reutilização dos mesmos manifest e MP3s de `integracao-front-e-api`, respeitando `stage.sectionIds` e sem incluir seções fora da etapa.
   - Testes a `0,75×`, `1,35×` e `2,00×`, pausa após atividade e preservação de `trilha-percurso:v1` (`null`).
4. **Navegação para outra aula (`/aulas` e `/aula/como-a-web-funciona`)**:
   - Reprodução encerrada ao sair da aula piloto e nenhuma requisição `fetch` para `/narration/` emitida em aulas fora do piloto (zero 404).

## Limitações de pronúncia para escuta humana

O léxico ([scripts/narration/lexicon.json](../scripts/narration/lexicon.json)) usa segmentos multilíngues (`pt-br` / `en-us`) e IPA para termos como `API`, `CORS`, `JSON`, `HTTP`, `URL`, `Vite`, `201` e URLs com porta (`localhost:5173` / `localhost:3000`). Pontos conhecidos para validar de ouvido antes de gerar o lote de Web:

1. **Estrangeirismos na voz `pf_dora`**: palavras em inglês (`fetch`, `curl`, `stringify`, `preflight`, `localhost`, `undefined`, `env`, `mode`, `body`) usam o segmento `en-us`, mas mantêm o timbre/fonética de base da voz pt-BR. Vale comparar **Dora**, **Alex** e **Santa** nesses trechos.
2. **Identificadores com pontuação**: expressões como `role="alert"`, `VITE_CHAVE_SECRETA=sk_live_...`, `JSON.stringify`, `import.meta.env.VITE_API_URL` e `http://localhost:5173` recebem leitura normalizada por regra exata no léxico; ocorrências fora das variações cadastradas podem precisar de novas entradas exatas para não perder sincronia de marcação.
3. **Rótulos simbólicos de diagrama**: setas em títulos de passo (ex.: `Pessoa → App React`) e valores negativos em atividades (`-5`) seguem a normalização do gerador; confirmar na escuta se alguma pausa entre rótulo e descrição precisa de pontuação extra.

## Blocos ainda sem cobertura

- **No piloto (`integracao-front-e-api`)**: `0` blocos sem cobertura na aula original; no percurso Web, a caixa editorial `Como aproveitar esta etapa na entrega` (`focusNote`) é exclusiva da rota do percurso e não faz parte da narração compartilhada. Exemplos de código (`code` / `codeTabs`) leem explicação e legenda; gabaritos, feedbacks ocultos, comandos de terminal/resolução e verso de cartões permanecem fora de propósito.
- **Nas 77 aulas do catálogo** (auditoria salva em `.cache/narration/catalog-audit.json` com base em [src/narration/extractor.ts](../src/narration/extractor.ts)):
  - `table` (71), `terms` (54), `python` (45), `sql` (36), `trace` (24), `cards` (22), `steps` (21), `screenReader` (4), `code` sem `caption` (3), `pyramid` (3), `domTree` (2), `layoutLab` (2), `joins` (2), `specificity` (1), `boxModel` (1), `contrast` (1), `sequence` (1), `complexity` (1).

## Comandos para atualizar uma aula ou trechos alterados

Os scripts abaixo estão registrados em [package.json](../package.json):

```bash
# 1. Reexportar roteiro e hashes de texto após editar uma aula
npm run narration:export -- --lesson integracao-front-e-api

# 2. Gerar/atualizar apenas os clipes cujo roteiro, voz, léxico ou versão mudou (cache por clipKey)
npm run narration:generate -- --lesson integracao-front-e-api --voices dora

# Regenerar um único bloco específico ou mais vozes (ex.: comparar Dora, Alex e Santa)
npm run narration:generate -- --lesson integracao-front-e-api --only-clip header --voices dora,alex,santa

# 3. Validar existência de MP3s, duração e ordem monotônica das marcas
npm run narration:verify -- --lesson integracao-front-e-api

# Opcional: auditar cobertura de tipos de bloco nas 77 aulas
npm run narration:audit
```

> [!NOTE]
> Se o texto de um bloco mudar no TypeScript sem rodar `narration:generate`, o `textHash` calculado no cliente diverge do `manifest.json` e o botão daquele trecho é exibido desabilitado (`Áudio desatualizado`) até a regeneração.
