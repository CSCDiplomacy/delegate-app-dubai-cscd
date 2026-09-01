// Dashboard card offering self-financed delegates the chance to be re-evaluated
// for a Partial (50%) Scholarship. Built entirely in-app — no AidaForm/Cognito/
// JotForm — posting to POST /api/me/scholarship-request. Framing mirrors the
// CIPES/YPEF "Scholarship Opportunity" invite, re-skinned for YSF Dubai.
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

export const PartialScholarshipRequest = () => {
  const { profile, refreshProfile } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(profile?.email || '');
  const [answerFit, setAnswerFit] = useState('');
  const [answerContribution, setAnswerContribution] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only self-financed delegates are offered this (server re-checks too).
  if (profile?.result_tier !== 'self') return null;

  const requested = !!profile?.scholarship_request_status;

  // Already requested — show the confirmation state, no form.
  if (requested) {
    return (
      <div className="interview-cta is-done">
        <div className="interview-cta-tag">
          <Icon name="check" size={14} />
          Request received
        </div>
        <div className="interview-cta-title">Partial scholarship request received</div>
        <div className="interview-cta-sub">
          Thank you. We've received your request to be considered for a Partial Scholarship.
          Our team will review it and be in touch. There's nothing further you need to do right
          now.
        </div>
      </div>
    );
  }

  const canSubmit =
    email.trim() && answerFit.trim() && answerContribution.trim() && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await api('/me/scholarship-request', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
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
        Scholarship Opportunity
      </div>
      <div className="interview-cta-title">Request a Partial Scholarship</div>
      <div className="interview-cta-sub">
        Given the exceptional interest in the Youth Strategic Forum, Dubai 2026, we're inviting
        self-financed delegates to be considered for a Partial Scholarship on the
        participation fee. If you'd like to be considered, share a brief statement below.
        Shortlisted candidates may be offered the scholarship after review.
      </div>

      {!open ? (
        <button className="seat-confirm-btn" onClick={() => setOpen(true)}>
          <Icon name="award" size={16} />
          Request partial scholarship
        </button>
      ) : (
        <div style={{ marginTop: 18 }}>
          <div className="field">
            <label htmlFor="ps-email">Your email</label>
            <input
              id="ps-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="ps-fit">
              What unique perspective, impact, and motivation make you a strong candidate for this
              scholarship?
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
