import { put } from '@vercel/blob';

// Combined helper endpoint for the Saved tab (kept as one function to stay under
// the Vercel Hobby 12-function limit). Dispatches on body.tool:
//   tool: "image" → store a thumbnail in Blob, return a stable public URL
//         { image_base64, content_type } | { image_url } | { place_id }
//   tool: "maps"  → resolve a Google Maps URL into one or more venues
//         { url }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const tool = req.body?.tool;
  try {
    if (tool === 'image') return await handleImage(req, res);
    if (tool === 'maps') return await handleMaps(req, res);
    if (tool === 'instagram') return await handleInstagram(req, res);
    if (tool === 'photos') return await handlePhotos(req, res);
    return res.status(400).json({ error: 'Unknown tool (expected "image", "maps", "instagram", or "photos")' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function handleImage(req, res) {
  const { image_base64, image_url, place_id, content_type } = req.body || {};
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  let buffer;
  let contentType = content_type || 'image/jpeg';

  if (image_base64) {
    buffer = Buffer.from(image_base64, 'base64');
  } else if (image_url) {
    const r = await fetch(image_url);
    if (!r.ok) throw new Error('Could not fetch source image (' + r.status + ')');
    buffer = Buffer.from(await r.arrayBuffer());
    contentType = r.headers.get('content-type') || contentType;
  } else if (place_id) {
    if (!apiKey) throw new Error('Google Places key not configured');
    const d = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=photos&key=${apiKey}`);
    const dj = await d.json();
    const ref = dj.result?.photos?.[0]?.photo_reference;
    if (!ref) return res.status(200).json({ found: false, message: 'No Google photo available' });
    const pr = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${ref}&key=${apiKey}`);
    buffer = Buffer.from(await pr.arrayBuffer());
    contentType = pr.headers.get('content-type') || contentType;
  } else {
    return res.status(400).json({ error: 'Provide image_base64, image_url, or place_id' });
  }

  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const key = `saves/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(key, buffer, { access: 'public', contentType });
  return res.status(200).json({ found: true, url: blob.url });
}

// Pulls the caption + thumbnail from a public Instagram post via its Open Graph
// tags, so the user can paste just the link. Instagram sometimes serves a login
// wall to servers — then caption is empty and the client falls back to asking
// for the pasted caption. (RapidAPI is reserved for the cron scraper to stay
// within the free tier limit.)
async function handleInstagram(req, res) {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  const decode = (s) => (s || '')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow' });
    const html = await r.text();

    const grab = (prop) => {
      const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`, 'i'));
      return m ? decode(m[1]) : null;
    };

    let caption = grab('og:description') || '';
    const image_url = grab('og:image');
    const quoted = caption.match(/[:\-]\s*[""](.+)[""]\s*$/s) || caption.match(/:\s*"(.+)"$/s);
    if (quoted) caption = quoted[1];

    const blocked = /login|log in/i.test(grab('og:title') || '') && !image_url;
    if ((!caption || caption.length < 4) && !image_url) {
      return res.status(200).json({ found: false, blocked, message: 'Instagram did not return the caption (likely a login wall). Paste the caption text instead.' });
    }
    return res.status(200).json({ found: true, caption, image_url });
  } catch (e) {
    return res.status(200).json({ found: false, message: e.message });
  }
}

// Returns several directly-loadable Google Places photo URLs for a venue (for the
// detail-page gallery). Resolves each photo redirect to its googleusercontent URL.
async function handlePhotos(req, res) {
  const { place_id } = req.body || {};
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!place_id) return res.status(400).json({ error: 'place_id required' });
  if (!apiKey) return res.status(500).json({ error: 'Google Places key not configured' });
  const d = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=photos&key=${apiKey}`);
  const dj = await d.json();
  const refs = (dj.result?.photos || []).slice(0, 8).map(p => p.photo_reference).filter(Boolean);
  const urls = [];
  for (const ref of refs) {
    try {
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=${ref}&key=${apiKey}`, { redirect: 'manual' });
      const loc = r.headers.get('location');
      if (loc) urls.push(loc);
    } catch (e) { /* skip */ }
  }
  return res.status(200).json({ found: urls.length > 0, urls });
}

async function handleMaps(req, res) {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
  const places = [];
  const seen = new Set();
  const add = (rawName, lat, lng) => {
    if (!rawName) return;
    let name = rawName;
    try { name = decodeURIComponent(rawName.replace(/\+/g, ' ')); } catch { name = rawName.replace(/\+/g, ' '); }
    name = name.trim();
    const k = name.toLowerCase() + (lat || '');
    if (!name || name.length < 2 || seen.has(k)) return;
    seen.add(k);
    places.push({ name, lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null });
  };

  const resp = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  const finalUrl = resp.url || url;
  const html = await resp.text();

  const placeMatch = finalUrl.match(/\/place\/([^/@]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (placeMatch) add(placeMatch[1], placeMatch[2], placeMatch[3]);

  if (places.length === 0) {
    const nameCoordRe = /\\?"([^"\\]{3,70})\\?"[^\[]{0,200}\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d{4,}),\s*(-?\d+\.\d{4,})/g;
    let m;
    while ((m = nameCoordRe.exec(html)) && places.length < 200) add(m[1], m[2], m[3]);
  }

  if (places.length === 0) {
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (og && !/google maps/i.test(og[1])) add(og[1], null, null);
  }

  if (places.length === 0) {
    return res.status(200).json({
      found: false,
      finalUrl,
      message: 'Could not extract places from this link. Google often blocks list scraping — paste individual Maps links or place names instead.',
    });
  }
  return res.status(200).json({ found: true, finalUrl, count: places.length, places });
}
