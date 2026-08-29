import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('./public/icons', { recursive: true });

const svgPath = './scripts/icon.svg';
const sizes = [
  { size: 192, out: './public/icons/icon-192.png' },
  { size: 512, out: './public/icons/icon-512.png' },
  { size: 180, out: './public/icons/apple-touch-icon.png' },
  { size: 32, out: './public/icons/favicon-32.png' },
];

for (const { size, out } of sizes) {
  await sharp(svgPath).resize(size, size).png().toFile(out);
  console.log('wrote', out);
}

// maskable icon: same art but with extra safe-zone padding (icon content within ~80% of canvas)
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
})
  .composite([{ input: await sharp(svgPath).resize(410, 410).toBuffer(), left: 51, top: 51 }])
  .png()
  .toFile('./public/icons/icon-512-maskable.png');
console.log('wrote maskable icon');
