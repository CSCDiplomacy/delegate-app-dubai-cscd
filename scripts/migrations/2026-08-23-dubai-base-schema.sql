-- Dubai base schema for a fresh Supabase project (ref pjdbvjiemguepdyzhlft).
-- Jakarta's equivalent tables were created by hand in the dashboard and never
-- checked in (see app_brain/Data Model.md) — this reconstructs that same
-- shape as a proper migration, plus every column the later Jakarta migrations
-- added, so Dubai starts from the full current shape instead of repeating the
-- same incremental-ALTER history.
--
-- Run this once in the Supabase SQL editor for the Dubai project, then run
-- `node scripts/verify-env.js` and the connectivity check before seeding.

-- ============================================================
-- delegates
-- ============================================================
create table if not exists public.delegates (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text not null,
  applicant_id text,

  status text not null default 'unenrolled'
    check (status in ('unenrolled', 'underprocessing', 'enrolled')),

  interview_status text not null default 'not_started'
    check (interview_status in ('not_started', 'submitted')),
  interview_token uuid not null default gen_random_uuid(),
  interview_submitted_at timestamptz,

  result_status text not null default 'pending'
    check (result_status in ('pending', 'evaluated', 'not_evaluated')),
  result_tier text
    check (result_tier is null or result_tier in ('self', 'partial', 'full', 'alumni')),
  scholarship_accepted_at timestamptz,

  registration_status text not null default 'not_started'
    check (registration_status in ('not_started', 'submitted')),
  registration_submitted_at timestamptz,

  hotel_id text,
  room text,
  booking_ref text,
  check_in date,
  check_out date,
  meals text,

  created_at timestamptz not null default now()
);

create unique index if not exists delegates_email_key on public.delegates (lower(email));
create index if not exists delegates_applicant_id_idx on public.delegates (applicant_id);
create index if not exists delegates_interview_token_idx on public.delegates (interview_token);

alter table public.delegates enable row level security;

-- The Express server always talks to Supabase via the service-role key
-- (bypasses RLS) — see app_brain/Data Model.md. This policy is defense in
-- depth for any future direct client read, matching CLAUDE.md's stated
-- intent: "a delegate reads only their own row."
create policy "delegates read own row" on public.delegates
  for select using (auth.uid() = id);

-- ============================================================
-- favourites
-- ============================================================
create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table public.favourites enable row level security;

create policy "favourites owner read" on public.favourites
  for select using (auth.uid() = user_id);
create policy "favourites owner insert" on public.favourites
  for insert with check (auth.uid() = user_id);
create policy "favourites owner delete" on public.favourites
  for delete using (auth.uid() = user_id);

-- ============================================================
-- feedback
-- ============================================================
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  rating int,
  comment text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "feedback owner insert" on public.feedback
  for insert with check (auth.uid() = user_id);
-- No client-side select policy: feedback is read via the internal analytics
-- endpoint (routes/analytics.js), which uses the service-role key.

-- ============================================================
-- announcements
-- ============================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  pinned boolean not null default false,
  must_read boolean not null default false,
  active boolean not null default true,
  link_screen text,
  link_label text,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements public read" on public.announcements
  for select using (active = true);

-- ============================================================
-- action_items
-- ============================================================
create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  link_url text,
  link_label text,
  due_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.action_items enable row level security;

create policy "action_items public read" on public.action_items
  for select using (active = true);

-- ============================================================
-- usage_events
-- ============================================================
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  event_type text not null
    check (event_type in (
      'login', 'pdf_download', 'screen_view', 'interview_open',
      'interview_submitted', 'scholarship_accepted', 'registration_submitted'
    )),
  detail text,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

create policy "usage_events owner insert" on public.usage_events
  for insert with check (auth.uid() = user_id);
-- No client-side select policy: read via routes/analytics.js (service role).

-- ============================================================
-- Storage: accommodation vouchers (private bucket)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('accommodation-vouchers', 'accommodation-vouchers', false)
on conflict (id) do nothing;

-- No public storage policies: scripts/upload-vouchers.js and the
-- GET /api/me/voucher signed-URL route both use the service-role key.
