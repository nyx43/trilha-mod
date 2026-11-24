import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const drafts = '.cache/editorial/drafts';
const voices = ['santa', 'dora'];
const usage = `Uso:
  npm run aula -- nova <id> --titulo "<título>" --trilha <trilha> --grupo <grupo>
  npm run aula -- revisar <id> --trilha <trilha>
  npm run aula -- verificar <id>
  npm run aula -- previa <id> [--porta 5188]`;

function starter(title) {
  return {
    revision: 1,
    hook: `O que você precisa saber antes de estudar ${title}? Comece com uma previsão.`,
    sections: [
      {
        id: 'primeiro-exemplo',
        title: 'Primeiro exemplo',
        blocks: [
          {
            type: 'text',
            text: 'Descreva um caso concreto e explique como o resultado foi obtido.',
          },
          {
            type: 'quiz',
            activityId: 'atividade-primeira-previsao',
            question: 'Como você pode conferir uma previsão?',
            options: [
              {
                text: 'Definir o que observar.',
                correct: true,
                feedback: 'Assim você pode comparar a previsão com o resultado.',
              },
              {
                text: 'Aceitar a previsão imediatamente.',
                feedback: 'Escolha algo observável para conferir primeiro.',
              },
            ],
          },
        ],
      },
    ],
    recap: ['Escreva o que o estudante deve conseguir explicar sozinho.'],
    cards: [
      {
        id: 'previsao',
        front: 'O que torna uma previsão verificável?',
        back: 'Um resultado observável.',
      },
    ],
    mission: {
      title: 'Aplique em outro caso',
      text: 'Proponha uma variação do exemplo.',
      steps: ['Escreva a previsão.', 'Compare com o resultado.'],
    },
  };
}

function contentIds(content, scoredBlockTypes) {
  if (!content?.sections?.length) throw new Error('A aula precisa de pelo menos uma seção.');
  const sections = new Set(['fechamento']);
  const activities = new Set();
  const cards = new Set();
  function add(used, id, label) {
    if (typeof id !== 'string' || !id.trim() || used.has(id))
      throw new Error(`${label} ausente ou duplicado: ${id}`);
    used.add(id);
  }
  for (const section of content.sections) {
    add(sections, section.id, 'ID de seção');
    for (const block of section.blocks) {
      if (scoredBlockTypes.has(block.type)) add(activities, block.activityId, 'ID de exercício');
    }
  }
  for (const card of content.cards) add(cards, card.id, 'ID de cartão');
  sections.delete('fechamento');
  return { sections, activities };
}

async function narrationChanges(script) {
  const directory = join(root, 'public/narration', script.lessonId);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const old = new Map((manifest?.clips ?? []).map((clip) => [clip.id, clip]));
  const result = {
    novos: [],
    desatualizados: [],
    removidos: [],
    reaproveitáveis: 0,
    semCobertura: script.uncoveredBlocks,
  };
  for (const clip of script.clips) {
    const existing = old.get(clip.id);
    old.delete(clip.id);
    if (!existing) {
      result.novos.push(clip.id);
      continue;
    }
    const reasons = [];
    if (['textHash', 'pauseAfter', 'interactiveKind'].some((key) => existing[key] !== clip[key]))
      reasons.push('roteiro ou comportamento alterado');
    for (const voice of voices) {
      const audio = existing.audio?.[voice];
      const info =
        audio?.src?.startsWith(`${voice}/`) && !audio.src.split('/').includes('..')
          ? await stat(join(directory, audio.src)).catch(() => undefined)
          : undefined;
      if (!info?.isFile() || !info.size || info.size !== audio.bytes)
        reasons.push(`arquivo de ${voice} ausente ou incompleto`);
    }
    if (reasons.length) result.desatualizados.push({ id: clip.id, motivos: reasons });
    else result.reaproveitáveis++;
  }
  result.removidos.push(...old.keys());
  return result;
}

