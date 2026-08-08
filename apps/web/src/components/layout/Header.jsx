import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

const navItems = [
  ["Xizmatlar", "#services"],
  ["Yondashuv", "#approach"],
  ["Mijozlar", "#reviews"],
  ["Aloqa", "#contact"]
];

export function Header({ company = "NOVA" }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <div className="container nav-shell">
        <a className="wordmark" href="#top" aria-label={`${company} bosh sahifa`}>{company}<i>.</i></a>
        <nav className="desktop-nav" aria-label="Asosiy navigatsiya">
          {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <a className="nav-cta" href="#contact">Loyihani boshlash <ArrowUpRight size={16} /></a>
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Menyuni ochish">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav id="mobile-menu" className="mobile-nav" aria-label="Mobil navigatsiya" initial={reduceMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={18} /></a>)}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
