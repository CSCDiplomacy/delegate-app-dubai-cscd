// Top bar: brand (mobile), theme toggle, menu.
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';

export const TopBar = () => {
  const { eventName } = useAuthStore();
  const { theme, toggleTheme, setMenuOpen } = useUIStore();

  return (
    <header className="topbar">
      <div className="brand">
        <img src="/img/cscd-logo.png" className="brand-logo" alt="CSCD" />
        <span className="brand-sub">{eventName}</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <button
          className="icon-btn menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
        >
          <Icon name="menu" size={18} />
        </button>
      </div>
    </header>
  );
};
