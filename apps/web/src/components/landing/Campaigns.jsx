import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { localizeProduct } from "../../utils/localize-product.js";

export function Campaigns({ advertisements = [], products = [], onBuy }) {
  const { language, t } = useLanguage();
  const [page, setPage] = useState(0);
  const productOffers = products.slice(0, 4).map((sourceProduct) => {
    const product = localizeProduct(sourceProduct, language);
    return { id: `offer-${product.id}`, title: product.title, description: product.shortDescription, image: product.image, createdAt: product.createdAt, product };
  });
  const visible = [...advertisements, ...productOffers].slice(0, 7);
  const pageCount = Math.max(1, Math.ceil(visible.length / 4));
  const pageItems = visible.slice(page * 4, page * 4 + 4);
  useEffect(() => { if (page >= pageCount) setPage(pageCount - 1); }, [page, pageCount]);
  if (!visible.length) return null;
  return <section id="campaigns" className="section campaigns-section"><div className="container">
    <div className="section-line campaign-heading"><div><p className="eyebrow">{t.campaignsEyebrow}</p><h2>{t.campaignsTitle}</h2><span>{t.campaignsText}</span></div><span className="campaign-page-count">{String(page + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</span></div>
    <div className="campaign-grid-shell"><button className="campaign-side-arrow is-prev" type="button" onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)} disabled={pageCount < 2} aria-label={t.previousCampaign}><ChevronLeft/></button><div className="campaign-track" key={page}>{pageItems.map((item, index) => <article className={`campaign-card campaign-${index + 1} ${item.image ? "has-image" : ""}`} key={item.id}>
      {item.image ? <><img src={item.image} alt="" width="900" height="650" loading="lazy" decoding="async"/><div className="campaign-overlay"/></> : null}<div className="campaign-meta"><span>{item.product ? t.navProducts : t.published}</span><time>{new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : language, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.startAt || item.createdAt || Date.now()))}</time></div><div className="campaign-copy"><h3>{item.title}</h3>{item.description ? <p>{item.description}</p> : null}{item.product ? <button type="button" onClick={() => onBuy(item.product)}><ShoppingBag size={15}/>{t.buy}</button> : item.ctaUrl ? <a href={item.ctaUrl}>{item.ctaLabel || t.learnMore}<ArrowUpRight size={16}/></a> : <a href="#products">{t.learnMore}<ArrowUpRight size={16}/></a>}</div>
    </article>)}</div><button className="campaign-side-arrow is-next" type="button" onClick={() => setPage((current) => (current + 1) % pageCount)} disabled={pageCount < 2} aria-label={t.nextCampaign}><ChevronRight/></button></div>
  </div></section>;
}
