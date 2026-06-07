import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE ─────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
const BUDGET_MAP = { low: ["low"], mid: ["low", "mid"], high: ["low", "mid", "high"], unlimited: ["low", "mid", "high"] };
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
  const { vibes, area, budget, timeOfDay, extras, groupSize, energy } = answers;
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

  const targetStops = timeOfDay === "full" ? 5 : 4;
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
  { id: "timeOfDay", label: "1 of 8", title: "Day out or night in London?", multi: false, options: [{ value: "day", label: "Day plan", emoji: "☀️" }, { value: "night", label: "Night plan", emoji: "🌙" }, { value: "full", label: "Full day + night", emoji: "🌅" }] },
  { id: "vibes", label: "2 of 8", title: "Pick your vibe", multi: true, options: [{ value: "chill", label: "Chill", emoji: "😌" }, { value: "romantic", label: "Romantic", emoji: "🌹" }, { value: "chaotic", label: "Chaotic fun", emoji: "🌀" }, { value: "cultural", label: "Cultural", emoji: "🏛️" }, { value: "fancy", label: "Fancy", emoji: "🥂" }, { value: "hidden_gems", label: "Hidden gems", emoji: "💎" }, { value: "social", label: "Social", emoji: "🎉" }, { value: "solo", label: "Solo reset", emoji: "🧘" }, { value: "creative", label: "Creative", emoji: "🎨" }, { value: "activity", label: "Activity-based", emoji: "🎯" }, { value: "active", label: "Active", emoji: "🏃" }] },
  { id: "area", label: "3 of 8", title: "Any area preference?", multi: false, options: [{ value: "central", label: "Central", emoji: "🎭" }, { value: "east", label: "East", emoji: "🧱" }, { value: "south", label: "South", emoji: "🌉" }, { value: "west", label: "West", emoji: "🌳" }, { value: "north", label: "North", emoji: "🌲" }, { value: "southwest", label: "Southwest", emoji: "🏡" }, { value: "northwest", label: "Northwest", emoji: "🌿" }, { value: "outskirts", label: "Outskirts", emoji: "🚂" }, { value: "surprise_me", label: "Surprise me", emoji: "🎲" }, { value: "map_pin", label: "Pick on map", emoji: "📍" }] },
  { id: "travel", label: "4 of 8", title: "How do you want to get around?", multi: false, options: [{ value: "walking", label: "Walking only", emoji: "🚶" }, { value: "walk_tube", label: "Walk + tube", emoji: "🚇" }, { value: "max10", label: "Max 10 min each stop", emoji: "⚡" }] },
  { id: "budget", label: "5 of 8", title: "Budget vibe?", multi: false, options: [{ value: "low", label: "Broke but fun", emoji: "💸" }, { value: "mid", label: "Mid range", emoji: "💳" }, { value: "high", label: "Treat yourself", emoji: "✨" }, { value: "unlimited", label: "No limit", emoji: "🚀" }] },
  { id: "groupSize", label: "6 of 8", title: "Who's coming?", multi: false, options: [{ value: "solo", label: "Just me", emoji: "🙋" }, { value: "duo", label: "Two of us", emoji: "👫" }, { value: "small", label: "3–5 people", emoji: "👯" }, { value: "large", label: "5+ crew", emoji: "🎊" }] },
  { id: "energy", label: "7 of 8", title: "Energy level today?", multi: false, options: [{ value: "low", label: "Low & breezy", emoji: "🌿" }, { value: "medium", label: "Up for it", emoji: "⚡" }, { value: "high", label: "Max chaos", emoji: "🔥" }] },
  { id: "extras", label: "8 of 8", title: "Must-haves?", multi: true, options: [{ value: "food", label: "Food included", emoji: "🍜" }, { value: "drinks", label: "Drinks/bars", emoji: "🍸" }, { value: "outdoor", label: "Outdoor spaces", emoji: "🌳" }, { value: "social", label: "Meet people", emoji: "🤝" }, { value: "scenic_walk", label: "Scenic walk", emoji: "🚶" }, { value: "nature_trails", label: "Nature trails", emoji: "🌿" }, { value: "plant_friendly", label: "Plant-friendly food", emoji: "🌱" }] },
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

const LOADS = ["Raiding our London database...", "Matching your vibe to venues...", "Checking geographic flow...", "Building your perfect sequence...", "Final polish..."];

const PREF_OPTIONS = ["Restaurants", "Bars", "Hidden gems", "Outdoor", "Culture", "Markets", "Events", "Late night", "Brunch", "Fine dining", "Plant based", "Arts & crafts", "Active"];
const ADMIN_EMAIL = "jahnvisolanki2412@gmail.com";

function generateId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

async function callClaude(prompt, maxTokens = 1000) {
  const resp = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    }),
  });
  const data = await resp.json();
  const txt = data.content?.find(b => b.type === "text")?.text || "";
  return txt.replace(/```json|```/g, "").trim();
}

