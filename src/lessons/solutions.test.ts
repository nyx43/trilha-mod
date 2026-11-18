import { spawnSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { loadSql, runSql } from '../components/Lesson/sqlRunner';
import { lessons } from '.';
import { LessonBlock } from './types';

type Runnable = Extract<LessonBlock, { type: 'sql' | 'python' }>;

const blocks: Array<[string, Runnable]> = [];

beforeAll(async () => {
  for (const lesson of lessons) {
    const content = await lesson.load().then(
      (module) => module.content,
      () => undefined,
    );
    content?.sections.forEach((section) =>
      section.blocks.forEach((block, index) => {
        if ((block.type === 'sql' || block.type === 'python') && block.checks?.length)
          blocks.push([`${lesson.id} › ${section.id}[${index}]`, block]);
      }),
    );
  }
});

const pythonHarness = `
import builtins, contextlib, io, json, sys
data = json.loads(sys.argv[1])
def no_input(*args):
    raise RuntimeError('input() não funciona aqui')
builtins.input = no_input
out = io.StringIO()
scope = {}
error = None
try:
    with contextlib.redirect_stdout(out):
        exec(data['code'], scope)
except Exception as failure:
    error = repr(failure)
scope['__saida__'] = out.getvalue()
scope['__codigo__'] = data['code']
checks = []
for test in data['tests']:
    try:
        checks.append(False if error else bool(eval(test, scope)))
    except Exception:
        checks.append(False)
print(json.dumps({'error': error, 'checks': checks}))
`;

const hasPython = spawnSync('python3', ['--version']).status === 0;

function runPythonLocally(code: string, tests: string[], where: string) {
  const cwd = mkdtempSync(join(tmpdir(), 'trilha-python-'));
  try {
    const run = spawnSync('python3', ['-c', pythonHarness, JSON.stringify({ code, tests })], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 8000,
      encoding: 'utf8',
    });
    if (run.error || run.status !== 0) {
      throw new Error(
        `${where}: execução do Python interrompida (${
          run.error?.message ?? run.signal ?? run.status
        }). ${run.stderr ?? ''}`,
      );
    }
    const last = run.stdout.trim().split('\n').pop();
    if (!last) throw new Error(`${where}: o teste do Python não produziu um resultado.`);
    return JSON.parse(last) as { error: string | null; checks: boolean[] };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

describe('Exercícios de SQL e Python', () => {
  it('a solução cumpre todos os objetivos e o código inicial não', async () => {
    const SQL = await loadSql((file) => resolve(__dirname, '../../node_modules/sql.js/dist', file));
    const failures: string[] = [];
    for (const [where, block] of blocks) {
      const tests = (block.checks || []).map((check) => check.test);
      if (block.type === 'python' && !hasPython) continue;
      const attempt = (code: string) =>
        block.type === 'sql'
          ? runSql(SQL, block.setup, code, tests)
          : runPythonLocally(code, tests, where);
      const solved = attempt(block.solution || '');
      if (solved.error) failures.push(`${where}: a solução dá erro (${solved.error})`);
      solved.checks.forEach((ok, index) => {
        if (!ok) failures.push(`${where}: a solução não cumpre "${block.checks?.[index].label}"`);
      });
      const starter = attempt(block.type === 'sql' ? block.query : block.code);
      if (starter.checks.length && starter.checks.every(Boolean))
        failures.push(`${where}: o código inicial já cumpre todos os objetivos`);
    }
    expect(failures).toEqual([]);
  }, 60000);
});
