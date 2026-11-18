import { PiInfo, PiLightbulb, PiWarning } from 'react-icons/pi';
import { GuideBlock } from '../../guides/types';
import { NarrationBlockButton } from '../../narration/NarrationPlayer';
import { Checklist } from './Checklist';
import { CodeBlock } from './CodeBlock';
import {
  ComplexityChart,
  JoinDiagrams,
  LayoutDemo,
  Pyramid,
  ScriptTimelines,
  SequenceDiagram,
} from './diagrams';
import { Inline } from './inline';

const callouts = {
  tip: { label: 'Dica', Icon: PiLightbulb },
  warning: { label: 'Atenção', Icon: PiWarning },
  note: { label: 'Observação', Icon: PiInfo },
};

export function GuideBlockView({
  block,
  guideId,
  narrationClipId,
}: {
  block: GuideBlock;
  guideId: string;
  narrationClipId?: string;
}) {
  switch (block.type) {
    case 'text':
      return (
        <p className="guide-text" data-narration-clip={narrationClipId}>
          <span data-narration-field={narrationClipId ? 'text' : undefined}>
            <Inline text={block.text} />
          </span>
          {narrationClipId && (
            <>
              {' '}
              <NarrationBlockButton clipId={narrationClipId} label="Ouvir parágrafo" />
            </>
          )}
        </p>
      );
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      if (!narrationClipId) {
        return (
          <List className="guide-list" data-ordered={block.ordered || undefined}>
            {block.items.map((item) => (
              <li key={item}>
                <Inline text={item} />
              </li>
            ))}
          </List>
        );
      }
      return (
        <div className="narration-list-wrap" data-narration-clip={narrationClipId}>
          <div className="narration-clip-controls">
            <NarrationBlockButton clipId={narrationClipId} label="Ouvir lista" />
          </div>
          <List className="guide-list" data-ordered={block.ordered || undefined}>
            {block.items.map((item, idx) => (
              <li key={item} data-narration-field={`item:${idx}`}>
                <Inline text={item} />
              </li>
            ))}
          </List>
        </div>
      );
    }
    case 'callout': {
      const { label, Icon } = callouts[block.tone];
      return (
        <aside
          className="guide-callout"
          data-tone={block.tone}
          data-narration-clip={narrationClipId}
        >
          <Icon aria-hidden="true" />
          <div>
            <p
              className="guide-callout-title"
              data-narration-field={narrationClipId && block.title ? 'title' : undefined}
            >
              <Inline text={block.title || label} />
            </p>
            <p data-narration-field={narrationClipId ? 'text' : undefined}>
              <Inline text={block.text} />
            </p>
            {narrationClipId && (
              <div className="narration-clip-controls">
                <NarrationBlockButton clipId={narrationClipId} label="Ouvir observação" />
              </div>
            )}
          </div>
        </aside>
      );
    }
    case 'code':
      return (
        <CodeBlock
          language={block.language}
          code={block.code}
          caption={block.caption}
          output={block.output}
          narrationClipId={narrationClipId}
        />
      );
    case 'steps':
      return (
        <div data-narration-clip={narrationClipId}>
          {narrationClipId && (
            <NarrationBlockButton clipId={narrationClipId} label="Ouvir passo a passo" />
          )}
          <ol className="guide-steps">
            {block.items.map((item, index) => (
              <li key={item.title}>
                <span className="guide-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 data-narration-field={narrationClipId ? `item:${index}:title` : undefined}>
                    <Inline text={item.title} />
                  </h3>
                  <p data-narration-field={narrationClipId ? `item:${index}:text` : undefined}>
                    <Inline text={item.text} />
                  </p>
                  {item.code && <CodeBlock language="terminal" code={item.code} compact />}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case 'cards':
      return (
        <div data-narration-clip={narrationClipId}>
          {narrationClipId && (
            <NarrationBlockButton clipId={narrationClipId} label="Ouvir cartões" />
          )}
          <ul className="guide-panels" data-columns={block.columns || 2}>
            {block.items.map((item, index) => (
              <li key={item.title} className="guide-panel">
                {item.label && (
                  <p
                    className="guide-panel-label"
                    data-narration-field={narrationClipId ? `item:${index}:label` : undefined}
                  >
                    <Inline text={item.label} />
                  </p>
                )}
                <h3 data-narration-field={narrationClipId ? `item:${index}:title` : undefined}>
                  <Inline text={item.title} />
                </h3>
                <p data-narration-field={narrationClipId ? `item:${index}:text` : undefined}>
                  <Inline text={item.text} />
                </p>
                {item.points && (
                  <ul>
                    {item.points.map((point, i) => (
                      <li
                        key={point}
                        data-narration-field={
                          narrationClipId ? `item:${index}:point:${i}` : undefined
                        }
                      >
                        <Inline text={point} />
                      </li>
                    ))}
                  </ul>
                )}
                {item.code && <CodeBlock language="exemplo" code={item.code} compact />}
              </li>
            ))}
          </ul>
        </div>
      );
    case 'table':
      return (
        <div
          className="guide-table"
          role="region"
          aria-label={block.caption}
          tabIndex={0}
          data-narration-clip={narrationClipId}
        >
          {narrationClipId && (
            <NarrationBlockButton clipId={narrationClipId} label="Ouvir tabela" />
          )}
          <table>
            <caption data-narration-field={narrationClipId ? 'caption' : undefined}>
              <Inline text={block.caption} />
            </caption>
            <thead>
              <tr>
                {block.head.map((cell, index) => (
                  <th
                    key={cell}
                    scope="col"
                    data-narration-field={narrationClipId ? `head:${index}` : undefined}
                  >
                    <Inline text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={row.join('|')}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th
                        key={index}
                        scope="row"
                        data-narration-field={
                          narrationClipId ? `cell:${rowIndex}:${index}` : undefined
                        }
                      >
                        <Inline text={cell} />
                      </th>
                    ) : (
                      <td
                        key={index}
                        data-narration-field={
                          narrationClipId ? `cell:${rowIndex}:${index}` : undefined
                        }
                      >
                        <Inline text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'terms':
      return (
        <div data-narration-clip={narrationClipId}>
          {narrationClipId && (
            <NarrationBlockButton clipId={narrationClipId} label="Ouvir glossário" />
          )}
          <dl className="guide-terms">
            {block.items.map((item, index) => (
              <div key={item.term}>
                <dt data-narration-field={narrationClipId ? `term:${index}` : undefined}>
                  <Inline text={item.term} />
                </dt>
                <dd data-narration-field={narrationClipId ? `definition:${index}` : undefined}>
                  <Inline text={item.text} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 'sequence':
      return <SequenceDiagram block={block} narrationClipId={narrationClipId} />;
    case 'scripts':
      return <ScriptTimelines block={block} />;
    case 'complexity':
      return <ComplexityChart block={block} narrationClipId={narrationClipId} />;
    case 'joins':
      return <JoinDiagrams block={block} narrationClipId={narrationClipId} />;
    case 'pyramid':
      return <Pyramid block={block} narrationClipId={narrationClipId} />;
    case 'layout':
      return <LayoutDemo block={block} />;
    case 'checklist':
      return <Checklist guideId={guideId} listId={block.id} items={block.items} />;
  }
}
