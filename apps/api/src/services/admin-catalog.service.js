import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

function productData(input) {
  const data = { ...input };
  delete data.gallery;
  delete data.variants;
  if (data.slug) data.slug = data.slug.toLowerCase();
  return data;
}

function galleryData(gallery = []) {
  return gallery.map((url, index) => ({ url, sortOrder: index + 1 }));
}

function variantData(variants = []) {
  return variants.map((variant, index) => ({
    ...variant,
    price: variant.price ?? null,
    size: variant.size || null,
    type: variant.type || null,
    sku: variant.sku || null,
    sortOrder: variant.sortOrder ?? index
  }));
}

const productInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }
};

export async function listProducts({ page, limit, q }) {
  const where = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function createProduct(input) {
  const data = productData(input);
  if (input.gallery?.length) data.images = { create: galleryData(input.gallery) };
  if (input.variants?.length) data.variants = { create: variantData(input.variants) };
  return prisma.product.create({ data, include: productInclude });
}

export async function updateProduct(id, input) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
  const data = productData(input);
  if (input.gallery) data.images = { deleteMany: {}, create: galleryData(input.gallery) };
  if (input.variants) data.variants = { deleteMany: {}, create: variantData(input.variants) };
  return prisma.product.update({ where: { id }, data, include: productInclude });
}

export async function deleteProduct(id) {
  const deleted = await prisma.product.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
}

export async function listAdvertisements({ page, limit, q }) {
  const where = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.advertisement.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
    prisma.advertisement.count({ where })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function createAdvertisement(input) {
  validateAdvertisementDates(input);
  return prisma.advertisement.create({ data: input });
}

export async function updateAdvertisement(id, input) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "ADVERTISEMENT_NOT_FOUND", "Reklama topilmadi.");
  validateAdvertisementDates({ ...existing, ...input });
  return prisma.advertisement.update({ where: { id }, data: input });
}

export async function deleteAdvertisement(id) {
  const existing = await prisma.advertisement.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "ADVERTISEMENT_NOT_FOUND", "Reklama topilmadi.");
  await prisma.advertisement.delete({ where: { id } });
}

function validateAdvertisementDates({ startAt, endAt }) {
  if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
    throw new ApiError(422, "INVALID_ADVERTISEMENT_DATES", "Reklama tugash vaqti boshlanish vaqtidan keyin bo‘lishi kerak.");
  }
}
