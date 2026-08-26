// JotForm embed for scholarship registration + payment.
//
// Replaces CognitoForm.tsx for this purpose (client decision, 2026-08-27) —
// see app_brain/Dubai Fork Progress.md. CognitoForm.tsx is left in place,
// unused, in case Jakarta-style forms come back; Dubai's registration forms
// are three near-identical JotForm forms (partial/self/alumni), each with a
// Stripe payment block and a visible "Applicant Id" field (internal name
// `applicantId`, regex-validated against the YSF-DXB-2026-FF### shape).
//
// Unlike Cognito's script-injected "seamless" embed, this is a plain
// <iframe> — JotForm's forms with a payment field are served from the
// pci.jotform.com (PCI-scope) subdomain, and support prefilling a field via
// a `?<fieldName>=<value>` query param on the iframe's own src, keyed by the
// field's internal name. That's simpler and more robust here than DOM
// injection, at the cost of the form not inheriting the portal's CSS.
//
// Requires pci.jotform.com in the frameSrc CSP directive in app.js.
const JOTFORM_HOST = 'https://pci.jotform.com';

// Form ids from JotForm, by what the delegate still has to pay:
//   262376041526455, "Partial funded- Youth Strategic Forum - Dubai 2026"
//   262375715752463, "Self Financed - Youth Strategic Forum - Dubai 2026 (For FF)"
//   262375928037465, "Alumni- Youth Strategic Forum - Dubai 2026"
// Full-scholarship and special-alumni delegates have nothing to pay, so
// there is no form for them.
export const JOTFORM_IDS = {
  partial: '262376041526455',
  self: '262375715752463',
  alumni: '262375928037465',
} as const;

// The form's internal field name for the applicant-id text field (confirmed
// via the JotForm API against all three forms — identical across them).
const PREFILL_FIELD = 'applicantId';

export const JotForm = ({
  formId,
  title,
  applicantId,
}: {
  formId: string;
  title: string;
  applicantId?: string | null;
}) => {
  const src = applicantId
    ? `${JOTFORM_HOST}/${formId}?${PREFILL_FIELD}=${encodeURIComponent(applicantId)}`
    : `${JOTFORM_HOST}/${formId}`;

  return (
    <div className="cognito-embed">
      <div className="cognito-embed-head">{title}</div>
      <div className="cognito-embed-body">
        <iframe
          key={formId}
          src={src}
          title={title}
          loading="lazy"
          style={{ width: '100%', minHeight: 900, border: 0, display: 'block' }}
        />
      </div>
    </div>
  );
};
