/* ============ 26 — reports: history list, day report, CSV/PDF exports (owner only) ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'rep.openHint': 'Comptage en cours — clôturez-le pour générer le rapport.',
      'rep.sold_one': '{n} unité vendue', 'rep.sold_many': '{n} unités vendues',
      'rep.wasteN_one': '{n} perte', 'rep.wasteN_many': '{n} pertes',
      'rep.from': 'Du', 'rep.to': 'Au', 'rep.colDate': 'Date',
      'rep.soldLbl': 'unités vendues', 'rep.restocked': 'unités livrées', 'rep.wasted': 'unités perdues',
      'rep.notFound': 'Rapport introuvable',
      'rep.notFoundSub': 'Journée en cours — clôturez le comptage pour figer les écarts.',
      'rep.cleanN_one': '{n} article juste', 'rep.cleanN_many': '{n} articles justes',
      'rep.noSales': 'Aucune vente enregistrée ce jour-là.',
      'rep.noRestocks': 'Aucune livraison ce jour-là.',
      'rep.noWaste': 'Aucune perte déclarée ce jour-là.',
      'rep.voidedTag': 'Annulée',
      'rep.rangeEmpty': 'Aucune journée clôturée dans cette période.',
      'rep.auto': 'Non compté — valeur attendue conservée',
      'rep.closedBy': 'Clôturé par {name} à {time}',
      'rep.days': 'Journal',
      'rep.kSold': 'Vendu', 'rep.kRest': 'Livré',
      'rep.voidBtn': 'Annuler',
      'rep.varN_one': '{n} écart', 'rep.varN_many': '{n} écarts',
      'rep.exportRangeBtn': 'Exporter une période',
      'rep.dayOpen': 'en cours',
      'rep.jSold': '{n} vendus', 'rep.jIn': '+{n} livrés', 'rep.jOut': '−{n} retirés',
      'rep.noDaysJ': 'Rien pour l’instant',
      'rep.noDaysJSub': 'Chaque journée s’enregistre ici automatiquement dès la première vente ou livraison.',
    },
    en: {
      'rep.openHint': 'Count in progress — close it to generate the report.',
      'rep.sold_one': '{n} unit sold', 'rep.sold_many': '{n} units sold',
      'rep.wasteN_one': '{n} loss', 'rep.wasteN_many': '{n} losses',
      'rep.from': 'From', 'rep.to': 'To', 'rep.colDate': 'Date',
      'rep.soldLbl': 'units sold', 'rep.restocked': 'units delivered', 'rep.wasted': 'units lost',
      'rep.notFound': 'Report not found',
      'rep.notFoundSub': 'Day in progress — close the count to lock in variances.',
      'rep.cleanN_one': '{n} item spot-on', 'rep.cleanN_many': '{n} items spot-on',
      'rep.noSales': 'No sales recorded that day.',
      'rep.noRestocks': 'No deliveries that day.',
      'rep.noWaste': 'No waste recorded that day.',
      'rep.voidedTag': 'Voided',
      'rep.rangeEmpty': 'No closed days in this range.',
      'rep.auto': 'Not counted — expected value kept',
      'rep.closedBy': 'Closed by {name} at {time}',
      'rep.days': 'Days',
      'rep.kSold': 'Sold', 'rep.kRest': 'Delivered',
      'rep.voidBtn': 'Void',
      'rep.varN_one': '{n} discrepancy', 'rep.varN_many': '{n} discrepancies',
      'rep.exportRangeBtn': 'Export a date range',
      'rep.dayOpen': 'open',
      'rep.jSold': '{n} sold', 'rep.jIn': '+{n} in', 'rep.jOut': '−{n} out',
      'rep.noDaysJ': 'Nothing yet',
      'rep.noDaysJSub': 'Every day is recorded here automatically from the first sale or delivery.',
    },
  });

  /* ---------- helpers ---------- */
  const S = () => Store.state;
  const esc = (...a) => UI.esc(...a);
  const fq = n => UI.fmtQty(n);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const sgn = v => v === 0 ? '±0' : (v > 0 ? '+' : '−') + fq(Math.abs(v));
  const dcls = v => v < 0 ? 'bad' : v > 0 ? 'good' : 'faint';
  const pcls = v => v < 0 ? 'neg' : v > 0 ? 'pos' : '';
  const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
  const longDate = bd => cap(UI.fmtDate(bd, { weekday: 'long', day: 'numeric', month: 'long' }));
  const r2 = n => Math.round(n * 100) / 100;
  const sumBd = (arr, bd, skipVoid) => {
    let s = 0;
    for (const e of arr) if (e.bd === bd && !(skipVoid && e.voidedAt)) s += e.qty;
    return r2(s);
  };
  const varTotal = c => r2(c.lines.reduce((s, l) => s + (l.variance || 0), 0));
  const lossValue = c => {
    let s = 0;
    for (const l of c.lines) {
      if (l.variance >= 0) continue;
      const it = Store.item(l.itemId);
      if (it && it.cost != null) s += -l.variance * it.cost;
    }
    return r2(s);
  };
  const hasCosts = () => S().items.some(i => i.cost != null);
  const bySort = (a, b) => (Store.item(a.itemId)?.sort ?? 0) - (Store.item(b.itemId)?.sort ?? 0);
  const nameOf = l => Store.item(l.itemId)?.name || '?';
  const catOf = l => { const it = Store.item(l.itemId); const c = it && Store.cat(it.catId); return c ? Store.catName(c) : ''; };
  const tickOf = itemId => { const it = Store.item(itemId); const c = it && Store.cat(it.catId); return c ? c.hex : 'var(--t3)'; };
  const noteOf = l => l.note || (l.autofilled ? t('rep.auto') : '');
  const varLinesOf = c => c.lines.filter(l => l.variance !== 0).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  const rangeCounts = (from, to) => Store.closedCounts().filter(c => c.bd >= from && c.bd <= to).sort((a, b) => a.bd < b.bd ? -1 : 1);

  /* transient view state — survives UI.refresh() re-renders */
  const range = { from: null, to: null };
  let lastDay = null, cleanOpen = false;

  /* ---------- scoped css (appended once) ---------- */
  let cssIn = false;
  function ensureCss() {
    if (cssIn) return; cssIn = true;
    document.head.appendChild(UI.el(`<style>
[data-screen=reports] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
[data-screen=reports] .h1{font:600 24px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
[data-screen=reports] .rep-open{margin-top:16px}
[data-screen=reports] .rep-cont{flex:none;padding:10px 0 10px 12px;font-size:13px;font-weight:600;color:var(--brass);text-align:right}
[data-screen=reports] .rep-th3,[data-screen=reports] .rep-drow{grid-template-columns:1fr 64px 84px}
[data-screen=reports] .rep-drow{display:grid;min-height:56px;align-items:center;border-bottom:1px solid var(--hair);width:100%;text-align:left;font-size:14px}
[data-screen=reports] .rep-dd{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px}
[data-screen=reports] .rep-sum{display:block;font-size:11px;font-weight:400;color:var(--t3);margin-top:2px;font-variant-numeric:tabular-nums}
[data-screen=reports] .rep-drow{padding:8px 0}
[data-screen=reports] .rep-dvar{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
[data-screen=reports] .rep-nvar{font-size:10px;font-weight:600;color:var(--bad)}
[data-screen=reports] .rep-okline{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--hair)}
[data-screen=reports] .rep-okline svg{width:20px;height:20px;flex:none;color:var(--ok)}
[data-screen=reports] .rep-okline .row__t{color:var(--ok)}
[data-screen=reports] .row__t .qtybubble{margin-left:6px}
[data-screen=reports] .rep-meta{flex:none;text-align:right}
[data-screen=reports] .rep-time{display:block;font:500 12px var(--f-display);color:var(--t3);font-variant-numeric:tabular-nums}
[data-screen=reports] .rep-by{display:block;font-size:11px;color:var(--t3);margin-top:2px}
[data-screen=reports] .rep-cancel{flex:none;padding:8px 0 8px 4px;font-size:12px;font-weight:500;color:var(--t2)}
[data-screen=reports] .rep-tag{flex:none;font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--t3)}
[data-screen=reports] .rep-void .row__t,[data-screen=reports] .rep-void .qtybubble{text-decoration:line-through;opacity:.55}
[data-screen=reports] .rep-void .feedtick{opacity:.4}
</style>`));
  }

  /* ---------- exports: shared bits ---------- */
  const csvHead = () => [t('rep.colDate'), t('inv.category'), t('rep.item'), t('count.expected'), t('count.counted'), t('dash.variance'), t('count.note')];
  const csvLine = (c, l) => [c.bd, catOf(l), nameOf(l), fq(l.expected), fq(l.counted), fq(l.variance), noteOf(l)];
  const thRow = cols => `<tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>`;
  const pdfVarTable = lines => `<table>${thRow([t('inv.category'), t('rep.item'), t('count.expected'), t('count.counted'), t('dash.variance'), t('count.note')])}
    ${lines.map(l => `<tr><td>${esc(catOf(l))}</td><td>${esc(nameOf(l))}</td><td>${esc(fq(l.expected))}</td><td>${esc(fq(l.counted))}</td><td class="${pcls(l.variance)}">${esc(sgn(l.variance))}</td><td>${esc(l.note || '')}</td></tr>`).join('')}</table>`;
  const pdfKpis = (sold, rest, waste, vt, loss) => `<div class="kpis">
    <div><b>${esc(fq(sold))}</b><span>${esc(t('rep.soldLbl'))}</span></div>
    <div><b>${esc(fq(rest))}</b><span>${esc(t('rep.restocked'))}</span></div>
    <div><b>${esc(fq(waste))}</b><span>${esc(t('rep.wasted'))}</span></div>
    <div><b class="${pcls(vt)}">${esc(sgn(vt))}</b><span>${esc(t('count.varTotal'))}</span></div>
    ${loss != null ? `<div><b class="${loss > 0 ? 'neg' : ''}">${esc(UI.money(loss))}</b><span>${esc(t('rep.lossValue'))}</span></div>` : ''}
  </div>`;

  function exportCsvRange(from, to) {
    const cs = rangeCounts(from, to);
    if (!cs.length) return UI.toast(t('rep.rangeEmpty'), { type: 'danger' });
    const rows = [csvHead()];
    for (const c of cs) for (const l of [...c.lines].sort(bySort)) rows.push(csvLine(c, l));
    UI.csv(rows, `${slug(t('rep.title'))}-${from}_${to}.csv`);
    UI.haptic('success');
  }

  function exportPdfRange(from, to) {
    const cs = rangeCounts(from, to);
    if (!cs.length) return UI.toast(t('rep.rangeEmpty'), { type: 'danger' });
    let sold = 0, rest = 0, waste = 0, vt = 0, loss = 0;
    for (const c of cs) {
      sold += sumBd(S().sales, c.bd, true); rest += sumBd(S().restocks, c.bd);
      waste += sumBd(S().waste, c.bd); vt += varTotal(c); loss += lossValue(c);
    }
    let body = pdfKpis(r2(sold), r2(rest), r2(waste), r2(vt), hasCosts() ? r2(loss) : null);
    for (const c of cs) {
      const dSold = sumBd(S().sales, c.bd, true), dWaste = sumBd(S().waste, c.bd), dVt = varTotal(c);
      body += `<h2>${esc(longDate(c.bd))}</h2>
        <div class="sub">${esc(I18N.plural('rep.sold', dSold, { n: fq(dSold) }))} · ${esc(t('rep.wasted'))} : ${esc(fq(dWaste))} · ${esc(t('count.varTotal'))} : ${esc(sgn(dVt))}</div>`;
      const v = varLinesOf(c);
      body += v.length ? pdfVarTable(v) : `<p style="color:#1E8E5A;margin:6px 0 16px">${esc(t('count.clean'))} — ${esc(t('count.cleanSub'))}</p>`;
    }
    UI.printHTML(`${t('rep.title')} — ${UI.fmtDate(from)} → ${UI.fmtDate(to)}`, body);
    UI.haptic('success');
  }

  function exportCsvDay(c) {
    const rows = [csvHead()];
    for (const l of [...c.lines].sort(bySort)) rows.push(csvLine(c, l));
    UI.csv(rows, `${slug(t('rep.day', { date: c.bd }))}.csv`);
    UI.haptic('success');
  }

  function exportPdfDay(c) {
    const bd = c.bd;
    const sold = sumBd(S().sales, bd, true), rest = sumBd(S().restocks, bd), waste = sumBd(S().waste, bd);
    let body = pdfKpis(sold, rest, waste, varTotal(c), hasCosts() ? lossValue(c) : null);
    const v = varLinesOf(c);
    body += `<h2>${esc(t('rep.countRep'))}</h2>`;
    body += v.length ? pdfVarTable(v) : `<p style="color:#1E8E5A;margin:6px 0 16px">${esc(t('count.clean'))} — ${esc(t('count.cleanSub'))}</p>`;
    const daySales = S().sales.filter(s => s.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    body += `<h2>${esc(t('rep.sales'))}</h2>`;
    body += daySales.length
      ? `<table>${thRow([t('rep.time'), t('rep.qty'), t('rep.item'), t('rep.who')])}
          ${daySales.map(s => `<tr><td>${esc(UI.fmtTime(s.at))}</td><td>${esc(fq(s.qty))}</td><td>${esc(Store.item(s.itemId)?.name || '?')}${s.voidedAt ? ` <span class="neg">(${esc(t('rep.voidedTag'))})</span>` : ''}</td><td>${esc(s.by)}</td></tr>`).join('')}</table>`
      : `<p>${esc(t('rep.noSales'))}</p>`;
    const dayWaste = S().waste.filter(w => w.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    if (dayWaste.length) {
      body += `<h2>${esc(t('rep.waste'))}</h2>
        <table>${thRow([t('rep.time'), t('rep.qty'), t('rep.item'), t('waste.reason'), t('rep.who')])}
        ${dayWaste.map(w => `<tr><td>${esc(UI.fmtTime(w.at))}</td><td class="neg">${esc('−' + fq(w.qty))}</td><td>${esc(Store.item(w.itemId)?.name || '?')}</td><td>${esc(w.reason || '')}</td><td>${esc(w.by)}</td></tr>`).join('')}</table>`;
    }
    UI.printHTML(t('rep.day', { date: longDate(bd) }), body);
    UI.haptic('success');
  }

  /* ---------- export range sheet ---------- */
  function rangeSheet() {
    const days = Store.closedCounts();
    if (!days.length) return;
    const min = days[days.length - 1].bd, max = days[0].bd;
    const defFrom = days[Math.min(days.length - 1, 6)].bd;
    const from = range.from || defFrom, to = range.to || max;
    const c = UI.el(`<div>
      <div class="micro" style="margin-bottom:16px">${esc(t('rep.export'))} — ${esc(t('rep.exportRange'))}</div>
      <div style="display:flex;gap:12px">
        <div class="field" style="flex:1"><label>${esc(t('rep.from'))}</label><input type="date" data-r="from" value="${from}" min="${min}" max="${max}"></div>
        <div class="field" style="flex:1"><label>${esc(t('rep.to'))}</label><input type="date" data-r="to" value="${to}" min="${min}" max="${max}"></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn btn--ghost" style="flex:1" data-a="csv">${esc(t('rep.exportCsv'))}</button>
        <button class="btn btn--gold" style="flex:1" data-a="pdf">${esc(t('rep.exportPdf'))}</button>
      </div>
    </div>`);
    const sh = UI.sheet(c);
    const getRange = () => {
      let f = c.querySelector('[data-r=from]').value || defFrom;
      let x = c.querySelector('[data-r=to]').value || max;
      if (f > x) { const y = f; f = x; x = y; }
      return [f, x];
    };
    c.addEventListener('change', e => {
      const r = e.target.closest('[data-r]');
      if (r) range[r.dataset.r] = r.value;
    });
    c.addEventListener('click', e => {
      const isCsv = e.target.closest('[data-a=csv]'), isPdf = e.target.closest('[data-a=pdf]');
      if (!isCsv && !isPdf) return;
      const [f, x] = getRange();
      if (isCsv) exportCsvRange(f, x); else exportPdfRange(f, x);
      if (rangeCounts(f, x).length) sh.close();
    });
  }

  /* ---------- list mode (root tab) ---------- */
  /** every business day that saw activity — the automatic daily journal.
   *  A day appears the moment anything happens on it; closing a count adds its variance. */
  function journalDays() {
    const st = S(), seen = new Set();
    for (const arr of [st.sales, st.restocks, st.waste]) for (const e of arr) seen.add(e.bd);
    for (const c of st.counts) if (!c.isOpening) seen.add(c.bd);
    seen.add(Store.todayBd());
    return [...seen].sort().reverse();
  }

  function dayRow(bd) {
    const c = Store.closedCounts().find(x => x.bd === bd);
    const sold = sumBd(S().sales, bd, true);
    const inQ = sumBd(S().restocks, bd);
    const outQ = sumBd(S().waste, bd);
    const today = bd === Store.todayBd();
    let vHtml;
    if (!c) {
      vHtml = `<span class="d faint tnum">${today ? esc(t('rep.dayOpen')) : '—'}</span>`;
    } else {
      const vt = varTotal(c);
      const nVar = c.lines.filter(l => l.variance !== 0).length;
      /* any nonzero line ⇒ danger-colored count — a day never looks clean by netting out */
      vHtml = nVar === 0
        ? `<span class="d faint tnum">${esc(sgn(0))}</span>`
        : `<span class="d ${vt > 0 ? 'good' : 'bad'} tnum">${esc(sgn(vt))}</span>
           <span class="rep-nvar tnum">${esc(I18N.plural('rep.varN', nVar, { n: nVar }))}</span>`;
    }
    const bits = [];
    if (sold) bits.push(t('rep.jSold', { n: fq(sold) }));
    if (inQ) bits.push(t('rep.jIn', { n: fq(inQ) }));
    if (outQ) bits.push(t('rep.jOut', { n: fq(outQ) }));
    return `<button class="rep-drow" data-day="${esc(bd)}">
      <span class="rep-dd">${esc(longDate(bd))}${bits.length ? `<span class="rep-sum">${esc(bits.join(' · '))}</span>` : ''}</span>
      <span class="r v2 tnum">${esc(fq(sold))}</span>
      <span class="rep-dvar">${vHtml}</span>
    </button>`;
  }

  function renderList(el) {
    const days = journalDays();
    const open = S().counts.find(c => c.status === 'open');
    let html = `
      <div class="topbar">
        ${UI.logoMark(26)}
        <div class="micro tnum">${esc(UI.fmtDate(Store.todayBd()))}</div>
      </div>
      <div class="h1">${esc(t('tab.reports'))}</div>`;
    if (open) {
      html += `<div class="row rep-open">
        <span class="livedot"></span>
        <span class="row__body">
          <span class="row__t">${esc(t('rep.openDay'))} · <span class="num">${esc(UI.fmtDate(open.bd))}</span></span>
          <span class="row__s">${esc(t('rep.openHint'))}</span>
        </span>
        <span class="row__end"><button class="textbtn rep-cont" data-a="count">${esc(t('g.continue'))}</button></span>
      </div>`;
    }
    if (!days.length) {
      html += `<div class="empty grow">
        <div class="empty__t">${esc(t('rep.noDaysJ'))}</div>
        <div class="empty__s">${esc(t('rep.noDaysJSub'))}</div>
      </div>`;
    } else {
      html += `<div class="sec"><div class="micro">${esc(t('rep.days'))}</div><div class="micro tnum">${days.length}</div></div>
        <div class="thead rep-th3"><div>${esc(t('rep.colDate'))}</div><div class="r">${esc(t('rep.kSold'))}</div><div class="r">${esc(t('count.ecart'))}</div></div>
        ${days.map(dayRow).join('')}
        <div class="bottomstack">
          <button class="textbtn" data-a="range">${esc(t('rep.exportRangeBtn'))}</button>
        </div>`;
    }
    el.innerHTML = html;
    el.addEventListener('click', e => {
      if (e.target.closest('[data-a=count]')) { UI.haptic('light'); return UI.go('count'); }
      if (e.target.closest('[data-a=insights]')) { UI.haptic('light'); return UI.go('insights', { from: 'reports' }); }
      const d = e.target.closest('[data-day]');
      if (d) { UI.haptic('light'); return UI.go('reports', { day: d.dataset.day }); }
      if (e.target.closest('[data-a=range]')) return rangeSheet();
    });
  }

  /* ---------- day mode ---------- */
  function countRow(l) {
    const note = noteOf(l);
    return `<div class="trow">
      <div class="tname"><span class="feedtick" style="background:${tickOf(l.itemId)}"></span><span>${esc(nameOf(l))}</span></div>
      <div class="r v1 tnum">${esc(fq(l.expected))}</div>
      <div class="r v2 tnum">${esc(fq(l.counted))}</div>
      <div class="r d tnum ${dcls(l.variance)}">${esc(sgn(l.variance))}</div>
    </div>${note ? `<div class="noterow">↳ ${esc(t('count.notePrefix'))} · ${esc(note)}</div>` : ''}`;
  }
  function saleRow(s) {
    const it = Store.item(s.itemId);
    return `<div class="row ${s.voidedAt ? 'rep-void' : ''}">
      <span class="feedtick" style="background:${tickOf(s.itemId)}"></span>
      <span class="row__body">
        <span class="row__t">${esc(it?.name || '?')}<span class="qtybubble">${s.glasses ? esc(Object.entries(s.pours || { '?': s.glasses }).map(([m, n]) => n + '×' + m + 'ml').join(' · ')) : '×' + esc(fq(s.qty))}</span></span>
      </span>
      <span class="rep-meta">
        <span class="rep-time">${esc(UI.fmtTime(s.at))}</span>
        <span class="rep-by">${esc(s.by)}</span>
      </span>
      ${s.voidedAt
        ? `<span class="rep-tag">${esc(t('rep.voidedTag'))}</span>`
        : Store.isDayClosed(s.bd)
          ? ''
          : `<button class="rep-cancel" data-void="${esc(s.id)}" aria-label="${esc(t('rep.void'))}">${esc(t('rep.voidBtn'))}</button>`}
    </div>`;
  }
  function restockRow(r) {
    const it = Store.item(r.itemId);
    return `<div class="row">
      <span class="feedtick" style="background:${tickOf(r.itemId)}"></span>
      <span class="row__body">
        <span class="row__t">${esc(it?.name || '?')}<span class="qtybubble varpos">+${esc(fq(r.qty))}</span></span>
      </span>
      <span class="rep-meta">
        <span class="rep-time">${esc(UI.fmtTime(r.at))}</span>
        <span class="rep-by">${esc(r.by)}</span>
      </span>
    </div>`;
  }
  function wasteRow(w) {
    const it = Store.item(w.itemId);
    return `<div class="row">
      <span class="feedtick" style="background:${tickOf(w.itemId)}"></span>
      <span class="row__body">
        <span class="row__t">${esc(it?.name || '?')}<span class="qtybubble varneg">−${esc(fq(w.qty))}</span></span>
        ${w.reason ? `<span class="row__s">${esc(w.reason)}</span>` : ''}
      </span>
      <span class="rep-meta">
        <span class="rep-time">${esc(UI.fmtTime(w.at))}</span>
        <span class="rep-by">${esc(w.by)}</span>
      </span>
    </div>`;
  }

  /** movement lists for a day, used both in a closed-day report and in a still-open day */
  function dayActivityHtml(bd) {
    const st = S();
    const sales = st.sales.filter(s => s.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    const rest = st.restocks.filter(r => r.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    const wst = st.waste.filter(w => w.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    let h = `<div class="sec"><div class="micro">${esc(t('rep.sales'))}</div><div class="micro tnum">${sales.length}</div></div>`;
    h += sales.length ? `<div class="feed">${sales.map(saleRow).join('')}</div>` : `<div class="sub2">${esc(t('rep.noSales'))}</div>`;
    h += `<div class="sec"><div class="micro">${esc(t('rep.restocks'))}</div><div class="micro tnum">${rest.length}</div></div>`;
    h += rest.length ? `<div class="feed">${rest.map(restockRow).join('')}</div>` : `<div class="sub2">${esc(t('rep.noRestocks'))}</div>`;
    h += `<div class="sec"><div class="micro">${esc(t('rep.waste'))}</div><div class="micro tnum">${wst.length}</div></div>`;
    h += wst.length ? `<div class="feed">${wst.map(wasteRow).join('')}</div>` : `<div class="sub2">${esc(t('rep.noWaste'))}</div>`;
    return h;
  }

  function renderDay(el, bd) {
    if (lastDay !== bd) { lastDay = bd; cleanOpen = false; }
    const c = Store.closedCounts().find(x => x.bd === bd);
    if (!c) {
      el.innerHTML = `
        <div class="topbar">
          <button class="back" data-a="back">‹ ${esc(t('tab.reports'))}</button>
          <div class="micro tnum">${esc(UI.fmtDate(bd))}</div>
        </div>
        <div class="h1">${esc(longDate(bd))}</div>
        <div class="sum">
          <div class="sumcol"><div class="micro">${esc(t('rep.kSold'))}</div><div class="mid tnum">${esc(fq(sumBd(S().sales, bd, true)))}</div></div>
          <div class="sumcol"><div class="micro">${esc(t('rep.kRest'))}</div><div class="mid tnum">${esc(fq(sumBd(S().restocks, bd)))}</div></div>
          <div class="sumcol"><div class="micro">${esc(t('rep.waste'))}</div><div class="mid tnum">${esc(fq(sumBd(S().waste, bd)))}</div></div>
        </div>
        <div class="sub2">${esc(t('rep.notFoundSub'))}</div>
        ${dayActivityHtml(bd)}`;
      el.addEventListener('click', e => {
        if (e.target.closest('[data-a=back]')) { UI.haptic('light'); UI.go('reports'); }
      });
      return;
    }
    const st = S();
    const sold = sumBd(st.sales, bd, true), rest = sumBd(st.restocks, bd), waste = sumBd(st.waste, bd);
    const vt = varTotal(c), loss = lossValue(c), costs = hasCosts();
    const varLines = varLinesOf(c);
    const cleanLines = c.lines.filter(l => l.variance === 0).sort(bySort);
    const daySales = st.sales.filter(s => s.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    const dayRest = st.restocks.filter(r => r.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);
    const dayWaste = st.waste.filter(w => w.bd === bd).sort((a, b) => a.at < b.at ? -1 : 1);

    let html = `
      <div class="topbar">
        <button class="back" data-a="back">‹ ${esc(t('tab.reports'))}</button>
        <div class="micro tnum">${esc(UI.fmtDate(bd))}</div>
      </div>
      <div class="h1">${esc(longDate(bd))}</div>
      ${c.closedAt ? `<div class="sub2">${esc(t('rep.closedBy', { name: c.closedBy || '', time: UI.fmtTime(c.closedAt) }))} · ${esc(t('count.frozen'))}</div>` : ''}
      <div class="sum">
        <div class="sumcol"><div class="micro">${esc(t('rep.kSold'))}</div><div class="mid tnum">${esc(fq(sold))}</div></div>
        <div class="sumcol"><div class="micro">${esc(t('rep.kRest'))}</div><div class="mid tnum">${esc(fq(rest))}</div></div>
        <div class="sumcol"><div class="micro">${esc(t('count.ecart'))}</div><div class="mid tnum ${dcls(vt)}">${esc(sgn(vt))}</div></div>
      </div>
      <div class="sub2"><span class="num">${esc(fq(waste))}</span> ${esc(t('rep.wasted'))}${costs ? ` · ${esc(t('rep.lossValue'))} <span class="num ${loss > 0 ? 'bad' : ''}">${esc(UI.money(loss))}</span>` : ''}</div>`;

    /* 1 — count & variance: reference frame 03 table, variance first */
    html += `<div class="sec"><div class="micro">${esc(t('rep.countRep'))}</div>
      ${varLines.length ? `<div class="micro tnum" style="color:var(--bad)">${varLines.length}</div>` : ''}</div>`;
    if (c.lines.length) {
      html += `<div class="thead"><div>${esc(t('count.article'))}</div><div class="r">${esc(t('count.att'))}</div><div class="r">${esc(t('count.cpt'))}</div><div class="r">${esc(t('count.ecart'))}</div></div>`;
      html += varLines.map(countRow).join('');
      if (!varLines.length) {
        html += `<div class="rep-okline">${UI.icon('check')}
          <span class="row__body"><span class="row__t">${esc(t('count.clean'))}</span><span class="row__s">${esc(t('count.cleanSub'))}</span></span>
        </div>`;
      }
      if (cleanLines.length) {
        html += `<button class="grouprow" data-a="clean" aria-expanded="${cleanOpen}">
          <span class="micro">${esc(I18N.plural('count.noVar', cleanLines.length))}</span>
          <span class="chev" data-chev>${cleanOpen ? '⌄' : '›'}</span>
        </button>
        <div class="rep-cl ${cleanOpen ? '' : 'hidden'}">${cleanLines.map(countRow).join('')}</div>`;
      }
    } else {
      html += `<div class="sub2">${esc(t('ins.noData'))}</div>`;
    }

    /* 2 — sales */
    html += `<div class="sec"><div class="micro">${esc(t('rep.sales'))}</div><div class="micro tnum">${daySales.length}</div></div>`;
    html += daySales.length ? `<div class="feed">${daySales.map(saleRow).join('')}</div>` : `<div class="sub2">${esc(t('rep.noSales'))}</div>`;

    /* 3 — restocks */
    html += `<div class="sec"><div class="micro">${esc(t('rep.restocks'))}</div><div class="micro tnum">${dayRest.length}</div></div>`;
    html += dayRest.length ? `<div class="feed">${dayRest.map(restockRow).join('')}</div>` : `<div class="sub2">${esc(t('rep.noRestocks'))}</div>`;

    /* 4 — waste (with reasons) */
    html += `<div class="sec"><div class="micro">${esc(t('rep.waste'))}</div><div class="micro tnum">${dayWaste.length}</div></div>`;
    html += dayWaste.length ? `<div class="feed">${dayWaste.map(wasteRow).join('')}</div>` : `<div class="sub2">${esc(t('rep.noWaste'))}</div>`;

    /* export this day */
    html += `<div class="bottomstack">
      <div style="display:flex;gap:12px">
        <button class="btn btn--ghost" style="flex:1" data-a="dcsv">${esc(t('rep.exportCsv'))}</button>
        <button class="btn btn--gold" style="flex:1" data-a="dpdf">${esc(t('rep.exportPdf'))}</button>
      </div>
    </div>`;

    el.innerHTML = html;

    el.addEventListener('click', async e => {
      if (e.target.closest('[data-a=back]')) { UI.haptic('light'); return UI.go('reports'); }
      const tg = e.target.closest('[data-a=clean]');
      if (tg) {
        cleanOpen = !cleanOpen;
        el.querySelector('.rep-cl')?.classList.toggle('hidden', !cleanOpen);
        const ch = tg.querySelector('[data-chev]');
        if (ch) ch.textContent = cleanOpen ? '⌄' : '›';
        tg.setAttribute('aria-expanded', String(cleanOpen));
        UI.haptic('light');
        return;
      }
      const v = e.target.closest('[data-void]');
      if (v) {
        const ok = await UI.confirm(t('rep.voidWarn'), { danger: true, title: t('rep.void') });
        if (ok && Store.voidSale(v.dataset.void)) {
          UI.haptic('warn');
          UI.toast(t('rep.voided'), { type: 'ok' });
        }
        return;
      }
      if (e.target.closest('[data-a=dcsv]') || e.target.closest('[data-a=dpdf]')) {
        const fresh = Store.closedCounts().find(x => x.bd === bd);
        if (!fresh) return UI.toast(t('rep.notFound'), { type: 'danger' });
        return e.target.closest('[data-a=dcsv]') ? exportCsvDay(fresh) : exportPdfDay(fresh);
      }
    });
  }

  /* ---------- register ---------- */
  UI.registerScreen({
    id: 'reports',
    render(el, params) {
      ensureCss();
      if (!Store.isOwner) {
        UI.go(Store.state.session ? 'sell' : 'login'); return;
        setTimeout(() => UI.go(S().session ? 'sell' : 'login'), 0);
        return;
      }
      if (params && params.day) renderDay(el, params.day);
      else renderList(el);
    },
  });
})();
