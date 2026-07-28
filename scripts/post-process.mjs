// PHOTO-SPEC step 2 — normalize every generated image identically:
// center 1:1 crop, blacks toward #0A0B0F, saturation −8, identical vignette → 1024.webp + 512.webp
// Requires: npm i sharp (anywhere on NODE_PATH) — or run via the scratchpad install.
import { readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const IN = join(ROOT, 'assets', 'items');
const vignette = size => Buffer.from(`<svg width="${size}" height="${size}">
  <radialGradient id="v" cx=".5" cy=".48" r=".75">
    <stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05060A" stop-opacity=".38"/>
  </radialGradient><rect width="${size}" height="${size}" fill="url(#v)"/></svg>`);

for (const f of readdirSync(IN).filter(f => f.endsWith('.png'))) {
  const slug = f.replace('.png', '');
  const base = sharp(join(IN, f)).resize(1024, 1024, { fit: 'cover' })
    .modulate({ saturation: 0.92 })
    .linear(0.97, 0)                    // pull blacks down toward the app ground
    .composite([{ input: vignette(1024) }]);
  await base.clone().webp({ quality: 82 }).toFile(join(IN, slug + '.1024.webp'));
  await sharp(await base.clone().webp({ quality: 82 }).toBuffer()).resize(512, 512).webp({ quality: 80 }).toFile(join(IN, slug + '.512.webp'));
  console.log('processed', slug);
}
console.log('DONE — next: node scripts/contact-sheet.mjs');