async function prepare(command, id, flags, server) {
  const { lessons } = await server.ssrLoadModule('/src/lessons/index.ts');
  const { roadmapCatalogs } = await server.ssrLoadModule('/scripts/catalogPlugin.ts');
  const { deriveCourses } = await server.ssrLoadModule('/src/lessons/deriveCourses.ts');
  const { scoredBlockTypes } = await server.ssrLoadModule('/src/lessons/types.ts');
  const { extractLessonNarrationSpec } = await server.ssrLoadModule('/src/narration/extractor.ts');
  const catalogs = roadmapCatalogs();
  const published = lessons.find((lesson) => lesson.id === id);
  const original = published && (await published.load()).content;
  const draftPath = join(root, drafts, `${id}.ts`);

  if (command === 'nova' || command === 'revisar') {
    const title = flags.titulo?.trim();
    const revising = command === 'revisar';
    if (revising && !published) throw new Error('Aula publicada não encontrada.');
    if (!revising && published) throw new Error('O ID já pertence ao catálogo. Use revisar.');
    if (!revising && (!title || !flags.grupo)) throw new Error('Informe título e grupo.');
    const meta = revising
      ? { ...published, load: undefined }
      : {
          id,
          title,
          summary: title,
          minutes: 10,
          groupIds: [flags.grupo],
          objectives: ['Descreva o que o estudante será capaz de fazer.'],
          updatedAt: new Date().toISOString().slice(0, 10),
        };
    const catalog = catalogs.find((item) => item.id === flags.trilha);
    if (!catalog || !meta.groupIds.some((group) => Object.hasOwn(catalog.groups, group)))
      throw new Error('Selecione uma trilha que contenha o grupo da aula.');
    const content = revising
      ? { ...original, revision: (original.revision ?? 1) + 1 }
      : starter(title);
    await mkdir(join(root, drafts), { recursive: true });
    const file = [
      "import type { LessonContent, LessonMeta } from '../../../src/lessons/types';",
      `export const courseId = ${JSON.stringify(flags.trilha)};`,
      `export const meta: Omit<LessonMeta, 'load'> = ${JSON.stringify(meta, null, 2)};`,
      `export const content: LessonContent = ${JSON.stringify(content, null, 2)};`,
      '',
    ].join('\n\n');
    try {
      await writeFile(draftPath, file, { flag: 'wx' });
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error(`Já existe um rascunho em ${draftPath}`);
      throw error;
    }
  }

  const { meta, courseId, content } = await server.ssrLoadModule(`/${drafts}/${id}.ts`);
  if (meta?.id !== id) throw new Error('O ID precisa corresponder ao nome do rascunho.');
  if (!meta.title?.trim() || !meta.groupIds?.length) throw new Error('Informe título e grupos.');
  for (const group of meta.groupIds) {
    if (!catalogs.some((catalog) => Object.hasOwn(catalog.groups, group)))
      throw new Error(`Grupo inexistente: ${group}`);
  }
  const minimumRevision = original ? (original.revision ?? 1) + 1 : 1;
  if (!Number.isInteger(content?.revision) || content.revision < minimumRevision)
    throw new Error(`A revisão deve ser um inteiro a partir de ${minimumRevision}.`);

  const next = contentIds(content, scoredBlockTypes);
  const previous = original && contentIds(original, scoredBlockTypes);
  const draftMeta = { ...meta, load: async () => ({ content }) };
  const candidates = published
    ? lessons.map((lesson) => (lesson.id === id ? draftMeta : lesson))
    : [...lessons, draftMeta];
  const courses = deriveCourses(catalogs, candidates);
  const course = courses.find((item) => item.id === courseId);
  const module = course?.modules.find((item) => item.lessonIds.includes(id));
  if (!module) throw new Error('A aula não pertence à trilha selecionada.');
  const order = course.modules.flatMap((item) => item.lessonIds);
  const index = order.indexOf(id);
  const diff = (after, before = new Set()) => ({
    novos: [...after].filter((key) => !before.has(key)),
    removidos: [...before].filter((key) => !after.has(key)),
  });
  const report = {
    rascunho: draftPath,
    revisão: content.revision,
    lugar: {
      trilha: course.title,
      módulo: module.title,
      posição: index + 1,
      total: order.length,
      anterior: order[index - 1] ?? null,
      próxima: order[index + 1] ?? null,
    },
    seções: diff(next.sections, previous?.sections),
    exercícios: diff(next.activities, previous?.activities),
    narração: await narrationChanges(extractLessonNarrationSpec(meta, content)),
  };
  return { courseId, courses, draftPath, published, report };
}

