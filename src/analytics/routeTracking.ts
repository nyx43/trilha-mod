import { matchPath } from 'react-router-dom';
import { reservationsPracticeUrl } from '../lessons/persistencePilot';

const allowedGuideThemes = new Set(['web', 'apis', 'dados', 'operacao', 'carreira']);

const authQueryParamNames = new Set([
  'code',
  'state',
  'error',
  'error_description',
  'access_token',
  'id_token',
  'session_state',
  'token',
]);

const excludedPathPrefixes = ['/login', '/profile', '/new-roadmap', '/edit-roadmap'];

function normalizePath(pathname: string): string {
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, '');
  return clean || '/';
}

export function hasAuthCallbackParams(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  for (const key of params.keys()) {
    if (authQueryParamNames.has(key.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function isExcludedAnalyticsRoute(pathname: string, search = ''): boolean {
  const normalized = normalizePath(pathname);
  if (
    excludedPathPrefixes.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }
  return hasAuthCallbackParams(search);
}

function encodeSegment(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return encodeURIComponent(trimmed);
}

export function resolveTrackedPage(pathname: string, search = ''): string | null {
  if (isExcludedAnalyticsRoute(pathname, search)) {
    return null;
  }

  const normalized = normalizePath(pathname);

  if (normalized === '/') return '/';
  if (normalized === '/aulas') return '/aulas';
  if (normalized === '/estudando') return '/estudando';
  if (normalized === '/aulas/o-que-estudar') return '/aulas/o-que-estudar';
  if (normalized === reservationsPracticeUrl) return reservationsPracticeUrl;
  if (normalized === '/blog') return '/blog';

  if (normalized === '/guias') {
    const params = new URLSearchParams(search);
    const theme = params.get('tema');
    if (theme && allowedGuideThemes.has(theme)) {
      return `/guias?tema=${theme}`;
    }
    return '/guias';
  }

  if (
    matchPath('/roadmap/view/:roadmapId', normalized) ||
    matchPath('/roadmap/v/:roadmapId', normalized)
  ) {
    return '/roadmap/view';
  }

  const singleParamRoutes: Array<{ pattern: string; prefix: string; param: string }> = [
    { pattern: '/roadmap/:name', prefix: '/roadmap', param: 'name' },
    { pattern: '/hroadmap/:name', prefix: '/hroadmap', param: 'name' },
    { pattern: '/course/:name', prefix: '/course', param: 'name' },
    { pattern: '/guide/:guide', prefix: '/guide', param: 'guide' },
    { pattern: '/aulas/:trilha', prefix: '/aulas', param: 'trilha' },
    { pattern: '/aula/:lesson', prefix: '/aula', param: 'lesson' },
    { pattern: '/percurso/:id', prefix: '/percurso', param: 'id' },
    { pattern: '/blog/:title', prefix: '/blog', param: 'title' },
  ];

  for (const route of singleParamRoutes) {
    const matched = matchPath(route.pattern, normalized);
    if (matched) {
      const encoded = encodeSegment(matched.params[route.param]);
      return encoded ? `${route.prefix}/${encoded}` : null;
    }
  }

  const percursoStageMatch = matchPath('/percurso/:id/:etapa', normalized);
  if (percursoStageMatch) {
    const id = encodeSegment(percursoStageMatch.params.id);
    const etapa = encodeSegment(percursoStageMatch.params.etapa);
    return id && etapa ? `/percurso/${id}/${etapa}` : null;
  }

  return null;
}

export function sanitizeReferrer(referrer: string, currentOrigin: string): string {
  if (!referrer) return '';
  try {
    const parsed = new URL(referrer);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    const cleanOrigin = currentOrigin.replace(/\/+$/, '');
    if (parsed.origin === cleanOrigin) {
      const tracked = resolveTrackedPage(parsed.pathname, parsed.search);
      return tracked ? `${cleanOrigin}${tracked}` : '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

export interface SanitizedPageview {
  page: string;
  location: string;
  page_referrer: string;
}

export function buildPageviewEvent(
  pathname: string,
  search: string,
  options: { origin: string; referrer?: string },
): SanitizedPageview | null {
  const page = resolveTrackedPage(pathname, search);
  if (!page) return null;
  const cleanOrigin = options.origin.replace(/\/+$/, '');
  return {
    page,
    location: `${cleanOrigin}${page}`,
    page_referrer: sanitizeReferrer(options.referrer || '', cleanOrigin),
  };
}
