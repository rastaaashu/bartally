/* ============ Screens: restock (livraison) + waste (casse & pertes) — owner only, reference patterns ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'rw.todayRestock': 'Livraisons du jour',
      'rw.todayWaste': 'Pertes du jour',
      'rw.inStock': 'En stock : {qty} {unit}',
      'rw.clear': 'Effacer la recherche',
      'restock.confirmBtn': 'Ajouter +{qty}',
      'waste.confirmBtn': 'Déclarer −{qty}',
      'restock.validate': 'Valider la livraison',
      'waste.validate': 'Valider la perte',
    },
    en: {
      'rw.todayRestock': "Today's deliveries",
      'rw.todayWaste': "Today's waste",
      'rw.inStock': 'In stock: {qty} {unit}',
      'rw.clear': 'Clear search',
      'restock.confirmBtn': 'Add +{qty}',
      'waste.confirmBtn': 'Log −{qty}',
      'restock.validate': 'Confirm delivery',
      'waste.validate': 'Confirm waste',
    },
  });

  document.head.appendChild(UI.el(`<style>
  [data-screen=restock] .topbar,[data-screen=waste] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=restock] .h1,[data-screen=waste] .h1{font:600 28px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  </style>`));

  /* transient per-screen UI state — survives store-driven re-renders (rule 9) */
  const ST = {
    restock: { q: '', cat: 'all' },
    waste: { q: '', cat: 'all' },
  };
  /* origin screen per mode — remembered across re-renders for back navigation */
  const FROM = { restock: null, waste: null };
  const QUICK = [1, 6, 12, 24];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function filtered(mode) {
    const st = ST[mode];
    let items = Store.activeItems();
    if (st.cat !== 'all') items = items.filter(i => i.catId === st.cat);
    const q = norm(st.q.trim());
    if (q) items = items.filter(i => norm(i.name).includes(q));
    return items;
  }

  /* ---- item grid: reference frame 02 anatomy (art + corner qty, caption below) ---- */
  function icardHtml(it) {
    return `<button type="button" class="icard" data-item="${it.id}" aria-label="${UI.esc(it.name)}">
      <div class="icard__art">${UI.art(it, '', { qty: UI.fmtQty(Store.stock(it.id)) })}</div>
      <div class="icard__name">${UI.esc(it.name)}</div>
    </button>`;
  }

  function gridSection(mode) {
    const items = filtered(mode);
    if (!items.length) {
      const searching = !!ST[mode].q.trim();
      return `<div class="empty">
        <div class="empty__t">${UI.esc(t(searching ? 'sell.noresults' : 'inv.empty'))}</div>
        ${searching ? `<div class="empty__s">${UI.esc(t('sell.noresults.hint'))}</div>` : ''}
      </div>`;
    }
    return `<div class="igrid">${items.map(icardHtml).join('')}</div>`;
  }

  /* ---- today's entries: micro section label + hairline feed rows, no boxes ---- */
  function todaySection(mode) {
    const bd = Store.todayBd();
    const isWaste = mode === 'waste';
    const entries = (isWaste ? Store.state.waste : Store.state.restocks).filter(e => e.bd === bd);
    if (!entries.length) return '';
    const sign = isWaste ? '−' : '+';
    const color = isWaste ? 'var(--bad)' : 'var(--ok)';
    return `
      <div class="sec"><div class="micro">${UI.esc(t('g.today'))}</div><div class="micro tnum">${entries.length}</div></div>
      <div class="feed">
        ${entries.map(e => {
          const it = Store.item(e.itemId);
          const cat = it && Store.cat(it.catId);
          return `<div class="row">
            <span class="feedtick" style="background:${cat ? cat.hex : 'var(--t3)'}"></span>
            <div class="row__body">
              <div class="row__t">${UI.esc(it ? it.name : '?')}</div>
              ${isWaste && e.reason ? `<div class="row__s">${UI.esc(e.reason)}</div>` : ''}
            </div>
            <span class="qtybubble" style="color:${color}">${sign}${UI.esc(UI.fmtQty(e.qty))}</span>
            <div class="row__end"><div class="tnum" style="font-size:12px;color:var(--t3)">${UI.esc(UI.fmtTime(e.at))}</div></div>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ---- qty sheet (mirrors the sale sheet; quick chips; waste adds required reason) ---- */
  function openQtySheet(mode, itemId) {
    const item = Store.item(itemId);
    if (!item || !Store.isOwner) return;
    const isWaste = mode === 'waste';
    const dec = !!item.allowDecimal;
    const min = dec ? 0.5 : 1;
    const quicks = dec ? [0.5, ...QUICK] : QUICK;
    let qty = 1;
    const c = UI.el(`<div>
      <div class="sheetrow">
        <div class="tile t40">${UI.art(item)}</div>
        <div><div class="sheetname">${UI.esc(item.name)}</div>
        <div class="sheetsub tnum">${UI.esc(t('sell.stockEst', { n: UI.fmtQty(Store.stock(item.id)) }))}</div></div>
      </div>
      <div class="stepper">
        <button type="button" class="stepper__btn" data-a="minus" aria-label="−1">−</button>
        <div class="stepper__v tnum" data-el="v">1</div>
        <button type="button" class="stepper__btn" data-a="plus" aria-label="+1">+</button>
      </div>
      <div style="display:flex;gap:8px;justify-content:center">
        ${quicks.map(n => `<button type="button" class="chip num" data-q="${n}" style="min-width:52px;justify-content:center">${UI.fmtQty(n)}</button>`).join('')}
      </div>
      ${isWaste ? `
      <div class="field" style="margin-top:20px;margin-bottom:0">
        <label for="rw-reason">${UI.esc(t('waste.reason'))}</label>
        <input id="rw-reason" type="text" data-el="reason" placeholder="${UI.esc(t('waste.reasonPh'))}" maxlength="140" autocomplete="off" enterkeyhint="done">
        <div class="hidden" data-el="reasonHelp" style="color:var(--bad);font-size:12px;margin-top:8px">${UI.esc(t('waste.reasonRequired'))}</div>
      </div>` : ''}
      <button type="button" class="btn btn--gold btn--full" data-a="ok" style="margin-top:20px">${UI.esc(t(isWaste ? 'waste.validate' : 'restock.validate'))}</button>
    </div>`);
    const s = UI.sheet(c);
    const vEl = c.querySelector('[data-el=v]');
    const okBtn = c.querySelector('[data-a=ok]');
    const minusBtn = c.querySelector('[data-a=minus]');
    const chips = [...c.querySelectorAll('[data-q]')];
    const reasonInp = c.querySelector('[data-el=reason]');
    const helpEl = c.querySelector('[data-el=reasonHelp]');

    const blocked = () => isWaste && !reasonInp.value.trim();
    function sync() {
      vEl.textContent = UI.fmtQty(qty);
      minusBtn.style.opacity = qty <= min ? '.4' : '';
      chips.forEach(ch => ch.classList.toggle('is-on', Number(ch.dataset.q) === qty));
      okBtn.style.opacity = blocked() ? '.55' : '';
      okBtn.setAttribute('aria-disabled', blocked() ? 'true' : 'false');
    }
    sync();

    function confirm() {
      /* read fresh data at action time (rule 9) */
      const fresh = Store.item(item.id);
      if (!fresh || !Store.isOwner) { s.close(); return; }
      if (isWaste) {
        const reason = reasonInp.value.trim();
        if (!reason) {
          helpEl.classList.remove('hidden');
          reasonInp.style.borderColor = 'var(--bad)';
          UI.haptic('warn');
          reasonInp.focus();
          return;
        }
        Store.logWaste(fresh.id, qty, reason);
        UI.haptic('warn');
        UI.toast(t('waste.logged', { qty: UI.fmtQty(qty), item: fresh.name }), { type: 'ok' });
      } else {
        Store.logRestock(fresh.id, qty);
        UI.haptic('success');
        UI.toast(t('restock.logged', { qty: UI.fmtQty(qty), item: fresh.name }), { type: 'ok' });
      }
      s.close();
    }

    c.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'minus') { if (qty > min) { qty = qty <= 1 ? min : qty - 1; UI.haptic('light'); sync(); } return; }
      if (b.dataset.a === 'plus') { if (qty < 999) { qty = dec && qty === 0.5 ? 1 : qty + 1; UI.haptic('light'); sync(); } return; }
      if (b.dataset.q) { qty = Number(b.dataset.q); UI.haptic('light'); sync(); return; }
      if (b.dataset.a === 'ok') confirm();
    });
    if (reasonInp) {
      reasonInp.addEventListener('input', () => {
        if (reasonInp.value.trim()) { helpEl.classList.add('hidden'); reasonInp.style.borderColor = ''; }
        sync();
      });
      reasonInp.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); });
    }
  }

  /* ---- shared screen renderer ---- */
  function renderScreen(mode, el, params) {
    if (!Store.isOwner) { UI.go(Store.state.session ? 'sell' : 'login'); return; }
    if (params && params.from) FROM[mode] = params.from;
    const st = ST[mode];
    const cats = Store.state.categories.slice().sort((a, b) => a.sort - b.sort);
    el.innerHTML = `
      <div class="topbar">
        <button type="button" class="back" data-a="back">‹ ${UI.esc(t('g.back'))}</button>
        <div class="micro tnum">${UI.esc(UI.fmtDate(Store.todayBd()))}</div>
      </div>
      <div class="h1">${UI.esc(t(mode + '.title'))}</div>
      <div class="sub2">${UI.esc(t(mode + '.hint'))}</div>
      ${mode === 'restock' ? `<button type="button" class="textbtn" data-a="invoice" style="margin:4px 0 8px">📷 ${UI.esc(t('rw.invoice'))}</button>` : ''}
      <div class="search">
        ${UI.icon('search')}
        <input type="text" data-el="q" placeholder="${UI.esc(t('g.search'))}" value="${UI.esc(st.q)}" autocomplete="off" enterkeyhint="search" aria-label="${UI.esc(t('g.search'))}">
        <button type="button" class="iconbtn iconbtn--plain search__clear ${st.q ? '' : 'hidden'}" data-a="clear" aria-label="${UI.esc(t('rw.clear'))}">${UI.icon('x')}</button>
      </div>
      <div class="chips" data-el="chips">
        <button type="button" class="chip ${st.cat === 'all' ? 'is-on' : ''}" data-cat="all"><span class="dot"></span>${UI.esc(t('g.all'))}</button>
        ${cats.map(cat => `<button type="button" class="chip ${st.cat === cat.id ? 'is-on' : ''}" data-cat="${cat.id}"><span class="dot" style="background:${cat.hex}"></span>${UI.esc(Store.catName(cat))}</button>`).join('')}
      </div>
      <div data-el="gridwrap">${gridSection(mode)}</div>
      ${todaySection(mode)}
    `;
    const qInp = el.querySelector('[data-el=q]');
    const clearBtn = el.querySelector('[data-a=clear]');
    const gridwrap = el.querySelector('[data-el=gridwrap]');
    const chipsEl = el.querySelector('[data-el=chips]');

    const updateGrid = () => { gridwrap.innerHTML = gridSection(mode); };

    qInp.addEventListener('input', () => {
      st.q = qInp.value;
      clearBtn.classList.toggle('hidden', !st.q);
      updateGrid();
    });
    qInp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const list = filtered(mode);
        if (list.length === 1) openQtySheet(mode, list[0].id);
      }
    });
    clearBtn.addEventListener('click', () => {
      st.q = '';
      qInp.value = '';
      clearBtn.classList.add('hidden');
      updateGrid();
      qInp.focus();
    });
    chipsEl.addEventListener('click', e => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      st.cat = b.dataset.cat;
      UI.haptic('light');
      chipsEl.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('is-on', ch.dataset.cat === st.cat));
      updateGrid();
    });
    el.addEventListener('click', e => {
      if (e.target.closest('[data-a=back]')) { UI.haptic('light'); UI.go(FROM[mode] || 'dashboard'); return; }
      if (e.target.closest('[data-a=invoice]')) { invoiceFlow(); return; }
      const card = e.target.closest('[data-item]');
      if (card) openQtySheet(mode, card.dataset.item);
    });
  }

  /* ---- invoice photo → AI line extraction → confirmed Livraison entries ----
     Needs the invoice-scan Edge Function deployed on the Supabase project;
     until then the button reports "unavailable" and changes nothing. */
  async function invoiceFlow() {
    const img = await UI.pickImage({ capture: true, max: 1600, quality: .8 });
    if (!img) return;
    UI.toast(t('rw.invoiceBusy'), { type: 'ok' });
    let lines;
    try {
      const r = await fetch(`${SYNC_CONFIG.url}/functions/v1/invoice-scan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: SYNC_CONFIG.anon, authorization: `Bearer ${SYNC_CONFIG.anon}` },
        body: JSON.stringify({
          image: img,
          items: Store.activeItems().map(i => ({ id: i.id, name: i.name })),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      lines = (await r.json()).lines;
    } catch (e) {
      UI.toast(t('rw.invoiceFail'), { type: 'danger' });
      return;
    }
    if (!Array.isArray(lines) || !lines.length) { UI.toast(t('rw.invoiceNone'), { type: 'warn' }); return; }
    const sel = lines.map(l => ({ ...l, on: !!l.itemId && l.qty > 0 }));
    const c = UI.el(`<div>
      <h2 style="font-size:18px;margin-bottom:12px">${UI.esc(t('rw.invoiceTitle'))}</h2>
      <div data-r="lines" style="max-height:46vh;overflow:auto;margin-bottom:14px"></div>
      <button type="button" class="btn btn--gold btn--full" data-a="apply">${UI.esc(t('rw.invoiceApply'))}</button>
    </div>`);
    const s = UI.sheet(c);
    const paint = () => {
      c.querySelector('[data-r=lines]').innerHTML = sel.map((l, i) => {
        const it = l.itemId ? Store.item(l.itemId) : null;
        return `<button type="button" data-l="${i}" style="display:flex;gap:10px;align-items:center;width:100%;padding:11px 6px;border:0;background:none;text-align:left;opacity:${it ? 1 : .45}">
          <span style="width:22px;font-size:17px">${l.on ? '☑' : '☐'}</span>
          <span style="flex:1"><b>+${UI.esc(String(l.qty))}</b> × ${UI.esc(it ? it.name : l.label)}</span>
          ${it ? '' : `<span class="sub2">${UI.esc(t('rw.invoiceUnmatched'))}</span>`}
        </button>`;
      }).join('');
    };
    paint();
    c.addEventListener('click', e => {
      const row = e.target.closest('[data-l]');
      if (row) {
        const l = sel[+row.dataset.l];
        if (l.itemId && l.qty > 0) { l.on = !l.on; UI.haptic('light'); paint(); }
        return;
      }
      if (!e.target.closest('[data-a=apply]')) return;
      let n = 0;
      for (const l of sel) if (l.on && l.itemId && Store.item(l.itemId)) { Store.logRestock(l.itemId, Math.round(l.qty * 1000) / 1000); n++; }
      UI.haptic('success');
      UI.toast(`+${n} Livraison`, { type: 'ok' });
      s.close();
      UI.refresh();
    });
  }

  UI.registerScreen({ id: 'restock', render(el, params) { renderScreen('restock', el, params); } });
  UI.registerScreen({ id: 'waste', render(el, params) { renderScreen('waste', el, params); } });
})();
