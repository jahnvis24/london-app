import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = "jahnvisolanki2412@gmail.com";

export default async function handler(req, res) {
  // POST: bulk update venues by name
  if (req.method === 'POST') {
    // Auth + admin check
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ error: 'updates array required' });
    const results = [];
    for (const u of updates) {
      const { name, ...fields } = u;
      const { error } = await supabase.from("experiences").update(fields).ilike("name", `%${name}%`);
      results.push({ name, status: error ? 'error' : 'updated', error: error?.message });
    }
    return res.status(200).json({ results });
  }

  const { data: venues, error } = await supabase
    .from("experiences")
    .select("id, name, zone, category, vibe_tags, lat, lng, price")
    .eq("status", "approved");

  if (error) return res.status(500).json({ error: error.message });

  // Zone breakdown
  const zones = {};
  const categories = {};
  const zoneCats = {};
  const noCoords = [];
  const vibeCount = {};

  for (const v of venues) {
    const z = v.zone || "Unknown";
    const c = v.category || "unknown";
    zones[z] = (zones[z] || 0) + 1;
    categories[c] = (categories[c] || 0) + 1;
    const key = `${z}|${c}`;
    zoneCats[key] = (zoneCats[key] || 0) + 1;
    if (!v.lat || !v.lng) noCoords.push({ id: v.id, name: v.name, zone: z });
    for (const tag of (v.vibe_tags || [])) {
      vibeCount[tag] = (vibeCount[tag] || 0) + 1;
    }
  }

  // Find sparse zone/category combos
  const allZones = [...new Set(venues.map(v => v.zone || "Unknown"))];
  const allCats = ["restaurant", "bar", "cafe", "market", "museum", "gallery", "outdoor", "experience", "event"];
  const gaps = [];
  for (const z of allZones) {
    for (const c of allCats) {
      const count = zoneCats[`${z}|${c}`] || 0;
      if (count < 2) gaps.push({ zone: z, category: c, count });
    }
  }
  gaps.sort((a, b) => a.count - b.count);

  res.status(200).json({
    total: venues.length,
    zones: Object.entries(zones).sort((a, b) => b[1] - a[1]),
    categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
    vibe_tags: Object.entries(vibeCount).sort((a, b) => b[1] - a[1]),
    gaps: gaps.slice(0, 30),
    missing_coords: noCoords.length,
    missing_coords_venues: noCoords.slice(0, 20),
  });
}
