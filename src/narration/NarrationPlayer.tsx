import { useEffect, useId, useRef } from 'react';
import { useNarrationOptional } from './controller';
import './narration.css';
import {
  MAX_SPEED,
  MIN_SPEED,
  SPEED_PRESETS,
  SPEED_STEP,
  clampTrail,
  formatClock,
  formatSpeed,
} from './preferences';
import { VOICE_OPTIONS } from './registry';
import { NarrationVoiceId } from './types';

export function NarrationPlayer() {
  const narration = useNarrationOptional();
  const speedDetailsRef = useRef<HTMLDetailsElement | null>(null);
  const baseId = useId();
  const voiceId = `${baseId}-voice`;
  const speedRangeId = `${baseId}-speed`;
  const trailId = `${baseId}-trail`;
  const pauseId = `${baseId}-pause`;
  const seekId = `${baseId}-seek`;

  // Close speed menu on outside click or Escape
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const el = speedDetailsRef.current;
      if (el && el.open && !el.contains(event.target as Node)) {
        el.open = false;
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && speedDetailsRef.current?.open) {
        speedDetailsRef.current.open = false;
      }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!narration || !narration.enabled || narration.manifestStatus === 'missing') {
    return null;
  }

  if (narration.manifestStatus === 'loading' || narration.manifestStatus === 'idle') {
    return (
      <section className="narration-bar" aria-label="Narração da aula">
        <p className="narration-status" role="status" aria-live="polite">
          Carregando narração sincronizada…
        </p>
      </section>
    );
  }

  if (narration.manifestStatus === 'error') {
    return (
      <section className="narration-bar narration-bar--error" aria-label="Narração da aula">
        <p className="narration-status" role="status" aria-live="polite">
          {narration.statusMessage || 'Narração indisponível no momento.'}
        </p>
      </section>
    );
  }

  const {
    status,
    pauseReason,
    playbackMode,
    hasMoreHiddenSections,
    availableVoices,
    preferences,
    highlightMode,
    activeClipId,
    activeClipLabel,
    queueClipIds,
    queueIndex,
    currentTimeMs,
    clipDurationMs,
    queueElapsedMs,
    queueTotalMs,
    statusMessage,
    savedPosition,
    staleClipCount,
  } = narration;

  const isPlaying = status === 'playing';
  const isPausedByUser = status === 'paused' && pauseReason === 'user';
  const isPausedByActivity = status === 'paused' && pauseReason === 'activity';

  const queuePrimaryLabel = isPausedByActivity
    ? 'Retomar leitura'
    : isPlaying
    ? 'Pausar leitura'
    : isPausedByUser
    ? 'Continuar leitura'
    : hasMoreHiddenSections
    ? 'Ouvir seções abertas'
    : 'Ouvir aula inteira';

  const handlePrimaryClick = () => {
    if (isPausedByActivity) {
      narration.resumeAfterActivity();
    } else if (isPlaying || isPausedByUser) {
      narration.togglePlayPause();
    } else {
      narration.playQueueFrom();
    }
  };

  return (
    <section
      className="narration-bar"
      aria-label="Controles de narração da aula"
      data-narration-status={status}
      data-narration-highlight-mode={highlightMode}
    >
      <div className="narration-row narration-row--main">
        <div className="narration-actions">
          <button
            type="button"
            className="narration-btn narration-btn--primary"
            onClick={handlePrimaryClick}
            aria-pressed={isPlaying}
          >
            {queuePrimaryLabel}
          </button>

          {!isPlaying && !isPausedByActivity && savedPosition && (
            <button type="button" className="narration-btn" onClick={narration.resumeSavedPosition}>
              Retomar posição
            </button>
          )}

          {activeClipId && (
            <>
              <button type="button" className="narration-btn" onClick={narration.repeatCurrentClip}>
                Repetir trecho
              </button>
              <button type="button" className="narration-btn" onClick={narration.stop}>
                Parar
              </button>
            </>
          )}
        </div>

        <div className="narration-settings">
          <label className="narration-field" htmlFor={voiceId}>
            <span className="narration-field-label">Voz</span>
            <select
              id={voiceId}
              name="narrationVoice"
              aria-label="Voz da narração"
              className="narration-select"
              value={preferences.voice}
              onChange={(e) => narration.setVoice(e.target.value as NarrationVoiceId)}
            >
              {VOICE_OPTIONS.map((v) => {
                const enabledVoice = availableVoices.includes(v.id);
                return (
                  <option key={v.id} value={v.id} disabled={!enabledVoice}>
                    {enabledVoice ? v.label : `${v.label} (em breve)`}
                  </option>
                );
              })}
            </select>
          </label>

          <details ref={speedDetailsRef} className="narration-speed-menu">
            <summary className="narration-btn narration-speed-trigger">
              Velocidade: <strong>{formatSpeed(preferences.speed)}</strong>
            </summary>
            <div className="narration-speed-popover" role="group" aria-label="Ajuste de velocidade">
              <div className="narration-speed-header">
                <label htmlFor={speedRangeId}>Velocidade de leitura</label>
                <strong>{formatSpeed(preferences.speed)}</strong>
              </div>

              <div className="narration-speed-slider-row">
                <button
                  type="button"
                  className="narration-step-btn"
                  onClick={() => narration.stepSpeed(-SPEED_STEP)}
                  aria-label="Diminuir velocidade em 0,05×"
                  disabled={preferences.speed <= MIN_SPEED}
                >
                  −0,05×
                </button>
                <input
                  id={speedRangeId}
                  name="narrationSpeed"
                  type="range"
                  aria-label="Velocidade da narração"
                  className="narration-range"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  step={SPEED_STEP}
                  value={preferences.speed}
                  onChange={(e) => narration.setSpeed(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="narration-step-btn"
                  onClick={() => narration.stepSpeed(SPEED_STEP)}
                  aria-label="Aumentar velocidade em 0,05×"
                  disabled={preferences.speed >= MAX_SPEED}
                >
                  +0,05×
                </button>
              </div>

              <div className="narration-speed-presets">
                {SPEED_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`narration-chip ${
                      Math.abs(preferences.speed - preset) < 0.001 ? 'is-active' : ''
                    }`}
                    onClick={() => narration.setSpeed(preset)}
                    aria-pressed={Math.abs(preferences.speed - preset) < 0.001}
                  >
                    {formatSpeed(preset)}
                  </button>
                ))}
              </div>

              <p className="narration-speed-shortcuts">
                Atalhos: <kbd>[</kbd> diminuir · <kbd>]</kbd> aumentar · <kbd>\</kbd> 1,00×
              </p>
            </div>
          </details>

          <label className="narration-field" htmlFor={trailId}>
            <span className="narration-field-label">Rastro</span>
            <select
              id={trailId}
              name="narrationTrail"
              aria-label="Duração do rastro de palavras"
              className="narration-select"
              value={preferences.trailSeconds}
              onChange={(e) => narration.setTrailSeconds(clampTrail(Number(e.target.value)))}
            >
              <option value={0}>Desligado</option>
              <option value={1}>1 segundo</option>
              <option value={2}>2 segundos</option>
              <option value={3}>3 segundos</option>
            </select>
          </label>

          <label className="narration-check" htmlFor={pauseId}>
            <input
              id={pauseId}
              name="narrationPauseOnActivity"
              type="checkbox"
              checked={preferences.pauseOnActivity}
              onChange={(e) => narration.setPauseOnActivity(e.target.checked)}
            />
            <span>Pausar em atividades</span>
          </label>
        </div>
      </div>

      {activeClipId && (
        <div className="narration-row narration-row--progress">
          <input
            id={seekId}
            name="narrationSeek"
            type="range"
            className="narration-seek"
            aria-label="Posição no trecho atual"
            min={0}
            max={Math.max(1, clipDurationMs)}
            disabled={isPausedByActivity}
            value={Math.min(currentTimeMs, clipDurationMs)}
            onChange={(e) => narration.seekToMs(Number(e.target.value))}
          />
          <div className="narration-meta">
            <span className="narration-clock">
              {formatClock(currentTimeMs)} / {formatClock(clipDurationMs)}
            </span>
            {playbackMode === 'queue' && queueClipIds.length > 1 && (
              <span className="narration-queue-pos">
                Trecho {queueIndex + 1} de {queueClipIds.length} ({formatClock(queueElapsedMs)} /{' '}
                {formatClock(queueTotalMs)})
              </span>
            )}
            {activeClipLabel && <span className="narration-clip-name">{activeClipLabel}</span>}
          </div>
        </div>
      )}

      <div className="narration-row narration-row--footer">
        <p className="narration-status" role="status" aria-live="polite">
          {statusMessage ||
            (hasMoreHiddenSections
              ? 'Pronto para narrar as seções abertas. Abra a aula inteira para ouvir tudo.'
              : 'Pronto para narrar toda a aula com destaque por palavra.')}
        </p>

        {highlightMode === 'block' && (
          <span className="narration-badge">Destaque por bloco ativo</span>
        )}

        {staleClipCount > 0 && (
          <span className="narration-badge narration-badge--warn">
            {staleClipCount}{' '}
            {staleClipCount === 1
              ? 'trecho alterado aguarda regeneração'
              : 'trechos alterados aguardam regeneração'}
          </span>
        )}
      </div>
    </section>
  );
}

