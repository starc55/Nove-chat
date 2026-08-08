import { Router } from "express";
import { handleTelegramUpdate, isTelegramConfigured, verifyTelegramSecret } from "../services/telegram.service.js";

export const telegramRouter = Router();

telegramRouter.post("/webhook", async (req, res, next) => {
  try {
    if (!isTelegramConfigured()) return res.status(503).json({ success: false, error: { code: "TELEGRAM_NOT_CONFIGURED", message: "Telegram bot sozlanmagan." } });
    if (!verifyTelegramSecret(req.get("X-Telegram-Bot-Api-Secret-Token"))) {
      return res.status(401).json({ success: false, error: { code: "INVALID_TELEGRAM_SECRET", message: "Webhook tasdiqlanmadi." } });
    }
    await handleTelegramUpdate(req.body, req.app.get("io"));
    res.json({ ok: true });
  } catch (error) { next(error); }
});
