import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  absoluteLocalizedUrl,
  alternateLanguageUrls,
  getPageSeo,
  localizedPath,
  XION_DEFAULT_IMAGE,
  XION_LANGUAGES,
  XION_LANGUAGE_LOCALES,
  XION_PAGE_SEO,
  XION_SITE_URL,
} from "../src/config/seo.js";
import { landingFallback } from "../src/data/landing-fallback.js";
import { localizeProduct } from "../src/utils/localize-product.js";
import { localizeBlogPost } from "../src/utils/localize-blog-post.js";

const DIST_DIR = resolve("dist");
const API_URL = (process.env.SEO_API_URL || process.env.VITE_API_URL || "https://nove-chat.onrender.com/api/v1").replace(/\/$/, "");
const GOOGLE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION || "";
const YANDEX_VERIFICATION = process.env.YANDEX_SITE_VERIFICATION || process.env.VITE_YANDEX_SITE_VERIFICATION || "";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "f4c9b612e58147f0a23d8096ac75e31b";
const PUBLIC_ROUTES = Object.keys(XION_PAGE_SEO);

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const escapeXml = (value) => escapeHtml(value);
const absoluteUrl = (value) => new URL(value || XION_DEFAULT_IMAGE, XION_SITE_URL).href;

function plainText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectText(value, output = []) {
  if (typeof value === "string") {
    const text = plainText(value);
    if (text && !/^https?:\/\//i.test(text) && text.length > 2) output.push(text);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectText(item, output));
  }
  return [...new Set(output)].slice(0, 24);
}

function snapshotHtml({ title, description, language, image, sections = [], links = [] }) {
  const imageHtml = image ? `<img src="${escapeHtml(absoluteUrl(image))}" alt="${escapeHtml(title)}" width="960" height="540" loading="eager" />` : "";
  const sectionHtml = sections.filter(Boolean).map((text) => `<p>${escapeHtml(plainText(text))}</p>`).join("");
  const linkHtml = links.length ? `<nav aria-label="${language === "ru" ? "Связанные страницы" : "Bog‘liq sahifalar"}">${links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join(" ")}</nav>` : "";
  return `<main class="seo-prerender" lang="${language}"><article>${imageHtml}<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${sectionHtml}${linkHtml}</article></main>`;
}

function removeSeoTags(html) {
  const metaKeys = [
    ["name", "description"], ["name", "robots"], ["name", "googlebot"], ["name", "author"],
    ["name", "geo.region"], ["name", "geo.placename"], ["name", "geo.position"], ["name", "ICBM"],
    ["name", "google-site-verification"], ["name", "yandex-verification"],
    ["name", "twitter:card"], ["name", "twitter:title"], ["name", "twitter:description"],
    ["name", "twitter:image"], ["name", "twitter:image:alt"],
    ["property", "og:type"], ["property", "og:locale"], ["property", "og:locale:alternate"],
    ["property", "og:title"], ["property", "og:description"], ["property", "og:url"],
    ["property", "og:image"], ["property", "og:image:width"], ["property", "og:image:height"],
    ["property", "og:image:alt"], ["property", "og:site_name"],
  ];
  let clean = html.replace(/<title>[\s\S]*?<\/title>\s*/gi, "");
  clean = clean.replace(/<link\s+[^>]*rel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, "");
  clean = clean.replace(/<script\s+[^>]*(?:id=["']xion-(?:static|route)-jsonld["']|type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi, "");
  for (const [attribute, value] of metaKeys) {
    const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>\\s*`, "gi");
    clean = clean.replace(pattern, "");
  }
  return clean;
}

function commonGraph({ canonicalUrl, language, title, description, type = "WebPage", contact = {} }) {
  return [
    {
      "@type": ["Organization", "MedicalBusiness"],
      "@id": `${XION_SITE_URL}/#organization`,
      name: "XION",
      alternateName: "XION Medical",
      url: XION_SITE_URL,
      logo: { "@type": "ImageObject", url: `${XION_SITE_URL}/xion-logo.svg` },
      image: XION_DEFAULT_IMAGE,
      telephone: contact.phone || "+998 99 556 06 60",
      email: contact.email || "info@xion.uz",
      priceRange: "$$",
      currenciesAccepted: "UZS",
      areaServed: { "@type": "Country", name: "Uzbekistan" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Allon ko‘chasi 141A",
        addressLocality: "Toshkent",
        addressRegion: "Toshkent",
        addressCountry: "UZ",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.346819, longitude: 69.214511 },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      }],
      sameAs: ["https://t.me/xion_office"],
    },
    {
      "@type": "WebSite",
      "@id": `${XION_SITE_URL}/#website`,
      url: `${XION_SITE_URL}/`,
      name: "XION",
      publisher: { "@id": `${XION_SITE_URL}/#organization` },
      inLanguage: ["uz", "ru"],
    },
    {
      "@type": type,
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      inLanguage: language,
      isPartOf: { "@id": `${XION_SITE_URL}/#website` },
      about: { "@id": `${XION_SITE_URL}/#organization` },
      primaryImageOfPage: { "@type": "ImageObject", url: XION_DEFAULT_IMAGE },
    },
  ];
}

function breadcrumbGraph(path, language, currentName) {
  if (path === "/") return null;
  const items = [{ "@type": "ListItem", position: 1, name: language === "ru" ? "Главная" : "Bosh sahifa", item: absoluteLocalizedUrl("/", language) }];
  if (path.startsWith("/products/")) {
    items.push({ "@type": "ListItem", position: 2, name: language === "ru" ? "Каталог" : "Katalog", item: absoluteLocalizedUrl("/catalog", language) });
  }
  items.push({ "@type": "ListItem", position: items.length + 1, name: currentName, item: absoluteLocalizedUrl(path, language) });
  return { "@type": "BreadcrumbList", "@id": `${absoluteLocalizedUrl(path, language)}#breadcrumb`, itemListElement: items };
}

function renderHtml(template, page) {
  const canonicalUrl = absoluteLocalizedUrl(page.path, page.language);
  const imageUrl = absoluteUrl(page.image);
  const alternates = alternateLanguageUrls(page.path);
  const alternateLocales = XION_LANGUAGES.filter((language) => language !== page.language)
    .map((language) => `<meta property="og:locale:alternate" content="${XION_LANGUAGE_LOCALES[language]}" />`)
    .join("\n    ");
  const verification = [
    GOOGLE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(GOOGLE_VERIFICATION)}" />` : "",
    YANDEX_VERIFICATION ? `<meta name="yandex-verification" content="${escapeHtml(YANDEX_VERIFICATION)}" />` : "",
  ].filter(Boolean).join("\n    ");
  const alternateLinks = Object.entries(alternates).map(([hreflang, href]) => `<link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />`).join("\n    ");
  const robots = page.noindex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": page.graph }).replace(/</g, "\\u003c");
  const tags = `
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="${robots}" />
    <meta name="googlebot" content="${page.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}" />
    <meta name="author" content="XION" />
    <meta name="geo.region" content="UZ-TK" />
    <meta name="geo.placename" content="Tashkent" />
    <meta name="geo.position" content="41.346819;69.214511" />
    <meta name="ICBM" content="41.346819, 69.214511" />
    ${verification}
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    ${page.noindex ? "" : alternateLinks}
    <meta property="og:type" content="${page.ogType || "website"}" />
    <meta property="og:site_name" content="XION" />
    <meta property="og:locale" content="${XION_LANGUAGE_LOCALES[page.language]}" />
    ${alternateLocales}
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="2048" />
    <meta property="og:image:height" content="1072" />
    <meta property="og:image:alt" content="${escapeHtml(page.imageAlt || page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(page.imageAlt || page.title)}" />
    <script id="xion-static-jsonld" type="application/ld+json">${jsonLd}</script>
    <style id="xion-prerender-style">.seo-prerender{max-width:1180px;margin:0 auto;padding:48px 24px;font:16px/1.65 Arial,sans-serif;color:#212529}.seo-prerender article{max-width:900px}.seo-prerender h1{font-size:clamp(2rem,5vw,4rem);line-height:1.05}.seo-prerender img{display:block;width:100%;height:auto;border-radius:20px}.seo-prerender nav{display:flex;flex-wrap:wrap;gap:16px;margin-top:24px}.seo-prerender a{color:#0d6efd}@media(prefers-color-scheme:dark){.seo-prerender{color:#fff;background:#101319}}</style>`;

  let output = removeSeoTags(template)
    .replace(/<html\s+lang=["'][^"']+["']/, `<html lang="${page.language}"`)
    .replace("</head>", `${tags}\n  </head>`);
  if (page.bodyHtml) output = output.replace('<div id="root"></div>', `<div id="root">${page.bodyHtml}</div>`);
  return output;
}

