import { FormEvent, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, localDay } from '../../lessons/progress';
import {
  challengePhases,
  diagnosticPhases,
  guidedPhases,
  PilotPhase,
  reservationsPracticeUrl,
} from '../../lessons/persistencePilot';

type PilotId = 'diagnostico' | 'guiado' | 'livros' | 'reservas';
type Help = 'sintaxe' | 'dica' | 'solucao';
type Attempt = {
  phases?: Record<string, { answers: string[]; day: string }>;
  help?: Partial<Record<Help, string>>;
  revision?: string;
};

const labHost = 'http://127.0.0.1:4174';
const labDownload = '/praticas/onde-o-dado-mora/servidor.mjs';

function readAttempt(key: string): Attempt {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}') as unknown;
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? (saved as Attempt) : {};
  } catch {
    return {};
  }
}

function LabLaunch({ mode }: { mode?: 'livros' | 'reservas' }) {
  return (
    <p className="guide-text">
      Com Node.js 24 ou superior,{' '}
      <a download href={labDownload}>
        baixe servidor.mjs
      </a>{' '}
      e, na pasta do arquivo, execute <code>node servidor.mjs{mode ? ` ${mode}` : ''}</code>.{' '}
      {mode && 'Se outro modo do laboratório estiver rodando, encerre-o antes de abrir este. '}
      <a href={labHost} target="_blank" rel="noreferrer">
        Abrir laboratório local em outra aba
      </a>
      .
    </p>
  );
}

function PhaseForm({ phase, onSave }: { phase: PilotPhase; onSave: (answers: string[]) => void }) {
  const [blank, setBlank] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const answers = phase.fields.map((_, index) => String(data.get(String(index)) || '').trim());
    if (phase.fields.some((field, index) => !field.optional && !answers[index])) {
      setBlank(true);
      return;
    }
    onSave(answers);
  }

  return (
    <form className="mission-review" onSubmit={submit}>
      <fieldset className="mission-review-item">
        <legend>{phase.title}</legend>
        {phase.fields.map(({ label, options, optional }, index) => (
          <label key={label}>
            {label}
            {optional && ' (opcional)'}
            {options ? (
              <select name={String(index)} defaultValue="" required={!optional}>
                <option value="">Selecione</option>
                {options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <textarea name={String(index)} rows={2} maxLength={1500} required={!optional} />
            )}
          </label>
        ))}
      </fieldset>
      {blank && <p role="alert">Preencha os campos obrigatórios com uma resposta.</p>}
      <div>
        <button type="submit" className="lesson-button">
          {phase.submitLabel}
        </button>
      </div>
    </form>
  );
}

function HelpPanel({
  kind,
  seen,
  onOpen,
  children,
}: {
  kind: Help;
  seen?: string;
  onOpen: (kind: Help) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const label = {
    sintaxe: 'comandos de terminal',
    dica: 'dica de estratégia',
    solucao: 'solução comentada',
  }[kind];

  return (
    <div>
      <button
        type="button"
        className="lesson-button-quiet"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open && !seen) onOpen(kind);
          setOpen(!open);
        }}
      >
        {open ? 'Recolher' : 'Ver'} {label}
        {seen && !open ? ' (já consultado)' : ''}
      </button>
      <div id={id} hidden={!open} className="lesson-pilot-help">
        {open && children}
      </div>
    </div>
  );
}

