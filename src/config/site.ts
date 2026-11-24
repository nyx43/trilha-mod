import {
  DEFAULT_FORK_REPOSITORY,
  normalizeRepositorySlug,
  resolveConfiguredSiteUrl,
} from './siteDefaults';

export {
  DEFAULT_SITE_URL,
  DEFAULT_FORK_REPOSITORY,
  UPSTREAM_REPOSITORY,
  UPSTREAM_REPOSITORY_URL,
  normalizeRepositorySlug,
  normalizeSiteUrl,
} from './siteDefaults';

declare const __TRILHA_PUBLIC_ORIGIN__: string;

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
  if (env) return resolveConfiguredSiteUrl(env);
  if (typeof __TRILHA_PUBLIC_ORIGIN__ !== 'undefined') return __TRILHA_PUBLIC_ORIGIN__;
  return resolveConfiguredSiteUrl({
    SITE_URL: readEnv('SITE_URL'),
    VITE_SITE_URL: readEnv('VITE_SITE_URL'),
  });
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
