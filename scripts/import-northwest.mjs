import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const VENUES = [
  // ── EAST LONDON BARS (Dalston/Shoreditch) ──
  { name: "Warehaus", area: "Dalston", zone: "East", category: "bar", comment: "Cocktail lab turned into bar", vibe_tags: ["fancy", "aesthetic", "hidden_gems", "social"] },
  { name: "A Bar With Shapes For A Name", area: "Dalston", zone: "East", category: "bar", comment: "Unique concept bar in Dalston", vibe_tags: ["hidden_gems", "aesthetic", "social", "chaotic"] },
  { name: "Dalston Jazz Bar", area: "Dalston", zone: "East", category: "bar", comment: "Pay for what you eat — relaxed jazz bar", vibe_tags: ["chill", "social", "cultural", "hidden_gems"] },
  { name: "Ridley Road Market Bar", area: "Dalston", zone: "East", category: "bar", comment: "Dalston trashy — unpretentious local bar", vibe_tags: ["chaotic", "social", "hidden_gems"] },
  { name: "Orani", area: "Dalston", zone: "East", category: "bar", comment: "Wine bar in Dalston", vibe_tags: ["romantic", "chill", "fancy", "hidden_gems"] },
  { name: "SJQ", area: "Dalston", zone: "East", category: "nightlife", comment: "Great vibe, go down for a dance", vibe_tags: ["chaotic", "social", "underground"] },
  { name: "Corrochios", area: "Dalston", zone: "East", category: "bar", comment: "Basement bar with Mexican food", vibe_tags: ["chaotic", "social", "hidden_gems", "foodie"] },
  { name: "Netil 360", area: "London Fields", zone: "East", category: "bar", comment: "Rooftop bar and outdoors — Dalston Rooftop and Speakeasy", vibe_tags: ["social", "outdoor", "aesthetic", "chaotic"] },
  { name: "Discount Suit Company", area: "Shoreditch", zone: "East", category: "bar", comment: "Former tailor shop turned bar — hidden gem", vibe_tags: ["hidden_gems", "aesthetic", "cultural", "chill"] },
  { name: "Seed Library", area: "Shoreditch", zone: "East", category: "bar", comment: "Shoreditch bar with great atmosphere", vibe_tags: ["social", "aesthetic", "hidden_gems"] },
  { name: "Margarita Terrace", area: "Shoreditch", zone: "East", category: "bar", comment: "Light bar with terrace", vibe_tags: ["social", "outdoor", "aesthetic", "chill"] },
  { name: "Eastcheap", area: "Liverpool Street", zone: "Central", category: "bar", comment: "Liverpool Street bar with live music", vibe_tags: ["social", "cultural", "chaotic", "iconic"] },
  { name: "Calooh Calley", area: "Shoreditch", zone: "East", category: "bar", comment: "Shoreditch bar", vibe_tags: ["social", "chaotic", "hidden_gems"] },
  { name: "Paloma Cafe", area: "Shoreditch", zone: "East", category: "bar", comment: "New bar in Shoreditch", vibe_tags: ["aesthetic", "chill", "social", "hidden_gems"] },
  { name: "Cafe 1001", area: "Shoreditch", zone: "East", category: "nightlife", comment: "Nightlife venue in Shoreditch", vibe_tags: ["chaotic", "social", "underground"] },

  // ── PECKHAM ──
  { name: "Mad Cats", area: "Peckham", zone: "Southeast", category: "bar", comment: "Bar in Peckham", vibe_tags: ["social", "chaotic", "hidden_gems"] },
  { name: "Bar Levan", area: "Peckham", zone: "Southeast", category: "bar", comment: "Peckham bar", vibe_tags: ["social", "aesthetic", "chill", "hidden_gems"] },
  { name: "Zepoi", area: "Peckham", zone: "Southeast", category: "bar", comment: "Plants, mysterious vibes, nice nooks — intimate and atmospheric", vibe_tags: ["hidden_gems", "romantic", "aesthetic", "chill"] },
  { name: "Chaive", area: "Peckham", zone: "Southeast", category: "nightlife", comment: "Cool cocktails, intimate cocktail bar downstairs that opens up into a dance floor", vibe_tags: ["chaotic", "social", "fancy", "underground", "hidden_gems"] },
  { name: "Jumbi", area: "Peckham", zone: "Southeast", category: "bar", comment: "Peckham bar open till 2am", vibe_tags: ["social", "chaotic", "hidden_gems"] },
  { name: "Bussey Rooftop Bar", area: "Peckham", zone: "Southeast", category: "bar", comment: "Covered/heated rooftop, pizza, strong cocktails, skyline view", vibe_tags: ["social", "outdoor", "aesthetic", "chaotic"] },
  { name: "Prince of Peckham", area: "Peckham", zone: "Southeast", category: "bar", comment: "One of Peckham's liveliest pubs — DJs, rum cocktails, Caribbean food, top atmosphere", vibe_tags: ["social", "chill", "chaotic", "cultural"] },
  { name: "TOLA", area: "Peckham", zone: "Southeast", category: "nightlife", comment: "Late-night bar/club hybrid with DJs and a dancefloor", vibe_tags: ["chaotic", "social", "underground"] },
  { name: "Palais", area: "Peckham", zone: "Southeast", category: "nightlife", comment: "Basement club, 5-way Funktion-1 soundsystem, Bradley Zero series, dark sexy intimate vibes", vibe_tags: ["chaotic", "underground", "social"] },
  { name: "Peckham Arches", area: "Peckham Rye", zone: "Southeast", category: "bar", comment: "South London archway bar — £2 tacos Wednesdays, £3.50 pints Thursdays, 2-4-1 cocktails pre 7pm", vibe_tags: ["social", "outdoor", "chaotic", "hidden_gems"] },
  { name: "Forza Wine Peckham", area: "Peckham", zone: "Southeast", category: "bar", comment: "Laid back bar with a suntrap terrace, natural wines and beer, lively atmosphere and amazing food", vibe_tags: ["chill", "social", "outdoor", "foodie", "aesthetic"] },
  { name: "Bara Cafe", area: "Peckham", zone: "Southeast", category: "cafe", comment: "Favourite brunch spot in Peckham", vibe_tags: ["chill", "foodie", "aesthetic", "solo"] },
  { name: "Eastern Bloc", area: "Peckham", zone: "Southeast", category: "bar", comment: "Peckham bar and food spot", vibe_tags: ["social", "hidden_gems", "foodie"] },
  { name: "Coodie", area: "Peckham", zone: "Southeast", category: "cafe", comment: "Favourite food spot in Peckham", vibe_tags: ["chill", "foodie", "aesthetic"] },
  { name: "Rice Paddy", area: "Peckham", zone: "Southeast", category: "restaurant", comment: "Favourite food spot in Peckham", vibe_tags: ["foodie", "chill", "hidden_gems"] },
  { name: "Angeles", area: "Peckham", zone: "Southeast", category: "restaurant", comment: "Favourite food spot in Peckham", vibe_tags: ["foodie", "social", "hidden_gems"] },
  { name: "58th Street Jazz Club", area: "Peckham", zone: "Southeast", category: "bar", comment: "Jazz club in Peckham", vibe_tags: ["cultural", "chill", "romantic", "hidden_gems"] },
  { name: "Art Lounge & Roof Garden", area: "Peckham", zone: "Southeast", category: "bar", comment: "Roof garden bar in Peckham, open till 1am", vibe_tags: ["aesthetic", "outdoor", "social", "hidden_gems"] },

  // ── ROOFTOPS (London-wide) ──
  { name: "Queen Of Hoxton", area: "Shoreditch", zone: "East", category: "bar", comment: "Iconic bar with large rooftop that changes themes each season, regular DJs and live music", vibe_tags: ["iconic", "social", "aesthetic", "chaotic", "outdoor"] },
  { name: "La Yam", area: "King's Cross", zone: "North", category: "bar", comment: "Rooftop bar in Zone 1, DJs every Friday, live music every Sunday", vibe_tags: ["social", "outdoor", "aesthetic", "chaotic"] },
  { name: "Roof East", area: "Stratford", zone: "East", category: "experience", comment: "Huge seasonal rooftop hangout — mini golf, batting cages, rooftop cinema", vibe_tags: ["social", "outdoor", "chaotic", "active"] },
  { name: "Lord Napier Star", area: "Hackney Wick", zone: "East", category: "bar", comment: "Graffiti-covered iconic pub in Hackney Wick, rooftop terrace and bar open in summer", vibe_tags: ["iconic", "social", "outdoor", "chaotic", "hidden_gems"] },
  { name: "Savage Garden", area: "City", zone: "Central", category: "bar", comment: "Decadent cocktail lounge with rooftop terrace and 360 views, ideal suntrap", vibe_tags: ["fancy", "aesthetic", "romantic", "outdoor"] },
  { name: "Red Lion Hoxton", area: "Hoxton", zone: "East", category: "bar", comment: "Hidden gem in Hoxton — 4 storey pub with games room, pool table and secret roof terrace", vibe_tags: ["hidden_gems", "social", "outdoor", "chill"] },
  { name: "1864 Rooftop Bar & Kitchen", area: "Oxford Street", zone: "Central", category: "bar", comment: "Rooftop bar on Oxford Street, garden vibes in the sky, reasonable prices for central", vibe_tags: ["outdoor", "social", "aesthetic", "chill"] },
  { name: "Sabine St Paul's", area: "City", zone: "Central", category: "bar", comment: "Hidden cosy rooftop with amazing views of St Paul's, perfect for after work drinks in summer", vibe_tags: ["hidden_gems", "romantic", "outdoor", "aesthetic"] },
  { name: "Skylark", area: "Notting Hill", zone: "West", category: "bar", comment: "Big rooftop garden at Huckster overlooking Notting Hill, live DJs on Saturdays, karaoke rooms downstairs", vibe_tags: ["social", "outdoor", "aesthetic", "chaotic"] },

  // ── BRIXTON ──
  { name: "Phonox", area: "Brixton", zone: "Southwest", category: "nightlife", comment: "Some people's favourite club in London — proper nightclub, electronic music, quality sound", vibe_tags: ["chaotic", "underground", "social"] },
  { name: "Pop Brixton", area: "Brixton", zone: "Southwest", category: "experience", comment: "Cargo containers turned music venue and stalls, starts early finishes early", vibe_tags: ["social", "cultural", "chaotic", "outdoor", "foodie"] },
  { name: "Brixton Storeys", area: "Brixton", zone: "Southwest", category: "nightlife", comment: "2-storey open-air late-night rooftop, great spot for day parties, small club rooms inside", vibe_tags: ["chaotic", "social", "outdoor", "underground"] },
  { name: "The Gaffe", area: "Brixton", zone: "Southwest", category: "bar", comment: "Just opened — top venue, watch this space", vibe_tags: ["social", "hidden_gems"] },
  { name: "Spanners", area: "Brixton", zone: "Southwest", category: "nightlife", comment: "Top underground club — small and alternative, promoters given full artistic license", vibe_tags: ["underground", "chaotic", "social", "hidden_gems"] },
  { name: "The Blues Kitchen Brixton", area: "Brixton", zone: "Southwest", category: "bar", comment: "Live music upstairs and downstairs, arguably the best of the Blues Kitchen chain", vibe_tags: ["cultural", "social", "chaotic", "iconic"] },
  { name: "Bricks Brixton", area: "Brixton", zone: "Southwest", category: "nightlife", comment: "Bar/dancefloor downstairs, nightclub/event space upstairs", vibe_tags: ["chaotic", "social", "underground"] },
  { name: "Effra Social", area: "Brixton", zone: "Southwest", category: "bar", comment: "Eclectic time capsule of a venue, plays guilty pleasures and bangers, streetside beer garden, more lowkey", vibe_tags: ["chill", "social", "cultural", "hidden_gems", "outdoor"] },
  { name: "Prince of Wales Brixton", area: "Brixton", zone: "Southwest", category: "bar", comment: "Live music Thursdays, DJs Saturdays, free entry, can escalate late in the evening", vibe_tags: ["social", "cultural", "chaotic"] },
  { name: "Corsica Studios", area: "Elephant and Castle", zone: "South", category: "nightlife", comment: "Underground club near Elephant and Castle", vibe_tags: ["underground", "chaotic", "social"] },

  // ── CLAPHAM ──
  { name: "Venn Street Records", area: "Clapham", zone: "Southwest", category: "bar", comment: "Clapham bar open till 2am", vibe_tags: ["social", "cultural", "hidden_gems"] },
  { name: "Infernos", area: "Clapham", zone: "Southwest", category: "nightlife", comment: "Iconic Clapham club — hate me but it's iconic, till 4am", vibe_tags: ["chaotic", "social", "iconic"] },
  { name: "Little Orange Door", area: "Clapham", zone: "Southwest", category: "bar", comment: "Clapham bar open till 2am", vibe_tags: ["social", "hidden_gems", "chill"] },
  { name: "Cafe Sol", area: "Clapham", zone: "Southwest", category: "bar", comment: "Clapham bar open till 3am", vibe_tags: ["social", "chaotic"] },

  // ── WEST LONDON (Chelsea/Notting Hill) ──
  { name: "Little Yellow Door", area: "Notting Hill", zone: "West", category: "bar", comment: "West London bar open till 2am", vibe_tags: ["social", "aesthetic", "hidden_gems"] },
  { name: "Notting Hill Arts Club", area: "Notting Hill", zone: "West", category: "nightlife", comment: "Notting Hill arts venue and club, open till 2am", vibe_tags: ["cultural", "underground", "social", "chaotic"] },
  { name: "Jak's Club", area: "Notting Hill", zone: "West", category: "nightlife", comment: "West London club open till 3am", vibe_tags: ["chaotic", "social", "underground"] },
  { name: "Viajante87", area: "Notting Hill", zone: "West", category: "bar", comment: "Notting Hill cocktail bar open till 2:30am", vibe_tags: ["fancy", "social", "aesthetic"] },
  { name: "BART's Bar", area: "Chelsea", zone: "West", category: "bar", comment: "Chelsea bar open till 2am", vibe_tags: ["fancy", "social", "aesthetic"] },
  { name: "Raffles Nightclub", area: "Chelsea", zone: "West", category: "nightlife", comment: "Chelsea nightclub open till 5am", vibe_tags: ["fancy", "chaotic", "social"] },
  { name: "Maggie's Club", area: "Chelsea", zone: "West", category: "nightlife", comment: "Chelsea club open till 3am", vibe_tags: ["fancy", "chaotic", "social"] },
  { name: "Embargo Republica", area: "Chelsea", zone: "West", category: "nightlife", comment: "Chelsea club open till 3am", vibe_tags: ["chaotic", "social", "fancy"] },
  { name: "Naked & Famous Bar", area: "Notting Hill", zone: "West", category: "bar", comment: "Notting Hill bar open till 1am", vibe_tags: ["social", "hidden_gems", "chill"] },

  // ── ISLINGTON/NORTH ──
  { name: "Bar with No Name", area: "Islington", zone: "North", category: "bar", comment: "Islington bar open till 2am", vibe_tags: ["hidden_gems", "chill", "social"] },
  { name: "Hoxley & Porter", area: "Islington", zone: "North", category: "bar", comment: "Islington bar open till 2am", vibe_tags: ["social", "chill", "hidden_gems"] },
  { name: "The Ladybird Bar", area: "Islington", zone: "North", category: "bar", comment: "Islington bar open till 4:30am", vibe_tags: ["social", "chaotic", "hidden_gems"] },

  // ── HACKNEY WICK ──
  { name: "Colour Factory", area: "Hackney Wick", zone: "East", category: "nightlife", comment: "Hackney Wick club open till 4am", vibe_tags: ["chaotic", "underground", "social"] },
  { name: "Grow", area: "Hackney Wick", zone: "East", category: "bar", comment: "Hackney Wick bar open till 2am", vibe_tags: ["social", "chill", "hidden_gems"] },
  { name: "All My Friends", area: "Hackney Wick", zone: "East", category: "bar", comment: "Hackney Wick bar open till 2am", vibe_tags: ["social", "chill", "hidden_gems"] },
  { name: "Two More Years", area: "Hackney Wick", zone: "East", category: "bar", comment: "Hackney Wick bar open till 1am", vibe_tags: ["social", "chill", "hidden_gems"] },
  { name: "Night Tales Loft", area: "Hackney", zone: "East", category: "nightlife", comment: "Hackney nightlife venue open till 2:30am", vibe_tags: ["chaotic", "underground", "social"] },
  { name: "The Dolphin", area: "Hackney", zone: "East", category: "bar", comment: "Hackney bar open till 3am", vibe_tags: ["social", "chaotic", "hidden_gems"] },
  { name: "The Cause", area: "Tottenham", zone: "Northeast", category: "nightlife", comment: "Underground club in Tottenham", vibe_tags: ["underground", "chaotic", "social", "hidden_gems"] },

  // ── HOXTON ──
  { name: "Happiness Forgets", area: "Hoxton", zone: "East", category: "bar", comment: "Intimate cocktail bar in Hoxton, not dancy, closes 11pm", vibe_tags: ["fancy", "chill", "hidden_gems", "romantic"] },
  { name: "Howl At The Moon", area: "Hoxton", zone: "East", category: "bar", comment: "Hoxton bar open till 1am", vibe_tags: ["social", "chaotic"] },
  { name: "The Macbeth", area: "Hoxton", zone: "East", category: "bar", comment: "Hoxton pub and bar open till 1am", vibe_tags: ["social", "chill"] },
  { name: "The Railway Tavern N16", area: "Dalston", zone: "East", category: "bar", comment: "Dalston pub", vibe_tags: ["chill", "social", "hidden_gems"] },
  { name: "The Scolt Head", area: "Dalston", zone: "East", category: "bar", comment: "Dalston pub", vibe_tags: ["chill", "social", "hidden_gems"] },

  // ── SOHO ──
  { name: "Soma Soho", area: "Soho", zone: "Central", category: "bar", comment: "Soho bar open till 3am", vibe_tags: ["social", "chaotic", "aesthetic"] },
  { name: "Albert's Schloss", area: "Soho", zone: "Central", category: "bar", comment: "Soho bar open till 3am", vibe_tags: ["chaotic", "social", "iconic"] },
  { name: "Archer Street", area: "Soho", zone: "Central", category: "bar", comment: "Soho bar open till 1am", vibe_tags: ["social", "fancy", "aesthetic"] },
  { name: "Hovarda", area: "Soho", zone: "Central", category: "bar", comment: "Soho bar open till 1am", vibe_tags: ["fancy", "social", "aesthetic"] },
  { name: "PIRANA", area: "Soho", zone: "Central", category: "bar", comment: "Soho bar open till 1am", vibe_tags: ["social", "chaotic", "hidden_gems"] },
];

