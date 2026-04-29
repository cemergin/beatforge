// Hooks + context for the i18n module. Lives in its own file so
// React Fast Refresh stays happy — the `LangProvider.tsx` module
// exports a component, and Fast Refresh only reloads cleanly when
// component files don't also export plain functions.

import { createContext, useCallback, useContext } from 'react';
import { STRINGS, SUPPORTED_LANGS, type Key, type Lang } from './strings';

export interface LangCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const LangCtxContext = createContext<LangCtx | null>(null);

export const STORAGE_KEY = 'bf_lang';

export function isSupportedLang(value: unknown): value is Lang {
  return typeof value === 'string'
    && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function detectInitialLang(): Lang {
  // Priority: prior session's choice > browser hint > Spanish.
  // Spanish as cold default reflects BeatForge's audience skew —
  // Latin American + Iberian rhythms make up a large share of the
  // shipped patterns, and ES coverage is one of the launch locales.
  // English browsers still detect to 'en' via the navigator step;
  // only browsers reporting an unsupported locale (de, fr, zh, etc.)
  // land on Spanish.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLang(stored)) return stored;
  } catch { /* storage disabled — fall through */ }
  if (typeof navigator !== 'undefined') {
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    if (isSupportedLang(browser)) return browser;
  }
  return 'es';
}

export function useLang(): LangCtx {
  const ctx = useContext(LangCtxContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

/** Translation accessor. Always returns a string — falls back to EN
 *  when the active locale is missing the key, and to the key itself
 *  if EN is somehow missing too (TS should have caught that). */
export function useT(): (key: Key) => string {
  const { lang } = useLang();
  return useCallback((key: Key): string => {
    const localized = STRINGS[lang][key];
    if (localized !== undefined) return localized;
    if (lang !== 'en') {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing ${lang} translation for "${key}" — falling back to en`);
      }
      const fallback = STRINGS.en[key];
      if (fallback !== undefined) return fallback;
    }
    return key;
  }, [lang]);
}
