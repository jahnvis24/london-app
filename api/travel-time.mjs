export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { origin, destination, mode, departureTime } = req.body;
  if (!origin || !destination) return res.status(400).json({ error: 'Origin and destination required' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;

  try {
    const travelMode = mode === 'transit' ? 'TRANSIT' : 'WALK';

    const body = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode,
      computeAlternativeRoutes: false,
    };

    if (travelMode === 'TRANSIT' && departureTime) {
      body.departureTime = departureTime;
    }

    const resp = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    const route = data.routes?.[0];

    if (!route) {
      return res.status(200).json({ found: false, message: 'No route found' });
    }

    const durationSeconds = parseInt(route.duration?.replace('s', '') || '0');
    const durationMinutes = Math.round(durationSeconds / 60);
    const distanceMeters = route.distanceMeters || 0;
    const distanceKm = (distanceMeters / 1000).toFixed(1);

    const label = travelMode === 'WALK'
      ? `${durationMinutes} min walk`
      : `${durationMinutes} min (walk + tube)`;

    res.status(200).json({
      found: true,
      durationMinutes,
      distanceKm,
      label,
      mode: travelMode
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}