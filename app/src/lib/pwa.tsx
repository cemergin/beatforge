// PWA install-prompt banner.
//
// Service-worker registration + update toast lives in
// `components/UpdateBanner.tsx` — that's the single SW lifecycle owner.
// This component handles only the `beforeinstallprompt` flow (Add to
// Home Screen). They are mounted from different roots (main.tsx vs
// App.tsx) but no longer compete over registerSW().

import { useEffect, useState } from 'react';
import { useT } from '../i18n';

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
  const t = useT();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

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
    } catch {
      // localStorage unavailable (private browsing, quota) — non-fatal.
    }
    setInstallDismissed(true);
  };

  if (!installEvent || installDismissed) return null;

  return (
    <div style={toastStyle}>
      <span>{t('pwa.install_prompt')}</span>
      <button style={buttonStyle} onClick={install}>{t('pwa.install_button')}</button>
      <button style={mutedButtonStyle} onClick={dismissInstall}>{t('pwa.dismiss_button')}</button>
    </div>
  );
}
