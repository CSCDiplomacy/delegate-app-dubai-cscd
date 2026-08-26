// Registration — dedicated screen for the partial/self/alumni JotForm embed
// (moved off the Dashboard 2026-08-27, per request; TierResult itself is
// unchanged, just relocated here from Dashboard.tsx). Gated by
// showRegistrationTab in authStore.ts: only tiers that owe a form get here,
// and the tab/route falls back to the dashboard once registration_status
// flips to 'submitted' (see AppLayout.tsx's gating effect, mirrors how the
// old Interview tab handled the same "gone once done" pattern).
import { useAuthStore } from '../../stores/authStore';
import { TierResult } from './Results';

export const Registration = () => {
  const { profile } = useAuthStore();
  const tier = profile?.result_tier || null;

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Results announced</div>
        <h1 className="about-hero">Registration</h1>
        <p className="tag">Complete your scholarship registration and payment</p>
      </div>
      {tier && <TierResult tier={tier} />}
    </div>
  );
};
