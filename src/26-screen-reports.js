/* ============ 26 — reports: history list, day report, CSV/PDF exports (owner only) ============ */
(() => {
  I18N.extend({
    fr: {
      'rep.openHint': 'Comptage en cours — clôturez-le pour générer le rapport.',
      'rep.sold_one': '{n} unité vendue', 'rep.sold_many': '{n} unités vendues',
      'rep.wasteN_one': '{n} perte', 'rep.wasteN_many': '{n} pertes',
      'rep.from': 'Du', 'rep.to': 'Au', 'rep.colDate': 'Date',
      'rep.soldLbl': 'unités vendues', 'rep.restocked': 'unités livrées', 'rep.wasted': 'unités perdues',
      'rep.notFound': 'Rapport introuvable',
      'rep.notFoundSub': 'Aucun comptage clôturé pour cette date.',
      'rep.cleanN_one': '{n} article juste', 'rep.cleanN_many': '{n} articles justes',
      'rep.noSales': 'Aucune vente enregistrée ce jour-là.',
      'rep.noRestocks': 'Aucune livraison ce jour-là.',
      'rep.noWaste': 'Aucune perte déclarée ce jour-là.',
      'rep.voidedTag': 'Annulée',
      'rep.rangeEmpty': 'Aucune journée clôturée dans cette période.',
      'rep.auto': 'Non compté — valeur attendue conservée',
      'rep.closedBy': 'Clôturé par {name} à {time}',
    },
    en: {
      'rep.openHint': 'Count in progress — close it to generate the report.',
      'rep.sold_one': '{n} unit sold', 'rep.sold_many': '{n} units sold',
      'rep.wasteN_one': '{n} loss', 'rep.wasteN_many': '{n} losses',
      'rep.from': 'From', 'rep.to': 'To', 'rep.colDate': 'Date',
      'rep.soldLbl': 'units sold', 'rep.restocked': 'units delivered', 'rep.wasted': 'units lost',
      'rep.notFound': 'Report not found',
      'rep.notFoundSub': 'No closed count for this date.',
      'rep.cleanN_one': '{n} item spot-on', 'rep.cleanN_many': '{n} items spot-on',
      'rep.noSales': 'No sales recorded that day.',
      'rep.noRestocks': 'No deliveries that day.',
      'rep.noWaste': 'No waste recorded that day.',
      'rep.voidedTag': 'Voided',
      'rep.rangeEmpty': 'No closed days in this range.',
      'rep.auto': 'Not counted — expected value kept',
      'rep.closedBy': 'Closed by {name} at {time}',
    },
  });

  /* ---------- helpers ---------- */
  const S = () => Store.state;
  const esc = (...a) => UI.esc(...a);
  const fq = n => UI.fmtQty(n);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const sgn = v => (v > 0 ? '+' : '') + fq(v);
  const vcls = v => v < 0 ? 'varneg' : v > 0 ? 'varpos' : 'varzero';
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
  const varLinesOf = c => c.lines.filter(l => l.variance !== 0).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  const rangeCounts = (from, to) => Store.closedCounts().filter(c => c.bd >= from && c.bd <= to).sort((a, b) => a.bd < b.bd ? -1 : 1);

  function head(title, sub, backTo) {
    return `<header class="apphead">
      <button class="iconbtn" data-back="${backTo}" aria-label="${esc(t('g.back'))}">${UI.icon('chevL')}</button>
      <div class="apphead__titles"><h1 class="apphead__title">${esc(title)}</h1>${sub ? `<div class="apphead__sub">${esc(sub)}</div>` : ''}</div>
    </header>`;
  }

  /* transient view state — survives UI.refresh() re-renders */
  const range = { from: null, to: null };
  let lastDay = null, cleanOpen = false;

  /* ---------- scoped css (appended once) ---------- */
  let cssIn = false;
  function ensureCss() {
    if (cssIn) return; cssIn = true;
    document.head.appendChild(UI.el(`<style>
[data-screen=reports] .row__t,[data-screen=reports] .row__s{display:block}
[data-screen=reports] .rep-days{padding:6px 16px}
[data-screen=reports] .rep-days .row,[data-screen=reports] [data-a=clean]{width:100%;text-align:left}
[data-screen=reports] .pill svg{width:12px;height:12px}
[data-screen=reports] .btn svg{width:18px;height:18px}
[data-screen=reports] .rep-chev{color:var(--text-3);flex:none;transition:transform .25s cubic-bezier(.2,.8,.3,1)}
[data-screen=reports] .rep-chev svg{width:18px;height:18px}
[data-screen=reports] .rep-chev.is-open{transform:rotate(90deg)}
[data-screen=reports] .rep-range{display:flex;gap:12px}
[data-screen=reports] .rep-range .field{flex:1;margin-bottom:var(--s3)}
[data-screen=reports] .field input[type=date]{width:100%;min-height:48px;padding:12px 14px;border-radius:12px;border:1px solid var(--hairline);background:var(--surface-2);font-size:15px;color:var(--text);color-scheme:dark}
[data-screen=reports] .field input[type=date]:focus{border-color:rgba(201,154,75,.5)}
[data-screen=reports] .rep-void .row__t,[data-screen=reports] .rep-void .row__s{text-decoration:line-through;opacity:.55}
[data-screen=reports] .rep-void .row__art{opacity:.4}
[data-screen=reports] .rep-note{display:flex;align-items:flex-start;gap:5px;margin-top:3px;font-size:12px;color:var(--text-2)}
[data-screen=reports] .rep-note svg{width:13px;height:13px;flex:none;margin-top:2px;color:var(--gold)}
[data-screen=reports] .rep-okline{display:flex;align-items:center;gap:10px;padding:4px 0 8px;color:var(--ok)}
[data-screen=reports] .rep-okline svg{width:22px;height:22px;flex:none}
[data-screen=reports] .rep-loss{grid-column:1/-1;background:linear-gradient(160deg,rgba(201,154,75,.14),rgba(201,154,75,.03) 60%),var(--surface);border-color:rgba(201,154,75,.25)}
[data-screen=reports] .rep-clean{animation:rep-drop .28s cubic-bezier(.2,.8,.3,1)}
[data-screen=reports] .rep-fade{animation:rep-in .34s cubic-bezier(.2,.85,.3,1) both}
@keyframes rep-in{from{opacity:0;transform:translateY(8px)}}
@keyframes rep-drop{from{opacity:0;transform:translateY(-6px)}}
</style>`));
  }

  /* ---------- exports: shared bits ---------- */
  const csvHead = () => [t('rep.colDate'), t('inv.category'), t('rep.item'), t('count.expected'), t('count.counted'), t('dash.variance'), t('count.note')];
  const csvLine = (c, l) => [c.bd, catOf(l), nameOf(l), fq(l.expected), fq(l.counted), fq(l.variance), l.note || (l.autofilled ? t('rep.auto') : '')];
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
        ${dayWaste.map(w => `<tr><td>${esc(UI.fmtTime(w.at))}</td><td class="neg">${esc('-' + fq(w.qty))}</td><td>${esc(Store.item(w.itemId)?.name || '?')}</td><td>${esc(w.reason || '')}</td><td>${esc(w.by)}</td></tr>`).join('')}</table>`;
    }
    UI.printHTML(t('rep.day', { date: longDate(bd) }), body);
    UI.haptic('success');
  }

  /* ---------- list mode ---------- */
  function dayRow(c, i) {
    const sold = sumBd(S().sales, c.bd, true);
    const wn = S().waste.filter(w => w.bd === c.bd).length;
    const vt = varTotal(c);
    const nVar = c.lines.filter(l => l.variance !== 0).length;
    const pill = nVar === 0
      ? `<span class="pill pill--ok">${UI.icon('check')}<span class="num">0</span></span>`
      : `<span class="pill pill--danger"><span class="num">${esc(sgn(vt))}</span></span>`;
    return `<button class="row rep-fade" data-day="${c.bd}" style="animation-delay:${Math.min(i * 30, 240)}ms">
      <span class="row__body">
        <span class="row__t">${esc(longDate(c.bd))}</span>
        <span class="row__s">${esc(I18N.plural('rep.sold', sold, { n: fq(sold) }))}${wn ? ' · ' + esc(I18N.plural('rep.wasteN', wn, { n: wn })) : ''}</span>
      </span>
      <span class="row__end">${pill}</span>
      <span class="rep-chev">${UI.icon('chevR')}</span>
    </button>`;
  }

  function renderList(el) {
    const days = Store.closedCounts();
    const open = S().counts.find(c => c.status === 'open');
    let html = head(t('rep.title'), '', 'more');
    if (open) {
      html += `<div class="card card--gold rep-fade">
        <div class="card__head" style="margin-bottom:6px">
          <div class="card__title" style="display:flex;align-items:center;gap:8px"><span class="livedot"></span>${esc(t('rep.openDay'))}</div>
          <span class="pill pill--gold"><span class="num">${esc(UI.fmtDate(open.bd))}</span></span>
        </div>
        <p class="tt">${esc(t('rep.openHint'))}</p>
        <button class="btn btn--gold btn--full mt3" data-a="count">${esc(t('g.continue'))}</button>
      </div>`;
    }
    if (!days.length) {
      html += `<div class="empty grow">${UI.icon('calendar')}
        <div class="empty__t">${esc(t('rep.noDays'))}</div>
        <div class="empty__s">${esc(t('rep.noDaysSub'))}</div></div>`;
    } else {
      html += `<div class="card rep-days">${days.map(dayRow).join('')}</div>`;
      const defTo = days[0].bd, defFrom = days[Math.min(days.length - 1, 6)].bd;
      const from = range.from || defFrom, to = range.to || defTo;
      html += `<div class="card rep-fade" style="animation-delay:.1s">
        <div class="card__head"><div class="card__title">${esc(t('rep.export'))}</div><span class="eyebrow">${esc(t('rep.exportRange'))}</span></div>
        <div class="rep-range">
          <div class="field"><label>${esc(t('rep.from'))}</label><input type="date" data-r="from" value="${from}" min="${days[days.length - 1].bd}" max="${defTo}"></div>
          <div class="field"><label>${esc(t('rep.to'))}</label><input type="date" data-r="to" value="${to}" min="${days[days.length - 1].bd}" max="${defTo}"></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn--ghost" style="flex:1" data-a="csv">${UI.icon('download')}${esc(t('rep.exportCsv'))}</button>
          <button class="btn btn--gold" style="flex:1" data-a="pdf">${UI.icon('download')}${esc(t('rep.exportPdf'))}</button>
        </div>
      </div>`;
    }
    el.innerHTML = html;
    const getRange = () => {
      const ds = Store.closedCounts();
      let from = el.querySelector('[data-r=from]')?.value || ds[Math.min(ds.length - 1, 6)].bd;
      let to = el.querySelector('[data-r=to]')?.value || ds[0].bd;
      if (from > to) { const x = from; from = to; to = x; }
      return [from, to];
    };
    el.addEventListener('click', e => {
      const back = e.target.closest('[data-back]');
      if (back) { UI.haptic('light'); return UI.go(back.dataset.back); }
      if (e.target.closest('[data-a=count]')) { UI.haptic('light'); return UI.go('count'); }
      const d = e.target.closest('[data-day]');
      if (d) { UI.haptic('light'); return UI.go('reports', { day: d.dataset.day }); }
      if (e.target.closest('[data-a=csv]')) return exportCsvRange(...getRange());
      if (e.target.closest('[data-a=pdf]')) return exportPdfRange(...getRange());
    });
    el.addEventListener('change', e => {
      const r = e.target.closest('[data-r]');
      if (r) range[r.dataset.r] = r.value;
    });
  }

  /* ---------- day mode ---------- */
  function varLineRow(l) {
    const it = Store.item(l.itemId);
    return `<div class="row">
      <div class="row__art">${it ? UI.art(it) : ''}</div>
      <div class="row__body">
        <div class="row__t">${esc(nameOf(l))}</div>
        <div class="row__s"><span class="num">${esc(fq(l.expected))} → ${esc(fq(l.counted))}</span></div>
        ${l.note ? `<div class="rep-note">${UI.icon('note')}<span>${esc(l.note)}</span></div>` : ''}
      </div>
      <div class="row__end"><span class="qtybubble ${vcls(l.variance)}">${esc(sgn(l.variance))}</span></div>
    </div>`;
  }
  function cleanLineRow(l) {
    return `<div class="row" style="min-height:44px">
      <div class="row__body">
        <div class="row__t" style="font-weight:500;color:var(--text-2)">${esc(nameOf(l))}</div>
        ${l.autofilled ? `<div class="tt">${esc(t('rep.auto'))}</div>` : ''}
      </div>
      <div class="row__end num" style="color:var(--text-3)">${esc(fq(l.counted))}</div>
    </div>`;
  }
  function saleRow(s) {
    const it = Store.item(s.itemId);
    return `<div class="row ${s.voidedAt ? 'rep-void' : ''}">
      <div class="row__art">${it ? UI.art(it) : ''}</div>
      <div class="row__body">
        <div class="row__t"><span class="num">${esc(fq(s.qty))} ×</span> ${esc(it?.name || '?')}</div>
        <div class="row__s">${esc(s.by)} · <span class="num">${esc(UI.fmtTime(s.at))}</span></div>
      </div>
      <div class="row__end">${s.voidedAt
        ? `<span class="pill pill--mut">${esc(t('rep.voidedTag'))}</span>`
        : `<button class="iconbtn" data-void="${s.id}" aria-label="${esc(t('rep.void'))}">${UI.icon('trash')}</button>`}</div>
    </div>`;
  }
  function restockRow(r) {
    const it = Store.item(r.itemId);
    return `<div class="row">
      <div class="row__art">${it ? UI.art(it) : ''}</div>
      <div class="row__body">
        <div class="row__t">${esc(it?.name || '?')}</div>
        <div class="row__s">${esc(r.by)} · <span class="num">${esc(UI.fmtTime(r.at))}</span></div>
      </div>
      <div class="row__end qtybubble varpos">${esc('+' + fq(r.qty))}</div>
    </div>`;
  }
  function wasteRow(w) {
    const it = Store.item(w.itemId);
    return `<div class="row">
      <div class="row__art">${it ? UI.art(it) : ''}</div>
      <div class="row__body">
        <div class="row__t">${esc(it?.name || '?')}</div>
        <div class="row__s">${esc(w.by)} · <span class="num">${esc(UI.fmtTime(w.at))}</span></div>
        ${w.reason ? `<div class="rep-note">${UI.icon('note')}<span>${esc(w.reason)}</span></div>` : ''}
      </div>
      <div class="row__end qtybubble varneg">${esc('-' + fq(w.qty))}</div>
    </div>`;
  }

  function renderDay(el, bd) {
    if (lastDay !== bd) { lastDay = bd; cleanOpen = false; }
    const c = Store.closedCounts().find(x => x.bd === bd);
    if (!c) {
      el.innerHTML = head(t('rep.day', { date: UI.fmtDate(bd) }), '', 'reports') +
        `<div class="empty grow">${UI.icon('alert')}
          <div class="empty__t">${esc(t('rep.notFound'))}</div>
          <div class="empty__s">${esc(t('rep.notFoundSub'))}</div>
          <button class="btn btn--ghost mt3" data-back="reports">${esc(t('g.back'))}</button></div>`;
      el.addEventListener('click', e => {
        const back = e.target.closest('[data-back]');
        if (back) { UI.haptic('light'); UI.go(back.dataset.back); }
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
    const stat = (v, l, cls, extra, i) =>
      `<div class="stat rep-fade${extra ? ' ' + extra : ''}" style="animation-delay:${i * 50}ms"><div class="stat__v num ${cls || ''}">${v}</div><div class="stat__l">${esc(l)}</div></div>`;

    let html = head(
      t('rep.day', { date: UI.fmtDate(bd) }),
      c.closedAt ? t('rep.closedBy', { name: c.closedBy || '', time: UI.fmtTime(c.closedAt) }) : '',
      'reports');

    html += `<div class="stats mb3">
      ${stat(esc(fq(sold)), t('rep.soldLbl'), '', '', 0)}
      ${stat(esc(fq(rest)), t('rep.restocked'), '', '', 1)}
      ${stat(esc(fq(waste)), t('rep.wasted'), waste > 0 ? 'varneg' : '', '', 2)}
      ${stat(esc(sgn(vt)), t('count.varTotal'), vcls(vt), '', 3)}
      ${costs ? stat(`<span style="font-size:22px" class="${loss > 0 ? 'varneg' : ''}">${esc(UI.money(loss))}</span>`, t('rep.lossValue'), '', 'rep-loss', 4) : ''}
    </div>`;

    /* 1 — count & variance */
    html += `<div class="card rep-fade" style="animation-delay:.08s">
      <div class="card__head"><div class="card__title">${esc(t('rep.countRep'))}</div>
        ${varLines.length
          ? `<span class="pill pill--danger"><span class="num">${varLines.length}</span></span>`
          : `<span class="pill pill--ok">${UI.icon('check')}${esc(t('count.clean'))}</span>`}
      </div>
      ${varLines.map(varLineRow).join('')}
      ${!varLines.length && c.lines.length ? `<div class="rep-okline">${UI.icon('check')}<div><div class="row__t">${esc(t('count.clean'))}</div><div class="tt">${esc(t('count.cleanSub'))}</div></div></div>` : ''}
      ${!c.lines.length ? `<div class="tt" style="padding:6px 0">${esc(t('ins.noData'))}</div>` : ''}
      ${cleanLines.length ? `
        <button class="row" data-a="clean" aria-expanded="${cleanOpen}">
          <span class="iconbtn iconbtn--plain" style="color:var(--ok)">${UI.icon('check')}</span>
          <span class="row__body"><span class="row__t" style="color:var(--text-2)">${esc(I18N.plural('rep.cleanN', cleanLines.length, { n: cleanLines.length }))}</span></span>
          <span class="rep-chev ${cleanOpen ? 'is-open' : ''}">${UI.icon('chevR')}</span>
        </button>
        <div class="rep-clean ${cleanOpen ? '' : 'hidden'}">${cleanLines.map(cleanLineRow).join('')}</div>` : ''}
    </div>`;

    /* 2 — sales */
    html += `<div class="card rep-fade" style="animation-delay:.12s">
      <div class="card__head"><div class="card__title">${esc(t('rep.sales'))}</div><span class="pill pill--mut"><span class="num">${daySales.length}</span></span></div>
      ${daySales.length ? daySales.map(saleRow).join('') : `<div class="tt" style="padding:6px 0">${esc(t('rep.noSales'))}</div>`}
    </div>`;

    /* 3 — restocks */
    html += `<div class="card rep-fade" style="animation-delay:.16s">
      <div class="card__head"><div class="card__title">${esc(t('rep.restocks'))}</div><span class="pill pill--mut"><span class="num">${dayRest.length}</span></span></div>
      ${dayRest.length ? dayRest.map(restockRow).join('') : `<div class="tt" style="padding:6px 0">${esc(t('rep.noRestocks'))}</div>`}
    </div>`;

    /* 4 — waste (with reasons) */
    html += `<div class="card rep-fade" style="animation-delay:.2s">
      <div class="card__head"><div class="card__title">${esc(t('rep.waste'))}</div><span class="pill pill--mut"><span class="num">${dayWaste.length}</span></span></div>
      ${dayWaste.length ? dayWaste.map(wasteRow).join('') : `<div class="tt" style="padding:6px 0">${esc(t('rep.noWaste'))}</div>`}
    </div>`;

    /* export this day */
    html += `<div class="card rep-fade" style="animation-delay:.24s">
      <div class="card__head"><div class="card__title">${esc(t('rep.export'))}</div><span class="eyebrow">${esc(UI.fmtDate(bd))}</span></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn--ghost" style="flex:1" data-a="dcsv">${UI.icon('download')}${esc(t('rep.exportCsv'))}</button>
        <button class="btn btn--gold" style="flex:1" data-a="dpdf">${UI.icon('download')}${esc(t('rep.exportPdf'))}</button>
      </div>
    </div>`;

    el.innerHTML = html;

    el.addEventListener('click', async e => {
      const back = e.target.closest('[data-back]');
      if (back) { UI.haptic('light'); return UI.go(back.dataset.back); }
      const tg = e.target.closest('[data-a=clean]');
      if (tg) {
        cleanOpen = !cleanOpen;
        el.querySelector('.rep-clean')?.classList.toggle('hidden', !cleanOpen);
        tg.querySelector('.rep-chev')?.classList.toggle('is-open', cleanOpen);
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
        el.innerHTML = `<div class="empty grow">${UI.icon('lock')}<div class="empty__t">${esc(t('login.locked'))}</div></div>`;
        setTimeout(() => UI.go(S().session ? 'sell' : 'login'), 0);
        return;
      }
      if (params && params.day) renderDay(el, params.day);
      else renderList(el);
    },
  });
})();
