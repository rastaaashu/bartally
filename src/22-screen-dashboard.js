/* ============ Screen: dashboard — reference frame 01, live data ============ */
(() => {
  'use strict';

  I18N.extend({
    fr: {
      'dash.concerned_one': '{n} article concerné',
      'dash.concerned_many': '{n} articles concernés',
      'dash.cleanLast': 'Comptage propre',
      'dash.vsYest': '{sign}{pct}% vs hier',
      'dash.lowNone': 'Aucun article sous le seuil',
      'dash.feedNone': 'Les ventes du soir apparaîtront ici.',
      'dash.alertsN': 'Alertes {n}',
    },
    en: {
      'dash.concerned_one': '{n} item concerned',
      'dash.concerned_many': '{n} items concerned',
      'dash.cleanLast': 'Clean count',
      'dash.vsYest': '{sign}{pct}% vs yesterday',
      'dash.lowNone': 'No item under threshold',
      'dash.feedNone': 'Tonight’s sales will appear here.',
      'dash.alertsN': 'Alerts {n}',
    },
  });

  document.head.appendChild(UI.el(`<style>
  [data-screen=dashboard] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=dashboard] .topbar .side{display:flex;align-items:center;gap:14px}
  [data-screen=dashboard] .eyebrow{margin-top:16px}
  [data-screen=dashboard] .spark{margin-top:12px;display:block}
  [data-screen=dashboard] .alink{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--bad)}
  [data-screen=dashboard] .dash-low .row{width:100%;text-align:left}
  [data-screen=dashboard] .dash-lown{font-size:16px;color:var(--bad)}
  </style>`));

  function todaySales() {
    const bd = Store.todayBd();
    return Store.state.sales.filter(s => s.bd === bd && !s.voidedAt);
  }
  function unitsOn(bd) {
    let n = 0;
    for (const s of Store.state.sales) if (s.bd === bd && !s.voidedAt) n += s.qty;
    return Math.round(n * 100) / 100;
  }
  function sparkline() {
    const today = Store.todayBd();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(unitsOn(Store.Engine.addDays(today, -i)));
    const max = Math.max(...days, 1);
    const pts = days.map((v, i) => `${(i * 96 / 6).toFixed(1)},${(22 - (v / max) * 16 + 2).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 96 26" width="96" height="26" fill="none" aria-hidden="true">
      <polyline points="${pts}" stroke="var(--brass)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  function alertsSheet() {
    const ns = Store.state.notifs;
    const rows = ns.length ? ns.slice(0, 30).map(n => `
      <div class="row">
        <div class="row__body">
          <span class="row__t" style="${n.read ? 'color:var(--t3)' : ''}">${UI.esc(window.__notifText(n.type, n.payload))}</span>
          <span class="row__s tnum">${UI.esc(UI.fmtDate(n.bd))} · ${UI.esc(UI.fmtTime(n.at))}</span>
        </div>
      </div>`).join('') : `<div class="empty"><div class="empty__t">${UI.esc(t('dash.notifEmpty'))}</div></div>`;
    const c = UI.el(`<div>
      <div class="micro" style="margin-bottom:6px">${UI.esc(t('dash.alerts'))}</div>
      ${rows}
      ${ns.some(n => !n.read) ? `<button class="btn btn--ghost btn--full mt4" data-a="read">${UI.esc(t('dash.markRead'))}</button>` : ''}
    </div>`);
    const sh = UI.sheet(c);
    c.addEventListener('click', e => { if (e.target.closest('[data-a=read]')) { Store.markNotifsRead(); sh.close(); } });
  }

  UI.registerScreen({
    id: 'dashboard',
    render(el) {
      if (!Store.isOwner) { UI.go(Store.state.session ? 'sell' : 'login'); return; }
      const st = Store.state;
      const today = Store.todayBd();
      const yest = Store.Engine.addDays(today, -1);
      const sales = todaySales();
      const units = Math.round(sales.reduce((a, s) => a + s.qty, 0) * 100) / 100;
      const uYest = unitsOn(yest);
      const pct = uYest > 0 ? Math.round((units - uYest) / uYest * 100) : null;
      const last = Store.closedCounts()[0];
      const lastVar = last ? Math.round(last.lines.reduce((a, l) => a + l.variance, 0) * 100) / 100 : null;
      const lastIssues = last ? last.lines.filter(l => l.variance !== 0).length : 0;
      // every item at or under its threshold, worst shortfall first — the full list, scrollable
      const lowAll = Store.lowItems()
        .map(it => ({ it, stock: Store.stock(it.id), gap: Store.stock(it.id) - it.threshold }))
        .sort((a, b) => a.gap - b.gap || a.it.sort - b.it.sort);
      const lowTotal = lowAll.length;
      const feed = st.sales.filter(s => s.bd === today).slice(0, 3);
      const unread = st.notifs.filter(n => !n.read).length;
      const sign = v => v > 0 ? '+' : v < 0 ? '−' : '±';
      const fmtSigned = v => v === 0 ? '±0' : (v > 0 ? '+' : '−') + UI.fmtQty(Math.abs(v));

      el.innerHTML = `
        <div class="topbar">
          ${UI.logoMark(26)}
          <div class="side">
            ${unread ? `<button class="alink" data-a="alerts">${UI.esc(t('dash.alertsN', { n: unread }))}</button>` : ''}
            <div class="micro tnum">${UI.esc(UI.fmtDate(today))}</div>
          </div>
        </div>
        <div class="eyebrow micro">${UI.esc(st.settings.barName || 'BarTally')}</div>

        <div class="stats">
          <div class="stat">
            <div class="micro">${UI.esc(t('dash.sales'))}</div>
            <div class="big tnum">${UI.esc(UI.fmtQty(units))}</div>
          </div>
          <div class="stat">
            <div class="micro">${UI.esc(t('dash.lastCount'))}</div>
            ${last
              ? `<div class="big tnum ${lastVar !== 0 ? 'bad' : ''}">${fmtSigned(lastVar)}</div>
                 <div class="sub2">${lastIssues ? UI.esc(I18N.plural('dash.concerned', lastIssues)) : UI.esc(t('dash.cleanLast'))}</div>`
              : `<div class="big tnum faint">—</div><div class="sub2">${UI.esc(t('dash.noCountYet'))}</div>`}
          </div>
        </div>

        <div class="sec"><div class="micro">${UI.esc(t('dash.lowstock'))}</div><div class="micro tnum">${lowTotal || ''}</div></div>
        ${lowTotal ? `<div class="feed dash-low">${lowAll.map(({ it, stock }) => `
          <button class="row" data-item="${it.id}">
            <span class="row__art">${UI.art(it)}</span>
            <span class="row__body">
              <span class="row__t">${UI.esc(it.name)}</span>
              <span class="row__s">${UI.esc(UI.stockText(it))} · ${UI.esc(t('dash.thresh', { n: UI.fmtQty(it.threshold) }))}</span>
            </span>
            <span class="row__end"><span class="num dash-lown">${UI.esc(it.bottleMl ? String(Math.floor(stock + 1e-6)) : UI.fmtQty(stock))}</span></span>
          </button>`).join('')}</div>`
          : `<div class="sub2">${UI.esc(t('dash.lowNone'))}</div>`}

        <div class="sec"><div class="micro">${UI.esc(t('dash.feed'))}</div></div>
        <div class="feed">
          ${feed.length ? feed.map(s => {
            const it = Store.item(s.itemId);
            const cat = it && Store.cat(it.catId);
            return `<div class="row" style="${s.voidedAt ? 'opacity:.45' : ''}">
              <span class="feedtick" style="background:${cat ? cat.hex : 'var(--t3)'}"></span>
              <span class="row__t" style="flex:none;${s.voidedAt ? 'text-decoration:line-through' : ''}">${UI.esc(it ? it.name : '?')}</span>
              <span class="qtybubble">×${UI.esc(UI.fmtQty(s.qty))}</span>
              <div class="row__end">
                <div class="tnum" style="font-size:12px;color:var(--t3)">${UI.esc(UI.fmtTime(s.at))}</div>
                <div style="font-size:11px;color:var(--t3);margin-top:2px">${UI.esc(s.by)}</div>
              </div>
            </div>`;
          }).join('') : `<div class="sub2">${UI.esc(t('dash.feedNone'))}</div>`}
        </div>

        <div class="actions">
          <button class="btn btn--gold" data-go="sell">${UI.esc(t('dash.qa.sale'))}</button>
          <button class="btn btn--ghost" data-go="count">${UI.esc(t('dash.qa.count'))}</button>
          <button class="btn btn--ghost" data-go="restock">${UI.esc(t('dash.qa.restock'))}</button>
          <button class="btn btn--ghost" data-go="waste">${UI.esc(t('dash.qa.waste'))}</button>
        </div>`;

      el.addEventListener('click', e => {
        const g = e.target.closest('[data-go]');
        if (g) { UI.haptic('light'); UI.go(g.dataset.go, { from: 'dashboard' }); return; }
        if (e.target.closest('[data-a=alerts]')) alertsSheet();
        if (e.target.closest('[data-item]')) UI.go('inventory');
      });
    },
  });
})();
