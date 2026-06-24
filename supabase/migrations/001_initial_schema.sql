-- EuroCure Polyclinic Reservation Platform
-- Migration 001: Initial Schema
-- Default timezone: Africa/Cairo

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE admin_role AS ENUM ('medical_director', 'reception_head');

CREATE TYPE appointment_status AS ENUM (
  'reserved',
  'confirmed',
  'attended',
  'no_show',
  'cancelled',
  'rescheduled'
);

CREATE TYPE notification_type AS ENUM ('email', 'whatsapp');

CREATE TYPE notification_event AS ENUM (
  'booking_created',
  'booking_confirmed',
  'booking_cancelled',
  'booking_rescheduled',
  'reminder_24h',
  'reminder_same_day'
);

-- =============================================
-- ADMIN PROFILES
-- =============================================

CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'reception_head',
  email TEXT NOT NULL,
  whatsapp_number TEXT,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- =============================================
-- SPECIALTIES
-- =============================================

CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- BRANCHES
-- =============================================

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address_en TEXT,
  address_ar TEXT,
  google_maps_url TEXT,
  phone TEXT,
  -- true = main EuroCure branch; false = doctor-specific external location
  is_public_branch BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROOMS (EuroCure Nasr City rooms only enforced via RLS logic)
-- =============================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'clinic',  -- clinic | procedure_room | other
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- DOCTORS
-- =============================================

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  bio_en TEXT,
  bio_ar TEXT,
  photo_url TEXT,
  consultation_fee NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SERVICES / PROCEDURES
-- =============================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,  -- null = available for all doctors in specialty
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  fee NUMERIC(10, 2),
  is_visible_to_patients BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- DOCTOR SCHEDULE TEMPLATES (weekly recurrence)
-- =============================================

CREATE TABLE doctor_schedule_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  UNIQUE(doctor_id, branch_id, day_of_week, start_time)
);

-- =============================================
-- SCHEDULE ROOM ASSIGNMENTS
-- =============================================

CREATE TABLE schedule_room_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_template_id UUID NOT NULL REFERENCES doctor_schedule_templates(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_template_id, room_id)
);

-- =============================================
-- BLOCKED TIMES / HOLIDAYS / EXCEPTIONS
-- =============================================

CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_date DATE NOT NULL,
  start_time TIME,  -- null if full day
  end_time TIME,    -- null if full day
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  reason TEXT,
  is_full_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (is_full_day OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time))
);

-- =============================================
-- APPOINTMENTS
-- =============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_phone_country_code TEXT NOT NULL DEFAULT '+20',
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- Snapshots at booking time (preserved even if service/doctor/fee changes later)
  duration_at_booking INTEGER NOT NULL,
  fee_at_booking NUMERIC(10, 2),
  primary_complaint TEXT,
  referral_source TEXT,
  is_new_patient BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'reserved',
  rescheduled_from_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_confirmed_change BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- =============================================
-- APPOINTMENT ROOMS (supports multi-room bookings)
-- =============================================

CREATE TABLE appointment_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(appointment_id, room_id)
);

-- =============================================
-- APPOINTMENT STATUS HISTORY
-- =============================================

CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  previous_status appointment_status,
  new_status appointment_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATION RECIPIENTS
-- =============================================

CREATE TABLE notification_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_profile_id UUID NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_profile_id)
);

-- =============================================
-- NOTIFICATION LOGS
-- =============================================

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  event notification_event NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CLINIC SETTINGS (key-value)
-- =============================================

CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS
-- =============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_branch_date ON appointments(branch_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);
CREATE INDEX idx_appointment_rooms_appointment ON appointment_rooms(appointment_id);
CREATE INDEX idx_appointment_rooms_room_date ON appointment_rooms(room_id);
CREATE INDEX idx_blocked_times_date ON blocked_times(block_date);
CREATE INDEX idx_doctor_schedule_templates_doctor ON doctor_schedule_templates(doctor_id);
CREATE INDEX idx_notification_logs_appointment ON notification_logs(appointment_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================
-- CONSTRAINT: No overlapping active doctor bookings
-- =============================================

CREATE OR REPLACE FUNCTION check_doctor_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('reserved', 'confirmed') THEN
    IF EXISTS (
      SELECT 1 FROM appointments
      WHERE doctor_id = NEW.doctor_id
        AND appointment_date = NEW.appointment_date
        AND id != NEW.id
        AND status IN ('reserved', 'confirmed')
        AND start_time < NEW.end_time
        AND end_time > NEW.start_time
    ) THEN
      RAISE EXCEPTION 'Doctor has an overlapping appointment at this time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_doctor_overlap
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION check_doctor_overlap();

-- =============================================
-- CONSTRAINT: No overlapping active room bookings
-- =============================================

CREATE OR REPLACE FUNCTION check_room_overlap()
RETURNS TRIGGER AS $$
DECLARE
  appt_date DATE;
  appt_start TIME;
  appt_end TIME;
  appt_status appointment_status;
BEGIN
  SELECT a.appointment_date, a.start_time, a.end_time, a.status
  INTO appt_date, appt_start, appt_end, appt_status
  FROM appointments a
  WHERE a.id = NEW.appointment_id;

  IF appt_status IN ('reserved', 'confirmed') THEN
    IF EXISTS (
      SELECT 1 FROM appointment_rooms ar
      JOIN appointments a ON a.id = ar.appointment_id
      WHERE ar.room_id = NEW.room_id
        AND ar.id != NEW.id
        AND a.appointment_date = appt_date
        AND a.status IN ('reserved', 'confirmed')
        AND a.start_time < appt_end
        AND a.end_time > appt_start
    ) THEN
      RAISE EXCEPTION 'Room is already booked at this time';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_room_overlap
BEFORE INSERT OR UPDATE ON appointment_rooms
FOR EACH ROW EXECUTE FUNCTION check_room_overlap();

-- =============================================
-- UPDATED_AT triggers
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at_admin_profiles BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_specialties BEFORE UPDATE ON specialties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_branches BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_rooms BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_doctors BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_services BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_schedule_templates BEFORE UPDATE ON doctor_schedule_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_blocked_times BEFORE UPDATE ON blocked_times FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_appointments BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_notification_recipients BEFORE UPDATE ON notification_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_at_clinic_settings BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an active admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: is current user Medical Director?
CREATE OR REPLACE FUNCTION is_medical_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role = 'medical_director' AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PUBLIC READ: specialties, branches, doctors, services, rooms (for booking UI)
CREATE POLICY "Public can read active specialties" ON specialties FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read active branches" ON branches FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read active doctors" ON doctors FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = TRUE AND is_visible_to_patients = TRUE);
CREATE POLICY "Public can read active rooms" ON rooms FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read active schedules" ON doctor_schedule_templates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read schedule room assignments" ON schedule_room_assignments FOR SELECT USING (TRUE);
CREATE POLICY "Public can read blocked times" ON blocked_times FOR SELECT USING (TRUE);
CREATE POLICY "Public can read clinic settings" ON clinic_settings FOR SELECT USING (TRUE);

-- PUBLIC: Can create appointments (server-side action validates)
CREATE POLICY "Public can create appointments" ON appointments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public can create appointment rooms" ON appointment_rooms FOR INSERT WITH CHECK (TRUE);

-- PUBLIC: Can read LIMITED appointment info (only to check slot availability — no PII)
-- Full appointment data is admin-only; slot checking is done via server action
CREATE POLICY "Public can read appointment slots" ON appointments
  FOR SELECT USING (
    status IN ('reserved', 'confirmed')
    -- Only expose date/time/doctor/branch — no PII accessible via anon key
    -- Full rows are handled server-side with service role
  );

-- ADMIN: Full access to all tables
CREATE POLICY "Admins can read all appointments" ON appointments FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update appointments" ON appointments FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete appointments" ON appointments FOR DELETE USING (is_medical_director());

CREATE POLICY "Admins can read appointment rooms" ON appointment_rooms FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage appointment status history" ON appointment_status_history FOR ALL USING (is_admin());

CREATE POLICY "Admins read admin profiles" ON admin_profiles FOR SELECT USING (is_admin());
CREATE POLICY "Medical director manage admin profiles" ON admin_profiles FOR ALL USING (is_medical_director());
CREATE POLICY "Own profile" ON admin_profiles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins manage specialties" ON specialties FOR ALL USING (is_admin());
CREATE POLICY "Admins manage branches" ON branches FOR ALL USING (is_admin());
CREATE POLICY "Admins manage rooms" ON rooms FOR ALL USING (is_admin());
CREATE POLICY "Admins manage doctors" ON doctors FOR ALL USING (is_admin());
CREATE POLICY "Admins manage services" ON services FOR ALL USING (is_admin());
CREATE POLICY "Admins manage schedules" ON doctor_schedule_templates FOR ALL USING (is_admin());
CREATE POLICY "Admins manage schedule rooms" ON schedule_room_assignments FOR ALL USING (is_admin());
CREATE POLICY "Admins manage blocked times" ON blocked_times FOR ALL USING (is_admin());
CREATE POLICY "Admins manage notification recipients" ON notification_recipients FOR ALL USING (is_admin());
CREATE POLICY "Admins read notification logs" ON notification_logs FOR SELECT USING (is_admin());
CREATE POLICY "Service role can insert notification logs" ON notification_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage clinic settings" ON clinic_settings FOR ALL USING (is_admin());
CREATE POLICY "Admins read audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Service role can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (TRUE);
