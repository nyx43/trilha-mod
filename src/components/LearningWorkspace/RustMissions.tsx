import { useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { LearningStage } from '../../learning/types';
import { RustMission, rustMissions } from '../../roadmaps/rustMissions';
import { rustMissionLegacyCriteria } from '../../roadmaps/rustMissionLegacyCriteria';

interface MissionDraft {
  checked: string[];
  evidence: string;
  completed: boolean;
}

type MissionProgress = Record<string, MissionDraft>;

const emptyDraft: MissionDraft = { checked: [], evidence: '', completed: false };
const evidenceLimit = 5000;
const storageKey = 'trilha:mission-review:rust:v1';

function readProgress(raw: string): MissionProgress {
  const parsed = JSON.parse(raw) as MissionProgress | null;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

  const progress: MissionProgress = {};
  for (const mission of rustMissions) {
    const entry = parsed[mission.stageId];
    if (entry && Array.isArray(entry.checked) && typeof entry.evidence === 'string') {
      progress[mission.stageId] = {
        checked: mission.criteria
          .filter(
            ({ id }) =>
              entry.checked.includes(id) ||
              entry.checked.includes(rustMissionLegacyCriteria[mission.stageId]?.[id]),
          )
          .map(({ id }) => id),
        evidence: entry.evidence.slice(0, evidenceLimit),
        completed: entry.completed === true,
      };
    }
  }
  return progress;
}

function readyToComplete(mission: RustMission, draft: MissionDraft) {
  return (
    Boolean(draft.evidence.trim()) && mission.criteria.every(({ id }) => draft.checked.includes(id))
  );
}

interface RustMissionsProps {
  stages: LearningStage[];
  studiedStages: ReadonlySet<string>;
  selected?: RustMission;
  onOpen: (stageId?: string) => void;
}

export function RustMissions({ stages, studiedStages, selected, onOpen }: RustMissionsProps) {
  const [progress, setProgress] = useLocalStorage<MissionProgress>(
    storageKey,
    {},
    {
      deserializer: readProgress,
    },
  );
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: 'start' });
  }, [selected?.stageId]);

  if (!selected) {
    return (
      <section className="rust-missions" aria-labelledby="rust-missions-title">
        <h2 id="rust-missions-title" ref={heading} tabIndex={-1}>
          Missões de Rust
        </h2>
        <p>
          Escolha uma missão a qualquer momento. Ao concluir os passos de um módulo, a trilha indica
          o desafio relacionado.
        </p>
        <ul className="rust-mission-list">
          {rustMissions.map((mission) => {
            const draft = progress[mission.stageId] ?? emptyDraft;
            const stage = stages.find(({ id }) => id === mission.stageId);
            const complete = draft.completed && readyToComplete(mission, draft);
            const started = draft.checked.length > 0 || Boolean(draft.evidence.trim());
            const action = complete
              ? 'Rever missão'
              : started
              ? 'Continuar missão'
              : 'Abrir missão';
            return (
              <li key={mission.stageId} className="rust-mission-card">
                <p>{stage?.title}</p>
                <h3>{mission.title}</h3>
                <p>{mission.scenario}</p>
                <span className="rust-mission-status">
                  {complete ? 'Missão concluída' : started ? 'Em andamento' : 'Disponível'}
                  {studiedStages.has(mission.stageId) ? ' · Módulo estudado' : ''}
                </span>
                <button
                  type="button"
                  className="learning-primary"
                  onClick={() => onOpen(mission.stageId)}
                  aria-label={`${action} ${mission.title}`}
                >
                  {action}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  const draft = progress[selected.stageId] ?? emptyDraft;
  const stage = stages.find(({ id }) => id === selected.stageId);
  const canComplete = readyToComplete(selected, draft);
  const completed = canComplete && draft.completed;

  function save(stageId: string, change: (current: MissionDraft) => MissionDraft) {
    setProgress((current) => ({
      ...current,
      [stageId]: change(current[stageId] ?? emptyDraft),
    }));
  }

  return (
    <section className="rust-missions rust-mission-detail" aria-labelledby="rust-missions-title">
      <h2 id="rust-missions-title" ref={heading} tabIndex={-1}>
        {selected.title}
      </h2>
      <button type="button" className="rust-mission-back" onClick={() => onOpen()}>
        ← Todas as missões
      </button>
      <p>
        {stage?.title}
        {studiedStages.has(selected.stageId) ? ' · Módulo estudado' : ''}
      </p>
      <p>{selected.scenario}</p>
      {selected.starter && (
        <div className="rust-mission-starter">
          <h3>{selected.starter.title}</h3>
          {/* Keep horizontal scrolling available from the keyboard. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <pre tabIndex={0}>
            <code>{selected.starter.code}</code>
          </pre>
        </div>
      )}
      <div>
        <h3>O que fazer</h3>
        <ol>
          {selected.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p>
          Execute e teste o projeto no seu computador com Cargo. Registre aqui o que conseguiu
          verificar.
        </p>
      </div>
      <fieldset className="rust-mission-criteria">
        <legend>Critérios de aceite</legend>
        {selected.criteria.map(({ id, label }) => (
          <label className="option-check" key={id}>
            <input
              type="checkbox"
              checked={draft.checked.includes(id)}
              onChange={(event) => {
                const checked = event.target.checked;
                save(selected.stageId, (current) => ({
                  ...current,
                  checked: checked
                    ? [...new Set([...current.checked, id])]
                    : current.checked.filter((item) => item !== id),
                  completed: false,
                }));
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="rust-mission-evidence">
        Evidências da entrega
        <textarea
          rows={5}
          maxLength={evidenceLimit}
          value={draft.evidence}
          placeholder="Anote o comando ou teste que você executou e o resultado observado."
          onChange={(event) => {
            const evidence = event.target.value;
            save(selected.stageId, (current) => ({ ...current, evidence, completed: false }));
          }}
        />
      </label>
      <div className="rust-mission-actions">
        <button
          type="button"
          className="learning-primary"
          disabled={!canComplete || completed}
          onClick={() =>
            save(selected.stageId, (current) => ({
              ...current,
              completed: readyToComplete(selected, current),
            }))
          }
        >
          Concluir missão
        </button>
        <p role="status">
          {completed
            ? 'Missão concluída.'
            : 'Confira os critérios e registre as evidências para concluir. Seu progresso fica neste dispositivo.'}
        </p>
      </div>
    </section>
  );
}
