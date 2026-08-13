import { ArrowUpRight, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useHorizontalScroller } from "../../hooks/useHorizontalScroller.js";

function money(value, fallback) {
  if (value == null) return fallback;
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so‘m`;
}

export function Services({ products, loading, error, onBuy }) {
  const { t } = useLanguage();
  const { ref: trackRef, scroll, canPrev, canNext } = useHorizontalScroller(products.length);
  return <section id="products" className="section products-section"><div className="container product-showcase">
    <div className="section-line"><div><p className="eyebrow">NOVA YECHIMLARI</p><h2>{t.navProducts}</h2></div><div className="slider-controls"><button type="button" onClick={() => scroll(-1)} disabled={!canPrev} aria-label="Oldingi mahsulot"><ChevronLeft/></button><button type="button" onClick={() => scroll(1)} disabled={!canNext} aria-label="Keyingi mahsulot"><ChevronRight/></button></div></div>
    {loading ? <div className="product-grid">{[1,2,3].map((n) => <div className="product-card product-skeleton" key={n}/>)}</div> : null}
    {error ? <div className="inline-state"><p>{error}</p></div> : null}
    {!loading && !error && products.length === 0 ? <div className="inline-state"><p>Hozircha mahsulotlar yo‘q.</p></div> : null}
    {!loading && !error && products.length ? <div className="product-grid" ref={trackRef}>{products.map((product, index) => <Reveal className={`product-card ${index === 0 ? "is-featured" : ""}`} delay={index * .05} key={product.id}>
      <div className="product-accent"/><div className="product-index">{String(index + 1).padStart(2, "0")}</div><div className="product-card-copy"><small>{product.category || "NOVA PRODUCT"}</small><h3>{product.title}</h3><p>{product.shortDescription}</p><ul><li>Shaxsiy yondashuv</li><li>Tezkor ishga tushirish</li><li>Operator ko‘magi</li></ul><div className="product-price"><strong>{money(product.price, t.priceOnRequest)}</strong>{product.oldPrice ? <del>{money(product.oldPrice, t.priceOnRequest)}</del> : null}</div></div>
      <footer><button type="button" onClick={() => onBuy(product)}><ShoppingBag size={16}/>{t.buy}</button><Link to={`/products/${product.slug}`} aria-label={`${product.title} ${t.details}`}>{t.details}<ArrowUpRight size={16}/></Link></footer>
    </Reveal>)}</div> : null}
  </div></section>;
}
