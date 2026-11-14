// Backfill photo_url for approved venues that have a google_place_id but no photo.
// Uses the Google Places API (New): Place Details with a photos field mask, then
// the photo media endpoint. Each image is copied to Vercel Blob at venues/<id>.jpg.
//
// Usage:  node --env-file=.env.local scripts/backfill-photos.mjs [limit]
// Needs:  VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_PLACES_KEY, BLOB_READ_WRITE_TOKEN
import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const apiKey = process.env.GOOGLE_PLACES_KEY;
const limit = Number(process.argv[2]) || 2000;

async function firstPhotoName(placeId) {
  const resp = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
  });
  if (!resp.ok) throw new Error(`details ${resp.status}: ${(await resp.text()).slice(0, 120)}`);
  const data = await resp.json();
  return data.photos?.[0]?.name || null;
}

async function backfill(venue) {
  const photoName = await firstPhotoName(venue.google_place_id);
  if (!photoName) return 'no photo on Google';

  const media = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`
  );
  if (!media.ok) throw new Error(`media ${media.status}`);
  const contentType = media.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error(`unexpected ${contentType}`);

  const blob = await put(`venues/${venue.id}.jpg`, Buffer.from(await media.arrayBuffer()), {
    access: 'public',
    contentType,
    allowOverwrite: true,
    // Explicit token: otherwise the SDK prefers OIDC (VERCEL_OIDC_TOKEN from
    // `vercel env pull`), which isn't enabled for local development.
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const { error } = await supabase.from('experiences').update({ photo_url: blob.url }).eq('id', venue.id);
  if (error) throw new Error(`db: ${error.message}`);
  return null;
}

async function main() {
  const { data: venues, error } = await supabase
    .from('experiences')
    .select('id, name, google_place_id')
    .eq('status', 'approved')
    .is('photo_url', null)
    .not('google_place_id', 'is', null)
    .order('name')
    .limit(limit);
  if (error) throw error;

  console.log(`Found ${venues.length} venues without photos`);
  let ok = 0, skipped = 0, failed = 0;

  for (const venue of venues) {
    try {
      const reason = await backfill(venue);
      if (reason) { skipped++; console.log(`  - ${venue.name}: ${reason}`); }
      else { ok++; console.log(`  ✓ ${venue.name}`); }
    } catch (e) {
      failed++;
      console.log(`  ✗ ${venue.name}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`Done. added ${ok}, no photo ${skipped}, failed ${failed}`);
}

main();
