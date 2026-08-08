import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

function tokenHash(token) {
  return createHash("sha256").update(`${token}.${env.JWT_REFRESH_SECRET}`).digest("hex");
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.admin?.name || user.operator?.displayName || user.email
  };
}

async function createSession(user) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL, issuer: "nova-api", audience: "nova-admin" }
  );
  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: tokenHash(refreshToken), expiresAt } });
  return { accessToken, refreshToken, refreshExpiresAt: expiresAt, user: publicUser(user) };
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { admin: true, operator: true }
  });
  if (!user || !user.active || user.role !== "ADMIN" || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email yoki parol noto‘g‘ri.");
  }
  await prisma.refreshToken.deleteMany({ where: { userId: user.id, OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] } });
  return createSession(user);
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) throw new ApiError(401, "SESSION_REQUIRED", "Sessiya topilmadi.");
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: tokenHash(refreshToken) },
    include: { user: { include: { admin: true, operator: true } } }
  });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || !stored.user.active || stored.user.role !== "ADMIN") {
    throw new ApiError(401, "SESSION_EXPIRED", "Sessiya muddati tugagan. Qayta kiring.");
  }
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  return createSession(stored.user);
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({ where: { tokenHash: tokenHash(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}
