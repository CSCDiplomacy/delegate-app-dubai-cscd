-- Supports the n8n enroll-webhook (routes/enroll.js): tracks whether a
-- delegate has already been sent their login credentials, so a retried or
-- duplicate n8n call never re-provisions a password or re-sends the email.
-- Mirrors the existing registration_submitted_at / interview_submitted_at
-- pattern in the base schema.
alter table public.delegates
  add column if not exists credential_email_sent_at timestamptz;

-- Widen the usage_events event_type allowlist to cover the new webhook's
-- analytics events.
alter table public.usage_events
  drop constraint if exists usage_events_event_type_check;

alter table public.usage_events
  add constraint usage_events_event_type_check
  check (event_type in (
    'login', 'pdf_download', 'screen_view', 'interview_open',
    'interview_submitted', 'scholarship_accepted', 'registration_submitted',
    'delegate_enrolled', 'credential_email_sent'
  ));
