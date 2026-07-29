// Mobile menu drawer: secondary links + sign out.
import { useAuthStore } from '../../stores/authStore';
import { useDelegateStore } from '../../stores/delegateStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';

export const MenuDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { profile, logout } = useAuthStore();
  const { switchScreen } = useUIStore();
  const voucherAvailable = useDelegateStore((s) => s.voucherAvailable);

  return (
    <aside className={`menu-drawer${open ? ' open' : ''}`}>
      <div className="rail-head">
        <h3>Menu</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="menu-body">
        {profile && (
          <div className="menu-user">
            {profile.name}
            <span>{profile.email}</span>
          </div>
        )}
        <button className="menu-link" onClick={() => switchScreen('about')}>
          <Icon name="globe" size={16} /> The Summit
        </button>
        <button className="menu-link" onClick={() => switchScreen('venue')}>
          <Icon name="hotel" size={16} /> Institutional Visit &amp; Dinner
        </button>
        {voucherAvailable && (
          <button className="menu-link" onClick={() => switchScreen('hotel')}>
            <Icon name="hotel" size={16} /> Hotel
          </button>
        )}
        <button className="menu-link" onClick={() => switchScreen('contact')}>
          <Icon name="phone" size={16} /> Contact us
        </button>
        <a
          className="menu-link"
          href="https://thecscd.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="globe" size={16} /> CSCD website
        </a>
        <button className="btn ghost" onClick={() => logout()}>
          <Icon name="logOut" size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
};
