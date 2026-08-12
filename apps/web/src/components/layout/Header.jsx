import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Header({ company = "NOVA" }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const navItems = [[t.navProducts, "#products"], [t.navCampaigns, "#campaigns"], [t.navReviews, "#reviews"], [t.navContact, "#contact"]];

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <div className="container nav-shell">
        <a className="wordmark" href="#top" aria-label={`${company} bosh sahifa`}>{company}<i>.</i></a>
        <nav className="desktop-nav" aria-label="Asosiy navigatsiya">{navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
        <div className="nav-actions">
          <label className="language-select"><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select><ChevronDown size={14}/></label>
          <a className="nav-cta" href="#contact">{t.footerCta}<ArrowUpRight size={16}/></a>
        </div>
        <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Menyuni ochish">{open ? <X/> : <Menu/>}</button>
      </div>
      {open ? <nav id="mobile-menu" className="mobile-nav" aria-label="Mobil navigatsiya">{navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={18}/></a>)}<div className="mobile-languages">{["uz", "ru", "en"].map((item) => <button type="button" className={language === item ? "is-active" : ""} key={item} onClick={() => setLanguage(item)}>{item.toUpperCase()}</button>)}</div></nav> : null}
    </header>
  );
}
