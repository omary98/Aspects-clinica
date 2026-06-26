-- Use Aspects Clinica admin roles after enum values are committed.

ALTER TABLE admin_profiles ALTER COLUMN role SET DEFAULT 'operational_manager';

UPDATE admin_profiles
SET role = 'operational_manager'
WHERE role::text = ('reception' || '_head');

CREATE OR REPLACE FUNCTION is_medical_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND role::text IN ('medical_director', 'general_manager')
      AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;
