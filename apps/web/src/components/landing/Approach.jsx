import { ArrowRight, Headphones, MapPin } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Approach() {
  const { language, t } = useLanguage();
  const locale = language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US";
  return <section className="section news-section" data-scroll><div className="container news-panel">
    <div className="news-list"><div className="news-tabs"><strong>{t.news}</strong><span>{t.novaLife}</span></div>{t.trustItems.slice(0, 3).map(([number, label], index) => <Reveal className="news-row" key={number} delay={index * .04}><div><time>{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(Date.now() - index * 86400000 * 4))}</time><h3>{label}</h3></div><ArrowRight size={18}/></Reveal>)}</div>
    <aside className="support-card" data-scroll data-scroll-speed="0.06"><div><span><Headphones/></span><p>{t.supportEyebrow}</p><h2>{t.supportTitle}</h2></div><div><MapPin size={18}/><p>{t.supportAddress}</p></div><a href="#contact">{t.supportCta} <ArrowRight size={17}/></a></aside>
  </div></section>;
}
