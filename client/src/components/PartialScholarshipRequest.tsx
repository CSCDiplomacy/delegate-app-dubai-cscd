// Dashboard card offering self-financed delegates a Partial Waiver on the
// participation fee. Built entirely in-app, posting to
// POST /api/me/scholarship-request (the endpoint stores the delegate's account
// email; there are no form fields).
//
// No-approval / no-deadline policy (2026-09-05): there is no questionnaire and
// no review. Pressing the button grants the waiver immediately (the server
// flips the delegate self -> partial), so we just ask the delegate to refresh
// the page to continue to their partial registration form.
//
// The card self-gates: it renders nothing unless the delegate is `self` tier
// (an approved delegate is already `partial` and never reaches this card).
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Icon } from './Icon';

// What a self-financed place at YSF Dubai 2026 includes — shown on the waiver
// card so delegates understand what their fee (and the 50% waiver) covers.
const SELF_FUNDED_INCLUDES = [
  'Forum Invitation Letter',
  'Accommodation for 3 nights at a 4-star hotel (twin-sharing, upgradeable)',
  'Youth Statements & Interventions, training sessions',
  'Certificate of Participation',
  '10-week virtual course, post-forum',
  'Partial scholarship opportunities for future programs',
  'Two international meals during the forum',
  'Cruise Dinner & Desert Safari',
  'YSF personalized merchandise',
  'Community of Impact Creators',
  'Opportunity for internship at CSCD (if qualified)',
  'Opportunity to teach with us (if qualified)',
];

export const PartialScholarshipRequest = () => {
  const { profile } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only self-financed delegates are offered this (server re-checks too).
  if (profile?.result_tier !== 'self') return null;
  // ...and not once they've already paid: a self-financed delegate who has
  // completed their registration/payment shouldn't be offered a fee waiver.
  if (profile?.registration_status === 'submitted') return null;

  // Confirmed: either we just submitted, or a request already exists on the
  // profile. Ask the delegate to refresh so their partial form loads.
  const done = submitted || !!profile?.scholarship_request_status;
  if (done) {
    return (
      <div className="interview-cta is-done">
        <div className="interview-cta-tag">
          <Icon name="check" size={14} />
          Waiver confirmed
        </div>
        <div className="interview-cta-title">Your Partial Waiver is confirmed</div>
        <div className="interview-cta-sub">
          Please refresh the page to continue to your registration, where you can complete your
          Partial Waiver (50%) payment.
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api('/me/scholarship-request', { method: 'POST', body: JSON.stringify({}) });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="interview-cta is-lite">
      <div className="interview-cta-tag">
        <Icon name="award" size={14} />
        Waiver Opportunity
      </div>
      <div className="interview-cta-title">Request a Partial Waiver</div>
      <div className="interview-cta-sub">
        Given the exceptional interest in the Youth Strategic Forum, Dubai 2026, we're offering
        self-financed delegates a Partial Waiver covering 50% of the self-financed participation
        fee. Request it below and your registration will switch to the partial (50%) fee.
      </div>

      <div
        className="interview-cta-sub"
        style={{ marginTop: 14, fontWeight: 700, color: 'var(--ink)' }}
      >
        What your self-financed place includes
      </div>
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
        {SELF_FUNDED_INCLUDES.map((perk) => (
          <li
            key={perk}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '0.86rem',
              lineHeight: 1.45,
              color: 'var(--ink-soft)',
              marginBottom: 6,
            }}
          >
            <span style={{ color: 'var(--signal)', flexShrink: 0, marginTop: 2 }}>
              <Icon name="check" size={14} />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <button className="seat-confirm-btn" onClick={submit} disabled={busy} style={{ marginTop: 16 }}>
        {!busy && <Icon name="award" size={16} />}
        {busy ? 'Requesting…' : 'Request partial waiver'}
      </button>

      {error && (
        <div className="interview-cta-sub" style={{ marginTop: 10, color: 'var(--signal)' }}>
          {error}
        </div>
      )}
    </div>
  );
};
