-- Extend public customer workflows with durable review and purchase request records.
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PROCESSING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Review"
ADD COLUMN "customerId" TEXT,
ADD COLUMN "customerPhone" TEXT;

CREATE TABLE "PurchaseRequest" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "comment" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
  "sourcePath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Review_customerId_createdAt_idx" ON "Review"("customerId", "createdAt");
CREATE INDEX "PurchaseRequest_status_createdAt_idx" ON "PurchaseRequest"("status", "createdAt");
CREATE INDEX "PurchaseRequest_customerId_createdAt_idx" ON "PurchaseRequest"("customerId", "createdAt");
CREATE INDEX "PurchaseRequest_productId_createdAt_idx" ON "PurchaseRequest"("productId", "createdAt");

ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
