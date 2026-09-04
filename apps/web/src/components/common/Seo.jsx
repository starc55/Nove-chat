import { useEffect } from "react";

const SITE_URL = "https://xion.uz";
const DEFAULT_IMAGE = `${SITE_URL}/og.png`;

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

export function Seo({ title, description, canonicalPath = "/", image = DEFAULT_IMAGE, type = "website", jsonLd, noindex = false, language = document.documentElement.lang || "uz" }) {
  useEffect(() => {
    const canonicalUrl = new URL(canonicalPath, SITE_URL).href;
    const imageUrl = new URL(image || DEFAULT_IMAGE, SITE_URL).href;
    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:locale"]', { property: "og:locale", content: language === "ru" ? "ru_RU" : language === "en" ? "en_US" : "uz_UZ" });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    setMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "XION" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    document.getElementById("xion-route-jsonld")?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = "xion-route-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => document.getElementById("xion-route-jsonld")?.remove();
  }, [canonicalPath, description, image, jsonLd, language, noindex, title, type]);
  return null;
}

export const XION_SITE_URL = SITE_URL;
