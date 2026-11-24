import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContentVersion, isOfflineApp } from '../../runtime/mode';
import {
  clearInstalledAudioPack,
  importAudioPackZip,
  InstalledAudioPackMeta,
  loadInstalledAudioPack,
} from '../../offline/audioPack';
import {
  BackupStats,
  collectBackupEntries,
  exportBackupFile,
  exportTextFile,
  restoreBackupSnapshot,
} from '../../offline/backup';
import {
  deleteContributionDraft,
  exportContributionDraftsJson,
  exportLocalNotesMarkdown,
  listAllLocalNotes,
  listContributionDrafts,
  listLocalRoadmaps,
  loadLocalProfile,
  LOCAL_STORE_EVENT,
  LocalContributionDraft,
  LocalProfile,
  saveLocalProfile,
} from '../../offline/localStore';
import { LESSON_COUNT } from '../../lessons/counts';
import {
  buildGitHubPrefilledIssueUrl,
  deleteFeedbackReport,
  exportFeedbackReportsJson,
  exportFeedbackReportsMarkdown,
  FEEDBACK_CATEGORY_LABELS,
  submitFeedbackReport,
  useFeedbackReports,
} from '../../offline/feedback';
import { FeedbackDialog } from '../Feedback/FeedbackDialog';

export function BackupSection() {
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; text: string }>({
    kind: 'idle',
    text: '',
  });
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    setStatus({ kind: 'idle', text: '' });
    try {
      const { filename, stats } = await exportBackupFile();
      setStatus({
        kind: 'ok',
        text: `Backup exportado (${filename}): ${stats.totalKeys} chave(s), ${stats.lessonsTracked} aula(s) com progresso, ${stats.notesCount} nota(s) e ${stats.customRoadmapsCount} trilha(s) pessoal(is).`,
      });
    } catch {
      setStatus({ kind: 'error', text: 'Não foi possível gerar o arquivo de backup.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus({ kind: 'idle', text: '' });
    try {
      const text = await file.text();
      const result = await restoreBackupSnapshot(text);
      if (!result.ok) {
        setStatus({
          kind: 'error',
          text: `${result.error} Seu histórico atual foi preservado sem alterações.`,
        });
      } else {
        const stats: BackupStats = result.stats;
        setStatus({
          kind: 'ok',
          text: `Backup restaurado com sucesso (versão de conteúdo ${
            result.backup.contentVersion || 'desconhecida'
          }): ${stats.lessonsTracked} aula(s), ${stats.notesCount} nota(s), ${
            stats.customRoadmapsCount
          } trilha(s) pessoal(is) e ${stats.draftsCount} rascunho(s).`,
        });
      }
    } catch {
      setStatus({
        kind: 'error',
        text: 'Erro ao ler o arquivo escolhido. Seu histórico atual foi preservado.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleExportNotes() {
    await exportTextFile('notes.md', exportLocalNotesMarkdown(), 'text/markdown;charset=utf-8');
    setStatus({ kind: 'ok', text: 'Anotações exportadas em notes.md.' });
  }

  const managedKeysCount = Object.keys(collectBackupEntries()).length;

  return (
    <section className="offline-card" aria-labelledby="backup-title">
      <p className="home-eyebrow">Transferência PC ↔ Celular</p>
      <h2 id="backup-title">Backup e restauração do progresso</h2>
      <p>
        Salve em um único arquivo JSON assinado (SHA-256) todas as aulas concluídas, tentativas,
        revisão espaçada, notas, trilhas pessoais, rascunhos e ponto de leitura/áudio (
        {managedKeysCount} registros locais).
      </p>
      <div className="home-actions">
        <button
          type="button"
          className="home-button home-button-primary"
          onClick={handleExport}
          disabled={busy}
        >
          Exportar backup (.json)
        </button>
        <label className="home-button" style={{ cursor: 'pointer' }}>
          Restaurar backup (.json)
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            disabled={busy}
            className="sr-only"
          />
        </label>
        <button type="button" className="home-button" onClick={handleExportNotes} disabled={busy}>
          Exportar notas (.md)
        </button>
      </div>
      {status.text && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={status.kind === 'error' ? 'offline-feedback-error' : 'offline-feedback-ok'}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}

export function AudioPackSection() {
  const [pack, setPack] = useState<InstalledAudioPackMeta | null>(() => loadInstalledAudioPack());
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; text: string }>({
    kind: 'idle',
    text: '',
  });
  const [busy, setBusy] = useState(false);

  async function handleImportZip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus({ kind: 'idle', text: '' });
    try {
      const buffer = await file.arrayBuffer();
      const result = await importAudioPackZip(new Uint8Array(buffer));
      if (!result.ok) {
        setStatus({ kind: 'error', text: result.error });
      } else {
        setPack(result.meta);
        setStatus({
          kind: 'ok',
          text: `Pacote de áudio ${result.meta.version} validado (SHA-256) e ativado: ${
            result.meta.lessonIds.length
          } aula(s), vozes ${result.meta.voices.join(', ')}.`,
        });
      }
    } catch {
      setStatus({
        kind: 'error',
        text: 'Não foi possível importar o pacote de áudio. A configuração anterior foi mantida.',
      });
    } finally {
      setBusy(false);
    }
  }

  function handleRestoreBundled() {
    clearInstalledAudioPack();
    setPack(null);
    setStatus({ kind: 'ok', text: 'Áudio embutido padrão reativado (Santa e Dora).' });
  }

  return (
    <section className="offline-card" aria-labelledby="audio-pack-title">
      <p className="home-eyebrow">Narração offline</p>
      <h2 id="audio-pack-title">Vozes e pacotes de áudio locais</h2>
      <p>
        {pack ? (
          <>
            Pacote local ativo: <strong>{pack.version}</strong> (conteúdo {pack.contentVersion},{' '}
            {pack.lessonIds.length} aulas, vozes {pack.voices.join(' e ')},{' '}
            {(pack.totalBytes / (1024 * 1024)).toFixed(1)} MiB).
          </>
        ) : (
          <>
            Áudio embutido no pacote: <strong>{LESSON_COUNT} aulas</strong> nas vozes{' '}
            <strong>Santa</strong> e <strong>Dora</strong>, pronto em modo avião. Se no futuro você
            optar por um pacote de áudio externo (<code>.zip</code>), importe-o abaixo com
            verificação SHA-256.
          </>
        )}
      </p>
      <div className="home-actions">
        <label className="home-button" style={{ cursor: 'pointer' }}>
          {busy ? 'Validando pacote…' : 'Importar pacote de áudio (.zip)'}
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={handleImportZip}
            disabled={busy}
            className="sr-only"
          />
        </label>
        {pack && (
          <button type="button" className="home-button" onClick={handleRestoreBundled}>
            Voltar ao áudio embutido
          </button>
        )}
      </div>
      {status.text && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={status.kind === 'error' ? 'offline-feedback-error' : 'offline-feedback-ok'}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}

export function LocalSpaceDashboard() {
  const [profile, setProfile] = useState<LocalProfile>(() => loadLocalProfile());
  const [nameInput, setNameInput] = useState(profile.name);
  const [goalInput, setGoalInput] = useState(profile.goal);
  const [savedMsg, setSavedMsg] = useState('');
  const [drafts, setDrafts] = useState<LocalContributionDraft[]>(() => listContributionDrafts());
  const [notesCount, setNotesCount] = useState(() => listAllLocalNotes().length);
  const [roadmapsCount, setRoadmapsCount] = useState(() => listLocalRoadmaps().length);

  useEffect(() => {
    const sync = () => {
      const next = loadLocalProfile();
      setProfile(next);
      setNameInput(next.name);
      setGoalInput(next.goal);
      setDrafts(listContributionDrafts());
      setNotesCount(listAllLocalNotes().length);
      setRoadmapsCount(listLocalRoadmaps().length);
    };
    window.addEventListener(LOCAL_STORE_EVENT, sync);
    return () => window.removeEventListener(LOCAL_STORE_EVENT, sync);
  }, []);

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    const updated = saveLocalProfile({ name: nameInput, goal: goalInput });
    setProfile(updated);
    setSavedMsg('Perfil local salvo neste aparelho.');
  }

  return (
    <div className="offline-space">
      <header className="offline-card">
        <p className="home-eyebrow">
          {isOfflineApp() ? 'Aplicativo pessoal offline' : 'Espaço local'} · conteúdo{' '}
          {getContentVersion()}
        </p>
        <h1>Meu espaço de estudo</h1>
        <p>
          Tudo aqui funciona sem internet e fica salvo neste aparelho ({notesCount} anotações,{' '}
          {roadmapsCount} trilhas pessoais, {drafts.length} rascunhos de sugestões).
        </p>
        <form onSubmit={handleSaveProfile} className="offline-profile-form">
          <label>
            <span>Seu nome</span>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setSavedMsg('');
              }}
              placeholder="Como quer ser chamado"
            />
          </label>
          <label>
            <span>Objetivo atual (ex.: provas 26.2, Web, Estruturas)</span>
            <input
              type="text"
              value={goalInput}
              onChange={(e) => {
                setGoalInput(e.target.value);
                setSavedMsg('');
              }}
              placeholder="Opcional"
            />
          </label>
          <div className="home-actions">
            <button type="submit" className="home-button home-button-primary">
              Salvar perfil local
            </button>
            <Link className="home-button" to="/new-roadmap">
              Criar trilha pessoal
            </Link>
            <Link className="home-button" to="/aulas">
              Abrir aulas
            </Link>
          </div>
          {savedMsg && (
            <p role="status" className="offline-feedback-ok">
              {savedMsg}
            </p>
          )}
        </form>
      </header>

      <BackupSection />

      <FeedbackQueueSection />

      <AudioPackSection />

      <section className="offline-card" aria-labelledby="drafts-title">
        <p className="home-eyebrow">Sugestões locais</p>
        <h2 id="drafts-title">Rascunhos de sugestões ({drafts.length})</h2>
        {drafts.length === 0 ? (
          <p>
            Nenhum rascunho salvo ainda. Em qualquer assunto das trilhas, clique em &ldquo;Sugerir
            conteúdo&rdquo; para guardar uma proposta em modo avião.
          </p>
        ) : (
          <>
            <ul className="offline-drafts-list">
              {drafts.map((draft) => {
                const p = draft.payload as Record<string, unknown>;
                const res = (p.resource ||
                  (p.step as Record<string, unknown> | undefined)?.resource ||
                  {}) as Record<string, unknown>;
                return (
                  <li key={draft.id}>
                    <div>
                      <strong>{String(res.title || draft.groupTitle)}</strong>
                      <p>
                        {draft.catalogTitle} · {draft.groupTitle}
                        {res.url ? ` · ${String(res.url)}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="site-ghost-button"
                      onClick={() => deleteContributionDraft(draft.id)}
                    >
                      Excluir
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="home-actions">
              <button
                type="button"
                className="home-button"
                onClick={() =>
                  exportTextFile(
                    'trilha-mod-rascunhos-sugestoes.json',
                    exportContributionDraftsJson(),
                    'application/json;charset=utf-8',
                  )
                }
              >
                Exportar rascunhos (.json)
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function FeedbackQueueSection() {
  const offline = isOfflineApp();
  const reports = useFeedbackReports();
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; text: string }>({
    kind: 'idle',
    text: '',
  });
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleRetrySend(id: string) {
    const report = reports.find((item) => item.id === id);
    if (!report) return;
    setSendingId(id);
    setStatus({ kind: 'idle', text: '' });
    const res = await submitFeedbackReport(report);
    setSendingId(null);
    setStatus({
      kind: res.status === 'sent' ? 'ok' : 'error',
      text: res.message,
    });
  }

  return (
    <section className="offline-card" aria-labelledby="feedback-queue-title">
      <p className="home-eyebrow">Triagem GitHub e Agentes</p>
      <h2 id="feedback-queue-title">Avaliações, bugs e melhorias ({reports.length})</h2>
      <p>
        Todos os relatos e avaliações das aulas ficam registrados com metadados estruturados (rota,
        aula, seção, plataforma e versão) para envio ao GitHub ou análise direta pelos agentes.
      </p>
      <div className="home-actions">
        <FeedbackDialog
          triggerLabel="Novo relato ou avaliação"
          triggerClassName="home-button home-button-primary"
        />
        {reports.length > 0 && (
          <>
            <button
              type="button"
              className="home-button"
              onClick={() =>
                exportTextFile(
                  'trilha-mod-relatos.md',
                  exportFeedbackReportsMarkdown(),
                  'text/markdown;charset=utf-8',
                )
              }
            >
              Exportar para agentes (.md)
            </button>
            <button
              type="button"
              className="home-button"
              onClick={() =>
                exportTextFile(
                  'trilha-mod-relatos.json',
                  exportFeedbackReportsJson(),
                  'application/json;charset=utf-8',
                )
              }
            >
              Exportar JSON (.json)
            </button>
          </>
        )}
      </div>

      {reports.length > 0 && (
        <ul className="offline-drafts-list">
          {reports.map((report) => (
            <li key={report.id}>
              <div>
                <strong>
                  [{FEEDBACK_CATEGORY_LABELS[report.category]}] {report.title}
                  {report.rating ? ` · ${report.rating}/5 ★` : ''}
                </strong>
                <p>
                  {report.context.lessonTitle || report.context.courseTitle || report.context.route}{' '}
                  · {report.context.platform} ·{' '}
                  {report.status === 'sent' && report.issueUrl
                    ? `Enviado (#${report.issueNumber ?? 'issue'})`
                    : 'Pendente de envio'}
                </p>
                <p>{report.description}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {report.status === 'sent' && report.issueUrl ? (
                  <a
                    className="site-ghost-button"
                    href={report.issueUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver Issue
                  </a>
                ) : (
                  <>
                    {!offline && (
                      <button
                        type="button"
                        className="site-ghost-button"
                        disabled={sendingId === report.id}
                        onClick={() => handleRetrySend(report.id)}
                      >
                        {sendingId === report.id ? 'Enviando…' : 'Enviar ao GitHub'}
                      </button>
                    )}
                    <a
                      className="site-ghost-button"
                      href={buildGitHubPrefilledIssueUrl(report)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir no GitHub
                    </a>
                  </>
                )}
                <button
                  type="button"
                  className="site-ghost-button"
                  onClick={() => deleteFeedbackReport(report.id)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {status.text && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={status.kind === 'error' ? 'offline-feedback-error' : 'offline-feedback-ok'}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}
