import {
  FormEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  PiArrowsInSimple,
  PiArrowsOutSimple,
  PiChatCircleDots,
  PiGearSix,
  PiX,
} from 'react-icons/pi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Turnstile } from '../components/Contribute/Turnstile';
import type { LessonSection } from '../lessons/types';
import { lessonTutorContext } from './context';
import { useTutorSpeech } from './speech';
import { TutorSettings } from './TutorSettings';
import {
  tutorLimits,
  TutorMessage,
  tutorPath,
  TutorRequest,
  TutorStatus,
  tutorTurnstileAction,
} from './types';
import './tutor.css';

interface Props {
  title: string;
  summary: string;
  hook: string;
  sections: LessonSection[];
  suggestedSection?: string;
}

const emptyMessages: TutorMessage[] = [];
const prefsKey = 'trilha-lesson-tutor:v1';
const compact = { width: 416, height: 544 };
const expanded = { width: 736, height: 740 };

interface TutorPreferences {
  providerId?: string;
  modelId?: string;
  voiceUri?: string;
  size?: typeof compact;
}

function readPreferences(): TutorPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(prefsKey) || '{}') as TutorPreferences | null;
    return {
      providerId: typeof saved?.providerId === 'string' ? saved.providerId : undefined,
      modelId: typeof saved?.modelId === 'string' ? saved.modelId : undefined,
      voiceUri: typeof saved?.voiceUri === 'string' ? saved.voiceUri : undefined,
      size:
        typeof saved?.size?.width === 'number' && typeof saved.size.height === 'number'
          ? limitSize(saved.size.width, saved.size.height)
          : undefined,
    };
  } catch {
    return {};
  }
}

function limitSize(width: number, height: number) {
  return {
    width: Math.min(960, Math.max(300, width)),
    height: Math.min(1000, Math.max(350, height)),
  };
}

