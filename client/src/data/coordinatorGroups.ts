// Live test-session groups + shared coordinator logins.
//
// Participants are split into four regional groups; each group shares ONE
// pre-created coordinator account on the CDS Spaces app (cds.thecscd.org).
// The Dashboard "Group activity" card matches the logged-in delegate to their
// group *by email* (names in the DB are unreliable - zero-width spaces,
// swapped/truncated/legal names - but emails are exact) and shows that group's
// login so they can sign in and do the activity.
//
// These are deliberately shared, disposable workshop accounts. Remove this file
// and CoordinatorActivity.tsx (+ its use in Dashboard.tsx) after the session.

export type Region = 'East' | 'West' | 'North' | 'South';

/** Shared coordinator login for each group (cds.thecscd.org). */
export const GROUP_LOGINS: Record<Region, { email: string; password: string }> = {
  East: { email: 'east.ypds@thecscd.org', password: 'YpdsEast-k6yPOVrB' },
  West: { email: 'west.ypds@thecscd.org', password: 'YpdsWest-zR4HlAxC' },
  North: { email: 'north.ypds@thecscd.org', password: 'YpdsNorth-xc3Nqqso' },
  South: { email: 'south.ypds@thecscd.org', password: 'YpdsSouth-C4EiaDjF' },
};

/** Where the group logs in to run the activity. */
export const COORDINATOR_LOGIN_URL = 'https://cds.thecscd.org/login';

/** Display roster per group (clean names, shown on the activity card). */
export const GROUP_MEMBERS: Record<Region, string[]> = {
  East: ['Bhavya Agarwal', 'Amir Gafur', 'Garlen Mao', 'Goh Chen How Calvin'],
  West: [
    'Theint Thinzar Thaw',
    'Syeda Moneebah Noman',
    'Robiyabegim Mekhrillaeva Ulugbek Kizi',
    'Kia LeClair',
  ],
  North: [
    'Eshan Jaipuriar',
    'Jad Sandakli',
    'Ayuanda Sekar Melati',
    'Nguyễn Thanh Trúc',
    'Mats Borgen',
  ],
  South: [
    'Shahram Jalal Gharib',
    'Trang Ha Thach',
    'Noluthando Sikhakhane',
    'Amina Bekpulatova',
    'Yau',
  ],
};

/**
 * The activity every group works on. Shared across all four - only the login
 * and group name differ per person.
 */
export const GROUP_ACTIVITY = {
  title: 'Propose your group’s event',
  body:
    'In this live session you’ll work with your group to design an event and ' +
    'submit it as a proposal — a hands-on run through the real coordinator ' +
    'workflow. Your whole group shares one coordinator account. Sign in with ' +
    'your group’s login below, then create and submit your proposal together.',
} as const;

// Each participant's delegate-account email → their group. Emails were taken
// straight from the delegates table so they match what a person logs in with.
const MEMBER_EMAIL_TO_REGION: Record<string, Region> = {
  // East
  'agarwalbhavya117@gmail.com': 'East', // Bhavya Agarwal
  'amirhamzah1810@gmail.com': 'East', // Amir Gafur
  'garlenmao@gmail.com': 'East', // Garlen Mao
  'gohchenhowcalvin@gmail.com': 'East', // Goh Chen How Calvin
  // West
  'theint.insightful@gmail.com': 'West', // Theint Thinzar Thaw
  'moneebah.py@gmail.com': 'West', // Syeda Moneebah Noman
  'robiyabegim_25013096@utp.edu.my': 'West', // Robiyabegim Mekhrillaeva Ulugbek Kizi
  'kialeclair22@gmail.com': 'West', // Kia LeClair
  // North
  'jaipuriar.eshan@gmail.com': 'North', // Eshan Jaipuriar
  'jadsandakli05@gmail.com': 'North', // Jad Sandakli
  'amel.susanta@gmail.com': 'North', // Ayuanda Sekar Melati
  'thanhtrucworkplace.6868@gmail.com': 'North', // Nguyễn Thanh Trúc
  'mpborgen@ziggo.nl': 'North', // Mats Borgen
  // South
  'shahram.jalal98@icloud.com': 'South', // Shahram Jalal Gharib
  'thachhatrang188@gmail.com': 'South', // Trang Ha Thach
  'sikhakhane8@gmail.com': 'South', // Noluthando Sikhakhane
  'farida.f440@gmail.com': 'South', // Amina Bekpulatova
  'mordecaiyau@hotmail.com.hk': 'South', // Yau (Ka Chun)
};

/** The group for a given delegate email, or null if they aren't in the activity. */
export function regionForEmail(email?: string | null): Region | null {
  if (!email) return null;
  return MEMBER_EMAIL_TO_REGION[email.trim().toLowerCase()] ?? null;
}
