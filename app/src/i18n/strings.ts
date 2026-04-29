// User-facing UI strings — single source of truth.
//
// English is authoritative: every key listed in EN is required. TR
// and ES are partial — missing keys fall back to EN at runtime (with
// a dev-mode console warning). That makes adding a new string a
// one-line change in EN; translations follow when contributors add them.
//
// Why a hand-rolled table instead of i18next/lingui:
//   - ~150 strings total, no pluralization-heavy content
//   - one locale active at a time (no cross-fade), no dynamic load
//   - bundle budget: <30 KB gz for infra + 3 locales
//   - TS infers Key from `keyof typeof EN` so a typo is a compile error
//   - PWA precaches everything, so locale switching is instant offline
//
// NOT translated (deliberate):
//   - Pattern names (Karşılama, Bulería, Konnakol) — proper nouns
//   - Pattern stories — English baseline; per-pattern translation is
//     a separate per-PR contribution flow, not blocking i18n shipping
//   - Region IDs / tag enums — internal, never user-visible

export type Lang = 'en' | 'tr' | 'es';
export const SUPPORTED_LANGS: readonly Lang[] = ['en', 'tr', 'es'] as const;

export const LANG_LABEL: Record<Lang, string> = {
  en: 'EN',
  tr: 'TR',
  es: 'ES',
};

/** Long-form name for the picker tooltip. */
export const LANG_NAME: Record<Lang, string> = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
};

const EN = {
  // ── Top-bar navigation ───────────────────────────────────────────
  'nav.practice': 'Practice',
  'nav.library':  'Library',
  'nav.studio':   'Studio',

  // ── Transport ────────────────────────────────────────────────────
  'transport.play': 'play',
  'transport.stop': 'stop',
  'transport.tap':  'tap',
  'transport.bpm':  'BPM',

  // ── Common actions (used in multiple modes) ──────────────────────
  'common.save':    'save',
  'common.cancel':  'cancel',
  'common.new':     'new',
  'common.search':  'search',
  'common.close':   'close',
  'common.delete':  'delete',
  'common.copy':    'copy',
  'common.share':   'share',
} as const;

export type Key = keyof typeof EN;

/** Turkish — founder is native. Update freely. */
const TR: Partial<Record<Key, string>> = {
  'nav.practice': 'Pratik',
  'nav.library':  'Kütüphane',
  'nav.studio':   'Stüdyo',

  'transport.play': 'çal',
  'transport.stop': 'durdur',
  'transport.tap':  'tap',
  'transport.bpm':  'BPM',

  'common.save':    'kaydet',
  'common.cancel':  'iptal',
  'common.new':     'yeni',
  'common.search':  'ara',
  'common.close':   'kapat',
  'common.delete':  'sil',
  'common.copy':    'kopyala',
  'common.share':   'paylaş',
};

/** Spanish — best-effort defensible translations. Native speakers
 *  welcome to refine via PR. */
const ES: Partial<Record<Key, string>> = {
  'nav.practice': 'Práctica',
  'nav.library':  'Biblioteca',
  'nav.studio':   'Estudio',

  'transport.play': 'tocar',
  'transport.stop': 'parar',
  'transport.tap':  'tap',
  'transport.bpm':  'BPM',

  'common.save':    'guardar',
  'common.cancel':  'cancelar',
  'common.new':     'nuevo',
  'common.search':  'buscar',
  'common.close':   'cerrar',
  'common.delete':  'eliminar',
  'common.copy':    'copiar',
  'common.share':   'compartir',
};

export const STRINGS: { en: typeof EN } & Record<Lang, Partial<Record<Key, string>>> = {
  en: EN,
  tr: TR,
  es: ES,
};