async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(20_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  const body = await response.json();
  return body.data;
}

async function loadContent() {
  try {
    const [landing, pages] = await Promise.all([fetchJson("/public/landing"), fetchJson("/public/pages")]);
    return { ...landing, blogPosts: landing.blogPosts || landingFallback.blogPosts, pages };
  } catch (error) {
    console.warn(`[seo] API ishlamadi, bundled fallback ishlatiladi: ${error.message}`);
    return { ...landingFallback, pages: [] };
  }
}

function pageType(path) {
  if (path === "/company") return "AboutPage";
  if (path === "/contact") return "ContactPage";
  if (path === "/catalog") return "CollectionPage";
  return "WebPage";
}

function pageGraph({ path, language, title, description, products, pages, contact }) {
  const canonicalUrl = absoluteLocalizedUrl(path, language);
  const graph = commonGraph({ canonicalUrl, language, title, description, type: pageType(path), contact });
  const breadcrumb = breadcrumbGraph(path, language, title);
  if (breadcrumb) graph.push(breadcrumb);
  if (path === "/catalog") {
    graph.push({
      "@type": "ItemList",
      "@id": `${canonicalUrl}#products`,
      name: title,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 50).map((source, index) => {
        const product = localizeProduct(source, language);
        return { "@type": "ListItem", position: index + 1, name: product.title, url: absoluteLocalizedUrl(`/products/${product.slug}`, language) };
      }),
    });
  }
  if (path === "/contact") {
    const source = pages.find((page) => page.slug === "contact")?.content;
    const content = source?.[language] || source?.uz;
    const faqs = (content?.sections || []).flatMap((section) => section.faqs || []);
    if (faqs.length) graph.push({ "@type": "FAQPage", "@id": `${canonicalUrl}#faq`, mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) });
  }
  return graph;
}

