-- Store family memory photos privately. Existing public URLs are converted to
-- storage paths so the application can issue short-lived signed URLs instead.

ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS memory_image_path TEXT;

UPDATE dishes
SET memory_image_path = regexp_replace(memory_image_url, '^.*/family-memories/', '')
WHERE memory_image_path IS NULL
  AND memory_image_url LIKE '%/family-memories/%';

UPDATE storage.buckets
SET public = false
WHERE id = 'family-memories';

DROP POLICY IF EXISTS "Public family memories read" ON storage.objects;
