import { timingSafeEqual } from "node:crypto";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { sendOperatorReply } from "./chat.service.js";
import { ApiError } from "../utils/api-error.js";

const COMMANDS = [
  { command: "start", description: "Botni operator hisobiga ulash" },
  { command: "waiting", description: "Kutilayotgan suhbatlar" },
  { command: "chats", description: "Mening faol suhbatlarim" },
  { command: "open", description: "Suhbatni ochish: /open C1234ABCD" },
  { command: "close", description: "Joriy suhbatni yopish" },
  { command: "cancel", description: "Joriy suhbatdan chiqish" },
  { command: "help", description: "Yordam" }
];

export function isTelegramConfigured() {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_WEBHOOK_SECRET);
}

export function verifyTelegramSecret(received) {
  if (!env.TELEGRAM_WEBHOOK_SECRET || typeof received !== "string") return false;
  const expected = Buffer.from(env.TELEGRAM_WEBHOOK_SECRET);
  const actual = Buffer.from(received);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function telegramRequest(method, payload = {}) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new ApiError(503, "TELEGRAM_NOT_CONFIGURED", "Telegram bot sozlanmagan.");
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) throw new Error(result?.description || `Telegram ${method} xatosi (${response.status})`);
  return result.result;
}

function keyboard(rows) {
  return { inline_keyboard: rows.map((row) => row.map(([text, callback_data]) => ({ text, callback_data }))) };
}

function customerLabel(conversation) {
  return conversation.customer.name || `Mehmon #${conversation.customer.visitorId.slice(-6).toUpperCase()}`;
}

async function sendWaitingList(chatId, operatorId, mineOnly = false) {
  const conversations = await prisma.conversation.findMany({
    where: mineOnly
      ? { assignedOperatorId: operatorId, status: { in: ["OPEN", "ASSIGNED"] } }
      : { status: { in: ["WAITING", "OPEN"] }, OR: [{ assignedOperatorId: null }, { assignedOperatorId: operatorId }] },
    include: { customer: { select: { name: true, visitorId: true } }, messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } } },
    orderBy: { lastMessageAt: "desc" },
    take: 10
  });
  if (!conversations.length) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: mineOnly ? "Sizda faol suhbat yo‘q." : "Hozir kutilayotgan suhbat yo‘q." });
    return;
  }
  for (const conversation of conversations) {
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: `#${conversation.publicId} · ${customerLabel(conversation)}\n${conversation.messages[0]?.content || "Xabar yo‘q"}`,
      reply_markup: keyboard([[mineOnly ? ["Ochish", `open:${conversation.publicId}`] : ["Qabul qilish", `claim:${conversation.publicId}`]]])
    });
  }
}

async function authorizedOperator(fromId) {
  return prisma.telegramOperator.findFirst({
    where: { telegramUserId: String(fromId), enabled: true, operator: { user: { active: true } } },
    include: { operator: { include: { user: { select: { active: true } } } } }
  });
}

async function claimConversation(telegramOperator, publicId) {
  const conversation = await prisma.conversation.findUnique({
    where: { publicId },
    include: { customer: { select: { name: true, visitorId: true } }, messages: { orderBy: { createdAt: "desc" }, take: 12 } }
  });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi.");
  if (conversation.status === "CLOSED") throw new ApiError(409, "CONVERSATION_CLOSED", "Bu suhbat yopilgan.");
  if (conversation.assignedOperatorId && conversation.assignedOperatorId !== telegramOperator.operatorId) {
    throw new ApiError(409, "CONVERSATION_ASSIGNED", "Suhbat boshqa operatorga biriktirilgan.");
  }
  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversation.id }, data: { assignedOperatorId: telegramOperator.operatorId, status: "ASSIGNED" } }),
    prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { activeConversationId: conversation.id, lastInteractionAt: new Date() } }),
    prisma.message.updateMany({ where: { conversationId: conversation.id, senderType: "CUSTOMER", status: { not: "READ" } }, data: { status: "READ", readAt: new Date(), deliveredAt: new Date() } })
  ]);
  const history = conversation.messages.reverse().map((message) => `${message.senderType === "CUSTOMER" ? "Mijoz" : "NOVA"}: ${message.content}`).join("\n");
  return { conversation, text: `✅ #${conversation.publicId} sizga biriktirildi.\nMijoz: ${customerLabel(conversation)}\n\n${history || "Hali xabar yo‘q."}\n\nJavobingizni oddiy xabar qilib yuboring.` };
}

