const sharp = require('sharp');
const path = require('path');

const FOREGROUND = path.join(__dirname, '../assets/images/android-icon-foreground.png');
const MONOCHROME_OUT = path.join(__dirname, '../assets/images/android-icon-monochrome.png');
const NOTIFICATION_OUT = path.join(__dirname, '../assets/images/notification-icon.png');

// Replace every non-transparent pixel with solid white, preserving alpha
async function toWhiteSilhouette(inputFile) {
  const { data, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] > 0) {
      data[i]     = 255; // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      // alpha kept as-is
    }
  }

  return { data, width, height };
}

async function run() {
  const { data, width, height } = await toWhiteSilhouette(FOREGROUND);
  console.log(`Silhouette gerada: ${width}x${height}`);

  // 1. android-icon-monochrome.png — 1024x1024
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(MONOCHROME_OUT);

  const monoMeta = await sharp(MONOCHROME_OUT).metadata();
  console.log(`monochrome: ${monoMeta.width}x${monoMeta.height}, hasAlpha: ${monoMeta.hasAlpha}`);

  // 2. notification-icon.png — 96x96
  // The foreground already has the logo at 66% with safe margins.
  // Resizing to 96x96 preserves those proportions.
  await sharp(data, { raw: { width, height, channels: 4 } })
    .resize(96, 96, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(NOTIFICATION_OUT);

  const notifMeta = await sharp(NOTIFICATION_OUT).metadata();
  console.log(`notification: ${notifMeta.width}x${notifMeta.height}, hasAlpha: ${notifMeta.hasAlpha}`);

  console.log('\nPronto!');
}

run().catch(err => { console.error(err); process.exit(1); });
