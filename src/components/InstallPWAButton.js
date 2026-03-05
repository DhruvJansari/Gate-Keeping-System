'use client';

import { useEffect, useState } from 'react';

/**
 * PWA Install button for the login page.
 *
 * - Hides when already running in standalone (installed) mode
 * - Shows "Install App" button when beforeinstallprompt is available
 *   → clicking triggers the native OS install prompt immediately
 * - Hidden on iOS (no programmatic install supported on iOS Safari)
 * - Hidden on desktop/mobile when no prompt is available yet
 */
export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkInstallation = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      ) {
        setIsInstalled(true);
      }
    };

    checkInstallation();

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    // iOS does not support beforeinstallprompt — hide button entirely
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-1.5 rounded-xs border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 active:scale-95 transition-all"
      aria-label="Install VARPL app"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"
        />
      </svg>
      Install App
    </button>
  );
}
