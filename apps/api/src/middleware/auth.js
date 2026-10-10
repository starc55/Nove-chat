import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { prisma } from "../config/database.js";

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return next(new ApiError(401, "AUTH_REQUIRED", "Kirish talab qilinadi."));
  try {
    req.auth = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: "xion-api", audience: "xion-admin" });
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, select: { active: true, role: true, updatedAt: true } });
    if (!user?.active || user.role !== req.auth.role || user.updatedAt.getTime() !== req.auth.authVersion) return next(new ApiError(401, "ACCESS_EXPIRED", "Sessiya yangilandi. Qayta kiring."));
    return next();
  } catch {
    return next(new ApiError(401, "ACCESS_EXPIRED", "Kirish muddati tugagan."));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.auth?.role)
    ? next()
    : next(new ApiError(403, "FORBIDDEN", "Bu amal uchun ruxsat yo‘q."));
}
