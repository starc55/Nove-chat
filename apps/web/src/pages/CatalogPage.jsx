import { XionSelect } from "../components/common/XionSelect.jsx";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Grid3X3, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { PurchaseModal } from "../components/common/PurchaseModal.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { CatalogProductCard } from "../components/catalog/CatalogProductCard.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { useLandingData } from "../hooks/useLandingData.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localizeProduct } from "../utils/localize-product.js";
import { getPageSeo, localizedPath, XION_SITE_URL } from "../config/seo.js";

const copy = {
  uz: { home: "Bosh sahifa", all: "Barcha mahsulotlar", catalog: "Katalog", search: "Mahsulot nomini qidiring", filter: "Filtr", categories: "Mahsulot asosi", availability: "Mavjudlik", request: "So‘rov asosida", featured: "Tavsiya etilgan", clear: "Tozalash", apply: "Mahsulotlarni ko‘rsatish", found: "ta mahsulot", sort: "Saralash", recommended: "Tavsiya bo‘yicha", name: "Nomi bo‘yicha", priceLow: "Arzonidan boshlab", priceHigh: "Qimmatidan boshlab", empty: "Tanlangan filtrlar bo‘yicha mahsulot topilmadi", reset: "Filtrlarni bekor qilish", price: "Narx bo‘yicha", from: "Dan", to: "Gacha", brand: "Brend", material: "Material", form: "Forma pessariy", size: "Razmer", type: "Razmer / tip", allCategories: "Hammasi" },
  ru: { home: "Главная", all: "Все товары", catalog: "Каталог", search: "Поиск по названию", filter: "Фильтр", categories: "Категории", availability: "Наличие", request: "По запросу", featured: "Рекомендуемые", clear: "Очистить", apply: "Показать товары", found: "товаров", sort: "Сортировка", recommended: "По рекомендации", name: "По названию", priceLow: "Сначала дешевле", priceHigh: "Сначала дороже", empty: "По выбранным фильтрам ничего не найдено", reset: "Сбросить фильтры", price: "По цене", from: "От", to: "До", brand: "Бренд", material: "Материал", form: "Форма пессария", size: "Размер", type: "Размер / тип", allCategories: "Все" },
  en: { home: "Home", all: "All products", catalog: "Catalogue", search: "Search products", filter: "Filter", categories: "Product category", availability: "Availability", request: "On request", featured: "Featured", clear: "Clear", apply: "Show products", found: "products", sort: "Sort", recommended: "Recommended", name: "By name", priceLow: "Lowest price", priceHigh: "Highest price", empty: "No products match the selected filters", reset: "Reset filters", price: "Price", from: "From", to: "To", brand: "Brand", material: "Material", form: "Pessary form", size: "Size", type: "Size / type", allCategories: "All" }
};

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const effectivePrice = (product) => product.price == null ? Math.min(...(product.variants || []).map((variant) => Number(variant.price)).filter(Number.isFinite), Infinity) : Number(product.price);

function FilterGroup({ title, values, selected, onToggle, labels = {} }) {
  if (!values.length) return null;
  return <div className="catalog-filter-group"><h2>{title}</h2>{values.map((value) => <label key={value}><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)}/><i/><span>{labels[value] || value}</span></label>)}</div>;
}

