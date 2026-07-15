import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = "jahnvisolanki2412@gmail.com";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth + admin check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

  const { venues } = req.body;
  if (!venues || !Array.isArray(venues)) return res.status(400).json({ error: 'venues array required' });

  const results = [];

  for (const venue of venues) {
    try {
      // Enrich with Google Places
      const enrichResp = await fetch(`https://${req.headers.host}/api/enrich-venue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: venue.name, area: venue.area })
      });
      const enrichData = await enrichResp.json();

      // Insert into experiences
      const row = {
        name: enrichData.found ? enrichData.validated_name : venue.name,
        address: enrichData.found ? enrichData.validated_address : venue.address,
        area: enrichData.found ? (enrichData.derived_area || venue.area) : venue.area,
        zone: enrichData.found ? (enrichData.derived_zone || 'South') : 'South',
        category: venue.category,
        price: enrichData.found ? (enrichData.price || venue.price) : venue.price,
        is_event: false,
        comment: venue.comment,
        vibe_tags: venue.vibe_tags || [],
        status: "approved",
        lat: enrichData.found ? enrichData.lat : null,
        lng: enrichData.found ? enrichData.lng : null,
        postcode: enrichData.found ? enrichData.postcode : null,
        google_place_id: enrichData.found ? enrichData.google_place_id : null,
        google_rating: enrichData.found ? enrichData.google_rating : null,
        google_review_count: enrichData.found ? enrichData.google_review_count : null,
        google_price_level: enrichData.found ? enrichData.google_price_level : null,
        website: enrichData.found ? enrichData.website : null,
        phone: enrichData.found ? enrichData.phone : null,
        opening_hours: enrichData.found ? enrichData.opening_hours : null,
      };

      const { error } = await supabase.from("experiences").insert(row);
      results.push({ name: venue.name, status: error ? 'error' : 'inserted', google: enrichData.found, zone: row.zone, error: error?.message });
    } catch (e) {
      results.push({ name: venue.name, status: 'error', error: e.message });
    }
  }

  res.status(200).json({
    imported: results.filter(r => r.status === 'inserted').length,
    errors: results.filter(r => r.status === 'error').length,
    results
  });
}
