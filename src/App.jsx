import { useState, useEffect, useRef } from "react";

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
    .filter((v) => v.score >= 0)
    .sort((a, b) => b.score - a.score);
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

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f0; color: #1a1a1a; }
  .app { max-width: 400px; margin: 0 auto; padding-bottom: 3rem; min-height: 100vh; }
  .hero { background: #0d0d1a; color: white; padding: 1.6rem 1.25rem 2.2rem; border-radius: 0 0 1.5rem 1.5rem; }
  .hero-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
  .hero-badge { font-size: 0.62rem; background: rgba(255,255,255,0.1); border-radius: 100px; padding: 3px 9px; opacity: 0.8; }
  .hero h1 { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 0.2rem; }
  .hero p { font-size: 0.78rem; opacity: 0.55; line-height: 1.4; }
  .step-bar { display: flex; gap: 3px; margin-top: 0.9rem; }
  .step-seg { height: 2.5px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.12); transition: background 0.3s; }
  .step-seg.done { background: rgba(255,255,255,0.85); }
  .step-seg.active { background: rgba(255,255,255,0.4); }
  .card { background: white; border: 1px solid #e8e8e4; border-radius: 14px; padding: 1.1rem; margin: 0.85rem 1rem 0; }
  .q-label { font-size: 0.65rem; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.9px; margin-bottom: 0.35rem; }
  .q-title { font-size: 0.98rem; font-weight: 500; margin-bottom: 0.75rem; line-height: 1.3; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { padding: 7px 13px; border-radius: 100px; border: 1px solid #e0e0da; font-size: 0.8rem; cursor: pointer; background: white; color: #1a1a1a; transition: all 0.12s; display: flex; align-items: center; gap: 5px; user-select: none; }
  .chip:hover { background: #f5f5f0; }
  .chip.sel { background: #0d0d1a; color: white; border-color: #0d0d1a; }
  .btn { width: 100%; padding: 12px; border-radius: 100px; border: none; background: #0d0d1a; color: white; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 0.8rem; transition: opacity 0.15s; }
  .btn:disabled { opacity: 0.28; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.85; }
  .btn-ghost { background: none; border: none; color: #888; font-size: 0.8rem; cursor: pointer; padding: 0.55rem 1rem 0; display: flex; align-items: center; gap: 4px; }
  .btn-outline { width: 100%; padding: 11px; border-radius: 100px; border: 1px solid #e0e0da; background: white; color: #1a1a1a; font-size: 0.85rem; cursor: pointer; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .btn-outline:hover { background: #f5f5f0; }
  .time-row { display: flex; gap: 8px; }
  .time-wrap { flex: 1; }
  .time-wrap label { font-size: 0.7rem; color: #888; display: block; margin-bottom: 4px; }
  .time-wrap input { width: 100%; padding: 8px 10px; border-radius: 9px; border: 1px solid #e0e0da; background: #f5f5f0; color: #1a1a1a; font-size: 0.85rem; }
  .loading { display: flex; flex-direction: column; align-items: center; padding: 3rem 1.5rem; text-align: center; }
  .spin { width: 36px; height: 36px; border: 2px solid #e0e0da; border-top-color: #0d0d1a; border-radius: 50%; animation: spin 0.7s linear infinite; margin-bottom: 1.1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .it-hero { background: #0d0d1a; color: white; border-radius: 14px; padding: 1.1rem; margin: 0.85rem 1rem 0; }
  .vibe-pill { background: rgba(255,255,255,0.1); border-radius: 100px; padding: 2px 8px; font-size: 0.65rem; }
  .stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin: 8px 1rem 0; }
  .stat { background: white; border: 1px solid #e8e8e4; border-radius: 9px; padding: 0.65rem; text-align: center; }
  .stat-val { font-size: 0.92rem; font-weight: 500; }
  .stat-lbl { font-size: 0.6rem; color: #888; margin-top: 2px; }
  .stop { background: white; border: 1px solid #e8e8e4; border-radius: 13px; margin-bottom: 7px; overflow: hidden; }
  .emo-bar { display: flex; gap: 4px; padding: 0.75rem 0.9rem 0; }
  .emo-box { min-width: 42px; height: 42px; background: #f5f5f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
  .emo-dark { background: #0d0d1a; color: white; font-size: 0.58rem; text-align: center; padding: 4px; line-height: 1.3; }
  .stop-top { display: flex; gap: 9px; padding: 0.7rem 0.9rem 0; }
  .stop-time { font-size: 0.7rem; font-weight: 500; color: #888; min-width: 38px; padding-top: 2px; }
  .stop-body { flex: 1; min-width: 0; }
  .stop-badge { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.6px; color: #aaa; margin-bottom: 2px; }
  .stop-name { font-size: 0.93rem; font-weight: 500; margin-bottom: 3px; }
  .stop-hook { font-size: 0.78rem; color: #666; line-height: 1.4; }
  .stop-pills { display: flex; gap: 5px; flex-wrap: wrap; padding: 0.5rem 0.9rem 0.8rem; }
  .pill { display: flex; align-items: center; gap: 3px; font-size: 0.68rem; padding: 3px 8px; border-radius: 100px; background: #f5f5f0; color: #666; }
  .why-fit { padding: 0 0.9rem 0.8rem; font-size: 0.74rem; color: #888; font-style: italic; line-height: 1.4; border-top: 1px solid #f0f0eb; padding-top: 0.55rem; }
  .transit { display: flex; align-items: center; gap: 6px; padding: 0 1.3rem; margin-bottom: 7px; color: #bbb; font-size: 0.73rem; }
  .tab-bar { display: flex; margin: 8px 1rem 0; background: #ebebea; border-radius: 10px; padding: 3px; }
  .tab { flex: 1; padding: 7px; border: none; border-radius: 8px; font-size: 0.8rem; cursor: pointer; background: transparent; color: #1a1a1a; transition: all 0.15s; }
  .tab.active { background: white; font-weight: 500; }
  .extra-box { background: #0d0d1a; border-radius: 13px; padding: 0.9rem; color: white; margin-bottom: 7px; }
  .tip-box { background: white; border: 1px solid #e8e8e4; border-radius: 13px; padding: 0.9rem; margin-bottom: 7px; }
  .social-section { margin: 8px 1rem 0; }
  .social-header { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.8px; color: #888; margin-bottom: 8px; font-weight: 500; }
  .share-card { background: white; border: 1px solid #e8e8e4; border-radius: 13px; overflow: hidden; margin-bottom: 7px; }
  .share-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .share-btn { padding: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.78rem; cursor: pointer; background: none; border: none; color: #1a1a1a; border-right: 1px solid #e8e8e4; }
  .share-btn:last-child { border-right: none; }
  .share-btn:hover { background: #f5f5f0; }
  .link-box { display: flex; align-items: center; gap: 8px; background: #f5f5f0; border-radius: 9px; padding: 0.6rem 0.85rem; margin: 0 0.85rem 0.85rem; }
  .link-url { font-size: 0.72rem; color: #888; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; }
  .group-card { background: white; border: 1px solid #e8e8e4; border-radius: 13px; margin-bottom: 7px; }
  .group-feat { display: flex; align-items: flex-start; gap: 10px; padding: 0.75rem 0.85rem; border-bottom: 1px solid #f0f0eb; }
  .group-feat:last-child { border-bottom: none; }
  .feat-icon { width: 32px; height: 32px; border-radius: 8px; background: #f5f5f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; }
  .feat-body { flex: 1; }
  .feat-title { font-size: 0.82rem; font-weight: 500; margin-bottom: 2px; }
  .feat-sub { font-size: 0.72rem; color: #888; line-height: 1.35; }
  .feat-badge { font-size: 0.6rem; padding: 2px 7px; border-radius: 100px; background: #fff8e6; color: #b07d00; margin-top: 4px; display: inline-block; }
  .feat-badge.live { background: #e6f9f0; color: #0a7a45; }
  .find-card { background: white; border: 1px solid #e8e8e4; border-radius: 13px; margin-bottom: 7px; overflow: hidden; }
  .profile { display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.75rem; border: 1px solid #e8e8e4; border-radius: 10px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: #0d0d1a; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 500; flex-shrink: 0; }
  .ptag { font-size: 0.6rem; padding: 2px 6px; border-radius: 100px; background: #f5f5f0; color: #666; }
  .vote-option { display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-bottom: 1px solid #f0f0eb; cursor: pointer; transition: background 0.12s; }
  .vote-option:last-child { border-bottom: none; }
  .vote-option:hover { background: #f5f5f0; }
  .vote-bar-wrap { flex: 1; height: 6px; background: #f0f0eb; border-radius: 3px; overflow: hidden; }
  .vote-bar { height: 100%; background: #0d0d1a; border-radius: 3px; transition: width 0.4s; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #0d0d1a; color: white; padding: 10px 20px; border-radius: 100px; font-size: 0.82rem; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
  .toast.show { opacity: 1; }
  .err { background: #fff0f0; border: 1px solid #ffcccc; border-radius: 9px; padding: 0.8rem; margin: 0.7rem 1rem; color: #cc3333; font-size: 0.8rem; }
`;

function generateId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

const MOCK_PROFILES = [
  { initials: "SK", name: "Sophia K.", meta: "East London · free tonight", tags: ["hidden_gems", "cultural"], match: 94 },
  { initials: "MR", name: "Marcus R.", meta: "Hackney · up for anything", tags: ["chaotic", "social"], match: 87 },
];
const MOCK_VOTES = [
  { emoji: "🎷", label: "Underground jazz, Nightjar", votes: 3 },
  { emoji: "🌀", label: "Warehouse rave, Fold", votes: 1 },
  { emoji: "🕯️", label: "Sessions Arts Club dinner", votes: 2 },
];

export default function App() {
  const [step, setStep] = useState(-1);
  const [ans, setAns] = useState({});
  const [times, setTimes] = useState({ start: "18:00", end: "23:00" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [error, setError] = useState(null);
  const [view, setView] = useState("plan");
  const [shareId] = useState(generateId);
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState(null);
  const [toast, setToast] = useState({ msg: "", show: false });
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading) { timerRef.current = setInterval(() => setLoadIdx((i) => (i + 1) % LOADS.length), 1600); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const q = QUESTIONS[step];

  function toggle(qId, val, multi) {
    setAns((prev) => {
      if (multi) { const cur = prev[qId] || []; return { ...prev, [qId]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] }; }
      return { ...prev, [qId]: val };
    });
  }

  function canNext() {
    if (step < 0 || step >= QUESTIONS.length) return true;
    const a = ans[q.id];
    return q.multi ? a && a.length > 0 : !!a;
  }

  function showToast(msg) { setToast({ msg, show: true }); setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200); }

  async function generate() {
    setLoading(true); setError(null);
    const shortlist = buildShortlist(ans);
    const venueData = JSON.stringify(shortlist.map((v) => ({ name: v.name, type: v.type, area: `${v.travelZone} London`, price: v.price, tags: v.tags, desc: v.desc, emoji: v.emoji, booking: v.bookingRequired ? "Book ahead" : "Walk-in fine" })));
    const prompt = `You are London's sharpest local guide — opinionated, witty, never generic. Build a perfect itinerary from these curated venues.\nUser: ${ans.timeOfDay} plan, vibes: ${(ans.vibes || []).join(", ")}, area: ${ans.area}, budget: ${ans.budget}, group: ${ans.groupSize}, energy: ${ans.energy}, ${times.start}–${times.end}, include: ${(ans.extras || []).join(", ") || "no extras"}.\nVenues (use these, pick best 4–5): ${venueData}\nRespond ONLY with valid JSON no markdown:\n{"title":"punchy name max 5 words","tagline":"one sharp witty sentence","vibe_scores":{"fun":7,"romantic":3,"cultural":6,"chaotic":2},"total_cost_estimate":"£35–55 pp","stops":[{"time":"18:30","name":"exact venue name","type":"bar","area":"Shoreditch, East London","emoji":"🍸","hook":"one punchy sentence — best thing about this place","why_it_fits":"one sentence vibe match","booking":"Walk-in fine","cost_estimate":"£12 pp","travel_to_next":"7 min walk south on Brick Lane"}],"extend_the_night":"one concrete late suggestion with venue name","local_tip":"one specific insider tip"}`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
  body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await resp.json();
      console.log("API response:", data);
      const txt = data.content?.find((b) => b.type === "text")?.text || "";
      setResult(JSON.parse(txt.replace(/```json|```/g, "").trim()));
      setStep(QUESTIONS.length + 1);
      setView("plan");
    } catch (e) {
      console.log("Error:", e);
      setError("Couldn't generate your plan. Check your API key in .env and try again.");
    }
    setLoading(false);
  }

  function restart() { setStep(-1); setAns({}); setResult(null); setError(null); setView("plan"); }

  const showResult = step === QUESTIONS.length + 1;
  const totalSteps = QUESTIONS.length + 1;
  const voteData = MOCK_VOTES.map((o, i) => ({ ...o, votes: o.votes + (voted === i ? 1 : 0) }));
  const totalVotes = voteData.reduce((s, o) => s + o.votes, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={`toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>

        <div className="hero">
          <div className="hero-top">
            <span style={{ fontSize: "1.4rem" }}>🏙️</span>
            <span className="hero-badge">London · {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
          </div>
          <h1>London, Your Way</h1>
          <p>{showResult && result ? result.title : "60+ hand-picked venues · zero filler · just go"}</p>
          {!showResult && (
            <div className="step-bar">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`step-seg ${step === i ? "active" : step > i ? "done" : ""}`} />
              ))}
            </div>
          )}
        </div>

        {error && <div className="err">⚠️ {error}</div>}

        {loading && (
          <div className="loading">
            <div className="spin" />
            <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>Building your plan...</div>
            <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.5rem" }}>{LOADS[loadIdx]}</div>
          </div>
        )}

        {!loading && step === -1 && (
          <div className="card">
            <div className="q-label">Welcome</div>
            <div className="q-title">Stuck on what to do in London?</div>
            <p style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.5, marginBottom: "0.85rem" }}>7 questions. One perfect plan. Hand-picked venues, no chains, no filler. Like asking a friend who actually knows London.</p>
            <button className="btn" onClick={() => setStep(0)}>Let's go →</button>
          </div>
        )}

        {!loading && step >= 0 && step < QUESTIONS.length && (
          <div>
            {step > 0 && <button className="btn-ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>}
            <div className="card" style={{ marginTop: step > 0 ? "0.5rem" : "0.85rem" }}>
              <div className="q-label">{q.label}</div>
              <div className="q-title">{q.title}</div>
              <div className="chips">
                {q.options.map((opt) => {
                  const sel = q.multi ? (ans[q.id] || []).includes(opt.value) : ans[q.id] === opt.value;
                  return (
                    <div key={opt.value} className={`chip ${sel ? "sel" : ""}`} onClick={() => { toggle(q.id, opt.value, q.multi); if (!q.multi) setTimeout(() => setStep((s) => s + 1), 180); }}>
                      <span>{opt.emoji}</span>{opt.label}
                    </div>
                  );
                })}
              </div>
              {q.multi && <button className="btn" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Continue →</button>}
            </div>
          </div>
        )}

        {!loading && step === QUESTIONS.length && (
          <div>
            <button className="btn-ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>
            <div className="card" style={{ marginTop: "0.5rem" }}>
              <div className="q-label">Almost there</div>
              <div className="q-title">What time are you planning?</div>
              <div className="time-row">
                <div className="time-wrap"><label>Start time</label><input type="time" value={times.start} onChange={(e) => setTimes((t) => ({ ...t, start: e.target.value }))} /></div>
                <div className="time-wrap"><label>End time</label><input type="time" value={times.end} onChange={(e) => setTimes((t) => ({ ...t, end: e.target.value }))} /></div>
              </div>
              <button className="btn" style={{ marginTop: "1rem" }} onClick={generate}>Generate my plan ✨</button>
            </div>
          </div>
        )}

        {!loading && showResult && result && (
          <div>
            <div className="it-hero">
              <div style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.2rem" }}>✨ {result.title}</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.6, lineHeight: 1.4, marginBottom: "0.7rem" }}>{result.tagline}</div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {Object.entries(result.vibe_scores || {}).map(([k, v]) => <div key={k} className="vibe-pill">{k} {v}/10</div>)}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "0.65rem", fontSize: "0.72rem", opacity: 0.6 }}>
                <span>💰 {result.total_cost_estimate}</span><span>🕐 {times.start}–{times.end}</span>
              </div>
            </div>

            <div className="tab-bar">
              {["plan", "social"].map((v) => (
                <button key={v} className={`tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                  {v === "plan" ? "🗺️ The plan" : "👥 Share & social"}
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
                <div style={{ padding: "8px 1rem 0" }}>
                  {(result.stops || []).map((stop, idx) => (
                    <div key={idx}>
                      <div className="stop">
                        <div className="emo-bar">
                          <div className="emo-box">{stop.emoji}</div>
                          <div className="emo-box emo-dark">{stop.area}</div>
                          <div className="emo-box" style={{ fontSize: "0.58rem", color: "#888", padding: "4px", textAlign: "center", lineHeight: 1.3 }}>{stop.booking}</div>
                        </div>
                        <div className="stop-top">
                          <div className="stop-time">{stop.time}</div>
                          <div className="stop-body">
                            <div className="stop-badge">{stop.type}</div>
                            <div className="stop-name">{stop.name}</div>
                            <div className="stop-hook">{stop.hook}</div>
                          </div>
                        </div>
                        <div className="stop-pills">{stop.cost_estimate && <div className="pill">💰 {stop.cost_estimate}</div>}</div>
                        {stop.why_it_fits && <div className="why-fit">💡 {stop.why_it_fits}</div>}
                      </div>
                      {stop.travel_to_next && idx < (result.stops || []).length - 1 && (
                        <div className="transit">↓ {stop.travel_to_next}</div>
                      )}
                    </div>
                  ))}
                </div>
                {result.extend_the_night && (
                  <div style={{ padding: "0 1rem" }}>
                    <div className="extra-box">
                      <div style={{ fontSize: "0.62rem", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "4px" }}>Extend the night</div>
                      <div style={{ fontSize: "0.82rem", lineHeight: 1.45 }}>🌙 {result.extend_the_night}</div>
                    </div>
                  </div>
                )}
                {result.local_tip && (
                  <div style={{ padding: "0 1rem" }}>
                    <div className="tip-box">
                      <div style={{ fontSize: "0.62rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "4px", fontWeight: 500 }}>Local tip</div>
                      <div style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>🗣️ {result.local_tip}</div>
                    </div>
                  </div>
                )}
                <div style={{ padding: "0 1rem" }}>
                  <button className="btn-outline" onClick={() => setView("social")}>👥 Share with friends</button>
                  <button className="btn-outline" onClick={restart}>↺ Plan a different day</button>
                </div>
              </div>
            )}

            {view === "social" && (
              <div>
                <div className="social-section">
                  <div className="social-header">Share your plan</div>
                  <div className="share-card">
                    <div style={{ padding: "0.85rem", borderBottom: "1px solid #f0f0eb" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 500, marginBottom: 3 }}>Send this to your crew</div>
                      <div style={{ fontSize: "0.74rem", color: "#888", lineHeight: 1.4 }}>Anyone with the link sees your full plan and can clone it for themselves.</div>
                    </div>
                    <div className="link-box">
                      <span className="link-url">londonyourway.app/plan/{shareId}</span>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "15px" }} onClick={() => { navigator.clipboard?.writeText(`https://londonyourway.app/plan/${shareId}`); setCopied(true); showToast("Link copied!"); setTimeout(() => setCopied(false), 2000); }}>
                        {copied ? "✓" : "📋"}
                      </button>
                    </div>
                    <div className="share-actions">
                      <button className="share-btn" onClick={() => { navigator.clipboard?.writeText(`https://londonyourway.app/plan/${shareId}`); showToast("Link copied!"); }}>🔗 Copy link</button>
                      <button className="share-btn" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this London plan: https://londonyourway.app/plan/${shareId}`)}`)}>💬 WhatsApp</button>
                    </div>
                  </div>
                </div>

                <div className="social-section">
                  <div className="social-header">Group planning</div>
                  <div className="group-card">
                    <div style={{ padding: "0.85rem", borderBottom: "1px solid #f0f0eb" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 500, marginBottom: 3 }}>Plan together</div>
                      <div style={{ fontSize: "0.74rem", color: "#888", lineHeight: 1.4 }}>Everyone answers the quiz. App finds one plan that works for the whole group.</div>
                    </div>
                    {[{ icon: "👥", title: "Shared vibe quiz", sub: "Everyone's answers merged into one group plan.", badge: "live" }, { icon: "👍", title: "Vote on options", sub: "Generate 2–3 plans, group votes. Majority wins.", badge: "soon" }, { icon: "🗓️", title: "Availability matching", sub: "Connect calendars to find when everyone's free.", badge: "soon" }].map((f, i) => (
                      <div key={i} className="group-feat">
                        <div className="feat-icon">{f.icon}</div>
                        <div className="feat-body">
                          <div className="feat-title">{f.title}</div>
                          <div className="feat-sub">{f.sub}</div>
                          <span className={`feat-badge ${f.badge === "live" ? "live" : ""}`}>{f.badge === "live" ? "Live" : "Coming soon"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="social-section">
                  <div className="social-header">Vote on the night</div>
                  <div style={{ background: "white", border: "1px solid #e8e8e4", borderRadius: "13px", marginBottom: "7px", overflow: "hidden" }}>
                    <div style={{ padding: "0.85rem", borderBottom: "1px solid #f0f0eb" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 500, marginBottom: 3 }}>Can't decide?</div>
                      <div style={{ fontSize: "0.74rem", color: "#888" }}>{voted === null ? "Tap to vote." : "Results live."}</div>
                    </div>
                    {voteData.map((o, i) => {
                      const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0;
                      return (
                        <div key={i} className="vote-option" onClick={() => { if (voted === null) { setVoted(i); showToast("Vote cast!"); } }}>
                          <span style={{ fontSize: "1.1rem", minWidth: "24px" }}>{o.emoji}</span>
                          <span style={{ fontSize: "0.78rem", flex: 1 }}>{o.label}</span>
                          <div className="vote-bar-wrap"><div className="vote-bar" style={{ width: voted !== null ? `${pct}%` : "0%" }} /></div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 500, minWidth: "28px", textAlign: "right", color: "#888" }}>{voted !== null ? `${pct}%` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="social-section">
                  <div className="social-header">Find people to go with</div>
                  <div className="find-card">
                    <div style={{ padding: "0.85rem", borderBottom: "1px solid #f0f0eb" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 500, marginBottom: 3 }}>Going solo? You don't have to.</div>
                      <div style={{ fontSize: "0.74rem", color: "#888", lineHeight: 1.4 }}>Matched by vibe, area, and availability. No swiping, no small talk.</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "0.85rem" }}>
                      {MOCK_PROFILES.map((p, i) => (
                        <div key={i} className="profile">
                          <div className="avatar">{p.initials}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>{p.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "#888", marginTop: 1 }}>{p.meta}</div>
                            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>{p.tags.map((t, j) => <span key={j} className="ptag">{t}</span>)}</div>
                          </div>
                          <div style={{ fontSize: "0.7rem", fontWeight: 500, color: "#0a7a45" }}>{p.match}% match</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "0 0.85rem 0.85rem", fontSize: "0.72rem", color: "#888", lineHeight: 1.4 }}>Opt-in only. Profiles anonymous until both people connect.</div>
                  </div>
                </div>

                <div style={{ padding: "0 1rem 0" }}>
                  <button className="btn-outline" onClick={() => setView("plan")}>← Back to the plan</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}