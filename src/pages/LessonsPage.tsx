import { CSSProperties, useMemo, useState } from 'react';
import {
  PiArrowRight,
  PiBookmarkSimple,
  PiBookmarkSimpleFill,
  PiCheckBold,
  PiMagnifyingGlass,
  PiStar,
  PiStarFill,
} from 'react-icons/pi';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Review } from '../components/Lesson/Review';
import { mainRoadmapsData } from '../components/MainRoadmaps/mainRoadmapsData';
import { courseLessons, courses, lessonPlace, lessons, lessonUrl } from '../lessons';
import { useLessonStore } from '../lessons/progress';
import { toggleFavoriteCourse, toggleSavedLesson, useBookmarks } from '../offline/bookmarks';
import { lessonPlanStepUrl, nextPendingPlanStep } from '../recommender/LessonPlanPanel';
import { useSavedLessonPlan } from '../recommender/savedLessonPlan';
import { normalizeText } from '../recommender/studyRecommender';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';

const method = [
  {
    title: 'Entenda',
    text: 'Explicações curtas, com analogias do dia a dia e animações que mostram o que acontece por dentro.',
  },
  {
    title: 'Experimente',
    text: 'Código, SQL, Python e terminal ao vivo: mude e veja o resultado na hora, sem instalar nada.',
  },
  {
    title: 'Verifique',
    text: 'Perguntas que explicam o erro, não só apontam. Errar aqui é parte do método.',
  },
  {
    title: 'Lembre',
    text: 'Cartões de revisão voltam no dia certo para o conhecimento ficar, não só passar.',
  },
];

const order = mainRoadmapsData.map((roadmap) => roadmap.id as string);
const rankCourse = (id: string) => {
  const index = order.indexOf(id);
  return index === -1 ? Number.POSITIVE_INFINITY : index;
};

