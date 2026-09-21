// Authenticated app shell: sidebar (desktop), topbar, bottom nav (mobile),
// updates rail, mobile menu drawer, and the active screen.
import { useEffect } from 'react';
import { showInterviewTab, showRegistrationTab, showRoomUpgradeTab, useAuthStore } from '../../stores/authStore';
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
import { ScholarshipHolders } from '../screens/ScholarshipHolders';
import { Registration } from '../screens/Registration';
import { RoomUpgrade } from '../screens/RoomUpgrade';
import { regionForEmail } from '../../data/coordinatorGroups';
import { track } from '../../services/api';

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
  'scholarship-holders': ScholarshipHolders,
  registration: Registration,
  'room-upgrade': RoomUpgrade,
} as const;

export const AppLayout = () => {
  const { profile } = useAuthStore();
  const { loadAll } = useDelegateStore();
  const { activeScreen, switchScreen, menuOpen, setMenuOpen } = useUIStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Portal-interaction signal. AppLayout only mounts once the user is
  // authenticated, so this fires a `screen_view` for the screen they land on
  // (the "opened the portal" event) plus one on every navigation. Crucially
  // this captures returns on a *persisted* session — where no fresh `login`
  // event is generated — so analytics can measure real engagement (e.g. who
  // came back to view results), not just sign-ins. Best-effort; never blocks.
  useEffect(() => {
    track('screen_view', activeScreen);
  }, [activeScreen]);

  const showInterview = showInterviewTab(profile);
  // The Activity tab only exists for delegates matched to a live-session group.
  const showActivity = !!regionForEmail(profile?.email);
  const showRegistration = showRegistrationTab(profile);
  const showRoomUpgrade = showRoomUpgradeTab(profile);

  // If a gated tab disappears (submitted / enrolled / not in a group) while it's
  // active, fall back to the dashboard.
  useEffect(() => {
    if (!profile) return;
    if (activeScreen === 'interview' && !showInterview) switchScreen('dashboard');
    if (activeScreen === 'activity' && !showActivity) switchScreen('dashboard');
    if (activeScreen === 'registration' && !showRegistration) switchScreen('dashboard');
    if (activeScreen === 'room-upgrade' && !showRoomUpgrade) switchScreen('dashboard');
  }, [activeScreen, profile, showInterview, showActivity, showRegistration, showRoomUpgrade, switchScreen]);

  const ScreenComponent = SCREENS[activeScreen] || Dashboard;

  return (
    <div className="layout">
      <Sidebar
        showInterview={showInterview}
        showActivity={showActivity}
        showRegistration={showRegistration}
        showRoomUpgrade={showRoomUpgrade}
      />

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
