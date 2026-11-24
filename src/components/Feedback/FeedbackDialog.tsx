import * as Dialog from '@radix-ui/react-dialog';
import { FormEvent, useState } from 'react';
import {
  PiBug,
  PiCheckCircle,
  PiChatCenteredText,
  PiLightbulb,
  PiStar,
  PiStarFill,
  PiX,
} from 'react-icons/pi';
import { useLocation } from 'react-router-dom';
import { isOfflineApp } from '../../runtime/mode';
import {
  createFeedbackReport,
  exportFeedbackReportsMarkdown,
  FEEDBACK_CATEGORY_LABELS,
  FeedbackCategory,
  FeedbackSubmissionResult,
  submitFeedbackReport,
} from '../../offline/feedback';
import { exportTextFile } from '../../offline/backup';
import '../Contribute/contribute.css';

export interface FeedbackDialogProps {
  triggerLabel?: string;
  triggerClassName?: string;
  lessonId?: string;
  lessonTitle?: string;
  courseId?: string;
  courseTitle?: string;
  sectionId?: string;
  defaultCategory?: FeedbackCategory;
}

const CATEGORY_OPTIONS: Array<{ id: FeedbackCategory; label: string; hint: string }> = [
  { id: 'bug', label: 'Bug', hint: 'Algo quebrou, travou ou está errado' },
  { id: 'melhoria', label: 'Melhoria', hint: 'Explicação, exercício ou UX para melhorar' },
  { id: 'avaliacao', label: 'Avaliação', hint: 'Nota e percepção sobre a aula ou matéria' },
];

