import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apiKey = process.env.GOOGLE_PLACES_KEY;

async function main() {
  const { data: venues } = await supabase
    .from('experiences')
    .select('id, name, google_place_id')
    .eq('status', 'approved')
    .is('photo_url', null)
    .not('google_place_id', 'is', null)
    .limit(50);

  console.log(`Found ${venues?.length || 0} venues without photos`);

  for (const venue of (venues || [])) {
    try {
      const detailResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${venue.google_place_id}&fields=photos&key=${apiKey}`
      );
      const detailData = await detailResp.json();
      const photoRef = detailData.result?.photos?.[0]?.photo_reference;

      if (!photoRef) {
        console.log(`  ✗ ${venue.name} — no photo`);
        continue;
      }

      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${apiKey}`;
      const photoResp = await fetch(photoUrl);
      const photoBuffer = await photoResp.arrayBuffer();
      const contentType = photoResp.headers.get('content-type') || 'image/jpeg';

      const blob = await put(`venues/${venue.id}.jpg`, Buffer.from(photoBuffer), {
        access: 'public',
        contentType,
      });

      await supabase.from('experiences').update({ photo_url: blob.url }).eq('id', venue.id);
      console.log(`  ✓ ${venue.name} → ${blob.url}`);

      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`  ✗ ${venue.name} — ${e.message}`);
    }
  }

  console.log('Done.');
}

main();
