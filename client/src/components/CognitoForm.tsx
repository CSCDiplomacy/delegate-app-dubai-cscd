// Cognito Forms embed for scholarship registration.
//
// Uses Cognito's **seamless** embed, whose official snippet is:
//   <script src=".../f/seamless.js" data-key="<account>" data-form="<id>"></script>
// It injects the form into our own DOM (no iframe), so the portal's typography
// and tokens apply to it — see the .cognito-embed-body rules in globals.css.
//
// IMPORTANT: seamless.js reads its config from `document.currentScript`, and
// currentScript is null for *async* scripts. A script created with
// createElement is async by default, which makes the form render as an empty
// panel. `s.async = false` is therefore load-bearing — don't remove it.
//
// Requires www.cognitoforms.com in the script/style/font/connect CSP directives
// in app.js. A direct link is shown if the embed hasn't rendered, so nobody is
// ever stranded without a way to pay.
import { useEffect, useRef, useState } from 'react';

const SEAMLESS_SRC = 'https://www.cognitoforms.com/f/seamless.js';
const ACCOUNT_KEY = 'ufIsh1RjbUCGYxX0PV-sug';

// Form ids from Cognito, by what the delegate still has to pay:
//   78 — "Self Financed (With Scholarship)"
//   79 — "Partial (50% Scholarship)"
//   81 — Alumni registration
// Full-scholarship delegates have nothing to pay, so there is no form for them.
export const COGNITO_FORM_IDS = { self: '78', partial: '79', alumni: '81' } as const;

// Cognito's seamless embed prefills fields from the host page's query string,
// keyed by each field's Internal Name. We pass the delegate's applicant_id into
// a hidden `ApplicantId` field on forms 78/79 so the registration webhook can
// tie the submission back to the delegate. The param is set on the URL just
// before seamless.js runs (it reads window.location at execution) and removed on
// cleanup — there is no router, so mutating the query string is otherwise inert.
const PREFILL_FIELD = 'ApplicantId';

export const CognitoForm = ({
  formId,
  title,
  applicantId,
}: {
  formId: string;
  title: string;
  applicantId?: string | null;
}) => {
  const host = useRef<HTMLDivElement>(null);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = '';
    setStalled(false);

    // Add the prefill param before injecting the script; restore on cleanup.
    const originalSearch = window.location.search;
    if (applicantId) {
      const params = new URLSearchParams(window.location.search);
      params.set(PREFILL_FIELD, applicantId);
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}?${qs}${window.location.hash}`);
    }

    const s = document.createElement('script');
    s.src = SEAMLESS_SRC;
    s.async = false; // keeps document.currentScript non-null — see above
    s.dataset.key = ACCOUNT_KEY;
    s.dataset.form = formId;
    el.appendChild(s);

    // If nothing has been injected after a reasonable wait, surface the direct
    // link rather than leaving an empty box.
    const t = setTimeout(() => {
      if (el.querySelectorAll('*').length <= 1) setStalled(true);
    }, 6000);

    return () => {
      clearTimeout(t);
      el.innerHTML = '';
      if (applicantId) {
        window.history.replaceState(null, '', `${window.location.pathname}${originalSearch}${window.location.hash}`);
      }
    };
  }, [formId, applicantId]);

  return (
    <div className="cognito-embed">
      <div className="cognito-embed-head">{title}</div>
      <div className="cognito-embed-body" ref={host} />
      {stalled && (
        <div className="cognito-embed-fallback">
          <p>Having trouble loading the form?</p>
          <a
            href={`https://www.cognitoforms.com/f/${ACCOUNT_KEY}/${formId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the registration form in a new tab →
          </a>
        </div>
      )}
    </div>
  );
};
