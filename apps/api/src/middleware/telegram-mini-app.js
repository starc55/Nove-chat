import { authenticateMiniAppOperator } from "../services/telegram-mini-app.service.js";

export async function authenticateTelegramMiniApp(req, _res, next) {
  try {
    const auth = await authenticateMiniAppOperator(req.get("X-Telegram-Init-Data"));
    req.operatorAuth = auth;
    next();
  } catch (error) {
    next(error);
  }
}
