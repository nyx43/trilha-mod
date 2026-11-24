import { Auth0Context, Auth0ContextInterface, initialContext } from '@auth0/auth0-react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../components/Header';
import MobileMenu from '../components/MobileMenu';
import LoginPage from '../pages/LoginPage';
import NewRoadmapPage from '../pages/NewRoadmap';
import UserPage from '../pages/UserPage';

function makeAuthValue(overrides: Partial<Auth0ContextInterface> = {}): Auth0ContextInterface {
  return {
    ...initialContext,
    isAuthenticated: false,
    isLoading: false,
    error: undefined,
    user: undefined,
    loginWithRedirect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue('token-default'),
    ...overrides,
  };
}

function WithAuth({ auth, children }: { auth: Auth0ContextInterface; children: ReactNode }) {
  return <Auth0Context.Provider value={auth}>{children}</Auth0Context.Provider>;
}

function makeFakeJwt(email: string) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 'https://trilha.info/email': email }));
  return `${header}.${payload}.signature`;
}

describe('Encerramento de sessão (Item 2) e Entrada/Perfil (Item 9)', () => {
  const cookies = new Cookies();
  const originalApiUrl = import.meta.env.VITE_API_URL;

  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.test');
    cookies.remove('api_token', { path: '/' });
    cookies.remove('api_token', { path: '/login' });
    cookies.remove('api_token', { path: '/profile' });
  });

  afterEach(() => {
    vi.stubEnv('VITE_API_URL', originalApiUrl ?? '');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('usa o SDK para autenticar, remove cookie legado ao sair pelo cabeçalho e menu móvel, e isola troca de conta', async () => {
    const tokenA = makeFakeJwt('conta-a@exemplo.com');
    const tokenB = makeFakeJwt('conta-b@exemplo.com');
    const logoutMock = vi.fn();

    // Simula cookie legado gravado antes da correção
    cookies.set('api_token', 'Bearer token-legado-antigo', { path: '/' });
    expect(cookies.get('api_token')).toBe('Bearer token-legado-antigo');

    const authA = makeAuthValue({
      isAuthenticated: true,
      user: {
        name: 'Conta A',
        email: 'conta-a@exemplo.com',
        nickname: 'conta_a',
        picture: 'https://exemplo.com/a.png',
      },
      logout: logoutMock,
      getAccessTokenSilently: vi.fn().mockResolvedValue(tokenA),
    });

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    const getSpy = vi.spyOn(axios, 'get').mockResolvedValue({
      data: { lastAccessAt: '2026-11-23T12:00:00.000Z' },
    });

    // 1. Ação autenticada com Conta A
    const editorView = render(
      <WithAuth auth={authA}>
        <MemoryRouter initialEntries={['/new-roadmap']}>
          <Routes>
            <Route path="/" element={<div data-testid="home">Home</div>} />
            <Route path="/new-roadmap" element={<NewRoadmapPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );

    fireEvent.change(screen.getByLabelText('Título:'), { target: { value: 'Trilha Conta A' } });
    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });
    expect(postSpy.mock.calls[0]?.[2]?.headers).toMatchObject({
      Authorization: `Bearer ${tokenA}`,
    });
    expect(cookies.get('api_token')).toBeUndefined();
    editorView.unmount();

    // 2. Sai pelo cabeçalho e pelo menu móvel com cookie legado presente
    cookies.set('api_token', 'Bearer token-legado-header', { path: '/' });
    const headerView = render(
      <WithAuth auth={authA}>
        <MemoryRouter initialEntries={['/']}>
          <Header />
        </MemoryRouter>
      </WithAuth>,
    );
    fireEvent.click(headerView.getByRole('button', { name: 'Sair' }));
    expect(logoutMock).toHaveBeenCalledWith({ returnTo: window.location.origin });
    expect(cookies.get('api_token')).toBeUndefined();
    headerView.unmount();

    cookies.set('api_token', 'Bearer token-legado-mobile', { path: '/' });
    const mobileView = render(
      <WithAuth auth={authA}>
        <MemoryRouter initialEntries={['/']}>
          <MobileMenu />
        </MemoryRouter>
      </WithAuth>,
    );
    fireEvent.click(mobileView.getByRole('button', { name: 'Abrir menu principal' }));
    fireEvent.click(await mobileView.findByRole('button', { name: 'Sair' }));
    expect(logoutMock).toHaveBeenCalledTimes(2);
    expect(cookies.get('api_token')).toBeUndefined();
    mobileView.unmount();

    // 3. Reabre tela protegida já deslogado (mesmo se existir cookie residual)
    cookies.set('api_token', 'Bearer token-vazado', { path: '/' });
    const loggedOutAuth = makeAuthValue({ isAuthenticated: false });
    getSpy.mockClear();

    const loggedOutEditor = render(
      <WithAuth auth={loggedOutAuth}>
        <MemoryRouter initialEntries={['/edit-roadmap/trilha-x']}>
          <Routes>
            <Route path="/edit-roadmap/:roadmapId" element={<NewRoadmapPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    await waitFor(() => expect(getSpy).toHaveBeenCalled());
    const lastGetConfig = getSpy.mock.calls[getSpy.mock.calls.length - 1]?.[1];
    expect(lastGetConfig?.headers).not.toHaveProperty('Authorization');
    expect(cookies.get('api_token')).toBeUndefined();
    loggedOutEditor.unmount();

    // 4. Entra com Conta B e confirma que a API recebe exclusivamente a identidade da nova sessão
    const authB = makeAuthValue({
      isAuthenticated: true,
      user: {
        name: 'Conta B',
        email: 'conta-b@exemplo.com',
        nickname: 'conta_b',
        picture: 'https://exemplo.com/b.png',
      },
      getAccessTokenSilently: vi.fn().mockResolvedValue(tokenB),
    });
    getSpy.mockClear();

    const profileView = render(
      <WithAuth auth={authB}>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<UserPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );

    await waitFor(() => expect(getSpy).toHaveBeenCalled());
    expect(getSpy.mock.calls[0]?.[0]).toContain('conta-b%40exemplo.com');
    expect(getSpy.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: `Bearer ${tokenB}`,
    });
    expect(JSON.stringify(getSpy.mock.calls)).not.toContain(tokenA);
    expect(cookies.get('api_token')).toBeUndefined();
    profileView.unmount();
  });

  it('trata carregamento, visitante, falha do provedor e retorno bem-sucedido em /login', async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined);

    // Carregamento
    const { rerender } = render(
      <WithAuth auth={makeAuthValue({ isLoading: true })}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-route">Início</div>} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    expect(
      within(screen.getByRole('main')).getByRole('heading', { name: /Verificando sua sessão/i }),
    ).toBeInTheDocument();

    // Visitante -> ação visível de entrada e retorno
    rerender(
      <WithAuth
        auth={makeAuthValue({
          isLoading: false,
          isAuthenticated: false,
          loginWithRedirect: loginMock,
        })}
      >
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-route">Início</div>} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    const loginButton = screen.getByRole('button', { name: /Entrar na conta/i });
    expect(loginButton).toBeVisible();
    expect(screen.getByRole('link', { name: /Continuar sem conta/i })).toBeVisible();
    fireEvent.click(loginButton);
    expect(loginMock).toHaveBeenCalledTimes(1);

    // Falha do provedor -> alerta com recuperação
    rerender(
      <WithAuth auth={makeAuthValue({ isLoading: false, error: new Error('Falha Auth0') })}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-route">Início</div>} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível entrar agora/i);
    expect(screen.getByRole('button', { name: /Tentar entrar novamente/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /Voltar para o início/i })).toBeVisible();

    // Retorno bem-sucedido -> obtém token pelo SDK, sincroniza usuário e navega para /
    const getSpy = vi.spyOn(axios, 'get').mockResolvedValue({ data: { login: 'ana@exemplo.com' } });
    rerender(
      <WithAuth
        auth={makeAuthValue({
          isLoading: false,
          isAuthenticated: true,
          user: { name: 'Ana', email: 'ana@exemplo.com' },
          getAccessTokenSilently: vi.fn().mockResolvedValue('token-ana'),
        })}
      >
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-route">Início</div>} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );

    expect(await screen.findByTestId('home-route')).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith(
      'https://api.exemplo.test/user/ana%40exemplo.com',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-ana' }),
      }),
    );
    expect(cookies.get('api_token')).toBeUndefined();
  });

  it('trata carregamento, visitante, falha do provedor e sessão válida em /profile', async () => {
    // Carregamento
    const { rerender } = render(
      <WithAuth auth={makeAuthValue({ isLoading: true })}>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<UserPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      /Carregando seu perfil/i,
    );

    // Visitante -> ação útil de login e retorno, sem campos vazios
    rerender(
      <WithAuth auth={makeAuthValue({ isLoading: false, isAuthenticated: false })}>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<UserPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    expect(screen.getByRole('heading', { name: /Entre para acessar seu perfil/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Entrar na conta/i })).toBeVisible();
    expect(screen.queryByText(/Último login/i)).not.toBeInTheDocument();

    // Falha do provedor -> alerta recuperável
    rerender(
      <WithAuth auth={makeAuthValue({ isLoading: false, error: new Error('Erro de provedor') })}>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<UserPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível verificar sua sessão/i);
    expect(screen.getByRole('button', { name: /Tentar entrar novamente/i })).toBeVisible();

    // Sessão válida -> exibe dados do usuário e botão Sair
    const jwt = makeFakeJwt('bia@exemplo.com');
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        id_user: 1,
        user_login: 'bia@exemplo.com',
        created_at: '2026-11-01T10:00:00.000Z',
        lastaccess_at: '2026-11-20T10:00:00.000Z',
        lastinteraction_at: '2026-11-20T10:00:00.000Z',
      },
    });

    rerender(
      <WithAuth
        auth={makeAuthValue({
          isLoading: false,
          isAuthenticated: true,
          user: {
            name: 'Beatriz Silva',
            email: 'bia@exemplo.com',
            picture: 'https://exemplo.com/bia.png',
          },
          getAccessTokenSilently: vi.fn().mockResolvedValue(jwt),
        })}
      >
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<UserPage />} />
          </Routes>
        </MemoryRouter>
      </WithAuth>,
    );

    const main = screen.getByRole('main');
    expect(await within(main).findByRole('heading', { name: 'Beatriz Silva' })).toBeInTheDocument();
    expect(await within(main).findByText(/Último login:/i)).not.toHaveTextContent('Invalid Date');
    expect(within(main).getByRole('button', { name: 'Sair' })).toBeVisible();
  });
});
