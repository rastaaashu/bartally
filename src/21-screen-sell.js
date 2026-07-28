/* ============ Sell screen — the 2-tap sale logger (both roles) ============ */
(() => {
  I18N.extend({
    fr: {
      'sell.instock': '{qty} {unit} en stock',
      'sell.empty': 'Aucun article à vendre',
      'sell.empty.hint': 'Ajoutez vos articles depuis l’écran Stock.',
    },
    en: {
      'sell.instock': '{qty} {unit} in stock',
      'sell.empty': 'No items to sell',
      'sell.empty.hint': 'Add your items from the Stock screen.',
    },
  });

  document.head.appendChild(UI.el(`<style>
    [data-screen=sell] .sellsec{display:flex;align-items:center;gap:7px;margin:var(--s5) 2px var(--s3)}
    [data-screen=sell] .sellsec svg{width:14px;height:14px;color:var(--gold)}
    [data-screen=sell] .sellsec .dot{width:8px;height:8px;border-radius:50%;background:var(--c,var(--gold));flex:none}
    [data-screen=sell] .sellsec .tt{margin-left:auto}
    [data-screen=sell] .favrow{display:flex;gap:var(--s3);overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none;-ms-overflow-style:none}
    [data-screen=sell] .favrow::-webkit-scrollbar{display:none}
    [data-screen=sell] .favrow .icard{flex:none;width:31%;min-width:104px}
    [data-screen=sell] .rrow{display:flex;gap:var(--s2);overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none;-ms-overflow-style:none}
    [data-screen=sell] .rrow::-webkit-scrollbar{display:none}
    [data-screen=sell] .rchip{flex:none;display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 15px 0 7px;border-radius:var(--r-pill);background:var(--surface-2);border:1px solid var(--hairline);font-size:13px;font-weight:600;color:var(--text);transition:transform .12s,background .15s}
    [data-screen=sell] .rchip:active{transform:scale(.96);background:var(--surface-3)}
    [data-screen=sell] .rchip__art{width:34px;height:34px;border-radius:10px;overflow:hidden;background:var(--surface-3);flex:none}
    [data-screen=sell] .rchip__art svg,[data-screen=sell] .rchip__art img{width:100%;height:100%;object-fit:cover}
    [data-screen=sell] .icard{text-align:left;width:100%}
    [data-screen=sell] .sellbody>*{animation:sell-f .28s cubic-bezier(.2,.8,.3,1) both}
    [data-screen=sell] .qs{text-align:center}
    [data-screen=sell] .qs__art{width:104px;height:120px;margin:0 auto var(--s3);border-radius:18px;overflow:hidden;background:var(--surface-2);border:1px solid var(--hairline)}
    [data-screen=sell] .qs__art svg,[data-screen=sell] .qs__art img{width:100%;height:100%;object-fit:cover}
    [data-screen=sell] .qs__name{font-size:19px}
    [data-screen=sell] .qs__stock{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text-2);font-size:13px;margin-top:5px}
    [data-screen=sell] .qs__quick{display:flex;justify-content:center;gap:var(--s2);margin-top:var(--s4)}
    [data-screen=sell] .qs__quick .chip{height:44px;min-width:64px;justify-content:center;font-size:15px}
    [data-screen=sell] .stepper__btn[disabled]{opacity:.35;pointer-events:none}
    [data-screen=sell] .stepper__v.is-bump{animation:sell-bump .16s ease}
    @keyframes sell-f{from{opacity:0;transform:translateY(6px)}}
    @keyframes sell-bump{50%{transform:scale(1.08)}}
  </style>`));

  /* transient UI state — survives store-driven re-renders */
  let sellQ = '';
  let sellCat = 'all';

  const norm = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const secHTML = (ic, label) =>
    `<div class="sellsec">${UI.icon(ic)}<span class="eyebrow">${UI.esc(label)}</span></div>`;

  function icardHTML(it) {
    const stock = Store.stock(it.id);
    const low = Store.isLow(it.id);
    return `<button class="icard" type="button" data-item="${UI.esc(it.id)}">
      <div class="icard__art">${UI.art(it)}</div>
      ${low ? `<span class="icard__badge pill pill--danger">${UI.esc(t('inv.low'))}</span>` : ''}
      <div class="icard__name">${UI.esc(it.name)}</div>
      <div class="icard__meta"><span class="num">${UI.fmtQty(stock)}</span> ${UI.esc(t('u.' + it.unit))}</div>
    </button>`;
  }

  const rchipHTML = it =>
    `<button class="rchip" type="button" data-item="${UI.esc(it.id)}"><span class="rchip__art">${UI.art(it)}</span>${UI.esc(it.name)}</button>`;

  function bodyHTML() {
    const items = Store.activeItems();
    if (!items.length) {
      return `<div class="empty">${UI.icon('stock')}
        <div class="empty__t">${UI.esc(t('sell.empty'))}</div>
        <div class="empty__s">${UI.esc(t('sell.empty.hint'))}</div></div>`;
    }
    const inCat = sellCat === 'all' ? items : items.filter(i => i.catId === sellCat);

    /* search active → flat grid, accent/case-insensitive */
    if (sellQ.trim()) {
      const nq = norm(sellQ.trim());
      const hits = inCat.filter(i => norm(i.name).includes(nq));
      if (!hits.length) {
        return `<div class="empty">${UI.icon('search')}
          <div class="empty__t">${UI.esc(t('sell.noresults'))}</div>
          <div class="empty__s">${UI.esc(t('sell.noresults.hint'))}</div></div>`;
      }
      return `<div class="igrid">${hits.map(icardHTML).join('')}</div>`;
    }

    let out = '';
    if (sellCat === 'all') {
      const favs = items.filter(i => i.pinned);
      if (favs.length) out += secHTML('pin', t('sell.favorites')) + `<div class="favrow">${favs.map(icardHTML).join('')}</div>`;
      const rec = Store.state.recents.map(id => Store.item(id)).filter(i => i && i.active);
      if (rec.length) out += secHTML('clock', t('sell.recents')) + `<div class="rrow">${rec.map(rchipHTML).join('')}</div>`;
    }
    const cats = Store.state.categories.slice().sort((a, b) => a.sort - b.sort)
      .filter(c => sellCat === 'all' || c.id === sellCat);
    for (const c of cats) {
      const list = items.filter(i => i.catId === c.id);
      if (!list.length) continue;
      out += `<div class="sellsec"><span class="dot" style="--c:${UI.esc(c.color)}"></span>
          <span class="eyebrow">${UI.esc(Store.catName(c))}</span><span class="tt num">${list.length}</span></div>
        <div class="igrid">${list.map(icardHTML).join('')}</div>`;
    }
    if (!out) out = `<div class="empty">${UI.icon('stock')}<div class="empty__t">${UI.esc(t('inv.empty'))}</div></div>`;
    return out;
  }

  /* ---- quantity sheet: tap 2 of 2 ---- */
  function openQty(itemId) {
    const it = Store.item(itemId);
    if (!it || !it.active) return;
    const stock = Store.stock(it.id);
    const low = Store.isLow(it.id);
    const dec = !!it.allowDecimal;
    const min = dec ? 0.5 : 1, max = 999;
    let qty = 1;

    const c = UI.el(`<div data-screen="sell"><div class="qs">
      <div class="qs__art">${UI.art(it)}</div>
      <h2 class="qs__name">${UI.esc(it.name)}</h2>
      <div class="qs__stock">
        <span>${UI.esc(t('sell.instock', { qty: UI.fmtQty(stock), unit: t('u.' + it.unit) }))}</span>
        ${low ? `<span class="pill pill--danger">${UI.esc(t('inv.low'))}</span>` : ''}
      </div>
      <div class="eyebrow" style="margin-top:var(--s5)">${UI.esc(t('sell.qty'))}</div>
      <div class="stepper" style="margin-top:var(--s3)">
        <button class="stepper__btn" type="button" data-a="minus">${UI.icon('minus')}</button>
        <div class="stepper__v num" data-v></div>
        <button class="stepper__btn" type="button" data-a="plus">${UI.icon('plus')}</button>
      </div>
      ${dec ? `<div class="qs__quick">${[0.5, 1, 2].map(v =>
        `<button class="chip" type="button" data-q="${v}"><span class="num">${UI.fmtQty(v)}</span></button>`).join('')}</div>` : ''}
      <button class="btn btn--gold btn--big btn--full" style="margin-top:var(--s6)" type="button" data-a="ok">${UI.esc(t('g.confirm'))}</button>
    </div></div>`);

    const vEl = c.querySelector('[data-v]');
    const minusB = c.querySelector('[data-a=minus]');
    const setQ = v => {
      qty = Math.min(max, Math.max(min, Math.round(v * 100) / 100));
      vEl.textContent = UI.fmtQty(qty);
      vEl.classList.remove('is-bump'); void vEl.offsetWidth; vEl.classList.add('is-bump');
      if (qty <= min) minusB.setAttribute('disabled', ''); else minusB.removeAttribute('disabled');
      for (const b of c.querySelectorAll('[data-q]')) b.classList.toggle('is-on', Number(b.dataset.q) === qty);
    };
    const s = UI.sheet(c);
    setQ(1);

    c.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.q) { UI.haptic('light'); return setQ(Number(b.dataset.q)); }
      if (b.dataset.a === 'plus') { UI.haptic('light'); return setQ(dec && qty === 0.5 ? 1 : qty + 1); }
      if (b.dataset.a === 'minus') { UI.haptic('light'); return setQ(qty <= 1 ? min : qty - 1); }
      if (b.dataset.a === 'ok') {
        const fresh = Store.item(itemId); /* fresh data at action time */
        if (!fresh || !fresh.active) { s.close(); return void UI.toast(t('g.error'), { type: 'danger' }); }
        const entry = Store.logSale(fresh.id, qty);
        if (!entry) return void UI.toast(t('g.error'), { type: 'danger' });
        UI.haptic('light');
        s.close();
        UI.toast(t('sell.logged', { qty: UI.fmtQty(qty), item: fresh.name }), {
          type: 'ok', ms: 6000,
          action: {
            label: t('g.undo'),
            fn: () => { if (Store.undoSale(entry.id)) { UI.haptic('warn'); UI.toast(t('sell.undone')); } },
          },
        });
      }
    });
  }

  function startScan() {
    UI.haptic('light');
    UI.scan({
      onCode(code) {
        const it = Store.findByBarcode(code);
        if (it) openQty(it.id);
        else UI.toast(t('sell.noresults'), { type: 'danger' });
      },
    });
  }

  UI.registerScreen({
    id: 'sell',
    render(el) {
      const st = Store.state;
      /* scan always shown: UI.scan falls back to manual code entry */
      let actions = `<button class="iconbtn" type="button" data-a="scan" aria-label="${UI.esc(t('sell.scan'))}">${UI.icon('scan')}</button>`;
      if (!Store.isOwner) actions += `<button class="iconbtn" type="button" data-a="lock" aria-label="${UI.esc(t('login.switchUser'))}">${UI.icon('lock')}</button>`;

      el.innerHTML = UI.header(t('sell.title'), st.settings.barName, actions) + `
        <div class="search">
          ${UI.icon('search')}
          <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${UI.esc(t('g.search'))}">
          <button class="iconbtn iconbtn--plain search__clear ${sellQ ? '' : 'hidden'}" type="button" data-a="clear">${UI.icon('x')}</button>
        </div>
        <div class="chips" data-cats></div>
        <div class="sellbody" data-body></div>`;

      const input = el.querySelector('.search input');
      const clearB = el.querySelector('[data-a=clear]');
      const bodyEl = el.querySelector('[data-body]');
      const catsEl = el.querySelector('[data-cats]');
      input.value = sellQ; /* keep search text across re-renders */

      const drawCats = () => {
        const cats = st.categories.slice().sort((a, b) => a.sort - b.sort);
        catsEl.innerHTML =
          `<button class="chip ${sellCat === 'all' ? 'is-on' : ''}" type="button" data-cat="all">${UI.esc(t('g.all'))}</button>` +
          cats.map(cg => `<button class="chip ${sellCat === cg.id ? 'is-on' : ''}" type="button" data-cat="${UI.esc(cg.id)}"><span class="dot" style="--c:${UI.esc(cg.color)}"></span>${UI.esc(Store.catName(cg))}</button>`).join('');
      };
      const drawBody = () => { bodyEl.innerHTML = bodyHTML(); };
      drawCats(); drawBody();

      input.addEventListener('input', () => {
        sellQ = input.value;
        clearB.classList.toggle('hidden', !sellQ);
        drawBody();
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });

      el.addEventListener('click', e => {
        const cb = e.target.closest('[data-cat]');
        if (cb) { sellCat = cb.dataset.cat; UI.haptic('light'); drawCats(); drawBody(); return; }
        const ib = e.target.closest('[data-item]');
        if (ib) { UI.haptic('light'); openQty(ib.dataset.item); return; }
        const a = e.target.closest('[data-a]');
        if (!a) return;
        if (a.dataset.a === 'clear') { sellQ = ''; input.value = ''; clearB.classList.add('hidden'); drawBody(); input.focus(); }
        else if (a.dataset.a === 'scan') startScan();
        else if (a.dataset.a === 'lock') { UI.haptic('light'); Store.logout(); }
      });
    },
  });
})();
