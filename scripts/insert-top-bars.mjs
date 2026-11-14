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
  { name: 'Endeavour', area: 'Deptford', zone: 'Southeast', category: 'bar', p: 1, vibe_tags: ['chaotic', 'underground', 'affordable'], comment: 'Long, dark Deptford dive with £5 pints and a red basement for gigs and comedy. Till 3am Fri–Sat.', q: 'Endeavour bar 39 Deptford Broadway' },
  { name: 'Lower Wine Bar', area: 'Waterloo', category: 'bar', vibe_tags: ['chill', 'romantic', 'foodie'], comment: 'Parisian-style wine bar spilling onto Lower Marsh, with a great by-the-glass list.', q: 'Lower wine bar Lower Marsh Waterloo' },
  { name: 'The Roses of Elagabalus', area: 'Dalston', category: 'bar', vibe_tags: ['fancy', 'aesthetic', 'romantic', 'cultural'], comment: 'Plush queer clubhouse by Dalston Junction with strong cocktails and weeknight drag cabaret.', q: 'Roses of Elagabalus Kingsland Road' },
  { name: 'Café 1001', area: 'Shoreditch', category: 'bar', p: 2, vibe_tags: ['social', 'chill', 'iconic'], comment: 'Brick Lane café by day and DJ bar by night, going for 25 years.', q: 'Cafe 1001 Brick Lane' },
  { name: 'Around', area: 'Clerkenwell', category: 'bar', p: 2, vibe_tags: ['romantic', 'chill'], comment: 'Snug cocktail bar on Exmouth Market with inventive savoury twists. Made for date night.', q: 'Around cocktail bar 27 Exmouth Market' },
  { name: 'Upstairs at Hausu', area: 'Peckham', category: 'bar', p: 2, vibe_tags: ['aesthetic', 'chill', 'romantic'], comment: 'Listening bar above Hausu with savoury cocktails and local DJs at weekends.', q: 'Upstairs at Hausu Station Way Peckham' },
  { name: 'Scarfes Bar', area: 'Holborn', category: 'bar', p: 3, vibe_tags: ['fancy', 'iconic', 'romantic'], comment: 'Grand bar at the Rosewood hotel with an open fire and live jazz every night.', q: 'Scarfes Bar Rosewood London High Holborn' },
  { name: 'Godet', area: 'Islington', category: 'bar', p: 2, vibe_tags: ['social', 'foodie', 'chill'], comment: 'Peachy-pink wine pub on Essex Road with natural wines and Chinese food from Ling Ling’s.', q: 'Godet 382 Essex Road' },
  { name: 'Next Door Records', area: "Shepherd's Bush", category: 'bar', vibe_tags: ['chill', 'cultural', 'social'], comment: 'Record shop and bar: coffee and vinyl by day, live music and cocktails at night.', q: 'Next Door Records Uxbridge Road Shepherds Bush' },
  { name: 'Half Cut Market', area: 'Holloway', category: 'bar', p: 2, vibe_tags: ['foodie', 'social', 'chill'], comment: 'Relaxed York Way wine bar with an approachable list and good skewers.', q: 'Half Cut Market York Way' },
  { name: 'Frank’s Cafe', area: 'Peckham', category: 'bar', p: 2, vibe_tags: ['scenic', 'social', 'iconic', 'outdoor'], comment: 'Seasonal rooftop bar on a Peckham car park with huge skyline views. Open May–September.', q: "Frank's Cafe Peckham rooftop Rye Lane" },
  { name: 'All My Friends', area: 'Hackney Wick', category: 'bar', vibe_tags: ['social', 'chaotic', 'foodie'], comment: 'Bar, record shop and club from The Cause team, with Dough Hands pizza and £5 Wednesdays.', q: 'All My Friends White Post Lane Hackney Wick' },
  { name: 'Bar Lotus', area: 'Dalston', category: 'bar', vibe_tags: ['aesthetic', 'underground', 'social'], comment: 'Retro-futurist Kingsland Road cocktail bar with a big garden terrace over the railway.', q: 'Bar Lotus Kingsland Road Dalston' },
  { name: 'Archive & Myth', area: 'Leicester Square', zone: 'Central', category: 'bar', p: 3, vibe_tags: ['underground', 'fancy', 'hidden_gems'], comment: 'Hidden cocktail bar beneath the Hippodrome Casino, with half-size cocktails and a late licence.', q: 'Archive & Myth Hippodrome Casino' },
  { name: 'Bauhaus Warehaus', area: 'Dalston', category: 'bar', p: 2, vibe_tags: ['aesthetic', 'social'], comment: 'Sister space to A Bar with Shapes for a Name, with a big garden and £8.50 house margs. Till 3am Thu–Sat.', q: 'Bauhaus Warehaus Kingsland Road' },
  { name: 'Jazu', area: 'Deptford', zone: 'Southeast', category: 'bar', vibe_tags: ['chill', 'aesthetic', 'cultural'], comment: 'Deptford listening bar with serious guest DJs and creative cocktails.', q: 'Jazu Deptford High Street' },
  { name: 'Lowcountry', area: 'Hoxton', category: 'bar', p: 2, vibe_tags: ['fancy', 'hidden_gems'], comment: 'Deep South-inspired basement bar near Old Street with 100+ whiskeys.', q: 'Lowcountry bar Nile Street London' },
  { name: 'Three Sheets Soho', area: 'Soho', category: 'bar', p: 3, vibe_tags: ['fancy', 'aesthetic'], comment: 'Soho outpost of the Dalston favourite, pouring imaginative modern cocktails.', q: 'Three Sheets Manette Street Soho' },
  { name: 'Le Beaujolais', area: 'Covent Garden', category: 'bar', vibe_tags: ['iconic', 'cultural', 'romantic'], comment: 'French wine bar open since 1972, with ties hanging from the ceiling and classic bistro food.', q: 'Le Beaujolais Litchfield Street' },
  { name: 'Dive', area: 'Marylebone', category: 'bar', vibe_tags: ['fancy', 'romantic', 'underground'], comment: 'Dark, 70s-styled basement cocktail bar on Blandford Street.', q: 'Dive bar Blandford Street Marylebone' },
  { name: 'Flying W Saloon', area: 'London Bridge', category: 'bar', vibe_tags: ['social', 'chaotic', 'hidden_gems'], comment: 'Semi-secret country-music saloon next to Texas Joe’s, with bourbon and margaritas.', q: 'Flying W Saloon Snowsfields' },
  { name: 'Bar Italia', area: 'Soho', category: 'cafe', p: 1, vibe_tags: ['iconic', 'cultural', 'affordable'], comment: 'Frith Street espresso bar, open since 1949 and until 4am.', q: 'Bar Italia Frith Street' },
  { name: 'Blondies', area: 'Clapton', category: 'bar', p: 2, vibe_tags: ['chaotic', 'underground', 'social'], comment: 'Leather-clad dive bar with metal gigs, DJs and shots.', q: 'Blondies bar Clapton' },
  { name: "Helgi's", area: 'Hackney', category: 'bar', vibe_tags: ['underground', 'chaotic'], comment: 'Heavy, psychedelic music bar, open late every night.', q: "Helgi's bar Hackney" },
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
