CREATE TYPE "CatalogTaxonomyKind" AS ENUM ('CATEGORY', 'PRODUCT_TYPE');

CREATE TABLE "CatalogTaxonomy" (
    "id" TEXT NOT NULL,
    "kind" "CatalogTaxonomyKind" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "translations" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogTaxonomy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogTaxonomy_kind_slug_key" ON "CatalogTaxonomy"("kind", "slug");
CREATE UNIQUE INDEX "CatalogTaxonomy_kind_value_key" ON "CatalogTaxonomy"("kind", "value");
CREATE INDEX "CatalogTaxonomy_kind_active_sortOrder_idx" ON "CatalogTaxonomy"("kind", "active", "sortOrder");

WITH categories AS (
  SELECT DISTINCT "category" AS value
  FROM "Product"
  WHERE "category" IS NOT NULL AND BTRIM("category") <> ''
), ranked AS (
  SELECT value, ROW_NUMBER() OVER (ORDER BY value) - 1 AS position
  FROM categories
)
INSERT INTO "CatalogTaxonomy" ("id", "kind", "name", "slug", "value", "translations", "active", "sortOrder", "createdAt", "updatedAt")
SELECT 'catalog-category-' || SUBSTRING(MD5(value), 1, 16), 'CATEGORY', value,
       'legacy-' || SUBSTRING(MD5(value), 1, 16), value, '{}'::jsonb, true, position::INTEGER, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ranked;

WITH product_types AS (
  SELECT DISTINCT value
  FROM (
    SELECT "productType" AS value FROM "Product"
    UNION
    SELECT "type" AS value FROM "ProductVariant"
  ) values_union
  WHERE value IS NOT NULL AND BTRIM(value) <> ''
), ranked AS (
  SELECT value, ROW_NUMBER() OVER (ORDER BY value) - 1 AS position
  FROM product_types
)
INSERT INTO "CatalogTaxonomy" ("id", "kind", "name", "slug", "value", "translations", "active", "sortOrder", "createdAt", "updatedAt")
SELECT 'catalog-type-' || SUBSTRING(MD5(value), 1, 16), 'PRODUCT_TYPE', value,
       'legacy-' || SUBSTRING(MD5(value), 1, 16), value, '{}'::jsonb, true, position::INTEGER, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ranked;
