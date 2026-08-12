import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Hero({ settings = {}, advertisement, featuredProduct, onBuy }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const stats = settings.stats || [];
  const visualTitle = advertisement?.title || featuredProduct?.title || "NOVA Digital Suite";
  const visualText = advertisement?.description || featuredProduct?.shortDescription || t.heroText;
  const visualImage = advertisement?.image || featuredProduct?.image;
  return (
    <main id="top" className="hero">
      <div className="container hero-shell">
        <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, ease: [0.22, 1, 0.36, 1] }}>
          <p className="eyebrow"><span/>{t.heroEyebrow}</p>
          <h1>{t.heroTitleA}<br/><em>{t.heroTitleB}</em><br/>{t.heroTitleC}</h1>
          <p className="hero-description">{settings.hero?.subtitle || t.heroText}</p>
          <div className="hero-actions"><a className="button button--primary" href="#products">{t.heroPrimary}<ArrowDownRight size={18}/></a><a className="text-link" href="#contact">{t.heroSecondary}<ArrowUpRight size={17}/></a></div>
        </motion.div>
        <motion.aside className={`hero-feature ${visualImage ? "has-image" : ""}`} initial={reduceMotion ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .85, delay: .12, ease: [0.22, 1, 0.36, 1] }} style={visualImage ? { backgroundImage: `linear-gradient(180deg,rgba(13,110,253,.05),rgba(9,24,44,.88)),url(${visualImage})` } : undefined}>
          <div className="hero-feature-top"><span>FEATURED · {new Date().getFullYear()}</span><i>01</i></div>
          <div className="hero-feature-copy"><span className="feature-icon"><CheckCircle2 size={20}/></span><h2>{visualTitle}</h2><p>{visualText}</p>{featuredProduct ? <button type="button" onClick={() => onBuy(featuredProduct)}>{t.buy}<ArrowUpRight size={16}/></button> : advertisement?.ctaUrl ? <a href={advertisement.ctaUrl}>{advertisement.ctaLabel || t.learnMore}<ArrowUpRight size={16}/></a> : null}</div>
          <div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><div className="hero-monogram">N</div>
        </motion.aside>
      </div>
      <div className="container trust-strip">{stats.length ? stats.slice(0,3).map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>) : <><div><strong>42+</strong><span>Projects delivered</span></div><div><strong>4.9/5</strong><span>Client experience</span></div><div><strong>24/7</strong><span>Live operator support</span></div></>}</div>
    </main>
  );
}
