import { useState, useEffect, useRef } from "react";

// ── VENUE DATABASE ──────────────────────────────────────────
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

const AREA_ZONES = { central: ["central"], east: ["east"], south: ["south"], west: ["west"], anywhere: ["central", "east", "south", "west"] };
const VIBE_TAG_MAP = { chill: ["chill", "outdoor", "solo"], romantic: ["romantic", "aesthetic", "luxury"], chaotic: ["chaotic", "social", "underground", "night"], cultural: ["cultural", "iconic"], fancy: ["fancy", "luxury", "iconic"], hidden_gems: ["hidden_gems", "underground"], social: ["social", "chaotic"], solo: ["solo", "chill", "cultural"] };
const BUDGET_MAP = { low: ["low"], mid: ["low", "mid"], high: ["low", "mid", "high"], unlimited: ["low", "mid", "high"] };
const STOP_ORDER = { day: ["cafe", "outdoor", "museum", "gallery", "market", "experience", "restaurant"], night: ["restaurant", "bar", "event"], full: ["cafe", "outdoor", "museum", "restaurant", "bar", "event"] };

function scoreVenue(v, vibes, budget, area, timeOfDay, extras) {
  let score = 0;
  const zones = AREA_ZONES[area] || AREA_ZONES.anywhere;
  if (!zones.includes(v.travelZone)) return -1;
  const prices = BUDGET_MAP[budget] || ["low", "mid", "high"];
  if (!prices.includes(v.price)) return -1;
  const tod = timeOfDay === "full" ? "day,night" : timeOfDay;
  if (!v.bestTime.split(",").some((t) => tod.split(",").includes(t))) return -1;
  const wt = vibes.flatMap((vb) => VIBE_TAG_MAP[vb] || [vb]);
  score += v.tags.filter((t) => wt.includes(t)).length * 3;
  if (extras.includes("food") && ["restaurant", "cafe"].includes(v.type)) score += 4;
  if (extras.includes("drinks") && v.type === "bar") score += 4;
  if (extras.includes("outdoor") && v.tags.includes("outdoor")) score += 3;
  if (extras.includes("social") && v.tags.includes("social")) score += 3;
  return score;
}

