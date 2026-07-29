/* ============ BarTally screens: 'welcome' (first-run + setup wizard) & 'login' (daily unlock) ============ */
(() => {
  'use strict';

  /* ---------- i18n additions ---------- */
  I18N.extend({
    fr: {
      'wiz.heroIntro': 'Le stock compté chaque soir, les ventes suivies en direct, les écarts repérés avant qu’ils ne coûtent cher.',
      'wiz.stepOf': 'Étape {n} sur {total}',
      'wiz.demoLoading': 'Préparation de la démonstration…',
      'wiz.ready': 'Tout est prêt',
      'wiz.readySub': 'Un dernier coup d’œil et c’est parti.',
      'wiz.sumTeam_one': '{n} membre d’équipe',
      'wiz.sumTeam_many': '{n} membres d’équipe',
      'wiz.sumStock_one': '{n} article renseigné',
      'wiz.sumStock_many': '{n} articles renseignés',
      'wiz.teamEmpty': 'Encore personne — ajoutez un prénom ci-dessous, ou passez cette étape.',
      'login.forgotBackup': 'Télécharger une sauvegarde d’abord',
      'login.forgotType': 'Tapez le nom du bar pour confirmer',
    },
    en: {
      'wiz.heroIntro': 'Stock counted every night, sales tracked live, discrepancies caught before they get expensive.',
      'wiz.stepOf': 'Step {n} of {total}',
      'wiz.demoLoading': 'Setting up the demo…',
      'wiz.ready': 'All set',
      'wiz.readySub': 'One last look and you’re off.',
      'wiz.sumTeam_one': '{n} team member',
      'wiz.sumTeam_many': '{n} team members',
      'wiz.sumStock_one': '{n} item filled in',
      'wiz.sumStock_many': '{n} items filled in',
      'wiz.teamEmpty': 'No one yet — add a first name below, or skip this step.',
      'login.forgotBackup': 'Download a backup first',
      'login.forgotType': 'Type the bar name to confirm',
    },
  });

  /* ---------- scoped styles (reference patterns only, 4pt grid, radius 10/12/22) ---------- */
  document.head.appendChild(UI.el(`<style>
  [data-screen=welcome] .topbar,[data-screen=login] .topbar{display:flex;justify-content:space-between;align-items:center;min-height:26px}
  [data-screen=welcome] .wiz-top{padding-right:88px}
  [data-screen=welcome] .h1,[data-screen=login] .h1{font:600 28px/1.2 var(--f-display);letter-spacing:-.01em;margin-top:8px}
  [data-screen=welcome] .stepof{font-variant-numeric:tabular-nums}
  [data-screen=welcome] .fade{animation:lgw-fade .25s ease-out}
  [data-screen=welcome] .hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px}
  [data-screen=welcome] .hero .h1{margin-top:8px}
  [data-screen=welcome] .hero .sub2{max-width:300px;line-height:1.6}
  [data-screen=welcome] .wiz{flex:1;display:flex;flex-direction:column}
  [data-screen=welcome] .pad,[data-screen=login] .pad{width:100%;max-width:320px;margin:24px auto 0;display:flex;flex-direction:column}
  [data-screen=welcome] .pad .micro,[data-screen=login] .pad .micro{text-align:center}
  [data-screen=welcome] .perr,[data-screen=login] .perr{min-height:16px;text-align:center;font-size:12px;font-weight:500;color:var(--bad);opacity:0;transition:opacity .15s}
  [data-screen=welcome] .perr.is-err,[data-screen=login] .perr.is-err{opacity:1}
  [data-screen=welcome] .qin{width:86px;min-height:44px;padding:0 12px;text-align:right;flex:none;border-radius:var(--r-ctl);border:1px solid var(--hair);background:var(--surface2);color:var(--t1);font-size:14px}
  [data-screen=welcome] .qin:focus{border-color:rgba(232,177,78,.45)}
  [data-screen=welcome] .qin::placeholder{color:var(--t3)}
  [data-screen=welcome] .addrow{display:flex;gap:8px;margin-top:16px}
  [data-screen=welcome] .addrow input{flex:1;min-width:0;min-height:44px;padding:10px 14px;border-radius:var(--r-ctl);border:1px solid var(--hair);background:var(--surface2);color:var(--t1);font-size:14px}
  [data-screen=welcome] .addrow input:focus{border-color:rgba(232,177,78,.45)}
  [data-screen=welcome] .addrow .btn{height:44px;min-height:44px;flex:none}
  [data-screen=welcome] .sumrow{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;border-bottom:1px solid var(--hair);font-size:14px}
  [data-screen=welcome] .sumrow:last-child{border-bottom:0}
  [data-screen=welcome] .sumrow span{color:var(--t3)}
  [data-screen=welcome] .sumrow b{font-weight:600;text-align:right}
  [data-screen=login] button.row{width:100%;text-align:left}
  @keyframes lgw-fade{from{opacity:0}}
  </style>`));

  /* ---------- helpers ---------- */
  const esc = UI.esc;
  /** 2-letter initials: first letters of two words, else first 2 chars */
  const initials = name => {
    const w = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    return (w.length >= 2 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
  };
  const dotsHtml = (n, filled) => `<div class="pinDots" data-dots>${Array.from({ length: n }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('')}</div>`;

  /* ================================================================
     WELCOME — hero + in-screen 5-step setup wizard
     (module-level state survives store-driven re-renders) */
  const TOTAL = 5;
  const W = {};
  function resetW() {
    Object.assign(W, {
      step: 0, barName: '', ownerName: '',
      pinPhase: 'set', pin1: '', pinEntry: '', pinErr: '', pin: '',
      empName: '', employees: [], items: null, opening: {}, busy: false,
    });
  }
  resetW();

  function collectOpening() {
    const out = {};
    for (const it of (W.items || [])) {
      const raw = String(W.opening[it.id] ?? '').trim();
      if (!raw) continue; // untouched field = item not served → absent from map
      let v = parseFloat(raw.replace(',', '.'));
      if (!isFinite(v) || v < 0) v = 0;
      out[it.id] = it.allowDecimal ? Math.round(v * 100) / 100 : Math.round(v);
    }
    return out;
  }

  /* FR/EN switch, visible before login so anyone can flip the language */
  function langToggle() {
    return `<div class="lang-tgl" role="group" aria-label="Langue / Language">
      <button type="button" data-lang="fr" class="${I18N.lang === 'fr' ? 'is-on' : ''}">FR</button>
      <button type="button" data-lang="en" class="${I18N.lang === 'en' ? 'is-on' : ''}">EN</button>
    </div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.lang-tgl [data-lang]');
    if (!b) return;
    UI.haptic('light');
    Store.setSettings({ lang: b.dataset.lang });
    UI.refresh();
  });

  function paintWelcome(el) {
    el.innerHTML = '';
    el.insertAdjacentHTML('afterbegin', langToggle());
    const view = UI.el('<div class="grow" style="display:flex;flex-direction:column"></div>');
    el.appendChild(view);
    if (W.step === 0) paintHero(view, el);
    else paintStep(view, el);
  }

  /* ---- hero (first launch): typographic centered column, simple fade ---- */
  function paintHero(view, el) {
    view.innerHTML = `
      <div class="hero fade">
        ${UI.logoMark(30)}
        <div class="h1">BarTally</div>
        <div class="micro">${esc(t('app.tagline'))}</div>
        <p class="sub2">${esc(t('wiz.heroIntro'))}</p>
      </div>
      <div class="bottomstack">
        <button class="btn btn--gold" data-a="start">${esc(t('wiz.startReal'))}</button>
        <button class="btn btn--ghost" data-a="demo">${esc(t('wiz.demo'))}</button>
        <p class="sub2" style="text-align:center;line-height:1.5">${esc(t('wiz.demoHint'))}</p>
      </div>`;
    view.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'start') { UI.haptic('light'); W.step = 1; paintWelcome(el); return; }
      if (b.dataset.a === 'demo') {
        if (W.busy) return;
        W.busy = true;
        b.disabled = true;
        b.textContent = t('wiz.demoLoading');
        try {
          await Store.setupDemo(); // emits 'all' → App.route() takes over
          UI.haptic('success');
          resetW();
        } catch (err) {
          W.busy = false;
          UI.toast(t('g.error'), { type: 'danger' });
          paintWelcome(el);
        }
      }
    });
  }

  /* ---- wizard chrome: back + micro step counter (no decorative dots) ---- */
  function wizTop() {
    return `<div class="topbar wiz-top">
      <button class="back" data-a="back">‹ ${esc(t('g.back'))}</button>
      <div class="micro stepof">${esc(t('wiz.stepOf', { n: W.step, total: TOTAL }))}</div>
    </div>`;
  }

  function paintStep(view, el) {
    let body = '';
    if (W.step === 1) {
      body = `
        <div class="h1">${esc(t('wiz.welcome'))}</div>
        <p class="sub2">${esc(t('wiz.intro'))}</p>
        <div class="mt6">
          <div class="field"><label for="wz-bar">${esc(t('wiz.barName'))}</label>
            <input id="wz-bar" type="text" data-f="barName" autocomplete="off" enterkeyhint="next" placeholder="${esc(t('wiz.barNamePh'))}" value="${esc(W.barName)}"></div>
          <div class="field"><label for="wz-owner">${esc(t('wiz.ownerName'))}</label>
            <input id="wz-owner" type="text" data-f="ownerName" autocomplete="off" enterkeyhint="next" value="${esc(W.ownerName)}"></div>
        </div>
        <div class="bottomstack"><button class="btn btn--gold" data-a="next" ${W.barName.trim() ? '' : 'disabled'}>${esc(t('g.next'))}</button></div>`;
    } else if (W.step === 2) {
      body = `
        <div class="pad">
          <div class="micro">${esc(t(W.pinPhase === 'set' ? 'wiz.ownerPinSet' : 'wiz.ownerPinConfirm'))}</div>
          ${dotsHtml(4, W.pinEntry.length)}
          <div class="perr${W.pinErr ? ' is-err' : ''}" data-err aria-live="polite">${esc(W.pinErr)}</div>
          <div data-np></div>
        </div>`;
    } else if (W.step === 3) {
      const list = W.employees.length
        ? W.employees.map((n, i) => `
            <div class="row">
              <span class="row__art tile t40"><span class="mono" style="color:var(--t2)">${esc(initials(n))}</span></span>
              <span class="row__body"><span class="row__t">${esc(n)}</span></span>
              <button class="iconbtn iconbtn--plain" data-rm="${i}" aria-label="${esc(t('g.delete'))}">${UI.icon('x')}</button>
            </div>`).join('')
        : `<div class="sub2" style="line-height:1.6">${esc(t('wiz.teamEmpty'))}</div>`;
      body = `
        <div class="h1">${esc(t('wiz.staff'))}</div>
        <p class="sub2">${esc(t('wiz.staffHint'))}</p>
        <div class="mt4">${list}</div>
        <div class="addrow">
          <input type="text" data-f="empName" autocomplete="off" enterkeyhint="done" placeholder="${esc(t('wiz.staffNamePh'))}" value="${esc(W.empName)}">
          <button class="btn btn--ghost" data-a="addEmp">${esc(t('wiz.staffAdd'))}</button>
        </div>
        <div class="bottomstack"><button class="btn btn--gold" data-a="next">${esc(t('g.next'))}</button></div>`;
    } else if (W.step === 4) {
      W.items = W.items || Store.SEED.build();
      const cats = [...Store.SEED.categories].sort((a, b) => a.sort - b.sort);
      const groups = cats.map(c => {
        const its = W.items.filter(i => i.catId === c.id);
        if (!its.length) return '';
        return `
          <div class="sec"><div class="micro">${esc(I18N.lang === 'en' ? c.nameEn : c.nameFr)}</div></div>
          ${its.map(it => `
            <div class="row">
              <span class="row__art tile t40">${UI.art(it)}</span>
              <span class="row__body"><span class="row__t">${esc(it.name)}</span><span class="row__s">${esc(t('u.' + it.unit))}</span></span>
              <input class="qin num" type="text" inputmode="${it.allowDecimal ? 'decimal' : 'numeric'}" placeholder="0" data-item="${it.id}" value="${esc(W.opening[it.id] ?? '')}" aria-label="${esc(it.name)}">
            </div>`).join('')}`;
      }).join('');
      body = `
        <div class="h1">${esc(t('wiz.stock'))}</div>
        <p class="sub2">${esc(t('wiz.stockHint'))}</p>
        ${groups}
        <div class="bottomstack"><button class="btn btn--gold" data-a="next">${esc(t('g.next'))}</button></div>`;
    } else {
      W.items = W.items || Store.SEED.build();
      const opening = collectOpening();
      const filled = W.items.filter(it => opening[it.id] > 0).length;
      const rows = [
        [t('wiz.barName'), W.barName.trim()],
        [t('wiz.ownerName'), W.ownerName.trim() || t('g.owner')],
        [t('wiz.staff'), I18N.plural('wiz.sumTeam', W.employees.length)],
        [t('wiz.stock'), I18N.plural('wiz.sumStock', filled)],
      ];
      body = `
        <div class="h1">${esc(t('wiz.ready'))}</div>
        <p class="sub2">${esc(t('wiz.readySub'))}</p>
        <div class="mt4">${rows.map(([l, v]) => `<div class="sumrow"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>
        <div class="bottomstack"><button class="btn btn--gold" data-a="finish">${esc(t('wiz.finish'))}</button></div>`;
    }

    view.innerHTML = wizTop() + `<div class="wiz fade" data-step="${W.step}">${body}</div>`;
    if (W.step === 2) UI.numpad(view.querySelector('[data-np]'), { decimal: false, onKey: k => onWizPin(k, view, el) });

    view.addEventListener('click', e => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { W.employees.splice(+rm.dataset.rm, 1); UI.haptic('light'); paintWelcome(el); return; }
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'back') wizBack(el);
      else if (a === 'next') wizNext(el);
      else if (a === 'addEmp') addEmp(view, el);
      else if (a === 'finish') finishSetup(b, el);
    });
    view.addEventListener('input', e => {
      const f = e.target.dataset.f;
      if (f) {
        W[f] = e.target.value;
        if (f === 'barName') { const nb = view.querySelector('[data-a=next]'); if (nb) nb.disabled = !W.barName.trim(); }
      }
      const id = e.target.dataset.item;
      if (id) {
        const itm = (W.items || []).find(i => i.id === id);
        const clean = e.target.value.replace(itm && !itm.allowDecimal ? /[^\d]/g : /[^\d.,]/g, '');
        if (clean !== e.target.value) e.target.value = clean;
        W.opening[id] = clean;
      }
    });
    view.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const f = e.target.dataset.f;
      if ((f === 'barName' || f === 'ownerName') && W.barName.trim()) wizNext(el);
      else if (f === 'empName') addEmp(view, el);
      else if (e.target.dataset.item) e.target.blur();
    });
  }

  function wizNext(el) {
    UI.haptic('light');
    if (W.step === 1) {
      if (!W.barName.trim()) return;
      W.step = 2; W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = ''; W.pinErr = '';
    } else if (W.step === 3) W.step = 4;
    else if (W.step === 4) W.step = 5;
    paintWelcome(el);
  }

  function wizBack(el) {
    UI.haptic('light');
    if (W.step === 2) {
      if (W.pinPhase === 'confirm') W.pinPhase = 'set';
      else W.step = 1;
      W.pin1 = ''; W.pinEntry = ''; W.pinErr = '';
    } else if (W.step > 0) {
      W.step -= 1;
      if (W.step === 2) { W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = ''; W.pinErr = ''; }
    }
    paintWelcome(el);
  }

  function onWizPin(k, view, el) {
    if (W.busy) return;
    if (k === 'del') W.pinEntry = W.pinEntry.slice(0, -1);
    else if (/^\d$/.test(k) && W.pinEntry.length < 4) W.pinEntry += k;
    else return;
    if (W.pinErr) {
      W.pinErr = '';
      const er = view.querySelector('[data-err]');
      if (er) { er.classList.remove('is-err'); er.textContent = ''; }
    }
    const dots = view.querySelector('[data-dots]');
    if (dots) dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < W.pinEntry.length));
    if (W.pinEntry.length < 4) return;
    W.busy = true;
    setTimeout(() => {
      if (W.pinPhase === 'set') {
        W.busy = false;
        W.pin1 = W.pinEntry; W.pinPhase = 'confirm'; W.pinEntry = '';
        paintWelcome(el);
      } else if (W.pinEntry === W.pin1) {
        W.busy = false;
        W.pin = W.pinEntry;
        UI.haptic('success');
        W.step = 3;
        paintWelcome(el);
      } else {
        UI.haptic('warn');
        W.pinErr = t('wiz.pinMismatch');
        if (dots && dots.isConnected) {
          dots.classList.add('shake');
          const er = view.querySelector('[data-err]');
          if (er) { er.textContent = W.pinErr; er.classList.add('is-err'); }
        }
        setTimeout(() => {
          W.busy = false;
          W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = '';
          paintWelcome(el);
        }, 650);
      }
    }, 160);
  }

  function addEmp(view, el) {
    const inp = view.querySelector('[data-f=empName]');
    const name = (inp ? inp.value : W.empName).trim();
    if (!name) { if (inp) inp.focus(); return; }
    W.employees.push(name);
    W.empName = '';
    UI.haptic('light');
    paintWelcome(el);
    const ninp = el.querySelector('[data-f=empName]');
    if (ninp) ninp.focus();
  }

  async function finishSetup(btn, el) {
    if (W.busy) return;
    if (!W.pin || W.pin.length !== 4) { // safety net: PIN somehow missing → back to PIN step
      W.step = 2; W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = ''; W.pinErr = '';
      paintWelcome(el);
      return;
    }
    W.busy = true;
    btn.disabled = true;
    btn.textContent = t('g.loading');
    try {
      W.items = W.items || Store.SEED.build();
      await Store.setupReal({
        barName: W.barName.trim(),
        ownerName: W.ownerName.trim(),
        pin: W.pin,
        employees: W.employees.map(n => n.trim()).filter(Boolean),
        opening: collectOpening(),
      }); // emits 'all' → App.route() takes over
      UI.haptic('success');
      UI.toast(t('wiz.openingSaved'), { type: 'ok' });
      resetW();
    } catch (err) {
      W.busy = false;
      UI.toast(t('g.error'), { type: 'danger' });
      paintWelcome(el);
    }
  }

  UI.registerScreen({ id: 'welcome', bare: true, render(el) { paintWelcome(el); } });

  /* ================================================================
     LOGIN — daily unlock: user rows → PIN pad */
  const L = { view: 'grid', target: null, pin: '', busy: false };
  function resetL() { L.view = 'grid'; L.target = null; L.pin = ''; L.busy = false; }

  function paintLogin(el) {
    el.innerHTML = '';
    el.insertAdjacentHTML('afterbegin', langToggle());
    if (L.view === 'pin' && L.target && L.target.type === 'emp') {
      const emp = Store.state.employees.find(x => x.id === L.target.id && x.active);
      if (!emp) resetL(); // employee deactivated meanwhile → back to grid
    }
    const view = UI.el('<div class="grow" style="display:flex;flex-direction:column"></div>');
    el.appendChild(view);
    if (L.view === 'grid') paintUserGrid(view, el);
    else paintPinPad(view, el);
  }

  /* initials tile: standard t40 tile, monogram brass for owner / t2 for staff — no new art */
  const userArt = (name, owner) =>
    `<span class="row__art tile t40"><span class="mono" style="color:${owner ? 'var(--brass)' : 'var(--t2)'}">${esc(initials(name))}</span></span>`;

  function paintUserGrid(view, el) {
    const s = Store.state.settings;
    const emps = Store.state.employees.filter(e => e.active);
    const ownerName = s.ownerName || t('g.owner');
    view.innerHTML = `
      <div class="topbar">${UI.logoMark(26)}</div>
      <div class="h1">${esc(s.barName || 'BarTally')}</div>
      <div class="sub2">${esc(t('login.subtitle'))}</div>
      <div class="mt4">
        <button class="row" data-owner>
          ${userArt(ownerName, true)}
          <span class="row__body"><span class="row__t">${esc(ownerName)}</span><span class="row__s">${esc(t('g.owner'))}</span></span>
          <span class="chev">›</span>
        </button>
        ${emps.map(e2 => `
          <button class="row" data-emp="${esc(e2.id)}">
            ${userArt(e2.name, false)}
            <span class="row__body"><span class="row__t">${esc(e2.name)}</span></span>
            <span class="chev">›</span>
          </button>`).join('')}
      </div>
      ${emps.length ? '' : `<div class="sub2 mt2">${esc(t('login.noStaff'))}</div>`}
      <div class="grow"></div>
      <button class="textbtn" data-a="demo2">${esc(t('login.demoBtn'))}</button>`;
    view.addEventListener('click', async e => {
      if (e.target.closest('[data-a=demo2]')) {
        if (await UI.confirm(t('login.demoWarn'), { danger: true, yes: t('login.demoBtn') })) Store.setupDemo();
        return;
      }
      if (e.target.closest('[data-owner]')) {
        UI.haptic('light');
        L.view = 'pin'; L.target = { type: 'owner', name: Store.state.settings.ownerName || t('g.owner') }; L.pin = ''; L.busy = false;
        paintLogin(el);
        return;
      }
      const eb = e.target.closest('[data-emp]');
      if (!eb) return;
      const emp = Store.state.employees.find(x => x.id === eb.dataset.emp && x.active);
      if (!emp) return;
      UI.haptic('light');
      if (Store.state.settings.requireStaffPin && emp.pinHash) {
        L.view = 'pin'; L.target = { type: 'emp', id: emp.id, name: emp.name }; L.pin = ''; L.busy = false;
        paintLogin(el);
        return;
      }
      if (Store.state.settings.requireStaffPin && !emp.pinHash) {
        UI.toast(t('login.pinNeeded', { name: emp.name }), { type: 'danger' });
        return;
      }
      if (L.busy) return;
      L.busy = true;
      const ok = await Store.loginEmployee(emp.id); // emits 'session' → App.route()
      if (ok) { UI.haptic('success'); resetL(); }
      else { L.busy = false; UI.toast(t('g.error'), { type: 'danger' }); }
    });
  }

  function paintPinPad(view, el) {
    const isOwner = L.target.type === 'owner';
    const nDots = isOwner ? 4 : Math.min(6, Math.max(4, L.pin.length));
    view.innerHTML = `
      <div class="topbar"><button class="back" data-a="back">‹ ${esc(t('g.back'))}</button></div>
      <div class="pad">
        <div class="micro">${esc(isOwner ? t('login.ownerPin') : t('login.staffPin', { name: L.target.name }))}</div>
        ${dotsHtml(nDots, L.pin.length)}
        <div class="perr" data-err aria-live="polite"></div>
        ${isOwner && Store.state.settings.demoMode ? `<div class="sub2" style="text-align:center">${esc(t('login.demoPin'))}</div>` : ''}
        <div data-np></div>
        ${isOwner ? '' : `<button class="btn btn--gold btn--full mt3" data-a="pinok" ${L.pin.length >= 4 ? '' : 'disabled'}>${esc(t('g.confirm'))}</button>`}
        ${isOwner ? `<button class="textbtn mt3" data-a="forgot">${esc(t('login.forgot'))}</button>` : ''}
      </div>`;
    UI.numpad(view.querySelector('[data-np]'), { decimal: false, onKey: k => onLoginKey(k, view, el) });
    view.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'back') { UI.haptic('light'); resetL(); paintLogin(el); }
      else if (b.dataset.a === 'pinok') submitPin(view, el);
      else if (b.dataset.a === 'forgot') openForgotSheet();
    });
  }

  /* forgot-PIN: guarded erase sheet — backup offer + type-the-bar-name confirmation */
  function openForgotSheet() {
    const normName = s => String(s || '').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').trim().toLowerCase();
    const c = UI.el(`<div data-screen="login">
      <div class="sheetname" style="text-align:center">${esc(t('login.forgot'))}</div>
      <p class="sub2" style="text-align:center;line-height:1.6">${esc(t('login.forgotHint'))}</p>
      <button class="btn btn--gold btn--full mt4" type="button" data-a="fgdl">${esc(t('login.forgotBackup'))}</button>
      <div class="field" style="margin-top:16px"><label for="fg-bar">${esc(t('login.forgotType'))}</label>
        <input id="fg-bar" type="text" data-f="fgbar" autocomplete="off" placeholder="${esc(Store.state.settings.barName || '')}"></div>
      <button class="btn btn--danger btn--full" type="button" data-a="fgerase" disabled>${esc(t('set.reset'))}</button>
    </div>`);
    UI.sheet(c);
    const inp = c.querySelector('[data-f=fgbar]');
    const eraseBtn = c.querySelector('[data-a=fgerase]');
    inp.addEventListener('input', () => {
      eraseBtn.disabled = normName(inp.value) !== normName(Store.state.settings.barName);
    });
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'fgdl') {
        UI.haptic('light');
        UI.download('bartally-backup.json', Store.exportJSON(), 'application/json');
      } else if (b.dataset.a === 'fgerase') {
        if (normName(inp.value) !== normName(Store.state.settings.barName)) return;
        UI.haptic('warn');
        Store.resetAll();
      }
    });
  }

  function refreshLoginDots(view) {
    const isOwner = L.target && L.target.type === 'owner';
    const nDots = isOwner ? 4 : Math.min(6, Math.max(4, L.pin.length));
    const dots = view.querySelector('[data-dots]');
    if (dots) dots.outerHTML = dotsHtml(nDots, L.pin.length);
  }

  function onLoginKey(k, view, el) {
    if (L.busy || !L.target) return;
    const isOwner = L.target.type === 'owner';
    const max = isOwner ? 4 : 6;
    if (k === 'del') L.pin = L.pin.slice(0, -1);
    else if (/^\d$/.test(k) && L.pin.length < max) L.pin += k;
    else return;
    const er = view.querySelector('[data-err]');
    if (er && er.classList.contains('is-err')) { er.classList.remove('is-err'); er.textContent = ''; }
    refreshLoginDots(view);
    const okBtn = view.querySelector('[data-a=pinok]');
    if (okBtn) okBtn.disabled = L.pin.length < 4;
    if ((isOwner && L.pin.length === 4) || (!isOwner && L.pin.length === 6)) submitPin(view, el);
  }

  async function submitPin(view, el) {
    if (L.busy || !L.target || L.pin.length < 4) return;
    L.busy = true;
    const okBtn = view.querySelector('[data-a=pinok]');
    if (okBtn) okBtn.disabled = true;
    let ok = false;
    try {
      ok = L.target.type === 'owner'
        ? await Store.loginOwner(L.pin)
        : await Store.loginEmployee(L.target.id, L.pin);
    } catch (e) { ok = false; }
    if (ok) { UI.haptic('success'); resetL(); return; } // 'session' event routes to the app
    L.busy = false;
    UI.haptic('warn');
    if (!view.isConnected) return;
    const dots = view.querySelector('[data-dots]');
    if (dots) dots.classList.add('shake');
    const er = view.querySelector('[data-err]');
    if (er) { er.textContent = t('login.pinWrong'); er.classList.add('is-err'); }
    setTimeout(() => {
      L.pin = '';
      if (!view.isConnected) return;
      refreshLoginDots(view);
      const ob = view.querySelector('[data-a=pinok]');
      if (ob) ob.disabled = true;
    }, 520);
  }

  UI.registerScreen({ id: 'login', bare: true, render(el) { paintLogin(el); } });
})();
