// Fill missing rating / price / location on approved catalogue venues from the
// Google Places API (New). Only ever fills EMPTY fields — never overwrites.
//
// Usage:  node --env-file=.env.local scripts/backfill-details.mjs          (dry run)
//         node --env-file=.env.local scripts/backfill-details.mjs --apply
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const apiKey = process.env.GOOGLE_PLACES_KEY;
const APPLY = process.argv.includes('--apply');
// Text-search matching for venues without a place ID is opt-in: it mismatches
// walking routes to single landmarks (e.g. "Greenwich Riverside to Cutty Sark"
// → Cutty Sark), so review a dry run before using it with --apply.
const SEARCH = process.argv.includes('--search');

const LEVEL_TO_PRICE = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: 'Under £15pp',
  PRICE_LEVEL_MODERATE: '£15-35pp',
  PRICE_LEVEL_EXPENSIVE: '£35-70pp',
  PRICE_LEVEL_VERY_EXPENSIVE: '£70pp+',
};

function bucketFromRange(range) {
  const lo = Number(range?.startPrice?.units);
  const hi = Number(range?.endPrice?.units);
  if (!Number.isFinite(lo)) return null;
  const mid = Number.isFinite(hi) ? (lo + hi) / 2 : lo;
  if (mid === 0) return 'Free';
  if (mid < 15) return 'Under £15pp';
  if (mid < 35) return '£15-35pp';
  if (mid < 70) return '£35-70pp';
  return '£70pp+';
}

const inLondon = (lat, lng) => lat > 51.25 && lat < 51.75 && lng > -0.6 && lng < 0.35;
const empty = v => v == null || v === '' || (Array.isArray(v) && v.length === 0);

async function google(url, fieldMask, body) {
  const resp = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': fieldMask, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) throw new Error(`google ${resp.status}: ${(await resp.text()).slice(0, 120)}`);
  return resp.json();
}

async function main() {
  const { data: all, error } = await supabase
    .from('experiences')
    .select('id, name, area, address, lat, lng, postcode, google_place_id, google_rating, google_review_count, price, google_price_level')
    .is('user_id', null).eq('status', 'approved').range(0, 4999);
  if (error) throw error;

  const usedIds = new Set(all.map(v => v.google_place_id).filter(Boolean));
  const targets = all.filter(v => empty(v.google_rating) || empty(v.price) || empty(v.lat) || empty(v.lng));
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${targets.length} venues with gaps`);

  const stats = { rating: 0, price: 0, location: 0, matched: 0, noMatch: [], dupMatch: [], noPrice: [], failed: [] };

  for (const v of targets) {
    try {
      let placeId = v.google_place_id;
      const patch = {};

      if (!placeId && !SEARCH) { stats.noMatch.push(v.name); continue; }
      if (!placeId) {
        const q = `${v.name} ${v.area || ''} London`.trim();
        const res = await google('https://places.googleapis.com/v1/places:searchText',
          'places.id,places.displayName,places.formattedAddress,places.location', { textQuery: q, maxResultCount: 1 });
        const p = res.places?.[0];
        if (!p || !inLondon(p.location?.latitude, p.location?.longitude)) { stats.noMatch.push(v.name); continue; }
        if (usedIds.has(p.id)) { stats.dupMatch.push(`${v.name} → ${p.displayName?.text}`); continue; }
        placeId = p.id;
        patch.google_place_id = p.id;
        usedIds.add(p.id);
        stats.matched++;
        console.log(`  ~ matched "${v.name}" → "${p.displayName?.text}", ${p.formattedAddress}`);
      }

      const d = await google(`https://places.googleapis.com/v1/places/${placeId}`,
        'rating,userRatingCount,priceLevel,priceRange,location,formattedAddress,postalAddress');

      if (empty(v.google_rating) && d.rating != null) { patch.google_rating = d.rating; stats.rating++; }
      if (empty(v.google_review_count) && d.userRatingCount != null) patch.google_review_count = d.userRatingCount;
      if (empty(v.google_price_level) && d.priceLevel) patch.google_price_level = d.priceLevel;
      if (empty(v.price)) {
        const p = bucketFromRange(d.priceRange) || LEVEL_TO_PRICE[d.priceLevel];
        if (p) { patch.price = p; stats.price++; } else stats.noPrice.push(v.name);
      }
      if ((empty(v.lat) || empty(v.lng)) && d.location) {
        patch.lat = d.location.latitude; patch.lng = d.location.longitude; stats.location++;
        if (empty(v.address) && d.formattedAddress) patch.address = d.formattedAddress;
        if (empty(v.postcode) && d.postalAddress?.postalCode) patch.postcode = d.postalAddress.postalCode;
      }

      if (Object.keys(patch).length && APPLY) {
        const { error: e } = await supabase.from('experiences').update(patch).eq('id', v.id);
        if (e) throw new Error(`db: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      stats.failed.push(`${v.name}: ${e.message}`);
    }
  }

  console.log(`\nratings filled: ${stats.rating}, prices filled: ${stats.price}, locations filled: ${stats.location}, new Google matches: ${stats.matched}`);
  console.log(`no Google match (${stats.noMatch.length}): ${stats.noMatch.join(', ')}`);
  console.log(`matched a venue already in the list (${stats.dupMatch.length}): ${stats.dupMatch.join('; ')}`);
  console.log(`Google has no price (${stats.noPrice.length}): ${stats.noPrice.join(', ')}`);
  console.log(`failed (${stats.failed.length}): ${stats.failed.join('; ')}`);
}

main();
