import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Eye, Map, Menu, Phone, Search, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Header({ company = "NOVA", contact = {} }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const primary = [[t.navProducts, "#products"], [t.navCampaigns, "#campaigns"], [t.navReviews, "#reviews"], [t.navContact, "#contact"]];
  const secondary = [[t.navProducts, "#products"], [t.navCampaigns, "#campaigns"], [t.navReviews, "#reviews"]];

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("is-high-contrast", contrast);
    return () => document.documentElement.classList.remove("is-high-contrast");
  }, [contrast]);

  useEffect(() => {
    document.body.classList.toggle("mega-menu-open", open);
    const onKeyDown = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("mega-menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const phone = contact.phone || "+998 90 000 00 00";
  const closeMenu = () => setOpen(false);
  return <motion.header className={`site-header ${compact ? "is-compact" : ""}`} initial={reduceMotion ? false : { opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}>
    <div className="container header-top">
      <a className="wordmark" href="#top" aria-label={`${company} ${t.homeLabel}`}>{company}<i>.</i></a>
      <nav className="desktop-nav" aria-label={t.mainNavigation}>{primary.map(([label, href], index) => <a className={index === 0 ? "is-active" : ""} key={`${href}-${index}`} href={href}>{label}</a>)}</nav>
      <div className="nav-actions">
        <label className="language-select"><span className="sr-only">{t.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="uz">O‘z</option><option value="ru">Рус</option><option value="en">Eng</option></select><ChevronDown size={13}/></label>
        <button type="button" className="header-icon" aria-label={t.contrastMode} aria-pressed={contrast} onClick={() => setContrast((value) => !value)}><Eye size={17}/></button>
        <a className="header-icon" href="#contact" aria-label={t.location}><Map size={17}/></a>
        <a className="nav-cta" href="#contact">{t.contactUs}</a>
      </div>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mega-menu" aria-label={open ? t.closeMenu : t.openMenu}>{open ? <X/> : <Menu/>}</button>
    </div>
    <div className="header-subbar"><div className="container header-subbar-inner">
      <nav className="secondary-nav" aria-label={t.sectionsNavigation}>{secondary.map(([label, href]) => <a key={href} href={href}>{label}<ChevronDown size={12}/></a>)}<a href="#contact">{t.navServices}<ChevronDown size={12}/></a></nav>
      <div className="header-contact"><a href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={16}/><strong>{phone}</strong></a><a href="#contact">{t.contactPrompt}</a><button type="button" aria-label={t.searchProducts} onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}><Search size={18}/></button></div>
    </div></div>
    {open ? <motion.div className="mega-menu-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeMenu()} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><nav id="mega-menu" className="mega-menu" aria-label={t.allSections}><div className="container mega-menu-shell"><button className="mega-close" type="button" onClick={closeMenu} aria-label={t.closeMenu}><X/></button>{t.megaColumns.map((column, columnIndex) => <section className="mega-column" key={column.title}><h2>{column.title}</h2>{column.groups.map((group) => <div className="mega-group" key={group.label}><a className="mega-group-title" href={columnIndex === 0 ? "#products" : columnIndex === 1 ? "#campaigns" : "#contact"} onClick={closeMenu}><ChevronDown size={11}/>{group.label}</a>{group.links.map((link, index) => <a key={link} href={columnIndex === 0 ? "#products" : columnIndex === 1 ? "#campaigns" : index === 1 ? "#reviews" : "#contact"} onClick={closeMenu}>{link}</a>)}</div>)}</section>)}</div></nav></motion.div> : null}
  </motion.header>;
}
