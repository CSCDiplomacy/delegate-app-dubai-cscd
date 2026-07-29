// Data loaders for the app's API. Endpoints and response shapes mirror the
// Express routes exactly:
//   GET  /api/rundown        → { timezone, days: [...] }        (static JSON)
//   GET  /api/contact        → { org, venue, contacts, socials } (static JSON)
//   GET  /api/hotel          → { hotel }                         (static JSON)
//   GET  /api/announcements  → { announcements: [...] }
//   GET  /api/favourites     → { favourites: [{ session_id }] }  (auth)
//   POST /api/favourites       { session_id }                    (auth)
//   DEL  /api/favourites/:id                                     (auth)
//   POST /api/feedback         { comment, rating?, session_id? } (auth)
import { api } from './api';
import type { Announcement, ContactData, Rundown } from '../types';

export async function loadRundown(): Promise<Rundown | null> {
  try {
    const data = await api<Rundown>('/rundown');
    return data && Array.isArray(data.days) ? data : null;
  } catch {
    return null;
  }
}

export async function loadContact(): Promise<ContactData | null> {
  try {
    return await api<ContactData>('/contact');
  } catch {
    return null;
  }
}

export async function loadAnnouncements(): Promise<Announcement[]> {
  try {
    const data = await api<{ announcements: Announcement[] }>('/announcements');
    return Array.isArray(data?.announcements) ? data.announcements : [];
  } catch {
    return [];
  }
}

export async function loadFavourites(): Promise<string[]> {
  try {
    const data = await api<{ favourites: Array<{ session_id: string }> }>('/favourites');
    return (data?.favourites || []).map((f) => f.session_id);
  } catch {
    return [];
  }
}

export async function addFavourite(sessionId: string): Promise<void> {
  await api('/favourites', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function removeFavourite(sessionId: string): Promise<void> {
  await api(`/favourites/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

// Whether an accommodation voucher PDF exists in Supabase Storage for the
// caller. `undefined` on failure so the UI can distinguish "not loaded yet"
// from "definitely no voucher"; we treat that as false at the UI edges.
export async function loadVoucherAvailability(): Promise<boolean> {
  try {
    const data = await api<{ available: boolean; url?: string }>('/me/voucher');
    return !!data?.available;
  } catch {
    return false;
  }
}

export async function submitFeedback(comment: string): Promise<void> {
  await api('/feedback', {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}
