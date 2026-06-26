-- Mini-CMS and media library for public Aspects Clinica content.
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
  ('hero', 'tagline', 'Premium Polyclinic in Cairo', 'أسبكتس كلينيكا — مركز طبي متكامل', 'text', 10),
  ('hero', 'title', 'Aspects Clinica', 'أسبكتس كلينيكا', 'text', 20),
  ('hero', 'subtitle', 'Aspects Clinica is a full-service healthcare facility providing a wide range of surgical and aesthetic procedures for residents of, and visitors to, Cairo, Egypt.', 'أسبكتس كلينيكا منشأة طبية متكاملة تقدم مجموعة واسعة من الخدمات الجراحية والتجميلية للمرضى المقيمين في القاهرة وزوارها.', 'textarea', 30),
  ('hero', 'primary_cta', 'Book now', 'احجز الآن', 'text', 40),
  ('hero', 'secondary_cta', 'View specialties', 'عرض التخصصات', 'text', 50),
  ('about', 'title', 'About Aspects Clinica', 'عن أسبكتس كلينيكا', 'text', 10),
  ('about', 'body', 'Aspects Clinica provides everything from routine physical examination to diagnosis and treatment, with a premium patient experience and editable clinic content.', 'تقدم أسبكتس كلينيكا خدمات تبدأ من الكشف الروتيني وتمتد إلى التشخيص والعلاج، ضمن تجربة راقية ومحتوى قابل للتعديل من لوحة التحكم.', 'textarea', 20),
  ('facilities', 'title', 'Integrated Facilities', 'مرافق وتجهيزات متكاملة', 'text', 10),
  ('facilities', 'body', 'Many specialties including surgery, dermatology, internal medicine, interventional radiology, dentistry, laser services, one-day surgery, recovery rooms, sterilization, receptions, and a coffee corner.', 'تضم تخصصات متعددة تشمل الجراحة والجلدية والباطنة والأشعة التداخلية والأسنان وخدمات الليزر وجراحة اليوم الواحد وغرف الإفاقة والتعقيم والاستقبال وركن القهوة.', 'textarea', 20),
  ('surgery_recovery', 'title', 'One-Day Surgery & Recovery', 'جراحات اليوم الواحد والإفاقة', 'text', 10),
  ('surgery_recovery', 'body', 'A fully equipped one-day surgery room, premium recovery rooms, and a dedicated internal sterilization area support safe surgical care.', 'غرفة عمليات مجهزة لجراحات اليوم الواحد وغرف إفاقة مريحة ومنطقة تعقيم داخلية مخصصة لدعم رعاية جراحية آمنة.', 'textarea', 20),
  ('laser_dermatology', 'title', 'Laser & Aesthetic Dermatology', 'الليزر والجلدية التجميلية', 'text', 10),
  ('laser_dermatology', 'body', 'DEKA MOTUS AY laser hair removal, fractional laser, Q-switch laser, dermatology, aesthetics, injectables, PRP, mesotherapy, and peeling services.', 'إزالة الشعر بالليزر DEKA MOTUS AY والفركشنال ليزر وQ-switch والجلدية التجميلية والحقن والبلازما والميزوثيرابي والتقشير.', 'textarea', 20),
  ('why_choose', 'title', 'Why choose Aspects Clinica', 'لماذا تختار أسبكتس كلينيكا', 'text', 10),
  ('why_choose', 'body', 'A premium polyclinic experience with coordinated doctors, transparent availability, room-aware scheduling, and bilingual booking.', 'تجربة مركز طبي راقية مع أطباء منسقين ومواعيد واضحة وجدولة تراعي الغرف وحجز ثنائي اللغة.', 'textarea', 20),
  ('cta', 'title', 'Ready to book your visit?', 'هل أنت مستعد لحجز زيارتك؟', 'text', 10),
  ('cta', 'subtitle', 'Choose your doctor, branch, date, and time in a few simple steps.', 'اختر الطبيب والفرع والتاريخ والوقت بخطوات بسيطة.', 'textarea', 20),
  ('cta', 'button', 'Book now', 'احجز الآن', 'text', 30),
  ('footer', 'tagline', 'Premium polyclinic care in Cairo.', 'رعاية طبية راقية متعددة التخصصات في القاهرة.', 'text', 10),
  ('contact', 'title', 'Contact Us', 'تواصل معنا', 'text', 10),
  ('contact', 'body', 'Building 164, between CMC and Shifa Hospital, Mews Cafe entrance, third floor, right of the elevator. WhatsApp and phone: +20 1212209011.', 'مبنى ١٦٤، ما بين CMC ومستشفى شفا، مدخل Mews Cafe، الدور التالت يمين الأسانسير. الهاتف والواتساب: +20 1212209011.', 'textarea', 20)
ON CONFLICT (section_key, field_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ar = EXCLUDED.value_ar,
  content_type = EXCLUDED.content_type,
  display_order = EXCLUDED.display_order,
  is_active = TRUE;

INSERT INTO clinic_settings (key, value, description)
VALUES
  ('brand_primary_color', '#123B67', 'Primary website brand color'),
  ('brand_accent_color', '#BFEA1C', 'Accent website brand color'),
  ('brand_background_color', '#F7FBF8', 'Public website background color'),
  ('header_logo_url', '', 'Header logo URL'),
  ('footer_logo_url', '', 'Footer logo URL'),
  ('favicon_url', '', 'Favicon URL')
ON CONFLICT (key) DO NOTHING;
