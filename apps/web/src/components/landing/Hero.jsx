import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export function Hero({ settings = {} }) {
  const hero = settings.hero || {};
  const stats = settings.stats || [];
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 34 }, animate: { opacity: 1, y: 0 } };
  return (
    <main id="top" className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <motion.p className="eyebrow" {...reveal} transition={{ duration: .65 }}><span />{hero.eyebrow || "Toshkent · Global hamkorlik"}</motion.p>
          <motion.h1 {...reveal} transition={{ duration: .8, delay: .08, ease: [0.22, 1, 0.36, 1] }}>
            Yaxshi brend<br/>ko‘rinadi. <em>Buyuk</em><br/><em>brend seziladi.</em>
          </motion.h1>
          <motion.div className="hero-lower" {...reveal} transition={{ duration: .75, delay: .2 }}>
            <p>{hero.subtitle || "Strategiya, dizayn va raqamli tajribani yagona kuchli tizimga birlashtiramiz."}</p>
            <div className="hero-actions"><a className="button button--light" href="#contact">{hero.primaryCta || "Loyihani boshlash"}<ArrowUpRight size={17}/></a><a className="text-link" href="#services">{hero.secondaryCta || "Ishlarimizni ko‘rish"}<ArrowDown size={16}/></a></div>
          </motion.div>
        </div>
        <motion.div className="hero-visual" initial={reduceMotion ? false : { opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: .2, ease: [0.22, 1, 0.36, 1] }} aria-label="NOVA ijodiy tizimi vizualizatsiyasi">
          <div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
          <div className="visual-core"><span>N</span><small>Strategy<br/>Design<br/>Digital</small></div>
          <p className="visual-label label-top">Built for distinction</p><p className="visual-label label-bottom">EST. 2021 · TAS</p>
        </motion.div>
      </div>
      <div className="container stat-row">
        {stats.length ? stats.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>) : <><div><strong>42+</strong><span>ishga tushirilgan loyiha</span></div><div><strong>91%</strong><span>qayta hamkorlik</span></div><div><strong>4.9</strong><span>mijozlar bahosi</span></div></>}
      </div>
    </main>
  );
}
