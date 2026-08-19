// Contact & feedback. Contact data comes from /api/contact (static JSON:
// { org, venue, contacts: [{label,value,type}], socials }); feedback posts to
// /api/feedback. Sign-out goes through the real auth store.
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDelegateStore } from '../../stores/delegateStore';
import { submitFeedback } from '../../services/data';
import { mapsLink } from '../../lib/utils';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import type { ContactEntry } from '../../types';

function entryHref(entry: ContactEntry): string {
  if (entry.type === 'email') return `mailto:${entry.value}`;
  if (entry.type === 'phone' || entry.type === 'whatsapp') return `tel:${entry.value}`;
  return entry.value;
}

function entryIcon(entry: ContactEntry): IconName {
  if (entry.type === 'email') return 'mail';
  if (entry.type === 'phone' || entry.type === 'whatsapp') return 'phone';
  return 'globe';
}

export const Contact = () => {
  const { logout } = useAuthStore();
  const { contact } = useDelegateStore();
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setMsg({ ok: false, text: 'Write a few words first.' });
      return;
    }
    setSending(true);
    setMsg(null);
    try {
      await submitFeedback(comment.trim());
      setComment('');
      setMsg({ ok: true, text: 'Thank you, the team has your feedback.' });
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Could not send feedback. Try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const venueMap = contact?.venue ? mapsLink(contact.venue.map || contact.venue.address) : null;

  return (
    <div className="stack">
      <div className="card">
        <div className="card-eyebrow">Contact</div>
        <h2 className="card-title">{contact?.org || 'Center for Strategic and Cultural Diplomacy'}</h2>
        {contact?.venue?.name && (
          <p className="card-body-text">
            {contact.venue.name}
            {contact.venue.address ? ` · ${contact.venue.address}` : ''}
          </p>
        )}
        {venueMap && (
          <a className="chip chip-link" href={venueMap} target="_blank" rel="noopener noreferrer">
            Open in Maps
          </a>
        )}
        <div className="contact-list">
          {(contact?.contacts || []).map((c) => (
            <a key={c.value} className="contact-row" href={entryHref(c)}>
              <Icon name={entryIcon(c)} size={16} />
              <span>
                <span className="contact-label">{c.label}</span>
                <span className="contact-value">{c.value}</span>
              </span>
            </a>
          ))}
          {(contact?.socials || []).map((s) => (
            <a
              key={s.value}
              className="contact-row"
              href={s.value}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="globe" size={16} />
              <span>
                <span className="contact-label">{s.label}</span>
                <span className="contact-value">{s.value.replace(/^https?:\/\//, '')}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <form className="card" onSubmit={handleFeedback}>
        <div className="card-eyebrow">Feedback</div>
        <div className="field">
          <textarea
            rows={3}
            placeholder="Tell the team how it's going…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={sending}
          />
        </div>
        {msg && <div className={`form-msg ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
        <button type="submit" className="btn brass small" disabled={sending}>
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </form>

      <button className="btn ghost" onClick={() => logout()}>
        <Icon name="logOut" size={16} /> Sign out
      </button>
    </div>
  );
};
