// Dashboard card offering self-financed delegates the chance to be re-evaluated
// for a Partial Waiver on the participation fee. Built entirely in-app — no
// AidaForm/Cognito/JotForm — posting to POST /api/me/scholarship-request. The
// endpoint stores the delegate's account email (no email field on the form).
//
// Three states, all driven by profile.scholarship_request_status:
//   null      → the offer + a button that expands the form inline
//   (any set) → "Request received" (pending/approved/rejected all collapse here;
//                an approved delegate is already 'partial' tier and won't reach
//                this card at all, since it only renders for the `self` tier)
// The card self-gates: it renders nothing unless the delegate is `self` tier,
// matching the server-side eligibility check (gating is UX, not security).
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
  const { profile, refreshProfile } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [answerFit, setAnswerFit] = useState('');
  const [answerContribution, setAnswerContribution] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only self-financed delegates are offered this (server re-checks too).
  if (profile?.result_tier !== 'self') return null;
  // ...and not once they've already paid: a self-financed delegate who has
  // completed their registration/payment shouldn't be offered a fee waiver.
  if (profile?.registration_status === 'submitted') return null;

  const requested = !!profile?.scholarship_request_status;

  // Already requested — show the confirmation state, no form.
  if (requested) {
    return (
      <div className="interview-cta is-done">
        <div className="interview-cta-tag">
          <Icon name="check" size={14} />
          Request received
        </div>
        <div className="interview-cta-title">Partial waiver request received</div>
        <div className="interview-cta-sub">
          Thank you. We've received your request to be considered for a Partial Waiver.
          Our team will review it and be in touch. There's nothing further you need to do right
          now.
        </div>
      </div>
    );
  }

  const canSubmit = answerFit.trim() && answerContribution.trim() && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await api('/me/scholarship-request', {
        method: 'POST',
        body: JSON.stringify({
          answer_fit: answerFit.trim(),
          answer_contribution: answerContribution.trim(),
        }),
      });
      // Profile now reports 'pending' → this card flips to the received state.
      await refreshProfile();
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
        Given the exceptional interest in the Youth Strategic Forum, Dubai 2026, we're inviting
        self-financed delegates to be considered for a Partial Waiver covering 50% of the
        self-financed participation fee. If you'd like to be considered, share a brief statement
        below. Shortlisted candidates may be offered the waiver after review.
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

      <div
        className="interview-cta-sub"
        style={{ marginTop: 14, fontWeight: 700, color: 'var(--ink)' }}
      >
        5 partial seats, awarded on a rolling basis. Deadline: 3 September 2026, 11:59 PM (Dubai
        time).
      </div>

      {!open ? (
        <button className="seat-confirm-btn" onClick={() => setOpen(true)}>
          <Icon name="award" size={16} />
          Request partial waiver
        </button>
      ) : (
        <div style={{ marginTop: 18 }}>
          <div className="field">
            <label htmlFor="ps-fit">
              What unique perspective, impact, and motivation make you a strong candidate for this
              waiver?
            </label>
            <textarea
              id="ps-fit"
              rows={4}
              value={answerFit}
              onChange={(e) => setAnswerFit(e.target.value)}
              placeholder="Your unique perspective, impact, and motivation…"
            />
          </div>

          <div className="field">
            <label htmlFor="ps-contribution">
              How will your participation contribute to the global strategy and cultural diplomacy
              dialogue?
            </label>
            <textarea
              id="ps-contribution"
              rows={4}
              value={answerContribution}
              onChange={(e) => setAnswerContribution(e.target.value)}
              placeholder="Your contribution to the Forum's high-level discussions and engagements…"
            />
          </div>

          <div className="interview-cta-sub" style={{ marginTop: -4, marginBottom: 4 }}>
            Maximum 150 to 200 words each. Focus on your unique perspective, impact, and motivation,
            and your potential contribution to the Forum's high-level discussions and engagements.
          </div>

          <button className="seat-confirm-btn" onClick={submit} disabled={!canSubmit}>
            {!busy && <Icon name="check" size={16} />}
            {busy ? 'Sending…' : 'Submit request'}
          </button>

          {error && (
            <div className="interview-cta-sub" style={{ marginTop: 10, color: 'var(--signal)' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