async function enrichWithGoogle(name, area) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_KEY;
    if (!apiKey) return null;
    const searchQuery = `${name} ${area} London`;
    const searchResp = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level&locationbias=circle:30000@51.5074,-0.1278&key=${apiKey}`,
      { method: 'GET' }
    );
    const searchData = await searchResp.json();
    const place = searchData.candidates?.[0];
    if (!place) return null;
    const address = place.formatted_address || '';
    const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
    const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
    const priceLevelMap = { 0: 'Free', 1: 'Under £15pp', 2: '£15-35pp', 3: '£35-70pp', 4: '£70pp+' };
    let website = null, phone = null, opening_hours = null;
    if (place.place_id) {
      try {
        const detailResp = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,opening_hours&key=${apiKey}`,
          { method: 'GET' }
        );
        const detailData = await detailResp.json();
        website = detailData.result?.website || null;
        phone = detailData.result?.formatted_phone_number || null;
        opening_hours = detailData.result?.opening_hours?.weekday_text || null;
      } catch (e) {}
    }
    return {
      validated_name: place.name || name,
      validated_address: place.formatted_address,
      postcode, lat: place.geometry?.location?.lat, lng: place.geometry?.location?.lng,
      google_place_id: place.place_id, google_rating: place.rating || null,
      google_review_count: place.user_ratings_total || null,
      google_price_level: place.price_level ?? null,
      price: priceLevelMap[place.price_level] ?? null,
      website, phone, opening_hours,
    };
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = { processed: 0, saved: 0, skipped: 0, errors: 0, details: [] };

  for (const venue of VENUES) {
    await sleep(300);
    results.processed++;

    const { data: existing } = await supabase
      .from('experiences')
      .select('id')
      .ilike('name', venue.name)
      .limit(1);

    if (existing && existing.length > 0) {
      results.skipped++;
      results.details.push({ name: venue.name, status: 'skipped' });
      continue;
    }

    const google = await enrichWithGoogle(venue.name, venue.area);

    const { error } = await supabase.from('experiences').insert({
      name: google?.validated_name || venue.name,
      address: google?.validated_address || null,
      area: venue.area, zone: venue.zone, category: venue.category,
      price: google?.price || null, is_event: false,
      comment: venue.comment, vibe_tags: venue.vibe_tags, status: 'pending',
      lat: google?.lat || null, lng: google?.lng || null,
      postcode: google?.postcode || null,
      google_place_id: google?.google_place_id || null,
      google_rating: google?.google_rating || null,
      google_review_count: google?.google_review_count || null,
      google_price_level: google?.google_price_level || null,
      website: google?.website || null, phone: google?.phone || null,
      opening_hours: google?.opening_hours || null,
    });

    if (error) {
      results.errors++;
      results.details.push({ name: venue.name, status: 'error', error: error.message });
    } else {
      results.saved++;
      results.details.push({ name: venue.name, status: 'saved', rating: google?.google_rating, price: google?.price });
    }
  }

  res.status(200).json({ message: 'Import complete', ...results });
}
