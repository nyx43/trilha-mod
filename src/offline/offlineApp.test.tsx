import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import ReactGA from 'react-ga4';
import { setOfflineModeForTests } from '../runtime/mode';
import UserPage from '../pages/UserPage';
import Note from '../components/Note';
import YoutubeEmbed from '../components/YoutubeEmbed';
import CustomRoadmapPage from '../pages/CustomRoadmapPage';
import CoursePage from '../pages/CoursePage';
import { ContributeDialog } from '../components/Contribute/ContributeDialog';
import { RouteTracker, resetAnalyticsStateForTests } from '../App';
import {
  listAllLocalNotes,
  listContributionDrafts,
  loadLocalProfile,
  saveLocalRoadmap,
} from './localStore';
import { LinkContentType, RoadmapModel } from '../entity/RoadmapModel';
import { createCatalog } from '../learning/catalog';
import { roadmaps } from '../roadmaps/roadmaps';
import { roadmapGuides } from '../roadmaps/guides';
import { useGithubStars } from '../components/ProjectInfo/useGithubStars';

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: undefined,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
    loginWithRedirect: vi.fn(),
    loginWithPopup: vi.fn(),
    getAccessTokenSilently: vi.fn(),
  }),
}));

const sampleCatalog = createCatalog(
  'frontend',
  roadmaps.frontend.title,
  roadmaps.frontend.file,
  roadmapGuides.frontend,
);
const [sampleGroup] = Object.values(sampleCatalog.groups).filter(
  (item) => item.variants.standard.stepIds.length > 0,
);

function StarsProbe() {
  const stars = useGithubStars();
  return <span data-testid="stars">{stars ?? 'none'}</span>;
}

describe('Aplicativo pessoal offline (Frente 2 · itens 3 e 4)', () => {
  const axiosGetSpy = vi.spyOn(axios, 'get');
  const axiosPostSpy = vi.spyOn(axios, 'post');
  const gaInitSpy = vi.spyOn(ReactGA, 'initialize').mockImplementation(() => undefined);
  const fetchSpy = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    setOfflineModeForTests(true);
    resetAnalyticsStateForTests();
    axiosGetSpy.mockClear();
    axiosPostSpy.mockClear();
    gaInitSpy.mockClear();
    fetchSpy.mockClear();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    setOfflineModeForTests(null);
    vi.unstubAllGlobals();
  });

  it('desativa GA4 e GitHub Stars em modo offline sem fazer requisições', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteTracker enabled measurementId="G-TEST-123" />
        <StarsProbe />
      </MemoryRouter>,
    );
    await Promise.resolve();
    expect(gaInitSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('stars')).toHaveTextContent('none');
  });

  it('permite editar perfil local em /profile e exibe seções de backup, áudio e rascunhos', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <UserPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Meu espaço de estudo' })).toBeInTheDocument();
    expect(screen.getByText('Backup e restauração do progresso')).toBeInTheDocument();
    expect(screen.getByText('Vozes e pacotes de áudio locais')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Seu nome');
    fireEvent.change(nameInput, { target: { value: 'Maria Offline' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil local' }));

    expect(loadLocalProfile().name).toBe('Maria Offline');
    expect(axiosGetSpy).not.toHaveBeenCalled();
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  it('salva e lista anotações localmente sem login remoto nem chamadas de rede', () => {
    render(<Note id="curriculum.http" title="HTTP" />);
    const textarea = screen.getByPlaceholderText(/Salve aqui suas anotações/i);
    fireEvent.change(textarea, { target: { value: 'Estudar status 201 e 422' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Anotação/i }));

    expect(screen.getByText('Estudar status 201 e 422')).toBeInTheDocument();
    expect(listAllLocalNotes()).toHaveLength(1);
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  it('carrega trilha pessoal local em CustomRoadmapPage e CoursePage sem API remota', () => {
    const model = new RoadmapModel();
    model.id = 'minha-trilha-1';
    model.slug = 'minha-trilha-1';
    model.title = 'Sistemas Operacionais 26.2';
    model.levels = [
      {
        label: 'Unidade 1',
        items: [
          {
            label: 'Sistemas de Arquivos',
            children: [
              {
                label: 'Comparação ext4 vs NTFS',
                links: [
                  {
                    label: 'Resumo local',
                    url: 'https://example.org/fs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    saveLocalRoadmap(model);

    const view1 = render(
      <MemoryRouter initialEntries={['/roadmap/view/minha-trilha-1']}>
        <Routes>
          <Route path="/roadmap/view/:roadmapId" element={<CustomRoadmapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Unidade 1')).toBeInTheDocument();
    view1.unmount();

    render(
      <MemoryRouter initialEntries={['/course/minha-trilha-1']}>
        <Routes>
          <Route path="/course/:name" element={<CoursePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Trilha Sistemas Operacionais 26.2')).toBeInTheDocument();
    expect(axiosGetSpy).not.toHaveBeenCalled();
  });

  it('salva sugestão como rascunho local sem Turnstile nem /api/contributions', async () => {
    render(
      <ContributeDialog
        catalog={sampleCatalog}
        group={sampleGroup}
        turnstileSiteKey="should-be-ignored-offline"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sugerir conteúdo' }));
    fireEvent.click(screen.getByRole('radio', { name: /Documentação ou artigo/ }));
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'https://developer.mozilla.org/pt-BR/docs/Web/HTML' },
    });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Guia HTML MDN' } });
    fireEvent.click(screen.getByLabelText(/gratuito/));
    fireEvent.change(screen.getByLabelText('Por que isso ajuda quem estuda?'), {
      target: { value: 'Explica semântica com clareza.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho local' }));

    await waitFor(() => expect(screen.getByText('Rascunho salvo localmente')).toBeInTheDocument());
    expect(listContributionDrafts()).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
  });

  it('substitui iframe do YouTube por cartão offline identificando dependência de internet', () => {
    const { container } = render(<YoutubeEmbed embedId="dQw4w9WgXcQ" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText(/Vídeo externo · requer internet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir vídeo no YouTube/i })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
  });
});
