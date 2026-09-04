import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  Map,
  Menu,
  Moon,
  Phone,
  Search,
  Sun,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { localizedPath, stripLanguagePrefix } from "../../config/seo.js";
import { BrandLogo } from "../common/BrandLogo.jsx";

const THEME_KEY = "xion_theme";

function initialDarkTheme() {
  if (typeof window === "undefined") return false;
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme) return savedTheme === "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function Header({ contact = {}, loading = false }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(initialDarkTheme);
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const currentPath = stripLanguagePrefix(pathname);
  const publicHref = (href) => localizedPath(href, language);
  const reduceMotion = useReducedMotion();
  const primary = [
    [t.navProducts, "/catalog"],
    [t.navMedical, "/medical-institutions"],
    [t.navCompany, "/company"],
    [t.navContact, "/contact"],
  ];
  const secondary = [
    [t.navProducts, "/catalog"],
    [t.navManufacturers, "/manufacturers"],
    [t.navNews, "/news"],
  ];

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const theme = darkTheme ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", darkTheme ? "#0B1017" : "#0D6EFD");
  }, [darkTheme]);

  useEffect(() => {
    document.body.classList.toggle("mega-menu-open", open);
    const onKeyDown = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("mega-menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const phone = contact.phone?.trim() || "";
  const closeMenu = () => setOpen(false);
  return (
    <motion.header
      className={`site-header ${compact ? "is-compact" : ""}`}
      initial={reduceMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container header-top">
        <a className="wordmark" href={publicHref("/")} aria-label={`XION ${t.homeLabel}`}>
          <BrandLogo />
        </a>
        <nav className="desktop-nav" aria-label={t.mainNavigation}>
          {primary.map(([label, href]) => (
            <a
              className={currentPath.startsWith(href) ? "is-active" : ""}
              key={href}
              href={publicHref(href)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <label className="language-select">
            <span className="sr-only">{t.language}</span>
            <select
              data-header-select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="uz">O‘z</option>
              <option value="ru">Рус</option>
              <option value="en">Eng</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <button
            type="button"
            className="header-icon theme-toggle"
            aria-label={darkTheme ? t.lightMode : t.darkMode}
            aria-pressed={darkTheme}
            onClick={() => setDarkTheme((value) => !value)}
          >
            {darkTheme ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a
            className="header-icon"
            href={currentPath === "/" ? "#location-map" : publicHref("/#location-map")}
            aria-label={t.location}
          >
            <Map size={17} />
          </a>
          <a className="nav-cta" href={publicHref("/contact")}>
            {t.contactUs}
          </a>
        </div>
        <button
          type="button"
          className="header-icon theme-toggle mobile-theme-toggle"
          aria-label={darkTheme ? t.lightMode : t.darkMode}
          aria-pressed={darkTheme}
          onClick={() => setDarkTheme((value) => !value)}
        >
          {darkTheme ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <label className="language-select mobile-language-select">
          <span className="sr-only">{t.language}</span>
          <select
            data-header-select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="uz">O‘z</option>
            <option value="ru">Рус</option>
            <option value="en">Eng</option>
          </select>
          <ChevronDown size={13} />
        </label>
        <button
          className="menu-button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mega-menu"
          aria-label={open ? t.closeMenu : t.openMenu}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <div className="header-subbar">
        <div className="container header-subbar-inner">
          <nav className="secondary-nav" aria-label={t.sectionsNavigation}>
            {secondary.map(([label, href]) => (
              <a
                className={currentPath.startsWith(href) ? "is-active" : ""}
                key={href}
                href={publicHref(href)}
              >
                {label}
                <ChevronDown size={12} />
              </a>
            ))}
            <a
              className={currentPath.startsWith("/simurg") ? "is-active" : ""}
              href={publicHref("/simurg")}
            >
              {t.navServices}
              <ChevronDown size={12} />
            </a>
          </nav>
          <div className={`header-contact ${loading ? "is-loading" : ""}`}>
            {loading ? (
              <>
                <span className="contact-skeleton is-phone" />
                <span className="contact-skeleton is-link" />
              </>
            ) : (
              <>
                {phone ? (
                  <a href={`tel:${phone.replace(/\s/g, "")}`}>
                    <Phone size={16} />
                    <strong>{phone}</strong>
                  </a>
                ) : null}
                <a href={publicHref("/contact")}>{t.contactPrompt}</a>
              </>
            )}
            <a
              className="header-search-link"
              href={publicHref("/catalog")}
              aria-label={t.searchProducts}
            >
              <Search size={18} />
            </a>
          </div>
        </div>
      </div>
      {open ? (
        <motion.div
          className="mega-menu-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeMenu()
          }
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <nav id="mega-menu" className="mega-menu" aria-label={t.allSections}>
            <div className="container mega-menu-shell">
              <button
                className="mega-close"
                type="button"
                onClick={closeMenu}
                aria-label={t.closeMenu}
              >
                <X />
              </button>
              <div className="mobile-menu-primary" aria-label={t.mainNavigation}>
                {primary.map(([label, href]) => (
                  <a
                    className={currentPath.startsWith(href) ? "is-active" : ""}
                    key={href}
                    href={publicHref(href)}
                    onClick={closeMenu}
                  >
                    {label}
                  </a>
                ))}
              </div>
              {t.megaColumns.map((column, columnIndex) => (
                <section className="mega-column" key={column.title}>
                  <h2>{column.title}</h2>
                  {column.groups.map((group) => (
                    <div className="mega-group" key={group.label}>
                      <a
                        className="mega-group-title"
                        href={publicHref(
                          columnIndex === 0
                            ? "/catalog"
                            : columnIndex === 1
                            ? "/medical-institutions"
                            : "/contact"
                        )}
                        onClick={closeMenu}
                      >
                        <ChevronDown size={11} />
                        {group.label}
                      </a>
                      {group.links.map((link, index) => (
                        <a
                          key={link}
                          href={publicHref(
                            columnIndex === 0
                              ? "/catalog"
                              : columnIndex === 1
                              ? index === 1
                                ? "/manufacturers"
                                : "/medical-institutions"
                              : index === 0
                              ? "/contact"
                              : index === 1
                              ? "/news"
                              : "/contact"
                          )}
                          onClick={closeMenu}
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </nav>
        </motion.div>
      ) : null}
    </motion.header>
  );
}
