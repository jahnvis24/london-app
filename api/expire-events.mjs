import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const { data: expiredByEnd, error: err1 } = await supabase
      .from("experiences")
      .delete()
      .eq("is_event", true)
      .not("event_end", "is", null)
      .lt("event_end", today)
      .select("name");

    const { data: expiredByStart, error: err2 } = await supabase
      .from("experiences")
      .delete()
      .eq("is_event", true)
      .is("event_end", null)
      .not("event_start", "is", null)
      .lt("event_start", today)
      .select("name");

    if (err1) throw err1;
    if (err2) throw err2;

    const totalExpired = (expiredByEnd?.length || 0) + (expiredByStart?.length || 0);

    res.status(200).json({
      success: true,
      expired: totalExpired,
      names: [...(expiredByEnd || []), ...(expiredByStart || [])].map(e => e.name)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}