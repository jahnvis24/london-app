import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { venue_id, place_id } = req.body;
  if (!venue_id || !place_id) return res.status(400).json({ error: 'venue_id and place_id required' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key not configured' });

  try {
    const detailResp = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=photos&key=${apiKey}`
    );
    const detailData = await detailResp.json();
    const photoRef = detailData.result?.photos?.[0]?.photo_reference;

    if (!photoRef) return res.status(200).json({ found: false, message: 'No photo available' });

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${apiKey}`;
    const photoResp = await fetch(photoUrl);
    const photoBuffer = await photoResp.arrayBuffer();
    const contentType = photoResp.headers.get('content-type') || 'image/jpeg';

    const blob = await put(`venues/${venue_id}.jpg`, Buffer.from(photoBuffer), {
      access: 'public',
      contentType,
    });

    await supabase.from('experiences').update({ photo_url: blob.url }).eq('id', venue_id);

    res.status(200).json({ found: true, photo_url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
