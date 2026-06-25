-- Mini-CMS and media library for public EuroCure content.
-- Run after 004_api_grants.sql.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS site_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE,
  label TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'site-assets',
  path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'image',
  folder TEXT NOT NULL DEFAULT 'general',
  mime_type TEXT,
  size_bytes BIGINT,
  alt_text_ar TEXT,
  alt_text_en TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  field_key TEXT NOT NULL,
  value_ar TEXT,
  value_en TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  asset_id UUID REFERENCES site_assets(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (section_key, field_key)
);

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE specialties ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_assets_updated_at ON site_assets;
CREATE TRIGGER update_site_assets_updated_at
  BEFORE UPDATE ON site_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site assets" ON site_assets;
CREATE POLICY "Public can read site assets" ON site_assets
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage site assets" ON site_assets;
CREATE POLICY "Admins can manage site assets" ON site_assets
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can read active site content" ON site_content;
CREATE POLICY "Public can read active site content" ON site_content
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;
CREATE POLICY "Admins can manage site content" ON site_content
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can read site-assets objects" ON storage.objects;
CREATE POLICY "Public can read site-assets objects" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Admins can upload site-assets objects" ON storage.objects;
CREATE POLICY "Admins can upload site-assets objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND is_admin());

DROP POLICY IF EXISTS "Admins can update site-assets objects" ON storage.objects;
CREATE POLICY "Admins can update site-assets objects" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND is_admin())
  WITH CHECK (bucket_id = 'site-assets' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete site-assets objects" ON storage.objects;
CREATE POLICY "Admins can delete site-assets objects" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND is_admin());

GRANT SELECT ON site_assets TO anon;
GRANT SELECT ON site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON site_assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON site_content TO authenticated;
GRANT ALL ON site_assets TO service_role;
GRANT ALL ON site_content TO service_role;

INSERT INTO site_content (section_key, field_key, value_en, value_ar, content_type, display_order)
VALUES
  ('hero', 'tagline', 'No pain, just comfort', 'راحة بلا ألم', 'text', 10),
  ('hero', 'title', 'EuroCure', 'يورو كيور', 'text', 20),
  ('hero', 'subtitle', 'Book with trusted EuroCure specialists across our clinics.', 'احجز مع أطباء يورو كيور المتخصصين في فروعنا.', 'textarea', 30),
  ('hero', 'primary_cta', 'Book now', 'احجز الآن', 'text', 40),
  ('hero', 'secondary_cta', 'View specialties', 'عرض التخصصات', 'text', 50),
  ('about', 'title', 'About EuroCure', 'عن يورو كيور', 'text', 10),
  ('about', 'body', 'EuroCure brings specialist care, clear scheduling, and a calmer patient experience together in one place.', 'تجمع يورو كيور بين الرعاية المتخصصة وتنظيم المواعيد وتجربة مريحة للمريض في مكان واحد.', 'textarea', 20),
  ('why_choose', 'title', 'Why choose EuroCure', 'لماذا تختار يورو كيور', 'text', 10),
  ('why_choose', 'body', 'Coordinated doctors, multiple branches, transparent availability, and a booking flow built around patient comfort.', 'أطباء منسقون، وفروع متعددة، ومواعيد واضحة، وتجربة حجز مصممة لراحة المريض.', 'textarea', 20),
  ('cta', 'title', 'Ready to book your visit?', 'هل أنت مستعد لحجز زيارتك؟', 'text', 10),
  ('cta', 'subtitle', 'Choose your doctor, branch, date, and time in a few simple steps.', 'اختر الطبيب والفرع والتاريخ والوقت بخطوات بسيطة.', 'textarea', 20),
  ('cta', 'button', 'Book now', 'احجز الآن', 'text', 30),
  ('footer', 'tagline', 'No pain, just comfort.', 'راحة بلا ألم.', 'text', 10),
  ('contact', 'title', 'Contact EuroCure', 'تواصل مع يورو كيور', 'text', 10),
  ('contact', 'body', 'Use the booking form or contact your nearest public branch for appointment support.', 'استخدم نموذج الحجز أو تواصل مع أقرب فرع متاح لمساعدتك في الموعد.', 'textarea', 20)
ON CONFLICT (section_key, field_key) DO NOTHING;

INSERT INTO clinic_settings (key, value, description)
VALUES
  ('brand_primary_color', '#101010', 'Primary website brand color'),
  ('brand_accent_color', '#D8A83E', 'Accent website brand color'),
  ('brand_background_color', '#FFFDF7', 'Public website background color'),
  ('header_logo_url', '', 'Header logo URL'),
  ('footer_logo_url', '', 'Footer logo URL'),
  ('favicon_url', '', 'Favicon URL')
ON CONFLICT (key) DO NOTHING;