export default function LessonsPage() {
  const store = useLessonStore();
  const bookmarks = useBookmarks();
  const savedPlan = useSavedLessonPlan();
  const [query, setQuery] = useState('');
  const inProgressCount = new Set([
    ...Object.entries(store.lessons)
      .filter(([, rec]) => !rec.done)
      .map(([id]) => id),
    ...Object.keys(bookmarks.recentLessons).filter((id) => !store.lessons[id]?.done),
  ]).size;
  const savedCount = Object.keys(bookmarks.savedLessons).length;
  const favoriteCount = Object.keys(bookmarks.favoriteCourses).length;
  const sorted = useMemo(
    () => [...courses].sort((a, b) => rankCourse(a.id) - rankCourse(b.id)),
    [],
  );

  const normalizedQuery = normalizeText(query.trim());
  const matchedLessons = useMemo(() => {
    if (!normalizedQuery) return [];
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return lessons.filter((lesson) => {
      const haystack = normalizeText(
        [lesson.title, lesson.summary, ...lesson.objectives].join(' '),
      );
      return tokens.every((token) => haystack.includes(token));
    });
  }, [normalizedQuery]);

  const savedPlanDone = savedPlan ? savedPlan.steps.filter((step) => step.done).length : 0;
  const savedPlanTotal = savedPlan ? savedPlan.steps.length : 0;
  const nextPlanStep = savedPlan ? nextPendingPlanStep(savedPlan) : undefined;

  return (
    <MainLayout>
      <div className="guide-page lessons-index">
        <header className="guide-hero">
          <nav className="guide-crumbs" aria-label="Você está em">
            <ol>
              <li>
                <Link to="/">Início</Link>
              </li>
              <li>Aulas</li>
            </ol>
          </nav>
          <h1>Aulas que você faz, para cada trilha</h1>
          <p className="guide-summary">
            Cursos gratuitos para quem está começando do zero. Cada aula explica um conceito, deixa
            você mexer nele e confere se ficou. Sem cadastro: o progresso fica no seu navegador.
          </p>
          <ul className="guide-facts">
            <li>{lessons.length} aulas</li>
            <li>{courses.length} cursos</li>
            <li>Aulas em comum aparecem em mais de uma trilha, e o progresso vale para todas</li>
          </ul>
          <div className="lessons-actions">
            <Link className="lesson-button" to="/estudando">
              Estudando agora ({inProgressCount} em andamento · {savedCount} salvas ·{' '}
              {favoriteCount} favoritas) <PiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section aria-labelledby="method-title" className="lessons-method">
          <h2 id="method-title">Como as aulas ensinam</h2>
          <ol>
            {method.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <Review />

        {savedPlan && (
          <section aria-labelledby="saved-plan-title" className="lessons-saved-plan">
            <div>
              <p className="lessons-course-kind">Plano salvo neste navegador</p>
              <h2 id="saved-plan-title">Seu plano de estudo</h2>
              <p>
                {savedPlanDone} de {savedPlanTotal}{' '}
                {savedPlanTotal === 1 ? 'prática concluída' : 'práticas concluídas'}.
              </p>
            </div>
            <div className="lessons-saved-plan-actions">
              {nextPlanStep && (
                <Link className="lesson-button" to={lessonPlanStepUrl(nextPlanStep)}>
                  Retomar plano <PiArrowRight aria-hidden="true" />
                </Link>
              )}
              <Link className="lesson-button-quiet" to="/aulas/o-que-estudar#meu-plano">
                Gerenciar plano
              </Link>
            </div>
          </section>
        )}

        <div className="lessons-tools-grid">
          <section aria-labelledby="o-que-estudar-title" className="lessons-tool-card">
            <p className="lessons-course-kind">Busca por enunciado · Sem IA</p>
            <h2 id="o-que-estudar-title">O que preciso estudar?</h2>
            <p>
              Cole o enunciado de um trabalho, lista de prova ou requisitos de projeto e receba uma
              sequência curta de aulas do catálogo para abrir, com pré-requisitos e trechos não
              cobertos sinalizados.
            </p>
            <Link className="lesson-button" to="/aulas/o-que-estudar">
              Abrir recomendador por enunciado <PiArrowRight aria-hidden="true" />
            </Link>
          </section>

          <section aria-labelledby="percurso-rapido-title" className="lessons-tool-card">
            <p className="lessons-course-kind">Percurso curto · Entrega API + Tailwind</p>
            <h2 id="percurso-rapido-title">Node e Express, React + Fetch, Integração e Tailwind</h2>
            <p>
              Roteiro enxuto para revisar API Node, requisições no React, CORS/fetch e Tailwind na
              prática antes de construir sua entrega com <code>GET /heroes</code> e{' '}
              <code>POST /heroes</code>.
            </p>
            <Link className="lesson-button" to="/percurso/api-react-tailwind">
              Abrir percurso curto <PiArrowRight aria-hidden="true" />
            </Link>
          </section>
        </div>

        <section aria-labelledby="courses-title">
          <div className="lessons-catalog-head">
            <h2 id="courses-title" className="lessons-modules-title">
              {normalizedQuery ? 'Aulas encontradas' : 'Escolha um curso'}
            </h2>
            <div className="lessons-search-bar">
              <label className="guides-search">
                <PiMagnifyingGlass aria-hidden="true" />
                <span className="sr-only">Buscar aula</span>
                <input
                  type="search"
                  value={query}
                  placeholder={`Buscar entre as ${lessons.length} aulas (ex.: CORS, SQL, React)`}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {query && (
                <button type="button" className="lesson-button-quiet" onClick={() => setQuery('')}>
                  Limpar busca
                </button>
              )}
            </div>
          </div>

          {normalizedQuery ? (
            <>
              <p className="guides-count" role="status">
                {matchedLessons.length === 0
                  ? `Nenhuma aula encontrada para “${query.trim()}”.`
                  : `${matchedLessons.length} ${
                      matchedLessons.length === 1 ? 'aula encontrada' : 'aulas encontradas'
                    }`}
              </p>
              {matchedLessons.length > 0 && (
                <ol className="lessons-list">
                  {matchedLessons.map((lesson, index) => {
                    const place = lessonPlace(lesson.id);
                    const record = store.lessons[lesson.id];
                    const saved = Boolean(bookmarks.savedLessons[lesson.id]);
                    return (
                      <li
                        key={lesson.id}
                        className="study-item-row"
                        data-done={record?.done ? true : undefined}
                      >
                        <Link to={lessonUrl(lesson.id, place?.course.id)}>
                          <span className="lessons-number" aria-hidden="true">
                            {record?.done ? <PiCheckBold /> : String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="lessons-text">
                            <strong>{lesson.title}</strong>
                            <span>{lesson.summary}</span>
                            <small>
                              {place ? `${place.course.title} · ` : ''}
                              {lesson.minutes} min
                              {record?.done ? ' · concluída' : record ? ' · em andamento' : ''}
                            </small>
                          </span>
                          {record?.done && <span className="sr-only">, concluída</span>}
                        </Link>
                        <button
                          type="button"
                          className="study-icon-action"
                          aria-pressed={saved}
                          aria-label={
                            saved
                              ? `Remover ${lesson.title} das salvas`
                              : `Salvar aula ${lesson.title}`
                          }
                          onClick={() => toggleSavedLesson(lesson.id, place?.course.id)}
                        >
                          {saved ? (
                            <PiBookmarkSimpleFill aria-hidden="true" />
                          ) : (
                            <PiBookmarkSimple aria-hidden="true" />
                          )}
                          <span>{saved ? 'Salva' : 'Salvar'}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          ) : (
            <ul className="lessons-courses">
              {sorted.map((course) => {
                const ordered = courseLessons(course);
                const done = ordered.filter((lesson) => store.lessons[lesson.id]?.done).length;
                const minutes = ordered.reduce((sum, lesson) => sum + lesson.minutes, 0);
                const roadmap = mainRoadmapsData.find((value) => value.id === course.id);
                const favorited = Boolean(bookmarks.favoriteCourses[course.id]);
                return (
                  <li key={course.id} className="course-card-wrap">
                    <button
                      type="button"
                      className="course-favorite-btn"
                      aria-pressed={favorited}
                      aria-label={
                        favorited
                          ? `Remover ${course.title} das matérias favoritas`
                          : `Favoritar matéria ${course.title}`
                      }
                      onClick={() => toggleFavoriteCourse(course.id)}
                    >
                      {favorited ? (
                        <PiStarFill aria-hidden="true" />
                      ) : (
                        <PiStar aria-hidden="true" />
                      )}
                      <span>{favorited ? 'Favorita' : 'Favoritar'}</span>
                    </button>
                    <Link to={`/aulas/${course.id}`}>
                      <span className="lessons-course-kind">{roadmap?.kind || 'Trilha'}</span>
                      <strong>{course.title}</strong>
                      {roadmap?.audience && <span>{roadmap.audience}</span>}
                      <span
                        className="lessons-course-meter"
                        style={
                          { '--p': ordered.length ? done / ordered.length : 0 } as CSSProperties
                        }
                        aria-hidden="true"
                      >
                        <span />
                      </span>
                      <small>
                        {ordered.length} aulas · cerca de {Math.max(1, Math.round(minutes / 60))} h
                        {done > 0 ? ` · ${done} concluídas` : ''}
                      </small>
                      <span className="lessons-course-cta">
                        {done > 0 ? 'Continuar' : 'Ver o curso'} <PiArrowRight aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
