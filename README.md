# Aspects Clinica Platform

Arabic-first bilingual reservation, clinic management, CMS, media, scheduling, rooms, and admin platform for **Aspects Clinica / أسبكتس كلينيكا**. This project preserves the existing reservation and scheduling system while replacing copied identity and seed content with Aspects Clinica defaults.

## Local Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Fill only your new project values in `.env.local`.
4. Start development: `npm run dev`
5. Open `http://localhost:3500`

`.env.example` intentionally contains blanks only. Never commit `.env.local`, `.env`, deployment tokens, provider keys, or secret files.

## Environment Variables

Use these keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=http://localhost:3500
RESEND_API_KEY=
EMAIL_FROM=
WHATSAPP_PROVIDER_PLACEHOLDER_KEY=
CRON_SECRET=
FALLBACK_ADMIN_EMAIL=
FALLBACK_ADMIN_PASSWORD_HASH=
FALLBACK_ADMIN_ROLE=
FALLBACK_ADMIN_ENABLED=
FALLBACK_ADMIN_SESSION_SECRET=
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-visible. `SUPABASE_SERVICE_ROLE_KEY`, fallback admin hash values, email keys, WhatsApp keys, and cron secrets are server-only.

## Supabase

Create a new Supabase project from the Supabase dashboard, then copy the new project URL, anon key, and service role key into `.env.local`. Do not reuse copied project credentials.

Run migrations in order from `supabase/migrations/` using the Supabase SQL editor or CLI. The key files are:

- `001_initial_schema.sql`: schema, RLS, conflict prevention, appointment statuses.
- `002_seed_data.sql`: Aspects Clinica branch, rooms, specialties, services, doctors, settings, and placeholder schedule.
- `005_cms_media.sql`: media library and editable site content.
- `008_aspects_clinica_rebrand_roles.sql` and `009_aspects_clinica_role_defaults.sql`: updated admin roles for existing databases.

To reset demo content, run `002_seed_data.sql` after schema migrations. It deletes old seeded branches, rooms, doctors, services, and specialties before inserting Aspects Clinica defaults. Do not run it against production without a backup if real appointments or custom content already exist.

## Storage

The app uses the generic `site-assets` bucket. Keep it public for public site images and use these folders:

- `branding/`
- `doctors/`
- `landing/`
- `specialties/`
- `facilities/`
- `general/`

The storage policies in `005_cms_media.sql` allow public reads and admin-only writes. Upload APIs are protected server-side by admin role checks.

## Admin Access

The normal admin login can use Supabase Auth users linked to `admin_profiles`.

There is also a server-only fallback admin path for local development or emergency access. It is not browser-side and does not store the password in the database. Configure:

```bash
FALLBACK_ADMIN_EMAIL=doitrous@hotmail.com
FALLBACK_ADMIN_PASSWORD_HASH=<pbkdf2_sha256 hash>
FALLBACK_ADMIN_ROLE=medical_director
FALLBACK_ADMIN_ENABLED=true
FALLBACK_ADMIN_SESSION_SECRET=<long random string>
```

The built-in development fallback maps to Medical Director. For production, set your own hash and session secret or disable the fallback with `FALLBACK_ADMIN_ENABLED=false`.

Admin roles:

- Medical Director: full access.
- General Manager: full or near-full access.
- Operational Manager: daily operational access, including appointments/manual bookings, without branding/content destruction.

Permissions are checked in server routes as well as the UI.

## Aspects Defaults

Seeded clinic details:

- Name: Aspects Clinica / أسبكتس كلينيكا
- Type: Polyclinic
- Phone/WhatsApp: `+20 1212209011`
- Email: `aspectsclinica@gmail.com`
- Hours: Saturday to Thursday, 9:00 AM to 11:00 PM
- Address: Building 164, between CMC and Shifa Hospital, Mews Cafe entrance, third floor, right of the elevator.
- Maps: `https://maps.app.goo.gl/dnhEKCGSz1JF7FeR7`

Seeded resources include 7 clinic rooms, 2 laser rooms, 1 surgery/operation room, 2 recovery rooms, 2 receptions, and a coffee corner. Room names and room types remain editable.

Doctors, specialties, services, prices, photos, bios, schedules, rooms, homepage content, contact details, colors, and media are editable from the admin dashboard.

## Vercel Deployment

1. Create or connect the new GitHub repository.
2. Import the project into Vercel.
3. Add the same environment variables from `.env.example`.
4. Set `APP_BASE_URL` to the final deployment or custom domain URL.
5. Deploy.

The copied `.vercel/` association is removed and `.vercel/` is ignored. Do not commit Vercel project IDs, org IDs, tokens, deployment URLs, or old environment snapshots.

## GitHub

Initialize or connect the new repository manually:

```bash
git remote add origin <new-github-repository-url>
git push -u origin main
```

Use placeholders until final GitHub details are available.

## Admin Content Editing

Use the dashboard to update:

- Branding, header/footer logos, favicon, brand colors, and dark-mode colors.
- Site Content: hero, about, facilities, surgery/recovery, laser/dermatology, contact, CTA, footer.
- Doctors, specialties, services, branches, rooms, schedules, blocked times, and clinic settings.
- Media Library assets in the generic `site-assets` bucket.

Replace demo doctors, branches, services, schedules, and room assignments from the dashboard before going live.

## Verification Checklist

Run the brand-cleanup search from the project handoff, the old-Supabase-domain search, the likely-secret search, `git check-ignore .env.local .env .vercel`, `npm run build`, and `git status`.

Expected: no old brand references, no copied project credentials, ignored secret files, and a passing build.

## Troubleshooting

- Supabase connection fails: confirm the new URL and keys in `.env.local`.
- Public pages show no data: run migrations and `002_seed_data.sql`.
- Uploads fail: create `site-assets` and apply storage policies from `005_cms_media.sql`.
- Admin login fails: verify the Supabase user has an active `admin_profiles` row, or configure fallback admin variables.
- Manual booking fails: confirm the selected doctor has an active schedule and room assignment, or add one in Schedules.
- Slots do not appear: check booking window, minimum notice hours, doctor schedules, blocked times, and room conflicts.
- Vercel build fails: add all server and public environment variables in Vercel Project Settings.
