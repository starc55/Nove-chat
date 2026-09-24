INSERT INTO "ContentPage" ("id", "slug", "title", "content", "active", "sortOrder", "createdAt", "updatedAt")
VALUES (
  'xion-blog-juno-gold-2026',
  'vnutrimatochnaya-spiral-juno-gold',
  'Внутриматочная спираль Juno Gold',
  $json$
  {
    "type": "blog",
    "category": "NEWS",
    "coverImage": "/media/juno-gold-news.png",
    "videoUrl": "https://youtu.be/-So_48JdX14",
    "telegramUrl": "https://t.me/xion_office",
    "phones": ["+998 71 230 04 40", "+998 99 556 06 60"],
    "publishedAt": "2026-09-18T08:00:00.000Z",
    "uz": {
      "eyebrow": "XION yangiliklari",
      "title": "Juno Gold bachadon ichi spirali",
      "excerpt": "Juno Gold — 9 yilgacha himoya beruvchi, oltin va mis qotishmasidan tayyorlangan yangi avlod kontratseptiv vositasi.",
      "sections": [{
        "title": "Juno Gold afzalliklari",
        "text": "Juno Gold oltin tarkibli bachadon ichi spirali yangi avlod kontratseptiv vositalariga kiradi.",
        "items": [
          "Homiladorlikdan 9 yilgacha himoya.",
          "585 probali oltinga o‘xshash tarkib: 58,5% oltin va 41,5% mis.",
          "Oltin miqdori yuqori bo‘lgani uchun gipoallergen va yallig‘lanishga qarshi xususiyatlar.",
          "Klassik T shakli va tibbiy plastmassadan tayyorlangan tayanch.",
          "Gormonlarni o‘z ichiga olmaydi.",
          "Nautilus patentlangan kiritish tizimi bilan yengil va aniq o‘rnatiladi."
        ]
      }]
    },
    "ru": {
      "eyebrow": "Новости XION",
      "title": "Внутриматочная спираль Juno Gold",
      "excerpt": "Внутриматочная золотосодержащая спираль Juno Gold относится к средствам контрацепции нового поколения.",
      "sections": [{
        "title": "Преимущества Juno Gold",
        "text": "Внутриматочная золотосодержащая спираль Juno Gold относится к средствам контрацепции нового поколения.",
        "items": [
          "Защита от беременности сроком до 9 лет.",
          "Спираль из золотой проволоки, аналогичной золоту 585 пробы (58,5 %) и меди (41,5 %).",
          "Обладает гипоаллергенными и противовоспалительными свойствами из-за высокого содержания золота.",
          "Классическая Т-образная форма.",
          "Якорь изготовлен из медицинского пластика.",
          "Не содержит гормонов.",
          "Обеспечивает легкое и точное введение — поставляется с уникальной запатентованной системой введения ВМС «Nautilus»."
        ]
      }]
    },
    "en": {
      "eyebrow": "XION news",
      "title": "Juno Gold intrauterine device",
      "excerpt": "Juno Gold is a new-generation gold-containing intrauterine contraceptive device.",
      "sections": [{
        "title": "Juno Gold benefits",
        "text": "Juno Gold is a new-generation gold-containing intrauterine contraceptive device.",
        "items": [
          "Contraceptive protection for up to 9 years.",
          "Gold wire alloy comparable to 585 gold: 58.5% gold and 41.5% copper.",
          "Hypoallergenic and anti-inflammatory properties due to its high gold content.",
          "Classic T-shaped design with a medical-grade plastic frame.",
          "Hormone-free.",
          "Easy, accurate insertion with the patented Nautilus IUD insertion system."
        ]
      }]
    }
  }
  $json$::jsonb,
  true,
  10,
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "active" = EXCLUDED."active",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();