function buildShortlist(answers) {
  const { vibes, area, budget, timeOfDay, extras } = answers;
  const scored = VENUES.map((v) => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", area || "anywhere", timeOfDay || "night", extras || []) }))
    .filter((v) => v.score >= 0).sort((a, b) => b.score - a.score);
  const types = STOP_ORDER[timeOfDay] || STOP_ORDER.night;
  const used = new Set(), usedTypes = {}, shortlist = [];
  for (const t of types) {
    const c = scored.filter((v) => v.type === t && !used.has(v.id) && (usedTypes[t] || 0) < 2);
    if (c[0]) { shortlist.push(c[0]); used.add(c[0].id); usedTypes[t] = (usedTypes[t] || 0) + 1; }
  }
  while (shortlist.length < 4) {
    const n = scored.find((v) => !used.has(v.id));
    if (!n) break;
    shortlist.push(n); used.add(n.id);
  }
  return shortlist.slice(0, 5);
}

const QUESTIONS = [
  { id: "timeOfDay", label: "1 of 7", title: "Day out or night in London?", multi: false, options: [{ value: "day", label: "Day plan", emoji: "☀️" }, { value: "night", label: "Night plan", emoji: "🌙" }, { value: "full", label: "Full day + night", emoji: "🌅" }] },
  { id: "vibes", label: "2 of 7", title: "Pick your vibe", multi: true, options: [{ value: "chill", label: "Chill", emoji: "😌" }, { value: "romantic", label: "Romantic", emoji: "🌹" }, { value: "chaotic", label: "Chaotic fun", emoji: "🌀" }, { value: "cultural", label: "Cultural", emoji: "🏛️" }, { value: "fancy", label: "Fancy", emoji: "🥂" }, { value: "hidden_gems", label: "Hidden gems", emoji: "💎" }, { value: "social", label: "Social", emoji: "🎉" }, { value: "solo", label: "Solo reset", emoji: "🧘" }] },
  { id: "area", label: "3 of 7", title: "Any area preference?", multi: false, options: [{ value: "central", label: "Central", emoji: "🎭" }, { value: "east", label: "East London", emoji: "🧱" }, { value: "south", label: "South London", emoji: "🌉" }, { value: "west", label: "West London", emoji: "🌳" }, { value: "anywhere", label: "Anywhere", emoji: "🗺️" }] },
  { id: "budget", label: "4 of 7", title: "Budget vibe?", multi: false, options: [{ value: "low", label: "Broke but fun", emoji: "💸" }, { value: "mid", label: "Mid range", emoji: "💳" }, { value: "high", label: "Treat yourself", emoji: "✨" }, { value: "unlimited", label: "No limit", emoji: "🚀" }] },
  { id: "groupSize", label: "5 of 7", title: "Who's coming?", multi: false, options: [{ value: "solo", label: "Just me", emoji: "🙋" }, { value: "duo", label: "Two of us", emoji: "👫" }, { value: "small", label: "3–5 people", emoji: "👯" }, { value: "large", label: "5+ crew", emoji: "🎊" }] },
  { id: "energy", label: "6 of 7", title: "Energy level today?", multi: false, options: [{ value: "low", label: "Low & breezy", emoji: "🌿" }, { value: "medium", label: "Up for it", emoji: "⚡" }, { value: "high", label: "Max chaos", emoji: "🔥" }] },
  { id: "extras", label: "7 of 7", title: "Must-haves?", multi: true, options: [{ value: "food", label: "Food included", emoji: "🍜" }, { value: "drinks", label: "Drinks/bars", emoji: "🍸" }, { value: "outdoor", label: "Outdoor spaces", emoji: "🌳" }, { value: "social", label: "Meet people", emoji: "🤝" }] },
];

const LOADS = ["Raiding our London database...", "Matching your vibe to venues...", "Checking geographic flow...", "Building your perfect sequence...", "Final polish..."];

// Event category colours from Figma palette
const EVENT_COLOURS = {
  Music: { bg: "#1B998B", text: "#fff" },
  Nightlife: { bg: "#2D1B69", text: "#fff" },
  Arts: { bg: "#F7B731", text: "#1a1a1a" },
  Food: { bg: "#E84855", text: "#fff" },
  Comedy: { bg: "#F7B731", text: "#1a1a1a" },
  Theatre: { bg: "#6B4226", text: "#fff" },
  default: { bg: "#3D5A80", text: "#fff" },
};

const AREA_FILTERS = ["All", "Central", "East", "South", "West"];
const EVENT_FILTERS = ["All", "Music", "Nightlife", "Arts", "Food", "Comedy", "Theatre"];

function generateId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

// ── STYLES ──────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: #ffffff; color: #1c1c1a; min-height: 100vh; overflow-x: hidden; }

  .app { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #ffffff; padding-bottom: 80px; position: relative; }

  /* ── DECORATIVE SHAPES ── */
  .shapes-wrap { position: absolute; top: 0; right: -20px; width: 220px; height: 260px; pointer-events: none; z-index: 0; }
  .shape-circle { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; animation: spin-cw 14s linear infinite; }
  .shape-teal { width: 130px; height: 130px; background: #1B998B; top: 0; right: 40px; animation-duration: 16s; }
  .shape-yellow { width: 160px; height: 160px; background: #F4C842; top: 80px; right: -10px; animation-duration: 20s; }
  .shape-cream { width: 80px; height: 80px; background: #F7EFD4; top: 150px; right: 140px; animation-duration: 12s; }
  .inner-oval { width: 56px; height: 32px; background: #B8A9D9; border-radius: 50%; animation: spin-cw 8s linear infinite; }
  .inner-starburst { animation: spin-cw 6s linear infinite; }
  .inner-star4 { animation: spin-cw 10s linear infinite; }
  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }

  /* ── HOME HERO ── */
  .home-hero { padding: 3.5rem 1.5rem 2rem; position: relative; overflow: hidden; min-height: 300px; background: #ffffff; }
  .home-eyebrow { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8f7a; margin-bottom: 0.6rem; position: relative; z-index: 1; }
  .home-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 3rem; font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #1c1c1a; margin-bottom: 0.75rem; position: relative; z-index: 1; }
  .home-title em { font-style: italic; color: #1B998B; }
  .home-sub { font-size: 0.85rem; color: #6b5e4e; line-height: 1.5; position: relative; z-index: 1; max-width: 200px; }
  .home-cta { margin-top: 1.5rem; position: relative; z-index: 1; }

  /* ── BOTTOM NAV ── */
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; background: #fff; border-top: 1px solid #e8e2d8; display: flex; z-index: 100; padding-bottom: env(safe-area-inset-bottom); }
  .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px 8px; border: none; background: none; cursor: pointer; gap: 3px; transition: all 0.15s; }
  .nav-tab-icon { font-size: 1.3rem; line-height: 1; transition: transform 0.2s; }
  .nav-tab.active .nav-tab-icon { transform: scale(1.15); }
  .nav-tab-label { font-family: 'DM Sans', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.04em; color: #b8ac9a; text-transform: uppercase; transition: color 0.15s; }
  .nav-tab.active .nav-tab-label { color: #1c1c1a; }
  .nav-tab-dot { width: 4px; height: 4px; border-radius: 50%; background: #1B998B; opacity: 0; transition: opacity 0.15s; }
  .nav-tab.active .nav-tab-dot { opacity: 1; }

  /* ── SHARED COMPONENTS ── */
  .section-pad { padding: 1.5rem; }
  .section-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.4rem; font-weight: 400; color: #1c1c1a; margin-bottom: 0.25rem; }
  .section-sub { font-size: 0.8rem; color: #9b8f7a; margin-bottom: 1.25rem; line-height: 1.4; }
  .divider { height: 1px; background: #e8e2d8; margin: 0 1.5rem; }

  .btn { width: 100%; padding: 14px; border-radius: 100px; border: none; background: #1c1c1a; color: #ffffff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em; }
  .btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.88; }
  .btn:active:not(:disabled) { transform: scale(0.99); }
  .btn-teal { background: #1B998B; }
  .btn-outline { width: 100%; padding: 13px; border-radius: 100px; border: 1.5px solid #ddd8ce; background: transparent; color: #4a4438; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; margin-top: 0.6rem; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
  .btn-outline:hover { border-color: #1c1c1a; color: #1c1c1a; }
  .btn-ghost { background: none; border: none; color: #9b8f7a; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; cursor: pointer; padding: 1rem 1.5rem 0; display: flex; align-items: center; gap: 5px; }
  .btn-ghost:hover { color: #1c1c1a; }

  .chip { padding: 9px 16px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: flex; align-items: center; gap: 6px; user-select: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .chip:hover { border-color: #b8ac9a; }
  .chip.sel { background: #1c1c1a; color: #ffffff; border-color: #1c1c1a; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }

  .card { background: #fff; border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.4rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }

  /* ── QUIZ ── */
  .q-label { font-size: 0.68rem; font-weight: 500; color: #b8ac9a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem; }
  .q-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.6rem; line-height: 1.2; color: #1c1c1a; margin-bottom: 1.5rem; }
  .progress-label { font-size: 0.68rem; color: #b8ac9a; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .progress-bg { height: 2px; background: #e8e2d8; border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: #1B998B; border-radius: 2px; transition: width 0.4s ease; }
  .time-row { display: flex; gap: 10px; }
  .time-wrap { flex: 1; }
  .time-wrap label { font-size: 0.68rem; color: #9b8f7a; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 6px; }
  .time-wrap input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; }
  .time-wrap input:focus { outline: none; border-color: #1B998B; }

  /* ── LOADING ── */
  .loading { display: flex; flex-direction: column; align-items: center; padding: 5rem 2rem; text-align: center; }
  .loading-ring { width: 44px; height: 44px; border: 2.5px solid #e8e2d8; border-top-color: #1B998B; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem; }
  .loading-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.3rem; color: #1c1c1a; margin-bottom: 0.4rem; }
  .loading-sub { font-size: 0.82rem; color: #9b8f7a; }

  /* ── RESULT ── */
  .result-hero { padding: 2rem 1.5rem 1.5rem; border-bottom: 1px solid #e8e2d8; animation: fadeUp 0.4s ease; }
  .result-eyebrow { font-size: 0.68rem; font-weight: 500; color: #1B998B; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
  .result-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.8rem; line-height: 1.15; color: #1c1c1a; margin-bottom: 0.3rem; }
  .result-tagline { font-size: 0.88rem; color: #6b5e4e; line-height: 1.5; margin-bottom: 0.85rem; font-style: italic; }
  .result-meta { display: flex; gap: 1rem; font-size: 0.78rem; color: #9b8f7a; flex-wrap: wrap; }
  .vibe-pills { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 0.75rem; }
  .vibe-pill { font-size: 0.66rem; padding: 3px 9px; border-radius: 100px; border: 1px solid #ddd8ce; color: #6b5e4e; background: #fff; }

  .tab-bar { display: flex; border-bottom: 1px solid #e8e2d8; background: #ffffff; }
  .tab { flex: 1; padding: 0.85rem; border: none; background: none; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; color: #9b8f7a; border-bottom: 2px solid transparent; transition: all 0.15s; margin-bottom: -1px; }
  .tab.active { color: #1B998B; border-bottom-color: #1B998B; font-weight: 500; }

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
  .stop-time { font-size: 0.68rem; font-weight: 500; color: #1B998B; text-transform: uppercase; letter-spacing: 0.06em; }
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

  /* ── MY PLANS ── */
  .plan-card { background: #fff; border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.1rem; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); cursor: pointer; transition: all 0.15s; animation: fadeUp 0.3s ease; }
  .plan-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .plan-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
  .plan-card-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1rem; color: #1c1c1a; line-height: 1.2; }
  .plan-card-date { font-size: 0.68rem; color: #9b8f7a; }
  .plan-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.5rem; }
  .plan-tag { font-size: 0.66rem; padding: 2px 8px; border-radius: 100px; background: #f5f0e8; color: #6b5e4e; }
  .plan-tag.teal { background: #e0f5f3; color: #1B998B; }
  .empty-state { text-align: center; padding: 3rem 2rem; }
  .empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .empty-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.2rem; color: #1c1c1a; margin-bottom: 0.5rem; }
  .empty-sub { font-size: 0.82rem; color: #9b8f7a; line-height: 1.5; margin-bottom: 1.5rem; }

  /* ── DISCOVER ── */
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
  .event-card-price { font-size: 0.72rem; font-weight: 500; color: #1B998B; }

  .events-loading { text-align: center; padding: 3rem 1.5rem; color: #9b8f7a; font-size: 0.85rem; }
  .events-error { text-align: center; padding: 2rem 1.5rem; }
  .api-note { background: #f5f0e8; border-radius: 12px; padding: 1rem; margin: 0 1.5rem 1rem; font-size: 0.75rem; color: #6b5e4e; line-height: 1.5; border-left: 3px solid #1B998B; }

  /* ── SOCIAL ── */
  .social-wrap { padding: 1.5rem; }
  .social-section-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9b8f7a; margin-bottom: 0.75rem; font-weight: 500; }
  .social-card { border: 1px solid #e8e2d8; border-radius: 14px; background: #fff; overflow: hidden; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .social-card-top { padding: 1rem; border-bottom: 1px solid #f0ebe2; }
  .social-card-title { font-size: 0.9rem; font-weight: 500; color: #1c1c1a; margin-bottom: 3px; }
  .social-card-sub { font-size: 0.75rem; color: #9b8f7a; line-height: 1.4; }
  .share-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .share-btn { padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.8rem; cursor: pointer; background: none; border: none; color: #4a4438; border-right: 1px solid #f0ebe2; font-family: 'DM Sans', sans-serif; transition: background 0.12s; }
  .share-btn:last-child { border-right: none; }
  .share-btn:hover { background: #ffffff; }
  .link-box { display: flex; align-items: center; gap: 8px; background: #ffffff; border-radius: 9px; padding: 0.6rem 0.9rem; margin: 0 1rem 1rem; }
  .link-url { font-size: 0.72rem; color: #9b8f7a; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; }
  .feat-row { display: flex; align-items: flex-start; gap: 10px; padding: 0.85rem 1rem; border-bottom: 1px solid #f0ebe2; }
  .feat-row:last-child { border-bottom: none; }
  .feat-icon { width: 34px; height: 34px; border-radius: 10px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .feat-body { flex: 1; }
  .feat-title { font-size: 0.84rem; font-weight: 500; color: #1c1c1a; margin-bottom: 2px; }
  .feat-sub { font-size: 0.73rem; color: #9b8f7a; line-height: 1.35; }
  .feat-badge { display: inline-block; font-size: 0.6rem; padding: 2px 7px; border-radius: 100px; margin-top: 4px; background: #f5f0e8; color: #8b7355; }
  .feat-badge.live { background: #e0f5f3; color: #1B998B; }
  .profile-row { display: flex; align-items: center; gap: 10px; padding: 0.75rem; border: 1px solid #e8e2d8; border-radius: 10px; margin-bottom: 8px; }
  .avatar { width: 38px; height: 38px; border-radius: 50%; background: #1c1c1a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 500; flex-shrink: 0; }
  .ptag { font-size: 0.62rem; padding: 2px 7px; border-radius: 100px; background: #f5f0e8; color: #6b5e4e; }
  .vote-row { display: flex; align-items: center; gap: 10px; padding: 0.75rem 1rem; border-bottom: 1px solid #f0ebe2; cursor: pointer; transition: background 0.12s; }
  .vote-row:last-child { border-bottom: none; }
  .vote-row:hover { background: #ffffff; }
  .vote-bar-bg { flex: 1; height: 5px; background: #f0ebe2; border-radius: 3px; overflow: hidden; }
  .vote-bar-fill { height: 100%; background: #1B998B; border-radius: 3px; transition: width 0.4s ease; }

  /* ── TOAST ── */
  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #1c1c1a; color: #ffffff; padding: 10px 20px; border-radius: 100px; font-size: 0.82rem; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; font-family: 'DM Sans', sans-serif; }
  .toast.show { opacity: 1; }
  .err { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #fdf0ef; border: 1px solid #f5d0cc; color: #c0392b; font-size: 0.82rem; line-height: 1.4; }

  /* ── COLOUR ACCENTS ── */
  .accent-teal { color: #1B998B; }
  .bg-teal { background: #1B998B; }
  .bg-yellow { background: #F7B731; }
  .bg-pink { background: #FFB3C6; }
`;

// ── MOCK EVENT DATA (shown when no API key) ──────────────────
const MOCK_EVENTS = [
  { id: "e1", name: "Floating Points at Fabric", venue: "Fabric, Farringdon", date: "Fri 16 May", category: "Nightlife", area: "central", price: "£15", emoji: "💿", colour: EVENT_COLOURS.Nightlife },
  { id: "e2", name: "Summer Exhibition Preview", venue: "Royal Academy of Arts", date: "Sat 17 May", category: "Arts", area: "central", price: "£22", emoji: "🖼️", colour: EVENT_COLOURS.Arts },
  { id: "e3", name: "Night Markets: Peckham", venue: "Peckham Levels Rooftop", date: "Sat 17 May", category: "Food", area: "south", price: "Free", emoji: "🍜", colour: EVENT_COLOURS.Food },
  { id: "e4", name: "Ibeyi Live", venue: "Roundhouse, Camden", date: "Sun 18 May", category: "Music", area: "central", price: "£28", emoji: "🎵", colour: EVENT_COLOURS.Music },
  { id: "e5", name: "East End Film Festival", venue: "Genesis Cinema, Stepney", date: "Thu 22 May", category: "Arts", area: "east", price: "£12", emoji: "🎬", colour: EVENT_COLOURS.Arts },
  { id: "e6", name: "Hackney Colliery Band", venue: "Victoria Park", date: "Sat 24 May", category: "Music", area: "east", price: "Free", emoji: "🎺", colour: EVENT_COLOURS.Music },
  { id: "e7", name: "Soho Comedy Night", venue: "Soho Theatre", date: "Wed 21 May", category: "Comedy", area: "central", price: "£18", emoji: "🎭", colour: EVENT_COLOURS.Comedy },
  { id: "e8", name: "Bermondsey Antiques Market", venue: "Bermondsey Square", date: "Fri 16 May", category: "Food", area: "south", price: "Free", emoji: "🏺", colour: EVENT_COLOURS.Food },
  { id: "e9", name: "FOLD: All Night Long", venue: "Fold, Canning Town", date: "Sat 17 May", category: "Nightlife", area: "east", price: "£12", emoji: "🔊", colour: EVENT_COLOURS.Nightlife },
  { id: "e10", name: "Kew After Hours", venue: "Kew Gardens", date: "Fri 23 May", category: "Arts", area: "west", price: "£30", emoji: "🌺", colour: EVENT_COLOURS.Arts },
];

// ── COMPONENTS ───────────────────────────────────────────────

function DecorativeShapes() {
  return (
    <div className="shapes-wrap">
      {/* Teal circle with spinning purple oval inside */}
      <div className="shape-circle shape-teal">
        <div className="inner-oval" />
      </div>

      {/* Yellow circle with spinning pink starburst inside */}
      <div className="shape-circle shape-yellow">
        <svg className="inner-starburst" width="120" height="120" viewBox="0 0 120 120">
          <polygon fill="#F4A7C0" points="60,4 63,40 80,8 70,42 95,20 72,48 108,38 76,56 112,60 76,64 108,82 72,72 95,100 70,78 80,112 63,80 60,116 57,80 40,112 50,78 25,100 48,72 12,82 44,64 8,60 44,56 12,38 48,48 25,20 50,42 40,8 57,40" />
        </svg>
      </div>

      {/* Cream circle with spinning orange 4-point star inside */}
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
        <p className="home-sub">60+ hand-picked experiences. One perfect plan. Matched to you. </p>
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
            <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? "#1B998B" : i === 1 ? "#F7B731" : "#1c1c1a", display: "flex", alignItems: "center", justifyContent: "center", color: i === 1 ? "#1c1c1a" : "#fff", fontSize: "1rem", flexShrink: 0, fontWeight: 700 }}>{icon}</div>
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

function QuizScreen({ step, ans, times, setTimes, onToggle, onNext, onBack, onGenerate, loading, loadIdx, error }) {
  const q = QUESTIONS[step];
  const totalSteps = QUESTIONS.length + 1;
  const progressPct = Math.round(((step + 1) / totalSteps) * 100);

  function canNext() {
    if (step >= QUESTIONS.length) return true;
    const a = ans[q.id];
    return q.multi ? a && a.length > 0 : !!a;
  }

  if (loading) return (
    <div className="loading">
      <div className="loading-ring" />
      <div className="loading-title">Building your plan</div>
      <div className="loading-sub">{LOADS[loadIdx]}</div>
    </div>
  );

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
                  onClick={() => { onToggle(q.id, opt.value, q.multi); if (!q.multi) setTimeout(onNext, 200); }}>
                  <span>{opt.emoji}</span>{opt.label}
                </div>
              );
            })}
          </div>
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

function ResultScreen({ result, times, ans, onRestart, onNewPlan }) {
  const [view, setView] = useState("plan");
  const [shareId] = useState(generateId);
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState(null);
  const showToastRef = useRef(null);

  const MOCK_VOTES = [
    { emoji: "🎷", label: "Underground jazz, Nightjar", votes: 3 },
    { emoji: "🌀", label: "Warehouse rave, Fold", votes: 1 },
    { emoji: "🕯️", label: "Sessions Arts Club dinner", votes: 2 },
  ];
  const MOCK_PROFILES = [
    { initials: "SK", name: "Sophia K.", meta: "East London · free tonight", tags: ["hidden_gems", "cultural"], match: 94 },
    { initials: "MR", name: "Marcus R.", meta: "Hackney · up for anything", tags: ["chaotic", "social"], match: 87 },
  ];

  const voteData = MOCK_VOTES.map((o, i) => ({ ...o, votes: o.votes + (voted === i ? 1 : 0) }));
  const totalVotes = voteData.reduce((s, o) => s + o.votes, 0);

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
                  <div className="stop-inner">
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
                      {stop.cost_estimate && <span className="stop-pill">💰 {stop.cost_estimate}</span>}
                      {stop.area && <span className="stop-pill">📍 {stop.area}</span>}
                    </div>
                    <div className="stop-booking">{stop.booking}</div>
                  </div>
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
              <div className="social-card-sub">Anyone with the link sees your full plan and can clone it.</div>
            </div>
            <div className="link-box">
              <span className="link-url">londonyourway.app/plan/{shareId}</span>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => { navigator.clipboard?.writeText(`https://londonyourway.app/plan/${shareId}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "✓" : "📋"}</button>
            </div>
            <div className="share-actions">
              <button className="share-btn" onClick={() => navigator.clipboard?.writeText(`https://londonyourway.app/plan/${shareId}`)}>🔗 Copy link</button>
              <button className="share-btn" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this London plan: https://londonyourway.app/plan/${shareId}`)}`)}>💬 WhatsApp</button>
            </div>
          </div>

          <div className="social-section-title" style={{ marginTop: "1.25rem" }}>Group planning</div>
          <div className="social-card">
            {[{ icon: "👥", title: "Shared vibe quiz", sub: "Everyone's answers merged into one group plan.", badge: "live" },
              { icon: "👍", title: "Vote on options", sub: "Generate 2–3 plans, group votes. Majority wins.", badge: "soon" },
              { icon: "🗓️", title: "Availability matching", sub: "Connect calendars to find when everyone's free.", badge: "soon" }
            ].map((f, i) => (
              <div key={i} className="feat-row">
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-body">
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-sub">{f.sub}</div>
                  <span className={`feat-badge ${f.badge === "live" ? "live" : ""}`}>{f.badge === "live" ? "Live" : "Coming soon"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="social-section-title" style={{ marginTop: "1.25rem" }}>Vote on the night</div>
          <div className="social-card">
            <div className="social-card-top">
              <div className="social-card-title">Can't decide?</div>
              <div className="social-card-sub">{voted === null ? "Tap to cast your vote." : "Results live."}</div>
            </div>
            {voteData.map((o, i) => {
              const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0;
              return (
                <div key={i} className="vote-row" onClick={() => { if (voted === null) setVoted(i); }}>
                  <span style={{ fontSize: "1rem", minWidth: "20px" }}>{o.emoji}</span>
                  <span style={{ fontSize: "0.8rem", flex: 1, color: "#4a4438" }}>{o.label}</span>
                  <div className="vote-bar-bg"><div className="vote-bar-fill" style={{ width: voted !== null ? `${pct}%` : "0%" }} /></div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 500, minWidth: "28px", textAlign: "right", color: "#9b8f7a" }}>{voted !== null ? `${pct}%` : ""}</span>
                </div>
              );
            })}
          </div>

          <div className="social-section-title" style={{ marginTop: "1.25rem" }}>Find people to go with</div>
          <div className="social-card">
            <div className="social-card-top">
              <div className="social-card-title">Going solo? You don't have to.</div>
              <div className="social-card-sub">Matched by vibe, area, and availability. No swiping.</div>
            </div>
            <div style={{ padding: "1rem" }}>
              {MOCK_PROFILES.map((p, i) => (
                <div key={i} className="profile-row">
                  <div className="avatar">{p.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.84rem", fontWeight: 500, color: "#1c1c1a" }}>{p.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9b8f7a", marginTop: 1 }}>{p.meta}</div>
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>{p.tags.map((t, j) => <span key={j} className="ptag">{t}</span>)}</div>
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 500, color: "#1B998B" }}>{p.match}%</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "0 1rem 1rem", fontSize: "0.72rem", color: "#9b8f7a" }}>Opt-in only. Profiles anonymous until both people connect.</div>
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
        <div className="empty-sub">Generate your first London plan and it'll appear here. Then share it, revisit it, or use it as a starting point.</div>
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

function DiscoverScreen() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [areaFilter, setAreaFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [usingMock, setUsingMock] = useState(true);

  // Filter events
  const filtered = events.filter(e => {
    const areaOk = areaFilter === "All" || e.area === areaFilter.toLowerCase();
    const catOk = catFilter === "All" || e.category === catFilter;
    return areaOk && catOk;
  });

  async function fetchFromEventbrite() {
    // Eventbrite API — needs VITE_EVENTBRITE_API_KEY in .env
    const key = import.meta.env.VITE_EVENTBRITE_API_KEY;
    if (!key) return null;
    try {
      const resp = await fetch(`https://www.eventbriteapi.com/v3/events/search/?location.address=London&location.within=10km&expand=venue,category&token=${key}`);
      const data = await resp.json();
      return data.events?.map(ev => ({
        id: ev.id,
        name: ev.name.text,
        venue: ev.venue?.name || "London",
        date: new Date(ev.start.local).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        category: ev.category?.name || "Arts",
        area: "central",
        price: ev.is_free ? "Free" : "See site",
        emoji: "🎟️",
        colour: EVENT_COLOURS[ev.category?.name] || EVENT_COLOURS.default,
        url: ev.url,
      })) || null;
    } catch { return null; }
  }

  async function fetchFromTicketmaster() {
    // Ticketmaster API — needs VITE_TICKETMASTER_API_KEY in .env
    const key = import.meta.env.VITE_TICKETMASTER_API_KEY;
    if (!key) return null;
    try {
      const resp = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?city=London&countryCode=GB&size=20&apikey=${key}`);
      const data = await resp.json();
      const evs = data._embedded?.events;
      if (!evs) return null;
      return evs.map(ev => ({
        id: ev.id,
        name: ev.name,
        venue: ev._embedded?.venues?.[0]?.name || "London",
        date: new Date(ev.dates.start.dateTime || ev.dates.start.localDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        category: ev.classifications?.[0]?.segment?.name || "Music",
        area: "central",
        price: ev.priceRanges ? `£${Math.round(ev.priceRanges[0].min)}` : "See site",
        emoji: ev.classifications?.[0]?.segment?.name === "Music" ? "🎵" : "🎟️",
        colour: EVENT_COLOURS[ev.classifications?.[0]?.segment?.name] || EVENT_COLOURS.default,
        url: ev.url,
      }));
    } catch { return null; }
  }

  useEffect(() => {
    async function load() {
      setLoadingEvents(true);
      const eb = await fetchFromEventbrite();
      if (eb) { setEvents(eb); setUsingMock(false); setLoadingEvents(false); return; }
      const tm = await fetchFromTicketmaster();
      if (tm) { setEvents(tm); setUsingMock(false); setLoadingEvents(false); return; }
      setEvents(MOCK_EVENTS);
      setUsingMock(true);
      setLoadingEvents(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.75rem" }}>
        <div className="section-title">Discover</div>
        <p className="section-sub">What's on in London this week</p>
      </div>

      {usingMock && (
        <div className="api-note">
          <strong>Live events coming soon.</strong> Add <code>VITE_TICKETMASTER_API_KEY</code> or <code>VITE_EVENTBRITE_API_KEY</code> to your .env to pull real London events. Showing curated picks for now.
        </div>
      )}

      <div className="filter-row">
        {AREA_FILTERS.map(f => (
          <div key={f} className={`filter-chip ${areaFilter === f ? "sel" : ""}`} onClick={() => setAreaFilter(f)}>{f}</div>
        ))}
      </div>
      <div className="filter-row" style={{ paddingTop: 0 }}>
        {EVENT_FILTERS.map(f => (
          <div key={f} className={`filter-chip ${catFilter === f ? "sel" : ""}`} onClick={() => setCatFilter(f)}>{f}</div>
        ))}
      </div>

      {loadingEvents ? (
        <div className="events-loading">Loading events...</div>
      ) : (
        <div style={{ padding: "0 1.5rem 1rem" }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🔍</div>
              <div className="empty-title">Nothing matching</div>
              <div className="empty-sub">Try a different area or category filter.</div>
            </div>
          ) : filtered.map((ev, i) => (
            <div key={ev.id} className="event-card" onClick={() => ev.url && window.open(ev.url, "_blank")}>
              <div className="event-card-img" style={{ background: ev.colour.bg }}>
                <span className="event-card-emoji">{ev.emoji}</span>
              </div>
              <div className="event-card-body">
                <div className="event-card-cat" style={{ color: ev.colour.bg }}>{ev.category}</div>
                <div className="event-card-name">{ev.name}</div>
                <div className="event-card-venue">📍 {ev.venue}</div>
                <div className="event-card-row">
                  <div className="event-card-date">📅 {ev.date}</div>
                  <div className="event-card-price">{ev.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [quizStep, setQuizStep] = useState(-1); // -1 = not started
  const [ans, setAns] = useState({});
  const [times, setTimes] = useState({ start: "18:00", end: "23:00" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]); // saved plans
  const [viewingPlan, setViewingPlan] = useState(null);
  const [toast, setToast] = useState({ msg: "", show: false });
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading) { timerRef.current = setInterval(() => setLoadIdx(i => (i + 1) % LOADS.length), 1600); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  function showToast(msg) { setToast({ msg, show: true }); setTimeout(() => setToast(t => ({ ...t, show: false })), 2200); }

  function toggle(qId, val, multi) {
    setAns(prev => {
      if (multi) { const cur = prev[qId] || []; return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }; }
      return { ...prev, [qId]: val };
    });
  }

  function startQuiz() { setQuizStep(0); setAns({}); setResult(null); setError(null); setActiveTab("home"); }
  function nextStep() { setQuizStep(s => s + 1); }
  function prevStep() { setQuizStep(s => Math.max(0, s - 1)); }


  async function generate() {
    setLoading(true); setError(null);
    const shortlist = buildShortlist(ans);
    const venueData = JSON.stringify(shortlist.map(v => ({
      name: v.name, type: v.type, area: v.travelZone + " London",
      price: v.price, tags: v.tags, desc: v.desc, emoji: v.emoji,
      booking: v.bookingRequired ? "Book ahead" : "Walk-in fine"
    })));

    const prompt = "You are London's sharpest local guide. Build a perfect itinerary from these curated venues. User: " +
      ans.timeOfDay + " plan, vibes: " + (ans.vibes || []).join(", ") +
      ", area: " + ans.area + ", budget: " + ans.budget +
      ", group: " + ans.groupSize + ", energy: " + ans.energy +
      ", " + times.start + " to " + times.end +
      ", include: " + ((ans.extras || []).join(", ") || "no extras") +
      ". Venues (pick best 4-5): " + venueData +
      ". Respond ONLY with valid JSON, no markdown, no backticks: " +
      '{"title":"punchy name","tagline":"witty sentence","vibe_scores":{"fun":7,"romantic":3,"cultural":6,"chaotic":2},"total_cost_estimate":"35-55pp","stops":[{"time":"18:30","name":"venue name","type":"bar","area":"Shoreditch","emoji":"🍸","hook":"best thing about this place","why_it_fits":"vibe match","booking":"Walk-in fine","cost_estimate":"12pp","travel_to_next":"7 min walk"}],"extend_the_night":"late suggestion","local_tip":"insider tip"}';

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        }),
      });
      const data = await resp.json();
      console.log("API response:", data);
      const txt = data.content?.find(b => b.type === "text")?.text || "";
      const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
      setResult(parsed);
      setQuizStep(QUESTIONS.length + 1);
      const savedPlan = {
        result: parsed,
        ans: { ...ans },
        times: { ...times },
        savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        id: generateId()
      };
      setPlans(prev => [savedPlan, ...prev]);
      showToast("Plan saved to My Plans");
    } catch (e) {
      console.log("Error:", e);
      setError("Couldn't generate your plan. Check your API key in .env and try again.");
    }
    setLoading(false);
  }

  function resetToHome() {
    setQuizStep(-1); setAns({}); setResult(null); setError(null); setViewingPlan(null);
  }

  const showQuiz = activeTab === "home" && quizStep >= 0 && quizStep <= QUESTIONS.length;
  const showResult = activeTab === "home" && quizStep === QUESTIONS.length + 1 && result;
  const showHome = activeTab === "home" && quizStep === -1;
  const showViewingPlan = activeTab === "plans" && viewingPlan;

  const TABS = [
    { id: "home", label: "Plan", icon: "✦" },
    { id: "plans", label: "My Plans", icon: "📋" },
    { id: "discover", label: "Discover", icon: "🔍" },
    { id: "social", label: "Social", icon: "👥" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={"toast" + (toast.show ? " show" : "")}>{toast.msg}</div>

        {showHome && <HomeScreen onStart={startQuiz} />}

        {showQuiz && (
          <QuizScreen
            step={quizStep} ans={ans} times={times} setTimes={setTimes}
            onToggle={toggle} onNext={nextStep} onBack={prevStep}
            onGenerate={generate} loading={loading} loadIdx={loadIdx} error={error}
          />
        )}

        {showResult && (
          <ResultScreen
            result={result} times={times} ans={ans}
            onRestart={resetToHome}
            onNewPlan={startQuiz}
          />
        )}

        {activeTab === "plans" && !showViewingPlan && (
          <MyPlansScreen
            plans={plans}
            onViewPlan={(plan) => setViewingPlan(plan)}
            onNewPlan={() => { setActiveTab("home"); startQuiz(); }}
          />
        )}

        {showViewingPlan && (
          <div>
            <button className="btn-ghost" onClick={() => setViewingPlan(null)} style={{ paddingTop: "1.5rem" }}>
              ← My Plans
            </button>
            <ResultScreen
              result={viewingPlan.result} times={viewingPlan.times} ans={viewingPlan.ans}
              onRestart={() => setViewingPlan(null)}
              onNewPlan={() => { setViewingPlan(null); setActiveTab("home"); startQuiz(); }}
            />
          </div>
        )}

        {activeTab === "discover" && <DiscoverScreen />}

        {activeTab === "social" && (
          <div>
            <div className="section-pad">
              <div className="section-title">Social</div>
              <p className="section-sub">Plan together, vote on nights, find people who are up for it.</p>
            </div>
            <div className="social-wrap" style={{ paddingTop: 0 }}>
              {[
                { icon: "👥", title: "Group planning", sub: "Everyone answers the quiz. One merged plan for the whole group.", badge: "live" },
                { icon: "👍", title: "Vote on the night", sub: "Can't agree? Generate 2-3 options and let the group vote.", badge: "soon" },
                { icon: "🗓️", title: "Availability matching", sub: "Connect calendars to find when everyone's actually free.", badge: "soon" },
                { icon: "🤝", title: "Find people to go with", sub: "Matched by vibe, area, and availability. No swiping, no small talk.", badge: "soon" }
              ].map((f, i) => (
                <div key={i} className="social-card" style={{ marginBottom: 10 }}>
                  <div className="feat-row" style={{ borderBottom: "none" }}>
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-body">
                      <div className="feat-title">{f.title}</div>
                      <div className="feat-sub">{f.sub}</div>
                      <span className={"feat-badge" + (f.badge === "live" ? " live" : "")}>
                        {f.badge === "live" ? "Live" : "Coming soon"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <nav className="bottom-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={"nav-tab" + (activeTab === tab.id ? " active" : "")}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "home") { setQuizStep(-1); setViewingPlan(null); }
              }}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
              <span className="nav-tab-dot" />
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
