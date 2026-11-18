export type NarrationVoiceId = 'dora' | 'alex' | 'santa';

export type NarrationBlockKind =
  | 'header'
  | 'hook'
  | 'section-heading'
  | 'prose'
  | 'analogy'
  | 'callout'
  | 'list'
  | 'steps'
  | 'terms'
  | 'table'
  | 'checklist'
  | 'code-caption'
  | 'code-tabs-caption'
  | 'flow'
  | 'anatomy'
  | 'quiz'
  | 'classify'
  | 'fill'
  | 'order'
  | 'terminal'
  | 'playground'
  | 'reveal'
  | 'activity-feedback'
  | 'revealed-answer'
  | 'cards'
  | 'visual'
  | 'fechamento-heading'
  | 'fechamento-recap'
  | 'fechamento-card'
  | 'fechamento-mission';

export interface NarrationField {
  /** Field identifier inside the clip (e.g. 'text', 'title', 'step:0:title', 'part:0:label'). */
  field: string;
  /** Visible plain text matching DOM textContent for [data-narration-field=field]. */
  text: string;
  /** Raw source text before plain() stripping inline markdown. */
  raw?: string;
}

export interface NarrationClipSpec {
  id: string;
  sectionId: string;
  kind: NarrationBlockKind;
  blockIndex: number;
  blockType?: string;
  fields: NarrationField[];
  canonicalText: string;
  textHash: string;
  pauseAfter?: boolean;
  onDemand?: boolean;
  interactiveKind?: 'flow' | 'anatomy' | 'trace';
  label: string;
}

export interface NarrationUncoveredBlock {
  sectionId: string;
  blockIndex: number;
  blockType: string;
  reason: string;
}

export interface NarrationLessonScript {
  schemaVersion: 1;
  lessonId: string;
  lessonTitle: string;
  clips: NarrationClipSpec[];
  uncoveredBlocks: NarrationUncoveredBlock[];
}

export interface NarrationWordTiming {
  field: string;
  /** UTF-16 start offset within the plain text of `field`. */
  from: number;
  /** UTF-16 end offset within the plain text of `field` (exclusive). */
  to: number;
  /** Start time in milliseconds relative to this clip's audio start. */
  startMs: number;
  /** End time in milliseconds relative to this clip's audio start. */
  endMs: number;
}

export interface NarrationVoiceAudio {
  /** Path relative to /narration/<lessonId>/ (e.g. 'dora/hook.mp3'). */
  src: string;
  durationMs: number;
  bytes: number;
  sampleRate: number;
  words: NarrationWordTiming[];
  normalizedScript?: string;
}

export interface NarrationClipManifest {
  id: string;
  sectionId: string;
  kind: NarrationBlockKind;
  label: string;
  textHash: string;
  clipKey: string;
  pauseAfter?: boolean;
  interactiveKind?: 'flow' | 'anatomy' | 'trace';
  audio: Partial<Record<NarrationVoiceId, NarrationVoiceAudio>>;
}

export interface NarrationLessonManifest {
  schemaVersion: 1;
  lessonId: string;
  lessonTitle: string;
  generatorVersion: string;
  lexiconVersion: string;
  defaultVoice: NarrationVoiceId;
  availableVoices: NarrationVoiceId[];
  generatedAt: string;
  totalDurationMs: Partial<Record<NarrationVoiceId, number>>;
  totalBytes: Partial<Record<NarrationVoiceId, number>>;
  clips: NarrationClipManifest[];
  uncoveredBlocks: NarrationUncoveredBlock[];
}

export interface NarrationPreferences {
  voice: NarrationVoiceId;
  speed: number;
  trailSeconds: 0 | 1 | 2 | 3;
  pauseOnActivity: boolean;
  followScroll: boolean;
}
