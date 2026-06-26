-- Aspects Clinica Polyclinic — Seed Data
-- Initial editable data for clinic settings, branch, rooms, specialties, services, doctors, and placeholder schedules.

DELETE FROM schedule_room_assignments;
DELETE FROM doctor_schedule_templates;
DELETE FROM service_doctors;
DELETE FROM services;
DELETE FROM doctors;
DELETE FROM rooms;
DELETE FROM branches;
DELETE FROM specialties;

INSERT INTO clinic_settings (key, value, description) VALUES
  ('booking_window_days', '90', 'How many days ahead patients can book'),
  ('min_notice_hours', '6', 'Minimum hours before appointment that a patient can book same-day'),
  ('default_appointment_duration_minutes', '20', 'Default slot duration in minutes'),
  ('first_come_default_daily_capacity', '10', 'Default capacity for first-come clinic sessions'),
  ('email_from', 'aspectsclinica@gmail.com', 'From email address for notifications'),
  ('whatsapp_enabled', 'false', 'Whether WhatsApp notifications are active'),
  ('clinic_name_en', 'Aspects Clinica', 'Clinic name in English'),
  ('clinic_name_ar', 'أسبكتس كلينيكا', 'Clinic name in Arabic'),
  ('clinic_type_en', 'Polyclinic', 'Clinic type in English'),
  ('clinic_type_ar', 'مركز طبي متعدد التخصصات', 'Clinic type in Arabic'),
  ('clinic_phone', '+20 1212209011', 'Main clinic phone number'),
  ('clinic_whatsapp', '+20 1212209011', 'Main WhatsApp number'),
  ('clinic_email', 'aspectsclinica@gmail.com', 'Main clinic email'),
  ('working_hours_en', 'Saturday to Thursday, 9:00 AM to 11:00 PM', 'Public working hours in English'),
  ('working_hours_ar', 'من السبت إلى الخميس، من ٩ صباحًا إلى ١١ مساءً', 'Public working hours in Arabic')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

