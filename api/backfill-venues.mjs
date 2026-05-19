import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PRICE_MAP = {
  'PRICE_LEVEL_FREE': 'Free',
  'PRICE_LEVEL_INEXPENSIVE': 'Under £15pp',
  'PRICE_LEVEL_MODERATE': '£15-35pp',
  'PRICE_LEVEL_EXPENSIVE': '£35-70pp',
  'PRICE_LEVEL_VERY_EXPENSIVE': '£70pp+'
};

async function enrichVenue(name, area) {
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  const searchQuery = `${name} ${area || ''} London`;

  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.shortFormattedAddress'
    },
    body: JSON.stringify({
      textQuery: searchQuery,
      locationBias: {
        circle: {
          center: { latitude: 51.5074, longitude: -0.1278 },
          radius: 30000.0
        }
      },
      maxResultCount: 1
    })
  });

  const data = await resp.json();
  const place = data.places?.[0];
  if (!place) return null;

  const address = place.formattedAddress || '';
  const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);

  return {
    google_place_id: place.id,
    address: place.formattedAddress,
    postcode: postcodeMatch ? postcodeMatch[0].toUpperCase() : null,
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    google_rating: place.rating || null,
    google_review_count: place.userRatingCount || null,
    google_price_level: place.priceLevel || null,
    price: PRICE_MAP[place.priceLevel] || null,
    website: place.websiteUri || null,
    phone: place.nationalPhoneNumber || null,
    opening_hours: place.regularOpeningHours?.weekdayDescriptions || null,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: venues, error } = await supabase
      .from('experiences')
      .select('id, name, area, zone')
      .eq('status', 'approved')
      .is('google_place_id', null);

    if (error) throw error;
    if (!venues || venues.length === 0) {
      return res.status(200).json({ message: 'All venues already enriched', count: 0 });
    }

    const results = { success: [], failed: [], skipped: [] };

    for (const venue of venues) {
      try {
        await sleep(200);

        const enriched = await enrichVenue(venue.name, venue.area);

        if (!enriched) {
          results.failed.push({ name: venue.name, reason: 'Not found on Google' });
          continue;
        }

        const update = {};
        if (enriched.google_place_id) update.google_place_id = enriched.google_place_id;
        if (enriched.address) update.address = enriched.address;
        if (enriched.postcode) update.postcode = enriched.postcode;
        if (enriched.lat) update.lat = enriched.lat;
        if (enriched.lng) update.lng = enriched.lng;
        if (enriched.google_rating) update.google_rating = enriched.google_rating;
        if (enriched.google_review_count) update.google_review_count = enriched.google_review_count;
        if (enriched.google_price_level) update.google_price_level = enriched.google_price_level;
        if (enriched.price) update.price = enriched.price;
        if (enriched.website) update.website = enriched.website;
        if (enriched.phone) update.phone = enriched.phone;
        if (enriched.opening_hours) update.opening_hours = enriched.opening_hours;

        const { error: updateError } = await supabase
          .from('experiences')
          .update(update)
          .eq('id', venue.id);

        if (updateError) throw updateError;
        results.success.push({ name: venue.name, place_id: enriched.google_place_id });

      } catch (e) {
        results.failed.push({ name: venue.name, reason: e.message });
      }
    }

    res.status(200).json({
      total: venues.length,
      enriched: results.success.length,
      failed: results.failed.length,
      details: results
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}