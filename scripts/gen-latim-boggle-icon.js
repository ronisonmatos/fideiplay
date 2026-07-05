// dev-only: gera um ícone placeholder para o jogo "latim-boggle" (arte final ainda pendente)
const sharp = require('sharp');
const path = require('path');

const SIZE = 128;
const BG = '#3B2E7A';
const BORDER = '#26215C';
const GOLD = '#EF9F27';
const TILE = '#F2F0FC';
const TILE_ACTIVE = '#EF9F27';
const TEXT_DARK = '#1a1a2e';

const tiles = [
  { x: 20, y: 20, letter: 'P', active: true },
  { x: 52, y: 20, letter: 'A', active: false },
  { x: 84, y: 20, letter: 'X', active: false },
  { x: 20, y: 52, letter: 'D', active: false },
  { x: 52, y: 52, letter: 'E', active: true },
  { x: 84, y: 52, letter: 'V', active: false },
  { x: 20, y: 84, letter: 'M', active: false },
  { x: 52, y: 84, letter: 'S', active: false },
  { x: 84, y: 84, letter: 'X', active: true },
];

const tileSize = 24;

const tileEls = tiles.map(t => `
  <rect x="${t.x}" y="${t.y}" width="${tileSize}" height="${tileSize}" rx="6"
    fill="${t.active ? TILE_ACTIVE : TILE}" stroke="${BORDER}" stroke-width="2" />
  <text x="${t.x + tileSize / 2}" y="${t.y + tileSize / 2 + 7}" font-family="Arial, sans-serif"
    font-weight="800" font-size="16" text-anchor="middle" fill="${TEXT_DARK}">${t.letter}</text>
`).join('\n');

const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="${BG}" stroke="${BORDER}" stroke-width="4" />
  <path d="M 32 32 L 64 64 L 108 108" stroke="${GOLD}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85" />
  ${tileEls}
</svg>
`;

const outPath = path.join(__dirname, '..', 'assets', 'images', 'latim_boggle.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(outPath)
  .then(() => console.log('Ícone gerado em', outPath))
  .catch(err => { console.error(err); process.exit(1); });
