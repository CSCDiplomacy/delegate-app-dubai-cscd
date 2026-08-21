// "Activity" screen: the live-session group activity, in its own tab (moved off
// the Dashboard). CoordinatorActivity self-gates by email and renders nothing
// for anyone not in a group — the nav tab is gated too, and AppLayout sends a
// non-group visitor back to the dashboard. Remove with coordinatorGroups.ts
// after the session.
import { CoordinatorActivity } from './CoordinatorActivity';

export const Activity = () => <CoordinatorActivity />;
