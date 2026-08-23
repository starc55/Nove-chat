import "dotenv/config";
import { z } from "zod";

const optionalString = (schema) => z.preprocess((value) => value === "" ? undefined : value, schema.optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/nova_platform?schema=public"),
  JWT_ACCESS_SECRET: z.string().min(32).default("development-access-secret-change-me-now"),
  JWT_REFRESH_SECRET: z.string().min(32).default("development-refresh-secret-change-me-now"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  TELEGRAM_BOT_TOKEN: optionalString(z.string().regex(/^\d{6,15}:[A-Za-z0-9_-]{30,}$/)),
  TELEGRAM_WEBHOOK_SECRET: optionalString(z.string().min(16).max(256).regex(/^[A-Za-z0-9_-]+$/)),
  TELEGRAM_WEBHOOK_URL: optionalString(z.string().url()),
  TELEGRAM_WEBAPP_URL: optionalString(z.string().url()),
  TELEGRAM_RETRY_LIMIT: z.coerce.number().int().min(1).max(10).default(5)
}).superRefine((value, ctx) => {
  if (Boolean(value.TELEGRAM_BOT_TOKEN) !== Boolean(value.TELEGRAM_WEBHOOK_SECRET)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET birga kiritilishi kerak." });
  }
  if (value.NODE_ENV === "production") {
    if (value.JWT_ACCESS_SECRET.includes("development") || value.JWT_REFRESH_SECRET.includes("development")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Production uchun xavfsiz JWT secretlar kiriting." });
    }
    if (value.TELEGRAM_BOT_TOKEN && !value.TELEGRAM_WEBHOOK_URL?.startsWith("https://")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Production Telegram webhook HTTPS bo‘lishi kerak." });
    }
  }
});

export const env = schema.parse(process.env);

export const telegramWebAppUrl = env.TELEGRAM_WEBAPP_URL || (env.TELEGRAM_WEBHOOK_URL
  ? `${new URL(env.TELEGRAM_WEBHOOK_URL).origin}/operator`
  : undefined);

const configuredClientOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
export const clientOrigins = [...new Set([
  ...configuredClientOrigins,
  "https://nove-chat-web.vercel.app",
  "https://xion.uz",
  "https://www.xion.uz",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
])];
