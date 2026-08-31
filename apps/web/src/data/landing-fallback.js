const products = [
  ["001", "Yunona Bio-T halqasimon №1", "yunona-bio-t-halqasimon-1", "Misli bachadon ichi kontratseptiv vositasi, halqasimon №1 model."],
  ["002", "Yunona Bio-T Ag halqasimon №1", "yunona-bio-t-ag-halqasimon-1", "Kumush va mis komponentli halqasimon bachadon ichi vositasi."],
  ["003", "Yunona Bio-T Ag", "yunona-bio-t-ag", "Kumush qo‘shimchali klassik T-shakldagi bachadon ichi vositasi."],
  ["004", "Yunona Bio-T", "yunona-bio-t", "Misli klassik T-shakldagi bachadon ichi kontratseptiv vositasi."],
  ["005", "Yunona Bio Multi Ag", "yunona-bio-multi-ag", "Kumush qo‘shimchali ko‘p tayanchli bachadon ichi vositasi."],
  ["008", "Yunona Bio-T Super", "yunona-bio-t-super", "Propolisli antimikrob tarkib bilan ishlov berilgan misli T-shakldagi vosita."],
].map(([number, title, slug, shortDescription], index) => ({
  id: `xion-product-${number}`,
  title,
  slug,
  shortDescription,
  longDescription: shortDescription,
  price: null,
  oldPrice: null,
  image: `/media/xion-products/xion-${number}.webp`,
  category: "Bachadon ichi vositalari",
  active: true,
  featured: true,
  sortOrder: index + 1,
  createdAt: "2026-08-15T11:23:42.228Z",
  images: [],
}));

export const landingFallback = {
  products,
  advertisements: [
    {
      id: "xion-hero-medical-catalog",
      title: "Ayollar salomatligi uchun tibbiy buyumlar",
      description: "Akusherlik, ginekologiya va urologiya yo‘nalishlari uchun ishonchli mahsulotlar katalogi.",
      image: "/media/xion-products/hero-catalog.webp",
      ctaLabel: "Katalogni ko‘rish",
      ctaUrl: "#products",
      placement: "HERO",
      enabled: true,
      sortOrder: 1,
    },
  ],
  reviews: [
    { id: "fallback-review-1", customerName: "Madina S.", rating: 5, comment: "Jarayon juda tartibli, natija esa kutganimizdan ham kuchli bo‘ldi.", createdAt: "2026-08-08T12:25:35.590Z" },
    { id: "fallback-review-2", customerName: "Temur K.", rating: 5, comment: "Birinchi haftadanoq yangi pozitsiyalashning biznesga ta’sirini sezdik.", createdAt: "2026-08-08T12:25:35.590Z" },
  ],
  settings: {
    stats: [
      { label: "yillik tajriba", value: "10+" },
      { label: "ochiq katalog mahsuloti", value: "47" },
      { label: "eksport mamlakati", value: "25+" },
    ],
    company: { name: "XION", descriptor: "Ayollar salomatligi uchun tibbiy buyumlar" },
    hero: {
      title: "Ayollar salomatligi uchun ishonchli tibbiy buyumlar",
      subtitle: "Akusherlik, ginekologiya va urologiya uchun mahsulotlar.",
    },
    contact: {
      email: "info@xion.uz",
      phone: "+998 99 556 06 60",
      phones: ["+998 99 556 06 60", "+998 71 230 04 40"],
      address: "Toshkent shahri, Olmazor tumani, Allon ko‘chasi 141A",
      telegramUrl: "https://t.me/xion_office",
      workingHours: "Dushanba–Juma, 08:00–17:00",
    },
  },
};
