-- EuroCure Polyclinic — Seed Data
-- Migration 002: Initial data for specialties, branches, rooms, doctors, services, and schedules

-- =============================================
-- CLINIC SETTINGS
-- =============================================

INSERT INTO clinic_settings (key, value, description) VALUES
  ('booking_window_days', '90', 'How many days ahead patients can book'),
  ('min_notice_hours', '6', 'Minimum hours before appointment that a patient can book same-day'),
  ('default_appointment_duration_minutes', '20', 'Default slot duration in minutes'),
  ('email_from', 'reservations@eurocure.clinic', 'From email address for notifications'),
  ('whatsapp_enabled', 'false', 'Whether WhatsApp notifications are active'),
  ('clinic_name_en', 'EuroCure Polyclinic', 'Clinic name in English'),
  ('clinic_name_ar', 'يوروكيور', 'Clinic name in Arabic'),
  ('clinic_phone', '+20 123 456 7890', 'Main clinic phone number');

-- =============================================
-- SPECIALTIES
-- =============================================

INSERT INTO specialties (id, name_en, name_ar, slug, description_en, description_ar, icon, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Interventional Radiology', 'الأشعة التداخلية', 'interventional-radiology',
   'Minimally invasive, image-guided procedures for diagnosis and treatment.',
   'إجراءات تشخيصية وعلاجية دقيقة بالتوجيه بالصور.',
   'activity', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Surgery', 'الجراحة', 'surgery',
   'Advanced surgical solutions including laser proctology.',
   'حلول جراحية متقدمة تشمل جراحة الليزر لأمراض المستقيم.',
   'scissors', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Dermatology & Aesthetics', 'الجلدية والتجميل', 'dermatology-aesthetics',
   'Comprehensive skin care, dermatology, and aesthetic treatments.',
   'رعاية شاملة للبشرة وعلاجات جلدية وتجميلية.',
   'sparkles', 3);

-- =============================================
-- BRANCHES
-- =============================================

INSERT INTO branches (id, name_en, name_ar, slug, address_en, address_ar, google_maps_url, phone, is_public_branch, display_order) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'EuroCure Nasr City', 'يوروكيور مدينة نصر',
   'eurocure-nasr-city',
   'Center 825, 8th Floor, Medical Tower at Dar Al Fouad Hospital, Intersection of Al Nasr Road with Youssef Abbas, Nasr City, Cairo Governorate 11765',
   'مركز ٨٢٥، الدور الثامن، البرج الطبي بمستشفى دار الفؤاد تقاطع طريق النصر مع يوسف عباس، مدينة نصر، القاهرة ١١٧٦٥',
   'https://maps.app.goo.gl/mdoY9XyKsRBezfCd9',
   NULL,
   TRUE, 1),
  ('b1000000-0000-0000-0000-000000000002',
   'Aspects Clinica — Fifth Settlement', 'أسبكتس كلينيكا — التجمع الخامس',
   'aspects-clinica-fifth-settlement',
   '164 Al Teseen Al Shamali St., Behind the Air Force Hospital, Fifth Settlement, Cairo 11835',
   '١٦٤ ش التسعين الشمالي - خلف المستشفى الجوي، التجمع الخامس ١١٨٣٥',
   'https://maps.app.goo.gl/Cn8Ci874kKfrNdhT8',
   NULL,
   FALSE, 2),
  ('b1000000-0000-0000-0000-000000000003',
   'Sheikh Zayed — In Capital', 'الشيخ زايد — إن كابيتال',
   'sheikh-zayed-in-capital',
   'Sheikh Zayed — In Capital (address to be updated)',
   'الشيخ زايد — إن كابيتال (يُضاف العنوان لاحقاً)',
   NULL,
   NULL,
   FALSE, 3);

-- =============================================
-- ROOMS (EuroCure Nasr City only)
-- =============================================

INSERT INTO rooms (id, branch_id, name_en, name_ar, room_type) VALUES
  ('r1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Clinic 1', 'عيادة ١', 'clinic'),
  ('r1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Clinic 2', 'عيادة ٢', 'clinic'),
  ('r1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Procedure Room', 'غرفة الإجراءات', 'procedure_room');

-- =============================================
-- DOCTORS
-- =============================================

INSERT INTO doctors (id, name_en, name_ar, specialty_id, title_en, title_ar, display_order) VALUES
  ('d1000000-0000-0000-0000-000000000001',
   'Dr. Ahmad Ghait', 'د. أحمد غيث',
   'a1000000-0000-0000-0000-000000000001',
   'Consultant Interventional Radiologist', 'استشاري أشعة تداخلية',
   1),
  ('d1000000-0000-0000-0000-000000000002',
   'Dr. Huda Ezzat', 'د. هدى عزت',
   'a1000000-0000-0000-0000-000000000002',
   'Consultant Laser Proctologist', 'استشارية جراحة الليزر لأمراض المستقيم',
   1),
  ('d1000000-0000-0000-0000-000000000003',
   'Dr. Monica', 'د. مونيكا',
   'a1000000-0000-0000-0000-000000000003',
   'Aesthetic Dermatology Specialist', 'أخصائية الجلدية التجميلية',
   1),
  ('d1000000-0000-0000-0000-000000000004',
   'Dr. Shaimaa', 'د. شيماء',
   'a1000000-0000-0000-0000-000000000003',
   'Dermatology / Aesthetics Doctor', 'طبيبة جلدية وتجميل',
   2),
  ('d1000000-0000-0000-0000-000000000005',
   'Dr. Malak', 'د. ملك',
   'a1000000-0000-0000-0000-000000000003',
   'Skin Specialist', 'أخصائية الجلدية',
   3);

-- =============================================
-- SERVICES
-- =============================================

