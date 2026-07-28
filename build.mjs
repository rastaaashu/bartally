// Assemble src/ modules into a single self-contained index.html (+ docs/ copy for GitHub Pages).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const src = p => readFileSync(join(ROOT, 'src', p), 'utf8');
const files = readdirSync(join(ROOT, 'src')).sort();

const cssFiles = files.filter(f => f.endsWith('.css'));
const jsFiles = files.filter(f => f.endsWith('.js'));
let css = cssFiles.map(f => `/* == ${f} == */\n` + src(f)).join('\n');
let js = jsFiles.map(f => `/* == ${f} == */\n` + src(f)).join('\n');

if (js.includes('</scr' + 'ipt>')) { console.error('FATAL: literal </scr' + 'ipt> found in JS modules'); process.exit(1); }

const html = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0A0B0F">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="BarTally — inventaire de bar premium. Comptage quotidien, ventes en 2 gestes, écarts détectés.">
<title>BarTally — Inventaire de bar</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>
${css}
</style>
<div id="app" lang="fr"></div>
<script>
${js}
</script>
`;

writeFileSync(join(ROOT, 'index.html'), '<!doctype html>\n<html lang="fr">\n' + html + '</html>\n');
// docs/ = GitHub Pages root
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'index.html'), '<!doctype html>\n<html lang="fr">\n' + html + '</html>\n');
for (const f of ['manifest.webmanifest', 'sw.js']) {
  const p = join(ROOT, 'pwa', f);
  if (existsSync(p)) copyFileSync(p, join(ROOT, 'docs', f));
}
if (existsSync(join(ROOT, 'pwa', 'icons'))) {
  mkdirSync(join(ROOT, 'docs', 'icons'), { recursive: true });
  for (const f of readdirSync(join(ROOT, 'pwa', 'icons'))) copyFileSync(join(ROOT, 'pwa', 'icons', f), join(ROOT, 'docs', 'icons', f));
}
// artifact variant: no manifest/sw links (self-contained single file)
const artifact = html.replace(/<link rel="manifest"[^>]*>\n/, '').replace(/<link rel="icon"[^>]*>\n/, '').replace(/<link rel="apple-touch-icon"[^>]*>\n/, '');
writeFileSync(join(ROOT, 'artifact.html'), artifact);
console.log('BUILT index.html (' + Math.round((css.length + js.length) / 1024) + 'KB src) → docs/ + artifact.html');
