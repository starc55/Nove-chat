import prismaPackage from "@prisma/client";

const { PrismaClient } = prismaPackage;

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.__novaPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__novaPrisma = prisma;
