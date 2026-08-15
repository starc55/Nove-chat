import bcrypt from "bcryptjs";
import prismaPackage from "@prisma/client";

const { PrismaClient } = prismaPackage;

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed productionda bloklangan. ADMIN_EMAIL, ADMIN_PASSWORD va ADMIN_NAME bilan npm run admin:create -w @nova/api buyrug‘ini ishlating.");
  }
  const passwordHash = await bcrypt.hash("NovaDev2026!", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@nova.uz" },
    update: {},
    create: { email: "admin@nova.uz", passwordHash, role: "ADMIN", admin: { create: { name: "NOVA Admin" } } }
  });

  const operatorSeeds = [
    { email: "dilshod@nova.uz", displayName: "Dilshod Karimov", status: "ONLINE" },
    { email: "aziza@nova.uz", displayName: "Aziza Nur", status: "AWAY" }
  ];
  for (const operator of operatorSeeds) {
    const operatorUser = await prisma.user.upsert({
      where: { email: operator.email },
      update: { active: true },
      create: { email: operator.email, passwordHash, role: "OPERATOR" }
    });
    await prisma.operator.upsert({
      where: { userId: operatorUser.id },
      update: { displayName: operator.displayName, status: operator.status, lastSeenAt: new Date() },
      create: { userId: operatorUser.id, displayName: operator.displayName, status: operator.status, lastSeenAt: new Date() }
    });
  }

  // Public catalogue and contact content are installed by the production-safe
  // 20260815190000_import_xion_catalog migration. Keep sample services hidden if
  // this development seed is run against an older local database.
  await prisma.product.updateMany({
    where: { slug: { in: ["brand-system", "digital-experience", "growth-direction"] } },
    data: { active: false }
  });
  const replies = [
    { trigger: "CHAT_OPEN", text: "Assalomu alaykum! Sizga qanday yordam bera olamiz?" },
    { trigger: "FIRST_MESSAGE", text: "Xabaringizni oldik. Operatorimiz tez orada javob beradi." },
    { trigger: "OFFLINE", text: "Hozir barcha operatorlar offline. Xabaringizni qoldiring, siz bilan tez orada bog‘lanamiz." }
  ];
  for (const reply of replies) await prisma.autoReply.upsert({ where: { trigger: reply.trigger }, update: reply, create: reply });
  console.log(`Seed tayyor. Development admin: ${user.email} / NovaDev2026!`);
}

main().finally(() => prisma.$disconnect());
