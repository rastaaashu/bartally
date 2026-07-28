/* ============ Screen: dashboard — owner home. Hero sales, stats, 7-day trend, alerts, feed. ============ */
(() => {

  I18N.extend({
    fr: {
      'dash.distinct': 'Articles différents',
      'dash.thresh': 'seuil {n}',
      'dash.notifEmpty': 'Aucune alerte — tout est calme.',
    },
    en: {
      'dash.distinct': 'Distinct items',
      'dash.thresh': 'min {n}',
      'dash.notifEmpty': 'No alerts — all quiet.',
    },
  });

  /* ---- scoped styles (appended once) ---- */
  document.head.appendChild(UI.el(`<style>
  /* sections rise in, staggered via inline delay */
  [data-screen=dashboard] .dash-sec{animation:dash-rise .5s cubic-bezier(.2,.8,.25,1) backwards}
  [data-screen=dashboard] .dash-sec+.dash-sec{margin-top:var(--s3)}
  @keyframes dash-rise{from{opacity:0;transform:translateY(12px)}}
  @keyframes dash-pop{from{transform:scale(.4);opacity:0}}
  /* bell + unread badge */
  [data-screen=dashboard] .dash-bell{position:relative}
  [data-screen=dashboard] .dash-badge{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:var(--gold-grad);color:var(--on-gold);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px var(--ink);animation:dash-pop .3s cubic-bezier(.2,.9,.3,1.4)}
  /* hero */
  [data-screen=dashboard] .dash-hero__top{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s3)}
  [data-screen=dashboard] .dash-hero__live{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ok)}
  [data-screen=dashboard] .dash-hero__num{font-size:58px;font-weight:700;line-height:1;letter-spacing:-.02em;background:var(--gold-grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:var(--gold-hi);filter:drop-shadow(0 4px 18px rgba(201,154,75,.18))}
  [data-screen=dashboard] .dash-hero__sub{color:var(--text-2);font-size:13px;margin-top:6px}
  /* sparkline: line draws, area fades, today dot pops */
  [data-screen=dashboard] .dash-spark__line{stroke-dasharray:1;stroke-dashoffset:1;animation:dash-draw .9s cubic-bezier(.4,.6,.3,1) .2s forwards}
  @keyframes dash-draw{to{stroke-dashoffset:0}}
  [data-screen=dashboard] .dash-spark__area{opacity:0;animation:dash-fade .5s ease .7s forwards}
  @keyframes dash-fade{to{opacity:1}}
  [data-screen=dashboard] .dash-spark__dot{animation:dash-pop .35s cubic-bezier(.2,.9,.3,1.5) .9s backwards}
  [data-screen=dashboard] .dash-spark__val{font-family:var(--f-display);font-size:13px;font-weight:700;fill:var(--gold-hi);font-variant-numeric:tabular-nums}
  [data-screen=dashboard] .dash-spark__lb{font-family:var(--f-ui);font-size:9.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;fill:var(--text-3)}
  [data-screen=dashboard] .dash-spark__lb.is-today{fill:var(--gold-hi)}
  /* low stock rows */
  [data-screen=dashboard] .dash-rowbtn{width:100%;text-align:left}
  [data-screen=dashboard] .dash-rowbtn .row__t,[data-screen=dashboard] .dash-rowbtn .row__s{display:block}
  [data-screen=dashboard] .dash-lowqty{display:block;color:var(--danger);font-weight:700;font-size:18px}
  [data-screen=dashboard] .dash-okline,[data-screen=dashboard] .dash-mutline{display:flex;align-items:center;gap:10px;min-height:48px;font-size:13.5px;font-weight:500}
  [data-screen=dashboard] .dash-okline{color:var(--ok)}
  [data-screen=dashboard] .dash-mutline{color:var(--text-3)}
  [data-screen=dashboard] .dash-okline svg,[data-screen=dashboard] .dash-mutline svg{width:20px;height:20px;flex:none}
  /* last count */
  [data-screen=dashboard] .dash-tap{cursor:pointer;transition:transform .12s}
  [data-screen=dashboard] .dash-tap:active{transform:scale(.985)}
  [data-screen=dashboard] .dash-lc-date{display:inline-flex;align-items:center;gap:3px}
  [data-screen=dashboard] .dash-lc-date svg{width:14px;height:14px}
  [data-screen=dashboard] .pill svg{width:12px;height:12px}
  /* quick actions 2x2 */
  [data-screen=dashboard] .dash-qa{display:grid;grid-template-columns:1fr 1fr;gap:var(--s3)}
  [data-screen=dashboard] .dash-qa .btn{flex-direction:column;gap:7px;min-height:82px;font-size:13.5px;border-radius:16px}
  [data-screen=dashboard] .dash-qa .btn svg{width:24px;height:24px;color:var(--gold)}
  /* live feed */
  [data-screen=dashboard] .dash-qb{width:42px;height:42px;border-radius:13px;background:var(--gold-soft);color:var(--gold-hi);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex:none}
  [data-screen=dashboard] .dash-void{opacity:.5}
  [data-screen=dashboard] .dash-void .row__t,[data-screen=dashboard] .dash-void .row__end{text-decoration:line-through}
  [data-screen=dashboard] .feed .row{animation-fill-mode:backwards}
  /* notification sheet (lives outside the screen — own unique scope) */
  .dash-ntf__h{font-size:18px;margin-bottom:12px}
  .dash-ntf__list{max-height:56dvh;overflow-y:auto;margin:0 -6px}
  .dash-ntf__row{display:flex;gap:12px;align-items:flex-start;padding:11px 10px;border-radius:14px}
  .dash-ntf__row+.dash-ntf__row{margin-top:4px}
  .dash-ntf__row.is-unread{background:linear-gradient(90deg,var(--gold-soft),rgba(201,154,75,.02))}
  .dash-ntf__ic{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none}
  .dash-ntf__ic svg{width:19px;height:19px}
  .dash-ntf__ic--low{background:var(--warn-soft);color:var(--warn)}
  .dash-ntf__ic--variance{background:var(--danger-soft);color:var(--danger)}
  .dash-ntf__ic--reminder{background:var(--gold-soft);color:var(--gold-hi)}
  .dash-ntf__bd{flex:1;min-width:0}
  .dash-ntf__txt{display:block;font-size:13.5px;line-height:1.4}
  .dash-ntf__time{display:block;font-size:11.5px;color:var(--text-3);margin-top:3px}
  .dash-ntf__dot{width:8px;height:8px;border-radius:50%;background:var(--gold);flex:none;margin-top:8px;box-shadow:0 0 8px rgba(201,154,75,.6)}
  </style>`));

  let dashSeq = 0;
  const DKEYS = ['d.sun', 'd.mon', 'd.tue', 'd.wed', 'd.thu', 'd.fri', 'd.sat'];
  const signed = v => (v > 0 ? '+' : '−') + UI.fmtQty(Math.abs(v));

  /* ---- 7-day sparkline: polyline + gradient area, today dot + value, weekday labels ---- */
  function sparkSVG(days) {
    const W = 320, H = 112, x0 = 12, x1 = 308, yT = 16, yB = 78;
    const id = 'dashsp' + (dashSeq++);
    const max = Math.max(1, ...days.map(d => d.v));
    const pts = days.map((d, i) => [
      +(x0 + i * (x1 - x0) / (days.length - 1)).toFixed(1),
      +(yB - (d.v / max) * (yB - yT)).toFixed(1),
    ]);
    const poly = pts.map(p => p[0] + ',' + p[1]).join(' ');
    const area = 'M' + pts.map(p => p[0] + ',' + p[1]).join(' L ') + ' L ' + x1 + ',' + yB + ' L ' + x0 + ',' + yB + ' Z';
    const last = pts[pts.length - 1];
    const valX = Math.min(last[0], 294);
    const valY = Math.max(12, last[1] - 12);
    return `<svg viewBox="0 0 ${W} ${H}" class="dash-spark" role="img" aria-label="${UI.esc(t('dash.7days'))}">
      <defs>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#DFB86A"/><stop offset="1" stop-color="#A87B2F"/>
        </linearGradient>
        <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--series-1)" stop-opacity=".3"/>
          <stop offset="1" style="stop-color:var(--series-1)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line x1="${x0}" y1="${yB}" x2="${x1}" y2="${yB}" stroke="rgba(255,255,255,.08)"/>
      <path class="dash-spark__area" d="${area}" fill="url(#${id}a)"/>
      <polyline class="dash-spark__line" points="${poly}" pathLength="1" fill="none" stroke="url(#${id}s)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.slice(0, -1).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.3" style="fill:var(--series-1)" opacity=".85"/>`).join('')}
      <circle cx="${last[0]}" cy="${last[1]}" r="9" style="fill:var(--gold)" opacity=".16"/>
      <circle class="dash-spark__dot" cx="${last[0]}" cy="${last[1]}" r="4.2" style="fill:var(--gold-hi)" stroke="#0A0A0E" stroke-width="2"/>
      <text class="dash-spark__val" x="${valX}" y="${valY}" text-anchor="middle">${UI.esc(UI.fmtQty(days[days.length - 1].v))}</text>
      ${days.map((d, i) => `<text class="dash-spark__lb ${d.today ? 'is-today' : ''}" x="${pts[i][0]}" y="${H - 8}" text-anchor="middle">${UI.esc(d.lb)}</text>`).join('')}
    </svg>`;
  }

  /* ---- notification sheet: reads fresh state at paint time ---- */
  function openNotifs() {
    UI.haptic('light');
    const wrap = UI.el('<div class="dash-ntf"></div>');
    const paint = () => {
      const notifs = Store.state.notifs.slice(0, 30);
      const today = Store.todayBd();
      const hasUnread = Store.state.notifs.some(n => !n.read);
      const rows = notifs.map(n => {
        const ic = n.type === 'low' ? 'stock' : n.type === 'variance' ? 'alert' : 'clock';
        const when = (n.bd === today ? '' : UI.fmtDate(n.bd) + ' · ') + UI.fmtTime(n.at);
        return `<div class="dash-ntf__row ${n.read ? '' : 'is-unread'}">
          <span class="dash-ntf__ic dash-ntf__ic--${UI.esc(n.type)}">${UI.icon(ic)}</span>
          <span class="dash-ntf__bd">
            <span class="dash-ntf__txt">${UI.esc(window.__notifText(n.type, n.payload))}</span>
            <span class="dash-ntf__time num">${UI.esc(when)}</span>
          </span>
          ${n.read ? '' : '<span class="dash-ntf__dot"></span>'}
        </div>`;
      }).join('');
      wrap.innerHTML = `<h2 class="dash-ntf__h">${UI.esc(t('dash.alerts'))}</h2>` +
        (notifs.length
          ? `<div class="dash-ntf__list">${rows}</div>` +
            (hasUnread ? `<button class="btn btn--ghost btn--full mt3" data-a="markread">${UI.icon('check')}${UI.esc(t('dash.markRead'))}</button>` : '')
          : `<div class="empty" style="padding:32px 16px">${UI.icon('bell')}<div class="empty__s">${UI.esc(t('dash.notifEmpty'))}</div></div>`);
    };
    paint();
    wrap.addEventListener('click', e => {
      if (e.target.closest('[data-a=markread]')) { UI.haptic('success'); Store.markNotifsRead(); paint(); }
    });
    UI.sheet(wrap);
  }

  UI.registerScreen({
    id: 'dashboard',
    render(el) {
      if (!Store.isOwner) { UI.go('sell'); return; }

      const today = Store.todayBd();
      const name = (Store.me && Store.me.name) || t('g.owner');
      const h = new Date().getHours();
      const evening = (h >= 17 || h < 6);

      /* today's numbers (non-void sales) */
      const todaySales = Store.state.sales.filter(s => s.bd === today && !s.voidedAt);
      const units = Math.round(todaySales.reduce((a, s) => a + s.qty, 0) * 100) / 100;
      const distinct = new Set(todaySales.map(s => s.itemId)).size;
      const deliv = Math.round(Store.state.restocks.filter(r => r.bd === today).reduce((a, r) => a + r.qty, 0) * 100) / 100;
      const waste = Math.round(Store.state.waste.filter(w => w.bd === today).reduce((a, w) => a + w.qty, 0) * 100) / 100;

      /* last closed count */
      const lc = Store.closedCounts()[0] || null;
      const lcIssueLines = lc ? lc.lines.filter(l => l.variance !== 0) : [];
      const lcIssues = lc ? lcIssueLines.length : null;

      /* last 7 business days of non-void sales */
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const bd = Store.Engine.addDays(today, -i);
        days.push({ bd, v: 0, lb: t(DKEYS[new Date(bd + 'T12:00:00').getDay()]), today: i === 0 });
      }
      for (const s of Store.state.sales) {
        if (s.voidedAt) continue;
        const d = days.find(x => x.bd === s.bd);
        if (d) d.v += s.qty;
      }
      for (const d of days) d.v = Math.round(d.v * 100) / 100;
      const weekTotal = Math.round(days.reduce((a, d) => a + d.v, 0) * 100) / 100;

      /* staggered section entrance */
      let dsec = 0;
      const D = () => `style="animation-delay:${dsec++ * 55}ms"`;

      /* header: greeting + date + bell */
      const unread = Store.state.notifs.filter(n => !n.read).length;
      const bell = `<button class="iconbtn dash-bell" data-a="bell" aria-label="${UI.esc(t('dash.alerts'))}">${UI.icon('bell')}${unread ? `<span class="dash-badge num">${unread > 99 ? '99+' : unread}</span>` : ''}</button>`;

      /* (1) hero */
      const hero = `<section class="card card--gold dash-sec" ${D()}>
        <div class="dash-hero__top">
          <span class="eyebrow">${UI.esc(t('dash.sales'))}</span>
          <span class="dash-hero__live"><span class="livedot"></span>${UI.esc(t('dash.live'))}</span>
        </div>
        <div class="dash-hero__num num">${UI.esc(UI.fmtQty(units))}</div>
        <div class="dash-hero__sub">${UI.esc(t('dash.itemsSold'))}</div>
      </section>`;

      /* (2) stat tiles */
      const statsHtml = `<div class="stats dash-sec" ${D()}>
        <div class="stat"><div class="stat__v num">${UI.esc(UI.fmtQty(distinct))}</div><div class="stat__l">${UI.esc(t('dash.distinct'))}</div></div>
        <div class="stat"><div class="stat__v num ${deliv > 0 ? 'up' : ''}">${deliv > 0 ? '+' : ''}${UI.esc(UI.fmtQty(deliv))}</div><div class="stat__l">${UI.esc(t('rep.restocks'))}</div></div>
        <div class="stat"><div class="stat__v num ${waste > 0 ? 'down' : ''}">${waste > 0 ? '−' : ''}${UI.esc(UI.fmtQty(waste))}</div><div class="stat__l">${UI.esc(t('rep.waste'))}</div></div>
        <div class="stat"><div class="stat__v num ${lcIssues == null ? '' : (lcIssues ? 'down' : 'up')}">${lcIssues == null ? '—' : UI.esc(UI.fmtQty(lcIssues))}</div><div class="stat__l">${UI.esc(t('dash.variance'))}</div>${lc ? `<div class="stat__d tt">${UI.esc(UI.fmtDate(lc.bd))}</div>` : ''}</div>
      </div>`;

      /* (3) 7-day trend */
      const spark = `<section class="card dash-sec" ${D()}>
        <div class="card__head">
          <div class="card__title">${UI.esc(t('dash.7days'))}</div>
          <span class="tt num">${UI.esc(UI.fmtQty(weekTotal))} ${UI.esc(t('g.units'))}</span>
        </div>
        <div class="viz">${sparkSVG(days)}</div>
      </section>`;

      /* (4) low stock */
      const lows = Store.lowItems();
      const lowRows = lows.slice(0, 5).map(it => {
        const cat = Store.cat(it.catId);
        return `<button class="row dash-rowbtn" data-a="low">
          <span class="row__art">${UI.art(it)}</span>
          <span class="row__body"><span class="row__t">${UI.esc(it.name)}</span><span class="row__s">${UI.esc(cat ? Store.catName(cat) : '')}</span></span>
          <span class="row__end"><span class="num dash-lowqty">${UI.esc(UI.fmtQty(Store.stock(it.id)))}</span><span class="tt">${UI.esc(t('dash.thresh', { n: UI.fmtQty(it.threshold) }))}</span></span>
        </button>`;
      }).join('');
      const lowCard = `<section class="card dash-sec" ${D()}>
        <div class="card__head">
          <div class="card__title">${UI.esc(t('dash.lowstock'))}</div>
          ${lows.length ? `<span class="pill pill--danger num">${lows.length}</span>` : ''}
        </div>
        ${lows.length ? lowRows : `<div class="dash-okline">${UI.icon('check')}<span>${UI.esc(t('dash.lowstockNone'))}</span></div>`}
      </section>`;

      /* (5) last count */
      let lcBody;
      if (!lc) {
        lcBody = `<div class="dash-mutline">${UI.icon('count')}<span>${UI.esc(t('dash.noCountYet'))}</span></div>`;
      } else {
        const top3 = [...lcIssueLines].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, 3);
        lcBody = `<div class="${top3.length ? 'mb2' : ''}">${lcIssues === 0
            ? `<span class="pill pill--ok">${UI.icon('check')}${UI.esc(t('dash.varianceClean'))}</span>`
            : `<span class="pill pill--danger">${UI.icon('alert')}${UI.esc(t('dash.varianceIssues', { n: lcIssues }))}</span>`}</div>` +
          top3.map(l => {
            const it = Store.item(l.itemId);
            return `<div class="row" style="min-height:48px">
              <div class="row__body"><div class="row__t">${UI.esc(it ? it.name : '?')}</div>${l.note ? `<div class="row__s">${UI.esc(l.note)}</div>` : ''}</div>
              <div class="row__end"><span class="num ${l.variance > 0 ? 'varpos' : 'varneg'}" style="font-weight:700">${UI.esc(signed(l.variance))}</span><div class="tt num">${UI.esc(UI.fmtQty(l.expected))} → ${UI.esc(UI.fmtQty(l.counted))}</div></div>
            </div>`;
          }).join('');
      }
      const lcCard = `<section class="card dash-sec ${lc ? 'dash-tap' : ''}" ${lc ? `data-a="lastcount" data-day="${UI.esc(lc.bd)}"` : ''} ${D()}>
        <div class="card__head">
          <div class="card__title">${UI.esc(t('dash.lastCount'))}</div>
          ${lc ? `<span class="tt dash-lc-date">${UI.esc(UI.fmtDate(lc.bd))}${UI.icon('chevR')}</span>` : ''}
        </div>
        ${lcBody}
      </section>`;

      /* (6) quick actions */
      const qa = [['sell', 'sell', 'dash.qa.sale'], ['count', 'count', 'dash.qa.count'], ['restock', 'truck', 'dash.qa.restock'], ['waste', 'spill', 'dash.qa.waste']];
      const qaCard = `<section class="card dash-sec" ${D()}>
        <div class="card__head"><div class="card__title">${UI.esc(t('dash.quick'))}</div></div>
        <div class="dash-qa">${qa.map(([id, ic, key]) => `<button class="btn btn--ghost" data-go="${id}">${UI.icon(ic)}<span>${UI.esc(t(key))}</span></button>`).join('')}</div>
      </section>`;

      /* (7) live feed — latest 8 of today's sales, voided struck through */
      const feedEntries = Store.state.sales.filter(s => s.bd === today).slice(0, 8);
      const feedRows = feedEntries.map((s, i) => {
        const it = Store.item(s.itemId);
        return `<div class="row ${s.voidedAt ? 'dash-void' : ''}" style="animation-delay:${45 * i}ms">
          <span class="dash-qb num">+${UI.esc(UI.fmtQty(s.qty))}</span>
          <div class="row__body"><div class="row__t">${UI.esc(it ? it.name : '?')}</div></div>
          <div class="row__end tt">${UI.esc(t('sell.by', { name: s.by }))} · <span class="num">${UI.esc(UI.fmtTime(s.at))}</span></div>
        </div>`;
      }).join('');
      const feedCard = `<section class="card dash-sec" ${D()}>
        <div class="card__head"><div class="card__title">${UI.esc(t('dash.feed'))}</div>${feedEntries.length ? '<span class="livedot"></span>' : ''}</div>
        ${feedEntries.length
          ? `<div class="feed">${feedRows}</div>`
          : `<div class="empty" style="padding:24px 16px">${UI.icon('sell')}<div class="empty__s">${UI.esc(t('dash.feedEmpty'))}</div></div>`}
      </section>`;

      el.innerHTML =
        UI.header(t(evening ? 'dash.hello' : 'dash.helloDay', { name }), UI.fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' }), bell) +
        hero + statsHtml + spark + lowCard + lcCard + qaCard + feedCard;

      el.addEventListener('click', e => {
        const go = e.target.closest('[data-go]');
        if (go) { UI.haptic('light'); return UI.go(go.dataset.go, (go.dataset.go === 'restock' || go.dataset.go === 'waste') ? { from: 'dashboard' } : undefined); }
        if (e.target.closest('[data-a=bell]')) return openNotifs();
        if (e.target.closest('[data-a=low]')) { UI.haptic('light'); return UI.go('inventory'); }
        const lcEl = e.target.closest('[data-a=lastcount]');
        if (lcEl && lcEl.dataset.day) { UI.haptic('light'); return UI.go('reports', { day: lcEl.dataset.day }); }
      });
    },
  });
})();
