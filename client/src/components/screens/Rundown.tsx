// Event rundown: day-by-day summary plus the session-level agenda, each
// session starrable (☆ Save) so it can be picked up by My Schedule. Applicants
// (and anyone before the programme is published) see Coming Soon.
import { useDelegateStore } from '../../stores/delegateStore';
import { sessionId } from '../../types';
import { format12Hour } from '../../lib/utils';
import { Icon, typeIcon } from '../Icon';

export const Rundown = () => {
  const { rundown, favourites, toggleFavourite } = useDelegateStore();

  if (!rundown?.days?.length) {
    return (
      <div className="coming-soon">
        <div className="coming-soon-badge">Programme</div>
        <h2 className="coming-soon-title">Agenda being finalised</h2>
        <p className="coming-soon-body">
          The programme for Jakarta is coming together. Check back shortly — it will appear here
          as it's confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Programme</div>
        <h1 className="screen-title">Official Rundown</h1>
      </div>

      <div className="stack">
        {rundown.days.map((day) => (
          <div key={day.date}>
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
        ))}
      </div>
    </div>
  );
};
