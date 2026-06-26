-- ============================================================
-- Aspects Clinica — Migration 004: API role grants
-- Run in Supabase SQL Editor AFTER 001, 002, and 003
-- ============================================================
--
-- RLS policies decide which rows/actions are allowed, but PostgREST also
-- requires table/schema privileges for the API roles. If these grants are
-- missing, even a valid service_role key can receive:
--   permission denied for table <table_name>

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Public site reads. Row-level policies still limit what anon can see.
GRANT SELECT ON TABLE
  specialties,
  branches,
  rooms,
  doctors,
  services,
  doctor_schedule_templates,
  schedule_room_assignments,
  blocked_times,
  clinic_settings
TO anon;

-- Logged-in Supabase admins. RLS policies still require an active admin profile.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  admin_profiles,
  specialties,
  branches,
  rooms,
  doctors,
  services,
  doctor_schedule_templates,
  schedule_room_assignments,
  blocked_times,
  appointments,
  appointment_rooms,
  appointment_status_history,
  notification_recipients,
  notification_logs,
  clinic_settings,
  audit_logs
TO authenticated;

-- Server-side API routes using SUPABASE_SERVICE_ROLE_KEY.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Helper functions used by RLS policies.
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_medical_director() TO authenticated, service_role;

-- Keep future app tables usable from API routes too.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
