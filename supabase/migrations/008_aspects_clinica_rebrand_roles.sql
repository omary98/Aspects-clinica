-- Aspects Clinica admin role compatibility for existing databases.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'operational_manager'
      AND enumtypid = 'admin_role'::regtype
  ) THEN
    ALTER TYPE admin_role ADD VALUE 'operational_manager';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'general_manager'
      AND enumtypid = 'admin_role'::regtype
  ) THEN
    ALTER TYPE admin_role ADD VALUE 'general_manager';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION is_medical_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND role::text IN ('medical_director', 'general_manager')
      AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON TYPE admin_role IS 'Aspects Clinica admin roles: Medical Director, Operational Manager, General Manager.';
