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

export function landingProductImage(product) {
  return localProductImages[product?.id] || product?.image || "";
}

export function landingAdvertisementImage(advertisement) {
  return localAdvertisementImages[advertisement?.id] || advertisement?.image || "";
}
