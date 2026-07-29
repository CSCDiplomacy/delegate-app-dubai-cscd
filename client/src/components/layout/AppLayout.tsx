// Authenticated app shell: sidebar (desktop), topbar, bottom nav (mobile),
// updates rail, mobile menu drawer, and the active screen.
import { useEffect } from 'react';
import { showInterviewTab, useAuthStore } from '../../stores/authStore';
import { useDelegateStore } from '../../stores/delegateStore';
import { useUIStore } from '../../stores/uiStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { UpdatesRail } from './UpdatesRail';
import { MenuDrawer } from './MenuDrawer';
import { Dashboard } from '../screens/Dashboard';
import { Interview } from '../screens/Interview';
import { About } from '../screens/About';
import { Rundown } from '../screens/Rundown';
import { Venue } from '../screens/Venue';
import { Hotel } from '../screens/Hotel';
import { Schedule } from '../screens/Schedule';
import { Contact } from '../screens/Contact';

const SCREENS = {
  dashboard: Dashboard,
  interview: Interview,
  about: About,
  rundown: Rundown,
  venue: Venue,
  hotel: Hotel,
  schedule: Schedule,
  contact: Contact,
} as const;

export const AppLayout = () => {
  const { profile } = useAuthStore();
  const { loadAll } = useDelegateStore();
  const { activeScreen, switchScreen, menuOpen, railOpen, setMenuOpen, setRailOpen } =
    useUIStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const showInterview = showInterviewTab(profile);

  // If a gated tab disappears (submitted / enrolled / no result yet) while it's
  // active, fall back to the dashboard.
  useEffect(() => {
    if (!profile) return;
    if (activeScreen === 'interview' && !showInterview) switchScreen('dashboard');
  }, [activeScreen, profile, showInterview, switchScreen]);

  const ScreenComponent = SCREENS[activeScreen] || Dashboard;

  return (
    <div className="layout">
      <Sidebar showInterview={showInterview} />

      <main className="main">
        <TopBar />
        <div className="main-inner">
          <ScreenComponent />
        </div>
      </main>

      <UpdatesRail open={railOpen} onClose={() => setRailOpen(false)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      {(menuOpen || railOpen) && (
        <div
          className="backdrop"
          onClick={() => {
            setMenuOpen(false);
            setRailOpen(false);
          }}
        />
      )}

      <BottomNav showInterview={showInterview} />
    </div>
  );
};
