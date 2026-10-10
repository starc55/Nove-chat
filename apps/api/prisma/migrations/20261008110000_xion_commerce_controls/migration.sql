ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchasable" BOOLEAN NOT NULL DEFAULT true;

UPDATE "SiteSetting"
SET "value" = jsonb_set("value", '{workingHours}', '"Du–Shan, 09:00–18:00"'::jsonb, true),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'contact';

UPDATE "ContentPage"
SET "content" = replace(replace(replace("content"::text,
  'Dushanba–Juma, 08:00–17:00', 'Dushanba–Shanba, 09:00–18:00'),
  'Понедельник–пятница, 08:00–17:00', 'Понедельник–суббота, 09:00–18:00'),
  'Monday–Friday, 08:00–17:00', 'Monday–Saturday, 09:00–18:00')::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "content"::text LIKE '%08:00–17:00%';
