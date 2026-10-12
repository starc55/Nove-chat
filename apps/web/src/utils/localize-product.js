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
  ru: "Профессиональное медицинское изделие. Размер, модификацию, наличие и условия поставки уточняет специалист XION.",
  en: "A professional medical product. A XION specialist will confirm sizing, modification, availability and supply terms."
};

// The imported catalogue predates multilingual product fields. Keep its Russian
// storefront complete while administrators progressively save explicit RU copy.
const russianProductTitles = {
  "xion-product-001": "Юнона Био-Т кольцеобразная №1",
  "xion-product-002": "Юнона Био-Т Ag кольцеобразная №1",
  "xion-product-003": "Юнона Био-Т Ag",
  "xion-product-004": "Юнона Био-Т",
  "xion-product-005": "Юнона Био Мульти Ag",
  "xion-product-006": "Юнона Био Мульти",
  "xion-product-007": "Юнона Био-Т Ag кольцеобразная №2",
  "xion-product-008": "Юнона Био-Т Super",
  "xion-product-009": "Juno Gold",
  "xion-product-010": "Юнона Био-Т кольцеобразная №2",
  "xion-product-011": "Сферический урогинекологический пессарий доктора Журавлёва",
  "xion-product-012": "Силиконовый чашечный перфорированный пессарий",
  "xion-product-013": "Силиконовый чашечно-уретральный пессарий",
  "xion-product-014": "Силиконовый пессарий Ходжа",
  "xion-product-015": "Силиконовый уретральный пессарий",
  "xion-product-016": "Силиконовый кубический перфорированный пессарий",
  "xion-product-017": "Универсальный гинекологический пессарий доктора Журавлёва",
  "xion-product-018": "Силиконовый грибовидный пессарий",
  "xion-product-019": "Набор для примерки силиконовых пессариев",
  "xion-product-020": "Силиконовый кольцевой пессарий",
  "xion-product-021": "Силиконовый утолщённый кольцевой пессарий",
  "xion-product-022": "Гинекологическое зеркало Cusco Premium",
  "xion-product-023": "Аспирационный зонд Юнона Classic Combi №051",
  "xion-product-024": "Аспирационный зонд Юнона Classic №048",
  "xion-product-025": "Аспирационный зонд Юнона Profi Combi №050",
  "xion-product-026": "Аспирационный зонд Юнона Profi №049",
  "xion-product-027": "Гинекологический шпатель Эйра №021",
  "xion-product-028": "Гинекологическая ложка Фолькмана №022",
  "xion-product-029": "Универсальный флокированный зонд №266",
  "xion-product-030": "Зонд-тампон Юнона №042",
  "xion-product-031": "Урогенитальный зонд-тампон Юнона №047",
  "xion-product-032": "Урогенитальный зонд Юнона №041",
  "xion-product-033": "Зонд Юнона с цитощёткой и шпателем №043",
  "xion-product-034": "Зонд Юнона с цитощёткой и тампоном №045",
  "xion-product-035": "Зонд Юнона с цервикальной щёткой и тампоном №046",
  "xion-product-036": "Зонд Юнона с цитощёткой и цервикальной щёткой №044",
  "xion-product-037": "Комбинированная цервикальная щётка Юнона Plus №225",
  "xion-product-038": "Цервикальная щётка Юнона Plus №224",
  "xion-product-039": "Комбинированная цервикальная щётка Юнона №219",
  "xion-product-040": "Цервикальная щётка Юнона №040",
  "xion-product-041": "Цитощётка Юнона Plus №039",
  "xion-product-042": "Цитощётка Юнона №038",
  "xion-product-043": "Гигроскопический цервикальный расширитель DILASIM",
  "xion-product-044": "Набор палочек ламинарии Юнона",
  "xion-product-045": "Набор вагинальных конусов ColpoTrain® №175",
  "xion-product-046": "Акушерский разгружающий силиконовый пессарий",
  "xion-product-047": "Перфорированный силиконовый пессарий для шейки матки",
};

