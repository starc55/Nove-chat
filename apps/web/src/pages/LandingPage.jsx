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
import { Seo } from "../components/common/Seo.jsx";

const seoCopy = {
  uz: { title: "XION — Tibbiy mahsulotlar va mutaxassis yordami", description: "Akusherlik, ginekologiya va urologiya uchun sertifikatlangan tibbiy mahsulotlar katalogi, O‘zbekiston bo‘ylab yetkazish va mutaxassis yordami." },
  ru: { title: "XION — медицинские изделия и помощь специалиста", description: "Каталог сертифицированных изделий для акушерства, гинекологии и урологии, доставка по Узбекистану и консультация специалиста." },
  en: { title: "XION — medical products and specialist support", description: "Certified products for obstetrics, gynecology and urology, delivery across Uzbekistan and professional product support." }
};

export function LandingPage() {
  const { data, loading, error } = useLandingData();
  const { language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const heroAdvertisements = data.advertisements.filter((item) => item.placement === "HERO");
  const campaignAdvertisements = data.advertisements.filter((item) => item.placement !== "HERO");
  const seo = seoCopy[language] || seoCopy.uz;
  return (
    <div className="site-shell">
      <Seo title={seo.title} description={seo.description} canonicalPath="/" language={language} jsonLd={{ "@context": "https://schema.org", "@type": "MedicalBusiness", name: "XION", url: "https://xion.uz", logo: "https://xion.uz/xion-logo.svg", telephone: data.settings.contact?.phone, email: data.settings.contact?.email, address: { "@type": "PostalAddress", streetAddress: "Allon ko‘chasi 141A", addressLocality: "Toshkent", addressCountry: "UZ" } }}/>
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
