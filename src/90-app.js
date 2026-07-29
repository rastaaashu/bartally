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
    if (typeof Sync !== 'undefined') Sync.start();
    // PWA service worker (no-op where sw.js doesn't exist, e.g. artifact preview)
    // localhost counts as a secure context, so the SW (and therefore phone
    // notifications) can be exercised in testing exactly as in production
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    // owner's first login on this phone: offer low-stock alerts (needs a user gesture)
    Store.on(what => {
      if (what !== 'session' || !Store.isOwner) return;
      if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
      try { if (sessionStorage.getItem('kalinka.notifAsked')) return; sessionStorage.setItem('kalinka.notifAsked', '1'); } catch (e) {}
      setTimeout(() => {
        const c = UI.el(`<div>
          <div class="micro" style="margin-bottom:8px">${UI.esc(t('ntf.enableTitle'))}</div>
          <div class="sub2" style="margin:0 0 16px">${UI.esc(t('ntf.enableSub'))}</div>
          <button class="btn btn--gold btn--full" data-a="on">${UI.esc(t('ntf.enableBtn'))}</button>
          <button class="textbtn btn--full" data-a="later" style="width:100%;margin-top:6px">${UI.esc(t('ntf.later'))}</button>
        </div>`);
        const sh = UI.sheet(c);
        c.addEventListener('click', async e => {
          if (e.target.closest('[data-a=on]')) {
            const p = await Notification.requestPermission();
            if (p === 'granted') {
              Store.setSettings({ notifGranted: true });
              if (typeof Sync !== 'undefined') Sync.registerPush();
              UI.toast(t('ntf.enabled'), { type: 'ok' });
            }
            sh.close();
          } else if (e.target.closest('[data-a=later]')) sh.close();
        });
      }, 700);
    });
    // the fixed tab bar must never ride on top of the software keyboard
    if (window.visualViewport) {
      const vv = window.visualViewport;
      vv.addEventListener('resize', () => {
        document.documentElement.classList.toggle('kb-open', vv.height < window.innerHeight * 0.72);
      });
    }
  },
  route() {
    const st = Store.state;
    if (!st.settings.setupDone) {
      // single-site production: no wizard — seed the bar and land on login
      if (!App._booting) { App._booting = true; Store.setupProd().finally(() => { App._booting = false; }); }
      return;
    }
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
