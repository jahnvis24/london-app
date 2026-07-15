// Re-fetches Google Places photos for saves that currently show a screenshot
// instead of the actual venue photo. Run once: node scripts/fix-screenshot-photos.mjs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BLOB_API = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/saved-tools`
  : "http://localhost:3000/api/saved-tools";

async function main() {
  // Find all screenshot-sourced saves that have a google_place_id
  const { data: saves, error } = await supabase
    .from("experiences")
    .select("id, name, google_place_id, photo_url, source_type")
    .eq("source_type", "screenshot")
    .not("google_place_id", "is", null);

  if (error) { console.error("Query failed:", error.message); process.exit(1); }
  if (!saves?.length) { console.log("No screenshot saves with google_place_id found."); return; }

  console.log(`Found ${saves.length} screenshot saves with Google place IDs. Checking photos...`);

  let fixed = 0;
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;

  for (const s of saves) {
    // Skip if photo_url already looks like a Vercel Blob URL pointing to a Google photo
    // (not a data: URI or screenshot blob)
    if (s.photo_url && !s.photo_url.startsWith("data:") && s.photo_url.includes("blob.vercelcdn")) {
      // Could still be a screenshot uploaded to blob — check if we can get a better one
    }

    try {
      // Fetch Google Places photo directly
      const detailResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.google_place_id}&fields=photos&key=${GOOGLE_KEY}`
      );
      const detailData = await detailResp.json();
      const photoRef = detailData.result?.photos?.[0]?.photo_reference;

      if (!photoRef) {
        console.log(`  [skip] ${s.name} — no Google photo available`);
        continue;
      }

      // Get the actual photo
      const photoResp = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${GOOGLE_KEY}`,
        { redirect: "manual" }
      );
      const redirectUrl = photoResp.headers.get("location");

      if (!redirectUrl) {
        console.log(`  [skip] ${s.name} — couldn't resolve photo redirect`);
        continue;
      }

      // Download and re-upload to Vercel Blob
      const imgResp = await fetch(redirectUrl);
      const buffer = Buffer.from(await imgResp.arrayBuffer());
      const contentType = imgResp.headers.get("content-type") || "image/jpeg";

      const { put } = await import("@vercel/blob");
      const ext = contentType.includes("png") ? "png" : "jpg";
      const blob = await put(`saves/${s.id}-google.${ext}`, buffer, { access: "public", contentType });

      // Update DB
      await supabase.from("experiences").update({ photo_url: blob.url }).eq("id", s.id);
      console.log(`  [fixed] ${s.name} → ${blob.url}`);
      fixed++;
    } catch (e) {
      console.error(`  [error] ${s.name}:`, e.message);
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${saves.length} screenshot saves.`);
}

main();
