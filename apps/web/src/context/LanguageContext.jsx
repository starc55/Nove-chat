import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy } from "../i18n/landing.js";
import { languageFromPath, localizedPath } from "../config/seo.js";

const LanguageContext = createContext(null);
const LANGUAGE_KEY = "nova_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const pathLanguage = languageFromPath(window.location.pathname);
    if (pathLanguage !== "uz") return pathLanguage;
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return copy[stored] ? stored : "uz";
  });
  const setLanguage = (value) => {
    if (!copy[value]) return;
    localStorage.setItem(LANGUAGE_KEY, value);
    setLanguageState(value);
    if (!/^\/(?:admin|operator)(?:\/|$)/.test(window.location.pathname)) {
      const nextPath = localizedPath(`${window.location.pathname}${window.location.search}${window.location.hash}`, value);
      window.history.replaceState(window.history.state, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    }
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
  }, [language]);
  useEffect(() => {
    const syncLanguage = (event) => {
      if (event.key === LANGUAGE_KEY && copy[event.newValue]) setLanguageState(event.newValue);
    };
    window.addEventListener("storage", syncLanguage);
    return () => window.removeEventListener("storage", syncLanguage);
  }, []);
  const value = useMemo(() => ({ language, setLanguage, t: copy[language] || copy.uz }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak.");
  return context;
}
