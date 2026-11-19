import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  persistenceLessonId,
  persistencePracticeSection,
  reservationsPracticeUrl,
} from '../lessons/persistencePilot';

const criteria = [
  {
    id: 'contrato',
    title: 'Contrato da API',
    hint: 'Anote os comandos ou testes que mostram GET 200, POST 201 e POST 400.',
  },
  {
    id: 'lista',
    title: 'Lista atualizada e persistência',
    hint: 'Registre como conferiu a lista vazia, o item após o cadastro e sua presença depois de recarregar.',
  },
  {
    id: 'reinicio',
    title: 'Persistência após reiniciar a API (piloto opcional)',
    hint: 'Registre sua previsão, o ID testado, o que fez, as consultas antes e depois, sua conclusão e a ajuda usada.',
  },
  {
    id: 'falhas',
    title: 'Tratamento de falhas',
    hint: 'Descreva a falha reproduzida, a mensagem exibida e o que aconteceu com os dados do formulário.',
  },
  {
    id: 'acessibilidade',
    title: 'Celular e teclado',
    hint: 'Anote a largura testada e como verificou foco, ordem de Tab e ausência de rolagem horizontal.',
  },
  {
    id: 'decisoes',
    title: 'Decisões técnicas',
    hint: 'Escolha uma decisão sobre dados, React ou Tailwind. Explique por que a tomou e qual limite encontrou.',
  },
];

const sources = {
  pending: 'Pendente',
  adjustment: 'Precisa de ajuste',
  observed: 'Cumprido · observação própria',
  tested: 'Cumprido · teste que executei',
  reviewed: 'Cumprido · revisão de outra pessoa',
} as const;

type Result = keyof typeof sources;
type RecordEntry = { result: Result; evidence: string };
type Review = Record<string, RecordEntry>;

const maxEvidence = 1500;
const emptyEntry: RecordEntry = { result: 'pending', evidence: '' };

function knownResult(value: unknown): value is Result {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(sources, value);
}

function readReview(key: string): Review {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    const entries: Review = {};
    for (const { id } of criteria) {
      const entry = saved[id];
      if (entry && knownResult(entry.result) && typeof entry.evidence === 'string') {
        entries[id] = { result: entry.result, evidence: entry.evidence.slice(0, maxEvidence) };
      }
    }
    return entries;
  } catch {
    return {};
  }
}

export function MissionReview({ storageId }: { storageId: string }) {
  const key = `trilha-missao-avaliacao:v1:${storageId}`;
  const [review, setReview] = useState(() => readReview(key));
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();

  function update(id: string, change: Partial<RecordEntry>) {
    setReview((previous) => ({
      ...previous,
      [id]: { ...emptyEntry, ...previous[id], ...change },
    }));
    setNotice(undefined);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = criteria.find(({ id }) => {
      const entry = review[id];
      return entry && entry.result !== 'pending' && !entry.evidence.trim();
    });
    if (missing) {
      setNotice({ text: `Registre uma evidência para “${missing.title}”.`, error: true });
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(review));
      setNotice({ text: 'Avaliação salva neste navegador.', error: false });
    } catch {
      setNotice({
        text: 'O navegador não conseguiu salvar a avaliação. Seu rascunho continua aberto.',
        error: true,
      });
    }
  }

  return (
    <section className="guide-section lesson-section" aria-labelledby="missao-avaliacao-title">
      <h2 id="missao-avaliacao-title">
        <span aria-hidden="true">04</span>
        Avaliação da entrega
      </h2>
      <details className="lesson-reveal lesson-reveal-simple">
        <summary>Registrar resultados e evidências</summary>
        <div>
          <form className="mission-review" onSubmit={save}>
            <p className="guide-text">
              Registre o que você conferiu no seu projeto e como chegou ao resultado. As anotações
              ficam neste navegador.
            </p>
            {criteria.map(({ id, title, hint }) => {
              const entry = review[id] ?? emptyEntry;
              return (
                <fieldset className="mission-review-item" key={id}>
                  <legend>{title}</legend>
                  <label>
                    Resultado
                    <select
                      value={entry.result}
                      onChange={(event) => {
                        const result = event.target.value;
                        if (knownResult(result)) update(id, { result });
                      }}
                    >
                      {Object.entries(sources).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Evidência
                    <textarea
                      rows={3}
                      maxLength={maxEvidence}
                      placeholder={hint}
                      value={entry.evidence}
                      onChange={(event) => update(id, { evidence: event.target.value })}
                    />
                  </label>
                  {id === 'reinicio' && (
                    <p className="guide-text">
                      Registre aqui o teste no seu projeto. Para praticar, abra o{' '}
                      <Link
                        className="lesson-trail-link"
                        to={`/aula/${persistenceLessonId}#${persistencePracticeSection}`}
                      >
                        desafio do catálogo
                      </Link>{' '}
                      ou guarde o{' '}
                      <Link className="lesson-trail-link" to={reservationsPracticeUrl}>
                        caso das reservas
                      </Link>{' '}
                      para outro dia.
                    </p>
                  )}
                </fieldset>
              );
            })}
            <div className="lessons-actions">
              <button className="lesson-button" type="submit">
                Salvar avaliação
              </button>
            </div>
            {notice && <p role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
          </form>
        </div>
      </details>
    </section>
  );
}
