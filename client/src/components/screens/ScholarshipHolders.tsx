// Scholarship Holders — the results announcement roster (2026-08-27), a
// static celebration page distinct from the per-delegate outcome on the
// Dashboard (see Results.tsx). Names are hardcoded in lib/content.ts; see
// that file's comment for why this doesn't go through the data/*.json +
// API pipeline the still-being-published content screens use.
import { FULLY_FUNDED } from '../../lib/content';
import { Icon } from '../Icon';

export const ScholarshipHolders = () => (
  <div className="stack">
    <div>
      <div className="eyebrow">Results announced</div>
      <h1 className="about-hero">Scholarship Holders</h1>
      <p className="tag">Youth Strategic Forum, Dubai 2026</p>
    </div>

    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <img
        src="/img/ysf-dubai-2026-results-poster.webp"
        alt="Youth Strategic Forum Dubai 2026, scholarship holders"
        style={{ width: '100%', display: 'block' }}
      />
    </div>

    <div>
      <div className="section-label">
        <Icon name="award" size={16} /> Fully funded scholarship ({FULLY_FUNDED.length})
      </div>
      <div className="card">
        <ol className="dot-list">
          {FULLY_FUNDED.map(({ name, nationality }) => (
            <li key={name}>
              {name}
              <span className="chip" style={{ marginLeft: '0.6em' }}>{nationality}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </div>
);
