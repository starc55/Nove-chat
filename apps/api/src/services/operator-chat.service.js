import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { sendOperatorReply } from "./chat.service.js";

const conversationInclude = {
  customer: { select: { name: true, visitorId: true, phone: true, email: true, telegram: true } },
  assignedOperator: { select: { id: true, displayName: true, status: true } },
  messages: { orderBy: { createdAt: "asc" }, take: 250 }
};

function customerName(customer) {
  return customer.name || `Mehmon #${customer.visitorId.slice(-6).toUpperCase()}`;
}

function serializeMessage(message) {
  return {
    id: message.id,
    senderType: message.senderType,
    content: message.content,
    type: message.type,
    status: message.status,
    createdAt: message.createdAt,
    readAt: message.readAt
  };
}

function serializeConversation(conversation) {
  return {
    id: conversation.id,
    publicId: conversation.publicId,
    status: conversation.status,
    sourcePath: conversation.sourcePath,
    startedAt: conversation.startedAt,
    lastMessageAt: conversation.lastMessageAt,
    customer: {
      name: customerName(conversation.customer),
      phone: conversation.customer.phone,
      email: conversation.customer.email,
      telegram: conversation.customer.telegram
    },
    operator: conversation.assignedOperator,
    messages: conversation.messages.map(serializeMessage)
  };
}

function serializeListItem(conversation) {
  const lastMessage = conversation.messages[0];
  return {
    publicId: conversation.publicId,
    status: conversation.status,
    customerName: customerName(conversation.customer),
    lastMessage: lastMessage?.content || "Yangi suhbat",
    lastSenderType: lastMessage?.senderType || "SYSTEM",
    lastMessageAt: conversation.lastMessageAt,
    messageCount: conversation._count.messages
  };
}

export async function getOperatorWorkspace(operatorId) {
  const [operator, waiting, mine] = await Promise.all([
    prisma.operator.findUnique({
      where: { id: operatorId },
      include: {
        user: { select: { email: true, active: true } },
        telegram: { select: { username: true, verifiedAt: true, lastInteractionAt: true } }
      }
    }),
    prisma.conversation.findMany({
      where: {
        assignedOperatorId: null,
        status: { in: ["WAITING", "OPEN"] },
        messages: { some: { senderType: "CUSTOMER" } }
      },
      include: {
        customer: { select: { name: true, visitorId: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } }
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100
    }),
    prisma.conversation.findMany({
      where: { assignedOperatorId: operatorId, status: { in: ["ASSIGNED", "OPEN"] } },
      include: {
        customer: { select: { name: true, visitorId: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } }
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100
    })
  ]);
  if (!operator || !operator.user.active) throw new ApiError(403, "OPERATOR_DISABLED", "Operator hisobi faol emas.");
  return {
    operator: {
      id: operator.id,
      name: operator.displayName,
      email: operator.user.email,
      avatarUrl: operator.avatarUrl,
      status: operator.status,
      telegramUsername: operator.telegram?.username || null
    },
    stats: { waiting: waiting.length, mine: mine.length },
    waiting: waiting.map(serializeListItem),
    mine: mine.map(serializeListItem)
  };
}

export async function getOperatorConversation(operatorId, publicId) {
  const conversation = await prisma.conversation.findUnique({ where: { publicId }, include: conversationInclude });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.assignedOperatorId !== operatorId) {
    throw new ApiError(403, "CONVERSATION_ACCESS_DENIED", "Bu suhbat sizga biriktirilmagan.");
  }
  return serializeConversation(conversation);
}

export async function claimOperatorConversation(operatorId, publicId) {
  const existing = await prisma.conversation.findUnique({
    where: { publicId },
    select: { id: true, status: true, assignedOperatorId: true }
  });
  if (!existing) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (existing.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Bu suhbat yopilgan.");

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.conversation.updateMany({
      where: {
        id: existing.id,
        status: { not: "CLOSED" },
        OR: [{ assignedOperatorId: null }, { assignedOperatorId: operatorId }]
      },
      data: { assignedOperatorId: operatorId, status: "ASSIGNED" }
    });
    if (!claimed.count) throw new ApiError(409, "CONVERSATION_ASSIGNED", "Suhbatni boshqa operator oldinroq qabul qildi.");
    await tx.telegramOperator.updateMany({
      where: { operatorId },
      data: { activeConversationId: existing.id, lastInteractionAt: new Date() }
    });
    await tx.operator.update({ where: { id: operatorId }, data: { status: "ONLINE", lastSeenAt: new Date() } });
  });
  return getOperatorConversation(operatorId, publicId);
}

export async function replyToOperatorConversation(operatorId, publicId, content) {
  const conversation = await prisma.conversation.findUnique({ where: { publicId }, select: { id: true, assignedOperatorId: true } });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.assignedOperatorId !== operatorId) throw new ApiError(403, "CONVERSATION_ACCESS_DENIED", "Bu suhbat sizga biriktirilmagan.");
  return sendOperatorReply({ conversationId: conversation.id, operatorId, content });
}

export async function closeOperatorConversation(operatorId, publicId) {
  const conversation = await prisma.conversation.findFirst({
    where: { publicId, assignedOperatorId: operatorId, status: { not: "CLOSED" } },
    select: { id: true, publicId: true }
  });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Faol suhbat topilmadi.");
  const closedAt = new Date();
  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversation.id }, data: { status: "CLOSED", closedAt } }),
    prisma.telegramOperator.updateMany({ where: { operatorId, activeConversationId: conversation.id }, data: { activeConversationId: null, lastInteractionAt: closedAt } })
  ]);
  return { ...conversation, closedAt };
}

export async function updateOperatorPresence(operatorId, status) {
  return prisma.operator.update({
    where: { id: operatorId },
    data: { status, lastSeenAt: new Date() },
    select: { id: true, displayName: true, status: true, lastSeenAt: true }
  });
}
