import Cookies from 'universal-cookie';

export const API_AUDIENCE = 'TrilhaInfoApi';
export const LEGACY_API_TOKEN_COOKIE = 'api_token';

const knownCookiePaths = ['/', '/login', '/profile', '/new-roadmap', '/edit-roadmap'];

export type AccessTokenGetter = (options?: { audience?: string }) => Promise<string>;
export type AuthLogoutFn = (options?: { returnTo?: string }) => void;

function collectCandidatePaths(pathname?: string): string[] {
  const paths = new Set<string>(knownCookiePaths);
  const currentPath = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (currentPath && currentPath.startsWith('/')) {
    const clean = currentPath.replace(/\/+$/, '') || '/';
    paths.add(clean);
    const segments = clean.split('/').filter(Boolean);
    let prefix = '';
    for (const segment of segments) {
      prefix += `/${segment}`;
      paths.add(prefix);
    }
  }

  return Array.from(paths);
}

export function clearLegacyApiTokenCookie(pathname?: string): void {
  if (typeof document === 'undefined') return;
  const cookies = new Cookies();
  const paths = collectCandidatePaths(pathname);

  cookies.remove(LEGACY_API_TOKEN_COOKIE);
  for (const path of paths) {
    cookies.remove(LEGACY_API_TOKEN_COOKIE, { path });
  }
}

export async function getApiAccessToken(
  isAuthenticated: boolean,
  getAccessTokenSilently?: AccessTokenGetter,
): Promise<string | undefined> {
  clearLegacyApiTokenCookie();
  if (!isAuthenticated || typeof getAccessTokenSilently !== 'function') {
    return undefined;
  }
  const token = await getAccessTokenSilently({ audience: API_AUDIENCE });
  return token || undefined;
}

export async function getApiAuthHeader(
  isAuthenticated: boolean,
  getAccessTokenSilently?: AccessTokenGetter,
): Promise<string | undefined> {
  const token = await getApiAccessToken(isAuthenticated, getAccessTokenSilently);
  return token ? `Bearer ${token}` : undefined;
}

export function logoutSession(logout: AuthLogoutFn, returnTo?: string): void {
  clearLegacyApiTokenCookie();
  const target = returnTo ?? (typeof window !== 'undefined' ? window.location.origin : '/');
  logout({ returnTo: target });
}
