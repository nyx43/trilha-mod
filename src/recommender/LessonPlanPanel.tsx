import { Link } from 'react-router-dom';
import { Inline } from '../components/Guide/inline';
import { findLesson, lessonPlace, lessonUrl } from '../lessons';
import { githubDeliveryChecklist } from '../percurso/apiReactTailwind';
import type { LessonPlanStep, SavedLessonPlan } from './savedLessonPlan';

export function lessonPlanStepUrl({ lessonId, sectionId }: LessonPlanStep) {
  const target = lessonUrl(lessonId, lessonPlace(lessonId)?.course.id);
  return sectionId ? `${target}#${encodeURIComponent(sectionId)}` : target;
}

export function nextPendingPlanStep(plan: SavedLessonPlan): LessonPlanStep | undefined {
  return (
    plan.steps.find((step) => step.lessonId === plan.lastOpened && !step.done) ??
    plan.steps.find((step) => !step.done)
  );
}

export function LessonPlanPanel({
  plan,
  update,
  onClear,
}: {
  plan: SavedLessonPlan;
  update: (next: SavedLessonPlan) => void;
  onClear?: () => void;
}) {
  const doneCount = plan.steps.filter((step) => step.done).length;
  const totalCount = plan.steps.length;
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const next = nextPendingPlanStep(plan);
  const openStep = (step: LessonPlanStep) => update({ ...plan, lastOpened: step.lessonId });

  return (
    <section className="rec-results" id="meu-plano" aria-labelledby="rec-saved-plan-title">
      <div className="rec-results-header">
        <div>
          <h2 id="rec-saved-plan-title" className="lessons-modules-title" tabIndex={-1}>
            Meu plano de aulas
          </h2>
          <p className="guide-text">
            {doneCount} de {totalCount}{' '}
            {totalCount === 1 ? 'prática concluída' : 'práticas concluídas'} ({percent}%)
          </p>
        </div>
        <div className="rec-actions">
          {next ? (
            <Link
              className="lesson-button"
              to={lessonPlanStepUrl(next)}
              onClick={() => openStep(next)}
            >
              Retomar plano
            </Link>
          ) : (
            <p role="status">Você concluiu as práticas do plano.</p>
          )}
          {onClear && (
            <button type="button" className="lesson-button-quiet" onClick={onClear}>
              Remover plano
            </button>
          )}
        </div>
      </div>
      <div className="lesson-progress-bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol className="rec-list">
        {plan.steps.map((step) => {
          const lesson = findLesson(step.lessonId);
          const title = lesson?.title ?? step.lessonId;
          return (
            <li className="rec-card" key={step.lessonId} data-done={step.done || undefined}>
              <h3>{title}</h3>
              {step.sectionTitle && <p className="rec-section">{step.sectionTitle}</p>}
              <p className="rec-practice">
                <strong>Prática</strong> <Inline text={step.practiceAction} />
              </p>
              <p className="rec-reason">
                <strong>Como conferir</strong> <Inline text={step.successCriteria} />
              </p>
              <div className="rec-actions">
                <Link
                  className="lesson-button-quiet"
                  to={lessonPlanStepUrl(step)}
                  onClick={() => openStep(step)}
                >
                  Estudar {title}
                </Link>
                <label className="option-check">
                  <input
                    type="checkbox"
                    aria-label={`Prática concluída em ${title}`}
                    checked={step.done}
                    onChange={(event) => {
                      const done = event.target.checked;
                      update({
                        ...plan,
                        steps: plan.steps.map((item) => (item === step ? { ...item, done } : item)),
                      });
                    }}
                  />
                  Prática concluída
                </label>
              </div>
            </li>
          );
        })}
      </ol>
      {plan.deliveryChecklist && (
        <section className="rec-subblock" aria-labelledby="rec-plan-delivery">
          <h3 id="rec-plan-delivery" className="rec-subtitle">
            Checklist dos dois repositórios
          </h3>
          <ul className="guide-list">
            {githubDeliveryChecklist('com Tailwind').map((item) => (
              <li key={item}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
          <Link to="/percurso/api-react-tailwind/missao-final">
            Ver missão final do Percurso Web
          </Link>
        </section>
      )}
    </section>
  );
}
