// Compact language picker for the top-bar. Three pill buttons,
// EN/TR/ES, mutually exclusive, persisted via the LangProvider.
// Visually mirrors the existing .bf-chip nav so the eye doesn't
// have to learn a new pattern.

import { useLang, LANG_LABEL, LANG_NAME, SUPPORTED_LANGS } from '../i18n';

export function LangPicker() {
  const { lang, setLang } = useLang();
  return (
    <div className="bf-langpick" role="group" aria-label="Language">
      {SUPPORTED_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={`bf-langpick-btn ${lang === l ? 'on' : ''}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          title={LANG_NAME[l]}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
