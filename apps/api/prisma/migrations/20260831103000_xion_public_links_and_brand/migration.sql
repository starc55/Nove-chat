UPDATE "SiteSetting"
SET "value" = jsonb_set(
  COALESCE("value", '{}'::jsonb),
  '{telegramUrl}',
  '"https://t.me/xion_office"'::jsonb,
  true
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'contact';

UPDATE "ContentPage"
SET "content" = replace(
  replace("content"::text, 'NOVA', 'XION'),
  'Nova',
  'XION'
)::jsonb,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "content"::text LIKE '%NOVA%'
   OR "content"::text LIKE '%Nova%';
