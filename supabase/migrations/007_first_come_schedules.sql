-- First-come first-serve schedule capacity.

ALTER TABLE doctor_schedule_templates
  ADD COLUMN IF NOT EXISTS first_come_first_serve BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS first_come_capacity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE doctor_schedule_templates
  DROP CONSTRAINT IF EXISTS doctor_schedule_templates_first_come_capacity_check;

ALTER TABLE doctor_schedule_templates
  ADD CONSTRAINT doctor_schedule_templates_first_come_capacity_check
  CHECK (first_come_capacity >= 1);

INSERT INTO clinic_settings (key, value, description)
VALUES
  ('first_come_default_daily_capacity', '10', 'Default number of patients allowed for first-come first-serve schedule blocks')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION check_doctor_overlap()
RETURNS TRIGGER AS $$
DECLARE
  fcfs_schedule doctor_schedule_templates%ROWTYPE;
  existing_count INTEGER;
BEGIN
  IF NEW.status IN ('reserved', 'confirmed') THEN
    SELECT *
    INTO fcfs_schedule
    FROM doctor_schedule_templates
    WHERE doctor_id = NEW.doctor_id
      AND branch_id = NEW.branch_id
      AND day_of_week = EXTRACT(DOW FROM NEW.appointment_date)::INTEGER
      AND is_active = TRUE
      AND first_come_first_serve = TRUE
      AND start_time <= NEW.start_time
      AND end_time >= NEW.end_time
    ORDER BY start_time
    LIMIT 1;

    IF FOUND THEN
      SELECT COUNT(*)
      INTO existing_count
      FROM appointments
      WHERE doctor_id = NEW.doctor_id
        AND branch_id = NEW.branch_id
        AND appointment_date = NEW.appointment_date
        AND id != NEW.id
        AND status IN ('reserved', 'confirmed')
        AND start_time >= fcfs_schedule.start_time
        AND end_time <= fcfs_schedule.end_time;

      IF existing_count >= fcfs_schedule.first_come_capacity THEN
        RAISE EXCEPTION 'First-come first-serve capacity reached for this clinic session';
      END IF;

      RETURN NEW;
    END IF;

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
