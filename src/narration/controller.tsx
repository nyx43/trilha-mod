import {
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LessonContent, LessonMeta } from '../lessons/types';
import { extractLessonNarrationSpec } from './extractor';
import {
  clearAllCustomHighlights,
  clearDOMReadingMarkers,
  supportsCustomHighlights,
  syncClipHighlights,
} from './highlights';
import {
  SavedReadingPosition,
  clampSpeed,
  clampTrail,
  formatSpeed,
  loadNarrationPreferences,
  loadReadingPosition,
  saveNarrationPreferences,
  saveReadingPosition,
} from './preferences';
import { getNarrationAudioUrl, getNarrationManifestUrl, hasLessonNarration } from './registry';
import {
  NarrationClipManifest,
  NarrationClipSpec,
  NarrationLessonManifest,
  NarrationPreferences,
  NarrationVoiceId,
} from './types';

export type NarrationStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'unavailable'
  | 'error';

export type NarrationPauseReason = 'user' | 'activity' | null;
export type ClipAvailability = 'ready' | 'stale' | 'unavailable';

export interface NarrationContextValue {
  enabled: boolean;
  lessonId: string;
  scopeKey: string;
  hasMoreHiddenSections: boolean;
  manifestStatus: 'idle' | 'loading' | 'ready' | 'missing' | 'error';
  manifest: NarrationLessonManifest | null;
  availableVoices: NarrationVoiceId[];
  preferences: NarrationPreferences;
  highlightMode: 'word' | 'block';
  status: NarrationStatus;
  pauseReason: NarrationPauseReason;
  playbackMode: 'single' | 'queue';
  activeClipId: string | null;
  activeClipLabel: string | null;
  activeField: string | null;
  queueClipIds: string[];
  queueIndex: number;
  currentTimeMs: number;
  clipDurationMs: number;
  queueElapsedMs: number;
  queueTotalMs: number;
  statusMessage: string;
  savedPosition: SavedReadingPosition | null;
  staleClipCount: number;
  getClipAvailability: (clipId: string) => ClipAvailability;
  getClipSpec: (clipId: string) => NarrationClipSpec | undefined;
  playClip: (clipId: string, startSec?: number) => void;
  playQueueFrom: (startClipId?: string, startSec?: number) => void;
  resumeSavedPosition: () => void;
  togglePlayPause: () => void;
  resumeAfterActivity: () => void;
  repeatCurrentClip: () => void;
  stop: () => void;
  seekToMs: (ms: number) => void;
  setVoice: (voice: NarrationVoiceId) => void;
  setSpeed: (speed: number) => void;
  stepSpeed: (delta: number) => void;
  setTrailSeconds: (trail: 0 | 1 | 2 | 3) => void;
  setPauseOnActivity: (pause: boolean) => void;
}

const NarrationContext = createContext<NarrationContextValue | null>(null);

export function useNarrationOptional(): NarrationContextValue | null {
  return useContext(NarrationContext);
}

interface NarrationProviderProps {
  lesson: LessonMeta;
  content: LessonContent | null;
  containerRef: RefObject<HTMLElement>;
  scopeKey?: string;
  scopeSectionIds?: string[];
  hasMoreHiddenSections?: boolean;
  initialManifest?: NarrationLessonManifest | null;
  children: ReactNode;
}

