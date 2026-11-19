import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import usePrompt from './navigation';

function PromptedPage({ when }: { when: boolean }) {
  const navigate = useNavigate();
  usePrompt('Tem certeza que deseja sair?', when);

  return (
    <div>
      <span data-testid="editor">Editor ativo</span>
      <Link to="/destino">Ir via Link</Link>
      <button type="button" onClick={() => navigate('/destino')}>
        Ir via navigate
      </button>
    </div>
  );
}

describe('usePrompt compatível com React Router v6', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bloqueia navegação por Link e navigate quando recusado e permite quando confirmado', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="/editor" element={<PromptedPage when={true} />} />
          <Route path="/destino" element={<div data-testid="destino">Destino</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Ir via Link' }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('editor')).toBeInTheDocument();
    expect(screen.queryByTestId('destino')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir via navigate' }));
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('editor')).toBeInTheDocument();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('link', { name: 'Ir via Link' }));
    expect(screen.getByTestId('destino')).toBeInTheDocument();
  });

  it('não pergunta nem bloqueia quando when é false', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="/editor" element={<PromptedPage when={false} />} />
          <Route path="/destino" element={<div data-testid="destino">Destino</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Ir via Link' }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('destino')).toBeInTheDocument();
  });

  it('protege beforeunload enquanto ativo e remove o listener ao desativar', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/editor']}>
        <PromptedPage when={true} />
      </MemoryRouter>,
    );

    const blockedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(blockedEvent);
    expect(blockedEvent.defaultPrevented).toBe(true);

    rerender(
      <MemoryRouter initialEntries={['/editor']}>
        <PromptedPage when={false} />
      </MemoryRouter>,
    );

    const allowedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(allowedEvent);
    expect(allowedEvent.defaultPrevented).toBe(false);
  });
});
