import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Hero({ settings = {}, advertisement, featuredProduct, onBuy }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const title = advertisement?.title || settings.hero?.title || t.heroTitleA;
  const description = advertisement?.description || settings.hero?.subtitle || t.heroText;
  const image = advertisement?.image || featuredProduct?.image;
  const action = () => featuredProduct ? onBuy(featuredProduct) : document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });

  return <main id="top" className="hero"><div className="container">
    <motion.section className={`hero-banner ${image ? "has-image" : ""}`} initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} style={image ? { backgroundImage: `linear-gradient(90deg,rgba(5,55,132,.98) 0%,rgba(13,110,253,.86) 48%,rgba(13,110,253,.08) 100%),url(${image})` } : undefined}>
      <div className="hero-banner-copy"><p><Sparkles size={14}/> NOVA · YANGI AVLOD YECHIMLARI</p><h1>{title}</h1><span>{description}</span><button type="button" onClick={action}>{featuredProduct ? t.buy : t.heroPrimary}<ArrowRight size={17}/></button></div>
      {!image ? <div className="hero-art" aria-hidden="true"><div className="hero-device"><span>N</span><i/></div><div className="hero-sphere sphere-one"/><div className="hero-sphere sphere-two"/><Wifi className="hero-wifi"/></div> : null}
    </motion.section>
    <div className="hero-benefits"><div><ShieldCheck/><span><strong>Ishonchli tizim</strong><small>Barqaror va xavfsiz yechimlar</small></span></div><div><Wifi/><span><strong>Doim aloqada</strong><small>Operator yordami real vaqtda</small></span></div><div><Sparkles/><span><strong>Premium tajriba</strong><small>Biznesingizga mos xizmat</small></span></div></div>
  </div></main>;
}
