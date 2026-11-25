import { useEffect, useRef, useState } from 'react';
import {
  PiArrowLeft,
  PiArrowRight,
  PiArrowUpRight,
  PiCheckBold,
  PiClock,
  PiTarget,
} from 'react-icons/pi';
import { Link } from 'react-router-dom';
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
import {
  closingId,
  LessonSectionLinks,
  LessonSectionPager,
  useLessonSection,
} from './LessonSectionNavigation';
import '../Guide/guide.css';
import './lesson.css';

export function LessonView({ lesson, place }: { lesson: LessonMeta; place: LessonPlace }) {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [failed, setFailed] = useState(false);
  const [record, update] = useLessonRecord(lesson.id);
  const [showAll, setShowAll] = useState(false);
  const lessonContainerRef = useRef<HTMLElement>(null);
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
  const savedReached = record?.reached ?? 0;
  const reached = Number.isInteger(savedReached)
    ? Math.max(0, Math.min(savedReached, total - 1))
    : 0;
  const done = !!record?.done;
  const score = lessonScore(record);
  const percent = done ? 100 : Math.round((reached / total) * 100);
  const pages = [...sections, { id: closingId, title: 'Fechamento' }];
  const navigation = useLessonSection(
    content ? pages.map(({ id }) => id) : [],
    Number.isInteger(savedReached) ? savedReached : 0,
    showAll,
  );
  const includeIntro = showAll || navigation.index === 0;
  const showClosing = showAll || navigation.id === closingId;
  const displayedSections = showAll
    ? sections
    : sections.slice(navigation.index, navigation.index + 1);

  function openSection(index: number) {
    if (index > navigation.index && index > reached && !done) {
      update((previous) => ({ ...previous, reached: Math.max(previous.reached, index) }));
    }
    navigation.openSection(index);
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
      hasMoreHiddenSections={!showAll && navigation.index < total - 1}
    >
      <LessonContext.Provider value={{ lessonId: lesson.id }}>
        <article
          ref={lessonContainerRef}
          className="guide-page lesson-page"
          aria-labelledby="lesson-title"
        >
          <header
            className="guide-hero lesson-hero"
            data-narration-clip={includeIntro ? 'header' : undefined}
          >
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
            {content && includeIntro && (
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
                <>
                  <LessonSectionLinks
                    sections={pages}
                    navigation={navigation}
                    reached={reached}
                    showAll={showAll}
                    done={done}
                  />
                  <label className="option-check lesson-show-all">
                    <input
                      type="checkbox"
                      checked={showAll}
                      onChange={(event) => setShowAll(event.target.checked)}
                    />
                    Mostrar a aula inteira
                  </label>
                </>
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
                  <NarrationPlayer
                    sectionId={showAll ? undefined : navigation.id}
                    includeIntro={includeIntro}
                  />
                  {includeIntro && (
                    <p className="lesson-hook" data-narration-clip="hook">
                      <span data-narration-field="text">
                        <Inline text={content.hook} />
                      </span>{' '}
                      <NarrationBlockButton clipId="hook" label="Ouvir abertura" />
                    </p>
                  )}
                  {displayedSections.map((section, offset) => (
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
                        <span aria-hidden="true">
                          {String((showAll ? offset : navigation.index) + 1).padStart(2, '0')}
                        </span>
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
                    </section>
                  ))}
                  {showClosing && (
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
                  {content.sources && content.sources.length > 0 && showClosing && (
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
                  {!showAll && (
                    <LessonSectionPager
                      index={navigation.index}
                      sectionCount={sections.length}
                      nextTitle={sections[navigation.index + 1]?.title}
                      onOpen={openSection}
                    />
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
            key={showAll ? 'all' : navigation.id}
            sections={displayedSections}
            suggestedSection={sections[navigation.index]?.id}
          />
        )}
      </LessonContext.Provider>
    </NarrationProvider>
  );
}
