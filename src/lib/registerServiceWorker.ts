import { Capacitor } from '@capacitor/core';

/**
 * Registra o service worker do PWA.
 *
 * Só faz sentido na web: no app nativo (Capacitor) os arquivos já vêm
 * empacotados no dispositivo, e um service worker por cima só adicionaria uma
 * camada de cache para dar errado.
 */
export const registerServiceWorker = () => {
  if (Capacitor.isNativePlatform()) return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Falha ao registrar o service worker:', error);
    });
  });
};
