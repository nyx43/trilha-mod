// @vitest-environment node
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { roadmapCatalogs } from '../../scripts/catalogPlugin';
import { courses } from './courses';
import { deriveCourses } from './deriveCourses';
import { lessons } from '.';

const file = resolve(__dirname, 'courses.ts');
const derived = deriveCourses(roadmapCatalogs(), lessons);
const rustModules = derived
  .find(({ id }) => id === 'rust')
  ?.modules.filter(({ lessonIds }) => lessonIds.some((id) => id.startsWith('rust-')));

it('cada trilha tem um curso que segue a ordem da própria trilha', () => {
  if (process.env.UPDATE_COURSES) {
    const source = readFileSync(file, 'utf8');
    const head = source.slice(0, source.indexOf('export const courses'));
    writeFileSync(
      file,
      `${head}export const courses: Course[] = ${JSON.stringify(derived, null, 2)};\n`,
    );
    return;
  }
  expect(courses).toEqual(derived);
});

it('lista dez aulas próprias de Rust no módulo iniciante, até a entrega no terminal', () => {
  const beginner = rustModules?.[0];
  expect(beginner?.title).toBe('Fundamentos de Rust');
  expect(beginner?.lessonIds).toHaveLength(10);
  expect(beginner?.lessonIds.every((id) => id.startsWith('rust-'))).toBe(true);
  expect(beginner?.lessonIds[0]).toBe('rust-do-zero');
  expect(beginner?.lessonIds[9]).toBe('rust-entrega-no-terminal');
});

it('organiza dez aulas intermediárias de Rust nos módulos que apresentam as missões', () => {
  const intermediate = rustModules?.slice(1, 5);
  expect(intermediate?.map(({ title, lessonIds }) => [title, lessonIds.length])).toEqual([
    ['Projeto: Diagnóstico de um catálogo legado', 2],
    ['Bibliotecas, testes e revisão', 3],
    ['Concorrência e desempenho', 3],
    ['API, banco e critérios de aceite', 2],
  ]);
  expect(
    intermediate?.flatMap(({ lessonIds }) => lessonIds).every((id) => id.startsWith('rust-')),
  ).toBe(true);
});

it('organiza dez aulas avançadas de Rust até o projeto final', () => {
  const advanced = rustModules?.slice(5);
  expect(advanced?.map(({ title, lessonIds }) => [title, lessonIds.length])).toEqual([
    ['APIs estáveis e interoperabilidade', 3],
    ['Concorrência, observabilidade e desempenho', 3],
    ['Integridade, testes de API e migrações', 3],
    ['Projeto: Entrega do catálogo de estudos', 1],
  ]);
  expect(advanced?.[0].lessonIds[0]).toBe('rust-api-de-dados-emprestados');
  expect(advanced?.[3].lessonIds[0]).toBe('rust-entrega-de-producao');
  const rustLessonIds = rustModules?.flatMap(({ lessonIds }) => lessonIds);
  expect(rustLessonIds?.every((id) => id.startsWith('rust-'))).toBe(true);
  expect(new Set(rustLessonIds).size).toBe(30);
});
