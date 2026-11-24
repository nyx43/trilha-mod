import { resolveNarrationAssetUrl } from '../offline/audioPack';
import { NarrationVoiceId } from './types';
import catalog from './catalog.json';

export const NARRATED_LESSON_IDS = new Set<string>(catalog);

export const VOICE_OPTIONS: ReadonlyArray<{ id: NarrationVoiceId; label: string }> = [
  { id: 'santa', label: 'Santa (masculina)' },
  { id: 'dora', label: 'Dora (feminina)' },
];

export const DEFAULT_VOICE_ID: NarrationVoiceId = 'santa';

export function hasLessonNarration(lessonId: string | undefined): boolean {
  return Boolean(lessonId && NARRATED_LESSON_IDS.has(lessonId));
}

function getBaseUrl(): string {
  const metaEnv = (import.meta as { env?: { BASE_URL?: string } }).env;
  const base = metaEnv?.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function prefixBaseIfRelative(url: string): string {
  if (!url.startsWith('/narration/')) return url;
  return `${getBaseUrl()}${url.slice(1)}`;
}

export function getNarrationManifestUrl(lessonId: string): string {
  return prefixBaseIfRelative(resolveNarrationAssetUrl(`${lessonId}/manifest.json`));
}

export function getNarrationAudioUrl(lessonId: string, src: string): string {
  const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
  return prefixBaseIfRelative(resolveNarrationAssetUrl(`${lessonId}/${cleanSrc}`));
}
