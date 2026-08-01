/* ============ Screen: inventory (owner) — root tab. Category-grouped stock list, edit & new item sheets ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'inv.nameRequired': 'Indiquez le nom de l’article',
      'inv.noBarcode': 'Aucun code associé',
      'inv.deactivateWarn': 'L’article sera masqué de la vente et des comptages. Son historique est conservé. Continuer ?',
      'inv.deactivated': 'Article désactivé',
      'inv.reactivated': 'Article réactivé',
      'inv.emptyAll': 'Aucun article pour l’instant',
      'inv.emptyAllSub': 'Ajoutez votre premier article avec « Nouvel article ».',
      'inv.activeCount_one': '{n} article actif',
      'inv.activeCount_many': '{n} articles actifs',
      'inv.inactiveN': 'Inactifs — {n}',
      'inv.bottleMl': 'Bouteille (ml)',
      'inv.pourA': 'Verre A (ml)',
      'inv.pourB': 'Verre B (ml)',
      'inv.pourHint': 'Choisissez jusqu’à 2 tailles de verre : chaque verre servi déduit sa fraction de bouteille.',
      'inv.noSize': 'Sans format',
      'inv.otherMl': 'Autre taille en ml',
      'inv.addFormat': 'Ajouter un autre format (ex. 1 L)',
      'inv.formatAdded': '{name} ajouté',
    },
    en: {
      'inv.nameRequired': 'Enter the item name',
      'inv.noBarcode': 'No code attached',
      'inv.deactivateWarn': 'The item will be hidden from selling and counts. Its history is kept. Continue?',
      'inv.deactivated': 'Item deactivated',
      'inv.reactivated': 'Item reactivated',
      'inv.emptyAll': 'No items yet',
      'inv.emptyAllSub': 'Add your first item with “New item”.',
      'inv.activeCount_one': '{n} active item',
      'inv.activeCount_many': '{n} active items',
      'inv.inactiveN': 'Inactive — {n}',
      'inv.bottleMl': 'Bottle (ml)',
      'inv.pourA': 'Glass A (ml)',
      'inv.pourB': 'Glass B (ml)',
      'inv.pourHint': 'Pick up to 2 glass sizes: each glass served deducts its bottle fraction.',
      'inv.noSize': 'No format',
      'inv.otherMl': 'Other size in ml',
      'inv.addFormat': 'Add another format (e.g. 1 L)',
      'inv.formatAdded': '{name} added',
    },
  });

  /* scoped styles: screen + its sheets — hairlines and whitespace only, 4pt grid, kit radii */
  document.head.appendChild(UI.el(`<style>
  [data-screen=inventory] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=inventory] .h1{font:600 28px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  [data-screen=inventory] button.row{width:100%;text-align:left}
  [data-screen=inventory] .row__s{font-size:13px;font-weight:500;letter-spacing:0;text-transform:none;color:var(--t2)}
  [data-screen=inventory] .row__end{display:flex;flex-direction:column;align-items:flex-end}
  [data-screen=inventory] .inv-n{font-size:19px;line-height:1.2}
  [data-screen=inventory] .inv-row{padding:0}
  [data-screen=inventory] .inv-open{flex:1;min-width:0;display:flex;align-items:center;gap:12px;text-align:left;padding:6px 0}
  [data-screen=inventory] .inv-adj{display:flex;align-items:center;gap:2px;flex:none;margin-left:8px}
  [data-screen=inventory] .inv-btn{width:44px;height:44px;border-radius:10px;border:1px solid var(--hair);
    background:var(--surface);color:var(--t2);font:500 22px var(--f-display);line-height:1;
    display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;transition:background .1s,color .1s}
  [data-screen=inventory] .inv-btn:active{background:var(--surface2);color:var(--t1)}
  [data-screen=inventory] .inv-adj .inv-n{min-width:50px;text-align:center;font-size:19px}
  [data-screen=inventory] .inv-n.is-pend{color:var(--brass)}
  [data-screen=inventory] .inv-n.is-low{color:var(--bad)}
  [data-screen=inventory] .inv-low{font-size:11.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--bad);margin-top:2px}
  [data-screen=inventory] .feed{margin-top:4px}
  [data-screen=inventory] .grouprow{margin-top:16px}
  [data-screen=inventory] .inv-off .row{opacity:.55}
  [data-screen=inventory] .inv-off .row__art{filter:grayscale(.8)}
  [data-screen=inventory] .inv-off .inv-n{color:var(--t3)}
  [data-screen=inventory] .inv-list>.textbtn{display:block;width:100%;margin-top:8px}
  [data-sheet=inv] h2{font-size:18px;margin-bottom:16px}
  [data-sheet=inv] .sheetrow{margin-bottom:16px}
  [data-sheet=inv] .inv2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  [data-sheet=inv] .inv3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  [data-sheet=inv] .inv-sizes,[data-sheet=inv] .inv-pours{margin-top:0;flex-wrap:wrap;overflow:visible}
  [data-sheet=inv] .inv-sizes .chip,[data-sheet=inv] .inv-pours .chip{height:34px}
  [data-sheet=inv] .inv-hint{font-size:11px;color:var(--t3);margin:-8px 0 16px}
  [data-sheet=inv] .inv-swgroup{border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);margin-bottom:16px}
  [data-sheet=inv] .inv-photo{display:flex;align-items:center;gap:16px}
  [data-sheet=inv] .inv-photo__acts{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start}
  [data-sheet=inv] .inv-photo .textbtn{padding:8px 0;text-align:left}
  [data-sheet=inv] .inv-mut{color:var(--t3)}
  [data-sheet=inv] .inv-code{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:32px}
  [data-sheet=inv] .inv-code .textbtn{padding-right:0;flex:none}
  [data-sheet=inv] [data-r=code]{margin-top:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  [data-sheet=inv] [data-r=code].is-none{font-family:var(--f-ui);font-weight:400}
  [data-sheet=inv] .inv-foot{display:flex;flex-direction:column;gap:4px;margin-top:8px}
  [data-sheet=inv] .inv-danger{color:var(--bad)}
  </style>`));

  /* raw unit values stored on items → display keys */
  const UNITS = [
    ['bouteille', 'inv.unit.bottle'],
    ['canette', 'inv.unit.can'],
    ['portion', 'inv.unit.portion'],
    ['verre', 'inv.unit.glass'],
  ];
  const unitLabel = u => { const m = UNITS.find(x => x[0] === u); return t(m ? m[1] : 'inv.unit.bottle'); };

  /* same normalize-search idiom as sell */
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const parseNum = v => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isNaN(n) ? null : Math.max(0, Math.round(n * 100) / 100);
  };
  /* the tile art already carries the ½ mark for demi items — keep names ½-free */
  const displayName = name => String(name || '').replace(/^1\/2\s+/, '');

  /* transient screen state — survives store-driven re-renders */
  let query = '';
  let catFilter = 'all';
  let showInactive = false;
  let searchFocus = false;

  const emptyHtml = (title, sub) => `<div class="empty"><div class="empty__t">${UI.esc(title)}</div>${sub ? `<div class="empty__s">${UI.esc(sub)}</div>` : ''}</div>`;

  /* ---------- quick stock adjust: taps accumulate, one entry per burst ----------
     The number moves the instant you tap; the ledger entry is written ~1s after you
     stop, so holding + for a 24-crate delivery records ONE delivery of 24. */
  const QUICK = {
    pending: {},   // itemId → delta not yet committed
    timers: {},    // itemId → commit timer
    first: {},     // itemId → when this burst started, so it always lands
  };

  function paintQuick(id) {
    const it = Store.item(id); if (!it) return;
    const pend = QUICK.pending[id] || 0;
    const el = document.querySelector(`[data-n="${CSS.escape(id)}"]`);
    if (!el) return;
    const v = Math.round((Store.stock(id) + pend) * 1000) / 1000;
    el.textContent = it.bottleMl ? String(Math.floor(v + 1e-6)) : UI.fmtQty(v);
    el.classList.toggle('is-pend', !!pend);
    if (pend) el.classList.remove('is-low');
  }

  function bump(id, dir) {
    const it = Store.item(id); if (!it) return;
    const step = it.allowDecimal ? 0.5 : 1;
    const next = Math.round(((QUICK.pending[id] || 0) + dir * step) * 100) / 100;
    // never let a quick removal push the shelf below zero
    if (Store.stock(id) + next < 0) return;
    QUICK.pending[id] = next;
    QUICK.first[id] = QUICK.first[id] || Date.now();
    UI.haptic('light');
    UI.hold(1400);          // keep the list still while the finger is working
    paintQuick(id);
    clearTimeout(QUICK.timers[id]);
    const wait = Math.max(250, Math.min(700, 2000 - (Date.now() - QUICK.first[id])));
    QUICK.timers[id] = setTimeout(() => commit(id), wait);
  }

  function commit(id) {
    const delta = QUICK.pending[id];
    delete QUICK.pending[id];
    delete QUICK.first[id];
    clearTimeout(QUICK.timers[id]);
    if (!delta) return;
    const it = Store.item(id);
    const entry = Store.adjustStock(id, delta);
    if (!entry) return;
    const n = UI.fmtQty(Math.abs(delta));
    UI.toast(t(delta > 0 ? 'inv.quickAdd' : 'inv.quickSub', { n, item: it.name }), {
      type: delta > 0 ? 'ok' : 'danger',
      action: { label: t('g.undo'), fn: () => { Store.adjustStock(id, -delta); } },
    });
  }
  function commitAll() { for (const id of Object.keys(QUICK.pending)) commit(id); }


  function rowHtml(it, off) {
    const pend = QUICK.pending[it.id] || 0;
    const stockRaw = Math.round((Store.stock(it.id) + pend) * 1000) / 1000;
    const stock = it.bottleMl ? Math.floor(stockRaw + 1e-6) : stockRaw;
    const low = !off && !pend && Store.isLow(it.id);
    const step = it.allowDecimal ? '0,5' : '1';
    return `<div class="row inv-row" data-row="${UI.esc(it.id)}">
      <button type="button" class="inv-open" data-edit="${UI.esc(it.id)}">
        <span class="row__art">${UI.art(it)}</span>
        <span class="row__body">
          <span class="row__t">${UI.esc(displayName(it.name))}</span>
          <span class="row__s">${UI.esc(UI.stockText(it))}</span>
        </span>
      </button>
      ${off ? `<span class="row__end"><span class="num inv-n">${UI.esc(UI.fmtQty(stock))}</span></span>` : `
      <span class="inv-adj" aria-label="${UI.esc(step)}">
        <button type="button" class="inv-btn" data-adj="-1" data-id="${UI.esc(it.id)}" aria-label="−">−</button>
        <span class="num inv-n${low ? ' is-low' : ''}${pend ? ' is-pend' : ''}" data-n="${UI.esc(it.id)}">${UI.esc(UI.fmtQty(stock))}</span>
        <button type="button" class="inv-btn" data-adj="1" data-id="${UI.esc(it.id)}" aria-label="+">+</button>
      </span>`}
    </div>`;
  }

  /* ---------- item sheet (edit when id, new otherwise) ---------- */
  function openItemSheet(id) {
    const isNew = !id;
    const src = id ? Store.item(id) : null;
    if (id && !src) return;
    const cur = Store.state.settings.currency;
    const cats = Store.state.categories.slice().sort((a, b) => a.sort - b.sort);
    const d = isNew
      ? {
          name: '',
          catId: (catFilter !== 'all' && Store.cat(catFilter)) ? catFilter : (cats[0] ? cats[0].id : 'biere'),
          unit: 'bouteille', allowDecimal: false, threshold: 6, pinned: false, cost: null, photo: null, barcode: null, codes: [], pours: null, bottleMl: null,
        }
      : {
          name: src.name, catId: src.catId, unit: src.unit, allowDecimal: !!src.allowDecimal,
          threshold: src.threshold, pinned: !!src.pinned, cost: src.cost, photo: src.photo, barcode: src.barcode, pours: src.pours ? [...src.pours] : null, bottleMl: src.bottleMl ?? null,
          codes: src.barcodes ? src.barcodes.map(b => ({ code: String(b.code), qty: Math.max(1, Math.round(+b.qty) || 1) })) : (src.barcode ? [{ code: String(src.barcode), qty: 1 }] : []),
        };
    if (isNew) {
      if (d.catId === 'cuisine') d.unit = 'portion';
      if (d.catId === 'spirit') d.allowDecimal = true;
    }

    const c = UI.el(`<div data-sheet="inv">
      ${isNew
        ? `<h2>${UI.esc(t('inv.addItem'))}</h2>`
        : `<div class="sheetrow">
            <div class="tile t40">${UI.art(src)}</div>
            <div><div class="sheetname">${UI.esc(displayName(src.name))}</div>
            <div class="sheetsub tnum">${UI.esc(t('inv.expected'))} · ${UI.esc(UI.fmtQty(Store.stock(id)))}</div></div>
          </div>`}
      <div class="field"><label>${UI.esc(t('inv.name'))}</label><input data-f="name" type="text" value="${UI.esc(d.name)}" autocomplete="off" enterkeyhint="done"></div>
      <div class="inv2col">
        <div class="field"><label>${UI.esc(t('inv.category'))}</label><select data-f="cat">${cats.map(x =>
          `<option value="${UI.esc(x.id)}"${x.id === d.catId ? ' selected' : ''}>${UI.esc(Store.catName(x))}</option>`).join('')}</select></div>
        <div class="field"><label>${UI.esc(t('inv.unit'))}</label><select data-f="unit">${UNITS.map(([v, k]) =>
          `<option value="${v}"${v === d.unit ? ' selected' : ''}>${UI.esc(t(k))}</option>`).join('')}</select></div>
      </div>
      <div class="inv2col">
        <div class="field"><label>${UI.esc(t('inv.threshold'))}</label><input data-f="thr" type="number" min="0" step="any" inputmode="decimal" value="${d.threshold ?? ''}"></div>
        <div class="field"><label>${UI.esc(t('inv.cost', { cur }))}</label><input data-f="cost" type="number" min="0" step="any" inputmode="decimal" value="${d.cost ?? ''}"></div>
      </div>
      <div class="inv-hint">${UI.esc(t('inv.costHint'))}</div>
      <div class="field"><label>${UI.esc(t('inv.bottleMl'))}</label>
        <div class="chips inv-sizes">
          ${Store.SEED.SIZES.map(ml => `<button type="button" class="chip${d.bottleMl === ml ? ' is-on' : ''}" data-size="${ml}"><span class="dot"></span>${UI.esc(Store.sizeLabel(ml))}</button>`).join('')}
          <button type="button" class="chip${!d.bottleMl ? ' is-on' : ''}" data-size="0"><span class="dot"></span>${UI.esc(t('inv.noSize'))}</button>
        </div>
        <input data-f="bml" type="number" min="0" step="any" inputmode="numeric" placeholder="${UI.esc(t('inv.otherMl'))}" value="${d.bottleMl ?? ''}" style="margin-top:8px">
      </div>
      <div class="field"><label>${UI.esc(t('inv.pourA'))}</label>
        <div class="chips inv-pours">
          ${[25, 30, 40, 50, 60, 100, 125, 150, 200].map(ml => `<button type="button" class="chip${(d.pours || []).includes(ml) ? ' is-on' : ''}" data-pour="${ml}"><span class="dot"></span>${ml} ml</button>`).join('')}
        </div>
        <input data-f="p1" type="hidden" value="${d.pours && d.pours[0] ? d.pours[0] : ''}">
        <input data-f="p2" type="hidden" value="${d.pours && d.pours[1] ? d.pours[1] : ''}">
      </div>
      <div class="inv-hint">${UI.esc(t('inv.pourHint'))}</div>
      ${isNew ? '' : `<button type="button" class="textbtn" data-a="dup" style="width:100%">${UI.esc(t('inv.addFormat'))}</button>`}
      <div class="inv-swgroup">
        <div class="switchrow">
          <div><div class="switchrow__t">${UI.esc(t('inv.decimal'))}</div><div class="switchrow__s">${UI.esc(t('inv.decimalHint'))}</div></div>
          <button type="button" class="sw${d.allowDecimal ? ' on' : ''}" data-f="dec" role="switch" aria-checked="${d.allowDecimal}" aria-label="${UI.esc(t('inv.decimal'))}"></button>
        </div>
        <div class="switchrow">
          <div><div class="switchrow__t">${UI.esc(t('inv.pinned'))}</div><div class="switchrow__s">${UI.esc(t('inv.pinnedHint'))}</div></div>
          <button type="button" class="sw${d.pinned ? ' on' : ''}" data-f="pin" role="switch" aria-checked="${d.pinned}" aria-label="${UI.esc(t('inv.pinned'))}"></button>
        </div>
      </div>
      ${isNew ? '' : `
      <div class="field"><label>${UI.esc(t('inv.photo'))}</label>
        <div class="inv-photo">
          <div class="tile t56" data-r="prev"></div>
          <div class="inv-photo__acts">
            <button type="button" class="textbtn" data-a="ptake">${UI.esc(t('inv.photoTake'))}</button>
            <button type="button" class="textbtn" data-a="ppick">${UI.esc(t('inv.photoPick'))}</button>
            <button type="button" class="textbtn inv-mut${d.photo ? '' : ' hidden'}" data-a="prm">${UI.esc(t('inv.photoRemove'))}</button>
          </div>
        </div>
      </div>
      <div class="field"><label>${UI.esc(t('inv.codes'))}</label>
        <div data-r="codes"></div>
        <div class="inv-code">
          <button type="button" class="textbtn" data-a="scan">${UI.esc(t('inv.barcodeScan'))}</button>
          <button type="button" class="textbtn" data-a="codeman">${UI.esc(t('inv.codeManual'))}</button>
        </div>
      </div>`}
      <div class="inv-foot">
        <button type="button" class="btn btn--gold btn--full" data-a="save">${UI.esc(t('g.save'))}</button>
        ${isNew ? '' : (src.active
          ? `<button type="button" class="textbtn inv-danger" data-a="deact">${UI.esc(t('inv.deactivate'))}</button>`
          : `<button type="button" class="textbtn" data-a="react">${UI.esc(t('inv.reactivate'))}</button>`)}
      </div>
    </div>`);
    const s = UI.sheet(c);

    const updPrev = () => {
      const p = c.querySelector('[data-r=prev]');
      if (!p) return;
      if (d.photo && String(d.photo).startsWith('data:image/')) p.innerHTML = `<img src="${UI.esc(d.photo)}" alt="${UI.esc(d.name)}">`;
      else {
        const live = Store.item(id) || src;
        p.innerHTML = UI.art({ ...live, catId: d.catId, name: d.name || live.name, photo: null });
      }
      const rm = c.querySelector('[data-a=prm]');
      if (rm) rm.classList.toggle('hidden', !d.photo);
    };
    const updCodes = () => {
      const n = c.querySelector('[data-r=codes]');
      if (!n) return;
      n.innerHTML = d.codes.length
        ? d.codes.map(b => `<div class="inv-code"><span class="sub2 num">${UI.esc(b.code)} ×${b.qty}</span><button type="button" class="textbtn inv-mut" data-rmc="${UI.esc(b.code)}">×</button></div>`).join('')
        : `<span class="sub2 is-none">${UI.esc(t('inv.noBarcode'))}</span>`;
    };
    /** attach a code: qty says what one scan of it moves (1 = bottle, 24 = case) */
    const askCodeQty = (code) => {
      let qty = 1;
      const cc = UI.el(`<div>
        <h2 style="font-size:18px;margin-bottom:12px">${UI.esc(t('scan.attachTitle'))}</h2>
        ${code ? `<div class="sub2 num" style="margin-bottom:12px">${UI.esc(code)}</div>`
          : `<div class="field"><label>${UI.esc(t('inv.barcode'))}</label><input data-f="code" type="text" inputmode="numeric" placeholder="0000000000000"></div>`}
        <div class="field"><label>${UI.esc(t('scan.attachQty'))}</label>
          <div class="chips">
            ${[1, 6, 12, 24].map(v => `<button type="button" class="chip${v === 1 ? ' is-on' : ''}" data-q="${v}">×${v}</button>`).join('')}
            <input data-f="qty" type="number" min="1" inputmode="numeric" style="width:76px" placeholder="…">
          </div>
        </div>
        <button type="button" class="btn btn--gold btn--full" data-a="okc">${UI.esc(t('scan.attachBtn'))}</button>
      </div>`);
      const sh = UI.sheet(cc);
      cc.addEventListener('click', ev => {
        const qc = ev.target.closest('[data-q]');
        if (qc) { qty = +qc.dataset.q; cc.querySelector('[data-f=qty]').value = ''; cc.querySelectorAll('[data-q]').forEach(x => x.classList.toggle('is-on', x === qc)); UI.haptic('light'); return; }
        if (!ev.target.closest('[data-a=okc]')) return;
        const manual = cc.querySelector('[data-f=qty]').value;
        if (Math.round(+manual) >= 1) qty = Math.round(+manual);
        const cd = code || String(cc.querySelector('[data-f=code]')?.value || '').trim();
        if (!cd) return;
        d.codes = d.codes.filter(x => x.code !== cd).concat({ code: cd, qty });
        updCodes(); UI.haptic('success'); sh.close();
      });
    };
    if (!isNew) { updPrev(); updCodes(); }

    c.addEventListener('click', async e => {
      const rmc = e.target.closest('[data-rmc]');
      if (rmc) { d.codes = d.codes.filter(x => x.code !== rmc.dataset.rmc); updCodes(); UI.haptic('light'); return; }
      const sz = e.target.closest('.inv-sizes [data-size]');
      if (sz) {
        const ml = Number(sz.dataset.size) || null;
        d.bottleMl = ml;
        c.querySelector('[data-f=bml]').value = ml || '';
        c.querySelectorAll('.inv-sizes [data-size]').forEach(x => x.classList.toggle('is-on', Number(x.dataset.size) === (ml || 0)));
        UI.haptic('light');
        return;
      }
      const pr = e.target.closest('.inv-pours [data-pour]');
      if (pr) {
        const ml = Number(pr.dataset.pour);
        let cur = (d.pours || []).filter(Boolean);
        if (cur.includes(ml)) cur = cur.filter(x => x !== ml);
        else { cur.push(ml); if (cur.length > 2) cur.shift(); }   // a third pick replaces the oldest
        d.pours = cur.slice().sort((a, b) => a - b);
        c.querySelector('[data-f=p1]').value = d.pours[0] || '';
        c.querySelector('[data-f=p2]').value = d.pours[1] || '';
        c.querySelectorAll('.inv-pours [data-pour]').forEach(x => x.classList.toggle('is-on', d.pours.includes(Number(x.dataset.pour))));
        UI.haptic('light');
        return;
      }
      if (e.target.closest('[data-a=dup]')) {
        const live = Store.item(id);
        if (!live) return;
        const other = live.bottleMl === 1000 ? 700 : 1000;   // the other format a bar usually stocks
        const copy = Store.saveItem({
          name: `${live.name} ${Store.sizeLabel(other)}`, catId: live.catId, unit: live.unit,
          allowDecimal: live.allowDecimal, threshold: live.threshold, cost: live.cost,
          bottleMl: other, pours: live.pours ? [...live.pours] : null,
        });
        s.close();
        UI.haptic('success');
        UI.toast(t('inv.formatAdded', { name: copy ? copy.name : '' }), { type: 'ok' });
        return;
      }
      const sw = e.target.closest('[data-f=dec],[data-f=pin]');
      if (sw) {
        const k = sw.dataset.f === 'dec' ? 'allowDecimal' : 'pinned';
        d[k] = !d[k];
        sw.classList.toggle('on', d[k]);
        sw.setAttribute('aria-checked', String(d[k]));
        UI.haptic('light');
        return;
      }
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'ptake' || a === 'ppick') {
        const img = await UI.pickImage(a === 'ptake' ? { capture: true } : {});
        if (img) { d.photo = img; updPrev(); UI.haptic('light'); }
      } else if (a === 'prm') {
        d.photo = null; updPrev(); UI.haptic('light');
      } else if (a === 'scan') {
        UI.scan({ onCode: code => { askCodeQty(String(code)); } });
      } else if (a === 'codeman') {
        askCodeQty(null);
      } else if (a === 'save') {
        const nameEl = c.querySelector('[data-f=name]');
        const name = nameEl.value.trim();
        if (!name) { UI.haptic('warn'); UI.toast(t('inv.nameRequired'), { type: 'danger' }); nameEl.focus(); return; }
        const catId = c.querySelector('[data-f=cat]').value;
        const unit = c.querySelector('[data-f=unit]').value;
        const thr = parseNum(c.querySelector('[data-f=thr]').value);
        const cost = parseNum(c.querySelector('[data-f=cost]').value);
        const bml = parseNum(c.querySelector('[data-f=bml]').value);
        const p1 = parseNum(c.querySelector('[data-f=p1]').value);
        const p2 = parseNum(c.querySelector('[data-f=p2]').value);
        const pours = [p1, p2].filter(v => v && v > 0);
        const patch = { name, catId, unit, allowDecimal: d.allowDecimal, pinned: d.pinned, cost, threshold: thr, bottleMl: bml || null, pours: pours.length ? pours : null };
        if (isNew) {
          if (thr == null) delete patch.threshold; // store default applies
          Store.saveItem(patch); // monogram derived by the store — no drawn art
        } else {
          const live = Store.item(id); // live data at action time
          if (!live) { s.close(); return; }
          if (thr == null) patch.threshold = live.threshold;
          Store.saveItem({
            id, ...patch, photo: d.photo,
            barcodes: d.codes.map(b => ({ code: b.code, qty: Math.max(1, Math.round(+b.qty) || 1) })),
            barcode: d.codes.find(b => (Math.round(+b.qty) || 1) === 1)?.code || null, // legacy mirror
          });
        }
        UI.haptic('success');
        UI.toast(t('inv.saved'), { type: 'ok' });
        s.close();
      } else if (a === 'deact') {
        const ok = await UI.confirm(t('inv.deactivateWarn'), { danger: true, title: t('inv.deactivate'), yes: t('inv.deactivate') });
        if (!ok) return;
        if (Store.item(id)) Store.saveItem({ id, active: false });
        UI.haptic('warn');
        UI.toast(t('inv.deactivated'));
        s.close();
      } else if (a === 'react') {
        if (Store.item(id)) Store.saveItem({ id, active: true });
        UI.haptic('success');
        UI.toast(t('inv.reactivated'), { type: 'ok' });
        s.close();
      }
    });
  }

  /* ---------- screen (root tab — global tab bar, no back button) ---------- */
  UI.registerScreen({
    id: 'inventory',
    render(el) {
      if (!Store.isOwner) { // owner-only guard, same as dashboard
        el.innerHTML = '';
        setTimeout(() => UI.go(Store.state.session ? 'sell' : 'login'), 0);
        return;
      }
      if (catFilter !== 'all' && !Store.cat(catFilter)) catFilter = 'all';
      const st = Store.state;
      const cats = st.categories.slice().sort((a, b) => a.sort - b.sort);
      const nAct = Store.activeItems().length;

      el.innerHTML = `
        <div class="topbar">
          ${UI.logoMark(26)}
          <div class="micro tnum">${UI.esc(I18N.plural('inv.activeCount', nAct))}</div>
        </div>
        <div class="h1">${UI.esc(t('inv.title'))}</div>
        <div class="search">${UI.icon('search')}
          <input type="text" placeholder="${UI.esc(t('g.search'))}" autocomplete="off" enterkeyhint="search" aria-label="${UI.esc(t('g.search'))}">
          <button type="button" class="iconbtn iconbtn--plain search__clear${query ? '' : ' hidden'}" data-a="clear" aria-label="${UI.esc(t('g.close'))}">${UI.icon('x')}</button>
        </div>
        <div class="chips" role="tablist">
          <button type="button" class="chip${catFilter === 'all' ? ' is-on' : ''}" data-cat="all" aria-pressed="${catFilter === 'all'}"><span class="dot"></span>${UI.esc(t('g.all'))}</button>
          ${cats.map(cg => `<button type="button" class="chip${catFilter === cg.id ? ' is-on' : ''}" data-cat="${UI.esc(cg.id)}" aria-pressed="${catFilter === cg.id}"><span class="dot" style="background:${UI.esc(cg.hex)}"></span>${UI.esc(Store.catName(cg))}</button>`).join('')}
        </div>
        <div class="inv-list"></div>`;

      const input = el.querySelector('.search input');
      const clearBtn = el.querySelector('[data-a=clear]');
      const listEl = el.querySelector('.inv-list');
      input.value = query;
      input.addEventListener('focus', () => { searchFocus = true; });
      input.addEventListener('blur', () => { searchFocus = false; });
      input.addEventListener('input', () => {
        query = input.value;
        clearBtn.classList.toggle('hidden', !query);
        renderList();
      });
      if (searchFocus) {
        input.focus();
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
      }

      function renderList() {
        const q = norm(query.trim());
        const match = it => (catFilter === 'all' || it.catId === catFilter) && (!q || norm(it.name).includes(q));
        const act = Store.activeItems().filter(match);
        const off = st.items.filter(i => !i.active).sort((a, b) => a.sort - b.sort).filter(match);
        let html = '';
        if (!act.length) {
          if (!st.items.length) html += emptyHtml(t('inv.emptyAll'), t('inv.emptyAllSub'));
          else if (!off.length) html += q
            ? emptyHtml(t('sell.noresults'), t('sell.noresults.hint'))
            : emptyHtml(t('inv.empty'), '');
        } else {
          const groups = cats.map(cg => ({ cg, items: act.filter(i => i.catId === cg.id) })).filter(g => g.items.length);
          const orphans = act.filter(i => !Store.cat(i.catId));
          html += groups.map(g => `
            <div class="sec"><div class="micro">${UI.esc(Store.catName(g.cg))}</div><div class="micro tnum">${g.items.length}</div></div>
            <div class="feed">${g.items.map(i => rowHtml(i, false)).join('')}</div>`).join('');
          if (orphans.length) html += `<div class="sec"><div class="micro">—</div><div class="micro tnum">${orphans.length}</div></div>
            <div class="feed">${orphans.map(i => rowHtml(i, false)).join('')}</div>`;
        }
        if (off.length) {
          const open = showInactive || !!q;
          html += `<button type="button" class="grouprow" data-a="toggleOff" aria-expanded="${open}">
            <span class="micro tnum">${UI.esc(t('inv.inactiveN', { n: off.length }))}</span><span class="chev">${open ? '⌄' : '›'}</span>
          </button>`;
          if (open) html += `<div class="feed inv-off">${off.map(i => rowHtml(i, true)).join('')}</div>`;
        }
        html += Store.isOwner ? `<button type="button" class="textbtn" data-a="new">${UI.esc(t('inv.addItem'))}</button>` : '';
        listEl.innerHTML = html;
      }

      // quick adjust: pointer events so press-and-hold works on phone and desktop
      el.addEventListener('pointerdown', e => {
        const b = e.target.closest('[data-adj]');
        if (!b) return;
        e.preventDefault();
        bump(b.dataset.id, Number(b.dataset.adj));
      });

      el.addEventListener('click', e => {
        if (e.target.closest('[data-adj]')) return; // handled on pointerdown
        if (e.target.closest('[data-a=new]')) { UI.haptic('light'); openItemSheet(null); return; }
        if (e.target.closest('[data-a=clear]')) {
          query = ''; input.value = '';
          clearBtn.classList.add('hidden');
          renderList(); input.focus();
          return;
        }
        if (e.target.closest('[data-a=toggleOff]')) { showInactive = !showInactive; UI.haptic('light'); renderList(); return; }
        const chip = e.target.closest('[data-cat]');
        if (chip) {
          catFilter = chip.dataset.cat;
          el.querySelectorAll('[data-cat]').forEach(x => {
            const on = x.dataset.cat === catFilter;
            x.classList.toggle('is-on', on);
            x.setAttribute('aria-pressed', String(on));
          });
          UI.haptic('light'); renderList();
          return;
        }
        const row = e.target.closest('[data-edit]');
        if (row) { UI.haptic('light'); openItemSheet(row.dataset.edit); }
      });

      renderList();
    },
  });
})();