interface NarrationBlockButtonProps {
  clipId?: string;
  label?: string;
}

export function NarrationBlockButton({
  clipId,
  label = 'Ouvir parágrafo',
}: NarrationBlockButtonProps) {
  const narration = useNarrationOptional();
  if (!narration || !clipId || !narration.enabled || narration.manifestStatus !== 'ready') {
    return null;
  }

  const avail = narration.getClipAvailability(clipId);
  if (avail === 'unavailable') return null;

  if (avail === 'stale') {
    return (
      <button
        type="button"
        className="narration-block-btn narration-block-btn--stale"
        disabled
        data-narration-trigger={clipId}
        title="Texto editado desde a última geração do áudio. Regenere este trecho para ouvir."
      >
        Áudio desatualizado
      </button>
    );
  }

  const isCurrent = narration.activeClipId === clipId;
  const isPlayingThis = isCurrent && narration.status === 'playing';
  const isPausedThis =
    isCurrent && narration.status === 'paused' && narration.pauseReason === 'user';

  const text = isPlayingThis ? 'Pausar' : isPausedThis ? 'Continuar' : label;

  const handleClick = () => {
    if (isPlayingThis || isPausedThis) {
      narration.togglePlayPause();
    } else {
      narration.playClip(clipId);
    }
  };

  return (
    <button
      type="button"
      className={`narration-block-btn ${isCurrent ? 'is-active' : ''}`}
      data-narration-trigger={clipId}
      aria-pressed={isPlayingThis}
      onClick={handleClick}
    >
      {text}
    </button>
  );
}
