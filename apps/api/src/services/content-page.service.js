import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

export async function listContentPages({ page, limit, q }) {
  const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {};
  const [items, total] = await Promise.all([
    prisma.contentPage.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
    prisma.contentPage.count({ where })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export function createContentPage(input) {
  return prisma.contentPage.create({ data: input });
}

export async function updateContentPage(id, input) {
  const existing = await prisma.contentPage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "CONTENT_PAGE_NOT_FOUND", "Kontent sahifasi topilmadi.");
  return prisma.contentPage.update({ where: { id }, data: input });
}

export async function deleteContentPage(id) {
  const deleted = await prisma.contentPage.deleteMany({ where: { id } });
  if (!deleted.count) throw new ApiError(404, "CONTENT_PAGE_NOT_FOUND", "Kontent sahifasi topilmadi.");
}
