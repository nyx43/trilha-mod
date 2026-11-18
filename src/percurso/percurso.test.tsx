import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { reviewStoreKey } from '../lessons/progress';
import PercursoPage from '../pages/PercursoPage';
import { apiReactTailwindPercurso } from './apiReactTailwind';
import { percursoStoreKey } from './progress';

function renderPercurso(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/percurso/:id" element={<PercursoPage />} />
        <Route path="/percurso/:id/:etapa" element={<PercursoPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Percurso curto API Node, React e Tailwind', () => {
  beforeEach(() => localStorage.clear());

  it('referencia somente seções e cartões existentes nas aulas originais e na aula nova', async () => {
    for (const stage of apiReactTailwindPercurso.stages) {
      if (stage.kind !== 'lesson') continue;
      const { content } = await stage.load();
      const availableSections = new Set(content.sections.map((section) => section.id));
      for (const id of stage.sectionIds) {
        expect(availableSections.has(id)).toBe(true);
      }
      if (stage.cardIds) {
        const availableCards = new Set(content.cards.map((card) => card.id));
        for (const id of stage.cardIds) {
          expect(availableCards.has(id)).toBe(true);
        }
      }
    }
  });

  it('exibe as 5 etapas no índice inicial do percurso', () => {
    renderPercurso('/percurso/api-react-tailwind');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /API Node, requisições no React, integração e Tailwind na prática/,
      }),
    ).toBeInTheDocument();
    const list = screen.getByRole('heading', { name: /Etapas do percurso/ }).closest('section') as HTMLElement;
    expect(within(list).getByRole('link', { name: /Node\.js e Express/ })).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /Requisições no React/ })).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /Integração entre frontend e API/ })).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /Tailwind na prática/ })).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /Missão final/ })).toBeInTheDocument();
  });

  it('carrega somente as seções de requisições no React e registra conclusão da etapa', async () => {
    renderPercurso('/percurso/api-react-tailwind/requisicoes-react');
    expect(
      await screen.findByRole('heading', { name: /Buscar dados quando a tela abre/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Rotas com React Router/ })).not.toBeInTheDocument();

    const toc = screen.getByRole('navigation', { name: 'Nesta etapa' });
    fireEvent.click(within(toc).getByText('Fechamento'));
    expect(screen.queryByRole('heading', { name: 'Fechamento' })).not.toBeInTheDocument();
    expect(screen.getByText('0% da etapa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuar: Respostas fora de ordem/ }));
    expect(screen.getByRole('heading', { name: /Respostas fora de ordem/ })).toBeInTheDocument();
    expect(screen.getByText('25% da etapa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar todas as seções' }));
    expect(screen.getByRole('heading', { name: /Respostas fora de ordem/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Quando usar uma biblioteca de dados/ }),
    ).toBeInTheDocument();
    fireEvent.click(within(toc).getByRole('link', { name: 'Fechamento' }));
    expect(screen.getByRole('heading', { name: 'Fechamento' })).toHaveFocus();
    expect(screen.getByText('25% da etapa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Concluir etapa' }));
    const storedPercurso = JSON.parse(localStorage.getItem(percursoStoreKey) || '{}');
    expect(storedPercurso.completed['api-react-tailwind']).toContain('requisicoes-react');

    const storedReview = JSON.parse(localStorage.getItem(reviewStoreKey) || '{}');
    expect(Object.keys(storedReview.cards)).toContain(
      'react-rotas-e-requisicoes:quatro-estados-react',
    );
  });

  it('retoma o avanço parcial após recarregar e mantém a conclusão', async () => {
    const oldRecord = { schemaVersion: 1, completed: { 'api-react-tailwind': ['node-e-express'] } };
    localStorage.setItem(percursoStoreKey, JSON.stringify(oldRecord));
    const path = '/percurso/api-react-tailwind/requisicoes-react';
    const firstView = renderPercurso(path);

    await screen.findByRole('heading', { name: /Buscar dados quando a tela abre/ });
    fireEvent.click(screen.getByRole('button', { name: /Continuar: Respostas fora de ordem/ }));
    expect(screen.getByText('25% da etapa')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(percursoStoreKey) || '{}')).toMatchObject({
      completed: oldRecord.completed,
      reached: { 'api-react-tailwind': { 'requisicoes-react': 1 } },
    });
    firstView.unmount();

    const resumed = renderPercurso(path);
    expect(await screen.findByRole('heading', { name: /Respostas fora de ordem/ })).toBeInTheDocument();
    expect(screen.getByText('25% da etapa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continuar: Quando usar uma biblioteca de dados/ }));
    expect(screen.getByText('50% da etapa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o fechamento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir etapa' }));
    expect(JSON.parse(localStorage.getItem(percursoStoreKey) || '{}').completed['api-react-tailwind'])
      .toEqual(['node-e-express', 'requisicoes-react']);
    resumed.unmount();

    renderPercurso(path);
    await screen.findByRole('heading', { name: 'Fechamento' });
    expect(screen.getByText('Etapa concluída')).toBeInTheDocument();
  });

  it('permite mostrar todas as seções e abrir uma seção diretamente sem salvar avanço', async () => {
    const path = '/percurso/api-react-tailwind/requisicoes-react';
    const firstView = renderPercurso(path);
    await screen.findByRole('heading', { name: /Buscar dados quando a tela abre/ });
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar todas as seções' }));
    expect(screen.getByRole('heading', { name: /Quando usar uma biblioteca de dados/ })).toBeInTheDocument();
    expect(screen.getByText('0% da etapa')).toBeInTheDocument();
    expect(localStorage.getItem(percursoStoreKey)).toBeNull();
    firstView.unmount();

    const directView = renderPercurso(`${path}#bibliotecas-de-dados`);
    expect(await screen.findByRole('heading', { name: /Quando usar uma biblioteca de dados/ })).toBeInTheDocument();
    expect(screen.getByText('0% da etapa')).toBeInTheDocument();
    expect(localStorage.getItem(percursoStoreKey)).toBeNull();
    directView.unmount();

    renderPercurso(path);
    await screen.findByRole('heading', { name: /Buscar dados quando a tela abre/ });
    expect(screen.queryByRole('heading', { name: /Quando usar uma biblioteca de dados/ })).not.toBeInTheDocument();
    expect(screen.getByText('0% da etapa')).toBeInTheDocument();
  });

  it('guarda o avanço separadamente para cada etapa', async () => {
    const react = renderPercurso('/percurso/api-react-tailwind/requisicoes-react');
    await screen.findByRole('heading', { name: /Buscar dados quando a tela abre/ });
    fireEvent.click(screen.getByRole('button', { name: /Continuar: Respostas fora de ordem/ }));
    react.unmount();

    const tailwind = renderPercurso('/percurso/api-react-tailwind/tailwind-na-pratica');
    await screen.findByRole('heading', { name: /Classes utilitárias no lugar de CSS espalhado/ });
    expect(screen.getByText('0% da etapa')).toBeInTheDocument();
    tailwind.unmount();

    renderPercurso('/percurso/api-react-tailwind/requisicoes-react');
    await screen.findByRole('heading', { name: /Respostas fora de ordem/ });
    expect(screen.getByText('25% da etapa')).toBeInTheDocument();
  });

  it('apresenta a aula Tailwind na prática com pergunta inicial, feedback, cartões e missão', async () => {
    renderPercurso('/percurso/api-react-tailwind/tailwind-na-pratica');
    expect(
      await screen.findByRole('heading', { name: /Classes utilitárias no lugar de CSS espalhado/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pergunta inicial:/)).toBeInTheDocument();

    const quiz = screen
      .getByText(/é melhor do que colocar/i)
      .closest('section') as HTMLElement;
    fireEvent.click(within(quiz).getByRole('button', { name: /não existe no Tailwind/i }));
    expect(within(quiz).getByRole('status')).toHaveTextContent(/Ainda não/);

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar todas as seções' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Fechamento/ })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Cartões de revisão/)).toBeInTheDocument();
    expect(
      screen.getByText(/Monte o Painel de Oficinas real com React \+ Vite \+ Tailwind/),
    ).toBeInTheDocument();
  });

  it('mostra o contrato GET/POST /heroes, critérios e checklist dos dois links na missão final', () => {
    renderPercurso('/percurso/api-react-tailwind/missao-final');
    expect(screen.getByText(/Nome, universo e poder são obrigatórios/)).toBeInTheDocument();
    expect(screen.getByText(/Critérios para saber se você conseguiu/)).toBeInTheDocument();
    expect(screen.getByText(/Checklist dos dois links pedidos pelo professor/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Concluir percurso' }));
    const storedPercurso = JSON.parse(localStorage.getItem(percursoStoreKey) || '{}');
    expect(storedPercurso.completed['api-react-tailwind']).toContain('missao-final');
  });

  it('oferece diagnóstico opcional sem mudar o progresso salvo', () => {
    const saved = JSON.stringify({ schemaVersion: 1, completed: { 'api-react-tailwind': ['integracao-front-api', 'tailwind-na-pratica'] } });
    localStorage.setItem(percursoStoreKey, saved);
    const view = renderPercurso('/percurso/api-react-tailwind');
    expect(screen.getByText('2 de 5 etapas concluídas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Prática opcional: diagnóstico/ }));
    expect(screen.getByRole('heading', { name: 'Rota errada (404)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cadastro rejeitado (400)' })).toBeInTheDocument();
    const solutions = screen.getAllByText('Solução — abra depois de tentar');
    expect(solutions).toHaveLength(2);
    expect(solutions.every((summary) => !summary.closest('details')?.open)).toBe(true);
    fireEvent.click(screen.getAllByText('Dica 1')[0]);
    expect(localStorage.getItem(percursoStoreKey)).toBe(saved);
    view.unmount();
  });

});
