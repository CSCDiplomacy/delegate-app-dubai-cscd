// Dashboard. Results (once tiered) publish here inline - there is no separate
// Results screen. Evaluated applicants get the announcement banner and their
// own scholarship outcome. Event tiles stay visible but read "Coming soon"
// until data is published. Note: this was ported from Jakarta's post-interview
// phase; Dubai's interview window is still open (see interviewLabel below),
// so don't assume interviews-closed copy elsewhere in this file without
// checking against the current phase.
import {
  isApplicant,
  isUnderReview,
  useAuthStore,
} from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { Screen } from '../../types';
import { ActivityNotice } from './ActivityNotice';
import { TierResult } from './Results';

const TILES: Array<{ screen: Screen; icon: IconName; title: string; sub: string }> = [
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
};

export const Dashboard = () => {
  const { profile } = useAuthStore();
  const { switchScreen } = useUIStore();

  const applicant = isApplicant(profile);
  const underReview = isUnderReview(profile);
  const tier = profile?.result_tier || null;

  // Results are published, so anyone with a tier reads "Result announced".
  // Tier - not interview status - is what decides this.
  const statusLabel = !applicant ? 'Confirmed delegate' : tier ? 'Result announced' : 'Applicant';
  const statusChip = !applicant || tier ? 'chip-ok' : 'chip-pending';
  // 'Closed' would be wrong while the interview window is still open (Dubai's
  // current phase) - only say that once there's an actual deadline-passed
  // signal to check against. For now, an applicant who hasn't submitted yet
  // just has an open interview.
  const interviewLabel = underReview ? 'Completed' : applicant ? 'Open' : 'N/A';
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

      {/* Interview reminder - the portal's own equivalent of the credential
          email's "Interview open" badge / "Start your interview" CTA. Shows
          only while there's actually something to do: an applicant who
          hasn't submitted yet (isUnderReview already covers submitted +
          under-processing). Sits above the activity notice/tiles so it's
          the first action a new applicant sees, matching the "dashboard
          leads with the interview" intent. */}
      {applicant && !underReview && (
        <button className="interview-cta" onClick={() => switchScreen('interview')}>
          <div className="interview-cta-tag">
            <Icon name="video" size={14} />
            Interview open
          </div>
          <div className="interview-cta-title">Complete your interview</div>
          <div className="interview-cta-sub">
            A few minutes now is all it takes, and it's required for scholarship
            consideration. Pick up right where you left off.
          </div>
          <span className="interview-cta-go">Start your interview</span>
        </button>
      )}

      {/* Notification for group members: their live-session activity is
          published. Sits right under identity so it's the first thing they see;
          the button jumps to the Activity tab. Renders nothing for non-group
          delegates. */}
      <ActivityNotice />

      {/* Registration / payment form for partial, self and alumni tiers renders
          here. (The full-scholarship congratulations card and the recipients
          banner were removed per request; the group activity now lives in its
          own "Activity" tab.) The form host stays so un-registered delegates
          can still register. */}
      {tier && <TierResult tier={tier} />}

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
