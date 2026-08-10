import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

const operatorInclude = {
  user: { select: { email: true, active: true, createdAt: true } },
  telegram: { select: { telegramUserId: true, telegramChatId: true, username: true, enabled: true, verifiedAt: true, lastInteractionAt: true } },
  _count: { select: { conversations: true, messages: true } }
};

export async function listOperators() {
  return prisma.operator.findMany({ include: operatorInclude, orderBy: { createdAt: "desc" } });
}

export async function createOperator(input) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email.toLowerCase(), passwordHash, role: "OPERATOR", active: input.active }
    });
    return tx.operator.create({
      data: {
        userId: user.id,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        status: input.active ? input.status : "OFFLINE",
        telegram: input.telegramUserId ? { create: { telegramUserId: input.telegramUserId, username: input.telegramUsername, enabled: input.active && input.telegramEnabled } } : undefined
      },
      include: operatorInclude
    });
  });
}

export async function updateOperator(id, input) {
  const existing = await prisma.operator.findUnique({ where: { id }, include: { user: true, telegram: true } });
  if (!existing) throw new ApiError(404, "OPERATOR_NOT_FOUND", "Operator topilmadi.");
  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      data: { email: input.email?.toLowerCase(), active: input.active, passwordHash }
    });
    await tx.operator.update({
      where: { id },
      data: { displayName: input.displayName, avatarUrl: input.avatarUrl, status: input.active === false ? "OFFLINE" : input.status }
    });
    if (input.active === false) {
      await tx.conversation.updateMany({ where: { assignedOperatorId: id, status: { not: "CLOSED" } }, data: { assignedOperatorId: null, status: "WAITING" } });
      await tx.telegramOperator.updateMany({ where: { operatorId: id }, data: { enabled: false, activeConversationId: null } });
    }

    if (input.telegramUserId !== undefined) {
      if (!input.telegramUserId && existing.telegram) {
        await tx.telegramOperator.delete({ where: { operatorId: id } });
      } else if (input.telegramUserId) {
        await tx.telegramOperator.upsert({
          where: { operatorId: id },
          create: { operatorId: id, telegramUserId: input.telegramUserId, username: input.telegramUsername, enabled: input.active === false ? false : input.telegramEnabled },
          update: {
            telegramUserId: input.telegramUserId,
            username: input.telegramUsername,
            enabled: input.active === false ? false : input.telegramEnabled,
            ...(existing.telegram?.telegramUserId !== input.telegramUserId ? { telegramChatId: null, verifiedAt: null, activeConversationId: null } : {})
          }
        });
      }
    }
    return tx.operator.findUnique({ where: { id }, include: operatorInclude });
  });
}

export async function deleteOperator(id) {
  const operator = await prisma.operator.findUnique({ where: { id }, select: { userId: true } });
  if (!operator) throw new ApiError(404, "OPERATOR_NOT_FOUND", "Operator topilmadi.");
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: operator.userId }, data: { active: false } });
    await tx.operator.update({ where: { id }, data: { status: "OFFLINE" } });
    await tx.conversation.updateMany({
      where: { assignedOperatorId: id, status: { not: "CLOSED" } },
      data: { assignedOperatorId: null, status: "WAITING" }
    });
    await tx.conversation.updateMany({
      where: { assignedOperatorId: id, status: "CLOSED" },
      data: { assignedOperatorId: null }
    });
    await tx.message.updateMany({ where: { operatorId: id }, data: { operatorId: null, senderId: null } });
    await tx.lead.updateMany({ where: { assignedOperatorId: id }, data: { assignedOperatorId: null } });
    await tx.rating.updateMany({ where: { operatorId: id }, data: { operatorId: null } });
    await tx.user.delete({ where: { id: operator.userId } });
  });
}
