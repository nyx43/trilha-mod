import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyingPage from '../pages/StudyingPage';
import { FeedbackDialog } from '../components/Feedback/FeedbackDialog';
import { setOfflineModeForTests } from '../runtime/mode';
import {
  toggleFavoriteCourse,
  toggleSavedLesson,
  touchRecentLesson,
  readBookmarks,
} from './bookmarks';
import { createBackupSnapshot, restoreBackupSnapshot } from './backup';
import { listFeedbackReports } from './feedback';

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

describe('Aba Estudando, Salvar Aulas, Favoritar Matérias e Avaliações/Bugs', () => {
  beforeEach(() => {
    localStorage.clear();
    setOfflineModeForTests(null);
  });

  afterEach(() => {
    setOfflineModeForTests(null);
    vi.unstubAllGlobals();
  });

  it('lista aulas em andamento, aulas salvas e matérias favoritas em /estudando e preserva tudo no backup', async () => {
    touchRecentLesson('como-a-web-funciona', 'frontend');
    toggleSavedLesson('onde-o-dado-mora', 'frontend');
    toggleFavoriteCourse('frontend');

    render(
      <MemoryRouter initialEntries={['/estudando']}>
        <Routes>
          <Route path="/estudando" element={<StudyingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'O que você está estudando' })).toBeInTheDocument();
    expect(screen.getByText('Como a web funciona')).toBeInTheDocument();
    expect(screen.getByText('Onde o dado mora')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Frontend' })).toBeInTheDocument();

    // Backup + clean restore must preserve bookmarks & in-progress lessons
    const snapshot = await createBackupSnapshot();
    localStorage.clear();
    expect(Object.keys(readBookmarks().savedLessons)).toHaveLength(0);

    const restored = await restoreBackupSnapshot(JSON.stringify(snapshot));
    expect(restored.ok).toBe(true);
    expect(readBookmarks().savedLessons['onde-o-dado-mora']).toBeDefined();
    expect(readBookmarks().favoriteCourses.frontend).toBeDefined();
  });

  it('salva relato de bug/melhoria localmente no APK offline sem fazer chamadas de rede', async () => {
    setOfflineModeForTests(true);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <MemoryRouter initialEntries={['/aula/onde-o-dado-mora']}>
        <FeedbackDialog
          lessonId="onde-o-dado-mora"
          lessonTitle="Onde o dado mora"
          courseId="frontend"
          courseTitle="Frontend"
          sectionId="localstorage"
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Avaliar \/ relatar/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Bug$/i }));
    fireEvent.click(screen.getByRole('button', { name: '4 estrelas' }));
    fireEvent.change(screen.getByLabelText('Resumo curto'), {
      target: { value: 'Botão de testar ficou colado na borda' },
    });
    fireEvent.change(screen.getByLabelText(/detalhes/i), {
      target: { value: 'Na tela de 360px o botão encosta na margem direita.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar relato offline' }));

    await waitFor(() => expect(screen.getByText('Relato salvo para análise')).toBeInTheDocument());
    expect(fetchSpy).not.toHaveBeenCalled();

    const saved = listFeedbackReports();
    expect(saved).toHaveLength(1);
    expect(saved[0].category).toBe('bug');
    expect(saved[0].rating).toBe(4);
    expect(saved[0].context.lessonId).toBe('onde-o-dado-mora');
    expect(saved[0].context.platform).toBe('android-offline');
    expect(screen.getByRole('link', { name: /Abrir issue preenchida no GitHub/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://github.com/nyx43/trilha-mod/issues/new?'),
    );
  });

  it('envia avaliação na Web via /api/feedback e registra o link da Issue criada no GitHub', async () => {
    setOfflineModeForTests(false);
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          issue: { number: 12, url: 'https://github.com/nyx43/trilha-mod/issues/12' },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/aula/como-a-web-funciona']}>
        <FeedbackDialog
          lessonId="como-a-web-funciona"
          lessonTitle="Como a web funciona"
          courseId="frontend"
          courseTitle="Frontend"
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Avaliar \/ relatar/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Avaliação$/i }));
    fireEvent.click(screen.getByRole('button', { name: '5 estrelas' }));
    fireEvent.change(screen.getByLabelText('Resumo curto'), {
      target: { value: 'Ótima explicação inicial' },
    });
    fireEvent.change(screen.getByLabelText(/detalhes/i), {
      target: { value: 'A analogia de DNS e HTTP ficou super clara.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para o GitHub' }));

    await waitFor(() => expect(screen.getByText('Enviado para o GitHub')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Ver Issue #12 no GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/nyx43/trilha-mod/issues/12',
    );
    expect(listFeedbackReports()[0].status).toBe('sent');
    expect(listFeedbackReports()[0].issueNumber).toBe(12);
  });
});
