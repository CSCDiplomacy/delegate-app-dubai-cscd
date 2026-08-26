// Dashboard. Results are announced (2026-08-27): the scholarship-holders
// banner leads the page, and a tiered delegate who still owes a
// registration form gets a CTA linking to the dedicated Registration screen
// (client/src/components/screens/Registration.tsx) — the form itself no
// longer embeds inline here (moved off-dashboard per request). Event tiles
// stay visible but read "Coming soon" until data is published. Interviews
// are closed (showInterviewTab hardcoded off in authStore.ts) — don't
// re-add interview-open copy here without checking that's still current.
import {
  isApplicant,
  showRegistrationTab,
  useAuthStore,
} from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { Screen } from '../../types';
import { ActivityNotice } from './ActivityNotice';

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
const CATEGORY_LABELS: Record<string, string> = {
  full: 'Full scholarship',
  partial: 'Partial (50%)',
  self: 'Self-financed',
  alumni: 'Alumni',
  special_alumni: 'Special Alumni',
};

// CTA copy for the "you still owe a form" card, by tier.
const REGISTRATION_CTA_LABEL: Record<string, string> = {
  partial: 'partial scholarship',
  self: 'self-financed',
  alumni: 'alumni',
};

export const Dashboard = () => {
  const { profile } = useAuthStore();
  const { switchScreen } = useUIStore();

  const applicant = isApplicant(profile);
  const tier = profile?.result_tier || null;
  const needsRegistration = showRegistrationTab(profile);

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
          from here; revive if a future cohort needs them. */}

      {/* Scholarship results banner (2026-08-27) — leads the page now that
          results are announced. Links into the Scholarship Holders screen. */}
      <button
        className="card"
        style={{ padding: 0, overflow: 'hidden', border: 0, cursor: 'pointer' }}
        onClick={() => switchScreen('scholarship-holders')}
      >
        <img
          src="/img/ysf-dubai-2026-results-poster.webp"
          alt="Youth Strategic Forum Dubai 2026 — scholarship holders"
          style={{ width: '100%', display: 'block' }}
        />
      </button>

      {/* Notification for group members: their live-session activity is
          published. Sits right under identity so it's the first thing they see;
          the button jumps to the Activity tab. Renders nothing for non-group
          delegates. */}
      <ActivityNotice />

      {/* Registration CTA (2026-08-27) — the form itself moved to its own
          Registration screen (see file header); this just links there.
          Disappears the moment registration_status flips to 'submitted'
          (showRegistrationTab), same pattern the old interview CTA used. */}
      {needsRegistration && tier && (
        <button className="interview-cta" onClick={() => switchScreen('registration')}>
          <div className="interview-cta-tag">
            <Icon name="award" size={14} />
            Registration open
          </div>
          <div className="interview-cta-title">Complete your registration</div>
          <div className="interview-cta-sub">
            Your {REGISTRATION_CTA_LABEL[tier] || 'scholarship'} registration and payment form is
            ready — a few minutes now secures your place.
          </div>
          <span className="interview-cta-go">Go to registration</span>
        </button>
      )}

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
