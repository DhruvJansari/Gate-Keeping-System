/**
 * Generates PWA icons from public/logo.png using sharp.
 * Produces icon-192x192.png and icon-512x512.png in public/icons/.
 * Run: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const LOGO_SRC = path.join(__dirname, '..', 'public', 'logo.png');

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

async function generate() {
  if (!fs.existsSync(LOGO_SRC)) {
    console.error('[PWA Icons] logo.png not found at', LOGO_SRC);
    process.exit(1);
  }

  for (const size of [192, 512]) {
    const out = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(LOGO_SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(out);
    console.log(`[PWA Icons] Generated ${size}x${size} from logo.png → ${out}`);
  }
  console.log('[PWA Icons] Done!');
}

generate().catch(console.error);
