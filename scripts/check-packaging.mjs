import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

console.log("Running packaging & PWA verification...");

// 1. Manifest verification
const manifestRaw = fs.readFileSync(path.resolve("public/manifest.json"), "utf8");
const manifest = JSON.parse(manifestRaw);

assert.ok(manifest.name, "Manifest must have a name");
assert.ok(manifest.short_name, "Manifest must have a short_name");
assert.equal(manifest.display, "standalone", "Manifest display must be standalone");
assert.equal(manifest.start_url, "/", "Manifest start_url must be /");
assert.ok(manifest.theme_color, "Manifest must declare theme_color");
assert.ok(manifest.background_color, "Manifest must declare background_color");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, "Manifest must declare icons");

const maskable = manifest.icons.find((i) => i.purpose === "maskable");
assert.ok(maskable, "Manifest must declare at least one maskable icon");

// 2. Icon files & dimensions verification
const requiredIcons = [
  { file: "public/favicon.ico", minWidth: 32, minHeight: 32 },
  { file: "public/icons/apple-touch-icon.png", width: 180, height: 180 },
  { file: "public/icons/icon-192.png", width: 192, height: 192 },
  { file: "public/icons/icon-512.png", width: 512, height: 512 },
  { file: "public/icons/maskable-icon-512.png", width: 512, height: 512 },
];

for (const icon of requiredIcons) {
  const filePath = path.resolve(icon.file);
  assert.ok(fs.existsSync(filePath), `Icon file missing: ${icon.file}`);

  const metadata = await sharp(filePath).metadata();
  if (icon.width && icon.height) {
    assert.equal(
      metadata.width,
      icon.width,
      `${icon.file} width expected ${icon.width}, got ${metadata.width}`,
    );
    assert.equal(
      metadata.height,
      icon.height,
      `${icon.file} height expected ${icon.height}, got ${metadata.height}`,
    );
  } else if (icon.minWidth && icon.minHeight) {
    assert.ok(
      metadata.width >= icon.minWidth,
      `${icon.file} width expected >= ${icon.minWidth}`,
    );
    assert.ok(
      metadata.height >= icon.minHeight,
      `${icon.file} height expected >= ${icon.minHeight}`,
    );
  }
}

// 3. Service Worker & Security rules verification
const swPath = path.resolve("public/sw.js");
assert.ok(fs.existsSync(swPath), "public/sw.js must exist");
const swContent = fs.readFileSync(swPath, "utf8");

assert.ok(swContent.includes('addEventListener("install"'), "sw.js must handle install event");
assert.ok(swContent.includes('addEventListener("activate"'), "sw.js must handle activate event");
assert.ok(swContent.includes('addEventListener("fetch"'), "sw.js must handle fetch event");

// SECURITY CHECK (Phase 7 rule): Never cache authenticated or user-specific API responses
assert.ok(
  swContent.includes('pathname.startsWith("/api/")') || swContent.includes("startsWith('/api/')"),
  "sw.js must explicitly exclude /api/* from caching",
);
assert.ok(
  swContent.includes("/sign-in") && swContent.includes("/sign-up"),
  "sw.js must explicitly exclude auth routes (/sign-in, /sign-up) from caching",
);

// 4. Layout metadata & PWA integration verification
const layoutPath = path.resolve("app/layout.tsx");
const layoutContent = fs.readFileSync(layoutPath, "utf8");

assert.ok(layoutContent.includes("viewport: Viewport"), "layout.tsx must export viewport");
assert.ok(layoutContent.includes("viewportFit:"), "viewport must specify viewportFit");
assert.ok(layoutContent.includes("manifest:"), "metadata must reference manifest");
assert.ok(layoutContent.includes("appleWebApp:"), "metadata must configure appleWebApp");
assert.ok(layoutContent.includes("<PwaRegister"), "layout.tsx must mount PwaRegister");

// 5. Offline fallback page verification
const offlinePath = path.resolve("app/offline/page.tsx");
assert.ok(fs.existsSync(offlinePath), "app/offline/page.tsx must exist");

console.log("packaging: ok");
