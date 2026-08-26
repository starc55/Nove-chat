-- Public editorial records must use the current XION identity.
-- Historical customer/operator chat messages are intentionally preserved verbatim.
UPDATE "Review"
SET "comment" = replace(replace("comment", 'NOVA', 'XION'), 'Nova', 'XION')
WHERE "comment" LIKE '%NOVA%' OR "comment" LIKE '%Nova%';
