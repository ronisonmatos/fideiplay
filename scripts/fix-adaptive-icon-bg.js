const sharp = require('sharp');
const path = require('path');

const OUTPUT = path.join(__dirname, '../assets/images/android-icon-background.png');

sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 3,
    background: { r: 0x26, g: 0x21, b: 0x5C },
  },
})
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT)
  .then(() => {
    console.log('Background gerado: 1024x1024 sólido #26215C');
    return sharp(OUTPUT).metadata();
  })
  .then((m) => {
    console.log(`Verificação: ${m.width}x${m.height}, hasAlpha: ${m.hasAlpha}, format: ${m.format}`);
  })
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
