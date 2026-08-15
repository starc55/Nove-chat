import { useState } from "react";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { Services } from "../components/landing/Services.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { useLandingData } from "../hooks/useLandingData.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export function CatalogPage() {
  const { data, loading, error } = useLandingData();
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState(null);
  return <div className="site-shell">
    <Header company={data.settings.company?.name} contact={data.settings.contact}/>
    <main className="catalog-page">
      <section className="info-hero"><div className="container"><p className="eyebrow"><span/>{t.productsEyebrow}</p><h1>{t.catalogTitle}</h1><p>{t.catalogIntro}</p></div></section>
      <Services products={data.products} loading={loading} error={error} onBuy={setSelectedProduct}/>
    </main>
    <Footer settings={data.settings}/>
    <ChatWidget/>
    <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)}/>
  </div>;
}
