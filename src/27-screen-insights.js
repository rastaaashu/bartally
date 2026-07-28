/* ============ Insights screen — owner analytics: trend, top sellers, shrinkage, stockout, reorder ============ */
(() => {
  I18N.extend({
    fr: { 'ins.perDay': '{n}/jour' },
    en: { 'ins.perDay': '{n}/day' },
  });

  /* module state: selected range survives re-renders */
  let range = 7;
  let gseq = 0;

  document.head.appendChild(UI.el(`<style>
    [data-screen=insights] .viz{margin-top:4px}
    [data-screen=insights] .viz-tip{display:none}
    [data-screen=insights] .ins-hit{fill:transparent;pointer-events:all}
    [data-screen=insights] .ins-ax{fill:var(--text-3);font-size:9px;letter-spacing:.02em}
    [data-screen=insights] .ins-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:ins-draw .9s .1s cubic-bezier(.3,.7,.3,1) forwards}
    [data-screen=insights] .ins-area{opacity:0;animation:ins-fade .6s .5s forwards}
    [data-screen=insights] .ins-end{opacity:0;animation:ins-fade .45s .85s forwards}
    [data-screen=insights] .ins-dot{transform-box:fill-box;transform-origin:center;animation:ins-pop .5s .65s cubic-bezier(.2,.9,.3,1.35) backwards}
    [data-screen=insights] .ins-cross,[data-screen=insights] .ins-hov{display:none}
    [data-screen=insights] .ins-bars{display:flex;flex-direction:column;gap:2px}
    [data-screen=insights] .ins-brow{display:grid;grid-template-columns:88px 1fr 44px;gap:10px;align-items:center;min-height:24px}
    [data-screen=insights] .ins-bname{font-size:12px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    [data-screen=insights] .ins-btrack{height:16px;display:flex;align-items:center}
    [data-screen=insights] .ins-bfill{display:block;height:16px;min-width:3px;background:var(--series-1);border-radius:0 4px 4px 0;transform-origin:left;animation:ins-grow .55s cubic-bezier(.2,.8,.25,1) both}
    [data-screen=insights] .ins-bval{font-size:12.5px;text-align:right}
    [data-screen=insights] .ins-hint{margin:-6px 0 var(--s3);font-size:12px;color:var(--text-3);line-height:1.4}
    [data-screen=insights] .ins-loss{display:flex;align-items:baseline;justify-content:space-between;margin-top:var(--s3);padding-top:var(--s3);border-top:1px solid var(--hairline)}
    [data-screen=insights] .ins-loss .num{font-size:17px;font-weight:700;color:var(--danger)}
    [data-screen=insights] .ins-ok{display:flex;align-items:center;gap:10px;color:var(--ok);font-size:14px;font-weight:600;min-height:44px}
    [data-screen=insights] .ins-ok svg{width:20px;height:20px;flex:none}
    [data-screen=insights] .ins-rqty{font-family:var(--f-display);font-weight:700;font-size:20px;line-height:1.1;font-variant-numeric:tabular-nums}
    [data-screen=insights] .ins-note{padding:var(--s2) 0;font-size:12.5px;color:var(--text-3)}
    @keyframes ins-draw{to{stroke-dashoffset:0}}
    @keyframes ins-fade{to{opacity:1}}
    @keyframes ins-pop{from{transform:scale(0)}}
    @keyframes ins-grow{from{transform:scaleX(0)}}
  </style>`));

  const esc = UI.esc;
  const WD = ['d.sun', 'd.mon', 'd.tue', 'd.wed', 'd.thu', 'd.fri', 'd.sat'];
  const wday = bd => t(WD[new Date(bd + 'T12:00:00').getDay()]);
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);

  /* y max: 3 gridlines at step/2·step/3·step, step chosen so labels stay clean */
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
  const fmtAxis = v => UI.fmtQty(Math.round(v * 100) / 100);

  /**
   * Hand-built SVG line/area chart. Single hue, recessive grid, direct end label,
   * tooltip via transparent overlay hit-rects (hover + tap). Safe with 1 point.
   * cfg: {points:[{bd,v,x01}], color, h, gradient?, areaOp?, ticks:[{x01,label,anchor?,num?}], label, endLabel, tip(p)->html}
   */
  function drawChart(viz, cfg) {
    const W = 340, H = cfg.h || 160, padL = 30, padR = 12, padT = 16, padB = 18;
    const pw = W - padL - padR, base = H - padB, ph = base - padT;
    const pts = cfg.points, n = pts.length;
    if (!n) { viz.innerHTML = ''; return; }
    const vmax = niceMax(Math.max.apply(null, pts.map(p => p.v)));
    const X = p => padL + p.x01 * pw;
    const Y = v => base - (v / vmax) * ph;

    let defs = '', area = '', line = '';
    if (n > 1) {
      const lineD = pts.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join('');
      const areaD = `M${X(pts[0]).toFixed(1)} ${base}` + pts.map(p => `L${X(p).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('') + `L${X(pts[n - 1]).toFixed(1)} ${base}Z`;
      if (cfg.gradient) {
        const gid = 'insG' + (gseq++);
        defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cfg.color}" stop-opacity=".22"/><stop offset="1" stop-color="${cfg.color}" stop-opacity="0"/></linearGradient></defs>`;
        area = `<path class="ins-area" d="${areaD}" fill="url(#${gid})"/>`;
      } else {
        area = `<path class="ins-area" d="${areaD}" fill="${cfg.color}" fill-opacity="${cfg.areaOp ?? .08}"/>`;
      }
      line = `<path class="ins-line" pathLength="1" d="${lineD}" stroke="${cfg.color}"/>`;
    }

    let grid = '';
    for (let k = 1; k <= 3; k++) {
      const gv = vmax * k / 3, gy = Y(gv).toFixed(1);
      grid += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>` +
        `<text class="ins-ax num" x="${padL - 6}" y="${(+gy + 3).toFixed(1)}" text-anchor="end">${esc(fmtAxis(gv))}</text>`;
    }
    grid += `<line x1="${padL}" y1="${base}" x2="${W - padR}" y2="${base}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;

    const ticks = (cfg.ticks || []).map(tk =>
      `<text class="ins-ax${tk.num ? ' num' : ''}" x="${(padL + tk.x01 * pw).toFixed(1)}" y="${H - 4}" text-anchor="${tk.anchor || 'middle'}">${esc(tk.label)}</text>`).join('');

    const lp = pts[n - 1], ex = X(lp), ey = Y(lp.v);
    const endAnchor = ex > W - 46 ? 'end' : 'middle';
    const end = `<g class="ins-dot"><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="7" fill="${cfg.color}" opacity=".18"/>` +
      `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.5" fill="${cfg.color}" stroke="#14141B" stroke-width="1.5"/></g>` +
      `<text class="ins-ax num ins-end" x="${(endAnchor === 'end' ? ex + 4 : ex).toFixed(1)}" y="${Math.max(10, ey - 10).toFixed(1)}" text-anchor="${endAnchor}" style="fill:var(--text);font-size:11px;font-weight:700">${esc(cfg.endLabel)}</text>`;

    const cross = `<line class="ins-cross" x1="0" x2="0" y1="${padT}" y2="${base}" stroke="rgba(255,255,255,.14)" stroke-width="1"/>`;
    const hov = `<circle class="ins-hov" r="3.5" fill="${cfg.color}" stroke="#14141B" stroke-width="1.5"/>`;

    let hits = '';
    for (let i = 0; i < n; i++) {
      const l = i === 0 ? 0 : (X(pts[i - 1]) + X(pts[i])) / 2;
      const r = i === n - 1 ? W : (X(pts[i]) + X(pts[i + 1])) / 2;
      hits += `<rect class="ins-hit" data-i="${i}" x="${l.toFixed(1)}" y="0" width="${(r - l).toFixed(1)}" height="${H}"/>`;
    }

    viz.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.label)}">${defs}${grid}${area}${line}${end}${ticks}${cross}${hov}${hits}</svg><div class="viz-tip"></div>`;

    const svgEl = viz.querySelector('svg'), tip = viz.querySelector('.viz-tip');
    const crossEl = viz.querySelector('.ins-cross'), hovEl = viz.querySelector('.ins-hov');
    const show = i => {
      const p = pts[i]; if (!p) return;
      const x = X(p), y = Y(p.v);
      crossEl.setAttribute('x1', x.toFixed(1)); crossEl.setAttribute('x2', x.toFixed(1));
      hovEl.setAttribute('cx', x.toFixed(1)); hovEl.setAttribute('cy', y.toFixed(1));
      crossEl.style.display = 'block'; hovEl.style.display = 'block';
      tip.innerHTML = cfg.tip(p);
      tip.style.left = Math.min(88, Math.max(11, x / W * 100)) + '%';
      tip.style.top = (y / H * 100) + '%';
      tip.style.display = 'block';
    };
    const hide = () => { tip.style.display = 'none'; crossEl.style.display = 'none'; hovEl.style.display = 'none'; };
    const onPt = e => { const r = e.target.closest('.ins-hit'); if (r) show(+r.dataset.i); };
    svgEl.addEventListener('pointerover', onPt);
    svgEl.addEventListener('pointermove', onPt);
    svgEl.addEventListener('pointerdown', onPt);
    svgEl.addEventListener('pointerleave', hide);
    svgEl.addEventListener('pointercancel', hide);
  }

  UI.registerScreen({
    id: 'insights',
    render(el) {
      const head = `<header class="apphead">
        <button class="iconbtn" data-a="back" aria-label="${esc(t('g.back'))}">${UI.icon('chevL')}</button>
        <div class="apphead__titles"><h1 class="apphead__title">${esc(t('ins.title'))}</h1></div>
      </header>`;

      /* owner-only guard: staff never see analytics */
      if (!Store.isOwner) {
        el.innerHTML = head + `<div class="empty grow">${UI.icon('lock')}<div class="empty__t">${esc(t('login.locked'))}</div></div>`;
        el.addEventListener('click', e => { if (e.target.closest('[data-a=back]')) { UI.haptic('light'); UI.go('more'); } });
        return;
      }

      const st = Store.state, E = Store.Engine, today = Store.todayBd();
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

      const seg = `<div class="seg mb3" role="tablist" aria-label="${esc(t('rep.exportRange'))}">
        <button class="seg__btn ${range === 7 ? 'is-on' : ''}" data-range="7" role="tab" aria-selected="${range === 7}">${esc(t('ins.7d'))}</button>
        <button class="seg__btn ${range === 30 ? 'is-on' : ''}" data-range="30" role="tab" aria-selected="${range === 30}">${esc(t('ins.30d'))}</button>
      </div>`;

      /* ---- global empty gate: not enough history to analyse ---- */
      if (Store.closedCounts().length < 2 && totalSold === 0) {
        el.innerHTML = head + seg + `<div class="empty grow">${UI.icon('chart')}
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

      const subLine = f => `${UI.fmtQty(f.stock)} ${esc(t('u.' + f.it.unit))} · ${esc(t('ins.perDay', { n: UI.fmtQty(Math.round(f.v * 10) / 10) }))}`;

      el.innerHTML = head + seg + `
        <div class="card">
          <div class="card__head"><div class="card__title">${esc(t('ins.trend'))}</div>
            <span class="tt"><span class="num">${esc(UI.fmtQty(totalSold))}</span> ${esc(t('ins.units'))}</span></div>
          <div class="viz" data-viz="trend"></div>
        </div>

        <div class="card">
          <div class="card__head"><div class="card__title">${esc(t('ins.top'))}</div></div>
          ${top.length ? `<div class="ins-bars">${top.map((x, i) => `
            <div class="ins-brow">
              <span class="ins-bname">${esc(x.it.name)}</span>
              <span class="ins-btrack"><span class="ins-bfill" style="width:${Math.max(2, x.q / maxQ * 100).toFixed(1)}%;animation-delay:${i * 45}ms"></span></span>
              <span class="ins-bval num">${esc(UI.fmtQty(x.q))}</span>
            </div>`).join('')}</div>`
          : `<div class="ins-note">${esc(t('ins.noData'))}</div>`}
        </div>

        <div class="card">
          <div class="card__head"><div class="card__title">${esc(t('ins.shrink'))}</div></div>
          <p class="ins-hint">${esc(t('ins.shrinkHint'))}</p>
          ${sPts.length ? `<div class="viz" data-viz="shrink"></div>` : `<div class="ins-note">${esc(t('dash.noCountYet'))}</div>`}
          ${hasCosts ? `<div class="ins-loss"><span class="tt">${esc(t('rep.lossValue'))}</span><span class="num">${esc(UI.money(lossVal))}</span></div>` : ''}
        </div>

        <div class="card">
          <div class="card__head"><div class="card__title">${esc(t('ins.stockout'))}</div></div>
          ${stockout.length ? stockout.map(f => `
            <div class="row">
              <div class="row__art">${UI.art(f.it)}</div>
              <div class="row__body"><div class="row__t">${esc(f.it.name)}</div>
                <div class="row__s num">${subLine(f)}</div></div>
              <div class="row__end"><span class="pill ${f.d <= 3 ? 'pill--danger' : f.d <= 7 ? 'pill--warn' : 'pill--mut'} num">${esc(I18N.plural('ins.stockoutDays', f.d, { n: f.d }))}</span></div>
            </div>`).join('')
          : `<div class="ins-note">${esc(t('ins.noData'))}</div>`}
        </div>

        <div class="card">
          <div class="card__head"><div class="card__title">${esc(t('ins.reorder'))}</div></div>
          <p class="ins-hint">${esc(t('ins.reorderHint'))}</p>
          ${reorder.length ? reorder.map(f => `
            <div class="row">
              <div class="row__art">${UI.art(f.it)}</div>
              <div class="row__body"><div class="row__t">${esc(f.it.name)}</div>
                <div class="row__s num">${subLine(f)} · ${esc(I18N.plural('ins.stockoutDays', f.d, { n: f.d }))}</div></div>
              <div class="row__end"><div class="ins-rqty num">+${esc(UI.fmtQty(f.sug))}</div><div class="tt">${esc(t('ins.units'))}</div></div>
            </div>`).join('')
          : `<div class="ins-ok">${UI.icon('check')}<span>${esc(t('ins.reorderNone'))}</span></div>`}
        </div>`;

      /* ---- charts ---- */
      const tipFmt = p => `${esc(UI.fmtDate(p.bd))} · <span class="num">${esc(UI.fmtQty(p.v))}</span> ${esc(t('ins.units'))}`;

      let trendTicks;
      if (range <= 7) {
        trendTicks = trendPts.map(p => ({ x01: p.x01, label: wday(p.bd) }));
      } else {
        trendTicks = trendPts.filter((p, i) => i % 5 === 0 || i === trendPts.length - 1)
          .map(p => ({ x01: p.x01, label: String(new Date(p.bd + 'T12:00:00').getDate()), num: true }));
      }
      drawChart(el.querySelector('[data-viz=trend]'), {
        points: trendPts, color: 'var(--series-1)', h: 168, gradient: true,
        ticks: trendTicks, label: t('ins.trend'),
        endLabel: UI.fmtQty(trendPts[trendPts.length - 1].v),
        tip: tipFmt,
      });

      const shrinkViz = el.querySelector('[data-viz=shrink]');
      if (shrinkViz) {
        const sn = sPts.length;
        const soloAnchor = sPts[0].x01 > .8 ? 'end' : sPts[0].x01 < .2 ? 'start' : 'middle';
        let sTicks = [{ x01: sPts[0].x01, label: UI.fmtDate(sPts[0].bd, { day: 'numeric', month: 'short' }), anchor: sn > 1 ? 'start' : soloAnchor }];
        if (sn > 1 && sPts[sn - 1].x01 - sPts[0].x01 >= .25) {
          sTicks.push({ x01: sPts[sn - 1].x01, label: UI.fmtDate(sPts[sn - 1].bd, { day: 'numeric', month: 'short' }), anchor: 'end' });
        } else if (sn > 1) {
          sTicks = [{ x01: sPts[sn - 1].x01, label: UI.fmtDate(sPts[sn - 1].bd, { day: 'numeric', month: 'short' }), anchor: 'end' }];
        }
        drawChart(shrinkViz, {
          points: sPts, color: 'var(--danger)', h: 140, areaOp: .08,
          ticks: sTicks, label: t('ins.shrink'),
          endLabel: `${UI.fmtQty(sPts[sn - 1].v)} ${t('ins.units')}`,
          tip: tipFmt,
        });
      }

      wire(el);

      function wire(root) {
        root.addEventListener('click', e => {
          if (e.target.closest('[data-a=back]')) { UI.haptic('light'); return UI.go('more'); }
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
