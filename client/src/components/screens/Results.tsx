// Results. These render inline on the dashboard - there is no separate Results
// screen.
//
// `result_tier` (from the evaluation workbook, via scripts/reconcile-tiers.js)
// is the ONLY thing that decides what a delegate sees. Whether they interviewed
// is irrelevant here - the tier sheets are the authority, and many tiered
// applicants never interviewed.
//
//   full    → scholarship covers the fee; no form, team confirms directly
//   partial → pays 50%; registers + pays through Cognito form 79
//   self    → pays in full; registers + pays through Cognito form 78
//   alumni  → registers through Cognito form 81
//
// No tier → nothing renders at all (see Dashboard).
import { useState } from 'react';
import { CognitoForm, COGNITO_FORM_IDS } from '../CognitoForm';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import type { ResultTier } from '../../types';

// The accept step for full-scholarship delegates. There is nothing to pay, so
// instead of a registration form they confirm their place with one click; the
// server records the acceptance (and an audit row in usage_events). Once
// accepted the button flips to a permanent confirmed state.
const AcceptScholarship = () => {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const acceptedAt = profile?.scholarship_accepted_at || null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await api<{ accepted_at: string }>('/me/accept-scholarship', { method: 'POST' });
      await refreshProfile();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (acceptedAt) {
    const when = new Date(acceptedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return (
      <div className="accept-confirmed">
        <span className="chip chip-ok">Scholarship accepted</span>
        <p className="t-desc">
          Thank you for confirming your place, accepted on {when}. Our team will be in touch
          shortly with your travel and arrival details.
        </p>
      </div>
    );
  }

  return (
    <div className="accept-cta">
      <button className="btn" onClick={accept} disabled={busy}>
        {busy ? 'Confirming…' : 'Accept scholarship'}
      </button>
      {error && (
        <p className="accept-error">Something went wrong. Please try again.</p>
      )}
    </div>
  );
};

// The announcement artwork naming the full-scholarship cohort. The caption
// matters: without it the banner reads as "the delegates", which would tell the
// 149 partial/self delegates they hadn't been selected at all.
export const SelectedBanner = () => (
  <div className="results-banner">
    <div className="results-banner-caption">
      <p className="tag">Full scholarship recipients</p>
      <p className="t-desc">
        Congratulations to the delegates below, who have been awarded full scholarships to YPDS
        Jakarta 2026 following the interview panel's evaluation.
      </p>
    </div>
    <img
      src="/img/results-selected-delegates.png"
      alt="YPDS Jakarta 2026 full scholarship recipients"
      loading="lazy"
    />
  </div>
);

export const TierResult = ({ tier }: { tier: ResultTier }) => {
  const profile = useAuthStore((s) => s.profile);
  // A full scholarship covers the fee, so there is nothing to pay and no
  // registration form - the team confirms these places directly.
  if (tier === 'full') {
    return (
      <div className="t-card is-award">
        <div className="t-title">Congratulations, we'll see you in Jakarta</div>
        <p className="t-desc">
          Ten full scholarships were awarded across the whole applicant pool, and one of them is
          yours. The panel came away genuinely impressed by the clarity of your thinking and the
          seriousness you brought to the interview. Your place at YPDS Jakarta 2026 is secured in
          full, with nothing further to pay. Confirm your place below and our team will be in touch
          shortly with your travel and arrival details.
        </p>
        <AcceptScholarship />
      </div>
    );
  }

  // partial/self: the outcome now shows in the credential card, so the
  // congratulations card is dropped; the registration form (with its own
  // title) carries the context. Once registered there is nothing to show.
  if (tier === 'partial' || tier === 'self') {
    const partial = tier === 'partial';
    const registered = profile?.registration_status === 'submitted';
    if (registered) return null;
    return (
      <CognitoForm
        formId={COGNITO_FORM_IDS[tier]}
        title={partial ? 'Partial scholarship registration' : 'Self-financed registration'}
        applicantId={profile?.applicant_id}
      />
    );
  }

  // alumni: dedicated registration form (Cognito 81); same treatment.
  const registered = profile?.registration_status === 'submitted';
  if (registered) return null;
  return (
    <CognitoForm
      formId={COGNITO_FORM_IDS.alumni}
      title="Alumni registration"
      applicantId={profile?.applicant_id}
    />
  );
};
