// Shapes here mirror the Express API exactly — see routes/ and data/*.json.

// --- Profile (GET /api/me/profile) -----------------------------------------
export interface Profile {
  name: string;
  email: string;
  applicant_id: string | null;
  status: 'unenrolled' | 'underprocessing' | 'enrolled';
  interview_status: 'not_started' | 'submitted';
  result_status: 'pending' | 'evaluated' | 'not_evaluated';
  result_tier: ResultTier | null;
  /** Set once a full-scholarship delegate accepts their award in the portal. */
  scholarship_accepted_at: string | null;
  /** Flipped to 'submitted' by the Cognito registration webhook (partial/self). */
  registration_status: 'not_started' | 'submitted';
  registration_submitted_at: string | null;
}

// Scholarship outcome from the video-submission evaluation. `full` is the
// selected cohort named on the results banner; `partial` and `full` both
// complete registration through a Cognito form.
export type ResultTier = 'self' | 'partial' | 'full' | 'alumni';

// --- Interview (GET /api/me/interview) --------------------------------------
export interface InterviewInfo {
  state: 'open' | 'submitted' | 'not_applicable' | 'unavailable';
  url?: string;
  form_id?: string;
  submitted_at?: string;
}

// --- Rundown (GET /api/rundown) ----------------------------------------------
export interface RundownItem {
  time: string; // "09:00"
  end_time?: string;
  title: string;
  type?: string; // meal | keynote | visit | social | workshop | panel | ceremony
  venue?: string;
  description?: string;
  duration_min?: number;
}

export interface RundownDay {
  date: string; // "2026-08-20"
  label: string; // "August 20, 2026"
  title: string;
  description: string;
  items?: RundownItem[];
}

export interface Rundown {
  timezone?: string;
  days: RundownDay[];
}

/** Favourite/session id for a rundown item — matches the vanilla app + DB rows. */
export const sessionId = (day: RundownDay, item: RundownItem) => `${day.date}T${item.time}`;

// --- Hotel (GET /api/me/hotel) ------------------------------------------------
export interface HotelInfo {
  name: string;
  subtitle?: string;
  location?: string;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  image?: string;
  address?: string;
  map?: string;
  checkin?: string;
  checkout?: string;
  /** Booking terms shown under the hotel card (who books, extensions, changes). */
  policy?: string[];
}

/** One institutional visit or cultural experience (data/visits.json). */
export interface Visit {
  id: number;
  name: string;
  type?: string;
  description?: string;
  highlights?: string[];
  date?: string;
  duration?: string;
  image?: string;
}

/** GET /api/visits (public) */
export interface VisitsResponse {
  visits: Visit[];
}

/** GET /api/hotel (public) → the shared venue, no auth required. */
export interface PublicHotel {
  hotel: HotelInfo | null;
}

/** GET /api/me/hotel (auth) → the delegate's booking + shared venue. */
export interface MyHotel {
  delegate: {
    name?: string;
    applicant_id?: string;
    room?: string;
    booking_ref?: string;
    check_in?: string;
    check_out?: string;
    meals?: string;
  } | null;
  hotel: HotelInfo | null;
}

// --- Contact (GET /api/contact) ------------------------------------------------
export interface ContactEntry {
  label: string;
  value: string;
  type: 'email' | 'phone' | 'whatsapp' | 'url';
}

export interface ContactData {
  org?: string;
  venue?: { name?: string; address?: string; map?: string } | null;
  contacts?: ContactEntry[];
  socials?: ContactEntry[];
}

// --- Announcements (GET /api/announcements → { announcements: [...] }) ---------
export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
  created_at: string;
  /** Optional deep link — when set the rail renders a button that switches
   *  to this screen. Must be a valid Screen slug. */
  link_screen?: Screen | null;
  link_label?: string | null;
}

// --- Misc -----------------------------------------------------------------------
export type Theme = 'light' | 'dark';

export type Screen =
  | 'dashboard'
  | 'interview'
  | 'about'
  | 'rundown'
  | 'venue'
  | 'hotel'
  | 'schedule'
  | 'contact';

export interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  eventName: string;
}
