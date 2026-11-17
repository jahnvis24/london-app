import { Fragment, useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { mp, mpIdentify, mpReset, mpSetInternal, hasLoggedInBefore, rememberLoggedIn, deviceType, utm, acquisitionSource, saveType, rememberShareOpen, shareConversion } from "./analytics.js";

// ── SUPABASE ─────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── API AUTH ─────────────────────────────────────────────────
// Every /api/* route now requires a Supabase JWT, so the serverless functions
// can tell who is calling before spending Claude/Google credits or writing with
// the service key. Attaching the token here — once, around fetch — keeps the
// ~25 existing call sites unchanged and covers any added later.
if (typeof window !== "undefined" && !window.__apiAuthPatched) {
  window.__apiAuthPatched = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith("/api/")) return nativeFetch(input, init);
    let token = null;
    try { token = (await supabase.auth.getSession()).data?.session?.access_token || null; } catch {}
    if (!token) return nativeFetch(input, init);
    const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    return nativeFetch(input, { ...init, headers });
  };
}

// ── ANALYTICS ────────────────────────────────────────────────
let mpGenAttempt = 0, mpLastGenKey = null, mpLastPlanId = null, mpLastGenFailed = false;
function track(event, properties = {}) {
  const uid = supabase.auth.getUser?.()?.then?.(r => r.data?.user?.id);
  uid?.then(id => {
    if (!id) return;
    supabase.from("analytics_events").insert({ user_id: id, event, properties }).then(() => {});
  }).catch(() => {});
}

