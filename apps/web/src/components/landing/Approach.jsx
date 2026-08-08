import { Reveal } from "../common/Reveal.jsx";
import { SectionHeading } from "../common/SectionHeading.jsx";

const steps = [
  ["01", "Tushunamiz", "Biznes, auditoriya va imkoniyatni chuqur o‘rganamiz."],
  ["02", "Yo‘nalish beramiz", "Barchani bitta aniq qarorga olib keladigan strategiyani tuzamiz."],
  ["03", "Yaratamiz", "Tizimli, o‘ziga xos va ishlaydigan tajribani ishlab chiqamiz."],
  ["04", "O‘stiramiz", "Natijani kuzatib, mahsulotni keyingi bosqichga olib chiqamiz."]
];

export function Approach() {
  return (
    <section id="approach" className="section approach-section">
      <div className="container approach-grid">
        <Reveal><SectionHeading eyebrow="Yondashuv" title="Chiroyli emas, avvalo to‘g‘ri." copy="Har bir dizayn qarori biznes maqsadidan boshlanadi. Shuning uchun natijamiz nafis ko‘rinadi va bir vaqtning o‘zida ishlaydi." /></Reveal>
        <div className="steps">{steps.map(([index, title, copy], order) => <Reveal key={index} delay={order * .05} className="step"><span>{index}</span><div><h3>{title}</h3><p>{copy}</p></div></Reveal>)}</div>
      </div>
    </section>
  );
}
