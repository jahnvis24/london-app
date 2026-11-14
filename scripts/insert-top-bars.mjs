// Add Time Out's top London bars (2026-11) to the curated catalogue as Top Picks.
// Same engine as insert-late-night-venues.mjs: Google Places (New) match, photo
// to Vercel Blob, skips/tags venues already in the catalogue.
//
// Usage:  node --env-file=.env.local scripts/insert-top-bars.mjs          (dry run)
//         node --env-file=.env.local scripts/insert-top-bars.mjs --apply
import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apiKey = process.env.GOOGLE_PLACES_KEY;
const APPLY = process.argv.includes('--apply');

// p = Time Out price (1–4), used only when Google has no price. q = search override.
// Every venue on this list is tagged 'top_pick' (shown as a "Top Pick" badge),
// including ones already in the catalogue.
const venues = [
  { name: 'Café Kick', area: 'Clerkenwell', category: 'bar', vibe_tags: ['social', 'chill', 'iconic'], comment: 'Retro football bar on Exmouth Market, going for nearly 30 years. Vermouth on ice, Mahou on match days.', q: 'Cafe Kick Exmouth Market' },
  { name: 'Jumbi', area: 'Peckham', category: 'bar', vibe_tags: ['social', 'chaotic', 'foodie'], comment: 'Music-led bar in Copeland Park with a wall of records, DJs, Caribbean-inspired food and rum punch.', q: 'Jumbi Copeland Park Peckham' },
  { name: 'Ellie’s', area: 'Haggerston', category: 'bar', p: 2, vibe_tags: ['social', 'chill'], comment: 'Easy-going Kingsland Road cocktail bar with pavement tables and an £8 martini.', q: "Ellie's bar 428 Kingsland Road" },
  { name: 'Umbrella Workshop', area: 'Shoreditch', category: 'bar', p: 2, vibe_tags: ['hidden_gems', 'romantic', 'aesthetic'], comment: 'Tiny 12-seat bar down an alley off Boundary Street, testing experimental cocktails.', q: 'Umbrella Workshop Cleeve Workshops Boundary Street' },
  { name: 'Waltz', area: 'Shoreditch', category: 'bar', vibe_tags: ['fancy', 'aesthetic', 'romantic'], comment: 'Japanese cocktail bar with a menu that follows the micro-seasons.', q: 'Waltz cocktail bar Scrutton Street' },
  { name: 'Big John’s Biltong Bar', area: 'Deptford', zone: 'Southeast', category: 'bar', vibe_tags: ['chaotic', 'affordable', 'hidden_gems'], comment: 'Proper dive bar with cheap pints, biltong served at the bar and a very welcoming owner.', q: "Big John's Biltong Bar Deptford High Street" },
  { name: 'Tramps Bar', area: 'Islington', category: 'bar', p: 2, vibe_tags: ['cultural', 'aesthetic', 'foodie'], comment: 'Artist-run bar off City Road with huge speakers, gin-only martinis and weekday lunches.', q: 'Tramps bar Micawber Street London' },
  { name: 'Rasputin’s', area: 'Hackney', category: 'bar', p: 2, vibe_tags: ['affordable', 'social', 'chill'], comment: 'Low-key dive from the Dom’s Subs team: £7 martinis, B-movies and chess nights.', q: "Rasputin's bar Mare Street Hackney" },
  { name: 'Bonne Route', area: 'Harringay', zone: 'North', category: 'bar', p: 2, vibe_tags: ['chill', 'romantic'], comment: 'Cosy, candle-lit natural wine bar by Harringay station.', q: 'Bonne Route Quernmore Road' },
  { name: 'Equal Parts', area: 'Hackney', category: 'bar', vibe_tags: ['fancy', 'aesthetic'], comment: 'Green-tiled Hackney Road cocktail bar from the Sager + Wilde team, with a great low/no menu.', q: 'Equal Parts Hackney Road' },
];

const TO_PRICE = { 1: 'Under £15pp', 2: '£15-35pp', 3: '£35-70pp', 4: '£70pp+' };
const LEVEL_TO_PRICE = { PRICE_LEVEL_FREE: 'Free', PRICE_LEVEL_INEXPENSIVE: 'Under £15pp', PRICE_LEVEL_MODERATE: '£15-35pp', PRICE_LEVEL_EXPENSIVE: '£35-70pp', PRICE_LEVEL_VERY_EXPENSIVE: '£70pp+' };
const inLondon = (lat, lng) => lat > 51.25 && lat < 51.75 && lng > -0.6 && lng < 0.35;
const norm = (s) => String(s || '').toLowerCase().replace(/^the\s+/, '').replace(/[’'`]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();

async function search(q) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': apiKey, 'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours.weekdayDescriptions,places.websiteUri,places.nationalPhoneNumber,places.postalAddress,places.photos,places.businessStatus',
    },
    body: JSON.stringify({ textQuery: q, maxResultCount: 1, locationBias: { circle: { center: { latitude: 51.51, longitude: -0.12 }, radius: 30000 } } }),
  });
  if (!r.ok) throw new Error(`search ${r.status}: ${(await r.text()).slice(0, 120)}`);
  return (await r.json()).places?.[0] || null;
}