async function preview(id, draft, rawPort) {
  const port = Number(rawPort ?? 5188);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Informe uma porta entre 1024 e 65535.');
  const scratch = await mkdtemp(join(tmpdir(), 'trilha-aula-'));
  let server;
  try {
    const files = [
      'src',
      'scripts',
      'server',
      'api',
      'translation',
      'package.json',
      'index.html',
      'tsconfig.json',
      'tsconfig.node.json',
      'tailwind.config.js',
      'postcss.config.js',
      'vite.config.ts',
    ];
    for (const file of files) await cp(join(root, file), join(scratch, file), { recursive: true });
    await symlink(join(root, 'node_modules'), join(scratch, 'node_modules'), 'dir');
    await mkdir(join(scratch, 'public'));
    for (const name of await readdir(join(root, 'public'))) {
      await symlink(join(root, 'public', name), join(scratch, 'public', name));
    }
    const contentSource = (await readFile(draft.draftPath, 'utf8')).replace(
      '../../../src/lessons/types',
      '../types',
    );
    await writeFile(join(scratch, 'src/lessons/content/__rascunho.ts'), contentSource, {
      flag: 'wx',
    });
    const indexPath = join(scratch, 'src/lessons/index.ts');
    const indexSource = await readFile(indexPath, 'utf8');
    const marker = 'const byId = new Map';
    if (!indexSource.includes(marker)) throw new Error('A estrutura do índice mudou.');
    const registration = [
      "import { meta as draftMeta } from './content/__rascunho';",
      "const draftLesson: LessonMeta = { ...draftMeta, load: () => import('./content/__rascunho') };",
      draft.published
        ? 'lessons.splice(lessons.findIndex(({ id }) => id === draftLesson.id), 1, draftLesson);'
        : 'lessons.push(draftLesson);',
      '',
    ].join('\n');
    await writeFile(indexPath, indexSource.replace(marker, registration + marker));
    const coursesPath = join(scratch, 'src/lessons/courses.ts');
    const coursesSource = await readFile(coursesPath, 'utf8');
    const start = coursesSource.indexOf('export const courses');
    if (start < 0) throw new Error('A estrutura dos cursos mudou.');
    await writeFile(
      coursesPath,
      coursesSource.slice(0, start) +
        `export const courses: Course[] = ${JSON.stringify(draft.courses, null, 2)};\n`,
    );

    server = await createServer({
      root: scratch,
      envDir: scratch,
      cacheDir: join(scratch, '.vite'),
      server: {
        host: '127.0.0.1',
        port,
        strictPort: true,
        fs: { allow: [scratch, join(root, 'node_modules'), join(root, 'public')] },
      },
    });
    await server.listen();
    console.log(
      `Prévia: http://127.0.0.1:${port}/aula/${id}?trilha=${encodeURIComponent(draft.courseId)}`,
    );
    console.log('Após editar o arquivo, encerre e reabra a prévia.');
    await new Promise((done) => {
      const stop = () => {
        process.off('SIGINT', stop);
        process.off('SIGTERM', stop);
        done();
      };
      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);
    });
  } finally {
    await server?.close();
    await rm(scratch, { recursive: true, force: true });
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      titulo: { type: 'string' },
      trilha: { type: 'string' },
      grupo: { type: 'string' },
      porta: { type: 'string' },
      ajuda: { type: 'boolean' },
    },
  });
  const [command, id] = positionals;
  if (values.ajuda || !command) return console.log(usage);
  if (!['nova', 'revisar', 'verificar', 'previa'].includes(command) || positionals.length !== 2)
    throw new Error(usage);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Use um ID como exemplo-da-aula.');
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
  });
  let draft;
  try {
    draft = await prepare(command, id, values, server);
  } finally {
    await server.close();
  }
  if (command === 'verificar') console.log(JSON.stringify(draft.report, null, 2));
  else if (command === 'previa') await preview(id, draft, values.porta);
  else {
    console.log(`Rascunho: ${draft.draftPath}`);
    console.log(`Confira: npm run aula -- verificar ${id}`);
    console.log(`Abra: npm run aula -- previa ${id}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
