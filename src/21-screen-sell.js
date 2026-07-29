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
      'sell.hint': 'Appuyez sur − à chaque article vendu. Maintenez pour aller vite.',
      'sell.left': 'en stock',
    },
    en: {
      'sell.stockEst': 'Estimated stock · {n}',
      'sell.validate': 'Confirm sale',
      'sell.lock': 'Lock',
      'sell.sold': 'Sold: {n} × {item}',
      'sell.hint': 'Tap − for each item sold. Hold to go faster.',
      'sell.left': 'in stock',
    },
  });

  document.head.appendChild(UI.el(`<style>
  [data-screen=sell] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=sell] .h1{font:600 24px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  [data-screen=sell] .topside{display:flex;align-items:center;gap:8px}
  [data-screen=sell] .lockbtn{font-size:13px;font-weight:500;color:var(--t3)}
  [data-screen=sell] .scanbtn{width:32px;height:32px;border:0;display:flex;align-items:center;justify-content:center;color:var(--t3)}
  [data-screen=sell] .scanbtn svg{width:18px;height:18px}
  [data-screen=sell] .sell-row{padding:0}
  [data-screen=sell] .sell-main{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:7px 0;text-align:left}
  [data-screen=sell] .sell-adj{display:flex;align-items:center;gap:2px;flex:none;margin-left:8px}
  [data-screen=sell] .sell-btn{width:44px;height:44px;border-radius:10px;border:1px solid var(--hair);
    background:var(--surface);color:var(--t2);font:500 22px var(--f-display);line-height:1;
    display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;transition:background .1s,color .1s}
  [data-screen=sell] .sell-btn:active{background:var(--surface2);color:var(--t1)}
  [data-screen=sell] .sell-btn.is-primary{border-color:rgba(232,177,78,.4);color:var(--brass)}
  [data-screen=sell] .sell-n{min-width:44px;text-align:center;font-size:17px}
  [data-screen=sell] .sell-n.is-pend{color:var(--brass)}
  [data-screen=sell] .sell-n.is-low{color:var(--bad)}
  </style>`));

  const V = { q: '', cat: 'all' };
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* pending sale units per item; a burst of taps becomes ONE sale entry */
  const Q = { pending: {}, timers: {}, hold: null, repeat: null };

  function paint(id) {
    const el = document.querySelector(`[data-n="${CSS.escape(id)}"]`);
    if (!el) return;
    const pend = Q.pending[id] || 0;
    const shown = Math.round((Store.stock(id) - pend) * 100) / 100;
    el.textContent = UI.fmtQty(shown);
    el.classList.toggle('is-pend', !!pend);
    el.classList.toggle('is-low', !pend && Store.isLow(id));
  }

  function bump(id, dir) {
    const it = Store.item(id); if (!it) return;
    const step = it.allowDecimal ? 0.5 : 1;
    // dir −1 = one more sold; dir +1 only walks back what is still uncommitted
    const next = Math.round(((Q.pending[id] || 0) + (dir < 0 ? step : -step)) * 100) / 100;
    if (next < 0) return;
    Q.pending[id] = next;
    UI.haptic('light');
    paint(id);
    clearTimeout(Q.timers[id]);
    Q.timers[id] = setTimeout(() => commit(id), 900);
  }

  function commit(id) {
    const qty = Q.pending[id];
    delete Q.pending[id];
    clearTimeout(Q.timers[id]);
    if (!qty) return;
    const it = Store.item(id);
    const entry = Store.logSale(id, qty);
    if (!entry) return;
    UI.toast(t('sell.sold', { n: UI.fmtQty(qty), item: it.name }), {
      type: 'ok',
      action: { label: t('g.undo'), fn: () => Store.undoSale(entry.id) },
    });
  }

  function startHold(id, dir) {
    stopHold();
    let speed = 320;
    Q.hold = setTimeout(function run() {
      bump(id, dir);
      speed = Math.max(70, speed - 45);
      Q.repeat = setTimeout(run, speed);
    }, 420);
  }
  function stopHold() { clearTimeout(Q.hold); clearTimeout(Q.repeat); Q.hold = Q.repeat = null; }

  function rowHtml(it) {
    const pend = Q.pending[it.id] || 0;
    const shown = Math.round((Store.stock(it.id) - pend) * 100) / 100;
    const low = !pend && Store.isLow(it.id);
    return `<div class="row sell-row" data-row="${UI.esc(it.id)}">
      <span class="sell-main">
        <span class="row__art">${UI.art(it)}</span>
        <span class="row__body">
          <span class="row__t">${UI.esc(it.name)}</span>
          <span class="row__s">${UI.esc(t('u.' + it.unit))}</span>
        </span>
      </span>
      <span class="sell-adj">
        <button type="button" class="sell-btn is-primary" data-adj="-1" data-id="${UI.esc(it.id)}" aria-label="−">−</button>
        <span class="num sell-n${low ? ' is-low' : ''}${pend ? ' is-pend' : ''}" data-n="${UI.esc(it.id)}">${UI.esc(UI.fmtQty(shown))}</span>
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
        const b = e.target.closest('[data-adj]');
        if (!b) return;
        e.preventDefault();
        bump(b.dataset.id, Number(b.dataset.adj));
        startHold(b.dataset.id, Number(b.dataset.adj));
      });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, stopHold);
      window.addEventListener('pointerup', stopHold);

      el.addEventListener('click', e => {
        if (e.target.closest('[data-adj]')) return;
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
