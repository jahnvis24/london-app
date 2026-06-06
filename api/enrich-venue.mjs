// ── LONDON ZONE CLASSIFIER (Deterministic Spec v2) ──────────
// Hierarchy: known neighbourhood in address → postcode fallback
// Address-first means "Shoreditch" always wins over an EC2 postcode.

const NEIGHBOURHOOD_ZONES = {
  // Central
  'soho': 'Central', 'covent garden': 'Central', 'fitzrovia': 'Central',
  'bloomsbury': 'Central', 'holborn': 'Central', 'westminster': 'Central',
  'piccadilly': 'Central', 'strand': 'Central', 'trafalgar': 'Central',
  'clerkenwell': 'Central', 'farringdon': 'Central', 'the city': 'Central',
  'king\'s cross': 'Central', 'kings cross': 'Central', 'euston': 'Central',
  'waterloo': 'Central', 'south bank': 'Central', 'bankside': 'Central',
  'pimlico': 'Central', 'victoria': 'Central', 'st james': 'Central',

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
  'mayfair': 'West', 'marylebone': 'West', 'notting hill': 'West',
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
    if (addr.includes(neighbourhood)) return zone;
  }
  return null;
}

function zoneFromPostcode(postcode) {
  if (!postcode) return null;
  const pc = postcode.trim().toUpperCase().replace(/\s/g, '');

  if (pc.startsWith('WC') || pc.startsWith('EC') || pc.startsWith('W1') || pc.startsWith('SW1')) return 'Central';
  if (pc.startsWith('NW3') || pc.startsWith('NW11')) return 'Northwest';
  if (pc.startsWith('NW') || pc.startsWith('HA') || pc.startsWith('WD') || pc.startsWith('AL')) return 'Northwest';
  if (pc.startsWith('N6')) return 'Northwest';
  if (pc.startsWith('N') || pc.startsWith('EN')) return 'North';
  if (pc.startsWith('E') || pc.startsWith('RM') || pc.startsWith('IG')) return 'East';
  if (pc.startsWith('SE') || pc.startsWith('CR') || pc.startsWith('BR') || pc.startsWith('DA')) return 'Southeast';
  if (pc.startsWith('SW') || pc.startsWith('TW') || pc.startsWith('KT') || pc.startsWith('SM')) return 'Southwest';
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

  try {
    const searchQuery = `${name} ${area || ''} London`;
    const searchResp = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level&locationbias=circle:30000@51.5074,-0.1278&key=${apiKey}`,
      { method: 'GET' }
    );

    const searchData = await searchResp.json();
    let place = searchData.candidates?.[0];

    if (!place && area) {
      const retryResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(`${name} London`)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level&locationbias=circle:30000@51.5074,-0.1278&key=${apiKey}`,
        { method: 'GET' }
      );
      const retryData = await retryResp.json();
      place = retryData.candidates?.[0];
    }

    if (!place) return res.status(200).json({ found: false, message: 'No matching place found on Google' });

    const address = place.formatted_address || '';
    const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
    const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
    const priceLevelMap = { 0: 'Free', 1: 'Under £15pp', 2: '£15-35pp', 3: '£35-70pp', 4: '£70pp+' };

    const { zone: derivedZone, area: derivedArea } = classifyZone(postcode, address);

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
      } catch (e) {
        console.error(`[enrich-venue] details fetch failed for ${name}:`, e.message);
      }
    }

    res.status(200).json({
      found: true,
      google_place_id: place.place_id,
      validated_name: place.name || name,
      validated_address: address,
      postcode,
      derived_zone: derivedZone,
      derived_area: derivedArea,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      google_rating: place.rating || null,
      google_review_count: place.user_ratings_total || null,
      google_price_level: place.price_level ?? null,
      price: priceLevelMap[place.price_level] ?? null,
      website, phone, opening_hours,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
