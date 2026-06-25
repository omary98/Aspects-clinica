# EuroCure — Polyclinic Online Reservation Platform

A production-ready appointment booking system for EuroCure Polyclinic (Nasr City, Cairo). Patients browse specialists and self-book online; admins manage everything through a secure Arabic/English dashboard.

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Supabase (Postgres + RLS + Auth) · Resend (email) · Vercel  
**Languages:** Arabic (default, RTL) and English (toggle in navbar)

---

## Table of Contents

1. [Features](#features)
2. [Local Setup (Developers)](#local-setup)
3. [Supabase Setup — Step by Step](#supabase-setup)
4. [Environment Variables](#environment-variables)
5. [Vercel Deployment](#vercel-deployment)
6. [Admin Onboarding Guide](#admin-onboarding-guide)
7. [Booking Rules & Conflict Logic](#booking-rules)
8. [Security Model](#security-model)
9. [Project Structure](#project-structure)
10. [Known Limitations](#known-limitations)

---

## Features

### Patient-Facing
- Arabic-first landing page with specialty cards and doctor profiles
- 4-step booking form: choose doctor → pick date/time → enter details → review
- Available time slots calculated in real time (respects 6-hour notice, schedule, blocked times)
- Arabic and English booking confirmation emails
- Language toggle (Arabic ↔ English) in the navbar

### Admin Dashboard (`/admin`)
- Full CRUD: doctors, specialties, branches, rooms, services, schedules, blocked times
- Appointment list with date range + doctor + branch + status filters
- Appointment detail with status history timeline
- Status management: Reserve → Confirm → Attended / No Show / Rescheduled / Cancelled
- Manual appointment creation (walk-in / phone bookings)
- Role-based access: Medical Director (full) vs Reception Head (operational)
- Mini-CMS for branding, homepage copy, landing backgrounds, doctor photos, specialty images, and media library uploads

### Booking Safety
- DB triggers enforce zero doctor overlap and zero room double-booking
- Server-side validation of notice period and booking window (cannot be bypassed via direct API calls)
- Appointment snapshots: `duration_at_booking` and `fee_at_booking` never recalculated
- Cancelled / rescheduled appointments free their slots immediately

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works for development)
- A Resend account for email (optional in development — booking still works)

### Steps

```bash
# 1. Clone and install
cd eurocure
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# 3. Start the dev server
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) for the patient site.  
Admin dashboard: [http://localhost:4000/admin](http://localhost:4000/admin)

---

## Supabase Setup

Follow these steps exactly, in order.

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `eurocure-prod`), a strong database password, and the region closest to Egypt (e.g. `eu-west-1` or `me-central-1`)
3. Wait ~2 minutes for the project to provision

### Step 2 — Get your API keys

In the Supabase dashboard, go to **Project Settings → API**.

Copy these three values — you will need them in Step 6:

| Key | Where |
|---|---|
| **Project URL** | `https://xxxx.supabase.co` |
| **`anon` public key** | Under "Project API keys" → `anon` |
| **`service_role` secret key** | Under "Project API keys" → `service_role` — **keep this private** |

### Step 3 — Run the database migrations

In the Supabase dashboard, open **SQL Editor** → **New query**.

Run each file below **in order** — paste the full contents and click **Run**:

1. `supabase/migrations/001_initial_schema.sql` — all tables, triggers, and RLS policies
2. `supabase/migrations/002_seed_data.sql` — branches, rooms, doctors, services, and schedules
3. `supabase/migrations/003_production_hardening.sql` — security patches and performance indexes
4. `supabase/migrations/004_api_grants.sql` — grants required for Supabase REST/API writes
5. `supabase/migrations/005_cms_media.sql` — mini-CMS tables, media library, and Storage policies

> **Important:** Run them in this order. Each file depends on the previous one.

### Step 3b — Supabase Storage for CMS media

Migration `005_cms_media.sql` creates the public bucket automatically:

| Bucket | Purpose |
|---|---|
| `site-assets` | Public logos, doctor photos, landing backgrounds, specialty images, and general CMS media |

The app stores files in these folders:

- `branding/`
- `doctors/`
- `landing/`
- `specialties/`
- `general/`

The migration also adds Storage policies:

- Public read access for files in `site-assets`
- Admin-only upload, update, and delete access
- A 5 MB file limit
- Allowed image types: PNG, JPG/JPEG, WEBP, GIF

If Supabase reports a storage policy or bucket error, rerun only `005_cms_media.sql` in the SQL Editor.

### Step 4 — Create the first admin user

1. In the Supabase dashboard, go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter the admin's email and a strong password (12+ characters)
4. Click **Create user** and **copy the User UID** shown in the user list

Then in **SQL Editor**, run:

```sql
INSERT INTO admin_profiles (user_id, full_name, email, role, is_active, notifications_enabled)
VALUES (
  'PASTE-THE-USER-UID-HERE',     -- from Authentication → Users
  'Dr. Ahmad Ghait',             -- admin's display name
  'admin@eurocure.clinic',       -- must match the email used above
  'medical_director',            -- or 'reception_head'
  true,
  true
);
```

The admin can now log in at `/admin/login`.

### Step 5 — Add a second admin (Reception Head)

Repeat Step 4 for each staff member, changing `role` to `'reception_head'`:

```sql
INSERT INTO admin_profiles (user_id, full_name, email, role, is_active, notifications_enabled)
VALUES (
  'PASTE-SECOND-USER-UID-HERE',
  'Receptionist Name',
  'reception@eurocure.clinic',
  'reception_head',
  true,
  true
);
```

### Step 6 — Configure email sender (Resend)

1. Go to [resend.com](https://resend.com) → **API Keys → Create API Key**
2. Go to **Domains** → add and verify your clinic domain (e.g. `eurocure.clinic`)
3. Set `EMAIL_FROM` to `reservations@eurocure.clinic` (must match the verified domain)

> Without a Resend API key the app still works — emails simply won't be sent. Bookings are saved to the database regardless.

### Step 7 — Verify RLS is working (optional but recommended)

After running migration 003, verify that patient data is private by running this in SQL Editor:

```sql
-- Should return 0 rows when queried with anon key
-- (RLS blocks public reads on appointments after migration 003)
SET ROLE anon;
SELECT count(*) FROM appointments;
RESET ROLE;
```

Expected result: `0`

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key — safe to expose in browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key — **never expose in client code** |
| `RESEND_API_KEY` | Recommended | Resend API key for sending emails |
| `EMAIL_FROM` | Recommended | Verified sender email (e.g. `reservations@eurocure.clinic`) |
| `APP_BASE_URL` | ✅ | Your deployment URL — `https://eurocure.vercel.app` in production |
| `CRON_SECRET` | Optional | Random string for securing cron job endpoints (needed for reminders) |
| `WHATSAPP_PROVIDER_PLACEHOLDER_KEY` | Optional | Placeholder — WhatsApp integration not active yet |

**Security rules:**
- `SUPABASE_SERVICE_ROLE_KEY` must **only** be in server-side environment variables
- In Vercel, mark it as **Sensitive** and **do not expose to the browser**
- Never commit `.env.local` to git — it is listed in `.gitignore`

---

## Vercel Deployment

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_ORG/eurocure.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. **Important:** Set **Root Directory** to `eurocure` (the Next.js app is in a subdirectory)
4. Leave Framework Preset as **Next.js**
5. Click **Deploy** — first deploy will fail until you add env vars (that's OK)

### Step 3 — Add environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key | Production, Preview, Development |
| `RESEND_API_KEY` | your Resend key | Production |
| `EMAIL_FROM` | `reservations@eurocure.clinic` | Production |
| `APP_BASE_URL` | `https://your-project.vercel.app` | Production |
| `CRON_SECRET` | random 32-char string | Production |

### Step 4 — Supabase Auth redirect URL

In Supabase dashboard → **Authentication → URL Configuration**:
- Add your Vercel URL to **Redirect URLs**: `https://your-project.vercel.app/auth/callback`

### Step 5 — Re-deploy

Go to Vercel → **Deployments** → click **Redeploy** on the latest deployment.

### Step 6 — Test production booking

1. Open `https://your-project.vercel.app`
2. Book an appointment with a real email address
3. Confirm the email arrives
4. Log in at `/admin/login` and check the appointment appears

---

## Admin Onboarding Guide

This section is for clinic staff. No coding knowledge is needed.

### Logging In

Go to `https://your-domain.com/admin/login` and enter your email and password. If you forget your password, contact your IT administrator to reset it in Supabase.

---

### Website Content and Media

Medical Directors can edit the public website from the admin dashboard:

| Page | URL | What it controls |
|---|---|---|
| Branding | `/admin/branding` | Main logo, header logo, footer logo, favicon URL, primary/accent/background colors |
| Site Content | `/admin/site-content` | Hero text, CTA text, about section, why-choose-us section, contact/footer text, landing backgrounds |
| Media Library | `/admin/media-library` | Upload, preview, copy URLs, and delete unused images |
| Specialties Content | `/admin/specialties-content` | Specialty names, Arabic/English descriptions, icons, images, visibility, display order |
| Doctors | `/admin/doctors` | Doctor names, titles, bios, detailed descriptions, fees, photos, visibility, display order |

Reception Head users should continue using operational pages such as appointments, schedules, branches, services, and blocked times. Branding, site content, and media uploads are enforced server-side for Medical Director access.

### Uploading EuroCure Logos

1. Log in as a Medical Director.
2. Open `/admin/branding`.
3. Upload the main, header, or footer logo.
4. Click **Save Branding**.

The public homepage and booking page use the uploaded header logo when available. The footer uses the uploaded footer logo when available.

### Uploading Doctor Photos

1. Open `/admin/doctors`.
2. Add or edit a doctor.
3. Upload the doctor photo.
4. Save the doctor.

Doctor photos are uploaded to `site-assets/doctors/` and the public doctor cards use the saved database URL. If no photo exists, the site shows a clean initials placeholder.

### Editing Homepage Content and Background Images

1. Open `/admin/site-content`.
2. Edit English and Arabic fields for hero, about, why choose us, CTA, contact, and footer sections.
3. Upload the hero or CTA background image if needed.
4. Click **Save Site Content**.

The public homepage falls back to built-in text if a content field is blank or inactive.

### Managing the Media Library

Use `/admin/media-library` to upload images into a category, copy public URLs, or delete unused images. Deletion is blocked if the image is currently used as a logo, doctor photo, or specialty image.

### Troubleshooting CMS / Upload Errors

| Symptom | Fix |
|---|---|
| `Could not find the table 'public.site_assets'` | Run `supabase/migrations/005_cms_media.sql` |
| `Could not find the table 'public.specialties' in the schema cache` | Run migrations `001` through `005`, then refresh the Supabase API schema cache by waiting ~1 minute or restarting the local server |
| `server database key cannot write admin data` | Confirm `SUPABASE_SERVICE_ROLE_KEY` is the service role JWT for the same project, then run `004_api_grants.sql` |
| Upload says only certain images are supported | Use PNG, JPG/JPEG, WEBP, or GIF under 5 MB |
| Media delete is blocked | Remove the image from Branding, Doctors, or Specialties first |

### How to Add a Doctor

1. Go to **Doctors** in the left sidebar
2. Click **Add Doctor**
3. Fill in:
   - **Name (English)** and **Name (Arabic)** — shown on the website
   - **Specialty** — the doctor's medical field
   - **Title (English)** and **Title (Arabic)** — e.g. "Consultant Interventional Radiologist"
   - **Consultation Fee** (optional) — shown on doctor cards
   - **Photo URL** (optional) — direct link to doctor photo
4. Click **Save**

After adding the doctor, you must also add their **Schedule** (see below).

---

### How to Add a Branch / Location

1. Go to **Branches** in the sidebar
2. Click **Add Branch**
3. Fill in the name, address, Google Maps link, and phone number
4. Toggle **Public Branch** ON if this branch should appear on the website for all patients. Toggle it OFF for doctor-specific external locations (e.g. Aspects Clinica is OFF — only Dr. Ahmad Ghait works there)
5. Click **Save**

---

### How to Add a Service or Procedure

1. Go to **Services** in the sidebar
2. Click **Add Service**
3. Fill in:
   - **Name** (Arabic and English)
   - **Specialty** — which specialty this service belongs to
   - **Doctor** (optional) — leave blank if the service is available with all doctors in that specialty
   - **Duration (minutes)** — used to calculate time slots (e.g. 20 for consultation, 60 for procedures)
   - **Fee** (optional)
   - **Visible to patients** — ON means patients can select this service during booking
4. Click **Save**

> Important: Duration is "locked in" at the time of booking (`duration_at_booking`). If you later change the duration of a service, it does **not** affect existing appointments.

---

### How to Add a Schedule

Schedules define when a doctor is available at a specific branch.

1. Go to **Schedules** in the sidebar
2. Click **Add Schedule**
3. Select:
   - **Doctor**
   - **Branch**
   - **Day of Week** (e.g. Sunday, Tuesday)
   - **Start Time** and **End Time** (e.g. 16:00 – 22:00)
4. After saving, click **Assign Rooms** to link the schedule to a room (for EuroCure Nasr City only — rooms are not needed for external locations)
5. Click **Save**

A doctor can have multiple schedules (different days, different branches).

---

### How to Assign Rooms

1. Go to **Schedules** → find the schedule entry → click **Edit**
2. Scroll to **Room Assignments** and select the room(s) for that session
3. Click **Save**

The system will prevent two appointments from being booked in the same room at the same time (room double-booking is blocked automatically).

---

### How to Block a Holiday or Time Off

1. Go to **Blocked Times** in the sidebar
2. Click **Block Date / Time**
3. Select:
   - **Date**
   - **Full Day** — blocks all appointments on that day
   - OR set **Start Time** and **End Time** for a partial block
   - **Scope** — optionally limit to a specific doctor, room, or branch
   - **Reason** — internal note (e.g. "National Holiday")
4. Click **Save**

Blocked times appear in the availability calendar and no slots will be offered to patients during the blocked period.

---

### How to Review Reservations

1. Go to **Appointments** in the sidebar
2. Use the filters at the top to narrow by date, status, doctor, or branch
3. Click **Today** to jump to today's appointments
4. Click any appointment row to see full details

---

### How to Confirm an Appointment

1. Open the appointment detail page
2. Click **Confirm** (blue button)
3. Status changes from **Reserved** → **Confirmed**

---

### How to Mark Attended or No-Show

After the appointment time has passed:
1. Open the appointment detail page
2. Click **Mark Attended** (green) if the patient showed up
3. Click **No Show** (red) if they did not appear

---

### How to Reschedule an Appointment

Rescheduling frees the current time slot but does NOT automatically create a new appointment — you must create a new one manually.

1. Open the appointment detail page
2. Click **Reschedule** (purple)
3. Check **"Confirmed appointment change with patient"** checkbox
4. Click **Confirm Reschedule** — the slot is now free
5. Go to **Appointments → New Appointment** to create the rescheduled booking

---

### How to Cancel an Appointment

1. Open the appointment detail page
2. Click **Cancel** (gray)
3. Enter a reason (optional) and confirm
4. The time slot is immediately freed and available for new bookings

---

### How to Add a Walk-in or Phone Booking

1. Go to **Appointments** in the sidebar
2. Click **New Appointment** (top right)
3. Fill in the doctor, branch, date, time slot, and patient details
4. Set **Initial Status** to:
   - **Confirmed** — for appointments where the patient is ready
   - **Reserved** — if the booking is tentative
5. Click **Create Appointment**

Walk-in bookings created by admins follow the same conflict rules as online bookings. The 6-hour notice rule is waived for admin-created appointments.

---

### Clinic Settings

Go to **Settings** to adjust:
- **Booking window** — how many days ahead patients can book (default: 90 days)
- **Minimum notice hours** — how many hours before a slot can be booked same-day (default: 6 hours)
- **Default appointment duration** — used when no service is selected (default: 20 minutes)

Changes take effect immediately for new bookings.

---

## Booking Rules

### Rules enforced at the application layer (API routes)

| Rule | Validation |
|---|---|
| Date cannot be in the past | Server checks `appointment_date >= today` |
| Date cannot exceed booking window | Server checks `appointment_date <= today + bookingWindowDays` |
| Minimum notice | Server checks `slot_datetime >= now + minNoticeHours` |
| Valid UUID for doctor/branch/service | Server validates format |
| Patient name ≤ 100 chars | Server trims and enforces |

### Rules enforced at the database layer (triggers)

| Rule | Trigger |
|---|---|
| No two active appointments for the same doctor at overlapping times | `trg_check_doctor_overlap` |
| No room double-booking for active appointments | `trg_check_room_overlap` |

"Active" means status is `reserved` or `confirmed`. Cancelled, rescheduled, attended, and no-show appointments do **not** block slots.

### Booking window enforcement

Patients see only dates within the booking window (90 days by default). Even if a patient submits a date outside the window directly to the API, the server rejects it with a 400 error.

### Same-day notice

Slots within 6 hours of "now" are hidden in the booking UI **and** rejected server-side. The admin manual booking bypasses this rule (useful for walk-in reception).

---

## Security Model

### RLS (Row Level Security) — what is public vs private

| Table | Anon / Public | Authenticated Admin |
|---|---|---|
| `appointments` | ❌ No access | ✅ Full access (via `is_admin()`) |
| `appointment_rooms` | ❌ No access | ✅ Read + managed by service role |
| `doctors`, `specialties`, `branches` | ✅ Read (active only) | ✅ Full CRUD |
| `services` | ✅ Read (active + visible) | ✅ Full CRUD |
| `clinic_settings` | ✅ Read | ✅ Full CRUD |
| `admin_profiles` | ❌ No access | ✅ Own row + Medical Director full |
| `notification_logs` | ❌ No access | ✅ Read |

### How bookings are protected

- Booking is submitted to `/api/book` — a Next.js server route
- The server uses `SUPABASE_SERVICE_ROLE_KEY` to write to the database
- The service role key **never leaves the server** — it is not in any client-side bundle
- Supabase RLS blocks direct REST API inserts from the anon key (migration 003 removes the public INSERT policy)
- DB triggers independently enforce doctor and room overlap even if the application layer is bypassed

### Admin authentication

- All `/admin/*` routes are guarded by the Admin Layout (`src/app/admin/layout.tsx`)
- The layout calls `supabase.auth.getUser()` server-side and checks `admin_profiles.is_active`
- Unauthenticated users are redirected to `/admin/login`
- Role checks are server-side (not just hidden UI)

---

## Project Structure

```
eurocure/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Landing page (server, reads lang cookie)
│   │   ├── layout.tsx                 # Root layout (Cairo font, RTL, LanguageProvider)
│   │   ├── book/
│   │   │   ├── page.tsx               # Booking form page
│   │   │   └── confirmation/page.tsx  # Post-booking confirmation
│   │   ├── admin/                     # Admin dashboard (all routes auth-guarded)
│   │   │   ├── layout.tsx             # Auth check + sidebar
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── appointments/          # List + detail
│   │   │   └── ...                    # Doctors, branches, rooms, etc.
│   │   └── api/
│   │       ├── book/route.ts          # POST — patient booking (service role)
│   │       ├── admin/book/route.ts    # POST — admin manual booking (service role, auth required)
│   │       └── availability/route.ts  # GET — slot availability (service role)
│   ├── components/
│   │   ├── public/                    # Patient-facing UI
│   │   ├── admin/                     # Admin manager components
│   │   └── ui/                        # Shared shadcn-style primitives
│   ├── lib/
│   │   ├── supabase/                  # Browser / server / service clients
│   │   ├── email/resend.ts            # Bilingual email templates
│   │   ├── notifications/             # WhatsApp placeholder
│   │   ├── availability.ts            # Slot generation + filtering logic
│   │   └── i18n/                      # Arabic / English translation objects
│   └── types/database.ts              # TypeScript types for all tables
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql     # Schema, triggers, RLS
│   │   ├── 002_seed_data.sql          # Initial doctors, branches, services
│   │   └── 003_production_hardening.sql  # Security fixes + indexes
│   └── tests/
│       └── booking_qa.sql             # Automated QA test DO block
├── .env.example
├── .gitignore
└── README.md
```

---

## Known Limitations

| Area | Current State | Path to Resolve |
|---|---|---|
| **WhatsApp notifications** | Payload logged to `notification_logs`, not sent | Connect a WhatsApp Business API provider and implement `src/lib/notifications/whatsapp-placeholder.ts` |
| **Reminder emails** | `sendReminderEmail()` is implemented but no cron triggers it | Create a Vercel Cron Job at `/api/cron/reminders` that calls `sendReminderEmail()` for appointments tomorrow and today; guard with `CRON_SECRET` |
| **Rescheduling** | Marks slot as rescheduled and requires manual re-booking | A future improvement would auto-open the booking form pre-filled with patient details |
| **Patient accounts** | Patients do not have accounts; no login required to book | Could add optional phone/email verification for repeat patients |
| **Room assignment at external branches** | No rooms are assigned at Aspects Clinica or Sheikh Zayed | No room-level conflict check at those locations (acceptable — each doctor is the only one there) |
| **Doctor photos** | `photo_url` field exists but no upload UI | Add Supabase Storage + upload in DoctorsManager |

---

## Build Verification

```bash
npm run build
```

Expected: clean build with zero TypeScript errors and all 22 routes compiled.
