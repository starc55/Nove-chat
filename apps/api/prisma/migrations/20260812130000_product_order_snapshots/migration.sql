-- Preserve order history after a catalog product is permanently deleted.
ALTER TABLE "PurchaseRequest"
ADD COLUMN "productTitle" TEXT,
ADD COLUMN "productPrice" DECIMAL(15, 2);

UPDATE "PurchaseRequest" AS request
SET
  "productTitle" = product."title",
  "productPrice" = product."price"
FROM "Product" AS product
WHERE request."productId" = product."id";

ALTER TABLE "PurchaseRequest"
ALTER COLUMN "productTitle" SET NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_productId_fkey";
ALTER TABLE "PurchaseRequest"
ADD CONSTRAINT "PurchaseRequest_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
