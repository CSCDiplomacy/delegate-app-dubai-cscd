// Hotel screen. The single home for ALL delegate accommodation content:
// general hotel reference info (description, address, booking policy, dress
// code, arrival essentials — data/hotels.json, via the authenticated
// /api/me/hotel endpoint) shown to every delegate who opens this screen, plus
// the voucher download and personal booking (room, dates) that only apply to
// delegates on the shared hotel booking.
//
// Reachable by every delegate via the sidebar/menu; the mobile bottom bar
// only has 5 slots, so it keeps swapping Schedule → Hotel for the voucher
// delegates specifically (more actionable pre-event for them than an empty
// personal schedule) — everyone else still gets there via the ☰ menu.
//
// The booking summary below (dates, room type, meal plan, booking number) is
// meant to be constant across all delegates for the Youth Strategic Forum,
// Dubai 2026 and stays hardcoded here rather than in hotels.json, which
// holds the reusable hotel reference info instead. The logistics partner and
// booking number are TBD — they arrive with the delegate roster, not
// invented here. If a future cohort has varying bookings, thread these
// values through the /me/voucher payload.
import { useEffect, useState } from 'react';
import { useDelegateStore } from '../../stores/delegateStore';
import { api } from '../../services/api';
import { mapsLink } from '../../lib/utils';
import { Icon } from '../Icon';
import { ComingSoon } from '../ComingSoon';
import type { MyHotel } from '../../types';

type VoucherResponse = { available: boolean; url?: string };

// Hotel name comes from the fetched `hotel.name` (confidential, only ever
// returned to an enrolled delegate) — never hardcode it here, that would ship
// it in the JS bundle for anyone to read regardless of who's logged in.
const bookingRows = (hotelName: string) => [
  { label: 'Hotel', value: `${hotelName}, Dubai` },
  { label: 'Check-in', value: '22 September 2026, from 3:00 PM' },
  { label: 'Check-out', value: '25 September 2026' },
  { label: 'Room', value: 'TBD' },
  { label: 'Meal plan', value: 'TBD' },
  { label: 'Booking No.', value: 'TBD' },
];

