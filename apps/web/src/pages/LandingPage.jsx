import { useState } from "react";
import { useLandingData } from "../hooks/useLandingData.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { Hero } from "../components/landing/Hero.jsx";
import { Services } from "../components/landing/Services.jsx";
import { ProductCatalog } from "../components/landing/ProductCatalog.jsx";
import { Campaigns } from "../components/landing/Campaigns.jsx";
import { Approach } from "../components/landing/Approach.jsx";
import { Reviews } from "../components/landing/Reviews.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { LanguageMotion } from "../components/common/LanguageMotion.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getPageSeo, XION_SITE_URL } from "../config/seo.js";
import { Seo } from "../components/common/Seo.jsx";

export function LandingPage() {
  const { data, loading, error } = useLandingData();
  const { language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const heroAdvertisements = data.advertisements.filter((item) => item.placement === "HERO");
  const campaignAdvertisements = data.advertisements.filter((item) => item.placement !== "HERO");
  const seo = getPageSeo("/", language);
  return (
    <div className="site-shell">
      <Seo title={seo.title} description={seo.description} canonicalPath="/" language={language} jsonLd={{ "@context": "https://schema.org", "@type": "MedicalBusiness", "@id": `${XION_SITE_URL}/#organization`, name: "XION", url: XION_SITE_URL, logo: `${XION_SITE_URL}/xion-logo.svg`, image: `${XION_SITE_URL}/og.png`, telephone: data.settings.contact?.phone, email: data.settings.contact?.email, priceRange: "$$", areaServed: { "@type": "Country", name: "Uzbekistan" }, geo: { "@type": "GeoCoordinates", latitude: 41.333715, longitude: 69.20532 }, address: { "@type": "PostalAddress", streetAddress: "Allon ko‘chasi 141A", addressLocality: "Toshkent", addressCountry: "UZ" }, sameAs: ["https://t.me/xion_office"] }}/>
      <Header contact={data.settings.contact} loading={loading} />
      <LanguageMotion language={language}>
        <Hero settings={data.settings} advertisements={heroAdvertisements} products={data.products} onBuy={setSelectedProduct} loading={loading}/>
        <Services products={data.products} loading={loading} error={error} onBuy={setSelectedProduct}/>
        <ProductCatalog />
        <Campaigns advertisements={campaignAdvertisements} products={data.products} onBuy={setSelectedProduct}/>
        <Approach newsItems={[...campaignAdvertisements, ...data.products]} loading={loading} />
        <Reviews reviews={data.reviews} loading={loading} />
        <Footer settings={data.settings} loading={loading} />
      </LanguageMotion>
      <ChatWidget />
      <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)}/>
    </div>
  );
}