INSERT INTO specialties (id, name_en, name_ar, slug, description_en, description_ar, icon, display_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Bariatric Surgery', 'جراحات السمنة', 'bariatric-surgery', 'Bariatric, metabolic, and weight-loss surgery consultations and procedures.', 'استشارات وإجراءات جراحات السمنة والتمثيل الغذائي وإنقاص الوزن.', 'scissors', 1),
  ('a0000000-0000-0000-0000-000000000002', 'General Surgery', 'الجراحة العامة', 'general-surgery', 'General, anorectal, oncological, and day-surgery care.', 'رعاية الجراحة العامة وجراحات الشرج والمستقيم والأورام واليوم الواحد.', 'scissors', 2),
  ('a0000000-0000-0000-0000-000000000003', 'Endoscopy and Laparoscopy', 'المناظير', 'endoscopy-laparoscopy', 'Diagnostic and therapeutic endoscopy and minimally invasive laparoscopy.', 'مناظير تشخيصية وعلاجية وجراحات محدودة التدخل.', 'activity', 3),
  ('a0000000-0000-0000-0000-000000000004', 'One Day Surgery', 'جراحة اليوم الواحد', 'one-day-surgery', 'Selected procedures with equipped surgery and recovery rooms.', 'إجراءات مختارة داخل غرفة عمليات مجهزة وغرف إفاقة.', 'activity', 4),
  ('a0000000-0000-0000-0000-000000000005', 'Cosmetic Dermatology', 'الجلدية التجميلية', 'cosmetic-dermatology', 'Aesthetic dermatology, injectables, peels, PRP, lasers, and skin rejuvenation.', 'الجلدية التجميلية والحقن والتقشير والبلازما والليزر ونضارة البشرة.', 'sparkles', 5),
  ('a0000000-0000-0000-0000-000000000006', 'Laser Hair Removal', 'إزالة الشعر بالليزر', 'laser-hair-removal', 'Laser hair removal with advanced technology including DEKA MOTUS AY.', 'إزالة الشعر بالليزر بتقنيات متقدمة تشمل DEKA MOTUS AY.', 'sparkles', 6),
  ('a0000000-0000-0000-0000-000000000007', 'Plastic Surgery', 'جراحة التجميل', 'plastic-surgery', 'Plastic, reconstructive, and aesthetic surgery consultations and procedures.', 'استشارات وإجراءات جراحة التجميل والترميم.', 'scissors', 7),
  ('a0000000-0000-0000-0000-000000000008', 'Dental Services', 'طب الأسنان', 'dental-services', 'Dental care, pediatric dentistry, orthodontics, and cosmetic dentistry.', 'خدمات الأسنان وطب أسنان الأطفال وتقويم الأسنان وطب الأسنان التجميلي.', 'activity', 8),
  ('a0000000-0000-0000-0000-000000000009', 'Cosmetic Gynecology', 'التجميل النسائي', 'cosmetic-gynecology', 'Women-focused aesthetic and procedural care.', 'رعاية تجميلية وإجرائية مخصصة للسيدات.', 'sparkles', 9),
  ('a0000000-0000-0000-0000-000000000010', 'Vascular Surgery', 'جراحة الأوعية الدموية', 'vascular-surgery', 'Vascular assessment and surgical care.', 'تقييم ورعاية جراحية للأوعية الدموية.', 'activity', 10),
  ('a0000000-0000-0000-0000-000000000011', 'Pain Relief', 'تخفيف الآلام', 'pain-relief', 'Pain management and supportive procedures.', 'إدارة الألم والإجراءات الداعمة لتخفيف الآلام.', 'activity', 11),
  ('a0000000-0000-0000-0000-000000000012', 'Oculoplasty', 'جراحة العين التجميلية', 'oculoplasty', 'Aesthetic and reconstructive procedures around the eye.', 'إجراءات تجميلية وترميمية حول العين.', 'sparkles', 12),
  ('a0000000-0000-0000-0000-000000000013', 'Nutrition', 'التغذية', 'nutrition', 'Nutrition plans, weight management, and lifestyle support.', 'خطط التغذية وإدارة الوزن ودعم نمط الحياة.', 'activity', 13),
  ('a0000000-0000-0000-0000-000000000014', 'Internal Medicine', 'الباطنة', 'internal-medicine', 'Routine examination, diagnosis, and medical treatment.', 'الكشف الروتيني والتشخيص والعلاج الطبي.', 'activity', 14),
  ('a0000000-0000-0000-0000-000000000015', 'Pediatrics', 'طب الأطفال', 'pediatrics', 'Pediatric and newborn care.', 'رعاية الأطفال وحديثي الولادة.', 'activity', 15),
  ('a0000000-0000-0000-0000-000000000016', 'ENT', 'طب الأنف والأذن والحنجرة', 'ent', 'Ear, nose, and throat care.', 'رعاية الأنف والأذن والحنجرة.', 'activity', 16),
  ('a0000000-0000-0000-0000-000000000017', 'Physiotherapy', 'العلاج الطبيعي', 'physiotherapy', 'Rehabilitation and physiotherapy services.', 'خدمات العلاج الطبيعي والتأهيل.', 'activity', 17),
  ('a0000000-0000-0000-0000-000000000018', 'Neurosurgery', 'جراحة المخ والأعصاب', 'neurosurgery', 'Neurosurgical assessment and care.', 'تقييم ورعاية جراحة المخ والأعصاب.', 'activity', 18),
  ('a0000000-0000-0000-0000-000000000019', 'Ultrasound', 'الموجات فوق الصوتية', 'ultrasound', 'Diagnostic ultrasound services.', 'خدمات الموجات فوق الصوتية التشخيصية.', 'activity', 19),
  ('a0000000-0000-0000-0000-000000000020', 'Laboratory Services', 'خدمات المختبر', 'laboratory-services', 'Laboratory testing support.', 'خدمات وتحاليل المختبر.', 'activity', 20),
  ('a0000000-0000-0000-0000-000000000021', 'Oncology', 'علاج الأورام', 'oncology', 'Oncology assessment and treatment coordination.', 'تقييم الأورام وتنسيق العلاج.', 'activity', 21),
  ('a0000000-0000-0000-0000-000000000022', 'Cardiology', 'القلب والأوعية الدموية', 'cardiology', 'Cardiology and vascular medical care.', 'رعاية القلب والأوعية الدموية.', 'activity', 22),
  ('a0000000-0000-0000-0000-000000000023', 'Orthopedic Surgery', 'جراحة العظام', 'orthopedic-surgery', 'Orthopedic surgical assessment and treatment.', 'تقييم وعلاج جراحة العظام.', 'activity', 23),
  ('a0000000-0000-0000-0000-000000000024', 'Interventional Radiology', 'الأشعة التداخلية', 'interventional-radiology', 'Image-guided diagnostic and therapeutic procedures.', 'إجراءات تشخيصية وعلاجية موجهة بالتصوير.', 'activity', 24),
  ('a0000000-0000-0000-0000-000000000025', 'Anesthesiology', 'التخدير', 'anesthesiology', 'Anesthesia planning and perioperative care.', 'تخطيط التخدير والرعاية حول العمليات.', 'activity', 25)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, slug = EXCLUDED.slug,
  description_en = EXCLUDED.description_en, description_ar = EXCLUDED.description_ar,
  icon = EXCLUDED.icon, display_order = EXCLUDED.display_order, is_active = TRUE;

INSERT INTO branches (id, name_en, name_ar, slug, address_en, address_ar, google_maps_url, phone, is_public_branch, display_order) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'Aspects Clinica', 'أسبكتس كلينيكا', 'aspects-clinica',
   'Building 164, between CMC and Shifa Hospital, Mews Cafe entrance, third floor, right of the elevator.',
   'مبنى ١٦٤، ما بين CMC ومستشفى شفا، مدخل Mews Cafe، الدور التالت يمين الأسانسير',
   'https://maps.app.goo.gl/dnhEKCGSz1JF7FeR7',
   '+20 1212209011',
   TRUE, 1)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, slug = EXCLUDED.slug,
  address_en = EXCLUDED.address_en, address_ar = EXCLUDED.address_ar,
  google_maps_url = EXCLUDED.google_maps_url, phone = EXCLUDED.phone,
  is_public_branch = EXCLUDED.is_public_branch, display_order = EXCLUDED.display_order, is_active = TRUE;

