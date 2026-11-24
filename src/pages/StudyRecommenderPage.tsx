import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  PiArrowRight,
  PiBookmarkSimple,
  PiCheckBold,
  PiClock,
  PiCompass,
  PiMagnifyingGlass,
  PiPencilSimple,
  PiWarningCircle,
} from 'react-icons/pi';
import { Link, useSearchParams } from 'react-router-dom';
import { Inline } from '../components/Guide/inline';
import MainLayout from '../components/layouts/MainLayout';
import { useLessonStore } from '../lessons/progress';
import { LessonPlanPanel } from '../recommender/LessonPlanPanel';
import {
  clearLessonPlan,
  makeLessonPlan,
  SavedLessonPlan,
  saveLessonPlan,
  useSavedLessonPlan,
} from '../recommender/savedLessonPlan';
import {
  RecommendationKind,
  RecommendedLesson,
  recommendStudyPlan,
} from '../recommender/studyRecommender';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';

const quickExamples = [
  {
    label: 'Trabalho: API Node + Frontend Tailwind',
    text: 'Enviar link do GitHub da API Node com o GitHub do frontend utilizando Tailwind.',
  },
  {
    label: 'Prova: HTTP, CORS e Fourier',
    text: 'Preciso estudar métodos HTTP, erro de CORS e transformada de Fourier.',
  },
  {
    label: 'Lista: Fetch, React e Express',
    text: '- API em Node.js com Express\n- buscar dados da API com fetch no React\n- rotas no React e CORS',
  },
];

const kindLabels: Record<RecommendationKind, string> = {
  requested: 'Pedido no enunciado',
  prerequisite: 'Pré-requisito útil',
  support: 'Sugestão de apoio',
};

