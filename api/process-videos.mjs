import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function zoneFromPostcode(postcode) {
  if (!postcode) return null;
  const clean = postcode.trim().toUpperCase();

  // Central — check specific districts before broad prefixes
  if (clean.startsWith('EC')) return 'Central';   // City of London
  if (clean.startsWith('WC')) return 'Central';   // Covent Garden, Holborn
  if (clean.startsWith('W1')) return 'Central';   // Mayfair, Soho, Marylebone, Fitzrovia
  if (clean.startsWith('SW1')) return 'Central';  // Westminster, Whitehall, Belgravia
  if (clean.startsWith('NW1')) return 'Central';  // Camden Town, Marylebone, Regents Park
  if (clean.startsWith('SE1')) return 'Central';  // Southwark, Borough, Waterloo, Bermondsey

  // Northwest
  if (clean.startsWith('NW')) return 'Northwest'; // Hampstead, Kilburn, Cricklewood
  if (clean.startsWith('HA')) return 'Northwest'; // Harrow
  if (clean.startsWith('WD')) return 'Northwest'; // Watford
  if (clean.startsWith('AL')) return 'Northwest'; // St Albans

  // North
  if (clean.startsWith('N')) return 'North';      // Islington, Highgate, Tottenham, Stoke Newington
  if (clean.startsWith('EN')) return 'North';     // Enfield

  // East
  if (clean.startsWith('E')) return 'East';       // Shoreditch, Hackney, Stratford, Bethnal Green
  if (clean.startsWith('RM')) return 'East';      // Romford
  if (clean.startsWith('IG')) return 'East';      // Ilford

  // West
  if (clean.startsWith('W')) return 'West';       // Paddington, Notting Hill, Chiswick, Hammersmith
  if (clean.startsWith('UB')) return 'West';      // Uxbridge

  // Southwest
  if (clean.startsWith('SW')) return 'Southwest'; // Brixton, Clapham, Battersea, Chelsea
  if (clean.startsWith('TW')) return 'Southwest'; // Twickenham, Richmond
  if (clean.startsWith('KT')) return 'Southwest'; // Kingston
  if (clean.startsWith('SM')) return 'Southwest'; // Sutton, Morden

  // Southeast
  if (clean.startsWith('SE')) return 'Southeast'; // Peckham, Greenwich, Lewisham, Deptford
  if (clean.startsWith('CR')) return 'Southeast'; // Croydon
  if (clean.startsWith('BR')) return 'Southeast'; // Bromley
  if (clean.startsWith('DA')) return 'Southeast'; // Dartford, Bexley

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

async function parseCaption(caption) {
  const prompt = `You are parsing a TikTok video caption about London experiences or venues.
The caption may mention ONE venue or MULTIPLE venues, or may not be about a specific London venue at all.

Caption: ${JSON.stringify(caption)}

First decide: does this caption mention at least one specific London venue, restaurant, bar, experience or place to visit?
If NO - return exactly: {"skip": true}
If YES - extract structured data and return a JSON array of venue objects.

Each venue object:
{
  "name": "venue name",
  "address": "full address if mentioned, or null",
  "area": "neighbourhood e.g. Shoreditch, Chelsea, Clapham",
  "zone": "one of: North, Northwest, Northeast, South, Southwest, Southeast, East, West, Central",
  "category": "one of: restaurant, bar, cafe, market, experience, outdoor, museum, gallery, event, nightlife",
  "price": "e.g. Free, £10, £20-30, or null if unknown",
  "is_event": false,
  "event_start": null,
  "event_end": null,
  "comment": "interesting descriptors about this specific venue",
  "vibe_tags": ["tags from: chill, romantic, chaotic, cultural, fancy, hidden_gems, social, foodie, outdoor, aesthetic, iconic"]
}

Return ONLY valid JSON, no markdown.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await resp.json();
  const txt = data.content?.find(b => b.type === 'text')?.text || '';
  const cleaned = txt.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function enrichWithGoogle(name, area) {
  console.log(`[enrich] attempting: ${name}, key present: ${!!process.env.GOOGLE_PLACES_KEY}`);
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
    console.log(`[enrich] ${name} — found: ${!!place}, rating: ${place?.rating}, price: ${place?.price_level}`);
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
      } catch (e) {
        console.error(`[enrich] details failed for ${name}:`, e.message);
      }
    }

    const derivedZone = zoneFromPostcode(postcode);
    const derivedArea = areaFromAddress(address);

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
    console.error(`[enrich] Google enrichment failed for ${name}:`, e.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: pending } = await supabase
    .from('pending_videos')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(10);

  if (!pending || pending.length === 0) {
    return res.status(200).json({ message: 'No pending videos to process', processed: 0 });
  }

  const results = { processed: 0, saved: 0, skipped: 0, errors: 0, error_details: [] };

  for (const video of pending) {
    try {
      const parsed = await parseCaption(video.caption);
      await supabase.from('pending_videos').update({ processed: true }).eq('id', video.id);
      results.processed++;

      if (parsed?.skip) { results.skipped++; continue; }

      const venues = Array.isArray(parsed) ? parsed : [parsed];

      for (const venue of venues) {
        if (!venue.name || !venue.area) { results.skipped++; continue; }

        const { data: existingUrl } = await supabase
          .from('experiences')
          .select('id')
          .eq('tiktok_url', video.tiktok_url)
          .limit(1);

        if (existingUrl && existingUrl.length > 0) { results.skipped++; continue; }

        const { data: existingName } = await supabase
          .from('experiences')
          .select('id')
          .ilike('name', venue.name)
          .limit(1);

        if (existingName && existingName.length > 0) { results.skipped++; continue; }

        let google = await enrichWithGoogle(venue.name, venue.area);
        if (!google) {
          console.log(`[enrich] retrying ${venue.name} without area bias`);
          await new Promise(r => setTimeout(r, 500));
          google = await enrichWithGoogle(venue.name, '');
        }

        const finalZone = google?.derived_zone || venue.zone || 'Central';
        const finalArea = google?.derived_area || venue.area;

        await supabase.from('experiences').insert({
          name: google?.validated_name || venue.name,
          address: google?.validated_address || venue.address || null,
          area: finalArea,
          zone: finalZone,
          category: venue.category,
          price: google?.price || venue.price || null,
          is_event: venue.is_event || false,
          event_start: venue.event_start || null,
          event_end: venue.event_end || null,
          comment: venue.comment,
          vibe_tags: venue.vibe_tags || [],
          tiktok_url: video.tiktok_url,
          source: video.source || null,
          status: 'pending',
          lat: google?.lat || null,
          lng: google?.lng || null,
          postcode: google?.postcode || null,
          google_place_id: google?.google_place_id || null,
          google_rating: google?.google_rating || null,
          google_review_count: google?.google_review_count || null,
          google_price_level: google?.google_price_level || null,
          website: google?.website || null,
          phone: google?.phone || null,
          opening_hours: google?.opening_hours || null,
        });

        results.saved++;
      }
    } catch (e) {
      results.errors++;
      results.error_details.push({ video: video.tiktok_url, error: e.message });
    }
  }

  const { count } = await supabase
    .from('pending_videos')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false);

  res.status(200).json({
    message: 'Processing complete',
    remaining_in_queue: count || 0,
    ...results
  });
}
