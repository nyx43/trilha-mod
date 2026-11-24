import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { unzipSync } from 'fflate';
import { sha256Bytes } from './sha256';

export const AUDIO_PACK_META_KEY = 'trilha-audio-pack:v1';
export const AUDIO_PACK_SCHEMA_VERSION = 1;

export interface AudioPackManifestFile {
  app: 'trilha-mod-audio-pack';
  schemaVersion: 1;
  version: string;
  contentVersion: string;
  createdAt: string;
  voices: string[];
  lessonIds: string[];
  clipCount: number;
  /** Map of relative paths (e.g. `como-a-web-funciona/manifest.json`) to expected SHA-256 hex */
  files: Record<string, string>;
}

export interface InstalledAudioPackMeta {
  version: string;
  contentVersion: string;
  voices: string[];
  lessonIds: string[];
  clipCount: number;
  installedAt: string;
  fileCount: number;
  totalBytes: number;
  /** Capacitor File URI base converted for WebView (`https://localhost/_capacitor_file_/...`) */
  nativeBaseUrl?: string;
}

export type AudioPackImportResult =
  | { ok: true; meta: InstalledAudioPackMeta }
  | { ok: false; error: string };

const memoryPackBlobs = new Map<string, string>();

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function isSafeRelativePath(path: string): boolean {
  if (!path || path.startsWith('/') || path.startsWith('\\')) return false;
  const parts = path.split('/');
  return parts.every(
    (part) => part !== '' && part !== '.' && part !== '..' && !part.includes('\\'),
  );
}

