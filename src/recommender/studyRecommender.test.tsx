import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LessonView } from '../components/Lesson/LessonView';
import { findLesson, lessonPlace } from '../lessons';
import { lessonStoreKey } from '../lessons/progress';
import LessonsPage from '../pages/LessonsPage';
import StudyRecommenderPage from '../pages/StudyRecommenderPage';
import { lessonPlanStorageKey } from './savedLessonPlan';
import { recommendStudyPlan } from './studyRecommender';
import { webTopicRules } from './webRules';

describe('recommendStudyPlan', () => {
  it('valida que todas as aulas e seções referenciadas nas regras Web existem no catálogo', async () => {
    for (const rule of webTopicRules) {
      const lesson = findLesson(rule.lessonId);
      expect(lesson, `Aula ausente: ${rule.lessonId}`).toBeDefined();
      const loaded = await lesson!.load();
      const byId = new Map(loaded.content.sections.map((section) => [section.id, section.title]));

      if (rule.section) {
        expect(
          byId.get(rule.section.id),
          `Seção ${rule.section.id} inválida em ${rule.lessonId}`,
        ).toBe(rule.section.title);
      }
      if (rule.sectionByPhrase) {
        for (const target of Object.values(rule.sectionByPhrase)) {
          expect(byId.get(target.id), `Seção ${target.id} inválida em ${rule.lessonId}`).toBe(
            target.title,
          );
        }
      }
    }
  });

  it('cobre API Node, Tailwind e GitHub agrupando repetições e mantendo React como sugestão de apoio', () => {
    const result = recommendStudyPlan(
      'Enviar link do GitHub da API Node com o GitHub do frontend utilizando Tailwind.',
    );

    expect(result.isEmpty).toBe(false);
    expect(result.unmatched).toHaveLength(0);

    const sequenceIds = result.sequence.map((item) => item.lesson.id);
    expect(sequenceIds).toContain('git-do-zero');
    expect(sequenceIds).toContain('node-e-express');
    expect(sequenceIds).toContain('tailwind-na-pratica');
    expect(sequenceIds.filter((id) => id === 'git-do-zero')).toHaveLength(1);

    const gitCard = result.sequence.find((item) => item.lesson.id === 'git-do-zero');
    expect(gitCard?.sectionId).toBe('github-e-pull-request');
    expect(gitCard?.sectionTitle).toBe('GitHub e o pull request');
    expect(gitCard?.url).toBe('/aula/git-do-zero?trilha=frontend#github-e-pull-request');
    expect(gitCard?.matchedSnippets.length).toBeGreaterThanOrEqual(1);

    // React must NOT become mandatory when only Node + Tailwind + frontend are requested.
    expect(result.sequence.some((item) => item.lesson.id.startsWith('react-'))).toBe(false);
    const reactSupport = result.supportSuggestions.find(
      (item) => item.lesson.id === 'react-jsx-componentes-e-props',
    );
    expect(reactSupport?.kind).toBe('support');

    for (const item of [...result.sequence, ...result.supportSuggestions]) {
      expect(findLesson(item.lesson.id)).toBeDefined();
      expect(item.url).toMatch(/^\/aula\/[a-z0-9-]+/);
      expect(item.practiceAction.length).toBeGreaterThan(10);
    }
  });

  it('indica aulas e seções para HTTP e CORS e sinaliza trecho sem aula encontrada', () => {
    const result = recommendStudyPlan(
      'Preciso estudar métodos HTTP, erro de CORS e transformada de Fourier.',
    );

    const sequenceIds = result.sequence.map((item) => item.lesson.id);
    expect(sequenceIds).toContain('como-a-web-funciona');
    expect(sequenceIds).toContain('api-rest-e-contratos');
    expect(sequenceIds).toContain('integracao-front-e-api');

    expect(sequenceIds.indexOf('como-a-web-funciona')).toBeLessThan(
      sequenceIds.indexOf('api-rest-e-contratos'),
    );
    expect(sequenceIds.indexOf('api-rest-e-contratos')).toBeLessThan(
      sequenceIds.indexOf('integracao-front-e-api'),
    );

    const httpCard = result.sequence.find((item) => item.lesson.id === 'api-rest-e-contratos');
    expect(httpCard?.sectionId).toBe('recursos-e-metodos');
    expect(httpCard?.sectionTitle).toBe('Coisas e ações: recursos e métodos');
    expect(httpCard?.url).toBe('/aula/api-rest-e-contratos?trilha=backend#recursos-e-metodos');

    const corsCard = result.sequence.find((item) => item.lesson.id === 'integracao-front-e-api');
    expect(corsCard?.sectionId).toBe('cors');
    expect(corsCard?.sectionTitle).toBe('CORS: a portaria do navegador');
    expect(corsCard?.url).toBe('/aula/integracao-front-e-api?trilha=fullstack#cors');

    expect(result.unmatched).toEqual([
      {
        snippet: 'transformada de Fourier',
        message: 'Não encontrei uma aula para este trecho',
      },
    ]);

    const shortLead = recommendStudyPlan(
      'Estudar métodos HTTP, erro de CORS e transformada de Fourier.',
    );
    expect(shortLead.unmatched).toEqual([
      {
        snippet: 'transformada de Fourier',
        message: 'Não encontrei uma aula para este trecho',
      },
    ]);
  });

  it('compara sem depender de maiúsculas, acentos ou formato em lista', () => {
    const prose = recommendStudyPlan('FETCH e TAILWIND CSS com METODOS HTTP');
    const list = recommendStudyPlan(
      '- buscar dados da api\n- Tailwind\n- api rest\n- REQUISICOES NO REACT',
    );

    expect(prose.sequence.map((item) => item.lesson.id)).toEqual(
      expect.arrayContaining([
        'js-assincrono-e-apis',
        'tailwind-na-pratica',
        'api-rest-e-contratos',
      ]),
    );
    expect(list.sequence.map((item) => item.lesson.id)).toEqual(
      expect.arrayContaining([
        'js-assincrono-e-apis',
        'tailwind-na-pratica',
        'api-rest-e-contratos',
        'react-rotas-e-requisicoes',
      ]),
    );
  });

  it('trata entrada vazia e sinaliza correspondência fraca', () => {
    expect(recommendStudyPlan('   ').isEmpty).toBe(true);

    const weak = recommendStudyPlan('segurança');
    expect(weak.weakMatches).toHaveLength(1);
    expect(weak.weakMatches[0].snippet).toBe('segurança');
    expect(weak.weakMatches[0].candidates.length).toBeGreaterThan(0);
  });
});

