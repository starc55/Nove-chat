import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return visible ? <button className="xion-back-top" type="button" aria-label={t.backToTop} title={t.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><ArrowUp size={22}/></button> : null;
}
