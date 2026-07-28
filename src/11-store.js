/* ============ BarTally store — state, engine, seed, audit. No DOM, no i18n here. ============ */

/* ---------- pure engine (also exercised by node tests) ---------- */
const Engine = {
  pad(n) { return String(n).padStart(2, '0'); },
  /** business date 'YYYY-MM-DD' for a JS Date, given cutoff hour (sales at 01:30 belong to previous evening) */
  bdOf(date, cutoffHour) {
    const d = new Date(date.getTime());
    if (d.getHours() < cutoffHour) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  },
  addDays(bd, n) {
    const [y, m, d] = bd.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return `${dt.getFullYear()}-${this.pad(dt.getMonth() + 1)}-${this.pad(dt.getDate())}`;
  },
  /** latest CLOSED count with bd matching cmp relative to targetBd */
  baselineCount(counts, targetBd, { strictlyBefore = false } = {}) {
    let best = null;
    for (const c of counts) {
      if (c.status !== 'closed') continue;
      if (strictlyBefore ? c.bd >= targetBd : c.bd > targetBd) continue;
      if (!best || c.bd > best.bd) best = c;
    }
    return best;
  },
  sumSince(entries, itemId, base, targetBd, { skipVoided = true } = {}) {
    let s = 0;
    for (const e of entries) {
      if (e.itemId !== itemId) continue;
      if (skipVoided && e.voidedAt) continue;
      if (targetBd && e.bd > targetBd) continue;
      if (base) {
        if (e.bd < base.bd) continue;
        if (e.bd === base.bd && !(base.closedAt && e.at > base.closedAt)) continue;
      }
      s += e.qty;
    }
    return Math.round(s * 100) / 100;
  },
  /**
   * expected(item, targetBd) = counted at baseline + restocks − sales − waste since baseline, up to targetBd inclusive.
   * strictlyBefore=true → baseline is the previous day's count (used DURING a count of targetBd).
   */
  expected(state, itemId, targetBd, { strictlyBefore = false } = {}) {
    const base = this.baselineCount(state.counts, targetBd, { strictlyBefore });
    let start = 0;
    if (base) {
      const line = base.lines.find(l => l.itemId === itemId);
      if (line) start = line.counted;
      else start = 0; // item added after that count → entries since still apply
    }
    const r = this.sumSince(state.restocks, itemId, base, targetBd, { skipVoided: false });
    const s = this.sumSince(state.sales, itemId, base, targetBd);
    const w = this.sumSince(state.waste, itemId, base, targetBd, { skipVoided: false });
    return Math.round((start + r - s - w) * 100) / 100;
  },
  /** sales velocity: avg non-void units/day over last `days` business days ending yesterday-ish */
  velocity(state, itemId, todayBd, days = 14) {
    const from = this.addDays(todayBd, -days);
    let s = 0;
    for (const e of state.sales) {
      if (e.itemId !== itemId || e.voidedAt) continue;
      if (e.bd > todayBd || e.bd <= from) continue;
      s += e.qty;
    }
    return s / days;
  },
  daysUntilStockout(stock, vel) { return vel > 0.01 ? Math.floor(stock / vel) : null; },
  /** cumulative unexplained loss series from closed counts (negative variances only, flipped positive) */
  shrinkageSeries(state) {
    const closed = state.counts.filter(c => c.status === 'closed').sort((a, b) => a.bd < b.bd ? -1 : 1);
    let cum = 0;
    return closed.filter(c => !c.isOpening).map(c => {
      let day = 0;
      for (const l of c.lines) if (l.variance < 0) day += -l.variance;
      cum = Math.round((cum + day) * 100) / 100;
      return { bd: c.bd, day: Math.round(day * 100) / 100, cum };
    });
  },
};

