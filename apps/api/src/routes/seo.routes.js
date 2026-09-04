import { Router } from "express";
import { prisma } from "../config/database.js";

export const seoRouter = Router();
const SITE_URL = "https://xion.uz";
const staticPaths = ["/", "/catalog", "/company", "/medical-institutions", "/manufacturers", "/news", "/career", "/contact", "/warranty-return", "/terms", "/privacy"];
const xml = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[character]));

seoRouter.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /operator", "Disallow: /api/", "", `Sitemap: ${SITE_URL}/sitemap.xml`, `Host: ${SITE_URL}`].join("\n"));
});

seoRouter.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const [products, pages] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
      prisma.contentPage.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } })
    ]);
    const pageRoutes = { about: "/company", "medical-institutions": "/medical-institutions", manufacturers: "/manufacturers", news: "/news", career: "/career", contact: "/contact", "warranty-return": "/warranty-return", terms: "/terms", privacy: "/privacy" };
    const entries = [
      ...staticPaths.map((path) => ({ path, priority: path === "/" ? "1.0" : path === "/catalog" ? "0.9" : "0.7" })),
      ...pages.map((page) => ({ path: pageRoutes[page.slug], lastmod: page.updatedAt, priority: "0.7" })).filter((entry) => entry.path && !staticPaths.includes(entry.path)),
      ...products.map((product) => ({ path: `/products/${product.slug}`, lastmod: product.updatedAt, priority: "0.8" }))
    ];
    const body = entries.map((entry) => `<url><loc>${xml(`${SITE_URL}${entry.path}`)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod.toISOString()}</lastmod>` : ""}<changefreq>${entry.path.startsWith("/products/") ? "weekly" : "monthly"}</changefreq><priority>${entry.priority}</priority></url>`).join("");
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400").type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  } catch (error) { next(error); }
});
