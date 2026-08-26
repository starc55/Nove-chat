const localProductImages = {
  "xion-product-001": "/media/xion-products/xion-001.webp",
  "xion-product-002": "/media/xion-products/xion-002.webp",
  "xion-product-003": "/media/xion-products/xion-003.webp",
  "xion-product-004": "/media/xion-products/xion-004.webp",
  "xion-product-005": "/media/xion-products/xion-005.webp",
  "xion-product-008": "/media/xion-products/xion-008.webp",
};

const localAdvertisementImages = {
  "xion-hero-medical-catalog": "/media/xion-products/hero-catalog.webp",
};

const importedAssetPrefix = "/media/xion-import/";
const importedDocumentPrefix = "/media/xion-docs/";

export function xionAssetUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, globalThis.location?.origin || "https://xion.uz");
    if (parsed.hostname.replace(/^www\./, "") === "xion.uz" && parsed.pathname.startsWith("/data/uploads/")) {
      const filename = parsed.pathname.split("/").filter(Boolean).at(-1);
      if (!filename) return "";
      const prefix = decodeURIComponent(filename).toLowerCase().endsWith(".pdf")
        ? importedDocumentPrefix
        : importedAssetPrefix;
      return `${prefix}${filename}`;
    }
  } catch {
    return url;
  }
  return url;
}

export function landingProductImage(product) {
  return localProductImages[product?.id] || xionAssetUrl(product?.image);
}

export function landingAdvertisementImage(advertisement) {
  return localAdvertisementImages[advertisement?.id] || xionAssetUrl(advertisement?.image);
}
