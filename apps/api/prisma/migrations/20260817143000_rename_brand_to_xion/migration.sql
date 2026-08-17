-- Keep existing production content while switching the public brand from NOVA to XION.
UPDATE "SiteSetting"
SET "value" = replace("value"::text, 'NOVA', 'XION')::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "value"::text LIKE '%NOVA%';

UPDATE "ContentPage"
SET "content" = replace("content"::text, 'NOVA', 'XION')::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "content"::text LIKE '%NOVA%';
