import { ToastProvider as RadixToastProvider, Viewport } from '@radix-ui/react-toast';
import { Toast } from '../components/Toast';
import { ToastProps } from '../components/Toast/types';

const classByPosition: Record<NonNullable<ToastProps['position']>, string> = {
  'top-right': 'top-0 right-0',
  top: 'top-0 left-1/2 transform -translate-x-1/2',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  bottom: 'bottom-0 left-1/2 transform -translate-x-1/2',
  'bottom-left': 'bottom-0 left-0',
};

interface ToastViewportHostProps {
  toasts: ToastProps[];
  toastPosition: NonNullable<ToastProps['position']>;
}

export default function ToastViewportHost({ toasts, toastPosition }: ToastViewportHostProps) {
  return (
    <RadixToastProvider>
      {toasts.map((toast, index) => (
        <Toast key={`${toast.title || toast.message || ''}-${index}`} {...toast} />
      ))}

      <Viewport
        className={`fixed ${classByPosition[toastPosition]} z-50 m-0 flex w-96 max-w-full list-none flex-col gap-4 p-4 outline-none`}
      />
    </RadixToastProvider>
  );
}
