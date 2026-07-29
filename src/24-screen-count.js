/* ============ Screen: count — walkthrough + Écarts review (reference frame 03) ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'count.h1': 'Écarts',
      'count.att': 'Att.', 'count.cpt': 'Cpt.', 'count.ecart': 'Écart',
      'count.attendu': 'Attendu', 'count.compte': 'Compté',
      'count.noVar_one': 'Sans écart — {n} article',
      'count.noVar_many': 'Sans écart — {n} articles',
      'count.exportPdf': 'Exporter le rapport PDF',
      'count.article': 'Article',
      'count.itemsToCount': 'Articles à compter',
      'count.startHint': 'L’app affiche le stock attendu ; vous saisissez ce que vous comptez réellement. Chaque écart apparaît, article par article.',
      'count.notePrefix': 'Note',
      'count.editLine': 'Modifier',
      'count.ownerOnly': 'Réservé au patron',
      'count.viewReport': 'Voir le rapport',
      'count.frozen': 'Journée clôturée — rapport définitif, non modifiable.',
    },
    en: {
      'count.h1': 'Variance',
      'count.att': 'Exp.', 'count.cpt': 'Cnt.', 'count.ecart': 'Var.',
      'count.attendu': 'Expected', 'count.compte': 'Counted',
      'count.noVar_one': 'No variance — {n} item',
      'count.noVar_many': 'No variance — {n} items',
      'count.exportPdf': 'Export the PDF report',
      'count.article': 'Item',
      'count.itemsToCount': 'Items to count',
      'count.startHint': 'The app shows the expected stock; you type what you actually count. Every discrepancy shows, item by item.',
      'count.notePrefix': 'Note',
      'count.editLine': 'Edit',
      'count.ownerOnly': 'Owner only',
      'count.viewReport': 'View report',
      'count.frozen': 'Day closed — final report, cannot be edited.',
    },
  });

  document.head.appendChild(UI.el(`<style>
  [data-screen=count] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=count] .h1{font:600 28px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  [data-screen=count] .cw-item{display:flex;align-items:center;gap:12px;margin-top:20px}
  [data-screen=count] .cw-name{font-size:16px;font-weight:600}
  [data-screen=count] .cw-unit{font-size:11px;color:var(--t3);margin-top:2px;text-transform:uppercase;letter-spacing:.07em;font-weight:600}
  [data-screen=count] .cw-progress{font-variant-numeric:tabular-nums}
  [data-screen=count] .cw-in.has{color:var(--brass)}
  [data-screen=count] .cw-actions{display:flex;gap:8px;margin-top:12px}
  [data-screen=count] .cw-actions .btn{flex:1}
  [data-screen=count] .trow.tap{cursor:pointer}
  [data-screen=count] .done-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}
  [data-screen=count] .done-mark{width:64px;height:64px;border-radius:50%;border:1px solid var(--hair2);display:flex;align-items:center;justify-content:center;margin-bottom:10px}
  [data-screen=count] .done-mark svg{width:26px;height:26px;color:var(--ok)}
  [data-screen=count] .ov{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(5,6,8,.94);text-align:center;animation:fade-in .2s}
  [data-screen=count] .ov.is-out{animation:fade-out .25s forwards}
  [data-screen=count] .ov .ring1{stroke-dasharray:290;stroke-dashoffset:290;animation:cnt-draw .8s .1s cubic-bezier(.55,0,.3,1) forwards}
  [data-screen=count] .ov .ck1{stroke-dasharray:56;stroke-dashoffset:56;animation:cnt-draw .3s .75s ease-out forwards}
  [data-screen=count] .ov h2{font:600 20px var(--f-display);margin-top:12px;opacity:0;animation:cnt-up .4s .9s forwards}
  [data-screen=count] .ov p{color:var(--t2);font-size:13px;opacity:0;animation:cnt-up .4s 1s forwards}
  @keyframes cnt-draw{to{stroke-dashoffset:0}}
  @keyframes cnt-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  </style>`));

  const V = { mode: 'entry', idx: 0, buf: '', showClean: false };

  function orderedItems() {
    const cats = [...Store.state.categories].sort((a, b) => a.sort - b.sort);
    const act = Store.activeItems();
    const out = [];
    for (const c of cats) out.push(...act.filter(i => i.catId === c.id));
    return out;
  }
  const openCount = () => Store.state.counts.find(c => c.status === 'open');
  const fmtSigned = v => v === 0 ? '±0' : (v > 0 ? '+' : '−') + UI.fmtQty(Math.abs(v));
  const parseBuf = b => { const n = parseFloat(String(b).replace(',', '.')); return isNaN(n) ? null : Math.round(n * 100) / 100; };

  /* ---------- closing ceremony ---------- */
  function ceremony(el) {
    const ov = UI.el(`<div class="ov" data-screen="count" role="status">
      <svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--hair2)" stroke-width="3"/>
        <circle class="ring1" cx="50" cy="50" r="46" fill="none" stroke="var(--brass)" stroke-width="3" stroke-linecap="round" transform="rotate(-90 50 50)"/>
        <path class="ck1" d="M31 52l13 13 25-27" fill="none" stroke="var(--brass)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h2>${UI.esc(t('count.closed'))}</h2>
      <p>${UI.esc(t('count.closedSub'))}</p>
    </div>`);
    document.body.appendChild(ov);
    UI.haptic('success');
    setTimeout(() => { ov.classList.add('is-out'); setTimeout(() => ov.remove(), 260); }, 1900);
  }

  /* ---------- line sheet: edit counted + note ---------- */
  function lineSheet(c, item) {
    const line = c.lines.find(l => l.itemId === item.id);
    const exp = line ? line.expected : Store.countExpected(item.id, c.bd);
    let buf = line ? String(line.counted) : '';
    const cEl = UI.el(`<div>
      <div class="sheetrow">
        <div class="tile t40">${UI.art(item)}</div>
        <div><div class="sheetname">${UI.esc(item.name)}</div>
        <div class="sheetsub tnum">${UI.esc(t('count.attendu'))} · ${UI.esc(UI.fmtQty(exp))}</div></div>
      </div>
      <div class="sum" style="margin-top:14px">
        <div class="sumcol"><div class="micro">${UI.esc(t('count.compte'))}</div><div class="mid tnum" data-buf>${buf ? UI.esc(UI.fmtQty(parseBuf(buf))) : '—'}</div></div>
        <div class="sumcol"><div class="micro">${UI.esc(t('count.ecart'))}</div><div class="mid tnum" data-var>${buf ? fmtSigned(parseBuf(buf) - exp) : '—'}</div></div>
      </div>
      <div data-np></div>
      <div class="field" style="margin-top:14px"><label>${UI.esc(t('count.note'))}</label>
        <textarea rows="2" placeholder="${UI.esc(t('count.notePh'))}">${UI.esc(line ? (line.note || '') : '')}</textarea></div>
      <button class="btn btn--gold btn--full" data-a="save">${UI.esc(t('g.save'))}</button>
    </div>`);
    const sh = UI.sheet(cEl);
    const paint = () => {
      const v = parseBuf(buf);
      cEl.querySelector('[data-buf]').textContent = v == null ? '—' : UI.fmtQty(v);
      const vv = cEl.querySelector('[data-var]');
      vv.textContent = v == null ? '—' : fmtSigned(Math.round((v - exp) * 100) / 100);
      vv.className = 'mid tnum ' + (v == null ? '' : (v - exp) < 0 ? 'bad' : (v - exp) > 0 ? 'good' : 'faint');
    };
    UI.numpad(cEl.querySelector('[data-np]'), { decimal: item.allowDecimal, onKey: k => {
      if (k === 'del') buf = buf.slice(0, -1);
      else if (k === 'dot') { if (!buf.includes('.')) buf = (buf || '0') + '.'; }
      else if (buf.replace('.', '').length < 5) buf += k;
      paint();
    } });
    cEl.addEventListener('click', e => {
      if (!e.target.closest('[data-a=save]')) return;
      const v = parseBuf(buf);
      const note = cEl.querySelector('textarea').value.trim();
      if (v != null) Store.setCountLine(c.id, item.id, v, note);
      else if (note) Store.setCountLine(c.id, item.id, exp, note);
      sh.close();
    });
  }

  /* ---------- entry ---------- */
  function renderEntry(el) {
    const today = Store.todayBd();
    const closedToday = Store.state.counts.find(c => c.bd === today && c.status === 'closed');
    const oc = openCount();
    const items = orderedItems();
    if (closedToday && !oc) {
      el.innerHTML = `
        <div class="topbar"><button class="back" data-a="back">‹ ${UI.esc(t('g.back'))}</button><div class="micro tnum">${UI.esc(UI.fmtDate(today))}</div></div>
        <div class="done-wrap">
          <div class="done-mark">${UI.icon('check')}</div>
          <div style="font:600 20px var(--f-display)">${UI.esc(t('count.closed'))}</div>
          <div class="sub2">${UI.esc(t('count.closedSub'))}</div>
        </div>
        <div class="bottomstack">
          <button class="btn btn--ghost" data-a="report">${UI.esc(t('count.viewReport'))}</button>
          <div class="sub2" style="text-align:center">${UI.esc(t('count.frozen'))}</div>
        </div>`;
      return;
    }
    const sumExp = items.reduce((a, it) => a + Store.countExpected(it.id, today), 0);
    el.innerHTML = `
      <div class="topbar"><button class="back" data-a="back">‹ ${UI.esc(t('g.back'))}</button><div class="micro tnum">${UI.esc(UI.fmtDate(today))}</div></div>
      <div class="h1">${UI.esc(t('count.title'))}</div>
      <div class="sub2" style="margin-top:10px;line-height:1.6">${UI.esc(t('count.startHint'))}</div>
      <div class="sum">
        <div class="sumcol"><div class="micro">${UI.esc(t('count.itemsToCount'))}</div><div class="mid tnum">${items.length}</div></div>
        <div class="sumcol"><div class="micro">${UI.esc(t('count.attendu'))}</div><div class="mid tnum">${UI.esc(UI.fmtQty(Math.round(sumExp * 100) / 100))}</div></div>
      </div>
      <div class="bottomstack">
        <button class="btn btn--gold" data-a="start">${UI.esc(oc ? t('count.continue') : t('count.start'))}</button>
      </div>`;
  }

  /* ---------- walkthrough ---------- */
  function renderWalk(el, c, items) {
    const it = items[V.idx];
    if (!it) { V.mode = 'review'; UI.refresh(); return; }
    const cat = Store.cat(it.catId);
    const exp = (() => { const l = c.lines.find(l => l.itemId === it.id); return l ? l.expected : Store.countExpected(it.id, c.bd); })();
    const existing = c.lines.find(l => l.itemId === it.id);
    const done = c.lines.length;
    const v = parseBuf(V.buf);
    el.innerHTML = `
      <div class="topbar">
        <button class="back" data-a="exit">‹ ${UI.esc(t('count.title'))}</button>
        <div class="micro cw-progress">${done}/${items.length}</div>
      </div>
      <div class="sec" style="margin-top:14px"><div class="micro">${UI.esc(cat ? Store.catName(cat) : '')}</div>
        <button class="scanbtn iconbtn iconbtn--plain" data-a="scan" aria-label="scan" style="width:32px;height:32px">${UI.icon('scan')}</button></div>
      <div class="cw-item">
        <div class="tile t56">${UI.art(it)}</div>
        <div><div class="cw-name">${UI.esc(it.name)}</div><div class="cw-unit">${UI.esc(UI.stockText(it))}</div></div>
      </div>
      <div class="sum">
        <div class="sumcol"><div class="micro">${UI.esc(t('count.attendu'))}</div><div class="mid tnum">${UI.esc(UI.fmtQty(exp))}</div></div>
        <div class="sumcol"><div class="micro">${UI.esc(t('count.compte'))}</div>
          <div class="mid tnum cw-in ${V.buf ? 'has' : ''}">${V.buf ? UI.esc(UI.fmtQty(v ?? 0)) : (existing ? UI.esc(UI.fmtQty(existing.counted)) : '—')}</div></div>
      </div>
      <div data-np></div>
      <div class="cw-actions">
        <button class="btn btn--ghost" data-a="prev" ${V.idx === 0 ? 'disabled' : ''}>‹</button>
        <button class="btn btn--ghost" data-a="skip">${UI.esc(t('count.skip'))}</button>
        <button class="btn btn--gold" data-a="ok">${UI.esc(t('g.confirm'))}</button>
      </div>`;
    UI.numpad(el.querySelector('[data-np]'), { decimal: it.allowDecimal, onKey: k => {
      if (k === 'del') V.buf = V.buf.slice(0, -1);
      else if (k === 'dot') { if (!V.buf.includes('.')) V.buf = (V.buf || '0') + '.'; }
      else if (V.buf.replace('.', '').length < 5) V.buf += k;
      UI.refresh();
    } });
  }

  /* ---------- review: reference frame 03 ---------- */
  function renderReview(el, c, items) {
    const lines = items.map(it => {
      const l = c.lines.find(x => x.itemId === it.id);
      return { it, exp: l ? l.expected : Store.countExpected(it.id, c.bd), cnt: l ? l.counted : null, v: l ? l.variance : null, note: l?.note || '' };
    });
    const withVar = lines.filter(l => l.v != null && l.v !== 0);
    const clean = lines.filter(l => l.v === 0);
    const missing = lines.filter(l => l.cnt == null);
    const sumExp = Math.round(lines.reduce((a, l) => a + l.exp, 0) * 100) / 100;
    const sumCnt = Math.round(lines.reduce((a, l) => a + (l.cnt ?? l.exp), 0) * 100) / 100;
    const sumVar = Math.round((sumCnt - sumExp) * 100) / 100;
    const rowHtml = l => {
      const cat = Store.cat(l.it.catId);
      return `<div class="trow tap" data-line="${l.it.id}">
        <div class="tname"><span class="feedtick" style="background:${cat ? cat.hex : 'var(--t3)'}"></span><span>${UI.esc(l.it.name)}</span></div>
        <div class="r v1 tnum">${UI.esc(UI.fmtQty(l.exp))}</div>
        <div class="r v2 tnum">${l.cnt == null ? '—' : UI.esc(UI.fmtQty(l.cnt))}</div>
        <div class="r d tnum ${l.v == null ? 'faint' : l.v < 0 ? 'bad' : l.v > 0 ? 'good' : 'faint'}">${l.v == null ? '—' : fmtSigned(l.v)}</div>
      </div>${l.note ? `<div class="noterow">↳ ${UI.esc(t('count.notePrefix'))} · ${UI.esc(l.note)}</div>` : ''}`;
    };
    el.innerHTML = `
      <div class="topbar">
        <button class="back" data-a="backwalk">‹ ${UI.esc(t('count.title'))}</button>
        <div class="micro tnum">${UI.esc(UI.fmtDate(c.bd))}</div>
      </div>
      <div class="h1">${UI.esc(t('count.h1'))}</div>
      <div class="sum">
        <div class="sumcol"><div class="micro">${UI.esc(t('count.attendu'))}</div><div class="mid tnum">${UI.esc(UI.fmtQty(sumExp))}</div></div>
        <div class="sumcol"><div class="micro">${UI.esc(t('count.compte'))}</div><div class="mid tnum">${UI.esc(UI.fmtQty(sumCnt))}</div></div>
        <div class="sumcol"><div class="micro">${UI.esc(t('count.ecart'))}</div><div class="mid tnum ${sumVar < 0 ? 'bad' : sumVar > 0 ? 'good' : 'faint'}">${fmtSigned(sumVar)}</div></div>
      </div>
      ${missing.length ? `<div class="sub2">${UI.esc(I18N.plural('count.missing', missing.length))}</div>` : ''}
      <div class="thead"><div>${UI.esc(t('count.article'))}</div><div class="r">${UI.esc(t('count.att'))}</div><div class="r">${UI.esc(t('count.cpt'))}</div><div class="r">${UI.esc(t('count.ecart'))}</div></div>
      ${withVar.map(rowHtml).join('')}
      ${clean.length ? `<button class="grouprow" data-a="toggleclean">
        <span class="micro">${UI.esc(I18N.plural('count.noVar', clean.length))}</span><span class="chev">${V.showClean ? '⌄' : '›'}</span>
      </button>` : ''}
      ${V.showClean ? clean.map(rowHtml).join('') : ''}
      <div class="bottomstack">
        <button class="btn btn--gold" data-a="close">${UI.esc(t('count.closeDay'))}</button>
        <button class="textbtn" data-a="pdf">${UI.esc(t('count.exportPdf'))}</button>
      </div>`;
  }

  function exportPdf(c, items) {
    const lines = items.map(it => {
      const l = c.lines.find(x => x.itemId === it.id);
      return { name: it.name, exp: l ? l.expected : Store.countExpected(it.id, c.bd), cnt: l ? l.counted : '', v: l ? l.variance : '', note: l?.note || '' };
    });
    const rows = lines.map(l => `<tr><td>${UI.esc(l.name)}</td><td style="text-align:right">${UI.esc(UI.fmtQty(l.exp))}</td><td style="text-align:right">${l.cnt === '' ? '' : UI.esc(UI.fmtQty(l.cnt))}</td><td style="text-align:right" class="${l.v < 0 ? 'neg' : l.v > 0 ? 'pos' : ''}">${l.v === '' ? '' : fmtSigned(l.v)}</td><td>${UI.esc(l.note)}</td></tr>`).join('');
    UI.printHTML(`${t('count.h1')} — ${UI.fmtDate(c.bd)}`,
      `<table><thead><tr><th>${UI.esc(t('count.article'))}</th><th style="text-align:right">${UI.esc(t('count.attendu'))}</th><th style="text-align:right">${UI.esc(t('count.compte'))}</th><th style="text-align:right">${UI.esc(t('count.ecart'))}</th><th>${UI.esc(t('count.note'))}</th></tr></thead><tbody>${rows}</tbody></table>`);
  }

  UI.registerScreen({
    id: 'count',
    render(el) {
      if (!Store.isOwner) { UI.go(Store.state.session ? 'sell' : 'login'); return; }
      const items = orderedItems();
      const c = openCount();
      if (!c) V.mode = 'entry';
      if (V.mode === 'walk' && c) renderWalk(el, c, items);
      else if (V.mode === 'review' && c) renderReview(el, c, items);
      else renderEntry(el);

      el.addEventListener('click', async e => {
        const lineEl = e.target.closest('[data-line]');
        if (lineEl && c) { const item = Store.item(lineEl.dataset.line); if (item) lineSheet(c, item); return; }
        const b = e.target.closest('[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'back') UI.go('dashboard');
        else if (a === 'report') UI.go('reports', { day: Store.todayBd() });
        else if (a === 'start') {
          const oc = Store.openCount();
          V.mode = 'walk'; V.buf = '';
          V.idx = items.findIndex(it => !oc.lines.some(l => l.itemId === it.id));
          if (V.idx === -1) V.mode = 'review';
          UI.refresh();
        }
        else if (a === 'exit') { V.mode = 'entry'; V.buf = ''; UI.refresh(); }
        else if (a === 'scan') {
          UI.scan({ onCode: code => {
            const item = Store.findByBarcode(code);
            const i2 = items.findIndex(x => x.id === item?.id);
            if (i2 >= 0) { V.idx = i2; V.buf = ''; UI.haptic('success'); UI.refresh(); }
            else UI.toast(t('sell.noresults'), { type: 'danger' });
          } });
        }
        else if (a === 'prev') { if (V.idx > 0) { V.idx--; V.buf = ''; UI.refresh(); } }
        else if (a === 'skip') { advance(items); }
        else if (a === 'ok') {
          const it = items[V.idx];
          const v = parseBuf(V.buf);
          if (v != null && c) Store.setCountLine(c.id, it.id, v);
          advance(items, v != null);
        }
        else if (a === 'backwalk') { V.mode = 'walk'; V.idx = Math.max(0, items.length - 1); V.buf = ''; UI.refresh(); }
        else if (a === 'toggleclean') { V.showClean = !V.showClean; UI.refresh(); }
        else if (a === 'pdf') { if (c) exportPdf(c, items); }
        else if (a === 'close') {
          if (!c) return;
          if (await UI.confirm(t('count.reviewHint'), { title: t('count.closeDay'), yes: t('count.closeDay') })) {
            Store.closeCount(c.id);
            V.mode = 'entry'; V.buf = ''; V.showClean = false;
            ceremony(el);
          }
        }
      });

      function advance(items2, counted) {
        V.buf = '';
        if (V.idx >= items2.length - 1) { V.mode = 'review'; }
        else V.idx++;
        if (counted) UI.haptic('light');
        UI.refresh();
      }
    },
  });
})();
