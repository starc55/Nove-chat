import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export function ProductPage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const [state, setState] = useState({
    product: null,
    settings: {},
    loading: true,
    error: "",
  });
  const [buying, setBuying] = useState(false);
  useEffect(() => {
    Promise.all([api.get(`/public/products/${slug}`), api.get("/public/settings")])
      .then(([productResponse, settingsResponse]) =>
        setState({ product: productResponse.data.data, settings: settingsResponse.data.data, loading: false, error: "" })
      )
      .catch((error) =>
        setState({ product: null, settings: {}, loading: false, error: error.message })
      );
  }, [slug]);
  return (
    <div className="site-shell">
      <Header company={state.settings.company?.name} contact={state.settings.contact}/>
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
        {state.product ? <article className="product-detail">
          <div className="product-detail-media">{state.product.image ? <img src={state.product.image} alt={state.product.title}/> : <span>{state.product.title.charAt(0)}</span>}</div>
          <div className="product-detail-copy"><p className="eyebrow"><span/>{state.product.category}</p><h1>{state.product.title}</h1><p className="product-summary">{state.product.shortDescription}</p><p className="product-intro">{state.product.longDescription || state.product.shortDescription}</p><div className="product-safety"><ShieldCheck size={18}/><span>{t.medicalNotice}</span></div><button className="button button--primary" type="button" onClick={() => setBuying(true)}><ShoppingBag size={17}/>{t.buy}</button></div>
        </article> : null}
      </main>
      <Footer settings={state.settings}/>
      <PurchaseModal product={buying ? state.product : null} onClose={() => setBuying(false)}/>
    </div>
  );
}