-- Interventional Radiology
INSERT INTO services (specialty_id, doctor_id, name_en, name_ar, duration_minutes, is_visible_to_patients, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Consultation', 'استشارة', 20, TRUE, 1),
  ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Varicose Vein Treatment', 'علاج دوالي الأوردة', 60, TRUE, 2),
  ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Fibroid Embolization', 'انصمام الأورام الليفية', 90, TRUE, 3),
  ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Prostate Artery Embolization', 'انصمام الشريان البروستاتي', 90, TRUE, 4),
  ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Dialysis Access (Fistula/Catheter)', 'وصول الديلزة (ناسور/قسطرة)', 60, TRUE, 5);

-- Surgery
INSERT INTO services (specialty_id, doctor_id, name_en, name_ar, duration_minutes, is_visible_to_patients, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
   'Consultation', 'استشارة', 20, TRUE, 1),
  ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
   'Laser Hemorrhoid Treatment', 'علاج البواسير بالليزر', 60, TRUE, 2),
  ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
   'Anal Fissure Laser Treatment', 'علاج الشقوق الشرجية بالليزر', 60, TRUE, 3),
  ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
   'Pilonidal Sinus Treatment', 'علاج الجيب العجزي', 60, TRUE, 4);

-- Dermatology & Aesthetics
INSERT INTO services (specialty_id, name_en, name_ar, duration_minutes, is_visible_to_patients, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000003',
   'Dermatology Consultation', 'استشارة جلدية', 20, TRUE, 1),
  ('a1000000-0000-0000-0000-000000000003',
   'Botox Injection', 'حقن البوتوكس', 30, TRUE, 2),
  ('a1000000-0000-0000-0000-000000000003',
   'Filler Injection', 'حقن الفيلر', 45, TRUE, 3),
  ('a1000000-0000-0000-0000-000000000003',
   'Laser Hair Removal', 'إزالة الشعر بالليزر', 60, TRUE, 4),
  ('a1000000-0000-0000-0000-000000000003',
   'Chemical Peel', 'تقشير كيميائي', 45, TRUE, 5),
  ('a1000000-0000-0000-0000-000000000003',
   'Acne Treatment', 'علاج حب الشباب', 30, TRUE, 6),
  ('a1000000-0000-0000-0000-000000000003',
   'Skin Whitening Session', 'جلسة تبييض البشرة', 45, TRUE, 7),
  ('a1000000-0000-0000-0000-000000000003',
   'PRP Therapy', 'علاج البلازما الغنية بالصفائح', 60, TRUE, 8);

-- =============================================
-- DOCTOR SCHEDULE TEMPLATES
-- Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
-- =============================================

-- Dr. Ahmad Ghait
INSERT INTO doctor_schedule_templates (id, doctor_id, branch_id, day_of_week, start_time, end_time) VALUES
  -- Sunday 4PM–10PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   0, '16:00', '22:00'),
  -- Tuesday 4PM–7PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   2, '16:00', '19:00'),
  -- Wednesday 4PM–10PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000003',
   'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   3, '16:00', '22:00'),
  -- Tuesday 7PM–9PM, Aspects Clinica Fifth Settlement
  ('s1000000-0000-0000-0000-000000000004',
   'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   2, '19:00', '21:00'),
  -- Monday 6PM–9PM, Sheikh Zayed
  ('s1000000-0000-0000-0000-000000000005',
   'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003',
   1, '18:00', '21:00');

-- Dr. Huda Ezzat
INSERT INTO doctor_schedule_templates (id, doctor_id, branch_id, day_of_week, start_time, end_time) VALUES
  -- Sunday 6PM–8PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000006',
   'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   0, '18:00', '20:00');

-- Dr. Monica
INSERT INTO doctor_schedule_templates (id, doctor_id, branch_id, day_of_week, start_time, end_time) VALUES
  -- Saturday 6PM–8PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000007',
   'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001',
   6, '18:00', '20:00'),
  -- Wednesday 6PM–8PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000008',
   'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001',
   3, '18:00', '20:00');

-- Dr. Shaimaa
INSERT INTO doctor_schedule_templates (id, doctor_id, branch_id, day_of_week, start_time, end_time) VALUES
  -- Monday 6PM–8PM, EuroCure Nasr City
  ('s1000000-0000-0000-0000-000000000009',
   'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001',
   1, '18:00', '20:00');

-- Dr. Malak: no fixed schedule seeded — admin will add shifts

-- =============================================
-- SCHEDULE ROOM ASSIGNMENTS (EuroCure Nasr City only)
-- =============================================

-- Dr. Ahmad Ghait → Clinic 1 (Sunday at EuroCure)
INSERT INTO schedule_room_assignments (schedule_template_id, room_id) VALUES
  ('s1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001'),
  -- Tuesday at EuroCure
  ('s1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000001'),
  -- Wednesday at EuroCure
  ('s1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000001');

-- Dr. Huda Ezzat → Clinic 2
INSERT INTO schedule_room_assignments (schedule_template_id, room_id) VALUES
  ('s1000000-0000-0000-0000-000000000006', 'r1000000-0000-0000-0000-000000000002');

-- Dr. Monica → Clinic 2 (default assignment; can be changed to Procedure Room)
INSERT INTO schedule_room_assignments (schedule_template_id, room_id) VALUES
  ('s1000000-0000-0000-0000-000000000007', 'r1000000-0000-0000-0000-000000000002'),
  ('s1000000-0000-0000-0000-000000000008', 'r1000000-0000-0000-0000-000000000002');

-- Dr. Shaimaa → Clinic 2
INSERT INTO schedule_room_assignments (schedule_template_id, room_id) VALUES
  ('s1000000-0000-0000-0000-000000000009', 'r1000000-0000-0000-0000-000000000002');
