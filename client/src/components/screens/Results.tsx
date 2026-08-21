// Results. These render inline on the dashboard - there is no separate Results
// screen.
//
// `result_tier` (from the evaluation workbook, via scripts/reconcile-tiers.js)
// is the ONLY thing that decides what a delegate sees. Whether they interviewed
// is irrelevant here - the tier sheets are the authority, and many tiered
// applicants never interviewed.
//
//   full    → scholarship covers the fee; nothing renders (congratulations card
//             was removed per request; the team confirms these places directly)
//   partial → pays 50%; registers + pays through Cognito form 79
//   self    → pays in full; registers + pays through Cognito form 78
//   alumni  → registers through Cognito form 81
//
// No tier → nothing renders at all (see Dashboard).
import { CognitoForm, COGNITO_FORM_IDS } from '../CognitoForm';
import { useAuthStore } from '../../stores/authStore';
import type { ResultTier } from '../../types';

export const TierResult = ({ tier }: { tier: ResultTier }) => {
  const profile = useAuthStore((s) => s.profile);

  // A full scholarship covers the fee, so there is nothing to pay and no
  // registration form. The congratulations card was removed, so nothing renders.
  if (tier === 'full') return null;

  // partial/self: the outcome shows in the credential card; the registration
  // form (with its own title) carries the context. Once registered nothing shows.
  if (tier === 'partial' || tier === 'self') {
    const partial = tier === 'partial';
    const registered = profile?.registration_status === 'submitted';
    if (registered) return null;
    return (
      <CognitoForm
        formId={COGNITO_FORM_IDS[tier]}
        title={partial ? 'Partial scholarship registration' : 'Self-financed registration'}
        applicantId={profile?.applicant_id}
      />
    );
  }

  // alumni: dedicated registration form (Cognito 81); same treatment.
  const registered = profile?.registration_status === 'submitted';
  if (registered) return null;
  return (
    <CognitoForm
      formId={COGNITO_FORM_IDS.alumni}
      title="Alumni registration"
      applicantId={profile?.applicant_id}
    />
  );
};
