// Generate PWA icons for 自我改变
// Uses sharp (bundled with Next.js) to create PNG icons
// Design: a simple crown/path symbol in amber on dark stone background

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");
const BG = "#1c1917"; // stone-950
const AMBER = "#f59e0b"; // amber-500
const AMBER_DIM = "#b45309"; // amber-700

fs.mkdirSync(ICONS_DIR, { recursive: true });

function createIconSVG(size) {
  const center = size / 2;
  const radius = size * 0.22;
  const strokeW = Math.max(2, size * 0.04);

  // A stylized path/scroll motif: winding road with a crown above
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BG}" rx="${size * 0.15}"/>
      <!-- Crown/dynasty symbol -->
      <g transform="translate(${center}, ${center})">
        <!-- Three vertical lines representing the scroll-path (like Korean landscape scroll) -->
        <line x1="${-radius * 0.6}" y1="${-radius * 0.5}" x2="${-radius * 0.6}" y2="${radius * 0.5}"
              stroke="${AMBER}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.5"/>
        <line x1="0" y1="${-radius * 0.7}" x2="0" y2="${radius * 0.5}"
              stroke="${AMBER}" stroke-width="${strokeW * 1.3}" stroke-linecap="round"/>
        <line x1="${radius * 0.6}" y1="${-radius * 0.5}" x2="${radius * 0.6}" y2="${radius * 0.5}"
              stroke="${AMBER}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.5"/>

        <!-- Bridge/connection lines at top -->
        <line x1="${-radius * 0.6}" y1="${-radius * 0.5}" x2="0" y2="${-radius * 0.7}"
              stroke="${AMBER_DIM}" stroke-width="${strokeW * 0.7}" stroke-linecap="round"/>
        <line x1="${radius * 0.6}" y1="${-radius * 0.5}" x2="0" y2="${-radius * 0.7}"
              stroke="${AMBER_DIM}" stroke-width="${strokeW * 0.7}" stroke-linecap="round"/>

        <!-- Center gem/dot -->
        <circle cx="0" cy="${-radius * 0.7}" r="${strokeW * 1.5}" fill="${AMBER}"/>

        <!-- Base bar -->
        <line x1="${-radius * 1.0}" y1="${radius * 0.55}" x2="${radius * 1.0}" y2="${radius * 0.55}"
              stroke="${AMBER}" stroke-width="${strokeW * 0.8}" stroke-linecap="round"/>
      </g>
    </svg>
  `);
}

async function generateIcons() {
  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-192-maskable.png", size: 192, maskable: true },
  ];

  for (const { name, size, maskable } of sizes) {
    const svg = createIconSVG(maskable ? size : size);
    const padding = maskable ? Math.floor(size * 0.15) : 0;

    let pipeline = sharp(svg).png();

    if (padding > 0) {
      const innerSize = size - padding * 2;
      // Resize the content to fit with padding
      pipeline = sharp(
        await sharp(svg)
          .resize(innerSize, innerSize)
          .png()
          .toBuffer(),
        {
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 28, g: 25, b: 23, alpha: 1 },
          },
        }
      ).composite([
        {
          input: await sharp(svg)
            .resize(innerSize, innerSize)
            .png()
            .toBuffer(),
          top: padding,
          left: padding,
        },
      ]);
    }

    await pipeline.toFile(path.join(ICONS_DIR, name));
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  console.log("\n✅ PWA icons generated in public/icons/");
}

generateIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
