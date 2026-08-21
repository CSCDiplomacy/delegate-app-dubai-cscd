// Authenticated app shell: sidebar (desktop), topbar, bottom nav (mobile),
// updates rail, mobile menu drawer, and the active screen.
import { useEffect } from 'react';
import { showInterviewTab, useAuthStore } from '../../stores/authStore';
import { useDelegateStore } from '../../stores/delegateStore';
import { useUIStore } from '../../stores/uiStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { MenuDrawer } from './MenuDrawer';
import { Dashboard } from '../screens/Dashboard';
import { Interview } from '../screens/Interview';
import { Activity } from '../screens/Activity';
import { About } from '../screens/About';
import { Rundown } from '../screens/Rundown';
import { Venue } from '../screens/Venue';
import { Hotel } from '../screens/Hotel';
import { Schedule } from '../screens/Schedule';
import { Contact } from '../screens/Contact';
import { regionForEmail } from '../../data/coordinatorGroups';

const SCREENS = {
  dashboard: Dashboard,
  interview: Interview,
  activity: Activity,
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
  const { activeScreen, switchScreen, menuOpen, setMenuOpen } = useUIStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const showInterview = showInterviewTab(profile);
  // The Activity tab only exists for delegates matched to a live-session group.
  const showActivity = !!regionForEmail(profile?.email);

  // If a gated tab disappears (submitted / enrolled / not in a group) while it's
  // active, fall back to the dashboard.
  useEffect(() => {
    if (!profile) return;
    if (activeScreen === 'interview' && !showInterview) switchScreen('dashboard');
    if (activeScreen === 'activity' && !showActivity) switchScreen('dashboard');
  }, [activeScreen, profile, showInterview, showActivity, switchScreen]);

  const ScreenComponent = SCREENS[activeScreen] || Dashboard;

  return (
    <div className="layout">
      <Sidebar showInterview={showInterview} showActivity={showActivity} />

      <main className="main">
        <TopBar />
        <div className="main-inner">
          <ScreenComponent />
        </div>
      </main>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <BottomNav showInterview={showInterview} showActivity={showActivity} />
    </div>
  );
};
