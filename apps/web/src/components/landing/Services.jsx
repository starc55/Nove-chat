import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Reveal } from "../common/Reveal.jsx";
import { SectionHeading } from "../common/SectionHeading.jsx";

function money(value) {
  if (value == null) return "Narx kelishiladi";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so‘m`;
}

export function Services({ products, loading, error }) {
  const reduceMotion = useReducedMotion();
  return (
    <section id="services" className="section services-section">
      <div className="container">
        <Reveal><SectionHeading eyebrow="Xizmatlar" title="Aniq g‘oya. Kuchli tizim. O‘lchanadigan natija." copy="Har bir yo‘nalish alohida qiymat beradi. Birgalikda esa brendni oldinga olib chiqadigan to‘liq tajribaga aylanadi." /></Reveal>
        {loading && <div className="service-list" aria-label="Xizmatlar yuklanmoqda">{[1,2,3].map((n) => <div className="service-skeleton" key={n}/>)}</div>}
        {error && <div className="inline-state"><p>Xizmatlarni hozir yuklab bo‘lmadi.</p><small>{error}</small></div>}
        {!loading && !error && products.length === 0 && <div className="inline-state"><p>Hozircha xizmatlar yo‘q.</p></div>}
        {!loading && !error && products.length > 0 && (
          <div className="service-list">
            {products.map((product, index) => (
              <motion.article className="service-row" key={product.id} initial={reduceMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .6, delay: index * .06 }}>
                <span className="service-index">0{index + 1}</span>
                <div><p>{product.category || "NOVA service"}</p><h3>{product.title}</h3></div>
                <p className="service-description">{product.shortDescription}</p>
                <div className="service-price"><span>{money(product.price)}</span>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
                <Link to={`/products/${product.slug}`} aria-label={`${product.title} haqida batafsil`}><ArrowUpRight /></Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
