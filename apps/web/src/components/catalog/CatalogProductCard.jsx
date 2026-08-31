import { ArrowUpRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { localeFor } from "../../i18n/landing.js";
import { landingProductImage } from "../../utils/landing-assets.js";

function money(value, fallback, language, currency) {
  if (value == null) return fallback;
  return `${new Intl.NumberFormat(localeFor(language)).format(Number(value))} ${currency}`;
}

export function CatalogProductCard({ product, language, t, onBuy, priority = false }) {
  const image = landingProductImage(product);
  return <article className="catalog-product-card">
    <Link className="catalog-product-image" to={`/products/${product.slug}`} aria-label={product.title}>
      {image ? <img src={image} alt={product.title} width="560" height="500" loading={priority ? "eager" : "lazy"} decoding="async"/> : <span>{product.title.charAt(0)}</span>}
      {product.featured ? <small>{language === "ru" ? "ПОПУЛЯРНО" : language === "en" ? "POPULAR" : "TANLOV"}</small> : null}
    </Link>
    <div className="catalog-product-copy">
      <p>{product.category || "XION MEDICAL"}</p>
      <Link to={`/products/${product.slug}`}><h2>{product.title}</h2></Link>
      <span>{product.shortDescription}</span>
      <div className="catalog-product-availability"><CheckCircle2 size={14}/>{language === "ru" ? "Наличие уточняется" : language === "en" ? "Availability confirmed on request" : "Mavjudlik so‘rov asosida"}</div>
      <div className="catalog-product-bottom"><strong>{money(product.price, t.priceOnRequest, language, t.currency)}</strong><div><button type="button" onClick={() => onBuy(product)} aria-label={`${product.title} ${t.buy}`}><ShoppingBag size={17}/></button><Link to={`/products/${product.slug}`} aria-label={`${product.title} ${t.details}`}><ArrowUpRight size={18}/></Link></div></div>
    </div>
  </article>;
}
