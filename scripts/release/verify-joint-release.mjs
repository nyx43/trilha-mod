import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function collectFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, predicate, acc);
    else if (entry.isFile() && predicate(full)) acc.push(full);
  }
  return acc;
}

const FORBIDDEN_ANDROID_STRINGS = [
  { label: 'Google Fonts CDN', pattern: /fonts\.googleapis\.com/ },
  { label: 'jsDelivr CDN', pattern: /cdn\.jsdelivr\.net/ },
  { label: 'Cloudflare Turnstile Client', pattern: /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/ },
  { label: 'Google Tag Manager', pattern: /googletagmanager\.com/ },
  { label: 'Lesson Tutor API', pattern: /\/api\/lesson-tutor/ },
];

const REQUIRED_VENDOR_FILES = [
  'vendor/playground/react.development.js',
  'vendor/playground/react-dom.development.js',
  'vendor/playground/babel.min.js',
  'vendor/pyodide/pyodide.js',
  'vendor/pyodide/pyodide.asm.js',
  'vendor/pyodide/pyodide.asm.wasm',
  'vendor/pyodide/python_stdlib.zip',
  'vendor/pyodide/pyodide-lock.json',
];

export function verifyJointRelease({
  webDir,
  androidWebDir,
  expectedContentVersion,
  audioMode = 'bundled',
}) {
  const errors = [];
  const summary = {
    expectedContentVersion,
    audioMode,
    webIndexHash: null,
    androidIndexHash: null,
    narrationLessonsChecked: 0,
    androidBundleFilesChecked: 0,
  };

  if (!fs.existsSync(webDir)) errors.push(`Web build dir missing: ${webDir}`);
  if (!fs.existsSync(androidWebDir)) errors.push(`Android web dir missing: ${androidWebDir}`);
  if (errors.length) return { ok: false, errors, summary };

  // 1. Compare generated catalog index.json between Web and Android
  const webCatalogIndex = path.join(webDir, 'data/index.json');
  const androidCatalogIndex = path.join(androidWebDir, 'data/index.json');
  if (!fs.existsSync(webCatalogIndex) || !fs.existsSync(androidCatalogIndex)) {
    errors.push('Missing data/index.json in web or android build.');
  } else {
    const webData = JSON.parse(fs.readFileSync(webCatalogIndex, 'utf8'));
    const androidData = JSON.parse(fs.readFileSync(androidCatalogIndex, 'utf8'));
    summary.webIndexHash = hashFile(webCatalogIndex);
    summary.androidIndexHash = hashFile(androidCatalogIndex);
    if (JSON.stringify(webData.roadmaps) !== JSON.stringify(androidData.roadmaps)) {
      errors.push('Catalog roadmaps mismatch between web and android builds.');
    }
  }

  // 2. Verify contentVersion appears in both built bundles
  const webAssets = collectFiles(path.join(webDir, 'assets'), (f) => f.endsWith('.js'));
  const androidAssets = collectFiles(
    path.join(androidWebDir, 'assets'),
    (f) => f.endsWith('.js') || f.endsWith('.css'),
  );
  summary.androidBundleFilesChecked = androidAssets.length;

  const webHasVersion = webAssets.some((f) =>
    fs.readFileSync(f, 'utf8').includes(expectedContentVersion),
  );
  const androidHasVersion = androidAssets.some((f) =>
    fs.readFileSync(f, 'utf8').includes(expectedContentVersion),
  );
  if (!webHasVersion) {
    errors.push(`Content version "${expectedContentVersion}" not found in web JS bundle.`);
  }
  if (!androidHasVersion) {
    errors.push(`Content version "${expectedContentVersion}" not found in android JS bundle.`);
  }

  // 3. Offline security check: zero forbidden external URLs/services in Android JS/CSS assets
  for (const file of androidAssets) {
    const text = fs.readFileSync(file, 'utf8');
    for (const rule of FORBIDDEN_ANDROID_STRINGS) {
      if (rule.pattern.test(text)) {
        errors.push(
          `Forbidden remote reference (${rule.label}) found in Android asset: ${path.relative(androidWebDir, file)}`,
        );
      }
    }
  }
  // Confirm LessonTutor chunk was tree-shaken out of Android build
  const tutorChunks = androidAssets.filter((f) => /LessonTutor/i.test(path.basename(f)));
  if (tutorChunks.length > 0) {
    errors.push(`Tutor chunk should not exist in Android build: ${tutorChunks.join(', ')}`);
  }

  // 4. Verify required local vendor runtimes and SQLite wasm exist in Android build
  for (const rel of REQUIRED_VENDOR_FILES) {
    if (!fs.existsSync(path.join(androidWebDir, rel))) {
      errors.push(`Missing offline vendor file in Android build: ${rel}`);
    }
  }
  const wasmFiles = collectFiles(path.join(androidWebDir, 'assets'), (f) =>
    /sql-wasm.*\.wasm$/i.test(path.basename(f)),
  );
  if (wasmFiles.length === 0) {
    errors.push('Missing sql-wasm.wasm asset in Android build.');
  }

  // 5. Verify blog posts and narration parity
  if (!fs.existsSync(path.join(androidWebDir, 'posts/posts.json'))) {
    errors.push('Missing posts/posts.json in Android build.');
  }

  if (audioMode === 'bundled') {
    const webNarr = path.join(webDir, 'narration');
    const androidNarr = path.join(androidWebDir, 'narration');
    if (!fs.existsSync(webNarr) || !fs.existsSync(androidNarr)) {
      errors.push('Narration directory missing in web or android build (bundled audioMode).');
    } else {
      const webLessons = fs
        .readdirSync(webNarr, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
      const androidLessons = fs
        .readdirSync(androidNarr, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
      if (JSON.stringify(webLessons) !== JSON.stringify(androidLessons)) {
        errors.push('Narrated lesson IDs mismatch between web and android builds.');
      } else {
        for (const id of webLessons) {
          const wManifest = path.join(webNarr, id, 'manifest.json');
          const aManifest = path.join(androidNarr, id, 'manifest.json');
          if (!fs.existsSync(wManifest) || !fs.existsSync(aManifest)) {
            errors.push(`Missing manifest.json for lesson ${id}`);
          } else if (hashFile(wManifest) !== hashFile(aManifest)) {
            errors.push(`Manifest hash mismatch for lesson ${id}`);
          }
        }
        summary.narrationLessonsChecked = webLessons.length;
      }
    }
  }

  return { ok: errors.length === 0, errors, summary };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.cwd();
  const expectedContentVersion = process.env.TRILHA_CONTENT_VERSION || 'local';
  const result = verifyJointRelease({
    webDir: path.join(rootDir, 'dist'),
    androidWebDir: path.join(rootDir, 'dist-android'),
    expectedContentVersion,
    audioMode: process.env.TRILHA_AUDIO_MODE || 'bundled',
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
