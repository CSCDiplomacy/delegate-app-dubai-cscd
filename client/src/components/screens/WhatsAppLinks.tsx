// Dashboard "WhatsApp groups" box. Both invite links are permanent for this
// cohort (confirmed by the client) so they're hardcoded here rather than
// round-tripped through the API.
import { Icon } from '../Icon';

const GROUPS = [
  { label: 'Official Updates', url: 'https://chat.whatsapp.com/KiI2MmbpCw4GBBe0bwS4Ye' },
  { label: 'Delegate Networking', url: 'https://chat.whatsapp.com/EF2XCJFhrhPBx59Mp02lvj' },
];

export const WhatsAppLinks = () => (
  <div className="t-card">
    <div className="t-type">
      <Icon name="phone" size={14} />
      WhatsApp groups
    </div>
    <p className="t-desc">
      Join both using the name on your application — Official Updates for announcements, Delegate
      Networking for peer coordination.
    </p>
    <div className="whatsapp-links">
      {GROUPS.map((g) => (
        <a key={g.url} className="btn ghost small" href={g.url} target="_blank" rel="noopener noreferrer">
          {g.label}
        </a>
      ))}
    </div>
  </div>
);
