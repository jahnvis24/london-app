// Shared auth helpers for API routes. Lives under `_lib/` so Vercel does not
// deploy it as its own function (keeps us under the Hobby function limit).
import { createClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "jahnvisolanki2412@gmail.com";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function bearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice("Bearer ".length).trim() : null;
}

// True when the request carries the server secret. Vercel Cron sends
// `Authorization: Bearer $CRON_SECRET` automatically; our own scripts and
// server-to-server calls send the same header.
export function isServerRequest(req) {
  const secret = process.env.CRON_SECRET;
  const token = bearer(req);
  return Boolean(secret && token && token === secret);
}

async function userFromRequest(req) {
  const token = bearer(req);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export function isAdmin(user) {
  return user?.email?.toLowerCase() === ADMIN_EMAIL;
}

// Returns the signed-in user, or sends 401 and returns null.
// Server requests (cron secret) are allowed through and get `{ server: true }`.
export async function requireUser(req, res) {
  if (isServerRequest(req)) return { server: true };
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

// Returns the admin user (or server marker), or sends 401/403 and returns null.
export async function requireAdmin(req, res) {
  if (isServerRequest(req)) return { server: true };
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

// Only cron / server-secret callers, or the admin.
export const requireCronOrAdmin = requireAdmin;
