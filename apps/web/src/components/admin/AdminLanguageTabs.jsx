const languages = [
  { code: "uz", label: "O‘zbekcha", badge: "UZ" },
  { code: "ru", label: "Русский", badge: "RU" },
  { code: "en", label: "English", badge: "EN" }
];

export function AdminLanguageTabs({ value, onChange }) {
  return <div className="admin-language-tabs" role="tablist" aria-label="Kontent tili">
    {languages.map((language) => <button
      type="button"
      role="tab"
      aria-selected={value === language.code}
      className={value === language.code ? "is-active" : ""}
      onClick={() => onChange(language.code)}
      key={language.code}
    ><b>{language.badge}</b><span>{language.label}</span></button>)}
  </div>;
}

export const ADMIN_LANGUAGES = languages;
