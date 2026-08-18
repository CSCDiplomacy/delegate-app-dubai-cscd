// Hotel screen. Home for the accommodation voucher (download + booking summary
// + visa/arrival notes). Gated in the nav to the 17 delegates on the shared
// Diplomark booking — anyone else who lands here (deep link, etc.) sees a
// short "not available" note rather than an empty screen.
//
// The booking details are constant across all delegates for YPDS Jakarta 2026
// (shared Diplomark booking No. 1755043942). If a future cohort has varying
// bookings, thread these values through the /me/voucher payload.
import { useDelegateStore } from '../../stores/delegateStore';
import { api } from '../../services/api';
import { Icon } from '../Icon';

type VoucherResponse = { available: boolean; url?: string };

const BOOKING = [
  { label: 'Hotel', value: 'ARTOTEL Thamrin — Jakarta' },
  { label: 'Check-in', value: '20 August 2026, from 3:00 PM' },
  { label: 'Check-out', value: '23 August 2026' },
  { label: 'Room', value: 'Single room, twin sharing' },
  { label: 'Meal plan', value: 'Bed & Breakfast' },
  { label: 'Booking No.', value: '1755043942' },
];

export const Hotel = () => {
  const voucherAvailable = useDelegateStore((s) => s.voucherAvailable);

  const download = async () => {
    try {
      const r = await api<VoucherResponse>('/me/voucher');
      if (r.available && r.url) window.open(r.url, '_blank', 'noopener');
    } catch {
      // no-op; the button just fails silently on a transient error
    }
  };

  if (!voucherAvailable) {
    return (
      <div className="coming-soon">
        <div className="coming-soon-badge">Hotel</div>
        <h2 className="coming-soon-title">Not available yet</h2>
        <p className="coming-soon-body">
          Your accommodation voucher will appear here once your booking is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="t-card">
        <p className="tag">Accommodation</p>
        <div className="t-title">Your accommodation voucher is ready</div>
        <p className="t-desc">
          Your room for YPDS Jakarta 2026 has been reserved in your name through our administrative
          and logistical partner, <strong>Diplomark Limited</strong>.
        </p>

        <div className="pass-bottom" style={{ marginTop: 14 }}>
          {BOOKING.map((row) => (
            <div key={row.label} className="pass-field">
              <span className="pass-field-label">{row.label}</span>
              <span className="pass-field-value">{row.value}</span>
            </div>
          ))}
        </div>

        <p className="t-desc" style={{ marginTop: 14 }}>
          <strong>Hotel address.</strong> Jl. Sunda No.3, RT.8/RW.4, Gondangdia, Kec. Menteng, Kota
          Jakarta Pusat, DKI Jakarta 10350, Indonesia · +62 21 31925888.
        </p>

        <p className="t-desc" style={{ marginTop: 10 }}>
          <strong>Visa.</strong> This voucher will be valid for your visa application. Attach the
          PDF to your application as proof of accommodation in Indonesia.
        </p>

        <p className="t-desc" style={{ marginTop: 10 }}>
          <strong>On arrival.</strong> There is no need to contact or confirm anything with the
          hotel directly — all delegates are grouped internally under the Diplomark reservation.
          Our team will be on-site to receive you and handle check-in with you personally.
        </p>

        <p className="t-desc" style={{ marginTop: 10 }}>
          <strong>Early arrival.</strong> Standard check-in is from 3:00 PM. Early check-in around
          1:00 PM may be available subject to room availability — if your room isn't ready yet,
          you're welcome to wait in the lobby.
        </p>

        <div className="accept-cta">
          <button className="btn" onClick={download}>
            <Icon name="hotel" size={16} />
            <span style={{ marginLeft: 8 }}>Download voucher (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
