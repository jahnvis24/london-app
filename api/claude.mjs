import { createClient } from '@supabase/supabase-js';
import { requireUser, applyCors } from './_auth.mjs';

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Burst limit: 20 requests per minute per user. In-memory, so it only holds
// within a single warm instance — the Postgres daily cap below is the real
// backstop across instances.
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60000;

// Hard ceiling on spend: requests per user per UTC day.
const DAILY_CAP = 200;

// Reject oversized payloads before they reach Claude — a 50MB base64 screenshot
// burns tokens and wall-clock for nothing.
const MAX_BODY_BYTES = 6 * 1024 * 1024;

function checkBurst(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW) rateLimitMap.delete(k);
  }
}, RATE_LIMIT_WINDOW);

// Increments today's counter and returns whether the user is still under cap.
async function checkDailyCap(userId) {
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin.rpc('bump_api_usage', { p_user: userId, p_day: day });
  if (error) return true; // fail open: never block a real user on a counter bug
  return (data ?? 0) <= DAILY_CAP;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Was an open proxy: anyone could spend your Anthropic credits.
  const user = await requireUser(req, res);
  if (!user) return;

  if (!checkBurst(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }
  if (!(await checkDailyCap(user.id))) {
    return res.status(429).json({ error: 'Daily limit reached. Try again tomorrow.' });
  }

  const body = JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request too large. Try a smaller screenshot.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body,
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
