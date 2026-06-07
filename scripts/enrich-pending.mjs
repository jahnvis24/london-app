import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  'https://hhkmbyrwyardhozufusu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa21ieXJ3eWFyZGhvenVmdXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4OTU4MywiZXhwIjoyMDk0NzY1NTgzfQ.3Yp-vYfPuonbYzAISpsRxOKlC3fUKmH-X2DxNY7S4BE'
);

const API_HOST = 'https://london-app.vercel.app';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const { data: pending } = await supabase
    .from('experiences')
    .select('id, name, area, lat, google_rating')
    .eq('status', 'pending')
    .is('google_rating', null);

  console.log(`Found ${pending.length} pending venues without Google data`);

  let enriched = 0, failed = 0;
  for (const v of pending) {
    try {
      const resp = await fetch(`${API_HOST}/api/enrich-venue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: v.name, area: v.area })
      });
      const data = await resp.json();

      if (data.found) {
        await supabase.from('experiences').update({
          address: data.validated_address,
          postcode: data.postcode,
          lat: data.lat,
          lng: data.lng,
          google_place_id: data.google_place_id,
          google_rating: data.google_rating,
          google_review_count: data.google_review_count,
          google_price_level: data.google_price_level,
          website: data.website,
          phone: data.phone,
          opening_hours: data.opening_hours,
        }).eq('id', v.id);
        enriched++;
        process.stdout.write('.');
      } else {
        failed++;
        process.stdout.write('x');
      }
    } catch (e) {
      failed++;
      process.stdout.write('!');
    }
    await sleep(300); // rate limit Google
  }

  console.log(`\nDone: ${enriched} enriched, ${failed} not found on Google`);
})();
