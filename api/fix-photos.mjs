import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places key not configured' });

  const { data: saves, error } = await supabase
    .from("experiences")
    .select("id, name, google_place_id, photo_url, source_type")
    .eq("source_type", "screenshot")
    .not("google_place_id", "is", null);

  if (error) return res.status(500).json({ error: error.message });
  if (!saves?.length) return res.status(200).json({ message: "No saves to fix", fixed: 0 });

  let fixed = 0, skipped = 0, errors = [];

  for (const s of saves) {
    try {
      const detailResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.google_place_id}&fields=photos&key=${apiKey}`
      );
      const detailData = await detailResp.json();
      const photoRef = detailData.result?.photos?.[0]?.photo_reference;

      if (!photoRef) { skipped++; continue; }

      const photoResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${apiKey}`
      );
      const buffer = Buffer.from(await photoResp.arrayBuffer());
      const contentType = photoResp.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : "jpg";

      const blob = await put(`saves/${s.id}-google.${ext}`, buffer, { access: "public", contentType });
      await supabase.from("experiences").update({ photo_url: blob.url }).eq("id", s.id);
      fixed++;
    } catch (e) {
      errors.push({ name: s.name, error: e.message });
    }
  }

  res.status(200).json({ message: "Photo fix complete", total: saves.length, fixed, skipped, errors });
}
