import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactGA from 'react-ga4';
import { RouteTracker, resetAnalyticsStateForTests } from '../App';
import GuidesPage from '../pages/GuidesPage';
import StudyRecommenderPage from '../pages/StudyRecommenderPage';
import { buildPageviewEvent, resolveTrackedPage, sanitizeReferrer } from './routeTracking';

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: undefined,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
    loginWithRedirect: vi.fn(),
    getAccessTokenSilently: vi.fn(),
  }),
}));

describe('Privacidade das métricas (RouteTracker)', () => {
  const initSpy = vi.spyOn(ReactGA, 'initialize').mockImplementation(() => undefined);
  const setSpy = vi.spyOn(ReactGA, 'set').mockImplementation(() => undefined);
  const sendSpy = vi.spyOn(ReactGA, 'send').mockImplementation(() => undefined);

  beforeEach(() => {
    resetAnalyticsStateForTests();
    initSpy.mockClear();
    setSpy.mockClear();
    sendSpy.mockClear();
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: '',
    });
  });

  afterEach(() => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: '',
    });
  });

  it('só inicializa as métricas quando existe um identificador configurado', async () => {
    const tracker = (measurementId: string) => (
      <MemoryRouter initialEntries={['/guias']}>
        <RouteTracker enabled measurementId={measurementId} />
      </MemoryRouter>
    );
    const view = render(tracker(''));
    expect(initSpy).not.toHaveBeenCalled();
    view.rerender(tracker('G-TEST123'));
    await waitFor(() => expect(initSpy).toHaveBeenCalledTimes(1));
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('não envia texto digitado na busca de guias nem multiplica visualizações ao digitar letra por letra', async () => {
    render(
      <MemoryRouter initialEntries={['/guias']}>
        <RouteTracker enabled measurementId="G-TEST123" />
        <Routes>
          <Route path="/guias" element={<GuidesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText('Buscar um guia');
    const synthetic = 'http-segredo-999';
    let typed = '';
    for (const ch of synthetic) {
      typed += ch;
      fireEvent.change(searchInput, { target: { value: typed } });
    }

    expect(searchInput).toHaveValue(synthetic);
    expect(screen.getByText(/Nenhum guia encontrado/i)).toBeInTheDocument();

    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(1));
    expect(initSpy).toHaveBeenCalledTimes(1);

    const allPayloads = JSON.stringify([initSpy.mock.calls, setSpy.mock.calls, sendSpy.mock.calls]);
    expect(allPayloads).not.toContain('http-segredo-999');
    expect(allPayloads).not.toContain('busca');
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hitType: 'pageview',
        page: '/guias',
        location: `${window.location.origin}/guias`,
        page_referrer: '',
      }),
    );
  });

  it('preserva leitura de link legado com ?q= no recomendador sem enviar o enunciado ao Analytics', async () => {
    const legacyPrompt = 'Preciso estudar CORS e API Express segredo-aluno-42';

    render(
      <MemoryRouter initialEntries={[`/aulas/o-que-estudar?q=${encodeURIComponent(legacyPrompt)}`]}>
        <RouteTracker enabled measurementId="G-TEST123" />
        <Routes>
          <Route path="/aulas/o-que-estudar" element={<StudyRecommenderPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('textbox')).toHaveValue(legacyPrompt);
    expect(screen.getByText(/Sequência recomendada para você/i)).toBeInTheDocument();

    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(1));
    expect(initSpy).toHaveBeenCalledTimes(1);

    const allPayloads = JSON.stringify([initSpy.mock.calls, setSpy.mock.calls, sendSpy.mock.calls]);
    expect(allPayloads).not.toContain('segredo-aluno-42');
    expect(allPayloads).not.toContain('?q=');
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hitType: 'pageview',
        page: '/aulas/o-que-estudar',
        location: `${window.location.origin}/aulas/o-que-estudar`,
      }),
    );
  });

  it('exclui o retorno de login antes de inicializar o Analytics e higieniza referrer com parâmetros sensíveis', async () => {
    render(
      <MemoryRouter initialEntries={['/login?code=auth-code-secreto&state=state-secreto']}>
        <RouteTracker enabled measurementId="G-TEST123" />
        <Routes>
          <Route path="/login" element={<Link to="/aulas">Ir para aulas</Link>} />
          <Route path="/aulas" element={<div>Catálogo de aulas</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await Promise.resolve();
    expect(initSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(sendSpy).not.toHaveBeenCalled();

    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: `${window.location.origin}/login?code=auth-code-secreto&state=state-secreto`,
    });

    fireEvent.click(screen.getByRole('link', { name: 'Ir para aulas' }));

    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(1));
    expect(initSpy).toHaveBeenCalledTimes(1);

    const allPayloads = JSON.stringify([initSpy.mock.calls, setSpy.mock.calls, sendSpy.mock.calls]);
    expect(allPayloads).not.toContain('auth-code-secreto');
    expect(allPayloads).not.toContain('state-secreto');
    expect(allPayloads).not.toContain('/login');
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hitType: 'pageview',
        page: '/aulas',
        location: `${window.location.origin}/aulas`,
        page_referrer: '',
      }),
    );
  });

  it('registra navegações normais entre rotas conhecidas e ignora rotas desconhecidas ou privadas', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteTracker enabled measurementId="G-TEST123" />
        <Routes>
          <Route path="/" element={<Link to="/aula/como-a-web-funciona">Abrir aula</Link>} />
          <Route path="/aula/:lesson" element={<div>Aula</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(1));
    expect(sendSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: '/', location: `${window.location.origin}/` }),
    );

    fireEvent.click(screen.getByRole('link', { name: 'Abrir aula' }));
    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(2));
    expect(sendSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: '/aula/como-a-web-funciona',
        location: `${window.location.origin}/aula/como-a-web-funciona`,
      }),
    );

    expect(resolveTrackedPage('/rota-inexistente-com-segredo')).toBeNull();
    expect(resolveTrackedPage('/profile')).toBeNull();
    expect(resolveTrackedPage('/guias', '?tema=apis&busca=segredo')).toBe('/guias?tema=apis');
    expect(resolveTrackedPage('/guias', '?tema=invalido&busca=segredo')).toBe('/guias');
    expect(
      sanitizeReferrer(
        'https://busca.exemplo.com/resultado?q=meu-cpf',
        'https://trilha-mod.vercel.app',
      ),
    ).toBe('https://busca.exemplo.com');
    expect(
      buildPageviewEvent('/aulas', '?code=abc&state=xyz', {
        origin: 'https://trilha-mod.vercel.app',
      }),
    ).toBeNull();
  });
});
