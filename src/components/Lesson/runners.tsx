import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import {
  PiArrowCounterClockwise,
  PiCheckBold,
  PiCircle,
  PiConfetti,
  PiEye,
  PiPlayFill,
} from 'react-icons/pi';
import { recordExerciseOutcome } from '../../lessons/progress';
import { NarrationBlockButton } from '../../narration/NarrationPlayer';
import { Inline } from '../Guide/inline';
import { Block, useLessonIdentity } from './context';
import { pythonLoaded, PythonRun, runPython } from './pythonRunner';
import { loadSql, runSql, SqlRun } from './sqlRunner';

function RunnerHead({
  id,
  kind,
  title,
  task,
  narrationClipId,
}: {
  id: string;
  kind: string;
  title: string;
  task?: string;
  narrationClipId?: string;
}) {
  return (
    <header className="lesson-playground-head">
      <div className="narration-heading-row">
        <span className="lesson-activity-kind">{kind}</span>
        {narrationClipId && <NarrationBlockButton clipId={narrationClipId} label="Ouvir tarefa" />}
      </div>
      <h3 id={`${id}-title`} data-narration-field={narrationClipId ? 'title' : undefined}>
        <Inline text={title} />
      </h3>
      {task && (
        <p data-narration-field={narrationClipId ? 'task' : undefined}>
          <Inline text={task} />
        </p>
      )}
    </header>
  );
}

