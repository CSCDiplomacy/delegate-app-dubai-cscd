// Orientation card. Shows on the Dashboard for delegates who have confirmed
// their place (registration submitted, or a full scholarship accepted) — see
// `registered` in Dashboard.tsx. One-off, hardcoded for the Aug 14, 2026
// online orientation; safe to delete once the event has passed.
import { useEffect, useState } from 'react';
import { Icon } from '../Icon';

// 5:00–6:00 PM GST (Dubai, UTC+4) on Aug 14, 2026, expressed as UTC instants
// so the countdown and the .ics file are correct regardless of the viewer's
// own timezone.
const START = new Date('2026-08-14T13:00:00Z');
const END = new Date('2026-08-14T14:00:00Z');
const MEET_URL = 'https://meet.google.com/ivc-ijnd-orj';

function buildIcsContent() {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CSCD//YPDS Jakarta 2026//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:ypds-jkt-2026-orientation@thecscd.org',
    `DTSTART:${fmt(START)}`,
    `DTEND:${fmt(END)}`,
    'SUMMARY:YPDS Jakarta 2026 — Online Orientation',
    `DESCRIPTION:Join the orientation: ${MEET_URL}`,
    `LOCATION:${MEET_URL}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function addToCalendar() {
  const blob = new Blob([buildIcsContent()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ypds-jakarta-2026-orientation.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function countdownParts(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h, m, s };
}

export const OrientationCard = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now >= END.getTime()) {
    return (
      <div className="t-card is-award">
        <p className="tag">Orientation</p>
        <div className="accept-confirmed">
          <span className="chip chip-ok">Concluded</span>
          <p className="t-desc">
            The online orientation has concluded — thank you for joining. If you missed it or have
            questions, please reach out to our team.
          </p>
        </div>
      </div>
    );
  }

  const live = now >= START.getTime();
  const { h, m, s } = countdownParts(START.getTime() - now);

  return (
    <div className="t-card is-award">
      <p className="tag">Orientation</p>
      <div className="t-title">Official online orientation</div>
      <p className="t-desc">
        Connect with fellow delegates and get key updates ahead of the Summit. Join a few minutes
        early to make sure your connection is working smoothly.
      </p>
      <div className="pass-field" style={{ marginTop: 12 }}>
        <span className="pass-field-label">Date</span>
        <span className="pass-field-value">August 14, 2026</span>
      </div>
      <div className="pass-field">
        <span className="pass-field-label">Time</span>
        <span className="pass-field-value">5:00 – 6:00 PM (GST, Dubai)</span>
      </div>

      {live ? (
        <div className="accept-cta">
          <a className="btn" href={MEET_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="video" size={16} />
            Join now
          </a>
        </div>
      ) : (
        <>
          <div className="countdown" role="timer" aria-label={`Orientation starts in ${h} hours ${m} minutes ${s} seconds`}>
            <div className="countdown-unit">
              <span className="countdown-value">{String(h).padStart(2, '0')}</span>
              <span className="countdown-label">hrs</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-value">{String(m).padStart(2, '0')}</span>
              <span className="countdown-label">min</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-unit">
              <span className="countdown-value">{String(s).padStart(2, '0')}</span>
              <span className="countdown-label">sec</span>
            </div>
          </div>
          <div className="accept-cta">
            <button className="btn ghost" onClick={addToCalendar}>
              <Icon name="calendar" size={16} />
              Add to calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
};
