import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Header } from "../components/layout/Header.jsx";

export function ProductPage() {
  const { slug } = useParams();
  const [state, setState] = useState({
    product: null,
    loading: true,
    error: "",
  });
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
            <a className="button button--light" href="/#contact">
              Loyihani muhokama qilish <ArrowUpRight size={17} />
            </a>
          </>
        )}
      </main>
    </div>
  );
}
