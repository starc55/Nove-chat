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

  const products = [
    { title: "Brand System", slug: "brand-system", shortDescription: "Brendning ovozi, ko‘rinishi va bozordagi o‘rnini yagona premium tizimga aylantiramiz.", longDescription: "Strategiya, identika va amaliy qo‘llanmalardan iborat to‘liq brend tizimi.", price: 12000000, oldPrice: 14500000, category: "Branding", featured: true, sortOrder: 1 },
    { title: "Digital Experience", slug: "digital-experience", shortDescription: "Tez, ta’sirchan va sotuvga yo‘naltirilgan raqamli mahsulotlar yaratamiz.", longDescription: "Tadqiqotdan ishga tushirishgacha bo‘lgan premium veb tajriba.", price: 18500000, category: "Digital", featured: true, sortOrder: 2 },
    { title: "Growth Direction", slug: "growth-direction", shortDescription: "Aniq ma’lumot va kuchli kreativ asosida o‘sish strategiyasini tuzamiz.", longDescription: "Pozitsiyalash, kampaniya tizimi va o‘sish xaritasi.", price: 8500000, category: "Strategy", featured: false, sortOrder: 3 }
  ];
  for (const product of products) await prisma.product.upsert({ where: { slug: product.slug }, update: product, create: product });

  await prisma.advertisement.deleteMany({ where: { title: "Yozgi strategiya sessiyasi" } });
  await prisma.advertisement.create({ data: { title: "Yozgi strategiya sessiyasi", description: "Avgust uchun 4 ta yangi hamkorlik o‘rni. 30 daqiqalik auditni bepul oling.", ctaLabel: "Sessiyani band qilish", ctaUrl: "#contact", placement: "AFTER_HERO", enabled: true, sortOrder: 1 } });

  const reviews = [
    { customerName: "Akmal R.", rating: 5, comment: "NOVA jamoasi murakkab g‘oyamizni ravshan va ishonchli mahsulotga aylantirdi.", status: "APPROVED" },
    { customerName: "Madina S.", rating: 5, comment: "Jarayon juda tartibli, natija esa kutganimizdan ham kuchli bo‘ldi.", status: "APPROVED" },
    { customerName: "Temur K.", rating: 5, comment: "Birinchi haftadanoq yangi pozitsiyalashning biznesga ta’sirini sezdik.", status: "APPROVED" }
  ];
  if (await prisma.review.count() === 0) await prisma.review.createMany({ data: reviews });

  const settings = {
    company: { name: "NOVA", descriptor: "Independent digital studio" },
    hero: { eyebrow: "Toshkent · Global hamkorlik", title: "Yaxshi brend ko‘rinadi. Buyuk brend seziladi.", subtitle: "Biz ambitsiyali kompaniyalar uchun strategiya, dizayn va raqamli tajribani yagona kuchli tizimga birlashtiramiz.", primaryCta: "Loyihani boshlash", secondaryCta: "Ishlarimizni ko‘rish" },
    contact: { phone: "+998 90 000 00 00", email: "hello@nova.uz", telegramUrl: "https://t.me/nova_studio", address: "Toshkent, O‘zbekiston" },
    stats: [{ value: "42+", label: "ishga tushirilgan loyiha" }, { value: "91%", label: "qayta hamkorlik" }, { value: "4.9", label: "mijozlar bahosi" }]
  };
  for (const [key, value] of Object.entries(settings)) await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  const replies = [
    { trigger: "CHAT_OPEN", text: "Assalomu alaykum! Sizga qanday yordam bera olamiz?" },
    { trigger: "FIRST_MESSAGE", text: "Xabaringizni oldik. Operatorimiz tez orada javob beradi." },
    { trigger: "OFFLINE", text: "Hozir barcha operatorlar offline. Xabaringizni qoldiring, siz bilan tez orada bog‘lanamiz." }
  ];
  for (const reply of replies) await prisma.autoReply.upsert({ where: { trigger: reply.trigger }, update: reply, create: reply });
  console.log(`Seed tayyor. Development admin: ${user.email} / NovaDev2026!`);
}

main().finally(() => prisma.$disconnect());
