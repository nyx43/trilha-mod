import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { findLesson, lessonPlace } from '../../lessons';
import { dueCardKeys, lessonStoreKey, readReview, reviewStoreKey } from '../../lessons/progress';
import LessonPage from '../../pages/LessonPage';
import { Flashcards } from './Flashcards';
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

  it('conta nos cartões apenas os lembrados de primeira e ignora hash inválido na URL', async () => {
    render(
      <Flashcards
        cards={[
          { key: 'a:1', front: 'Pergunta 1', back: 'Resposta 1' },
          { key: 'a:2', front: 'Pergunta 2', back: 'Resposta 2' },
        ]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ainda não lembrei' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lembrei' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lembrei' }));

    expect(screen.getByRole('status')).toHaveTextContent('1 de 2 cartões lembrados de primeira');

    const lesson = findLesson('como-a-web-funciona');
    const place = lesson ? lessonPlace(lesson.id, 'frontend') : undefined;
    if (!lesson || !place) throw new Error('Aula como-a-web-funciona ausente');
    render(
      <MemoryRouter initialEntries={['/aula/como-a-web-funciona#%E0%A4%A']}>
        <LessonView lesson={lesson} place={place} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: /Quem pede e quem responde/ }),
    ).toBeInTheDocument();
  });

  it('mantém o vencimento da primeira avaliação do dia mesmo após repetir, usar Revisar de novo e recarregar (Item 7)', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 10, 23, 12, 0, 0));
      // Registro antigo sem campo reviewedAt
      localStorage.setItem(
        reviewStoreKey,
        JSON.stringify({
          schemaVersion: 1,
          cards: { 'a:1': { box: 2, due: '2026-11-23' } },
        }),
      );

      const deck = [{ key: 'a:1', front: 'Pergunta', back: 'Resposta' }];
      const firstMount = render(<Flashcards cards={deck} />);

      // Marca "Ainda não lembrei" e depois "Lembrei" na mesma sessão
      fireEvent.click(
        screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Ainda não lembrei' }));
      fireEvent.click(
        screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Lembrei' }));

      expect(readReview().cards['a:1']).toEqual({
        box: 1,
        due: '2026-11-24',
        reviewedAt: '2026-11-23',
      });

      // Usa "Revisar de novo" no mesmo dia -> vencimento continua amanhã
      fireEvent.click(screen.getByRole('button', { name: /Revisar de novo/i }));
      fireEvent.click(
        screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Lembrei' }));
      expect(readReview().cards['a:1']).toEqual({
        box: 1,
        due: '2026-11-24',
        reviewedAt: '2026-11-23',
      });
      firstMount.unmount();

      // Recarrega no mesmo dia -> vencimento continua igual e não vence hoje
      const sameDayReload = render(<Flashcards cards={deck} />);
      fireEvent.click(
        screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Lembrei' }));
      expect(readReview().cards['a:1'].due).toBe('2026-11-24');
      expect(dueCardKeys(readReview())).toEqual([]);
      sameDayReload.unmount();

      // Avança o relógio para amanhã -> aparece na lista de revisão
      vi.setSystemTime(new Date(2026, 10, 24, 9, 0, 0));
      expect(dueCardKeys(readReview())).toEqual(['a:1']);
    } finally {
      vi.useRealTimers();
    }
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
