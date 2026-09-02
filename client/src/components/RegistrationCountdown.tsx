// Partial-tier registration with a countdown to a fixed deadline.
//
// PARTIAL TIER ONLY (per request, 2026-09-02): the Partial scholarship
// registration window closes at a hard cutoff. Until then we show a live
// countdown; once the cutoff passes we stop rendering the form entirely and
// show a "Registration closed" card instead. The self and alumni tiers are
// untouched (see TierResult in screens/Results.tsx, which routes only the
// partial tier here).
//
// Two entry points share one countdown:
//   PartialCountdownBanner  the timer on its own (open) or the closed card,
//                           shown on the home Dashboard next to the CTA.
//   PartialRegistration     the timer above the JotForm (open) or the closed
//                           card (closed), shown on the Registration screen.
//
// The deadline is a single UTC-anchored constant so it means the same instant
// regardless of the viewer's local timezone. Dubai is Gulf Standard Time (GST),
// UTC+4, no daylight saving, so 2026-09-04 23:59:59 GST == 2026-09-04T19:59:59Z.
import { useEffect, useState } from 'react';
import { JotForm, JOTFORM_IDS } from './JotForm';
import { Icon } from './Icon';

// 2026-09-04 23:59:59 Dubai time (GST, UTC+4) === 2026-09-04T19:59:59Z.
export const PARTIAL_DEADLINE = new Date('2026-09-04T19:59:59Z');

// Human-readable absolute deadline, shown alongside the live countdown.
const DEADLINE_LABEL = 'Thursday, 4 September 2026, 11:59 PM Dubai time (GST)';

const CONTACT_EMAIL = 'contact@thecscd.org';

function breakdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

// One ticking clock, re-rendering every second so the countdown updates and,
// the moment the deadline passes while the page is open, `closed` flips to true.
function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = PARTIAL_DEADLINE.getTime() - now;
  return { remaining, closed: remaining <= 0 };
}

// "Registration closed" card, shared by both entry points once the deadline has
// passed.
const ClosedCard = () => (
  <div className="interview-cta is-done">
    <div className="interview-cta-tag">
      <Icon name="alert" size={14} />
      Registration closed
    </div>
    <div className="interview-cta-title">Registration is now closed</div>
    <div className="interview-cta-sub">
      The registration window for the Partial scholarship closed on {DEADLINE_LABEL}. If you still
      need to register, please contact us at{' '}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and our team will assist you.
    </div>
  </div>
);

// Just the live countdown banner (no form). Renders nothing once closed so the
// caller can decide what the closed state looks like in its own layout.
const CountdownBar = ({ remaining }: { remaining: number }) => {
  const { days, hours, minutes, seconds } = breakdown(remaining);
  return (
    <div className="reg-countdown" role="timer" aria-live="off">
      <div className="reg-countdown-label">
        <Icon name="clock" size={14} />
        Registration closes in
      </div>
      <div className="reg-countdown-clock">
        <div className="reg-countdown-seg">
          <span className="reg-countdown-num">{days}</span>
          <span className="reg-countdown-unit">{days === 1 ? 'day' : 'days'}</span>
        </div>
        <span className="reg-countdown-colon">:</span>
        <div className="reg-countdown-seg">
          <span className="reg-countdown-num">{pad(hours)}</span>
          <span className="reg-countdown-unit">hrs</span>
        </div>
        <span className="reg-countdown-colon">:</span>
        <div className="reg-countdown-seg">
          <span className="reg-countdown-num">{pad(minutes)}</span>
          <span className="reg-countdown-unit">min</span>
        </div>
        <span className="reg-countdown-colon">:</span>
        <div className="reg-countdown-seg">
          <span className="reg-countdown-num">{pad(seconds)}</span>
          <span className="reg-countdown-unit">sec</span>
        </div>
      </div>
      <div className="reg-countdown-deadline">Closes {DEADLINE_LABEL}</div>
    </div>
  );
};

// Home Dashboard: the countdown on its own while open; the closed card after.
export const PartialCountdownBanner = () => {
  const { remaining, closed } = useCountdown();
  return closed ? <ClosedCard /> : <CountdownBar remaining={remaining} />;
};

// Registration screen: countdown above the JotForm while open; closed card after.
export const PartialRegistration = ({
  title,
  applicantId,
}: {
  title: string;
  applicantId?: string | null;
}) => {
  const { remaining, closed } = useCountdown();
  if (closed) return <ClosedCard />;
  return (
    <div className="stack">
      <CountdownBar remaining={remaining} />
      <JotForm formId={JOTFORM_IDS.partial} title={title} applicantId={applicantId} />
    </div>
  );
};
