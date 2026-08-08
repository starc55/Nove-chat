import "dotenv/config";
import bcrypt from "bcryptjs";
import prismaPackage from "@prisma/client";
import { z } from "zod";

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();
const input = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(2).max(100)
}).parse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: process.env.ADMIN_NAME });

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing && existing.role !== "ADMIN") throw new Error("Bu email operator hisobiga tegishli.");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, active: true, admin: { upsert: { create: { name: input.name }, update: { name: input.name } } } } })
    : await prisma.user.create({ data: { email: input.email, passwordHash, role: "ADMIN", admin: { create: { name: input.name } } } });
  console.log(`Production admin tayyor: ${user.email}`);
}

main().finally(() => prisma.$disconnect());
