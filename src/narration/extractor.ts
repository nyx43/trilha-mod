import { plain } from '../components/Guide/inline';
import { GuideBlock } from '../guides/types';
import { LessonBlock, LessonContent, LessonMeta } from '../lessons/types';
import { classifyRetry, classifySuccess, stableShuffle } from '../lessons/tools';
import { sha256Hex } from './hash';
import {
  NarrationBlockKind,
  NarrationClipSpec,
  NarrationField,
  NarrationLessonScript,
  NarrationUncoveredBlock,
} from './types';

function makeField(field: string, raw: string | undefined): NarrationField | null {
  if (!raw || !raw.trim()) return null;
  const text = plain(raw).trim();
  if (!text) return null;
  return { field, text, raw };
}

export function computeClipTextHash(fields: NarrationField[]): string {
  const canonical = fields.map((f) => `${f.field}=${f.text}`).join('\n');
  return sha256Hex(canonical);
}

function createClipSpec(params: {
  id: string;
  sectionId: string;
  kind: NarrationBlockKind;
  blockIndex: number;
  blockType?: string;
  fields: Array<NarrationField | null>;
  label: string;
  pauseAfter?: boolean;
  onDemand?: boolean;
  interactiveKind?: NarrationClipSpec['interactiveKind'];
}): NarrationClipSpec | null {
  const fields = params.fields.filter((f): f is NarrationField => f !== null);
  if (fields.length === 0) return null;
  const canonicalText = fields.map((f) => f.text).join('\n');
  return {
    id: params.id,
    sectionId: params.sectionId,
    kind: params.kind,
    blockIndex: params.blockIndex,
    blockType: params.blockType,
    fields,
    canonicalText,
    textHash: computeClipTextHash(fields),
    pauseAfter: params.pauseAfter,
    onDemand: params.onDemand,
    interactiveKind: params.interactiveKind,
    label: params.label,
  };
}

function diagramFields(
  block: Extract<
    LessonBlock,
    { type: 'domTree' | 'screenReader' | 'pyramid' | 'sequence' | 'joins' | 'complexity' }
  >,
): Array<NarrationField | null> {
  switch (block.type) {
    case 'pyramid':
      return [
        makeField('caption', block.caption),
        ...block.levels.flatMap((level, i) => [
          makeField(`item:${i}:title`, level.title),
          makeField(`item:${i}:text`, level.text),
        ]),
      ];
    case 'sequence':
      return [
        makeField('caption', block.caption),
        ...block.messages.flatMap((message, i) => [
          makeField(
            `item:${i}:route`,
            message.from === message.to
              ? block.actors[message.from]
              : `De ${block.actors[message.from]} para ${block.actors[message.to]}`,
          ),
          makeField(`item:${i}:title`, message.label),
          makeField(`item:${i}:text`, message.text),
        ]),
      ];
    case 'joins':
      return [
        makeField('caption', `Tabela A: ${block.tables[0]}. Tabela B: ${block.tables[1]}.`),
        ...block.items.flatMap((item, i) => [
          makeField(`item:${i}:title`, item.title),
          makeField(`item:${i}:text`, item.text),
        ]),
      ];
    case 'complexity':
      return block.items.flatMap((item, i) => [
        makeField(`item:${i}:title`, item.name),
        makeField(`item:${i}:text`, item.text),
        makeField(`item:${i}:example`, item.example),
      ]);
    default:
      return [makeField('caption', block.caption)];
  }
}

