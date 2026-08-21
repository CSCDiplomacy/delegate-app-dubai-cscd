// Dashboard notification: a group member's live-session activity has been
// published. Gated to delegates matched to a group (the same set that has the
// Activity tab); the button deep-links straight there via switchScreen. Remove
// with coordinatorGroups.ts after the session.
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import { regionForEmail, GROUP_LEADERS } from '../../data/coordinatorGroups';

export const ActivityNotice = () => {
  const { profile } = useAuthStore();
  const { switchScreen } = useUIStore();
  const region = regionForEmail(profile?.email);
  if (!region) return null;

  const leader = GROUP_LEADERS[region];

  return (
    <div className="activity-notice">
      <div className="activity-notice-icon" aria-hidden>
        <Icon name="bell" size={18} />
      </div>
      <div className="activity-notice-body">
        <div className="activity-notice-title">Your group activity is ready</div>
        <p className="activity-notice-text">
          Your activity has been uploaded — check it out and contact your team leader,{' '}
          {leader}, to get started.
        </p>
        <button className="btn" onClick={() => switchScreen('activity')}>
          Open Activity →
        </button>
      </div>
    </div>
  );
};