// ── STYLES ───────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: #ffffff; color: #1c1c1a; min-height: 100vh; overflow-x: hidden; }
  .app { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #ffffff; padding-bottom: 80px; position: relative; }

  .shapes-wrap { position: absolute; top: 0; right: -20px; width: 220px; height: 260px; pointer-events: none; z-index: 0; }
  .shape-circle { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; animation: spin-cw 14s linear infinite; }
  .shape-teal { width: 130px; height: 130px; background: #6B1A1A; top: 0; right: 40px; animation-duration: 16s; }
  .shape-yellow { width: 160px; height: 160px; background: #fff8d1; top: 80px; right: -10px; animation-duration: 20s; }
  .shape-cream { width: 80px; height: 80px; background: #F7EFD4; top: 150px; right: 140px; animation-duration: 12s; }
  .inner-oval { width: 56px; height: 32px; background: #B8A9D9; border-radius: 50%; animation: spin-cw 8s linear infinite; }
  .inner-starburst { animation: spin-cw 6s linear infinite; }
  .inner-star4 { animation: spin-cw 10s linear infinite; }
  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }

  .home-hero { padding: 3.5rem 1.5rem 2rem; position: relative; overflow: hidden; min-height: 300px; background: #ffffff; }
  .home-eyebrow { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8f7a; margin-bottom: 0.6rem; position: relative; z-index: 1; }
  .home-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 3rem; font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #bcdaeb; margin-bottom: 0.75rem; position: relative; z-index: 1; }
  .home-title em { font-style: italic; color: #6B1A1A; }
  .home-sub { font-size: 0.85rem; color: #6b5e4e; line-height: 1.5; position: relative; z-index: 1; max-width: 200px; }
  .home-cta { margin-top: 1.5rem; position: relative; z-index: 1; }

  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; background: #fff; border-top: 1px solid #e8e2d8; display: flex; z-index: 100; padding-bottom: env(safe-area-inset-bottom); }
  .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px 8px; border: none; background: none; cursor: pointer; gap: 3px; transition: all 0.15s; }
  .nav-tab-icon { font-size: 1.3rem; line-height: 1; transition: transform 0.2s; }
  .nav-tab.active .nav-tab-icon { transform: scale(1.15); }
  .nav-tab-label { font-family: 'DM Sans', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.04em; color: #b8ac9a; text-transform: uppercase; transition: color 0.15s; }
  .nav-tab.active .nav-tab-label { color: #1c1c1a; }
  .nav-tab-dot { width: 4px; height: 4px; border-radius: 50%; background: #6B1A1A; opacity: 0; transition: opacity 0.15s; }
  .nav-tab.active .nav-tab-dot { opacity: 1; }

  .section-pad { padding: 1.5rem; }
  .section-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.4rem; font-weight: 400; color: #1c1c1a; margin-bottom: 0.25rem; }
  .section-sub { font-size: 0.8rem; color: #9b8f7a; margin-bottom: 1.25rem; line-height: 1.4; }
  .divider { height: 1px; background: #e8e2d8; margin: 0 1.5rem; }

  .btn { width: 100%; padding: 14px; border-radius: 100px; border: none; background: #1c1c1a; color: #ffffff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em; }
  .btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.88; }
  .btn:active:not(:disabled) { transform: scale(0.99); }
  .btn-teal { background: #6B1A1A; }
  .btn-outline { width: 100%; padding: 13px; border-radius: 100px; border: 1.5px solid #ddd8ce; background: transparent; color: #4a4438; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; margin-top: 0.6rem; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
  .btn-outline:hover { border-color: #1c1c1a; color: #1c1c1a; }
  .btn-ghost { background: none; border: none; color: #9b8f7a; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; cursor: pointer; padding: 1rem 1.5rem 0; display: flex; align-items: center; gap: 5px; }
  .btn-ghost:hover { color: #1c1c1a; }

  .chip { padding: 9px 16px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: flex; align-items: center; gap: 6px; user-select: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .chip:hover { border-color: #b8ac9a; }
  .chip.sel { background: #1c1c1a; color: #ffffff; border-color: #1c1c1a; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }

  .card { background: #fff; border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.4rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }

  .q-label { font-size: 0.68rem; font-weight: 500; color: #b8ac9a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem; }
  .q-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.6rem; line-height: 1.2; color: #1c1c1a; margin-bottom: 1.5rem; }
  .progress-label { font-size: 0.68rem; color: #b8ac9a; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .progress-bg { height: 2px; background: #e8e2d8; border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: #6B1A1A; border-radius: 2px; transition: width 0.4s ease; }
  .time-row { display: flex; gap: 10px; }
  .time-wrap { flex: 1; }
  .time-wrap label { font-size: 0.68rem; color: #9b8f7a; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 6px; }
  .time-wrap input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; }
  .time-wrap input:focus { outline: none; border-color: #6B1A1A; }

  .loading { display: flex; flex-direction: column; align-items: center; padding: 5rem 2rem; text-align: center; }
  .loading-ring { width: 44px; height: 44px; border: 2.5px solid #e8e2d8; border-top-color: #6B1A1A; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem; }
  .loading-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.3rem; color: #1c1c1a; margin-bottom: 0.4rem; }
  .loading-sub { font-size: 0.82rem; color: #9b8f7a; }

  .result-hero { padding: 2rem 1.5rem 1.5rem; border-bottom: 1px solid #e8e2d8; animation: fadeUp 0.4s ease; }
  .result-eyebrow { font-size: 0.68rem; font-weight: 500; color: #6B1A1A; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
  .result-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.8rem; line-height: 1.15; color: #1c1c1a; margin-bottom: 0.3rem; }
  .result-tagline { font-size: 0.88rem; color: #6b5e4e; line-height: 1.5; margin-bottom: 0.85rem; font-style: italic; }
  .result-meta { display: flex; gap: 1rem; font-size: 0.78rem; color: #9b8f7a; flex-wrap: wrap; }
  .vibe-pills { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 0.75rem; }
  .vibe-pill { font-size: 0.66rem; padding: 3px 9px; border-radius: 100px; border: 1px solid #ddd8ce; color: #6b5e4e; background: #fff; }

  .tab-bar { display: flex; border-bottom: 1px solid #e8e2d8; background: #ffffff; }
  .tab { flex: 1; padding: 0.85rem; border: none; background: none; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; color: #9b8f7a; border-bottom: 2px solid transparent; transition: all 0.15s; margin-bottom: -1px; }
  .tab.active { color: #6B1A1A; border-bottom-color: #6B1A1A; font-weight: 500; }

  .stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: #e8e2d8; border-bottom: 1px solid #e8e2d8; }
  .stat { background: #ffffff; padding: 1rem; text-align: center; }
  .stat-val { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.2rem; color: #1c1c1a; }
  .stat-lbl { font-size: 0.6rem; color: #9b8f7a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  .stops-wrap { padding: 1.25rem 1.5rem; }
  .stop { border: 1px solid #e8e2d8; border-radius: 16px; margin-bottom: 10px; background: #fff; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .stop-inner { padding: 1.1rem; }
  .stop-top { display: flex; gap: 10px; align-items: flex-start; }
  .stop-emoji-wrap { width: 44px; height: 44px; border-radius: 12px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
  .stop-body { flex: 1; min-width: 0; }
  .stop-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .stop-time { font-size: 0.68rem; font-weight: 500; color: #6B1A1A; text-transform: uppercase; letter-spacing: 0.06em; }
  .stop-type { font-size: 0.62rem; color: #b8ac9a; text-transform: uppercase; letter-spacing: 0.06em; }
  .stop-dot { width: 3px; height: 3px; border-radius: 50%; background: #ddd8ce; }
  .stop-name { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.05rem; color: #1c1c1a; margin-bottom: 4px; line-height: 1.2; }
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
  .plan-card-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1rem; color: #1c1c1a; line-height: 1.2; }
  .plan-card-date { font-size: 0.68rem; color: #9b8f7a; }
  .plan-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.5rem; }
  .plan-tag { font-size: 0.66rem; padding: 2px 8px; border-radius: 100px; background: #f5f0e8; color: #6b5e4e; }
  .plan-tag.teal { background: #e0f5f3; color: #6B1A1A; }
  .empty-state { text-align: center; padding: 3rem 2rem; }
  .empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .empty-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.2rem; color: #1c1c1a; margin-bottom: 0.5rem; }
  .empty-sub { font-size: 0.82rem; color: #9b8f7a; line-height: 1.5; margin-bottom: 1.5rem; }

  .filter-row { display: flex; gap: 8px; overflow-x: auto; padding: 0 1.5rem 1rem; scrollbar-width: none; }
  .filter-row::-webkit-scrollbar { display: none; }
  .filter-chip { padding: 6px 14px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-size: 0.78rem; cursor: pointer; background: #fff; color: #4a4438; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; font-family: 'DM Sans', sans-serif; }
  .filter-chip.sel { background: #1c1c1a; color: #fff; border-color: #1c1c1a; }

  .event-card { border-radius: 16px; overflow: hidden; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.15s; animation: fadeUp 0.3s ease; }
  .event-card:hover { transform: translateY(-2px); }
  .event-card-img { height: 140px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .event-card-emoji { font-size: 3.5rem; }
  .event-card-body { background: #fff; padding: 1rem; border: 1px solid #e8e2d8; border-top: none; border-radius: 0 0 16px 16px; }
  .event-card-cat { font-size: 0.62rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .event-card-name { font-family: 'DM Serif Display', Georgia, serif; font-size: 1rem; color: #1c1c1a; margin-bottom: 4px; line-height: 1.2; }
  .event-card-venue { font-size: 0.75rem; color: #9b8f7a; margin-bottom: 6px; }
  .event-card-row { display: flex; align-items: center; justify-content: space-between; }
  .event-card-date { font-size: 0.72rem; color: #6b5e4e; }
  .event-card-price { font-size: 0.72rem; font-weight: 500; color: #6B1A1A; }
  .events-loading { text-align: center; padding: 3rem 1.5rem; color: #9b8f7a; font-size: 0.85rem; }
  .api-note { background: #f5f0e8; border-radius: 12px; padding: 1rem; margin: 0 1.5rem 1rem; font-size: 0.75rem; color: #6b5e4e; line-height: 1.5; border-left: 3px solid #6B1A1A; }

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
  .feat-badge.live { background: #e0f5f3; color: #6B1A1A; }

  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #1c1c1a; color: #ffffff; padding: 10px 20px; border-radius: 100px; font-size: 0.82rem; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; font-family: 'DM Sans', sans-serif; }
  .toast.show { opacity: 1; }
  .err { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #fdf0ef; border: 1px solid #f5d0cc; color: #c0392b; font-size: 0.82rem; line-height: 1.4; }
  .success { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #e0f5f3; border: 1px solid #6B1A1A; color: #6B1A1A; font-size: 0.82rem; line-height: 1.4; }

  /* ── TIKTOK PARSER ── */
  .parser-wrap { padding: 1.5rem; }
  .input-group { margin-bottom: 1rem; }
  .input-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: #9b8f7a; display: block; margin-bottom: 6px; font-weight: 500; }
  .input-field { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; transition: border-color 0.15s; }
  .input-field:focus { outline: none; border-color: #6B1A1A; }
  .input-field::placeholder { color: #c0b8ad; }
  textarea.input-field { min-height: 100px; resize: vertical; }
  .preview-card { border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .preview-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.1rem; color: #1c1c1a; margin-bottom: 0.75rem; }
  .preview-field { display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; }
  .preview-key { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #9b8f7a; min-width: 80px; padding-top: 2px; font-weight: 500; }
  .preview-val { font-size: 0.82rem; color: #1c1c1a; line-height: 1.4; flex: 1; }
  .zone-badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 500; background: #e0f5f3; color: #6B1A1A; }

  /* ── ADMIN ── */
  .admin-card { border: 1px solid #e8e2d8; border-radius: 14px; padding: 1rem; margin-bottom: 10px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .admin-card-name { font-family: 'DM Serif Display', Georgia, serif; font-size: 1rem; color: #1c1c1a; margin-bottom: 4px; }
  .admin-card-meta { font-size: 0.75rem; color: #9b8f7a; margin-bottom: 8px; }
  .admin-actions { display: flex; gap: 8px; }
  .btn-approve { flex: 1; padding: 8px; border-radius: 8px; border: none; background: #6B1A1A; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; font-weight: 500; }
  .btn-reject { flex: 1; padding: 8px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: transparent; color: #9b8f7a; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; }
  .zone-select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; margin-bottom: 8px; }

  /* ── PREFERENCES ── */
  .pref-wrap { padding: 1.5rem; }
  .pref-chip { padding: 8px 14px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-size: 0.82rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; }
  .pref-chip.sel-blue { background: #bcdaeb; color: #1c1c1a; border-color: #bcdaeb; }
  .pref-chip.sel-yellow { background: #fff8d1; color: #1c1c1a; border-color: #fff8d1; }
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
          <path fill="#F0A500" d="M20 2 C20 2 22 14 28 20 C22 26 20 38 20 38 C20 38 18 26 12 20 C18 14 20 2 20 2Z M2 20 C2 20 14 22 20 28 C26 22 38 20 38 20 C38 20 26 18 20 12 C14 18 2 20 2 20Z" />
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
        <div className="home-eyebrow">London · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 className="home-title">London,<br /><em>Your Way</em></h1>
        <p className="home-sub">60+ hand-picked experiences. One perfect plan. Matched to you.</p>
        <div className="home-cta">
          <button className="btn btn-teal" style={{ maxWidth: 200 }} onClick={onStart}>Plan my day or night ✦</button>
        </div>
      </div>
      <div className="divider" />
      <div className="section-pad">
        <div className="section-title">How it works</div>
        <p className="section-sub">Answer 7 quick questions. Get one perfectly sequenced London plan.</p>
        {[["✦", "7 quick questions", "Tell us your vibe, budget, area, and energy level."],
          ["◎", "We match the experience", "Our curated database of 60+ hand-picked spots filters to your exact vibe."],
          ["→", "One perfect plan", "Claude sequences them geographically and temporally. Just follow it."]
        ].map(([icon, title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "1.1rem", alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? "#6B1A1A" : i === 1 ? "#fff8d1" : "#bcdaeb", display: "flex", alignItems: "center", justifyContent: "center", color: i === 1 ? "#1c1c1a" : "#fff", fontSize: "1rem", flexShrink: 0, fontWeight: 700 }}>{icon}</div>
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
      html: '<div style="width:28px;height:28px;background:#6B1A1A;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
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
        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6B1A1A", display: "flex", alignItems: "center", gap: 4 }}>
          ✓ Pin dropped · {currentPin.lat.toFixed(4)}, {currentPin.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}


function QuizScreen({ step, ans, times, setTimes, onToggle, onNext, onBack, onGenerate, loading, loadIdx, error }) {
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
        <div className="progress-label">{step + 1} of {totalSteps}</div>
        <div className="progress-bg"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
      </div>
      {error && <div className="err">⚠️ {error}</div>}
      {step > 0 && <button className="btn-ghost" onClick={onBack}>← Back</button>}
      {step < QUESTIONS.length ? (
        <div style={{ padding: step > 0 ? "1rem 1.5rem 1.5rem" : "2rem 1.5rem 1.5rem" }}>
          <div className="q-label">{q.label}</div>
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
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6B1A1A" }}>✦ Selected: {ans.area}</div>
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
          <div className="q-label">Almost there</div>
          <div className="q-title">What time are you planning?</div>
          <div className="time-row">
            <div className="time-wrap"><label>Start time</label><input type="time" value={times.start} onChange={(e) => setTimes(t => ({ ...t, start: e.target.value }))} /></div>
            <div className="time-wrap"><label>End time</label><input type="time" value={times.end} onChange={(e) => setTimes(t => ({ ...t, end: e.target.value }))} /></div>
          </div>
          <button className="btn btn-teal" style={{ marginTop: "1.25rem" }} onClick={onGenerate}>Generate my plan ✦</button>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ result, times, ans, onRestart, onNewPlan, dbVenues, onUpdateResult }) {
  const [view, setView] = useState("plan");
  const [shareId] = useState(generateId);
  const [copied, setCopied] = useState(false);
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

  function swapVenue(alt) {
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
    onUpdateResult({ ...result, stops: newStops });
    setSwappingIdx(null);
    setAlternatives([]);
  }

  return (
    <div>
      <div className="result-hero">
        <div className="result-eyebrow">✦ Your curated plan</div>
        <div className="result-title">{result.title}</div>
        <div className="result-tagline">{result.tagline}</div>
        <div className="result-meta">
          <span>💰 {result.total_cost_estimate}</span>
          <span>🕐 {times.start}–{times.end}</span>
          <span>📍 {(ans.area || "").replace(/_/g, " ")} London</span>
        </div>
        <div className="vibe-pills">
          {Object.entries(result.vibe_scores || {}).map(([k, v]) => <div key={k} className="vibe-pill">{k} {v}/10</div>)}
        </div>
      </div>
      <div className="tab-bar">
        {["plan", "social"].map((v) => (
          <button key={v} className={`tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
            {v === "plan" ? "The plan" : "Share & social"}
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
                <div className="stop">
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
                      {stop.price_range && <span className="stop-pill">💰 {stop.price_range}</span>}
                      {stop.google_rating && <span className="stop-pill">⭐ {stop.google_rating}</span>}
                      {stop.area && <span className="stop-pill">📍 {stop.area}</span>}
                      {stop.plant_friendly && <span className="stop-pill" style={{ background: "#ecfdf5", color: "#059669" }}>🌱 Plant-friendly</span>}
                      {stop.celebrity_tags && [...new Set(stop.celebrity_tags)].map((celeb, ci) => (
                        <span key={ci} className="stop-pill" style={{ background: "#e8f4fa", color: "#bcdaeb" }}>💫 {celeb}'s fav</span>
                      ))}
                    </div>
                    <button onClick={() => findAlternatives(idx)} style={{ border: "none", background: "none", color: "#6B1A1A", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "2px 0" }}>↻ Swap</button>
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
                      <button onClick={() => { setSwappingIdx(null); setAlternatives([]); }} style={{ border: "none", background: "none", color: "#9b8f7a", fontSize: "0.72rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: "0.4rem" }}>Cancel</button>
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
            <button className="btn-outline" onClick={() => setView("social")}>👥 Share with friends</button>
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
              <div className="social-card-sub">Anyone with the link sees your full plan.</div>
            </div>
            <div style={{ padding: "0.75rem 1rem 1rem", display: "flex", gap: 8 }}>
              <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => { navigator.clipboard?.writeText(`https://london-app.vercel.app/plan/${shareId}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? "✓ Copied" : "🔗 Copy link"}
              </button>
              <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this London plan: https://london-app.vercel.app/plan/${shareId}`)}`)}>
                💬 WhatsApp
              </button>
            </div>
          </div>
          <button className="btn-outline" onClick={() => setView("plan")}>← Back to the plan</button>
        </div>
      )}
    </div>
  );
}

function MyPlansScreen({ plans, onViewPlan, onNewPlan }) {
  if (plans.length === 0) return (
    <div>
      <div className="section-pad">
        <div className="section-title">My Plans</div>
        <p className="section-sub">Your saved London itineraries live here.</p>
      </div>
      <div className="empty-state">
        <div className="empty-emoji">🗺️</div>
        <div className="empty-title">No plans yet</div>
        <div className="empty-sub">Generate your first London plan and it'll appear here.</div>
        <button className="btn btn-teal" style={{ maxWidth: 200, margin: "0 auto" }} onClick={onNewPlan}>Make a plan ✦</button>
      </div>
    </div>
  );
  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">My Plans</div>
        <p className="section-sub">{plans.length} saved {plans.length === 1 ? "itinerary" : "itineraries"}</p>
      </div>
      <div style={{ padding: "0 1.5rem 1rem" }}>
        {plans.map((plan, i) => (
          <div key={i} className="plan-card" onClick={() => onViewPlan(plan)}>
            <div className="plan-card-top">
              <div className="plan-card-title">{plan.result.title}</div>
              <div className="plan-card-date">{plan.savedAt}</div>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6b5e4e", fontStyle: "italic", marginBottom: "0.5rem" }}>{plan.result.tagline}</div>
            <div className="plan-card-meta">
              <span className="plan-tag teal">{plan.ans.area} London</span>
              <span className="plan-tag">{plan.ans.timeOfDay}</span>
              <span className="plan-tag">💰 {plan.result.total_cost_estimate}</span>
              <span className="plan-tag">{(plan.result.stops || []).length} stops</span>
            </div>
          </div>
        ))}
        <button className="btn-outline" onClick={onNewPlan}>+ Make a new plan</button>
      </div>
    </div>
  );
}

function DiscoverScreen({ preferences, dbVenues }) {
  const [section, setSection] = useState("events");
  const [celebFilter, setCelebFilter] = useState("All");

  const CATEGORY_EMOJI = { restaurant: "🍽️", bar: "🍸", cafe: "☕", market: "🛍️", experience: "✨", outdoor: "🌿", museum: "🏛️", gallery: "🎨", nightlife: "🌙", event: "🎫" };
  const CATEGORY_COLOURS = { restaurant: "#E84855", bar: "#bcdaeb", cafe: "#F7B731", market: "#F0A500", experience: "#6B1A1A", outdoor: "#3D8B37", museum: "#3D5A80", gallery: "#bcdaeb", nightlife: "#bcdaeb", event: "#6B1A1A" };

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
    const colour = CATEGORY_COLOURS[cat] || "#3D5A80";
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
          <div className="event-card-cat" style={{ color: colour }}>{cat}</div>
          <div className="event-card-name">{v.name}</div>
          <div className="event-card-venue">{v.area || v.zone || "London"}</div>
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
  "category": "one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife",
  "price": "e.g. Free, £10, £20-30, or null if unknown",
  "is_event": false,
  "event_start": null,
  "event_end": null,
  "comment": "interesting descriptors about this specific venue only",
  "vibe_tags": ["tags from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic"]
}`;

      const txt = await callClaude(prompt, 1500);
      const parsedRaw = JSON.parse(txt);
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
                <div style={{ fontSize: "0.6rem", color: "#6B1A1A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem", fontWeight: 600 }}>
                  {i + 1} of {preview.venues.length}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem", gap: 8 }}>
                <div className="preview-title" style={{ marginBottom: 0 }}>{venue.validated_name || venue.name || "Unknown venue"}</div>
                <div style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: 100, background: venue._google_found ? "#e0f5f3" : "#f5f0e8", color: venue._google_found ? "#6B1A1A" : "#9b8f7a", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
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
                ["Website", venue.website ? <a href={venue.website} target="_blank" rel="noreferrer" style={{ color: "#6B1A1A" }}>Visit ↗</a> : null],
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

  if (loading) return <div className="loading"><div className="loading-ring" /><div className="loading-sub">Loading pending items...</div></div>;

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">Admin</div>
        <p className="section-sub">{pending.length} item{pending.length !== 1 ? "s" : ""} pending review · {users.length} users</p>
      </div>

      <div style={{ padding: "0 1.5rem 1rem" }}>
        <button className="btn-outline" style={{ marginTop: 0, marginBottom: "1rem" }} onClick={() => setShowUsers(!showUsers)}>
          {showUsers ? "Hide" : "Show"} users ({users.length})
        </button>
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
                {item.category} · {item.area} · {item.price || "price unknown"}
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
                  <a href={item.tiktok_url} target="_blank" rel="noreferrer" style={{ color: "#6B1A1A" }}>View TikTok ↗</a>
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

function SavedScreen({ user, onBuildPlan }) {
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pasteUrl, setPasteUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");
  const [error, setError] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [successVenue, setSuccessVenue] = useState(null);

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
    setTimeout(() => setSuccessVenue(null), 2200);
  }

  const CAT_EMOJI = { restaurant: "\u{1F37D}️", bar: "\u{1F378}", cafe: "☕", market: "\u{1F6CD}️", experience: "✨", outdoor: "\u{1F33F}", museum: "\u{1F3DB}️", gallery: "\u{1F3A8}", nightlife: "\u{1F319}", event: "\u{1F3AB}" };
  const CAT_COLOURS = { restaurant: "#E84855", bar: "#bcdaeb", cafe: "#F7B731", market: "#F0A500", experience: "#6B1A1A", outdoor: "#3D8B37", museum: "#3D5A80", gallery: "#bcdaeb", nightlife: "#bcdaeb", event: "#6B1A1A" };

  async function loadSaves() {
    setLoading(true);
    const { data } = await supabase.from("user_saves").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSaves(data || []);
    setLoading(false);
  }

  useEffect(() => { loadSaves(); }, []);

  // Check URL params for share target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get("text") || params.get("url") || "";
    if (sharedText && sharedText.includes("tiktok.com")) {
      setPasteUrl(sharedText);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  async function parseFromImage(file) {
    setParsing(true); setError(null); setParseStatus("Reading image...");
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const mediaType = file.type || "image/jpeg";

      setParseStatus("Extracting venue info...");
      const resp = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 500,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "This is a screenshot about a London venue/place. Extract: name, area (neighbourhood), category (restaurant/bar/cafe/market/experience/outdoor/gallery/museum/nightlife), vibe_tags (from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic, solo, underground), comment (one sentence summary). Return ONLY JSON: {name, area, category, vibe_tags, comment}" }
          ] }]
        }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || "AI API error");
      const txt = (data.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      if (!txt) throw new Error("Couldn't extract venue info from this image. Try a clearer screenshot.");
      const parsed = JSON.parse(txt);

      setParseStatus("Looking up on Google...");
      const enrichResp = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: parsed.name, area: parsed.area }) });
      const enrichData = await enrichResp.json();

      setParseStatus("Saving...");
      const save = {
        user_id: user.id,
        name: enrichData.found ? enrichData.validated_name : parsed.name,
        area: enrichData.found ? (enrichData.derived_area || parsed.area) : parsed.area,
        zone: enrichData.found ? enrichData.derived_zone : null,
        category: parsed.category,
        price: enrichData.found ? enrichData.price : null,
        vibe_tags: parsed.vibe_tags || [],
        comment: parsed.comment,
        google_rating: enrichData.found ? enrichData.google_rating : null,
        lat: enrichData.found ? enrichData.lat : null,
        lng: enrichData.found ? enrichData.lng : null,
      };

      const { error: insertErr } = await supabase.from("user_saves").insert(save);
      if (insertErr) throw new Error("Save failed: " + insertErr.message);
      setParseStatus("");
      showSuccess(save.name);
      await loadSaves();
    } catch (e) {
      setError(e.message || "Couldn't read this image.");
      setParseStatus("");
    }
    setParsing(false);
  }

  async function parseAndSave(url) {
    const urlMatch = (url || pasteUrl).match(/https?:\/\/[^\s]*(tiktok\.com|vm\.tiktok\.com)[^\s]*/i);
    if (!urlMatch) { setError("No TikTok URL found. Paste a link containing tiktok.com"); return; }
    const cleanUrl = urlMatch[0];
    setParsing(true); setError(null); setParseStatus("Fetching TikTok...");

    try {
      const tikResp = await fetch("/api/tiktok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: cleanUrl }) });
      if (!tikResp.ok) throw new Error("TikTok API returned " + tikResp.status);
      const tikData = await tikResp.json();
      if (tikData.error) throw new Error(tikData.error);

      const rawCaption = tikData.description || tikData.title || "";
      if (!rawCaption.trim()) throw new Error("No caption found in this video. Try a different one.");
      const caption = rawCaption.slice(0, 800).replace(/[\u0000-\u001F\u007F]/g, " ");

      setParseStatus("Parsing venue...");
      const prompt = `You are parsing a TikTok video caption about London experiences or venues.
Extract structured data and return ONLY valid JSON with no markdown.
Caption: ${JSON.stringify(caption)}

Return a JSON object with this exact structure:
{
  "name": "venue name",
  "area": "neighbourhood e.g. Shoreditch, Chelsea, Clapham",
  "category": "one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife",
  "price": "e.g. Free, Under 15pp, 15-35pp, or null if unknown",
  "vibe_tags": ["tags from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic, solo, underground"],
  "comment": "one sentence about this venue"
}`;

      const txt = await callClaude(prompt, 500);
      if (!txt) throw new Error("AI returned empty response. Try again.");
      const parsed = JSON.parse(txt);

      setParseStatus("Looking up on Google...");
      const enrichResp = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: parsed.name, area: parsed.area }) });
      const enrichData = await enrichResp.json();

      setParseStatus("Saving...");
      const save = {
        user_id: user.id,
        name: enrichData.found ? enrichData.validated_name : parsed.name,
        area: enrichData.found ? (enrichData.derived_area || parsed.area) : parsed.area,
        zone: enrichData.found ? enrichData.derived_zone : null,
        category: parsed.category,
        price: enrichData.found ? enrichData.price : parsed.price,
        vibe_tags: parsed.vibe_tags || [],
        comment: parsed.comment,
        tiktok_url: cleanUrl,
        google_rating: enrichData.found ? enrichData.google_rating : null,
        lat: enrichData.found ? enrichData.lat : null,
        lng: enrichData.found ? enrichData.lng : null,
      };

      const { error: insertErr } = await supabase.from("user_saves").insert(save);
      if (insertErr) throw new Error("Save failed: " + insertErr.message);
      setPasteUrl("");
      setParseStatus("");
      showSuccess(save.name);
      await loadSaves();
    } catch (e) {
      setError(e.message || "Couldn't parse this TikTok.");
      setParseStatus("");
    }
    setParsing(false);
  }

  async function removeSave(id) {
    await supabase.from("user_saves").delete().eq("id", id);
    setSaves(prev => prev.filter(s => s.id !== id));
  }

  if (loading) return <div className="loading"><div className="loading-ring" /><div className="loading-sub">Loading saves...</div></div>;

  const folders = saves.reduce((acc, s) => {
    const cat = (s.category || "experience").toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});
  const folderKeys = Object.keys(folders).sort();

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.5rem" }}>
        <div className="section-title">Saved</div>
        <p className="section-sub">Paste a TikTok link to save a venue</p>
      </div>

      <div style={{ padding: "0 1.5rem 1rem" }}>
        {error && <div className="err" style={{ marginBottom: "0.75rem" }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input-field"
            type="text"
            placeholder="Paste TikTok URL..."
            value={pasteUrl}
            onChange={e => { setPasteUrl(e.target.value); setError(null); }}
            style={{ flex: 1 }}
          />
          <button className="btn btn-teal" onClick={() => parseAndSave()} disabled={parsing || !pasteUrl.trim()} style={{ width: "auto", padding: "12px 16px", whiteSpace: "nowrap" }}>
            {parsing ? "..." : "+ Save"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#6b5e4e", cursor: "pointer", padding: "8px 14px", border: "1.5px dashed #ddd8ce", borderRadius: 100 }}>
            <span>📷</span> Upload screenshot
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) parseFromImage(e.target.files[0]); e.target.value = ""; }} disabled={parsing} />
          </label>
          <span style={{ fontSize: "0.68rem", color: "#b8ac9a" }}>or paste a URL above</span>
        </div>
        {parseStatus && <div style={{ fontSize: "0.75rem", color: "#6B1A1A", marginTop: 8 }}>{parseStatus}</div>}

        {saves.length > 0 && (
          <button className="btn btn-teal" style={{ marginTop: "1rem" }} onClick={() => onBuildPlan(saves)}>
            Build plan from my {saves.length} save{saves.length !== 1 ? "s" : ""} ✦
          </button>
        )}
      </div>

      {saves.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📌</div>
          <div className="empty-title">No saves yet</div>
          <div className="empty-sub">Share a TikTok to this app or paste a link above to start building your list.</div>
        </div>
      ) : openFolder ? (
        <div style={{ padding: "0 1.5rem 1rem" }}>
          <button className="btn-ghost" onClick={() => setOpenFolder(null)} style={{ marginBottom: "0.75rem" }}>← All folders</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.5rem" }}>{CAT_EMOJI[openFolder] || "✨"}</span>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.1rem", textTransform: "capitalize" }}>{openFolder}</span>
            <span style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>({folders[openFolder]?.length || 0})</span>
          </div>
          {(folders[openFolder] || []).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0ebe2" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: CAT_COLOURS[openFolder] || "#3D5A80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                {CAT_EMOJI[openFolder] || "✨"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1c1c1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>
                  {s.area || "London"}{s.price ? ` · ${s.price}` : ""}{s.google_rating ? ` · ⭐ ${s.google_rating}` : ""}
                </div>
              </div>
              <button onClick={() => removeSave(s.id)} style={{ border: "none", background: "none", color: "#b8ac9a", cursor: "pointer", fontSize: "1.2rem", padding: 4 }}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "0 1.5rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {folderKeys.map(cat => {
            const items = folders[cat];
            const colour = CAT_COLOURS[cat] || "#3D5A80";
            const emoji = CAT_EMOJI[cat] || "✨";
            return (
              <div key={cat} onClick={() => setOpenFolder(cat)} style={{ cursor: "pointer", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", background: "#fff", transition: "transform 0.15s" }}>
                <div style={{ height: 80, background: colour, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "2rem" }}>{emoji}</span>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c1c1a", textTransform: "capitalize" }}>{cat}</div>
                  <div style={{ fontSize: "0.68rem", color: "#9b8f7a" }}>{items.length} save{items.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {successVenue && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "2rem 1.5rem", textAlign: "center", maxWidth: 280, animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✨</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.1rem", color: "#1c1c1a", marginBottom: 6 }}>Saved!</div>
            <div style={{ fontSize: "0.82rem", color: "#6b5e4e" }}>{successVenue}</div>
            <div style={{ fontSize: "0.72rem", color: "#9b8f7a", marginTop: 4 }}>Added to your collection</div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: "2rem" }}>
      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✦</div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "2rem", color: "#1c1c1a", marginBottom: "0.5rem" }}>Curated London</h1>
        <p style={{ fontSize: "0.85rem", color: "#6b5e4e", lineHeight: 1.5, marginBottom: "2rem" }}>Your personal London itinerary generator. Sign in to get started.</p>
        {error && <div className="err" style={{ marginBottom: "1rem" }}>{error}</div>}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 100, border: "1.5px solid #ddd8ce", background: "#fff", color: "#1c1c1a", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.15s" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
        <p style={{ fontSize: "0.72rem", color: "#b8ac9a", marginTop: "1.5rem", lineHeight: 1.5 }}>Invite-only beta. You need an invite to access Curated London.</p>
      </div>
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
        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B1A1A", fontWeight: 500, marginBottom: "0.5rem" }}>How was it?</div>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.3rem", color: "#1c1c1a", marginBottom: "0.25rem" }}>{plan.result.title}</div>
        <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: "1.25rem" }}>{plan.savedAt}</div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#4a4438", marginBottom: "0.5rem" }}>Overall rating</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setOverall(n)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid", borderColor: overall >= n ? "#6B1A1A" : "#ddd8ce", background: overall >= n ? "#6B1A1A" : "#fff", color: overall >= n ? "#fff" : "#9b8f7a", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{n}</button>
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
                  <button key={n} onClick={() => rateStop(stop.name, n)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid", borderColor: (stopRatings[stop.name] || 0) >= n ? "#6B1A1A" : "#e8e2d8", background: (stopRatings[stop.name] || 0) >= n ? "#e0f5f3" : "#fff", color: (stopRatings[stop.name] || 0) >= n ? "#6B1A1A" : "#b8ac9a", fontSize: "0.6rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{n}</button>
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

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
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

  // Check for unrated past plans
  useEffect(() => {
    if (!user || plans.length === 0) return;
    const reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]");
    const unrated = plans.find(p => p.id && !reviewed.includes(p.id));
    if (unrated) setTimeout(() => setRatingPlan(unrated), 1500);
  }, [user, plans]);

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
  function nextStep() { setQuizStep(s => s + 1); }
  function prevStep() { setQuizStep(s => Math.max(0, s - 1)); }

  async function generate() {
    setLoading(true); setError(null);
    const shortlistResult = buildShortlist(ans, dbVenues, venueRatings);
    const shortlist = shortlistResult.venues || shortlistResult;
    const chosenZone = shortlistResult.zone || ans.area;
    const venueData = JSON.stringify(shortlist.map(v => ({
      name: v.name, type: v.type, area: v.travelZone + " London",
      price: v.price, tags: v.tags, desc: v.desc, emoji: v.emoji,
      booking: v.bookingRequired ? "Book ahead" : "Walk-in fine",
      rating: v.google_rating ? `⭐ ${v.google_rating}` : null,
      price_range: v.price || null,
    })));

    const areaNote = ans.area === "map_pin" ? `near dropped pin (${ans.mapPin?.lat?.toFixed(3)}, ${ans.mapPin?.lng?.toFixed(3)})` : ans.area;
    const travelNote = ans.travel === "walking"
  ? "walking only, all stops must be within 20 min walk of each other"
  : ans.travel === "max10"
  ? "strict: max 10 min walk between ANY two consecutive stops, prioritise venues in the same neighbourhood"
  : "walking and tube ok, keep total travel between stops under 30 min";

    const stopCount = shortlist.length >= 5 ? "pick best 4-5" : `use ALL ${shortlist.length} venues`;
    const prompt = "You are London's sharpest local guide. Build a perfect itinerary from these curated venues. User: " +
      ans.timeOfDay + " plan, vibes: " + (ans.vibes || []).join(", ") +
      ", area: " + areaNote + ", budget: " + ans.budget +
      ", group: " + ans.groupSize + ", energy: " + ans.energy +
      ", travel: " + travelNote +
      ", " + times.start + " to " + times.end +
      ", include: " + ((ans.extras || []).join(", ") || "no extras") +
      ". Venues (" + stopCount + "): " + venueData +
      ". Space stops evenly across the time window. Respond ONLY with valid JSON, no markdown, no backticks: " +
      '{"title":"punchy name","tagline":"witty sentence","vibe_scores":{"fun":7,"romantic":3,"cultural":6,"chaotic":2},"total_cost_estimate":"35-55pp","stops":[{"time":"18:30","name":"venue name","type":"bar","area":"Shoreditch","emoji":"🍸","hook":"best thing about this place","why_it_fits":"vibe match","booking":"Walk-in fine","cost_estimate":"£15-35pp","travel_to_next":"calculating..."}],"extend_the_night":"late suggestion","local_tip":"insider tip"}';

    try {
      const txt = await callClaude(prompt, 1000);
      const parsed = JSON.parse(txt);

      // Enrich stops with DB data (rating, price) and real travel times
      const enrichedStops = await Promise.all((parsed.stops || []).map(async (stop, idx) => {
        // Find this venue in DB to get coordinates and Google data
        const dbVenue = dbVenues.find(v =>
          v.name.toLowerCase().includes(stop.name.toLowerCase()) ||
          stop.name.toLowerCase().includes(v.name.toLowerCase())
        );

        const enriched = {
          ...stop,
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
          const nextDbVenue = dbVenues.find(v =>
            v.name.toLowerCase().includes(nextStop.name.toLowerCase()) ||
            nextStop.name.toLowerCase().includes(v.name.toLowerCase())
          );

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

      const finalResult = { ...parsed, stops: finalStops };
      setResult(finalResult);
      setQuizStep(QUESTIONS.length + 1);
      setPlans(prev => {
        const updated = [{ result: finalResult, ans: { ...ans }, times: { ...times }, savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), id: generateId() }, ...prev];
        localStorage.setItem("cl_plans", JSON.stringify(updated.slice(0, 20)));
        return updated;
      });
      showToast("Plan saved to My Plans");
    } catch (e) {
      setError("Couldn't generate your plan. Check your API key and try again.");
    }
    setLoading(false);
  }

  function resetToHome() { setQuizStep(-1); setAns({}); setResult(null); setError(null); setViewingPlan(null); }

  const showQuiz = activeTab === "home" && quizStep >= 0 && quizStep <= QUESTIONS.length;
  const showResult = activeTab === "home" && quizStep === QUESTIONS.length + 1 && result;
  const showHome = activeTab === "home" && quizStep === -1;
  const showViewingPlan = activeTab === "plans" && viewingPlan;

  const TABS = [
    { id: "home", label: "Plan", icon: "✦" },
    { id: "plans", label: "My Plans", icon: "📋" },
    { id: "saved", label: "Saved", icon: "📌" },
    { id: "discover", label: "Discover", icon: "🔍" },
    { id: "prefs", label: "For me", icon: "🎯" },
    ...(isAdmin ? [{ id: "add", label: "Add", icon: "➕" }, { id: "admin", label: "Admin", icon: "⚙️", badge: adminBadge }] : []),
  ];

  if (authLoading) return (
    <>
      <style>{styles}</style>
      <div className="app"><div className="loading"><div className="loading-ring" /><div className="loading-sub">Loading...</div></div></div>
    </>
  );

  if (!user) return (
    <>
      <style>{styles}</style>
      <LoginScreen />
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={"toast" + (toast.show ? " show" : "")}>{toast.msg}</div>
        {ratingPlan && <RatingPrompt plan={ratingPlan} user={user} onDismiss={() => { const reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]"); reviewed.push(ratingPlan.id); localStorage.setItem("cl_reviewed", JSON.stringify(reviewed)); setRatingPlan(null); }} onSubmit={() => { setRatingPlan(null); showToast("Thanks for your review!"); }} />}

        {showHome && <HomeScreen onStart={startQuiz} />}
        {showQuiz && <QuizScreen step={quizStep} ans={ans} times={times} setTimes={setTimes} onToggle={toggle} onNext={nextStep} onBack={prevStep} onGenerate={generate} loading={loading} loadIdx={loadIdx} error={error} />}
        {showResult && <ResultScreen result={result} times={times} ans={ans} onRestart={resetToHome} onNewPlan={startQuiz} dbVenues={dbVenues} onUpdateResult={setResult} />}

        {activeTab === "plans" && !showViewingPlan && <MyPlansScreen plans={plans} onViewPlan={(plan) => setViewingPlan(plan)} onNewPlan={() => { setActiveTab("home"); startQuiz(); }} />}
        {showViewingPlan && (
          <div>
            <button className="btn-ghost" onClick={() => setViewingPlan(null)} style={{ paddingTop: "1.5rem" }}>← My Plans</button>
            <ResultScreen result={viewingPlan.result} times={viewingPlan.times} ans={viewingPlan.ans} onRestart={() => setViewingPlan(null)} onNewPlan={() => { setViewingPlan(null); setActiveTab("home"); startQuiz(); }} dbVenues={dbVenues} onUpdateResult={(r) => setViewingPlan(p => ({ ...p, result: r }))} />
          </div>
        )}

        {activeTab === "discover" && <DiscoverScreen preferences={preferences} dbVenues={dbVenues} />}
        {activeTab === "saved" && <SavedScreen user={user} onBuildPlan={(saves) => { setAns(prev => ({ ...prev, savedVenues: saves })); setActiveTab("home"); startQuiz(); }} />}
        {activeTab === "add" && <TikTokParserScreen onSuccess={() => showToast("Added! Check Admin to approve.")} />}
        {activeTab === "prefs" && <PreferencesScreen preferences={preferences} setPreferences={setPreferences} user={user} />}
        {activeTab === "admin" && <AdminScreen onBadgeUpdate={setAdminBadge} />}

        <nav className="bottom-nav">
          {TABS.map(tab => (
            <button key={tab.id} className={"nav-tab" + (activeTab === tab.id ? " active" : "")}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== "home") { setQuizStep(-1); setViewingPlan(null); } }}>
              <span className="nav-tab-icon" style={{ position: "relative" }}>
                {tab.icon}
                {tab.badge > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -6, background: "#E84855", color: "#fff", borderRadius: "50%", fontSize: "0.5rem", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{tab.badge}</span>
                )}
              </span>
              <span className="nav-tab-label">{tab.label}</span>
              <span className="nav-tab-dot" />
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}