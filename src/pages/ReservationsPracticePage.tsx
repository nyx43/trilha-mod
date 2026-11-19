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
          <h1 id="reservas-title">Caso das reservas</h1>
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
