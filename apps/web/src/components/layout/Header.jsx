import { useEffect, useState } from "react";
import { ChevronDown, Eye, Map, Menu, Phone, Search, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Header({ company = "NOVA", contact = {} }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const { language, setLanguage, t } = useLanguage();
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

  const phone = contact.phone || "+998 90 000 00 00";

  return <header className={`site-header ${compact ? "is-compact" : ""}`}>
    <div className="container header-top">
      <a className="wordmark" href="#top" aria-label={`${company} bosh sahifa`}>{company}<i>.</i></a>
      <nav className="desktop-nav" aria-label="Asosiy navigatsiya">{primary.map(([label, href], index) => <a className={index === 0 ? "is-active" : ""} key={`${href}-${index}`} href={href}>{label}</a>)}</nav>
      <div className="nav-actions">
        <label className="language-select"><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="uz">O‘z</option><option value="ru">Рус</option><option value="en">Eng</option></select><ChevronDown size={13}/></label>
        <button type="button" className="header-icon" aria-label="Yuqori kontrast rejimi" aria-pressed={contrast} onClick={() => setContrast((value) => !value)}><Eye size={17}/></button>
        <a className="header-icon" href="#contact" aria-label="Manzil"><Map size={17}/></a>
        <a className="nav-cta" href="#contact">Bog‘lanish</a>
      </div>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Menyuni ochish">{open ? <X/> : <Menu/>}</button>
    </div>
    <div className="header-subbar"><div className="container header-subbar-inner">
      <nav className="secondary-nav" aria-label="Bo‘limlar">{secondary.map(([label, href]) => <a key={href} href={href}>{label}<ChevronDown size={12}/></a>)}<a href="#contact">Xizmatlar<ChevronDown size={12}/></a></nav>
      <div className="header-contact"><a href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={16}/><strong>{phone}</strong></a><a href="#contact">Biz bilan bog‘laning</a><button type="button" aria-label="Mahsulotlarni ko‘rish" onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}><Search size={18}/></button></div>
    </div></div>
    {open ? <nav id="mobile-menu" className="mobile-nav" aria-label="Mobil navigatsiya">{primary.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<div className="mobile-languages">{["uz", "ru", "en"].map((item) => <button type="button" className={language === item ? "is-active" : ""} key={item} onClick={() => setLanguage(item)}>{item.toUpperCase()}</button>)}</div></nav> : null}
  </header>;
}