const russianFieldValues = {
  "Tibbiy silikon": "Медицинский силикон",
  "Klassik T-shakl": "Классическая Т-образная форма",
  "Servikal, perforatsiyali": "Цервикальный, перфорированный",
  "Faqat professional tibbiy foydalanish uchun": "Только для профессионального медицинского применения",
  "Mavjudlik va modifikatsiya operator bilan aniqlashtiriladi": "Наличие и модификацию уточняйте у оператора",
  "Simurg tibbiyot korxonasi, Belarus": "Медицинское предприятие «Симург», Беларусь",
  "Simurg, Belarus": "«Симург», Беларусь",
  "Tibbiy plastmassa": "Медицинский пластик",
  "Propolisli antimikrob ishlov": "Антимикробная обработка с прополисом",
  "5 yilgacha": "До 5 лет",
  "Yakuniy qadoqda steril": "Стерильно в окончательной упаковке",
  "kamida 99,98%": "Не менее 99,98%",
  "Mis, nominal faol yuza 380 mm²": "Медь, номинальная активная площадь 380 мм²",
};

const russianDocumentLabels = {
  "Royxatdan otganlik guvohnomasi": "Регистрационное удостоверение",
  "Ro‘yxatdan o‘tganlik guvohnomasi": "Регистрационное удостоверение",
  "Foydalanish boyicha yoriqnoma": "Инструкция по применению",
  "Foydalanish bo‘yicha yo‘riqnoma": "Инструкция по применению",
};

const localizeRussianValue = (value) =>
  typeof value === "string" ? russianFieldValues[value] || value : value;

const titleRules = {
  ru: [[/Bachadon ichi/gi, "Внутриматочное"], [/Akusherlik/gi, "Акушерский"], [/ginekologik/gi, "гинекологический"], [/Silikon/gi, "Силиконовый"], [/pessariysi/gi, "пессарий"], [/pessariylar/gi, "пессарии"], [/pessariy/gi, "пессарий"], [/halqasimon/gi, "кольцеобразный"], [/to‘plami/gi, "набор"], [/zondi/gi, "зонд"], [/shyotka/gi, "щётка"], [/kengaytirgichi/gi, "расширитель"]],
  en: [[/Bachadon ichi/gi, "Intrauterine"], [/Akusherlik/gi, "Obstetric"], [/ginekologik/gi, "gynecological"], [/Silikon/gi, "Silicone"], [/pessariysi/gi, "pessary"], [/pessariylar/gi, "pessaries"], [/pessariy/gi, "pessary"], [/halqasimon/gi, "ring-shaped"], [/to‘plami/gi, "set"], [/zondi/gi, "probe"], [/shyotka/gi, "brush"], [/kengaytirgichi/gi, "dilator"]]
};

export function localizeProduct(product, language) {
  if (!product || language === "uz") return product;
  const explicit = Object.fromEntries(
    Object.entries(product.translations?.[language] || {})
      .filter(([, value]) => !((typeof value === "string" || Array.isArray(value)) && !value.length)),
  );
  const title = explicit.title
    || (language === "ru" ? russianProductTitles[product.id] : null)
    || titleRules[language].reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), product.title);
  return {
    ...product,
    ...explicit,
    title,
    category: explicit.category || categories[language][product.category] || product.category,
    shortDescription: explicit.shortDescription || descriptions[language],
    longDescription: explicit.longDescription || descriptions[language],
    material: explicit.material || localizeRussianValue(product.material),
    form: explicit.form || localizeRussianValue(product.form),
    productType: explicit.productType || localizeRussianValue(product.productType),
    specifications: Object.fromEntries(
      Object.entries(product.specifications || {}).map(([key, value]) => [key, localizeRussianValue(value)]),
    ),
    documents: (product.documents || []).map((document) => ({
      ...document,
      label: russianDocumentLabels[document.label] || document.label,
    })),
    variants: (product.variants || []).map((variant) => {
      const translatedVariant = variant.translations?.[language] || {};
      return {
        ...variant,
        ...translatedVariant,
        label: translatedVariant.label || variant.label,
      };
    }),
  };
}
