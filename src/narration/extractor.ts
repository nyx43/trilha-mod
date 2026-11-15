import { plain } from '../components/Guide/inline';
import { GuideBlock } from '../guides/types';
import { LessonBlock, LessonContent, LessonMeta } from '../lessons/types';
import { stableShuffle } from '../lessons/tools';
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
  interactiveKind?: 'flow' | 'anatomy';
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
    interactiveKind: params.interactiveKind,
    label: params.label,
  };
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
        fields: [makeField('front', card.front)],
        label: 'Cartão de revisão (frente)',
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
