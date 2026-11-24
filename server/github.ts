import { createSign } from 'crypto';
import { normalizeRepositorySlug } from '../src/config/siteDefaults';

export interface GitHubConfig {
  appId: string;
  privateKey: string;
  installationId?: string;
  repository: string;
  baseBranch: string;
}

export type GitHubDestinationResult =
  | { status: 'unconfigured' }
  | { status: 'invalid'; error: string }
  | { status: 'ready'; config: GitHubConfig };

const branchPattern = /^[^\s~^:?*[\]\\]+$/;

export function resolveGitHubConfig(env = process.env): GitHubDestinationResult {
  const appId = env.GITHUB_APP_ID?.trim();
  const privateKey = env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  const hasAnyAppCredential = Boolean(appId || privateKey);

  if (!hasAnyAppCredential) {
    return { status: 'unconfigured' };
  }

  if (!appId || !privateKey) {
    return {
      status: 'invalid',
      error:
        'Configuração do GitHub App incompleta: defina GITHUB_APP_ID e GITHUB_APP_PRIVATE_KEY.',
    };
  }

  const repository = normalizeRepositorySlug(env.CONTRIBUTIONS_REPOSITORY);
  if (!repository) {
    return {
      status: 'invalid',
      error:
        'Destino de contribuições não configurado: defina CONTRIBUTIONS_REPOSITORY com dono/repositório do fork.',
    };
  }

  const baseBranch = env.CONTRIBUTIONS_BASE_BRANCH?.trim();
  if (!baseBranch || !branchPattern.test(baseBranch) || baseBranch.includes('..')) {
    return {
      status: 'invalid',
      error:
        'Branch de destino não configurada: defina CONTRIBUTIONS_BASE_BRANCH para o repositório de contribuições.',
    };
  }

  return {
    status: 'ready',
    config: {
      appId,
      privateKey,
      installationId: env.GITHUB_APP_INSTALLATION_ID?.trim() || undefined,
      repository,
      baseBranch,
    },
  };
}

export function githubConfig(env = process.env): GitHubConfig | undefined {
  const resolved = resolveGitHubConfig(env);
  return resolved.status === 'ready' ? resolved.config : undefined;
}

const base64url = (value: string | Buffer) =>
  Buffer.from(value).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

function appJWT({ appId, privateKey }: GitHubConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }),
  )}`;
  return `${unsigned}.${base64url(createSign('RSA-SHA256').update(unsigned).sign(privateKey))}`;
}

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'trilha-info-contributions',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok)
    throw new GitHubError(
      response.status,
      `GitHub ${init.method || 'GET'} ${path}: ${response.status} ${await response.text()}`,
    );
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export async function installationClient(config: GitHubConfig) {
  const jwt = appJWT(config);
  const installationId =
    config.installationId ||
    String((await request<{ id: number }>(jwt, `/repos/${config.repository}/installation`)).id);
  const { token } = await request<{ token: string }>(
    jwt,
    `/app/installations/${installationId}/access_tokens`,
    { method: 'POST' },
  );
  const repo = `/repos/${config.repository}`;
  return {
    async findUser(login: string) {
      try {
        return await request<{ id: number; login: string; name: string | null }>(
          token,
          `/users/${login}`,
        );
      } catch (error) {
        if (error instanceof GitHubError && error.status === 404) return undefined;
        throw error;
      }
    },
    async searchOpenPulls(query: string) {
      const q = encodeURIComponent(`repo:${config.repository} is:pr is:open ${query}`);
      return request<{ total_count: number; items: Array<{ number: number; html_url: string }> }>(
        token,
        `/search/issues?q=${q}&per_page=5`,
      );
    },
    async openPull(input: {
      branch: string;
      path: string;
      content: string;
      message: string;
      title: string;
      body: string;
      labels: string[];
    }) {
      const ref = await request<{ object: { sha: string } }>(
        token,
        `${repo}/git/ref/heads/${encodeURIComponent(config.baseBranch)}`,
      );
      await request(token, `${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: ref.object.sha }),
      });
      await request(token, `${repo}/contents/${input.path}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: input.message,
          content: Buffer.from(input.content).toString('base64'),
          branch: input.branch,
        }),
      });
      const pull = await request<{ number: number; html_url: string }>(token, `${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          head: input.branch,
          base: config.baseBranch,
          body: input.body,
          maintainer_can_modify: true,
        }),
      });
      await request(token, `${repo}/issues/${pull.number}/labels`, {
        method: 'POST',
        body: JSON.stringify({ labels: input.labels }),
      }).catch(() => undefined);
      return pull;
    },
    async createIssue(input: { title: string; body: string; labels?: string[] }) {
      const issue = await request<{ number: number; html_url: string }>(token, `${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          ...(input.labels?.length ? { labels: input.labels } : {}),
        }),
      });
      return issue;
    },
  };
}
