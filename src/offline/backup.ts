import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { downloadBlob } from '../learning/downloads';
import { getContentVersion } from '../runtime/mode';
import {
  LOCAL_CONTRIBUTIONS_KEY,
  LOCAL_NOTES_KEY,
  LOCAL_PROFILE_KEY,
  LOCAL_ROADMAPS_KEY,
  LOCAL_STORE_EVENT,
} from './localStore';
import { BOOKMARKS_STORAGE_KEY } from './bookmarks';
import { FEEDBACK_STORAGE_KEY } from './feedback';
import { sha256Text } from './sha256';

export const BACKUP_SCHEMA_VERSION = 1;

const EXACT_BACKUP_KEYS = new Set<string>([
  'trilha-lessons:v1',
  'trilha-review:v1',
  'trilha-progress:v1',
  'trilha-percurso:v1',
  'trilha-lesson-plan:v1',
  'trilha:narration:prefs:v1',
  'trilha:narration:pos:v1',
  BOOKMARKS_STORAGE_KEY,
  FEEDBACK_STORAGE_KEY,
  LOCAL_PROFILE_KEY,
  LOCAL_NOTES_KEY,
  LOCAL_ROADMAPS_KEY,
  LOCAL_CONTRIBUTIONS_KEY,
]);

const PREFIX_BACKUP_KEYS = [
  'trilha-study:v1:',
  'selectedItems-',
  'trilha:mission-review:',
  'trilha:checklist:',
  'trilha:persistence-pilot:',
];

export interface TrilhaBackupV1 {
  app: 'trilha-mod';
  schemaVersion: 1;
  exportedAt: string;
  contentVersion: string;
  sha256: string;
  entries: Record<string, string>;
}

export interface BackupStats {
  totalKeys: number;
  lessonsTracked: number;
  notesCount: number;
  customRoadmapsCount: number;
  draftsCount: number;
}

export type BackupValidationResult =
  | { ok: true; backup: TrilhaBackupV1; stats: BackupStats }
  | { ok: false; error: string };

export function isManagedBackupKey(key: string): boolean {
  if (EXACT_BACKUP_KEYS.has(key)) return true;
  return PREFIX_BACKUP_KEYS.some((prefix) => key.startsWith(prefix));
}

function canonicalEntriesString(entries: Record<string, string>): string {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(entries).sort()) {
    sorted[key] = entries[key];
  }
  return JSON.stringify(sorted);
}

function summarizeEntries(entries: Record<string, string>): BackupStats {
  let lessonsTracked = 0;
  let notesCount = 0;
  let customRoadmapsCount = 0;
  let draftsCount = 0;
  try {
    const lessonsStore = JSON.parse(entries['trilha-lessons:v1'] || '{}') as {
      lessons?: Record<string, unknown>;
    };
    if (lessonsStore.lessons && typeof lessonsStore.lessons === 'object') {
      lessonsTracked = Object.keys(lessonsStore.lessons).length;
    }
  } catch {
    // ignore
  }
  try {
    const notes = JSON.parse(entries[LOCAL_NOTES_KEY] || '[]');
    if (Array.isArray(notes)) notesCount = notes.length;
  } catch {
    // ignore
  }
  try {
    const roadmaps = JSON.parse(entries[LOCAL_ROADMAPS_KEY] || '[]');
    if (Array.isArray(roadmaps)) customRoadmapsCount = roadmaps.length;
  } catch {
    // ignore
  }
  try {
    const drafts = JSON.parse(entries[LOCAL_CONTRIBUTIONS_KEY] || '[]');
    if (Array.isArray(drafts)) draftsCount = drafts.length;
  } catch {
    // ignore
  }
  return {
    totalKeys: Object.keys(entries).length,
    lessonsTracked,
    notesCount,
    customRoadmapsCount,
    draftsCount,
  };
}

export function collectBackupEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !isManagedBackupKey(key)) continue;
    const value = localStorage.getItem(key);
    if (typeof value === 'string') {
      entries[key] = value;
    }
  }
  return entries;
}

