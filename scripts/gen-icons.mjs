// Generuje wszystkie ikony aplikacji (web/PWA + natywne Android/iOS) z jednego źródła
// prawdy zdefiniowanego niżej jako SVG. Uruchom po każdej zmianie wyglądu ikony:
//   node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const MARK_DEFS = `
  <radialGradient id="orb" cx="40%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#6ee7c9" />
    <stop offset="55%" stop-color="#34b895" stop-opacity="0.85" />
    <stop offset="100%" stop-color="#a78bfa" stop-opacity="0" />
  </radialGradient>`;

const MARK_SHAPES = `
  <circle cx="256" cy="256" r="188" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="10" />
  <circle cx="256" cy="256" r="150" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="10" />
  <circle cx="256" cy="256" r="112" fill="url(#orb)" />`;

const BG_DEF = `
  <radialGradient id="bg" cx="35%" cy="30%" r="80%">
    <stop offset="0%" stop-color="#1b2740" />
    <stop offset="55%" stop-color="#0f172a" />
    <stop offset="100%" stop-color="#060a14" />
  </radialGradient>`;

const svg = (defs, body) =>
  `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;

// "mark" = sama iskra na przezroczystym tle (warstwa foreground adaptacyjnej ikony Androida,
// zawartość ikony maskowalnej). "fullRounded" = tło z zaokrąglonymi rogami — wygląd używany na
// weowych ikonach/favicon (tam nikt automatycznie nie maskuje ikony). "fullSquare" = to samo, ale
// pełny kwadrat bez zaokrąglenia — dla natywnego Androida/iOS, gdzie system SAM dokłada własną
// maskę (koło/"squircle"/zaokrąglony kwadrat); pre-zaokrąglony róg dawałby tam podwójne, krzywe
// zaokrąglenie.
const markSvg = svg(MARK_DEFS, MARK_SHAPES);
const fullSvgRounded = svg(BG_DEF + MARK_DEFS, `<rect width="512" height="512" rx="112" fill="url(#bg)" />${MARK_SHAPES}`);
const fullSvgSquare = svg(BG_DEF + MARK_DEFS, `<rect width="512" height="512" fill="url(#bg)" />${MARK_SHAPES}`);
const bgOnlySvg = svg(BG_DEF, `<rect width="512" height="512" fill="url(#bg)" />`);

mkdirSync('./public/icons', { recursive: true });
writeFileSync('./scripts/icon.svg', fullSvgRounded); // podgląd do otwarcia w przeglądarce/edytorze

/** Rasteryzuje SVG bezpośrednio w docelowej rozdzielczości (przez `density`), zamiast renderować
 * raz i pomniejszać bitmapowo — to właśnie ten drugi sposób dawał widoczną pikselozę/aliasing
 * przy małych rozmiarach (favicon 32px, ikony Androida). */
async function renderSquare(svgString, size) {
  const density = 72 * (size / 512);
  return sharp(Buffer.from(svgString), { density }).resize(size, size).png().toBuffer();
}

/** Renderuje samą "iskrę" wyśrodkowaną w bezpiecznej strefie (domyślnie 66% szerokości płótna),
 * żeby przetrwać dowolny kształt maski systemowej (koło, "squircle", zaokrąglony kwadrat...). */
async function markOnTransparent(canvasSize, contentScale = 0.66) {
  const contentSize = Math.round(canvasSize * contentScale);
  const content = await renderSquare(markSvg, contentSize);
  const offset = Math.round((canvasSize - contentSize) / 2);
  return sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: content, left: offset, top: offset }])
    .png()
    .toBuffer();
}

// --- Web / PWA ---
const webSizes = [
  { size: 192, out: './public/icons/icon-192.png' },
  { size: 512, out: './public/icons/icon-512.png' },
  { size: 180, out: './public/icons/apple-touch-icon.png' },
  { size: 32, out: './public/icons/favicon-32.png' },
];
for (const { size, out } of webSizes) {
  writeFileSync(out, await renderSquare(fullSvgRounded, size));
  console.log('wrote', out);
}

{
  const bg = await renderSquare(bgOnlySvg, 512);
  const mark = await markOnTransparent(512);
  await sharp(bg).composite([{ input: mark }]).png().toFile('./public/icons/icon-512-maskable.png');
  console.log('wrote maskable icon');
}

// --- Android: adaptacyjna ikona (API 26+, realnie widziana przez ogromną większość urządzeń)
// + "legacy" pełna ikona jako fallback dla starszych launcherów. ---
const androidResDir = './android/app/src/main/res';
if (existsSync(androidResDir)) {
  const densities = [
    { name: 'mdpi', legacy: 48, fg: 108 },
    { name: 'hdpi', legacy: 72, fg: 162 },
    { name: 'xhdpi', legacy: 96, fg: 216 },
    { name: 'xxhdpi', legacy: 144, fg: 324 },
    { name: 'xxxhdpi', legacy: 192, fg: 432 },
  ];
  for (const { name, legacy, fg } of densities) {
    const dir = `${androidResDir}/mipmap-${name}`;
    const legacyPng = await renderSquare(fullSvgSquare, legacy);
    writeFileSync(`${dir}/ic_launcher.png`, legacyPng);
    writeFileSync(`${dir}/ic_launcher_round.png`, legacyPng);
    writeFileSync(`${dir}/ic_launcher_foreground.png`, await markOnTransparent(fg));
    console.log('wrote android icons for', name);
  }
  writeFileSync(
    `${androidResDir}/values/ic_launcher_background.xml`,
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0f172a</color>\n</resources>\n',
  );
  console.log('updated ic_launcher_background color');
}

// --- iOS: jedna uniwersalna ikona 1024x1024 — system sam dokłada zaokrąglenie/maskę,
// dlatego renderujemy pełny kwadrat bez przezroczystości. ---
const iosIconDir = './ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (existsSync(iosIconDir)) {
  writeFileSync(`${iosIconDir}/AppIcon-512@2x.png`, await renderSquare(fullSvgSquare, 1024));
  console.log('wrote iOS app icon');
}
