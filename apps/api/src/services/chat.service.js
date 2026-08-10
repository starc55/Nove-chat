import { randomBytes } from "node:crypto";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

function newPublicId() {
  return `C${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function serializeMessage(message) {
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

async function availableOperator() {
  return prisma.operator.findFirst({
    where: { status: { in: ["ONLINE", "AWAY"] }, user: { active: true } },
    orderBy: { status: "asc" },
    select: { id: true, displayName: true, avatarUrl: true, status: true, lastSeenAt: true }
  });
}

async function configuredReply(trigger) {
  return prisma.autoReply.findFirst({ where: { trigger, enabled: true }, select: { text: true } });
}

export async function authorizeCustomer(publicId, visitorId) {
  if (!publicId || !visitorId) throw new ApiError(401, "CHAT_ACCESS_REQUIRED", "Chat sessiyasi topilmadi.");
  const conversation = await prisma.conversation.findFirst({
    where: { publicId, customer: { visitorId } },
    select: { id: true, publicId: true, status: true, assignedOperatorId: true }
  });
  if (!conversation) throw new ApiError(403, "CHAT_ACCESS_DENIED", "Bu suhbatga ruxsat yo‘q.");
  return conversation;
}

export async function openChatSession({ visitorId, sourcePath }) {
  const customer = await prisma.customer.upsert({
    where: { visitorId },
    update: {},
    create: { visitorId }
  });
  let conversation = await prisma.conversation.findFirst({
    where: { customerId: customer.id, status: { not: "CLOSED" } },
    orderBy: { lastMessageAt: "desc" }
  });
  const operator = await availableOperator();
  let initialMessage = null;

  if (!conversation) {
    for (let attempt = 0; attempt < 3 && !conversation; attempt += 1) {
      try {
        conversation = await prisma.conversation.create({
          data: {
            publicId: newPublicId(),
            customerId: customer.id,
            sourcePath,
            status: operator ? "OPEN" : "WAITING",
            assignedOperatorId: operator?.id
          }
        });
      } catch (error) {
        if (error.code !== "P2002" || attempt === 2) throw error;
      }
    }
    const reply = await configuredReply(operator ? "CHAT_OPEN" : "OFFLINE");
    if (reply) {
      initialMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "SYSTEM",
          content: reply.text,
          status: "DELIVERED",
          deliveredAt: new Date()
        }
      });
    }
  }

  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderType: { in: ["OPERATOR", "SYSTEM"] }, status: "SENT" },
    data: { status: "DELIVERED", deliveredAt: new Date() }
  });
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 120
  });

  return {
    roomId: conversation.id,
    publicId: conversation.publicId,
    status: conversation.status,
    chatMode: operator ? "LIVE" : "OFFLINE_AUTO_REPLY",
    operator: operator ? { name: operator.displayName, avatarUrl: operator.avatarUrl, status: operator.status, lastSeenAt: operator.lastSeenAt } : { name: "NOVA operator", avatarUrl: null, status: "OFFLINE", lastSeenAt: null },
    messages: messages.map(serializeMessage),
    initialMessage: initialMessage ? serializeMessage(initialMessage) : null
  };
}

export async function sendCustomerMessage({ publicId, visitorId, content }) {
  const conversation = await authorizeCustomer(publicId, visitorId);
  if (conversation.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Bu suhbat yakunlangan.");

  const previousCustomerMessages = await prisma.message.count({ where: { conversationId: conversation.id, senderType: "CUSTOMER" } });
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId: conversation.id, senderType: "CUSTOMER", senderId: visitorId, content, status: "SENT" }
    });
    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: created.createdAt,
        status: conversation.status === "WAITING" ? "WAITING" : conversation.assignedOperatorId ? "ASSIGNED" : "OPEN"
      }
    });
    return created;
  });

  let autoReply = null;
  if (previousCustomerMessages === 0) {
    const reply = await configuredReply("FIRST_MESSAGE");
    if (reply) {
      autoReply = await prisma.message.create({
        data: { conversationId: conversation.id, senderType: "SYSTEM", content: reply.text, status: "DELIVERED", deliveredAt: new Date() }
      });
    }
  }
  return { roomId: conversation.id, message: serializeMessage(message), autoReply: autoReply ? serializeMessage(autoReply) : null };
}

export async function markCustomerRead({ publicId, visitorId }) {
  const conversation = await authorizeCustomer(publicId, visitorId);
  const readAt = new Date();
  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderType: { in: ["OPERATOR", "SYSTEM"] }, status: { not: "READ" } },
    data: { status: "READ", readAt, deliveredAt: readAt }
  });
  return { roomId: conversation.id, readAt };
}

export async function getPresence() {
  const operator = await availableOperator();
  return operator
    ? { status: operator.status, name: operator.displayName, lastSeenAt: operator.lastSeenAt, chatMode: "LIVE" }
    : { status: "OFFLINE", name: "NOVA operator", lastSeenAt: null, chatMode: "OFFLINE_AUTO_REPLY" };
}

export async function getConversationForAdmin(publicId) {
  const conversation = await prisma.conversation.findUnique({
    where: { publicId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true, telegram: true, visitorId: true } },
      assignedOperator: { select: { id: true, displayName: true, status: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 }
    }
  });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  return {
    id: conversation.id,
    publicId: conversation.publicId,
    status: conversation.status,
    customer: conversation.customer,
    operator: conversation.assignedOperator,
    startedAt: conversation.startedAt,
    messages: conversation.messages.map(serializeMessage)
  };
}

export async function sendAdminReply({ publicId, userId, content }) {
  const conversation = await prisma.conversation.findUnique({ where: { publicId } });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Yakunlangan suhbatga xabar yuborib bo‘lmaydi.");
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "OPERATOR",
        senderId: userId,
        operatorId: conversation.assignedOperatorId,
        content,
        status: "SENT"
      }
    });
    await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: created.createdAt, status: conversation.assignedOperatorId ? "ASSIGNED" : "OPEN" }
    });
    return created;
  });
  return { roomId: conversation.id, message: serializeMessage(message) };
}

export async function sendOperatorReply({ conversationId, operatorId, content }) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Yakunlangan suhbatga xabar yuborib bo‘lmaydi.");
  if (conversation.assignedOperatorId && conversation.assignedOperatorId !== operatorId) {
    throw new ApiError(409, "CONVERSATION_ASSIGNED", "Bu suhbat boshqa operatorga biriktirilgan.");
  }
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId, senderType: "OPERATOR", senderId: operatorId, operatorId, content, status: "SENT" }
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { assignedOperatorId: operatorId, status: "ASSIGNED", lastMessageAt: created.createdAt }
    });
    return created;
  });
  return { roomId: conversationId, publicId: conversation.publicId, message: serializeMessage(message) };
}
