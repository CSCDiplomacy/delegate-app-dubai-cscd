// Dashboard "Actions To Do" checklist — things a delegate must go *do*
// (fill out a form, join a group), fed by the `action_items` table.
// Deliberately separate from the Updates rail: Updates is for things to
// read, this is for things to act on. Renders nothing when the list is
// empty so it never leaves a dead heading on the Dashboard.
import { useDelegateStore } from '../../stores/delegateStore';
import { Icon } from '../Icon';

function formatDue(dueDate?: string | null): string | null {
  if (!dueDate) return null;
  const d = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ActionsToDo = () => {
  const { actionItems } = useDelegateStore();
  if (actionItems.length === 0) return null;

  return (
    <div>
      <div className="section-label">Actions to do</div>
      <div className="stack">
        {actionItems.map((item) => {
          const due = formatDue(item.due_date);
          return (
            <div className="t-card action-card" key={item.id}>
              <div className="t-head">
                <span className="t-type">
                  <Icon name="check" size={14} />
                  Action needed
                </span>
                {due && <span className="action-due">Due {due}</span>}
              </div>
              <div className="t-title">{item.title}</div>
              {item.body && <p className="t-desc">{item.body}</p>}
              {item.link_url && (
                <div className="accept-cta">
                  <a className="btn" href={item.link_url} target="_blank" rel="noopener noreferrer">
                    {item.link_label || 'Open'}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