export function CheckList({
  checks,
  results,
  demonstrated = false,
}: {
  checks: Array<{ label: string }>;
  results: boolean[];
  demonstrated?: boolean;
}) {
  if (!checks.length) return null;
  const passed = results.length === checks.length && results.every(Boolean);
  return (
    <div className="lesson-checks">
      <p className="lesson-checks-title">
        {passed ? (
          demonstrated ? (
            <>
              <PiEye aria-hidden="true" /> Solução de exemplo
            </>
          ) : (
            <>
              <PiConfetti aria-hidden="true" /> Missão cumprida!
            </>
          )
        ) : (
          'Objetivos'
        )}
      </p>
      <ul aria-live="polite">
        {checks.map((item, index) => (
          <li key={item.label} data-pass={results[index] || undefined}>
            {results[index] ? <PiCheckBold aria-hidden="true" /> : <PiCircle aria-hidden="true" />}
            <span>
              <Inline text={item.label} />
            </span>
            <span className="sr-only">{results[index] ? ': cumprido' : ': pendente'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function runOnShortcut(run: () => void) {
  return (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      (event.ctrlKey || event.metaKey) &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (!event.repeat) run();
    }
  };
}

const normalize = (command: string) => command.trim().replace(/\s+/g, ' ');

interface TerminalLine {
  kind: 'intro' | 'command' | 'output' | 'miss' | 'info';
  text: string;
  prompt?: string;
}

export function Terminal({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'terminal'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const id = useId();
  const start = (): TerminalLine[] => (block.intro ? [{ kind: 'intro', text: block.intro }] : []);
  const [lines, setLines] = useState<TerminalLine[]>(start);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState('');
  const [misses, setMisses] = useState(0);
  const [totalMisses, setTotalMisses] = useState(0);
  const screen = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const done = step >= block.steps.length;
  const current = block.steps[step];
  const prompt = block.steps
    .slice(0, step)
    .reduce((previous, item) => item.prompt || previous, block.prompt || 'voce@computador:~$');
  const accepted = current ? [current.command].flat() : [];

  useEffect(() => {
    screen.current?.scrollTo?.({ top: screen.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    if (!done || !block.steps.length) return;
    if (totalMisses > 0) {
      recordExerciseOutcome(lessonId, activityId, 'fail', revision);
    }
    recordExerciseOutcome(lessonId, activityId, 'pass', revision);
  }, [done, block.steps.length, lessonId, activityId, totalMisses, revision]);

  function execute() {
    if (done || !value.trim()) return;
    const commands = value.split('\n');
    const output = [...lines];
    let nextStep = step;
    let nextPrompt = prompt;
    let nextMisses = misses;
    let index = 0;

    for (; index < commands.length; index += 1) {
      const typed = normalize(commands[index]);
      if (!typed) continue;
      const target = block.steps[nextStep];
      if (!target) break;
      if (typed === 'clear') {
        output.length = 0;
        continue;
      }

      output.push({ kind: 'command', text: typed, prompt: nextPrompt });
      if (typed === 'ajuda' || typed === 'help') {
        output.push({
          kind: 'info',
          text: `Objetivo: ${target.goal}${target.hint ? `\nDica: ${target.hint}` : ''}`,
        });
        continue;
      }
      if ([target.command].flat().some((command) => normalize(command) === typed)) {
        if (target.output) output.push({ kind: 'output', text: target.output });
        nextStep += 1;
        nextPrompt = target.prompt || nextPrompt;
        nextMisses = 0;
        continue;
      }

      output.push({
        kind: 'miss',
        text: `Linha ${index + 1}: Esse não é o comando deste passo.${
          target.hint ? ` Dica: ${target.hint}` : ''
        }`,
      });
      nextMisses += 1;
      setTotalMisses((previous) => previous + 1);
      recordExerciseOutcome(lessonId, activityId, 'fail', revision);
      break;
    }
    setLines(output);
    setStep(nextStep);
    setMisses(nextMisses);
    setValue(commands.slice(index).join('\n'));
  }

  return (
    <section
      className="lesson-playground lesson-terminal"
      aria-labelledby={`${id}-title`}
      data-passed={done || undefined}
      data-narration-clip={narrationClipId}
    >
      <RunnerHead
        id={id}
        kind="Terminal guiado"
        title={block.title}
        task={block.task}
        narrationClipId={narrationClipId}
      />
      <div className="lesson-terminal-window">
        <div className="lesson-preview-bar">
          <span aria-hidden="true" className="lesson-preview-dots">
            <i />
            <i />
            <i />
          </span>
          <span>Terminal</span>
          <span className="lesson-terminal-progress">
            {Math.min(step, block.steps.length)} de {block.steps.length}
          </span>
        </div>
        {/* Clicking the log is a mouse shortcut to the command input, which is keyboard-reachable. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={screen}
          className="lesson-terminal-screen"
          role="log"
          aria-live="polite"
          aria-label="Saída do terminal"
          onClick={() => input.current?.focus()}
        >
          {lines.map((line, index) => (
            <p key={index} data-kind={line.kind}>
              {line.kind === 'command' && (
                <span className="lesson-terminal-prompt">{line.prompt} </span>
              )}
              {line.text}
            </p>
          ))}
        </div>
        {(!done || value) && (
          <form
            className="lesson-terminal-input"
            onSubmit={(event) => {
              event.preventDefault();
              execute();
            }}
          >
            <div className="lesson-terminal-editor">
              <label htmlFor={`${id}-command`} className="lesson-terminal-prompt">
                {prompt}
              </label>
              <textarea
                ref={input}
                id={`${id}-command`}
                aria-label={done ? 'Linhas que sobraram' : 'Comandos do terminal'}
                value={value}
                rows={3}
                readOnly={done}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={runOnShortcut(execute)}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-describedby={done ? `${id}-goal` : `${id}-goal ${id}-instructions`}
              />
            </div>
            {!done && (
              <button className="lesson-terminal-run" type="submit">
                <PiPlayFill aria-hidden="true" /> Executar
              </button>
            )}
          </form>
        )}
      </div>
      <div className="lesson-terminal-goal" id={`${id}-goal`}>
        {done ? (
          <>
            <p role="status">
              <PiConfetti aria-hidden="true" /> Sessão concluída
              {totalMisses === 0 ? ', sem nenhum tropeço.' : '. Errar e tentar de novo faz parte.'}
            </p>
            {value && <p>As linhas que sobraram ficaram no editor para você copiar.</p>}
          </>
        ) : (
          <>
            <p>
              <strong>
                Passo {step + 1} de {block.steps.length}:
              </strong>{' '}
              <Inline text={current.goal} />
            </p>
            <p className="lesson-editor-hint" id={`${id}-instructions`}>
              Enter cria uma linha. Use Ctrl+Enter, Cmd+Enter ou Executar para rodar os comandos de
              cima para baixo. O terminal pula linhas vazias e para no primeiro erro. Execute{' '}
              <code>ajuda</code> para rever o objetivo.
            </p>
          </>
        )}
        <div className="lesson-terminal-actions">
          {!done && misses >= 2 && (
            <button
              type="button"
              onClick={() => {
                const pending = value.split('\n');
                const index = pending.findIndex((line) => line.trim());
                pending[Math.max(0, index)] = accepted[0];
                setValue(pending.join('\n'));
                input.current?.focus();
              }}
            >
              <PiEye aria-hidden="true" /> Mostrar o comando
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setLines(start());
              setStep(0);
              setMisses(0);
              setTotalMisses(0);
              setValue('');
            }}
          >
            <PiArrowCounterClockwise aria-hidden="true" /> Recomeçar
          </button>
        </div>
      </div>
    </section>
  );
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Uint8Array) return `[${value.length} bytes]`;
  return String(value);
}

export function SqlLab({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'sql'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const id = useId();
  const [query, setQuery] = useState(block.query);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [run, setRun] = useState<SqlRun | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed'>('idle');
  const [lastRunKind, setLastRunKind] = useState<'preview' | 'attempt' | 'solution'>('preview');
  const checks = block.checks || [];
  const allChecksPassed =
    checks.length > 0 &&
    (run?.checks?.length || 0) === checks.length &&
    Boolean(run?.checks.every(Boolean));
  const passed = allChecksPassed && lastRunKind === 'attempt';
  const runSeq = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function execute(
    text = query,
    kind: 'preview' | 'attempt' | 'solution' = solutionRevealed &&
    text.trim() === block.solution?.trim()
      ? 'solution'
      : 'attempt',
  ) {
    const seq = ++runSeq.current;
    setStatus('loading');
    try {
      const SQL = await loadSql();
      if (!mountedRef.current || seq !== runSeq.current) return;
      const nextRun = runSql(
        SQL,
        block.setup,
        text,
        checks.map((check) => check.test),
      );
      setRun(nextRun);
      setLastRunKind(kind);
      setStatus('idle');
      if (checks.length > 0) {
        if (kind === 'solution') {
          recordExerciseOutcome(lessonId, activityId, 'solution', revision);
        } else if (kind === 'attempt') {
          const didPass = nextRun.checks.length === checks.length && nextRun.checks.every(Boolean);
          recordExerciseOutcome(lessonId, activityId, didPass ? 'pass' : 'fail', revision);
        }
      }
    } catch {
      if (!mountedRef.current || seq !== runSeq.current) return;
      setStatus('failed');
    }
  }

  useEffect(() => {
    if (!run) execute(block.query, 'preview');
    // Show the tables and the starter result once, without waiting for a click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = Math.max(4, Math.min(14, query.split('\n').length + 1));
  const rows = run?.result?.rows || [];

  return (
    <section
      className="lesson-playground lesson-sql"
      aria-labelledby={`${id}-title`}
      data-passed={passed || undefined}
      data-narration-clip={narrationClipId}
    >
      <RunnerHead
        id={id}
        kind="SQL ao vivo"
        title={block.title}
        task={block.task}
        narrationClipId={narrationClipId}
      />
      {run && run.tables.length > 0 && (
        <details className="lesson-sql-schema" open>
          <summary>Tabelas disponíveis</summary>
          <ul>
            {run.tables.map((table) => (
              <li key={table.name}>
                <code>{table.name}</code>
                <span>{table.columns.join(', ')}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="lesson-editor">
        <div className="lesson-editor-tabs">
          <span className="lesson-editor-label">Consulta</span>
          <span className="lesson-editor-actions">
            <button type="button" className="lesson-run" onClick={() => execute()}>
              <PiPlayFill aria-hidden="true" /> Executar
            </button>
            <button
              type="button"
              onClick={() => {
                setSolutionRevealed(false);
                setQuery(block.query);
                execute(block.query, 'preview');
              }}
            >
              <PiArrowCounterClockwise aria-hidden="true" /> Recomeçar
            </button>
            {block.solution && (
              <button
                type="button"
                onClick={() => {
                  const solution = block.solution as string;
                  setSolutionRevealed(true);
                  setQuery(solution);
                  if (checks.length > 0) {
                    recordExerciseOutcome(lessonId, activityId, 'solution', revision);
                  }
                  execute(solution, 'solution');
                }}
              >
                <PiEye aria-hidden="true" /> Ver uma solução
              </button>
            )}
          </span>
        </div>
        <label className="sr-only" htmlFor={`${id}-editor`}>
          Consulta SQL
        </label>
        <textarea
          id={`${id}-editor`}
          className="lesson-editor-input"
          rows={lines}
          value={query}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={runOnShortcut(() => execute())}
        />
        <p className="lesson-editor-hint">
          Ctrl + Enter (ou Cmd + Enter) executa. Cada execução começa com os mesmos dados.
        </p>
      </div>
      <div className="lesson-sql-result" aria-live="polite">
        {status === 'loading' && !run ? (
          <p>Preparando o banco de dados…</p>
        ) : status === 'failed' ? (
          <p data-tone="error">Não foi possível carregar o banco de dados. Recarregue a página.</p>
        ) : run?.error ? (
          <p data-tone="error">{run.error}</p>
        ) : run?.result ? (
          <>
            <p className="lesson-sql-count">
              {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}
              {rows.length > 100 ? ' (mostrando as 100 primeiras)' : ''}
            </p>
            <div className="lesson-sql-table">
              <table>
                <thead>
                  <tr>
                    {run.result.columns.map((column, index) => (
                      <th key={index} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} data-null={cell === null || undefined}>
                          {formatCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : run ? (
          <p>
            Comando executado.
            {run.changes > 0 &&
              ` ${run.changes} ${run.changes === 1 ? 'linha alterada' : 'linhas alteradas'}.`}{' '}
            Escreva um SELECT para ver dados.
          </p>
        ) : null}
      </div>
      <CheckList
        checks={checks}
        results={run?.checks || []}
        demonstrated={lastRunKind === 'solution'}
      />
    </section>
  );
}

export function PythonLab({
  block,
  activityId,
  narrationClipId,
}: {
  block: Block<'python'>;
  activityId: string;
  narrationClipId?: string;
}) {
  const { lessonId, revision } = useLessonIdentity();
  const id = useId();
  const [code, setCode] = useState(block.code);
  const [output, setOutput] = useState('');
  const [result, setResult] = useState<PythonRun | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'failed'>('idle');
  const [solutionLoaded, setSolutionLoaded] = useState(false);
  const [lastRunKind, setLastRunKind] = useState<'idle' | 'attempt' | 'solution'>('idle');
  const checks = block.checks || [];
  const allChecksPassed =
    checks.length > 0 &&
    (result?.checks?.length || 0) === checks.length &&
    Boolean(result?.checks.every(Boolean));
  const passed = allChecksPassed && lastRunKind === 'attempt';
  const escaped = useRef(false);

  const busy = status === 'loading' || status === 'running';

  async function execute(
    text = code,
    kind: 'attempt' | 'solution' = solutionLoaded ? 'solution' : 'attempt',
  ) {
    if (busy) return;
    setStatus(pythonLoaded() ? 'running' : 'loading');
    setOutput('');
    try {
      const run = await runPython(
        text,
        checks.map((check) => check.test),
        (line) => {
          setStatus('running');
          setOutput((previous) => `${previous}${line}\n`);
        },
      );
      setOutput(run.output);
      setResult(run);
      setLastRunKind(kind);
      setStatus('idle');
      if (checks.length > 0) {
        if (kind === 'solution') {
          recordExerciseOutcome(lessonId, activityId, 'solution', revision);
        } else {
          const didPass = run.checks.length === checks.length && run.checks.every(Boolean);
          recordExerciseOutcome(lessonId, activityId, didPass ? 'pass' : 'fail', revision);
        }
      }
    } catch {
      setStatus('failed');
    }
  }

  const lines = Math.max(6, Math.min(20, code.split('\n').length + 1));

  return (
    <section
      className="lesson-playground lesson-python"
      aria-labelledby={`${id}-title`}
      data-passed={passed || undefined}
      data-narration-clip={narrationClipId}
    >
      <RunnerHead
        id={id}
        kind="Python ao vivo"
        title={block.title}
        task={block.task}
        narrationClipId={narrationClipId}
      />
      <div className="lesson-editor">
        <div className="lesson-editor-tabs">
          <span className="lesson-editor-label">programa.py</span>
          <span className="lesson-editor-actions">
            <button type="button" className="lesson-run" disabled={busy} onClick={() => execute()}>
              <PiPlayFill aria-hidden="true" /> Executar
            </button>
            <button
              type="button"
              onClick={() => {
                setCode(block.code);
                setResult(null);
                setOutput('');
                setSolutionLoaded(false);
                setLastRunKind('idle');
              }}
            >
              <PiArrowCounterClockwise aria-hidden="true" /> Recomeçar
            </button>
            {block.solution && (
              <button
                type="button"
                onClick={() => {
                  setCode(block.solution as string);
                  setSolutionLoaded(true);
                  if (checks.length > 0) {
                    recordExerciseOutcome(lessonId, activityId, 'solution', revision);
                  }
                }}
              >
                <PiEye aria-hidden="true" /> Ver uma solução
              </button>
            )}
          </span>
        </div>
        <label className="sr-only" htmlFor={`${id}-editor`}>
          Código Python
        </label>
        <textarea
          id={`${id}-editor`}
          className="lesson-editor-input"
          rows={lines}
          value={code}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          onChange={(event) => {
            setCode(event.target.value);
            setSolutionLoaded(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              escaped.current = true;
              return;
            }
            const leaving = escaped.current;
            escaped.current = false;
            if (event.key === 'Tab' && !event.shiftKey && !leaving) {
              event.preventDefault();
              const target = event.currentTarget;
              const { selectionStart, selectionEnd } = target;
              const next = `${code.slice(0, selectionStart)}    ${code.slice(selectionEnd)}`;
              setCode(next);
              requestAnimationFrame(() =>
                target.setSelectionRange(selectionStart + 4, selectionStart + 4),
              );
              return;
            }
            runOnShortcut(() => execute())(event);
          }}
        />
        <p className="lesson-editor-hint">
          Ctrl + Enter (ou Cmd + Enter) executa. Tab insere 4 espaços; Esc e depois Tab sai do
          editor.
        </p>
      </div>
      <div className="lesson-console" data-tall>
        <p className="lesson-console-title">Saída</p>
        <div aria-live="polite">
          {status === 'loading' ? (
            <p className="lesson-console-empty">
              Carregando o Python no navegador. Na primeira vez são cerca de 10 MB; depois fica
              guardado.
            </p>
          ) : status === 'failed' ? (
            <p data-level="error">
              Não foi possível carregar o Python. Confira a conexão e tente executar de novo.
            </p>
          ) : (
            <>
              {output ? (
                <pre className="lesson-python-output">{output}</pre>
              ) : (
                !result?.error && (
                  <p className="lesson-console-empty">
                    {result
                      ? 'O programa rodou sem imprimir nada.'
                      : 'Aperte Executar para rodar o código.'}
                  </p>
                )
              )}
              {result?.error && <pre data-level="error">{result.error}</pre>}
            </>
          )}
        </div>
      </div>
      <CheckList
        checks={checks}
        results={result?.checks || []}
        demonstrated={lastRunKind === 'solution'}
      />
    </section>
  );
}
