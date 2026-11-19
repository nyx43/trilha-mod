/** Safely decodes a URL hash fragment (without throwing on malformed percent-encoding). */
export function safeDecodeHash(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
