import { useNarrationOptional } from '../../narration/controller';
import { GuideBlockView } from '../Guide/GuideBlock';
import { LessonBlock } from '../../lessons/types';
import { Classify, Fill, Order, Quiz } from './activities';
import { BoxModel, ContrastLab, LayoutLab, SpecificityLab } from './labs';
import { Playground } from './Playground';
import { PythonLab, SqlLab, Terminal } from './runners';
import { Analogy, Anatomy, CodeTabs, DomTree, Flow, Reveal, ScreenReader, Trace } from './visuals';

export function LessonBlockView({
  block,
  activityId,
  lessonId,
  narrationClipId,
}: {
  block: LessonBlock;
  activityId: string;
  lessonId: string;
  narrationClipId?: string;
}) {
  const narration = useNarrationOptional();
  const clipId = narrationClipId ?? (narration?.enabled ? activityId : undefined);

  switch (block.type) {
    case 'quiz':
      return <Quiz block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'order':
      return <Order block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'classify':
      return <Classify block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'fill':
      return <Fill block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'playground':
      return <Playground block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'terminal':
      return <Terminal block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'sql':
      return <SqlLab block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'python':
      return <PythonLab block={block} activityId={activityId} narrationClipId={clipId} />;
    case 'analogy':
      return <Analogy block={block} narrationClipId={clipId} />;
    case 'reveal':
      return <Reveal block={block} narrationClipId={clipId} />;
    case 'anatomy':
      return <Anatomy block={block} narrationClipId={clipId} />;
    case 'flow':
      return <Flow block={block} narrationClipId={clipId} />;
    case 'trace':
      return <Trace block={block} />;
    case 'codeTabs':
      return <CodeTabs block={block} narrationClipId={clipId} />;
    case 'domTree':
      return <DomTree block={block} />;
    case 'screenReader':
      return <ScreenReader block={block} />;
    case 'boxModel':
      return <BoxModel />;
    case 'layoutLab':
      return <LayoutLab block={block} />;
    case 'specificity':
      return <SpecificityLab block={block} />;
    case 'contrast':
      return <ContrastLab block={block} />;
    default:
      return <GuideBlockView block={block} guideId={`aula-${lessonId}`} narrationClipId={clipId} />;
  }
}
