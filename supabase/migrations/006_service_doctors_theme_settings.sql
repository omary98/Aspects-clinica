-- Multi-doctor service assignments and light/dark branding settings.

CREATE TABLE IF NOT EXISTS service_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (service_id, doctor_id)
);

ALTER TABLE service_doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read service doctors" ON service_doctors;
CREATE POLICY "Public can read service doctors" ON service_doctors
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage service doctors" ON service_doctors;
CREATE POLICY "Admins can manage service doctors" ON service_doctors
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

GRANT SELECT ON service_doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_doctors TO authenticated;
GRANT ALL ON service_doctors TO service_role;

INSERT INTO service_doctors (service_id, doctor_id)
SELECT id, doctor_id
FROM services
WHERE doctor_id IS NOT NULL
ON CONFLICT (service_id, doctor_id) DO NOTHING;

INSERT INTO clinic_settings (key, value, description)
VALUES
  ('site_theme_default', 'dark', 'Default public website theme: light or dark'),
  ('logo_dark_url', '', 'Main logo URL for dark mode'),
  ('header_logo_dark_url', '', 'Header logo URL for dark mode'),
  ('footer_logo_dark_url', '', 'Footer logo URL for dark mode'),
  ('landing_hero_background_dark_url', '', 'Hero background image for dark mode'),
  ('landing_cta_background_dark_url', '', 'CTA background image for dark mode'),
  ('brand_dark_primary_color', '#070707', 'Primary dark mode brand color'),
  ('brand_dark_accent_color', '#E1B84D', 'Accent dark mode brand color'),
  ('brand_dark_background_color', '#080806', 'Public website dark mode background color')
ON CONFLICT (key) DO NOTHING;
