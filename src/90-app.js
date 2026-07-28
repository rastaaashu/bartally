/* ============ boot + "Plus" menu screen ============ */
/* 'more' retired by the 4-tab reference layout — legacy targets land on the dashboard */
UI.registerScreen({ id: 'more', render() { UI.go(Store.isOwner ? 'dashboard' : 'sell'); } });

UI.registerScreen({
  id: 'more-legacy',
  render(el) {
    if (!Store.isOwner) { UI.go(Store.state.session ? 'sell' : 'login'); return; }
    const s = Store.state.settings;
    el.innerHTML = UI.header(t('tab.more'), s.barName) + `
      <div class="card" style="padding:6px 16px">
        ${[
          ['reports', 'calendar', 'rep.title'],
          ['insights', 'chart', 'ins.title'],
          ['restock', 'truck', 'restock.title'],
          ['waste', 'spill', 'waste.title'],
          ['settings', 'gear', 'set.title'],
        ].map(([id, ic, key]) => `
          <button class="row" style="width:100%;text-align:left" data-go="${id}">
            <span class="iconbtn iconbtn--plain" style="color:var(--gold)">${UI.icon(ic)}</span>
            <span class="row__body"><span class="row__t">${UI.esc(t(key))}</span></span>
            <span style="color:var(--text-3)">${UI.icon('chevR')}</span>
          </button>`).join('')}
      </div>
      <div class="card" style="padding:6px 16px">
        <button class="row" style="width:100%;text-align:left" data-a="lock">
          <span class="iconbtn iconbtn--plain" style="color:var(--text-2)">${UI.icon('lock')}</span>
          <span class="row__body"><span class="row__t">${UI.esc(t('login.switchUser'))}</span></span>
        </button>
      </div>`;
    el.addEventListener('click', e => {
      const g = e.target.closest('[data-go]');
      if (g) return UI.go(g.dataset.go);
      if (e.target.closest('[data-a=lock]')) { Store.logout(); }
    });
  },
});

const App = {
  start() {
    I18N.lang = Store.state.settings.lang || 'fr';
    let raf = null;
    Store.on(what => {
      if (what === 'session' || what === 'all') return App.route();
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = null; UI.refresh(); });
    });
    this.route();
    this.countReminder();
    // PWA service worker (no-op where sw.js doesn't exist, e.g. artifact preview)
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  },
  route() {
    const st = Store.state;
    if (!st.settings.setupDone) return UI.go('welcome');
    if (!st.session) return UI.go('login');
    UI.go(Store.isOwner ? 'dashboard' : 'sell');
  },
  countReminder() {
    const st = Store.state;
    if (!st.settings.setupDone) return;
    const yesterday = Store.Engine.addDays(Store.todayBd(), -1);
    const has = st.counts.some(c => c.bd >= yesterday && c.status === 'closed');
    const already = st.notifs.some(n => n.type === 'reminder' && n.bd === Store.todayBd());
    if (!has && !already && new Date().getHours() >= 11) {
      Store.notify('reminder', { date: UI.fmtDate(yesterday) });
    }
  },
};
window.addEventListener('DOMContentLoaded', () => App.start());