export function loadInstalledAudioPack(): InstalledAudioPackMeta | null {
  try {
    const raw = localStorage.getItem(AUDIO_PACK_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InstalledAudioPackMeta>;
    if (!parsed || typeof parsed.version !== 'string' || !Array.isArray(parsed.lessonIds)) {
      return null;
    }
    return parsed as InstalledAudioPackMeta;
  } catch {
    return null;
  }
}

export function clearInstalledAudioPack(): void {
  localStorage.removeItem(AUDIO_PACK_META_KEY);
  for (const url of memoryPackBlobs.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  memoryPackBlobs.clear();
}

export function resolveNarrationAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const memoryUrl = memoryPackBlobs.get(clean);
  if (memoryUrl) return memoryUrl;
  const installed = loadInstalledAudioPack();
  if (installed?.nativeBaseUrl) {
    return `${installed.nativeBaseUrl.replace(/\/+$/, '')}/${clean}`;
  }
  return `/narration/${clean}`;
}

export async function validateAndExtractAudioPackZip(
  zipBytes: Uint8Array,
): Promise<
  | {
      ok: true;
      manifest: AudioPackManifestFile;
      files: Record<string, Uint8Array>;
      totalBytes: number;
    }
  | { ok: false; error: string }
> {
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(zipBytes);
  } catch {
    return { ok: false, error: 'Não foi possível abrir o arquivo ZIP do pacote de áudio.' };
  }

  const manifestRaw = unzipped['pack-manifest.json'];
  if (!manifestRaw) {
    return { ok: false, error: 'Pacote inválido: arquivo "pack-manifest.json" ausente.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(manifestRaw));
  } catch {
    return { ok: false, error: 'O arquivo "pack-manifest.json" não contém JSON válido.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Estrutura inválida em "pack-manifest.json".' };
  }

  const record = parsed as Record<string, unknown>;
  if (record.app !== 'trilha-mod-audio-pack') {
    return { ok: false, error: 'Este arquivo não é um pacote de áudio do Trilha Mod.' };
  }
  if (record.schemaVersion !== AUDIO_PACK_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Versão de pacote de áudio não suportada (${String(record.schemaVersion)}).`,
    };
  }
  if (typeof record.version !== 'string' || !record.version.trim()) {
    return { ok: false, error: 'Versão do pacote de áudio ausente.' };
  }
  if (!record.files || typeof record.files !== 'object' || Array.isArray(record.files)) {
    return { ok: false, error: 'Lista de arquivos do pacote de áudio ausente.' };
  }

  const expectedFiles = record.files as Record<string, unknown>;
  const verifiedFiles: Record<string, Uint8Array> = {};
  let totalBytes = 0;

  for (const [relPath, expectedHash] of Object.entries(expectedFiles)) {
    if (!isSafeRelativePath(relPath)) {
      return { ok: false, error: `Caminho inválido no pacote de áudio: "${relPath}".` };
    }
    if (typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedHash)) {
      return { ok: false, error: `Hash SHA-256 inválido para "${relPath}".` };
    }
    const content = unzipped[relPath];
    if (!content) {
      return { ok: false, error: `Arquivo ausente no pacote de áudio: "${relPath}".` };
    }
    const actualHash = await sha256Bytes(content);
    if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
      return {
        ok: false,
        error: `Falha de integridade (SHA-256) no arquivo "${relPath}". O pacote anterior foi mantido.`,
      };
    }
    verifiedFiles[relPath] = content;
    totalBytes += content.byteLength;
  }

  const manifest: AudioPackManifestFile = {
    app: 'trilha-mod-audio-pack',
    schemaVersion: 1,
    version: record.version.trim(),
    contentVersion:
      typeof record.contentVersion === 'string' ? record.contentVersion : record.version.trim(),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    voices: Array.isArray(record.voices) ? record.voices.map(String) : ['santa', 'dora'],
    lessonIds: Array.isArray(record.lessonIds) ? record.lessonIds.map(String) : [],
    clipCount: typeof record.clipCount === 'number' ? record.clipCount : 0,
    files: Object.fromEntries(Object.entries(expectedFiles).map(([k, v]) => [k, String(v)])),
  };

  return { ok: true, manifest, files: verifiedFiles, totalBytes };
}

export async function importAudioPackZip(zipBytes: Uint8Array): Promise<AudioPackImportResult> {
  const checked = await validateAndExtractAudioPackZip(zipBytes);
  if (!checked.ok) return checked;

  const { manifest, files, totalBytes } = checked;
  let nativeBaseUrl: string | undefined;

  if (Capacitor.isNativePlatform()) {
    const safeVersion = manifest.version.replace(/[^a-zA-Z0-9._-]/g, '_');
    const baseDir = `narration-packs/${safeVersion}`;
    for (const [relPath, bytes] of Object.entries(files)) {
      await Filesystem.writeFile({
        path: `${baseDir}/${relPath}`,
        data: uint8ToBase64(bytes),
        directory: Directory.Data,
        recursive: true,
      });
    }
    const uriResult = await Filesystem.getUri({
      path: baseDir,
      directory: Directory.Data,
    });
    nativeBaseUrl = Capacitor.convertFileSrc(uriResult.uri);
  } else {
    for (const url of memoryPackBlobs.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    memoryPackBlobs.clear();
    for (const [relPath, bytes] of Object.entries(files)) {
      const mime = relPath.endsWith('.json')
        ? 'application/json'
        : relPath.endsWith('.mp3')
        ? 'audio/mpeg'
        : 'application/octet-stream';
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      memoryPackBlobs.set(relPath, URL.createObjectURL(new Blob([copy.buffer], { type: mime })));
    }
  }

  const meta: InstalledAudioPackMeta = {
    version: manifest.version,
    contentVersion: manifest.contentVersion,
    voices: manifest.voices,
    lessonIds: manifest.lessonIds,
    clipCount: manifest.clipCount,
    installedAt: new Date().toISOString(),
    fileCount: Object.keys(files).length,
    totalBytes,
    nativeBaseUrl,
  };
  localStorage.setItem(AUDIO_PACK_META_KEY, JSON.stringify(meta));
  return { ok: true, meta };
}