export function PersistencePilot({ id }: { id: PilotId }) {
  const titleId = useId();
  const key = `trilha-avaliacao:onde-o-dado-mora:v1:${id}`;
  const [attempt, setAttempt] = useState(() => readAttempt(key));
  const [notice, setNotice] = useState(false);
  const reservations = id === 'reservas';
  const guided = id === 'guiado';
  const challenge = id === 'livros' || reservations;
  const phases = guided
    ? guidedPhases
    : challenge
    ? challengePhases(reservations)
    : diagnosticPhases;
  const active = phases.findIndex((phase) => !attempt.phases?.[phase.id]);
  const done = active === -1;
  const title = guided
    ? 'Experimento guiado'
    : reservations
    ? 'Uma reserva depois de reabrir o serviço'
    : id === 'livros'
    ? 'Desafio do catálogo'
    : 'Diagnóstico de persistência';

  function write(next: Attempt) {
    setAttempt(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setNotice(false);
    } catch {
      setNotice(true);
    }
  }

  function recordHelp(kind: Help) {
    write({ ...attempt, help: { ...attempt.help, [kind]: localDay() } });
  }

  function savePhase(phase: PilotPhase, answers: string[]) {
    write({
      ...attempt,
      phases: { ...attempt.phases, [phase.id]: { answers, day: localDay() } },
    });
  }

  const lastSaved = phases[done ? phases.length - 1 : active - 1];
  const evidenceDay = attempt.phases?.evidencia?.day;
  const reviewDay =
    typeof evidenceDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(evidenceDay)
      ? addDays(evidenceDay, 7).split('-').reverse().join('/')
      : undefined;

  return (
    <section className="lesson-mission lesson-pilot" aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      {guided && (
        <p className="guide-text">
          Compare dois painéis do mesmo laboratório, Memória da API e Arquivo SQLite. Registre cada
          previsão antes de executar o passo correspondente.
        </p>
      )}
      {id === 'livros' && (
        <p className="guide-text">
          Você recebeu uma API de catálogo. Escolha como testar se um cadastro novo vai sobreviver
          ao reinício. Preveja, execute e explique.
        </p>
      )}
      {reservations && (
        <p className="guide-text">
          O cliente precisa recuperar uma reserva depois de fechar e reabrir o serviço. Como você
          verificaria a entrega? Registre sua ideia antes de revisar a aula ou consultar ajuda.
        </p>
      )}
      <p className="guide-text">Cada etapa salva fica registrada neste navegador.</p>
      {lastSaved && (
        <details>
          <summary>Ver respostas registradas</summary>
          {phases
            .filter((phase) => Array.isArray(attempt.phases?.[phase.id]?.answers))
            .map((phase) => (
              <div key={phase.id} className="lesson-pilot-record">
                <h4>{phase.title}</h4>
                <dl>
                  {phase.fields.map((field, index) => {
                    const savedAnswers = attempt.phases?.[phase.id]?.answers;
                    const answer = Array.isArray(savedAnswers) ? savedAnswers[index] : undefined;
                    return (
                      answer && (
                        <div key={field.label}>
                          <dt>{field.label}</dt>
                          <dd>{answer}</dd>
                        </div>
                      )
                    );
                  })}
                </dl>
                {phase.action && <p className="guide-text">{phase.action}</p>}
              </div>
            ))}
        </details>
      )}
      {notice && (
        <p role="alert">O navegador não conseguiu gravar. As respostas continuam nesta página.</p>
      )}
      {guided && active !== 0 && !done && <LabLaunch />}
      {guided && !done && lastSaved?.action && <p className="guide-text">{lastSaved.action}</p>}
      {challenge && active === 1 && (
        <>
          <LabLaunch mode={id} />
          <HelpPanel kind="sintaxe" seen={attempt.help?.sintaxe} onOpen={recordHelp}>
            <p className="guide-text">
              Para parar um servidor Node no terminal, use <kbd>Ctrl+C</kbd>. Para iniciá-lo, repita{' '}
              <code>node servidor.mjs {id}</code> na mesma pasta. O laboratório mostra a resposta do
              POST ou do GET e o identificador do processo.
            </p>
          </HelpPanel>
          <HelpPanel kind="dica" seen={attempt.help?.dica} onOpen={recordHelp}>
            <p className="guide-text">
              Um 201 confirma que a API aceitou o cadastro. Um servidor que só guarda dados em
              memória também pode responder 201. O que você pode reiniciar para distinguir esse
              caso? Como pode confirmar que encontrou o mesmo registro?
            </p>
          </HelpPanel>
        </>
      )}
      {!done && (
        <PhaseForm
          key={phases[active].id}
          phase={phases[active]}
          onSave={(answers) => savePhase(phases[active], answers)}
        />
      )}
      {done && id === 'diagnostico' && (
        <p className="guide-text">
          Sua hipótese inicial ficou registrada. Compare-a com os testes ao longo da aula.
        </p>
      )}
      {done && guided && (
        <p className="guide-text">
          No laboratório, as duas APIs mantêm o livro após o F5. Após reiniciar, a memória volta ao
          estado inicial e o SQLite mantém o novo registro no mesmo arquivo.
        </p>
      )}
      {done && challenge && (
        <>
          <p className="guide-text" role="status">
            Tentativa registrada.
          </p>
          {(attempt.help?.sintaxe || attempt.help?.dica) && (
            <p className="guide-text">
              Ajuda aberta durante o teste:{' '}
              {[
                attempt.help.sintaxe && 'comandos de terminal',
                attempt.help.dica && 'dica de estratégia',
              ]
                .filter(Boolean)
                .join(' e ')}
              .
            </p>
          )}
          <HelpPanel kind="solucao" seen={attempt.help?.solucao} onOpen={recordHelp}>
            <p className="guide-text">
              Crie um registro novo, anote o ID do POST e encontre o mesmo registro no GET. Pare e
              inicie o processo na mesma pasta, com a mesma configuração, e repita o GET comparando
              ID e conteúdo. O F5 sozinho deixaria as duas hipóteses em aberto.
            </p>
            <p className="guide-text">
              {reservations
                ? 'Neste laboratório, a reserva sobrevive porque o serviço usa o mesmo arquivo SQLite. Encontrá-la de novo demonstra que ela sobreviveu a esse reinício. Para identificar SQLite, confira a configuração ou o código.'
                : 'Neste laboratório, o novo livro some porque a lista ficava na memória do processo, embora o POST tenha retornado 201. O resultado mostra que esse cadastro não sobreviveu ao reinício testado.'}
            </p>
          </HelpPanel>
          {attempt.help?.solucao && (
            <>
              <LabLaunch mode={id} />
              <form
                className="mission-review"
                onSubmit={(event) => {
                  event.preventDefault();
                  const revision = String(
                    new FormData(event.currentTarget).get('revision') || '',
                  ).trim();
                  if (revision) write({ ...attempt, revision });
                }}
              >
                <fieldset className="mission-review-item">
                  <legend>Se repetir o teste</legend>
                  <label>
                    O que você mudou e que evidência encontrou?
                    <textarea
                      name="revision"
                      rows={2}
                      maxLength={1500}
                      defaultValue={attempt.revision}
                      required
                    />
                  </label>
                </fieldset>
                <div>
                  <button type="submit" className="lesson-button">
                    Salvar revisão do teste
                  </button>
                </div>
                {attempt.revision && (
                  <p role="status">Revisão registrada junto da primeira tentativa.</p>
                )}
              </form>
            </>
          )}
        </>
      )}
      {id === 'livros' && (
        <p className="guide-text">
          {reviewDay
            ? `Volte por volta de ${reviewDay} para resolver o`
            : 'Guarde para outro dia o'}{' '}
          <Link className="lesson-trail-link" to={reservationsPracticeUrl}>
            caso das reservas
          </Link>
          .
        </p>
      )}
    </section>
  );
}
