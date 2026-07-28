/* ============ Screen: sell — reference frame 02. Two gestures: tile → validate. ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'sell.stockEst': 'Stock estimé · {n}',
      'sell.validate': 'Valider la vente',
      'sell.lock': 'Verrouiller',
    },
    en: {
      'sell.stockEst': 'Estimated stock · {n}',
      'sell.validate': 'Confirm sale',
      'sell.lock': 'Lock',
    },
  });

  document.head.appendChild(UI.el(`<style>
  [data-screen=sell] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=sell] .h1{font:600 24px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  [data-screen=sell] .lockbtn{font-size:13px;font-weight:500;color:var(--t3)}
  [data-screen=sell] .scanbtn{width:32px;height:32px;border:0;display:flex;align-items:center;justify-content:center;color:var(--t3)}
  [data-screen=sell] .scanbtn svg{width:18px;height:18px}
  [data-screen=sell] .topside{display:flex;align-items:center;gap:8px}
  </style>`));

  const V = { q: '', cat: 'all' };
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function qtySheet(item) {
    const step = item.allowDecimal ? 0.5 : 1;
    let qty = 1;
    const c = UI.el(`<div>
      <div class="sheetrow">
        <div class="tile t40">${UI.art(item)}</div>
        <div><div class="sheetname">${UI.esc(item.name)}</div>
        <div class="sheetsub tnum">${UI.esc(t('sell.stockEst', { n: UI.fmtQty(Store.stock(item.id)) }))}</div></div>
      </div>
      <div class="stepper">
        <button class="stepper__btn" data-a="minus" aria-label="−">−</button>
        <div class="stepper__v tnum" data-v>1</div>
        <button class="stepper__btn" data-a="plus" aria-label="+">+</button>
      </div>
      <button class="btn btn--gold btn--full" data-a="ok">${UI.esc(t('sell.validate'))}</button>
    </div>`);
    const sh = UI.sheet(c);
    const vEl = c.querySelector('[data-v]');
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'minus') { qty = Math.max(step, Math.round((qty - (qty > 1 ? 1 : step)) * 100) / 100); vEl.textContent = UI.fmtQty(qty); UI.haptic('light'); }
      if (b.dataset.a === 'plus') { qty = Math.round((qty + (qty >= 1 ? 1 : step)) * 100) / 100; vEl.textContent = UI.fmtQty(qty); UI.haptic('light'); }
      if (b.dataset.a === 'ok') {
        const entry = Store.logSale(item.id, qty);
        UI.haptic('light');
        sh.close();
        if (entry) UI.toast(t('sell.logged', { qty: UI.fmtQty(qty), item: item.name }), {
          type: 'ok', action: { label: t('g.undo'), fn: () => { Store.undoSale(entry.id); } },
        });
      }
    });
  }

  function openScan() {
    UI.scan({
      onCode: code => {
        const item = Store.findByBarcode(code);
        if (item) qtySheet(item);
        else UI.toast(t('sell.noresults'), { type: 'danger' });
      },
    });
  }

  UI.registerScreen({
    id: 'sell',
    render(el, params) {
      if (!Store.state.session) { UI.go('login'); return; }
      const owner = Store.isOwner;
      const cats = [...Store.state.categories].sort((a, b) => a.sort - b.sort);
      const items = Store.activeItems();
      const nq = norm(V.q);
      const visible = items.filter(it =>
        (!nq || norm(it.name).includes(nq)) &&
        (V.cat === 'all' || it.catId === V.cat));
      const pinned = items.filter(i => i.pinned).slice(0, 5);

      el.innerHTML = `
        <div class="topbar">
          ${owner ? `<button class="back" data-a="back">‹ ${UI.esc(t('g.back'))}</button>` : `${UI.logoMark(26)}`}
          <div class="topside">
            <button class="scanbtn" data-a="scan" aria-label="${UI.esc(t('sell.scan'))}">${UI.icon('scan')}</button>
            ${owner ? '' : `<button class="lockbtn" data-a="lock">${UI.esc(t('sell.lock'))}</button>`}
          </div>
        </div>
        <div class="h1">${UI.esc(t('sell.title'))}</div>
        <div class="search">
          ${UI.icon('search')}
          <input type="text" placeholder="${UI.esc(t('g.search'))}" value="${UI.esc(V.q)}" aria-label="${UI.esc(t('g.search'))}">
          ${V.q ? `<button class="iconbtn search__clear" data-a="clear" aria-label="×">${UI.icon('x')}</button>` : ''}
        </div>

        ${(!nq && V.cat === 'all' && pinned.length) ? `
          <div class="sec"><div class="micro">${UI.esc(t('sell.favorites'))}</div></div>
          <div class="tilerow">${pinned.map(it => `
            <button class="tile t56" data-item="${it.id}" aria-label="${UI.esc(it.name)}">${UI.art(it)}</button>`).join('')}
          </div>` : ''}

        <div class="chips">
          <button class="chip ${V.cat === 'all' ? 'is-on' : ''}" data-cat="all"><span class="dot"></span>${UI.esc(t('g.all'))}</button>
          ${cats.map(c => `<button class="chip ${V.cat === c.id ? 'is-on' : ''}" data-cat="${c.id}"><span class="dot" style="background:${c.hex}"></span>${UI.esc(Store.catName(c))}</button>`).join('')}
        </div>

        ${visible.length ? `<div class="igrid">${visible.map(it => `
          <button class="icard" data-item="${it.id}">
            <div class="icard__art">${UI.art(it, '', { qty: UI.fmtQty(Store.stock(it.id)) })}</div>
            <div class="icard__name">${UI.esc(it.name)}</div>
          </button>`).join('')}</div>`
          : `<div class="empty"><div class="empty__t">${UI.esc(t('sell.noresults'))}</div><div class="empty__s">${UI.esc(t('sell.noresults.hint'))}</div></div>`}
      `;

      const input = el.querySelector('.search input');
      input.addEventListener('input', () => { V.q = input.value; UI.refresh(); });
      if (V.q) { requestAnimationFrame(() => { const i2 = el.querySelector('.search input'); if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); } }); }

      el.addEventListener('click', e => {
        const cat = e.target.closest('[data-cat]');
        if (cat) { V.cat = cat.dataset.cat; UI.haptic('light'); UI.refresh(); return; }
        const itEl = e.target.closest('[data-item]');
        if (itEl) { const item = Store.item(itEl.dataset.item); if (item) qtySheet(item); return; }
        const a = e.target.closest('[data-a]');
        if (!a) return;
        if (a.dataset.a === 'back') UI.go('dashboard');
        else if (a.dataset.a === 'lock') Store.logout();
        else if (a.dataset.a === 'scan') openScan();
        else if (a.dataset.a === 'clear') { V.q = ''; UI.refresh(); }
      });
    },
  });
})();
