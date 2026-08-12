import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

function money(value, fallback) {
  if (value == null) return fallback;
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so‘m`;
}

export function Services({ products, loading, error, onBuy }) {
  const { t } = useLanguage();
  return (
    <section id="products" className="section products-section"><div className="container">
      <div className="editorial-heading"><div><p className="eyebrow"><span/>{t.productsEyebrow}</p><h2>{t.productsTitle}</h2></div><p>{t.productsText}</p></div>
      {loading ? <div className="product-grid">{[1,2,3,4].map((n) => <div className="product-card product-skeleton" key={n}/>)}</div> : null}
      {error ? <div className="inline-state"><p>{error}</p></div> : null}
      {!loading && !error && products.length === 0 ? <div className="inline-state"><p>Hozircha mahsulotlar yo‘q.</p></div> : null}
      {!loading && !error && products.length ? <div className="product-grid">{products.map((product, index) => <Reveal className={`product-card ${index === 0 ? "is-featured" : ""}`} delay={index * .05} key={product.id}>
        <div className="product-media">{product.image ? <img src={product.image} alt={product.title} loading="lazy"/> : <span>{String(index + 1).padStart(2, "0")}</span>}<small>{product.category || "NOVA PRODUCT"}</small></div>
        <div className="product-card-copy"><h3>{product.title}</h3><p>{product.shortDescription}</p><div className="product-price"><strong>{money(product.price, t.priceOnRequest)}</strong>{product.oldPrice ? <del>{money(product.oldPrice, t.priceOnRequest)}</del> : null}</div></div>
        <footer><button type="button" onClick={() => onBuy(product)}><ShoppingBag size={16}/>{t.buy}</button><Link to={`/products/${product.slug}`} aria-label={`${product.title} ${t.details}`}><span>{t.details}</span><ArrowUpRight size={17}/></Link></footer>
      </Reveal>)}</div> : null}
    </div></section>
  );
}
