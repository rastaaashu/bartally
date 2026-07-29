/* ============ Insights screen — owner analytics: trend, top sellers, shrinkage, stockout, reorder ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: { 'ins.perDay': '{n}/jour' },
    en: { 'ins.perDay': '{n}/day' },
  });

  /* module state: selected range survives re-renders */
  let range = 7;

  document.head.appendChild(UI.el(`<style>
    [data-screen=insights] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
    [data-screen=insights] .h1{font:600 24px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
    [data-screen=insights] .seg{margin-top:16px}
    [data-screen=insights] .ins-chart{display:block;width:100%;height:auto;margin-top:12px}
    [data-screen=insights] .ins-tick{fill:var(--t3);font-size:10px}
    [data-screen=insights] .ins-tick--num{font-family:var(--f-display);font-weight:600;font-variant-numeric:tabular-nums}
    [data-screen=insights] .ins-end{fill:var(--t1);font:600 11px var(--f-display);font-variant-numeric:tabular-nums}
    [data-screen=insights] .ins-sellers{margin-top:8px}
    [data-screen=insights] .ins-srow{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;min-height:36px;border-bottom:1px solid var(--hair)}
    [data-screen=insights] .ins-srow:last-child{border-bottom:0}
    [data-screen=insights] .ins-sname{font-size:13px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    [data-screen=insights] .ins-scell{display:flex;align-items:center;gap:12px;min-width:0}
    [data-screen=insights] .ins-track{flex:1;min-width:0}
    [data-screen=insights] .ins-bar{display:block;height:4px;border-radius:2px;background:var(--brass)}
    [data-screen=insights] .ins-sval{flex:none;min-width:36px;text-align:right;font-size:13px;color:var(--t1)}
    [data-screen=insights] .ins-loss .num{color:var(--bad)}
    [data-screen=insights] .ins-rq{font-size:17px;line-height:1.2}
  </style>`));

  const esc = UI.esc;
  const WD = ['d.sun', 'd.mon', 'd.tue', 'd.wed', 'd.thu', 'd.fri', 'd.sat'];
  const wday = bd => t(WD[new Date(bd + 'T12:00:00').getDay()]);
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);

  /* y max: 3 gridlines at step/2·step/3·step, step chosen so the rhythm stays clean */
  function niceMax(v) {
    if (!(v > 0)) return 3;
    const t3 = v / 3;
    let step;
    if (t3 <= 1) step = Math.ceil(t3 * 4 - 1e-9) / 4;
    else if (t3 <= 10) step = Math.ceil(t3 - 1e-9);
    else {
      const p = Math.pow(10, Math.floor(Math.log10(t3)));
      const m = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => x * p >= t3 - 1e-9) || 10;
      step = m * p;
    }
    return step * 3;
  }

  /**
   * Permitted vocabulary only: hairline gridlines, one polyline, endpoint circle,
   * SG tabular end label, sparse axis text. No area fills, no freeform paths.
   * cfg: {pts:[{bd,v,x01}], color, endLabel, ticks:[{x01,label,num?,anchor?}], label}
   */
  function lineChart(cfg) {
    const W = 340, H = 120, padL = 6, padR = 6, padT = 18, padB = 16;
    const base = H - padB, pw = W - padL - padR, ph = base - padT;
    const pts = cfg.pts, n = pts.length;
    if (!n) return '';
    const vmax = niceMax(Math.max.apply(null, pts.map(p => p.v)));
    const X = p => padL + p.x01 * pw;
    const Y = v => base - (v / vmax) * ph;

    let grid = '';
    for (let k = 1; k <= 3; k++) {
      const gy = Y(vmax * k / 3).toFixed(1);
      grid += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;
    }
    grid += `<line x1="${padL}" y1="${base}" x2="${W - padR}" y2="${base}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;

    const ticks = (cfg.ticks || []).map(tk => {
      const anchor = tk.anchor || (tk.x01 <= 0 ? 'start' : tk.x01 >= 1 ? 'end' : 'middle');
      return `<text class="ins-tick${tk.num ? ' ins-tick--num' : ''}" x="${(padL + tk.x01 * pw).toFixed(1)}" y="${H - 3}" text-anchor="${anchor}">${esc(tk.label)}</text>`;
    }).join('');

    const line = n > 1
      ? `<polyline fill="none" points="${pts.map(p => X(p).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ')}" stroke="${cfg.color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`
      : '';
    const lp = pts[n - 1], ex = X(lp), ey = Y(lp.v);
    const endAnchor = ex > W - 52 ? 'end' : ex < 52 ? 'start' : 'middle';
    const dot = `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="2.5" fill="${cfg.color}"/>`;
    const endLbl = `<text class="ins-end" x="${ex.toFixed(1)}" y="${Math.max(11, ey - 8).toFixed(1)}" text-anchor="${endAnchor}">${esc(cfg.endLabel)}</text>`;

    return `<svg class="ins-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.label)}">${grid}${ticks}${line}${dot}${endLbl}</svg>`;
  }

  UI.registerScreen({
    id: 'insights',
    render(el, params) {
      const backTo = (params && params.from === 'reports') ? 'reports' : 'dashboard';
      const today = Store.todayBd();
      const head = `<div class="topbar">
          <button class="back" data-a="back">‹ ${esc(t('g.back'))}</button>
          <div class="micro tnum">${esc(UI.fmtDate(today))}</div>
        </div>
        <div class="h1">${esc(t('ins.title'))}</div>`;

      /* owner-only guard: staff never see analytics */
      if (!Store.isOwner) {
        UI.go(Store.state.session ? 'sell' : 'login'); return;
        wire(el);
        return;
      }

      const st = Store.state, E = Store.Engine;
      const fromBd = E.addDays(today, -(range - 1));

      /* ---- daily non-void sold units over the range ---- */
      const sold = {};
      let totalSold = 0;
      for (const s of st.sales) {
        if (s.voidedAt || s.bd < fromBd || s.bd > today) continue;
        sold[s.bd] = (sold[s.bd] || 0) + s.qty;
        totalSold += s.qty;
      }
      totalSold = Math.round(totalSold * 100) / 100;
      const days = [];
      for (let i = 0; i < range; i++) days.push(E.addDays(fromBd, i));
      const trendPts = days.map((bd, i) => ({ bd, v: Math.round((sold[bd] || 0) * 100) / 100, x01: range === 1 ? .5 : i / (range - 1) }));

      const seg = `<div class="seg" role="tablist" aria-label="${esc(t('rep.exportRange'))}">
        <button class="seg__btn ${range === 7 ? 'is-on' : ''}" data-range="7" role="tab" aria-selected="${range === 7}">${esc(t('ins.7d'))}</button>
        <button class="seg__btn ${range === 30 ? 'is-on' : ''}" data-range="30" role="tab" aria-selected="${range === 30}">${esc(t('ins.30d'))}</button>
      </div>`;

      /* ---- global empty gate: not enough history to analyse ---- */
      if (Store.closedCounts().length < 2 && totalSold === 0) {
        el.innerHTML = head + seg + `<div class="empty grow">
          <div class="empty__t">${esc(t('ins.noData'))}</div>
          <div class="empty__s">${esc(t('ins.noDataSub'))}</div></div>`;
        wire(el);
        return;
      }

      /* ---- top 8 items by units ---- */
      const per = {};
      for (const s of st.sales) {
        if (s.voidedAt || s.bd < fromBd || s.bd > today) continue;
        per[s.itemId] = (per[s.itemId] || 0) + s.qty;
      }
      const top = Object.entries(per)
        .map(([id, q]) => ({ it: Store.item(id), q: Math.round(q * 100) / 100 }))
        .filter(x => x.it && x.q > 0)
        .sort((a, b) => b.q - a.q).slice(0, 8);
      const maxQ = top.length ? Math.max(top[0].q, .01) : 1;

      /* ---- shrinkage series clipped to range, re-based to range start ---- */
      const allShrink = E.shrinkageSeries(st);
      const beforePts = allShrink.filter(p => p.bd < fromBd);
      const baseCum = beforePts.length ? beforePts[beforePts.length - 1].cum : 0;
      const sPts = allShrink.filter(p => p.bd >= fromBd && p.bd <= today).map(p => ({
        bd: p.bd,
        v: Math.max(0, Math.round((p.cum - baseCum) * 100) / 100),
        x01: range === 1 ? .5 : Math.min(range - 1, Math.max(0, dayDiff(fromBd, p.bd))) / (range - 1),
      }));

      const hasCosts = st.items.some(i => i.active && i.cost != null && i.cost > 0);
      let lossVal = 0;
      for (const c of st.counts) {
        if (c.status !== 'closed' || c.isOpening || c.bd < fromBd || c.bd > today) continue;
        for (const l of c.lines) {
          if (l.variance >= 0) continue;
          const it = Store.item(l.itemId);
          if (it && it.cost != null) lossVal += -l.variance * it.cost;
        }
      }

      /* ---- stockout & reorder (14-day velocity) ---- */
      const items = Store.activeItems();
      const facts = items.map(it => {
        const v = E.velocity(st, it.id, today, 14);
        const stock = Store.stock(it.id);
        return { it, v, stock, d: E.daysUntilStockout(stock, v) };
      });
      const stockout = facts.filter(f => f.d !== null)
        .map(f => ({ ...f, d: Math.max(0, f.d) }))
        .sort((a, b) => a.d - b.d || b.v - a.v).slice(0, 6);
      const reorder = facts.filter(f => f.d !== null && f.d <= 7)
        .map(f => ({ ...f, d: Math.max(0, f.d), sug: Math.max(0, Math.ceil(f.v * 14 - f.stock)) }))
        .sort((a, b) => a.d - b.d);

      /* ---- charts (strings only, no listeners) ---- */
      let trendTicks;
      if (range <= 7) {
        trendTicks = trendPts.map(p => ({ x01: p.x01, label: wday(p.bd).charAt(0).toUpperCase() }));
      } else {
        trendTicks = trendPts.filter((p, i) => i % 5 === 0 || i === trendPts.length - 1)
          .map(p => ({ x01: p.x01, label: String(new Date(p.bd + 'T12:00:00').getDate()), num: true }));
      }
      const trendSvg = lineChart({
        pts: trendPts, color: 'var(--brass)',
        ticks: trendTicks, label: t('ins.trend'),
        endLabel: UI.fmtQty(trendPts[trendPts.length - 1].v),
      });

      let shrinkSvg = '';
      if (sPts.length) {
        const sn = sPts.length;
        const soloAnchor = sPts[0].x01 > .8 ? 'end' : sPts[0].x01 < .2 ? 'start' : 'middle';
        let sTicks = [{ x01: sPts[0].x01, label: UI.fmtDate(sPts[0].bd, { day: 'numeric', month: 'short' }), anchor: sn > 1 ? 'start' : soloAnchor }];
        if (sn > 1 && sPts[sn - 1].x01 - sPts[0].x01 >= .25) {
          sTicks.push({ x01: sPts[sn - 1].x01, label: UI.fmtDate(sPts[sn - 1].bd, { day: 'numeric', month: 'short' }), anchor: 'end' });
        } else if (sn > 1) {
          sTicks = [{ x01: sPts[sn - 1].x01, label: UI.fmtDate(sPts[sn - 1].bd, { day: 'numeric', month: 'short' }), anchor: 'end' }];
        }
        shrinkSvg = lineChart({
          pts: sPts, color: 'var(--bad)',
          ticks: sTicks, label: t('ins.shrink'),
          endLabel: `${UI.fmtQty(sPts[sn - 1].v)} ${t('ins.units')}`,
        });
      }

      const velLine = f => esc(t('ins.perDay', { n: UI.fmtQty(Math.round(f.v * 10) / 10) }));

      el.innerHTML = head + seg + `
        <div class="sec"><div class="micro">${esc(t('ins.trend'))}</div>
          <div class="micro tnum">${esc(UI.fmtQty(totalSold))} ${esc(t('ins.units'))}</div></div>
        ${trendSvg}

        <div class="sec"><div class="micro">${esc(t('ins.top'))}</div></div>
        ${top.length ? `<div class="ins-sellers">${top.map(x => `
          <div class="ins-srow">
            <span class="ins-sname">${esc(x.it.name)}</span>
            <span class="ins-scell">
              <span class="ins-track"><span class="ins-bar" style="width:${Math.max(2, x.q / maxQ * 100).toFixed(1)}%"></span></span>
              <span class="ins-sval num">${esc(UI.fmtQty(x.q))}</span>
            </span>
          </div>`).join('')}</div>`
        : `<div class="sub2">${esc(t('ins.noData'))}</div>`}

        <div class="sec"><div class="micro">${esc(t('ins.shrink'))}</div></div>
        <div class="sub2">${esc(t('ins.shrinkHint'))}</div>
        ${shrinkSvg || `<div class="sub2">${esc(t('dash.noCountYet'))}</div>`}
        ${hasCosts ? `<div class="sub2 ins-loss">${esc(t('rep.lossValue'))} · <span class="num">${esc(UI.money(lossVal))}</span></div>` : ''}

        <div class="sec"><div class="micro">${esc(t('ins.stockout'))}</div></div>
        ${stockout.length ? `<div class="feed">${stockout.map(f => `
          <div class="row">
            <div class="row__art">${UI.art(f.it)}</div>
            <div class="row__body"><div class="row__t">${esc(f.it.name)}</div>
              <div class="row__s num">${velLine(f)}</div></div>
            <div class="row__end"><span class="pill ${f.d <= 3 ? 'pill--danger' : f.d <= 7 ? 'pill--warn' : 'pill--mut'} num">${esc(I18N.plural('ins.stockoutDays', f.d, { n: f.d }))}</span></div>
          </div>`).join('')}</div>`
        : `<div class="sub2">${esc(t('ins.noData'))}</div>`}

        <div class="sec"><div class="micro">${esc(t('ins.reorder'))}</div></div>
        <div class="sub2">${esc(t('ins.reorderHint'))}</div>
        ${reorder.length ? `<div class="feed">${reorder.map(f => `
          <div class="row">
            <div class="row__art">${UI.art(f.it)}</div>
            <div class="row__body"><div class="row__t">${esc(f.it.name)}</div>
              <div class="row__s num">${velLine(f)} · ${esc(I18N.plural('ins.stockoutDays', f.d, { n: f.d }))}</div></div>
            <div class="row__end"><div class="num ins-rq">+${esc(UI.fmtQty(f.sug))}</div><div class="micro">${esc(t('ins.units'))}</div></div>
          </div>`).join('')}</div>`
        : `<div class="sub2">${esc(t('ins.reorderNone'))}</div>`}`;

      wire(el);

      function wire(root) {
        root.addEventListener('click', e => {
          if (e.target.closest('[data-a=back]')) { UI.haptic('light'); return UI.go(backTo); }
          const b = e.target.closest('[data-range]');
          if (b) {
            const r = +b.dataset.range;
            if (r !== range) { range = r; UI.haptic('light'); UI.refresh(); }
          }
        });
      }
    },
  });
})();