function productGraph(product, language, contact) {
  const path = `/products/${product.slug}`;
  const canonicalUrl = absoluteLocalizedUrl(path, language);
  const images = [...new Set([product.image, ...(product.images || []).map((image) => image.url)].filter(Boolean))].map(absoluteUrl);
  const prices = [product.price, ...(product.variants || []).map((variant) => variant.price)].filter((price) => price != null).map(Number);
  const price = prices.length ? Math.min(...prices) : null;
  const variants = product.variants || [];
  const stock = variants.length ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0) : product.stock;
  const description = product.shortDescription || product.longDescription || "XION medical product";
  const seoTitle = `${product.title} — ${language === "ru" ? "характеристики и заказ" : "xususiyatlari va buyurtma"} | XION`;
  const graph = commonGraph({ canonicalUrl, language, title: seoTitle, description, type: "ItemPage", contact });
  graph.push({
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: product.title,
    url: canonicalUrl,
    sku: product.id,
    image: images,
    description,
    category: product.category || undefined,
    brand: { "@type": "Brand", name: product.brand || "XION" },
    additionalProperty: product.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications).map(([name, value]) => ({ "@type": "PropertyValue", name, value: String(value) })) : [],
    offers: price != null && product.purchasable !== false ? {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "UZS",
      price,
      availability: stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${XION_SITE_URL}/#organization` },
    } : undefined,
  });
  graph.push(breadcrumbGraph(path, language, product.title));
  return { graph, images, description, seoTitle };
}

