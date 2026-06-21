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
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    }),
  });
  const data = await resp.json();
  const txt = data.content?.find(b => b.type === "text")?.text || "";
  return txt.replace(/```json|```/g, "").trim();
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
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: #f7f6f2; color: #1c1c1a; min-height: 100vh; overflow-x: hidden; }
  .app { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #f7f6f2; padding-bottom: 80px; position: relative; }

  .shapes-wrap { position: absolute; top: 0; right: -20px; width: 220px; height: 260px; pointer-events: none; z-index: 0; }
  .shape-circle { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; animation: spin-cw 14s linear infinite; }
  .shape-teal { width: 130px; height: 130px; background: #726A4E; top: 0; right: 40px; animation-duration: 16s; }
  .shape-yellow { width: 160px; height: 160px; background: #DD4124; top: 80px; right: -10px; animation-duration: 20s; }
  .shape-cream { width: 80px; height: 80px; background: #F7EFD4; top: 150px; right: 140px; animation-duration: 12s; }
  .inner-oval { width: 56px; height: 32px; background: #B8A9D9; border-radius: 50%; animation: spin-cw 8s linear infinite; }
  .inner-starburst { animation: spin-cw 6s linear infinite; }
  .inner-star4 { animation: spin-cw 10s linear infinite; }
  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes popIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cardSwap { from{opacity:0.25;transform:scale(0.985)} to{opacity:1;transform:scale(1)} }

  .home-hero { padding: 3.5rem 1.5rem 2rem; position: relative; overflow: hidden; min-height: 300px; background: #f7f6f2; }
  .home-eyebrow { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8f7a; margin-bottom: 0.6rem; position: relative; z-index: 1; }
  .home-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 3rem; font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #1c1c1a; margin-bottom: 0.75rem; position: relative; z-index: 1; }
  .home-title em { font-style: italic; color: #726A4E; }
  .home-sub { font-size: 0.85rem; color: #6b5e4e; line-height: 1.5; position: relative; z-index: 1; max-width: 200px; }
  .home-cta { margin-top: 1.5rem; position: relative; z-index: 1; }

  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; background: rgba(247,246,242,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid rgba(0,0,0,0.06); display: flex; z-index: 100; padding-bottom: env(safe-area-inset-bottom); }
  .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px 8px; border: none; background: none; cursor: pointer; gap: 4px; transition: all 0.15s; }
  .nav-tab-icon { display: flex; align-items: center; justify-content: center; line-height: 1; transition: transform 0.2s; color: #9b8f7a; }
  .nav-tab.active .nav-tab-icon { transform: scale(1.1); color: #1c1c1a; }
  .nav-tab-label { font-family: 'DM Sans', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.04em; color: #1c1c1a; text-transform: uppercase; transition: color 0.15s; }
  .nav-tab.active .nav-tab-label { color: #1c1c1a; font-weight: 700; }
  .nav-tab-dot { width: 4px; height: 4px; border-radius: 50%; background: #726A4E; opacity: 0; transition: opacity 0.15s; }
  .nav-tab.active .nav-tab-dot { opacity: 1; }

  .section-pad { padding: 1.5rem; }
  .section-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.4rem; font-weight: 400; color: #1c1c1a; margin-bottom: 0.25rem; }
  .section-sub { font-size: 0.8rem; color: #9b8f7a; margin-bottom: 1.25rem; line-height: 1.4; }
  .divider { height: 1px; background: #e8e2d8; margin: 0 1.5rem; }

  .btn { width: 100%; padding: 14px; border-radius: 100px; border: none; background: #1c1c1a; color: #ffffff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em; }
  .btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.88; }
  .btn:active:not(:disabled) { transform: scale(0.99); }
  .btn-teal { background: #726A4E; color: #ffffff; }
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
  .progress-fill { height: 100%; background: #726A4E; border-radius: 2px; transition: width 0.4s ease; }
  .time-row { display: flex; gap: 10px; }
  .time-wrap { flex: 1; }
  .time-wrap label { font-size: 0.68rem; color: #9b8f7a; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 6px; }
  .time-wrap input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; }
  .time-wrap input:focus { outline: none; border-color: #726A4E; }

  .loading { display: flex; flex-direction: column; align-items: center; padding: 5rem 2rem; text-align: center; }
  .loading-ring { width: 44px; height: 44px; border: 2.5px solid #e8e2d8; border-top-color: #726A4E; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem; }
  .loading-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.3rem; color: #1c1c1a; margin-bottom: 0.4rem; }
  .loading-sub { font-size: 0.82rem; color: #9b8f7a; }

  .result-hero { padding: 2rem 1.5rem 1.5rem; border-bottom: 1px solid #e8e2d8; animation: fadeUp 0.4s ease; }
  .result-eyebrow { font-size: 0.68rem; font-weight: 500; color: #726A4E; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
  .result-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.8rem; line-height: 1.15; color: #1c1c1a; margin-bottom: 0.3rem; }
  .result-tagline { font-size: 0.88rem; color: #6b5e4e; line-height: 1.5; margin-bottom: 0.85rem; font-style: italic; }
  .result-meta { display: flex; gap: 1rem; font-size: 0.78rem; color: #9b8f7a; flex-wrap: wrap; }
  .vibe-pills { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 0.75rem; }
  .vibe-pill { font-size: 0.66rem; padding: 3px 9px; border-radius: 100px; border: 1px solid #ddd8ce; color: #6b5e4e; background: #fff; }

  .tab-bar { display: flex; border-bottom: 1px solid #e8e2d8; background: #ffffff; }
  .tab { flex: 1; padding: 0.85rem; border: none; background: none; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; color: #9b8f7a; border-bottom: 2px solid transparent; transition: all 0.15s; margin-bottom: -1px; }
  .tab.active { color: #726A4E; border-bottom-color: #726A4E; font-weight: 500; }

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
  .stop-time { font-size: 0.68rem; font-weight: 500; color: #726A4E; text-transform: uppercase; letter-spacing: 0.06em; }
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
  .plan-tag.teal { background: #eef3d8; color: #726A4E; }
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

  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #1c1c1a; color: #ffffff; padding: 10px 20px; border-radius: 100px; font-size: 0.82rem; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; font-family: 'DM Sans', sans-serif; }
  .toast.show { opacity: 1; }
  .err { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #fdf0ef; border: 1px solid #f5d0cc; color: #c0392b; font-size: 0.82rem; line-height: 1.4; }
  .success { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #eef3d8; border: 1px solid #726A4E; color: #726A4E; font-size: 0.82rem; line-height: 1.4; }

  /* ── TIKTOK PARSER ── */
  .parser-wrap { padding: 1.5rem; }
  .input-group { margin-bottom: 1rem; }
  .input-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: #9b8f7a; display: block; margin-bottom: 6px; font-weight: 500; }
  .input-field { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; transition: border-color 0.15s; }
  .input-field:focus { outline: none; border-color: #726A4E; }
  .input-field::placeholder { color: #c0b8ad; }
  textarea.input-field { min-height: 100px; resize: vertical; }
  .preview-card { border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .preview-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.1rem; color: #1c1c1a; margin-bottom: 0.75rem; }
  .preview-field { display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; }
  .preview-key { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #9b8f7a; min-width: 80px; padding-top: 2px; font-weight: 500; }
  .preview-val { font-size: 0.82rem; color: #1c1c1a; line-height: 1.4; flex: 1; }
  .zone-badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 500; background: #eef3d8; color: #726A4E; }

  /* ── ADMIN ── */
  .admin-card { border: 1px solid #e8e2d8; border-radius: 14px; padding: 1rem; margin-bottom: 10px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .admin-card-name { font-family: 'DM Serif Display', Georgia, serif; font-size: 1rem; color: #1c1c1a; margin-bottom: 4px; }
  .admin-card-meta { font-size: 0.75rem; color: #9b8f7a; margin-bottom: 8px; }
  .admin-actions { display: flex; gap: 8px; }
  .btn-approve { flex: 1; padding: 8px; border-radius: 8px; border: none; background: #726A4E; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; font-weight: 500; }
  .btn-reject { flex: 1; padding: 8px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: transparent; color: #9b8f7a; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; }
  .zone-select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; margin-bottom: 8px; }

  /* ── PREFERENCES ── */
  .pref-wrap { padding: 1.5rem; }
  .pref-chip { padding: 8px 14px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-size: 0.82rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; }
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
  const [sharing, setSharing] = useState(false);

  // Persist the plan so anyone with the link can view it.
  async function ensureShared() {
    setSharing(true);
    try { await supabase.from("shared_plans").upsert({ id: shareId, plan: result, times, title: result?.title || "London plan" }, { onConflict: "id" }); } catch (e) { console.error("[share]", e); }
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
                    <button onClick={() => findAlternatives(idx)} style={{ border: "none", background: "none", color: "#726A4E", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "2px 0" }}>↻ Swap</button>
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
            <button className="btn-outline" onClick={() => { setView("social"); ensureShared(); }}>👥 Share with friends</button>
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
            <div style={{ padding: "0.75rem 1rem 1rem", display: "flex", gap: 8 }}>
              <button className="btn-outline" style={{ marginTop: 0 }} disabled={sharing} onClick={async () => { await ensureShared(); navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? "✓ Copied" : "🔗 Copy link"}
              </button>
              <button className="btn-outline" style={{ marginTop: 0 }} disabled={sharing} onClick={async () => { await ensureShared(); window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this London plan: ${shareLink}`)}`); }}>
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
  const CATEGORY_COLOURS = { restaurant: "#E84855", bar: "#2D1B69", cafe: "#DD4124", market: "#F0A500", experience: "#726A4E", outdoor: "#3D8B37", museum: "#3D5A80", gallery: "#9B59B6", nightlife: "#2D1B69", event: "#726A4E" };

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
          <div className="event-card-cat" style={{ color: colour }}>{cap(cat)}</div>
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
      const txt = (data.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      if (!txt) throw new Error("Couldn't extract venue info from this image.");
      const parsedRaw = JSON.parse(txt);
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "0.75rem" }}>
        <div style={{ flex: 1, height: 1, background: "#e8e2d8" }} />
        <span style={{ fontSize: "0.72rem", color: "#9b8f7a" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#e8e2d8" }} />
      </div>

      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: "0.75rem", padding: "12px 16px", border: "1.5px dashed #ddd8ce", borderRadius: 100, fontSize: "0.82rem", color: "#4a4438", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
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

const CAT_PIN_COLOURS = { restaurant: "#E84855", bar: "#6C4AB6", cafe: "#C57B3C", market: "#F0A500", experience: "#726A4E", outdoor: "#3D8B37", museum: "#3D5A80", gallery: "#9B59B6", nightlife: "#2D1B69", event: "#E8763A" };
const CAT_PIN_EMOJI = { restaurant: "🍽️", bar: "🍸", cafe: "☕", market: "🛍️", experience: "✨", outdoor: "🌳", museum: "🏛️", gallery: "🎨", nightlife: "🌙", event: "🎫" };
const CAT_LABEL = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
// Shared across SavedScreen + SpotsMap (card/list/folder visuals).
const CAT_EMOJI = { restaurant: "\u{1F37D}️", bar: "\u{1F378}", cafe: "☕", market: "\u{1F6CD}️", experience: "✨", outdoor: "\u{1F33F}", museum: "\u{1F3DB}️", gallery: "\u{1F3A8}", nightlife: "\u{1F319}", event: "\u{1F3AB}" };
const CAT_COLOURS = { restaurant: "#E84855", bar: "#2D1B69", cafe: "#DD4124", market: "#F0A500", experience: "#726A4E", outdoor: "#3D8B37", museum: "#3D5A80", gallery: "#9B59B6", nightlife: "#2D1B69", event: "#726A4E" };
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
function cap(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ""; }

// Simple flat line icons for the bottom nav (inherit colour via currentColor).
const NAV_ICON_PATHS = {
  home: '<path d="M12 3l2.2 6.8H21l-5.4 4 2.1 6.7L12 16.4 6.3 20.5l2.1-6.7-5.4-4h6.8z"/>',
  plans: '<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  saved: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  discover: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  prefs: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
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
  const photos = items.filter(s => s.photo_url).map(s => s.photo_url);
  const cat = String(items[0]?.category || "").toLowerCase();
  if (photos.length === 0) return <div style={{ height, background: "#3D5A80", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "2rem" }}>{CAT_EMOJI[cat] || "📁"}</span></div>;
  const cells = [0, 1, 2, 3].map(i => photos[i % photos.length]);
  return (
    <div style={{ height, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
      {cells.map((p, i) => <img key={i} src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#e9e4da", minHeight: 0, minWidth: 0 }} />)}
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
          <div style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, fontSize: "1.55rem", textAlign: "center", lineHeight: 1.15, textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}>{s.name}</div>
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
function SpotsMap({ saves, listName, focusSpot, onCategory }) {
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
  const mapH = (listName || onCategory) ? 320 : 440;
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
              <button key={c} onClick={() => { setFilter(c); setSelected(null); setSheetOpen(false); onCategory && onCategory(c); }} style={{ fontSize: "0.72rem", padding: "7px 13px", borderRadius: 100, whiteSpace: "nowrap", cursor: "pointer", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", flexShrink: 0, background: filter === c ? "#1c1c1a" : "#fff", color: filter === c ? "#fff" : "#1c1c1a", fontWeight: filter === c ? 600 : 500 }}>
                {CAT_LABEL[c] || capitalise(c)}
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
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1rem", color: "#1c1c1a" }}>{listName || filterLabel} ({filteredPts.length})</div>
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
function SpotsCalendar({ saves }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selDay, setSelDay] = useState(null);
  const events = saves.filter(s => s.is_event && s.event_start);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = base.getFullYear(), month = base.getMonth();
  const monthName = base.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const parse = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const eventsOn = (dayDate) => events.filter(e => {
    const s = parse(e.event_start); const en = e.event_end ? parse(e.event_end) : s;
    return dayDate >= s && dayDate <= en;
  });
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  const gcal = (e) => {
    const s = (e.event_start || "").replace(/-/g, "");
    const endD = new Date(e.event_end || e.event_start); endD.setDate(endD.getDate() + 1);
    const en = endD.toISOString().slice(0, 10).replace(/-/g, "");
    const p = new URLSearchParams({ action: "TEMPLATE", text: e.name || "Event", dates: `${s}/${en}`, details: (e.comment || "") + (e.source_url ? `\n${e.source_url}` : ""), location: e.address || "" });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  };

  if (!events.length) return (
    <div className="empty-state"><div className="empty-emoji">📅</div><div className="empty-title">No dated events yet</div><div className="empty-sub">Saves with a date (pop-ups, shows, exhibitions) appear here.</div></div>
  );

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const upcoming = [...events].filter(e => parse(e.event_end || e.event_start) >= today).sort((a, b) => parse(a.event_start) - parse(b.event_start));
  const shown = selDay ? eventsOn(new Date(year, month, selDay)) : upcoming;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => { setMonthOffset(monthOffset - 1); setSelDay(null); }} style={{ border: "none", background: "#f5f0e8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>‹</button>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1rem", color: "#1c1c1a" }}>{monthName}</div>
        <button onClick={() => { setMonthOffset(monthOffset + 1); setSelDay(null); }} style={{ border: "none", background: "#f5f0e8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, fontSize: "0.6rem", color: "#9b8f7a", textAlign: "center", marginBottom: 4 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dayDate = new Date(year, month, d);
          const has = eventsOn(dayDate).length;
          const isToday = dayDate.getTime() === today.getTime();
          const isSel = selDay === d;
          return (
            <div key={i} onClick={() => has && setSelDay(isSel ? null : d)}
              style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: "0.74rem", cursor: has ? "pointer" : "default",
                background: isSel ? "#726A4E" : isToday ? "#eef3d8" : "transparent", color: isSel ? "#fff" : "#1c1c1a", fontWeight: has ? 600 : 400 }}>
              {d}
              {has > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "#fff" : "#E84855", marginTop: 2 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b8f7a", fontWeight: 500, margin: "16px 0 8px" }}>
        {selDay ? `Events on ${fmt(new Date(year, month, selDay))}` : "Upcoming"}
      </div>
      {shown.length === 0 && <div style={{ fontSize: "0.8rem", color: "#9b8f7a" }}>{selDay ? "Nothing on this day." : "No upcoming events."}</div>}
      {shown.map(e => (
        <div key={e.id} style={{ display: "flex", gap: 10, padding: 10, background: "#fff", border: "1px solid #f0ebe2", borderRadius: 12, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#726A4E", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {e.photo_url ? <img src={e.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🎫</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "#1c1c1a" }}>{e.name}</div>
            <div style={{ fontSize: "0.72rem", color: "#726A4E", marginTop: 2 }}>
              📅 {fmt(e.event_start)}{e.event_end && e.event_end !== e.event_start ? ` – ${fmt(e.event_end)}` : ""}{e.event_time ? ` · 🕐 ${e.event_time}` : ""}
            </div>
            {e.area && <div style={{ fontSize: "0.68rem", color: "#9b8f7a", marginTop: 2 }}>📍 {e.area}</div>}
            <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
              <a href={gcal(e)} target="_blank" rel="noreferrer" style={{ fontSize: "0.66rem", color: "#726A4E", fontWeight: 500 }}>+ Google Calendar</a>
              {e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.66rem", color: "#726A4E" }}>View source ↗</a>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedScreen({ user, onBuildPlan }) {
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
  const [savedView, setSavedView] = useState("folders"); // folders | map | calendar
  const [customFolders, setCustomFolders] = useState([]); // user-created (possibly empty) folders
  const [menuFolder, setMenuFolder] = useState(null);
  const [movingSpot, setMovingSpot] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false); // collapse the "add a spot" controls by default
  const [focusSpot, setFocusSpot] = useState(null); // tapping a list card pans the map to it
  const [mapCat, setMapCat] = useState(""); // Map tab: "" = all, else a category scope

  // Collapse the capture controls whenever the user switches Folders/Map/Calendar.
  useEffect(() => { setCaptureOpen(false); }, [savedView]);

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

  // Check URL params for share target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get("text") || params.get("url") || "";
    if (sharedText && /tiktok\.com|instagram\.com/i.test(sharedText)) {
      setMediaType(sharedText.includes("instagram.com") ? "instagram" : "tiktok");
      setTextInput(sharedText);
      window.history.replaceState({}, "", "/");
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
    const txt = await callClaude(`You are extracting London venues/events from social-media text.\nText: ${JSON.stringify(caption)}\n\n${EXTRACT_SCHEMA}`, 900);
    if (!txt) throw new Error("AI returned an empty response. Try again.");
    const raw = JSON.parse(txt);
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
    let n = 0;
    for (const file of files) {
      n++;
      setParseStatus(`Reading image ${n} of ${files.length}...`);
      const { base64, mediaType } = await fileToDownscaledBase64(file);
      const resp = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 900,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: `This is a screenshot about a London venue, event, or place. ${EXTRACT_SCHEMA}` },
          ] }],
        }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || "AI API error");
      const t = (data.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      if (!t) continue;
      const raw = JSON.parse(t);
      const items = Array.isArray(raw) ? raw : [raw];
      for (const p of items) {
        if (!p?.name) continue;
        setParseStatus(`Looking up "${p.name}" on Google...`);
        const g = await enrich(p.name, p.area);
        drafts.push(buildDraft(p, g, { source_type: "screenshot", source_url: null, _screenshot_b64: base64 }));
      }
    }
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

  async function handleParse(files) {
    if (!user?.id) { setError("You're not signed in — please sign in to save."); return; }
    ensureNotifyPermission();
    setParsing(true); setError(null);
    try {
      let drafts = [];
      if (mediaType === "screenshot") {
        if (!files || !files.length) throw new Error("Pick one or more screenshots.");
        drafts = await parseScreenshots(files);
      } else if (mediaType === "tiktok") {
        drafts = await parseTikTok(textInput);
      } else if (mediaType === "instagram") {
        drafts = await parseInstagram(textInput);
      } else if (mediaType === "bulk") {
        drafts = await parseBulk(textInput);
      } else {
        drafts = await parseMaps(textInput, false);
      }
      if (!drafts.length) throw new Error("Nothing found to add. Try a clearer source.");
      setParseStatus("Fetching photos...");
      for (const d of drafts) await withPreviewPhoto(d);
      setPreview(prev => [...prev, ...drafts]);
      setTextInput("");
      setParseStatus("");
      notify("Parsing done ✦", `${drafts.length} spot${drafts.length !== 1 ? "s" : ""} ready to review`);
    } catch (e) {
      console.error("[handleParse]", e);
      setError(e.message || "Couldn't parse that.");
      setParseStatus("");
    }
    setParsing(false);
  }

  async function resolvePhoto(d) {
    // Prefer the Google Maps photo so the card + thumbnail match; fall back to the
    // screenshot / TikTok cover only when Google has no photo.
    const attempts = [];
    if (d.google_place_id) attempts.push({ place_id: d.google_place_id });
    if (d._screenshot_b64) attempts.push({ image_base64: d._screenshot_b64, content_type: "image/jpeg" });
    if (d._cover_url) attempts.push({ image_url: d._cover_url });
    for (const body of attempts) {
      try {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", ...body }) });
        const j = await r.json();
        if (j.found && j.url) return j.url;
      } catch { /* try next source */ }
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
    const total = preview.length;
    setSaving(true); setError(null);
    let savedCount = 0;
    try {
      for (let i = 0; i < preview.length; i++) {
        const d = preview[i];
        setParseStatus(`Saving ${i + 1} of ${preview.length}: ${d.name}...`);
        const photo_url = d.photo_url || await resolvePhoto(d);
        const chosen = saveFolder === "__new__" ? newFolder.trim() : saveFolder.trim();
        // Auto = leave folder null so it always derives from the category tag (and
        // auto-corrects if the category->folder mapping changes). Explicit pick stores it.
        const folder = chosen || null;
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
          photo_url, folder, status: "pending",
        };
        const { data: inserted, error: insertErr } = await supabase.from("experiences").insert(row).select();
        if (insertErr) throw new Error("Save failed: " + insertErr.message);
        if (!inserted || !inserted.length) throw new Error("Save didn't persist — check you're signed in and that the migration has been run.");
        savedCount++;
      }
      setParseStatus("");
      setPreview([]);
      setSaveFolder(""); setNewFolder(""); setCaptureOpen(false);
      showSuccess(savedCount === 1 ? preview[0].name : `${savedCount} spots`);
      notify("Saved to your collection ✨", savedCount === 1 ? `${preview[0].name} added` : `${savedCount} spots added`);
      await loadSaves();
    } catch (e) {
      console.error("[saveAll]", e);
      setError(e.message + (savedCount ? ` (${savedCount} saved before this)` : ""));
      setParseStatus("");
      if (savedCount) { setPreview(prev => prev.slice(savedCount)); await loadSaves(); }
    }
    setSaving(false);
  }

  function removeDraft(i) { setPreview(prev => prev.filter((_, idx) => idx !== i)); }

  // eslint-disable-next-line no-unused-vars
  async function parseAndSave_legacy(url) {
    const urlMatch = (url || "").match(/https?:\/\/[^\s]*(tiktok\.com|vm\.tiktok\.com)[^\s]*/i);
    if (!urlMatch) { return; }
    const cleanUrl = urlMatch[0];
    if (!user?.id) { return; }
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
  "category": "EXACTLY one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife (an exhibition = gallery; a pop-up/show/festival/concert = event; a club = nightlife; a pub = bar)",
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

      const { data: inserted, error: insertErr } = await supabase.from("user_saves").insert(save).select();
      if (insertErr) throw new Error("Save failed: " + insertErr.message);
      if (!inserted || inserted.length === 0) throw new Error("Save didn't persist — the database accepted the request but returned no row. Check you're signed in and that RLS allows this user to read/write user_saves.");
      setParseStatus("");
      showSuccess(save.name);
      await loadSaves();
    } catch (e) {
      console.error("[parseAndSave]", e);
      setError(e.message || "Couldn't parse this TikTok.");
      setParseStatus("");
    }
    setParsing(false);
  }

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
    const colour = CAT_COLOURS[cat] || "#3D5A80";
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
          <div onClick={() => { setFocusSpot({ ...s, _focus: Date.now() }); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ cursor: "pointer" }}>
            <BigSpotCard s={s} photo={s.photo_url} />
          </div>
          <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => onBuildPlan([s])} style={{ border: "none", background: "#726A4E", color: "#fff", borderRadius: 100, padding: "7px 16px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>✦ Make a plan based on this</button>
            <button onClick={() => setMovingSpot(s)} style={{ border: "1px solid #e8e2d8", background: "#fff", borderRadius: 100, padding: "7px 14px", fontSize: "0.72rem", color: "#6b5e4e", fontWeight: 500, cursor: "pointer" }}>↪ Move to list</button>
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

        {!openFolder && !captureOpen && (
          <button onClick={() => setCaptureOpen(true)} className="btn btn-teal" style={{ width: "100%" }}>+ Add or save a new spot</button>
        )}

        {!openFolder && captureOpen && (<>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1c1c1a" }}>Add a spot</div>
          <button onClick={() => setCaptureOpen(false)} style={{ border: "none", background: "none", color: "#9b8f7a", cursor: "pointer", fontSize: "0.78rem" }}>Hide ✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {MEDIA_TYPES.map(m => (
            <button key={m.id} onClick={() => { setMediaType(m.id); setError(null); }} disabled={parsing || saving}
              style={{ fontSize: "0.74rem", padding: "7px 12px", borderRadius: 100, cursor: "pointer",
                border: mediaType === m.id ? "1.5px solid #726A4E" : "1.5px solid #e8e2d8",
                background: mediaType === m.id ? "#eef3d8" : "#fff", color: mediaType === m.id ? "#726A4E" : "#6b5e4e", fontWeight: mediaType === m.id ? 600 : 400 }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {mediaType === "screenshot" ? (
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", border: "1.5px dashed #ddd8ce", borderRadius: 12, fontSize: "0.82rem", color: "#4a4438", cursor: "pointer" }}>
            📷 Upload screenshot(s) — pick several at once
            <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={parsing || saving}
              onChange={e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) handleParse(f); }} />
          </label>
        ) : (mediaType === "instagram" || mediaType === "bulk") ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea className="input-field" rows={mediaType === "bulk" ? 5 : 3} placeholder={current.placeholder} value={textInput}
              onChange={e => { setTextInput(e.target.value); setError(null); }} style={{ resize: "vertical" }} />
            <button className="btn btn-teal" onClick={() => handleParse()} disabled={parsing || saving || !textInput.trim()}>{parsing ? "Parsing..." : "Parse ✦"}</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input-field" type="text" placeholder={current.placeholder} value={textInput}
              onChange={e => { setTextInput(e.target.value); setError(null); }} style={{ flex: 1 }} />
            <button className="btn btn-teal" onClick={() => handleParse()} disabled={parsing || saving || !textInput.trim()} style={{ width: "auto", padding: "12px 16px", whiteSpace: "nowrap" }}>{parsing ? "..." : "Parse"}</button>
          </div>
        )}

        {mediaType === "bulk" && <div style={{ fontSize: "0.66rem", color: "#b8ac9a", marginTop: 6 }}>One per line. Google Maps links are resolved; plain place names are looked up on Google. Great for importing a whole list.</div>}
        </>)}

        {(parsing || saving) && parseStatus && <div style={{ fontSize: "0.75rem", color: "#726A4E", marginTop: 8 }}>{parseStatus}</div>}
      </div>

      {preview.length > 0 && (
        <div style={{ padding: "0 1.5rem 1rem" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9b8f7a", marginBottom: 8, fontWeight: 500 }}>{preview.length} to review — check, then save</div>
          {preview.map((v, i) => <VenueCard key={i} v={v} draft onRemove={() => removeDraft(i)} />)}
          <div style={{ margin: "10px 0" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b5e4e", marginBottom: 4 }}>Save to list</div>
            <select value={saveFolder} onChange={e => setSaveFolder(e.target.value)} className="input-field" style={{ padding: "10px 12px" }}>
              <option value="">Auto — by category</option>
              {existingFolders.map(f => <option key={f} value={f}>{f}</option>)}
              <option value="__new__">+ Create new list…</option>
            </select>
            {saveFolder === "__new__" && (
              <input className="input-field" style={{ marginTop: 6 }} placeholder="New list name" value={newFolder} onChange={e => setNewFolder(e.target.value)} />
            )}
          </div>
          <button className="btn btn-teal" onClick={saveAll} disabled={saving || (saveFolder === "__new__" && !newFolder.trim())} style={{ marginTop: 4 }}>{saving ? "Saving..." : `Save ${preview.length} spot${preview.length !== 1 ? "s" : ""}${saveFolder && saveFolder !== "__new__" ? ` to ${saveFolder}` : ""} ✦`}</button>
        </div>
      )}

      <div style={{ padding: "0 1.5rem 1rem" }}>
        {saves.length > 0 && !openFolder && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["folders", "Lists"], ["map", "Map"], ["calendar", "Calendar"]].map(([id, label]) => (
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
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a", padding: "0 14px 12px" }}>{CAT_LABEL[mapCat] || cap(mapCat)} ({scopeSaves.length})</div>
            ))}
          </>
        )}
        {saves.length > 0 && savedView === "calendar" && <SpotsCalendar saves={saves} />}
        {saves.length > 0 && savedView === "folders" && !openFolder && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0.5rem 0 0.75rem" }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a" }}>Your lists ({saves.length} spot{saves.length !== 1 ? "s" : ""})</div>
              <button onClick={createFolder} style={{ fontSize: "0.74rem", padding: "6px 12px", borderRadius: 100, border: "1.5px solid #726A4E", background: "#fff", color: "#726A4E", fontWeight: 600, cursor: "pointer" }}>+ New list</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {folderNames.map(f => {
                const items = grouped[f] || [];
                return (
                  <div key={f} style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", background: "#fff" }}>
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
                        <button onClick={() => deleteFolder(f)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderTop: "1px solid #f0ebe2", background: "#fff", cursor: "pointer", fontSize: "0.78rem", color: "#E84855" }}>Delete</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn btn-teal" style={{ marginTop: "1rem" }} onClick={() => onBuildPlan(saves)}>Build plan from all {saves.length} spot{saves.length !== 1 ? "s" : ""} ✦</button>
          </>
        )}
        {saves.length > 0 && savedView === "folders" && openFolder && (
          <>
            <button className="btn-ghost" onClick={() => { setOpenFolder(null); setFocusSpot(null); }} style={{ marginBottom: "0.75rem" }}>← All lists</button>
            {folderSaves.length > 0 && (
              <div style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <SpotsMap key={"list-" + openFolder} saves={folderSaves} listName={openFolder} focusSpot={focusSpot} />
              </div>
            )}
            {folderSaves.length === 0 && <div style={{ fontSize: "0.8rem", color: "#9b8f7a" }}>No spots in this list yet — pick it as the list when you save something.</div>}
            {folderSaves.length > 0 && renderSheet(folderSaves, (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px 12px" }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a" }}>{openFolder} ({folderSaves.length} place{folderSaves.length !== 1 ? "s" : ""})</div>
                <button onClick={() => renameFolder(openFolder)} style={{ fontSize: "0.74rem", padding: "6px 12px", borderRadius: 100, border: "1.5px solid #e8e2d8", background: "#fff", color: "#6b5e4e", fontWeight: 500, cursor: "pointer" }}>✎ Rename</button>
              </div>
            ))}
            {folderSaves.length > 0 && <button className="btn btn-teal" style={{ marginTop: "0.25rem" }} onClick={() => onBuildPlan(folderSaves)}>Build plan from {openFolder} ✦</button>}
          </>
        )}
        {saves.length === 0 && preview.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">📌</div>
            <div className="empty-title">No saved spots yet</div>
            <div className="empty-sub">Pick a source above — TikTok, Instagram, screenshots, or Google Maps — and start capturing.</div>
          </div>
        )}
      </div>

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

      {movingSpot && (
        <div onClick={() => setMovingSpot(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.05rem", color: "#1c1c1a", marginBottom: 4 }}>Move to list</div>
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
        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#726A4E", fontWeight: 500, marginBottom: "0.5rem" }}>How was it?</div>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.3rem", color: "#1c1c1a", marginBottom: "0.25rem" }}>{plan.result.title}</div>
        <div style={{ fontSize: "0.78rem", color: "#9b8f7a", marginBottom: "1.25rem" }}>{plan.savedAt}</div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#4a4438", marginBottom: "0.5rem" }}>Overall rating</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setOverall(n)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid", borderColor: overall >= n ? "#726A4E" : "#ddd8ce", background: overall >= n ? "#726A4E" : "#fff", color: overall >= n ? "#fff" : "#9b8f7a", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{n}</button>
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
                  <button key={n} onClick={() => rateStop(stop.name, n)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid", borderColor: (stopRatings[stop.name] || 0) >= n ? "#726A4E" : "#e8e2d8", background: (stopRatings[stop.name] || 0) >= n ? "#eef3d8" : "#fff", color: (stopRatings[stop.name] || 0) >= n ? "#726A4E" : "#b8ac9a", fontSize: "0.6rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{n}</button>
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
  const [sharedPlan, setSharedPlan] = useState(null);
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

    const savedVenues = ans.savedVenues || [];
    const matchVenue = (name) => {
      const n = (name || "").toLowerCase();
      const hit = (v) => v.name && (v.name.toLowerCase().includes(n) || n.includes(v.name.toLowerCase()));
      return dbVenues.find(hit) || savedVenues.find(hit) || null;
    };
    const savedForPrompt = savedVenues.map(v => ({ name: v.name, type: v.category, area: v.zone || v.area || "London", price: v.price, tags: v.vibe_tags, desc: v.comment }));
    const savedClause = savedVenues.length
      ? '. IMPORTANT: the following are the USER\'S OWN saved spots — you MUST include at least 1 (ideally 2) of them in the plan, and they take priority over the curated venues. For each stop that is one of these saved spots, add "saved": true to that stop. Saved spots: ' + JSON.stringify(savedForPrompt)
      : "";

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
      ". Venues (" + stopCount + "): " + venueData + savedClause +
      ". Space stops evenly across the time window. Respond ONLY with valid JSON, no markdown, no backticks: " +
      '{"title":"punchy name","tagline":"witty sentence","vibe_scores":{"fun":7,"romantic":3,"cultural":6,"chaotic":2},"total_cost_estimate":"35-55pp","stops":[{"time":"18:30","name":"venue name","type":"bar","area":"Shoreditch","emoji":"🍸","saved":false,"hook":"best thing about this place","why_it_fits":"vibe match","booking":"Walk-in fine","cost_estimate":"£15-35pp","travel_to_next":"calculating..."}],"extend_the_night":"late suggestion","local_tip":"insider tip"}';

    try {
      const txt = await callClaude(prompt, 1000);
      const parsed = JSON.parse(txt);

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
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "⚙️", badge: adminBadge }] : []),
  ];

  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("plan");
    if (!pid) return;
    supabase.from("shared_plans").select("plan,times,title").eq("id", pid).single()
      .then(({ data }) => { if (data?.plan) setSharedPlan(data); })
      .catch(() => {});
  }, []);

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
                <NavIcon id={tab.id} />
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