import { ArrowUpRight, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useHorizontalScroller } from "../../hooks/useHorizontalScroller.js";
import { localeFor } from "../../i18n/landing.js";
import { localizeProduct } from "../../utils/localize-product.js";

const productBackgrounds = [
  "/media/products/product-1.jpg",
  "/media/products/product-2.jpg",
  "/media/products/product-3.jpg",
  "/media/products/product-4.jpg",
  "/media/products/product-5.jpg",
  "/media/products/product-6.jpg",
];

function money(value, fallback, language, currency) {
  if (value == null) return fallback;
  return `${new Intl.NumberFormat(localeFor(language)).format(Number(value))} ${currency}`;
}

export function Services({ products, loading, error, onBuy }) {
  const { language, t } = useLanguage();
  const { ref: trackRef, scroll, canPrev, canNext } = useHorizontalScroller(products.length);
  return <section id="products" className="section products-section"><div className="container product-showcase">
    <div className="section-line"><div><p className="eyebrow">{t.productsEyebrow}</p><h2>{t.navProducts}</h2></div><div className="slider-controls"><button type="button" onClick={() => scroll(-1)} disabled={!canPrev} aria-label={t.previousProduct}><ChevronLeft/></button><button type="button" onClick={() => scroll(1)} disabled={!canNext} aria-label={t.nextProduct}><ChevronRight/></button></div></div>
    {loading ? <div className="product-grid">{[1,2,3].map((n) => <div className="product-card product-skeleton" key={n}/>)}</div> : null}
    {error ? <div className="inline-state"><p>{error}</p></div> : null}
    {!loading && !error && products.length === 0 ? <div className="inline-state"><p>{t.noProducts}</p></div> : null}
    {!loading && !error && products.length ? <div className="product-grid" ref={trackRef}>{products.map((sourceProduct, index) => { const product = localizeProduct(sourceProduct, language); const background = productBackgrounds[index % productBackgrounds.length]; return <Reveal className={`product-card has-catalog-media ${index === 0 ? "is-featured" : ""}`} delay={index * .05} key={product.id} style={{ "--product-backdrop": `url("${background}")` }}>
      <div className="product-accent"/><div className="product-index">{String(index + 1).padStart(2, "0")}</div><div className="product-catalog-media"><img src={product.image || background} alt={product.title} width="1600" height="1200" loading={index < 3 ? "eager" : "lazy"} decoding="async"/></div><div className="product-card-copy"><small>{product.category || "XION PRODUCT"}</small><h3>{product.title}</h3><p>{product.shortDescription}</p><ul>{t.productBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul><div className="product-price"><strong>{money(product.price, t.priceOnRequest, language, t.currency)}</strong>{product.oldPrice ? <del>{money(product.oldPrice, t.priceOnRequest, language, t.currency)}</del> : null}</div></div>
      <footer><button type="button" onClick={() => onBuy(product)}><ShoppingBag size={16}/>{t.buy}</button><Link to={`/products/${product.slug}`} aria-label={`${product.title} ${t.details}`}>{t.details}<ArrowUpRight size={16}/></Link></footer>
    </Reveal>; })}</div> : null}
  </div></section>;
}
