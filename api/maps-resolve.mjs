// Resolves a Google Maps URL into one or more venues.
//   • Single place links (maps.app.goo.gl/..., google.com/maps/place/...) → reliable.
//   • Shared LISTS → best-effort: Google renders lists with JS and blocks scraping,
//     so this may return found:false. In that case the UI suggests Google Takeout.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

  const places = [];
  const seen = new Set();
  const add = (rawName, lat, lng) => {
    if (!rawName) return;
    let name = rawName;
    try { name = decodeURIComponent(rawName.replace(/\+/g, ' ')); } catch { name = rawName.replace(/\+/g, ' '); }
    name = name.trim();
    const key = name.toLowerCase() + (lat || '');
    if (!name || name.length < 2 || seen.has(key)) return;
    seen.add(key);
    places.push({ name, lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null });
  };

  try {
    const resp = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const finalUrl = resp.url || url;
    const html = await resp.text();

    // 1) Single place embedded in the resolved URL: /place/<Name>/@lat,lng
    const placeMatch = finalUrl.match(/\/place\/([^/@]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (placeMatch) add(placeMatch[1], placeMatch[2], placeMatch[3]);

    // 2) Name immediately followed by a coordinate pair in the embedded data
    //    Pattern seen in list payloads: "Place Name", ... [null,null, <lat>, <lng>]
    if (places.length === 0) {
      const nameCoordRe = /\\?"([^"\\]{3,70})\\?"[^\[]{0,200}\[\s*null\s*,\s*null\s*,\s*(-?\d+\.\d{4,}),\s*(-?\d+\.\d{4,})/g;
      let m;
      while ((m = nameCoordRe.exec(html)) && places.length < 200) add(m[1], m[2], m[3]);
    }

    // 3) Fallback for a single shared place: <meta property="og:title">
    if (places.length === 0) {
      const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (og && !/google maps/i.test(og[1])) add(og[1], null, null);
    }

    if (places.length === 0) {
      return res.status(200).json({
        found: false,
        finalUrl,
        message: 'Could not extract places from this link. Google often blocks list scraping — for a saved list, export it via Google Takeout and paste/upload the place names instead.',
      });
    }

    res.status(200).json({ found: true, finalUrl, count: places.length, places });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
