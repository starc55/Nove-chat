import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { localeFor } from "../../i18n/landing.js";
import { landingProductImage, xionAssetUrl } from "../../utils/landing-assets.js";

function money(value, fallback, language, currency) {
  if (value == null) return fallback;
  return `${new Intl.NumberFormat(localeFor(language)).format(Number(value))} ${currency}`;
}

export function CatalogProductCard({ product, language, t, onBuy, priority = false }) {
  const gallery = useMemo(() => [...new Set([landingProductImage(product), ...(product.images || []).map(({ url }) => xionAssetUrl(url))].filter(Boolean))], [product]);
  const [imageIndex, setImageIndex] = useState(0);
  const variants = product.variants || [];
  const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const pricedVariants = variants.map((variant) => variant.price).filter((price) => price != null).map(Number);
  const displayPrice = product.price ?? (pricedVariants.length ? Math.min(...pricedVariants) : null);
  const stockText = variants.length
    ? totalStock > 0
      ? language === "ru" ? `${totalStock} шт. в наличии` : language === "en" ? `${totalStock} in stock` : `${totalStock} dona mavjud`
      : language === "ru" ? "Нет в наличии" : language === "en" ? "Out of stock" : "Sotuvda yo‘q"
    : product.stock != null
      ? product.stock > 0
        ? language === "ru" ? `${product.stock} шт. в наличии` : language === "en" ? `${product.stock} in stock` : `${product.stock} dona mavjud`
        : language === "ru" ? "Нет в наличии" : language === "en" ? "Out of stock" : "Sotuvda yo‘q"
      : language === "ru" ? "Наличие по запросу" : language === "en" ? "Availability on request" : "Mavjudlik so‘rov asosida";
  const outOfStock = variants.length ? totalStock === 0 : product.stock === 0;

  const selectByPointer = (event) => {
    if (gallery.length < 2 || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(.999, (event.clientX - rect.left) / rect.width));
    setImageIndex(Math.floor(ratio * gallery.length));
  };

  return <article className="catalog-product-card">
    <div className="catalog-product-image" onPointerMove={selectByPointer} onPointerLeave={() => setImageIndex(0)}>
      <Link className="catalog-product-image-link" to={`/products/${product.slug}`} aria-label={product.title}>
        {gallery[imageIndex] ? <img key={gallery[imageIndex]} src={gallery[imageIndex]} alt={product.title} width="560" height="500" loading={priority ? "eager" : "lazy"} decoding="async"/> : <span>{product.title.charAt(0)}</span>}
        {product.showTags !== false && (product.tags || []).length ? <div className="catalog-product-tags">{product.tags.slice(0, 2).map((tag) => <small key={tag}>{tag}</small>)}</div> : product.featured ? <small>{language === "ru" ? "ПОПУЛЯРНО" : language === "en" ? "POPULAR" : "TANLOV"}</small> : null}
        {gallery.length > 1 ? <div className="catalog-image-progress">{gallery.map((_, index) => <i className={index === imageIndex ? "is-active" : ""} key={index}/>)}</div> : null}
      </Link>
      {gallery.length > 1 ? <><button className="catalog-image-arrow is-prev" type="button" onClick={() => setImageIndex((current) => (current - 1 + gallery.length) % gallery.length)} aria-label="Oldingi rasm"><ChevronLeft/></button><button className="catalog-image-arrow is-next" type="button" onClick={() => setImageIndex((current) => (current + 1) % gallery.length)} aria-label="Keyingi rasm"><ChevronRight/></button></> : null}
    </div>
    <div className="catalog-product-copy">
      <p>{product.category || "XION MEDICAL"}</p><Link to={`/products/${product.slug}`}><h2>{product.title}</h2></Link><span>{product.shortDescription}</span>
      <div className={`catalog-product-availability ${outOfStock ? "is-out" : ""}`}><CheckCircle2 size={14}/>{stockText}</div>
      <div className="catalog-product-bottom"><strong>{money(displayPrice, t.priceOnRequest, language, t.currency)}</strong><div><button type="button" onClick={() => onBuy(product)} aria-label={`${product.title} ${t.buy}`} disabled={outOfStock}><ShoppingBag size={17}/></button><Link to={`/products/${product.slug}`} aria-label={`${product.title} ${t.details}`}><ArrowUpRight size={18}/></Link></div></div>
    </div>
  </article>;
}
