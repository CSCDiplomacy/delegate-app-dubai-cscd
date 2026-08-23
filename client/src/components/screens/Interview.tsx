// Interview screen. The form URL ideally comes from GET /api/me/interview
// (a per-applicant tokenized URL so the webhook can tie a submission back to
// the applicant). If the backend can't supply one, env not set, request fails
//, we fall back to the shared public form so the interview always works.
// The AidaForm embed widget script must be injected imperatively: React never
// executes <script> tags rendered in JSX.
//
// AidaForm's server-to-server webhook is best-effort, so we also let the
// applicant self-confirm: a checkbox → confirmation dialog → POST mark-taken.
// Either path flips interview_status to 'submitted', after which the form is
// replaced by a terminal notice and the dashboard status is refreshed.
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [markingTaken, setMarkingTaken] = useState(false);
  const [markError, setMarkError] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

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

  const confirmMarkTaken = async () => {
    if (markingTaken || terminal) return;
    setMarkingTaken(true);
    setMarkError(false);
    try {
      const data = await api<InterviewInfo>('/me/interview/mark-taken', {
        method: 'POST',
      });
      setInfo(data);
      // Refresh the shared profile so the dashboard flips to "Completed".
      refreshProfile();
      setConfirmOpen(false);
    } catch {
      setMarkError(true);
    } finally {
      setMarkingTaken(false);
    }
  };

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
        <p className="tag">Step 1 · Fill out and submit the interview below.</p>
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
        <strong>Before you check the box below:</strong> make sure you have already submitted the
        form above. Checking this box <strong>locks the form</strong>, you will not be able to
        open or submit it again. If you check it by mistake before submitting, email us right away
        at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </div>

      <label className="interview-self-report">
        <input
          type="checkbox"
          checked={confirmOpen}
          disabled={markingTaken || terminal}
          onChange={(e) => {
            if (e.target.checked) {
              setMarkError(false);
              setConfirmOpen(true);
            }
          }}
        />
        <span>
          <strong>Step 2 · I have already submitted the form above</strong>
          <span>
            This checkbox and the form don&apos;t sync automatically, checking this is what tells
            us you&apos;re done. Only check this after you&apos;ve submitted, not before.
          </span>
        </span>
      </label>

      {confirmOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={() => !markingTaken && setConfirmOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" id="confirm-title">
              Confirm submission
            </h3>
            <p className="modal-body">
              Are you sure you&apos;ve already submitted the interview form above? This will lock
              the form, you won&apos;t be able to open or submit it again. If you haven&apos;t
              submitted yet, click "Not yet" and fill out the form first.
            </p>
            {markError && (
              <p className="modal-error">
                Something went wrong. Please try again, or email {SUPPORT_EMAIL}.
              </p>
            )}
            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={markingTaken}
              >
                Not yet
              </button>
              <button className="btn" onClick={confirmMarkTaken} disabled={markingTaken}>
                {markingTaken ? 'Confirming…' : 'Yes, I have submitted'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
