// Google Places API (New) photo helper, shared by the API routes.
// Returns the first photo of a place as { buffer, contentType }, or null if the
// place has no photos. Never uses the legacy maps/api/place/photo endpoint.
export async function fetchFirstPlacePhoto(placeId, apiKey, width = 1200) {
  const details = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
  });
  if (!details.ok) throw new Error(`places details ${details.status}`);
  const name = (await details.json()).photos?.[0]?.name;
  if (!name) return null;
  const media = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&key=${apiKey}`);
  if (!media.ok) throw new Error(`places photo ${media.status}`);
  const contentType = media.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error(`unexpected ${contentType}`);
  return { buffer: Buffer.from(await media.arrayBuffer()), contentType };
}
