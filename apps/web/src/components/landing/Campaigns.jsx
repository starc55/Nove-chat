import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Campaigns({ advertisements = [] }) {
  const { language, t } = useLanguage();
  const visible = advertisements.filter((item) => item.placement !== "HERO").slice(0, 5);
  if (!visible.length) return null;
  return (
    <section id="campaigns" className="section campaigns-section"><div className="container">
      <div className="editorial-heading"><div><p className="eyebrow"><span/>{t.campaignsEyebrow}</p><h2>{t.campaignsTitle}</h2></div><p>{t.campaignsText}</p></div>
      <div className="campaign-grid">{visible.map((item, index) => <Reveal className={`campaign-card campaign-${index + 1} ${item.image ? "has-image" : ""}`} key={item.id} delay={index * .04}>
        {item.image ? <img src={item.image} alt="" loading="lazy"/> : null}<div className="campaign-overlay"/><div className="campaign-meta"><span>{t.published}</span><time>{new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : language, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.startAt || item.createdAt))}</time></div><div className="campaign-copy"><h3>{item.title}</h3>{item.description ? <p>{item.description}</p> : null}{item.ctaUrl ? <a href={item.ctaUrl}>{item.ctaLabel || t.learnMore}<ArrowUpRight size={16}/></a> : null}</div>
      </Reveal>)}</div>
    </div></section>
  );
}
