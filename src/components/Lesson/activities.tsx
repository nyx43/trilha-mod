import { ReactNode, useId, useMemo, useState } from 'react';
import { PiArrowDown, PiArrowUp, PiCheckBold, PiXBold } from 'react-icons/pi';
import { recordAnswer } from '../../lessons/progress';
import {
  classifyRetry,
  classifySuccess,
  fillMatches,
  parseFill,
  stableShuffle,
} from '../../lessons/tools';
import { NarrationBlockButton } from '../../narration/NarrationPlayer';
import { CodeBlock } from '../Guide/CodeBlock';
import { Inline } from '../Guide/inline';
import { Block, useLessonIdentity } from './context';

function ActivityHeader({
  kind,
  id,
  text,
  fieldName,
  narrationClipId,
  buttonLabel = 'Ouvir atividade',
}: {
  kind: string;
  id: string;
  text: string;
  fieldName?: string;
  narrationClipId?: string;
  buttonLabel?: string;
}) {
  return (
    <header className="lesson-activity-head">
      <div className="narration-heading-row">
        <span className="lesson-activity-kind">{kind}</span>
        {narrationClipId && <NarrationBlockButton clipId={narrationClipId} label={buttonLabel} />}
      </div>
      <p id={id} data-narration-field={fieldName}>
        <Inline text={text} />
      </p>
    </header>
  );
}

function Feedback({ tone, children }: { tone?: 'right' | 'wrong'; children?: ReactNode }) {
  return (
    <div className="lesson-feedback" data-tone={tone} role="status" aria-live="polite">
      {tone && children && (
        <>
          <span className="lesson-feedback-icon" aria-hidden="true">
            {tone === 'right' ? <PiCheckBold /> : <PiXBold />}
          </span>
          <div>{children}</div>
        </>
      )}
    </div>
  );
}