function blogGraph(post, language, contact) {
  const path = `/news/${post.slug}`;
  const canonicalUrl = absoluteLocalizedUrl(path, language);
  const graph = commonGraph({ canonicalUrl, language, title: post.title, description: post.excerpt, type: "NewsArticle", contact });
  graph.push({
    "@type": "NewsArticle",
    "@id": `${canonicalUrl}#article`,
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [absoluteUrl(post.coverImage)] : [XION_DEFAULT_IMAGE],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: { "@id": `${XION_SITE_URL}/#organization` },
    publisher: { "@id": `${XION_SITE_URL}/#organization` },
    mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
  });
  graph.push(breadcrumbGraph(path, language, post.title));
  return graph;
}

async function writeRoute(path, html) {
  if (path === "/") {
    await writeFile(resolve(DIST_DIR, "index.html"), html, "utf8");
    return;
  }
  if (path === "/ru/" || path === "/ru") {
    const output = resolve(DIST_DIR, "ru", "index.html");
    await mkdir(resolve(output, ".."), { recursive: true });
    await writeFile(output, html, "utf8");
    return;
  }
  const output = resolve(DIST_DIR, `${path.replace(/^\//, "")}.html`);
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, html, "utf8");
}

const ROUTE_TO_PAGE_SLUG = {
  "/company": "about",
  "/medical-institutions": "medical-institutions",
  "/manufacturers": "manufacturers",
  "/simurg": "simurg",
  "/career": "career",
  "/contact": "contact",
  "/warranty-return": "warranty-return",
  "/terms": "terms",
  "/privacy": "privacy",
};

function staticSnapshot({ basePath, language, seo, content, pages, products, blogPosts }) {
  const page = pages.find((item) => item.slug === ROUTE_TO_PAGE_SLUG[basePath]);
  const localizedContent = page?.content?.[language] || page?.content?.uz || page?.content;
  let sections = collectText(localizedContent);
  let links = [];
  if (basePath === "/") {
    sections = collectText({ hero: content.heroSlides, offers: content.offerCards, settings: content.settings }).slice(0, 18);
    links = [
      { href: localizedPath("/catalog", language), label: language === "ru" ? "Каталог продукции" : "Mahsulotlar katalogi" },
      { href: localizedPath("/company", language), label: language === "ru" ? "О компании" : "Kompaniya haqida" },
      { href: localizedPath("/contact", language), label: language === "ru" ? "Контакты" : "Aloqa" },
    ];
  } else if (basePath === "/catalog") {
    sections = products.slice(0, 40).map((source) => localizeProduct(source, language).title);
    links = products.slice(0, 40).map((source) => {
      const product = localizeProduct(source, language);
      return { href: localizedPath(`/products/${product.slug}`, language), label: product.title };
    });
  } else if (basePath === "/news") {
    sections = blogPosts.slice(0, 30).map((source) => localizeBlogPost(source, language).excerpt);
    links = blogPosts.slice(0, 30).map((source) => {
      const post = localizeBlogPost(source, language);
      return { href: localizedPath(`/news/${post.slug}`, language), label: post.title };
    });
  }
  return snapshotHtml({ title: seo.title, description: seo.description, language, sections, links });
}

