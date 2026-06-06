import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, email, name, avatar_url } = req.body;
  if (!user_id || !email) return res.status(400).json({ error: 'user_id and email required' });

  const { data: existing } = await supabase
    .from("profiles")
    .select("login_count")
    .eq("id", user_id)
    .single();

  const loginCount = (existing?.login_count || 0) + 1;

  const { error } = await supabase.from("profiles").upsert({
    id: user_id,
    email,
    name: name || null,
    avatar_url: avatar_url || null,
    last_login: new Date().toISOString(),
    login_count: loginCount,
  }, { onConflict: "id" });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true, login_count: loginCount });
}
