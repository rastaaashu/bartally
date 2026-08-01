/* ============ Live sync layer — Supabase, single-site, offline-tolerant.
   Design: jsonb-document tables mirroring the local store's arrays, id-keyed,
   last-write-wins on updated_at. Local store stays the source of truth for the
   UI; this layer pushes an outbox and merges remote rows (pull + realtime).
   Sync is OFF until SYNC_CONFIG is filled — the app then works device-local. ============ */
const Sync = (() => {
  const TABLES = ['categories', 'items', 'employees', 'sales', 'restocks', 'waste', 'counts'];
  const OUTBOX_KEY = 'kalinka.outbox.v1';
  let client = null, started = false, flushing = false, timer = null;

  const enabled = () => typeof SYNC_CONFIG !== 'undefined' && SYNC_CONFIG.url && SYNC_CONFIG.anon && typeof supabase !== 'undefined';
  // a device can switch to demo AFTER sync booted (demo button on the login screen):
  // every sync path re-checks, so a demo bar never pushes to — or absorbs — the live site
  const demo = () => !!Store.state.settings.demoMode;
  const PURGED = (table, d) => ['sales', 'restocks', 'waste', 'counts'].includes(table) && d && d.bd && d.bd < Heal.PURGE_BD;

  /* ---------- outbox (persisted; survives offline) ---------- */
  function loadBox() { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; } catch (e) { return []; } }
  function saveBox(b) { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(b.slice(-500))); } catch (e) {} }
  function enqueue(table, id) {
    if (demo()) return;
    const box = loadBox();
    if (!box.some(x => x.t === table && x.id === id)) box.push({ t: table, id });
    saveBox(box);
    scheduleFlush();
  }
  function enqueueSettings() { enqueue('kv_settings', '1'); }

  function rowOf(table, id) {
    const st = Store.state;
    if (table === 'kv_settings') return { id: 1, data: st.settings, updated_at: new Date().toISOString() };
    const arr = st[table]; if (!arr) return null;
    const item = arr.find(x => x.id === id);
    if (item && PURGED(table, item)) return null; // purged test rows never travel again
    return item ? { id, data: item, updated_at: new Date().toISOString() } : null;
  }

  function scheduleFlush() { clearTimeout(timer); timer = setTimeout(flush, 400); }
  async function flush() {
    if (!client || flushing || demo()) return;
    const box = loadBox();
    if (!box.length) return;
    flushing = true;
    try {
      const remaining = [];
      // group per table for batched upserts
      const byTable = {};
      for (const e of box) (byTable[e.t] = byTable[e.t] || []).push(e);
      for (const [table, entries] of Object.entries(byTable)) {
        const rows = entries.map(e => rowOf(table, e.id)).filter(Boolean);
        if (!rows.length) continue;
        const { error } = await client.from(table).upsert(rows, { onConflict: 'id' });
        if (error) { remaining.push(...entries); console.warn('sync push', table, error.message); }
      }
      saveBox(remaining);
    } finally {
      flushing = false;
      if (loadBox().length) setTimeout(flush, 5000); // retry later
    }
  }

  /* ---------- merge remote → local ---------- */
  function mergeRow(table, row) {
    if (!row) return false;
    if (demo()) return false;
    if (PURGED(table, row.data)) return false;
    const st = Store.state;
    if (table === 'kv_settings') {
      if (!row.data || row.data.siteId !== SITE_ID) return false; // other site / legacy unstamped row
      // language and the site stamp stay per-device
      const keep = { lang: st.settings.lang, siteId: st.settings.siteId };
      const localTs = st.settings._syncTs || '';
      if ((row.updated_at || '') <= localTs) return false;
      Object.assign(st.settings, row.data, keep, { _syncTs: row.updated_at });
      return true;
    }
    const arr = st[table]; if (!arr) return false;
    const data = { ...row.data, _syncTs: row.updated_at };
    const i = arr.findIndex(x => x.id === data.id);
    if (i === -1) {
      // logs render newest-first from the front; counts/items order handled by their sorters
      arr.unshift(data);
      return true;
    }
    const localTs = arr[i]._syncTs || '';
    if ((row.updated_at || '') <= localTs && !loadBox().some(x => x.id === data.id)) {
      // remote not newer — but keep local if it has pending outbox changes
      return false;
    }
    // pending local change wins until flushed
    if (loadBox().some(x => x.id === data.id)) return false;
    arr[i] = data;
    return true;
  }

  let refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; Store._heal(); Store.persistNow(); UI.refresh(); });
  }

  /* ---------- initial pull + reconcile ---------- */
  async function initialSync() {
    // 1. pull everything remote
    let changed = false;
    for (const table of [...TABLES, 'kv_settings']) {
      const { data, error } = await client.from(table).select('*');
      if (error) { console.warn('sync pull', table, error.message); continue; }
      for (const row of (data || [])) changed = mergeRow(table, row) || changed;
      // 2. push local rows the server doesn't have (first device migrates its data up)
      if (table !== 'kv_settings') {
        const remoteIds = new Set((data || []).map(r => String(r.id)));
        // identity guard: a same-name row already on the server IS this row under
        // another id — pushing it up is what kept duplicating staff on every stale device
        const idKey = table === 'employees' ? (d => Heal.normName(d?.name))
          : table === 'items' ? (d => d && `${Heal.normName(d.name)}|${d.bottleMl ?? ''}|${d.catId}`)
          : null;
        const remoteKeys = idKey ? new Set((data || []).map(r => idKey(r.data)).filter(Boolean)) : null;
        for (const item of Store.state[table] || []) {
          if (remoteIds.has(String(item.id))) continue;
          if (remoteKeys && remoteKeys.has(idKey(item))) continue;
          enqueue(table, item.id);
        }
      }
    }
    enqueueSettings();
    const healed = Store._heal(); // merged rows may need dedupe/purge before anyone sees them
    if (changed || healed) queueRefresh();
  }

  /* ---------- realtime ---------- */
  function subscribe() {
    const ch = client.channel('kalinka-sync');
    for (const table of [...TABLES, 'kv_settings']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        if (mergeRow(table, payload.new)) queueRefresh();
      });
    }
    ch.subscribe(status => { if (status === 'SUBSCRIBED') flush(); });
  }

  /* ---------- hook the store's mutators ---------- */
  function hook() {
    const wrap = (name, fn) => { const orig = Store[name].bind(Store); Store[name] = (...a) => fn(orig, ...a); };
    wrap('logSale', (o, ...a) => { const e = o(...a); if (e) enqueue('sales', e.id); return e; });
    wrap('logRestock', (o, ...a) => { const e = o(...a); if (e) enqueue('restocks', e.id); return e; });
    wrap('logWaste', (o, ...a) => { const e = o(...a); if (e) enqueue('waste', e.id); return e; });
    wrap('undoSale', (o, id) => { const r = o(id); if (r) enqueue('sales', id); return r; });
    wrap('voidSale', (o, id) => { const r = o(id); if (r) enqueue('sales', id); return r; });
    wrap('openCount', (o, ...a) => { const c = o(...a); if (c) enqueue('counts', c.id); return c; });
    wrap('setCountLine', (o, cid, ...a) => { const r = o(cid, ...a); enqueue('counts', cid); return r; });
    wrap('setCountNote', (o, cid, ...a) => { const r = o(cid, ...a); enqueue('counts', cid); return r; });
    wrap('closeCount', (o, cid) => { const c = o(cid); if (c) enqueue('counts', cid); return c; });
    wrap('reopenCount', (o, cid) => { const r = o(cid); if (r) enqueue('counts', cid); return r; });
    wrap('saveItem', (o, ...a) => { const it = o(...a); if (it) enqueue('items', it.id); return it; });
    wrap('attachCode', (o, ...a) => { const it = o(...a); if (it) enqueue('items', it.id); return it; });
    wrap('removeCode', (o, ...a) => { const it = o(...a); if (it) enqueue('items', it.id); return it; });
    wrap('setEmployeeActive', (o, id, ...a) => { const r = o(id, ...a); enqueue('employees', id); return r; });
    const wrapAsync = (name, after) => { const orig = Store[name].bind(Store); Store[name] = async (...a) => { const r = await orig(...a); after(r, ...a); return r; }; };
    wrapAsync('addEmployee', emp => { if (emp) enqueue('employees', emp.id); });
    wrapAsync('setEmployeePin', (r, id) => enqueue('employees', id));
    wrapAsync('setOwnerPin', () => enqueueSettings());
    wrap('setSettings', (o, patch) => { const r = o(patch); if (!patch || !('lang' in patch) || Object.keys(patch).length > 1) enqueueSettings(); return r; });
  }

  /* ---------- Web Push registration ----------
     Stores this phone's push subscription so the scheduled sender can reach it
     even when the app is closed. Owner devices get the stock alerts. */
  function urlB64ToU8(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }
  async function registerPush() {
    try {
      if (!client || !SYNC_CONFIG.vapid) return false;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription()
        || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToU8(SYNC_CONFIG.vapid) });
      const json = sub.toJSON();
      const id = json.endpoint.slice(-40);
      const { error } = await client.from('push_subs').upsert(
        [{ id, data: json, owner: Store.isOwner, updated_at: new Date().toISOString() }], { onConflict: 'id' });
      if (error) { console.warn('push sub', error.message); return false; }
      return true;
    } catch (e) { console.warn('push', e.message); return false; }
  }

  return {
    registerPush,
    start() {
      if (started || !enabled()) return;
      if (Store.state.settings.demoMode) return; // demo devices stay local-only, never pollute the site
      started = true;
      client = supabase.createClient(SYNC_CONFIG.url, SYNC_CONFIG.anon, { auth: { persistSession: false } });
      hook();
      // seed sync only once the site is set up (prod boot happens first)
      const go = () => { initialSync().then(subscribe).catch(e => console.warn('sync init', e)); };
      if (Store.state.settings.setupDone) go();
      else { const off = Store.on(w => { if (Store.state.settings.setupDone) { off(); go(); } }); }
      window.addEventListener('online', () => flush());
      // (re)register this phone for push whenever a session starts and on boot
      const tryPush = () => { registerPush(); };
      setTimeout(tryPush, 2500);
      Store.on(w => { if (w === 'session' && Store.state.session) setTimeout(tryPush, 800); });
    },
    get active() { return started; },
  };
})();
