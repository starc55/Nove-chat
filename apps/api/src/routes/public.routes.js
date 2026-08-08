import { Router } from "express";
import { prisma } from "../config/database.js";

export const publicRouter = Router();

publicRouter.get("/landing", async (req, res, next) => {
  try {
    const now = new Date();
    const [products, advertisements, reviews, settings] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, include: { images: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] }),
      prisma.advertisement.findMany({ where: { enabled: true, AND: [{ OR: [{ startAt: null }, { startAt: { lte: now } }] }, { OR: [{ endAt: null }, { endAt: { gte: now } }] }] }, orderBy: { sortOrder: "asc" } }),
      prisma.review.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.siteSetting.findMany()
    ]);
    res.json({ success: true, data: { products, advertisements, reviews, settings: Object.fromEntries(settings.map(({ key, value }) => [key, value])) } });
  } catch (error) { next(error); }
});

publicRouter.get("/products/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug, active: true }, include: { images: true } });
    if (!product) return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Xizmat topilmadi." } });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
});
