import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function parseCaption(caption) {
  const prompt = `You are parsing a TikTok video caption about London experiences or venues.
The caption may mention ONE venue or MULTIPLE venues, or may not be about a specific London venue at all.

Caption: ${JSON.stringify(caption)}

First decide: does this caption mention at least one specific London venue, restaurant, bar, experience or place to visit?
If NO - return exactly: {"skip": true}
If YES - extract structured data and return a JSON array of venue objects.

Each venue object:
{
  "name": "venue name",
  "address": "full address if mentioned, or null",
  "area": "neighbourhood e.g. Shoreditch, Chelsea, Clapham",
  "zone": "one of: North, Northwest, Northeast, South, Southwest, Southeast, East, West, Central",
  "category": "one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife",
  "price": "e.g. Free, £10, £20-30, or null if unknown",
  "is_event": false,
  "event_start": null,
  "event_end": null,
  "comment": "interesting descriptors about this specific venue",
  "vibe_tags": ["tags from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic"]
}

Return ONLY valid JSON, no markdown.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await resp.json();
  const txt = data.content?.find(b => b.type === 'text')?.text || '';
  const cleaned = txt.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: pending } = await supabase
    .from('pending_videos')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(5);

  if (!pending || pending.length === 0) {
    return res.status(200).json({ message: 'No pending videos to process', processed: 0 });
  }

  const results = { processed: 0, saved: 0, skipped: 0, errors: 0, error_details: [] };

  for (const video of pending) {
    try {
      const parsed = await parseCaption(video.caption);
      await supabase.from('pending_videos').update({ processed: true }).eq('id', video.id);
      results.processed++;

      if (parsed?.skip) { results.skipped++; continue; }

      const venues = Array.isArray(parsed) ? parsed : [parsed];

      for (const venue of venues) {
        if (!venue.name || !venue.area) { results.skipped++; continue; }

        const { data: existing } = await supabase
          .from('experiences')
          .select('id')
          .or(`tiktok_url.eq.${video.tiktok_url},name.ilike.${venue.name}`)
          .limit(1);

        if (existing && existing.length > 0) { results.skipped++; continue; }

        await supabase.from('experiences').insert({
          name: venue.name,
          address: venue.address || null,
          area: venue.area,
          zone: venue.zone || 'Central',
          category: venue.category,
          price: venue.price || null,
          is_event: venue.is_event || false,
          event_start: venue.event_start || null,
          event_end: venue.event_end || null,
          comment: venue.comment,
          vibe_tags: venue.vibe_tags || [],
          tiktok_url: video.tiktok_url,
          status: 'pending'
        });

        results.saved++;
      }
    } catch (e) {
      results.errors++;
      results.error_details.push({ video: video.tiktok_url, error: e.message });
    }
  }

  const { count } = await supabase
    .from('pending_videos')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false);

  res.status(200).json({
    message: 'Processing complete',
    remaining_in_queue: count || 0,
    ...results
  });
}