async function closeActiveConversation(telegramOperator) {
  if (!telegramOperator.activeConversationId) throw new ApiError(409, "NO_ACTIVE_CONVERSATION", "Avval suhbatni tanlang.");
  const conversation = await prisma.conversation.findFirst({ where: { id: telegramOperator.activeConversationId, assignedOperatorId: telegramOperator.operatorId } });
  if (!conversation) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Faol suhbat topilmadi.");
  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversation.id }, data: { status: "CLOSED", closedAt: new Date() } }),
    prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { activeConversationId: null } })
  ]);
  return conversation;
}

async function handleAuthorizedMessage(message, telegramOperator, io) {
  const chatId = message.chat.id;
  const text = message.text?.trim();
  if (!text) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Hozircha faqat matnli javoblar qo‘llanadi." });
    return;
  }
  const [rawCommand, argument] = text.split(/\s+/, 2);
  const command = rawCommand.toLowerCase().split("@")[0];

  if (command === "/start") {
    await prisma.$transaction([
      prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { telegramChatId: String(chatId), username: message.from.username || telegramOperator.username, verifiedAt: new Date(), lastInteractionAt: new Date() } }),
      prisma.operator.update({ where: { id: telegramOperator.operatorId }, data: { status: "ONLINE", lastSeenAt: new Date() } })
    ]);
    await telegramRequest("sendMessage", { chat_id: chatId, text: `✅ ${telegramOperator.operator.displayName}, NOVA operator botiga muvaffaqiyatli ulandingiz.\n\n/waiting — yangi chatlar\n/chats — faol chatlaringiz\n/help — yordam` });
    return;
  }
  if (!telegramOperator.verifiedAt || telegramOperator.telegramChatId !== String(chatId)) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Botni ulash uchun /start buyrug‘ini yuboring." });
    return;
  }
  if (command === "/help") {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "/waiting — navbat\n/chats — sizga biriktirilgan chatlar\n/open C... — chatni ochish\n/close — joriy chatni yopish\n/cancel — joriy tanlovni bekor qilish\n\nChat tanlangach, oddiy matn yuborsangiz u mijozga yetadi." });
    return;
  }
  if (command === "/waiting" || command === "/chats") {
    await sendWaitingList(chatId, telegramOperator.operatorId, command === "/chats");
    return;
  }
  if (command === "/open") {
    if (!argument) {
      await telegramRequest("sendMessage", { chat_id: chatId, text: "Chat ID kiriting. Misol: /open C1234ABCD\n\nYoki /waiting orqali chatni tanlang." });
      return;
    }
    const claimed = await claimConversation(telegramOperator, argument.toUpperCase());
    io?.to(`conversation:${claimed.conversation.id}`).emit("operator:presence", { status: "ONLINE", name: telegramOperator.operator.displayName, lastSeenAt: new Date().toISOString(), chatMode: "LIVE" });
    io?.to(`conversation:${claimed.conversation.id}`).emit("conversation:read", { reader: "OPERATOR", readAt: new Date().toISOString() });
    await telegramRequest("sendMessage", { chat_id: chatId, text: claimed.text, reply_markup: keyboard([[['Yopish', `close:${claimed.conversation.publicId}`]]]) });
    return;
  }
  if (command === "/cancel") {
    await prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { activeConversationId: null, lastInteractionAt: new Date() } });
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Joriy suhbat tanlovi bekor qilindi." });
    return;
  }
  if (command === "/close") {
    if (!telegramOperator.activeConversationId) {
      await telegramRequest("sendMessage", { chat_id: chatId, text: "Hozir faol chat yo‘q. Yangi chatni /waiting orqali tanlang." });
      return;
    }
    const closed = await closeActiveConversation(telegramOperator);
    io?.to(`conversation:${closed.id}`).emit("conversation:closed", { publicId: closed.publicId, closedAt: new Date().toISOString() });
    await telegramRequest("sendMessage", { chat_id: chatId, text: `#${closed.publicId} suhbat yopildi.` });
    return;
  }
  if (command.startsWith("/")) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Noma’lum buyruq. Mavjud buyruqlarni ko‘rish uchun /help ni yuboring." });
    return;
  }
  if (!telegramOperator.activeConversationId) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Javob yuborishdan oldin /waiting orqali chatni tanlang." });
    return;
  }

  const result = await sendOperatorReply({ conversationId: telegramOperator.activeConversationId, operatorId: telegramOperator.operatorId, content: text });
  await prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { lastInteractionAt: new Date() } });
  io?.to(`conversation:${result.roomId}`).emit("message:new", result.message);
  await telegramRequest("sendMessage", { chat_id: chatId, text: `✓ #${result.publicId} mijoziga yuborildi.` });
}

