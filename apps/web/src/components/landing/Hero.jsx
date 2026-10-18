import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Phone,
  Send,
  Sparkles,
  Wifi,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { BrandLogo } from "../common/BrandLogo.jsx";
import { localizeAdvertisement } from "../../utils/localize-advertisement.js";
import { XION_TELEGRAM_URL } from "../../config/public-links.js";
import { landingAdvertisementImage } from "../../utils/landing-assets.js";

export function Hero({
  advertisements = [],
  contact = {},
  loading = false,
}) {
  const { language, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);
  const slides = useMemo(() => {
    return advertisements.map((sourceAdvertisement) => {
      const item = localizeAdvertisement(sourceAdvertisement, language);
      return {
        ...item,
        image: landingAdvertisementImage(item),
        kind: "advertisement",
      };
    });
  }, [advertisements, language]);

  const go = useCallback(
    (offset) =>
      setActive(
        (current) => (current + offset + slides.length) % slides.length,
      ),
    [slides.length],
  );
  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return undefined;
    const timer = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(timer);
  }, [go, paused, reduceMotion, slides.length]);
  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  const slide = slides[active];
  const phone = contact.phones?.[0] || contact.phone;
  if (loading)
    return (
      <main id="top" className="hero">
        <div className="container">
          <div className="hero-loading" role="status" aria-label={t.loading}>
            <span />
            <span />
            <span />
            <i />
          </div>
          <div className="hero-benefits is-loading">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  if (!slide) return null;
  return (
    <main id="top" className="hero">
      <div className="container">
        <section
          className="hero-swiper"
          tabIndex="0"
          aria-roledescription="carousel"
          aria-label={t.heroCarousel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") go(-1);
            if (event.key === "ArrowRight") go(1);
          }}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touchStart.current == null) return;
            const delta = event.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(delta) > 45) go(delta > 0 ? -1 : 1);
            touchStart.current = null;
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={slide.id}
              className={`hero-banner ${slide.image ? "has-image" : ""}`}
              style={{
                "--hero-height-desktop": `${slide.display?.heightDesktop || 365}px`,
                "--hero-height-mobile": `${slide.display?.heightMobile || 680}px`,
                "--hero-image-fit": slide.display?.imageFit || "contain",
                "--hero-image-position":
                  slide.display?.imagePosition || "center",
                "--hero-copy-align": slide.display?.contentAlign || "left",
                "--hero-overlay-opacity":
                  (slide.display?.overlayOpacity ?? 20) / 100,
              }}
              initial={reduceMotion ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -28 }}
              transition={{ duration: 0.42 }}
            >
              <div className="hero-banner-copy">
                <p>
                  <Sparkles size={14} /> {t.heroEyebrow}
                </p>
                <h1>{slide.title}</h1>
                <span>{slide.description || t.heroText}</span>
              </div>
              {slide.image ? (
                <div className="hero-slide-media" aria-hidden="true">
                  <img
                    src={slide.image}
                    alt=""
                    width="694"
                    height="614"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="hero-art" aria-hidden="true">
                  <div className="hero-device">
                    <BrandLogo className="hero-device-logo" />
                    <i />
                  </div>
                  <div className="hero-sphere sphere-one" />
                  <div className="hero-sphere sphere-two" />
                  <Wifi className="hero-wifi" />
                </div>
              )}
            </motion.article>
          </AnimatePresence>
          {slides.length > 1 ? (
            <>
              <div className="hero-controls">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={t.previousBanner}
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={t.nextBanner}
                >
                  <ChevronRight />
                </button>
              </div>
              <div className="hero-dots">
                {slides.map((item, index) => (
                  <button
                    key={item.id}
                    className={index === active ? "is-active" : ""}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`${index + 1}/${slides.length}`}
                    aria-current={index === active ? "true" : undefined}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
      <aside className="hero-social-rail" aria-label={t.contactUs}>
        <span>{t.contactUs}</span>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
        >
          <Instagram />
        </a>
        <a
          href={XION_TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram"
        >
          <Send />
        </a>
        {phone ? (
          <a href={`tel:${phone.replace(/\s/g, "")}`} aria-label={t.phone}>
            <Phone />
          </a>
        ) : null}
      </aside>
    </main>
  );
}
