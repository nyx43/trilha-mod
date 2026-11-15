import { NarrationWordTiming } from './types';

interface HighlightRegistryLike {
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
}

type HighlightCtor = new (...ranges: Range[]) => unknown;

function getHighlightRuntime(): {
  registry: HighlightRegistryLike;
  HighlightClass: HighlightCtor;
} | null {
  const g = globalThis as {
    CSS?: { highlights?: HighlightRegistryLike };
    Highlight?: HighlightCtor;
  };
  if (!g.CSS?.highlights || typeof g.Highlight !== 'function') return null;
  return { registry: g.CSS.highlights, HighlightClass: g.Highlight };
}

const HIGHLIGHT_NAMES = [
  'narr-current',
  'narr-trail-new',
  'narr-trail-mid',
  'narr-trail-old',
] as const;

export function supportsCustomHighlights(): boolean {
  return getHighlightRuntime() !== null;
}

export function clearAllCustomHighlights(): void {
  const rt = getHighlightRuntime();
  if (!rt) return;
  for (const name of HIGHLIGHT_NAMES) {
    rt.registry.delete(name);
  }
}

export function clearDOMReadingMarkers(root: ParentNode | null | undefined): void {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('[data-narration-reading]').forEach((el) => {
    el.removeAttribute('data-narration-reading');
    el.removeAttribute('data-narration-active-field');
  });
}

function collectTextNodes(el: HTMLElement): Array<{ node: Text; start: number; end: number }> {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const segments: Array<{ node: Text; start: number; end: number }> = [];
  let cursor = 0;
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const len = textNode.data.length;
    if (len > 0) {
      segments.push({ node: textNode, start: cursor, end: cursor + len });
      cursor += len;
    }
    current = walker.nextNode();
  }
  return segments;
}

export function resolveUtf16RangeInElement(
  el: HTMLElement,
  u16From: number,
  u16To: number,
): Range | null {
  if (u16From < 0 || u16To <= u16From) return null;
  const segments = collectTextNodes(el);
  if (segments.length === 0) return null;

  const totalLen = segments[segments.length - 1].end;
  if (u16From >= totalLen) return null;
  const safeTo = Math.min(u16To, totalLen);

  let startSeg: { node: Text; start: number; end: number } | null = null;
  let endSeg: { node: Text; start: number; end: number } | null = null;

  for (const seg of segments) {
    if (!startSeg && u16From < seg.end) {
      startSeg = seg;
    }
    if (safeTo <= seg.end) {
      endSeg = seg;
      break;
    }
  }

  if (!startSeg || !endSeg) return null;

  try {
    const range = el.ownerDocument.createRange();
    range.setStart(startSeg.node, Math.max(0, u16From - startSeg.start));
    range.setEnd(endSeg.node, Math.max(0, safeTo - endSeg.start));
    return range;
  } catch {
    return null;
  }
}

export function findActiveWordIndex(words: NarrationWordTiming[], nowMs: number): number {
  if (words.length === 0 || nowMs < 0) return -1;

  // Exact hit first
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    if (nowMs >= w.startMs && nowMs <= w.endMs) {
      return i;
    }
  }

  // Bridge micro-gaps (< 140ms) between adjacent spoken words in same flow
  for (let i = words.length - 1; i >= 0; i -= 1) {
    const w = words[i];
    if (nowMs > w.endMs) {
      const next = words[i + 1];
      const gap = next ? next.startMs - w.endMs : 0;
      if (nowMs - w.endMs <= 140 && (!next || gap <= 200)) {
        return i;
      }
      return -1;
    }
  }

  return -1;
}

export interface HighlightSyncResult {
  activeWordIndex: number;
  activeField: string | null;
  mode: 'word' | 'block';
}

export function syncClipHighlights(params: {
  root: ParentNode | null;
  clipId: string | null;
  words: NarrationWordTiming[];
  nowMs: number;
  trailSeconds: 0 | 1 | 2 | 3;
}): HighlightSyncResult {
  const { root, clipId, words, nowMs, trailSeconds } = params;
  clearDOMReadingMarkers(root);
  clearAllCustomHighlights();

  if (!root || !clipId) {
    return {
      activeWordIndex: -1,
      activeField: null,
      mode: supportsCustomHighlights() ? 'word' : 'block',
    };
  }

  const clipEl = root.querySelector(
    `[data-narration-clip="${CSS?.escape ? CSS.escape(clipId) : clipId}"]`,
  ) as HTMLElement | null;
  if (!clipEl) {
    return {
      activeWordIndex: -1,
      activeField: null,
      mode: supportsCustomHighlights() ? 'word' : 'block',
    };
  }

  const activeIdx = findActiveWordIndex(words, nowMs);
  const activeField = activeIdx >= 0 ? words[activeIdx].field : words[0]?.field ?? null;

  clipEl.setAttribute('data-narration-reading', 'true');
  if (activeField) {
    clipEl.setAttribute('data-narration-active-field', activeField);
  }

  const rt = getHighlightRuntime();
  if (!rt) {
    return { activeWordIndex: activeIdx, activeField, mode: 'block' };
  }

  const fieldMap = new Map<string, HTMLElement>();
  clipEl.querySelectorAll('[data-narration-field]').forEach((node) => {
    const fname = node.getAttribute('data-narration-field');
    if (fname && !fieldMap.has(fname)) {
      fieldMap.set(fname, node as HTMLElement);
    }
  });

  if (activeIdx >= 0) {
    const curWord = words[activeIdx];
    const targetEl = fieldMap.get(curWord.field);
    if (targetEl) {
      const range = resolveUtf16RangeInElement(targetEl, curWord.from, curWord.to);
      if (range) {
        rt.registry.set('narr-current', new rt.HighlightClass(range));
      }
    }
  }

  if (trailSeconds > 0 && words.length > 0) {
    const windowMs = trailSeconds * 1000;
    const newRanges: Range[] = [];
    const midRanges: Range[] = [];
    const oldRanges: Range[] = [];

    const upper = activeIdx >= 0 ? activeIdx - 1 : words.length - 1;
    for (let i = upper; i >= 0; i -= 1) {
      const w = words[i];
      if (w.endMs >= nowMs) continue;
      const age = nowMs - w.endMs;
      if (age > windowMs) break;

      const fieldEl = fieldMap.get(w.field);
      if (!fieldEl) continue;
      const range = resolveUtf16RangeInElement(fieldEl, w.from, w.to);
      if (!range) continue;

      const ratio = age / windowMs;
      if (ratio < 0.34) {
        newRanges.push(range);
      } else if (ratio < 0.67) {
        midRanges.push(range);
      } else {
        oldRanges.push(range);
      }
    }

    if (newRanges.length > 0)
      rt.registry.set('narr-trail-new', new rt.HighlightClass(...newRanges));
    if (midRanges.length > 0)
      rt.registry.set('narr-trail-mid', new rt.HighlightClass(...midRanges));
    if (oldRanges.length > 0)
      rt.registry.set('narr-trail-old', new rt.HighlightClass(...oldRanges));
  }

  return { activeWordIndex: activeIdx, activeField, mode: 'word' };
}
