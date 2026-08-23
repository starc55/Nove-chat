import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { login, logout, refreshSession } from "../services/auth.service.js";

const REFRESH_COOKIE = "nova_refresh";
const router = Router();
const credentialsSchema = z.object({ email: z.string().email().max(160), password: z.string().min(8).max(128) });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 12, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: "TOO_MANY_ATTEMPTS", message: "Juda ko‘p urinish. Keyinroq qayta urinib ko‘ring." } } });

function refreshCookieOptions() {
  const production = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/api/v1/auth"
  };
}

function setRefreshCookie(res, session) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...refreshCookieOptions(),
    expires: session.refreshExpiresAt
  });
}

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const session = await login(email, password);
    setRefreshCookie(res, session);
    res.json({ success: true, data: { accessToken: session.accessToken, user: session.user } });
  } catch (error) { next(error); }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const session = await refreshSession(req.cookies[REFRESH_COOKIE]);
    setRefreshCookie(res, session);
    res.json({ success: true, data: { accessToken: session.accessToken, user: session.user } });
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    await logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    res.json({ success: true, data: { loggedOut: true } });
  } catch (error) { next(error); }
});

export const authRouter = router;
