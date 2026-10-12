const russianFallbacks = {
  "xion-hero-medical-catalog": {
    title: "Медицинские изделия для женского здоровья",
    description: "Надёжный каталог продукции для акушерства, гинекологии и урологии.",
    ctaLabel: "Открыть каталог",
  },
  "xion-campaign-official-supply": {
    title: "Продукция Simurg по всему Узбекистану",
    description: "Сертифицированные медицинские изделия, B2B-заказы и прямая консультация специалиста.",
    ctaLabel: "Оставить заявку",
  },
};

export function localizeAdvertisement(advertisement, language) {
  if (!advertisement || language === "uz") return advertisement;
  const fallback = language === "ru" ? russianFallbacks[advertisement.id] : null;
  const translated = Object.fromEntries(
    Object.entries(advertisement.translations?.[language] || {})
      .filter(([, value]) => typeof value !== "string" || value.trim()),
  );
  return { ...advertisement, ...(fallback || {}), ...translated };
}
