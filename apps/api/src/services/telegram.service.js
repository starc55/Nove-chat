import { timingSafeEqual } from "node:crypto";
import { prisma } from "../config/database.js";
import { env, telegramWebAppUrl } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const COMMANDS = [
  { command: "start", description: "Operator panelini ulash" },
  { command: "panel", description: "NOVA operator panelini ochish" },
  { command: "help", description: "Panelni ochish bo‘yicha yordam" }
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

function webAppKeyboard(text = "Operator panelini ochish") {
  return telegramWebAppUrl ? { inline_keyboard: [[{ text, web_app: { url: telegramWebAppUrl } }]] } : undefined;
}

async function sendOperatorPanel(chatId, operatorName, text = "Navbat, faol chatlar va mijozlarga javob berish — barchasi NOVA Operator Panel ichida.") {
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text: `NOVA OPS · ${operatorName}\n\n${text}`,
    reply_markup: webAppKeyboard("NOVA Operator Panel")
  });
}

function customerLabel(conversation) {
  return conversation.customer.name || `Mehmon #${conversation.customer.visitorId.slice(-6).toUpperCase()}`;
}

async function authorizedOperator(fromId) {
  return prisma.telegramOperator.findFirst({
    where: { telegramUserId: String(fromId), enabled: true, operator: { user: { active: true } } },
    include: { operator: { include: { user: { select: { active: true } } } } }
  });
}

async function handleAuthorizedMessage(message, telegramOperator, _io) {
  const chatId = message.chat.id;
  const text = message.text?.trim();
  if (!text) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Hozircha faqat matnli javoblar qo‘llanadi." });
    return;
  }
  const [rawCommand] = text.split(/\s+/, 1);
  const command = rawCommand.toLowerCase().split("@")[0];

  if (command === "/start") {
    await prisma.$transaction([
      prisma.telegramOperator.update({ where: { id: telegramOperator.id }, data: { telegramChatId: String(chatId), username: message.from.username || telegramOperator.username, verifiedAt: new Date(), lastInteractionAt: new Date() } }),
      prisma.operator.update({ where: { id: telegramOperator.operatorId }, data: { status: "ONLINE", lastSeenAt: new Date() } })
    ]);
    await sendOperatorPanel(chatId, telegramOperator.operator.displayName, "Profil tasdiqlandi. Barcha operator amallari premium Mini App ichida tayyor.");
    return;
  }
  if (!telegramOperator.verifiedAt || telegramOperator.telegramChatId !== String(chatId)) {
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Botni ulash uchun /start buyrug‘ini yuboring." });
    return;
  }
  await sendOperatorPanel(chatId, telegramOperator.operator.displayName, command === "/help" ? "Panelni quyidagi tugma orqali oching. Navbat, chat tarixi, javob va yopish amallari shu yerda." : undefined);
}

async function handleCallback(callback, telegramOperator, _io) {
  const chatId = callback.message?.chat?.id;
  try {
    await telegramRequest("answerCallbackQuery", { callback_query_id: callback.id });
  } catch (error) {
    const expired = /query is too old|query ID is invalid|response timeout expired/i.test(String(error.message));
    if (!expired) throw error;
  }
  if (!chatId) return;
  await sendOperatorPanel(chatId, telegramOperator.operator.displayName, "Bot buyruqlari Mini Appga ko‘chirildi. Davom etish uchun panelni oching.");
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

export async function queueTelegramNotifications(messageId, { broadcastToAll = false } = {}) {
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
      ...(!broadcastToAll && message.conversation.assignedOperatorId ? { operatorId: message.conversation.assignedOperatorId } : {})
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
      const replyMarkup = webAppKeyboard(conversation.assignedOperatorId ? "Chatni ochish" : "Navbatni ochish");
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

export async function notifyConversationClaimed(publicId, acceptedOperatorId, acceptedOperatorName) {
  if (!isTelegramConfigured()) return;
  const conversation = await prisma.conversation.findUnique({
    where: { publicId },
    include: { customer: { select: { name: true, visitorId: true } } }
  });
  if (!conversation) return;
  const recipients = await prisma.telegramOperator.findMany({
    where: {
      operatorId: { not: acceptedOperatorId },
      enabled: true,
      verifiedAt: { not: null },
      telegramChatId: { not: null },
      operator: { user: { active: true } }
    },
    select: { telegramChatId: true }
  });
  for (const recipient of recipients) {
    await telegramRequest("sendMessage", {
      chat_id: recipient.telegramChatId,
      text: `✓ #${publicId} · ${customerLabel(conversation)}\n\n${acceptedOperatorName} bu suhbatni qabul qildi.`,
      reply_markup: webAppKeyboard("Operator panelini yangilash")
    }).catch((error) => console.error("[telegram:claim-notification]", error.message));
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
  if (!telegramWebAppUrl) throw new ApiError(422, "TELEGRAM_WEBAPP_URL_REQUIRED", "TELEGRAM_WEBAPP_URL kiritilmagan.");
  const webhook = await telegramRequest("setWebhook", {
    url: env.TELEGRAM_WEBHOOK_URL,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
    max_connections: 20
  });
  await telegramRequest("setMyCommands", { commands: COMMANDS });
  await telegramRequest("setChatMenuButton", { menu_button: { type: "web_app", text: "NOVA Operator", web_app: { url: telegramWebAppUrl } } });
  return { webhook, url: env.TELEGRAM_WEBHOOK_URL, webAppUrl: telegramWebAppUrl };
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
    verifiedOperators,
    webAppUrl: telegramWebAppUrl || null
  };
}
