export function localizeAdvertisement(advertisement, language) {
  if (!advertisement || language === "uz") return advertisement;
  const translated = advertisement.translations?.[language];
  return translated ? { ...advertisement, ...translated } : advertisement;
}
