-- Add slug column to articles for pinned/static pages like "lich-su"
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique_idx
ON public.articles (slug)
WHERE slug IS NOT NULL;

-- Seed the History article if it doesn't exist yet
INSERT INTO public.articles (title, content, category, slug)
SELECT
  'Lịch sử hình thành và phát triển',
  '<p>Nội dung lịch sử hình thành và phát triển của Lữ đoàn Thông tin 604 sẽ được cập nhật tại đây. Quản trị viên có thể chỉnh sửa nội dung này trong trang quản trị.</p>',
  'Lịch sử',
  'lich-su'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'lich-su'
);