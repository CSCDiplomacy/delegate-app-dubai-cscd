// Visits & dinner. Institutional visits and the welcome dinner (Tugu Kunstkring
// Paleis), from the public /api/visits endpoint. Delegate accommodation lives
// on its own Hotel screen (client/src/components/screens/Hotel.tsx) — keep
// hotel/booking content there, not here.
import { useEffect, useState } from 'react';
import type { Visit, VisitsResponse } from '../../types';
import { api } from '../../services/api';
import { Icon } from '../Icon';
import { ComingSoon } from '../ComingSoon';

export const Venue = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<VisitsResponse>('/visits')
      .then((d) => {
        if (!cancelled) setVisits(d.visits || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
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

  if (!visits.length) {
    return (
      <ComingSoon
        badge="Visit & Dinner"
        title="Details on the way"
        body="Institutional visit and dinner details will appear here soon."
      />
    );
  }

  return (
    <div className="stack">
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
          {v.map && (
            <a className="chip chip-link" href={v.map} target="_blank" rel="noopener noreferrer">
              Open in Maps
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
