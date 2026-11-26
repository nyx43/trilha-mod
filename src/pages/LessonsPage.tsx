import { CSSProperties } from 'react';
import { PiArrowRight } from 'react-icons/pi';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Review } from '../components/Lesson/Review';
import { mainRoadmapsData } from '../components/MainRoadmaps/mainRoadmapsData';
import { courseLessons, courses, lessons } from '../lessons';
import { useLessonStore } from '../lessons/progress';
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

export default function LessonsPage() {
  const store = useLessonStore();
  const sorted = [...courses].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

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

        <section aria-labelledby="o-que-estudar-title" className="lessons-review">
          <div>
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
          </div>
        </section>

        <section aria-labelledby="percurso-rapido-title" className="lessons-review">
          <div>
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
          </div>
        </section>

        <section aria-labelledby="freelancer-title" className="lessons-review">
          <div>
            <h2 id="freelancer-title">Simulação freelancer</h2>
            <p>
              Combine o escopo de uma agenda de salas com um cliente fictício, faça a primeira
              entrega e adapte sua solução quando surgir um novo requisito.
            </p>
            <Link className="lesson-button" to="/aulas/freelancer/reservas">
              Começar simulação <PiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="courses-title">
          <h2 id="courses-title" className="lessons-modules-title">
            Escolha um curso
          </h2>
          <ul className="lessons-courses">
            {sorted.map((course) => {
              const ordered = courseLessons(course);
              const done = ordered.filter((lesson) => store.lessons[lesson.id]?.done).length;
              const minutes = ordered.reduce((sum, lesson) => sum + lesson.minutes, 0);
              const roadmap = mainRoadmapsData.find((value) => value.id === course.id);
              return (
                <li key={course.id}>
                  <Link to={`/aulas/${course.id}`}>
                    <span className="lessons-course-kind">{roadmap?.kind || 'Trilha'}</span>
                    <strong>{course.title}</strong>
                    {roadmap?.audience && <span>{roadmap.audience}</span>}
                    <span
                      className="lessons-course-meter"
                      style={{ '--p': ordered.length ? done / ordered.length : 0 } as CSSProperties}
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
        </section>
      </div>
    </MainLayout>
  );
}