function sitemapXml(entries) {
  const body = entries.map((entry) => {
    const alternates = Object.entries(alternateLanguageUrls(entry.basePath)).map(([language, href]) => `<xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(href)}"/>`).join("");
    const image = entry.image ? `<image:image><image:loc>${escapeXml(absoluteUrl(entry.image))}</image:loc><image:title>${escapeXml(entry.title)}</image:title></image:image>` : "";
    return `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastmod ? `<lastmod>${escapeXml(new Date(entry.lastmod).toISOString())}</lastmod>` : ""}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority>${alternates}${image}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>\n`;
}

async function main() {
  const template = await readFile(resolve(DIST_DIR, "index.html"), "utf8");
  const content = await loadContent();
  const products = content.products || [];
  const pages = content.pages || [];
  const blogPosts = content.blogPosts || [];
  const advertisements = content.advertisements || [];
  const contact = content.settings?.contact || {};
  const sitemapEntries = [];

  for (const basePath of PUBLIC_ROUTES) {
    for (const language of XION_LANGUAGES) {
      const seo = getPageSeo(basePath, language);
      const path = localizedPath(basePath, language);
      const graph = pageGraph({ path: basePath, language, title: seo.title, description: seo.description, products, pages, contact });
      const bodyHtml = staticSnapshot({ basePath, language, seo, content, pages, products, blogPosts });
      await writeRoute(path, renderHtml(template, { path: basePath, language, ...seo, graph, bodyHtml }));
      sitemapEntries.push({ basePath, url: absoluteLocalizedUrl(basePath, language), changefreq: basePath === "/" || basePath === "/catalog" || basePath === "/news" ? "weekly" : "monthly", priority: basePath === "/" ? "1.0" : basePath === "/catalog" ? "0.9" : "0.7", title: seo.title });
    }
  }

  for (const source of products) {
    for (const language of XION_LANGUAGES) {
      const product = localizeProduct(source, language);
      const path = `/products/${product.slug}`;
      const details = productGraph(product, language, contact);
      const localized = localizedPath(path, language);
      const bodyHtml = snapshotHtml({
        title: product.title,
        description: details.description,
        language,
        image: details.images[0],
        sections: collectText({ description: product.longDescription, specifications: product.specifications, variants: product.variants }),
        links: [{ href: localizedPath("/catalog", language), label: language === "ru" ? "Вернуться в каталог" : "Katalogga qaytish" }],
      });
      await writeRoute(localized, renderHtml(template, { path, language, title: details.seoTitle, description: details.description, image: details.images[0], imageAlt: product.title, ogType: "product", graph: details.graph, bodyHtml }));
      sitemapEntries.push({ basePath: path, url: absoluteLocalizedUrl(path, language), lastmod: product.updatedAt, changefreq: "weekly", priority: "0.8", image: details.images[0], title: product.title });
    }
  }

  for (const source of blogPosts) {
    for (const language of XION_LANGUAGES) {
      const post = localizeBlogPost(source, language);
      const path = `/news/${post.slug}`;
      const localized = localizedPath(path, language);
      const seoTitle = `${post.title} — ${language === "ru" ? "новости XION" : "XION yangiliklari"}`;
      const bodyHtml = snapshotHtml({ title: post.title, description: post.excerpt, language, image: post.coverImage, sections: collectText(post.content), links: [{ href: localizedPath("/news", language), label: language === "ru" ? "Все новости" : "Barcha yangiliklar" }] });
      await writeRoute(localized, renderHtml(template, { path, language, title: seoTitle, description: post.excerpt, image: post.coverImage, imageAlt: post.title, ogType: "article", graph: blogGraph(post, language, contact), bodyHtml }));
      sitemapEntries.push({ basePath: path, url: absoluteLocalizedUrl(path, language), lastmod: post.updatedAt, changefreq: "monthly", priority: "0.8", image: post.coverImage, title: post.title });
    }
  }

  for (const campaign of advertisements.filter((item) => item.enabled && item.id)) {
    for (const language of XION_LANGUAGES) {
      const translated = campaign.translations?.[language] || {};
      const title = translated.title || campaign.title;
      const description = translated.description || campaign.description || title;
      const path = `/campaigns/${campaign.id}`;
      const localized = localizedPath(path, language);
      const seoTitle = `${title} — ${language === "ru" ? "предложение XION" : "XION taklifi"}`;
      const graph = commonGraph({ canonicalUrl: absoluteLocalizedUrl(path, language), language, title: seoTitle, description, type: "WebPage", contact });
      graph.push(breadcrumbGraph(path, language, title));
      const bodyHtml = snapshotHtml({ title, description, language, image: campaign.image, links: [{ href: localizedPath("/catalog", language), label: language === "ru" ? "Каталог продукции" : "Mahsulotlar katalogi" }] });
      await writeRoute(localized, renderHtml(template, { path, language, title: seoTitle, description, image: campaign.image, imageAlt: title, graph, bodyHtml }));
      sitemapEntries.push({ basePath: path, url: absoluteLocalizedUrl(path, language), lastmod: campaign.updatedAt, changefreq: "monthly", priority: "0.7", image: campaign.image, title });
    }
  }

  const privateGraph = commonGraph({ canonicalUrl: `${XION_SITE_URL}/admin`, language: "uz", title: "XION Control", description: "XION yopiq boshqaruv paneli" });
  const privateHtml = renderHtml(template, { path: "/admin", language: "uz", title: "XION Control", description: "XION yopiq boshqaruv paneli", noindex: true, graph: privateGraph });
  await writeRoute("/admin", privateHtml);
  await writeRoute("/admin/sign-in", privateHtml);
  await writeRoute("/operator", renderHtml(template, { path: "/operator", language: "uz", title: "XION Operator", description: "XION yopiq operator paneli", noindex: true, graph: [] }));
  await writeFile(resolve(DIST_DIR, "404.html"), renderHtml(template, { path: "/404", language: "uz", title: "Sahifa topilmadi | XION", description: "So‘ralgan sahifa topilmadi.", noindex: true, graph: [] }), "utf8");
  await writeFile(resolve(DIST_DIR, "sitemap.xml"), sitemapXml(sitemapEntries), "utf8");
  const robots = [
    "User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /operator", "Disallow: /api/", "",
    "User-agent: Googlebot", "Allow: /", "Disallow: /admin", "Disallow: /operator", "Disallow: /api/", "",
    "User-agent: YandexBot", "Allow: /", "Disallow: /admin", "Disallow: /operator", "Disallow: /api/", "",
    "User-agent: OAI-SearchBot", "Allow: /", "",
    "User-agent: ChatGPT-User", "Allow: /", "",
    "User-agent: GPTBot", "Allow: /", "",
    "Sitemap: https://xion.uz/sitemap.xml", "Host: xion.uz", "",
  ].join("\n");
  await writeFile(resolve(DIST_DIR, "robots.txt"), robots, "utf8");
  const llmsLinks = sitemapEntries.filter((entry) => !entry.url.includes("/ru/") && !entry.url.endsWith("/ru/")).map((entry) => `- [${entry.title || "XION"}](${entry.url})`).join("\n");
  await writeFile(resolve(DIST_DIR, "llms.txt"), `# XION\n\n> O‘zbekiston bo‘ylab ginekologiya va akusherlik uchun sertifikatlangan tibbiy mahsulotlar, mutaxassis maslahati va buyurtma xizmati.\n\n## Asosiy sahifalar\n\n${llmsLinks}\n\n## Aloqa\n\n- Sayt: https://xion.uz/\n- Telegram: https://t.me/xion_office\n- Telefon: ${contact.phone || "+998 99 556 06 60"}\n`, "utf8");
  const fullText = sitemapEntries.map((entry) => `${entry.title || "XION"}\n${entry.url}`).join("\n\n");
  await writeFile(resolve(DIST_DIR, "llms-full.txt"), `# XION public content index\n\n${fullText}\n`, "utf8");
  await writeFile(resolve(DIST_DIR, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY, "utf8");
  console.log(`[seo] ${sitemapEntries.length} sitemap URL va ${(PUBLIC_ROUTES.length + products.length + blogPosts.length + advertisements.length) * XION_LANGUAGES.length} public SEO sahifa yaratildi.`);
}

await main();
