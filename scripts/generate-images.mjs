// PHOTO-SPEC pipeline, step 1 — generate the uniform luxury catalog (38 images).
// Usage: set GEMINI_API_KEY or OPENAI_API_KEY in .env (or env), optionally IMAGE_PROVIDER=gemini|openai,
// then: node scripts/generate-images.mjs
// Output: assets/items/<slug>.png  (1024×1024+). Re-run only regenerates missing slugs unless --force.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT = join(ROOT, 'assets', 'items');
mkdirSync(OUT, { recursive: true });

// .env loader (no deps)
try {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const BASE = 'Professional luxury product photograph, high-end commercial catalog style. Single subject, centered, occupying about 70% of frame height. Seamless matte charcoal-black studio backdrop, subtle darker vignette at edges. Soft diffused key light from the upper left, gentle warm golden rim light from behind right, soft natural reflection on the dark polished surface below. 85mm lens look, f/8, tack sharp. Moody, warm, premium after-hours bar ambiance, colors graded toward deep charcoal and amber. Square 1:1 composition. No text, no letters, no logos, no labels with writing, no watermark, no people, no hands, no extra props, no clutter.';
const BOTTLE = s => `A single ${s} standing upright, label area plain dark and completely unbranded, cap intact, glass catching the rim light. ${BASE}`;
const CAN = s => `A single ${s}, brushed matte metal, completely unbranded, standing upright. ${BASE}`;
const FOOD = s => `Directly overhead top-down shot of ${s} on a dark ceramic plate set on black slate, restaurant fine-dining plating, minimal fresh garnish, subtle steam. ${BASE}`;

const RED = 'dark green bordeaux-shape wine bottle of deep red wine, plain dark unbranded label area';
const WHITE = 'pale green bordeaux-shape bottle of golden white wine, plain dark unbranded label area';
const ROSE = 'clear glass bottle of pale pink rosé wine, plain dark unbranded label area';

export const ITEMS = {
  special: BOTTLE('amber golden lager in a green glass longneck bottle'),
  'special-gold': BOTTLE('golden strong lager in an amber-gold tinted longneck bottle'),
  heineken: BOTTLE('pale lager in an emerald green longneck bottle'),
  casablanca: BOTTLE('amber lager in a brown glass longneck bottle'),
  budweiser: BOTTLE('light lager in a brown longneck bottle with a subtle red-brown tone'),
  'smirnoff-ice': BOTTLE('citrus alcopop in a clear glass bottle, pale frosted liquid'),
  'red-bull': CAN('slim tall energy drink can, cool silver-blue metal'),
  soda: CAN('classic soda can, dark matte metal'),
  ithaque: BOTTLE(RED), eclipse: BOTTLE(RED), volubilia: BOTTLE(RED), medaillon: BOTTLE(RED),
  sahari: BOTTLE(RED), 'terre-rouge': BOTTLE(RED), 'terroir-rouge': BOTTLE(RED), ferrande: BOTTLE(RED),
  odyssee: BOTTLE(WHITE), 'medaillon-blanc': BOTTLE(WHITE), 'terroir-blanc': BOTTLE(WHITE),
  'medaillon-rose': BOTTLE(ROSE), 'terroir-rose': BOTTLE(ROSE),
  champagne: BOTTLE('champagne bottle in dark green glass with gold foil neck, unbranded'),
  'black-label': BOTTLE('square-shouldered blended scotch whisky bottle, deep amber liquid, black cap'),
  'red-label': BOTTLE('square-shouldered blended scotch whisky bottle, amber liquid, dark red cap'),
  absolut: BOTTLE('clear cylindrical premium vodka bottle, silver cap'),
  'jack-daniels': BOTTLE('square dark glass Tennessee-style whiskey bottle, black cap'),
  belvedere: BOTTLE('tall frosted-white premium vodka bottle'),
  gordons: BOTTLE('green glass London dry gin bottle'),
  ricard: BOTTLE('tall bottle of golden-yellow anise pastis'),
  agavita: BOTTLE('clear tequila-style bottle, pale gold liquid, silver cap'),
  jagermeister: BOTTLE('squat dark green herbal liqueur bottle'),
  cognac: BOTTLE('elegant curved cognac bottle, deep amber liquid, wood-tone cap'),
  'martini-blanc': BOTTLE('tall vermouth bottle, pale golden liquid'),
  fromage: FOOD('artisan cheese selection with figs and walnuts on a dark slate board'),
  'viande-hachee': FOOD('grilled kefta minced-meat patties with charred tomato and herbs'),
  foie: FOOD('pan-seared liver with caramelized onions and parsley'),
  cervelle: FOOD("traditional cervelle m'chermla simmered in spiced tomato sauce in a dark tagine dish, cilantro garnish"),
  pizza: FOOD('rustic wood-fired pizza, whole, bubbling cheese and fresh basil'),
};

const provider = process.env.IMAGE_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : null);
if (!provider) {
  console.error('No image API key found. Add GEMINI_API_KEY or OPENAI_API_KEY to .env, then re-run.');
  console.error('Manual fallback: paste each prompt below into any image generator (one sitting, one tool), save as assets/items/<slug>.png:\n');
  for (const [slug, prompt] of Object.entries(ITEMS)) console.log(`--- ${slug}.png ---\n${prompt}\n`);
  process.exit(1);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function genGemini(prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }),
  });
  if (!r.ok) throw new Error('gemini ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error('gemini: no image in response');
  return Buffer.from(part.inlineData.data, 'base64');
}
async function genOpenAI(prompt) {
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', quality: 'high', n: 1 }),
  });
  if (!r.ok) throw new Error('openai ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  return Buffer.from(j.data[0].b64_json, 'base64');
}

const force = process.argv.includes('--force');
let made = 0, skipped = 0, failed = [];
for (const [slug, prompt] of Object.entries(ITEMS)) {
  const file = join(OUT, slug + '.png');
  if (existsSync(file) && !force) { skipped++; continue; }
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const buf = await (provider === 'gemini' ? genGemini(prompt) : genOpenAI(prompt));
      writeFileSync(file, buf); made++; ok = true;
      console.log('generated', slug, `(${(buf.length / 1024).toFixed(0)}KB)`);
    } catch (e) {
      console.log(`retry ${attempt} ${slug}: ${e.message}`);
      await sleep(3000 * attempt);
    }
  }
  if (!ok) failed.push(slug);
  await sleep(1500); // rate-limit respect
}
console.log(`DONE — ${made} generated, ${skipped} existing, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`);
console.log('Next: node scripts/post-process.mjs && node scripts/contact-sheet.mjs');