export const Hotel = () => {
  const voucherAvailable = useDelegateStore((s) => s.voucherAvailable);
  const [hotel, setHotel] = useState<MyHotel['hotel']>(null);
  const [booking, setBooking] = useState<MyHotel['delegate']>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<MyHotel>('/me/hotel')
      .then((d) => {
        if (cancelled) return;
        setHotel(d.hotel);
        if (d.delegate) setBooking(d.delegate);
        setLocked(!!d.locked);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const download = async () => {
    try {
      const r = await api<VoucherResponse>('/me/voucher');
      if (r.available && r.url) window.open(r.url, '_blank', 'noopener');
    } catch {
      // no-op; the button just fails silently on a transient error
    }
  };

  if (loading) {
    return (
      <div className="stack">
        <div className="skel" style={{ height: 220 }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
    );
  }

  if (locked) {
    return (
      <ComingSoon
        badge="Hotel"
        title="Confirmed delegates only"
        body="Accommodation details unlock once your place at the forum is confirmed."
      />
    );
  }

  if (!hotel) {
    return (
      <ComingSoon
        badge="Hotel"
        title="Details on the way"
        body="Accommodation details will appear here soon."
      />
    );
  }

  const map = hotel.map || mapsLink(hotel.address || hotel.name);
  const hasPersonalBooking = booking && (booking.room || booking.booking_ref || booking.check_in);

  return (
    <div className="stack">
      <div className="card">
        {hotel.image && (
          <figure className="venue-photo-frame">
            <img src={hotel.image} alt={hotel.name} className="venue-photo" loading="lazy" />
          </figure>
        )}
        <div className="card-eyebrow">{hotel.subtitle || 'Accommodation'}</div>
        <h2 className="card-title">{hotel.name}</h2>
        {hotel.location && (
          <div className="t-venue">
            <Icon name="mapPin" size={12} /> {hotel.location}
          </div>
        )}
        {hotel.description && <p className="card-body-text">{hotel.description}</p>}
        {!!hotel.highlights?.length && (
          <ul className="dot-list">
            {hotel.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        {map && (
          <a className="chip chip-link" href={map} target="_blank" rel="noopener noreferrer">
            Open in Maps
          </a>
        )}
      </div>

      {/* Voucher download + booking summary — only delegates on the shared
          hotel booking have a voucher PDF. */}
      {voucherAvailable && (
        <div className="t-card">
          <p className="tag">Your voucher</p>
          <div className="t-title">Your accommodation voucher is ready</div>
          <p className="t-desc">
            Your room for the Youth Strategic Forum, Dubai 2026 will be reserved in your name
            through our administrative and logistical partner. Details on the way.
          </p>

          <div className="pass-bottom" style={{ marginTop: 14 }}>
            {bookingRows(hotel.name).map((row) => (
              <div key={row.label} className="pass-field">
                <span className="pass-field-label">{row.label}</span>
                <span className="pass-field-value">{row.value}</span>
              </div>
            ))}
          </div>

          <p className="t-desc" style={{ marginTop: 14 }}>
            <strong>Visa.</strong> This voucher will be valid for your visa application. Attach
            the PDF to your application as proof of accommodation in the United Arab Emirates.
          </p>

          <p className="t-desc" style={{ marginTop: 10 }}>
            <strong>On arrival.</strong> There is no need to contact or confirm anything with the
            hotel directly, all delegates are grouped internally under a shared reservation. Our
            team will be on-site to receive you and handle check-in with you personally.
          </p>

          <div className="accept-cta">
            <button className="btn" onClick={download}>
              <Icon name="hotel" size={16} />
              <span style={{ marginLeft: 8 }}>Download voucher (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {hasPersonalBooking && (
        <div className="card">
          <div className="card-eyebrow">Your booking</div>
          <div className="kv-grid">
            {booking!.room && (
              <div>
                <div className="kv-label">Room</div>
                <div className="kv-value">{booking!.room}</div>
              </div>
            )}
            {booking!.booking_ref && (
              <div>
                <div className="kv-label">Booking ref</div>
                <div className="kv-value mono">{booking!.booking_ref}</div>
              </div>
            )}
            {booking!.check_in && (
              <div>
                <div className="kv-label">Check-in</div>
                <div className="kv-value">{booking!.check_in}</div>
              </div>
            )}
            {booking!.check_out && (
              <div>
                <div className="kv-label">Check-out</div>
                <div className="kv-value">{booking!.check_out}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking terms — CSCD books on the delegate's behalf, so this sets the
          expectation before anyone tries to book or change a room themselves. */}
      {!!hotel.policy?.length && (
        <div className="card">
          <div className="card-eyebrow">Booking &amp; accommodation</div>
          <ul className="dot-list">
            {hotel.policy.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dress code by day. */}
      {!!hotel.dress_code?.length && (
        <div className="card">
          <div className="card-eyebrow">Dress code</div>
          <div className="kv-grid">
            {hotel.dress_code.map((d) => (
              <div key={d.when}>
                <div className="kv-label">{d.when}</div>
                <div className="kv-value">{d.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arrival essentials — airport, transport options, immigration/currency notes. */}
      {hotel.arrival && (
        <div className="card">
          <div className="card-eyebrow">Arriving in Dubai</div>
          {hotel.arrival.airport && (
            <div className="t-venue">
              <Icon name="mapPin" size={12} /> {hotel.arrival.airport}
            </div>
          )}
          {hotel.arrival.distance && <p className="card-body-text">{hotel.arrival.distance}</p>}
          {!!hotel.arrival.options?.length && (
            <ul className="dot-list">
              {hotel.arrival.options.map((o) => (
                <li key={o.mode}>
                  {o.mode}
                  {o.cost || o.time ? `, ${[o.cost, o.time].filter(Boolean).join(' · ')}` : ''}
                </li>
              ))}
            </ul>
          )}
          {!!hotel.arrival.notes?.length && (
            <ul className="dot-list">
              {hotel.arrival.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
