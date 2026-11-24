import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Integrates the Android hardware Back button with dialogs, in-app routing,
 * and deep-entry lesson screens so pressing Back never traps or abruptly closes
 * the app while studying.
 */
export function registerAndroidBackButton(): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => undefined;
  }

  let removed = false;
  const listenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    // 1. If a modal/drawer dialog is open, try closing it via Escape first
    const openDialog = document.querySelector('[role="dialog"]');
    if (openDialog) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }

    // 2. Navigate back inside the app if browser history allows
    if (canGoBack && window.history.length > 1) {
      window.history.back();
      return;
    }

    // 3. If user launched directly into a deep route (e.g. /aula/...), return to Home first
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    // 4. Already on Home with empty stack -> exit cleanly
    CapacitorApp.exitApp();
  });

  const urlListenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'trilhamod:') {
        const route = `/${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`.replace(
          /\/+/g,
          '/',
        );
        if (route && route !== window.location.pathname) {
          window.history.pushState({}, '', route);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    } catch {
      // Ignore malformed deep links
    }
  });

  return () => {
    if (removed) return;
    removed = true;
    listenerPromise.then((handle) => handle.remove()).catch(() => undefined);
    urlListenerPromise.then((handle) => handle.remove()).catch(() => undefined);
  };
}
