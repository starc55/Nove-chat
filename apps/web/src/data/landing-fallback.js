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
  blogPosts: [{
    id: "xion-blog-juno-gold-2026",
    slug: "vnutrimatochnaya-spiral-juno-gold",
    title: "Внутриматочная спираль Juno Gold",
    active: true,
    sortOrder: 10,
    createdAt: "2026-09-18T08:00:00.000Z",
    updatedAt: "2026-09-18T08:00:00.000Z",
    content: {
      type: "blog", category: "NEWS", coverImage: "/media/juno-gold-news.png", videoUrl: "https://youtu.be/-So_48JdX14", telegramUrl: "https://t.me/xion_office", phones: ["+998 71 230 04 40", "+998 99 556 06 60"], publishedAt: "2026-09-18T08:00:00.000Z",
      uz: { eyebrow: "XION yangiliklari", title: "Juno Gold bachadon ichi spirali", excerpt: "Juno Gold — 9 yilgacha himoya beruvchi oltin va mis qotishmasidan tayyorlangan yangi avlod vositasi.", sections: [{ title: "Juno Gold afzalliklari", text: "Juno Gold yangi avlod bachadon ichi kontratseptiv vositasidir.", items: ["Homiladorlikdan 9 yilgacha himoya.", "58,5% oltin va 41,5% mis qotishmasi.", "Gipoallergen va yallig‘lanishga qarshi xususiyatlar.", "Klassik T shakli, gormonsiz tarkib va patentlangan Nautilus kiritish tizimi."] }] },
      ru: { eyebrow: "Новости XION", title: "Внутриматочная спираль Juno Gold", excerpt: "Внутриматочная золотосодержащая спираль Juno Gold относится к средствам контрацепции нового поколения.", sections: [{ title: "Преимущества Juno Gold", text: "Внутриматочная золотосодержащая спираль Juno Gold относится к средствам контрацепции нового поколения.", items: ["Защита от беременности сроком до 9 лет.", "Спираль из золотой проволоки, аналогичной золоту 585 пробы (58,5 %) и меди (41,5 %).", "Обладает гипоаллергенными и противовоспалительными свойствами.", "Классическая Т-образная форма.", "Якорь изготовлен из медицинского пластика.", "Не содержит гормонов.", "Поставляется с запатентованной системой введения ВМС «Nautilus»."] }] },
      en: { eyebrow: "XION news", title: "Juno Gold intrauterine device", excerpt: "Juno Gold is a new-generation gold-containing intrauterine contraceptive device.", sections: [{ title: "Juno Gold benefits", text: "A reliable, hormone-free intrauterine contraceptive device.", items: ["Protection for up to 9 years.", "58.5% gold and 41.5% copper alloy.", "Hypoallergenic and anti-inflammatory properties.", "Classic T-shape and patented Nautilus insertion system."] }] }
    }
  }],
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
