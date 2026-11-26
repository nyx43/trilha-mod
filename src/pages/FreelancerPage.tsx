import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Review, ReviewCriterion, ReviewFields } from '../components/DeliveryReview';
import MainLayout from '../components/layouts/MainLayout';
import { bookingScenario } from '../freelancer/bookingScenario';
import { bookingPath, bookingSteps, maxNoteLength, useBookingDraft } from '../freelancer/progress';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';
import '../freelancer/freelancer.css';

function Note({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="freelancer-note">
      <label htmlFor={id}>
        <strong>{label}</strong>
      </label>
      <span id={`${id}-hint`}>{hint}</span>
      <textarea
        id={id}
        aria-describedby={`${id}-hint`}
        rows={4}
        required
        maxLength={maxNoteLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function DeliveryForm({
  criteria,
  review,
  onReview,
  submitted,
  note,
  noteLabel,
  noteHint,
  onNote,
  buttonLabel,
  onSubmit,
}: {
  criteria: readonly ReviewCriterion[];
  review: Review;
  onReview: (next: Review) => void;
  submitted: boolean;
  note: string;
  noteLabel: string;
  noteHint: string;
  onNote: (note: string) => void;
  buttonLabel: string;
  onSubmit: () => void;
}) {
  const [attempted, setAttempted] = useState(false);
  const missing = criteria.filter(({ id }) => {
    const entry = review[id];
    return !entry || entry.result === 'pending' || !entry.evidence.trim();
  });
  const adjustments = criteria.filter(({ id }) => review[id]?.result === 'adjustment');
  const error = !note.trim()
    ? `Preencha “${noteLabel}”.`
    : missing.length
    ? `Registre o resultado e a evidência para “${missing[0].title}”.`
    : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted) return;
    setAttempted(true);
    if (!error) onSubmit();
  }

  return (
    <form className="freelancer-form" noValidate onSubmit={submit}>
      <fieldset className="freelancer-fieldset" disabled={submitted}>
        <Note label={noteLabel} hint={noteHint} value={note} onChange={onNote} />
        <div className="freelancer-stack">
          <h2>Avaliação da entrega</h2>
          <p className="guide-text">
            Rode os testes no seu projeto. Em cada critério, indique o resultado e anote o que você
            conferiu. Se algo falhou, registre o ajuste necessário.
          </p>
          {!submitted && (
            <p className="guide-text" aria-live="polite">
              {criteria.length - missing.length} de {criteria.length} critérios com evidência
            </p>
          )}
          <ReviewFields criteria={criteria} value={review} onChange={onReview} showHints />
        </div>
      </fieldset>
      {submitted ? (
        <div className="freelancer-panel" role="status">
          <strong>Entrega registrada</strong>
          {adjustments.length === 1 && <p className="guide-text">Um critério precisa de ajuste.</p>}
          {adjustments.length > 1 && (
            <p className="guide-text">{adjustments.length} critérios precisam de ajuste.</p>
          )}
        </div>
      ) : (
        <>
          {attempted && error && <p role="alert">{error}</p>}
          <div>
            <button className="lesson-button" type="submit">
              {buttonLabel}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function ChangeExamples() {
  return (
    <div className="freelancer-stack">
      <h2>Casos para conferir</h2>
      <p className="guide-text">
        Comece cada teste com uma única reserva na Sala A, das 14:00 às 15:00, na mesma data.
      </p>
      <table className="freelancer-cases">
        <thead>
          <tr>
            <th scope="col">Nova reserva</th>
            <th scope="col">Antes</th>
            <th scope="col">Depois</th>
          </tr>
        </thead>
        <tbody>
          {bookingScenario.examples.map(({ reservation, before, after }) => (
            <tr key={reservation}>
              <th scope="row">{reservation}</th>
              <td>{before}</td>
              <td>{after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FreelancerPage() {
  const { etapa } = useParams();
  const navigate = useNavigate();
  const { draft, save, storageIssue } = useBookingDraft();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const currentIndex = bookingSteps.findIndex(({ id }) => id === etapa);
  const resumeIndex = bookingSteps.findIndex(({ id }) => id === draft.current);
  const unlockedIndex = Math.min(draft.completed, bookingSteps.length - 1);
  const step =
    currentIndex >= 0 && currentIndex <= unlockedIndex ? bookingSteps[currentIndex] : null;
  const submitted = draft.completed > currentIndex;
  const next = bookingSteps[currentIndex + 1];
  const previous = bookingSteps[currentIndex - 1];

  useEffect(() => {
    if (!step) return;
    document.title = `${step.title} · Simulação freelancer · Trilha Info`;
    titleRef.current?.focus({ preventScroll: true });
    titleRef.current?.scrollIntoView?.({ block: 'start' });
  }, [step]);

  useEffect(() => {
    if (step) save({ current: step.id });
  }, [step, save]);

  if (!step) {
    const destination =
      etapa === undefined
        ? bookingSteps[Math.min(resumeIndex, unlockedIndex)]
        : bookingSteps[unlockedIndex];
    return <Navigate to={`${bookingPath}/${destination.id}`} replace />;
  }

  function editStep(change: Parameters<typeof save>[0]) {
    return save(change, currentIndex);
  }

  function completeStep() {
    const registered = editStep({
      completed: currentIndex + 1,
      current: next?.id ?? 'entrega-final',
    });
    if (registered && next) navigate(`${bookingPath}/${next.id}`);
  }

  return (
    <MainLayout>
      <article className="guide-page freelancer-page">
        <nav className="guide-crumbs" aria-label="Você está em">
          <ol>
            <li>
              <Link to="/aulas">Aulas</Link>
            </li>
            <li>Simulação freelancer</li>
            <li>Agenda de salas</li>
          </ol>
        </nav>
        <header className="freelancer-heading">
          <p className="lesson-number">
            Agenda de salas · Etapa {currentIndex + 1} de {bookingSteps.length}
          </p>
          <h1 ref={titleRef} tabIndex={-1}>
            {step.title}
          </h1>
        </header>
        <nav aria-label="Etapas da simulação">
          <ol className="freelancer-steps">
            {bookingSteps.map(({ id, title }, index) => (
              <li key={id}>
                {index === currentIndex ? (
                  <span aria-current="step">{title}</span>
                ) : index <= unlockedIndex ? (
                  <Link to={`${bookingPath}/${id}`}>{title}</Link>
                ) : (
                  <span>
                    {title}
                    <span className="sr-only"> (ainda indisponível)</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {storageIssue && (
          <p role="alert">
            O navegador não conseguiu salvar seu progresso. Mantenha a simulação aberta para
            continuar.
          </p>
        )}

        {step.id === 'briefing' && (
          <section className="freelancer-stack" aria-labelledby="freelancer-request">
            <div className="freelancer-panel">
              <h2 id="freelancer-request">{bookingScenario.client}</h2>
              <blockquote>{bookingScenario.request}</blockquote>
            </div>
            <h2>Esclareça o pedido</h2>
            <ul className="freelancer-questions">
              {bookingScenario.questions.map(({ id, prompt, answer }) => {
                const asked = draft.asked.includes(id);
                return (
                  <li className="freelancer-panel" key={id}>
                    <button
                      type="button"
                      className="freelancer-question"
                      aria-expanded={asked}
                      aria-controls={`freelancer-answer-${id}`}
                      aria-disabled={asked}
                      onClick={() => {
                        if (!asked) editStep({ asked: [id] });
                      }}
                    >
                      {prompt}
                    </button>
                    <div id={`freelancer-answer-${id}`} aria-live="polite">
                      {asked && <p className="guide-text">{answer}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <form
              className="freelancer-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  !submitted &&
                  draft.agreement.trim() &&
                  draft.asked.length === bookingScenario.questions.length
                )
                  completeStep();
              }}
            >
              <fieldset className="freelancer-fieldset" disabled={submitted}>
                <Note
                  label="Combinados com o cliente"
                  hint="Explique quais dados são obrigatórios, quando há conflito e o que a equipe deve ver na agenda."
                  value={draft.agreement}
                  onChange={(agreement) => editStep({ agreement })}
                />
              </fieldset>
              {!submitted && (
                <div className="freelancer-stack">
                  <p className="guide-text">
                    Faça as quatro perguntas e registre o que ficou combinado para continuar.
                  </p>
                  <div>
                    <button
                      className="lesson-button"
                      type="submit"
                      disabled={
                        !draft.agreement.trim() ||
                        draft.asked.length < bookingScenario.questions.length
                      }
                    >
                      Confirmar escopo
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>
        )}

        {step.id === 'primeira-entrega' && (
          <section className="freelancer-stack" aria-labelledby="freelancer-first">
            <div className="freelancer-panel">
              <h2 id="freelancer-first">O que foi combinado</h2>
              <p className="freelancer-saved-note">{draft.agreement}</p>
            </div>
            <h2>Construa a agenda</h2>
            <ul className="guide-list">
              {bookingScenario.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="guide-text">
              Monte o projeto no seu computador. Se quiser seguir o caminho Web do Trilha, use React
              para a tela e Node.js com Express para a API.
            </p>
            <ul className="guide-list freelancer-references">
              <li>
                <Link to="/aula/node-e-express?trilha=fullstack">Node.js e Express</Link>
              </li>
              <li>
                <Link to="/aula/integracao-front-e-api?trilha=fullstack">
                  Integração entre frontend e API
                </Link>
              </li>
              <li>
                <Link to="/aula/testes-de-api?trilha=test">Testes de API</Link>
              </li>
            </ul>
            <DeliveryForm
              key={step.id}
              criteria={bookingScenario.criteria.initial}
              review={draft.initial}
              onReview={(initial) => editStep({ initial })}
              submitted={submitted}
              note={draft.project}
              noteLabel="Como rodar o projeto"
              noteHint="Anote como iniciar a aplicação e rodar os testes. Inclua o endereço do repositório se quiser."
              onNote={(project) => editStep({ project })}
              buttonLabel="Registrar primeira entrega"
              onSubmit={completeStep}
            />
          </section>
        )}

        {step.id === 'mudanca' && (
          <section className="freelancer-stack" aria-labelledby="freelancer-change">
            <div className="freelancer-panel">
              <h2 id="freelancer-change">Novo pedido do cliente</h2>
              <blockquote>{bookingScenario.changeRequest}</blockquote>
            </div>
            <ChangeExamples />
            <form
              className="freelancer-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!submitted && draft.impact.trim()) completeStep();
              }}
            >
              <fieldset className="freelancer-fieldset" disabled={submitted}>
                <Note
                  label="Impacto da mudança"
                  hint="Explique quais partes do projeto e quais testes mudam. Registre como você vai conferir as regras que continuam valendo."
                  value={draft.impact}
                  onChange={(impact) => editStep({ impact })}
                />
              </fieldset>
              {!submitted && (
                <div>
                  <button type="submit" className="lesson-button" disabled={!draft.impact.trim()}>
                    Confirmar mudança
                  </button>
                </div>
              )}
            </form>
          </section>
        )}

        {step.id === 'entrega-final' && (
          <section className="freelancer-stack" aria-labelledby="freelancer-final">
            <div className="freelancer-panel">
              <h2 id="freelancer-final">O que vai mudar</h2>
              <p className="freelancer-saved-note">{draft.impact}</p>
              <Link to={`${bookingPath}/mudanca`}>Consultar o novo pedido e os casos de teste</Link>
            </div>
            <DeliveryForm
              key={step.id}
              criteria={bookingScenario.criteria.revised}
              review={draft.revised}
              onReview={(revised) => editStep({ revised })}
              submitted={submitted}
              note={draft.message}
              noteLabel="Mensagem final ao cliente"
              noteHint="Explique o que você mudou, como conferiu os limites de horário e quais ajustes ficaram pendentes."
              onNote={(message) => editStep({ message })}
              buttonLabel="Registrar entrega final"
              onSubmit={completeStep}
            />
          </section>
        )}

        <nav className="freelancer-pager" aria-label="Navegação da simulação">
          {previous && (
            <Link className="lesson-button-quiet" to={`${bookingPath}/${previous.id}`}>
              Voltar para {previous.title.toLowerCase()}
            </Link>
          )}
          {submitted && next && (
            <Link className="lesson-button" to={`${bookingPath}/${next.id}`}>
              Ir para {next.title.toLowerCase()}
            </Link>
          )}
          {submitted && !next && (
            <Link className="lesson-button-quiet" to="/aulas">
              Voltar para aulas
            </Link>
          )}
        </nav>
      </article>
    </MainLayout>
  );
}
