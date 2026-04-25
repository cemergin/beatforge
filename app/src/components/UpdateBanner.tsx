// PWA update banner. vite-plugin-pwa with registerType: 'autoUpdate'
// handles the SW lifecycle, but the USER still doesn't know a new
// version downloaded unless we tell them. Without this, they stay on
// the stale version until the next cold load — or, with aggressive
// browser caching, indefinitely.
//
// Flow:
//   1. PWA plugin detects a new SW at /sw.js, downloads it
//   2. Old SW still controls the page (can't just swap mid-session)
//   3. This component polls with useEffect, shows a toast on update
//   4. User clicks "refresh" → sw.update() + location.reload()

import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const register = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => {
        // No UI for this — silent "you can use me offline now."
      },
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot capture of the registerSW handle for the user's "Refresh" click.
    setUpdateSW(() => register);
  }, []);

  if (!needRefresh || !updateSW) return null;

  return (
    <div className="bf-update-banner" role="status">
      <span className="bf-update-text">New version available</span>
      <button
        className="bf-update-refresh"
        onClick={() => void updateSW(true)}
        type="button"
      >
        Refresh
      </button>
      <button
        className="bf-update-dismiss"
        onClick={() => setNeedRefresh(false)}
        type="button"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
