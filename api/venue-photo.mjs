import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { requireUser, applyCors } from './_auth.mjs';
import { fetchFirstPlacePhoto } from './_places.mjs';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Writes photo_url on an arbitrary venue_id with the service key. Restricted to
  // admins so a user can't repoint another user's venue photo at any URL.
  const user = await requireUser(req, res);
  if (!user) return;
  const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!prof?.is_admin) return res.status(403).json({ error: 'Admins only' });

  const { venue_id, place_id } = req.body;
  if (!venue_id || !place_id) return res.status(400).json({ error: 'venue_id and place_id required' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key not configured' });

  try {
    const photo = await fetchFirstPlacePhoto(place_id, apiKey, 1200);
    if (!photo) return res.status(200).json({ found: false, message: 'No photo available' });

    // New file name per fetch so a CDN-cached old image is never served.
    const blob = await put(`venues/${venue_id}-1200.jpg`, photo.buffer, {
      access: 'public',
      contentType: photo.contentType,
      allowOverwrite: true,
    });

    await supabase.from('experiences').update({ photo_url: blob.url }).eq('id', venue_id);

    res.status(200).json({ found: true, photo_url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
