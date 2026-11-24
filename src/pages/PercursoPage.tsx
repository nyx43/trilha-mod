import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import DiagnosticoPratica from './DiagnosticoPratica';
import {
  PiArrowLeft,
  PiArrowRight,
  PiArrowUpRight,
  PiCheckBold,
  PiClock,
  PiFlagCheckered,
  PiLockSimple,
  PiTarget,
} from 'react-icons/pi';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Checklist } from '../components/Guide/Checklist';
import { CodeBlock } from '../components/Guide/CodeBlock';
import { GuideBlockView } from '../components/Guide/GuideBlock';
import { Inline } from '../components/Guide/inline';
import MainLayout from '../components/layouts/MainLayout';
import { Flashcards } from '../components/Lesson/Flashcards';
import { LessonBlockView } from '../components/Lesson/LessonBlock';
import { LessonContext } from '../components/Lesson/context';
import { activityKey, findLesson } from '../lessons';
import { NarrationProvider } from '../narration/controller';
import { NarrationBlockButton, NarrationPlayer } from '../narration/NarrationPlayer';
import { isTutorEnabled, OFFLINE_APP_BUILD } from '../runtime/mode';
import { cardKey, enrollCards, localDay, updateLesson, useLessonStore } from '../lessons/progress';
import { LessonContent } from '../lessons/types';
import { resolveSectionPosition } from '../lessons/sectionPosition';
import { publishedStageOrder } from '../percurso/publishedSectionOrder';
import { MissionReview } from '../percurso/MissionReview';
import {
  diagnosticoWebSlug,
  findPercurso,
  missionCriteria,
  missionGithubChecklist,
  missionTasks,
  Percurso,
  PercursoLessonStage,
  PercursoStage,
  superheroesContractSnippet,
} from '../percurso/apiReactTailwind';
import {
  advanceStage,
  markStageDone,
  toggleStageDone,
  usePercursoStore,
} from '../percurso/progress';
import { safeDecodeHash } from '../support/hash';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';

const closingId = 'fechamento';
const LazyLessonTutor = OFFLINE_APP_BUILD
  ? null
  : lazy(() => import('../tutor/LessonTutor').then((m) => ({ default: m.LessonTutor })));

