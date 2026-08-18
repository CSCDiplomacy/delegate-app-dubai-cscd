// Event rundown: day tabs switch between full-day agendas, each session
// starrable (☆ Save) so it can be picked up by My Schedule. Applicants
// (and anyone before the programme is published) see Coming Soon.
import { useState } from 'react';
import { useDelegateStore } from '../../stores/delegateStore';
import { sessionId, type RundownDay } from '../../types';
import { format12Hour } from '../../lib/utils';
import { Icon, typeIcon } from '../Icon';
import { ComingSoon } from '../ComingSoon';

const dayTabLabel = (day: RundownDay) => {
  const d = new Date(`${day.date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day.label || day.date;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export const Rundown = () => {
  const { rundown, favourites, toggleFavourite } = useDelegateStore();
  const [activeDay, setActiveDay] = useState(0);

  if (!rundown?.days?.length) {
    return (
      <ComingSoon
        badge="Programme"
        title="Agenda being finalised"
        body="The programme for Jakarta is coming together. Check back shortly — it will appear here as it's confirmed."
      />
    );
  }

  const { days } = rundown;
  const day = days[Math.min(activeDay, days.length - 1)];

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Programme</div>
        <h1 className="screen-title">Official Rundown</h1>
      </div>

      {days.length > 1 && (
        <div className="day-tabs">
          {days.map((d, i) => (
            <button
              key={d.date}
              className={`day-tab${i === activeDay ? ' active' : ''}`}
              onClick={() => setActiveDay(i)}
            >
              {dayTabLabel(d)}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="t-card">
          <p className="tag">{day.label || day.date}</p>
          <div className="t-title">{day.title}</div>
          {day.description && <p className="t-desc">{day.description}</p>}
        </div>

        {!!day.items?.length && (
          <div className="timeline">
            {day.items.map((item) => {
              const id = sessionId(day, item);
              const starred = favourites.has(id);
              return (
                <div key={id} className="t-item">
                  <div className="t-time">
                    <span className="t-hm">{format12Hour(item.time)}</span>
                  </div>
                  <div className="t-card">
                    <div className="t-head">
                      <span className="t-type">
                        <Icon name={typeIcon(item.type)} size={12} /> {item.type || 'session'}
                      </span>
                      <button
                        className={starred ? 'star-btn starred' : 'star-btn'}
                        onClick={() => toggleFavourite(id)}
                        title={starred ? 'Remove from my schedule' : 'Save to my schedule'}
                      >
                        {starred ? '★ Saved' : '☆ Save'}
                      </button>
                    </div>
                    <div className="t-title">{item.title}</div>
                    {item.venue && (
                      <div className="t-venue">
                        <Icon name="mapPin" size={12} /> {item.venue}
                      </div>
                    )}
                    {item.description && <p className="t-desc">{item.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
