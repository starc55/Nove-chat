import { Router } from "express";

export const healthRouter = Router();
healthRouter.get("/", (_req, res) => res.json({
  success: true,
  data: {
    service: "xion-api",
    status: "ok",
    release: (process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
    timestamp: new Date().toISOString()
  }
}));
