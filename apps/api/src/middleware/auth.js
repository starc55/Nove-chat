import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

export function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return next(new ApiError(401, "AUTH_REQUIRED", "Kirish talab qilinadi."));
  try {
    req.auth = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: "nova-api", audience: "nova-admin" });
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
