import { Router } from "express";
import { z } from "zod";
import {
  createAdvertisement, createProduct, deleteAdvertisement, deleteProduct,
  listAdvertisements, listProducts, updateAdvertisement, updateProduct
} from "../services/admin-catalog.service.js";
import { createOperator, deleteOperator, listOperators, updateOperator } from "../services/operator.service.js";

export const adminManagementRouter = Router();

const idSchema = z.string().cuid();
const nullableText = (max) => z.union([z.string().trim().max(max), z.null()]).transform((value) => value || null);
const nullableUrl = z.union([z.string().trim().url().max(1000), z.literal(""), z.null()]).transform((value) => value || null);
const nullablePrice = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().nonnegative().max(999_999_999_999).nullable());
const nullableDate = z.union([z.string().datetime(), z.literal(""), z.null()]).transform((value) => value ? new Date(value) : null);
const linkValue = z.union([
  z.string().trim().url().max(1000),
  z.string().trim().regex(/^(#|\/)[^\s]*$/).max(1000),
  z.literal(""), z.null()
]).transform((value) => value || null);
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(100).default("")
});

const productBaseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140),
  shortDescription: z.string().trim().min(10).max(500),
  longDescription: nullableText(5000),
  price: nullablePrice,
  oldPrice: nullablePrice,
  image: nullableUrl,
  category: nullableText(80),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0)
}).strict();
const productSchema = productBaseSchema.superRefine((value, ctx) => {
  if (value.price !== null && value.oldPrice !== null && value.oldPrice < value.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["oldPrice"], message: "Eski narx yangi narxdan kichik bo‘lmasligi kerak." });
  }
});

const placementValues = ["HERO", "AFTER_HERO", "PRODUCTS_TOP", "PRODUCTS_BOTTOM", "FLOATING", "FOOTER"];
const advertisementSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: nullableText(1000),
  image: nullableUrl,
  ctaLabel: nullableText(80),
  ctaUrl: linkValue,
  placement: z.enum(placementValues),
  startAt: nullableDate,
  endAt: nullableDate,
  enabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0)
}).strict();

const operatorSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(100),
  avatarUrl: nullableUrl,
  status: z.enum(["ONLINE", "AWAY", "OFFLINE"]).default("OFFLINE"),
  active: z.boolean().default(true),
  telegramUserId: z.union([z.string().trim().regex(/^\d{5,20}$/), z.literal(""), z.null()]).transform((value) => value || null),
  telegramUsername: nullableText(64),
  telegramEnabled: z.boolean().default(true)
}).strict();

function route(handler) {
  return async (req, res, next) => {
    try { await handler(req, res); } catch (error) { next(error); }
  };
}

adminManagementRouter.get("/products", route(async (req, res) => {
  res.json({ success: true, data: await listProducts(paginationSchema.parse(req.query)) });
}));
adminManagementRouter.post("/products", route(async (req, res) => {
  res.status(201).json({ success: true, data: await createProduct(productSchema.parse(req.body)) });
}));
adminManagementRouter.patch("/products/:id", route(async (req, res) => {
  const input = productBaseSchema.partial().strict().parse(req.body);
  res.json({ success: true, data: await updateProduct(idSchema.parse(req.params.id), input) });
}));
adminManagementRouter.delete("/products/:id", route(async (req, res) => {
  await deleteProduct(idSchema.parse(req.params.id));
  res.status(204).end();
}));

adminManagementRouter.get("/advertisements", route(async (req, res) => {
  res.json({ success: true, data: await listAdvertisements(paginationSchema.parse(req.query)) });
}));
adminManagementRouter.post("/advertisements", route(async (req, res) => {
  res.status(201).json({ success: true, data: await createAdvertisement(advertisementSchema.parse(req.body)) });
}));
adminManagementRouter.patch("/advertisements/:id", route(async (req, res) => {
  res.json({ success: true, data: await updateAdvertisement(idSchema.parse(req.params.id), advertisementSchema.partial().strict().parse(req.body)) });
}));
adminManagementRouter.delete("/advertisements/:id", route(async (req, res) => {
  await deleteAdvertisement(idSchema.parse(req.params.id));
  res.status(204).end();
}));

adminManagementRouter.get("/operators", route(async (_req, res) => {
  res.json({ success: true, data: await listOperators() });
}));
adminManagementRouter.post("/operators", route(async (req, res) => {
  res.status(201).json({ success: true, data: await createOperator(operatorSchema.parse(req.body)) });
}));
adminManagementRouter.patch("/operators/:id", route(async (req, res) => {
  const schema = operatorSchema.partial().extend({ password: z.union([z.string().min(12).max(128), z.literal("")]).optional() }).strict();
  const input = schema.parse(req.body);
  if (!input.password) delete input.password;
  res.json({ success: true, data: await updateOperator(idSchema.parse(req.params.id), input) });
}));
adminManagementRouter.delete("/operators/:id", route(async (req, res) => {
  await deleteOperator(idSchema.parse(req.params.id));
  res.status(204).end();
}));
