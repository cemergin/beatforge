// LangProvider — the only React component in the i18n module.
// Detects initial language (localStorage > navigator.language > 'en'),
// persists changes, and mirrors `<html lang>` on every change so
// screen readers + spell-check + hyphenation honor the locale.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LangCtxContext, STORAGE_KEY, detectInitialLang, type LangCtx } from './hooks';
import type { Lang } from './strings';

export function LangProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
  }, []);

  const value = useMemo<LangCtx>(() => ({ lang, setLang }), [lang, setLang]);
  return <LangCtxContext.Provider value={value}>{children}</LangCtxContext.Provider>;
}
