-- Room-upgrade requests: an enrolled delegate on the twin-sharing hotel booking
-- can pay USD 140 through a JotForm (id 262635649527468) to be moved to a single
-- room. JotForm posts the submission to /api/room-upgrade/webhook/:secret, which
-- inserts a row here as `pending`. An operator then flips it to `approved` via
-- scripts/set-room-upgrade-status.js and mails the confirmation with
-- scripts/send-room-upgrade-approved.js -- same two-step shape as the partial-
-- waiver flow (scholarship_requests + bulk-approve-waivers + send-waiver-approval).
--
-- One row per delegate (unique delegate_id) so the JotForm webhook is idempotent
-- on repeat submissions (double-clicks, JotForm retries). RLS enabled with no
-- policies -- service-role only, same posture as every other table in this
-- project. The browser never touches this table; the tab's pending/approved
-- state is joined onto /api/me/profile server-side.
create table if not exists public.room_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  delegate_id uuid not null unique references public.delegates(id) on delete cascade,
  -- Contact fields the delegate typed on the JotForm (also cross-checked against
  -- the delegates row by the webhook). Kept alongside the row so ops has the
  -- exact contact used for the payment.
  email text not null,
  applicant_id text not null,
  -- JotForm's submissionID, useful for reconciling with the payment provider.
  payment_reference text,
  -- pending until an operator acts; approved marks the room as upgraded and
  -- gates the confirmation email; rejected closes it without a booking change.
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Who/when the operator decided.
  decided_at timestamptz,
  decided_by text,
  -- Resend tracking for the approval email, so a re-run of the send script can
  -- skip anyone already emailed at the row level (in addition to the CSV log).
  email_resend_id text,
  email_status text check (email_status in ('scheduled', 'sent', 'canceled')),
  created_at timestamptz not null default now()
);

alter table public.room_upgrade_requests enable row level security;

-- Widen the usage_events event_type allowlist for the new webhook signal.
alter table public.usage_events
  drop constraint if exists usage_events_event_type_check;

alter table public.usage_events
  add constraint usage_events_event_type_check
  check (event_type in (
    'login', 'pdf_download', 'screen_view', 'interview_open',
    'interview_submitted', 'scholarship_accepted', 'registration_submitted',
    'delegate_enrolled', 'credential_email_sent', 'scholarship_requested',
    'room_upgrade_requested'
  ));
