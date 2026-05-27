export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, area } = req.body;
  if (!name) return res.status(400).json({ error: 'Venue name required' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key not configured' });

  try {
    const searchQuery = `${name} ${area || ''} London`;

    // Use legacy Places API for better price_level coverage
    const searchResp = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level&locationbias=circle:30000@51.5074,-0.1278&key=${apiKey}`,
      { method: 'GET' }
    );

    const searchData = await searchResp.json();
    const place = searchData.candidates?.[0];

    if (!place) {
      return res.status(200).json({ found: false, message: 'No matching place found on Google' });
    }

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

    // Get full details (website, phone, opening hours)
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
        console.error(`[enrich-venue] details fetch failed for ${name}:`, e.message);
      }
    }

    const result = {
      found: true,
      google_place_id: place.place_id,
      validated_name: place.name || name,
      validated_address: place.formatted_address,
      postcode,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      google_rating: place.rating || null,
      google_review_count: place.user_ratings_total || null,
      google_price_level: place.price_level ?? null,
      price: priceLevelMap[place.price_level] ?? null,
      website,
      phone,
      opening_hours,
    };

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
