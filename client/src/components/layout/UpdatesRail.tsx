// Updates rail: announcements feed, pinned first (the API pre-sorts).
//
// Behaves in two modes without any prop toggle: on mobile it's a slide-out
// drawer (transform driven by .open), on desktop CSS makes it a permanent
// third column so this same component renders inline next to the main area.
// The close button is CSS-hidden on desktop where it has no meaning.
//
// Each announcement may carry a link_screen deep link — when present, a
// button renders that switches to that screen (and closes the drawer on
// mobile). This is what turns the pinned voucher notice into a one-click
// path to the Hotel section.
import { useDelegateStore } from '../../stores/delegateStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import type { Screen } from '../../types';

export const UpdatesRail = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { announcements } = useDelegateStore();
  const switchScreen = useUIStore((s) => s.switchScreen);

  const go = (screen: Screen) => {
    switchScreen(screen);
    onClose();
  };

  return (
    <aside className={`rail${open ? ' open' : ''}`}>
      <div className="rail-head">
        <h3>Updates</h3>
        <button className="icon-btn rail-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="rail-body">
        {announcements.length === 0 ? (
          <p className="rail-empty">No updates yet — announcements will land here.</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="update-card">
              {a.pinned && <span className="update-pin">Pinned</span>}
              <div className="update-title">{a.title}</div>
              <p className="update-body">{a.body}</p>
              {a.link_screen && (
                <button
                  className="btn ghost small update-link"
                  onClick={() => go(a.link_screen as Screen)}
                >
                  {a.link_label || 'Open'}
                </button>
              )}
              <div className="update-date">
                {new Date(a.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
