import { Router } from "express";

export const healthRouter = Router();
healthRouter.get("/", (req, res) => res.json({ success: true, data: { service: "xion-api", status: "ok", timestamp: new Date().toISOString() } }));
