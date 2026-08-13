import { ArrowRight, Headphones, MapPin } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Approach() {
  const { t } = useLanguage();
  return <section className="section news-section"><div className="container news-panel">
    <div className="news-list"><div className="news-tabs"><strong>Yangiliklar</strong><span>NOVA hayoti</span></div>{t.trustItems.slice(0, 3).map(([number, label], index) => <Reveal className="news-row" key={number} delay={index * .04}><div><time>{new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(Date.now() - index * 86400000 * 4))}</time><h3>{label}</h3></div><ArrowRight size={18}/></Reveal>)}</div>
    <aside className="support-card"><div><span><Headphones/></span><p>NOVA YORDAM</p><h2>Eng yaqin yechim — bitta suhbat masofasida.</h2></div><div><MapPin size={18}/><p>Toshkent, O‘zbekiston</p></div><a href="#contact">Mutaxassis bilan bog‘lanish <ArrowRight size={17}/></a></aside>
  </div></section>;
}
