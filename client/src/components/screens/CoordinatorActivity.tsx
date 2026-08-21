// Dashboard "Group activity" card: matches the logged-in delegate to their
// live-session group (by email) and shows the activity brief + that group's
// shared coordinator login, with a link out to cds.thecscd.org to do it.
// Renders nothing for anyone not in the activity. Remove with
// ../../data/coordinatorGroups.ts after the session.
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../Icon';
import {
  regionForEmail,
  GROUP_LOGINS,
  GROUP_MEMBERS,
  GROUP_LEADERS,
  GROUP_ACTIVITY,
  GROUP_ACTIVITY_DETAIL,
  ACTIVITY_PDF_URL,
  COORDINATOR_LOGIN_URL,
} from '../../data/coordinatorGroups';

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (older browser / insecure context) — the value is
      // still visible for the group to read and type.
    }
  };

  return (
    <div className="coord-cred-row">
      <div className="coord-cred-field">
        <span className="coord-cred-k">{label}</span>
        <span className="coord-cred-v">{value}</span>
      </div>
      <button type="button" className="chip" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
        <Icon name={copied ? 'check' : 'copy'} size={12} />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

export const CoordinatorActivity = () => {
  const { profile } = useAuthStore();
  const region = regionForEmail(profile?.email);
  if (!region) return null;

  const login = GROUP_LOGINS[region];
  const members = GROUP_MEMBERS[region];
  const leader = GROUP_LEADERS[region];
  const detail = GROUP_ACTIVITY_DETAIL;

  return (
    <div>
      <div className="section-label">Group activity</div>
      <div className="t-card action-card">
        <div className="action-row">
          <div className="action-row-head">
            <div className="t-title">
              <Icon name="award" size={15} /> {GROUP_ACTIVITY.title}
            </div>
            <span className="chip primary">
              <Icon name="users" size={12} /> {region} group
            </span>
          </div>
          <p className="t-desc">{GROUP_ACTIVITY.body}</p>

          <div className="coord-detail">
            <div className="coord-detail-theme">
              <span className="chip">Theme</span>
              <span>{detail.theme}</span>
            </div>
            <p className="coord-detail-summary">{detail.summary}</p>

            <ol className="coord-steps">
              {detail.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>

            <p className="coord-detail-deadline">
              <Icon name="clock" size={12} /> {detail.deadlines}
            </p>

            <a
              className="btn ghost coord-brief-btn"
              href={ACTIVITY_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="download" size={13} /> Full brief (PDF)
            </a>
          </div>

          <div className="coord-members">
            <div className="coord-cred-label">
              <Icon name="star" size={13} /> Team leader: {leader}
            </div>
            <div className="coord-cred-label">
              <Icon name="users" size={13} /> {region} group members
            </div>
            <ul className="coord-members-list">
              {members.map((name) => (
                <li key={name}>
                  <span className="coord-members-initial" aria-hidden>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="coord-cred">
            <div className="coord-cred-label">
              <Icon name="key" size={13} /> Your {region} group login
            </div>
            <CopyField label="Email" value={login.email} />
            <CopyField label="Password" value={login.password} />
          </div>

          <div className="accept-cta">
            <a className="btn" href={COORDINATOR_LOGIN_URL} target="_blank" rel="noopener noreferrer">
              Open coordinator login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
