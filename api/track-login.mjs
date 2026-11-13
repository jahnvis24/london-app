import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = "jahnvisolanki2412@gmail.com";
const PAGE_SIZE = 1000;

async function fetchAllRows(queryForPage) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryForPage().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  const isAdminView = req.query?.view === "admin" || requestUrl.searchParams.get("view") === "admin";
  if (isAdminView && req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminView && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice('Bearer '.length));
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  if (isAdminView) {
    if (user.email?.toLowerCase() !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

    try {
      const users = await fetchAllRows(() => supabase
        .from("admin_user_logins")
        .select("user_id,email,name,avatar_url,first_login,last_login,login_count")
        .order("last_login", { ascending: false }));
      return res.status(200).json({ users });
    } catch (error) {
      console.error("[admin] Failed to load dashboard data:", error);
      return res.status(500).json({ error: "Could not load admin data" });
    }
  }

  if (!user.email) return res.status(401).json({ error: 'Unauthorized' });

  const { error } = await supabase.rpc('record_admin_user_login', {
    p_user_id: user.id,
    p_email: user.email,
    p_name: user.user_metadata?.full_name || null,
    p_avatar_url: user.user_metadata?.avatar_url || null,
  });

  if (error) {
    console.error('[track-login] Failed to record login:', error);
    return res.status(500).json({ error: 'Could not record login' });
  }
  res.status(200).json({ ok: true });
}
