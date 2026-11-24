import { beforeEach, describe, expect, it } from 'vitest';
import { createBackupSnapshot, restoreBackupSnapshot, validateBackupPayload } from './backup';
import {
  addLocalNote,
  listAllLocalNotes,
  listContributionDrafts,
  listLocalRoadmaps,
  loadLocalProfile,
  saveContributionDraft,
  saveLocalProfile,
  saveLocalRoadmap,
} from './localStore';
import { RoadmapModel } from '../entity/RoadmapModel';

describe('Backup e restauração offline (Frente 2 · item 6)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exporta todo o progresso, notas, trilhas pessoais, rascunhos e posição de áudio e restaura em instalação limpa', async () => {
    saveLocalProfile({ name: 'João', goal: 'Provas 26.2' });
    addLocalNote('curriculum.internet-e-http', 'Revisar cabeçalhos HTTP e CORS');
    const custom = new RoadmapModel();
    custom.title = 'Trilha 26.2';
    custom.slug = 'trilha-26-2';
    saveLocalRoadmap(custom);
    saveContributionDraft({
      catalogId: 'frontend',
      catalogTitle: 'Frontend',
      groupId: 'curriculum.html',
      groupTitle: 'HTML',
      payload: {
        kind: 'resource',
        resource: { title: 'Guia MDN', url: 'https://developer.mozilla.org' },
      },
    });
    localStorage.setItem(
      'trilha-lessons:v1',
      JSON.stringify({
        lessons: { 'onde-o-dado-mora': { done: true, reached: 3, answers: { q1: true } } },
        cards: { 'onde-o-dado-mora:c1': { box: 2, due: '2026-11-30', reviewedAt: '2026-11-23' } },
      }),
    );
    localStorage.setItem(
      'trilha:narration:pos:v1',
      JSON.stringify({ 'onde-o-dado-mora': { clipId: 'header', timeSec: 4.5, updatedAt: 1 } }),
    );
    localStorage.setItem('selectedItems-frontend', JSON.stringify([{ id: '1', read: true }]));
    // Transient cache should NOT be included
    localStorage.setItem('trilha:github-stars', JSON.stringify({ stars: 999, at: Date.now() }));

    const snapshot = await createBackupSnapshot();
    expect(snapshot.app).toBe('trilha-mod');
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(snapshot.entries['trilha:github-stars']).toBeUndefined();
    expect(snapshot.entries['trilha-lessons:v1']).toBeDefined();
    expect(snapshot.entries['trilha:narration:pos:v1']).toBeDefined();
    expect(snapshot.entries['selectedItems-frontend']).toBeDefined();

    // Simulate clean install
    localStorage.clear();
    expect(listAllLocalNotes()).toHaveLength(0);
    expect(listLocalRoadmaps()).toHaveLength(0);

    const restored = await restoreBackupSnapshot(JSON.stringify(snapshot));
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.stats.lessonsTracked).toBe(1);
      expect(restored.stats.notesCount).toBe(1);
      expect(restored.stats.customRoadmapsCount).toBe(1);
      expect(restored.stats.draftsCount).toBe(1);
    }

    expect(loadLocalProfile().name).toBe('João');
    expect(loadLocalProfile().goal).toBe('Provas 26.2');
    expect(listAllLocalNotes()).toHaveLength(1);
    expect(listLocalRoadmaps()).toHaveLength(1);
    expect(listContributionDrafts()).toHaveLength(1);
    expect(localStorage.getItem('trilha:narration:pos:v1')).toContain('onde-o-dado-mora');
    expect(localStorage.getItem('selectedItems-frontend')).toContain('"read":true');
  });

  it('rejeita arquivo inválido ou adulterado e preserva integralmente o histórico anterior', async () => {
    saveLocalProfile({ name: 'Histórico Original', goal: 'Preservar' });
    addLocalNote('topic-1', 'Nota intacta');
    const valid = await createBackupSnapshot();

    // 1. Corrupt JSON
    const badJson = await restoreBackupSnapshot('{not json');
    expect(badJson.ok).toBe(false);

    // 2. Wrong schema version
    const wrongVersion = await validateBackupPayload(
      JSON.stringify({ ...valid, schemaVersion: 99 }),
    );
    expect(wrongVersion.ok).toBe(false);

    // 3. Tampered entry with mismatched SHA-256
    const tampered = {
      ...valid,
      entries: {
        ...valid.entries,
        'trilha-local-profile:v1': JSON.stringify({ name: 'Invasor', goal: '' }),
      },
    };
    const tamperedRes = await restoreBackupSnapshot(JSON.stringify(tampered));
    expect(tamperedRes.ok).toBe(false);

    // 4. Disallowed key
    const disallowedRes = await restoreBackupSnapshot(
      JSON.stringify({ ...valid, entries: { ...valid.entries, evil_key: '{}' } }),
    );
    expect(disallowedRes.ok).toBe(false);

    // Original data must remain 100% intact
    expect(loadLocalProfile().name).toBe('Histórico Original');
    expect(listAllLocalNotes()).toHaveLength(1);
    expect(listAllLocalNotes()[0].text).toBe('Nota intacta');
  });
});
