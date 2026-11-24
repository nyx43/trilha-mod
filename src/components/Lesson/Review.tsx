import { useState } from 'react';
import { PiCards } from 'react-icons/pi';
import { findLesson } from '../../lessons';
import { dueCardKeys, useReviewStore } from '../../lessons/progress';
import { DeckCard, Flashcards } from './Flashcards';

async function loadDeck(keys: string[]): Promise<DeckCard[]> {
  const byLesson = new Map<string, string[]>();
  keys.forEach((key) => {
    const separator = key.indexOf(':');
    if (separator <= 0) return;
    const lessonId = key.slice(0, separator);
    const cardId = key.slice(separator + 1);
    if (!cardId) return;
    byLesson.set(lessonId, [...(byLesson.get(lessonId) || []), cardId]);
  });
  const decks = await Promise.all(
    [...byLesson].map(async ([lessonId, cardIds]) => {
      const lesson = findLesson(lessonId);
      if (!lesson) return [];
      const { content } = await lesson.load();
      return content.cards
        .filter((card) => cardIds.includes(card.id))
        .map((card) => ({
          key: `${lessonId}:${card.id}`,
          front: card.front,
          back: card.back,
          source: lesson.title,
        }));
    }),
  );
  return decks.flat();
}

export function Review() {
  const review = useReviewStore();
  const due = dueCardKeys(review);
  const total = Object.keys(review.cards).length;
  const nextDue = Object.values(review.cards)
    .map((state) => state?.due)
    .filter((date): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()[0];
  const nextDueLabel = nextDue ? nextDue.split('-').reverse().join('/') : undefined;
  const [deck, setDeck] = useState<DeckCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <section id="revisao" className="lessons-review" aria-labelledby="review-title">
      <PiCards aria-hidden="true" className="lessons-review-icon" />
      <div>
        <h2 id="review-title">Revisão de hoje</h2>
        {deck && deck.length > 0 ? (
          <Flashcards cards={deck} />
        ) : deck ? (
          <p role="status">
            Nenhum cartão disponível para carregar agora. Conclua uma aula para adicionar novos
            cartões.
          </p>
        ) : total === 0 ? (
          <p>
            Ao concluir uma aula, os cartões dela entram aqui e voltam em intervalos crescentes: um
            dia, três, uma semana. Revisar no momento em que você está quase esquecendo é o que faz
            a memória durar.
          </p>
        ) : due.length === 0 ? (
          <p>
            Nada para revisar hoje. Você tem {total} {total === 1 ? 'cartão' : 'cartões'} no baralho
            {nextDueLabel
              ? `; a próxima revisão está prevista para ${nextDueLabel}.`
              : '; eles voltam quando for a hora.'}
          </p>
        ) : (
          <>
            <p>
              {due.length} {due.length === 1 ? 'cartão pronto' : 'cartões prontos'} para revisar.
              Leva poucos minutos.
            </p>
            <button
              type="button"
              className="lesson-button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setFailed(false);
                try {
                  setDeck(await loadDeck(due));
                } catch {
                  setFailed(true);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Preparando cartões…' : 'Começar revisão'}
            </button>
            {failed && <p role="alert">Não foi possível carregar os cartões. Tente de novo.</p>}
          </>
        )}
      </div>
    </section>
  );
}
