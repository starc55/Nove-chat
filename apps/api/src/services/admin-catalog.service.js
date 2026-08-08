import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

function productData(input) {
  const data = { ...input };
  if (data.slug) data.slug = data.slug.toLowerCase();
  return data;
}

export async function listProducts({ page, limit, q }) {
  const where = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function createProduct(input) {
  return prisma.product.create({ data: productData(input), include: { images: true } });
}

export async function updateProduct(id, input) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
  return prisma.product.update({ where: { id }, data: productData(input), include: { images: true } });
}

export async function deleteProduct(id) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
  await prisma.product.delete({ where: { id } });
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
