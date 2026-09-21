// Room Upgrade — enrolled delegates who are booked in twin-sharing (the default
// for the whole cohort) can pay USD 140 to be moved to a single room. The
// payment form is hosted on JotForm (id 262635649527468, "Room Upgrade Form -
// Young Strategic Forum - Dubai 2026") and embedded via <iframe>; on submit,
// JotForm posts to /api/room-upgrade/webhook/:secret, which inserts a pending
// request and mails the "under review" confirmation. This tab then flips to a
// done-state card so the delegate cannot submit twice.
//
// Three states, driven by profile.room_upgrade_status:
//   null       -> intro copy + JotForm iframe (email + applicant_id prefilled)
//   'pending'  -> "Room upgrade request received" done card, no form
//   'approved' -> "Your room has been upgraded" success card, no form
//   'rejected' -> back to the intro + form (rare; treats a rejection like a
//                 fresh submission window so ops can guide the delegate)
//
// The tab itself is gated in authStore.ts's showRoomUpgradeTab -- only enrolled
// delegates with a voucher signed URL live get here. Gating is UX, not
// security: the webhook and admin scripts don't rely on it.
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../Icon';

// Form details, confirmed with the client 2026-09-21. Serves from
// pci.jotform.com because the form has a payment field (PCI-scope subdomain).
const JOTFORM_HOST = 'https://pci.jotform.com';
const ROOM_UPGRADE_FORM_ID = '262635649527468';
// JotForm field internal names for URL prefill. Applicant Id follows the same
// camelCase convention the existing three registration forms use (confirmed
// via the JotForm API, see client/src/components/JotForm.tsx). Email is the
// stock JotForm email-field internal name.
const APPLICANT_ID_FIELD = 'applicantId';
const EMAIL_FIELD = 'email';

function iframeSrc(applicantId?: string | null, email?: string | null) {
  const url = new URL(`${JOTFORM_HOST}/${ROOM_UPGRADE_FORM_ID}`);
  if (applicantId) url.searchParams.set(APPLICANT_ID_FIELD, applicantId);
  if (email) url.searchParams.set(EMAIL_FIELD, email);
  return url.toString();
}

export const RoomUpgrade = () => {
  const { profile } = useAuthStore();
  const status = profile?.room_upgrade_status || null;

  if (status === 'pending') {
    return (
      <div className="stack">
        <div>
          <div className="eyebrow">Accommodation</div>
          <h1 className="about-hero">Room Upgrade</h1>
          <p className="tag">Your request is being processed</p>
        </div>
        <div className="interview-cta is-done">
          <div className="interview-cta-tag">
            <Icon name="check" size={14} />
            Request received
          </div>
          <div className="interview-cta-title">Room upgrade request received</div>
          <div className="interview-cta-sub">
            Thank you. We have received your USD 140 payment and your request to move to a single
            room. Our team is confirming your single-room allocation with the hotel and will email
            you as soon as your booking is updated. There is nothing further you need to do right
            now.
          </div>
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="stack">
        <div>
          <div className="eyebrow">Accommodation</div>
          <h1 className="about-hero">Room Upgrade</h1>
          <p className="tag">Your single-room upgrade is confirmed</p>
        </div>
        <div className="interview-cta is-done">
          <div className="interview-cta-tag">
            <Icon name="check" size={14} />
            Upgraded
          </div>
          <div className="interview-cta-title">Your room has been upgraded</div>
          <div className="interview-cta-sub">
            Your accommodation has been upgraded to a single room for the three nights covered by
            the forum. The updated details will show on your Hotel tab once the hotel confirms the
            new booking reference.
          </div>
        </div>
      </div>
    );
  }

  // Default (status null or 'rejected'): show the intro + JotForm.
  const src = iframeSrc(profile?.applicant_id, profile?.email);

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Accommodation</div>
        <h1 className="about-hero">Room Upgrade</h1>
        <p className="tag">Move from twin-sharing to a single room</p>
      </div>

      <div className="interview-cta is-lite">
        <div className="interview-cta-tag">
          <Icon name="hotel" size={14} />
          Optional upgrade
        </div>
        <div className="interview-cta-title">Upgrade to a single room, USD 140</div>
        <div className="interview-cta-sub">
          Your delegate accommodation is a twin-sharing room for three nights, included in your
          participation. If you would prefer a single room instead, you can upgrade for USD 140
          covering the three nights. Complete the payment form below to request the upgrade. Once
          you submit, our team will confirm your single-room allocation and email you when your
          booking is updated.
        </div>
      </div>

      <div className="cognito-embed">
        <div className="cognito-embed-head">Room upgrade payment</div>
        <div className="cognito-embed-body">
          <iframe
            id={`JotFormIFrame-${ROOM_UPGRADE_FORM_ID}`}
            key={ROOM_UPGRADE_FORM_ID}
            src={src}
            title="Room Upgrade Form - Youth Strategic Forum, Dubai 2026"
            loading="lazy"
            allow="geolocation; microphone; camera; fullscreen; payment"
            style={{ width: '100%', minHeight: 900, border: 0, display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
};
