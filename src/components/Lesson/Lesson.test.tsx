import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { findLesson, lessonPlace } from '../../lessons';
import { lessonStoreKey, reviewStoreKey } from '../../lessons/progress';
import LessonPage from '../../pages/LessonPage';
import { buildDocument } from './Playground';
import { LessonView } from './LessonView';

function renderLesson(id = 'como-a-web-funciona') {
  const lesson = findLesson(id);
  if (!lesson) throw new Error(`Aula ausente: ${id}`);
  const place = lessonPlace(lesson.id, 'frontend');
  if (!place) throw new Error(`Aula fora dos cursos: ${id}`);
  return render(
    <MemoryRouter>
      <LessonView lesson={lesson} place={place} />
    </MemoryRouter>,
  );
}

const stored = (key: string) => JSON.parse(localStorage.getItem(key) || '{}');

describe('Aula', () => {
  beforeEach(() => localStorage.clear());

  it('abre uma seção por vez e guarda até onde a pessoa chegou', async () => {
    renderLesson();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Como a web funciona' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Quem pede e quem responde/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /O endereço: a URL/ })).not.toBeInTheDocument();

    const toc = screen.getByRole('navigation', { name: 'Nesta aula' });
    const locked = within(toc).getByText('Fechamento');
    fireEvent.click(locked);
    expect(screen.queryByRole('heading', { name: 'Fechamento' })).not.toBeInTheDocument();
    expect(stored(lessonStoreKey).lessons?.['como-a-web-funciona']).toBeUndefined();
    expect(within(toc).queryByRole('link', { name: /Fechamento/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuar: O endereço: a URL/ }));
    expect(screen.getByRole('heading', { name: /O endereço: a URL/ })).toBeInTheDocument();
    expect(stored(lessonStoreKey).lessons['como-a-web-funciona'].reached).toBe(1);

    const showAll = screen.getByRole('checkbox', { name: 'Mostrar a aula inteira' });
    fireEvent.click(showAll);
    fireEvent.click(within(toc).getByRole('link', { name: 'Fechamento' }));
    expect(screen.getByRole('heading', { name: 'Fechamento' })).toHaveFocus();
    expect(stored(lessonStoreKey).lessons['como-a-web-funciona'].reached).toBe(1);

    fireEvent.click(showAll);
    expect(screen.queryByRole('heading', { name: 'Fechamento' })).not.toBeInTheDocument();
  });

  it('explica a resposta errada e registra só a primeira tentativa', async () => {
    renderLesson();
    const quiz = (await screen.findByText(/Quem é o cliente nessa conversa/)).closest(
      'section',
    ) as HTMLElement;
    fireEvent.click(within(quiz).getByRole('button', { name: /O computador do banco/ }));
    expect(within(quiz).getByRole('status')).toHaveTextContent(/Ainda não/);
    expect(within(quiz).getByRole('status')).toHaveTextContent(/servidor/);

    fireEvent.click(within(quiz).getByRole('button', { name: /O navegador do celular/ }));
    expect(within(quiz).getByRole('status')).toHaveTextContent('Agora sim.');
    const answers = stored(lessonStoreKey).lessons['como-a-web-funciona'].answers;
    expect(Object.values(answers)).toEqual([false]);
  });

  it('conclui a aula e coloca os cartões na revisão espaçada', async () => {
    renderLesson();
    await screen.findByRole('heading', { name: /Quem pede e quem responde/ });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mostrar a aula inteira' }));
    expect(screen.getByRole('heading', { name: /Fechamento/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Concluir aula' }));

    expect(screen.getByText(/Aula concluída,|Aula concluída\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Próxima aula: Onde o dado mora/ })).toHaveAttribute(
      'href',
      '/aula/onde-o-dado-mora?trilha=frontend',
    );
    expect(Object.keys(stored(reviewStoreKey).cards)).toContain('como-a-web-funciona:dns');
  });

  it('indica quando a aula não existe', () => {
    render(
      <MemoryRouter initialEntries={['/aula/inexistente']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Esta aula não existe, ou mudou de nome' }),
    ).toBeInTheDocument();
  });

  it('guarda o plano do piloto antes da dica sem alterar o histórico publicado', async () => {
    const lessonId = 'onde-o-dado-mora';
    const saved = {
      schemaVersion: 1,
      lessons: {
        [lessonId]: {
          reached: 3,
          answers: { 'quatro-lugares:5': false, 'provar-persistencia:1': true },
        },
      },
      credited: [],
    };
    const review = {
      schemaVersion: 1,
      cards: { [`${lessonId}:prova-de-persistencia`]: { box: 4, due: '2026-11-28' } },
    };
    localStorage.setItem(lessonStoreKey, JSON.stringify(saved));
    localStorage.setItem(reviewStoreKey, JSON.stringify(review));
    const view = renderLesson(lessonId);
    const box = within(await screen.findByRole('region', { name: 'Desafio do catálogo' }));
    expect(box.queryByRole('button', { name: /dica de estratégia|solução comentada/ })).toBeNull();
    expect(screen.getByText('60% da aula · 1 de 2 atividades certas de primeira')).toBeVisible();
    fireEvent.change(box.getByLabelText('Qual é sua previsão e por quê?'), {
      target: { value: 'O resultado pode mudar quando trocar o processo.' },
    });
    fireEvent.change(
      box.getByLabelText('Que teste você escolheu? O que o resultado permitiria distinguir?'),
      {
        target: { value: 'Vou comparar duas consultas ao mesmo registro.' },
      },
    );
    fireEvent.click(box.getByRole('button', { name: 'Salvar previsão e teste' }));
    const hint = box.getByRole('button', { name: 'Ver dica de estratégia' });
    expect(hint).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(hint);
    expect(box.getByText(/Um 201 confirma/)).toBeVisible();
    expect(box.queryByRole('button', { name: /solução comentada/ })).toBeNull();

    view.unmount();
    renderLesson(lessonId);
    const resumed = within(await screen.findByRole('region', { name: 'Desafio do catálogo' }));
    expect(
      resumed.getByRole('button', { name: /dica de estratégia \(já consultado\)/ }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(resumed.getByRole('group', { name: 'Registrar o resultado' })).toBeVisible();
    expect(stored(lessonStoreKey)).toEqual(saved);
    expect(stored(reviewStoreKey)).toEqual(review);
  });
});

describe('Documento do playground', () => {
  it('impede que o código feche a própria tag de script e serializa os testes com segurança', () => {
    const html = buildDocument(
      { html: '<p>oi</p>', css: 'p{}</style><b>', js: 'console.log("</script><i>")' },
      'token',
      'check',
      ['return "</script>" !== ""'],
    );
    expect(html).not.toContain('</script><i>');
    expect(html).not.toContain('</style><b>');
    expect(html.match(/<\/script>/g)?.length).toBe(3);
  });
});
