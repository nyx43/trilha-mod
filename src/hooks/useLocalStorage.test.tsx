import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persiste e atualiza a interface quando um array é mutado na mesma referência', () => {
    function ArrayHarness() {
      const [items, setItems] = useLocalStorage<string[]>('array-mut', ['a']);

      function addSameRef() {
        items.push('b');
        setItems(items);
      }

      return (
        <div>
          <span data-testid="values">{items.join(',')}</span>
          <button type="button" onClick={addSameRef}>
            Adicionar
          </button>
        </div>
      );
    }

    render(<ArrayHarness />);
    expect(screen.getByTestId('values')).toHaveTextContent('a');

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByTestId('values')).toHaveTextContent('a,b');
    expect(window.localStorage.getItem('array-mut')).toBe(JSON.stringify(['a', 'b']));
  });

  it('não regrava nem dispara re-renderização desnecessária quando o estado não muda', () => {
    window.localStorage.setItem('noop-key', JSON.stringify(['x']));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    let renders = 0;

    function NoopHarness() {
      renders += 1;
      const [items, setItems] = useLocalStorage<string[]>('noop-key', []);
      return (
        <div>
          <span data-testid="values">{items.join(',')}</span>
          <button type="button" onClick={() => setItems((prev) => prev)}>
            Manter
          </button>
        </div>
      );
    }

    render(<NoopHarness />);
    const initialRenders = renders;
    expect(setItemSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Manter' }));

    expect(renders).toBe(initialRenders);
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('funciona com Map usando serializer e deserializer customizados', () => {
    const serializer = (value: Map<string, boolean>) => JSON.stringify(Object.fromEntries(value));
    const deserializer = (value: string) =>
      new Map<string, boolean>(Object.entries(JSON.parse(value) as Record<string, boolean>));

    function MapHarness() {
      const [items, setItems] = useLocalStorage<Map<string, boolean>>('map-key', new Map(), {
        serializer,
        deserializer,
      });

      return (
        <div>
          <span data-testid="flag">{String(items.get('tema') === true)}</span>
          <button
            type="button"
            onClick={() => {
              items.set('tema', true);
              setItems(items);
            }}
          >
            Marcar
          </button>
        </div>
      );
    }

    render(<MapHarness />);
    expect(screen.getByTestId('flag')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar' }));
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
    expect(window.localStorage.getItem('map-key')).toBe(JSON.stringify({ tema: true }));
  });

  it('recarrega o valor correto ao trocar a chave de armazenamento', () => {
    window.localStorage.setItem('roadmap-a', JSON.stringify(['item-a']));
    window.localStorage.setItem('roadmap-b', JSON.stringify(['item-b']));

    function KeyHarness({ storageKey }: { storageKey: string }) {
      const [items] = useLocalStorage<string[]>(storageKey, []);
      return <span data-testid="values">{items.join(',')}</span>;
    }

    const { rerender } = render(<KeyHarness storageKey="roadmap-a" />);
    expect(screen.getByTestId('values')).toHaveTextContent('item-a');

    rerender(<KeyHarness storageKey="roadmap-b" />);
    expect(screen.getByTestId('values')).toHaveTextContent('item-b');
  });

  it('persiste mutações na mesma referência sob React.StrictMode sem gravações duplicadas', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    function StrictHarness() {
      const [items, setItems] = useLocalStorage<string[]>('strict-key', ['inicial']);
      return (
        <div>
          <span data-testid="values">{items.join(',')}</span>
          <button
            type="button"
            onClick={() => {
              items.push('novo');
              setItems(items);
            }}
          >
            Mutate
          </button>
        </div>
      );
    }

    render(
      <React.StrictMode>
        <StrictHarness />
      </React.StrictMode>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mutate' }));

    expect(screen.getByTestId('values')).toHaveTextContent('inicial,novo');
    expect(window.localStorage.getItem('strict-key')).toBe(JSON.stringify(['inicial', 'novo']));
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });
});
