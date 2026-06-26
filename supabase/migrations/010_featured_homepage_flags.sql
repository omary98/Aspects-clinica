-- Allow admins to curate compact homepage previews without removing full directory data.
ALTER TABLE specialties
  ADD COLUMN IF NOT EXISTS featured_on_homepage BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS featured_on_homepage BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_specialties_homepage_featured
  ON specialties (featured_on_homepage, display_order)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_doctors_homepage_featured
  ON doctors (featured_on_homepage, display_order)
  WHERE is_active = TRUE;
