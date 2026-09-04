ALTER TABLE "Product"
  ADD COLUMN "stock" INTEGER;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stock" IS NULL OR "stock" >= 0);

ALTER TABLE "PurchaseRequest"
  ADD COLUMN "stockManaged" BOOLEAN NOT NULL DEFAULT false;
