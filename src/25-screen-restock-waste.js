/* ============ Screens: restock (livraison) + waste (casse & pertes) — owner only ============ */
(() => {
  I18N.extend({
    fr: {
      'rw.todayRestock': 'Livraisons du jour',
      'rw.todayWaste': 'Pertes du jour',
      'rw.inStock': 'En stock : {qty} {unit}',
      'rw.clear': 'Effacer la recherche',
      'restock.confirmBtn': 'Ajouter +{qty}',
      'waste.confirmBtn': 'Déclarer −{qty}',
    },
    en: {
      'rw.todayRestock': "Today's deliveries",
      'rw.todayWaste': "Today's waste",
      'rw.inStock': 'In stock: {qty} {unit}',
      'rw.clear': 'Clear search',
      'restock.confirmBtn': 'Add +{qty}',
      'waste.confirmBtn': 'Log −{qty}',
    },
  });

  /* transient per-screen UI state — survives store-driven re-renders (rule 9) */
  const ST = {
    restock: { q: '', cat: 'all' },
    waste: { q: '', cat: 'all' },
  };
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

  function icardHtml(it) {
    const stock = Store.stock(it.id);
    const low = Store.isLow(it.id);
    return `<button type="button" class="icard" data-item="${it.id}" aria-label="${UI.esc(it.name)}">
      <div class="icard__art">${UI.art(it)}</div>
      ${low ? `<span class="pill pill--danger icard__badge">${UI.esc(t('inv.low'))}</span>` : ''}
      <div class="icard__name">${UI.esc(it.name)}</div>
      <div class="icard__meta"><span class="num">${UI.fmtQty(stock)}</span> ${UI.esc(t('u.' + it.unit))}</div>
    </button>`;
  }

  function gridSection(mode) {
    const items = filtered(mode);
    if (!items.length) {
      const searching = !!ST[mode].q.trim();
      return `<div class="empty">${UI.icon(mode === 'waste' ? 'spill' : 'truck')}
        <div class="empty__t">${UI.esc(t(searching ? 'sell.noresults' : 'inv.empty'))}</div>
        ${searching ? `<div class="empty__s">${UI.esc(t('sell.noresults.hint'))}</div>` : ''}
      </div>`;
    }
    return `<div class="igrid">${items.map(icardHtml).join('')}</div>`;
  }

  function todayCardHtml(mode) {
    const bd = Store.todayBd();
    const isWaste = mode === 'waste';
    const entries = (isWaste ? Store.state.waste : Store.state.restocks).filter(e => e.bd === bd);
    if (!entries.length) return '';
    const total = Math.round(entries.reduce((s, e) => s + e.qty, 0) * 100) / 100;
    const sign = isWaste ? '−' : '+';
    const color = isWaste ? 'var(--danger)' : 'var(--ok)';
    return `<div class="card mt4">
      <div class="card__head">
        <div class="card__title">${UI.esc(t(isWaste ? 'rw.todayWaste' : 'rw.todayRestock'))}</div>
        <span class="pill ${isWaste ? 'pill--danger' : 'pill--ok'} num">${sign}${UI.fmtQty(total)}</span>
      </div>
      <div class="feed">
        ${entries.map(e => {
          const it = Store.item(e.itemId);
          return `<div class="row">
            <span class="qtybubble num" style="color:${color};min-width:46px;text-align:right;flex:none">${sign}${UI.fmtQty(e.qty)}</span>
            <div class="row__body">
              <div class="row__t">${UI.esc(it ? it.name : '?')}</div>
              ${isWaste && e.reason ? `<div class="row__s tt">${UI.esc(e.reason)}</div>` : ''}
            </div>
            <div class="row__end tt num">${UI.esc(UI.fmtTime(e.at))}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ---- qty sheet (stepper + quick chips; waste adds required reason) ---- */
  function openQtySheet(mode, itemId) {
    const item = Store.item(itemId);
    if (!item || !Store.isOwner) return;
    const isWaste = mode === 'waste';
    let qty = 1;
    const c = UI.el(`<div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
        <div class="row__art" style="width:52px;height:52px">${UI.art(item)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:var(--f-display);font-weight:700;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.esc(item.name)}</div>
          <div class="tt" style="margin-top:2px">${UI.esc(t('rw.inStock', { qty: UI.fmtQty(Store.stock(item.id)), unit: t('u.' + item.unit) }))}</div>
        </div>
      </div>
      <div class="stepper">
        <button type="button" class="stepper__btn" data-a="minus" aria-label="−1">−</button>
        <div class="stepper__v num" data-el="v" style="color:${isWaste ? 'var(--danger)' : 'var(--text)'}">1</div>
        <button type="button" class="stepper__btn" data-a="plus" aria-label="+1">+</button>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
        ${QUICK.map(n => `<button type="button" class="chip num" data-q="${n}" style="min-width:52px;justify-content:center">${n}</button>`).join('')}
      </div>
      ${isWaste ? `
      <div class="field" style="margin-top:20px;margin-bottom:0">
        <label for="rw-reason">${UI.esc(t('waste.reason'))}</label>
        <input id="rw-reason" type="text" data-el="reason" placeholder="${UI.esc(t('waste.reasonPh'))}" maxlength="140" autocomplete="off" enterkeyhint="done">
        <div class="tt hidden" data-el="reasonHelp" style="color:var(--danger);margin-top:6px">${UI.esc(t('waste.reasonRequired'))}</div>
      </div>` : ''}
      <button type="button" class="btn btn--gold btn--big btn--full" data-a="ok" style="margin-top:20px"></button>
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
      minusBtn.style.opacity = qty <= 1 ? '.4' : '';
      chips.forEach(ch => ch.classList.toggle('is-on', Number(ch.dataset.q) === qty));
      okBtn.textContent = t(isWaste ? 'waste.confirmBtn' : 'restock.confirmBtn', { qty: UI.fmtQty(qty) });
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
          reasonInp.style.borderColor = 'var(--danger)';
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
      if (b.dataset.a === 'minus') { if (qty > 1) { qty -= 1; UI.haptic('light'); sync(); } return; }
      if (b.dataset.a === 'plus') { if (qty < 999) { qty += 1; UI.haptic('light'); sync(); } return; }
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
  function renderScreen(mode, el) {
    if (!Store.isOwner) { UI.go(Store.state.session ? 'sell' : 'login'); return; }
    const st = ST[mode];
    const cats = Store.state.categories.slice().sort((a, b) => a.sort - b.sort);
    el.innerHTML = `
      <header class="apphead">
        <button type="button" class="iconbtn" data-a="back" aria-label="${UI.esc(t('g.back'))}">${UI.icon('chevL')}</button>
        <div class="apphead__titles">
          <h1 class="apphead__title">${UI.esc(t(mode + '.title'))}</h1>
          <div class="apphead__sub">${UI.esc(t(mode + '.hint'))}</div>
        </div>
      </header>
      <div class="search">
        ${UI.icon('search')}
        <input type="text" data-el="q" placeholder="${UI.esc(t('g.search'))}" value="${UI.esc(st.q)}" autocomplete="off" enterkeyhint="search" aria-label="${UI.esc(t('g.search'))}">
        <button type="button" class="iconbtn iconbtn--plain search__clear ${st.q ? '' : 'hidden'}" data-a="clear" aria-label="${UI.esc(t('rw.clear'))}">${UI.icon('x')}</button>
      </div>
      <div class="chips" data-el="chips">
        <button type="button" class="chip ${st.cat === 'all' ? 'is-on' : ''}" data-cat="all">${UI.esc(t('g.all'))}</button>
        ${cats.map(cat => `<button type="button" class="chip ${st.cat === cat.id ? 'is-on' : ''}" data-cat="${cat.id}">
          <span class="dot" style="--c:${cat.color}"></span>${UI.esc(Store.catName(cat))}</button>`).join('')}
      </div>
      <div data-el="gridwrap" class="mt2">${gridSection(mode)}</div>
      ${todayCardHtml(mode)}
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
      if (e.target.closest('[data-a=back]')) { UI.haptic('light'); UI.go('more'); return; }
      const card = e.target.closest('[data-item]');
      if (card) openQtySheet(mode, card.dataset.item);
    });
  }

  UI.registerScreen({ id: 'restock', render(el) { renderScreen('restock', el); } });
  UI.registerScreen({ id: 'waste', render(el) { renderScreen('waste', el); } });
})();
