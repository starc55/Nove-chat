import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { getDashboard } from "../services/dashboard.service.js";
import { z } from "zod";
import { getConversationForAdmin, sendAdminReply } from "../services/chat.service.js";
import { adminManagementRouter } from "./admin-management.routes.js";
import { getTelegramStatus, setupTelegramWebhook } from "../services/telegram.service.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));
adminRouter.use(adminManagementRouter);

adminRouter.get("/dashboard", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getDashboard() });
  } catch (error) { next(error); }
});

adminRouter.get("/conversations/:publicId", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getConversationForAdmin(req.params.publicId) });
  } catch (error) { next(error); }
});

adminRouter.post("/conversations/:publicId/messages", async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().trim().min(1).max(2000) }).parse(req.body);
    const result = await sendAdminReply({ publicId: req.params.publicId, userId: req.auth.sub, content });
    req.app.get("io")?.to(`conversation:${result.roomId}`).emit("message:new", result.message);
    req.app.get("io")?.to(`conversation:${result.roomId}`).emit("conversation:read", { reader: "OPERATOR", readAt: result.readAt });
    res.status(201).json({ success: true, data: result.message });
  } catch (error) { next(error); }
});

adminRouter.get("/telegram/status", async (_req, res, next) => {
  try { res.json({ success: true, data: await getTelegramStatus() }); } catch (error) { next(error); }
});

adminRouter.post("/telegram/setup", async (_req, res, next) => {
  try { res.json({ success: true, data: await setupTelegramWebhook() }); } catch (error) { next(error); }
});
