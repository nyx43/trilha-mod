import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage';

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

describe('HomePage (itens 16 e 17)', () => {
  it('exibe a chamada "Explorar as aulas" apontando para /aulas e navega ao clicar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/aulas" element={<h1>Catálogo de aulas</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: 'Explorar as aulas' });
    expect(cta).toHaveAttribute('href', '/aulas');

    fireEvent.click(cta);
    expect(screen.getByRole('heading', { name: 'Catálogo de aulas' })).toBeInTheDocument();
  });

  it('direciona "Relate um problema" para as issues do fork mantendo os créditos do projeto original', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>,
    );

    const reportLink = screen.getByRole('link', { name: /Relate um problema/i });
    expect(reportLink).toHaveAttribute('href', 'https://github.com/nyx43/trilha-mod/issues/new');

    const contributeCodeLink = screen.getByRole('link', { name: /Contribua com código/i });
    expect(contributeCodeLink).toHaveAttribute(
      'href',
      'https://github.com/nyx43/trilha-mod/blob/main/CONTRIBUTING.md',
    );

    const upstreamLink = screen.getByRole('link', { name: /Ver no GitHub/i });
    expect(upstreamLink).toHaveAttribute('href', 'https://github.com/flaviojmendes/trilhainfo');
  });
});