async function handleCallback(callback, telegramOperator, io) {
  const chatId = callback.message?.chat?.id;
  try {
    await telegramRequest("answerCallbackQuery", { callback_query_id: callback.id });
  } catch (error) {
    const expired = /query is too old|query ID is invalid|response timeout expired/i.test(String(error.message));
    if (!expired) throw error;
  }
  if (!chatId) return;
  const [action, publicId] = String(callback.data || "").split(":", 2);
  if (action === "list") return sendWaitingList(chatId, telegramOperator.operatorId, false);
  if (action === "claim" || action === "open") {
    const claimed = await claimConversation(telegramOperator, publicId);
    io?.to(`conversation:${claimed.conversation.id}`).emit("operator:presence", { status: "ONLINE", name: telegramOperator.operator.displayName, lastSeenAt: new Date().toISOString(), chatMode: "LIVE" });
    io?.to(`conversation:${claimed.conversation.id}`).emit("conversation:read", { reader: "OPERATOR", readAt: new Date().toISOString() });
    await telegramRequest("sendMessage", { chat_id: chatId, text: claimed.text, reply_markup: keyboard([[['Yopish', `close:${claimed.conversation.publicId}`]]]) });
    return;
  }
  if (action === "close") {
    const current = await prisma.conversation.findUnique({ where: { publicId } });
    if (!current || current.assignedOperatorId !== telegramOperator.operatorId) throw new ApiError(403, "CONVERSATION_ACCESS_DENIED", "Bu suhbat sizga tegishli emas.");
    await prisma.$transaction([
      prisma.conversation.update({ where: { id: current.id }, data: { status: "CLOSED", closedAt: new Date() } }),
      prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { activeConversationId: null } })
    ]);
    io?.to(`conversation:${current.id}`).emit("conversation:closed", { publicId, closedAt: new Date().toISOString() });
    await telegramRequest("sendMessage", { chat_id: chatId, text: `#${publicId} suhbat yopildi.` });
  }
}

async function processUpdate(update, io) {
  const message = update.message;
  const callback = update.callback_query;
  const actor = message?.from || callback?.from;
  if (!actor) return;
  const telegramOperator = await authorizedOperator(actor.id);
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  if (!telegramOperator) {
    if (chatId) await telegramRequest("sendMessage", { chat_id: chatId, text: `⛔ Siz operator sifatida ro‘yxatdan o‘tmagansiz.\nTelegram ID: ${actor.id}\n\nShu ID’ni adminga yuboring. Admin operator profilingizga qo‘shgach /start ni qayta bosing.` });
    return;
  }
  if (message) return handleAuthorizedMessage(message, telegramOperator, io);
  if (callback) return handleCallback(callback, telegramOperator, io);
}

export async function handleTelegramUpdate(update, io) {
  if (!Number.isSafeInteger(update?.update_id)) throw new ApiError(400, "INVALID_TELEGRAM_UPDATE", "Telegram update noto‘g‘ri.");
  const updateId = BigInt(update.update_id);
  try {
    await prisma.telegramUpdate.create({ data: { updateId } });
  } catch (error) {
    if (error.code !== "P2002") throw error;
    const existing = await prisma.telegramUpdate.findUnique({ where: { updateId } });
    if (existing?.status === "PROCESSED" || (existing?.status === "PROCESSING" && Date.now() - existing.updatedAt.getTime() < 60_000)) return;
    await prisma.telegramUpdate.update({ where: { updateId }, data: { status: "PROCESSING", error: null } });
  }
  try {
    await processUpdate(update, io);
    await prisma.telegramUpdate.update({ where: { updateId }, data: { status: "PROCESSED", processedAt: new Date(), error: null } });
    return { processed: true };
  } catch (error) {
    const errorText = String(error.message || error).slice(0, 500);
    const handled = error instanceof ApiError;
    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    console.error("[telegram:update] processing failed", { updateId: String(updateId), handled, error: errorText });
    if (chatId) {
      const text = handled ? `⚠️ ${error.message}` : "⚠️ Buyruqni bajarishda vaqtinchalik xatolik yuz berdi. Qayta urinib ko‘ring.";
      await telegramRequest("sendMessage", { chat_id: chatId, text }).catch((notifyError) => {
        console.error("[telegram:update] error notification failed", { updateId: String(updateId), error: String(notifyError.message) });
      });
    }
    await prisma.telegramUpdate.update({
      where: { updateId },
      data: { status: handled ? "PROCESSED" : "FAILED", processedAt: handled ? new Date() : null, error: errorText }
    });
    return { processed: handled, error: errorText };
  }
}

