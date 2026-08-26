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

async function hasAvailableOperator() {
  const count = await prisma.operator.count({
    where: { status: { in: ["ONLINE", "AWAY"] }, user: { active: true } }
  });
  return count > 0;
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

export async function openChatSession({ visitorId, sourcePath, name, phone }) {
  const customer = await prisma.customer.upsert({
    where: { visitorId },
    update: { name, phone },
    create: { visitorId, name, phone }
  });
  let conversation = await prisma.conversation.findFirst({
    where: { customerId: customer.id, status: { not: "CLOSED" } },
    orderBy: { lastMessageAt: "desc" }
  });
  let initialMessage = null;
  let isNewConversation = false;

  if (!conversation) {
    for (let attempt = 0; attempt < 3 && !conversation; attempt += 1) {
      try {
        conversation = await prisma.$transaction(async (tx) => {
          const created = await tx.conversation.create({
            data: {
              publicId: newPublicId(),
              customerId: customer.id,
              sourcePath,
              status: "WAITING",
              assignedOperatorId: null
            }
          });
          await tx.lead.create({
            data: { customerId: customer.id, conversationId: created.id, name, phone, source: "live_chat" }
          });
          return created;
        });
        isNewConversation = true;
      } catch (error) {
        if (error.code !== "P2002" || attempt === 2) throw error;
      }
    }
  }

  if (!isNewConversation) {
    const lead = await prisma.lead.findFirst({ where: { conversationId: conversation.id }, select: { id: true } });
    if (lead) {
      await prisma.lead.update({ where: { id: lead.id }, data: { name, phone } });
    } else {
      await prisma.lead.create({ data: { customerId: customer.id, conversationId: conversation.id, name, phone, source: "live_chat" } });
    }
  }

  const presence = await getConversationPresence(conversation.id);
  if (isNewConversation) {
    const reply = await configuredReply(presence.status === "OFFLINE" ? "OFFLINE" : "CHAT_OPEN");
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
    orderBy: { createdAt: "desc" },
    take: 120
  });

  return {
    roomId: conversation.id,
    publicId: conversation.publicId,
    status: conversation.status,
    chatMode: presence.chatMode,
    operator: { name: presence.name, avatarUrl: presence.avatarUrl, status: presence.status, lastSeenAt: presence.lastSeenAt },
    messages: [...messages].reverse().map(serializeMessage),
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
        status: conversation.assignedOperatorId ? "ASSIGNED" : "WAITING"
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
  return { roomId: conversation.id, message: serializeMessage(message), autoReply: autoReply ? serializeMessage(autoReply) : null, broadcastToAllOperators: !conversation.assignedOperatorId };
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

export async function getConversationPresence(conversationId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      assignedOperator: { select: { displayName: true, avatarUrl: true, status: true, lastSeenAt: true } }
    }
  });
  if (conversation?.assignedOperator) {
    return {
      status: conversation.assignedOperator.status,
      name: conversation.assignedOperator.displayName,
      avatarUrl: conversation.assignedOperator.avatarUrl,
      lastSeenAt: conversation.assignedOperator.lastSeenAt,
      chatMode: "LIVE"
    };
  }
  const available = await hasAvailableOperator();
  return {
    status: available ? "ONLINE" : "OFFLINE",
    name: "XION yordam markazi",
    avatarUrl: null,
    lastSeenAt: null,
    chatMode: "WAITING"
  };
}

export async function getConversationForAdmin(publicId) {
  const conversation = await prisma.conversation.findUnique({
    where: { publicId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true, telegram: true, visitorId: true } },
      assignedOperator: { select: { id: true, displayName: true, status: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 200 }
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
    messages: [...conversation.messages].reverse().map(serializeMessage)
  };
}

export async function sendAdminReply({ publicId, userId, content }) {
  const conversation = await prisma.conversation.findUnique({ where: { publicId } });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Yakunlangan suhbatga xabar yuborib bo‘lmaydi.");
  const result = await prisma.$transaction(async (tx) => {
    const readAt = new Date();
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
      data: { lastMessageAt: created.createdAt, status: conversation.assignedOperatorId ? "ASSIGNED" : "WAITING" }
    });
    await tx.message.updateMany({
      where: { conversationId: conversation.id, senderType: "CUSTOMER", status: { not: "READ" } },
      data: { status: "READ", readAt, deliveredAt: readAt }
    });
    return { created, readAt };
  });
  return { roomId: conversation.id, message: serializeMessage(result.created), readAt: result.readAt };
}

export async function sendOperatorReply({ conversationId, operatorId, content }) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Yakunlangan suhbatga xabar yuborib bo‘lmaydi.");
  if (conversation.assignedOperatorId && conversation.assignedOperatorId !== operatorId) {
    throw new ApiError(409, "CONVERSATION_ASSIGNED", "Bu suhbat boshqa operatorga biriktirilgan.");
  }
  const result = await prisma.$transaction(async (tx) => {
    const readAt = new Date();
    const created = await tx.message.create({
      data: { conversationId, senderType: "OPERATOR", senderId: operatorId, operatorId, content, status: "SENT" }
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { assignedOperatorId: operatorId, status: "ASSIGNED", lastMessageAt: created.createdAt }
    });
    await tx.message.updateMany({
      where: { conversationId, senderType: "CUSTOMER", status: { not: "READ" } },
      data: { status: "READ", readAt, deliveredAt: readAt }
    });
    return { created, readAt };
  });
  return { roomId: conversationId, publicId: conversation.publicId, message: serializeMessage(result.created), readAt: result.readAt };
}
