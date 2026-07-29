// Desktop sidebar: brand, nav, user card, theme toggle, sign out.
import { useAuthStore } from '../../stores/authStore';
import { useDelegateStore } from '../../stores/delegateStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { Screen } from '../../types';

const NAV: Array<{ screen: Screen; label: string; icon: IconName }> = [
  { screen: 'dashboard', label: 'Dashboard', icon: 'home' },
  { screen: 'about', label: 'The Summit', icon: 'globe' },
  { screen: 'rundown', label: 'Rundown', icon: 'clock' },
  { screen: 'venue', label: 'Visit & Dinner', icon: 'hotel' },
  { screen: 'schedule', label: 'My Schedule', icon: 'star' },
  { screen: 'contact', label: 'Contact', icon: 'phone' },
];

export const Sidebar = ({
  showInterview,
}: {
  showInterview: boolean;
}) => {
  const { profile, eventName, logout } = useAuthStore();
  const { activeScreen, switchScreen, theme, toggleTheme } = useUIStore();
  const voucherAvailable = useDelegateStore((s) => s.voucherAvailable);

  const items: typeof NAV = [
    NAV[0],
    ...(showInterview
      ? ([{ screen: 'interview', label: 'Interview', icon: 'video' }] as typeof NAV)
      : []),
    ...NAV.slice(1, 4), // about, rundown, venue
    ...(voucherAvailable
      ? ([{ screen: 'hotel', label: 'Hotel', icon: 'hotel' }] as typeof NAV)
      : []),
    ...NAV.slice(4), // schedule, contact
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/img/cscd-logo.png" className="brand-logo" alt="CSCD" />
        <span className="brand-sub">{eventName}</span>
      </div>

      <nav className="side-nav">
        {items.map((item) => (
          <button
            key={item.screen}
            className={`nav-link${activeScreen === item.screen ? ' active' : ''}`}
            onClick={() => switchScreen(item.screen)}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="side-foot">
        {profile && (
          <div className="side-user">
            <b>{profile.name}</b>
            <span>{profile.email}</span>
          </div>
        )}
        <button className="btn ghost small" onClick={toggleTheme}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button className="btn ghost small" onClick={() => logout()}>
          <Icon name="logOut" size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
};
