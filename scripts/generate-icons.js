const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const favicons = require('favicons').default;
const Jimp = require('jimp');

const root = path.resolve(__dirname, '..');
const inputCandidates = [
  path.join(root, 'src', 'assets', 'icon.png'),
  path.join(root, 'src', 'assets', 'logo.png'),
  path.join(root, 'src', 'assets', 'logowhite.png')
];

const outputPublic = path.join(root, 'public');
const outputIconsDir = path.join(outputPublic, 'img', 'icons');

const source = inputCandidates.find(p => fs.existsSync(p));
if (!source) {
  console.error('Icon not found. Please add src/assets/icon.png (or logo.png/logowhite.png)');
  process.exit(1);
}

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

  // 1) Preprocess: trim transparent margins and scale to fill a square canvas
  const original = await Jimp.read(source);
  // Autocrop with tolerance to remove outer ring if it has low alpha
  original.autocrop({ tolerance: 0.0001, cropOnlyFrames: false });

  const targetSize = 1024; // high base resolution for crisp downscales
  // Compute scale to fit the longest side to target, with a slight margin (5%)
  const w = original.bitmap.width;
  const h = original.bitmap.height;
  const scale = (targetSize * 0.98) / Math.max(w, h);
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
