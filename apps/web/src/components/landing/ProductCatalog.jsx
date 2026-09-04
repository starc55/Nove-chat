import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Reveal } from "../common/Reveal.jsx";
import { localizedPath } from "../../config/seo.js";

const categories = [
  {
    count: 2,
    image: "/media/catalog/c5.png",
    title: {
      uz: "Akusherlik pessariylari",
      ru: "Акушерские пессарии",
      en: "Obstetric pessaries",
    },
    description: {
      uz: "Homiladorlik davrida bachadon bo‘ynini qo‘llab-quvvatlash uchun tibbiy vositalar.",
      ru: "Медицинские изделия для поддержки шейки матки во время беременности.",
      en: "Medical devices supporting the cervix during pregnancy.",
    },
  },
  {
    count: 11,
    image: "/media/catalog/c2.png",
    title: {
      uz: "Ginekologik pessariylar",
      ru: "Гинекологические пессарии",
      en: "Gynecological pessaries",
    },
    description: {
      uz: "Tos tubi mushaklari zaifligi va prolapsni konservativ davolash uchun.",
      ru: "Для консервативного лечения пролапса и слабости мышц тазового дна.",
      en: "For conservative treatment of prolapse and pelvic floor weakness.",
    },
  },
  {
    count: 26,
    image: "/media/catalog/c3.png",
    title: { uz: "Tibbiy instrumentlar", ru: "Инструменты", en: "Medical instruments" },
    description: {
      uz: "Diagnostika va professional ginekologik amaliyot uchun bir martalik instrumentlar.",
      ru: "Одноразовые инструменты для диагностики и профессиональной практики.",
      en: "Single-use instruments for diagnostics and professional practice.",
    },
  },
  {
    count: 10,
    image: "/media/catalog/c4.png",
    title: {
      uz: "Bachadon ichi spirallari",
      ru: "Внутриматочные спирали",
      en: "Intrauterine devices",
    },
    description: {
      uz: "Mis, kumush yoki oltin komponentli uzoq muddatli kontratseptiv vositalar.",
      ru: "Контрацептивные изделия с медью, серебром или золотом длительного действия.",
      en: "Long-acting contraceptive devices with copper, silver, or gold.",
    },
  },
  {
    count: 14,
    image: "/media/catalog/c1.png",
    title: {
      uz: "Ginekologik ko‘zgular va to‘plamlar",
      ru: "Зеркала и гинекологические наборы",
      en: "Gynecological speculums and kits",
    },
    description: {
      uz: "Akusher-ginekologlar talablari asosida ishlab chiqilgan bir martalik to‘plamlar.",
      ru: "Одноразовые наборы, разработанные с учетом требований акушеров-гинекологов.",
      en: "Single-use kits designed around obstetric and gynecological practice.",
    },
  },
];

const headings = {
  uz: { eyebrow: "XION BO‘LIMLARI", title: "Mahsulotlar katalogi", action: "Katalogni ochish", unit: "mahsulot" },
  ru: { eyebrow: "КАТЕГОРИИ XION", title: "Каталог продукции", action: "Открыть каталог", unit: "товаров" },
  en: { eyebrow: "XION CATEGORIES", title: "Product catalogue", action: "Open catalogue", unit: "products" },
};

export function ProductCatalog() {
  const { language } = useLanguage();
  const copy = headings[language] || headings.uz;

  return (
    <section id="product-catalog" className="section xion-catalog-section">
      <div className="container">
        <div className="xion-catalog-heading">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
          </div>
          <Link to={localizedPath("/catalog", language)}>
            {copy.action}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="xion-category-grid">
          {categories.map((category, index) => (
            <Reveal className="xion-category-reveal" delay={index * 0.04} key={category.title.ru}>
              <Link className="xion-category-card" to={localizedPath("/catalog", language)}>
                <span className="xion-category-count">
                  <strong>{category.count}</strong>
                  <small>{copy.unit}</small>
                </span>
                <span className="xion-category-image">
                  <img src={category.image} alt="" width="240" height="240" loading="lazy" decoding="async" />
                </span>
                <span className="xion-category-copy">
                  <strong>{category.title[language] || category.title.uz}</strong>
                  <small>{category.description[language] || category.description.uz}</small>
                </span>
                <ArrowUpRight className="xion-category-arrow" size={20} />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
