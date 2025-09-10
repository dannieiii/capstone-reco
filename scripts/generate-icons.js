const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const favicons = require('favicons').default;
const Jimp = require('jimp');

const root = path.resolve(__dirname, '..');
// Build candidate list dynamically so slight filename differences still work
const assetsDir = path.join(root, 'src', 'assets');
let inputCandidates = [];
try {
  const files = fs.readdirSync(assetsDir).filter(f => /\.png$/i.test(f));
  // Prefer any filename that contains 'green'
  const greenRegexOrder = [
    /farmx.*icon.*green.*\.png/i,
    /farmx.*green.*\.png/i,
    /green.*\.png/i,
  ];
  for (const rx of greenRegexOrder) {
    const match = files.find(f => rx.test(f));
    if (match) {
      inputCandidates.push(path.join(assetsDir, match));
      break; // take the first best green match
    }
  }
} catch {}

// Add explicit known names (green then white) and final fallbacks
inputCandidates = inputCandidates.concat([
  path.join(root, 'src', 'assets', 'farmxpress-icon(green).png'),
  path.join(root, 'src', 'assets', 'farmxpress-icon-green.png'),
  path.join(root, 'src', 'assets', 'farmxpress-icongreen.png'),
  // White fallbacks
  path.join(root, 'src', 'assets', 'farmxpress-iconwhite.png'),
  path.join(root, 'src', 'assets', 'logowhite.png'),
  // Generic fallbacks
  path.join(root, 'src', 'assets', 'icon.png'),
  path.join(root, 'src', 'assets', 'logo.png'),
]);

const outputPublic = path.join(root, 'public');
const outputIconsDir = path.join(outputPublic, 'img', 'icons');

const source = inputCandidates.find(p => fs.existsSync(p));
if (!source) {
  console.error('Icon not found. Please add src/assets/farmxpress-icon(green).png (or farmxpress-icon-green.png / farmxpress-icongreen.png). Fallbacks include farmxpress-iconwhite.png, icon.png, logo.png, logowhite.png');
  process.exit(1);
}

console.log('Using app icon source:', path.relative(root, source));

const config = {
  path: '/img/icons',
  appName: 'FarmXpress',
  appShortName: 'FarmXpress',
  appDescription: 'FarmXpress',
  // Preserve transparency for generated PNGs (favicons supports 'transparent')
  background: 'transparent',
  theme_color: '#2e5c31',
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: false,
    favicons: true,
    windows: true,
    yandex: false,
  },
};

(async () => {
  try {
  await fse.ensureDir(outputIconsDir);
  // Clean existing icons to avoid stale files from previous runs
  await fse.emptyDir(outputIconsDir);

  // 1) Preprocess: trim transparent margins and scale to fill a square canvas
  const original = await Jimp.read(source);
  // Autocrop with stronger tolerance to remove subtle transparent borders
  original.autocrop({ tolerance: 0.01, cropOnlyFrames: false });

  const targetSize = 1024; // high base resolution for crisp downscales
  const ZOOM_FACTOR = 1.16; // slight overfill to appear larger on desktop tiles
  // Compute scale to fit the longest side to target with no extra margin
  const w = original.bitmap.width;
  const h = original.bitmap.height;
  const scale = (targetSize / Math.max(w, h)) * ZOOM_FACTOR;
  const resized = original.clone().resize(Math.round(w * scale), Math.round(h * scale), Jimp.RESIZE_BICUBIC);

  // Create transparent square canvas and center the image
  const canvas = await new Jimp(targetSize, targetSize, 0x00000000);
  const x = Math.round((targetSize - resized.bitmap.width) / 2);
  const y = Math.round((targetSize - resized.bitmap.height) / 2);
  canvas.composite(resized, x, y);

  // Write a temporary processed PNG
  const tmpProcessed = path.join(outputIconsDir, '__source_processed.png');
  await canvas.writeAsync(tmpProcessed);

  // 2) Generate icons from processed image
  const response = await favicons(tmpProcessed, config);

    // Write images
    for (const image of response.images) {
      const dest = path.join(outputIconsDir, image.name);
      await fse.writeFile(dest, image.contents);
      console.log('Wrote', dest);
    }

    // Write files (includes manifest, browserconfig, favicon.ico)
    for (const file of response.files) {
      if (file.name === 'manifest.json') {
        // Keep our existing manifest; skip overwriting
        continue;
      }
      if (file.name === 'favicon.ico') {
        await fse.writeFile(path.join(outputPublic, 'favicon.ico'), file.contents);
        console.log('Wrote', path.join(outputPublic, 'favicon.ico'));
      } else {
        const dest = path.join(outputIconsDir, file.name);
        await fse.writeFile(dest, file.contents);
        console.log('Wrote', dest);
      }
    }

  // Cleanup temp file
  try { await fse.remove(tmpProcessed); } catch {}

  console.log('Icon generation complete.');
  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
})();
