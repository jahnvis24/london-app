// Add named catalogue venues by Google place id: details from Places API (New),
// first photo to Vercel Blob at 1200px, approved row in experiences.
//
// Usage:  node --env-file=.env.local scripts/add-venues.mjs [--apply]
// Needs:  VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_PLACES_KEY, BLOB_READ_WRITE_TOKEN
// Edit VENUES below, dry-run first, then --apply.
import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';
import { fetchFirstPlacePhoto } from '../api/_places.mjs';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apiKey = process.env.GOOGLE_PLACES_KEY;
const APPLY = process.argv.includes('--apply');

// Owner's onboarding starters, 2026-11-16.
const VENUES = [
  { place_id: 'ChIJ-81zpI0FdkgRElPKfBinw0M', name: 'Red Room', area: 'Mayfair', category: 'bar', vibe_tags: ['fancy', 'romantic', 'aesthetic'], comment: 'Wine bar at The Connaught with a huge list by the glass and art on every wall. Dress up a bit.' },
  { place_id: 'ChIJo3Ddx78FdkgRVRBegomu_4w', name: 'Fatt Pundit', area: 'Soho', category: 'restaurant', vibe_tags: ['foodie', 'social', 'affordable'], comment: 'Indo-Chinese small plates on Berwick Street: momos, chilli garlic prawns and the crispy chilli chicken everyone orders.' },
  { place_id: 'ChIJee_NWiIddkgRkOmT87ZjiIc', name: 'HOKO Hong Kong Cafe', area: 'Brick Lane', category: 'restaurant', vibe_tags: ['foodie', 'affordable', 'hidden_gems'], comment: 'Hong Kong cha chaan teng on Brick Lane: milk tea, pineapple buns and baked pork chop rice.' },
  { place_id: 'ChIJaVq0zRkddkgRjgkDICp7QKQ', name: "Fink's at Clissold House", area: 'Stoke Newington', category: 'cafe', vibe_tags: ['chill', 'outdoor', 'foodie'], comment: 'Café inside Georgian Clissold House, with brunch on the terrace looking over the park.' },
];

const LEVEL_TO_PRICE = { PRICE_LEVEL_FREE: 'Free', PRICE_LEVEL_INEXPENSIVE: 'Under £15pp', PRICE_LEVEL_MODERATE: '£15-35pp', PRICE_LEVEL_EXPENSIVE: '£35-70pp', PRICE_LEVEL_VERY_EXPENSIVE: '£70pp+' };

async function details(placeId) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'id,displayName,formattedAddress,postalAddress,location,rating,userRatingCount,priceLevel,websiteUri,nationalPhoneNumber,regularOpeningHours,businessStatus' },
  });
  if (!r.ok) throw new Error(`details ${r.status}`);
  return r.json();
}

async function main() {
  const { data: cat, error } = await supabase.from('experiences').select('id, name, area, zone, google_place_id').is('user_id', null).range(0, 4999);
  if (error) throw error;
  const haveIds = new Set(cat.map(v => v.google_place_id).filter(Boolean));
  const zoneVotes = {};
  for (const v of cat) if (v.area && v.zone) { const a = (zoneVotes[v.area.toLowerCase()] ||= {}); a[v.zone] = (a[v.zone] || 0) + 1; }
  const zoneFor = (area) => { const z = zoneVotes[String(area).toLowerCase()]; return z ? Object.entries(z).sort((a, b) => b[1] - a[1])[0][0] : null; };

  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'}: ${VENUES.length} venues\n`);
  for (const v of VENUES) {
    if (haveIds.has(v.place_id)) { console.log(`  - ${v.name}: already in the catalogue`); continue; }
    const p = await details(v.place_id);
    const zone = zoneFor(v.area) || 'Central';
    console.log(`  ${v.name.padEnd(26)} → ${p.displayName?.text} · ${p.formattedAddress} · ★${p.rating ?? '–'} · ${v.area} / ${zone}${p.businessStatus && p.businessStatus !== 'OPERATIONAL' ? ` ⚠ ${p.businessStatus}` : ''}`);
    if (!APPLY) continue;
    const row = {
      name: v.name, area: v.area, zone, category: v.category, vibe_tags: v.vibe_tags, comment: v.comment,
      price: LEVEL_TO_PRICE[p.priceLevel] || null, is_event: false, status: 'approved', source: 'owner-onboarding-2026-11',
      address: p.formattedAddress, postcode: p.postalAddress?.postalCode || null,
      lat: p.location.latitude, lng: p.location.longitude, google_place_id: p.id,
      google_rating: p.rating ?? null, google_review_count: p.userRatingCount ?? null, google_price_level: p.priceLevel || null,
      website: p.websiteUri || null, phone: p.nationalPhoneNumber || null,
      opening_hours: p.regularOpeningHours?.weekdayDescriptions || null,
    };
    const { data: ins, error: e } = await supabase.from('experiences').insert(row).select('id').single();
    if (e) { console.log(`    ✗ insert failed: ${e.message}`); continue; }
    const photo = await fetchFirstPlacePhoto(p.id, apiKey, 1200);
    if (photo) {
      const blob = await put(`venues/${ins.id}-1200.jpg`, photo.buffer, { access: 'public', contentType: photo.contentType, allowOverwrite: true, token: process.env.BLOB_READ_WRITE_TOKEN });
      await supabase.from('experiences').update({ photo_url: blob.url }).eq('id', ins.id);
      console.log(`    ✓ added with photo`);
    } else console.log(`    ✓ added (no Google photo)`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
