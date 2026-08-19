// Dashboard "Actions To Do" checklist: things a delegate must go *do*
// (fill out a form, join a group), fed by the `action_items` table plus the
// hardcoded WhatsApp groups card. Deliberately separate from the Updates
// rail: Updates is for things to read, this is for things to act on. The
// WhatsApp row means this section always has at least one entry, so it no
// longer needs to hide itself when `action_items` is empty.
//
// Everything lives in a single card, one row per action, rather than a stack
// of separate cards; keeps the section compact and reads as one checklist.
import { useDelegateStore } from '../../stores/delegateStore';
import { WhatsAppLinks } from './WhatsAppLinks';

function parseDue(dueDate?: string | null): Date | null {
  if (!dueDate) return null;
  const d = new Date(`${dueDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDue(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ActionsToDo = () => {
  const { actionItems } = useDelegateStore();

  // Overdue items surface first, and flip the whole card's edge to signal red:
  // a stale gray "Due Aug 18" a day past the deadline reads as if there's still
  // time. Everything else stays in the order the team set.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const withDue = actionItems.map((item) => {
    const due = parseDue(item.due_date);
    return { item, due, overdue: !!due && due < today };
  });
  const sorted = [...withDue].sort((a, b) => Number(b.overdue) - Number(a.overdue));
  const hasOverdue = withDue.some((w) => w.overdue);

  return (
    <div>
      <div className="section-label">Actions to do</div>
      <div className={`t-card action-card${hasOverdue ? ' is-overdue' : ''}`}>
        {sorted.map(({ item, due, overdue }) => (
          <div className="action-row" key={item.id}>
            <div className="action-row-head">
              <div className="t-title">{item.title}</div>
              {due && (
                <span className={`action-due${overdue ? ' is-overdue' : ''}`}>
                  {overdue ? 'Overdue' : `Due ${formatDue(due)}`}
                </span>
              )}
            </div>
            {item.body && <p className="t-desc">{item.body}</p>}
            {item.link_url && (
              <div className="accept-cta">
                <a className="btn" href={item.link_url} target="_blank" rel="noopener noreferrer">
                  {item.link_label || 'Open'}
                </a>
              </div>
            )}
          </div>
        ))}
        <WhatsAppLinks />
      </div>
    </div>
  );
};
