import { useEffect, useRef, useState } from 'react';
import {
  PiArrowLeft,
  PiArrowRight,
  PiArrowUpRight,
  PiCheckBold,
  PiClock,
  PiLockSimple,
  PiTarget,
} from 'react-icons/pi';
import { Link, useLocation } from 'react-router-dom';
import { activityKey, LessonPlace, lessonUrl } from '../../lessons';
import {
  cardKey,
  enrollCards,
  lessonScore,
  localDay,
  useLessonRecord,
} from '../../lessons/progress';
import { LessonContent, LessonMeta } from '../../lessons/types';
import { Checklist } from '../Guide/Checklist';
import { Inline } from '../Guide/inline';
import { NarrationProvider } from '../../narration/controller';
import { NarrationBlockButton, NarrationPlayer } from '../../narration/NarrationPlayer';
import { LessonTutor } from '../../tutor/LessonTutor';
import { LessonContext } from './context';
import { Flashcards } from './Flashcards';
import { LessonBlockView } from './LessonBlock';
import '../Guide/guide.css';
import './lesson.css';

const closingId = 'fechamento';

export function LessonView({ lesson, place }: { lesson: LessonMeta; place: LessonPlace }) {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [failed, setFailed] = useState(false);
  const [record, update] = useLessonRecord(lesson.id);
  const [showAll, setShowAll] = useState(false);
  const focusTarget = useRef<string>();
  const lessonContainerRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  const { course, previous, next } = place;
  const trailGroup = course.groups[lesson.id] || lesson.groupIds[0];

  useEffect(() => {
    let current = true;
    setContent(null);
    setFailed(false);
    setShowAll(false);
    lesson
      .load()
      .then((module) => current && setContent(module.content))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [lesson]);

  const sections = content?.sections || [];
  const total = sections.length + 1;
  const reached = Math.min(record?.reached ?? 0, total - 1);
  const visible = showAll || record?.done ? total : reached + 1;
  const done = !!record?.done;
  const score = lessonScore(record);
  const percent = done ? 100 : Math.round((reached / total) * 100);
  const ids = [...sections.map((section) => section.id), closingId];

  function scheduleFocusHeading(targetId: string) {
    return requestAnimationFrame(() => {
      const heading = document.getElementById(`${targetId}-title`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({
        block: 'start',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
    });
  }

  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = undefined;
    const frame = scheduleFocusHeading(target);
    return () => cancelAnimationFrame(frame);
  }, [visible, reached]);

  useEffect(() => {
    if (!content || !hash) return;
    const targetId = decodeURIComponent(hash.slice(1));
    const targetIndex = ids.indexOf(targetId);
    if (targetIndex < 0) return;
    focusTarget.current = targetId;
    if (targetIndex >= visible) {
      setShowAll(true);
      return;
    }
    const frame = scheduleFocusHeading(targetId);
    focusTarget.current = undefined;
    return () => cancelAnimationFrame(frame);
  }, [content, hash]);

  function advance(index: number) {
    if (index !== reached + 1 || index >= total) return;
    focusTarget.current = ids[index];
    update((previous) => ({ ...previous, reached: Math.max(previous.reached, index) }));
  }

  function complete() {
    if (!content) return;
    update((previous) => ({ ...previous, reached: total - 1, done: previous.done || localDay() }));
    enrollCards(content.cards.map((card) => cardKey(lesson.id, card.id)));
  }

  return (
    <NarrationProvider
      lesson={lesson}
      content={content}
      containerRef={lessonContainerRef}
      scopeKey={lesson.id}
      hasMoreHiddenSections={Boolean(content && !showAll && visible < total)}
    >
      <LessonContext.Provider value={{ lessonId: lesson.id }}>
        <article
          ref={lessonContainerRef}
          className="guide-page lesson-page"
          aria-labelledby="lesson-title"
        >
          <header className="guide-hero lesson-hero" data-narration-clip="header">
            <nav className="guide-crumbs" aria-label="Você está em">
              <ol>
                <li>
                  <Link to="/">Início</Link>
                </li>
                <li>
                  <Link to={`/aulas/${course.id}`}>Aulas de {course.title}</Link>
                </li>
                <li>{place.module.title}</li>
              </ol>
            </nav>
            <p className="lesson-number">
              Aula {place.number} de {place.total} · {course.title}
            </p>
            <h1 id="lesson-title" data-narration-field="title">
              {lesson.title}
            </h1>
            <p className="guide-summary" data-narration-field="summary">
              {lesson.summary}
            </p>
            {content && (
              <div className="narration-clip-controls">
                <NarrationBlockButton clipId="header" label="Ouvir apresentação" />
              </div>
            )}
            <ul className="guide-facts">
              <li>
                <PiClock aria-hidden="true" /> cerca de {lesson.minutes} min
              </li>
              <li>Para quem está começando</li>
              <li>Progresso salvo neste navegador</li>
              <li>
                Revisado em{' '}
                <time dateTime={lesson.updatedAt}>
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                    new Date(`${lesson.updatedAt}T12:00:00`),
                  )}
                </time>
              </li>
            </ul>
            <div className="lesson-objectives">
              <p>
                <PiTarget aria-hidden="true" /> Ao final, você vai conseguir:
              </p>
              <ul>
                {lesson.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
            <div className="lesson-progress">
              <div className="lesson-progress-bar" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </div>
              <p>
                {done ? 'Aula concluída' : `${percent}% da aula`}
                {score.total > 0 &&
                  ` · ${score.correct} de ${score.total} atividades certas de primeira`}
              </p>
              <progress
                className="sr-only"
                max={100}
                value={percent}
                aria-label="Progresso na aula"
              />
            </div>
          </header>

          <div className="guide-layout">
            <nav className="guide-toc lesson-toc" aria-label="Nesta aula">
              <p className="guide-toc-title" aria-hidden="true">
                Nesta aula
              </p>
              {content && (
                <ol>
                  {ids.map((id, index) => {
                    const title = index < sections.length ? sections[index].title : 'Fechamento';
                    const locked = index >= visible;
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
                            data-done={index < reached || done || undefined}
                            aria-current={
                              index === Math.min(reached, visible - 1) && !done ? 'step' : undefined
                            }
                            onClick={(event) => {
                              event.preventDefault();
                              document
                                .getElementById(`${id}-title`)
                                ?.focus({ preventScroll: true });
                              document.getElementById(id)?.scrollIntoView?.({ block: 'start' });
                            }}
                          >
                            <span aria-hidden="true">
                              {index < reached || done ? (
                                <PiCheckBold />
                              ) : (
                                String(index + 1).padStart(2, '0')
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
                <label className="option-check lesson-show-all">
                  <input
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
                  <p>Não foi possível carregar esta aula. Verifique a conexão e tente de novo.</p>
                  <button type="button" onClick={() => window.location.reload()}>
                    Recarregar
                  </button>
                </div>
              ) : !content ? (
                <div role="status" aria-label="Carregando aula">
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
                  {sections.slice(0, visible).map((section, index) => (
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
                        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
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
                          key={blockIndex}
                          block={block}
                          lessonId={lesson.id}
                          activityId={activityKey(section.id, blockIndex)}
                        />
                      ))}
                      {index === visible - 1 && (
                        <div className="lesson-continue">
                          <button
                            type="button"
                            className="lesson-button"
                            onClick={() => advance(index + 1)}
                          >
                            {index + 1 < sections.length
                              ? `Continuar: ${sections[index + 1].title}`
                              : 'Ir para o fechamento'}
                            <PiArrowRight aria-hidden="true" />
                          </button>
                          <span>
                            Seção {index + 1} de {sections.length}
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
                          <h3>O que levar desta aula</h3>
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
                      {content.cards.length > 0 && (
                        <div className="lesson-recall">
                          <h3>Teste sua memória</h3>
                          <p className="guide-text">
                            Lembrar sem olhar fixa o conteúdo muito mais do que reler. Responda de
                            cabeça antes de virar cada cartão. Ao concluir a aula, eles entram na
                            sua <Link to="/aulas#revisao">revisão espaçada</Link>.
                          </p>
                          <Flashcards
                            cards={content.cards.map((card) => ({
                              key: cardKey(lesson.id, card.id),
                              front: card.front,
                              back: card.back,
                              narrationId: `fechamento:card:${card.id}:front`,
                            }))}
                          />
                        </div>
                      )}
                      <div className="lesson-mission" data-narration-clip="fechamento:mission">
                        <div className="narration-heading-row">
                          <p className="lesson-activity-kind">Missão fora da aula</p>
                          <NarrationBlockButton clipId="fechamento:mission" label="Ouvir missão" />
                        </div>
                        <h3 data-narration-field="title">
                          <Inline text={content.mission.title} />
                        </h3>
                        <p className="guide-text" data-narration-field="text">
                          <Inline text={content.mission.text} />
                        </p>
                        <Checklist
                          guideId={`aula-${lesson.id}`}
                          listId="missao"
                          items={content.mission.steps}
                        />
                        <Link
                          className="lesson-trail-link"
                          to={`/roadmap/${course.id}#${encodeURIComponent(trailGroup)}`}
                        >
                          Registrar a prática na trilha {course.title}{' '}
                          <PiArrowUpRight aria-hidden="true" />
                        </Link>
                      </div>
                      <div className="lesson-complete" data-done={done || undefined}>
                        {done ? (
                          <p role="status">
                            <PiCheckBold aria-hidden="true" /> Aula concluída
                            {score.total > 0 &&
                              `, com ${score.correct} de ${score.total} atividades certas de primeira`}
                            .{next && ' Quando quiser, siga para a próxima.'}
                          </p>
                        ) : (
                          <button type="button" className="lesson-button" onClick={complete}>
                            <PiCheckBold aria-hidden="true" /> Concluir aula
                          </button>
                        )}
                        {done && next && (
                          <Link className="lesson-button" to={lessonUrl(next.id, course.id)}>
                            Próxima aula: {next.title} <PiArrowRight aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </section>
                  )}
                  {content.sources && content.sources.length > 0 && visible === total && (
                    <section className="guide-sources" aria-labelledby="lesson-sources-title">
                      <h2 id="lesson-sources-title">Para ir além</h2>
                      <p className="guide-text">
                        Referências externas para aprofundar. A aula acima já cobre o essencial.
                      </p>
                      <ul>
                        {content.sources.map((source) => (
                          <li key={source.url}>
                            <a href={source.url} target="_blank" rel="noreferrer">
                              {source.title}
                              <PiArrowUpRight aria-hidden="true" />
                              <span className="sr-only"> (abre em nova aba)</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>

          <footer className="guide-end">
            <nav className="guide-pager" aria-label="Aula anterior e próxima">
              {previous ? (
                <Link to={lessonUrl(previous.id, course.id)} rel="prev">
                  <PiArrowLeft aria-hidden="true" />
                  <span>
                    <small>Aula anterior</small>
                    {previous.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link to={lessonUrl(next.id, course.id)} rel="next" className="guide-pager-next">
                  <span>
                    <small>Próxima aula</small>
                    {next.title}
                  </span>
                  <PiArrowRight aria-hidden="true" />
                </Link>
              )}
            </nav>
          </footer>
        </article>
        {content && (
          <LessonTutor
            title={lesson.title}
            summary={lesson.summary}
            hook={content.hook}
            sections={sections.slice(0, visible)}
            suggestedSection={
              sections.slice(0, visible).find(({ id }) => hash === `#${id}`)?.id ??
              sections[reached]?.id
            }
          />
        )}
      </LessonContext.Provider>
    </NarrationProvider>
  );
}
