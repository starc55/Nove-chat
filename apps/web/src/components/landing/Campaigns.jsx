import { ArrowUpRight, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useHorizontalScroller } from "../../hooks/useHorizontalScroller.js";

export function Campaigns({ advertisements = [], products = [], onBuy }) {
  const { language, t } = useLanguage();
  const productOffers = products.slice(0, 4).map((product) => ({ id: `offer-${product.id}`, title: product.title, description: product.shortDescription, image: product.image, createdAt: product.createdAt, product }));
  const visible = [...advertisements, ...productOffers].slice(0, 7);
  const { ref, scroll, canPrev, canNext } = useHorizontalScroller(visible.length);
  if (!visible.length) return null;
  return <section id="campaigns" className="section campaigns-section"><div className="container">
    <div className="section-line campaign-heading"><div><p className="eyebrow">{t.campaignsEyebrow}</p><h2>{t.campaignsTitle}</h2><span>{t.campaignsText}</span></div><div className="slider-controls"><button type="button" onClick={() => scroll(-1)} disabled={!canPrev} aria-label={t.previousCampaign}><ChevronLeft/></button><button type="button" onClick={() => scroll(1)} disabled={!canNext} aria-label={t.nextCampaign}><ChevronRight/></button></div></div>
    <div className="campaign-track" ref={ref} data-lenis-prevent>{visible.map((item, index) => <article className={`campaign-card campaign-${index + 1} ${item.image ? "has-image" : ""}`} key={item.id} data-scroll data-scroll-speed={index % 2 ? "0.025" : "0.04"}>
      {item.image ? <img src={item.image} alt="" loading="lazy"/> : null}<div className="campaign-overlay"/><div className="campaign-meta"><span>{item.product ? t.navProducts : t.published}</span><time>{new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : language, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.startAt || item.createdAt || Date.now()))}</time></div><div className="campaign-copy"><h3>{item.title}</h3>{item.description ? <p>{item.description}</p> : null}{item.product ? <button type="button" onClick={() => onBuy(item.product)}><ShoppingBag size={15}/>{t.buy}</button> : item.ctaUrl ? <a href={item.ctaUrl}>{item.ctaLabel || t.learnMore}<ArrowUpRight size={16}/></a> : <a href="#products">{t.learnMore}<ArrowUpRight size={16}/></a>}</div>
    </article>)}</div>
  </div></section>;
}
