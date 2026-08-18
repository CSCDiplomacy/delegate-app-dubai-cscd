// Event data + per-user data (favourites). Favourite toggles are optimistic:
// the Set updates immediately, the API call runs behind it, and the change is
// rolled back if the server rejects it.
import { create } from 'zustand';
import type { ActionItem, ContactData, Rundown } from '../types';
import * as dataService from '../services/data';

interface DelegateState {
  rundown: Rundown | null;
  contact: ContactData | null;
  actionItems: ActionItem[];
  favourites: Set<string>;
  /** Whether an accommodation voucher PDF exists for the caller (gates the
   *  Hotel nav item + screen). Only the 17 delegates on the shared Diplomark
   *  booking have one. */
  voucherAvailable: boolean;
  loaded: boolean;

  loadAll: () => Promise<void>;
  toggleFavourite: (sessionId: string) => Promise<void>;
}

let loadPromise: Promise<void> | null = null;

export const useDelegateStore = create<DelegateState>((set, get) => ({
  rundown: null,
  contact: null,
  actionItems: [],
  favourites: new Set<string>(),
  voucherAvailable: false,
  loaded: false,

  loadAll: () => {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const [rundown, contact, actionItems, favourites, voucherAvailable] = await Promise.all([
        dataService.loadRundown(),
        dataService.loadContact(),
        dataService.loadActionItems(),
        dataService.loadFavourites(),
        dataService.loadVoucherAvailability(),
      ]);
      set({
        rundown,
        contact,
        actionItems,
        favourites: new Set(favourites),
        voucherAvailable,
        loaded: true,
      });
    })();
    return loadPromise;
  },

  toggleFavourite: async (sessionId) => {
    const had = get().favourites.has(sessionId);
    const apply = (on: boolean) =>
      set((state) => {
        const next = new Set(state.favourites);
        if (on) next.add(sessionId);
        else next.delete(sessionId);
        return { favourites: next };
      });

    apply(!had); // optimistic
    try {
      if (had) await dataService.removeFavourite(sessionId);
      else await dataService.addFavourite(sessionId);
    } catch {
      apply(had); // roll back
    }
  },
}));