export async function queueTelegramNotifications(messageId) {
  if (!isTelegramConfigured()) return;
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { select: { id: true, status: true, assignedOperatorId: true } } }
  });
  if (!message || message.senderType !== "CUSTOMER") return;
  if (message.conversation.status === "CLOSED") return;
  const recipients = await prisma.telegramOperator.findMany({
    where: {
      enabled: true, verifiedAt: { not: null }, telegramChatId: { not: null }, operator: { user: { active: true } },
      ...(message.conversation.assignedOperatorId ? { operatorId: message.conversation.assignedOperatorId } : {})
    },
    select: { id: true }
  });
  if (!recipients.length) return;
  await prisma.telegramDelivery.createMany({
    data: recipients.map((recipient) => ({ messageId, telegramOperatorId: recipient.id })),
    skipDuplicates: true
  });
  await processTelegramDeliveries(messageId);
}

export async function processTelegramDeliveries(messageId) {
  if (!isTelegramConfigured()) return;
  await prisma.telegramDelivery.updateMany({
    where: { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } },
    data: { status: "FAILED", nextAttemptAt: new Date(), lastError: "Stale delivery qayta navbatga qo‘yildi." }
  });
  const deliveries = await prisma.telegramDelivery.findMany({
    where: { ...(messageId ? { messageId } : {}), status: { in: ["PENDING", "FAILED"] }, attempts: { lt: env.TELEGRAM_RETRY_LIMIT }, nextAttemptAt: { lte: new Date() } },
    include: {
      telegramOperator: { select: { telegramChatId: true, activeConversationId: true } },
      message: { include: { conversation: { include: { customer: { select: { name: true, visitorId: true } } } } } }
    },
    orderBy: { createdAt: "asc" },
    take: 20
  });
  for (const delivery of deliveries) {
    const claimed = await prisma.telegramDelivery.updateMany({ where: { id: delivery.id, status: { in: ["PENDING", "FAILED"] } }, data: { status: "PROCESSING", attempts: { increment: 1 } } });
    if (!claimed.count) continue;
    try {
      const conversation = delivery.message.conversation;
      const isActiveTelegramChat = delivery.telegramOperator.activeConversationId === conversation.id;
      const replyMarkup = isActiveTelegramChat
        ? keyboard([[['Yopish', `close:${conversation.publicId}`]]])
        : conversation.assignedOperatorId
          ? keyboard([[['Ochish', `open:${conversation.publicId}`]]])
          : keyboard([[['Qabul qilish', `claim:${conversation.publicId}`]], [['Navbatni ko‘rish', 'list:waiting']]]);
      await telegramRequest("sendMessage", {
        chat_id: delivery.telegramOperator.telegramChatId,
        text: `${isActiveTelegramChat ? '💬 Mijoz yozdi' : '🔔 Yangi mijoz xabari'}\n#${conversation.publicId} · ${customerLabel(conversation)}\n\n${delivery.message.content}`,
        reply_markup: replyMarkup
      });
      await prisma.telegramDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date(), lastError: null } });
    } catch (error) {
      const delayMinutes = Math.min(30, 2 ** delivery.attempts);
      await prisma.telegramDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", lastError: String(error.message).slice(0, 500), nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000) } });
    }
  }
}

export function startTelegramDeliveryWorker() {
  if (!isTelegramConfigured()) return null;
  void processTelegramDeliveries().catch((error) => console.error("Telegram delivery worker:", error));
  const timer = setInterval(() => void processTelegramDeliveries().catch((error) => console.error("Telegram delivery worker:", error)), 30_000);
  timer.unref();
  return timer;
}

export async function setupTelegramWebhook() {
  if (!env.TELEGRAM_WEBHOOK_URL) throw new ApiError(422, "TELEGRAM_WEBHOOK_URL_REQUIRED", "TELEGRAM_WEBHOOK_URL kiritilmagan.");
  const webhook = await telegramRequest("setWebhook", {
    url: env.TELEGRAM_WEBHOOK_URL,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
    max_connections: 20
  });
  await telegramRequest("setMyCommands", { commands: COMMANDS });
  return { webhook, url: env.TELEGRAM_WEBHOOK_URL };
}

export async function getTelegramStatus() {
  const [registeredOperators, verifiedOperators] = await Promise.all([
    prisma.telegramOperator.count({ where: { enabled: true } }),
    prisma.telegramOperator.count({ where: { enabled: true, verifiedAt: { not: null }, telegramChatId: { not: null } } })
  ]);
  if (!isTelegramConfigured()) return { configured: false, webhook: null, registeredOperators, verifiedOperators };
  const webhook = await telegramRequest("getWebhookInfo");
  return {
    configured: true,
    webhook: { url: webhook.url, pendingUpdateCount: webhook.pending_update_count, lastErrorMessage: webhook.last_error_message || null },
    registeredOperators,
    verifiedOperators
  };
}
