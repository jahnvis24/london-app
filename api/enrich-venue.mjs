// ── LONDON ZONE CLASSIFIER (Deterministic Spec v2) ──────────
// Hierarchy: known neighbourhood in address → postcode fallback
// Address-first means "Shoreditch" always wins over an EC2 postcode.

const NEIGHBOURHOOD_ZONES = {
  // Central
  'soho': 'Central', 'covent garden': 'Central', 'fitzrovia': 'Central',
  'bloomsbury': 'Central', 'holborn': 'Central', 'westminster': 'Central',
  'piccadilly': 'Central', 'the strand': 'Central', 'trafalgar': 'Central',
  'clerkenwell': 'Central', 'farringdon': 'Central',
  'king\'s cross': 'Central', 'kings cross': 'Central', 'euston': 'Central',
  'south bank': 'Central', 'bankside': 'Central',
  'pimlico': 'Central',

  // East
  'shoreditch': 'East', 'hoxton': 'East', 'bethnal green': 'East',
  'whitechapel': 'East', 'spitalfields': 'East', 'mile end': 'East',
  'bow': 'East', 'stratford': 'East', 'canary wharf': 'East',
  'poplar': 'East', 'limehouse': 'East', 'old street': 'East',
  'hackney': 'East', 'dalston': 'East', 'de beauvoir': 'East',

  // North
  'islington': 'North', 'angel': 'North', 'highbury': 'North',
  'camden': 'North', 'kentish town': 'North', 'holloway': 'North',
  'finsbury park': 'North', 'archway': 'North', 'highgate': 'North',
  'crouch end': 'North', 'muswell hill': 'North',
  'stoke newington': 'North',

  // Northwest
  'hampstead': 'Northwest', 'kilburn': 'Northwest', 'queen\'s park': 'Northwest',
  'queens park': 'Northwest', 'maida vale': 'Northwest', 'st john\'s wood': 'Northwest',
  'swiss cottage': 'Northwest', 'wembley': 'Northwest', 'harrow': 'Northwest',

  // Northeast
  'clapton': 'Northeast', 'walthamstow': 'Northeast', 'leyton': 'Northeast',
  'tottenham': 'Northeast', 'wood green': 'Northeast',

  // West
  'mayfair': 'West', 'marylebone': 'Central', 'notting hill': 'West',
  'kensington': 'West', 'chelsea': 'West', 'knightsbridge': 'West',
  'holland park': 'West', 'shepherd\'s bush': 'West', 'shepherds bush': 'West',
  'hammersmith': 'West', 'fulham': 'West', 'chiswick': 'West',

  // Southwest
  'clapham': 'Southwest', 'battersea': 'Southwest', 'brixton': 'South',
  'putney': 'Southwest', 'tooting': 'Southwest', 'balham': 'Southwest',
  'wandsworth': 'Southwest', 'richmond': 'Southwest', 'wimbledon': 'Southwest',
  'kingston': 'Southwest',

  // Southeast
  'peckham': 'Southeast', 'bermondsey': 'Southeast', 'london bridge': 'Southeast',
  'borough': 'Southeast', 'camberwell': 'Southeast', 'dulwich': 'Southeast',
  'greenwich': 'Southeast', 'deptford': 'Southeast', 'new cross': 'Southeast',
  'lewisham': 'Southeast', 'elephant and castle': 'Southeast',

  // South (Kennington/Vauxhall corridor)
  'kennington': 'South', 'stockwell': 'South', 'vauxhall': 'South',
};

function areaFromAddress(address) {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim());
  const londonIdx = parts.findIndex(p => p === 'London' || p === 'Greater London');
  if (londonIdx > 1) return parts[londonIdx - 1];
  if (londonIdx === 1) return parts[0];
  return null;
}

function zoneFromAddress(address) {
  if (!address) return null;
  const addr = address.toLowerCase();
  for (const [neighbourhood, zone] of Object.entries(NEIGHBOURHOOD_ZONES)) {
    const regex = new RegExp(`\\b${neighbourhood.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(addr)) return zone;
  }
  return null;
}

function zoneFromPostcode(postcode) {
  if (!postcode) return null;
  const pc = postcode.trim().toUpperCase().replace(/\s/g, '');

  // Central: WC, EC, W1 (not W10+), SW1 (not SW10+), NW1 (not NW10+)
  if (pc.startsWith('WC') || pc.startsWith('EC')) return 'Central';
  if (/^W1[A-Z]/.test(pc)) return 'Central';
  if (/^SW1[A-Z]/.test(pc)) return 'Central';
  if (/^NW1[A-Z]/.test(pc)) return 'Central';

  // Northwest
  if (pc.startsWith('NW3') || pc.startsWith('NW11')) return 'Northwest';
  if (pc.startsWith('NW') || pc.startsWith('HA') || pc.startsWith('WD') || pc.startsWith('AL')) return 'Northwest';

  // North
  if (pc.startsWith('N6')) return 'Northwest';
  if (pc.startsWith('N') || pc.startsWith('EN')) return 'North';

  // East
  if (pc.startsWith('E') || pc.startsWith('RM') || pc.startsWith('IG')) return 'East';

  // Southeast
  if (pc.startsWith('SE') || pc.startsWith('CR') || pc.startsWith('BR') || pc.startsWith('DA')) return 'Southeast';

  // Southwest (SW2–SW20, not SW1)
  if (pc.startsWith('SW') || pc.startsWith('TW') || pc.startsWith('KT') || pc.startsWith('SM')) return 'Southwest';

  // West (W2–W14, UB)
  if (pc.startsWith('W') || pc.startsWith('UB')) return 'West';

  return null;
}

function classifyZone(postcode, address) {
  const area = areaFromAddress(address);
  const zoneByAddress = zoneFromAddress(address);
  if (zoneByAddress) return { zone: zoneByAddress, area };
  return { zone: zoneFromPostcode(postcode), area };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, area } = req.body;
  if (!name) return res.status(400).json({ error: 'Venue name required' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key not configured' });

  const PRICE_MAP = {
    'PRICE_LEVEL_FREE': 'Free',
    'PRICE_LEVEL_INEXPENSIVE': 'Under £15pp',
    'PRICE_LEVEL_MODERATE': '£15-35pp',
    'PRICE_LEVEL_EXPENSIVE': '£35-70pp',
    'PRICE_LEVEL_VERY_EXPENSIVE': '£70pp+'
  };

  async function searchPlaces(query) {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours'
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: { circle: { center: { latitude: 51.5074, longitude: -0.1278 }, radius: 30000.0 } },
        maxResultCount: 1
      })
    });
    const data = await resp.json();
    return data.places?.[0] || null;
  }

  try {
    let place = await searchPlaces(`${name} ${area || ''} London`);
    if (!place && area) {
      place = await searchPlaces(`${name} London`);
    }

    if (!place) return res.status(200).json({ found: false, message: 'No matching place found on Google' });

    const address = place.formattedAddress || '';
    const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
    const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : null;

    const { zone: derivedZone, area: derivedArea } = classifyZone(postcode, address);

    res.status(200).json({
      found: true,
      google_place_id: place.id,
      validated_name: place.displayName?.text || name,
      validated_address: address,
      postcode,
      derived_zone: derivedZone,
      derived_area: derivedArea,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      google_rating: place.rating || null,
      google_review_count: place.userRatingCount || null,
      google_price_level: place.priceLevel || null,
      price: PRICE_MAP[place.priceLevel] ?? null,
      website: place.websiteUri || null,
      phone: place.nationalPhoneNumber || null,
      opening_hours: place.regularOpeningHours?.weekdayDescriptions || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
