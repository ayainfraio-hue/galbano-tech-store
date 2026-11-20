-- Store a dedicated count for product ratings while keeping the legacy reviews column.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_rating_count_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_rating_count_check CHECK (rating_count >= 0);

-- Preserve the existing review counts for products already in production.
UPDATE public.products
SET rating_count = reviews
WHERE rating_count = 0 AND reviews > 0;