export function LessonTutor({ title, summary, hook, sections, suggestedSection }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(readPreferences);
  const [sectionChoice, setSectionChoice] = useState<string>();
  const [draft, setDraft] = useState('');
  const [conversation, setConversation] = useState<{
    providerId?: string;
    modelId?: string;
    messages: TutorMessage[];
  }>();
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [slowResponse, setSlowResponse] = useState(false);
  const [error, setError] = useState('');
  const [unseenReply, setUnseenReply] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; width: number; height: number }>();
  const launcher = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const latestReply = useRef<HTMLDivElement>(null);
  const scrollTarget = useRef<'question' | 'reply'>();
  const speech = useTutorSpeech(open);
  const stopSpeech = speech.stop;
  const close = useCallback(() => {
    stopSpeech();
    setTurnstileToken('');
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
  }, [stopSpeech]);
  const inFlight = useRef<AbortController>();
  const section = sections.find(({ id }) => id === (sectionChoice ?? suggestedSection));
  const provider =
    status?.providers.find(({ id }) => id === preferences.providerId) ?? status?.providers[0];
  const model =
    provider?.models?.find(({ id }) => id === preferences.modelId) ??
    provider?.models?.find(({ id }) => id === provider.defaultModel);
  const size = preferences.size ?? compact;
  const waitingForVerification = Boolean(status?.turnstileSiteKey && !turnstileToken);
  const isExpanded = size.width >= expanded.width || size.height >= expanded.height;
  const messages =
    conversation && conversation.providerId === provider?.id && conversation.modelId === model?.id
      ? conversation.messages
      : emptyMessages;

  useEffect(() => {
    if (!open) return;
    heading.current?.focus({ preventScroll: true });
    const controller = new AbortController();
    fetch(tutorPath, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((availability: Partial<TutorStatus> | null) => {
        if (!controller.signal.aborted) {
          setStatus({
            enabled: availability?.enabled === true,
            providers: availability?.providers ?? [],
            turnstileSiteKey: availability?.turnstileSiteKey,
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus({ enabled: false, providers: [] });
      });
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape' && container.current?.contains(document.activeElement)) {
        close();
      }
    }
    document.addEventListener('keydown', dismiss);
    return () => {
      controller.abort();
      document.removeEventListener('keydown', dismiss);
    };
  }, [open, close]);

  useEffect(() => () => inFlight.current?.abort(), []);

  useEffect(() => {
    try {
      localStorage.setItem(prefsKey, JSON.stringify(preferences));
    } catch {
      // Keep the current settings usable when the browser blocks storage.
    }
  }, [preferences]);

  function showLatestReply() {
    if (!log.current || !latestReply.current) return;
    log.current.scrollTop +=
      latestReply.current.getBoundingClientRect().top - log.current.getBoundingClientRect().top - 8;
    setUnseenReply(false);
  }

  useLayoutEffect(() => {
    const target = scrollTarget.current;
    if (!log.current || !target) return;
    scrollTarget.current = undefined;
    if (target === 'question') log.current.scrollTop = log.current.scrollHeight;
    else showLatestReply();
  }, [messages, pendingQuestion, open]);

  function resetConversation() {
    speech.stop();
    setConversation(undefined);
    setError('');
    setUnseenReply(false);
  }

  function changeModel(providerId: string, modelId?: string) {
    setPreferences((previous) => ({ ...previous, providerId, modelId }));
    resetConversation();
  }

  function resize(width: number, height: number) {
    setPreferences((previous) => ({ ...previous, size: limitSize(width, height) }));
  }

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    const bounds = panel.current?.getBoundingClientRect();
    if (!bounds || event.button !== 0) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      width: bounds.width,
      height: bounds.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function send(content: string, clearDraft: boolean) {
    const question = content.trim();
    if (!status?.enabled || !question || question.length > tutorLimits.question || inFlight.current)
      return;
    if (waitingForVerification) return;

    const controller = new AbortController();
    inFlight.current = controller;
    scrollTarget.current = 'question';
    setUnseenReply(false);
    setPendingQuestion(question);
    setSlowResponse(false);
    setError('');
    const slowTimer = window.setTimeout(() => {
      if (!controller.signal.aborted) setSlowResponse(true);
    }, 12_000);
    const userMessage: TutorMessage = { role: 'user', content: question };
    const input: TutorRequest = {
      provider: provider?.id,
      model: model?.id,
      context: lessonTutorContext(title, summary, hook, section),
      messages: [...messages.slice(-tutorLimits.history), userMessage],
      turnstileToken: status.turnstileSiteKey ? turnstileToken : undefined,
    };
    try {
      const response = await fetch(tutorPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok || typeof result?.reply !== 'string') {
        setError(result?.error || 'Não foi possível enviar. Tente novamente.');
        return;
      }
      const atLatest =
        !log.current ||
        log.current.scrollHeight - log.current.scrollTop - log.current.clientHeight < 32;
      if (atLatest) scrollTarget.current = 'reply';
      else setUnseenReply(true);
      setConversation({
        providerId: provider?.id,
        modelId: model?.id,
        messages: [...messages, userMessage, { role: 'assistant', content: result.reply }],
      });
      if (clearDraft) setDraft('');
    } catch {
      if (!controller.signal.aborted) {
        setError('Não foi possível enviar. Tente novamente.');
      }
    } finally {
      window.clearTimeout(slowTimer);
      if (status.turnstileSiteKey && !controller.signal.aborted) {
        setTurnstileToken('');
        setChallengeVersion((version) => version + 1);
      }
      inFlight.current = undefined;
      if (!controller.signal.aborted) setPendingQuestion('');
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    return send(draft, true);
  }

  return (
    <div className="lesson-tutor" ref={container}>
      <button
        ref={launcher}
        type="button"
        className="lesson-tutor-launcher"
        aria-label="Tutor da aula"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title="Tutor da aula"
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <PiX aria-hidden="true" /> : <PiChatCircleDots aria-hidden="true" />}
      </button>
      {open && (
        <section
          ref={panel}
          id={id}
          className="lesson-tutor-panel"
          style={{ width: size.width, height: status?.enabled ? size.height : undefined }}
          data-ready={status?.enabled === true}
          aria-labelledby={`${id}-title`}
        >
          <button
            type="button"
            className="lesson-tutor-resize"
            aria-label="Redimensionar o chat com as setas"
            title="Arraste para redimensionar"
            onPointerDown={startResize}
            onPointerMove={(event) => {
              if (!drag.current) return;
              const { x, y, width, height } = drag.current;
              resize(width + x - event.clientX, height + y - event.clientY);
            }}
            onLostPointerCapture={() => {
              drag.current = undefined;
            }}
            onKeyDown={(event) => {
              const delta: Record<string, [number, number]> = {
                ArrowLeft: [32, 0],
                ArrowRight: [-32, 0],
                ArrowUp: [0, 32],
                ArrowDown: [0, -32],
              };
              const step = delta[event.key];
              if (!step) return;
              event.preventDefault();
              const bounds = panel.current?.getBoundingClientRect();
              resize(
                (bounds?.width || size.width) + step[0],
                (bounds?.height || size.height) + step[1],
              );
            }}
          />
          <header className="lesson-tutor-header">
            <div>
              <h2 id={`${id}-title`} tabIndex={-1} ref={heading}>
                Tutor da aula
              </h2>
              {model && <p>{model.label}</p>}
            </div>
            <div className="lesson-tutor-header-actions">
              <button
                type="button"
                onClick={() =>
                  setPreferences((previous) => ({
                    ...previous,
                    size: isExpanded ? compact : expanded,
                  }))
                }
                aria-label={isExpanded ? 'Reduzir chat' : 'Ampliar chat'}
                title={isExpanded ? 'Reduzir chat' : 'Ampliar chat'}
              >
                {isExpanded ? (
                  <PiArrowsInSimple aria-hidden="true" />
                ) : (
                  <PiArrowsOutSimple aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="Configurações do tutor"
                title="Configurações do tutor"
                aria-expanded={settingsOpen}
                aria-controls={settingsOpen ? `${id}-settings` : undefined}
                onClick={() => setSettingsOpen((value) => !value)}
              >
                <PiGearSix aria-hidden="true" />
              </button>
            </div>
          </header>
          {settingsOpen && (
            <TutorSettings
              id={`${id}-settings`}
              providers={status?.providers ?? []}
              provider={provider}
              model={model}
              pending={!!pendingQuestion}
              voices={speech.voices}
              voiceUri={preferences.voiceUri}
              speechSupported={speech.supported}
              hosted={Boolean(status?.turnstileSiteKey)}
              onProvider={changeModel}
              onModel={(modelId) => provider && changeModel(provider.id, modelId)}
              onVoice={(voiceUri) => {
                speech.stop();
                setPreferences((previous) => ({ ...previous, voiceUri }));
              }}
            />
          )}
          {status === null && (
            <p className="lesson-tutor-notice" role="status">
              Verificando o tutor…
            </p>
          )}
          {status?.enabled === false && (
            <p className="lesson-tutor-notice" role="status">
              O tutor está indisponível neste ambiente.
            </p>
          )}
          {status?.enabled && (
            <>
              <div className="lesson-tutor-context">
                <label>
                  Seção
                  <select
                    value={section?.id ?? ''}
                    onChange={(event) => setSectionChoice(event.target.value)}
                    disabled={!!pendingQuestion}
                  >
                    <option value="">Visão geral da aula</option>
                    {sections.map(({ id, title }) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="lesson-tutor-log" ref={log} role="log" aria-label="Conversa">
                {!messages.length && (
                  <p className="lesson-tutor-intro">
                    O que ficou confuso? Conte onde você travou ou o que já tentou.
                  </p>
                )}
                {messages.map(({ role, content }, index) => (
                  <div
                    key={index}
                    className={`lesson-tutor-message lesson-tutor-${role}`}
                    ref={
                      role === 'assistant' && index === messages.length - 1
                        ? latestReply
                        : undefined
                    }
                  >
                    <span className="sr-only">{role === 'user' ? 'Você: ' : 'Tutor: '}</span>
                    {role === 'assistant' ? (
                      <>
                        {speech.supported && (
                          <button
                            type="button"
                            className="lesson-tutor-speech"
                            onClick={(event) => {
                              const reply = event.currentTarget
                                .nextElementSibling as HTMLElement | null;
                              speech.toggle(
                                index,
                                reply?.innerText || reply?.textContent || content,
                                preferences.voiceUri,
                              );
                            }}
                          >
                            {speech.playing === index ? 'Parar narração' : 'Ouvir resposta'}
                          </button>
                        )}
                        <div className="lesson-tutor-reply">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            skipHtml
                            disallowedElements={['a', 'img', 'input']}
                            unwrapDisallowed
                            components={{
                              table: ({ children }) => (
                                <div className="lesson-tutor-table">
                                  <table>{children}</table>
                                </div>
                              ),
                            }}
                          >
                            {content}
                          </ReactMarkdown>
                        </div>
                      </>
                    ) : (
                      content
                    )}
                  </div>
                ))}
                {pendingQuestion && (
                  <div className="lesson-tutor-message lesson-tutor-user">{pendingQuestion}</div>
                )}
              </div>
              <div className="lesson-tutor-compose">
                {unseenReply && (
                  <button className="lesson-tutor-jump" type="button" onClick={showLatestReply}>
                    Ir à última resposta
                  </button>
                )}
                {speech.speechError && <p role="status">{speech.speechError}</p>}
                {pendingQuestion && (
                  <p role="status">
                    {slowResponse
                      ? `${
                          model?.label ?? provider?.label ?? 'O tutor'
                        } ainda está preparando a resposta…`
                      : 'O tutor está preparando uma resposta…'}
                  </p>
                )}
                {error && <p role="alert">{error}</p>}
                {status.turnstileSiteKey && (
                  <Turnstile
                    key={challengeVersion}
                    siteKey={status.turnstileSiteKey}
                    action={tutorTurnstileAction}
                    onToken={setTurnstileToken}
                    compact
                  />
                )}
                <form onSubmit={submit}>
                  <label className="sr-only" htmlFor={`${id}-question`}>
                    Sua dúvida
                  </label>
                  <textarea
                    id={`${id}-question`}
                    placeholder="Escreva sua dúvida"
                    rows={2}
                    maxLength={tutorLimits.question}
                    value={draft}
                    readOnly={!!pendingQuestion}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        (event.ctrlKey || event.metaKey) &&
                        event.key === 'Enter' &&
                        !event.nativeEvent.isComposing &&
                        !event.repeat &&
                        !pendingQuestion &&
                        !waitingForVerification &&
                        draft.trim()
                      ) {
                        event.preventDefault();
                        send(draft, true);
                      }
                    }}
                    aria-describedby={`${id}-privacy`}
                  />
                  <div className="lesson-tutor-actions">
                    <button
                      type="button"
                      disabled={!!pendingQuestion || waitingForVerification}
                      onClick={() =>
                        send(
                          'Crie um exercício curto para eu praticar esta seção ou o conceito da minha última dúvida.',
                          false,
                        )
                      }
                    >
                      Pedir exercício
                    </button>
                    {messages.length > 0 && !pendingQuestion && (
                      <button type="button" onClick={resetConversation}>
                        Nova conversa
                      </button>
                    )}
                    <button
                      className="lesson-tutor-send"
                      type="submit"
                      disabled={!!pendingQuestion || waitingForVerification || !draft.trim()}
                    >
                      Enviar
                    </button>
                  </div>
                </form>
                <p className="lesson-tutor-privacy" id={`${id}-privacy`}>
                  {provider
                    ? `Ao enviar, o provedor ${provider.label} recebe a conversa e o trecho da aula.`
                    : 'Ao enviar, o provedor configurado recebe a conversa e o trecho da aula.'}
                </p>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
