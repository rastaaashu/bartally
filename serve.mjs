// Tiny static server for local testing: node serve.mjs [port] [dir]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const port = Number(process.argv[2] || 8765);
const dir = process.argv[3] || 'docs';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.svg': 'image/svg+xml' };
createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(dir, p);
  if (existsSync(f) && statSync(f).isFile()) {
    res.writeHead(200, { 'content-type': mime[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(f));
  } else { res.writeHead(404); res.end('not found'); }
}).listen(port, () => console.log(`serving ${dir} on http://localhost:${port}/`));
