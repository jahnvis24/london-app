// Add late-night bars (from Time Out's "late-night bars in London" list, 2026-11)
// to the curated catalogue. Each venue is matched on Google Places (New) for its
// place ID, location, rating, price, hours and website, then a photo is copied to
// Vercel Blob. Skips anything already in the catalogue (same place ID or name).
//
// Usage:  node --env-file=.env.local scripts/insert-late-night-venues.mjs          (dry run)
//         node --env-file=.env.local scripts/insert-late-night-venues.mjs --apply
import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const apiKey = process.env.GOOGLE_PLACES_KEY;
const APPLY = process.argv.includes('--apply');

// p = Time Out price (1–4), used only when Google has no price. q = search override.
// Every venue on this list is tagged 'top_pick' (shown as a "Top Pick" badge),
// including ones already in the catalogue.
// (Martello Hall left out: Google only has a generic pin for it, no bar listing.)
const venues = [
  { name: 'Tiroler Hut', area: 'Bayswater', zone: 'West', category: 'restaurant', p: 3, vibe_tags: ['chaotic', 'iconic', 'hidden_gems', 'foodie'], comment: 'Basement Austrian restaurant running since 1967, with a front bar open till 1am (Tue–Sat).' },
  { name: 'Blondies', area: 'Clapton', category: 'bar', p: 2, vibe_tags: ['chaotic', 'underground', 'social'], comment: 'Leather-clad dive bar with metal gigs, DJs and shots. Till 1:30am Thu–Sat.', q: 'Blondies bar Clapton' },
  { name: 'Bloodsports', area: 'Covent Garden', category: 'bar', p: 2, vibe_tags: ['chaotic', 'social'], comment: 'Huge sports bar showing horror films, with pool, darts, karaoke and Bloody Marys. Till 2am daily.' },
  { name: 'Below Stone Nest', area: 'Soho', category: 'bar', vibe_tags: ['underground', 'hidden_gems', 'social'], comment: 'Basement bar on Shaftesbury Avenue with good cocktails and food. Till 2am Tue–Sat.' },
  { name: 'Cahoots', area: 'Soho', category: 'bar', p: 3, vibe_tags: ['aesthetic', 'social', 'iconic'], comment: '1940s Underground-station-themed cocktail den off Carnaby. Till 2am Thu–Sat.', q: 'Cahoots Kingly Court Soho' },
  { name: 'Old St Records', area: 'Shoreditch', category: 'bar', vibe_tags: ['social', 'chaotic'], comment: 'Live music, cocktails and sharing pizzas, made for groups. Till 2am.' },
  { name: 'Nightjar', area: 'Shoreditch', category: 'bar', p: 2, vibe_tags: ['fancy', 'romantic', 'iconic', 'underground'], comment: 'Speakeasy with live jazz and some of London’s best cocktails. Book ahead. Till 2am Fri–Sat.', q: 'Nightjar City Road London' },
  { name: 'Laki Kane', area: 'Marylebone', category: 'bar', p: 2, vibe_tags: ['social', 'chaotic'], comment: 'Tiki bar with a beachy soundtrack and lots of rum. Open late at weekends.', q: 'Laki Kane Duke Street Marylebone' },
  { name: 'Noodle and Beer', area: 'Chinatown', category: 'restaurant', p: 2, vibe_tags: ['foodie', 'affordable', 'hidden_gems'], comment: 'Sichuan noodles upstairs, a red-lit basement bar downstairs. Till 4am Thu–Sat.', q: 'Noodle and Beer Wardour Street' },
  { name: 'The Prince of Peckham', area: 'Peckham', category: 'bar', p: 2, vibe_tags: ['social', 'chaotic'], comment: 'Peckham pub with jerk chicken and hip hop, R&B and disco nights. Till 2:30am Fri–Sat.' },
  { name: 'Aces and Eights', area: 'Tufnell Park', category: 'bar', vibe_tags: ['chill', 'social', 'underground'], comment: 'Rock ’n’ roll dive bar with pizza and plenty of whisky. Till 1am daily, 2:30am Fri–Sat.' },
  { name: 'George & Dragon', area: 'Greenwich', category: 'nightlife', vibe_tags: ['chaotic', 'social', 'cultural'], comment: 'Traditional-looking pub with drag cabaret and a big shots list. Till 3am Fri–Sat.', q: 'George and Dragon Blackheath Road Greenwich' },
  { name: 'Four Quarters South', area: 'Peckham', category: 'bar', p: 1, vibe_tags: ['social', 'chaotic', 'affordable'], comment: 'Retro arcade bar: Street Fighter, Pac-Man and beer. Till 3am Fri–Sat.', q: 'Four Quarters Peckham arcade bar' },
  { name: 'Burlock Rum Room', area: 'Marylebone', category: 'bar', p: 3, vibe_tags: ['chill', 'romantic', 'fancy'], comment: 'Low-lit, Cuban-styled rum bar. Till 2am Thu, 3am Fri–Sat.', q: 'Burlock Marylebone rum bar' },
  { name: 'The Blues Kitchen Camden', area: 'Camden', category: 'nightlife', p: 2, vibe_tags: ['social', 'chaotic', 'iconic'], comment: 'Live blues and jazz, DJs and around 50 bourbons. Till 2:30am Fri, 3am Sat.' },
  { name: 'Dalston Superstore', area: 'Dalston', category: 'nightlife', vibe_tags: ['social', 'chaotic', 'iconic'], comment: 'LGBTQ+ bar and club on Kingsland High Street with local DJs Wed–Sun. Till 3am Fri–Sat.' },
  { name: 'Disrepute', area: 'Soho', category: 'bar', p: 3, vibe_tags: ['fancy', 'romantic', 'underground'], comment: 'Plush basement members’ bar that takes walk-ins. Cocktails till 3am every night.' },
  { name: 'Eagle London', area: 'Vauxhall', category: 'nightlife', vibe_tags: ['social', 'chaotic', 'iconic'], comment: 'Independent gay bar with weekend club nights and Horse Meat Disco on Sundays. Till 3am Fri–Sun.' },
  { name: 'The Pink Chihuahua at El Camion', area: 'Soho', category: 'bar', vibe_tags: ['underground', 'social', 'hidden_gems'], comment: 'Day of the Dead-themed basement bar under a Mexican restaurant. Till 3am.', q: 'Pink Chihuahua El Camion Soho' },
  { name: 'Experimental Cocktail Club', area: 'Chinatown', category: 'bar', p: 3, vibe_tags: ['fancy', 'romantic', 'iconic'], comment: 'Three-floor cocktail bar behind an unmarked Chinatown door. Booking helps. Till 3am Fri–Sat.' },
  { name: "Helgi's", area: 'Hackney', category: 'bar', vibe_tags: ['underground', 'chaotic'], comment: 'Heavy, psychedelic music bar. Till 1am Sun–Wed, 2am Thu–Fri, 3am Sat.', q: "Helgi's bar Hackney" },
  { name: 'Opium', area: 'Chinatown', category: 'bar', p: 2, vibe_tags: ['aesthetic', 'romantic', 'foodie'], comment: 'Cocktail bar and dim sum parlour styled like an old smoking den. Till 3am Fri–Sat.', q: 'Opium cocktail bar Gerrard Street' },
  { name: 'Sweeties at The Standard', area: "King's Cross", category: 'bar', p: 2, vibe_tags: ['aesthetic', 'scenic', 'fancy', 'social'], comment: '10th-floor disco bar with big views and DJs. Till 3am Thu–Sat.', q: 'Sweeties The Standard London' },
  { name: 'Ridley Road Market Bar', area: 'Dalston', category: 'bar', p: 2, vibe_tags: ['chaotic', 'social'], comment: 'Market-stall-styled bar with a mirrorball dancefloor. Till 3am Fri–Sat.' },
  { name: 'The Shacklewell Arms', area: 'Dalston', category: 'nightlife', vibe_tags: ['social', 'underground', 'cultural'], comment: 'Gigs seven nights a week plus club nights. Till 3am Fri–Sat.' },
  { name: "Simmons King's Cross", area: "King's Cross", category: 'bar', vibe_tags: ['chaotic', 'social', 'affordable'], comment: 'Kitsch DJ bar with board games and retro sweets. Till 3am Fri–Sat.', q: "Simmons Bar King's Cross" },
  { name: 'Soma', area: 'Soho', category: 'bar', vibe_tags: ['fancy', 'foodie', 'hidden_gems'], comment: 'Basement bar from the Kricket team, with cocktails built on South Asian flavours. Till 3am Fri–Sat.', q: 'Soma bar Denman Street Soho' },
  { name: "Slim Jim's Liquor Store", area: 'Islington', category: 'bar', vibe_tags: ['chaotic', 'social'], comment: 'Upper Street rock bar with DJs and whiskies. Till 2am Mon–Wed, 3am Thu–Sat.' },
  { name: 'The George Tavern', area: 'Stepney', category: 'bar', vibe_tags: ['chaotic', 'underground', 'cultural', 'iconic'], comment: 'One of London’s oldest pubs, full of character. Till 3am Fri–Sat.' },
  { name: 'Mascara Bar', area: 'Stamford Hill', zone: 'North', category: 'nightlife', vibe_tags: ['social', 'cultural', 'chaotic'], comment: 'Irish bar with open mics, jam sessions and karaoke. Till 3am Fri–Sat.' },
  { name: 'The Dolphin', area: 'Hackney', category: 'bar', vibe_tags: ['chaotic', 'iconic'], comment: 'Mare Street’s late-night institution, reopened in 2023. Till 3am Fri–Sat.', q: 'The Dolphin pub Mare Street Hackney' },
  { name: 'A Bar with Shapes for a Name', area: 'Haggerston', category: 'bar', p: 2, vibe_tags: ['aesthetic', 'affordable', 'social'], comment: 'Bauhaus-inspired bar with cheap pre-bottled house cocktails. Till 4am every night.' },
  { name: 'The Lexington', area: 'Angel', category: 'nightlife', vibe_tags: ['social', 'cultural', 'underground'], comment: 'Indie gigs upstairs and a huge bourbon list downstairs. Till 4am Fri–Sat.', q: 'The Lexington Pentonville Road' },
  { name: 'Bar Italia', area: 'Soho', category: 'cafe', p: 1, vibe_tags: ['iconic', 'cultural', 'affordable'], comment: 'Frith Street espresso bar, open since 1949 and until 4am.', q: 'Bar Italia Frith Street' },
  { name: 'Balans Soho No.60', area: 'Soho', category: 'restaurant', p: 2, vibe_tags: ['social', 'chaotic', 'foodie'], comment: 'Old Compton Street brasserie serving cocktails until 6am.', q: 'Balans Soho Society Old Compton Street' },
  { name: 'Polo 24 Hour Bar', area: 'Liverpool Street', zone: 'Central', category: 'cafe', vibe_tags: ['affordable', 'chill'], comment: '24-hour café-bar opposite Liverpool Street station, with craft beer and cider.' },
  { name: 'VQ Chelsea', area: 'Chelsea', category: 'restaurant', vibe_tags: ['chill', 'foodie'], comment: '24-hour diner on Fulham Road with cocktails and beer at any hour.', q: 'VQ Fulham Road Chelsea' },
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
      is_event: false, status: 'approved', source: 'timeout-late-night-2026-11',
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
