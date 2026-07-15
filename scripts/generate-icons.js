/**
 * Generate PWA icons from favicon.svg using sharp.
 *
 * Usage:
 *   npm install sharp   (if not already installed)
 *   node scripts/generate-icons.js
 *
 * Outputs:
 *   public/icon-192.png  (192x192)
 *   public/icon-512.png  (512x512)
 */

import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(__dirname, "../public/favicon.svg");
const OUTPUT_DIR = path.resolve(__dirname, "../public");

const sizes = [180, 192, 512];

for (const size of sizes) {
  const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
  await sharp(INPUT)
    .resize(size, size, { fit: "contain", background: { r: 251, g: 250, b: 248, alpha: 1 } })
    .png()
    .toFile(outputPath);
  console.log(`Created ${outputPath}`);
}

console.log("Done.");
