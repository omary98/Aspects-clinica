-- ============================================================
-- Aspects Clinica — Migration 003: Production Hardening
-- Run in Supabase SQL Editor AFTER 001 and 002
-- ============================================================

-- ============================================================
-- SECURITY FIX 1: Remove PII-exposing public read on appointments
-- ============================================================
-- "Public can read appointment slots" allowed the anon key to SELECT
-- ALL columns on active appointments — exposing patient_name, patient_phone,
-- patient_email, primary_complaint, referral_source, etc.
-- Slot availability is checked server-side via service role in /api/availability.
-- No public read on appointments is needed.

DROP POLICY IF EXISTS "Public can read appointment slots" ON appointments;

-- ============================================================
-- SECURITY FIX 2: Remove public INSERT on appointments
-- ============================================================
-- All booking goes through /api/book which uses the service role.
-- Keeping a public INSERT policy lets anyone POST directly to the
-- Supabase REST API and bypass our business rules (6-hour notice,
-- 90-day window, patient validation). Removing it closes that door.
-- DB triggers (check_doctor_overlap) still enforce no-double-booking
-- even for service-role inserts.

DROP POLICY IF EXISTS "Public can create appointments" ON appointments;

-- ============================================================
-- SECURITY FIX 3: Remove public INSERT on appointment_rooms
-- ============================================================
-- Same reason — room assignments are done server-side with service role.

DROP POLICY IF EXISTS "Public can create appointment rooms" ON appointment_rooms;

-- ============================================================
-- SECURITY FIX 4: Tighten notification_logs INSERT
-- ============================================================
-- Original policy was named "Service role can insert..." but WITH CHECK (TRUE)
-- allows ANY user (including anon) to insert. Service role bypasses RLS anyway,
-- so this policy was only protecting anon inserts — in the wrong direction.

DROP POLICY IF EXISTS "Service role can insert notification logs" ON notification_logs;

-- Allow notification logs to be inserted by authenticated admins (browser client)
-- or by service role (which bypasses RLS entirely — API routes).
CREATE POLICY "Admins can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- SECURITY FIX 5: Tighten audit_logs INSERT
-- ============================================================

DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

CREATE POLICY "Admins can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- PERFORMANCE: Additional indexes
-- ============================================================

-- Patient phone for CRM lookups (find all appointments by phone number)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_phone
  ON appointments(patient_phone);

-- Country code + phone composite for exact patient match
CREATE INDEX IF NOT EXISTS idx_appointments_patient_phone_full
  ON appointments(patient_phone_country_code, patient_phone);

-- Patient email for notification delivery queries
CREATE INDEX IF NOT EXISTS idx_appointments_patient_email
  ON appointments(patient_email)
  WHERE patient_email IS NOT NULL;

-- Partial index for active (non-terminal) appointments — used heavily by
-- the doctor-overlap trigger and availability API
CREATE INDEX IF NOT EXISTS idx_appointments_active_doctor
  ON appointments(doctor_id, appointment_date, start_time, end_time)
  WHERE status IN ('reserved', 'confirmed');

-- Composite for admin list filters (date + status most common)
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments(appointment_date, status);

-- appointment_status_history lookup by appointment
CREATE INDEX IF NOT EXISTS idx_status_history_appointment
  ON appointment_status_history(appointment_id, created_at DESC);

-- ============================================================
-- DATA: Ensure clinic_settings has the notify_admin_email key
-- ============================================================
INSERT INTO clinic_settings (key, value, description)
VALUES ('notify_admin_emails', '', 'Comma-separated admin emails for new-booking notifications')
ON CONFLICT (key) DO NOTHING;

INSERT INTO clinic_settings (key, value, description)
VALUES ('cancellation_policy_en', 'Please cancel at least 24 hours before your appointment.', 'Cancellation policy shown to patients (English)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO clinic_settings (key, value, description)
VALUES ('cancellation_policy_ar', 'يرجى إلغاء موعدك قبل 24 ساعة على الأقل.', 'Cancellation policy shown to patients (Arabic)')
ON CONFLICT (key) DO NOTHING;
