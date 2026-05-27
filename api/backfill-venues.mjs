import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichWithGoogle(name, area) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_KEY;
    if (!apiKey) return null;

    const searchQuery = `${name} ${area || ''} London`;

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

    const priceLevelMap = {
      0: 'Free',
      1: 'Under £15pp',
      2: '£15-35pp',
      3: '£35-70pp',
      4: '£70pp+'
    };

    let website = null;
    let phone = null;
    let opening_hours = null;

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
      } catch (e) {
        console.error(`[backfill] details failed for ${name}:`, e.message);
      }
    }

    return {
      validated_name: place.name || name,
      validated_address: place.formatted_address,
      postcode,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      google_place_id: place.place_id,
      google_rating: place.rating || null,
      google_review_count: place.user_ratings_total || null,
      google_price_level: place.price_level ?? null,
      price: priceLevelMap[place.price_level] ?? null,
      website,
      phone,
      opening_hours,
    };
  } catch (e) {
    console.error(`[backfill] enrichment failed for ${name}:`, e.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only process venues that have never been enriched by Google
  const { data: venues, error } = await supabase
    .from('experiences')
    .select('id, name, area')
    .is('google_place_id', null)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });

  if (!venues || venues.length === 0) {
    return res.status(200).json({ message: 'All venues already enriched', updated: 0, remaining: 0 });
  }

  const results = { processed: 0, updated: 0, not_found: 0, errors: 0 };

  for (const venue of venues) {
    await sleep(200);
    results.processed++;

    const google = await enrichWithGoogle(venue.name, venue.area);

    if (!google) {
      console.log(`[backfill] not found: ${venue.name}`);
      // Mark with a sentinel so we don't keep retrying
      await supabase.from('experiences').update({ google_place_id: 'NOT_FOUND' }).eq('id', venue.id);
      results.not_found++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('experiences')
      .update({
        address: google.validated_address,
        postcode: google.postcode,
        lat: google.lat,
        lng: google.lng,
        google_place_id: google.google_place_id,
        google_rating: google.google_rating,
        google_review_count: google.google_review_count,
        google_price_level: google.google_price_level,
        price: google.price,
        website: google.website,
        phone: google.phone,
        opening_hours: google.opening_hours,
      })
      .eq('id', venue.id);

    if (updateError) {
      console.error(`[backfill] update failed for ${venue.name}:`, updateError.message);
      results.errors++;
    } else {
      console.log(`[backfill] updated: ${venue.name} — rating: ${google.google_rating}, price: ${google.price}`);
      results.updated++;
    }
  }

  // Count remaining unenriched
  const { count } = await supabase
    .from('experiences')
    .select('*', { count: 'exact', head: true })
    .is('google_place_id', null);

  res.status(200).json({
    message: 'Backfill batch complete',
    remaining: count || 0,
    ...results
  });
}
