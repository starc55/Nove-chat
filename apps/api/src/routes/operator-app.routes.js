import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authenticateTelegramMiniApp } from "../middleware/telegram-mini-app.js";
import {
  claimOperatorConversation,
  closeOperatorConversation,
  getOperatorConversation,
  getOperatorWorkspace,
  replyToOperatorConversation,
  updateOperatorPresence
} from "../services/operator-chat.service.js";
import { notifyConversationClaimed } from "../services/telegram.service.js";

export const operatorAppRouter = Router();
operatorAppRouter.use(rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));
operatorAppRouter.use(authenticateTelegramMiniApp);

function route(handler) {
  return async (req, res, next) => {
    try { await handler(req, res); } catch (error) { next(error); }
  };
}

operatorAppRouter.get("/bootstrap", route(async (req, res) => {
  res.json({ success: true, data: await getOperatorWorkspace(req.operatorAuth.operator.id) });
}));

operatorAppRouter.get("/conversations/:publicId", route(async (req, res) => {
  res.json({ success: true, data: await getOperatorConversation(req.operatorAuth.operator.id, req.params.publicId) });
}));

operatorAppRouter.post("/conversations/:publicId/claim", route(async (req, res) => {
  const operator = req.operatorAuth.operator;
  const conversation = await claimOperatorConversation(operator.id, req.params.publicId);
  const io = req.app.get("io");
  io?.to(`conversation:${conversation.id}`).emit("operator:presence", { status: "ONLINE", name: operator.displayName, avatarUrl: operator.avatarUrl, lastSeenAt: new Date().toISOString(), chatMode: "LIVE" });
  io?.to("operators:verified").emit("queue:claimed", { publicId: conversation.publicId, operator: { id: operator.id, name: operator.displayName } });
  void notifyConversationClaimed(conversation.publicId, operator.id, operator.displayName).catch((error) => console.error("Telegram claim notification:", error));
  res.json({ success: true, data: conversation });
}));

operatorAppRouter.post("/conversations/:publicId/messages", route(async (req, res) => {
  const { content } = z.object({ content: z.string().trim().min(1).max(2000) }).parse(req.body);
  const result = await replyToOperatorConversation(req.operatorAuth.operator.id, req.params.publicId, content);
  const io = req.app.get("io");
  io?.to(`conversation:${result.roomId}`).emit("message:new", result.message);
  io?.to(`conversation:${result.roomId}`).emit("conversation:read", { reader: "OPERATOR", readAt: result.readAt });
  io?.to("operators:verified").emit("queue:updated", { publicId: result.publicId, reason: "reply" });
  res.status(201).json({ success: true, data: { message: result.message, readAt: result.readAt } });
}));

operatorAppRouter.post("/conversations/:publicId/close", route(async (req, res) => {
  const result = await closeOperatorConversation(req.operatorAuth.operator.id, req.params.publicId);
  const io = req.app.get("io");
  io?.to(`conversation:${result.id}`).emit("conversation:closed", { publicId: result.publicId, closedAt: result.closedAt });
  io?.to("operators:verified").emit("queue:updated", { publicId: result.publicId, reason: "closed" });
  res.json({ success: true, data: { publicId: result.publicId, closedAt: result.closedAt } });
}));

operatorAppRouter.patch("/presence", route(async (req, res) => {
  const { status } = z.object({ status: z.enum(["ONLINE", "AWAY", "OFFLINE"]) }).parse(req.body);
  res.json({ success: true, data: await updateOperatorPresence(req.operatorAuth.operator.id, status) });
}));
