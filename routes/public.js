// Serves static event content (JSON files in /data).
// Files are read ONCE at startup and served from memory — no per-request disk I/O.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { anonClient, serviceClient } = require('../lib/supabase');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');

// Pre-load all files into memory at boot time.
// hotels.json is deliberately NOT served here — the hotel (Gevora Hotel) is
// confidential, only /api/me/hotel (auth + enrolled-gated) may return it.
const _cache = {};
['rundown.json', 'visits.json', 'speakers.json', 'checkin.json', 'contact.json'].forEach((file) => {
  try {
    _cache[file] = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  } catch (e) {
    _cache[file] = null;
    console.warn(`[data] Could not load ${file}:`, e.message);
  }
});

// rundown.json names the hotel in a few venue/description fields. This route
// has no auth requirement, so anyone with the URL could otherwise read the
// confidential hotel name — pre-compute a redacted copy and serve that unless
// the request carries a valid token for an *enrolled* delegate.
const _rundownRedacted = _cache['rundown.json']
  ? _cache['rundown.json'].replace(/the Gevora Hotel/g, 'the hotel').replace(/Gevora Hotel/g, 'Hotel')
  : null;

// Optional auth check: a missing/invalid token or a non-enrolled delegate
// both just mean "no" — this never rejects the request, only picks which
// cached payload to send.
async function isEnrolledRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !anonClient || !serviceClient) return false;
  try {
    const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !userData || !userData.user) return false;
    const { data: delegate } = await serviceClient
      .from('delegates')
      .select('status')
      .eq('id', userData.user.id)
      .single();
    return !!delegate && delegate.status === 'enrolled';
  } catch (e) {
    return false;
  }
}

function serveJson(file) {
  return (req, res) => {
    const data = _cache[file];
    if (!data) return res.status(500).json({ error: `Could not load ${file}` });
    res.setHeader('Content-Type', 'application/json');
    // Cache 5 min on client / CDN, serve stale up to 10 min while revalidating.
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.send(data);
  };
}

router.get('/rundown', async (req, res) => {
  const raw = _cache['rundown.json'];
  if (!raw) return res.status(500).json({ error: 'Could not load rundown.json' });
  const enrolled = await isEnrolledRequest(req);
  res.setHeader('Content-Type', 'application/json');
  // Response varies by caller, so it must never be shared across delegates.
  res.setHeader('Cache-Control', 'private, no-cache');
  res.setHeader('Vary', 'Authorization');
  res.send((enrolled ? raw : _rundownRedacted) || raw);
});
router.get('/visits',   serveJson('visits.json'));
router.get('/speakers', serveJson('speakers.json'));
router.get('/checkin',  serveJson('checkin.json'));
router.get('/contact',  serveJson('contact.json'));

module.exports = router;