function PercursoOverview({ percurso }: { percurso: Percurso }) {
  const percursoStore = usePercursoStore();
  const lessonStore = useLessonStore();
  const completed = percursoStore.completed[percurso.id] || [];

  const isStageDone = (stage: PercursoStage) =>
    completed.includes(stage.slug) ||
    (stage.kind === 'lesson' &&
      stage.slug !== 'requisicoes-react' &&
      !!lessonStore.lessons[stage.lessonId]?.done);

  const doneCount = percurso.stages.filter(isStageDone).length;
  const totalMinutes = percurso.stages.reduce((sum, stage) => sum + stage.minutes, 0);
  const nextStage = percurso.stages.find((stage) => !isStageDone(stage)) || percurso.stages[0];
  const started =
    doneCount > 0 ||
    Object.values(percursoStore.reached[percurso.id] || {}).some((reached) => reached > 0) ||
    percurso.stages.some((s) => s.kind === 'lesson' && !!lessonStore.lessons[s.lessonId]);

  useEffect(() => {
    document.title = `${percurso.title} · Trilha Info`;
  }, [percurso.title]);

  return (
    <div className="guide-page lessons-index">
      <header className="guide-hero">
        <nav className="guide-crumbs" aria-label="Você está em">
          <ol>
            <li>
              <Link to="/">Início</Link>
            </li>
            <li>
              <Link to="/aulas">Aulas</Link>
            </li>
            <li>Percurso curto</li>
          </ol>
        </nav>
        <p className="lesson-number">{percurso.eyebrow}</p>
        <h1>{percurso.title}</h1>
        <p className="guide-summary">{percurso.summary}</p>
        <ul className="guide-facts">
          <li>{percurso.stages.length} etapas no percurso</li>
          <li>
            <PiClock aria-hidden="true" /> cerca de {totalMinutes} min ao todo
          </li>
          <li>
            {doneCount} de {percurso.stages.length} etapas concluídas
          </li>
        </ul>
        <div className="lesson-objectives">
          <p>
            <PiTarget aria-hidden="true" /> Foco da sua entrega
          </p>
          <ul>
            <li>
              Revisar Node/Express para construir e testar <code>GET /heroes</code> e{' '}
              <code>POST /heroes</code>
            </li>
            <li>
              Tratar <code>useEffect</code>, carregando, vazio, erro e condições de corrida no React
            </li>
            <li>
              Conectar frontend e API com <code>fetch</code>, JSON, CORS/proxy e tratamento de{' '}
              <code>400</code>
            </li>
            <li>
              Estilizar com Tailwind: classes utilitárias, foco acessível e layout mobile-first
            </li>
            <li>Executar a missão prática por conta própria e validar os 2 links do GitHub</li>
          </ul>
        </div>
        <div className="lessons-actions">
          <Link className="lesson-button" to={`/percurso/${percurso.id}/${nextStage.slug}`}>
            {started ? `Continuar: ${nextStage.title}` : `Começar: ${nextStage.title}`}
            <PiArrowRight aria-hidden="true" />
          </Link>
          <Link className="lesson-button-quiet" to={`/percurso/${percurso.id}/missao-final`}>
            <PiFlagCheckered aria-hidden="true" /> Ir direto para a missão final
          </Link>
        </div>
      </header>

      <section aria-labelledby="percurso-etapas-title">
        <h2 id="percurso-etapas-title" className="lessons-modules-title">
          Etapas do percurso
        </h2>
        <p className="guide-text" style={{ marginBottom: 18 }}>
          {percurso.goalNote}
        </p>
        <ol className="lessons-list">
          {percurso.stages.map((stage, index) => {
            const done = isStageDone(stage);
            const record =
              stage.kind === 'lesson' ? lessonStore.lessons[stage.lessonId] : undefined;
            const answered = record ? Object.keys(record.answers).length : 0;
            return (
              <Fragment key={stage.slug}>
                <li data-done={done || undefined}>
                  <Link to={`/percurso/${percurso.id}/${stage.slug}`}>
                    <span className="lessons-number" aria-hidden="true">
                      {done ? <PiCheckBold /> : String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="lessons-text">
                      <strong>{stage.title}</strong>
                      <span>{stage.summary}</span>
                      <small>
                        {stage.minutes} min
                        {stage.kind === 'lesson'
                          ? ` · ${stage.sectionIds.length} seções`
                          : ' · prática própria + checklist'}
                        {done
                          ? ' · concluída'
                          : answered > 0
                          ? ` · ${answered} atividades respondidas`
                          : ''}
                      </small>
                    </span>
                    {done && <span className="sr-only">, concluída</span>}
                  </Link>
                </li>
                {stage.slug === 'integracao-front-api' && (
                  <li>
                    <Link to={`/percurso/${percurso.id}/${diagnosticoWebSlug}`}>
                      <span className="lessons-number" aria-hidden="true">
                        +
                      </span>
                      <span className="lessons-text">
                        <strong>Prática opcional: diagnóstico de frontend e API</strong>
                        <span>Investigue cinco falhas de frontend e API no laboratório local.</span>
                        <small>Opcional · sem IA · progresso separado</small>
                      </span>
                    </Link>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function PercursoLessonStageView({
  percurso,
  stage,
  index,
}: {
  percurso: Percurso;
  stage: PercursoLessonStage;
  index: number;
}) {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const focusTarget = useRef<string>();
  const stageContainerRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  const sourceLesson = useMemo(
    () =>
      findLesson(stage.lessonId) ?? {
        id: stage.lessonId,
        title: stage.title,
        summary: stage.summary,
        minutes: stage.minutes,
        objectives: [],
        updatedAt: '2026-11-01',
        groupIds: [],
        load: stage.load,
      },
    [stage],
  );

  const percursoStore = usePercursoStore();
  const lessonStore = useLessonStore();
  const completed = percursoStore.completed[percurso.id] || [];
  const done =
    completed.includes(stage.slug) ||
    (stage.slug !== 'requisicoes-react' && !!lessonStore.lessons[stage.lessonId]?.done);

  useEffect(() => {
    document.title = `${stage.title} · ${percurso.title} · Trilha Info`;
  }, [stage.title, percurso.title]);

  useEffect(() => {
    let current = true;
    setContent(null);
    setFailed(false);
    setShowAll(false);
    stage
      .load()
      .then((module) => current && setContent(module.content))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [stage]);

  const sections = useMemo(() => {
    if (!content) return [];
    const byId = new Map(content.sections.map((section) => [section.id, section]));
    return stage.sectionIds
      .map((id) => byId.get(id))
      .filter((section): section is NonNullable<typeof section> => !!section);
  }, [content, stage.sectionIds]);

  const stageCards = useMemo(() => {
    if (!content) return [];
    if (!stage.cardIds) return content.cards;
    const wanted = new Set(stage.cardIds);
    return content.cards.filter((card) => wanted.has(card.id));
  }, [content, stage.cardIds]);

  const total = sections.length + 1;
  const ids = useMemo(() => [...sections.map((section) => section.id), closingId], [sections]);
  const savedReached = percursoStore.reached[percurso.id]?.[stage.slug];
  const reached = resolveSectionPosition(
    ids,
    percursoStore.positions?.[percurso.id]?.[stage.slug],
    savedReached,
    publishedStageOrder[percurso.id]?.[stage.slug],
  );
  const visible = showAll || done ? total : Math.min(reached + 1, total);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const percent = done ? 100 : Math.round((Math.min(reached, total - 1) / total) * 100);

  const previous = index > 0 ? percurso.stages[index - 1] : undefined;
  const next = index + 1 < percurso.stages.length ? percurso.stages[index + 1] : undefined;

  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = undefined;
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(`${target}-title`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({
        block: 'start',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, reached]);

  useEffect(() => {
    if (!content || !hash) return;
    const targetId = safeDecodeHash(hash);
    const targetIndex = ids.indexOf(targetId);
    if (targetIndex < 0) return;
    if (targetIndex >= visibleRef.current) {
      focusTarget.current = targetId;
      setShowAll(true);
      return;
    }
    focusTarget.current = undefined;
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(`${targetId}-title`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [content, hash, ids]);

  function advance(nextIndex: number) {
    if (nextIndex !== reached + 1 || nextIndex >= total) return;
    focusTarget.current = ids[nextIndex];
    advanceStage(percurso.id, stage.slug, nextIndex, ids);
  }

  function completeStage() {
    if (!content) return;
    markStageDone(percurso.id, stage.slug, content.revision ?? 1);
    if (stage.slug !== 'requisicoes-react') {
      updateLesson(stage.lessonId, (prev) =>
        prev.done
          ? prev
          : {
              ...prev,
              reached: content.sections.length,
              position: {
                sectionId: closingId,
                previousSectionIds: content.sections.map(({ id }) => id),
              },
              done: localDay(),
              doneRevision: content.revision ?? 1,
            },
      );
    }
    enrollCards(stageCards.map((card) => cardKey(stage.lessonId, card.id)));
  }

  return (
    <NarrationProvider
      lesson={sourceLesson}
      content={content}
      containerRef={stageContainerRef}
      scopeKey={`${stage.lessonId}:percurso:${stage.slug}`}
      scopeSectionIds={stage.sectionIds}
      hasMoreHiddenSections={Boolean(content && !showAll && visible < total)}
    >
      <LessonContext.Provider value={{ lessonId: stage.lessonId, revision: content?.revision }}>
        <article
          ref={stageContainerRef}
          className="guide-page lesson-page"
          aria-labelledby="lesson-title"
        >
          <header className="guide-hero lesson-hero">
            <nav className="guide-crumbs" aria-label="Você está em">
              <ol>
                <li>
                  <Link to="/">Início</Link>
                </li>
                <li>
                  <Link to={`/percurso/${percurso.id}`}>Percurso rápido</Link>
                </li>
                <li>{stage.title}</li>
              </ol>
            </nav>
            <p className="lesson-number">
              Etapa {index + 1} de {percurso.stages.length} · Percurso curto
            </p>
            <h1 id="lesson-title">{stage.title}</h1>
            <p className="guide-summary">{stage.summary}</p>
            <ul className="guide-facts">
              <li>
                <PiClock aria-hidden="true" /> cerca de {stage.minutes} min
              </li>
              <li>{stage.sectionIds.length} seções selecionadas</li>
              <li>Progresso salvo neste navegador</li>
            </ul>
            <div className="lesson-progress">
              <div className="lesson-progress-bar" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </div>
              <p>{done ? 'Etapa concluída' : `${percent}% da etapa`}</p>
            </div>
            <div className="lessons-actions">
              {!done && (
                <button
                  type="button"
                  className="lesson-button-quiet"
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll ? 'Voltar para leitura passo a passo' : 'Mostrar todas as seções'}
                </button>
              )}
              <Link className="lesson-button-quiet" to={`/aula/${stage.lessonId}`}>
                Abrir aula completa avulsa <PiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </header>

          <div className="guide-layout">
            <nav className="guide-toc lesson-toc" aria-label="Nesta etapa">
              <p className="guide-toc-title" aria-hidden="true">
                Nesta etapa
              </p>
              {content && (
                <ol>
                  {ids.map((id, sectionIndex) => {
                    const title =
                      sectionIndex < sections.length ? sections[sectionIndex].title : 'Fechamento';
                    const locked = sectionIndex >= visible;
                    return (
                      <li key={id}>
                        {locked ? (
                          <span data-locked aria-disabled="true">
                            <span aria-hidden="true">
                              <PiLockSimple />
                            </span>
                            {title}
                            <span className="sr-only"> (ainda não aberta)</span>
                          </span>
                        ) : (
                          <a
                            href={`#${id}`}
                            data-done={sectionIndex < reached || done || undefined}
                            onClick={(event) => {
                              event.preventDefault();
                              document
                                .getElementById(`${id}-title`)
                                ?.focus({ preventScroll: true });
                              document.getElementById(id)?.scrollIntoView?.({ block: 'start' });
                            }}
                          >
                            <span aria-hidden="true">
                              {sectionIndex < reached || done ? (
                                <PiCheckBold />
                              ) : (
                                String(sectionIndex + 1).padStart(2, '0')
                              )}
                            </span>
                            {title}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
              {!done && (
                <label className="option-check lesson-show-all" htmlFor="percurso-show-all">
                  <input
                    id="percurso-show-all"
                    name="percursoShowAll"
                    type="checkbox"
                    checked={showAll}
                    onChange={(event) => setShowAll(event.target.checked)}
                  />
                  Mostrar a aula inteira
                </label>
              )}
            </nav>

            <div className="guide-body lesson-body">
              {failed ? (
                <div className="guide-failed" role="alert">
                  <p>Não foi possível carregar esta etapa. Tente recarregar a página.</p>
                  <button type="button" onClick={() => window.location.reload()}>
                    Recarregar
                  </button>
                </div>
              ) : !content ? (
                <div role="status" aria-label="Carregando etapa">
                  <div className="roadmap-skeleton" />
                  <div className="roadmap-skeleton" />
                </div>
              ) : (
                <>
                  <NarrationPlayer />
                  <p className="lesson-hook" data-narration-clip="hook">
                    <span data-narration-field="text">
                      <Inline text={content.hook} />
                    </span>{' '}
                    <NarrationBlockButton clipId="hook" label="Ouvir abertura" />
                  </p>
                  <GuideBlockView
                    block={{
                      type: 'callout',
                      tone: 'tip',
                      title: 'Como aproveitar esta etapa na entrega',
                      text: stage.focusNote,
                    }}
                    guideId={`percurso-${percurso.id}-${stage.slug}`}
                  />
                  {sections.slice(0, visible).map((section, sectionIndex) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className="guide-section lesson-section"
                      aria-labelledby={`${section.id}-title`}
                    >
                      <h2
                        id={`${section.id}-title`}
                        tabIndex={-1}
                        data-narration-clip={`${section.id}:heading`}
                      >
                        <span aria-hidden="true">{String(sectionIndex + 1).padStart(2, '0')}</span>
                        <span data-narration-field="title">{section.title}</span>
                      </h2>
                      <div className="narration-clip-controls">
                        <NarrationBlockButton
                          clipId={`${section.id}:heading`}
                          label="Ouvir título"
                        />
                      </div>
                      {section.blocks.map((block, blockIndex) => (
                        <LessonBlockView
                          key={block.activityId ?? blockIndex}
                          block={block}
                          lessonId={stage.lessonId}
                          activityId={activityKey(section.id, blockIndex)}
                        />
                      ))}
                      {sectionIndex === visible - 1 && (
                        <div className="lesson-continue">
                          <button
                            type="button"
                            className="lesson-button"
                            onClick={() => advance(sectionIndex + 1)}
                          >
                            {sectionIndex + 1 < sections.length
                              ? `Continuar: ${sections[sectionIndex + 1].title}`
                              : 'Ir para o fechamento'}
                            <PiArrowRight aria-hidden="true" />
                          </button>
                          <span>
                            Seção {sectionIndex + 1} de {sections.length}
                          </span>
                        </div>
                      )}
                    </section>
                  ))}
                  {visible === total && (
                    <section
                      id={closingId}
                      className="guide-section lesson-section lesson-closing"
                      aria-labelledby={`${closingId}-title`}
                    >
                      <h2
                        id={`${closingId}-title`}
                        tabIndex={-1}
                        data-narration-clip="fechamento:heading"
                      >
                        <span aria-hidden="true">{String(total).padStart(2, '0')}</span>
                        <span data-narration-field="title">Fechamento</span>
                      </h2>
                      <div className="narration-clip-controls">
                        <NarrationBlockButton clipId="fechamento:heading" label="Ouvir título" />
                      </div>
                      <div className="lesson-recap" data-narration-clip="fechamento:recap">
                        <div className="narration-heading-row">
                          <h3>O que levar desta etapa</h3>
                          <NarrationBlockButton
                            clipId="fechamento:recap"
                            label="Ouvir fechamento"
                          />
                        </div>
                        <ul className="guide-list">
                          {content.recap.map((item, recapIndex) => (
                            <li key={item} data-narration-field={`item:${recapIndex}`}>
                              <Inline text={item} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      {stageCards.length > 0 && (
                        <div className="lesson-recall">
                          <h3>Cartões de revisão</h3>
                          <p className="guide-text">
                            Responda de cabeça antes de virar cada cartão. Ao concluir a etapa, eles
                            entram na sua <Link to="/aulas#revisao">revisão espaçada</Link>.
                          </p>
                          <Flashcards
                            cards={stageCards.map((card) => ({
                              key: cardKey(stage.lessonId, card.id),
                              front: card.front,
                              back: card.back,
                              narrationId: `fechamento:card:${card.id}:front`,
                            }))}
                          />
                        </div>
                      )}
                      {stage.slug === 'tailwind-na-pratica' && (
                        <div className="lesson-mission">
                          <p className="lesson-activity-kind">Missão da aula de Tailwind</p>
                          <h3>
                            <Inline text={content.mission.title} />
                          </h3>
                          <p className="guide-text">
                            <Inline text={content.mission.text} />
                          </p>
                          <Checklist
                            guideId={`aula-${stage.lessonId}`}
                            listId="missao"
                            items={content.mission.steps}
                          />
                        </div>
                      )}
                      <div className="lesson-complete" data-done={done || undefined}>
                        {done ? (
                          <p role="status">
                            <PiCheckBold aria-hidden="true" /> Etapa concluída.
                            {next && ' Siga para a próxima etapa quando estiver pronto.'}
                          </p>
                        ) : (
                          <button type="button" className="lesson-button" onClick={completeStage}>
                            <PiCheckBold aria-hidden="true" /> Concluir etapa
                          </button>
                        )}
                        {stage.slug === 'integracao-front-api' && (
                          <Link
                            className="lesson-button-quiet"
                            to={`/percurso/${percurso.id}/${diagnosticoWebSlug}`}
                          >
                            Abrir prática opcional de diagnóstico
                          </Link>
                        )}
                        {next && (
                          <Link
                            className="lesson-button"
                            to={`/percurso/${percurso.id}/${next.slug}`}
                          >
                            Próxima etapa: {next.title} <PiArrowRight aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>

          <footer className="guide-end">
            <nav className="guide-pager" aria-label="Etapa anterior e próxima">
              {previous ? (
                <Link to={`/percurso/${percurso.id}/${previous.slug}`} rel="prev">
                  <PiArrowLeft aria-hidden="true" />
                  <span>
                    <small>Etapa anterior</small>
                    {previous.title}
                  </span>
                </Link>
              ) : (
                <Link to={`/percurso/${percurso.id}`} rel="prev">
                  <PiArrowLeft aria-hidden="true" />
                  <span>
                    <small>Visão geral</small>
                    Índice do percurso
                  </span>
                </Link>
              )}
              {next && (
                <Link
                  to={`/percurso/${percurso.id}/${next.slug}`}
                  rel="next"
                  className="guide-pager-next"
                >
                  <span>
                    <small>Próxima etapa</small>
                    {next.title}
                  </span>
                  <PiArrowRight aria-hidden="true" />
                </Link>
              )}
            </nav>
          </footer>
        </article>
        {content && LazyLessonTutor && isTutorEnabled() && (
          <Suspense fallback={null}>
            <LazyLessonTutor
              key={stage.slug}
              title={stage.title}
              summary={stage.summary}
              hook={content.hook}
              sections={sections.slice(0, visible)}
              suggestedSection={
                sections.slice(0, visible).find(({ id }) => hash === `#${id}`)?.id ??
                sections[reached]?.id
              }
            />
          </Suspense>
        )}
      </LessonContext.Provider>
    </NarrationProvider>
  );
}

function PercursoMissionStageView({
  percurso,
  stage,
  index,
}: {
  percurso: Percurso;
  stage: PercursoStage;
  index: number;
}) {
  const percursoStore = usePercursoStore();
  const completed = percursoStore.completed[percurso.id] || [];
  const done = completed.includes(stage.slug);
  const previous = index > 0 ? percurso.stages[index - 1] : undefined;

  useEffect(() => {
    document.title = `${stage.title} · ${percurso.title} · Trilha Info`;
  }, [stage.title, percurso.title]);

  return (
    <article className="guide-page lesson-page" aria-labelledby="mission-title">
      <header className="guide-hero lesson-hero">
        <nav className="guide-crumbs" aria-label="Você está em">
          <ol>
            <li>
              <Link to="/">Início</Link>
            </li>
            <li>
              <Link to={`/percurso/${percurso.id}`}>Percurso rápido</Link>
            </li>
            <li>Missão final</li>
          </ol>
        </nav>
        <p className="lesson-number">
          Etapa {index + 1} de {percurso.stages.length} · Prática independente
        </p>
        <h1 id="mission-title">{stage.title}</h1>
        <p className="guide-summary">{stage.summary}</p>
        <ul className="guide-facts">
          <li>
            <PiClock aria-hidden="true" /> cerca de {stage.minutes} min
          </li>
          <li>API Node + Frontend React + Tailwind</li>
          <li>Checklist salvo neste navegador</li>
        </ul>
      </header>

      <div className="guide-body lesson-body" style={{ maxWidth: 820 }}>
        <GuideBlockView
          block={{
            type: 'callout',
            tone: 'warning',
            title: 'Escreva e teste você mesmo o trabalho',
            text: 'O professor penaliza envios feitos inteiramente por IA. Use este roteiro apenas como guia de estudo: escreva o código da API e do frontend com suas mãos, faça commits pequenos explicando o que mudou e rode todos os testes antes de entregar os links.',
          }}
          guideId={`percurso-${percurso.id}-missao`}
        />

        <section className="guide-section lesson-section" aria-labelledby="contrato-api-title">
          <h2 id="contrato-api-title">
            <span aria-hidden="true">01</span>
            Contrato conferido da API de heróis
          </h2>
          <p className="guide-text">
            Abaixo está o contrato exato observado na sua cópia local de estudo (
            <code>exercicios/superheroes-api</code>). Note especialmente que o erro <code>400</code>{' '}
            retorna a chave <code>message</code> e que o arquivo <code>src/app.js</code> ainda não
            registra <code>cors</code>.
          </p>
          <CodeBlock
            language="js"
            caption="Contrato de GET /heroes e POST /heroes na porta 3000"
            code={superheroesContractSnippet}
          />
        </section>

        <section className="guide-section lesson-section" aria-labelledby="tarefas-praticas-title">
          <h2 id="tarefas-praticas-title">
            <span aria-hidden="true">02</span>O que fazer por conta própria
          </h2>
          <div className="lesson-mission">
            <p className="lesson-activity-kind">Execução prática</p>
            <h3>Listar, cadastrar, diagnosticar uma falha e conferir no celular</h3>
            <p className="guide-text">
              Marque cada passo conforme concluir na sua máquina. O estado fica salvo localmente.
            </p>
            <Link
              className="lesson-trail-link"
              to={`/percurso/${percurso.id}/${diagnosticoWebSlug}`}
            >
              Praticar diagnóstico antes de testar meu projeto
            </Link>
            <Checklist
              guideId={`percurso-${percurso.id}`}
              listId="tarefas-entrega"
              items={missionTasks}
            />
          </div>
        </section>

        <section className="guide-section lesson-section" aria-labelledby="criterios-title">
          <h2 id="criterios-title">
            <span aria-hidden="true">03</span>
            Critérios para saber se você conseguiu
          </h2>
          <div className="lesson-mission">
            <p className="lesson-activity-kind">Autoavaliação</p>
            <h3>Só dê por pronto quando todos os pontos abaixo forem verdade</h3>
            <Checklist
              guideId={`percurso-${percurso.id}`}
              listId="criterios-sucesso"
              items={missionCriteria}
            />
          </div>
        </section>

        <MissionReview key={percurso.id} storageId={percurso.id} />

        <section className="guide-section lesson-section" aria-labelledby="links-github-title">
          <h2 id="links-github-title">
            <span aria-hidden="true">05</span>
            Checklist dos dois links pedidos pelo professor
          </h2>
          <div className="lesson-mission">
            <p className="lesson-activity-kind">Entrega final</p>
            <h3>Confira os dois repositórios antes de enviar</h3>
            <Checklist
              guideId={`percurso-${percurso.id}`}
              listId="links-professor"
              items={missionGithubChecklist}
            />
          </div>

          <div className="lesson-complete" data-done={done || undefined} style={{ marginTop: 28 }}>
            {done ? (
              <p role="status">
                <PiCheckBold aria-hidden="true" /> Missão final marcada como concluída.
              </p>
            ) : (
              <p>Quando terminar seus testes e conferir os dois links, registre a conclusão.</p>
            )}
            <button
              type="button"
              className={done ? 'lesson-button-quiet' : 'lesson-button'}
              onClick={() => toggleStageDone(percurso.id, stage.slug)}
            >
              <PiCheckBold aria-hidden="true" />{' '}
              {done ? 'Desmarcar conclusão' : 'Concluir percurso'}
            </button>
            <Link className="lesson-button-quiet" to={`/percurso/${percurso.id}`}>
              Voltar ao índice do percurso
            </Link>
          </div>
        </section>
      </div>

      <footer className="guide-end">
        <nav className="guide-pager" aria-label="Etapa anterior">
          {previous ? (
            <Link to={`/percurso/${percurso.id}/${previous.slug}`} rel="prev">
              <PiArrowLeft aria-hidden="true" />
              <span>
                <small>Etapa anterior</small>
                {previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          <Link to={`/percurso/${percurso.id}`} className="guide-pager-next">
            <span>
              <small>Resumo</small>
              Índice do percurso
            </span>
            <PiArrowRight aria-hidden="true" />
          </Link>
        </nav>
      </footer>
    </article>
  );
}

export default function PercursoPage() {
  const { id, etapa } = useParams();
  const percurso = findPercurso(id);

  if (!percurso) {
    return (
      <MainLayout>
        <section className="site-empty">
          <p className="home-eyebrow">Percurso não encontrado</p>
          <h1>Este percurso não existe, ou mudou de nome</h1>
          <p>Veja o percurso curto de API Node, React e Tailwind ou as aulas da plataforma.</p>
          <div className="lessons-actions">
            <Link className="home-button home-button-primary" to="/percurso/api-react-tailwind">
              Abrir percurso curto
            </Link>
            <Link className="lesson-button-quiet" to="/aulas">
              Ver todas as aulas
            </Link>
          </div>
        </section>
      </MainLayout>
    );
  }

  if (!etapa) {
    return (
      <MainLayout>
        <PercursoOverview percurso={percurso} />
      </MainLayout>
    );
  }

  if (etapa === diagnosticoWebSlug && percurso.id === 'api-react-tailwind') {
    return (
      <MainLayout>
        <DiagnosticoPratica />
      </MainLayout>
    );
  }

  const index = percurso.stages.findIndex((item) => item.slug === etapa);
  const stage = index >= 0 ? percurso.stages[index] : undefined;

  if (!stage) {
    return (
      <MainLayout>
        <section className="site-empty">
          <p className="home-eyebrow">Etapa não encontrada</p>
          <h1>Esta etapa não faz parte deste percurso</h1>
          <p>Volte para o índice do percurso e escolha uma das etapas disponíveis.</p>
          <Link className="home-button home-button-primary" to={`/percurso/${percurso.id}`}>
            Voltar ao percurso
          </Link>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {stage.kind === 'mission' ? (
        <PercursoMissionStageView percurso={percurso} stage={stage} index={index} />
      ) : (
        <PercursoLessonStageView percurso={percurso} stage={stage} index={index} />
      )}
    </MainLayout>
  );
}
