// Temporary "deadline extension" notice for the Aug 25 2026 submission
// deadline. Ticks down live, once a second, to 8:00 PM Gulf Standard Time
// regardless of the viewer's own timezone — the target is parsed with an
// explicit +04:00 offset (Asia/Dubai has no DST) so it isn't re-derived from
// the browser's local clock. Once the deadline passes, the clock is swapped
// for a bold "deadline passed" message and stays that way. Self-contained,
// no props, unconditional (unlike ActivityNotice this isn't audience-gated).
// Remove this component and its Dashboard import once the extension window
// has closed and the team no longer needs the reminder to show.
import { useEffect, useState } from 'react';
import { Icon } from '../Icon';

const DEADLINE = new Date('2026-08-25T20:00:00+04:00'); // 8:00 PM GST, Aug 25 2026

interface Remaining {
  hours: number;
  minutes: number;
  seconds: number;
}

const getRemaining = (): Remaining | null => {
  const diffMs = DEADLINE.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const pad = (n: number) => String(n).padStart(2, '0');

export const DeadlineCountdown = () => {
  const [remaining, setRemaining] = useState<Remaining | null>(getRemaining);

  useEffect(() => {
    const id = setInterval(() => {
      const next = getRemaining();
      setRemaining(next);
      if (!next) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const passed = !remaining;

  return (
    <div className={`countdown-card${passed ? ' is-expired' : ''}`}>
      <div className="countdown-tag">
        <Icon name="clock" size={14} />
        Deadline update
      </div>
      <div className="countdown-title">Extended deadline: today at 8:00 PM (GST)</div>
      <p className="countdown-sub">
        Initial deadline: 12:00 PM GST. We strongly encourage you to complete
        your submission as early as possible. However, to accommodate any
        urgencies, the absolute maximum deadline has been extended to
        8:00 PM Gulf Standard Time (Dubai, UTC+4).
      </p>
      {passed ? (
        <div className="countdown-passed">Deadline passed</div>
      ) : (
        <div className="countdown-clock">
          <div className="countdown-unit">
            <span className="countdown-num">{pad(remaining.hours)}</span>
            <span className="countdown-label">Hours</span>
          </div>
          <span className="countdown-colon">:</span>
          <div className="countdown-unit">
            <span className="countdown-num">{pad(remaining.minutes)}</span>
            <span className="countdown-label">Minutes</span>
          </div>
          <span className="countdown-colon">:</span>
          <div className="countdown-unit">
            <span className="countdown-num">{pad(remaining.seconds)}</span>
            <span className="countdown-label">Seconds</span>
          </div>
        </div>
      )}
    </div>
  );
};
