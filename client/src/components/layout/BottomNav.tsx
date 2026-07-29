// Mobile bottom navigation. When the applicant still owes an interview it
// takes a slot; otherwise the standard four tabs show.
import { useDelegateStore } from '../../stores/delegateStore';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { Screen } from '../../types';

type NavItem = { screen: Screen; label: string; icon: IconName };

const BASE: NavItem[] = [
  { screen: 'dashboard', label: 'Home', icon: 'home' },
  { screen: 'about', label: 'Summit', icon: 'globe' },
  { screen: 'rundown', label: 'Rundown', icon: 'clock' },
  { screen: 'venue', label: 'Visit', icon: 'hotel' },
  { screen: 'schedule', label: 'Schedule', icon: 'star' },
];

const WITH_INTERVIEW: NavItem[] = [
  BASE[0],
  { screen: 'interview', label: 'Interview', icon: 'video' },
  BASE[1],
  BASE[2],
  BASE[3],
];

const HOTEL_ITEM: NavItem = { screen: 'hotel', label: 'Hotel', icon: 'hotel' };

export const BottomNav = ({
  showInterview,
}: {
  showInterview: boolean;
}) => {
  const { activeScreen, switchScreen } = useUIStore();
  const voucherAvailable = useDelegateStore((s) => s.voucherAvailable);
  // With only 5 mobile slots, we swap Schedule → Hotel for the ~17 delegates
  // who have a voucher — Hotel is more actionable pre-event than an empty
  // personal schedule.
  const base = showInterview
    ? WITH_INTERVIEW
    : voucherAvailable
    ? [BASE[0], BASE[1], BASE[2], BASE[3], HOTEL_ITEM]
    : BASE;
  const items = base;

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.screen}
          className={`nav-item${activeScreen === item.screen ? ' active' : ''}`}
          onClick={() => switchScreen(item.screen)}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
