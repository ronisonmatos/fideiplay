const sharp = require('sharp');
const path = require('path');

const INPUT = path.join(__dirname, '../assets/images/android-icon-foreground.png');
const OUTPUT = INPUT;

const CANVAS = 1024;
// Safe zone is 66% of canvas (Android adaptive icon spec: content in center 2/3)
const MAX_CONTENT = Math.round(CANVAS * 0.66); // 675px

async function trimAndCenter() {
  const img = sharp(INPUT).png();
  const meta = await img.metadata();

  // Extract raw RGBA pixels to find bounding box of non-transparent content
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = data[idx + 3];
      if (alpha > 10) { // threshold to ignore near-invisible pixels
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasContent = true;
      }
    }
  }

  if (!hasContent) {
    console.error('No non-transparent content found in image!');
    process.exit(1);
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  console.log(`Content bounding box: ${contentW}x${contentH} at (${minX}, ${minY})`);

  // Crop to just the content
  const cropped = await sharp(INPUT)
    .ensureAlpha()
    .extract({ left: minX, top: minY, width: contentW, height: contentH })
    .toBuffer();

  // Scale so the largest dimension fits in MAX_CONTENT
  const scale = Math.min(MAX_CONTENT / contentW, MAX_CONTENT / contentH);
  const scaledW = Math.round(contentW * scale);
  const scaledH = Math.round(contentH * scale);
  console.log(`Scaled size: ${scaledW}x${scaledH} (${Math.round(scale * 100)}% of original content)`);

  const resized = await sharp(cropped)
    .resize(scaledW, scaledH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  // Center on 1024x1024 transparent canvas
  const left = Math.round((CANVAS - scaledW) / 2);
  const top = Math.round((CANVAS - scaledH) / 2);
  console.log(`Placing at (${left}, ${top}) on ${CANVAS}x${CANVAS} canvas`);

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT);

  // Verify output
  const outMeta = await sharp(OUTPUT).metadata();
  console.log(`\nDone! Output: ${outMeta.width}x${outMeta.height} (${outMeta.format})`);
  console.log(`Logo occupies ${Math.round((scaledW / CANVAS) * 100)}% width, ${Math.round((scaledH / CANVAS) * 100)}% height of canvas`);
  console.log(`Safe zone margin: ${left}px left/right, ${top}px top/bottom`);
}

trimAndCenter().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
