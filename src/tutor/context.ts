import type { LessonBlock, LessonSection } from '../lessons/types';
import { tutorLimits } from './types';

function studyText(block: LessonBlock): string {
  switch (block.type) {
    case 'text':
      return block.text;
    case 'callout':
    case 'analogy':
      return [block.title, block.text].filter(Boolean).join('\n');
    case 'list':
      return block.items.join('\n');
    case 'code':
      return [block.caption, block.code].filter(Boolean).join('\n');
    case 'trace':
      return [block.caption, block.code].join('\n');
    case 'anatomy':
      return [block.caption, block.parts.map((part) => part.text).join('')].join('\n');
    case 'steps':
    case 'cards':
      return block.items.map((item) => [item.title, item.text].join('\n')).join('\n');
    case 'terms':
      return block.items.map((item) => [item.term, item.text].join(' — ')).join('\n');
    case 'flow':
      return [block.caption, ...block.steps.map((step) => step.text)].join('\n');
    case 'table':
      return [
        block.caption,
        block.head.join(' | '),
        ...block.rows.map((row) => row.join(' | ')),
      ].join('\n');
    case 'quiz':
    case 'reveal':
      return block.question;
    case 'order':
    case 'classify':
    case 'fill':
      return block.prompt;
    case 'playground':
    case 'sql':
    case 'python':
      return [block.title, block.task, ...(block.checks ?? []).map((check) => check.label)]
        .filter(Boolean)
        .join('\n');
    case 'terminal':
      return [block.title, block.task, ...block.steps.map((step) => step.goal)]
        .filter(Boolean)
        .join('\n');
    default:
      return '';
  }
}

export function lessonTutorContext(
  title: string,
  summary: string,
  hook: string,
  section?: LessonSection,
): string {
  return [
    title,
    summary,
    section ? [section.title, ...section.blocks.map(studyText)].filter(Boolean).join('\n\n') : hook,
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, tutorLimits.context);
}