export function FeedbackDialog({
  triggerLabel = 'Avaliar / relatar',
  triggerClassName = 'lesson-button-quiet',
  lessonId,
  lessonTitle,
  courseId,
  courseTitle,
  sectionId,
  defaultCategory = 'melhoria',
}: FeedbackDialogProps) {
  const location = useLocation();
  const offline = isOfflineApp();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<FeedbackSubmissionResult | null>(null);

  function resetForm() {
    setCategory(defaultCategory);
    setRating(0);
    setTitle('');
    setDescription('');
    setExcerpt('');
    setError('');
    setSending(false);
    setOutcome(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (title.trim().length < 3) {
      setError('Escreva um resumo curto com pelo menos 3 caracteres.');
      return;
    }
    if (description.trim().length < 5) {
      setError('Conte um pouco mais sobre o bug, melhoria ou avaliação.');
      return;
    }
    setError('');
    setSending(true);
    const report = createFeedbackReport({
      category,
      rating: rating || undefined,
      title,
      description,
      excerpt,
      context: {
        route: location.pathname + location.search,
        lessonId,
        lessonTitle,
        courseId,
        courseTitle,
        sectionId,
      },
    });
    const result = await submitFeedbackReport(report);
    setSending(false);
    setOutcome(result);
  }

  const contextLabel = lessonTitle || courseTitle || 'Geral do Trilha Mod';

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <Dialog.Trigger asChild>
        <button type="button" className={triggerClassName}>
          <PiChatCenteredText aria-hidden="true" />
          <span>{triggerLabel}</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="contribute-overlay" />
        <Dialog.Content className="contribute-dialog" aria-describedby="feedback-dialog-desc">
          {outcome ? (
            <div className="contribute-outcome" role="status">
              <PiCheckCircle aria-hidden="true" className="contribute-outcome-icon" />
              <Dialog.Title className="contribute-title">
                {outcome.status === 'sent' ? 'Enviado para o GitHub' : 'Relato salvo para análise'}
              </Dialog.Title>
              <Dialog.Description id="feedback-dialog-desc" className="contribute-lead">
                {outcome.message}
              </Dialog.Description>
              <div className="contribute-actions">
                {outcome.status === 'sent' && outcome.report.issueUrl ? (
                  <a
                    className="contribute-submit"
                    href={outcome.report.issueUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver Issue #{outcome.report.issueNumber} no GitHub
                  </a>
                ) : (
                  <a
                    className="contribute-submit"
                    href={outcome.prefilledUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir issue preenchida no GitHub
                  </a>
                )}
                <button
                  type="button"
                  className="contribute-secondary"
                  onClick={() =>
                    exportTextFile(
                      'trilha-mod-relatos.md',
                      exportFeedbackReportsMarkdown(),
                      'text/markdown;charset=utf-8',
                    )
                  }
                >
                  Exportar relatos (.md)
                </button>
                <button type="button" className="contribute-secondary" onClick={resetForm}>
                  Enviar outro relato
                </button>
              </div>
            </div>
          ) : (
            <form className="contribute-form" onSubmit={handleSubmit} noValidate>
              <header className="contribute-head">
                <p className="contribute-eyebrow">
                  {contextLabel} · {offline ? 'App offline' : 'Web'}
                </p>
                <Dialog.Title className="contribute-title">
                  Avaliar aula ou relatar problema
                </Dialog.Title>
                <Dialog.Description id="feedback-dialog-desc" className="contribute-lead">
                  {offline
                    ? 'Seu relato é estruturado com contexto da aula e salvo localmente para você exportar para os agentes ou abrir no GitHub quando conectar.'
                    : 'Seu relato é formatado com metadados da aula e enviado para o GitHub (issues do Trilha Mod) para análise por você e pelos agentes.'}
                </Dialog.Description>
              </header>

              <fieldset className="contribute-field" style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 600, marginBottom: 8 }}>Tipo</legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORY_OPTIONS.map((opt) => {
                    const active = category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        className={active ? 'contribute-submit' : 'contribute-secondary'}
                        onClick={() => setCategory(opt.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {opt.id === 'bug' ? (
                          <PiBug aria-hidden="true" />
                        ) : opt.id === 'melhoria' ? (
                          <PiLightbulb aria-hidden="true" />
                        ) : (
                          <PiStarFill aria-hidden="true" />
                        )}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="contribute-hint">
                  {CATEGORY_OPTIONS.find((opt) => opt.id === category)?.hint}
                </p>
              </fieldset>

              <div className="contribute-field">
                <span style={{ fontWeight: 600 }}>Nota (opcional, 1 a 5)</span>
                <div
                  style={{ display: 'flex', gap: 6, marginTop: 4 }}
                  role="group"
                  aria-label="Nota de 1 a 5 estrelas"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                      aria-pressed={rating === star}
                      className="contribute-secondary"
                      onClick={() => setRating((prev) => (prev === star ? 0 : star))}
                      style={{
                        padding: '6px 10px',
                        color: star <= rating ? '#facc15' : undefined,
                        borderColor: star <= rating ? '#facc15' : undefined,
                      }}
                    >
                      {star <= rating ? (
                        <PiStarFill aria-hidden="true" />
                      ) : (
                        <PiStar aria-hidden="true" />
                      )}
                    </button>
                  ))}
                  {rating > 0 && (
                    <span style={{ alignSelf: 'center', fontSize: '0.88rem', opacity: 0.85 }}>
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="contribute-field">
                <label htmlFor="feedback-title">Resumo curto</label>
                <input
                  id="feedback-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'Ex.: Exercício de SQL não valida SELECT com alias'
                      : category === 'melhoria'
                      ? 'Ex.: Faltou exemplo prático antes do quiz 2'
                      : 'Ex.: Explicação clara, mas o ritmo da seção 3 acelerou'
                  }
                  required
                />
              </div>

              <div className="contribute-field">
                <label htmlFor="feedback-description">
                  {FEEDBACK_CATEGORY_LABELS[category]} — detalhes
                </label>
                <textarea
                  id="feedback-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que aconteceu, o que você esperava ou o que gostaria de melhorar..."
                  required
                />
              </div>

              <div className="contribute-field">
                <label htmlFor="feedback-excerpt">Trecho, bloco ou exercício (opcional)</label>
                <input
                  id="feedback-excerpt"
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ex.: Seção 2, exercício de fila circular, clipe da voz Dora..."
                />
              </div>

              {error && (
                <p role="alert" className="contribute-error">
                  {error}
                </p>
              )}

              <div className="contribute-actions">
                <button type="submit" className="contribute-submit" disabled={sending}>
                  {sending
                    ? 'Enviando…'
                    : offline
                    ? 'Salvar relato offline'
                    : 'Enviar para o GitHub'}
                </button>
                <p>
                  Inclui automaticamente rota, aula, plataforma e versão de conteúdo para facilitar
                  a triagem pelos agentes.
                </p>
              </div>
            </form>
          )}
          <Dialog.Close className="contribute-close" aria-label="Fechar">
            <PiX aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
