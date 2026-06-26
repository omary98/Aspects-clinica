-- Aspects Clinica operational defaults.
-- Safe to rerun: schedules upsert on the existing uniqueness rule, services insert only when missing.

UPDATE specialties
SET icon = CASE slug
  WHEN 'bariatric-surgery' THEN 'scissors'
  WHEN 'general-surgery' THEN 'scissors'
  WHEN 'endoscopy-laparoscopy' THEN 'scan'
  WHEN 'one-day-surgery' THEN 'shield-plus'
  WHEN 'cosmetic-dermatology' THEN 'sparkles'
  WHEN 'laser-hair-removal' THEN 'zap'
  WHEN 'plastic-surgery' THEN 'scissors'
  WHEN 'dental-services' THEN 'smile'
  WHEN 'cosmetic-gynecology' THEN 'sparkles'
  WHEN 'vascular-surgery' THEN 'heart-pulse'
  WHEN 'pain-relief' THEN 'activity'
  WHEN 'oculoplasty' THEN 'eye'
  WHEN 'nutrition' THEN 'utensils'
  WHEN 'internal-medicine' THEN 'stethoscope'
  WHEN 'pediatrics' THEN 'baby'
  WHEN 'ent' THEN 'ear'
  WHEN 'physiotherapy' THEN 'dumbbell'
  WHEN 'neurosurgery' THEN 'brain'
  WHEN 'ultrasound' THEN 'waves'
  WHEN 'laboratory-services' THEN 'flask-conical'
  WHEN 'oncology' THEN 'microscope'
  WHEN 'cardiology' THEN 'heart-pulse'
  WHEN 'orthopedic-surgery' THEN 'bone'
  WHEN 'interventional-radiology' THEN 'scan'
  WHEN 'anesthesiology' THEN 'shield-plus'
  ELSE COALESCE(NULLIF(icon, ''), 'stethoscope')
END,
updated_at = NOW();

WITH days(day_of_week) AS (
  VALUES (6), (0), (1), (2), (3), (4)
)
INSERT INTO doctor_schedule_templates (
  doctor_id,
  branch_id,
  day_of_week,
  start_time,
  end_time,
  first_come_first_serve,
  first_come_capacity,
  is_active
)
SELECT
  doctors.id,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  days.day_of_week,
  '16:00'::time,
  '20:00'::time,
  FALSE,
  10,
  TRUE
FROM doctors
CROSS JOIN days
WHERE doctors.is_active = TRUE
ON CONFLICT (doctor_id, branch_id, day_of_week, start_time)
DO UPDATE SET
  end_time = EXCLUDED.end_time,
  first_come_first_serve = FALSE,
  first_come_capacity = EXCLUDED.first_come_capacity,
  is_active = TRUE,
  updated_at = NOW();

WITH service_templates AS (
  SELECT
    1 AS display_offset,
    'Initial Consultation' AS name_en,
    'استشارة أولى' AS name_ar,
    'A focused first visit to assess the case, review patient goals, and recommend the right next step.' AS description_en,
    'زيارة أولى لتقييم الحالة وفهم أهداف المريض وتحديد الخطوة الطبية المناسبة.' AS description_ar,
    20 AS duration_minutes
  UNION ALL
  SELECT
    2,
    'Follow-up Visit',
    'متابعة',
    'A follow-up appointment to review progress, results, treatment response, or recovery.' AS description_en,
    'موعد متابعة لمراجعة التطور والنتائج والاستجابة للعلاج أو التعافي.' AS description_ar,
    20
  UNION ALL
  SELECT
    3,
    'Procedure Planning',
    'تخطيط الإجراء',
    'A planning session for suitable procedures, preparation instructions, and expected recovery.' AS description_en,
    'جلسة تخطيط للإجراء المناسب وتعليمات التحضير والتعافي المتوقع.' AS description_ar,
    30
)
INSERT INTO services (
  specialty_id,
  doctor_id,
  name_en,
  name_ar,
  description_en,
  description_ar,
  duration_minutes,
  fee,
  is_visible_to_patients,
  is_active,
  display_order
)
SELECT
  specialties.id,
  NULL,
  service_templates.name_en,
  service_templates.name_ar,
  service_templates.description_en,
  service_templates.description_ar,
  service_templates.duration_minutes,
  NULL,
  TRUE,
  TRUE,
  (specialties.display_order * 100) + service_templates.display_offset
FROM specialties
CROSS JOIN service_templates
WHERE NOT EXISTS (
  SELECT 1
  FROM services existing
  WHERE existing.specialty_id = specialties.id
    AND lower(existing.name_en) = lower(service_templates.name_en)
);
