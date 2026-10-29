# What you need to do (free, ~15–20 min)

The portal code lives in `portal/`. Finish these steps so auth and downloads work.

## 1. Create a free Supabase project
1. Go to [https://supabase.com](https://supabase.com) → Sign up → **New project** (Free).
2. Note the region (Sydney if available).
3. Open **Project Settings → API** and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep secret)

## 2. Run the database migrations
1. In Supabase → **SQL Editor** → New query.
2. Paste and run `supabase/migrations/001_init.sql`.
3. Then paste and run `supabase/migrations/002_streams_and_tutor_scope.sql` (streams + tutor 1-1 assignments).
4. Then paste and run `supabase/migrations/003_calendar_admin.sql` (reschedule proposals, calendar feed tokens, indexes).
4. You should see tables: `profiles`, `classes`, `enrolments`, `private_assignments`, etc.

## 3. Storage bucket
1. Supabase → **Storage** → New bucket.
2. Name: `class-resources`
3. **Private** (not public).
4. (Optional) Add a policy allowing authenticated uploads for admins only; the service role used by the admin API bypasses RLS for uploads.

## 4. Auth providers
1. Supabase → **Authentication → Providers**.
2. Enable **Email** (OTP / magic link is fine).
3. Enable **Google**:
   - Create OAuth client in [Google Cloud Console](https://console.cloud.google.com/) (free).
   - Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Paste Client ID + Secret into Supabase Google provider.
4. Supabase → **Authentication → URL configuration**:
   - Site URL: your live portal (e.g. `https://vantage-portal-five.vercel.app`)
   - Redirect allow list must include:
     - `http://localhost:3000/auth/callback`
     - `https://vantage-portal-five.vercel.app/auth/callback`
     - `https://learn.vantagetutoring.com.au/auth/callback` (when HTTPS works)

## 5. Local env file
```bash
cd portal
cp .env.example .env.local
# paste your Supabase URL and keys
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## 6. Seed yourself as admin
1. Sign in once with your Google/email (creates a `profiles` row as `student` by default).
2. In SQL Editor:
```sql
update public.profiles
set role = 'admin', full_name = 'Jason Liu'
where email = 'YOUR_EMAIL@…';
```
3. Or set `ADMIN_EMAILS` in `.env.local` before first sign-in.

## 7. Free deploy (Vercel Hobby)
1. [vercel.com](https://vercel.com) → Import this GitHub repo (or `portal/` as root).
2. Set Root Directory to `portal`.
3. Add the same env vars as `.env.local`.
4. Deploy → you get `https://….vercel.app` at **$0**.
5. Optional later: add domain `learn.vantagetutoring.com.au` (DNS CNAME → Vercel, still free).

## 8. Marketing site login link
After deploy, tell the agent (or edit) the live portal URL so the main site “Log in” points there. Locally it defaults to `http://localhost:3000`.

## Cost
All of the above is on free tiers. You only pay if you later upgrade Supabase/Vercel.
