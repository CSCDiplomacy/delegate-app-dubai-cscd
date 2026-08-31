-- Partial-scholarship requests: a self-financed delegate (result_tier = 'self')
-- can ask to be re-evaluated for the partial (50%) scholarship from the portal
-- dashboard. The request is stored here (built in-app, no third-party form) and
-- actioned from the admin app (admin_app_dubai) — Approve awards the partial
-- tier and schedules a branded congratulations email; Reject just closes it.
--
-- One row per delegate (unique delegate_id) so a delegate can request only once;
-- the Express endpoint upserts idempotently. RLS enabled with no policies —
-- service-role only, same posture as every other table in this project. Inserts
-- come from the delegate app's server (service client), decisions from the admin
-- app's server action (service client); the browser never touches this table.
create table if not exists public.scholarship_requests (
  id uuid primary key default gen_random_uuid(),
  delegate_id uuid not null unique references public.delegates(id) on delete cascade,
  -- Contact email the delegate typed on the form (prefilled from their account,
  -- editable) — kept alongside the delegate row so ops has the preferred contact.
  email text not null,
  -- Q1 "What unique perspective, impact, and motivation make you a strong
  -- candidate for this scholarship?"
  answer_fit text not null,
  -- Q2 "How will your participation contribute to the global strategy and
  -- cultural diplomacy dialogue?"
  answer_contribution text not null,
  -- pending until an admin acts; approved awards the partial tier, rejected closes it.
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Who/when the admin decided, mirroring the evaluated_at / *_by conventions.
  decided_at timestamptz,
  decided_by text,
  -- Branded approval email is scheduled via Resend to fire ~1 hour after
  -- approval (a grace window: an Undo within the hour cancels it). We keep
  -- Resend's email id so Undo can cancel the scheduled send.
  email_resend_id text,
  email_scheduled_at timestamptz,
  email_status text check (email_status in ('scheduled', 'sent', 'canceled')),
  created_at timestamptz not null default now()
);

alter table public.scholarship_requests enable row level security;

-- Widen the usage_events event_type allowlist for the new dashboard action.
alter table public.usage_events
  drop constraint if exists usage_events_event_type_check;

alter table public.usage_events
  add constraint usage_events_event_type_check
  check (event_type in (
    'login', 'pdf_download', 'screen_view', 'interview_open',
    'interview_submitted', 'scholarship_accepted', 'registration_submitted',
    'delegate_enrolled', 'credential_email_sent', 'scholarship_requested'
  ));
