import { Capacitor } from '@capacitor/core';

declare const __TRILHA_OFFLINE_APP__: boolean | undefined;
declare const __TRILHA_CONTENT_VERSION__: string | undefined;

export const OFFLINE_APP_BUILD: boolean =
  typeof __TRILHA_OFFLINE_APP__ === 'boolean' ? __TRILHA_OFFLINE_APP__ : false;

export const CONTENT_VERSION: string =
  typeof __TRILHA_CONTENT_VERSION__ === 'string' && __TRILHA_CONTENT_VERSION__.trim()
    ? __TRILHA_CONTENT_VERSION__.trim()
    : 'dev-local';

let offlineModeOverride: boolean | null = null;

export function setOfflineModeForTests(value: boolean | null): void {
  offlineModeOverride = value;
}

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export function isOfflineApp(): boolean {
  if (offlineModeOverride !== null) return offlineModeOverride;
  if (OFFLINE_APP_BUILD) return true;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isTutorEnabled(): boolean {
  return !isOfflineApp();
}

export function isAnalyticsEnabled(): boolean {
  return !isOfflineApp() && !import.meta.env.DEV;
}

export function isRemoteAuthEnabled(): boolean {
  return !isOfflineApp();
}

export function getContentVersion(): string {
  return CONTENT_VERSION;
}
