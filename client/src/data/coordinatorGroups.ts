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

/** Team leader shown on each group's activity card. */
export const GROUP_LEADERS: Record<Region, string> = {
  East: 'Fedro Dasion',
  West: 'Sarah',
  North: 'Aayat',
  South: 'Awan',
};

/** Display roster per group (clean names, shown on the activity card). */
export const GROUP_MEMBERS: Record<Region, string[]> = {
  East: ['Bhavya Agarwal', 'Madi Diana', 'Amir Gafur', 'Garlen Mao', 'Goh Chen How Calvin'],
  West: [
    'Theint Thinzar Thaw',
    'Awil Dek Hussein',
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

/** Themed, full-text brief (public/docs) linked from the activity card. */
export const ACTIVITY_PDF_URL = '/docs/ypds-project-proposal-activity.pdf';

/**
 * The in-portal summary revealed by "View more". The full text lives in the
 * themed PDF (ACTIVITY_PDF_URL); this is the at-a-glance version.
 */
export const GROUP_ACTIVITY_DETAIL = {
  tagline: 'From field study to a live CDS event',
  theme: 'Cultural Diplomacy and Creative Economy',
  intro:
    'This isn’t an exercise on paper. Working under the theme, each delegate ' +
    'designs one real event proposal; your team then delivers one approved ' +
    'proposal as a live CDS event in October. Translate what you saw at ASEAN ' +
    'and the Ministry of Culture into a rigorous, cross-border initiative — ' +
    'take one element you observed and build something new around it.',
  steps: [
    { no: 'Step 1', title: 'Choose your pillar', note: 'individual',
      text: 'Declare one of the six CDS pillars, and spread your team across different pillars.' },
    { no: 'Step 2', title: 'Anchor it in October', note: 'individual',
      text: 'Pick a clear, well-justified October date (building on a UN observance day is optional).' },
    { no: 'Step 3', title: 'Design the event', note: 'group brainstorm, individual proposal',
      text: 'Brainstorm together, propose individually — a 60–90 min hybrid or virtual format with an objective, an interactive element and a defined output.' },
    { no: 'Step 4', title: 'Fill the proposal form', note: 'individual',
      text: 'Log in to the CDS portal with your group login above and submit your proposal in full.' },
    { no: 'Step 5', title: 'Present', note: 'YPDS Day 3',
      text: 'Each team presents as a group — one slide per event, no more than 7 slides total.' },
    { no: 'Step 6', title: 'CSCD Committee approval', note: '',
      text: 'The Committee reviews and approves the projects it will officially take forward.' },
    { no: 'Step 7', title: 'Deliver', note: 'team',
      text: 'Deliver your approved event live with CSCD on its October date.' },
  ],
  deadlines: [
    { when: 'Tonight', what: 'Individual proposal form submitted on the CDS portal.' },
    { when: 'Day 3', what: 'Team presentation — one slide per event, max 7 slides.' },
    { when: 'October', what: 'CSCD-approved projects delivered live with CSCD.' },
  ],
} as const;

// Each participant's delegate-account email → their group. Emails were taken
// straight from the delegates table so they match what a person logs in with.
const MEMBER_EMAIL_TO_REGION: Record<string, Region> = {
  // East
  'agarwalbhavya117@gmail.com': 'East', // Bhavya Agarwal
  'dianamadi04@gmail.com': 'East', // Madi Diana
  'amirhamzah1810@gmail.com': 'East', // Amir Gafur
  'garlenmao@gmail.com': 'East', // Garlen Mao
  'gohchenhowcalvin@gmail.com': 'East', // Goh Chen How Calvin
  // West
  'theint.insightful@gmail.com': 'West', // Theint Thinzar Thaw
  'cawildeeq489@gmail.com': 'West', // Awil Dek Hussein
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
