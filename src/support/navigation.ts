import { History, Transition } from 'history';
import { useCallback, useContext, useEffect, useRef } from 'react';
import {
  Navigator,
  UNSAFE_NavigationContext as NavigationContext,
  useLocation,
} from 'react-router-dom';

export type NavigationTransition = {
  retry: () => void;
};

type LegacyBlockableNavigator = Navigator & Partial<Pick<History, 'block'>>;

export function useBlocker(blocker: (tx: NavigationTransition) => void, when = true) {
  const { navigator } = useContext(NavigationContext);
  const location = useLocation();
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;

  // A confirmed transition releases the blocker for its retry. Re-arm it if
  // the new location still renders the same dirty editor.
  useEffect(() => {
    if (!when || !navigator) return;

    const legacyBlock = (navigator as LegacyBlockableNavigator).block;
    if (typeof legacyBlock === 'function') {
      const unblock = legacyBlock.call(navigator, (tx: Transition) => {
        blockerRef.current({
          retry: () => {
            unblock();
            tx.retry();
          },
        });
      });
      return unblock;
    }

    const mutableNavigator = navigator as Navigator;
    const originalPush = mutableNavigator.push;
    const originalReplace = mutableNavigator.replace;
    const originalGo = mutableNavigator.go;
    let active = true;

    const unblock = () => {
      if (!active) return;
      active = false;
      mutableNavigator.push = originalPush;
      mutableNavigator.replace = originalReplace;
      mutableNavigator.go = originalGo;
    };

    mutableNavigator.push = (...args: Parameters<Navigator['push']>) => {
      blockerRef.current({
        retry: () => {
          unblock();
          originalPush.apply(mutableNavigator, args);
        },
      });
    };

    mutableNavigator.replace = (...args: Parameters<Navigator['replace']>) => {
      blockerRef.current({
        retry: () => {
          unblock();
          originalReplace.apply(mutableNavigator, args);
        },
      });
    };

    mutableNavigator.go = (...args: Parameters<Navigator['go']>) => {
      if (args[0] === 0) {
        originalGo.apply(mutableNavigator, args);
        return;
      }
      blockerRef.current({
        retry: () => {
          unblock();
          originalGo.apply(mutableNavigator, args);
        },
      });
    };

    return unblock;
  }, [navigator, when, location]);
}

export default function usePrompt(message: string, when = true) {
  const blocker = useCallback(
    (tx: NavigationTransition) => {
      if (window.confirm(message)) {
        tx.retry();
      }
    },
    [message],
  );

  useBlocker(blocker, when);

  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [message, when]);
}
