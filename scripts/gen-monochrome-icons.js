const sharp = require('sharp');
const path = require('path');

const SOURCE = path.join(__dirname, '../assets/images/logo_branco.png');
const MONOCHROME_OUT = path.join(__dirname, '../assets/images/android-icon-monochrome.png');
const NOTIFICATION_OUT = path.join(__dirname, '../assets/images/notification-icon.png');

const CANVAS = 1024;
const MAX_CONTENT = Math.round(CANVAS * 0.66); // 675px — safe zone

async function run() {
  // Find bounding box of non-transparent content
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  console.log(`Content bbox: ${contentW}x${contentH} at (${minX}, ${minY})`);

  // Crop to content
  const cropped = await sharp(SOURCE)
    .ensureAlpha()
    .extract({ left: minX, top: minY, width: contentW, height: contentH })
    .toBuffer();

  // Scale so largest dimension fits in safe zone
  const scale = Math.min(MAX_CONTENT / contentW, MAX_CONTENT / contentH);
  const scaledW = Math.round(contentW * scale);
  const scaledH = Math.round(contentH * scale);
  console.log(`Scaled: ${scaledW}x${scaledH} (${Math.round(scale * 100)}% of original content)`);

  const resized = await sharp(cropped)
    .resize(scaledW, scaledH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  const left = Math.round((CANVAS - scaledW) / 2);
  const top  = Math.round((CANVAS - scaledH) / 2);
  console.log(`Placing at (${left}, ${top}) on ${CANVAS}x${CANVAS} canvas`);

  // 1. android-icon-monochrome.png — 1024x1024
  await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(MONOCHROME_OUT);

  // 2. notification-icon.png — 96x96 (proporções preservadas)
  const NOTIF = 96;
  const notifScale = NOTIF / CANVAS;
  const notifW = Math.round(scaledW * notifScale);
  const notifH = Math.round(scaledH * notifScale);
  const notifLeft = Math.round((NOTIF - notifW) / 2);
  const notifTop  = Math.round((NOTIF - notifH) / 2);

  const resizedNotif = await sharp(cropped)
    .resize(notifW, notifH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  await sharp({
    create: { width: NOTIF, height: NOTIF, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resizedNotif, left: notifLeft, top: notifTop }])
    .png({ compressionLevel: 9 })
    .toFile(NOTIFICATION_OUT);

  // Verify
  const m1 = await sharp(MONOCHROME_OUT).metadata();
  const m2 = await sharp(NOTIFICATION_OUT).metadata();
  console.log(`\nmonochrome: ${m1.width}x${m1.height}, hasAlpha: ${m1.hasAlpha}`);
  console.log(`notification: ${m2.width}x${m2.height}, hasAlpha: ${m2.hasAlpha}`);
  console.log(`Logo ocupa ${Math.round(scaledW/CANVAS*100)}% largura / ${Math.round(scaledH/CANVAS*100)}% altura no canvas`);
}

run().catch(err => { console.error(err); process.exit(1); });
