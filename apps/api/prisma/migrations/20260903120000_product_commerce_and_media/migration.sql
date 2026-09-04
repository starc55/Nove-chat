ALTER TABLE "Product"
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "material" TEXT,
  ADD COLUMN "form" TEXT,
  ADD COLUMN "productType" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "showTags" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Advertisement"
  ADD COLUMN "translations" JSONB;

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "size" TEXT,
  "type" TEXT,
  "sku" TEXT,
  "translations" JSONB,
  "price" DECIMAL(15,2),
  "stock" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductVariant_productId_active_sortOrder_idx" ON "ProductVariant"("productId", "active", "sortOrder");
CREATE INDEX "ProductVariant_size_idx" ON "ProductVariant"("size");
CREATE INDEX "ProductVariant_type_idx" ON "ProductVariant"("type");
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequest"
  ADD COLUMN "productVariantId" TEXT,
  ADD COLUMN "variantLabel" TEXT,
  ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "stockReleasedAt" TIMESTAMP(3);

CREATE INDEX "PurchaseRequest_productVariantId_createdAt_idx" ON "PurchaseRequest"("productVariantId", "createdAt");
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

UPDATE "Product"
SET
  "brand" = COALESCE(NULLIF("specifications"->>'brand', ''), NULLIF("specifications"->>'manufacturer', ''), 'Simurg'),
  "material" = NULLIF("specifications"->>'material', ''),
  "form" = COALESCE(NULLIF("specifications"->>'form', ''), NULLIF("specifications"->>'shape', '')),
  "productType" = NULLIF("specifications"->>'type', ''),
  "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "RefreshToken"
  ADD COLUMN "persistent" BOOLEAN NOT NULL DEFAULT true;
