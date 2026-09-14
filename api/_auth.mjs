import { createClient } from '@supabase/supabase-js';

// Service-key client: only ever used to verify a caller's token, never to
// perform work on the caller's behalf without checking who they are first.
const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Verifies the Supabase JWT on the request and returns the authenticated user.
 * Responds 401 and returns null when the token is missing or invalid, so callers
 * can simply `if (!user) return;`.
 *
 * Never trust a user_id from the request body — use the id on the returned user.
 */
export async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
  return data.user;
}

/**
 * Guards Vercel cron endpoints. Vercel sends `Authorization: Bearer $CRON_SECRET`
 * on scheduled invocations; without this check anyone can trigger the job (and
 * these jobs delete rows and spend Claude + Google credits).
 */
export function requireCron(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'CRON_SECRET not configured' });
    return false;
  }
  const header = req.headers.authorization || '';
  if (header !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

/**
 * Locks /api/* to our own origins. Without this any site can call these
 * endpoints from a visitor's browser.
 */
const ALLOWED_ORIGINS = [
  'https://london-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/london-app-[\w-]+\.vercel\.app$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // handled — caller should return
  }
  return false;
}
