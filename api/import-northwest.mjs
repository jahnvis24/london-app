import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const VENUES = [
  // ── GALLERIES ──
  { name: "Saatchi Gallery", area: "Chelsea", zone: "West", category: "gallery", comment: "World-class contemporary art gallery in Chelsea — free entry", vibe_tags: ["cultural", "aesthetic", "solo", "chill"] },
  { name: "Serpentine Gallery", area: "Kensington Gardens", zone: "West", category: "gallery", comment: "Iconic gallery in Kensington Gardens with stunning pavilion each summer — free entry", vibe_tags: ["cultural", "aesthetic", "outdoor", "solo"] },
  { name: "White Cube Bermondsey", area: "Bermondsey", zone: "Southeast", category: "gallery", comment: "One of London's most important contemporary art galleries — free entry", vibe_tags: ["cultural", "aesthetic", "solo", "hidden_gems"] },
  { name: "Victoria Miro Gallery", area: "Islington", zone: "North", category: "gallery", comment: "Leading contemporary art gallery in Islington — free entry", vibe_tags: ["cultural", "aesthetic", "solo", "hidden_gems"] },
  { name: "Pace Gallery London", area: "Mayfair", zone: "Central", category: "gallery", comment: "Major international gallery with world-class exhibitions — free entry", vibe_tags: ["cultural", "aesthetic", "fancy", "solo"] },

  // ── NORTHWEST LONDON ──
  { name: "Hampstead Heath", area: "Hampstead", zone: "Northwest", category: "outdoor", comment: "800 acres of ancient parkland with ponds, views over London and wild swimming", vibe_tags: ["outdoor", "chill", "solo", "romantic"] },
  { name: "Primrose Hill", area: "Primrose Hill", zone: "Northwest", category: "outdoor", comment: "Iconic hill with the best panoramic views of the London skyline", vibe_tags: ["outdoor", "romantic", "chill", "aesthetic", "iconic"] },
  { name: "Queen's Park", area: "Queen's Park", zone: "Northwest", category: "outdoor", comment: "Beautiful local park with a café, tennis courts and a lovely neighbourhood feel", vibe_tags: ["outdoor", "chill", "solo", "social"] },
  { name: "Kenwood House", area: "Hampstead", zone: "Northwest", category: "museum", comment: "Stunning neoclassical villa on Hampstead Heath with a world-class art collection — free entry", vibe_tags: ["cultural", "aesthetic", "romantic", "solo", "outdoor"] },
  { name: "The Holly Bush", area: "Hampstead", zone: "Northwest", category: "bar", comment: "Historic Hampstead pub tucked away on a cobbled street — one of London's finest", vibe_tags: ["chill", "hidden_gems", "romantic", "iconic"] },
  { name: "Bull & Last", area: "Hampstead", zone: "Northwest", category: "restaurant", comment: "Beloved Hampstead gastropub with exceptional food and Sunday roasts", vibe_tags: ["foodie", "chill", "romantic", "fancy"] },
  { name: "The Wells Tavern", area: "Hampstead", zone: "Northwest", category: "bar", comment: "Charming Hampstead pub with great food and a lovely atmosphere", vibe_tags: ["chill", "romantic", "foodie", "hidden_gems"] },
  { name: "The Garden Gate", area: "Hampstead", zone: "Northwest", category: "bar", comment: "Classic Hampstead pub with a beautiful garden", vibe_tags: ["chill", "outdoor", "romantic", "social"] },
  { name: "Daunt Books Hampstead", area: "Hampstead", zone: "Northwest", category: "experience", comment: "Beautiful independent bookshop in Hampstead — perfect solo browse", vibe_tags: ["solo", "chill", "cultural", "aesthetic", "hidden_gems"] },
  { name: "Ginger & White", area: "Hampstead", zone: "Northwest", category: "cafe", comment: "Beloved Hampstead café known for great coffee and brunch", vibe_tags: ["chill", "solo", "aesthetic", "foodie"] },
  { name: "Spaniards Inn", area: "Hampstead", zone: "Northwest", category: "bar", comment: "Historic 16th century pub on Hampstead Heath with a huge garden — Dick Turpin's local", vibe_tags: ["iconic", "chill", "outdoor", "cultural", "hidden_gems"] },

  // ── SOLO/OUTDOOR ──
  { name: "Columbia Road Flower Market", area: "Bethnal Green", zone: "East", category: "market", comment: "Sunday-only flower market that turns East London into a perfumed riot — go before 10am", vibe_tags: ["chill", "social", "aesthetic", "iconic", "solo"] },
  { name: "Broadway Market", area: "London Fields", zone: "East", category: "market", comment: "Hackney's beloved Saturday street market — food, vintage, independent stalls along the canal", vibe_tags: ["social", "chill", "foodie", "aesthetic", "outdoor"] },
  { name: "St Dunstan in the East", area: "City", zone: "Central", category: "outdoor", comment: "Ruins of a medieval church turned into a secret garden — one of London's most magical hidden spots", vibe_tags: ["hidden_gems", "romantic", "aesthetic", "solo", "chill"] },

  // ── QUEEN'S PARK/NORTHWEST RESTAURANTS ──
  { name: "Carmel Queens Park", area: "Queen's Park", zone: "Northwest", category: "restaurant", comment: "Neighbourhood restaurant in Queen's Park with Middle Eastern influences", vibe_tags: ["foodie", "aesthetic", "chill", "hidden_gems"] },
  { name: "Morso", area: "Queen's Park", zone: "Northwest", category: "restaurant", comment: "Neighbourhood Italian restaurant in Queen's Park", vibe_tags: ["foodie", "romantic", "chill", "hidden_gems"] },
  { name: "Colaba", area: "Queen's Park", zone: "Northwest", category: "restaurant", comment: "Indian restaurant in Queen's Park", vibe_tags: ["foodie", "social", "hidden_gems"] },
  { name: "Andu Vegan Ethiopian Restaurant", area: "Islington", zone: "North", category: "restaurant", comment: "Vegan Ethiopian restaurant in Islington — unique and delicious", vibe_tags: ["foodie", "cultural", "hidden_gems", "social"] },

  // ── SPA/WELLNESS ──
  { name: "Hampstead Heath Mixed Bathing Pond", area: "Hampstead", zone: "Northwest", category: "outdoor", comment: "Wild swimming in Hampstead Heath ponds — a London bucket list experience", vibe_tags: ["outdoor", "solo", "active", "hidden_gems", "chill"] },
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
