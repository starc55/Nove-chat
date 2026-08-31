import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, Download, ExternalLink, FileText, Headphones, PackageCheck, ShieldCheck, ShoppingBag, Stethoscope, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { CatalogProductCard } from "../components/catalog/CatalogProductCard.jsx";
import { useLandingData } from "../hooks/useLandingData.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localeFor } from "../i18n/landing.js";
import { localizeProduct } from "../utils/localize-product.js";
import { xionAssetUrl } from "../utils/landing-assets.js";

const productCopy = {
  uz: { home: "Bosh sahifa", catalogue: "Mahsulotlar", verified: "Tekshirilgan mahsulot", availability: "Mavjudlik so‘rov asosida", orderTitle: "Mutaxassis bilan buyurtma bering", orderText: "Narx, mos modifikatsiya va yetkazish muddatini aniqlab beramiz.", response: "Ish vaqtida tezkor javob", delivery: "O‘zbekiston bo‘ylab yetkazish", documents: "Rasmiy hujjatlar mavjud", consultation: "Mutaxassis konsultatsiyasi", relatedEyebrow: "SIZGA MOS BO‘LISHI MUMKIN", relatedTitle: "O‘xshash mahsulotlar", relatedText: "Shu yo‘nalishdagi boshqa modifikatsiya va tibbiy yechimlarni solishtiring." },
  ru: { home: "Главная", catalogue: "Продукты", verified: "Проверенное изделие", availability: "Наличие по запросу", orderTitle: "Оформите заявку со специалистом", orderText: "Уточним цену, модификацию и срок доставки.", response: "Быстрый ответ в рабочее время", delivery: "Доставка по Узбекистану", documents: "Официальные документы", consultation: "Консультация специалиста", relatedEyebrow: "МОЖЕТ ПОДОЙТИ ВАМ", relatedTitle: "Похожие товары", relatedText: "Сравните другие модификации и медицинские решения этой категории." },
  en: { home: "Home", catalogue: "Products", verified: "Verified product", availability: "Availability on request", orderTitle: "Order with a specialist", orderText: "We will confirm pricing, modification and delivery timing.", response: "Fast response during working hours", delivery: "Delivery across Uzbekistan", documents: "Official documents available", consultation: "Specialist consultation", relatedEyebrow: "YOU MAY ALSO NEED", relatedTitle: "Related products", relatedText: "Compare other modifications and medical solutions in this category." },
};

function money(value, fallback, language, currency) {
  if (value == null) return fallback;
  return `${new Intl.NumberFormat(localeFor(language)).format(Number(value))} ${currency}`;
}

