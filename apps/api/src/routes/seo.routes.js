import { Router } from "express";
import { prisma } from "../config/database.js";

export const seoRouter = Router();
const SITE_URL = "https://xion.uz";
const LANGUAGES = ["uz", "ru", "en"];
const staticPaths = ["/", "/catalog", "/company", "/medical-institutions", "/manufacturers", "/news", "/career", "/contact", "/warranty-return", "/terms", "/privacy"];
const xml = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[character]));
const localizedPath = (path, language) => language === "uz" ? path : `/${language}${path === "/" ? "" : path}`;
const localizedUrl = (path, language) => `${SITE_URL}${localizedPath(path, language)}`;
const alternates = (path) => [...LANGUAGES.map((language) => [language, localizedUrl(path, language)]), ["x-default", localizedUrl(path, "uz")]];

seoRouter.get("/robots.txt", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400").type("text/plain").send(["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /operator", "Disallow: /api/", "", `Sitemap: ${SITE_URL}/sitemap.xml`, "Host: xion.uz"].join("\n"));
});

seoRouter.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const [products, pages] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, select: { slug: true, title: true, image: true, updatedAt: true } }),
      prisma.contentPage.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } })
    ]);
    const pageRoutes = { about: "/company", "medical-institutions": "/medical-institutions", manufacturers: "/manufacturers", news: "/news", career: "/career", contact: "/contact", "warranty-return": "/warranty-return", terms: "/terms", privacy: "/privacy" };
    const entries = [
      ...staticPaths.map((path) => ({ path, priority: path === "/" ? "1.0" : path === "/catalog" ? "0.9" : "0.7" })),
      ...pages.map((page) => ({ path: pageRoutes[page.slug], lastmod: page.updatedAt, priority: "0.7" })).filter((entry) => entry.path && !staticPaths.includes(entry.path)),
      ...products.map((product) => ({ path: `/products/${product.slug}`, title: product.title, image: product.image, lastmod: product.updatedAt, priority: "0.8" }))
    ];
    const body = entries.flatMap((entry) => LANGUAGES.map((language) => {
      const alternateLinks = alternates(entry.path).map(([hreflang, href]) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${xml(href)}"/>`).join("");
      const image = entry.image ? `<image:image><image:loc>${xml(entry.image)}</image:loc><image:title>${xml(entry.title)}</image:title></image:image>` : "";
      const changefreq = entry.path.startsWith("/products/") || entry.path === "/" || entry.path === "/catalog" || entry.path === "/news" ? "weekly" : "monthly";
      return `<url><loc>${xml(localizedUrl(entry.path, language))}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod.toISOString()}</lastmod>` : ""}<changefreq>${changefreq}</changefreq><priority>${entry.priority}</priority>${alternateLinks}${image}</url>`;
    })).join("");
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400").type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`);
  } catch (error) { next(error); }
});