// Mixpanel save events: save_created for every save, plus first_place_saved once per user.
let mpDiscoverCtx = {}; // surface/position of the Discover card that was last opened
const mpJoinedViaLink = new Set();
function mpPlaceSaved(user, { place_category, area, save_method = "tap_save", enrichment_source = "google_places", count = 1 }) {
  if (!user?.id) return;
  let before = 0;
  try { before = parseInt(localStorage.getItem("cl_mp_saves_" + user.id) || "0", 10) || 0; localStorage.setItem("cl_mp_saves_" + user.id, String(before + count)); } catch { /* storage unavailable */ }
  const total = before + count;
  mp("save_created", { save_type: saveType(place_category), enrichment_source, save_location_district: area || undefined, save_creation_success: true, places_saved_count: total, device_os: deviceType() });
  let first = false;
  try { first = !localStorage.getItem("cl_mp_first_save_" + user.id); if (first) localStorage.setItem("cl_mp_first_save_" + user.id, "1"); } catch { /* storage unavailable */ }
  if (first) { mp("first_place_saved", { save_type: saveType(place_category), save_method, places_saved_count: total, enrichment_source }); shareConversion("first_place_saved"); }
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
  { id: "vibes", label: "1 of 5", title: "Pick your vibe", multi: true, options: [{ value: "chill", label: "Chill", emoji: "😌" }, { value: "romantic", label: "Romantic", emoji: "🌹" }, { value: "chaotic", label: "Chaotic fun", emoji: "🌀" }, { value: "cultural", label: "Cultural", emoji: "🏛️" }, { value: "fancy", label: "Fancy", emoji: "🥂" }, { value: "hidden_gems", label: "Hidden gems", emoji: "💎" }, { value: "social", label: "Social", emoji: "🎉" }, { value: "solo", label: "Solo reset", emoji: "🧘" }, { value: "creative", label: "Creative", emoji: "🎨" }, { value: "activity", label: "Activity-based", emoji: "🎯" }, { value: "active", label: "Active", emoji: "🏃" }] },
  { id: "area", label: "2 of 5", title: "Any area preference?", multi: false, options: [{ value: "central", label: "Central", emoji: "🎭" }, { value: "east", label: "East", emoji: "🧱" }, { value: "south", label: "South", emoji: "🌉" }, { value: "west", label: "West", emoji: "🌳" }, { value: "north", label: "North", emoji: "🌲" }, { value: "southwest", label: "Southwest", emoji: "🏡" }, { value: "northwest", label: "Northwest", emoji: "🌿" }, { value: "outskirts", label: "Outskirts", emoji: "🚂" }, { value: "surprise_me", label: "Surprise me", emoji: "🎲" }, { value: "map_pin", label: "Pick on map", emoji: "📍" }] },
  { id: "budget", label: "3 of 5", title: "What's your budget per person?", multi: false, options: [{ value: "£10–£30", label: "£10–£30", emoji: "💸" }, { value: "£30–£50", label: "£30–£50", emoji: "💳" }, { value: "£50–£80", label: "£50–£80", emoji: "✨" }, { value: "£80+", label: "£80+", emoji: "🚀" }] },
  { id: "groupSize", label: "4 of 5", title: "Who's coming?", multi: false, options: [{ value: "solo", label: "Just me", emoji: "🙋" }, { value: "duo", label: "Two of us", emoji: "👫" }, { value: "small", label: "3–5 people", emoji: "👯" }, { value: "large", label: "5+ crew", emoji: "🎊" }] },
  { id: "energy", label: "5 of 5", title: "Energy level today?", multi: false, options: [{ value: "low", label: "Low & breezy", emoji: "🌿" }, { value: "medium", label: "Up for it", emoji: "⚡" }, { value: "high", label: "Max chaos", emoji: "🔥" }] },
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
// Admin is now a database flag (profiles.is_admin) checked by RLS and the API
// routes, not an email comparison in client code.

function generateId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

// Share links are only as private as their id. Math.random() is not a CSPRNG and
// 6 chars is enumerable, so public share tokens use crypto with 22 chars.
function generateShareToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── CDN ASSETS ───────────────────────────────────────────────
// Leaflet is fetched from unpkg at runtime, which means unpkg can execute code in
// our page with access to the signed-in user's Supabase session. The pinned
// subresource-integrity hashes make the browser reject any file that doesn't
// match, so a compromised or swapped CDN build fails closed instead of running.
const CDN_ASSETS = {
  "leaflet-css":  { url: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",                             integrity: "sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" },
  "leaflet-js":   { url: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",                              integrity: "sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH" },
  "mcluster-css": { url: "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",         integrity: "sha384-pmjIAcz2bAn0xukfxADbZIb3t8oRT9Sv0rvO+BR5Csr6Dhqq+nZs59P0pPKQJkEV" },
  "mcluster-js":  { url: "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js",  integrity: "sha384-eXVCORTRlv4FUUgS/xmOyr66XBVraen8ATNLMESp92FKXLAMiKkerixTiBvXriZr" },
};

function loadCdnCss(id) {
  if (document.getElementById(id)) return;
  const { url, integrity } = CDN_ASSETS[id];
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet"; l.href = url;
  l.integrity = integrity; l.crossOrigin = "anonymous";
  document.head.appendChild(l);
}

function loadCdnScript(id) {
  return new Promise((resolve, reject) => {
    let s = document.getElementById(id);
    if (s) { if (s.dataset.loaded) resolve(); else s.addEventListener("load", () => resolve()); return; }
    const { url, integrity } = CDN_ASSETS[id];
    s = document.createElement("script");
    s.id = id; s.src = url;
    s.integrity = integrity; s.crossOrigin = "anonymous";
    s.addEventListener("load", () => { s.dataset.loaded = "1"; resolve(); });
    s.addEventListener("error", () => reject(new Error(`Failed to load ${id}`)));
    document.head.appendChild(s);
  });
}

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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&family=Unbounded:wght@400;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  button { color: #3A0B14; font-family: inherit; -webkit-tap-highlight-color: transparent; }
  body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; background: #FAF7F2; color: #3A0B14; min-height: 100vh; overflow-x: hidden; }
  .app { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #FAF7F2; padding-bottom: 88px; position: relative; }
  a { color: #7A1E33; text-decoration: none; }
  :focus-visible { outline: 2px solid #7A1E33; outline-offset: 2px; }
  button:focus:not(:focus-visible), a:focus:not(:focus-visible) { outline: none; }
  button:active { transform: scale(0.97); }
  .chip:active, .filter-chip:active, .pref-chip:active { transform: scale(0.93); }
  @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .tab-content { animation: slideUp 0.2s ease; }

  .shapes-wrap { position: absolute; top: 0; right: -20px; width: 220px; height: 260px; pointer-events: none; z-index: 0; }
  .shape-circle { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; animation: spin-cw 14s linear infinite; }
  .shape-teal { width: 130px; height: 130px; background: #3A0B14; top: 0; right: 40px; animation-duration: 16s; }
  .shape-yellow { width: 160px; height: 160px; background: #7A7A45; top: 80px; right: -10px; animation-duration: 20s; }
  .shape-cream { width: 80px; height: 80px; background: #F7EFD4; top: 150px; right: 140px; animation-duration: 12s; }
  .inner-oval { width: 56px; height: 32px; background: #BAD2E8; border-radius: 50%; animation: spin-cw 8s linear infinite; }
  .inner-starburst { animation: spin-cw 6s linear infinite; }
  .inner-star4 { animation: spin-cw 10s linear infinite; }
  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(.6) rotate(0deg)} 50%{opacity:1;transform:scale(1.15) rotate(20deg)} }
  @keyframes logoIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes heartBurst { 0%{opacity:0;transform:scale(.3)} 30%{opacity:1;transform:scale(1.25)} 100%{opacity:0;transform:scale(1.7)} }
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

  .home-hero { padding: 3.5rem 1.5rem 2rem; position: relative; overflow: hidden; min-height: 300px; background: #FAF7F2; }
  .home-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(58,11,20,.45); margin-bottom: 0.6rem; position: relative; z-index: 1; }
  .home-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 3rem; font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #3A0B14; margin-bottom: 0.75rem; position: relative; z-index: 1; }
  .home-title em { font-style: italic; color: #7A1E33; }
  .home-sub { font-size: 15px; color: rgba(58,11,20,.55); line-height: 1.5; position: relative; z-index: 1; max-width: 200px; }
  .home-cta { margin-top: 1.5rem; position: relative; z-index: 1; }

  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; height: 88px; background: rgba(250,247,242,.92); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-top: 1px solid rgba(58,11,20,.12); display: flex; align-items: flex-start; padding: 13px 8px 0; z-index: 100; padding-bottom: env(safe-area-inset-bottom); }
  .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; border: none; background: none; cursor: pointer; gap: 7px; transition: all 0.2s; }
  .nav-tab-icon { display: flex; align-items: center; justify-content: center; line-height: 1; transition: all 0.2s; color: rgba(58,11,20,.35); width: 16px; height: 16px; }
  .nav-tab.active .nav-tab-icon { color: #3A0B14; background: none; }
  .nav-tab-label { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.11em; color: rgba(58,11,20,.35); text-transform: uppercase; transition: color 0.2s; }
  .nav-tab.active .nav-tab-label { color: #3A0B14; }
  .nav-tab-dot { display: none; }
  .capture-fab { position: fixed; z-index: 110; bottom: calc(98px + env(safe-area-inset-bottom)); right: max(20px, calc(50% - 210px + 20px)); width: 56px; height: 56px; border-radius: 50%; border: none; background: #3A0B14; color: #BAD2E8; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 22px rgba(217,65,43,.4); transition: transform 0.34s cubic-bezier(.3,1.3,.4,1); font: 200 30px 'Instrument Serif', Georgia, serif; }
  .capture-fab:active { transform: scale(0.92); }

  .section-pad { padding: 1.5rem; }
  .section-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 40px; font-weight: 400; line-height: 1; letter-spacing: -0.015em; color: #3A0B14; margin-bottom: 0.25rem; }
  .section-sub { font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(58,11,20,.42); margin-bottom: 1.25rem; line-height: 1.4; }
  .divider { height: 1px; background: rgba(58,11,20,.13); margin: 0 1.5rem; }

  button, input, select, textarea { border-radius: 8px; }
  .btn { width: 100%; padding: 15px; border-radius: 8px; border: none; background: #3A0B14; color: #FAF7F2; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.02em; }
  .btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.88; }
  .btn:active:not(:disabled) { transform: scale(0.98); }
  .btn-teal { background: #3A0B14; color: #BAD2E8; }
  .btn-outline { width: 100%; padding: 14px; border-radius: 8px; border: 1px solid rgba(58,11,20,.18); background: transparent; color: #3A0B14; font-size: 13.5px; font-weight: 600; cursor: pointer; margin-top: 0.6rem; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
  .btn-outline:hover { border-color: #3A0B14; color: #3A0B14; }
  .btn-ghost { background: none; border: none; color: #3A0B14; font-size: 15px; font-weight: 600; cursor: pointer; padding: 1rem 1.5rem 0; display: flex; align-items: center; gap: 5px; }
  .btn-ghost:hover { color: #000; }

  .chip { padding: 8px 15px; border-radius: 8px; border: 1px solid rgba(58,11,20,.16); font-size: 12.5px; font-weight: 600; cursor: pointer; background: transparent; color: rgba(58,11,20,.6); transition: all 0.2s; display: flex; align-items: center; gap: 6px; user-select: none; }
  .chip:hover { border-color: rgba(58,11,20,.4); }
  .chip:active { transform: scale(0.93); }
  .chip.sel { background: #3A0B14; color: #FAF7F2; border-color: #3A0B14; }
  .btn-outline:active { transform: scale(0.98); }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; }

  .card { background: #FAF7F2; border: 1px solid rgba(58,11,20,.13); border-radius: 14px; padding: 1.25rem; }

  .q-label { font-size: 11px; font-weight: 500; color: rgba(58,11,20,.42); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem; }
  .q-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.6rem; line-height: 1.2; color: #3A0B14; margin-bottom: 1.5rem; }
  .progress-label { font-size: 11px; color: rgba(58,11,20,.42); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .progress-bg { height: 2px; background: rgba(58,11,20,.13); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: #3A0B14; border-radius: 2px; transition: width 0.4s ease; }
  .time-row { display: flex; gap: 10px; }
  .time-wrap { flex: 1; }
  .time-wrap label { font-size: 11px; color: rgba(58,11,20,.45); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 6px; }
  .time-wrap input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(58,11,20,.18); background: #fff; color: #3A0B14; font-size: 16px; }
  .time-wrap input:focus { outline: none; border-color: #7A1E33; }

  .loading { display: flex; flex-direction: column; align-items: center; padding: 5rem 2rem; text-align: center; }
  .loading-ring { width: 44px; height: 44px; border: 2.5px solid rgba(58,11,20,.13); border-top-color: #7A1E33; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem; }
  .loading-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.3rem; color: #3A0B14; margin-bottom: 0.4rem; }
  .loading-sub { font-size: 15px; color: rgba(58,11,20,.45); }

  .result-hero { padding: 2rem 1.5rem 1.5rem; border-bottom: 1px solid rgba(58,11,20,.13); animation: fadeUp 0.4s ease; }
  .result-eyebrow { font-size: 11px; font-weight: 500; color: #7A1E33; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
  .result-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.8rem; line-height: 1.15; color: #3A0B14; margin-bottom: 0.3rem; }
  .result-tagline { font-size: 16px; color: rgba(58,11,20,.55); line-height: 1.5; margin-bottom: 0.85rem; font-style: italic; }
  .result-meta { display: flex; gap: 1rem; font-size: 13px; color: rgba(58,11,20,.45); flex-wrap: wrap; }
  .vibe-pills { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 0.75rem; }
  .vibe-pill { font-size: 11px; padding: 3px 9px; border-radius: 8px; border: 1px solid rgba(58,11,20,.18); color: rgba(58,11,20,.55); background: #fff; }

  .tab-bar { display: flex; border-bottom: 1px solid rgba(58,11,20,.13); background: #ffffff; }
  .tab { flex: 1; padding: 0.85rem; border: none; background: none; font-size: 13px; cursor: pointer; color: rgba(58,11,20,.45); border-bottom: 2px solid transparent; transition: all 0.15s; margin-bottom: -1px; }
  .tab.active { color: #7A1E33; border-bottom-color: #7A1E33; font-weight: 500; }

  .stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(58,11,20,.13); border-bottom: 1px solid rgba(58,11,20,.13); }
  .stat { background: #ffffff; padding: 1rem; text-align: center; }
  .stat-val { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.2rem; color: #3A0B14; }
  .stat-lbl { font-size: 11px; color: rgba(58,11,20,.45); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  .stops-wrap { padding: 1.25rem 1.5rem; }
  .stop { border: 1px solid rgba(58,11,20,.13); border-radius: 16px; margin-bottom: 14px; background: #fff; overflow: hidden; animation: fadeUp 0.3s ease; box-shadow: 0 2px 8px rgba(58,11,20,.04); }
  .stop-inner { padding: 16px 16px 10px; }
  .stop-top { display: flex; gap: 12px; align-items: flex-start; }
  .stop-emoji-wrap { width: 48px; height: 48px; border-radius: 11px; background: #BAD2E8; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
  .stop-body { flex: 1; min-width: 0; }
  .stop-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .stop-time { font-size: 12px; font-weight: 600; color: #7A1E33; text-transform: uppercase; letter-spacing: 0.06em; }
  .stop-type { font-size: 11px; color: rgba(58,11,20,.42); text-transform: uppercase; letter-spacing: 0.06em; }
  .stop-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(58,11,20,.18); }
  .stop-name { font-family: 'Instrument Serif', Georgia, serif; font-size: 23px; color: #3A0B14; margin-bottom: 5px; line-height: 1.2; }
  .stop-hook { font-size: 15px; color: rgba(58,11,20,.55); line-height: 1.5; }
  .stop-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px 12px; border-top: 1px solid rgba(58,11,20,.08); margin-top: 10px; min-height: 44px; }
  .stop-pills-row { display: flex; gap: 6px; flex-wrap: nowrap; overflow: hidden; flex: 1; min-width: 0; }
  .stop-pill { font-size: 12px; padding: 4px 10px; border-radius: 8px; background: #BAD2E8; color: #3A0B14; }
  .stop-booking { font-size: 11px; color: rgba(58,11,20,.45); }
  .why-fit { padding: 0 1.1rem 0.75rem; font-size: 12px; color: rgba(58,11,20,.45); font-style: italic; line-height: 1.4; border-top: 1px solid rgba(58,11,20,.13); padding-top: 0.55rem; }
  .transit { display: flex; align-items: center; gap: 8px; padding: 0 0.5rem; margin-bottom: 10px; color: rgba(58,11,20,.42); font-size: 12px; }

  .night-box { margin: 0 1.5rem 0.85rem; padding: 1.1rem; border-radius: 14px; background: #3A0B14; color: #ffffff; }
  .night-box-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.5; margin-bottom: 0.4rem; }
  .night-box-text { font-size: 15px; line-height: 1.5; opacity: 0.88; }
  .tip-box { margin: 0 1.5rem 0.85rem; padding: 1.1rem; border-radius: 14px; border: 1px solid rgba(58,11,20,.13); background: #fff; }
  .tip-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(58,11,20,.45); margin-bottom: 0.4rem; }
  .tip-text { font-size: 15px; line-height: 1.5; color: #4a4438; }

  .plan-card { background: transparent; border-top: 1px solid rgba(58,11,20,.13); border-radius: 0; padding: 16px 0; margin-bottom: 0; cursor: pointer; transition: all 0.15s; animation: fadeUp 0.3s ease; }
  .plan-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); transform: translateY(-1px); }
  .plan-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
  .plan-card-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 1rem; color: #3A0B14; line-height: 1.2; }
  .plan-card-date { font-size: 11px; color: rgba(58,11,20,.45); }
  .plan-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.5rem; }
  .plan-tag { font-size: 11px; padding: 2px 8px; border-radius: 8px; background: #BAD2E8; color: #3A0B14; }
  .plan-tag.teal { background: #E3EDF6; color: #7A1E33; }
  .empty-state { text-align: center; padding: 3rem 2rem; }
  .empty-icon { width: 56px; height: 56px; border-radius: 11px; background: #F1EDE4; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem; }
  .empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .empty-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.15rem; color: #3A0B14; margin-bottom: 0.35rem; }
  .empty-sub { font-size: 15px; color: rgba(58,11,20,.45); line-height: 1.5; margin-bottom: 1.25rem; max-width: 260px; margin-left: auto; margin-right: auto; }

  .filter-row { display: flex; gap: 8px; overflow-x: auto; padding: 0 1.5rem 1rem; scrollbar-width: none; }
  .filter-row::-webkit-scrollbar { display: none; }
  .filter-chip { padding: 8px 15px; border-radius: 8px; border: 1px solid rgba(58,11,20,.16); font-family: 'Instrument Serif', Georgia, serif; font-size: 16px; cursor: pointer; background: transparent; color: rgba(58,11,20,.5); white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
  .filter-chip.sel { background: #3A0B14; color: #fff; border-color: #3A0B14; }

  .event-card { border-radius: 14px; overflow: hidden; margin-bottom: 10px; cursor: pointer; transition: transform 0.15s; animation: fadeUp 0.3s ease; }
  .event-card:hover { transform: translateY(-2px); }
  .event-card-img { height: 140px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .event-card-emoji { font-size: 3.5rem; }
  .event-card-body { background: #fff; padding: 1rem; border: 1px solid rgba(58,11,20,.13); border-top: none; border-radius: 0 0 16px 16px; }
  .event-card-cat { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .event-card-name { font-family: 'Instrument Serif', Georgia, serif; font-size: 1rem; color: #3A0B14; margin-bottom: 4px; line-height: 1.2; }
  .event-card-venue { font-size: 12px; color: rgba(58,11,20,.45); margin-bottom: 6px; }
  .event-card-row { display: flex; align-items: center; justify-content: space-between; }
  .event-card-date { font-size: 11px; color: rgba(58,11,20,.55); }
  .event-card-price { font-size: 11px; font-weight: 500; color: #7A1E33; }
  .events-loading { text-align: center; padding: 3rem 1.5rem; color: rgba(58,11,20,.45); font-size: 15px; }
  .api-note { background: #F1EDE4; border-radius: 14px; padding: 1rem; margin: 0 1.5rem 1rem; font-size: 12px; color: rgba(58,11,20,.55); line-height: 1.5; border-left: 3px solid #7A1E33; }

  .social-wrap { padding: 1.5rem; }
  .social-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(58,11,20,.45); margin-bottom: 0.75rem; font-weight: 500; }
  .social-card { border: 1px solid rgba(58,11,20,.13); border-radius: 14px; background: #fff; overflow: hidden; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .social-card-top { padding: 1rem; border-bottom: 1px solid rgba(58,11,20,.13); }
  .social-card-title { font-size: 16px; font-weight: 500; color: #3A0B14; margin-bottom: 3px; }
  .social-card-sub { font-size: 12px; color: rgba(58,11,20,.45); line-height: 1.4; }
  .feat-row { display: flex; align-items: flex-start; gap: 10px; padding: 0.85rem 1rem; border-bottom: 1px solid rgba(58,11,20,.13); }
  .feat-row:last-child { border-bottom: none; }
  .feat-icon { width: 34px; height: 34px; border-radius: 11px; background: #F1EDE4; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
  .feat-body { flex: 1; }
  .feat-title { font-size: 15px; font-weight: 500; color: #3A0B14; margin-bottom: 2px; }
  .feat-sub { font-size: 12px; color: rgba(58,11,20,.45); line-height: 1.35; }
  .feat-badge { display: inline-block; font-size: 11px; padding: 2px 7px; border-radius: 8px; margin-top: 4px; background: #F1EDE4; color: #8b7355; }
  .feat-badge.live { background: #E3EDF6; color: #7A1E33; }

  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #3A0B14; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 15px; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
  .toast.show { opacity: 1; }
  .err { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 14px; background: #fdf0ef; border: 1px solid #f5d0cc; color: #c0392b; font-size: 15px; line-height: 1.4; }
  .success { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 14px; background: #E3EDF6; border: 1px solid #7A1E33; color: #7A1E33; font-size: 15px; line-height: 1.4; }

  /* ── TIKTOK PARSER ── */
  .parser-wrap { padding: 1.5rem; }
  .input-group { margin-bottom: 1rem; }
  .input-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(58,11,20,.45); display: block; margin-bottom: 6px; font-weight: 500; }
  .input-field { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1.5px solid rgba(58,11,20,.18); background: #fff; color: #3A0B14; font-size: 16px; transition: border-color 0.15s; }
  .input-field:focus { outline: none; border-color: #7A1E33; }
  .input-field::placeholder { color: #c0b8ad; }
  textarea.input-field { min-height: 100px; resize: vertical; }
  .preview-card { border: 1px solid rgba(58,11,20,.13); border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); animation: fadeUp 0.3s ease; }
  .preview-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.1rem; color: #3A0B14; margin-bottom: 0.75rem; }
  .preview-field { display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; }
  .preview-key { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(58,11,20,.45); min-width: 80px; padding-top: 2px; font-weight: 500; }
  .preview-val { font-size: 15px; color: #3A0B14; line-height: 1.4; flex: 1; }
  .zone-badge { display: inline-block; padding: 2px 10px; border-radius: 8px; font-size: 11px; font-weight: 500; background: #E3EDF6; color: #7A1E33; }

  /* ── ADMIN ── */
  .admin-card { border: 1px solid rgba(58,11,20,.13); border-radius: 14px; padding: 1rem; margin-bottom: 10px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); animation: fadeUp 0.3s ease; }
  .admin-card-name { font-family: 'Instrument Serif', Georgia, serif; font-size: 1rem; color: #3A0B14; margin-bottom: 4px; }
  .admin-card-meta { font-size: 12px; color: rgba(58,11,20,.45); margin-bottom: 8px; }
  .admin-actions { display: flex; gap: 8px; }
  .btn-approve { flex: 1; padding: 8px; border-radius: 8px; border: none; background: #3A0B14; color: #fff; font-size: 13px; cursor: pointer; font-weight: 500; }
  .btn-reject { flex: 1; padding: 8px; border-radius: 8px; border: 1.5px solid rgba(58,11,20,.18); background: transparent; color: rgba(58,11,20,.45); font-size: 13px; cursor: pointer; }
  .zone-select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1.5px solid rgba(58,11,20,.18); background: #fff; color: #3A0B14; font-size: 15px; margin-bottom: 8px; }

  /* ── PREFERENCES ── */
  .pref-wrap { padding: 1.5rem; }
  .pref-chip { padding: 8px 14px; border-radius: 8px; border: 1.5px solid rgba(58,11,20,.18); font-size: 15px; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px; }
  .pref-chip.sel-blue { background: #5A7590; color: #3A0B14; border-color: #5A7590; }
  .pref-chip.sel-yellow { background: #F0EAC8; color: #3A0B14; border-color: #F0EAC8; }
  .pref-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.25rem; }

  @keyframes shimmer { 0%{background-position:-200px 0} 100%{background-position:calc(200px + 100%) 0} }
  .skel { background: linear-gradient(90deg, #F1EDE4 25%, #ede7db 37%, #F1EDE4 63%); background-size: 200px 100%; animation: shimmer 1.4s ease infinite; border-radius: 14px; }
  .skel-card { height: 200px; border-radius: 14px; margin-bottom: 14px; }
  .skel-line { height: 14px; margin-bottom: 10px; border-radius: 6px; }
  .skel-line.w60 { width: 60%; }
  .skel-line.w40 { width: 40%; }
  .skel-line.w80 { width: 80%; }
  .skel-circle { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
  .skel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 0 1.5rem; }
  .skel-grid .skel-card { height: 160px; }

  .profile-btn { position: fixed; top: max(12px, env(safe-area-inset-top)); right: 22px; z-index: 90; width: 36px; height: 36px; border-radius: 50%; border: none; background: #3A0B14; color: #FAF7F2; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; transition: transform 0.12s; font-weight: 600; font-size: 15px; }
  .profile-btn:active { transform: scale(0.9); }
  .profile-btn img { width: 100%; height: 100%; object-fit: cover; }
  .me-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.42); z-index: 1100; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s; }
  .me-sheet { width: 100%; max-width: 420px; background: #fff; border-radius: 22px 22px 0 0; max-height: 88vh; overflow-y: auto; animation: cardIn 0.25s ease; padding-bottom: env(safe-area-inset-bottom); }
`;

function useDragDismiss(onClose) {
  const sheetRef = useRef(null);
  const scrimRef = useRef(null);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    let startY = 0, currentY = 0, dragging = false;
    let startX = 0;
    const onStart = (e) => {
      if (el.scrollTop > 5) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      currentY = startY;
      dragging = true;
      el.style.transition = "none";
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = e.touches[0].clientY - startY;
      if (dx > Math.abs(dy)) { dragging = false; return; }
      currentY = e.touches[0].clientY;
      if (dy > 0) {
        e.preventDefault();
        el.style.transform = `translateY(${dy}px)`;
        if (scrimRef.current) scrimRef.current.style.background = `rgba(0,0,0,${Math.max(0, 0.42 - dy / 600)})`;
      }
    };
    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      const dy = currentY - startY;
      el.style.transition = "transform 0.25s ease";
      if (dy > 120) {
        el.style.transform = "translateY(100%)";
        if (scrimRef.current) { scrimRef.current.style.transition = "background 0.25s ease"; scrimRef.current.style.background = "rgba(0,0,0,0)"; }
        setTimeout(onClose, 250);
      } else {
        el.style.transform = "translateY(0)";
        if (scrimRef.current) { scrimRef.current.style.transition = "background 0.25s ease"; scrimRef.current.style.background = "rgba(0,0,0,0.42)"; }
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchmove", onMove); el.removeEventListener("touchend", onEnd); };
  }, [onClose]);
  return { sheetRef, scrimRef };
}

function useSwipeRight(onBack) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0, startY = 0, dragging = false;
    const onStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      if (startX < 40) { dragging = true; el.style.transition = "none"; }
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > 60) { dragging = false; el.style.transform = ""; return; }
      if (dx > 0) el.style.transform = `translateX(${dx}px)`;
    };
    const onEnd = (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.changedTouches[0].clientX - startX;
      el.style.transition = "transform 0.25s ease";
      if (dx > 100) {
        el.style.transform = "translateX(110%)";
        setTimeout(onBack, 250);
      } else {
        el.style.transform = "translateX(0)";
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchmove", onMove); el.removeEventListener("touchend", onEnd); };
  }, [onBack]);
  return ref;
}

function DraggableSheet({ onClose, maxHeight = "95vh", children }) {
  const { sheetRef, scrimRef } = useDragDismiss(onClose);
  return (
    <div ref={scrimRef} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 1200, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s" }}>
      <div ref={sheetRef} style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "22px 22px 0 0", maxHeight, overflowY: "auto", animation: "cardIn 0.25s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0" }}><div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(58,11,20,.18)" }} /></div>
        {children}
      </div>
    </div>
  );
}

// ── MOCK EVENTS ───────────────────────────────────────────────

// ── COMPONENTS ────────────────────────────────────────────────

function SkeletonCards({ count = 4 }) {
  return (
    <div className="skel-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skel skel-card" />
          <div className="skel skel-line w60" />
          <div className="skel skel-line w40" />
        </div>
      ))}
    </div>
  );
}
function SkeletonList({ count = 3 }) {
  return (
    <div style={{ padding: "0 1.5rem" }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div className="skel skel-circle" />
          <div style={{ flex: 1 }}>
            <div className="skel skel-line w80" />
            <div className="skel skel-line w60" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
          <path fill="#7A7A45" d="M20 2 C20 2 22 14 28 20 C22 26 20 38 20 38 C20 38 18 26 12 20 C18 14 20 2 20 2Z M2 20 C2 20 14 22 20 28 C26 22 38 20 38 20 C38 20 26 18 20 12 C14 18 2 20 2 20Z" />
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
            <div style={{ width: 36, height: 36, borderRadius: 11, background: i === 0 ? "#7A1E33" : i === 1 ? "#7A7A45" : "#3A0B14", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1rem", flexShrink: 0, fontWeight: 700 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#3A0B14", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", lineHeight: 1.45 }}>{desc}</div>
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
    loadCdnCss('leaflet-css');

    if (window.L) {
      setLoaded(true);
      return;
    }

    loadCdnScript('leaflet-js').then(() => setLoaded(true)).catch(() => {});
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
      html: '<div style="width:28px;height:28px;background:#3A0B14;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
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
        <div style={{ fontSize: 11, color: "rgba(58,11,20,.55)", marginBottom: "8px", lineHeight: 1.5 }}>
          Tap anywhere on the map to drop a pin. We'll find venues within 1.5km.
        </div>
      )}

      {!loaded && (
        <div style={{ height: mapHeight, background: "#F1EDE4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(58,11,20,.45)", fontSize: 15 }}>
          Loading map...
        </div>
      )}

      <div
        ref={mapRef}
        style={{ height: mapHeight, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(58,11,20,.18)", display: loaded ? "block" : "none", transition: "height 0.3s ease" }}
      />

      {currentPin && (
        <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#7A1E33", display: "flex", alignItems: "center", gap: 4 }}>
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
                <button key={opt.value} className={`chip ${sel ? "sel" : ""}`}
                  onClick={() => { onToggle(q.id, opt.value, q.multi); if (!q.multi && opt.value !== "map_pin") { setAreaSearch(""); setAreaMatches([]); setTimeout(onNext, 200); } }}
                  >
                    <LineIcon name={OPTION_ICONS[`${q.id}:${opt.value}`] || OPTION_ICONS[opt.value] || "sparkle"} size={15} />{opt.label}
                </button>
              );
            })}
          </div>
          {isAreaStep && (
            <div style={{ marginTop: "1rem", position: "relative" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(58,11,20,.45)", marginBottom: "6px", fontWeight: 500 }}>Or search a specific neighbourhood</div>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Shoreditch, Peckham, Maida Vale..."
                value={areaSearch}
                onChange={e => handleAreaSearch(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              {areaMatches.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid rgba(58,11,20,.18)", borderRadius: 14, zIndex: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginTop: 4 }}>
                  {areaMatches.map(area => (
                    <div key={area} onClick={() => selectNeighbourhood(area)}
                      style={{ padding: "10px 14px", fontSize: 15, color: "#3A0B14", cursor: "pointer", borderBottom: "1px solid rgba(58,11,20,.13)" }}
                      onMouseEnter={e => e.target.style.background = "#F1EDE4"}
                      onMouseLeave={e => e.target.style.background = "#fff"}>
                      📍 {area}
                    </div>
                  ))}
                </div>
              )}
              {ans.area && !q.options.find(o => o.value === ans.area) && (
                <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#7A1E33" }}>✦ Selected: {ans.area}</div>
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
            <div style={{ fontSize: 13, color: "rgba(58,11,20,.55)", marginBottom: 6 }}>Anything else? <span style={{ color: "rgba(58,11,20,.45)" }}>(optional)</span></div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. somewhere with a nice terrace, no chains, dog-friendly..."
              value={ans.freeText || ""}
              onChange={(e) => onToggle("freeText", e.target.value, false)}
              style={{ padding: "11px 14px", fontSize: 15 }}
            />
          </div>
          <button className="btn btn-teal" style={{ marginTop: "1.25rem" }} onClick={onGenerate}>Generate my plan ✦</button>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ planId, planSource, result, times, ans, onRestart, onNewPlan, dbVenues, onUpdateResult, onShare, onRate, onSchedule, scheduledDate }) {
  const [view, setView] = useState("plan");
  const [shareId] = useState(generateShareToken);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const mpEdits = useRef(0);
  const mpPid = planId || shareId;
  useEffect(() => { mp("plan_viewed", { plan_id: mpPid, plan_source: planSource || "generated", device_os: deviceType() }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mpShare = (channel) => {
    mp("plan_shared", { plan_id: mpPid, share_id: shareId, share_channel: channel, plan_share_origin: "shared_from_plan_view", share_recipient_type: "public_link" });
    mp("plan_edited_saved_or_shared", { plan_id: mpPid, action: "shared", share_channel: channel });
  };
  const mpEdit = (edit_type) => { mpEdits.current += 1; mp("plan_edited_saved_or_shared", { plan_id: mpPid, action: "edited", edit_count: mpEdits.current, edit_type }); };

  // Persist the plan so anyone with the link can view it. `owner` is required by
  // RLS now, so only the creator can overwrite a share once it exists.
  async function ensureShared() {
    setSharing(true);
    try {
      const uid = (await supabase.auth.getUser()).data?.user?.id || null;
      await supabase.from("shared_plans").upsert({ id: shareId, owner: uid, plan: result, times, title: result?.title || "Curated plan" }, { onConflict: "id" });
    } catch (e) { console.error("[share]", e); }
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

    if (candidates.length === 0) {
      setSwappingIdx(stopIdx);
      setAlternatives([]);
      return;
    }
    // If already swapping this stop, cycle to the next alternative
    if (swappingIdx === stopIdx && alternatives.length > 0) {
      const curName = result.stops[stopIdx].name.toLowerCase();
      const curIdx = alternatives.findIndex(a => a.name.toLowerCase() === curName);
      const nextIdx = (curIdx + 1) % alternatives.length;
      swapVenue(alternatives[nextIdx], true);
      return;
    }
    setAlternatives(candidates);
    setSwappingIdx(stopIdx);
    swapVenue(candidates[0], true);
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

  async function swapVenue(alt, keepCycling) {
    const idx = swappingIdx;
    const newStops = [...result.stops];
    newStops[idx] = {
      ...newStops[idx],
      name: alt.name,
      emoji: alt.emoji,
      type: alt.type,
      hook: alt.desc,
      google_rating: alt.google_rating,
      price_range: alt.price,
      celebrity_tags: alt.celebrity_tags,
    };
    const newTotal = recalcTotalCost(newStops);
    mpEdit("swap_place");
    onUpdateResult({ ...result, stops: newStops, ...(newTotal ? { total_cost_estimate: newTotal } : {}) });
    if (!keepCycling) { setSwappingIdx(null); setAlternatives([]); }
    const withTravel = await recalcTravel(newStops);
    onUpdateResult({ ...result, stops: withTravel, ...(newTotal ? { total_cost_estimate: newTotal } : {}) });
  }

  async function removeStop(idx) {
    const newStops = result.stops.filter((_, i) => i !== idx);
    const newTotal = recalcTotalCost(newStops);
    mpEdit("remove_place");
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
        {result._fewerStops && <div style={{ fontSize: 12, color: "rgba(58,11,20,.45)", marginTop: 4 }}>{result._fewerStops}</div>}
        <div className="result-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><LineIcon name="pound" size={13} />{result.total_cost_estimate}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><LineIcon name="clock" size={13} />{times.start}–{times.end}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><LineIcon name="pin" size={13} />{(ans.area || "").replace(/_/g, " ")}</span>
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
          <div style={{ padding: "0 22px" }}>
            {(result.stops || []).map((stop, idx) => (
              <div key={idx + "-" + stop.name}>
                <div className="stop" style={{ animation: swappingIdx === idx ? "cardSwap 0.25s ease" : undefined }}>
                  {(() => {
                    const open = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + " London")}`, "_blank");
                    const photo = stop.photo_url || (dbVenues || []).find(x => x.name && x.name.toLowerCase() === String(stop.name || "").toLowerCase())?.photo_url;
                    const rating = stop.google_rating && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 700 }}><svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d={LINE_ICONS.star} fill={photo ? "#BAD2E8" : "#7A1E33"} /></svg>{stop.google_rating}</span>;
                    if (photo) return (
                      <div onClick={open} style={{ cursor: "pointer" }}>
                        {/* 16:9 photo with the time, type and rating on it (spec: plan result) */}
                        <div style={{ position: "relative", height: 200, background: "#F1EDE4" }}>
                          <img src={photo} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.78))" }} />
                          <span style={{ position: "absolute", top: 12, left: 12, width: 36, height: 36, borderRadius: 11, background: "rgba(250,247,242,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}><LineIcon name={stopIconName(stop.type)} size={19} color="#3A0B14" /></span>
                          <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#FAF7F2" }}>
                            <span style={{ fontWeight: 700 }}>{stop.time}</span><span>·</span><span>{stop.type}</span>{rating && <><span>·</span>{rating}</>}
                          </div>
                        </div>
                        <div style={{ padding: "12px 16px 6px" }}>
                          <div className="stop-name" style={{ fontSize: 24 }}>{stop.name}</div>
                          <div className="stop-hook">{stop.hook}</div>
                        </div>
                      </div>
                    );
                    return (
                      <div className="stop-inner" onClick={open} style={{ cursor: "pointer" }}>
                        <div className="stop-top">
                          <div className="stop-emoji-wrap"><LineIcon name={stopIconName(stop.type)} size={22} color="#3A0B14" /></div>
                          <div className="stop-body">
                            <div className="stop-meta">
                              <span className="stop-time">{stop.time}</span>
                              <span className="stop-dot" />
                              <span className="stop-type">{stop.type}</span>
                              {rating && <><span className="stop-dot" /><span style={{ fontSize: 11, color: "#3A0B14" }}>{rating}</span></>}
                            </div>
                            <div className="stop-name">{stop.name}</div>
                            <div className="stop-hook">{stop.hook}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="stop-footer">
                    <div className="stop-pills-row">
                      {stop.price_range && <span className="stop-pill">{stop.price_range}</span>}
                      {stop.area && <span className="stop-pill">{stop.area}</span>}
                    </div>
                    <button onClick={() => findAlternatives(idx)} style={{ border: "none", background: "#3A0B14", color: "#BAD2E8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: "5px 12px", borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap" }}>↻ Swap</button>
                  </div>
                </div>
                {stop.travel_to_next && idx < (result.stops || []).length - 1 && (
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "#7A1E33", padding: "4px 0 10px", marginLeft: 22 }}>{stop.travel_to_next}</div>
                )}
              </div>
            ))}
          </div>
          {result.extend_the_night && <div className="night-box"><div className="night-box-label">Extend the night</div><div className="night-box-text">{result.extend_the_night}</div></div>}
          {result.local_tip && <div className="tip-box"><div className="tip-label">Local tip</div><div className="tip-text">{result.local_tip}</div></div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, padding: "20px 22px 0" }}>
            {onSchedule && <button onClick={() => onSchedule(new Date().toISOString().slice(0, 10))} style={{ padding: 14, background: "#3A0B14", color: "#BAD2E8", border: "none", textAlign: "center", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Schedule this plan</button>}
            {onShare && <button onClick={() => onShare({ kind: "plan", title: result.title || "Curated plan", payload: { plan: result, times } })} style={{ padding: 14, border: "1px solid #7A1E33", background: "none", color: "#7A1E33", textAlign: "center", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Share with friends</button>}
          </div>
          <div style={{ padding: "9px 22px 0" }}>
            <button style={{ width: "100%", padding: 14, border: "1px solid rgba(58,11,20,.16)", background: "none", textAlign: "center", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 9 }}>Swap a stop</button>
            {onRate && <button onClick={onRate} style={{ width: "100%", padding: 14, background: "none", border: "none", textAlign: "center", fontSize: 13, fontWeight: 600, color: "rgba(58,11,20,.5)", textDecoration: "underline", cursor: "pointer" }}>Rate this night</button>}
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
              <button className="btn-outline" style={{ marginTop: 0 }} disabled={sharing} onClick={async () => { await ensureShared(); navigator.clipboard?.writeText(shareLink); mpShare("web_link"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                <LineIcon name="link" size={15} />{copied ? "Copied" : "Copy link"}
              </button>
              <button className="btn-outline" style={{ marginTop: 0 }} disabled={sharing} onClick={async () => { await ensureShared(); mpShare("other"); window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this Curated plan: ${shareLink}`)}`); }}>
                <LineIcon name="chat" size={15} />WhatsApp
              </button>
              {onShare && <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => onShare({ kind: "plan", title: result?.title || "An itinerary", payload: { plan: result, times } })}><LineIcon name="user" size={15} />A friend</button>}
            </div>
          </div>

          {onSchedule && (
            <>
              <div className="social-section-title" style={{ marginTop: 16 }}>Add to your calendar</div>
              <div className="social-card">
                <div style={{ padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, position: "relative", cursor: "pointer", background: "#3A0B14", color: "#fff", borderRadius: 14, padding: "12px 14px", fontSize: 15, fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><LineIcon name="calendar" size={16} />{scheduledDate ? `Planned for ${new Date(scheduledDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" })}` : "Pick a date for this plan"}</span>
                    <span style={{ opacity: 0.85 }}>{scheduledDate ? "Change" : "Choose ›"}</span>
                    <input type="date" value={scheduledDate || ""} onChange={(e) => e.target.value && onSchedule(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                  </label>
                  {scheduledDate && (() => {
                    const d = scheduledDate.replace(/-/g, ""); const endD = new Date(scheduledDate); endD.setDate(endD.getDate() + 1); const en = endD.toISOString().slice(0, 10).replace(/-/g, "");
                    const details = (result.stops || []).map(s => `${s.time || ""} ${s.name}`).join("\n");
                    const href = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: result.title || "Curated plan", dates: `${d}/${en}`, details }).toString()}`;
                    return <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#7A1E33", fontWeight: 600, textAlign: "center" }}>+ Also add to Google Calendar (with reminder)</a>;
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

function MyPlansScreen({ plans, onViewPlan, onNewPlan, onBarCrawl, onSchedule, dbVenues }) {
  const photoFor = (name) => { if (!name || !dbVenues) return null; const v = dbVenues.find(x => x.name && x.name.toLowerCase() === String(name).toLowerCase()); return v?.photo_url || null; };
  const upcoming = plans.filter(p => p.scheduledDate).length;
  const shared = plans.filter(p => p.ans?.savedVenues?.length).length;
  const summary = [upcoming && `${upcoming} upcoming`, shared && `${shared} shared`, plans.filter(p => !p.scheduledDate).length && `${plans.filter(p => !p.scheduledDate).length} draft`].filter(Boolean).join(" · ") || `${plans.length} plan${plans.length !== 1 ? "s" : ""}`;

  if (plans.length === 0) return (
    <div style={{ animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)", minHeight: "70vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 22px 4px" }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#7A1E33" }}>Plans<span style={{ color: "#BAD2E8" }}>.</span></div>
      </div>
      {/* No plans yet: the New plan button sits in the centre of the page */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "0 32px", textAlign: "center" }}>
        <div className="empty-icon"><LineIcon name="map" size={40} color="#7A1E33" /></div>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 1.1 }}>No plans yet</div>
        <div style={{ fontSize: 15, color: "rgba(58,11,20,.55)", lineHeight: 1.5, maxWidth: 280 }}>Answer 5 quick questions and get a personalised London itinerary.</div>
        <button data-tour="plan-cta" onClick={onNewPlan} style={{ marginTop: 8, padding: "15px 28px", background: "#3A0B14", color: "#BAD2E8", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>+ New plan</button>
        {onBarCrawl && <button onClick={onBarCrawl} style={{ padding: "11px 20px", border: "1.5px solid #7A1E33", color: "#7A1E33", background: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>+ Bar crawl</button>}
      </div>
    </div>
  );
  return (
    <div style={{ animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
      <div style={{ padding: "0 22px 4px" }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#7A1E33" }}>Plans<span style={{ color: "#BAD2E8" }}>.</span></div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 10 }}>
          <button data-tour="plan-cta" onClick={onNewPlan} style={{ padding: "9px 14px", background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>+ New plan</button>
          {onBarCrawl && <button onClick={onBarCrawl} style={{ padding: "9px 14px", border: "1px solid #7A1E33", color: "#7A1E33", background: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>+ Bar crawl</button>}
        </div>
      </div>
      <div style={{ padding: "0 22px 20px", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.42)" }}>{summary}</div>
      <div style={{ padding: "0 22px" }}>
        {plans.map((plan, i) => {
          const stops = plan.result.stops || [];
          const cover = stops.map(s => s.photo_url || photoFor(s.name)).find(Boolean);
          const tint = plan.scheduledDate ? "#7A1E33" : plan.ans?._barCrawl ? "#7A1E33" : "rgba(58,11,20,.35)";
          const tag = plan.scheduledDate ? `Scheduled ${new Date(plan.scheduledDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : plan.ans?._barCrawl ? "Bar crawl" : "Draft";
          return (
            <div key={i} onClick={() => onViewPlan(plan)} style={{ marginBottom: 16, cursor: "pointer", overflow: "hidden" }}>
              <div style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 14, overflow: "hidden", background: cover ? "#3A0B14" : "linear-gradient(135deg, #3A0B14, #7A1E33)" }}>
                {cover && <img src={cover} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))" }} />
                <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 8, background: tint, color: "#FAF7F2", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{tag}</div>
                <div style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, color: "#FAF7F2", lineHeight: 1.05 }}>{plan.result.title}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(250,247,242,.68)", marginTop: 6 }}>{stops.length} stop{stops.length !== 1 ? "s" : ""} · {plan.savedAt}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanDetailView({ plan, onClose, onNewPlan, dbVenues, onUpdateResult, onShare, onRate, onSchedule }) {
  const swipeRef = useSwipeRight(onClose);
  return (
    <div ref={swipeRef} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#FAF7F2", overflowY: "auto", animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#FAF7F2", padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(58,11,20,.1)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, border: "1px solid rgba(58,11,20,.18)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>←</button>
        <div style={{ flex: 1, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{plan.result?.title || "Your plan"}</div>
      </div>
      <ResultScreen planId={plan.id} planSource="my_plans" result={plan.result} times={plan.times} ans={plan.ans} onRestart={onClose} onNewPlan={onNewPlan} dbVenues={dbVenues} onUpdateResult={onUpdateResult} onShare={onShare} onRate={onRate} scheduledDate={plan.scheduledDate} onSchedule={onSchedule} />
    </div>
  );
}

function SwipeDeck({ venues, preferences, onClose, onSave, onOpenSpot }) {
  const [deck, setDeck] = useState(() => [...venues]);
  const [gone, setGone] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const dragRef = useRef(null);
  const startRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const hiResCache = useRef({});
  const [hiResPhotos, setHiResPhotos] = useState({});

  const [flipped, setFlipped] = useState(false);
  const current = deck[0];
  const next = deck[1];

  useEffect(() => {
    setFlipped(false);
    if (dragRef.current) {
      dragRef.current.style.transform = "";
      dragRef.current.style.transition = "";
    }
  }, [current?.id]);
  useEffect(() => {
    [current, next].filter(Boolean).forEach(v => {
      if (!v.google_place_id || hiResCache.current[v.id]) return;
      hiResCache.current[v.id] = true;
      fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "photos", place_id: v.google_place_id }) })
        .then(r => r.json()).then(j => { if (j.found && j.urls?.[0]) setHiResPhotos(prev => ({ ...prev, [v.id]: j.urls[0] })); }).catch(() => {});
    });
  }, [current?.id, next?.id]);

  const photoFor = (v) => hiResPhotos[v.id] || v.photo_url;

  function tasteMatches(v) {
    if (!preferences?.length) return 0;
    const prefs = preferences.map(p => p.toLowerCase());
    let matches = 0;
    if (prefs.includes(v.category)) matches++;
    (v.vibe_tags || []).forEach(t => { if (prefs.some(p => p.includes(t) || t.includes(p))) matches++; });
    if (v.area && prefs.some(p => v.area.toLowerCase().includes(p))) matches++;
    return matches;
  }

  // Button taps: fly the card off and burst a heart (or a cross) before the deck advances.
  const [burst, setBurst] = useState(null);
  const animatingRef = useRef(false);
  function dismissAnimated(dir) {
    if (!current || animatingRef.current) return;
    animatingRef.current = true;
    setBurst(dir === "right" ? "save" : "skip");
    const el = dragRef.current;
    if (el) { el.style.transition = "transform .38s cubic-bezier(.2,.8,.3,1), opacity .38s"; el.style.transform = dir === "right" ? "translateX(480px) rotate(14deg)" : "translateX(-480px) rotate(-14deg)"; el.style.opacity = "0"; }
    setTimeout(() => { dismiss(dir); if (el) { el.style.transition = ""; el.style.transform = ""; el.style.opacity = ""; } setBurst(null); animatingRef.current = false; }, 380);
  }
  function dismiss(dir) {
    if (!current) return;
    const saved = dir === "right";
    haptic(saved ? [8, 20, 8] : 12);
    setGone(prev => [{ venue: current, action: saved ? "save" : "skip" }, ...prev]);
    setDeck(prev => prev.slice(1));
    if (saved) { setSavedCount(n => n + 1); onSave && onSave(current); }
    else setSkippedCount(n => n + 1);
    setLastAction(saved ? "save" : "skip");
  }

  function undo() {
    if (!gone.length) return;
    const last = gone[0];
    setGone(prev => prev.slice(1));
    setDeck(prev => [last.venue, ...prev]);
    if (last.action === "save") setSavedCount(n => Math.max(0, n - 1));
    else setSkippedCount(n => Math.max(0, n - 1));
    setLastAction(null);
  }

  const wasDragRef = useRef(false);
  const thresholdRef = useRef(false);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    posRef.current = { x: 0, y: 0 };
    wasDragRef.current = false;
    thresholdRef.current = false;
  };
  const onTouchMove = (e) => {
    if (!startRef.current || !dragRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    posRef.current = { x: dx, y: dy };
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) wasDragRef.current = true;
    if (Math.abs(dx) > 90 && !thresholdRef.current) { thresholdRef.current = true; haptic(10); }
    if (Math.abs(dx) < 90 && thresholdRef.current) thresholdRef.current = false;
    const rotate = dx * 0.08;
    dragRef.current.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
    dragRef.current.style.transition = "none";
  };
  const onTouchEnd = () => {
    if (!dragRef.current) return;
    const { x } = posRef.current;
    if (Math.abs(x) > 90) {
      const dir = x > 0 ? "right" : "left";
      const flyX = x > 0 ? 500 : -500;
      dragRef.current.style.transition = "transform 0.35s ease";
      dragRef.current.style.transform = `translate(${flyX}px, ${posRef.current.y}px) rotate(${flyX * 0.08}deg)`;
      setTimeout(() => dismiss(dir), 300);
    } else {
      dragRef.current.style.transition = "transform 0.3s cubic-bezier(.2,.9,.3,1)";
      dragRef.current.style.transform = "translate(0,0) rotate(0)";
    }
    startRef.current = null;
  };

  const matches = current ? tasteMatches(current) : 0;

  if (!current) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s" }}>
      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, textAlign: "center", marginBottom: 12 }}>You've seen them all!</div>
      <div style={{ fontSize: 16, color: "rgba(58,11,20,.5)", textAlign: "center", marginBottom: 24 }}>{savedCount} saved · {skippedCount} skipped</div>
      <button onClick={onClose} style={{ padding: "14px 32px", background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Back to Discover</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#FAF7F2", display: "flex", flexDirection: "column", animation: "fadeIn .2s" }}>
      <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", color: "#3A0B14" }}>← Back</button>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, fontStyle: "italic" }}>Discover</div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 22px" }}>
        {next && (
          <div style={{ position: "absolute", width: "calc(100% - 56px)", maxWidth: 360, aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: "#F1EDE4", transform: "scale(0.95) translateY(10px)", opacity: 0.6, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
            {photoFor(next) && <img src={photoFor(next)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
        )}

        <div ref={dragRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ position: "relative", width: "100%", maxWidth: 360, aspectRatio: "3/4", perspective: 1000, cursor: "grab", touchAction: "none" }}>
          {burst && (
            <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ animation: "heartBurst .6s ease-out forwards" }}>
                {burst === "save"
                  ? <svg width="140" height="140" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="#7A1E33" stroke="#FAF7F2" strokeWidth="1" /></svg>
                  : <svg width="120" height="120" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#FAF7F2" strokeWidth="2.5" strokeLinecap="round" /></svg>}
              </div>
            </div>
          )}
          <div onClick={() => { if (!wasDragRef.current) setFlipped(f => !f); }} style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform 0.5s ease", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}>
            {/* Front face */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 16, overflow: "hidden", background: "#F1EDE4", boxShadow: "0 8px 32px rgba(0,0,0,.12)" }}>
              {photoFor(current) && <img src={photoFor(current)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(58,11,20,.88))" }} />
              {matches > 0 && (
                <div style={{ position: "absolute", top: 16, right: 16, padding: "6px 12px", background: "rgba(15,107,99,.85)", color: "#FAF7F2", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(8px)", pointerEvents: "none" }}>
                  ✓ {matches} taste match{matches > 1 ? "es" : ""}
                </div>
              )}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 22px 22px", pointerEvents: "none" }}>
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(250,247,242,.6)", marginBottom: 6 }}>{[current.category?.toUpperCase(), current.area?.toUpperCase()].filter(Boolean).join(" · ")}</div>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, lineHeight: 1, color: "#FAF7F2", marginBottom: 6 }}>{current.name}</div>
                <div style={{ fontSize: 12, color: "rgba(250,247,242,.6)", display: "flex", alignItems: "center", gap: 4 }}>
                  {current.google_rating && <><span style={{ color: "#D4CFC4" }}>★</span> <span>{current.google_rating}</span></>}
                  {current.google_rating && current.price && <span style={{ margin: "0 2px" }}>·</span>}
                  {current.price && <span>{priceToPounds(current.price)}</span>}
                </div>
                {current.comment && <div style={{ fontSize: 15, lineHeight: 1.4, color: "rgba(250,247,242,.7)", marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{current.comment}</div>}
              </div>
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(250,247,242,.35)", pointerEvents: "none" }}>tap to flip</div>
            </div>
            {/* Back face — reviews */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 16, overflow: "hidden", background: "#FAF7F2", boxShadow: "0 8px 32px rgba(0,0,0,.12)", padding: "24px 20px", overflowY: "auto" }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, fontStyle: "italic", marginBottom: 4 }}>{current.name}</div>
              <div style={{ fontSize: 12, color: "rgba(58,11,20,.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>{[current.area, priceToPounds(current.price)].filter(Boolean).join(" · ")}{current.google_rating ? ` · ★ ${current.google_rating}` : ""}</div>
              {current.comment && <div style={{ fontSize: 15, lineHeight: 1.5, color: "rgba(58,11,20,.55)", marginBottom: 16, padding: "12px 14px", background: "#F1EDE4", borderRadius: 10 }}>{current.comment.endsWith(".") ? current.comment : current.comment + "."}</div>}
              {current.google_review_count > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(58,11,20,.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{current.google_review_count} Google reviews</div>}
              {current.vibe_tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {sortTags(current.vibe_tags).map((t, i) => <span key={i} style={tagStyle(t, { padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.12)", fontSize: 12, color: "rgba(58,11,20,.55)" })}>{tagLabel(t)}</span>)}
                </div>
              )}
              {current.address && <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}><span style={{ color: "rgba(58,11,20,.3)", flexShrink: 0 }}>📍</span> {current.address}</div>}
              {current.website && <a href={current.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#7A1E33", fontWeight: 500 }}>Visit website →</a>}
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(58,11,20,.3)" }}>tap to flip back</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 0 36px", display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
        <button onClick={() => dismissAnimated("left")} style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid #7A1E33", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, cursor: "pointer", color: "#7A1E33", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>✕</button>
        <button onClick={undo} disabled={!gone.length} style={{ width: 42, height: 42, borderRadius: "50%", border: "1.5px solid rgba(58,11,20,.15)", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: gone.length ? "pointer" : "default", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={gone.length ? "#3A0B14" : "rgba(58,11,20,.2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h13a4 4 0 010 8H7"/><path d="M7 6L3 10l4 4"/></svg>
        </button>
        <button onClick={() => dismissAnimated("right")} style={{ width: 60, height: 60, borderRadius: "50%", border: "none", background: "#3A0B14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, cursor: "pointer", color: "#BAD2E8", boxShadow: "0 4px 12px rgba(217,65,43,.25)" }}>♥</button>
      </div>

      <div style={{ textAlign: "center", paddingBottom: 16, fontSize: 13, color: "rgba(58,11,20,.4)" }}>{savedCount} saved · {skippedCount} skipped · drag the card or tap to decide</div>
    </div>
  );
}

// "Top Pick" = editor's pick, stored as the 'top_pick' vibe tag. Shown first, in red.
const isTopPick = (v) => (v?.vibe_tags || []).includes("top_pick");
const sortTags = (tags) => [...(tags || [])].sort((a, b) => (b === "top_pick") - (a === "top_pick"));
const tagLabel = (t) => t === "top_pick" ? "Top Pick" : String(t).replace(/_/g, " ");
const tagStyle = (t, base) => t === "top_pick" ? { ...base, background: "#7A1E33", color: "#BAD2E8", border: "none", fontWeight: 600 } : base;
const TopPickBadge = ({ style }) => <span style={{ display: "inline-block", padding: "3px 8px", background: "#7A1E33", color: "#BAD2E8", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 8, verticalAlign: "middle", ...style }}>Top Pick</span>;

function priceToPounds(p) {
  if (!p) return null;
  const s = String(p).toLowerCase();
  if (/free|£0/i.test(s)) return "FREE";
  if (/high|£££|expensive|premium|splurge|£[4-9]\d|£[1-9]\d\d/i.test(s)) return "£££";
  if (/mid|££|moderate|£[2-3]\d/i.test(s)) return "££";
  if (/low|£$|budget|cheap|under|£[0-1]?\d(?!\d)/i.test(s)) return "£";
  const count = (s.match(/£/g) || []).length;
  if (count >= 3) return "£££";
  if (count === 2) return "££";
  if (count === 1) return "£";
  return p;
}

// 4:5 photo card used by the Discover rows, Saves and the feed. Name on the photo over a
// soft gradient; the only badge is Top pick (spec rule 8). Photos lazy-load and fade in.
function PhotoCard({ v, width = 280, height = 350, onClick, badge, meta, nameSize = 26, style, children }) {
  const pounds = priceToPounds(v.price);
  const line = meta !== undefined ? meta : [v.area, pounds].filter(Boolean).join(" · ");
  const b = badge !== undefined ? badge : (isTopPick(v) ? "Top pick" : null);
  return (
    <div onClick={onClick} style={{ flex: "none", width, height, position: "relative", overflow: "hidden", borderRadius: 14, background: "#F1EDE4", cursor: onClick ? "pointer" : "default", scrollSnapAlign: "start", ...style }}>
      {v.photo_url && <img src={v.photo_url} alt="" loading="lazy" decoding="async" onLoad={e => { e.currentTarget.style.opacity = 1; }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0, transition: "opacity .3s ease" }} />}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))", pointerEvents: "none" }} />
      {b && <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 8, background: "#7A1E33", color: "#BAD2E8", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{b}</div>}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, pointerEvents: "none" }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: nameSize, lineHeight: 1.05, color: "#FAF7F2" }}>{v.name}</div>
        {line && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E9E4DA", marginTop: 5 }}>{line}</div>}
      </div>
      {children}
    </div>
  );
}

function DiscoverScreen({ preferences, dbVenues: allVenues, onStart, onOpenSpot, savedKeys, onSave }) {
  // Hide places you've already saved, so each slot is filled by the next best one.
  const dbVenues = savedKeys?.size ? allVenues.filter(v => !savedKeys.has(feedKey(v))) : allVenues;
  const [chip, setChip] = useState("All");
  const [swipeDeck, setSwipeDeck] = useState(false);
  const mpSeen = useRef(new Set());
  const mpSurfaceOnce = (surface, count) => { if (!count || mpSeen.current.has(surface)) return; mpSeen.current.add(surface); mp("discover_impression", { discover_surface: surface, deck_card_count_viewed: count, algorithm_variant: "taste_v1" }); };
  const openSpot = (v, surface, position) => {
    mp("discover_venue_opened", { discover_surface: surface, save_type: saveType(v?.category), position_in_surface: position, algorithm_variant: "taste_v1" });
    onOpenSpot && onOpenSpot(v, { surface, position });
  };
  const CHIPS = ["All", "East", "Date night", "Cheap eats", "Bars", "Restaurants", "Cafés", "Culture", "Outdoors", "Markets", "Celebrity picks"];

  const today = new Date().toISOString().split("T")[0];
  const dayName = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  // Trending = places most saved across all users this week (popular_places RPC,
  // migrations/2026-11-14_feed-popularity.sql). Until enough people save the same
  // places — or if the migration isn't run — fall back to top-rated venues.
  const [popular, setPopular] = useState([]);
  useEffect(() => {
    supabase.rpc("popular_places", { days: 7, lim: 8 }).then(({ data, error }) => {
      if (!error && data) setPopular(data.map(r => ({ ...r.place, _savers: r.savers })));
    });
  }, []);
  const freshPopular = savedKeys?.size ? popular.filter(v => !savedKeys.has(feedKey(v))) : popular;
  const trending = freshPopular.length >= 3 ? freshPopular.slice(0, 6) : dbVenues
    .filter(v => !v.is_event && v.photo_url && v.google_rating && parseFloat(v.google_rating) >= 4.2)
    .sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0))
    .slice(0, 6);

  // Rows of picks (spec: docs/specs/2026-11-15-big-photo-led-ui.md). Each row is a
  // horizontal carousel of 4:5 photo cards. Which rows show depends on the person's
  // sign-up preferences; Cheap eats, a celebrity row and New this month are fixed.
  const byRating = (arr) => [...arr].sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0));
  const withPhoto = dbVenues.filter(v => !v.is_event && v.photo_url);
  const PREF_ROWS = {
    "Restaurants": { title: "Restaurant picks", match: v => v.category === "restaurant" },
    "Bars": { title: "Top bar picks", match: v => v.category === "bar" },
    "Hidden gems": { title: "Hidden gems", match: v => (v.vibe_tags || []).includes("hidden_gems") },
    "Outdoor": { title: "Outdoor", match: v => v.category === "outdoor" },
    "Culture": { title: "Culture", match: v => ["museum", "gallery", "experience"].includes(v.category) },
    "Markets": { title: "Markets", match: v => v.category === "market" },
    "Late night": { title: "Late ones", match: v => ["nightlife", "bar"].includes(v.category) },
    "Brunch": { title: "Brunch spots", match: v => v.category === "cafe" },
    "Fine dining": { title: "Fine dining", match: v => (v.vibe_tags || []).includes("fancy") },
    "Plant based": { title: "Plant based", match: v => !!v.plant_friendly },
    "Arts & crafts": { title: "Arts & crafts", match: v => v.category === "gallery" },
    "Active": { title: "Active", match: v => (v.vibe_tags || []).includes("active") || v.category === "outdoor" },
  };
  const prefRows = (preferences || []).map(pf => PREF_ROWS[pf] && { key: "pref_" + pf.toLowerCase().replace(/[^a-z]+/g, "_"), title: PREF_ROWS[pf].title, why: `Because you like ${pf.toLowerCase()}`, items: byRating(withPhoto.filter(PREF_ROWS[pf].match)).slice(0, 8) })
    .filter(r => r && r.items.length >= 3).slice(0, 3);
  const cheapEats = byRating(withPhoto.filter(v => /low|under|£$|£10|£15/i.test(v.price || ""))).slice(0, 8);
  const monthAgo = Date.now() - 30 * 86400000;
  const newThisMonth = withPhoto.filter(v => v.created_at && new Date(v.created_at).getTime() > monthAgo).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  const celebVenues = dbVenues.filter(v => v.celebrity_tags && v.celebrity_tags.length > 0 && v.photo_url)
    .sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0));

  // Celebrity row: rotates weekly between celebrities with 5+ tagged venues.
  const celebGroups = Object.entries(celebVenues.reduce((m, v) => { const c = v.celebrity_tags[0]; (m[c] = m[c] || []).push(v); return m; }, {})).filter(([, arr]) => arr.length >= 5);
  const week = Math.floor(Date.now() / (7 * 86400000));
  const celebRow = celebGroups.length ? (([name, arr]) => ({ key: "celebrity", title: `${name}'s picks`, why: `${arr.length} places ${name.split(" ")[0]} loves`, items: byRating(arr).slice(0, 8) }))(celebGroups[week % celebGroups.length]) : null;

  const CAT_CHIPS = { "Restaurants": ["restaurant"], "Cafés": ["cafe"], "Outdoors": ["outdoor"], "Markets": ["market"] };
  const filtered = chip === "All" ? trending : chip === "East" ? trending.filter(v => /east|shoreditch|hackney|bethnal|dalston/i.test(v.zone || v.area || ""))
    : chip === "Date night" ? trending.filter(v => (v.vibe_tags || []).some(t => ["romantic", "fancy", "aesthetic"].includes(t)))
    : chip === "Cheap eats" ? cheapEats
    : chip === "Bars" ? byRating(withPhoto.filter(v => v.category === "bar")).slice(0, 8)
    : chip === "Culture" ? byRating(withPhoto.filter(v => ["museum", "gallery", "experience"].includes(v.category))).slice(0, 8)
    : chip === "Celebrity picks" ? celebVenues.slice(0, 8)
    : CAT_CHIPS[chip] ? byRating(withPhoto.filter(v => CAT_CHIPS[chip].includes(v.category))).slice(0, 8)
    : trending;

  const rows = [
    { key: "trending", title: chip === "All" ? "Trending this week" : chip, why: "", items: (filtered.length ? filtered : trending).slice(0, 8) },
    ...prefRows,
    { key: "cheap_eats", title: "Cheap eats", why: "", items: cheapEats },
    celebRow,
    { key: "new_this_month", title: "New this month", why: "", items: newThisMonth },
  ].filter(r => r && r.items.length >= 3);
  const EXPLORE = [["Restaurants", "food"], ["Bars", "bar"], ["Cafés", "coffee"], ["Culture", "museum"], ["Outdoors", "park"], ["Markets", "market"]];

  const formatDate = (start, end) => {
    const opts = { day: "numeric", month: "short" };
    const s = new Date(start).toLocaleDateString("en-GB", opts);
    if (!end) return s;
    return `${s} – ${new Date(end).toLocaleDateString("en-GB", opts)}`;
  };

  useEffect(() => {
    const shown = rows[0]?.items || [];
    mpSurfaceOnce("trending", shown.length);
    mpSurfaceOnce("top_picks", shown.filter(isTopPick).length);
    mpSurfaceOnce("because_you_like", prefRows.reduce((n, r) => n + r.items.length, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trending.length, prefRows.length]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (swipeDeck) mpSurfaceOnce("swipe_deck", 30); }, [swipeDeck]);

  return (
    <div style={{ animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)", paddingBottom: 40 }}>
      <div style={{ padding: "0 22px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div aria-label="cuRATED" style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 400, fontSize: 38, lineHeight: 1, letterSpacing: "-0.03em", color: "#3A0B14" }}>cu<span style={{ fontWeight: 900, color: "#7A1E33" }}>RATED</span><span style={{ fontWeight: 900, color: "#BAD2E8" }}>.</span></div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.42)", marginTop: 13 }}>{dayName}</div>
        </div>
      </div>

      {onStart && (
        <div onClick={onStart} style={{ margin: "0 22px 22px", padding: 20, borderRadius: 14, background: "#3A0B14", color: "#BAD2E8", cursor: "pointer" }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.75 }}>{dbVenues.length > 0 ? `${Math.min(dbVenues.filter(v => v.lat && v.lng).length, 20)} saves nearby` : "Your saves nearby"}</div>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 1.02, margin: "10px 0 16px" }}>Build me a plan<br />from my saves</div>
          <div style={{ display: "inline-block", padding: "10px 18px", borderRadius: 8, background: "#FAF7F2", color: "#3A0B14", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16 }}>Answer 5 questions →</div>
        </div>
      )}

      {swipeDeck && (
        <SwipeDeck
          venues={dbVenues.filter(v => !v.is_event && v.photo_url && v.google_rating >= 4.0).sort(() => 0.5 - Math.random()).slice(0, 30)}
          preferences={preferences}
          onClose={() => setSwipeDeck(false)}
          onSave={(v) => onSave && onSave(v, { surface: "swipe_deck", position: 0, method: "tap_save" })}
          onOpenSpot={(v) => openSpot(v, "swipe_deck", 0)}
        />
      )}

      <div data-tour="discover-swipe" onClick={() => setSwipeDeck(true)} style={{ margin: "0 22px 18px", padding: "16px 18px", background: "#FFFBF5", color: "#3A0B14", border: "1.5px solid #3A0B14", cursor: "pointer", borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "#7A1E33", color: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>♥</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, lineHeight: 1.1 }}>Swipe to discover</div>
          <div style={{ fontSize: 12, color: "rgba(58,11,20,.55)", marginTop: 3 }}>Personalised picks matched to your taste</div>
        </div>
        <div style={{ fontSize: 16, color: "rgba(58,11,20,.4)" }}>›</div>
      </div>

      <div style={{ display: "flex", gap: 7, padding: "0 22px 20px", overflowX: "auto", scrollbarWidth: "none" }}>
        {CHIPS.map(c => (
          <button key={c} onClick={() => setChip(c)} className={`filter-chip ${chip === c ? "sel" : ""}`}>{c}</button>
        ))}
      </div>

      {rows.map((row, ri) => (
        <div key={row.key} data-tour={ri === 0 ? "discover-rows" : undefined}>
          <div style={{ padding: "0 22px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1.1 }}>{row.title}</div>
              {row.why && <div style={{ fontSize: 12, color: "#7A1E33", marginTop: 3 }}>{row.why}</div>}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(58,11,20,.45)", paddingBottom: 4 }}>{row.items.length} spots</div>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "0 22px 32px", overflowX: "auto", scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
            {row.items.map((v, i) => (
              <PhotoCard key={v.id} v={v} width={280} height={350} onClick={() => openSpot(v, row.key === "trending" ? (isTopPick(v) ? "top_picks" : "trending") : row.key, i)} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ padding: "0 22px" }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, marginBottom: 12 }}>Explore by category</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {EXPLORE.map(([label, icon]) => (
            <button key={label} onClick={() => { setChip(label); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px", borderRadius: 14, border: "1px solid rgba(58,11,20,.12)", background: "#FFFBF5", color: "#3A0B14", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <LineIcon name={icon} size={20} color="#7A1E33" />{label}
            </button>
          ))}
        </div>
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
          max_tokens: 4096,
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
        <div style={{ flex: 1, height: 1, background: "rgba(58,11,20,.13)" }} />
        <span style={{ fontSize: 11, color: "rgba(58,11,20,.45)" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "rgba(58,11,20,.13)" }} />
      </div>

      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: "0.75rem", padding: "12px 16px", border: "1.5px dashed rgba(58,11,20,.18)", borderRadius: 8, fontSize: 15, color: "rgba(58,11,20,.6)", cursor: "pointer", fontFamily: "inherit" }}>
        📷 Upload a screenshot
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) parseFromImage(e.target.files[0]); e.target.value = ""; }} disabled={parsing} />
      </label>
      {parseStatus && <div style={{ fontSize: 12, color: "#7A1E33", marginTop: 8, textAlign: "center" }}>{parseStatus}</div>}

      {preview && (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(58,11,20,.45)", marginBottom: "0.5rem", fontWeight: 500 }}>
            {preview.venues.length > 1 ? `${preview.venues.length} venues found` : "Preview"} — check before saving
          </div>
          {preview._caption && (
            <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", background: "#F1EDE4", borderRadius: 14, padding: "0.75rem", marginBottom: "1rem", lineHeight: 1.5 }}>
              <strong>Caption:</strong> {preview._caption}
            </div>
          )}
          {preview.venues.map((venue, i) => (
            <div key={i} className="preview-card" style={{ marginBottom: "0.75rem" }}>
              {preview.venues.length > 1 && (
                <div style={{ fontSize: 11, color: "#7A1E33", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem", fontWeight: 600 }}>
                  {i + 1} of {preview.venues.length}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem", gap: 8 }}>
                <div className="preview-title" style={{ marginBottom: 0 }}>{venue.validated_name || venue.name || "Unknown venue"}</div>
                <div style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: venue._google_found ? "#E3EDF6" : "#F1EDE4", color: venue._google_found ? "#7A1E33" : "rgba(58,11,20,.4)", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {venue._google_found ? "✓ Verified" : "Added from screenshot"}
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
                ["Website", venue.website ? <a href={venue.website} target="_blank" rel="noreferrer" style={{ color: "#7A1E33" }}>Visit ↗</a> : null],
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

  if (loading) return <div style={{ paddingTop: "2rem" }}><SkeletonList count={4} /></div>;

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
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 0", borderBottom: "1px solid rgba(58,11,20,.13)" }}>
                {u.avatar_url && <img src={u.avatar_url} style={{ width: 28, height: 28, borderRadius: "50%" }} alt="" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: "#3A0B14", fontWeight: 500 }}>{u.name || u.email}</div>
                  <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)" }}>
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
          <div className="empty-icon">✅</div>
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
              {item.comment && <div style={{ fontSize: 13, color: "rgba(58,11,20,.55)", marginBottom: "8px", lineHeight: 1.4 }}>{item.comment}</div>}
              {item.vibe_tags?.length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {sortTags(item.vibe_tags).map(t => <span key={t} className="stop-pill" style={tagStyle(t, {})}>{tagLabel(t)}</span>)}
                </div>
              )}
              {item.tiktok_url && (
                <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", marginBottom: "8px" }}>
                  <a href={item.tiktok_url} target="_blank" rel="noreferrer" style={{ color: "#7A1E33" }}>View TikTok ↗</a>
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
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#3A0B14", cursor: "pointer" }}>
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

      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(58,11,20,.45)", marginBottom: "0.75rem", fontWeight: 500 }}>I'm into...</div>
      <div className="pref-chips">
        {PREF_OPTIONS.map(p => (
          <div key={p} className={`pref-chip ${preferences.includes(p) ? (PREF_OPTIONS.indexOf(p) % 2 === 0 ? "sel-blue" : "sel-yellow") : ""}`} onClick={() => toggle(p)}>{p}</div>
        ))}
      </div>

      {preferences.length > 0 && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#F1EDE4", borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: "rgba(58,11,20,.55)", lineHeight: 1.5 }}>
            ✦ Your Discover tab will prioritise: <strong>{preferences.join(", ")}</strong>
          </div>
        </div>
      )}

      {preferences.length > 0 && (
        <button className="btn-outline" style={{ marginTop: "1rem" }} onClick={() => setPreferences([])}>
          Clear preferences
        </button>
      )}

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(58,11,20,.13)" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(58,11,20,.45)", marginBottom: "0.75rem", fontWeight: 500 }}>Account</div>
        {user && <div style={{ fontSize: 15, color: "rgba(58,11,20,.6)", marginBottom: "0.75rem" }}>{user.email}</div>}
        <button className="btn-outline" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );
}

// Profile / settings hub — folds in "For me" (prefs) and Admin so they're off the nav bar.
function MeScreen({ user, preferences, setPreferences, isAdmin, onBadgeUpdate, adminBadge, onStartTour, onStartImportTour, onRetakeQuiz }) {
  // Export and delete go through api/gdpr.mjs; identity comes from the signed-in token.
  const [gdprBusy, setGdprBusy] = useState(false);
  async function exportData() {
    if (gdprBusy) return;
    setGdprBusy(true);
    try {
      const r = await fetch("/api/gdpr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "export" }) });
      const j = await r.json();
      if (!r.ok || !j.found) throw new Error(j.error || "Export failed");
      const blob = new Blob([JSON.stringify(j.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `curated-export-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { alert("Couldn't export your data: " + e.message); }
    setGdprBusy(false);
  }
  async function deleteAccount() {
    if (gdprBusy) return;
    if (!window.confirm("Delete your account? This removes your saves, plans, lists, ratings and friends for good. It can't be undone.")) return;
    const typed = window.prompt('Type DELETE to confirm.');
    if (typed !== "DELETE") return;
    setGdprBusy(true);
    try {
      const r = await fetch("/api/gdpr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete" }) });
      const j = await r.json();
      if (!r.ok || !j.deleted) throw new Error(j.error || "Delete failed");
      try { localStorage.clear(); } catch {}
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) { alert("Couldn't delete your account: " + e.message); setGdprBusy(false); }
  }
  const [view, setView] = useState(null);
  const [viewFriend, setViewFriend] = useState(null);
  const displayName = user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "You");
  const [avatar, setAvatar] = useState(() => user?.user_metadata?.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [stats, setStats] = useState({ saved: 0, visited: 0, friends: 0 });
  const [friends, setFriends] = useState([]);
  const [bucketLists, setBucketLists] = useState([]);
  const nameOf = (p) => p?.name || "?";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: savedCount }, { count: visitedCount }, conRes, blRes] = await Promise.all([
        supabase.from("experiences").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("experiences").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("visit_date", "is", null),
        supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
        supabase.from("shared_lists").select("id,name,emoji"),
      ]);
      const otherIds = (conRes.data || []).map(c => c.user_a === user.id ? c.user_b : c.user_a);
      let prof = [];
      if (otherIds.length) {
        const { data } = await supabase.from("profiles").select("id,name,avatar_url,friend_code").in("id", otherIds);
        prof = data || [];
      }
      const blIds = (blRes.data || []).map(b => b.id);
      let blItems = [];
      if (blIds.length) {
        const { data } = await supabase.from("shared_list_items").select("list_id,done");
        blItems = data || [];
      }
      let blMembers = [];
      if (blIds.length) {
        const { data } = await supabase.from("shared_list_members").select("list_id,user_id");
        blMembers = data || [];
      }
      setStats({ saved: savedCount || 0, visited: visitedCount || 0, friends: otherIds.length });
      setFriends(prof);
      setBucketLists((blRes.data || []).map(b => {
        const items = blItems.filter(it => it.list_id === b.id);
        const members = blMembers.filter(m => m.list_id === b.id);
        return { ...b, total: items.length, done: items.filter(it => it.done).length, memberCount: members.length };
      }));
    })();
  }, [user]);

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setAvatarPreview({ url: URL.createObjectURL(file), file });
  }
  async function confirmAvatar() {
    if (!avatarPreview) return;
    setUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const size = 512;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = avatarPreview.url; });
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.85));
      const path = `avatars/${user.id}.jpg`;
      const { error: upErr } = await supabase.storage.from("Avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("Avatars").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Could not get public URL");
      const urlWithBust = data.publicUrl + "?t=" + Date.now();
      await supabase.auth.updateUser({ data: { avatar_url: urlWithBust } });
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      setAvatar(urlWithBust);
      setAvatarPreview(null);
    } catch (err) {
      setInfoToast("Photo upload failed — try again"); setTimeout(() => setInfoToast(null), 3500);
    } finally { setUploading(false); }
  }

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

  const tasteChips = [];
  if (preferences) {
    const p = preferences;
    if (p.vibes?.length) tasteChips.push(...p.vibes.slice(0, 3));
    if (p.areas?.length) tasteChips.push(...p.areas.slice(0, 2));
    if (p.budget) tasteChips.push(p.budget === "low" ? "£ Budget" : p.budget === "mid" ? "££ Middle ground" : "£££ Splurge");
    if (p.group) tasteChips.push(p.group);
  }

  return (
    <div style={{ animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />

      {avatarPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#3A0B14", display: "flex", flexDirection: "column", animation: "fadeIn .2s" }}>
          <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setAvatarPreview(null)} style={{ background: "none", border: "none", color: "#FAF7F2", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(250,247,242,.55)" }}>Profile photo</div>
            <div style={{ width: 50 }} />
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <div style={{ width: "min(280px, 70vw)", height: "min(280px, 70vw)", borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(250,247,242,.2)" }}>
              <img src={avatarPreview.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
          <div style={{ padding: "0 22px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={confirmAvatar} disabled={uploading} style={{ width: "100%", padding: 15, background: "#7A1E33", color: "#FAF7F2", border: "none", fontSize: 16, fontWeight: 600, cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "Uploading..." : "Use photo"}
            </button>
            <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: 13, background: "transparent", color: "rgba(250,247,242,.7)", border: "1px solid rgba(250,247,242,.18)", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
              Choose a different photo
            </button>
          </div>
        </div>
      )}

      {/* Header: code + name */}
      <div style={{ padding: "0 22px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.42)", marginBottom: 4 }}>Code · {user?.user_metadata?.friend_code || "····"}</div>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#7A1E33" }}>{displayName}<span style={{ color: "#BAD2E8" }}>.</span></div>
      </div>

      {/* Stats row */}
      <div style={{ margin: "0 22px 22px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { val: stats.saved, label: "Saved", bg: "#FAF7F2", border: "1px solid rgba(58,11,20,.13)" },
          { val: stats.visited, label: "Visited", bg: "#FAF7F2", border: "1px solid rgba(58,11,20,.13)" },
          { val: stats.friends, label: "Friends", bg: "#FAF7F2", border: "1px solid rgba(58,11,20,.13)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "16px 12px", background: s.bg, border: s.border, borderRadius: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, color: "#3A0B14" }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(58,11,20,.42)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Your taste */}
      {tasteChips.length > 0 && (
        <div style={{ padding: "0 22px 22px" }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, marginBottom: 10 }}>Your taste</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tasteChips.map((c, i) => (
              <div key={i} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(58,11,20,.16)", fontSize: 15, color: "#3A0B14" }}>{c}</div>
            ))}
          </div>
        </div>
      )}

      {/* Avatar (tappable) + edit */}
      <div style={{ padding: "0 22px 22px", display: "flex", alignItems: "center", gap: 14 }}>
        <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: "50%", background: "#3A0B14", color: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 28, overflow: "hidden", flexShrink: 0, cursor: "pointer", position: "relative" }}>
          {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : displayName.charAt(0).toUpperCase()}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", padding: "3px 0", textAlign: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FAF7F2" }}>Edit</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(58,11,20,.5)", lineHeight: 1.4 }}>Tap to update your profile photo.<br />Visible to your friends.</div>
      </div>


      {/* Account details */}
      <div style={{ margin: "0 22px 18px", padding: "14px 16px", background: "#F1EDE4", borderRadius: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(58,11,20,.35)", marginBottom: 8 }}>Account</div>
        <div style={{ fontSize: 15, color: "#3A0B14", marginBottom: 4 }}>{user?.email || "No email"}</div>
        <div style={{ fontSize: 12, color: "rgba(58,11,20,.35)" }}>Signed in via {user?.app_metadata?.provider === "google" ? "Google" : "email"}</div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "0 22px", display: "flex", flexDirection: "column" }}>
        {[
          { icon: "sliders", label: "Taste preferences", action: () => setView("prefs") },
          { icon: "upload", label: gdprBusy ? "Preparing your export…" : "Export my data", action: exportData },
          { icon: "refresh", label: "Retake the personalisation quiz", action: onRetakeQuiz },
          { icon: "map", label: "Take the tour", action: onStartTour },
          { icon: "trash", label: "Delete account", action: deleteAccount, fg: "#7A1E33" },
          ...(isAdmin ? [{ icon: "wrench", label: "Admin", hint: adminBadge > 0 ? `${adminBadge} pending` : "", action: () => setView("admin") }] : []),
          { icon: "lock", label: "Privacy policy", action: () => window.open("/privacy.html", "_blank", "noopener") },
          { icon: "logout", label: "Sign out", fg: "#7A1E33", action: () => supabase.auth.signOut() },
        ].map((r, i) => (
          <button key={i} onClick={r.action} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid rgba(58,11,20,.08)", cursor: "pointer", background: "none", border: "none", borderBottom: "1px solid rgba(58,11,20,.08)", width: "100%", textAlign: "left" }}>
            <span style={{ width: 22, display: "flex", justifyContent: "center", flexShrink: 0 }}><LineIcon name={r.icon} size={20} color={r.fg || "#3A0B14"} /></span>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 500, color: r.fg || "#3A0B14" }}>{r.label}</div>
            {r.hint && <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(58,11,20,.38)" }}>{r.hint}</div>}
            <div style={{ color: "rgba(58,11,20,.2)", fontSize: 17 }}>›</div>
          </button>
        ))}
      </div>
      <div style={{ height: 40 }} />
      {viewFriend && <FriendProfile user={user} friend={viewFriend} onClose={() => setViewFriend(null)} />}
    </div>
  );
}

const CAT_PIN_COLOURS = { restaurant: "#BAD2E8", bar: "#7A1E33", cafe: "#BAD2E8", market: "#5A7590", experience: "#7A1E33", outdoor: "#7A7A45", museum: "#5A7590", gallery: "#7A1E33", nightlife: "#7A1E33", event: "#7A1E33" };
const CAT_PIN_EMOJI = { restaurant: "🍽️", bar: "🍸", cafe: "☕", market: "🛍️", experience: "✨", outdoor: "🌳", museum: "🏛️", gallery: "🎨", nightlife: "🌙", event: "🎫" };
const CAT_LABEL = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
// Category chips (with dots) for the manual Save form.
const MANUAL_CATS = [["restaurant", "Restaurant", "#BAD2E8"], ["bar", "Bar", "#7A1E33"], ["cafe", "Café", "#BAD2E8"], ["museum", "Museum", "#5A7590"], ["gallery", "Gallery", "#7A1E33"], ["market", "Market", "#5A7590"], ["outdoor", "Outdoor", "#7A7A45"], ["experience", "Experience", "#7A1E33"]];
// Shared across SavedScreen + SpotsMap (card/list/folder visuals).
const CAT_EMOJI = { restaurant: "\u{1F37D}️", bar: "\u{1F378}", cafe: "☕", market: "\u{1F6CD}️", experience: "✨", outdoor: "\u{1F33F}", museum: "\u{1F3DB}️", gallery: "\u{1F3A8}", nightlife: "\u{1F319}", event: "\u{1F3AB}" };
const CAT_COLOURS = { restaurant: "#BAD2E8", bar: "#7A1E33", cafe: "#BAD2E8", market: "#5A7590", experience: "#7A1E33", outdoor: "#7A7A45", museum: "#5A7590", gallery: "#7A1E33", nightlife: "#7A1E33", event: "#7A1E33" };
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#3A0B14" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
function coinIcon(inner, size = 36) {
  return window.L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#fffdf8;border:1px solid #e6e0d4;box-shadow:0 2px 7px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;font-weight:700;color:#3A0B14;font-size:14px">${inner}</div>`,
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
  const colors = ["#7A1E33", "#BAD2E8", "#E8C07D", "#C98F6B", "#8FB08C", "#E4B2C4", "#F4E4C1"];
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
  plans: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
  saved: '<rect x="4" y="4" width="16" height="16"/>',
  discover: '<circle cx="12" cy="12" r="9"/>',
  prefs: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  people: '<circle cx="9" cy="10" r="6"/><circle cx="16" cy="14" r="6"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};
// Outline icons in the same style as the bottom bar (24px grid, 1.8 stroke).
const LINE_ICONS = {
  coffee: "M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9zM16 10h2a2 2 0 0 1 0 4h-2M8 3v3M11 3v3",
  food: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 6s1 5 3 5v7",
  bar: "M5 4h14l-7 8zM12 12v7M8 20h8",
  glass: "M7 3h10l-1 6a4 4 0 0 1-8 0zM12 13v8M8 21h8",
  gallery: "M4 5h16v14H4zM7 15l3-4 3 3 2-2 2 3",
  museum: "M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18",
  park: "M12 3a5 5 0 0 0-5 5 4 4 0 0 0 1 7h8a4 4 0 0 0 1-7 5 5 0 0 0-5-5zM12 15v6",
  pine: "M12 3l6 9h-4l4 6H6l4-6H6zM12 18v3",
  market: "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0",
  music: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  ticket: "M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pound: "M16 6.5A4 4 0 0 0 8.5 8v12M6 13h7M6 20h11",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  chat: "M4 5h16v11H9l-5 4z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-3.9 3.1-7 7-7s7 3.1 7 7M16 3.5a4 4 0 0 1 0 7.5M18 14c2.4.8 4 3.3 4 6",
  party: "M4 20l5-14 9 9zM14 4l1 2M19 9l2-1M17 4l-1 2",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  map: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  leaf: "M5 19C5 10 11 5 20 4c-1 9-6 15-15 15zM5 19l7-7",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  flame: "M12 22a7 7 0 0 0 7-7c0-5-4-7-5-11-2 3-3 4-3 6-1-1-2-2-2-4-2 2-4 5-4 9a7 7 0 0 0 7 7z",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  gem: "M6 3h12l3 6-9 12L3 9zM3 9h18",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1-.8-1.3-.8-2.2 0-.8.7-1.3 1.5-1.3H17a4 4 0 0 0 4-4c0-5-4-9-9-9zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  walk: "M13 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 8l-3 5 3 2v6M12 8l3 4 3 1M9 13l-3 8",
  train: "M6 4h12v11H6zM6 10h12M8 19l-2 2M16 19l2 2M9 13h.01M15 13h.01",
  home: "M4 11l8-7 8 7v9H4zM10 20v-5h4v5",
  bridge: "M2 16h20M4 16V9M20 16V9M4 9c3 4 13 4 16 0M8 16v-3M12 16v-2M16 16v-3",
  brick: "M3 6h18v12H3zM3 12h18M9 6v6M15 12v6",
  dice: "M4 4h16v16H4zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01",
  sliders: "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M14 4v4M6 10v4M16 16v4",
  upload: "M12 16V4M6 10l6-6 6 6M4 20h16",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  refresh: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
  wrench: "M14.7 6.3a4 4 0 0 0 5 5L13 18a2 2 0 0 1-3 0l-1-1a2 2 0 0 1 0-3l6.7-6.7zM3 21l4-4",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  logout: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
};
function LineIcon({ name, size = 18, color = "currentColor", style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", ...style }}><path d={LINE_ICONS[name] || LINE_ICONS.pin} /></svg>;
}
// Icon per plan-builder answer. Keys are "<question id>:<value>" so "solo" can differ between vibe and group size.
const OPTION_ICONS = { chill: "moon", romantic: "heart", chaotic: "party", cultural: "museum", fancy: "glass", hidden_gems: "gem", social: "users", solo: "leaf", creative: "palette", activity: "target", active: "walk",
  central: "museum", east: "brick", south: "bridge", west: "park", north: "pine", southwest: "home", northwest: "leaf", outskirts: "train", surprise_me: "dice", map_pin: "pin",
  "£10–£30": "pound", "£30–£50": "card", "£50–£80": "sparkle", "£80+": "gem", "groupSize:solo": "user", duo: "users", small: "users", large: "party", low: "leaf", medium: "bolt", high: "flame" };
function stopIconName(type) {
  const t = String(type || "").toLowerCase();
  if (/coffee|caf|bak|brunch|tea/.test(t)) return "coffee";
  if (/bar|pub|cocktail|wine|drink|rooftop|brew/.test(t)) return "bar";
  if (/galler|art|exhibit/.test(t)) return "gallery";
  if (/museum|histor|house/.test(t)) return "museum";
  if (/park|garden|walk|outdoor|heath|common|river|canal/.test(t)) return "park";
  if (/market|shop|book|record|vintage/.test(t)) return "market";
  if (/club|music|gig|jazz|night|danc|karaoke/.test(t)) return "music";
  if (/cinema|theat|show|comedy|event|ticket/.test(t)) return "ticket";
  if (/restaurant|food|dinner|lunch|eat|pizza|kitchen|dining|breakfast|grill/.test(t)) return "food";
  return "pin";
}

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
  if (photos.length === 0) return <div style={{ height, background: "#5A7590", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "2rem" }}>{CAT_EMOJI[cat] || "📁"}</span></div>;
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
  const swipeRef = useSwipeRight(onClose);
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
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (!spot.name) return;
    let active = true;
    async function loadPhotos() {
      let pid = spot.google_place_id;
      if (pid) {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "photos", place_id: pid }) });
        const j = await r.json();
        if (j.found && j.urls?.length) { if (active) setPhotos(prev => [...new Set([...prev, ...j.urls])]); return; }
      }
      // Place ID missing or stale — re-enrich by name to get a fresh one
      try {
        const e = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: spot.name, area: spot.area }) });
        const ej = await e.json();
        if (ej.found && ej.google_place_id && ej.google_place_id !== pid) {
          const r2 = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "photos", place_id: ej.google_place_id }) });
          const j2 = await r2.json();
          if (active && j2.found && j2.urls?.length) setPhotos(prev => [...new Set([...prev, ...j2.urls])]);
          if (spot.id && !readOnly) supabase.from("experiences").update({ google_place_id: ej.google_place_id }).eq("id", spot.id).then(() => {});
        }
      } catch (err) { /* best effort */ }
    }
    loadPhotos().catch(() => {});
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
    const style = { display: "block", textAlign: "center", padding: "12px", borderRadius: 8, fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: "pointer", textDecoration: "none", border: primary ? "none" : "1.5px solid rgba(58,11,20,.18)", background: primary ? "#7A1E33" : "#fff", color: primary ? "#fff" : "#4a4438" };
    return href ? <a href={href} target="_blank" rel="noreferrer" style={style}>{children}</a> : <button onClick={onClick} style={{ ...style, width: "100%" }}>{children}</button>;
  };
  const sf = { fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
  const SOURCE_LABEL = { tiktok: "saved via TikTok", instagram: "saved via Instagram", screenshot: "saved via screenshot", maps: "saved via Maps", manual: "added manually" };
  const pounds = priceToPounds(spot.price);
  const iconStyle = { width: 22, height: 22, display: "inline-block", verticalAlign: "middle", fill: "none", stroke: "#7A7A45", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const tabBtnStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 10px", background: "#FAF7F2", borderRadius: 14, border: "none", cursor: "pointer", flex: 1, boxShadow: "0 2px 8px rgba(58,11,20,.06)" };
  return (
    <div ref={swipeRef} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#FAF7F2", overflowY: "auto", animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
      {/* Photo hero: 62% of the screen, a swipeable carousel with a thin progress line (spec Y14) */}
      <div style={{ position: "relative", height: "62vh", minHeight: 420, background: photos.length ? "#3A0B14" : (CAT_COLOURS[cat] || "#7A1E33") }}>
        <div onScroll={e => { const el = e.currentTarget; setHeroIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }} style={{ display: "flex", height: "100%", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 2 }}>
          {photos.map((p, i) => <img key={i} src={p} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", flexShrink: 0, scrollSnapAlign: "start", pointerEvents: "none" }} />)}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))", pointerEvents: "none", zIndex: 3 }} />
        <button onClick={onClose} aria-label="Back" style={{ position: "absolute", top: 18, left: 16, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(250,247,242,.88)", backdropFilter: "blur(8px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#3A0B14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {onSaveToBoard && (
          <button onClick={savedToBoard ? undefined : onSaveToBoard} aria-label={savedToBoard ? "Saved" : "Save"} style={{ position: "absolute", right: 16, bottom: 64, width: 42, height: 42, borderRadius: "50%", border: "none", background: "rgba(250,247,242,.88)", backdropFilter: "blur(8px)", cursor: savedToBoard ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={savedToBoard ? "#7A1E33" : "none"} stroke="#7A1E33" strokeWidth="1.8" /></svg>
          </button>
        )}
        <div style={{ position: "absolute", left: 22, right: onSaveToBoard ? 72 : 22, bottom: 56, pointerEvents: "none", zIndex: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ ...sf, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E9E4DA" }}>{[cap(cat), spot.area, pounds].filter(Boolean).join(" · ")}</span>
            {isTopPick(spot) && <TopPickBadge style={{ fontSize: 11, padding: "4px 9px" }} />}
          </div>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, lineHeight: 1, color: "#FAF7F2", letterSpacing: "-0.01em" }}>{spot.name}</div>
        </div>
        {photos.length > 1 && (
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 34, display: "flex", gap: 4, zIndex: 4, pointerEvents: "none" }}>
            {photos.map((_, i) => <span key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: i === heroIdx ? "#FAF7F2" : "rgba(250,247,242,.4)", transition: "background .2s" }} />)}
          </div>
        )}
      </div>

      {/* Cream sheet sliding up over the photo (spec Y7, Y15) */}
      <div style={{ position: "relative", zIndex: 5, marginTop: -22, background: "#FAF7F2", borderRadius: "22px 22px 0 0", padding: "20px 22px 0" }}>
        {/* Rating line */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap", ...sf, fontSize: 15, fontWeight: 600, color: "#3A0B14" }}>
          {(agg.avg || spot.google_rating) && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24"><path d={LINE_ICONS.star} fill="#7A1E33" /></svg>{agg.avg ? agg.avg.toFixed(1) : spot.google_rating}</span>}
          {agg.count > 0 && <span style={{ color: "rgba(58,11,20,.45)", fontWeight: 500 }}>{agg.count} {agg.count === 1 ? "rating" : "ratings"}</span>}
          {spot.source_type && <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 8, background: "#F1EDE4", color: "rgba(58,11,20,.45)" }}>{SOURCE_LABEL[spot.source_type] || `saved via ${spot.source_type}`}</span>}
        </div>

        {/* Description, full */}
        <div style={{ ...sf, fontSize: 15, lineHeight: 1.55, color: "rgba(58,11,20,.72)", marginBottom: 16 }}>{(() => { const c = spot.comment || "No description yet."; return c.endsWith(".") ? c : c + "."; })()}</div>

        {/* Outline pill links */}
        <div data-tour="spot-book" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 18, paddingBottom: 2 }}>
          {spot.website && <a href={spot.website} target="_blank" rel="noreferrer" style={{ ...sf, flex: "none", padding: "8px 13px", borderRadius: 8, border: "1.5px solid #3A0B14", color: "#3A0B14", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}><LineIcon name="link" size={14} />Website ↗</a>}
          {spot.source_url && (spot.source_type === "tiktok" || spot.source_type === "instagram") && <a href={spot.source_url} target="_blank" rel="noreferrer" style={{ ...sf, flex: "none", padding: "8px 13px", borderRadius: 8, border: "1.5px solid #3A0B14", color: "#3A0B14", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{spot.source_type === "tiktok" ? "TikTok" : "Instagram"} ↗</a>}
          {onMakePlan && <button onClick={() => onMakePlan(spot)} style={{ ...sf, flex: "none", padding: "8px 13px", borderRadius: 8, border: "1.5px solid #3A0B14", background: "transparent", color: "#3A0B14", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><LineIcon name="map" size={14} />Plan around this</button>}
          <a href={gcalUrl} target="_blank" rel="noreferrer" style={{ ...sf, flex: "none", padding: "8px 13px", borderRadius: 8, border: "1.5px solid #3A0B14", color: "#3A0B14", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}><LineIcon name="calendar" size={14} />Schedule</a>
          <button onClick={() => { const text = `${spot.name}${spot.area ? ` — ${spot.area}` : ""}${spot.comment ? `\n${spot.comment}` : ""}${googleMapsUrl(spot) ? `\n${googleMapsUrl(spot)}` : ""}`; if (navigator.share) navigator.share({ title: spot.name, text }).catch(() => {}); else { navigator.clipboard?.writeText(text); setInfoToast("Copied to clipboard"); setTimeout(() => setInfoToast(null), 2500); } }} style={{ ...sf, flex: "none", padding: "8px 13px", borderRadius: 8, border: "1.5px solid #3A0B14", background: "transparent", color: "#3A0B14", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><LineIcon name="chat" size={14} />Share</button>
        </div>

        {/* Vibe tags (Top pick shows on the photo) */}
        {spot.vibe_tags?.some(t => t !== "top_pick") && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
            {spot.vibe_tags.filter(t => t !== "top_pick").map((t, i) => (
              <span key={i} style={{ ...sf, padding: "5px 13px", borderRadius: 8, background: "#BAD2E8", color: "#3A0B14", fontSize: 13, fontWeight: 600 }}>{tagLabel(t)}</span>
            ))}
          </div>
        )}

        {/* Address — no timings */}
        {spot.address && (
          <div style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(58,11,20,.1)", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, ...sf, fontSize: 15, color: "rgba(58,11,20,.55)" }}>
              <svg viewBox="0 0 24 24" style={{ ...iconStyle, width: 20, height: 20, flexShrink: 0, marginTop: 1 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{spot.address}</span>
            </div>
          </div>
        )}

        {/* Been here? — matches screenshot */}
        <div data-tour="spot-rating" style={{ padding: 18, borderRadius: 14, background: "#FAF7F2", border: "1px solid rgba(58,11,20,.1)", boxShadow: "0 2px 8px rgba(58,11,20,.04)", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ ...sf, fontSize: 16, fontWeight: 700, color: "#3A0B14", marginBottom: 2 }}>Been here?</div>
              <div style={{ ...sf, fontSize: 13, color: "rgba(58,11,20,.42)" }}>Mark it off and keep your own verdict.</div>
            </div>
            <div onClick={() => { const now = visitDate ? "" : new Date().toISOString().slice(0, 10); setVisitDate(now); persist({ visit_date: now || null }, "cl_visit_" + spot.id, now); }} style={{ ...sf, padding: "5px 12px", borderRadius: 8, border: `1px solid ${visitDate ? "#7A1E33" : "rgba(58,11,20,.14)"}`, background: visitDate ? "rgba(15,107,99,.08)" : "transparent", fontSize: 13, fontWeight: 500, color: visitDate ? "#7A1E33" : "rgba(58,11,20,.5)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>{visitDate ? "✓ Been" : "✓ Not yet"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} onClick={() => rate(n)} style={{ fontSize: 28, cursor: "pointer", color: myStars >= n ? "#C8A96E" : "#E0D9CC", transition: "color .15s" }}>★</span>
            ))}
            <span style={{ ...sf, fontSize: 13, color: "rgba(58,11,20,.38)", marginLeft: 6 }}>{myStars ? `You rated it ${myStars}` : "Tap to rate"}</span>
          </div>

          {/* Notes — matches screenshot */}
          {!readOnly && (
            <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} placeholder="Notes — what to order, who to bring, where to sit..." style={{ ...sf, width: "100%", border: "none", background: "#F1EDE4", borderRadius: 12, padding: "14px 16px", fontSize: 15, lineHeight: 1.5, color: "rgba(58,11,20,.65)", resize: "vertical", minHeight: 56, outline: "none", boxSizing: "border-box" }} rows={2} />
          )}
        </div>

        {agg.count > 0 && (
          <div style={{ ...sf, fontSize: 13, color: "rgba(58,11,20,.42)", marginBottom: 18 }}>Community average: <span style={{ color: "#3A0B14", fontWeight: 600 }}>{agg.avg?.toFixed(1)}</span> from {agg.count} {agg.count === 1 ? "review" : "reviews"}</div>
        )}

        <div style={{ height: 110 }} />
      </div>

      {/* Pinned action bar (spec Y8): one main action plus a round Directions button */}
      <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 0, width: "100%", maxWidth: 420, padding: "14px 22px calc(18px + env(safe-area-inset-bottom))", background: "linear-gradient(rgba(250,247,242,0), #FAF7F2 40%)", display: "flex", gap: 10, alignItems: "center", zIndex: 1300, boxSizing: "border-box" }}>
        {onSaveToBoard && !savedToBoard ? (
          <button onClick={onSaveToBoard} style={{ ...sf, flex: 1, padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", borderRadius: 8 }}>Save spot</button>
        ) : onAddToBucketList ? (
          <button onClick={() => onAddToBucketList(spot)} style={{ ...sf, flex: 1, padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", borderRadius: 8 }}>Add to a list</button>
        ) : onMakePlan ? (
          <button onClick={() => onMakePlan(spot)} style={{ ...sf, flex: 1, padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", borderRadius: 8 }}>Plan around this</button>
        ) : (
          <div style={{ ...sf, flex: 1, padding: 15, background: "#F1EDE4", borderRadius: 8, fontSize: 15, fontWeight: 600, color: "rgba(58,11,20,.4)", textAlign: "center" }}>Saved</div>
        )}
        <a href={googleMapsUrl(spot)} target="_blank" rel="noreferrer" aria-label="Directions" style={{ width: 50, height: 50, borderRadius: "50%", border: "1.5px solid #3A0B14", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <LineIcon name="pin" size={20} color="#3A0B14" />
        </a>
      </div>
    </div>
  );
}

// The big photo card used on the map (pin tap) AND in the swipe-up list — identical look.
// Photo-led: name and meta on the photo over a soft gradient, outline links underneath.
function BigSpotCard({ s, photo }) {
  const pounds = priceToPounds(s.price);
  const meta = [cap(normaliseCategory(s.category)), s.area, pounds, s.google_rating ? `${s.google_rating} ★` : null].filter(Boolean).join(" · ");
  return (
    <>
      <div style={{ position: "relative", height: 220, background: "#F1EDE4" }}>
        {photo && <img src={photo} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))" }} />
        {isTopPick(s) && <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 8, background: "#7A1E33", color: "#BAD2E8", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Top pick</div>}
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1.05, color: "#FAF7F2" }}>{s.name}</div>
          {meta && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E9E4DA", marginTop: 5 }}>{meta}</div>}
        </div>
      </div>
      {(googleMapsUrl(s) || (s.source_url && (s.source_type === "tiktok" || s.source_type === "instagram"))) && (
        <div style={{ padding: "10px 12px 12px", display: "flex", gap: 8 }}>
          {s.source_url && (s.source_type === "tiktok" || s.source_type === "instagram") && <a href={s.source_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #3A0B14", color: "#3A0B14", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>{s.source_type === "tiktok" ? "TikTok" : "Instagram"} ↗</a>}
          {googleMapsUrl(s) && <a href={googleMapsUrl(s)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #3A0B14", color: "#3A0B14", fontSize: 12.5, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}><LineIcon name="pin" size={14} />Directions</a>}
        </div>
      )}
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
    (async () => {
      loadCdnCss("leaflet-css");
      loadCdnCss("mcluster-css");
      if (!window.L) await loadCdnScript("leaflet-js");
      if (!window.L.markerClusterGroup) await loadCdnScript("mcluster-js");
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || instRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [51.505, -0.09], zoom: 11, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);

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
    <div className="empty-state"><div className="empty-icon"><LineIcon name="map" size={40} color="#7A1E33" /></div><div className="empty-title">No spots on the map yet</div><div className="empty-sub">Saved places with a known location will appear here.</div></div>
  );

  const selCat = normaliseCategory(selected?.category);
  const capitalise = (s) => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "";
  const filteredPts = filter === "all" ? pts : pts.filter(s => normaliseCategory(s.category) === filter);
  const filterLabel = CAT_LABEL[filter] || capitalise(filter);
  const mapH = peek ? (peekHeight || 150) : (listName || onCategory) ? 380 : 440;

  // Peek mode: a live, non-interactive preview that expands the full map on tap.
  if (peek) return (
    <div onClick={onExpand} style={{ position: "relative", cursor: "pointer", marginBottom: 12 }}>
      {!loaded && <div style={{ height: mapH, background: "#eef3ee", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(58,11,20,.45)", fontSize: 15 }}>Loading map…</div>}
      <div ref={mapRef} style={{ height: mapH, borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: loaded ? "block" : "none" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 14, zIndex: 900 }} />
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 950, background: "rgba(255,255,255,0.92)", color: "#3A0B14", borderRadius: 8, padding: "5px 11px", fontSize: 11, fontWeight: 600 }}>📍 {pts.length} on the map</div>
      <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 950, background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "6px 13px", fontSize: 12, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>Open map ›</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", marginBottom: 8 }}>{pts.length} {listName ? "place" : "spot"}{pts.length !== 1 ? "s" : ""} {listName ? `in ${listName}` : "on the map"} · tap a pin for the card</div>
      <div style={{ position: "relative" }}>
        {!loaded && <div style={{ height: mapH, background: "#eef3ee", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(58,11,20,.45)", fontSize: 15 }}>Loading map…</div>}
        <div ref={mapRef} style={{ height: mapH, borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: loaded ? "block" : "none" }} />
        {loaded && <button onClick={resetView} title="Reset map" style={{ position: "absolute", top: 10, right: 10, zIndex: 470, width: 36, height: 36, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>⤢</button>}


        {loaded && !listName && !onCategory && !selected && !sheetOpen && filter !== "all" && filteredPts.length > 0 && (
          <div
            onClick={() => setSheetOpen(true)}
            onTouchStart={(e) => { e.currentTarget._sy = e.touches[0].clientY; }}
            onTouchEnd={(e) => { const dy = (e.currentTarget._sy || 0) - e.changedTouches[0].clientY; if (dy > 30) setSheetOpen(true); }}
            style={{ position: "absolute", left: 10, right: 10, bottom: 54, zIndex: 460, background: "#fff", borderRadius: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "12px 14px 10px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 34, height: 4, borderRadius: 2, background: "#ddd6c8" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3A0B14" }}>⌃ Swipe up for all {filteredPts.length} {filterLabel}</span>
          </div>
        )}

        {loaded && !listName && !onCategory && sheetOpen && filter !== "all" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 600, background: "#fff", borderRadius: 14, display: "flex", flexDirection: "column", animation: "cardIn 0.25s ease" }}>
            <div
              onTouchStart={(e) => { e.currentTarget._sy = e.touches[0].clientY; }}
              onTouchEnd={(e) => { const dy = e.changedTouches[0].clientY - (e.currentTarget._sy || 0); if (dy > 40) setSheetOpen(false); }}
              style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(58,11,20,.13)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", width: 34, height: 4, borderRadius: 2, background: "#ddd6c8" }} />
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1rem", color: "#3A0B14" }}>{listName || filterLabel} ({filteredPts.length})</div>
              <button onClick={() => setSheetOpen(false)} style={{ border: "none", background: "#F1EDE4", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: "12px 12px 16px", flex: 1 }}>
              {filteredPts.map(s => (
                <div key={s.id} onClick={() => { setSelected(s); setSheetOpen(false); }} style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(58,11,20,.13)", background: "#fff", marginBottom: 14, cursor: "pointer" }}>
                  <BigSpotCard s={s} photo={s.photo_url} />
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div key={selected.id} style={{ position: "absolute", left: 10, right: 10, bottom: 10, zIndex: 500, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.28)", background: "#fff", animation: "cardSwap 0.2s ease-out" }}>
            <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: 16, lineHeight: 1, zIndex: 3 }}>×</button>
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
  event: { colour: "#7A7A45", emoji: "🎫", label: "Event" },
  spot:  { colour: "#7A1E33", emoji: "📌", label: "Spot" },
  plan:  { colour: "#7A1E33", emoji: "🗺️", label: "Plan" },
  blist: { colour: "#7A1E33", emoji: "✨", label: "Bucket list" },
};
function SpotsCalendar({ saves, user, onBuildPlan, onShare, plans: calPlans }) {
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
  const storedPlans = calPlans || [];
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
      const planId = e.id.replace("plan-", "");
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, scheduledDate: null } : p));
      supabase.from("plans").update({ scheduled_date: null }).eq("id", planId).then(({ error }) => { if (error) console.warn("plans:", error.message); });
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
    if (e._type === "plan") { const p = storedPlans.find(x => ("plan-" + (x.id || x.scheduledDate)) === e.id); if (p) onShare({ kind: "plan", title: p.result?.title || "An itinerary", payload: { plan: p.result, times: p.times } }); }
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "0 0 10px", fontSize: 11, color: "rgba(58,11,20,.45)" }}>
        {Object.entries(CAL_TYPE).map(([k, v]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: v.colour }} />{v.label}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => { setMonthOffset(monthOffset - 1); setSelDay(null); }} style={{ border: "none", background: "#F1EDE4", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>‹</button>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1rem", color: "#3A0B14" }}>{monthName}</div>
        <button onClick={() => { setMonthOffset(monthOffset + 1); setSelDay(null); }} style={{ border: "none", background: "#F1EDE4", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, fontSize: 11, color: "rgba(58,11,20,.45)", textAlign: "center", marginBottom: 4 }}>
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
              style={{ position: "relative", minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 9, fontSize: 12, cursor: "pointer", overflow: "hidden",
                background: isSel ? "#7A1E33" : showImg ? "#222" : isToday ? "#E3EDF6" : "transparent", color: (isSel || showImg) ? "#fff" : "#3A0B14", fontWeight: types.length ? 700 : 400,
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

      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(58,11,20,.45)", fontWeight: 500, margin: "16px 0 8px" }}>
        {selDay ? fmtFull(new Date(year, month, selDay)) : "Upcoming"}
      </div>
      {shown.length === 0 && <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)" }}>{selDay ? "Nothing planned yet — add a spot or build a plan below." : "No upcoming dates. Tap a day to plan something."}</div>}
      {shown.map(e => {
        const meta = CAL_TYPE[e._type] || CAL_TYPE.spot;
        return (
          <div key={e.id} style={{ display: "flex", gap: 10, padding: 10, background: "#fff", border: "1px solid rgba(58,11,20,.13)", borderRadius: 14, marginBottom: 8, borderLeft: `3px solid ${meta.colour}` }}>
            <div style={{ width: 46, height: 46, borderRadius: 11, overflow: "hidden", flexShrink: 0, background: meta.colour, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              {e.photo_url ? <img src={e.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{meta.emoji}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: "#3A0B14" }}>{e.name}</div>
              <div style={{ fontSize: 11, color: meta.colour, marginTop: 2 }}>
                📅 {fmt(e.event_start)}{e.event_end && e.event_end !== e.event_start ? ` – ${fmt(e.event_end)}` : ""}{e.event_time ? ` · 🕐 ${e.event_time}` : ""}
                {e._type === "plan" ? ` · ${e._stops} stop${e._stops !== 1 ? "s" : ""}` : ""}
                {e._type === "blist" ? " · bucket list" : ""}
              </div>
              {e.area && <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", marginTop: 2 }}>📍 {e.area}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, alignItems: "center" }}>
                <a href={gcal(e)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#7A1E33", fontWeight: 600 }}>+ Google Calendar</a>
                <button onClick={() => remind(e)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 11, color: hasReminder(e.id) ? "#7A1E33" : "#7a7062", fontWeight: 600 }}>{hasReminder(e.id) ? "🔔 Reminder set" : "🔔 Remind me"}</button>
                {onShare && <button onClick={() => shareEvent(e)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 11, color: "#7A1E33", fontWeight: 600 }}>↗ Share</button>}
                <button onClick={() => unschedule(e)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 11, color: "#b3a892", fontWeight: 600 }}>✕ Remove</button>
                {e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "rgba(58,11,20,.45)" }}>Source ↗</a>}
              </div>
            </div>
          </div>
        );
      })}

      {selDay && !adding && (
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => setAdding(true)} disabled={undatedSaves.length === 0} style={{ flex: 1, border: "1.5px solid #7A1E33", background: "#fff", color: undatedSaves.length ? "#7A1E33" : "#c9bfae", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600, cursor: undatedSaves.length ? "pointer" : "default" }}>＋ Add a saved spot</button>
          {onBuildPlan && <button onClick={() => onBuildPlan(eventsOn(new Date(year, month, selDay)).filter(e => e._type === "spot"))} style={{ flex: 1, border: "none", background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✦ Build a plan</button>}
        </div>
      )}
      {selDay && adding && (
        <div style={{ marginTop: 8, background: "#fff", border: "1px solid rgba(58,11,20,.13)", borderRadius: 14, padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {pickFolder && <button onClick={() => setPickFolder(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#7A1E33", fontWeight: 600, padding: 0 }}>‹ Lists</button>}
            <div style={{ fontSize: 12, color: "rgba(58,11,20,.45)" }}>{pickFolder ? `${pickFolder} → ${fmt(dayStr(selDay))}` : `Pick a list · ${fmtFull(new Date(year, month, selDay))}`}</div>
          </div>
          {!pickFolder && undatedFolders.length === 0 && <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)" }}>No undated spots left to add.</div>}
          {!pickFolder && undatedFolders.map(f => (
            <button key={f} onClick={() => setPickFolder(f)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "9px 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
              <span style={{ fontSize: "1.05rem", width: 28, textAlign: "center" }}>📁</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#3A0B14" }}>{f}</span>
              <span style={{ fontSize: 11, color: "rgba(58,11,20,.45)" }}>{undatedByFolder[f].length}</span>
              <span style={{ color: "#c9bfae", fontSize: "1.05rem" }}>›</span>
            </button>
          ))}
          {pickFolder && (undatedByFolder[pickFolder] || []).map(s => (
            <button key={s.id} onClick={() => assignSpot(s)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "7px 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
              {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 32, height: 32, borderRadius: 7, background: "#F1EDE4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📍</div>}
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, color: "#3A0B14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
              <span style={{ color: "#7A1E33", fontWeight: 700 }}>＋</span>
            </button>
          ))}
          <button onClick={() => { setAdding(false); setPickFolder(null); }} style={{ width: "100%", border: "none", background: "#F1EDE4", color: "rgba(58,11,20,.55)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", marginTop: 6 }}>Done</button>
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
    <div style={{ pointerEvents: "auto", background: "#3A0B14", color: "#fff", borderRadius: 14, padding: "14px 16px", maxWidth: 320, margin: "0 auto", boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>
      <div style={{ fontSize: 11, color: "#8f8ba3", marginBottom: 4 }}>Step {step + 1} of {IMPORT_TOUR.length}</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{info.title}</div>
      <div style={{ fontSize: 15, lineHeight: 1.45, color: "#d9d7e6" }}>{info.body}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <button onClick={onSkip} style={{ border: "none", background: "none", color: "#b6b3c9", fontSize: 12, cursor: "pointer", padding: 0 }}>Skip tour</button>
        {last && <button onClick={onDone} style={{ border: "none", background: "#3A0B14", color: "#fff", borderRadius: 9, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Got it</button>}
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
        <div style={{ position: "fixed", top: hole.t, left: hole.l, width: hole.w, height: hole.h, borderRadius: 14, boxShadow: "0 0 0 2px #fff", pointerEvents: "none" }} />
        <div style={{ position: "fixed", left: 16, right: 16, [below ? "top" : "bottom"]: below ? hole.t + hole.h + 12 : Math.max(12, vh - hole.t + 12) }}>{tip}</div>
      </>) : (
        <div style={{ position: "fixed", inset: 0, background: dim, pointerEvents: "auto", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 40px" }}>{tip}</div>
      )}
    </div>
  );
}

function SavedScreen({ user, onBuildPlan, onShare, onBarCrawl, openSignal, calendarSignal, visible, tourCapture, replayImportSignal, dbVenues, plans: parentPlans }) {
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
  const [infoToast, setInfoToast] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [saveFolder, setSaveFolder] = useState(""); // "" = auto by category, "__new__" = create new
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [bgParsing, setBgParsing] = useState(false);
  const [bgDone, setBgDone] = useState(false);
  const [calendarPrompt, setCalendarPrompt] = useState(null); // { spots: [...] } after save
  const [newFolder, setNewFolder] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [savedView, setSavedView] = useState("folders"); // folders | list | map | calendar
  useEffect(() => { if (visible) { setSavedView("folders"); setOpenFolder(null); } }, [visible]);
  const [folderLayout, setFolderLayout] = useState("grid"); // grid | list
  const [customFolders, setCustomFolders] = useState([]); // user-created (possibly empty) folders
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
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
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureTab, setCaptureTab] = useState(null);
  const [discoverMode, setDiscoverMode] = useState(false);
  // State for the "Discover more" card: declared here, not inside the conditional
  // render below, because hooks inside a conditional crash React (blank screen).
  const [cardFace, setCardFace] = useState(0); // 0=photo, 1=description, 2=gallery
  const [extraPhotos, setExtraPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [discoverSeed, setDiscoverSeed] = useState(null);
  const [discoverPairs, setDiscoverPairs] = useState([]);
  const [discoverIdx, setDiscoverIdx] = useState(0);
  useEffect(() => { setCardFace(0); setExtraPhotos([]); }, [discoverIdx]);

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
  const folderSwipeRef = useSwipeRight(() => { setOpenFolder(null); setFocusSpot(null); });
  const [mapCat, setMapCat] = useState(""); // Map tab: "" = all, else a category scope
  const [mapListFilter, setMapListFilter] = useState(""); // Map tab: "" = all lists, else a folder name

  // Collapse the capture controls whenever the user switches Folders/Map/Calendar.
  useEffect(() => { setCaptureOpen(false); }, [savedView]);

  // The global capture FAB bumps openSignal — pop the "Save a place" sheet on demand.
  const firstSignal = useRef(true);
  useEffect(() => {
    if (firstSignal.current) { firstSignal.current = false; return; }
    setOpenFolder(null); setCaptureTab(null); setError(null); setCaptureOpen(true);
  }, [openSignal]);
  // Product tour: the "Screenshot, link or name" step shows the sheet, then closes it.
  const tourCaptureWas = useRef(false);
  useEffect(() => {
    if (tourCapture) { setOpenFolder(null); setCaptureTab(null); setError(null); setCaptureOpen(true); }
    else if (tourCaptureWas.current) setCaptureOpen(false);
    tourCaptureWas.current = !!tourCapture;
  }, [tourCapture]);

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

  async function enrich(name, area, category) {
    try {
      const r = await fetch("/api/enrich-venue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, area, category }) });
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
      const g = await enrich(p.name, p.area, p.category);
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
    let n = 0, failed = 0, lastErr = "";
    // Process each image independently so one unreadable/odd screenshot can't
    // abort the whole batch (supports 50+ uploads).
    for (const file of files) {
      n++;
      setParseStatus("Reading image...");
      try {
        const { base64, mediaType } = await fileToDownscaledBase64(file);
        setParseStatus("Extracting venue...");
        let data, attempt = 0;
        while (attempt < 3) {
          attempt++;
          const resp = await fetch("/api/claude", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-6", max_tokens: 4096,
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
        if (data.error) { console.error("[screenshot] API error:", JSON.stringify(data.error)); failed++; lastErr = data.error?.message || "API error"; continue; }
        const t = (data.content?.find(b => b.type === "text")?.text || "");
        console.log("[screenshot] Claude response:", t.slice(0, 500));
        const raw = safeJsonParse(t);
        if (!raw) { console.error("[screenshot] JSON parse failed. Raw:", t.slice(0, 300)); failed++; lastErr = "Couldn't parse AI response"; continue; }
        const items = Array.isArray(raw) ? raw : [raw];
        const isSingleVenue = items.filter(p => p?.name).length === 1;
        for (const p of items) {
          if (!p?.name) continue;
          setParseStatus(`Google lookup: ${p.name}...`);
          let g = null;
          try { g = await enrich(p.name, p.area, p.category); } catch (e) { /* keep without Google */ }
          drafts.push(buildDraft(p, g, { source_type: "screenshot", source_url: null, _screenshot_b64: base64 }));
        }
      } catch (e) {
        console.error("[screenshot]", n, e);
        failed++;
      }
    }
    if (failed) setError(prev => `${failed} screenshot${failed !== 1 ? "s" : ""} couldn't be read${lastErr ? ` (${lastErr})` : ""}.${prev ? " " + prev : ""}`);
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
      if (!drafts.length) throw new Error(mt === "screenshot" ? "Couldn't extract venues from this screenshot. Check the browser console for details." : "Nothing found to add. Try a clearer source.");
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
      if (bgParsing) {
        setBgParsing(false);
        setBgDone(true);
        haptic([8, 20, 8]);
        notify("Parsing done ✦", `${drafts.length} spot${drafts.length !== 1 ? "s" : ""} ready to review`);
      } else {
        setCaptureOpen(false);
        if (dupCount) { setInfoToast(`${dupCount} already in your saves — marked below`); setTimeout(() => setInfoToast(null), 3500); }
        notify("Parsing done ✦", `${drafts.length} spot${drafts.length !== 1 ? "s" : ""} ready to review`);
      }
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
    if (d.google_place_id) {
      try {
        const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "image", place_id: d.google_place_id }) });
        const j = await r.json();
        if (j.found && j.url) { d.photo_url = j.url; d._previewImage = j.url; return d; }
      } catch {}
    }
    if (!d._previewImage) {
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
    if (!toSave.length) {
      setListPickerOpen(false);
      setPreview([]);
      setInfoToast("All spots already in your saves");
      setTimeout(() => setInfoToast(null), 3500);
      return;
    }
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
      { const st = toSave[0]?.source_type || "manual"; const m = st === "tiktok" ? "tiktok_parse" : st === "manual" ? "manual_save" : "url_parse"; mpPlaceSaved(user, { save_method: m, enrichment_source: m === "manual_save" ? "manual" : m, place_category: toSave[0]?.category, area: toSave[0]?.area, count: savedCount }); }
      setParseStatus("");
      tourSavedRef.current = true;
      setPreview([]);
      setSaveFolder(""); setNewFolder(""); setSaveNote(""); setCaptureOpen(false); setListPickerOpen(false); setListSearch("");
      const msg = savedCount === 1 ? toSave[0].name : `${savedCount} spots`;
      showSuccess(msg);
      notify("Saved to your collection ✨", savedCount === 1 ? `${toSave[0].name} added` : `${savedCount} spots added`);
      if (skipped) { setInfoToast(`${skipped} already saved — skipped`); setTimeout(() => setInfoToast(null), 3500); }
      setCalendarPrompt({ spots: toSave });
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
      mpPlaceSaved(user, { save_method: "manual_save", enrichment_source: d.google_place_id ? "google_places" : "manual", place_category: d.category, area: d.area });
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
    setCreatingFolder(true);
    setFolderDraft("");
    setSavedView("folders"); setOpenFolder(null);
  }
  function confirmCreateFolder() {
    const name = folderDraft.trim();
    if (!name) { setCreatingFolder(false); return; }
    if (!customFolders.includes(name)) persistFolders([...customFolders, name]);
    setCreatingFolder(false); setFolderDraft("");
  }

  async function renameFolder(oldName) {
    setMenuFolder(null);
    setRenamingFolder(oldName);
    setRenameDraft(oldName);
  }
  async function confirmRename(oldName) {
    const name = renameDraft.trim();
    setRenamingFolder(null); setRenameDraft("");
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

  if (loading) return <div style={{ paddingTop: "2rem" }}><SkeletonCards count={6} /></div>;

  const SOURCE_ICON = { tiktok: "\u{1F3B5}", instagram: "\u{1F4F8}", screenshot: "\u{1F5BC}️", maps: "\u{1F4CD}", manual: "\u{1F4DD}" };
  const fmtDate = (d) => { if (!d) return null; try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; } };
  const current = MEDIA_TYPES.find(m => m.id === mediaType) || MEDIA_TYPES[0];

  function VenueCard({ v, onRemove, onMove, draft }) {
    const cat = (v.category || "experience").toLowerCase();
    const colour = CAT_COLOURS[cat] || "#5A7590";
    const emoji = CAT_EMOJI[cat] || "✨";
    const dateLabel = v.is_event && (v.event_start || v.event_end)
      ? [fmtDate(v.event_start), fmtDate(v.event_end)].filter(Boolean).join(" – ")
      : null;
    return (
      <div style={{ display: "flex", gap: 12, padding: 12, background: "#fff", border: "1px solid rgba(58,11,20,.13)", borderRadius: 14, marginBottom: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: 11, overflow: "hidden", flexShrink: 0, background: (v.photo_url || v._previewImage) ? "#e9e4da" : colour, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(v.photo_url || v._previewImage)
            ? <img src={v.photo_url || v._previewImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "1.6rem" }}>{emoji}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: "#3A0B14" }}>{v.name}</div>
            {onRemove && <button onClick={onRemove} style={{ border: "none", background: "none", color: "#8a7e6e", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, flexShrink: 0 }}>×</button>}
          </div>
          <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", marginTop: 2 }}>
            {emoji} {cap(cat)}{v.zone ? ` · ${v.zone}` : ""}{v.area ? ` · ${v.area}` : ""}{v.google_rating ? ` · ⭐ ${v.google_rating}` : ""}{v.price ? ` · ${v.price}` : ""}
          </div>
          {dateLabel && <div style={{ fontSize: 11, color: "#7A1E33", marginTop: 3 }}>📅 {dateLabel}{v.event_time ? ` · 🕐 ${v.event_time}` : ""}</div>}
          {!dateLabel && v.event_time && <div style={{ fontSize: 11, color: "#7A1E33", marginTop: 3 }}>🕐 {v.event_time}</div>}
          {v.address && <div style={{ fontSize: 11, color: "#8a7e6e", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {v.address}</div>}
          {v.vibe_tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
              {sortTags(v.vibe_tags).slice(0, 5).map((t, i) => <span key={i} style={tagStyle(t, { fontSize: 11, background: "#F1EDE4", color: "rgba(58,11,20,.55)", padding: "2px 7px", borderRadius: 8 })}>{tagLabel(t)}</span>)}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
            {v.source_url && (v.source_type === "tiktok" || v.source_type === "instagram") && <a href={v.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#7A1E33", fontWeight: 500 }}>{SOURCE_ICON[v.source_type] || "🔗"} View source ↗</a>}
            {googleMapsUrl(v) && <a href={googleMapsUrl(v)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#7A1E33", fontWeight: 500 }}>📍 Maps</a>}
            {onMove && <button onClick={onMove} style={{ border: "none", background: "none", padding: 0, fontSize: 11, color: "rgba(58,11,20,.55)", fontWeight: 500, cursor: "pointer" }}>↪ Move</button>}
            {draft && v._dup && <span style={{ fontSize: 11, color: "#fff", background: "#7A1E33", padding: "2px 7px", borderRadius: 8, fontWeight: 600 }}>Already saved</span>}
            {draft && !v._google_found && <span style={{ fontSize: 11, color: "rgba(58,11,20,.35)" }}>Manual entry</span>}
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
  const mapBaseSaves = mapListFilter ? saves.filter(s => (s.folder || folderFor(s.category)) === mapListFilter) : saves;
  const scopeSaves = mapCat ? mapBaseSaves.filter(s => normaliseCategory(s.category) === mapCat) : mapBaseSaves;

  // Shared "scoped" view: a sticky map of the given spots + the spots listed below
  // (tap a card to pan the map). Used for both an open list and a Map-tab category.
  // The places list as a sheet that scrolls UP OVER the (sticky) map behind it.
  const renderSheet = (list, header) => (!list.length && !header) ? null : (
    <div style={{ position: "relative", zIndex: 10, background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -22, padding: "8px 0 14px", boxShadow: "0 -6px 18px rgba(0,0,0,0.12)" }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd6c8", margin: "2px auto 12px" }} />
      {header}
      {list.map(s => (
        <div key={s.id} style={{ position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(58,11,20,.13)", background: "#fff", marginBottom: 14 }}>
          <button onClick={() => removeSave(s.id)} title="Delete" style={{ position: "absolute", top: 8, right: 8, zIndex: 3, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          <div onClick={() => setDetailSpot(s)} style={{ cursor: "pointer" }}>
            <BigSpotCard s={s} photo={s.photo_url} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {!openFolder && (
      <div style={{ padding: "0 22px" }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#7A1E33", marginBottom: 4 }}>Saves<span style={{ color: "#BAD2E8" }}>.</span></div>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.42)", marginBottom: 18 }}>{saves.length} spot{saves.length !== 1 ? "s" : ""} · {folderNames.length} list{folderNames.length !== 1 ? "s" : ""}</div>
      </div>
      )}

      <div style={{ padding: "0 22px 12px" }}>
        {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}

        {!openFolder && (
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 0 }}>
            <button onClick={() => { setSavedView("folders"); setOpenFolder(null); }} style={{ padding: "7px 14px", borderRadius: 8, background: savedView === "folders" ? "#3A0B14" : "transparent", color: savedView === "folders" ? "#FAF7F2" : "rgba(58,11,20,.55)", border: savedView === "folders" ? "none" : "1px solid rgba(58,11,20,.16)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Lists</button>
            <button onClick={() => { setSavedView(savedView === "calendar" ? "folders" : "calendar"); setOpenFolder(null); }} style={{ padding: "7px 14px", borderRadius: 8, background: savedView === "calendar" ? "#3A0B14" : "transparent", color: savedView === "calendar" ? "#FAF7F2" : "rgba(58,11,20,.55)", border: savedView === "calendar" ? "none" : "1px solid rgba(58,11,20,.16)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Calendar</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setFolderLayout("grid")} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: folderLayout === "grid" ? "#3A0B14" : "transparent", border: "none", transition: "background .2s" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: 14, height: 14 }}>{[0,1,2,3].map(i => <div key={i} style={{ background: folderLayout === "grid" ? "#FAF7F2" : "rgba(58,11,20,.4)" }} />)}</div>
            </button>
            <button onClick={() => setFolderLayout("list")} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: folderLayout === "list" ? "#3A0B14" : "transparent", border: "none", transition: "background .2s" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 14, height: 14 }}>{[0,1,2].map(i => <div key={i} style={{ height: 2, background: folderLayout === "list" ? "#FAF7F2" : "rgba(58,11,20,.4)" }} />)}</div>
            </button>
          </div>
        )}

        {(parsing || saving) && parseStatus && !captureOpen && <div style={{ fontSize: 12, color: "#7A1E33", marginTop: 8 }}>{parseStatus}</div>}
      </div>

      {visible && tourStep >= 0 && !captureOpen && !(tourStep === 0 && parsing) && (
        <TourSpotlight targetRef={tourRef} step={tourStep} last={tourStep === 3} onDone={endTour} onSkip={endTour} />
      )}

      {!openFolder && captureOpen && (
        <div onClick={() => !parsing && !saving && setCaptureOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 1400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#FAF7F2", borderRadius: "22px 22px 0 0", padding: "22px 20px calc(22px + env(safe-area-inset-bottom))", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 1, letterSpacing: "-0.015em", color: "#3A0B14" }}>Save a spot</div>
                <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", marginTop: 6 }}>Screenshot a TikTok or Instagram post — we'll find the place.</div>
              </div>
              <button onClick={() => setCaptureOpen(false)} style={{ border: "none", background: "none", fontSize: "1.25rem", color: "rgba(58,11,20,.45)", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {!captureTab ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                {/* Main CTA — Upload screenshot */}
                <label style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: "#3A0B14", borderRadius: 16, cursor: parsing ? "default" : "pointer" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(250,247,242,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FAF7F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "#FAF7F2" }}>Upload a screenshot</div>
                    <div style={{ fontSize: 12, color: "rgba(250,247,242,.6)", marginTop: 2 }}>We'll read it and find the venue</div>
                  </div>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={parsing || saving}
                    onChange={e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) handleParse(f, "screenshot"); }} />
                </label>

                {/* Secondary buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button onClick={() => { setCaptureTab("link"); setError(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(58,11,20,.1)", cursor: "pointer" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(58,11,20,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#3A0B14" }}>Paste a link</span>
                  </button>
                  <button onClick={() => { setCaptureTab("manual"); setError(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(58,11,20,.1)", cursor: "pointer" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(58,11,20,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#3A0B14" }}>Search manually</span>
                  </button>
                </div>

                {error && <div className="err" style={{ marginTop: 4 }}>{error}</div>}

                {/* Step-by-step loading overlay */}
                {parsing && (
                  <div style={{ marginTop: 18, padding: "20px 18px", background: "#fff", borderRadius: 16, border: "1px solid rgba(58,11,20,.08)" }}>
                    {[
                      { key: "read", label: "Reading your screenshot..." },
                      { key: "spot", label: "Spotting the place name..." },
                      { key: "google", label: "Looking it up on Google Places..." },
                      { key: "photo", label: "Pulling photos, hours and price..." },
                    ].map((step, i) => {
                      const status = parseStatus || "";
                      const currentIdx = [/reading/i, /extract|venue/i, /google/i, /photo|fetching/i].findIndex(rx => rx.test(status));
                      const done = i < currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 3 ? 12 : 0, opacity: done || active ? 1 : 0.3 }}>
                          {done ? (
                            <span style={{ color: "#7A7A45", fontSize: 16, width: 20, textAlign: "center" }}>✓</span>
                          ) : active ? (
                            <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ width: 14, height: 14, border: "2px solid rgba(58,11,20,.15)", borderTopColor: "#7A7A45", borderRadius: "50%", animation: "spin .7s linear infinite", display: "block" }} />
                            </span>
                          ) : (
                            <span style={{ width: 20, textAlign: "center", color: "rgba(58,11,20,.2)", fontSize: 13 }}>○</span>
                          )}
                          <span style={{ fontSize: 15, fontWeight: done || active ? 500 : 400, color: done ? "#7A7A45" : active ? "#3A0B14" : "rgba(58,11,20,.35)" }}>{step.label}</span>
                        </div>
                      );
                    })}
                    <button onClick={() => { setBgParsing(true); setCaptureOpen(false); }} style={{ width: "100%", marginTop: 14, padding: "12px", background: "none", border: "1px solid rgba(58,11,20,.14)", borderRadius: 10, fontSize: 15, fontWeight: 500, color: "rgba(58,11,20,.5)", cursor: "pointer" }}>Continue browsing — we'll notify you</button>
                  </div>
                )}
              </div>
            ) : (
              <>
              <button onClick={() => setCaptureTab(null)} style={{ border: "none", background: "none", fontSize: 13, color: "#7A1E33", fontWeight: 600, cursor: "pointer", padding: "8px 0 12px" }}>← Back</button>

            {captureTab === "screenshot" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "34px 16px", border: "1.5px dashed rgba(58,11,20,.18)", borderRadius: 14, cursor: parsing ? "default" : "pointer", textAlign: "center" }}>
                  <span style={{ fontSize: "1.5rem" }}>⬆️</span>
                  <span style={{ fontSize: 16, color: "#3A0B14", fontWeight: 500 }}>{parsing ? "Reading…" : "Click to upload a screenshot"}</span>
                  <span style={{ fontSize: 12, color: "rgba(58,11,20,.45)" }}>PNG or JPG — pick several at once</span>
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={parsing || saving}
                    onChange={e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) handleParse(f, "screenshot"); }} />
                </label>
                <button onClick={addExample} disabled={parsing || saving} style={{ border: "none", background: "none", color: "#7A1E33", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "2px" }}>No screenshot handy? Try an example →</button>
              </div>
            )}

            {captureTab === "link" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, color: "rgba(58,11,20,.55)" }}>Paste a TikTok, Instagram or Google Maps link.</div>
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
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3A0B14", marginBottom: 6 }}>Place name</div>
                  <input className="input-field" value={mName} onChange={e => setMName(e.target.value)} placeholder="e.g. Dishoom Shoreditch" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3A0B14", marginBottom: 8 }}>Category <span style={{ color: "rgba(58,11,20,.45)", fontWeight: 400 }}>(optional)</span></div>
                  <select value={mCat} onChange={e => setMCat(e.target.value)} className="input-field" style={{ padding: "11px 12px" }}>
                    <option value="">None — we'll auto-detect it</option>
                    {MANUAL_CATS.map(([id, lbl]) => <option key={id} value={id}>{lbl}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3A0B14", marginBottom: 6 }}>Notes</div>
                  <textarea className="input-field" rows={3} value={mNotes} onChange={e => setMNotes(e.target.value)} placeholder="Why did you save this? Best time to go, what to order…" style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
                  <button onClick={() => setCaptureOpen(false)} style={{ border: "none", background: "none", color: "rgba(58,11,20,.55)", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                  <button onClick={manualSave} disabled={saving || !mName.trim()} style={{ border: "none", background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "11px 22px", fontWeight: 600, fontSize: 15, cursor: "pointer", opacity: (saving || !mName.trim()) ? 0.5 : 1 }}>{saving ? "Saving…" : "Save it"}</button>
                </div>
              </div>
            )}

            {(parsing || saving) && parseStatus && <div style={{ fontSize: 13, color: "#7A1E33", marginTop: 12 }}>{parseStatus}</div>}
            {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
              </>
            )}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#FAF7F2", overflowY: "auto", animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#FAF7F2", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(58,11,20,.1)" }}>
            <button onClick={() => setPreview([])} style={{ width: 36, height: 36, border: "1px solid rgba(58,11,20,.18)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>←</button>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22 }}>{preview.length} spot{preview.length !== 1 ? "s" : ""} found</div>
            <div style={{ width: 36 }} />
          </div>
          <div style={{ padding: "18px 22px 120px" }}>
            {preview.map((v, i) => {
              const cat = (v.category || "experience").toLowerCase();
              const photoSrc = v.photo_url || v._previewImage;
              return (
                <div key={i} onClick={() => setDetailSpot(v)} style={{ marginBottom: 18, background: "#fff", borderRadius: 14, border: "1px solid rgba(58,11,20,.1)", overflow: "hidden", boxShadow: "0 2px 8px rgba(58,11,20,.04)", cursor: "pointer" }}>
                  <div style={{ position: "relative", height: 200, background: "#F1EDE4" }}>
                    {photoSrc && <img src={photoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%, rgba(58,11,20,.8))" }} />
                    <button onClick={(e) => { e.stopPropagation(); removeDraft(i); }} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(58,11,20,.35)", backdropFilter: "blur(8px)", color: "#FAF7F2", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    {v._dup && <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", borderRadius: 8, background: "#7A1E33", color: "#fff", fontSize: 11, fontWeight: 600 }}>Already saved</div>}
                    <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
                      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1, color: "#FAF7F2", fontStyle: "italic" }}>{v.name}</div>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(58,11,20,.4)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      {v.area && <span>{v.area.toUpperCase()}</span>}
                      {v.area && v.price && <span style={{ color: "rgba(58,11,20,.2)" }}>·</span>}
                      {v.price && <span>{priceToPounds(v.price) || v.price}</span>}
                      {v.google_rating && <><span style={{ color: "rgba(58,11,20,.2)" }}>·</span><span style={{ color: "#D4CFC4" }}>★</span> <span>{v.google_rating}</span></>}
                      {v._google_found && <><span style={{ color: "rgba(58,11,20,.2)" }}>·</span><span style={{ color: "#7A1E33" }}>✓</span></>}
                    </div>
                    {v.comment && <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 15, lineHeight: 1.45, color: "rgba(58,11,20,.5)", marginBottom: 10 }}>{v.comment}</div>}
                    {v.vibe_tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {sortTags(v.vibe_tags).slice(0, 4).map((t, j) => <span key={j} style={tagStyle(t, { fontSize: 12, background: "#F1EDE4", color: "rgba(58,11,20,.5)", padding: "3px 9px", borderRadius: 8 })}>{tagLabel(t)}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {preview.some(d => d._dup) && (
              <div style={{ fontSize: 12, color: "#7A1E33", marginTop: 10 }}>
                {preview.filter(d => d._dup).length} duplicate{preview.filter(d => d._dup).length > 1 ? "s" : ""} will be skipped.
              </div>
            )}
          </div>
          {/* Fixed bottom bar: save button */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 22px calc(12px + env(safe-area-inset-bottom))", background: "#FAF7F2", borderTop: "1px solid rgba(58,11,20,.1)", zIndex: 11, display: "flex", gap: 10 }}>
            <button ref={tourSaveRef} onClick={() => setListPickerOpen(true)} style={{ flex: 1, padding: 16, background: "#3A0B14", color: "#BAD2E8", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
              {saveFolder && saveFolder !== "__new__" ? `Save to ${saveFolder}` : "Save to list"}
            </button>
          </div>

          {/* Pinterest-style list picker */}
          {listPickerOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#FAF7F2", animation: "screenIn .25s cubic-bezier(.2,.9,.3,1)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(58,11,20,.1)" }}>
                <button onClick={() => setListPickerOpen(false)} style={{ background: "none", border: "none", fontSize: 19, cursor: "pointer", color: "#3A0B14" }}>✕</button>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#3A0B14" }}>Save to</div>
                <div style={{ width: 24 }} />
              </div>
              <div style={{ padding: "12px 22px 8px" }}>
                <input value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="Search" style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(58,11,20,.12)", borderRadius: 10, background: "#F1EDE4", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 22px" }}>
                {/* Auto option */}
                <div onClick={() => { setSaveFolder(""); setListPickerOpen(false); saveAll(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(58,11,20,.06)", cursor: "pointer" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "#3A0B14", color: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>✦</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#3A0B14" }}>Auto — by category</div>
                    <div style={{ fontSize: 12, color: "rgba(58,11,20,.4)" }}>We'll sort them for you</div>
                  </div>
                </div>
                {/* Your boards */}
                {existingFolders.length > 0 && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(58,11,20,.35)", padding: "16px 0 6px" }}>Your lists</div>}
                {existingFolders.filter(f => !listSearch || f.toLowerCase().includes(listSearch.toLowerCase())).map(f => {
                  const folderItems = grouped[f] || [];
                  const thumb = folderItems.find(s => s.photo_url)?.photo_url;
                  return (
                    <div key={f} onClick={() => { setSaveFolder(f); setListPickerOpen(false); setListSearch(""); saveAll(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(58,11,20,.06)", cursor: "pointer" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "#F1EDE4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 19 }}>{f === "Restaurants" ? "🍽️" : f === "Bars" ? "🍸" : f === "Cafés" ? "☕" : "📁"}</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: "#3A0B14" }}>{f}</div>
                        <div style={{ fontSize: 12, color: "rgba(58,11,20,.35)" }}>{folderItems.length} spot{folderItems.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Create new board */}
              <div style={{ padding: "12px 22px calc(12px + env(safe-area-inset-bottom))", borderTop: "1px solid rgba(58,11,20,.1)" }}>
                {saveFolder === "__new__" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input autoFocus value={newFolder} onChange={e => setNewFolder(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newFolder.trim()) { setListPickerOpen(false); setListSearch(""); saveAll(); } }} placeholder="List name" style={{ flex: 1, padding: "12px 14px", border: "1px solid rgba(58,11,20,.14)", borderRadius: 10, fontSize: 16, outline: "none" }} />
                    <button onClick={() => { if (newFolder.trim()) { setListPickerOpen(false); setListSearch(""); saveAll(); } }} style={{ padding: "12px 20px", background: "#3A0B14", color: "#BAD2E8", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save</button>
                  </div>
                ) : (
                  <button onClick={() => setSaveFolder("__new__")} style={{ width: "100%", padding: 14, background: "#3A0B14", color: "#BAD2E8", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Create new list</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={tourListRef} style={{ padding: "0 0.75rem 1rem" }}>
        {saves.length > 0 && savedView === "map" && (
          <>
            <div style={{ padding: "0 0 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button onClick={() => { setSavedView("folders"); setMapListFilter(""); setMapCat(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#3A0B14", fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0 }}>← Close map</button>
              </div>
              {mapCats.length > 1 && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
                  <button onClick={() => { setMapCat(""); setMapListFilter(""); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${!mapCat ? "#3A0B14" : "rgba(58,11,20,.14)"}`, background: !mapCat ? "#3A0B14" : "#FAF7F2", color: !mapCat ? "#FAF7F2" : "#3A0B14", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>All</button>
                  {mapCats.map(c => (
                    <button key={c} onClick={() => { setMapCat(mapCat === c ? "" : c); setMapListFilter(""); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${mapCat === c ? "#3A0B14" : "rgba(58,11,20,.14)"}`, background: mapCat === c ? "#3A0B14" : "#FAF7F2", color: mapCat === c ? "#FAF7F2" : "#3A0B14", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{CAT_LABEL[c] || cap(c)}</button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <SpotsMap key={`maptab-${mapListFilter}-${mapCat}`} saves={scopeSaves} focusSpot={focusSpot} onCategory={setMapCat} />
            </div>
            {renderSheet(scopeSaves, (
              <div style={{ padding: "0 14px 12px" }}>
                {mapCat ? (
                  <>
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: "#3A0B14", marginBottom: ((mapCat === "bar" || mapCat === "nightlife") || scopeSaves.length > 1) ? 8 : 0 }}>{CAT_LABEL[mapCat] || cap(mapCat)} <span style={{ fontSize: 12, color: "rgba(58,11,20,.45)" }}>· {scopeSaves.length}</span></div>
                    {(mapCat === "bar" || mapCat === "nightlife")
                      ? <button onClick={() => onBarCrawl(scopeSaves)} style={{ width: "100%", border: "none", background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🍸 Planning a bar crawl? Tap here!</button>
                      : (scopeSaves.length > 1 && <button onClick={() => onBuildPlan(scopeSaves)} style={{ width: "100%", border: "none", background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✦ Build a plan from these</button>)}
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: "#3A0B14" }}>All spots <span style={{ fontSize: 12, color: "rgba(58,11,20,.45)" }}>· {scopeSaves.filter(s => s.lat && s.lng).length}</span></div>
                    {scopeSaves.length > 1 && <button onClick={() => onBuildPlan(scopeSaves)} style={{ border: "none", background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✦ Build a plan</button>}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        {saves.length > 0 && savedView === "calendar" && <SpotsCalendar saves={saves} user={user} onBuildPlan={onBuildPlan} onShare={onShare} plans={parentPlans} />}
        {saves.length > 0 && savedView === "list" && (
          <div>
            {saves.map(s => (
              <div key={s.id} onClick={() => setDetailSpot(s)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(58,11,20,.13)", cursor: "pointer" }}>
                {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 11, background: "#F1EDE4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.1rem" }}>{CAT_EMOJI[normaliseCategory(s.category)] || "📍"}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: "#3A0B14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)" }}>{[s.category ? cap(normaliseCategory(s.category)) : null, s.area, s.google_rating ? `⭐ ${s.google_rating}` : null].filter(Boolean).join(" · ")}</div>
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
            {saves.length > 0 && (() => {
              const recent = [...saves].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8);
              return recent.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, marginBottom: 10 }}>Recently saved</div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                    {recent.map(s => (
                      <PhotoCard key={s.id} v={s} width={200} height={250} nameSize={22} meta={s.area || cap(normaliseCategory(s.category))} onClick={() => setDetailSpot(s)} />
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24 }}>Your lists</div>
              </div>
              <button onClick={createFolder} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #7A1E33", background: "#fff", color: "#7A1E33", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>+ New list</button>
            </div>
            {creatingFolder && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="input-field" autoFocus placeholder="List name" value={folderDraft} onChange={e => setFolderDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmCreateFolder()} style={{ flex: 1, padding: "10px 12px" }} />
                <button onClick={confirmCreateFolder} style={{ border: "none", background: "#3A0B14", color: "#fff", borderRadius: 8, padding: "0 16px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Create</button>
                <button onClick={() => setCreatingFolder(false)} style={{ border: "none", background: "none", color: "rgba(58,11,20,.45)", fontSize: 15, cursor: "pointer" }}>Cancel</button>
              </div>
            )}
            {folderLayout === "grid" ? (
            <div data-tour="saves-lists" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, animation: "screenIn .28s cubic-bezier(.2,.9,.3,1)" }}>
              {folderNames.map((f, fi) => {
                const items = grouped[f] || [];
                const tints = { "Restaurants": "#7A1E33", "Bars": "#7A1E33", "Cafés": "#7A1E33", "Date night": "#7A1E33" };
                const tint = tints[f] || "#7A1E33";
                const fg = "#FAF7F2";
                const cardH = 220;
                return (
                  <div key={f} data-tour={fi === 0 ? "saves-list-card" : undefined} onClick={() => setOpenFolder(f)} style={{ cursor: "pointer", position: "relative", height: cardH, borderRadius: 14, overflow: "hidden", background: tint }}>
                    {(() => {
                      const photos = items.filter(s => s.photo_url).map(s => s.photo_url);
                      const ph = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
                      if (photos.length === 0) return (
                        <div style={{ height: cardH, background: tint, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, color: fg }}>{f.charAt(0)}</div>
                        </div>
                      );
                      if (photos.length === 1) return (
                        <div style={{ height: cardH, position: "relative", overflow: "hidden" }}>
                          <img src={photos[0]} alt="" style={ph} />
                          
                        </div>
                      );
                      if (photos.length === 2) return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, height: cardH }}>
                          <div style={{ position: "relative", overflow: "hidden" }}><img src={photos[0]} alt="" style={ph} /></div>
                          <div style={{ overflow: "hidden" }}><img src={photos[1]} alt="" style={ph} /></div>
                        </div>
                      );
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, height: cardH }}>
                          <div style={{ gridRow: "span 2", position: "relative", overflow: "hidden" }}><img src={photos[0]} alt="" style={ph} /></div>
                          <div style={{ overflow: "hidden" }}><img src={photos[1]} alt="" style={ph} /></div>
                          <div style={{ overflow: "hidden" }}><img src={photos[2]} alt="" style={ph} /></div>
                        </div>
                      );
                    })()}
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, pointerEvents: "none" }}>
                      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, lineHeight: 1.05, color: "#FAF7F2" }}>{f}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E9E4DA", marginTop: 4 }}>{items.length} spot{items.length !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
            <div data-tour="saves-lists" style={{ animation: "screenIn .28s cubic-bezier(.2,.9,.3,1)" }}>
              {folderNames.map((f, fi) => {
                const items = grouped[f] || [];
                const tints = { "Restaurants": "#7A1E33", "Bars": "#7A1E33", "Cafés": "#7A1E33", "Date night": "#7A1E33" };
                const tint = tints[f] || "#7A1E33";
                const fg = "#FAF7F2";
                return (
                  <div key={f} onClick={() => setOpenFolder(f)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid rgba(58,11,20,.13)", cursor: "pointer" }}>
                    <div style={{ width: 54, height: 54, flex: "none", background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24 }}>{f.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24 }}>{f}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(58,11,20,.45)", marginTop: 5 }}>{items.length} spot{items.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ color: "rgba(58,11,20,.3)", fontSize: 19 }}>›</div>
                  </div>
                );
              })}
            </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: "1rem" }}>
              <button data-tour="saves-build" className="btn btn-teal" style={{ marginTop: 0, flex: 1 }} onClick={() => onBuildPlan(saves)}>Build a plan ✦</button>
              <button className="btn-outline" style={{ marginTop: 0, flex: 1 }} onClick={() => setDiscoverMode(true)}>Discover more?</button>
            </div>
          </>
        )}
        {saves.length > 0 && savedView === "folders" && openFolder && (
          <div ref={folderSwipeRef} style={{ background: "#FAF7F2", minHeight: "60vh", animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
            {menuFolder && <div onClick={() => setMenuFolder(null)} style={{ position: "fixed", inset: 0, zIndex: 15 }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 16px" }}>
              <div onClick={() => { setOpenFolder(null); setFocusSpot(null); }} style={{ width: 36, height: 36, border: "1px solid rgba(58,11,20,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>←</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div onClick={() => {
                  const spots = folderSaves.map(s => `${s.name}${s.area ? ` — ${s.area}` : ""}`).join("\n");
                  const text = `${openFolder}\n${folderSaves.length} spots\n\n${spots}`;
                  if (navigator.share) navigator.share({ title: openFolder, text }).catch(() => {});
                  else { navigator.clipboard.writeText(text); }
                }} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(58,11,20,.45)" }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </div>
                <div onClick={() => setMenuFolder(menuFolder === openFolder ? null : openFolder)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(58,11,20,.45)", position: "relative" }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                  {menuFolder === openFolder && (
                    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 42, right: 0, background: "#FAF7F2", border: "1px solid rgba(58,11,20,.1)", borderRadius: 12, boxShadow: "0 8px 28px rgba(58,11,20,.14)", minWidth: 180, zIndex: 20, animation: "fadeIn .15s", overflow: "hidden" }}>
                      <div onClick={() => renameFolder(openFolder)} style={{ padding: "14px 16px", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid rgba(58,11,20,.06)" }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(58,11,20,.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Rename list
                      </div>
                      <div onClick={() => deleteFolder(openFolder)} style={{ padding: "14px 16px", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 11, color: "#7A1E33" }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#7A1E33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Delete list
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {renamingFolder === openFolder ? (
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                <input autoFocus value={renameDraft} onChange={e => setRenameDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmRename(openFolder)} style={{ flex: 1, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, lineHeight: 1, border: "none", borderBottom: "2px solid #3A0B14", background: "transparent", outline: "none", padding: "4px 0" }} />
                <button onClick={() => confirmRename(openFolder)} style={{ padding: "8px 16px", background: "#3A0B14", color: "#FAF7F2", border: "none", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Save</button>
                <button onClick={() => { setRenamingFolder(null); setRenameDraft(""); }} style={{ padding: "8px 12px", background: "transparent", border: "1px solid rgba(58,11,20,.18)", fontSize: 13, cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 40, lineHeight: 1, letterSpacing: "-0.015em", marginBottom: 4 }}>{openFolder}</div>
            )}
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.42)", marginBottom: 18 }}>{folderSaves.length} spot{folderSaves.length !== 1 ? "s" : ""}</div>

            {folderSaves.length > 0 && folderSaves.some(s => s.lat && s.lng) && (
              <div onClick={() => setSavedView("map")} style={{ margin: "0 0 18px", height: 142, overflow: "hidden", position: "relative", background: "#F1EDE4", border: "1px solid rgba(58,11,20,.1)", cursor: "pointer" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(58,11,20,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(58,11,20,.07) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
                {folderSaves.filter(s => s.lat && s.lng).slice(0, 5).map((s, i) => (
                  <div key={i} style={{ position: "absolute", left: `${18 + i * 15}%`, top: `${30 + (i % 3) * 20}%`, width: 10, height: 10, borderRadius: "50%", background: "#3A0B14", boxShadow: i === 0 ? "0 0 0 5px rgba(217,65,43,.16)" : "none" }} />
                ))}
                <div style={{ position: "absolute", left: 13, bottom: 12, fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.5)" }}>{openFolder} on the map</div>
                <div style={{ borderRadius: 8, position: "absolute", right: 11, bottom: 10, padding: "7px 13px", background: "#3A0B14", color: "#FAF7F2", fontSize: 12, fontWeight: 600 }}>Open ›</div>
              </div>
            )}

            {folderSaves.length > 0 && (
              <div onClick={() => onBuildPlan(folderSaves)} style={{ margin: "0 0 18px", padding: 14, background: "#7A1E33", color: "#FAF7F2", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ flex: 1, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, lineHeight: 1.15 }}>Route these into one evening</div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Build →</div>
              </div>
            )}

            {folderSaves.length === 0 && <div style={{ fontSize: 15, color: "rgba(58,11,20,.5)" }}>No spots in this list yet.</div>}

            {folderSaves.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {folderSaves.map(s => (
                  <PhotoCard key={s.id} v={s} width="100%" height={250} nameSize={26} meta={[s.area, priceToPounds(s.price) || s.price, s.google_rating ? `${s.google_rating} ★` : null].filter(Boolean).join(" · ")} onClick={() => setDetailSpot(s)} style={{ scrollSnapAlign: "none" }} />
                ))}
              </div>
            )}
          </div>
        )}
        {saves.length === 0 && preview.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📌</div>
            <div className="empty-title">No saved spots yet</div>
            <div className="empty-sub">Tap the + button to save a place from a screenshot, link, or by name.</div>
          </div>
        )}
      </div>

      {infoToast && (
        <div style={{ position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)", zIndex: 2000, padding: "10px 20px", background: "#3A0B14", color: "#FAF7F2", borderRadius: 8, fontSize: 15, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,.18)", animation: "fadeIn .2s", whiteSpace: "nowrap" }}>{infoToast}</div>
      )}

      {bgDone && preview.length > 0 && (
        <div onClick={() => { setBgDone(false); setActiveTab("saved"); }} style={{ position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)", zIndex: 2000, padding: "10px 18px", background: "#7A1E33", color: "#FAF7F2", borderRadius: 14, fontSize: 15, fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,.2)", animation: "fadeIn .25s", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          <span>✦ {preview.length} spot{preview.length !== 1 ? "s" : ""} found</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Tap to review</span>
        </div>
      )}

      {successVenue && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "2rem 1.5rem", textAlign: "center", maxWidth: 280, animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✨</div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.1rem", color: "#3A0B14", marginBottom: 6 }}>Saved!</div>
            <div style={{ fontSize: 15, color: "rgba(58,11,20,.55)" }}>{successVenue}</div>
            <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", marginTop: 4 }}>Added to your collection</div>
          </div>
        </div>
      )}

      {calendarPrompt && !successVenue && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, animation: "fadeIn .2s" }}>
          <div style={{ background: "#FAF7F2", borderRadius: 16, padding: "24px 22px", maxWidth: 300, width: "90%", textAlign: "center", animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 23, marginBottom: 4 }}>Add to calendar?</div>
            <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", marginBottom: 18 }}>Schedule {calendarPrompt.spots.length === 1 ? calendarPrompt.spots[0].name : `${calendarPrompt.spots.length} spots`} for a date</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { setCalendarPrompt(null); setSavedView("calendar"); }} style={{ padding: 14, background: "#3A0B14", color: "#BAD2E8", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Pick a date</button>
              {calendarPrompt.spots.length === 1 && (() => {
                const s = calendarPrompt.spots[0];
                const p = new URLSearchParams({ action: "TEMPLATE", text: s.name || "Visit", details: s.comment || "", location: s.address || s.area || "London" });
                return <a href={`https://calendar.google.com/calendar/render?${p.toString()}`} target="_blank" rel="noreferrer" onClick={() => setCalendarPrompt(null)} style={{ padding: 12, border: "1px solid rgba(58,11,20,.14)", borderRadius: 10, fontSize: 15, fontWeight: 500, color: "#3A0B14", textDecoration: "none", cursor: "pointer" }}>Add to Google Calendar</a>;
              })()}
              <button onClick={() => setCalendarPrompt(null)} style={{ padding: 10, background: "none", border: "none", fontSize: 15, color: "rgba(58,11,20,.4)", cursor: "pointer" }}>Not now</button>
            </div>
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
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.05rem", color: "#3A0B14", marginBottom: 4 }}>Move to list</div>
            <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movingSpot.name}</div>
            <button onClick={() => moveSpot(movingSpot, null)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", fontSize: 15, color: "#3A0B14", marginBottom: 8 }}>✨ Auto — by category</button>
            {folderNames.map(f => (
              <button key={f} onClick={() => moveSpot(movingSpot, f)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", fontSize: 15, color: "#3A0B14", marginBottom: 8 }}>📁 {f}</button>
            ))}
            <button onClick={() => { const n = (window.prompt("New list name") || "").trim(); if (n) moveSpot(movingSpot, n); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 8, border: "1.5px solid #7A1E33", background: "#fff", cursor: "pointer", fontSize: 15, color: "#7A1E33", fontWeight: 600, marginBottom: 8 }}>+ New list…</button>
            <button onClick={() => setMovingSpot(null)} style={{ display: "block", width: "100%", textAlign: "center", padding: "10px", borderRadius: 8, border: "none", background: "#F1EDE4", cursor: "pointer", fontSize: 13, color: "rgba(58,11,20,.55)" }}>Cancel</button>
          </div>
        </div>
      )}

      {discoverMode && (() => {
        if (!discoverPairs.length) {
          const seedSpots = discoverSeed || saves;
          const savedIds = new Set(saves.map(s => s.id));
          const savedCats = seedSpots.map(s => (s.category || "").toLowerCase()).filter(Boolean);
          const savedVibes = seedSpots.flatMap(s => s.vibe_tags || []);
          const seedAreas = seedSpots.map(s => (s.zone || s.area || "").toLowerCase()).filter(Boolean);
          const topCats = [...new Map(savedCats.map(c => [c, savedCats.filter(x => x === c).length])).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
          const topVibes = [...new Set(savedVibes)].slice(0, 8);
          const candidates = (dbVenues || []).filter(v => v.photo_url && v.name && !savedIds.has(v.id));
          const scored = candidates.map(v => {
            let s = 0;
            if (topCats.includes((v.category || "").toLowerCase())) s += 5;
            if ((v.vibe_tags || []).some(t => topVibes.includes(t))) s += 3;
            if (seedAreas.includes((v.zone || v.area || "").toLowerCase())) s += 2;
            if (v.google_rating >= 4.3) s += 1;
            return { ...v, _score: s + Math.random() * 0.5 };
          }).sort((a, b) => b._score - a._score).slice(0, 20);
          if (scored.length) { setDiscoverPairs(scored); setDiscoverIdx(0); }
          else { setDiscoverMode(false); return null; }
        }
        const current = discoverPairs[discoverIdx];
        if (!current) { setDiscoverMode(false); return null; }

        function advance() {
          if (discoverIdx < discoverPairs.length - 1) setDiscoverIdx(discoverIdx + 1);
          else { setDiscoverMode(false); setDiscoverPairs([]); setDiscoverSeed(null); loadSaves(); }
        }
        async function saveVenue() {
          haptic(12); blip(660);
          const v = current;
          const row = { user_id: user.id, name: v.name, address: v.address, area: v.area, zone: v.zone, category: v.category, price: v.price, vibe_tags: v.vibe_tags || [], comment: v.comment, lat: v.lat, lng: v.lng, google_place_id: v.google_place_id, google_rating: v.google_rating, photo_url: v.photo_url, source_type: "discover", status: "pending" };
          try { await supabase.from("experiences").insert(row); mpPlaceSaved(user, { save_method: "tap_save", place_category: v.category, area: v.area }); } catch {}
          advance();
        }

        // Swipe handling
        let startX = 0, currentX = 0, swiping = false;
        function onTouchStart(e) { startX = e.touches[0].clientX; currentX = 0; swiping = true; }
        function onTouchMove(e) { if (!swiping) return; currentX = e.touches[0].clientX - startX; const card = e.currentTarget; card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`; card.style.opacity = Math.max(0.5, 1 - Math.abs(currentX) / 400); }
        function onTouchEnd(e) {
          swiping = false; const card = e.currentTarget; card.style.transition = "transform 0.3s, opacity 0.3s";
          if (currentX > 100) { card.style.transform = "translateX(400px) rotate(15deg)"; card.style.opacity = "0"; setTimeout(saveVenue, 250); }
          else if (currentX < -100) { card.style.transform = "translateX(-400px) rotate(-15deg)"; card.style.opacity = "0"; setTimeout(advance, 250); }
          else { card.style.transform = ""; card.style.opacity = ""; }
          setTimeout(() => { card.style.transition = ""; }, 300);
        }

        async function loadPhotos() {
          if (extraPhotos.length || !current.google_place_id) return;
          setPhotosLoading(true);
          try {
            const r = await fetch("/api/saved-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "photos", place_id: current.google_place_id }) });
            const j = await r.json();
            if (j.found) setExtraPhotos(j.urls || []);
          } catch {}
          setPhotosLoading(false);
        }
        function tapCard() {
          if (cardFace === 0) setCardFace(1);
          else if (cardFace === 1) { setCardFace(2); loadPhotos(); }
          else setCardFace(0);
        }
        return (
          <div style={{ position: "fixed", inset: 0, background: "#3A0B14", zIndex: 1300, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "max(1.25rem, env(safe-area-inset-top)) 1.25rem 0" }}>
              <button onClick={() => { setDiscoverMode(false); setDiscoverPairs([]); setDiscoverSeed(null); loadSaves(); }} style={{ border: "none", background: "none", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>← Done</button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{discoverIdx + 1} / {discoverPairs.length}</div>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.25rem", position: "relative" }}>
              <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: "1.2rem", color: "rgba(255,255,255,0.2)", pointerEvents: "none" }}>‹</div>
              <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "1.2rem", color: "rgba(255,255,255,0.2)", pointerEvents: "none" }}>›</div>
              {(() => {
                const vibeMap = { chill: "Laid-back vibes", romantic: "Date-night worthy", chaotic: "Beautifully chaotic", cultural: "A proper cultural hit", fancy: "Dress up for this one", hidden_gems: "One the locals keep quiet", social: "Bring the whole crew", solo: "Perfect solo mission", foodie: "Serious food credentials", aesthetic: "Looks incredible", iconic: "A London icon", underground: "Under the radar", outdoor: "Fresh air guaranteed" };
                const vibeDesc = (current.vibe_tags || []).slice(0, 2).map(t => vibeMap[t] || t.replace(/_/g, " ")).join(". ") + ".";
                const catEmoji = { restaurant: "🍽️", bar: "🍸", cafe: "☕", market: "🛍️", experience: "✨", outdoor: "🌿", museum: "🏛️", gallery: "🎨", nightlife: "🌙" };
                return (
                  <div key={discoverIdx}
                    onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                    onClick={tapCard}
                    style={{ width: "100%", maxWidth: 360, height: 420, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.22)", position: "relative", cursor: "pointer" }}>
                    {cardFace === 0 && (
                      <div style={{ height: "100%", position: "relative", animation: "fadeIn 0.3s" }}>
                        <img src={current.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%, rgba(0,0,0,0.7))" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px" }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)", lineHeight: 1.15 }}>{current.name}</div>
                          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", marginTop: 5 }}>{[catEmoji[normaliseCategory(current.category)] || "✨", current.area, current.google_rating ? `⭐ ${current.google_rating}` : null, current.price].filter(Boolean).join(" · ")}</div>
                        </div>
                        <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>tap to read more</div>
                      </div>
                    )}
                    {cardFace === 1 && (
                      <div style={{ height: "100%", background: "#B8D8E8", color: "#8B162B", padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center", animation: "fadeIn 0.3s" }}>
                        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.4rem", lineHeight: 1.2, marginBottom: 6 }}>{current.name}</div>
                        {(current.area || current.zone) && <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14 }}>📍 {current.area || current.zone}</div>}
                        {current.comment && <div style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 14 }}>{current.comment}</div>}
                        {vibeDesc && <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{vibeDesc}</div>}
                        {current.price && <div style={{ fontSize: 15, marginBottom: 6 }}>💰 {current.price}</div>}
                        {current.google_rating && <div style={{ fontSize: 15, opacity: 0.7 }}>⭐ {current.google_rating}{current.google_review_count ? ` · ${current.google_review_count.toLocaleString()} reviews` : ""}</div>}
                        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 18, textAlign: "center" }}>tap for photos</div>
                      </div>
                    )}
                    {cardFace === 2 && (
                      <div style={{ height: "100%", background: "#3A0B14", overflowY: "auto", animation: "fadeIn 0.3s" }}>
                        {photosLoading && <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", fontSize: 15 }}>Loading photos…</div>}
                        {!photosLoading && extraPhotos.length === 0 && <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <img src={current.photo_url} alt="" style={{ width: "100%", height: "60%", objectFit: "cover" }} />
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>No extra photos available</div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>tap to go back</div>
                        </div>}
                        {!photosLoading && extraPhotos.length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                            {[current.photo_url, ...extraPhotos].map((url, i) => (
                              <img key={i} src={url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
                            ))}
                          </div>
                        )}
                        {!photosLoading && extraPhotos.length > 0 && <div style={{ textAlign: "center", padding: "10px", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>tap to go back</div>}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 28, padding: "16px 0 max(28px, env(safe-area-inset-bottom))" }}>
              <button onClick={(e) => { const b = e.currentTarget; b.style.transition = "transform 0.2s ease"; b.style.transform = "scale(1.3)"; setTimeout(() => { b.style.transform = "scale(1)"; }, 200); advance(); }}
                style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", fontSize: "1.5rem", cursor: "pointer", color: "#fff", transition: "transform 0.2s" }}>✕</button>
              <button onClick={(e) => { const b = e.currentTarget; b.style.transition = "transform 0.2s ease, box-shadow 0.2s ease"; b.style.transform = "scale(1.35)"; b.style.boxShadow = "0 0 24px rgba(114,106,78,0.6)"; setTimeout(() => { b.style.transform = "scale(1)"; b.style.boxShadow = "0 2px 12px rgba(114,106,78,0.3)"; }, 250); saveVenue(); }}
                style={{ width: 60, height: 60, borderRadius: "50%", border: "none", background: "#3A0B14", color: "#fff", fontSize: "1.5rem", cursor: "pointer", boxShadow: "0 2px 12px rgba(114,106,78,0.3)", transition: "transform 0.2s, box-shadow 0.2s" }}>♥</button>
            </div>
          </div>
        );
      })()}

      {bucketListPicker && (
        <div onClick={() => setBucketListPicker(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.05rem", color: "#3A0B14", marginBottom: 4 }}>Add to bucket list</div>
            <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bucketListPicker.name}</div>
            {blLoading && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)" }}>Loading lists...</div>}
            {!blLoading && bucketLists.length === 0 && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)", marginBottom: 12 }}>No bucket lists yet. Create one in the People tab.</div>}
            {!blLoading && bucketLists.map(l => (
              <button key={l.id} onClick={() => addSpotToBucketList(l.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", fontSize: 15, color: "#3A0B14", marginBottom: 8 }}>{l.emoji || "✨"} {l.name}</button>
            ))}
            <button onClick={() => setBucketListPicker(null)} style={{ display: "block", width: "100%", textAlign: "center", padding: "10px", borderRadius: 8, border: "none", background: "#F1EDE4", cursor: "pointer", fontSize: 13, color: "rgba(58,11,20,.55)", marginTop: 4 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Splash / value prop — one screen, one CTA. Warm, editorial, type-led (no imagery).
function Splash({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "#3A0B14", color: "#FAF7F2", display: "flex", flexDirection: "column", maxWidth: 420, margin: "0 auto", animation: "screenIn .4s cubic-bezier(.2,.9,.3,1)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 40px", textAlign: "center" }}>
        {/* cuRATED. wordmark with twinkling stars around it */}
        <div style={{ position: "relative", padding: "40px 30px", animation: "logoIn .7s cubic-bezier(.2,.9,.3,1)" }}>
          {[[6, 8, 22, 0], [88, 12, 16, .6], [0, 62, 14, 1.1], [94, 70, 20, .3], [48, -6, 12, .9], [30, 100, 16, 1.4], [72, 98, 12, .2]].map(([x, y, size, delay], i) => (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ position: "absolute", left: `${x}%`, top: `${y}%`, marginLeft: -size / 2, marginTop: -size / 2, animation: `twinkle ${2.2 + (i % 3) * 0.5}s ease-in-out ${delay}s infinite`, color: i % 3 === 0 ? "#BAD2E8" : "#FAF7F2" }}>
              <path d="M12 2c.6 5.6 4.4 9.4 10 10-5.6.6-9.4 4.4-10 10-.6-5.6-4.4-9.4-10-10 5.6-.6 9.4-4.4 10-10z" fill="currentColor" />
            </svg>
          ))}
          <div aria-label="cuRATED" style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 400, fontSize: 44, lineHeight: 1, letterSpacing: "-0.03em", color: "#FAF7F2", whiteSpace: "nowrap" }}>cu<span style={{ fontWeight: 900, color: "#BAD2E8" }}>RATED</span><span style={{ fontWeight: 900, color: "#FAF7F2" }}>.</span></div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(250,247,242,.55)" }}>Your saved places, actually planned</div>
      </div>
      <div style={{ padding: "0 28px 54px" }}>
        <button onClick={onStart} style={{ width: "100%", padding: 16, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "transform .18s" }}>Get started</button>
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

  // The login screen serves both new and returning people. A device that has signed
  // in before fires login_started instead of signup_started, so repeat logins don't
  // inflate the signup funnel.
  function mpAuthStarted(method) {
    const returning = hasLoggedInBefore();
    mp(returning ? "login_started" : "signup_started", { acquisition_source: acquisitionSource(), device_os: deviceType(), user_type: returning ? "returning" : "new_signup", signup_method: method, ...utm() });
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    mpAuthStarted("google");
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
    if (!isResend) mpAuthStarted("email");
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

  const inputStyle = { width: "100%", padding: "13px 15px", borderRadius: 8, border: "1.5px solid rgba(58,11,20,.18)", background: "#fff", color: "#3A0B14", fontFamily: "inherit", fontSize: 16, boxSizing: "border-box", textAlign: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "#3A0B14", color: "#FAF7F2", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px", maxWidth: 420, margin: "0 auto", animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.015em", marginBottom: 8 }}>Welcome back</div>
      <div style={{ fontSize: 15, color: "rgba(250,247,242,.55)", marginBottom: 30 }}>Sign in to sync your saves and plans.</div>
      {error && <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(217,65,43,.2)", color: "#7A1E33", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={signInWithGoogle} disabled={loading} style={{ width: "100%", padding: 15, background: "#FAF7F2", color: "#3A0B14", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0", color: "rgba(250,247,242,.35)", fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase" }}><div style={{ flex: 1, height: 1, background: "rgba(250,247,242,.15)" }} />or<div style={{ flex: 1, height: 1, background: "rgba(250,247,242,.15)" }} /></div>

        {stage === "email" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendCode()} style={{ ...inputStyle, background: "transparent", color: "#FAF7F2", border: "1px solid rgba(250,247,242,.2)" }} />
            <button onClick={() => sendCode()} disabled={otpBusy} style={{ width: "100%", padding: 15, border: "1px solid #7A1E33", background: "none", color: "#7A1E33", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{otpBusy ? "Sending…" : "Continue with email"}</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 15, color: "rgba(250,247,242,.55)" }}>We sent a 6-digit code to <strong style={{ color: "#FAF7F2" }}>{email}</strong>.</div>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && verifyCode()} style={{ ...inputStyle, background: "transparent", color: "#FAF7F2", border: "1px solid rgba(250,247,242,.2)", letterSpacing: "0.4em", fontSize: 23, fontWeight: 600, textAlign: "center" }} />
            <button onClick={verifyCode} disabled={otpBusy} style={{ width: "100%", padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{otpBusy ? "Verifying…" : "Verify & sign in"}</button>
            {resent && <div style={{ fontSize: 13, color: "#7A1E33", fontWeight: 600 }}>✓ New code sent</div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <button onClick={() => { setStage("email"); setOtp(""); setError(null); }} style={{ border: "none", background: "none", color: "rgba(250,247,242,.5)", cursor: "pointer" }}>← Change email</button>
              <button onClick={() => sendCode(true)} disabled={otpBusy || cooldown > 0} style={{ border: "none", background: "none", color: cooldown > 0 ? "rgba(250,247,242,.3)" : "#7A1E33", fontWeight: 600, cursor: cooldown > 0 ? "default" : "pointer" }}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 22, fontSize: 12, color: "rgba(250,247,242,.4)", textAlign: "center", lineHeight: 1.5 }}>
        By continuing you agree to our <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: "rgba(250,247,242,.7)", textDecoration: "underline" }}>Privacy Policy</a>.
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
const OB_STEP_NAMES = ["location", "name", "interests", "vibe", "taste_game"];
// Venues every new user sees in the this-or-that game (owner's picks, 2026-11-16).
// Matched by name against the catalogue; any that are missing are skipped.
const OB_STARTERS = ["Bar Levan", "Brat", "Red Room", "Fatt Pundit", "HOKO Hong Kong Cafe", "Fink's at Clissold House"];
function Onboarding({ user, dbVenues, onDone }) {
  const [step, setStep] = useState(0);
  const obStart = useRef(Date.now());
  useEffect(() => { mp("onboarding_step_viewed", { step_name: OB_STEP_NAMES[step] || "step_" + step, step_index: step, device_os: deviceType(), attributed_source: acquisitionSource() }); }, [step]);
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
    const norm = (t) => String(t || "").toLowerCase().replace(/[’']/g, "");
    const starters = OB_STARTERS.map(n => photo.find(v => norm(v.name).startsWith(norm(n)))).filter(Boolean);
    // Starters fill the first slots, then the taste axes pick the rest at random.
    const pick = (pred, cat) => {
      const st = starters.find(v => !used.has(v.id) && (!cat || v.category === cat));
      if (st) { used.add(st.id); return st; }
      const c = photo.filter(v => !used.has(v.id) && (!cat || v.category === cat) && pred(v)); if (!c.length) return null; const v = c[Math.floor(Math.random() * c.length)]; used.add(v.id); return v;
    };
    // Each pair compares like with like: bar vs bar, restaurant vs restaurant.
    const out = [];
    for (const ax of OB_AXES) {
      const a = pick(ax.A) || pick(() => true);
      if (!a) continue;
      const b = pick(ax.B, a.category) || pick(() => true, a.category) || pick(ax.B) || pick(() => true);
      if (b) out.push({ key: ax.key, a, b });
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
    else finish(nextLiked, { ...choices, [pair.key]: pole });
  }
  const skipAxis = () => { if (axisIdx < pairs.length - 1) setAxisIdx(axisIdx + 1); else finish(liked, choices); };

  async function finish(likedIds, finalChoices = choices) {
    setSaving(true);
    const clean = name.trim() || "there";
    try { await supabase.auth.updateUser({ data: { full_name: clean, onboarded: true, interests, vibe, taste_axes: finalChoices } }); } catch (e) {}
    try { await supabase.from("profiles").upsert({ id: user.id, name: clean, email: user.email }); } catch (e) {}
    const likedVenues = dbVenues.filter(v => likedIds.includes(v.id));
    mp("taste_game_completed", { taste_profile_score: Math.round(100 * Object.keys(finalChoices).length / Math.max(1, pairs.length)), onboarding_session_duration_sec: Math.round((Date.now() - obStart.current) / 1000), attributed_source: acquisitionSource() });
    if (likedVenues.length) {
      const FOLDER = { restaurant: "Restaurants", cafe: "Cafés", bar: "Bars", nightlife: "Nightlife", market: "Markets", outdoor: "Outdoor", museum: "Museums", gallery: "Galleries", experience: "Experiences", event: "Events" };
      const rows = likedVenues.map(v => { const { id, user_id, created_at, ...rest } = v; return { ...rest, user_id: user.id, folder: FOLDER[String(v.category || "").toLowerCase()] || "Other", status: "pending", source_type: "quiz" }; });
      try {
        const { error } = await supabase.from("experiences").insert(rows);
        // Quiz picks are real saves: count them like any other so Mixpanel's save
        // funnel matches the database.
        if (!error) for (const v of likedVenues) mpPlaceSaved(user, { save_method: "quiz", place_category: v.category, area: v.area });
      } catch (e) {}
    }
    try { localStorage.setItem("cl_onboarded_" + user.id, "1"); localStorage.setItem("cl_interests", JSON.stringify(interests)); localStorage.setItem("cl_vibe", JSON.stringify(vibe)); } catch (e) {}
    setSaving(false);
    onDone(likedVenues.length);
  }
  const next = () => setStep(step + 1);
  const chip = (sel) => ({ padding: "10px 16px", borderRadius: 8, border: sel ? "1.5px solid #7A1E33" : "1.5px solid rgba(58,11,20,.18)", background: sel ? "#7A1E33" : "#fff", color: sel ? "#fff" : "#4a4438", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" });
  const h = { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.7rem", color: "#3A0B14", marginBottom: 6 };
  const sub = { fontSize: 16, color: "rgba(58,11,20,.45)", marginBottom: 20, lineHeight: 1.5 };
  const showFooter = step >= 1 && step <= 3;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EDE4", display: "flex", flexDirection: "column", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ padding: "2.5rem 1.5rem 0.5rem" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? "#7A1E33" : "rgba(58,11,20,.18)", transition: "0.3s" }} />)}
        </div>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ border: "none", background: "none", color: "rgba(58,11,20,.45)", fontSize: 15, cursor: "pointer", padding: 0 }}>← Back</button>}
      </div>

      <div style={{ flex: 1, padding: "0.75rem 1.5rem", overflowY: "auto" }}>
        {step === 0 && (<>
          <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>📍</div>
          <div style={h}>Show places near you?</div>
          <p style={sub}>We use your location to centre the map and surface what's close. You can just browse everything instead.</p>
          <button onClick={() => chooseLocation("allow")} style={{ width: "100%", padding: "14px", borderRadius: 8, border: "none", background: "#3A0B14", color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 10 }}>Allow location</button>
          <button onClick={() => chooseLocation("london")} style={{ width: "100%", padding: "14px", borderRadius: 8, border: "1.5px solid rgba(58,11,20,.18)", background: "#fff", color: "rgba(58,11,20,.6)", fontSize: 16, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Just browse instead</button>
        </>)}

        {step === 1 && (<>
          <div style={h}>What's your name?</div>
          <p style={sub}>So we can make Curated feel like yours.</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" autoFocus onKeyDown={e => e.key === "Enter" && canNext && next()} style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1.5px solid rgba(58,11,20,.18)", background: "#fff", fontSize: "1rem", fontFamily: "inherit", color: "#3A0B14", boxSizing: "border-box" }} />
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
          pairs.length === 0 ? <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)" }}>Loading places…</div> : (() => {
            const pair = pairs[axisIdx];
            return (<>
              <div style={h}>Which would you save?</div>
              <p style={sub}>Tap the one you'd rather go to. <span style={{ color: "#c9bfae" }}>({axisIdx + 1} of {pairs.length})</span></p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["a", pair.a], ["b", pair.b]].map(([pole, v]) => { const on = tapped === v.id; return (
                  <button key={v.id} onClick={() => tapChoose(pair, pole, v)} style={{ position: "relative", border: "none", padding: 0, borderRadius: 14, overflow: "hidden", cursor: "pointer", aspectRatio: "4 / 3", width: "100%", background: "#e9e4da", animation: on ? "tapPulse 0.3s ease" : undefined, outline: on ? "3px solid #7A1E33" : "none", outlineOffset: -3, opacity: tapped && !on ? 0.5 : 1, transition: "opacity 0.2s" }}>
                    <img src={v.photo_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: on ? "rgba(58,11,20,0.35)" : "linear-gradient(rgba(58,11,20,0) 45%, rgba(58,11,20,.82))" }} />
                    <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, textAlign: "left", color: "#FAF7F2" }}>
                      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1.05 }}>{v.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E9E4DA", marginTop: 5 }}>{[cap(v.category || ""), v.area].filter(Boolean).join(" · ")}</div>
                    </div>
                    {on && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 62, height: 62, borderRadius: "50%", background: "#fff", color: "#7A1E33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.9rem", animation: "burstIn 0.3s ease", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>♥</div></div>}
                  </button>
                ); })}
              </div>
              <button onClick={skipAxis} disabled={saving} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: "rgba(58,11,20,.45)", fontSize: 15, marginTop: 14, cursor: "pointer" }}>{saving ? "Setting up…" : "No preference →"}</button>
            </>);
          })()
        )}
      </div>

      {showFooter && (
        <div style={{ padding: "0.75rem 1.5rem 1.5rem" }}>
          <button onClick={next} disabled={!canNext} style={{ width: "100%", padding: "15px", borderRadius: 8, border: "none", background: canNext ? "#7A1E33" : "#cfc6b5", color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "inherit", cursor: canNext ? "pointer" : "default" }}>Continue</button>
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

  const [done, setDone] = useState(false);

  async function submitAndShow() {
    await submit();
    setDone(true);
    setTimeout(() => { onSubmit(); }, 1600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
      <div onClick={onDismiss} style={{ position: "absolute", inset: 0, background: "rgba(58,11,20,.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#FAF7F2", borderRadius: "20px 20px 0 0", padding: "14px 22px 34px", animation: "sheetUp .36s cubic-bezier(.2,.95,.25,1)", boxShadow: "0 -14px 40px rgba(58,11,20,.25)", maxHeight: "78%", overflowY: "auto" }}>
        <div style={{ width: 36, height: 3, background: "rgba(58,11,20,.2)", margin: "0 auto 18px" }} />

        {!done ? (
          <div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.015em", marginBottom: 6 }}>How was {plan.result.title}?</div>
            <div style={{ fontSize: 15, color: "rgba(58,11,20,.55)", marginBottom: 16 }}>Rate the night, then each stop if you like. Say no and we won't ask about this plan again.</div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setOverall(n)} style={{ flex: 1, height: 40, border: `1px solid ${overall >= n ? "#7A1E33" : "rgba(58,11,20,.18)"}`, background: overall >= n ? "#7A1E33" : "transparent", color: overall >= n ? "#FAF7F2" : "rgba(58,11,20,.5)", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 19, cursor: "pointer", transition: "all .2s" }}>{n}</button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(58,11,20,.45)", marginBottom: 10 }}>Rate each stop</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(plan.result.stops || []).map((stop, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18 }}>{stop.name}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} onClick={() => rateStop(stop.name, n)} style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${(stopRatings[stop.name] || 0) >= n ? "#7A1E33" : "rgba(58,11,20,.22)"}`, background: (stopRatings[stop.name] || 0) >= n ? "#7A1E33" : "transparent", cursor: "pointer", transition: "all .2s" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "13px 14px", border: "1px solid rgba(58,11,20,.16)", fontSize: 15, lineHeight: 1.4, color: "rgba(58,11,20,.4)", marginBottom: 16 }}>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note for next time…" style={{ width: "100%", border: "none", background: "transparent", fontSize: 15, color: "#3A0B14", resize: "none", outline: "none", fontFamily: "inherit", minHeight: 40 }} />
            </div>

            <button onClick={submitAndShow} disabled={overall === 0 || submitting} style={{ width: "100%", padding: 16, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>{submitting ? "Saving…" : "Submit review"}</button>
            <button onClick={onDismiss} disabled={submitting} style={{ width: "100%", padding: 14, marginTop: 8, background: "transparent", color: "rgba(58,11,20,.6)", border: "none", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>No thanks</button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0 8px", animation: "pop .38s cubic-bezier(.2,1.3,.35,1)" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#7A1E33", color: "#FAF7F2", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✓</div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, letterSpacing: "-0.015em" }}>Thanks</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.48)", marginTop: 9 }}>Your rating updates the map for next time</div>
          </div>
        )}
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
    <div style={{ position: "fixed", inset: 0, background: "#F1EDE4", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {sparkles.map((sp, i) => <span key={i} style={{ position: "absolute", top: sp.top, left: sp.left, fontSize: brand ? sp.s * 1.5 : sp.s, color: brand ? "#800000" : "#7A1E33", animation: `twinkle 1.5s ease-in-out ${sp.d}s infinite` }}>✦</span>)}
      {brand
        ? <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 700, fontSize: "4.5rem", lineHeight: 1, color: "#7A1E33", textAlign: "center", zIndex: 1, animation: "loaderPulse 1.6s ease-in-out infinite" }}>Curated</div>
        : <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.3rem", color: "#3A0B14", textAlign: "center", zIndex: 1, animation: "loaderPulse 1.6s ease-in-out infinite" }}>{label}</div>}
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 1300, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s" }}><div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "22px 22px 0 0", maxHeight: "90vh", overflowY: "auto", animation: "cardIn 0.25s ease", padding: "2rem 1.25rem", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <button className="btn-ghost" onClick={() => step === 0 ? onCancel() : setStep(step - 1)}>← Back</button>
        <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", fontWeight: 600 }}>{step + 1} / {BAR_CRAWL_QS.length}</div>
      </div>
      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.7rem", color: "#3A0B14" }}><LineIcon name="bar" size={26} color="#7A1E33" style={{ verticalAlign: -3, marginRight: 8 }} />Bar crawl</div>
      {seedCount > 0 && step === 0 && <div style={{ fontSize: 15, color: "#7A1E33", marginTop: 4, marginBottom: 8 }}>Building around your {seedCount} saved bar{seedCount !== 1 ? "s" : ""}.</div>}
      <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#3A0B14", margin: "20px 0 16px" }}>{Q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Q.opts.map(([label, val]) => (
          <button key={val + label} onClick={() => pick(val)} style={{ textAlign: "left", padding: "15px 16px", borderRadius: 8, border: "1.5px solid rgba(58,11,20,.13)", background: "#fff", fontSize: 16, color: "#3A0B14", cursor: "pointer", fontWeight: 500 }}>{label}</button>
        ))}
      </div>
    </div></div>
  );
}

// Pick a connected person and send them a list/plan.
function ShareModal({ user, item, onClose, showToast }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // Other users' emails are no longer readable (RLS + profiles_public), so the
  // fallback is a generic label rather than an email prefix.
  const nameOf = (p) => p?.name || "Friend";

  useEffect(() => {
    (async () => {
      const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const ids = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
      let profs = [];
      if (ids.length) { const { data } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids); profs = data || []; }
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

  const [selected, setSelected] = useState({});
  const [copied, setCopied] = useState(false);
  const shareLink = `https://london-app.vercel.app/?plan=${item.title?.replace(/\s/g, "-") || "share"}`;

  async function sendToSelected() {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (!ids.length) { showToast("Select at least one friend"); return; }
    setSending(true);
    try {
      for (const id of ids) {
        await supabase.from("shares").insert({ from_user: user.id, to_user: id, kind: item.kind, title: item.title, payload: item.payload });
      }
      showToast(`Sent to ${ids.length} friend${ids.length > 1 ? "s" : ""} ✓`);
      onClose();
    } catch (e) { showToast("Couldn't send: " + e.message); setSending(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(58,11,20,.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#FAF7F2", borderRadius: "20px 20px 0 0", padding: "14px 22px 34px", animation: "sheetUp .36s cubic-bezier(.2,.95,.25,1)", boxShadow: "0 -14px 40px rgba(58,11,20,.25)" }}>
        <div style={{ width: 36, height: 3, background: "rgba(58,11,20,.2)", margin: "0 auto 18px" }} />
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, lineHeight: 1, letterSpacing: "-0.015em", marginBottom: 6 }}>Share {item.title}</div>
        <div style={{ fontSize: 15, color: "rgba(58,11,20,.55)", marginBottom: 18 }}>Send it to friends on Curated, or copy the link.</div>

        {loading && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)", marginBottom: 18 }}>Loading friends…</div>}
        {!loading && people.length > 0 && (
          <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            {people.map((p, i) => {
              const sel = !!selected[p.id];
              const colors = ["#7A1E33", "#7A1E33", "#8A7B5C", "#7A1E33"];
              const color = colors[i % colors.length];
              return (
                <div key={p.id} onClick={() => setSelected(s => ({ ...s, [p.id]: !s[p.id] }))} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: sel ? color : "transparent", color: sel ? "#FAF7F2" : "#3A0B14", border: `2px solid ${sel ? color : "rgba(58,11,20,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, transition: "all .18s", overflow: "hidden" }}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(p).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(58,11,20,.5)" }}>{nameOf(p).split(" ")[0]}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 14px", background: "#fff", border: "1px solid rgba(58,11,20,.14)", marginBottom: 11 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", color: "rgba(58,11,20,.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</div>
          <button onClick={() => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: "8px 15px", background: "#3A0B14", color: "#FAF7F2", border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{copied ? "Copied" : "Copy"}</button>
        </div>

        <button onClick={sendToSelected} disabled={sending} style={{ width: "100%", padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>{sending ? "Sending…" : "Send"}</button>
      </div>
    </div>
  );
}

// Shared styles for the bucket-list UI.
const slPill = { padding: "7px 12px", borderRadius: 8, border: "1px solid #d8d0c0", background: "#fff", color: "rgba(58,11,20,.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const slInput = { width: "100%", padding: "11px 12px", borderRadius: 8, border: "1.5px solid rgba(58,11,20,.18)", background: "#fff", color: "#3A0B14", fontFamily: "inherit", fontSize: 16, boxSizing: "border-box" };
const slOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1300, animation: "fadeIn 0.2s" };
const slSheet = { background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "1.25rem 1.25rem 1.5rem", width: "100%", maxWidth: 420, maxHeight: "75vh", overflowY: "auto", animation: "cardIn 0.25s ease" };

// Collaborative bucket lists: a list two+ connected friends both add to and tick off.
// Lists you own or are a member of, each with progress + a creator. Lives in the People tab.
function SharedListsSection({ user, initialOpenId, tourExamples }) {
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
    if (initialOpenId && !openList) { const target = rows.find(l => l.id === initialOpenId); if (target) setOpenList(target); }
    if (rows.length) {
      const { data: items } = await supabase.from("shared_list_items").select("list_id,done,photo_url").in("list_id", rows.map(l => l.id));
      const c = {};
      (items || []).forEach(it => { const e = c[it.list_id] || (c[it.list_id] = { done: 0, total: 0, photos: [] }); e.total++; if (it.done) e.done++; if (it.photo_url && e.photos.length < 3) e.photos.push(it.photo_url); });
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

  const [blLayout, setBlLayout] = useState("list");

  return (
    <div style={{ padding: "0 22px 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "0 0 12px" }}>
        <button onClick={() => setCreating(v => !v)} style={{ padding: "14px", border: "1px dashed rgba(58,11,20,.25)", background: "none", textAlign: "center", fontSize: 13, fontWeight: 600, color: "rgba(58,11,20,.5)", cursor: "pointer", flex: 1 }}>+ Start a new bucket list</button>
      </div>

      {creating && (
        <div style={{ background: "#fff", border: "1px solid rgba(58,11,20,.13)", borderRadius: 14, padding: "0.9rem", marginBottom: 12 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Date spots" autoFocus style={slInput} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
            {EMOJIS.map(em => (
              <button key={em} onClick={() => setNewEmoji(em)} style={{ width: 34, height: 34, borderRadius: 11, border: newEmoji === em ? "2px solid #7A1E33" : "1px solid rgba(58,11,20,.13)", background: "#fff", fontSize: "1.05rem", cursor: "pointer" }}>{em}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" style={{ marginTop: 0, flex: 1 }} disabled={saving || !newName.trim()} onClick={create}>{saving ? "Creating…" : "Create list"}</button>
            <button className="btn-outline" style={{ marginTop: 0, width: 90 }} onClick={() => { setCreating(false); setNewName(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)" }}>Loading…</div>}
      {tourExamples && !loading && lists.length === 0 && [["Date night ideas", "3/8 done · with Sahil", 38], ["Sunday brunch crawl", "1/5 done · with Amy", 20]].map(([name, meta, pct]) => (
        <div key={name} style={{ position: "relative", height: 200, borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg, #7A1E33, #3A0B14)", marginBottom: 12 }}>
          <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 8, background: "rgba(250,247,242,.88)", color: "#3A0B14", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Example</div>
          <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1.05, color: "#FAF7F2" }}>{name}</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E9E4DA", margin: "5px 0 8px" }}>{meta}</div>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(250,247,242,.3)", overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: "#BAD2E8" }} /></div>
          </div>
        </div>
      ))}
      {!loading && lists.length === 0 && !creating && !tourExamples && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)" }}>No bucket lists yet. Create one, then invite a friend to build it together.</div>}

      {lists.map(l => {
        const c = counts[l.id] || { done: 0, total: 0, photos: [] };
        const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
        const ph = c.photos || [];
        const img = (src) => <img src={src} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
        return (
          <button key={l.id} onClick={() => setOpenList(l)} style={{ position: "relative", display: "block", width: "100%", height: 200, padding: 0, border: "none", borderRadius: 14, overflow: "hidden", background: "#7A1E33", marginBottom: 12, cursor: "pointer", textAlign: "left" }}>
            {ph.length >= 3 ? (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3, height: "100%" }}>
                <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>{img(ph[0])}</div><div style={{ overflow: "hidden" }}>{img(ph[1])}</div><div style={{ overflow: "hidden" }}>{img(ph[2])}</div>
              </div>
            ) : ph.length ? (
              <div style={{ display: "grid", gridTemplateColumns: ph.length === 2 ? "1fr 1fr" : "1fr", gap: 3, height: "100%" }}>{ph.map((u, i) => <div key={i} style={{ overflow: "hidden" }}>{img(u)}</div>)}</div>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{l.emoji || "✨"}</div>
            )}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.85))", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, pointerEvents: "none" }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1.05, color: "#FAF7F2" }}>{l.name}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E9E4DA", margin: "5px 0 8px" }}>{c.done}/{c.total} done{l.owner !== user.id ? " · shared with you" : ""}</div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(250,247,242,.3)", overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: "#BAD2E8" }} /></div>
            </div>
          </button>
        );
      })}

      {openList && <SharedListView list={openList} user={user} onClose={() => { setOpenList(null); load(); }} />}
    </div>
  );
}

// One bucket list: tickable items, add-from-saves + manual add, members, and an invite link.
function SharedListView({ list, user, onClose }) {
  const slSwipeRef = useSwipeRight(onClose);
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
          model: "claude-sonnet-4-6", max_tokens: 4096,
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
  // Other users' emails are no longer readable (RLS + profiles_public), so the
  // fallback is a generic label rather than an email prefix.
  const nameOf = (p) => p?.name || "Friend";
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
    if (ids.length) { const { data } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids); (data || []).forEach(p => { profs[p.id] = p; }); }
    setMembers(ids.map(id => ({ id, ...(profs[id] || {}) })));
    setLoading(false);
  }
  // Your connections (so you can add a friend to the list directly, no link needed).
  async function loadConns() {
    const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
    const otherIds = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
    if (!otherIds.length) { setConns([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url").in("id", otherIds);
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

  // Owner deletes the whole list (items + members cascade); anyone else just leaves it.
  async function deleteOrLeave() {
    const isOwner = list.owner === user.id;
    const others = members.filter(m => m.id !== user.id).length;
    const msg = isOwner
      ? `Delete "${list.name}"?${others ? ` It will be removed for the ${others} other ${others === 1 ? "person" : "people"} on it too.` : ""} This can't be undone.`
      : `Leave "${list.name}"? You can rejoin if someone invites you again.`;
    if (!window.confirm(msg)) return;
    const { error } = isOwner
      ? await supabase.from("shared_lists").delete().eq("id", list.id).eq("owner", user.id)
      : await supabase.from("shared_list_members").delete().eq("list_id", list.id).eq("user_id", user.id);
    if (error) { alert(`Couldn't ${isOwner ? "delete" : "leave"} the list: ` + error.message); return; }
    onClose();
  }
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
    <div ref={slSwipeRef} style={{ position: "fixed", inset: 0, background: "#FAF7F2", zIndex: 1200, overflowY: "auto", animation: "fadeIn 0.2s" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "1rem 1.5rem 6rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <button className="btn-ghost" onClick={onClose}>← Back</button>
          <button onClick={deleteOrLeave} style={{ border: "none", background: "none", color: "#7A1E33", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "10px 4px" }}>{list.owner === user.id ? "Delete list" : "Leave list"}</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1rem 0 0.25rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 11, background: "#F1EDE4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>{list.emoji || "📋"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.4rem", color: "#3A0B14", lineHeight: 1.1 }}>{list.name}</div>
            <div style={{ fontSize: 12, color: "rgba(58,11,20,.45)", marginTop: 2 }}>{doneCount}/{items.length} ticked off</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, margin: "0.85rem 0" }}>
          {members.map(m => (
            <div key={m.id} title={nameOf(m)} style={{ width: 30, height: 30, borderRadius: "50%", background: "#3A0B14", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, overflow: "hidden", border: "2px solid #F1EDE4", marginLeft: -6 }}>{m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(m).charAt(0).toUpperCase()}</div>
          ))}
          {list.owner === user.id && <button onClick={() => { loadConns(); setPicker("friends"); }} style={{ ...slPill, marginLeft: 8, borderColor: "#7A1E33", color: "#7A1E33", fontWeight: 600 }}>＋ Add a friend</button>}
          <button onClick={() => { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={slPill}>{copied ? "✓ Link copied" : "🔗 Invite by link"}</button>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "0.25rem 0 1.1rem", flexWrap: "wrap" }}>
          <button className="btn btn-teal" style={{ marginTop: 0, flex: 1, minWidth: "40%" }} onClick={openSaves}>＋ From saves</button>
          <button className="btn-outline" style={{ marginTop: 0, flex: 1, minWidth: "40%" }} onClick={() => setPicker("manual")}>✎ Manually</button>
          <button className="btn-outline" style={{ marginTop: 0, flex: 1, minWidth: "40%" }} onClick={() => setPicker("screenshot")}>📷 Screenshot</button>
        </div>

        {loading && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)" }}>Loading…</div>}
        {!loading && items.length === 0 && <div style={{ fontSize: 16, color: "rgba(58,11,20,.45)", textAlign: "center", padding: "2.5rem 1rem" }}>Nothing here yet — add your first place ✨</div>}

        {/* Mini map of every spot with a location — collapsed, tap to expand */}
        {mapItems.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {mapExpanded
              ? <><SpotsMap key={"blist-" + list.id} saves={mapItems} listName={list.name} /><button onClick={() => setMapExpanded(false)} style={{ fontSize: 11, color: "#7A1E33", fontWeight: 600, border: "none", background: "none", cursor: "pointer", padding: "6px 0" }}>Collapse map ↑</button></>
              : <SpotsMap key={"blist-peek-" + list.id} saves={mapItems} listName={list.name} peek peekHeight={120} onExpand={() => setMapExpanded(true)} />
            }
          </div>
        )}

        {/* Photo gallery — Pinterest-style image cards with name overlay */}
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {items.map(it => (
              <div key={it.id} onClick={() => setDetailItem(it)} style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#F1EDE4", cursor: "pointer", animation: "popIn 0.25s ease" }}>
                <div style={{ height: 240, overflow: "hidden" }}>
                  {it.photo_url && <img src={it.photo_url} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: it.done ? "grayscale(0.6) brightness(0.85)" : "none" }} />}
                </div>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 40 }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: "#FAF7F2", lineHeight: 1.05, textDecoration: it.done ? "line-through" : "none" }}>{it.name}</div>
                  {it.area && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E9E4DA", marginTop: 4 }}>{it.area}</div>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleDone(it); }} title={it.done ? "Un-tick" : "Tick off"} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", border: it.done ? "none" : "2px solid rgba(255,255,255,0.8)", background: it.done ? "#7A1E33" : "rgba(0,0,0,0.25)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>{it.done ? "✓" : ""}</button>
                <button onClick={(e) => { e.stopPropagation(); removeItem(it); }} title="Remove" style={{ position: "absolute", bottom: 10, right: 10, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.85)", color: "#b0745a", cursor: "pointer", fontSize: 11, lineHeight: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200 }}>
          <SpotDetail
            spot={detailItem}
            user={user}
            readOnly
            onClose={() => setDetailItem(null)}
          />
        </div>
      )}

      {picker === "saves" && (
        <div onClick={() => { setPicker(null); setSavesFolder(null); }} style={slOverlay}>
          <div onClick={e => e.stopPropagation()} style={slSheet}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {savesFolder && <button onClick={() => setSavesFolder(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15, color: "#7A1E33", fontWeight: 600, padding: 0 }}>‹ Lists</button>}
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.1rem", color: "#3A0B14" }}>{savesFolder || "Add from your saves"}</div>
            </div>
            {!savesLoaded && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)" }}>Loading…</div>}
            {savesLoaded && availableSaves.length === 0 && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)", lineHeight: 1.5 }}>Nothing left to add — everything's already on the list, or you haven't saved any spots yet (add some in the Saves tab).</div>}
            {savesLoaded && !savesFolder && availableFolders.map(f => (
              <button key={f} onClick={() => setSavesFolder(f)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                <span style={{ fontSize: "1.15rem", width: 30, textAlign: "center" }}>📁</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#3A0B14" }}>{f}</span>
                <span style={{ fontSize: 12, color: "rgba(58,11,20,.45)" }}>{availableByFolder[f].length}</span>
                <span style={{ color: "#c9bfae", fontSize: "1.1rem" }}>›</span>
              </button>
            ))}
            {savesFolder && (availableByFolder[savesFolder] || []).map(s => (
              <button key={s.id} disabled={busy} onClick={() => addFromSave(s)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: 9, background: "#F1EDE4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📍</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: "#3A0B14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)" }}>{[s.category ? cap(s.category) : null, s.area].filter(Boolean).join(" · ")}</div>
                </div>
                <span style={{ color: "#7A1E33", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>＋</span>
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
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.1rem", color: "#3A0B14", marginBottom: 4 }}>Add a friend</div>
              <div style={{ fontSize: 12, color: "rgba(58,11,20,.45)", marginBottom: 12 }}>Add someone you're connected with — they'll get the list instantly, no link needed.</div>
              {addable.length === 0 && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)", lineHeight: 1.5 }}>{conns.length === 0 ? "You're not connected with anyone yet. Connect on the People tab first (swap words), then add them here." : "Everyone you're connected with is already on this list."}</div>}
              {addable.map(c => (
                <button key={c.id} disabled={busy} onClick={() => addMember(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#3A0B14", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 15, overflow: "hidden", flexShrink: 0 }}>{c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(c).charAt(0).toUpperCase()}</div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#3A0B14" }}>{nameOf(c)}</span>
                  <span style={{ color: "#7A1E33", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>＋</span>
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
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.1rem", color: "#3A0B14", marginBottom: 10 }}>Add from screenshot</div>
            <div style={{ fontSize: 13, color: "rgba(58,11,20,.45)", marginBottom: 14 }}>Upload a screenshot of a venue — we'll parse the name and details automatically.</div>
            {ssStatus && <div style={{ fontSize: 15, color: "#7A1E33", marginBottom: 10 }}>{ssStatus}</div>}
            <label className="btn btn-teal" style={{ marginTop: 0, textAlign: "center", cursor: "pointer", display: "block" }}>
              {busy ? ssStatus || "Processing..." : "📷 Choose screenshot"}
              <input type="file" accept="image/*" multiple style={{ display: "none" }} disabled={busy} onChange={e => { const f = [...e.target.files]; e.target.value = ""; if (f.length) handleScreenshotAdd(f); }} />
            </label>
            <button onClick={() => setPicker(null)} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", color: "rgba(58,11,20,.45)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {picker === "manual" && (
        <div onClick={resetManual} style={slOverlay}>
          <div onClick={e => e.stopPropagation()} style={slSheet}>
            {suggest && typeof suggest === "object" ? (
              <>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.2rem", color: "#3A0B14", marginBottom: 3 }}>Did you mean this?! ✨</div>
                <div style={{ fontSize: 12, color: "rgba(58,11,20,.45)", marginBottom: 12 }}>We found this on Google — add it and we'll fill in the photo, address & rating.</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#fff", border: "1px solid rgba(58,11,20,.13)", borderRadius: 14, padding: 12, marginBottom: 14 }}>
                  {suggest.photo ? <img src={suggest.photo} alt="" style={{ width: 72, height: 72, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, borderRadius: 11, background: "#F1EDE4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>{CAT_EMOJI[String(mCat || "").toLowerCase()] || "📍"}</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#3A0B14", lineHeight: 1.2 }}>{suggest.validated_name}</div>
                    <div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", margin: "3px 0" }}>{[mCat ? cap(mCat) : null, suggest.derived_area || suggest.derived_zone].filter(Boolean).join(" · ")}{suggest.google_rating ? ` · ⭐ ${suggest.google_rating}` : ""}</div>
                    {suggest.validated_address && <div style={{ fontSize: 11, color: "#b3a892", lineHeight: 1.3 }}>{suggest.validated_address}</div>}
                  </div>
                </div>
                <button className="btn btn-teal" style={{ marginTop: 0 }} disabled={busy} onClick={addSuggested}>{busy ? "Adding…" : "Yes — add this"}</button>
                <button onClick={() => setSuggest(null)} className="btn-outline">Not this one ↩</button>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.1rem", color: "#3A0B14", marginBottom: 10 }}>Add a place</div>
                <input value={mName} onChange={e => { setMName(e.target.value); if (suggest) setSuggest(null); }} placeholder="Place name — e.g. Tangra" autoFocus style={slInput} />
                <select value={mCat} onChange={e => setMCat(e.target.value)} style={{ ...slInput, marginTop: 8 }}>
                  <option value="">Category — none</option>
                  {["restaurant", "cafe", "bar", "nightlife", "market", "outdoor", "museum", "gallery", "experience", "event"].map(c => <option key={c} value={c}>{cap(c)}</option>)}
                </select>
                <input value={mArea} onChange={e => setMArea(e.target.value)} placeholder="Area (optional — helps us find it)" style={{ ...slInput, marginTop: 8 }} />
                <input value={mComment} onChange={e => setMComment(e.target.value)} placeholder="Note (optional)" style={{ ...slInput, marginTop: 8 }} />
                {suggest === "none" && <div style={{ fontSize: 12, color: "#b0745a", margin: "10px 2px 0", lineHeight: 1.4 }}>Couldn't find that on Google — add an area, or just add it as typed below.</div>}
                <button className="btn btn-teal" style={{ marginTop: 12 }} disabled={busy || suggest === "loading" || !mName.trim()} onClick={findSuggestion}>{suggest === "loading" ? "Searching Google…" : "🔍 Find it"}</button>
                <button className="btn-outline" style={{ marginTop: 8 }} disabled={busy || !mName.trim()} onClick={addManual}>{busy ? "Adding…" : "Add as typed"}</button>
                <button onClick={resetManual} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", color: "rgba(58,11,20,.45)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
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
  const fpSwipeRef = useSwipeRight(onClose);
  // Other users' emails are no longer readable (RLS + profiles_public), so the
  // fallback is a generic label rather than an email prefix.
  const nameOf = (p) => p?.name || "Friend";
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
      mpPlaceSaved(user, { save_method: "tap_save", place_category: s.category, area: s.area });
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
  const stat = (n, l) => <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#3A0B14" }}>{n}</div><div style={{ fontSize: 11, color: "rgba(58,11,20,.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div></div>;

  return (
    <div ref={fpSwipeRef} style={{ position: "fixed", inset: 0, background: "#FAF7F2", zIndex: 1200, overflowY: "auto", animation: "fadeIn 0.2s" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "1rem 1.5rem 6rem" }}>
        <button className="btn-ghost" onClick={openFolder ? () => setOpenFolder(null) : onClose} style={{ marginBottom: "0.5rem" }}>← {openFolder ? "Profile" : "Back"}</button>

        {/* Compact header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "0.75rem", marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#3A0B14", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24, overflow: "hidden", flexShrink: 0, border: "2px solid #FAF7F2", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>{friend.avatar_url ? <img src={friend.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(friend).charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, lineHeight: 1, color: "#3A0B14" }}>{nameOf(friend)}</div>
            <div style={{ fontSize: 12, color: "rgba(58,11,20,.4)", marginTop: 4 }}>{saves.length} saves · {folderNames.length} lists · {friendCount} friends</div>
          </div>
        </div>

        {loading && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)", textAlign: "center", marginTop: "1.5rem" }}>Loading…</div>}
        {!loading && saves.length === 0 && <div style={{ fontSize: 15, color: "rgba(58,11,20,.45)", textAlign: "center", padding: "2.5rem 1rem", lineHeight: 1.5 }}>{nameOf(friend)} hasn't saved anything yet.</div>}

        {/* Folder grid — same layout as your own Saves page */}
        {!openFolder && folderNames.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: "1.5rem" }}>
            {folderNames.map(f => (
              <button key={f} onClick={() => setOpenFolder(f)} style={{ position: "relative", height: 220, borderRadius: 14, overflow: "hidden", background: "#7A1E33", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <ListCover items={grouped[f]} height={220} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", background: "linear-gradient(rgba(58,11,20,0), rgba(58,11,20,.82))", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, pointerEvents: "none" }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, lineHeight: 1.05, color: "#FAF7F2" }}>{f}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E9E4DA", marginTop: 4 }}>{grouped[f].length} spot{grouped[f].length !== 1 ? "s" : ""}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Inside a folder — big spot cards, exactly like your own Saves folders.
            Tap a card to open its full detail page; save any to your own board. */}
        {openFolder && (
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.1rem", color: "#3A0B14", marginBottom: 12 }}>{openFolder} ({folderSaves.length})</div>
            {folderSaves.map(s => (
              <PhotoCard key={s.id} v={s} width="100%" height={250} nameSize={26} meta={[s.area, priceToPounds(s.price), s.google_rating ? `${s.google_rating} ★` : null].filter(Boolean).join(" · ")} onClick={() => setDetailSpot(s)} style={{ marginBottom: 14, scrollSnapAlign: "none" }}>
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 12, bottom: 12 }}>
                  {isSaved(s)
                    ? <span style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(250,247,242,.88)", color: "#7A1E33", fontSize: 12.5, fontWeight: 600 }}>Saved</span>
                    : <button disabled={busy} onClick={() => setSavePick(s)} style={{ border: "none", background: "rgba(250,247,242,.88)", color: "#3A0B14", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>+ Save</button>}
                </div>
              </PhotoCard>
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
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.15rem", color: "#3A0B14", marginBottom: 3 }}>Save to which list?</div>
            <div style={{ fontSize: 12, color: "rgba(58,11,20,.45)", marginBottom: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{savePick.name}</div>
            <button disabled={busy} onClick={() => saveToMine(savePick, null)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#FAF7F2", cursor: "pointer", marginBottom: 8 }}>
              <span style={{ fontSize: "1.1rem", width: 26, textAlign: "center" }}>✨</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: "#3A0B14" }}>Auto — sort by category</span>
            </button>
            {myFolders.map(f => (
              <button key={f} disabled={busy} onClick={() => saveToMine(savePick, f)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", background: "#fff", cursor: "pointer", marginBottom: 8 }}>
                <span style={{ fontSize: "1.1rem", width: 26, textAlign: "center" }}>📁</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: "#3A0B14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f}</span>
              </button>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="New list name…" style={{ flex: 1, padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(58,11,20,.13)", fontSize: 15, fontFamily: "inherit" }} />
              <button disabled={busy || !newFolder.trim()} onClick={() => saveToMine(savePick, newFolder.trim())} style={{ border: "none", background: newFolder.trim() ? "#7A1E33" : "#cfc8ba", color: "#fff", borderRadius: 8, padding: "0 20px", fontWeight: 600, fontSize: 15, cursor: newFolder.trim() ? "pointer" : "default" }}>Add</button>
            </div>
            <button onClick={() => { setSavePick(null); setNewFolder(""); }} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// People hub: your invite link, who you're connected with, things shared with you.
// ── Friends feed (People › Feed) ───────────────────────────────────────────
// Reads friends' saves straight from `experiences` (the "read friend" RLS policy
// allows it), so removing a save drops it from the feed with no extra work.
// "Saved by N people" counts come from the place_save_counts RPC
// (migrations/2026-11-14_feed-popularity.sql); if that isn't run yet the feed
// still works, just without counts.
const feedKey = (s) => s.google_place_id || String(s.name || "").toLowerCase().trim();
const FEED_COLORS = ["#7A1E33", "#7A1E33", "#7A7A45", "#7A7A45", "#7A1E33"];
const feedColor = (id) => FEED_COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % FEED_COLORS.length];
const BURST_GAP_MS = 10 * 60 * 1000; // saves by one friend within 10 min collapse into one card
// celebrateAdd() lives inside the bucket-list component, so the feed has its own.
const feedCelebrate = () => { haptic(15); confetti({ count: 45, power: 0.9 }); };

function feedAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${Math.max(m, 1)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function feedDayLabel(iso) {
  const d = new Date(iso), now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  return diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? "This week" : "Earlier";
}

function FeedAvatar({ person, size = 36, ring }) {
  const style = { width: size, height: size, borderRadius: "50%", flex: "none", background: feedColor(person.id), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(size * 0.4), overflow: "hidden", border: ring ? `2px solid ${ring}` : "none", boxSizing: "border-box" };
  return <div style={style}>{person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (person.name || "F")[0].toUpperCase()}</div>;
}

function FeedThumb({ spot, size = 64 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: "#E9E4DA", flex: "none", overflow: "hidden" }}>
      {spot.photo_url && <img src={spot.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
    </div>
  );
}

function FriendFeed({ user, friends, onOpenFriend, onGoTab }) {
  const [rows, setRows] = useState([]);
  const [myKeys, setMyKeys] = useState(new Set());
  const [counts, setCounts] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showAllCommon, setShowAllCommon] = useState(false);
  const [listPick, setListPick] = useState(null); // { friend, places, lists } while choosing a bucket list
  const friendById = Object.fromEntries(friends.map(f => [f.id, f]));
  const nameOf = (id) => friendById[id]?.name || "Friend";

  useEffect(() => {
    (async () => {
      const ids = friends.map(f => f.id);
      if (!ids.length) { setLoading(false); return; }
      const [{ data: fs }, { data: mine }] = await Promise.all([
        supabase.from("experiences").select("*").in("user_id", ids).order("created_at", { ascending: false }).limit(1000),
        supabase.from("experiences").select("name,google_place_id").eq("user_id", user.id),
      ]);
      const list = fs || [];
      setRows(list);
      setMyKeys(new Set((mine || []).map(feedKey)));
      setLoading(false);
      const keys = [...new Set(list.slice(0, 200).map(feedKey))];
      if (keys.length) {
        const { data: cs, error } = await supabase.rpc("place_save_counts", { keys });
        if (!error && cs) setCounts(new Map(cs.map(c => [c.place_key, c.savers])));
      }
    })();
  }, [friends.map(f => f.id).join(",")]);

  // Recent activity, with each friend's bursts (e.g. a Maps-list import) collapsed.
  const groups = [];
  const openGroup = {};
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    const g = openGroup[r.user_id];
    if (g && g.oldest - t <= BURST_GAP_MS) { g.items.push(r); g.oldest = t; }
    else { const ng = { key: r.id, uid: r.user_id, at: r.created_at, oldest: t, items: [r] }; groups.push(ng); openGroup[r.user_id] = ng; }
  }
  const feed = groups.slice(0, 40);

  // Places you have in common with each friend — show the friend you share most with.
  const commonByFriend = {};
  for (const r of rows) {
    if (!myKeys.has(feedKey(r))) continue;
    const m = (commonByFriend[r.user_id] = commonByFriend[r.user_id] || new Map());
    if (!m.has(feedKey(r))) m.set(feedKey(r), r);
  }
  const best = Object.entries(commonByFriend).sort((a, b) => b[1].size - a[1].size)[0];
  const common = best ? { friend: friendById[best[0]] || { id: best[0] }, places: [...best[1].values()] } : null;

  // Places 2+ friends saved that you haven't.
  const byPlace = new Map();
  for (const r of rows) {
    const k = feedKey(r);
    if (myKeys.has(k)) continue;
    const e = byPlace.get(k) || { spot: r, uids: new Set() };
    e.uids.add(r.user_id); byPlace.set(k, e);
  }
  const nudges = [...byPlace.values()].filter(e => e.uids.size >= 2).sort((a, b) => b.uids.size - a.uids.size).slice(0, 2);

  async function saveToMine(s) {
    if (busy) return;
    setBusy(true);
    // Your copy starts clean: their note, list and visit date stay theirs.
    const { id, user_id, created_at, status, folder, note, visit_date, ...rest } = s;
    const { error } = await supabase.from("experiences").insert({ ...rest, user_id: user.id, folder: null, status: "pending" });
    if (!error || error.code === "23505") { setMyKeys(prev => new Set(prev).add(feedKey(s))); if (!error) { feedCelebrate(); mpPlaceSaved(user, { save_method: "tap_save", place_category: s.category, area: s.area }); } }
    else alert("Couldn't save it: " + error.message);
    setBusy(false);
  }

  // "Add to bucket list": pick one of your lists (ones shared with this friend
  // first) or start a new one with them. Places already on the list are skipped.
  async function openListPicker(friend, places) {
    if (busy) return;
    setBusy(true);
    const [{ data: ls }, { data: fm }] = await Promise.all([
      supabase.from("shared_lists").select("id,name,emoji,created_at").order("created_at", { ascending: false }),
      // RLS only returns membership rows for lists you're in, so this is "lists you share with them".
      supabase.from("shared_list_members").select("list_id").eq("user_id", friend.id),
    ]);
    const withFriend = new Set((fm || []).map(m => m.list_id));
    const lists = (ls || []).map(l => ({ ...l, withFriend: withFriend.has(l.id) })).sort((a, b) => b.withFriend - a.withFriend);
    setListPick({ friend, places, lists });
    setBusy(false);
  }

  async function addToList(listId) {
    if (busy || !listPick) return;
    const { friend, places } = listPick;
    setBusy(true);
    try {
      let id = listId;
      if (!id) {
        const { data: me } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
        const first = (n) => String(n || "").trim().split(/\s+/)[0];
        const name = [first(me?.name) || "Me", first(friend.name) || "Friend"].join(" & ");
        const { data: list, error } = await supabase.from("shared_lists").insert({ name, emoji: "✨", owner: user.id }).select().single();
        if (error) throw error;
        const { error: me1 } = await supabase.from("shared_list_members").insert({ list_id: list.id, user_id: user.id });
        if (me1) throw me1;
        const { error: me2 } = await supabase.from("shared_list_members").insert({ list_id: list.id, user_id: friend.id });
        if (me2) throw me2;
        id = list.id;
      }
      const { data: existing } = await supabase.from("shared_list_items").select("name,google_place_id").eq("list_id", id);
      const have = new Set((existing || []).map(feedKey));
      const items = places.filter(p => !have.has(feedKey(p))).map(p => ({ list_id: id, added_by: user.id, name: p.name, category: p.category || null, address: p.address || null, area: p.area || null, comment: p.comment || null, lat: p.lat ?? null, lng: p.lng ?? null, google_place_id: p.google_place_id || null, google_rating: p.google_rating != null ? String(p.google_rating) : null, price: p.price || null, website: p.website || null, photo_url: p.photo_url || null }));
      if (items.length) { const { error: ie } = await supabase.from("shared_list_items").insert(items); if (ie) throw ie; }
      feedCelebrate();
      setListPick(null);
      onGoTab("lists", id);
    } catch (e) { alert("Couldn't add to the list: " + e.message); }
    setBusy(false);
  }

  const ink = "#3A0B14", muted = "rgba(58,11,20,.6)";
  const card = { display: "flex", flexDirection: "column", gap: 10 };
  const serif = "'Instrument Serif', Georgia, serif";
  const pill = (dark) => ({ height: 36, padding: "0 14px", borderRadius: 8, border: dark ? "none" : `1px solid ${ink}`, background: dark ? ink : "transparent", color: dark ? "#FAF7F2" : ink, fontSize: 13, fontWeight: 600, cursor: "pointer", flex: "none" });
  const savedPill = { ...pill(false), border: "none", background: "#F1EDE4", display: "inline-flex", alignItems: "center", cursor: "default" };
  const SaveBtn = ({ s, dark }) => myKeys.has(feedKey(s))
    ? <span style={savedPill}>✓ Saved</span>
    : <button disabled={busy} onClick={(e) => { e.stopPropagation(); saveToMine(s); }} style={pill(dark)}>+ Save</button>;
  const Who = ({ uid, children, at }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => onOpenFriend(friendById[uid] || { id: uid })} aria-label={`Open ${nameOf(uid)}'s profile`} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}><FeedAvatar person={friendById[uid] || { id: uid }} /></button>
      <div style={{ flex: 1, fontSize: 15, lineHeight: 1.35 }}>{children}</div>
      <span style={{ fontSize: 12, color: muted }}>{feedAgo(at)}</span>
    </div>
  );

  if (loading) return <div style={{ padding: "0 22px" }}><SkeletonList count={4} /></div>;

  if (!friends.length) return (
    <div style={{ margin: "0 22px", ...card, alignItems: "flex-start" }}>
      <div style={{ fontFamily: serif, fontSize: 24, lineHeight: 1.1 }}>Your feed fills up with friends</div>
      <div style={{ fontSize: 15, color: muted, lineHeight: 1.45 }}>Add a friend to see what they're saving, and the places you both want to try.</div>
      <button onClick={() => onGoTab("friends")} style={pill(true)}>Add a friend</button>
    </div>
  );

  const NudgeCard = ({ n }) => (
    <div onClick={() => setDetail(n.spot)} style={{ background: "#E3EDF6", borderRadius: 20, padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
      <div style={{ display: "flex", flex: "none" }}>
        {[...n.uids].slice(0, 3).map((uid, i) => <div key={uid} style={{ marginLeft: i ? -8 : 0 }}><FeedAvatar person={friendById[uid] || { id: uid }} size={30} ring="#E3EDF6" /></div>)}
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 15, lineHeight: 1.4 }}><strong>{n.uids.size} friends</strong> saved <strong>{n.spot.name}</strong>. You haven't yet.</div>
      <SaveBtn s={n.spot} dark />
    </div>
  );

  let lastLabel = null;
  return (
    <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      {common && (
        <div style={{ background: ink, color: "#FAF7F2", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex" }}>
              <FeedAvatar person={{ id: user.id, name: "You" }} size={30} ring={ink} />
              <div style={{ marginLeft: -8 }}><FeedAvatar person={common.friend} size={30} ring={ink} /></div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(250,247,242,.7)" }}>You & {common.friend.name || "Friend"} both saved</span>
          </div>
          <div onClick={() => setDetail(common.places[0])} style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}>
            <FeedThumb spot={common.places[0]} size={52} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <div style={{ fontFamily: serif, fontSize: 23, lineHeight: 1.1 }}>{common.places[0].name}</div>
              <div style={{ fontSize: 13, color: "rgba(250,247,242,.72)" }}>{[common.places[0].category, common.places[0].area, priceToPounds(common.places[0].price)].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          {showAllCommon && common.places.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {common.places.slice(1).map(p => <button key={p.id} onClick={() => setDetail(p)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(250,247,242,.3)", background: "transparent", color: "#FAF7F2", fontSize: 13, cursor: "pointer" }}>{p.name}</button>)}
            </div>
          )}
          <button disabled={busy} onClick={() => openListPicker(common.friend, common.places)} style={{ height: 36, borderRadius: 8, border: "none", background: "#BAD2E8", color: "#3A0B14", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            Add {common.places.length > 1 ? `all ${common.places.length}` : "it"} to a bucket list
          </button>
          {common.places.length > 1 && (
            <button onClick={() => setShowAllCommon(v => !v)} style={{ border: "none", background: "none", color: "rgba(250,247,242,.7)", fontSize: 13, cursor: "pointer", padding: 0 }}>
              {showAllCommon ? "Show less" : `+ ${common.places.length - 1} more place${common.places.length > 2 ? "s" : ""} in common`}
            </button>
          )}
        </div>
      )}

      {feed.length === 0 && <div style={{ fontSize: 15, color: muted, padding: "8px 6px" }}>Your friends haven't saved anything yet.</div>}

      {feed.map((g, gi) => {
        const label = feedDayLabel(g.at);
        const header = label !== lastLabel ? (lastLabel = label) : null;
        const s = g.items[0];
        const savers = counts.get(feedKey(s));
        const folders = g.items.map(i => i.folder).filter(Boolean);
        const folder = folders.sort((a, b) => folders.filter(x => x === b).length - folders.filter(x => x === a).length)[0];
        return (
          <Fragment key={g.key}>
            {header && <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: muted, padding: "8px 4px 0" }}>{header}</div>}
            {g.items.length >= 3 ? (
              <div style={card}>
                <Who uid={g.uid} at={g.at}><strong>{nameOf(g.uid)}</strong> saved {g.items.length} places{folder ? <> to <strong>{folder}</strong></> : ""}</Who>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6, height: 220 }}>
                  {g.items.slice(0, 3).map((i, k) => (
                    <div key={i.id} onClick={() => k === 2 && g.items.length > 3 ? onOpenFriend(friendById[g.uid] || { id: g.uid }) : setDetail(i)} style={{ gridRow: k === 0 ? "1 / 3" : undefined, position: "relative", borderRadius: k === 0 ? 14 : 11, overflow: "hidden", background: "#E9E4DA", cursor: "pointer" }}>
                      {i.photo_url && <img src={i.photo_url} alt={i.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                      {k === 2 && g.items.length > 3 && <div style={{ position: "absolute", inset: 0, background: "rgba(58,11,20,.55)", color: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 600 }}>+{g.items.length - 3}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : g.items.map(it => {
              const n = counts.get(feedKey(it));
              return (
                <div key={it.id} style={card}>
                  <Who uid={g.uid} at={it.created_at}><strong>{nameOf(g.uid)}</strong> saved {it.is_event ? "an event" : "a place"}{it.folder ? <> to <strong>{it.folder}</strong></> : ""}</Who>
                  <PhotoCard v={it} width="100%" height={250} nameSize={26} meta={[it.category, it.area, it.google_rating ? `${it.google_rating} ★` : null, n >= 3 ? `saved by ${n} people` : null].filter(Boolean).join(" · ")} onClick={() => setDetail(it)} style={{ scrollSnapAlign: "none" }}>
                    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 12, bottom: 12 }}><SaveBtn s={it} /></div>
                  </PhotoCard>
                  {it.note && <div style={{ background: "#FFFBF5", border: "1px solid rgba(58,11,20,.1)", borderRadius: 12, padding: "10px 12px", fontSize: 15, lineHeight: 1.45 }}><span style={{ fontFamily: serif, fontSize: 23, lineHeight: 0, color: "#7A1E33", verticalAlign: -4 }}>“</span> {it.note}</div>}
                </div>
              );
            })}
            {(gi === 1 || gi === 4) && nudges[gi === 1 ? 0 : 1] && <NudgeCard n={nudges[gi === 1 ? 0 : 1]} />}
          </Fragment>
        );
      })}
      {feed.length < 2 && nudges.map(n => <NudgeCard key={feedKey(n.spot)} n={n} />)}

      {listPick && (
        <div onClick={() => setListPick(null)} style={{ position: "fixed", inset: 0, background: "rgba(58,11,20,.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1400, animation: "fadeIn 0.2s" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FAF7F2", borderRadius: "20px 20px 0 0", padding: "18px 20px 32px", width: "100%", maxWidth: 420, maxHeight: "72vh", overflowY: "auto", animation: "sheetUp .36s cubic-bezier(.2,.95,.25,1)" }}>
            <div style={{ fontFamily: serif, fontSize: 26, lineHeight: 1.05 }}>Add to which bucket list?</div>
            <div style={{ fontSize: 13, color: muted, margin: "6px 0 14px" }}>{listPick.places.length} place{listPick.places.length !== 1 ? "s" : ""} · anything already on the list is skipped</div>
            {listPick.lists.map(l => (
              <button key={l.id} disabled={busy} onClick={() => addToList(l.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 2px", border: "none", borderTop: "1px solid rgba(58,11,20,.12)", background: "none", cursor: "pointer", textAlign: "left", color: ink }}>
                <span style={{ fontSize: 23, width: 28, textAlign: "center" }}>{l.emoji || "✨"}</span>
                <span style={{ flex: 1, fontSize: 16 }}>{l.name}</span>
                {l.withFriend && <span style={{ fontSize: 12, color: muted }}>with {listPick.friend.name || "friend"}</span>}
              </button>
            ))}
            <button disabled={busy} onClick={() => addToList(null)} style={{ width: "100%", marginTop: 10, height: 44, borderRadius: 8, border: `1px solid ${ink}`, background: "transparent", color: ink, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              + New list with {listPick.friend.name || "your friend"}
            </button>
          </div>
        </div>
      )}

      {detail && (
        <SpotDetail
          spot={detail}
          user={user}
          readOnly
          onClose={() => setDetail(null)}
          onSaveToBoard={myKeys.has(feedKey(detail)) ? null : () => saveToMine(detail)}
          savedToBoard={myKeys.has(feedKey(detail))}
        />
      )}
    </div>
  );
}

function PeopleScreen({ user, onSavePlan, onShareSaved, tourTab }) {
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
  // Other users' emails are no longer readable (RLS + profiles_public), so the
  // fallback is a generic label rather than an email prefix.
  const nameOf = (p) => p?.name || "Friend";

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
      // Reads other users' rows (uniqueness check), so it goes through the
      // profiles_public view — no email exposed.
      const { data: rows } = await supabase.from("profiles_public").select("friend_code").not("friend_code", "is", null);
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
      // Resolves a stranger's code, so it must use profiles_public (RLS on the
      // profiles table now only exposes your own row and your connections').
      const { data } = await supabase.from("profiles_public").select("id,name").eq("friend_code", code).maybeSingle();
      if (!data?.id) { setMsg("No one found with that code — double-check it."); setConnecting(false); return; }
      const [a, b] = [user.id, data.id].sort();
      // ignoreDuplicates → "ON CONFLICT DO NOTHING", so re-connecting an existing
      // pair never triggers an UPDATE (which the connections table has no policy for).
      const { error } = await supabase.from("connections").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b", ignoreDuplicates: true });
      if (error) throw error;
      haptic([15, 40, 15, 40, 25]); confetti({ count: 120, power: 1.2 });
      mp("friend_connected", { connection_type: "friend_code_entered", friend_count_before: connections.length, connection_success: true, shared_list_created: false });
      setMsg(`Connected with ${data.name || "your friend"}! 🎉`); setCodeInput("");
      await load();
    } catch (e) { mp("friend_connected", { connection_type: "friend_code_entered", friend_count_before: connections.length, connection_success: false, shared_list_created: false }); setMsg("Couldn't connect: " + e.message); }
    setConnecting(false);
  }

  async function load() {
    setLoading(true);
    const { data: cons } = await supabase.from("connections").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
    const otherIds = (cons || []).map(c => (c.user_a === user.id ? c.user_b : c.user_a));
    const { data: sh } = await supabase.from("shares").select("*").eq("to_user", user.id).order("created_at", { ascending: false });
    const ids = [...new Set([...otherIds, ...(sh || []).map(s => s.from_user)])];
    let prof = {};
    if (ids.length) { const { data } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids); (data || []).forEach(p => { prof[p.id] = p; }); }
    setConnections(otherIds.map(id => ({ id, ...(prof[id] || {}) })));
    setShares((sh || []).map(s => ({ ...s, from: prof[s.from_user] || {} })));
    setLoading(false);
  }
  useEffect(() => { load(); ensureCode(); }, []);

  async function saveShare(s) {
    try {
      if (s.kind === "plan") { onSavePlan(s.payload); mp("plan_edited_saved_or_shared", { plan_id: s.payload?.id, action: "saved" }); setMsg("Saved to My Plans ✓"); }
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

  const [pTab, setPTab] = useState("feed");
  const [openListId, setOpenListId] = useState(null); // feed → open this bucket list
  useEffect(() => { if (tourTab) setPTab(tourTab); }, [tourTab]);

  if (loading) return <div style={{ paddingTop: "2rem" }}><SkeletonList count={5} /></div>;

  return (
    <div style={{ animation: "screenIn .32s cubic-bezier(.2,.9,.3,1)" }}>
      <div style={{ padding: "0 22px 4px" }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#7A1E33" }}>People<span style={{ color: "#BAD2E8" }}>.</span></div>
      </div>
      <div style={{ padding: "0 22px 18px", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(58,11,20,.42)" }}>{connections.length} friend{connections.length !== 1 ? "s" : ""} · {shares.filter(s => !s.seen).length} new</div>

      <div style={{ display: "flex", gap: 7, padding: "0 22px 20px" }}>
        <button onClick={() => setPTab("feed")} style={{ padding: "7px 14px", borderRadius: 8, background: pTab === "feed" ? "#3A0B14" : "transparent", color: pTab === "feed" ? "#FAF7F2" : "rgba(58,11,20,.55)", border: pTab === "feed" ? "none" : "1px solid rgba(58,11,20,.16)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>Feed</button>
        <button onClick={() => setPTab("lists")} style={{ padding: "7px 14px", borderRadius: 8, background: pTab === "lists" ? "#3A0B14" : "transparent", color: pTab === "lists" ? "#FAF7F2" : "rgba(58,11,20,.55)", border: pTab === "lists" ? "none" : "1px solid rgba(58,11,20,.16)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>Bucket lists</button>
        <button onClick={() => setPTab("friends")} style={{ padding: "7px 14px", borderRadius: 8, background: pTab === "friends" ? "#3A0B14" : "transparent", color: pTab === "friends" ? "#FAF7F2" : "rgba(58,11,20,.55)", border: pTab === "friends" ? "none" : "1px solid rgba(58,11,20,.16)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>Friends</button>
      </div>

      {msg && <div style={{ margin: "0 22px 12px", background: "#F1EDE4", color: "#3A0B14", padding: "10px 12px", fontSize: 13 }}>{msg}</div>}

      {pTab === "feed" && <FriendFeed user={user} friends={connections} onOpenFriend={setViewFriend} onGoTab={(t, listId) => { setOpenListId(listId || null); setPTab(t); if (t === "friends" && !connections.length) setShowConnect(true); }} />}
      {pTab === "lists" && <div data-tour="shared-lists"><SharedListsSection user={user} initialOpenId={openListId} tourExamples={!!tourTab} /></div>}

      {pTab === "friends" && (
        <div style={{ padding: "0 22px" }}>
          <div style={{ padding: 16, background: "#3A0B14", color: "#FAF7F2", display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.55 }}>Your friend code</div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34, letterSpacing: "0.16em", marginTop: 4 }}>{myCode || "····"}</div>
            </div>
            <div style={{ flex: 1 }} />
            <button data-tour="invite" onClick={() => setShowConnect(true)} style={{ padding: "10px 15px", background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Add friend</button>
          </div>

          {connections.map(c => (
            <div key={c.id} onClick={() => setViewFriend(c)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 0", borderTop: "1px solid rgba(58,11,20,.13)", cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#3A0B14", color: "#BAD2E8", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22 }}>{c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : nameOf(c).charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 23 }}>{nameOf(c)}</div>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(58,11,20,.45)", marginTop: 4 }}>Tap to see saves</div>
              </div>
              <div style={{ color: "rgba(58,11,20,.3)", fontSize: 19 }}>›</div>
            </div>
          ))}
          {connections.length === 0 && <div style={{ fontSize: 15, color: "rgba(58,11,20,.5)", paddingTop: 8 }}>No friends yet — share your code to connect.</div>}
        </div>
      )}

      {showConnect && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
          <div onClick={() => setShowConnect(false)} style={{ position: "absolute", inset: 0, background: "rgba(58,11,20,.5)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#FAF7F2", borderRadius: "20px 20px 0 0", padding: "14px 22px 34px", animation: "sheetUp .36s cubic-bezier(.2,.95,.25,1)", boxShadow: "0 -14px 40px rgba(58,11,20,.25)" }}>
            <div style={{ width: 36, height: 3, background: "rgba(58,11,20,.2)", margin: "0 auto 18px" }} />
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, lineHeight: 1, letterSpacing: "-0.015em", marginBottom: 8 }}>Add a friend</div>
            <div style={{ fontSize: 15, color: "rgba(58,11,20,.55)", marginBottom: 18 }}>Four letters, no usernames. Swap codes and you'll see each other's saves.</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, height: 62, border: `1px solid ${codeInput.length === i ? "#7A1E33" : "rgba(58,11,20,.18)"}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28 }}>{codeInput[i] || "·"}</div>
              ))}
            </div>
            <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} autoFocus />
            <button onClick={connectByCode} disabled={connecting || codeInput.length !== 4} style={{ width: "100%", padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>{connecting ? "Connecting…" : "Connect"}</button>
            <button onClick={() => { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ width: "100%", padding: 15, border: "1px solid #7A1E33", background: "none", color: "#7A1E33", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>{copied ? "✓ Copied" : "Share my code instead"}</button>
          </div>
        </div>
      )}

      {viewFriend && <FriendProfile user={user} friend={viewFriend} onClose={() => setViewFriend(null)} />}

      {viewing && (
        <div onClick={() => setViewing(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1100, animation: "fadeIn 0.2s" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FAF7F2", borderRadius: "22px 22px 0 0", padding: "1.25rem", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "cardIn 0.25s ease" }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, color: "#3A0B14", marginBottom: 2 }}>{viewing.title}</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(58,11,20,.45)", marginBottom: 12 }}>from {nameOf(viewing.from)}</div>
            {viewing.kind === "plan" ? (
              <div style={{ fontSize: 15, color: "rgba(58,11,20,.6)" }}>{(viewing.payload?.plan?.stops || []).length} stops · {viewing.payload?.plan?.tagline || ""}</div>
            ) : (
              <div style={{ fontSize: 15, color: "rgba(58,11,20,.6)" }}>{(viewing.payload?.spots || []).length} spots: {(viewing.payload?.spots || []).slice(0, 6).map(s => s.name).join(", ")}{(viewing.payload?.spots || []).length > 6 ? "…" : ""}</div>
            )}
            <button className="btn btn-teal" style={{ marginTop: 14 }} onClick={() => saveShare(viewing)}>{viewing.kind === "plan" ? "Save to My Plans" : "Save to my lists"}</button>
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
// The spot steps open a top-rated place from Discover (see the tour effect in App); the capture step opens the Save sheet.
// SavedScreen) so the rating / photos / book button are spotlighted in situ.
// Tour steps. A step with no selector shows the whole page with the tip pinned to an
// edge (no spotlight). `open` makes the app open something for the step: a spot page
// from Discover, or the "Save a place" sheet. `peopleTab` switches the People tab.
const PRODUCT_TOUR = [
  { tab: "discover", selector: null, title: "Discover: find new places", body: "This page finds you new places based on your preferences, plus our editors' picks. Trending this week, rows built around what you like, cheap eats and new openings." },
  { tab: "discover", selector: "[data-tour='discover-rows']", title: "Rows of picks", body: "Each row is a theme. Scroll sideways through it, and tap any photo to open the place." },
  { tab: "discover", selector: "[data-tour='discover-swipe']", title: "Swipe to discover", body: "A deck of places matched to your taste. Heart to save, cross to skip. The quickest way to find your next favourite." },
  { tab: "discover", selector: null, open: "spot", tipAt: "top", title: "Inside a place", body: "Tap any place and it opens like this: swipe the photos at the top, read about it, rate it and keep your own notes." },
  { tab: "discover", selector: "[data-tour='spot-book']", open: "spot", title: "Book it in a tap", body: "Straight to the website or booking page, into your calendar, or plan a whole outing around it." },
  { tab: "saved", selector: null, title: "Saves: everything in one place", body: "Your saves from your camera roll, Google Maps, screenshots and links all live here, grouped into lists you can share." },
  { tab: "saved", selector: "[data-tour='saves-lists']", title: "Your lists", body: "Each tile is a list. Tap one to open it, or use the map above to see everything at once." },
  { tab: "saved", selector: "[data-tour='save-fab']", title: "Save a place from anywhere", body: "The + button is on every page. Tap it to save a place." },
  { tab: "saved", selector: null, open: "capture", tipAt: "top", title: "Screenshot, link or name", body: "This is what opens: upload a screenshot from your camera roll, paste a TikTok, Instagram or Google Maps link, or just type the name." },
  { tab: "saved", selector: "[data-tour='saves-build']", title: "Plans: from your list or ours", body: "Turn any list into a full day or night out. Answer five quick questions and we route it for you, with times, costs and walking directions." },
  { tab: "plans", selector: null, title: "Plans", body: "Every plan you make lives here, with its stops, times and a cover photo. Schedule one for a date and share it with friends." },
  { tab: "plans", selector: "[data-tour='plan-cta']", title: "Or start from scratch", body: "No saves needed. Pick a vibe, area and budget and we build the itinerary from our picks." },
  { tab: "people", peopleTab: "feed", selector: null, title: "Friends: do it together", body: "Add friends to see a feed of what they're saving, build bucket lists together, and make plans with them." },
  { tab: "people", peopleTab: "feed", selector: "[data-tour='invite']", title: "Add your friends", body: "Add a friend and you'll see their saves. Places you both save show up as matches." },
  { tab: "people", peopleTab: "lists", selector: null, title: "Bucket lists with friends", body: "Create a list with a friend, add places from either side, and tick them off as you go. Here's what a couple look like." },
];

function AppProductTour({ steps, step, onNext, onBack, onDone, onSkip }) {
  const s = steps[step];
  const last = step === steps.length - 1;
  const [rect, setRect] = useState(null);
  const scrolledFor = useRef(-1);
  useEffect(() => {
    let raf, dead = false;
    const tick = () => {
      const el = s.selector ? document.querySelector(s.selector) : null;
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
  const hole = rect && { position: "fixed", top: rect.t - pad, left: rect.l - pad, width: rect.w + pad * 2, height: rect.h + pad * 2, borderRadius: 14, boxShadow: "0 0 0 9999px rgba(20,18,14,0.66)", border: "2px solid #BAD2E8", pointerEvents: "none", zIndex: 3001, transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease" };
  const below = !rect || (rect.t + rect.h / 2) < window.innerHeight * 0.52;
  const tip = { position: "fixed", left: 12, right: 12, maxWidth: 400, margin: "0 auto", background: "#fff", borderRadius: 14, padding: "16px 16px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", zIndex: 3002, pointerEvents: "auto", ...(rect ? (below ? { top: Math.min(rect.t + rect.h + pad + 12, window.innerHeight - 230) } : { bottom: window.innerHeight - rect.t + pad + 12 }) : (!s.selector ? (s.tipAt === "top" ? { top: 16 } : { bottom: 104 }) : { top: "42%" })) };
  const btn = { border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000 }}>
      <div style={{ position: "fixed", inset: 0, background: (rect || !s.selector) ? "transparent" : "rgba(20,18,14,0.66)", pointerEvents: "auto" }} />
      {rect && <div style={hole} />}
      <div style={tip}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(58,11,20,.45)", fontWeight: 700, marginBottom: 5 }}>Step {step + 1} of {steps.length}</div>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.15rem", color: "#3A0B14", marginBottom: 5 }}>{s.title}</div>
        <div style={{ fontSize: 15, color: "rgba(58,11,20,.6)", lineHeight: 1.5, marginBottom: 14 }}>{s.body}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onSkip} style={{ ...btn, background: "transparent", color: "rgba(58,11,20,.45)", padding: "9px 4px" }}>Skip</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {step > 0 && <button onClick={onBack} style={{ ...btn, background: "rgba(58,11,20,.13)", color: "rgba(58,11,20,.6)" }}>Back</button>}
            <button onClick={last ? onDone : onNext} style={{ ...btn, background: "#3A0B14", color: "#fff" }}>{last ? "Done" : "Next"}</button>
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
  const [activeTab, setActiveTab] = useState("discover"); // Discover is the landing tab
  const [meOpen, setMeOpen] = useState(false);
  const [discoverSpot, setDiscoverSpot] = useState(null);
  const [savedKeys, setSavedKeys] = useState(new Set()); // your saves, so Discover can hide them
  useEffect(() => {
    if (!user?.id || activeTab !== "discover") return;
    supabase.from("experiences").select("name,google_place_id").eq("user_id", user.id)
      .then(({ data }) => { if (data) setSavedKeys(new Set(data.map(feedKey))); });
  }, [user?.id, activeTab]);
  async function saveDiscoverSpot(v, ctx) {
    if (!user?.id || !v) return;
    const row = { user_id: user.id, name: v.name, address: v.address, area: v.area, zone: v.zone, category: v.category, price: v.price, vibe_tags: v.vibe_tags || [], comment: v.comment, lat: v.lat, lng: v.lng, google_place_id: v.google_place_id, google_rating: v.google_rating, photo_url: v.photo_url, website: v.website, source_type: "discover", status: "pending" };
    const { error } = await supabase.from("experiences").insert(row);
    if (!error || error.code === "23505") { haptic(12); if (!error) { mpPlaceSaved(user, { save_method: "tap_save", place_category: v.category, area: v.area }); const c = ctx || { ...mpDiscoverCtx, method: "open_details_then_save" }; mp("discover_save_conversion", { discover_surface: c.surface || "unknown", save_type: saveType(v.category), position_in_surface: c.position, save_method: c.method || "tap_save" }); } setSavedKeys(prev => new Set(prev).add(feedKey(v))); }
    else showToast("Couldn't save that — try again");
  }
  const [tourStep, setTourStep] = useState(-1); // -1 = off; guided product tour (Me → "Take a tour")
  const [tourCapture, setTourCapture] = useState(false); // tour step that shows the "Save a place" sheet
  const [tourPeopleTab, setTourPeopleTab] = useState(null); // tour step that needs a People sub-tab
  const tourSpotRef = useRef(false); // true while the tour has a spot page open from Discover
  const [importSignal, setImportSignal] = useState(0); // bump to launch the hands-on "add a save" walkthrough
  const [peopleBadge, setPeopleBadge] = useState(0); // unsaved shares sent to you → People tab badge
  const [captureSignal, setCaptureSignal] = useState(0); // bump to pop the global capture sheet on Saves
  const [onboardDone, setOnboardDone] = useState(false); // set true when first-run onboarding finishes
  const [splashDone, setSplashDone] = useState(() => { try { return !!localStorage.getItem("cl_splash"); } catch (e) { return false; } });
  const [showStarter, setShowStarter] = useState(false); // "based on what you liked" banner on the board
  const [tourPrompt, setTourPrompt] = useState(false); // "Want a quick tour?" shown once, right after onboarding
  const [calSignal, setCalSignal] = useState(0); // bump to jump Saves to its Calendar view
  const [quizStep, setQuizStep] = useState(-1);
  const [ans, setAns] = useState({});
  const [times, setTimes] = useState({ start: "18:00", end: "23:00" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const plansLoadedRef = useRef(false);
  useEffect(() => {
    if (!user?.id || plansLoadedRef.current) return;
    plansLoadedRef.current = true;
    (async () => {
      const { data } = await supabase.from("plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const dbPlans = (data || []).map(p => ({ id: p.id, result: p.result, ans: p.ans, times: p.times, savedAt: p.saved_at, createdAt: p.created_at, scheduledDate: p.scheduled_date }));
      // Migrate any localStorage plans that aren't in the DB yet
      let localPlans = [];
      try { localPlans = JSON.parse(localStorage.getItem("cl_plans") || "[]"); } catch {}
      const dbIds = new Set(dbPlans.map(p => p.id));
      const toMigrate = localPlans.filter(p => p.id && !dbIds.has(p.id));
      if (toMigrate.length) {
        let failed = 0;
        for (const p of toMigrate) {
          const { error } = await supabase.from("plans").insert({ id: p.id, user_id: user.id, result: p.result, ans: p.ans, times: p.times, saved_at: p.savedAt, created_at: p.createdAt, scheduled_date: p.scheduledDate || null });
          if (error) { failed++; console.warn("plans migrate:", error.message); }
        }
        // Keep the local copy until every plan is safely in the database.
        if (!failed) localStorage.removeItem("cl_plans");
        const { data: fresh } = await supabase.from("plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        setPlans((fresh || []).map(p => ({ id: p.id, result: p.result, ans: p.ans, times: p.times, savedAt: p.saved_at, createdAt: p.created_at, scheduledDate: p.scheduled_date })));
      } else {
        if (localPlans.length) localStorage.removeItem("cl_plans");
        setPlans(dbPlans);
      }
    })();
  }, [user?.id]);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [ratingPlan, setRatingPlan] = useState(null);
  const [dbVenues, setDbVenues] = useState([]);
  const [adminBadge, setAdminBadge] = useState(0);
  const [preferences, setPreferences] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cl_prefs") || "[]"); } catch { return []; }
  });
  const timerRef = useRef(null);

  // Cosmetic only — it decides whether the Admin menu item renders. The real
  // control is profiles.is_admin, enforced by RLS and by the API routes; editing
  // this in devtools now gets you a menu that returns 403 and writes nothing.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user?.id) { setIsAdmin(false); return; }
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(); // "*" so a not-yet-migrated is_internal column can't break the admin check
      setIsAdmin(!!data?.is_admin);
      mpSetInternal(!!data?.is_admin || !!data?.is_internal);
    })();
  }, [user?.id]);

  // Guided product tour: each step drives which tab is shown. Also expose a
  // console hook so the tour can be replayed for testing/support.
  useEffect(() => {
    const st = tourStep >= 0 && tourStep < PRODUCT_TOUR.length ? PRODUCT_TOUR[tourStep] : null;
    if (!st) {
      // Tour ended: close anything it opened.
      if (tourSpotRef.current) { setDiscoverSpot(null); tourSpotRef.current = false; }
      setTourCapture(false); setTourPeopleTab(null);
      return;
    }
    setActiveTab(st.tab);
    if (st.tab !== "home") { setQuizStep(-1); setViewingPlan(null); }
    setTourPeopleTab(st.peopleTab || null);
    setTourCapture(st.open === "capture");
    if (st.open === "spot") {
      if (!tourSpotRef.current) {
        const v = (dbVenues || []).filter(x => x.photo_url && !x.is_event).sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0))[0];
        if (v) { setDiscoverSpot(v); tourSpotRef.current = true; }
      }
    } else if (tourSpotRef.current) { setDiscoverSpot(null); tourSpotRef.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const { data: listData } = await supabase.from("shared_lists").select("name,emoji,owner").eq("id", listId).single();
        if (listData?.owner === user.id) return; // you made it — not news to you
        if (!mpJoinedViaLink.has(listId)) mp("bucket_list_joined", { bucket_list_id: listId, bucket_list_source: "shared_from_friend", device_os: deviceType() });
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
      mpIdentify(session?.user?.id);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === "SIGNED_IN") {
        trackLogin(session?.user);
        const u = session?.user;
        mpIdentify(u?.id);
        rememberLoggedIn();
        // Brand-new account: created within the last minute of this sign-in.
        if (u?.created_at && Date.now() - new Date(u.created_at).getTime() < 60000) {
          mp("signup_completed", { signup_method: u.app_metadata?.provider || "email", device_os: deviceType(), acquisition_source: acquisitionSource(), timestamp_utc: new Date().toISOString() });
          shareConversion("signup_completed");
        }
      }
      if (event === "SIGNED_OUT") mpReset();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check for unrated past plans — only prompt once a plan is at least five days old,
  // and only once per app load (not every time the plans list changes, which used to
  // pop the prompt for an older plan right after saving a new one).
  const ratingCheckedRef = useRef(false);
  useEffect(() => {
    if (!user || plans.length === 0 || ratingCheckedRef.current) return;
    ratingCheckedRef.current = true;
    let reviewed; try { reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]"); } catch { reviewed = []; }
    const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
    const unrated = plans.find(p => p.id && !reviewed.includes(p.id) && p.createdAt && (Date.now() - Number(p.createdAt)) >= FIVE_DAYS);
    if (!unrated) return;
    const t = setTimeout(() => setRatingPlan(unrated), 1500);
    return () => clearTimeout(t);
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

  // Load approved venues from Supabase. Reads the experiences_public view, not
  // the table: the view exposes only catalogue columns, so promoting a user's
  // save into the pool can't leak their private note or visit date.
  useEffect(() => {
    async function loadVenues() {
      // Supabase caps every response at 1,000 rows, so page through the view
      // (ordered by id for stable pages) or venues past the first 1,000 vanish.
      const PAGE = 1000, all = [];
      let error = null;
      for (let from = 0; ; from += PAGE) {
        const res = await supabase.from("experiences_public").select("*").order("id").range(from, from + PAGE - 1);
        if (res.error) { error = res.error; break; }
        all.push(...res.data);
        if (res.data.length < PAGE) break;
      }
      if (all.length) { setDbVenues(all); return; }
      // Falls back to the table if the security migration hasn't been run yet, so
      // deploying the code before running the SQL doesn't empty out Discover.
      if (error) {
        const { data: legacy } = await supabase.from("experiences").select("*").eq("status", "approved");
        if (legacy) setDbVenues(legacy);
      }
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
      return updated;
    });
  }

  function startQuiz() {
    const hour = new Date().getHours();
    const timeOfDay = hour >= 17 ? "night" : hour >= 14 ? "full" : "day";
    const timeDefaults = timeOfDay === "day" ? { start: "10:00", end: "18:00" } : timeOfDay === "night" ? { start: "18:00", end: "00:00" } : { start: "10:00", end: "23:00" };
    setTimes(timeDefaults);
    setQuizStep(0);
    setAns({ timeOfDay, stops: "4", travel: "walk_tube", extras: [] });
    setResult(null); setError(null); setActiveTab("home");
  }
  function nextStep() {
    setQuizStep(s => {
      const next = s + 1;
      if (next === 1 && ans.savedVenues?.length) return 2;
      return next;
    });
  }
  function prevStep() {
    setQuizStep(s => {
      const prev = s - 1;
      if (prev === 1 && ans.savedVenues?.length) return 0;
      return Math.max(0, prev);
    });
  }

  async function generate() {
    setLoading(true); setError(null);
    const genStart = Date.now();
    const planId = generateId();
    const inputCount = (ans.savedVenues || []).length;
    const genKey = JSON.stringify(ans);
    mpGenAttempt = genKey === mpLastGenKey ? mpGenAttempt + 1 : 0; mpLastGenKey = genKey;
    if (mpGenAttempt > 0) mp("plan_regeneration_requested", { plan_id: planId, prior_generation_id: mpLastPlanId, regeneration_reason: "other", regeneration_attempt_number: mpGenAttempt, input_spot_count: inputCount });
    const dow = new Date().getDay();
    mp("plan_generation_requested", { plan_id: planId, generation_type: ans._barCrawl ? "night_plan" : ans.timeOfDay === "day" ? "day_plan" : ans.timeOfDay === "night" ? "night_plan" : "full_plan", input_spot_count: inputCount, time_window: dow === 0 || dow === 5 || dow === 6 ? "weekend" : "weekday", generation_trigger: mpLastGenFailed ? "regeneration_from_error" : inputCount ? "after_add_saves" : "generate_button" });
    mpLastPlanId = planId; mpLastGenFailed = false;
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
      mp("plan_generation_succeeded", { plan_id: planId, generation_success: true, estimated_total_travel_time_min: finalStops.reduce((t, st) => t + (Number(st.travel_minutes) || 0), 0), used_model: "claude-sonnet-4-6", input_spot_count: inputCount });
      track("plan_generated", { stops: finalStops.length, vibes: ans.vibes, budget: ans.budget, area: ans.area, fromSaved: !!(ans.savedVenues?.length) });
      setQuizStep(QUESTIONS.length + 1);
      const newPlan = { result: finalResult, ans: { ...ans }, times: { ...times }, savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), createdAt: Date.now(), id: planId };
      setPlans(prev => [newPlan, ...prev]);
      supabase.from("plans").insert({ id: newPlan.id, user_id: user.id, result: newPlan.result, ans: newPlan.ans, times: newPlan.times, saved_at: newPlan.savedAt, created_at: newPlan.createdAt }).then(({ error }) => { if (error) console.warn("plans:", error.message); });
      showToast("Plan saved to My Plans");
    } catch (e) {
      mpLastGenFailed = true;
      mp("plan_generation_failed", { plan_id: planId, generation_success: false, failure_reason: /timeout|abort/i.test(e.message || "") ? "timeout" : /taking a break|quota|limit/i.test(e.message || "") ? "quota" : /parse|json/i.test(e.message || "") ? "parsing_error" : "other", input_spot_count: inputCount });
      setError(e.message?.includes("AI is taking a break") ? e.message : "Couldn't generate your plan — try again in a moment.");
    }
    setLoading(false);
  }

  function resetToHome() { setQuizStep(-1); setAns({}); setResult(null); setError(null); setViewingPlan(null); setActiveTab("plans"); }
  function goToCalendar(msg) { setViewingPlan(null); setActiveTab("saved"); setCalSignal(n => n + 1); if (msg) showToast(msg); }
  function schedulePlanAt(idx, date) { setPlans(prev => { const u = prev.map((p, i) => { if (i === idx) { supabase.from("plans").update({ scheduled_date: date || null }).eq("id", p.id).then(({ error }) => { if (error) console.warn("plans:", error.message); }); return { ...p, scheduledDate: date || null }; } return p; }); return u; }); }

  const showQuiz = activeTab === "home" && quizStep >= 0 && quizStep <= QUESTIONS.length;
  const showResult = activeTab === "home" && quizStep === QUESTIONS.length + 1 && result;
  const showHome = activeTab === "home" && quizStep === -1;
  const showViewingPlan = activeTab === "plans" && viewingPlan;

  const TABS = [
    { id: "discover", label: "Discover", icon: "discover" },
    { id: "saved", label: "Saves", icon: "saved" },
    { id: "plans", label: "Plans", icon: "plans" },
    { id: "people", label: "People", icon: "people", badge: peopleBadge },
    { id: "me", label: "Me", icon: "me", badge: isAdmin ? adminBadge : 0 },
  ];

  // Stash link params on first load BEFORE they're lost — Google OAuth redirects back
  // to the bare origin, dropping ?invite / ?blist / ?plan. We persist them so the
  // handlers below can still run once the user is signed in.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    for (const k of ["invite", "blist", "plan"]) {
      const v = p.get(k);
      if (v) {
        try { localStorage.setItem("cl_pending_" + k, v); } catch (e) {}
        if (k !== "plan") mp("invite_link_opened", { share_channel: "web_link", invite_origin: k === "invite" ? "friend_invite" : "bucket_list" });
      }
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
    supabase.from("shared_plans").select("plan,times,title,created_at").eq("id", pid).single()
      .then(async ({ data }) => { if (data?.plan) { setSharedPlan({ ...data, id: pid }); clearPending("plan"); let sess = null; try { sess = (await supabase.auth.getSession()).data?.session; } catch { /* ignore */ } mp("plan_share_link_opened", { plan_id: pid, recipient_is_logged_in: !!sess, share_channel: "web_link", days_since_shared: data.created_at ? Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000) : undefined }); if (!sess) rememberShareOpen(pid); } })
      .catch(() => {});
  }, []);

  // Invite link: opening someone's ?invite=<id> connects the two of you.
  useEffect(() => {
    if (!user?.id) return;
    const inv = takePending("invite");
    if (!inv || inv === user.id) { clearPending("invite"); return; }
    (async () => {
      const [a, b] = [user.id, inv].sort();
      let before; try { before = (await supabase.from("connections").select("*", { count: "exact", head: true }).or(`user_a.eq.${user.id},user_b.eq.${user.id}`)).count; } catch (e) {}
      try { await supabase.from("connections").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b", ignoreDuplicates: true }); showToast("Connected! See the People tab."); mp("friend_connected", { connection_type: "invite_link_clicked", friend_count_before: before, connection_success: true, shared_list_created: false }); } catch (e) { mp("friend_connected", { connection_type: "invite_link_clicked", friend_count_before: before, connection_success: false, shared_list_created: false }); }
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
        let existing = 0; try { existing = (await supabase.from("shared_list_members").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count || 0; } catch (e) {}
        mpJoinedViaLink.add(blist);
        await supabase.from("shared_list_members").upsert({ list_id: blist, user_id: user.id }, { onConflict: "list_id,user_id" });
        mp("bucket_list_joined", { bucket_list_id: blist, bucket_list_source: "invite_link", device_os: deviceType(), is_first_bucket_list: existing === 0 });
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
      const { data } = await supabase.from("profiles_public").select("name").eq("id", otherId).single();
      const nm = data?.name || "Someone";
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

  const needsOnboarding = user && !onboardDone && !user.user_metadata?.onboarded && !localStorage.getItem("cl_onboarded_" + user.id);
  // Hooks must stay above the early returns below (auth loading / signed out), or React
  // throws "Rendered more hooks than during the previous render" once the session loads.
  // Existing users (onboarded before the tour prompt existed) get the "Want a quick tour?"
  // card once, on their next visit. New users get it straight after onboarding instead.
  useEffect(() => {
    if (!user || needsOnboarding) return;
    const key = "cl_tour_prompted_" + user.id;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { return; }
    const t = setTimeout(() => setTourPrompt(true), 900);
    return () => clearTimeout(t);
  }, [user?.id, needsOnboarding]);

  if (sharedPlan) return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div style={{ padding: "1rem 1.5rem 0" }}>
          <button className="btn-outline" style={{ marginTop: 0 }} onClick={() => { setSharedPlan(null); window.history.replaceState({}, "", "/"); }}>← Close shared plan</button>
        </div>
        <ResultScreen planId={sharedPlan.id} planSource="shared_link" result={sharedPlan.plan} times={sharedPlan.times || times} ans={{}} onRestart={() => { setSharedPlan(null); window.history.replaceState({}, "", "/"); }} onNewPlan={() => { setSharedPlan(null); window.history.replaceState({}, "", "/"); }} dbVenues={dbVenues} onUpdateResult={() => {}} />
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

  if (needsOnboarding) return (
    <>
      <style>{styles}</style>
      <Onboarding user={user} dbVenues={dbVenues} onDone={(seeded) => { setOnboardDone(true); setActiveTab("saved"); if (seeded) setShowStarter(true); try { localStorage.setItem("cl_tour_prompted_" + user.id, "1"); } catch {} setTourPrompt(true); }} />
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={"toast" + (toast.show ? " show" : "")}>{toast.msg}</div>
        {false && ( // Profile button removed — Me is now a tab
          <span></span>
        )}
        {ratingPlan && <RatingPrompt plan={ratingPlan} user={user} onDismiss={() => { const reviewed = JSON.parse(localStorage.getItem("cl_reviewed") || "[]"); reviewed.push(ratingPlan.id); localStorage.setItem("cl_reviewed", JSON.stringify(reviewed)); setRatingPlan(null); }} onSubmit={() => { setRatingPlan(null); showToast("Thanks for your review!"); }} />}

        {showHome && <HomeScreen onStart={startQuiz} />}
        {showQuiz && <QuizScreen step={quizStep} ans={ans} times={times} setTimes={setTimes} onToggle={toggle} onNext={nextStep} onBack={prevStep} onGenerate={generate} loading={loading} loadIdx={loadIdx} error={error} onExit={() => { setQuizStep(-1); setActiveTab("plans"); }} />}
        {showResult && <ResultScreen planId={plans[0]?.id} planSource="generated" result={result} times={times} ans={ans} onRestart={resetToHome} onNewPlan={startQuiz} dbVenues={dbVenues} onUpdateResult={setResult} onShare={setShareItem} onRate={() => plans[0] && setRatingPlan(plans[0])} scheduledDate={plans[0]?.scheduledDate} onSchedule={(date) => { if (!plans[0]) return; schedulePlanAt(0, date); goToCalendar("It's on your calendar! 📅"); }} />}

        {activeTab === "plans" && !showViewingPlan && <MyPlansScreen plans={plans} dbVenues={dbVenues} onViewPlan={(plan) => setViewingPlan(plan)} onNewPlan={() => { setActiveTab("home"); startQuiz(); }} onBarCrawl={() => setBarCrawl({ seed: [] })} onSchedule={(i, date) => schedulePlanAt(i, date)} />}
        {showViewingPlan && (
          <PlanDetailView
            plan={viewingPlan}
            onClose={() => setViewingPlan(null)}
            onNewPlan={() => { setViewingPlan(null); setActiveTab("home"); startQuiz(); }}
            dbVenues={dbVenues}
            onUpdateResult={(r) => setViewingPlan(p => ({ ...p, result: r }))}
            onShare={setShareItem}
            onRate={() => setRatingPlan(viewingPlan)}
            onSchedule={(date) => { const idx = plans.findIndex(p => p.id === viewingPlan.id); if (idx >= 0) schedulePlanAt(idx, date); goToCalendar("It's on your calendar! 📅"); }}
          />
        )}

        {activeTab === "discover" && <DiscoverScreen preferences={preferences} dbVenues={dbVenues} onStart={startQuiz} onOpenSpot={(v, ctx) => { mpDiscoverCtx = ctx || {}; setDiscoverSpot(v); }} savedKeys={savedKeys} onSave={saveDiscoverSpot} />}
        {discoverSpot && <SpotDetail spot={discoverSpot} onClose={() => setDiscoverSpot(null)} user={user} onSaveToBoard={() => saveDiscoverSpot(discoverSpot)} savedToBoard={savedKeys.has(feedKey(discoverSpot))} onMakePlan={(s) => { setDiscoverSpot(null); setActiveTab("home"); setAns({ savedVenues: [s] }); setQuizStep(0); }} />}
        {activeTab === "people" && <PeopleScreen user={user} tourTab={tourPeopleTab} onShareSaved={() => setPeopleBadge(n => Math.max(0, n - 1))} onSavePlan={(payload) => { const r = payload?.plan; if (!r) return; const newPlan = { result: r, times: payload?.times || times, ans: {}, savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), createdAt: Date.now(), id: generateId() }; setPlans(prev => [newPlan, ...prev]); supabase.from("plans").insert({ id: newPlan.id, user_id: user.id, result: newPlan.result, ans: newPlan.ans, times: newPlan.times, saved_at: newPlan.savedAt, created_at: newPlan.createdAt }).then(({ error }) => { if (error) console.warn("plans:", error.message); }); }} />}
        {/* Always mounted so an in-progress screenshot parse keeps running + persists when you switch tabs */}
        <div style={{ display: activeTab === "saved" ? "block" : "none" }}>
          {showStarter && (
            <div style={{ margin: "1rem 1.5rem 0", background: "#E3EDF6", border: "1px solid #BAD2E8", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem" }}>✦</span>
              <div style={{ flex: 1, fontSize: 15, color: "#7A1E33", lineHeight: 1.45 }}><strong>Based on what you liked.</strong> Here's your starter board — add more anytime with the + button.</div>
              <button onClick={() => setShowStarter(false)} style={{ border: "none", background: "none", color: "rgba(58,11,20,.45)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>×</button>
            </div>
          )}
          <SavedScreen user={user} visible={activeTab === "saved"} tourCapture={tourCapture} replayImportSignal={importSignal} dbVenues={dbVenues} openSignal={captureSignal} calendarSignal={calSignal} onShare={setShareItem} plans={plans} onBuildPlan={(saves) => { setResult(null); setError(null); setViewingPlan(null); setActiveTab("home"); setAns({ savedVenues: saves }); setQuizStep(0); }} onBarCrawl={(seed) => setBarCrawl({ seed: seed || [] })} />
        </div>
        {activeTab === "me" && <MeScreen user={user} preferences={preferences} setPreferences={setPreferences} isAdmin={isAdmin} onBadgeUpdate={setAdminBadge} adminBadge={adminBadge} onStartTour={() => setTourStep(0)} onRetakeQuiz={async () => { try { localStorage.removeItem("cl_onboarded_" + user.id); } catch {} try { await supabase.auth.updateUser({ data: { onboarded: false } }); } catch {} setOnboardDone(false); setActiveTab("saved"); window.scrollTo(0, 0); }} onStartImportTour={() => { setTourStep(-1); setActiveTab("saved"); setImportSignal(n => n + 1); }} />}

        {!showQuiz && !showResult && !showViewingPlan && (
          <button className="capture-fab" data-tour="save-fab" aria-label="Save a place"
            onClick={() => { setActiveTab("saved"); setQuizStep(-1); setViewingPlan(null); setCaptureSignal(n => n + 1); }}>
            +
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
                  <span style={{ position: "absolute", top: -4, right: -6, background: "#7A1E33", color: "#fff", borderRadius: "50%", fontSize: 11, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{tab.badge}</span>
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

        {tourPrompt && tourStep < 0 && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2900, background: "rgba(20,18,14,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn .2s" }}>
            <div style={{ background: "#FAF7F2", borderRadius: 18, padding: "24px 22px 20px", width: "100%", maxWidth: 360, textAlign: "center", animation: "popIn 0.3s cubic-bezier(.2,.9,.3,1)" }}>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 400, fontSize: 24, letterSpacing: "-0.03em", color: "#3A0B14", marginBottom: 10 }}>cu<span style={{ fontWeight: 900, color: "#7A1E33" }}>RATED</span><span style={{ fontWeight: 900, color: "#BAD2E8" }}>.</span></div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, lineHeight: 1.1, color: "#3A0B14", marginBottom: 8 }}>Want a quick tour?</div>
              <div style={{ fontSize: 15, color: "rgba(58,11,20,.6)", lineHeight: 1.5, marginBottom: 18 }}>Two minutes through saving a place, Discover, plans and friends.</div>
              <button onClick={() => { setTourPrompt(false); setTourStep(0); }} style={{ width: "100%", padding: 15, background: "#3A0B14", color: "#BAD2E8", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>Take the tour</button>
              <button onClick={() => setTourPrompt(false)} style={{ width: "100%", padding: 12, background: "transparent", color: "rgba(58,11,20,.55)", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Not now</button>
            </div>
          </div>
        )}
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