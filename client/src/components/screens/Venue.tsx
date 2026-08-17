// Visit & stay. The delegate hotel comes from the public /api/hotel endpoint so
// every user can explore it; a delegate's personal booking (room, dates) is
// merged in from the auth'd /api/me/hotel when present. The institutional visits
// and dinner (Tugu Kunstkring Paleis) are listed below it from /api/visits.
import { useEffect, useState } from 'react';
import type { HotelInfo, MyHotel, PublicHotel, Visit, VisitsResponse } from '../../types';
import { api } from '../../services/api';
import { mapsLink } from '../../lib/utils';
import { Icon } from '../Icon';

export const Venue = () => {
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [booking, setBooking] = useState<MyHotel['delegate']>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Public venue for everyone.
    api<PublicHotel>('/hotel')
      .then((d) => {
        if (!cancelled) setHotel(d.hotel);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Institutional visits & dinner — public, empty array renders nothing.
    api<VisitsResponse>('/visits')
      .then((d) => {
        if (!cancelled) setVisits(d.visits || []);
      })
      .catch(() => {});
    // Personal booking if the delegate has one (ignore failures / applicants).
    api<MyHotel>('/me/hotel')
      .then((d) => {
        if (!cancelled && d.delegate) setBooking(d.delegate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="stack">
        <div className="skel" style={{ height: 220 }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="coming-soon">
        <div className="coming-soon-badge">Visit &amp; Dinner</div>
        <h2 className="coming-soon-title">Details on the way</h2>
        <p className="coming-soon-body">
          Institutional visit and dinner details will appear here soon.
        </p>
      </div>
    );
  }

  const map = hotel.map || mapsLink(hotel.address || hotel.name);
  const hasBooking = booking && (booking.room || booking.booking_ref || booking.check_in);

  return (
    <div className="stack">
      <div className="card">
        {hotel.image && (
          <figure className="venue-photo-frame">
            <img src={hotel.image} alt={hotel.name} className="venue-photo" loading="lazy" />
          </figure>
        )}
        <div className="card-eyebrow">{hotel.subtitle || 'Institutional visit & dinner'}</div>
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
          <div className="card-eyebrow">Arriving in Jakarta</div>
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
                  {o.cost || o.time ? ` — ${[o.cost, o.time].filter(Boolean).join(' · ')}` : ''}
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

      {hasBooking && (
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

      {/* Institutional visits & the dinner reception. */}
      {!!visits.length && (
        <>
          <div className="section-label">Visits &amp; dinner</div>
          {visits.map((v) => (
            <div className="card" key={v.id}>
              {v.image && (
                <figure className="venue-photo-frame">
                  <img src={v.image} alt={v.name} className="venue-photo" loading="lazy" />
                </figure>
              )}
              {v.type && <div className="card-eyebrow">{v.type}</div>}
              <h2 className="card-title">{v.name}</h2>
              {(v.date || v.duration) && (
                <div className="t-venue">
                  <Icon name="clock" size={12} /> {[v.date, v.duration].filter(Boolean).join(' · ')}
                </div>
              )}
              {v.description && <p className="card-body-text">{v.description}</p>}
              {!!v.highlights?.length && (
                <ul className="dot-list">
                  {v.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};