export function Quiz({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'quiz'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const labelId = useId();
  const [tried, setTried] = useState<number[]>([]);
  const correct = block.options.findIndex((option) => option.correct);
  const chosen = tried[tried.length - 1];
  const solved = chosen === correct;

  function choose(index: number) {
    if (solved || tried.includes(index)) return;
    if (tried.length === 0) recordAnswer(lessonId, activityId, index === correct, revision);
    setTried((previous) => [...previous, index]);
  }

  return (
    <section
      className="lesson-activity"
      aria-labelledby={labelId}
      data-solved={solved || undefined}
      data-narration-clip={narrationClipId}
    >
      <ActivityHeader
        kind="Pergunta"
        id={labelId}
        text={block.question}
        fieldName={narrationClipId ? 'question' : undefined}
        narrationClipId={narrationClipId}
        buttonLabel="Ouvir pergunta"
      />
      {block.code && <CodeBlock language={block.language || 'código'} code={block.code} compact />}
      <ul className="lesson-options">
        {block.options.map((option, index) => {
          const state = tried.includes(index) ? (index === correct ? 'right' : 'wrong') : undefined;
          return (
            <li key={option.text}>
              <button
                type="button"
                data-state={state}
                aria-disabled={solved || tried.includes(index) || undefined}
                onClick={() => choose(index)}
              >
                <span className="lesson-option-letter" aria-hidden="true">
                  {state === 'right' ? (
                    <PiCheckBold />
                  ) : state === 'wrong' ? (
                    <PiXBold />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span data-narration-field={narrationClipId ? `option:${index}` : undefined}>
                  <Inline text={option.text} />
                </span>
                {state && (
                  <span className="sr-only">{state === 'right' ? ', correta' : ', incorreta'}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <Feedback tone={chosen === undefined ? undefined : solved ? 'right' : 'wrong'}>
        {chosen !== undefined && (
          <>
            <p className="lesson-feedback-title">
              {solved
                ? tried.length === 1
                  ? 'Isso mesmo, de primeira!'
                  : 'Agora sim.'
                : 'Ainda não. Vale a pena entender por quê:'}
            </p>
            <p>
              <Inline text={block.options[chosen].feedback} />
            </p>
            {!solved && <p className="lesson-feedback-hint">Escolha outra opção.</p>}
          </>
        )}
      </Feedback>
    </section>
  );
}

export function Order({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'order'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const labelId = useId();
  const [order, setOrder] = useState(() =>
    stableShuffle(
      block.items.map((_, index) => index),
      activityId + block.prompt,
    ),
  );
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const allRight = order.every((item, position) => item === position);

  function move(position: number, delta: number) {
    const target = position + delta;
    if (target < 0 || target >= order.length) return;
    setOrder((previous) => {
      const next = [...previous];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    });
    setChecked(false);
  }

  function check() {
    if (attempts === 0) recordAnswer(lessonId, activityId, allRight, revision);
    setAttempts((value) => value + 1);
    setChecked(true);
  }

  const rightCount = order.filter((item, position) => item === position).length;
  return (
    <section
      className="lesson-activity"
      aria-labelledby={labelId}
      data-solved={(checked && allRight) || undefined}
      data-narration-clip={narrationClipId}
    >
      <ActivityHeader
        kind="Coloque em ordem"
        id={labelId}
        text={block.prompt}
        fieldName={narrationClipId ? 'prompt' : undefined}
        narrationClipId={narrationClipId}
      />
      <ol className="lesson-order">
        {order.map((item, position) => {
          const state = checked ? (item === position ? 'right' : 'wrong') : undefined;
          return (
            <li key={item} data-state={state}>
              <span className="lesson-order-number" aria-hidden="true">
                {position + 1}
              </span>
              <span className="lesson-order-text">
                <Inline text={block.items[item]} />
              </span>
              <span className="lesson-order-moves">
                <button
                  type="button"
                  onClick={() => move(position, -1)}
                  disabled={position === 0}
                  aria-label={`Subir: ${block.items[item]}`}
                >
                  <PiArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(position, 1)}
                  disabled={position === order.length - 1}
                  aria-label={`Descer: ${block.items[item]}`}
                >
                  <PiArrowDown aria-hidden="true" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="lesson-activity-actions">
        <button
          type="button"
          className="lesson-button"
          onClick={check}
          disabled={checked && allRight}
        >
          Verificar ordem
        </button>
      </div>
      <Feedback tone={!checked ? undefined : allRight ? 'right' : 'wrong'}>
        {checked && (
          <>
            <p className="lesson-feedback-title">
              {allRight
                ? 'Sequência certa.'
                : `${rightCount} de ${order.length} na posição certa. Ajuste e verifique de novo.`}
            </p>
            {allRight && (
              <p>
                <Inline text={block.explanation} />
              </p>
            )}
          </>
        )}
      </Feedback>
    </section>
  );
}

export function Classify({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'classify'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const labelId = useId();
  const items = useMemo(
    () => stableShuffle(block.items, activityId + block.prompt),
    [block.items, block.prompt, activityId],
  );
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const complete = items.every((_, index) => answers[index] !== undefined);
  const right = items.filter((item, index) => answers[index] === item.bucket).length;
  const solved = right === items.length;
  const feedbackClip =
    checked && narrationClipId
      ? `${narrationClipId}:feedback:${solved ? 'correct' : 'retry'}`
      : undefined;

  function check() {
    if (attempts === 0) recordAnswer(lessonId, activityId, right === items.length, revision);
    setAttempts((value) => value + 1);
    setChecked(true);
  }

  return (
    <section
      className="lesson-activity"
      aria-labelledby={labelId}
      data-solved={(checked && right === items.length) || undefined}
      data-narration-clip={narrationClipId}
    >
      <ActivityHeader
        kind="Classifique"
        id={labelId}
        text={block.prompt}
        fieldName={narrationClipId ? 'prompt' : undefined}
        narrationClipId={narrationClipId}
      />
      <ul className="lesson-classify">
        {items.map((item, index) => {
          const state = checked ? (answers[index] === item.bucket ? 'right' : 'wrong') : undefined;
          return (
            <li key={item.text} data-state={state}>
              <fieldset>
                <legend
                  data-narration-field={
                    narrationClipId ? `item:${block.items.indexOf(item)}` : undefined
                  }
                >
                  <Inline text={item.text} />
                </legend>
                <div className="lesson-buckets">
                  {block.buckets.map((bucket, bucketIndex) => (
                    <label key={bucket}>
                      <input
                        type="radio"
                        name={`${labelId}-${index}`}
                        checked={answers[index] === bucketIndex}
                        onChange={() => {
                          setAnswers((previous) => ({ ...previous, [index]: bucketIndex }));
                          setChecked(false);
                        }}
                      />
                      <span
                        data-narration-field={
                          index === 0 && narrationClipId ? `bucket:${bucketIndex}` : undefined
                        }
                      >
                        {bucket}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {state && (
                <span className="lesson-classify-mark" aria-hidden="true">
                  {state === 'right' ? <PiCheckBold /> : <PiXBold />}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="lesson-activity-actions">
        <button type="button" className="lesson-button" onClick={check} disabled={!complete}>
          Verificar
        </button>
        {!complete && (
          <span className="lesson-activity-note">Escolha uma opção para cada item.</span>
        )}
      </div>
      <Feedback tone={!checked ? undefined : solved ? 'right' : 'wrong'}>
        {checked && (
          <div data-narration-clip={feedbackClip}>
            <p
              className="lesson-feedback-title"
              data-narration-field={feedbackClip && solved ? 'title' : undefined}
            >
              {solved ? classifySuccess : `${right} de ${items.length} corretos.`}
            </p>
            <p data-narration-field={feedbackClip ? 'text' : undefined}>
              <Inline text={solved ? block.explanation : classifyRetry} />
            </p>
            {feedbackClip && <NarrationBlockButton clipId={feedbackClip} label="Ouvir feedback" />}
          </div>
        )}
      </Feedback>
    </section>
  );
}

export function Fill({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'fill'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const labelId = useId();
  const parts = useMemo(() => parseFill(block.template), [block.template]);
  const blanks = parts.filter((part) => part.kind === 'blank') as Array<{
    kind: 'blank';
    answers: string[];
  }>;
  const [values, setValues] = useState<string[]>(() => blanks.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const results = blanks.map((blank, index) => fillMatches(values[index], blank.answers));
  const allRight = results.every(Boolean);

  function check() {
    if (attempts === 0) recordAnswer(lessonId, activityId, allRight, revision);
    setAttempts((value) => value + 1);
    setChecked(true);
  }

  let blankIndex = -1;
  return (
    <section
      className="lesson-activity"
      aria-labelledby={labelId}
      data-solved={(checked && allRight) || undefined}
      data-narration-clip={narrationClipId}
    >
      <ActivityHeader
        kind="Complete o código"
        id={labelId}
        text={block.prompt}
        fieldName={narrationClipId ? 'prompt' : undefined}
        narrationClipId={narrationClipId}
      />
      <div className="lesson-fill guide-code">
        <div className="guide-code-bar">
          <span>{block.language}</span>
        </div>
        <pre>
          <code>
            {parts.map((part, index) => {
              if (part.kind === 'text') return <span key={index}>{part.text}</span>;
              blankIndex++;
              const current = blankIndex;
              const size = Math.max(...part.answers.map((answer) => answer.length), 3) + 1;
              return (
                <input
                  key={index}
                  type="text"
                  aria-label={`Lacuna ${current + 1} de ${blanks.length}`}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  data-state={checked ? (results[current] ? 'right' : 'wrong') : undefined}
                  style={{ width: `${size}ch` }}
                  value={values[current]}
                  onChange={(event) => {
                    const next = [...values];
                    next[current] = event.target.value;
                    setValues(next);
                    setChecked(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') check();
                  }}
                />
              );
            })}
          </code>
        </pre>
      </div>
      <div className="lesson-activity-actions">
        <button type="button" className="lesson-button" onClick={check}>
          Verificar
        </button>
        {attempts >= 2 && !allRight && (
          <button
            type="button"
            className="lesson-button-quiet"
            onClick={() => {
              setValues(blanks.map((blank) => blank.answers[0]));
              setChecked(true);
            }}
          >
            Mostrar resposta
          </button>
        )}
      </div>
      <Feedback tone={!checked ? undefined : allRight ? 'right' : 'wrong'}>
        {checked && (
          <>
            <p className="lesson-feedback-title">
              {allRight
                ? 'Código completo.'
                : `${results.filter(Boolean).length} de ${blanks.length} lacunas certas.`}
            </p>
            {allRight && (
              <p>
                <Inline text={block.explanation} />
              </p>
            )}
          </>
        )}
      </Feedback>
    </section>
  );
}
