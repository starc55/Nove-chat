import { useEffect } from "react";
import {
  alternateLanguageUrls,
  absoluteLocalizedUrl,
  XION_DEFAULT_IMAGE,
  XION_LANGUAGE_LOCALES,
  XION_SITE_URL as SITE_URL,
} from "../../config/seo.js";

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function setLink(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

export function Seo({
  title,
  description,
  canonicalPath = "/",
  image = XION_DEFAULT_IMAGE,
  imageAlt,
  type = "website",
  jsonLd,
  noindex = false,
  localized = true,
  language = document.documentElement.lang || "uz",
}) {
  useEffect(() => {
    const canonicalUrl = localized
      ? absoluteLocalizedUrl(canonicalPath, language)
      : new URL(canonicalPath, SITE_URL).href;
    const imageUrl = new URL(image || XION_DEFAULT_IMAGE, SITE_URL).href;
    const safeDescription = String(description || "").trim().slice(0, 320);
    const safeImageAlt = String(imageAlt || title || "XION").trim().slice(0, 180);

    document.documentElement.lang = language;
    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: safeDescription });
    setMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" });
    setMeta('meta[name="googlebot"]', { name: "googlebot", content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large" });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: safeDescription });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type });
    setMeta('meta[property="og:locale"]', { property: "og:locale", content: XION_LANGUAGE_LOCALES[language] || XION_LANGUAGE_LOCALES.uz });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    setMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    setMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: safeImageAlt });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "XION" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: safeDescription });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    setMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: safeImageAlt });
    setLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    document.head.querySelectorAll('link[data-xion-hreflang="true"]').forEach((element) => element.remove());
    if (localized && !noindex) {
      Object.entries(alternateLanguageUrls(canonicalPath)).forEach(([hreflang, href]) => {
        const alternate = document.createElement("link");
        alternate.rel = "alternate";
        alternate.hreflang = hreflang;
        alternate.href = href;
        alternate.dataset.xionHreflang = "true";
        document.head.appendChild(alternate);
      });
    }

    document.getElementById("xion-static-jsonld")?.remove();
    document.getElementById("xion-route-jsonld")?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = "xion-route-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => document.getElementById("xion-route-jsonld")?.remove();
  }, [canonicalPath, description, image, imageAlt, jsonLd, language, localized, noindex, title, type]);
  return null;
}

export const XION_SITE_URL = SITE_URL;
