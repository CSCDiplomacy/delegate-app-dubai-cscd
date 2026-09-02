// Dashboard. Results are announced (2026-08-27): the scholarship-holders
// banner leads the page, and a tiered delegate who still owes a
// registration form gets a CTA linking to the dedicated Registration screen
// (client/src/components/screens/Registration.tsx) — the form itself no
// longer embeds inline here (moved off-dashboard per request). Event tiles
// stay visible but read "Coming soon" until data is published. Interviews
// are closed (showInterviewTab hardcoded off in authStore.ts) — don't
// re-add interview-open copy here without checking that's still current.
import { useState } from 'react';
import {
  isApplicant,
  showRegistrationTab,
  useAuthStore,
} from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../services/api';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { Screen } from '../../types';
import { ActivityNotice } from './ActivityNotice';
import { PartialScholarshipRequest } from '../PartialScholarshipRequest';
import { PartialCountdownBanner } from '../RegistrationCountdown';

const TILES: Array<{ screen: Screen; icon: IconName; title: string; sub: string }> = [
  { screen: 'scholarship-holders', icon: 'award', title: 'Scholarship Holders', sub: 'The fully & partially funded roster' },
  { screen: 'about', icon: 'globe', title: 'The Summit', sub: 'Themes, story & lineage' },
  { screen: 'rundown', icon: 'clock', title: 'Rundown', sub: 'The day-by-day programme' },
  { screen: 'venue', icon: 'hotel', title: 'Institutional visit & dinner', sub: 'City visits, dinner logistics' },
  { screen: 'schedule', icon: 'star', title: 'My Schedule', sub: 'Sessions you starred' },
];

// Short, credential-friendly label for each tier. The result card no longer
// carries a "Partial scholarship" pill of its own; this is where a delegate
// reads which category they fall into, right alongside their ID and status.
// Matches the wording used on the Scholarship Holders page.
const CATEGORY_LABELS: Record<string, string> = {
  full: 'Fully Funded Scholarship',
  partial: 'Partially Funded Scholarship',
  self: 'Self-Financed',
  alumni: 'Alumni',
  special_alumni: 'Special Alumni',
};

// Whether a tier's outcome is a scholarship win ("Congratulations" framing)
// or not (a plain "Your result" note) - full/partial/special_alumni won
// something, self/alumni pay their own way.
const IS_SCHOLARSHIP_TIER = new Set(['full', 'partial', 'special_alumni']);

// Tiers that go through a JotForm registration/payment form (partial/self/
// alumni). full/special_alumni never register, so they can never be in the
// "registration received" state. Mirrors TIERS_WITH_FORM in authStore.ts.
const FORM_TIERS = new Set(['partial', 'self', 'alumni']);

// Result card copy (2026-08-27) - one merged card per tier: the outcome
// text plus, where a form is still owed, the registration action, instead
// of two separate cards.
const RESULT_COPY: Record<string, string> = {
  full: "You've been awarded a Fully Funded Scholarship, covering your participation fee in full. Our team will confirm your place directly.",
  partial: "You've been awarded a Partially Funded Scholarship. Complete your registration below to secure your place.",
  special_alumni: "You've been recognized as a Special Alumni honoree, no payment required. Our team will be in touch with next steps.",
  self: "Unfortunately, you have not been selected for a scholarship this time. You're still very welcome to attend the Youth Strategic Forum, Dubai 2026 as a self-financed delegate. Complete your registration below to secure your place.",
  alumni: "You've been recognized in our Alumni network. Complete your registration below to secure your place.",
};

