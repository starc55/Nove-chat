import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Hero({ settings = {}, advertisements = [], products = [], onBuy }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);
  const slides = useMemo(() => {
    const ads = advertisements.map((item) => ({ ...item, kind: "advertisement" }));
    const productSlides = products.slice(0, 3).map((item) => ({ id: `product-${item.id}`, title: item.title, description: item.shortDescription, image: item.image, product: item, kind: "product" }));
    return [...ads, ...productSlides].length ? [...ads, ...productSlides] : [{ id: "default", title: settings.hero?.title || t.heroTitleA, description: settings.hero?.subtitle || t.heroText, kind: "default" }];
  }, [advertisements, products, settings.hero?.subtitle, settings.hero?.title, t.heroText, t.heroTitleA]);

  const go = useCallback((offset) => setActive((current) => (current + offset + slides.length) % slides.length), [slides.length]);
  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return undefined;
    const timer = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(timer);
  }, [go, paused, reduceMotion, slides.length]);
  useEffect(() => { if (active >= slides.length) setActive(0); }, [active, slides.length]);

  const slide = slides[active];
  const runAction = () => {
    if (slide.product) return onBuy(slide.product);
    if (slide.ctaUrl) return window.location.assign(slide.ctaUrl);
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  };
  return <main id="top" className="hero"><div className="container">
    <section className="hero-swiper" tabIndex="0" aria-roledescription="carousel" aria-label="Asosiy takliflar" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onKeyDown={(event) => { if (event.key === "ArrowLeft") go(-1); if (event.key === "ArrowRight") go(1); }} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current == null) return; const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 45) go(delta > 0 ? -1 : 1); touchStart.current = null; }}>
      <AnimatePresence mode="wait" initial={false}><motion.article key={slide.id} className={`hero-banner ${slide.image ? "has-image" : ""}`} initial={reduceMotion ? false : { opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -28 }} transition={{ duration: .42 }} style={slide.image ? { backgroundImage: `linear-gradient(90deg,rgba(5,55,132,.98) 0%,rgba(13,110,253,.86) 48%,rgba(13,110,253,.08) 100%),url(${slide.image})` } : undefined}>
        <div className="hero-banner-copy"><p><Sparkles size={14}/> NOVA · YANGI AVLOD YECHIMLARI</p><h1>{slide.title}</h1><span>{slide.description || t.heroText}</span><button type="button" onClick={runAction}>{slide.product ? t.buy : slide.ctaLabel || t.heroPrimary}<ArrowRight size={17}/></button></div>
        {!slide.image ? <div className="hero-art" aria-hidden="true"><div className="hero-device"><span>N</span><i/></div><div className="hero-sphere sphere-one"/><div className="hero-sphere sphere-two"/><Wifi className="hero-wifi"/></div> : null}
      </motion.article></AnimatePresence>
      {slides.length > 1 ? <><div className="hero-controls"><button type="button" onClick={() => go(-1)} aria-label="Oldingi banner"><ChevronLeft/></button><button type="button" onClick={() => go(1)} aria-label="Keyingi banner"><ChevronRight/></button></div><div className="hero-dots">{slides.map((item, index) => <button key={item.id} className={index === active ? "is-active" : ""} type="button" onClick={() => setActive(index)} aria-label={`${index + 1}-banner`} aria-current={index === active ? "true" : undefined}/>)}</div></> : null}
    </section>
    <div className="hero-benefits"><div><ShieldCheck/><span><strong>Ishonchli tizim</strong><small>Barqaror va xavfsiz yechimlar</small></span></div><div><Wifi/><span><strong>Doim aloqada</strong><small>Operator yordami real vaqtda</small></span></div><div><Sparkles/><span><strong>Premium tajriba</strong><small>Biznesingizga mos xizmat</small></span></div></div>
  </div></main>;
}
