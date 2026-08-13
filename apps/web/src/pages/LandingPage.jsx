import { useState } from "react";
import { useLandingData } from "../hooks/useLandingData.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { Hero } from "../components/landing/Hero.jsx";
import { Services } from "../components/landing/Services.jsx";
import { Campaigns } from "../components/landing/Campaigns.jsx";
import { Approach } from "../components/landing/Approach.jsx";
import { Reviews } from "../components/landing/Reviews.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";

export function LandingPage() {
  const { data, loading, error } = useLandingData();
  const [selectedProduct, setSelectedProduct] = useState(null);
  return (
    <div className="site-shell">
      <Header company={data.settings.company?.name} contact={data.settings.contact} />
      <Hero settings={data.settings} advertisements={data.advertisements} products={data.products} onBuy={setSelectedProduct}/>
      <Services products={data.products} loading={loading} error={error} onBuy={setSelectedProduct}/>
      <Campaigns advertisements={data.advertisements} products={data.products} onBuy={setSelectedProduct}/>
      <Approach />
      <Reviews reviews={data.reviews} loading={loading} />
      <Footer settings={data.settings} />
      <ChatWidget />
      <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)}/>
    </div>
  );
}
