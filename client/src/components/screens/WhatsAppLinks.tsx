// WhatsApp groups — rendered as an "Action needed" card inside ActionsToDo
// (dashboard). Both invite links are permanent for this cohort (confirmed by
// the client) so they're hardcoded here rather than round-tripped through
// the API.
import { Icon } from '../Icon';

const GROUPS = [
  { label: 'Official Updates', url: 'https://chat.whatsapp.com/KiI2MmbpCw4GBBe0bwS4Ye' },
  { label: 'Delegate Networking', url: 'https://chat.whatsapp.com/EF2XCJFhrhPBx59Mp02lvj' },
];

export const WhatsAppLinks = () => (
  <div className="t-card action-card">
    <div className="t-head">
      <span className="t-type">
        <Icon name="check" size={14} />
        Action needed
      </span>
    </div>
    <div className="t-title">Join the WhatsApp groups</div>
    <p className="t-desc">
      Join both using the name on your application — Official Updates for announcements, Delegate
      Networking for peer coordination.
    </p>
    <div className="whatsapp-links">
      {GROUPS.map((g) => (
        <a key={g.url} className="btn ghost small" href={g.url} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={14} filled /> {g.label}
        </a>
      ))}
    </div>
  </div>
);
