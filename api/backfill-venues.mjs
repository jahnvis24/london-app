import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function zoneFromPostcode(postcode) {
  if (!postcode) return null;
  const clean = postcode.trim().toUpperCase();
  if (clean.startsWith('NW')) return 'Northwest';
  if (clean.startsWith('NE')) return 'Northeast';
  if (clean.startsWith('SW')) return 'Southwest';
  if (clean.startsWith('SE')) return 'Southeast';
  if (clean.startsWith('EC')) return 'Central';
  if (clean.startsWith('WC')) return 'Central';
  if (clean.startsWith('N')) return 'North';
  if (clean.startsWith('E')) return 'East';
  if (clean.startsWith('W')) return 'West';
  if (clean.startsWith('S')) return 'South';
  if (clean.startsWith('HA')) return 'Northwest';
  if (clean.startsWith('UB')) return 'West';
  if (clean.startsWith('TW')) return 'Southwest';
  if (clean.startsWith('KT')) return 'Southwest';
  if (clean.startsWith('SM')) return 'Southwest';
  if (clean.startsWith('CR')) return 'Southeast';
  if (clean.startsWith('BR')) return 'Southeast';
  if (clean.startsWith('DA')) return 'Southeast';
  if (clean.startsWith('RM')) return 'East';
  if (clean.startsWith('IG')) return 'East';
  if (clean.startsWith('EN')) return 'North';
  if (clean.startsWith('WD')) return 'Northwest';
  if (clean.startsWith('AL')) return 'Northwest';
  return null;
}

function areaFromAddress(address) {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim());
  const londonIdx = parts.findIndex(p => p === 'London' || p === 'Greater London');
  if (londonIdx > 1) return parts[londonIdx - 1];
  if (londonIdx === 1) return parts[0];
  return null;
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
    let place = searchData.candidates?.[0];

    // Retry without area if not found
    if (!place && area) {
      await sleep(300);
      const retryResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(`${name} London`)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level&locationbias=circle:30000@51.5074,-0.1278&key=${apiKey}`,
        { method: 'GET' }
      );
      const retryData = await retryResp.json();
      place = retryData.candidates?.[0];
    }

    if (!place) return null;

    const address = place.formatted_address || '';
    const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
    const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
    const priceLevelMap = { 0: 'Free', 1: 'Under £15pp', 2: '£15-35pp', 3: '£35-70pp', 4: '£70pp+' };

    const derivedZone = zoneFromPostcode(postcode);
    const derivedArea = areaFromAddress(address);

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
      validated_address: address,
      postcode,
      derived_zone: derivedZone,
      derived_area: derivedArea,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      google_place_id: place.place_id,
      google_rating: place.rating || null,
      google_review_count: place.user_ratings_total || null,
      google_price_level: place.price_level ?? null,
      price: priceLevelMap[place.price_level] ?? null,
      website, phone, opening_hours,
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
      await supabase.from('experiences').update({ google_place_id: 'NOT_FOUND' }).eq('id', venue.id);
      results.not_found++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('experiences')
      .update({
        address: google.validated_address,
        postcode: google.postcode,
        zone: google.derived_zone || undefined,
        area: google.derived_area || undefined,
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
      console.log(`[backfill] updated: ${venue.name} — zone: ${google.derived_zone}, area: ${google.derived_area}, price: ${google.price}`);
      results.updated++;
    }
  }

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
