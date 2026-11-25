import { useEffect, useRef, useState } from 'react';
import { PiArrowLeft, PiArrowRight, PiCheckBold, PiLockSimple } from 'react-icons/pi';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const closingId = 'fechamento';

export function useLessonSection(ids: string[], savedIndex: number, showAll: boolean) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [initialIndex] = useState(savedIndex);
  const previousId = useRef<string>();
  const linkedIndex = ids.findIndex(
    (id) => hash === `#${encodeURIComponent(id)}` || hash === `#${id}`,
  );
  const index = linkedIndex < 0 ? Math.max(0, Math.min(initialIndex, ids.length - 1)) : linkedIndex;
  const id = ids[index];

  useEffect(() => {
    const previous = previousId.current;
    previousId.current = id;
    if (!id || (linkedIndex < 0 && index === 0 && (!previous || previous === id))) return;
    const frame = requestAnimationFrame(() => {
      const section = document.getElementById(id);
      section?.querySelector('h2')?.focus({ preventScroll: true });
      const destination = showAll ? section : section?.closest('.lesson-body');
      destination?.scrollIntoView?.({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [id, index, linkedIndex, showAll]);

  function toSection(target: string) {
    return { pathname, search, hash: `#${encodeURIComponent(target)}` };
  }

  return {
    index,
    id,
    toSection,
    openSection: (targetIndex: number) => navigate(toSection(ids[targetIndex])),
  };
}

export function LessonSectionLinks({
  sections,
  navigation,
  reached,
  showAll,
  done,
}: {
  sections: { id: string; title: string }[];
  navigation: ReturnType<typeof useLessonSection>;
  reached: number;
  showAll: boolean;
  done: boolean;
}) {
  return (
    <ol>
      {sections.map(({ id, title }, index) => {
        const passed = index < reached || done;
        return (
          <li key={id}>
            {showAll || done || index <= Math.max(reached, navigation.index) ? (
              <Link
                to={navigation.toSection(id)}
                data-done={passed || undefined}
                aria-current={index === navigation.index ? 'step' : undefined}
              >
                <span aria-hidden="true">
                  {passed ? <PiCheckBold /> : String(index + 1).padStart(2, '0')}
                </span>
                {title}
              </Link>
            ) : (
              <span data-locked aria-disabled="true">
                <span aria-hidden="true">
                  <PiLockSimple />
                </span>
                {title}
                <span className="sr-only"> (ainda não aberta)</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function LessonSectionPager({
  index,
  sectionCount,
  nextTitle,
  onOpen,
}: {
  index: number;
  sectionCount: number;
  nextTitle?: string;
  onOpen: (index: number) => void;
}) {
  return (
    <div className="lesson-continue">
      {index > 0 && (
        <button type="button" className="lesson-button-quiet" onClick={() => onOpen(index - 1)}>
          <PiArrowLeft aria-hidden="true" /> Seção anterior
        </button>
      )}
      {index < sectionCount && (
        <>
          <button type="button" className="lesson-button" onClick={() => onOpen(index + 1)}>
            {nextTitle ? `Continuar: ${nextTitle}` : 'Ir para o fechamento'}
            <PiArrowRight aria-hidden="true" />
          </button>
          <span>
            Seção {index + 1} de {sectionCount}
          </span>
        </>
      )}
    </div>
  );
}
