import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function collectFiles(dir, filterFn, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, filterFn, acc);
    } else if (entry.isFile() && filterFn(full)) {
      acc.push(full);
    }
  }
  return acc;
}

export function computeContentFingerprint(rootDir) {
  const hash = crypto.createHash('sha256');
  const roots = [
    path.join(rootDir, 'src/lessons'),
    path.join(rootDir, 'src/guides'),
    path.join(rootDir, 'src/roadmaps'),
    path.join(rootDir, 'src/percurso'),
    path.join(rootDir, 'public/posts'),
  ];

  const files = [];
  for (const r of roots) {
    collectFiles(r, (f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'), files);
  }
  // Include narration manifests (stable hash of all audio tracks without reading 1.1 GiB of MP3 bytes on every Vite start)
  const narrationDir = path.join(rootDir, 'public/narration');
  if (fs.existsSync(narrationDir)) {
    for (const lessonDir of fs.readdirSync(narrationDir).sort()) {
      const manifestPath = path.join(narrationDir, lessonDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) files.push(manifestPath);
    }
  }

  files.sort();
  for (const file of files) {
    const rel = path.relative(rootDir, file).split(path.sep).join('/');
    hash.update(rel);
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }

  const shortHash = hash.digest('hex').slice(0, 8);
  const date = new Date().toISOString().slice(0, 10);
  return {
    version: `${date}.${shortHash}`,
    hash: shortHash,
    fileCount: files.length,
  };
}
