// CSCD Delegate App — Express entry point (Hostinger Passenger startup file)
require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const publicRoutes = require('./routes/public');
const meRoutes = require('./routes/me');
const dataRoutes = require('./routes/data');
const interviewRoutes = require('./routes/interview');
const registrationRoutes = require('./routes/registration');
const enrollRoutes = require('./routes/enroll');
const analyticsRoutes = require('./routes/analytics');
const { startReminderJob } = require('./lib/reminders');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security & performance -------------------------------------------------
// CSP is relaxed enough for the static front-end (inline bootstrap, Google
// Fonts, the Supabase REST/Auth endpoint) while still on by default elsewhere.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // AidaForm's embed widget loads from widget.aidaform.com and needs eval.
        // AidaForm for the (now closed) interview; Cognito Forms for scholarship
        // registration — its iframe.js loader is what auto-sizes the embed.
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://widget.aidaform.com', 'https://*.aidaform.com', 'https://www.cognitoforms.com', 'https://static.cognitoforms.com'],
        // Cognito's seamless embed injects the form into our own DOM, so its
        // stylesheet and fonts load as first-party subresources, not in a frame.
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://www.cognitoforms.com', 'https://static.cognitoforms.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://www.cognitoforms.com', 'https://static.cognitoforms.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://*.supabase.co', 'https://*.aidaform.com', 'https://www.cognitoforms.com', 'https://static.cognitoforms.com'],
        // Both third-party forms are embedded in <iframe>s, so their hosts must
        // be allowed frame sources: AidaForm (interview), Cognito (registration).
        frameSrc: ["'self'", 'https://*.aidaform.com', 'https://www.cognitoforms.com'],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Trust the host proxy (Passenger) so rate-limit / secure cookies behave.
app.set('trust proxy', 1);

// Rate-limit the API surface (static assets are untouched).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Config for the browser -------------------------------------------------
// Exposes ONLY the public, browser-safe values. The service-role key and
// Resend key never leave the server.
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    eventName: process.env.EVENT_NAME || 'CSCD Delegate App',
  });
});

// --- ICS calendar event (opens native Calendar on iOS/macOS/desktop) --------
// All values are attacker-controllable query params, so they are strictly
// validated/escaped before being written into the calendar: dates and times are
// matched against fixed shapes, and free-text fields are RFC-5545 escaped with
// CR/LF stripped so a crafted title/venue can't inject extra calendar lines.
app.get('/api/ics', (req, res) => {
  const str = (v, fallback) => (typeof v === 'string' ? v : Array.isArray(v) ? '' : fallback);
  // RFC 5545 text escaping + hard CRLF/control-char removal (prevents injection).
  const icsText = (v) =>
    str(v, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f]+/g, ' ') // strip CR/LF & control chars (anti-injection)
      .replace(/([\\;,])/g, '\\$1') // escape RFC-5545 special chars (backslash, ; ,)
      .slice(0, 200);

  const rawDate = str(req.query.date, '');
  const rawTime = str(req.query.time, '09:00');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
  const time = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : '09:00';
  const durMin = Math.min(Math.max(parseInt(str(req.query.duration, '60'), 10) || 60, 1), 1440);
  const title = icsText(req.query.title) || 'Event';
  const venue = icsText(req.query.venue);

  const dt = date.replace(/-/g, '');
  const [h, m] = time.split(':');
  const endTotalMin = parseInt(h, 10) * 60 + parseInt(m, 10) + durMin;
  const eh = String(Math.floor(endTotalMin / 60) % 24).padStart(2, '0');
  const em = String(endTotalMin % 60).padStart(2, '0');
  const uid = `${dt || 'event'}-${h}${m}-cscd@thecscd.org`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CSCD//Youth Strategic Forum Dubai 2026//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dt}T${h}${m}00`,
    `DTEND:${dt}T${eh}${em}00`,
    `SUMMARY:${title}`,
    `LOCATION:${venue}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 60) + '.ics';
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8; method=PUBLISH');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(ics);
});

// --- Health -----------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// --- API routes -------------------------------------------------------------
app.use('/api', publicRoutes);
app.use('/api/me', meRoutes);
app.use('/api', dataRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/internal', analyticsRoutes);

// --- Static front-end -------------------------------------------------------
// The React build (client/dist) is the app shell; public/ still provides the
// shared static assets (/img/*, /manifest.json, /sw.js). dist wins on conflict.
const distPath = path.join(__dirname, 'client', 'dist');
const distExists = require('fs').existsSync(distPath);
const shellPath = distExists ? distPath : path.join(__dirname, 'public');

const staticOpts = {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    // Only Vite's own /assets/*.{js,css} are content-hashed — a content
    // change gives them a new filename, so caching those hard is safe and
    // free (old URL just stops being referenced). Everything else (images,
    // manifest.json, fonts, index.html, sw.js) keeps the same filename across
    // edits, and we're actively iterating on exactly that content (banners,
    // rundown/visits/hotels JSON, branding) — so always revalidate instead of
    // trusting a stale cached copy. `no-cache` still lets the browser cache
    // the bytes, it just forces a conditional GET (304 if unchanged) rather
    // than skipping the network entirely.
    const isHashedBundleAsset =
      filePath.includes(`${path.sep}assets${path.sep}`) && /\.(css|js|woff2?)$/.test(filePath);
    res.setHeader(
      'Cache-Control',
      isHashedBundleAsset ? 'public, max-age=604800, immutable' : 'no-cache'
    );
  },
};

if (distExists) app.use(express.static(distPath, staticOpts));
app.use(express.static(path.join(__dirname, 'public'), staticOpts));

// SPA fallback — any non-API GET returns the shell.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(shellPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CSCD Delegate App listening on :${PORT}`);
  // Email reminder cron (no-op if Resend isn't configured yet).
  startReminderJob();
  // Keep the Passenger process alive between requests so cold-start delay
  // doesn't hit the first delegate each time the process idles.
  setInterval(() => {}, 30000);
});

module.exports = app;
