import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { computeContentFingerprint } from '../release/contentVersion.mjs';

function parseArgs(argv) {
  const args = { out: null, lessons: null, contentVersion: null };
  for (const arg of argv) {
    if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length);
    else if (arg.startsWith('--lessons=')) {
      args.lessons = arg
        .slice('--lessons='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--content-version=')) {
      args.contentVersion = arg.slice('--content-version='.length);
    }
  }
  return args;
}

export function buildAudioPack({ rootDir, outPath, lessonsFilter = null, contentVersion = null }) {
  const narrationDir = path.join(rootDir, 'public/narration');
  if (!fs.existsSync(narrationDir)) {
    throw new Error(`Narration directory not found: ${narrationDir}`);
  }

  const resolvedVersion = contentVersion || computeContentFingerprint(rootDir).version;
  const lessonIds = fs
    .readdirSync(narrationDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => !lessonsFilter || lessonsFilter.includes(id))
    .sort();

  const filesForZip = {};
  const fileHashes = {};
  const voicesSet = new Set();
  let clipCount = 0;
  let rawBytes = 0;

  for (const lessonId of lessonIds) {
    const lessonDir = path.join(narrationDir, lessonId);
    const manifestPath = path.join(lessonDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    const manifestBuf = fs.readFileSync(manifestPath);
    const manifestRel = `${lessonId}/manifest.json`;
    filesForZip[manifestRel] = new Uint8Array(manifestBuf);
    fileHashes[manifestRel] = crypto.createHash('sha256').update(manifestBuf).digest('hex');
    rawBytes += manifestBuf.byteLength;

    const manifestJson = JSON.parse(manifestBuf.toString('utf8'));
    const voices = Object.keys(manifestJson.voices || {});
    for (const voice of voices) {
      voicesSet.add(voice);
      const clips = manifestJson.voices[voice]?.clips || {};
      for (const clip of Object.values(clips)) {
        if (!clip || typeof clip.src !== 'string') continue;
        const cleanSrc = clip.src.replace(/^\/+/, '');
        const clipFull = path.join(lessonDir, cleanSrc);
        if (!fs.existsSync(clipFull)) {
          throw new Error(`Missing narration audio clip: ${clipFull}`);
        }
        const rel = `${lessonId}/${cleanSrc}`;
        if (!filesForZip[rel]) {
          const buf = fs.readFileSync(clipFull);
          filesForZip[rel] = new Uint8Array(buf);
          fileHashes[rel] = crypto.createHash('sha256').update(buf).digest('hex');
          rawBytes += buf.byteLength;
          clipCount += 1;
        }
      }
    }
  }

  const packManifest = {
    app: 'trilha-mod-audio-pack',
    schemaVersion: 1,
    version: `audio-${resolvedVersion}`,
    contentVersion: resolvedVersion,
    createdAt: new Date().toISOString(),
    voices: [...voicesSet].sort(),
    lessonIds,
    clipCount,
    files: fileHashes,
  };

  const manifestBytes = new TextEncoder().encode(JSON.stringify(packManifest, null, 2));
  filesForZip['pack-manifest.json'] = manifestBytes;

  // Store uncompressed (level 0) because MP3s are already compressed; fast & zero memory bloat.
  const zipped = zipSync(filesForZip, { level: 0 });
  const target =
    outPath || path.join(rootDir, 'releases', `trilha-audio-pack-${resolvedVersion}.zip`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, zipped);

  const zipSha256 = crypto.createHash('sha256').update(zipped).digest('hex');
  return {
    outPath: target,
    version: packManifest.version,
    contentVersion: resolvedVersion,
    lessonCount: lessonIds.length,
    clipCount,
    voices: packManifest.voices,
    rawBytes,
    zipBytes: zipped.byteLength,
    zipSha256,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const result = buildAudioPack({
    rootDir,
    outPath: args.out ? path.resolve(rootDir, args.out) : null,
    lessonsFilter: args.lessons,
    contentVersion: args.contentVersion,
  });
  console.log(JSON.stringify(result, null, 2));
}