export function CatalogPage() {
  const { data, loading } = useLandingData();
  const { language, t } = useLanguage();
  const c = copy[language] || copy.uz;
  const seo = getPageSeo("/catalog", language);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ categories: [], brands: [], materials: [], forms: [], sizes: [], types: [] });
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sort, setSort] = useState("recommended");
  const [mobileFilters, setMobileFilters] = useState(false);

  const products = useMemo(() => data.products.map((source) => {
    const localized = localizeProduct(source, language);
    return {
      ...localized,
      filterCategory: source.category || "XION MEDICAL",
      filterProductType: source.productType,
      variants: (localized.variants || []).map((variant, index) => ({
        ...variant,
        filterType: source.variants?.[index]?.type || variant.type,
      })),
    };
  }), [data.products, language]);
  const taxonomy = useMemo(() => (data.catalogTaxonomies || [])
    .filter((item) => item.active !== false)
    .map((item) => ({ ...item, label: item.translations?.[language]?.name || item.name })), [data.catalogTaxonomies, language]);
  const categoryItems = useMemo(() => {
    const managed = taxonomy.filter((item) => item.kind === "CATEGORY");
    if (managed.length) return managed;
    return unique(products.map((product) => product.filterCategory)).map((value) => ({ value, label: products.find((product) => product.filterCategory === value)?.category || value }));
  }, [products, taxonomy]);
  const typeItems = useMemo(() => {
    const managed = taxonomy.filter((item) => item.kind === "PRODUCT_TYPE");
    if (managed.length) return managed;
    return unique(products.flatMap((product) => [product.filterProductType, ...(product.variants || []).map((variant) => variant.filterType)])).map((value) => ({ value, label: value }));
  }, [products, taxonomy]);
  const categoryLabels = useMemo(() => Object.fromEntries(categoryItems.map((item) => [item.value, item.label])), [categoryItems]);
  const typeLabels = useMemo(() => Object.fromEntries(typeItems.map((item) => [item.value, item.label])), [typeItems]);
  const options = useMemo(() => ({
    categories: categoryItems.map((item) => item.value), brands: unique(products.map((product) => product.brand)), materials: unique(products.map((product) => product.material)), forms: unique(products.map((product) => product.form)),
    sizes: unique(products.flatMap((product) => (product.variants || []).map((variant) => variant.size))), types: typeItems.map((item) => item.value)
  }), [categoryItems, products, typeItems]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    const filtered = products.filter((product) => {
      const variants = product.variants || [];
      const price = effectivePrice(product);
      const checks = [
        !normalized || `${product.title} ${product.shortDescription || ""} ${product.category || ""} ${product.brand || ""}`.toLocaleLowerCase(language).includes(normalized),
        !filters.categories.length || filters.categories.includes(product.filterCategory),
        !filters.brands.length || filters.brands.includes(product.brand),
        !filters.materials.length || filters.materials.includes(product.material),
        !filters.forms.length || filters.forms.includes(product.form),
        !filters.sizes.length || variants.some((variant) => filters.sizes.includes(variant.size)),
        !filters.types.length || filters.types.includes(product.filterProductType) || variants.some((variant) => filters.types.includes(variant.filterType)),
        !featuredOnly || product.featured,
        priceFrom === "" || (Number.isFinite(price) && price >= Number(priceFrom)),
        priceTo === "" || (Number.isFinite(price) && price <= Number(priceTo))
      ];
      return checks.every(Boolean);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title, language);
      if (sort === "price-asc" || sort === "price-desc") {
        const priceA = effectivePrice(a);
        const priceB = effectivePrice(b);
        if (!Number.isFinite(priceA)) return Number.isFinite(priceB) ? 1 : 0;
        if (!Number.isFinite(priceB)) return -1;
        return sort === "price-asc" ? priceA - priceB : priceB - priceA;
      }
      return Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }, [featuredOnly, filters, language, priceFrom, priceTo, products, query, sort]);

  const toggle = (group, value) => setFilters((current) => ({ ...current, [group]: current[group].includes(value) ? current[group].filter((item) => item !== value) : [...current[group], value] }));
  const chooseCategory = (category) => setFilters((current) => ({ ...current, categories: current.categories[0] === category ? [] : [category] }));
  const reset = () => { setFilters({ categories: [], brands: [], materials: [], forms: [], sizes: [], types: [] }); setFeaturedOnly(false); setPriceFrom(""); setPriceTo(""); setQuery(""); };
  const hasFilters = Object.values(filters).some((values) => values.length) || featuredOnly || query || priceFrom !== "" || priceTo !== "";

  useEffect(() => {
    document.body.classList.toggle("catalog-filter-open", mobileFilters);
    const closeOnEscape = (event) => event.key === "Escape" && setMobileFilters(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.classList.remove("catalog-filter-open"); window.removeEventListener("keydown", closeOnEscape); };
  }, [mobileFilters]);

  return <div className="site-shell">
    <Seo title={seo.title} description={seo.description} canonicalPath="/catalog" language={language} jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${XION_SITE_URL}${localizedPath("/catalog", language)}#collection`, name: seo.title, description: seo.description, url: `${XION_SITE_URL}${localizedPath("/catalog", language)}`, mainEntity: { "@type": "ItemList", numberOfItems: products.length, itemListElement: products.slice(0, 50).map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.title, url: `${XION_SITE_URL}${localizedPath(`/products/${product.slug}`, language)}` })) } }}/>
    <Header contact={data.settings.contact} loading={loading}/>
    <main className="catalog-page catalog-storefront">
      <section className="catalog-storefront-hero"><div className="container"><nav><Link to={localizedPath("/", language)}>{c.home}</Link><span>/</span><strong>{c.all}</strong></nav><div><p className="eyebrow"><span/>{t.productsEyebrow}</p><h1>{t.catalogTitle}</h1><p>{t.catalogIntro}</p></div><aside><strong>{products.length}</strong><span>{c.found}</span></aside></div></section>
      <nav className="catalog-category-nav" aria-label={c.categories}><div className="container"><button type="button" className={!filters.categories.length ? "is-active catalog-all-button" : "catalog-all-button"} onClick={() => setFilters((current) => ({ ...current, categories: [] }))}><Grid3X3 size={17}/>{c.catalog}</button>{categoryItems.map((category) => <button type="button" className={filters.categories.includes(category.value) ? "is-active" : ""} onClick={() => chooseCategory(category.value)} key={category.id || category.value}>{category.label}</button>)}</div></nav>
      <section className="container catalog-browser">
        <div className="catalog-results"><div className="catalog-toolbar"><div className="catalog-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search}/>{query ? <button type="button" onClick={() => setQuery("")} aria-label={c.clear}><X size={16}/></button> : null}</div><div className="catalog-sort"><span>{c.sort}</span><label><XionSelect value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">{c.recommended}</option><option value="price-asc">{c.priceLow}</option><option value="price-desc">{c.priceHigh}</option><option value="name">{c.name}</option></XionSelect><ChevronDown size={15}/></label></div><button className="catalog-mobile-filter" type="button" onClick={() => setMobileFilters(true)} aria-expanded={mobileFilters} aria-controls="catalog-mobile-filter-panel"><SlidersHorizontal size={17}/>{c.filter}</button></div>
          <div className="catalog-result-meta"><strong>{visibleProducts.length} {c.found}</strong>{hasFilters ? <button type="button" onClick={reset}>{c.clear}<X size={14}/></button> : null}</div>
          {visibleProducts.length ? <div className="catalog-products-grid">{visibleProducts.map((product, index) => <CatalogProductCard key={product.id} product={product} language={language} t={t} onBuy={setSelectedProduct} priority={index < 3}/>)}</div> : <div className="catalog-empty"><PackageSearch/><h2>{c.empty}</h2><button type="button" onClick={reset}>{c.reset}</button></div>}
        </div>
        {mobileFilters ? <button className="catalog-filter-backdrop" type="button" onClick={() => setMobileFilters(false)} aria-label={t.closeMenu}/> : null}
        <aside id="catalog-mobile-filter-panel" className={`catalog-filter-panel ${mobileFilters ? "is-open" : ""}`} aria-label={c.filter}><div className="catalog-filter-heading"><span><SlidersHorizontal size={17}/>{c.filter}</span><div>{hasFilters ? <button type="button" onClick={reset}>{c.clear}</button> : null}<button className="catalog-filter-close" type="button" onClick={() => setMobileFilters(false)} aria-label={t.closeMenu}><X size={18}/></button></div></div>
          <div className="catalog-filter-group"><h2>{c.price}</h2><div className="catalog-price-fields"><label><span>{c.from}</span><input type="number" min="0" value={priceFrom} onChange={(event) => setPriceFrom(event.target.value)}/></label><label><span>{c.to}</span><input type="number" min="0" value={priceTo} onChange={(event) => setPriceTo(event.target.value)}/></label></div></div>
          <FilterGroup title={c.categories} values={options.categories} labels={categoryLabels} selected={filters.categories} onToggle={(value) => toggle("categories", value)}/><FilterGroup title={c.brand} values={options.brands} selected={filters.brands} onToggle={(value) => toggle("brands", value)}/><FilterGroup title={c.material} values={options.materials} selected={filters.materials} onToggle={(value) => toggle("materials", value)}/><FilterGroup title={c.form} values={options.forms} selected={filters.forms} onToggle={(value) => toggle("forms", value)}/><FilterGroup title={c.size} values={options.sizes} selected={filters.sizes} onToggle={(value) => toggle("sizes", value)}/><FilterGroup title={c.type} values={options.types} labels={typeLabels} selected={filters.types} onToggle={(value) => toggle("types", value)}/>
          <div className="catalog-filter-group"><h2>{c.availability}</h2><label><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)}/><i/><span>{c.featured}</span></label></div>
          <footer className="catalog-filter-footer"><button type="button" onClick={() => setMobileFilters(false)}>{c.apply} · {visibleProducts.length}</button></footer>
        </aside>
      </section>
    </main>
    <Footer settings={data.settings} loading={loading}/><ChatWidget/><PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)}/>
  </div>;
}
