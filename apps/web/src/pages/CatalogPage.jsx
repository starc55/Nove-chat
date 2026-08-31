import { useEffect, useMemo, useState } from "react";
import { ChevronDown, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { CatalogProductCard } from "../components/catalog/CatalogProductCard.jsx";
import { useLandingData } from "../hooks/useLandingData.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localizeProduct } from "../utils/localize-product.js";

const catalogCopy = {
  uz: { home: "Bosh sahifa", all: "Barcha mahsulotlar", search: "Mahsulot nomini qidiring", filter: "Filtr", categories: "Kategoriyalar", availability: "Mavjudlik", request: "So‘rov asosida", featured: "Tavsiya etilgan", clear: "Tozalash", found: "ta mahsulot", sort: "Saralash", defaultSort: "Tavsiya bo‘yicha", nameSort: "Nomi bo‘yicha", empty: "Tanlangan filtrlar bo‘yicha mahsulot topilmadi", reset: "Filtrlarni bekor qilish" },
  ru: { home: "Главная", all: "Все товары", search: "Поиск по названию", filter: "Фильтр", categories: "Категории", availability: "Наличие", request: "По запросу", featured: "Рекомендуемые", clear: "Очистить", found: "товаров", sort: "Сортировка", defaultSort: "По рекомендации", nameSort: "По названию", empty: "По выбранным фильтрам ничего не найдено", reset: "Сбросить фильтры" },
  en: { home: "Home", all: "All products", search: "Search products", filter: "Filter", categories: "Categories", availability: "Availability", request: "On request", featured: "Featured", clear: "Clear", found: "products", sort: "Sort", defaultSort: "Recommended", nameSort: "By name", empty: "No products match the selected filters", reset: "Reset filters" },
};

export function CatalogPage() {
  const { data, loading } = useLandingData();
  const { language, t } = useLanguage();
  const c = catalogCopy[language] || catalogCopy.uz;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [mobileFilters, setMobileFilters] = useState(false);

  const products = useMemo(() => data.products.map((product) => localizeProduct(product, language)), [data.products, language]);
  const categoryOptions = useMemo(() => [...new Map(products.map((product) => [product.category || "XION MEDICAL", 0])).keys()].map((category) => ({ category, count: products.filter((product) => (product.category || "XION MEDICAL") === category).length })), [products]);
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    const filtered = products.filter((product) => {
      const matchesSearch = !normalized || `${product.title} ${product.shortDescription || ""} ${product.category || ""}`.toLocaleLowerCase(language).includes(normalized);
      const matchesCategory = categories.length === 0 || categories.includes(product.category || "XION MEDICAL");
      const matchesFeatured = !featuredOnly || product.featured;
      return matchesSearch && matchesCategory && matchesFeatured;
    });
    return [...filtered].sort((a, b) => sort === "name" ? a.title.localeCompare(b.title, language) : (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories, featuredOnly, language, products, query, sort]);

  const toggleCategory = (category) => setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  const resetFilters = () => { setCategories([]); setFeaturedOnly(false); setQuery(""); };
  const hasFilters = categories.length > 0 || featuredOnly || query;

  useEffect(() => {
    document.body.classList.toggle("catalog-filter-open", mobileFilters);
    const closeOnEscape = (event) =>
      event.key === "Escape" && setMobileFilters(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("catalog-filter-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileFilters]);

  return <div className="site-shell">
    <Header contact={data.settings.contact} loading={loading}/>
    <main className="catalog-page catalog-storefront">
      <section className="catalog-storefront-hero"><div className="container"><nav><Link to="/">{c.home}</Link><span>/</span><strong>{c.all}</strong></nav><div><p className="eyebrow"><span/>{t.productsEyebrow}</p><h1>{t.catalogTitle}</h1><p>{t.catalogIntro}</p></div><aside><strong>{products.length}</strong><span>{c.found}</span></aside></div></section>

      <section className="container catalog-browser">
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <div className="catalog-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search}/>{query ? <button type="button" onClick={() => setQuery("")} aria-label={c.clear}><X size={16}/></button> : null}</div>
            <div className="catalog-sort"><span>{c.sort}</span><label><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">{c.defaultSort}</option><option value="name">{c.nameSort}</option></select><ChevronDown size={15}/></label></div>
            <button className="catalog-mobile-filter" type="button" onClick={() => setMobileFilters(true)} aria-expanded={mobileFilters} aria-controls="catalog-mobile-filter-panel"><SlidersHorizontal size={17}/>{c.filter}</button>
          </div>
          <div className="catalog-result-meta"><strong>{visibleProducts.length} {c.found}</strong>{hasFilters ? <button type="button" onClick={resetFilters}>{c.clear}<X size={14}/></button> : null}</div>
          {visibleProducts.length ? <div className="catalog-products-grid">{visibleProducts.map((product, index) => <CatalogProductCard key={product.id} product={product} language={language} t={t} onBuy={setSelectedProduct} priority={index < 3}/>)}</div> : <div className="catalog-empty"><PackageSearch/><h2>{c.empty}</h2><button type="button" onClick={resetFilters}>{c.reset}</button></div>}
        </div>

        {mobileFilters ? <button className="catalog-filter-backdrop" type="button" onClick={() => setMobileFilters(false)} aria-label={t.closeMenu}/> : null}
        <aside id="catalog-mobile-filter-panel" className={`catalog-filter-panel ${mobileFilters ? "is-open" : ""}`} aria-label={c.filter}>
          <div className="catalog-filter-heading"><span><SlidersHorizontal size={17}/>{c.filter}</span><div>{hasFilters ? <button type="button" onClick={resetFilters}>{c.clear}</button> : null}<button className="catalog-filter-close" type="button" onClick={() => setMobileFilters(false)} aria-label={t.closeMenu}><X size={18}/></button></div></div>
          <div className="catalog-filter-group"><h2>{c.categories}</h2>{categoryOptions.map(({ category, count }) => <label key={category}><input type="checkbox" checked={categories.includes(category)} onChange={() => toggleCategory(category)}/><i/><span>{category}</span><small>{count}</small></label>)}</div>
          <div className="catalog-filter-group"><h2>{c.availability}</h2><label><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)}/><i/><span>{c.featured}</span></label><label className="is-static"><input type="checkbox" checked readOnly/><i/><span>{c.request}</span><small>{products.length}</small></label></div>
        </aside>
      </section>
    </main>
    <Footer settings={data.settings} loading={loading}/>
    <ChatWidget/>
    <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)}/>
  </div>;
}