async function copyPhoto(photoName, id) {
  const media = await fetch(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`);
  const type = media.headers.get('content-type') || '';
  if (!media.ok || !type.startsWith('image/')) return null;
  const blob = await put(`venues/${id}.jpg`, Buffer.from(await media.arrayBuffer()), { access: 'public', contentType: type, allowOverwrite: true, token: process.env.BLOB_READ_WRITE_TOKEN });
  return blob.url;
}

async function main() {
  const { data: cat, error } = await supabase.from('experiences').select('id, name, area, zone, google_place_id, vibe_tags').is('user_id', null).range(0, 4999);
  if (error) throw error;
  const byId = new Map(cat.filter(v => v.google_place_id).map(v => [v.google_place_id, v]));
  const byName = new Map(cat.map(v => [norm(v.name), v]));
  const haveIds = new Set(byId.keys());
  const haveNames = new Set(byName.keys());
  // Already in the catalogue → just add the Top Pick tag.
  async function tagExisting(row, why) {
    const tags = row.vibe_tags || [];
    if (tags.includes('top_pick')) { out.skipped.push(`${row.name} (${why}, already Top Pick)`); return; }
    if (APPLY) { const { error: e } = await supabase.from('experiences').update({ vibe_tags: [...tags, 'top_pick'] }).eq('id', row.id); if (e) { console.log(`    ✗ tag failed: ${row.name}: ${e.message}`); return; } }
    out.tagged.push(`${row.name} (${why})`);
  }
  // Zone for an area = whatever the catalogue already mostly uses for it.
  const zoneVotes = {};
  for (const v of cat) if (v.area && v.zone) { const a = (zoneVotes[v.area.toLowerCase()] ||= {}); a[v.zone] = (a[v.zone] || 0) + 1; }
  const zoneFor = (area) => { const z = zoneVotes[String(area).toLowerCase()]; return z ? Object.entries(z).sort((a, b) => b[1] - a[1])[0][0] : null; };

  const out = { added: [], tagged: [], skipped: [], noMatch: [], noZone: [] };
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'}: ${venues.length} venues\n`);
  
  for (const v of venues) {
    if (haveNames.has(norm(v.name))) { await tagExisting(byName.get(norm(v.name)), 'same name'); continue; }
    const p = await search(v.q || `${v.name} ${v.area} London`);
    if (!p || !inLondon(p.location?.latitude, p.location?.longitude)) { out.noMatch.push(v.name); continue; }
    if (haveIds.has(p.id)) { if (byId.has(p.id)) await tagExisting(byId.get(p.id), `same place as "${byId.get(p.id).name}"`); else out.skipped.push(`${v.name} (Google returns the same place as another venue on this list: ${p.displayName?.text}, ${p.formattedAddress})`); continue; }
    const zone = v.zone || zoneFor(v.area);
    if (!zone) { out.noZone.push(`${v.name} (${v.area})`); continue; }
    const closed = p.businessStatus && p.businessStatus !== 'OPERATIONAL' ? ` ⚠ ${p.businessStatus}` : '';
    console.log(`  ${v.name.padEnd(34)} → ${p.displayName?.text} · ${p.formattedAddress} · ★${p.rating ?? '–'} · ${zone}${closed}`);
    haveIds.add(p.id);

    const row = {
      name: v.name, area: v.area, zone, category: v.category, vibe_tags: [...v.vibe_tags, 'top_pick'], comment: v.comment,
      price: LEVEL_TO_PRICE[p.priceLevel] || TO_PRICE[v.p] || null,
      is_event: false, status: 'approved', source: 'timeout-top-bars-2026-11',
      address: p.formattedAddress, postcode: p.postalAddress?.postalCode || null,
      lat: p.location.latitude, lng: p.location.longitude, google_place_id: p.id,
      google_rating: p.rating ?? null, google_review_count: p.userRatingCount ?? null, google_price_level: p.priceLevel || null,
      website: p.websiteUri || null, phone: p.nationalPhoneNumber || null,
      opening_hours: p.regularOpeningHours?.weekdayDescriptions || null,
    };
    if (APPLY) {
      const { data: ins, error: e } = await supabase.from('experiences').insert(row).select('id').single();
      if (e) { console.log(`    ✗ insert failed: ${e.message}`); continue; }
      const photo = p.photos?.[0]?.name ? await copyPhoto(p.photos[0].name, ins.id).catch(() => null) : null;
      if (photo) await supabase.from('experiences').update({ photo_url: photo }).eq('id', ins.id);
      else console.log('    (no photo)');
    }
    out.added.push(v.name);
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\n${APPLY ? 'added' : 'would add'} ${out.added.length}`);
  if (out.tagged.length) console.log(`${APPLY ? 'tagged' : 'would tag'} Top Pick on ${out.tagged.length} existing: ${out.tagged.join('; ')}`);
  if (out.skipped.length) console.log(`skipped ${out.skipped.length}: ${out.skipped.join('; ')}`);
  if (out.noMatch.length) console.log(`no Google match ${out.noMatch.length}: ${out.noMatch.join(', ')}`);
  if (out.noZone.length) console.log(`no zone for area ${out.noZone.length}: ${out.noZone.join(', ')}`);
}

main();
