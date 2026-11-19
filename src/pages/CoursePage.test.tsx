import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoadmapRead } from '../entity/RoadmapReadModel';
import { roadmaps } from '../roadmaps/roadmaps';
import { convertToRoadmapRead, updateReadAttribute } from '../support/roadmapUtils';
import CoursePage from './CoursePage';

function renderCoursePage(initialEntry = '/course/frontend') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/course/:name" element={<CoursePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CoursePage', () => {
  it('altera a conclusão do artigo exibido mesmo após expandir outro tópico', () => {
    renderCoursePage();
    fireEvent.click(screen.getByRole('button', { name: 'concluir conteúdo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Controle de Versão' }));
    expect(screen.getByRole('heading', { name: /MDN: como a web funciona/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'desmarcar conteúdo' }));
    fireEvent.click(screen.getByRole('button', { name: 'concluir conteúdo' }));
    const saved = JSON.parse(window.localStorage.getItem('selectedItems-frontend') || '[]');
    expect(saved[0].children[0].children[0].children[0].read).toBe(true);
    expect(saved[0].children[1].read).toBe(false);
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marca e desmarca conteúdos e mantém o progresso após recarregar a página', () => {
    const firstMount = renderCoursePage('/course/frontend');

    const firstCheckboxes = screen.getAllByRole('checkbox');
    expect(firstCheckboxes[0]).toHaveAttribute('data-state', 'unchecked');

    // Marca pelo checkbox do primeiro nível na barra lateral e pelo botão de conclusão do conteúdo
    fireEvent.click(firstCheckboxes[0]);
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('data-state', 'checked');

    // Verifica que o botão de concluir conteúdo alterna para desmarcar conteúdo
    const desmarcarBtn = screen.getByRole('button', { name: /desmarcar conteúdo/i });
    expect(desmarcarBtn).toBeInTheDocument();

    const storedAfterCheck = JSON.parse(
      window.localStorage.getItem('selectedItems-frontend') || '[]',
    ) as RoadmapRead[];
    expect(storedAfterCheck.length).toBe(roadmaps.frontend.file.length);
    expect(storedAfterCheck[0]?.read).toBe(true);

    // Simula recarregamento da página (desmonta e remonta)
    firstMount.unmount();
    const secondMount = renderCoursePage('/course/frontend');

    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('data-state', 'checked');
    expect(screen.getByRole('button', { name: /desmarcar conteúdo/i })).toBeInTheDocument();

    // Desmarca o conteúdo ativo pelo botão principal e confirma persistência após novo reload
    fireEvent.click(screen.getByRole('button', { name: /desmarcar conteúdo/i }));
    expect(screen.getByRole('button', { name: /concluir conteúdo/i })).toBeInTheDocument();

    const storedAfterUncheck = JSON.parse(
      window.localStorage.getItem('selectedItems-frontend') || '[]',
    ) as RoadmapRead[];
    expect(storedAfterUncheck[0]?.read).toBe(false);

    secondMount.unmount();
    renderCoursePage('/course/frontend');
    expect(screen.getByRole('button', { name: /concluir conteúdo/i })).toBeInTheDocument();
  });

  it('marca e desmarca um tópico individual pelo botão concluir conteúdo e persiste após recarregar', () => {
    const firstMount = renderCoursePage('/course/frontend');

    fireEvent.click(screen.getByRole('button', { name: /concluir conteúdo/i }));
    expect(screen.getByRole('button', { name: /desmarcar conteúdo/i })).toBeInTheDocument();

    const saved = JSON.parse(
      window.localStorage.getItem('selectedItems-frontend') || '[]',
    ) as RoadmapRead[];
    const firstResource = saved[0]?.children?.[0]?.children?.[0]?.children?.[0];
    expect(firstResource?.read).toBe(true);

    firstMount.unmount();
    renderCoursePage('/course/frontend');
    expect(screen.getByRole('button', { name: /desmarcar conteúdo/i })).toBeInTheDocument();
  });

  it('preserva marcações existentes quando a quantidade de níveis da trilha muda', () => {
    const olderTwoLevels = convertToRoadmapRead(roadmaps.frontend.file.slice(0, 2));
    // Marca o tópico antes de simular mudança de rótulo e de quantidade de níveis
    updateReadAttribute('Comece pela web-Internet e HTTP', true, () => undefined, olderTwoLevels);
    // Simula uma revisão em que o rótulo do nível e do tópico mudaram, mas o id estável foi preservado
    olderTwoLevels[0].label = 'Início pela web (versão antiga)';
    olderTwoLevels[0].id = roadmaps.frontend.file[0].id;
    if (olderTwoLevels[0].children?.[0]) {
      olderTwoLevels[0].children[0].label = 'Início pela web (versão antiga)-Web Antigo';
    }
    window.localStorage.setItem('selectedItems-frontend', JSON.stringify(olderTwoLevels));

    renderCoursePage('/course/frontend');

    // Os recursos de 'Internet e HTTP' devem continuar concluídos mesmo após reconciliação de quantidade de níveis
    expect(screen.getByRole('button', { name: /desmarcar conteúdo/i })).toBeInTheDocument();

    const reconciled = JSON.parse(
      window.localStorage.getItem('selectedItems-frontend') || '[]',
    ) as RoadmapRead[];
    expect(reconciled).toHaveLength(roadmaps.frontend.file.length);
    expect(reconciled[0]?.children?.[0]?.read).toBe(true);
    expect(reconciled[reconciled.length - 1]?.read).toBe(false);
  });

  it('não regrava desnecessariamente quando a trilha salva já está sincronizada', () => {
    const currentTree = convertToRoadmapRead(roadmaps.frontend.file);
    window.localStorage.setItem('selectedItems-frontend', JSON.stringify(currentTree));
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderCoursePage('/course/frontend');

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('não herda conclusão de recurso substituído com ID e URL diferentes mesmo com o mesmo título', () => {
    const previousTree = convertToRoadmapRead(roadmaps.frontend.file);
    const firstLeaf = previousTree[0]?.children?.[0]?.children?.[0]?.children?.[0];
    if (!firstLeaf) throw new Error('Missing first resource in frontend fixture');
    firstLeaf.id = 'curriculum.internet-e-http.basics::resource.antigo';
    firstLeaf.url = 'https://antigo.example.com/web';
    firstLeaf.read = true;
    window.localStorage.setItem('selectedItems-frontend', JSON.stringify(previousTree));

    renderCoursePage('/course/frontend');

    expect(screen.getByRole('button', { name: /concluir conteúdo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desmarcar conteúdo/i })).not.toBeInTheDocument();
  });
});
