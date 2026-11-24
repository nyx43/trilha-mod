import { Link } from 'react-router-dom';
import { PersistencePilot } from '../components/Lesson/PersistencePilot';
import MainLayout from '../components/layouts/MainLayout';
import { persistenceLessonId } from '../lessons/persistencePilot';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';

export default function ReservationsPracticePage() {
  return (
    <MainLayout>
      <article className="guide-page lesson-page" aria-labelledby="reservas-title">
        <header className="guide-hero lesson-hero">
          <nav className="guide-crumbs" aria-label="Você está em">
            <ol>
              <li>
                <Link to="/">Início</Link>
              </li>
              <li>
                <Link to="/aulas">Aulas</Link>
              </li>
              <li>
                <Link to={`/aula/${persistenceLessonId}`}>Onde o dado mora</Link>
              </li>
              <li>Caso das reservas</li>
            </ol>
          </nav>
          <p className="lesson-number">Prática de revisão · Onde o dado mora</p>
          <h1 id="reservas-title">Caso das reservas</h1>
          <p className="guide-summary">
            Escolha e execute um teste para descobrir se uma reserva continua disponível depois de
            fechar e reabrir o serviço.
          </p>
        </header>
        <div className="guide-body lesson-body lesson-pilot-page">
          <PersistencePilot id="reservas" />
          <Link className="lesson-trail-link" to={`/aula/${persistenceLessonId}`}>
            Voltar para Onde o dado mora
          </Link>
        </div>
      </article>
    </MainLayout>
  );
}
