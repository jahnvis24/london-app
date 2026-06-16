import { put } from '@vercel/blob';

// Stores a thumbnail in Vercel Blob and returns a stable public URL.
// Accepts one of:
//   { image_base64, content_type }  → a screenshot (already downscaled client-side)
//   { image_url }                   → a remote image (e.g. TikTok cover) we copy so it can't expire
//   { place_id }                    → fetch the first Google Places photo for a venue
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image_base64, image_url, place_id, content_type } = req.body || {};
  const apiKey = process.env.GOOGLE_PLACES_KEY;

  try {
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
    res.status(200).json({ found: true, url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
