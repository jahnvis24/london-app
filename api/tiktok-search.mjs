import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEYWORDS = [
  "things to do London",
  "hidden gems London",
  "restaurants London",
  "bars London",
  "London food",
  "London experiences",
];

const USERNAMES = [
  "aleks.london.diary",
  "runawaywithrachel",
  "sineadtravels",
  "livs_london",
  "somethingsomethingbeauty",
  "annasabroad",
  "secret.london",
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchTikTok(keyword) {
  const resp = await fetch('https://tikwm.com/api/feed/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ keywords: keyword, count: '10', cursor: '0' }).toString()
  });
  const text = await resp.text();
  try {
    const data = JSON.parse(text);
    return data.data?.videos || [];
  } catch { return []; }
}

async function getUserVideos(username) {
  const userResp = await fetch('https://tikwm.com/api/user/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ unique_id: username }).toString()
  });
  const userData = await userResp.json();
  const uid = userData?.data?.user?.id;
  if (!uid) return [];

  const videosResp = await fetch('https://tikwm.com/api/user/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ unique_id: username, count: '20', cursor: '0' }).toString()
  });
  const videosData = await videosResp.json();
  return videosData?.data?.videos || [];
}

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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await resp.json();
  const txt = data.content?.find(b => b.type === 'text')?.text || '';
  const cleaned = txt.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function alreadyExists(tiktokUrl, venueName) {
  const { data } = await supabase
    .from('experiences')
    .select('id')
    .or(`tiktok_url.eq.${tiktokUrl},name.ilike.${venueName}`)
    .limit(1);
  return data && data.length > 0;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = { processed: 0, saved: 0, skipped: 0, errors: 0 };
  const allVideos = [];

  for (const keyword of KEYWORDS) {
    await sleep(500);
    const videos = await searchTikTok(keyword);
    allVideos.push(...videos.map(v => ({ ...v, source: `keyword:${keyword}` })));
  }

  for (const username of USERNAMES) {
    await sleep(500);
    const videos = await getUserVideos(username);
    allVideos.push(...videos.map(v => ({ ...v, source: `user:${username}` })));
  }

  const seen = new Set();
  const unique = allVideos.filter(v => {
    if (seen.has(v.video_id)) return false;
    seen.add(v.video_id);
    return true;
  });

  for (const video of unique) {
    results.processed++;
    await sleep(300);

    try {
      const caption = (video.title || '').slice(0, 800).replace(/[\u0000-\u001F\u007F]/g, ' ');
      if (!caption || caption.length < 20) { results.skipped++; continue; }

      const tiktokUrl = `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;

      const parsed = await parseCaption(caption);

      if (parsed?.skip) { results.skipped++; continue; }

      const venues = Array.isArray(parsed) ? parsed : [parsed];

      for (const venue of venues) {
        if (!venue.name || !venue.area) { results.skipped++; continue; }

        const exists = await alreadyExists(tiktokUrl, venue.name);
        if (exists) { results.skipped++; continue; }

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
          tiktok_url: tiktokUrl,
          status: 'pending'
        });

        results.saved++;
      }
    } catch (e) {
      results.errors++;
    }
  }

  res.status(200).json({
    message: 'TikTok search complete',
    videos_found: unique.length,
    ...results
  });
}