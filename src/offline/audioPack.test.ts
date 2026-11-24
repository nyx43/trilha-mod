import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync } from 'fflate';
import {
  clearInstalledAudioPack,
  importAudioPackZip,
  loadInstalledAudioPack,
  resolveNarrationAssetUrl,
} from './audioPack';
import { sha256BytesSync } from './sha256';

describe('Pacote de áudio externo com integridade SHA-256 (Frente 2 · item 5)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearInstalledAudioPack();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => `blob:mock-${blob.size}-${blob.type}`),
      revokeObjectURL: vi.fn(),
    });
  });

  function makeTestPack(tamperAudio = false): Uint8Array {
    const manifestBytes = new TextEncoder().encode(
      JSON.stringify({ lessonId: 'como-a-web-funciona', voices: { santa: { clips: {} } } }),
    );
    const audioBytes = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x01, 0x02]);
    const files: Record<string, string> = {
      'como-a-web-funciona/manifest.json': sha256BytesSync(manifestBytes),
      'como-a-web-funciona/santa/header.mp3': sha256BytesSync(audioBytes),
    };
    const packManifest = {
      app: 'trilha-mod-audio-pack',
      schemaVersion: 1,
      version: 'audio-2026-11-23.test',
      contentVersion: '2026-11-23.test',
      createdAt: '2026-11-23T20:00:00Z',
      voices: ['santa', 'dora'],
      lessonIds: ['como-a-web-funciona'],
      clipCount: 1,
      files,
    };

    const actualAudio = tamperAudio
      ? new Uint8Array([...audioBytes.slice(0, -1), 0xff])
      : audioBytes;
    return zipSync(
      {
        'pack-manifest.json': new TextEncoder().encode(JSON.stringify(packManifest)),
        'como-a-web-funciona/manifest.json': manifestBytes,
        'como-a-web-funciona/santa/header.mp3': actualAudio,
      },
      { level: 0 },
    );
  }

  it('valida SHA-256, ativa o pacote importado e resolve URLs de narração a partir dele', async () => {
    expect(resolveNarrationAssetUrl('como-a-web-funciona/manifest.json')).toBe(
      '/narration/como-a-web-funciona/manifest.json',
    );

    const res = await importAudioPackZip(makeTestPack(false));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.meta.version).toBe('audio-2026-11-23.test');
      expect(res.meta.lessonIds).toEqual(['como-a-web-funciona']);
    }
    expect(loadInstalledAudioPack()?.version).toBe('audio-2026-11-23.test');
    expect(resolveNarrationAssetUrl('como-a-web-funciona/santa/header.mp3')).toMatch(/^blob:mock-/);
  });

  it('rejeita pacote adulterado por SHA-256 e mantém o pacote ativo anterior', async () => {
    const valid = await importAudioPackZip(makeTestPack(false));
    expect(valid.ok).toBe(true);

    const corrupted = await importAudioPackZip(makeTestPack(true));
    expect(corrupted.ok).toBe(false);
    if (!corrupted.ok) {
      expect(corrupted.error).toMatch(/SHA-256/i);
    }
    // Previous valid pack remains active
    expect(loadInstalledAudioPack()?.version).toBe('audio-2026-11-23.test');
  });
});
