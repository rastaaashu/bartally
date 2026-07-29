// Scheduled low-stock alerter. Reads the shared data, recomputes stock with the
// same rules as the app, and pushes one notification per item per business day.
import webpush from 'web-push';

const { SUPABASE_URL, SUPABASE_KEY, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY || !VAPID_PRIVATE) { console.error('missing env'); process.exit(1); }
webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:alerts@kalinka.app', VAPID_PUBLIC, VAPID_PRIVATE);

const api = async (path, opts = {}) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} ${r.status} ${text.slice(0, 160)}`);
  return text ? JSON.parse(text) : null;   // inserts answer with an empty body
};
const rows = async t => (await api(`${t}?select=*`)).map(r => r.data ?? r);

/* ---- same stock rules as the app: baseline count + deliveries − sales − waste ---- */
const pad = n => String(n).padStart(2, '0');
function businessDate(cutoff) {
  const d = new Date();
  if (d.getUTCHours() < cutoff) d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function baseline(counts, bd) {
  let best = null;
  for (const c of counts) {
    if (c.status !== 'closed' || c.bd > bd) continue;
    if (!best || c.bd > best.bd) best = c;
  }
  return best;
}
function sumSince(entries, itemId, base, bd, { skipVoided = true, cutIso = null } = {}) {
  let s = 0;
  const cut = cutIso || base?.closedAt || null;
  for (const e of entries) {
    if (e.itemId !== itemId) continue;
    if (skipVoided && e.voidedAt) continue;
    if (e.bd > bd) continue;
    if (base) {
      if (e.bd < base.bd) continue;
      if (e.bd === base.bd && !(cut && e.at > cut)) continue;
    }
    s += e.qty;
  }
  return Math.round(s * 100) / 100;
}
function expected(st, itemId, bd) {
  const base = baseline(st.counts, bd);
  let start = 0, cutIso = null;
  if (base) {
    const line = base.lines.find(l => l.itemId === itemId);
    if (line) { start = line.counted; cutIso = line.at || null; }
  }
  const r = sumSince(st.restocks, itemId, base, bd, { skipVoided: false, cutIso });
  const s = sumSince(st.sales, itemId, base, bd, { cutIso });
  const w = sumSince(st.waste, itemId, base, bd, { skipVoided: false, cutIso });
  return Math.round((start + r - s - w) * 100) / 100;
}

const [items, sales, restocks, waste, counts, settingsRows, subsRaw, logRaw] = await Promise.all(
  ['items', 'sales', 'restocks', 'waste', 'counts', 'kv_settings', 'push_subs', 'push_log'].map(rows));

if (!items.length) { console.log('no catalog yet — nothing to do'); process.exit(0); }
const settings = settingsRows[0] || {};
const barName = settings.barName || 'Kalinka';
const cutoff = Number.isFinite(settings.dayCutoffHour) ? settings.dayCutoffHour : (settings.cutoffHour ?? 6);
const bd = businessDate(cutoff);
const st = { sales, restocks, waste, counts };

const unitShort = { bouteille: 'bout.', canette: 'can.', portion: 'port.', verre: 'verre' };
const low = [];
for (const it of items) {
  if (!it.active) continue;
  const stock = expected(st, it.id, bd);
  if (stock <= it.threshold) low.push({ it, stock });
}
console.log(`business day ${bd}: ${low.length} item(s) at or below threshold`);
if (!low.length) process.exit(0);

// one alert per item per business day
const already = new Set((await api('push_log?select=id')).map(r => r.id));
const fresh = low.filter(({ it }) => !already.has(`${bd}:${it.id}`));
if (!fresh.length) { console.log('all already alerted today'); process.exit(0); }

const subs = (await api('push_subs?select=*')).filter(s => s.owner !== false || true);
if (!subs.length) { console.log('no push subscriptions registered'); process.exit(0); }

fresh.sort((a, b) => (a.stock - a.it.threshold) - (b.stock - b.it.threshold));
const head = fresh[0];
const body = fresh.length === 1
  ? `Stock bas : ${head.it.name} (${head.stock} ${unitShort[head.it.unit] || head.it.unit})`
  : `Stock bas : ${head.it.name} (${head.stock}) et ${fresh.length - 1} autre(s) article(s)`;

let sent = 0, gone = [];
for (const row of subs) {
  try {
    await webpush.sendNotification(row.data, JSON.stringify({ title: barName, body, tag: 'low-stock', url: './' }));
    sent++;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) gone.push(row.id);
    else console.warn('push failed', row.id, e.statusCode, String(e.body || e.message).slice(0, 120));
  }
}
console.log(`pushed to ${sent}/${subs.length} device(s)${gone.length ? `, ${gone.length} expired` : ''}`);

await api('push_log', {
  method: 'POST',
  headers: { prefer: 'resolution=ignore-duplicates,return=minimal' },
  body: JSON.stringify(fresh.map(({ it }) => ({ id: `${bd}:${it.id}` }))),
});
console.log('logged', fresh.map(f => f.it.name).join(', '));
