// Auth state + actions. A single module-level Supabase client is created on
// first init(); every auth state change mirrors the access token into
// localStorage so services/api.ts can attach it as a Bearer header.
import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Config, Profile } from '../types';
import { api, track, TOKEN_KEY } from '../services/api';

let sb: SupabaseClient | null = null;
let initPromise: Promise<void> | null = null;

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  eventName: string;
  /** True until the first getSession() round-trip completes. */
  initializing: boolean;
  /** True while login / reset / update-password is in flight. */
  busy: boolean;
  error: string | null;
  /** Arrived via a password-recovery link, show the new-password form. */
  recoveryMode: boolean;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  setRecoveryMode: (on: boolean) => void;
}

function storeToken(session: Session | null) {
  if (session?.access_token) localStorage.setItem(TOKEN_KEY, session.access_token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Turn a raw Supabase auth error into copy we're willing to show a delegate.
// Accounts of non-participants are disabled (banned) in Supabase Auth, which
// surfaces as a blunt "User is banned" — replace it with a soft, contactable line.
function loginErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : '';
  const code = (err as { code?: string } | null)?.code ?? '';
  if (code === 'user_banned' || /banned/i.test(raw)) {
    return "Access isn't available for this account. If you think this is a mistake, please contact us at contact@thecscd.org.";
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(raw)) {
    return 'Email or password is incorrect. Please try again.';
  }
  return raw || 'Sign-in failed. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  eventName: 'YPDS Jakarta 2026',
  initializing: true,
  busy: false,
  error: null,
  recoveryMode: typeof location !== 'undefined' && location.hash.includes('type=recovery'),

  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const config = await api<Config>('/config');
        if (config.eventName && config.eventName !== 'CSCD Delegate App') {
          set({ eventName: config.eventName });
        }
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
          set({ error: 'Sign-in is not available right now. Please try again later.' });
          return;
        }
        sb = createClient(config.supabaseUrl, config.supabaseAnonKey);

        const { data } = await sb.auth.getSession();
        if (data.session) {
          storeToken(data.session);
          set({ session: data.session });
          await get().refreshProfile();
        }

        sb.auth.onAuthStateChange((event, session) => {
          storeToken(session);
          set({ session });
          if (event === 'PASSWORD_RECOVERY') set({ recoveryMode: true });
          if (event === 'SIGNED_OUT') set({ profile: null });
        });
      } catch {
        set({ error: 'Could not reach the server. Check your connection and reload.' });
      } finally {
        set({ initializing: false });
      }
    })();
    return initPromise;
  },

  login: async (email, password) => {
    set({ busy: true, error: null });
    try {
      await get().init();
      if (!sb) throw new Error('Sign-in is not available right now.');
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      storeToken(data.session);
      set({ session: data.session });
      await get().refreshProfile();
      track('login');
    } catch (err) {
      set({ error: loginErrorMessage(err) });
      throw err;
    } finally {
      set({ busy: false });
    }
  },

  logout: async () => {
    try {
      if (sb) await sb.auth.signOut();
    } finally {
      storeToken(null);
      // Full reload resets every store and re-runs init cleanly.
      location.reload();
    }
  },

  resetPassword: async (email) => {
    set({ busy: true, error: null });
    try {
      await get().init();
      if (!sb) throw new Error('Not available right now.');
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin,
      });
      if (error) throw error;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not send the reset email.' });
      throw err;
    } finally {
      set({ busy: false });
    }
  },

  updatePassword: async (password) => {
    set({ busy: true, error: null });
    try {
      await get().init();
      if (!sb) throw new Error('Not available right now.');
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      history.replaceState(null, '', location.pathname);
      set({ recoveryMode: false });
      await get().refreshProfile();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not update the password.' });
      throw err;
    } finally {
      set({ busy: false });
    }
  },

  refreshProfile: async () => {
    try {
      const profile = await api<Profile>('/me/profile');
      set({ profile });
    } catch {
      // Keep the session usable even if the profile fetch hiccups.
    }
  },

  clearError: () => set({ error: null }),
  setRecoveryMode: (on) => set({ recoveryMode: on }),
}));

// --- Derived helpers (mirror the vanilla app's gating rules) -----------------
export const isApplicant = (profile: Profile | null) =>
  (profile?.status || 'unenrolled') !== 'enrolled';

// Interviews are now closed, so the tab only stays for anyone who already has
// an in-progress submission path, in practice nobody, since applicants either
// submitted (→ under review) or missed the window (→ self-finance route).
export const showInterviewTab = (_profile: Profile | null) => false;

// A submitted applicant awaiting the results decision. `result_status` is the
// authoritative signal once scripts/reconcile-interviews.js has run; the
// status/interview_status fallback keeps the UI correct for rows it hasn't
// reached (and for anyone whose profile predates the column).
export const isUnderReview = (profile: Profile | null) => {
  if (!isApplicant(profile)) return false;
  if (profile?.result_status === 'evaluated') return true;
  if (profile?.result_status === 'not_evaluated') return false;
  return profile?.status === 'underprocessing' || profile?.interview_status === 'submitted';
};
