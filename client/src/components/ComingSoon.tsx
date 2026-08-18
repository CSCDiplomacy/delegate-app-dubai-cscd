// Shared "nothing published yet" placeholder. Every event section (Rundown,
// Schedule, Hotel, Visit & Dinner, ...) renders this when its data is still
// empty, so the three lines of copy stay visually identical everywhere
// instead of being hand-duplicated per screen.
export const ComingSoon = ({
  badge,
  title,
  body,
}: {
  badge: string;
  title: string;
  body: string;
}) => (
  <div className="coming-soon">
    <div className="coming-soon-badge">{badge}</div>
    <h2 className="coming-soon-title">{title}</h2>
    <p className="coming-soon-body">{body}</p>
  </div>
);
