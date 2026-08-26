// Results. These render inline on the dashboard - there is no separate Results
// screen.
//
// `result_tier` (from the evaluation workbook, via scripts/reconcile-tiers.js)
// is the ONLY thing that decides what a delegate sees. Whether they interviewed
// is irrelevant here - the tier sheets are the authority, and many tiered
// applicants never interviewed.
//
//   full            → scholarship covers the fee; nothing renders (team
//                      confirms these places directly)
//   special_alumni  → same as full: nothing renders, no payment (client
//                      decision 2026-08-27 — see app_brain/Dubai Fork Progress.md)
//   partial         → pays 50%; registers + pays through JotForm (partial)
//   self            → pays in full; registers + pays through JotForm (self)
//   alumni          → pays; registers + pays through JotForm (alumni)
//
// No tier → nothing renders at all (see Dashboard).
import { JotForm, JOTFORM_IDS } from '../JotForm';
import { useAuthStore } from '../../stores/authStore';
import type { ResultTier } from '../../types';

const TITLES: Record<'partial' | 'self' | 'alumni', string> = {
  partial: 'Partial scholarship registration',
  self: 'Self-financed registration',
  alumni: 'Alumni registration',
};

export const TierResult = ({ tier }: { tier: ResultTier }) => {
  const profile = useAuthStore((s) => s.profile);

  // Full scholarship and special-alumni both cover the fee, so there is
  // nothing to pay and no registration form.
  if (tier === 'full' || tier === 'special_alumni') return null;

  // partial/self/alumni: the outcome shows in the credential card; the
  // registration form (with its own title) carries the context. Once
  // registered nothing shows.
  const registered = profile?.registration_status === 'submitted';
  if (registered) return null;
  return (
    <JotForm
      formId={JOTFORM_IDS[tier]}
      title={TITLES[tier]}
      applicantId={profile?.applicant_id}
    />
  );
};
