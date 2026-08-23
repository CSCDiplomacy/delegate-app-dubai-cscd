// About the summit, the story, themes, experience and lineage carried over
// from the Youth Strategic Forum, Dubai 2026 landing page. Explorable by everyone.
// Accommodation/hotel content lives on its own Hotel screen
// (client/src/components/screens/Hotel.tsx), not here.
import { SUMMIT, THEMES, EXPERIENCE, EDITIONS } from '../../lib/content';
import { Icon } from '../Icon';

export const About = () => (
  <div className="stack">
    <div>
      <div className="eyebrow">The idea of diplomacy</div>
      <h1 className="about-hero">
        {SUMMIT.tagline}
      </h1>
      <p className="tag">
        {SUMMIT.location} · {SUMMIT.dates}
      </p>
    </div>

    <div className="card">
      <div className="card-eyebrow">Background &amp; rationale</div>
      <p className="card-body-text">{SUMMIT.intro}</p>
      <p className="card-body-text">{SUMMIT.rationale}</p>
      <hr className="rule" style={{ margin: '18px 0' }} />
      <div className="card-eyebrow">Who takes part</div>
      <p className="card-body-text">{SUMMIT.participants}</p>
    </div>

    <div>
      <div className="section-label">Thematic focus</div>
      <div className="theme-grid">
        {THEMES.map((theme) => (
          <div key={theme.numeral} className="theme-card">
            <div className="theme-numeral">{theme.numeral}</div>
            <div>
              <div className="theme-title">{theme.title}</div>
              <div className="theme-blurb">{theme.blurb}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="card">
      <div className="card-eyebrow">The Dubai experience</div>
      <p className="card-body-text">
        Delegates experience Dubai not as tourists but as active participants in a city built on
        reinvention — panel discussions and hands-on workshops inside an architectural landmark,
        a Marina dinner cruise, and a desert safari under the stars.
      </p>
      <ul className="dot-list">
        {EXPERIENCE.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>

    <div>
      <div className="section-label">The global journey</div>
      <div className="edition-list">
        {EDITIONS.map((ed) => (
          <div key={ed.city} className={`edition${ed.current ? ' current' : ''}`}>
            <div className="edition-city">
              {ed.city}
              <span className="edition-year">{ed.year}</span>
            </div>
            <div className="edition-note">{ed.note}</div>
            {ed.current ? (
              <span className="edition-badge">You are here</span>
            ) : (
              ed.report && (
                <a
                  className="edition-report"
                  href={ed.report}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="download" size={13} /> Report
                </a>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
