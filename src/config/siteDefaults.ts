export const DEFAULT_SITE_URL = 'https://trilha-mod.vercel.app';
export const UPSTREAM_REPOSITORY = 'flaviojmendes/trilhainfo';
export const UPSTREAM_REPOSITORY_URL = `https://github.com/${UPSTREAM_REPOSITORY}`;
export const DEFAULT_FORK_REPOSITORY = 'nyx43/trilha-mod';

const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function normalizeSiteUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return undefined;
  }
}

export function normalizeRepositorySlug(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
  return repoPattern.test(trimmed) ? trimmed : undefined;
}

export function resolveConfiguredSiteUrl(env: Record<string, string | undefined>): string {
  return normalizeSiteUrl(env.SITE_URL) ?? normalizeSiteUrl(env.VITE_SITE_URL) ?? DEFAULT_SITE_URL;
}
