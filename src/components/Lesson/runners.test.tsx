import { resolve } from 'path';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { content as sqlConsultasContent } from '../../lessons/content/sqlConsultas';
import { lessonScore, lessonStoreKey, readLessons } from '../../lessons/progress';
import { LessonContext } from './context';
import { Playground } from './Playground';
import * as pythonRunner from './pythonRunner';
import { explainPythonError } from './pythonRunner';
import { PythonLab, SqlLab, Terminal } from './runners';
import * as sqlRunner from './sqlRunner';
import { explainSqlError, loadSql, runSql } from './sqlRunner';

const stored = () => JSON.parse(localStorage.getItem(lessonStoreKey) || '{}');

describe('Terminal guiado', () => {
  beforeEach(() => localStorage.clear());

  it('aceita o comando esperado, explica o tropeço e registra a sessão', () => {
    render(
      <LessonContext.Provider value={{ lessonId: 'aula-teste' }}>
        <Terminal
          activityId="secao:0"
          block={{
            type: 'terminal',
            title: 'Primeiros comandos',
            steps: [
              {
                goal: 'Mostre a pasta atual',
                command: 'pwd',
                output: '/home/voce',
                hint: 'p de print',
              },
              {
                goal: 'Entre na pasta projeto',
                command: ['cd projeto', 'cd projeto/'],
                prompt: '~/projeto$',
              },
            ],
          }}
        />
      </LessonContext.Provider>,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.submit(input);
    expect(
      screen.getByText(/Esse não é o comando deste passo. Dica: p de print/),
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '  pwd ' } });
    fireEvent.submit(input);
    expect(screen.getByText('/home/voce')).toBeInTheDocument();
    expect(screen.getByText(/Passo 2 de 2/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'cd  projeto/' } });
    fireEvent.submit(screen.getByRole('textbox'));
    expect(screen.getByRole('status')).toHaveTextContent('Sessão concluída');
    expect(stored().lessons['aula-teste'].answers['secao:0']).toBe(false);
  });

  it('só executa por atalho ou botão e conserva a primeira linha errada e as seguintes', () => {
    render(
      <LessonContext.Provider value={{ lessonId: 'aula-teste' }}>
        <Terminal
          activityId="secao:0"
          block={{
            type: 'terminal',
            title: 'Passeio por um servidor',
            steps: [
              { goal: 'Mostre a pasta atual', command: 'pwd', output: '/home/ana' },
              { goal: 'Abra os logs', command: 'cd /var/log', prompt: '/var/log$' },
              { goal: 'Liste os arquivos', command: 'ls', output: 'nginx' },
            ],
          }}
        />
      </LessonContext.Provider>,
    );
    const input = screen.getByRole('textbox', { name: 'Comandos do terminal' });
    fireEvent.change(input, { target: { value: 'pwd\ncd /tmp\nls' } });
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
    expect(screen.getByText('0 de 3')).toBeInTheDocument();
    expect(stored()).toEqual({});

    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
    expect(screen.getByText(/Linha 2: Esse não é o comando/)).toBeInTheDocument();
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    expect(input).toHaveValue('cd /tmp\nls');
    expect(screen.getAllByText('/home/ana')).toHaveLength(1);
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true, repeat: true });
    expect(screen.queryByText(/Linha 1: Esse não é o comando/)).toBeNull();

    fireEvent.change(input, { target: { value: 'ajuda\n\ncd /var/log\nls\nclear' } });
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }));
    expect(screen.getByText(/Objetivo: Abra os logs/)).toBeInTheDocument();
    expect(screen.getByText('nginx')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Linhas que sobraram' })).toHaveValue('clear');
    expect(screen.getByRole('status')).toHaveTextContent('Sessão concluída');
    expect(stored().lessons['aula-teste'].answers['secao:0']).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Recomeçar' }));
    const restarted = screen.getByRole('textbox', { name: 'Comandos do terminal' });
    fireEvent.change(restarted, { target: { value: 'pwd' } });
    fireEvent.keyDown(restarted, { key: 'Enter', metaKey: true });
    expect(screen.getByText('1 de 3')).toBeInTheDocument();

    fireEvent.change(restarted, { target: { value: 'cd /var/log\nls' } });
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Sessão concluída, sem nenhum tropeço.');
    expect(stored().lessons['aula-teste'].answers['secao:0']).toBe(false);
  });

  it('associa a conclusão do terminal à revisão correta mesmo se a revisão mudar montado (Item 20)', () => {
    const block = {
      type: 'terminal' as const,
      title: 'Revisão montada',
      steps: [{ goal: 'Mostre a pasta', command: 'pwd', output: '/home' }],
    };

    const { rerender } = render(
      <LessonContext.Provider value={{ lessonId: 'aula-rev', revision: 1 }}>
        <Terminal activityId="secao:0" block={block} />
      </LessonContext.Provider>,
    );

    const input = screen.getByRole('textbox', { name: 'Comandos do terminal' });
    fireEvent.change(input, { target: { value: 'pwd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }));

    expect(readLessons().lessons['aula-rev'].answers['secao:0']).toBe(true);
    expect(readLessons().lessons['aula-rev'].answerRevisions?.['secao:0']).toBe(1);

    // Troca revisão mantendo o terminal montado e concluído -> preserva tentativa original da revisão 1
    rerender(
      <LessonContext.Provider value={{ lessonId: 'aula-rev', revision: 2 }}>
        <Terminal activityId="secao:0" block={block} />
      </LessonContext.Provider>,
    );
    expect(readLessons().lessons['aula-rev'].answers['secao:0']).toBe(true);
    expect(readLessons().lessons['aula-rev'].answerRevisions?.['secao:0']).toBe(1);

    // Se o registro ainda não existir na nova revisão, o efeito reage à troca de revision
    localStorage.clear();
    rerender(
      <LessonContext.Provider value={{ lessonId: 'aula-rev', revision: 3 }}>
        <Terminal activityId="secao:0" block={block} />
      </LessonContext.Provider>,
    );
    expect(readLessons().lessons['aula-rev'].answers['secao:0']).toBe(true);
    expect(readLessons().lessons['aula-rev'].answerRevisions?.['secao:0']).toBe(3);
  });
});

describe('SQL ao vivo', () => {
  const locate = (file: string) => resolve(__dirname, '../../../node_modules/sql.js/dist', file);
  const setup = `CREATE TABLE produtos (id INTEGER PRIMARY KEY, nome TEXT, preco REAL);
INSERT INTO produtos (nome, preco) VALUES ('Pão', 1.5), ('Café', 12), ('Leite', 6);`;

  it('roda a consulta, lista as tabelas e confere os objetivos', async () => {
    const SQL = await loadSql(locate);
    const run = runSql(SQL, setup, 'SELECT nome FROM produtos WHERE preco > 5 ORDER BY nome;', [
      'return result.rows.map(r => r[0]).join() === "Café,Leite"',
      'return run("SELECT COUNT(*) FROM produtos").rows[0][0] === 3',
      'return /order by/i.test(query)',
    ]);
    expect(run.error).toBeNull();
    expect(run.tables).toEqual([{ name: 'produtos', columns: ['id', 'nome', 'preco'] }]);
    expect(run.checks).toEqual([true, true, true]);
  });

  it('traduz erros comuns e reprova os objetivos', async () => {
    const SQL = await loadSql(locate);
    const run = runSql(SQL, setup, 'SELECT nome FROM produto', ['return true']);
    expect(run.error).toMatch(/Não existe tabela chamada "produto"/);
    expect(run.checks).toEqual([false]);
    expect(explainSqlError('near "FORM": syntax error')).toMatch(/perto de "FORM"/);
  });
});

describe('Python ao vivo', () => {
  it('mostra só a parte do erro que é do aluno, com uma explicação', () => {
    const message = `Traceback (most recent call last):
  File "/lib/python312.zip/_pyodide/_base.py", line 574, in eval_code_async
    await CodeRunner(
  File "<exec>", line 2, in <module>
NameError: name 'nome' is not defined`;
    const explained = explainPythonError(message);
    expect(explained).not.toContain('_pyodide');
    expect(explained).toContain("line 2, in <module>\nNameError: name 'nome' is not defined");
    expect(explained).toContain('O Python não conhece o nome "nome"');
  });
});

describe('Registro da primeira tentativa (Item 3)', () => {
  const locate = (file: string) => resolve(__dirname, '../../../node_modules/sql.js/dist', file);
  const firstSqlBlock = sqlConsultasContent.sections[0].blocks.find(
    (b): b is Extract<typeof b, { type: 'sql' }> =>
      b.type === 'sql' && b.title === 'Sua primeira consulta',
  );

  beforeEach(async () => {
    localStorage.clear();
    const SQL = await loadSql(locate);
    vi.spyOn(sqlRunner, 'loadSql').mockResolvedValue(SQL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderFirstSql(lessonId = 'sql-consultas') {
    if (!firstSqlBlock) throw new Error('Bloco "Sua primeira consulta" não encontrado');
    return render(
      <LessonContext.Provider value={{ lessonId, revision: 1 }}>
        <SqlLab activityId="tabelas-sao-planilhas:3" block={firstSqlBlock} />
      </LessonContext.Provider>,
    );
  }

  it('SQL "Sua primeira consulta": conta acerto de primeira apenas no acerto direto e persiste ao recarregar', async () => {
    // 1. Acerto direto
    const direct = renderFirstSql();
    await screen.findByText('12 linhas');
    // Execução inicial de prévia não registra resposta
    expect(readLessons().lessons['sql-consultas']).toBeUndefined();

    fireEvent.change(screen.getByLabelText('Consulta SQL'), {
      target: { value: 'SELECT cliente, valor FROM pedidos;' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));

    await screen.findByText(/Missão cumprida!/i);
    expect(readLessons().lessons['sql-consultas'].answers['tabelas-sao-planilhas:3']).toBe(true);
    expect(readLessons().lessons['sql-consultas'].completed?.['tabelas-sao-planilhas:3']).toBe(
      true,
    );
    expect(lessonScore(readLessons().lessons['sql-consultas'])).toEqual({ correct: 1, total: 1 });
    direct.unmount();

    // Recarrega a aula -> mantém o mesmo resultado
    const directReload = renderFirstSql();
    await screen.findByText('12 linhas');
    expect(lessonScore(readLessons().lessons['sql-consultas'])).toEqual({ correct: 1, total: 1 });
    directReload.unmount();

    // 2. Erro seguido de acerto
    localStorage.clear();
    const missThenHit = renderFirstSql();
    await screen.findByText('12 linhas');
    fireEvent.change(screen.getByLabelText('Consulta SQL'), {
      target: { value: 'SELECT cliente FROM pedidos;' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    await waitFor(() =>
      expect(readLessons().lessons['sql-consultas']?.answers['tabelas-sao-planilhas:3']).toBe(
        false,
      ),
    );

    fireEvent.change(screen.getByLabelText('Consulta SQL'), {
      target: { value: 'SELECT cliente, valor FROM pedidos;' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    await screen.findByText(/Missão cumprida!/i);
    expect(readLessons().lessons['sql-consultas'].answers['tabelas-sao-planilhas:3']).toBe(false);
    expect(readLessons().lessons['sql-consultas'].completed?.['tabelas-sao-planilhas:3']).toBe(
      true,
    );
    expect(lessonScore(readLessons().lessons['sql-consultas'])).toEqual({ correct: 0, total: 1 });
    missThenHit.unmount();

    // 3. Solução revelada antes de responder
    localStorage.clear();
    const revealFirst = renderFirstSql();
    await screen.findByText('12 linhas');
    fireEvent.click(screen.getByRole('button', { name: /Ver uma solução/i }));
    await screen.findByText(/Solução de exemplo/i);
    expect(readLessons().lessons['sql-consultas'].answers['tabelas-sao-planilhas:3']).toBe(false);
    expect(readLessons().lessons['sql-consultas'].completed?.['tabelas-sao-planilhas:3']).toBe(
      undefined,
    );
    expect(lessonScore(readLessons().lessons['sql-consultas'])).toEqual({ correct: 0, total: 1 });

    // Repetir a demonstração mantém o exercício em aberto.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    });
    expect(screen.getByText(/Solução de exemplo/i)).toBeInTheDocument();
    expect(
      readLessons().lessons['sql-consultas'].completed?.['tabelas-sao-planilhas:3'],
    ).toBeUndefined();

    fireEvent.change(screen.getByLabelText('Consulta SQL'), {
      target: { value: 'SELECT p.cliente, p.valor FROM pedidos AS p;' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    await screen.findByText(/Missão cumprida!/i);
    expect(readLessons().lessons['sql-consultas'].answers['tabelas-sao-planilhas:3']).toBe(false);
    expect(readLessons().lessons['sql-consultas'].completed?.['tabelas-sao-planilhas:3']).toBe(
      true,
    );
    expect(lessonScore(readLessons().lessons['sql-consultas'])).toEqual({ correct: 0, total: 1 });
    revealFirst.unmount();

    // 4. Erro seguido de revelação
    localStorage.clear();
    const missThenReveal = renderFirstSql();
    await screen.findByText('12 linhas');
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    await waitFor(() =>
      expect(readLessons().lessons['sql-consultas']?.answers['tabelas-sao-planilhas:3']).toBe(
        false,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /Ver uma solução/i }));
    await screen.findByText(/Solução de exemplo/i);
    expect(readLessons().lessons['sql-consultas'].answers['tabelas-sao-planilhas:3']).toBe(false);
    expect(readLessons().lessons['sql-consultas'].completed?.['tabelas-sao-planilhas:3']).toBe(
      undefined,
    );
    expect(lessonScore(readLessons().lessons['sql-consultas'])).toEqual({ correct: 0, total: 1 });
    missThenReveal.unmount();
  });

  it('aplica a mesma regra de primeira tentativa em PythonLab e Playground e preserva histórico antigo', async () => {
    // Histórico antigo sem campo `completed` é preservado intacto
    localStorage.setItem(
      lessonStoreKey,
      JSON.stringify({
        schemaVersion: 1,
        credited: [],
        lessons: { 'py-aula': { reached: 1, answers: { 'sec:0': true } } },
      }),
    );

    vi.spyOn(pythonRunner, 'pythonLoaded').mockReturnValue(true);
    const runPythonSpy = vi
      .spyOn(pythonRunner, 'runPython')
      .mockResolvedValueOnce({ output: 'errado\n', error: null, checks: [false] })
      .mockResolvedValueOnce({ output: '42\n', error: null, checks: [true] });

    const pyBlock = {
      type: 'python' as const,
      title: 'Soma simples',
      code: 'print(0)',
      solution: 'print(42)',
      checks: [{ label: 'Imprime 42', test: 'return output.trim() === "42"' }],
    };

    // Preserva histórico antigo em sec:0 mesmo revelando solução
    const preserved = render(
      <LessonContext.Provider value={{ lessonId: 'py-aula', revision: 1 }}>
        <PythonLab activityId="sec:0" block={pyBlock} />
      </LessonContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ver uma solução/i }));
    expect(readLessons().lessons['py-aula'].answers['sec:0']).toBe(true);
    preserved.unmount();

    // Em uma atividade nova (sec:1), erro seguido de acerto grava answers=false e completed=true
    const freshPy = render(
      <LessonContext.Provider value={{ lessonId: 'py-aula', revision: 1 }}>
        <PythonLab activityId="sec:1" block={pyBlock} />
      </LessonContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    await waitFor(() => expect(readLessons().lessons['py-aula'].answers['sec:1']).toBe(false));
    fireEvent.change(screen.getByLabelText('Código Python'), { target: { value: 'print(42)' } });
    fireEvent.click(screen.getByRole('button', { name: /Executar/i }));
    await screen.findByText(/Missão cumprida!/i);
    expect(readLessons().lessons['py-aula'].answers['sec:1']).toBe(false);
    expect(readLessons().lessons['py-aula'].completed?.['sec:1']).toBe(true);
    expect(runPythonSpy).toHaveBeenCalledTimes(2);
    freshPy.unmount();

    // Em Playground, revelar a solução grava answers=false imediatamente
    render(
      <LessonContext.Provider value={{ lessonId: 'play-aula', revision: 1 }}>
        <Playground
          activityId="play:0"
          block={{
            type: 'playground',
            title: 'Título HTML',
            html: '<p>oi</p>',
            solution: { html: '<h1>oi</h1>' },
            checks: [{ label: 'Tem h1', test: 'return !!document.querySelector("h1")' }],
          }}
        />
      </LessonContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ver uma solução/i }));
    expect(readLessons().lessons['play-aula'].answers['play:0']).toBe(false);
    expect(readLessons().lessons['play-aula'].completed?.['play:0']).toBeUndefined();
  });
});
