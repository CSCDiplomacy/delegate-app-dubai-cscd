// Shapes here mirror the Express API exactly, see routes/ and data/*.json.

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
  /** A `self`-tier delegate's request to be re-evaluated for the partial (50%)
   *  scholarship. null = never requested; otherwise the admin decision state. */
  scholarship_request_status: 'pending' | 'approved' | 'rejected' | null;
}

// Scholarship outcome from the video-submission evaluation. `full` is the
// selected cohort named on the results banner; `partial` and `full` both
// complete registration through a Cognito form.
export type ResultTier = 'self' | 'partial' | 'full' | 'alumni' | 'special_alumni';

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

/** Favourite/session id for a rundown item, matches the vanilla app + DB rows. */
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
  /** Dress code by day, shown as a compact card. */
  dress_code?: { when: string; code: string }[];
  /** Airport → hotel arrival essentials, shown as a compact card. */
  arrival?: {
    airport?: string;
    distance?: string;
    options?: { mode: string; cost?: string; time?: string }[];
    notes?: string[];
  };
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
  map?: string;
}

/** GET /api/visits (public) */
export interface VisitsResponse {
  visits: Visit[];
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
  /** True for applicants — the hotel is confidential, confirmed delegates only. */
  locked?: boolean;
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


// --- Action items (GET /api/action-items → { action_items: [...] }) ------------
// Dashboard "Actions To Do" checklist, things a delegate must go *do*
// (fill out a form, join a group), separate from the Updates feed which is
// for things to *read*. link_url is typically off-portal (Google Forms,
// WhatsApp invites) so it's a plain external link, not a Screen deep link.
export interface ActionItem {
  id: string;
  title: string;
  body?: string | null;
  link_url?: string | null;
  link_label?: string | null;
  due_date?: string | null;
  created_at: string;
}

// --- Misc -----------------------------------------------------------------------
export type Theme = 'light' | 'dark';

export type Screen =
  | 'dashboard'
  | 'interview'
  | 'activity'
  | 'about'
  | 'rundown'
  | 'venue'
  | 'hotel'
  | 'schedule'
  | 'contact'
  | 'scholarship-holders'
  | 'registration';

export interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  eventName: string;
}
