// Interview screen. The form URL ideally comes from GET /api/me/interview
// (a per-applicant tokenized URL so the webhook can tie a submission back to
// the applicant). If the backend can't supply one, env not set, request fails
//, we fall back to the shared public form so the interview always works.
// The AidaForm embed widget script must be injected imperatively: React never
// executes <script> tags rendered in JSX.
//
// interview_status flips to 'submitted' via AidaForm's server-to-server
// webhook, after which the form is replaced by a terminal notice and the
// dashboard status is refreshed (polled every 10s while the form is open).
// There used to also be an applicant self-confirm checkbox (POST
// /me/interview/mark-taken as a fallback for a missed webhook) — hidden from
// this screen 2026-08-23 per the client. The backend endpoint is untouched,
// so it can be wired back in if the webhook proves unreliable in practice.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { InterviewInfo } from '../../types';
import { api, track } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../Icon';

const SHARED_FORM_URL = 'https://15158.aidaform.com/interview-ysf-dubai-2026';
const FORM_ID = 'form202405';
const WIDGET_SRC = 'https://widget.aidaform.com/embed.js';
const WIDGET_ID = 'aidaform-app';
const SUPPORT_EMAIL = 'contact@thecscd.org';

function ensureWidgetScript() {
  if (document.getElementById(WIDGET_ID)) {
    const w = window as unknown as { AidaForm?: { embed?: () => void } };
    w.AidaForm?.embed?.();
    return;
  }
  const script = document.createElement('script');
  script.id = WIDGET_ID;
  script.src = WIDGET_SRC;
  document.head.appendChild(script);
}

const Notice = ({
  title,
  body,
  done,
  footer,
}: {
  title: string;
  body: string;
  done?: boolean;
  footer?: ReactNode;
}) => (
  <div className={`interview-notice${done ? ' is-done' : ''}`}>
    <div className="interview-notice-icon">
      <Icon name={done ? 'check' : 'clock'} size={26} />
    </div>
    <h2 className="interview-notice-title">{title}</h2>
    <p className="interview-notice-body">{body}</p>
    {footer}
  </div>
);

const SupportLine = () => (
  <p className="interview-support">
    Need technical help with the interview portal? Email us at{' '}
    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
  </p>
);

export const Interview = () => {
  const [info, setInfo] = useState<InterviewInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const applicantId = useAuthStore((s) => s.profile?.applicant_id);

  useEffect(() => {
    let cancelled = false;
    track('interview_open');
    api<InterviewInfo>('/me/interview')
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        // Network / config failure, treat as "show the form" below.
        if (!cancelled) setInfo(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Submitted / already-enrolled are terminal, no form.
  const terminal = info?.state === 'submitted' || info?.state === 'not_applicable';
  // Prefer the server's per-applicant tokenized URL (carries candidate_token so
  // the AidaForm webhook can match the submission back to this delegate) —
  // fall back to the shared public form only if the server couldn't supply one
  // (env not configured, or the /me/interview request itself failed).
  const formUrl = (info?.state === 'open' && info.url) || SHARED_FORM_URL;

  // Poll so a webhook-driven submission (AidaForm → server) is reflected here,
  // and mirror it into the shared profile so the dashboard status updates too.
  useEffect(() => {
    if (loaded && !terminal) {
      const timer = window.setInterval(() => {
        api<InterviewInfo>('/me/interview')
          .then((data) => {
            setInfo(data);
            if (data.state === 'submitted') refreshProfile();
          })
          .catch(() => {});
      }, 10000);
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [loaded, terminal, refreshProfile]);

  // Load the widget once the embed div is on the page.
  useEffect(() => {
    if (loaded && !terminal && embedRef.current) {
      ensureWidgetScript();
    }
  }, [loaded, terminal]);

  if (!loaded) {
    return (
      <div className="stack">
        <div className="skel" style={{ height: 96 }} />
        <div className="skel" style={{ height: 16, width: '66%' }} />
      </div>
    );
  }

  if (info?.state === 'submitted') {
    const when = info.submitted_at
      ? new Date(info.submitted_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;
    return (
      <Notice
        done
        title={`Interview submitted${when ? ` · ${when}` : ''}`}
        body="Thank you. Your responses are in and our team is reviewing them. Watch this portal for the outcome, nothing more is needed from you right now."
        footer={<SupportLine />}
      />
    );
  }

  if (info?.state === 'not_applicable') {
    return (
      <Notice
        done
        title="You are all set"
        body="Your place is confirmed, the interview stage is behind you. Explore the event sections as they open up."
      />
    );
  }

  // Open / unavailable / failed → always show the form until the server marks it submitted.
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Selection · your interview</div>
        <h1 className="screen-title">The Interview</h1>
        <p className="tag">Fill out and submit the interview below.</p>
      </div>
      {applicantId && (
        <div className="interview-warning">
          <strong>Your Applicant ID:</strong> {applicantId} — write it down carefully, you'll need
          it to be entered correctly.
        </div>
      )}
      <div className="interview-warning">
        <strong>Recording tip:</strong> try to record your interview on a laptop/desktop browser
        rather than a phone, it tends to be more reliable.
      </div>
      <div className="interview-embed-wrap">
        <div className="interview-embed-clip">
          <div
            ref={embedRef}
            data-aidaform-app={FORM_ID}
            data-url={formUrl}
            data-width="100%"
            data-height="700px"
            data-do-resize=""
          />
        </div>
      </div>
      <div className="interview-warning">
        <strong>After submitting,</strong> refresh this page.
      </div>
    </div>
  );
};
