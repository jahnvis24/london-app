export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, area } = req.body;
  if (!name) return res.status(400).json({ error: 'Venue name required' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key not configured' });

  try {
    const searchQuery = `${name} ${area || ''} London`;
    const searchResp = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.types,places.shortFormattedAddress'
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
      }
    );

    const searchData = await searchResp.json();
    const place = searchData.places?.[0];

    if (!place) {
      return res.status(200).json({ found: false, message: 'No matching place found on Google' });
    }

    const address = place.formattedAddress || '';
    const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
    const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : null;

    const priceLevelMap = {
      'PRICE_LEVEL_FREE': 'Free',
      'PRICE_LEVEL_INEXPENSIVE': 'low',
      'PRICE_LEVEL_MODERATE': 'mid',
      'PRICE_LEVEL_EXPENSIVE': 'high',
      'PRICE_LEVEL_VERY_EXPENSIVE': 'high'
    };

    const result = {
      found: true,
      google_place_id: place.id,
      validated_name: place.displayName?.text || name,
      validated_address: place.formattedAddress,
      short_address: place.shortFormattedAddress,
      postcode,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      google_rating: place.rating || null,
      google_review_count: place.userRatingCount || null,
      google_price_level: place.priceLevel || null,
      price: priceLevelMap[place.priceLevel] || null,
      website: place.websiteUri || null,
      phone: place.nationalPhoneNumber || null,
      opening_hours: place.regularOpeningHours?.weekdayDescriptions || null,
      types: place.types || []
    };

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}