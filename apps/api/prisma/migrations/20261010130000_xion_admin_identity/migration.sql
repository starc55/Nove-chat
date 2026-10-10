-- Rebrand the original production administrator without changing its password.
UPDATE "Admin"
SET "name" = 'XION Admin'
WHERE lower("name") IN ('nova admin', 'nova owner');

UPDATE "User"
SET "email" = 'admin@xion.uz',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("email") = 'admin@nova.uz'
  AND NOT EXISTS (
    SELECT 1 FROM "User" existing
    WHERE lower(existing."email") = 'admin@xion.uz'
  );

UPDATE "User"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN (
  SELECT "userId" FROM "Admin" WHERE "name" = 'XION Admin'
);
