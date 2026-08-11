import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function validateTelegramInitData(initData) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new ApiError(503, "TELEGRAM_NOT_CONFIGURED", "Telegram bot sozlanmagan.");
  if (typeof initData !== "string" || !initData || initData.length > 10_000) {
    throw new ApiError(401, "MINI_APP_AUTH_REQUIRED", "Mini App autentifikatsiyasi topilmadi.");
  }
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash") || "";
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(env.TELEGRAM_BOT_TOKEN).digest();
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (!safeEqualHex(receivedHash, calculatedHash)) throw new ApiError(401, "MINI_APP_AUTH_INVALID", "Telegram imzosi tasdiqlanmadi.");

  const authDate = Number(params.get("auth_date"));
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (!Number.isSafeInteger(authDate) || ageSeconds < -300 || ageSeconds > MAX_INIT_DATA_AGE_SECONDS) {
    throw new ApiError(401, "MINI_APP_AUTH_EXPIRED", "Mini App sessiyasi eskirgan. Botdan qayta oching.");
  }
  let user;
  try { user = JSON.parse(params.get("user") || "null"); } catch { user = null; }
  if (!user || !Number.isSafeInteger(user.id)) throw new ApiError(401, "MINI_APP_USER_REQUIRED", "Telegram foydalanuvchisi aniqlanmadi.");
  return { user, authDate, queryId: params.get("query_id") || null };
}

export async function authenticateMiniAppOperator(initData) {
  const telegram = validateTelegramInitData(initData);
  const telegramOperator = await prisma.telegramOperator.findFirst({
    where: {
      telegramUserId: String(telegram.user.id),
      enabled: true,
      verifiedAt: { not: null },
      telegramChatId: { not: null },
      operator: { user: { active: true } }
    },
    include: { operator: { include: { user: { select: { active: true, email: true } } } } }
  });
  if (!telegramOperator) throw new ApiError(403, "MINI_APP_OPERATOR_FORBIDDEN", "Bu Telegram profili faol operatorga ulanmagan.");
  return { telegram, telegramOperator, operator: telegramOperator.operator };
}
