import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const args = {
    lesson: 'integracao-front-e-api',
    all: false,
    auditCatalog: false,
    outDir: path.join(repoRoot, '.cache', 'narration'),
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--all') {
      args.all = true;
    } else if (token === '--audit-catalog') {
      args.auditCatalog = true;
    } else if (token === '--lesson' && argv[i + 1]) {
      args.lesson = argv[i + 1];
      i += 1;
    } else if (token === '--out-dir' && argv[i + 1]) {
      args.outDir = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const vite = await createServer({
    configFile: false,
    root: repoRoot,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
  });

  try {
    const { lessons } = await vite.ssrLoadModule('/src/lessons/index.ts');
    const { extractLessonNarrationSpec } = await vite.ssrLoadModule('/src/narration/extractor.ts');

    const scriptsDir = path.join(args.outDir, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });

    const targets = args.all || args.auditCatalog ? lessons : lessons.filter((l) => l.id === args.lesson);
    if (targets.length === 0) {
      throw new Error(`Lesson not found in catalog: ${args.lesson}`);
    }

    const blockTypeStats = new Map();
    const uncoveredByType = new Map();
    const lessonSummaries = [];

    for (const lesson of targets) {
      const loaded = await lesson.load();
      const content = loaded.content ?? loaded.default ?? loaded;
      const script = extractLessonNarrationSpec(lesson, content);

      if (args.all || lesson.id === args.lesson) {
        const outPath = path.join(scriptsDir, `${lesson.id}.script.json`);
        fs.writeFileSync(outPath, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
      }

      for (const section of content.sections) {
        for (const block of section.blocks) {
          blockTypeStats.set(block.type, (blockTypeStats.get(block.type) ?? 0) + 1);
        }
      }
      for (const u of script.uncoveredBlocks) {
        uncoveredByType.set(u.blockType, (uncoveredByType.get(u.blockType) ?? 0) + 1);
      }

      const words = script.clips.reduce(
        (acc, c) => acc + c.fields.reduce((fa, f) => fa + f.text.trim().split(/\s+/).filter(Boolean).length, 0),
        0,
      );
      lessonSummaries.push({
        lessonId: lesson.id,
        title: lesson.title,
        clips: script.clips.length,
        words,
        uncoveredCount: script.uncoveredBlocks.length,
      });
    }

    if (args.auditCatalog) {
      const audit = {
        totalLessons: targets.length,
        lessonIds: lessonSummaries.map((lesson) => lesson.lessonId),
        deferredLessonIds: targets
          .filter((lesson) => lesson.narration === 'deferred')
          .map((lesson) => lesson.id),
        totalClips: lessonSummaries.reduce((a, b) => a + b.clips, 0),
        totalWords: lessonSummaries.reduce((a, b) => a + b.words, 0),
        blockTypes: Object.fromEntries([...blockTypeStats.entries()].sort((a, b) => b[1] - a[1])),
        uncoveredBlockTypes: Object.fromEntries(
          [...uncoveredByType.entries()].sort((a, b) => b[1] - a[1]),
        ),
        lessonsWithUncovered: lessonSummaries.filter((l) => l.uncoveredCount > 0),
      };
      const auditPath = path.join(args.outDir, 'catalog-audit.json');
      fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
      console.log(
        `Catalog audit: ${audit.totalLessons} lessons, ${audit.totalClips} clips, ${audit.totalWords} words. Saved to ${auditPath}`,
      );
      console.log('Block types:', audit.blockTypes);
      console.log('Uncovered block types:', audit.uncoveredBlockTypes);
    } else {
      for (const summary of lessonSummaries) {
        console.log(
          `Exported ${summary.lessonId}: ${summary.clips} clips, ${summary.words} words, ${summary.uncoveredCount} uncovered blocks -> ${path.join(scriptsDir, `${summary.lessonId}.script.json`)}`,
        );
      }
    }
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
