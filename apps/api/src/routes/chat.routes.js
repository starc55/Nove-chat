import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { markCustomerRead, openChatSession, sendCustomerMessage } from "../services/chat.service.js";
import { queueTelegramNotifications } from "../services/telegram.service.js";

export const chatRouter = Router();
const sessionLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });
const messageLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
const identitySchema = z.string().uuid();

chatRouter.post("/session", sessionLimiter, async (req, res, next) => {
  try {
    const input = z.object({
      visitorId: identitySchema,
      sourcePath: z.string().max(300).default("/"),
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,24}$/)
    }).parse(req.body);
    const session = await openChatSession(input);
    const { roomId, initialMessage, ...safeSession } = session;
    if (initialMessage) req.app.get("io")?.to(`conversation:${roomId}`).emit("message:new", initialMessage);
    res.json({ success: true, data: safeSession });
  } catch (error) { next(error); }
});

chatRouter.post("/:publicId/messages", messageLimiter, async (req, res, next) => {
  try {
    const input = z.object({ visitorId: identitySchema, content: z.string().trim().min(1).max(2000) }).parse(req.body);
    const result = await sendCustomerMessage({ publicId: req.params.publicId, ...input });
    const room = `conversation:${result.roomId}`;
    req.app.get("io")?.to(room).emit("message:new", result.message);
    req.app.get("io")?.to("operators:verified").emit("queue:updated", { publicId: req.params.publicId, reason: "customer_message" });
    if (result.autoReply) req.app.get("io")?.to(room).emit("message:new", result.autoReply);
    void queueTelegramNotifications(result.message.id, { broadcastToAll: result.broadcastToAllOperators }).catch((error) => console.error("Telegram notification queue:", error));
    res.status(201).json({ success: true, data: { message: result.message, autoReply: result.autoReply } });
  } catch (error) { next(error); }
});

chatRouter.patch("/:publicId/read", async (req, res, next) => {
  try {
    const { visitorId } = z.object({ visitorId: identitySchema }).parse(req.body);
    const result = await markCustomerRead({ publicId: req.params.publicId, visitorId });
    req.app.get("io")?.to(`conversation:${result.roomId}`).emit("conversation:read", { reader: "CUSTOMER", readAt: result.readAt });
    res.json({ success: true, data: { readAt: result.readAt } });
  } catch (error) { next(error); }
});