/* ---------- id/hash utils ---------- */
let _uidc = 0;
function uid() { return Date.now().toString(36) + (_uidc++).toString(36) + Math.random().toString(36).slice(2, 6); }
async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + '|' + pin);
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- seed catalog (client's exact list) ---------- */
const SEED = {
  categories: [
    { id: 'biere', nameFr: 'Bières & Softs', nameEn: 'Beers & Softs', color: 'var(--cat-biere)', hex: '#F2C43D', icon: 'beer', sort: 1 },
    { id: 'rouge', nameFr: 'Vins Rouges', nameEn: 'Red Wines', color: 'var(--cat-rouge)', hex: '#D05672', icon: 'wine', sort: 2 },
    { id: 'blanc', nameFr: 'Vins Blancs', nameEn: 'White Wines', color: 'var(--cat-blanc)', hex: '#DCCB7E', icon: 'wine', sort: 3 },
    { id: 'rose', nameFr: 'Vins Rosés', nameEn: 'Rosé Wines', color: 'var(--cat-rose)', hex: '#F49BB5', icon: 'wine', sort: 4 },
    { id: 'demi', nameFr: 'Demi-bouteilles', nameEn: 'Half bottles', color: 'var(--cat-demi)', hex: '#A78BFA', icon: 'wine', sort: 5 },
    { id: 'champ', nameFr: 'Champagne', nameEn: 'Champagne', color: 'var(--cat-champ)', hex: '#EFE3AE', icon: 'sparkles', sort: 6 },
    { id: 'spirit', nameFr: 'Spiritueux', nameEn: 'Spirits', color: 'var(--cat-spirit)', hex: '#C97A45', icon: 'glass', sort: 7 },
    { id: 'cuisine', nameFr: 'Cuisine', nameEn: 'Kitchen', color: 'var(--cat-cuisine)', hex: '#6FBF8E', icon: 'utensils', sort: 8 },
  ],
  items: [
    // Bières & Softs — threshold 24
    ['biere', 'Spécial', 'bouteille', false, 24, 'beer', { g: '#7A4A17', l: '#E8E0CE' }],
    ['biere', 'Heineken', 'bouteille', false, 24, 'beer', { g: '#1E6B34', l: '#E8F0E8' }],
    ['biere', 'Spécial Gold', 'bouteille', false, 24, 'beer', { g: '#8A6A1E', l: '#F0E2B8' }],
    ['biere', 'Casablanca', 'bouteille', false, 24, 'beer', { g: '#215D3C', l: '#F2EFE4' }],
    ['biere', 'Budweiser', 'bouteille', false, 24, 'beer', { g: '#6B2A1E', l: '#E9DFD2' }],
    ['biere', 'Smirnoff Ice', 'bouteille', false, 24, 'beer', { g: '#3C5B78', l: '#EAF0F4' }],
    ['biere', 'Red Bull', 'canette', false, 24, 'can', { g: '#27427A', l: '#C8CFDA' }],
    ['biere', 'Soda', 'canette', false, 24, 'can', { g: '#8A2430', l: '#E9DFD2' }],
    // Vins Rouges — threshold 6
    ['rouge', 'Ithaque', 'bouteille', false, 6, 'wine', { g: '#38121C', l: '#E5D9C0' }],
    ['rouge', 'Eclipse', 'bouteille', false, 6, 'wine', { g: '#2E1016', l: '#D8C8A8' }],
    ['rouge', 'Volubilia', 'bouteille', false, 6, 'wine', { g: '#3B1420', l: '#E2D5BD' }],
    ['rouge', 'Médaillon', 'bouteille', false, 6, 'wine', { g: '#34101A', l: '#E8DCC4' }],
    ['rouge', 'Sahari', 'bouteille', false, 6, 'wine', { g: '#40161E', l: '#DECFAF' }],
    ['rouge', 'Terre Rouge', 'bouteille', false, 6, 'wine', { g: '#391018', l: '#E0D2B6' }],
    ['rouge', 'Terroir Rouge', 'bouteille', false, 6, 'wine', { g: '#331018', l: '#E6DAC2' }],
    ['rouge', 'Ferrande', 'bouteille', false, 6, 'wine', { g: '#3D141C', l: '#DACBAB' }],
    // Vins Blancs — threshold 6
    ['blanc', 'Odyssée', 'bouteille', false, 6, 'wine-w', { g: '#7A7A3E', l: '#F0EAD0' }],
    ['blanc', 'Médaillon Blanc', 'bouteille', false, 6, 'wine-w', { g: '#807E44', l: '#F2ECD4' }],
    ['blanc', 'Terroir Blanc', 'bouteille', false, 6, 'wine-w', { g: '#74763C', l: '#EEE8CE' }],
    // Vins Rosés — threshold 6
    ['rose', 'Médaillon Rosé', 'bouteille', false, 6, 'wine-r', { g: '#B06070', l: '#F4E4E0' }],
    ['rose', 'Terroir Rosé', 'bouteille', false, 6, 'wine-r', { g: '#A85A6C', l: '#F2E0DC' }],
    // Demi-bouteilles — threshold 6
    ['demi', '1/2 Médaillon', 'bouteille', false, 6, 'half', { g: '#34101A', l: '#E8DCC4' }],
    ['demi', '1/2 Eclipse', 'bouteille', false, 6, 'half', { g: '#2E1016', l: '#D8C8A8' }],
    ['demi', '1/2 Volubilia', 'bouteille', false, 6, 'half', { g: '#3B1420', l: '#E2D5BD' }],
    ['demi', '1/2 Sahari', 'bouteille', false, 6, 'half', { g: '#40161E', l: '#DECFAF' }],
    ['demi', '1/2 Terroir Rouge', 'bouteille', false, 6, 'half', { g: '#331018', l: '#E6DAC2' }],
    ['demi', '1/2 Médaillon Blanc', 'bouteille', false, 6, 'half-w', { g: '#807E44', l: '#F2ECD4' }],
    ['demi', '1/2 Terroir Blanc', 'bouteille', false, 6, 'half-w', { g: '#74763C', l: '#EEE8CE' }],
    ['demi', '1/2 Médaillon Rosé', 'bouteille', false, 6, 'half-r', { g: '#B06070', l: '#F4E4E0' }],
    ['demi', '1/2 Terroir Rosé', 'bouteille', false, 6, 'half-r', { g: '#A85A6C', l: '#F2E0DC' }],
    // Champagne — threshold 3
    ['champ', 'Champagne', 'bouteille', false, 3, 'champagne', { g: '#5A4A1E', l: '#F2E6BE' }],
    // Spiritueux — decimal, threshold 2
    ['spirit', 'Black Label', 'bouteille', true, 2, 'whisky-sq', { g: '#1A1A1A', l: '#E8D9A8' }],
    ['spirit', 'Red Label', 'bouteille', true, 2, 'whisky-sq', { g: '#241012', l: '#E2B84A' }],
    ['spirit', 'Absolut', 'bouteille', true, 2, 'vodka', { g: '#B8C8D8', l: '#DDE8F0' }],
    ['spirit', "Jack Daniel's", 'bouteille', true, 2, 'whisky-sq', { g: '#141414', l: '#E6E0D0' }],
    ['spirit', 'Belvedere', 'bouteille', true, 2, 'vodka', { g: '#C8D4DC', l: '#EEF2F4' }],
    ['spirit', "Gordon's", 'bouteille', true, 2, 'gin', { g: '#1E5438', l: '#E8E4C8' }],
    ['spirit', 'Ricard', 'bouteille', true, 2, 'pastis', { g: '#6A4A14', l: '#F0E2B0' }],
    ['spirit', 'Agavita', 'bouteille', true, 2, 'tequila', { g: '#7A6A24', l: '#EAE2C0' }],
    ['spirit', 'Jägermeister', 'bouteille', true, 2, 'herbal', { g: '#12300F', l: '#E8890A' }],
    ['spirit', 'Cognac', 'bouteille', true, 2, 'cognac', { g: '#4A2410', l: '#E9D9B8' }],
    ['spirit', 'Martini Blanc', 'bouteille', true, 2, 'vermouth', { g: '#8A8A4A', l: '#F0ECD8' }],
    // Cuisine — portion, threshold 10
    ['cuisine', 'Fromage', 'portion', false, 10, 'cheese', { g: '#C89A3A', l: '#F2E2B0' }],
    ['cuisine', 'Viande Hachée', 'portion', false, 10, 'meat', { g: '#8A3A2E', l: '#E9C9B8' }],
    ['cuisine', 'Foie', 'portion', false, 10, 'liver', { g: '#6A2A24', l: '#DCB8A8' }],
    ['cuisine', 'Cervelle', 'portion', false, 10, 'brain', { g: '#B08A7A', l: '#EEDCD0' }],
    ['cuisine', 'Pizza V/H', 'portion', false, 10, 'pizza', { g: '#B4582A', l: '#F0D8A0' }],
  ],
  build() {
    return this.items.map(([catId, name, unit, allowDecimal, threshold, art, tint], i) => ({
      id: 'it' + (i + 1).toString(36).padStart(2, '0'),
      catId, name, unit, allowDecimal, threshold, art, tint,
      photo: null, barcode: null, pinned: ['Heineken', 'Spécial', 'Black Label', 'Casablanca', 'Red Bull', 'Ricard'].includes(name),
      cost: null, active: true, sort: i,
    }));
  },
};

/* ---------- store ---------- */
const Store = (() => {
  const KEY = 'bartally.v1';
  const LS = (typeof localStorage !== 'undefined') ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const listeners = new Set();
  let saveTimer = null;

  function blank() {
    return {
      v: 1,
      settings: {
        barName: '', logo: null, lang: 'fr', cutoffHour: 6,
        varThreshold: 2, currency: 'MAD', requireStaffPin: false,
        ownerPinHash: null, ownerPinSalt: null, ownerName: '',
        setupDone: false, demoMode: false, notifGranted: false,
      },
      categories: [], items: [], employees: [],
      sales: [], restocks: [], waste: [], counts: [],
      audit: [], notifs: [], recents: [],
      session: null,
    };
  }

  let state = blank();
  try {
    const raw = LS.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); if (p && p.v === 1) state = Object.assign(blank(), p, { settings: Object.assign(blank().settings, p.settings) }); }
  } catch (e) { console.error('load failed', e); }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { LS.setItem(KEY, JSON.stringify(state)); }
      catch (e) { console.error('save failed', e); }
    }, 120);
  }
  function emit(what) { save(); for (const fn of listeners) fn(what); }

  const S = {
    Engine, SEED,
    get state() { return state; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /* ---- session & auth ---- */
    get me() { return state.session ? (state.session.role === 'owner' ? { id: 'owner', name: state.settings.ownerName || 'Patron', role: 'owner' } : state.employees.find(e => e.id === state.session.userId)) : null; },
    get isOwner() { return state.session?.role === 'owner'; },
    async loginOwner(pin) {
      const ok = state.settings.ownerPinHash === await hashPin(pin, state.settings.ownerPinSalt);
      if (ok) { state.session = { userId: 'owner', role: 'owner' }; emit('session'); }
      return ok;
    },
    async loginEmployee(empId, pin) {
      const emp = state.employees.find(e => e.id === empId && e.active);
      if (!emp) return false;
      if (state.settings.requireStaffPin && emp.pinHash) {
        if (emp.pinHash !== await hashPin(pin, emp.pinSalt)) return false;
      }
      state.session = { userId: empId, role: 'employee' }; emit('session');
      return true;
    },
    logout() { state.session = null; emit('session'); },

    /* ---- helpers ---- */
    todayBd() { return Engine.bdOf(new Date(), state.settings.cutoffHour); },
    item(id) { return state.items.find(i => i.id === id); },
    cat(id) { return state.categories.find(c => c.id === id); },
    catName(c) { return state.settings.lang === 'en' ? c.nameEn : c.nameFr; },
    stock(itemId) { return Engine.expected(state, itemId, this.todayBd()); },
    activeItems() { return state.items.filter(i => i.active).sort((a, b) => a.sort - b.sort); },
    isLow(itemId) { const it = this.item(itemId); return it && this.stock(itemId) <= it.threshold; },
    lowItems() { return this.activeItems().filter(i => this.stock(i.id) <= i.threshold); },

    audit(action, entity, entityId, before, after) {
      state.audit.unshift({ at: new Date().toISOString(), actor: this.me?.name || 'system', action, entity, entityId, before: before ?? null, after: after ?? null });
      if (state.audit.length > 600) state.audit.length = 600;
    },
    notify(type, payload) {
      const bd = this.todayBd();
      if (type === 'low' && state.notifs.some(n => n.type === 'low' && n.bd === bd && n.payload.itemId === payload.itemId)) return; // debounce: 1/item/day
      state.notifs.unshift({ id: uid(), type, at: new Date().toISOString(), bd, read: false, payload });
      if (state.notifs.length > 120) state.notifs.length = 120;
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && typeof window !== 'undefined' && window.__notifText) {
        try { new Notification(state.settings.barName || 'BarTally', { body: window.__notifText(type, payload), tag: type + (payload.itemId || '') }); } catch (e) {}
      }
    },
    checkLow(itemId) {
      const it = this.item(itemId);
      if (it && it.active && this.stock(itemId) <= it.threshold) this.notify('low', { itemId, qty: this.stock(itemId), unit: it.unit });
    },

    /* ---- staff + owner actions ---- */
    logSale(itemId, qty) {
      if (!state.session) return null;
      const e = { id: uid(), itemId, qty, bd: this.todayBd(), at: new Date().toISOString(), by: this.me.name, byId: state.session.userId, voidedAt: null, voidedBy: null };
      state.sales.unshift(e);
      state.recents = [itemId, ...state.recents.filter(r => r !== itemId)].slice(0, 8);
      this.checkLow(itemId);
      emit('sales');
      return e;
    },
    /** staff undo: only own entry, only within grace window (UI enforces 6s); recorded as void */
    undoSale(saleId) {
      const e = state.sales.find(s => s.id === saleId);
      if (!e || e.voidedAt) return false;
      if (!this.isOwner && e.byId !== state.session?.userId) return false;
      e.voidedAt = new Date().toISOString(); e.voidedBy = this.me.name;
      this.audit('void_sale', 'sale', saleId, { qty: e.qty, itemId: e.itemId }, null);
      emit('sales');
      return true;
    },
    voidSale(saleId) {
      if (!this.isOwner) return false;
      return this.undoSale(saleId);
    },
    logRestock(itemId, qty) {
      if (!this.isOwner) return null;
      const e = { id: uid(), itemId, qty, bd: this.todayBd(), at: new Date().toISOString(), by: this.me.name };
      state.restocks.unshift(e);
      this.audit('restock', 'restock', e.id, null, { itemId, qty });
      emit('restocks');
      return e;
    },
    logWaste(itemId, qty, reason) {
      if (!this.isOwner) return null;
      const e = { id: uid(), itemId, qty, reason: reason || '', bd: this.todayBd(), at: new Date().toISOString(), by: this.me.name };
      state.waste.unshift(e);
      this.audit('waste', 'waste', e.id, null, { itemId, qty, reason });
      this.checkLow(itemId);
      emit('waste');
      return e;
    },

    /* ---- counts ---- */
    openCount() {
      if (!this.isOwner) return null;
      let c = state.counts.find(c => c.status === 'open');
      if (c) return c;
      const bd = this.todayBd();
      c = { id: uid(), bd, status: 'open', startedAt: new Date().toISOString(), closedAt: null, closedBy: null, lines: [] };
      state.counts.push(c);
      emit('counts');
      return c;
    },
    countExpected(itemId, bd) { return Engine.expected(state, itemId, bd, { strictlyBefore: true }); },
    setCountLine(countId, itemId, counted, note) {
      const c = state.counts.find(x => x.id === countId);
      if (!c || c.status !== 'open' || !this.isOwner) return;
      const expected = this.countExpected(itemId, c.bd);
      const variance = Math.round((counted - expected) * 100) / 100;
      const i = c.lines.findIndex(l => l.itemId === itemId);
      const line = { itemId, expected, counted, variance, note: note ?? (i >= 0 ? c.lines[i].note : '') };
      if (i >= 0) c.lines[i] = line; else c.lines.push(line);
      emit('counts');
    },
    setCountNote(countId, itemId, note) {
      const c = state.counts.find(x => x.id === countId);
      const l = c?.lines.find(l => l.itemId === itemId);
      if (l) { l.note = note; emit('counts'); }
    },
    closeCount(countId) {
      const c = state.counts.find(x => x.id === countId);
      if (!c || c.status !== 'open' || !this.isOwner) return null;
      // uncounted active items keep expected value (variance 0)
      for (const it of this.activeItems()) {
        if (!c.lines.some(l => l.itemId === it.id)) {
          const expected = this.countExpected(it.id, c.bd);
          c.lines.push({ itemId: it.id, expected, counted: expected, variance: 0, note: '', autofilled: true });
        }
      }
      c.status = 'closed'; c.closedAt = new Date().toISOString(); c.closedBy = this.me.name;
      this.audit('close_count', 'count', c.id, null, { bd: c.bd, lines: c.lines.length });
      const issues = c.lines.filter(l => Math.abs(l.variance) >= state.settings.varThreshold || l.variance !== 0);
      const big = c.lines.filter(l => Math.abs(l.variance) >= state.settings.varThreshold);
      if (issues.length) {
        const top = [...issues].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))[0];
        const it = this.item(top.itemId);
        this.notify('variance', { n: issues.length, big: big.length, top: `${it?.name} ${top.variance > 0 ? '+' : ''}${top.variance}` });
      }
      for (const it of this.activeItems()) this.checkLow(it.id);
      emit('counts');
      return c;
    },
    reopenCount(countId) {
      const c = state.counts.find(x => x.id === countId);
      if (!c || c.status !== 'closed' || !this.isOwner || c.isOpening) return false;
      c.status = 'open'; this.audit('reopen_count', 'count', c.id, { closedAt: c.closedAt }, null);
      c.closedAt = null; c.closedBy = null;
      emit('counts');
      return true;
    },
    closedCounts() { return state.counts.filter(c => c.status === 'closed' && !c.isOpening).sort((a, b) => a.bd < b.bd ? 1 : -1); },

    /* ---- items & categories (owner) ---- */
    saveItem(data) {
      if (!this.isOwner) return null;
      if (data.id) {
        const it = this.item(data.id); const before = { ...it };
        Object.assign(it, data);
        this.audit('edit_item', 'item', it.id, { name: before.name, threshold: before.threshold, cost: before.cost }, { name: it.name, threshold: it.threshold, cost: it.cost });
        emit('items'); return it;
      }
      const it = { id: uid(), catId: data.catId, name: data.name, unit: data.unit || 'bouteille', allowDecimal: !!data.allowDecimal, threshold: data.threshold ?? 6, art: data.art || 'wine', tint: data.tint || { g: '#3B1420', l: '#E2D5BD' }, photo: data.photo || null, barcode: data.barcode || null, pinned: !!data.pinned, cost: data.cost ?? null, active: true, sort: state.items.length };
      state.items.push(it);
      this.audit('add_item', 'item', it.id, null, { name: it.name });
      emit('items'); return it;
    },
    findByBarcode(code) { return state.items.find(i => i.barcode === code && i.active); },

    /* ---- employees (owner) ---- */
    async addEmployee(name, pin) {
      if (!this.isOwner) return null;
      const emp = { id: uid(), name, active: true, pinHash: null, pinSalt: null };
      if (pin) { emp.pinSalt = uid(); emp.pinHash = await hashPin(pin, emp.pinSalt); }
      state.employees.push(emp);
      this.audit('add_employee', 'employee', emp.id, null, { name });
      emit('employees'); return emp;
    },
    async setEmployeePin(empId, pin) {
      if (!this.isOwner) return;
      const emp = state.employees.find(e => e.id === empId);
      if (!emp) return;
      emp.pinSalt = uid(); emp.pinHash = await hashPin(pin, emp.pinSalt);
      this.audit('reset_pin', 'employee', empId, null, null);
      emit('employees');
    },
    setEmployeeActive(empId, active) {
      if (!this.isOwner) return;
      const emp = state.employees.find(e => e.id === empId);
      if (emp) { emp.active = active; this.audit(active ? 'reactivate_employee' : 'deactivate_employee', 'employee', empId, null, null); emit('employees'); }
    },
    async setOwnerPin(pin) {
      state.settings.ownerPinSalt = uid();
      state.settings.ownerPinHash = await hashPin(pin, state.settings.ownerPinSalt);
      this.audit('change_owner_pin', 'settings', 'owner', null, null);
      emit('settings');
    },

    /* ---- settings & data ---- */
    setSettings(patch) {
      const before = { ...state.settings };
      Object.assign(state.settings, patch);
      if (state.session?.role === 'owner' || !state.settings.setupDone) this.audit('settings', 'settings', 'app', null, Object.keys(patch).join(','));
      if (patch.lang) I18N.lang = patch.lang;
      emit('settings');
    },
    markNotifsRead() { for (const n of state.notifs) n.read = true; emit('notifs'); },
    exportJSON() { return JSON.stringify(state, null, 1); },
    importJSON(json) {
      const p = JSON.parse(json);
      if (!p || p.v !== 1 || !Array.isArray(p.items)) throw new Error('bad backup');
      state = Object.assign(blank(), p, { settings: Object.assign(blank().settings, p.settings) });
      state.session = null;
      emit('all');
    },
    resetAll() { state = blank(); LS.removeItem(KEY); emit('all'); },

    /* ---- setup ---- */
    async setupReal({ barName, ownerName, pin, employees, opening }) {
      state = blank();
      state.categories = JSON.parse(JSON.stringify(SEED.categories));
      state.items = SEED.build();
      state.settings.barName = barName; state.settings.ownerName = ownerName || 'Patron';
      await this.setOwnerPin(pin);
      for (const name of employees) await this.addEmployeeRaw(name);
      // opening stock = closed baseline count dated yesterday-bd so today's entries apply on top
      const bd = Engine.addDays(this.todayBd(), -1);
      const c = { id: uid(), bd, status: 'closed', isOpening: true, startedAt: new Date().toISOString(), closedAt: new Date().toISOString(), closedBy: ownerName || 'Patron', lines: [] };
      for (const it of state.items) {
        const q = opening[it.id] ?? 0;
        c.lines.push({ itemId: it.id, expected: q, counted: q, variance: 0, note: '' });
      }
      state.counts.push(c);
      state.settings.setupDone = true; state.settings.demoMode = false;
      state.session = { userId: 'owner', role: 'owner' };
      this.audit('setup', 'settings', 'app', null, { items: state.items.length });
      emit('all');
    },
    async addEmployeeRaw(name) {
      const emp = { id: uid(), name, active: true, pinHash: null, pinSalt: null };
      state.employees.push(emp); return emp;
    },
    async setupDemo() {
      state = blank();
      state.categories = JSON.parse(JSON.stringify(SEED.categories));
      state.items = SEED.build();
      state.settings.barName = 'Le Comptoir'; state.settings.ownerName = 'Karim';
      state.settings.demoMode = true; state.settings.setupDone = true;
      await this.setOwnerPin('1234');
      const y = await this.addEmployeeRaw('Yassine');
      const s = await this.addEmployeeRaw('Sarah');
      seedDemoHistory(state, [y, s]);
      state.session = { userId: 'owner', role: 'owner' };
      emit('all');
    },
  };

  /* deterministic demo history: 14 closed days + today's open activity */
  function seedDemoHistory(st, emps) {
    let rs = 42;
    const rnd = () => (rs = (rs * 1103515245 + 12345) % 2147483648) / 2147483648;
    const today = S.todayBd();
    const start = Engine.addDays(today, -14);
    const stockNow = {}; // running physical stock
    const popular = { Heineken: 26, 'Spécial': 30, Casablanca: 18, 'Spécial Gold': 10, Budweiser: 8, 'Smirnoff Ice': 6, 'Red Bull': 14, Soda: 12, 'Black Label': 7, 'Red Label': 5, Absolut: 4, "Jack Daniel's": 4, Ricard: 6, 'Jägermeister': 3, "Gordon's" : 3, Belvedere: 2, Agavita: 2, Cognac: 1.5, 'Martini Blanc': 2, Champagne: 0.4, Fromage: 5, 'Viande Hachée': 4, Foie: 3, Cervelle: 2, 'Pizza V/H': 6 };
    for (const it of st.items) {
      const base = it.catId === 'biere' ? 90 : it.catId === 'spirit' ? 6 : it.catId === 'cuisine' ? 25 : it.catId === 'champ' ? 5 : 14;
      stockNow[it.id] = base;
    }
    // opening baseline
    st.counts.push({ id: uid(), bd: Engine.addDays(start, -1), status: 'closed', isOpening: true, startedAt: '', closedAt: new Date(Date.now() - 15 * 864e5).toISOString(), closedBy: 'Karim', lines: st.items.map(it => ({ itemId: it.id, expected: stockNow[it.id], counted: stockNow[it.id], variance: 0, note: '' })) });
    const mkAt = (bd, h, m) => { const [Y, M, D] = bd.split('-').map(Number); const d = new Date(Y, M - 1, D, h, m); if (h < 6) d.setDate(d.getDate() + 1); return d.toISOString(); };
    for (let d = 0; d < 14; d++) {
      const bd = Engine.addDays(start, d);
      const dow = new Date(bd + 'T12:00').getDay();
      const busy = (dow === 5 || dow === 6) ? 1.5 : dow === 0 ? 1.15 : 1;
      // sales
      for (const it of st.items) {
        const p = popular[it.name] ?? (it.catId === 'rouge' ? 2.2 : it.catId === 'blanc' ? 1.4 : it.catId === 'rose' ? 1.2 : it.catId === 'demi' ? 0.9 : 1);
        let want = Math.round(p * busy * (0.6 + rnd() * 0.8) * 10) / 10;
        let n = it.allowDecimal ? Math.round(want) : Math.round(want);
        n = Math.min(n, Math.floor(stockNow[it.id] * 0.7));
        let logged = 0;
        while (logged < n) {
          const q = Math.min(n - logged, 1 + Math.floor(rnd() * 2));
          const emp = emps[Math.floor(rnd() * emps.length)];
          const hour = 18 + Math.floor(rnd() * 10); // 18h → 03h
          st.sales.push({ id: uid(), itemId: it.id, qty: q, bd, at: mkAt(bd, hour % 24, Math.floor(rnd() * 60)), by: emp.name, byId: emp.id, voidedAt: null, voidedBy: null });
          logged += q; stockNow[it.id] -= q;
        }
      }
      // deliveries: top-up model so shelves stay realistic; a few items deliberately
      // run low at the end (the low-stock story on the dashboard)
      const lowStory = ['Casablanca', 'Champagne', 'Ricard'];
      if (d === 4 || d === 9 || d === 12) {
        for (const it of st.items) {
          if (d === 12 && lowStory.includes(it.name)) continue;
          let q = 0;
          if (it.catId === 'biere' && stockNow[it.id] < 70) q = Math.ceil((110 - stockNow[it.id]) / 24) * 24;
          else if (it.catId === 'spirit' && stockNow[it.id] < 3.5) q = 6;
          else if (it.catId === 'cuisine' && stockNow[it.id] < 14) q = 20;
          else if ((it.catId === 'rouge' || it.catId === 'blanc' || it.catId === 'rose' || it.catId === 'demi') && stockNow[it.id] < it.threshold * 2) q = 12;
          else if (it.catId === 'champ' && stockNow[it.id] < 3) q = 4;
          if (q > 0) {
            st.restocks.push({ id: uid(), itemId: it.id, qty: q, bd, at: mkAt(bd, 16, Math.floor(rnd() * 50)), by: 'Karim' });
            stockNow[it.id] += q;
          }
        }
      }
      // one waste event
      if (d === 6) {
        const hei = st.items.find(i => i.name === 'Heineken');
        st.waste.push({ id: uid(), itemId: hei.id, qty: 2, reason: 'Casse — 2 bouteilles tombées', bd, at: mkAt(bd, 22, 40), by: 'Karim' });
        stockNow[hei.id] -= 2;
      }
      // shrink: unexplained losses on some days (the story the app catches)
      const shrinkPlan = { 3: [['Black Label', 0.5]], 7: [['Heineken', 2]], 10: [['Heineken', 3], ['Red Label', 0.5]], 12: [['Black Label', 1]], 13: [['Heineken', 2], ['Black Label', 0.5]] };
      for (const [nm, q] of (shrinkPlan[d] || [])) {
        const it = st.items.find(i => i.name === nm);
        stockNow[it.id] -= q; // vanished without a log entry → shows as negative variance
      }
      // close the day
      const lines = st.items.map(it => {
        const expected = Engine.expected(st, it.id, bd, { strictlyBefore: true });
        const counted = Math.round(stockNow[it.id] * 100) / 100;
        const v = Math.round((counted - expected) * 100) / 100;
        const notes = { Heineken: 'À surveiller — écart répété', 'Black Label': 'Vérifier le doseur' };
        return { itemId: it.id, expected, counted, variance: v, note: v < -1 ? (notes[it.name] || '') : '' };
      });
      st.counts.push({ id: uid(), bd, status: 'closed', startedAt: mkAt(bd, 4, 0), closedAt: mkAt(bd, 4, 30), closedBy: 'Karim', lines });
    }
    // today's open activity: a few live sales
    const liveSales = [['Heineken', 2, 'Yassine'], ['Spécial', 3, 'Sarah'], ['Red Bull', 1, 'Yassine'], ['Black Label', 1, 'Sarah'], ['Casablanca', 2, 'Yassine']];
    let mins = 0;
    for (const [nm, q, who] of liveSales) {
      const it = st.items.find(i => i.name === nm);
      if (stockNow[it.id] < q + 1) continue; // never oversell the demo shelves
      const emp = emps.find(e => e.name === who);
      st.sales.push({ id: uid(), itemId: it.id, qty: q, bd: today, at: new Date(Date.now() - (50 - mins) * 60000).toISOString(), by: emp.name, byId: emp.id, voidedAt: null, voidedBy: null });
      stockNow[it.id] -= q;
      mins += 10;
    }
    st.recents = liveSales.map(([nm]) => st.items.find(i => i.name === nm).id).reverse();
  }

  return S;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Engine, SEED, Store };
