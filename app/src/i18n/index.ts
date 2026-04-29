// Barrel — re-exports the public surface so callers do `import {
// useT, LangProvider } from './i18n'` without knowing which file
// each piece lives in.

export { LangProvider } from './LangProvider';
export { useT, useLang } from './hooks';
export { LANG_LABEL, LANG_NAME, SUPPORTED_LANGS } from './strings';
export type { Key, Lang } from './strings';
