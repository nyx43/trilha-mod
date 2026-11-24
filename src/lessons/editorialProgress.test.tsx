import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { LessonView } from '../components/Lesson/LessonView';
import PercursoPage from '../pages/PercursoPage';
import { apiReactTailwindPercurso } from '../percurso/apiReactTailwind';
import { percursoStoreKey, readPercursoStore } from '../percurso/progress';
import { findLesson, lessonPlace } from '.';
import { lessonStoreKey, readLessons, readReview, reviewStoreKey } from './progress';
import { resolveSectionPosition } from './sectionPosition';
import type { LessonContent } from './types';

const lessonId = 'integracao-front-e-api';
const percursoId = 'api-react-tailwind';
const stageSlug = 'integracao-front-api';
const cardId = `${lessonId}:quem-aplica-cors`;

beforeEach(() => localStorage.clear());

it('recupera a primeira seção anterior ainda existente quando a seção salva foi removida', () => {
  const ids = ['nova', 'introducao', 'aplicacao'];
  expect(resolveSectionPosition(ids, undefined, 2, ['introducao', 'removida', 'salva'])).toBe(1);
  expect(resolveSectionPosition(ids, { sectionId: 'salva', previousSectionIds: [] }, 2, ids)).toBe(
    0,
  );
});

it('preserva histórico e retomada nos dois caminhos após mover uma seção e deslocar uma questão', async () => {
  const lesson = findLesson(lessonId);
  if (!lesson) throw new Error(`Aula editorial ausente no catálogo: "${lessonId}".`);
  const place = lessonPlace(lessonId, 'fullstack');
  if (!place) {
    throw new Error(`Posição da aula "${lessonId}" ausente na trilha "fullstack".`);
  }
  const stage = apiReactTailwindPercurso.stages.find(({ slug }) => slug === stageSlug);
  if (stage?.kind !== 'lesson') throw new Error('Etapa de integração ausente');
  const { content } = await lesson.load();
  const [first, second, cors, ...remaining] = content.sections;
  const revised: LessonContent = {
    ...content,
    revision: 2,
    sections: [
      first,
      {
        ...cors,
        blocks: [{ type: 'text', text: 'Exemplo novo antes das atividades.' }, ...cors.blocks],
      },
      second,
      ...remaining,
    ],
  };

  const oldRecord = {
    reached: 2,
    answers: { 'cors:5': false, 'caminho-da-requisicao:3': true, 'cors:99': true },
  };
  const cards = { [cardId]: { box: 4, due: '2026-12-01' } };
  localStorage.setItem(
    lessonStoreKey,
    JSON.stringify({
      schemaVersion: 1,
      credited: [],
      lessons: { [lessonId]: oldRecord },
    }),
  );
  localStorage.setItem(reviewStoreKey, JSON.stringify({ schemaVersion: 1, cards }));
  localStorage.setItem(
    percursoStoreKey,
    JSON.stringify({
      schemaVersion: 1,
      completed: { [percursoId]: ['node-e-express'] },
      reached: { [percursoId]: { [stageSlug]: 2 } },
    }),
  );
  const stageLoad = vi.spyOn(stage, 'load').mockResolvedValue({ content: revised });
  const stageOrder = stage.sectionIds;
  stage.sectionIds = revised.sections.map(({ id }) => id);
  const openLesson = () =>
    render(
      <MemoryRouter>
        <LessonView
          lesson={{ ...lesson, load: async () => ({ content: revised }) }}
          place={place}
        />
      </MemoryRouter>,
    );
  const openStage = () =>
    render(
      <MemoryRouter initialEntries={[`/percurso/${percursoId}/${stageSlug}`]}>
        <Routes>
          <Route path="/percurso/:id/:etapa" element={<PercursoPage />} />
        </Routes>
      </MemoryRouter>,
    );

  try {
    for (const open of [openLesson, openStage]) {
      for (let reload = 0; reload < 3; reload++) {
        const view = open();
        await screen.findByText('Exemplo novo antes das atividades.');
        expect(screen.queryByRole('heading', { name: second.title })).not.toBeInTheDocument();
        if (open === openLesson)
          expect(screen.getByText(/1 de 2 atividades certas de primeira/)).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: /Autorizar a origem do front na API/ }));
        expect(readLessons().lessons[lessonId].answers).toEqual(oldRecord.answers);
        expect(readReview().cards).toEqual(cards);
        view.unmount();
      }
      const view = open();
      await screen.findByText('Exemplo novo antes das atividades.');
      fireEvent.click(screen.getByRole('button', { name: `Continuar: ${second.title}` }));
      expect(screen.getByRole('heading', { name: second.title })).toBeVisible();
      view.unmount();
    }
    expect(readLessons().lessons[lessonId].position?.sectionId).toBe(second.id);
    expect(readPercursoStore().positions?.[percursoId][stageSlug].sectionId).toBe(second.id);
    expect(readPercursoStore().completed[percursoId]).toEqual(['node-e-express']);

    const view = openStage();
    await screen.findByText('Exemplo novo antes das atividades.');
    fireEvent.click(screen.getByRole('button', { name: /objeto virou o texto/ }));
    expect(readLessons().lessons[lessonId].answerRevisions).toEqual({ 'fetch-com-corpo:2': 2 });
    const showAll = screen.getByRole('button', { name: 'Mostrar todas as seções' });
    fireEvent.click(showAll);
    fireEvent.click(screen.getByRole('button', { name: 'Concluir etapa' }));
    view.unmount();
    expect(readLessons().lessons[lessonId]).toMatchObject({
      doneRevision: 2,
      answers: oldRecord.answers,
    });
    expect(readReview().cards[cardId]).toEqual(cards[cardId]);
    expect(readPercursoStore().completedRevisions?.[percursoId][stageSlug]).toBe(2);
    for (const open of [openLesson, openStage]) {
      for (let reload = 0; reload < 2; reload++) {
        const current = open();
        await screen.findByRole('heading', { name: 'Fechamento' });
        if (open === openLesson) {
          expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
        } else {
          expect(screen.getByText('Etapa concluída')).toBeVisible();
        }
        expect(readReview().cards[cardId]).toEqual(cards[cardId]);
        current.unmount();
      }
    }
  } finally {
    stage.sectionIds = stageOrder;
    stageLoad.mockRestore();
  }
});
