// Dashboard. Interviews are now closed and results are published here inline —
// there is no separate Results screen. Evaluated applicants get the countdown,
// then the announcement banner and their own scholarship outcome. Event tiles
// stay visible but read "Coming soon" until data is published.
import {
  isApplicant,
  isUnderReview,
  useAuthStore,
} from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { Screen } from '../../types';
import { SelectedBanner, TierResult } from './Results';

const TILES: Array<{ screen: Screen; icon: IconName; title: string; sub: string }> = [
  { screen: 'about', icon: 'globe', title: 'The Summit', sub: 'Themes, story & lineage' },
  { screen: 'rundown', icon: 'clock', title: 'Rundown', sub: 'The day-by-day programme' },
  { screen: 'venue', icon: 'hotel', title: 'Institutional visit & dinner', sub: 'City visits, dinner logistics' },
  { screen: 'schedule', icon: 'star', title: 'My Schedule', sub: 'Sessions you starred' },
];

export const Dashboard = () => {
  const { profile } = useAuthStore();
  const { switchScreen } = useUIStore();

  const applicant = isApplicant(profile);
  const underReview = isUnderReview(profile);
  const tier = profile?.result_tier || null;

  // Results are published, so anyone with a tier reads "Result announced".
  // Tier — not interview status — is what decides this.
  const statusLabel = !applicant ? 'Confirmed delegate' : tier ? 'Result announced' : 'Applicant';
  const statusChip = !applicant || tier ? 'chip-ok' : 'chip-pending';
  const interviewLabel = underReview ? 'Completed' : applicant ? 'Closed' : '—';

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
              YPDS
              <br />
              JKT
              <br />
              2026
            </span>
          </div>
        </div>
        <div className="pass-perf" />
        <div className="pass-bottom">
          <div className="pass-field">
            <span className="pass-field-label">Applicant ID</span>
            <span className="pass-field-value">{profile?.applicant_id || '—'}</span>
          </div>
          <div className="pass-field">
            <span className="pass-field-label">Status</span>
            <span className="pass-field-value">
              <span className={`chip ${statusChip}`}>{statusLabel}</span>
            </span>
          </div>
          <div className="pass-field">
            <span className="pass-field-label">Interview</span>
            <span className="pass-field-value">{interviewLabel}</span>
          </div>
        </div>
      </div>

      {/* Results live inline on the dashboard — there is no separate Results
          screen. Before the announcement moment everyone evaluated sees the
          countdown; after it, the banner plus their own scholarship outcome. */}
      {/* Their own outcome leads; the cohort banner follows it. Anyone without
          a tier has no outcome on record and sees neither. */}
      {tier && (
        <>
          <TierResult tier={tier} />
          <SelectedBanner />
        </>
      )}

      {/* Featured banner */}
      <div className="dash-banner">
        <img src="/img/ypds-jakarta-2026-banner.png" alt="YPDS Jakarta 2026" loading="lazy" />
      </div>

      {/* Section tiles */}
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
