/* ============ Screen: sell — the only screen staff ever see.
   One list, − to record a sale, + to correct before it saves. ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'sell.stockEst': 'Stock estimé · {n}',
      'sell.validate': 'Valider la vente',
      'sell.lock': 'Verrouiller',
      'sell.sold': 'Vendu : {n} × {item}',
      'sell.soldGlasses_one': 'Vendu : {n} verre × {item}',
      'sell.soldGlasses_many': 'Vendu : {n} verres × {item}',
      'sell.glass_one': '{n} verre',
      'sell.glass_many': '{n} verres',
      'sell.doseTag': 'au verre · {ml} ml',
      'sell.soldItem': 'Vendu : {item}',
      'sell.empty': '{item} : stock épuisé. Enregistrez une livraison.',
      'sell.hint': 'Appuyez sur − à chaque article vendu. Maintenez pour aller vite.',
      'sell.left': 'en stock',
    },
    en: {
      'sell.stockEst': 'Estimated stock · {n}',
      'sell.validate': 'Confirm sale',
      'sell.lock': 'Lock',
      'sell.sold': 'Sold: {n} × {item}',
      'sell.soldGlasses_one': 'Sold: {n} glass × {item}',
      'sell.soldGlasses_many': 'Sold: {n} glasses × {item}',
      'sell.glass_one': '{n} glass',
      'sell.glass_many': '{n} glasses',
      'sell.doseTag': 'by the glass · {ml} ml',
      'sell.soldItem': 'Sold: {item}',
      'sell.empty': '{item}: out of stock. Record a delivery first.',
      'sell.hint': 'Tap − for each item sold. Hold to go faster.',
      'sell.left': 'in stock',
    },
  });

  document.head.appendChild(UI.el(`<style>
  [data-screen=sell] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=sell] .h1{font:600 28px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  [data-screen=sell] .topside{display:flex;align-items:center;gap:8px}
  [data-screen=sell] .lockbtn{font-size:13px;font-weight:500;color:var(--t3)}
  [data-screen=sell] .scanbtn{width:32px;height:32px;border:0;display:flex;align-items:center;justify-content:center;color:var(--t3)}
  [data-screen=sell] .scanbtn svg{width:18px;height:18px}
  [data-screen=sell] .sell-row{padding:0}
  [data-screen=sell] .sell-main{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:7px 0;text-align:left}
  [data-screen=sell] .sell-adj{display:flex;align-items:center;gap:2px;flex:none;margin-left:8px}
  [data-screen=sell] .sell-btn{width:46px;height:46px;border-radius:10px;border:1px solid var(--hair);
    background:var(--surface);color:var(--t2);font:500 22px var(--f-display);line-height:1;
    display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;transition:background .1s,color .1s}
  [data-screen=sell] .sell-btn:active{background:var(--surface2);color:var(--t1)}
  [data-screen=sell] .sell-btn.is-primary{border-color:rgba(232,177,78,.4);color:var(--brass)}
  [data-screen=sell] .sell-n{min-width:48px;text-align:center;font-size:19px}
  [data-screen=sell] .sell-n.is-pend{color:var(--brass);font-size:13px;min-width:62px;line-height:1.25}
  [data-screen=sell] .sell-n.is-low{color:var(--bad)}
  [data-screen=sell] .sell-pour{flex-direction:column;gap:0;width:44px}
  [data-screen=sell] .sell-pour b{font:600 16px var(--f-display);line-height:1.1}
  [data-screen=sell] .sell-pour i{font:600 9.5px var(--f-ui);font-style:normal;letter-spacing:.04em;color:var(--t3)}
  </style>`));

  const V = { q: '', cat: 'all' };
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /** spirits pour by the glass: each pour button = one dose of that size;
      the bottle count moves by the exact fraction (ml / bottle ml) */
  const isDose = it => !!(Array.isArray(it.pours) && it.pours.length && it.bottleMl);
  const pourSizes = it => it.pours.filter(p => p > 0);

  /* pending sale per item: dose items keep a STACK of poured ml (so + undoes the
     last pour, whatever its size); plain items keep a tap count.
     A burst becomes ONE sale entry. */
  const Q = { pending: {}, timers: {}, first: {} };

  /* dose items keep { ml:[…poured glasses…], whole:n }; plain items keep a number */
  const pendingQty = (it, p) => !p ? 0
    : (isDose(it) ? (p.whole || 0) + (p.ml || []).reduce((a, b) => a + b, 0) / it.bottleMl : p);
  const pendCount = (it, p) => !p ? 0 : (isDose(it) ? (p.whole || 0) + (p.ml || []).length : p);
  const pendLabel = (it, p) => {
    const g = (p.ml || []).length, w = p.whole || 0, bits = [];
    if (w) bits.push(w + ' × ' + Store.sizeLabel(it.bottleMl));
    if (g) bits.push(I18N.plural('sell.glass', g));
    return '−' + bits.join(' + ');
  };

  function paint(id) {
    const el = document.querySelector(`[data-n="${CSS.escape(id)}"]`);
    if (!el) return;
    const it = Store.item(id); if (!it) return;
    const p = Q.pending[id];
    const n = pendCount(it, p);
    if (n && isDose(it)) {
      el.textContent = pendLabel(it, p);
    } else {
      const shown = Math.round((Store.stock(id) - pendingQty(it, p)) * 1000) / 1000;
      el.textContent = it.bottleMl ? String(Math.floor(shown + 1e-6)) : UI.fmtQty(shown);
    }
    el.classList.toggle('is-pend', !!n);
    el.classList.toggle('is-low', !n && Store.isLow(id));
  }

  function arm(id) {
    Q.first[id] = Q.first[id] || Date.now();
    UI.haptic('light');
    UI.hold(1400);          // keep the list still while the finger is working
    paint(id);
    clearTimeout(Q.timers[id]);
    // reset on each tap, but never drift beyond 2s from the first tap of the burst
    const wait = Math.max(250, Math.min(700, 2000 - (Date.now() - Q.first[id])));
    Q.timers[id] = setTimeout(() => commit(id), wait);
  }
  /** plain items: −/+ one unit */
  function bump(id, dir) {
    const it = Store.item(id); if (!it) return;
    if (isDose(it)) {
      if (dir < 0 && wouldOverdraw(it, 1)) return refuse(it);
      const p = (Q.pending[id] = Q.pending[id] || { ml: [], whole: 0 });
      if (dir < 0) p.whole = (p.whole || 0) + 1;            // − = one whole bottle sold
      else if (p.ml.length) p.ml.pop();                      // + undoes the last glass…
      else if (p.whole) p.whole--;                           // …then the last bottle
      else return;
      arm(id);
      return;
    }
    if (dir < 0 && wouldOverdraw(it, 1)) return refuse(it);
    const next = (Q.pending[id] || 0) + (dir < 0 ? 1 : -1);
    if (next < 0) return;
    Q.pending[id] = next;
    arm(id);
  }
  /** true when one more unit would take the shelf below empty */
  function wouldOverdraw(it, extraQty) {
    const left = Store.stock(it.id) - pendingQty(it, Q.pending[it.id]);
    return left - extraQty < -1e-6;
  }
  function refuse(it) {
    UI.haptic('warn');
    UI.toast(t('sell.empty', { item: it.name }), { type: 'danger' });
  }
  /** dose items: pour one glass of `ml` */
  function pour(id, ml) {
    const it = Store.item(id); if (!it || !isDose(it)) return;
    if (wouldOverdraw(it, ml / it.bottleMl)) return refuse(it);
    const p = (Q.pending[id] = Q.pending[id] || { ml: [], whole: 0 });
    p.ml.push(ml);
    arm(id);
  }

  function commit(id) {
    const p = Q.pending[id];
    delete Q.pending[id];
    delete Q.first[id];
    clearTimeout(Q.timers[id]);
    const it = Store.item(id); if (!it) return;
    if (isDose(it)) {
      if (!p || (!p.ml.length && !p.whole)) return;
      const ml = p.ml.reduce((a, b) => a + b, 0);
      const qty = (p.whole || 0) + ml / it.bottleMl;
      const pours = {};
      for (const m of p.ml) pours[m] = (pours[m] || 0) + 1;
      const meta = p.ml.length ? { glasses: p.ml.length, pours } : undefined;
      const entry = Store.logSale(id, qty, meta);
      if (!entry) return;
      const bits = [];
      if (p.whole) bits.push(`${p.whole} × ${Store.sizeLabel(it.bottleMl)}`);
      for (const [m, n] of Object.entries(pours)) bits.push(`${n}×${m}ml`);
      UI.toast(`${t('sell.soldItem', { item: it.name })} — ${bits.join(' · ')}`, {
        type: 'ok', action: { label: t('g.undo'), fn: () => Store.undoSale(entry.id) } });
      return;
    }
    if (!p) return;
    const entry = Store.logSale(id, p);
    if (!entry) return;
    UI.toast(t('sell.sold', { n: UI.fmtQty(p), item: it.name }), {
      type: 'ok', action: { label: t('g.undo'), fn: () => Store.undoSale(entry.id) } });
  }


  function rowHtml(it) {
    const p = Q.pending[it.id];
    const n = pendCount(it, p);
    const shown = Math.round((Store.stock(it.id) - pendingQty(it, p)) * 1000) / 1000;
    const low = !n && Store.isLow(it.id);
    const dose = isDose(it);
    const numHtml = `<span class="num sell-n${low ? ' is-low' : ''}${n ? ' is-pend' : ''}" data-n="${UI.esc(it.id)}">${
      (n && dose) ? UI.esc('−' + I18N.plural('sell.glass', n)) : UI.esc(it.bottleMl ? String(Math.floor(shown + 1e-6)) : UI.fmtQty(shown))}</span>`;
    return `<div class="row sell-row" data-row="${UI.esc(it.id)}">
      <span class="sell-main">
        <span class="row__art">${UI.art(it)}</span>
        <span class="row__body">
          <span class="row__t">${UI.esc(it.name)}</span>
          <span class="row__s">${UI.esc(UI.stockText(it))}${dose ? ' · ' + UI.esc(t('sell.doseTag', { ml: pourSizes(it).join('/') })) : ''}</span>
        </span>
      </span>
      <span class="sell-adj">
        <button type="button" class="sell-btn is-primary" data-adj="-1" data-id="${UI.esc(it.id)}" aria-label="−">−</button>
        ${dose ? pourSizes(it).map(ml => `<button type="button" class="sell-btn sell-pour" data-pour="${ml}" data-id="${UI.esc(it.id)}" aria-label="${ml} ml"><b>${ml}</b><i>ml</i></button>`).join('') : ''}
        ${numHtml}
        <button type="button" class="sell-btn" data-adj="1" data-id="${UI.esc(it.id)}" aria-label="+">+</button>
      </span>
    </div>`;
  }

  UI.registerScreen({
    id: 'sell',
    render(el) {
      if (!Store.state.session) { UI.go('login'); return; }
      const owner = Store.isOwner;
      const cats = [...Store.state.categories].sort((a, b) => a.sort - b.sort);
      const items = Store.activeItems();
      const nq = norm(V.q);
      const visible = items.filter(it =>
        (!nq || norm(it.name).includes(nq)) && (V.cat === 'all' || it.catId === V.cat));

      el.innerHTML = `
        <div class="topbar">
          ${owner ? `<button class="back" data-a="back">‹ ${UI.esc(t('g.back'))}</button>` : UI.logoMark(26)}
          <div class="topside">
            <button class="scanbtn" data-a="scan" aria-label="${UI.esc(t('sell.scan'))}">${UI.icon('scan')}</button>
            ${owner ? '' : `<button class="lockbtn" data-a="lock">${UI.esc(t('login.switchUser'))}</button>`}
          </div>
        </div>
        <div class="h1">${UI.esc(owner ? t('sell.title') : Store.me.name)}</div>
        <div class="sub2">${UI.esc(t('sell.hint'))}</div>
        <div class="search">
          ${UI.icon('search')}
          <input type="text" placeholder="${UI.esc(t('g.search'))}" value="${UI.esc(V.q)}" aria-label="${UI.esc(t('g.search'))}">
          ${V.q ? `<button class="iconbtn search__clear" data-a="clear" aria-label="×">${UI.icon('x')}</button>` : ''}
        </div>
        <div class="chips">
          <button class="chip ${V.cat === 'all' ? 'is-on' : ''}" data-cat="all"><span class="dot"></span>${UI.esc(t('g.all'))}</button>
          ${cats.map(c => `<button class="chip ${V.cat === c.id ? 'is-on' : ''}" data-cat="${c.id}"><span class="dot" style="background:${c.hex}"></span>${UI.esc(Store.catName(c))}</button>`).join('')}
        </div>
        ${visible.length ? `<div class="feed mt3">${visible.map(rowHtml).join('')}</div>`
          : `<div class="empty"><div class="empty__t">${UI.esc(t('sell.noresults'))}</div><div class="empty__s">${UI.esc(t('sell.noresults.hint'))}</div></div>`}`;

      const input = el.querySelector('.search input');
      input.addEventListener('input', () => { V.q = input.value; UI.refresh(); });
      if (V.q) requestAnimationFrame(() => {
        const i2 = el.querySelector('.search input');
        if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); }
      });

      el.addEventListener('pointerdown', e => {
        const pb = e.target.closest('[data-pour]');
        if (pb) { e.preventDefault(); pour(pb.dataset.id, Number(pb.dataset.pour)); return; }
        const b = e.target.closest('[data-adj]');
        if (!b) return;
        e.preventDefault();
        bump(b.dataset.id, Number(b.dataset.adj));
      });

      el.addEventListener('click', e => {
        if (e.target.closest('[data-adj]') || e.target.closest('[data-pour]')) return;
        const cat = e.target.closest('[data-cat]');
        if (cat) { V.cat = cat.dataset.cat; UI.haptic('light'); UI.refresh(); return; }
        const a = e.target.closest('[data-a]');
        if (!a) return;
        if (a.dataset.a === 'back') UI.go('dashboard');
        else if (a.dataset.a === 'lock') Store.logout();
        else if (a.dataset.a === 'clear') { V.q = ''; UI.refresh(); }
        else if (a.dataset.a === 'scan') {
          UI.scan({ onCode: code => {
            const item = Store.findByBarcode(code);
            if (item) { bump(item.id, -1); UI.haptic('success'); }
            else UI.toast(t('sell.noresults'), { type: 'danger' });
          } });
        }
      });
    },
  });
})();
