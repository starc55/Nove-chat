import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

export const publicRouter = Router();
const submissionLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 12, standardHeaders: true, legacyHeaders: false });
const visitorSchema = z.string().uuid();
const phoneSchema = z.string().trim().regex(/^\+?[0-9 ()-]{7,24}$/);

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

publicRouter.get("/settings", async (req, res, next) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    res.json({ success: true, data: Object.fromEntries(settings.map(({ key, value }) => [key, value])) });
  } catch (error) { next(error); }
});

publicRouter.get("/pages", async (_req, res, next) => {
  try {
    const pages = await prisma.contentPage.findMany({ where: { active: true }, select: { slug: true, title: true, content: true, sortOrder: true }, orderBy: { sortOrder: "asc" } });
    res.json({ success: true, data: pages });
  } catch (error) { next(error); }
});

publicRouter.get("/pages/:slug", async (req, res, next) => {
  try {
    const page = await prisma.contentPage.findFirst({ where: { slug: req.params.slug, active: true } });
    if (!page) throw new ApiError(404, "CONTENT_PAGE_NOT_FOUND", "Sahifa topilmadi.");
    res.json({ success: true, data: page });
  } catch (error) { next(error); }
});

publicRouter.get("/products/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug, active: true }, include: { images: true } });
    if (!product) return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Xizmat topilmadi." } });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
});

publicRouter.post("/reviews", submissionLimiter, async (req, res, next) => {
  try {
    const input = z.object({
      visitorId: visitorSchema,
      name: z.string().trim().min(2).max(100),
      phone: phoneSchema,
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().trim().min(10).max(1500)
    }).parse(req.body);
    const review = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { visitorId: input.visitorId },
        update: { name: input.name, phone: input.phone },
        create: { visitorId: input.visitorId, name: input.name, phone: input.phone }
      });
      return tx.review.create({
        data: {
          customerId: customer.id,
          customerName: input.name,
          customerPhone: input.phone,
          rating: input.rating,
          comment: input.comment,
          status: "PENDING"
        },
        select: { id: true, status: true, createdAt: true }
      });
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
});

publicRouter.post("/orders", submissionLimiter, async (req, res, next) => {
  try {
    const input = z.object({
      visitorId: visitorSchema,
      productId: z.string().cuid(),
      name: z.string().trim().min(2).max(100),
      phone: phoneSchema,
      comment: z.string().trim().max(1000).optional().default(""),
      sourcePath: z.string().trim().max(300).optional().default("/")
    }).parse(req.body);
    const product = await prisma.product.findFirst({ where: { id: input.productId, active: true }, select: { id: true, title: true, price: true } });
    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { visitorId: input.visitorId },
        update: { name: input.name, phone: input.phone },
        create: { visitorId: input.visitorId, name: input.name, phone: input.phone }
      });
      const created = await tx.purchaseRequest.create({
        data: {
          customerId: customer.id,
          productId: product.id,
          productTitle: product.title,
          productPrice: product.price,
          name: input.name,
          phone: input.phone,
          comment: input.comment || null,
          sourcePath: input.sourcePath
        },
        select: { id: true, status: true, createdAt: true }
      });
      await tx.lead.create({
        data: {
          customerId: customer.id,
          name: input.name,
          phone: input.phone,
          message: input.comment || "Mahsulot bo‘yicha buyurtma",
          source: "product_order"
        }
      });
      return created;
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
});

publicRouter.post("/inquiries", submissionLimiter, async (req, res, next) => {
  try {
    const input = z.object({
      visitorId: visitorSchema,
      name: z.string().trim().min(2).max(100),
      phone: phoneSchema,
      email: z.union([z.string().trim().email().max(200), z.literal("")]).optional().default(""),
      company: z.string().trim().max(180).optional().default(""),
      message: z.string().trim().min(5).max(2000),
      source: z.enum(["contact", "medical_institutions", "manufacturers", "career"]).default("contact")
    }).parse(req.body);
    const lead = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { visitorId: input.visitorId },
        update: { name: input.name, phone: input.phone, email: input.email || null },
        create: { visitorId: input.visitorId, name: input.name, phone: input.phone, email: input.email || null }
      });
      return tx.lead.create({ data: {
        customerId: customer.id,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        message: [input.company ? `Tashkilot: ${input.company}` : "", input.message].filter(Boolean).join("\n"),
        source: input.source
      }, select: { id: true, status: true, createdAt: true } });
    });
    res.status(201).json({ success: true, data: lead });
  } catch (error) { next(error); }
});