describe('páginas de Aulas, Recomendador e abertura na seção certa', () => {
  it('mantém acesso ao recomendador e ao percurso curto na página de Aulas', () => {
    render(
      <MemoryRouter initialEntries={['/aulas']}>
        <LessonsPage />
      </MemoryRouter>,
    );

    const recLink = screen.getByRole('link', { name: /Abrir recomendador por enunciado/i });
    expect(recLink.getAttribute('href')).toBe('/aulas/o-que-estudar');

    const percursoLink = screen.getByRole('link', { name: /Abrir percurso curto/i });
    expect(percursoLink.getAttribute('href')).toBe('/percurso/api-react-tailwind');
  });

  it('exibe validação de entrada vazia, foco por teclado e links diretos para seções do catálogo', () => {
    render(
      <MemoryRouter initialEntries={['/aulas/o-que-estudar']}>
        <Routes>
          <Route path="/aulas/o-que-estudar" element={<StudyRecommenderPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Montar sequência de aulas/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/Cole um enunciado/i);

    const textarea = screen.getByLabelText(/Cole aqui o enunciado/i);
    expect(document.activeElement).toBe(textarea);

    fireEvent.change(textarea, {
      target: { value: 'Preciso estudar métodos HTTP, erro de CORS e transformada de Fourier.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Montar sequência de aulas/i }));

    expect(screen.getByText('API REST e contratos')).toBeTruthy();
    expect(screen.getByText('Integração entre front e API')).toBeTruthy();
    expect(screen.getByText('CORS: a portaria do navegador')).toBeTruthy();
    expect(screen.getByText('Não encontrei uma aula para este trecho')).toBeTruthy();
    expect(screen.getByText('transformada de Fourier')).toBeTruthy();

    const corsLink = screen.getByRole('link', {
      name: /Abrir aula: Integração entre front e API/i,
    });
    expect(corsLink.getAttribute('href')).toBe(
      '/aula/integracao-front-e-api?trilha=fullstack#cors',
    );

    fireEvent.click(screen.getByRole('button', { name: /Ajustar termos/i }));
    expect(document.activeElement).toBe(textarea);
  });

  it('abre a seção indicada pela URL sem alterar o progresso salvo do usuário', async () => {
    localStorage.clear();
    const lesson = findLesson('integracao-front-e-api')!;
    const place = lessonPlace(lesson.id, 'fullstack')!;

    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api?trilha=fullstack#cors']}>
        <LessonView lesson={lesson} place={place} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: /CORS: a portaria do navegador/i }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(lessonStoreKey)).toBeNull();
  });

  it('salva só os passos selecionados, mantém React opcional e retoma a seção depois de recarregar', () => {
    localStorage.clear();
    function Address() {
      const location = useLocation();
      return (
        <output aria-label="Endereço atual">
          {location.pathname}
          {location.search}
          {location.hash}
        </output>
      );
    }
    const route = () => (
      <MemoryRouter initialEntries={['/aulas/o-que-estudar']}>
        <Address />
        <Routes>
          <Route path="/aulas/o-que-estudar" element={<StudyRecommenderPage />} />
          <Route path="/aula/:lesson" element={<p>Aula de teste</p>} />
        </Routes>
      </MemoryRouter>
    );
    const page = render(route());
    const prompt =
      'Enviar link do GitHub da API Node com o GitHub do frontend utilizando Tailwind.';
    fireEvent.change(screen.getByLabelText(/Cole aqui o enunciado/i), {
      target: { value: prompt },
    });
    fireEvent.click(screen.getByRole('button', { name: /Montar sequência de aulas/i }));
    expect(screen.getByLabelText('Endereço atual')).toHaveTextContent(/^\/aulas\/o-que-estudar$/);
    fireEvent.click(screen.getByRole('button', { name: 'Montar meu plano' }));
    const review = screen.getByRole('region', { name: 'Revise seu plano' });
    const react = within(review).getByRole('checkbox', {
      name: /JSX, componentes e props.*opcional/i,
    });
    expect(react).not.toBeChecked();
    fireEvent.click(react);
    fireEvent.click(within(review).getByRole('checkbox', { name: 'Git do zero' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar plano' }));
    const stored = localStorage.getItem(lessonPlanStorageKey);
    expect(stored).toContain('react-jsx-componentes-e-props');
    expect(stored).not.toContain('git-do-zero');
    expect(stored).not.toContain(prompt);
    expect(screen.getByRole('heading', { name: 'Checklist dos dois repositórios' })).toBeVisible();
    const tailwind = screen.getByRole('link', { name: 'Estudar Tailwind na prática' });
    const target = tailwind.getAttribute('href');
    expect(target).toMatch(/\/aula\/tailwind-na-pratica\?trilha=.+#.+/);
    fireEvent.click(tailwind);
    expect(screen.getByLabelText('Endereço atual').textContent).toBe(target);
    page.unmount();

    render(route());
    expect(screen.getByRole('link', { name: 'Retomar plano' })).toHaveAttribute('href', target);
    expect(localStorage.getItem(lessonStoreKey)).toBeNull();
  });
});