function RecommendationCard({
  item,
  index,
  done,
}: {
  item: RecommendedLesson;
  index?: number;
  done: boolean;
}) {
  return (
    <li className="rec-card" data-kind={item.kind}>
      <div className="rec-card-head">
        {typeof index === 'number' && (
          <span className="rec-step" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
        <div className="rec-badges">
          <span className="rec-badge" data-kind={item.kind}>
            {kindLabels[item.kind]}
          </span>
          {item.courseTitle && <span className="rec-meta">{item.courseTitle}</span>}
          <span className="rec-meta">
            <PiClock aria-hidden="true" /> {item.lesson.minutes} min
          </span>
          {done && (
            <span className="rec-meta rec-done">
              <PiCheckBold aria-hidden="true" /> Concluída
            </span>
          )}
        </div>
      </div>

      <h3>{item.lesson.title}</h3>

      {item.matchedSnippets.length > 0 && (
        <p className="rec-snippets">
          <strong>Trecho do pedido:</strong>{' '}
          {item.matchedSnippets.map((snippet, idx) => (
            <span key={`${snippet}-${idx}`} className="rec-chip">
              {snippet}
            </span>
          ))}
        </p>
      )}

      {item.sectionTitle && (
        <p className="rec-section">
          <PiBookmarkSimple aria-hidden="true" />{' '}
          <span>
            <strong>Seção indicada:</strong> {item.sectionTitle}
          </span>
        </p>
      )}

      <p className="rec-reason">
        <strong>Por que estudar:</strong> <Inline text={item.reason} />
      </p>

      <p className="rec-practice">
        <strong>Para praticar:</strong> <Inline text={item.practiceAction} />
      </p>

      <div className="rec-actions">
        <Link className="lesson-button" to={item.url}>
          Abrir aula: {item.lesson.title}
          <PiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

export default function StudyRecommenderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [draft, setDraft] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [emptyNotice, setEmptyNotice] = useState(false);
  const plan = useSavedLessonPlan();
  const [removedPlan, setRemovedPlan] = useState<SavedLessonPlan | null>(null);
  const [selection, setSelection] = useState<string[] | null>(null);
  const [planError, setPlanError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const store = useLessonStore();

  useEffect(() => {
    document.title = 'O que preciso estudar? · Trilha Info';
  }, []);

  useEffect(() => {
    const paramQuery = searchParams.get('q');
    if (paramQuery === null) return;
    setDraft(paramQuery);
    setSubmittedQuery(paramQuery);
    setEmptyNotice(false);
    setSelection(null);
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const result = useMemo(() => {
    if (!submittedQuery.trim()) return null;
    return recommendStudyPlan(submittedQuery);
  }, [submittedQuery]);

  function applyQuery(text: string) {
    const trimmed = text.trim();
    setSelection(null);
    if (!trimmed) {
      setSubmittedQuery('');
      setEmptyNotice(true);
      inputRef.current?.focus();
      return;
    }
    setEmptyNotice(false);
    setDraft(text);
    setSubmittedQuery(text);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    applyQuery(draft);
  }

  function handleClear() {
    setDraft('');
    setSubmittedQuery('');
    setEmptyNotice(false);
    setSelection(null);
    inputRef.current?.focus();
  }

  function focusEditor() {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }

  function persistPlan(next: SavedLessonPlan) {
    if (saveLessonPlan(next)) {
      setRemovedPlan(null);
      setPlanError('');
      return true;
    }
    setPlanError('Não foi possível salvar o plano neste navegador.');
    return false;
  }

  function handleClearPlan() {
    if (!plan) return;
    const previous = plan;
    if (clearLessonPlan()) {
      setRemovedPlan(previous);
      setPlanError('');
    } else {
      setPlanError('Não foi possível remover o plano neste navegador.');
    }
  }

  const suggestions = result ? [...result.sequence, ...result.supportSuggestions] : [];
  const totalMinutes = result
    ? result.sequence.reduce((sum, item) => sum + item.lesson.minutes, 0)
    : 0;

  function saveSelection() {
    const chosen = suggestions.filter((item) => selection?.includes(item.lesson.id));
    if (!chosen.length || !result) return;
    const showChecklist = ['git-do-zero', 'node-e-express', 'tailwind-na-pratica'].every((id) =>
      result.sequence.some((item) => item.lesson.id === id),
    );
    if (persistPlan(makeLessonPlan(chosen, showChecklist, plan))) {
      setSelection(null);
      requestAnimationFrame(() => document.getElementById('rec-saved-plan-title')?.focus());
    }
  }

  return (
    <MainLayout>
      <div className="guide-page lessons-index rec-page">
        <header className="guide-hero">
          <nav className="guide-crumbs" aria-label="Você está em">
            <ol>
              <li>
                <Link to="/">Início</Link>
              </li>
              <li>
                <Link to="/aulas">Aulas</Link>
              </li>
              <li>O que preciso estudar?</li>
            </ol>
          </nav>
          <p className="lesson-number">
            <PiCompass aria-hidden="true" /> Recomendador local de Web · sem IA
          </p>
          <h1>O que preciso estudar?</h1>
          <p className="guide-summary">
            Cole um enunciado de trabalho, uma lista de assuntos de prova ou os requisitos de um
            projeto. A busca funciona localmente no navegador usando o catálogo e os sinônimos em
            português das aulas do Trilha.
          </p>
        </header>

        <section aria-labelledby="rec-form-heading" className="rec-panel">
          <h2 id="rec-form-heading" className="sr-only">
            Descrever o que precisa estudar
          </h2>
          <form onSubmit={handleSubmit} className="rec-form" noValidate>
            <label htmlFor="rec-input" className="rec-label">
              Cole aqui o enunciado, tópicos da prova ou requisitos
            </label>
            <textarea
              ref={inputRef}
              id="rec-input"
              name="q"
              rows={4}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (emptyNotice && event.target.value.trim()) setEmptyNotice(false);
              }}
              onKeyDown={(event) => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (!event.repeat) applyQuery(draft);
                }
              }}
              placeholder="Ex.: Enviar link do GitHub da API Node com o GitHub do frontend utilizando Tailwind."
              className="rec-textarea"
            />

            {emptyNotice && (
              <p role="alert" className="rec-alert">
                Cole um enunciado, uma lista de assuntos ou um requisito antes de buscar.
              </p>
            )}

            <div className="rec-form-actions">
              <button type="submit" className="lesson-button">
                <PiMagnifyingGlass aria-hidden="true" /> Montar sequência de aulas
              </button>
              {draft && (
                <button type="button" className="lesson-button-quiet" onClick={handleClear}>
                  Limpar
                </button>
              )}
              <Link className="lesson-button-quiet" to="/aulas">
                Voltar para Aulas
              </Link>
              <span className="lesson-editor-hint">Atalho: Ctrl+Enter ou Cmd+Enter</span>
            </div>
          </form>

          <div className="rec-examples" aria-label="Exemplos prontos para testar">
            <span>Testar com exemplo:</span>
            {quickExamples.map((example) => (
              <button
                key={example.label}
                type="button"
                className="rec-example-btn"
                onClick={() => applyQuery(example.text)}
              >
                {example.label}
              </button>
            ))}
          </div>
        </section>

        {planError && (
          <p role="alert" className="rec-alert">
            {planError}
          </p>
        )}
        {plan ? (
          <LessonPlanPanel plan={plan} update={persistPlan} onClear={handleClearPlan} />
        ) : (
          removedPlan && (
            <div className="rec-panel rec-undo-banner" role="status">
              <p className="guide-text">Plano de aulas removido deste navegador.</p>
              <button
                type="button"
                className="lesson-button-quiet"
                onClick={() => persistPlan(removedPlan)}
              >
                Desfazer remoção
              </button>
            </div>
          )
        )}

        {result && (
          <section aria-labelledby="rec-results-title" className="rec-results">
            <div className="rec-results-header">
              <div>
                <h2 id="rec-results-title" className="lessons-modules-title">
                  Sequência recomendada para você
                </h2>
                <p className="guide-text">
                  {result.sequence.length > 0
                    ? `${result.sequence.length} ${
                        result.sequence.length === 1 ? 'aula' : 'aulas'
                      } · cerca de ${totalMinutes} min ao todo. Pré-requisitos aparecem antes da prática. Você pode abrir qualquer aula e voltar para ajustar os termos.`
                    : 'Não foi possível montar aulas diretas para o texto colado; ajuste os termos abaixo.'}
                </p>
              </div>
              <button type="button" className="lesson-button-quiet" onClick={focusEditor}>
                <PiPencilSimple aria-hidden="true" /> Ajustar termos
              </button>
            </div>

            {suggestions.length > 0 && selection === null && (
              <button
                type="button"
                className="lesson-button"
                onClick={() => {
                  setSelection(result.sequence.map(({ lesson }) => lesson.id));
                  requestAnimationFrame(() => document.getElementById('rec-plan-review')?.focus());
                }}
              >
                Montar meu plano
              </button>
            )}

            {selection !== null && (
              <section className="rec-panel" aria-labelledby="rec-plan-review">
                <h3 id="rec-plan-review" tabIndex={-1}>
                  Revise seu plano
                </h3>
                <p className="guide-text">
                  Escolha as aulas e práticas que quer salvar neste navegador.
                </p>
                <ul className="rec-list">
                  {suggestions.map((item) => (
                    <li className="rec-card" key={item.lesson.id}>
                      <label className="option-check">
                        <input
                          type="checkbox"
                          checked={selection.includes(item.lesson.id)}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelection(
                              (current) =>
                                current &&
                                (checked
                                  ? [...current, item.lesson.id]
                                  : current.filter((id) => id !== item.lesson.id)),
                            );
                          }}
                        />
                        {item.lesson.title}
                        {item.kind === 'support' && ' (opcional)'}
                      </label>
                      <p className="guide-text">
                        <Inline text={item.practiceAction} />
                      </p>
                      <p className="guide-text">
                        <strong>Como conferir</strong> <Inline text={item.successCriteria} />
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="rec-actions">
                  <button
                    type="button"
                    className="lesson-button"
                    disabled={!selection.length}
                    onClick={saveSelection}
                  >
                    {plan ? 'Atualizar plano salvo' : 'Salvar plano'}
                  </button>
                  <button
                    type="button"
                    className="lesson-button-quiet"
                    onClick={() => setSelection(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            )}

            {result.sequence.length > 0 && (
              <ol className="rec-list" aria-label="Aulas indicadas pelo enunciado">
                {result.sequence.map((item, index) => (
                  <RecommendationCard
                    key={item.lesson.id}
                    item={item}
                    index={index}
                    done={!!store.lessons[item.lesson.id]?.done}
                  />
                ))}
              </ol>
            )}

            {result.supportSuggestions.length > 0 && (
              <div className="rec-subblock" aria-labelledby="rec-support-title">
                <h3 id="rec-support-title" className="rec-subtitle">
                  Sugestões de apoio (opcionais)
                </h3>
                <p className="guide-text">
                  Estas aulas não foram exigidas diretamente no texto, mas apoiam partes do contexto
                  citado (por exemplo, integração ou framework opcional no frontend).
                </p>
                <ul className="rec-list">
                  {result.supportSuggestions.map((item) => (
                    <RecommendationCard
                      key={item.lesson.id}
                      item={item}
                      done={!!store.lessons[item.lesson.id]?.done}
                    />
                  ))}
                </ul>
              </div>
            )}

            {(result.weakMatches.length > 0 || result.unmatched.length > 0) && (
              <div className="rec-subblock rec-gaps" aria-labelledby="rec-gaps-title">
                <h3 id="rec-gaps-title" className="rec-subtitle">
                  <PiWarningCircle aria-hidden="true" /> Trechos que precisam de atenção ou ajuste
                </h3>
                <ul className="rec-gaps-list">
                  {result.weakMatches.map((weak, idx) => (
                    <li key={`${weak.snippet}-${idx}`} className="rec-gap-card" data-status="weak">
                      <div className="rec-badges">
                        <span className="rec-badge" data-kind="weak">
                          Correspondência fraca
                        </span>
                      </div>
                      <p className="rec-snippets">
                        <strong>Trecho:</strong> <span className="rec-chip">{weak.snippet}</span>
                      </p>
                      <p className="guide-text">{weak.reason}</p>
                      {weak.candidates.length > 0 && (
                        <div className="rec-weak-links">
                          <span>Possíveis aulas relacionadas:</span>
                          {weak.candidates.map((cand) => (
                            <Link
                              key={cand.lesson.id}
                              to={cand.url}
                              className="lesson-button-quiet"
                            >
                              {cand.lesson.title}
                              <PiArrowRight aria-hidden="true" />
                            </Link>
                          ))}
                        </div>
                      )}
                      <button type="button" className="lesson-button-quiet" onClick={focusEditor}>
                        <PiPencilSimple aria-hidden="true" /> Ajustar este termo
                      </button>
                    </li>
                  ))}

                  {result.unmatched.map((item, idx) => (
                    <li
                      key={`${item.snippet}-${idx}`}
                      className="rec-gap-card"
                      data-status="unmatched"
                    >
                      <div className="rec-badges">
                        <span className="rec-badge" data-kind="unmatched">
                          Sem correspondência no catálogo
                        </span>
                      </div>
                      <p className="rec-snippets">
                        <strong>Trecho:</strong> <span className="rec-chip">{item.snippet}</span>
                      </p>
                      <p className="rec-unmatched-msg">{item.message}</p>
                      <button type="button" className="lesson-button-quiet" onClick={focusEditor}>
                        <PiPencilSimple aria-hidden="true" /> Ajustar busca
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </MainLayout>
  );
}
