import { requireUser } from "./_lib/auth.mjs";

// Only the models the app actually uses, and a hard cap on output length, so a
// caller can't pick an expensive model or request huge responses on our key.
const ALLOWED_MODELS = new Set(["claude-sonnet-4-6"]);
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 2000;

// Best-effort rate limiting: 20 requests per minute per user. This lives in
// memory per serverless instance, so it is a speed bump, not a guarantee —
// the Anthropic console spend limit is the real backstop.
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60000;

function checkRateLimit(key) {
  const now = Date.now();
  for (const [k, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW) rateLimitMap.delete(k);
  }
  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(user.id || ip)) {
    return res.status(429).json({ error: { message: 'Too many requests. Please try again in a minute.' } });
  }

  const { model, max_tokens, messages, system, temperature } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages required' } });
  }

  const body = {
    model: ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL,
    max_tokens: Math.min(Math.max(parseInt(max_tokens, 10) || 1000, 1), MAX_TOKENS_CAP),
    messages,
  };
  if (typeof system === 'string') body.system = system;
  if (typeof temperature === 'number') body.temperature = temperature;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    console.error('[claude] request failed:', e);
    res.status(500).json({ error: { message: 'AI request failed' } });
  }
}
