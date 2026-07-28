// PHOTO-SPEC step 3 — contact-sheet.html: every image at tile size, on the app background.
// Open it, screenshot it, run the uniformity QA from PHOTO-SPEC §4 before wiring anything.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const IN = join(ROOT, 'assets', 'items');
const files = readdirSync(IN).filter(f => f.endsWith('.512.webp'));
const cells = files.map(f => `
  <div class="cell">
    <div class="tile"><img src="assets/items/${f}"><span class="scrim"></span></div>
    <div class="cap">${f.replace('.512.webp', '')}</div>
  </div>`).join('');
writeFileSync(join(ROOT, 'contact-sheet.html'), `<!doctype html><meta charset="utf-8">
<title>BarTally — contact sheet</title>
<style>
body{background:#0A0B0F;color:#9BA0AB;font:12px Inter,system-ui;padding:32px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:16px;max-width:1200px;margin:0 auto}
.cell{display:flex;flex-direction:column;gap:6px;align-items:center}
.tile{position:relative;width:100%;aspect-ratio:1;background:#12141A;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden}
.tile img{width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,11,15,0) 45%,rgba(10,11,15,.85))}
.cap{font-size:11px}
</style><div class="grid">${cells}</div>`);
console.log(`contact-sheet.html — ${files.length} tiles. Open, screenshot, QA per PHOTO-SPEC §4.`);
