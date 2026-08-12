-- Widen monetary columns to support high-value UZS prices without overflow.
ALTER TABLE "Product"
ALTER COLUMN "price" TYPE DECIMAL(15, 2),
ALTER COLUMN "oldPrice" TYPE DECIMAL(15, 2);