INSERT INTO rooms (id, branch_id, name_en, name_ar, room_type) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Clinic 1', 'عيادة ١', 'clinic'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Clinic 2', 'عيادة ٢', 'clinic'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Clinic 3', 'عيادة ٣', 'clinic'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Clinic 4', 'عيادة ٤', 'clinic'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Clinic 5', 'عيادة ٥', 'clinic'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Clinic 6', 'عيادة ٦', 'clinic'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Clinic 7', 'عيادة ٧', 'clinic'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Laser Room 1', 'غرفة ليزر ١', 'laser'),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'Laser Room 2', 'غرفة ليزر ٢', 'laser'),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'Surgery / Operation Room', 'غرفة العمليات', 'surgery'),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'Recovery Room 1', 'غرفة إفاقة ١', 'recovery'),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'Recovery Room 2', 'غرفة إفاقة ٢', 'recovery'),
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'Reception 1', 'استقبال ١', 'reception'),
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'Reception 2', 'استقبال ٢', 'reception'),
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'Coffee Corner', 'ركن القهوة', 'other')
ON CONFLICT (id) DO UPDATE SET
  branch_id = EXCLUDED.branch_id, name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
  room_type = EXCLUDED.room_type, is_active = TRUE;

INSERT INTO doctors (id, name_en, name_ar, specialty_id, title_en, title_ar, bio_en, bio_ar, photo_url, consultation_fee, display_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Dr. Mohamed Shawky', 'د. محمد شوقي', 'a0000000-0000-0000-0000-000000000014', 'Internal Medicine', 'الباطنة', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 1),
  ('d0000000-0000-0000-0000-000000000002', 'Dr. Mahmoud Wahba', 'د. محمود وهبة', 'a0000000-0000-0000-0000-000000000003', 'Gastroenterology', 'الجهاز الهضمي والمناظير', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 2),
  ('d0000000-0000-0000-0000-000000000003', 'Dr. Mostafa Dawaba', 'د. مصطفى دوابة', 'a0000000-0000-0000-0000-000000000008', 'Orthodontics', 'تقويم الأسنان', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 3),
  ('d0000000-0000-0000-0000-000000000004', 'Dr. Reem Essam Elkady', 'د. ريم عصام القاضي', 'a0000000-0000-0000-0000-000000000008', 'Pedodontics / Pediatric Dentistry', 'طب أسنان الأطفال', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 4),
  ('d0000000-0000-0000-0000-000000000005', 'Dr. Abdelrahman Elmarakby', 'د. عبد الرحمن المركبي', 'a0000000-0000-0000-0000-000000000022', 'Cardiology', 'القلب والأوعية الدموية', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 5),
  ('d0000000-0000-0000-0000-000000000006', 'Dr. Sherif Abdelazeem', 'د. شريف عبد العظيم', 'a0000000-0000-0000-0000-000000000023', 'Orthopedic Surgery', 'جراحة العظام', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 6),
  ('d0000000-0000-0000-0000-000000000007', 'Dr. Nabeel Anwar', 'د. نبيل أنور', 'a0000000-0000-0000-0000-000000000023', 'Orthopedic Surgery', 'جراحة العظام', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 7),
  ('d0000000-0000-0000-0000-000000000008', 'Dr. Yasser Elbasatiny', 'د. ياسر البساتيني', 'a0000000-0000-0000-0000-000000000001', 'Bariatric, Oncological & Laparoscopic Surgery', 'جراحات السمنة والأورام والمناظير', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 8),
  ('d0000000-0000-0000-0000-000000000009', 'Dr. Ehab Abdelmageed Lotfy', 'د. إيهاب عبد المجيد لطفي', 'a0000000-0000-0000-0000-000000000002', 'General Surgery', 'الجراحة العامة', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 9),
  ('d0000000-0000-0000-0000-000000000010', 'Dr. Sherin Mansour Mokhtar', 'د. شيرين منصور مختار', 'a0000000-0000-0000-0000-000000000005', 'Aesthetic Dermatology & Laser Therapy', 'الجلدية التجميلية والليزر', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 10),
  ('d0000000-0000-0000-0000-000000000011', 'Dr. Sherif Refaat Ismail', 'د. شريف رفعت إسماعيل', 'a0000000-0000-0000-0000-000000000005', 'Aesthetic Dermatology & Laser Therapy', 'الجلدية التجميلية والليزر', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 11),
  ('d0000000-0000-0000-0000-000000000012', 'Dr. Ahmed Ghait', 'د. أحمد غيث', 'a0000000-0000-0000-0000-000000000024', 'Interventional Radiology', 'الأشعة التداخلية', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 12),
  ('d0000000-0000-0000-0000-000000000013', 'Dr. Ghada Habib', 'د. غادة حبيب', 'a0000000-0000-0000-0000-000000000019', 'Radiology', 'الأشعة', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 13),
  ('d0000000-0000-0000-0000-000000000014', 'Dr. Wael Elattal', 'د. وائل العتال', 'a0000000-0000-0000-0000-000000000007', 'Plastic Surgery', 'جراحة التجميل', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 14),
  ('d0000000-0000-0000-0000-000000000015', 'Dr. Ahmed Kenawy', 'د. أحمد كيناوي', 'a0000000-0000-0000-0000-000000000007', 'Plastic Surgery', 'جراحة التجميل', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 15),
  ('d0000000-0000-0000-0000-000000000016', 'Dr. Amany Hosny', 'د. أماني حسني', 'a0000000-0000-0000-0000-000000000013', 'Nutrition', 'التغذية العلاجية', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 16),
  ('d0000000-0000-0000-0000-000000000017', 'Dr. Salah Tawfik', 'د. صلاح توفيق', 'a0000000-0000-0000-0000-000000000025', 'Anesthesiology', 'التخدير', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 17),
  ('d0000000-0000-0000-0000-000000000018', 'Dr. Hanan Amer', 'د. حنان عامر', 'a0000000-0000-0000-0000-000000000025', 'Anesthesiology', 'التخدير', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 18),
  ('d0000000-0000-0000-0000-000000000019', 'Dr. Gina Hussein', 'د. جينا حسين', 'a0000000-0000-0000-0000-000000000015', 'Pediatrics & Newborn', 'طب الأطفال وحديثي الولادة', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 19),
  ('d0000000-0000-0000-0000-000000000020', 'Dr. Reda Mohamed', 'د. رضا محمد', 'a0000000-0000-0000-0000-000000000016', 'ENT', 'الأنف والأذن والحنجرة', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 20),
  ('d0000000-0000-0000-0000-000000000021', 'Dr. Sherif Mekawy', 'د. شريف مكاوي', 'a0000000-0000-0000-0000-000000000016', 'ENT', 'الأنف والأذن والحنجرة', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 21),
  ('d0000000-0000-0000-0000-000000000022', 'Dr. Menna Amr', 'د. منة عمرو', 'a0000000-0000-0000-0000-000000000014', 'Medical Intern', 'طبيب امتياز', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 22),
  ('d0000000-0000-0000-0000-000000000023', 'Dr. Yahya Yasser', 'د. يحيى ياسر', 'a0000000-0000-0000-0000-000000000014', 'Medical Intern', 'طبيب امتياز', 'Aspects Clinica doctor profile. Bio, fee, photo, and schedule are editable from the admin dashboard.', 'ملف طبيب في أسبكتس كلينيكا. يمكن تعديل النبذة والرسوم والصورة والمواعيد من لوحة التحكم.', NULL, NULL, 23)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, specialty_id = EXCLUDED.specialty_id,
  title_en = EXCLUDED.title_en, title_ar = EXCLUDED.title_ar,
  bio_en = EXCLUDED.bio_en, bio_ar = EXCLUDED.bio_ar,
  consultation_fee = EXCLUDED.consultation_fee, display_order = EXCLUDED.display_order, is_active = TRUE;

INSERT INTO services (id, specialty_id, name_en, name_ar, duration_minutes, fee, is_visible_to_patients, display_order) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000014', 'Consultation', 'كشف', 20, NULL, TRUE, 1),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'Hydrafacial', 'هيدرا فيشل للوجه', 20, NULL, TRUE, 2),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'Fractional Laser', 'الفركشنال ليزر', 20, NULL, TRUE, 3),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'Filler and Botox', 'الفيلر والبوتوكس', 20, NULL, TRUE, 4),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Hair Transplant', 'زراعة الشعر', 20, NULL, TRUE, 5),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000007', 'Breast Implants', 'زراعة الثدي', 20, NULL, TRUE, 6),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Liposuction', 'شفط الدهون', 20, NULL, TRUE, 7),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000007', 'Fat Injection', 'حقن الدهون', 20, NULL, TRUE, 8),
  ('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000005', 'Threads', 'الخيوط', 20, NULL, TRUE, 9),
  ('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000005', 'Peeling', 'التقشير', 20, NULL, TRUE, 10),
  ('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000005', 'PRP', 'البلازما الغنية بالصفائح', 20, NULL, TRUE, 11),
  ('f0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000005', 'Mesotherapy', 'الميزوثيرابي', 20, NULL, TRUE, 12),
  ('f0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000021', 'Oncology', 'علاج الأورام', 20, NULL, TRUE, 13),
  ('f0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'Appendectomy', 'استئصال الزائدة الدودية', 20, NULL, TRUE, 14),
  ('f0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000002', 'Cholecystectomy', 'استئصال المرارة', 20, NULL, TRUE, 15),
  ('f0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000002', 'Hernia Repair', 'إصلاح الفتق', 20, NULL, TRUE, 16),
  ('f0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000003', 'Upper Endoscopy', 'التنظير العلوي', 20, NULL, TRUE, 17),
  ('f0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000003', 'Colonoscopy', 'تنظير القولون', 20, NULL, TRUE, 18),
  ('f0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000003', 'Enteroscopy', 'التنظير المعوي', 20, NULL, TRUE, 19),
  ('f0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000006', 'DEKA MOTUS AY Laser Hair Removal', 'إزالة الشعر بالليزر DEKA MOTUS AY', 20, NULL, TRUE, 20)
ON CONFLICT (id) DO UPDATE SET
  specialty_id = EXCLUDED.specialty_id, name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
  duration_minutes = EXCLUDED.duration_minutes, fee = EXCLUDED.fee,
  is_visible_to_patients = EXCLUDED.is_visible_to_patients, display_order = EXCLUDED.display_order, is_active = TRUE;

INSERT INTO doctor_schedule_templates (id, doctor_id, branch_id, day_of_week, start_time, end_time, is_active) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 6, '09:00', '11:00', FALSE)
ON CONFLICT (id) DO UPDATE SET
  doctor_id = EXCLUDED.doctor_id, branch_id = EXCLUDED.branch_id, day_of_week = EXCLUDED.day_of_week,
  start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = EXCLUDED.is_active;

INSERT INTO schedule_room_assignments (schedule_template_id, room_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (schedule_template_id, room_id) DO NOTHING;
