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
  if (input.variants?.length) data.variants = { create: variantData(input.variants).map(({ id: _id, ...variant }) => variant) };
  return prisma.product.create({ data, include: productInclude });
}

export async function updateProduct(id, input) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
  const data = productData(input);
  if (input.gallery) data.images = { deleteMany: {}, create: galleryData(input.gallery) };
  return prisma.$transaction(async (tx) => {
    if (input.variants) {
      const existingVariants = await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } });
      const owned = new Set(existingVariants.map((variant) => variant.id));
      const retained = input.variants.map((variant) => variant.id).filter(Boolean);
      if (retained.some((variantId) => !owned.has(variantId)) || new Set(retained).size !== retained.length) throw new ApiError(422, "INVALID_VARIANT", "Variant bu mahsulotga tegishli emas yoki takrorlangan.");
      // Keep historical variant relations so cancelled orders restore correct stock.
      await tx.productVariant.updateMany({ where: { productId: id, id: { notIn: retained } }, data: { active: false } });
      for (const { id: variantId, ...variant } of variantData(input.variants)) {
        if (variantId) await tx.productVariant.update({ where: { id: variantId }, data: variant });
        else await tx.productVariant.create({ data: { ...variant, productId: id } });
      }
    }
    return tx.product.update({ where: { id }, data, include: productInclude });
  });
}

export async function deleteProduct(id) {
  const deleted = await prisma.product.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Mahsulot topilmadi.");
}

const taxonomyOrder = [{ kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }];

function normalizeTaxonomy(input) {
  const data = { ...input };
  if (typeof data.name === "string") data.name = data.name.trim();
  if (typeof data.slug === "string") data.slug = data.slug.trim().toLowerCase();
  if (typeof data.value === "string") data.value = data.value.trim();
  return data;
}

function taxonomyConflict(error) {
  if (error?.code === "P2002") {
    throw new ApiError(409, "CATALOG_TAXONOMY_EXISTS", "Bu bo‘lim nomi yoki qiymati avval yaratilgan.");
  }
  throw error;
}

export async function listCatalogTaxonomies() {
  return prisma.catalogTaxonomy.findMany({ orderBy: taxonomyOrder });
}

export async function createCatalogTaxonomy(input) {
  try {
    return await prisma.catalogTaxonomy.create({ data: normalizeTaxonomy(input) });
  } catch (error) {
    return taxonomyConflict(error);
  }
}

export async function updateCatalogTaxonomy(id, input) {
  const existing = await prisma.catalogTaxonomy.findUnique({ where: { id }, select: { id: true, kind: true, value: true } });
  if (!existing) throw new ApiError(404, "CATALOG_TAXONOMY_NOT_FOUND", "Katalog bo‘limi topilmadi.");
  const data = normalizeTaxonomy(input);
  if (data.kind && data.kind !== existing.kind) throw new ApiError(409, "CATALOG_TAXONOMY_KIND_LOCKED", "Mavjud bo‘lim turini o‘zgartirib bo‘lmaydi. Yangi bo‘lim yarating.");
  try {
    return await prisma.$transaction(async (tx) => {
      if (data.value && data.value !== existing.value) {
        if (existing.kind === "CATEGORY") {
          await tx.product.updateMany({ where: { category: existing.value }, data: { category: data.value } });
        } else {
          await Promise.all([
            tx.product.updateMany({ where: { productType: existing.value }, data: { productType: data.value } }),
            tx.productVariant.updateMany({ where: { type: existing.value }, data: { type: data.value } }),
          ]);
        }
      }
      return tx.catalogTaxonomy.update({ where: { id }, data });
    });
  } catch (error) {
    return taxonomyConflict(error);
  }
}

export async function deleteCatalogTaxonomy(id) {
  const deleted = await prisma.catalogTaxonomy.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "CATALOG_TAXONOMY_NOT_FOUND", "Katalog bo‘limi topilmadi.");
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