export function ProductPage() {
  const { language, t } = useLanguage();
  const c = productCopy[language] || productCopy.uz;
  const { slug } = useParams();
  const landing = useLandingData();
  const [state, setState] = useState({ product: null, settings: {}, loading: true, error: "" });
  const [buying, setBuying] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    let active = true;
    setSelectedImage(0);
    Promise.all([api.get(`/public/products/${slug}`), api.get("/public/settings")])
      .then(([productResponse, settingsResponse]) => active && setState({ product: productResponse.data.data, settings: settingsResponse.data.data, loading: false, error: "" }))
      .catch((error) => active && setState({ product: null, settings: {}, loading: false, error: error.message }));
    return () => { active = false; };
  }, [slug]);

  const fallbackProduct = landing.data.products.find((item) => item.slug === slug) || null;
  const product = localizeProduct(state.product || fallbackProduct, language);
  const images = product ? [...new Set([product.image, ...(product.images || []).map((item) => item.url)].map(xionAssetUrl).filter(Boolean))] : [];
  const documents = Array.isArray(product?.documents) ? product.documents : [];
  const specifications = product?.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications) : [];
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return landing.data.products
      .filter((item) => item.slug !== product.slug)
      .map((item) => localizeProduct(item, language))
      .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
      .slice(0, 4);
  }, [landing.data.products, language, product]);

  const settings = Object.keys(state.settings).length ? state.settings : landing.data.settings;
  return <div className="site-shell">
    <Header contact={settings.contact} loading={state.loading}/>
    <main className="product-page product-storefront">
      <div className="container">
        <nav className="product-breadcrumb"><Link to="/">{c.home}</Link><span>/</span><Link to="/catalog">{c.catalogue}</Link>{product ? <><span>/</span><strong>{product.title}</strong></> : null}</nav>
        {state.loading && !product ? <div className="product-loading"/> : null}
        {state.error && !product ? <div className="inline-state"><h1>{t.productNotFound}</h1><p>{state.error}</p><Link className="back-link" to="/catalog"><ArrowLeft size={17}/>{c.catalogue}</Link></div> : null}
        {product ? <>
          <article className="product-commerce-layout">
            <div className={`product-gallery-stage ${images.length < 2 ? "has-single-image" : ""}`}>
              {images.length > 1 ? <div className="product-thumbnails product-thumbnails--vertical">{images.map((url, index) => <button type="button" className={selectedImage === index ? "is-active" : ""} onClick={() => setSelectedImage(index)} key={url}><img src={url} alt={`${product.title} ${index + 1}`} loading={index ? "lazy" : "eager"}/></button>)}</div> : null}
              <div className="product-detail-media">{images[selectedImage] ? <img src={images[selectedImage]} alt={product.title} width="760" height="680" decoding="async"/> : <span>{product.title.charAt(0)}</span>}<div className="product-media-assurance"><BadgeCheck size={17}/>{c.verified}</div></div>
            </div>

            <div className="product-detail-copy product-commerce-copy">
              <p className="eyebrow"><span/>{product.category}</p>
              <h1>{product.title}</h1>
              <div className="product-trust-line"><span><ShieldCheck size={16}/>{c.verified}</span><i/><span>{c.availability}</span></div>
              <p className="product-summary">{product.shortDescription}</p>
              <p className="product-intro">{product.longDescription || product.shortDescription}</p>
              {specifications.length ? <div className="product-feature-chips">{specifications.slice(0, 4).map(([key, value]) => <span key={key}><small>{t.specLabels?.[key] || key}</small><strong>{String(value)}</strong></span>)}</div> : null}
              <div className="product-safety"><Stethoscope size={19}/><span>{t.medicalNotice}</span></div>
            </div>

            <aside className="product-order-panel">
              <p>{c.orderTitle}</p>
              <strong>{money(product.price, t.priceOnRequest, language, t.currency)}</strong>
              {product.oldPrice ? <del>{money(product.oldPrice, t.priceOnRequest, language, t.currency)}</del> : null}
              <span>{c.orderText}</span>
              <button className="button button--primary" type="button" onClick={() => setBuying(product)}><ShoppingBag size={18}/>{t.buy}</button>
              <ul><li><CheckCircle2 size={17}/>{c.response}</li><li><Truck size={17}/>{c.delivery}</li><li><PackageCheck size={17}/>{c.documents}</li><li><Headphones size={17}/>{c.consultation}</li></ul>
            </aside>
          </article>

          {specifications.length || documents.length ? <section className="product-data-grid">{specifications.length ? <article><p className="eyebrow"><span/>{t.productSpecs}</p><h2>{t.productSpecsTitle}</h2><dl>{specifications.map(([key, value]) => <div key={key}><dt>{t.specLabels?.[key] || key}</dt><dd>{String(value)}</dd></div>)}</dl></article> : null}{documents.length ? <article><p className="eyebrow"><span/>{t.documents}</p><h2>{t.documentsTitle}</h2><div className="product-documents">{documents.map((document) => <a href={xionAssetUrl(document.url)} target="_blank" rel="noreferrer" key={document.url}><FileText/><span><strong>{document.label}</strong><small>PDF</small></span><Download size={17}/></a>)}</div>{product.sourceUrl ? <a className="product-source" href={product.sourceUrl} target="_blank" rel="noreferrer">{t.officialSource}<ExternalLink size={15}/></a> : null}</article> : null}</section> : null}
        </> : null}
      </div>

      {product && relatedProducts.length ? <section className="related-products-section"><div className="container"><div className="related-products-heading"><div><p className="eyebrow"><span/>{c.relatedEyebrow}</p><h2>{c.relatedTitle}</h2></div><p>{c.relatedText}</p></div><div className="related-products-grid">{relatedProducts.map((item) => <CatalogProductCard key={item.id} product={item} language={language} t={t} onBuy={setBuying}/>)}</div></div></section> : null}
    </main>
    <Footer settings={settings} loading={state.loading}/>
    <ChatWidget/>
    <PurchaseModal product={buying} onClose={() => setBuying(null)}/>
  </div>;
}
