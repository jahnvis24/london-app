import { createClient } from "@supabase/supabase-js";
import { requireUser, applyCors } from "./_auth.mjs";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Previously took user_id and email straight from the body and upserted with
  // the service key — anyone could overwrite any profile. Identity now comes
  // from the verified token, and only display fields come from the body.
  const user = await requireUser(req, res);
  if (!user) return;

  const { name, avatar_url } = req.body || {};

  const { data: existing } = await supabase
    .from("profiles")
    .select("login_count")
    .eq("id", user.id)
    .single();

  const loginCount = (existing?.login_count || 0) + 1;

  // Only overwrite display fields when the client actually sent them, so a login
  // that omits them doesn't blank out a name the user set later.
  const payload = {
    id: user.id,
    email: user.email,
    last_login: new Date().toISOString(),
    login_count: loginCount,
  };
  if (typeof name === 'string' && name.trim()) payload.name = name.trim().slice(0, 80);
  if (typeof avatar_url === 'string' && avatar_url.trim()) payload.avatar_url = avatar_url.trim().slice(0, 500);

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true, login_count: loginCount });
}
