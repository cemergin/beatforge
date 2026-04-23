// Service-worker registration + update toast + install-prompt banner.
// Mounted once from main.tsx so App.tsx stays focused on tabs/routing.
// Styles inline to stay self-contained and avoid conflicting with app.css.

import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const INSTALL_STORAGE_KEY = 'bf_install_prompt';

function shouldShowInstall(): boolean {
  try {
    const v = localStorage.getItem(INSTALL_STORAGE_KEY);
    if (!v) return true;
    const { dismissedAt } = JSON.parse(v) as { dismissedAt: number };
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    return Date.now() - dismissedAt > thirtyDays;
  } catch {
    return true;
  }
}

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  background: 'var(--bg-2)',
  color: 'var(--fg)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  boxShadow: '0 8px 30px -10px rgba(0,0,0,0.2)',
  fontFamily: 'var(--sans)',
  fontSize: 13,
};

const buttonStyle: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 12px',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
};
const mutedButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'transparent',
  color: 'var(--muted)',
};

export function PWAStatus() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [refresh, setRefresh] = useState<(() => void) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() { setNeedRefresh(true); },
      onOfflineReady() { /* silent — offline is the default posture */ },
    });
    setRefresh(() => () => void update(true));
  }, []);

  useEffect(() => {
    const onInstallable = (e: Event) => {
      e.preventDefault();
      if (shouldShowInstall()) setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstallable);
    return () => window.removeEventListener('beforeinstallprompt', onInstallable);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'dismissed') dismissInstall();
    setInstallEvent(null);
  };

  const dismissInstall = () => {
    try {
      localStorage.setItem(INSTALL_STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
    } catch {}
    setInstallDismissed(true);
  };

  return (
    <>
      {needRefresh && (
        <div style={toastStyle}>
          <span>New version available</span>
          <button style={buttonStyle} onClick={() => refresh?.()}>Reload</button>
          <button style={mutedButtonStyle} onClick={() => setNeedRefresh(false)}>Later</button>
        </div>
      )}
      {installEvent && !installDismissed && (
        <div style={{ ...toastStyle, bottom: needRefresh ? 80 : 16 }}>
          <span>Install BeatForge · works offline</span>
          <button style={buttonStyle} onClick={install}>Install</button>
          <button style={mutedButtonStyle} onClick={dismissInstall}>Not now</button>
        </div>
      )}
    </>
  );
}
