import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ICONS_DIR = path.resolve("public/icons");
fs.mkdirSync(ICONS_DIR, { recursive: true });

function createSvg({ size, padding, bg, stroke, rx }) {
  const contentSize = size - padding * 2;
  const radius = rx !== undefined ? rx : (size > 64 ? 28 : 6);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${bg ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>` : ""}
    <g transform="translate(${padding}, ${padding}) scale(${contentSize / 32})">
      <path d="M3 5.5 16 28 29 5.5" stroke="${stroke}" stroke-width="3" stroke-linecap="square" fill="none"/>
      <circle cx="16" cy="28" r="2.5" fill="${stroke}"/>
    </g>
  </svg>`;
}

function createMaskableSvg({ size }) {
  // Safe zone for maskable icons is inside the 80% circle, so padding >= 20%
  const padding = Math.round(size * 0.22);
  const contentSize = size - padding * 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#0B0C0E"/>
    <g transform="translate(${padding}, ${padding}) scale(${contentSize / 32})">
      <path d="M3 5.5 16 28 29 5.5" stroke="#7C6CF7" stroke-width="3.2" stroke-linecap="square" fill="none"/>
      <circle cx="16" cy="28" r="2.7" fill="#7C6CF7"/>
    </g>
  </svg>`;
}

async function run() {
  // 1. icon-192.png
  const svg192 = createSvg({ size: 192, padding: 36, bg: "#0B0C0E", stroke: "#7C6CF7" });
  await sharp(Buffer.from(svg192)).png().toFile(path.join(ICONS_DIR, "icon-192.png"));

  // 2. icon-512.png
  const svg512 = createSvg({ size: 512, padding: 96, bg: "#0B0C0E", stroke: "#7C6CF7" });
  await sharp(Buffer.from(svg512)).png().toFile(path.join(ICONS_DIR, "icon-512.png"));

  // 3. maskable-icon-512.png
  const maskable512 = createMaskableSvg({ size: 512 });
  await sharp(Buffer.from(maskable512)).png().toFile(path.join(ICONS_DIR, "maskable-icon-512.png"));

  // 4. apple-touch-icon.png (180x180, unrounded per Apple spec which clips itself)
  const appleTouch = createSvg({ size: 180, padding: 32, bg: "#0B0C0E", stroke: "#7C6CF7", rx: 0 });
  await sharp(Buffer.from(appleTouch)).png().toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));

  // 5. favicon.ico / favicon in public/ and app/
  const fav32 = createSvg({ size: 32, padding: 4, bg: "#0B0C0E", stroke: "#7C6CF7", rx: 6 });
  const favBuffer = await sharp(Buffer.from(fav32)).png().toBuffer();
  fs.writeFileSync(path.resolve("public/favicon.ico"), favBuffer);
  fs.writeFileSync(path.resolve("app/favicon.ico"), favBuffer);

  console.log("Icons generated successfully.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
