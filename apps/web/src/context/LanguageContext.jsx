import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy } from "../i18n/landing.js";

const LanguageContext = createContext(null);
const LANGUAGE_KEY = "nova_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(LANGUAGE_KEY) || "uz");
  const setLanguage = (value) => {
    if (!copy[value]) return;
    localStorage.setItem(LANGUAGE_KEY, value);
    setLanguageState(value);
  };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: copy[language] || copy.uz }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak.");
  return context;
}
