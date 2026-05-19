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
const STOP_ORDER = { day: ["cafe", "outdoor", "museum", "gallery", "market", "experience", "restaurant"], night: ["restaurant", "bar", "event"], full: ["cafe", "outdoor", "museum", "restaurant", "bar", "event"] };

const ZONES = ["North", "Northwest", "Northeast", "South", "Southwest", "Southeast", "East", "West", "Central", "Outskirts"];

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

function buildShortlist(answers, dbVenues = []) {
  const { vibes, area, budget, timeOfDay, extras } = answers;
  const allVenues = [
    ...VENUES,
    ...dbVenues.map(v => ({
      id: v.id, name: v.name, type: v.category || "experience",
      area: (v.zone || "Central").toLowerCase(), tags: v.vibe_tags || [],
      price: v.price === "Free" ? "low" : v.price?.includes("£") ? "mid" : "mid",
      bestTime: "day,night", bookingRequired: false, desc: v.comment || "",
      emoji: "✨", travelZone: (v.zone || "Central").toLowerCase()
    }))
  ];
  const scored = allVenues.map((v) => ({ ...v, score: scoreVenue(v, vibes || [], budget || "mid", area || "anywhere", timeOfDay || "night", extras || []) }))
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
  { id: "timeOfDay", label: "1 of 8", title: "Day out or night in London?", multi: false, options: [{ value: "day", label: "Day plan", emoji: "☀️" }, { value: "night", label: "Night plan", emoji: "🌙" }, { value: "full", label: "Full day + night", emoji: "🌅" }] },
  { id: "vibes", label: "2 of 8", title: "Pick your vibe", multi: true, options: [{ value: "chill", label: "Chill", emoji: "😌" }, { value: "romantic", label: "Romantic", emoji: "🌹" }, { value: "chaotic", label: "Chaotic fun", emoji: "🌀" }, { value: "cultural", label: "Cultural", emoji: "🏛️" }, { value: "fancy", label: "Fancy", emoji: "🥂" }, { value: "hidden_gems", label: "Hidden gems", emoji: "💎" }, { value: "social", label: "Social", emoji: "🎉" }, { value: "solo", label: "Solo reset", emoji: "🧘" }, { value: "creative", label: "Creative", emoji: "🎨" }, { value: "activity", label: "Activity-based", emoji: "🎯" }, { value: "active", label: "Active", emoji: "🏃" }] },
  { id: "area", label: "3 of 8", title: "Any area preference?", multi: false, options: [{ value: "central", label: "Central", emoji: "🎭" }, { value: "east", label: "East", emoji: "🧱" }, { value: "south", label: "South", emoji: "🌉" }, { value: "west", label: "West", emoji: "🌳" }, { value: "north", label: "North", emoji: "🌲" }, { value: "southwest", label: "Southwest", emoji: "🏡" }, { value: "northwest", label: "Northwest", emoji: "🌿" }, { value: "outskirts", label: "Outskirts", emoji: "🚂" }, { value: "surprise_me", label: "Surprise me!", emoji: "🎲" }] },
  { id: "travel", label: "4 of 8", title: "How do you want to get around?", multi: false, options: [{ value: "walking", label: "Walking only", emoji: "🚶" }, { value: "walk_tube", label: "Walk + tube", emoji: "🚇" }, { value: "max10", label: "Max 10 min each stop", emoji: "⚡" }] },
  { id: "budget", label: "5 of 8", title: "Budget vibe?", multi: false, options: [{ value: "low", label: "Broke but fun", emoji: "💸" }, { value: "mid", label: "Mid range", emoji: "💳" }, { value: "high", label: "Treat yourself", emoji: "✨" }, { value: "unlimited", label: "No limit", emoji: "🚀" }] },
  { id: "groupSize", label: "6 of 8", title: "Who's coming?", multi: false, options: [{ value: "solo", label: "Just me", emoji: "🙋" }, { value: "duo", label: "Two of us", emoji: "👫" }, { value: "small", label: "3–5 people", emoji: "👯" }, { value: "large", label: "5+ crew", emoji: "🎊" }] },
  { id: "energy", label: "7 of 8", title: "Energy level today?", multi: false, options: [{ value: "low", label: "Low & breezy", emoji: "🌿" }, { value: "medium", label: "Up for it", emoji: "⚡" }, { value: "high", label: "Max chaos", emoji: "🔥" }] },
  { id: "extras", label: "8 of 8", title: "Must-haves?", multi: true, options: [{ value: "food", label: "Food included", emoji: "🍜" }, { value: "drinks", label: "Drinks/bars", emoji: "🍸" }, { value: "outdoor", label: "Outdoor spaces", emoji: "🌳" }, { value: "social", label: "Meet people", emoji: "🤝" }] },
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

const EVENT_COLOURS = {
  Music: { bg: "#1B998B", text: "#fff" }, Nightlife: { bg: "#2D1B69", text: "#fff" },
  Arts: { bg: "#F7B731", text: "#1a1a1a" }, Food: { bg: "#E84855", text: "#fff" },
  Comedy: { bg: "#F7B731", text: "#1a1a1a" }, Theatre: { bg: "#6B4226", text: "#fff" },
  default: { bg: "#3D5A80", text: "#fff" },
};

const AREA_FILTERS = ["All", "Central", "East", "South", "West"];
const EVENT_FILTERS = ["All", "Music", "Nightlife", "Arts", "Food", "Comedy", "Theatre"];
const PREF_OPTIONS = ["Restaurants", "Bars", "Hidden gems", "Outdoor", "Culture", "Markets", "Events", "Late night", "Brunch", "Fine dining"];

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
  .shape-teal { width: 130px; height: 130px; background: #1B998B; top: 0; right: 40px; animation-duration: 16s; }
  .shape-yellow { width: 160px; height: 160px; background: #F4C842; top: 80px; right: -10px; animation-duration: 20s; }
  .shape-cream { width: 80px; height: 80px; background: #F7EFD4; top: 150px; right: 140px; animation-duration: 12s; }
  .inner-oval { width: 56px; height: 32px; background: #B8A9D9; border-radius: 50%; animation: spin-cw 8s linear infinite; }
  .inner-starburst { animation: spin-cw 6s linear infinite; }
  .inner-star4 { animation: spin-cw 10s linear infinite; }
  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  .home-hero { padding: 3.5rem 1.5rem 2rem; position: relative; overflow: hidden; min-height: 300px; background: #ffffff; }
  .home-eyebrow { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #9b8f7a; margin-bottom: 0.6rem; position: relative; z-index: 1; }
  .home-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 3rem; font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #1c1c1a; margin-bottom: 0.75rem; position: relative; z-index: 1; }
  .home-title em { font-style: italic; color: #1B998B; }
  .home-sub { font-size: 0.85rem; color: #6b5e4e; line-height: 1.5; position: relative; z-index: 1; max-width: 200px; }
  .home-cta { margin-top: 1.5rem; position: relative; z-index: 1; }

  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; background: #fff; border-top: 1px solid #e8e2d8; display: flex; z-index: 100; padding-bottom: env(safe-area-inset-bottom); }
  .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px 8px; border: none; background: none; cursor: pointer; gap: 3px; transition: all 0.15s; }
  .nav-tab-icon { font-size: 1.3rem; line-height: 1; transition: transform 0.2s; }
  .nav-tab.active .nav-tab-icon { transform: scale(1.15); }
  .nav-tab-label { font-family: 'DM Sans', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.04em; color: #b8ac9a; text-transform: uppercase; transition: color 0.15s; }
  .nav-tab.active .nav-tab-label { color: #1c1c1a; }
  .nav-tab-dot { width: 4px; height: 4px; border-radius: 50%; background: #1B998B; opacity: 0; transition: opacity 0.15s; }
  .nav-tab.active .nav-tab-dot { opacity: 1; }

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

  .loading { display: flex; flex-direction: column; align-items: center; padding: 5rem 2rem; text-align: center; }
  .loading-ring { width: 44px; height: 44px; border: 2.5px solid #e8e2d8; border-top-color: #1B998B; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1.5rem; }
  .loading-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.3rem; color: #1c1c1a; margin-bottom: 0.4rem; }
  .loading-sub { font-size: 0.82rem; color: #9b8f7a; }

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
  .api-note { background: #f5f0e8; border-radius: 12px; padding: 1rem; margin: 0 1.5rem 1rem; font-size: 0.75rem; color: #6b5e4e; line-height: 1.5; border-left: 3px solid #1B998B; }

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
  .feat-badge.live { background: #e0f5f3; color: #1B998B; }

  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #1c1c1a; color: #ffffff; padding: 10px 20px; border-radius: 100px; font-size: 0.82rem; white-space: nowrap; z-index: 999; pointer-events: none; opacity: 0; transition: opacity 0.2s; font-family: 'DM Sans', sans-serif; }
  .toast.show { opacity: 1; }
  .err { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #fdf0ef; border: 1px solid #f5d0cc; color: #c0392b; font-size: 0.82rem; line-height: 1.4; }
  .success { margin: 1rem 1.5rem; padding: 0.9rem 1rem; border-radius: 10px; background: #e0f5f3; border: 1px solid #1B998B; color: #1B998B; font-size: 0.82rem; line-height: 1.4; }

  /* ── TIKTOK PARSER ── */
  .parser-wrap { padding: 1.5rem; }
  .input-group { margin-bottom: 1rem; }
  .input-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: #9b8f7a; display: block; margin-bottom: 6px; font-weight: 500; }
  .input-field { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; transition: border-color 0.15s; }
  .input-field:focus { outline: none; border-color: #1B998B; }
  .input-field::placeholder { color: #c0b8ad; }
  textarea.input-field { min-height: 100px; resize: vertical; }
  .preview-card { border: 1px solid #e8e2d8; border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .preview-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.1rem; color: #1c1c1a; margin-bottom: 0.75rem; }
  .preview-field { display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; }
  .preview-key { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #9b8f7a; min-width: 80px; padding-top: 2px; font-weight: 500; }
  .preview-val { font-size: 0.82rem; color: #1c1c1a; line-height: 1.4; flex: 1; }
  .zone-badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 500; background: #e0f5f3; color: #1B998B; }

  /* ── ADMIN ── */
  .admin-card { border: 1px solid #e8e2d8; border-radius: 14px; padding: 1rem; margin-bottom: 10px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.3s ease; }
  .admin-card-name { font-family: 'DM Serif Display', Georgia, serif; font-size: 1rem; color: #1c1c1a; margin-bottom: 4px; }
  .admin-card-meta { font-size: 0.75rem; color: #9b8f7a; margin-bottom: 8px; }
  .admin-actions { display: flex; gap: 8px; }
  .btn-approve { flex: 1; padding: 8px; border-radius: 8px; border: none; background: #1B998B; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; font-weight: 500; }
  .btn-reject { flex: 1; padding: 8px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: transparent; color: #9b8f7a; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; }
  .zone-select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1.5px solid #ddd8ce; background: #fff; color: #1c1c1a; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; margin-bottom: 8px; }

  /* ── PREFERENCES ── */
  .pref-wrap { padding: 1.5rem; }
  .pref-chip { padding: 8px 14px; border-radius: 100px; border: 1.5px solid #ddd8ce; font-size: 0.82rem; cursor: pointer; background: #fff; color: #4a4438; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; }
  .pref-chip.sel { background: #1B998B; color: #fff; border-color: #1B998B; }
  .pref-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.25rem; }
`;

// ── MOCK EVENTS ───────────────────────────────────────────────
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
                  onClick={() => { onToggle(q.id, opt.value, q.multi); if (!q.multi) { setAreaSearch(""); setAreaMatches([]); setTimeout(onNext, 200); } }}>
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
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#1B998B" }}>✦ Selected: {ans.area}</div>
              )}
            </div>
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

function ResultScreen({ result, times, ans, onRestart, onNewPlan }) {
  const [view, setView] = useState("plan");
  const [shareId] = useState(generateId);
  const [copied, setCopied] = useState(false);

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

function DiscoverScreen({ preferences }) {
  const [events] = useState(MOCK_EVENTS);
  const [areaFilter, setAreaFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = events.filter(e => {
    const areaOk = areaFilter === "All" || e.area === areaFilter.toLowerCase();
    const catOk = catFilter === "All" || e.category === catFilter;
    return areaOk && catOk;
  });

  return (
    <div>
      <div className="section-pad" style={{ paddingBottom: "0.75rem" }}>
        <div className="section-title">Discover</div>
        <p className="section-sub">What's on in London this week</p>
        {preferences.length > 0 && (
          <div style={{ fontSize: "0.75rem", color: "#1B998B", marginTop: "-0.5rem" }}>
            ✦ Filtered for your preferences
          </div>
        )}
      </div>

      <div className="api-note">
        <strong>Live events coming soon.</strong> Showing curated picks for now.
      </div>

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

      <div style={{ padding: "0 1.5rem 1rem" }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🔍</div>
            <div className="empty-title">Nothing matching</div>
            <div className="empty-sub">Try a different filter.</div>
          </div>
        ) : filtered.map((ev) => (
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

  async function parse() {
    if (!url.trim()) { setError("Paste a TikTok URL to get started."); return; }
    setParsing(true); setError(null); setPreview(null);

    try {
      const tikResp = await fetch("/api/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const tikData = await tikResp.json();
      if (tikData.error) throw new Error(tikData.error);

      const caption = tikData.description || tikData.title || "";
      if (!caption) throw new Error("No caption found in this video. Try a different one.");

      const prompt = `You are parsing a TikTok video caption about London experiences or venues.
The caption may mention ONE venue or MULTIPLE venues.
Extract structured data and return ONLY valid JSON with no markdown.
Caption: "${caption}"

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
      setPreview({ venues, _caption: caption });
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
          name: venue.name,
          address: venue.address,
          area: venue.area,
          zone: venue.zone || existingMapping?.zone || "Central",
          category: venue.category,
          price: venue.price,
          is_event: venue.is_event || false,
          event_start: venue.event_start || null,
          event_end: venue.event_end || null,
          comment: venue.comment,
          vibe_tags: venue.vibe_tags || [],
          tiktok_url: url || null,
          status: "pending"
        });
      }

      setSuccess(true);
      setPreview(null);
      setUrl("");
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
          type="url"
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
                <div style={{ fontSize: "0.6rem", color: "#1B998B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem", fontWeight: 600 }}>
                  {i + 1} of {preview.venues.length}
                </div>
              )}
              <div className="preview-title">{venue.name || "Unknown venue"}</div>
              {[
                ["Area", venue.area],
                ["Zone", venue.zone ? <span className="zone-badge">{venue.zone}</span> : null],
                ["Category", venue.category],
                ["Price", venue.price],
                ["Address", venue.address],
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

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("experiences").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setPending(data || []);
    if (onBadgeUpdate) onBadgeUpdate(data?.length || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    const zone = zoneEdits[id];
    const update = { status: "approved" };
    if (zone) update.zone = zone;
    await supabase.from("experiences").update(update).eq("id", id);

    // If zone was edited, update the mapping table too
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
        <p className="section-sub">{pending.length} item{pending.length !== 1 ? "s" : ""} pending review</p>
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
                  <a href={item.tiktok_url} target="_blank" rel="noreferrer" style={{ color: "#1B998B" }}>View TikTok ↗</a>
                </div>
              )}
              <div style={{ marginBottom: "8px" }}>
                <label className="input-label">Zone (current: {item.zone || "unset"})</label>
                <select className="zone-select" value={zoneEdits[item.id] || item.zone || ""} onChange={e => setZoneEdits(prev => ({ ...prev, [item.id]: e.target.value }))}>
                  <option value="">Keep as is</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
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

function PreferencesScreen({ preferences, setPreferences }) {
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
          <div key={p} className={`pref-chip ${preferences.includes(p) ? "sel" : ""}`} onClick={() => toggle(p)}>{p}</div>
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
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [quizStep, setQuizStep] = useState(-1);
  const [ans, setAns] = useState({});
  const [times, setTimes] = useState({ start: "18:00", end: "23:00" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [dbVenues, setDbVenues] = useState([]);
  const [adminBadge, setAdminBadge] = useState(0);
  const [preferences, setPreferences] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cl_prefs") || "[]"); } catch { return []; }
  });
  const timerRef = useRef(null);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("cl_prefs", JSON.stringify(preferences));
  }, [preferences]);

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
    const shortlist = buildShortlist(ans, dbVenues);
    const venueData = JSON.stringify(shortlist.map(v => ({
      name: v.name, type: v.type, area: v.travelZone + " London",
      price: v.price, tags: v.tags, desc: v.desc, emoji: v.emoji,
      booking: v.bookingRequired ? "Book ahead" : "Walk-in fine"
    })));

    const areaNote = ans.area === "surprise_me" ? "anywhere in London — surprise them" : ans.area;
    const travelNote = ans.travel === "walking" ? "walking only between stops" : ans.travel === "max10" ? "max 10 min travel between each stop" : "walking and tube ok";

    const prompt = "You are London's sharpest local guide. Build a perfect itinerary from these curated venues. User: " +
      ans.timeOfDay + " plan, vibes: " + (ans.vibes || []).join(", ") +
      ", area: " + areaNote + ", budget: " + ans.budget +
      ", group: " + ans.groupSize + ", energy: " + ans.energy +
      ", travel: " + travelNote +
      ", " + times.start + " to " + times.end +
      ", include: " + ((ans.extras || []).join(", ") || "no extras") +
      ". Venues (pick best 4-5): " + venueData +
      ". Respond ONLY with valid JSON, no markdown, no backticks: " +
      '{"title":"punchy name","tagline":"witty sentence","vibe_scores":{"fun":7,"romantic":3,"cultural":6,"chaotic":2},"total_cost_estimate":"35-55pp","stops":[{"time":"18:30","name":"venue name","type":"bar","area":"Shoreditch","emoji":"🍸","hook":"best thing about this place","why_it_fits":"vibe match","booking":"Walk-in fine","cost_estimate":"12pp","travel_to_next":"7 min walk"}],"extend_the_night":"late suggestion","local_tip":"insider tip"}';

    try {
      const txt = await callClaude(prompt, 1000);
      const parsed = JSON.parse(txt);
      setResult(parsed);
      setQuizStep(QUESTIONS.length + 1);
      setPlans(prev => [{
        result: parsed, ans: { ...ans }, times: { ...times },
        savedAt: new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        id: generateId()
      }, ...prev]);
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
    { id: "discover", label: "Discover", icon: "🔍" },
    { id: "add", label: "Add", icon: "➕" },
    { id: "prefs", label: "For me", icon: "🎯" },
    { id: "admin", label: "Admin", icon: "⚙️", badge: adminBadge },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={"toast" + (toast.show ? " show" : "")}>{toast.msg}</div>

        {showHome && <HomeScreen onStart={startQuiz} />}
        {showQuiz && <QuizScreen step={quizStep} ans={ans} times={times} setTimes={setTimes} onToggle={toggle} onNext={nextStep} onBack={prevStep} onGenerate={generate} loading={loading} loadIdx={loadIdx} error={error} />}
        {showResult && <ResultScreen result={result} times={times} ans={ans} onRestart={resetToHome} onNewPlan={startQuiz} />}

        {activeTab === "plans" && !showViewingPlan && <MyPlansScreen plans={plans} onViewPlan={(plan) => setViewingPlan(plan)} onNewPlan={() => { setActiveTab("home"); startQuiz(); }} />}
        {showViewingPlan && (
          <div>
            <button className="btn-ghost" onClick={() => setViewingPlan(null)} style={{ paddingTop: "1.5rem" }}>← My Plans</button>
            <ResultScreen result={viewingPlan.result} times={viewingPlan.times} ans={viewingPlan.ans} onRestart={() => setViewingPlan(null)} onNewPlan={() => { setViewingPlan(null); setActiveTab("home"); startQuiz(); }} />
          </div>
        )}

        {activeTab === "discover" && <DiscoverScreen preferences={preferences} />}
        {activeTab === "add" && <TikTokParserScreen onSuccess={() => showToast("Added! Check Admin to approve.")} />}
        {activeTab === "prefs" && <PreferencesScreen preferences={preferences} setPreferences={setPreferences} />}
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