export function NarrationProvider({
  lesson,
  content,
  containerRef,
  scopeKey: scopeKeyProp,
  scopeSectionIds,
  hasMoreHiddenSections = false,
  initialManifest,
  children,
}: NarrationProviderProps) {
  const scopeKey = scopeKeyProp ?? lesson.id;
  const enabled = hasLessonNarration(lesson.id);

  const spec = useMemo(() => {
    if (!content) {
      return {
        schemaVersion: 1 as const,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        clips: [],
        uncoveredBlocks: [],
      };
    }
    const raw = extractLessonNarrationSpec(lesson, content);
    if (!scopeSectionIds) return raw;
    const allowed = new Set(scopeSectionIds);
    const clips = raw.clips.filter(
      (c) => c.sectionId === 'hook' || c.sectionId === 'fechamento' || allowed.has(c.sectionId),
    );
    return { ...raw, clips };
  }, [lesson, content, scopeSectionIds]);

  const specById = useMemo(() => {
    const map = new Map<string, NarrationClipSpec>();
    for (const c of spec.clips) map.set(c.id, c);
    return map;
  }, [spec]);

  const [preferences, setPreferences] = useState<NarrationPreferences>(() =>
    loadNarrationPreferences(),
  );
  const [manifest, setManifest] = useState<NarrationLessonManifest | null>(initialManifest ?? null);
  const [manifestStatus, setManifestStatus] = useState<
    'idle' | 'loading' | 'ready' | 'missing' | 'error'
  >(initialManifest ? 'ready' : enabled ? 'loading' : 'idle');

  const [status, setStatus] = useState<NarrationStatus>(enabled ? 'idle' : 'unavailable');
  const [pauseReason, setPauseReason] = useState<NarrationPauseReason>(null);
  const [playbackMode, setPlaybackMode] = useState<'single' | 'queue'>('queue');
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [queueClipIds, setQueueClipIds] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [clipDurationMs, setClipDurationMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [savedPosition, setSavedPosition] = useState<SavedReadingPosition | null>(() =>
    enabled ? loadReadingPosition(scopeKey) : null,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    status,
    playbackMode,
    activeClipId,
    queueClipIds,
    queueIndex,
    preferences,
    manifest,
  });

  stateRef.current = {
    status,
    playbackMode,
    activeClipId,
    queueClipIds,
    queueIndex,
    preferences,
    manifest,
  };

  const manifestById = useMemo(() => {
    const map = new Map<string, NarrationClipManifest>();
    if (manifest) {
      for (const c of manifest.clips) map.set(c.id, c);
    }
    return map;
  }, [manifest]);

  const availableVoices = useMemo<NarrationVoiceId[]>(() => {
    if (!manifest) return [];
    return manifest.availableVoices;
  }, [manifest]);

  const activeVoice: NarrationVoiceId = useMemo(() => {
    if (availableVoices.length === 0) return preferences.voice;
    return availableVoices.includes(preferences.voice) ? preferences.voice : availableVoices[0];
  }, [availableVoices, preferences.voice]);

  const getClipAvailability = useCallback(
    (clipId: string): ClipAvailability => {
      if (!enabled || manifestStatus !== 'ready' || !manifest) return 'unavailable';
      const sc = specById.get(clipId);
      if (!sc) return 'unavailable';
      const mc = manifestById.get(clipId);
      if (!mc || mc.textHash !== sc.textHash) return 'stale';
      if (!mc.audio[activeVoice]) return 'unavailable';
      return 'ready';
    },
    [enabled, manifestStatus, manifest, specById, manifestById, activeVoice],
  );

  const staleClipCount = useMemo(() => {
    if (!enabled || manifestStatus !== 'ready') return 0;
    let count = 0;
    for (const sc of spec.clips) {
      if (getClipAvailability(sc.id) === 'stale') count += 1;
    }
    return count;
  }, [enabled, manifestStatus, spec.clips, getClipAvailability]);

  const stopAudioHardware = useCallback(() => {
    if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // Ignore in jsdom
      }
    }
    clearAllCustomHighlights();
    clearDOMReadingMarkers(containerRef.current);
  }, [containerRef]);

  // Load manifest when lesson is narrated
  useEffect(() => {
    if (initialManifest && initialManifest.lessonId === lesson.id) {
      setManifest(initialManifest);
      setManifestStatus('ready');
      setStatus('idle');
      return;
    }
    if (!enabled) {
      setManifest(null);
      setManifestStatus('idle');
      setStatus('unavailable');
      stopAudioHardware();
      setActiveClipId(null);
      setActiveField(null);
      setQueueClipIds([]);
      setQueueIndex(-1);
      setPauseReason(null);
      setStatusMessage('');
      return;
    }

    const ctrl = new AbortController();
    setManifestStatus('loading');
    setStatus('idle');
    setSavedPosition(loadReadingPosition(scopeKey));

    fetch(getNarrationManifestUrl(lesson.id), { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setManifestStatus('missing');
            setStatus('unavailable');
            return null;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<NarrationLessonManifest>;
      })
      .then((data) => {
        if (!data || ctrl.signal.aborted) return;
        setManifest(data);
        setManifestStatus('ready');
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setManifestStatus('error');
        setStatus('error');
        setStatusMessage(
          `Não foi possível carregar o índice de narração (${
            err instanceof Error ? err.message : 'erro'
          }).`,
        );
      });

    return () => {
      ctrl.abort();
      stopAudioHardware();
    };
  }, [lesson.id, scopeKey, enabled, initialManifest, stopAudioHardware]);

  // Ensure hardware stops cleanly if route/lesson unmounts
  useEffect(() => {
    return () => {
      stopAudioHardware();
    };
  }, [stopAudioHardware]);

  const paintAtMs = useCallback(
    (clipId: string | null, ms: number) => {
      const mc = clipId ? manifestById.get(clipId) : undefined;
      const va = mc?.audio[activeVoice];
      const words = va?.words ?? [];
      const result = syncClipHighlights({
        root: containerRef.current,
        clipId,
        words,
        nowMs: ms,
        trailSeconds: stateRef.current.preferences.trailSeconds,
      });
      setActiveField((prev) => (prev === result.activeField ? prev : result.activeField));
    },
    [manifestById, activeVoice, containerRef],
  );

  // Re-paint CSS highlights right after React renders a newly active diagram step/part
  useEffect(() => {
    if (status !== 'playing' || !activeClipId || !activeField) return;
    const ms = Math.round((audioRef.current?.currentTime || 0) * 1000);
    paintAtMs(activeClipId, ms);
  }, [activeField, activeClipId, status, paintAtMs]);

  const persistPosition = useCallback(
    (clipId: string | null, timeSec: number) => {
      if (!enabled || !clipId) return;
      const next: SavedReadingPosition = {
        clipId,
        timeSec: Math.max(0, Number(timeSec.toFixed(2))),
        updatedAt: new Date().toISOString(),
      };
      setSavedPosition(next);
      saveReadingPosition(scopeKey, next);
    },
    [enabled, scopeKey],
  );

  const discoverVisibleReadyQueue = useCallback((): string[] => {
    const root = containerRef.current;
    if (!root) {
      return spec.clips.filter((c) => getClipAvailability(c.id) === 'ready').map((c) => c.id);
    }
    const mounted = new Set<string>();
    root.querySelectorAll('[data-narration-clip]').forEach((el) => {
      const id = el.getAttribute('data-narration-clip');
      if (id) mounted.add(id);
    });
    return spec.clips
      .filter((c) => mounted.has(c.id) && getClipAvailability(c.id) === 'ready')
      .map((c) => c.id);
  }, [containerRef, spec.clips, getClipAvailability]);

  const startClipInternal = useCallback(
    (clipId: string, startSec = 0) => {
      const mc = manifestById.get(clipId);
      const avail = getClipAvailability(clipId);
      if (!mc || avail !== 'ready') {
        setStatusMessage(
          avail === 'stale'
            ? 'Este trecho foi editado após a geração do áudio e está aguardando regeneração.'
            : 'Áudio indisponível para este trecho.',
        );
        return;
      }

      const voiceAudio = mc.audio[activeVoice];
      if (!voiceAudio) return;

      // Cancel any Web Speech API utterance (e.g., from ScreenReader block) before starting narration
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }

      let audio = audioRef.current;
      if (!audio && typeof Audio !== 'undefined') {
        audio = new Audio();
        audio.preload = 'auto';
        audioRef.current = audio;
      }

      setActiveClipId(clipId);
      setClipDurationMs(voiceAudio.durationMs);
      setCurrentTimeMs(Math.max(0, Math.round(startSec * 1000)));
      setPauseReason(null);
      setStatus('playing');
      setStatusMessage(`Lendo: ${mc.label}`);
      persistPosition(clipId, startSec);

      // Scroll block gently into view when starting
      const root = containerRef.current;
      if (root && stateRef.current.preferences.followScroll) {
        const el = root.querySelector(
          `[data-narration-clip="${CSS?.escape ? CSS.escape(clipId) : clipId}"]`,
        ) as HTMLElement | null;
        if (el && typeof el.scrollIntoView === 'function') {
          try {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          } catch {
            // jsdom fallback
          }
        }
      }

      paintAtMs(clipId, startSec * 1000);

      if (!audio) return;

      const rate = stateRef.current.preferences.speed;
      audio.src = getNarrationAudioUrl(lesson.id, voiceAudio.src);
      audio.playbackRate = rate;
      audio.defaultPlaybackRate = rate;
      try {
        audio.currentTime = startSec;
      } catch {
        // Seek will apply after loadedmetadata if needed
      }

      const playResult = audio.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {
          // Browser autoplay block or offline error; reflect pause without crashing
          setStatus('paused');
          setPauseReason('user');
          setStatusMessage('Clique em reproduzir para iniciar o áudio neste navegador.');
        });
      }
    },
    [
      manifestById,
      getClipAvailability,
      activeVoice,
      persistPosition,
      containerRef,
      paintAtMs,
      lesson.id,
    ],
  );

  // Sync audio element events & rAF loop
  useEffect(() => {
    if (!enabled || typeof Audio === 'undefined') return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    const audio = audioRef.current;

    const tick = () => {
      const s = stateRef.current;
      if (s.status !== 'playing' || !s.activeClipId) {
        rafRef.current = null;
        return;
      }
      const ms = Math.round((audio.currentTime || 0) * 1000);
      setCurrentTimeMs(ms);
      paintAtMs(s.activeClipId, ms);
      rafRef.current = requestAnimationFrame(tick);
    };

    const onPlay = () => {
      if (rafRef.current === null && typeof requestAnimationFrame === 'function') {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onTimeUpdate = () => {
      const s = stateRef.current;
      if (!s.activeClipId) return;
      const ms = Math.round((audio.currentTime || 0) * 1000);
      setCurrentTimeMs(ms);
      paintAtMs(s.activeClipId, ms);
    };

    const onEnded = () => {
      if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const s = stateRef.current;
      const finishedId = s.activeClipId;
      const finishedSpec = finishedId ? specById.get(finishedId) : undefined;
      clearAllCustomHighlights();
      clearDOMReadingMarkers(containerRef.current);

      if (
        s.playbackMode === 'queue' &&
        s.queueIndex >= 0 &&
        s.queueIndex + 1 < s.queueClipIds.length
      ) {
        const nextIdx = s.queueIndex + 1;
        const nextId = s.queueClipIds[nextIdx];

        if (s.preferences.pauseOnActivity && finishedSpec?.pauseAfter) {
          setQueueIndex(nextIdx);
          setActiveClipId(finishedId);
          setCurrentTimeMs(clipDurationMs);
          setStatus('paused');
          setPauseReason('activity');
          setStatusMessage(
            'Pausado após a atividade. Resolva no seu ritmo e clique em Retomar leitura.',
          );
          persistPosition(nextId, 0);
          return;
        }

        setQueueIndex(nextIdx);
        startClipInternal(nextId, 0);
        return;
      }

      setStatus('ended');
      setPauseReason(null);
      setActiveField(null);
      if (s.playbackMode === 'queue') {
        setStatusMessage(
          hasMoreHiddenSections
            ? 'Leitura das seções abertas concluída. Use "Mostrar a aula inteira" ou abra a próxima seção para continuar.'
            : 'Leitura concluída.',
        );
        saveReadingPosition(scopeKey, null);
        setSavedPosition(null);
      } else {
        setStatusMessage('Trecho concluído.');
      }
    };

    const onError = () => {
      setStatus('error');
      setStatusMessage('Não foi possível reproduzir o arquivo de áudio deste trecho.');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [
    enabled,
    specById,
    containerRef,
    paintAtMs,
    startClipInternal,
    clipDurationMs,
    persistPosition,
    hasMoreHiddenSections,
    scopeKey,
  ]);

  const playClip = useCallback(
    (clipId: string, startSec = 0) => {
      setPlaybackMode('single');
      setQueueClipIds([clipId]);
      setQueueIndex(0);
      startClipInternal(clipId, startSec);
    },
    [startClipInternal],
  );

  const playQueueFrom = useCallback(
    (startClipId?: string, startSec = 0) => {
      const readyQueue = discoverVisibleReadyQueue();
      if (readyQueue.length === 0) {
        setStatusMessage(
          staleClipCount > 0
            ? 'Há trechos alterados sem áudio atualizado no momento.'
            : 'Nenhum trecho narrável disponível nas seções visíveis.',
        );
        return;
      }
      let startIdx = startClipId ? readyQueue.indexOf(startClipId) : 0;
      if (startIdx < 0) startIdx = 0;

      setPlaybackMode('queue');
      setQueueClipIds(readyQueue);
      setQueueIndex(startIdx);
      startClipInternal(readyQueue[startIdx], startSec);
    },
    [discoverVisibleReadyQueue, staleClipCount, startClipInternal],
  );

  const resumeSavedPosition = useCallback(() => {
    if (!savedPosition) {
      playQueueFrom();
      return;
    }
    const readyQueue = discoverVisibleReadyQueue();
    if (readyQueue.includes(savedPosition.clipId)) {
      playQueueFrom(savedPosition.clipId, savedPosition.timeSec);
    } else {
      playQueueFrom();
    }
  }, [savedPosition, discoverVisibleReadyQueue, playQueueFrom]);

  const resumeAfterActivity = useCallback(() => {
    if (queueIndex >= 0 && queueIndex < queueClipIds.length) {
      const targetId =
        pauseReason === 'activity'
          ? queueClipIds[queueIndex]
          : activeClipId ?? queueClipIds[queueIndex];
      startClipInternal(targetId, 0);
    }
  }, [queueIndex, queueClipIds, pauseReason, activeClipId, startClipInternal]);

  const togglePlayPause = useCallback(() => {
    if (status === 'playing') {
      const audio = audioRef.current;
      const curSec = audio ? audio.currentTime || 0 : currentTimeMs / 1000;
      audio?.pause();
      if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setStatus('paused');
      setPauseReason('user');
      setStatusMessage('Leitura pausada.');
      persistPosition(activeClipId, curSec);
      return;
    }

    if (status === 'paused' && pauseReason === 'activity') {
      resumeAfterActivity();
      return;
    }

    if (status === 'paused' && activeClipId && audioRef.current) {
      const audio = audioRef.current;
      audio.playbackRate = preferences.speed;
      audio.defaultPlaybackRate = preferences.speed;
      setStatus('playing');
      setPauseReason(null);
      setStatusMessage(`Lendo: ${manifestById.get(activeClipId)?.label ?? activeClipId}`);
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => setStatus('paused'));
      }
      return;
    }

    playQueueFrom();
  }, [
    status,
    pauseReason,
    activeClipId,
    currentTimeMs,
    preferences.speed,
    manifestById,
    persistPosition,
    resumeAfterActivity,
    playQueueFrom,
  ]);

  const repeatCurrentClip = useCallback(() => {
    if (activeClipId) {
      startClipInternal(activeClipId, 0);
    } else {
      playQueueFrom();
    }
  }, [activeClipId, startClipInternal, playQueueFrom]);

  const stop = useCallback(() => {
    const curSec = audioRef.current ? audioRef.current.currentTime || 0 : currentTimeMs / 1000;
    if (activeClipId && curSec > 0.2) {
      persistPosition(activeClipId, curSec);
    }
    stopAudioHardware();
    setStatus('idle');
    setPauseReason(null);
    setActiveField(null);
    setCurrentTimeMs(0);
    setStatusMessage('Leitura interrompida.');
  }, [activeClipId, currentTimeMs, persistPosition, stopAudioHardware]);

  const seekToMs = useCallback(
    (ms: number) => {
      if (!activeClipId) return;
      const bounded = Math.max(0, Math.min(ms, clipDurationMs));
      const sec = bounded / 1000;
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = sec;
        } catch {
          // Ignore seek errors on unloaded media
        }
      }
      setCurrentTimeMs(bounded);
      paintAtMs(activeClipId, bounded);
      persistPosition(activeClipId, sec);
    },
    [activeClipId, clipDurationMs, paintAtMs, persistPosition],
  );

  const updatePreferences = useCallback(
    (updater: (prev: NarrationPreferences) => NarrationPreferences) => {
      setPreferences((prev) => {
        const next = updater(prev);
        saveNarrationPreferences(next);
        return next;
      });
    },
    [],
  );

  const setVoice = useCallback(
    (voice: NarrationVoiceId) => {
      if (availableVoices.length > 0 && !availableVoices.includes(voice)) return;
      if (voice === activeVoice) return;
      if (status === 'playing' || status === 'paused') stop();
      updatePreferences((prev) => ({ ...prev, voice }));
    },
    [activeVoice, availableVoices, status, stop, updatePreferences],
  );

  const setSpeed = useCallback(
    (speed: number) => {
      const nextRate = clampSpeed(speed);
      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
        audioRef.current.defaultPlaybackRate = nextRate;
      }
      updatePreferences((prev) => ({ ...prev, speed: nextRate }));
      setStatusMessage(`Velocidade ajustada para ${formatSpeed(nextRate)}.`);
    },
    [updatePreferences],
  );

  const stepSpeed = useCallback(
    (delta: number) => {
      setSpeed(stateRef.current.preferences.speed + delta);
    },
    [setSpeed],
  );

  const setTrailSeconds = useCallback(
    (trail: 0 | 1 | 2 | 3) => {
      const nextTrail = clampTrail(trail);
      updatePreferences((prev) => ({ ...prev, trailSeconds: nextTrail }));
    },
    [updatePreferences],
  );

  const setPauseOnActivity = useCallback(
    (pauseOnActivity: boolean) => {
      updatePreferences((prev) => ({ ...prev, pauseOnActivity }));
    },
    [updatePreferences],
  );

  // Global keyboard shortcuts matching preview UX when not typing inside inputs/textareas
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === '[') {
        event.preventDefault();
        stepSpeed(-0.05);
      } else if (event.key === ']') {
        event.preventDefault();
        stepSpeed(0.05);
      } else if (event.key === '\\') {
        event.preventDefault();
        setSpeed(1.0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, stepSpeed, setSpeed]);

  const { queueElapsedMs, queueTotalMs } = useMemo(() => {
    if (!manifest || queueClipIds.length === 0) {
      return { queueElapsedMs: currentTimeMs, queueTotalMs: clipDurationMs };
    }
    let total = 0;
    let before = 0;
    queueClipIds.forEach((cid, i) => {
      const dur = manifestById.get(cid)?.audio[activeVoice]?.durationMs ?? 0;
      if (i < queueIndex) before += dur;
      total += dur;
    });
    return {
      queueElapsedMs: before + (pauseReason === 'activity' ? 0 : currentTimeMs),
      queueTotalMs: total,
    };
  }, [
    manifest,
    manifestById,
    queueClipIds,
    queueIndex,
    activeVoice,
    pauseReason,
    currentTimeMs,
    clipDurationMs,
  ]);

  const value: NarrationContextValue = {
    enabled,
    lessonId: lesson.id,
    scopeKey,
    hasMoreHiddenSections,
    manifestStatus,
    manifest,
    availableVoices,
    preferences: { ...preferences, voice: activeVoice },
    highlightMode: supportsCustomHighlights() ? 'word' : 'block',
    status,
    pauseReason,
    playbackMode,
    activeClipId,
    activeClipLabel: activeClipId
      ? manifestById.get(activeClipId)?.label ?? specById.get(activeClipId)?.label ?? null
      : null,
    activeField,
    queueClipIds,
    queueIndex,
    currentTimeMs,
    clipDurationMs,
    queueElapsedMs,
    queueTotalMs,
    statusMessage,
    savedPosition,
    staleClipCount,
    getClipAvailability,
    getClipSpec: (id) => specById.get(id),
    playClip,
    playQueueFrom,
    resumeSavedPosition,
    togglePlayPause,
    resumeAfterActivity,
    repeatCurrentClip,
    stop,
    seekToMs,
    setVoice,
    setSpeed,
    stepSpeed,
    setTrailSeconds,
    setPauseOnActivity,
  };

  return <NarrationContext.Provider value={value}>{children}</NarrationContext.Provider>;
}
