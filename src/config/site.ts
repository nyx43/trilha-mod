declare const __TRILHA_PUBLIC_ORIGIN__: string;

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

function readEnv(key: string): string | undefined {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  if (metaEnv && typeof metaEnv[key] === 'string') {
    return metaEnv[key];
  }
  if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string') {
    return process.env[key];
  }
  return undefined;
}

export function resolveSiteUrl(env?: Record<string, string | undefined>): string {
  const fromArg = normalizeSiteUrl(env?.SITE_URL) ?? normalizeSiteUrl(env?.VITE_SITE_URL);
  if (fromArg) return fromArg;

  if (!env) {
    if (typeof __TRILHA_PUBLIC_ORIGIN__ !== 'undefined') return __TRILHA_PUBLIC_ORIGIN__;
    const fromRuntime =
      normalizeSiteUrl(readEnv('SITE_URL')) ?? normalizeSiteUrl(readEnv('VITE_SITE_URL'));
    if (fromRuntime) return fromRuntime;
  }

  return DEFAULT_SITE_URL;
}

export function resolveForkRepository(env?: Record<string, string | undefined>): string {
  const fromArg =
    normalizeRepositorySlug(env?.CONTRIBUTIONS_REPOSITORY) ??
    normalizeRepositorySlug(env?.VITE_FORK_REPOSITORY);
  if (fromArg) return fromArg;

  if (!env) {
    const fromRuntime =
      normalizeRepositorySlug(readEnv('VITE_FORK_REPOSITORY')) ??
      normalizeRepositorySlug(readEnv('CONTRIBUTIONS_REPOSITORY'));
    if (fromRuntime) return fromRuntime;
  }

  return DEFAULT_FORK_REPOSITORY;
}

export const siteUrl = resolveSiteUrl();
export const siteHost = new URL(siteUrl).hostname;
export const forkRepository = resolveForkRepository();
export const forkRepositoryUrl = `https://github.com/${forkRepository}`;
export const forkIssuesUrl = `${forkRepositoryUrl}/issues/new`;
