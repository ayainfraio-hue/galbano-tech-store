-- Backfill existing signed image URLs to permanent Storage object paths.
UPDATE public.products
SET image_url = regexp_replace(image_url, '^https?://[^/]+/storage/v1/object/sign/product-images/([^?]+).*$', '\1')
WHERE image_url ~ '^https?://[^/]+/storage/v1/object/sign/product-images/';

UPDATE public.products
SET gallery_urls = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN value #>> '{}' ~ '^https?://[^/]+/storage/v1/object/sign/product-images/'
      THEN to_jsonb(regexp_replace(value #>> '{}', '^https?://[^/]+/storage/v1/object/sign/product-images/([^?]+).*$', '\1'))
      ELSE value
    END ORDER BY ordinality
  ), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(gallery_urls, '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinality)
)
WHERE jsonb_typeof(gallery_urls) = 'array';

DROP POLICY IF EXISTS "Public reads active product images" ON storage.objects;
CREATE POLICY "Public reads active product images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.active = true
      AND (p.image_url = storage.objects.name OR COALESCE(p.gallery_urls, '[]'::jsonb) ? storage.objects.name)
  )
);
