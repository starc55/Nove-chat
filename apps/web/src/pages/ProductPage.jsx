import { useEffect, useState } from "react";
import { ArrowLeft, Download, ExternalLink, FileText, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localizeProduct } from "../utils/localize-product.js";

export function ProductPage() {
  const { language, t } = useLanguage();
  const { slug } = useParams();
  const [state, setState] = useState({
    product: null,
    settings: {},
    loading: true,
    error: "",
  });
  const [buying, setBuying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => {
    Promise.all([api.get(`/public/products/${slug}`), api.get("/public/settings")])
      .then(([productResponse, settingsResponse]) =>
        setState({ product: productResponse.data.data, settings: settingsResponse.data.data, loading: false, error: "" })
      )
      .catch((error) =>
        setState({ product: null, settings: {}, loading: false, error: error.message })
      );
  }, [slug]);
  const product = localizeProduct(state.product, language);
  const images = product ? [...new Set([product.image, ...(product.images || []).map((item) => item.url)].filter(Boolean))] : [];
  const documents = Array.isArray(product?.documents) ? product.documents : [];
  const specifications = product?.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications) : [];
  return (
    <div className="site-shell">
      <Header contact={state.settings.contact}/>
      <main className="product-page container">
        <Link className="back-link" to="/">
          <ArrowLeft size={17} /> {t.backHome}
        </Link>
        {state.loading && <div className="product-loading" />}
        {state.error && (
          <div className="inline-state">
            <h1>{t.productNotFound}</h1>
            <p>{state.error}</p>
          </div>
        )}
        {product ? <>
          <article className="product-detail">
            <div className="product-gallery"><div className="product-detail-media">{images[selectedImage] ? <img src={images[selectedImage]} alt={product.title}/> : <span>{product.title.charAt(0)}</span>}</div>{images.length > 1 ? <div className="product-thumbnails">{images.map((url, index) => <button type="button" className={selectedImage === index ? "is-active" : ""} onClick={() => setSelectedImage(index)} key={url}><img src={url} alt={`${product.title} ${index + 1}`}/></button>)}</div> : null}</div>
            <div className="product-detail-copy"><p className="eyebrow"><span/>{product.category}</p><h1>{product.title}</h1><p className="product-summary">{product.shortDescription}</p><p className="product-intro">{product.longDescription || product.shortDescription}</p><div className="product-safety"><ShieldCheck size={18}/><span>{t.medicalNotice}</span></div><button className="button button--primary" type="button" onClick={() => setBuying(true)}><ShoppingBag size={17}/>{t.buy}</button></div>
          </article>
          {specifications.length || documents.length ? <section className="product-data-grid">{specifications.length ? <article><p className="eyebrow"><span/>{t.productSpecs}</p><h2>{t.productSpecsTitle}</h2><dl>{specifications.map(([key, value]) => <div key={key}><dt>{t.specLabels?.[key] || key}</dt><dd>{String(value)}</dd></div>)}</dl></article> : null}{documents.length ? <article><p className="eyebrow"><span/>{t.documents}</p><h2>{t.documentsTitle}</h2><div className="product-documents">{documents.map((document) => <a href={document.url} target="_blank" rel="noreferrer" key={document.url}><FileText/><span><strong>{document.label}</strong><small>PDF</small></span><Download size={17}/></a>)}</div>{product.sourceUrl ? <a className="product-source" href={product.sourceUrl} target="_blank" rel="noreferrer">{t.officialSource}<ExternalLink size={15}/></a> : null}</article> : null}</section> : null}
        </> : null}
      </main>
      <Footer settings={state.settings}/>
      <PurchaseModal product={buying ? product : null} onClose={() => setBuying(false)}/>
    </div>
  );
}
