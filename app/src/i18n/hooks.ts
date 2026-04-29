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
  // shipped patterns. English/Turkish/French/Chinese browsers all
  // resolve to their own locale via the navigator step; browsers
  // reporting any other unsupported locale land on Spanish.
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

/** Variable substitution map for interpolated strings. Values get
 *  String()-ified, so `{ n: 3 }` becomes `"3"` in the output. */
export type TVars = Record<string, string | number>;

/** Translation accessor. Always returns a string — falls back to EN
 *  when the active locale is missing the key, and to the key itself
 *  if EN is somehow missing too (TS should have caught that).
 *  Optional `vars` substitutes `{name}` placeholders in the localized
 *  string with provided values: `t('dirty_guard.confirm', { name })`. */
export function useT(): (key: Key, vars?: TVars) => string {
  const { lang } = useLang();
  return useCallback((key: Key, vars?: TVars): string => {
    let s = STRINGS[lang][key];
    if (s === undefined) {
      if (lang !== 'en' && import.meta.env.DEV) {
        console.warn(`[i18n] Missing ${lang} translation for "${key}" — falling back to en`);
      }
      s = STRINGS.en[key];
    }
    if (s === undefined) return key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return s;
  }, [lang]);
}
