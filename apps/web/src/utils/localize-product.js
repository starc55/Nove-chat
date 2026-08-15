const categories = {
  ru: {
    "Bachadon ichi vositalari": "Внутриматочные средства",
    "Ginekologik pessariylar": "Гинекологические пессарии",
    "Akusherlik pessariylari": "Акушерские пессарии",
    "Ginekologik ko‘zgu va to‘plamlar": "Гинекологические зеркала и наборы",
    "Bir martalik asboblar": "Одноразовые инструменты",
    "Servikal kengaytirgichlar": "Цервикальные расширители",
    "Reabilitatsiya buyumlari": "Изделия для реабилитации"
  },
  en: {
    "Bachadon ichi vositalari": "Intrauterine devices",
    "Ginekologik pessariylar": "Gynecological pessaries",
    "Akusherlik pessariylari": "Obstetric pessaries",
    "Ginekologik ko‘zgu va to‘plamlar": "Gynecological speculums and sets",
    "Bir martalik asboblar": "Disposable instruments",
    "Servikal kengaytirgichlar": "Cervical dilators",
    "Reabilitatsiya buyumlari": "Rehabilitation products"
  }
};

const descriptions = {
  ru: "Профессиональное медицинское изделие. Размер, модификацию, наличие и условия поставки уточняет специалист NOVA.",
  en: "A professional medical product. A NOVA specialist will confirm sizing, modification, availability and supply terms."
};

const titleRules = {
  ru: [[/Bachadon ichi/gi, "Внутриматочное"], [/Akusherlik/gi, "Акушерский"], [/ginekologik/gi, "гинекологический"], [/Silikon/gi, "Силиконовый"], [/pessariysi/gi, "пессарий"], [/pessariylar/gi, "пессарии"], [/pessariy/gi, "пессарий"], [/halqasimon/gi, "кольцеобразный"], [/to‘plami/gi, "набор"], [/zondi/gi, "зонд"], [/shyotka/gi, "щётка"], [/kengaytirgichi/gi, "расширитель"]],
  en: [[/Bachadon ichi/gi, "Intrauterine"], [/Akusherlik/gi, "Obstetric"], [/ginekologik/gi, "gynecological"], [/Silikon/gi, "Silicone"], [/pessariysi/gi, "pessary"], [/pessariylar/gi, "pessaries"], [/pessariy/gi, "pessary"], [/halqasimon/gi, "ring-shaped"], [/to‘plami/gi, "set"], [/zondi/gi, "probe"], [/shyotka/gi, "brush"], [/kengaytirgichi/gi, "dilator"]]
};

export function localizeProduct(product, language) {
  if (!product || language === "uz") return product;
  const explicit = product.translations?.[language] || {};
  const title = explicit.title || titleRules[language].reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), product.title);
  return {
    ...product,
    ...explicit,
    title,
    category: explicit.category || categories[language][product.category] || product.category,
    shortDescription: explicit.shortDescription || descriptions[language],
    longDescription: explicit.longDescription || descriptions[language]
  };
}