function extractBlockSpec(
  sectionId: string,
  blockIndex: number,
  block: LessonBlock | GuideBlock,
): { clip: NarrationClipSpec | null; uncovered: NarrationUncoveredBlock | null } {
  const id = `${sectionId}:${blockIndex}`;

  switch (block.type) {
    case 'text':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'prose',
          blockIndex,
          blockType: block.type,
          fields: [makeField('text', block.text)],
          label: 'Parágrafo',
        }),
        uncovered: null,
      };

    case 'analogy':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'analogy',
          blockIndex,
          blockType: block.type,
          fields: [makeField('title', block.title), makeField('text', block.text)],
          label: block.title ? `Analogia: ${plain(block.title)}` : 'Analogia',
        }),
        uncovered: null,
      };

    case 'callout':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'callout',
          blockIndex,
          blockType: block.type,
          fields: [makeField('title', block.title), makeField('text', block.text)],
          label: block.title ? `Observação: ${plain(block.title)}` : 'Observação',
        }),
        uncovered: null,
      };

    case 'list':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'list',
          blockIndex,
          blockType: block.type,
          fields: block.items.map((item, i) => makeField(`item:${i}`, item)),
          label: 'Lista',
        }),
        uncovered: null,
      };

    case 'steps':
    case 'cards':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: block.type,
          blockIndex,
          blockType: block.type,
          fields: block.items.flatMap((item, i) => [
            makeField(`item:${i}:label`, 'label' in item ? item.label : undefined),
            makeField(`item:${i}:title`, item.title),
            makeField(`item:${i}:text`, item.text),
            ...('points' in item ? item.points ?? [] : []).map((point, j) =>
              makeField(`item:${i}:point:${j}`, point),
            ),
          ]),
          label: block.type === 'steps' ? 'Passo a passo' : 'Cartões',
        }),
        uncovered: null,
      };

    case 'code': {
      const caption = makeField('caption', block.caption);
      if (!caption) {
        return {
          clip: null,
          uncovered: {
            sectionId,
            blockIndex,
            blockType: block.type,
            reason: 'Bloco de código sem legenda descritiva (`caption`).',
          },
        };
      }
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'code-caption',
          blockIndex,
          blockType: block.type,
          fields: [caption],
          label: 'Legenda de código',
        }),
        uncovered: null,
      };
    }

    case 'codeTabs': {
      const caption = makeField('caption', block.caption);
      if (!caption) {
        return {
          clip: null,
          uncovered: {
            sectionId,
            blockIndex,
            blockType: block.type,
            reason: 'Bloco de código em abas sem legenda (`caption`).',
          },
        };
      }
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'code-tabs-caption',
          blockIndex,
          blockType: block.type,
          fields: [caption],
          label: 'Legenda de código em abas',
        }),
        uncovered: null,
      };
    }

    case 'table':
    case 'terms':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: block.type,
          blockIndex,
          blockType: block.type,
          fields:
            block.type === 'table'
              ? [
                  makeField('caption', block.caption),
                  ...block.head.map((cell, i) => makeField(`head:${i}`, cell)),
                  ...block.rows.flatMap((row, r) =>
                    row.map((cell, c) => makeField(`cell:${r}:${c}`, cell)),
                  ),
                ]
              : block.items.flatMap((item, i) => [
                  makeField(`term:${i}`, item.term),
                  makeField(`definition:${i}`, item.text),
                ]),
          label: block.type === 'table' ? 'Tabela' : 'Glossário',
        }),
        uncovered: null,
      };

    case 'flow':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'flow',
          blockIndex,
          blockType: block.type,
          interactiveKind: 'flow',
          fields: [
            makeField('caption', block.caption),
            ...block.steps.flatMap((step, i) => [
              makeField(`step:${i}:label`, step.label),
              makeField(`step:${i}:text`, step.text),
            ]),
          ],
          label: block.caption ? `Diagrama: ${plain(block.caption)}` : 'Diagrama de fluxo',
        }),
        uncovered: null,
      };

    case 'trace':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'visual',
          blockIndex,
          blockType: block.type,
          interactiveKind: 'trace',
          fields: [
            makeField('caption', block.caption),
            ...block.steps.flatMap((step, i) => [
              makeField(`step:${i}:line`, `Linha ${step.line}`),
              makeField(`step:${i}:text`, step.note),
            ]),
          ],
          label: 'Execução passo a passo',
        }),
        uncovered: null,
      };

    case 'domTree':
    case 'screenReader':
    case 'pyramid':
    case 'sequence':
    case 'joins':
    case 'complexity':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'visual',
          blockIndex,
          blockType: block.type,
          fields: diagramFields(block),
          pauseAfter: block.type === 'screenReader' || undefined,
          label: block.type === 'screenReader' ? 'Demonstração de leitor de tela' : 'Diagrama',
        }),
        uncovered: null,
      };

    case 'anatomy': {
      const labeledParts = block.parts
        .map((part, index) => ({ part, index }))
        .filter((entry) => Boolean(entry.part.label || entry.part.note));
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'anatomy',
          blockIndex,
          blockType: block.type,
          interactiveKind: 'anatomy',
          fields: [
            makeField('caption', block.caption),
            ...labeledParts.flatMap(({ part, index }) => [
              makeField(`part:${index}:label`, part.label),
              makeField(`part:${index}:note`, part.note),
            ]),
          ],
          label: block.caption ? `Anatomia: ${plain(block.caption)}` : 'Anatomia',
        }),
        uncovered: null,
      };
    }

    case 'reveal':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'reveal',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [makeField('question', block.question)],
          label: 'Pergunta para refletir (resposta oculta)',
        }),
        uncovered: null,
      };

    case 'quiz':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'quiz',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [
            makeField('question', block.question),
            ...block.options.map((opt, i) => makeField(`option:${i}`, opt.text)),
          ],
          label: 'Atividade: múltipla escolha',
        }),
        uncovered: null,
      };

    case 'classify':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'classify',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [
            makeField('prompt', block.prompt),
            ...block.buckets.map((bucket, i) => makeField(`bucket:${i}`, bucket)),
            ...stableShuffle(block.items, id + block.prompt).map((item) =>
              makeField(`item:${block.items.indexOf(item)}`, item.text),
            ),
          ],
          label: 'Atividade: classificação',
        }),
        uncovered: null,
      };

    case 'fill':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'fill',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [makeField('prompt', block.prompt)],
          label: 'Atividade: completar lacunas',
        }),
        uncovered: null,
      };

    case 'order':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'order',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [makeField('prompt', block.prompt)],
          label: 'Atividade: ordenação',
        }),
        uncovered: null,
      };

    case 'terminal':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'terminal',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [makeField('title', block.title), makeField('task', block.task)],
          label: `Terminal: ${plain(block.title)}`,
        }),
        uncovered: null,
      };

    case 'sql':
    case 'python':
    case 'playground':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'playground',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [makeField('title', block.title), makeField('task', block.task)],
          label: `Laboratório: ${plain(block.title)}`,
        }),
        uncovered: null,
      };

    case 'boxModel':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'playground',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [
            makeField(
              'task',
              'Laboratório do modelo de caixa. Ajuste largura, preenchimento interno, borda e margem e alterne entre content-box e border-box para observar como o tamanho final muda. Vou pausar agora para você experimentar.',
            ),
          ],
          label: 'Laboratório: modelo de caixa',
        }),
        uncovered: null,
      };

    case 'layoutLab': {
      const isFlex = block.mode === 'flex';
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'playground',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [
            makeField(
              'task',
              isFlex
                ? 'Laboratório de Flexbox. Altere a direção do eixo principal, o alinhamento, a quebra de linha, o espaçamento e a quantidade de itens para observar como o container organiza os blocos. Vou pausar agora para você testar.'
                : 'Laboratório de CSS Grid. Troque o modelo de colunas, faça o primeiro item ocupar mais colunas e ajuste o espaçamento e a quantidade de itens para observar a grade reagir. Vou pausar agora para você experimentar.',
            ),
          ],
          label: isFlex ? 'Laboratório: Flexbox' : 'Laboratório: CSS Grid',
        }),
        uncovered: null,
      };
    }

    case 'specificity':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'playground',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [
            makeField(
              'caption',
              'Escreva dois seletores para o mesmo elemento e veja qual vence. A pontuação é comparada da esquerda para a direita: uma coluna só importa quando as anteriores empatam.',
            ),
            makeField(
              'task',
              'Teste os pares de exemplo ou digite seletores próprios para comparar a pontuação. Vou pausar agora para você experimentar.',
            ),
          ],
          label: 'Laboratório: especificidade',
        }),
        uncovered: null,
      };

    case 'contrast':
      return {
        clip: createClipSpec({
          id,
          sectionId,
          kind: 'playground',
          blockIndex,
          blockType: block.type,
          pauseAfter: true,
          fields: [
            makeField(
              'task',
              'Laboratório de contraste de cores. Ajuste a cor do texto e a cor do fundo para acompanhar a razão de contraste e conferir se a leitura passa nos níveis AA e AAA. Vou pausar agora para você experimentar.',
            ),
          ],
          label: 'Laboratório: contraste de cores',
        }),
        uncovered: null,
      };

    default:
      return {
        clip: null,
        uncovered: {
          sectionId,
          blockIndex,
          blockType: block.type,
          reason: `Tipo de bloco "${block.type}" ainda não possui regra de narração definida.`,
        },
      };
  }
}

