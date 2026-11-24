import { useMemo, useState } from 'react';
import {
  PiArrowRight,
  PiBookmarkSimpleFill,
  PiBookOpenText,
  PiCheckBold,
  PiClock,
  PiStarFill,
} from 'react-icons/pi';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { FeedbackDialog } from '../components/Feedback/FeedbackDialog';
import { courseLessons, courses, findCourse, findLesson, lessonPlace, lessonUrl } from '../lessons';
import { lessonScore, useLessonStore } from '../lessons/progress';
import { toggleFavoriteCourse, toggleSavedLesson, useBookmarks } from '../offline/bookmarks';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';

type StudyTab = 'tudo' | 'andamento' | 'salvas' | 'materias' | 'concluidas';

function formatRelativeDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function StudyingPage() {
  const store = useLessonStore();
  const bookmarks = useBookmarks();
  const [tab, setTab] = useState<StudyTab>('tudo');

  const inProgressLessons = useMemo(() => {
    const candidateIds = new Set<string>([
      ...Object.keys(store.lessons),
      ...Object.keys(bookmarks.recentLessons),
    ]);
    return [...candidateIds]
      .filter((lessonId) => !store.lessons[lessonId]?.done)
      .map((lessonId) => {
        const lesson = findLesson(lessonId);
        if (!lesson) return null;
        const record = store.lessons[lessonId];
        const recent = bookmarks.recentLessons[lessonId];
        const preferredCourse = recent?.courseId ? findCourse(recent.courseId) : undefined;
        const place = lessonPlace(lesson.id, preferredCourse?.id);
        return { lesson, record, recent, course: place?.course };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => (b.recent?.openedAt || '').localeCompare(a.recent?.openedAt || ''));
  }, [store.lessons, bookmarks.recentLessons]);

  const savedLessonsList = useMemo(() => {
    return Object.entries(bookmarks.savedLessons)
      .map(([lessonId, entry]) => {
        const lesson = findLesson(lessonId);
        if (!lesson) return null;
        const place = lessonPlace(lesson.id, entry.courseId);
        const record = store.lessons[lesson.id];
        return { lesson, entry, course: place?.course, record };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.entry.savedAt.localeCompare(a.entry.savedAt));
  }, [bookmarks.savedLessons, store.lessons]);

  const favoriteCoursesList = useMemo(() => {
    return Object.entries(bookmarks.favoriteCourses)
      .map(([courseId, entry]) => {
        const course = findCourse(courseId);
        if (!course) return null;
        const ordered = courseLessons(course);
        const doneCount = ordered.filter((l) => store.lessons[l.id]?.done).length;
        const nextLesson = ordered.find((l) => !store.lessons[l.id]?.done) || ordered[0];
        return { course, entry, total: ordered.length, doneCount, nextLesson };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.entry.savedAt.localeCompare(a.entry.savedAt));
  }, [bookmarks.favoriteCourses, store.lessons]);

  const completedLessons = useMemo(() => {
    return Object.entries(store.lessons)
      .filter(([, record]) => Boolean(record.done))
      .map(([lessonId, record]) => {
        const lesson = findLesson(lessonId);
        if (!lesson) return null;
        const recent = bookmarks.recentLessons[lessonId];
        const place = lessonPlace(lesson.id, recent?.courseId);
        return { lesson, record, course: place?.course, score: lessonScore(record) };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => (b.record.done || '').localeCompare(a.record.done || ''));
  }, [store.lessons, bookmarks.recentLessons]);

  const showInProgress = tab === 'tudo' || tab === 'andamento';
  const showSaved = tab === 'tudo' || tab === 'salvas';
  const showFavoriteCourses = tab === 'tudo' || tab === 'materias';
  const showCompleted = tab === 'tudo' || tab === 'concluidas';

  return (
    <MainLayout>
      <div className="guide-page lessons-index">
        <header className="guide-hero">
          <nav className="guide-crumbs" aria-label="Você está em">
            <ol>
              <li>
                <Link to="/">Início</Link>
              </li>
              <li>Estudando</li>
            </ol>
          </nav>
          <h1>O que você está estudando</h1>
          <p className="guide-summary">
            Acompanhe as aulas que você abriu recentemente, acesse suas aulas salvas e organize suas
            matérias favoritas. Tudo fica salvo localmente e entra no backup PC ↔ Celular.
          </p>
          <ul className="guide-facts">
            <li>{inProgressLessons.length} em andamento</li>
            <li>{savedLessonsList.length} salvas</li>
            <li>{favoriteCoursesList.length} matérias favoritas</li>
            <li>{completedLessons.length} concluídas</li>
          </ul>
          <div className="lessons-actions">
            <Link className="lesson-button" to="/aulas">
              <PiBookOpenText aria-hidden="true" /> Explorar todas as aulas
            </Link>
            <FeedbackDialog
              triggerLabel="Avaliar ou relatar bug"
              triggerClassName="lesson-button-quiet"
            />
          </div>
        </header>

        <nav className="study-tabs" aria-label="Filtrar sua lista de estudos">
          {(
            [
              ['tudo', 'Tudo'],
              ['andamento', `Em andamento (${inProgressLessons.length})`],
              ['materias', `Matérias favoritas (${favoriteCoursesList.length})`],
              ['salvas', `Aulas salvas (${savedLessonsList.length})`],
              ['concluidas', `Concluídas (${completedLessons.length})`],
            ] as Array<[StudyTab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'lesson-button' : 'lesson-button-quiet'}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {showInProgress && (
          <section aria-labelledby="in-progress-title" className="study-section">
            <h2 id="in-progress-title" className="lessons-modules-title">
              Aulas em andamento
            </h2>
            {inProgressLessons.length === 0 ? (
              <div className="offline-card">
                <p>
                  Você ainda não abriu nenhuma aula em andamento. Escolha uma aula em{' '}
                  <Link to="/aulas">Aulas</Link> e ela aparecerá aqui automaticamente.
                </p>
              </div>
            ) : (
              <ol className="lessons-list">
                {inProgressLessons.map(({ lesson, record, recent, course }) => {
                  const isSaved = Boolean(bookmarks.savedLessons[lesson.id]);
                  const lastSeen = formatRelativeDate(recent?.openedAt);
                  return (
                    <li key={lesson.id} className="study-item-row">
                      <Link to={lessonUrl(lesson.id, course?.id)}>
                        <span className="lessons-text">
                          <strong>{lesson.title}</strong>
                          <span>{lesson.summary}</span>
                          <small>
                            {course ? `${course.title} · ` : ''}
                            <PiClock aria-hidden="true" /> {lesson.minutes} min
                            {record && record.reached > 0
                              ? ` · seção ${record.reached + 1}`
                              : ' · em andamento'}
                            {lastSeen ? ` · vista em ${lastSeen}` : ''}
                          </small>
                        </span>
                        <span className="lesson-button-quiet" aria-hidden="true">
                          Continuar <PiArrowRight />
                        </span>
                      </Link>
                      <button
                        type="button"
                        className="study-icon-action"
                        aria-pressed={isSaved}
                        aria-label={
                          isSaved
                            ? `Remover ${lesson.title} das salvas`
                            : `Salvar aula ${lesson.title}`
                        }
                        onClick={() => toggleSavedLesson(lesson.id, course?.id)}
                      >
                        <PiBookmarkSimpleFill aria-hidden="true" />
                        <span>{isSaved ? 'Salva' : 'Salvar'}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}

        {showFavoriteCourses && (
          <section aria-labelledby="favorite-courses-title" className="study-section">
            <h2 id="favorite-courses-title" className="lessons-modules-title">
              Matérias favoritas
            </h2>
            {favoriteCoursesList.length === 0 ? (
              <div className="offline-card">
                <p>
                  Nenhuma matéria favoritada ainda. Em <Link to="/aulas">Aulas</Link> (
                  {courses.length} matérias disponíveis), clique em{' '}
                  <strong>Favoritar matéria</strong> para fixá-la aqui.
                </p>
              </div>
            ) : (
              <ul className="study-favorites-grid">
                {favoriteCoursesList.map(({ course, total, doneCount, nextLesson }) => {
                  const percent = total ? Math.round((doneCount / total) * 100) : 0;
                  return (
                    <li key={course.id} className="offline-card">
                      <div className="study-card-head">
                        <h3>
                          <Link to={`/aulas/${course.id}`}>{course.title}</Link>
                        </h3>
                        <button
                          type="button"
                          className="study-icon-action"
                          aria-pressed={true}
                          aria-label={`Remover ${course.title} das matérias favoritas`}
                          onClick={() => toggleFavoriteCourse(course.id)}
                        >
                          <PiStarFill aria-hidden="true" />
                          <span>Favorita</span>
                        </button>
                      </div>
                      <p>
                        {doneCount} de {total} aulas concluídas ({percent}%)
                      </p>
                      <div className="home-actions">
                        {nextLesson && (
                          <Link className="lesson-button" to={lessonUrl(nextLesson.id, course.id)}>
                            Continuar <PiArrowRight aria-hidden="true" />
                          </Link>
                        )}
                        <Link className="lesson-button-quiet" to={`/aulas/${course.id}`}>
                          Ver índice
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {showSaved && (
          <section aria-labelledby="saved-lessons-title" className="study-section">
            <h2 id="saved-lessons-title" className="lessons-modules-title">
              Aulas salvas
            </h2>
            {savedLessonsList.length === 0 ? (
              <div className="offline-card">
                <p>
                  Nenhuma aula salva ainda. Abra qualquer aula e toque em{' '}
                  <strong>Salvar aula</strong> para montar sua fila de estudo.
                </p>
              </div>
            ) : (
              <ol className="lessons-list">
                {savedLessonsList.map(({ lesson, course, record }) => (
                  <li
                    key={lesson.id}
                    className="study-item-row"
                    data-done={record?.done ? true : undefined}
                  >
                    <Link to={lessonUrl(lesson.id, course?.id)}>
                      <span className="lessons-text">
                        <strong>{lesson.title}</strong>
                        <span>{lesson.summary}</span>
                        <small>
                          {course ? `${course.title} · ` : ''}
                          {lesson.minutes} min
                          {record?.done ? ' · concluída' : record ? ' · em andamento' : ''}
                        </small>
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="study-icon-action"
                      aria-pressed={true}
                      aria-label={`Remover ${lesson.title} das salvas`}
                      onClick={() => toggleSavedLesson(lesson.id, course?.id)}
                    >
                      <PiBookmarkSimpleFill aria-hidden="true" />
                      <span>Salva</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {showCompleted && (
          <section aria-labelledby="completed-lessons-title" className="study-section">
            <h2 id="completed-lessons-title" className="lessons-modules-title">
              Aulas concluídas
            </h2>
            {completedLessons.length === 0 ? (
              <div className="offline-card">
                <p>Quando você concluir uma aula, ela ficará registrada aqui para revisão.</p>
              </div>
            ) : (
              <ol className="lessons-list">
                {completedLessons.map(({ lesson, course, score }) => (
                  <li key={lesson.id} data-done={true}>
                    <Link to={lessonUrl(lesson.id, course?.id)}>
                      <span className="lessons-number" aria-hidden="true">
                        <PiCheckBold />
                      </span>
                      <span className="lessons-text">
                        <strong>{lesson.title}</strong>
                        <span>{lesson.summary}</span>
                        <small>
                          {course ? `${course.title} · ` : ''}
                          concluída
                          {score.total ? ` · ${score.correct}/${score.total} de primeira` : ''}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </MainLayout>
  );
}
