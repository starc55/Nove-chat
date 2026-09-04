import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

function pagination(page, limit, total) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function listLeads({ page, limit, q }) {
  const where = q ? { OR: [
    { name: { contains: q, mode: "insensitive" } },
    { phone: { contains: q, mode: "insensitive" } },
    { message: { contains: q, mode: "insensitive" } }
  ] } : {};
  const [items, total] = await Promise.all([
    prisma.lead.findMany({ where, include: { conversation: { select: { publicId: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.lead.count({ where })
  ]);
  return { items, pagination: pagination(page, limit, total) };
}

export async function updateLead(id, status) {
  const exists = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, "LEAD_NOT_FOUND", "Murojaat topilmadi.");
  return prisma.lead.update({ where: { id }, data: { status, contactedAt: status === "CONTACTED" ? new Date() : undefined } });
}

export async function deleteLead(id) {
  const deleted = await prisma.lead.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "LEAD_NOT_FOUND", "Murojaat topilmadi.");
}

export async function listOrders({ page, limit, q }) {
  const where = q ? { OR: [
    { name: { contains: q, mode: "insensitive" } },
    { phone: { contains: q, mode: "insensitive" } },
    { comment: { contains: q, mode: "insensitive" } },
    { productTitle: { contains: q, mode: "insensitive" } }
  ] } : {};
  const [items, total] = await Promise.all([
    prisma.purchaseRequest.findMany({ where, include: { product: { select: { title: true, price: true, image: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.purchaseRequest.count({ where })
  ]);
  return { items, pagination: pagination(page, limit, total) };
}

export async function updateOrder(id, status) {
  const exists = await prisma.purchaseRequest.findUnique({ where: { id }, select: { id: true, status: true, productId: true, productVariantId: true, quantity: true, stockManaged: true, stockReleasedAt: true } });
  if (!exists) throw new ApiError(404, "ORDER_NOT_FOUND", "Buyurtma topilmadi.");
  return prisma.$transaction(async (tx) => {
    const inventoryId = exists.productVariantId || exists.productId;
    const cancelling = status === "CANCELLED" && exists.status !== "CANCELLED" && exists.stockManaged && inventoryId && !exists.stockReleasedAt;
    const restoring = status !== "CANCELLED" && exists.status === "CANCELLED" && exists.stockManaged && inventoryId && exists.stockReleasedAt;
    if (cancelling) {
      if (exists.productVariantId) await tx.productVariant.update({ where: { id: exists.productVariantId }, data: { stock: { increment: exists.quantity } } });
      else await tx.product.update({ where: { id: exists.productId }, data: { stock: { increment: exists.quantity } } });
    }
    if (restoring) {
      const reserved = exists.productVariantId
        ? await tx.productVariant.updateMany({ where: { id: exists.productVariantId, active: true, stock: { gte: exists.quantity } }, data: { stock: { decrement: exists.quantity } } })
        : await tx.product.updateMany({ where: { id: exists.productId, active: true, stock: { gte: exists.quantity } }, data: { stock: { decrement: exists.quantity } } });
      if (!reserved.count) throw new ApiError(409, "OUT_OF_STOCK", "Buyurtmani qayta faollashtirish uchun zaxira yetarli emas.");
    }
    return tx.purchaseRequest.update({ where: { id }, data: { status, stockReleasedAt: cancelling ? new Date() : restoring ? null : undefined }, include: { product: { select: { title: true } } } });
  });
}

export async function deleteOrder(id) {
  const existing = await prisma.purchaseRequest.findUnique({ where: { id }, select: { id: true, productId: true, productVariantId: true, quantity: true, stockManaged: true, stockReleasedAt: true } });
  if (!existing) throw new ApiError(404, "ORDER_NOT_FOUND", "Buyurtma topilmadi.");
  await prisma.$transaction(async (tx) => {
    if (existing.stockManaged && !existing.stockReleasedAt) {
      if (existing.productVariantId) await tx.productVariant.update({ where: { id: existing.productVariantId }, data: { stock: { increment: existing.quantity } } });
      else if (existing.productId) await tx.product.update({ where: { id: existing.productId }, data: { stock: { increment: existing.quantity } } });
    }
    await tx.purchaseRequest.delete({ where: { id } });
  });
}

export async function listReviews({ page, limit, q }) {
  const where = q ? { OR: [
    { customerName: { contains: q, mode: "insensitive" } },
    { customerPhone: { contains: q, mode: "insensitive" } },
    { comment: { contains: q, mode: "insensitive" } }
  ] } : {};
  const [items, total] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.review.count({ where })
  ]);
  return { items, pagination: pagination(page, limit, total) };
}

export async function updateReview(id, status) {
  const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, "REVIEW_NOT_FOUND", "Sharh topilmadi.");
  return prisma.review.update({ where: { id }, data: { status } });
}

export async function deleteReview(id) {
  const deleted = await prisma.review.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "REVIEW_NOT_FOUND", "Sharh topilmadi.");
}