export function extractLessonNarrationSpec(
  lesson: LessonMeta,
  content: LessonContent,
): NarrationLessonScript {
  const clips: NarrationClipSpec[] = [];
  const uncoveredBlocks: NarrationUncoveredBlock[] = [];

  const pushClip = (clip: NarrationClipSpec | null) => {
    if (clip) clips.push(clip);
  };

  pushClip(
    createClipSpec({
      id: 'header',
      sectionId: 'header',
      kind: 'header',
      blockIndex: -1,
      fields: [makeField('title', lesson.title), makeField('summary', lesson.summary)],
      label: `Cabeçalho da aula: ${plain(lesson.title)}`,
    }),
  );

  pushClip(
    createClipSpec({
      id: 'hook',
      sectionId: 'hook',
      kind: 'hook',
      blockIndex: -1,
      fields: [makeField('text', content.hook)],
      label: 'Abertura da aula',
    }),
  );

  for (const section of content.sections) {
    pushClip(
      createClipSpec({
        id: `${section.id}:heading`,
        sectionId: section.id,
        kind: 'section-heading',
        blockIndex: -1,
        fields: [makeField('title', section.title)],
        label: `Seção: ${plain(section.title)}`,
      }),
    );

    section.blocks.forEach((block, blockIndex) => {
      const { clip, uncovered } = extractBlockSpec(section.id, blockIndex, block);
      pushClip(clip);
      if (uncovered) uncoveredBlocks.push(uncovered);

      const extra = {
        sectionId: section.id,
        blockIndex,
        blockType: block.type,
        onDemand: true,
      };
      const blockId = `${section.id}:${blockIndex}`;
      if (block.type === 'classify') {
        pushClip(
          createClipSpec({
            ...extra,
            id: `${blockId}:feedback:correct`,
            kind: 'activity-feedback',
            fields: [makeField('title', classifySuccess), makeField('text', block.explanation)],
            label: 'Feedback da classificação',
          }),
        );
        pushClip(
          createClipSpec({
            ...extra,
            id: `${blockId}:feedback:retry`,
            kind: 'activity-feedback',
            fields: [makeField('text', classifyRetry)],
            label: 'Feedback da classificação',
          }),
        );
      }
      if (block.type === 'reveal') {
        pushClip(
          createClipSpec({
            ...extra,
            id: `${blockId}:answer`,
            kind: 'revealed-answer',
            fields: [makeField('answer', block.answer)],
            label: 'Resposta revelada',
          }),
        );
      }
    });
  }

  pushClip(
    createClipSpec({
      id: 'fechamento:heading',
      sectionId: 'fechamento',
      kind: 'fechamento-heading',
      blockIndex: -1,
      fields: [makeField('title', 'Fechamento')],
      label: 'Fechamento',
    }),
  );

  pushClip(
    createClipSpec({
      id: 'fechamento:recap',
      sectionId: 'fechamento',
      kind: 'fechamento-recap',
      blockIndex: -1,
      fields: content.recap.map((item, i) => makeField(`item:${i}`, item)),
      label: 'Síntese de fechamento',
    }),
  );

  for (const card of content.cards) {
    pushClip(
      createClipSpec({
        id: `fechamento:card:${card.id}:front`,
        sectionId: 'fechamento',
        kind: 'fechamento-card',
        blockIndex: -1,
        pauseAfter: true,
        fields: [makeField('front', card.front)],
        label: 'Cartão de revisão (frente)',
      }),
    );
    pushClip(
      createClipSpec({
        id: `fechamento:card:${card.id}:back`,
        sectionId: 'fechamento',
        kind: 'revealed-answer',
        blockIndex: -1,
        onDemand: true,
        fields: [makeField('back', card.back)],
        label: 'Cartão de revisão (resposta)',
      }),
    );
  }

  if (content.mission) {
    pushClip(
      createClipSpec({
        id: 'fechamento:mission',
        sectionId: 'fechamento',
        kind: 'fechamento-mission',
        blockIndex: -1,
        fields: [
          makeField('title', content.mission.title),
          makeField('text', content.mission.text),
        ],
        label: `Missão: ${plain(content.mission.title)}`,
      }),
    );
  }

  return {
    schemaVersion: 1,
    lessonId: lesson.id,
    lessonTitle: plain(lesson.title),
    clips,
    uncoveredBlocks,
  };
}
