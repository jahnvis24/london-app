import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE ─────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── ANALYTICS ────────────────────────────────────────────────
function track(event, properties = {}) {
  const uid = supabase.auth.getUser?.()?.then?.(r => r.data?.user?.id);
  uid?.then(id => {
    if (!id) return;
    supabase.from("analytics_events").insert({ user_id: id, event, properties }).then(() => {});
  }).catch(() => {});
}

// ── STATIC VENUE DATABASE (fallback) ─────────────────────────
const VENUES = [
  { id: "v1", name: "Dishoom Shoreditch", type: "restaurant", area: "east", tags: ["romantic", "chill", "aesthetic", "iconic"], price: "mid", bestTime: "day,night", bookingRequired: true, desc: "Bombay café vibes with legendary black dhal. The Bacon Naan Roll at brunch is London law.", emoji: "🍛", travelZone: "east" },
  { id: "v2", name: "St. John Bar & Restaurant", type: "restaurant", area: "central", tags: ["fancy", "cultural", "iconic", "foodie"], price: "high", bestTime: "night", bookingRequired: true, desc: "Nose-to-tail institution. Bone marrow on toast. Order the Eccles cake.", emoji: "🦴", travelZone: "central" },
  { id: "v3", name: "Brat", type: "restaurant", area: "east", tags: ["fancy", "foodie", "aesthetic", "cultural"], price: "high", bestTime: "night", bookingRequired: true, desc: "Open-fire Basque-inspired cooking. The whole turbot is a religious experience.", emoji: "🔥", travelZone: "east" },
  { id: "v4", name: "Mangal 2", type: "restaurant", area: "east", tags: ["chaotic", "foodie", "hidden_gems", "social"], price: "low", bestTime: "night", bookingRequired: false, desc: "Family-run Turkish ocakbasi in Dalston. Mesmerising open-grill theatre. BYOB, cash only.", emoji: "🍢", travelZone: "east" },
  { id: "v5", name: "E. Pellicci", type: "cafe", area: "east", tags: ["chill", "hidden_gems", "cultural", "solo"], price: "low", bestTime: "day", bookingRequired: false, desc: "1900 Art Deco caff on Bethnal Green Road. Grade II listed. Full English for £8.", emoji: "☕", travelZone: "east" },
  { id: "v6", name: "Quo Vadis", type: "restaurant", area: "central", tags: ["fancy", "romantic", "cultural", "aesthetic"], price: "high", bestTime: "night", bookingRequired: true, desc: "Soho institution with dazzling stained glass. Magical dining room.", emoji: "🍷", travelZone: "central" },
  { id: "v7", name: "Padella", type: "restaurant", area: "south", tags: ["chill", "foodie", "social", "iconic"], price: "low", bestTime: "day,night", bookingRequired: false, desc: "Borough Market's cult pasta spot. Pici cacio e pepe will haunt your dreams.", emoji: "🍝", travelZone: "south" },
  { id: "v8", name: "Gloria", type: "restaurant", area: "east", tags: ["chaotic", "social", "aesthetic", "fancy"], price: "mid", bestTime: "night", bookingRequired: true, desc: "Italian-camp maximalist fever dream. Negronis, giant meatballs, incredible atmosphere.", emoji: "🌸", travelZone: "east" },
  { id: "v9", name: "Sessions Arts Club", type: "bar", area: "central", tags: ["cultural", "aesthetic", "romantic", "hidden_gems"], price: "mid", bestTime: "night", bookingRequired: false, desc: "Former Victorian court turned candlelit haunt. Utterly atmospheric.", emoji: "🕯️", travelZone: "central" },
  { id: "v10", name: "Nightjar", type: "bar", area: "east", tags: ["romantic", "fancy", "hidden_gems", "underground"], price: "high", bestTime: "night", bookingRequired: true, desc: "Pre-Prohibition cocktails in an underground jazz bar. No sign on the door.", emoji: "🎷", travelZone: "east" },
  { id: "v11", name: "Satan's Whiskers", type: "bar", area: "east", tags: ["chaotic", "social", "hidden_gems", "underground"], price: "low", bestTime: "night", bookingRequired: false, desc: "Beloved Bethnal Green dive with 50+ rotating cocktails. Impossibly good music.", emoji: "🍹", travelZone: "east" },
  { id: "v12", name: "The Connaught Bar", type: "bar", area: "central", tags: ["fancy", "romantic", "luxury", "iconic"], price: "high", bestTime: "night", bookingRequired: true, desc: "Consistently world's best bar. The Martini trolley comes to you.", emoji: "🥃", travelZone: "central" },
  { id: "v13", name: "Lyaness", type: "bar", area: "south", tags: ["fancy", "aesthetic", "cultural", "hidden_gems"], price: "high", bestTime: "night", bookingRequired: true, desc: "Ryan Chetiyawardana's Southbank bar. Ingredient-led cocktails like tiny scientific experiments.", emoji: "🧪", travelZone: "south" },
  { id: "v14", name: "Walthamstow Wetlands", type: "outdoor", area: "east", tags: ["chill", "solo", "outdoor", "hidden_gems"], price: "low", bestTime: "day", bookingRequired: false, desc: "500 acres of urban nature reserve. London's largest urban wetland.", emoji: "🦆", travelZone: "east" },
  { id: "v15", name: "Columbia Road Flower Market", type: "market", area: "east", tags: ["chill", "social", "aesthetic", "iconic"], price: "low", bestTime: "day", bookingRequired: false, desc: "Sunday-only flower market that turns the East End into a perfumed riot. Go before 10am.", emoji: "🌸", travelZone: "east" },
  { id: "v16", name: "Maltby Street Market", type: "market", area: "south", tags: ["chill", "foodie", "social", "hidden_gems"], price: "low", bestTime: "day", bookingRequired: false, desc: "The local alternative to Borough. Under the arches. Less crowds, more discovery.", emoji: "🧀", travelZone: "south" },
  { id: "v17", name: "Tate Modern Turbine Hall", type: "gallery", area: "south", tags: ["cultural", "aesthetic", "solo", "chill"], price: "low", bestTime: "day", bookingRequired: false, desc: "The Turbine Hall commission is always unmissable. Free entry.", emoji: "🖼️", travelZone: "south" },
  { id: "v18", name: "Sir John Soane's Museum", type: "museum", area: "central", tags: ["cultural", "hidden_gems", "solo", "chill"], price: "low", bestTime: "day", bookingRequired: false, desc: "Egyptian sarcophagi and Hogarth originals in the architect's former home.", emoji: "🏛️", travelZone: "central" },
  { id: "v19", name: "Barbican Conservatory", type: "cultural", area: "central", tags: ["chill", "aesthetic", "hidden_gems", "romantic"], price: "low", bestTime: "day", bookingRequired: false, desc: "Tropical greenhouse inside a Brutalist masterpiece. Open Sundays.", emoji: "🌴", travelZone: "central" },
  { id: "v20", name: "Dennis Severs' House", type: "experience", area: "east", tags: ["romantic", "cultural", "hidden_gems", "immersive"], price: "mid", bestTime: "night", bookingRequired: true, desc: "Spitalfields townhouse frozen in 1724. Walk through ten rooms imagining the family just left.", emoji: "🕰️", travelZone: "east" },
  { id: "v21", name: "Beigel Bake", type: "cafe", area: "east", tags: ["chill", "hidden_gems", "social", "iconic"], price: "low", bestTime: "day,night", bookingRequired: false, desc: "Brick Lane's 24/7 legend. Salt beef beigel for £4. Non-negotiable if you're east.", emoji: "🥯", travelZone: "east" },
  { id: "v22", name: "Clove Club", type: "restaurant", area: "east", tags: ["fancy", "cultural", "foodie", "aesthetic"], price: "high", bestTime: "night", bookingRequired: true, desc: "One of Britain's finest tasting menus. The buttermilk fried chicken snack alone is worth it.", emoji: "✨", travelZone: "east" },
  { id: "v23", name: "Brilliant Corners", type: "bar", area: "east", tags: ["chill", "cultural", "hidden_gems", "underground"], price: "mid", bestTime: "night", bookingRequired: false, desc: "Dalston's audiophile jazz bar. Sound system that costs more than a flat.", emoji: "🎵", travelZone: "east" },
  { id: "v24", name: "Fabric", type: "event", area: "central", tags: ["chaotic", "social", "underground", "night"], price: "mid", bestTime: "night", bookingRequired: false, desc: "Farringdon institution that survived the ban and came back harder. Still electric.", emoji: "💿", travelZone: "central" },
  { id: "v25", name: "Ronnie Scott's", type: "event", area: "central", tags: ["romantic", "cultural", "fancy", "iconic"], price: "mid", bestTime: "night", bookingRequired: true, desc: "Soho's legendary jazz club since 1959. Book a table, stay for both sets.", emoji: "🎺", travelZone: "central" },
  { id: "v26", name: "Peckham Levels", type: "bar", area: "south", tags: ["chaotic", "social", "hidden_gems", "aesthetic"], price: "low", bestTime: "night", bookingRequired: false, desc: "Multi-storey car park turned arts space. Rooftop views of the London skyline.", emoji: "🌇", travelZone: "south" },
  { id: "v27", name: "40 Maltby Street", type: "restaurant", area: "south", tags: ["chill", "foodie", "hidden_gems", "cultural"], price: "mid", bestTime: "day,night", bookingRequired: false, desc: "Wine warehouse with a tiny kitchen. Natural wine merchants who cook brilliantly.", emoji: "🍾", travelZone: "south" },
  { id: "v28", name: "Towpath Cafe", type: "cafe", area: "east", tags: ["chill", "solo", "outdoor", "hidden_gems"], price: "low", bestTime: "day", bookingRequired: false, desc: "Canal-side café open seasonally. Queue is long. Scrambled eggs worth it.", emoji: "🛶", travelZone: "east" },
  { id: "v29", name: "The Marksman", type: "bar", area: "east", tags: ["chill", "foodie", "hidden_gems"], price: "mid", bestTime: "day,night", bookingRequired: false, desc: "Hackney Road's gastropub done right. Rotisserie chickens, great ales, no tourists.", emoji: "🍺", travelZone: "east" },
  { id: "v30", name: "Sketch", type: "restaurant", area: "central", tags: ["fancy", "aesthetic", "romantic", "luxury"], price: "high", bestTime: "day,night", bookingRequired: true, desc: "Three Michelin-starred rooms in Mayfair, each more surreal than the last.", emoji: "🩷", travelZone: "central" },
  { id: "v31", name: "Smoking Goat", type: "restaurant", area: "east", tags: ["chaotic", "foodie", "social", "hidden_gems"], price: "mid", bestTime: "night", bookingRequired: false, desc: "Thai BBQ in Shoreditch. Low-lit, loud music, extraordinary food.", emoji: "🐐", travelZone: "east" },
  { id: "v32", name: "Kiln", type: "restaurant", area: "central", tags: ["chaotic", "foodie", "social"], price: "mid", bestTime: "night", bookingRequired: false, desc: "Northern Thai at the counter watching the kiln. No bookings, queue early.", emoji: "🌶️", travelZone: "central" },
  { id: "v33", name: "Kew Gardens", type: "outdoor", area: "west", tags: ["chill", "romantic", "outdoor", "aesthetic"], price: "mid", bestTime: "day", bookingRequired: false, desc: "UNESCO World Heritage site. 300 acres of botanical wonder.", emoji: "🌺", travelZone: "west" },
  { id: "v34", name: "The River Café", type: "restaurant", area: "west", tags: ["fancy", "romantic", "iconic", "luxury"], price: "high", bestTime: "day,night", bookingRequired: true, desc: "Ruth Rogers' Hammersmith landmark. Riverside terrace, wood-fired oven.", emoji: "🌊", travelZone: "west" },
  { id: "v35", name: "Coupette", type: "bar", area: "east", tags: ["fancy", "hidden_gems", "romantic"], price: "mid", bestTime: "night", bookingRequired: false, desc: "Bethnal Green's Calvados cocktail bar. Tiny, precise, French-accented.", emoji: "🍎", travelZone: "east" },
  { id: "v36", name: "Dalston Superstore", type: "bar", area: "east", tags: ["chaotic", "social", "underground", "night"], price: "low", bestTime: "night", bookingRequired: false, desc: "Queer bar and club in Dalston. Two floors, brilliant DJs, no attitude.", emoji: "🏳️‍🌈", travelZone: "east" },
  { id: "v37", name: "Rovi", type: "restaurant", area: "central", tags: ["chill", "foodie", "aesthetic", "romantic"], price: "high", bestTime: "night", bookingRequired: true, desc: "Ottolenghi's open fire vegetable restaurant. Counter seats watching the flames.", emoji: "🥕", travelZone: "central" },
  { id: "v38", name: "Bocca di Lupo", type: "restaurant", area: "central", tags: ["romantic", "foodie", "cultural", "iconic"], price: "high", bestTime: "night", bookingRequired: true, desc: "Soho's finest Italian. Counter seating watching the kitchen. Regional Italian rarities.", emoji: "🐺", travelZone: "central" },
  { id: "v39", name: "Goddard & Gibbs", type: "restaurant", area: "east", tags: ["chill", "foodie", "aesthetic", "hidden_gems"], price: "mid", bestTime: "day,night", bookingRequired: false, desc: "Shoreditch's best oyster and champagne bar in a converted workshop.", emoji: "🦪", travelZone: "east" },
  { id: "v40", name: "Brawn", type: "restaurant", area: "east", tags: ["chill", "foodie", "cultural", "hidden_gems"], price: "mid", bestTime: "night", bookingRequired: true, desc: "Columbia Road restaurant with the best natural wine list in east London.", emoji: "🍷", travelZone: "east" },
  { id: "v41", name: "The Glory", type: "bar", area: "east", tags: ["chaotic", "social", "underground"], price: "low", bestTime: "night", bookingRequired: false, desc: "Haggerston's drag and cabaret pub. Weekly shows, total madness in the best way.", emoji: "🎪", travelZone: "east" },
  { id: "v42", name: "V&A Museum", type: "museum", area: "west", tags: ["cultural", "aesthetic", "romantic", "iconic"], price: "low", bestTime: "day", bookingRequired: false, desc: "The greatest decorative arts museum on earth. Always free.", emoji: "🏺", travelZone: "west" },
  { id: "v43", name: "Leighton House", type: "museum", area: "west", tags: ["cultural", "aesthetic", "romantic", "hidden_gems"], price: "low", bestTime: "day", bookingRequired: false, desc: "Victorian artist's studio. The Arab Hall with 1000 Iznik tiles is one of London's most beautiful rooms.", emoji: "🕌", travelZone: "west" },
  { id: "v44", name: "Rich Mix Cinema", type: "event", area: "east", tags: ["chill", "cultural", "solo"], price: "low", bestTime: "night", bookingRequired: true, desc: "Brick Lane's indie cinema. Great programming, zero pretension.", emoji: "🎬", travelZone: "east" },
  { id: "v45", name: "Fold", type: "event", area: "east", tags: ["chaotic", "social", "underground", "night"], price: "mid", bestTime: "night", bookingRequired: true, desc: "Canning Town warehouse club with the best sound system east of Berlin.", emoji: "🔊", travelZone: "east" },
];

const ZONE_MAP = {
  "Mayfair": "West", "Chelsea": "West", "Kensington": "West", "Notting Hill": "West",
  "Hammersmith": "West", "Fulham": "West", "Knightsbridge": "West", "Shepherd's Bush": "West",
  "Chiswick": "West", "Holland Park": "West", "Hampstead": "Northwest", "Kilburn": "Northwest",
  "Queen's Park": "Northwest", "Maida Vale": "Northwest", "St John's Wood": "Northwest",
  "Swiss Cottage": "Northwest", "Wembley": "Northwest", "Islington": "North", "Camden": "North",
  "Highgate": "North", "Finsbury Park": "North", "Archway": "North", "Kentish Town": "North",
  "Crouch End": "North", "Muswell Hill": "North", "Holloway": "North", "Dalston": "Northeast",
  "Hackney": "Northeast", "Clapton": "Northeast", "Walthamstow": "Northeast", "Leyton": "Northeast",
  "Tottenham": "Northeast", "Wood Green": "Northeast", "Stoke Newington": "Northeast",
  "Shoreditch": "East", "Bethnal Green": "East", "Bow": "East", "Stratford": "East",
  "Canary Wharf": "East", "Whitechapel": "East", "Mile End": "East", "Poplar": "East",
  "Limehouse": "East", "Soho": "Central", "Covent Garden": "Central", "Fitzrovia": "Central",
  "Bloomsbury": "Central", "Clerkenwell": "Central", "The City": "Central", "Holborn": "Central",
  "Marylebone": "Central", "Westminster": "Central", "Piccadilly": "Central",
  "Elephant and Castle": "South", "Kennington": "South", "Stockwell": "South", "Vauxhall": "South",
  "Putney": "Southwest", "Battersea": "Southwest", "Clapham": "Southwest", "Brixton": "Southwest",
  "Balham": "Southwest", "Tooting": "Southwest", "Wandsworth": "Southwest", "Richmond": "Southwest",
  "Wimbledon": "Southwest", "Kingston": "Southwest", "Peckham": "Southeast", "Bermondsey": "Southeast",
  "London Bridge": "Southeast", "Borough": "Southeast", "Camberwell": "Southeast",
  "Dulwich": "Southeast", "Greenwich": "Southeast", "Deptford": "Southeast", "New Cross": "Southeast",
  "Lewisham": "Southeast",
};

const AREA_ZONES = { central: ["central"], east: ["east"], south: ["south"], west: ["west"], north: ["north"], southwest: ["southwest"], northwest: ["northwest"], outskirts: ["outskirts"], anywhere: ["central", "east", "south", "west", "north", "southwest", "northwest", "northeast", "southeast"] };
const VIBE_TAG_MAP = { chill: ["chill", "outdoor", "solo"], romantic: ["romantic", "aesthetic", "luxury"], chaotic: ["chaotic", "social", "underground", "night"], cultural: ["cultural", "iconic"], fancy: ["fancy", "luxury", "iconic"], hidden_gems: ["hidden_gems", "underground"], social: ["social", "chaotic"], solo: ["solo", "chill", "cultural"], creative: ["cultural", "aesthetic", "hidden_gems"], activity: ["outdoor", "social", "chaotic"], active: ["outdoor", "chill", "social"] };
const BUDGET_KEY_MAP = { "£10–£30": "low", "£30–£50": "mid", "£50–£80": "high", "£80+": "unlimited" };
const STOP_ORDER = { day: ["cafe", "walk", "outdoor", "museum", "gallery", "market", "experience", "restaurant"], night: ["restaurant", "bar", "event"], full: ["cafe", "walk", "outdoor", "museum", "restaurant", "bar", "event"] };

const ZONES = ["North", "Northwest", "Northeast", "South", "Southwest", "Southeast", "East", "West", "Central", "Outskirts"];

function scoreVenue(v, vibes, budget, timeOfDay, extras, groupSize, energy, venueRatings) {
  let score = 0;
  const BUDGET_PRICE_MAP = { low: ["low","Free","Under £15pp"], mid: ["low","mid","Free","Under £15pp","£15-35pp"], high: ["low","mid","high","Free","Under £15pp","£15-35pp","£35-70pp"], unlimited: ["low","mid","high","Free","Under £15pp","£15-35pp","£35-70pp","£70pp+"] };
  const prices = BUDGET_PRICE_MAP[budget] || ["low","mid","high"];
  const vPrice = v.price || "mid";
  if (!prices.some(p => vPrice.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(vPrice.toLowerCase()))) return -1;
  const tod = timeOfDay === "full" ? "day,night" : timeOfDay;
  if (v.bestTime && !v.bestTime.split(",").some(t => tod.split(",").includes(t))) return -1;
  const wt = vibes.flatMap(vb => VIBE_TAG_MAP[vb] || [vb]);
  score += (v.tags || []).filter(t => wt.includes(t)).length * 3;
  if (extras.includes("food") && ["restaurant","cafe"].includes(v.type)) score += 4;
  if (extras.includes("drinks") && v.type === "bar") score += 4;
  if (extras.includes("outdoor") && (v.tags || []).includes("outdoor")) score += 3;
  if (extras.includes("social") && (v.tags || []).includes("social")) score += 3;
  if (extras.includes("scenic_walk") && v.type === "walk") score += 4;
  if (extras.includes("nature_trails") && v.type === "walk" && (v.tags || []).includes("active")) score += 6;
  if (extras.includes("plant_friendly") && v.plantFriendly) score += 6;
  // Energy: high → boost chaotic/social venues, low → boost chill/solo
  if (energy === "high") { score += (v.tags || []).filter(t => ["chaotic","social","night","underground"].includes(t)).length * 2; }
  if (energy === "low") { score += (v.tags || []).filter(t => ["chill","solo","outdoor"].includes(t)).length * 2; }
  // Group size: large groups → boost social/walk-in venues, solo → boost solo/chill
  if (groupSize === "large") { score += (v.tags || []).filter(t => ["social","chaotic"].includes(t)).length * 2; if (!v.bookingRequired) score += 2; }
  if (groupSize === "solo") { score += (v.tags || []).filter(t => ["solo","chill","cultural"].includes(t)).length * 2; }
  // Boost/demote based on user review ratings
  if (venueRatings && venueRatings[v.name]) { score += (venueRatings[v.name] - 3) * 2; }
  return score;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function buildShortlist(answers, dbVenues = [], venueRatings = {}) {
  const { vibes, area, timeOfDay, extras, groupSize, energy } = answers;
  const budget = BUDGET_KEY_MAP[answers.budget] || answers.budget || "mid";
  const isSurprise = area === "surprise_me";

  const allVenues = dbVenues.map(v => ({
    id: v.id, name: v.name, type: v.category || "experience",
    tags: v.vibe_tags || [], price: v.price || "mid",
    bestTime: "day,night", bookingRequired: false, desc: v.comment || "",
    emoji: "✨", travelZone: (v.zone || "Central").toLowerCase(),
    google_rating: v.google_rating,
    plantFriendly: v.plant_friendly || false,
    lat: v.lat ? parseFloat(v.lat) : null,
    lng: v.lng ? parseFloat(v.lng) : null,
  }));
  const source = allVenues.length > 0 ? allVenues : VENUES;

  // ── MAP PIN MODE: filter strictly by 1.5km radius ────────────
  if (area === "map_pin" && answers.mapPin) {
    const { lat: pinLat, lng: pinLng } = answers.mapPin;
    const nearby = source
      .filter(v => v.lat && v.lng && haversineKm(pinLat, pinLng, v.lat, v.lng) <= 1.5)
      .map(v => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings) }))
      .filter(v => v.score >= 0)
      .sort((a, b) => b.score - a.score);
    const types = STOP_ORDER[timeOfDay] || STOP_ORDER.night;
    const used = new Set(), usedTypes = {}, shortlist = [];
    for (const t of types) {
      const c = nearby.filter(v => v.type === t && !used.has(v.id) && (usedTypes[t] || 0) < 2);
      if (c[0]) { shortlist.push(c[0]); used.add(c[0].id); usedTypes[t] = (usedTypes[t] || 0) + 1; }
    }
    while (shortlist.length < 4) { const n = nearby.find(v => !used.has(v.id)); if (!n) break; shortlist.push(n); used.add(n.id); }
    return { venues: shortlist.slice(0, 6), zone: "map_pin" };
  }

  // ── SURPRISE ME: vibe-matched zone → best anchor → 1.5km radius ──
  if (isSurprise) {
    const withCoords = source.filter(v => v.lat && v.lng);
    if (withCoords.length >= 3) {
      // Score each zone by how well its venues match the user's vibes
      const zoneScores = {};
      withCoords.forEach(v => {
        const s = scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings);
        if (s >= 0) {
          if (!zoneScores[v.travelZone]) zoneScores[v.travelZone] = { total: 0, count: 0 };
          zoneScores[v.travelZone].total += s;
          zoneScores[v.travelZone].count += 1;
        }
      });
      // Pick from zones with 3+ matching venues, weighted by average score
      const scoredZones = Object.entries(zoneScores)
        .filter(([, d]) => d.count >= 3)
        .map(([z, d]) => ({ zone: z, avg: d.total / d.count, count: d.count }))
        .sort((a, b) => b.avg - a.avg);
      // Pick randomly from top 3 best-matching zones for variety
      const topZones = scoredZones.slice(0, 3);
      const chosenZone = topZones.length > 0 ? topZones[Math.floor(Math.random() * topZones.length)].zone : "central";
      // Find best anchor venue in that zone (highest individual score)
      const zoneVenues = withCoords
        .filter(v => v.travelZone === chosenZone)
        .map(v => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings) }))
        .filter(v => v.score >= 0)
        .sort((a, b) => b.score - a.score);
      const anchor = zoneVenues[0] || withCoords.find(v => v.travelZone === chosenZone);
      if (anchor) {
        const nearby = source
          .filter(v => v.lat && v.lng && haversineKm(anchor.lat, anchor.lng, v.lat, v.lng) <= 1.5)
          .map(v => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings) }))
          .filter(v => v.score >= 0)
          .sort((a, b) => b.score - a.score);
        const types = STOP_ORDER[timeOfDay] || STOP_ORDER.night;
        const used = new Set(), usedTypes = {}, shortlist = [];
        for (const t of types) {
          const c = nearby.filter(v => v.type === t && !used.has(v.id) && (usedTypes[t] || 0) < 2);
          if (c[0]) { shortlist.push(c[0]); used.add(c[0].id); usedTypes[t] = (usedTypes[t] || 0) + 1; }
        }
        while (shortlist.length < 4) { const n = nearby.find(v => !used.has(v.id)); if (!n) break; shortlist.push(n); used.add(n.id); }
        if (shortlist.length >= 3) return { venues: shortlist.slice(0, 6), zone: chosenZone };
      }
    }
  }

  // ── CHAIN MODE with relaxation cascade ─────────────────────
  // Pick best anchor, then chain: each next venue within radius of previous
  // Cascade: full filters → relax vibe → relax budget → expand to 2km
  let targetZone = area;

  const NEIGHBOURS = { central:["central","east","south"], east:["east","northeast","central"], south:["south","southeast","southwest"], west:["west","northwest","southwest"], north:["north","northeast","northwest"], southwest:["southwest","west","south"], northwest:["northwest","north","west"], northeast:["northeast","east","north"], southeast:["southeast","south","east"] };
  let zoneFiltered = source.filter(v => v.travelZone === (targetZone || "").toLowerCase());
  if (zoneFiltered.length < 4) {
    const nl = NEIGHBOURS[(targetZone || "").toLowerCase()] || [(targetZone || "").toLowerCase()];
    zoneFiltered = source.filter(v => nl.includes(v.travelZone));
  }
  if (zoneFiltered.length < 3) zoneFiltered = source;

  const withCoords = zoneFiltered.filter(v => v.lat && v.lng);

  // Find best anchor: highest scoring venue with coordinates
  const scoredAll = withCoords.map(v => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings) }))
    .filter(v => v.score >= 0).sort((a, b) => b.score - a.score);

  const userStops = answers.stops === "5+" ? 5 : parseInt(answers.stops) || (timeOfDay === "full" ? 5 : 4);
  const targetStops = userStops;
  const types = STOP_ORDER[timeOfDay] || STOP_ORDER.night;

  function chainBuild(anchor, pool, radius) {
    const used = new Set([anchor.id]), shortlist = [anchor], usedTypes = { [anchor.type]: 1 };
    let lastVenue = anchor;
    for (let i = 0; i < targetStops - 1; i++) {
      // Try each cascade level
      let next = null;
      for (const level of ["strict", "relax_vibe", "relax_budget", "expand_radius"]) {
        const r = level === "expand_radius" ? 2.0 : radius;
        const candidates = pool.filter(v => {
          if (used.has(v.id) || !v.lat || !v.lng) return false;
          if (haversineKm(lastVenue.lat, lastVenue.lng, v.lat, v.lng) > r) return false;
          return true;
        }).map(v => {
          let s = 0;
          if (level === "strict") {
            s = scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings);
            if (s < 0) return null;
          } else if (level === "relax_vibe") {
            s = scoreVenue(v, [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy);
            if (s < 0) return null;
            s += (v.tags || []).length;
          } else if (level === "relax_budget") {
            s = (v.tags || []).length * 2;
            const tod = timeOfDay === "full" ? "day,night" : timeOfDay;
            if (v.bestTime && !v.bestTime.split(",").some(t => tod.split(",").includes(t))) return null;
          } else {
            s = (v.tags || []).length;
          }
          // Prefer type diversity
          const t = v.type;
          if (!usedTypes[t]) s += 3;
          else if (usedTypes[t] < 2) s += 1;
          // Prefer types in the STOP_ORDER
          if (types.includes(t)) s += 2;
          return { ...v, score: s };
        }).filter(Boolean).sort((a, b) => b.score - a.score);

        if (candidates.length > 0) { next = candidates[0]; break; }
      }
      if (!next) break;
      shortlist.push(next);
      used.add(next.id);
      usedTypes[next.type] = (usedTypes[next.type] || 0) + 1;
      lastVenue = next;
    }
    return shortlist;
  }

  // Try top 5 anchors and pick the chain that produces the most stops
  let bestChain = [];
  for (const anchor of scoredAll.slice(0, 5)) {
    const chain = chainBuild(anchor, zoneFiltered, 1.5);
    if (chain.length > bestChain.length) bestChain = chain;
    if (bestChain.length >= targetStops) break;
  }

  // Fallback: if chain mode produced too few, try from full source
  if (bestChain.length < 3 && scoredAll.length > 0) {
    const chain = chainBuild(scoredAll[0], source, 2.0);
    if (chain.length > bestChain.length) bestChain = chain;
  }

  // Last resort: non-geo scored list
  if (bestChain.length < 3) {
    const scored = zoneFiltered.map(v => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", timeOfDay || "night", extras || [], groupSize, energy, venueRatings) }))
      .filter(v => v.score >= 0).sort((a, b) => b.score - a.score);
    bestChain = scored.slice(0, targetStops);
  }

  return { venues: bestChain.slice(0, 6), zone: targetZone };
}

const QUESTIONS = [
  { id: "timeOfDay", label: "1 of 9", title: "Day out or night out?", multi: false, options: [{ value: "day", label: "Day plan", emoji: "☀️" }, { value: "night", label: "Night plan", emoji: "🌙" }, { value: "full", label: "Full day + night", emoji: "🌅" }] },
  { id: "vibes", label: "2 of 9", title: "Pick your vibe", multi: true, options: [{ value: "chill", label: "Chill", emoji: "😌" }, { value: "romantic", label: "Romantic", emoji: "🌹" }, { value: "chaotic", label: "Chaotic fun", emoji: "🌀" }, { value: "cultural", label: "Cultural", emoji: "🏛️" }, { value: "fancy", label: "Fancy", emoji: "🥂" }, { value: "hidden_gems", label: "Hidden gems", emoji: "💎" }, { value: "social", label: "Social", emoji: "🎉" }, { value: "solo", label: "Solo reset", emoji: "🧘" }, { value: "creative", label: "Creative", emoji: "🎨" }, { value: "activity", label: "Activity-based", emoji: "🎯" }, { value: "active", label: "Active", emoji: "🏃" }] },
  { id: "area", label: "3 of 9", title: "Any area preference?", multi: false, options: [{ value: "central", label: "Central", emoji: "🎭" }, { value: "east", label: "East", emoji: "🧱" }, { value: "south", label: "South", emoji: "🌉" }, { value: "west", label: "West", emoji: "🌳" }, { value: "north", label: "North", emoji: "🌲" }, { value: "southwest", label: "Southwest", emoji: "🏡" }, { value: "northwest", label: "Northwest", emoji: "🌿" }, { value: "outskirts", label: "Outskirts", emoji: "🚂" }, { value: "surprise_me", label: "Surprise me", emoji: "🎲" }, { value: "map_pin", label: "Pick on map", emoji: "📍" }] },
  { id: "stops", label: "4 of 9", title: "How many stops?", multi: false, options: [{ value: "2", label: "2 stops", emoji: "✌️" }, { value: "3", label: "3 stops", emoji: "🎯" }, { value: "4", label: "4 stops", emoji: "🔥" }, { value: "5+", label: "5+ stops", emoji: "🚀" }] },
  { id: "travel", label: "5 of 9", title: "How do you want to get around?", multi: false, options: [{ value: "walking", label: "Walking only", emoji: "🚶" }, { value: "walk_tube", label: "Walk + tube", emoji: "🚇" }, { value: "max10", label: "Max 10 min each stop", emoji: "⚡" }] },
  { id: "budget", label: "6 of 9", title: "What's your total budget per person?", multi: false, options: [{ value: "£10–£30", label: "£10–£30", emoji: "💸" }, { value: "£30–£50", label: "£30–£50", emoji: "💳" }, { value: "£50–£80", label: "£50–£80", emoji: "✨" }, { value: "£80+", label: "£80+", emoji: "🚀" }] },
  { id: "groupSize", label: "7 of 9", title: "Who's coming?", multi: false, options: [{ value: "solo", label: "Just me", emoji: "🙋" }, { value: "duo", label: "Two of us", emoji: "👫" }, { value: "small", label: "3–5 people", emoji: "👯" }, { value: "large", label: "5+ crew", emoji: "🎊" }] },
  { id: "energy", label: "8 of 9", title: "Energy level today?", multi: false, options: [{ value: "low", label: "Low & breezy", emoji: "🌿" }, { value: "medium", label: "Up for it", emoji: "⚡" }, { value: "high", label: "Max chaos", emoji: "🔥" }] },
  { id: "extras", label: "9 of 9", title: "Must-haves?", multi: true, options: [{ value: "food", label: "Food included", emoji: "🍜" }, { value: "drinks", label: "Drinks/bars", emoji: "🍸" }, { value: "outdoor", label: "Outdoor spaces", emoji: "🌳" }, { value: "social", label: "Meet people", emoji: "🤝" }, { value: "scenic_walk", label: "Scenic walk", emoji: "🚶" }, { value: "nature_trails", label: "Nature trails", emoji: "🌿" }, { value: "plant_friendly", label: "Plant-friendly food", emoji: "🌱" }] },
];

const ALL_AREAS = Object.keys({
  "Mayfair": 1, "Chelsea": 1, "Kensington": 1, "Notting Hill": 1, "Hammersmith": 1, "Fulham": 1,
  "Knightsbridge": 1, "Shepherd's Bush": 1, "Chiswick": 1, "Holland Park": 1, "Hampstead": 1,
  "Kilburn": 1, "Queen's Park": 1, "Maida Vale": 1, "St John's Wood": 1, "Swiss Cottage": 1,
  "Wembley": 1, "Islington": 1, "Camden": 1, "Highgate": 1, "Finsbury Park": 1, "Archway": 1,
  "Kentish Town": 1, "Crouch End": 1, "Muswell Hill": 1, "Holloway": 1, "Dalston": 1,
  "Hackney": 1, "Clapton": 1, "Walthamstow": 1, "Leyton": 1, "Tottenham": 1, "Wood Green": 1,
  "Stoke Newington": 1, "Shoreditch": 1, "Bethnal Green": 1, "Bow": 1, "Stratford": 1,
  "Canary Wharf": 1, "Whitechapel": 1, "Mile End": 1, "Poplar": 1, "Limehouse": 1,
  "Soho": 1, "Covent Garden": 1, "Fitzrovia": 1, "Bloomsbury": 1, "Clerkenwell": 1,
  "The City": 1, "Holborn": 1, "Marylebone": 1, "Westminster": 1, "Piccadilly": 1,
  "Elephant and Castle": 1, "Kennington": 1, "Stockwell": 1, "Vauxhall": 1, "Putney": 1,
  "Battersea": 1, "Clapham": 1, "Brixton": 1, "Balham": 1, "Tooting": 1, "Wandsworth": 1,
  "Richmond": 1, "Wimbledon": 1, "Kingston": 1, "Peckham": 1, "Bermondsey": 1,
  "London Bridge": 1, "Borough": 1, "Camberwell": 1, "Dulwich": 1, "Greenwich": 1,
  "Deptford": 1, "New Cross": 1, "Lewisham": 1, "Crystal Palace": 1, "Herne Hill": 1,
  "Nunhead": 1, "Brockley": 1, "Forest Hill": 1, "Sydenham": 1,
});

const LOADS = ["Raiding our database...", "Matching your vibe to venues...", "Checking geographic flow...", "Building your perfect sequence...", "Final polish..."];

const PREF_OPTIONS = ["Restaurants", "Bars", "Hidden gems", "Outdoor", "Culture", "Markets", "Events", "Late night", "Brunch", "Fine dining", "Plant based", "Arts & crafts", "Active"];
const ADMIN_EMAIL = "jahnvisolanki2412@gmail.com";

function generateId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

async function callClaude(prompt, maxTokens = 1000) {
  let resp;
  try {
    resp = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      }),
    });
  } catch (e) {
    throw new Error("Our AI is taking a break — try again in a moment.");
  }
  if (resp.status >= 500) throw new Error("Our AI is taking a break — try again in a moment.");
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "Something went wrong with the AI — please try again.");
  }
  const data = await resp.json();
  const txt = data.content?.find(b => b.type === "text")?.text || "";
  return txt.replace(/```json|```/g, "").trim();
}

// Tolerant JSON parse for model output: strips fences/prose, extracts the JSON
// array/object, and repairs common issues (trailing commas, single quotes,
// smart quotes). Returns null instead of throwing so one bad image can't kill a batch.
function safeJsonParse(text) {
  if (!text) return null;
  let t = String(text).replace(/```json|```/g, "").trim();
  try { return JSON.parse(t); } catch (e) {}
  const fa = t.indexOf("["), fo = t.indexOf("{");
  let start = -1, close = "}";
  if (fa !== -1 && (fo === -1 || fa < fo)) { start = fa; close = "]"; }
  else if (fo !== -1) { start = fo; close = "}"; }
  if (start === -1) return null;
  const end = t.lastIndexOf(close);
  if (end <= start) return null;
  let sub = t.slice(start, end + 1);
  const attempts = [
    sub,
    sub.replace(/,\s*([}\]])/g, "$1"),                                   // trailing commas
    sub.replace(/,\s*([}\]])/g, "$1").replace(/[“”]/g, '"').replace(/[‘’]/g, "'"), // smart quotes
  ];
  for (const a of attempts) { try { return JSON.parse(a); } catch (e) {} }
  return null;
}

// Downscale + JPEG-compress an image file so the /api/claude payload stays
// under Vercel's ~4.5MB request limit (large phone screenshots otherwise fail).
async function fileToDownscaledBase64(file, maxDim = 1280, quality = 0.8) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't read the image file."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("That file doesn't look like a valid image."));
    im.src = dataUrl;
  });
  let { width, height } = img;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);
  return { base64: canvas.toDataURL("image/jpeg", quality).split(",")[1], mediaType: "image/jpeg" };
}

// ── STYLES ───────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Aleo:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Sofia&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  button { color: #1c1c1a; font-family: inherit; -webkit-tap-highlight-color: transparent; }
  body { font-family: 'Aleo', -apple-system, sans-serif; background: #fbfaf8; color: #1c1c1a; min-height: 100vh; overflow-x: hidden; }
  .app { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #fbfaf8; padding-bottom: 80px; position: relative; }

  .shapes-wrap { position: absolute; top: 0; right: -20px; width: 220px; height: 260px; pointer-events: none; z-index: 0; }
  .shape-circle { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; animation: spin-cw 14s linear infinite; }
  .shape-teal { width: 130px; height: 130px; background: #726A4E; top: 0; right: 40px; animation-duration: 16s; }
  .shape-yellow { width: 160px; height: 160px; background: #DD4124; top: 80px; right: -10px; animation-duration: 20s; }
  .shape-cream { width: 80px; height: 80px; background: #F7EFD4; top: 150px; right: 140px; animation-duration: 12s; }
  .inner-oval { width: 56px; height: 32px; background: #DFEF87; border-radius: 50%; animation: spin-cw 8s linear infinite; }
  .inner-starburst { animation: spin-cw 6s linear infinite; }
  .inner-star4 { animation: spin-cw 10s linear infinite; }
  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @media (prefers-reduced-motion: reduce) {
    .shape-circle, .inner-oval, .inner-starburst, .inner-star4 { animation: none; }
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cardSwap { from{opacity:0.25;transform:scale(0.985)} to{opacity:1;transform:scale(1)} }
  @keyframes twinkle { 0%,100%{opacity:0.12;transform:scale(0.6) rotate(0deg)} 50%{opacity:1;transform:scale(1.15) rotate(20deg)} }
  @keyframes loaderPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes tapPulse { 0%{transform:scale(1)} 35%{transform:scale(0.95)} 100%{transform:scale(1)} }
  @keyframes burstIn { 0%{transform:scale(0);opacity:0} 55%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }

  .home-hero { padding: 3.5rem 1.5rem 2rem; position: relative; overflow: hidden; min-height: 300px; background: #fbfaf8; }
  .home-eyebrow { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8f7a; margin-bottom: 0.6rem; position: relative; z-index: 1; }
  .home-title { font-family: 'Aleo', Georgia, serif; font-size: 3rem; font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #1c1c1a; margin-bottom: 0.75rem; position: relative; z-index: 1; }
  .home-title em { font-style: italic; color: #726A4E; }
  .home-sub { font-size: 0.85rem; color: #6b5e4e; line-height: 1.5; position: relative; z-index: 1; max-width: 200px; }
  .home-cta { margin-top: 1.5rem; position: relative; z-index: 1; }

  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; background: rgba(247,246,242,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid rgba(0,0,0,0.06); display: flex; z-index: 100; padding-bottom: env(safe-area-inset-bottom); }
  .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 9px 2px 7px; border: none; background: none; cursor: pointer; gap: 4px; transition: all 0.15s; }
  .nav-tab-icon { display: flex; align-items: center; justify-content: center; line-height: 1; transition: all 0.18s; color: #9b8f7a; padding: 5px 13px; border-radius: 100px; }
  .nav-tab.active .nav-tab-icon { color: #fff; background: #1c1c1a; }
  .nav-tab-label { font-family: 'Aleo', sans-serif; font-size: 0.58rem; font-weight: 500; letter-spacing: 0.03em; color: #9b8f7a; text-transform: uppercase; transition: color 0.15s; }
  .nav-tab.active .nav-tab-label { color: #1c1c1a; font-weight: 700; }
  .nav-tab-dot { display: none; }
  .capture-fab { position: fixed; z-index: 110; bottom: calc(74px + env(safe-area-inset-bottom)); right: max(18px, calc(50% - 210px + 18px)); width: 56px; height: 56px; border-radius: 50%; border: none; background: #1c1c1a; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,0.28); transition: transform 0.12s, box-shadow 0.12s; }
  .capture-fab:active { transform: scale(0.92); }

  .section-pad { padding: 1.5rem; }
  .section-title { font-family: 'Aleo', Georgia, serif; font-size: 1.4rem; font-weight: 400; color: #1c1c1a; margin-bottom: 0.25rem; }
  .section-sub { font-size: 0.8rem; color: #9b8f7a; margin-bottom: 1.25rem; line-height: 1.4; }
  .divider { height: 1px; background: #e8e2d8; margin: 0 1.5rem; }

  .btn { width: 100%; padding: 14px; border-radius: 100px; border: none; background: #1c1c1a; color: #ffffff; font-family: 'Aleo', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em; }
  .btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.88; }
  .btn:active:not(:disabled) { transform: scale(0.96); }
  .btn-teal { background: #726A4E; color: #ffffff; }
  .btn-outline { width: 100%; padding: 13px; border-radius: 100px; border: 1.5px solid #ddd8ce; background: transparent; color: #4a4438; font-family: 'Aleo', sans-serif; font-size: 0.85rem; cursor: pointer; margin-top: 0.6rem; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
  .btn-outline:hover { border-color: #1c1c1a; color: #1c1c1a; }
  .btn-ghost { background: none; border: none; color: #9b8f7a; font-family: 'Aleo', sans-serif; font-size: 0.82rem; cursor: pointer; padding: 1rem 1.5rem 0; display: flex; align-items: center; gap: 5px; }
  .btn-ghost:hover { color: #1c1c1a; }

  .chip { padding: 9px 16px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-family: 'Aleo', sans-serif; font-size: 0.85rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: flex; align-items: center; gap: 6px; user-select: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .chip:hover { border-color: #b8ac9a; }
  .chip:active { transform: scale(0.93); }
  .chip.sel { background: #1c1c1a; color: #ffffff; border-color: #1c1c1a; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .btn-outline:active { transform: scale(0.96); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }

  .card { background: #fff; border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.4rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }

  .q-label { font-size: 0.68rem; font-weight: 500; color: #b8ac9a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem; }
  .q-title { font-family: 'Aleo', Georgia, serif; font-size: 1.6rem; line-height: 1.2; color: #1c1c1a; margin-bottom: 1.5rem; }
  .progress-label { font-size: 0.68rem; color: #b8ac9a; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .progress-bg { height: 2px; background: #e8e2d8; border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: #726A4E; border-radius: 2px; transition: width 0.4s ease; }
  .time-row { display: flex; gap: 10px; }
  .time-wrap { flex: 1; }
  .time-wrap label { font-size: 0.68rem; color: #9b8f7a; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 6px; }
  .time-wrap input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'Aleo', sans-serif; font-size: 0.9rem; }
  .time-wrap input:focus { outline: none; border-color: #726A4E; }

  .loading { display: flex; flex-direction: column; align-items: center; padding: 5rem 2rem; text-align: center; }
  .loading-ring { width: 44px; height: 44px; border: 2.5px solid #e8e2d8; border-top-color: #726A4E; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem; }
  .loading-title { font-family: 'Aleo', Georgia, serif; font-size: 1.3rem; color: #1c1c1a; margin-bottom: 0.4rem; }
  .loading-sub { font-size: 0.82rem; color: #9b8f7a; }

  .result-hero { padding: 2rem 1.5rem 1.5rem; border-bottom: 1px solid #e8e2d8; animation: fadeUp 0.4s ease; }
  .result-eyebrow { font-size: 0.68rem; font-weight: 500; color: #726A4E; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
  .result-title { font-family: 'Aleo', Georgia, serif; font-size: 1.8rem; line-height: 1.15; color: #1c1c1a; margin-bottom: 0.3rem; }
  .result-tagline { font-size: 0.88rem; color: #6b5e4e; line-height: 1.5; margin-bottom: 0.85rem; font-style: italic; }
  .result-meta { display: flex; gap: 1rem; font-size: 0.78rem; color: #9b8f7a; flex-wrap: wrap; }
  .vibe-pills { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 0.75rem; }
  .vibe-pill { font-size: 0.66rem; padding: 3px 9px; border-radius: 100px; border: 1px solid #ddd8ce; color: #6b5e4e; background: #fff; }

  .tab-bar { display: flex; border-bottom: 1px solid #e8e2d8; background: #ffffff; }
  .tab { flex: 1; padding: 0.85rem; border: none; background: none; font-family: 'Aleo', sans-serif; font-size: 0.8rem; cursor: pointer; color: #9b8f7a; border-bottom: 2px solid transparent; transition: all 0.15s; margin-bottom: -1px; }
  .tab.active { color: #726A4E; border-bottom-color: #726A4E; font-weight: 500; }

  .stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: #e8e2d8; border-bottom: 1px solid #e8e2d8; }
  .stat { background: #ffffff; padding: 1rem; text-align: center; }
  .stat-val { font-family: 'Aleo', Georgia, serif; font-size: 1.2rem; color: #1c1c1a; }
  .stat-lbl { font-size: 0.6rem; color: #9b8f7a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  .stops-wrap { padding: 1.25rem 1.5rem; }
  .stop { border: 1px solid #e8e2d8; border-radius: 16px; margin-bottom: 10px; background: #fff; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .stop-inner { padding: 1.1rem; }
  .stop-top { display: flex; gap: 10px; align-items: flex-start; }
  .stop-emoji-wrap { width: 44px; height: 44px; border-radius: 12px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
  .stop-body { flex: 1; min-width: 0; }
  .stop-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .stop-time { font-size: 0.68rem; font-weight: 500; color: #726A4E; text-transform: uppercase; letter-spacing: 0.06em; }
  .stop-type { font-size: 0.62rem; color: #b8ac9a; text-transform: uppercase; letter-spacing: 0.06em; }
  .stop-dot { width: 3px; height: 3px; border-radius: 50%; background: #ddd8ce; }
  .stop-name { font-family: 'Aleo', Georgia, serif; font-size: 1.05rem; color: #1c1c1a; margin-bottom: 4px; line-height: 1.2; }
  .stop-hook { font-size: 0.8rem; color: #6b5e4e; line-height: 1.45; }
  .stop-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 1.1rem 0.75rem; border-top: 1px solid #f0ebe2; margin-top: 0.75rem; }
  .stop-pills-row { display: flex; gap: 5px; flex-wrap: wrap; }
  .stop-pill { font-size: 0.68rem; padding: 3px 8px; border-radius: 100px; background: #f5f0e8; color: #6b5e4e; }
  .stop-booking { font-size: 0.68rem; color: #9b8f7a; }
  .why-fit { padding: 0 1.1rem 0.75rem; font-size: 0.75rem; color: #9b8f7a; font-style: italic; line-height: 1.4; border-top: 1px solid #f0ebe2; padding-top: 0.55rem; }
  .transit { display: flex; align-items: center; gap: 8px; padding: 0 0.5rem; margin-bottom: 10px; color: #b8ac9a; font-size: 0.75rem; }

  .night-box { margin: 0 1.5rem 0.85rem; padding: 1.1rem; border-radius: 14px; background: #1c1c1a; color: #ffffff; }
  .night-box-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.5; margin-bottom: 0.4rem; }
  .night-box-text { font-size: 0.85rem; line-height: 1.5; opacity: 0.88; }
  .tip-box { margin: 0 1.5rem 0.85rem; padding: 1.1rem; border-radius: 14px; border: 1px solid #e8e2d8; background: #fff; }
  .tip-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9b8f7a; margin-bottom: 0.4rem; }
  .tip-text { font-size: 0.82rem; line-height: 1.5; color: #4a4438; }

  .plan-card { background: #fff; border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.1rem; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); cursor: pointer; transition: all 0.15s; animation: fadeUp 0.3s ease; }
  .plan-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .plan-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
  .plan-card-title { font-family: 'Aleo', Georgia, serif; font-size: 1rem; color: #1c1c1a; line-height: 1.2; }
  .plan-card-date { font-size: 0.68rem; color: #9b8f7a; }
  .plan-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.5rem; }
  .plan-tag { font-size: 0.66rem; padding: 2px 8px; border-radius: 100px; background: #f5f0e8; color: #6b5e4e; }
  .plan-tag.teal { background: #eef3d8; color: #726A4E; }
  .empty-state { text-align: center; padding: 3rem 2rem; }
  .empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .empty-title { font-family: 'Aleo', Georgia, serif; font-size: 1.2rem; color: #1c1c1a; margin-bottom: 0.5rem; }
  .empty-sub { font-size: 0.82rem; color: #9b8f7a; line-height: 1.5; margin-bottom: 1.5rem; }

  .filter-row { display: flex; gap: 8px; overflow-x: auto; padding: 0 1.5rem 1rem; scrollbar-width: none; }
  .filter-row::-webkit-scrollbar { display: none; }
  .filter-chip { padding: 6px 14px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-size: 0.78rem; cursor: pointer; background: #fff; color: #4a4438; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; font-family: 'Aleo', sans-serif; }
  .filter-chip.sel { background: #1c1c1a; color: #fff; border-color: #1c1c1a; }

  .event-card { border-radius: 16px; overflow: hidden; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.15s; animation: fadeUp 0.3s ease; }
  .event-card:hover { transform: translateY(-2px); }
  .event-card-img { height: 140px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .event-card-emoji { font-size: 3.5rem; }
  .event-card-body { background: #fff; padding: 1rem; border: 1px solid #e8e2d8; border-top: none; border-radius: 0 0 16px 16px; }
  .event-card-cat { font-size: 0.62rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .event-card-name { font-family: 'Aleo', Georgia, serif; font-size: 1rem; color: #1c1c1a; margin-bottom: 4px; line-height: 1.2; }
  .event-card-venue { font-size: 0.75rem; color: #9b8f7a; margin-bottom: 6px; }
  .event-card-row { display: flex; align-items: center; justify-content: space-between; }
  .event-card-date { font-size: 0.72rem; color: #6b5e4e; }
  .event-card-price { font-size: 0.72rem; font-weight: 500; color: #726A4E; }
  .events-loading { text-align: center; padding: 3rem 1.5rem; color: #9b8f7a; font-size: 0.85rem; }
  .api-note { background: #f5f0e8; border-radius: 12px; padding: 1rem; margin: 0 1.5rem 1rem; font-size: 0.75rem; color: #6b5e4e; line-height: 1.5; border-left: 3px solid #726A4E; }

  .social-wrap { padding: 1.5rem; }
  .social-section-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9b8f7a; margin-bottom: 0.75rem; font-weight: 500; }
  .social-card { border: 1px solid #e8e2d8; border-radius: 14px; background: #fff; overflow: hidden; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .social-card-top { padding: 1rem; border-bottom: 1px solid #f0ebe2; }
  .social-card-title { font-size: 0.9rem; font-weight: 500; color: #1c1c1a; margin-bottom: 3px; }
  .social-card-sub { font-size: 0.75rem; color: #9b8f7a; line-height: 1.4; }
  .feat-row { display: flex; align-items: flex-start; gap: 10px; padding: 0.85rem 1rem; border-bottom: 1px solid #f0ebe2; }
  .feat-row:last-child { border-bottom: none; }
  .feat-icon { width: 34px; height: 34px; border-radius: 10px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .feat-body { flex: 1; }
  .feat-title { font-size: 0.84rem; font-weight: 500; color: #1c1c1a; margin-bottom: 2px; }
  .feat-sub { font-size: 0.73rem; color: #9b8f7a; line-height: 1.35; }
  .feat-badge { display: inline-block; font-size: 0.6rem; padding: 2px 7px; border-radius: 100px; margin-top: 4px; background: #f5f0e8; color: #8b7355; }
  .feat-badge.live { background: #eef3d8; color: #726A4E; }

  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #1c1c1a; color: #ffffff; padding: 10px 20px; border-radius: 100px; font-size: 0.82rem; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; font-family: 'Aleo', sans-serif; }
  .toast.show { opacity: 1; }
  .err { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #fdf0ef; border: 1px solid #f5d0cc; color: #c0392b; font-size: 0.82rem; line-height: 1.4; }
  .success { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #eef3d8; border: 1px solid #726A4E; color: #726A4E; font-size: 0.82rem; line-height: 1.4; }

  /* ── TIKTOK PARSER ── */
  .parser-wrap { padding: 1.5rem; }
  .input-group { margin-bottom: 1rem; }
  .input-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: #9b8f7a; display: block; margin-bottom: 6px; font-weight: 500; }
  .input-field { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'Aleo', sans-serif; font-size: 0.9rem; transition: border-color 0.15s; }
  .input-field:focus { outline: none; border-color: #726A4E; }
  .input-field::placeholder { color: #c0b8ad; }
  textarea.input-field { min-height: 100px; resize: vertical; }
  .preview-card { border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .preview-title { font-family: 'Aleo', Georgia, serif; font-size: 1.1rem; color: #1c1c1a; margin-bottom: 0.75rem; }
  .preview-field { display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; }
  .preview-key { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #9b8f7a; min-width: 80px; padding-top: 2px; font-weight: 500; }
  .preview-val { font-size: 0.82rem; color: #1c1c1a; line-height: 1.4; flex: 1; }
  .zone-badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 500; background: #eef3d8; color: #726A4E; }

  /* ── ADMIN ── */
  .admin-card { border: 1px solid #e8e2d8; border-radius: 14px; padding: 1rem; margin-bottom: 10px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .admin-card-name { font-family: 'Aleo', Georgia, serif; font-size: 1rem; color: #1c1c1a; margin-bottom: 4px; }
  .admin-card-meta { font-size: 0.75rem; color: #9b8f7a; margin-bottom: 8px; }
  .admin-actions { display: flex; gap: 8px; }
  .btn-approve { flex: 1; padding: 8px; border-radius: 8px; border: none; background: #726A4E; color: #fff; font-family: 'Aleo', sans-serif; font-size: 0.8rem; cursor: pointer; font-weight: 500; }
  .btn-reject { flex: 1; padding: 8px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: transparent; color: #9b8f7a; font-family: 'Aleo', sans-serif; font-size: 0.8rem; cursor: pointer; }
  .zone-select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'Aleo', sans-serif; font-size: 0.82rem; margin-bottom: 8px; }

  /* ── PREFERENCES ── */
  .pref-wrap { padding: 1.5rem; }
  .pref-chip { padding: 8px 14px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-size: 0.82rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px; font-family: 'Aleo', sans-serif; }
  .pref-chip.sel-blue { background: #A8C4D4; color: #1c1c1a; border-color: #A8C4D4; }
  .pref-chip.sel-yellow { background: #F0EAC8; color: #1c1c1a; border-color: #F0EAC8; }
  .pref-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.25rem; }
`;

// ── MOCK EVENTS ───────────────────────────────────────────────

// ── COMPONENTS ────────────────────────────────────────────────

function DecorativeShapes() {
  return (
    <div className="shapes-wrap">
      <div className="shape-circle shape-teal"><div className="inner-oval" /></div>
      <div className="shape-circle shape-yellow">
        <svg className="inner-starburst" width="120" height="120" viewBox="0 0 120 120">
          <polygon fill="#F4A7C0" points="60,4 63,40 80,8 70,42 95,20 72,48 108,38 76,56 112,60 76,64 108,82 72,72 95,100 70,78 80,112 63,80 60,116 57,80 40,112 50,78 25,100 48,72 12,82 44,64 8,60 44,56 12,38 48,48 25,20 50,42 40,8 57,40" />
        </svg>
      </div>
      <div className="shape-circle shape-cream">
        <svg className="inner-star4" width="40" height="40" viewBox="0 0 40 40">
          <path fill="#9B892F" d="M20 2 C20 2 22 14 28 20 C22 26 20 38 20 38 C20 38 18 26 12 20 C18 14 20 2 20 2Z M2 20 C2 20 14 22 20 28 C26 22 38 20 38 20 C38 20 26 18 20 12 C14 18 2 20 2 20Z" />
        </svg>
      </div>
    </div>
  );
}

function HomeScreen({ onStart }) {
  return (
    <div>
      <div className="home-hero">
        <DecorativeShapes />
        <div className="home-eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 className="home-title">Curated,<br /><em>Your Way</em></h1>
        <p className="home-sub">60+ hand-picked experiences. One perfect plan. Matched to you.</p>
        <div className="home-cta">
          <button className="btn btn-teal" style={{ maxWidth: 200 }} onClick={onStart}>Plan my day or night ✦</button>
        </div>
      </div>
      <div className="divider" />
      <div className="section-pad">
        <div className="section-title">How it works</div>
        <p className="section-sub">Answer 9 quick questions. Get one perfectly sequenced plan.</p>
        {[["✦", "9 quick questions", "Tell us your vibe, budget, area, and energy level."],
          ["◎", "We match the experience", "Our curated database of 60+ hand-picked spots filters to your exact vibe."],
          ["→", "One perfect plan", "Claude sequences them geographically and temporally. Just follow it."]
        ].map(([icon, title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "1.1rem", alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? "#726A4E" : i === 1 ? "#DD4124" : "#1c1c1a", display: "flex", alignItems: "center", justifyContent: "center", color: i === 1 ? "#1c1c1a" : "#fff", fontSize: "1rem", flexShrink: 0, fontWeight: 700 }}>{icon}</div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1c1c1a", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: "0.78rem", color: "#9b8f7a", lineHeight: 1.45 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function MapPicker({ onPin, currentPin, compact }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const mapHeight = compact ? 180 : 280;

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [51.505, -0.09],
      zoom: compact ? 11 : 12,
      zoomControl: !compact,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: '<div style="width:28px;height:28px;background:#726A4E;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      className: '',
    });

    if (currentPin) {
      markerRef.current = L.marker(
        [currentPin.lat, currentPin.lng],
        { icon: pinIcon }
      ).addTo(map);

      map.setView([currentPin.lat, currentPin.lng], 14);
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) markerRef.current.remove();

      markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      onPin({ lat, lng });
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [loaded, currentPin, onPin, compact]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [compact]);

  return (
    <div style={{ marginTop: "1rem" }}>
      {!compact && (
        <div style={{ fontSize: "0.72rem", color: "#6b5e4e", marginBottom: "8px", lineHeight: 1.5 }}>
          Tap anywhere on the map to drop a pin. We'll find venues within 1.5km.
        </div>
      )}

      {!loaded && (
        <div style={{ height: mapHeight, background: "#f5f0e8", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8f7a", fontSize: "0.82rem" }}>
          Loading map...
        </div>
      )}

      <div
        ref={mapRef}
        style={{ height: mapHeight, borderRadius: 14, overflow: "hidden", border: "1.5px solid #ddd8ce", display: loaded ? "block" : "none", transition: "height 0.3s ease" }}
      />

      {currentPin && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#726A4E", display: "flex", alignItems: "center", gap: 4 }}>
          ✓ Pin dropped · {currentPin.lat.toFixed(4)}, {currentPin.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}


function QuizScreen({ step, ans, times, setTimes, onToggle, onNext, onBack, onGenerate, loading, loadIdx, error, onExit }) {
  const q = QUESTIONS[step];
  const totalSteps = QUESTIONS.length + 1;
  const progressPct = Math.round(((step + 1) / totalSteps) * 100);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaMatches, setAreaMatches] = useState([]);

  function handleAreaSearch(val) {
    setAreaSearch(val);
    if (val.length < 2) { setAreaMatches([]); return; }
    const matches = ALL_AREAS.filter(a => a.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
    setAreaMatches(matches);
  }

  function selectNeighbourhood(neighbourhood) {
    onToggle("area", neighbourhood, false);
    setAreaSearch(neighbourhood);
    setAreaMatches([]);
    setTimeout(onNext, 200);
  }

  function canNext() {
  if (step >= QUESTIONS.length) return true;
  const a = ans[q.id];
  if (q.id === "area" && a === "map_pin") return !!ans.mapPin;
  return q.multi ? a && a.length > 0 : !!a;
}

  if (loading) return (
    <div className="loading">
      <div className="loading-ring" />
      <div className="loading-title">Building your plan</div>
      <div className="loading-sub">{LOADS[loadIdx]}</div>
    </div>
  );

  const isAreaStep = q?.id === "area";

  return (
    <div>
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <div className="progress-label">{step < QUESTIONS.length ? `${step + 1} of ${QUESTIONS.length}` : "Almost done"}</div>
        <div className="progress-bg"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
      </div>
      {error && <div className="err">⚠️ {error}</div>}
      <button className="btn-ghost" onClick={step > 0 ? onBack : onExit}>← Back</button>
      {step < QUESTIONS.length ? (
        <div style={{ padding: step > 0 ? "1rem 1.5rem 1.5rem" : "2rem 1.5rem 1.5rem" }}>
          <div className="q-title">{q.title}</div>
          <div className="chips">
            {q.options.map((opt) => {
              const sel = q.multi ? (ans[q.id] || []).includes(opt.value) : ans[q.id] === opt.value;
              return (
                <div key={opt.value} className={`chip ${sel ? "sel" : ""}`}
                  onClick={() => { onToggle(q.id, opt.value, q.multi); if (!q.multi && opt.value !== "map_pin") { setAreaSearch(""); setAreaMatches([]); setTimeout(onNext, 200); } }}
                  >
                    <span>{opt.emoji}</span>{opt.label}
                </div>
              );
            })}
          </div>
          {isAreaStep && (
            <div style={{ marginTop: "1rem", position: "relative" }}>
              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b8f7a", marginBottom: "6px", fontWeight: 500 }}>Or search a specific neighbourhood</div>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Shoreditch, Peckham, Maida Vale..."
                value={areaSearch}
                onChange={e => handleAreaSearch(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              {areaMatches.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #ddd8ce", borderRadius: 12, zIndex: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginTop: 4 }}>
                  {areaMatches.map(area => (
                    <div key={area} onClick={() => selectNeighbourhood(area)}
                      style={{ padding: "10px 14px", fontSize: "0.85rem", color: "#1c1c1a", cursor: "pointer", borderBottom: "1px solid #f0ebe2" }}
                      onMouseEnter={e => e.target.style.background = "#f5f0e8"}
                      onMouseLeave={e => e.target.style.background = "#fff"}>
                      📍 {area}
                    </div>
                  ))}
                </div>
              )}
              {ans.area && !q.options.find(o => o.value === ans.area) && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#726A4E" }}>✦ Selected: {ans.area}</div>
              )}
            </div>
          )}
          {isAreaStep && (
            <MapPicker
              onPin={(pin) => { onToggle("area", "map_pin", false); onToggle("mapPin", pin, false); }}
              currentPin={ans.mapPin}
              compact={ans.area !== "map_pin"}
            />
          )}
          {isAreaStep && ans.area === "map_pin" && ans.mapPin && (
            <button className="btn btn-teal" style={{ marginTop: "1rem" }} onClick={onNext}>
              Use this location →
            </button>
          )}
          {q.multi && <button className="btn" style={{ marginTop: "1.25rem" }} disabled={!canNext()} onClick={onNext}>Continue →</button>}
        </div>
      ) : (
        <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
          <div className="q-title">What time are you planning?</div>
          <div className="time-row">
            <div className="time-wrap"><label>Start time</label><input type="time" value={times.start} onChange={(e) => setTimes(t => ({ ...t, start: e.target.value }))} /></div>
            <div className="time-wrap"><label>End time</label><input type="time" value={times.end} onChange={(e) => setTimes(t => ({ ...t, end: e.target.value }))} /></div>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontSize: "0.78rem", color: "#6b5e4e", marginBottom: 6 }}>Anything else? <span style={{ color: "#9b8f7a" }}>(optional)</span></div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. somewhere with a nice terrace, no chains, dog-friendly..."
              value={ans.freeText || ""}
              onChange={(e) => onToggle("freeText", e.target.value, false)}
              style={{ padding: "11px 14px", fontSize: "0.85rem" }}
            />
          </div>
          <button className="btn btn-teal" style={{ marginTop: "1.25rem" }} onClick={onGenerate}>Generate my plan ✦</button>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ result, times, ans, onRestart, onNewPlan, dbVenues, onUpdateResult, onShare, onRate, onSchedule, scheduledDate }) {
  const [view, setView] = useState("plan");
  const [shareId] = useState(generateId);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Persist the plan so anyone with the link can view it.
  async function ensureShared() {
    setSharing(true);
    try { await supabase.from("shared_plans").upsert({ id: shareId, plan: result, times, title: result?.title || "Curated plan" }, { onConflict: "id" }); } catch (e) { console.error("[share]", e); }
    setSharing(false);
    return shareId;
  }
  const shareLink = `https://london-app.vercel.app/?plan=${shareId}`;
  const [swappingIdx, setSwappingIdx] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  function findAlternatives(stopIdx) {
    const stop = result.stops[stopIdx];
    const usedNames = new Set(result.stops.map(s => s.name.toLowerCase()));
    const source = dbVenues.map(v => ({
      id: v.id, name: v.name, type: v.category || "experience",
      tags: v.vibe_tags || [], price: v.price || "mid",
      desc: v.comment || "", emoji: "✨",
      travelZone: (v.zone || "Central").toLowerCase(),
      google_rating: v.google_rating,
      lat: v.lat ? parseFloat(v.lat) : null,
      lng: v.lng ? parseFloat(v.lng) : null,
      celebrity_tags: v.celebrity_tags || null,
    }));

    // Find venues of same type, not already in plan, scored by vibe match
    const candidates = source
      .filter(v => !usedNames.has(v.name.toLowerCase()))
      .filter(v => v.type === stop.type || v.tags.some(t => (stop.tags || []).includes(t)))
      .map(v => {
        let score = 0;
        if (v.type === stop.type) score += 5;
        if (v.travelZone === (stop.area || "").toLowerCase()) score += 3;
        const vibes = ans.vibes || [];
        const wt = vibes.flatMap(vb => VIBE_TAG_MAP[vb] || [vb]);
        score += (v.tags || []).filter(t => wt.includes(t)).length * 2;
        return { ...v, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (swappingIdx === stopIdx) {
      setSwappingIdx(null);
      setAlternatives([]);
      return;
    }
    setAlternatives(candidates);
    setSwappingIdx(stopIdx);
  }

  function recalcTotalCost(stops) {
    let low = 0, high = 0, valid = 0;
    for (const s of stops) {
      const est = s.cost_estimate || s.price_range || "";
      const nums = est.match(/\d+/g);
      if (nums && nums.length >= 2) { low += parseInt(nums[0]); high += parseInt(nums[1]); valid++; }
      else if (nums && nums.length === 1) { low += parseInt(nums[0]); high += parseInt(nums[0]); valid++; }
    }
    if (!valid) return null;
    return `£${low}–£${high}pp`;
  }

  async function recalcTravel(stops) {
    const travelMode = ans.travel === "walk_tube" ? "transit" : "walking";
    const updated = [...stops];
    for (let i = 0; i < updated.length - 1; i++) {
      const curr = dbVenues.find(v => v.name?.toLowerCase() === updated[i].name?.toLowerCase());
      const next = dbVenues.find(v => v.name?.toLowerCase() === updated[i + 1].name?.toLowerCase());
      if (curr?.lat && curr?.lng && next?.lat && next?.lng) {
        try {
          const r = await fetch("/api/travel-time", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin: { lat: curr.lat, lng: curr.lng }, destination: { lat: next.lat, lng: next.lng }, mode: travelMode, departureTime: new Date().toISOString() })
          });
          const d = await r.json();
          if (d.found) { updated[i] = { ...updated[i], travel_to_next: d.label, travel_minutes: d.durationMinutes }; }
        } catch {}
      } else {
        updated[i] = { ...updated[i], travel_to_next: null, travel_minutes: null };
      }
    }
    if (updated.length > 0) updated[updated.length - 1] = { ...updated[updated.length - 1], travel_to_next: null, travel_minutes: null };
    return updated;
  }

  async function swapVenue(alt) {
    const newStops = [...result.stops];
    newStops[swappingIdx] = {
      ...newStops[swappingIdx],
      name: alt.name,
      emoji: alt.emoji,
      type: alt.type,
      hook: alt.desc,
      google_rating: alt.google_rating,
      price_range: alt.price,
      celebrity_tags: alt.celebrity_tags,
    };
    const newTotal = recalcTotalCost(newStops);
    onUpdateResult({ ...result, stops: newStops, ...(newTotal ? { total_cost_estimate: newTotal } : {}) });
    setSwappingIdx(null);
    setAlternatives([]);
    const withTravel = await recalcTravel(newStops);
    onUpdateResult({ ...result, stops: withTravel, ...(newTotal ? { total_cost_estimate: newTotal } : {}) });
  }

  async function removeStop(idx) {
    const newStops = result.stops.filter((_, i) => i !== idx);
    const newTotal = recalcTotalCost(newStops);
    onUpdateResult({ ...result, stops: newStops, ...(newTotal ? { total_cost_estimate: newTotal } : {}) });
    setSwappingIdx(null);
    setAlternatives([]);
    const withTravel = await recalcTravel(newStops);
    onUpdateResult({ ...result, stops: withTravel, ...(newTotal ? { total_cost_estimate: newTotal } : {}) });
  }

  return (
    <div>
      <div className="result-hero">
        <div className="result-eyebrow">✦ Your curated plan</div>
        <div className="result-title">{result.title}</div>
        <div className="result-tagline">{result.tagline}</div>
        {result._fewerStops && <div style={{ fontSize: "0.74rem", color: "#9b8f7a", marginTop: 4 }}>{result._fewerStops}</div>}
        <div className="result-meta">
          <span>💰 {result.total_cost_estimate}</span>
          <span>🕐 {times.start}–{times.end}</span>
          <span>📍 {(ans.area || "").replace(/_/g, " ")}</span>
        </div>
        <div className="vibe-pills">
          {Object.entries(result.vibe_scores || {}).map(([k, v]) => <div key={k} className="vibe-pill">{k} {v}/10</div>)}
        </div>
      </div>
      <div className="tab-bar">
        {["plan", "social"].map((v) => (
          <button key={v} className={`tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
            {v === "plan" ? "The plan" : "Share & date"}
          </button>
        ))}
      </div>
      {view === "plan" && (
        <div>
          <div className="stat-row">
            {[["stops", (result.stops || []).length], ["screened", "45+"], ["cost from", result.total_cost_estimate?.split("–")[0] || "?"]].map(([l, v], i) => (
              <div key={i} className="stat"><div className="stat-val">{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="stops-wrap">
            {(result.stops || []).map((stop, idx) => (
              <div key={idx}>
                <div className="stop" style={stop._saved ? { outline: "2px solid #726A4E", outlineOffset: -2, borderRadius: 16 } : undefined}>
                  <div className="stop-inner" onClick={() => { setSwappingIdx(null); setAlternatives([]); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + " London")}`, "_blank"); }} style={{ cursor: "pointer" }}>
                    <div className="stop-top">
                      <div className="stop-emoji-wrap">{stop.emoji}</div>
                      <div className="stop-body">
                        <div className="stop-meta">
                          <span className="stop-time">{stop.time}</span>
                          <span className="stop-dot" />
                          <span className="stop-type">{stop.type}</span>
                        </div>
                        <div className="stop-name">{stop.name}</div>
                        <div className="stop-hook">{stop.hook}</div>
                      </div>
                    </div>
                  </div>
                  <div className="stop-footer">
                    <div className="stop-pills-row">
                      {stop._saved && <span className="stop-pill" style={{ background: "#eef3d8", color: "#726A4E", fontWeight: 700 }}>★ Your saved spot</span>}
                      {stop.price_range && <span className="stop-pill">💰 {stop.price_range}</span>}
                      {stop.google_rating && <span className="stop-pill">⭐ {stop.google_rating}</span>}
                      {stop.area && <span className="stop-pill">📍 {stop.area}</span>}
                      {stop.plant_friendly && <span className="stop-pill" style={{ background: "#ecfdf5", color: "#059669" }}>🌱 Plant-friendly</span>}
                      {stop.celebrity_tags && [...new Set(stop.celebrity_tags)].map((celeb, ci) => (
                        <span key={ci} className="stop-pill" style={{ background: "#f3e8ff", color: "#7c3aed" }}>💫 {celeb}'s fav</span>
                      ))}
                    </div>
                    <button onClick={() => findAlternatives(idx)} style={{ border: "none", background: "none", color: "#726A4E", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer", fontFamily: "'Aleo', sans-serif", padding: "2px 0" }}>↻ Swap</button>
                    {(result.stops || []).length > 2 && <button onClick={() => removeStop(idx)} style={{ border: "none", background: "none", color: "#DD4124", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer", fontFamily: "'Aleo', sans-serif", padding: "2px 0" }}>× Remove</button>}
                  </div>
                  {swappingIdx === idx && alternatives.length > 0 && (
                    <div style={{ padding: "0.75rem 1.1rem", borderTop: "1px solid #f0ebe2", background: "#fafaf7" }}>
                      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b8f7a", marginBottom: "0.5rem", fontWeight: 500 }}>Swap with...</div>
                      {alternatives.map((alt, ai) => (
                        <div key={ai} onClick={() => swapVenue(alt)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0", borderBottom: ai < alternatives.length - 1 ? "1px solid #f0ebe2" : "none", cursor: "pointer" }}>
                          <span style={{ fontSize: "1.1rem" }}>{alt.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "#1c1c1a" }}>{alt.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "#9b8f7a" }}>{alt.type} {alt.google_rating ? `· ⭐ ${alt.google_rating}` : ""}</div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => { setSwappingIdx(null); setAlternatives([]); }} style={{ border: "none", background: "none", color: "#9b8f7a", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Aleo', sans-serif", marginTop: "0.4rem" }}>Cancel</button>
                    </div>
                  )}
                  {swappingIdx === idx && alternatives.length === 0 && (
                    <div style={{ padding: "0.5rem 1.1rem", borderTop: "1px solid #f0ebe2", fontSize: "0.75rem", color: "#9b8f7a" }}>No alternatives found for this stop type.</div>
                  )}
                  {stop.why_it_fits && <div className="why-fit">↳ {stop.why_it_fits}</div>}
                </div>
                {stop.travel_to_next && idx < (result.stops || []).length - 1 && (
                  <div className="transit">↓ {stop.travel_to_next}</div>
                )}
              </div>
            ))}
          </div>
          {result.extend_the_night && <div className="night-box"><div className="night-box-label">Extend the night</div><div className="night-box-text">🌙 {result.extend_the_night}</div></div>}
          {result.local_tip && <div className="tip-box"><div className="tip-label">Local tip</div><div className="tip-text">🗣️ {result.local_tip}</div></div>}
          <div style={{ padding: "0 1.5rem 1rem" }}>
            <button className="btn btn-teal" onClick={() => {
              const stops = result.stops || [];
              if (stops.length === 0) return;
              const origin = encodeURIComponent(stops[0].name + " London");
              const dest = encodeURIComponent(stops[stops.length - 1].name + " London");
              const waypoints = stops.slice(1, -1).map(s => encodeURIComponent(s.name + " London")).join("|");
              const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=walking`;
              window.open(url, "_blank");
            }}>
              🗺️ Create Google Maps route
            </button>
            {onRate && <button className="btn-outline" onClick={onRate}>★ Rate this plan</button>}
            {onShare && <button className="btn-outline" onClick={() => onShare({ kind: "plan", title: result.title || "Curated plan", payload: { plan: result, times } })}>📨 Send to a friend (in app)</button>}
            <button className="btn-outline" onClick={() => { setView("social"); ensureShared(); }}>🔗 Share via link</button>
            <button className="btn-outline" onClick={onRestart}>↺ Plan a different day</button>
          </div>
        </div>
      )}
      {view === "social" && (
        <div className="social-wrap">
          <div className="social-section-title">Share your plan</div>
          <div className="social-card">
            <div className="social-card-top">
              <div className="social-card-title">Send this to your crew</div>
              <div className="social-card-sub">{sharing ? "Preparing your link…" : "Anyone with the link sees your full plan."}</div>
            </div>
            <div style={{ padding: "0.75rem 1rem 1rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-outline" style={{ marginTop: 0 }} disabled={sharing} onClick={async () => { await ensureShared(); navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? "✓ Copied" : "🔗 Copy link"}
              </button>
              <button className="btn-outline" style={{ marginTop: 0 }} disabled={sharing} onClick={async () => { await ensureShared(); window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this Curated plan: ${shareLink}`)}`); }}>
                💬 WhatsApp
              </button>
              {onShare && <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => onShare({ kind: "plan", title: result?.title || "An itinerary", payload: { plan: result, times } })}>👤 A friend</button>}
            </div>
          </div>

          {onSchedule && (
            <>
              <div className="social-section-title" style={{ marginTop: 16 }}>Add to your calendar</div>
              <div className="social-card">
                <div style={{ padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, position: "relative", cursor: "pointer", background: "#726A4E", color: "#fff", borderRadius: 12, padding: "12px 14px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <span>📅 {scheduledDate ? `Planned for ${new Date(scheduledDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" })}` : "Pick a date for this plan"}</span>
                    <span style={{ opacity: 0.85 }}>{scheduledDate ? "Change" : "Choose ›"}</span>
                    <input type="date" value={scheduledDate || ""} onChange={(e) => e.target.value && onSchedule(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                  </label>
                  {scheduledDate && (() => {
                    const d = scheduledDate.replace(/-/g, ""); const endD = new Date(scheduledDate); endD.setDate(endD.getDate() + 1); const en = endD.toISOString().slice(0, 10).replace(/-/g, "");
                    const details = (result.stops || []).map(s => `${s.time || ""} ${s.name}`).join("\n");
                    const href = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: result.title || "Curated plan", dates: `${d}/${en}`, details }).toString()}`;
                    return <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "#726A4E", fontWeight: 600, textAlign: "center" }}>+ Also add to Google Calendar (with reminder)</a>;
                  })()}
                </div>
              </div>
            </>
          )}

          <button className="btn-outline" onClick={() => setView("plan")}>← Back to the plan</button>
        </div>
      )}
    </div>
  );
}

function MyPlansScreen({ plans, onViewPlan, onNewPlan, onSchedule, dbVenues }) {
  const photoFor = (name) => { if (!name || !dbVenues) return null; const v = dbVenues.find(x => x.name && x.name.toLowerCase() === String(name).toLowerCase()); return v?.photo_url || null; };
  const Header = (
    <div style={{ padding: "1.75rem 1.5rem 0.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "2rem", color: "#1c1c1a", lineHeight: 1.05 }}>Itineraries</div>
      <div style={{ fontSize: "0.86rem", color: "#9b8f7a", marginTop: 5 }}>Turn your saved spots into plans you'll actually do.</div>
      <button data-tour="plan-cta" onClick={onNewPlan} style={{ width: "100%", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#726A4E", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 12px rgba(114,106,78,0.28)" }}>✦ Plan my day or night</button>
    </div>
  );
  const CalIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;

  if (plans.length === 0) return (
    <div>
      {Header}
      <div className="empty-state">
        <div className="empty-emoji">🗺️</div>
        <div className="empty-title">No plans yet</div>
        <div className="empty-sub">Generate your first plan and it'll appear here.</div>
        <button className="btn btn-teal" style={{ maxWidth: 200, margin: "0 auto" }} onClick={onNewPlan}>Make a plan ✦</button>
      </div>
    </div>
  );
  return (
    <div>
      {Header}
      <div style={{ padding: "0.75rem 1.5rem 1.5rem", display: "grid", gap: 16 }}>
        {plans.map((plan, i) => {
          const stops = plan.result.stops || [];
          const cover = stops.map(s => s.photo_url || photoFor(s.name)).find(Boolean);
          return (
            <div key={i} onClick={() => onViewPlan(plan)} style={{ borderRadius: 18, overflow: "hidden", cursor: "pointer", background: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.09)" }}>
              <div style={{ position: "relative", height: 200, background: cover ? "#222" : "linear-gradient(135deg, #4B342F, #9B892F)" }}>
                {cover && <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 35%, rgba(0,0,0,0.72))" }} />
                <div style={{ position: "absolute", left: 18, right: 18, bottom: 16 }}>
                  <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.6rem", color: "#fff", lineHeight: 1.1, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}>{plan.result.title}</div>
                  {plan.result.tagline && <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.88)", marginTop: 5 }}>{plan.result.tagline}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.8rem", color: "#6b5e4e" }}>
                  {CalIcon}{plan.savedAt} · {stops.length} stop{stops.length !== 1 ? "s" : ""}
                </div>
                {onSchedule ? (
                  <label onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 5, position: "relative", fontSize: "0.76rem", fontWeight: 600, color: plan.scheduledDate ? "#726A4E" : "#9b8f7a", cursor: "pointer" }}>
                    📅 {plan.scheduledDate ? new Date(plan.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Schedule"}
                    <input type="date" value={plan.scheduledDate || ""} onChange={(e) => onSchedule(i, e.target.value)} onClick={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                  </label>
                ) : <span style={{ fontSize: "1.15rem", color: "#1c1c1a" }}>→</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiscoverScreen({ preferences, dbVenues, onStart }) {
  const [section, setSection] = useState("events");
  const [celebFilter, setCelebFilter] = useState("All");

  const CATEGORY_EMOJI = { restaurant: "🍽️", bar: "🍸", cafe: "☕", market: "🛍️", experience: "✨", outdoor: "🌿", museum: "🏛️", gallery: "🎨", nightlife: "🌙", event: "🎫" };
  const CATEGORY_COLOURS = { restaurant: "#DD4124", bar: "#4B342F", cafe: "#DD4124", market: "#9B892F", experience: "#726A4E", outdoor: "#726A4E", museum: "#A1947D", gallery: "#A1947D", nightlife: "#4B342F", event: "#726A4E" };

  const today = new Date().toISOString().split("T")[0];
  const events = dbVenues.filter(v => v.is_event && v.event_start && (!v.event_end || v.event_end >= today))
    .sort((a, b) => new Date(a.event_start) - new Date(b.event_start));

  const allCelebSpots = dbVenues.filter(v => v.celebrity_tags && v.celebrity_tags.length > 0);
  const celebNames = [...new Set(allCelebSpots.flatMap(v => v.celebrity_tags))].filter(Boolean).sort();
  const celebSpots = (celebFilter === "All" ? allCelebSpots : allCelebSpots.filter(v => v.celebrity_tags.includes(celebFilter)))
    .sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0));

  const formatDate = (start, end) => {
    const opts = { day: "numeric", month: "short" };
    const s = new Date(start).toLocaleDateString("en-GB", opts);
    if (!end) return s;
    const e = new Date(end).toLocaleDateString("en-GB", opts);
    return `${s} – ${e}`;
  };

  const renderCard = (v, showDate) => {
    const cat = (v.category || "experience").toLowerCase();
    const colour = CATEGORY_COLOURS[cat] || "#A1947D";
    const emoji = CATEGORY_EMOJI[cat] || "✨";
    return (
      <a key={v.id} className="event-card" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " London")}`} target="_blank" rel="noreferrer" style={{ cursor: "pointer", textDecoration: "none", color: "inherit", display: "block" }}>
        {v.photo_url ? (
          <div className="event-card-img" style={{ background: colour }}>
            <img src={v.photo_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div className="event-card-img" style={{ background: colour }}>
            <span className="event-card-emoji">{emoji}</span>
          </div>
        )}
        <div className="event-card-body">
          <div className="event-card-cat" style={{ color: colour }}>{cap(cat)}</div>
          <div className="event-card-name">{v.name}</div>
          <div className="event-card-venue">{v.area || v.zone || ""}</div>
          {v.comment && <div style={{ fontSize: "0.72rem", color: "#6b5e4e", marginTop: 4, lineHeight: 1.4 }}>{v.comment.length > 90 ? v.comment.slice(0, 90) + "..." : v.comment}</div>}
          <div className="event-card-row">
            <div className="event-card-date">
              {showDate && v.event_start ? `📅 ${formatDate(v.event_start, v.event_end)}` : ""}
              {!showDate && v.google_rating ? `⭐ ${v.google_rating}` : ""}
            </div>
            <div className="event-card-price">{v.price || ""}</div>
          </div>
          {v.celebrity_tags && v.celebrity_tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {[...new Set(v.celebrity_tags)].slice(0, 3).map(c => (
                <span key={c} style={{ fontSize: "0.62rem", background: "#fdf6e3", color: "#b8860b", padding: "2px 8px", borderRadius: 100 }}>💫 {c}</span>
              ))}
            </div>
          )}
          {!v.celebrity_tags && (v.vibe_tags || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {v.vibe_tags.slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: "0.62rem", background: "#f5f0e8", color: "#6b5e4e", padding: "2px 8px", borderRadius: 100 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </a>
    );
  };

  const list = section === "events" ? events : celebSpots;

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.75rem" }}>
        <div className="section-title">Discover</div>
        <p className="section-sub">What's happening and where the celebs go</p>
      </div>

      {onStart && (
        <div style={{ padding: "0 1.5rem 0.5rem" }}>
          <button onClick={onStart} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#726A4E", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 12px rgba(114,106,78,0.28)" }}>✦ Plan my day or night</button>
        </div>
      )}

      <div className="filter-row">
        <div className={`filter-chip ${section === "events" ? "sel" : ""}`} onClick={() => setSection("events")}>📅 What's On</div>
        <div className={`filter-chip ${section === "celeb" ? "sel" : ""}`} onClick={() => setSection("celeb")}>💫 Celebrity Spots</div>
      </div>
      {section === "celeb" && celebNames.length > 0 && (
        <div className="filter-row" style={{ paddingTop: 0 }}>
          <div className={`filter-chip ${celebFilter === "All" ? "sel" : ""}`} onClick={() => setCelebFilter("All")}>All</div>
          {celebNames.map(name => (
            <div key={name} className={`filter-chip ${celebFilter === name ? "sel" : ""}`} onClick={() => setCelebFilter(name)}>💫 {name}</div>
          ))}
        </div>
      )}

      <div style={{ padding: "0 1.5rem 1rem" }}>
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">{section === "events" ? "📅" : "💫"}</div>
            <div className="empty-title">{section === "events" ? "No events right now" : "No celebrity spots yet"}</div>
            <div className="empty-sub">{section === "events" ? "Check back soon — we add new events weekly." : "Celebrity-tagged venues will appear here."}</div>
          </div>
        ) : list.map(v => renderCard(v, section === "events"))}
      </div>
    </div>
  );
}

function TikTokParserScreen({ onSuccess }) {
  const [url, setUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cleanUrl, setCleanUrl] = useState("");
  const [parseStatus, setParseStatus] = useState("");

  async function parseFromImage(file) {
    setParsing(true); setError(null); setPreview(null); setParseStatus("Reading image...");
    try {
      const { base64, mediaType } = await fileToDownscaledBase64(file);

      setParseStatus("Extracting venue info...");
      const resp = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: `This is a screenshot about a London venue, event, or place. It may show ONE or MULTIPLE venues.
Extract structured data and return ONLY valid JSON with no markdown.

If ONE venue: return a JSON object.
If MULTIPLE venues: return a JSON array of objects.

Each object must have this exact structure:
{
  "name": "venue name",
  "address": "full address if visible, or null",
  "area": "neighbourhood e.g. Shoreditch, Chelsea, Clapham",
  "zone": "one of: North, Northwest, Northeast, South, Southwest, Southeast, East, West, Central",
  "category": "EXACTLY one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife (an exhibition = gallery; a pop-up/show/festival/concert = event; a club = nightlife; a pub = bar)",
  "price": "e.g. Free, £10, £20-30, or null if unknown",
  "is_event": true or false,
  "event_start": "YYYY-MM-DD or null",
  "event_end": "YYYY-MM-DD or null",
  "comment": "one sentence description",
  "vibe_tags": ["from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic, solo, underground"]
}` }
          ] }]
        }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || "AI API error");
      const txt = (data.content?.find(b => b.type === "text")?.text || "");
      const parsedRaw = safeJsonParse(txt);
      if (!parsedRaw) throw new Error("Couldn't extract venue info from this image.");
      const venues = Array.isArray(parsedRaw) ? parsedRaw : [parsedRaw];

      setParseStatus("Looking up on Google...");
      const enriched = await Promise.all(venues.map(async (venue) => {
        try {
          const gResp = await fetch("/api/enrich-venue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: venue.name, area: venue.area })
          });
          const gData = await gResp.json();
          if (gData.found) {
            return { ...venue, validated_name: gData.validated_name, validated_address: gData.validated_address, postcode: gData.postcode, derived_zone: gData.derived_zone, derived_area: gData.derived_area, lat: gData.lat, lng: gData.lng, google_place_id: gData.google_place_id, google_rating: gData.google_rating, google_review_count: gData.google_review_count, google_price_level: gData.google_price_level, price: gData.price || venue.price, website: gData.website, phone: gData.phone, opening_hours: gData.opening_hours, _google_found: true };
          }
        } catch (e) {}
        return { ...venue, _google_found: false };
      }));

      setPreview({ venues: enriched, _caption: "From screenshot" });
      setParseStatus("");
    } catch (e) {
      console.error("[parseFromImage]", e);
      setError(e.message || "Couldn't read this image.");
      setParseStatus("");
    }
    setParsing(false);
  }

  async function parse() {
    if (!url.trim()) { setError("Paste a TikTok URL to get started."); return; }

    // Extract TikTok URL from whatever was pasted (handles mixed text + URL)
    const urlMatch = url.match(/https?:\/\/[^\s]*(tiktok\.com|vm\.tiktok\.com)[^\s]*/i);
    if (!urlMatch) { setError("Couldn't find a TikTok URL in what you pasted. Make sure it includes tiktok.com"); return; }
    const cleanUrl = urlMatch[0];
    setCleanUrl(cleanUrl);

    setParsing(true); setError(null); setPreview(null);

    try {
      const tikResp = await fetch("/api/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl })
      });
      const tikData = await tikResp.json();
      if (tikData.error) throw new Error(tikData.error);

      const rawCaption = tikData.description || tikData.title || "";
      if (!rawCaption) throw new Error("No caption found in this video. Try a different one.");
      const caption = rawCaption.slice(0, 800).replace(/[\u0000-\u001F\u007F]/g, " ");

      const prompt = `You are parsing a TikTok video caption about London experiences or venues.
The caption may mention ONE venue or MULTIPLE venues.
Extract structured data and return ONLY valid JSON with no markdown.
Caption: ${JSON.stringify(caption)}

If ONE venue: return a JSON object.
If MULTIPLE venues: return a JSON array of objects.

Each object must have this exact structure:
{
  "name": "venue name",
  "address": "full address if mentioned, or null",
  "area": "neighbourhood e.g. Shoreditch, Chelsea, Clapham",
  "zone": "one of: North, Northwest, Northeast, South, Southwest, Southeast, East, West, Central — infer from area",
  "category": "EXACTLY one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife (an exhibition = gallery; a pop-up/show/festival/concert = event; a club = nightlife; a pub = bar)",
  "price": "e.g. Free, £10, £20-30, or null if unknown",
  "is_event": false,
  "event_start": null,
  "event_end": null,
  "comment": "interesting descriptors about this specific venue only",
  "vibe_tags": ["tags from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic"]
}`;

      const txt = await callClaude(prompt, 1500);
      const parsedRaw = safeJsonParse(txt);
      if (!parsedRaw) throw new Error("Couldn't read the venue details. Try again.");
      const venues = Array.isArray(parsedRaw) ? parsedRaw : [parsedRaw];

      // Enrich each venue with Google Places data
      const enriched = await Promise.all(venues.map(async (venue) => {
        try {
          const gResp = await fetch("/api/enrich-venue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: venue.name, area: venue.area })
          });
          const gData = await gResp.json();
          if (gData.found) {
            return {
              ...venue,
              validated_name: gData.validated_name,
              validated_address: gData.validated_address,
              postcode: gData.postcode,
              derived_zone: gData.derived_zone,
              derived_area: gData.derived_area,
              lat: gData.lat,
              lng: gData.lng,
              google_place_id: gData.google_place_id,
              google_rating: gData.google_rating,
              google_review_count: gData.google_review_count,
              google_price_level: gData.google_price_level,
              price: gData.price || venue.price,
              website: gData.website,
              phone: gData.phone,
              opening_hours: gData.opening_hours,
              _google_found: true
            };
          }
        } catch (e) {
          console.error("Google enrichment failed for", venue.name, e);
        }
        return { ...venue, _google_found: false };
      }));

      setPreview({ venues: enriched, _caption: caption });
    } catch (e) {
      setError(e.message || "Couldn't fetch this TikTok. Make sure the video is public.");
    }
    setParsing(false);
  }

  async function save() {
    if (!preview?.venues?.length) return;
    setSaving(true); setError(null);

    try {
      for (const venue of preview.venues) {
        const { data: existingMapping } = await supabase
          .from("area_zone_mapping")
          .select("zone")
          .eq("area", venue.area)
          .single();

        if (!existingMapping && venue.area) {
          await supabase.from("area_zone_mapping").insert({
            area: venue.area,
            zone: venue.zone || "Central"
          });
        }

        await supabase.from("experiences").insert({
          name: venue.validated_name || venue.name,
          address: venue.validated_address || venue.address,
          area: venue.derived_area || venue.area,
          zone: venue.derived_zone || venue.zone || existingMapping?.zone || "Central",
          category: venue.category,
          price: venue.price,
          is_event: venue.is_event || false,
          event_start: venue.event_start || null,
          event_end: venue.event_end || null,
          comment: venue.comment,
          vibe_tags: venue.vibe_tags || [],
          tiktok_url: cleanUrl || null,
          status: "pending",
          lat: venue.lat || null,
          lng: venue.lng || null,
          postcode: venue.postcode || null,
          google_place_id: venue.google_place_id || null,
          google_rating: venue.google_rating || null,
          google_review_count: venue.google_review_count || null,
          google_price_level: venue.google_price_level || null,
          website: venue.website || null,
          phone: venue.phone || null,
          opening_hours: venue.opening_hours || null
        });
      }

      setSuccess(true);
      setPreview(null);
      setUrl("");
      setCleanUrl("");
      if (onSuccess) onSuccess();
    } catch (e) {
      setError("Couldn't save. Error: " + e.message);
    }
    setSaving(false);
  }

  return (
    <div className="parser-wrap">
      <div className="section-title" style={{ marginBottom: "0.25rem" }}>Add a spot</div>
      <p className="section-sub">Paste a TikTok URL and we'll extract the details automatically.</p>

      {error && <div className="err">⚠️ {error}</div>}
      {success && <div className="success">✓ Saved! It'll appear after review.</div>}

      <div className="input-group">
        <label className="input-label">TikTok URL *</label>
        <input
          className="input-field"
          type="text"
          placeholder="https://www.tiktok.com/..."
          value={url}
          onChange={e => { setUrl(e.target.value); setSuccess(false); setPreview(null); setError(null); }}
        />
      </div>

      <button className="btn btn-teal" onClick={parse} disabled={parsing || !url.trim()}>
        {parsing ? "Fetching & parsing..." : "Parse TikTok ✦"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "0.75rem" }}>
        <div style={{ flex: 1, height: 1, background: "#e8e2d8" }} />
        <span style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#e8e2d8" }} />
      </div>

      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: "0.75rem", padding: "12px 16px", border: "1.5px dashed #ddd8ce", borderRadius: 100, fontSize: "0.82rem", color: "#4a4438", cursor: "pointer", fontFamily: "'Aleo', sans-serif" }}>
        📷 Upload a screenshot
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) parseFromImage(e.target.files[0]); e.target.value = ""; }} disabled={parsing} />
      </label>
      {parseStatus && <div style={{ fontSize: "0.75rem", color: "#726A4E", marginTop: 8, textAlign: "center" }}>{parseStatus}</div>}

      {preview && (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", marginBottom: "0.5rem", fontWeight: 500 }}>
            {preview.venues.length > 1 ? `${preview.venues.length} venues found` : "Preview"} — check before saving
          </div>
          {preview._caption && (
            <div style={{ fontSize: "0.72rem", color: "#9b8f7a", background: "#f5f0e8", borderRadius: 10, padding: "0.75rem", marginBottom: "1rem", lineHeight: 1.5 }}>
              <strong>Caption:</strong> {preview._caption}
            </div>
          )}
          {preview.venues.map((venue, i) => (
            <div key={i} className="preview-card" style={{ marginBottom: "0.75rem" }}>
              {preview.venues.length > 1 && (
                <div style={{ fontSize: "0.6rem", color: "#726A4E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem", fontWeight: 600 }}>
                  {i + 1} of {preview.venues.length}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem", gap: 8 }}>
                <div className="preview-title" style={{ marginBottom: 0 }}>{venue.validated_name || venue.name || "Unknown venue"}</div>
                <div style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: 100, background: venue._google_found ? "#eef3d8" : "#f5f0e8", color: venue._google_found ? "#726A4E" : "#9b8f7a", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {venue._google_found ? "✓ Google verified" : "⚠ Not on Google"}
                </div>
              </div>
              {[
                ["Address", venue.validated_address || venue.address],
                ["Postcode", venue.postcode],
                ["Area", venue.area],
                ["Zone", venue.zone ? <span className="zone-badge">{venue.zone}</span> : null],
                ["Category", venue.category],
                ["Price", venue.price],
                ["Rating", venue.google_rating ? `⭐ ${venue.google_rating} (${venue.google_review_count?.toLocaleString()} reviews)` : null],
                ["Hours", venue.opening_hours ? venue.opening_hours[0] : null],
                ["Website", venue.website ? <a href={venue.website} target="_blank" rel="noreferrer" style={{ color: "#726A4E" }}>Visit ↗</a> : null],
                ["Is event", venue.is_event ? `Yes — ${venue.event_start || "date TBC"}` : null],
                ["Vibe tags", venue.vibe_tags?.join(", ")],
                ["Notes", venue.comment],
              ].filter(([, v]) => v).map(([k, v], j) => (
                <div key={j} className="preview-field">
                  <span className="preview-key">{k}</span>
                  <span className="preview-val">{v}</span>
                </div>
              ))}
            </div>
          ))}
          <button className="btn btn-teal" onClick={save} disabled={saving}>
            {saving ? "Saving..." : `Submit ${preview.venues.length > 1 ? `all ${preview.venues.length} venues` : "venue"} for review ✦`}
          </button>
          <button className="btn-outline" onClick={() => setPreview(null)}>Try different URL</button>
        </div>
      )}
    </div>
  );
}

function AdminScreen({ onBadgeUpdate }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneEdits, setZoneEdits] = useState({});
  const [eventEdits, setEventEdits] = useState({});
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  async function loadUsers() {
    const { data } = await supabase.from("profiles").select("*").order("last_login", { ascending: false });
    setUsers(data || []);
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("experiences").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setPending(data || []);
    if (onBadgeUpdate) onBadgeUpdate(data?.length || 0);
    await loadUsers();
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    const zone = zoneEdits[id];
    const ev = eventEdits[id];
    const update = { status: "approved" };
    if (zone) update.zone = zone;
    if (ev?.is_event) {
      update.is_event = true;
      if (ev.event_start) update.event_start = ev.event_start;
      if (ev.event_end) update.event_end = ev.event_end;
    }
    await supabase.from("experiences").update(update).eq("id", id);

    if (zone) {
      const item = pending.find(p => p.id === id);
      if (item?.area) {
        await supabase.from("area_zone_mapping").upsert({ area: item.area, zone }, { onConflict: "area" });
      }
    }
    await load();
  }

  async function reject(id) {
    await supabase.from("experiences").delete().eq("id", id);
    await load();
  }

  const [bulkBusy, setBulkBusy] = useState(false);
  async function approveAll() {
    if (pending.length === 0) return;
    if (!window.confirm(`Approve all ${pending.length} pending item${pending.length !== 1 ? "s" : ""}?`)) return;
    setBulkBusy(true);
    // Apply any per-card zone/event edits the admin already made, then flip the rest to approved.
    for (const id of Object.keys(zoneEdits)) { if (pending.some(p => p.id === id)) await approve(id).catch(() => {}); }
    await supabase.from("experiences").update({ status: "approved" }).eq("status", "pending");
    setBulkBusy(false);
    await load();
  }

  if (loading) return <div className="loading"><div className="loading-ring" /><div className="loading-sub">Loading pending items...</div></div>;

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">Admin</div>
        <p className="section-sub">{pending.length} item{pending.length !== 1 ? "s" : ""} pending review · {users.length} users</p>
      </div>

      <div style={{ padding: "0 1.5rem 1rem" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          <button className="btn-outline" style={{ marginTop: 0, marginBottom: 0, flex: 1 }} onClick={() => setShowUsers(!showUsers)}>
            {showUsers ? "Hide" : "Show"} users ({users.length})
          </button>
          {pending.length > 0 && (
            <button className="btn-approve" style={{ flex: 1 }} disabled={bulkBusy} onClick={approveAll}>
              {bulkBusy ? "Approving…" : `✓ Approve all (${pending.length})`}
            </button>
          )}
        </div>
        {showUsers && users.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 0", borderBottom: "1px solid #f0ebe2" }}>
                {u.avatar_url && <img src={u.avatar_url} style={{ width: 28, height: 28, borderRadius: "50%" }} alt="" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", color: "#1c1c1a", fontWeight: 500 }}>{u.name || u.email}</div>
                  <div style={{ fontSize: "0.7rem", color: "#9b8f7a" }}>
                    {u.login_count} login{u.login_count !== 1 ? "s" : ""} · last: {new Date(u.last_login).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">✅</div>
          <div className="empty-title">All clear</div>
          <div className="empty-sub">No pending submissions.</div>
        </div>
      ) : (
        <div style={{ padding: "0 1.5rem 1rem" }}>
          {pending.map((item) => (
            <div key={item.id} className="admin-card">
              <div className="admin-card-name">{item.name}</div>
              <div className="admin-card-meta">
                {cap(item.category)} · {item.area} · {item.price || "price unknown"}
                {item.google_rating && ` · ⭐ ${item.google_rating}`}
                {item.is_event && item.event_start && ` · 📅 ${new Date(item.event_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              </div>
              {item.comment && <div style={{ fontSize: "0.78rem", color: "#6b5e4e", marginBottom: "8px", lineHeight: 1.4 }}>{item.comment}</div>}
              {item.vibe_tags?.length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {item.vibe_tags.map(t => <span key={t} className="stop-pill">{t}</span>)}
                </div>
              )}
              {item.tiktok_url && (
                <div style={{ fontSize: "0.72rem", color: "#9b8f7a", marginBottom: "8px" }}>
                  <a href={item.tiktok_url} target="_blank" rel="noreferrer" style={{ color: "#726A4E" }}>View TikTok ↗</a>
                </div>
              )}
              <div style={{ marginBottom: "8px" }}>
                <label className="input-label">Zone (current: {item.zone || "unset"})</label>
                <select className="zone-select" value={zoneEdits[item.id] || item.zone || ""} onChange={e => setZoneEdits(prev => ({ ...prev, [item.id]: e.target.value }))}>
                  <option value="">Keep as is</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "8px", padding: "8px", background: "#fdf6e3", borderRadius: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#1c1c1a", cursor: "pointer" }}>
                  <input type="checkbox" checked={eventEdits[item.id]?.is_event || item.is_event || false} onChange={e => setEventEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], is_event: e.target.checked } }))} />
                  This is a time-bound event
                </label>
                {(eventEdits[item.id]?.is_event || item.is_event) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Start</label>
                      <input type="date" className="zone-select" value={eventEdits[item.id]?.event_start || item.event_start || ""} onChange={e => setEventEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], is_event: true, event_start: e.target.value } }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">End</label>
                      <input type="date" className="zone-select" value={eventEdits[item.id]?.event_end || item.event_end || ""} onChange={e => setEventEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], is_event: true, event_end: e.target.value } }))} />
                    </div>
                  </div>
                )}
              </div>
              <div className="admin-actions">
                <button className="btn-approve" onClick={() => approve(item.id)}>✓ Approve</button>
                <button className="btn-reject" onClick={() => reject(item.id)}>✕ Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreferencesScreen({ preferences, setPreferences, user }) {
  function toggle(pref) {
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  }

  return (
    <div className="pref-wrap">
      <div className="section-title" style={{ marginBottom: "0.25rem" }}>Preferences</div>
      <p className="section-sub">Tell us what you like and we'll filter your Discover feed accordingly. Saved to this device.</p>

      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", marginBottom: "0.75rem", fontWeight: 500 }}>I'm into...</div>
      <div className="pref-chips">
        {PREF_OPTIONS.map(p => (
          <div key={p} className={`pref-chip ${preferences.includes(p) ? (PREF_OPTIONS.indexOf(p) % 2 === 0 ? "sel-blue" : "sel-yellow") : ""}`} onClick={() => toggle(p)}>{p}</div>
        ))}
      </div>

      {preferences.length > 0 && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#f5f0e8", borderRadius: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "#6b5e4e", lineHeight: 1.5 }}>
            ✦ Your Discover tab will prioritise: <strong>{preferences.join(", ")}</strong>
          </div>
        </div>
      )}

      {preferences.length > 0 && (
        <button className="btn-outline" style={{ marginTop: "1rem" }} onClick={() => setPreferences([])}>
          Clear preferences
        </button>
      )}

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e8e2d8" }}>
        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", marginBottom: "0.75rem", fontWeight: 500 }}>Account</div>
        {user && <div style={{ fontSize: "0.82rem", color: "#4a4438", marginBottom: "0.75rem" }}>{user.email}</div>}
        <button className="btn-outline" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );
}

// Profile / settings hub — folds in "For me" (prefs) and Admin so they're off the nav bar.
function MeScreen({ user, preferences, setPreferences, isAdmin, onBadgeUpdate, adminBadge, onStartTour, onStartImportTour }) {
  const [view, setView] = useState(null); // null | "prefs" | "admin"
  const displayName = user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "You");
  const avatar = user?.user_metadata?.avatar_url;

  if (view === "prefs") return (
    <div>
      <button className="btn-ghost" onClick={() => setView(null)} style={{ paddingTop: "1.5rem" }}>← Me</button>
      <PreferencesScreen preferences={preferences} setPreferences={setPreferences} user={user} />
    </div>
  );
  if (view === "admin") return (
    <div>
      <button className="btn-ghost" onClick={() => setView(null)} style={{ paddingTop: "1.5rem" }}>← Me</button>
      <AdminScreen onBadgeUpdate={onBadgeUpdate} />
    </div>
  );

  const row = { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 16px", background: "#fff", border: "1px solid #f0ebe2", borderRadius: 14, marginBottom: 10, cursor: "pointer" };

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">Me</div>
      </div>
      <div style={{ padding: "0 1.5rem 1.25rem", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.4rem", overflow: "hidden", flexShrink: 0 }}>{avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : displayName.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.3rem", color: "#1c1c1a", lineHeight: 1.1 }}>{displayName}</div>
          {user?.email && <div style={{ fontSize: "0.78rem", color: "#9b8f7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>}
        </div>
      </div>
      <div style={{ padding: "0 1.5rem 2rem" }}>
        {onStartTour && (
          <button style={row} onClick={onStartTour}>
            <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>🧭</span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>Take a tour</span><span style={{ display: "block", fontSize: "0.74rem", color: "#9b8f7a" }}>A quick walkthrough of everything the app does</span></span>
            <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
          </button>
        )}
        {onStartImportTour && (
          <button style={row} onClick={onStartImportTour}>
            <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>✋</span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>Try it yourself</span><span style={{ display: "block", fontSize: "0.74rem", color: "#9b8f7a" }}>Add your first save, hands-on — learn by doing</span></span>
            <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
          </button>
        )}
        <button style={row} onClick={() => setView("prefs")}>
          <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>🎯</span>
          <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>For me</span><span style={{ display: "block", fontSize: "0.74rem", color: "#9b8f7a" }}>Tune your Discover feed</span></span>
          <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
        </button>
        {isAdmin && (
          <button style={row} onClick={() => setView("admin")}>
            <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>⚙️</span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>Admin</span><span style={{ display: "block", fontSize: "0.74rem", color: "#9b8f7a" }}>Approve & manage venues</span></span>
            {adminBadge > 0 && <span style={{ background: "#DD4124", color: "#fff", borderRadius: 100, fontSize: "0.66rem", fontWeight: 700, padding: "2px 7px" }}>{adminBadge}</span>}
            <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
          </button>
        )}
        <button style={row} onClick={async () => {
          try {
            const r = await fetch("/api/gdpr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "export", user_id: user.id }) });
            const j = await r.json();
            if (!j.found) { alert("No data found."); return; }
            const blob = new Blob([JSON.stringify(j.data, null, 2)], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "curated-data-export.json"; a.click();
          } catch (e) { alert("Export failed: " + e.message); }
        }}>
          <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>📦</span>
          <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>Export my data</span><span style={{ display: "block", fontSize: "0.74rem", color: "#9b8f7a" }}>Download all your data as JSON</span></span>
          <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
        </button>
        <button style={row} onClick={async () => {
          if (!window.confirm("Are you sure you want to delete your account? This will permanently remove all your data and cannot be undone.")) return;
          if (!window.confirm("This is irreversible. All your saves, plans, connections, and bucket lists will be deleted forever. Proceed?")) return;
          try {
            await fetch("/api/gdpr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", user_id: user.id }) });
            await supabase.auth.signOut();
            localStorage.clear();
            alert("Your account and all data have been deleted.");
          } catch (e) { alert("Delete failed: " + e.message); }
        }}>
          <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>🗑️</span>
          <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#DD4124" }}>Delete my account</span><span style={{ display: "block", fontSize: "0.74rem", color: "#9b8f7a" }}>Permanently delete all your data</span></span>
          <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
        </button>
        <button style={row} onClick={() => supabase.auth.signOut()}>
          <span style={{ fontSize: "1.1rem", width: 24, textAlign: "center" }}>↪</span>
          <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600, color: "#DD4124" }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}

const CAT_PIN_COLOURS = { restaurant: "#DD4124", bar: "#4B342F", cafe: "#9B892F", market: "#A1947D", experience: "#726A4E", outdoor: "#726A4E", museum: "#A1947D", gallery: "#4B342F", nightlife: "#4B342F", event: "#DD4124" };
const CAT_PIN_EMOJI = { restaurant: "🍽️", bar: "🍸", cafe: "☕", market: "🛍️", experience: "✨", outdoor: "🌳", museum: "🏛️", gallery: "🎨", nightlife: "🌙", event: "🎫" };
const CAT_LABEL = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
// Category chips (with dots) for the manual Save form.
const MANUAL_CATS = [["restaurant", "Restaurant", "#DD4124"], ["bar", "Bar", "#4B342F"], ["cafe", "Café", "#9B892F"], ["museum", "Museum", "#A1947D"], ["gallery", "Gallery", "#4B342F"], ["market", "Market", "#A1947D"], ["outdoor", "Outdoor", "#726A4E"], ["experience", "Experience", "#726A4E"]];
// Shared across SavedScreen + SpotsMap (card/list/folder visuals).
const CAT_EMOJI = { restaurant: "\u{1F37D}️", bar: "\u{1F378}", cafe: "☕", market: "\u{1F6CD}️", experience: "✨", outdoor: "\u{1F33F}", museum: "\u{1F3DB}️", gallery: "\u{1F3A8}", nightlife: "\u{1F319}", event: "\u{1F3AB}" };
const CAT_COLOURS = { restaurant: "#DD4124", bar: "#4B342F", cafe: "#9B892F", market: "#A1947D", experience: "#726A4E", outdoor: "#726A4E", museum: "#A1947D", gallery: "#4B342F", nightlife: "#4B342F", event: "#DD4124" };
const SOURCE_ICON = { tiktok: "\u{1F3B5}", instagram: "\u{1F4F8}", screenshot: "\u{1F5BC}️", maps: "\u{1F4CD}", manual: "\u{1F4DD}" };

// Flat black line icons (Lucide-style) for the white coin markers.
const CAT_ICON_PATHS = {
  restaurant: '<path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/><path d="M21 15v7"/>',
  cafe: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
  bar: '<path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/>',
  nightlife: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  market: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  outdoor: '<path d="M12 3 6 11h4l-5 7h14l-5-7h4Z"/><path d="M12 18v4"/>',
  museum: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  gallery: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  experience: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/>',
  event: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>',
};
const ICON_PIN = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
function catSvg(cat, size = 18) {
  const paths = CAT_ICON_PATHS[String(cat || "").toLowerCase()] || ICON_PIN;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#1c1c1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
function coinIcon(inner, size = 36) {
  return window.L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#fffdf8;border:1px solid #e6e0d4;box-shadow:0 2px 7px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;font-weight:700;color:#1c1c1a;font-size:14px">${inner}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

// Cross-tab "done" notifications (show even when the app isn't the active tab).
function ensureNotifyPermission() {
  try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch (e) {}
}
function notify(title, body) {
  try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body, icon: "/favicon.svg" }); } catch (e) {}
}
// Capitalise the first letter (for category labels shown across the app).
// Category labels render in ALL CAPS (e.g. "RESTAURANT") — used everywhere a spot's category shows.
function cap(s) { return s ? String(s).toUpperCase() : ""; }

// ── Delight layer: haptics + confetti ────────────────────────────────────────
// Dependency-free. haptic() is a no-op where the Vibration API is unsupported
// (desktop, iOS Safari). confetti() paints a quick celebratory burst on a
// throwaway full-screen canvas — self-contained, CSP-safe, no external assets.
function haptic(pattern = 15) {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch { /* unsupported */ }
}
function confetti({ count = 80, power = 1, origin = 0.5 } = {}) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = window.innerWidth * dpr);
  const H = (canvas.height = window.innerHeight * dpr);
  const colors = ["#726A4E", "#DFEF87", "#E8C07D", "#C98F6B", "#8FB08C", "#E4B2C4", "#F4E4C1"];
  const cx = W * origin, cy = H * 0.4;
  const parts = Array.from({ length: count }, () => {
    const ang = Math.random() * Math.PI * 2;
    const spd = (6 + Math.random() * 9) * power * dpr;
    return { x: cx, y: cy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 5 * dpr, g: 0.28 * dpr, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.45, size: (5 + Math.random() * 6) * dpr, color: colors[(Math.random() * colors.length) | 0], life: 0, ttl: 70 + Math.random() * 45 };
  });
  let frame = 0;
  (function tick() {
    frame++;
    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    for (const p of parts) {
      if (p.life > p.ttl) continue;
      alive++; p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive > 0 && frame < 240) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}
// A short, bright rising "blip" — a quiet reward sound for adding/ticking a list item.
function blip(freq = 660) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    g.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12);
    o.connect(g); o.start(t); o.stop(t + 0.26);
  } catch { /* audio unavailable */ }
}

// Simple flat line icons for the bottom nav (inherit colour via currentColor).
const NAV_ICON_PATHS = {
  home: '<path d="M12 3l2.2 6.8H21l-5.4 4 2.1 6.7L12 16.4 6.3 20.5l2.1-6.7-5.4-4h6.8z"/>',
  plans: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  saved: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  discover: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  prefs: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  me: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6 6 0 0 1 11 0"/>',
  admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};
function NavIcon({ id }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: NAV_ICON_PATHS[id] || NAV_ICON_PATHS.saved }} />;
}

// Normalise a parsed category to one of the supported categories.
const ALLOWED_CATEGORIES = ["restaurant", "bar", "cafe", "market", "experience", "outdoor", "museum", "gallery", "event", "nightlife"];
const CATEGORY_ALIASES = {
  exhibition: "gallery", exhibitions: "gallery", art: "gallery", "art gallery": "gallery",
  popup: "event", "pop-up": "event", "pop up": "event", show: "event", festival: "event", concert: "event", gig: "event", theatre: "event", theater: "event",
  club: "nightlife", nightclub: "nightlife",
  pub: "bar", cocktail: "bar", "wine bar": "bar",
  coffee: "cafe", "coffee shop": "cafe", "café": "cafe", brunch: "cafe", bakery: "cafe",
  park: "outdoor", garden: "outdoor", walk: "outdoor", nature: "outdoor",
  shop: "market", shopping: "market", store: "market",
};
function normaliseCategory(c) {
  const k = String(c || "").toLowerCase().trim();
  if (CATEGORY_ALIASES[k]) return CATEGORY_ALIASES[k];
  if (ALLOWED_CATEGORIES.includes(k)) return k;
  return "experience";
}

// Google Maps link for a venue (prefers the exact place, then coords, then name).
function googleMapsUrl(v) {
  if (!v) return null;
  if (v.google_place_id) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name || "")}&query_place_id=${v.google_place_id}`;
  if (v.lat && v.lng) return `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`;
  if (v.name) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " London")}`;
  return null;
}

// Collage cover for a list card — always a fixed 2x2 of equal-size tiles so every
// list card looks identical. Missing tiles are filled by cycling the photos.
function ListCover({ items, height = 200 }) {
  // Use only distinct photos so covers never duplicate the same image; the
  // layout adapts to how many photos there are.
  const photos = [...new Set(items.filter(s => s.photo_url).map(s => s.photo_url))];
  const cat = String(items[0]?.category || "").toLowerCase();
  const img = { width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#e9e4da", minHeight: 0, minWidth: 0 };
  if (photos.length === 0) return <div style={{ height, background: "#A1947D", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "2rem" }}>{CAT_EMOJI[cat] || "📁"}</span></div>;
  if (photos.length === 1) return <div style={{ height }}><img src={photos[0]} alt="" style={img} /></div>;
  if (photos.length === 2) return (
    <div style={{ height, display: "grid", gridTemplateRows: "1fr 1fr", gap: 2 }}>
      {photos.map((p, i) => <img key={i} src={p} alt="" style={img} />)}
    </div>
  );
  if (photos.length === 3) return (
    <div style={{ height, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
      <img src={photos[0]} alt="" style={img} />
      <img src={photos[1]} alt="" style={img} />
      <img src={photos[2]} alt="" style={{ ...img, gridColumn: "1 / span 2" }} />
    </div>
  );
  return (
    <div style={{ height, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
      {photos.slice(0, 4).map((p, i) => <img key={i} src={p} alt="" style={img} />)}
    </div>
  );
}

// Full detail view for a saved spot: About, Book/Website, Notes, Add to calendar.
function SpotDetail({ spot, onClose, onShowOnMap, onMakePlan, user, onSpotUpdate, readOnly, onSaveToBoard, savedToBoard, onAddToBucketList }) {
  const cat = normaliseCategory(spot.category);
  const [note, setNote] = useState(() => { if (spot.note != null) return spot.note; try { return localStorage.getItem("cl_note_" + spot.id) || ""; } catch { return ""; } });
  const [savedNote, setSavedNote] = useState(false);
  const [visitDate, setVisitDate] = useState(() => { if (spot.visit_date) return String(spot.visit_date).slice(0, 10); try { return localStorage.getItem("cl_visit_" + spot.id) || (spot.is_event && spot.event_start ? String(spot.event_start).slice(0, 10) : ""); } catch (e) { return ""; } });
  const [calSaved, setCalSaved] = useState(false);
  // Persist to the experiences row (syncs across devices); fall back to
  // localStorage if the column isn't there yet / the write fails.
  async function persist(patch, localKey, localVal) {
    let ok = false;
    // Read-only (viewing a friend's spot): never write to their experiences row — keep it local.
    if (!readOnly) { try { const { error } = await supabase.from("experiences").update(patch).eq("id", spot.id); ok = !error; } catch (e) {} }
    if (!ok) { try { localStorage.setItem(localKey, localVal); } catch (e) {} }
    onSpotUpdate && onSpotUpdate(spot.id, patch);
  }
  async function addToCalendar() { if (!visitDate) return; await persist({ visit_date: visitDate }, "cl_visit_" + spot.id, visitDate); setCalSaved(true); setTimeout(() => setCalSaved(false), 1800); }
  const [myStars, setMyStars] = useState(0);
  const [agg, setAgg] = useState({ avg: null, count: 0 });
  const venueKey = spot.google_place_id || (spot.name || "").toLowerCase().trim();
  const [photos, setPhotos] = useState(spot.photo_url ? [spot.photo_url] : []);
  useEffect(() => {
    if (!spot.google_place_id) return;
    let active = true;
    fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "photos", place_id: spot.google_place_id }) })
      .then(r => r.json()).then(j => { if (active && j.found) setPhotos(prev => [...new Set([...prev, ...j.urls])]); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function refreshRatings() {
    const { data } = await supabase.from("venue_ratings").select("stars,user_id").eq("venue_key", venueKey);
    if (!data) return;
    setAgg({ avg: data.length ? data.reduce((a, r) => a + r.stars, 0) / data.length : null, count: data.length });
    const mine = data.find(r => r.user_id === user?.id);
    if (mine) setMyStars(mine.stars);
  }
  useEffect(() => { refreshRatings(); }, [venueKey]);
  async function rate(n) {
    setMyStars(n);
    try { await supabase.from("venue_ratings").upsert({ user_id: user.id, venue_key: venueKey, venue_name: spot.name, stars: n }, { onConflict: "user_id,venue_key" }); refreshRatings(); } catch (e) {}
  }
  async function saveNote() { await persist({ note }, "cl_note_" + spot.id, note); setSavedNote(true); setTimeout(() => setSavedNote(false), 1500); }
  const bookUrl = spot.website || googleMapsUrl(spot);
  const gcalUrl = (() => {
    const p = new URLSearchParams({ action: "TEMPLATE", text: spot.name || "Visit", details: (spot.comment || "") + (spot.source_url ? `\n${spot.source_url}` : ""), location: spot.address || spot.area || "London" });
    if (spot.is_event && spot.event_start) { const s = (spot.event_start || "").replace(/-/g, ""); const e = new Date(spot.event_end || spot.event_start); e.setDate(e.getDate() + 1); p.set("dates", `${s}/${e.toISOString().slice(0, 10).replace(/-/g, "")}`); }
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  })();
  const Action = ({ href, onClick, children, primary }) => {
    const style = { display: "block", textAlign: "center", padding: "12px", borderRadius: 12, fontSize: "0.85rem", fontWeight: 600, marginBottom: 8, cursor: "pointer", textDecoration: "none", border: primary ? "none" : "1.5px solid #ddd8ce", background: primary ? "#726A4E" : "#fff", color: primary ? "#fff" : "#4a4438" };
    return href ? <a href={href} target="_blank" rel="noreferrer" style={style}>{children}</a> : <button onClick={onClick} style={{ ...style, width: "100%" }}>{children}</button>;
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#f7f6f2", zIndex: 1200, overflowY: "auto", animation: "fadeIn 0.2s" }}>
      <div style={{ position: "relative", height: 240, background: photos.length ? "#e9e4da" : (CAT_COLOURS[cat] || "#726A4E") }}>
        <div style={{ display: "flex", height: "100%", overflowX: "auto", scrollSnapType: "x mandatory" }}>
          {photos.map((p, i) => <img key={i} src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", flexShrink: 0, scrollSnapAlign: "start" }} />)}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(0,0,0,0.6))", pointerEvents: "none" }} />
        {photos.length > 1 && <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 100, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 600 }}>📷 {photos.length}</div>}
        <button onClick={onClose} style={{ position: "absolute", top: 14, left: 14, width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: "1.1rem", color: "#DD4124", fontWeight: 700 }}>←</button>
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, pointerEvents: "none" }}>
          <div style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'Aleo', Georgia, serif", fontSize: "1.7rem", lineHeight: 1.1, textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}>{spot.name}</div>
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.25rem 6rem" }}>
        <div style={{ fontSize: "0.78rem", color: "#6b5e4e", marginBottom: 14 }}>
          {cap(cat)}{spot.zone ? ` · ${spot.zone}` : ""}{spot.area ? ` · ${spot.area}` : ""}{spot.google_rating ? ` · ⭐ ${spot.google_rating}` : ""}{spot.price ? ` · ${spot.price}` : ""}
        </div>

        <div data-tour="spot-rating" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 12px", background: "#fff", border: "1px solid #f0ebe2", borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b8f7a", fontWeight: 600, marginBottom: 2 }}>Your rating</div>
            <div style={{ fontSize: "1.3rem", letterSpacing: 2 }}>
              {[1, 2, 3, 4, 5].map(n => <span key={n} onClick={() => rate(n)} style={{ cursor: "pointer", color: n <= myStars ? "#DD4124" : "#ddd6c8" }}>★</span>)}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b8f7a", fontWeight: 600, marginBottom: 2 }}>Average</div>
            <div style={{ fontSize: "0.9rem", color: "#1c1c1a", fontWeight: 600 }}>{agg.avg ? `★ ${agg.avg.toFixed(1)}` : "—"} <span style={{ fontSize: "0.72rem", color: "#9b8f7a", fontWeight: 400 }}>({agg.count})</span></div>
          </div>
        </div>

        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", fontWeight: 600, marginBottom: 6 }}>About</div>
        <div style={{ fontSize: "0.9rem", color: "#4a4438", lineHeight: 1.5, marginBottom: 8 }}>{spot.comment || "No description yet."}</div>
        {spot.address && <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: 4 }}>📍 {spot.address}</div>}
        {spot.is_event && (spot.event_start || spot.event_time) && <div style={{ fontSize: "0.78rem", color: "#726A4E", marginBottom: 4 }}>📅 {spot.event_start ? new Date(spot.event_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}{spot.event_time ? ` · ${spot.event_time}` : ""}</div>}
        {spot.vibe_tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0 16px" }}>{spot.vibe_tags.slice(0, 6).map((t, i) => <span key={i} style={{ fontSize: "0.66rem", background: "#f0ebe2", color: "#6b5e4e", padding: "3px 9px", borderRadius: 100 }}>{String(t).replace(/_/g, " ")}</span>)}</div>}

        <div style={{ marginTop: 14 }}>
          <div data-tour="spot-book"><Action href={bookUrl} primary>{spot.website ? "🔗 Book / Website" : "🔗 Open in Google Maps"}</Action></div>
          {readOnly && onSaveToBoard && <Action onClick={onSaveToBoard}>{savedToBoard ? "✓ Saved to your board" : "＋ Save to my board"}</Action>}
          {readOnly && !onSaveToBoard && savedToBoard && <div style={{ textAlign: "center", padding: "12px", borderRadius: 12, fontSize: "0.85rem", fontWeight: 600, marginBottom: 8, background: "#f5f0e8", color: "#726A4E" }}>✓ Saved to your board</div>}
          {!readOnly && (
          <div style={{ padding: "12px", background: "#fff", border: "1.5px solid #ddd8ce", borderRadius: 12, marginBottom: 8 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4a4438", marginBottom: 8 }}>📅 Add to your calendar</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="input-field" style={{ flex: 1 }} />
              <button onClick={addToCalendar} disabled={!visitDate} style={{ border: "none", background: visitDate ? "#726A4E" : "#cfc8ba", color: "#fff", borderRadius: 10, padding: "0 18px", fontWeight: 600, fontSize: "0.82rem", cursor: visitDate ? "pointer" : "default" }}>{calSaved ? "✓ Added" : "Add"}</button>
            </div>
            <div style={{ fontSize: "0.68rem", color: "#9b8f7a", marginTop: 6 }}>Shows in your Saved → Calendar.{" "}<a href={gcalUrl} target="_blank" rel="noreferrer" style={{ color: "#9b8f7a", textDecoration: "underline" }}>Google Calendar ↗</a></div>
          </div>
          )}
          {onShowOnMap && <Action onClick={() => onShowOnMap(spot)}>📍 Show on map</Action>}
          {onMakePlan && <Action onClick={() => onMakePlan(spot)}>✦ Make a plan based on this</Action>}
          {onAddToBucketList && <Action onClick={() => onAddToBucketList(spot)}>📋 Add to bucket list</Action>}
          {spot.source_url && (spot.source_type === "tiktok" || spot.source_type === "instagram") && <Action href={spot.source_url}>{SOURCE_ICON[spot.source_type]} View original ↗</Action>}
        </div>

        {!readOnly && <>
        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", fontWeight: 600, margin: "18px 0 6px" }}>Notes</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add your own notes — who recommended it, what to order, etc." className="input-field" rows={4} style={{ resize: "vertical", width: "100%" }} />
        <button className="btn btn-teal" style={{ marginTop: 8 }} onClick={saveNote}>{savedNote ? "✓ Saved" : "Save notes"}</button>
        </>}
      </div>
    </div>
  );
}

// The big photo card used on the map (pin tap) AND in the swipe-up list — identical look.
function BigSpotCard({ s, photo }) {
  return (
    <>
      <div style={{ position: "relative", height: 175, background: "#e9e4da" }}>
        {photo && <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 18px" }}>
          <div style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Aleo', Georgia, serif", fontWeight: 400, fontSize: "1.55rem", textAlign: "center", lineHeight: 1.15, textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}>{s.name}</div>
        </div>
      </div>
      <div style={{ padding: "10px 12px 12px", textAlign: "center" }}>
        <div style={{ fontSize: "0.76rem", color: "#6b5e4e" }}>
          {cap(normaliseCategory(s.category))}{s.google_rating ? ` · ⭐ ${s.google_rating}` : ""}{s.area ? ` · ${s.area}` : ""}{s.price ? ` · ${s.price}` : ""}
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 6 }}>
          {s.source_url && (s.source_type === "tiktok" || s.source_type === "instagram") && <a href={s.source_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "0.7rem", color: "#726A4E", fontWeight: 500 }}>{SOURCE_ICON[s.source_type] || "🔗"} View source ↗</a>}
          {googleMapsUrl(s) && <a href={googleMapsUrl(s)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "0.7rem", color: "#726A4E", fontWeight: 500 }}>📍 Google Maps</a>}
        </div>
      </div>
    </>
  );
}

// Map of saved spots — Yonder-style: white "coin" markers, clustering, bottom card.
// listName set => list-detail mode (no category chips; swipe-up shows all places).
function SpotsMap({ saves, listName, focusSpot, onCategory, peek, peekHeight, onExpand }) {
  const mapRef = useRef(null);
  const instRef = useRef(null);
  const clusterRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cardPhoto, setCardPhoto] = useState(null);
  const photoCacheRef = useRef({});
  const pts = saves.filter(s => s.lat && s.lng);
  const cats = [...new Set(pts.map(s => normaliseCategory(s.category)))].sort();

  useEffect(() => {
    let cancelled = false;
    const ensureCss = (id, href) => { if (!document.getElementById(id)) { const l = document.createElement("link"); l.id = id; l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); } };
    const ensureScript = (id, src) => new Promise((res) => {
      let s = document.getElementById(id);
      if (s) { if (s.dataset.loaded) res(); else s.addEventListener("load", () => res()); return; }
      s = document.createElement("script"); s.id = id; s.src = src;
      s.addEventListener("load", () => { s.dataset.loaded = "1"; res(); });
      document.head.appendChild(s);
    });
    (async () => {
      ensureCss("leaflet-css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      ensureCss("mcluster-css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
      if (!window.L) await ensureScript("leaflet-js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      if (!window.L.markerClusterGroup) await ensureScript("mcluster-js", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || instRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [51.505, -0.09], zoom: 11, zoomControl: false, attributionControl: false });
    const mbToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const base = mbToken
      ? L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${mbToken}`, { maxZoom: 20, attribution: "© Mapbox © OpenStreetMap" })
      : L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { subdomains: "abcd", attribution: "© OpenStreetMap, © CARTO", maxZoom: 20 });
    let fellBack = false;
    base.on("tileerror", () => {
      if (mbToken && !fellBack) {
        fellBack = true;
        console.warn("[map] Mapbox tiles blocked/failing — falling back to CARTO");
        try { map.removeLayer(base); } catch (e) {}
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { subdomains: "abcd", attribution: "© OpenStreetMap, © CARTO", maxZoom: 20 }).addTo(map);
      }
    });
    base.addTo(map);

    let cluster;
    try {
      cluster = L.markerClusterGroup({
        maxClusterRadius: 55, showCoverageOnHover: false, spiderfyOnMaxZoom: true, chunkedLoading: true,
        iconCreateFunction: (c) => { const n = c.getChildCount(); const sz = n < 10 ? 38 : n < 100 ? 46 : 54; return coinIcon(n, sz); },
      });
    } catch (e) { console.error("[map] markercluster unavailable, using plain layer", e); cluster = L.layerGroup(); }
    map.addLayer(cluster);
    clusterRef.current = cluster;
    map.on("click", () => setSelected(null));
    instRef.current = map;

    // Grey-map guard: make sure the map measures its container once it's actually visible.
    map.whenReady(() => map.invalidateSize());
    const timers = [80, 300, 800].map(d => setTimeout(() => map.invalidateSize(), d));
    let ro;
    try { ro = new ResizeObserver(() => map.invalidateSize()); ro.observe(mapRef.current); } catch (e) {}
    return () => { timers.forEach(clearTimeout); if (ro) ro.disconnect(); map.remove(); instRef.current = null; clusterRef.current = null; };
  }, [loaded]);

  // (Re)populate markers when loaded or the category filter changes.
  useEffect(() => {
    if (!loaded || !clusterRef.current) return;
    const L = window.L;
    const cl = clusterRef.current;
    cl.clearLayers();
    const shown = filter === "all" ? pts : pts.filter(s => normaliseCategory(s.category) === filter);
    shown.forEach(s => {
      const m = L.marker([s.lat, s.lng], { icon: coinIcon(catSvg(normaliseCategory(s.category))) });
      m.on("click", () => setSelected(s));
      cl.addLayer(m);
    });
    if (shown.length && instRef.current) {
      try { instRef.current.fitBounds(L.latLngBounds(shown.map(s => [s.lat, s.lng])).pad(0.2), { maxZoom: 15 }); } catch (e) {}
      setTimeout(() => instRef.current && instRef.current.invalidateSize(), 60);
    }
  }, [loaded, filter]);

  // Card image: the stored photo_url is already the Google Maps photo (set at save
  // time and backfilled below), so show it instantly — no fetch, no placeholder.
  // Only fetch Google as a last resort if a spot somehow has no stored photo.
  useEffect(() => {
    if (!selected) { setCardPhoto(null); return; }
    if (selected.photo_url) { setCardPhoto(selected.photo_url); return; }
    const pid = selected.google_place_id;
    if (!pid) { setCardPhoto(null); return; }
    if (photoCacheRef.current[pid]) { setCardPhoto(photoCacheRef.current[pid]); return; }
    setCardPhoto(null);
    let active = true;
    fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", place_id: pid }) })
      .then(r => r.json())
      .then(j => { if (active && j.found) { photoCacheRef.current[pid] = j.url; setCardPhoto(j.url); } })
      .catch(() => {});
    return () => { active = false; };
  }, [selected]);

  // Pan/zoom the map to a spot when a list card is tapped (no card overlay).
  useEffect(() => {
    if (!focusSpot || !instRef.current || !focusSpot.lat) return;
    try { instRef.current.setView([focusSpot.lat, focusSpot.lng], 16, { animate: true }); } catch (e) {}
  }, [focusSpot]);

  function resetView() {
    if (!instRef.current || !pts.length) return;
    try { instRef.current.fitBounds(window.L.latLngBounds(pts.map(s => [s.lat, s.lng])).pad(0.2), { maxZoom: 15 }); } catch (e) {}
    setSelected(null);
  }

  if (!pts.length) return (
    <div className="empty-state"><div className="empty-emoji">🗺️</div><div className="empty-title">No mappable spots</div><div className="empty-sub">Saves with a known location show here. Most do once Google finds them.</div></div>
  );

  const selCat = normaliseCategory(selected?.category);
  const capitalise = (s) => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "";
  const filteredPts = filter === "all" ? pts : pts.filter(s => normaliseCategory(s.category) === filter);
  const filterLabel = CAT_LABEL[filter] || capitalise(filter);
  const mapH = peek ? (peekHeight || 150) : (listName || onCategory) ? 380 : 440;

  // Peek mode: a live, non-interactive preview that expands the full map on tap.
  if (peek) return (
    <div onClick={onExpand} style={{ position: "relative", cursor: "pointer", marginBottom: 12 }}>
      {!loaded && <div style={{ height: mapH, background: "#eef3ee", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8f7a", fontSize: "0.82rem" }}>Loading map…</div>}
      <div ref={mapRef} style={{ height: mapH, borderRadius: 16, overflow: "hidden", border: "1px solid #e6e0d4", display: loaded ? "block" : "none" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 16, zIndex: 900 }} />
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 950, background: "rgba(255,255,255,0.92)", color: "#1c1c1a", borderRadius: 100, padding: "5px 11px", fontSize: "0.72rem", fontWeight: 600 }}>📍 {pts.length} on the map</div>
      <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 950, background: "#1c1c1a", color: "#fff", borderRadius: 100, padding: "6px 13px", fontSize: "0.74rem", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>Open map ›</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: "#9b8f7a", marginBottom: 8 }}>{pts.length} {listName ? "place" : "spot"}{pts.length !== 1 ? "s" : ""} {listName ? `in ${listName}` : "on the map"} · tap a pin for the card</div>
      <div style={{ position: "relative" }}>
        {!loaded && <div style={{ height: mapH, background: "#eef3ee", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8f7a", fontSize: "0.82rem" }}>Loading map…</div>}
        <div ref={mapRef} style={{ height: mapH, borderRadius: 16, overflow: "hidden", border: "1px solid #e6e0d4", display: loaded ? "block" : "none" }} />
        {loaded && <button onClick={resetView} title="Reset map" style={{ position: "absolute", top: 10, right: 10, zIndex: 470, width: 36, height: 36, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>⤢</button>}

        {loaded && !listName && !selected && !sheetOpen && cats.length > 1 && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, zIndex: 450, display: "flex", gap: 8, padding: "0 10px", overflowX: "auto" }}>
            <button onClick={() => { setFilter("all"); setSheetOpen(false); setSelected(null); onCategory && onCategory(""); }} style={{ fontSize: "0.72rem", padding: "7px 13px", borderRadius: 100, whiteSpace: "nowrap", cursor: "pointer", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", flexShrink: 0, background: filter === "all" ? "#1c1c1a" : "#fff", color: filter === "all" ? "#fff" : "#1c1c1a", fontWeight: filter === "all" ? 600 : 500 }}>All</button>
            {cats.map(c => (
              <button key={c} onClick={() => { const off = filter === c; setFilter(off ? "all" : c); setSelected(null); setSheetOpen(false); onCategory && onCategory(off ? "" : c); }} style={{ fontSize: "0.72rem", padding: "7px 13px", borderRadius: 100, whiteSpace: "nowrap", cursor: "pointer", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", flexShrink: 0, background: filter === c ? "#1c1c1a" : "#fff", color: filter === c ? "#fff" : "#1c1c1a", fontWeight: filter === c ? 600 : 500 }}>
                {CAT_LABEL[c] || capitalise(c)}{filter === c ? " ✕" : ""}
              </button>
            ))}
          </div>
        )}

        {loaded && !listName && !onCategory && !selected && !sheetOpen && filter !== "all" && filteredPts.length > 0 && (
          <div
            onClick={() => setSheetOpen(true)}
            onTouchStart={(e) => { e.currentTarget._sy = e.touches[0].clientY; }}
            onTouchEnd={(e) => { const dy = (e.currentTarget._sy || 0) - e.changedTouches[0].clientY; if (dy > 30) setSheetOpen(true); }}
            style={{ position: "absolute", left: 10, right: 10, bottom: 54, zIndex: 460, background: "#fff", borderRadius: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", padding: "12px 14px 10px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 34, height: 4, borderRadius: 2, background: "#ddd6c8" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1c1a" }}>⌃ Swipe up for all {filteredPts.length} {filterLabel}</span>
          </div>
        )}

        {loaded && !listName && !onCategory && sheetOpen && filter !== "all" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 600, background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", animation: "cardIn 0.25s ease" }}>
            <div
              onTouchStart={(e) => { e.currentTarget._sy = e.touches[0].clientY; }}
              onTouchEnd={(e) => { const dy = e.changedTouches[0].clientY - (e.currentTarget._sy || 0); if (dy > 40) setSheetOpen(false); }}
              style={{ padding: "12px 14px 10px", borderBottom: "1px solid #f0ebe2", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", width: 34, height: 4, borderRadius: 2, background: "#ddd6c8" }} />
              <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1rem", color: "#1c1c1a" }}>{listName || filterLabel} ({filteredPts.length})</div>
              <button onClick={() => setSheetOpen(false)} style={{ border: "none", background: "#f5f0e8", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: "0.95rem", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: "12px 12px 16px", flex: 1 }}>
              {filteredPts.map(s => (
                <div key={s.id} onClick={() => { setSelected(s); setSheetOpen(false); }} style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", border: "1px solid #f0ebe2", background: "#fff", marginBottom: 14, cursor: "pointer" }}>
                  <BigSpotCard s={s} photo={s.photo_url} />
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div key={selected.id} style={{ position: "absolute", left: 10, right: 10, bottom: 10, zIndex: 500, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.28)", background: "#fff", animation: "cardSwap 0.2s ease-out" }}>
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: "0.95rem", lineHeight: 1, zIndex: 3 }}>×</button>
            <BigSpotCard s={selected} photo={cardPhoto} />
          </div>
        )}
      </div>
    </div>
  );
}

// Calendar of time-bound saves (events with a date).
// Unified "agenda" calendar: dated events + spots (visit_date) + scheduled plans
// (localStorage) + dated bucket-list items (target_date). Tap any day to see what's
// on and to add a saved spot or build a plan for it.
const CAL_TYPE = {
  event: { colour: "#9B892F", emoji: "🎫", label: "Event" },
  spot:  { colour: "#DD4124", emoji: "📌", label: "Spot" },
  plan:  { colour: "#4B342F", emoji: "🗺️", label: "Plan" },
  blist: { colour: "#726A4E", emoji: "✨", label: "Bucket list" },
};
function SpotsCalendar({ saves, user, onBuildPlan, onShare }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selDay, setSelDay] = useState(null);
  const [blistItems, setBlistItems] = useState([]); // bucket-list items with a target date
  const [adding, setAdding] = useState(false);      // "add a saved spot to this day" picker
  const [pickFolder, setPickFolder] = useState(null); // which folder is open in the add picker
  const [tick, setTick] = useState(0);              // bump to recompute after assigning a date

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("shared_list_items").select("id,name,category,area,photo_url,target_date").not("target_date", "is", null)
      .then(({ data }) => setBlistItems(data || [])).catch(() => {});
  }, [user]);

  const visitOf = (s) => { if (s.visit_date) return s.visit_date; try { return localStorage.getItem("cl_visit_" + s.id) || null; } catch (e) { return null; } };

  // Source 1+2: dated events and spots with a planned visit date.
  const spotEvents = saves.map(s => {
    if (s.is_event && s.event_start) return { ...s, _type: "event" };
    const v = visitOf(s);
    return v ? { ...s, event_start: v, event_end: null, _type: "spot" } : null;
  }).filter(Boolean);
  // Source 3: itineraries you've scheduled to a date.
  let storedPlans = []; try { storedPlans = JSON.parse(localStorage.getItem("cl_plans") || "[]"); } catch (e) {}
  const planEvents = storedPlans.filter(p => p.scheduledDate).map(p => ({ id: "plan-" + (p.id || p.scheduledDate), name: p.result?.title || "Your plan", event_start: p.scheduledDate, _type: "plan", _stops: (p.result?.stops || []).length, _tagline: p.result?.tagline }));
  // Source 4: bucket-list items with a target date.
  const blistEvents = blistItems.map(b => ({ id: "blist-" + b.id, name: b.name, category: b.category, area: b.area, photo_url: b.photo_url, event_start: b.target_date, _type: "blist" }));
  const events = [...spotEvents, ...planEvents, ...blistEvents];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = base.getFullYear(), month = base.getMonth();
  const monthName = base.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, "0");
  const dayStr = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const parse = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const eventsOn = (dayDate) => events.filter(e => {
    const s = parse(e.event_start); const en = e.event_end ? parse(e.event_end) : s;
    return dayDate >= s && dayDate <= en;
  });
  const typesOn = (dayDate) => [...new Set(eventsOn(dayDate).map(e => e._type))];
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  const fmtFull = (d) => d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" }) : "";
  const gcal = (e) => {
    const s = (e.event_start || "").replace(/-/g, "");
    const endD = new Date(e.event_end || e.event_start); endD.setDate(endD.getDate() + 1);
    const en = endD.toISOString().slice(0, 10).replace(/-/g, "");
    const p = new URLSearchParams({ action: "TEMPLATE", text: e.name || "Event", dates: `${s}/${en}`, details: (e.comment || "") + (e.source_url ? `\n${e.source_url}` : ""), location: e.address || "" });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  };

  async function assignSpot(s) {
    if (!selDay) return;
    const dateStr = dayStr(selDay);
    try { localStorage.setItem("cl_visit_" + s.id, dateStr); } catch (e) {}
    try { if (user?.id) await supabase.from("experiences").update({ visit_date: dateStr }).eq("id", s.id).eq("user_id", user.id); } catch (e) {}
    setAdding(false); setPickFolder(null); setTick(t => t + 1);
  }

  // Remove an entry from the calendar (clears its date — doesn't delete the spot/plan/item).
  async function unschedule(e) {
    if (e._type === "spot") {
      try { localStorage.removeItem("cl_visit_" + e.id); } catch (err) {}
      try { if (user?.id) await supabase.from("experiences").update({ visit_date: null }).eq("id", e.id).eq("user_id", user.id); } catch (err) {}
    } else if (e._type === "plan") {
      try { const ps = JSON.parse(localStorage.getItem("cl_plans") || "[]"); const u = ps.map(p => ("plan-" + (p.id || p.scheduledDate)) === e.id ? { ...p, scheduledDate: null } : p); localStorage.setItem("cl_plans", JSON.stringify(u)); } catch (err) {}
    } else if (e._type === "blist") {
      const realId = e.id.replace("blist-", "");
      setBlistItems(prev => prev.filter(b => b.id !== realId));
      try { await supabase.from("shared_list_items").update({ target_date: null }).eq("id", realId); } catch (err) {}
    }
    setTick(t => t + 1);
  }

  // Best-effort in-app reminder: notifies while the app is open on the day (Google
  // Calendar handles cross-device reminders — that's the "+ Google Calendar" link).
  function remind(e) {
    ensureNotifyPermission();
    try {
      const key = "cl_reminders";
      const r = JSON.parse(localStorage.getItem(key) || "{}");
      r[e.id] = { date: e.event_start, name: e.name };
      localStorage.setItem(key, JSON.stringify(r));
    } catch (err) {}
    setTick(t => t + 1);
  }
  const hasReminder = (id) => { try { return !!JSON.parse(localStorage.getItem("cl_reminders") || "{}")[id]; } catch (e) { return false; } };

  function shareEvent(e) {
    if (!onShare) return;
    if (e._type === "plan") { try { const p = JSON.parse(localStorage.getItem("cl_plans") || "[]").find(x => ("plan-" + (x.id || x.scheduledDate)) === e.id); if (p) onShare({ kind: "plan", title: p.result?.title || "An itinerary", payload: { plan: p.result, times: p.times } }); } catch (err) {} }
    else { onShare({ kind: "list", title: e.name, payload: { name: e.name, spots: [{ name: e.name, category: e.category, area: e.area, address: e.address, photo_url: e.photo_url, google_place_id: e.google_place_id, lat: e.lat, lng: e.lng }] } }); }
  }

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const upcoming = [...events].filter(e => parse(e.event_end || e.event_start) >= today).sort((a, b) => parse(a.event_start) - parse(b.event_start));
  const shown = selDay ? eventsOn(new Date(year, month, selDay)) : upcoming;
  const undatedSaves = saves.filter(s => !s.is_event && !visitOf(s));
  // Group the undated saves by folder for the add picker.
  const FOLDER_BY_CAT = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
  const folderOf = (s) => s.folder || FOLDER_BY_CAT[String(s.category || "").toLowerCase()] || "Other";
  const undatedByFolder = undatedSaves.reduce((acc, s) => { const f = folderOf(s); (acc[f] = acc[f] || []).push(s); return acc; }, {});
  const undatedFolders = Object.keys(undatedByFolder).sort();

  const dot = (c) => <div key={c} style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "0 0 10px", fontSize: "0.62rem", color: "#9b8f7a" }}>
        {Object.entries(CAL_TYPE).map(([k, v]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: v.colour }} />{v.label}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => { setMonthOffset(monthOffset - 1); setSelDay(null); }} style={{ border: "none", background: "#f5f0e8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>‹</button>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1rem", color: "#1c1c1a" }}>{monthName}</div>
        <button onClick={() => { setMonthOffset(monthOffset + 1); setSelDay(null); }} style={{ border: "none", background: "#f5f0e8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, fontSize: "0.6rem", color: "#9b8f7a", textAlign: "center", marginBottom: 4 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dayDate = new Date(year, month, d);
          const dayEvents = eventsOn(dayDate);
          const types = [...new Set(dayEvents.map(e => e._type))];
          const photo = dayEvents.find(e => e.photo_url)?.photo_url;
          const isToday = dayDate.getTime() === today.getTime();
          const isSel = selDay === d;
          const showImg = photo && !isSel;
          return (
            <div key={i} onClick={() => { setSelDay(isSel ? null : d); setAdding(false); setPickFolder(null); }}
              style={{ position: "relative", minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 9, fontSize: "0.74rem", cursor: "pointer", overflow: "hidden",
                background: isSel ? "#726A4E" : showImg ? "#222" : isToday ? "#eef3d8" : "transparent", color: (isSel || showImg) ? "#fff" : "#1c1c1a", fontWeight: types.length ? 700 : 400,
                outline: isToday && !isSel ? "1.5px solid #cdd89a" : "none" }}>
              {showImg && <><img src={photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.34)" }} /></>}
              <span style={{ position: "relative", textShadow: showImg ? "0 1px 3px rgba(0,0,0,0.85)" : "none" }}>{d}</span>
              <div style={{ position: "relative", display: "flex", gap: 2, marginTop: 2, height: 5 }}>
                {isSel ? (types.length ? dot("#fff") : null)
                  : showImg ? (types.length > 1 ? dot("#fff") : null)
                  : types.slice(0, 3).map(t => dot(CAL_TYPE[t].colour))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b8f7a", fontWeight: 500, margin: "16px 0 8px" }}>
        {selDay ? fmtFull(new Date(year, month, selDay)) : "Upcoming"}
      </div>
      {shown.length === 0 && <div style={{ fontSize: "0.8rem", color: "#9b8f7a" }}>{selDay ? "Nothing planned yet — add a spot or build a plan below." : "No upcoming dates. Tap a day to plan something."}</div>}
      {shown.map(e => {
        const meta = CAL_TYPE[e._type] || CAL_TYPE.spot;
        return (
          <div key={e.id} style={{ display: "flex", gap: 10, padding: 10, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 12, marginBottom: 8, borderLeft: `3px solid ${meta.colour}` }}>
            <div style={{ width: 46, height: 46, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: meta.colour, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              {e.photo_url ? <img src={e.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{meta.emoji}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "#1c1c1a" }}>{e.name}</div>
              <div style={{ fontSize: "0.72rem", color: meta.colour, marginTop: 2 }}>
                📅 {fmt(e.event_start)}{e.event_end && e.event_end !== e.event_start ? ` – ${fmt(e.event_end)}` : ""}{e.event_time ? ` · 🕐 ${e.event_time}` : ""}
                {e._type === "plan" ? ` · ${e._stops} stop${e._stops !== 1 ? "s" : ""}` : ""}
                {e._type === "blist" ? " · bucket list" : ""}
              </div>
              {e.area && <div style={{ fontSize: "0.68rem", color: "#9b8f7a", marginTop: 2 }}>📍 {e.area}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, alignItems: "center" }}>
                <a href={gcal(e)} target="_blank" rel="noreferrer" style={{ fontSize: "0.66rem", color: "#726A4E", fontWeight: 600 }}>+ Google Calendar</a>
                <button onClick={() => remind(e)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: "0.66rem", color: hasReminder(e.id) ? "#DD4124" : "#726A4E", fontWeight: 600 }}>{hasReminder(e.id) ? "🔔 Reminder set" : "🔔 Remind me"}</button>
                {onShare && <button onClick={() => shareEvent(e)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: "0.66rem", color: "#726A4E", fontWeight: 600 }}>↗ Share</button>}
                <button onClick={() => unschedule(e)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: "0.66rem", color: "#b3a892", fontWeight: 600 }}>✕ Remove</button>
                {e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.66rem", color: "#9b8f7a" }}>Source ↗</a>}
              </div>
            </div>
          </div>
        );
      })}

      {selDay && !adding && (
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => setAdding(true)} disabled={undatedSaves.length === 0} style={{ flex: 1, border: "1.5px solid #726A4E", background: "#fff", color: undatedSaves.length ? "#726A4E" : "#c9bfae", borderRadius: 100, padding: "9px 12px", fontSize: "0.78rem", fontWeight: 600, cursor: undatedSaves.length ? "pointer" : "default" }}>＋ Add a saved spot</button>
          {onBuildPlan && <button onClick={() => onBuildPlan(eventsOn(new Date(year, month, selDay)).filter(e => e._type === "spot"))} style={{ flex: 1, border: "none", background: "#726A4E", color: "#fff", borderRadius: 100, padding: "9px 12px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>✦ Build a plan</button>}
        </div>
      )}
      {selDay && adding && (
        <div style={{ marginTop: 8, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 12, padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {pickFolder && <button onClick={() => setPickFolder(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.78rem", color: "#726A4E", fontWeight: 600, padding: 0 }}>‹ Lists</button>}
            <div style={{ fontSize: "0.74rem", color: "#9b8f7a" }}>{pickFolder ? `${pickFolder} → ${fmt(dayStr(selDay))}` : `Pick a list · ${fmtFull(new Date(year, month, selDay))}`}</div>
          </div>
          {!pickFolder && undatedFolders.length === 0 && <div style={{ fontSize: "0.78rem", color: "#9b8f7a" }}>No undated spots left to add.</div>}
          {!pickFolder && undatedFolders.map(f => (
            <button key={f} onClick={() => setPickFolder(f)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "9px 8px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer" }}>
              <span style={{ fontSize: "1.05rem", width: 28, textAlign: "center" }}>📁</span>
              <span style={{ flex: 1, fontSize: "0.84rem", fontWeight: 600, color: "#1c1c1a" }}>{f}</span>
              <span style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>{undatedByFolder[f].length}</span>
              <span style={{ color: "#c9bfae", fontSize: "1.05rem" }}>›</span>
            </button>
          ))}
          {pickFolder && (undatedByFolder[pickFolder] || []).map(s => (
            <button key={s.id} onClick={() => assignSpot(s)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "7px 8px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer" }}>
              {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 32, height: 32, borderRadius: 7, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📍</div>}
              <span style={{ flex: 1, minWidth: 0, fontSize: "0.82rem", fontWeight: 500, color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
              <span style={{ color: "#726A4E", fontWeight: 700 }}>＋</span>
            </button>
          ))}
          <button onClick={() => { setAdding(false); setPickFolder(null); }} style={{ width: "100%", border: "none", background: "#f5f0e8", color: "#6b5e4e", borderRadius: 100, padding: "8px", fontSize: "0.76rem", cursor: "pointer", marginTop: 6 }}>Done</button>
        </div>
      )}
    </div>
  );
}

// First-run import walkthrough: 4 steps over the real screenshot flow.
const IMPORT_TOUR = [
  { title: "Add a place", body: "Add a screenshot, paste a TikTok or Instagram link, or type a place in by hand. No screenshot? Tap “Try an example”." },
  { title: "Save it to a list", body: "Pick a folder — or make a new one — so it's easy to find later." },
  { title: "Save to your board", body: "This adds the place to your board." },
  { title: "Here it is", body: "Your saved places live here — tap in anytime." },
];

// Ref-based spotlight: measures the live target every frame (getBoundingClientRect),
// dims around it leaving a tap-through hole, waits for a not-yet-mounted target, and
// fails open (dismisses) if the target never appears within the timeout.
function TourSpotlight({ targetRef, step, last, onDone, onSkip }) {
  const [rect, setRect] = useState(null);
  const skipRef = useRef(onSkip); skipRef.current = onSkip;
  useEffect(() => {
    let raf, dead = false, nullSince = null;
    const tick = () => {
      const el = targetRef && targetRef.current;
      const r = el && el.getBoundingClientRect();
      if (r && (r.width || r.height)) { setRect({ t: r.top, l: r.left, w: r.width, h: r.height }); nullSince = null; }
      else { setRect(null); if (nullSince == null) nullSince = Date.now(); else if (Date.now() - nullSince > 6000) { skipRef.current(); return; } }
      if (!dead) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [targetRef]);

  const info = IMPORT_TOUR[step];
  const dim = "rgba(0,0,0,0.58)";
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const P = 8;
  const hole = rect ? { t: rect.t - P, l: rect.l - P, w: rect.w + P * 2, h: rect.h + P * 2 } : null;
  const below = hole ? hole.t + hole.h + 160 < vh : true;
  const tip = (
    <div style={{ pointerEvents: "auto", background: "#1c1c1a", color: "#fff", borderRadius: 14, padding: "14px 16px", maxWidth: 320, margin: "0 auto", boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>
      <div style={{ fontSize: "0.68rem", color: "#8f8ba3", marginBottom: 4 }}>Step {step + 1} of {IMPORT_TOUR.length}</div>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 3 }}>{info.title}</div>
      <div style={{ fontSize: "0.83rem", lineHeight: 1.45, color: "#d9d7e6" }}>{info.body}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <button onClick={onSkip} style={{ border: "none", background: "none", color: "#b6b3c9", fontSize: "0.76rem", cursor: "pointer", padding: 0 }}>Skip tour</button>
        {last && <button onClick={onDone} style={{ border: "none", background: "#726A4E", color: "#fff", borderRadius: 9, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}>Got it</button>}
      </div>
    </div>
  );

  // Container passes touches through; only the dim rects + tooltip capture, so the hole is live.
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1500, pointerEvents: "none" }}>
      {hole ? (<>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, hole.t), background: dim, pointerEvents: "auto" }} />
        <div style={{ position: "fixed", top: hole.t + hole.h, left: 0, right: 0, bottom: 0, background: dim, pointerEvents: "auto" }} />
        <div style={{ position: "fixed", top: hole.t, left: 0, width: Math.max(0, hole.l), height: hole.h, background: dim, pointerEvents: "auto" }} />
        <div style={{ position: "fixed", top: hole.t, left: hole.l + hole.w, right: 0, height: hole.h, background: dim, pointerEvents: "auto" }} />
        <div style={{ position: "fixed", top: hole.t, left: hole.l, width: hole.w, height: hole.h, borderRadius: 12, boxShadow: "0 0 0 2px #fff", pointerEvents: "none" }} />
        <div style={{ position: "fixed", left: 16, right: 16, [below ? "top" : "bottom"]: below ? hole.t + hole.h + 12 : Math.max(12, vh - hole.t + 12) }}>{tip}</div>
      </>) : (
        <div style={{ position: "fixed", inset: 0, background: dim, pointerEvents: "auto", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 40px" }}>{tip}</div>
      )}
    </div>
  );
}

function SavedScreen({ user, onBuildPlan, onShare, onBarCrawl, openSignal, calendarSignal, visible, tourWantsSpot, replayImportSignal, dbVenues }) {
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState("tiktok"); // tiktok | instagram | screenshot | maps | mapslist
  const [textInput, setTextInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState([]); // normalized venue drafts awaiting save
  const [saving, setSaving] = useState(false);
  const [successVenue, setSuccessVenue] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [saveFolder, setSaveFolder] = useState(""); // "" = auto by category, "__new__" = create new
  const [newFolder, setNewFolder] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [savedView, setSavedView] = useState("folders"); // folders | list | map | calendar
  const [customFolders, setCustomFolders] = useState([]); // user-created (possibly empty) folders
  const [menuFolder, setMenuFolder] = useState(null);
  const [movingSpot, setMovingSpot] = useState(null);
  const [detailSpot, setDetailSpot] = useState(null);
  const [bucketListPicker, setBucketListPicker] = useState(null); // spot to add to a bucket list
  const [bucketLists, setBucketLists] = useState([]);
  const [blLoading, setBlLoading] = useState(false);
  const [savesTipDismissed, setSavesTipDismissed] = useState(() => localStorage.getItem("cl_seen_saves_tip") === "1");
  async function openBucketListPicker(spot) {
    setBucketListPicker(spot);
    setBlLoading(true);
    const { data } = await supabase.from("shared_lists").select("id,name,emoji").order("created_at", { ascending: false });
    setBucketLists(data || []);
    setBlLoading(false);
  }
  async function addSpotToBucketList(listId) {
    const s = bucketListPicker;
    if (!s) return;
    const row = { list_id: listId, added_by: user.id, name: s.name, category: s.category, address: s.address, area: s.area, comment: s.comment, lat: s.lat, lng: s.lng, google_place_id: s.google_place_id, google_rating: s.google_rating != null ? String(s.google_rating) : null, price: s.price || null, website: s.website, photo_url: s.photo_url };
    await supabase.from("shared_list_items").insert(row);
    setBucketListPicker(null);
  }
  // Product tour: when it reaches the "inside a spot" steps, open a real saved
  // spot's detail sheet so its rating / photos / book button can be spotlighted;
  // close it again when those steps end. Keyed only on tourWantsSpot so normal
  // detail opens/closes are never disturbed.
  useEffect(() => {
    if (tourWantsSpot) {
      const first = saves[0];
      if (first) { setOpenFolder(null); setSavedView("folders"); setDetailSpot(first); }
    } else {
      setDetailSpot(null);
    }
  }, [tourWantsSpot]);
  const [captureOpen, setCaptureOpen] = useState(false); // collapse the "add a spot" controls by default
  const [captureTab, setCaptureTab] = useState("screenshot"); // Save modal: screenshot | link | manual

  // ── First-run import walkthrough ──────────────────────────────
  const tourBtnRef = useRef(null), tourSelRef = useRef(null), tourSaveRef = useRef(null), tourListRef = useRef(null);
  const tourSavedRef = useRef(false); // set once a saveAll succeeds, so we only advance on a real save
  const [tourStep, setTourStep] = useState(() => {
    try { if (localStorage.getItem("cl_tour_import_done")) return -1; const s = localStorage.getItem("cl_tour_step"); return s != null ? Number(s) : 0; } catch (e) { return -1; }
  });
  function endTour() { try { localStorage.setItem("cl_tour_import_done", "1"); localStorage.removeItem("cl_tour_step"); } catch (e) {} setTourStep(-1); }
  useEffect(() => { try { if (tourStep < 0) localStorage.removeItem("cl_tour_step"); else localStorage.setItem("cl_tour_step", String(tourStep)); } catch (e) {} }, [tourStep]);
  // Hidden replay hook (no settings entry): run window.__replayImportTour() to re-trigger.
  useEffect(() => { window.__replayImportTour = () => { try { localStorage.removeItem("cl_tour_import_done"); localStorage.removeItem("cl_tour_step"); } catch (e) {} setTourStep(0); }; }, []);
  // Launch the hands-on walkthrough on demand (Me → "Try it yourself"): reset the
  // capture UI to its opening state and start at step 0.
  useEffect(() => {
    if (!replayImportSignal) return;
    try { localStorage.removeItem("cl_tour_import_done"); localStorage.removeItem("cl_tour_step"); } catch (e) {}
    setCaptureOpen(false); setOpenFolder(null); setSavedView("folders"); setDetailSpot(null); setTourStep(0);
  }, [replayImportSignal]);
  const tourRef = tourStep === 0 ? tourBtnRef : tourStep === 1 ? tourSelRef : tourStep === 2 ? tourSaveRef : tourListRef;
  // Advance on the REAL action: parse completes (preview appears) → save completes (preview clears).
  useEffect(() => {
    if (tourStep === 0 && preview.length > 0) setTourStep(1);
    else if ((tourStep === 1 || tourStep === 2) && preview.length === 0 && tourSavedRef.current) setTourStep(3);
  }, [preview.length, tourStep]);
  const [mName, setMName] = useState(""); const [mCat, setMCat] = useState(""); const [mNotes, setMNotes] = useState("");
  const [focusSpot, setFocusSpot] = useState(null); // tapping a list card pans the map to it
  const [mapCat, setMapCat] = useState(""); // Map tab: "" = all, else a category scope

  // Collapse the capture controls whenever the user switches Folders/Map/Calendar.
  useEffect(() => { setCaptureOpen(false); }, [savedView]);

  // The global capture FAB bumps openSignal — pop the "Save a place" sheet on demand.
  const firstSignal = useRef(true);
  useEffect(() => {
    if (firstSignal.current) { firstSignal.current = false; return; }
    setOpenFolder(null); setCaptureTab("screenshot"); setError(null); setCaptureOpen(true);
  }, [openSignal]);

  // Jump to the Calendar view when something is added to the calendar elsewhere.
  const firstCalSignal = useRef(true);
  useEffect(() => {
    if (firstCalSignal.current) { firstCalSignal.current = false; return; }
    setOpenFolder(null); setSavedView("calendar"); window.scrollTo({ top: 0, behavior: "smooth" });
  }, [calendarSignal]);

  // Auto-categorisation: map a venue category to its folder.
  const CATEGORY_FOLDER = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
  const folderFor = (cat) => CATEGORY_FOLDER[String(cat || "").toLowerCase()] || "Other";

  const MEDIA_TYPES = [
    { id: "tiktok", label: "TikTok URL", emoji: "\u{1F3B5}", placeholder: "Paste a TikTok link (or text containing one)..." },
    { id: "instagram", label: "Instagram", emoji: "\u{1F4F8}", placeholder: "Paste the Instagram link (caption optional — we'll try to read it)..." },
    { id: "screenshot", label: "Screenshot(s)", emoji: "\u{1F5BC}️", placeholder: "" },
    { id: "maps", label: "Google Maps link", emoji: "\u{1F4CD}", placeholder: "Paste a Google Maps place link..." },
    { id: "bulk", label: "Bulk paste", emoji: "\u{1F4CB}", placeholder: "Paste place names or Google Maps links — one per line..." },
  ];

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch (e) {}
  }

  function showSuccess(name) {
    setSuccessVenue(name);
    playChime();
    haptic([12, 30, 12]);
    confetti({ count: 70 });
    setTimeout(() => setSuccessVenue(null), 2200);
  }


  async function loadSaves() {
    setLoading(true);
    if (!user?.id) { setError("You're not signed in, so saves can't load. Try signing out and back in."); setSaves([]); setLoading(false); return; }
    const { data, error: loadErr } = await supabase.from("experiences").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (loadErr) { console.error("[loadSaves]", loadErr); setError("Couldn't load saves: " + loadErr.message); }
    setSaves(data || []);
    setLoading(false);
  }

  useEffect(() => { loadSaves(); }, []);

  // Re-fetch whenever the Saves tab is re-opened, so spots saved elsewhere (a
  // friend's board, a shared list, an accepted share) show up without a full
  // app reload. Skips the initial mount, which the effect above already covers.
  const didMountSaves = useRef(false);
  useEffect(() => {
    if (!didMountSaves.current) { didMountSaves.current = true; return; }
    if (visible) loadSaves();
  }, [visible]);

  // One-time backfill: switch existing screenshot/TikTok/IG saves over to the
  // Google Maps photo so thumbnails + cards are consistent and load instantly.
  useEffect(() => {
    if (!user?.id || !saves.length) return;
    const doneKey = "cl_gphoto_done_" + user.id;
    let done; try { done = new Set(JSON.parse(localStorage.getItem(doneKey) || "[]")); } catch { done = new Set(); }
    const todo = saves.filter(s => s.google_place_id && ["screenshot", "tiktok", "instagram"].includes(s.source_type) && !done.has(s.id));
    if (!todo.length) return;
    let cancelled = false;
    (async () => {
      for (const s of todo) {
        if (cancelled) break;
        try {
          const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", place_id: s.google_place_id }) });
          const j = await r.json();
          if (j.found && j.url) {
            await supabase.from("experiences").update({ photo_url: j.url }).eq("id", s.id).eq("user_id", user.id);
            setSaves(prev => prev.map(x => x.id === s.id ? { ...x, photo_url: j.url } : x));
          }
        } catch { /* skip */ }
        done.add(s.id);
        try { localStorage.setItem(doneKey, JSON.stringify([...done])); } catch (e) {}
      }
    })();
    return () => { cancelled = true; };
  }, [saves.length]);

  // Normalise any existing saves with an off-list category (e.g. "exhibition" -> "gallery").
  useEffect(() => {
    if (!user?.id || !saves.length) return;
    const fixes = saves.filter(s => normaliseCategory(s.category) !== String(s.category || "").toLowerCase());
    if (!fixes.length) return;
    let cancelled = false;
    (async () => {
      for (const s of fixes) {
        if (cancelled) break;
        const nc = normaliseCategory(s.category);
        try {
          await supabase.from("experiences").update({ category: nc }).eq("id", s.id).eq("user_id", user.id);
          setSaves(prev => prev.map(x => x.id === s.id ? { ...x, category: nc } : x));
        } catch { /* skip */ }
      }
    })();
    return () => { cancelled = true; };
  }, [saves.length]);

  // Web Share Target: something was shared INTO the app from the OS share sheet.
  // A screenshot (image file) arrives via a POST the service worker caches (see
  // sw.js) then redirects here with ?shared=1; a plain link may also arrive as
  // ?text= / ?url=. Either way, open the right capture tab and feed it in.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clearUrl = () => window.history.replaceState({}, "", "/");
    const prefillLink = (t) => { setMediaType(t.includes("instagram.com") ? "instagram" : "tiktok"); setTextInput(t); setCaptureTab("link"); setCaptureOpen(true); };

    // Legacy / direct link params (GET share).
    const getText = params.get("text") || params.get("url") || "";
    if (getText && /tiktok\.com|instagram\.com/i.test(getText)) { prefillLink(getText); clearUrl(); return; }

    // POST share captured by the service worker (screenshot and/or link).
    if (params.get("shared")) {
      (async () => {
        try {
          const cache = await caches.open("cl-share");
          const fileRes = await cache.match("shared-file");
          if (fileRes) {
            const blob = await fileRes.blob();
            const file = new File([blob], "shared.jpg", { type: blob.type || "image/jpeg" });
            setCaptureTab("screenshot"); setCaptureOpen(true);
            handleParse([file], "screenshot");
          } else {
            const txtRes = await cache.match("shared-text");
            const txt = txtRes ? await txtRes.text() : "";
            if (txt && /tiktok\.com|instagram\.com/i.test(txt)) prefillLink(txt);
          }
          await cache.delete("shared-file"); await cache.delete("shared-text");
        } catch (e) { /* nothing usable was shared */ }
        clearUrl();
      })();
    }
  }, []);

  // Shared richer extraction schema used for captions / pasted text / screenshots.
  const EXTRACT_SCHEMA = `Return ONLY valid JSON (no markdown) with this exact structure:
{
  "name": "venue or event name",
  "address": "full street address if present, else null",
  "area": "neighbourhood e.g. Shoreditch, Chelsea, Clapham",
  "category": "EXACTLY one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife (an exhibition = gallery; a pop-up/show/festival/concert = event; a club = nightlife; a pub = bar)",
  "price": "e.g. Free, Under £15pp, £15-35pp, or null if unknown",
  "is_event": true if it's a time-bound thing (pop-up, exhibition, show, festival) else false,
  "event_start": "YYYY-MM-DD or null",
  "event_end": "YYYY-MM-DD or null",
  "event_time": "e.g. '7pm-11pm' or null",
  "vibe_tags": ["tags from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic, solo, underground"],
  "comment": "one sentence describing this place"
}
If multiple distinct venues are present, return a JSON array of such objects.`;

  async function enrich(name, area) {
    try {
      const r = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, area }) });
      return await r.json();
    } catch { return { found: false }; }
  }

  // Merge a Claude-parsed object with Google enrichment into a normalized draft.
  function buildDraft(p, g, extra) {
    const found = g?.found ? g : null;
    return {
      name: found?.validated_name || p.name || "Unknown",
      address: found?.validated_address || p.address || null,
      area: found?.derived_area || p.area || null,
      zone: found?.derived_zone || p.zone || null,
      postcode: found?.postcode || p.postcode || null,
      category: normaliseCategory(p.category),
      price: found?.price || p.price || null,
      is_event: p.is_event || p.category === "event" || false,
      event_start: p.event_start || null,
      event_end: p.event_end || null,
      event_time: p.event_time || null,
      comment: p.comment || p.description || null,
      vibe_tags: Array.isArray(p.vibe_tags) ? p.vibe_tags : [],
      lat: found?.lat ?? p.lat ?? null,
      lng: found?.lng ?? p.lng ?? null,
      google_place_id: found?.google_place_id || null,
      google_rating: found?.google_rating || null,
      google_review_count: found?.google_review_count || null,
      google_price_level: found?.google_price_level ?? null,
      website: found?.website || null,
      opening_hours: found?.opening_hours || null,
      _google_found: !!found,
      // Real thumbnail to show *before* saving: the screenshot itself, or the TikTok/IG cover.
      // Google-only sources get their photo filled in by withPreviewPhoto() during parse.
      _previewImage: extra?._screenshot_b64 ? `data:image/jpeg;base64,${extra._screenshot_b64}` : (extra?._cover_url || null),
      ...extra, // source_type, source_url, tiktok_url, _screenshot_b64, _cover_url
    };
  }

  // Parse free text (TikTok / Instagram caption / notes) → 1+ drafts.
  async function parseTextToDrafts(text, extra) {
    const caption = text.slice(0, 1200).replace(/[ -]/g, " ");
    const txt = await callClaude(`You are extracting London venues/events from social-media text.\nText: ${JSON.stringify(caption)}\n\n${EXTRACT_SCHEMA}`, 1200);
    if (!txt) throw new Error("AI returned an empty response. Try again.");
    const raw = safeJsonParse(txt);
    if (!raw) throw new Error("Couldn't read the venues from that text. Try again or paste cleaner text.");
    const items = Array.isArray(raw) ? raw : [raw];
    const drafts = [];
    for (const p of items) {
      if (!p?.name) continue;
      const g = await enrich(p.name, p.area);
      drafts.push(buildDraft(p, g, extra));
    }
    return drafts;
  }

  async function parseTikTok(input) {
    const urlMatch = input.match(/https?:\/\/[^\s]*(tiktok\.com|vm\.tiktok\.com)[^\s]*/i);
    if (!urlMatch) throw new Error("No TikTok URL found. Paste a link containing tiktok.com");
    const cleanUrl = urlMatch[0];
    setParseStatus("Fetching TikTok...");
    const tikResp = await fetch("/api/tiktok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: cleanUrl }) });
    if (!tikResp.ok) throw new Error("TikTok API returned " + tikResp.status);
    const tikData = await tikResp.json();
    if (tikData.error) throw new Error(tikData.error);
    const caption = (tikData.description || tikData.title || "").trim();
    if (!caption) throw new Error("No caption found in this video. Try a different one.");
    setParseStatus("Parsing venue...");
    return parseTextToDrafts(caption, { source_type: "tiktok", source_url: cleanUrl, tiktok_url: cleanUrl, _cover_url: tikData.cover || null });
  }

  async function parseInstagram(input) {
    const urlMatch = input.match(/https?:\/\/[^\s]*instagram\.com[^\s]*/i);
    const igUrl = urlMatch ? urlMatch[0] : null;
    let text = input.replace(/https?:\/\/\S+/g, "").trim();
    let coverUrl = null;
    if (igUrl) {
      setParseStatus("Reading Instagram post...");
      try {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "instagram", url: igUrl }) });
        const d = await r.json();
        if (d.found) { if (!text) text = d.caption || ""; coverUrl = d.image_url || null; }
      } catch { /* fall through to pasted-caption path */ }
    }
    if (!text) throw new Error("Couldn't read that Instagram post automatically (login wall). Paste the caption text along with the link and try again.");
    setParseStatus("Parsing caption...");
    return parseTextToDrafts(text, { source_type: "instagram", source_url: igUrl, _cover_url: coverUrl });
  }

  async function parseScreenshots(files) {
    const drafts = [];
    let n = 0, failed = 0;
    // Process each image independently so one unreadable/odd screenshot can't
    // abort the whole batch (supports 50+ uploads).
    for (const file of files) {
      n++;
      setParseStatus(`Reading image ${n} of ${files.length}...`);
      try {
        const { base64, mediaType } = await fileToDownscaledBase64(file);
        let data, attempt = 0;
        // Retry transient API errors (e.g. rate limits with many images).
        while (attempt < 3) {
          attempt++;
          const resp = await fetch("/api/claude", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-6", max_tokens: 1500,
              messages: [{ role: "user", content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: `This is a screenshot about a London venue, event, or place. ${EXTRACT_SCHEMA}` },
              ] }],
            }),
          });
          data = await resp.json();
          if (resp.status === 429 || (data.error && /rate|overload|529|429/i.test(JSON.stringify(data.error)))) {
            await new Promise(r => setTimeout(r, 1500 * attempt));
            continue;
          }
          break;
        }
        if (data.error) { failed++; continue; }
        const t = (data.content?.find(b => b.type === "text")?.text || "");
        const raw = safeJsonParse(t);
        if (!raw) { failed++; continue; }
        const items = Array.isArray(raw) ? raw : [raw];
        const isSingleVenue = items.filter(p => p?.name).length === 1;
        for (const p of items) {
          if (!p?.name) continue;
          setParseStatus(`Looking up "${p.name}" on Google...`);
          let g = null;
          try { g = await enrich(p.name, p.area); } catch (e) { /* keep without Google */ }
          drafts.push(buildDraft(p, g, { source_type: "screenshot", source_url: null, _screenshot_b64: isSingleVenue ? base64 : null }));
        }
      } catch (e) {
        console.error("[screenshot]", n, e);
        failed++;
      }
    }
    if (failed) setError(prev => `${failed} screenshot${failed !== 1 ? "s" : ""} couldn't be read and ${failed !== 1 ? "were" : "was"} skipped.${prev ? " " + prev : ""}`);
    return drafts;
  }

  async function parseMaps(input, isList) {
    setParseStatus(isList ? "Reading Maps list..." : "Resolving Maps link...");
    const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "maps", url: input.trim() }) });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    if (!data.found) throw new Error(data.message || "Couldn't read that Maps link.");
    const drafts = [];
    let n = 0;
    for (const place of data.places) {
      n++;
      setParseStatus(`Enriching ${n} of ${data.places.length}: ${place.name}...`);
      const g = await enrich(place.name, null);
      drafts.push(buildDraft(
        { name: place.name, lat: place.lat, lng: place.lng, category: "experience" },
        g,
        { source_type: isList ? "mapslist" : "maps", source_url: input.trim() },
      ));
    }
    return drafts;
  }

  // Bulk paste: one place name OR Maps link per line → enrich each.
  async function parseBulk(input) {
    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Paste at least one place name or Maps link, one per line.");
    const drafts = [];
    const isMapsUrl = (s) => /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      setParseStatus(`Processing ${i + 1} of ${lines.length}: ${line.slice(0, 40)}...`);
      try {
        if (/^https?:\/\//i.test(line) && isMapsUrl(line)) {
          const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "maps", url: line }) });
          const data = await r.json();
          if (data.found) {
            for (const place of data.places) {
              const g = await enrich(place.name, null);
              drafts.push(buildDraft({ name: place.name, lat: place.lat, lng: place.lng, category: "experience" }, g, { source_type: "maps", source_url: line }));
            }
            continue;
          }
          // couldn't resolve the link — skip it
          continue;
        }
        // treat as a plain place name
        const g = await enrich(line, null);
        drafts.push(buildDraft({ name: line, category: "experience" }, g, { source_type: "manual", source_url: null }));
      } catch (e) {
        console.error("[parseBulk] line failed:", line, e);
      }
    }
    return drafts;
  }

  async function handleParse(files, typeArg) {
    if (!user?.id) { setError("You're not signed in — please sign in to save."); return; }
    ensureNotifyPermission();
    const mt = typeArg || mediaType;
    setParsing(true); setError(null);
    try {
      let drafts = [];
      if (mt === "screenshot") {
        if (!files || !files.length) throw new Error("Pick one or more screenshots.");
        drafts = await parseScreenshots(files);
      } else if (mt === "tiktok") {
        drafts = await parseTikTok(textInput);
      } else if (mt === "instagram") {
        drafts = await parseInstagram(textInput);
      } else if (mt === "bulk") {
        drafts = await parseBulk(textInput);
      } else if (mt === "mapslist") {
        drafts = await parseMaps(textInput, true);
      } else {
        drafts = await parseMaps(textInput, false);
      }
      if (!drafts.length) throw new Error("Nothing found to add. Try a clearer source.");
      setParseStatus("Fetching photos...");
      for (const d of drafts) await withPreviewPhoto(d);
      // Flag spots already in the user's saves (by Google place id, fuzzy name, or address).
      const normalize = (n) => (n || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const d of drafts) {
        const dn = normalize(d.name);
        const dAddr = normalize(d.address);
        d._dup = saves.some(s => {
          if (d.google_place_id && s.google_place_id === d.google_place_id) return true;
          const sn = normalize(s.name);
          if (sn && dn && (sn === dn || sn.includes(dn) || dn.includes(sn))) return true;
          if (dAddr && dAddr.length > 10 && normalize(s.address) === dAddr) return true;
          return false;
        });
      }
      const dupCount = drafts.filter(d => d._dup).length;
      setPreview(prev => [...prev, ...drafts]);
      setTextInput("");
      setParseStatus("");
      setCaptureOpen(false); // close the modal; the review list shows on the Saves screen
      if (dupCount) setError(prev => `${prev ? prev + " " : ""}Heads up: ${dupCount} of these ${dupCount === 1 ? "is" : "are"} already in your saves (marked below).`);
      notify("Parsing done ✦", `${drafts.length} spot${drafts.length !== 1 ? "s" : ""} ready to review`);
    } catch (e) {
      console.error("[handleParse]", e);
      setError(e.message || "Couldn't parse that.");
      setParseStatus("");
    }
    setParsing(false);
  }

  // "No screenshot? Try an example": drop a real sample venue into the review
  // list so someone with nothing to upload can still complete the save flow
  // (pick a list → Save) and see how it works. Uses a venue with a real photo.
  function addExample() {
    const pool = (dbVenues || []).filter(v => v.photo_url && v.name);
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    const ex = pick ? {
      name: pick.name, category: pick.category, area: pick.area, price: pick.price,
      comment: pick.comment || pick.desc || "An example place — swap in your own screenshots anytime.",
      vibe_tags: pick.vibe_tags || [], google_place_id: pick.google_place_id, google_rating: pick.google_rating,
      website: pick.website, lat: pick.lat, lng: pick.lng, address: pick.address,
      photo_url: pick.photo_url, _previewImage: pick.photo_url, source_type: "screenshot", _example: true,
    } : {
      name: "Dishoom Shoreditch", category: "restaurant", area: "Shoreditch", price: "££",
      comment: "Bombay-style café — legendary black daal. (An example place.)",
      vibe_tags: ["aesthetic", "iconic", "social"], source_type: "screenshot", _example: true,
    };
    ex._dup = saves.some(s => (s.name || "").toLowerCase().trim() === ex.name.toLowerCase().trim());
    setPreview(prev => [...prev, ex]);
    setCaptureOpen(false);
  }

  async function resolvePhoto(d) {
    // Prefer Google Places photo. Only fall back to screenshot/cover for single-venue screenshots
    // (where the screenshot IS the venue photo). Never use a list screenshot as the venue image.
    if (d.google_place_id) {
      try {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", place_id: d.google_place_id }) });
        const j = await r.json();
        if (j.found && j.url) return j.url;
      } catch {}
    }
    if (d._cover_url) {
      try {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", image_url: d._cover_url }) });
        const j = await r.json();
        if (j.found && j.url) return j.url;
      } catch {}
    }
    if (d._screenshot_b64) {
      try {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", image_base64: d._screenshot_b64, content_type: "image/jpeg" }) });
        const j = await r.json();
        if (j.found && j.url) return j.url;
      } catch {}
    }
    return null;
  }

  // Ensure a draft has a real venue thumbnail before it reaches the preview.
  // Screenshot/TikTok/IG already have _previewImage; this fills in Google-photo
  // sources (Maps links, bulk names) by uploading the place photo to Blob now.
  async function withPreviewPhoto(d) {
    if (!d._previewImage && d.google_place_id) {
      const url = await resolvePhoto(d);
      if (url) { d.photo_url = url; d._previewImage = url; }
    }
    return d;
  }

  async function saveAll() {
    if (!preview.length || !user?.id) return;
    ensureNotifyPermission();
    const toSave = preview.filter(d => !d._dup);
    const skipped = preview.length - toSave.length;
    if (!toSave.length) { setError("All spots are already in your saves."); return; }
    setSaving(true); setError(null);
    let savedCount = 0;
    try {
      for (let i = 0; i < toSave.length; i++) {
        const d = toSave[i];
        setParseStatus(`Saving ${i + 1} of ${toSave.length}: ${d.name}...`);
        const photo_url = d.photo_url || await resolvePhoto(d);
        const chosen = saveFolder === "__new__" ? newFolder.trim() : saveFolder.trim();
        const folder = chosen || null;
        const note = saveNote.trim() || null;
        const row = {
          user_id: user.id,
          name: d.name, address: d.address, area: d.area, zone: d.zone || "Central",
          category: d.category, price: d.price,
          is_event: d.is_event, event_start: d.event_start, event_end: d.event_end, event_time: d.event_time,
          comment: d.comment, vibe_tags: d.vibe_tags || [],
          lat: d.lat, lng: d.lng, postcode: d.postcode,
          google_place_id: d.google_place_id, google_rating: d.google_rating,
          google_review_count: d.google_review_count, google_price_level: d.google_price_level,
          website: d.website, opening_hours: d.opening_hours,
          tiktok_url: d.tiktok_url || (d.source_type === "tiktok" ? d.source_url : null),
          source_url: d.source_url, source_type: d.source_type,
          photo_url, folder, note, status: "pending",
        };
        const { data: inserted, error: insertErr } = await supabase.from("experiences").insert(row).select();
        if (insertErr) throw new Error("Save failed: " + insertErr.message);
        if (!inserted || !inserted.length) throw new Error("Save didn't persist — check you're signed in and that the migration has been run.");
        savedCount++;
      }
      track("save", { count: savedCount, source: toSave[0]?.source_type || "unknown" });
      setParseStatus("");
      tourSavedRef.current = true;
      setPreview([]);
      setSaveFolder(""); setNewFolder(""); setSaveNote(""); setCaptureOpen(false);
      const msg = savedCount === 1 ? toSave[0].name : `${savedCount} spots`;
      showSuccess(msg);
      notify("Saved to your collection ✨", savedCount === 1 ? `${toSave[0].name} added` : `${savedCount} spots added`);
      if (skipped) setError(`${skipped} duplicate${skipped > 1 ? "s" : ""} skipped — already in your saves.`);
      await loadSaves();
    } catch (e) {
      console.error("[saveAll]", e);
      setError(e.message + (savedCount ? ` (${savedCount} saved before this)` : ""));
      setParseStatus("");
      if (savedCount) { setPreview(prev => prev.slice(savedCount)); await loadSaves(); }
    }
    setSaving(false);
  }

  async function manualSave() {
    if (!mName.trim() || !user?.id) return;
    setSaving(true); setError(null); setParseStatus(`Saving ${mName.trim()}...`);
    try {
      const g = await enrich(mName.trim(), null);
      const d = buildDraft({ name: mName.trim(), category: mCat || null, comment: mNotes.trim() || null }, g, { source_type: "manual", source_url: null });
      const dn = (d.name || "").toLowerCase().trim();
      const isDup = saves.some(s => (d.google_place_id && s.google_place_id === d.google_place_id) || (s.name || "").toLowerCase().trim() === dn);
      if (isDup) { setError(`"${d.name}" is already in your saves.`); setParseStatus(""); setSaving(false); return; }
      const photo_url = d.photo_url || await resolvePhoto(d);
      const row = {
        user_id: user.id, name: d.name, address: d.address, area: d.area, zone: d.zone || "Central",
        category: d.category, price: d.price, is_event: d.is_event, event_start: d.event_start, event_end: d.event_end, event_time: d.event_time,
        comment: d.comment, vibe_tags: d.vibe_tags || [], lat: d.lat, lng: d.lng, postcode: d.postcode,
        google_place_id: d.google_place_id, google_rating: d.google_rating, google_review_count: d.google_review_count, google_price_level: d.google_price_level,
        website: d.website, opening_hours: d.opening_hours, source_url: null, source_type: "manual",
        photo_url, folder: null, note: mNotes.trim() || null, status: "pending",
      };
      const { data: inserted, error } = await supabase.from("experiences").insert(row).select();
      if (error) throw new Error("Save failed: " + error.message);
      if (!inserted || !inserted.length) throw new Error("Save didn't persist — check you're signed in and that the migration has been run.");
      setParseStatus(""); setMName(""); setMNotes(""); setCaptureOpen(false);
      showSuccess(d.name); notify("Saved to your collection ✨", `${d.name} added`);
      await loadSaves();
    } catch (e) { console.error("[manualSave]", e); setError(e.message); setParseStatus(""); }
    setSaving(false);
  }

  function removeDraft(i) { setPreview(prev => prev.filter((_, idx) => idx !== i)); }


  async function removeSave(id) {
    if (!window.confirm("Are you sure you want to delete this spot? This can't be reversed.")) return;
    await supabase.from("experiences").delete().eq("id", id).eq("user_id", user.id);
    setSaves(prev => prev.filter(s => s.id !== id));
  }

  async function moveSpot(spot, target) {
    const { error: e } = await supabase.from("experiences").update({ folder: target }).eq("id", spot.id).eq("user_id", user.id);
    if (e) { setError("Move failed: " + e.message); return; }
    if (target && !customFolders.includes(target) && !Object.keys(grouped).includes(target)) persistFolders([...customFolders, target]);
    setMovingSpot(null);
    await loadSaves();
  }

  useEffect(() => {
    if (!user?.id) return;
    try { setCustomFolders(JSON.parse(localStorage.getItem("cl_folders_" + user.id) || "[]")); } catch { setCustomFolders([]); }
  }, []);

  function persistFolders(list) {
    setCustomFolders(list);
    try { localStorage.setItem("cl_folders_" + user.id, JSON.stringify(list)); } catch (e) {}
  }

  function createFolder() {
    const name = (window.prompt("Name your new list") || "").trim();
    if (!name) return;
    if (!customFolders.includes(name)) persistFolders([...customFolders, name]);
    setSavedView("folders"); setOpenFolder(null);
  }

  async function renameFolder(oldName) {
    setMenuFolder(null);
    const name = (window.prompt("Rename list", oldName) || "").trim();
    if (!name || name === oldName) return;
    const ids = (grouped[oldName] || []).map(s => s.id);
    if (ids.length) {
      const { error: e } = await supabase.from("experiences").update({ folder: name }).in("id", ids);
      if (e) { setError("Rename failed: " + e.message); return; }
    }
    let list = customFolders.filter(f => f !== oldName);
    if (customFolders.includes(oldName) && !list.includes(name)) list = [...list, name];
    persistFolders(list);
    if (openFolder === oldName) setOpenFolder(name);
    await loadSaves();
  }

  async function deleteFolder(name) {
    setMenuFolder(null);
    const items = grouped[name] || [];
    if (!window.confirm(items.length ? `Delete "${name}" and its ${items.length} spot${items.length !== 1 ? "s" : ""}? This can't be undone.` : `Delete list "${name}"?`)) return;
    if (items.length) {
      const { error: e } = await supabase.from("experiences").delete().in("id", items.map(s => s.id)).eq("user_id", user.id);
      if (e) { setError("Delete failed: " + e.message); return; }
    }
    persistFolders(customFolders.filter(f => f !== name));
    if (openFolder === name) setOpenFolder(null);
    await loadSaves();
  }

  if (loading) return <div className="loading"><div className="loading-ring" /><div className="loading-sub">Loading saves...</div></div>;

  const SOURCE_ICON = { tiktok: "\u{1F3B5}", instagram: "\u{1F4F8}", screenshot: "\u{1F5BC}️", maps: "\u{1F4CD}", manual: "\u{1F4DD}" };
  const fmtDate = (d) => { if (!d) return null; try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; } };
  const current = MEDIA_TYPES.find(m => m.id === mediaType) || MEDIA_TYPES[0];

  function VenueCard({ v, onRemove, onMove, draft }) {
    const cat = (v.category || "experience").toLowerCase();
    const colour = CAT_COLOURS[cat] || "#A1947D";
    const emoji = CAT_EMOJI[cat] || "✨";
    const dateLabel = v.is_event && (v.event_start || v.event_end)
      ? [fmtDate(v.event_start), fmtDate(v.event_end)].filter(Boolean).join(" – ")
      : null;
    return (
      <div style={{ display: "flex", gap: 12, padding: 12, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 14, marginBottom: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: (v.photo_url || v._previewImage) ? "#e9e4da" : colour, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(v.photo_url || v._previewImage)
            ? <img src={v.photo_url || v._previewImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "1.6rem" }}>{emoji}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>{v.name}</div>
            {onRemove && <button onClick={onRemove} style={{ border: "none", background: "none", color: "#b8ac9a", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, flexShrink: 0 }}>×</button>}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#9b8f7a", marginTop: 2 }}>
            {emoji} {cap(cat)}{v.zone ? ` · ${v.zone}` : ""}{v.area ? ` · ${v.area}` : ""}{v.google_rating ? ` · ⭐ ${v.google_rating}` : ""}{v.price ? ` · ${v.price}` : ""}
          </div>
          {dateLabel && <div style={{ fontSize: "0.72rem", color: "#726A4E", marginTop: 3 }}>📅 {dateLabel}{v.event_time ? ` · 🕐 ${v.event_time}` : ""}</div>}
          {!dateLabel && v.event_time && <div style={{ fontSize: "0.72rem", color: "#726A4E", marginTop: 3 }}>🕐 {v.event_time}</div>}
          {v.address && <div style={{ fontSize: "0.68rem", color: "#b8ac9a", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {v.address}</div>}
          {v.vibe_tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
              {v.vibe_tags.slice(0, 5).map((t, i) => <span key={i} style={{ fontSize: "0.6rem", background: "#f5f0e8", color: "#6b5e4e", padding: "2px 7px", borderRadius: 100 }}>{String(t).replace(/_/g, " ")}</span>)}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
            {v.source_url && (v.source_type === "tiktok" || v.source_type === "instagram") && <a href={v.source_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.68rem", color: "#726A4E", fontWeight: 500 }}>{SOURCE_ICON[v.source_type] || "🔗"} View source ↗</a>}
            {googleMapsUrl(v) && <a href={googleMapsUrl(v)} target="_blank" rel="noreferrer" style={{ fontSize: "0.68rem", color: "#726A4E", fontWeight: 500 }}>📍 Maps</a>}
            {onMove && <button onClick={onMove} style={{ border: "none", background: "none", padding: 0, fontSize: "0.68rem", color: "#6b5e4e", fontWeight: 500, cursor: "pointer" }}>↪ Move</button>}
            {draft && v._dup && <span style={{ fontSize: "0.6rem", color: "#fff", background: "#DD4124", padding: "2px 7px", borderRadius: 100, fontWeight: 600 }}>Already saved</span>}
            {draft && !v._google_found && <span style={{ fontSize: "0.6rem", color: "#c98a3a" }}>⚠ not on Google</span>}
          </div>
        </div>
      </div>
    );
  }

  const grouped = saves.reduce((acc, s) => { const f = s.folder || folderFor(s.category); (acc[f] = acc[f] || []).push(s); return acc; }, {});
  const folderNames = [...new Set([...Object.keys(grouped), ...customFolders])].sort();
  const existingFolders = folderNames;
  const folderSaves = openFolder ? (grouped[openFolder] || []) : [];
  const mapCats = [...new Set(saves.filter(s => s.lat && s.lng).map(s => normaliseCategory(s.category)))].sort();
  const scopeSaves = mapCat ? saves.filter(s => normaliseCategory(s.category) === mapCat) : saves;

  // Shared "scoped" view: a sticky map of the given spots + the spots listed below
  // (tap a card to pan the map). Used for both an open list and a Map-tab category.
  // The places list as a sheet that scrolls UP OVER the (sticky) map behind it.
  const renderSheet = (list, header) => (!list.length && !header) ? null : (
    <div style={{ position: "relative", zIndex: 10, background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -22, padding: "8px 0 14px", boxShadow: "0 -6px 18px rgba(0,0,0,0.12)" }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd6c8", margin: "2px auto 12px" }} />
      {header}
      {list.map(s => (
        <div key={s.id} style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: "1px solid #f0ebe2", background: "#fff", marginBottom: 14 }}>
          <button onClick={() => removeSave(s.id)} title="Delete" style={{ position: "absolute", top: 8, right: 8, zIndex: 3, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: "0.95rem", lineHeight: 1 }}>×</button>
          <div onClick={() => setDetailSpot(s)} style={{ cursor: "pointer" }}>
            <BigSpotCard s={s} photo={s.photo_url} />
          </div>
          <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => onBuildPlan([s])} style={{ border: "none", background: "rgba(223,239,135,0.5)", color: "#4B342F", borderRadius: 100, padding: "7px 16px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>✦ Make a plan based on this</button>
            <button onClick={() => setMovingSpot(s)} style={{ border: "1px solid #e8e2d8", background: "#fff", borderRadius: 100, padding: "7px 14px", fontSize: "0.72rem", color: "#6b5e4e", fontWeight: 500, cursor: "pointer" }}>Move</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">Saved</div>
        {!openFolder && <p className="section-sub">Capture spots from TikTok, Instagram, screenshots or Maps — organised into lists.</p>}
      </div>

      <div style={{ padding: "0 1.5rem 1rem" }}>
        {error && <div className="err" style={{ marginBottom: "0.75rem" }}>{error}</div>}

        {!openFolder && (
          <button ref={tourBtnRef} onClick={() => { setCaptureTab("screenshot"); setError(null); setCaptureOpen(true); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#1c1c1a", color: "#fff", border: "none", borderRadius: 100, padding: "13px 18px", fontSize: "0.92rem", fontWeight: 600, cursor: "pointer" }}>+ Save a place</button>
        )}

        {(parsing || saving) && parseStatus && !captureOpen && <div style={{ fontSize: "0.75rem", color: "#726A4E", marginTop: 8 }}>{parseStatus}</div>}
      </div>

      {visible && tourStep >= 0 && !captureOpen && !(tourStep === 0 && parsing) && (
        <TourSpotlight targetRef={tourRef} step={tourStep} last={tourStep === 3} onDone={endTour} onSkip={endTour} />
      )}

      {!openFolder && captureOpen && (
        <div onClick={() => !parsing && !saving && setCaptureOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 1400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "22px 22px 0 0", padding: "22px 20px calc(22px + env(safe-area-inset-bottom))", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.5rem", color: "#1c1c1a" }}>Save a place</div>
              <button onClick={() => setCaptureOpen(false)} style={{ border: "none", background: "none", fontSize: "1.25rem", color: "#9b8f7a", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#9b8f7a", margin: "4px 0 16px" }}>Drop a screenshot, paste a link, or add it yourself.</div>

            <div style={{ display: "flex", gap: 4, background: "#f0ebe2", borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {[["screenshot", "📷 Screenshot"], ["link", "🔗 Link"], ["manual", "✎ Manual"]].map(([id, lbl]) => (
                <button key={id} onClick={() => { setCaptureTab(id); setError(null); }} style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, background: captureTab === id ? "#fff" : "transparent", color: captureTab === id ? "#1c1c1a" : "#9b8f7a", boxShadow: captureTab === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>{lbl}</button>
              ))}
            </div>

            {captureTab === "screenshot" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "34px 16px", border: "1.5px dashed #ddd8ce", borderRadius: 14, cursor: parsing ? "default" : "pointer", textAlign: "center" }}>
                  <span style={{ fontSize: "1.5rem" }}>⬆️</span>
                  <span style={{ fontSize: "0.92rem", color: "#1c1c1a", fontWeight: 500 }}>{parsing ? "Reading…" : "Click to upload a screenshot"}</span>
                  <span style={{ fontSize: "0.76rem", color: "#9b8f7a" }}>PNG or JPG — pick several at once</span>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={parsing || saving}
                    onChange={e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) handleParse(f, "screenshot"); }} />
                </label>
                <button onClick={addExample} disabled={parsing || saving} style={{ border: "none", background: "none", color: "#726A4E", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: "2px" }}>No screenshot handy? Try an example →</button>
              </div>
            )}

            {captureTab === "link" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: "0.8rem", color: "#6b5e4e" }}>Paste a TikTok, Instagram or Google Maps link.</div>
                <input className="input-field" type="text" placeholder="https://…" value={textInput} onChange={e => { setTextInput(e.target.value); setError(null); }} />
                <button className="btn btn-teal" disabled={parsing || saving || !textInput.trim()} onClick={() => {
                  const t = textInput.trim(); let mt = "tiktok";
                  if (/instagram\.com/i.test(t)) mt = "instagram";
                  else if (/maps\.app\.goo\.gl|google\.[a-z.]+\/maps|goo\.gl\/maps/i.test(t)) mt = /\/maps\/.*list|@.*data/i.test(t) ? "mapslist" : "maps";
                  handleParse(undefined, mt);
                }}>{parsing ? "Parsing…" : "Parse ✦"}</button>
              </div>
            )}

            {captureTab === "manual" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c1c1a", marginBottom: 6 }}>Place name</div>
                  <input className="input-field" value={mName} onChange={e => setMName(e.target.value)} placeholder="e.g. Dishoom Shoreditch" />
                </div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c1c1a", marginBottom: 8 }}>Category <span style={{ color: "#9b8f7a", fontWeight: 400 }}>(optional)</span></div>
                  <select value={mCat} onChange={e => setMCat(e.target.value)} className="input-field" style={{ padding: "11px 12px" }}>
                    <option value="">None — we'll auto-detect it</option>
                    {MANUAL_CATS.map(([id, lbl]) => <option key={id} value={id}>{lbl}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c1c1a", marginBottom: 6 }}>Notes</div>
                  <textarea className="input-field" rows={3} value={mNotes} onChange={e => setMNotes(e.target.value)} placeholder="Why did you save this? Best time to go, what to order…" style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
                  <button onClick={() => setCaptureOpen(false)} style={{ border: "none", background: "none", color: "#6b5e4e", fontSize: "0.88rem", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                  <button onClick={manualSave} disabled={saving || !mName.trim()} style={{ border: "none", background: "#1c1c1a", color: "#fff", borderRadius: 100, padding: "11px 22px", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", opacity: (saving || !mName.trim()) ? 0.5 : 1 }}>{saving ? "Saving…" : "Save it"}</button>
                </div>
              </div>
            )}

            {(parsing || saving) && parseStatus && <div style={{ fontSize: "0.78rem", color: "#726A4E", marginTop: 12 }}>{parseStatus}</div>}
            {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div style={{ padding: "0 1.5rem 1rem" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", marginBottom: 8, fontWeight: 500 }}>{preview.length} to review — check, then save</div>
          {preview.map((v, i) => <VenueCard key={i} v={v} draft onRemove={() => removeDraft(i)} />)}
          <div style={{ margin: "10px 0" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b5e4e", marginBottom: 4 }}>Save to list</div>
            <select ref={tourSelRef} value={saveFolder} onChange={e => { setSaveFolder(e.target.value); if (tourStep === 1) setTourStep(2); }} className="input-field" style={{ padding: "10px 12px" }}>
              <option value="">Auto — by category</option>
              {existingFolders.map(f => <option key={f} value={f}>{f}</option>)}
              <option value="__new__">+ Create new list…</option>
            </select>
            {saveFolder === "__new__" && (
              <input className="input-field" style={{ marginTop: 6 }} placeholder="New list name" value={newFolder} onChange={e => setNewFolder(e.target.value)} />
            )}
          </div>
          <div style={{ margin: "10px 0" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b5e4e", marginBottom: 4 }}>Any context? <span style={{ color: "#9b8f7a" }}>(optional)</span></div>
            <input className="input-field" type="text" placeholder="e.g. for date nights, when parents visit, Friday lunch spot" value={saveNote} onChange={e => setSaveNote(e.target.value)} style={{ padding: "10px 12px" }} />
          </div>
          {preview.some(d => d._dup) && (
            <div style={{ fontSize: "0.72rem", color: "#DD4124", marginBottom: 8 }}>
              {preview.filter(d => d._dup).length} duplicate{preview.filter(d => d._dup).length > 1 ? "s" : ""} will be skipped (already in your saves).
            </div>
          )}
          <button ref={tourSaveRef} className="btn btn-teal" onClick={saveAll} disabled={saving || (saveFolder === "__new__" && !newFolder.trim()) || preview.every(d => d._dup)} style={{ marginTop: 4 }}>{saving ? "Saving..." : `Save ${preview.filter(d => !d._dup).length} spot${preview.filter(d => !d._dup).length !== 1 ? "s" : ""}${saveFolder && saveFolder !== "__new__" ? ` to ${saveFolder}` : ""} ✦`}</button>
        </div>
      )}

      <div style={{ padding: "0 1.5rem 1rem" }}>
        {saves.length > 0 && !openFolder && (
          <div ref={tourListRef} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["folders", "Folders"], ["list", "List"], ["calendar", "Calendar"]].map(([id, label]) => (
              <button key={id} onClick={() => { setSavedView(id); setOpenFolder(null); }}
                style={{ fontSize: "0.74rem", padding: "6px 14px", borderRadius: 100, cursor: "pointer",
                  border: savedView === id ? "1.5px solid #726A4E" : "1.5px solid #e8e2d8",
                  background: savedView === id ? "#eef3d8" : "#fff", color: savedView === id ? "#726A4E" : "#6b5e4e", fontWeight: savedView === id ? 600 : 400 }}>
                {label}
              </button>
            ))}
          </div>
        )}
        {saves.length > 0 && savedView === "map" && (
          <>
            <div style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <SpotsMap key="maptab" saves={saves} focusSpot={focusSpot} onCategory={setMapCat} />
            </div>
            {mapCat && renderSheet(scopeSaves, (
              <div style={{ padding: "0 14px 12px" }}>
                <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "0.9rem", color: "#1c1c1a", marginBottom: ((mapCat === "bar" || mapCat === "nightlife") || scopeSaves.length > 1) ? 8 : 0 }}>{CAT_LABEL[mapCat] || cap(mapCat)} <span style={{ fontSize: "0.76rem", color: "#9b8f7a" }}>· {scopeSaves.length}</span></div>
                {(mapCat === "bar" || mapCat === "nightlife")
                  ? <button onClick={() => onBarCrawl(scopeSaves)} style={{ width: "100%", border: "none", background: "#726A4E", color: "#fff", borderRadius: 100, padding: "10px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>🍸 Planning a bar crawl? Tap here!</button>
                  : (scopeSaves.length > 1 && <button onClick={() => onBuildPlan(scopeSaves)} style={{ width: "100%", border: "none", background: "#726A4E", color: "#fff", borderRadius: 100, padding: "10px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>✦ Build a plan from these</button>)}
              </div>
            ))}
          </>
        )}
        {saves.length > 0 && savedView === "calendar" && <SpotsCalendar saves={saves} user={user} onBuildPlan={onBuildPlan} onShare={onShare} />}
        {saves.length > 0 && savedView === "list" && (
          <div>
            {saves.map(s => (
              <div key={s.id} onClick={() => setDetailSpot(s)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0ebe2", cursor: "pointer" }}>
                {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.1rem" }}>{CAT_EMOJI[normaliseCategory(s.category)] || "📍"}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>{[s.category ? cap(normaliseCategory(s.category)) : null, s.area, s.google_rating ? `⭐ ${s.google_rating}` : null].filter(Boolean).join(" · ")}</div>
                </div>
                <span style={{ color: "#c9bfae", fontSize: "1rem", flexShrink: 0 }}>›</span>
              </div>
            ))}
          </div>
        )}
        {saves.length > 0 && savedView === "folders" && !openFolder && (
          <>
            {saves.some(s => s.lat && s.lng) && (
              <SpotsMap key="peek" saves={saves} peek peekHeight={150} onExpand={() => setSavedView("map")} />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0.5rem 0 0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a" }}>Your lists ({saves.length} spot{saves.length !== 1 ? "s" : ""})</div>
                {(() => {
                  const week = saves.filter(s => s.created_at && (Date.now() - new Date(s.created_at).getTime()) < 7 * 864e5).length;
                  return week > 0 ? <span title={`${week} saved in the last 7 days`} style={{ flexShrink: 0, fontSize: "0.66rem", fontWeight: 700, color: "#9a5b2e", background: "linear-gradient(180deg,#fbe7cf,#f6d6ae)", border: "1px solid #eec79a", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap" }}>🔥 {week} this week</span> : null;
                })()}
              </div>
              <button onClick={createFolder} style={{ fontSize: "0.74rem", padding: "6px 12px", borderRadius: 100, border: "1.5px solid #726A4E", background: "#fff", color: "#726A4E", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>+ New list</button>
            </div>
            <div data-tour="saves-lists" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {folderNames.map((f, fi) => {
                const items = grouped[f] || [];
                return (
                  <div key={f} data-tour={fi === 0 ? "saves-list-card" : undefined} style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", background: "#fff" }}>
                    <div onClick={() => setOpenFolder(f)} style={{ cursor: "pointer" }}>
                      <ListCover items={items} />
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1c1c1a", paddingRight: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f}</div>
                        <div style={{ fontSize: "0.68rem", color: "#9b8f7a" }}>{items.length} spot{items.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setMenuFolder(menuFolder === f ? null : f); }} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: "0.95rem", lineHeight: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>⋯</button>
                    {menuFolder === f && (
                      <div style={{ position: "absolute", top: 34, right: 6, background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 10, minWidth: 110 }}>
                        <button onClick={() => renameFolder(f)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "#fff", cursor: "pointer", fontSize: "0.78rem", color: "#1c1c1a" }}>Rename</button>
                        <button onClick={() => deleteFolder(f)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderTop: "1px solid #f0ebe2", background: "#fff", cursor: "pointer", fontSize: "0.78rem", color: "#DD4124" }}>Delete</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button data-tour="saves-build" className="btn btn-teal" style={{ marginTop: "1rem" }} onClick={() => onBuildPlan(saves)}>Build a plan from your spots ✦</button>
          </>
        )}
        {saves.length > 0 && savedView === "folders" && openFolder && (
          <>
            <button className="btn-ghost" onClick={() => { setOpenFolder(null); setFocusSpot(null); }} style={{ marginBottom: "0.75rem" }}>← All lists</button>
            {folderSaves.length > 0 && folderSaves.some(s => s.lat && s.lng) && (
              <SpotsMap key={"peek-" + openFolder} saves={folderSaves} listName={openFolder} peek peekHeight={120} onExpand={() => setSavedView("map")} />
            )}
            {folderSaves.length === 0 && <div style={{ fontSize: "0.8rem", color: "#9b8f7a" }}>No spots in this list yet — pick it as the list when you save something.</div>}
            {folderSaves.length > 0 && renderSheet(folderSaves, (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px 8px" }}>
                <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "0.9rem", color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{openFolder} <span style={{ fontSize: "0.76rem", color: "#9b8f7a" }}>· {folderSaves.length} place{folderSaves.length !== 1 ? "s" : ""}</span></div>
                <div style={{ display: "flex", gap: 8 }}>
                  {onShare && <button onClick={() => onShare({ kind: "list", title: openFolder, payload: { name: openFolder, spots: folderSaves.map(({ id, user_id, created_at, status, ...rest }) => rest) } })} style={{ fontSize: "0.74rem", padding: "6px 12px", borderRadius: 100, border: "none", background: "#726A4E", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Send</button>}
                  <button onClick={() => renameFolder(openFolder)} style={{ fontSize: "0.74rem", padding: "6px 12px", borderRadius: 100, border: "1.5px solid #e8e2d8", background: "#fff", color: "#6b5e4e", fontWeight: 500, cursor: "pointer" }}>✎ Rename</button>
                </div>
              </div>
            ))}
            {folderSaves.length > 0 && /\b(bar|bars|pub|pubs|drink|drinks|cocktail|cocktails|wine|beer|nightlife|booze|happy ?hour|night out)\b/i.test(openFolder || "") && (
              <button className="btn btn-teal" style={{ marginTop: "0.25rem" }} onClick={() => onBarCrawl(folderSaves)}>🍸 Planning a bar crawl? Tap here!</button>
            )}
            {folderSaves.length > 0 && <button className="btn btn-teal" style={{ marginTop: "0.25rem" }} onClick={() => onBuildPlan(folderSaves)}>Build plan from {openFolder} ✦</button>}
          </>
        )}
        {saves.length === 0 && preview.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">📌</div>
            <div className="empty-title">No saved spots yet</div>
            {!savesTipDismissed ? (
              <div style={{ position: "relative" }}>
                <div className="empty-sub">Three ways to save a spot:</div>
                <div style={{ textAlign: "left", maxWidth: 260, margin: "0.5rem auto 0", fontSize: "0.82rem", color: "#9b8f7a", lineHeight: 1.7 }}>
                  📸 Screenshot a post from Instagram or TikTok<br/>
                  🔗 Paste a link (TikTok or Instagram URL)<br/>
                  ✏️ Type a place name manually
                </div>
                <button onClick={() => { localStorage.setItem("cl_seen_saves_tip", "1"); setSavesTipDismissed(true); }} style={{ marginTop: 10, border: "none", background: "none", color: "#9b8f7a", fontSize: "0.76rem", cursor: "pointer", textDecoration: "underline" }}>Got it</button>
              </div>
            ) : (
              <div className="empty-sub">Pick a source above to start capturing.</div>
            )}
          </div>
        )}
      </div>

      {successVenue && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "2rem 1.5rem", textAlign: "center", maxWidth: 280, animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✨</div>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 6 }}>Saved!</div>
            <div style={{ fontSize: "0.82rem", color: "#6b5e4e" }}>{successVenue}</div>
            <div style={{ fontSize: "0.72rem", color: "#9b8f7a", marginTop: 4 }}>Added to your collection</div>
          </div>
        </div>
      )}

      {detailSpot && (
        <SpotDetail
          spot={detailSpot}
          user={user}
          onSpotUpdate={(id, patch) => setSaves(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))}
          onClose={() => setDetailSpot(null)}
          onShowOnMap={(s) => { setDetailSpot(null); if (savedView !== "map" && !openFolder) setSavedView("map"); setFocusSpot({ ...s, _focus: Date.now() }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onMakePlan={(s) => { setDetailSpot(null); onBuildPlan([s]); }}
          onAddToBucketList={(s) => { setDetailSpot(null); openBucketListPicker(s); }}
        />
      )}

      {movingSpot && (
        <div onClick={() => setMovingSpot(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a", marginBottom: 4 }}>Move to list</div>
            <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movingSpot.name}</div>
            <button onClick={() => moveSpot(movingSpot, null)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8e2d8", background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#1c1c1a", marginBottom: 8 }}>✨ Auto — by category</button>
            {folderNames.map(f => (
              <button key={f} onClick={() => moveSpot(movingSpot, f)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8e2d8", background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#1c1c1a", marginBottom: 8 }}>📁 {f}</button>
            ))}
            <button onClick={() => { const n = (window.prompt("New list name") || "").trim(); if (n) moveSpot(movingSpot, n); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #726A4E", background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#726A4E", fontWeight: 600, marginBottom: 8 }}>+ New list…</button>
            <button onClick={() => setMovingSpot(null)} style={{ display: "block", width: "100%", textAlign: "center", padding: "10px", borderRadius: 10, border: "none", background: "#f5f0e8", cursor: "pointer", fontSize: "0.8rem", color: "#6b5e4e" }}>Cancel</button>
          </div>
        </div>
      )}

      {bucketListPicker && (
        <div onClick={() => setBucketListPicker(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a", marginBottom: 4 }}>Add to bucket list</div>
            <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bucketListPicker.name}</div>
            {blLoading && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>Loading lists...</div>}
            {!blLoading && bucketLists.length === 0 && <div style={{ fontSize: "0.82rem", color: "#9b8f7a", marginBottom: 12 }}>No bucket lists yet. Create one in the People tab.</div>}
            {!blLoading && bucketLists.map(l => (
              <button key={l.id} onClick={() => addSpotToBucketList(l.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8e2d8", background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#1c1c1a", marginBottom: 8 }}>{l.emoji || "✨"} {l.name}</button>
            ))}
            <button onClick={() => setBucketListPicker(null)} style={{ display: "block", width: "100%", textAlign: "center", padding: "10px", borderRadius: 10, border: "none", background: "#f5f0e8", cursor: "pointer", fontSize: "0.8rem", color: "#6b5e4e", marginTop: 4 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Splash / value prop — one screen, one CTA. Warm, editorial, type-led (no imagery).
function Splash({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4.5rem 2rem 2.5rem", maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.26em", textTransform: "uppercase", color: "#a3865f", fontWeight: 600, marginBottom: 30 }}>Saved · Sorted · Planned</div>
        <div style={{ fontFamily: "'Sofia', cursive", fontWeight: 700, fontSize: "3.4rem", lineHeight: 1, color: "#726A4E", marginBottom: 26 }}>Curated</div>
        <h1 style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "2.6rem", lineHeight: 1.14, color: "#33281c", fontWeight: 700, margin: 0 }}>
          Everything you save,<br />in one <em style={{ fontStyle: "italic", color: "#b5563b" }}>beautiful</em> place.
        </h1>
      </div>

      <div>
        <div style={{ width: 46, height: 2, background: "#d8c4a4", margin: "0 auto 20px" }} />
        <p style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#6b5a44", lineHeight: 1.6, margin: "0 auto 34px", maxWidth: 330 }}>
          The spots you love on Instagram, TikTok and in your screenshots — gathered onto one board, then turned into real plans.
        </p>
        <button onClick={onStart} style={{ width: "100%", padding: "16px", borderRadius: 100, border: "none", background: "#33281c", color: "#f3e9d9", fontSize: "1rem", fontWeight: 700, fontFamily: "'Aleo', sans-serif", cursor: "pointer", letterSpacing: "0.01em" }}>Get started</button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("email"); // email | code
  const [otpBusy, setOtpBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds until Resend is allowed again
  const [resent, setResent] = useState(false); // brief "code re-sent" confirmation
  useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown(c => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Keep any ?invite / ?blist / ?plan param through the round-trip.
      options: { redirectTo: window.location.origin + window.location.search }
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function sendCode(isResend) {
    const addr = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) { setError("Enter a valid email address."); return; }
    setOtpBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true } });
    setOtpBusy(false);
    if (error) {
      if (/rate limit/i.test(error.message)) { setStage("code"); setCooldown(60); setError("Too many requests just now — wait a moment, then use the most recent code we already sent."); }
      else setError(error.message);
      return;
    }
    setStage("code"); setOtp(""); setCooldown(60);
    if (isResend) { setResent(true); setTimeout(() => setResent(false), 4000); }
  }

  async function verifyCode() {
    const token = otp.trim();
    if (token.length < 6) { setError("Enter the code from your email."); return; }
    setOtpBusy(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: "email" });
    setOtpBusy(false);
    if (error) { setError(error.message); return; }
    // The onAuthStateChange listener in App handles the signed-in state.
  }

  const inputStyle = { width: "100%", padding: "13px 15px", borderRadius: 12, border: "1.5px solid #ddd8ce", background: "#fff", color: "#1c1c1a", fontFamily: "'Aleo', sans-serif", fontSize: "0.92rem", boxSizing: "border-box", textAlign: "center" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: "2rem" }}>
      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✦</div>
        <h1 style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "2rem", color: "#1c1c1a", marginBottom: "0.5rem" }}>Curated</h1>
        <p style={{ fontSize: "0.85rem", color: "#6b5e4e", lineHeight: 1.5, marginBottom: "2rem" }}>Save the places you love, then turn them into plans. Sign in to get started.</p>
        {error && <div className="err" style={{ marginBottom: "1rem" }}>{error}</div>}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 100, border: "1.5px solid #ddd8ce", background: "#fff", color: "#1c1c1a", fontFamily: "'Aleo', sans-serif", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.15s" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1.25rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "#eee7db" }} />
          <span style={{ fontSize: "0.72rem", color: "#b8ac9a" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#eee7db" }} />
        </div>

        {stage === "email" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendCode()} style={inputStyle} />
            <button onClick={() => sendCode()} disabled={otpBusy} style={{ width: "100%", padding: "13px", borderRadius: 100, border: "none", background: "#726A4E", color: "#fff", fontFamily: "'Aleo', sans-serif", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>{otpBusy ? "Sending…" : "Email me a code"}</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "0.78rem", color: "#6b5e4e" }}>We sent a 6-digit code to <strong>{email}</strong>.</div>
            <div style={{ fontSize: "0.72rem", color: "#9b8f7a", lineHeight: 1.4 }}>Type the 6 digits below — <strong>not</strong> any link in the email. Use the newest email if you asked more than once.</div>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && verifyCode()} style={{ ...inputStyle, letterSpacing: "0.4em", fontSize: "1.2rem", fontWeight: 600 }} />
            <button onClick={verifyCode} disabled={otpBusy} style={{ width: "100%", padding: "13px", borderRadius: 100, border: "none", background: "#726A4E", color: "#fff", fontFamily: "'Aleo', sans-serif", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>{otpBusy ? "Verifying…" : "Verify & sign in"}</button>
            {resent && <div style={{ fontSize: "0.74rem", color: "#726A4E", fontWeight: 600 }}>✓ New code sent — check your inbox.</div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
              <button onClick={() => { setStage("email"); setOtp(""); setError(null); }} style={{ border: "none", background: "none", color: "#9b8f7a", cursor: "pointer" }}>← Change email</button>
              <button onClick={() => sendCode(true)} disabled={otpBusy || cooldown > 0} style={{ border: "none", background: "none", color: cooldown > 0 ? "#c9bfae" : "#726A4E", fontWeight: 600, cursor: cooldown > 0 ? "default" : "pointer" }}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button>
            </div>
          </div>
        )}

        <p style={{ fontSize: "0.72rem", color: "#b8ac9a", marginTop: "1.5rem", lineHeight: 1.5 }}>Invite-only beta. You need an invite to access Curated.</p>
      </div>
    </div>
  );
}

// First-run onboarding: location → name → interests → taste → this-or-that.
// The this-or-that captures revealed visual preference AND seeds the Saves board.
const OB_AXES = [
  { key: "aesthetic", A: v => (v.vibe_tags || []).includes("aesthetic"), B: v => !(v.vibe_tags || []).includes("aesthetic") && (parseFloat(v.google_rating) || 0) >= 4.5 },
  { key: "hyped", A: v => (v.vibe_tags || []).includes("iconic") || (v.celebrity_tags || []).length, B: v => (v.vibe_tags || []).includes("hidden_gems") && !(v.vibe_tags || []).includes("iconic") },
  { key: "lively", A: v => (v.vibe_tags || []).includes("social") || (v.vibe_tags || []).includes("chaotic"), B: v => (v.vibe_tags || []).includes("chill") && !(v.vibe_tags || []).includes("chaotic") && !(v.vibe_tags || []).includes("social") },
  { key: "polished", A: v => (v.vibe_tags || []).includes("fancy"), B: v => ((v.vibe_tags || []).includes("underground") || (v.vibe_tags || []).includes("chaotic")) && !(v.vibe_tags || []).includes("fancy") },
  { key: "novel", A: v => v.category === "experience" || (v.vibe_tags || []).includes("underground"), B: v => (v.vibe_tags || []).includes("iconic") || (v.vibe_tags || []).includes("cultural") },
];
function Onboarding({ user, dbVenues, onDone }) {
  const [step, setStep] = useState(0);
  const [geo, setGeo] = useState(null); // "allow" | "london"
  const [name, setName] = useState((user?.user_metadata?.full_name || "").split(" ")[0] || "");
  const [interests, setInterests] = useState([]);
  const [vibe, setVibe] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [axisIdx, setAxisIdx] = useState(0);
  const [choices, setChoices] = useState({});
  const [liked, setLiked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tapped, setTapped] = useState(null); // venue id mid tap-animation
  useEffect(() => { setTapped(null); }, [axisIdx]);

  function playPop() {
    // Soft, rounded "plink" — a gentle sine note with a warm quick decay. Quiet and
    // premium-feeling rather than a sharp beep. A tiny sine overtone adds body.
    haptic(9); // a light tactile tick to match the sound
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.012); // soft attack
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34); // warm decay
      g.connect(ctx.destination);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(784, t); // G5, mellow
      o.frequency.exponentialRampToValueAtTime(740, t + 0.3); // slight settle
      const o2 = ctx.createOscillator(); // gentle octave shimmer, low level
      o2.type = "sine"; o2.frequency.setValueAtTime(1568, t);
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.04, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); o2.connect(g2); g2.connect(ctx.destination);
      o.start(t); o2.start(t); o.stop(t + 0.36); o2.stop(t + 0.18);
    } catch (e) {}
  }
  function tapChoose(pair, pole, v) {
    if (tapped) return;
    setTapped(v.id); playPop();
    setTimeout(() => chooseAxis(pair, pole, v), 300);
  }

  const INTERESTS = [["Food & drink", "🍽️"], ["Nightlife & bars", "🍸"], ["Art & culture", "🎨"], ["Live music", "🎵"], ["Outdoors & active", "🌳"], ["Shopping & markets", "🛍️"], ["Coffee & cafés", "☕"], ["Wellness", "🧘"], ["Events & experiences", "🎫"]];
  const VIBES = ["Aesthetic-first — dimly lit, design-led", "Hidden gems over hotspots", "Always trying somewhere new", "Loves a reliable regular", "Great value, not cheap", "Lively & social", "Quiet & low-key", "Late nights", "Early starts"];

  // Build the 5 this-or-that pairs from real venues once the DB has loaded.
  useEffect(() => {
    if (pairs.length || !(dbVenues || []).length) return;
    const photo = dbVenues.filter(v => v.photo_url && v.name);
    const used = new Set();
    const pick = (pred) => { const c = photo.filter(v => !used.has(v.id) && pred(v)); if (!c.length) return null; const v = c[Math.floor(Math.random() * c.length)]; used.add(v.id); return v; };
    const out = [];
    for (const ax of OB_AXES) {
      const a = pick(ax.A) || pick(() => true);
      const b = pick(ax.B) || pick(() => true);
      if (a && b) out.push({ key: ax.key, a, b });
    }
    setPairs(out);
  }, [dbVenues]);

  const toggleInterest = (l) => setInterests(p => p.includes(l) ? p.filter(x => x !== l) : (p.length >= 4 ? p : [...p, l]));
  const toggleVibe = (l) => setVibe(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  const canNext = step === 1 ? !!name.trim() : step === 2 ? interests.length >= 3 : step === 3 ? vibe.length >= 1 : true;

  function chooseLocation(mode) {
    setGeo(mode);
    if (mode === "allow" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { try { localStorage.setItem("cl_geo", JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })); } catch (e) {} },
        () => { try { localStorage.setItem("cl_geo", "london"); } catch (e) {} }
      );
    } else { try { localStorage.setItem("cl_geo", "london"); } catch (e) {} }
    setStep(1);
  }

  function chooseAxis(pair, pole, venue) {
    setChoices(c => ({ ...c, [pair.key]: pole }));
    const nextLiked = liked.includes(venue.id) ? liked : [...liked, venue.id];
    setLiked(nextLiked);
    if (axisIdx < pairs.length - 1) setAxisIdx(axisIdx + 1);
    else finish(nextLiked);
  }
  const skipAxis = () => { if (axisIdx < pairs.length - 1) setAxisIdx(axisIdx + 1); else finish(liked); };

  async function finish(likedIds) {
    setSaving(true);
    const clean = name.trim() || "there";
    try { await supabase.auth.updateUser({ data: { full_name: clean, onboarded: true, interests, vibe, taste_axes: choices } }); } catch (e) {}
    try { await supabase.from("profiles").upsert({ id: user.id, name: clean, email: user.email }); } catch (e) {}
    const likedVenues = dbVenues.filter(v => likedIds.includes(v.id));
    if (likedVenues.length) {
      const FOLDER = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
      const rows = likedVenues.map(v => { const { id, user_id, created_at, ...rest } = v; return { ...rest, user_id: user.id, folder: FOLDER[String(v.category || "").toLowerCase()] || "Other", status: "pending" }; });
      try { await supabase.from("experiences").insert(rows); } catch (e) {}
    }
    try { localStorage.setItem("cl_onboarded_" + user.id, "1"); localStorage.setItem("cl_interests", JSON.stringify(interests)); localStorage.setItem("cl_vibe", JSON.stringify(vibe)); } catch (e) {}
    setSaving(false);
    onDone(likedVenues.length);
  }
  const next = () => setStep(step + 1);
  const chip = (sel) => ({ padding: "10px 16px", borderRadius: 100, border: sel ? "1.5px solid #726A4E" : "1.5px solid #e3ddd0", background: sel ? "#726A4E" : "#fff", color: sel ? "#fff" : "#4a4438", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Aleo', sans-serif" });
  const h = { fontFamily: "'Aleo', Georgia, serif", fontSize: "1.7rem", color: "#1c1c1a", marginBottom: 6 };
  const sub = { fontSize: "0.9rem", color: "#9b8f7a", marginBottom: 20, lineHeight: 1.5 };
  const showFooter = step >= 1 && step <= 3;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f2", display: "flex", flexDirection: "column", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ padding: "2.5rem 1.5rem 0.5rem" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? "#726A4E" : "#e3ddd0", transition: "0.3s" }} />)}
        </div>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ border: "none", background: "none", color: "#9b8f7a", fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>← Back</button>}
      </div>

      <div style={{ flex: 1, padding: "0.75rem 1.5rem", overflowY: "auto" }}>
        {step === 0 && (<>
          <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📍</div>
          <div style={h}>Show places near you?</div>
          <p style={sub}>We use your location to centre the map and surface what's close. You can just browse everything instead.</p>
          <button onClick={() => chooseLocation("allow")} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#726A4E", color: "#fff", fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Aleo', sans-serif", cursor: "pointer", marginBottom: 10 }}>Allow location</button>
          <button onClick={() => chooseLocation("london")} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1.5px solid #e3ddd0", background: "#fff", color: "#4a4438", fontSize: "0.92rem", fontWeight: 600, fontFamily: "'Aleo', sans-serif", cursor: "pointer" }}>Just browse instead</button>
        </>)}

        {step === 1 && (<>
          <div style={h}>What's your name?</div>
          <p style={sub}>So we can make Curated feel like yours.</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" autoFocus onKeyDown={e => e.key === "Enter" && canNext && next()} style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #e3ddd0", background: "#fff", fontSize: "1rem", fontFamily: "'Aleo', sans-serif", color: "#1c1c1a", boxSizing: "border-box" }} />
        </>)}

        {step === 2 && (<>
          <div style={h}>What are you into?</div>
          <p style={sub}>Pick 3–4. We'll tune your recommendations around these.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {INTERESTS.map(([l, e]) => <button key={l} onClick={() => toggleInterest(l)} style={chip(interests.includes(l))}>{e} {l}</button>)}
          </div>
        </>)}

        {step === 3 && (<>
          <div style={h}>What's your taste?</div>
          <p style={sub}>Pick whatever sounds like you.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {VIBES.map(l => <button key={l} onClick={() => toggleVibe(l)} style={chip(vibe.includes(l))}>{l}</button>)}
          </div>
        </>)}

        {step === 4 && (
          pairs.length === 0 ? <div style={{ fontSize: "0.85rem", color: "#9b8f7a" }}>Loading places…</div> : (() => {
            const pair = pairs[axisIdx];
            return (<>
              <div style={h}>Which would you save?</div>
              <p style={sub}>Tap the one you'd rather go to. <span style={{ color: "#c9bfae" }}>({axisIdx + 1} of {pairs.length})</span></p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["a", pair.a], ["b", pair.b]].map(([pole, v]) => { const on = tapped === v.id; return (
                  <button key={v.id} onClick={() => tapChoose(pair, pole, v)} style={{ position: "relative", border: "none", padding: 0, borderRadius: 18, overflow: "hidden", cursor: "pointer", height: 175, background: "#e9e4da", animation: on ? "tapPulse 0.3s ease" : undefined, outline: on ? "3px solid #726A4E" : "none", outlineOffset: -3, opacity: tapped && !on ? 0.5 : 1, transition: "opacity 0.2s" }}>
                    <img src={v.photo_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: on ? "rgba(114,106,78,0.32)" : "linear-gradient(transparent 45%, rgba(0,0,0,0.72))" }} />
                    <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, textAlign: "left", color: "#fff" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700, textShadow: "0 1px 5px rgba(0,0,0,0.8)" }}>{v.name}</div>
                      <div style={{ fontSize: "0.72rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{[cap(v.category || ""), v.area].filter(Boolean).join(" · ")}</div>
                    </div>
                    {on && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 62, height: 62, borderRadius: "50%", background: "#fff", color: "#726A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.9rem", animation: "burstIn 0.3s ease", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>♥</div></div>}
                  </button>
                ); })}
              </div>
              <button onClick={skipAxis} disabled={saving} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: "#9b8f7a", fontSize: "0.82rem", marginTop: 14, cursor: "pointer" }}>{saving ? "Setting up…" : "No preference →"}</button>
            </>);
          })()
        )}
      </div>

      {showFooter && (
        <div style={{ padding: "0.75rem 1.5rem 1.5rem" }}>
          <button onClick={next} disabled={!canNext} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: canNext ? "#726A4E" : "#cfc6b5", color: "#fff", fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Aleo', sans-serif", cursor: canNext ? "pointer" : "default" }}>Continue</button>
        </div>
      )}
    </div>
  );
}

function RatingPrompt({ plan, user, onDismiss, onSubmit }) {
  const [overall, setOverall] = useState(0);
  const [stopRatings, setStopRatings] = useState({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function rateStop(name, rating) {
    setStopRatings(prev => ({ ...prev, [name]: rating }));
  }

  async function submit() {
    if (overall === 0) return;
    setSubmitting(true);
    const ratings = Object.entries(stopRatings).map(([name, rating]) => ({ name, rating }));
    await supabase.from("plan_reviews").insert({
      user_id: user.id,
      plan_id: plan.id,
      overall_rating: overall,
      stop_ratings: ratings,
      comment: comment || null,
    });
    // Mark as reviewed in localStorage
    const reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]");
    reviewed.push(plan.id);
    localStorage.setItem("cl_reviewed", JSON.stringify(reviewed));
    setSubmitting(false);
    onSubmit();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 380, width: "100%", maxHeight: "80vh", overflow: "auto", padding: "1.5rem" }}>
        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#726A4E", fontWeight: 500, marginBottom: "0.5rem" }}>How was it?</div>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.3rem", color: "#1c1c1a", marginBottom: "0.25rem" }}>{plan.result.title}</div>
        <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: "1.25rem" }}>{plan.savedAt}</div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#4a4438", marginBottom: "0.5rem" }}>Overall rating</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setOverall(n)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid", borderColor: overall >= n ? "#726A4E" : "#ddd8ce", background: overall >= n ? "#726A4E" : "#fff", color: overall >= n ? "#fff" : "#9b8f7a", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Aleo', sans-serif" }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#4a4438", marginBottom: "0.5rem" }}>Rate each stop</div>
          {(plan.result.stops || []).map((stop, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f0ebe2" }}>
              <span style={{ fontSize: "0.8rem", color: "#1c1c1a", flex: 1 }}>{stop.emoji} {stop.name}</span>
              <div style={{ display: "flex", gap: 3 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => rateStop(stop.name, n)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid", borderColor: (stopRatings[stop.name] || 0) >= n ? "#726A4E" : "#e8e2d8", background: (stopRatings[stop.name] || 0) >= n ? "#eef3d8" : "#fff", color: (stopRatings[stop.name] || 0) >= n ? "#726A4E" : "#b8ac9a", fontSize: "0.6rem", cursor: "pointer", fontFamily: "'Aleo', sans-serif" }}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#4a4438", marginBottom: "0.5rem" }}>Any notes? (optional)</div>
          <textarea className="input-field" value={comment} onChange={e => setComment(e.target.value)} placeholder="What stood out? What would you change?" style={{ minHeight: 60 }} />
        </div>

        <button className="btn btn-teal" onClick={submit} disabled={overall === 0 || submitting}>
          {submitting ? "Saving..." : "Submit review"}
        </button>
        <button className="btn-outline" onClick={onDismiss} style={{ marginTop: "0.5rem" }}>Skip for now</button>
      </div>
    </div>
  );
}

// Full-screen sparkle loader for slower waits (plan generation, etc.).
function SparkleLoader({ label = "Curating…", brand = false }) {
  const sparkles = [
    { top: "20%", left: "18%", s: 22, d: 0 }, { top: "28%", left: "74%", s: 15, d: 0.5 },
    { top: "46%", left: "38%", s: 28, d: 0.2 }, { top: "60%", left: "78%", s: 18, d: 0.8 },
    { top: "70%", left: "22%", s: 20, d: 0.4 }, { top: "38%", left: "62%", s: 13, d: 1.0 },
    { top: "16%", left: "52%", s: 14, d: 0.7 }, { top: "78%", left: "54%", s: 16, d: 0.3 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#f7f6f2", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {sparkles.map((sp, i) => <span key={i} style={{ position: "absolute", top: sp.top, left: sp.left, fontSize: brand ? sp.s * 1.5 : sp.s, color: brand ? "#800000" : "#726A4E", animation: `twinkle 1.5s ease-in-out ${sp.d}s infinite` }}>✦</span>)}
      {brand
        ? <div style={{ fontFamily: "'Sofia', cursive", fontWeight: 700, fontSize: "4.5rem", lineHeight: 1, color: "#726A4E", textAlign: "center", zIndex: 1, animation: "loaderPulse 1.6s ease-in-out infinite" }}>Curated</div>
        : <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.3rem", color: "#1c1c1a", textAlign: "center", zIndex: 1, animation: "loaderPulse 1.6s ease-in-out infinite" }}>{label}</div>}
    </div>
  );
}

// Dedicated bar-crawl flow. Each answer maps to a value used to build the plan.
const BAR_CRAWL_QS = [
  { id: "area", q: "Which part of town?", opts: [["Soho", "central"], ["Shoreditch", "east"], ["Dalston / Hackney", "east"], ["Clapham", "southwest"], ["Peckham", "south"], ["Mayfair / Fitzrovia", "central"], ["Surprise me", "anywhere"]] },
  { id: "type", q: "Bars or pubs?", opts: [["Cocktail bars", "cocktail"], ["Proper pubs", "pub"], ["A mix of both", "mix"]] },
  { id: "vibe", q: "What's the atmosphere?", opts: [["Quiet & intimate", "quiet"], ["Music & buzzy", "music"], ["A bit of both (start chill → end lively)", "both"]] },
  { id: "dress", q: "Dress code?", opts: [["Casual", "casual"], ["Dressy / fancy", "fancy"], ["No preference", "any"]] },
  { id: "setting", q: "Indoor or outdoor?", opts: [["Mostly indoor", "indoor"], ["Rooftops / terraces", "outdoor"], ["Either", "either"]] },
  { id: "budget", q: "Budget per drink?", opts: [["£ — cheap & cheerful", "low"], ["££ — mid-range", "mid"], ["£££ — splash out", "high"]] },
];

function BarCrawlQuiz({ seedCount = 0, onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const Q = BAR_CRAWL_QS[step];
  const pick = (val) => {
    const next = { ...answers, [Q.id]: val };
    setAnswers(next);
    if (step < BAR_CRAWL_QS.length - 1) setStep(step + 1);
    else onComplete(next);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#f7f6f2", zIndex: 1300, display: "flex", flexDirection: "column", padding: "2rem 1.25rem", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <button className="btn-ghost" onClick={() => step === 0 ? onCancel() : setStep(step - 1)}>← Back</button>
        <div style={{ fontSize: "0.72rem", color: "#9b8f7a", fontWeight: 600 }}>{step + 1} / {BAR_CRAWL_QS.length}</div>
      </div>
      <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.7rem", color: "#1c1c1a" }}>🍸 Bar crawl</div>
      {seedCount > 0 && step === 0 && <div style={{ fontSize: "0.82rem", color: "#726A4E", marginTop: 4, marginBottom: 8 }}>Building around your {seedCount} saved bar{seedCount !== 1 ? "s" : ""}.</div>}
      <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#1c1c1a", margin: "20px 0 16px" }}>{Q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Q.opts.map(([label, val]) => (
          <button key={val + label} onClick={() => pick(val)} style={{ textAlign: "left", padding: "15px 16px", borderRadius: 14, border: "1.5px solid #e8e2d8", background: "#fff", fontSize: "0.95rem", color: "#1c1c1a", cursor: "pointer", fontWeight: 500 }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

// Pick a connected person and send them a list/plan.
function ShareModal({ user, item, onClose, showToast }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const nameOf = (p) => p?.name || (p?.email ? p.email.split("@")[0] : null) || "Friend";

  useEffect(() => {
    (async () => {
      const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const ids = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
      let profs = [];
      if (ids.length) { const { data } = await supabase.from("profiles").select("id,name,avatar_url,email").in("id", ids); profs = data || []; }
      setPeople(ids.map(id => profs.find(p => p.id === id) || { id }));
      setLoading(false);
    })();
  }, []);

  async function send(personId) {
    setSending(true);
    try {
      await supabase.from("shares").insert({ from_user: user.id, to_user: personId, kind: item.kind, title: item.title, payload: item.payload });
      showToast("Sent ✓");
      onClose();
    } catch (e) { showToast("Couldn't send: " + e.message); setSending(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1100, animation: "fadeIn 0.2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a" }}>Send to a friend</div>
        <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: 12 }}>{item.kind === "plan" ? "Itinerary" : "List"}: {item.title}</div>
        {loading && <div style={{ fontSize: "0.85rem", color: "#9b8f7a" }}>Loading…</div>}
        {!loading && people.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "#6b5e4e", lineHeight: 1.5 }}>You're not connected with anyone yet. Open the <strong>People</strong> tab → share your invite link, and once a friend opens it you can send them things here.</div>
        )}
        {people.map(p => (
          <button key={p.id} disabled={sending} onClick={() => send(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12, border: "1px solid #e8e2d8", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, flexShrink: 0, overflow: "hidden" }}>{p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(p).charAt(0).toUpperCase()}</div>
            <span style={{ fontSize: "0.88rem", color: "#1c1c1a", fontWeight: 500 }}>{nameOf(p)}</span>
            <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#726A4E", fontWeight: 600 }}>Send →</span>
          </button>
        ))}
        <button onClick={onClose} style={{ display: "block", width: "100%", textAlign: "center", padding: "10px", borderRadius: 10, border: "none", background: "#f5f0e8", cursor: "pointer", fontSize: "0.8rem", color: "#6b5e4e", marginTop: 4 }}>Cancel</button>
      </div>
    </div>
  );
}

// Shared styles for the bucket-list UI.
const slPill = { padding: "7px 12px", borderRadius: 100, border: "1px solid #d8d0c0", background: "#fff", color: "#4a4438", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Aleo', sans-serif" };
const slInput = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e3ddd0", background: "#fff", color: "#1c1c1a", fontFamily: "'Aleo', sans-serif", fontSize: "0.9rem", boxSizing: "border-box" };
const slOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1300, animation: "fadeIn 0.2s" };
const slSheet = { background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "75vh", overflowY: "auto", animation: "cardIn 0.25s ease" };

// Collaborative bucket lists: a list two+ connected friends both add to and tick off.
// Lists you own or are a member of, each with progress + a creator. Lives in the People tab.
function SharedListsSection({ user }) {
  const [lists, setLists] = useState([]);
  const [counts, setCounts] = useState({}); // listId -> { done, total }
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✨");
  const [saving, setSaving] = useState(false);
  const [openList, setOpenList] = useState(null);
  const EMOJIS = ["✨", "🍸", "🍜", "🎨", "🌳", "☕", "🍝", "🎬", "🏛️", "🌅"];

  async function load() {
    setLoading(true);
    // RLS returns only lists you own or are a member of.
    const { data: ls } = await supabase.from("shared_lists").select("*").order("created_at", { ascending: false });
    const rows = ls || [];
    setLists(rows);
    if (rows.length) {
      const { data: items } = await supabase.from("shared_list_items").select("list_id,done").in("list_id", rows.map(l => l.id));
      const c = {};
      (items || []).forEach(it => { const e = c[it.list_id] || (c[it.list_id] = { done: 0, total: 0 }); e.total++; if (it.done) e.done++; });
      setCounts(c);
    } else setCounts({});
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("shared_lists").insert({ name, emoji: newEmoji || "✨", owner: user.id }).select().single();
      if (error) throw error;
      // Owner is also a member, so membership-based reads/writes work uniformly.
      await supabase.from("shared_list_members").insert({ list_id: data.id, user_id: user.id });
      setNewName(""); setNewEmoji("✨"); setCreating(false);
      await load();
      setOpenList(data);
    } catch (e) { alert("Couldn't create list: " + e.message); }
    setSaving(false);
  }

  return (
    <div style={{ padding: "0 1.5rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0.25rem 0 0.15rem" }}>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a" }}>Bucket lists</div>
        <button onClick={() => setCreating(v => !v)} style={slPill}>+ New list</button>
      </div>
      <div style={{ marginBottom: 12 }} />

      {creating && (
        <div style={{ background: "#fff", border: "1px solid #f0ebe2", borderRadius: 14, padding: "0.9rem", marginBottom: 12 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Date spots" autoFocus style={slInput} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
            {EMOJIS.map(em => (
              <button key={em} onClick={() => setNewEmoji(em)} style={{ width: 34, height: 34, borderRadius: 10, border: newEmoji === em ? "2px solid #726A4E" : "1px solid #e8e2d8", background: "#fff", fontSize: "1.05rem", cursor: "pointer" }}>{em}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" style={{ marginTop: 0, flex: 1 }} disabled={saving || !newName.trim()} onClick={create}>{saving ? "Creating…" : "Create list"}</button>
            <button className="btn-outline" style={{ marginTop: 0, width: 90 }} onClick={() => { setCreating(false); setNewName(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>Loading…</div>}
      {!loading && lists.length === 0 && !creating && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>No bucket lists yet. Create one, then invite a friend to build it together.</div>}

      {lists.map(l => {
        const c = counts[l.id] || { done: 0, total: 0 };
        const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
        return (
          <button key={l.id} onClick={() => setOpenList(l)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: 12, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 14, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>{l.emoji || "✨"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>{l.name}</div>
              <div style={{ fontSize: "0.72rem", color: "#9b8f7a", margin: "1px 0 5px" }}>{c.done}/{c.total} done{l.owner !== user.id ? " · shared with you" : ""}</div>
              <div style={{ height: 5, borderRadius: 100, background: "#efe9df", overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "#726A4E", borderRadius: 100 }} />
              </div>
            </div>
            <span style={{ color: "#c9bfae", fontSize: "1.3rem", flexShrink: 0 }}>›</span>
          </button>
        );
      })}

      {openList && <SharedListView list={openList} user={user} onClose={() => { setOpenList(null); load(); }} />}
    </div>
  );
}

// One bucket list: tickable items, add-from-saves + manual add, members, and an invite link.
function SharedListView({ list, user, onClose }) {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [conns, setConns] = useState([]); // your connected friends, to add directly
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(null); // null | "saves" | "manual" | "friends"
  const [savesFolder, setSavesFolder] = useState(null); // open folder in the "from saves" picker
  const [saves, setSaves] = useState([]);
  const [savesLoaded, setSavesLoaded] = useState(false);
  const [mName, setMName] = useState(""); const [mCat, setMCat] = useState(""); const [mArea, setMArea] = useState(""); const [mComment, setMComment] = useState("");
  const [suggest, setSuggest] = useState(null); // null | "loading" | "none" | { ...google match, photo }
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailItem, setDetailItem] = useState(null); // open a list spot's full detail page
  const [mapExpanded, setMapExpanded] = useState(false);
  const [ssStatus, setSsStatus] = useState("");

  async function handleScreenshotAdd(files) {
    if (!files?.length) return;
    setBusy(true); setSsStatus("Reading screenshot...");
    try {
      const { base64, mediaType } = await fileToDownscaledBase64(files[0]);
      setSsStatus("Parsing with AI...");
      const resp = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1500,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: 'This is a screenshot about a London venue. Return ONLY valid JSON (no markdown): [{"name":"venue name","area":"neighbourhood","category":"restaurant|bar|cafe|experience|outdoor|museum|gallery|market|event|nightlife","price":"e.g. £20-30 or null","comment":"short description"}]' },
          ] }],
        }),
      });
      const data = await resp.json();
      const txt = (data.content?.find(b => b.type === "text")?.text || "");
      const raw = safeJsonParse(txt);
      if (!raw) { setSsStatus(""); setBusy(false); return; }
      const venues = Array.isArray(raw) ? raw : [raw];
      for (const v of venues) {
        if (!v?.name) continue;
        setSsStatus(`Looking up "${v.name}"...`);
        let photo = null, lat = null, lng = null, gid = null, grating = null, address = null;
        try {
          const r = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v.name, area: v.area }) });
          const d = await r.json();
          if (d.found) { lat = d.lat; lng = d.lng; gid = d.google_place_id; grating = d.google_rating; address = d.validated_address; }
          if (gid) { const pr = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", place_id: gid }) }); const pj = await pr.json(); if (pj.found) photo = pj.url; }
        } catch {}
        const row = { list_id: list.id, added_by: user.id, name: v.name, category: v.category || null, area: v.area || null, comment: v.comment || null, address, lat, lng, google_place_id: gid, google_rating: grating != null ? String(grating) : null, price: v.price || null, photo_url: photo };
        const { data: ins } = await supabase.from("shared_list_items").insert(row).select().single();
        if (ins) { setItems(prev => [...prev, ins]); celebrateAdd(); }
      }
    } catch (e) { console.error("[bucket-screenshot]", e); }
    setSsStatus(""); setBusy(false); setPicker(null);
  }
  const inviteLink = `https://london-app.vercel.app/?blist=${list.id}`;
  const nameOf = (p) => p?.name || (p?.email ? p.email.split("@")[0] : null) || "Friend";
  // Add-to-Google-Calendar link for a bucket-list item (uses its planned date if set).
  const gcalUrlFor = (it) => {
    const p = new URLSearchParams({ action: "TEMPLATE", text: it.name || "Visit", details: it.comment || "", location: it.address || it.area || "London" });
    if (it.target_date) { const s = it.target_date.replace(/-/g, ""); const e = new Date(it.target_date); e.setDate(e.getDate() + 1); p.set("dates", `${s}/${e.toISOString().slice(0, 10).replace(/-/g, "")}`); }
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  };

  async function load() {
    setLoading(true);
    const { data: its } = await supabase.from("shared_list_items").select("*").eq("list_id", list.id).order("created_at", { ascending: true });
    setItems(its || []);
    const { data: mem } = await supabase.from("shared_list_members").select("user_id").eq("list_id", list.id);
    const ids = (mem || []).map(m => m.user_id);
    let profs = {};
    if (ids.length) { const { data } = await supabase.from("profiles").select("id,name,avatar_url,email").in("id", ids); (data || []).forEach(p => { profs[p.id] = p; }); }
    setMembers(ids.map(id => ({ id, ...(profs[id] || {}) })));
    setLoading(false);
  }
  // Your connections (so you can add a friend to the list directly, no link needed).
  async function loadConns() {
    const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
    const otherIds = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
    if (!otherIds.length) { setConns([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url,email").in("id", otherIds);
    setConns((profs || []).map(p => ({ id: p.id, ...p })));
  }
  async function addMember(friendId) {
    setBusy(true);
    const { error } = await supabase.from("shared_list_members").insert({ list_id: list.id, user_id: friendId });
    if (!error) await load();
    else alert("Couldn't add them: " + error.message);
    setBusy(false);
  }
  useEffect(() => { load(); loadConns(); }, []);

  async function toggleDone(it) {
    const next = !it.done;
    // Completing the very last unticked item = the whole list is done → big celebration.
    const completesList = next && items.length > 1 && items.filter(x => x.id !== it.id).every(x => x.done);
    if (next) {
      if (completesList) { haptic([15, 40, 15, 40, 25]); blip(880); confetti({ count: 130, power: 1.25 }); }
      else { haptic(18); blip(784); }
    }
    setItems(prev => prev.map(x => x.id === it.id ? { ...x, done: next, done_by: next ? user.id : null } : x));
    await supabase.from("shared_list_items").update({ done: next, done_by: next ? user.id : null, done_at: next ? new Date().toISOString() : null }).eq("id", it.id);
    if (next) track("list_ticked", { item: it.name, list_id: list.id });
  }

  // Little reward whenever something lands on the list — sound + buzz + a small burst.
  function celebrateAdd() { haptic(15); blip(660); confetti({ count: 45, power: 0.9 }); }

  async function removeItem(it) {
    // Guard against accidental taps — removing is destructive and shared with friends.
    if (!window.confirm(`Remove "${it.name}" from this list?`)) return;
    setItems(prev => prev.filter(x => x.id !== it.id));
    await supabase.from("shared_list_items").delete().eq("id", it.id);
  }

  // Give an item a target date — it then shows on the Saves → Calendar agenda.
  async function setItemDate(it, date) {
    setItems(prev => prev.map(x => x.id === it.id ? { ...x, target_date: date || null } : x));
    await supabase.from("shared_list_items").update({ target_date: date || null }).eq("id", it.id);
  }

  async function loadSaves() {
    const { data } = await supabase.from("experiences").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSaves(data || []); setSavesLoaded(true);
  }
  function openSaves() { setPicker("saves"); if (!savesLoaded) loadSaves(); }

  async function addFromSave(s) {
    setBusy(true);
    const row = { list_id: list.id, added_by: user.id, name: s.name, category: s.category, address: s.address, area: s.area, comment: s.comment, lat: s.lat, lng: s.lng, google_place_id: s.google_place_id, google_rating: s.google_rating != null ? String(s.google_rating) : null, price: s.price || s.google_price_level || null, website: s.website, photo_url: s.photo_url };
    const { data, error } = await supabase.from("shared_list_items").insert(row).select().single();
    if (!error && data) { setItems(prev => [...prev, data]); celebrateAdd(); }
    setBusy(false);
  }

  function resetManual() { setMName(""); setMCat(""); setMArea(""); setMComment(""); setSuggest(null); setPicker(null); }

  async function addManual() {
    const name = mName.trim(); if (!name) return;
    setBusy(true);
    const row = { list_id: list.id, added_by: user.id, name, category: mCat || null, area: mArea.trim() || null, comment: mComment.trim() || null };
    const { data, error } = await supabase.from("shared_list_items").insert(row).select().single();
    if (!error && data) { setItems(prev => [...prev, data]); celebrateAdd(); resetManual(); }
    setBusy(false);
  }

  // "Did you mean this?!" — look the typed name up on Google, then fetch its photo,
  // so the user confirms the real place (with address + rating + pic) before adding.
  async function findSuggestion() {
    const name = mName.trim(); if (!name) return;
    setSuggest("loading");
    try {
      const r = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, area: mArea.trim() }) });
      const d = await r.json();
      if (!d || !d.found) { setSuggest("none"); return; }
      let photo = null;
      if (d.google_place_id) {
        try { const pr = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", place_id: d.google_place_id }) }); const pj = await pr.json(); if (pj.found && pj.url) photo = pj.url; } catch { /* no photo, still show the match */ }
      }
      setSuggest({ ...d, photo });
    } catch { setSuggest("none"); }
  }

  // Add the confirmed Google match, enriched with address/coords/rating/photo.
  async function addSuggested() {
    const d = suggest; if (!d || typeof d === "string") return;
    setBusy(true);
    const row = { list_id: list.id, added_by: user.id, name: d.validated_name || mName.trim(), category: mCat || null, area: mArea.trim() || d.derived_area || d.derived_zone || null, comment: mComment.trim() || null, address: d.validated_address || null, lat: d.lat ?? null, lng: d.lng ?? null, google_place_id: d.google_place_id || null, google_rating: d.google_rating != null ? String(d.google_rating) : null, price: d.price || null, website: d.website || null, photo_url: d.photo || null };
    const { data, error } = await supabase.from("shared_list_items").insert(row).select().single();
    if (!error && data) { setItems(prev => [...prev, data]); celebrateAdd(); resetManual(); }
    setBusy(false);
  }

  const doneCount = items.filter(i => i.done).length;
  const mapItems = items.filter(i => i.lat && i.lng);
  const onListPlaceIds = new Set(items.map(i => i.google_place_id).filter(Boolean));
  const onListNames = new Set(items.map(i => String(i.name || "").toLowerCase()));
  const availableSaves = saves.filter(s => (s.google_place_id ? !onListPlaceIds.has(s.google_place_id) : !onListNames.has(String(s.name || "").toLowerCase())));
  const SL_FOLDER_BY_CAT = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
  const slFolderOf = (s) => s.folder || SL_FOLDER_BY_CAT[String(s.category || "").toLowerCase()] || "Other";
  const availableByFolder = availableSaves.reduce((acc, s) => { const f = slFolderOf(s); (acc[f] = acc[f] || []).push(s); return acc; }, {});
  const availableFolders = Object.keys(availableByFolder).sort();

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f7f6f2", zIndex: 1200, overflowY: "auto", animation: "fadeIn 0.2s" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "1rem 1.5rem 6rem" }}>
        <button className="btn-outline" style={{ marginTop: 0, width: "auto", padding: "8px 14px" }} onClick={onClose}>← People</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1rem 0 0.25rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>{list.emoji || "✨"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.4rem", color: "#1c1c1a", lineHeight: 1.1 }}>{list.name}</div>
            <div style={{ fontSize: "0.76rem", color: "#9b8f7a", marginTop: 2 }}>{doneCount}/{items.length} ticked off</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, margin: "0.85rem 0" }}>
          {members.map(m => (
            <div key={m.id} title={nameOf(m)} style={{ width: 30, height: 30, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", border: "2px solid #f7f6f2", marginLeft: -6 }}>{m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(m).charAt(0).toUpperCase()}</div>
          ))}
          {list.owner === user.id && <button onClick={() => { loadConns(); setPicker("friends"); }} style={{ ...slPill, marginLeft: 8, borderColor: "#726A4E", color: "#726A4E", fontWeight: 600 }}>＋ Add a friend</button>}
          <button onClick={() => { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={slPill}>{copied ? "✓ Link copied" : "🔗 Invite by link"}</button>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "0.25rem 0 1.1rem", flexWrap: "wrap" }}>
          <button className="btn btn-teal" style={{ marginTop: 0, flex: 1, minWidth: "40%" }} onClick={openSaves}>＋ From saves</button>
          <button className="btn-outline" style={{ marginTop: 0, flex: 1, minWidth: "40%" }} onClick={() => setPicker("manual")}>✎ Manually</button>
          <button className="btn-outline" style={{ marginTop: 0, flex: 1, minWidth: "40%" }} onClick={() => setPicker("screenshot")}>📷 Screenshot</button>
        </div>

        {loading && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>Loading…</div>}
        {!loading && items.length === 0 && <div style={{ fontSize: "0.9rem", color: "#9b8f7a", textAlign: "center", padding: "2.5rem 1rem" }}>Nothing here yet — add your first place ✨</div>}

        {/* Mini map of every spot with a location — collapsed, tap to expand */}
        {mapItems.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {mapExpanded
              ? <><SpotsMap key={"blist-" + list.id} saves={mapItems} listName={list.name} /><button onClick={() => setMapExpanded(false)} style={{ fontSize: "0.72rem", color: "#726A4E", fontWeight: 600, border: "none", background: "none", cursor: "pointer", padding: "6px 0" }}>Collapse map ↑</button></>
              : <SpotsMap key={"blist-peek-" + list.id} saves={mapItems} listName={list.name} peek peekHeight={120} onExpand={() => setMapExpanded(true)} />
            }
          </div>
        )}

        {/* Photo gallery — tap a tile for its full detail page; tick the circle to cross it off */}
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {items.map(it => {
              const canRemove = true;
              return (
                <div key={it.id} style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: "1px solid #f0ebe2", background: "#fff", animation: "popIn 0.25s ease" }}>
                  <div onClick={() => setDetailItem(it)} style={{ cursor: "pointer", position: "relative" }}>
                    <div style={{ height: 118, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {it.photo_url
                        ? <img src={it.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: it.done ? "grayscale(0.6) brightness(0.92)" : "none" }} />
                        : <span style={{ fontSize: "2rem", opacity: it.done ? 0.5 : 1 }}>{CAT_EMOJI[String(it.category || "").toLowerCase()] || "📍"}</span>}
                    </div>
                    {it.done && <div style={{ position: "absolute", inset: 0, background: "rgba(114,106,78,0.32)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 40, height: 40, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>✓</span></div>}
                  </div>
                  <button onClick={() => toggleDone(it)} title={it.done ? "Un-tick" : "Tick off"} style={{ position: "absolute", top: 8, left: 8, width: 28, height: 28, borderRadius: "50%", border: it.done ? "none" : "2px solid #fff", background: it.done ? "#726A4E" : "rgba(0,0,0,0.28)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>{it.done ? "✓" : ""}</button>
                  {canRemove && <button onClick={() => removeItem(it)} title="Remove" style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", color: "#b0745a", cursor: "pointer", fontSize: "0.8rem", lineHeight: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>✕</button>}
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div onClick={() => setDetailItem(it)} style={{ cursor: "pointer", fontSize: "0.84rem", fontWeight: 600, color: it.done ? "#9b8f7a" : "#1c1c1a", textDecoration: it.done ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                    {[it.category, it.area].filter(Boolean).length > 0 && <div style={{ fontSize: "0.66rem", color: "#9b8f7a", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[it.category ? cap(it.category) : null, it.area].filter(Boolean).join(" · ")}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 3, position: "relative", fontSize: "0.66rem", fontWeight: 600, color: it.target_date ? "#726A4E" : "#b3a892", cursor: "pointer" }}>
                        📅 {it.target_date ? new Date(it.target_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Date"}
                        <input type="date" value={it.target_date || ""} onChange={(e) => setItemDate(it, e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                      </label>
                      <a href={gcalUrlFor(it)} target="_blank" rel="noreferrer" style={{ fontSize: "0.66rem", fontWeight: 600, color: "#726A4E", textDecoration: "none" }}>＋ Cal</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detailItem && (
        <SpotDetail
          spot={detailItem}
          user={user}
          readOnly
          onClose={() => setDetailItem(null)}
        />
      )}

      {picker === "saves" && (
        <div onClick={() => { setPicker(null); setSavesFolder(null); }} style={slOverlay}>
          <div onClick={e => e.stopPropagation()} style={slSheet}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {savesFolder && <button onClick={() => setSavesFolder(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.82rem", color: "#726A4E", fontWeight: 600, padding: 0 }}>‹ Lists</button>}
              <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a" }}>{savesFolder || "Add from your saves"}</div>
            </div>
            {!savesLoaded && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>Loading…</div>}
            {savesLoaded && availableSaves.length === 0 && <div style={{ fontSize: "0.82rem", color: "#9b8f7a", lineHeight: 1.5 }}>Nothing left to add — everything's already on the list, or you haven't saved any spots yet (add some in the Saves tab).</div>}
            {savesLoaded && !savesFolder && availableFolders.map(f => (
              <button key={f} onClick={() => setSavesFolder(f)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px", borderRadius: 12, border: "1px solid #f0ebe2", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                <span style={{ fontSize: "1.15rem", width: 30, textAlign: "center" }}>📁</span>
                <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: "#1c1c1a" }}>{f}</span>
                <span style={{ fontSize: "0.74rem", color: "#9b8f7a" }}>{availableByFolder[f].length}</span>
                <span style={{ color: "#c9bfae", fontSize: "1.1rem" }}>›</span>
              </button>
            ))}
            {savesFolder && (availableByFolder[savesFolder] || []).map(s => (
              <button key={s.id} disabled={busy} onClick={() => addFromSave(s)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 12, border: "1px solid #f0ebe2", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: 9, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📍</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>{[s.category ? cap(s.category) : null, s.area].filter(Boolean).join(" · ")}</div>
                </div>
                <span style={{ color: "#726A4E", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>＋</span>
              </button>
            ))}
            <button onClick={() => { setPicker(null); setSavesFolder(null); }} className="btn-outline">Done</button>
          </div>
        </div>
      )}

      {picker === "friends" && (() => {
        const memberIds = new Set(members.map(m => m.id));
        const addable = conns.filter(c => !memberIds.has(c.id));
        return (
          <div onClick={() => setPicker(null)} style={slOverlay}>
            <div onClick={e => e.stopPropagation()} style={slSheet}>
              <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 4 }}>Add a friend</div>
              <div style={{ fontSize: "0.76rem", color: "#9b8f7a", marginBottom: 12 }}>Add someone you're connected with — they'll get the list instantly, no link needed.</div>
              {addable.length === 0 && <div style={{ fontSize: "0.82rem", color: "#9b8f7a", lineHeight: 1.5 }}>{conns.length === 0 ? "You're not connected with anyone yet. Connect on the People tab first (swap words), then add them here." : "Everyone you're connected with is already on this list."}</div>}
              {addable.map(c => (
                <button key={c.id} disabled={busy} onClick={() => addMember(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 12, border: "1px solid #f0ebe2", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.82rem", overflow: "hidden", flexShrink: 0 }}>{c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(c).charAt(0).toUpperCase()}</div>
                  <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: "#1c1c1a" }}>{nameOf(c)}</span>
                  <span style={{ color: "#726A4E", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>＋</span>
                </button>
              ))}
              <button onClick={() => setPicker(null)} className="btn-outline">Done</button>
            </div>
          </div>
        );
      })()}

      {picker === "screenshot" && (
        <div onClick={() => setPicker(null)} style={slOverlay}>
          <div onClick={e => e.stopPropagation()} style={slSheet}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 10 }}>Add from screenshot</div>
            <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: 14 }}>Upload a screenshot of a venue — we'll parse the name and details automatically.</div>
            {ssStatus && <div style={{ fontSize: "0.82rem", color: "#726A4E", marginBottom: 10 }}>{ssStatus}</div>}
            <label className="btn btn-teal" style={{ marginTop: 0, textAlign: "center", cursor: "pointer", display: "block" }}>
              {busy ? ssStatus || "Processing..." : "📷 Choose screenshot"}
              <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={busy} onChange={e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) handleScreenshotAdd(f); }} />
            </label>
            <button onClick={() => setPicker(null)} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", color: "#9b8f7a", fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {picker === "manual" && (
        <div onClick={resetManual} style={slOverlay}>
          <div onClick={e => e.stopPropagation()} style={slSheet}>
            {suggest && typeof suggest === "object" ? (
              <>
                <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.2rem", color: "#1c1c1a", marginBottom: 3 }}>Did you mean this?! ✨</div>
                <div style={{ fontSize: "0.76rem", color: "#9b8f7a", marginBottom: 12 }}>We found this on Google — add it and we'll fill in the photo, address & rating.</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#fff", border: "1px solid #f0ebe2", borderRadius: 16, padding: 12, marginBottom: 14 }}>
                  {suggest.photo ? <img src={suggest.photo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, borderRadius: 12, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>{CAT_EMOJI[String(mCat || "").toLowerCase()] || "📍"}</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#1c1c1a", lineHeight: 1.2 }}>{suggest.validated_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9b8f7a", margin: "3px 0" }}>{[mCat ? cap(mCat) : null, suggest.derived_area || suggest.derived_zone].filter(Boolean).join(" · ")}{suggest.google_rating ? ` · ⭐ ${suggest.google_rating}` : ""}</div>
                    {suggest.validated_address && <div style={{ fontSize: "0.7rem", color: "#b3a892", lineHeight: 1.3 }}>{suggest.validated_address}</div>}
                  </div>
                </div>
                <button className="btn btn-teal" style={{ marginTop: 0 }} disabled={busy} onClick={addSuggested}>{busy ? "Adding…" : "Yes — add this"}</button>
                <button onClick={() => setSuggest(null)} className="btn-outline">Not this one ↩</button>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 10 }}>Add a place</div>
                <input value={mName} onChange={e => { setMName(e.target.value); if (suggest) setSuggest(null); }} placeholder="Place name — e.g. Tangra" autoFocus style={slInput} />
                <select value={mCat} onChange={e => setMCat(e.target.value)} style={{ ...slInput, marginTop: 8 }}>
                  <option value="">Category — none</option>
                  {["restaurant", "cafe", "bar", "nightlife", "market", "outdoor", "museum", "gallery", "experience", "event"].map(c => <option key={c} value={c}>{cap(c)}</option>)}
                </select>
                <input value={mArea} onChange={e => setMArea(e.target.value)} placeholder="Area (optional — helps us find it)" style={{ ...slInput, marginTop: 8 }} />
                <input value={mComment} onChange={e => setMComment(e.target.value)} placeholder="Note (optional)" style={{ ...slInput, marginTop: 8 }} />
                {suggest === "none" && <div style={{ fontSize: "0.74rem", color: "#b0745a", margin: "10px 2px 0", lineHeight: 1.4 }}>Couldn't find that on Google — add an area, or just add it as typed below.</div>}
                <button className="btn btn-teal" style={{ marginTop: 12 }} disabled={busy || suggest === "loading" || !mName.trim()} onClick={findSuggestion}>{suggest === "loading" ? "Searching Google…" : "🔍 Find it"}</button>
                <button className="btn-outline" style={{ marginTop: 8 }} disabled={busy || !mName.trim()} onClick={addManual}>{busy ? "Adding…" : "Add as typed"}</button>
                <button onClick={resetManual} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", color: "#9b8f7a", fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Friendly, unambiguous 4-letter words used as connect codes — easy to say and type.
const FRIEND_WORDS = ["BEAR","WOLF","DEER","FROG","DUCK","SWAN","CROW","DOVE","HAWK","MOTH","CRAB","SEAL","GOAT","LAMB","PONY","MULE","FAWN","FISH","TOAD","NEWT","HARE","MOLE","LYNX","ORCA","PUMA","WREN","LARK","LION","BASS","CLAM","RAIN","SNOW","WIND","STAR","MOON","DUSK","DAWN","TIDE","WAVE","LAKE","POND","HILL","PEAK","CAVE","ROCK","SAND","DUNE","REEF","FERN","MOSS","REED","VINE","LEAF","SEED","TREE","BARK","ROOT","PINE","PALM","MINT","LIME","PEAR","PLUM","KALE","BEAN","RICE","CAKE","TART","CORN","OKRA","SAGE","DILL","BLUE","TEAL","GOLD","RUBY","JADE","ROSE","PINK","OPAL","ONYX","BOAT","SHIP","KITE","BELL","DRUM","HARP","LAMP","DOOR","BOOK","NOTE","COIN","RING","BEAD","LENS","FLAG","FIRE","GLOW","MIST","HAZE","GATE","PATH","NEST","WING"];

// A friend's profile, Instagram-style: avatar + stats header, then their saves
// grouped into folders exactly like your own Saves page. Tap a folder to see the
// spots inside and copy any of them to your own board.
function FriendProfile({ user, friend, onClose }) {
  const nameOf = (p) => p?.name || (p?.email ? p.email.split("@")[0] : null) || "Friend";
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [myKeys, setMyKeys] = useState(new Set());   // spots already on YOUR board (so we don't offer duplicates)
  const [myFolders, setMyFolders] = useState([]);    // your existing folder names, for the "save to…" picker
  const [openFolder, setOpenFolder] = useState(null);
  const [detailSpot, setDetailSpot] = useState(null);
  const [savePick, setSavePick] = useState(null);    // a spot awaiting a "which list?" choice
  const [newFolder, setNewFolder] = useState("");
  const [friendCount, setFriendCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const keyOf = (s) => s.google_place_id || String(s.name || "").toLowerCase().trim();
  const isSaved = (s) => savedIds.has(s.id) || myKeys.has(keyOf(s));
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("experiences").select("*").eq("user_id", friend.id).order("created_at", { ascending: false });
      setSaves(data || []); setLoading(false);
      // Learn what's already on your own board (across app reloads) so a spot you've
      // already saved shows "✓ Saved" — not another "Save" button that double-adds.
      const { data: mine } = await supabase.from("experiences").select("name,google_place_id,folder").eq("user_id", user.id);
      setMyKeys(new Set((mine || []).map(m => m.google_place_id || String(m.name || "").toLowerCase().trim())));
      setMyFolders([...new Set((mine || []).map(m => m.folder).filter(Boolean))].sort());
      // How many people this friend is connected to (Instagram-style "friends" count).
      const { count } = await supabase.from("connections").select("*", { count: "exact", head: true }).or(`user_a.eq.${friend.id},user_b.eq.${friend.id}`);
      setFriendCount(count || 0);
    })();
  }, []);
  async function saveToMine(s, folder) {
    setBusy(true);
    const { id, user_id, created_at, status, folder: _f, ...rest } = s;
    const { error } = await supabase.from("experiences").insert({ ...rest, user_id: user.id, folder: folder || null, status: "pending" });
    if (!error) {
      setSavedIds(prev => new Set(prev).add(s.id));
      setMyKeys(prev => new Set(prev).add(keyOf(s)));
      if (folder) setMyFolders(prev => prev.includes(folder) ? prev : [...prev, folder].sort());
    } else { alert("Couldn't save it: " + error.message); }
    setBusy(false); setSavePick(null); setNewFolder("");
  }
  const FCAT = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
  const folderOf = (s) => s.folder || FCAT[String(s.category || "").toLowerCase()] || "Other";
  const grouped = saves.reduce((acc, s) => { const f = folderOf(s); (acc[f] = acc[f] || []).push(s); return acc; }, {});
  const folderNames = Object.keys(grouped).sort();
  const folderSaves = openFolder ? (grouped[openFolder] || []) : [];
  const stat = (n, l) => <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1c1c1a" }}>{n}</div><div style={{ fontSize: "0.68rem", color: "#9b8f7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div></div>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fbfaf8", zIndex: 1200, overflowY: "auto", animation: "fadeIn 0.2s" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "1rem 1.5rem 6rem" }}>
        <button className="btn-outline" style={{ marginTop: 0, width: "auto", padding: "8px 14px" }} onClick={openFolder ? () => setOpenFolder(null) : onClose}>← {openFolder ? "Profile" : "People"}</button>

        {/* Instagram-style header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1.25rem" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "2.2rem", overflow: "hidden", border: "3px solid #fff", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>{friend.avatar_url ? <img src={friend.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(friend).charAt(0).toUpperCase()}</div>
          <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.5rem", color: "#1c1c1a", marginTop: 10 }}>{nameOf(friend)}</div>
          <div style={{ display: "flex", gap: 30, marginTop: 12 }}>
            {stat(saves.length, "Saves")}
            {stat(folderNames.length, "Lists")}
            {stat(friendCount, "Friends")}
          </div>
        </div>

        {loading && <div style={{ fontSize: "0.82rem", color: "#9b8f7a", textAlign: "center", marginTop: "1.5rem" }}>Loading…</div>}
        {!loading && saves.length === 0 && <div style={{ fontSize: "0.85rem", color: "#9b8f7a", textAlign: "center", padding: "2.5rem 1rem", lineHeight: 1.5 }}>{nameOf(friend)} hasn't saved anything yet.</div>}

        {/* Folder grid — same layout as your own Saves page */}
        {!openFolder && folderNames.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: "1.5rem" }}>
            {folderNames.map(f => (
              <button key={f} onClick={() => setOpenFolder(f)} style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", background: "#fff", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <ListCover items={grouped[f]} height={130} />
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f}</div>
                  <div style={{ fontSize: "0.68rem", color: "#9b8f7a" }}>{grouped[f].length} spot{grouped[f].length !== 1 ? "s" : ""}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Inside a folder — big spot cards, exactly like your own Saves folders.
            Tap a card to open its full detail page; save any to your own board. */}
        {openFolder && (
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 12 }}>{openFolder} ({folderSaves.length})</div>
            {folderSaves.map(s => (
              <div key={s.id} style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: "1px solid #f0ebe2", background: "#fff", marginBottom: 14 }}>
                <div onClick={() => setDetailSpot(s)} style={{ cursor: "pointer" }}>
                  <BigSpotCard s={s} photo={s.photo_url} />
                </div>
                <div style={{ padding: "0 12px 12px", display: "flex", justifyContent: "center" }}>
                  {isSaved(s)
                    ? <span style={{ fontSize: "0.74rem", color: "#726A4E", fontWeight: 600, padding: "7px 16px" }}>✓ On your board</span>
                    : <button disabled={busy} onClick={() => setSavePick(s)} style={{ border: "1.5px solid #726A4E", background: "#fff", color: "#726A4E", borderRadius: 100, padding: "7px 18px", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>＋ Save to my board</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailSpot && (
        <SpotDetail
          spot={detailSpot}
          user={user}
          readOnly
          onClose={() => setDetailSpot(null)}
          onSaveToBoard={isSaved(detailSpot) ? null : () => setSavePick(detailSpot)}
          savedToBoard={isSaved(detailSpot)}
        />
      )}

      {/* "Save to which list?" — pick an existing list, make a new one, or auto-sort by category */}
      {savePick && (
        <div onClick={() => { setSavePick(null); setNewFolder(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1400, animation: "fadeIn 0.2s" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.75rem", width: "100%", maxWidth: 420, maxHeight: "72vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.15rem", color: "#1c1c1a", marginBottom: 3 }}>Save to which list?</div>
            <div style={{ fontSize: "0.76rem", color: "#9b8f7a", marginBottom: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{savePick.name}</div>
            <button disabled={busy} onClick={() => saveToMine(savePick, null)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 12, border: "1px solid #f0ebe2", background: "#fbfaf8", cursor: "pointer", marginBottom: 8 }}>
              <span style={{ fontSize: "1.1rem", width: 26, textAlign: "center" }}>✨</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", color: "#1c1c1a" }}>Auto — sort by category</span>
            </button>
            {myFolders.map(f => (
              <button key={f} disabled={busy} onClick={() => saveToMine(savePick, f)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 12, border: "1px solid #f0ebe2", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                <span style={{ fontSize: "1.1rem", width: 26, textAlign: "center" }}>📁</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f}</span>
              </button>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="New list name…" style={{ flex: 1, padding: "11px 12px", borderRadius: 12, border: "1px solid #e8e2d8", fontSize: "0.88rem", fontFamily: "inherit" }} />
              <button disabled={busy || !newFolder.trim()} onClick={() => saveToMine(savePick, newFolder.trim())} style={{ border: "none", background: newFolder.trim() ? "#726A4E" : "#cfc8ba", color: "#fff", borderRadius: 12, padding: "0 20px", fontWeight: 600, fontSize: "0.85rem", cursor: newFolder.trim() ? "pointer" : "default" }}>Add</button>
            </div>
            <button onClick={() => { setSavePick(null); setNewFolder(""); }} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// People hub: your invite link, who you're connected with, things shared with you.
function PeopleScreen({ user, onSavePlan, onShareSaved }) {
  const [connections, setConnections] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [msg, setMsg] = useState("");
  const [myCode, setMyCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [viewFriend, setViewFriend] = useState(null); // open a friend's board
  const [showConnect, setShowConnect] = useState(false); // collapse the connect card by default
  const [peopleTipDismissed, setPeopleTipDismissed] = useState(() => localStorage.getItem("cl_seen_people_tip") === "1");
  const inviteLink = `https://london-app.vercel.app/?invite=${user.id}`;
  const nameOf = (p) => p?.name || (p?.email ? p.email.split("@")[0] : null) || "Friend";

  // A short, memorable 4-letter word stored on the profile, so a friend can type
  // it to connect. Generated once, then reused. Only sets myCode when the write
  // is CONFIRMED persisted (via .select()) — a locally-shown-but-unsaved word
  // would look connectable but wouldn't resolve for the friend.
  async function ensureCode() {
    try {
      const { data: mine } = await supabase.from("profiles").select("friend_code").eq("id", user.id).maybeSingle();
      if (mine?.friend_code) { setMyCode(mine.friend_code); return; }
      // Words already taken by other users (RLS allows reading all profiles), so
      // we pick an unused one up front and let the unique index be the backstop.
      const { data: rows } = await supabase.from("profiles").select("friend_code").not("friend_code", "is", null);
      const used = new Set((rows || []).map(r => r.friend_code));
      const pool = FRIEND_WORDS.filter(w => !used.has(w));
      const candidates = pool.length ? pool : FRIEND_WORDS;
      for (let i = 0; i < Math.min(candidates.length, 12); i++) {
        const c = candidates[Math.floor(Math.random() * candidates.length)];
        const { data: up, error } = await supabase.from("profiles").update({ friend_code: c }).eq("id", user.id).is("friend_code", null).select("friend_code");
        if (!error && up && up.length) { setMyCode(up[0].friend_code); return; } // confirmed persisted
        const { data: re } = await supabase.from("profiles").select("friend_code").eq("id", user.id).maybeSingle();
        if (re?.friend_code) { setMyCode(re.friend_code); return; } // set concurrently / already claimed
      }
    } catch (e) {}
  }

  async function connectByCode() {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 4) { setMsg("Enter your friend's 4-letter word."); return; }
    if (code === myCode) { setMsg("That's your own word!"); return; }
    setConnecting(true); setMsg("");
    try {
      const { data } = await supabase.from("profiles").select("id,name").eq("friend_code", code).maybeSingle();
      if (!data?.id) { setMsg("No one found with that code — double-check it."); setConnecting(false); return; }
      const [a, b] = [user.id, data.id].sort();
      // ignoreDuplicates → "ON CONFLICT DO NOTHING", so re-connecting an existing
      // pair never triggers an UPDATE (which the connections table has no policy for).
      const { error } = await supabase.from("connections").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b", ignoreDuplicates: true });
      if (error) throw error;
      haptic([15, 40, 15, 40, 25]); confetti({ count: 120, power: 1.2 });
      setMsg(`Connected with ${data.name || "your friend"}! 🎉`); setCodeInput("");
      await load();
    } catch (e) { setMsg("Couldn't connect: " + e.message); }
    setConnecting(false);
  }

  async function load() {
    setLoading(true);
    const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
    const otherIds = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
    const { data: sh } = await supabase.from("shares").select("*").eq("to_user", user.id).order("created_at", { ascending: false });
    const ids = [...new Set([...otherIds, ...(sh || []).map(s => s.from_user)])];
    let prof = {};
    if (ids.length) { const { data } = await supabase.from("profiles").select("id,name,avatar_url,email").in("id", ids); (data || []).forEach(p => { prof[p.id] = p; }); }
    setConnections(otherIds.map(id => ({ id, ...(prof[id] || {}) })));
    setShares((sh || []).map(s => ({ ...s, from: prof[s.from_user] || {} })));
    setLoading(false);
  }
  useEffect(() => { load(); ensureCode(); }, []);

  async function saveShare(s) {
    try {
      if (s.kind === "plan") { onSavePlan(s.payload); setMsg("Saved to My Plans ✓"); }
      else {
        const spots = (s.payload?.spots || []).map(v => { const { id, user_id, created_at, ...rest } = v; return { ...rest, user_id: user.id, folder: s.payload.name || "Shared with me", status: "pending" }; });
        if (spots.length) { const { error } = await supabase.from("experiences").insert(spots); if (error) throw error; }
        setMsg(`Saved ${spots.length} spot${spots.length !== 1 ? "s" : ""} to "${s.payload.name || "Shared with me"}" ✓`);
      }
      await supabase.from("shares").update({ seen: true }).eq("id", s.id);
      onShareSaved && onShareSaved();
      setViewing(null); setTimeout(() => setMsg(""), 2800); load();
    } catch (e) { setMsg("Couldn't save: " + e.message); }
  }

  if (loading) return <div className="loading"><div className="loading-ring" /><div className="loading-sub">Loading…</div></div>;

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">People</div>
        <p className="section-sub">Connect with friends, then send each other lists and itineraries.</p>
      </div>
      {msg && <div style={{ margin: "0 1.5rem 0.75rem", background: "#eef3d8", color: "#4B342F", borderRadius: 12, padding: "10px 12px", fontSize: "0.82rem" }}>{msg}</div>}

      {/* Friends first — the heart of the tab */}
      <div style={{ padding: "0 1.5rem 1rem" }}>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a", margin: "0.25rem 0 0.6rem" }}>Friends ({connections.length})</div>
        {connections.length === 0 && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>No friends yet — tap &ldquo;Connect with a friend&rdquo; below.</div>}
        {connections.length === 0 && !peopleTipDismissed && (
          <div style={{ background: "#faf9f6", border: "1px solid #e8e2d8", borderRadius: 14, padding: "12px 14px", marginTop: 10, position: "relative" }}>
            <button onClick={() => { localStorage.setItem("cl_seen_people_tip", "1"); setPeopleTipDismissed(true); }} style={{ position: "absolute", top: 8, right: 10, border: "none", background: "none", color: "#9b8f7a", fontSize: "1rem", cursor: "pointer", lineHeight: 1 }}>&times;</button>
            <div style={{ fontSize: "0.82rem", color: "#6b5e4e", lineHeight: 1.5, paddingRight: 16 }}>Connect with friends by swapping your 4-letter word code. Once connected, you can share lists and spots with each other.</div>
          </div>
        )}
        {connections.length > 0 && <div style={{ fontSize: "0.72rem", color: "#b3a892", marginBottom: 8 }}>Tap a friend to see their profile & saves.</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {connections.map(c => (
            <button key={c.id} onClick={() => setViewFriend(c)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 100, padding: "6px 12px 6px 6px", cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.8rem", overflow: "hidden" }}>{c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(c).charAt(0).toUpperCase()}</div>
              <span style={{ fontSize: "0.8rem", color: "#1c1c1a" }}>{nameOf(c)}</span>
              <span style={{ color: "#c9bfae", fontSize: "1rem" }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Connect — collapsed to a single row until tapped */}
      <div style={{ padding: "0 1.5rem 1rem" }}>
        {!showConnect ? (
          <button data-tour="invite" onClick={() => setShowConnect(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 16, padding: "14px 16px", cursor: "pointer" }}>
            <span style={{ fontSize: "1.1rem" }}>🤝</span>
            <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", fontWeight: 600, color: "#1c1c1a" }}>Connect with a friend</span>
            <span style={{ color: "#c9bfae", fontSize: "1.2rem" }}>›</span>
          </button>
        ) : (
          <div data-tour="invite" style={{ background: "#fff", border: "1px solid #f0ebe2", borderRadius: 16, padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: "#1c1c1a" }}>Connect with a friend</div>
              <button onClick={() => setShowConnect(false)} style={{ border: "none", background: "none", color: "#9b8f7a", fontSize: "0.8rem", cursor: "pointer" }}>Hide</button>
            </div>
            <div style={{ fontSize: "0.76rem", color: "#9b8f7a", marginBottom: 10 }}>Both got the app? Swap words. Tell your friend your word, or enter theirs.</div>
            <div style={{ background: "#faf9f6", borderRadius: 12, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", fontWeight: 700, marginBottom: 5 }}>Your word</div>
              <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "2.2rem", letterSpacing: "0.18em", color: "#1c1c1a", lineHeight: 1, paddingLeft: "0.18em" }}>{myCode || "····"}</div>
              <button className="btn-outline" style={{ marginTop: 12, padding: "8px 22px", fontSize: "0.8rem", width: "auto" }} disabled={!myCode} onClick={() => { navigator.clipboard?.writeText(myCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}>{codeCopied ? "✓ Copied" : "Copy word"}</button>
            </div>
            <div style={{ fontSize: "0.76rem", color: "#6b5e4e", margin: "12px 0 8px" }}>Have your friend's word? Enter it:</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} placeholder="e.g. BLUE" maxLength={4} className="input-field" style={{ flex: 1, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }} />
              <button onClick={connectByCode} disabled={connecting || codeInput.trim().length !== 4} style={{ border: "none", background: codeInput.trim().length === 4 ? "#726A4E" : "#cfc8ba", color: "#fff", borderRadius: 10, padding: "0 18px", fontWeight: 600, fontSize: "0.82rem", cursor: codeInput.trim().length === 4 ? "pointer" : "default" }}>{connecting ? "…" : "Connect"}</button>
            </div>
            <div style={{ height: 1, background: "#f0ebe2", margin: "14px 0" }} />
            <div style={{ fontSize: "0.76rem", color: "#9b8f7a", marginBottom: 8 }}>Not on the app yet? Send them an invite link:</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-outline" style={{ marginTop: 0, flex: 1 }} onClick={() => { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "✓ Copied" : "🔗 Copy link"}</button>
              <button className="btn-outline" style={{ marginTop: 0, flex: 1 }} onClick={() => { if (navigator.share) navigator.share({ title: "Connect on Curated", url: inviteLink }); else window.open(`https://wa.me/?text=${encodeURIComponent("Connect with me on Curated: " + inviteLink)}`); }}>📤 Share</button>
            </div>
          </div>
        )}
      </div>

      <div data-tour="shared-lists"><SharedListsSection user={user} /></div>

      <div style={{ padding: "0 1.5rem 1rem" }}>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a", margin: "0.25rem 0 0.6rem" }}>Shared with you ({shares.length})</div>
        {shares.length === 0 && <div style={{ fontSize: "0.82rem", color: "#9b8f7a" }}>Nothing yet. When a friend sends you a list or itinerary, it shows here.</div>}
        {shares.map(s => (
          <div key={s.id} onClick={() => setViewing(s)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 14, marginBottom: 10, cursor: "pointer", opacity: s.seen ? 0.7 : 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.kind === "plan" ? "#DD4124" : "#726A4E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{s.kind === "plan" ? "🗺️" : "📋"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1c1c1a" }}>{s.title || (s.kind === "plan" ? "An itinerary" : "A list")}</div>
              <div style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>from {nameOf(s.from)} · {s.kind === "plan" ? "itinerary" : "list"}{s.seen ? " · saved" : ""}</div>
            </div>
            {!s.seen && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DD4124" }} />}
          </div>
        ))}
      </div>

      {viewFriend && <FriendProfile user={user} friend={viewFriend} onClose={() => setViewFriend(null)} />}

      {viewing && (
        <div onClick={() => setViewing(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1.5rem", animation: "fadeIn 0.2s" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: "1.25rem", width: "100%", maxWidth: 340, maxHeight: "75vh", overflowY: "auto", animation: "popIn 0.25s" }}>
            <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 2 }}>{viewing.title}</div>
            <div style={{ fontSize: "0.74rem", color: "#9b8f7a", marginBottom: 12 }}>from {nameOf(viewing.from)}</div>
            {viewing.kind === "plan" ? (
              <div style={{ fontSize: "0.82rem", color: "#6b5e4e" }}>{(viewing.payload?.plan?.stops || []).length} stops · {viewing.payload?.plan?.tagline || ""}</div>
            ) : (
              <div style={{ fontSize: "0.82rem", color: "#6b5e4e" }}>{(viewing.payload?.spots || []).length} spots: {(viewing.payload?.spots || []).slice(0, 6).map(s => s.name).join(", ")}{(viewing.payload?.spots || []).length > 6 ? "…" : ""}</div>
            )}
            <button className="btn btn-teal" style={{ marginTop: 14 }} onClick={() => saveShare(viewing)}>{viewing.kind === "plan" ? "Save to My Plans" : "Save to my lists"} ✦</button>
            <button className="btn-outline" onClick={() => setViewing(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GUIDED PRODUCT TOUR ───────────────────────────────────────
// Whole-app walkthrough: auto-navigates between tabs and spotlights the key
// control on each, driven by Back / Next. Launched from Me → "Take a tour".
// Targets are found by [data-tour] selector; a missing target degrades to a
// centred card (never traps the user).
// Steps 1 & 2 open a real saved spot's detail sheet (driven via tourWantsSpot on
// SavedScreen) so the rating / photos / book button are spotlighted in situ.
const PRODUCT_TOUR = [
  { tab: "saved", selector: "[data-tour='saves-lists']", title: "Your saves live here", body: "Everything you capture — screenshots, TikTok, Instagram, or added by hand — lands on your board, grouped into lists." },
  { tab: "saved", selector: "[data-tour='spot-rating']", title: "Inside a spot", body: "Every saved place opens like this — swipe the photos up top, rate it and see the average, and read the full description below." },
  { tab: "saved", selector: "[data-tour='spot-book']", title: "Book it in a tap", body: "Go straight to booking or the venue's website — and add it to your calendar right here." },
  { tab: "saved", selector: "[data-tour='saves-build']", title: "Turn saves into a plan", body: "Any spot — or a whole list — can become a full day or night itinerary. We route it for you." },
  { tab: "plans", selector: "[data-tour='plan-cta']", title: "Plan a day or night", body: "Or start fresh here. Answer a few quick questions and we'll build the itinerary from scratch." },
  { tab: "people", selector: "[data-tour='invite']", title: "Add your friends", body: "Share your invite link. Once a friend joins you're connected — and can see each other's saves." },
  { tab: "people", selector: "[data-tour='shared-lists']", title: "Plan together", body: "Build a shared bucket list with a friend and send spots back and forth — plan your next outing as a team." },
];

function AppProductTour({ steps, step, onNext, onBack, onDone, onSkip }) {
  const s = steps[step];
  const last = step === steps.length - 1;
  const [rect, setRect] = useState(null);
  const scrolledFor = useRef(-1);
  useEffect(() => {
    let raf, dead = false;
    const tick = () => {
      const el = document.querySelector(s.selector);
      const r = el && el.getBoundingClientRect();
      if (r && (r.width || r.height)) {
        if (scrolledFor.current !== step) {
          if (r.top < 90 || r.bottom > window.innerHeight - 200) el.scrollIntoView({ block: "center", behavior: "smooth" });
          scrolledFor.current = step;
        }
        setRect({ t: r.top, l: r.left, w: r.width, h: r.height });
      } else { setRect(null); }
      if (!dead) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [s.selector, step]);

  const pad = 6;
  const hole = rect && { position: "fixed", top: rect.t - pad, left: rect.l - pad, width: rect.w + pad * 2, height: rect.h + pad * 2, borderRadius: 14, boxShadow: "0 0 0 9999px rgba(20,18,14,0.66)", border: "2px solid #DFEF87", pointerEvents: "none", zIndex: 3001, transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease" };
  const below = !rect || (rect.t + rect.h / 2) < window.innerHeight * 0.52;
  const tip = { position: "fixed", left: 12, right: 12, maxWidth: 400, margin: "0 auto", background: "#fff", borderRadius: 18, padding: "16px 16px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", zIndex: 3002, pointerEvents: "auto", ...(rect ? (below ? { top: Math.min(rect.t + rect.h + pad + 12, window.innerHeight - 230) } : { bottom: window.innerHeight - rect.t + pad + 12 }) : { top: "42%" }) };
  const btn = { border: "none", borderRadius: 100, padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000 }}>
      <div style={{ position: "fixed", inset: 0, background: rect ? "transparent" : "rgba(20,18,14,0.66)", pointerEvents: "auto" }} />
      {rect && <div style={hole} />}
      <div style={tip}>
        <div style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", fontWeight: 700, marginBottom: 5 }}>Step {step + 1} of {steps.length}</div>
        <div style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: "1.15rem", color: "#1c1c1a", marginBottom: 5 }}>{s.title}</div>
        <div style={{ fontSize: "0.86rem", color: "#4a4438", lineHeight: 1.5, marginBottom: 14 }}>{s.body}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onSkip} style={{ ...btn, background: "transparent", color: "#9b8f7a", padding: "9px 4px" }}>Skip</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {step > 0 && <button onClick={onBack} style={{ ...btn, background: "#f0ebe2", color: "#4a4438" }}>Back</button>}
            <button onClick={last ? onDone : onNext} style={{ ...btn, background: "#726A4E", color: "#fff" }}>{last ? "Done" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sharedPlan, setSharedPlan] = useState(null);
  const [shareItem, setShareItem] = useState(null); // { kind, title, payload } -> ShareModal
  const [barCrawl, setBarCrawl] = useState(null);   // { seed: [...] } -> BarCrawlQuiz
  const [pendingGen, setPendingGen] = useState(false); // fire generate() after ans/times state commits
  const [activeTab, setActiveTab] = useState("saved"); // Saves is the landing tab (first tab)
  const [tourStep, setTourStep] = useState(-1); // -1 = off; guided product tour (Me → "Take a tour")
  const [importSignal, setImportSignal] = useState(0); // bump to launch the hands-on "add a save" walkthrough
  const [peopleBadge, setPeopleBadge] = useState(0); // unsaved shares sent to you → People tab badge
  const [captureSignal, setCaptureSignal] = useState(0); // bump to pop the global capture sheet on Saves
  const [onboardDone, setOnboardDone] = useState(false); // set true when first-run onboarding finishes
  const [splashDone, setSplashDone] = useState(() => { try { return !!localStorage.getItem("cl_splash"); } catch (e) { return false; } });
  const [showStarter, setShowStarter] = useState(false); // "based on what you liked" banner on the board
  const [calSignal, setCalSignal] = useState(0); // bump to jump Saves to its Calendar view
  const [quizStep, setQuizStep] = useState(-1);
  const [ans, setAns] = useState({});
  const [times, setTimes] = useState({ start: "18:00", end: "23:00" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cl_plans") || "[]"); } catch { return []; }
  });
  const [viewingPlan, setViewingPlan] = useState(null);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [ratingPlan, setRatingPlan] = useState(null);
  const [dbVenues, setDbVenues] = useState([]);
  const [adminBadge, setAdminBadge] = useState(0);
  const [preferences, setPreferences] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cl_prefs") || "[]"); } catch { return []; }
  });
  const timerRef = useRef(null);
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Guided product tour: each step drives which tab is shown. Also expose a
  // console hook so the tour can be replayed for testing/support.
  useEffect(() => {
    if (tourStep < 0 || tourStep >= PRODUCT_TOUR.length) return;
    const t = PRODUCT_TOUR[tourStep].tab;
    setActiveTab(t);
    if (t !== "home") { setQuizStep(-1); setViewingPlan(null); }
  }, [tourStep]);
  useEffect(() => { window.__startTour = () => setTourStep(0); }, []);

  // Notifications: badge the People tab when a friend sends you a spot list or
  // itinerary you haven't saved yet, and toast in real time when a new one lands.
  useEffect(() => {
    if (!user?.id) { setPeopleBadge(0); return; }
    let active = true;
    (async () => {
      const { count } = await supabase.from("shares").select("id", { count: "exact", head: true }).eq("to_user", user.id).eq("seen", false);
      if (active) setPeopleBadge(count || 0);
    })();
    const ch = supabase.channel("shares-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shares", filter: `to_user=eq.${user.id}` }, (payload) => {
        setPeopleBadge(n => n + 1);
        const k = payload.new?.kind === "plan" ? "an itinerary" : "a list";
        showToast(`A friend sent you ${k} — check People`);
        notify("New from a friend ✦", `You've been sent ${k}`);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shared_list_members", filter: `user_id=eq.${user.id}` }, async (payload) => {
        const listId = payload.new?.list_id;
        if (!listId) return;
        const { data: listData } = await supabase.from("shared_lists").select("name,emoji").eq("id", listId).single();
        const name = listData?.name || "a bucket list";
        showToast(`You've been added to "${name}" 🎉`);
        notify("New bucket list ✦", `You've been added to "${name}"`);
        setPeopleBadge(n => n + 1);
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  // Auth listener + login tracking
  useEffect(() => {
    function trackLogin(u) {
      if (!u) return;
      fetch("/api/track-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: u.id, email: u.email, name: u.user_metadata?.full_name, avatar_url: u.user_metadata?.avatar_url })
      }).catch(() => {});
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === "SIGNED_IN") trackLogin(session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check for unrated past plans — only prompt once a plan is a couple of days old.
  useEffect(() => {
    if (!user || plans.length === 0) return;
    const reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]");
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    const unrated = plans.find(p => p.id && !reviewed.includes(p.id) && p.createdAt && (Date.now() - p.createdAt) >= TWO_DAYS);
    if (unrated) setTimeout(() => setRatingPlan(unrated), 1500);
  }, [user, plans]);

  // Run generate() once new ans/times have committed (used by the bar-crawl flow).
  useEffect(() => {
    if (!pendingGen) return;
    setPendingGen(false);
    generate();
  }, [pendingGen]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("cl_prefs", JSON.stringify(preferences));
  }, [preferences]);

  // Load venue ratings from reviews
  const [venueRatings, setVenueRatings] = useState({});
  useEffect(() => {
    async function loadRatings() {
      const { data } = await supabase.from("plan_reviews").select("stop_ratings");
      if (!data) return;
      const agg = {};
      for (const review of data) {
        for (const sr of (review.stop_ratings || [])) {
          if (!agg[sr.name]) agg[sr.name] = { total: 0, count: 0 };
          agg[sr.name].total += sr.rating;
          agg[sr.name].count += 1;
        }
      }
      const avgs = {};
      for (const [name, d] of Object.entries(agg)) { avgs[name] = d.total / d.count; }
      setVenueRatings(avgs);
    }
    loadRatings();
  }, []);

  // Load approved venues from Supabase
  useEffect(() => {
    async function loadVenues() {
      const { data } = await supabase.from("experiences").select("*").eq("status", "approved");
      if (data) setDbVenues(data);
    }
    loadVenues();
  }, []);

  useEffect(() => {
    if (loading) { timerRef.current = setInterval(() => setLoadIdx(i => (i + 1) % LOADS.length), 1600); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  function showToast(msg) { setToast({ msg, show: true }); setTimeout(() => setToast(t => ({ ...t, show: false })), 2200); }

  function toggle(qId, val, multi) {
    setAns(prev => {
      if (multi) { const cur = prev[qId] || []; return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }; }
      const updated = { ...prev, [qId]: val };
      // Auto-set times based on timeOfDay selection
      if (qId === "timeOfDay") {
        if (val === "day") setTimes({ start: "10:00", end: "18:00" });
        else if (val === "night") setTimes({ start: "18:00", end: "00:00" });
        else if (val === "full") setTimes({ start: "10:00", end: "23:00" });
      }
      return updated;
    });
  }

  function startQuiz() { setQuizStep(0); setAns({}); setResult(null); setError(null); setActiveTab("home"); }
  function nextStep() {
    setQuizStep(s => {
      const next = s + 1;
      if (next === 2 && ans.savedVenues?.length) return 3;
      return next;
    });
  }
  function prevStep() {
    setQuizStep(s => {
      const prev = s - 1;
      if (prev === 2 && ans.savedVenues?.length) return 1;
      return Math.max(0, prev);
    });
  }

  async function generate() {
    setLoading(true); setError(null);
    const shortlistResult = buildShortlist(ans, dbVenues, venueRatings);
    let shortlist = shortlistResult.venues || shortlistResult;
    const savedVenues = ans.savedVenues || [];
    if (ans._barCrawl && savedVenues.length) {
      shortlist = savedVenues.map(v => ({
        name: v.name, type: v.category || "bar", travelZone: v.zone || v.area || "London",
        price: v.price, tags: v.vibe_tags, desc: v.comment, emoji: "🍸",
        bookingRequired: false, google_rating: v.google_rating,
      }));
    } else if (ans._barCrawl) {
      const drink = shortlist.filter(v => /bar|pub|night|wine|cocktail/i.test(v.type || ""));
      if (drink.length >= 3) shortlist = drink;
    } else if (savedVenues.length) {
      // Inject saved venues into shortlist so Claude has them in the venue data
      const savedAsShortlist = savedVenues.map(v => ({
        name: v.name, type: v.category || "experience", travelZone: v.zone || v.area || "London",
        price: v.price, tags: v.vibe_tags || [], desc: v.comment, emoji: "📌",
        bookingRequired: false, google_rating: v.google_rating, _saved: true,
      }));
      const savedNames = new Set(savedVenues.map(v => v.name?.toLowerCase()));
      shortlist = [...savedAsShortlist, ...shortlist.filter(v => !savedNames.has(v.name?.toLowerCase()))];
    }
    const chosenZone = shortlistResult.zone || ans.area;
    const venueData = JSON.stringify(shortlist.map(v => ({
      name: v.name, type: v.type, area: v.travelZone + " London",
      price: v.price, tags: v.tags, desc: v.desc, emoji: v.emoji,
      booking: v.bookingRequired ? "Book ahead" : "Walk-in fine",
      rating: v.google_rating ? `⭐ ${v.google_rating}` : null,
      price_range: v.price || null,
    })));

    const matchVenue = (name) => {
      const n = (name || "").toLowerCase();
      const hit = (v) => v.name && (v.name.toLowerCase().includes(n) || n.includes(v.name.toLowerCase()));
      return dbVenues.find(hit) || savedVenues.find(hit) || null;
    };
    const savedForPrompt = savedVenues.map(v => ({ name: v.name, type: v.category, area: v.zone || v.area || "London", price: v.price, tags: v.vibe_tags, desc: v.comment, lat: v.lat, lng: v.lng }));
    const savedClause = savedVenues.length
      ? '. ABSOLUTE REQUIREMENT — FAILURE TO FOLLOW IS AN ERROR: You MUST include these saved spots in the plan. They are non-negotiable. Place them at the start, middle, or end — wherever they fit the flow best. Every other stop MUST be within walking distance (max 10 min walk) of a saved spot. The entire plan must be geographically clustered around these locations. For each saved spot, set "saved": true. Saved spots (MUST appear in output): ' + JSON.stringify(savedForPrompt)
      : "";

    const areaNote = savedVenues.length
      ? `near ${savedVenues[0].name} in ${savedVenues[0].area || savedVenues[0].zone || "London"} (all stops walking distance)`
      : ans.area === "map_pin" ? `near dropped pin (${ans.mapPin?.lat?.toFixed(3)}, ${ans.mapPin?.lng?.toFixed(3)})` : ans.area;
    const travelNote = ans.travel === "walking"
  ? "walking only, all stops must be within 20 min walk of each other"
  : ans.travel === "max10"
  ? "strict: max 10 min walk between ANY two consecutive stops, prioritise venues in the same neighbourhood"
  : "walking and tube ok, keep total travel between stops under 30 min";

    const userStops = ans.stops === "5+" ? 5 : parseInt(ans.stops) || 4;
    const stopCount = `exactly ${userStops} stops`;
    const budgetNote = `TOTAL budget for ALL stops combined per person: ${ans.budget}. This is NOT per-stop — it is the total for the entire plan. Divide this budget across ${userStops} stops. Example: if budget is £30-£50 total and there are 3 stops, each stop should average £10-£17. The sum of all stop cost_estimates MUST stay within ${ans.budget}.`;
    const varietyRule = "STRICT: never include 2 of the same type. No 2 restaurants, no 2 bars, no 2 cafes. A good evening structure: restaurant + bar, or restaurant + dessert + bar, or activity + restaurant + bar. Vary types across the plan.";
    const prompt = "You are London's sharpest local guide. Build a perfect itinerary from these curated venues. User: " +
      ans.timeOfDay + " plan, vibes: " + (ans.vibes || []).join(", ") +
      ", area: " + areaNote +
      ", group: " + ans.groupSize + ", energy: " + ans.energy +
      ", travel: " + travelNote +
      ", " + times.start + " to " + times.end +
      ", include: " + ((ans.extras || []).join(", ") || "no extras") +
      ". " + budgetNote +
      ". " + varietyRule +
      (ans.freeText ? ". ADDITIONAL USER PREFERENCE: " + ans.freeText : "") +
      ". Venues (" + stopCount + "): " + venueData + savedClause + (ans._barCrawlClause || "") +
      ". Space stops evenly across the time window. Respond ONLY with valid JSON, no markdown, no backticks: " +
      '{"title":"punchy name","tagline":"witty sentence","vibe_scores":{"fun":7,"romantic":3,"cultural":6,"chaotic":2},"total_cost_estimate":"£X-£Ypp (this is the SUM across all stops, must be within the user budget)","stops":[{"time":"18:30","name":"venue name","type":"bar","area":"Shoreditch","emoji":"🍸","saved":false,"hook":"best thing about this place","why_it_fits":"vibe match","booking":"Walk-in fine","cost_estimate":"£X-£Ypp (avg spend at THIS stop only)","travel_to_next":"calculating..."}],"extend_the_night":"late suggestion","local_tip":"insider tip"}';

    try {
      const txt = await callClaude(prompt, 1200);
      const parsed = safeJsonParse(txt);
      if (!parsed) throw new Error("Couldn't build the plan from the AI response. Please try again.");

      // Enrich stops with DB data (rating, price) and real travel times
      const enrichedStops = await Promise.all((parsed.stops || []).map(async (stop, idx) => {
        // Find this venue in DB to get coordinates and Google data
        const dbVenue = matchVenue(stop.name);
        const isSaved = stop.saved === true || savedVenues.some(v => v.name && (v.name.toLowerCase().includes(stop.name.toLowerCase()) || stop.name.toLowerCase().includes(v.name.toLowerCase())));

        const enriched = {
          ...stop,
          _saved: isSaved,
          google_rating: dbVenue?.google_rating || null,
          price_range: dbVenue?.price || stop.cost_estimate || null,
          lat: dbVenue?.lat || null,
          lng: dbVenue?.lng || null,
          celebrity_tags: dbVenue?.celebrity_tags || null,
          plant_friendly: dbVenue?.plant_friendly || false,
        };

        // Get real travel time to next stop
        if (idx < (parsed.stops || []).length - 1) {
          const nextStop = parsed.stops[idx + 1];
          const nextDbVenue = matchVenue(nextStop.name);

          if (dbVenue?.lat && dbVenue?.lng && nextDbVenue?.lat && nextDbVenue?.lng) {
            try {
              const travelMode = ans.travel === "walk_tube" ? "transit" : "walking";
              const departureTime = new Date().toISOString(); // use now as proxy

              const travelResp = await fetch("/api/travel-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  origin: { lat: dbVenue.lat, lng: dbVenue.lng },
                  destination: { lat: nextDbVenue.lat, lng: nextDbVenue.lng },
                  mode: travelMode,
                  departureTime
                })
              });
              const travelData = await travelResp.json();
              if (travelData.found) {
                enriched.travel_to_next = travelData.label;
                enriched.travel_minutes = travelData.durationMinutes;
              }
            } catch (e) {
              // Keep Claude's estimate if travel API fails
            }
          }
        }

        return enriched;
      }));

      // Hard filter: drop stops that exceed travel time limit
      const travelLimit = ans.travel === "max10" ? 10 : ans.travel === "walking" ? 20 : 30;
      let finalStops = enrichedStops.filter((stop, idx) => {
        if (idx === 0) return true;
        const prevStop = enrichedStops[idx - 1];
        if (prevStop.travel_minutes && prevStop.travel_minutes > travelLimit) return false;
        return true;
      });

      const requestedStops = ans.stops === "5+" ? 5 : parseInt(ans.stops) || 4;
      const finalResult = { ...parsed, stops: finalStops, _fewerStops: finalStops.length < requestedStops ? `We found ${finalStops.length} stops that matched all your criteria (you asked for ${requestedStops}).` : null };
      setResult(finalResult);
      track("plan_generated", { stops: finalStops.length, vibes: ans.vibes, budget: ans.budget, area: ans.area, fromSaved: !!(ans.savedVenues?.length) });
      setQuizStep(QUESTIONS.length + 1);
      setPlans(prev => {
        const updated = [{ result: finalResult, ans: { ...ans }, times: { ...times }, savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), createdAt: Date.now(), id: generateId() }, ...prev];
        localStorage.setItem("cl_plans", JSON.stringify(updated.slice(0, 20)));
        return updated;
      });
      showToast("Plan saved to My Plans");
    } catch (e) {
      setError(e.message?.includes("AI is taking a break") ? e.message : "Couldn't generate your plan — try again in a moment.");
    }
    setLoading(false);
  }

  function resetToHome() { setQuizStep(-1); setAns({}); setResult(null); setError(null); setViewingPlan(null); setActiveTab("plans"); }
  function goToCalendar(msg) { setViewingPlan(null); setActiveTab("saved"); setCalSignal(n => n + 1); if (msg) showToast(msg); }
  function schedulePlanAt(idx, date) { setPlans(prev => { const u = prev.map((p, i) => i === idx ? { ...p, scheduledDate: date || null } : p); localStorage.setItem("cl_plans", JSON.stringify(u.slice(0, 20))); return u; }); }

  const showQuiz = activeTab === "home" && quizStep >= 0 && quizStep <= QUESTIONS.length;
  const showResult = activeTab === "home" && quizStep === QUESTIONS.length + 1 && result;
  const showHome = activeTab === "home" && quizStep === -1;
  const showViewingPlan = activeTab === "plans" && viewingPlan;

  const TABS = [
    { id: "saved", label: "Saves", icon: "📌" },
    { id: "plans", label: "Plans", icon: "📋" },
    { id: "people", label: "People", icon: "👥", badge: peopleBadge },
    { id: "me", label: "Me", icon: "🙂", badge: isAdmin ? adminBadge : 0 },
  ];

  // Stash link params on first load BEFORE they're lost — Google OAuth redirects back
  // to the bare origin, dropping ?invite / ?blist / ?plan. We persist them so the
  // handlers below can still run once the user is signed in.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    for (const k of ["invite", "blist", "plan"]) {
      const v = p.get(k);
      if (v) { try { localStorage.setItem("cl_pending_" + k, v); } catch (e) {} }
    }
  }, []);
  const takePending = (key) => {
    const fromUrl = new URLSearchParams(window.location.search).get(key);
    let v = fromUrl; try { v = fromUrl || localStorage.getItem("cl_pending_" + key); } catch (e) {}
    return v;
  };
  const clearPending = (key) => { try { localStorage.removeItem("cl_pending_" + key); } catch (e) {} };

  useEffect(() => {
    const pid = takePending("plan");
    if (!pid) return;
    supabase.from("shared_plans").select("plan,times,title").eq("id", pid).single()
      .then(({ data }) => { if (data?.plan) { setSharedPlan(data); clearPending("plan"); } })
      .catch(() => {});
  }, []);

  // Invite link: opening someone's ?invite=<id> connects the two of you.
  useEffect(() => {
    if (!user?.id) return;
    const inv = takePending("invite");
    if (!inv || inv === user.id) { clearPending("invite"); return; }
    (async () => {
      const [a, b] = [user.id, inv].sort();
      try { await supabase.from("connections").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b", ignoreDuplicates: true }); showToast("Connected! See the People tab."); } catch (e) {}
      clearPending("invite");
      window.history.replaceState({}, "", "/");
    })();
  }, [user]);

  // Bucket-list invite: opening ?blist=<id> joins you to that shared list.
  useEffect(() => {
    if (!user?.id) return;
    const blist = takePending("blist");
    if (!blist) return;
    (async () => {
      try {
        await supabase.from("shared_list_members").upsert({ list_id: blist, user_id: user.id }, { onConflict: "list_id,user_id" });
        showToast("Added to the bucket list! See the People tab.");
        setActiveTab("people");
      } catch (e) {}
      clearPending("blist");
      window.history.replaceState({}, "", "/");
    })();
  }, [user]);

  // Notify when a friend connects with you — instantly via realtime, and on load for
  // anyone who joined while you were away.
  useEffect(() => {
    if (!user?.id) return;
    ensureNotifyPermission();
    const SEEN = "cl_seen_connections";
    const announce = async (otherId) => {
      if (!otherId || otherId === user.id) return;
      const { data } = await supabase.from("profiles").select("name,email").eq("id", otherId).single();
      const nm = data?.name || (data?.email ? data.email.split("@")[0] : null) || "Someone";
      showToast(`🎉 ${nm} connected with you!`);
      notify("New connection", `${nm} connected with you on Curated`);
      track("friend_connected", { friend_id: otherId });
      try { const s = new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); s.add(otherId); localStorage.setItem(SEEN, JSON.stringify([...s])); } catch (e) {}
    };

    (async () => {
      const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const ids = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
      const hadBaseline = localStorage.getItem(SEEN) !== null;
      let seen; try { seen = new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); } catch (e) { seen = new Set(); }
      if (hadBaseline) { for (const id of ids) if (!seen.has(id)) await announce(id); }
      localStorage.setItem(SEEN, JSON.stringify(ids));
    })();

    const channel = supabase.channel("conn-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "connections" }, (payload) => {
        const c = payload.new; if (!c) return;
        if (c.user_a !== user.id && c.user_b !== user.id) return;
        announce(c.user_a === user.id ? c.user_b : c.user_a);
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch (e) {} };
  }, [user]);

  if (sharedPlan) return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div style={{ padding: "1rem 1.5rem 0" }}>
          <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => { setSharedPlan(null); window.history.replaceState({}, "", "/"); }}>← Close shared plan</button>
        </div>
        <ResultScreen result={sharedPlan.plan} times={sharedPlan.times || times} ans={{}} onRestart={() => { setSharedPlan(null); window.history.replaceState({}, "", "/"); }} onNewPlan={() => { setSharedPlan(null); window.history.replaceState({}, "", "/"); }} dbVenues={dbVenues} onUpdateResult={() => {}} />
      </div>
    </>
  );

  if (authLoading) return (
    <>
      <style>{styles}</style>
      <SparkleLoader brand />
    </>
  );

  if (!user) return (
    <>
      <style>{styles}</style>
      {splashDone ? <LoginScreen /> : <Splash onStart={() => { try { localStorage.setItem("cl_splash", "1"); } catch (e) {} setSplashDone(true); }} />}
    </>
  );

  const needsOnboarding = user && !onboardDone && !user.user_metadata?.onboarded && !localStorage.getItem("cl_onboarded_" + user.id);
  if (needsOnboarding) return (
    <>
      <style>{styles}</style>
      <Onboarding user={user} dbVenues={dbVenues} onDone={(seeded) => { setOnboardDone(true); setActiveTab("saved"); if (seeded) setShowStarter(true); }} />
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={"toast" + (toast.show ? " show" : "")}>{toast.msg}</div>
        {ratingPlan && <RatingPrompt plan={ratingPlan} user={user} onDismiss={() => { const reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]"); reviewed.push(ratingPlan.id); localStorage.setItem("cl_reviewed", JSON.stringify(reviewed)); setRatingPlan(null); }} onSubmit={() => { setRatingPlan(null); showToast("Thanks for your review!"); }} />}

        {showHome && <HomeScreen onStart={startQuiz} />}
        {showQuiz && <QuizScreen step={quizStep} ans={ans} times={times} setTimes={setTimes} onToggle={toggle} onNext={nextStep} onBack={prevStep} onGenerate={generate} loading={loading} loadIdx={loadIdx} error={error} onExit={() => { setQuizStep(-1); setActiveTab("plans"); }} />}
        {showResult && <ResultScreen result={result} times={times} ans={ans} onRestart={resetToHome} onNewPlan={startQuiz} dbVenues={dbVenues} onUpdateResult={setResult} onShare={setShareItem} onRate={() => plans[0] && setRatingPlan(plans[0])} scheduledDate={plans[0]?.scheduledDate} onSchedule={(date) => { if (!plans[0]) return; schedulePlanAt(0, date); goToCalendar("It's on your calendar! 📅"); }} />}

        {activeTab === "plans" && !showViewingPlan && <MyPlansScreen plans={plans} dbVenues={dbVenues} onViewPlan={(plan) => setViewingPlan(plan)} onNewPlan={() => { setActiveTab("home"); startQuiz(); }} onSchedule={(i, date) => setPlans(prev => { const u = prev.map((p, idx) => idx === i ? { ...p, scheduledDate: date || null } : p); localStorage.setItem("cl_plans", JSON.stringify(u.slice(0, 20))); return u; })} />}
        {showViewingPlan && (
          <div>
            <button className="btn-ghost" onClick={() => setViewingPlan(null)} style={{ paddingTop: "1.5rem" }}>← My Plans</button>
            <ResultScreen result={viewingPlan.result} times={viewingPlan.times} ans={viewingPlan.ans} onRestart={() => setViewingPlan(null)} onNewPlan={() => { setViewingPlan(null); setActiveTab("home"); startQuiz(); }} dbVenues={dbVenues} onUpdateResult={(r) => setViewingPlan(p => ({ ...p, result: r }))} onShare={setShareItem} onRate={() => setRatingPlan(viewingPlan)} scheduledDate={viewingPlan.scheduledDate} onSchedule={(date) => { setPlans(prev => { const u = prev.map(x => x.id === viewingPlan.id ? { ...x, scheduledDate: date || null } : x); localStorage.setItem("cl_plans", JSON.stringify(u.slice(0, 20))); return u; }); goToCalendar("It's on your calendar! 📅"); }} />
          </div>
        )}

        {activeTab === "people" && <PeopleScreen user={user} onShareSaved={() => setPeopleBadge(n => Math.max(0, n - 1))} onSavePlan={(payload) => { const r = payload?.plan; if (!r) return; setPlans(prev => { const updated = [{ result: r, times: payload?.times || times, ans: {}, savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), createdAt: Date.now(), id: generateId() }, ...prev]; localStorage.setItem("cl_plans", JSON.stringify(updated.slice(0, 20))); return updated; }); }} />}
        {/* Always mounted so an in-progress screenshot parse keeps running + persists when you switch tabs */}
        <div style={{ display: activeTab === "saved" ? "block" : "none" }}>
          {showStarter && (
            <div style={{ margin: "1rem 1.5rem 0", background: "#eef3d8", border: "1px solid #dfe8be", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem" }}>✦</span>
              <div style={{ flex: 1, fontSize: "0.82rem", color: "#4B342F", lineHeight: 1.45 }}><strong>Based on what you liked.</strong> Here's your starter board — add more anytime with the + button.</div>
              <button onClick={() => setShowStarter(false)} style={{ border: "none", background: "none", color: "#9b8f7a", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>×</button>
            </div>
          )}
          <SavedScreen user={user} visible={activeTab === "saved"} tourWantsSpot={tourStep === 1 || tourStep === 2} replayImportSignal={importSignal} dbVenues={dbVenues} openSignal={captureSignal} calendarSignal={calSignal} onShare={setShareItem} onBuildPlan={(saves) => { setResult(null); setError(null); setViewingPlan(null); setActiveTab("home"); setAns({ savedVenues: saves }); setQuizStep(0); }} onBarCrawl={(seed) => setBarCrawl({ seed: seed || [] })} />
        </div>
        {activeTab === "me" && <MeScreen user={user} preferences={preferences} setPreferences={setPreferences} isAdmin={isAdmin} onBadgeUpdate={setAdminBadge} adminBadge={adminBadge} onStartTour={() => setTourStep(0)} onStartImportTour={() => { setTourStep(-1); setActiveTab("saved"); setImportSignal(n => n + 1); }} />}

        {!showQuiz && !showResult && !showViewingPlan && (
          <button className="capture-fab" aria-label="Save a place"
            onClick={() => { setActiveTab("saved"); setQuizStep(-1); setViewingPlan(null); setCaptureSignal(n => n + 1); }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        )}

        <nav className="bottom-nav">
          {TABS.map(tab => (
            <button key={tab.id} className={"nav-tab" + (activeTab === tab.id ? " active" : "")}
              aria-label={tab.label}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== "home") { setQuizStep(-1); setViewingPlan(null); } }}>
              <span className="nav-tab-icon" style={{ position: "relative" }}>
                <NavIcon id={tab.id} />
                {tab.badge > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -6, background: "#DD4124", color: "#fff", borderRadius: "50%", fontSize: "0.5rem", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{tab.badge}</span>
                )}
              </span>
              <span className="nav-tab-label">{tab.label}</span>
              <span className="nav-tab-dot" />
            </button>
          ))}
        </nav>
        {shareItem && <ShareModal user={user} item={shareItem} onClose={() => setShareItem(null)} showToast={showToast} />}
        {barCrawl && <BarCrawlQuiz seedCount={(barCrawl.seed || []).length} onCancel={() => setBarCrawl(null)} onComplete={(a) => {
          const vibeMap = { quiet: ["chill"], music: ["chaotic", "social"], both: ["social"] };
          const vibes = [...(vibeMap[a.vibe] || ["social"])];
          if (a.dress === "fancy") vibes.push("fancy");
          const typeLabel = a.type === "cocktail" ? "cocktail bars" : a.type === "pub" ? "traditional pubs" : "a mix of cocktail bars and pubs";
          const atmos = a.vibe === "quiet" ? "quiet, intimate spots" : a.vibe === "music" ? "lively bars with music and a buzz" : "a progression that starts chilled and gets livelier";
          const dress = a.dress === "fancy" ? "smart / dressy venues" : a.dress === "casual" ? "casual, laid-back venues" : "any dress code";
          const setting = a.setting === "indoor" ? "mostly indoor" : a.setting === "outdoor" ? "rooftops and terraces where possible" : "indoor or outdoor";
          const seeded = (barCrawl.seed || []).length;
          const stopsLine = seeded > 0
            ? `Use the user's OWN saved bars as the stops — include ALL ${seeded} of them and add NO other venues; just order them into a natural walking crawl.`
            : "Pick 4-5 drinking venues within a short walk of each other and order them as a natural crawl.";
          const clause = `. THIS IS A BAR CRAWL: every single stop MUST be a bar or pub (no restaurants, cafes, museums or shops). ${stopsLine} Preference: ${typeLabel}. Atmosphere: ${atmos}. Dress: ${dress}. Setting: ${setting}. Set every stop's "type" to "bar" or "pub".`;
          const bcBudgetMap = { low: "£10–£30", mid: "£30–£50", high: "£50–£80" };
          setAns(prev => ({ ...prev, timeOfDay: "night", vibes, area: a.area, budget: bcBudgetMap[a.budget] || "£30–£50", groupSize: prev.groupSize || "small_group", energy: "high", travel: "walking", extras: [], savedVenues: barCrawl.seed || [], _barCrawl: true, _barCrawlClause: clause }));
          setTimes({ start: "18:00", end: "23:30" });
          setBarCrawl(null); setActiveTab("home"); setQuizStep(QUESTIONS.length); setPendingGen(true);
        }} />}
        {loading && <SparkleLoader label={ans._barCrawl ? "Curating your bar crawl…" : "Curating your plan…"} />}

        {tourStep >= 0 && (
          <AppProductTour
            steps={PRODUCT_TOUR}
            step={tourStep}
            onNext={() => setTourStep(s => Math.min(s + 1, PRODUCT_TOUR.length - 1))}
            onBack={() => setTourStep(s => Math.max(0, s - 1))}
            onDone={() => setTourStep(-1)}
            onSkip={() => setTourStep(-1)}
          />
        )}
      </div>
    </>
  );
}