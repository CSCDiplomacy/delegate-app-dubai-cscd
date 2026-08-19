// Root: kicks off auth init once, then routes between the login view and the
// authenticated shell. A splash shows only for returning users whose session
// is still being restored (a stored Supabase token exists), brand-new
// visitors see the login form immediately.
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LoginView } from './components/auth/LoginView';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

function hasStoredSupabaseSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('sb-') && key.includes('auth-token')) return true;
    }
  } catch {
    // localStorage unavailable, treat as signed out.
  }
  return false;
}

const Splash = () => (
  <div className="splash">
    <img src="/img/cscd-logo.png" alt="CSCD" className="brand-logo" />
    <div className="splash-spinner" />
  </div>
);

const App = () => {
  const { session, initializing, recoveryMode, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ErrorBoundary>
      {recoveryMode ? (
        <LoginView />
      ) : session ? (
        <AppLayout />
      ) : initializing && hasStoredSupabaseSession() ? (
        <Splash />
      ) : (
        <LoginView />
      )}
    </ErrorBoundary>
  );
};

export default App;
