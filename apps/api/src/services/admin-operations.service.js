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
  const exists = await prisma.purchaseRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, "ORDER_NOT_FOUND", "Buyurtma topilmadi.");
  return prisma.purchaseRequest.update({ where: { id }, data: { status }, include: { product: { select: { title: true } } } });
}

export async function deleteOrder(id) {
  const deleted = await prisma.purchaseRequest.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "ORDER_NOT_FOUND", "Buyurtma topilmadi.");
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
