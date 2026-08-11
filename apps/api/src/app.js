import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { clientOrigins, env } from "./config/env.js";
import { healthRouter } from "./routes/health.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { telegramRouter } from "./routes/telegram.routes.js";
import { operatorAppRouter } from "./routes/operator-app.routes.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";

export const app = express();
const webDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      "script-src": ["'self'", "https://telegram.org"],
      "connect-src": ["'self'", "https:", "wss:"],
      "img-src": ["'self'", "data:", "https:"],
      "frame-ancestors": ["'self'", "https://web.telegram.org", "https://*.telegram.org"]
    }
  }
}));
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/public", publicRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/telegram", telegramRouter);
app.use("/api/v1/operator-app", operatorAppRouter);
if (env.NODE_ENV === "production" && existsSync(webDist)) {
  app.use(express.static(webDist, { maxAge: "1h", index: false }));
  app.get("*", (req, res, next) => req.path.startsWith("/api/") ? next() : res.sendFile(resolve(webDist, "index.html")));
}
app.use(notFound);
app.use(errorHandler);
