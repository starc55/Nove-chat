import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
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
    loading: true,
    error: "",
  });
  const [buying, setBuying] = useState(false);
  useEffect(() => {
    api
      .get(`/public/products/${slug}`)
      .then(({ data }) =>
        setState({ product: data.data, loading: false, error: "" })
      )
      .catch((error) =>
        setState({ product: null, loading: false, error: error.message })
      );
  }, [slug]);
  return (
    <div className="site-shell">
      <Header />
      <main className="product-page container">
        <Link className="back-link" to="/">
          <ArrowLeft size={17} /> Bosh sahifa
        </Link>
        {state.loading && <div className="product-loading" />}
        {state.error && (
          <div className="inline-state">
            <h1>Xizmat topilmadi</h1>
            <p>{state.error}</p>
          </div>
        )}
        {state.product && (
          <>
            <p className="eyebrow">
              <span />
              {state.product.category}
            </p>
            <h1>{state.product.title}</h1>
            <p className="product-intro">
              {state.product.longDescription || state.product.shortDescription}
            </p>
            <button className="button button--primary" type="button" onClick={() => setBuying(true)}><ShoppingBag size={17}/>{t.buy}</button>
          </>
        )}
      </main>
      <Footer/>
      <PurchaseModal product={buying ? state.product : null} onClose={() => setBuying(false)}/>
    </div>
  );
}
