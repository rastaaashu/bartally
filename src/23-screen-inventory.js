/* ============ Screen: inventory (owner) — items, thresholds, edit & new item sheets ============ */
(() => {
  I18N.extend({
    fr: {
      'inv.nameRequired': 'Indiquez le nom de l’article',
      'inv.noBarcode': 'Aucun code associé',
      'inv.deactivateWarn': 'L’article sera masqué de la vente et des comptages. Son historique est conservé. Continuer ?',
      'inv.deactivated': 'Article désactivé',
      'inv.reactivated': 'Article réactivé',
      'inv.emptyAll': 'Aucun article pour l’instant',
      'inv.emptyAllSub': 'Ajoutez votre premier article avec le bouton +.',
    },
    en: {
      'inv.nameRequired': 'Enter the item name',
      'inv.noBarcode': 'No code attached',
      'inv.deactivateWarn': 'The item will be hidden from selling and counts. Its history is kept. Continue?',
      'inv.deactivated': 'Item deactivated',
      'inv.reactivated': 'Item reactivated',
      'inv.emptyAll': 'No items yet',
      'inv.emptyAllSub': 'Add your first item with the + button.',
    },
  });

  /* scoped styles: screen + its sheets */
  document.head.appendChild(UI.el(`<style>
    [data-screen=inventory] button.row{width:100%;text-align:left}
    [data-screen=inventory] .row__t,[data-screen=inventory] .row__s{display:block}
    [data-screen=inventory] .row__end{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
    [data-screen=inventory] .row__art .itemart{width:100%;height:100%}
    [data-screen=inventory] .inv-group{padding:10px 16px 4px;margin-top:12px;animation:invscr-in .32s cubic-bezier(.2,.8,.25,1) both}
    [data-screen=inventory] .invcat{display:flex;align-items:center;gap:9px;padding:6px 0 8px;border-bottom:1px solid var(--hairline)}
    [data-screen=inventory] .invcat .dot{width:8px;height:8px;border-radius:50%;background:var(--c,var(--gold));flex:none;box-shadow:0 0 10px var(--c,var(--gold))}
    [data-screen=inventory] .invcat__n{font-weight:700;font-size:13.5px;letter-spacing:.01em;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    [data-screen=inventory] .inv-stock{font-family:var(--f-display);font-weight:700;font-size:20px;line-height:1.1}
    [data-screen=inventory] .inv-stock.is-low{color:var(--danger)}
    [data-screen=inventory] .inv-pin{display:inline-flex;margin-left:5px;vertical-align:-1px;color:var(--gold)}
    [data-screen=inventory] .inv-pin svg{width:12px;height:12px}
    [data-screen=inventory] .inv-pin svg path{fill:var(--gold)}
    [data-screen=inventory] .inv-offbtn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;margin-top:14px;color:var(--text-3);font-weight:600;font-size:13px;border-radius:var(--r-el)}
    [data-screen=inventory] .inv-offbtn svg{width:16px;height:16px;transform:rotate(90deg);transition:transform .2s}
    [data-screen=inventory] .inv-offbtn.is-open svg{transform:rotate(-90deg)}
    [data-screen=inventory] .inv-off{animation:invscr-in .25s cubic-bezier(.2,.8,.25,1) both}
    [data-screen=inventory] .inv-off .row{opacity:.55}
    [data-screen=inventory] .inv-off .row__art{filter:grayscale(.8)}
    [data-screen=inventory] .inv-off .inv-stock{color:var(--text-3)}
    @keyframes invscr-in{from{opacity:0;transform:translateY(8px)}}
    [data-sheet=inv] .inv2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    [data-sheet=inv] .btn svg{width:18px;height:18px;flex:none}
    [data-sheet=inv] .invsheet-photo{display:flex;gap:12px}
    [data-sheet=inv] .invsheet-prev{width:96px;height:96px;border-radius:16px;overflow:hidden;background:var(--surface-2);border:1px solid var(--hairline);flex:none}
    [data-sheet=inv] .invsheet-prev img,[data-sheet=inv] .invsheet-prev svg,[data-sheet=inv] .invsheet-prev .itemart{width:100%;height:100%;object-fit:cover}
    [data-sheet=inv] .invsheet-pbtns{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
    [data-sheet=inv] .invsheet-pbtns .btn{min-height:48px;font-size:13px;justify-content:flex-start;padding:0 14px}
    [data-sheet=inv] .invsheet-code{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface-2);border:1px solid var(--hairline);border-radius:12px;padding:6px 6px 6px 14px}
    [data-sheet=inv] .invsheet-codev{font-size:14px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    [data-sheet=inv] .invsheet-codev.is-none{color:var(--text-3);font-weight:500}
    [data-sheet=inv] .invsheet-foot{display:flex;flex-direction:column;gap:10px;margin-top:6px}
  </style>`));

  /* raw unit values stored on items → display keys */
  const UNITS = [
    ['bouteille', 'inv.unit.bottle'],
    ['canette', 'inv.unit.can'],
    ['portion', 'inv.unit.portion'],
    ['verre', 'inv.unit.glass'],
  ];
  const unitLabel = u => { const m = UNITS.find(x => x[0] === u); return t(m ? m[1] : 'inv.unit.bottle'); };

  /* default art per category for brand-consistent new items */
  const CAT_ART = {
    biere: ['beer', { g: '#7A4A17', l: '#E8E0CE' }],
    rouge: ['wine', { g: '#3B1420', l: '#E2D5BD' }],
    blanc: ['wine-w', { g: '#74763C', l: '#EEE8CE' }],
    rose: ['wine-r', { g: '#A85A6C', l: '#F2E0DC' }],
    demi: ['half', { g: '#34101A', l: '#E8DCC4' }],
    champ: ['champagne', { g: '#5A4A1E', l: '#F2E6BE' }],
    spirit: ['whisky-sq', { g: '#1A1A1A', l: '#E8D9A8' }],
    cuisine: ['cheese', { g: '#C89A3A', l: '#F2E2B0' }],
  };
  const defaultArt = (catId, unit) => unit === 'canette'
    ? ['can', { g: '#27427A', l: '#C8CFDA' }]
    : (CAT_ART[catId] || ['wine', { g: '#3B1420', l: '#E2D5BD' }]);

  /* same normalize-search idiom as sell */
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const parseNum = v => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isNaN(n) ? null : Math.max(0, Math.round(n * 100) / 100);
  };

  /* transient screen state — survives store-driven re-renders */
  let query = '';
  let catFilter = 'all';
  let showInactive = false;
  let searchFocus = false;

  const emptyHtml = (ic, title, sub) => `<div class="empty">${UI.icon(ic)}<div class="empty__t">${UI.esc(title)}</div>${sub ? `<div class="empty__s">${UI.esc(sub)}</div>` : ''}</div>`;

  function rowHtml(it, off) {
    const stock = Store.stock(it.id);
    const low = !off && Store.isLow(it.id);
    return `<button type="button" class="row" data-edit="${UI.esc(it.id)}">
      <span class="row__art">${UI.art(it)}</span>
      <span class="row__body">
        <span class="row__t">${UI.esc(it.name)}${it.pinned ? `<span class="inv-pin">${UI.icon('pin')}</span>` : ''}</span>
        <span class="row__s">${UI.esc(unitLabel(it.unit))} · ${UI.esc(t('inv.threshold'))} ${UI.esc(UI.fmtQty(it.threshold))}</span>
      </span>
      <span class="row__end">
        <span class="inv-stock num${low ? ' is-low' : ''}">${UI.esc(UI.fmtQty(stock))}</span>
        ${low ? `<span class="pill pill--danger">${UI.esc(t('inv.low'))}</span>` : ''}
      </span>
    </button>`;
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
          unit: 'bouteille', allowDecimal: false, threshold: 6, pinned: false, cost: null, photo: null, barcode: null,
        }
      : {
          name: src.name, catId: src.catId, unit: src.unit, allowDecimal: !!src.allowDecimal,
          threshold: src.threshold, pinned: !!src.pinned, cost: src.cost, photo: src.photo, barcode: src.barcode,
        };
    if (isNew) {
      if (d.catId === 'cuisine') d.unit = 'portion';
      if (d.catId === 'spirit') d.allowDecimal = true;
    }

    const c = UI.el(`<div data-sheet="inv">
      <h2 style="font-size:18px;margin-bottom:16px">${UI.esc(isNew ? t('inv.addItem') : t('inv.editItem'))}</h2>
      <div class="field"><label>${UI.esc(t('inv.name'))}</label><input data-f="name" type="text" value="${UI.esc(d.name)}" autocomplete="off" enterkeyhint="done"></div>
      <div class="inv2col">
        <div class="field"><label>${UI.esc(t('inv.category'))}</label><select data-f="cat">${cats.map(x =>
          `<option value="${UI.esc(x.id)}"${x.id === d.catId ? ' selected' : ''}>${UI.esc(Store.catName(x))}</option>`).join('')}</select></div>
        <div class="field"><label>${UI.esc(t('inv.unit'))}</label><select data-f="unit">${UNITS.map(([v, k]) =>
          `<option value="${v}"${v === d.unit ? ' selected' : ''}>${UI.esc(t(k))}</option>`).join('')}</select></div>
      </div>
      <div class="switchrow">
        <div><div class="switchrow__t">${UI.esc(t('inv.decimal'))}</div><div class="switchrow__s">${UI.esc(t('inv.decimalHint'))}</div></div>
        <button type="button" class="sw${d.allowDecimal ? ' on' : ''}" data-f="dec" role="switch" aria-checked="${d.allowDecimal}" aria-label="${UI.esc(t('inv.decimal'))}"></button>
      </div>
      <div class="switchrow">
        <div><div class="switchrow__t">${UI.esc(t('inv.pinned'))}</div><div class="switchrow__s">${UI.esc(t('inv.pinnedHint'))}</div></div>
        <button type="button" class="sw${d.pinned ? ' on' : ''}" data-f="pin" role="switch" aria-checked="${d.pinned}" aria-label="${UI.esc(t('inv.pinned'))}"></button>
      </div>
      <div class="inv2col mt3">
        <div class="field" style="margin-bottom:6px"><label>${UI.esc(t('inv.threshold'))}</label><input data-f="thr" type="number" min="0" step="any" inputmode="decimal" value="${d.threshold ?? ''}"></div>
        <div class="field" style="margin-bottom:6px"><label>${UI.esc(t('inv.cost', { cur }))}</label><input data-f="cost" type="number" min="0" step="any" inputmode="decimal" value="${d.cost ?? ''}"></div>
      </div>
      <div class="tt" style="margin-bottom:16px">${UI.esc(t('inv.costHint'))}</div>
      ${isNew ? '' : `
      <div class="field"><label>${UI.esc(t('inv.photo'))}</label>
        <div class="invsheet-photo">
          <div class="invsheet-prev" data-r="prev"></div>
          <div class="invsheet-pbtns">
            <button type="button" class="btn btn--ghost" data-a="ptake">${UI.icon('camera')}<span>${UI.esc(t('inv.photoTake'))}</span></button>
            <button type="button" class="btn btn--ghost" data-a="ppick">${UI.icon('upload')}<span>${UI.esc(t('inv.photoPick'))}</span></button>
            <button type="button" class="btn btn--line${d.photo ? '' : ' hidden'}" data-a="prm">${UI.icon('trash')}<span>${UI.esc(t('inv.photoRemove'))}</span></button>
          </div>
        </div>
      </div>
      <div class="field"><label>${UI.esc(t('inv.barcode'))}</label>
        <div class="invsheet-code">
          <span class="invsheet-codev num" data-r="code"></span>
          <button type="button" class="btn btn--ghost" data-a="scan">${UI.icon('scan')}<span>${UI.esc(t('inv.barcodeScan'))}</span></button>
        </div>
      </div>`}
      <div class="invsheet-foot">
        <button type="button" class="btn btn--gold btn--big btn--full" data-a="save">${UI.esc(t('g.save'))}</button>
        ${isNew ? '' : (src.active
          ? `<button type="button" class="btn btn--danger btn--full" data-a="deact">${UI.esc(t('inv.deactivate'))}</button>`
          : `<button type="button" class="btn btn--ghost btn--full" data-a="react">${UI.esc(t('inv.reactivate'))}</button>`)}
      </div>
    </div>`);
    const s = UI.sheet(c);

    const updPrev = () => {
      const p = c.querySelector('[data-r=prev]');
      if (!p) return;
      if (d.photo) p.innerHTML = `<img src="${d.photo}" alt="${UI.esc(d.name)}">`;
      else {
        const live = Store.item(id) || src;
        p.innerHTML = UI.art({ ...live, catId: d.catId, name: d.name || live.name, photo: null });
      }
      const rm = c.querySelector('[data-a=prm]');
      if (rm) rm.classList.toggle('hidden', !d.photo);
    };
    const updCode = () => {
      const n = c.querySelector('[data-r=code]');
      if (!n) return;
      n.textContent = d.barcode || t('inv.noBarcode');
      n.classList.toggle('is-none', !d.barcode);
    };
    if (!isNew) { updPrev(); updCode(); }

    c.addEventListener('click', async e => {
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
        UI.scan({
          onCode: code => {
            d.barcode = String(code);
            updCode();
            UI.haptic('success');
            UI.toast(t('inv.barcodeSet', { code: d.barcode }), { type: 'ok' });
          },
        });
      } else if (a === 'save') {
        const nameEl = c.querySelector('[data-f=name]');
        const name = nameEl.value.trim();
        if (!name) { UI.haptic('warn'); UI.toast(t('inv.nameRequired'), { type: 'danger' }); nameEl.focus(); return; }
        const catId = c.querySelector('[data-f=cat]').value;
        const unit = c.querySelector('[data-f=unit]').value;
        const thr = parseNum(c.querySelector('[data-f=thr]').value);
        const cost = parseNum(c.querySelector('[data-f=cost]').value);
        const patch = { name, catId, unit, allowDecimal: d.allowDecimal, pinned: d.pinned, cost, threshold: thr };
        if (isNew) {
          const [art, tint] = defaultArt(catId, unit);
          if (thr == null) delete patch.threshold; // store default applies
          Store.saveItem({ ...patch, art, tint });
        } else {
          const live = Store.item(id); // live data at action time
          if (!live) { s.close(); return; }
          if (thr == null) patch.threshold = live.threshold;
          Store.saveItem({ id, ...patch, photo: d.photo, barcode: d.barcode });
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

  /* ---------- screen ---------- */
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

      el.innerHTML = UI.header(t('inv.title'), st.settings.barName,
        `<button type="button" class="iconbtn" data-a="new" aria-label="${UI.esc(t('inv.addItem'))}">${UI.icon('plus')}</button>`) + `
        <div class="search">${UI.icon('search')}
          <input type="text" placeholder="${UI.esc(t('g.search'))}" autocomplete="off" enterkeyhint="search" aria-label="${UI.esc(t('g.search'))}">
          <button type="button" class="iconbtn iconbtn--plain search__clear${query ? '' : ' hidden'}" data-a="clear" aria-label="${UI.esc(t('g.close'))}">${UI.icon('x')}</button>
        </div>
        <div class="chips" role="tablist">
          <button type="button" class="chip${catFilter === 'all' ? ' is-on' : ''}" data-cat="all" aria-pressed="${catFilter === 'all'}">${UI.esc(t('g.all'))}</button>
          ${cats.map(cg => `<button type="button" class="chip${catFilter === cg.id ? ' is-on' : ''}" data-cat="${UI.esc(cg.id)}" aria-pressed="${catFilter === cg.id}"><i class="dot" style="--c:${UI.esc(cg.color)}"></i>${UI.esc(Store.catName(cg))}</button>`).join('')}
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
          if (!st.items.length) html += emptyHtml('stock', t('inv.emptyAll'), t('inv.emptyAllSub'));
          else if (!off.length) html += q
            ? emptyHtml('search', t('sell.noresults'), t('sell.noresults.hint'))
            : emptyHtml('stock', t('inv.empty'), '');
        } else {
          const groups = cats.map(cg => ({ cg, items: act.filter(i => i.catId === cg.id) })).filter(g => g.items.length);
          const orphans = act.filter(i => !Store.cat(i.catId));
          html += groups.map((g, gi) => `<section class="card inv-group" style="animation-delay:${Math.min(gi * 45, 220)}ms">
            <div class="invcat"><i class="dot" style="--c:${UI.esc(g.cg.color)}"></i><span class="invcat__n">${UI.esc(Store.catName(g.cg))}</span><span class="pill pill--mut num">${g.items.length}</span></div>
            ${g.items.map(i => rowHtml(i, false)).join('')}
          </section>`).join('');
          if (orphans.length) html += `<section class="card inv-group">${orphans.map(i => rowHtml(i, false)).join('')}</section>`;
        }
        if (off.length) {
          const open = showInactive || !!q;
          html += `<button type="button" class="inv-offbtn${open ? ' is-open' : ''}" data-a="toggleOff" aria-expanded="${open}">${UI.icon('chevR')}<span>${UI.esc(t('inv.inactive'))}</span><span class="pill pill--mut num">${off.length}</span></button>`;
          if (open) html += `<section class="card inv-group inv-off">${off.map(i => rowHtml(i, true)).join('')}</section>`;
        }
        listEl.innerHTML = html;
      }

      el.addEventListener('click', e => {
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
