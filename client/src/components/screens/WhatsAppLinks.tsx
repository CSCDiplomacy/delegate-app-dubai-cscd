// WhatsApp groups: rendered as a row inside the single ActionsToDo card
// (dashboard). Both invite links are permanent for this cohort (confirmed by
// the client) so they're hardcoded here rather than round-tripped through
// the API.
import { Icon } from '../Icon';

const GROUPS = [
  { label: 'Official Updates', url: 'https://chat.whatsapp.com/KiI2MmbpCw4GBBe0bwS4Ye' },
  { label: 'Delegate Networking', url: 'https://chat.whatsapp.com/EF2XCJFhrhPBx59Mp02lvj' },
];

export const WhatsAppLinks = () => (
  <div className="action-row">
    <div className="action-row-head">
      <div className="t-title">Join the WhatsApp groups</div>
    </div>
    <p className="t-desc">Use the name on your application for both.</p>
    <div className="whatsapp-links">
      {GROUPS.map((g) => (
        <a key={g.url} className="btn ghost small" href={g.url} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={14} filled /> {g.label}
        </a>
      ))}
    </div>
  </div>
);