// Seat-confirmation card for the two tiers that owe no registration form —
// full and special_alumni. They have nothing to pay and no JotForm to fill, so
// the one action left is to actively accept their place. The button posts to
// /me/accept-scholarship (idempotent, tier-checked server-side) and, once
// scholarship_accepted_at is set, the card flips to a confirmed badge.
const SeatConfirm = ({ tier }: { tier: string }) => {
  const { profile, refreshProfile } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = !!profile?.scholarship_accepted_at;

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/me/accept-scholarship', { method: 'POST' });
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm your seat. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`interview-cta${confirmed ? ' is-done' : ''}`}>
      <div className="interview-cta-tag">
        <Icon name={confirmed ? 'check' : 'award'} size={14} />
        {confirmed ? 'Seat confirmed' : IS_SCHOLARSHIP_TIER.has(tier) ? 'Congratulations' : 'Your result'}
      </div>
      <div className="interview-cta-title">{CATEGORY_LABELS[tier]}</div>
      <div className="interview-cta-sub">{RESULT_COPY[tier]}</div>
      {confirmed ? (
        <div className="seat-confirmed">
          <Icon name="check" size={15} />
          Your seat is confirmed
        </div>
      ) : (
        <button className="seat-confirm-btn" onClick={confirm} disabled={busy}>
          {!busy && <Icon name="check" size={16} />}
          {busy ? 'Confirming…' : 'Confirm my seat'}
        </button>
      )}
      {error && (
        <div className="interview-cta-sub" style={{ marginTop: 10, color: 'var(--signal)' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export const Dashboard = () => {
  const { profile } = useAuthStore();
  const { switchScreen } = useUIStore();

  const applicant = isApplicant(profile);
  const tier = profile?.result_tier || null;
  const needsRegistration = showRegistrationTab(profile);
  // A form-owing tier (partial/self/alumni) whose JotForm submission has come
  // through the webhook (registration_status flipped to 'submitted'). These
  // are the delegates who should read "Registration received" instead of a
  // "complete your registration" prompt.
  const registrationReceived =
    !!tier &&
    FORM_TIERS.has(tier) &&
    profile?.registration_status === 'submitted';

  // Results are published, so anyone with a tier reads "Result announced".
  const statusLabel = !applicant ? 'Confirmed delegate' : tier ? 'Result announced' : 'Applicant';
  const statusChip = !applicant || tier ? 'chip-ok' : 'chip-pending';
  // Interviews are closed globally now (see file header) — an applicant
  // with no tier yet just reads "Closed", not "Open".
  const interviewLabel = 'Closed';
  // Once a tier is on record we show the category (e.g. "Partial (50%)") in
  // the third credential slot instead of interview status, so the result
  // card itself needs no pill.
  const categoryLabel = tier ? CATEGORY_LABELS[tier] || 'Confirmed' : null;

  return (
    <div className="stack">
      {/* Boarding-pass hero */}
      <div className="pass">
        <div className="pass-top">
          <div>
            <div className="pass-eyebrow">
              {applicant ? 'Applicant credential' : 'Delegate credential'}
            </div>
            <div className="pass-title">{profile?.name || 'Welcome'}</div>
            <div className="pass-sub">{profile?.email || ''}</div>
          </div>
          <div className="seal">
            <span>
              YSF
              <br />
              DXB
              <br />
              2026
            </span>
          </div>
        </div>
        <div className="pass-perf" />
        <div className="pass-bottom">
          <div className="pass-field">
            <span className="pass-field-label">Applicant ID</span>
            <span className="pass-field-value">{profile?.applicant_id || 'N/A'}</span>
          </div>
          <div className="pass-field">
            <span className="pass-field-label">Status</span>
            <span className="pass-field-value">
              <span className={`chip ${statusChip}`}>{statusLabel}</span>
            </span>
          </div>
          {categoryLabel ? (
            <div className="pass-field">
              <span className="pass-field-label">Category</span>
              <span className="pass-field-value">{categoryLabel}</span>
            </div>
          ) : (
            <div className="pass-field">
              <span className="pass-field-label">Interview</span>
              <span className="pass-field-value">{interviewLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interview CTA + deadline countdown removed 2026-08-27 — interviews
          are closed and results are out (showInterviewTab is hardcoded off
          in authStore.ts too). Both components still exist, just unreached
          from here; revive if a future cohort needs them.

          General "Results Announced" headline card, every applicant sees
          this regardless of tier (even untiered/no-outcome-yet) — the
          tier-specific congratulations card below is additional, not a
          replacement, for full/partial/special_alumni. Title says
          "Congratulations!" for the tiers that actually won a scholarship
          (2026-08-27, per request) and stays "Results Announced!" for
          everyone else, since congratulating a self/alumni/no-outcome-yet
          delegate here would contradict their own card right below.

          Hidden for the `self` tier (2026-09-01): self-financed delegates now
          lead with the "Request a Partial Scholarship" card below instead of a
          "Results Announced / not selected" message, so both this banner and
          their result card are suppressed for that tier only. */}
      {applicant && tier !== 'self' && (
        <div className="interview-cta">
          <div className="interview-cta-tag">
            <Icon name="bell" size={14} />
            Announcement
          </div>
          <div className="interview-cta-title">
            {tier && IS_SCHOLARSHIP_TIER.has(tier) ? 'Congratulations!' : 'Results Announced!'}
          </div>
          <div className="interview-cta-sub">
            Scholarship results for the Youth Strategic Forum, Dubai 2026 are now live. Check
            your status below.
          </div>
        </div>
      )}

      {/* Result card (2026-08-27) - one card per tier: outcome text, plus
          the registration action folded in for tiers that still owe a form
          (was two separate cards; merged per request). Clickable only when
          a form is actually owed - full/special_alumni render as a plain
          non-interactive card, nothing to do. */}
      {tier &&
        tier !== 'self' &&
        RESULT_COPY[tier] &&
        (registrationReceived ? (
          <div className="interview-cta">
            <div className="interview-cta-tag">
              <Icon name="check" size={14} />
              Registration received
            </div>
            <div className="interview-cta-title">{CATEGORY_LABELS[tier]}</div>
            <div className="interview-cta-sub">
              We've received your registration. There's nothing further you need to do right now,
              our team will confirm your place shortly.
            </div>
          </div>
        ) : needsRegistration ? (
          <button className="interview-cta" onClick={() => switchScreen('registration')}>
            <div className="interview-cta-tag">
              <Icon name="award" size={14} />
              {IS_SCHOLARSHIP_TIER.has(tier) ? 'Congratulations' : 'Your result'}
            </div>
            <div className="interview-cta-title">{CATEGORY_LABELS[tier]}</div>
            <div className="interview-cta-sub">{RESULT_COPY[tier]}</div>
            <span className="interview-cta-go">Complete your registration</span>
          </button>
        ) : (
          // full / special_alumni — no form to fill, so their one action is to
          // actively confirm their seat via the animated button in this card.
          <SeatConfirm tier={tier} />
        ))}

      {/* Partial tier only: a live countdown to the registration deadline, right
          on the home screen next to the CTA above. Flips to a "Registration
          closed" card once the deadline passes. Only while a form is still owed. */}
      {tier === 'partial' && needsRegistration && <PartialCountdownBanner />}

      {/* Registration CTA for self-financed delegates (2026-09-01). Their full
          result card is hidden (see above), but they still need a way to
          register/pay, so this slim light-variant card carries the action —
          shown until they submit, then a short "received" confirmation. */}
      {tier === 'self' &&
        (registrationReceived ? (
          <div className="interview-cta is-lite">
            <div className="interview-cta-tag">
              <Icon name="check" size={14} />
              Registration received
            </div>
            <div className="interview-cta-title">Registration received</div>
            <div className="interview-cta-sub">
              We've received your registration. There's nothing further you need to do right now,
              our team will confirm your place shortly.
            </div>
          </div>
        ) : needsRegistration ? (
          <button
            className="interview-cta is-lite"
            style={{ cursor: 'pointer' }}
            onClick={() => switchScreen('registration')}
          >
            <div className="interview-cta-tag">
              <Icon name="award" size={14} />
              Registration
            </div>
            <div className="interview-cta-title">Complete your registration</div>
            <div className="interview-cta-sub">
              Secure your place at the Youth Strategic Forum, Dubai 2026 as a self-financed
              delegate.
            </div>
            <span className="interview-cta-go">Complete your registration</span>
          </button>
        ) : null)}

      {/* Partial-scholarship request offer — self-financed delegates only.
          Self-gates internally (renders null for every other tier). Sits below
          the registration card so completing registration reads as the primary
          action, the waiver request as the secondary one. */}
      <PartialScholarshipRequest />

      {/* Scholarship results banner (2026-08-27) — leads the page now that
          results are announced. Links into the Scholarship Holders screen.
          Heading added per request so the poster isn't unlabeled. */}
      <div className="section-label">Fully Funded Scholarship Holders</div>
      <button
        className="card"
        style={{ padding: 0, overflow: 'hidden', border: 0, cursor: 'pointer' }}
        onClick={() => switchScreen('scholarship-holders')}
      >
        <img
          src="/img/ysf-dubai-2026-results-poster.webp"
          alt="Youth Strategic Forum Dubai 2026, scholarship holders"
          style={{ width: '100%', display: 'block' }}
        />
      </button>

      {/* Notification for group members: their live-session activity is
          published. Sits right under identity so it's the first thing they see;
          the button jumps to the Activity tab. Renders nothing for non-group
          delegates. */}
      <ActivityNotice />

      {/* Section tiles - core navigation into the event content, so it
          stays near the top rather than after the promotional material
          below. */}
      <div>
        <div className="section-label">Explore</div>
        <div className="tile-grid">
          {TILES.map((tile) => (
            <button key={tile.screen} className="tile" onClick={() => switchScreen(tile.screen)}>
              <Icon name={tile.icon} size={20} className="tile-icon" />
              <div className="tile-title">{tile.title}</div>
              <div className="tile-sub">{tile.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
