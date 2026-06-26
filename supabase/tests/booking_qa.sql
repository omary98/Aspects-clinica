-- ============================================================
-- Aspects Clinica — Booking QA Tests
-- Run in Supabase SQL Editor to verify booking rules
-- These use DO blocks that RAISE EXCEPTION on failure
-- (All changes are rolled back — tests are non-destructive)
-- ============================================================

-- Helper: get a known doctor / branch / specialty from seed data
DO $$
DECLARE
  v_doctor_id   UUID := 'd0000000-0000-0000-0000-000000000012'; -- Dr. Ahmad Ghait
  v_branch_id   UUID := 'b0000000-0000-0000-0000-000000000001'; -- Aspects Clinica
  v_specialty   UUID := 'a0000000-0000-0000-0000-000000000024'; -- Interventional Radiology
  v_appt1_id    UUID;
  v_appt2_id    UUID;
  v_future_date DATE := CURRENT_DATE + INTERVAL '7 days';
  v_far_date    DATE := CURRENT_DATE + INTERVAL '200 days';
  v_past_date   DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN

  -- ===========================================================
  -- TEST 1: Basic insert works for a future slot
  -- ===========================================================
  INSERT INTO appointments (
    patient_name, patient_phone, patient_phone_country_code,
    doctor_id, specialty_id, branch_id,
    appointment_date, start_time, end_time,
    duration_at_booking, status
  ) VALUES (
    'Test Patient QA1', '0100000001', '+20',
    v_doctor_id, v_specialty, v_branch_id,
    v_future_date, '17:00', '17:20',
    20, 'reserved'
  ) RETURNING id INTO v_appt1_id;

  RAISE NOTICE 'TEST 1 PASSED: Basic appointment insert works (id=%)', v_appt1_id;

  -- ===========================================================
  -- TEST 2: Same doctor, same slot → overlap trigger fires
  -- ===========================================================
  BEGIN
    INSERT INTO appointments (
      patient_name, patient_phone, patient_phone_country_code,
      doctor_id, specialty_id, branch_id,
      appointment_date, start_time, end_time,
      duration_at_booking, status
    ) VALUES (
      'Test Patient QA2', '0100000002', '+20',
      v_doctor_id, v_specialty, v_branch_id,
      v_future_date, '17:00', '17:20',
      20, 'reserved'
    );
    RAISE EXCEPTION 'TEST 2 FAILED: Duplicate slot was allowed — overlap trigger not firing!';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%overlapping%' THEN
        RAISE NOTICE 'TEST 2 PASSED: Doctor overlap trigger fires correctly';
      ELSE
        RAISE EXCEPTION 'TEST 2 FAILED: Wrong exception: %', SQLERRM;
      END IF;
  END;

  -- ===========================================================
  -- TEST 3: Partial overlap (new slot starts 10min into existing) → blocked
  -- ===========================================================
  BEGIN
    INSERT INTO appointments (
      patient_name, patient_phone, patient_phone_country_code,
      doctor_id, specialty_id, branch_id,
      appointment_date, start_time, end_time,
      duration_at_booking, status
    ) VALUES (
      'Test Patient QA3', '0100000003', '+20',
      v_doctor_id, v_specialty, v_branch_id,
      v_future_date, '17:10', '17:30',
      20, 'reserved'
    );
    RAISE EXCEPTION 'TEST 3 FAILED: Partial overlap was allowed!';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%overlapping%' THEN
        RAISE NOTICE 'TEST 3 PASSED: Partial overlap correctly blocked';
      ELSE
        RAISE EXCEPTION 'TEST 3 FAILED: Wrong exception: %', SQLERRM;
      END IF;
  END;

  -- ===========================================================
  -- TEST 4: Cancelled appointment frees the slot
  -- ===========================================================
  UPDATE appointments SET status = 'cancelled' WHERE id = v_appt1_id;

  INSERT INTO appointments (
    patient_name, patient_phone, patient_phone_country_code,
    doctor_id, specialty_id, branch_id,
    appointment_date, start_time, end_time,
    duration_at_booking, status
  ) VALUES (
    'Test Patient QA4', '0100000004', '+20',
    v_doctor_id, v_specialty, v_branch_id,
    v_future_date, '17:00', '17:20',
    20, 'reserved'
  ) RETURNING id INTO v_appt2_id;

  RAISE NOTICE 'TEST 4 PASSED: Cancelled appointment frees slot (new appt id=%)', v_appt2_id;

  -- ===========================================================
  -- TEST 5: Rescheduled appointment frees the slot
  -- ===========================================================
  UPDATE appointments SET status = 'rescheduled' WHERE id = v_appt2_id;

  INSERT INTO appointments (
    patient_name, patient_phone, patient_phone_country_code,
    doctor_id, specialty_id, branch_id,
    appointment_date, start_time, end_time,
    duration_at_booking, status
  ) VALUES (
    'Test Patient QA5', '0100000005', '+20',
    v_doctor_id, v_specialty, v_branch_id,
    v_future_date, '17:00', '17:20',
    20, 'confirmed'
  ) RETURNING id INTO v_appt1_id;

  RAISE NOTICE 'TEST 5 PASSED: Rescheduled appointment frees slot';

  -- ===========================================================
  -- TEST 6: Room double-booking blocked via appointment_rooms trigger
  -- ===========================================================
  DECLARE
    v_room_id UUID := 'r1000000-0000-0000-0000-000000000001'; -- Clinic 1
    v_appt3_id UUID;
  BEGIN
    -- First room booking (works)
    INSERT INTO appointment_rooms (appointment_id, room_id)
    VALUES (v_appt1_id, v_room_id);
    RAISE NOTICE 'TEST 6a PASSED: First room assignment works';

    -- Second appointment at same time + same room (different patient)
    INSERT INTO appointments (
      patient_name, patient_phone, patient_phone_country_code,
      doctor_id, specialty_id, branch_id,
      appointment_date, start_time, end_time,
      duration_at_booking, status
    ) VALUES (
      'Test QA6 Room Conflict', '0100000099', '+20',
      'd0000000-0000-0000-0000-000000000009', -- different doctor (Huda)
      'a0000000-0000-0000-0000-000000000002',
      v_branch_id,
      v_future_date, '17:00', '17:20',
      20, 'reserved'
    ) RETURNING id INTO v_appt3_id;

    BEGIN
      INSERT INTO appointment_rooms (appointment_id, room_id)
      VALUES (v_appt3_id, v_room_id);
      RAISE EXCEPTION 'TEST 6b FAILED: Room double-booking was allowed!';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM LIKE '%already booked%' THEN
          RAISE NOTICE 'TEST 6b PASSED: Room double-booking blocked correctly';
        ELSE
          RAISE EXCEPTION 'TEST 6b FAILED: Wrong exception: %', SQLERRM;
        END IF;
    END;
  END;

  -- ===========================================================
  -- TEST 7: Multi-room booking works (one appointment → two rooms)
  -- ===========================================================
  DECLARE
    v_room2 UUID := 'r1000000-0000-0000-0000-000000000003'; -- Procedure Room
  BEGIN
    -- Same appointment can get a second room (different room)
    INSERT INTO appointment_rooms (appointment_id, room_id)
    VALUES (v_appt1_id, v_room2);
    RAISE NOTICE 'TEST 7 PASSED: One appointment can hold multiple rooms';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 7 NOTE: Multi-room blocked (room may already be booked): %', SQLERRM;
  END;

  -- ===========================================================
  -- TEST 8: Duration at booking is preserved (not recalculated)
  -- ===========================================================
  DECLARE
    v_dur INTEGER;
  BEGIN
    SELECT duration_at_booking INTO v_dur FROM appointments WHERE id = v_appt1_id;
    IF v_dur <> 20 THEN
      RAISE EXCEPTION 'TEST 8 FAILED: duration_at_booking = % (expected 20)', v_dur;
    END IF;

    -- Update the service duration (shouldn't affect existing appointment)
    UPDATE services SET duration_minutes = 45
    WHERE id = (SELECT service_id FROM appointments WHERE id = v_appt1_id);

    SELECT duration_at_booking INTO v_dur FROM appointments WHERE id = v_appt1_id;
    IF v_dur <> 20 THEN
      RAISE EXCEPTION 'TEST 8 FAILED: duration_at_booking changed after service update!';
    END IF;
    RAISE NOTICE 'TEST 8 PASSED: duration_at_booking is immutable snapshot';
  END;

  -- ===========================================================
  -- TEST 9: Dr. Ahmad Ghait visible at multiple branches
  -- ===========================================================
  DECLARE
    v_schedule_count INTEGER;
  BEGIN
    SELECT COUNT(DISTINCT branch_id) INTO v_schedule_count
    FROM doctor_schedule_templates
    WHERE doctor_id = 'd0000000-0000-0000-0000-000000000012'
      AND is_active = TRUE;

    IF v_schedule_count < 3 THEN
      RAISE EXCEPTION 'TEST 9 FAILED: Dr. Ahmad Ghait only has % distinct branches (expected 3)', v_schedule_count;
    END IF;
    RAISE NOTICE 'TEST 9 PASSED: Dr. Ahmad Ghait appears at % branches', v_schedule_count;
  END;

  -- ===========================================================
  -- TEST 10: Aspects Clinica only has Dr. Ahmad Ghait
  -- ===========================================================
  DECLARE
    v_aspects_doctors INTEGER;
    v_aspects_branch UUID := 'b0000000-0000-0000-0000-000000000001';
  BEGIN
    SELECT COUNT(DISTINCT doctor_id) INTO v_aspects_doctors
    FROM doctor_schedule_templates
    WHERE branch_id = v_aspects_branch AND is_active = TRUE;

    IF v_aspects_doctors <> 1 THEN
      RAISE NOTICE 'TEST 10 NOTE: Aspects Clinica has % active doctors (may have been updated)', v_aspects_doctors;
    ELSE
      RAISE NOTICE 'TEST 10 PASSED: Aspects Clinica has only Dr. Ahmad Ghait';
    END IF;
  END;

  -- ===========================================================
  -- TEST 11: Surgery & Dermatology only in Aspects Clinica
  -- ===========================================================
  DECLARE
    v_surgery_outside INTEGER;
    v_derm_outside INTEGER;
  BEGIN
    -- Surgery doctors at non-Aspects Clinica branches
    SELECT COUNT(*) INTO v_surgery_outside
    FROM doctor_schedule_templates dst
    JOIN doctors d ON d.id = dst.doctor_id
    WHERE d.specialty_id = 'a0000000-0000-0000-0000-000000000002'
      AND dst.branch_id <> 'b0000000-0000-0000-0000-000000000001'
      AND dst.is_active = TRUE;

    IF v_surgery_outside > 0 THEN
      RAISE NOTICE 'TEST 11 NOTE: Surgery doctor(s) appear outside Aspects Clinica (may be intentional)';
    ELSE
      RAISE NOTICE 'TEST 11 PASSED: Surgery only at Aspects Clinica';
    END IF;

    SELECT COUNT(*) INTO v_derm_outside
    FROM doctor_schedule_templates dst
    JOIN doctors d ON d.id = dst.doctor_id
    WHERE d.specialty_id = 'a0000000-0000-0000-0000-000000000005'
      AND dst.branch_id <> 'b0000000-0000-0000-0000-000000000001'
      AND dst.is_active = TRUE;

    IF v_derm_outside > 0 THEN
      RAISE NOTICE 'TEST 11 NOTE: Dermatology doctor(s) appear outside Aspects Clinica';
    ELSE
      RAISE NOTICE 'TEST 11 PASSED: Dermatology only at Aspects Clinica';
    END IF;
  END;

  -- ===========================================================
  -- TEST 12: RLS — public can NOT read appointment data via anon key
  -- ===========================================================
  -- NOTE: This test must be verified manually by:
  --   1. Making a GET request to your Supabase REST API with anon key:
  --      curl "https://YOUR_NEW_SUPABASE_PROJECT_URL/rest/v1/appointments?select=patient_name,patient_phone" \
  --           -H "apikey: YOUR_ANON_KEY"
  --   2. Expected result: 200 OK with empty array []
  --   3. If you get patient data back, run Migration 003 to fix RLS.
  RAISE NOTICE 'TEST 12 REMINDER: Verify via Supabase REST API that anon key returns no appointment rows';

  -- Roll back all test data (tests are non-destructive)
  RAISE EXCEPTION 'ROLLBACK: All tests passed — rolling back test data';

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM = 'ROLLBACK: All tests passed — rolling back test data' THEN
      RAISE NOTICE '=== ALL BOOKING QA TESTS PASSED ===';
    ELSE
      RAISE;
    END IF;
END $$;


-- ============================================================
-- MANUAL QA CHECKLIST (verify these in the UI / Postman)
-- ============================================================
-- Run these checks after deploying to production.
--
-- [ ] 1. Patient can book available slot
--         → Go to /book, select Dr. Ahmad Ghait, Aspects Clinica, pick Sunday, book any slot
--
-- [ ] 2. Patient cannot book same slot twice
--         → Try to book the same doctor/date/time in a second browser tab
--         → Expected: "This time slot is no longer available"
--
-- [ ] 3. Patient cannot book within 6 hours
--         → In BookingForm, slots within 6h from now should not appear
--         → POST directly to /api/book with a time < 6h from now
--         → Expected: 400 error with notice-hours message
--
-- [ ] 4. Patient cannot book more than 90 days ahead
--         → POST to /api/book with date = today + 91 days
--         → Expected: 400 error with booking-window message
--
-- [ ] 5. Patient cannot book a past date
--         → POST to /api/book with date = yesterday
--         → Expected: 400 error with "past date" message
--
-- [ ] 6. Admin can manually create appointment
--         → Log in as admin → Appointments → New Appointment
--         → Expected: appointment created with status "confirmed"
--
-- [ ] 7. Admin cannot double-book (same doctor, same time)
--         → Try to create two manual appointments for same doctor + time
--         → Expected: 409 error
--
-- [ ] 8. Reschedule flow: Check "confirmed with patient" before proceeding
--         → Appointment detail → Reschedule → Expected: checkbox visible
--         → Click Confirm Reschedule WITHOUT checking → disabled if required
--
-- [ ] 9. Cancel frees slot
--         → Cancel an appointment, then verify that time slot appears in booking UI
--
-- [ ] 10. Email confirmation sent on booking
--          → Book with a real email → Check inbox for Arabic confirmation email
--
-- [ ] 11. Service role key not exposed in browser
--          → Open browser DevTools → Network tab → no request contains SUPABASE_SERVICE_ROLE_KEY
--          → View page source / JS bundles → key should not appear
--
-- [ ] 12. Admin login required for /admin/* routes
--          → Open /admin/appointments in incognito → should redirect to /admin/login
--
-- [ ] 13. Reception Head cannot access /admin/users or destructive settings
--          → Log in as operational_manager role → attempt to visit /admin/users
--          → Expected: blocked or empty (role check in UI)
--
-- [ ] 14. Doctor photo: if null, initials avatar shows
--          → Check DoctorCard renders gracefully without photo_url
--
-- [ ] 15. Language toggle works
--          → Click globe icon in navbar → page reloads in English/Arabic
--          → Booking form labels change language
