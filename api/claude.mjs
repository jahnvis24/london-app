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

// The app only uses this model; App.jsx requests up to 4096 tokens.
const ALLOWED_MODELS = new Set(['claude-sonnet-4-6']);
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS_CAP = 4096;

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

  // Only forward the fields we use, pin the model, and cap output length so a
  // caller can't pick an expensive model or request huge responses on our key.
  const { model, max_tokens, messages, system, temperature } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }
  const payload = {
    model: ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL,
    max_tokens: Math.min(Math.max(parseInt(max_tokens, 10) || 1000, 1), MAX_TOKENS_CAP),
    messages,
  };
  if (typeof system === 'string' || Array.isArray(system)) payload.system = system;
  if (typeof temperature === 'number') payload.temperature = temperature;

  const body = JSON.stringify(payload);
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
