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

const path = require("path");
const sharp = require("sharp");

const INPUT = path.resolve(__dirname, "../public/favicon.svg");
const OUTPUT_DIR = path.resolve(__dirname, "../public");

async function generate() {
  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(INPUT)
      .resize(size, size, { fit: "contain", background: { r: 251, g: 250, b: 248, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`Created ${outputPath}`);
  }

  console.log("Done.");
}

generate().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
