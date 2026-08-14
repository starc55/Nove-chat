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
import { LanguageMotion } from "../components/common/LanguageMotion.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useDesktopLocomotiveScroll } from "../hooks/useDesktopLocomotiveScroll.js";

export function LandingPage() {
  const { data, loading, error } = useLandingData();
  const { language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const heroAdvertisements = data.advertisements.filter((item) => item.placement === "HERO");
  const campaignAdvertisements = data.advertisements.filter((item) => item.placement !== "HERO");
  useDesktopLocomotiveScroll(`${language}-${loading}-${data.products.length}-${data.advertisements.length}-${data.reviews.length}`);
  return (
    <div className="site-shell">
      <Header company={data.settings.company?.name} contact={data.settings.contact} />
      <LanguageMotion language={language}>
        <Hero settings={data.settings} advertisements={heroAdvertisements} products={data.products} onBuy={setSelectedProduct}/>
        <Services products={data.products} loading={loading} error={error} onBuy={setSelectedProduct}/>
        <Campaigns advertisements={campaignAdvertisements} products={data.products} onBuy={setSelectedProduct}/>
        <Approach />
        <Reviews reviews={data.reviews} loading={loading} />
        <Footer settings={data.settings} />
      </LanguageMotion>
      <ChatWidget />
      <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)}/>
    </div>
  );
}