export async function createBackupSnapshot(): Promise<TrilhaBackupV1> {
  const entries = collectBackupEntries();
  const sha256 = await sha256Text(canonicalEntriesString(entries));
  return {
    app: 'trilha-mod',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    contentVersion: getContentVersion(),
    sha256,
    entries,
  };
}

export async function validateBackupPayload(rawText: string): Promise<BackupValidationResult> {
  if (!rawText || typeof rawText !== 'string') {
    return { ok: false, error: 'Arquivo de backup vazio ou ilegível.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, error: 'O arquivo não contém JSON válido.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Estrutura do arquivo de backup inválida.' };
  }

  const record = parsed as Record<string, unknown>;
  if (record.app !== 'trilha-mod') {
    return { ok: false, error: 'Este arquivo não é um backup do Trilha Mod.' };
  }
  if (record.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Versão de backup não suportada (${String(record.schemaVersion ?? 'desconhecida')}).`,
    };
  }
  if (!record.entries || typeof record.entries !== 'object' || Array.isArray(record.entries)) {
    return { ok: false, error: 'O campo "entries" do backup está ausente ou inválido.' };
  }

  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(record.entries as Record<string, unknown>)) {
    if (!isManagedBackupKey(key)) {
      return {
        ok: false,
        error: `Chave não reconhecida no arquivo de backup: "${key}".`,
      };
    }
    if (typeof value !== 'string') {
      return {
        ok: false,
        error: `Valor inválido na chave "${key}" do backup.`,
      };
    }
    try {
      JSON.parse(value);
    } catch {
      return {
        ok: false,
        error: `Conteúdo corrompido na chave "${key}" do backup.`,
      };
    }
    entries[key] = value;
  }

  if (typeof record.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(record.sha256)) {
    return { ok: false, error: 'Assinatura de integridade (SHA-256) ausente ou malformada.' };
  }
  const computed = await sha256Text(canonicalEntriesString(entries));
  if (computed.toLowerCase() !== record.sha256.toLowerCase()) {
    return {
      ok: false,
      error: 'A verificação de integridade (SHA-256) falhou. O arquivo pode estar corrompido.',
    };
  }

  const backup: TrilhaBackupV1 = {
    app: 'trilha-mod',
    schemaVersion: 1,
    exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : '',
    contentVersion: typeof record.contentVersion === 'string' ? record.contentVersion : '',
    sha256: record.sha256,
    entries,
  };
  return { ok: true, backup, stats: summarizeEntries(entries) };
}

export async function restoreBackupSnapshot(rawText: string): Promise<BackupValidationResult> {
  const validation = await validateBackupPayload(rawText);
  if (!validation.ok) return validation;

  const existingManagedKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && isManagedBackupKey(key)) existingManagedKeys.push(key);
  }
  for (const key of existingManagedKeys) {
    localStorage.removeItem(key);
  }
  for (const [key, value] of Object.entries(validation.backup.entries)) {
    localStorage.setItem(key, value);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LOCAL_STORE_EVENT));
    window.dispatchEvent(new Event('storage'));
  }
  return validation;
}

export async function exportTextFile(
  filename: string,
  content: string,
  mimeType: string,
): Promise<{ savedPath?: string }> {
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({
        title: filename,
        url: written.uri,
        dialogTitle: 'Salvar ou compartilhar arquivo',
      });
    } catch {
      // If user cancels share sheet, file still exists in app documents/cache
    }
    return { savedPath: written.uri };
  }
  downloadBlob(filename, new Blob([content], { type: mimeType }));
  return {};
}

export async function exportBackupFile(): Promise<{ filename: string; stats: BackupStats }> {
  const snapshot = await createBackupSnapshot();
  const stamp = snapshot.exportedAt.slice(0, 10);
  const filename = `trilha-mod-backup-${stamp}.json`;
  const serialized = JSON.stringify(snapshot, null, 2);
  await exportTextFile(filename, serialized, 'application/json;charset=utf-8');
  return { filename, stats: summarizeEntries(snapshot.entries) };
}
