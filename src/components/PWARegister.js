'use client';

import { useEffect } from 'react';

/**
 * Registers the custom service worker for PWA installability.
 * Registers in ALL environments (including dev) so that Chrome can
 * fire the beforeinstallprompt event and allow native installation.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[VARPL PWA] Service worker registered', reg.scope);
          }
        })
        .catch((err) => console.warn('[VARPL PWA] Service worker registration failed', err));
    }
  }, []);

  return null;
}
