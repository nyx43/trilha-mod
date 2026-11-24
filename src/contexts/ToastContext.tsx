import { createContext, lazy, Suspense, useState } from 'react';
import { ToastProps } from '../components/Toast/types';

const ToastViewportHost = lazy(() => import('./ToastViewportHost'));

const DEFAULT_CLOSE_TIMEOUT = 2000;
const DEFAULT_POSITION = 'top-right';

interface ToastContextData {
  addToast: (props: ToastProps) => void;
}

export const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([] as ToastProps[]);
  const [toastPosition, setToastPosition] =
    useState<NonNullable<ToastProps['position']>>(DEFAULT_POSITION);

  function addToast({
    title,
    message,
    position,
    status,
    closable = true,
    duration = DEFAULT_CLOSE_TIMEOUT,
    type = 'foreground',
  }: ToastProps) {
    setToasts((prev) => {
      return [...prev, { title, message, position, status, closable, duration, type }];
    });

    setToastPosition(position ?? DEFAULT_POSITION);
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <Suspense fallback={null}>
          <ToastViewportHost toasts={toasts} toastPosition={toastPosition} />
        </Suspense>
      )}
    </ToastContext.Provider>
  );
}
