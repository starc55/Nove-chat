import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

function customerLabel(customer) {
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

export async function listConversationArchive({ page, limit, q }) {
  const where = {
    status: "CLOSED",
    ...(q ? {
      OR: [
        { publicId: { contains: q, mode: "insensitive" } },
        { customer: { is: { name: { contains: q, mode: "insensitive" } } } },
        { customer: { is: { phone: { contains: q, mode: "insensitive" } } } }
      ]
    } : {})
  };
  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        publicId: true,
        sourcePath: true,
        startedAt: true,
        closedAt: true,
        lastMessageAt: true,
        customer: { select: { name: true, visitorId: true, phone: true, email: true, telegram: true } },
        assignedOperator: { select: { id: true, displayName: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, senderType: true } },
        _count: { select: { messages: true } }
      }
    }),
    prisma.conversation.count({ where })
  ]);
  return {
    items: items.map((item) => ({
      id: item.id,
      publicId: item.publicId,
      customerName: customerLabel(item.customer),
      customerPhone: item.customer.phone,
      customerEmail: item.customer.email,
      customerTelegram: item.customer.telegram,
      operator: item.assignedOperator?.displayName || "Operator o‘chirilgan",
      lastMessage: item.messages[0]?.content || "Xabar yo‘q",
      lastSenderType: item.messages[0]?.senderType || "SYSTEM",
      messageCount: item._count.messages,
      sourcePath: item.sourcePath,
      startedAt: item.startedAt,
      closedAt: item.closedAt,
      lastMessageAt: item.lastMessageAt
    })),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }
  };
}

export async function getArchivedConversation(publicId, { cursor, limit }) {
  const conversation = await prisma.conversation.findFirst({
    where: { publicId, status: "CLOSED" },
    select: {
      id: true,
      publicId: true,
      sourcePath: true,
      startedAt: true,
      closedAt: true,
      lastMessageAt: true,
      customer: { select: { name: true, visitorId: true, phone: true, email: true, telegram: true } },
      assignedOperator: { select: { id: true, displayName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          senderType: true,
          content: true,
          type: true,
          status: true,
          createdAt: true,
          readAt: true
        }
      }
    }
  });
  if (!conversation) throw new ApiError(404, "ARCHIVED_CONVERSATION_NOT_FOUND", "Arxiv suhbat topilmadi.");
  const hasMore = conversation.messages.length > limit;
  const page = conversation.messages.slice(0, limit);
  const nextCursor = hasMore ? page.at(-1)?.id || null : null;
  return {
    id: conversation.id,
    publicId: conversation.publicId,
    sourcePath: conversation.sourcePath,
    startedAt: conversation.startedAt,
    closedAt: conversation.closedAt,
    lastMessageAt: conversation.lastMessageAt,
    customer: {
      name: customerLabel(conversation.customer),
      phone: conversation.customer.phone,
      email: conversation.customer.email,
      telegram: conversation.customer.telegram
    },
    operator: conversation.assignedOperator
      ? { id: conversation.assignedOperator.id, name: conversation.assignedOperator.displayName }
      : null,
    messages: [...page].reverse().map(serializeMessage),
    nextCursor
  };
}
