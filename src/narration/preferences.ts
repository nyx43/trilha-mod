import { DEFAULT_VOICE_ID } from './registry';
import { NarrationPreferences, NarrationVoiceId } from './types';

export const NARRATION_PREFS_KEY = 'trilha-narration-prefs:v1';
export const NARRATION_POS_KEY = 'trilha-narration-pos:v1';

export const MIN_SPEED = 0.75;
export const MAX_SPEED = 2.0;
export const SPEED_STEP = 0.05;
export const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.35, 1.5, 1.75, 2.0] as const;

export const DEFAULT_PREFERENCES: NarrationPreferences = {
  voice: DEFAULT_VOICE_ID,
  speed: 1.0,
  trailSeconds: 2,
  pauseOnActivity: true,
  followScroll: true,
};

export interface SavedReadingPosition {
  clipId: string;
  timeSec: number;
  updatedAt: string;
}

export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PREFERENCES.speed;
  const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, value));
  return Math.round(clamped * 20) / 20;
}

export function clampTrail(value: number): 0 | 1 | 2 | 3 {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value >= 3) return 3;
  return 2;
}

export function formatSpeed(rate: number): string {
  return `${clampSpeed(rate).toFixed(2).replace('.', ',')}×`;
}

export function formatClock(ms: number): string {
  const safeSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(safeSec / 60);
  const sec = safeSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function isVoiceId(v: unknown): v is NarrationVoiceId {
  return v === 'santa' || v === 'dora';
}

export function loadNarrationPreferences(): NarrationPreferences {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_PREFERENCES;
    const raw = localStorage.getItem(NARRATION_PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<NarrationPreferences>;
    return {
      voice: isVoiceId(parsed.voice) ? parsed.voice : DEFAULT_PREFERENCES.voice,
      speed:
        typeof parsed.speed === 'number' ? clampSpeed(parsed.speed) : DEFAULT_PREFERENCES.speed,
      trailSeconds:
        typeof parsed.trailSeconds === 'number'
          ? clampTrail(parsed.trailSeconds)
          : DEFAULT_PREFERENCES.trailSeconds,
      pauseOnActivity:
        typeof parsed.pauseOnActivity === 'boolean'
          ? parsed.pauseOnActivity
          : DEFAULT_PREFERENCES.pauseOnActivity,
      followScroll:
        typeof parsed.followScroll === 'boolean'
          ? parsed.followScroll
          : DEFAULT_PREFERENCES.followScroll,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveNarrationPreferences(prefs: NarrationPreferences): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(NARRATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota or storage restriction errors
  }
}

export function loadReadingPosition(scopeKey: string): SavedReadingPosition | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(NARRATION_POS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, SavedReadingPosition>;
    const entry = map[scopeKey];
    if (!entry || typeof entry.clipId !== 'string' || typeof entry.timeSec !== 'number') {
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function saveReadingPosition(scopeKey: string, pos: SavedReadingPosition | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(NARRATION_POS_KEY);
    const map: Record<string, SavedReadingPosition> = raw ? JSON.parse(raw) : {};
    if (!pos) {
      delete map[scopeKey];
    } else {
      map[scopeKey] = pos;
    }
    localStorage.setItem(NARRATION_POS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage restriction errors
  }
}
