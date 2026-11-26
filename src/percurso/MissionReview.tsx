import { FormEvent, useState } from 'react';
import {
  missingReviewEvidence,
  parseReview,
  Review,
  ReviewFields,
} from '../components/DeliveryReview';

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

function readReview(key: string): Review {
  try {
    return parseReview(JSON.parse(localStorage.getItem(key) || '{}'), criteria);
  } catch {
    return {};
  }
}

export function MissionReview({ storageId }: { storageId: string }) {
  const key = `trilha-missao-avaliacao:v1:${storageId}`;
  const [review, setReview] = useState(() => readReview(key));
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();

  function update(next: Review) {
    setReview(next);
    setNotice(undefined);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = missingReviewEvidence(review, criteria);
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
            <ReviewFields criteria={criteria} value={review} onChange={update} />
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
