import { useLandingData } from "../hooks/useLandingData.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { Hero } from "../components/landing/Hero.jsx";
import { Services } from "../components/landing/Services.jsx";
import { Advertisement } from "../components/landing/Advertisement.jsx";
import { Approach } from "../components/landing/Approach.jsx";
import { Reviews } from "../components/landing/Reviews.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";

export function LandingPage() {
  const { data, loading, error } = useLandingData();
  return (
    <div className="site-shell">
      <Header company={data.settings.company?.name} />
      <Hero settings={data.settings} />
      <Advertisement advertisements={data.advertisements} />
      <Services products={data.products} loading={loading} error={error} />
      <Approach />
      <Reviews reviews={data.reviews} loading={loading} />
      <Footer settings={data.settings} />
      <ChatWidget />
    </div>
  );
}
