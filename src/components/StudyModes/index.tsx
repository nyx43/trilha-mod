import { ReactNode } from 'react';
import {
  PiArrowRight,
  PiBookOpenText,
  PiCompass,
  PiFlagCheckered,
  PiLightning,
} from 'react-icons/pi';
import { Link } from 'react-router-dom';
import { COURSE_COUNT, LESSON_COUNT } from '../../lessons/counts';

interface StudyMode {
  id: string;
  kicker: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  icon: ReactNode;
  accent?: 'ai';
}

const modes: StudyMode[] = [
  {
    id: 'aulas',
    kicker: `${LESSON_COUNT} aulas · ${COURSE_COUNT} cursos`,
    title: 'Aulas interativas',
    description:
      'Explicações curtas com narração sincronizada, código, SQL, Python e terminal direto no navegador, mais revisão espaçada.',
    cta: 'Abrir cursos',
    to: '/aulas',
    icon: <PiBookOpenText aria-hidden="true" />,
  },
  {
    id: 'o-que-estudar',
    kicker: 'Busca por enunciado · sem IA',
    title: 'O que preciso estudar?',
    description:
      'Cole os requisitos de um trabalho ou prova e receba uma sequência curta de aulas com plano salvo localmente.',
    cta: 'Montar meu plano',
    to: '/aulas/o-que-estudar',
    icon: <PiCompass aria-hidden="true" />,
    accent: 'ai',
  },
  {
    id: 'percurso-web',
    kicker: 'API Node, React e Tailwind',
    title: 'Percurso curto Web',
    description:
      'Cinco etapas objetivas de revisão, laboratório de falhas HTTP/CORS e missão prática com avaliação de evidências.',
    cta: 'Seguir percurso',
    to: '/percurso/api-react-tailwind',
    icon: <PiFlagCheckered aria-hidden="true" />,
  },
  {
    id: 'guias',
    kicker: 'Consulta direta com diagramas',
    title: 'Guias rápidos',
    description:
      'Resumos objetivos para revisar um conceito em minutos enquanto acompanha uma trilha ou se prepara para entrevistas.',
    cta: 'Explorar guias',
    to: '/guias',
    icon: <PiLightning aria-hidden="true" />,
  },
];

export default function StudyModes() {
  return (
    <section id="modos-de-estudo" className="home-section" aria-labelledby="modos-title">
      <header className="home-section-head">
        <p className="home-eyebrow">Formas de estudar</p>
        <h2 id="modos-title">Escolha como avançar hoje</h2>
        <p>
          Siga um curso completo do zero, transforme um enunciado em plano de estudo ou revise um
          conceito pontual sem precisar criar conta.
        </p>
      </header>
      <ul className="study-modes-grid">
        {modes.map((mode) => (
          <li key={mode.id}>
            <Link className="guide-tile" to={mode.to} data-accent={mode.accent}>
              <div className="guide-tile-top">
                <span className="guide-tile-icon">{mode.icon}</span>
                <span className="guide-tile-meta">{mode.kicker}</span>
              </div>
              <h3 className="guide-tile-title">{mode.title}</h3>
              <p className="guide-tile-summary">{mode.description}</p>
              <span className="guide-tile-foot">
                {mode.cta}
                <PiArrowRight aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
